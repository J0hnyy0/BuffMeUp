const db = firebase.firestore();
const CURRENCY_SYMBOL = '₱';

let selectedSize = 'M';
let selectedColor = 'Black';
let currentImageIndex = 0;
let isProfileDropdownOpen = false;
let pendingCartItem = null;
let productImages = [];
let currentProduct = null;

// Load product data from Firestore OR localStorage
window.addEventListener('DOMContentLoaded', async function () {
    updateAuthState();
    
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    try {
        console.log('Attempting to fetch product...');
        
        let product = null;

        // First try localStorage (from collection page click)
        const localProduct = JSON.parse(localStorage.getItem('selectedProduct') || '{}');
        if (localProduct && localProduct.id) {
            product = localProduct;
            console.log('Product loaded from localStorage:', product);
        } else if (productId) {
            // Fallback: try Firestore only if localStorage is empty
            console.log('Fetching product from Firestore:', productId);
            const doc = await db.collection('products').doc(productId).get();
            if (doc.exists) {
                product = { id: doc.id, ...doc.data() };
                console.log('Product loaded from Firestore:', product);
            }
        }

        // If still no product, show error
        if (!product) {
            console.error('Product not found in Firestore or localStorage');
            displayErrorMessage();
            return;
        }

        currentProduct = product;
        displayProductData(product);

        // Clear localStorage after successful load to prevent stale data
        localStorage.removeItem('selectedProduct');

    } catch (error) {
        console.error('Error fetching product:', error);
        displayErrorMessage(error);
    }

    // Initialize cart and event listeners
    updateCartCount();
    updateCartSidebar();
    attachEventListeners();
});

function displayProductData(product) {
    // Set product title
    const titleElement = document.querySelector('.product-title');
    if (titleElement) titleElement.textContent = product.name || 'Unknown Product';

    // Set product price
    const priceElement = document.querySelector('.product-price');
    if (priceElement) {
        const price = typeof product.price === 'number' ? product.price : 0;
        priceElement.textContent = `${CURRENCY_SYMBOL}${price.toFixed(2)}`;
    }

    // Set product description
    const descriptionElement = document.querySelector('.product-description');
    if (descriptionElement) descriptionElement.textContent = product.description || 'No description available';

    // Set images
    productImages = Array.isArray(product.images) && product.images.length > 0 
        ? product.images 
        : [product.image || 'default-product.png'];
    
    const mainImage = document.getElementById('mainImage');
    if (mainImage) mainImage.src = productImages[0];

    // Render thumbnails & indicators dynamically
    renderImageControls();

    // Update page title
    document.title = `${product.name || 'Product'} - JAJ Clothing`;
}

function renderImageControls() {
    const thumbnailsContainer = document.querySelector('.thumbnail-images');
    const indicatorsContainer = document.querySelector('.image-indicators');
    
    if (thumbnailsContainer && indicatorsContainer) {
        thumbnailsContainer.innerHTML = '';
        indicatorsContainer.innerHTML = '';

        productImages.forEach((img, i) => {
            // Thumbnail
            const thumbDiv = document.createElement('div');
            thumbDiv.className = 'thumbnail' + (i === 0 ? ' active' : '');
            const thumbImg = document.createElement('img');
            thumbImg.src = img;
            thumbImg.alt = `Product Image ${i + 1}`;
            thumbDiv.appendChild(thumbImg);
            thumbDiv.onclick = () => changeImage(img, i);
            thumbnailsContainer.appendChild(thumbDiv);

            // Indicator
            const indicator = document.createElement('div');
            indicator.className = 'indicator' + (i === 0 ? ' active' : '');
            indicator.onclick = () => changeImageByIndicator(i);
            indicatorsContainer.appendChild(indicator);
        });
    }
}

function attachEventListeners() {
    const buyNowBtn = document.getElementById('buyNowButton');
    const checkoutBtn = document.querySelector('.checkout-btn');
    
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => buyNow());
    }
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => proceedToCheckout());
    }

    // Create cart popup if it doesn't exist
    if (!document.getElementById('cartPopup')) {
        createCartPopup();
    }
}

function createCartPopup() {
    const popup = document.createElement('div');
    popup.id = 'cartPopup';
    popup.className = 'modal';
    popup.style.display = 'none';
    popup.innerHTML = `
        <div class="modal-content">
            <p id="cartPopupMessage">Add item to cart?</p>
            <button onclick="confirmAddToCart()" class="confirm-btn">Yes</button>
            <button onclick="closeCartPopup()" class="cancel-btn">Cancel</button>
        </div>
    `;
    document.body.appendChild(popup);
    
    popup.addEventListener('click', function (e) {
        if (e.target === this) {
            closeCartPopup();
        }
    });
}

function displayErrorMessage(error = null) {
    const container = document.querySelector('.product-detail .container') || document.body;
    const div = document.createElement('div');
    div.className = 'error-message';
    div.style.cssText = `
        text-align: center; padding: 40px; background: #f8f9fa;
        border-radius: 8px; margin: 20px; color: #dc3545;
    `;
    div.innerHTML = `
        <h3>Unable to load product</h3>
        <p>${error ? `Error: ${error.message}` : 'There was an error loading the product details. Please try again.'}</p>
        <button onclick="window.location.href='Collection.html'" class="btn-retry"
            style="background:#007bff;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;margin-top:15px;">
            Back to Collection
        </button>
    `;
    container.appendChild(div);
}

function changeImage(src, index) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) mainImage.src = src;
    
    currentImageIndex = index;
    
    document.querySelectorAll('.thumbnail').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
    document.querySelectorAll('.indicator').forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
}

function changeImageByIndicator(index) {
    if (index >= 0 && index < productImages.length) {
        changeImage(productImages[index], index);
    }
}

function decreaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) return;
    
    const currentValue = parseInt(quantityInput.value);
    if (currentValue > 1) {
        quantityInput.value = currentValue - 1;
    }
}

function increaseQuantity() {
    const quantityInput = document.getElementById('quantity');
    if (!quantityInput) return;
    
    const currentValue = parseInt(quantityInput.value);
    if (currentProduct && currentProduct.stock && currentValue >= currentProduct.stock) {
        alert('Cannot add more items than available in stock.');
        return;
    }
    quantityInput.value = currentValue + 1;
}

function addToCart() {
    if (!currentProduct) {
        alert('Product data not available');
        return;
    }

    const productTitle = document.querySelector('.product-title')?.textContent || currentProduct.name;
    const priceText = document.querySelector('.product-price')?.textContent || '';
    const productPrice = parseFloat(priceText.replace(CURRENCY_SYMBOL, '').replace(',', '')) || currentProduct.price || 0;
    const quantityInput = document.getElementById('quantity');
    const quantity = quantityInput ? parseInt(quantityInput.value) : 1;

    if (quantity < 1) {
        alert('Please select a valid quantity');
        return;
    }

    // Create cart item object
    const cartItem = {
        id: currentProduct.id,
        productId: currentProduct.id,
        name: productTitle,
        price: productPrice,
        quantity: quantity,
        image: document.getElementById('mainImage')?.src || productImages[0] || 'default-product.png'
    };

    // Store pending item and show confirmation popup
    pendingCartItem = cartItem;
    const popup = document.getElementById('cartPopup');
    const message = document.getElementById('cartPopupMessage');
    
    if (popup && message) {
        message.textContent = `Add ${cartItem.name} to your cart?`;
        popup.style.display = 'flex';
    } else {
        // Fallback if popup doesn't exist
        if (confirm(`Add ${cartItem.name} to your cart?`)) {
            pendingCartItem = cartItem;
            confirmAddToCart();
        }
    }
}

function confirmAddToCart() {
    if (!pendingCartItem) return;

    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');

    const existingItemIndex = cartItems.findIndex(item =>
        item.id === pendingCartItem.id
    );

    if (existingItemIndex > -1) {
        cartItems[existingItemIndex].quantity += pendingCartItem.quantity;
    } else {
        cartItems.push(pendingCartItem);
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    updateCartCount();
    updateCartSidebar();
    closeCartPopup();
    showNotification('Item added to cart successfully!');
    pendingCartItem = null;
}

function closeCartPopup() {
    const cartPopup = document.getElementById('cartPopup');
    if (cartPopup) {
        cartPopup.style.display = 'none';
    }
    pendingCartItem = null;
}

function updateCartSidebar() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (!cartItemsContainer || !cartTotal) {
        console.warn('Cart container or total element not found');
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cartItems.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = `Total: ${CURRENCY_SYMBOL}0.00`;
        return;
    }

    cartItems.forEach((item, index) => {
        const itemPrice = typeof item.price === 'number'
            ? item.price
            : parseFloat(item.price.toString().replace(CURRENCY_SYMBOL, '').replace(',', ''));
        const itemTotal = itemPrice * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <button class="delete-cart-btn" onclick="deleteCartItem(${index})" title="Remove item">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <path d="M7 4V2H17V4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7ZM6 6V20H18V6H6ZM9 9H11V17H9V9ZM13 9H15V17H13V9Z"></path>
                    </svg>
                </button>
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${CURRENCY_SYMBOL}${itemPrice.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${index}, -1)" class="quantity-btn">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button onclick="updateQuantity(${index}, 1)" class="quantity-btn">+</button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    cartTotal.textContent = `Total: ${CURRENCY_SYMBOL}${total.toFixed(2)}`;
}

function updateQuantity(index, change) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (cartItems[index]) {
        cartItems[index].quantity += change;
        if (cartItems[index].quantity <= 0) {
            cartItems.splice(index, 1);
        }
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCartCount();
        updateCartSidebar();
    }
}

function deleteCartItem(index) {
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    cartItems.splice(index, 1);
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    updateCartCount();
    updateCartSidebar();
    showNotification('Item removed from cart');
}

function updateCartCount() {
    let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const countEl = document.getElementById('cartCount');
    if (countEl) {
        countEl.textContent = total;
        countEl.classList.toggle('show', total > 0);
    }
}

function buyNow() {
    addToCart();
    setTimeout(() => {
        if (pendingCartItem) {
            confirmAddToCart();
            setTimeout(() => proceedToCheckout(), 100);
        }
    }, 100);
}

function proceedToCheckout() {
    console.log('Proceeding to checkout');
    initiateCheckout();
}

function initiateCheckout() {
    let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (!cart.length) {
        alert('Your cart is empty. Add items first.');
        return;
    }
    openCheckoutModal(cart);
}

function openCheckoutModal(items) {
    const total = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    let modal = document.getElementById('checkoutModal');
    if (!modal) {
        modal = createCheckoutModal();
        document.body.appendChild(modal);
    }

    populateCheckoutModal(items, total);
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Store checkout data
    window.checkoutData = { items, total };
}

function createCheckoutModal() {
    const modal = document.createElement('div');
    modal.id = 'checkoutModal';
    modal.className = 'checkout-modal';
    modal.innerHTML = `
        <div class="checkout-modal-content">
            <div class="checkout-header">
                <h2>Checkout</h2>
                <button class="checkout-close-btn" onclick="closeCheckoutModal()">×</button>
            </div>
            <div class="checkout-body">
                <div class="checkout-section">
                    <h3>Order Summary</h3>
                    <div id="checkoutItems"></div>
                    <div id="checkoutTotal"></div>
                </div>
                <div class="checkout-section">
                    <h3>Customer Information</h3>
                    <form id="checkoutForm" class="checkout-form">
                        <input type="text" name="firstName" placeholder="First Name *" required>
                        <input type="text" name="lastName" placeholder="Last Name *" required>
                        <input type="email" name="email" placeholder="Email *" required>
                        <input type="tel" name="phone" placeholder="Phone *" required>
                        <input type="text" name="address" placeholder="Street Address *" required>
                        <input type="text" name="city" placeholder="City *" required>
                        <input type="text" name="province" placeholder="Province *" required>
                        <input type="text" name="zipCode" placeholder="ZIP Code *" required>
                        <label><input type="radio" name="paymentMethod" value="cod" checked> Cash on Delivery</label>
                        <label><input type="radio" name="paymentMethod" value="gcash"> GCash</label>
                    </form>
                </div>
            </div>
            <div class="checkout-footer">
                <button class="cancel-btn" onclick="closeCheckoutModal()">Cancel</button>
                <button class="place-order-btn" onclick="placeOrder()">Place Order</button>
            </div>
        </div>
    `;
    return modal;
}

function populateCheckoutModal(items, total) {
    const itemsEl = document.getElementById('checkoutItems');
    const totalEl = document.getElementById('checkoutTotal');
    
    if (!itemsEl || !totalEl) return;

    itemsEl.innerHTML = items.map(i => `
        <div class="checkout-item">
            <img src="${i.image}" alt="${i.name}">
            <div>${i.name} - Qty: ${i.quantity}</div>
            <div>${CURRENCY_SYMBOL}${(i.price * i.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    totalEl.innerHTML = `<strong>Total: ${CURRENCY_SYMBOL}${total.toFixed(2)}</strong>`;
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

async function placeOrder() {
    const form = document.getElementById('checkoutForm');
    if (!form || !form.checkValidity()) {
        if (form) form.reportValidity();
        return;
    }

    if (!window.checkoutData) {
        alert('Checkout data not available. Please try again.');
        return;
    }

    const formData = Object.fromEntries(new FormData(form).entries());
    const order = {
        id: 'ORDER-' + Date.now(),
        items: window.checkoutData.items,
        total: window.checkoutData.total,
        customer: formData,
        timestamp: new Date().toISOString(),
        status: 'pending'
    };

    try {
        // Try to save to Firestore first
        await db.collection('orders').doc(order.id).set(order);
        console.log('Order saved to Firestore');
    } catch (error) {
        console.warn('Failed to save to Firestore, saving locally:', error);
        // Fallback to localStorage
        try {
            let orders = JSON.parse(localStorage.getItem('orders') || '[]');
            orders.push(order);
            localStorage.setItem('orders', JSON.stringify(orders));
        } catch (localError) {
            console.error('Failed to save order locally:', localError);
            alert('Failed to place order. Please try again.');
            return;
        }
    }

    // Clear cart and close modal
    localStorage.removeItem('cartItems');
    updateCartCount();
    updateCartSidebar();
    closeCheckoutModal();
    showNotification(`Order ${order.id} placed successfully!`);
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('open');
        updateCartSidebar();
    }
}

function showNotification(message) {
    // Remove any existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; background: #28a745;
        color: white; padding: 15px 20px; border-radius: 5px;
        z-index: 10000; transition: opacity 0.5s; box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 500);
    }, 3000);
}

// Auth functions
function updateAuthState() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName') || 'User';

    const authButtons = document.getElementById('authButtons');
    const profileMenu = document.getElementById('profileMenu');
    const profileName = document.getElementById('profileName');
    const profileAvatar = document.getElementById('profileAvatar');

    if (isLoggedIn && userName && authButtons && profileMenu) {
        authButtons.classList.add('hide');
        profileMenu.classList.add('show');
        if (profileName) profileName.textContent = userName;
        if (profileAvatar) profileAvatar.textContent = userName.charAt(0).toUpperCase();
    } else {
        if (authButtons) authButtons.classList.remove('hide');
        if (profileMenu) profileMenu.classList.remove('show');
    }
}

function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (!dropdown) return;
    
    isProfileDropdownOpen = !isProfileDropdownOpen;
    dropdown.classList.toggle('show', isProfileDropdownOpen);
}

function showLogoutPopup() {
    const popup = document.getElementById('logoutPopup');
    if (popup) popup.style.display = 'flex';
}

function closeLogoutPopup() {
    const popup = document.getElementById('logoutPopup');
    if (popup) popup.style.display = 'none';
}

function confirmLogout() {
    closeLogoutPopup();
    logout();
}

function logout() {
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut()
            .then(() => {
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                updateAuthState();
                window.location.href = 'Register.html';
            })
            .catch((error) => {
                console.error('Logout error:', error);
                // Fallback logout
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                updateAuthState();
                window.location.href = 'Register.html';
            });
    } else {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        updateAuthState();
        window.location.href = 'Register.html';
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function (event) {
    const profileMenu = document.getElementById('profileMenu');
    const dropdown = document.getElementById('profileDropdown');
    if (profileMenu && !profileMenu.contains(event.target) && isProfileDropdownOpen) {
        dropdown?.classList.remove('show');
        isProfileDropdownOpen = false;
    }
});

// Image navigation functions
function prevImage() {
    if (productImages.length <= 1) return;
    currentImageIndex = (currentImageIndex - 1 + productImages.length) % productImages.length;
    changeImage(productImages[currentImageIndex], currentImageIndex);
}

function nextImage() {
    if (productImages.length <= 1) return;
    currentImageIndex = (currentImageIndex + 1) % productImages.length;
    changeImage(productImages[currentImageIndex], currentImageIndex);
}
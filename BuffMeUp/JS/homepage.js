// homepage.js (updated with cart sidebar and checkout functions)

// Cart functionality
function addToCart() {
    const quantity = parseInt(document.getElementById('quantity').value);
    const storedProduct = localStorage.getItem('selectedProduct');
    let productData;
    
    if (storedProduct) {
        productData = JSON.parse(storedProduct);
    } else {
        // Fallback product data if no stored product
        productData = {
            id: 'cargo-shorts',
            name: 'Cargo Shorts',
            price: 554.99, // Store as number, not string
            color: selectedColor,
            size: selectedSize,
            image: images[currentImageIndex]
        };
    }
    
    // Update product data with current selections
    productData.color = selectedColor;
    productData.size = selectedSize;
    productData.quantity = quantity;
    productData.image = images[currentImageIndex];
    
    // Ensure price is a number
    if (typeof productData.price === 'string') {
        productData.price = parseFloat(productData.price.replace('₱', '').replace(',', ''));
    }

    // Get existing cart
    let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    
    // Check if item already exists in cart (same product, color, and size)
    const existingItemIndex = cart.findIndex(item =>
        item.id === productData.id &&
        item.color === productData.color &&
        item.size === productData.size
    );
    
    if (existingItemIndex > -1) {
        // Update quantity of existing item
        cart[existingItemIndex].quantity += productData.quantity;
    } else {
        // Add new item to cart
        cart.push(productData);
    }
    
    // Save updated cart
    localStorage.setItem('cartItems', JSON.stringify(cart));
    
    // Update UI
    updateCartCount();
    updateCartSidebar();
    
    // Show cart sidebar
    document.getElementById('cartSidebar').classList.add('open');
    
    // Use auth.js showMessage function instead of alert
    if (typeof window.showMessage === 'function') {
        window.showMessage(`Added ${quantity} ${productData.name} (${selectedColor}, ${selectedSize}) to cart!`);
    } else {
        alert(`Added ${quantity} ${productData.name} (${selectedColor}, ${selectedSize}) to cart!`);
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (totalItems > 0) {
        cartCount.textContent = totalItems;
        cartCount.classList.add('show');
    } else {
        cartCount.classList.remove('show');
    }
}

function updateCartSidebar() {
    const cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartSidebar = document.getElementById('cartSidebar');

    cartItems.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        cartTotal.textContent = 'Total: ₱0.00';
        return;
    }

    cart.forEach((item, index) => {
        const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price.toString().replace('₱', '').replace(',', ''));
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
                <div class="cart-item-price">₱${itemPrice.toFixed(2)}</div>
                <div class="cart-item-options">Color: ${item.color} | Size: ${item.size}</div>
                <div class="cart-item-quantity">
                    <button onclick="updateQuantity(${index}, -1)" class="quantity-btn">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button onclick="updateQuantity(${index}, 1)" class="quantity-btn">+</button>
                </div>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    cartTotal.textContent = `Total: ₱${total.toFixed(2)}`;
}

function updateQuantity(index, change) {
    let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cart));
    updateCartCount();
    updateCartSidebar();
}

function deleteCartItem(index) {
    let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    cart.splice(index, 1);
    localStorage.setItem('cartItems', JSON.stringify(cart));
    updateCartCount();
    updateCartSidebar();
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    cartSidebar.classList.toggle('open');
}

// Update cart on page load
window.addEventListener('load', function() {
    updateCartCount();
    updateCartSidebar();
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', proceedToCheckout);
    }
});

// Slideshow functionality
document.addEventListener("DOMContentLoaded", () => {
    let currentSlide = 0;
    const slides = document.querySelectorAll(".product-slideshow .slide");
    const indicators = document.querySelectorAll(".product-slideshow .indicator");

    // safety check in case slideshow elements don’t exist
    if (slides.length === 0 || indicators.length === 0) return;

    function goToSlide(slideIndex) {
        slides[currentSlide].classList.remove("active");
        indicators[currentSlide].classList.remove("active");

        currentSlide = slideIndex;
        slides[currentSlide].classList.add("active");
        indicators[currentSlide].classList.add("active");
    }

    function nextSlide() {
        const nextIndex = (currentSlide + 1) % slides.length;
        goToSlide(nextIndex);
    }

    setInterval(nextSlide, 3000);

    // expose function globally for indicators
    window.goToSlide = goToSlide;
});

// Initialize page - Remove duplicate auth logic and use auth.js functions
document.addEventListener('DOMContentLoaded', function() {
    // Use auth.js updateAuthUI function instead of custom logic
    if (typeof window.updateAuthUI === 'function') {
        window.updateAuthUI();
    }
    
    // Hide the "Create Account" button in hero section when user is logged in
    const createAccountBtn = document.getElementById("createAccountBtn");
    const loggedInUserId = sessionStorage.getItem("loggedInUserId");
    
    if (createAccountBtn && loggedInUserId) {
        createAccountBtn.style.display = "none";
    }
});

// Proceed to checkout function (added like in product.js)
function proceedToCheckout() {
    const cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (cart.length === 0) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('Your cart is empty');
        } else {
            alert('Your cart is empty');
        }
        return;
    }
    localStorage.setItem('cartForCheckout', JSON.stringify(cart));
    window.location.href = 'checkout.html';
}

// Create checkout modal function
function createCheckoutModal() {
    const cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (cart.length === 0) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('Your cart is empty');
        } else {
            alert('Your cart is empty');
        }
        return;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.id = 'checkoutModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Proceed to Checkout</h2>
            <p>Are you ready to checkout ${cart.length} item(s)?</p>
            <div class="modal-buttons">
                <button id="confirmCheckoutBtn" class="btn">OK</button>
                <button id="cancelCheckoutBtn" class="btn btn-secondary">Cancel</button>
            </div>
        </div>
    `;

    // Append modal to body
    document.body.appendChild(modal);

    // Add event listeners for buttons
    document.getElementById('confirmCheckoutBtn').addEventListener('click', () => {
        localStorage.setItem('cartForCheckout', JSON.stringify(cart));
        document.body.removeChild(modal);
        window.location.href = 'checkout.html';
    });

    document.getElementById('cancelCheckoutBtn').addEventListener('click', () => {
        document.body.removeChild(modal);
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// New checkout functions
function initiateCheckout(action) {
    let popup = document.getElementById('checkoutPopup');
    if (!popup) {
        // Create popup dynamically if it doesn't exist
        popup = document.createElement('div');
        popup.id = 'checkoutPopup';
        popup.style.display = 'none'; // Hidden initially
        popup.style.position = 'fixed';
        popup.style.top = '0';
        popup.style.left = '0';
        popup.style.width = '100%';
        popup.style.height = '100%';
        popup.style.background = 'rgba(0,0,0,0.5)';
        popup.style.justifyContent = 'center';
        popup.style.alignItems = 'center';
        popup.style.zIndex = '1000';
        popup.innerHTML = `
            <div class="popup-content" style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                <p id="checkoutPopupMessage"></p>
                <div class="popup-buttons">
                    <button class="confirm-btn" style="margin-right: 10px;">Confirm</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
    }

    const popupMessage = document.getElementById('checkoutPopupMessage');
    let checkoutItems = [];

    if (action === 'proceedToCheckout') {
        const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        if (cartItems.length === 0) {
            alert('Your cart is empty. Please add items before proceeding to checkout.');
            return;
        }
        checkoutItems = cartItems;
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        popupMessage.textContent = `Proceed to checkout with ${totalItems} item${totalItems > 1 ? 's' : ''} in your cart?`;
    }

    // Show confirmation popup
    popup.style.display = 'flex';

    // Add event listeners for confirm/cancel buttons
    const confirmBtn = popup.querySelector('.confirm-btn');
    const cancelBtn = popup.querySelector('.cancel-btn');

    confirmBtn.onclick = function() {
        openCheckoutModal(checkoutItems, 'cart');
        popup.style.display = 'none';
    };

    cancelBtn.onclick = function() {
        popup.style.display = 'none';
    };
}

function proceedToCheckout() {
    initiateCheckout('proceedToCheckout');
}

function openCheckoutModal(items, type) {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    let checkoutModal = document.getElementById('checkoutModal');
    if (!checkoutModal) {
        checkoutModal = createCheckoutModal();
        document.body.appendChild(checkoutModal);
    }
    
    populateCheckoutModal(items, total, type);
    
    checkoutModal.classList.add('show');
    document.body.style.overflow = 'hidden';
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
                    <div class="checkout-items" id="checkoutItems"></div>
                    <div class="checkout-total" id="checkoutTotal"></div>
                </div>
                
                <div class="checkout-section">
                    <h3>Customer Information</h3>
                    <form id="checkoutForm" class="checkout-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="firstName">First Name *</label>
                                <input type="text" id="firstName" name="firstName" required>
                            </div>
                            <div class="form-group">
                                <label for="lastName">Last Name *</label>
                                <input type="text" id="lastName" name="lastName" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Email Address *</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="phone">Phone Number *</label>
                            <input type="tel" id="phone" name="phone" required>
                        </div>
                        
                        <h4>Shipping Address</h4>
                        <div class="form-group">
                            <label for="address">Street Address *</label>
                            <input type="text" id="address" name="address" required>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="city">City *</label>
                                <input type="text" id="city" name="city" required>
                            </div>
                            <div class="form-group">
                                <label for="province">Province *</label>
                                <select id="province" name="province" required>
                                    <option value="">Select Province</option>
                                    <option value="Metro Manila">Metro Manila</option>
                                    <option value="Cebu">Cebu</option>
                                    <option value="Davao">Davao</option>
                                    <option value="Iloilo">Iloilo</option>
                                    <option value="Laguna">Laguna</option>
                                    <option value="Cavite">Cavite</option>
                                    <option value="Bulacan">Bulacan</option>
                                    <option value="Negros Occidental">Negros Occidental</option>
                                    <option value="Pangasinan">Pangasinan</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="zipCode">ZIP Code *</label>
                            <input type="text" id="zipCode" name="zipCode" required>
                        </div>
                        
                        <h4>Payment Method</h4>
                        <div class="payment-methods">
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="cod" checked>
                                <span class="payment-label">Cash on Delivery (COD)</span>
                                <small>Pay when your order arrives</small>
                            </label>
                            <label class="payment-option">
                                <input type="radio" name="paymentMethod" value="gcash">
                                <span class="payment-label">GCash</span>
                                <small>Digital wallet payment</small>
                            </label>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="checkout-footer">
                <button class="btn-cancel" onclick="closeCheckoutModal()">Cancel</button>
                <button class="btn-place-order" onclick="placeOrder()">Place Order</button>
            </div>
        </div>
    `;
    
    return modal;
}

function populateCheckoutModal(items, total, type) {
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    checkoutItems.innerHTML = items.map(item => `
        <div class="checkout-item">
            <img src="${item.image}" alt="${item.name}" class="checkout-item-image">
            <div class="checkout-item-details">
                <div class="checkout-item-name">${item.name}</div>
                <div class="checkout-item-options">${item.color}, Size ${item.size}</div>
                <div class="checkout-item-quantity">Qty: ${item.quantity}</div>
            </div>
            <div class="checkout-item-price">₱${(item.price * item.quantity).toLocaleString()}</div>
        </div>
    `).join('');
    
    const subtotal = total;
    const shipping = subtotal >= 1000 ? 0 : 150;
    const finalTotal = subtotal + shipping;
    
    checkoutTotal.innerHTML = `
        <div class="total-row">
            <span>Subtotal:</span>
            <span>₱${subtotal.toLocaleString()}</span>
        </div>
        <div class="total-row">
            <span>Shipping:</span>
            <span>${shipping === 0 ? 'FREE' : '₱' + shipping.toLocaleString()}</span>
        </div>
        <div class="total-row final-total">
            <span>Total:</span>
            <span>₱${finalTotal.toLocaleString()}</span>
        </div>
    `;
    
    window.checkoutData = {
        items,
        subtotal,
        shipping,
        total: finalTotal,
        type
    };
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function placeOrder() {
    const form = document.getElementById('checkoutForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const formData = new FormData(form);
    const customerData = Object.fromEntries(formData.entries());
    
    const order = {
        id: 'ORDER-' + Date.now(),
        timestamp: new Date().toISOString(),
        customer: customerData,
        items: window.checkoutData.items,
        subtotal: window.checkoutData.subtotal,
        shipping: window.checkoutData.shipping,
        total: window.checkoutData.total,
        status: 'pending'
    };
    
    const placeOrderBtn = document.querySelector('.btn-place-order');
    placeOrderBtn.textContent = 'Processing...';
    placeOrderBtn.disabled = true;
    
    setTimeout(() => {
        let orders = JSON.parse(localStorage.getItem('orders') || '[]');
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        
        if (window.checkoutData.type === 'cart') {
            localStorage.removeItem('cartItems');
            updateCartCount();
            updateCartSidebar();
        }
        
        closeCheckoutModal();
        showOrderSuccessModal(order);
        
        placeOrderBtn.textContent = 'Place Order';
        placeOrderBtn.disabled = false;
    }, 2000);
}

function showOrderSuccessModal(order) {
    const successModal = document.createElement('div');
    successModal.className = 'modal show';
    successModal.innerHTML = `
        <div class="modal-content order-success">
            <div class="success-icon">✓</div>
            <h3>Order Placed Successfully!</h3>
            <p>Your order <strong>${order.id}</strong> has been received.</p>
            <div class="order-details">
                <p><strong>Total:</strong> ₱${order.total.toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${order.customer.paymentMethod.toUpperCase()}</p>
                <p><strong>Estimated Delivery:</strong> 3-5 business days</p>
            </div>
            <div class="success-actions">
                <button class="btn btn-primary" onclick="closeSuccessModal(this)">Continue Shopping</button>
                <button class="btn btn-secondary" onclick="viewOrderDetails('${order.id}')">View Order Details</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(successModal);
}

function closeSuccessModal(button) {
    const modal = button.closest('.modal');
    modal.remove();
}

function viewOrderDetails(orderId) {
    alert(`Order details for ${orderId} would be shown here. This could redirect to an order tracking page.`);
    closeSuccessModal(document.querySelector('.order-success'));
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 3000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const cartCount = document.getElementById('cartCount');
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCount) {
        cartCount.textContent = totalItems;
        if (totalItems > 0) {
            cartCount.classList.add('show');
        } else {
            cartCount.classList.remove('show');
        }
    }
}

function prevImage() {
    currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
    changeImage(images[currentImageIndex], currentImageIndex);
}

function nextImage() {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    changeImage(images[currentImageIndex], currentImageIndex);
}
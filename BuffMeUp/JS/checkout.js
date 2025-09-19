// Import Firebase Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyDVOlw2iyAaKWiuBtqobqqJhvkMoTZ9MtQ",
  authDomain: "buffmeup-b1282.firebaseapp.com",
  projectId: "buffmeup-b1282",
  storageBucket: "buffmeup-b1282.firebasestorage.app",
  messagingSenderId: "853251681726",
  appId: "1:853251681726:web:8d04ef6d24fcdc4b9eddef",
  measurementId: "G-22696XTHQX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

let currentUser = null;

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    currentUser = user;
});

// Ensure user is authenticated
function ensureAuthenticated() {
    return new Promise((resolve, reject) => {
        if (currentUser) {
            resolve(currentUser);
        } else {
            signInAnonymously(auth)
                .then(userCredential => {
                    currentUser = userCredential.user;
                    resolve(currentUser);
                })
                .catch(reject);
        }
    });
}

// Main checkout initiation function
function proceedToCheckout() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    if (cartItems.length === 0) {
        if (typeof window.showMessage === 'function') {
            window.showMessage('Your cart is empty. Please add items before proceeding to checkout.');
        } else {
            alert('Your cart is empty. Please add items before proceeding to checkout.');
        }
        return;
    }
    
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    openCheckoutModal(cartItems, 'cart');
}

// Buy now function (for product.js only)
function buyNow() {
    const productTitle = document.querySelector('.product-title')?.textContent || 'Product';
    const productPriceText = document.querySelector('.product-price')?.textContent || '₱0';
    const selectedColorText = document.getElementById('selectedColor')?.textContent || 'black';
    const selectedSizeElement = document.querySelector('.size-option.active');
    const selectedSizeText = selectedSizeElement?.textContent || 'M';
    const quantity = parseInt(document.getElementById('quantity')?.value || '1');
    
    // Validation for product page
    if (!selectedSizeElement && document.querySelector('.size-option')) {
        alert('Please select a size');
        return;
    }
    
    if (quantity < 1) {
        alert('Please select a valid quantity');
        return;
    }
    
    // Get stored product data or create fallback
    const storedProduct = localStorage.getItem('selectedProduct');
    let productData;
    
    if (storedProduct) {
        productData = JSON.parse(storedProduct);
    } else {
        productData = {
            id: 'product-' + Date.now(),
            name: productTitle,
            price: 1,
            color: selectedColorText,
            size: selectedSizeText,
            image: document.getElementById('mainImage')?.src || 'clothings/Shirts.png'
        };
    }
    
    // Update product data with current selections
    productData.color = selectedColorText;
    productData.size = selectedSizeText;
    productData.quantity = quantity;
    productData.image = document.getElementById('mainImage')?.src || productData.image;
    
    // Ensure price is a number
    if (typeof productData.price === 'string') {
        productData.price = parseFloat(productData.price.replace('₱', '').replace(',', ''));
    }
    
    openCheckoutModal([productData], 'quick');
}

// Create and open checkout modal
function openCheckoutModal(items, type) {
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Remove existing modal
    const existingModal = document.getElementById('jajCheckoutModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Create new modal
    const modal = createCheckoutModal();
    document.body.appendChild(modal);
    
    // Populate modal with data
    populateCheckoutModal(items, total, type);
    
    // Show modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Create checkout modal HTML structure
function createCheckoutModal() {
    const modal = document.createElement('div');
    modal.id = 'jajCheckoutModal';
    modal.className = 'jaj-checkout-modal';
    
    modal.innerHTML = `
        <div class="jaj-checkout-content">
            <div class="jaj-checkout-header">
                <h2>Checkout</h2>
                <button class="jaj-checkout-close-btn" onclick="closeCheckoutModal()">×</button>
            </div>
            
            <div class="jaj-checkout-body">
                <div class="jaj-checkout-section">
                    <h3>Order Summary</h3>
                    <div class="jaj-checkout-items" id="jajCheckoutItems"></div>
                    <div class="jaj-checkout-total" id="jajCheckoutTotal"></div>
                </div>
                
                <div class="jaj-checkout-section">
                    <h3>Customer Information</h3>
                    <form id="jajCheckoutForm" class="jaj-checkout-form">
                        <div class="jaj-form-row">
                            <div class="jaj-form-group">
                                <label for="jajFirstName">First Name *</label>
                                <input type="text" id="jajFirstName" name="firstName" required>
                            </div>
                            <div class="jaj-form-group">
                                <label for="jajLastName">Last Name *</label>
                                <input type="text" id="jajLastName" name="lastName" required>
                            </div>
                        </div>
                        
                        <div class="jaj-form-group">
                            <label for="jajEmail">Email Address *</label>
                            <input type="email" id="jajEmail" name="email" required>
                        </div>
                        
                        <div class="jaj-form-group">
                            <label for="jajPhone">Phone Number *</label>
                            <input type="tel" id="jajPhone" name="phone" required>
                        </div>
                        
                        <h4>Shipping Address</h4>
                        <div class="jaj-form-group">
                            <label for="jajAddress">Street Address *</label>
                            <input type="text" id="jajAddress" name="address" required>
                        </div>
                        
                        <div class="jaj-form-row">
                            <div class="jaj-form-group">
                                <label for="jajCity">City *</label>
                                <input type="text" id="jajCity" name="city" required>
                            </div>
                            <div class="jaj-form-group">
                                <label for="jajProvince">Province *</label>
                                <select id="jajProvince" name="province" required>
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
                        
                        <div class="jaj-form-group">
                            <label for="jajZipCode">ZIP Code *</label>
                            <input type="text" id="jajZipCode" name="zipCode" required>
                        </div>
                        
                        <h4>Payment Method</h4>
                        <div class="jaj-payment-methods">
                            <label class="jaj-payment-option">
                                <input type="radio" name="paymentMethod" value="cod" checked>
                                <div>
                                    <span class="jaj-payment-label">Cash on Delivery (COD)</span>
                                    <br><small>Pay when your order arrives</small>
                                </div>
                            </label>
                            <label class="jaj-payment-option">
                                <input type="radio" name="paymentMethod" value="gcash">
                                <div>
                                    <span class="jaj-payment-label">GCash</span>
                                    <br><small>Digital wallet payment</small>
                                </div>
                            </label>
                        </div>
                    </form>
                </div>
            </div>
            
            <div class="jaj-checkout-footer">
                <button class="jaj-btn-cancel" onclick="closeCheckoutModal()">Cancel</button>
                <button class="jaj-btn-place-order" onclick="placeOrder()">Place Order</button>
            </div>
        </div>
    `;
    
    return modal;
}

// Populate checkout modal with items and totals
function populateCheckoutModal(items, total, type) {
    const checkoutItems = document.getElementById('jajCheckoutItems');
    const checkoutTotal = document.getElementById('jajCheckoutTotal');
    
    checkoutItems.innerHTML = items.map(item => `
        <div class="jaj-checkout-item">
            <img src="${item.image}" alt="${item.name}" class="jaj-checkout-item-image">
            <div class="jaj-checkout-item-details">
                <div class="jaj-checkout-item-name">${item.name}</div>
                <div class="jaj-checkout-item-options">${item.color}, Size ${item.size}</div>
                <div class="jaj-checkout-item-quantity">Qty: ${item.quantity}</div>
            </div>
            <div class="jaj-checkout-item-price">₱${(item.price * item.quantity).toLocaleString()}</div>
        </div>
    `).join('');
    
    const subtotal = total;
    const shipping = subtotal >= 1000 ? 0 : 150;
    const finalTotal = subtotal + shipping;
    
    checkoutTotal.innerHTML = `
        <div class="jaj-total-row">
            <span>Subtotal:</span>
            <span>₱${subtotal.toLocaleString()}</span>
        </div>
        <div class="jaj-total-row">
            <span>Shipping:</span>
            <span>${shipping === 0 ? 'FREE' : '₱' + shipping.toLocaleString()}</span>
        </div>
        <div class="jaj-total-row jaj-final-total">
            <span>Total:</span>
            <span>₱${finalTotal.toLocaleString()}</span>
        </div>
    `;
    
    // Store checkout data globally
    window.checkoutData = {
        items,
        subtotal,
        shipping,
        total: finalTotal,
        type
    };
}

// Close checkout modal
function closeCheckoutModal() {
    const modal = document.getElementById('jajCheckoutModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// Place order function - Updated to save to Firebase with PENDING status
async function placeOrder() {
    const form = document.getElementById('jajCheckoutForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Ensure user is authenticated before placing order
    try {
        await ensureAuthenticated();
    } catch (error) {
        console.error('Authentication failed:', error);
        alert('Unable to authenticate. Please try again.');
        return;
    }
    
    const formData = new FormData(form);
    const customerData = Object.fromEntries(formData.entries());
    
    const placeOrderBtn = document.querySelector('.jaj-btn-place-order');
    const originalText = placeOrderBtn.textContent;
    placeOrderBtn.textContent = 'Processing...';
    placeOrderBtn.disabled = true;
    placeOrderBtn.style.background = '#ccc';
    
    try {
        // Create order object with PENDING status
        const order = {
            customerEmail: customerData.email,
            customerInfo: {
                firstName: customerData.firstName,
                lastName: customerData.lastName,
                email: customerData.email,
                phone: customerData.phone,
                address: customerData.address,
                city: customerData.city,
                province: customerData.province,
                zipCode: customerData.zipCode
            },
            items: window.checkoutData.items.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                color: item.color,
                size: item.size,
                image: item.image
            })),
            subtotal: window.checkoutData.subtotal,
            shipping: window.checkoutData.shipping,
            total: window.checkoutData.total,
            paymentMethod: customerData.paymentMethod,
            status: 'pending', // This is key - orders start as PENDING
            orderDate: serverTimestamp(),
            userId: currentUser ? currentUser.uid : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
            // Note: confirmedAt will only be set when admin confirms the order
        };
        
        // Add order to Firebase
        const docRef = await addDoc(collection(db, 'orders'), order);
        
        // Clear cart if checkout from cart
        if (window.checkoutData.type === 'cart') {
            localStorage.removeItem('cartItems');
            updateCartCount();
            if (typeof updateCartSidebar === 'function') {
                updateCartSidebar();
            }
            if (typeof updateCartDisplay === 'function') {
                updateCartDisplay();
            }
        }
        
        closeCheckoutModal();
        showOrderSuccessModal({...order, id: docRef.id});
        
    } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
    } finally {
        // Reset button
        placeOrderBtn.textContent = originalText;
        placeOrderBtn.disabled = false;
        placeOrderBtn.style.background = '';
    }
}

// Show order success modal with clear pending status messaging
function showOrderSuccessModal(order) {
    const successModal = document.createElement('div');
    successModal.className = 'jaj-order-success-modal show';
    
    successModal.innerHTML = `
        <div class="jaj-order-success-content">
            <div class="jaj-success-icon">✓</i></div>
            <h3>Pending Order!</h3>
            <p>Your order has been received and is currently under review.</p>
            <div class="jaj-order-details">
                <p><strong>Order ID:</strong> #${order.id.substring(0, 8)}...</p>
                <p><strong>Total:</strong> ₱${order.total.toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
                <p><strong>Estimated Processing Time:</strong> 1-2 business days</p>
                <p><strong>Delivery Time:</strong> 3-5 days after confirmation</p>
            </div>
            
            <div class="jaj-success-actions">
                <button class="jaj-btn-primary" onclick="closeSuccessModal(this)">Continue Shopping</button>
                <button class="jaj-btn-secondary" onclick="viewOrderHistory()">Check Order Status</button>
            </div>
    `;
    
    document.body.appendChild(successModal);
}

// Close success modal
function closeSuccessModal(button) {
    const modal = button.closest('.jaj-order-success-modal');
    if (modal) {
        modal.remove();
    }
}

// View order history
function viewOrderHistory() {
    const modal = document.querySelector('.jaj-order-success-modal');
    if (modal) {
        modal.remove();
    }
    // Redirect to order history page
    window.location.href = 'Orderhistory.html';
}

// Update cart count
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

// Show notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `jaj-notification jaj-notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Initialize checkout functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('jajCheckoutModal');
        if (modal && modal.classList.contains('show')) {
            if (e.key === 'Escape') {
                closeCheckoutModal();
            }
        }
    });
});

// Make functions globally available
window.proceedToCheckout = proceedToCheckout;
window.closeSuccessModal = closeSuccessModal;
window.buyNow = buyNow;
window.closeCheckoutModal = closeCheckoutModal;
window.placeOrder = placeOrder;
window.viewOrderHistory = viewOrderHistory;
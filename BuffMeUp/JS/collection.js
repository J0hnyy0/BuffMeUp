// Firestore reference
const db = firebase.firestore();
const CURRENCY_SYMBOL = '₱';

// Cached DOM elements
const DOM = {
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  authButtons: document.getElementById('authButtons'),
  profileMenu: document.getElementById('profileMenu'),
  profileName: document.getElementById('profileName'),
  profileAvatar: document.getElementById('profileAvatar'),
  cartSidebar: document.getElementById('cartSidebar'),
  checkoutModal: document.getElementById('checkoutModal'),
  logoutPopup: document.getElementById('logoutPopup'),
  profileDropdown: document.getElementById('profileDropdown')
};

// Global state
let allProducts = [];
let isProfileDropdownOpen = false;

// Initialize page
window.addEventListener('load', () => {
  console.log('Collection page loaded');
  updateAuthState();
  updateCartCount();
  loadProductsFromFirestore();
});

window.addEventListener('DOMContentLoaded', () => {
  // Attach logout popup button listeners ONCE
  const logoutPopup = document.getElementById('logoutPopup');
  if (logoutPopup) {
    const yesBtn = logoutPopup.querySelector('.yes-btn');
    const noBtn = logoutPopup.querySelector('.no-btn');
    if (yesBtn) yesBtn.addEventListener('click', confirmLogout);
    if (noBtn) noBtn.addEventListener('click', closeLogoutPopup);
  }
});

// Product Loading
async function loadProductsFromFirestore() {
  if (!firebase || !firebase.firestore) {
    console.error('Firebase or Firestore not initialized');
    displayErrorMessage();
    return;
  }
  try {
    console.log('Loading all products from Firestore...');
    const snapshot = await db.collection('products').get();

    if (snapshot.empty) {
      console.log('No products found');
      displayNoProductsMessage();
      return;
    }

    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Loaded products:', products);

    displayAllProducts(products);
  } catch (err) {
    console.error('Error loading products:', err);
    displayErrorMessage();
  }
}

function displayAllProducts(products) {
  const section = document.getElementById('featured-product');
  if (!section) return;

  const grid = section.querySelector('.product-grid');
  if (!grid) return;

  grid.innerHTML = ''; // clear old content
  products.forEach(product => {
    const card = createProductCard(product);
    grid.appendChild(card);
  });
}


function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.style.cursor = 'pointer'; // Make it clear the card is clickable
  
  // Add click event with error handling
  card.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('Product card clicked:', product.id, product.name);
    selectProduct(product);
  });

  const price = typeof product.price === 'number' && !isNaN(product.price)
    ? `${CURRENCY_SYMBOL}${product.price.toFixed(2)}`
    : `${CURRENCY_SYMBOL}0.00`;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image || 'default-product.png'];
  const defaultImg = images[0] || 'default-product.png';
  const hoverImg = images[1] || defaultImg;

  const productImage = document.createElement('div');
  productImage.className = 'product-image';

  const defaultImage = document.createElement('img');
  defaultImage.src = defaultImg;
  defaultImage.alt = product.name || 'Product';
  defaultImage.className = 'default-image';
  // Prevent image dragging which can interfere with clicks
  defaultImage.draggable = false;

  const hoverImage = document.createElement('img');
  hoverImage.src = hoverImg;
  hoverImage.alt = product.name || 'Product';
  hoverImage.draggable = false;

  productImage.appendChild(defaultImage);

  const productInfo = document.createElement('div');
  productInfo.className = 'product-info';

  const productName = document.createElement('h3');
  productName.className = 'product-name';
  productName.textContent = product.name || 'Unnamed Product';

  const productDescription = document.createElement('p');
  productDescription.className = 'product-description';
  productDescription.textContent = product.description || 'No description available';

  const productPrice = document.createElement('p');
  productPrice.className = 'product-price';
  productPrice.textContent = price;

  productInfo.appendChild(productName);
  productInfo.appendChild(productDescription);
  productInfo.appendChild(productPrice);

  card.appendChild(productImage);
  card.appendChild(productInfo);

  return card;
}

// Filter Tabs
function setupFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      console.log('Filter tab clicked:', tab.dataset.filter);
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filterProducts(tab.dataset.filter);
    });
  });
}

function filterProducts(filter) {
  console.log('Filtering products by:', filter);
  if (filter === 'all') {
    document.querySelectorAll('.product-section').forEach(sec => sec.style.display = 'block');
  } else {
    document.querySelectorAll('.product-section').forEach(sec => sec.style.display = 'none');
    const sectionId = filter === 'shorts' ? 'shorts-section' : `${filter}-section`;
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'block';
  }
}

// Error & Empty States
function displayErrorMessage() {
  const container = document.querySelector('.collection-page .container');
  if (!container) {
    console.warn('Container not found for error message');
    return;
  }

  const div = document.createElement('div');
  div.className = 'error-message';
  div.style.cssText = `
    text-align: center; padding: 40px; background: #f8f9fa;
    border-radius: 8px; margin: 20px 0; color: #dc3545;
  `;
  div.innerHTML = `
    <h3>Unable to load products</h3>
    <p>There was an error loading products. Please try refreshing.</p>
    <button onclick="loadProductsFromFirestore()" class="btn-retry"
      style="background:#007bff;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;margin-top:15px;">
      Retry
    </button>
  `;
  container.appendChild(div);
}

function displayNoProductsMessage() {
  const container = document.querySelector('.collection-page .container');
  if (!container) {
    console.warn('Container not found for no products message');
    return;
  }

  const div = document.createElement('div');
  div.className = 'no-products-message';
  div.style.cssText = `
    text-align: center; padding: 60px 20px; background: #f8f9fa;
    border-radius: 8px; margin: 20px 0;
  `;
  div.innerHTML = `<h3>No Products Available</h3><p>Products are being updated. Please check back later.</p>`;
  container.appendChild(div);
}

// Auth & Logout
function updateAuthState() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userName = localStorage.getItem('userName') || 'User';

  if (!DOM.authButtons || !DOM.profileMenu) {
    console.warn('Auth buttons or profile menu not found');
    return;
  }

  if (isLoggedIn && userName) {
    DOM.authButtons.classList.add('hide');
    DOM.profileMenu.classList.add('show');
    if (DOM.profileName) DOM.profileName.textContent = userName;
    if (DOM.profileAvatar) DOM.profileAvatar.textContent = userName.charAt(0).toUpperCase();
  } else {
    DOM.authButtons.classList.remove('hide');
    DOM.profileMenu.classList.remove('show');
  }
}

function toggleProfileDropdown() {
  isProfileDropdownOpen = !isProfileDropdownOpen;
  DOM.profileDropdown?.classList.toggle('show', isProfileDropdownOpen);
}

function showLogoutPopup() {
  DOM.logoutPopup?.style.setProperty('display', 'flex');
}

function closeLogoutPopup() {
  DOM.logoutPopup?.style.setProperty('display', 'none');
}

function confirmLogout() {
  closeLogoutPopup();
  logout();
}

function logout() {
  firebase.auth().signOut()
    .catch(err => console.error('Logout error:', err))
    .finally(() => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      updateAuthState();
      window.location.href = 'Register.html';
    });
}

document.addEventListener('click', e => {
  if (DOM.profileMenu && !DOM.profileMenu.contains(e.target) && isProfileDropdownOpen) {
    DOM.profileDropdown?.classList.remove('show');
    isProfileDropdownOpen = false;
  }
});

// FIXED: Product selection and navigation
function selectProduct(product) {
  console.log('Selecting product for navigation:', product.id, product.name);
  
  // Validate product data
  if (!product || !product.id) {
    console.error('Invalid product data:', product);
    alert('Unable to load product details. Please try again.');
    return;
  }
  
  try {
    // Store complete product data for the product page
    const productData = {
      id: product.id,
      name: product.name || 'Unnamed Product',
      price: typeof product.price === 'number' ? product.price : 0,
      description: product.description || 'No description available',
      images: product.images || [product.image || 'default-product.png'],
      sizes: product.sizes || ['XS', 'S', 'M', 'L', 'XL'],
      colors: product.colors || ['Black', 'White'],
      category: product.category || 'general',
      image: product.image || (product.images && product.images[0]) || 'default-product.png'
    };
    
    // Store in localStorage for product page to access
    localStorage.setItem('selectedProduct', JSON.stringify(productData));
    console.log('Product data stored in localStorage:', productData);
    
    // Navigate to product page with product ID
    const productUrl = `Product.html?id=${encodeURIComponent(product.id)}`;
    console.log('Navigating to:', productUrl);
    
    // Use window.location.href for navigation
    window.location.href = productUrl;
    
  } catch (error) {
    console.error('Error in selectProduct:', error);
    alert('Unable to navigate to product details. Please try again.');
  }
}

function updateCartCount() {
  let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
  const total = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const countEl = document.getElementById('cartCount');
  if (!countEl) {
    console.warn('Cart count element not found');
    return;
  }
  if (total > 0) {
    countEl.textContent = total;
    countEl.classList.add('show');
  } else {
    countEl.classList.remove('show');
  }
}

function toggleCart() {
  if (!DOM.cartSidebar) {
    console.warn('Cart sidebar not found');
    return;
  }
  DOM.cartSidebar.classList.toggle('open');
  updateCartSidebar();
}

function updateCartSidebar() {
  let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
  if (!DOM.cartItems || !DOM.cartTotal) {
    console.warn('Cart items or total element not found');
    return;
  }

  DOM.cartItems.innerHTML = '';
  let total = 0;

  if (!cart.length) {
    DOM.cartItems.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
    DOM.cartTotal.textContent = `Total: ${CURRENCY_SYMBOL}0.00`;
    return;
  }

  cart.forEach((item, i) => {
    const price = typeof item.price === 'number' && !isNaN(item.price)
      ? item.price
      : 0;
    const itemTotal = price * item.quantity;
    total += itemTotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <img src="${item.image || 'default-product.png'}" alt="${item.name || 'Product'}" class="cart-item-image">
      <div class="cart-item-details">
        <button class="delete-cart-btn" onclick="deleteCartItem(${i})" title="Remove item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M7 4V2H17V4H22V6H20V21C20 21.5523 19.5523 22 19 22H5C4.44772 22 4 21.5523 4 21V6H2V4H7ZM6 6V20H18V6H6ZM9 9H11V17H9V9ZM13 9H15V17H13V9Z"></path>
            </svg>
        </button>
        <div class="cart-item-name">${item.name || 'Unnamed Product'}</div>
        <div class="cart-item-price">${CURRENCY_SYMBOL}${price.toFixed(2)}</div>
        <div class="cart-item-options">Color: ${item.color || 'N/A'} | Size: ${item.size || 'N/A'}</div>
        <div class="cart-item-quantity">
          <button onclick="updateQuantity(${i}, -1)" class="quantity-btn">-</button>
          <span class="quantity-display">${item.quantity}</span>
          <button onclick="updateQuantity(${i}, 1)" class="quantity-btn">+</button>
        </div>
      </div>
    `;
    DOM.cartItems.appendChild(div);
  });

  DOM.cartTotal.textContent = `Total: ${CURRENCY_SYMBOL}${total.toFixed(2)}`;
}

function updateQuantity(i, change) {
  let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
  if (cart[i]) {
    cart[i].quantity += change;
    if (cart[i].quantity <= 0) cart.splice(i, 1);
    localStorage.setItem('cartItems', JSON.stringify(cart));
    updateCartCount();
    updateCartSidebar();
  }
}

function deleteCartItem(i) {
  let cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
  cart.splice(i, 1);
  localStorage.setItem('cartItems', JSON.stringify(cart));
  updateCartCount();
  updateCartSidebar();
}

// Checkout
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
  const total = items.reduce((sum, i) => sum + ((typeof i.price === 'number' && !isNaN(i.price) ? i.price : 0) * i.quantity), 0);

  let modal = DOM.checkoutModal;
  if (!modal) {
    modal = createCheckoutModal();
    document.body.appendChild(modal);
    DOM.checkoutModal = modal;
  }

  populateCheckoutModal(items, total);
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';

  modal.dataset.checkoutData = JSON.stringify({ items, total });
}

function createCheckoutModal() {
  const modal = document.createElement('div');
  modal.id = 'checkoutModal';
  modal.className = 'checkout-modal';
  modal.innerHTML = `
    <div class="checkout-modal-content">
      <div class="checkout-header">
        <h2>Checkout</h2>
        <button class="checkout-close-btn">×</button>
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
        <button class="cancel-btn">Cancel</button>
        <button class="place-order-btn">Place Order</button>
      </div>
    </div>
  `;
  modal.querySelector('.checkout-close-btn').addEventListener('click', closeCheckoutModal);
  modal.querySelector('.cancel-btn').addEventListener('click', closeCheckoutModal);
  modal.querySelector('.place-order-btn').addEventListener('click', placeOrder);
  return modal;
}

function populateCheckoutModal(items, total) {
  const itemsEl = document.getElementById('checkoutItems');
  const totalEl = document.getElementById('checkoutTotal');
  if (!itemsEl || !totalEl) {
    console.warn('Checkout items or total element not found');
    return;
  }

  itemsEl.innerHTML = items.map(i => `
    <div class="checkout-item">
      <img src="${i.image || 'default-product.png'}" alt="${i.name || 'Product'}">
      <div>${i.name || 'Unnamed Product'} (${i.color || 'N/A'}, ${i.size || 'N/A'}) - Qty: ${i.quantity}</div>
      <div>${CURRENCY_SYMBOL}${(typeof i.price === 'number' && !isNaN(i.price) ? i.price : 0 * i.quantity).toFixed(2)}</div>
    </div>
  `).join('');

  totalEl.innerHTML = `<strong>Total: ${CURRENCY_SYMBOL}${total.toFixed(2)}</strong>`;
}

function closeCheckoutModal() {
  DOM.checkoutModal?.classList.remove('show');
  document.body.style.overflow = '';
}

function placeOrder() {
  const form = document.getElementById('checkoutForm');
  if (!form.checkValidity()) return form.reportValidity();

  const modal = DOM.checkoutModal;
  if (!modal) {
    console.warn('Checkout modal not found');
    return;
  }
  const checkoutData = JSON.parse(modal.dataset.checkoutData || '{}');
  const formData = Object.fromEntries(new FormData(form).entries());
  const order = {
    id: 'ORDER-' + Date.now(),
    items: checkoutData.items || [],
    total: checkoutData.total || 0,
    customer: formData,
    timestamp: new Date().toISOString(),
    status: 'pending'
  };

  try {
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
  } catch (error) {
    console.error('Error saving order to localStorage:', error);
    alert('Failed to save order. Please try again.');
    return;
  }

  localStorage.removeItem('cartItems');
  updateCartCount();
  updateCartSidebar();

  closeCheckoutModal();
  alert(`Order ${order.id} placed successfully!`);
}
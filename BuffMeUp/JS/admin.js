import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, where } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

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

// Hardcoded admin credentials
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

let ordersListener = null;
let usersListener = null;
let deleteTarget = null;
let deleteType = null;

document.addEventListener('DOMContentLoaded', () => {
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const authForm = document.getElementById('auth-form');
    const errorMessage = document.getElementById('errorMessage');
    const logoutBtn = document.getElementById('logout-btn');
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    const pageTitle = document.getElementById('page-title');
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const closeModal = document.querySelector('.close');
    const cancelBtn = document.querySelector('.cancel-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    const exportOrdersBtn = document.getElementById('export-orders-btn');
    const selectAllUsers = document.getElementById('select-all-users');
    const bulkDeleteUsersBtn = document.getElementById('bulk-delete-users-btn');

    // Show error messages
    function showError(message) {
        if (errorMessage) {
            errorMessage.style.display = 'block';
            errorMessage.textContent = message;
        }
    }

    // Show admin notification
    function showAdminNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `admin-notification admin-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✓' : type === 'warning' ? '⚠' : 'ℹ'}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add to notifications container or body
        const container = document.querySelector('.notifications-container') || document.body;
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Play notification sound for new orders
    function playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }

    // Toggle views
    function showLogin() {
        if (loginContainer && dashboardContainer) {
            loginContainer.classList.remove('hidden');
            loginContainer.classList.add('show');
            dashboardContainer.classList.remove('show');
            dashboardContainer.classList.add('hidden');
        }
    }

    function showDashboard() {
        if (loginContainer && dashboardContainer) {
            loginContainer.classList.remove('show');
            loginContainer.classList.add('hidden');
            dashboardContainer.classList.remove('hidden');
            dashboardContainer.classList.add('show');
            updateDashboard();
            // Start listening for new orders
            startOrdersListener();
        }
    }

    // Check authentication
    if (localStorage.getItem('isAuthenticated') === 'true') {
        showDashboard();
    } else {
        showLogin();
    }

    // Login handler
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('adminUsername');
            const passwordInput = document.getElementById('adminPassword');
            
            if (!usernameInput || !passwordInput) {
                showError('Login form elements not found');
                return;
            }

            const username = usernameInput.value;
            const password = passwordInput.value;

            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                localStorage.setItem('isAuthenticated', 'true');
                showDashboard();
            } else {
                showError('Incorrect username or password!');
            }
        });
    }

    // Logout button opens modal
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const logoutModal = document.getElementById('logout-modal');
            if (logoutModal) {
                logoutModal.classList.add('show');
            }
        });
    }

    // Logout Yes/No actions
    const logoutYes = document.getElementById('logout-yes');
    const logoutNo = document.getElementById('logout-no');
    
    if (logoutYes) {
        logoutYes.addEventListener('click', () => {
            localStorage.removeItem('isAuthenticated');
            if (ordersListener) {
                ordersListener();
            }
            if (usersListener) {
                usersListener();
            }
            const logoutModal = document.getElementById('logout-modal');
            if (logoutModal) {
                logoutModal.classList.remove('show');
            }
            showLogin();
        });
    }

    if (logoutNo) {
        logoutNo.addEventListener('click', () => {
            const logoutModal = document.getElementById('logout-modal');
            if (logoutModal) {
                logoutModal.classList.remove('show');
            }
        });
    }

    // Navigation handler
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const sectionName = item.dataset.section;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Show corresponding section
            contentSections.forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(`${sectionName}-section`);
            if (targetSection) {
                targetSection.classList.add('active');
            }
            
            // Update page title with default title (count will be updated in fetch functions)
            const titles = {
                'dashboard': 'Dashboard Overview',
                'users': 'User Management',
                'products': 'Product Management',
                'orders': 'Order Management'
            };
            if (pageTitle) {
                pageTitle.textContent = titles[sectionName] || 'Admin Panel';
            }
            
            // Load section data
            if (sectionName === 'users') fetchUsers();
            if (sectionName === 'products') fetchProducts();
            if (sectionName === 'orders') fetchOrders();
        });
    });

    // Add New Product button handler
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            const modalTitle = document.getElementById('modal-title');
            const nameInput = document.getElementById('product-name');
            const categoryInput = document.getElementById('category');
            const priceInput = document.getElementById('price');
            const stockInput = document.getElementById('stock');
            const descriptionInput = document.getElementById('description');
            const imageInput = document.getElementById('image-url');

            // Reset form fields
            if (modalTitle) modalTitle.textContent = 'Add New Product';
            if (nameInput) nameInput.value = '';
            if (categoryInput) categoryInput.value = '';
            if (priceInput) priceInput.value = '';
            if (stockInput) stockInput.value = '';
            if (descriptionInput) descriptionInput.value = '';
            if (imageInput) imageInput.value = '';

            // Show modal
            if (productModal) {
                productModal.classList.add('show');
            }
        });
    }

    // Export Orders button handler
    if (exportOrdersBtn) {
        exportOrdersBtn.addEventListener('click', exportOrdersToCSV);
    }

    // Select All Users checkbox handler
    if (selectAllUsers) {
        selectAllUsers.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.user-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = e.target.checked;
            });
        });
    }

    // Bulk Delete Users button handler
    if (bulkDeleteUsersBtn) {
        bulkDeleteUsersBtn.addEventListener('click', bulkDeleteUsers);
    }

    // Start real-time listener for orders
    function startOrdersListener() {
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, orderBy('createdAt', 'desc'));
            
            ordersListener = onSnapshot(q, (snapshot) => {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        const orderData = change.doc.data();
                        // Only show notification for new pending orders
                        if (orderData && orderData.status === 'pending') {
                            const customerEmail = orderData.customerEmail || 'Unknown Customer';
                            const total = orderData.total || 0;
                            
                            showAdminNotification(
                                `New order received from ${customerEmail}! Total: ₱${total.toLocaleString()}`,
                                'warning'
                            );
 
                            // Play notification sound
                            playNotificationSound();
                            
                            // Update dashboard if visible
                            updateDashboard();
                        }
                    }
                });
                
                // Refresh orders table if on orders page
                const activeSection = document.querySelector('.content-section.active');
                if (activeSection && activeSection.id === 'orders-section') {
                    fetchOrders();
                }
            }, (error) => {
                console.error('Error in orders listener:', error);
                showAdminNotification('Error listening to order updates', 'error');
            });
        } catch (error) {
            console.error('Error starting orders listener:', error);
            showAdminNotification('Error starting order listener', 'error');
        }
    }

    // Add real-time listener for users
    function startUsersListener() {
        if (usersListener) {
            usersListener(); 
        }
        
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            
            let isInitialLoad = true; // Flag to track initial snapshot
            
            usersListener = onSnapshot(q, (snapshot) => {
                const tbody = document.getElementById('user-table-body');
                const activeSection = document.querySelector('.content-section.active');
                
                if (activeSection && activeSection.id === 'users-section' && tbody) {
                    snapshot.docChanges().forEach((change) => {
                        const user = { id: change.doc.id, ...change.doc.data() };
                        // Skip 'added' changes during initial load to avoid duplicates
                        if (isInitialLoad && change.type === 'added') {
                            return;
                        }
                        if (change.type === 'added' || change.type === 'modified') {
                            updateUserRow(user, change.type);
                        } else if (change.type === 'removed') {
                            const row = tbody.querySelector(`tr[data-user-id="${user.id}"]`);
                            if (row) row.remove();
                        }
                    });
                    // Update page title with current user count
                    if (pageTitle) {
                        pageTitle.textContent = `User Management (${tbody.children.length} Users)`;
                    }
                    // Mark initial load as complete after processing
                    isInitialLoad = false;
                }
            }, (error) => {
                console.error('Error in users listener:', error);
                showAdminNotification('Error listening to user updates', 'error');
            });
        } catch (error) {
            console.error('Error starting users listener:', error);
            showAdminNotification('Error starting user listener', 'error');
        }
    }

    // Update or add a single user row
    function updateUserRow(user, changeType) {
        const tbody = document.getElementById('user-table-body');
        if (!tbody || !user) return;
        
        const existingRow = tbody.querySelector(`tr[data-user-id="${user.id}"]`);
        
        let joinDate = 'N/A';
        if (user.createdAt) {
            if (user.createdAt.seconds) {
                joinDate = new Date(user.createdAt.seconds * 1000).toLocaleDateString();
            } else if (user.createdAt instanceof Date) {
                joinDate = user.createdAt.toLocaleDateString();
            } else if (typeof user.createdAt === 'string') {
                joinDate = new Date(user.createdAt).toLocaleDateString();
            }
        }
        
        let lastLogin = 'Never';
        if (user.lastLogin) {
            if (user.lastLogin.seconds) {
                lastLogin = new Date(user.lastLogin.seconds * 1000).toLocaleDateString();
            } else if (user.lastLogin instanceof Date) {
                lastLogin = user.lastLogin.toLocaleDateString();
            }
        }
        
        const userStatus = user.status || 'Active';
        const statusClass = userStatus.toLowerCase().replace(' ', '-');
        const userEmail = user.email || 'No email';
        
        const rowHTML = `
            <tr class="user-row" data-user-id="${user.id}">
                <td>
                    <div class="user-info">
                        <div class="user-email">${userEmail}</div>
                    </div>
                </td>
                <td>
                    <span class="status-badge ${statusClass}">
                        <i class="ri-circle-fill status-indicator"></i>
                        ${userStatus}
                    </span>
                </td>
                <td>${joinDate}</td>
                <td class="actions">
                    <div class="action-buttons">
                        <button class="action-btn ${userStatus === 'Active' ? 'suspend-btn' : 'activate-btn'}" 
                                onclick="toggleUserStatus('${user.id}')" 
                                title="${userStatus === 'Active' ? 'Suspend User' : 'Activate User'}">
                            <i class="ri-${userStatus === 'Active' ? 'user-forbid' : 'user-add'}-line"></i>
                            <span>${userStatus === 'Active' ? 'Suspend' : 'Activate'}</span>
                        </button>
                        ${userStatus !== 'Active' ? `
                        <button class="action-btn delete-btn" onclick="deleteUser('${user.id}')" title="Delete User">
                            <i class="ri-delete-bin-line"></i>
                            <span>Delete</span>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
        
        if (existingRow) {
            // Update existing row for both 'added' and 'modified' to handle any case
            existingRow.outerHTML = rowHTML;
        } else if (changeType === 'added') {
            // Only add new row if it doesn't exist
            tbody.insertAdjacentHTML('afterbegin', rowHTML);
        }
    }

    // ENHANCED FETCH USERS FUNCTION
    async function fetchUsers() {
        const tbody = document.getElementById('user-table-body');
        const loadingIndicator = document.getElementById('users-loading');
        
        if (!tbody) {
            console.error('User table body not found');
            return;
        }
        
        // Show loading state
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }
        tbody.innerHTML = '<tr><td colspan="6"><div class="loading">Loading users...</div></td></tr>';
        
        try {
            // Fetch users from Firestore
            const usersRef = collection(db, 'users');
            const q = query(usersRef, orderBy('createdAt', 'desc'));
            const usersSnapshot = await getDocs(q);
            
            // Clear table body
            tbody.innerHTML = '';
            
            if (usersSnapshot.empty) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            <div class="empty-state">
                                <i class="ri-user-line"></i>
                                <h3>No Users Found</h3>
                                <p>No registered users in the system yet.</p>
                            </div>
                        </td>
                    </tr>
                `;
                if (pageTitle) {
                    pageTitle.textContent = `User Management (0 Users)`;
                }
                // Start listener even if empty to catch new users
                startUsersListener();
                return;
            }

            // Populate table
            usersSnapshot.forEach((doc) => {
                updateUserRow({ id: doc.id, ...doc.data() }, 'added');
            });
            
            // Update page title with count
            if (pageTitle) {
                pageTitle.textContent = `User Management (${usersSnapshot.size} Users)`;
            }
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            // Start real-time listener
            startUsersListener();
            
        } catch (error) {
            console.error('Error fetching users:', error);
            
            // Hide loading indicator
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        <div class="error-state">
                            <i class="ri-error-warning-line"></i>
                            <h3>Error Loading Users</h3>
                            <p>Unable to fetch users from the database.</p>
                            <button class="retry-btn" onclick="fetchUsers()">
                                <i class="ri-refresh-line"></i> Retry
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            showAdminNotification('Error loading users. Please try again.', 'error');
        }
    }

    // Update dashboard stats
    async function updateDashboard() {
        try {
            const usersSnapshot = await getDocs(collection(db, 'users'));
            const productsSnapshot = await getDocs(collection(db, 'products'));
            const ordersSnapshot = await getDocs(collection(db, 'orders'));
            
            const totalUsers = usersSnapshot.size;
            const totalProducts = productsSnapshot.size;
            const totalOrders = ordersSnapshot.size;
            
            let totalRevenue = 0;
            let pendingOrders = 0;
            
            ordersSnapshot.forEach(doc => {
                const orderData = doc.data();
                if (orderData) {
                    if (orderData.status === 'delivered' || orderData.status === 'confirmed') {
                        totalRevenue += orderData.total || 0;
                    }
                    if (orderData.status === 'pending') {
                        pendingOrders++;
                    }
                }
            });

            // Safely update DOM elements
            const totalUsersEl = document.getElementById('total-users');
            const totalProductsEl = document.getElementById('total-products');
            const totalOrdersEl = document.getElementById('total-orders');
            const totalRevenueEl = document.getElementById('total-revenue');
            const pendingIndicator = document.getElementById('pending-orders');
            
            if (totalUsersEl) totalUsersEl.textContent = totalUsers;
            if (totalProductsEl) totalProductsEl.textContent = totalProducts;
            if (totalOrdersEl) totalOrdersEl.textContent = totalOrders;
            if (totalRevenueEl) totalRevenueEl.textContent = `₱${totalRevenue.toFixed(2)}`;
            
            // Update pending orders indicator
            if (pendingIndicator) {
                pendingIndicator.textContent = pendingOrders;
                if (pendingOrders > 0) {
                    pendingIndicator.classList.add('has-pending');
                } else {
                    pendingIndicator.classList.remove('has-pending');
                }
            }
        } catch (error) {
            console.error('Error updating dashboard:', error);
            showAdminNotification('Error updating dashboard statistics', 'error');
        }
    }

    // Fetch products
    async function fetchProducts() {
        const tbody = document.getElementById('product-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="7"><div class="loading">Loading products...</div></td></tr>';
        
        try {
            const productsSnapshot = await getDocs(collection(db, 'products'));
            
            // Clear table body
            tbody.innerHTML = '';
            
            // Update page title with count
            if (pageTitle) {
                pageTitle.textContent = `Product Management (${productsSnapshot.size} Products)`;
            }
            
            if (productsSnapshot.empty) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="empty-state">
                                <i class="fas fa-box"></i>
                                <p>No products found</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            productsSnapshot.forEach((doc, index) => {
                const product = { id: doc.id, ...doc.data() };
                if (product.name && product.price) {
                    tbody.innerHTML += `
                        <tr>
                            <td><img src="${product.image || ''}" alt="${product.name}" width="50" height="50"></td>
                            <td>${product.name}</td>
                            <td>₱${product.price.toFixed(2)}</td>
                            <td class="actions">
                                <button class="action-btn delete" onclick="deleteProduct('${doc.id}', ${index})">Delete</button>
                            </td>
                        </tr>
                    `;
                }
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: #ff6b6b;">
                        Error loading products. Please try again.
                    </td>
                </tr>
            `;
            showAdminNotification('Error loading products', 'error');
        }
    }

    // Fetch orders with enhanced display
    async function fetchOrders() {
        const tbody = document.getElementById('order-table-body');
        if (!tbody) return;
        
        tbody.innerHTML = '<tr><td colspan="8"><div class="loading">Loading orders...</div></td></tr>';
        
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, orderBy('createdAt', 'desc'));
            const ordersSnapshot = await getDocs(q);
            
            // Clear table body
            tbody.innerHTML = '';
            
            // Update page title with count
            if (pageTitle) {
                pageTitle.textContent = `Order Management (${ordersSnapshot.size} Orders)`;
            }
            
            if (ordersSnapshot.empty) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8">
                            <div class="empty-state">
                                <i class="fas fa-shopping-cart"></i>
                                <p>No orders found</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }

            ordersSnapshot.forEach((doc, index) => {
                const order = { id: doc.id, ...doc.data() };
                if (!order.customerEmail || !order.items) return;
                
                const orderDate = order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : 
                                 order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
                const itemsDisplay = order.items.map(item => `${item.name || 'Item'} (${item.quantity || 1})`).join(', ');
                
                // Highlight pending orders
                const rowClass = order.status === 'pending' ? 'pending-order pulse' : '';
                
                const customerInfo = order.customerInfo || {};
                const firstName = customerInfo.firstName || '';
                const lastName = customerInfo.lastName || '';
                const phone = customerInfo.phone || 'N/A';
                const address = customerInfo.address || 'N/A';
                const city = customerInfo.city || 'N/A';
                
                tbody.innerHTML += `
                    <tr class="${rowClass}">
                        <td><strong>${doc.id.substring(0, 8)}...</strong></td>
                        <td>${order.customerEmail}</td>
                        <td>
                            <div class="customer-info">
                                <div><strong>${firstName} ${lastName}</strong></div>
                                <div><small>${phone}</small></div>
                                <div><small>${address}, ${city}</small></div>
                            </div>
                        </td>
                        <td title="${itemsDisplay}">${itemsDisplay.length > 50 ? itemsDisplay.substring(0, 50) + '...' : itemsDisplay}</td>
                        <td><strong>₱${(order.total || 0).toFixed(2)}</strong></td>
                        <td>
                            <select class="status-select ${order.status || 'pending'}" onchange="updateOrderStatus('${doc.id}', this.value, ${index})">
                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                                <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                            </select>
                        </td>
                        <td>${orderDate}</td>
                        <td class="actions">
                            <button class="action-btn view-btn" onclick="viewOrderDetails('${doc.id}')">
                                <i class="ri-eye-line"></i> View
                            </button>
                            <button class="action-btn delete" onclick="deleteOrder('${doc.id}', ${index})">
                                <i class="ri-delete-bin-line"></i> Delete
                            </button>
                        </td>
                    </tr>
                `;
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: #ff6b6b;">
                        Error loading orders. Please try again.
                    </td>
                </tr>
            `;
            showAdminNotification('Error loading orders', 'error');
        }
    }

    // Modal handlers
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (productModal) {
                productModal.classList.remove('show');
            }
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (productModal) {
                productModal.classList.remove('show');
            }
        });
    }

    // Product form handler
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('product-name');
            const categoryInput = document.getElementById('category');
            const priceInput = document.getElementById('price');
            const stockInput = document.getElementById('stock');
            const descriptionInput = document.getElementById('description');
            const imageInput = document.getElementById('image-url');
            
            if (!nameInput || !categoryInput || !priceInput) {
                showAdminNotification('Required form fields not found', 'error');
                return;
            }

            const formData = {
                name: nameInput.value,
                category: categoryInput.value,
                price: parseFloat(priceInput.value),
                stock: stockInput ? parseInt(stockInput.value) : 0,
                description: descriptionInput ? descriptionInput.value : '',
                image: imageInput ? imageInput.value : '',
                status: 'Available',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            try {
                // Add new product (edit functionality removed)
                await addDoc(collection(db, 'products'), {
                    ...formData,
                    id: 'PROD-' + Date.now()
                });
                showAdminNotification('Product added successfully!', 'success');

                if (productModal) {
                    productModal.classList.remove('show');
                }
                fetchProducts();
                updateDashboard();
            } catch (error) {
                console.error('Error saving product:', error);
                showAdminNotification('Error saving product. Please try again.', 'error');
            }
        });
    }

    // Close modal when clicking outside
    if (productModal) {
        productModal.addEventListener('click', (e) => {
            if (e.target === productModal) {
                productModal.classList.remove('show');
            }
        });
    }

    // Make functions globally available
    window.toggleUserStatus = async function(docId) {
        try {
            const userRef = doc(db, 'users', docId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                showAdminNotification('User not found!', 'error');
                return;
            }
            
            const user = userDoc.data();
            const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
            
            // Create confirmation modal
            const confirmModal = document.createElement('div');
            confirmModal.className = 'confirm-modal show';
            confirmModal.innerHTML = `
                <div class="confirm-modal-content">
                    <h3><i class="ri-user-settings-line"></i> ${newStatus === 'Suspended' ? 'Suspend' : 'Activate'} User</h3>
                    <p>Are you sure you want to ${newStatus === 'Suspended' ? 'suspend' : 'activate'} user <strong>${user.email}</strong>?</p>
                    <div class="modal-actions">
                        <button id="status-confirm-yes" class="btn-yes">Yes, ${newStatus === 'Suspended' ? 'Suspend' : 'Activate'}</button>
                        <button id="status-confirm-no" class="btn-no">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmModal);

            // Handle confirmation
            document.getElementById('status-confirm-yes').addEventListener('click', async () => {
                try {
                    await updateDoc(userRef, { 
                        status: newStatus,
                        statusUpdatedAt: new Date(),
                        updatedAt: new Date()
                    });
                    
                    showAdminNotification(
                        `User ${newStatus.toLowerCase()} successfully!`,
                        'success'
                    );
                    updateDashboard();
                } catch (error) {
                    console.error('Error updating user status:', error);
                    showAdminNotification('Error updating user status. Please try again.', 'error');
                }
                confirmModal.remove();
            });

            // Handle cancellation
            document.getElementById('status-confirm-no').addEventListener('click', () => {
                confirmModal.remove();
            });
            
        } catch (error) {
            console.error('Error toggling user status:', error);
            showAdminNotification('Error updating user status', 'error');
        }
    };

    // VIEW USER DETAILS FUNCTION
    window.viewUserDetails = async function(docId) {
        try {
            const userRef = doc(db, 'users', docId);
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                showAdminNotification('User not found!', 'error');
                return;
            }
            
            const user = userDoc.data();
            
            // Fetch user's orders
            const ordersRef = collection(db, 'orders');
            const userOrdersQuery = query(ordersRef, where('customerEmail', '==', user.email));
            const userOrdersSnapshot = await getDocs(userOrdersQuery);
            
            let totalSpent = 0;
            const orderHistory = [];
            
            userOrdersSnapshot.forEach((orderDoc) => {
                const orderData = orderDoc.data();
                totalSpent += orderData.total || 0;
                orderHistory.push({
                    id: orderDoc.id,
                    ...orderData
                });
            });
            
            // Create user details modal
            const detailsModal = document.createElement('div');
            detailsModal.className = 'user-details-modal show';
            detailsModal.innerHTML = `
                <div class="user-details-content">
                    <div class="user-details-header">
                        <h2><i class="ri-user-3-line"></i> User Details</h2>
                        <button class="close-details" onclick="this.closest('.user-details-modal').remove()">
                            <i class="ri-close-line"></i>
                        </button>
                    </div>
                    <div class="user-details-body">
                        <div class="user-section">
                            <h3><i class="ri-information-line"></i> Personal Information</h3>
                            <div class="user-info-grid">
                                <div><strong>Name:</strong> ${user.firstName || 'N/A'} ${user.lastName || ''}</div>
                                <div><strong>Email:</strong> ${user.email}</div>
                                <div><strong>Phone:</strong> ${user.phone || 'Not provided'}</div>
                                <div><strong>Status:</strong> <span class="status-badge ${(user.status || 'Active').toLowerCase()}">${user.status || 'Active'}</span></div>
                                <div><strong>Joined:</strong> ${user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                                <div><strong>Last Login:</strong> ${user.lastLogin ? new Date(user.lastLogin.seconds * 1000).toLocaleDateString() : 'Never'}</div>
                            </div>
                        </div>
                        
                        <div class="user-section">
                            <h3><i class="ri-shopping-cart-line"></i> Order Statistics</h3>
                            <div class="order-stats">
                                <div class="stat-card">
                                    <div class="stat-number">${userOrdersSnapshot.size}</div>
                                    <div class="stat-label">Total Orders</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-number">₱${totalSpent.toFixed(2)}</div>
                                    <div class="stat-label">Total Spent</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-number">${orderHistory.filter(o => o.status === 'delivered').length}</div>
                                    <div class="stat-label">Completed Orders</div>
                                </div>
                            </div>
                        </div>
                        
                        ${orderHistory.length > 0 ? `
                        <div class="user-section">
                            <h3><i class="ri-history-line"></i> Recent Orders</h3>
                            <div class="order-history">
                                ${orderHistory.slice(0, 5).map(order => `
                                    <div class="order-item">
                                        <div class="order-id">#${order.id.substring(0, 8)}...</div>
                                        <div class="order-date">${order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                                        <div class="order-total">₱${order.total.toFixed(2)}</div>
                                        <div class="order-status">
                                            <span class="status-badge ${order.status}">${order.status.toUpperCase()}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            
            document.body.appendChild(detailsModal);
            
        } catch (error) {
            console.error('Error loading user details:', error);
            showAdminNotification('Error loading user details', 'error');
        }
    };

    // DELETE USER FUNCTION
    window.deleteUser = function(docId) {
        const confirmModal = document.createElement('div');
        confirmModal.className = 'confirm-modal show';
        confirmModal.innerHTML = `
            <div class="confirm-modal-content">
                <h3><i class="ri-delete-bin-line"></i> Delete User</h3>
                <p>Are you sure you want to permanently delete this user? This action cannot be undone.</p>
                <div class="modal-actions">
                    <button id="delete-user-yes" class="btn-yes btn-danger">Yes, Delete</button>
                    <button id="delete-user-no" class="btn-no">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);

        document.getElementById('delete-user-yes').addEventListener('click', async () => {
            try {
                await deleteDoc(doc(db, 'users', docId));
                showAdminNotification('User deleted successfully!', 'success');
                updateDashboard();
            } catch (error) {
                console.error('Error deleting user:', error);
                showAdminNotification('Error deleting user', 'error');
            }
            confirmModal.remove();
        });

        document.getElementById('delete-user-no').addEventListener('click', () => {
            confirmModal.remove();
        });
    };

    window.deleteProduct = function(docId, index) {
        openDeleteModal('product', docId, index);
    };

    window.deleteOrder = function(docId, index) {
        openDeleteModal('order', docId, index);
    };

    // Open delete modal
    function openDeleteModal(type, docId, index) {
        deleteTarget = { type, docId, index };
        deleteType = type;

        // Customize message
        const msg = type === 'product'
            ? "Are you sure you want to delete this product?"
            : "Are you sure you want to delete this order?";

        const deleteMessageEl = document.getElementById('delete-message');
        const deleteModal = document.getElementById('delete-modal');
        
        if (deleteMessageEl) deleteMessageEl.textContent = msg;
        if (deleteModal) deleteModal.classList.add('show');
    }

    // Delete Yes/No handlers
    const deleteYes = document.getElementById('delete-yes');
    const deleteNo = document.getElementById('delete-no');
    
    if (deleteYes) {
        deleteYes.addEventListener('click', async () => {
            if (!deleteTarget) return;

            try {
                if (deleteType === 'product') {
                    await deleteDoc(doc(db, 'products', deleteTarget.docId));
                    showAdminNotification('Product deleted successfully!', 'success');
                    fetchProducts();
                    updateDashboard();
                } else if (deleteType === 'order') {
                    await deleteDoc(doc(db, 'orders', deleteTarget.docId));
                    showAdminNotification('Order deleted successfully!', 'success');
                    fetchOrders();
                    updateDashboard();
                }
            } catch (error) {
                console.error('Error deleting:', error);
                showAdminNotification('Error deleting item', 'error');
            }

            const deleteModal = document.getElementById('delete-modal');
            if (deleteModal) deleteModal.classList.remove('show');
            deleteTarget = null;
        });
    }

    if (deleteNo) {
        deleteNo.addEventListener('click', () => {
            const deleteModal = document.getElementById('delete-modal');
            if (deleteModal) deleteModal.classList.remove('show');
            deleteTarget = null;
        });
    }

    // ENHANCED CONFIRM ORDER FUNCTION
    window.confirmOrder = async function(docId, index) {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'confirm-modal show';
        modal.innerHTML = `
            <div class="confirm-modal-content">
                <p>Are you sure you want to confirm this order?</p>
                <div class="modal-actions">
                    <button id="confirm-yes" class="btn-yes">Yes</button>
                    <button id="confirm-no" class="btn-no">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Handle Yes
        document.getElementById('confirm-yes').addEventListener('click', async () => {
            try {
                const orderRef = doc(db, 'orders', docId);
                await updateDoc(orderRef, {
                    status: 'confirmed',
                    confirmedAt: new Date(),
                    updatedAt: new Date()
                });

                showAdminNotification('Order confirmed successfully! Customer can now see it in their order history.', 'success');
                fetchOrders();
                updateDashboard();
            } catch (error) {
                console.error('Error confirming order:', error);
                showAdminNotification('Error confirming order. Please try again.', 'error');
            }
            modal.remove();
        });

        // Handle No
        document.getElementById('confirm-no').addEventListener('click', () => {
            modal.remove();
        });

        // Close when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    };

    window.updateOrderStatus = async function(docId, status, index) {
        try {
            const orderRef = doc(db, 'orders', docId);
            const updateData = {
                status: status,
                updatedAt: new Date()
            };
            
            // Add timestamp for specific statuses
            if (status === 'confirmed') {
                updateData.confirmedAt = new Date();
            } else if (status === 'processing') {
                updateData.processingAt = new Date();
            } else if (status === 'shipped') {
                updateData.shippedAt = new Date();
            } else if (status === 'delivered') {
                updateData.deliveredAt = new Date();
            } else if (status === 'cancelled') {
                updateData.cancelledAt = new Date();
            }
            
            await updateDoc(orderRef, updateData);
            showAdminNotification(
                `Order status updated to ${status.toUpperCase()}`,
                'success'
            );
            fetchOrders();
            updateDashboard();
            
        } catch (error) {
            console.error('Error updating order status:', error);
            showAdminNotification('Error updating order status', 'error');
        }
    };

    // View order details function - ENHANCED
    window.viewOrderDetails = async function(docId) {
        try {
            const orderRef = doc(db, 'orders', docId);
            const orderDoc = await getDoc(orderRef);
            
            if (!orderDoc.exists()) {
                showAdminNotification('Order not found!', 'error');
                return;
            }
            
            const order = orderDoc.data();
            
            // Create and show order details modal
            const detailsModal = document.createElement('div');
            detailsModal.className = 'order-details-modal show';
            
            const customerInfo = order.customerInfo || {};
            const items = order.items || [];
            
            detailsModal.innerHTML = `
            <div class="order-details-content">
                <div class="order-details-header">
                    <h2><i class="ri-file-list-3-line"></i> Order Details - ${docId.substring(0, 8)}...</h2>
                    <button class="close-details" onclick="this.closest('.order-details-modal').remove()">
                        <i class="ri-close-line"></i>
                    </button>
                </div>
                <div class="order-details-body">
                    <div class="order-section">
                        <h3><i class="ri-user-3-line"></i> Customer Information</h3>
                        <p><strong>Name:</strong> ${customerInfo.firstName || 'N/A'} ${customerInfo.lastName || ''}</p>
                        <p><strong>Email:</strong> ${customerInfo.email || order.customerEmail || 'N/A'}</p>
                        <p><strong>Phone:</strong> ${customerInfo.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> ${customerInfo.address || 'N/A'}, ${customerInfo.city || 'N/A'}, ${customerInfo.province || 'N/A'} ${customerInfo.zipCode || ''}</p>
                    </div>
                    <div class="order-section">
                        <h3><i class="ri-shopping-bag-3-line"></i> Order Items</h3>
                        <div class="order-items">
                            ${items.map(item => `
                                <div class="order-item">
                                    <img src="${item.image || ''}" alt="${item.name || 'Item'}" width="50" height="50">
                                    <div class="item-details">
                                        <div><strong>${item.name || 'Item'}</strong></div>
                                        <div>Color: ${item.color || 'N/A'}, Size: ${item.size || 'N/A'}</div>
                                        <div>Quantity: ${item.quantity || 1} × ₱${item.price || 0} = ₱${((item.quantity || 1) * (item.price || 0)).toFixed(2)}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="order-section">
                        <h3><i class="ri-wallet-3-line"></i> Order Summary</h3>
                        <p><strong>Subtotal:</strong> ₱${(order.subtotal || 0).toFixed(2)}</p>
                        <p><strong>Shipping:</strong> ₱${(order.shipping || 0).toFixed(2)}</p>
                        <p><strong>Total:</strong> ₱${(order.total || 0).toFixed(2)}</p>
                        <p><strong>Payment Method:</strong> ${(order.paymentMethod || 'N/A').toUpperCase()}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${order.status || 'pending'}">${(order.status || 'pending').toUpperCase()}</span></p>
                        <p><strong>Order Date:</strong> ${order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleString() : order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                    </div>
                </div>
                <div class="order-details-footer">
                    ${order.status === 'pending' ? 
                        `<button class="action-btn confirm-btn" onclick="confirmOrderFromModal('${docId}')">
                            <i class="ri-check-double-line"></i> Confirm Order
                        </button>` : ''
                    }
                </div>
            </div>
            `;
            
            document.body.appendChild(detailsModal);
        } catch (error) {
            console.error('Error loading order details:', error);
            showAdminNotification('Error loading order details', 'error');
        }
    };

    // Confirm order from modal
    window.confirmOrderFromModal = async function(docId) {
        await window.confirmOrder(docId);
        const modal = document.querySelector('.order-details-modal');
        if (modal) {
            modal.remove();
        }
    };

    // Export Orders to CSV
    async function exportOrdersToCSV() {
        try {
            const ordersRef = collection(db, 'orders');
            const q = query(ordersRef, orderBy('createdAt', 'desc'));
            const ordersSnapshot = await getDocs(q);

            if (ordersSnapshot.empty) {
                showAdminNotification('No orders to export', 'warning');
                return;
            }

            // Prepare CSV content
            let csvContent = 'Order ID,Email,Name,Items,Total,Status,Order Date\n';
            ordersSnapshot.forEach(doc => {
                const order = { id: doc.id, ...doc.data() };
                const customerInfo = order.customerInfo || {};
                const itemsDisplay = order.items ? order.items.map(item => `${item.name || 'Item'} (${item.quantity || 1})`).join('; ') : '';
                const orderDate = order.orderDate ? new Date(order.orderDate.seconds * 1000).toLocaleDateString() : 
                                 order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
                const row = [
                    `"${doc.id}"`,
                    `"${order.customerEmail || 'N/A'}"`,
                    `"${customerInfo.firstName || ''} ${customerInfo.lastName || ''}"`,
                    `"${itemsDisplay.replace(/"/g, '""')}"`,
                    order.total || 0,
                    order.status || 'pending',
                    `"${orderDate}"`
                ].join(',');
                csvContent += row + '\n';
            });

            // Create and download CSV
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);

            showAdminNotification('Orders exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting orders:', error);
            showAdminNotification('Error exporting orders', 'error');
        }
    }

    // Bulk Delete Users
    async function bulkDeleteUsers() {
        const checkboxes = document.querySelectorAll('.user-checkbox:checked');
        if (checkboxes.length === 0) {
            showAdminNotification('No users selected for deletion', 'warning');
            return;
        }

        // Create confirmation modal
        const confirmModal = document.createElement('div');
        confirmModal.className = 'confirm-modal show';
        confirmModal.innerHTML = `
            <div class="confirm-modal-content">
                <h3><i class="ri-delete-bin-line"></i> Delete ${checkboxes.length} Users</h3>
                <p>Are you sure you want to permanently delete ${checkboxes.length} selected users? This action cannot be undone.</p>
                <div class="modal-actions">
                    <button id="bulk-delete-yes" class="btn-yes btn-danger">Yes, Delete</button>
                    <button id="bulk-delete-no" class="btn-no">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(confirmModal);

        document.getElementById('bulk-delete-yes').addEventListener('click', async () => {
            try {
                const deletePromises = Array.from(checkboxes).map(checkbox => {
                    const userId = checkbox.dataset.userId;
                    return deleteDoc(doc(db, 'users', userId));
                });

                await Promise.all(deletePromises);
                showAdminNotification(`${checkboxes.length} users deleted successfully!`, 'success');
                fetchUsers();
                updateDashboard();
            } catch (error) {
                console.error('Error deleting users:', error);
                showAdminNotification('Error deleting users', 'error');
            }
            confirmModal.remove();
        });

        document.getElementById('bulk-delete-no').addEventListener('click', () => {
            confirmModal.remove();
        });
    }

    // Close with animation
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-details')) {
            const modal = e.target.closest('.order-details-modal');
            if (modal) {
                modal.classList.add('closing');
                setTimeout(() => modal.remove(), 300);
            }
        }
    });
    
    // Initialize dashboard
    updateDashboard();
}); 



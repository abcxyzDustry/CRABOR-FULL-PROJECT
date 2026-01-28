// Main JavaScript for Crabor Platform

class CraborApp {
    constructor() {
        this.init();
    }

    init() {
        this.initializeComponents();
        this.setupEventListeners();
        this.checkAuthStatus();
        this.loadUserData();
    }

    initializeComponents() {
        // Initialize tooltips
        this.initTooltips();
        
        // Initialize modals
        this.initModals();
        
        // Initialize notifications
        this.initNotifications();
        
        // Initialize forms
        this.initForms();
    }

    setupEventListeners() {
        // Setup global event listeners
        document.addEventListener('click', this.handleGlobalClick.bind(this));
        document.addEventListener('submit', this.handleGlobalSubmit.bind(this));
        
        // Setup keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }

    initTooltips() {
        const tooltips = document.querySelectorAll('[data-toggle="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
    }

    initModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('hidden.bs.modal', () => {
                const form = modal.querySelector('form');
                if (form) form.reset();
            });
        });
    }

    initNotifications() {
        // Initialize toast notifications
        const toastElList = document.querySelectorAll('.toast');
        const toastList = [...toastElList].map(toastEl => new bootstrap.Toast(toastEl));
    }

    initForms() {
        // Initialize form validation
        const forms = document.querySelectorAll('.needs-validation');
        forms.forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                form.classList.add('was-validated');
            }, false);
        });
    }

    async checkAuthStatus() {
        try {
            const token = localStorage.getItem('crabor_token');
            if (token) {
                const response = await fetch('/api/auth/verify', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const user = await response.json();
                    this.updateUIForLoggedInUser(user);
                } else {
                    localStorage.removeItem('crabor_token');
                    localStorage.removeItem('crabor_user');
                }
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }

    async loadUserData() {
        const userData = localStorage.getItem('crabor_user');
        if (userData) {
            const user = JSON.parse(userData);
            this.updateUIForLoggedInUser(user);
            
            // Load user-specific data based on role
            switch (user.role) {
                case 'customer':
                    await this.loadCustomerData(user);
                    break;
                case 'shipper':
                    await this.loadShipperData(user);
                    break;
                case 'partner':
                    await this.loadPartnerData(user);
                    break;
                case 'admin':
                    await this.loadAdminData(user);
                    break;
            }
        }
    }

    async loadCustomerData(user) {
        try {
            // Load cart items
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            this.updateCartCount(cart.length);
            
            // Load recent orders
            const response = await fetch(`/api/orders/user/${user.id}?limit=5`);
            if (response.ok) {
                const orders = await response.json();
                this.displayRecentOrders(orders);
            }
        } catch (error) {
            console.error('Failed to load customer data:', error);
        }
    }

    async loadShipperData(user) {
        try {
            // Load shipper stats
            const response = await fetch(`/api/shippers/${user.id}/stats`);
            if (response.ok) {
                const stats = await response.json();
                this.updateShipperStats(stats);
            }
            
            // Load available orders
            await this.loadAvailableOrders();
        } catch (error) {
            console.error('Failed to load shipper data:', error);
        }
    }

    async loadPartnerData(user) {
        try {
            // Load restaurant stats
            const response = await fetch(`/api/partners/${user.id}/stats`);
            if (response.ok) {
                const stats = await response.json();
                this.updatePartnerStats(stats);
            }
            
            // Load recent orders
            const ordersResponse = await fetch(`/api/orders/partner/${user.id}?limit=10`);
            if (ordersResponse.ok) {
                const orders = await ordersResponse.json();
                this.displayPartnerOrders(orders);
            }
        } catch (error) {
            console.error('Failed to load partner data:', error);
        }
    }

    async loadAdminData(user) {
        try {
            // Load platform stats
            const response = await fetch('/api/admin/stats');
            if (response.ok) {
                const stats = await response.json();
                this.updateAdminStats(stats);
            }
            
            // Load recent activity
            await this.loadRecentActivity();
        } catch (error) {
            console.error('Failed to load admin data:', error);
        }
    }

    updateUIForLoggedInUser(user) {
        // Update navigation
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        
        if (loginBtn) loginBtn.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'block';
            
            // Update user info in menu
            const userName = userMenu.querySelector('.user-name');
            const userAvatar = userMenu.querySelector('.user-avatar');
            
            if (userName) userName.textContent = user.name;
            if (userAvatar) {
                if (user.avatar) {
                    userAvatar.innerHTML = `<img src="${user.avatar}" alt="${user.name}">`;
                } else {
                    userAvatar.textContent = user.name.charAt(0).toUpperCase();
                }
            }
        }
        
        // Update role-specific UI elements
        this.updateRoleSpecificUI(user.role);
    }

    updateRoleSpecificUI(role) {
        // Hide/show elements based on role
        const roleElements = document.querySelectorAll(`[data-role]`);
        roleElements.forEach(el => {
            const allowedRoles = el.dataset.role.split(' ');
            if (allowedRoles.includes(role)) {
                el.style.display = '';
            } else {
                el.style.display = 'none';
            }
        });
    }

    updateCartCount(count) {
        const cartCountElements = document.querySelectorAll('.cart-count');
        cartCountElements.forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'flex' : 'none';
        });
    }

    displayRecentOrders(orders) {
        // Implement recent orders display logic
        console.log('Recent orders:', orders);
    }

    updateShipperStats(stats) {
        // Implement shipper stats update logic
        console.log('Shipper stats:', stats);
    }

    updatePartnerStats(stats) {
        // Implement partner stats update logic
        console.log('Partner stats:', stats);
    }

    updateAdminStats(stats) {
        // Implement admin stats update logic
        console.log('Admin stats:', stats);
    }

    async loadAvailableOrders() {
        try {
            const response = await fetch('/api/orders/available');
            if (response.ok) {
                const orders = await response.json();
                this.displayAvailableOrders(orders);
            }
        } catch (error) {
            console.error('Failed to load available orders:', error);
        }
    }

    async loadRecentActivity() {
        try {
            const response = await fetch('/api/admin/activity');
            if (response.ok) {
                const activity = await response.json();
                this.displayRecentActivity(activity);
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error);
        }
    }

    displayAvailableOrders(orders) {
        // Implement available orders display logic
        console.log('Available orders:', orders);
    }

    displayPartnerOrders(orders) {
        // Implement partner orders display logic
        console.log('Partner orders:', orders);
    }

    displayRecentActivity(activity) {
        // Implement recent activity display logic
        console.log('Recent activity:', activity);
    }

    handleGlobalClick(event) {
        // Handle global click events
        const target = event.target;
        
        // Handle logout
        if (target.closest('[data-action="logout"]')) {
            event.preventDefault();
            this.logout();
        }
        
        // Handle theme toggle
        if (target.closest('[data-action="toggle-theme"]')) {
            event.preventDefault();
            this.toggleTheme();
        }
        
        // Handle sidebar toggle on mobile
        if (target.closest('[data-action="toggle-sidebar"]')) {
            event.preventDefault();
            this.toggleSidebar();
        }
    }

    handleGlobalSubmit(event) {
        const form = event.target;
        
        if (form.id === 'loginForm') {
            event.preventDefault();
            this.handleLogin(form);
        }
        
        if (form.id === 'registerForm') {
            event.preventDefault();
            this.handleRegister(form);
        }
    }

    handleKeyboardShortcuts(event) {
        // Global keyboard shortcuts
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case 'k':
                    event.preventDefault();
                    this.focusSearch();
                    break;
                case 'l':
                    event.preventDefault();
                    this.toggleTheme();
                    break;
                case 'm':
                    event.preventDefault();
                    this.toggleSidebar();
                    break;
            }
        }
    }

    async handleLogin(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Store token and user data
                localStorage.setItem('crabor_token', result.token);
                localStorage.setItem('crabor_user', JSON.stringify(result.user));
                
                // Show success message
                this.showNotification('Đăng nhập thành công', 'success');
                
                // Reload page to update UI
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Đăng nhập thất bại', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Đã xảy ra lỗi khi đăng nhập', 'error');
        }
    }

    async handleRegister(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Show success message
                this.showNotification('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
                
                // Switch to login form
                this.switchToLogin();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Đăng ký thất bại', 'error');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showNotification('Đã xảy ra lỗi khi đăng ký', 'error');
        }
    }

    logout() {
        // Clear local storage
        localStorage.removeItem('crabor_token');
        localStorage.removeItem('crabor_user');
        localStorage.removeItem('cart');
        
        // Show notification
        this.showNotification('Đã đăng xuất thành công', 'success');
        
        // Redirect to home page
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }

    toggleTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        // Update theme
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // Show notification
        this.showNotification(`Đã chuyển sang chế độ ${newTheme === 'dark' ? 'tối' : 'sáng'}`, 'info');
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }

    focusSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }

    switchToLogin() {
        const registerForm = document.getElementById('registerForm');
        const loginForm = document.getElementById('loginForm');
        const switchText = document.querySelector('.switch-form');
        
        if (registerForm && loginForm && switchText) {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            switchText.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `toast ${type}`;
        notification.innerHTML = `
            <div class="toast-icon">
                ${this.getNotificationIcon(type)}
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;
        
        // Add to notification container
        const container = document.getElementById('notificationContainer') || this.createNotificationContainer();
        container.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
        
        // Close button handler
        notification.querySelector('.toast-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    getNotificationIcon(type) {
        const icons = {
            success: '✓',
            error: '✗',
            warning: '⚠',
            info: 'ℹ'
        };
        return icons[type] || 'ℹ';
    }

    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notificationContainer';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(container);
        return container;
    }

    // API helper methods
    async apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('crabor_token');
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };
        
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(endpoint, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                this.logout();
                throw new Error('Unauthorized');
            }
            const error = await response.json();
            throw new Error(error.message || 'Request failed');
        }
        
        return response.json();
    }

    // Cart management methods
    addToCart(product) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
        
        this.showNotification(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
    }

    removeFromCart(productId) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart = cart.filter(item => item.id !== productId);
        
        localStorage.setItem('cart', JSON.stringify(cart));
        this.updateCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
        
        this.showNotification('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
    }

    updateCartItemQuantity(productId, quantity) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const item = cart.find(item => item.id === productId);
        
        if (item) {
            if (quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                item.quantity = quantity;
                localStorage.setItem('cart', JSON.stringify(cart));
                this.updateCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
            }
        }
    }

    getCartTotal() {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    clearCart() {
        localStorage.removeItem('cart');
        this.updateCartCount(0);
    }

    // Order management
    async createOrder(orderData) {
        try {
            const response = await this.apiRequest('/api/orders/create', {
                method: 'POST',
                body: JSON.stringify(orderData)
            });
            
            this.showNotification('Đặt hàng thành công', 'success');
            this.clearCart();
            
            return response;
        } catch (error) {
            this.showNotification('Đặt hàng thất bại: ' + error.message, 'error');
            throw error;
        }
    }

    async getOrder(orderId) {
        try {
            return await this.apiRequest(`/api/orders/${orderId}`);
        } catch (error) {
            console.error('Failed to get order:', error);
            throw error;
        }
    }

    async cancelOrder(orderId, reason) {
        try {
            const response = await this.apiRequest(`/api/orders/${orderId}/cancel`, {
                method: 'POST',
                body: JSON.stringify({ reason })
            });
            
            this.showNotification('Đã hủy đơn hàng', 'info');
            return response;
        } catch (error) {
            this.showNotification('Hủy đơn hàng thất bại: ' + error.message, 'error');
            throw error;
        }
    }

    // Product management
    async getProducts(filters = {}) {
        const query = new URLSearchParams(filters).toString();
        return await this.apiRequest(`/api/products?${query}`);
    }

    async getProduct(productId) {
        return await this.apiRequest(`/api/products/${productId}`);
    }

    // User management
    async updateProfile(userData) {
        try {
            const response = await this.apiRequest('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify(userData)
            });
            
            // Update local storage
            const currentUser = JSON.parse(localStorage.getItem('crabor_user'));
            localStorage.setItem('crabor_user', JSON.stringify({
                ...currentUser,
                ...userData
            }));
            
            this.showNotification('Cập nhật thông tin thành công', 'success');
            return response;
        } catch (error) {
            this.showNotification('Cập nhật thất bại: ' + error.message, 'error');
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword) {
        try {
            const response = await this.apiRequest('/api/users/change-password', {
                method: 'POST',
                body: JSON.stringify({ currentPassword, newPassword })
            });
            
            this.showNotification('Đổi mật khẩu thành công', 'success');
            return response;
        } catch (error) {
            this.showNotification('Đổi mật khẩu thất bại: ' + error.message, 'error');
            throw error;
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.craborApp = new CraborApp();
    
    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Initialize Socket.io if needed
    if (typeof io !== 'undefined') {
        window.socket = io();
        
        // Handle socket events
        socket.on('connect', () => {
            console.log('Connected to server');
            
            // Join user room if logged in
            const user = localStorage.getItem('crabor_user');
            if (user) {
                socket.emit('join', JSON.parse(user).id);
            }
        });
        
        socket.on('orderUpdate', (data) => {
            craborApp.showNotification(`Cập nhật đơn hàng: ${data.message}`, 'info');
            
            // Update UI if needed
            if (window.updateOrderStatus) {
                window.updateOrderStatus(data.orderId, data.status);
            }
        });
        
        socket.on('newOrder', (data) => {
            craborApp.showNotification('Có đơn hàng mới!', 'info');
            
            // Update UI if needed
            if (window.addNewOrder) {
                window.addNewOrder(data);
            }
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CraborApp;
}

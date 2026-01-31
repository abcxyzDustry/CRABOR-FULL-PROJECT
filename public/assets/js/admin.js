// admin.js - Admin dashboard functionality
class AdminManager {
    constructor() {
        this.stats = {};
        this.initAdminEvents();
        this.loadDashboardStats();
        this.loadRecentActivity();
        this.initDataTables();
        this.initRealTimeUpdates();
    }

    initAdminEvents() {
        // Tab switching
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-item')) {
                const navItem = e.target.closest('.nav-item');
                const tabId = navItem.dataset.tab;
                this.switchTab(tabId);
            }
            
            if (e.target.closest('[data-partner-tab]')) {
                const tab = e.target.closest('[data-partner-tab]');
                const tabId = tab.dataset.partnerTab;
                this.switchPartnerTab(tabId);
            }
            
            if (e.target.closest('[data-shipper-tab]')) {
                const tab = e.target.closest('[data-shipper-tab]');
                const tabId = tab.dataset.shipperTab;
                this.switchShipperTab(tabId);
            }
            
            if (e.target.closest('[data-setting-tab]')) {
                const tab = e.target.closest('[data-setting-tab]');
                const tabId = tab.dataset.settingTab;
                this.switchSettingTab(tabId);
            }
        });

        // Banner modal
        const addBannerBtn = document.getElementById('addBannerBtn');
        const closeBannerModal = document.getElementById('closeBannerModal');
        const bannerForm = document.getElementById('bannerForm');
        
        if (addBannerBtn) {
            addBannerBtn.addEventListener('click', () => {
                this.showBannerModal();
            });
        }
        
        if (closeBannerModal) {
            closeBannerModal.addEventListener('click', () => {
                this.hideBannerModal();
            });
        }
        
        if (bannerForm) {
            bannerForm.addEventListener('submit', this.handleBannerCreate.bind(this));
        }

        // User actions
        document.addEventListener('click', (e) => {
            if (e.target.closest('.user-action-btn')) {
                const button = e.target.closest('.user-action-btn');
                const action = button.dataset.action;
                const userId = button.dataset.userId;
                
                this.handleUserAction(userId, action);
            }
            
            // Shipper approval
            if (e.target.closest('.approve-shipper-btn')) {
                const button = e.target.closest('.approve-shipper-btn');
                const registrationId = button.dataset.registrationId;
                this.approveShipper(registrationId);
            }
            
            // Partner actions
            if (e.target.closest('.partner-action-btn')) {
                const button = e.target.closest('.partner-action-btn');
                const action = button.dataset.action;
                const partnerId = button.dataset.partnerId;
                
                this.handlePartnerAction(partnerId, action);
            }
            
            // Banner actions
            if (e.target.closest('.banner-action-btn')) {
                const button = e.target.closest('.banner-action-btn');
                const action = button.dataset.action;
                const bannerId = button.dataset.bannerId;
                
                this.handleBannerAction(bannerId, action);
            }
        });

        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', this.handleSettingsSave.bind(this));
        }

        // Date range filters
        const dateRangeInputs = document.querySelectorAll('.date-range-input');
        dateRangeInputs.forEach(input => {
            input.addEventListener('change', this.handleDateRangeChange.bind(this));
        });

        // Export buttons
        const exportButtons = document.querySelectorAll('.export-btn');
        exportButtons.forEach(btn => {
            btn.addEventListener('click', this.handleExport.bind(this));
        });
    }

    async loadDashboardStats() {
        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch('/api/admin/stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                this.stats = await response.json();
                this.updateDashboardStats(this.stats);
            }
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            // Use sample data for demo
            this.updateDashboardStats(this.getSampleStats());
        }
    }

    updateDashboardStats(stats) {
        // Update stat cards
        const statCards = {
            'totalOrders': document.querySelector('.stat-total-orders'),
            'totalRevenue': document.querySelector('.stat-total-revenue'),
            'totalUsers': document.querySelector('.stat-total-users'),
            'totalCommission': document.querySelector('.stat-total-commission'),
            'activePartners': document.querySelector('.stat-active-partners'),
            'activeShippers': document.querySelector('.stat-active-shippers'),
            'todayOrders': document.querySelector('.stat-today-orders'),
            'todayRevenue': document.querySelector('.stat-today-revenue')
        };

        Object.keys(statCards).forEach(key => {
            const element = statCards[key];
            if (element && stats[key] !== undefined) {
                const valueElement = element.querySelector('.stat-value');
                if (valueElement) {
                    if (key.includes('Revenue') || key.includes('Commission')) {
                        valueElement.textContent = this.formatCurrency(stats[key]);
                    } else {
                        valueElement.textContent = this.formatNumber(stats[key]);
                    }
                }
            }
        });

        // Update charts if they exist
        this.updateRevenueChart(stats.revenueChartData);
        this.updateOrdersChart(stats.ordersChartData);
        this.updateUserGrowthChart(stats.userGrowthData);
    }

    async loadRecentActivity() {
        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch('/api/admin/activity', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const activity = await response.json();
                this.displayRecentActivity(activity);
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error);
        }
    }

    displayRecentActivity(activities) {
        const container = document.getElementById('recentActivity');
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = '<p class="text-muted">Không có hoạt động gần đây.</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">${this.formatTimeAgo(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    initDataTables() {
        // Initialize user table
        this.initUserTable();
        
        // Initialize orders table
        this.initOrdersTable();
        
        // Initialize partners table
        this.initPartnersTable();
        
        // Initialize shippers table
        this.initShippersTable();
        
        // Initialize transactions table
        this.initTransactionsTable();
    }

    async initUserTable() {
        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const users = await response.json();
                this.displayUserTable(users);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    displayUserTable(users) {
        const container = document.getElementById('userTableBody');
        if (!container) return;

        container.innerHTML = users.map(user => `
            <tr>
                <td>${user._id.substring(0, 8)}</td>
                <td>
                    <div class="user-info">
                        <div class="user-avatar-small">
                            ${user.avatar ? 
                                `<img src="${user.avatar}" alt="${user.name}">` : 
                                (user.name || user.email).charAt(0).toUpperCase()
                            }
                        </div>
                        <div class="user-details-small">
                            <div class="user-name-small">${user.name || 'Chưa đặt tên'}</div>
                            <div class="user-email-small">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>${user.phone || 'Chưa cập nhật'}</td>
                <td>
                    <span class="badge ${this.getRoleBadgeClass(user.role)}">
                        ${this.getRoleText(user.role)}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                        ${user.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                </td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>
                    <div class="table-actions-cell">
                        <button class="btn btn-sm btn-primary user-action-btn" 
                                data-action="view" 
                                data-user-id="${user._id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        
                        ${user.isActive ? `
                            <button class="btn btn-sm btn-warning user-action-btn" 
                                    data-action="block" 
                                    data-user-id="${user._id}">
                                <i class="fas fa-ban"></i>
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-success user-action-btn" 
                                    data-action="unblock" 
                                    data-user-id="${user._id}">
                                <i class="fas fa-check"></i>
                            </button>
                        `}
                        
                        <button class="btn btn-sm btn-danger user-action-btn" 
                                data-action="delete" 
                                data-user-id="${user._id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async handleUserAction(userId, action) {
        if (action === 'delete' && !confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            return;
        }

        if (action === 'block' && !confirm('Bạn có chắc chắn muốn khóa tài khoản này?')) {
            return;
        }

        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch(`/api/admin/users/${userId}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                if (window.craborApp && window.craborApp.showNotification) {
                    window.craborApp.showNotification(result.message || 'Thao tác thành công', 'success');
                }
                
                // Reload user table
                this.initUserTable();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Thao tác thất bại');
            }
        } catch (error) {
            console.error('User action failed:', error);
            if (window.craborApp && window.craborApp.showNotification) {
                window.craborApp.showNotification(error.message, 'error');
            }
        }
    }

    async approveShipper(registrationId) {
        if (!confirm('Xác nhận duyệt đăng ký shipper này?')) return;

        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch(`/api/admin/shippers/${registrationId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                
                if (window.craborApp && window.craborApp.showNotification) {
                    window.craborApp.showNotification('Đã duyệt shipper thành công', 'success');
                }
                
                // Reload shipper registrations
                this.loadShipperRegistrations();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Duyệt shipper thất bại');
            }
        } catch (error) {
            console.error('Shipper approval failed:', error);
            if (window.craborApp && window.craborApp.showNotification) {
                window.craborApp.showNotification(error.message, 'error');
            }
        }
    }

    switchTab(tabId) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        
        const activeNav = document.querySelector(`[data-tab="${tabId}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
        
        // Load data for this tab if needed
        this.loadTabData(tabId);
    }

    loadTabData(tabId) {
        switch(tabId) {
            case 'users':
                this.initUserTable();
                break;
            case 'partners':
                this.loadPartners();
                break;
            case 'shippers':
                this.loadShipperRegistrations();
                break;
            case 'orders':
                this.loadOrders();
                break;
            case 'finance':
                this.loadFinancialData();
                break;
            case 'banners':
                this.loadBanners();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    showBannerModal() {
        const modal = document.getElementById('bannerModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideBannerModal() {
        const modal = document.getElementById('bannerModal');
        if (modal) {
            modal.style.display = 'none';
            const form = document.getElementById('bannerForm');
            if (form) form.reset();
        }
    }

    async handleBannerCreate(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tạo...';
        submitBtn.disabled = true;

        try {
            const token = localStorage.getItem('crabor_token');
            const response = await fetch('/api/admin/banners', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                
                if (window.craborApp && window.craborApp.showNotification) {
                    window.craborApp.showNotification('Tạo banner thành công', 'success');
                }
                
                this.hideBannerModal();
                this.loadBanners();
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Tạo banner thất bại');
            }
        } catch (error) {
            console.error('Banner creation failed:', error);
            if (window.craborApp && window.craborApp.showNotification) {
                window.craborApp.showNotification(error.message, 'error');
            }
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    initRealTimeUpdates() {
        if (window.socket) {
            window.socket.on('newOrderNotification', (data) => {
                this.handleNewOrderNotification(data);
            });
            
            window.socket.on('userRegistered', (data) => {
                this.handleUserRegistered(data);
            });
            
            window.socket.on('shipperRegistered', (data) => {
                this.handleShipperRegistered(data);
            });
        }
    }

    handleNewOrderNotification(data) {
        // Update stats
        if (this.stats) {
            this.stats.todayOrders = (this.stats.todayOrders || 0) + 1;
            this.stats.todayRevenue = (this.stats.todayRevenue || 0) + data.total;
            this.updateDashboardStats(this.stats);
        }
        
        // Add to recent activity
        this.addRecentActivity({
            type: 'order',
            title: 'Đơn hàng mới',
            description: `Đơn hàng #${data.orderNumber} - ${this.formatCurrency(data.total)}`,
            timestamp: new Date().toISOString()
        });
    }

    addRecentActivity(activity) {
        const container = document.getElementById('recentActivity');
        if (!container) return;
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon">
                <i class="fas ${this.getActivityIcon(activity.type)}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-title">${activity.title}</div>
                <div class="activity-description">${activity.description}</div>
                <div class="activity-time">${this.formatTimeAgo(activity.timestamp)}</div>
            </div>
        `;
        
        container.insertBefore(activityItem, container.firstChild);
        
        // Limit to 10 activities
        if (container.children.length > 10) {
            container.removeChild(container.lastChild);
        }
    }

    getActivityIcon(type) {
        const icons = {
            'order': 'fa-shopping-bag',
            'user': 'fa-user-plus',
            'shipper': 'fa-motorcycle',
            'partner': 'fa-store',
            'payment': 'fa-money-bill-wave',
            'system': 'fa-cog'
        };
        return icons[type] || 'fa-info-circle';
    }

    getRoleBadgeClass(role) {
        const classes = {
            'admin': 'badge-danger',
            'partner': 'badge-warning',
            'shipper': 'badge-info',
            'customer': 'badge-success'
        };
        return classes[role] || 'badge-secondary';
    }

    getRoleText(role) {
        const texts = {
            'admin': 'Quản trị viên',
            'partner': 'Đối tác',
            'shipper': 'Shipper',
            'customer': 'Khách hàng'
        };
        return texts[role] || role;
    }

    getSampleStats() {
        return {
            totalOrders: 1250,
            totalRevenue: 187500000,
            totalUsers: 5240,
            totalCommission: 37500000,
            activePartners: 150,
            activeShippers: 250,
            todayOrders: 42,
            todayRevenue: 8250000
        };
    }

    formatCurrency(amount) {
        if (amount >= 1000000) {
            return (amount / 1000000).toFixed(1) + 'M';
        } else if (amount >= 1000) {
            return (amount / 1000).toFixed(0) + 'K';
        }
        return amount.toLocaleString();
    }

    formatNumber(num) {
        return num.toLocaleString();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).format(date);
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (minutes < 1) return 'Vừa xong';
        if (minutes < 60) return `${minutes} phút trước`;
        if (hours < 24) return `${hours} giờ trước`;
        if (days < 7) return `${days} ngày trước`;
        
        return this.formatDate(timestamp);
    }
}

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminManager = new AdminManager();
});

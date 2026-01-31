// orders.js - Order management functionality
class OrderManager {
    constructor() {
        this.currentOrders = [];
        this.initOrderEvents();
        this.loadUserOrders();
    }

    initOrderEvents() {
        // Order status tabs
        document.addEventListener('click', (e) => {
            if (e.target.dataset.orderTab) {
                const tabId = e.target.dataset.orderTab;
                this.switchOrderTab(tabId);
            }
        });

        // Order action buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.order-action-btn')) {
                const button = e.target.closest('.order-action-btn');
                const action = button.dataset.action;
                const orderId = button.dataset.orderId;
                
                this.handleOrderAction(orderId, action);
            }
        });

        // Listen for socket order updates
        if (window.socket) {
            window.socket.on('orderUpdate', (data) => {
                this.handleOrderUpdate(data);
            });
            
            window.socket.on('newOrder', (data) => {
                if (window.addNewOrder) {
                    window.addNewOrder(data);
                }
            });
        }
    }

    async loadUserOrders() {
        try {
            const token = localStorage.getItem('crabor_token');
            if (!token) return;

            const user = JSON.parse(localStorage.getItem('crabor_user'));
            if (!user) return;

            let endpoint = '';
            switch(user.role) {
                case 'customer':
                    endpoint = `/api/orders/user/${user.id}`;
                    break;
                case 'partner':
                    endpoint = `/api/orders/partner/${user.id}`;
                    break;
                case 'shipper':
                    endpoint = `/api/orders/shipper/${user.id}`;
                    break;
                case 'admin':
                    endpoint = `/api/orders`;
                    break;
            }

            if (endpoint) {
                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    this.currentOrders = await response.json();
                    this.displayOrders(this.currentOrders);
                }
            }
        } catch (error) {
            console.error('Failed to load orders:', error);
        }
    }

    displayOrders(orders) {
        // For customer dashboard
        const recentOrdersContainer = document.getElementById('recentOrders');
        if (recentOrdersContainer) {
            this.displayRecentOrders(orders.slice(0, 5));
        }

        // For partner dashboard
        const partnerOrdersContainer = document.getElementById('partnerOrders');
        if (partnerOrdersContainer) {
            this.displayPartnerOrders(orders);
        }

        // For shipper dashboard
        const availableOrdersContainer = document.getElementById('availableOrders');
        if (availableOrdersContainer) {
            this.displayAvailableOrders(orders.filter(order => order.status === 'ready'));
        }

        // For admin dashboard
        const allOrdersContainer = document.getElementById('allOrders');
        if (allOrdersContainer) {
            this.displayAllOrders(orders);
        }
    }

    displayRecentOrders(orders) {
        const container = document.getElementById('recentOrders');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<p class="text-muted">Chưa có đơn hàng nào.</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">#${order.orderNumber}</span>
                    <span class="order-status status-${order.status}">${this.getStatusText(order.status)}</span>
                </div>
                <div class="order-details">
                    <div class="order-restaurant">${order.restaurantName || 'Nhà hàng'}</div>
                    <div class="order-items">${order.items?.length || 0} món</div>
                    <div class="order-total">${this.formatCurrency(order.total)}</div>
                </div>
                <div class="order-time">${this.formatDate(order.createdAt)}</div>
            </div>
        `).join('');
    }

    displayPartnerOrders(orders) {
        const container = document.getElementById('partnerOrders');
        if (!container) return;

        container.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.orderNumber}</td>
                <td>
                    <div>${order.customerName}</div>
                    <small class="text-muted">${order.items?.map(item => item.name).join(', ')}</small>
                </td>
                <td>${this.formatDate(order.createdAt)}</td>
                <td>${this.formatCurrency(order.total)}</td>
                <td>
                    <span class="status-badge status-${order.status}">
                        ${this.getStatusText(order.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-primary" data-action="view" data-order-id="${order._id}">
                        Xem
                    </button>
                    ${order.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" data-action="accept" data-order-id="${order._id}">
                            Nhận đơn
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    displayAvailableOrders(orders) {
        const container = document.getElementById('availableOrders');
        if (!container) return;

        if (orders.length === 0) {
            container.innerHTML = '<p class="text-muted">Không có đơn hàng nào sẵn sàng.</p>';
            return;
        }

        container.innerHTML = orders.map(order => `
            <div class="order-card">
                <div class="order-header">
                    <div class="order-id">#${order.orderNumber}</div>
                    <div class="order-status status-ready">Sẵn sàng giao</div>
                </div>
                <div class="order-details">
                    <div class="order-restaurant">${order.restaurantName}</div>
                    <div class="order-items">${order.items?.length || 0} món</div>
                    <div class="order-address">
                        <i class="fas fa-map-marker-alt"></i>
                        ${order.deliveryAddress}
                    </div>
                    <div class="order-time">
                        <i class="fas fa-clock"></i> ${order.deliveryTime} phút
                    </div>
                </div>
                <div class="order-footer">
                    <div class="order-total">${this.formatCurrency(order.total)}</div>
                    <div class="order-actions">
                        <button class="btn btn-outline" data-action="view" data-order-id="${order._id}">
                            Xem chi tiết
                        </button>
                        <button class="btn btn-primary" data-action="accept" data-order-id="${order._id}">
                            Nhận đơn
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async handleOrderAction(orderId, action) {
        try {
            const token = localStorage.getItem('crabor_token');
            if (!token) throw new Error('Not authenticated');

            let endpoint = '';
            let method = 'POST';
            let body = null;

            switch(action) {
                case 'accept':
                    endpoint = `/api/orders/${orderId}/accept`;
                    break;
                case 'cancel':
                    endpoint = `/api/orders/${orderId}/cancel`;
                    body = JSON.stringify({ reason: 'Khách hàng hủy' });
                    break;
                case 'complete':
                    endpoint = `/api/orders/${orderId}/complete`;
                    break;
                case 'view':
                    // Show order details modal
                    this.showOrderDetails(orderId);
                    return;
            }

            const response = await fetch(endpoint, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body
            });

            if (response.ok) {
                const result = await response.json();
                
                // Show notification
                if (window.craborApp && window.craborApp.showNotification) {
                    window.craborApp.showNotification(result.message || 'Thao tác thành công', 'success');
                }
                
                // Reload orders
                this.loadUserOrders();
                
                // Emit socket event
                if (window.socket) {
                    window.socket.emit('orderUpdate', {
                        orderId,
                        status: result.status,
                        action
                    });
                }
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Thao tác thất bại');
            }
        } catch (error) {
            console.error('Order action failed:', error);
            if (window.craborApp && window.craborApp.showNotification) {
                window.craborApp.showNotification(error.message, 'error');
            }
        }
    }

    showOrderDetails(orderId) {
        // Implementation for order details modal
        console.log('Showing details for order:', orderId);
        // In real app: open modal with order details
    }

    handleOrderUpdate(data) {
        // Update specific order in UI
        const { orderId, status, message } = data;
        
        if (window.craborApp && window.craborApp.showNotification) {
            window.craborApp.showNotification(`Cập nhật đơn hàng: ${message}`, 'info');
        }
        
        // Update UI if order is in current view
        this.loadUserOrders();
    }

    switchOrderTab(tabId) {
        // Hide all tab contents
        document.querySelectorAll('.order-tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Show selected tab content
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.style.display = 'block';
        }
        
        // Update active tab button
        document.querySelectorAll('[data-order-tab]').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-order-tab="${tabId}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Load orders for this tab
        this.loadTabOrders(tabId);
    }

    async loadTabOrders(tabId) {
        try {
            const token = localStorage.getItem('crabor_token');
            if (!token) return;

            let endpoint = '';
            switch(tabId) {
                case 'newOrders':
                    endpoint = '/api/orders?status=pending';
                    break;
                case 'activeOrders':
                    endpoint = '/api/orders?status=accepted,preparing';
                    break;
                case 'completedOrders':
                    endpoint = '/api/orders?status=completed';
                    break;
                case 'cancelledOrders':
                    endpoint = '/api/orders?status=cancelled';
                    break;
            }

            if (endpoint) {
                const response = await fetch(endpoint, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const orders = await response.json();
                    this.displayTabOrders(tabId, orders);
                }
            }
        } catch (error) {
            console.error('Failed to load tab orders:', error);
        }
    }

    displayTabOrders(tabId, orders) {
        const container = document.getElementById(tabId);
        if (!container) return;

        // Implementation depends on specific tab requirements
        // This would be customized for each tab
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Chờ xác nhận',
            'accepted': 'Đã xác nhận',
            'preparing': 'Đang chuẩn bị',
            'ready': 'Sẵn sàng giao',
            'delivering': 'Đang giao hàng',
            'completed': 'Hoàn thành',
            'cancelled': 'Đã hủy'
        };
        
        return statusMap[status] || status;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }
}

// Initialize order manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.orderManager = new OrderManager();
});

// public/assets/js/orders.js
async function loadRecentOrders(userId, limit = 5) {
    try {
        const response = await craborApp.apiRequest(`/api/orders/user/${userId}?limit=${limit}`);
        craborApp.displayRecentOrders(response);
    } catch (error) {
        console.error('Failed to load recent orders:', error);
    }
}

async function loadAvailableOrders() {
    try {
        const response = await craborApp.apiRequest('/api/orders/available');
        craborApp.displayAvailableOrders(response);
    } catch (error) {
        console.error('Failed to load available orders:', error);
    }
}

async function createOrder(orderData) {
    try {
        const response = await craborApp.apiRequest('/api/orders/create', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });
        craborApp.showNotification('Đặt hàng thành công', 'success');
        clearCart();
        return response;
    } catch (error) {
        craborApp.showNotification('Đặt hàng thất bại: ' + error.message, 'error');
        throw error;
    }
}

async function cancelOrder(orderId, reason) {
    try {
        const response = await craborApp.apiRequest(`/api/orders/${orderId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({ reason })
        });
        craborApp.showNotification('Đã hủy đơn hàng', 'info');
        return response;
    } catch (error) {
        craborApp.showNotification('Hủy đơn hàng thất bại: ' + error.message, 'error');
        throw error;
    }
}

// Gắn vào window nếu cần gọi từ HTML
window.loadRecentOrders = loadRecentOrders;
window.loadAvailableOrders = loadAvailableOrders;
window.createOrder = createOrder;
window.cancelOrder = cancelOrder;

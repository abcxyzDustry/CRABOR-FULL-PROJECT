const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { validateCreateOrder, validateUpdateOrderStatus } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes (for webhooks)
router.post('/webhook/payment', orderController.handlePaymentWebhook);
router.post('/webhook/delivery', orderController.handleDeliveryWebhook);

// Customer routes
router.post('/', authenticate, authorize('customer'), validateCreateOrder, orderController.createOrder);
router.get('/my-orders', authenticate, authorize('customer'), orderController.getMyOrders);
router.get('/my-orders/:id', authenticate, authorize('customer'), orderController.getMyOrderById);
router.post('/my-orders/:id/cancel', authenticate, authorize('customer'), orderController.cancelOrder);
router.post('/my-orders/:id/rate', authenticate, authorize('customer'), orderController.rateOrder);
router.post('/my-orders/:id/reorder', authenticate, authorize('customer'), orderController.reorder);

// Shipper routes
router.get('/available', authenticate, authorize('shipper'), orderController.getAvailableOrders);
router.get('/assigned', authenticate, authorize('shipper'), orderController.getAssignedOrders);
router.post('/:id/accept', authenticate, authorize('shipper'), orderController.acceptOrder);
router.post('/:id/reject', authenticate, authorize('shipper'), orderController.rejectOrder);
router.post('/:id/pickup', authenticate, authorize('shipper'), orderController.pickupOrder);
router.post('/:id/deliver', authenticate, authorize('shipper'), orderController.deliverOrder);
router.post('/:id/failed', authenticate, authorize('shipper'), orderController.markDeliveryFailed);
router.post('/:id/location', authenticate, authorize('shipper'), orderController.updateLocation);

// Partner routes
router.get('/restaurant/orders', authenticate, authorize('partner'), orderController.getRestaurantOrders);
router.get('/restaurant/orders/:id', authenticate, authorize('partner'), orderController.getRestaurantOrderById);
router.post('/restaurant/orders/:id/confirm', authenticate, authorize('partner'), orderController.confirmOrder);
router.post('/restaurant/orders/:id/ready', authenticate, authorize('partner'), orderController.markOrderReady);
router.post('/restaurant/orders/:id/cancel', authenticate, authorize('partner'), orderController.cancelOrderByPartner);
router.get('/restaurant/stats', authenticate, authorize('partner'), orderController.getRestaurantStats);

// Admin routes
router.get('/', authenticate, authorize('admin'), orderController.getAllOrders);
router.get('/:id', authenticate, authorize('admin'), orderController.getOrderById);
router.put('/:id/status', authenticate, authorize('admin'), validateUpdateOrderStatus, orderController.updateOrderStatus);
router.delete('/:id', authenticate, authorize('admin'), orderController.deleteOrder);
router.get('/stats/overview', authenticate, authorize('admin'), orderController.getOrderStats);
router.get('/stats/daily', authenticate, authorize('admin'), orderController.getDailyStats);

// Shared routes
router.get('/:id/tracking', authenticate, orderController.trackOrder);
router.post('/:id/contact', authenticate, orderController.contactOrder);

module.exports = router;

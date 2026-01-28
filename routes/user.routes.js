const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public routes
router.get('/check-email/:email', userController.checkEmailAvailability);
router.get('/check-phone/:phone', userController.checkPhoneAvailability);

// Protected routes - User profile
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, upload.single('avatar'), userController.updateProfile);
router.post('/profile/upload-avatar', authenticate, upload.single('avatar'), userController.uploadAvatar);
router.post('/change-password', authenticate, userController.changePassword);
router.get('/notifications', authenticate, userController.getNotifications);
router.put('/notifications/:id/read', authenticate, userController.markNotificationRead);
router.delete('/notifications/:id', authenticate, userController.deleteNotification);
router.get('/addresses', authenticate, userController.getAddresses);
router.post('/addresses', authenticate, userController.addAddress);
router.put('/addresses/:id', authenticate, userController.updateAddress);
router.delete('/addresses/:id', authenticate, userController.deleteAddress);
router.put('/addresses/:id/set-default', authenticate, userController.setDefaultAddress);

// Customer specific routes
router.get('/customer/orders', authenticate, authorize('customer'), userController.getCustomerOrders);
router.get('/customer/favorites', authenticate, authorize('customer'), userController.getFavorites);
router.post('/customer/favorites/:productId', authenticate, authorize('customer'), userController.addToFavorites);
router.delete('/customer/favorites/:productId', authenticate, authorize('customer'), userController.removeFromFavorites);
router.get('/customer/cart', authenticate, authorize('customer'), userController.getCart);
router.post('/customer/cart', authenticate, authorize('customer'), userController.updateCart);
router.delete('/customer/cart', authenticate, authorize('customer'), userController.clearCart);
router.get('/customer/vouchers', authenticate, authorize('customer'), userController.getVouchers);

// Shipper specific routes
router.get('/shipper/stats', authenticate, authorize('shipper'), userController.getShipperStats);
router.get('/shipper/earnings', authenticate, authorize('shipper'), userController.getShipperEarnings);
router.post('/shipper/toggle-online', authenticate, authorize('shipper'), userController.toggleOnlineStatus);
router.put('/shipper/location', authenticate, authorize('shipper'), userController.updateLocation);
router.get('/shipper/ratings', authenticate, authorize('shipper'), userController.getShipperRatings);
router.get('/shipper/withdrawals', authenticate, authorize('shipper'), userController.getWithdrawals);
router.post('/shipper/withdraw', authenticate, authorize('shipper'), userController.requestWithdrawal);

// Partner specific routes
router.get('/partner/stats', authenticate, authorize('partner'), userController.getPartnerStats);
router.get('/partner/earnings', authenticate, authorize('partner'), userController.getPartnerEarnings);
router.post('/partner/toggle-open', authenticate, authorize('partner'), userController.toggleOpenStatus);
router.put('/partner/settings', authenticate, authorize('partner'), userController.updatePartnerSettings);
router.get('/partner/ratings', authenticate, authorize('partner'), userController.getPartnerRatings);
router.get('/partner/withdrawals', authenticate, authorize('partner'), userController.getPartnerWithdrawals);
router.post('/partner/withdraw', authenticate, authorize('partner'), userController.requestPartnerWithdrawal);

// Admin routes - User management
router.get('/admin/users', authenticate, authorize('admin'), userController.getAllUsers);
router.get('/admin/users/:id', authenticate, authorize('admin'), userController.getUserById);
router.post('/admin/users', authenticate, authorize('admin'), userController.createUser);
router.put('/admin/users/:id', authenticate, authorize('admin'), userController.updateUser);
router.delete('/admin/users/:id', authenticate, authorize('admin'), userController.deleteUser);
router.post('/admin/users/:id/ban', authenticate, authorize('admin'), userController.banUser);
router.post('/admin/users/:id/unban', authenticate, authorize('admin'), userController.unbanUser);
router.get('/admin/stats', authenticate, authorize('admin'), userController.getAdminStats);

// Admin routes - Shipper management
router.get('/admin/shippers', authenticate, authorize('admin'), userController.getAllShippers);
router.get('/admin/shippers/:id', authenticate, authorize('admin'), userController.getShipperById);
router.post('/admin/shippers/:id/verify', authenticate, authorize('admin'), userController.verifyShipper);
router.post('/admin/shippers/:id/suspend', authenticate, authorize('admin'), userController.suspendShipper);
router.post('/admin/shippers/:id/activate', authenticate, authorize('admin'), userController.activateShipper);

// Admin routes - Partner management
router.get('/admin/partners', authenticate, authorize('admin'), userController.getAllPartners);
router.get('/admin/partners/:id', authenticate, authorize('admin'), userController.getPartnerById);
router.post('/admin/partners/:id/verify', authenticate, authorize('admin'), userController.verifyPartner);
router.post('/admin/partners/:id/suspend', authenticate, authorize('admin'), userController.suspendPartner);
router.post('/admin/partners/:id/activate', authenticate, authorize('admin'), userController.activatePartner);

module.exports = router;

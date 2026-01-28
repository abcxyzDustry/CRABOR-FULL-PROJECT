const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validateRegister, validateLogin, validateResetPassword } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', validateResetPassword, authController.resetPassword);
router.post('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

// Shipper registration
router.post('/register/shipper', authenticate, authController.registerShipper);
router.get('/shipper/status', authenticate, authorize('customer'), authController.getShipperStatus);
router.post('/shipper/activation-fee', authenticate, authorize('customer'), authController.payActivationFee);

// Admin routes
router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);
router.get('/users/:id', authenticate, authorize('admin'), authController.getUserById);
router.put('/users/:id/status', authenticate, authorize('admin'), authController.updateUserStatus);
router.put('/users/:id/role', authenticate, authorize('admin'), authController.updateUserRole);
router.get('/shipper-registrations', authenticate, authorize('admin'), authController.getShipperRegistrations);
router.post('/shipper-registrations/:id/approve', authenticate, authorize('admin'), authController.approveShipperRegistration);
router.post('/shipper-registrations/:id/reject', authenticate, authorize('admin'), authController.rejectShipperRegistration);

module.exports = router;

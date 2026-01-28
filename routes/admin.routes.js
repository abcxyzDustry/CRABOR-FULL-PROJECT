const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Dashboard & Analytics
router.get('/dashboard/stats', authenticate, authorize('admin'), adminController.getDashboardStats);
router.get('/dashboard/overview', authenticate, authorize('admin'), adminController.getOverview);
router.get('/dashboard/realtime', authenticate, authorize('admin'), adminController.getRealtimeData);
router.get('/dashboard/charts', authenticate, authorize('admin'), adminController.getChartData);

// Financial Management
router.get('/finance/overview', authenticate, authorize('admin'), adminController.getFinanceOverview);
router.get('/finance/transactions', authenticate, authorize('admin'), adminController.getTransactions);
router.get('/finance/transactions/:id', authenticate, authorize('admin'), adminController.getTransactionById);
router.post('/finance/transactions/:id/verify', authenticate, authorize('admin'), adminController.verifyTransaction);
router.get('/finance/revenue', authenticate, authorize('admin'), adminController.getRevenueReports);
router.get('/finance/commissions', authenticate, authorize('admin'), adminController.getCommissionReports);
router.get('/finance/payouts', authenticate, authorize('admin'), adminController.getPayoutReports);
router.post('/finance/payouts/process', authenticate, authorize('admin'), adminController.processPayouts);
router.get('/finance/invoices', authenticate, authorize('admin'), adminController.getInvoices);
router.post('/finance/invoices/generate', authenticate, authorize('admin'), adminController.generateInvoice);

// Banner Management
router.get('/banners', authenticate, authorize('admin'), adminController.getBanners);
router.get('/banners/:id', authenticate, authorize('admin'), adminController.getBannerById);
router.post('/banners', authenticate, authorize('admin'), upload.single('image'), adminController.createBanner);
router.put('/banners/:id', authenticate, authorize('admin'), upload.single('image'), adminController.updateBanner);
router.delete('/banners/:id', authenticate, authorize('admin'), adminController.deleteBanner);
router.post('/banners/:id/toggle', authenticate, authorize('admin'), adminController.toggleBanner);
router.get('/banners/stats/:id', authenticate, authorize('admin'), adminController.getBannerStats);
router.post('/banners/:id/impression', authenticate, authorize('admin'), adminController.recordImpression);
router.post('/banners/:id/click', authenticate, authorize('admin'), adminController.recordClick);

// Promotions & Vouchers
router.get('/promotions', authenticate, authorize('admin'), adminController.getPromotions);
router.get('/promotions/:id', authenticate, authorize('admin'), adminController.getPromotionById);
router.post('/promotions', authenticate, authorize('admin'), adminController.createPromotion);
router.put('/promotions/:id', authenticate, authorize('admin'), adminController.updatePromotion);
router.delete('/promotions/:id', authenticate, authorize('admin'), adminController.deletePromotion);
router.post('/promotions/:id/toggle', authenticate, authorize('admin'), adminController.togglePromotion);
router.get('/promotions/stats/:id', authenticate, authorize('admin'), adminController.getPromotionStats);

// System Settings
router.get('/settings', authenticate, authorize('admin'), adminController.getSettings);
router.put('/settings', authenticate, authorize('admin'), adminController.updateSettings);
router.get('/settings/commission', authenticate, authorize('admin'), adminController.getCommissionSettings);
router.put('/settings/commission', authenticate, authorize('admin'), adminController.updateCommissionSettings);
router.get('/settings/delivery', authenticate, authorize('admin'), adminController.getDeliverySettings);
router.put('/settings/delivery', authenticate, authorize('admin'), adminController.updateDeliverySettings);
router.get('/settings/payment', authenticate, authorize('admin'), adminController.getPaymentSettings);
router.put('/settings/payment', authenticate, authorize('admin'), adminController.updatePaymentSettings);
router.get('/settings/notification', authenticate, authorize('admin'), adminController.getNotificationSettings);
router.put('/settings/notification', authenticate, authorize('admin'), adminController.updateNotificationSettings);

// Content Management
router.get('/content/pages', authenticate, authorize('admin'), adminController.getPages);
router.get('/content/pages/:id', authenticate, authorize('admin'), adminController.getPageById);
router.post('/content/pages', authenticate, authorize('admin'), adminController.createPage);
router.put('/content/pages/:id', authenticate, authorize('admin'), adminController.updatePage);
router.delete('/content/pages/:id', authenticate, authorize('admin'), adminController.deletePage);
router.get('/content/faqs', authenticate, authorize('admin'), adminController.getFaqs);
router.post('/content/faqs', authenticate, authorize('admin'), adminController.createFaq);
router.put('/content/faqs/:id', authenticate, authorize('admin'), adminController.updateFaq);
router.delete('/content/faqs/:id', authenticate, authorize('admin'), adminController.deleteFaq);

// Reports
router.get('/reports/sales', authenticate, authorize('admin'), adminController.getSalesReport);
router.get('/reports/users', authenticate, authorize('admin'), adminController.getUserReport);
router.get('/reports/orders', authenticate, authorize('admin'), adminController.getOrderReport);
router.get('/reports/products', authenticate, authorize('admin'), adminController.getProductReport);
router.get('/reports/delivery', authenticate, authorize('admin'), adminController.getDeliveryReport);
router.post('/reports/generate', authenticate, authorize('admin'), adminController.generateReport);
router.get('/reports/export/:type', authenticate, authorize('admin'), adminController.exportReport);

// System Logs
router.get('/logs/activity', authenticate, authorize('admin'), adminController.getActivityLogs);
router.get('/logs/error', authenticate, authorize('admin'), adminController.getErrorLogs);
router.get('/logs/access', authenticate, authorize('admin'), adminController.getAccessLogs);
router.delete('/logs/clear', authenticate, authorize('admin'), adminController.clearLogs);

// Backup & Restore
router.post('/backup/create', authenticate, authorize('admin'), adminController.createBackup);
router.get('/backup/list', authenticate, authorize('admin'), adminController.listBackups);
router.post('/backup/restore/:filename', authenticate, authorize('admin'), adminController.restoreBackup);
router.delete('/backup/:filename', authenticate, authorize('admin'), adminController.deleteBackup);

// System Health
router.get('/health', authenticate, authorize('admin'), adminController.getSystemHealth);
router.get('/health/database', authenticate, authorize('admin'), adminController.checkDatabaseHealth);
router.get('/health/server', authenticate, authorize('admin'), adminController.checkServerHealth);
router.get('/health/storage', authenticate, authorize('admin'), adminController.checkStorageHealth);

// API Management
router.get('/api/keys', authenticate, authorize('admin'), adminController.getApiKeys);
router.post('/api/keys', authenticate, authorize('admin'), adminController.createApiKey);
router.delete('/api/keys/:id', authenticate, authorize('admin'), adminController.deleteApiKey);
router.get('/api/usage', authenticate, authorize('admin'), adminController.getApiUsage);
router.get('/api/rate-limits', authenticate, authorize('admin'), adminController.getRateLimits);
router.put('/api/rate-limits', authenticate, authorize('admin'), adminController.updateRateLimits);

module.exports = router;

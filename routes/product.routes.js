const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const upload = require('../middleware/upload');
const { validateCreateProduct, validateUpdateProduct } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/search', productController.searchProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);
router.get('/:id/related', productController.getRelatedProducts);
router.get('/:id/reviews', productController.getProductReviews);

// Partner routes
router.post('/', authenticate, authorize('partner'), upload.array('images', 5), validateCreateProduct, productController.createProduct);
router.put('/:id', authenticate, authorize('partner'), upload.array('images', 5), validateUpdateProduct, productController.updateProduct);
router.delete('/:id', authenticate, authorize('partner'), productController.deleteProduct);
router.post('/:id/toggle-availability', authenticate, authorize('partner'), productController.toggleAvailability);
router.get('/partner/my-products', authenticate, authorize('partner'), productController.getMyProducts);
router.post('/:id/upload-images', authenticate, authorize('partner'), upload.array('images', 5), productController.uploadImages);
router.delete('/:id/images/:imageId', authenticate, authorize('partner'), productController.deleteImage);

// Admin routes
router.post('/:id/feature', authenticate, authorize('admin'), productController.toggleFeatured);
router.post('/:id/recommend', authenticate, authorize('admin'), productController.toggleRecommended);
router.get('/admin/products', authenticate, authorize('admin'), productController.getAllProductsForAdmin);
router.put('/admin/products/:id', authenticate, authorize('admin'), productController.updateProductByAdmin);
router.delete('/admin/products/:id', authenticate, authorize('admin'), productController.deleteProductByAdmin);
router.get('/admin/stats', authenticate, authorize('admin'), productController.getProductStats);

// Category routes
router.post('/categories', authenticate, authorize('admin'), productController.createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), productController.updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), productController.deleteCategory);

module.exports = router;

const express = require('express');
const router = express.Router();
const { Product, User } = require('./database');

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { 
      category, 
      partnerId, 
      search, 
      minPrice, 
      maxPrice,
      isFeatured,
      limit = 20,
      page = 1
    } = req.query;
    
    const query = { isAvailable: true };
    
    if (category) query.category = category;
    if (partnerId) query.partnerId = partnerId;
    if (isFeatured) query.isFeatured = isFeatured === 'true';
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const products = await Product.find(query)
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    
    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Create new product (partner only)
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      category, 
      image, 
      partnerId,
      preparationTime
    } = req.body;
    
    // Verify partner
    const partner = await User.findById(partnerId);
    if (!partner || partner.role !== 'partner') {
      return res.status(403).json({ error: 'Chỉ đối tác mới có thể thêm sản phẩm' });
    }
    
    // Create product
    const product = new Product({
      name,
      description,
      price,
      category,
      image,
      partnerId,
      partnerName: partner.name,
      preparationTime,
      isAvailable: true
    });
    
    await product.save();
    
    res.status(201).json({
      message: 'Thêm sản phẩm thành công',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Update product
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerId, ...updates } = req.body;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    
    // Verify partner owns this product
    if (product.partnerId.toString() !== partnerId) {
      return res.status(403).json({ error: 'Không có quyền chỉnh sửa sản phẩm này' });
    }
    
    // Update product
    Object.assign(product, updates);
    await product.save();
    
    res.json({
      message: 'Cập nhật sản phẩm thành công',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Delete product (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { partnerId } = req.body;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    
    // Verify partner owns this product
    if (product.partnerId.toString() !== partnerId) {
      return res.status(403).json({ error: 'Không có quyền xóa sản phẩm này' });
    }
    
    // Soft delete
    product.isAvailable = false;
    await product.save();
    
    res.json({
      message: 'Đã xóa sản phẩm',
      product
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Feature/unfeature product
router.post('/:id/feature', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, isFeatured } = req.body;
    
    // Verify admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có thể thay đổi trạng thái nổi bật' });
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }
    
    // Update featured status
    product.isFeatured = isFeatured;
    await product.save();
    
    res.json({
      message: isFeatured ? 'Đã đánh dấu sản phẩm nổi bật' : 'Đã bỏ đánh dấu nổi bật',
      product
    });
  } catch (error) {
    console.error('Feature product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get partner's products
router.get('/partner/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { isAvailable } = req.query;
    
    const query = { partnerId };
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }
    
    const products = await Product.find(query).sort({ createdAt: -1 });
    
    res.json({ products });
  } catch (error) {
    console.error('Get partner products error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

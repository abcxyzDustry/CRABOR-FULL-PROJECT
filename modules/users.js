const express = require('express');
const router = express.Router();
const { User, Order, Transaction } = require('./database');

// Get all users with filters
router.get('/', async (req, res) => {
  try {
    const { role, isActive, search, limit = 20, page = 1 } = req.query;
    
    const query = {};
    
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const users = await User.find(query)
      .select('-password')
      .sort({ registrationDate: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await User.countDocuments(query);
    
    res.json({
      users,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove password from updates if present
    delete updates.password;
    
    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    res.json({
      message: 'Cập nhật thông tin thành công',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Change user status (activate/deactivate)
router.post('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, isActive, reason } = req.body;
    
    // Verify admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có thể thay đổi trạng thái người dùng' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    // Update status
    user.isActive = isActive;
    await user.save();
    
    // Log the action
    console.log(`User ${id} ${isActive ? 'activated' : 'deactivated'} by admin ${adminId}. Reason: ${reason}`);
    
    res.json({
      message: isActive ? 'Đã kích hoạt người dùng' : 'Đã vô hiệu hóa người dùng',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Change user status error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Change user role
router.post('/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, role } = req.body;
    
    // Verify admin
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có thể thay đổi vai trò người dùng' });
    }
    
    // Validate role
    const validRoles = ['customer', 'shipper', 'partner', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Vai trò không hợp lệ' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    // Update role
    user.role = role;
    await user.save();
    
    res.json({
      message: `Đã thay đổi vai trò thành ${role}`,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get user statistics
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    let statistics = {};
    
    switch (user.role) {
      case 'customer':
        // Get customer order statistics
        const customerOrders = await Order.aggregate([
          { $match: { customerId: user._id } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalSpent: { $sum: '$total' },
              completedOrders: {
                $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
              },
              cancelledOrders: {
                $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
              }
            }
          }
        ]);
        
        statistics = customerOrders[0] || {
          totalOrders: 0,
          totalSpent: 0,
          completedOrders: 0,
          cancelledOrders: 0
        };
        break;
        
      case 'shipper':
        // Get shipper delivery statistics
        const shipperOrders = await Order.aggregate([
          { $match: { shipperId: user._id } },
          {
            $group: {
              _id: null,
              totalDeliveries: { $sum: 1 },
              completedDeliveries: {
                $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
              },
              totalEarnings: {
                $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$deliveryFee', 0] }
              },
              avgRating: { $avg: '$rating.delivery' }
            }
          }
        ]);
        
        statistics = shipperOrders[0] || {
          totalDeliveries: 0,
          completedDeliveries: 0,
          totalEarnings: 0,
          avgRating: 0
        };
        break;
        
      case 'partner':
        // Get partner sales statistics
        const partnerOrders = await Order.aggregate([
          { $match: { partnerId: user._id } },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: '$subtotal' },
              commissionPaid: {
                $sum: { $multiply: ['$subtotal', 0.2] } // 20% commission
              },
              completedOrders: {
                $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
              },
              avgFoodRating: { $avg: '$rating.food' }
            }
          }
        ]);
        
        statistics = partnerOrders[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          commissionPaid: 0,
          completedOrders: 0,
          avgFoodRating: 0
        };
        break;
    }
    
    // Add registration info
    statistics.registrationDate = user.registrationDate;
    statistics.lastLogin = user.lastLogin;
    statistics.isActive = user.isActive;
    
    res.json({ statistics });
  } catch (error) {
    console.error('Get user statistics error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

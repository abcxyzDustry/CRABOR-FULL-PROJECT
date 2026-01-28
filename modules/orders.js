const express = require('express');
const router = express.Router();
const { Order, Product, User, Transaction } = require('./database');

// Create new order
router.post('/create', async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      paymentMethod,
      notes,
      location
    } = req.body;
    
    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Find partner from first item
    const firstProduct = await Product.findById(items[0]?.productId);
    const partnerId = firstProduct?.partnerId;
    const partnerName = firstProduct?.partnerName;
    
    // Create order
    const order = new Order({
      orderId,
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      items,
      subtotal,
      deliveryFee,
      discount,
      total,
      partnerId,
      partnerName,
      paymentMethod,
      notes,
      location,
      status: 'pending',
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60000) // 45 minutes from now
    });
    
    await order.save();
    
    // Emit real-time update
    if (req.io) {
      req.io.to(`partner_${partnerId}`).emit('newOrder', order);
      req.io.to('admin').emit('newOrder', order);
    }
    
    res.status(201).json({
      message: 'Đặt hàng thành công',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit = 20, page = 1 } = req.query;
    
    const query = { customerId: userId };
    if (status) query.status = status;
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get orders by partner ID
router.get('/partner/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { status, limit = 20, page = 1 } = req.query;
    
    const query = { partnerId };
    if (status) query.status = status;
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Order.countDocuments(query);
    
    res.json({
      orders,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get partner orders error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get available orders for shippers
router.get('/available', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query; // radius in km
    
    // Find orders that are ready for pickup
    const orders = await Order.find({
      status: 'ready',
      shipperId: { $exists: false }
    }).limit(20);
    
    // In a real app, filter by location using geospatial query
    res.json({ orders });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Update order status
router.put('/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, userId, userRole } = req.body;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }
    
    // Authorization logic based on user role
    let authorized = false;
    
    if (userRole === 'admin') {
      authorized = true;
    } else if (userRole === 'partner' && order.partnerId.toString() === userId) {
      // Partner can only update from pending/preparing/ready
      if (['pending', 'confirmed', 'preparing', 'ready'].includes(status)) {
        authorized = true;
      }
    } else if (userRole === 'shipper' && order.shipperId?.toString() === userId) {
      // Shipper can only update from ready to delivered
      if (['picked_up', 'delivering', 'delivered'].includes(status)) {
        authorized = true;
      }
    }
    
    if (!authorized) {
      return res.status(403).json({ error: 'Không có quyền cập nhật trạng thái' });
    }
    
    // Update order status
    order.status = status;
    
    // Set timestamps based on status
    if (status === 'preparing') {
      order.preparingAt = new Date();
    } else if (status === 'ready') {
      order.readyAt = new Date();
    } else if (status === 'picked_up') {
      order.pickedUpAt = new Date();
    } else if (status === 'delivered') {
      order.actualDeliveryTime = new Date();
      order.paymentStatus = 'paid';
    } else if (status === 'cancelled') {
      order.cancelledAt = new Date();
    }
    
    await order.save();
    
    // Emit real-time update
    if (req.io) {
      req.io.to(`order_${orderId}`).emit('orderStatusChanged', {
        orderId,
        status,
        updatedAt: new Date()
      });
      
      // Notify customer
      req.io.to(`user_${order.customerId}`).emit('orderUpdate', {
        orderId,
        status,
        message: `Đơn hàng của bạn đã được cập nhật trạng thái: ${status}`
      });
      
      // Notify shipper if assigned
      if (order.shipperId) {
        req.io.to(`shipper_${order.shipperId}`).emit('orderUpdate', {
          orderId,
          status,
          message: `Đơn hàng #${orderId} đã được cập nhật`
        });
      }
    }
    
    res.json({
      message: 'Cập nhật trạng thái thành công',
      order
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Assign shipper to order
router.post('/:orderId/assign-shipper', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { shipperId } = req.body;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }
    
    // Check if order is ready for shipper assignment
    if (order.status !== 'ready') {
      return res.status(400).json({ error: 'Đơn hàng chưa sẵn sàng cho shipper' });
    }
    
    // Get shipper info
    const shipper = await User.findById(shipperId);
    if (!shipper || shipper.role !== 'shipper') {
      return res.status(400).json({ error: 'Shipper không hợp lệ' });
    }
    
    // Assign shipper
    order.shipperId = shipperId;
    order.shipperName = shipper.name;
    order.shipperPhone = shipper.phone;
    order.status = 'picked_up';
    order.pickedUpAt = new Date();
    
    await order.save();
    
    // Emit real-time update
    if (req.io) {
      req.io.to(`shipper_${shipperId}`).emit('orderAssigned', order);
      req.io.to(`order_${orderId}`).emit('shipperAssigned', {
        orderId,
        shipperName: shipper.name,
        shipperPhone: shipper.phone
      });
    }
    
    res.json({
      message: 'Đã gán shipper cho đơn hàng',
      order
    });
  } catch (error) {
    console.error('Assign shipper error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Update shipper location
router.post('/:orderId/tracking', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { shipperId, lat, lng } = req.body;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }
    
    // Verify shipper
    if (order.shipperId?.toString() !== shipperId) {
      return res.status(403).json({ error: 'Không phải shipper của đơn hàng này' });
    }
    
    // Emit location update
    if (req.io) {
      req.io.to(`order_${orderId}`).emit('shipperLocation', {
        orderId,
        lat,
        lng,
        timestamp: new Date()
      });
    }
    
    res.json({
      message: 'Cập nhật vị trí thành công'
    });
  } catch (error) {
    console.error('Update tracking error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Cancel order
router.post('/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, reason } = req.body;
    
    const order = await Order.findOne({ orderId });
    if (!order) {
      return res.status(404).json({ error: 'Đơn hàng không tồn tại' });
    }
    
    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Không thể hủy đơn hàng đang được chuẩn bị hoặc giao' 
      });
    }
    
    // Update order
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    order.cancelledBy = userId;
    
    await order.save();
    
    // Emit real-time update
    if (req.io) {
      req.io.to(`order_${orderId}`).emit('orderCancelled', {
        orderId,
        reason,
        timestamp: new Date()
      });
    }
    
    res.json({
      message: 'Đã hủy đơn hàng',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

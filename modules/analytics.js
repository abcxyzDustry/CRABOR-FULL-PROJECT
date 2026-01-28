const express = require('express');
const router = express.Router();
const { Order, Transaction, User, Product, Banner } = require('./database');

// Get platform analytics
router.get('/platform', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Total users by role
    const userStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    
    // Order statistics
    const orderStats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalCommission: { $sum: { $multiply: ['$subtotal', 0.2] } },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          avgOrderValue: { $avg: '$total' }
        }
      }
    ]);
    
    // Revenue by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const revenueByDay = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Top partners by revenue
    const topPartners = await Order.aggregate([
      {
        $match: {
          status: 'delivered',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$partnerId',
          partnerName: { $first: '$partnerName' },
          revenue: { $sum: '$subtotal' },
          orders: { $sum: 1 },
          commission: { $sum: { $multiply: ['$subtotal', 0.2] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);
    
    // Top products
    const topProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $match: {
          status: 'delivered',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);
    
    // Payment method distribution
    const paymentMethods = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          amount: { $sum: '$total' }
        }
      }
    ]);
    
    res.json({
      userStats,
      orderStats: orderStats[0] || {},
      revenueByDay,
      topPartners,
      topProducts,
      paymentMethods
    });
  } catch (error) {
    console.error('Get platform analytics error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get financial analytics
router.get('/financial', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    // Transaction summary
    const transactionSummary = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalFee: { $sum: '$fee' },
          netAmount: { $sum: '$netAmount' }
        }
      }
    ]);
    
    // Revenue by day
    const revenueByDay = await Transaction.aggregate([
      {
        $match: {
          type: 'order_payment',
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);
    
    // Payouts
    const payouts = await Transaction.aggregate([
      {
        $match: {
          type: { $in: ['shipper_payout', 'partner_payout'] },
          ...dateFilter
        }
      },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          totalPayouts: { $sum: 1 }
        }
      }
    ]);
    
    // Platform earnings (commission)
    const platformEarnings = await Transaction.aggregate([
      {
        $match: {
          type: 'order_payment',
          status: 'completed',
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          platformEarnings: { $sum: '$fee' }
        }
      }
    ]);
    
    res.json({
      transactionSummary,
      revenueByDay,
      payouts,
      platformEarnings: platformEarnings[0] || {}
    });
  } catch (error) {
    console.error('Get financial analytics error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get banner analytics
router.get('/banners', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }
    
    const banners = await Banner.find(dateFilter).sort({ createdAt: -1 });
    
    // Calculate CTR for each banner
    const bannersWithCTR = banners.map(banner => ({
      ...banner.toObject(),
      ctr: banner.clickCount > 0 ? (banner.clickCount / banner.displayCount) * 100 : 0
    }));
    
    res.json({ banners: bannersWithCTR });
  } catch (error) {
    console.error('Get banner analytics error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Update banner click/display counts
router.post('/banners/:id/click', async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner không tồn tại' });
    }
    
    banner.clickCount += 1;
    await banner.save();
    
    res.json({ message: 'Đã ghi nhận click', banner });
  } catch (error) {
    console.error('Update banner click error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/banners/:id/display', async (req, res) => {
  try {
    const { id } = req.params;
    
    const banner = await Banner.findById(id);
    if (!banner) {
      return res.status(404).json({ error: 'Banner không tồn tại' });
    }
    
    banner.displayCount += 1;
    await banner.save();
    
    res.json({ message: 'Đã ghi nhận hiển thị', banner });
  } catch (error) {
    console.error('Update banner display error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Get user growth analytics
router.get('/user-growth', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const userGrowth = await User.aggregate([
      {
        $match: {
          registrationDate: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { 
            $dateToString: { 
              format: '%Y-%m-%d', 
              date: '$registrationDate' 
            } 
          },
          count: { $sum: 1 },
          customers: {
            $sum: { $cond: [{ $eq: ['$role', 'customer'] }, 1, 0] }
          },
          partners: {
            $sum: { $cond: [{ $eq: ['$role', 'partner'] }, 1, 0] }
          },
          shippers: {
            $sum: { $cond: [{ $eq: ['$role', 'shipper'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // Calculate cumulative totals
    let total = 0;
    let totalCustomers = 0;
    let totalPartners = 0;
    let totalShippers = 0;
    
    const cumulativeGrowth = userGrowth.map(day => {
      total += day.count;
      totalCustomers += day.customers;
      totalPartners += day.partners;
      totalShippers += day.shippers;
      
      return {
        date: day._id,
        daily: day.count,
        cumulative: total,
        customers: totalCustomers,
        partners: totalPartners,
        shippers: totalShippers
      };
    });
    
    res.json({ userGrowth: cumulativeGrowth });
  } catch (error) {
    console.error('Get user growth error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

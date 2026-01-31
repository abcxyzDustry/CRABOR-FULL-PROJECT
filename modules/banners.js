// banners.js - Banner management module
const express = require('express');
const router = express.Router();
const Banner = require('../models/Banner');
const { authenticate, authorize } = require('../middleware/auth');
const { validateBanner } = require('../utils/validators');

// Get all active banners (public)
router.get('/active', async (req, res) => {
    try {
        const now = new Date();
        const banners = await Banner.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).sort({ priority: -1, createdAt: -1 });
        
        res.json(banners);
    } catch (error) {
        console.error('Get active banners error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Get all banners (admin only)
router.get('/', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (page - 1) * limit;
        
        let query = {};
        
        if (status) {
            if (status === 'active') {
                query.isActive = true;
            } else if (status === 'inactive') {
                query.isActive = false;
            } else if (status === 'expired') {
                query.endDate = { $lt: new Date() };
            } else if (status === 'upcoming') {
                query.startDate = { $gt: new Date() };
            }
        }
        
        const banners = await Banner.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Banner.countDocuments(query);
        
        res.json({
            banners,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all banners error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Get banner by ID
router.get('/:id', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        
        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }
        
        res.json(banner);
    } catch (error) {
        console.error('Get banner error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Create new banner (admin only)
router.post('/', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const validation = validateBanner(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.errors[0] });
        }
        
        const bannerData = {
            ...req.body,
            createdBy: req.user.userId
        };
        
        // Set default dates if not provided
        if (!bannerData.startDate) {
            bannerData.startDate = new Date();
        }
        
        if (!bannerData.endDate) {
            const oneMonthLater = new Date();
            oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
            bannerData.endDate = oneMonthLater;
        }
        
        const banner = new Banner(bannerData);
        await banner.save();
        
        // Emit socket event for real-time update
        if (req.io) {
            req.io.emit('bannerCreated', banner);
        }
        
        res.status(201).json({
            message: 'Tạo banner thành công',
            banner
        });
    } catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Update banner (admin only)
router.put('/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const validation = validateBanner(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.errors[0] });
        }
        
        const banner = await Banner.findById(req.params.id);
        
        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }
        
        // Update banner
        Object.keys(req.body).forEach(key => {
            banner[key] = req.body[key];
        });
        
        banner.updatedAt = new Date();
        banner.updatedBy = req.user.userId;
        
        await banner.save();
        
        // Emit socket event for real-time update
        if (req.io) {
            req.io.emit('bannerUpdated', banner);
        }
        
        res.json({
            message: 'Cập nhật banner thành công',
            banner
        });
    } catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Delete banner (admin only)
router.delete('/:id', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        
        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }
        
        // Soft delete
        banner.isActive = false;
        banner.deletedAt = new Date();
        banner.deletedBy = req.user.userId;
        
        await banner.save();
        
        // Emit socket event for real-time update
        if (req.io) {
            req.io.emit('bannerDeleted', { id: banner._id });
        }
        
        res.json({
            message: 'Xóa banner thành công'
        });
    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Toggle banner status (admin only)
router.post('/:id/toggle', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        
        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }
        
        banner.isActive = !banner.isActive;
        banner.updatedAt = new Date();
        banner.updatedBy = req.user.userId;
        
        await banner.save();
        
        // Emit socket event for real-time update
        if (req.io) {
            req.io.emit('bannerStatusChanged', {
                id: banner._id,
                isActive: banner.isActive
            });
        }
        
        res.json({
            message: banner.isActive ? 'Kích hoạt banner thành công' : 'Vô hiệu hóa banner thành công',
            banner
        });
    } catch (error) {
        console.error('Toggle banner error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Track banner impression
router.post('/:id/impression', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        
        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }
        
        // Increment impression count
        banner.impressions = (banner.impressions || 0) + 1;
        
        // Track by date
        const today = new Date().toISOString().split('T')[0];
        if (!banner.impressionByDate) {
            banner.impressionByDate = {};
        }
        
        banner.impressionByDate[today] = (banner.impressionByDate[today] || 0) + 1;
        
        await banner.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Track impression error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Track banner click
router.post('/:id/click', async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        
        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }
        
        // Increment click count
        banner.clicks = (banner.clicks || 0) + 1;
        
        // Track by date
        const today = new Date().toISOString().split('T')[0];
        if (!banner.clicksByDate) {
            banner.clicksByDate = {};
        }
        
        banner.clicksByDate[today] = (banner.clicksByDate[today] || 0) + 1;
        
        // Calculate CTR
        if (banner.impressions > 0) {
            banner.ctr = (banner.clicks / banner.impressions) * 100;
        }
        
        await banner.save();
        
        res.json({ success: true });
    } catch (error) {
        console.error('Track click error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Get banner statistics (admin only)
router.get('/:id/stats', authenticate, authorize(['admin']), async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        
        if (!banner) {
            return res.status(404).json({ error: 'Không tìm thấy banner' });
        }
        
        const stats = {
            totalImpressions: banner.impressions || 0,
            totalClicks: banner.clicks || 0,
            ctr: banner.ctr || 0,
            impressionByDate: banner.impressionByDate || {},
            clicksByDate: banner.clicksByDate || {},
            createdAt: banner.createdAt,
            lastUpdated: banner.updatedAt
        };
        
        // Calculate daily average
        const daysActive = Math.ceil((new Date() - banner.createdAt) / (1000 * 60 * 60 * 24));
        if (daysActive > 0) {
            stats.dailyAverageImpressions = stats.totalImpressions / daysActive;
            stats.dailyAverageClicks = stats.totalClicks / daysActive;
        }
        
        res.json(stats);
    } catch (error) {
        console.error('Get banner stats error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Get banners by target audience
router.get('/audience/:audience', async (req, res) => {
    try {
        const { audience } = req.params;
        const now = new Date();
        
        const banners = await Banner.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
            $or: [
                { targetAudience: audience },
                { targetAudience: 'all' }
            ]
        }).sort({ priority: -1, createdAt: -1 });
        
        res.json(banners);
    } catch (error) {
        console.error('Get banners by audience error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;

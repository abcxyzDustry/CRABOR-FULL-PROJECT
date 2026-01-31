// notifications.js - Notification management module
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// Get user notifications
router.get('/', authenticate, async (req, res) => {
    try {
        const { page = 1, limit = 20, read } = req.query;
        const skip = (page - 1) * limit;
        
        let query = { userId: req.user.userId };
        
        if (read !== undefined) {
            query.isRead = read === 'true';
        }
        
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        const total = await Notification.countDocuments(query);
        const unreadCount = await Notification.countDocuments({
            userId: req.user.userId,
            isRead: false
        });
        
        res.json({
            notifications,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Mark notification as read
router.post('/:id/read', authenticate, async (req, res) => {
    try {
        const notification = await Notification.findOne({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!notification) {
            return res.status(404).json({ error: 'Không tìm thấy thông báo' });
        }
        
        notification.isRead = true;
        notification.readAt = new Date();
        await notification.save();
        
        // Emit socket event for real-time update
        if (req.io) {
            req.io.to(`user_${req.user.userId}`).emit('notificationRead', {
                notificationId: notification._id
            });
        }
        
        res.json({
            message: 'Đã đánh dấu đã đọc',
            notification
        });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Mark all notifications as read
router.post('/read-all', authenticate, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.userId, isRead: false },
            { 
                $set: { 
                    isRead: true,
                    readAt: new Date()
                }
            }
        );
        
        // Emit socket event for real-time update
        if (req.io) {
            req.io.to(`user_${req.user.userId}`).emit('allNotificationsRead');
        }
        
        res.json({ message: 'Đã đánh dấu tất cả thông báo là đã đọc' });
    } catch (error) {
        console.error('Mark all notifications as read error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Delete notification
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.userId
        });
        
        if (!notification) {
            return res.status(404).json({ error: 'Không tìm thấy thông báo' });
        }
        
        // Emit socket event for real-time update
        if (req.io) {
            req.io.to(`user_${req.user.userId}`).emit('notificationDeleted', {
                notificationId: notification._id
            });
        }
        
        res.json({ message: 'Đã xóa thông báo' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Delete all notifications
router.delete('/', authenticate, async (req, res) => {
    try {
        const { read } = req.query;
        
        let query = { userId: req.user.userId };
        
        if (read !== undefined) {
            query.isRead = read === 'true';
        }
        
        await Notification.deleteMany(query);
        
        // Emit socket event for real-time update
        if (req.io) {
            req.io.to(`user_${req.user.userId}`).emit('allNotificationsDeleted', {
                readOnly: read === 'true'
            });
        }
        
        res.json({ message: 'Đã xóa tất cả thông báo' });
    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Get notification preferences
router.get('/preferences', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('notificationPreferences');
        
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        res.json(user.notificationPreferences || {});
    } catch (error) {
        console.error('Get notification preferences error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Update notification preferences
router.put('/preferences', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        // Initialize preferences if not exists
        if (!user.notificationPreferences) {
            user.notificationPreferences = {};
        }
        
        // Update preferences
        Object.keys(req.body).forEach(key => {
            user.notificationPreferences[key] = req.body[key];
        });
        
        await user.save();
        
        res.json({
            message: 'Cập nhật cài đặt thông báo thành công',
            preferences: user.notificationPreferences
        });
    } catch (error) {
        console.error('Update notification preferences error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Create notification (internal use - called from other modules)
const createNotification = async (data) => {
    try {
        const notification = new Notification({
            userId: data.userId,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            data: data.data || {},
            priority: data.priority || 'normal'
        });
        
        await notification.save();
        
        // Emit socket event for real-time notification
        if (global.io) {
            global.io.to(`user_${data.userId}`).emit('newNotification', notification);
        }
        
        return notification;
    } catch (error) {
        console.error('Create notification error:', error);
        throw error;
    }
};

// Create notification for multiple users
const createBulkNotifications = async (users, data) => {
    try {
        const notifications = users.map(userId => ({
            userId,
            title: data.title,
            message: data.message,
            type: data.type || 'info',
            data: data.data || {},
            priority: data.priority || 'normal',
            createdAt: new Date()
        }));
        
        await Notification.insertMany(notifications);
        
        // Emit socket events for real-time notifications
        if (global.io) {
            users.forEach(userId => {
                const userNotification = notifications.find(n => n.userId === userId);
                if (userNotification) {
                    global.io.to(`user_${userId}`).emit('newNotification', userNotification);
                }
            });
        }
        
        return notifications;
    } catch (error) {
        console.error('Create bulk notifications error:', error);
        throw error;
    }
};

// Create notification by user role
const createNotificationByRole = async (role, data) => {
    try {
        const users = await User.find({ role }).select('_id');
        const userIds = users.map(user => user._id);
        
        return await createBulkNotifications(userIds, data);
    } catch (error) {
        console.error('Create notification by role error:', error);
        throw error;
    }
};

// Create system-wide notification
const createSystemNotification = async (data) => {
    try {
        const users = await User.find({}).select('_id');
        const userIds = users.map(user => user._id);
        
        return await createBulkNotifications(userIds, {
            ...data,
            type: 'system'
        });
    } catch (error) {
        console.error('Create system notification error:', error);
        throw error;
    }
};

module.exports = {
    router,
    createNotification,
    createBulkNotifications,
    createNotificationByRole,
    createSystemNotification
};

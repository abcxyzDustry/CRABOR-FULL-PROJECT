const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userType: {
    type: String,
    enum: ['customer', 'shipper', 'partner', 'admin', 'all'],
    required: true
  },
  
  // Notification Content
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  shortMessage: String,
  
  // Notification Type
  type: {
    type: String,
    enum: [
      'order_new',
      'order_update',
      'order_delivered',
      'order_cancelled',
      'payment_success',
      'payment_failed',
      'shipper_assigned',
      'shipper_arrived',
      'promotion',
      'system',
      'alert',
      'reminder',
      'message',
      'review',
      'rating',
      'account',
      'security'
    ],
    required: true
  },
  
  // Action
  action: {
    type: {
      type: String,
      enum: ['navigate', 'open_url', 'open_modal', 'call', 'none']
    },
    target: String,
    params: mongoose.Schema.Types.Mixed
  },
  
  // Related Data
  relatedId: mongoose.Schema.Types.ObjectId,
  relatedType: String,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Delivery Channels
  channels: [{
    type: String,
    enum: ['push', 'email', 'sms', 'in_app'],
    default: ['in_app']
  }],
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
    default: 'pending'
  },
  
  // Read Status
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Delivery Status
  sentAt: Date,
  deliveredAt: Date,
  failedAt: Date,
  failureReason: String,
  
  // Expiration
  expiresAt: Date,
  ttl: {
    type: Number, // in seconds
    default: 30 * 24 * 60 * 60 // 30 days
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// TTL Index for auto-expiry
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Other indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userType: 1, status: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ priority: 1, createdAt: -1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ relatedId: 1, relatedType: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;

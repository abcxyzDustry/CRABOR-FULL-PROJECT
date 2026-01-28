const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  // Review Target
  targetType: {
    type: String,
    enum: ['product', 'restaurant', 'shipper', 'customer'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  
  // Reviewer Information
  reviewerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reviewerName: String,
  reviewerAvatar: String,
  
  // Order Information
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Review Content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: String,
  content: {
    type: String,
    required: true,
    trim: true
  },
  
  // Review Categories (for detailed ratings)
  categories: [{
    name: String,
    rating: Number
  }],
  
  // Media
  images: [{
    url: String,
    thumbnail: String,
    caption: String
  }],
  videos: [{
    url: String,
    thumbnail: String
  }],
  
  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  
  // Helpfulness
  helpfulCount: {
    type: Number,
    default: 0
  },
  unhelpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    userId: mongoose.Schema.Types.ObjectId,
    isHelpful: Boolean,
    votedAt: Date
  }],
  
  // Responses
  responses: [{
    responderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    responderName: String,
    responderRole: String,
    content: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending'
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  moderationNotes: String,
  moderatedAt: Date,
  
  // Flags
  isEdited: {
    type: Boolean,
    default: false
  },
  editHistory: [{
    content: String,
    editedAt: Date
  }],
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
reviewSchema.index({ reviewerId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1, createdAt: -1 });
reviewSchema.index({ orderId: 1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;

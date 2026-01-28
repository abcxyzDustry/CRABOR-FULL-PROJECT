const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderId: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  
  // Customer Information
  customerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  customerInfo: {
    name: String,
    phone: String,
    email: String,
    address: {
      street: String,
      ward: String,
      district: String,
      city: String,
      full: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  
  // Order Items
  items: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    },
    name: String,
    quantity: { 
      type: Number, 
      required: true,
      min: 1
    },
    price: { 
      type: Number, 
      required: true 
    },
    finalPrice: Number,
    image: String,
    customization: [{
      option: String,
      choice: String,
      extraPrice: Number
    }],
    specialInstructions: String
  }],
  
  // Pricing
  subtotal: { 
    type: Number, 
    required: true,
    min: 0
  },
  deliveryFee: { 
    type: Number, 
    default: 0,
    min: 0
  },
  discount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  serviceFee: {
    type: Number,
    default: 0
  },
  total: { 
    type: Number, 
    required: true,
    min: 0
  },
  
  // Partner Information
  partnerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  partnerInfo: {
    name: String,
    phone: String,
    address: {
      street: String,
      ward: String,
      district: String,
      city: String,
      full: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  
  // Shipper Information
  shipperId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  shipperInfo: {
    name: String,
    phone: String,
    vehicleType: String,
    licensePlate: String,
    currentLocation: {
      lat: Number,
      lng: Number
    }
  },
  
  // Order Status
  status: { 
    type: String, 
    enum: [
      'pending',      // Chờ xác nhận
      'confirmed',    // Đã xác nhận
      'preparing',    // Đang chuẩn bị
      'ready',        // Sẵn sàng giao
      'assigned',     // Đã gán shipper
      'picked_up',    // Shipper đã lấy hàng
      'delivering',   // Đang giao hàng
      'delivered',    // Đã giao hàng
      'cancelled',    // Đã hủy
      'refunded',     // Đã hoàn tiền
      'failed'        // Giao hàng thất bại
    ],
    default: 'pending' 
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Payment Information
  paymentMethod: { 
    type: String, 
    enum: ['cod', 'momo', 'banking', 'wallet', 'credit_card'], 
    default: 'cod' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  paymentDetails: {
    transactionId: String,
    method: String,
    amount: Number,
    paidAt: Date,
    refundedAt: Date
  },
  
  // Delivery Information
  deliveryType: {
    type: String,
    enum: ['standard', 'express', 'scheduled'],
    default: 'standard'
  },
  deliveryTime: {
    estimated: Date,
    scheduled: Date,
    actual: Date
  },
  deliveryDistance: {
    type: Number, // in kilometers
    default: 0
  },
  
  // Order Details
  notes: String,
  customerNotes: String,
  partnerNotes: String,
  cancellationReason: String,
  cancellationNotes: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Ratings
  ratings: {
    food: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    },
    delivery: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    },
    partner: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      submittedAt: Date
    }
  },
  
  // Commission & Fees
  commission: {
    platform: { type: Number, default: 0 },
    partner: { type: Number, default: 0 },
    shipper: { type: Number, default: 0 }
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  preparingAt: Date,
  readyAt: Date,
  pickedUpAt: Date,
  deliveredAt: Date,
  cancelledAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate order number and ID
orderSchema.pre('save', function(next) {
  if (!this.orderId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderId = `ORD-${timestamp}${random}`;
  }
  
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `CR${year}${month}${day}${random}`;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Auto-update status history
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: `Changed to ${this.status}`
    });
  }
  next();
});

// Virtual for order age
orderSchema.virtual('ageInMinutes').get(function() {
  return Math.floor((Date.now() - this.createdAt) / 60000);
});

// Virtual for estimated delivery time
orderSchema.virtual('estimatedDeliveryTime').get(function() {
  if (this.deliveryTime.scheduled) {
    return this.deliveryTime.scheduled;
  }
  if (this.deliveryTime.estimated) {
    return this.deliveryTime.estimated;
  }
  // Default: 45 minutes from creation
  return new Date(this.createdAt.getTime() + 45 * 60000);
});

// Indexes
orderSchema.index({ orderId: 1 }, { unique: true });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ partnerId: 1, createdAt: -1 });
orderSchema.index({ shipperId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'customerInfo.phone': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'deliveryTime.estimated': 1 });
orderSchema.index({ 'paymentStatus': 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;

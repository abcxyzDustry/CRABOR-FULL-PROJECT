const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['customer', 'shipper', 'partner', 'admin'], 
    default: 'customer' 
  },
  address: String,
  avatar: String,
  isActive: { type: Boolean, default: true },
  registrationDate: { type: Date, default: Date.now },
  lastLogin: Date
}, { timestamps: true });

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { 
    type: String, 
    enum: ['appetizer', 'main', 'dessert', 'drink', 'combo'],
    required: true 
  },
  image: String,
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partnerName: String,
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  discount: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  preparationTime: Number // in minutes
}, { timestamps: true });

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number,
    notes: String
  }],
  
  subtotal: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  
  partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  partnerName: String,
  
  shipperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  shipperName: String,
  shipperPhone: String,
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivering', 'delivered', 'cancelled'],
    default: 'pending' 
  },
  
  paymentMethod: { 
    type: String, 
    enum: ['cod', 'momo', 'banking', 'wallet'], 
    default: 'cod' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed'], 
    default: 'pending' 
  },
  
  notes: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  
  location: {
    pickup: {
      lat: Number,
      lng: Number,
      address: String
    },
    delivery: {
      lat: Number,
      lng: Number,
      address: String
    }
  },
  
  rating: {
    food: Number,
    delivery: Number,
    comment: String
  }
}, { timestamps: true });

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['order_payment', 'shipper_payout', 'partner_payout', 'refund', 'topup'],
    required: true 
  },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  method: String,
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending' 
  },
  description: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Banner Schema for advertising
const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  image: { type: String, required: true },
  link: String,
  target: { 
    type: String, 
    enum: ['all', 'customer', 'shipper', 'partner'],
    default: 'all' 
  },
  position: { type: String, default: 'top' },
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  clickCount: { type: Number, default: 0 },
  displayCount: { type: Number, default: 0 }
}, { timestamps: true });

// Shipper Registration Schema
const shipperRegistrationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fullName: String,
  email: String,
  phone: String,
  address: String,
  idCardNumber: String,
  idCardFront: String,
  idCardBack: String,
  driverLicense: String,
  vehicleType: String,
  vehiclePlate: String,
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending' 
  },
  activationFee: { type: Number, default: 700000 },
  feeStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending' 
  },
  notes: String,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Banner = mongoose.model('Banner', bannerSchema);
const ShipperRegistration = mongoose.model('ShipperRegistration', shipperRegistrationSchema);

module.exports = {
  User,
  Product,
  Order,
  Transaction,
  Banner,
  ShipperRegistration
};

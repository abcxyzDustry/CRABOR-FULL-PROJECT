const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  phone: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^(0|\+84)(\d{9,10})$/.test(v);
      },
      message: 'Số điện thoại không hợp lệ'
    }
  },
  role: { 
    type: String, 
    enum: ['customer', 'shipper', 'partner', 'admin'], 
    default: 'customer' 
  },
  address: {
    street: String,
    ward: String,
    district: String,
    city: String,
    full: String
  },
  avatar: { 
    type: String,
    default: 'https://ui-avatars.com/api/?name=User&background=5D8C3E&color=fff'
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  registrationDate: { 
    type: Date, 
    default: Date.now 
  },
  lastLogin: Date,
  
  // Shipper specific fields
  shipperInfo: {
    idNumber: String,
    licensePlate: String,
    vehicleType: String,
    bankAccount: String,
    bankName: String,
    accountHolder: String,
    rating: { type: Number, default: 0 },
    totalDeliveries: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    currentLocation: {
      lat: Number,
      lng: Number,
      address: String
    }
  },
  
  // Partner specific fields
  partnerInfo: {
    restaurantName: String,
    businessLicense: String,
    taxCode: String,
    description: String,
    cuisineType: [String],
    openingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },
    rating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true }
  },
  
  // Preferences
  preferences: {
    language: { type: String, default: 'vi' },
    currency: { type: String, default: 'VND' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  
  // Statistics
  statistics: {
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    cancelledOrders: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return '';
  const { street, ward, district, city } = this.address;
  return [street, ward, district, city].filter(Boolean).join(', ');
});

// Method to get role-specific info
userSchema.methods.getRoleInfo = function() {
  switch (this.role) {
    case 'shipper':
      return this.shipperInfo;
    case 'partner':
      return this.partnerInfo;
    default:
      return {};
  }
};

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ 'shipperInfo.isOnline': 1 });
userSchema.index({ 'partnerInfo.isOpen': 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;

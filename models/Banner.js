const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  // Basic Information
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  subtitle: String,
  description: String,
  
  // Visual Content
  image: { 
    type: String, 
    required: true 
  },
  thumbnail: String,
  backgroundColor: {
    type: String,
    default: '#5D8C3E'
  },
  textColor: {
    type: String,
    default: '#FFFFFF'
  },
  
  // Target & Behavior
  targetUrl: String,
  targetScreen: {
    type: String,
    enum: ['home', 'category', 'restaurant', 'product', 'promotion']
  },
  targetAction: {
    type: String,
    enum: ['navigate', 'open_modal', 'open_url', 'call_phone', 'send_email']
  },
  
  // Audience Targeting
  targetAudience: { 
    type: String, 
    enum: ['all', 'customer', 'shipper', 'partner', 'guest'],
    default: 'all' 
  },
  targetRoles: [String],
  targetLocations: [String],
  targetDevices: {
    type: [String],
    enum: ['mobile', 'tablet', 'desktop'],
    default: ['mobile', 'tablet', 'desktop']
  },
  
  // Positioning
  position: { 
    type: String, 
    enum: ['top', 'middle', 'bottom', 'sidebar', 'popup'],
    default: 'top' 
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  order: {
    type: Number,
    default: 0
  },
  
  // Scheduling
  isActive: { 
    type: Boolean, 
    default: true 
  },
  scheduleType: {
    type: String,
    enum: ['always', 'date_range', 'specific_days', 'time_slot'],
    default: 'always'
  },
  startDate: { 
    type: Date, 
    default: Date.now 
  },
  endDate: Date,
  specificDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  timeSlots: [{
    startTime: String, // HH:mm format
    endTime: String
  }],
  
  // Statistics
  displayCount: { 
    type: Number, 
    default: 0 
  },
  clickCount: { 
    type: Number, 
    default: 0 
  },
  conversionCount: {
    type: Number,
    default: 0
  },
  
  // Performance Metrics
  ctr: { // Click-through rate
    type: Number,
    default: 0
  },
  conversionRate: {
    type: Number,
    default: 0
  },
  
  // Pricing
  pricingType: {
    type: String,
    enum: ['cpc', 'cpm', 'fixed', 'free'],
    default: 'free'
  },
  price: {
    type: Number,
    default: 0
  },
  totalCost: {
    type: Number,
    default: 0
  },
  
  // Campaign Information
  campaignId: String,
  campaignName: String,
  
  // Owner Information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  lastDisplayed: Date,
  lastClicked: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update metrics before save
bannerSchema.pre('save', function(next) {
  // Calculate CTR
  if (this.displayCount > 0) {
    this.ctr = (this.clickCount / this.displayCount) * 100;
  }
  
  // Calculate conversion rate
  if (this.clickCount > 0) {
    this.conversionRate = (this.conversionCount / this.clickCount) * 100;
  }
  
  // Check if banner should be active based on schedule
  if (this.scheduleType !== 'always') {
    this.isActive = this.checkSchedule();
  }
  
  this.updatedAt = Date.now();
  next();
});

// Method to check schedule
bannerSchema.methods.checkSchedule = function() {
  const now = new Date();
  
  switch (this.scheduleType) {
    case 'date_range':
      if (this.startDate && this.endDate) {
        return now >= this.startDate && now <= this.endDate;
      }
      break;
      
    case 'specific_days':
      if (this.specificDays && this.specificDays.length > 0) {
        const day = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        return this.specificDays.includes(day);
      }
      break;
      
    case 'time_slot':
      if (this.timeSlots && this.timeSlots.length > 0) {
        const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
        return this.timeSlots.some(slot => 
          currentTime >= slot.startTime && currentTime <= slot.endTime
        );
      }
      break;
  }
  
  return true;
};

// Virtual for banner status
bannerSchema.virtual('status').get(function() {
  if (!this.isActive) return 'inactive';
  
  if (this.scheduleType === 'date_range' && this.endDate) {
    const now = new Date();
    if (now > this.endDate) return 'expired';
    if (now < this.startDate) return 'scheduled';
  }
  
  return 'active';
});

// Virtual for remaining days
bannerSchema.virtual('remainingDays').get(function() {
  if (this.endDate) {
    const now = new Date();
    const diff = this.endDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Indexes
bannerSchema.index({ isActive: 1, position: 1, priority: -1 });
bannerSchema.index({ targetAudience: 1, isActive: 1 });
bannerSchema.index({ partnerId: 1, isActive: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });
bannerSchema.index({ campaignId: 1 });
bannerSchema.index({ createdAt: -1 });
bannerSchema.index({ ctr: -1 });
bannerSchema.index({ 'targetLocations': 1 });

const Banner = mongoose.model('Banner', bannerSchema);

module.exports = Banner;

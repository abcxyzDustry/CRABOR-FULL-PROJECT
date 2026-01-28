const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: { 
    type: String,
    trim: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: { 
    type: String, 
    enum: [
      'appetizer', 
      'main', 
      'dessert', 
      'drink', 
      'combo',
      'vegetarian',
      'fastfood',
      'traditional'
    ],
    required: true 
  },
  subcategory: String,
  images: [{
    url: String,
    alt: String,
    isPrimary: { type: Boolean, default: false }
  }],
  partnerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  partnerName: String,
  isAvailable: { 
    type: Boolean, 
    default: true 
  },
  isFeatured: { 
    type: Boolean, 
    default: false 
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  discount: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  },
  discountAmount: {
    type: Number,
    min: 0
  },
  rating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: { 
    type: Number, 
    default: 0 
  },
  totalSold: {
    type: Number,
    default: 0
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15
  },
  ingredients: [String],
  allergens: [String],
  nutritionalInfo: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  },
  customizationOptions: [{
    name: String,
    options: [{
      name: String,
      price: Number
    }]
  }],
  tags: [String],
  
  // Stock management
  stock: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  minOrderQuantity: {
    type: Number,
    default: 1
  },
  maxOrderQuantity: {
    type: Number,
    default: 10
  },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for final price
productSchema.virtual('finalPrice').get(function() {
  if (this.discount > 0) {
    return this.price * (1 - this.discount / 100);
  }
  if (this.discountAmount > 0) {
    return Math.max(0, this.price - this.discountAmount);
  }
  return this.price;
});

// Virtual for discount value
productSchema.virtual('discountValue').get(function() {
  if (this.discount > 0) {
    return this.price * (this.discount / 100);
  }
  return this.discountAmount || 0;
});

// Auto-generate slug
productSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  this.updatedAt = Date.now();
  next();
});

// Indexes
productSchema.index({ partnerId: 1, isAvailable: 1 });
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ isFeatured: 1, createdAt: -1 });
productSchema.index({ rating: -1, reviewCount: -1 });
productSchema.index({ totalSold: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'finalPrice': 1 });
productSchema.index({ slug: 1 }, { unique: true });

const Product = mongoose.model('Product', productSchema);

module.exports = Product;

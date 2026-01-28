const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');

// Common validation rules
const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    }
    
    next();
  };
};

// Authentication validations
const validateRegister = validateRequest([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail()
    .custom(async (email) => {
      const user = await User.findOne({ email });
      if (user) {
        throw new Error('Email already registered');
      }
      return true;
    }),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .matches(/^(0|\+84)(\d{9,10})$/)
    .withMessage('Please provide a valid Vietnamese phone number')
    .custom(async (phone) => {
      const user = await User.findOne({ phone });
      if (user) {
        throw new Error('Phone number already registered');
      }
      return true;
    }),
  
  body('role')
    .optional()
    .isIn(['customer', 'shipper', 'partner'])
    .withMessage('Invalid role'),
]);

const validateLogin = validateRequest([
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]);

const validateResetPassword = validateRequest([
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
]);

// Order validations
const validateCreateOrder = validateRequest([
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  
  body('items.*.productId')
    .isMongoId()
    .withMessage('Invalid product ID'),
  
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  
  body('deliveryAddress')
    .notEmpty()
    .withMessage('Delivery address is required'),
  
  body('customerInfo.name')
    .notEmpty()
    .withMessage('Customer name is required'),
  
  body('customerInfo.phone')
    .matches(/^(0|\+84)(\d{9,10})$/)
    .withMessage('Please provide a valid Vietnamese phone number'),
  
  body('paymentMethod')
    .isIn(['cod', 'momo', 'banking', 'wallet', 'credit_card'])
    .withMessage('Invalid payment method'),
  
  body('deliveryType')
    .optional()
    .isIn(['standard', 'express', 'scheduled'])
    .withMessage('Invalid delivery type'),
  
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
]);

const validateUpdateOrderStatus = validateRequest([
  param('id')
    .isMongoId()
    .withMessage('Invalid order ID'),
  
  body('status')
    .isIn([
      'pending', 'confirmed', 'preparing', 'ready', 'assigned',
      'picked_up', 'delivering', 'delivered', 'cancelled',
      'refunded', 'failed'
    ])
    .withMessage('Invalid status'),
  
  body('note')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Note must not exceed 200 characters'),
]);

// Product validations
const validateCreateProduct = validateRequest([
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Product name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  
  body('category')
    .isIn([
      'appetizer', 'main', 'dessert', 'drink', 'combo',
      'vegetarian', 'fastfood', 'traditional'
    ])
    .withMessage('Invalid category'),
  
  body('preparationTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Preparation time must be at least 1 minute'),
  
  body('stock')
    .optional()
    .isInt({ min: -1 })
    .withMessage('Stock must be -1 for unlimited or a positive number'),
  
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount must be between 0 and 100'),
  
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean'),
]);

const validateUpdateProduct = validateCreateProduct; // Same validation for update

// User validations
const validateUpdateProfile = validateRequest([
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .matches(/^(0|\+84)(\d{9,10})$/)
    .withMessage('Please provide a valid Vietnamese phone number')
    .custom(async (phone, { req }) => {
      const user = await User.findOne({ phone, _id: { $ne: req.user._id } });
      if (user) {
        throw new Error('Phone number already registered');
      }
      return true;
    }),
  
  body('address')
    .optional()
    .isObject()
    .withMessage('Address must be an object'),
  
  body('address.street')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Street must not exceed 200 characters'),
  
  body('preferences.language')
    .optional()
    .isIn(['vi', 'en'])
    .withMessage('Language must be either vi or en'),
  
  body('preferences.currency')
    .optional()
    .isIn(['VND', 'USD'])
    .withMessage('Currency must be either VND or USD'),
]);

const validateChangePassword = validateRequest([
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
]);

// Banner validations
const validateCreateBanner = validateRequest([
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('targetUrl')
    .optional()
    .isURL()
    .withMessage('Target URL must be a valid URL'),
  
  body('targetAudience')
    .isIn(['all', 'customer', 'shipper', 'partner', 'guest'])
    .withMessage('Invalid target audience'),
  
  body('position')
    .isIn(['top', 'middle', 'bottom', 'sidebar', 'popup'])
    .withMessage('Invalid position'),
  
  body('priority')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Priority must be between 1 and 10'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  body('pricingType')
    .optional()
    .isIn(['cpc', 'cpm', 'fixed', 'free'])
    .withMessage('Invalid pricing type'),
  
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
]);

// Review validations
const validateCreateReview = validateRequest([
  body('targetType')
    .isIn(['product', 'restaurant', 'shipper', 'customer'])
    .withMessage('Invalid target type'),
  
  body('targetId')
    .isMongoId()
    .withMessage('Invalid target ID'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('content')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Review content must be between 10 and 1000 characters'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title must not exceed 100 characters'),
]);

// Shipper registration validations
const validateShipperRegistration = validateRequest([
  body('userInfo.name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('userInfo.phone')
    .matches(/^(0|\+84)(\d{9,10})$/)
    .withMessage('Please provide a valid Vietnamese phone number'),
  
  body('address')
    .isObject()
    .withMessage('Address must be an object'),
  
  body('address.full')
    .notEmpty()
    .withMessage('Full address is required'),
  
  body('idCardNumber')
    .matches(/^\d{9,12}$/)
    .withMessage('Invalid ID card number'),
  
  body('driverLicense')
    .notEmpty()
    .withMessage('Driver license number is required'),
  
  body('vehicleType')
    .isIn(['motorbike', 'bicycle', 'car', 'electric_bike'])
    .withMessage('Invalid vehicle type'),
  
  body('vehiclePlate')
    .matches(/^[0-9]{2}[A-Z]{1,2}-?[0-9]{3,5}(\.[0-9]{2})?$/)
    .withMessage('Invalid vehicle plate number'),
  
  body('agreedToTerms')
    .isBoolean()
    .withMessage('You must agree to the terms and conditions')
    .custom(value => value === true)
    .withMessage('You must agree to the terms and conditions'),
]);

// Query parameter validations
const validatePagination = validateRequest([
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  
  query('sort')
    .optional()
    .isString()
    .withMessage('Sort must be a string'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be either asc or desc'),
]);

const validateDateRange = validateRequest([
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('period')
    .optional()
    .isIn(['today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year'])
    .withMessage('Invalid period'),
]);

// File upload validations
const validateFileUpload = (fieldName, maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }
    
    const files = req.file ? [req.file] : req.files;
    
    for (const file of files) {
      // Check file size
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          error: `File ${file.originalname} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
        });
      }
      
      // Check file type
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          error: `File ${file.originalname} has invalid type. Allowed types: ${allowedTypes.join(', ')}`
        });
      }
    }
    
    next();
  };
};

// Custom validators
const isMongoIdArray = (value) => {
  if (!Array.isArray(value)) {
    throw new Error('Must be an array');
  }
  
  const mongoIdRegex = /^[0-9a-fA-F]{24}$/;
  for (const id of value) {
    if (!mongoIdRegex.test(id)) {
      throw new Error(`Invalid MongoDB ID: ${id}`);
    }
  }
  
  return true;
};

const isInRange = (min, max) => {
  return (value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num < min || num > max) {
      throw new Error(`Value must be between ${min} and ${max}`);
    }
    return true;
  };
};

module.exports = {
  validateRequest,
  validateRegister,
  validateLogin,
  validateResetPassword,
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateCreateProduct,
  validateUpdateProduct,
  validateUpdateProfile,
  validateChangePassword,
  validateCreateBanner,
  validateCreateReview,
  validateShipperRegistration,
  validatePagination,
  validateDateRange,
  validateFileUpload,
  isMongoIdArray,
  isInRange
};

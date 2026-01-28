const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crabor-secret-key');
    
    // Find user
    const user = await User.findOne({
      _id: decoded.userId,
      isActive: true
    }).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    // Check if token is still valid (not blacklisted)
    // You can implement token blacklisting here if needed
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Optional authentication (doesn't throw error if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crabor-secret-key');
      const user = await User.findOne({
        _id: decoded.userId,
        isActive: true
      }).select('-password');
      
      if (user) {
        req.user = user;
        req.token = token;
        
        // Update last login
        user.lastLogin = new Date();
        await user.save();
      }
    }
  } catch (error) {
    // Silently fail for optional auth
    console.log('Optional auth error:', error.message);
  }
  
  next();
};

// Check ownership middleware
const checkOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const document = await model.findById(req.params[paramName]);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }

      // Admin can access everything
      if (req.user.role === 'admin') {
        req.document = document;
        return next();
      }

      // Check ownership based on model
      let isOwner = false;
      
      if (model.modelName === 'User') {
        isOwner = document._id.toString() === req.user._id.toString();
      } else if (model.modelName === 'Product') {
        isOwner = document.partnerId.toString() === req.user._id.toString();
      } else if (model.modelName === 'Order') {
        isOwner = document.customerId.toString() === req.user._id.toString() ||
                  document.partnerId?.toString() === req.user._id.toString() ||
                  document.shipperId?.toString() === req.user._id.toString();
      } else if (document.userId) {
        isOwner = document.userId.toString() === req.user._id.toString();
      }

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to access this resource'
        });
      }

      req.document = document;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

// Rate limiting middleware
const rateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const timestamps = requests.get(key);
    
    // Remove timestamps outside the window
    const windowStart = now - windowMs;
    while (timestamps.length && timestamps[0] < windowStart) {
      timestamps.shift();
    }
    
    // Check if limit exceeded
    if (timestamps.length >= max) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.'
      });
    }
    
    // Add current timestamp
    timestamps.push(now);
    
    // Set headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - timestamps.length);
    res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    
    next();
  };
};

// Validate API key middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.header('X-API-Key');
  
  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }
  
  // Validate API key (implement your own validation logic)
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
  
  if (!validApiKeys.includes(apiKey)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid API key'
    });
  }
  
  next();
};

// CORS middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : ['http://localhost:3000', 'https://crabor.com'];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`${req.method} ${req.url} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Not found middleware
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkOwnership,
  rateLimit,
  validateApiKey,
  corsOptions,
  requestLogger,
  errorHandler,
  notFound
};

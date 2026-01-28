const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ShipperRegistration } = require('./database');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, phone, role, address } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      name,
      phone,
      role: role || 'customer',
      address,
      registrationDate: new Date()
    });
    
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'crabor-jwt-secret',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Email hoặc mật khẩu không đúng' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'crabor-jwt-secret',
      { expiresIn: '7d' }
    );
    
    res.json({
      message: 'Đăng nhập thành công',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Register as shipper
router.post('/register-shipper', async (req, res) => {
  try {
    const {
      userId,
      fullName,
      email,
      phone,
      address,
      idCardNumber,
      idCardFront,
      idCardBack,
      driverLicense,
      vehicleType,
      vehiclePlate
    } = req.body;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    // Check if already registered as shipper
    const existingRegistration = await ShipperRegistration.findOne({ userId });
    if (existingRegistration) {
      return res.status(400).json({ error: 'Bạn đã đăng ký làm shipper' });
    }
    
    // Create shipper registration
    const shipperRegistration = new ShipperRegistration({
      userId,
      fullName,
      email,
      phone,
      address,
      idCardNumber,
      idCardFront,
      idCardBack,
      driverLicense,
      vehicleType,
      vehiclePlate,
      activationFee: 700000,
      feeStatus: 'pending',
      status: 'pending'
    });
    
    await shipperRegistration.save();
    
    res.status(201).json({
      message: 'Đăng ký shipper thành công. Vui lòng chờ xét duyệt.',
      registrationId: shipperRegistration._id
    });
  } catch (error) {
    console.error('Shipper registration error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Approve shipper registration (admin only)
router.post('/approve-shipper/:registrationId', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { adminId, notes } = req.body;
    
    // Check if admin exists
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền thực hiện' });
    }
    
    // Find registration
    const registration = await ShipperRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({ error: 'Đơn đăng ký không tồn tại' });
    }
    
    // Update registration status
    registration.status = 'approved';
    registration.reviewedBy = adminId;
    registration.reviewedAt = new Date();
    registration.notes = notes;
    
    await registration.save();
    
    // Update user role
    await User.findByIdAndUpdate(registration.userId, { role: 'shipper' });
    
    res.json({
      message: 'Đã duyệt đăng ký shipper',
      registration
    });
  } catch (error) {
    console.error('Approve shipper error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Không có token xác thực' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crabor-jwt-secret');
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;

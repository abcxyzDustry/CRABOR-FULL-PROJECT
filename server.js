require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Import routes
const authRoutes = require('./modules/auth');
const orderRoutes = require('./modules/orders');
const productRoutes = require('./modules/products');
const userRoutes = require('./modules/users');
const analyticsRoutes = require('./modules/analytics');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'crabor-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Socket.io for real-time updates
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });
  
  socket.on('orderUpdate', (data) => {
    io.to(`order_${data.orderId}`).emit('orderStatusChanged', data);
    io.to('admin').emit('newOrderNotification', data);
  });
  
  socket.on('shipperLocation', (data) => {
    io.to(`order_${data.orderId}`).emit('shipperTracking', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/customer', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/shipper', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/shipper.html'));
});

app.get('/partner', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/partner.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://123456789a@admin:123456789a@cluster0.tsgu8lv.mongodb.net/crabor?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Customer interface: http://localhost:${PORT}/customer`);
  console.log(`🚚 Shipper interface: http://localhost:${PORT}/shipper`);
  console.log(`🏪 Partner interface: http://localhost:${PORT}/partner`);
  console.log(`👑 Admin interface: http://localhost:${PORT}/admin`);
});

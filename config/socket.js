const socketIO = require('socket.io');

class SocketServer {
  constructor(server) {
    this.io = socketIO(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.initialize();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);

      // Authentication
      socket.on('authenticate', (token) => {
        this.handleAuthentication(socket, token);
      });

      // Join rooms based on user role
      socket.on('join-room', (room) => {
        socket.join(room);
        console.log(`Client ${socket.id} joined room: ${room}`);
      });

      // Leave room
      socket.on('leave-room', (room) => {
        socket.leave(room);
        console.log(`Client ${socket.id} left room: ${room}`);
      });

      // Order events
      socket.on('order-create', (data) => {
        this.handleOrderCreate(socket, data);
      });

      socket.on('order-update', (data) => {
        this.handleOrderUpdate(socket, data);
      });

      socket.on('order-accept', (data) => {
        this.handleOrderAccept(socket, data);
      });

      // Location tracking
      socket.on('location-update', (data) => {
        this.handleLocationUpdate(socket, data);
      });

      // Chat messages
      socket.on('send-message', (data) => {
        this.handleSendMessage(socket, data);
      });

      // Disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Error handling
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });

    // Broadcast system stats periodically
    this.startSystemStatsBroadcast();
  }

  handleAuthentication(socket, token) {
    try {
      // Verify JWT token
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crabor-secret-key');
      
      // Store user info in socket
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      // Join user-specific room
      socket.join(`user_${socket.userId}`);
      socket.join(`role_${socket.userRole}`);
      
      // Join additional rooms based on role
      if (socket.userRole === 'shipper') {
        socket.join('shippers');
      } else if (socket.userRole === 'partner') {
        socket.join('partners');
      } else if (socket.userRole === 'admin') {
        socket.join('admin');
      }
      
      console.log(`✅ Client ${socket.id} authenticated as ${socket.userRole}: ${socket.userId}`);
      socket.emit('authenticated', { userId: socket.userId, role: socket.userRole });
      
    } catch (error) {
      console.error(`Authentication failed for ${socket.id}:`, error.message);
      socket.emit('authentication-error', { message: 'Authentication failed' });
    }
  }

  handleOrderCreate(socket, data) {
    const { orderId, customerId, partnerId, orderData } = data;
    
    // Emit to customer
    this.io.to(`user_${customerId}`).emit('order-created', {
      orderId,
      message: 'Đơn hàng của bạn đã được tạo thành công',
      orderData
    });
    
    // Emit to partner
    if (partnerId) {
      this.io.to(`user_${partnerId}`).emit('new-order', {
        orderId,
        message: 'Có đơn hàng mới',
        orderData
      });
    }
    
    // Emit to admin
    this.io.to('admin').emit('order-created-admin', {
      orderId,
      customerId,
      partnerId,
      orderData
    });
    
    console.log(`📦 Order created: ${orderId}`);
  }

  handleOrderUpdate(socket, data) {
    const { orderId, status, updatedBy, message } = data;
    
    // Get order from database to find related users
    const Order = require('../models/Order');
    
    Order.findById(orderId)
      .then(order => {
        if (!order) return;
        
        // Emit to all related users
        const rooms = [
          `user_${order.customerId}`,
          `order_${orderId}`
        ];
        
        if (order.partnerId) {
          rooms.push(`user_${order.partnerId}`);
        }
        
        if (order.shipperId) {
          rooms.push(`user_${order.shipperId}`);
        }
        
        // Broadcast update
        rooms.forEach(room => {
          this.io.to(room).emit('order-updated', {
            orderId,
            status,
            updatedBy,
            message,
            timestamp: new Date()
          });
        });
        
        console.log(`🔄 Order updated: ${orderId} - ${status}`);
      })
      .catch(error => {
        console.error('Error finding order for update:', error);
      });
  }

  handleOrderAccept(socket, data) {
    const { orderId, shipperId } = data;
    
    // Update order in database
    const Order = require('../models/Order');
    
    Order.findByIdAndUpdate(orderId, {
      shipperId,
      status: 'assigned',
      'shipperInfo.isOnline': true
    })
      .then(order => {
        if (!order) return;
        
        // Notify customer
        this.io.to(`user_${order.customerId}`).emit('shipper-assigned', {
          orderId,
          shipperId,
          message: 'Shipper đã nhận đơn của bạn'
        });
        
        // Notify partner
        if (order.partnerId) {
          this.io.to(`user_${order.partnerId}`).emit('shipper-assigned-partner', {
            orderId,
            shipperId
          });
        }
        
        // Notify other shippers
        this.io.to('shippers').except(`user_${shipperId}`).emit('order-accepted', {
          orderId,
          message: 'Đơn hàng đã được shipper khác nhận'
        });
        
        console.log(`🚚 Order ${orderId} accepted by shipper ${shipperId}`);
      })
      .catch(error => {
        console.error('Error accepting order:', error);
      });
  }

  handleLocationUpdate(socket, data) {
    const { shipperId, orderId, lat, lng, address, speed } = data;
    
    // Update shipper location in database
    const User = require('../models/User');
    
    User.findByIdAndUpdate(shipperId, {
      'shipperInfo.currentLocation': { lat, lng }
    })
      .then(() => {
        // Broadcast location to order room
        this.io.to(`order_${orderId}`).emit('location-update', {
          shipperId,
          lat,
          lng,
          address,
          speed,
          timestamp: new Date()
        });
        
        // Broadcast to admin
        this.io.to('admin').emit('shipper-location', {
          shipperId,
          lat,
          lng,
          orderId
        });
      })
      .catch(error => {
        console.error('Error updating shipper location:', error);
      });
  }

  handleSendMessage(socket, data) {
    const { orderId, senderId, senderRole, message, type = 'text' } = data;
    
    // Save message to database (optional)
    const Chat = require('../models/Chat');
    
    const chatMessage = new Chat({
      orderId,
      senderId,
      senderRole,
      message,
      type,
      timestamp: new Date()
    });
    
    chatMessage.save()
      .then(() => {
        // Broadcast to order room
        this.io.to(`order_${orderId}`).emit('new-message', {
          orderId,
          senderId,
          senderRole,
          message,
          type,
          timestamp: new Date()
        });
        
        console.log(`💬 New message in order ${orderId}`);
      })
      .catch(error => {
        console.error('Error saving chat message:', error);
      });
  }

  handleDisconnect(socket) {
    console.log(`🔌 Client disconnected: ${socket.id}`);
    
    if (socket.userId) {
      // Update user status if they were online
      if (socket.userRole === 'shipper') {
        const User = require('../models/User');
        User.findByIdAndUpdate(socket.userId, {
          'shipperInfo.isOnline': false
        }).catch(console.error);
      }
    }
  }

  startSystemStatsBroadcast() {
    setInterval(() => {
      const stats = {
        connectedClients: this.io.engine.clientsCount,
        timestamp: new Date(),
        memoryUsage: process.memoryUsage()
      };
      
      this.io.to('admin').emit('system-stats', stats);
    }, 30000); // Every 30 seconds
  }

  // Helper methods
  broadcastToRole(role, event, data) {
    this.io.to(`role_${role}`).emit(event, data);
  }

  sendToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  sendToOrder(orderId, event, data) {
    this.io.to(`order_${orderId}`).emit(event, data);
  }

  // Get connected users
  getConnectedUsers() {
    const sockets = this.io.sockets.sockets;
    const users = [];
    
    sockets.forEach(socket => {
      if (socket.userId) {
        users.push({
          socketId: socket.id,
          userId: socket.userId,
          userRole: socket.userRole,
          connectedAt: socket.connectedAt
        });
      }
    });
    
    return users;
  }

  // Get room members
  getRoomMembers(room) {
    const roomSockets = this.io.sockets.adapter.rooms.get(room);
    if (!roomSockets) return [];
    
    const members = [];
    roomSockets.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket && socket.userId) {
        members.push({
          socketId,
          userId: socket.userId,
          userRole: socket.userRole
        });
      }
    });
    
    return members;
  }
}

module.exports = SocketServer;

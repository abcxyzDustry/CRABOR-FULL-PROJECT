const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // Transaction Identification
  transactionId: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true
  },
  referenceId: String,
  
  // Related Entities
  orderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order' 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  userType: {
    type: String,
    enum: ['customer', 'shipper', 'partner', 'admin', 'system'],
    required: true
  },
  
  // Transaction Details
  type: { 
    type: String, 
    enum: [
      'order_payment',    // Thanh toán đơn hàng
      'shipper_payout',   // Chi trả shipper
      'partner_payout',   // Chi trả đối tác
      'refund',           // Hoàn tiền
      'topup',            // Nạp tiền
      'withdrawal',       // Rút tiền
      'commission',       // Hoa hồng
      'service_fee',      // Phí dịch vụ
      'adjustment',       // Điều chỉnh
      'other'             // Khác
    ],
    required: true 
  },
  category: {
    type: String,
    enum: ['income', 'expense', 'transfer']
  },
  
  // Amount Details
  amount: { 
    type: Number, 
    required: true 
  },
  currency: {
    type: String,
    default: 'VND'
  },
  fee: { 
    type: Number, 
    default: 0 
  },
  tax: {
    type: Number,
    default: 0
  },
  netAmount: { 
    type: Number, 
    required: true 
  },
  
  // Payment Method
  method: {
    type: String,
    enum: [
      'cash',
      'credit_card',
      'debit_card',
      'bank_transfer',
      'momo',
      'zalopay',
      'vnpay',
      'airpay',
      'wallet',
      'points',
      'other'
    ],
    required: true
  },
  paymentGateway: String,
  gatewayTransactionId: String,
  
  // Status
  status: { 
    type: String, 
    enum: [
      'pending',
      'processing',
      'completed',
      'failed',
      'cancelled',
      'refunded'
    ],
    default: 'pending' 
  },
  
  // Description
  description: String,
  notes: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Timestamps
  processedAt: Date,
  completedAt: Date,
  failedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Generate transaction ID
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.transactionId = `TRX-${timestamp}${random}`;
  }
  
  // Auto-calculate category
  if (!this.category) {
    if (['order_payment', 'topup'].includes(this.type)) {
      this.category = 'income';
    } else if (['shipper_payout', 'partner_payout', 'refund', 'withdrawal'].includes(this.type)) {
      this.category = 'expense';
    } else {
      this.category = 'transfer';
    }
  }
  
  // Auto-calculate net amount
  if (this.category === 'income') {
    this.netAmount = this.amount - this.fee - this.tax;
  } else {
    this.netAmount = this.amount + this.fee + this.tax;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Indexes
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ type: 1, status: 1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ category: 1, createdAt: -1 });
transactionSchema.index({ 'metadata.orderNumber': 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;

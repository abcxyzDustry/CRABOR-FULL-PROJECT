const mongoose = require('mongoose');

const shipperRegistrationSchema = new mongoose.Schema({
  // Applicant Information
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  userInfo: {
    name: String,
    email: String,
    phone: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    }
  },
  
  // Contact Information
  address: {
    street: String,
    ward: String,
    district: String,
    city: String,
    full: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  
  // Identification Documents
  idCardNumber: {
    type: String,
    required: true
  },
  idCardFront: { 
    type: String, 
    required: true 
  },
  idCardBack: { 
    type: String, 
    required: true 
  },
  idCardIssuedDate: Date,
  idCardIssuedPlace: String,
  
  // Driving Information
  driverLicense: { 
    type: String, 
    required: true 
  },
  driverLicenseFront: String,
  driverLicenseBack: String,
  driverLicenseType: {
    type: String,
    enum: ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'C', 'D', 'E', 'F']
  },
  driverLicenseIssuedDate: Date,
  driverLicenseExpiryDate: Date,
  
  // Vehicle Information
  vehicleType: {
    type: String,
    enum: ['motorbike', 'bicycle', 'car', 'electric_bike'],
    required: true
  },
  vehicleBrand: String,
  vehicleModel: String,
  vehicleYear: Number,
  vehiclePlate: {
    type: String,
    required: true
  },
  vehicleRegistration: String,
  vehicleInsurance: String,
  
  // Work Information
  workArea: [String],
  workSchedule: {
    type: String,
    enum: ['fulltime', 'parttime', 'flexible'],
    default: 'flexible'
  },
  preferredWorkingHours: [{
    day: {
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: String,
    endTime: String
  }],
  
  // Registration Fee
  activationFee: { 
    type: Number, 
    default: 700000 
  },
  feeStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'waived', 'refunded'],
    default: 'pending' 
  },
  paymentMethod: String,
  paymentTransactionId: String,
  paidAt: Date,
  
  // Application Status
  status: { 
    type: String, 
    enum: [
      'draft',        // Nháp
      'submitted',    // Đã gửi
      'under_review', // Đang xét duyệt
      'approved',     // Đã duyệt
      'rejected',     // Từ chối
      'on_hold',      // Tạm giữ
      'completed'     // Hoàn tất
    ],
    default: 'draft' 
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String,
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Review Information
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewerName: String,
  reviewerRole: String,
  reviewedAt: Date,
  reviewNotes: String,
  rejectionReason: String,
  rejectionDetails: String,
  
  // Additional Documents
  healthCertificate: String,
  policeClearance: String,
  additionalDocuments: [{
    name: String,
    url: String,
    type: String
  }],
  
  // Agreement & Terms
  agreedToTerms: {
    type: Boolean,
    default: false
  },
  termsVersion: String,
  agreedAt: Date,
  
  // Training Information
  trainingStatus: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'failed'],
    default: 'not_started'
  },
  trainingScore: Number,
  trainingCompletedAt: Date,
  
  // Equipment Information
  equipmentProvided: [{
    name: String,
    quantity: Number,
    providedAt: Date
  }],
  equipmentFee: {
    type: Number,
    default: 0
  },
  
  // Notes
  notes: String,
  internalNotes: String,
  
  // Timestamps
  submittedAt: Date,
  approvedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update status history
shipperRegistrationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      note: `Changed to ${this.status}`
    });
  }
  
  // Set timestamps based on status
  if (this.isModified('status')) {
    switch (this.status) {
      case 'submitted':
        this.submittedAt = new Date();
        break;
      case 'approved':
        this.approvedAt = new Date();
        break;
      case 'completed':
        this.completedAt = new Date();
        break;
    }
  }
  
  this.updatedAt = Date.now();
  next();
});

// Virtual for application age
shipperRegistrationSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for isExpired
shipperRegistrationSchema.virtual('isExpired').get(function() {
  if (this.status === 'submitted') {
    const daysSinceSubmission = Math.floor((Date.now() - this.submittedAt) / (1000 * 60 * 60 * 24));
    return daysSinceSubmission > 30; // Expire after 30 days
  }
  return false;
});

// Indexes
shipperRegistrationSchema.index({ userId: 1 }, { unique: true });
shipperRegistrationSchema.index({ status: 1, createdAt: -1 });
shipperRegistrationSchema.index({ feeStatus: 1 });
shipperRegistrationSchema.index({ reviewedBy: 1 });
shipperRegistrationSchema.index({ submittedAt: -1 });
shipperRegistrationSchema.index({ 'userInfo.phone': 1 });
shipperRegistrationSchema.index({ 'vehiclePlate': 1 });
shipperRegistrationSchema.index({ 'idCardNumber': 1 });

const ShipperRegistration = mongoose.model('ShipperRegistration', shipperRegistrationSchema);

module.exports = ShipperRegistration;

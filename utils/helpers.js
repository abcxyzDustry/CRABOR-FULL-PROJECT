const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class Helpers {
  // Generate unique ID
  static generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}${timestamp}${random}`.toUpperCase();
  }

  // Generate order number
  static generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `CR${year}${month}${day}${random}`;
  }

  // Generate transaction ID
  static generateTransactionId() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `TRX${timestamp}${random}`;
  }

  // Generate JWT token
  static generateToken(userId, role, expiresIn = '7d') {
    return jwt.sign(
      { userId, role },
      process.env.JWT_SECRET || 'crabor-secret-key',
      { expiresIn }
    );
  }

  // Verify JWT token
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'crabor-secret-key');
    } catch (error) {
      return null;
    }
  }

  // Hash password
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // Compare password
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generate random string
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Generate OTP
  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  // Format currency
  static formatCurrency(amount, currency = 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Format date
  static formatDate(date, format = 'DD/MM/YYYY HH:mm') {
    return moment(date).format(format);
  }

  // Calculate distance between coordinates (in km)
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static toRad(value) {
    return value * Math.PI / 180;
  }

  // Calculate delivery fee based on distance
  static calculateDeliveryFee(distanceKm, baseFee = 10000, perKm = 3000) {
    const minDistance = 2; // Free for first 2km
    const maxDistance = 10; // Max distance for calculation
    
    if (distanceKm <= minDistance) {
      return baseFee;
    }
    
    const extraDistance = Math.min(distanceKm - minDistance, maxDistance - minDistance);
    return baseFee + Math.ceil(extraDistance) * perKm;
  }

  // Calculate estimated delivery time
  static calculateEstimatedTime(distanceKm, preparationTime = 15) {
    const averageSpeed = 20; // km/h
    const deliveryTime = (distanceKm / averageSpeed) * 60; // in minutes
    return Math.ceil(preparationTime + deliveryTime);
  }

  // Generate slug from string
  static generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  // Validate email
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate Vietnamese phone number
  static isValidPhone(phone) {
    const phoneRegex = /^(0|\+84)(\d{9,10})$/;
    return phoneRegex.test(phone);
  }

  // Validate Vietnamese ID card
  static isValidIdCard(idCard) {
    const idCardRegex = /^\d{9,12}$/;
    return idCardRegex.test(idCard);
  }

  // Send email
  static async sendEmail(to, subject, html) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const info = await transporter.sendMail({
        from: `"Crabor" <${process.env.SMTP_FROM || 'no-reply@crabor.com'}>`,
        to,
        subject,
        html
      });

      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }

  // Send SMS (placeholder - integrate with actual SMS service)
  static async sendSMS(phone, message) {
    console.log(`SMS to ${phone}: ${message}`);
    // Implement actual SMS integration here
    return true;
  }

  // Generate QR code data
  static generateQRCodeData(data) {
    // Implement QR code generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  }

  // Pagination helper
  static paginate(array, page = 1, limit = 10) {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const results = array.slice(startIndex, endIndex);
    
    return {
      data: results,
      pagination: {
        total: array.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(array.length / limit),
        hasNext: endIndex < array.length,
        hasPrev: startIndex > 0
      }
    };
  }

  // Sort array by field
  static sortArray(array, field, order = 'asc') {
    return array.sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }

  // Filter array by query
  static filterArray(array, query) {
    return array.filter(item => {
      for (const key in query) {
        if (query[key] && item[key]) {
          if (typeof item[key] === 'string') {
            if (!item[key].toLowerCase().includes(query[key].toLowerCase())) {
              return false;
            }
          } else if (item[key] !== query[key]) {
            return false;
          }
        }
      }
      return true;
    });
  }

  // Calculate age from date of birth
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  // Generate statistics
  static generateStatistics(data, field) {
    const stats = {
      total: data.length,
      average: 0,
      min: Infinity,
      max: -Infinity,
      sum: 0
    };
    
    data.forEach(item => {
      const value = item[field];
      if (typeof value === 'number') {
        stats.sum += value;
        stats.min = Math.min(stats.min, value);
        stats.max = Math.max(stats.max, value);
      }
    });
    
    stats.average = stats.total > 0 ? stats.sum / stats.total : 0;
    
    return stats;
  }

  // Truncate text
  static truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  // Sanitize input
  static sanitizeInput(input) {
    if (typeof input === 'string') {
      return input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>"'`]/g, '') // Remove dangerous characters
        .trim();
    }
    return input;
  }

  // Generate file name with timestamp
  static generateFileName(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${random}.${extension}`;
  }

  // Convert object to query string
  static objectToQueryString(obj) {
    return Object.keys(obj)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
      .join('&');
  }

  // Parse query string to object
  static queryStringToObject(queryString) {
    return queryString.split('&').reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      if (key && value) {
        acc[decodeURIComponent(key)] = decodeURIComponent(value);
      }
      return acc;
    }, {});
  }

  // Delay function
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Retry function
  static async retry(fn, retries = 3, delayMs = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.delay(delayMs * Math.pow(2, i)); // Exponential backoff
      }
    }
  }

  // Validate URL
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Get current timestamp in different formats
  static getTimestamp(format = 'ISO') {
    const now = new Date();
    
    switch (format) {
      case 'ISO':
        return now.toISOString();
      case 'UNIX':
        return Math.floor(now.getTime() / 1000);
      case 'UTC':
        return now.toUTCString();
      case 'LOCAL':
        return now.toLocaleString();
      default:
        return now.toISOString();
    }
  }

  // Generate color from string (for avatars)
  static stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }

  // Calculate commission
  static calculateCommission(amount, commissionRate = 20) {
    return (amount * commissionRate) / 100;
  }

  // Calculate shipper earnings
  static calculateShipperEarnings(deliveryFee, commissionRate = 10) {
    const commission = (deliveryFee * commissionRate) / 100;
    return deliveryFee - commission;
  }
}

module.exports = Helpers;

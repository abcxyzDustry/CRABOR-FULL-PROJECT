// constants.js - Application constants

// User roles
const USER_ROLES = {
    ADMIN: 'admin',
    CUSTOMER: 'customer',
    PARTNER: 'partner',
    SHIPPER: 'shipper'
};

// Order statuses
const ORDER_STATUS = {
    PENDING: 'pending',           // Đơn hàng mới tạo
    CONFIRMED: 'confirmed',       // Đã xác nhận
    PREPARING: 'preparing',       // Đang chuẩn bị
    READY: 'ready',               // Sẵn sàng giao
    PICKED_UP: 'picked_up',       // Shipper đã lấy hàng
    DELIVERING: 'delivering',     // Đang giao hàng
    COMPLETED: 'completed',       // Giao hàng thành công
    CANCELLED: 'cancelled',       // Đã hủy
    REFUNDED: 'refunded'          // Đã hoàn tiền
};

// Payment methods
const PAYMENT_METHODS = {
    COD: 'cod',                   // Thanh toán khi nhận hàng
    MOMO: 'momo',                 // Ví MoMo
    ZALOPAY: 'zalopay',           // Zalopay
    BANKING: 'banking',           // Chuyển khoản ngân hàng
    CREDIT_CARD: 'credit_card'    // Thẻ tín dụng
};

// Payment status
const PAYMENT_STATUS = {
    PENDING: 'pending',           // Chờ thanh toán
    PROCESSING: 'processing',     // Đang xử lý
    COMPLETED: 'completed',       // Thanh toán thành công
    FAILED: 'failed',             // Thanh toán thất bại
    REFUNDED: 'refunded'          // Đã hoàn tiền
};

// Product categories
const PRODUCT_CATEGORIES = {
    MAIN_DISH: 'main_dish',       // Món chính
    APPETIZER: 'appetizer',       // Khai vị
    DRINK: 'drink',               // Đồ uống
    DESSERT: 'dessert',           // Tráng miệng
    COMBO: 'combo',               // Combo
    VEGETARIAN: 'vegetarian'      // Đồ chay
};

// Notification types
const NOTIFICATION_TYPES = {
    ORDER: 'order',               // Thông báo đơn hàng
    SYSTEM: 'system',             // Thông báo hệ thống
    PROMOTION: 'promotion',       // Khuyến mãi
    REMINDER: 'reminder',         // Nhắc nhở
    SECURITY: 'security'          // Bảo mật
};

// Notification priorities
const NOTIFICATION_PRIORITIES = {
    LOW: 'low',                   // Ưu tiên thấp
    NORMAL: 'normal',             // Ưu tiên bình thường
    HIGH: 'high',                 // Ưu tiên cao
    URGENT: 'urgent'              // Khẩn cấp
};

// Banner target audiences
const BANNER_AUDIENCES = {
    ALL: 'all',                   // Tất cả người dùng
    CUSTOMER: 'customer',         // Chỉ khách hàng
    PARTNER: 'partner',           // Chỉ đối tác
    SHIPPER: 'shipper'            // Chỉ shipper
};

// Review status
const REVIEW_STATUS = {
    PENDING: 'pending',           // Chờ duyệt
    APPROVED: 'approved',         // Đã duyệt
    REJECTED: 'rejected'          // Đã từ chối
};

// Shipper status
const SHIPPER_STATUS = {
    PENDING: 'pending',           // Chờ duyệt
    ACTIVE: 'active',             // Đang hoạt động
    INACTIVE: 'inactive',         // Ngừng hoạt động
    SUSPENDED: 'suspended'        // Tạm ngừng
};

// Partner status
const PARTNER_STATUS = {
    PENDING: 'pending',           // Chờ duyệt
    ACTIVE: 'active',             // Đang hoạt động
    INACTIVE: 'inactive',         // Ngừng hoạt động
    SUSPENDED: 'suspended'        // Tạm ngừng
};

// Commission rates (percentage)
const COMMISSION_RATES = {
    PARTNER: 20,                  // 20% cho đối tác
    SHIPPER: 15                   // 15% cho shipper
};

// Delivery fees (VNĐ)
const DELIVERY_FEES = {
    BASE: 15000,                  // Phí giao hàng cơ bản
    PER_KM: 5000,                 // Phí mỗi km
    MIN_ORDER: 30000              // Đơn hàng tối thiểu
};

// Order cancellation reasons
const CANCELLATION_REASONS = {
    CUSTOMER: {
        CHANGE_MIND: 'change_mind',           // Thay đổi ý định
        WRONG_ORDER: 'wrong_order',           // Đặt nhầm đơn
        LONG_WAIT: 'long_wait',               // Chờ quá lâu
        OTHER: 'other'                        // Lý do khác
    },
    PARTNER: {
        OUT_OF_STOCK: 'out_of_stock',         // Hết hàng
        CLOSED: 'closed',                     // Đã đóng cửa
        OTHER: 'other'                        // Lý do khác
    },
    SYSTEM: {
        PAYMENT_FAILED: 'payment_failed',     // Thanh toán thất bại
        INVALID_ORDER: 'invalid_order',       // Đơn hàng không hợp lệ
        OTHER: 'other'                        // Lý do khác
    }
};

// Time constants (in milliseconds)
const TIME_CONSTANTS = {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000
};

// Order time limits (in minutes)
const ORDER_TIME_LIMITS = {
    PREPARATION: 30,              // Thời gian chuẩn bị tối đa
    DELIVERY: 60,                 // Thời gian giao hàng tối đa
    CANCELLATION: 5               // Thời gian hủy đơn (sau khi đặt)
};

// Pagination defaults
const PAGINATION_DEFAULTS = {
    PAGE: 1,
    LIMIT: 20,
    MAX_LIMIT: 100
};

// File upload limits
const FILE_LIMITS = {
    MAX_SIZE: 5 * 1024 * 1024,    // 5MB
    ALLOWED_TYPES: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ]
};

// Cache TTL (in seconds)
const CACHE_TTL = {
    SHORT: 300,                   // 5 phút
    MEDIUM: 1800,                 // 30 phút
    LONG: 3600,                   // 1 giờ
    VERY_LONG: 86400              // 1 ngày
};

// API response status codes
const API_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
    VALIDATION_ERROR: 'validation_error',
    AUTH_ERROR: 'auth_error',
    NOT_FOUND: 'not_found'
};

// Socket events
const SOCKET_EVENTS = {
    // Order events
    ORDER_CREATED: 'order_created',
    ORDER_UPDATED: 'order_updated',
    ORDER_STATUS_CHANGED: 'order_status_changed',
    
    // User events
    USER_CONNECTED: 'user_connected',
    USER_DISCONNECTED: 'user_disconnected',
    
    // Notification events
    NOTIFICATION_SENT: 'notification_sent',
    NOTIFICATION_READ: 'notification_read',
    
    // Chat events
    MESSAGE_SENT: 'message_sent',
    MESSAGE_RECEIVED: 'message_received',
    
    // Location events
    LOCATION_UPDATED: 'location_updated',
    DELIVERY_TRACKING: 'delivery_tracking'
};

// Environment modes
const ENV_MODES = {
    DEVELOPMENT: 'development',
    PRODUCTION: 'production',
    TEST: 'test'
};

// Error messages
const ERROR_MESSAGES = {
    // Authentication errors
    INVALID_CREDENTIALS: 'Email hoặc mật khẩu không chính xác',
    UNAUTHORIZED: 'Không có quyền truy cập',
    TOKEN_EXPIRED: 'Token đã hết hạn',
    TOKEN_INVALID: 'Token không hợp lệ',
    
    // Validation errors
    REQUIRED_FIELD: 'Trường này là bắt buộc',
    INVALID_EMAIL: 'Email không hợp lệ',
    INVALID_PHONE: 'Số điện thoại không hợp lệ',
    PASSWORD_TOO_WEAK: 'Mật khẩu quá yếu',
    
    // Resource errors
    NOT_FOUND: 'Không tìm thấy tài nguyên',
    ALREADY_EXISTS: 'Đã tồn tại',
    OUT_OF_STOCK: 'Hết hàng',
    
    // Order errors
    ORDER_CANCELLED: 'Đơn hàng đã bị hủy',
    ORDER_COMPLETED: 'Đơn hàng đã hoàn thành',
    INVALID_ORDER_STATUS: 'Trạng thái đơn hàng không hợp lệ',
    
    // Payment errors
    PAYMENT_FAILED: 'Thanh toán thất bại',
    INSUFFICIENT_BALANCE: 'Số dư không đủ',
    
    // System errors
    SERVER_ERROR: 'Lỗi máy chủ',
    DATABASE_ERROR: 'Lỗi cơ sở dữ liệu',
    NETWORK_ERROR: 'Lỗi kết nối mạng'
};

// Success messages
const SUCCESS_MESSAGES = {
    // General
    CREATED: 'Tạo thành công',
    UPDATED: 'Cập nhật thành công',
    DELETED: 'Xóa thành công',
    
    // Authentication
    LOGIN_SUCCESS: 'Đăng nhập thành công',
    REGISTER_SUCCESS: 'Đăng ký thành công',
    LOGOUT_SUCCESS: 'Đăng xuất thành công',
    
    // Order
    ORDER_CREATED: 'Đặt hàng thành công',
    ORDER_UPDATED: 'Cập nhật đơn hàng thành công',
    ORDER_CANCELLED: 'Hủy đơn hàng thành công',
    
    // Payment
    PAYMENT_SUCCESS: 'Thanh toán thành công',
    
    // Profile
    PROFILE_UPDATED: 'Cập nhật thông tin thành công',
    PASSWORD_CHANGED: 'Đổi mật khẩu thành công'
};

// Export all constants
module.exports = {
    USER_ROLES,
    ORDER_STATUS,
    PAYMENT_METHODS,
    PAYMENT_STATUS,
    PRODUCT_CATEGORIES,
    NOTIFICATION_TYPES,
    NOTIFICATION_PRIORITIES,
    BANNER_AUDIENCES,
    REVIEW_STATUS,
    SHIPPER_STATUS,
    PARTNER_STATUS,
    COMMISSION_RATES,
    DELIVERY_FEES,
    CANCELLATION_REASONS,
    TIME_CONSTANTS,
    ORDER_TIME_LIMITS,
    PAGINATION_DEFAULTS,
    FILE_LIMITS,
    CACHE_TTL,
    API_STATUS,
    SOCKET_EVENTS,
    ENV_MODES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES
};

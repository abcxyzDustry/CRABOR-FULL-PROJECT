// validators.js - Input validation utilities
const validator = require('validator');

// Common validation patterns
const patterns = {
    phone: /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/,
    password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
    name: /^[a-zA-ZÀ-ỹ\s]{2,50}$/,
    username: /^[a-zA-Z0-9_]{3,30}$/,
    postalCode: /^[0-9]{5,6}$/
};

// Validation functions
const validators = {
    // Required field
    required: (value, fieldName) => {
        if (!value || value.toString().trim() === '') {
            return `${fieldName} là bắt buộc`;
        }
        return null;
    },

    // Email validation
    email: (value) => {
        if (!validator.isEmail(value)) {
            return 'Email không hợp lệ';
        }
        return null;
    },

    // Phone validation
    phone: (value) => {
        if (!patterns.phone.test(value)) {
            return 'Số điện thoại không hợp lệ';
        }
        return null;
    },

    // Password validation
    password: (value) => {
        if (!patterns.password.test(value)) {
            return 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số';
        }
        return null;
    },

    // Name validation
    name: (value, fieldName = 'Tên') => {
        if (!patterns.name.test(value)) {
            return `${fieldName} phải từ 2-50 ký tự và chỉ chứa chữ cái`;
        }
        return null;
    },

    // Username validation
    username: (value) => {
        if (!patterns.username.test(value)) {
            return 'Tên đăng nhập phải từ 3-30 ký tự, chỉ chứa chữ, số và gạch dưới';
        }
        return null;
    },

    // Minimum length
    minLength: (value, min, fieldName) => {
        if (value.length < min) {
            return `${fieldName} phải có ít nhất ${min} ký tự`;
        }
        return null;
    },

    // Maximum length
    maxLength: (value, max, fieldName) => {
        if (value.length > max) {
            return `${fieldName} không được vượt quá ${max} ký tự`;
        }
        return null;
    },

    // Numeric range
    numberRange: (value, min, max, fieldName) => {
        const num = Number(value);
        if (isNaN(num)) {
            return `${fieldName} phải là số`;
        }
        if (num < min || num > max) {
            return `${fieldName} phải từ ${min} đến ${max}`;
        }
        return null;
    },

    // Positive number
    positiveNumber: (value, fieldName) => {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
            return `${fieldName} phải là số dương`;
        }
        return null;
    },

    // URL validation
    url: (value, fieldName = 'URL') => {
        if (value && !validator.isURL(value, { require_protocol: true })) {
            return `${fieldName} không hợp lệ`;
        }
        return null;
    },

    // Date validation
    date: (value, fieldName = 'Ngày') => {
        if (!validator.isISO8601(value)) {
            return `${fieldName} không hợp lệ`;
        }
        return null;
    },

    // Future date validation
    futureDate: (value, fieldName = 'Ngày') => {
        if (!validator.isISO8601(value)) {
            return `${fieldName} không hợp lệ`;
        }
        const date = new Date(value);
        if (date <= new Date()) {
            return `${fieldName} phải là ngày trong tương lai`;
        }
        return null;
    },

    // Array validation
    array: (value, fieldName = 'Mảng') => {
        if (!Array.isArray(value)) {
            return `${fieldName} phải là mảng`;
        }
        return null;
    },

    // Non-empty array
    nonEmptyArray: (value, fieldName = 'Mảng') => {
        const error = validators.array(value, fieldName);
        if (error) return error;
        if (value.length === 0) {
            return `${fieldName} không được rỗng`;
        }
        return null;
    },

    // Object validation
    object: (value, fieldName = 'Đối tượng') => {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return `${fieldName} phải là đối tượng`;
        }
        return null;
    },

    // Boolean validation
    boolean: (value, fieldName = 'Giá trị') => {
        if (typeof value !== 'boolean') {
            return `${fieldName} phải là true hoặc false`;
        }
        return null;
    },

    // Match validation
    match: (value, confirmValue, fieldName = 'Giá trị') => {
        if (value !== confirmValue) {
            return `${fieldName} không khớp`;
        }
        return null;
    },

    // Vietnamese text validation (with diacritics)
    vietnameseText: (value, fieldName = 'Văn bản') => {
        const vietnamesePattern = /^[a-zA-ZÀ-ỹ0-9\s.,!?-]+$/;
        if (!vietnamesePattern.test(value)) {
            return `${fieldName} chứa ký tự không hợp lệ`;
        }
        return null;
    },

    // Postal code validation
    postalCode: (value) => {
        if (!patterns.postalCode.test(value)) {
            return 'Mã bưu điện không hợp lệ';
        }
        return null;
    },

    // Image URL validation
    imageUrl: (value) => {
        if (value && !validator.isURL(value)) {
            return 'URL hình ảnh không hợp lệ';
        }
        
        // Check if it's an image extension
        if (value) {
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
            const hasImageExtension = imageExtensions.some(ext => 
                value.toLowerCase().endsWith(ext)
            );
            
            if (!hasImageExtension) {
                return 'URL phải trỏ đến file hình ảnh hợp lệ';
            }
        }
        
        return null;
    }
};

// Schema-based validation
const validateSchema = (data, schema) => {
    const errors = [];
    
    for (const [field, rules] of Object.entries(schema)) {
        const value = data[field];
        
        for (const rule of rules) {
            let error = null;
            
            if (typeof rule === 'function') {
                error = rule(value, field);
            } else if (typeof rule === 'object') {
                const { validator: validatorFunc, message, params = [] } = rule;
                error = validatorFunc(value, ...params, field);
                
                if (error && message) {
                    error = message;
                }
            } else if (typeof rule === 'string') {
                // Built-in validator
                if (validators[rule]) {
                    error = validators[rule](value, field);
                }
            }
            
            if (error) {
                errors.push({
                    field,
                    message: error
                });
                break; // Stop checking other rules for this field
            }
        }
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
};

// Common schemas
const schemas = {
    // User registration
    register: {
        name: [
            validators.required,
            validators.name
        ],
        email: [
            validators.required,
            validators.email
        ],
        phone: [
            validators.required,
            validators.phone
        ],
        password: [
            validators.required,
            validators.password
        ],
        confirmPassword: [
            validators.required,
            (value, fieldName, data) => validators.match(value, data.password, 'Mật khẩu xác nhận')
        ],
        role: [
            validators.required,
            (value) => {
                const validRoles = ['customer', 'partner', 'shipper'];
                if (!validRoles.includes(value)) {
                    return 'Vai trò không hợp lệ';
                }
                return null;
            }
        ]
    },

    // User login
    login: {
        email: [
            validators.required,
            validators.email
        ],
        password: [
            validators.required
        ]
    },

    // User profile update
    profileUpdate: {
        name: [
            validators.required,
            validators.name
        ],
        phone: [
            validators.required,
            validators.phone
        ],
        avatar: [
            validators.url
        ]
    },

    // Password change
    passwordChange: {
        currentPassword: [
            validators.required
        ],
        newPassword: [
            validators.required,
            validators.password
        ],
        confirmPassword: [
            validators.required,
            (value, fieldName, data) => validators.match(value, data.newPassword, 'Mật khẩu mới')
        ]
    },

    // Product creation/update
    product: {
        name: [
            validators.required,
            validators.minLength.bind(null, 2),
            validators.maxLength.bind(null, 100)
        ],
        description: [
            validators.required,
            validators.minLength.bind(null, 10),
            validators.maxLength.bind(null, 500)
        ],
        price: [
            validators.required,
            validators.positiveNumber
        ],
        category: [
            validators.required
        ],
        stock: [
            validators.required,
            validators.numberRange.bind(null, 0, 1000)
        ],
        image: [
            validators.required,
            validators.imageUrl
        ]
    },

    // Order creation
    order: {
        items: [
            validators.required,
            validators.nonEmptyArray.bind(null, 'Sản phẩm')
        ],
        deliveryAddress: [
            validators.required,
            validators.minLength.bind(null, 10)
        ],
        paymentMethod: [
            validators.required,
            (value) => {
                const validMethods = ['cod', 'momo', 'banking', 'credit_card'];
                if (!validMethods.includes(value)) {
                    return 'Phương thức thanh toán không hợp lệ';
                }
                return null;
            }
        ],
        notes: [
            validators.maxLength.bind(null, 500)
        ]
    },

    // Address
    address: {
        label: [
            validators.required,
            validators.minLength.bind(null, 2),
            validators.maxLength.bind(null, 50)
        ],
        name: [
            validators.required,
            validators.name
        ],
        phone: [
            validators.required,
            validators.phone
        ],
        address: [
            validators.required,
            validators.minLength.bind(null, 10)
        ],
        city: [
            validators.required
        ],
        district: [
            validators.required
        ],
        ward: [
            validators.required
        ]
    },

    // Banner
    banner: {
        title: [
            validators.required,
            validators.minLength.bind(null, 5),
            validators.maxLength.bind(null, 100)
        ],
        description: [
            validators.maxLength.bind(null, 200)
        ],
        imageUrl: [
            validators.required,
            validators.imageUrl
        ],
        link: [
            validators.url
        ],
        targetAudience: [
            validators.required,
            (value) => {
                const validAudiences = ['all', 'customer', 'partner', 'shipper'];
                if (!validAudiences.includes(value)) {
                    return 'Đối tượng mục tiêu không hợp lệ';
                }
                return null;
            }
        ],
        priority: [
            validators.numberRange.bind(null, 1, 10)
        ]
    },

    // Review
    review: {
        rating: [
            validators.required,
            validators.numberRange.bind(null, 1, 5)
        ],
        comment: [
            validators.maxLength.bind(null, 500)
        ]
    }
};

// Export validation functions
module.exports = {
    ...validators,
    validateSchema,
    schemas,
    
    // Helper function to validate request body
    validateRequest: (req, schemaName) => {
        const schema = schemas[schemaName];
        if (!schema) {
            throw new Error(`Schema ${schemaName} not found`);
        }
        
        return validateSchema(req.body, schema);
    }
};

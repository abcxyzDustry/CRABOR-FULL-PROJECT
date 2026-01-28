const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'general';
    
    // Determine folder based on route or file type
    if (req.originalUrl.includes('/products')) {
      folder = 'products';
    } else if (req.originalUrl.includes('/users') && req.originalUrl.includes('/avatar')) {
      folder = 'avatars';
    } else if (req.originalUrl.includes('/banners')) {
      folder = 'banners';
    } else if (req.originalUrl.includes('/shippers')) {
      folder = 'shippers';
    }
    
    const dir = path.join(uploadDir, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    cb(null, dir);
  },
  
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true
  };
  
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

// Configure upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 10 // Max 10 files
  }
});

// Image optimization (optional - requires sharp package)
const optimizeImage = async (filePath) => {
  try {
    const sharp = require('sharp');
    
    await sharp(filePath)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: 80 })
      .toFile(filePath.replace(path.extname(filePath), '.optimized.jpg'));
    
    // Replace original with optimized
    fs.unlinkSync(filePath);
    fs.renameSync(
      filePath.replace(path.extname(filePath), '.optimized.jpg'),
      filePath.replace(path.extname(filePath), '.jpg')
    );
    
    return true;
  } catch (error) {
    console.error('Image optimization failed:', error);
    return false;
  }
};

// Generate thumbnail
const generateThumbnail = async (filePath, size = 300) => {
  try {
    const sharp = require('sharp');
    const thumbnailPath = filePath.replace(path.extname(filePath), `_thumb${path.extname(filePath)}`);
    
    await sharp(filePath)
      .resize(size, size, {
        fit: 'cover',
        position: 'center'
      })
      .toFile(thumbnailPath);
    
    return thumbnailPath;
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return null;
  }
};

// Delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      
      // Also delete thumbnail if exists
      const thumbPath = filePath.replace(path.extname(filePath), `_thumb${path.extname(filePath)}`);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('File deletion failed:', error);
    return false;
  }
};

// Get file URL
const getFileUrl = (filePath) => {
  if (!filePath) return null;
  
  const relativePath = path.relative(uploadDir, filePath);
  return `/uploads/${relativePath.replace(/\\/g, '/')}`;
};

// Get thumbnail URL
const getThumbnailUrl = (filePath) => {
  if (!filePath) return null;
  
  const thumbPath = filePath.replace(path.extname(filePath), `_thumb${path.extname(filePath)}`);
  return getFileUrl(thumbPath);
};

// Multiple upload configurations
const uploadSingle = (fieldName) => upload.single(fieldName);
const uploadArray = (fieldName, maxCount) => upload.array(fieldName, maxCount);
const uploadFields = (fields) => upload.fields(fields);

// Cloud storage configuration (for production)
const cloudStorage = {
  // AWS S3 configuration
  s3: {
    // Configuration here
  },
  
  // Cloudinary configuration
  cloudinary: {
    // Configuration here
  }
};

module.exports = {
  upload,
  uploadSingle,
  uploadArray,
  uploadFields,
  optimizeImage,
  generateThumbnail,
  deleteFile,
  getFileUrl,
  getThumbnailUrl,
  uploadDir
};

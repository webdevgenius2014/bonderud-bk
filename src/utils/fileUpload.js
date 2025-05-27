import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApiError } from './apiError.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File type configurations
const fileTypes = {
  images: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    extensions: /jpeg|jpg|png|gif|webp/,
    maxSize: 5 * 1024 * 1024 // 5MB
  },
  documents: {
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    extensions: /pdf|doc|docx/,
    maxSize: 10 * 1024 * 1024 // 10MB
  },
  videos: {
    mimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime'],
    extensions: /mp4|mpeg|mov/,
    maxSize: 100 * 1024 * 1024 // 100MB
  }
};

// Storage configuration for local development
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads', file.fieldname);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// Memory storage for cloud uploads
const memoryStorage = multer.memoryStorage();

// File filter factory
const createFileFilter = (type) => {
  return (req, file, cb) => {
    const fileConfig = fileTypes[type];
    
    if (!fileConfig) {
      return cb(new ApiError('Invalid file type configuration', 500, 'INVALID_CONFIG'));
    }

    if (!fileConfig.mimeTypes.includes(file.mimetype)) {
      return cb(new ApiError(
        `Invalid file type. Allowed types: ${fileConfig.mimeTypes.join(', ')}`,
        400,
        'INVALID_FILE_TYPE'
      ));
    }

    const extname = fileConfig.extensions.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (!extname) {
      return cb(new ApiError(
        'Invalid file extension',
        400,
        'INVALID_FILE_EXTENSION'
      ));
    }

    cb(null, true);
  };
};

// Upload configurations
export const uploadConfig = {
  // Attorney profile photo upload
  attorneyPhoto: multer({
    storage: localStorage,
    limits: { fileSize: fileTypes.images.maxSize },
    fileFilter: createFileFilter('images')
  }).single('profilePhoto'),

  // Attorney gallery upload
  attorneyGallery: multer({
    storage: localStorage,
    limits: { fileSize: fileTypes.images.maxSize },
    fileFilter: createFileFilter('images')
  }).array('gallery', 10),

  // Attorney documents upload
  attorneyDocuments: multer({
    storage: localStorage,
    limits: { fileSize: fileTypes.documents.maxSize },
    fileFilter: createFileFilter('documents')
  }).array('documents', 5),

  // Blog featured image upload
  blogFeaturedImage: multer({
    storage: localStorage,
    limits: { fileSize: fileTypes.images.maxSize },
    fileFilter: createFileFilter('images')
  }).single('featuredImage'),

  // Blog gallery upload
  blogGallery: multer({
    storage: localStorage,
    limits: { fileSize: fileTypes.images.maxSize },
    fileFilter: createFileFilter('images')
  }).array('gallery', 20),

  // Practice area media upload
  practiceAreaMedia: multer({
    storage: localStorage,
    limits: { fileSize: fileTypes.images.maxSize },
    fileFilter: createFileFilter('images')
  }).fields([
    { name: 'icon', maxCount: 1 },
    { name: 'featuredImage', maxCount: 1 },
    { name: 'gallery', maxCount: 10 }
  ]),

  // Site settings logo upload
  siteLogo: multer({
    storage: localStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB for logos
    fileFilter: createFileFilter('images')
  }).fields([
    { name: 'primaryLogo', maxCount: 1 },
    { name: 'secondaryLogo', maxCount: 1 },
    { name: 'favicon', maxCount: 1 }
  ])
};

// Cloud upload utility (for future S3/Cloudinary integration)
export const uploadToCloud = async (file, folder) => {
  // Placeholder for cloud upload
  // In production, integrate with AWS S3, Cloudinary, etc.
  
  // Example S3 upload:
  // const s3 = new AWS.S3();
  // const params = {
  //   Bucket: process.env.AWS_BUCKET_NAME,
  //   Key: `${folder}/${file.filename}`,
  //   Body: file.buffer,
  //   ContentType: file.mimetype
  // };
  // const result = await s3.upload(params).promise();
  // return result.Location;

  // For now, return local path
  return `/uploads/${folder}/${file.filename}`;
};

// File deletion utility
export const deleteFile = async (filePath) => {
  try {
    // For local storage
    const fs = await import('fs/promises');
    const fullPath = path.join(__dirname, '../../', filePath);
    await fs.unlink(fullPath);
    
    // For cloud storage
    // await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    
    return true;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
};

// Image optimization utility (placeholder)
export const optimizeImage = async (filePath, options = {}) => {
  // In production, use sharp or imagemin
  // const sharp = require('sharp');
  // await sharp(filePath)
  //   .resize(options.width, options.height)
  //   .jpeg({ quality: options.quality || 80 })
  //   .toFile(outputPath);
  
  return filePath;
};

// Generate thumbnail
export const generateThumbnail = async (filePath, width = 300, height = 300) => {
  // Placeholder for thumbnail generation
  // Use sharp in production
  return filePath;
};
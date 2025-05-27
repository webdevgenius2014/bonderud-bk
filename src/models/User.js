import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import env from '../config/env.js';

/**
 * User Profile Schema
 */
const userProfileSchema = new Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  avatar: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Avatar must be a valid URL'
    }
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\+?[\d\s\-\(\)]{10,}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  department: {
    type: String,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  title: {
    type: String,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  preferredLanguage: {
    type: String,
    enum: ['en', 'es'],
    default: 'en'
  },
  timezone: {
    type: String,
    default: 'America/New_York'
  }
}, { _id: false });

/**
 * User Authentication Schema
 */
const userAuthSchema = new Schema({
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
    max: 5
  },
  lockUntil: Date,
  twoFactorSecret: String,
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  }
}, { _id: false });

/**
 * User Permissions Schema
 */
const userPermissionsSchema = new Schema({
  canCreateUsers: { type: Boolean, default: false },
  canEditUsers: { type: Boolean, default: false },
  canDeleteUsers: { type: Boolean, default: false },
  canManageAttorneys: { type: Boolean, default: false },
  canManagePracticeAreas: { type: Boolean, default: false },
  canManageBlogPosts: { type: Boolean, default: false },
  canManageCaseResults: { type: Boolean, default: false },
  canViewContactSubmissions: { type: Boolean, default: false },
  canManageContactSubmissions: { type: Boolean, default: false },
  canManageSettings: { type: Boolean, default: false },
  canAccessAnalytics: { type: Boolean, default: false }
}, { _id: false });

/**
 * User Session Schema
 */
const userSessionSchema = new Schema({
  refreshToken: String,
  refreshTokenExpires: Date,
  deviceInfo: {
    userAgent: String,
    ip: String,
    device: String,
    browser: String,
    os: String
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

/**
 * Main User Schema
 */
const userSchema = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    validate: {
      validator: function(v) {
        // Password must contain at least one uppercase, one lowercase, one number, and one special character
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(v);
      },
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    },
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'editor', 'viewer'],
      message: 'Role must be one of: {VALUES}'
    },
    required: [true, 'User role is required'],
    default: 'viewer'
  },
  profile: {
    type: userProfileSchema,
    required: true
  },
  auth: {
    type: userAuthSchema,
    default: () => ({})
  },
  permissions: {
    type: userPermissionsSchema,
    default: () => ({})
  },
  session: {
    type: userSessionSchema,
    default: () => ({})
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.auth.passwordResetToken;
      delete ret.auth.emailVerificationToken;
      delete ret.auth.twoFactorSecret;
      delete ret.session.refreshToken;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ 'profile.firstName': 1, 'profile.lastName': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'auth.lastLogin': -1 });
userSchema.index({ 'auth.emailVerificationToken': 1 });
userSchema.index({ 'auth.passwordResetToken': 1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

userSchema.virtual('initials').get(function() {
  return `${this.profile.firstName.charAt(0)}${this.profile.lastName.charAt(0)}`.toUpperCase();
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.auth.lockUntil && this.auth.lockUntil > new Date());
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware for permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = {
          canCreateUsers: true,
          canEditUsers: true,
          canDeleteUsers: true,
          canManageAttorneys: true,
          canManagePracticeAreas: true,
          canManageBlogPosts: true,
          canManageCaseResults: true,
          canViewContactSubmissions: true,
          canManageContactSubmissions: true,
          canManageSettings: true,
          canAccessAnalytics: true
        };
        break;
      case 'editor':
        this.permissions = {
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canManageAttorneys: true,
          canManagePracticeAreas: true,
          canManageBlogPosts: true,
          canManageCaseResults: true,
          canViewContactSubmissions: true,
          canManageContactSubmissions: true,
          canManageSettings: false,
          canAccessAnalytics: true
        };
        break;
      case 'viewer':
      default:
        this.permissions = {
          canCreateUsers: false,
          canEditUsers: false,
          canDeleteUsers: false,
          canManageAttorneys: false,
          canManagePracticeAreas: false,
          canManageBlogPosts: false,
          canManageCaseResults: false,
          canViewContactSubmissions: true,
          canManageContactSubmissions: false,
          canManageSettings: false,
          canAccessAnalytics: false
        };
        break;
    }
  }
  next();
});

// Update lastModified on save
userSchema.pre('save', function(next) {
  this.lastModified = new Date();
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.auth.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.auth.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
};

userSchema.methods.generatePasswordResetToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.auth.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.auth.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return token;
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.auth.lockUntil && this.auth.lockUntil < new Date()) {
    return this.updateOne({
      $unset: { 'auth.lockUntil': 1 },
      $set: { 'auth.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'auth.loginAttempts': 1 } };
  
  // Lock account after 5 attempts for 2 hours
  if (this.auth.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { 'auth.lockUntil': new Date(Date.now() + 2 * 60 * 60 * 1000) };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'auth.loginAttempts': 1, 'auth.lockUntil': 1 }
  });
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase(), isDeleted: false });
};

userSchema.statics.findActive = function() {
  return this.find({ isActive: true, isDeleted: false });
};

userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true, isDeleted: false });
};

// Create and export the model
const User = mongoose.model('User', userSchema);

export default User;
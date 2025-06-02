import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

/**
 * User Profile Schema
 */
const userProfileSchema = new Schema({
  name: {
    en: {
      type: String,
      required: [true, 'English name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    es: {
      type: String,
      required: [true, 'Spanish name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    }
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  avatar: {
    type: String,
    validate: {
      validator(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Avatar must be a valid URL'
    }
  },
  phone: {
    type: String,
    validate: {
      validator(v) {
        return !v || /^\+?[\d\s-()]{10,}$/.test(v);
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
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: Date,
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: Date,
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0,
    max: 5
  },
  lockUntil: Date,
  twoFactorSecret: {
    type: String,
    select: false
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  }
}, { _id: false });


/**
 * Refresh Token Schema
 */
const refreshTokenSchema = new Schema({
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  userAgent: String,
  ipAddress: String
});

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
      validator(v) {
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
      validator(v) {
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
    default: () => ({
      isEmailVerified: false,
      loginAttempts: 0,
      isTwoFactorEnabled: false
    })
  },
  permissions: {
    type: [String],
    default: []
  },
  refreshTokens: [refreshTokenSchema],
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
    transform(_doc, ret) {
      delete ret.password;
      delete ret.auth.resetPasswordToken;
      delete ret.auth.emailVerificationToken;
      delete ret.auth.twoFactorSecret;
      delete ret.refreshTokens;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ 'profile.name.en': 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'auth.lastLogin': -1 });
userSchema.index({ 'auth.emailVerificationToken': 1 });
userSchema.index({ 'auth.resetPasswordToken': 1 });

// Virtual fields
userSchema.virtual('fullName').get(function() {
  return this.profile.name.en || this.profile.name.es;
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
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

// Pre-save middleware for permissions based on role
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch (this.role) {
      case 'admin':
        this.permissions = [
          'users.create',
          'users.read',
          'users.update',
          'users.delete',
          'attorneys.create',
          'attorneys.read',
          'attorneys.update',
          'attorneys.delete',
          'practice-areas.create',
          'practice-areas.read',
          'practice-areas.update',
          'practice-areas.delete',
          'blog.create',
          'blog.read',
          'blog.update',
          'blog.delete',
          'case-results.create',
          'case-results.read',
          'case-results.update',
          'case-results.delete',
          'contacts.read',
          'contacts.update',
          'contacts.delete',
          'settings.read',
          'settings.update',
          'analytics.read'
        ];
        break;
      case 'editor':
        this.permissions = [
          'attorneys.create',
          'attorneys.read',
          'attorneys.update',
          'practice-areas.create',
          'practice-areas.read',
          'practice-areas.update',
          'blog.create',
          'blog.read',
          'blog.update',
          'case-results.create',
          'case-results.read',
          'case-results.update',
          'contacts.read',
          'contacts.update',
          'analytics.read'
        ];
        break;
      case 'viewer':
      default:
        this.permissions = [
          'attorneys.read',
          'practice-areas.read',
          'blog.read',
          'case-results.read',
          'contacts.read'
        ];
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
  this.auth.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.auth.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
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
export const User = mongoose.model('User', userSchema);
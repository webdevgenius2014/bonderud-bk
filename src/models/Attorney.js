import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';

/**
 * Bilingual Content Schema (reusable)
 */
const bilingualContentSchema = new Schema({
  en: {
    type: String,
    required: [true, 'English content is required'],
    trim: true
  },
  es: {
    type: String,
    trim: true
  }
}, { _id: false });

/**
 * Media File Schema
 */
const mediaFileSchema = new Schema({
  url: {
    type: String,
    required: [true, 'Media URL is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Media URL must be a valid URL'
    }
  },
  alt: {
    type: bilingualContentSchema,
    required: true
  },
  caption: bilingualContentSchema,
  filename: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: [0, 'File size cannot be negative']
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { _id: false });

/**
 * Education Schema
 */
const educationSchema = new Schema({
  institution: {
    type: bilingualContentSchema,
    required: [true, 'Institution name is required']
  },
  degree: {
    type: bilingualContentSchema,
    required: [true, 'Degree is required']
  },
  fieldOfStudy: {
    type: bilingualContentSchema,
    required: [true, 'Field of study is required']
  },
  graduationYear: {
    type: Number,
    required: [true, 'Graduation year is required'],
    min: [1900, 'Graduation year must be after 1900'],
    max: [new Date().getFullYear() + 10, 'Graduation year cannot be more than 10 years in the future']
  },
  honors: bilingualContentSchema,
  description: bilingualContentSchema,
  isHighlighted: {
    type: Boolean,
    default: false
  }
}, { _id: false });

/**
 * Experience Schema
 */
const experienceSchema = new Schema({
  position: {
    type: bilingualContentSchema,
    required: [true, 'Position is required']
  },
  company: {
    type: bilingualContentSchema,
    required: [true, 'Company is required']
  },
  location: {
    type: bilingualContentSchema,
    required: [true, 'Location is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: Date,
  description: {
    type: bilingualContentSchema,
    required: [true, 'Description is required']
  },
  achievements: bilingualContentSchema,
  isCurrentPosition: {
    type: Boolean,
    default: false
  },
  isHighlighted: {
    type: Boolean,
    default: false
  }
}, { _id: false });

/**
 * Certification Schema
 */
const certificationSchema = new Schema({
  name: {
    type: bilingualContentSchema,
    required: [true, 'Certification name is required']
  },
  issuingOrganization: {
    type: bilingualContentSchema,
    required: [true, 'Issuing organization is required']
  },
  issueDate: {
    type: Date,
    required: [true, 'Issue date is required']
  },
  expirationDate: Date,
  credentialId: String,
  credentialUrl: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Credential URL must be a valid URL'
    }
  },
  description: bilingualContentSchema
}, { _id: false });

/**
 * Award Schema
 */
const awardSchema = new Schema({
  title: {
    type: bilingualContentSchema,
    required: [true, 'Award title is required']
  },
  organization: {
    type: bilingualContentSchema,
    required: [true, 'Organization is required']
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear(), 'Year cannot be in the future']
  },
  description: bilingualContentSchema,
  category: bilingualContentSchema
}, { _id: false });

/**
 * Membership Schema
 */
const membershipSchema = new Schema({
  organization: {
    type: bilingualContentSchema,
    required: [true, 'Organization is required']
  },
  position: bilingualContentSchema,
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: Date,
  description: bilingualContentSchema,
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

/**
 * Language Proficiency Schema
 */
const languageProficiencySchema = new Schema({
  language: {
    type: bilingualContentSchema,
    required: [true, 'Language is required']
  },
  proficiency: {
    type: String,
    enum: {
      values: ['native', 'fluent', 'conversational', 'basic'],
      message: 'Proficiency must be one of: native, fluent, conversational, basic'
    },
    required: [true, 'Proficiency level is required']
  },
  isCertified: {
    type: Boolean,
    default: false
  },
  certificationDetails: bilingualContentSchema
}, { _id: false });

/**
 * Social Profile Schema
 */
const socialProfileSchema = new Schema({
  platform: {
    type: String,
    enum: {
      values: ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube', 'other'],
      message: 'Platform must be one of: linkedin, twitter, facebook, instagram, youtube, other'
    },
    required: [true, 'Platform is required']
  },
  url: {
    type: String,
    required: [true, 'URL is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'URL must be a valid URL'
    }
  },
  username: String,
  isPublic: {
    type: Boolean,
    default: true
  }
}, { _id: false });

/**
 * Availability Schedule Schema
 */
const scheduleSchema = new Schema({
  day: {
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    required: true
  },
  startTime: {
    type: String,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'Start time must be in HH:mm format'
    }
  },
  endTime: {
    type: String,
    validate: {
      validator: function(v) {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: 'End time must be in HH:mm format'
    }
  },
  isAvailable: {
    type: Boolean,
    default: false
  }
}, { _id: false });

/**
 * Availability Schema
 */
const availabilitySchema = new Schema({
  isAcceptingNewClients: {
    type: Boolean,
    default: true
  },
  preferredContactMethod: {
    type: String,
    enum: {
      values: ['phone', 'email', 'form', 'any'],
      message: 'Preferred contact method must be one of: phone, email, form, any'
    },
    default: 'any'
  },
  responseTimeExpectation: {
    type: bilingualContentSchema,
    default: {
      en: 'Within 24 hours',
      es: 'Dentro de 24 horas'
    }
  },
  consultationTypes: [{
    type: String,
    enum: {
      values: ['in_person', 'phone', 'video', 'email'],
      message: 'Consultation type must be one of: in_person, phone, video, email'
    }
  }],
  availableHours: {
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    schedule: [scheduleSchema]
  }
}, { _id: false });

/**
 * Main Attorney Schema
 */
const attorneySchema = new Schema({
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
  middleName: {
    type: String,
    trim: true,
    maxlength: [50, 'Middle name cannot exceed 50 characters']
  },
  suffix: {
    type: String,
    trim: true,
    maxlength: [10, 'Suffix cannot exceed 10 characters']
  },
  barNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true, // Allow null values but ensure uniqueness when present
    validate: {
      validator: function(v) {
        return !v || /^[A-Z0-9\-]+$/i.test(v);
      },
      message: 'Bar number must contain only letters, numbers, and hyphens'
    }
  },
  title: {
    type: bilingualContentSchema,
    required: [true, 'Title is required']
  },
  bio: {
    type: bilingualContentSchema,
    required: [true, 'Bio is required']
  },
  shortBio: {
    type: bilingualContentSchema,
    required: [true, 'Short bio is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please provide a valid email address'
    }
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    validate: {
      validator: function(v) {
        return /^\+?[\d\s\-\(\)]{10,}$/.test(v);
      },
      message: 'Please provide a valid phone number'
    }
  },
  extension: String,
  directLine: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\+?[\d\s\-\(\)]{10,}$/.test(v);
      },
      message: 'Please provide a valid direct line number'
    }
  },
  fax: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^\+?[\d\s\-\(\)]{10,}$/.test(v);
      },
      message: 'Please provide a valid fax number'
    }
  },
  education: [educationSchema],
  experience: [experienceSchema],
  certifications: [certificationSchema],
  awards: [awardSchema],
  memberships: [membershipSchema],
  languages: [languageProficiencySchema],
  practiceAreas: [{
    type: Schema.Types.ObjectId,
    ref: 'PracticeArea',
    required: true
  }],
  primaryPracticeArea: {
    type: Schema.Types.ObjectId,
    ref: 'PracticeArea'
  },
  profilePhoto: mediaFileSchema,
  photos: [mediaFileSchema],
  socialProfiles: [socialProfileSchema],
  personalWebsite: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Personal website must be a valid URL'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPartner: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  joiningDate: {
    type: Date,
    required: [true, 'Joining date is required']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  metaTitle: {
    type: bilingualContentSchema,
    required: [true, 'Meta title is required']
  },
  metaDescription: {
    type: bilingualContentSchema,
    required: [true, 'Meta description is required']
  },
  availability: {
    type: availabilitySchema,
    required: true
  },
  specialties: {
    type: bilingualContentSchema,
    required: [true, 'Specialties are required']
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  internalNotes: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
attorneySchema.index({ slug: 1 }, { unique: true });
attorneySchema.index({ email: 1 });
attorneySchema.index({ firstName: 1, lastName: 1 });
attorneySchema.index({ isActive: 1 });
attorneySchema.index({ isPublished: 1 });
attorneySchema.index({ isFeatured: 1 });
attorneySchema.index({ isPartner: 1 });
attorneySchema.index({ practiceAreas: 1 });
attorneySchema.index({ primaryPracticeArea: 1 });
attorneySchema.index({ displayOrder: 1 });
attorneySchema.index({ 'availability.isAcceptingNewClients': 1 });
attorneySchema.index({ barNumber: 1 });
attorneySchema.index({ createdAt: -1 });

// Text index for search functionality
attorneySchema.index({
  'firstName': 'text',
  'lastName': 'text',
  'bio.en': 'text',
  'bio.es': 'text',
  'specialties.en': 'text',
  'specialties.es': 'text'
});

// Virtual fields
attorneySchema.virtual('fullName').get(function() {
  const parts = [this.firstName];
  if (this.middleName) parts.push(this.middleName);
  parts.push(this.lastName);
  if (this.suffix) parts.push(this.suffix);
  return parts.join(' ');
});

attorneySchema.virtual('formalName').get(function() {
  const parts = [this.lastName];
  if (this.suffix) parts.push(this.suffix);
  return `${this.firstName} ${parts.join(' ')}`;
});

attorneySchema.virtual('yearsOfExperience').get(function() {
  if (!this.joiningDate) return 0;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - this.joiningDate.getTime());
  const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
  return diffYears;
});

attorneySchema.virtual('isCurrentlyEmployed').get(function() {
  if (!this.experience || this.experience.length === 0) return false;
  return this.experience.some(exp => exp.isCurrentPosition);
});

// Pre-save middleware for slug generation
attorneySchema.pre('save', function(next) {
  if (this.isModified('firstName') || this.isModified('lastName') || !this.slug) {
    this.slug = slugify(`${this.firstName}-${this.lastName}`, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Pre-save middleware for published date
attorneySchema.pre('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Validate primary practice area is in practice areas
attorneySchema.pre('save', function(next) {
  if (this.primaryPracticeArea && this.practiceAreas) {
    const primaryAreaExists = this.practiceAreas.some(
      area => area.toString() === this.primaryPracticeArea?.toString()
    );
    if (!primaryAreaExists) {
      this.practiceAreas.push(this.primaryPracticeArea);
    }
  }
  next();
});

// Static methods
attorneySchema.statics.findActive = function() {
  return this.find({ isActive: true, isPublished: true });
};

attorneySchema.statics.findFeatured = function() {
  return this.find({ isActive: true, isPublished: true, isFeatured: true })
    .sort({ displayOrder: 1, createdAt: -1 });
};

attorneySchema.statics.findByPracticeArea = function(practiceAreaId) {
  return this.find({ 
    isActive: true, 
    isPublished: true, 
    practiceAreas: practiceAreaId 
  }).sort({ displayOrder: 1, createdAt: -1 });
};

attorneySchema.statics.findAcceptingClients = function() {
  return this.find({
    isActive: true,
    isPublished: true,
    'availability.isAcceptingNewClients': true
  }).sort({ displayOrder: 1, createdAt: -1 });
};

attorneySchema.statics.searchAttorneys = function(query) {
  return this.find({
    $text: { $search: query },
    isActive: true,
    isPublished: true
  }, {
    score: { $meta: 'textScore' }
  }).sort({
    score: { $meta: 'textScore' },
    displayOrder: 1
  });
};

// Create and export the model
export const Attorney = mongoose.model('Attorney', attorneySchema);
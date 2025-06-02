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
 * SEO Fields Schema
 */
const seoFieldsSchema = new Schema({
  metaTitle: {
    type: bilingualContentSchema,
    required: [true, 'Meta title is required']
  },
  metaDescription: {
    type: bilingualContentSchema,
    required: [true, 'Meta description is required']
  },
  keywords: {
    type: bilingualContentSchema,
    required: [true, 'Keywords are required']
  },
  canonicalUrl: String,
  ogImage: {
    type: String,
    validate: {
      validator(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'OG Image must be a valid URL'
    }
  },
  ogTitle: bilingualContentSchema,
  ogDescription: bilingualContentSchema,
  structuredData: {
    type: Schema.Types.Mixed,
    default: {}
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
      validator(v) {
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
 * FAQ Schema
 */
const faqSchema = new Schema({
  question: {
    type: bilingualContentSchema,
    required: [true, 'FAQ question is required']
  },
  answer: {
    type: bilingualContentSchema,
    required: [true, 'FAQ answer is required']
  },
  order: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, { _id: false });

/**
 * Service Schema
 */
const serviceSchema = new Schema({
  name: {
    type: bilingualContentSchema,
    required: [true, 'Service name is required']
  },
  description: {
    type: bilingualContentSchema,
    required: [true, 'Service description is required']
  },
  icon: String,
  isHighlighted: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

/**
 * Statistic Schema
 */
const statisticSchema = new Schema({
  label: {
    type: bilingualContentSchema,
    required: [true, 'Statistic label is required']
  },
  value: {
    type: String,
    required: [true, 'Statistic value is required'],
    trim: true
  },
  description: bilingualContentSchema,
  order: {
    type: Number,
    default: 0
  }
}, { _id: false });

/**
 * Main Practice Area Schema
 */
const practiceAreaSchema = new Schema({
  title: {
    type: bilingualContentSchema,
    required: [true, 'Title is required']
  },
  shortDescription: {
    type: bilingualContentSchema,
    required: [true, 'Short description is required']
  },
  description: {
    type: bilingualContentSchema,
    required: [true, 'Description is required']
  },
  detailedContent: {
    type: bilingualContentSchema,
    required: [true, 'Detailed content is required']
  },
  featuredImage: mediaFileSchema,
  gallery: [mediaFileSchema],
  icon: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
    required: [true, 'Slug is required']
  },
  seo: {
    type: seoFieldsSchema,
    required: [true, 'SEO fields are required']
  },
  services: [serviceSchema],
  keyFeatures: [bilingualContentSchema],
  faqs: [faqSchema],
  statistics: [statisticSchema],
  relatedAreas: [{
    type: Schema.Types.ObjectId,
    ref: 'PracticeArea'
  }],
  attorneys: [{
    type: Schema.Types.ObjectId,
    ref: 'Attorney'
  }],
  leadAttorney: {
    type: Schema.Types.ObjectId,
    ref: 'Attorney'
  },
  parentArea: {
    type: Schema.Types.ObjectId,
    ref: 'PracticeArea'
  },
  subAreas: [{
    type: Schema.Types.ObjectId,
    ref: 'PracticeArea'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date,
  isFeatured: {
    type: Boolean,
    default: false
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  excerpt: {
    type: bilingualContentSchema,
    required: [true, 'Excerpt is required']
  },
  callToAction: {
    type: bilingualContentSchema,
    required: [true, 'Call to action is required']
  },
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
practiceAreaSchema.index({ slug: 1 }, { unique: true });
practiceAreaSchema.index({ isActive: 1 });
practiceAreaSchema.index({ isPublished: 1 });
practiceAreaSchema.index({ isFeatured: 1 });
practiceAreaSchema.index({ parentArea: 1 });
practiceAreaSchema.index({ displayOrder: 1 });
practiceAreaSchema.index({ attorneys: 1 });
practiceAreaSchema.index({ leadAttorney: 1 });
practiceAreaSchema.index({ createdAt: -1 });
practiceAreaSchema.index({ publishedAt: -1 });

// Compound indexes
practiceAreaSchema.index({ isActive: 1, isPublished: 1, displayOrder: 1 });
practiceAreaSchema.index({ parentArea: 1, displayOrder: 1 });
practiceAreaSchema.index({ isFeatured: 1, displayOrder: 1 });

// Text index for search functionality
practiceAreaSchema.index({
  'title.en': 'text',
  'title.es': 'text',
  'description.en': 'text',
  'description.es': 'text',
  'seo.keywords.en': 'text',
  'seo.keywords.es': 'text'
});

// Virtual fields
practiceAreaSchema.virtual('attorneyCount').get(function() {
  return this.attorneys ? this.attorneys.length : 0;
});

practiceAreaSchema.virtual('subAreaCount').get(function() {
  return this.subAreas ? this.subAreas.length : 0;
});

practiceAreaSchema.virtual('faqCount').get(function() {
  return this.faqs ? this.faqs.filter(faq => faq.isPublished).length : 0;
});

practiceAreaSchema.virtual('serviceCount').get(function() {
  return this.services ? this.services.length : 0;
});

// Pre-save middleware for slug generation
practiceAreaSchema.pre('save', function(next) {
  if (this.isModified('title') || !this.slug) {
    this.slug = slugify(this.title.en, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
  }
  next();
});

// Pre-save middleware for published date
practiceAreaSchema.pre('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Pre-save middleware to validate lead attorney is in attorneys array
practiceAreaSchema.pre('save', function(next) {
  if (this.leadAttorney && this.attorneys) {
    const leadAttorneyExists = this.attorneys.some(
      attorney => attorney.toString() === this.leadAttorney?.toString()
    );
    if (!leadAttorneyExists) {
      this.attorneys.push(this.leadAttorney);
    }
  }
  next();
});

// Pre-save middleware to sort arrays by order
practiceAreaSchema.pre('save', function(next) {
  if (this.services) {
    this.services.sort((a, b) => a.order - b.order);
  }
  if (this.faqs) {
    this.faqs.sort((a, b) => a.order - b.order);
  }
  if (this.statistics) {
    this.statistics.sort((a, b) => a.order - b.order);
  }
  next();
});

// Pre-remove middleware to handle cascading deletes
practiceAreaSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Remove this practice area from any parent's subAreas
    if (this.parentArea) {
      await this.constructor.updateOne(
        { _id: this.parentArea },
        { $pull: { subAreas: this._id } }
      );
    }

    // Update sub-areas to remove parent reference
    await this.constructor.updateMany(
      { parentArea: this._id },
      { $unset: { parentArea: 1 } }
    );

    // Remove from related areas
    await this.constructor.updateMany(
      { relatedAreas: this._id },
      { $pull: { relatedAreas: this._id } }
    );

    // Update attorneys to remove this practice area
    const Attorney = mongoose.model('Attorney');
    await Attorney.updateMany(
      { practiceAreas: this._id },
      { $pull: { practiceAreas: this._id } }
    );

    // Clear primary practice area references
    await Attorney.updateMany(
      { primaryPracticeArea: this._id },
      { $unset: { primaryPracticeArea: 1 } }
    );

    next();
  } catch (error) {
    next(error);
  }
});

// Static methods
practiceAreaSchema.statics.findActive = function() {
  return this.find({ isActive: true, isPublished: true });
};

practiceAreaSchema.statics.findFeatured = function() {
  return this.find({ isActive: true, isPublished: true, isFeatured: true })
    .sort({ displayOrder: 1, createdAt: -1 });
};

practiceAreaSchema.statics.findTopLevel = function() {
  return this.find({ 
    isActive: true, 
    isPublished: true, 
    parentArea: { $exists: false } 
  }).sort({ displayOrder: 1, createdAt: -1 });
};

practiceAreaSchema.statics.findByParent = function(parentId) {
  return this.find({ 
    isActive: true, 
    isPublished: true, 
    parentArea: parentId 
  }).sort({ displayOrder: 1, createdAt: -1 });
};

practiceAreaSchema.statics.findWithAttorneys = function() {
  return this.find({
    isActive: true,
    isPublished: true,
    attorneys: { $exists: true, $not: { $size: 0 } }
  }).sort({ displayOrder: 1, createdAt: -1 });
};

practiceAreaSchema.statics.searchPracticeAreas = function(query) {
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

practiceAreaSchema.statics.getHierarchy = async function() {
  const areas = await this.find({ isActive: true, isPublished: true })
    .select('title slug icon displayOrder parentArea')
    .sort({ displayOrder: 1, 'title.en': 1 });

  const buildHierarchy = (parentId = null) => areas
      .filter(area => {
        if (parentId === null) {
          return !area.parentArea;
        }
        return area.parentArea && area.parentArea.toString() === parentId.toString();
      })
      .map(area => ({
        _id: area._id,
        title: area.title,
        slug: area.slug,
        icon: area.icon,
        displayOrder: area.displayOrder,
        children: buildHierarchy(area._id)
      }));

  return buildHierarchy();
};

// Instance methods
practiceAreaSchema.methods.getRelatedAreas = function(limit = 3) {
  return this.constructor.find({
    _id: { $in: this.relatedAreas },
    isActive: true,
    isPublished: true
  })
  .limit(limit)
  .select('title shortDescription excerpt featuredImage slug displayOrder');
};

practiceAreaSchema.methods.getAttorneys = function() {
  const Attorney = mongoose.model('Attorney');
  return Attorney.find({
    _id: { $in: this.attorneys },
    isActive: true,
    isPublished: true
  })
  .select('name title shortBio profilePhoto slug displayOrder')
  .sort({ displayOrder: 1, createdAt: -1 });
};

practiceAreaSchema.methods.getLeadAttorney = function() {
  if (!this.leadAttorney) return null;
  
  const Attorney = mongoose.model('Attorney');
  return Attorney.findOne({
    _id: this.leadAttorney,
    isActive: true,
    isPublished: true
  })
  .select('name title bio profilePhoto slug contact');
};

// Create and export the model
export const PracticeArea = mongoose.model('PracticeArea', practiceAreaSchema);
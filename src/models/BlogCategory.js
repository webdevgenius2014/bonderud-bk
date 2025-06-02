import mongoose, { Schema } from 'mongoose';

const blogCategorySchema = new Schema({
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
  slug: {
    en: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator(v) {
          return /^[a-z0-9-]+$/.test(v);
        },
        message: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }
    },
    es: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator(v) {
          return /^[a-z0-9-]+$/.test(v);
        },
        message: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }
    }
  },
  description: {
    en: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    es: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    }
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'BlogCategory',
    default: null
  },
  displayOrder: {
    type: Number,
    default: 0,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  seo: {
    metaTitle: {
      en: {
        type: String,
        maxlength: [60, 'Meta title cannot exceed 60 characters']
      },
      es: {
        type: String,
        maxlength: [60, 'Meta title cannot exceed 60 characters']
      }
    },
    metaDescription: {
      en: {
        type: String,
        maxlength: [160, 'Meta description cannot exceed 160 characters']
      },
      es: {
        type: String,
        maxlength: [160, 'Meta description cannot exceed 160 characters']
      }
    }
  },
  // Soft delete support
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: Date,
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  // Tracking
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
blogCategorySchema.index({ 'slug.en': 1 });
blogCategorySchema.index({ 'slug.es': 1 });
blogCategorySchema.index({ parent: 1, displayOrder: 1 });

// Virtual for post count
blogCategorySchema.virtual('postCount', {
  ref: 'BlogPost',
  localField: '_id',
  foreignField: 'categories',
  count: true,
  match: { status: 'published', isDeleted: false }
});

// Virtual for children categories
blogCategorySchema.virtual('children', {
  ref: 'BlogCategory',
  localField: '_id',
  foreignField: 'parent',
  match: { isActive: true, isDeleted: false }
});

// Pre-save middleware to generate slug
blogCategorySchema.pre('save', function(next) {
  if (this.isModified('name.en') && !this.slug.en) {
    this.slug.en = this.name.en.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  
  if (this.isModified('name.es') && !this.slug.es) {
    this.slug.es = this.name.es.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  // Set SEO defaults
  if (!this.seo.metaTitle.en && this.name.en) {
    this.seo.metaTitle.en = this.name.en.substring(0, 60);
  }
  if (!this.seo.metaTitle.es && this.name.es) {
    this.seo.metaTitle.es = this.name.es.substring(0, 60);
  }
  
  next();
});

// Prevent deletion if category has posts
blogCategorySchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  const BlogPost = mongoose.model('BlogPost');
  const postCount = await BlogPost.countDocuments({
    categories: this._id,
    isDeleted: false
  });
  
  if (postCount > 0) {
    const error = new Error('Cannot delete category with existing posts');
    error.statusCode = 400;
    return next(error);
  }
  
  return next();
});

// Query helpers
blogCategorySchema.query.active = function() {
  return this.where({ isActive: true, isDeleted: false });
};

blogCategorySchema.query.topLevel = function() {
  return this.where({ parent: null });
};

// Static methods
blogCategorySchema.statics.findActive = function() {
  return this.find({ isActive: true, isDeleted: false });
};

blogCategorySchema.statics.findTopLevel = function() {
  return this.findActive().where({ parent: null });
};

blogCategorySchema.statics.findBySlug = function(slug, language = 'en') {
  const query = {};
  query[`slug.${language}`] = slug;
  return this.findOne({ ...query, isActive: true, isDeleted: false });
};

// Instance methods
blogCategorySchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

export const BlogCategory = mongoose.model('BlogCategory', blogCategorySchema);
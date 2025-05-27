import mongoose, { Schema } from 'mongoose';

const blogPostSchema = new Schema({
  title: {
    en: {
      type: String,
      required: [true, 'English title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    es: {
      type: String,
      required: [true, 'Spanish title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
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
        validator: function(v) {
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
        validator: function(v) {
          return /^[a-z0-9-]+$/.test(v);
        },
        message: 'Slug must contain only lowercase letters, numbers, and hyphens'
      }
    }
  },
  content: {
    en: {
      type: String,
      required: [true, 'English content is required']
    },
    es: {
      type: String,
      required: [true, 'Spanish content is required']
    }
  },
  excerpt: {
    en: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters']
    },
    es: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters']
    }
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'Attorney',
    required: [true, 'Author is required'],
    index: true
  },
  categories: [{
    type: Schema.Types.ObjectId,
    ref: 'BlogCategory',
    required: true
  }],
  status: {
    type: String,
    enum: {
      values: ['draft', 'published', 'archived'],
      message: 'Status must be one of: {VALUES}'
    },
    default: 'draft',
    index: true
  },
  publishedAt: {
    type: Date,
    index: true
  },
  featuredImage: {
    url: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Featured image must be a valid URL'
      }
    },
    alt: {
      en: String,
      es: String
    },
    caption: {
      en: String,
      es: String
    }
  },
  gallery: [{
    url: {
      type: String,
      required: true,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Gallery image must be a valid URL'
      }
    },
    alt: {
      en: String,
      es: String
    },
    caption: {
      en: String,
      es: String
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  tags: {
    en: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    es: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  relatedPosts: [{
    type: Schema.Types.ObjectId,
    ref: 'BlogPost',
    validate: {
      validator: function(posts) {
        return posts.length <= 5;
      },
      message: 'Cannot have more than 5 related posts'
    }
  }],
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  readingTime: {
    en: {
      type: Number,
      min: 1,
      default: 1
    },
    es: {
      type: Number,
      min: 1,
      default: 1
    }
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
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
    },
    canonicalUrl: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Canonical URL must be a valid URL'
      }
    },
    ogImage: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'OG image must be a valid URL'
      }
    }
  },
  // Scheduled publishing
  scheduledFor: Date,
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
blogPostSchema.index({ 'slug.en': 1 });
blogPostSchema.index({ 'slug.es': 1 });
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ author: 1, status: 1 });
blogPostSchema.index({ categories: 1, status: 1 });
blogPostSchema.index({ 'tags.en': 1, 'tags.es': 1 });
blogPostSchema.index({ 'title.en': 'text', 'title.es': 'text', 'content.en': 'text', 'content.es': 'text' });

// Virtual for formatted publish date
blogPostSchema.virtual('formattedDate').get(function() {
  return this.publishedAt ? this.publishedAt.toLocaleDateString() : null;
});

// Pre-save middleware
blogPostSchema.pre('save', function(next) {
  // Generate slug from title if not provided
  if (this.isModified('title.en') && !this.slug.en) {
    this.slug.en = this.title.en.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
  
  if (this.isModified('title.es') && !this.slug.es) {
    this.slug.es = this.title.es.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }

  // Auto-generate excerpt from content if not provided
  if (!this.excerpt.en && this.content.en) {
    this.excerpt.en = this.content.en
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 300) + '...';
  }
  
  if (!this.excerpt.es && this.content.es) {
    this.excerpt.es = this.content.es
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .substring(0, 300) + '...';
  }

  // Calculate reading time (average 200 words per minute)
  if (this.isModified('content.en')) {
    const wordCount = this.content.en.replace(/<[^>]*>/g, '').split(/\s+/).length;
    this.readingTime.en = Math.max(1, Math.ceil(wordCount / 200));
  }
  
  if (this.isModified('content.es')) {
    const wordCount = this.content.es.replace(/<[^>]*>/g, '').split(/\s+/).length;
    this.readingTime.es = Math.max(1, Math.ceil(wordCount / 200));
  }

  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }

  // Set SEO defaults
  if (!this.seo.metaTitle.en && this.title.en) {
    this.seo.metaTitle.en = this.title.en.substring(0, 60);
  }
  if (!this.seo.metaTitle.es && this.title.es) {
    this.seo.metaTitle.es = this.title.es.substring(0, 60);
  }
  if (!this.seo.metaDescription.en && this.excerpt.en) {
    this.seo.metaDescription.en = this.excerpt.en.substring(0, 160);
  }
  if (!this.seo.metaDescription.es && this.excerpt.es) {
    this.seo.metaDescription.es = this.excerpt.es.substring(0, 160);
  }

  next();
});

// Query helpers
blogPostSchema.query.published = function() {
  return this.where({ 
    status: 'published', 
    isDeleted: false,
    publishedAt: { $lte: new Date() }
  });
};

blogPostSchema.query.featured = function() {
  return this.where({ isFeatured: true });
};

blogPostSchema.query.byCategory = function(categoryId) {
  return this.where({ categories: categoryId });
};

blogPostSchema.query.byAuthor = function(authorId) {
  return this.where({ author: authorId });
};

// Static methods
blogPostSchema.statics.findPublished = function() {
  return this.find({ 
    status: 'published', 
    isDeleted: false,
    publishedAt: { $lte: new Date() }
  });
};

blogPostSchema.statics.findBySlug = function(slug, language = 'en') {
  const query = {};
  query[`slug.${language}`] = slug;
  return this.findOne({ 
    ...query, 
    status: 'published', 
    isDeleted: false,
    publishedAt: { $lte: new Date() }
  });
};

blogPostSchema.statics.findRelated = function(postId, categories, limit = 3) {
  return this.findPublished()
    .where({
      _id: { $ne: postId },
      categories: { $in: categories }
    })
    .sort({ publishedAt: -1 })
    .limit(limit);
};

// Instance methods
blogPostSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save({ validateBeforeSave: false });
};

blogPostSchema.methods.publish = function() {
  this.status = 'published';
  if (!this.publishedAt) {
    this.publishedAt = new Date();
  }
  return this.save();
};

blogPostSchema.methods.unpublish = function() {
  this.status = 'draft';
  return this.save();
};

blogPostSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

export const BlogPost = mongoose.model('BlogPost', blogPostSchema);
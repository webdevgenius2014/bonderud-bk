import mongoose, { Schema } from 'mongoose';

const caseResultSchema = new Schema({
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
  category: {
    type: String,
    enum: {
      values: ['criminal-defense', 'family-law', 'personal-injury', 'local-counsel'],
      message: 'Category must be one of: {VALUES}'
    },
    required: [true, 'Category is required']
  },
  outcome: {
    en: {
      type: String,
      required: [true, 'English outcome is required'],
      trim: true,
      maxlength: [500, 'Outcome cannot exceed 500 characters']
    },
    es: {
      type: String,
      required: [true, 'Spanish outcome is required'],
      trim: true,
      maxlength: [500, 'Outcome cannot exceed 500 characters']
    }
  },
  description: {
    en: {
      type: String,
      required: [true, 'English description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    es: {
      type: String,
      required: [true, 'Spanish description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    }
  },
  date: {
    type: Date,
    required: [true, 'Case date is required'],
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  client: {
    name: {
      type: String,
      default: 'Confidential',
      trim: true
    },
    testimonial: {
      en: {
        type: String,
        maxlength: [1000, 'Testimonial cannot exceed 1000 characters']
      },
      es: {
        type: String,
        maxlength: [1000, 'Testimonial cannot exceed 1000 characters']
      }
    }
  },
  charges: [{
    en: {
      type: String,
      required: true,
      trim: true
    },
    es: {
      type: String,
      required: true,
      trim: true
    }
  }],
  result: {
    en: {
      type: String,
      required: [true, 'English result is required'],
      trim: true,
      maxlength: [500, 'Result cannot exceed 500 characters']
    },
    es: {
      type: String,
      required: [true, 'Spanish result is required'],
      trim: true,
      maxlength: [500, 'Result cannot exceed 500 characters']
    }
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
  metadata: {
    court: {
      type: String,
      trim: true
    },
    caseNumber: {
      type: String,
      trim: true
    },
    judge: {
      type: String,
      trim: true
    }
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
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }]
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
caseResultSchema.index({ category: 1, featured: -1, date: -1 });
caseResultSchema.index({ 'title.en': 'text', 'title.es': 'text', 'description.en': 'text', 'description.es': 'text' });

// Virtual for slug generation (if needed in future)
caseResultSchema.virtual('slug').get(function() {
  return this.title.en.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
});

// Pre-save middleware to set SEO defaults
caseResultSchema.pre('save', function(next) {
  if (!this.seo.metaTitle.en && this.title.en) {
    this.seo.metaTitle.en = this.title.en.substring(0, 60);
  }
  if (!this.seo.metaTitle.es && this.title.es) {
    this.seo.metaTitle.es = this.title.es.substring(0, 60);
  }
  if (!this.seo.metaDescription.en && this.description.en) {
    this.seo.metaDescription.en = this.description.en.substring(0, 160);
  }
  if (!this.seo.metaDescription.es && this.description.es) {
    this.seo.metaDescription.es = this.description.es.substring(0, 160);
  }
  next();
});

// Query helpers
caseResultSchema.query.active = function() {
  return this.where({ isActive: true, isDeleted: false });
};

caseResultSchema.query.byCategory = function(category) {
  return this.where({ category });
};

caseResultSchema.query.featured = function() {
  return this.where({ featured: true });
};

// Static methods
caseResultSchema.statics.findActive = function() {
  return this.find({ isActive: true, isDeleted: false });
};

caseResultSchema.statics.findByCategory = function(category) {
  return this.findActive().where({ category });
};

caseResultSchema.statics.findFeatured = function() {
  return this.findActive().where({ featured: true });
};

// Instance methods
caseResultSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

caseResultSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

export const CaseResult = mongoose.model('CaseResult', caseResultSchema);
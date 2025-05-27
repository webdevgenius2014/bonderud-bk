import mongoose, { Schema } from 'mongoose';

const clientReviewSchema = new Schema({
  reviewer: {
    name: {
      type: String,
      required: [true, 'Reviewer name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
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
      },
      select: false // Don't expose email by default
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^\+?[\d\s\-\(\)]{10,}$/.test(v);
        },
        message: 'Please provide a valid phone number'
      },
      select: false
    },
    location: {
      city: {
        type: String,
        trim: true,
        maxlength: [50, 'City cannot exceed 50 characters']
      },
      state: {
        type: String,
        trim: true,
        maxlength: [50, 'State cannot exceed 50 characters']
      }
    }
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be between 1 and 5'],
    max: [5, 'Rating must be between 1 and 5'],
    index: true
  },
  title: {
    en: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    es: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    }
  },
  content: {
    en: {
      type: String,
      required: [true, 'English content is required'],
      trim: true,
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: [2000, 'Review cannot exceed 2000 characters']
    },
    es: {
      type: String,
      required: [true, 'Spanish content is required'],
      trim: true,
      minlength: [10, 'Review must be at least 10 characters'],
      maxlength: [2000, 'Review cannot exceed 2000 characters']
    }
  },
  practiceArea: {
    type: Schema.Types.ObjectId,
    ref: 'PracticeArea',
    index: true
  },
  attorney: {
    type: Schema.Types.ObjectId,
    ref: 'Attorney',
    index: true
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Status must be one of: {VALUES}'
    },
    default: 'pending',
    index: true
  },
  moderationNotes: {
    type: String,
    maxlength: [500, 'Moderation notes cannot exceed 500 characters'],
    select: false
  },
  verifiedClient: {
    type: Boolean,
    default: false,
    index: true
  },
  helpful: {
    type: Number,
    default: 0,
    min: 0
  },
  helpfulVoters: [{
    type: String, // IP address or user ID
    select: false
  }],
  dateSubmitted: {
    type: Date,
    default: Date.now,
    index: true
  },
  dateApproved: {
    type: Date,
    index: true
  },
  responseFromFirm: {
    content: {
      en: {
        type: String,
        maxlength: [1000, 'Response cannot exceed 1000 characters']
      },
      es: {
        type: String,
        maxlength: [1000, 'Response cannot exceed 1000 characters']
      }
    },
    respondedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  source: {
    type: String,
    enum: {
      values: ['website', 'google', 'avvo', 'other'],
      message: 'Source must be one of: {VALUES}'
    },
    default: 'website'
  },
  consentToDisplay: {
    type: Boolean,
    required: [true, 'Consent to display is required'],
    validate: {
      validator: function(v) {
        return v === true;
      },
      message: 'Must consent to display review'
    }
  },
  ipAddress: {
    type: String,
    select: false
  },
  userAgent: {
    type: String,
    select: false
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
  moderatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    select: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
clientReviewSchema.index({ status: 1, rating: -1, dateApproved: -1 });
clientReviewSchema.index({ 'reviewer.email': 1 });
clientReviewSchema.index({ 'content.en': 'text', 'content.es': 'text', 'title.en': 'text', 'title.es': 'text' });

// Virtual for average rating display
clientReviewSchema.virtual('displayRating').get(function() {
  return this.rating.toFixed(1);
});

// Pre-save middleware
clientReviewSchema.pre('save', function(next) {
  // Auto-generate title from content if not provided
  if (!this.title.en && this.content.en) {
    this.title.en = this.content.en.substring(0, 50) + '...';
  }
  if (!this.title.es && this.content.es) {
    this.title.es = this.content.es.substring(0, 50) + '...';
  }
  
  // Set approval date when status changes to approved
  if (this.isModified('status') && this.status === 'approved' && !this.dateApproved) {
    this.dateApproved = new Date();
  }
  
  next();
});

// Query helpers
clientReviewSchema.query.approved = function() {
  return this.where({ status: 'approved', isDeleted: false });
};

clientReviewSchema.query.pending = function() {
  return this.where({ status: 'pending', isDeleted: false });
};

clientReviewSchema.query.byRating = function(minRating) {
  return this.where({ rating: { $gte: minRating } });
};

// Static methods
clientReviewSchema.statics.findApproved = function() {
  return this.find({ status: 'approved', isDeleted: false });
};

clientReviewSchema.statics.findPending = function() {
  return this.find({ status: 'pending', isDeleted: false });
};

clientReviewSchema.statics.getAverageRating = async function(filter = {}) {
  const result = await this.aggregate([
    {
      $match: {
        status: 'approved',
        isDeleted: false,
        ...filter
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        distribution: {
          $push: '$rating'
        }
      }
    },
    {
      $project: {
        averageRating: { $round: ['$averageRating', 1] },
        totalReviews: 1,
        ratingDistribution: {
          5: {
            $size: {
              $filter: {
                input: '$distribution',
                cond: { $eq: ['$$this', 5] }
              }
            }
          },
          4: {
            $size: {
              $filter: {
                input: '$distribution',
                cond: { $eq: ['$$this', 4] }
              }
            }
          },
          3: {
            $size: {
              $filter: {
                input: '$distribution',
                cond: { $eq: ['$$this', 3] }
              }
            }
          },
          2: {
            $size: {
              $filter: {
                input: '$distribution',
                cond: { $eq: ['$$this', 2] }
              }
            }
          },
          1: {
            $size: {
              $filter: {
                input: '$distribution',
                cond: { $eq: ['$$this', 1] }
              }
            }
          }
        }
      }
    }
  ]);

  return result[0] || {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  };
};

// Instance methods
clientReviewSchema.methods.approve = function(userId, notes) {
  this.status = 'approved';
  this.moderatedBy = userId;
  this.moderationNotes = notes;
  this.dateApproved = new Date();
  return this.save();
};

clientReviewSchema.methods.reject = function(userId, reason, notes) {
  this.status = 'rejected';
  this.moderatedBy = userId;
  this.rejectionReason = reason;
  this.moderationNotes = notes;
  return this.save();
};

clientReviewSchema.methods.addResponse = function(content, userId) {
  this.responseFromFirm = {
    content,
    respondedBy: userId,
    respondedAt: new Date()
  };
  return this.save();
};

clientReviewSchema.methods.markHelpful = function(voterId) {
  // Check if already voted
  if (!this.helpfulVoters.includes(voterId)) {
    this.helpfulVoters.push(voterId);
    this.helpful += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

clientReviewSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

export const ClientReview = mongoose.model('ClientReview', clientReviewSchema);
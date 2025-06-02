import mongoose, { Schema } from 'mongoose';

const contactSubmissionSchema = new Schema({
  formType: {
    type: String,
    enum: {
      values: ['general', 'consultation', 'callback'],
      message: 'Form type must be one of: {VALUES}'
    },
    default: 'general',
    index: true
  },
  contact: {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      validate: {
        validator(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator(v) {
          return /^\+?[\d\s-()]{10,}$/.test(v);
        },
        message: 'Please provide a valid phone number'
      }
    },
    preferredContact: {
      type: String,
      enum: {
        values: ['email', 'phone', 'either'],
        message: 'Preferred contact must be one of: {VALUES}'
      },
      default: 'either'
    }
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  practiceArea: {
    type: Schema.Types.ObjectId,
    ref: 'PracticeArea',
    index: true
  },
  urgency: {
    type: String,
    enum: {
      values: ['normal', 'urgent', 'emergency'],
      message: 'Urgency must be one of: {VALUES}'
    },
    default: 'normal',
    index: true
  },
  preferredCallbackTime: {
    date: {
      type: Date,
      validate: {
        validator(v) {
          return !v || v > new Date();
        },
        message: 'Callback date must be in the future'
      }
    },
    timeSlot: {
      type: String,
      enum: {
        values: ['morning', 'afternoon', 'evening'],
        message: 'Time slot must be one of: {VALUES}'
      }
    }
  },
  source: {
    page: {
      type: String,
      required: true,
      trim: true,
      maxlength: [500, 'Page URL cannot exceed 500 characters']
    },
    referrer: {
      type: String,
      trim: true,
      maxlength: [500, 'Referrer URL cannot exceed 500 characters']
    },
    campaign: {
      type: String,
      trim: true,
      maxlength: [100, 'Campaign cannot exceed 100 characters']
    }
  },
  consent: {
    termsAccepted: {
      type: Boolean,
      required: [true, 'Terms acceptance is required'],
      validate: {
        validator(v) {
          return v === true;
        },
        message: 'Must accept terms and conditions'
      }
    },
    marketingOptIn: {
      type: Boolean,
      default: false
    }
  },
  status: {
    type: String,
    enum: {
      values: ['new', 'read', 'responded', 'archived'],
      message: 'Status must be one of: {VALUES}'
    },
    default: 'new',
    index: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  notes: [{
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Note cannot exceed 1000 characters']
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Security and tracking
  ipAddress: {
    type: String,
    required: true,
    select: false
  },
  userAgent: {
    type: String,
    required: true,
    select: false
  },
  submittedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  respondedAt: Date,
  // Email tracking
  emailSent: {
    confirmationSent: {
      type: Boolean,
      default: false
    },
    confirmationSentAt: Date,
    notificationSent: {
      type: Boolean,
      default: false
    },
    notificationSentAt: Date
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
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
contactSubmissionSchema.index({ 'contact.email': 1 });
contactSubmissionSchema.index({ status: 1, submittedAt: -1 });
contactSubmissionSchema.index({ assignedTo: 1, status: 1 });
contactSubmissionSchema.index({ urgency: 1, status: 1 });
contactSubmissionSchema.index({ submittedAt: -1 });

// Virtual for response time (if responded)
contactSubmissionSchema.virtual('responseTime').get(function() {
  if (this.respondedAt && this.submittedAt) {
    return Math.round((this.respondedAt - this.submittedAt) / (1000 * 60 * 60)); // hours
  }
  return null;
});

// Virtual for formatted submission date
contactSubmissionSchema.virtual('formattedDate').get(function() {
  return this.submittedAt.toLocaleDateString();
});

// Pre-save middleware
contactSubmissionSchema.pre('save', function(next) {
  // Set respondedAt when status changes to responded
  if (this.isModified('status') && this.status === 'responded' && !this.respondedAt) {
    this.respondedAt = new Date();
  }
  
  next();
});

// Query helpers
contactSubmissionSchema.query.active = function() {
  return this.where({ isDeleted: false });
};

contactSubmissionSchema.query.byStatus = function(status) {
  return this.where({ status });
};

contactSubmissionSchema.query.urgent = function() {
  return this.where({ urgency: { $in: ['urgent', 'emergency'] } });
};

contactSubmissionSchema.query.unassigned = function() {
  return this.where({ assignedTo: null });
};

// Static methods
contactSubmissionSchema.statics.findActive = function() {
  return this.find({ isDeleted: false });
};

contactSubmissionSchema.statics.findByStatus = function(status) {
  return this.findActive().where({ status });
};

contactSubmissionSchema.statics.findUrgent = function() {
  return this.findActive().where({ urgency: { $in: ['urgent', 'emergency'] } });
};

contactSubmissionSchema.statics.getStatistics = async function(filter = {}) {
  const pipeline = [
    {
      $match: {
        isDeleted: false,
        ...filter
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        byStatus: {
          $push: {
            status: '$status',
            urgency: '$urgency'
          }
        },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $and: ['$respondedAt', '$submittedAt'] },
              { $divide: [{ $subtract: ['$respondedAt', '$submittedAt'] }, 1000 * 60 * 60] },
              null
            ]
          }
        }
      }
    },
    {
      $project: {
        total: 1,
        avgResponseTime: { $round: ['$avgResponseTime', 1] },
        statusCounts: {
          new: {
            $size: {
              $filter: {
                input: '$byStatus',
                cond: { $eq: ['$$this.status', 'new'] }
              }
            }
          },
          read: {
            $size: {
              $filter: {
                input: '$byStatus',
                cond: { $eq: ['$$this.status', 'read'] }
              }
            }
          },
          responded: {
            $size: {
              $filter: {
                input: '$byStatus',
                cond: { $eq: ['$$this.status', 'responded'] }
              }
            }
          },
          archived: {
            $size: {
              $filter: {
                input: '$byStatus',
                cond: { $eq: ['$$this.status', 'archived'] }
              }
            }
          }
        },
        urgencyCounts: {
          normal: {
            $size: {
              $filter: {
                input: '$byStatus',
                cond: { $eq: ['$$this.urgency', 'normal'] }
              }
            }
          },
          urgent: {
            $size: {
              $filter: {
                input: '$byStatus',
                cond: { $eq: ['$$this.urgency', 'urgent'] }
              }
            }
          },
          emergency: {
            $size: {
              $filter: {
                input: '$byStatus',
                cond: { $eq: ['$$this.urgency', 'emergency'] }
              }
            }
          }
        }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    total: 0,
    avgResponseTime: 0,
    statusCounts: { new: 0, read: 0, responded: 0, archived: 0 },
    urgencyCounts: { normal: 0, urgent: 0, emergency: 0 }
  };
};

// Instance methods
contactSubmissionSchema.methods.markAsRead = function(_userId) {
  if (this.status === 'new') {
    this.status = 'read';
  }
  return this.save();
};

contactSubmissionSchema.methods.assignTo = function(userId) {
  this.assignedTo = userId;
  if (this.status === 'new') {
    this.status = 'read';
  }
  return this.save();
};

contactSubmissionSchema.methods.addNote = function(content, userId) {
  this.notes.push({
    content,
    createdBy: userId
  });
  return this.save();
};

contactSubmissionSchema.methods.markAsResponded = function() {
  this.status = 'responded';
  this.respondedAt = new Date();
  return this.save();
};

contactSubmissionSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

contactSubmissionSchema.methods.softDelete = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

export const ContactSubmission = mongoose.model('ContactSubmission', contactSubmissionSchema);
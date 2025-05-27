# Missing Features Implementation Prompts

## 1. Case Results Model and CRUD Endpoints

### Prompt:
Create a Case Results management system for the Bonderud Law Firm API with the following requirements:

**Model Schema (CaseResult):**
- title: { en: String, es: String } - Bilingual case title
- category: String (enum: ['criminal-defense', 'family-law', 'personal-injury', 'local-counsel'])
- outcome: { en: String, es: String } - Case outcome description
- description: { en: String, es: String } - Detailed case description
- date: Date - Case completion date
- featured: Boolean - Whether to highlight this result
- client: {
  name: String (optional - may be "Confidential"),
  testimonial: { en: String, es: String } (optional)
}
- charges: [{ en: String, es: String }] - List of charges/claims
- result: { en: String, es: String } - Final verdict/settlement
- displayOrder: Number - For manual ordering
- isActive: Boolean - Soft delete support
- metadata: {
  court: String,
  caseNumber: String (optional),
  judge: String (optional)
}
- seo: {
  metaTitle: { en: String, es: String },
  metaDescription: { en: String, es: String },
  keywords: [String]
}

**CRUD Endpoints:**
- GET /api/v1/case-results - List all case results with filters (category, featured, date range)
- GET /api/v1/case-results/:id - Get single case result
- POST /api/v1/case-results - Create new case result (admin only)
- PUT /api/v1/case-results/:id - Update case result (admin only)
- DELETE /api/v1/case-results/:id - Soft delete case result (admin only)
- GET /api/v1/case-results/categories/:category - Get results by category

**Additional Requirements:**
- Pagination support with 10 results per page default
- Sort by date (newest first) or displayOrder
- Filter by category, featured status, date range
- Search functionality across title and description
- Admin authentication required for CUD operations
- Validation for all bilingual fields

---

## 2. Client Reviews System

### Prompt:
Implement a comprehensive client reviews system with public submission and admin moderation:

**Model Schema (ClientReview):**
- reviewer: {
  name: String (required),
  email: String (required, not displayed publicly),
  phone: String (optional),
  location: { city: String, state: String }
}
- rating: Number (1-5, required)
- title: { en: String, es: String }
- content: { en: String, es: String } (required)
- practiceArea: ObjectId (ref: 'PracticeArea', optional)
- attorney: ObjectId (ref: 'Attorney', optional)
- status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending')
- moderationNotes: String (internal use only)
- verifiedClient: Boolean (default: false)
- helpful: Number (default: 0) - Helpful votes count
- dateSubmitted: Date
- dateApproved: Date
- responseFromFirm: {
  content: { en: String, es: String },
  respondedBy: ObjectId (ref: 'User'),
  respondedAt: Date
}
- source: String (enum: ['website', 'google', 'avvo', 'other'])
- consentToDisplay: Boolean (required, must be true)

**CRUD Endpoints:**
- GET /api/v1/reviews - List approved reviews (public)
- GET /api/v1/reviews/:id - Get single review (public if approved)
- POST /api/v1/reviews/submit - Submit new review (public, with reCAPTCHA)
- GET /api/v1/reviews/admin - List all reviews with filters (admin only)
- PUT /api/v1/reviews/:id/moderate - Approve/reject review (admin only)
- PUT /api/v1/reviews/:id/respond - Add firm response (admin only)
- DELETE /api/v1/reviews/:id - Soft delete review (admin only)
- POST /api/v1/reviews/:id/helpful - Mark review as helpful (public)

**Review Submission Form Endpoint:**
- POST /api/v1/reviews/submit-form - Handle form submission with validation
- Required fields: name, email, rating, content, consentToDisplay
- Optional fields: phone, location, practiceArea, attorney
- Implement rate limiting (1 review per email per day)
- Send confirmation email to reviewer
- Send notification to admin for moderation

---

## 3. Blog System (Categories and Posts)

### Prompt:
Create a full-featured blog system with categories, SEO optimization, and bilingual support:

**Model Schema (BlogCategory):**
- name: { en: String, es: String } (required, unique)
- slug: { en: String, es: String } (required, unique, auto-generated)
- description: { en: String, es: String }
- parent: ObjectId (ref: 'BlogCategory', optional) - For subcategories
- displayOrder: Number
- isActive: Boolean
- postCount: Number (virtual field)
- seo: {
  metaTitle: { en: String, es: String },
  metaDescription: { en: String, es: String }
}

**Model Schema (BlogPost):**
- title: { en: String, es: String } (required)
- slug: { en: String, es: String } (required, unique, auto-generated)
- content: { en: String, es: String } (required, rich text/HTML)
- excerpt: { en: String, es: String } (auto-generated from content)
- author: ObjectId (ref: 'Attorney', required)
- categories: [ObjectId] (ref: 'BlogCategory', min: 1)
- status: String (enum: ['draft', 'published', 'archived'], default: 'draft')
- publishedAt: Date
- featuredImage: {
  url: String,
  alt: { en: String, es: String },
  caption: { en: String, es: String }
}
- gallery: [{
  url: String,
  alt: { en: String, es: String },
  caption: { en: String, es: String },
  order: Number
}]
- tags: { en: [String], es: [String] }
- relatedPosts: [ObjectId] (ref: 'BlogPost', max: 5)
- viewCount: Number (default: 0)
- readingTime: { en: Number, es: Number } (auto-calculated in minutes)
- allowComments: Boolean (default: true)
- seo: {
  metaTitle: { en: String, es: String },
  metaDescription: { en: String, es: String },
  canonicalUrl: String,
  ogImage: String
}

**CRUD Endpoints:**
- GET /api/v1/blog/categories - List all active categories
- GET /api/v1/blog/categories/:slug - Get category with posts
- POST /api/v1/blog/categories - Create category (admin only)
- PUT /api/v1/blog/categories/:id - Update category (admin only)
- DELETE /api/v1/blog/categories/:id - Delete category (admin only)

- GET /api/v1/blog/posts - List published posts with pagination
- GET /api/v1/blog/posts/:slug - Get single post (increment view count)
- GET /api/v1/blog/posts/category/:categorySlug - Posts by category
- GET /api/v1/blog/posts/author/:authorId - Posts by author
- GET /api/v1/blog/posts/search - Search posts
- POST /api/v1/blog/posts - Create post (editor/admin only)
- PUT /api/v1/blog/posts/:id - Update post (editor/admin only)
- DELETE /api/v1/blog/posts/:id - Delete post (admin only)

**Additional Features:**
- Auto-generate slugs from titles
- Calculate reading time based on word count
- RSS feed generation
- Related posts suggestion algorithm
- Draft preview functionality
- Scheduled publishing

---

## 4. Homepage Content Management

### Prompt:
Implement homepage content management system with multiple dynamic sections:

**Model Schema (HomepageSection):**
```javascript
{
  sectionType: String (enum: ['hero', 'bio', 'services', 'trust', 'acquittal', 'recentResults', 'dedicatedTeam', 'practiceAreas']),
  isActive: Boolean,
  displayOrder: Number,
  content: {
    // Hero Section
    hero: {
      title: { en: String, es: String },
      subtitle: { en: String, es: String },
      backgroundMedia: {
        type: String (enum: ['image', 'video']),
        url: String,
        thumbnail: String (for video)
      },
      foregroundImage: {
        url: String,
        alt: { en: String, es: String }
      },
      effectTexts: [{ en: String, es: String }], // Rotating texts
      ctaButton: {
        text: { en: String, es: String },
        url: String,
        style: String (enum: ['primary', 'secondary', 'outline'])
      }
    },
    
    // Bio Section
    bio: {
      name: { en: String, es: String },
      title: { en: String, es: String },
      heading: { en: String, es: String },
      subheading: { en: String, es: String },
      description: { en: String, es: String },
      image: {
        url: String,
        alt: { en: String, es: String }
      },
      videoUrl: String (YouTube/Vimeo),
      ctaButton: {
        text: { en: String, es: String },
        url: String
      }
    },
    
    // Services Section
    services: {
      heading: { en: String, es: String },
      subheading: { en: String, es: String },
      items: [{
        icon: String (icon class or URL),
        title: { en: String, es: String },
        description: { en: String, es: String },
        link: String,
        displayOrder: Number
      }]
    },
    
    // Trust/Expertise Section
    trust: {
      heading: { en: String, es: String },
      logos: [{
        name: String,
        url: String,
        link: String (optional),
        displayOrder: Number
      }]
    },
    
    // Acquittal/Dismissal Section
    acquittal: {
      stats: [{
        number: String,
        label: { en: String, es: String },
        icon: String,
        displayOrder: Number
      }]
    },
    
    // Recent Results Section
    recentResults: {
      heading: { en: String, es: String },
      description: { en: String, es: String },
      image: {
        url: String,
        alt: { en: String, es: String }
      },
      ctaButton: {
        text: { en: String, es: String },
        url: String
      },
      // Results pulled from CaseResult model
      displayCount: Number (default: 3)
    },
    
    // Practice Areas Section
    practiceAreas: {
      heading: { en: String, es: String },
      faqs: [{
        question: { en: String, es: String },
        answer: { en: String, es: String },
        displayOrder: Number
      }],
      // Areas pulled from PracticeArea model
      displayCount: Number (default: 6)
    },
    
    // Dedicated Team Section
    dedicatedTeam: {
      heading: { en: String, es: String },
      ctaButton: {
        text: { en: String, es: String },
        url: String
      },
      // Team members pulled from Attorney model
      featuredOnly: Boolean (default: true)
    }
  }
}
```

**CRUD Endpoints:**
- GET /api/v1/homepage/sections - Get all active sections ordered
- GET /api/v1/homepage/sections/:sectionType - Get specific section
- PUT /api/v1/homepage/sections/:sectionType - Update section (admin only)
- POST /api/v1/homepage/sections/reorder - Reorder sections (admin only)
- PUT /api/v1/homepage/sections/:sectionType/toggle - Enable/disable section (admin only)

---

## 5. Case Studies Management

### Prompt:
Create a case studies system with categorized tabs:

**Model Schema (CaseStudy):**
- title: { en: String, es: String } (required)
- category: String (enum: ['criminal-defense', 'family-law', 'personal-injury', 'local-counsel'], required)
- summary: { en: String, es: String } (required)
- challenge: { en: String, es: String }
- solution: { en: String, es: String }
- outcome: { en: String, es: String }
- fullContent: { en: String, es: String } (rich text)
- metrics: [{
  label: { en: String, es: String },
  value: String,
  icon: String
}]
- testimonial: {
  content: { en: String, es: String },
  author: String,
  role: String
}
- images: [{
  url: String,
  alt: { en: String, es: String },
  caption: { en: String, es: String }
}]
- relatedAttorney: ObjectId (ref: 'Attorney')
- relatedPracticeArea: ObjectId (ref: 'PracticeArea')
- displayOrder: Number
- isFeatured: Boolean
- isActive: Boolean
- publishedDate: Date

**CRUD Endpoints:**
- GET /api/v1/case-studies - List all active case studies
- GET /api/v1/case-studies/:id - Get single case study
- GET /api/v1/case-studies/category/:category - Get by category
- POST /api/v1/case-studies - Create case study (admin only)
- PUT /api/v1/case-studies/:id - Update case study (admin only)
- DELETE /api/v1/case-studies/:id - Soft delete (admin only)

---

## 6. Site Settings Management

### Prompt:
Implement global site settings management:

**Model Schema (SiteSettings):**
- general: {
  siteName: { en: String, es: String },
  tagline: { en: String, es: String },
  logo: {
    primary: String (URL),
    secondary: String (URL for dark mode),
    favicon: String (URL)
  }
}
- contact: {
  phone: {
    primary: String,
    secondary: String,
    tollFree: String
  },
  email: {
    general: String,
    support: String,
    legal: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  hours: {
    weekdays: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String },
    holidays: String
  }
}
- social: {
  links: [{
    platform: String (enum: ['facebook', 'twitter', 'linkedin', 'instagram', 'youtube']),
    url: String,
    displayOrder: Number,
    isActive: Boolean
  }]
}
- footer: {
  copyrightText: { en: String, es: String },
  poweredByText: { en: String, es: String },
  disclaimerText: { en: String, es: String },
  quickLinks: [{
    title: { en: String, es: String },
    url: String,
    displayOrder: Number
  }]
}
- seo: {
  defaultMetaTitle: { en: String, es: String },
  defaultMetaDescription: { en: String, es: String },
  defaultKeywords: [String],
  googleAnalyticsId: String,
  googleTagManagerId: String,
  facebookPixelId: String
}
- features: {
  maintenanceMode: Boolean,
  maintenanceMessage: { en: String, es: String },
  enableBlog: Boolean,
  enableReviews: Boolean,
  enableAppointmentBooking: Boolean,
  enableLiveChat: Boolean,
  reCaptchaSiteKey: String
}

**Endpoints:**
- GET /api/v1/settings - Get all settings (public, filtered)
- GET /api/v1/settings/admin - Get all settings (admin only, complete)
- PUT /api/v1/settings/:section - Update specific section (admin only)
- POST /api/v1/settings/logo - Upload logo (admin only)
- POST /api/v1/settings/maintenance - Toggle maintenance mode (admin only)

---

## 7. Contact Form Submission

### Prompt:
Implement contact form handling with spam protection:

**Model Schema (ContactSubmission):**
- formType: String (enum: ['general', 'consultation', 'callback'], default: 'general')
- contact: {
  name: String (required),
  email: String (required),
  phone: String (required),
  preferredContact: String (enum: ['email', 'phone', 'either'])
}
- subject: String (required)
- message: String (required)
- practiceArea: ObjectId (ref: 'PracticeArea', optional)
- urgency: String (enum: ['normal', 'urgent', 'emergency'], default: 'normal')
- preferredCallbackTime: {
  date: Date,
  timeSlot: String (enum: ['morning', 'afternoon', 'evening'])
}
- source: {
  page: String (URL where form was submitted),
  referrer: String,
  campaign: String
}
- consent: {
  termsAccepted: Boolean (required, must be true),
  marketingOptIn: Boolean (default: false)
}
- status: String (enum: ['new', 'read', 'responded', 'archived'], default: 'new')
- assignedTo: ObjectId (ref: 'User', optional)
- notes: [{
  content: String,
  createdBy: ObjectId (ref: 'User'),
  createdAt: Date
}]
- ipAddress: String
- userAgent: String
- submittedAt: Date
- respondedAt: Date

**Endpoints:**
- POST /api/v1/contact/submit - Submit contact form (public, with reCAPTCHA)
- GET /api/v1/contact/submissions - List submissions (admin only)
- GET /api/v1/contact/submissions/:id - Get single submission (admin only)
- PUT /api/v1/contact/submissions/:id/status - Update status (admin only)
- PUT /api/v1/contact/submissions/:id/assign - Assign to user (admin only)
- POST /api/v1/contact/submissions/:id/notes - Add note (admin only)
- DELETE /api/v1/contact/submissions/:id - Archive submission (admin only)

**Additional Requirements:**
- Implement rate limiting (3 submissions per IP per hour)
- Send email notifications to admin and user
- Validate reCAPTCHA token
- Sanitize all input fields
- Store IP and user agent for security

---

## 8. Payment Gateway Integration

### Prompt:
Integrate payment processing for legal services:

**Model Schema (Payment):**
- client: {
  name: String (required),
  email: String (required),
  phone: String (required)
}
- amount: {
  value: Number (required),
  currency: String (default: 'USD')
}
- description: String (required)
- type: String (enum: ['consultation', 'retainer', 'service', 'other'])
- attorney: ObjectId (ref: 'Attorney', optional)
- caseReference: String (optional)
- status: String (enum: ['pending', 'processing', 'completed', 'failed', 'refunded'])
- paymentMethod: {
  type: String (enum: ['card', 'ach', 'wire']),
  last4: String,
  brand: String
}
- gateway: {
  provider: String (enum: ['stripe', 'square', 'paypal']),
  transactionId: String,
  receiptUrl: String
}
- metadata: Object (flexible for gateway-specific data)
- notes: String (internal use)
- createdAt: Date
- completedAt: Date
- refundedAt: Date
- refundAmount: Number

**Endpoints:**
- POST /api/v1/payments/create-intent - Create payment intent (public)
- POST /api/v1/payments/confirm - Confirm payment (public)
- GET /api/v1/payments/:id/status - Check payment status (public with token)
- GET /api/v1/payments - List all payments (admin only)
- GET /api/v1/payments/:id - Get payment details (admin only)
- POST /api/v1/payments/:id/refund - Process refund (admin only)
- GET /api/v1/payments/reports - Payment reports (admin only)

**Security Requirements:**
- PCI compliance considerations
- Tokenize card information
- Never store full card numbers
- Implement webhook handlers for gateway events
- SSL/TLS required
- Audit trail for all payment operations

---

## 9. Authentication System Implementation

### Prompt:
Complete the authentication system with all required endpoints:

**Required Endpoints:**

**POST /api/v1/auth/login**
- Input: email, password
- Output: accessToken, refreshToken, user profile
- Features: Account lockout after 5 failed attempts, last login tracking

**POST /api/v1/auth/logout**
- Input: refreshToken
- Invalidate refresh token
- Clear any server-side sessions

**POST /api/v1/auth/refresh**
- Input: refreshToken
- Output: new accessToken
- Validate refresh token and issue new access token

**POST /api/v1/auth/forgot-password**
- Input: email
- Generate reset token (expires in 1 hour)
- Send reset email with link
- Rate limit: 3 requests per email per hour

**POST /api/v1/auth/reset-password**
- Input: resetToken, newPassword
- Validate token and update password
- Invalidate all existing tokens
- Send confirmation email

**POST /api/v1/auth/verify-email**
- Input: verificationToken
- Mark email as verified
- Activate user account

**GET /api/v1/auth/profile**
- Requires authentication
- Return current user profile

**PUT /api/v1/auth/profile**
- Update user profile (name, phone, language preference)
- Cannot update email without reverification

**PUT /api/v1/auth/change-password**
- Input: currentPassword, newPassword
- Requires authentication
- Validate current password before update

**POST /api/v1/auth/enable-2fa**
- Generate and return QR code for authenticator app
- Store encrypted secret

**POST /api/v1/auth/verify-2fa**
- Input: code
- Verify TOTP code and enable 2FA

**POST /api/v1/auth/disable-2fa**
- Input: password, code
- Verify credentials and disable 2FA

---

## 10. Complete CRUD Implementation for Existing Models

### Prompt:
Implement all missing CRUD endpoints for User, Attorney, and PracticeArea models:

**User Management Endpoints:**
- GET /api/v1/users - List users with filters (admin only)
- GET /api/v1/users/:id - Get user details (admin only)
- POST /api/v1/users - Create user (admin only)
- PUT /api/v1/users/:id - Update user (admin only)
- DELETE /api/v1/users/:id - Soft delete user (admin only)
- PUT /api/v1/users/:id/permissions - Update user permissions (admin only)
- PUT /api/v1/users/:id/status - Activate/deactivate user (admin only)

**Attorney Management Endpoints:**
- GET /api/v1/attorneys - List attorneys (public)
- GET /api/v1/attorneys/:id - Get attorney details (public)
- GET /api/v1/attorneys/slug/:slug - Get by slug (public)
- POST /api/v1/attorneys - Create attorney (admin only)
- PUT /api/v1/attorneys/:id - Update attorney (admin only)
- DELETE /api/v1/attorneys/:id - Soft delete (admin only)
- POST /api/v1/attorneys/:id/photos - Upload photos (admin only)
- PUT /api/v1/attorneys/:id/reorder - Update display order (admin only)

**Practice Area Management Endpoints:**
- GET /api/v1/practice-areas - List practice areas (public)
- GET /api/v1/practice-areas/:id - Get practice area (public)
- GET /api/v1/practice-areas/slug/:slug - Get by slug (public)
- POST /api/v1/practice-areas - Create practice area (admin only)
- PUT /api/v1/practice-areas/:id - Update practice area (admin only)
- DELETE /api/v1/practice-areas/:id - Soft delete (admin only)
- POST /api/v1/practice-areas/:id/attorneys - Associate attorneys (admin only)
- POST /api/v1/practice-areas/:id/faqs - Add FAQs (admin only)

---

## General Implementation Guidelines

### For All Features:
1. **Bilingual Support**: All content fields must support English and Spanish
2. **Validation**: Use Joi or Zod for request validation
3. **Error Handling**: Use ApiError class for consistent error responses
4. **Authentication**: Implement JWT middleware for protected routes
5. **Authorization**: Check user roles and permissions
6. **Pagination**: Use existing pagination utility
7. **Logging**: Log all important operations
8. **Testing**: Write unit and integration tests
9. **Documentation**: Update Swagger/OpenAPI spec
10. **Security**: Sanitize inputs, implement rate limiting where needed

### Database Indexes:
- Add indexes for frequently queried fields
- Compound indexes for complex queries
- Text indexes for search functionality

### Performance Considerations:
- Use MongoDB aggregation pipeline for complex queries
- Implement caching for frequently accessed data
- Use projection to limit returned fields
- Implement lazy loading for large datasets

### Email Integration:
- Set up email templates for all transactional emails
- Support both HTML and plain text versions
- Include unsubscribe links where applicable
- Log all email sends

### File Upload Handling:
- Implement multer for file uploads
- Validate file types and sizes
- Use cloud storage (S3/Cloudinary) for production
- Generate thumbnails for images
- Scan for malware if handling documents
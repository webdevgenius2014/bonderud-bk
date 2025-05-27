# Bonderud Law Firm API Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Pagination](#pagination)
8. [Bilingual Support](#bilingual-support)
9. [File Uploads](#file-uploads)
10. [Webhooks](#webhooks)

## Introduction

The Bonderud Law Firm API is a RESTful web service that provides comprehensive backend functionality for a bilingual law firm website. It supports English and Spanish content throughout and includes features for attorney management, practice areas, case results, client reviews, blog system, and contact forms.

### Base URL
```
Development: http://localhost:5000/api/v1
Production: https://api.bonderudlaw.com/api/v1
```

### Content Type
All requests and responses use JSON format:
```
Content-Type: application/json
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Valid API credentials (for protected endpoints)

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd bounderulaw-api

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Seed database
npm run seed

# Start development server
npm run dev
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication with a dual-token system.

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "role": "admin",
      "profile": {
        "name": {
          "en": "John Doe",
          "es": "John Doe"
        }
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Using Authentication
Include the access token in the Authorization header:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

## API Endpoints

### 1. Authentication Endpoints

#### Login
```http
POST /auth/login
```
Authenticate user and receive tokens.

#### Logout
```http
POST /auth/logout
```
Invalidate refresh token.

#### Refresh Token
```http
POST /auth/refresh
```
Get new access token using refresh token.

#### Forgot Password
```http
POST /auth/forgot-password
```
Request password reset email.

#### Reset Password
```http
POST /auth/reset-password
```
Reset password using token from email.

#### Get Profile
```http
GET /auth/profile
Authorization: Bearer {token}
```
Get current user profile.

#### Update Profile
```http
PUT /auth/profile
Authorization: Bearer {token}
```
Update user profile information.

#### Change Password
```http
PUT /auth/change-password
Authorization: Bearer {token}
```
Change user password.

### 2. Attorney Management

#### List Attorneys (Public)
```http
GET /attorneys?page=1&limit=10&featured=true
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `featured` (boolean): Filter featured attorneys
- `practiceArea` (string): Filter by practice area ID
- `search` (string): Search by name or bio
- `sortBy` (string): Sort field (displayOrder, name, yearsExperience)
- `sortOrder` (string): Sort order (asc, desc)

#### Get Attorney
```http
GET /attorneys/{id}
```
Get attorney by ID or slug.

#### Create Attorney (Admin)
```http
POST /attorneys
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": {
    "en": "John Smith",
    "es": "John Smith"
  },
  "title": {
    "en": "Senior Partner",
    "es": "Socio Principal"
  },
  "bio": {
    "en": "Experienced attorney with 20+ years...",
    "es": "Abogado experimentado con más de 20 años..."
  },
  "contact": {
    "email": "john.smith@bonderudlaw.com",
    "phone": "+1-555-0123"
  },
  "barNumber": "FL123456",
  "yearsExperience": 20,
  "practiceAreas": ["507f1f77bcf86cd799439011"],
  "specialties": {
    "en": ["Criminal Defense", "DUI Defense"],
    "es": ["Defensa Criminal", "Defensa DUI"]
  }
}
```

#### Update Attorney (Admin)
```http
PUT /attorneys/{id}
Authorization: Bearer {token}
```

#### Delete Attorney (Admin)
```http
DELETE /attorneys/{id}
Authorization: Bearer {token}
```

#### Toggle Featured Status (Admin)
```http
POST /attorneys/{id}/toggle-featured
Authorization: Bearer {token}
```

### 3. Practice Areas

#### List Practice Areas (Public)
```http
GET /practice-areas?parent=null&featured=true
```

**Query Parameters:**
- `parent` (string): Filter by parent ID or "null" for top-level
- `featured` (boolean): Filter featured areas
- `hasAttorneys` (boolean): Filter areas with attorneys
- `search` (string): Search in name/description

#### Get Practice Area
```http
GET /practice-areas/{id}
```

#### Create Practice Area (Admin)
```http
POST /practice-areas
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": {
    "en": "Immigration Law",
    "es": "Ley de Inmigración"
  },
  "description": {
    "en": "Comprehensive immigration services...",
    "es": "Servicios integrales de inmigración..."
  },
  "services": {
    "en": ["Visa Applications", "Green Cards"],
    "es": ["Solicitudes de Visa", "Tarjetas Verdes"]
  },
  "parent": null,
  "displayOrder": 5
}
```

#### Associate Attorneys (Admin)
```http
POST /practice-areas/{id}/attorneys
Authorization: Bearer {token}
Content-Type: application/json

{
  "attorneyIds": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
}
```

#### Add FAQ (Admin)
```http
POST /practice-areas/{id}/faqs
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": {
    "en": "How long does the process take?",
    "es": "¿Cuánto tiempo toma el proceso?"
  },
  "answer": {
    "en": "The timeline varies depending on...",
    "es": "El tiempo varía dependiendo de..."
  }
}
```

### 4. Case Results

#### List Case Results (Public)
```http
GET /case-results?category=criminal-defense&featured=true
```

**Query Parameters:**
- `category` (string): Filter by category
- `featured` (boolean): Filter featured cases
- `startDate` (date): Filter by date range start
- `endDate` (date): Filter by date range end
- `search` (string): Search in title/description

#### Get Case Result
```http
GET /case-results/{id}
```

#### Get by Category
```http
GET /case-results/categories/{category}
```

**Categories:**
- `criminal-defense`
- `family-law`
- `personal-injury`
- `local-counsel`

#### Create Case Result (Admin)
```http
POST /case-results
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": {
    "en": "DUI Charges Dismissed",
    "es": "Cargos de DUI Desestimados"
  },
  "category": "criminal-defense",
  "outcome": {
    "en": "All charges dismissed",
    "es": "Todos los cargos desestimados"
  },
  "description": {
    "en": "Successfully defended client...",
    "es": "Defendimos exitosamente al cliente..."
  },
  "date": "2024-01-15",
  "featured": true,
  "result": {
    "en": "Case dismissed",
    "es": "Caso desestimado"
  }
}
```

### 5. Client Reviews

#### List Reviews (Public)
```http
GET /reviews?rating=5&verifiedOnly=true
```

**Query Parameters:**
- `rating` (number): Filter by rating (1-5)
- `practiceArea` (string): Filter by practice area ID
- `attorney` (string): Filter by attorney ID
- `verifiedOnly` (boolean): Show only verified reviews
- `sortBy` (string): Sort by dateApproved, rating, helpful

#### Submit Review (Public)
```http
POST /reviews/submit
Content-Type: application/json

{
  "reviewer": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1-555-9999",
    "location": {
      "city": "Miami",
      "state": "FL"
    }
  },
  "rating": 5,
  "title": {
    "en": "Excellent Service",
    "es": "Servicio Excelente"
  },
  "content": {
    "en": "The team was professional...",
    "es": "El equipo fue profesional..."
  },
  "practiceArea": "507f1f77bcf86cd799439011",
  "attorney": "507f1f77bcf86cd799439012",
  "consentToDisplay": true
}
```

#### Mark as Helpful (Public)
```http
POST /reviews/{id}/helpful
```

#### Get Statistics (Public)
```http
GET /reviews/statistics?practiceArea={id}
```

#### Moderate Review (Admin)
```http
PUT /reviews/{id}/moderate
Authorization: Bearer {token}
Content-Type: application/json

{
  "action": "approve",
  "notes": "Verified client"
}
```

#### Add Firm Response (Admin)
```http
POST /reviews/{id}/respond
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": {
    "en": "Thank you for your feedback...",
    "es": "Gracias por sus comentarios..."
  }
}
```

### 6. Blog System

#### List Blog Categories
```http
GET /blog/categories?includePostCount=true
```

#### Get Category with Posts
```http
GET /blog/categories/{slug}?page=1&limit=10
```

#### List Blog Posts (Public)
```http
GET /blog/posts?category={id}&featured=true&tag=legal
```

**Query Parameters:**
- `category` (string): Filter by category ID
- `author` (string): Filter by author ID
- `featured` (boolean): Filter featured posts
- `tag` (string): Filter by tag
- `search` (string): Search in title/content
- `sortBy` (string): Sort by publishedAt, viewCount, title

#### Get Blog Post
```http
GET /blog/posts/{slug}?language=en
```

#### Search Posts
```http
GET /blog/posts/search?q=criminal+defense
```

#### Create Post (Editor/Admin)
```http
POST /blog/posts
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": {
    "en": "Understanding Your Rights",
    "es": "Entendiendo Sus Derechos"
  },
  "content": {
    "en": "<p>When facing criminal charges...</p>",
    "es": "<p>Cuando enfrenta cargos criminales...</p>"
  },
  "excerpt": {
    "en": "A guide to your legal rights",
    "es": "Una guía de sus derechos legales"
  },
  "author": "507f1f77bcf86cd799439011",
  "categories": ["507f1f77bcf86cd799439012"],
  "tags": {
    "en": ["rights", "criminal defense"],
    "es": ["derechos", "defensa criminal"]
  },
  "status": "published",
  "isFeatured": true
}
```

### 7. Contact Forms

#### Submit Contact Form (Public)
```http
POST /contact/submit
Content-Type: application/json

{
  "formType": "consultation",
  "contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-555-1234",
    "preferredContact": "phone"
  },
  "subject": "Need legal consultation",
  "message": "I need help with a criminal case...",
  "practiceArea": "507f1f77bcf86cd799439011",
  "urgency": "urgent",
  "consent": {
    "termsAccepted": true,
    "marketingOptIn": false
  }
}
```

#### List Submissions (Admin)
```http
GET /contact/submissions?status=new&urgency=urgent
Authorization: Bearer {token}
```

#### Update Status (Admin)
```http
PUT /contact/submissions/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "responded"
}
```

#### Add Note (Admin)
```http
POST /contact/submissions/{id}/notes
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Called client, scheduled consultation for Monday"
}
```

### 8. User Management (Admin Only)

#### List Users
```http
GET /users?role=admin&isActive=true
Authorization: Bearer {token}
```

#### Create User
```http
POST /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "newuser@bonderudlaw.com",
  "password": "SecurePassword123!",
  "role": "editor",
  "profile": {
    "name": {
      "en": "New User",
      "es": "Nuevo Usuario"
    },
    "phone": "+1-555-0000"
  }
}
```

#### Update User Permissions
```http
PUT /users/{id}/permissions
Authorization: Bearer {token}
Content-Type: application/json

{
  "permissions": [
    "blog.create",
    "blog.read",
    "blog.update",
    "attorneys.read"
  ]
}
```

### 9. Dashboard Analytics (Admin Only)

#### Get Statistics
```http
GET /dashboard/stats?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer {token}
```

#### Get Recent Activity
```http
GET /dashboard/activity?limit=50
Authorization: Bearer {token}
```

#### Get Performance Metrics
```http
GET /dashboard/metrics?period=30d
Authorization: Bearer {token}
```

**Periods:**
- `7d` - Last 7 days
- `30d` - Last 30 days
- `90d` - Last 90 days
- `1y` - Last year

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Detailed error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INVALID_TOKEN` - Invalid or expired token
- `DUPLICATE_ENTRY` - Resource already exists

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

Different endpoints have different rate limits:

- **Authentication**: 5 requests per 15 minutes
- **Contact Forms**: 1 request per hour per IP
- **Review Submission**: 1 request per day per email
- **General API**: 100 requests per 15 minutes

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

All list endpoints support pagination:

### Request
```http
GET /attorneys?page=2&limit=20
```

### Response
```json
{
  "success": true,
  "data": {
    "results": [...],
    "pagination": {
      "page": 2,
      "limit": 20,
      "totalPages": 5,
      "totalCount": 95,
      "hasNextPage": true,
      "hasPrevPage": true
    }
  }
}
```

## Bilingual Support

All content fields support English and Spanish:

### Request Format
```json
{
  "title": {
    "en": "English Title",
    "es": "Título en Español"
  }
}
```

### Language Selection
- Use query parameter: `?language=es`
- Default language: `en`

## File Uploads

### Upload Endpoints

#### Attorney Profile Photo
```http
POST /attorneys/{id}/photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

profilePhoto: [binary]
```

#### Blog Featured Image
```http
POST /blog/posts/{id}/featured-image
Authorization: Bearer {token}
Content-Type: multipart/form-data

featuredImage: [binary]
```

### File Requirements
- **Images**: JPEG, PNG, GIF, WebP (max 5MB)
- **Documents**: PDF, DOC, DOCX (max 10MB)
- **Videos**: MP4, MPEG, MOV (max 100MB)

## Webhooks

Configure webhooks for real-time notifications:

### Available Events
- `review.submitted` - New review submitted
- `review.approved` - Review approved
- `contact.submitted` - New contact form
- `blog.published` - Blog post published

### Webhook Payload
```json
{
  "event": "review.submitted",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "reviewer": {
      "name": "John Doe"
    },
    "rating": 5
  }
}
```

---

**Last Updated**: January 2025  
**API Version**: 1.0.0  
**Documentation Version**: 1.0.0
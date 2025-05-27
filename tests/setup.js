import dotenv from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';

// Load test environment variables
dotenv.config({ path: '.env.test' });

let mongoServer;

// Setup before all tests
global.beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Connect to in-memory database
  await mongoose.connect(mongoUri);
});

// Cleanup after each test
global.afterEach(async () => {
  // Clear all collections
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
global.afterAll(async () => {
  // Disconnect and stop MongoDB
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Global test helpers
global.testHelpers = {
  // Generate valid MongoDB ObjectId
  generateObjectId: () => new mongoose.Types.ObjectId().toString(),
  
  // Generate test user data
  generateUserData: (overrides = {}) => ({
    email: `test${Date.now()}@example.com`,
    password: 'Test123!@#',
    profile: {
      firstName: 'Test',
      lastName: 'User',
      ...overrides.profile
    },
    ...overrides
  }),
  
  // Generate test attorney data
  generateAttorneyData: (overrides = {}) => ({
    firstName: 'John',
    lastName: 'Doe',
    email: `attorney${Date.now()}@lawfirm.com`,
    phone: '+1234567890',
    title: { en: 'Senior Attorney', es: 'Abogado Senior' },
    bio: { en: 'Experienced attorney', es: 'Abogado experimentado' },
    shortBio: { en: 'Attorney', es: 'Abogado' },
    specialties: { en: 'Corporate Law', es: 'Derecho Corporativo' },
    practiceAreas: [],
    joiningDate: new Date(),
    availability: {
      isAcceptingNewClients: true,
      preferredContactMethod: 'email',
      responseTimeExpectation: { en: '24 hours', es: '24 horas' },
      consultationTypes: ['inPerson', 'phone', 'video']
    },
    seo: {
      metaTitle: { en: 'John Doe - Attorney', es: 'John Doe - Abogado' },
      metaDescription: { en: 'Attorney profile', es: 'Perfil del abogado' }
    },
    ...overrides
  }),
  
  // Generate test practice area data
  generatePracticeAreaData: (overrides = {}) => ({
    title: { en: 'Corporate Law', es: 'Derecho Corporativo' },
    shortDescription: { en: 'Corporate legal services', es: 'Servicios legales corporativos' },
    description: { en: 'Full corporate law services', es: 'Servicios completos de derecho corporativo' },
    detailedContent: { en: 'Detailed content', es: 'Contenido detallado' },
    excerpt: { en: 'Excerpt', es: 'Extracto' },
    callToAction: { en: 'Contact us', es: 'Contáctanos' },
    seo: {
      metaTitle: { en: 'Corporate Law', es: 'Derecho Corporativo' },
      metaDescription: { en: 'Corporate law services', es: 'Servicios de derecho corporativo' },
      keywords: { en: 'corporate, law', es: 'corporativo, derecho' }
    },
    ...overrides
  })
};
import Attorney from '../../../src/models/Attorney.js';
import PracticeArea from '../../../src/models/PracticeArea.js';
import User from '../../../src/models/User.js';
import mongoose from 'mongoose';

describe('Attorney Model', () => {
  let admin, practiceArea1, practiceArea2;
  
  beforeEach(async () => {
    // Create admin user for createdBy/updatedBy
    admin = await User.create(global.testHelpers.generateUserData({
      role: 'admin'
    }));
    
    // Create practice areas
    practiceArea1 = await PracticeArea.create({
      title: { en: 'Corporate Law', es: 'Derecho Corporativo' },
      shortDescription: { en: 'Corporate', es: 'Corporativo' },
      description: { en: 'Corporate law', es: 'Derecho corporativo' },
      detailedContent: { en: 'Details', es: 'Detalles' },
      excerpt: { en: 'Excerpt', es: 'Extracto' },
      callToAction: { en: 'Contact', es: 'Contacto' },
      seo: {
        metaTitle: { en: 'Title', es: 'Título' },
        metaDescription: { en: 'Desc', es: 'Desc' },
        keywords: { en: 'keywords', es: 'palabras' }
      },
      createdBy: admin._id,
      updatedBy: admin._id
    });
    
    practiceArea2 = await PracticeArea.create({
      title: { en: 'Family Law', es: 'Derecho Familiar' },
      shortDescription: { en: 'Family', es: 'Familiar' },
      description: { en: 'Family law', es: 'Derecho familiar' },
      detailedContent: { en: 'Details', es: 'Detalles' },
      excerpt: { en: 'Excerpt', es: 'Extracto' },
      callToAction: { en: 'Contact', es: 'Contacto' },
      seo: {
        metaTitle: { en: 'Title', es: 'Título' },
        metaDescription: { en: 'Desc', es: 'Desc' },
        keywords: { en: 'keywords', es: 'palabras' }
      },
      createdBy: admin._id,
      updatedBy: admin._id
    });
  });
  
  describe('Schema Validation', () => {
    it('should create a valid attorney', async () => {
      const attorneyData = global.testHelpers.generateAttorneyData({
        practiceAreas: [practiceArea1._id],
        primaryPracticeArea: practiceArea1._id,
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      const attorney = await Attorney.create(attorneyData);
      
      expect(attorney._id).toBeDefined();
      expect(attorney.firstName).toBe(attorneyData.firstName);
      expect(attorney.lastName).toBe(attorneyData.lastName);
      expect(attorney.email).toBe(attorneyData.email);
      expect(attorney.slug).toBe('john-doe');
    });
    
    it('should require required fields', async () => {
      const attorney = new Attorney({});
      
      const error = attorney.validateSync();
      expect(error.errors).toHaveProperty('firstName');
      expect(error.errors).toHaveProperty('lastName');
      expect(error.errors).toHaveProperty('email');
      expect(error.errors).toHaveProperty('phone');
      expect(error.errors).toHaveProperty('title.en');
      expect(error.errors).toHaveProperty('bio.en');
      expect(error.errors).toHaveProperty('practiceAreas');
    });
    
    it('should validate email format', async () => {
      const attorney = new Attorney({
        ...global.testHelpers.generateAttorneyData(),
        email: 'invalid-email',
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      await expect(attorney.save()).rejects.toThrow(/invalid email/i);
    });
    
    it('should enforce unique slug', async () => {
      const attorneyData = global.testHelpers.generateAttorneyData({
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      await Attorney.create(attorneyData);
      
      const duplicate = new Attorney({
        ...attorneyData,
        email: 'different@email.com'
      });
      
      await expect(duplicate.save()).rejects.toThrow(/duplicate/i);
    });
    
    it('should validate bar number format', async () => {
      const attorney = new Attorney({
        ...global.testHelpers.generateAttorneyData(),
        barNumber: 'invalid bar!',
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      await expect(attorney.save()).rejects.toThrow(/alphanumeric/i);
    });
  });
  
  describe('Auto-generated Fields', () => {
    it('should generate slug from name', async () => {
      const attorney = await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        firstName: 'Mary Jane',
        lastName: 'Smith-Johnson',
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(attorney.slug).toBe('mary-jane-smith-johnson');
    });
    
    it('should handle duplicate slugs', async () => {
      const attorneyData = {
        ...global.testHelpers.generateAttorneyData(),
        firstName: 'John',
        lastName: 'Doe',
        createdBy: admin._id,
        updatedBy: admin._id
      };
      
      const attorney1 = await Attorney.create(attorneyData);
      expect(attorney1.slug).toBe('john-doe');
      
      const attorney2 = await Attorney.create({
        ...attorneyData,
        email: 'different@email.com'
      });
      
      expect(attorney2.slug).toMatch(/^john-doe-\d+$/);
    });
    
    it('should set publishedAt when first published', async () => {
      const attorney = await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        isPublished: false,
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(attorney.publishedAt).toBeUndefined();
      
      attorney.isPublished = true;
      await attorney.save();
      
      expect(attorney.publishedAt).toBeInstanceOf(Date);
    });
  });
  
  describe('Virtual Fields', () => {
    let attorney;
    
    beforeEach(async () => {
      attorney = await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        firstName: 'John',
        middleName: 'Michael',
        lastName: 'Doe',
        suffix: 'Jr.',
        joiningDate: new Date('2020-01-01'),
        experience: [
          {
            position: { en: 'Associate', es: 'Asociado' },
            company: { en: 'Law Firm', es: 'Firma Legal' },
            isCurrentPosition: true
          }
        ],
        createdBy: admin._id,
        updatedBy: admin._id
      });
    });
    
    it('should calculate fullName', () => {
      expect(attorney.fullName).toBe('John Michael Doe Jr.');
    });
    
    it('should calculate formalName', () => {
      expect(attorney.formalName).toBe('Doe, John Michael Jr.');
    });
    
    it('should calculate yearsOfExperience', () => {
      const years = new Date().getFullYear() - 2020;
      expect(attorney.yearsOfExperience).toBe(years);
    });
    
    it('should determine isCurrentlyEmployed', () => {
      expect(attorney.isCurrentlyEmployed).toBe(true);
    });
  });
  
  describe('Practice Area Relationships', () => {
    it('should validate primaryPracticeArea is in practiceAreas', async () => {
      const attorney = await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        practiceAreas: [practiceArea1._id, practiceArea2._id],
        primaryPracticeArea: practiceArea2._id,
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(attorney.practiceAreas).toHaveLength(2);
      expect(attorney.primaryPracticeArea.toString()).toBe(practiceArea2._id.toString());
    });
    
    it('should add primaryPracticeArea to practiceAreas if not included', async () => {
      const attorney = await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        practiceAreas: [practiceArea1._id],
        primaryPracticeArea: practiceArea2._id,
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(attorney.practiceAreas).toHaveLength(2);
      expect(attorney.practiceAreas.map(p => p.toString())).toContain(practiceArea2._id.toString());
    });
  });
  
  describe('Static Methods', () => {
    beforeEach(async () => {
      // Create test attorneys
      await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        firstName: 'Active',
        lastName: 'Published',
        isActive: true,
        isPublished: true,
        isFeatured: true,
        displayOrder: 1,
        practiceAreas: [practiceArea1._id],
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        firstName: 'Active',
        lastName: 'Unpublished',
        email: 'unpublished@example.com',
        isActive: true,
        isPublished: false,
        practiceAreas: [practiceArea2._id],
        availability: { isAcceptingNewClients: true },
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        firstName: 'Inactive',
        lastName: 'Attorney',
        email: 'inactive@example.com',
        isActive: false,
        isPublished: true,
        createdBy: admin._id,
        updatedBy: admin._id
      });
    });
    
    describe('findActive', () => {
      it('should return only active and published attorneys', async () => {
        const attorneys = await Attorney.findActive();
        
        expect(attorneys).toHaveLength(1);
        expect(attorneys[0].isActive).toBe(true);
        expect(attorneys[0].isPublished).toBe(true);
      });
    });
    
    describe('findFeatured', () => {
      it('should return featured attorneys sorted by displayOrder', async () => {
        const attorneys = await Attorney.findFeatured();
        
        expect(attorneys).toHaveLength(1);
        expect(attorneys[0].isFeatured).toBe(true);
        expect(attorneys[0].displayOrder).toBe(1);
      });
    });
    
    describe('findByPracticeArea', () => {
      it('should find attorneys by practice area', async () => {
        const attorneys = await Attorney.findByPracticeArea(practiceArea1._id);
        
        expect(attorneys).toHaveLength(1);
        expect(attorneys[0].practiceAreas).toContainEqual(practiceArea1._id);
      });
    });
    
    describe('findAcceptingClients', () => {
      it('should find attorneys accepting new clients', async () => {
        const attorneys = await Attorney.findAcceptingClients();
        
        expect(attorneys).toHaveLength(1);
        expect(attorneys[0].availability.isAcceptingNewClients).toBe(true);
      });
    });
    
    describe('searchAttorneys', () => {
      it('should search attorneys by text', async () => {
        const results = await Attorney.searchAttorneys('Active');
        
        expect(results).toHaveLength(1);
        expect(results[0].firstName).toBe('Active');
      });
    });
  });
  
  describe('Complex Schemas', () => {
    it('should validate education schema', async () => {
      const attorney = await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        education: [{
          institution: { en: 'Harvard Law', es: 'Harvard Law' },
          degree: { en: 'J.D.', es: 'J.D.' },
          fieldOfStudy: { en: 'Law', es: 'Derecho' },
          graduationYear: 2010,
          honors: { en: 'Magna Cum Laude' },
          isHighlighted: true
        }],
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(attorney.education).toHaveLength(1);
      expect(attorney.education[0].graduationYear).toBe(2010);
    });
    
    it('should validate language proficiency', async () => {
      const attorney = await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        languages: [{
          language: { en: 'Spanish', es: 'Español' },
          proficiency: 'native'
        }],
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(attorney.languages).toHaveLength(1);
      expect(attorney.languages[0].proficiency).toBe('native');
    });
    
    it('should validate availability schema', async () => {
      const attorney = await Attorney.create({
        ...global.testHelpers.generateAttorneyData(),
        availability: {
          isAcceptingNewClients: true,
          preferredContactMethod: 'email',
          responseTimeExpectation: { en: '24 hours', es: '24 horas' },
          consultationTypes: ['inPerson', 'phone', 'video'],
          availableHours: {
            timezone: 'America/New_York',
            schedule: [{
              dayOfWeek: 1,
              startTime: '09:00',
              endTime: '17:00'
            }]
          }
        },
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(attorney.availability.consultationTypes).toHaveLength(3);
      expect(attorney.availability.availableHours.schedule).toHaveLength(1);
    });
  });
});
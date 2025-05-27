import PracticeArea from '../../../src/models/PracticeArea.js';
import Attorney from '../../../src/models/Attorney.js';
import User from '../../../src/models/User.js';
import mongoose from 'mongoose';

describe('PracticeArea Model', () => {
  let admin, attorney1, attorney2;
  
  beforeEach(async () => {
    // Create admin user
    admin = await User.create(global.testHelpers.generateUserData({
      role: 'admin'
    }));
    
    // Create attorneys
    attorney1 = await Attorney.create({
      ...global.testHelpers.generateAttorneyData(),
      firstName: 'John',
      lastName: 'Doe',
      practiceAreas: [],
      createdBy: admin._id,
      updatedBy: admin._id
    });
    
    attorney2 = await Attorney.create({
      ...global.testHelpers.generateAttorneyData(),
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      practiceAreas: [],
      createdBy: admin._id,
      updatedBy: admin._id
    });
  });
  
  describe('Schema Validation', () => {
    it('should create a valid practice area', async () => {
      const practiceAreaData = global.testHelpers.generatePracticeAreaData({
        attorneys: [attorney1._id],
        leadAttorney: attorney1._id,
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      const practiceArea = await PracticeArea.create(practiceAreaData);
      
      expect(practiceArea._id).toBeDefined();
      expect(practiceArea.title.en).toBe(practiceAreaData.title.en);
      expect(practiceArea.slug).toBe('corporate-law');
    });
    
    it('should require required fields', async () => {
      const practiceArea = new PracticeArea({});
      
      const error = practiceArea.validateSync();
      expect(error.errors).toHaveProperty('title.en');
      expect(error.errors).toHaveProperty('shortDescription.en');
      expect(error.errors).toHaveProperty('description.en');
      expect(error.errors).toHaveProperty('seo.metaTitle.en');
    });
    
    it('should enforce unique slug', async () => {
      const practiceAreaData = global.testHelpers.generatePracticeAreaData({
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      await PracticeArea.create(practiceAreaData);
      
      const duplicate = new PracticeArea(practiceAreaData);
      await expect(duplicate.save()).rejects.toThrow(/duplicate/i);
    });
  });
  
  describe('Auto-generated Fields', () => {
    it('should generate slug from English title', async () => {
      const practiceArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        title: { en: 'Personal Injury Law', es: 'Derecho de Lesiones Personales' },
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(practiceArea.slug).toBe('personal-injury-law');
    });
    
    it('should handle duplicate slugs', async () => {
      const practiceAreaData = {
        ...global.testHelpers.generatePracticeAreaData(),
        createdBy: admin._id,
        updatedBy: admin._id
      };
      
      const area1 = await PracticeArea.create(practiceAreaData);
      expect(area1.slug).toBe('corporate-law');
      
      const area2 = await PracticeArea.create(practiceAreaData);
      expect(area2.slug).toMatch(/^corporate-law-\d+$/);
    });
    
    it('should set publishedAt when first published', async () => {
      const practiceArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        isPublished: false,
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(practiceArea.publishedAt).toBeUndefined();
      
      practiceArea.isPublished = true;
      await practiceArea.save();
      
      expect(practiceArea.publishedAt).toBeInstanceOf(Date);
    });
  });
  
  describe('Hierarchical Structure', () => {
    let parentArea, childArea1, childArea2;
    
    beforeEach(async () => {
      parentArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        title: { en: 'Business Law', es: 'Derecho Empresarial' },
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      childArea1 = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        title: { en: 'Corporate Law', es: 'Derecho Corporativo' },
        parentArea: parentArea._id,
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      childArea2 = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        title: { en: 'Contract Law', es: 'Derecho Contractual' },
        parentArea: parentArea._id,
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      // Update parent with children
      parentArea.subAreas = [childArea1._id, childArea2._id];
      await parentArea.save();
    });
    
    it('should support parent-child relationships', () => {
      expect(childArea1.parentArea.toString()).toBe(parentArea._id.toString());
      expect(parentArea.subAreas).toHaveLength(2);
    });
    
    it('should find top-level areas', async () => {
      const topLevel = await PracticeArea.findTopLevel();
      
      expect(topLevel).toHaveLength(1);
      expect(topLevel[0]._id.toString()).toBe(parentArea._id.toString());
    });
    
    it('should find children by parent', async () => {
      const children = await PracticeArea.findByParent(parentArea._id);
      
      expect(children).toHaveLength(2);
      expect(children.map(c => c._id.toString())).toContain(childArea1._id.toString());
      expect(children.map(c => c._id.toString())).toContain(childArea2._id.toString());
    });
    
    it('should build hierarchy', async () => {
      const hierarchy = await PracticeArea.getHierarchy();
      
      expect(hierarchy).toHaveLength(1);
      expect(hierarchy[0]._id.toString()).toBe(parentArea._id.toString());
      expect(hierarchy[0].children).toHaveLength(2);
    });
  });
  
  describe('Virtual Fields', () => {
    let practiceArea;
    
    beforeEach(async () => {
      practiceArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        attorneys: [attorney1._id, attorney2._id],
        subAreas: [],
        faqs: [
          { question: { en: 'Q1' }, answer: { en: 'A1' }, isPublished: true },
          { question: { en: 'Q2' }, answer: { en: 'A2' }, isPublished: true },
          { question: { en: 'Q3' }, answer: { en: 'A3' }, isPublished: false }
        ],
        services: [
          { name: { en: 'Service 1' } },
          { name: { en: 'Service 2' } }
        ],
        createdBy: admin._id,
        updatedBy: admin._id
      });
    });
    
    it('should calculate attorneyCount', () => {
      expect(practiceArea.attorneyCount).toBe(2);
    });
    
    it('should calculate subAreaCount', () => {
      expect(practiceArea.subAreaCount).toBe(0);
    });
    
    it('should calculate faqCount (published only)', () => {
      expect(practiceArea.faqCount).toBe(2);
    });
    
    it('should calculate serviceCount', () => {
      expect(practiceArea.serviceCount).toBe(2);
    });
  });
  
  describe('Attorney Relationships', () => {
    it('should validate leadAttorney is in attorneys array', async () => {
      const practiceArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        attorneys: [attorney1._id, attorney2._id],
        leadAttorney: attorney2._id,
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(practiceArea.attorneys).toHaveLength(2);
      expect(practiceArea.leadAttorney.toString()).toBe(attorney2._id.toString());
    });
    
    it('should add leadAttorney to attorneys if not included', async () => {
      const practiceArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        attorneys: [attorney1._id],
        leadAttorney: attorney2._id,
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(practiceArea.attorneys).toHaveLength(2);
      expect(practiceArea.attorneys.map(a => a.toString())).toContain(attorney2._id.toString());
    });
  });
  
  describe('Static Methods', () => {
    beforeEach(async () => {
      await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        title: { en: 'Active Published', es: 'Activo Publicado' },
        isActive: true,
        isPublished: true,
        isFeatured: true,
        attorneys: [attorney1._id],
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        title: { en: 'Active Unpublished', es: 'Activo No Publicado' },
        isActive: true,
        isPublished: false,
        attorneys: [],
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        title: { en: 'Inactive', es: 'Inactivo' },
        isActive: false,
        isPublished: true,
        createdBy: admin._id,
        updatedBy: admin._id
      });
    });
    
    describe('findActive', () => {
      it('should return only active and published areas', async () => {
        const areas = await PracticeArea.findActive();
        
        expect(areas).toHaveLength(1);
        expect(areas[0].isActive).toBe(true);
        expect(areas[0].isPublished).toBe(true);
      });
    });
    
    describe('findFeatured', () => {
      it('should return featured areas', async () => {
        const areas = await PracticeArea.findFeatured();
        
        expect(areas).toHaveLength(1);
        expect(areas[0].isFeatured).toBe(true);
      });
    });
    
    describe('findWithAttorneys', () => {
      it('should find areas that have attorneys', async () => {
        const areas = await PracticeArea.findWithAttorneys();
        
        expect(areas).toHaveLength(1);
        expect(areas[0].attorneys.length).toBeGreaterThan(0);
      });
    });
    
    describe('searchPracticeAreas', () => {
      it('should search areas by text', async () => {
        const results = await PracticeArea.searchPracticeAreas('Active');
        
        expect(results).toHaveLength(1);
        expect(results[0].title.en).toContain('Active');
      });
    });
  });
  
  describe('Complex Schemas', () => {
    it('should validate services schema', async () => {
      const practiceArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        services: [{
          name: { en: 'Contract Drafting', es: 'Redacción de Contratos' },
          description: { en: 'Professional contract drafting', es: 'Redacción profesional de contratos' },
          icon: 'document-text',
          isHighlighted: true,
          order: 1
        }],
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(practiceArea.services).toHaveLength(1);
      expect(practiceArea.services[0].isHighlighted).toBe(true);
    });
    
    it('should validate FAQs schema', async () => {
      const practiceArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        faqs: [{
          question: { en: 'What is corporate law?', es: '¿Qué es el derecho corporativo?' },
          answer: { en: 'Corporate law deals with...', es: 'El derecho corporativo trata...' },
          order: 1,
          isPublished: true
        }],
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(practiceArea.faqs).toHaveLength(1);
      expect(practiceArea.faqs[0].isPublished).toBe(true);
    });
    
    it('should validate statistics schema', async () => {
      const practiceArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        statistics: [{
          label: { en: 'Success Rate', es: 'Tasa de Éxito' },
          value: '95%',
          description: { en: 'Our success rate', es: 'Nuestra tasa de éxito' },
          order: 1
        }],
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(practiceArea.statistics).toHaveLength(1);
      expect(practiceArea.statistics[0].value).toBe('95%');
    });
    
    it('should sort arrays by order on save', async () => {
      const practiceArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        services: [
          { name: { en: 'Service 3' }, order: 3 },
          { name: { en: 'Service 1' }, order: 1 },
          { name: { en: 'Service 2' }, order: 2 }
        ],
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      expect(practiceArea.services[0].name.en).toBe('Service 1');
      expect(practiceArea.services[1].name.en).toBe('Service 2');
      expect(practiceArea.services[2].name.en).toBe('Service 3');
    });
  });
  
  describe('Instance Methods', () => {
    let practiceArea;
    
    beforeEach(async () => {
      practiceArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        attorneys: [attorney1._id, attorney2._id],
        leadAttorney: attorney1._id,
        relatedAreas: [],
        createdBy: admin._id,
        updatedBy: admin._id
      });
    });
    
    it('should get attorneys', async () => {
      const attorneys = await practiceArea.getAttorneys();
      
      expect(attorneys).toHaveLength(2);
      expect(attorneys[0]).toHaveProperty('firstName');
      expect(attorneys[0]).toHaveProperty('lastName');
    });
    
    it('should get lead attorney', async () => {
      const leadAttorney = await practiceArea.getLeadAttorney();
      
      expect(leadAttorney).toBeDefined();
      expect(leadAttorney.firstName).toBe('John');
    });
    
    it('should get related areas', async () => {
      const relatedArea = await PracticeArea.create({
        ...global.testHelpers.generatePracticeAreaData(),
        title: { en: 'Related Area', es: 'Área Relacionada' },
        createdBy: admin._id,
        updatedBy: admin._id
      });
      
      practiceArea.relatedAreas = [relatedArea._id];
      await practiceArea.save();
      
      const related = await practiceArea.getRelatedAreas();
      expect(related).toHaveLength(1);
      expect(related[0].title.en).toBe('Related Area');
    });
  });
});
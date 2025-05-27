import mongoose from 'mongoose';
import User from '../../src/models/User.js';
import Attorney from '../../src/models/Attorney.js';
import PracticeArea from '../../src/models/PracticeArea.js';

export const dbHelper = {
  // Clear specific collections
  clearCollection: async (modelName) => {
    const model = mongoose.model(modelName);
    await model.deleteMany({});
  },
  
  // Clear all collections
  clearAllCollections: async () => {
    await User.deleteMany({});
    await Attorney.deleteMany({});
    await PracticeArea.deleteMany({});
  },
  
  // Create test data seeds
  seedDatabase: async () => {
    // Create admin user
    const admin = await User.create({
      email: 'admin@bonderudlaw.com',
      password: 'Admin123!@#',
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User'
      },
      auth: { isEmailVerified: true }
    });
    
    // Create practice areas
    const corporateLaw = await PracticeArea.create({
      title: { en: 'Corporate Law', es: 'Derecho Corporativo' },
      shortDescription: { en: 'Corporate legal services', es: 'Servicios legales corporativos' },
      description: { en: 'Full service corporate law', es: 'Servicio completo de derecho corporativo' },
      detailedContent: { en: 'Detailed content', es: 'Contenido detallado' },
      excerpt: { en: 'Excerpt', es: 'Extracto' },
      callToAction: { en: 'Contact us', es: 'Contáctanos' },
      seo: {
        metaTitle: { en: 'Corporate Law', es: 'Derecho Corporativo' },
        metaDescription: { en: 'Corporate law services', es: 'Servicios de derecho corporativo' },
        keywords: { en: 'corporate, law', es: 'corporativo, derecho' }
      },
      isActive: true,
      isPublished: true,
      createdBy: admin._id,
      updatedBy: admin._id
    });
    
    const familyLaw = await PracticeArea.create({
      title: { en: 'Family Law', es: 'Derecho Familiar' },
      shortDescription: { en: 'Family legal services', es: 'Servicios legales familiares' },
      description: { en: 'Comprehensive family law', es: 'Derecho familiar integral' },
      detailedContent: { en: 'Detailed content', es: 'Contenido detallado' },
      excerpt: { en: 'Excerpt', es: 'Extracto' },
      callToAction: { en: 'Contact us', es: 'Contáctanos' },
      seo: {
        metaTitle: { en: 'Family Law', es: 'Derecho Familiar' },
        metaDescription: { en: 'Family law services', es: 'Servicios de derecho familiar' },
        keywords: { en: 'family, law', es: 'familiar, derecho' }
      },
      isActive: true,
      isPublished: true,
      createdBy: admin._id,
      updatedBy: admin._id
    });
    
    // Create attorneys
    const attorney1 = await Attorney.create({
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@bonderudlaw.com',
      phone: '+1234567890',
      title: { en: 'Senior Partner', es: 'Socio Principal' },
      bio: { en: 'Experienced attorney', es: 'Abogada experimentada' },
      shortBio: { en: 'Partner', es: 'Socia' },
      specialties: { en: 'Corporate and Family Law', es: 'Derecho Corporativo y Familiar' },
      practiceAreas: [corporateLaw._id, familyLaw._id],
      primaryPracticeArea: corporateLaw._id,
      joiningDate: new Date('2010-01-01'),
      isActive: true,
      isPublished: true,
      isPartner: true,
      isFeatured: true,
      availability: {
        isAcceptingNewClients: true,
        preferredContactMethod: 'email',
        responseTimeExpectation: { en: '24 hours', es: '24 horas' },
        consultationTypes: ['inPerson', 'phone', 'video']
      },
      seo: {
        metaTitle: { en: 'Jane Smith - Senior Partner', es: 'Jane Smith - Socia Principal' },
        metaDescription: { en: 'Attorney profile', es: 'Perfil de abogada' }
      },
      createdBy: admin._id,
      updatedBy: admin._id
    });
    
    const attorney2 = await Attorney.create({
      firstName: 'Robert',
      lastName: 'Johnson',
      email: 'robert.johnson@bonderudlaw.com',
      phone: '+1234567891',
      barNumber: 'BAR123456',
      title: { en: 'Associate Attorney', es: 'Abogado Asociado' },
      bio: { en: 'Dedicated attorney', es: 'Abogado dedicado' },
      shortBio: { en: 'Associate', es: 'Asociado' },
      specialties: { en: 'Family Law', es: 'Derecho Familiar' },
      practiceAreas: [familyLaw._id],
      primaryPracticeArea: familyLaw._id,
      joiningDate: new Date('2015-06-01'),
      isActive: true,
      isPublished: true,
      availability: {
        isAcceptingNewClients: true,
        preferredContactMethod: 'phone',
        responseTimeExpectation: { en: '48 hours', es: '48 horas' },
        consultationTypes: ['inPerson', 'phone']
      },
      seo: {
        metaTitle: { en: 'Robert Johnson - Attorney', es: 'Robert Johnson - Abogado' },
        metaDescription: { en: 'Attorney profile', es: 'Perfil de abogado' }
      },
      createdBy: admin._id,
      updatedBy: admin._id
    });
    
    // Update practice areas with attorneys
    await PracticeArea.findByIdAndUpdate(corporateLaw._id, {
      attorneys: [attorney1._id],
      leadAttorney: attorney1._id
    });
    
    await PracticeArea.findByIdAndUpdate(familyLaw._id, {
      attorneys: [attorney1._id, attorney2._id],
      leadAttorney: attorney2._id
    });
    
    return {
      users: { admin },
      practiceAreas: { corporateLaw, familyLaw },
      attorneys: { attorney1, attorney2 }
    };
  }
};
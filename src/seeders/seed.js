import { User } from '../models/User.js';
import { Attorney } from '../models/Attorney.js';
import { PracticeArea } from '../models/PracticeArea.js';
import { CaseResult } from '../models/CaseResult.js';
import { BlogCategory } from '../models/BlogCategory.js';
import { BlogPost } from '../models/BlogPost.js';
import { ClientReview } from '../models/ClientReview.js';
import database from '../config/database.js';

// Sample data
const sampleUsers = [
  {
    email: 'admin@bonderudlaw.com',
    password: 'Admin@123',
    role: 'admin',
    profile: {
      name: {
        en: 'Admin User',
        es: 'Usuario Administrador'
      },
      phone: '+1-555-0100',
      preferredLanguage: 'en'
    },
    isEmailVerified: true
  },
  {
    email: 'editor@bonderudlaw.com',
    password: 'Editor@123',
    role: 'editor',
    profile: {
      name: {
        en: 'Editor User',
        es: 'Usuario Editor'
      },
      phone: '+1-555-0101',
      preferredLanguage: 'en'
    },
    isEmailVerified: true
  }
];

const samplePracticeAreas = [
  {
    name: {
      en: 'Criminal Defense',
      es: 'Defensa Criminal'
    },
    slug: {
      en: 'criminal-defense',
      es: 'defensa-criminal'
    },
    description: {
      en: 'Comprehensive criminal defense services for all types of charges',
      es: 'Servicios integrales de defensa criminal para todo tipo de cargos'
    },
    services: {
      en: ['DUI Defense', 'Drug Crimes', 'Violent Crimes', 'White Collar Crimes'],
      es: ['Defensa DUI', 'Delitos de Drogas', 'Delitos Violentos', 'Delitos de Cuello Blanco']
    },
    isFeatured: true,
    displayOrder: 1
  },
  {
    name: {
      en: 'Family Law',
      es: 'Derecho Familiar'
    },
    slug: {
      en: 'family-law',
      es: 'derecho-familiar'
    },
    description: {
      en: 'Compassionate family law services for divorce, custody, and more',
      es: 'Servicios compasivos de derecho familiar para divorcio, custodia y más'
    },
    services: {
      en: ['Divorce', 'Child Custody', 'Child Support', 'Alimony'],
      es: ['Divorcio', 'Custodia de Niños', 'Manutención Infantil', 'Pensión Alimenticia']
    },
    isFeatured: true,
    displayOrder: 2
  },
  {
    name: {
      en: 'Personal Injury',
      es: 'Lesiones Personales'
    },
    slug: {
      en: 'personal-injury',
      es: 'lesiones-personales'
    },
    description: {
      en: 'Fighting for compensation for accident victims',
      es: 'Luchando por compensación para víctimas de accidentes'
    },
    services: {
      en: ['Car Accidents', 'Slip and Fall', 'Medical Malpractice', 'Wrongful Death'],
      es: ['Accidentes de Auto', 'Resbalones y Caídas', 'Negligencia Médica', 'Muerte Injusta']
    },
    displayOrder: 3
  }
];

const sampleAttorneys = [
  {
    name: {
      en: 'Andrew Michael Bonderud',
      es: 'Andrew Michael Bonderud'
    },
    slug: {
      en: 'andrew-michael-bonderud',
      es: 'andrew-michael-bonderud'
    },
    title: {
      en: 'Founding Partner',
      es: 'Socio Fundador'
    },
    bio: {
      en: 'With over 20 years of experience, Andrew Bonderud has successfully defended thousands of clients.',
      es: 'Con más de 20 años de experiencia, Andrew Bonderud ha defendido exitosamente a miles de clientes.'
    },
    specialties: {
      en: ['Criminal Defense', 'DUI Defense', 'Federal Crimes'],
      es: ['Defensa Criminal', 'Defensa DUI', 'Delitos Federales']
    },
    education: {
      en: [
        {
          degree: 'Juris Doctor',
          institution: 'Harvard Law School',
          year: 1998
        }
      ],
      es: [
        {
          degree: 'Doctor en Derecho',
          institution: 'Escuela de Derecho de Harvard',
          year: 1998
        }
      ]
    },
    contact: {
      email: 'andrew@bonderudlaw.com',
      phone: '+1-555-0200'
    },
    yearsExperience: 25,
    barNumber: 'FL123456',
    isFeatured: true,
    displayOrder: 1
  },
  {
    name: {
      en: 'Sarah Johnson',
      es: 'Sarah Johnson'
    },
    slug: {
      en: 'sarah-johnson',
      es: 'sarah-johnson'
    },
    title: {
      en: 'Senior Attorney',
      es: 'Abogada Senior'
    },
    bio: {
      en: 'Sarah specializes in family law and has helped hundreds of families through difficult times.',
      es: 'Sarah se especializa en derecho familiar y ha ayudado a cientos de familias en momentos difíciles.'
    },
    specialties: {
      en: ['Family Law', 'Divorce', 'Child Custody'],
      es: ['Derecho Familiar', 'Divorcio', 'Custodia de Niños']
    },
    education: {
      en: [
        {
          degree: 'Juris Doctor',
          institution: 'University of Florida',
          year: 2005
        }
      ],
      es: [
        {
          degree: 'Doctor en Derecho',
          institution: 'Universidad de Florida',
          year: 2005
        }
      ]
    },
    contact: {
      email: 'sarah@bonderudlaw.com',
      phone: '+1-555-0201'
    },
    yearsExperience: 18,
    barNumber: 'FL789012',
    displayOrder: 2
  }
];

const sampleCaseResults = [
  {
    title: {
      en: 'DUI Charges Dismissed',
      es: 'Cargos de DUI Desestimados'
    },
    category: 'criminal-defense',
    outcome: {
      en: 'All charges dismissed',
      es: 'Todos los cargos desestimados'
    },
    description: {
      en: 'Successfully defended client against DUI charges by challenging the validity of the traffic stop.',
      es: 'Defendimos exitosamente al cliente contra cargos de DUI cuestionando la validez de la parada de tráfico.'
    },
    date: new Date('2024-11-15'),
    featured: true,
    result: {
      en: 'Case dismissed',
      es: 'Caso desestimado'
    },
    charges: [
      {
        en: 'Driving Under the Influence',
        es: 'Conducir Bajo la Influencia'
      }
    ]
  },
  {
    title: {
      en: '$2.5 Million Personal Injury Settlement',
      es: 'Acuerdo de $2.5 Millones por Lesiones Personales'
    },
    category: 'personal-injury',
    outcome: {
      en: 'Substantial settlement for client',
      es: 'Acuerdo sustancial para el cliente'
    },
    description: {
      en: 'Secured a $2.5 million settlement for a client injured in a serious car accident.',
      es: 'Aseguramos un acuerdo de $2.5 millones para un cliente lesionado en un accidente automovilístico grave.'
    },
    date: new Date('2024-10-20'),
    featured: true,
    result: {
      en: '$2.5 million settlement',
      es: 'Acuerdo de $2.5 millones'
    }
  }
];

const sampleBlogCategories = [
  {
    name: {
      en: 'Legal News',
      es: 'Noticias Legales'
    },
    slug: {
      en: 'legal-news',
      es: 'noticias-legales'
    },
    description: {
      en: 'Latest updates in law and legal matters',
      es: 'Últimas actualizaciones en derecho y asuntos legales'
    }
  },
  {
    name: {
      en: 'Know Your Rights',
      es: 'Conoce Tus Derechos'
    },
    slug: {
      en: 'know-your-rights',
      es: 'conoce-tus-derechos'
    },
    description: {
      en: 'Educational content about your legal rights',
      es: 'Contenido educativo sobre tus derechos legales'
    }
  }
];

const sampleReviews = [
  {
    reviewer: {
      name: 'John Smith',
      email: 'john.smith@example.com',
      location: {
        city: 'Miami',
        state: 'FL'
      }
    },
    rating: 5,
    title: {
      en: 'Outstanding Legal Representation',
      es: 'Representación Legal Excepcional'
    },
    content: {
      en: 'Mr. Bonderud and his team provided exceptional service throughout my case. Highly recommended!',
      es: 'El Sr. Bonderud y su equipo brindaron un servicio excepcional durante todo mi caso. ¡Altamente recomendado!'
    },
    status: 'approved',
    verifiedClient: true,
    dateApproved: new Date(),
    consentToDisplay: true
  },
  {
    reviewer: {
      name: 'Maria Garcia',
      email: 'maria.garcia@example.com',
      location: {
        city: 'Orlando',
        state: 'FL'
      }
    },
    rating: 5,
    title: {
      en: 'Compassionate and Professional',
      es: 'Compasivo y Profesional'
    },
    content: {
      en: 'Sarah Johnson helped me through my divorce with compassion and professionalism. I am grateful for her support.',
      es: 'Sarah Johnson me ayudó durante mi divorcio con compasión y profesionalismo. Estoy agradecida por su apoyo.'
    },
    status: 'approved',
    verifiedClient: true,
    dateApproved: new Date(),
    consentToDisplay: true
  }
];

// Seed function
async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Connect to database
    await database.connect();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Attorney.deleteMany({});
    await PracticeArea.deleteMany({});
    await CaseResult.deleteMany({});
    await BlogCategory.deleteMany({});
    await ClientReview.deleteMany({});

    // Create admin user
    console.log('👤 Creating users...');
    const users = await User.insertMany(sampleUsers);
    const adminUser = users[0];

    // Create practice areas
    console.log('⚖️ Creating practice areas...');
    const practiceAreas = await PracticeArea.insertMany(
      samplePracticeAreas.map(area => ({
        ...area,
        createdBy: adminUser._id,
        updatedBy: adminUser._id
      }))
    );

    // Create attorneys
    console.log('👨‍⚖️ Creating attorneys...');
    const attorneys = await Attorney.insertMany(
      sampleAttorneys.map((attorney, index) => ({
        ...attorney,
        practiceAreas: [practiceAreas[index % practiceAreas.length]._id],
        createdBy: adminUser._id,
        updatedBy: adminUser._id
      }))
    );

    // Update practice areas with attorneys
    for (let i = 0; i < practiceAreas.length; i++) {
      await PracticeArea.findByIdAndUpdate(practiceAreas[i]._id, {
        attorneys: attorneys.filter((_, idx) => idx % practiceAreas.length === i).map(a => a._id)
      });
    }

    // Create case results
    console.log('📋 Creating case results...');
    await CaseResult.insertMany(
      sampleCaseResults.map(result => ({
        ...result,
        createdBy: adminUser._id,
        updatedBy: adminUser._id
      }))
    );

    // Create blog categories
    console.log('📝 Creating blog categories...');
    const blogCategories = await BlogCategory.insertMany(
      sampleBlogCategories.map(category => ({
        ...category,
        createdBy: adminUser._id,
        updatedBy: adminUser._id
      }))
    );

    // Create sample blog post
    console.log('📰 Creating blog posts...');
    await BlogPost.create({
      title: {
        en: 'Understanding Your Rights During a Traffic Stop',
        es: 'Entendiendo Tus Derechos Durante una Parada de Tráfico'
      },
      slug: {
        en: 'understanding-rights-traffic-stop',
        es: 'entendiendo-derechos-parada-trafico'
      },
      content: {
        en: '<p>When you are pulled over by law enforcement, it is important to know your rights...</p>',
        es: '<p>Cuando la policía te detiene, es importante conocer tus derechos...</p>'
      },
      excerpt: {
        en: 'Learn about your constitutional rights during police traffic stops.',
        es: 'Aprende sobre tus derechos constitucionales durante las paradas de tráfico policial.'
      },
      author: attorneys[0]._id,
      categories: [blogCategories[1]._id],
      status: 'published',
      publishedAt: new Date(),
      tags: {
        en: ['traffic stop', 'rights', 'police'],
        es: ['parada de tráfico', 'derechos', 'policía']
      },
      createdBy: adminUser._id,
      updatedBy: adminUser._id
    });

    // Create reviews
    console.log('⭐ Creating reviews...');
    await ClientReview.insertMany(
      sampleReviews.map((review, index) => ({
        ...review,
        practiceArea: practiceAreas[index % practiceAreas.length]._id,
        attorney: attorneys[index % attorneys.length]._id
      }))
    );

    console.log('✅ Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Practice Areas: ${practiceAreas.length}`);
    console.log(`   - Attorneys: ${attorneys.length}`);
    console.log(`   - Case Results: ${sampleCaseResults.length}`);
    console.log(`   - Blog Categories: ${blogCategories.length}`);
    console.log(`   - Reviews: ${sampleReviews.length}`);
    console.log('\n🔐 Login credentials:');
    console.log('   Admin: admin@bonderudlaw.com / Admin@123');
    console.log('   Editor: editor@bonderudlaw.com / Editor@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder
seedDatabase();
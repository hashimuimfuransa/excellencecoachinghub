import mongoose from 'mongoose';
import { TestPackage } from '../models/TestPackage';
import dotenv from 'dotenv';

dotenv.config();

const testPackages = [
  {
    name: 'Basic Assessment',
    description: 'Essential psychometric evaluation with basic insights',
    level: 'basic',
    price: 3000, // 3,000 RWF
    currency: 'RWF',
    features: {
      questionCount: 20,
      timeLimit: 25,
      attempts: 1,
      validityDays: 7,
      industrySpecific: false,
      detailedReports: false,
      comparativeAnalysis: false,
      certificateIncluded: false
    },
    isActive: true
  },
  {
    name: 'Standard Assessment',
    description: 'Comprehensive evaluation with detailed insights and analysis',
    level: 'standard',
    price: 5000, // 5,000 RWF
    currency: 'RWF',
    features: {
      questionCount: 35,
      timeLimit: 40,
      attempts: 2,
      validityDays: 15,
      industrySpecific: true,
      detailedReports: true,
      comparativeAnalysis: false,
      certificateIncluded: false
    },
    isActive: true
  },
  {
    name: 'Premium Assessment',
    description: 'Advanced evaluation with industry benchmarking and personalized recommendations',
    level: 'premium',
    price: 8000, // 8,000 RWF
    currency: 'RWF',
    features: {
      questionCount: 50,
      timeLimit: 60,
      attempts: 3,
      validityDays: 30,
      industrySpecific: true,
      detailedReports: true,
      comparativeAnalysis: true,
      certificateIncluded: true
    },
    isActive: true
  },
  {
    name: 'Enterprise Assessment',
    description: 'Complete evaluation suite with unlimited attempts and comprehensive analytics',
    level: 'enterprise',
    price: 12000, // 12,000 RWF
    currency: 'RWF',
    features: {
      questionCount: 75,
      timeLimit: 90,
      attempts: 5,
      validityDays: 60,
      industrySpecific: true,
      detailedReports: true,
      comparativeAnalysis: true,
      certificateIncluded: true
    },
    isActive: true
  }
];

async function seedTestPackages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoaching');
    console.log('Connected to MongoDB');

    // Clear existing packages
    await TestPackage.deleteMany({});
    console.log('Cleared existing test packages');

    // Insert new packages
    const createdPackages = await TestPackage.insertMany(testPackages);
    console.log(`Created ${createdPackages.length} test packages:`, 
      createdPackages.map(pkg => `${pkg.name} - ${pkg.price} ${pkg.currency}`)
    );

    console.log('Test packages seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding test packages:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeder
seedTestPackages();
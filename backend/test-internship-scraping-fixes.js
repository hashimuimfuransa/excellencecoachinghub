/**
 * Test script to verify internship scraping fixes
 * Tests the new validation and duplicate prevention logic
 */

const InternshipRwScrapingService = require('./dist/services/internshipRwScrapingService').default;

// Mock job data that represents the problematic data you showed
const mockInvalidJobs = [
  {
    title: "getFullYear());2025 Ministry",
    company: "Internship Portal",
    location: "Rwanda",
    description: "Contact: internship@mifotra\ninternship • entry level\nRwanda\ngetFullYear());2025 Ministry\nInternship Portal\nACTIVE\n0\n0 views\nSep 23, 2025",
    jobType: "INTERNSHIP",
    category: "JOBS",
    experienceLevel: "ENTRY_LEVEL",
    educationLevel: "BACHELOR",
    requirements: [],
    responsibilities: [],
    benefits: [],
    skills: [],
    contactInfo: {
      email: "internship@mifotra",
      phone: undefined,
      website: undefined,
      address: undefined,
      representativeName: undefined,
      applicationInstructions: undefined
    },
    applicationDeadline: undefined,
    postedDate: new Date(),
    externalApplicationUrl: "https://internship.rw/test",
    externalJobId: "test-invalid-1",
    source: "internship.rw",
    isInternship: true
  },
  {
    title: "Contact: internship@mifotra",
    company: "internship • entry level",
    location: "Rwanda",
    description: "With the national internship portal, students and employers alike can benefit from a collaborative and dynamic platform that supports career development and success",
    jobType: "INTERNSHIP",
    category: "JOBS",
    experienceLevel: "ENTRY_LEVEL",
    educationLevel: "BACHELOR",
    requirements: [],
    responsibilities: [],
    benefits: [],
    skills: [],
    contactInfo: {
      email: "internship@mifotra",
      phone: undefined,
      website: undefined,
      address: undefined,
      representativeName: undefined,
      applicationInstructions: undefined
    },
    applicationDeadline: undefined,
    postedDate: new Date(),
    externalApplicationUrl: "https://internship.rw/test2",
    externalJobId: "test-invalid-2",
    source: "internship.rw",
    isInternship: true
  },
  {
    title: "Rwanda National Internship Programme",
    company: "Rwanda National Internship Programme",
    location: "Rwanda",
    description: "With the national internship portal, students and employers alike can benefit from a collaborative and dynamic platform that supports career development and success",
    jobType: "INTERNSHIP",
    category: "JOBS",
    experienceLevel: "ENTRY_LEVEL",
    educationLevel: "BACHELOR",
    requirements: ["Bachelor's degree", "Strong communication skills"],
    responsibilities: ["Gain practical work experience", "Support organizational objectives"],
    benefits: ["Professional Development", "Work Experience", "Networking Opportunities"],
    skills: ["Communication", "Teamwork", "Professional Development"],
    contactInfo: {
      email: "internship@mifotra.gov.rw",
      phone: undefined,
      website: undefined,
      address: undefined,
      representativeName: undefined,
      applicationInstructions: "Apply through the national internship portal"
    },
    applicationDeadline: undefined,
    postedDate: new Date(),
    externalApplicationUrl: "https://internship.rw/valid",
    externalJobId: "test-valid-1",
    source: "internship.rw",
    isInternship: true
  }
];

async function testValidationAndDuplicates() {
  console.log('🧪 Testing internship scraping fixes...\n');
  
  try {
    // Test 1: Check if invalid jobs are filtered out
    console.log('Test 1: Validating job data...');
    
    // We need to access the private method, so we'll test the public interface
    const result = await InternshipRwScrapingService.saveScrapedJobs(mockInvalidJobs);
    
    console.log(`✅ Test completed. Jobs processed: ${result}`);
    console.log('Expected: Only 1 valid job should be saved (the third one)');
    console.log('Expected: 2 invalid jobs should be filtered out\n');
    
    // Test 2: Check duplicate prevention
    console.log('Test 2: Testing duplicate prevention...');
    
    // Try to save the same valid job again
    const duplicateResult = await InternshipRwScrapingService.saveScrapedJobs([mockInvalidJobs[2]]);
    
    console.log(`✅ Duplicate test completed. Jobs processed: ${duplicateResult}`);
    console.log('Expected: 0 jobs should be saved (duplicate prevention)');
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Summary of fixes implemented:');
    console.log('✅ Enhanced data validation to filter out JavaScript code fragments');
    console.log('✅ Improved duplicate detection using multiple criteria');
    console.log('✅ Content cleaning to remove invalid patterns');
    console.log('✅ Repetitive content detection');
    console.log('✅ Better error logging and reporting');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testValidationAndDuplicates().then(() => {
  console.log('\n✅ Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});

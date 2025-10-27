/**
 * Test script to clean up invalid internship data and test new validation
 */

const InternshipRwScrapingService = require('./dist/services/internshipRwScrapingService').default;

async function testInternshipCleanup() {
  try {
    console.log('🧪 Testing internship data cleanup...');
    
    // Test the cleanup function
    const deletedCount = await InternshipRwScrapingService.cleanupInvalidInternshipData();
    
    console.log(`✅ Cleanup completed. Deleted ${deletedCount} invalid internship jobs.`);
    
    // Test the validation with sample data
    console.log('\n🧪 Testing validation with sample data...');
    
    const testJobs = [
      {
        title: "Now Hiring: Apply to Gain Hands-On Experience and Boost Your Career with Our Internship Programs",
        company: "Rwanda National Internship Programme",
        description: "With the national internship portal, students and employers alike can benefit from a collaborative and dynamic platform that supports career development and success"
      },
      {
        title: "Software Development Internship",
        company: "TechCorp Rwanda",
        description: "We are seeking a software development intern to join our team. The intern will work on web applications using React and Node.js. Responsibilities include coding, testing, and documentation. Requirements: Computer Science degree, knowledge of JavaScript, React experience preferred."
      },
      {
        title: "Internship Program Objectives",
        company: "Internship Portal",
        description: "The national internship portal provides a unique opportunity for both students and employers to connect and collaborate"
      }
    ];
    
    for (const job of testJobs) {
      const isValid = InternshipRwScrapingService.isValidJobData ? 
        InternshipRwScrapingService.isValidJobData(job) : 
        'Validation method not accessible';
      
      console.log(`📋 Job: "${job.title}"`);
      console.log(`   Company: "${job.company}"`);
      console.log(`   Valid: ${isValid}`);
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testInternshipCleanup();

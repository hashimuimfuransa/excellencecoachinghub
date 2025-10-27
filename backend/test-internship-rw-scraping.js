/**
 * Test script for internship.rw scraping service
 * Verifies the scraping functionality works correctly
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');

// Set up the path aliases to match TypeScript configuration
require('module-alias/register');
require('module-alias').addAlias('@', __dirname + '/src');

const InternshipRwScrapingService = require('./src/services/internshipRwScrapingService').default;
const { connectDatabase } = require('./src/utils/database');

async function testInternshipRwScraping() {
  console.log('🚀 Starting internship.rw scraping test...');
  
  try {
    // Connect to database first
    console.log('📊 Connecting to database...');
    await connectDatabase();
    console.log('✅ Database connected');

    // Test the scraping service
    console.log('🇷🇼 Starting internship.rw scraping...');
    const result = await InternshipRwScrapingService.scrapeInternshipOpportunities();

    console.log('\n📊 SCRAPING RESULTS:');
    console.log(`Jobs found: ${result.jobs.length}`);
    console.log(`Employer requests: ${result.employerRequests.length}`);
    console.log(`Errors: ${result.errors.length}`);

    // Display found jobs
    if (result.jobs.length > 0) {
      console.log('\n💼 FOUND JOBS:');
      result.jobs.forEach((job, index) => {
        console.log(`${index + 1}. ${job.title} at ${job.company}`);
        console.log(`   Location: ${job.location}`);
        console.log(`   Type: ${job.jobType} | Category: ${job.category || 'N/A'}`);
        console.log(`   URL: ${job.externalApplicationUrl}`);
        console.log(`   Description preview: ${job.description.substring(0, 100)}...`);
        console.log('   ---');
      });
    }

    // Display employer requests
    if (result.employerRequests.length > 0) {
      console.log('\n🏢 EMPLOYER REQUESTS:');
      result.employerRequests.forEach((request, index) => {
        console.log(`${index + 1}. ${request.jobTitle} at ${request.hiringCompanyName}`);
        console.log(`   Location: ${request.companyLocation}`);
        console.log(`   Qualification: ${request.requiredQualification}`);
        console.log(`   Field: ${request.requiredFieldOfStudy}`);
        console.log(`   Contact: ${request.contactEmail}`);
        console.log('   ---');
      });
    }

    // Display errors
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Test saving jobs to database
    if (result.jobs.length > 0) {
      console.log('\n💾 Testing database save...');
      const savedCount = await InternshipRwScrapingService.saveScrapedJobs(result.jobs);
      console.log(`✅ Saved ${savedCount} jobs to database`);
    }

    console.log('\n✅ Internship.rw scraping test completed successfully!');
    
    // Summary
    console.log('\n📋 SUMMARY:');
    console.log(`Total jobs discovered: ${result.jobs.length}`);
    console.log(`Employer requests found: ${result.employerRequests.length}`);
    console.log(`Errors encountered: ${result.errors.length}`);
    console.log(`Service status: ${result.jobs.length > 0 || result.employerRequests.length > 0 ? 'WORKING' : 'NEEDS ATTENTION'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    // Close database connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️ Process interrupted. Cleaning up...');
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(0);
});

// Run the test
testInternshipRwScraping().catch(console.error);
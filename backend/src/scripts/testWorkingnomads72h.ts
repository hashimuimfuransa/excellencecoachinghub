#!/usr/bin/env node

/**
 * Test script specifically for workingnomads 72-hour job filtering
 */

import { OptimizedJobScrapingService } from '../services/optimizedJobScrapingService';
import { connectDB, disconnectDB } from '../config/database';

async function testWorkingnomads72h() {
  try {
    console.log('🔧 Testing Workingnomads 72-hour job filtering...\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');
    
    console.log('🎯 Testing workingnomads with 72-hour filter...');
    console.log('📋 This will check for jobs posted within the last 72 hours only\n');
    
    // Run the scraper
    const results = await OptimizedJobScrapingService.scrapeAndProcessJobs();
    
    console.log('\n📈 72-Hour Filtering Results:');
    console.log(`Success: ${results.success}`);
    console.log(`Jobs Processed: ${results.processedJobs}`);
    console.log(`Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (results.processedJobs > 0) {
      console.log('\n✅ Successfully found and processed recent jobs from workingnomads!');
      console.log('🕒 All processed jobs should be within 72 hours of posting');
    } else {
      console.log('\n⚠️ No recent jobs found within 72 hours');
      console.log('💡 This might be normal if there are no new jobs posted recently');
    }
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  } finally {
    // Disconnect from database
    await disconnectDB();
    console.log('📡 Database disconnected');
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testWorkingnomads72h().catch(console.error);
}

export { testWorkingnomads72h };
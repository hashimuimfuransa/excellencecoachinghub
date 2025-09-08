#!/usr/bin/env node

/**
 * Test script for the new OptimizedJobScrapingService
 * Run this to verify the scraper is working correctly
 */

import { OptimizedJobScrapingService } from '../services/optimizedJobScrapingService';
import { connectDB, disconnectDB } from '../config/database';

async function testScraper() {
  try {
    console.log('🔧 Testing Optimized Job Scraping Service...\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');
    
    // Get current stats
    console.log('📊 Getting current scraping statistics...');
    const initialStats = await OptimizedJobScrapingService.getScrapingStats();
    console.log('Initial stats:', initialStats);
    console.log();
    
    // Run the scraper
    console.log('🚀 Starting scraping test...');
    const results = await OptimizedJobScrapingService.scrapeAndProcessJobs();
    
    console.log('\n📈 Scraping Results:');
    console.log(`Success: ${results.success}`);
    console.log(`Jobs Processed: ${results.processedJobs}`);
    console.log(`Errors: ${results.errors.length}`);
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // Get updated stats
    console.log('\n📊 Getting updated statistics...');
    const finalStats = await OptimizedJobScrapingService.getScrapingStats();
    console.log('Final stats:', finalStats);
    
    console.log('\n🎉 Test completed successfully!');
    
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
  testScraper().catch(console.error);
}

export { testScraper };
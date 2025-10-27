const { OptimizedJobScrapingService } = require('./src/services/optimizedJobScrapingService');

async function testMifotraScraping() {
  console.log('🔍 Testing Mifotra scraping...');
  
  try {
    const result = await OptimizedJobScrapingService.scrapeAndProcessJobs();
    
    console.log('📊 Scraping Results:');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📈 Jobs processed: ${result.processedJobs}`);
    console.log(`❌ Errors: ${result.errors ? result.errors.length : 0}`);
    
    if (result.errors && result.errors.length > 0) {
      console.log('🔍 Error details:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('✅ Mifotra scraping test completed');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testMifotraScraping();
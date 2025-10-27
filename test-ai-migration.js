/**
 * Test script to validate the new AI migration system
 * Run this to verify the Gemini AI integration works correctly
 */

const { JobScrapingService } = require('./backend/src/services/jobScrapingService');

async function testAIMigration() {
  console.log('🚀 Testing AI Migration System');
  console.log('=' .repeat(50));
  
  try {
    // Test AI integration
    console.log('\n📋 Running AI Integration Test...');
    const testResults = await JobScrapingService.testAIIntegration();
    
    console.log('\n📊 Test Results:');
    console.log(`Current Model: ${testResults.currentModel}`);
    console.log(`Overall Success: ${testResults.success ? '✅ PASS' : '❌ FAIL'}`);
    
    console.log('\n🔬 Individual Test Results:');
    Object.entries(testResults.testResults).forEach(([test, result]) => {
      console.log(`  ${test}: ${result ? '✅ PASS' : '❌ FAIL'}`);
    });
    
    if (testResults.errors.length > 0) {
      console.log('\n⚠️ Errors:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n📊 Model Statistics:');
    console.log(`Available Models: ${testResults.modelStats.availableModels?.length || 0}`);
    console.log(`Using Latest: ${testResults.modelStats.isLatest ? 'Yes' : 'No'}`);
    
    // Display migration guide
    console.log('\n📚 Migration Guide:');
    console.log(JobScrapingService.getAIMigrationGuide());
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testAIMigration();
}

module.exports = { testAIMigration };
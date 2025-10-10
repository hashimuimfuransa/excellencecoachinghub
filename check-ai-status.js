const { CentralAIManager } = require('./dist/services/centralAIManager');

async function checkAIStatus() {
  try {
    console.log('🔍 Checking AI Manager Status...');
    console.log('================================');
    
    const aiManager = CentralAIManager.getInstance();
    
    // Get API key statistics
    const stats = aiManager.getAPIKeyStats();
    console.log('📊 API Key Statistics:');
    console.log(`   Total Keys: ${stats.totalKeys}`);
    console.log(`   Active Keys: ${stats.activeKeys}`);
    console.log(`   Quota Exceeded Keys: ${stats.quotaExceededKeys}`);
    console.log(`   Failed Keys: ${stats.failedKeys}`);
    console.log(`   Blocked Keys: ${stats.blockedKeys}`);
    
    // Test a simple generation
    console.log('\n🧪 Testing AI Generation...');
    try {
      const result = await aiManager.generateContent('Hello, this is a test.', {
        maxTokens: 50,
        temperature: 0.1,
        retries: 1,
        timeout: 10000
      });
      
      console.log('✅ AI Generation Test Successful!');
      console.log(`   Response: "${result}"`);
      
    } catch (error) {
      console.log('❌ AI Generation Test Failed:');
      console.log(`   Error: ${error.message}`);
      
      if (error.message.includes('quota') || error.message.includes('429')) {
        console.log('🚫 This appears to be a quota limit issue!');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking AI status:', error.message);
  }
}

checkAIStatus();

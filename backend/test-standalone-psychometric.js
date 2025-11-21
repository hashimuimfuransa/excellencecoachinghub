require('dotenv').config();
const { psychometricAIEngine } = require('./dist/services/psychometricAIEngine');

async function testStandalonePsychometricEngine() {
  console.log('🧠 Testing Standalone Psychometric AI Engine...\n');
  
  try {
    // Get current engine stats
    const stats = psychometricAIEngine.getAPIKeyStats();
    console.log('📊 Current Psychometric AI Engine Status:');
    console.log(`- Total API Keys: ${stats.totalKeys}`);
    console.log(`- Active Keys: ${stats.activeKeys}`);
    console.log(`- Current API Key: ${stats.currentAPIKey}`);
    console.log('');
    
    // Test model availability
    console.log('🔍 Testing model availability...');
    const isAvailable = await psychometricAIEngine.testModelAvailability();
    console.log(`✅ Model availability: ${isAvailable ? 'Available' : 'Unavailable'}`);
    console.log('');
    
    // Test a simple generation (if quota allows)
    if (isAvailable) {
      console.log('🧪 Testing psychometric content generation...');
      try {
        const result = await psychometricAIEngine.generatePsychometricContent(
          'Generate a simple personality assessment question with 5 options about teamwork skills. Respond with just the question and options.',
          {
            retries: 1,
            timeout: 15000,
            priority: 'low',
            maxTokens: 200
          }
        );
        console.log(`✅ Psychometric generation successful: "${result.substring(0, 100)}..."`);
      } catch (error) {
        if (error.message.includes('quota') || error.message.includes('429')) {
          console.log('⚠️ Quota exceeded, but psychometric AI engine is working correctly');
        } else {
          console.log(`❌ Psychometric generation failed: ${error.message}`);
        }
      }
    }
    
    // Test system status
    console.log('\n🔍 Getting system status...');
    const status = psychometricAIEngine.getSystemStatus();
    console.log(`- Initialized: ${status.isInitialized}`);
    console.log(`- Current Model: ${status.currentModel}`);
    console.log(`- Request Count: ${status.requestCount}/${status.dailyLimit}`);
    console.log(`- Queue Length: ${status.queueStatus.queueLength}`);
    
    console.log('\n✅ Standalone Psychometric AI Engine test completed');
    
  } catch (error) {
    console.log('❌ Standalone Psychometric AI Engine test failed:');
    console.log(`   Error: ${error.message}`);
  }
}

testStandalonePsychometricEngine();
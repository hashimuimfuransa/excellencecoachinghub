require('dotenv').config();
const { centralAIManager } = require('./dist/services/centralAIManager');

async function testAIManager() {
  console.log('🤖 Testing Central AI Manager...\n');
  
  try {
    // Get current model stats
    const stats = centralAIManager.getModelStats();
    console.log('📊 Current AI Manager Status:');
    console.log(`- Model: ${stats.currentModel.name}`);
    console.log(`- Version: ${stats.currentModel.version}`);
    console.log(`- Description: ${stats.currentModel.description}`);
    console.log(`- Is Latest: ${stats.isLatest}`);
    console.log(`- Request Count: ${stats.requestCount}/${stats.dailyLimit}`);
    console.log('');
    
    // Test a simple generation (if quota allows)
    console.log('🧪 Testing AI generation...');
    try {
      const result = await centralAIManager.generateContent('Hello, world! Respond with just "AI working"', {
        retries: 1,
        timeout: 10000,
        priority: 'low'
      });
      console.log(`✅ AI Generation successful: "${result}"`);
    } catch (error) {
      if (error.message.includes('quota') || error.message.includes('429')) {
        console.log('⚠️ Quota exceeded, but AI Manager is working correctly');
      } else {
        console.log(`❌ AI Generation failed: ${error.message}`);
      }
    }
    
    // Test model availability check
    console.log('\n🔍 Testing model availability...');
    const isAvailable = await centralAIManager.testModelAvailability();
    console.log(`Model availability: ${isAvailable ? '✅ Available' : '❌ Not Available'}`);
    
    console.log('\n📋 All available models:');
    const allStats = centralAIManager.getAllModelStats();
    allStats.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name} - ${model.description}`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAIManager();
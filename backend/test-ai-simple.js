const { CentralAIManager } = require('./dist/services/centralAIManager');

async function testAIGeneration() {
  try {
    console.log('🧪 Testing AI Generation...');
    console.log('==========================');
    
    const aiManager = CentralAIManager.getInstance();
    
    // Test a simple generation
    console.log('📝 Sending test request...');
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
    } else if (error.message.includes('Invalid value') || error.message.includes('scalar field')) {
      console.log('🔧 This appears to be a data format issue!');
    }
  }
}

testAIGeneration();

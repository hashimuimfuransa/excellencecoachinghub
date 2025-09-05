require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  // Test model names based on Google's current API
  const modelsToTest = [
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro', // Old deprecated model
    'gemini-1.5-pro-latest', // Incorrect name we were using
    'gemini-1.5-flash-latest' // Incorrect name we were using
  ];
  
  console.log('🔍 Testing available Gemini models...\n');
  
  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      // Try to generate a simple test response
      const result = await model.generateContent('Hello, world!');
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName}: Working! Response: "${text.substring(0, 50)}..."`);
    } catch (error) {
      const errorMsg = error.message || error.toString();
      if (errorMsg.includes('404') || errorMsg.includes('not found')) {
        console.log(`❌ ${modelName}: Model not found (404)`);
      } else if (errorMsg.includes('429') || errorMsg.includes('quota')) {
        console.log(`⚠️ ${modelName}: Quota exceeded (429) - but model exists`);
      } else {
        console.log(`⚠️ ${modelName}: Error - ${errorMsg.substring(0, 100)}...`);
      }
    }
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log(''); // Empty line for readability
  }
  
  console.log('\n📊 Test completed. Use the models marked with ✅ or ⚠️ (quota exceeded).');
}

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is not set');
  console.log('Please set your API key: set GEMINI_API_KEY=your_api_key_here');
} else {
  testModels().catch(console.error);
}
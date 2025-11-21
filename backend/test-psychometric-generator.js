require('dotenv').config();
const { psychometricTestGenerator } = require('./dist/services/psychometricTestGenerator');

async function testPsychometricTestGenerator() {
  console.log('🧠 Testing Standalone Psychometric Test Generator...\n');
  
  try {
    // Test system status
    console.log('🔍 Getting system status...');
    const status = psychometricTestGenerator.getSystemStatus();
    console.log(`- Initialized: ${status.isInitialized}`);
    console.log(`- Current Model: ${status.currentModel}`);
    console.log(`- Request Count: ${status.requestCount}/${status.dailyLimit}`);
    console.log('');
    
    // Test availability
    console.log('🔍 Testing generator availability...');
    const isAvailable = await psychometricTestGenerator.isAvailable();
    console.log(`✅ Generator availability: ${isAvailable ? 'Available' : 'Unavailable'}`);
    console.log('');
    
    // Test fallback question generation
    if (!isAvailable) {
      console.log('🧪 Testing fallback question generation...');
      const fallbackTest = await psychometricTestGenerator.generateFallbackQuestions({
        jobTitle: 'Software Developer',
        questionCount: 5,
        testLevel: 'intermediate',
        categories: ['teamwork', 'problem_solving']
      });
      
      console.log(`✅ Fallback generation successful:`);
      console.log(`   - Title: ${fallbackTest.title}`);
      console.log(`   - Questions: ${fallbackTest.questions.length}`);
      console.log(`   - Time Limit: ${fallbackTest.timeLimit} minutes`);
      console.log(`   - Categories: ${fallbackTest.categories.join(', ')}`);
      console.log(`   - Sample Question: ${fallbackTest.questions[0].question}`);
    }
    
    console.log('\n✅ Standalone Psychometric Test Generator test completed');
    
  } catch (error) {
    console.log('❌ Standalone Psychometric Test Generator test failed:');
    console.log(`   Error: ${error.message}`);
  }
}

testPsychometricTestGenerator();
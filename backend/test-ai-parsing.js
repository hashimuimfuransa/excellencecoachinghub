// Quick test to verify AI JSON parsing fix
const { AIService } = require('./dist/services/aiService');

async function testJsonParsing() {
  const aiService = new AIService();
  
  // Test cases for different JSON response formats
  const testCases = [
    '{"score": 8, "feedback": "Good answer"}',
    '```json\n{"score": 8, "feedback": "Good answer"}\n```',
    '```\n{"score": 8, "feedback": "Good answer"}\n```',
    'Here is the result:\n```json\n{"score": 8, "feedback": "Good answer"}\n```\nThat\'s the evaluation.'
  ];
  
  console.log('Testing AI JSON parsing...');
  
  for (let i = 0; i < testCases.length; i++) {
    try {
      const result = aiService.extractJsonFromResponse(testCases[i]);
      console.log(`✅ Test ${i + 1} passed:`, result);
    } catch (error) {
      console.log(`❌ Test ${i + 1} failed:`, error.message);
    }
  }
}

testJsonParsing().catch(console.error);
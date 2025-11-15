// Test script to verify level and language filters are working correctly
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-jwt-token-here'; // Replace with a valid JWT token

// Test data
const testFilters = [
  { level: 'p1', language: 'english' },
  { level: 'p2', language: 'french' },
  { level: 'nursery-1', language: 'kinyarwanda' },
  { level: '', language: 'english' }, // Test with only language filter
  { level: 'p1', language: '' }, // Test with only level filter
];

async function testHomeworkFilters() {
  console.log('🧪 Testing Homework Filters...\n');
  
  try {
    for (const filter of testFilters) {
      console.log(`🔍 Testing filter: Level="${filter.level}", Language="${filter.language}"`);
      
      // Build query string
      const queryParams = new URLSearchParams();
      if (filter.level) queryParams.append('level', filter.level);
      if (filter.language) queryParams.append('language', filter.language);
      
      const url = `${BASE_URL}/homework-new${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      try {
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Success: ${response.data.count} homework items returned`);
        
        // Log first few items for verification
        if (response.data.data && response.data.data.length > 0) {
          console.log(`📝 Sample items:`);
          response.data.data.slice(0, 2).forEach((item, index) => {
            console.log(`  ${index + 1}. "${item.title}" - Level: ${item.level}, Language: ${item.language}`);
          });
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.response?.data?.message || error.message}`);
      }
      
      console.log('---\n');
    }
    
    console.log('🏁 Filter testing completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
  }
}

// Run the test
testHomeworkFilters();
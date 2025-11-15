const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjNmYjQ3YjYwYjQ3YjYwYjQ3YjYwYjQ3YiIsInJvbGUiOiJzdHVkZW50In0sImlhdCI6MTY3NzAwMDAwMCwiZXhwIjoxNjc3MDg2NDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'; // Replace with a valid token

// Test data
const testHomework = [
  {
    title: 'Math Homework - P1 English',
    description: 'Basic math problems for P1 students',
    level: 'p1',
    language: 'english',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    maxPoints: 10,
    status: 'published',
    extractedQuestions: []
  },
  {
    title: 'Science Homework - P2 French',
    description: 'Science experiments for P2 students',
    level: 'p2',
    language: 'french',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    maxPoints: 15,
    status: 'published',
    extractedQuestions: []
  },
  {
    title: 'Reading Homework - Nursery 1 Kinyarwanda',
    description: 'Reading exercises for Nursery 1 students',
    level: 'nursery-1',
    language: 'kinyarwanda',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    maxPoints: 8,
    status: 'published',
    extractedQuestions: []
  }
];

async function testHomeworkFiltering() {
  try {
    console.log('Testing homework filtering...\n');
    
    // First, create some test homework
    console.log('1. Creating test homework...');
    for (const homework of testHomework) {
      try {
        await axios.post(`${API_BASE_URL}/homework-new`, homework, {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`   ✅ Created: ${homework.title}`);
      } catch (error) {
        console.log(`   ❌ Failed to create: ${homework.title}`);
      }
    }
    
    // Test 1: Get all homework (no filters)
    console.log('\n2. Testing: Get all homework (no filters)');
    try {
      const response = await axios.get(`${API_BASE_URL}/homework-new`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log(`   ✅ Success: Found ${response.data.count} homework items`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 2: Filter by level 'p1'
    console.log('\n3. Testing: Filter by level "p1"');
    try {
      const response = await axios.get(`${API_BASE_URL}/homework-new?level=p1`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log(`   ✅ Success: Found ${response.data.count} homework items with level "p1"`);
      response.data.data.forEach(hw => console.log(`      - ${hw.title}`));
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 3: Filter by language 'french'
    console.log('\n4. Testing: Filter by language "french"');
    try {
      const response = await axios.get(`${API_BASE_URL}/homework-new?language=french`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log(`   ✅ Success: Found ${response.data.count} homework items with language "french"`);
      response.data.data.forEach(hw => console.log(`      - ${hw.title}`));
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
    }
    
    // Test 4: Filter by both level and language
    console.log('\n5. Testing: Filter by level "nursery-1" and language "kinyarwanda"');
    try {
      const response = await axios.get(`${API_BASE_URL}/homework-new?level=nursery-1&language=kinyarwanda`, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`
        }
      });
      console.log(`   ✅ Success: Found ${response.data.count} homework items with level "nursery-1" and language "kinyarwanda"`);
      response.data.data.forEach(hw => console.log(`      - ${hw.title}`));
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
    }
    
    console.log('\n🎉 Homework filtering tests completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error);
  }
}

// Run the test
testHomeworkFiltering();
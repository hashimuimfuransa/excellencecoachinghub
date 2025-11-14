// Test script to verify homework creation without course ID
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Adjust to your backend URL
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with a valid teacher JWT token

// Test data
const testData = {
  title: 'Test Homework Without Course',
  description: 'This is a test homework that should be created without requiring a course ID',
  instructions: 'Complete the interactive homework assignment',
  dueDate: '2025-12-31',
  level: 'p1',
  language: 'english',
  maxPoints: 10,
  submissionType: 'text',
  isRequired: true,
  status: 'published',
  autoGrading: true,
  interactiveElements: [
    {
      id: '1',
      type: 'quiz',
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      points: 5
    },
    {
      id: '2',
      type: 'text',
      question: 'Explain what you learned today',
      points: 5
    }
  ]
};

async function testHomeworkCreation() {
  try {
    console.log('Testing homework creation without course ID...');
    
    const response = await axios.post(`${API_BASE_URL}/homework-new`, testData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Homework created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('❌ Error creating homework:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
    throw error;
  }
}

// Run the test
testHomeworkCreation()
  .then(() => console.log('Test completed successfully'))
  .catch(err => console.error('Test failed:', err));
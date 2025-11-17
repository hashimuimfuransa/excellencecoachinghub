// Test script to verify interactive homework functionality
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Adjust to your backend URL
const TEST_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // Replace with a valid teacher JWT token

// Test data with all question types
const testData = {
  title: 'Comprehensive Interactive Homework Test',
  description: 'Testing all interactive question types',
  instructions: 'Complete the interactive homework assignment',
  dueDate: '2025-12-31',
  level: 'p1',
  language: 'english',
  maxPoints: 25,
  submissionType: 'text',
  isRequired: true,
  status: 'published',
  autoGrading: true,
  extractedQuestions: [
    {
      question: 'What is 2 + 2?',
      type: 'multiple-choice',
      options: ['3', '4', '5', '6'],
      correctAnswer: '4',
      points: 5,
      aiExtracted: true
    },
    {
      question: 'Explain photosynthesis in your own words',
      type: 'short-answer',
      correctAnswer: '',
      points: 5,
      aiExtracted: true
    },
    {
      question: 'Match the animals to their habitats',
      type: 'matching',
      leftItems: ['Bird', 'Fish', 'Bear'],
      rightItems: ['Nest', 'Ocean', 'Forest'],
      correctMatches: {
        'Bird': 'Nest',
        'Fish': 'Ocean',
        'Bear': 'Forest'
      },
      points: 5,
      aiExtracted: true
    },
    {
      question: 'The Earth is flat',
      type: 'true-false',
      correctAnswer: 'false',
      points: 2,
      aiExtracted: true
    },
    {
      question: 'The capital of France is _____',
      type: 'fill-in-blank',
      correctAnswer: ['Paris'],
      caseSensitive: false,
      points: 3,
      aiExtracted: true
    },
    {
      question: 'Order these planets from closest to farthest from the Sun',
      type: 'ordering',
      options: ['Mercury', 'Venus', 'Earth', 'Mars'],
      correctAnswer: ['Mercury', 'Venus', 'Earth', 'Mars'],
      points: 5,
      aiExtracted: true
    }
  ]
};

async function testHomeworkCreation() {
  try {
    console.log('Testing homework creation with all question types...');
    
    const response = await axios.post(`${API_BASE_URL}/homework-new`, testData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Homework creation response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Homework created successfully!');
      console.log('Homework ID:', response.data.data._id);
      return response.data.data._id;
    } else {
      console.error('❌ Homework creation failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error creating homework:', error.response?.data || error.message);
    return null;
  }
}

async function testHomeworkRetrieval(homeworkId) {
  try {
    console.log('\nTesting homework retrieval...');
    
    const response = await axios.get(`${API_BASE_URL}/homework-new/${homeworkId}`);
    
    console.log('Homework retrieval response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Homework retrieved successfully!');
      console.log('Questions count:', response.data.data.extractedQuestions?.length);
      
      // Verify all question types are present
      const questions = response.data.data.extractedQuestions || [];
      const questionTypes = questions.map(q => q.type);
      console.log('Question types found:', [...new Set(questionTypes)]);
      
      return response.data.data;
    } else {
      console.error('❌ Homework retrieval failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error retrieving homework:', error.response?.data || error.message);
    return null;
  }
}

async function testHomeworkSubmission(homeworkId) {
  try {
    console.log('\nTesting homework submission...');
    
    const submissionData = {
      answers: [
        {
          questionIndex: 0,
          answer: '4',
          questionType: 'multiple-choice'
        },
        {
          questionIndex: 1,
          answer: 'Photosynthesis is the process by which plants convert sunlight into energy.',
          questionType: 'short-answer'
        },
        {
          questionIndex: 2,
          answer: {
            matches: {
              'left-0': 'right-0', // Bird -> Nest
              'left-1': 'right-1', // Fish -> Ocean
              'left-2': 'right-2'  // Bear -> Forest
            }
          },
          questionType: 'matching'
        },
        {
          questionIndex: 3,
          answer: 'false',
          questionType: 'true-false'
        },
        {
          questionIndex: 4,
          answer: 'Paris',
          questionType: 'fill-in-blank'
        },
        {
          questionIndex: 5,
          answer: ['Mercury', 'Venus', 'Earth', 'Mars'],
          questionType: 'ordering'
        }
      ],
      isDraft: false
    };
    
    const response = await axios.post(`${API_BASE_URL}/homework-new/${homeworkId}/submit`, submissionData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Submission response:', response.data);
    
    if (response.data.success) {
      console.log('✅ Homework submitted successfully!');
      return response.data.data;
    } else {
      console.error('❌ Homework submission failed:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Error submitting homework:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Interactive Homework Tests\n');
  
  // Test 1: Create homework
  const homeworkId = await testHomeworkCreation();
  if (!homeworkId) {
    console.log('❌ Tests failed: Could not create homework');
    return;
  }
  
  // Test 2: Retrieve homework
  const homeworkData = await testHomeworkRetrieval(homeworkId);
  if (!homeworkData) {
    console.log('❌ Tests failed: Could not retrieve homework');
    return;
  }
  
  // Test 3: Submit homework
  const submissionData = await testHomeworkSubmission(homeworkId);
  if (!submissionData) {
    console.log('❌ Tests failed: Could not submit homework');
    return;
  }
  
  console.log('\n✅ All tests completed successfully!');
  console.log('📋 Summary:');
  console.log(`   - Created homework with ID: ${homeworkId}`);
  console.log(`   - Verified ${homeworkData.extractedQuestions?.length || 0} questions`);
  console.log(`   - Submitted homework with ${submissionData.extractedAnswers?.length || 0} answers`);
}

// Run the tests
runTests();
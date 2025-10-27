const axios = require('axios');

// Test script for Week Feedback API endpoints
const BASE_URL = 'http://localhost:5000/api'; // Adjust based on your backend port

// Mock authentication token (you'll need to get a real one)
const AUTH_TOKEN = 'your-auth-token-here';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

async function testWeekFeedbackAPI() {
  console.log('🧪 Testing Week Feedback API Endpoints...\n');

  try {
    // Test 1: Submit week feedback
    console.log('1. Testing submit week feedback...');
    const feedbackData = {
      weekId: '64a1b2c3d4e5f6789012345', // Mock week ID
      courseId: '64a1b2c3d4e5f6789012346', // Mock course ID
      overallRating: 4,
      contentQuality: 4,
      difficultyLevel: 'just_right',
      paceRating: 3,
      instructorRating: 5,
      materialsRating: 4,
      comments: 'Great week! The content was well-structured and easy to follow.',
      suggestions: 'Maybe add more interactive exercises.',
      wouldRecommend: true,
      favoriteAspects: ['Clear explanations', 'Practical examples'],
      challenges: ['Too much content'],
      timeSpent: 45,
      completedMaterials: 5,
      totalMaterials: 5
    };

    try {
      const submitResponse = await api.post('/week-feedback/week-end', feedbackData);
      console.log('✅ Submit feedback:', submitResponse.data);
    } catch (error) {
      console.log('❌ Submit feedback failed:', error.response?.data || error.message);
    }

    // Test 2: Get week feedback
    console.log('\n2. Testing get week feedback...');
    try {
      const getResponse = await api.get('/week-feedback/week/64a1b2c3d4e5f6789012345');
      console.log('✅ Get week feedback:', getResponse.data);
    } catch (error) {
      console.log('❌ Get week feedback failed:', error.response?.data || error.message);
    }

    // Test 3: Get week feedback stats
    console.log('\n3. Testing get week feedback stats...');
    try {
      const statsResponse = await api.get('/week-feedback/week/64a1b2c3d4e5f6789012345/stats');
      console.log('✅ Get week feedback stats:', statsResponse.data);
    } catch (error) {
      console.log('❌ Get week feedback stats failed:', error.response?.data || error.message);
    }

    // Test 4: Get course feedback
    console.log('\n4. Testing get course feedback...');
    try {
      const courseResponse = await api.get('/week-feedback/course/64a1b2c3d4e5f6789012346');
      console.log('✅ Get course feedback:', courseResponse.data);
    } catch (error) {
      console.log('❌ Get course feedback failed:', error.response?.data || error.message);
    }

    // Test 5: Check if user has submitted feedback
    console.log('\n5. Testing check feedback submission...');
    try {
      const checkResponse = await api.get('/week-feedback/week/64a1b2c3d4e5f6789012345/user/64a1b2c3d4e5f6789012347/exists');
      console.log('✅ Check feedback submission:', checkResponse.data);
    } catch (error) {
      console.log('❌ Check feedback submission failed:', error.response?.data || error.message);
    }

    // Test 6: Get user feedback history
    console.log('\n6. Testing get user feedback history...');
    try {
      const historyResponse = await api.get('/week-feedback/user/64a1b2c3d4e5f6789012347');
      console.log('✅ Get user feedback history:', historyResponse.data);
    } catch (error) {
      console.log('❌ Get user feedback history failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🏁 Week Feedback API testing completed!');
}

// Run the tests
testWeekFeedbackAPI();

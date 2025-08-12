const axios = require('axios');

// Test the recording flow
async function testRecordingFlow() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🧪 Testing recording flow...');
    
    // Test getting recordings for students (this should work without auth for testing)
    console.log('📹 Testing get recordings endpoint...');
    
    const response = await axios.get(`${baseURL}/student/live-sessions/recordings`, {
      headers: {
        'Authorization': 'Bearer YOUR_TEST_TOKEN_HERE' // Replace with actual token
      }
    });
    
    console.log('✅ Recordings endpoint response:', response.data);
    
  } catch (error) {
    console.error('❌ Error testing recording flow:', error.response?.data || error.message);
  }
}

// Run the test
testRecordingFlow();
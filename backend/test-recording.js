const axios = require('axios');

// Test the recording stop endpoint
async function testRecordingStop() {
  try {
    console.log('🧪 Testing recording stop endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/video/recording/stop', {
      sessionId: '507f1f77bcf86cd799439011', // Mock session ID
      roomId: 'test-room-123',
      recordingId: 'test-recording-456'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real token
      }
    });

    console.log('✅ Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Test the session end endpoint
async function testSessionEnd() {
  try {
    console.log('🧪 Testing session end endpoint...');
    
    const response = await axios.post('http://localhost:5000/api/live-sessions/end', {
      sessionId: '507f1f77bcf86cd799439011',
      roomId: 'test-room-123',
      startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      endTime: new Date().toISOString(),
      attendance: [
        { peerId: 'peer1', joinTime: new Date(Date.now() - 3600000), duration: 3600 },
        { peerId: 'peer2', joinTime: new Date(Date.now() - 1800000), duration: 1800 }
      ],
      recordingId: 'test-recording-456',
      participants: [
        { id: 'peer1', name: 'Teacher' },
        { id: 'peer2', name: 'Student' }
      ]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real token
      }
    });

    console.log('✅ Response:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Error Response:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Run tests
console.log('🚀 Starting API tests...');
testRecordingStop();
setTimeout(() => testSessionEnd(), 1000);
const axios = require('axios');

async function testAPI() {
  try {
    const courseId = '68937dcc7fd4938812659c36';
    
    // First, let's get a student token by logging in
    console.log('🔐 Logging in as student...');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'saudausanase@gmail.com',
      password: 'password123' // Assuming this is the password
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful, got token');
    
    // Now test the course notes API
    console.log('\n📚 Testing course notes API...');
    
    const notesResponse = await axios.get(`http://localhost:5000/api/course-notes/course/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ API call successful!');
    console.log('Response:', JSON.stringify(notesResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testAPI();
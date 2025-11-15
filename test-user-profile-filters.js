// Test script to verify user profile level and language preferences are saved and retrieved correctly
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_TOKEN = 'your-test-jwt-token-here'; // Replace with a valid JWT token

async function testUserProfileFilters() {
  console.log('🧪 Testing User Profile Level and Language Preferences...\n');
  
  try {
    // 1. Get current user profile
    console.log('👤 Getting current user profile...');
    const getProfileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Current profile retrieved:`);
    console.log(`  Name: ${getProfileResponse.data.data.user.firstName} ${getProfileResponse.data.data.user.lastName}`);
    console.log(`  Level: ${getProfileResponse.data.data.user.level || 'Not set'}`);
    console.log(`  Language: ${getProfileResponse.data.data.user.language || 'Not set'}`);
    console.log('---\n');
    
    // 2. Update user profile with new level and language preferences
    console.log('📝 Updating user profile with new preferences...');
    const updateData = {
      level: 'p3',
      language: 'french'
    };
    
    const updateProfileResponse = await axios.post(`${BASE_URL}/auth/update-profile`, updateData, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Profile updated successfully:`);
    console.log(`  New Level: ${updateProfileResponse.data.data.user.level}`);
    console.log(`  New Language: ${updateProfileResponse.data.data.user.language}`);
    console.log('---\n');
    
    // 3. Verify the update by getting the profile again
    console.log('🔍 Verifying profile update...');
    const verifyResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Verified profile:`);
    console.log(`  Level: ${verifyResponse.data.data.user.level}`);
    console.log(`  Language: ${verifyResponse.data.data.user.language}`);
    
    if (verifyResponse.data.data.user.level === updateData.level && 
        verifyResponse.data.data.user.language === updateData.language) {
      console.log('✅ Profile preferences updated and verified successfully!');
    } else {
      console.log('❌ Profile preferences verification failed!');
    }
    console.log('---\n');
    
    // 4. Test homework filtering with user preferences
    console.log('📚 Testing homework filtering with user preferences...');
    const homeworkResponse = await axios.get(`${BASE_URL}/homework-new?level=${updateData.level}&language=${updateData.language}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Homework filtered by user preferences:`);
    console.log(`  Found ${homeworkResponse.data.count} homework items`);
    
    if (homeworkResponse.data.data && homeworkResponse.data.data.length > 0) {
      console.log(`📝 Sample items:`);
      homeworkResponse.data.data.slice(0, 2).forEach((item, index) => {
        console.log(`  ${index + 1}. "${item.title}" - Level: ${item.level}, Language: ${item.language}`);
      });
    }
    
    console.log('---\n');
    
    console.log('🏁 User profile and filtering test completed!');
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.response?.data?.message || error.message);
  }
}

// Run the test
testUserProfileFilters();
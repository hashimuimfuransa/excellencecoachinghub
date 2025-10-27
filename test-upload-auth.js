#!/usr/bin/env node

/**
 * Test script to debug upload authentication issues
 * Run this script to test the upload endpoint directly
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

async function testUploadAuth() {
  console.log('🧪 Testing Upload Authentication...\n');

  // Test 1: Upload without token
  console.log('Test 1: Upload without authentication token');
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(__filename), 'test-file.js');
    formData.append('folder', 'test-uploads');

    const response = await axios.post(`${API_BASE_URL}/upload/material`, formData, {
      headers: formData.getHeaders(),
    });
    
    console.log('❌ Unexpected success without token:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected without token (401)');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
    }
  }

  // Test 2: Upload with invalid token
  console.log('\nTest 2: Upload with invalid token');
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(__filename), 'test-file.js');
    formData.append('folder', 'test-uploads');

    const response = await axios.post(`${API_BASE_URL}/upload/material`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer invalid-token-123'
      },
    });
    
    console.log('❌ Unexpected success with invalid token:', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Correctly rejected with invalid token (401)');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
    }
  }

  // Test 3: Check if endpoint exists
  console.log('\nTest 3: Check if upload endpoint exists');
  try {
    const response = await axios.get(`${API_BASE_URL}/upload/material`);
    console.log('❌ GET request should not be allowed:', response.status);
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('✅ Endpoint exists but GET not allowed (404)');
    } else if (error.response?.status === 405) {
      console.log('✅ Endpoint exists but GET method not allowed (405)');
    } else {
      console.log('❌ Unexpected error:', error.response?.status, error.response?.data);
    }
  }

  console.log('\n🔍 To test with a valid token:');
  console.log('1. Log in to the application');
  console.log('2. Open browser dev tools');
  console.log('3. Copy the token from localStorage');
  console.log('4. Run: node test-upload-auth.js --token YOUR_TOKEN_HERE');
}

// Handle command line token
const args = process.argv.slice(2);
const tokenIndex = args.indexOf('--token');
if (tokenIndex !== -1 && args[tokenIndex + 1]) {
  const token = args[tokenIndex + 1];
  
  console.log('🧪 Testing Upload with provided token...\n');
  
  (async () => {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(__filename), 'test-file.js');
      formData.append('folder', 'test-uploads');

      const response = await axios.post(`${API_BASE_URL}/upload/material`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
      });
      
      console.log('✅ Upload successful with valid token!');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Upload failed with valid token:');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
    }
  })();
} else {
  testUploadAuth();
}

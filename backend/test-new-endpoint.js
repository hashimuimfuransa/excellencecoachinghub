const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Test the new synchronous extraction endpoint directly
const testNewEndpoint = async () => {
  try {
    console.log('🧪 Testing new synchronous extraction endpoint...');
    
    // Get a valid teacher token (you'll need to get this from the frontend localStorage or login)
    const token = 'your-teacher-token-here'; // Replace with actual token
    
    // Create a test file buffer (dummy PDF content)
    const testContent = `
    📄 ICT EXAM PAPER (STUDENT VERSION)
    Subject: ICT
    Duration: 45 Minutes
    Total Marks: 25
    
    Section A: Multiple Choice Questions (5 × 2 = 10 Marks)
    
    1. What does HTTP stand for?
    A) HyperText Transfer Protocol
    B) HyperText Transfer Process
    C) HyperText Transmission Protocol
    D) HyperText Transport Protocol
    
    2. Which of the following is NOT a programming language?
    A) Python
    B) JavaScript
    C) HTML
    D) Java
    
    Section B: Short Answer Questions (3 × 5 = 15 Marks)
    
    3. Explain what a database is and give two examples.
    
    4. What is the difference between RAM and ROM?
    
    5. List three advantages of cloud computing.
    `;
    
    // Create form data
    const form = new FormData();
    form.append('document', Buffer.from(testContent), {
      filename: 'test-ict-exam.txt',
      contentType: 'text/plain'
    });
    
    const assignmentId = '68a04754c497b840ad727cb9'; // Use the problematic assignment
    
    console.log(`📤 Calling POST /api/assignments/${assignmentId}/extract-sync`);
    
    const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}/extract-sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    console.log(`📨 Response status: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    console.log('📋 Response:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('✅ SUCCESS! New synchronous endpoint works correctly');
      console.log(`🎯 Extracted ${result.data?.extractedQuestions || 0} questions`);
    } else {
      console.log('❌ FAILED! Endpoint returned error:', result.error);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running on port 5000');
    } else if (error.message.includes('404')) {
      console.log('❌ Endpoint /extract-sync not found - route not registered');
    } else {
      console.log('❌ Test failed:', error.message);
    }
  }
};

// Alternative test without auth for route existence
const testRouteExists = async () => {
  try {
    console.log('🔍 Testing if route exists (without auth)...');
    
    const assignmentId = '68a04754c497b840ad727cb9';
    const response = await fetch(`http://localhost:5000/api/assignments/${assignmentId}/extract-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    console.log(`📨 Response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 404) {
      console.log('❌ Route /extract-sync NOT FOUND - endpoint not registered');
    } else if (response.status === 401) {
      console.log('✅ Route EXISTS but requires authentication (expected)');
    } else {
      console.log('🤔 Route exists, unexpected status:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Route test failed:', error.message);
  }
};

// Run tests
console.log('Starting endpoint tests...\n');
testRouteExists().then(() => {
  console.log('\nNote: To test with authentication, get a valid teacher token from the frontend and replace the token variable in testNewEndpoint()');
});
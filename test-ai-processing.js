// Test script to manually trigger AI processing for the stuck assignment
const fetch = require('node-fetch'); // You may need to install: npm install node-fetch

const API_BASE = 'http://localhost:5000/api';
const ASSIGNMENT_ID = '68a028f32eb500eb06c960e3'; // The assignment ID from the logs

async function testManualAIProcessing() {
  console.log('🧪 Testing Manual AI Processing...');
  console.log('Assignment ID:', ASSIGNMENT_ID);
  
  try {
    // First, check current status
    console.log('\n1. Checking current assignment status...');
    const statusResponse = await fetch(`${API_BASE}/assignments/${ASSIGNMENT_ID}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here if needed
        // 'Authorization': 'Bearer your-token-here'
      }
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      const assignment = statusData.data;
      
      console.log('Current Status:', {
        aiProcessingStatus: assignment.aiProcessingStatus,
        aiExtractionStatus: assignment.aiExtractionStatus,
        hasQuestions: assignment.hasQuestions,
        questionsCount: assignment.questions?.length || 0,
        extractedQuestionsCount: assignment.extractedQuestions?.length || 0
      });
    }
    
    // Trigger manual AI processing
    console.log('\n2. Triggering manual AI processing...');
    const response = await fetch(`${API_BASE}/assignments/${ASSIGNMENT_ID}/debug-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add your auth token here if needed
        // 'Authorization': 'Bearer your-token-here'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Manual processing result:', {
        success: data.success,
        message: data.message,
        questionsExtracted: data.data?.questionsExtracted || 0
      });
      
      if (data.success) {
        console.log('\n🎉 AI processing completed successfully!');
        console.log('Questions extracted:', data.data.questionsExtracted);
        console.log('\nNow try accessing the assignment in the Take Exam page.');
      }
    } else {
      const errorData = await response.json();
      console.error('❌ Manual processing failed:', {
        status: response.status,
        error: errorData.error,
        details: errorData.details
      });
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testManualAIProcessing();
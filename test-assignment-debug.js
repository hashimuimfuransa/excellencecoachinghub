// Simple test script to check assignment processing
const API_BASE = 'http://localhost:5000/api';

async function testAssignmentProcessing() {
  console.log('🧪 Testing Assignment Processing...');
  
  // Replace with your actual assignment ID from the logs
  const assignmentId = '68a028f32eb500eb06c960e3';
  
  try {
    const response = await fetch(`${API_BASE}/assignments/${assignmentId}`, {
      headers: {
        'Content-Type': 'application/json',
        // Add auth token if needed
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const assignment = data.data;
      
      console.log('📋 Assignment Debug Info:');
      console.log('  Title:', assignment.title);
      console.log('  Has Questions:', assignment.hasQuestions);
      console.log('  Questions Count:', assignment.questions?.length || 0);
      console.log('  Extracted Questions Count:', assignment.extractedQuestions?.length || 0);
      console.log('  AI Processing Status:', assignment.aiProcessingStatus);
      console.log('  AI Extraction Status:', assignment.aiExtractionStatus);
      console.log('  Has Document:', !!assignment.assignmentDocument);
      console.log('  Document Name:', assignment.assignmentDocument?.originalName);
      
      if (assignment.extractedQuestions && assignment.extractedQuestions.length > 0) {
        console.log('  Sample Question:', {
          question: assignment.extractedQuestions[0].question.substring(0, 100) + '...',
          type: assignment.extractedQuestions[0].type,
          options: assignment.extractedQuestions[0].options?.length || 0
        });
      }
      
      if (assignment.aiProcessingStatus === 'pending') {
        console.log('⏳ Still processing... try again in a few seconds');
      } else if (assignment.aiProcessingStatus === 'completed') {
        console.log('✅ Processing completed successfully!');
      } else if (assignment.aiProcessingStatus === 'failed') {
        console.log('❌ Processing failed:', assignment.aiProcessingError);
      }
    } else {
      console.error('❌ Failed to fetch assignment:', response.status);
    }
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testAssignmentProcessing();
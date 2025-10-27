// Simple test script to verify psychometric test grading
const axios = require('axios');

async function testPsychometricGrading() {
  try {
    console.log('Testing psychometric test grading fix...\n');

    // Mock test data similar to what the frontend would send
    const testData = {
      answers: {
        q1: 'Data Collection',
        q2: 'Strongly Agree',
        q3: '4',
        q4: 'Organizing community meetings and gathering feedback through surveys',
        q5: 'True'
      },
      jobId: '68a5848919ebbcddadeb1420', // Use a valid ObjectId
      timeSpent: 900, // 15 minutes
      testData: {
        test: {
          title: 'M&E Officer Assessment',
          type: 'job-specific',
          questions: [
            {
              id: 'q1',
              question: 'What is your primary responsibility in M&E?',
              type: 'multiple_choice',
              options: ['Data Collection', 'Report Writing', 'Team Management', 'Budget Planning'],
              category: 'skills'
            },
            {
              id: 'q2',
              question: 'I enjoy working with data and analytics',
              type: 'scale',
              scaleRange: { min: 1, max: 5, labels: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'] },
              category: 'personality'
            },
            {
              id: 'q3',
              question: 'Rate your Excel proficiency (1-5)',
              type: 'scale',
              scaleRange: { min: 1, max: 5 },
              category: 'skills'
            },
            {
              id: 'q4',
              question: 'Describe your experience with community engagement',
              type: 'text',
              placeholder: 'Please provide details...',
              maxLength: 500,
              category: 'experience'
            },
            {
              id: 'q5',
              question: 'I am comfortable working in remote areas',
              type: 'boolean',
              options: ['True', 'False'],
              category: 'personality'
            }
          ],
          timeLimit: 30,
          industry: 'development',
          jobRole: 'M&E Officer'
        }
      }
    };

    // Test the API endpoint
    console.log('Making request to test endpoint...');
    const response = await axios.post(
      'http://localhost:5001/api/psychometric-tests/job-specific-me-officer-test-123/take',
      testData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // This would be a real token
        },
        validateStatus: function (status) {
          // Accept both success and error responses for testing
          return status < 500;
        }
      }
    );

    console.log('Response Status:', response.status);
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.status === 201 && response.data.success) {
      console.log('\n✅ SUCCESS: Test grading working correctly!');
      console.log('Overall Score:', response.data.data.overallScore);
      console.log('Grade:', response.data.data.grade);
      console.log('Detailed Analysis Available:', !!response.data.data.detailedAnalysis);
    } else {
      console.log('\n❌ ISSUE: Test grading not working as expected');
      console.log('Error:', response.data.error);
    }

  } catch (error) {
    console.error('Error testing grading:', error.message);
    if (error.response) {
      console.log('Error Response:', error.response.data);
    }
  }
}

// Run the test
testPsychometricGrading();
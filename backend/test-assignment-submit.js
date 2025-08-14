const mongoose = require('mongoose');
const { Assignment, AssignmentSubmission } = require('./src/models/Assignment');

// Test assignment submission functionality
async function testAssignmentSubmission() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub');
    console.log('Connected to MongoDB');

    // Find an assignment
    const assignment = await Assignment.findOne().populate('course', 'title');
    if (!assignment) {
      console.log('No assignments found in database');
      return;
    }

    console.log('Found assignment:', {
      id: assignment._id,
      title: assignment.title,
      submissionType: assignment.submissionType,
      status: assignment.status,
      course: assignment.course?.title
    });

    // Check existing submissions
    const submissions = await AssignmentSubmission.find({ assignment: assignment._id })
      .populate('student', 'firstName lastName email');
    
    console.log(`Found ${submissions.length} existing submissions`);
    submissions.forEach(sub => {
      console.log(`- ${sub.student.firstName} ${sub.student.lastName}: ${sub.status}`);
    });

    // Test creating a new submission
    const testSubmission = {
      assignment: assignment._id,
      student: new mongoose.Types.ObjectId(), // Fake student ID
      submissionText: 'Test submission content',
      sections: [
        {
          id: 'intro',
          title: 'Introduction',
          content: 'This is a test introduction section',
          type: 'essay',
          completed: true
        },
        {
          id: 'main',
          title: 'Main Content',
          content: 'This is the main content section with detailed analysis',
          type: 'essay',
          completed: true
        }
      ],
      status: 'draft',
      isLate: false
    };

    console.log('Creating test submission...');
    const newSubmission = new AssignmentSubmission(testSubmission);
    await newSubmission.save();
    console.log('Test submission created successfully:', newSubmission._id);

    // Clean up
    await AssignmentSubmission.findByIdAndDelete(newSubmission._id);
    console.log('Test submission cleaned up');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Load environment variables
require('dotenv').config();

// Run test
testAssignmentSubmission();
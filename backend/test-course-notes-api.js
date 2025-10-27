const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub');

// Import the actual models
const { CourseNotes } = require('./src/models/CourseNotes');
const { UserProgress } = require('./src/models/UserProgress');
const { User } = require('./src/models/User');

async function testCourseNotesAPI() {
  try {
    const courseId = '68937dcc7fd4938812659c36';
    
    console.log('🧪 Testing course notes API logic...');
    
    // Find a student
    const student = await User.findOne({ role: 'student' });
    if (!student) {
      console.log('❌ No student found');
      return;
    }
    
    console.log(`👤 Testing with student: ${student.firstName} ${student.lastName} (${student._id})`);
    
    // Check enrollment (using UserProgress as fixed)
    const enrollment = await UserProgress.findOne({ 
      user: student._id, 
      course: courseId
    });
    
    console.log(`📝 Enrollment found: ${enrollment ? 'YES' : 'NO'}`);
    if (!enrollment) {
      console.log('❌ Student not enrolled - this would cause 403 error');
      return;
    }
    
    // Test getProgressiveOrder method
    console.log('\n🔍 Testing getProgressiveOrder method...');
    try {
      const courseNotes = await CourseNotes.getProgressiveOrder(courseId);
      console.log(`📚 Progressive order notes found: ${courseNotes.length}`);
      
      courseNotes.forEach((note, index) => {
        console.log(`   ${index + 1}. Chapter ${note.chapter}: ${note.title} (Published: ${note.isPublished})`);
      });
      
      if (courseNotes.length === 0) {
        console.log('❌ No notes returned by getProgressiveOrder - this would show "No course notes available"');
      }
      
    } catch (error) {
      console.log('❌ Error with getProgressiveOrder:', error.message);
    }
    
    // Test alternative query
    console.log('\n🔍 Testing alternative query...');
    const alternativeNotes = await CourseNotes.find({ 
      course: courseId, 
      isPublished: true 
    }).sort({ chapter: 1 });
    
    console.log(`📚 Alternative query notes: ${alternativeNotes.length}`);
    
    // Test the exact logic from getCourseNotesByCourse
    console.log('\n🧪 Simulating getCourseNotesByCourse logic...');
    
    const studentId = student._id;
    
    // Check enrollment
    const enrollmentCheck = await UserProgress.findOne({ 
      user: studentId, 
      course: courseId
    });
    
    if (!enrollmentCheck) {
      console.log('❌ Enrollment check failed');
      return;
    }
    console.log('✅ Enrollment check passed');
    
    // Get course
    const Course = require('./src/models/Course').Course;
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found');
      return;
    }
    console.log('✅ Course found');
    
    // Get notes
    let notesResult;
    try {
      notesResult = await CourseNotes.getProgressiveOrder(courseId);
      console.log(`✅ getProgressiveOrder returned ${notesResult.length} notes`);
    } catch (error) {
      console.log('❌ getProgressiveOrder failed:', error.message);
      // Fallback
      notesResult = await CourseNotes.find({ 
        course: courseId, 
        isPublished: true 
      }).sort({ chapter: 1 });
      console.log(`✅ Fallback query returned ${notesResult.length} notes`);
    }
    
    console.log('\n🎉 Final result would be:', notesResult.length > 0 ? 'SUCCESS' : 'NO NOTES AVAILABLE');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCourseNotesAPI();
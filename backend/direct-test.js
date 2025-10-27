const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub');

// Import the compiled models
async function testDirectly() {
  try {
    // Import the compiled TypeScript models
    const { CourseNotes } = await import('./dist/models/CourseNotes.js');
    const { UserProgress } = await import('./dist/models/UserProgress.js');
    
    const courseId = '68937dcc7fd4938812659c36';
    const studentId = '68925a0d472b4bfc179fa154'; // usanase sauda
    
    console.log('🧪 Testing direct model calls...');
    
    // Test enrollment check
    const enrollment = await UserProgress.findOne({ 
      user: studentId, 
      course: courseId
    });
    console.log(`📝 Enrollment found: ${enrollment ? 'YES' : 'NO'}`);
    
    if (!enrollment) {
      console.log('❌ No enrollment - this would cause 403 error');
      return;
    }
    
    // Test getProgressiveOrder
    console.log('\n🔍 Testing getProgressiveOrder...');
    try {
      const courseNotes = await CourseNotes.getProgressiveOrder(courseId);
      console.log(`📚 getProgressiveOrder returned: ${courseNotes.length} notes`);
      
      courseNotes.forEach((note, index) => {
        console.log(`   ${index + 1}. Chapter ${note.chapter}: ${note.title}`);
        console.log(`      Published: ${note.isPublished}`);
        console.log(`      Sections: ${note.sections?.length || 0}`);
      });
      
    } catch (error) {
      console.log('❌ getProgressiveOrder error:', error.message);
    }
    
    // Test fallback query
    console.log('\n🔍 Testing fallback query...');
    const fallbackNotes = await CourseNotes.find({ 
      course: courseId, 
      isPublished: true 
    }).sort({ chapter: 1 });
    
    console.log(`📚 Fallback query returned: ${fallbackNotes.length} notes`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDirectly();
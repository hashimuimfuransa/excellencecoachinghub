const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub');

// Define schemas (simplified)
const courseNotesSchema = new mongoose.Schema({
  title: String,
  description: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chapter: Number,
  sections: Array,
  isPublished: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const userProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  enrollmentDate: { type: Date, default: Date.now },
  progressPercentage: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  role: String
});

const courseSchema = new mongoose.Schema({
  title: String,
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const CourseNotes = mongoose.model('CourseNotes', courseNotesSchema);
const UserProgress = mongoose.model('UserProgress', userProgressSchema);
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

async function debugCourseNotes() {
  try {
    const courseId = '68937dcc7fd4938812659c36';
    
    console.log('🔍 Debugging course notes for course:', courseId);
    
    // Check if course exists
    const course = await Course.findById(courseId).populate('instructor', 'firstName lastName email');
    console.log('📚 Course found:', course ? `"${course.title}" by ${course.instructor?.firstName} ${course.instructor?.lastName}` : 'NOT FOUND');
    
    // Find all course notes for this course
    const allNotes = await CourseNotes.find({ course: courseId })
      .populate('instructor', 'firstName lastName email')
      .sort({ chapter: 1 });
    
    console.log(`📝 Total course notes found: ${allNotes.length}`);
    
    allNotes.forEach((note, index) => {
      console.log(`\n📖 Note ${index + 1}:`);
      console.log(`   Title: ${note.title}`);
      console.log(`   Chapter: ${note.chapter}`);
      console.log(`   Published: ${note.isPublished}`);
      console.log(`   Instructor: ${note.instructor?.firstName} ${note.instructor?.lastName}`);
      console.log(`   Sections: ${note.sections?.length || 0}`);
      console.log(`   Created: ${note.createdAt}`);
      console.log(`   ID: ${note._id}`);
    });
    
    // Check published notes specifically
    const publishedNotes = await CourseNotes.find({ 
      course: courseId, 
      isPublished: true 
    }).sort({ chapter: 1 });
    
    console.log(`\n✅ Published notes: ${publishedNotes.length}`);
    
    // Check enrollments
    const enrollments = await UserProgress.find({ course: courseId })
      .populate('user', 'firstName lastName email role');
    
    console.log(`\n👥 Enrollments found: ${enrollments.length}`);
    enrollments.forEach((enrollment, index) => {
      console.log(`   ${index + 1}. ${enrollment.user?.firstName} ${enrollment.user?.lastName} (${enrollment.user?.email}) - Role: ${enrollment.user?.role}`);
    });
    
    // Test the exact query used by getCourseNotesByCourse
    console.log('\n🔍 Testing getCourseNotesByCourse query...');
    
    // Check if CourseNotes has getProgressiveOrder method
    if (CourseNotes.getProgressiveOrder) {
      console.log('✅ getProgressiveOrder method exists');
      try {
        const progressiveNotes = await CourseNotes.getProgressiveOrder(courseId);
        console.log(`📚 Progressive order notes: ${progressiveNotes.length}`);
      } catch (error) {
        console.log('❌ Error with getProgressiveOrder:', error.message);
      }
    } else {
      console.log('❌ getProgressiveOrder method NOT found');
      // Try alternative query
      const alternativeNotes = await CourseNotes.find({ 
        course: courseId, 
        isPublished: true 
      }).sort({ chapter: 1 });
      console.log(`📚 Alternative query notes: ${alternativeNotes.length}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugCourseNotes();
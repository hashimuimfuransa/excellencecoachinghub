const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub');

// Define schemas (simplified)
const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  isActive: { type: Boolean, default: true },
  enrolledAt: { type: Date, default: Date.now }
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

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

async function debugEnrollment() {
  try {
    const courseId = '68937dcc7fd4938812659c36';
    
    console.log('🔍 Debugging enrollment for course:', courseId);
    
    // Check if course exists
    const course = await Course.findById(courseId);
    console.log('📚 Course found:', course ? `"${course.title}"` : 'NOT FOUND');
    
    // Find all enrollments for this course
    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'firstName lastName email role')
      .populate('course', 'title');
    
    console.log(`👥 Total enrollments found: ${enrollments.length}`);
    
    enrollments.forEach((enrollment, index) => {
      console.log(`\n📝 Enrollment ${index + 1}:`);
      console.log(`   Student: ${enrollment.student?.firstName} ${enrollment.student?.lastName} (${enrollment.student?.email})`);
      console.log(`   Role: ${enrollment.student?.role}`);
      console.log(`   Course: ${enrollment.course?.title}`);
      console.log(`   Active: ${enrollment.isActive}`);
      console.log(`   Enrolled: ${enrollment.enrolledAt}`);
      console.log(`   Student ID: ${enrollment.student?._id}`);
      console.log(`   Course ID: ${enrollment.course?._id}`);
    });
    
    // Find all students
    const students = await User.find({ role: 'student' });
    console.log(`\n👨‍🎓 Total students in system: ${students.length}`);
    
    students.forEach((student, index) => {
      console.log(`   Student ${index + 1}: ${student.firstName} ${student.lastName} (${student.email}) - ID: ${student._id}`);
    });
    
    // Check for any enrollment issues
    const activeEnrollments = await Enrollment.find({ 
      course: courseId, 
      isActive: true 
    });
    console.log(`\n✅ Active enrollments for this course: ${activeEnrollments.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugEnrollment();
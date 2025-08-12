const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub');

// Define schemas (simplified)
const userProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  enrollmentDate: { type: Date, default: Date.now },
  progressPercentage: { type: Number, default: 0 },
  totalPoints: { type: Number, default: 0 },
  isCompleted: { type: Boolean, default: false },
  lastAccessed: { type: Date, default: Date.now },
  completedLessons: [String],
  completedQuizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }],
  totalTimeSpent: { type: Number, default: 0 },
  badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
  streakDays: { type: Number, default: 0 },
  lastActivityDate: { type: Date, default: Date.now },
  completionDate: Date,
  certificateIssued: { type: Boolean, default: false },
  certificateUrl: String
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

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

async function enrollStudent() {
  try {
    const courseId = '68937dcc7fd4938812659c36';
    
    console.log('🔍 Finding students and course...');
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found');
      return;
    }
    console.log(`📚 Course found: "${course.title}"`);
    
    // Find all students
    const students = await User.find({ role: 'student' });
    console.log(`👥 Found ${students.length} students`);
    
    // Enroll each student in the course
    for (const student of students) {
      console.log(`\n📝 Enrolling ${student.firstName} ${student.lastName}...`);
      
      // Check if already enrolled
      const existingEnrollment = await UserProgress.findOne({
        user: student._id,
        course: courseId
      });
      
      if (existingEnrollment) {
        console.log(`   ✅ Already enrolled`);
        continue;
      }
      
      // Create enrollment
      const enrollment = new UserProgress({
        user: student._id,
        course: courseId,
        enrollmentDate: new Date(),
        progressPercentage: 0,
        totalPoints: 0,
        isCompleted: false,
        lastAccessed: new Date(),
        completedLessons: [],
        completedQuizzes: [],
        totalTimeSpent: 0,
        badges: [],
        streakDays: 0,
        lastActivityDate: new Date()
      });
      
      await enrollment.save();
      console.log(`   ✅ Successfully enrolled!`);
    }
    
    // Verify enrollments
    const allEnrollments = await UserProgress.find({ course: courseId })
      .populate('user', 'firstName lastName email');
    
    console.log(`\n🎉 Total enrollments for course: ${allEnrollments.length}`);
    allEnrollments.forEach((enrollment, index) => {
      console.log(`   ${index + 1}. ${enrollment.user.firstName} ${enrollment.user.lastName} (${enrollment.user.email})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

enrollStudent();
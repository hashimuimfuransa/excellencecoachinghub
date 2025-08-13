const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellence-coaching-hub')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define schemas (simplified)
const userSchema = new mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  role: String
});

const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);
const Course = mongoose.model('Course', courseSchema);

async function debugCourseOwnership() {
  try {
    const userEmail = 'dieudonnetuy250@gmail.com';
    const courseId = '68937dcc7fd4938812659c36';

    console.log('🔍 Debugging course ownership...');
    console.log('User email:', userEmail);
    console.log('Course ID:', courseId);
    console.log('');

    // Find the user
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      console.log('❌ User not found with email:', userEmail);
      return;
    }

    console.log('✅ User found:');
    console.log('  ID:', user._id.toString());
    console.log('  Name:', user.firstName, user.lastName);
    console.log('  Role:', user.role);
    console.log('');

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found with ID:', courseId);
      
      // Let's see what courses exist
      const allCourses = await Course.find({}).populate('teacher', 'firstName lastName email');
      console.log('📚 Available courses:');
      allCourses.forEach(c => {
        console.log(`  - ${c.title} (ID: ${c._id}) - Teacher: ${c.teacher?.firstName} ${c.teacher?.lastName} (${c.teacher?.email})`);
      });
      return;
    }

    console.log('✅ Course found:');
    console.log('  Title:', course.title);
    console.log('  Description:', course.description);
    console.log('  Teacher ID:', course.teacher?.toString());
    console.log('');

    // Check ownership
    if (course.teacher?.toString() === user._id.toString()) {
      console.log('✅ Course belongs to the user!');
    } else {
      console.log('❌ Course does NOT belong to the user');
      console.log('  Course teacher ID:', course.teacher?.toString());
      console.log('  User ID:', user._id.toString());
      
      // Find the actual teacher
      const actualTeacher = await User.findById(course.teacher);
      if (actualTeacher) {
        console.log('  Actual teacher:', actualTeacher.firstName, actualTeacher.lastName, `(${actualTeacher.email})`);
      }
    }

    // Let's also check courses that belong to this user
    const userCourses = await Course.find({ teacher: user._id });
    console.log('');
    console.log(`📚 Courses belonging to ${user.firstName} ${user.lastName}:`);
    if (userCourses.length === 0) {
      console.log('  No courses found for this user');
    } else {
      userCourses.forEach(c => {
        console.log(`  - ${c.title} (ID: ${c._id})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugCourseOwnership();
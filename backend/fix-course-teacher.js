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

async function fixCourseTeacher() {
  try {
    const userEmail = 'dieudonnetuy250@gmail.com';
    const courseId = '68937dcc7fd4938812659c36';
    const teacherId = '689221cc4a5babab3fc2b0b7';

    console.log('🔧 Fixing course teacher assignment...');
    console.log('User email:', userEmail);
    console.log('Course ID:', courseId);
    console.log('Teacher ID:', teacherId);
    console.log('');

    // Find the user
    const user = await User.findById(teacherId);
    if (!user) {
      console.log('❌ User not found with ID:', teacherId);
      return;
    }

    console.log('✅ User found:');
    console.log('  ID:', user._id.toString());
    console.log('  Name:', user.firstName, user.lastName);
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('');

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found with ID:', courseId);
      return;
    }

    console.log('✅ Course found:');
    console.log('  Title:', course.title);
    console.log('  Description:', course.description);
    console.log('  Current teacher ID:', course.teacher);
    console.log('');

    // Update the course to assign the teacher
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { teacher: teacherId },
      { new: true }
    );

    if (updatedCourse) {
      console.log('✅ Course updated successfully!');
      console.log('  Title:', updatedCourse.title);
      console.log('  New teacher ID:', updatedCourse.teacher);
      console.log('');
      
      // Verify the fix
      const verificationCourse = await Course.findOne({ _id: courseId, teacher: teacherId });
      if (verificationCourse) {
        console.log('✅ Verification successful! Course now belongs to the teacher.');
      } else {
        console.log('❌ Verification failed! Something went wrong.');
      }
    } else {
      console.log('❌ Failed to update course');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixCourseTeacher();
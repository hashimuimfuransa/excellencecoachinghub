const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Import models
const CourseEnrollment = require('./src/models/CourseEnrollment').CourseEnrollment;
const Course = require('./src/models/Course').Course;
const User = require('./src/models/User').User;

async function debugEnrollment() {
  try {
    const studentId = '68925a0d472b4bfc179fa154';
    const courseId = '689f6f1bb2aa8dfffa5554bc';
    
    console.log('\n🔍 Debugging enrollment issue...');
    console.log(`Student ID: ${studentId}`);
    console.log(`Course ID: ${courseId}`);
    
    // Check if student exists
    const student = await User.findById(studentId);
    console.log('\n👤 Student:', student ? {
      id: student._id,
      email: student.email,
      role: student.role,
      isActive: student.isActive
    } : 'NOT FOUND');
    
    // Check if course exists
    const course = await Course.findById(courseId);
    console.log('\n📚 Course:', course ? {
      id: course._id,
      title: course.title,
      notesPrice: course.notesPrice,
      liveSessionPrice: course.liveSessionPrice,
      status: course.status
    } : 'NOT FOUND');
    
    // Check all enrollments for this student
    const allEnrollments = await CourseEnrollment.find({ student: studentId });
    console.log('\n📋 All enrollments for student:', allEnrollments.length);
    allEnrollments.forEach((enrollment, index) => {
      console.log(`  ${index + 1}. Course: ${enrollment.course}, Status: ${enrollment.paymentStatus}, Active: ${enrollment.isActive}, Amount: ${enrollment.paymentAmount}`);
    });
    
    // Check specific enrollment
    const specificEnrollment = await CourseEnrollment.findOne({ 
      student: studentId, 
      course: courseId 
    });
    console.log('\n🎯 Specific enrollment:', specificEnrollment ? {
      id: specificEnrollment._id,
      student: specificEnrollment.student,
      course: specificEnrollment.course,
      enrollmentType: specificEnrollment.enrollmentType,
      paymentAmount: specificEnrollment.paymentAmount,
      paymentStatus: specificEnrollment.paymentStatus,
      isActive: specificEnrollment.isActive,
      enrolledAt: specificEnrollment.enrolledAt,
      accessPermissions: specificEnrollment.accessPermissions
    } : 'NOT FOUND');
    
    // Check enrollments with completed payment status
    const completedEnrollments = await CourseEnrollment.find({ 
      student: studentId, 
      isActive: true,
      paymentStatus: 'completed'
    });
    console.log('\n✅ Completed enrollments:', completedEnrollments.length);
    completedEnrollments.forEach((enrollment, index) => {
      console.log(`  ${index + 1}. Course: ${enrollment.course}, Type: ${enrollment.enrollmentType}, Amount: ${enrollment.paymentAmount}`);
    });
    
    // Test the exact query used by getCourseNotesByCourse
    console.log('\n🔍 Testing getCourseNotesByCourse query...');
    const enrollment = await CourseEnrollment.findOne({ 
      student: studentId, 
      course: courseId,
      isActive: true,
      paymentStatus: 'completed'
    });
    console.log('Result:', enrollment ? 'FOUND' : 'NOT FOUND');
    
    // Test the exact query used by getEnrolledCourses
    console.log('\n🔍 Testing getEnrolledCourses query...');
    const enrolledCoursesQuery = await CourseEnrollment.find({ 
      student: studentId, 
      isActive: true,
      paymentStatus: 'completed'
    }).populate('course', 'title');
    console.log('Enrolled courses found:', enrolledCoursesQuery.length);
    enrolledCoursesQuery.forEach((enrollment, index) => {
      console.log(`  ${index + 1}. ${enrollment.course?.title || 'Unknown Course'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugEnrollment();
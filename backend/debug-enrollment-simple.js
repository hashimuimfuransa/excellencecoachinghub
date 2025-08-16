const mongoose = require('mongoose');
require('dotenv').config();

async function debugEnrollment() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub');
  console.log('✅ Connected to MongoDB');
  try {
    const studentId = '68925a0d472b4bfc179fa154';
    const courseId = '689f6f1bb2aa8dfffa5554bc';
    
    console.log('\n🔍 Debugging enrollment issue...');
    console.log(`Student ID: ${studentId}`);
    console.log(`Course ID: ${courseId}`);
    
    // Direct MongoDB queries
    const db = mongoose.connection.db;
    
    // Check enrollments collection
    const enrollments = await db.collection('courseenrollments').find({ 
      student: new mongoose.Types.ObjectId(studentId)
    }).toArray();
    
    console.log('\n📋 All enrollments for student:', enrollments.length);
    enrollments.forEach((enrollment, index) => {
      console.log(`  ${index + 1}.`, {
        course: enrollment.course.toString(),
        paymentStatus: enrollment.paymentStatus,
        paymentAmount: enrollment.paymentAmount,
        isActive: enrollment.isActive,
        enrollmentType: enrollment.enrollmentType,
        enrolledAt: enrollment.enrolledAt
      });
    });
    
    // Check specific enrollment
    const specificEnrollment = await db.collection('courseenrollments').findOne({ 
      student: new mongoose.Types.ObjectId(studentId),
      course: new mongoose.Types.ObjectId(courseId)
    });
    
    console.log('\n🎯 Specific enrollment:', specificEnrollment ? {
      course: specificEnrollment.course.toString(),
      paymentStatus: specificEnrollment.paymentStatus,
      paymentAmount: specificEnrollment.paymentAmount,
      isActive: specificEnrollment.isActive,
      enrollmentType: specificEnrollment.enrollmentType,
      accessPermissions: specificEnrollment.accessPermissions
    } : 'NOT FOUND');
    
    // Check course details
    const course = await db.collection('courses').findOne({ 
      _id: new mongoose.Types.ObjectId(courseId)
    });
    
    console.log('\n📚 Course details:', course ? {
      title: course.title,
      notesPrice: course.notesPrice,
      liveSessionPrice: course.liveSessionPrice,
      status: course.status
    } : 'NOT FOUND');
    
    // Check user details
    const user = await db.collection('users').findOne({ 
      _id: new mongoose.Types.ObjectId(studentId)
    });
    
    console.log('\n👤 User details:', user ? {
      email: user.email,
      role: user.role,
      isActive: user.isActive
    } : 'NOT FOUND');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugEnrollment();
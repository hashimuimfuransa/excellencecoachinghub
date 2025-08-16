const mongoose = require('mongoose');
const { CourseEnrollment } = require('./src/models/CourseEnrollment');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixEnrollment() {
  try {
    const studentId = '68925a0d472b4bfc179fa154';
    const courseId = '689f6f1bb2aa8dfffa5554bc';
    
    console.log(`🔍 Checking enrollment for student ${studentId} in course ${courseId}`);
    
    // Check if enrollment already exists
    const existingEnrollment = await CourseEnrollment.findOne({
      student: studentId,
      course: courseId
    });
    
    if (existingEnrollment) {
      console.log('📋 Existing enrollment found:', existingEnrollment);
      
      // Update the enrollment to ensure it's active and payment is completed
      existingEnrollment.isActive = true;
      existingEnrollment.paymentStatus = 'completed';
      await existingEnrollment.save();
      
      console.log('✅ Updated existing enrollment to active and completed payment');
    } else {
      console.log('❌ No enrollment found, creating new enrollment...');
      
      // Create new enrollment
      const newEnrollment = new CourseEnrollment({
        student: studentId,
        course: courseId,
        enrollmentType: 'both',
        paymentAmount: 0, // Free course
        paymentMethod: 'free',
        paymentStatus: 'completed',
        transactionId: `FIX_${Date.now()}`,
        isActive: true,
        accessPermissions: {
          canAccessNotes: true,
          canAccessLiveSessions: true,
          canDownloadMaterials: true,
          canSubmitAssignments: true
        },
        progress: {
          completedLessons: [],
          completedAssignments: [],
          totalProgress: 0,
          lastAccessedAt: new Date()
        }
      });
      
      await newEnrollment.save();
      console.log('✅ Created new enrollment:', newEnrollment._id);
    }
    
    // Verify the enrollment
    const verifyEnrollment = await CourseEnrollment.findOne({
      student: studentId,
      course: courseId,
      isActive: true,
      paymentStatus: 'completed'
    });
    
    if (verifyEnrollment) {
      console.log('🎉 Enrollment verification successful!');
      console.log('📋 Final enrollment details:', {
        _id: verifyEnrollment._id,
        student: verifyEnrollment.student,
        course: verifyEnrollment.course,
        enrollmentType: verifyEnrollment.enrollmentType,
        paymentStatus: verifyEnrollment.paymentStatus,
        isActive: verifyEnrollment.isActive
      });
    } else {
      console.log('❌ Enrollment verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error fixing enrollment:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixEnrollment();
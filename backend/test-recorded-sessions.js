const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencehub')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function testRecordedSessions() {
  try {
    console.log('\n🔍 TESTING RECORDED SESSIONS ENDPOINT\n');
    
    // Get collections directly
    const db = mongoose.connection.db;
    const recordedSessionsCollection = db.collection('recordedsessions');
    const progressCollection = db.collection('userprogresses');
    const usersCollection = db.collection('users');
    const coursesCollection = db.collection('courses');
    
    // 1. Check recorded sessions
    const allRecordedSessions = await recordedSessionsCollection.find({}).toArray();
    console.log(`📊 Total recorded sessions in database: ${allRecordedSessions.length}`);
    
    if (allRecordedSessions.length === 0) {
      console.log('❌ No recorded sessions found in database!');
      console.log('This means teachers haven\'t uploaded any videos yet.');
      return;
    }
    
    console.log('\n📋 Sample recorded sessions:');
    allRecordedSessions.slice(0, 3).forEach((session, index) => {
      console.log(`${index + 1}. ${session.title || 'Untitled'}`);
      console.log(`   Teacher: ${session.teacher}`);
      console.log(`   Course: ${session.course}`);
      console.log(`   Video URL: ${session.videoUrl}`);
      console.log(`   Published: ${session.isPublished !== false}`);
      console.log(`   Upload Date: ${session.uploadDate}`);
      console.log('');
    });
    
    // 2. Check published sessions
    const publishedSessions = await recordedSessionsCollection.find({
      isPublished: { $ne: false }
    }).toArray();
    
    console.log(`✅ Published recorded sessions: ${publishedSessions.length}`);
    
    // 3. Check user enrollments
    const enrollments = await progressCollection.find({}).toArray();
    console.log(`👥 Total enrollments: ${enrollments.length}`);
    
    if (enrollments.length === 0) {
      console.log('❌ No enrollments found! Students need to be enrolled in courses.');
      return;
    }
    
    // 4. Test the query that the new endpoint will use
    console.log('\n🔍 Testing student query...');
    
    // Get a sample student
    const sampleEnrollment = enrollments[0];
    const studentId = sampleEnrollment.user;
    
    console.log(`Using student ID: ${studentId}`);
    
    // Get all courses this student is enrolled in
    const studentEnrollments = await progressCollection.find({ 
      user: studentId 
    }).toArray();
    
    const enrolledCourseIds = studentEnrollments.map(enrollment => enrollment.course);
    console.log(`Student enrolled in ${enrolledCourseIds.length} courses`);
    
    // Find recorded sessions for these courses
    const availableRecordings = await recordedSessionsCollection.find({
      course: { $in: enrolledCourseIds },
      isPublished: { $ne: false }
    }).toArray();
    
    console.log(`🎯 Recordings available to this student: ${availableRecordings.length}`);
    
    if (availableRecordings.length > 0) {
      console.log('\n✅ SUCCESS! Student should see these recordings:');
      availableRecordings.forEach((recording, index) => {
        console.log(`${index + 1}. ${recording.title}`);
        console.log(`   Video URL: ${recording.videoUrl}`);
      });
    } else {
      console.log('\n❌ No recordings available to student. Possible reasons:');
      console.log('1. No recordings exist for courses student is enrolled in');
      console.log('2. All recordings are marked as unpublished (isPublished: false)');
      console.log('3. Course IDs don\'t match between enrollments and recordings');
      
      // Debug: Check course IDs
      console.log('\n🔍 Debug info:');
      console.log('Student enrolled course IDs:', enrolledCourseIds.map(id => id.toString()));
      console.log('Available recording course IDs:', allRecordedSessions.map(r => r.course.toString()));
    }
    
    // 5. Check if there are any unpublished sessions
    const unpublishedSessions = await recordedSessionsCollection.find({
      isPublished: false
    }).toArray();
    
    if (unpublishedSessions.length > 0) {
      console.log(`\n⚠️ Found ${unpublishedSessions.length} unpublished sessions that won't be visible to students`);
    }
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the test
testRecordedSessions();
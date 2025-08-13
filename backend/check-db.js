const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencehub');
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check recorded sessions
    const recordedSessions = await db.collection('recordedsessions').find({}).toArray();
    console.log(`\n📊 Total recorded sessions: ${recordedSessions.length}`);
    
    if (recordedSessions.length > 0) {
      console.log('\n📋 Sample recorded sessions:');
      recordedSessions.slice(0, 3).forEach((session, index) => {
        console.log(`${index + 1}. ${session.title || 'Untitled'}`);
        console.log(`   Teacher: ${session.teacher}`);
        console.log(`   Course: ${session.course}`);
        console.log(`   Published: ${session.isPublished !== false}`);
        console.log(`   Video URL: ${session.videoUrl ? 'Yes' : 'No'}`);
        console.log('');
      });
    }
    
    // Check user progress (enrollments)
    const userProgress = await db.collection('userprogresses').find({}).toArray();
    console.log(`📚 Total enrollments: ${userProgress.length}`);
    
    if (userProgress.length > 0) {
      console.log('\n👥 Sample enrollments:');
      userProgress.slice(0, 3).forEach((progress, index) => {
        console.log(`${index + 1}. User: ${progress.user}, Course: ${progress.course}`);
      });
    }
    
    // Check users
    const users = await db.collection('users').find({ role: 'student' }).toArray();
    console.log(`\n👤 Total students: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\n📋 Sample students:');
      users.slice(0, 3).forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      });
    }
    
    // Check courses
    const courses = await db.collection('courses').find({}).toArray();
    console.log(`\n📚 Total courses: ${courses.length}`);
    
    if (courses.length > 0) {
      console.log('\n📋 Sample courses:');
      courses.slice(0, 3).forEach((course, index) => {
        console.log(`${index + 1}. ${course.title} (Teacher: ${course.teacher})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkDatabase();
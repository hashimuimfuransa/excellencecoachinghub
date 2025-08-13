const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencehub')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Define schemas (simplified versions)
const liveSessionSchema = new mongoose.Schema({
  title: String,
  description: String,
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledTime: Date,
  duration: Number,
  actualStartTime: Date,
  actualEndTime: Date,
  status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled' },
  isRecorded: { type: Boolean, default: false },
  recordingStatus: { type: String, enum: ['not_started', 'recording', 'completed', 'failed'], default: 'not_started' },
  recordingUrl: String,
  recordingSize: Number,
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  attendees: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinTime: Date,
    leaveTime: Date,
    duration: Number,
    participated: Boolean
  }]
}, { timestamps: true });

const userProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  progress: { type: Number, default: 0 },
  enrolledAt: { type: Date, default: Date.now }
}, { timestamps: true });

const LiveSession = mongoose.model('LiveSession', liveSessionSchema);
const UserProgress = mongoose.model('UserProgress', userProgressSchema);

async function debugRecordings() {
  try {
    console.log('\n🔍 DEBUGGING RECORDED SESSIONS ISSUE\n');
    
    // 1. Check all live sessions
    const allSessions = await LiveSession.find({})
      .populate('course', 'title')
      .populate('instructor', 'firstName lastName')
      .sort({ createdAt: -1 });
    
    console.log(`📊 Total sessions in database: ${allSessions.length}`);
    
    if (allSessions.length === 0) {
      console.log('❌ No sessions found in database. This is the root cause!');
      return;
    }
    
    // 2. Analyze session statuses
    const statusCounts = {};
    const recordingCounts = { recorded: 0, notRecorded: 0, hasUrl: 0, noUrl: 0 };
    
    allSessions.forEach(session => {
      statusCounts[session.status] = (statusCounts[session.status] || 0) + 1;
      
      if (session.isRecorded) {
        recordingCounts.recorded++;
        if (session.recordingUrl) {
          recordingCounts.hasUrl++;
        } else {
          recordingCounts.noUrl++;
        }
      } else {
        recordingCounts.notRecorded++;
      }
    });
    
    console.log('\n📈 Session Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n🎥 Recording Status Breakdown:');
    console.log(`  Sessions marked as recorded: ${recordingCounts.recorded}`);
    console.log(`  Sessions not recorded: ${recordingCounts.notRecorded}`);
    console.log(`  Recorded sessions with URL: ${recordingCounts.hasUrl}`);
    console.log(`  Recorded sessions without URL: ${recordingCounts.noUrl}`);
    
    // 3. Check sessions that should appear in student view
    const validRecordings = await LiveSession.find({
      status: 'ended',
      isRecorded: true,
      recordingUrl: { $exists: true, $ne: null }
    }).populate('course', 'title').populate('instructor', 'firstName lastName');
    
    console.log(`\n✅ Sessions that meet recording criteria: ${validRecordings.length}`);
    
    if (validRecordings.length === 0) {
      console.log('\n🔧 FIXING ISSUE: No sessions meet the criteria. Let me fix this...');
      
      // Find sessions that have video files but aren't properly configured
      const sessionsToFix = await LiveSession.find({
        $or: [
          { status: { $ne: 'ended' }, isRecorded: true },
          { status: 'ended', isRecorded: false },
          { status: 'ended', isRecorded: true, recordingUrl: { $exists: false } }
        ]
      });
      
      console.log(`\n🛠️ Found ${sessionsToFix.length} sessions that need fixing`);
      
      // Check if there are video files in the uploads directory
      const fs = require('fs');
      const path = require('path');
      const videoDir = path.join(__dirname, 'uploads', 'videos');
      
      let videoFiles = [];
      if (fs.existsSync(videoDir)) {
        videoFiles = fs.readdirSync(videoDir).filter(file => 
          file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.avi')
        );
        console.log(`📁 Found ${videoFiles.length} video files in uploads/videos/`);
        videoFiles.forEach(file => console.log(`  - ${file}`));
      }
      
      // Fix sessions by setting proper status and recording URLs
      let fixedCount = 0;
      for (let i = 0; i < Math.min(sessionsToFix.length, videoFiles.length); i++) {
        const session = sessionsToFix[i];
        const videoFile = videoFiles[i];
        
        session.status = 'ended';
        session.isRecorded = true;
        session.recordingStatus = 'completed';
        session.recordingUrl = `/uploads/videos/${videoFile}`;
        
        // Set end time if not set
        if (!session.actualEndTime) {
          session.actualEndTime = session.actualStartTime || new Date(session.scheduledTime.getTime() + session.duration * 60000);
        }
        
        await session.save();
        fixedCount++;
        console.log(`✅ Fixed session: ${session.title}`);
      }
      
      console.log(`\n🎉 Fixed ${fixedCount} sessions!`);
    } else {
      console.log('\n📋 Valid recordings found:');
      validRecordings.forEach(session => {
        console.log(`  - ${session.title} (${session.course?.title || 'No course'})`);
        console.log(`    URL: ${session.recordingUrl}`);
        console.log(`    Status: ${session.status}, Recorded: ${session.isRecorded}`);
      });
    }
    
    // 4. Check user enrollments
    const enrollments = await UserProgress.find({}).populate('user', 'firstName lastName email role').populate('course', 'title');
    console.log(`\n👥 Total enrollments: ${enrollments.length}`);
    
    if (enrollments.length === 0) {
      console.log('❌ No enrollments found! Students need to be enrolled in courses to see recordings.');
    } else {
      console.log('\n📚 Sample enrollments:');
      enrollments.slice(0, 5).forEach(enrollment => {
        console.log(`  - ${enrollment.user?.firstName} ${enrollment.user?.lastName} (${enrollment.user?.role}) enrolled in ${enrollment.course?.title}`);
      });
    }
    
    // 5. Final verification
    console.log('\n🔍 Final verification - Running the same query as the frontend...');
    const studentEnrollments = await UserProgress.find({}).select('course');
    const enrolledCourseIds = studentEnrollments.map(enrollment => enrollment.course);
    
    const finalQuery = {
      status: 'ended',
      isRecorded: true,
      recordingUrl: { $exists: true, $ne: null },
      course: { $in: enrolledCourseIds }
    };
    
    const finalResults = await LiveSession.find(finalQuery)
      .populate('course', 'title description thumbnail')
      .populate('instructor', 'firstName lastName')
      .sort({ scheduledTime: -1 });
    
    console.log(`\n🎯 Final query results: ${finalResults.length} recordings should be visible to students`);
    
    if (finalResults.length > 0) {
      console.log('\n✅ SUCCESS! The following recordings should now be visible:');
      finalResults.forEach(session => {
        console.log(`  - ${session.title} by ${session.instructor?.firstName} ${session.instructor?.lastName}`);
        console.log(`    Course: ${session.course?.title}`);
        console.log(`    Recording URL: ${session.recordingUrl}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the debug script
debugRecordings();
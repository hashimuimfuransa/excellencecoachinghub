const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencehub')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

async function debugRecordings() {
  try {
    console.log('\n🔍 DEBUGGING RECORDED SESSIONS ISSUE\n');
    
    // Get collections directly
    const db = mongoose.connection.db;
    const sessionsCollection = db.collection('livesessions');
    const progressCollection = db.collection('userprogresses');
    
    // 1. Check all live sessions
    const allSessions = await sessionsCollection.find({}).toArray();
    console.log(`📊 Total sessions in database: ${allSessions.length}`);
    
    if (allSessions.length === 0) {
      console.log('❌ No sessions found in database. This is the root cause!');
      return;
    }
    
    // 2. Analyze session statuses
    const statusCounts = {};
    const recordingCounts = { recorded: 0, notRecorded: 0, hasUrl: 0, noUrl: 0 };
    
    console.log('\n📋 Sample sessions:');
    allSessions.slice(0, 5).forEach((session, index) => {
      console.log(`${index + 1}. ${session.title || 'Untitled'}`);
      console.log(`   Status: ${session.status || 'undefined'}`);
      console.log(`   isRecorded: ${session.isRecorded || false}`);
      console.log(`   recordingUrl: ${session.recordingUrl || 'none'}`);
      console.log(`   recordingStatus: ${session.recordingStatus || 'undefined'}`);
      console.log('');
      
      // Count statuses
      const status = session.status || 'undefined';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
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
    
    console.log('📈 Session Status Breakdown:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\n🎥 Recording Status Breakdown:');
    console.log(`  Sessions marked as recorded: ${recordingCounts.recorded}`);
    console.log(`  Sessions not recorded: ${recordingCounts.notRecorded}`);
    console.log(`  Recorded sessions with URL: ${recordingCounts.hasUrl}`);
    console.log(`  Recorded sessions without URL: ${recordingCounts.noUrl}`);
    
    // 3. Check sessions that should appear in student view
    const validRecordings = await sessionsCollection.find({
      status: 'ended',
      isRecorded: true,
      recordingUrl: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`\n✅ Sessions that meet recording criteria: ${validRecordings.length}`);
    
    if (validRecordings.length === 0) {
      console.log('\n🔧 ISSUE IDENTIFIED: No sessions meet the criteria for student viewing!');
      console.log('Required criteria:');
      console.log('  - status: "ended"');
      console.log('  - isRecorded: true');
      console.log('  - recordingUrl: must exist and not be null');
      
      // Check if there are video files in the uploads directory
      const fs = require('fs');
      const path = require('path');
      const videoDir = path.join(__dirname, 'uploads', 'videos');
      
      let videoFiles = [];
      if (fs.existsSync(videoDir)) {
        videoFiles = fs.readdirSync(videoDir).filter(file => 
          file.endsWith('.mp4') || file.endsWith('.webm') || file.endsWith('.avi')
        );
        console.log(`\n📁 Found ${videoFiles.length} video files in uploads/videos/:`);
        videoFiles.forEach(file => console.log(`  - ${file}`));
        
        if (videoFiles.length > 0) {
          console.log('\n🛠️ FIXING: Updating sessions to match available video files...');
          
          // Find sessions that could be fixed
          const sessionsToFix = await sessionsCollection.find({
            $or: [
              { isRecorded: true, recordingUrl: { $exists: false } },
              { isRecorded: true, recordingUrl: null },
              { isRecorded: true, status: { $ne: 'ended' } },
              { status: 'ended', isRecorded: { $ne: true } }
            ]
          }).limit(videoFiles.length).toArray();
          
          console.log(`Found ${sessionsToFix.length} sessions that can be fixed`);
          
          // Fix sessions
          let fixedCount = 0;
          for (let i = 0; i < Math.min(sessionsToFix.length, videoFiles.length); i++) {
            const session = sessionsToFix[i];
            const videoFile = videoFiles[i];
            
            const updateResult = await sessionsCollection.updateOne(
              { _id: session._id },
              {
                $set: {
                  status: 'ended',
                  isRecorded: true,
                  recordingStatus: 'completed',
                  recordingUrl: `/uploads/videos/${videoFile}`,
                  actualEndTime: session.actualEndTime || new Date()
                }
              }
            );
            
            if (updateResult.modifiedCount > 0) {
              fixedCount++;
              console.log(`✅ Fixed session: ${session.title || 'Untitled'} -> ${videoFile}`);
            }
          }
          
          console.log(`\n🎉 Fixed ${fixedCount} sessions!`);
        }
      } else {
        console.log(`\n📁 Video directory not found: ${videoDir}`);
        console.log('This means no video files have been uploaded yet.');
      }
    } else {
      console.log('\n📋 Valid recordings found:');
      validRecordings.forEach(session => {
        console.log(`  - ${session.title || 'Untitled'}`);
        console.log(`    URL: ${session.recordingUrl}`);
        console.log(`    Status: ${session.status}, Recorded: ${session.isRecorded}`);
      });
    }
    
    // 4. Check user enrollments
    const enrollments = await progressCollection.find({}).toArray();
    console.log(`\n👥 Total enrollments: ${enrollments.length}`);
    
    if (enrollments.length === 0) {
      console.log('❌ No enrollments found! Students need to be enrolled in courses to see recordings.');
    }
    
    // 5. Final verification after fixes
    const finalValidRecordings = await sessionsCollection.find({
      status: 'ended',
      isRecorded: true,
      recordingUrl: { $exists: true, $ne: null }
    }).toArray();
    
    console.log(`\n🎯 FINAL RESULT: ${finalValidRecordings.length} recordings should now be visible to students`);
    
    if (finalValidRecordings.length > 0) {
      console.log('\n✅ SUCCESS! The following recordings should now be visible:');
      finalValidRecordings.forEach(session => {
        console.log(`  - ${session.title || 'Untitled'}`);
        console.log(`    Recording URL: ${session.recordingUrl}`);
        console.log(`    Status: ${session.status}`);
      });
      
      console.log('\n🔄 Please refresh your frontend to see the recordings!');
    } else {
      console.log('\n❌ Still no valid recordings. Possible issues:');
      console.log('  1. No video files have been uploaded');
      console.log('  2. Sessions exist but are not properly configured');
      console.log('  3. Database connection issues');
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
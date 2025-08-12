const mongoose = require('mongoose');
const { LiveSession } = require('../models/LiveSession');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coaching-hub');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Update recording status for existing sessions
async function updateRecordingStatus() {
  try {
    console.log('🔄 Updating recording status for existing sessions...');
    
    // Find sessions that were recorded but don't have proper status
    const sessionsToUpdate = await LiveSession.find({
      status: 'ended',
      isRecorded: true,
      recordingStatus: { $exists: false }
    });
    
    console.log(`📊 Found ${sessionsToUpdate.length} sessions to update`);
    
    for (const session of sessionsToUpdate) {
      if (session.recordingUrl) {
        session.recordingStatus = 'completed';
        console.log(`✅ Marking session ${session._id} as completed (has recording URL)`);
      } else {
        session.recordingStatus = 'failed';
        console.log(`❌ Marking session ${session._id} as failed (no recording URL)`);
      }
      
      await session.save();
    }
    
    // Also update sessions that are still marked as recording but are ended
    const stuckRecordings = await LiveSession.find({
      status: 'ended',
      recordingStatus: 'recording'
    });
    
    console.log(`🔧 Found ${stuckRecordings.length} stuck recordings to fix`);
    
    for (const session of stuckRecordings) {
      if (session.recordingUrl) {
        session.recordingStatus = 'completed';
        console.log(`✅ Fixed stuck recording for session ${session._id} - marked as completed`);
      } else {
        session.recordingStatus = 'failed';
        console.log(`❌ Fixed stuck recording for session ${session._id} - marked as failed`);
      }
      
      await session.save();
    }
    
    console.log('✅ Recording status update completed');
    
  } catch (error) {
    console.error('❌ Error updating recording status:', error);
  }
}

// Main function
async function main() {
  await connectDB();
  await updateRecordingStatus();
  await mongoose.disconnect();
  console.log('👋 Disconnected from MongoDB');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { updateRecordingStatus };
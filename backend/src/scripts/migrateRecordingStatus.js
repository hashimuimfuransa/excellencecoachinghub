/**
 * Migration script to add recordingStatus field to existing LiveSession documents
 * Run this script once to update existing data
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coaching-hub';

async function migrateRecordingStatus() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const LiveSession = mongoose.model('LiveSession');

    // Find all sessions that don't have recordingStatus field
    const sessionsToUpdate = await LiveSession.find({
      recordingStatus: { $exists: false }
    });

    console.log(`📊 Found ${sessionsToUpdate.length} sessions to update`);

    if (sessionsToUpdate.length === 0) {
      console.log('✅ No sessions need updating');
      return;
    }

    // Update sessions based on their current state
    for (const session of sessionsToUpdate) {
      let newStatus = 'not_started';
      
      if (session.isRecorded && session.recordingUrl) {
        // Session has been recorded and has a URL - it's completed
        newStatus = 'completed';
      } else if (session.isRecorded && !session.recordingUrl) {
        // Session is marked as recorded but no URL - might be in progress or failed
        if (session.status === 'live') {
          newStatus = 'recording';
        } else {
          newStatus = 'failed';
        }
      }

      await LiveSession.updateOne(
        { _id: session._id },
        { $set: { recordingStatus: newStatus } }
      );

      console.log(`✅ Updated session ${session._id}: ${session.title} -> ${newStatus}`);
    }

    console.log(`🎉 Successfully updated ${sessionsToUpdate.length} sessions`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the migration
if (require.main === module) {
  migrateRecordingStatus()
    .then(() => {
      console.log('✅ Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = migrateRecordingStatus;

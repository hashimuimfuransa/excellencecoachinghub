/**
 * Quick Fix for Missing Audio Blob Issue
 * Run this in your browser console to recover your recording
 */

function quickFixRecording() {
  const STORAGE_KEY = 'interview_recordings';
  const AUDIO_STORAGE_KEY = 'interview_audio_blobs';
  
  try {
    console.log('🔧 Starting quick recording fix...');
    
    // Get all recordings and audio blobs
    const recordings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const audioBlobs = JSON.parse(localStorage.getItem(AUDIO_STORAGE_KEY) || '{}');
    
    console.log('📊 Found recordings:', recordings.length);
    console.log('📊 Found audio blob keys:', Object.keys(audioBlobs));
    
    // Find recordings without matching audio blobs
    const orphanedRecordings = recordings.filter(recording => !audioBlobs[recording.id]);
    const orphanedAudioKeys = Object.keys(audioBlobs).filter(key => !recordings.find(r => r.id === key));
    
    console.log('🔍 Orphaned recordings:', orphanedRecordings.map(r => r.id));
    console.log('🔍 Orphaned audio blobs:', orphanedAudioKeys);
    
    if (orphanedRecordings.length > 0 && orphanedAudioKeys.length > 0) {
      // Try to match by timestamp
      for (const recording of orphanedRecordings) {
        const recordingTimestamp = extractTimestamp(recording.id);
        let bestMatch = null;
        let smallestDiff = Infinity;
        
        for (const audioKey of orphanedAudioKeys) {
          const audioTimestamp = extractTimestamp(audioKey);
          if (audioTimestamp) {
            const diff = Math.abs(recordingTimestamp - audioTimestamp);
            if (diff < smallestDiff) {
              smallestDiff = diff;
              bestMatch = audioKey;
            }
          }
        }
        
        if (bestMatch && smallestDiff < 3600000) { // Within 1 hour
          console.log(`✅ Matching recording ${recording.id} with audio ${bestMatch} (diff: ${smallestDiff}ms)`);
          
          // Copy audio data to correct key
          audioBlobs[recording.id] = audioBlobs[bestMatch];
          
          // Update recording status
          recording.status = 'completed';
        }
      }
      
      // Save updated audio blobs
      localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(audioBlobs));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recordings));
      
      console.log('✅ Quick fix completed! Try refreshing your interview history.');
      return true;
    } else {
      console.log('ℹ️ No orphaned recordings or audio blobs found to fix.');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Quick fix failed:', error);
    return false;
  }
}

function extractTimestamp(recordingId) {
  const match = recordingId.match(/recording_(\d+)_/);
  return match ? parseInt(match[1], 10) : null;
}

// Run the fix
console.log('🔧 Running quick recording fix...');
const result = quickFixRecording();

if (result) {
  console.log(`
✅ Recording fix completed!

Next steps:
1. Refresh your interview history page
2. Your recording should now be playable
3. If you still have issues, check the browser console for any new errors

The fix matched orphaned recordings with orphaned audio blobs based on timestamp proximity.
`);
} else {
  console.log(`
ℹ️ No automatic fix could be applied.

Manual steps to try:
1. Check localStorage keys manually
2. Look for mismatched recording IDs
3. Consider re-recording if the audio data is truly lost

To manually inspect:
- localStorage.getItem('interview_recordings')
- localStorage.getItem('interview_audio_blobs')
`);
}
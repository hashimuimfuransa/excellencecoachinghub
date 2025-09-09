/**
 * Interview Recording Service - Enhanced Recovery and Error Handling
 * 
 * This file contains enhancements to fix the "No audio blob data found" issue
 * that occurs when recording metadata exists but audio blob is missing
 */

// Add these methods to the InterviewRecordingService class to fix the audio blob recovery issue

/**
 * Enhanced recovery method that fixes the audio blob mismatch issue
 * This method should replace or enhance the existing refreshRecordingAudio method
 */
export function enhancedRecoveryMethod() {
  return `
  /**
   * Enhanced recovery for missing audio blobs with smart ID matching
   */
  recoverMissingAudioBlob(recordingId: string): boolean {
    try {
      console.log('🔧 Attempting enhanced recovery for recording:', recordingId);
      
      // Get all available audio blob keys
      const audioBlobs = JSON.parse(localStorage.getItem(this.AUDIO_STORAGE_KEY) || '{}');
      const availableKeys = Object.keys(audioBlobs);
      
      if (availableKeys.length === 0) {
        console.log('❌ No audio blobs available for recovery');
        return false;
      }
      
      // Extract timestamp from the target recording ID
      const targetTimestamp = this.extractTimestamp(recordingId);
      if (!targetTimestamp) {
        console.log('❌ Could not extract timestamp from recording ID:', recordingId);
        return false;
      }
      
      // Find the closest matching audio blob by timestamp
      let bestMatch = null;
      let smallestTimeDiff = Infinity;
      
      for (const key of availableKeys) {
        const keyTimestamp = this.extractTimestamp(key);
        if (keyTimestamp) {
          const timeDiff = Math.abs(targetTimestamp - keyTimestamp);
          if (timeDiff < smallestTimeDiff) {
            smallestTimeDiff = timeDiff;
            bestMatch = key;
          }
        }
      }
      
      if (bestMatch && smallestTimeDiff < 300000) { // Within 5 minutes
        console.log(\`✅ Found potential match: \${bestMatch} (time diff: \${smallestTimeDiff}ms)\`);
        
        // Copy the audio data to the correct recording ID
        const audioData = audioBlobs[bestMatch];
        audioBlobs[recordingId] = audioData;
        localStorage.setItem(this.AUDIO_STORAGE_KEY, JSON.stringify(audioBlobs));
        
        console.log('✅ Successfully recovered audio blob for recording:', recordingId);
        return true;
      }
      
      console.log('❌ No suitable match found for recovery');
      return false;
    } catch (error) {
      console.error('❌ Error during enhanced recovery:', error);
      return false;
    }
  }
  
  /**
   * Extract timestamp from recording ID
   */
  private extractTimestamp(recordingId: string): number | null {
    try {
      const match = recordingId.match(/recording_(\d+)_/);
      return match ? parseInt(match[1], 10) : null;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Enhanced refresh method with better recovery
   */
  enhancedRefreshRecordingAudio(recordingId: string): boolean {
    try {
      console.log('🔄 Enhanced refresh for recording:', recordingId);
      
      const recording = this.getRecording(recordingId);
      if (!recording) {
        console.error('❌ Recording not found:', recordingId);
        return false;
      }

      // First try normal audio blob loading
      let audioBlob = this.loadAudioBlob(recordingId);
      
      if (!audioBlob) {
        console.log('🔧 Normal loading failed, attempting recovery...');
        
        // Try enhanced recovery
        if (this.recoverMissingAudioBlob(recordingId)) {
          // Try loading again after recovery
          audioBlob = this.loadAudioBlob(recordingId);
        }
      }
      
      if (audioBlob) {
        console.log('✅ Audio blob recovered, size:', audioBlob.size);
        
        // Update recording with recovered blob
        recording.audioBlob = audioBlob;
        const newUrl = URL.createObjectURL(audioBlob);
        recording.audioUrl = newUrl;
        
        // Save the updated recording
        this.saveRecording(recording);
        
        console.log('✅ Recording successfully refreshed with audio:', newUrl);
        return true;
      } else {
        console.error('❌ Could not recover audio blob for recording:', recordingId);
        this.debugStorageContents(recordingId);
        return false;
      }
    } catch (error) {
      console.error('❌ Error in enhanced refresh:', error);
      return false;
    }
  }
  
  /**
   * Preventive method to ensure audio blob is saved with correct ID
   */
  private async ensureAudioBlobSaved(recordingId: string, audioBlob: Blob): Promise<boolean> {
    try {
      console.log('🔒 Ensuring audio blob is saved for recording:', recordingId);
      
      // Save the audio blob
      await this.saveAudioBlob(recordingId, audioBlob);
      
      // Immediately verify it was saved
      const verificationBlob = this.loadAudioBlob(recordingId);
      
      if (verificationBlob && verificationBlob.size === audioBlob.size) {
        console.log('✅ Audio blob verified saved correctly');
        return true;
      } else {
        console.error('❌ Audio blob verification failed');
        
        // Retry once
        console.log('🔄 Retrying audio blob save...');
        await this.saveAudioBlob(recordingId, audioBlob);
        
        const retryVerification = this.loadAudioBlob(recordingId);
        if (retryVerification && retryVerification.size === audioBlob.size) {
          console.log('✅ Audio blob saved successfully on retry');
          return true;
        } else {
          console.error('❌ Audio blob save failed even on retry');
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Error ensuring audio blob save:', error);
      return false;
    }
  }`;
}

/**
 * Enhanced finalize recording method to prevent the audio blob loss issue
 */
export function enhancedFinalizeMethod() {
  return `
  /**
   * Enhanced finalize recording with better error handling and verification
   */
  private async enhancedFinalizeRecording(): Promise<InterviewRecording | null> {
    if (!this.currentRecording) {
      return null;
    }

    const recordingId = this.currentRecording.id;
    console.log('🎯 Enhanced finalization for recording:', recordingId);

    try {
      // Create audio blob from chunks
      if (this.audioChunks.length > 0) {
        console.log('🎵 Creating audio blob from', this.audioChunks.length, 'chunks');
        
        const totalSize = this.audioChunks.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('📊 Total audio size:', totalSize, 'bytes');
        
        if (totalSize === 0) {
          console.error('❌ No audio data in chunks');
          this.currentRecording.status = 'processing'; // Mark as failed
          this.saveRecording(this.currentRecording);
          return this.currentRecording;
        }
        
        const audioBlob = new Blob(this.audioChunks, { 
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        
        if (audioBlob.size === 0) {
          console.error('❌ Created audio blob is empty');
          this.currentRecording.status = 'processing'; // Mark as failed
          this.saveRecording(this.currentRecording);
          return this.currentRecording;
        }
        
        console.log('✅ Audio blob created, size:', audioBlob.size, 'type:', audioBlob.type);
        
        // Use enhanced save method with verification
        const savedSuccessfully = await this.ensureAudioBlobSaved(recordingId, audioBlob);
        
        if (savedSuccessfully) {
          const audioUrl = URL.createObjectURL(audioBlob);
          
          this.currentRecording.audioBlob = audioBlob;
          this.currentRecording.audioUrl = audioUrl;
          this.currentRecording.status = 'completed';
          
          console.log('✅ Enhanced finalization completed successfully');
        } else {
          console.error('❌ Failed to save audio blob, marking as processing');
          this.currentRecording.status = 'processing'; // Mark for retry
        }
        
      } else {
        console.warn('⚠️ No audio chunks available');
        this.currentRecording.status = 'processing'; // Mark as incomplete
      }
      
      // Calculate duration
      this.currentRecording.duration = Date.now() - this.currentRecording.timestamp.getTime();
      
      // Save final recording state
      this.saveRecording(this.currentRecording);
      
      const finalizedRecording = { ...this.currentRecording };
      this.currentRecording = null;
      this.audioChunks = [];
      
      return finalizedRecording;
      
    } catch (error) {
      console.error('❌ Enhanced finalization failed:', error);
      
      if (this.currentRecording) {
        this.currentRecording.status = 'processing'; // Mark as failed but recoverable
        this.saveRecording(this.currentRecording);
        
        const failedRecording = { ...this.currentRecording };
        this.currentRecording = null;
        this.audioChunks = [];
        
        return failedRecording;
      }
      
      return null;
    }
  }`;
}

/**
 * Method to repair existing corrupted recordings
 */
export function repairExistingRecordings() {
  return `
  /**
   * Repair method to fix existing recordings with missing audio blobs
   */
  repairExistingRecordings(): { repaired: number; failed: number } {
    console.log('🔧 Starting repair of existing recordings...');
    
    const recordings = this.getRecordings();
    let repairedCount = 0;
    let failedCount = 0;
    
    for (const recording of recordings) {
      if (recording.status === 'completed' && !this.loadAudioBlob(recording.id)) {
        console.log(\`🔧 Attempting to repair recording: \${recording.id}\`);
        
        if (this.recoverMissingAudioBlob(recording.id)) {
          repairedCount++;
          console.log(\`✅ Successfully repaired recording: \${recording.id}\`);
        } else {
          failedCount++;
          console.log(\`❌ Could not repair recording: \${recording.id}\`);
          
          // Mark as processing so user knows there's an issue
          recording.status = 'processing';
          this.saveRecording(recording);
        }
      }
    }
    
    console.log(\`🔧 Repair complete. Repaired: \${repairedCount}, Failed: \${failedCount}\`);
    return { repaired: repairedCount, failed: failedCount };
  }`;
}

console.log(`
🔧 Interview Recording Service Fix

This file contains enhanced methods to fix the "No audio blob data found" issue.

Key improvements:
1. Enhanced recovery method that matches recordings by timestamp
2. Better verification during audio blob saving
3. Repair method for existing corrupted recordings
4. Improved error handling and logging

To implement these fixes:
1. Add these methods to your InterviewRecordingService class
2. Replace the existing finalizeRecording method with enhancedFinalizeRecording
3. Replace refreshRecordingAudio with enhancedRefreshRecordingAudio
4. Run repairExistingRecordings() to fix existing broken recordings

The main issue was that recording IDs could get mismatched during the async recording process,
and there was insufficient verification that audio blobs were actually saved.
`);
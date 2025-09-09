/**
 * Recording Migration Service
 * 
 * Migrates recordings from the old localStorage-based system 
 * to the new IndexedDB-based system
 */

import { modernInterviewRecordingService, InterviewRecording } from './modernInterviewRecordingService';

interface OldRecording {
  id: string;
  sessionId: string;
  jobTitle: string;
  companyName: string;
  timestamp: Date | string;
  duration: number;
  questions: any[];
  status: string;
  audioBlob?: Blob;
  audioUrl?: string;
}

class RecordingMigrationService {
  private readonly OLD_STORAGE_KEY = 'interview_recordings';
  private readonly OLD_AUDIO_STORAGE_KEY = 'interview_audio_blobs';

  /**
   * Check if migration is needed
   */
  async needsMigration(): Promise<boolean> {
    try {
      // Check if old data exists
      const oldRecordings = this.getOldRecordings();
      const oldAudioBlobs = this.getOldAudioBlobs();
      
      if (oldRecordings.length === 0 && Object.keys(oldAudioBlobs).length === 0) {
        return false;
      }

      // Check if new system has any data
      const newRecordings = await modernInterviewRecordingService.getRecordings();
      
      // If old data exists and new system is empty, migration is needed
      return oldRecordings.length > 0 && newRecordings.length === 0;

    } catch (error) {
      console.error('❌ Error checking migration status:', error);
      return false;
    }
  }

  /**
   * Perform migration from old system to new system
   */
  async migrate(): Promise<{ success: boolean; migrated: number; failed: number; errors: string[] }> {
    console.log('🔄 Starting recording migration...');
    
    const result = {
      success: false,
      migrated: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // Initialize new service
      await modernInterviewRecordingService.initialize();

      // Get old data
      const oldRecordings = this.getOldRecordings();
      const oldAudioBlobs = this.getOldAudioBlobs();

      console.log(`📊 Found ${oldRecordings.length} old recordings and ${Object.keys(oldAudioBlobs).length} audio blobs`);

      if (oldRecordings.length === 0) {
        console.log('✅ No recordings to migrate');
        result.success = true;
        return result;
      }

      // Migrate each recording
      for (const oldRecording of oldRecordings) {
        try {
          const migrated = await this.migrateRecording(oldRecording, oldAudioBlobs);
          if (migrated) {
            result.migrated++;
            console.log(`✅ Migrated recording: ${oldRecording.id}`);
          } else {
            result.failed++;
            result.errors.push(`Failed to migrate recording: ${oldRecording.id}`);
          }
        } catch (error: any) {
          result.failed++;
          result.errors.push(`Error migrating ${oldRecording.id}: ${error.message}`);
          console.error(`❌ Failed to migrate recording ${oldRecording.id}:`, error);
        }
      }

      result.success = result.migrated > 0 || result.failed === 0;
      console.log(`🎉 Migration completed: ${result.migrated} migrated, ${result.failed} failed`);

      // If migration was successful, offer to clean up old data
      if (result.success && result.migrated > 0) {
        console.log('💡 Migration successful. You can now clean up old data using cleanupOldData()');
      }

      return result;

    } catch (error: any) {
      console.error('❌ Migration failed:', error);
      result.errors.push(`Migration failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Migrate a single recording
   */
  private async migrateRecording(oldRecording: OldRecording, audioBlobs: Record<string, string>): Promise<boolean> {
    try {
      // Convert old recording format to new format
      const newRecording: InterviewRecording = {
        id: oldRecording.id,
        sessionId: oldRecording.sessionId,
        jobTitle: oldRecording.jobTitle,
        companyName: oldRecording.companyName,
        timestamp: typeof oldRecording.timestamp === 'string' 
          ? new Date(oldRecording.timestamp) 
          : oldRecording.timestamp,
        duration: oldRecording.duration,
        questions: oldRecording.questions || [],
        status: this.normalizeStatus(oldRecording.status),
        metadata: {
          fileSize: 0,
          mimeType: 'audio/webm'
        }
      };

      // Try to get audio blob data
      let audioBlob: Blob | null = null;
      
      // First try direct ID match
      const audioDataUrl = audioBlobs[oldRecording.id];
      if (audioDataUrl) {
        audioBlob = this.dataUrlToBlob(audioDataUrl);
      } else {
        // Try to find by timestamp matching (like the old recovery method)
        const matchingAudioKey = this.findMatchingAudioKey(oldRecording.id, audioBlobs);
        if (matchingAudioKey) {
          console.log(`🔧 Found matching audio for ${oldRecording.id}: ${matchingAudioKey}`);
          audioBlob = this.dataUrlToBlob(audioBlobs[matchingAudioKey]);
        }
      }

      if (audioBlob) {
        newRecording.metadata.fileSize = audioBlob.size;
        newRecording.metadata.mimeType = audioBlob.type || 'audio/webm';
        
        // Save to new system
        await this.saveToNewSystem(newRecording, audioBlob);
        return true;
      } else {
        console.warn(`⚠️ No audio data found for recording: ${oldRecording.id}`);
        
        // Save recording metadata only (without audio)
        newRecording.status = 'failed';
        await this.saveMetadataOnly(newRecording);
        return false;
      }

    } catch (error) {
      console.error(`❌ Error migrating recording ${oldRecording.id}:`, error);
      return false;
    }
  }

  /**
   * Save recording with audio to new system
   */
  private async saveToNewSystem(recording: InterviewRecording, audioBlob: Blob): Promise<void> {
    // We need to use the internal save method, so let's create a temporary service method
    // For now, we'll create the recording in the new system by temporarily setting it as current
    // This is a bit of a hack, but it's the cleanest way to reuse the existing save logic

    const service = modernInterviewRecordingService as any;
    
    // Temporarily store the audio blob and create URL
    recording.audioBlob = audioBlob;
    recording.audioUrl = URL.createObjectURL(audioBlob);

    // Save using the service's internal method
    await service.saveRecordingComplete(recording, audioBlob);
  }

  /**
   * Save recording metadata only (no audio)
   */
  private async saveMetadataOnly(recording: InterviewRecording): Promise<void> {
    const service = modernInterviewRecordingService as any;
    await service.saveRecordingMetadata(recording);
  }

  /**
   * Get old recordings from localStorage
   */
  private getOldRecordings(): OldRecording[] {
    try {
      const data = localStorage.getItem(this.OLD_STORAGE_KEY);
      if (!data) return [];
      
      const recordings = JSON.parse(data);
      return Array.isArray(recordings) ? recordings : [];
    } catch (error) {
      console.error('❌ Failed to get old recordings:', error);
      return [];
    }
  }

  /**
   * Get old audio blobs from localStorage
   */
  private getOldAudioBlobs(): Record<string, string> {
    try {
      const data = localStorage.getItem(this.OLD_AUDIO_STORAGE_KEY);
      if (!data) return {};
      
      const audioBlobs = JSON.parse(data);
      return typeof audioBlobs === 'object' ? audioBlobs : {};
    } catch (error) {
      console.error('❌ Failed to get old audio blobs:', error);
      return {};
    }
  }

  /**
   * Find matching audio key by timestamp
   */
  private findMatchingAudioKey(recordingId: string, audioBlobs: Record<string, string>): string | null {
    const targetTimestamp = this.extractTimestamp(recordingId);
    if (!targetTimestamp) return null;

    let bestMatch = null;
    let smallestDiff = Infinity;

    for (const audioKey of Object.keys(audioBlobs)) {
      const audioTimestamp = this.extractTimestamp(audioKey);
      if (audioTimestamp) {
        const diff = Math.abs(targetTimestamp - audioTimestamp);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          bestMatch = audioKey;
        }
      }
    }

    // Accept matches within 1 hour (3600000 ms)
    return bestMatch && smallestDiff < 3600000 ? bestMatch : null;
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
   * Convert data URL to Blob
   */
  private dataUrlToBlob(dataUrl: string): Blob | null {
    try {
      const [header, data] = dataUrl.split(',');
      if (!data || data.length === 0) {
        throw new Error('Empty audio data');
      }

      const mimeMatch = header.match(/data:([^;]+)/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'audio/webm';

      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return new Blob([bytes], { type: mimeType });

    } catch (error) {
      console.error('❌ Failed to convert data URL to blob:', error);
      return null;
    }
  }

  /**
   * Normalize recording status
   */
  private normalizeStatus(status: string): 'recording' | 'processing' | 'completed' | 'failed' {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'recording':
        return 'recording';
      case 'processing':
        return 'processing';
      case 'failed':
      case 'error':
        return 'failed';
      default:
        return 'completed'; // Default for old recordings
    }
  }

  /**
   * Clean up old data after successful migration
   */
  cleanupOldData(): void {
    try {
      localStorage.removeItem(this.OLD_STORAGE_KEY);
      localStorage.removeItem(this.OLD_AUDIO_STORAGE_KEY);
      console.log('🧹 Old recording data cleaned up from localStorage');
    } catch (error) {
      console.error('❌ Failed to cleanup old data:', error);
    }
  }

  /**
   * Get migration status and statistics
   */
  async getMigrationStatus(): Promise<{
    needsMigration: boolean;
    oldRecordings: number;
    newRecordings: number;
    oldAudioBlobs: number;
  }> {
    try {
      const oldRecordings = this.getOldRecordings();
      const oldAudioBlobs = this.getOldAudioBlobs();
      const newRecordings = await modernInterviewRecordingService.getRecordings();

      return {
        needsMigration: await this.needsMigration(),
        oldRecordings: oldRecordings.length,
        newRecordings: newRecordings.length,
        oldAudioBlobs: Object.keys(oldAudioBlobs).length
      };
    } catch (error) {
      console.error('❌ Failed to get migration status:', error);
      return {
        needsMigration: false,
        oldRecordings: 0,
        newRecordings: 0,
        oldAudioBlobs: 0
      };
    }
  }
}

// Export singleton instance
export const recordingMigrationService = new RecordingMigrationService();
export default recordingMigrationService;
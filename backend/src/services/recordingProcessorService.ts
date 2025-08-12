import { HMSVideoService } from './hmsVideoService';
import { LiveSession } from '../models/LiveSession';
import { v2 as cloudinary } from 'cloudinary';

export class RecordingProcessorService {
  private hmsVideoService: HMSVideoService;
  private processingJobs: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.hmsVideoService = new HMSVideoService();
  }

  /**
   * Start processing a recording in the background
   */
  async startRecordingProcessing(sessionId: string, recordingId: string): Promise<void> {
    console.log(`🎬 Starting background recording processing for session: ${sessionId}, recording: ${recordingId}`);

    // Clear any existing job for this session
    if (this.processingJobs.has(sessionId)) {
      clearTimeout(this.processingJobs.get(sessionId)!);
      this.processingJobs.delete(sessionId);
    }

    // Start the processing job
    const timeoutId = setTimeout(async () => {
      try {
        await this.processRecording(sessionId, recordingId);
      } catch (error) {
        console.error(`❌ Error in background recording processing for session ${sessionId}:`, error);
      } finally {
        this.processingJobs.delete(sessionId);
      }
    }, 5000); // Start processing after 5 seconds

    this.processingJobs.set(sessionId, timeoutId);
  }

  /**
   * Process a recording: wait for completion, upload to Cloudinary, update session
   */
  private async processRecording(sessionId: string, recordingId: string): Promise<void> {
    try {
      console.log(`🔄 Processing recording for session: ${sessionId}`);

      // Find the session
      const session = await LiveSession.findById(sessionId);
      if (!session) {
        console.error(`❌ Session not found: ${sessionId}`);
        return;
      }

      // Wait for recording to complete (max 10 minutes)
      const result = await this.hmsVideoService.waitForRecordingCompletion(recordingId, 600000);

      if (result.status === 'completed' && result.recordingUrl) {
        console.log(`✅ Recording completed, uploading to Cloudinary: ${result.recordingUrl}`);

        // Upload to Cloudinary
        const cloudinaryResult = await this.uploadToCloudinary(result.recordingUrl, sessionId);

        // Update session with final recording details
        session.recordingUrl = cloudinaryResult.secure_url;
        session.recordingStatus = 'completed';
        session.recordingSize = cloudinaryResult.bytes;
        
        await session.save();

        console.log(`✅ Recording processing completed for session: ${sessionId}`);
        console.log(`📹 Final recording URL: ${cloudinaryResult.secure_url}`);

      } else if (result.status === 'failed') {
        console.log(`❌ Recording failed for session: ${sessionId}`);
        session.recordingStatus = 'failed';
        await session.save();

      } else {
        console.log(`⏰ Recording processing timeout for session: ${sessionId}`);
        session.recordingStatus = 'processing';
        await session.save();

        // Retry processing later
        setTimeout(() => {
          this.processRecording(sessionId, recordingId);
        }, 300000); // Retry in 5 minutes
      }

    } catch (error) {
      console.error(`❌ Error processing recording for session ${sessionId}:`, error);
      
      // Update session to failed status
      try {
        const session = await LiveSession.findById(sessionId);
        if (session) {
          session.recordingStatus = 'failed';
          await session.save();
        }
      } catch (updateError) {
        console.error(`❌ Error updating session status:`, updateError);
      }
    }
  }

  /**
   * Upload recording to Cloudinary
   */
  private async uploadToCloudinary(recordingUrl: string, sessionId: string): Promise<any> {
    try {
      console.log(`☁️ Uploading recording to Cloudinary: ${recordingUrl}`);

      const result = await cloudinary.uploader.upload(recordingUrl, {
        resource_type: 'video',
        folder: 'live-session-recordings',
        public_id: `session_${sessionId}_${Date.now()}`,
        format: 'mp4',
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      console.log(`✅ Successfully uploaded to Cloudinary: ${result.secure_url}`);
      return result;

    } catch (error) {
      console.error(`❌ Error uploading to Cloudinary:`, error);
      throw error;
    }
  }

  /**
   * Cancel processing for a session
   */
  cancelProcessing(sessionId: string): void {
    if (this.processingJobs.has(sessionId)) {
      clearTimeout(this.processingJobs.get(sessionId)!);
      this.processingJobs.delete(sessionId);
      console.log(`🚫 Cancelled recording processing for session: ${sessionId}`);
    }
  }

  /**
   * Get processing status
   */
  isProcessing(sessionId: string): boolean {
    return this.processingJobs.has(sessionId);
  }

  /**
   * Clean up all processing jobs
   */
  cleanup(): void {
    for (const [sessionId, timeoutId] of this.processingJobs) {
      clearTimeout(timeoutId);
      console.log(`🧹 Cleaned up processing job for session: ${sessionId}`);
    }
    this.processingJobs.clear();
  }
}

// Export singleton instance
export const recordingProcessorService = new RecordingProcessorService();
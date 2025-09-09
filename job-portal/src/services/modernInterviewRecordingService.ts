/**
 * Modern Interview Recording Service
 * 
 * New approach using IndexedDB for better reliability, performance, and storage management
 * Replaces the localStorage-based system that had ID mismatch issues
 */

export interface InterviewQuestion {
  question: string;
  answer: string;
  duration: number;
}

export interface InterviewRecording {
  id: string;
  sessionId: string;
  jobTitle: string;
  companyName: string;
  timestamp: Date;
  duration: number;
  questions: InterviewQuestion[];
  status: 'recording' | 'processing' | 'completed' | 'failed';
  audioBlob?: Blob;
  audioUrl?: string;
  metadata: {
    fileSize: number;
    mimeType: string;
    sampleRate?: number;
    channels?: number;
  };
}

class ModernInterviewRecordingService {
  private db: IDBDatabase | null = null;
  private currentRecording: InterviewRecording | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private readonly DB_NAME = 'InterviewRecordingsDB';
  private readonly DB_VERSION = 1;
  private readonly RECORDINGS_STORE = 'recordings';
  private readonly AUDIO_STORE = 'audioData';

  /**
   * Initialize the service and database
   */
  async initialize(): Promise<boolean> {
    try {
      console.log('🚀 Initializing Modern Interview Recording Service...');
      
      await this.initializeDatabase();
      await this.cleanupOrphanedData();
      
      console.log('✅ Modern Interview Recording Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Modern Interview Recording Service:', error);
      return false;
    }
  }

  /**
   * Initialize IndexedDB database
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB database');
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        // Create recordings store
        if (!db.objectStoreNames.contains(this.RECORDINGS_STORE)) {
          const recordingsStore = db.createObjectStore(this.RECORDINGS_STORE, { keyPath: 'id' });
          recordingsStore.createIndex('timestamp', 'timestamp', { unique: false });
          recordingsStore.createIndex('sessionId', 'sessionId', { unique: false });
          recordingsStore.createIndex('status', 'status', { unique: false });
        }

        // Create audio data store
        if (!db.objectStoreNames.contains(this.AUDIO_STORE)) {
          const audioStore = db.createObjectStore(this.AUDIO_STORE, { keyPath: 'recordingId' });
        }

        console.log('✅ Database schema created/updated');
      };
    });
  }

  /**
   * Generate a unique recording ID with timestamp
   */
  private generateRecordingId(): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 10);
    return `recording_${timestamp}_${randomId}`;
  }

  /**
   * Start recording interview
   */
  async startRecording(
    sessionId: string,
    jobTitle: string,
    companyName: string,
    questions: InterviewQuestion[] = []
  ): Promise<InterviewRecording | null> {
    try {
      if (this.currentRecording) {
        throw new Error('Recording already in progress');
      }

      console.log('🎙️ Starting interview recording...');

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      // Create recording object with guaranteed unique ID
      const recordingId = this.generateRecordingId();
      this.currentRecording = {
        id: recordingId,
        sessionId,
        jobTitle,
        companyName,
        timestamp: new Date(),
        duration: 0,
        questions,
        status: 'recording',
        metadata: {
          fileSize: 0,
          mimeType: 'audio/webm',
          channels: 1,
          sampleRate: 44100
        }
      };

      // Setup MediaRecorder with optimal settings
      const mimeType = this.getBestMimeType();
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000 // 128kbps for good quality/size balance
      });

      this.audioChunks = [];

      // Handle data chunks
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('📊 Audio chunk received, size:', event.data.size);
        }
      };

      // Handle recording stop
      this.mediaRecorder.onstop = async () => {
        console.log('⏹️ Recording stopped, processing audio...');
        await this.finalizeRecording();
      };

      // Handle errors
      this.mediaRecorder.onerror = (event: any) => {
        console.error('❌ MediaRecorder error:', event.error);
        if (this.currentRecording) {
          this.currentRecording.status = 'failed';
        }
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      
      // Save initial recording metadata
      await this.saveRecordingMetadata(this.currentRecording);
      
      console.log('✅ Recording started successfully:', recordingId);
      return this.currentRecording;

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      this.currentRecording = null;
      return null;
    }
  }

  /**
   * Stop recording
   */
  async stopRecording(): Promise<InterviewRecording | null> {
    try {
      if (!this.currentRecording || !this.mediaRecorder) {
        throw new Error('No active recording to stop');
      }

      console.log('⏹️ Stopping recording...');
      
      // Stop MediaRecorder (this will trigger onstop event)
      this.mediaRecorder.stop();
      
      // Stop all tracks to release microphone
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      
      return this.currentRecording;

    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      return null;
    }
  }

  /**
   * Finalize recording - process audio data and save everything atomically
   */
  private async finalizeRecording(): Promise<void> {
    if (!this.currentRecording) {
      console.error('❌ No current recording to finalize');
      return;
    }

    const recordingId = this.currentRecording.id;
    console.log('🎯 Finalizing recording:', recordingId);

    try {
      // Create audio blob from chunks
      if (this.audioChunks.length === 0) {
        throw new Error('No audio data captured');
      }

      const mimeType = this.getBestMimeType();
      const audioBlob = new Blob(this.audioChunks, { type: mimeType });
      
      if (audioBlob.size === 0) {
        throw new Error('Audio blob is empty');
      }

      console.log('📊 Audio blob created:', {
        size: audioBlob.size,
        type: audioBlob.type,
        chunks: this.audioChunks.length
      });

      // Update recording with final data
      this.currentRecording.duration = Date.now() - this.currentRecording.timestamp.getTime();
      this.currentRecording.audioBlob = audioBlob;
      this.currentRecording.audioUrl = URL.createObjectURL(audioBlob);
      this.currentRecording.metadata = {
        fileSize: audioBlob.size,
        mimeType: audioBlob.type,
        channels: 1,
        sampleRate: 44100
      };
      this.currentRecording.status = 'completed';

      // Save everything atomically using a transaction
      await this.saveRecordingComplete(this.currentRecording, audioBlob);

      console.log('✅ Recording finalized successfully:', recordingId);

    } catch (error) {
      console.error('❌ Failed to finalize recording:', error);
      
      if (this.currentRecording) {
        this.currentRecording.status = 'failed';
        await this.saveRecordingMetadata(this.currentRecording);
      }
    } finally {
      // Cleanup
      this.audioChunks = [];
      this.mediaRecorder = null;
      this.currentRecording = null;
    }
  }

  /**
   * Save complete recording (metadata + audio) in a single atomic transaction
   */
  private async saveRecordingComplete(recording: InterviewRecording, audioBlob: Blob): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.RECORDINGS_STORE, this.AUDIO_STORE], 'readwrite');
      let operationsCompleted = 0;
      const expectedOperations = 2;

      transaction.onerror = () => {
        console.error('❌ Transaction failed:', transaction.error);
        reject(new Error('Failed to save recording'));
      };

      transaction.oncomplete = () => {
        console.log('✅ Recording saved atomically');
        resolve();
      };

      // Save recording metadata (without blob to avoid circular reference)
      const recordingForStorage = { ...recording };
      delete recordingForStorage.audioBlob;
      delete recordingForStorage.audioUrl;

      const recordingStore = transaction.objectStore(this.RECORDINGS_STORE);
      const recordingRequest = recordingStore.put(recordingForStorage);
      
      recordingRequest.onsuccess = () => {
        operationsCompleted++;
        console.log('✅ Recording metadata saved');
      };

      recordingRequest.onerror = () => {
        console.error('❌ Failed to save recording metadata');
        reject(new Error('Failed to save recording metadata'));
      };

      // Save audio data
      const audioStore = transaction.objectStore(this.AUDIO_STORE);
      const audioRequest = audioStore.put({
        recordingId: recording.id,
        audioBlob: audioBlob,
        timestamp: recording.timestamp,
        size: audioBlob.size,
        mimeType: audioBlob.type
      });

      audioRequest.onsuccess = () => {
        operationsCompleted++;
        console.log('✅ Audio data saved');
      };

      audioRequest.onerror = () => {
        console.error('❌ Failed to save audio data');
        reject(new Error('Failed to save audio data'));
      };
    });
  }

  /**
   * Save recording metadata only
   */
  private async saveRecordingMetadata(recording: InterviewRecording): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.RECORDINGS_STORE], 'readwrite');
      const store = transaction.objectStore(this.RECORDINGS_STORE);
      
      // Don't store blob/url in metadata
      const recordingForStorage = { ...recording };
      delete recordingForStorage.audioBlob;
      delete recordingForStorage.audioUrl;

      const request = store.put(recordingForStorage);

      request.onsuccess = () => {
        console.log('✅ Recording metadata saved');
        resolve();
      };

      request.onerror = () => {
        console.error('❌ Failed to save recording metadata');
        reject(new Error('Failed to save recording metadata'));
      };
    });
  }

  /**
   * Get all recordings
   */
  async getRecordings(): Promise<InterviewRecording[]> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.RECORDINGS_STORE], 'readonly');
      const store = transaction.objectStore(this.RECORDINGS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const recordings = request.result.map((recording: any) => ({
          ...recording,
          timestamp: new Date(recording.timestamp)
        }));
        resolve(recordings);
      };

      request.onerror = () => {
        console.error('❌ Failed to get recordings');
        reject(new Error('Failed to get recordings'));
      };
    });
  }

  /**
   * Get recording by ID with audio data
   */
  async getRecording(recordingId: string): Promise<InterviewRecording | null> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      // Get recording metadata
      const recording = await this.getRecordingMetadata(recordingId);
      if (!recording) {
        return null;
      }

      // Get audio data
      const audioData = await this.getAudioData(recordingId);
      if (audioData) {
        recording.audioBlob = audioData.audioBlob;
        recording.audioUrl = URL.createObjectURL(audioData.audioBlob);
      }

      return recording;

    } catch (error) {
      console.error('❌ Failed to get recording:', error);
      return null;
    }
  }

  /**
   * Get recording metadata only
   */
  private async getRecordingMetadata(recordingId: string): Promise<InterviewRecording | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.RECORDINGS_STORE], 'readonly');
      const store = transaction.objectStore(this.RECORDINGS_STORE);
      const request = store.get(recordingId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            ...result,
            timestamp: new Date(result.timestamp)
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('❌ Failed to get recording metadata');
        reject(new Error('Failed to get recording metadata'));
      };
    });
  }

  /**
   * Get audio data for recording
   */
  private async getAudioData(recordingId: string): Promise<{ audioBlob: Blob; size: number; mimeType: string } | null> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.AUDIO_STORE], 'readonly');
      const store = transaction.objectStore(this.AUDIO_STORE);
      const request = store.get(recordingId);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.audioBlob) {
          resolve({
            audioBlob: result.audioBlob,
            size: result.size,
            mimeType: result.mimeType
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('❌ Failed to get audio data');
        reject(new Error('Failed to get audio data'));
      };
    });
  }

  /**
   * Delete recording
   */
  async deleteRecording(recordingId: string): Promise<boolean> {
    if (!this.db) {
      await this.initialize();
    }

    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.RECORDINGS_STORE, this.AUDIO_STORE], 'readwrite');

        transaction.oncomplete = () => {
          console.log('✅ Recording deleted successfully');
          resolve(true);
        };

        transaction.onerror = () => {
          console.error('❌ Failed to delete recording');
          reject(new Error('Failed to delete recording'));
        };

        // Delete recording metadata
        const recordingStore = transaction.objectStore(this.RECORDINGS_STORE);
        recordingStore.delete(recordingId);

        // Delete audio data
        const audioStore = transaction.objectStore(this.AUDIO_STORE);
        audioStore.delete(recordingId);
      });

    } catch (error) {
      console.error('❌ Error deleting recording:', error);
      return false;
    }
  }

  /**
   * Get best available MIME type for recording
   */
  private getBestMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/mpeg'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('✅ Using MIME type:', type);
        return type;
      }
    }

    console.warn('⚠️ No optimal MIME type supported, using default');
    return 'audio/webm';
  }

  /**
   * Clean up orphaned data
   */
  private async cleanupOrphanedData(): Promise<void> {
    try {
      const recordings = await this.getRecordings();
      const recordingIds = new Set(recordings.map(r => r.id));

      // Get all audio data keys
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([this.AUDIO_STORE], 'readwrite');
        const audioStore = transaction.objectStore(this.AUDIO_STORE);
        const request = audioStore.getAllKeys();

        request.onsuccess = () => {
          const audioKeys = request.result;
          let deletedCount = 0;

          audioKeys.forEach(key => {
            if (!recordingIds.has(key as string)) {
              audioStore.delete(key);
              deletedCount++;
            }
          });

          if (deletedCount > 0) {
            console.log(`🧹 Cleaned up ${deletedCount} orphaned audio records`);
          }

          resolve();
        };
      });

    } catch (error) {
      console.warn('⚠️ Could not cleanup orphaned data:', error);
    }
  }

  /**
   * Get current recording
   */
  getCurrentRecording(): InterviewRecording | null {
    return this.currentRecording;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.currentRecording !== null && this.currentRecording.status === 'recording';
  }

  /**
   * Get storage usage info
   */
  async getStorageInfo(): Promise<{ usedSpace: number; recordings: number }> {
    try {
      const recordings = await this.getRecordings();
      let totalSize = 0;

      for (const recording of recordings) {
        totalSize += recording.metadata.fileSize || 0;
      }

      return {
        usedSpace: totalSize,
        recordings: recordings.length
      };

    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      return { usedSpace: 0, recordings: 0 };
    }
  }

  /**
   * Clear all data (for testing/reset)
   */
  async clearAllData(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.RECORDINGS_STORE, this.AUDIO_STORE], 'readwrite');

      transaction.oncomplete = () => {
        console.log('🧹 All recording data cleared');
        resolve();
      };

      transaction.onerror = () => {
        console.error('❌ Failed to clear data');
        reject(new Error('Failed to clear data'));
      };

      // Clear both stores
      transaction.objectStore(this.RECORDINGS_STORE).clear();
      transaction.objectStore(this.AUDIO_STORE).clear();
    });
  }
}

// Export singleton instance
export const modernInterviewRecordingService = new ModernInterviewRecordingService();

// Auto-initialize on import
modernInterviewRecordingService.initialize().catch(error => {
  console.error('Failed to auto-initialize Modern Interview Recording Service:', error);
});

export default modernInterviewRecordingService;
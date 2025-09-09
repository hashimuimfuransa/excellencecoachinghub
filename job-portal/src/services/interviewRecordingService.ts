/**
 * Interview Recording Service
 * Handles recording, storage, and playback of interview sessions
 */

export interface InterviewRecording {
  id: string;
  sessionId: string;
  userId: string;
  jobTitle: string;
  jobId: string;
  company?: string;
  duration: number; // in milliseconds
  audioBlob?: Blob;
  audioUrl?: string;
  videoBlob?: Blob;
  videoUrl?: string;
  timestamp: Date;
  questions: RecordedQuestion[];
  overallScore?: number;
  feedback?: string;
  status: 'recording' | 'completed' | 'processing';
}

export interface RecordedQuestion {
  id: string;
  question: string;
  answer: string;
  audioBlob?: Blob;
  audioUrl?: string;
  duration: number;
  timestamp: Date;
  score?: number;
  feedback?: string;
}

class InterviewRecordingService {
  private readonly STORAGE_KEY = 'interview_recordings';
  private readonly AUDIO_STORAGE_KEY = 'interview_audio_blobs';
  private currentRecording: InterviewRecording | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;

  /**
   * Start recording a new interview session with mixed audio (AI + User)
   */
  async startMixedRecording(sessionId: string, userId: string, jobTitle: string, jobId: string, company?: string): Promise<InterviewRecording> {
    try {
      // Stop any existing recording
      if (this.currentRecording) {
        await this.stopRecording();
      }

      // Create new recording session
      const recording: InterviewRecording = {
        id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        userId,
        jobTitle,
        jobId,
        company,
        duration: 0,
        timestamp: new Date(),
        questions: [],
        status: 'recording'
      };

      this.currentRecording = recording;

      // Create audio context for mixing
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.destination = this.audioContext.createMediaStreamDestination();

      // Get user microphone
      const micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        },
        video: false 
      });

      // Connect microphone to destination
      const micSource = this.audioContext.createMediaStreamSource(micStream);
      micSource.connect(this.destination);

      // Set up MediaRecorder with the mixed stream
      this.mediaRecorder = new MediaRecorder(this.destination.stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('📊 Audio chunk received, size:', event.data.size, 'total chunks:', this.audioChunks.length + 1);
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('🛑 MediaRecorder stopped, total chunks:', this.audioChunks.length);
        await this.finalizeRecording();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
      };

      // Start recording with timeslice to ensure regular data events
      this.mediaRecorder.start(1000); // Request data every 1 second

      // Verify recording actually started
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'recording') {
          console.error('⚠️ MediaRecorder failed to start properly. State:', this.mediaRecorder.state);
        } else {
          console.log('✅ MediaRecorder confirmed started. State:', this.mediaRecorder?.state);
        }
      }, 500);

      // Save initial recording state
      this.saveRecording(recording);

      console.log('🎙️ Mixed interview recording started:', recording.id);
      return recording;

    } catch (error) {
      console.error('Failed to start mixed interview recording:', error);
      throw new Error('Could not start recording. Please check microphone permissions.');
    }
  }

  /**
   * Add AI avatar audio to the recording mix with proper isolation
   */
  async addAvatarAudioToRecording(mediaElement: HTMLAudioElement | HTMLVideoElement): Promise<void> {
    if (!this.audioContext || !this.destination) {
      console.warn('No active mixed recording to add avatar audio to');
      return;
    }

    try {
      // Create a dedicated audio context for avatar to prevent interference
      const avatarContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create audio source from the avatar media element
      const avatarSource = avatarContext.createMediaElementSource(mediaElement);
      
      // Create gain nodes for better audio control
      const avatarGain = avatarContext.createGain();
      const outputGain = avatarContext.createGain();
      
      // Set appropriate volumes
      avatarGain.gain.value = 0.8; // Slightly lower for mixing
      outputGain.gain.value = 1.0; // Full volume for user hearing
      
      // Connect avatar audio to both recording and output
      avatarSource.connect(avatarGain);
      avatarGain.connect(outputGain);
      outputGain.connect(avatarContext.destination);
      
      // For recording mixing - create a separate stream
      const recordingDestination = avatarContext.createMediaStreamDestination();
      avatarGain.connect(recordingDestination);
      
      // Mix the avatar stream with the main recording destination
      if (this.audioContext && this.destination) {
        const avatarStreamSource = this.audioContext.createMediaStreamSource(recordingDestination.stream);
        avatarStreamSource.connect(this.destination);
      }
      
      console.log('✅ Avatar audio added to recording mix with isolation');
    } catch (error) {
      console.error('Failed to add avatar audio to recording (continuing with separate audio):', error);
      
      // Fallback: Just ensure avatar plays normally without recording integration
      try {
        if (mediaElement) {
          mediaElement.volume = 1.0;
          console.log('🔊 Avatar audio fallback: playing without recording integration');
        }
      } catch (fallbackError) {
        console.error('Avatar audio fallback failed:', fallbackError);
      }
    }
  }

  /**
   * Start recording a new interview session (original method for backward compatibility)
   */
  async startRecording(sessionId: string, userId: string, jobTitle: string, jobId: string, company?: string): Promise<InterviewRecording> {
    try {
      // Stop any existing recording
      if (this.currentRecording) {
        await this.stopRecording();
      }

      // Create new recording session
      const recording: InterviewRecording = {
        id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        userId,
        jobTitle,
        jobId,
        company,
        duration: 0,
        timestamp: new Date(),
        questions: [],
        status: 'recording'
      };

      this.currentRecording = recording;

      // Start media recording
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        },
        video: false 
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log('📊 Audio chunk received, size:', event.data.size, 'total chunks:', this.audioChunks.length + 1);
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        console.log('🛑 MediaRecorder stopped, total chunks:', this.audioChunks.length);
        await this.finalizeRecording();
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
      };

      // Start recording with timeslice to ensure regular data events
      this.mediaRecorder.start(1000); // Request data every 1 second

      // Verify recording actually started
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'recording') {
          console.error('⚠️ MediaRecorder failed to start properly. State:', this.mediaRecorder.state);
        } else {
          console.log('✅ MediaRecorder confirmed started. State:', this.mediaRecorder?.state);
        }
      }, 500);

      // Save initial recording state
      this.saveRecording(recording);

      console.log('🎙️ Interview recording started:', recording.id);
      return recording;

    } catch (error) {
      console.error('Failed to start interview recording:', error);
      throw new Error('Could not start recording. Please check microphone permissions.');
    }
  }

  /**
   * Record a question and answer
   */
  async recordQuestion(questionId: string, question: string, answer: string, duration: number): Promise<void> {
    if (!this.currentRecording) {
      throw new Error('No active recording session');
    }

    const recordedQuestion: RecordedQuestion = {
      id: questionId,
      question,
      answer,
      duration,
      timestamp: new Date()
    };

    this.currentRecording.questions.push(recordedQuestion);
    this.saveRecording(this.currentRecording);

    console.log('📝 Question recorded:', questionId);
  }

  /**
   * Stop the current recording
   */
  async stopRecording(): Promise<InterviewRecording | null> {
    if (!this.currentRecording || !this.mediaRecorder) {
      return null;
    }

    return new Promise((resolve) => {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = async () => {
          const finalizedRecording = await this.finalizeRecording();
          this.cleanupAudioContext();
          resolve(finalizedRecording);
        };
        this.mediaRecorder.stop();
        
        // Stop all tracks to free up the microphone
        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      } else {
        // Handle case where recorder is already stopped
        this.finalizeRecording().then(finalizedRecording => {
          this.cleanupAudioContext();
          resolve(finalizedRecording);
        }).catch(error => {
          console.error('Error finalizing recording:', error);
          this.cleanupAudioContext();
          resolve(this.currentRecording);
        });
      }
    });
  }

  /**
   * Clean up audio context and related resources
   */
  private cleanupAudioContext(): void {
    if (this.audioContext) {
      this.audioContext.close().catch(error => {
        console.warn('Error closing audio context:', error);
      });
      this.audioContext = null;
    }
    
    this.destination = null;
  }

  /**
   * Finalize recording and create audio blob
   */
  private async finalizeRecording(): Promise<InterviewRecording | null> {
    if (!this.currentRecording) {
      return null;
    }

    // Capture the recording ID at the start to prevent any changes
    const recordingId = this.currentRecording.id;
    console.log('🎯 Finalizing recording with ID:', recordingId);

    try {
      // Create audio blob from chunks
      if (this.audioChunks.length > 0) {
        console.log('🎵 Creating audio blob from', this.audioChunks.length, 'chunks');
        const totalSize = this.audioChunks.reduce((sum, chunk) => sum + chunk.size, 0);
        console.log('📊 Total audio size:', totalSize, 'bytes');
        
        const audioBlob = new Blob(this.audioChunks, { 
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        
        this.currentRecording.audioBlob = audioBlob;
        this.currentRecording.audioUrl = audioUrl;
        
        console.log('🎵 Audio blob created, size:', audioBlob.size, 'type:', audioBlob.type);
        
        // Save audio blob separately for persistence - await to ensure it's saved
        // Use the captured recordingId to ensure consistency
        try {
          console.log('💾 Saving audio blob for recording:', recordingId, 'blob size:', audioBlob.size);
          await this.saveAudioBlob(recordingId, audioBlob);
          console.log('✅ Audio blob save completed for recording:', recordingId);
          
          // Verify the audio blob was saved correctly immediately
          const savedBlob = this.loadAudioBlob(recordingId);
          if (savedBlob) {
            console.log('✅ Audio blob verification successful:', recordingId, 'size:', savedBlob.size);
          } else {
            console.error('❌ Audio blob verification failed immediately after save:', recordingId);
          }
        } catch (error) {
          console.error('❌ Failed to save audio blob for recording:', recordingId, error);
        }
      } else {
        console.warn('⚠️ No audio chunks collected for recording:', recordingId);
        console.warn('MediaRecorder state:', this.mediaRecorder?.state);
        console.warn('Audio chunks array:', this.audioChunks);
      }

      this.currentRecording.status = 'completed';
      this.currentRecording.duration = Date.now() - this.currentRecording.timestamp.getTime();

      // Ensure the recording ID hasn't changed
      if (this.currentRecording.id !== recordingId) {
        console.error('⚠️ Recording ID changed during finalization!', 
          'Original:', recordingId, 
          'Current:', this.currentRecording.id);
        // Restore the original ID to maintain consistency
        this.currentRecording.id = recordingId;
      }

      // Save final recording
      this.saveRecording(this.currentRecording);

      const finalRecording = this.currentRecording;
      this.currentRecording = null;
      this.mediaRecorder = null;
      this.audioChunks = [];

      console.log('✅ Interview recording completed:', finalRecording.id, 'Duration:', finalRecording.duration, 'ms');
      return finalRecording;

    } catch (error) {
      console.error('Error finalizing recording:', error);
      return this.currentRecording;
    }
  }

  /**
   * Get all recordings for a user
   */
  getRecordings(userId?: string): InterviewRecording[] {
    try {
      const recordings = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      
      // Ensure all recordings have proper Date objects
      const processedRecordings = recordings.map((r: any) => ({
        ...r,
        timestamp: typeof r.timestamp === 'string' ? new Date(r.timestamp) : r.timestamp,
        questions: r.questions?.map((q: any) => ({
          ...q,
          timestamp: typeof q.timestamp === 'string' ? new Date(q.timestamp) : q.timestamp
        })) || []
      }));
      
      if (userId) {
        return processedRecordings.filter((r: InterviewRecording) => r.userId === userId);
      }
      
      return processedRecordings;
    } catch (error) {
      console.error('Error loading recordings:', error);
      return [];
    }
  }

  /**
   * Get a specific recording by ID
   */
  getRecording(recordingId: string): InterviewRecording | null {
    try {
      const recordings = this.getRecordings();
      const recording = recordings.find(r => r.id === recordingId);
      
      if (recording) {
        // Ensure timestamp is a Date object
        if (typeof recording.timestamp === 'string') {
          recording.timestamp = new Date(recording.timestamp);
        }
        
        // Clear any existing invalid URL (blob URLs don't persist across page loads)
        // We'll regenerate them when needed
        if (recording.audioUrl && !recording.audioBlob) {
          recording.audioUrl = undefined;
        }
      }
      
      return recording || null;
    } catch (error) {
      console.error('Error loading recording:', error);
      return null;
    }
  }

  /**
   * Get recording by session ID
   */
  getRecordingBySession(sessionId: string): InterviewRecording | null {
    const recordings = this.getRecordings();
    return recordings.find(r => r.sessionId === sessionId) || null;
  }

  /**
   * Delete a recording
   */
  deleteRecording(recordingId: string): boolean {
    try {
      const recordings = this.getRecordings();
      const updatedRecordings = recordings.filter(r => r.id !== recordingId);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedRecordings));
      
      // Also remove audio blob
      this.deleteAudioBlob(recordingId);
      
      console.log('🗑️ Recording deleted:', recordingId);
      return true;
    } catch (error) {
      console.error('Error deleting recording:', error);
      return false;
    }
  }

  /**
   * Create audio URL from recording
   */
  createAudioUrl(recording: InterviewRecording): string | null {
    // First try to use existing audioBlob if available
    if (recording.audioBlob) {
      try {
        // Revoke old URL if it exists
        if (recording.audioUrl) {
          try {
            URL.revokeObjectURL(recording.audioUrl);
          } catch (e) {
            // Ignore errors when revoking
          }
        }
        
        const url = URL.createObjectURL(recording.audioBlob);
        recording.audioUrl = url;
        return url;
      } catch (error) {
        console.error('Error creating URL from audioBlob:', error);
      }
    }
    
    // If we don't have an audioBlob in memory, or if we have an invalid URL, 
    // try to load from stored data and create new URL
    const audioBlob = this.loadAudioBlob(recording.id);
    if (audioBlob) {
      try {
        // Revoke old URL if it exists
        if (recording.audioUrl) {
          try {
            URL.revokeObjectURL(recording.audioUrl);
          } catch (e) {
            // Ignore errors when revoking
          }
        }
        
        const url = URL.createObjectURL(audioBlob);
        recording.audioUrl = url;
        recording.audioBlob = audioBlob; // Cache the blob for future use
        console.log('✅ Created new audio URL from stored data:', url);
        return url;
      } catch (error) {
        console.error('Error creating URL from loaded blob:', error);
      }
    }
    
    console.warn('No audio data available for recording:', recording.id);
    return null;
  }

  /**
   * Save recording to localStorage
   */
  private saveRecording(recording: InterviewRecording): void {
    try {
      const recordings = this.getRecordings();
      const existingIndex = recordings.findIndex(r => r.id === recording.id);
      
      // Create a clean copy without blob data for localStorage
      const cleanRecording = {
        ...recording,
        audioBlob: undefined, // Don't store blob in localStorage
        videoBlob: undefined  // Don't store blob in localStorage
      };
      
      if (existingIndex >= 0) {
        recordings[existingIndex] = cleanRecording;
      } else {
        recordings.push(cleanRecording);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recordings));
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  }

  /**
   * Save audio blob separately using IndexedDB-like approach
   */
  private async saveAudioBlob(recordingId: string, blob: Blob): Promise<void> {
    try {
      // For now, we'll use a simple approach with localStorage
      // In a production environment, you'd want to use IndexedDB
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const audioBlobs = JSON.parse(localStorage.getItem(this.AUDIO_STORAGE_KEY) || '{}');
            audioBlobs[recordingId] = reader.result;
            localStorage.setItem(this.AUDIO_STORAGE_KEY, JSON.stringify(audioBlobs));
            
            // Verify the save worked by reading it back
            const savedBlobs = JSON.parse(localStorage.getItem(this.AUDIO_STORAGE_KEY) || '{}');
            if (savedBlobs[recordingId]) {
              console.log('✅ Audio blob saved and verified for recording:', recordingId, 'size:', blob.size);
              resolve();
            } else {
              const error = new Error('Audio blob save verification failed');
              console.error('❌ Audio blob save verification failed for recording:', recordingId);
              reject(error);
            }
          } catch (error) {
            console.warn('Could not save audio blob to localStorage:', error);
            reject(error);
          }
        };
        reader.onerror = () => {
          console.error('Error reading blob for recording:', recordingId);
          reject(new Error('Failed to read blob'));
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error saving audio blob:', error);
      throw error;
    }
  }

  /**
   * Load audio blob
   */
  private loadAudioBlob(recordingId: string): Blob | null {
    try {
      const audioBlobs = JSON.parse(localStorage.getItem(this.AUDIO_STORAGE_KEY) || '{}');
      const dataUrl = audioBlobs[recordingId];
      
      if (!dataUrl) {
        console.warn('No audio data found for recording:', recordingId);
        return null;
      }
      
      if (typeof dataUrl !== 'string') {
        console.error('Invalid audio data type for recording:', recordingId, 'type:', typeof dataUrl);
        return null;
      }
      
      if (!dataUrl.startsWith('data:')) {
        console.error('Invalid audio data format for recording:', recordingId, 'data preview:', dataUrl.substring(0, 50));
        return null;
      }
      
      try {
        // Parse the data URL properly
        const [header, data] = dataUrl.split(',');
        if (!data || data.length === 0) {
          console.error('Empty audio data for recording:', recordingId);
          return null;
        }
        
        // Extract the MIME type
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'audio/webm';
        
        // Convert base64 to binary
        const binaryString = atob(data);
        const bytes = new Uint8Array(binaryString.length);
        
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const blob = new Blob([bytes], { type: mimeType });
        console.log('✅ Successfully loaded audio blob for recording:', recordingId, 'size:', blob.size, 'type:', blob.type);
        return blob;
      } catch (conversionError) {
        console.error('Error converting data URL to blob for recording:', recordingId, conversionError);
        
        // Try to clean up corrupted data
        try {
          delete audioBlobs[recordingId];
          localStorage.setItem(this.AUDIO_STORAGE_KEY, JSON.stringify(audioBlobs));
          console.log('🧹 Cleaned up corrupted audio data for recording:', recordingId);
        } catch (cleanupError) {
          console.error('Failed to clean up corrupted data:', cleanupError);
        }
        
        return null;
      }
    } catch (error) {
      console.error('Error loading audio blob:', error);
      return null;
    }
  }

  /**
   * Delete audio blob
   */
  private deleteAudioBlob(recordingId: string): void {
    try {
      const audioBlobs = JSON.parse(localStorage.getItem(this.AUDIO_STORAGE_KEY) || '{}');
      delete audioBlobs[recordingId];
      localStorage.setItem(this.AUDIO_STORAGE_KEY, JSON.stringify(audioBlobs));
    } catch (error) {
      console.error('Error deleting audio blob:', error);
    }
  }

  /**
   * Get current recording status
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
   * Clean up invalid blob URLs and refresh audio data
   */
  refreshRecordingAudio(recordingId: string): boolean {
    try {
      console.log('🔄 Refreshing audio for recording:', recordingId);
      
      const recording = this.getRecording(recordingId);
      if (!recording) {
        console.error('Recording not found:', recordingId);
        return false;
      }

      // Clear existing URLs and blobs
      if (recording.audioUrl) {
        try {
          URL.revokeObjectURL(recording.audioUrl);
        } catch (e) {
          // URL might already be invalid
        }
        recording.audioUrl = undefined;
      }
      recording.audioBlob = undefined;

      // Try to reload from localStorage and recreate
      const audioBlob = this.loadAudioBlob(recordingId);
      if (audioBlob) {
        console.log('✅ Audio blob loaded, size:', audioBlob.size, 'type:', audioBlob.type);
        
        recording.audioBlob = audioBlob;
        const newUrl = URL.createObjectURL(audioBlob);
        recording.audioUrl = newUrl;
        
        // Update the stored recording
        this.saveRecording(recording);
        
        console.log('✅ New audio URL created:', newUrl);
        return true;
      } else {
        console.error('❌ No audio blob data found for recording:', recordingId);
        
        // Debug: Check what's actually in localStorage
        this.debugStorageContents(recordingId);
        
        // Try enhanced recovery
        if (this.recoverMissingAudioBlob(recordingId)) {
          const recoveredAudioBlob = this.loadAudioBlob(recordingId);
          if (recoveredAudioBlob) {
            console.log('✅ Audio blob recovered via enhanced method, size:', recoveredAudioBlob.size, 'type:', recoveredAudioBlob.type);
            
            recording.audioBlob = recoveredAudioBlob;
            const newUrl = URL.createObjectURL(recoveredAudioBlob);
            recording.audioUrl = newUrl;
            
            // Update the stored recording
            this.saveRecording(recording);
            
            console.log('✅ New audio URL created after enhanced recovery:', newUrl);
            return true;
          }
        }
        
        // Mark recording as corrupted but don't remove it completely
        recording.status = 'processing'; // Reset status to indicate issue
        this.saveRecording(recording);
        
        return false;
      }

    } catch (error) {
      console.error('Error refreshing recording audio:', error);
      return false;
    }
  }

  /**
   * Debug storage contents for troubleshooting
   */
  private debugStorageContents(recordingId: string): void {
    try {
      console.log('🔍 Debugging storage for recording:', recordingId);
      
      // Check main recording storage
      const allRecordings = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
      const recording = allRecordings.find((r: InterviewRecording) => r.id === recordingId);
      console.log('Recording in main storage:', !!recording);
      
      // Check audio blob storage
      const audioBlobs = JSON.parse(localStorage.getItem(this.AUDIO_STORAGE_KEY) || '{}');
      const audioKeys = Object.keys(audioBlobs);
      console.log('Audio blob keys in storage:', audioKeys);
      console.log('Current recording ID:', recordingId);
      console.log('Has audio blob for this recording:', recordingId in audioBlobs);
      
      // Show all existing keys for comparison
      if (audioKeys.length > 0) {
        console.log('🔍 Existing audio blob keys:');
        audioKeys.forEach((key, index) => {
          console.log(`  ${index + 1}. "${key}"`);
        });
      }
      
      // Try to find similar keys (in case there's a slight mismatch)
      const similarKeys = audioKeys.filter(key => key.includes(recordingId.split('_')[1]) || recordingId.includes(key.split('_')[1]));
      if (similarKeys.length > 0) {
        console.log('🔍 Found similar keys:', similarKeys);
        
        // Try to recover using the first similar key
        const similarKey = similarKeys[0];
        console.log('🔧 Attempting recovery with key:', similarKey);
        
        try {
          const dataUrl = audioBlobs[similarKey];
          if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
            // Copy the audio data to the correct key
            audioBlobs[recordingId] = dataUrl;
            localStorage.setItem(this.AUDIO_STORAGE_KEY, JSON.stringify(audioBlobs));
            console.log('✅ Recovered audio data for recording:', recordingId);
            return; // Exit early as we've recovered
          }
        } catch (recoveryError) {
          console.error('Failed to recover audio data:', recoveryError);
        }
      }
      
      if (recordingId in audioBlobs) {
        const dataUrl = audioBlobs[recordingId];
        console.log('Audio data type:', typeof dataUrl);
        console.log('Audio data starts with data:?', dataUrl?.startsWith?.('data:'));
        console.log('Audio data length:', dataUrl?.length || 'undefined');
      }
      
      // Check localStorage usage
      let totalSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      console.log('Total localStorage usage (chars):', totalSize);
      console.log('Estimated localStorage usage (MB):', (totalSize / 1024 / 1024).toFixed(2));
      
    } catch (error) {
      console.error('Error debugging storage:', error);
    }
  }

  /**
   * Debug recording data - for troubleshooting
   */
  debugRecording(recordingId: string): void {
    console.log('=== Recording Debug Info ===');
    console.log('Recording ID:', recordingId);
    
    const recording = this.getRecording(recordingId);
    console.log('Recording found:', !!recording);
    
    if (recording) {
      console.log('Recording status:', recording.status);
      console.log('Has audioBlob:', !!recording.audioBlob);
      console.log('Has audioUrl:', !!recording.audioUrl);
      console.log('Duration:', recording.duration);
      console.log('Questions count:', recording.questions.length);
      
      // Check stored audio blob
      const storedBlob = this.loadAudioBlob(recordingId);
      console.log('Has stored audio blob:', !!storedBlob);
      
      if (storedBlob) {
        console.log('Stored blob size:', storedBlob.size);
        console.log('Stored blob type:', storedBlob.type);
      }
      
      // Check localStorage data
      const audioBlobs = JSON.parse(localStorage.getItem(this.AUDIO_STORAGE_KEY) || '{}');
      console.log('Has localStorage audio data:', !!audioBlobs[recordingId]);
      
      if (audioBlobs[recordingId]) {
        console.log('localStorage audio data length:', audioBlobs[recordingId].length);
      }
    }
    
    console.log('=== End Debug Info ===');
  }

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
        console.log(`✅ Found potential match: ${bestMatch} (time diff: ${smallestTimeDiff}ms)`);
        
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
   * Repair method to fix existing recordings with missing audio blobs
   */
  repairExistingRecordings(): { repaired: number; failed: number } {
    console.log('🔧 Starting repair of existing recordings...');
    
    const recordings = this.getRecordings();
    let repairedCount = 0;
    let failedCount = 0;
    
    for (const recording of recordings) {
      if (recording.status === 'completed' && !this.loadAudioBlob(recording.id)) {
        console.log(`🔧 Attempting to repair recording: ${recording.id}`);
        
        if (this.recoverMissingAudioBlob(recording.id)) {
          repairedCount++;
          console.log(`✅ Successfully repaired recording: ${recording.id}`);
        } else {
          failedCount++;
          console.log(`❌ Could not repair recording: ${recording.id}`);
          
          // Mark as processing so user knows there's an issue
          recording.status = 'processing';
          this.saveRecording(recording);
        }
      }
    }
    
    console.log(`🔧 Repair complete. Repaired: ${repairedCount}, Failed: ${failedCount}`);
    return { repaired: repairedCount, failed: failedCount };
  }

  /**
   * Test blob recreation for a recording (for debugging)
   */
  testBlobRecreation(recordingId: string): boolean {
    try {
      console.log('🧪 Testing blob recreation for:', recordingId);
      
      // Load the stored blob
      const audioBlob = this.loadAudioBlob(recordingId);
      if (!audioBlob) {
        console.error('❌ No stored audio blob found');
        return false;
      }
      
      console.log('✅ Stored blob loaded - Size:', audioBlob.size, 'Type:', audioBlob.type);
      
      // Try to create URL
      const url = URL.createObjectURL(audioBlob);
      console.log('✅ Blob URL created:', url);
      
      // Test with a temporary audio element
      const testAudio = new Audio();
      
      return new Promise((resolve) => {
        testAudio.oncanplay = () => {
          console.log('✅ Audio can play - blob is valid');
          URL.revokeObjectURL(url);
          resolve(true);
        };
        
        testAudio.onerror = (e) => {
          console.error('❌ Audio cannot play - blob may be corrupted:', e);
          URL.revokeObjectURL(url);
          resolve(false);
        };
        
        testAudio.src = url;
        testAudio.load();
      });
      
    } catch (error) {
      console.error('❌ Error testing blob recreation:', error);
      return false;
    }
  }

  /**
   * Clean up orphaned audio blobs that don't match any existing recordings
   */
  cleanupOrphanedAudioBlobs(): void {
    try {
      console.log('🧹 Cleaning up orphaned audio blobs...');
      
      const recordings = this.getRecordings();
      const validRecordingIds = new Set(recordings.map(r => r.id));
      
      const audioBlobs = JSON.parse(localStorage.getItem(this.AUDIO_STORAGE_KEY) || '{}');
      const audioKeys = Object.keys(audioBlobs);
      
      let cleaned = 0;
      audioKeys.forEach(key => {
        if (!validRecordingIds.has(key)) {
          delete audioBlobs[key];
          cleaned++;
          console.log('🗑️ Removed orphaned audio blob:', key);
        }
      });
      
      if (cleaned > 0) {
        localStorage.setItem(this.AUDIO_STORAGE_KEY, JSON.stringify(audioBlobs));
        console.log(`✅ Cleaned ${cleaned} orphaned audio blobs`);
      } else {
        console.log('✅ No orphaned audio blobs found');
      }
      
    } catch (error) {
      console.error('Error cleaning orphaned audio blobs:', error);
    }
  }

  /**
   * Clear all recordings (for testing/cleanup)
   */
  clearAllRecordings(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.AUDIO_STORAGE_KEY);
    console.log('🧹 All recordings cleared');
  }

  /**
   * Initialize audio URLs for all recordings that don't have them
   */
  initializeAudioUrls(): void {
    console.log('🔧 Initializing audio URLs for existing recordings...');
    
    // First clean up orphaned audio blobs
    this.cleanupOrphanedAudioBlobs();
    
    const recordings = this.getRecordings();
    let initialized = 0;
    
    recordings.forEach(recording => {
      if (recording.status === 'completed' && !recording.audioUrl) {
        const audioBlob = this.loadAudioBlob(recording.id);
        if (audioBlob) {
          recording.audioBlob = audioBlob;
          recording.audioUrl = URL.createObjectURL(audioBlob);
          this.saveRecording(recording);
          initialized++;
          console.log('✅ Initialized audio URL for recording:', recording.id);
        }
      }
    });
    
    console.log(`🎉 Initialized ${initialized} audio URLs`);
  }
}

// Export singleton instance
export const interviewRecordingService = new InterviewRecordingService();

// Initialize audio URLs when the service is first loaded
try {
  interviewRecordingService.initializeAudioUrls();
} catch (error) {
  console.warn('Failed to initialize audio URLs:', error);
}

export default interviewRecordingService;
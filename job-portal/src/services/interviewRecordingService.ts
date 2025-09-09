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

  /**
   * Start recording a new interview session
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
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.finalizeRecording();
      };

      this.mediaRecorder.start();

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
        this.mediaRecorder.onstop = () => {
          const finalizedRecording = this.finalizeRecording();
          resolve(finalizedRecording);
        };
        this.mediaRecorder.stop();
        
        // Stop all tracks to free up the microphone
        if (this.mediaRecorder.stream) {
          this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      } else {
        const finalizedRecording = this.finalizeRecording();
        resolve(finalizedRecording);
      }
    });
  }

  /**
   * Finalize recording and create audio blob
   */
  private finalizeRecording(): InterviewRecording | null {
    if (!this.currentRecording) {
      return null;
    }

    try {
      // Create audio blob from chunks
      if (this.audioChunks.length > 0) {
        const audioBlob = new Blob(this.audioChunks, { 
          type: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        
        this.currentRecording.audioBlob = audioBlob;
        this.currentRecording.audioUrl = audioUrl;
        
        // Save audio blob separately for persistence
        this.saveAudioBlob(this.currentRecording.id, audioBlob);
      }

      this.currentRecording.status = 'completed';
      this.currentRecording.duration = Date.now() - this.currentRecording.timestamp.getTime();

      // Save final recording
      this.saveRecording(this.currentRecording);

      const finalRecording = this.currentRecording;
      this.currentRecording = null;
      this.mediaRecorder = null;
      this.audioChunks = [];

      console.log('✅ Interview recording completed:', finalRecording.id);
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
  private saveAudioBlob(recordingId: string, blob: Blob): void {
    try {
      // For now, we'll use a simple approach with localStorage
      // In a production environment, you'd want to use IndexedDB
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const audioBlobs = JSON.parse(localStorage.getItem(this.AUDIO_STORAGE_KEY) || '{}');
          audioBlobs[recordingId] = reader.result;
          localStorage.setItem(this.AUDIO_STORAGE_KEY, JSON.stringify(audioBlobs));
        } catch (error) {
          console.warn('Could not save audio blob to localStorage:', error);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error saving audio blob:', error);
    }
  }

  /**
   * Load audio blob
   */
  private loadAudioBlob(recordingId: string): Blob | null {
    try {
      const audioBlobs = JSON.parse(localStorage.getItem(this.AUDIO_STORAGE_KEY) || '{}');
      const dataUrl = audioBlobs[recordingId];
      
      if (dataUrl && typeof dataUrl === 'string' && dataUrl.startsWith('data:')) {
        try {
          // Parse the data URL properly
          const [header, data] = dataUrl.split(',');
          if (!data) return null;
          
          // Extract the MIME type
          const mimeMatch = header.match(/data:([^;]+)/);
          const mimeType = mimeMatch ? mimeMatch[1] : 'audio/webm';
          
          // Convert base64 to binary
          const binaryString = atob(data);
          const bytes = new Uint8Array(binaryString.length);
          
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          
          return new Blob([bytes], { type: mimeType });
        } catch (conversionError) {
          console.error('Error converting data URL to blob:', conversionError);
          return null;
        }
      }
      
      return null;
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
        return false;
      }

    } catch (error) {
      console.error('Error refreshing recording audio:', error);
      return false;
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
   * Clear all recordings (for testing/cleanup)
   */
  clearAllRecordings(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.AUDIO_STORAGE_KEY);
    console.log('🧹 All recordings cleared');
  }
}

// Export singleton instance
export const interviewRecordingService = new InterviewRecordingService();
export default interviewRecordingService;
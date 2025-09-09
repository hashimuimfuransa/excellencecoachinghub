// Interview Storage Service for handling recordings and history
export interface InterviewRecording {
  id: string;
  questionId: string;
  question: string;
  audioBlob: Blob;
  audioUrl: string;
  duration: number;
  timestamp: Date;
  transcription?: string;
  confidence?: number;
}

export interface InterviewHistoryEntry {
  id: string;
  sessionId: string;
  jobTitle: string;
  company: string;
  date: Date;
  totalDuration: number;
  questionsAsked: number;
  overallScore?: number;
  recordings: InterviewRecording[];
  feedback?: string;
  status: 'completed' | 'incomplete' | 'in_progress';
  avatarUsed: string;
  interviewType: 'practice' | 'real';
}

class InterviewStorageService {
  private readonly STORAGE_KEY = 'interview_history';
  private readonly RECORDINGS_KEY = 'interview_recordings';
  
  /**
   * Save interview recording with audio blob
   */
  async saveInterviewRecording(
    sessionId: string,
    questionId: string,
    question: string,
    audioBlob: Blob,
    duration: number,
    transcription?: string,
    confidence?: number
  ): Promise<InterviewRecording> {
    try {
      // Create audio URL for playback
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const recording: InterviewRecording = {
        id: `recording_${sessionId}_${questionId}_${Date.now()}`,
        questionId,
        question,
        audioBlob,
        audioUrl,
        duration,
        timestamp: new Date(),
        transcription,
        confidence
      };

      // Store recording data (without blob) in localStorage for persistence
      const recordingData = {
        ...recording,
        audioBlob: undefined, // Don't store blob in localStorage
        audioBlobData: await this.blobToBase64(audioBlob) // Convert to base64 for storage
      };

      // Get existing recordings
      const existingRecordings = this.getStoredRecordings();
      existingRecordings.push(recordingData);

      // Store updated recordings
      localStorage.setItem(this.RECORDINGS_KEY, JSON.stringify(existingRecordings));

      console.log('✅ Interview recording saved:', recording.id);
      return recording;
    } catch (error) {
      console.error('❌ Error saving interview recording:', error);
      throw error;
    }
  }

  /**
   * Get all recordings for a specific session
   */
  getSessionRecordings(sessionId: string): InterviewRecording[] {
    try {
      const allRecordings = this.getStoredRecordings();
      return allRecordings
        .filter((recording: any) => recording.id.includes(sessionId))
        .map((recording: any) => ({
          ...recording,
          audioBlob: recording.audioBlobData ? this.base64ToBlob(recording.audioBlobData) : null,
          timestamp: new Date(recording.timestamp)
        }));
    } catch (error) {
      console.error('❌ Error getting session recordings:', error);
      return [];
    }
  }

  /**
   * Save complete interview session to history
   */
  async saveInterviewToHistory(
    sessionId: string,
    jobTitle: string,
    company: string,
    questionsAsked: number,
    totalDuration: number,
    overallScore?: number,
    feedback?: string,
    status: 'completed' | 'incomplete' = 'completed',
    avatarUsed: string = 'european_woman',
    interviewType: 'practice' | 'real' = 'practice'
  ): Promise<InterviewHistoryEntry> {
    try {
      // Get recordings for this session
      const recordings = this.getSessionRecordings(sessionId);

      const historyEntry: InterviewHistoryEntry = {
        id: `history_${sessionId}_${Date.now()}`,
        sessionId,
        jobTitle,
        company,
        date: new Date(),
        totalDuration,
        questionsAsked,
        overallScore,
        recordings,
        feedback,
        status,
        avatarUsed,
        interviewType
      };

      // Get existing history
      const existingHistory = this.getInterviewHistory();
      existingHistory.unshift(historyEntry); // Add to beginning

      // Limit history to last 50 interviews
      const limitedHistory = existingHistory.slice(0, 50);

      // Store updated history
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(limitedHistory));

      console.log('✅ Interview saved to history:', historyEntry.id);
      return historyEntry;
    } catch (error) {
      console.error('❌ Error saving interview to history:', error);
      throw error;
    }
  }

  /**
   * Get interview history
   */
  getInterviewHistory(): InterviewHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const history = JSON.parse(stored);
      return history.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
        recordings: entry.recordings.map((recording: any) => ({
          ...recording,
          timestamp: new Date(recording.timestamp)
        }))
      }));
    } catch (error) {
      console.error('❌ Error getting interview history:', error);
      return [];
    }
  }

  /**
   * Delete interview from history
   */
  deleteInterviewFromHistory(interviewId: string): boolean {
    try {
      const history = this.getInterviewHistory();
      const filteredHistory = history.filter(entry => entry.id !== interviewId);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
      
      // Also clean up associated recordings
      this.deleteSessionRecordings(interviewId);
      
      console.log('✅ Interview deleted from history:', interviewId);
      return true;
    } catch (error) {
      console.error('❌ Error deleting interview from history:', error);
      return false;
    }
  }

  /**
   * Play back recorded audio
   */
  async playRecording(recording: InterviewRecording): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      try {
        const audio = new Audio(recording.audioUrl);
        audio.addEventListener('loadeddata', () => resolve(audio));
        audio.addEventListener('error', () => reject(new Error('Failed to load audio')));
        audio.load();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get interview statistics
   */
  getInterviewStatistics(): {
    totalInterviews: number;
    completedInterviews: number;
    averageScore: number;
    totalRecordingTime: number;
    lastInterviewDate?: Date;
  } {
    const history = this.getInterviewHistory();
    const completedInterviews = history.filter(entry => entry.status === 'completed');
    const totalRecordingTime = history.reduce((total, entry) => total + entry.totalDuration, 0);
    const averageScore = completedInterviews.length > 0 
      ? completedInterviews.reduce((sum, entry) => sum + (entry.overallScore || 0), 0) / completedInterviews.length
      : 0;

    return {
      totalInterviews: history.length,
      completedInterviews: completedInterviews.length,
      averageScore: Math.round(averageScore),
      totalRecordingTime,
      lastInterviewDate: history.length > 0 ? history[0].date : undefined
    };
  }

  /**
   * Export interview data
   */
  exportInterviewData(): string {
    const history = this.getInterviewHistory();
    const statistics = this.getInterviewStatistics();
    
    const exportData = {
      exportDate: new Date().toISOString(),
      statistics,
      interviews: history.map(entry => ({
        ...entry,
        recordings: entry.recordings.map(recording => ({
          ...recording,
          audioBlob: undefined, // Don't include blob in export
          audioUrl: undefined // Don't include URL in export
        }))
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all interview data
   */
  clearAllData(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.RECORDINGS_KEY);
      console.log('✅ All interview data cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing interview data:', error);
      return false;
    }
  }

  // Private helper methods
  private getStoredRecordings(): any[] {
    try {
      const stored = localStorage.getItem(this.RECORDINGS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Error getting stored recordings:', error);
      return [];
    }
  }

  private deleteSessionRecordings(sessionId: string): void {
    try {
      const allRecordings = this.getStoredRecordings();
      const filteredRecordings = allRecordings.filter(
        (recording: any) => !recording.id.includes(sessionId)
      );
      localStorage.setItem(this.RECORDINGS_KEY, JSON.stringify(filteredRecordings));
    } catch (error) {
      console.error('❌ Error deleting session recordings:', error);
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64: string): Blob {
    const [header, data] = base64.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'audio/wav';
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}

// Export singleton instance
export const interviewStorageService = new InterviewStorageService();
export default interviewStorageService;
// Speech-to-Text Service for Interview Recordings

export interface SpeechToTextResult {
  transcript: string;
  confidence: number;
  duration: number;
  words?: {
    text: string;
    startTime: number;
    endTime: number;
    confidence: number;
  }[];
}

export interface AudioProcessingOptions {
  language?: string;
  enableWordTimestamps?: boolean;
  profanityFilter?: boolean;
  enhancedModel?: boolean;
}

class SpeechToTextService {
  private readonly API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  /**
   * Convert audio blob to text using backend speech recognition
   */
  async transcribeAudio(
    audioBlob: Blob, 
    options: AudioProcessingOptions = {}
  ): Promise<SpeechToTextResult> {
    try {
      console.log('🎙️ Starting audio transcription...', {
        size: audioBlob.size,
        type: audioBlob.type,
        options
      });

      const formData = new FormData();
      formData.append('audio', audioBlob, 'interview-response.webm');
      formData.append('language', options.language || 'en-US');
      formData.append('enableWordTimestamps', String(options.enableWordTimestamps || false));
      formData.append('profanityFilter', String(options.profanityFilter || false));
      formData.append('enhancedModel', String(options.enhancedModel || true));

      const response = await fetch(`${this.API_BASE}/speech/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Speech-to-text API error: ${response.status}`);
      }

      const result = await response.json();
      
      console.log('✅ Audio transcription completed:', {
        transcriptLength: result.transcript?.length,
        confidence: result.confidence,
        duration: result.duration
      });

      return result;
    } catch (error) {
      console.error('❌ Audio transcription failed:', error);
      
      // Fallback: try browser native speech recognition
      return this.fallbackWebSpeechAPI(audioBlob);
    }
  }

  /**
   * Fallback to browser's native Web Speech API
   */
  private async fallbackWebSpeechAPI(audioBlob: Blob): Promise<SpeechToTextResult> {
    return new Promise((resolve) => {
      console.log('🔄 Using fallback Web Speech API...');

      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('⚠️ Speech recognition not supported in this browser');
        resolve({
          transcript: '[Audio response recorded - please review manually]',
          confidence: 0.5,
          duration: 0
        });
        return;
      }

      try {
        // Convert blob to audio for playback with speech recognition
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        // Use Web Speech API (limited but works as backup)
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        let startTime = Date.now();
        
        recognition.onresult = (event: any) => {
          const duration = (Date.now() - startTime) / 1000;
          const result = event.results[0];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0.8;

          console.log('✅ Fallback speech recognition result:', { transcript, confidence });

          resolve({
            transcript,
            confidence,
            duration
          });

          URL.revokeObjectURL(audioUrl);
        };

        recognition.onerror = (event: any) => {
          console.error('❌ Fallback speech recognition error:', event.error);
          resolve({
            transcript: '[Audio response recorded - transcription unavailable]',
            confidence: 0.5,
            duration: 0
          });
          URL.revokeObjectURL(audioUrl);
        };

        recognition.onend = () => {
          console.log('🎙️ Fallback speech recognition ended');
        };

        // Start recognition
        recognition.start();

        // Auto-stop after reasonable time if no result
        setTimeout(() => {
          try {
            recognition.stop();
            resolve({
              transcript: '[Audio response recorded - transcription timeout]',
              confidence: 0.5,
              duration: 0
            });
          } catch (e) {
            // Recognition already stopped
          }
        }, 10000);

      } catch (error) {
        console.error('❌ Fallback speech recognition setup failed:', error);
        resolve({
          transcript: '[Audio response recorded]',
          confidence: 0.5,
          duration: 0
        });
      }
    });
  }

  /**
   * Process audio in real-time during recording (for future enhancement)
   */
  async processRealTimeAudio(stream: MediaStream): Promise<void> {
    // This would implement real-time transcription
    // For now, we'll focus on post-recording processing
    console.log('🎙️ Real-time audio processing (future feature)', stream);
  }

  /**
   * Validate audio quality and provide feedback
   */
  async validateAudioQuality(audioBlob: Blob): Promise<{
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    issues: string[];
    recommendations: string[];
  }> {
    // Basic audio validation
    const sizeKB = audioBlob.size / 1024;
    const quality = sizeKB > 100 ? 'good' : sizeKB > 50 ? 'fair' : 'poor';
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (sizeKB < 10) {
      issues.push('Audio file is very small, may indicate recording issues');
      recommendations.push('Speak closer to the microphone and ensure good audio levels');
    }

    if (audioBlob.type && !audioBlob.type.includes('audio')) {
      issues.push('Audio format may not be optimal');
      recommendations.push('Check microphone settings and browser compatibility');
    }

    return {
      quality,
      issues,
      recommendations
    };
  }

  /**
   * Check if speech-to-text service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/speech/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const speechToTextService = new SpeechToTextService();
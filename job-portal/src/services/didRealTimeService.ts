/**
 * D-ID Real-Time API Service
 * Handles real-time avatar video generation for live interview experience
 */

export interface DIDRealTimeRequest {
  text: string;
  avatar?: string;
  emotion?: string;
  language?: string;
  voice?: string;
  quality?: 'low' | 'medium' | 'high';
}

export interface DIDRealTimeResponse {
  text: string;
  avatar: 'did' | 'talkavatar';
  stream_url?: string;
  session_id?: string;
  success: boolean;
  error?: string;
}

export interface DIDStreamResponse {
  type: 'video' | 'audio' | 'error' | 'end';
  data?: ArrayBuffer;
  error?: string;
  session_id?: string;
}

class DIDRealTimeService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  
  // D-ID Real-Time API configuration
  private readonly defaultAvatar = 'amy-jcwCkr1g';
  private readonly defaultVoice = 'amy';
  private readonly defaultLanguage = 'en';
  
  // Fallback configuration
  private readonly fallbackAvatar = 'talkavatar';
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_DID_API_URL || 'https://api.d-id.com';
    this.apiUrl = `${this.baseUrl}/talks`;
    this.apiKey = import.meta.env.VITE_DID_API_KEY || '';
    
    console.log('🔧 D-ID Service Configuration:');
    console.log('📡 Base URL:', this.baseUrl);
    console.log('🔑 API Key:', this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'NOT SET');
    console.log('🌐 API URL:', this.apiUrl);
    
    // Check if we're in development mode and warn about CORS issues
    if (this.baseUrl === 'https://api.d-id.com' && window.location.hostname === 'localhost') {
      console.warn('⚠️ CORS WARNING: Direct D-ID API calls from localhost will fail due to CORS policy');
      console.warn('💡 Solutions:');
      console.warn('   1. Use a backend proxy to handle D-ID API calls');
      console.warn('   2. Set up a CORS proxy server');
      console.warn('   3. Deploy to a production domain');
      console.warn('   4. Use TalkAvatar as fallback (will happen automatically)');
    }
    
    if (!this.apiKey) {
      console.warn('⚠️ D-ID API key not found in environment variables');
      console.warn('📝 Add VITE_DID_API_KEY to your .env file');
      console.warn('🔗 Get your API key from: https://www.d-id.com/');
      console.warn('💡 Example: VITE_DID_API_KEY=sk-your_actual_api_key_here');
    } else {
      console.log('✅ D-ID Real-Time API configured successfully');
      console.log('🎥 D-ID will be used as primary avatar service');
    }
  }

  /**
   * Generate avatar response in the required JSON format
   */
  async generateAvatarResponse(question: string): Promise<DIDRealTimeResponse> {
    try {
      console.log('🎥 Generating D-ID Real-Time avatar response for:', question.substring(0, 50) + '...');
      
      // First try D-ID Real-Time API
      const didResponse = await this.generateDIDResponse(question);
      
      if (didResponse.success) {
        return {
          text: didResponse.text,
          avatar: 'did',
          stream_url: didResponse.stream_url,
          session_id: didResponse.session_id,
          success: true
        };
      } else {
        console.warn('D-ID Real-Time API failed, falling back to talkavatar');
        return this.generateFallbackResponse(question);
      }
    } catch (error) {
      console.error('D-ID Real-Time API error:', error);
      return this.generateFallbackResponse(question);
    }
  }

  /**
   * Generate response using D-ID Real-Time API
   */
  private async generateDIDResponse(question: string): Promise<DIDRealTimeResponse> {
    if (!this.apiKey) {
      console.error('❌ D-ID API key not configured');
      throw new Error('D-ID API key not configured');
    }

    try {
      console.log('🚀 Making D-ID API call...');
      console.log('📝 Question:', question.substring(0, 100) + '...');
      
      // Create a standard D-ID talk (not streaming)
      const requestBody = {
        source_url: `https://d-id-public-bucket.s3.amazonaws.com/amy-jcwCkr1g.jpg`,
        script: {
          type: 'text',
          input: question,
          provider: {
            type: 'microsoft',
            voice_id: 'en-US-AriaNeural'
          }
        },
        config: {
          result_format: 'mp4',
          fluent: true,
          pad_audio: 0.0
        }
      };
      
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      console.log('🔑 API Key format:', this.apiKey.substring(0, 8) + '...');
      
      const response = await fetch(`${this.baseUrl}/talks`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ D-ID API Error Response:', errorText);
        console.error('❌ Status:', response.status);
        
        // Handle specific error types
        if (response.status === 402) {
          console.warn('💳 D-ID API Error: Insufficient credits');
          console.warn('💡 This means your D-ID account has run out of credits');
          console.warn('🔄 The system will automatically fall back to TalkAvatar');
          throw new Error(`D-ID credits insufficient: ${errorText}`);
        } else if (response.status === 401) {
          console.warn('🔑 D-ID API Error: Authentication failed');
          console.warn('💡 Please check your API key');
          throw new Error(`D-ID authentication failed: ${errorText}`);
        } else if (response.status === 429) {
          console.warn('⏰ D-ID API Error: Rate limit exceeded');
          console.warn('💡 Too many requests, please wait before retrying');
          throw new Error(`D-ID rate limit exceeded: ${errorText}`);
        }
        
        throw new Error(`D-ID talk creation failed (${response.status}): ${errorText}`);
      }

      const talkData = await response.json();
      console.log('✅ D-ID talk created successfully:', talkData);
      console.log('🎬 Result URL:', talkData.result_url);
      console.log('🆔 Talk ID:', talkData.id);

      return {
        text: question,
        avatar: 'did',
        stream_url: talkData.result_url,
        session_id: talkData.id,
        success: true
      };
    } catch (error) {
      console.error('D-ID API error:', error);
      
      // Check if it's a CORS error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('🚫 CORS Error detected - D-ID API calls blocked by browser policy');
        console.warn('💡 This is expected when running on localhost. Falling back to TalkAvatar.');
        return {
          text: question,
          avatar: 'did',
          success: false,
          error: 'CORS policy blocks D-ID API calls from localhost'
        };
      }
      
      // Check if it's a credits error
      if (error instanceof Error && error.message.includes('credits insufficient')) {
        console.warn('💳 D-ID Credits Error - Account has insufficient credits');
        console.warn('🔄 Automatically falling back to TalkAvatar');
        return {
          text: question,
          avatar: 'did',
          success: false,
          error: 'D-ID account has insufficient credits'
        };
      }
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes('authentication failed')) {
        console.warn('🔑 D-ID Authentication Error - Invalid API key');
        console.warn('🔄 Automatically falling back to TalkAvatar');
        return {
          text: question,
          avatar: 'did',
          success: false,
          error: 'D-ID API key is invalid'
        };
      }
      
      return {
        text: question,
        avatar: 'did',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate fallback response using talkavatar
   */
  private generateFallbackResponse(question: string): DIDRealTimeResponse {
    return {
      text: question,
      avatar: 'talkavatar',
      success: true
    };
  }

  /**
   * Get video URL from D-ID talk (non-streaming)
   */
  async getVideoUrl(talkId: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('D-ID API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/talks/${talkId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Talk request failed: ${response.statusText}`);
      }

      const talkData = await response.json();
      console.log('📹 Talk status:', talkData.status);
      console.log('📹 Result URL:', talkData.result_url);
      
      if (talkData.status === 'done' && talkData.result_url) {
        return talkData.result_url;
      } else if (talkData.status === 'started' || talkData.status === 'created') {
        // Talk is still processing, wait and retry
        await new Promise(resolve => setTimeout(resolve, 2000));
        return this.getVideoUrl(talkId);
      } else {
        throw new Error(`Talk failed with status: ${talkData.status}`);
      }
    } catch (error) {
      throw new Error(`Failed to get video URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop a streaming session
   */
  async stopStream(sessionId: string): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/talks/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to stop stream:', error);
      return false;
    }
  }

  /**
   * Check if D-ID service is properly configured
   */
  isConfigured(): boolean {
    const hasApiKey = !!this.apiKey;
    const hasBaseUrl = !!this.baseUrl;
    
    // Check for CORS issues in development
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isDirectDIDCall = this.baseUrl === 'https://api.d-id.com';
    
    if (isLocalhost && isDirectDIDCall) {
      console.warn('⚠️ D-ID service not available: CORS policy blocks direct API calls from localhost');
      return false;
    }
    
    return hasApiKey && hasBaseUrl;
  }

  /**
   * Check if D-ID service is available (configured and has credits)
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      const status = await this.checkAccountStatus();
      if (!status.success) {
        console.warn('⚠️ D-ID service not available:', status.error);
        return false;
      }
      
      if (status.credits !== undefined && status.credits <= 0) {
        console.warn('⚠️ D-ID service not available: No credits remaining');
        return false;
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ D-ID service availability check failed:', error);
      return false;
    }
  }

  /**
   * Check D-ID account status and credits
   */
  async checkAccountStatus(): Promise<{ success: boolean; credits?: number; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: 'API key not configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 402) {
          return { success: false, error: 'Insufficient credits' };
        } else if (response.status === 401) {
          return { success: false, error: 'Invalid API key' };
        }
        return { success: false, error: `HTTP ${response.status}` };
      }

      const accountData = await response.json();
      console.log('📊 D-ID Account Status:', accountData);
      
      return {
        success: true,
        credits: accountData.credits || 0
      };
    } catch (error) {
      console.error('Failed to check D-ID account status:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Test D-ID API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'D-ID service not properly configured' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/talks/streams`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: `https://d-id-public-bucket.s3.amazonaws.com/amy-jcwCkr1g.jpg`,
          config: {
            result_format: 'mp4',
            fluent: true,
            pad_audio: 0.0
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Clean up the test session
        if (data.id) {
          await this.stopStream(data.id);
        }
        return { success: true };
      } else {
        const errorText = await response.text();
        return { success: false, error: `HTTP ${response.status}: ${errorText}` };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Generate professional interview question response
   */
  async generateInterviewResponse(question: string): Promise<DIDRealTimeResponse> {
    // Process the question to make it more natural for TTS
    const processedQuestion = this.processQuestionForTTS(question);
    
    return this.generateAvatarResponse(processedQuestion);
  }

  /**
   * Process question text to make it more suitable for text-to-speech
   */
  private processQuestionForTTS(text: string): string {
    // Remove any special characters that might cause TTS issues
    let processed = text
      .replace(/[^\w\s.,!?]/g, '') // Remove special characters except basic punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Ensure the text ends with proper punctuation
    if (!/[.!?]$/.test(processed)) {
      processed += '.';
    }

    // Limit length for better TTS performance
    if (processed.length > 500) {
      processed = processed.substring(0, 497) + '...';
    }

    return processed;
  }

  /**
   * Get available avatar options for D-ID
   */
  getAvailableAvatars(): string[] {
    return [
      'amy-jcwCkr1g',
      'sara-8xG1l4lk',
      'david-At0rrMng',
      'emma-7s9QpR1k'
    ];
  }

  /**
   * Get available voice options
   */
  getAvailableVoices(): string[] {
    return [
      'amy',
      'sarah',
      'david',
      'emma'
    ];
  }
}

// Export singleton instance
export const didRealTimeService = new DIDRealTimeService();
export default didRealTimeService;

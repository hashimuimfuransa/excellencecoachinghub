// AvatarTalk API Service
export interface AvatarTalkRequest {
  text: string;
  avatar: string;
  emotion: string;
  language: string;
  stream?: boolean;
}

export interface AvatarTalkResponse {
  mp4_url: string;
  stream_url?: string; // For streaming support
  avatar: string;
  emotion: string;
  language: string;
  text: string;
  duration?: number;
  status: 'success' | 'processing' | 'error';
  success: boolean; // Added for compatibility
  error?: string;
  streamResponse?: Response; // For streaming video data
}

class AvatarTalkService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  
  // Valid emotions according to AvatarTalk API
  private readonly validEmotions = ['happy', 'neutral', 'serious', 'surprise', 'fear', 'disgust'];
  private readonly validAvatars = ['japanese_man', 'old_european_woman', 'european_woman', 'black_man', 'japanese_woman', 'iranian_man', 'mexican_man', 'mexican_woman'];
  
  // Simple cache for frequently used videos
  private videoCache = new Map<string, string>();
  private readonly maxCacheSize = 10;
  
  constructor() {
    // Remove any query parameters from the base URL
    const baseUrl = import.meta.env.VITE_AVATARTALK_API_URL || 'https://avatartalk.ai/api/inference';
    this.apiUrl = baseUrl.includes('?') ? baseUrl.split('?')[0] : baseUrl;
    // Use environment variable first, fallback to hardcoded key
    this.apiKey = import.meta.env.VITE_AVATARTALK_API_KEY || 'Q3qCR_yrFcWdVbhB17s4UAQekE8MkB9Kz_9JCz6kF38';
    
    if (!this.apiKey) {
      console.warn('AvatarTalk API key not found in environment variables');
    }
  }

  /**
   * Validate and normalize emotion parameter
   */
  private validateEmotion(emotion: string): string {
    const normalizedEmotion = emotion.toLowerCase();
    if (!this.validEmotions.includes(normalizedEmotion)) {
      console.warn(`Invalid emotion "${emotion}". Using "neutral" instead. Valid emotions: ${this.validEmotions.join(', ')}`);
      return 'neutral';
    }
    return normalizedEmotion;
  }

  /**
   * Validate and normalize avatar parameter
   */
  private validateAvatar(avatar: string): string {
    if (!this.validAvatars.includes(avatar)) {
      console.warn(`Invalid avatar "${avatar}". Using "european_woman" instead. Valid avatars: ${this.validAvatars.join(', ')}`);
      return 'european_woman';
    }
    return avatar;
  }

  /**
   * Generate cache key for video request
   */
  private generateCacheKey(request: AvatarTalkRequest): string {
    const textHash = request.text.length > 50 ? 
      request.text.substring(0, 50) + '...' : 
      request.text;
    return `${request.avatar}_${request.emotion}_${request.language}_${textHash}`;
  }

  /**
   * Get video from cache
   */
  private getCachedVideo(key: string): string | null {
    return this.videoCache.get(key) || null;
  }

  /**
   * Cache video URL
   */
  private cacheVideo(key: string, url: string): void {
    // Simple LRU: remove oldest if cache is full
    if (this.videoCache.size >= this.maxCacheSize) {
      const firstKey = this.videoCache.keys().next().value;
      this.videoCache.delete(firstKey);
    }
    this.videoCache.set(key, url);
  }

  /**
   * Generate a speaking avatar video from text
   */
  async generateVideo(request: AvatarTalkRequest): Promise<AvatarTalkResponse> {
    if (!this.apiKey) {
      throw new Error('AvatarTalk API key not configured');
    }

    console.log('🚀 Fast video generation starting...', {
      textLength: request.text.length,
      avatar: request.avatar,
      emotion: request.emotion
    });

    // Validate and normalize parameters
    const validatedAvatar = this.validateAvatar(request.avatar);
    const validatedEmotion = this.validateEmotion(request.emotion);
    
    const normalizedRequest = {
      ...request,
      avatar: validatedAvatar,
      emotion: validatedEmotion
    };

    // Check cache first (only for non-streaming requests)
    if (!request.stream) {
      const cacheKey = this.generateCacheKey(normalizedRequest);
      const cachedUrl = this.getCachedVideo(cacheKey);
      if (cachedUrl) {
        console.log('⚡ Using cached video for instant response:', cacheKey);
        return {
          mp4_url: cachedUrl,
          avatar: validatedAvatar,
          emotion: validatedEmotion,
          language: request.language,
          text: request.text,
          status: 'success',
          success: true
        };
      }
    }

    const startTime = Date.now();

    try {
      // Always use non-streaming for fastest response with high quality
      const requestBody = {
        text: request.text,
        avatar: validatedAvatar,
        emotion: validatedEmotion,
        language: request.language,
        quality: 'high', // Request high quality video
        resolution: '720p' // Request 720p resolution for better quality
      };
      
      console.log('📡 Sending request to AvatarTalk API...');
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      const responseTime = Date.now() - startTime;
      console.log(`⏱️ API response received in ${responseTime}ms`);

      if (!response.ok) {
        let errorText;
        try {
          errorText = await response.text();
          console.error('❌ AvatarTalk API Error:', errorText);
        } catch {
          errorText = response.statusText;
        }
        throw new Error(`AvatarTalk API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log(`✅ Video generated successfully in ${responseTime}ms:`, data.mp4_url ? 'URL received' : 'No URL');
      
      const result = {
        mp4_url: data.mp4_url,
        stream_url: data.stream_url,
        avatar: data.avatar || validatedAvatar,
        emotion: data.emotion || validatedEmotion,
        language: data.language || request.language,
        text: data.text || request.text,
        duration: data.duration,
        status: 'success',
        success: true
      };

      // Cache successful video URL
      if (result.mp4_url && !request.stream) {
        const cacheKey = this.generateCacheKey(normalizedRequest);
        this.cacheVideo(cacheKey, result.mp4_url);
        console.log('💾 Cached video:', cacheKey);
      }
      
      return result;
    } catch (error) {
      console.error('AvatarTalk API error:', error);
      
      return {
        mp4_url: '',
        stream_url: '',
        avatar: request.avatar,
        emotion: request.emotion,
        language: request.language,
        text: request.text,
        status: 'error',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Generate streaming video for immediate playback
   */
  async generateStreamingVideo(request: AvatarTalkRequest): Promise<Response> {
    if (!this.apiKey) {
      throw new Error('AvatarTalk API key not configured');
    }

    // Validate and normalize parameters
    const validatedAvatar = this.validateAvatar(request.avatar);
    const validatedEmotion = this.validateEmotion(request.emotion);

    console.log('🎥 Starting streaming video generation:', {
      text: request.text.substring(0, 100),
      avatar: validatedAvatar,
      emotion: validatedEmotion,
      language: request.language,
      apiUrl: this.apiUrl,
      hasApiKey: !!this.apiKey
    });

    const requestBody = {
      text: request.text,
      avatar: validatedAvatar,
      emotion: validatedEmotion,
      language: request.language,
      stream: true
    };

    console.log('🔄 API Request Body:', requestBody);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/octet-stream, video/mp4, */*',
          'User-Agent': 'ExcellenceCoachingHub/1.0'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        let errorMessage;
        try {
          const errorText = await response.text();
          console.error('❌ API Error Response:', errorText);
          errorMessage = `HTTP ${response.status}: ${errorText || response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      return response;
    } catch (error) {
      console.error('❌ API Request Failed:', error);
      throw error;
    }
  }

  /**
   * Generate interview welcome message
   */
  async generateWelcomeMessage(
    messageContext: string, 
    avatar: string = 'european_woman', 
    stream: boolean = false
  ): Promise<AvatarTalkResponse> {
    const welcomeText = `Hello and welcome to your AI interview for ${messageContext}. I'm your virtual interviewer and I'll be conducting this interview today. Please make sure you're in a quiet environment and your microphone is working properly. We'll start with a few questions to assess your qualifications for this role. Are you ready to begin?`;
    
    return this.generateVideo({
      text: welcomeText,
      avatar: avatar,
      emotion: 'happy',
      language: 'en',
      stream: stream
    });
  }

  /**
   * Generate question video
   */
  async generateQuestionVideo(question: string, questionType: string): Promise<AvatarTalkResponse> {
    // Adjust emotion based on question type
    let emotion = 'neutral';
    if (questionType === 'behavioral') {
      emotion = 'happy';
    } else if (questionType === 'technical') {
      emotion = 'serious';
    }

    return this.generateVideo({
      text: question,
      avatar: 'european_woman',
      emotion: emotion,
      language: 'en'
    });
  }

  /**
   * Generate response acknowledgment
   */
  async generateAcknowledgment(isLast: boolean = false): Promise<AvatarTalkResponse> {
    const acknowledgments = [
      "Thank you for that response. Let me prepare the next question for you.",
      "I appreciate your detailed answer. Moving on to the next question.",
      "That's a good response. Let's continue with the next question.",
      "Thank you for sharing that. Here's your next question."
    ];
    
    const completionMessage = "Thank you for your response. That concludes our interview. I'm now processing your answers and will provide you with detailed feedback shortly.";
    
    const text = isLast ? completionMessage : acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
    
    return this.generateVideo({
      text: text,
      avatar: 'european_woman',
      emotion: 'positive',
      language: 'en'
    });
  }

  /**
   * Generate final results presentation
   */
  async generateResultsMessage(score: number, feedback: string): Promise<AvatarTalkResponse> {
    const scoreText = score >= 85 ? "excellent" : score >= 75 ? "good" : score >= 65 ? "satisfactory" : "needs improvement";
    
    const resultsText = `Congratulations on completing the interview! Your overall performance was ${scoreText} with a score of ${score} out of 100. ${feedback} I hope this interview experience was valuable for you. Best of luck with your application!`;
    
    return this.generateVideo({
      text: resultsText,
      avatar: 'european_woman',
      emotion: 'positive',
      language: 'en'
    });
  }

  /**
   * Check if service is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey && !!this.apiUrl;
  }

  /**
   * Test API connection and configuration
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Service not properly configured' };
    }

    try {
      // Test with a simple request
      const testRequest = {
        text: 'Test connection',
        avatar: 'european_woman',
        emotion: 'neutral',
        language: 'en'
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'ExcellenceCoachingHub/1.0'
        },
        body: JSON.stringify(testRequest)
      });

      if (response.ok) {
        return { success: true };
      } else {
        const errorText = await response.text().catch(() => response.statusText);
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
   * Get available avatar options
   */
  getAvailableAvatars(): string[] {
    return [...this.validAvatars];
  }

  /**
   * Get available emotion options
   */
  getAvailableEmotions(): string[] {
    return [...this.validEmotions];
  }

  /**
   * Generate interview question with avatar
   */
  async generateInterviewQuestion(
    questionText: string,
    avatar: string,
    emotion: string = 'neutral',
    language: string = 'en',
    stream: boolean = false
  ): Promise<AvatarTalkResponse> {
    return this.generateVideo({
      text: questionText,
      avatar: avatar,
      emotion: emotion,
      language: language,
      stream: stream
    });
  }

  /**
   * Get interview emotion based on question type
   */
  getInterviewEmotion(questionType: string): string {
    switch (questionType) {
      case 'question':
      case 'behavioral':
        return 'friendly';
      case 'technical':
        return 'professional';
      case 'situational':
        return 'serious';
      default:
        return 'neutral';
    }
  }

  /**
   * Generate closing message for interview
   */
  async generateClosingMessage(
    avatar: string,
    stream: boolean = false
  ): Promise<AvatarTalkResponse> {
    const closingText = "Thank you for completing this interview. I'm now processing your responses and will provide you with detailed feedback shortly. Good luck with your application!";
    
    return this.generateVideo({
      text: closingText,
      avatar: avatar,
      emotion: 'positive',
      language: 'en',
      stream: stream
    });
  }
}

// Export singleton instance
export const avatarTalkService = new AvatarTalkService();
export default avatarTalkService;
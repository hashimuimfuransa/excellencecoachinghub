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
}

class AvatarTalkService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  
  constructor() {
    this.apiUrl = import.meta.env.VITE_AVATARTALK_API_URL || 'https://avatartalk.ai/api/inference';
    this.apiKey = import.meta.env.VITE_AVATARTALK_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('AvatarTalk API key not found in environment variables');
    }
  }

  /**
   * Generate a speaking avatar video from text
   */
  async generateVideo(request: AvatarTalkRequest): Promise<AvatarTalkResponse> {
    if (!this.apiKey) {
      throw new Error('AvatarTalk API key not configured');
    }

    try {
      const url = request.stream ? `${this.apiUrl}?stream=true` : this.apiUrl;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: request.text,
          avatar: request.avatar,
          emotion: request.emotion,
          language: request.language
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AvatarTalk API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      return {
        mp4_url: data.mp4_url,
        stream_url: data.stream_url, // For streaming support
        avatar: data.avatar || request.avatar,
        emotion: data.emotion || request.emotion,
        language: data.language || request.language,
        text: data.text || request.text,
        duration: data.duration,
        status: 'success',
        success: true
      };
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
   * Generate interview welcome message
   */
  async generateWelcomeMessage(
    messageContext: string, 
    avatar: string = 'black_man', 
    stream: boolean = false
  ): Promise<AvatarTalkResponse> {
    const welcomeText = `Hello and welcome to your AI interview for ${messageContext}. I'm your virtual interviewer and I'll be conducting this interview today. Please make sure you're in a quiet environment and your microphone is working properly. We'll start with a few questions to assess your qualifications for this role. Are you ready to begin?`;
    
    return this.generateVideo({
      text: welcomeText,
      avatar: avatar,
      emotion: 'friendly',
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
      emotion = 'friendly';
    } else if (questionType === 'technical') {
      emotion = 'serious';
    }

    return this.generateVideo({
      text: question,
      avatar: 'black_man',
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
      avatar: 'black_man',
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
      avatar: 'black_man',
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
   * Get available avatar options
   */
  getAvailableAvatars(): string[] {
    return [
      'black_man',
      'white_woman',
      'asian_man',
      'hispanic_woman',
      'indian_man'
    ];
  }

  /**
   * Get available emotion options
   */
  getAvailableEmotions(): string[] {
    return [
      'neutral',
      'happy',
      'serious',
      'friendly',
      'positive',
      'professional'
    ];
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
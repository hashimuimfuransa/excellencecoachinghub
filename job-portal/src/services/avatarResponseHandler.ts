/**
 * Avatar Response Handler
 * Processes candidate questions and generates professional responses for AI avatars
 */

import { didRealTimeService, DIDRealTimeResponse } from './didRealTimeService';
import { avatarTalkService } from './avatarTalkService';

export interface AvatarResponse {
  text: string;
  avatar: 'did' | 'talkavatar';
}

export interface ProcessedQuestion {
  originalQuestion: string;
  processedQuestion: string;
  questionType: 'behavioral' | 'technical' | 'situational' | 'general';
  difficulty: 'easy' | 'medium' | 'hard';
}

class AvatarResponseHandler {
  private readonly maxResponseLength = 200; // Keep responses concise for TTS
  private readonly minResponseLength = 20;

  /**
   * Process a candidate's question and generate avatar response
   */
  async processQuestion(question: string): Promise<AvatarResponse> {
    try {
      console.log('🤖 Processing question for avatar response:', question.substring(0, 50) + '...');
      
      // Analyze and process the question
      const processedQuestion = this.analyzeQuestion(question);
      
      // Generate professional response
      const response = await this.generateProfessionalResponse(processedQuestion);
      
      // Check if D-ID is available before attempting
      const isDIDAvailable = await didRealTimeService.isAvailable();
      
      if (isDIDAvailable) {
        console.log('🎥 Attempting D-ID Real-Time API (Primary)');
        const didResponse = await didRealTimeService.generateInterviewResponse(response);
        
        if (didResponse.success && didResponse.avatar === 'did') {
          console.log('✅ D-ID Real-Time API successful');
          return {
            text: response,
            avatar: 'did'
          };
        } else {
          console.log('🔄 D-ID Real-Time API failed, falling back to talkavatar');
        }
      } else {
        console.log('⚠️ D-ID not available (credits, CORS, or configuration issue), using talkavatar');
      }
      
      // Fallback to talkavatar
      return {
        text: response,
        avatar: 'talkavatar'
      };
    } catch (error) {
      console.error('Error processing question:', error);
      // Return fallback response
      return {
        text: this.generateFallbackResponse(question),
        avatar: 'talkavatar'
      };
    }
  }

  /**
   * Analyze question to determine type and difficulty
   */
  private analyzeQuestion(question: string): ProcessedQuestion {
    const lowerQuestion = question.toLowerCase();
    
    // Determine question type
    let questionType: 'behavioral' | 'technical' | 'situational' | 'general' = 'general';
    
    if (lowerQuestion.includes('tell me about') || 
        lowerQuestion.includes('describe a time') ||
        lowerQuestion.includes('give me an example') ||
        lowerQuestion.includes('situation where')) {
      questionType = 'behavioral';
    } else if (lowerQuestion.includes('how would you') ||
               lowerQuestion.includes('what would you do') ||
               lowerQuestion.includes('if you were')) {
      questionType = 'situational';
    } else if (lowerQuestion.includes('explain') ||
               lowerQuestion.includes('how does') ||
               lowerQuestion.includes('what is') ||
               lowerQuestion.includes('define')) {
      questionType = 'technical';
    }

    // Determine difficulty based on question complexity
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
    
    if (question.length < 50 && !lowerQuestion.includes('explain') && !lowerQuestion.includes('describe')) {
      difficulty = 'easy';
    } else if (question.length > 100 || lowerQuestion.includes('complex') || lowerQuestion.includes('detailed')) {
      difficulty = 'hard';
    }

    return {
      originalQuestion: question,
      processedQuestion: this.cleanQuestionText(question),
      questionType,
      difficulty
    };
  }

  /**
   * Clean question text for better processing
   */
  private cleanQuestionText(question: string): string {
    return question
      .replace(/[^\w\s.,!?]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Generate professional response based on question analysis
   */
  private async generateProfessionalResponse(processedQuestion: ProcessedQuestion): Promise<string> {
    const { questionType, difficulty, processedQuestion: question } = processedQuestion;
    
    // Generate contextual response based on question type
    let response = '';
    
    switch (questionType) {
      case 'behavioral':
        response = this.generateBehavioralResponse(question, difficulty);
        break;
      case 'technical':
        response = this.generateTechnicalResponse(question, difficulty);
        break;
      case 'situational':
        response = this.generateSituationalResponse(question, difficulty);
        break;
      default:
        response = this.generateGeneralResponse(question, difficulty);
    }

    // Ensure response is within length limits
    if (response.length > this.maxResponseLength) {
      response = response.substring(0, this.maxResponseLength - 3) + '...';
    } else if (response.length < this.minResponseLength) {
      response = this.generateFallbackResponse(question);
    }

    return response;
  }

  /**
   * Generate response for behavioral questions
   */
  private generateBehavioralResponse(question: string, difficulty: 'easy' | 'medium' | 'hard'): string {
    const responses = {
      easy: [
        "I have experience in that area and can provide specific examples from my previous roles.",
        "That's a great question. I've handled similar situations in my career.",
        "I can share a relevant example that demonstrates my approach to that challenge."
      ],
      medium: [
        "I've encountered similar situations in my professional experience. Let me share a specific example that highlights my problem-solving approach.",
        "That's an important behavioral question. I can provide a detailed example that shows my leadership and decision-making skills.",
        "I have relevant experience in that area. I'll share a specific situation that demonstrates my capabilities."
      ],
      hard: [
        "That's a complex behavioral question that requires careful consideration. I can provide a detailed example that demonstrates my strategic thinking and leadership abilities.",
        "I've faced challenging situations like this in my career. Let me share a comprehensive example that shows my problem-solving methodology and results achieved.",
        "This is an excellent question that allows me to demonstrate my experience with complex challenges. I'll provide a detailed example with specific outcomes."
      ]
    };

    return this.selectRandomResponse(responses[difficulty]);
  }

  /**
   * Generate response for technical questions
   */
  private generateTechnicalResponse(question: string, difficulty: 'easy' | 'medium' | 'hard'): string {
    const responses = {
      easy: [
        "I have solid knowledge in that technical area and can explain the key concepts clearly.",
        "That's a fundamental technical question. I can provide a clear explanation based on my experience.",
        "I'm familiar with that technology and can discuss its practical applications."
      ],
      medium: [
        "I have strong technical expertise in that area. Let me explain the concepts and share relevant examples from my experience.",
        "That's a good technical question. I can provide a detailed explanation with practical examples.",
        "I have hands-on experience with that technology and can discuss both theoretical and practical aspects."
      ],
      hard: [
        "That's an advanced technical question that requires deep understanding. I can provide a comprehensive explanation with detailed examples and best practices.",
        "I have extensive experience in that technical domain. Let me share detailed insights and real-world applications.",
        "This is a complex technical topic. I can provide a thorough explanation covering multiple aspects and practical implementations."
      ]
    };

    return this.selectRandomResponse(responses[difficulty]);
  }

  /**
   * Generate response for situational questions
   */
  private generateSituationalResponse(question: string, difficulty: 'easy' | 'medium' | 'hard'): string {
    const responses = {
      easy: [
        "I would approach that situation systematically, considering all relevant factors before making a decision.",
        "That's an interesting scenario. I would analyze the situation and take appropriate action based on best practices.",
        "I would handle that situation by first understanding the context and then implementing an effective solution."
      ],
      medium: [
        "I would approach that situation by first analyzing the context, identifying key stakeholders, and developing a strategic plan to address the challenge effectively.",
        "That's a complex scenario that requires careful consideration. I would assess the situation, consider multiple options, and implement the most appropriate solution.",
        "I would handle that situation by conducting a thorough analysis, consulting with relevant parties, and executing a well-planned approach."
      ],
      hard: [
        "That's a challenging scenario that requires strategic thinking and comprehensive analysis. I would approach it systematically, considering multiple perspectives and potential outcomes before implementing a solution.",
        "I would tackle that complex situation by first conducting a detailed assessment, identifying all stakeholders and constraints, developing multiple solution options, and implementing the most effective approach.",
        "This scenario requires careful strategic planning and execution. I would analyze the situation thoroughly, consider various approaches, and implement a solution that addresses all key aspects effectively."
      ]
    };

    return this.selectRandomResponse(responses[difficulty]);
  }

  /**
   * Generate response for general questions
   */
  private generateGeneralResponse(question: string, difficulty: 'easy' | 'medium' | 'hard'): string {
    const responses = {
      easy: [
        "I appreciate that question. I can provide a clear and concise answer based on my experience.",
        "That's a good question. Let me share my perspective on that topic.",
        "I can address that question with relevant examples from my background."
      ],
      medium: [
        "That's an excellent question that allows me to share relevant insights from my professional experience.",
        "I appreciate the opportunity to discuss that topic. I can provide detailed insights based on my background.",
        "That's a thoughtful question. I can share comprehensive information based on my experience and knowledge."
      ],
      hard: [
        "That's a comprehensive question that requires detailed consideration. I can provide thorough insights based on my extensive experience and expertise.",
        "I appreciate the depth of that question. I can share detailed perspectives and examples that demonstrate my understanding and experience.",
        "That's an excellent question that allows me to showcase my knowledge and experience. I can provide comprehensive insights and relevant examples."
      ]
    };

    return this.selectRandomResponse(responses[difficulty]);
  }

  /**
   * Generate fallback response when other methods fail
   */
  private generateFallbackResponse(question: string): string {
    const fallbackResponses = [
      "I appreciate that question and can provide insights based on my experience.",
      "That's a good question. I can share relevant information from my background.",
      "I can address that question with examples from my professional experience.",
      "That's an interesting question. Let me share my perspective on that topic.",
      "I can provide insights on that topic based on my knowledge and experience."
    ];

    return this.selectRandomResponse(fallbackResponses);
  }

  /**
   * Select a random response from an array
   */
  private selectRandomResponse(responses: string[]): string {
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
  }

  /**
   * Generate welcome message for interview
   */
  async generateWelcomeMessage(jobTitle?: string): Promise<AvatarResponse> {
    const welcomeText = jobTitle 
      ? `Hello and welcome to your AI interview for the ${jobTitle} position. I'm your virtual interviewer and I'll be conducting this interview today. Please make sure you're in a quiet environment and your microphone is working properly. We'll start with a few questions to assess your qualifications for this role. Are you ready to begin?`
      : `Hello and welcome to your AI interview. I'm your virtual interviewer and I'll be conducting this interview today. Please make sure you're in a quiet environment and your microphone is working properly. We'll start with a few questions to assess your qualifications. Are you ready to begin?`;

    try {
      console.log('🎥 Generating welcome message with D-ID Real-Time API (Primary)');
      
      // Check if D-ID is available before attempting
      const isDIDAvailable = await didRealTimeService.isAvailable();
      
      if (isDIDAvailable) {
        const didResponse = await didRealTimeService.generateInterviewResponse(welcomeText);
        
        if (didResponse.success && didResponse.avatar === 'did') {
          console.log('✅ D-ID Real-Time welcome message successful');
          return {
            text: welcomeText,
            avatar: 'did'
          };
        } else {
          console.log('🔄 D-ID Real-Time welcome failed, using talkavatar');
        }
      } else {
        console.log('⚠️ D-ID not available for welcome message, using talkavatar');
      }
      
      // Fallback to talkavatar
      return {
        text: welcomeText,
        avatar: 'talkavatar'
      };
    } catch (error) {
      console.error('❌ Error generating welcome message with D-ID:', error);
      console.log('🔄 Falling back to talkavatar for welcome message');
      return {
        text: welcomeText,
        avatar: 'talkavatar'
      };
    }
  }

  /**
   * Generate acknowledgment message
   */
  async generateAcknowledgment(isLast: boolean = false): Promise<AvatarResponse> {
    const acknowledgmentText = isLast
      ? "Thank you for completing this interview. I'm now processing your responses and will provide you with detailed feedback shortly. Good luck with your application!"
      : "Thank you for that response. Let me prepare the next question for you.";

    try {
      const didResponse = await didRealTimeService.generateInterviewResponse(acknowledgmentText);
      
      if (didResponse.success && didResponse.avatar === 'did') {
        return {
          text: acknowledgmentText,
          avatar: 'did'
        };
      } else {
        return {
          text: acknowledgmentText,
          avatar: 'talkavatar'
        };
      }
    } catch (error) {
      console.error('Error generating acknowledgment:', error);
      return {
        text: acknowledgmentText,
        avatar: 'talkavatar'
      };
    }
  }

  /**
   * Check if services are available
   */
  async checkServices(): Promise<{ did: boolean; talkavatar: boolean }> {
    const didTest = await didRealTimeService.testConnection();
    const talkavatarTest = avatarTalkService.isConfigured();
    
    return {
      did: didTest.success,
      talkavatar: talkavatarTest
    };
  }
}

// Export singleton instance
export const avatarResponseHandler = new AvatarResponseHandler();
export default avatarResponseHandler;

import { apiService } from './apiService';
import { geminiAIService } from './geminiAIService';

// AI Assistant interfaces
export interface IChatMessage {
  id: string;
  question: string;
  response: string;
  timestamp: Date;
  context?: string;
  courseId?: string;
}

export interface IStudySuggestion {
  suggestions: string;
  progressSummary: {
    completedChapters: number;
    totalChapters: number;
    averageScore: number;
    progressPercentage: number;
  };
}

export interface IConceptExplanation {
  concept: string;
  explanation: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timestamp: Date;
}

export interface IHomeworkHelp {
  question: string;
  help: string;
  disclaimer: string;
  timestamp: Date;
}

export interface IPracticeQuestion {
  id: string;
  type: string;
  question: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
  difficulty: string;
  points: number;
}

export interface IPracticeQuestions {
  topic: string;
  difficulty: string;
  questions: IPracticeQuestion[];
  note: string;
}

export interface IAIAvailability {
  available: boolean;
  message: string;
}

// Mock response functions with platform knowledge and context awareness
const getMockResponse = (userMessage: string, context?: any): string => {
  const message = userMessage.toLowerCase();

  // Platform and website help
  if (message.includes('platform') || message.includes('website') || message.includes('how to use')) {
    return `Welcome to Excellence Coaching Hub! 🎓 Here's how to make the most of our platform:

**📚 Courses:** Go to "My Courses" to see enrolled courses or browse new ones. Click any course to access materials, videos, and assignments.

**📝 Assessments:** Visit "Assessments" to take quizzes and tests. Your scores are automatically tracked and you can retake them to improve.

**🎥 Live Sessions:** Check "Live Sessions" for upcoming classes with instructors. Join directly from the platform when sessions start.

**📊 Progress:** Track your learning journey in "Progress" - see completion rates, scores, and identify areas needing focus.

**🤖 AI Assistant:** That's me! I'm always here to help with explanations, quizzes, study tips, and platform guidance.

What specific feature would you like to know more about?`;
  }

  // Course-related questions
  else if (message.includes('course') && (message.includes('how') || message.includes('enroll'))) {
    return `**Enrolling in Courses:**
1. Click "My Courses" in the sidebar
2. Switch to the "Browse Courses" tab
3. Use filters to find courses by category or search
4. Click "Enroll Now" on courses that interest you
5. Once enrolled, access course content anytime

**Course Features:**
• Video lessons and reading materials
• Interactive assignments and projects
• Progress tracking and completion certificates
• Discussion forums with other students
• Direct access to instructors during live sessions

Need help with a specific course or want recommendations?`;
  }

  // Assessment help
  else if (message.includes('assessment') || message.includes('quiz') || (message.includes('test') && !message.includes('practice'))) {
    return `**Taking Assessments:**
1. Go to "Assessments" in the sidebar
2. You'll see all available quizzes for your enrolled courses
3. Click "Take Assessment" to start
4. Answer questions at your own pace
5. Submit when complete - results are instant!

**Assessment Features:**
• Multiple choice and short answer questions
• Immediate feedback and explanations
• Multiple attempts allowed (if enabled)
• Progress tracking and grade history
• Special support for math equations and formulas

Want me to create a practice quiz for you?`;
  }

  // Live sessions help
  else if (message.includes('live session') || message.includes('session') || message.includes('class')) {
    return `**Joining Live Sessions:**
1. Check "Live Sessions" for your schedule
2. Sessions show for all your enrolled courses
3. Click "Join Session" when it's time
4. Use video, audio, and chat to participate
5. Sessions are often recorded for later review

**Live Session Features:**
• Real-time interaction with instructors
• Screen sharing and whiteboard tools
• Breakout rooms for group work
• Q&A and polling features
• Automatic attendance tracking

Any specific session you need help with?`;
  }

  // Progress tracking
  else if (message.includes('progress') || message.includes('track')) {
    return `**Tracking Your Progress:**
1. Visit "Progress" in the sidebar for detailed analytics
2. See completion percentages for each course
3. View your quiz scores and improvement trends
4. Identify topics that need more attention
5. Celebrate achievements and milestones!

**Progress Features:**
• Visual charts and graphs
• Course completion tracking
• Assessment score history
• Time spent learning
• Achievement badges and certificates

Want tips on how to improve your progress?`;
  }

  // Learning content explanations (context-aware)
  else if (message.includes('explain') || message.includes('what is')) {
    const courseInfo = context?.courseTitle ? ` in your "${context.courseTitle}" course` : '';
    const hasContent = context?.content && !context.content.includes('No course content available');

    let response = `I'd be happy to explain that concept${courseInfo}! 📖\n\n`;

    if (hasContent) {
      response += `Based on your course materials, I can provide detailed explanations with examples from your actual lessons. `;
      response += `Understanding these concepts deeply will help you succeed in your coursework.\n\n`;
      response += `Since I can see your course content, I can:\n`;
      response += `• Explain concepts using your specific course materials\n`;
      response += `• Create practice questions based on your lessons\n`;
      response += `• Connect topics to what you've already studied\n\n`;
      response += `What specific concept would you like me to explain?`;
    } else {
      response += `To give you the most relevant explanation, I'd recommend:\n`;
      response += `1. Go to your Course Content section first\n`;
      response += `2. Review the materials for the topic you want explained\n`;
      response += `3. Come back and ask me to explain specific concepts\n`;
      response += `4. I'll then provide explanations based on your actual course content!\n\n`;
      response += `This way, my explanations will be directly relevant to your coursework.`;
    }

    return response;
  }

  // Quiz generation (content-dependent)
  else if (message.includes('quiz') || message.includes('practice')) {
    return `I'd love to create a practice quiz for you! 📝 However, I need access to your course content or notes to generate meaningful questions.

**To create a quiz, I need:**
• Course notes or lesson materials
• Specific topics you've been studying
• Content from your enrolled courses

**Here's how to get a quiz:**
1. Go to "Course Content" and study some materials
2. Come back and ask me to create a quiz
3. I'll generate questions based on what you've learned!

**Alternative options:**
• Tell me specific topics to explain first
• Ask me to help you understand concepts
• Request study strategies for your courses

What course content are you working with right now?`;
  }

  // Study tips
  else if (message.includes('study') || message.includes('tips')) {
    return `Here are proven study strategies to boost your learning! 🎯

**Effective Techniques:**
1. **Active Recall** - Test yourself instead of just re-reading
2. **Spaced Repetition** - Review material at increasing intervals
3. **Pomodoro Technique** - Study in focused 25-minute sessions
4. **Connect Concepts** - Link new info to what you already know

**Platform-Specific Tips:**
• Use Progress tracking to identify weak areas
• Take practice assessments regularly
• Attend live sessions for interactive learning
• Ask me questions whenever you're stuck!

What subject are you studying? I can give more specific advice!`;
  }

  // Help and support
  else if (message.includes('help') || message.includes('stuck')) {
    return "I'm here to help you succeed! 💪 Getting stuck is normal - it means you're challenging yourself to learn something new. Tell me specifically what's confusing you, and I can break it down into manageable steps, provide examples, or suggest different approaches. You can also use platform resources like course materials, live sessions, or discussion forums!";
  }

  // Greetings
  else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return `Hello! 👋 Welcome to Excellence Coaching Hub! I'm your AI learning assistant, excited to help you on your educational journey. Whether you need help with coursework, want to understand platform features, or just want to chat about your studies, I'm here for you 24/7. What would you like to explore today?`;
  }

  // General response
  else {
    return `That's a great question! I'm your AI learning assistant for Excellence Coaching Hub. 🌟 I can help you with academic concepts, create practice quizzes, provide study strategies, and guide you through platform features. I'm designed to make your learning experience more effective and enjoyable. What specific area would you like assistance with?`;
  }
};

// Generate suggestions based on user message and context
const generateSuggestions = (userMessage: string, context?: any): string[] => {
  const message = userMessage.toLowerCase();
  const suggestions: string[] = [];

  if (message.includes('platform') || message.includes('website')) {
    suggestions.push('How do courses work?', 'Explain assessments', 'Show me live sessions', 'Track my progress');
  } else if (message.includes('course')) {
    suggestions.push('How to enroll?', 'Access course content', 'Join live sessions', 'Track progress');
  } else if (message.includes('assessment') || message.includes('quiz')) {
    suggestions.push('How do I take tests?', 'Practice quiz please', 'Explain my scores', 'Study tips');
  } else if (message.includes('explain')) {
    suggestions.push('Create a quiz on this', 'Show me examples', 'Study tips', 'More details please');
  } else if (message.includes('study')) {
    suggestions.push('Platform study tools', 'Create practice quiz', 'Track my progress', 'Learning strategies');
  } else if (message.includes('hello') || message.includes('hi')) {
    suggestions.push('How to use platform?', 'Explain a concept', 'Create a quiz', 'Study strategies');
  } else {
    suggestions.push('Platform help', 'Explain concepts', 'Practice quiz', 'Study tips');
  }

  // Add context-specific suggestions
  if (context?.courseTitle) {
    suggestions.push(`More about ${context.courseTitle}`);
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
};

const getMockSuggestions = (userMessage: string): string[] => {
  const message = userMessage.toLowerCase();

  if (message.includes('platform') || message.includes('website')) {
    return ['How do courses work?', 'Explain assessments', 'Show me live sessions', 'Track my progress'];
  } else if (message.includes('course')) {
    return ['How to enroll?', 'Access course content', 'Join live sessions', 'Track progress'];
  } else if (message.includes('assessment') || message.includes('quiz')) {
    return ['How do I take tests?', 'Practice quiz please', 'Explain my scores', 'Study tips'];
  } else if (message.includes('explain')) {
    return ['Create a quiz on this', 'Show me examples', 'Study tips', 'More details please'];
  } else if (message.includes('study')) {
    return ['Platform study tools', 'Create practice quiz', 'Track my progress', 'Learning strategies'];
  } else if (message.includes('hello') || message.includes('hi')) {
    return ['How to use platform?', 'Explain a concept', 'Create a quiz', 'Study strategies'];
  } else {
    return ['Platform help', 'Explain concepts', 'Practice quiz', 'Study tips'];
  }
};

// AI Assistant service
export const aiAssistantService = {
  // Send message to AI assistant (for floating chat) - Prioritizes backend API for real AI responses
  sendMessage: async (data: {
    userMessage: string;
    context?: any;
    previousMessages?: any[];
  }): Promise<{ message: string; suggestions?: string[] }> => {
    console.log('AI Assistant: Processing message:', data.userMessage);
    console.log('AI Assistant: Context:', data.context);

    try {
      // Skip backend API to avoid authentication issues - go directly to Gemini AI
      console.log('AI Assistant: Using direct Gemini AI...');
      
      // Try direct Gemini AI first
      const geminiResponse = await geminiAIService.sendMessage({
        userMessage: data.userMessage,
        context: data.context,
        previousMessages: data.previousMessages
      });

      console.log('AI Assistant: Direct Gemini AI response received');
      return geminiResponse;
    } catch (geminiError: any) {
      console.log('AI Assistant: Direct Gemini AI failed:', geminiError);

      // Check if it's a service overload error
      if (geminiError.message?.includes('overloaded') || geminiError.message?.includes('503')) {
        return {
          message: `🤖 I'm currently experiencing high demand! The AI service is temporarily overloaded, but I can still help you with:

📚 **Platform Guidance:**
• How to navigate courses and features
• Understanding assessments and progress tracking
• Tips for using live sessions effectively

💡 **Study Support:**
• General study strategies and tips
• How to organize your learning
• Platform-specific learning techniques

🔄 **Try Again Soon:**
The AI service should be back to normal capacity in a few minutes. For complex questions requiring AI analysis, please try again shortly!

What can I help you with using my built-in knowledge?`,
          suggestions: ['Platform help', 'Study strategies', 'Course navigation', 'Try AI again later']
        };
      }

      console.log('AI Assistant: Using enhanced fallback response');

      // Enhanced fallback response (still intelligent, but local)
      return {
        message: getMockResponse(data.userMessage, data.context),
        suggestions: getMockSuggestions(data.userMessage)
      };
    }
  },

  // Generate quiz using Gemini AI (requires course content)
  generateQuiz: async (topic: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium', questionCount: number = 5, courseContent?: string) => {
    return await geminiAIService.generateQuiz(topic, difficulty, questionCount, courseContent);
  },

  // Explain concept using Gemini AI
  explainConcept: async (concept: string, context?: any) => {
    return await geminiAIService.explainConcept(concept, context);
  },

  // Chat with AI assistant
  chatWithAI: async (data: {
    question: string;
    context?: string;
    courseId?: string;
  }): Promise<IChatMessage> => {
    const response = await apiService.post<IChatMessage>('/ai-assistant/chat', data);

    if (response.success && response.data) {
      return {
        ...response.data,
        id: Date.now().toString(),
        timestamp: new Date(response.data.timestamp)
      };
    }

    throw new Error(response.error || 'Failed to get AI response');
  },

  // Get study suggestions based on student progress
  getStudySuggestions: async (courseId: string): Promise<IStudySuggestion> => {
    const response = await apiService.get<IStudySuggestion>(`/ai-assistant/study-suggestions/${courseId}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to get study suggestions');
  },

  // Get help with homework/assignment
  getHomeworkHelp: async (data: {
    question: string;
    assessmentId?: string;
    questionType?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'calculation';
  }): Promise<IHomeworkHelp> => {
    const response = await apiService.post<IHomeworkHelp>('/ai-assistant/homework-help', data);
    
    if (response.success && response.data) {
      return {
        ...response.data,
        timestamp: new Date(response.data.timestamp)
      };
    }
    
    throw new Error(response.error || 'Failed to get homework help');
  },

  // Generate practice questions for a topic
  generatePracticeQuestions: async (data: {
    topic: string;
    courseId?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    count?: number;
  }): Promise<IPracticeQuestions> => {
    const response = await apiService.post<IPracticeQuestions>('/ai-assistant/practice-questions', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to generate practice questions');
  },

  // Check if AI assistant is available
  checkAvailability: async (): Promise<IAIAvailability> => {
    try {
      const response = await apiService.get<IAIAvailability>('/ai-assistant/availability');
      
      if (response.success && response.data) {
        return response.data;
      }
      
      return {
        available: false,
        message: 'AI Assistant is currently unavailable.'
      };
    } catch (error) {
      return {
        available: false,
        message: 'AI Assistant is currently unavailable.'
      };
    }
  },

  // Local storage methods for chat history
  saveChatHistory: (messages: IChatMessage[]): void => {
    try {
      localStorage.setItem('ai_chat_history', JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  },

  getChatHistory: (): IChatMessage[] => {
    try {
      const history = localStorage.getItem('ai_chat_history');
      if (history) {
        const messages = JSON.parse(history);
        return messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  },

  clearChatHistory: (): void => {
    try {
      localStorage.removeItem('ai_chat_history');
    } catch (error) {
      console.error('Failed to clear chat history:', error);
    }
  },

  // Utility methods
  formatResponse: (response: string): string => {
    // Basic formatting for AI responses
    return response
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/\n/g, '<br>') // Line breaks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>') // Code blocks
      .replace(/`(.*?)`/g, '<code>$1</code>'); // Inline code
  },

  // Get conversation context for better responses
  buildContext: (messages: IChatMessage[], maxMessages: number = 5): string => {
    const recentMessages = messages.slice(-maxMessages);
    return recentMessages
      .map(msg => `Q: ${msg.question}\nA: ${msg.response}`)
      .join('\n\n');
  },

  // Validate question before sending
  validateQuestion: (question: string): { isValid: boolean; error?: string } => {
    if (!question || question.trim().length === 0) {
      return { isValid: false, error: 'Question cannot be empty' };
    }

    if (question.length > 1000) {
      return { isValid: false, error: 'Question is too long (max 1000 characters)' };
    }

    // Check for inappropriate content (basic check)
    const inappropriateWords = ['hack', 'cheat', 'answer key', 'solution manual'];
    const lowerQuestion = question.toLowerCase();
    
    for (const word of inappropriateWords) {
      if (lowerQuestion.includes(word)) {
        return { 
          isValid: false, 
          error: 'Please ask for help understanding concepts rather than direct answers' 
        };
      }
    }

    return { isValid: true };
  },

  // Get suggested questions based on context
  getSuggestedQuestions: (courseId?: string, topic?: string): string[] => {
    const generalQuestions = [
      "Can you explain this concept in simpler terms?",
      "What are some real-world applications of this topic?",
      "How does this relate to what we learned earlier?",
      "Can you give me an example to help me understand?",
      "What are the key points I should remember?",
      "How can I practice this concept?",
      "What are common mistakes students make with this topic?",
      "Can you break this down step by step?"
    ];

    const mathQuestions = [
      "Can you show me how to solve this type of problem?",
      "What formula should I use here?",
      "How do I know which method to apply?",
      "Can you explain the steps in this calculation?",
      "What does this symbol mean in mathematics?"
    ];

    const scienceQuestions = [
      "How does this process work?",
      "What causes this phenomenon?",
      "Can you explain the relationship between these concepts?",
      "What are the practical applications of this theory?",
      "How do I remember these scientific terms?"
    ];

    // Return appropriate questions based on context
    if (topic) {
      const lowerTopic = topic.toLowerCase();
      if (lowerTopic.includes('math') || lowerTopic.includes('calculus') || lowerTopic.includes('algebra')) {
        return [...generalQuestions.slice(0, 4), ...mathQuestions];
      }
      if (lowerTopic.includes('science') || lowerTopic.includes('physics') || lowerTopic.includes('chemistry')) {
        return [...generalQuestions.slice(0, 4), ...scienceQuestions];
      }
    }

    return generalQuestions;
  }
};

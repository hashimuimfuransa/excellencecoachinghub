// Gemini AI Service for enhanced AI assistant functionality
// Using direct HTTP calls to Gemini API

// Initialize Gemini AI
const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface GeminiContext {
  userMessage: string;
  context?: {
    page?: string;
    courseId?: string;
    courseTitle?: string;
    courseCategory?: string;
    content?: string;
    [key: string]: any;
  };
  previousMessages?: any[];
}

interface GeminiResponse {
  message: string;
  suggestions?: string[];
}

// Helper function for retry with exponential backoff
const retryWithBackoff = async (fn: () => Promise<any>, maxRetries: number = 2): Promise<any> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;

      // If it's a 503 (overloaded) error, wait before retrying
      if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
        console.log(`Gemini AI: Service overloaded, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error; // Don't retry for other errors
      }
    }
  }
};

export const geminiAIService = {
  // Check if Gemini AI is available
  isAvailable: (): boolean => {
    return !!(GEMINI_API_KEY && GEMINI_API_KEY.length > 0 && GEMINI_API_KEY !== 'your_gemini_api_key_here');
  },

  // Send message to Gemini AI
  sendMessage: async (data: GeminiContext): Promise<GeminiResponse> => {
    try {
      if (!geminiAIService.isAvailable()) {
        console.log('Gemini AI: API key not configured, using fallback');
        throw new Error('Gemini API key not configured');
      }

      console.log('Gemini AI: Sending request to API...');

      // Build context-aware prompt
      const contextPrompt = buildContextPrompt(data);

      // Make direct HTTP request to Gemini API with retry
      const result = await retryWithBackoff(async () => {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: contextPrompt
              }]
            }]
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        return await response.json();
      });
      console.log('Gemini AI: Response received:', result);

      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';
      console.log('Gemini AI: Extracted text:', text.substring(0, 100) + '...');

      // Parse response and generate suggestions
      const suggestions = generateSuggestions(data.userMessage, data.context);

      return {
        message: text,
        suggestions
      };
    } catch (error) {
      console.error('Gemini AI Error:', error);
      console.log('Gemini AI: Falling back to enhanced mock response');
      // Fallback to enhanced mock response
      return getEnhancedMockResponse(data);
    }
  },

  // Generate quiz questions using Gemini (requires course content)
  generateQuiz: async (topic: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium', questionCount: number = 5, courseContent?: string) => {
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      // Check if we have course content to generate quiz from
      if (!courseContent || courseContent.trim().length === 0) {
        throw new Error('No course content provided for quiz generation');
      }

      const prompt = `Based on the following course content, create ${questionCount} ${difficulty} level questions about "${topic}". 
      Create a mix of multiple choice and essay questions. Format the response as a JSON object with this exact structure:

      {
        "questions": [
          {
            "question": "Question text here",
            "type": "multiple_choice",
            "options": ["Specific option 1", "Specific option 2", "Specific option 3", "Specific option 4"],
            "correctAnswer": "Specific option 1",
            "explanation": "Explanation of why this is correct",
            "points": 2
          },
          {
            "question": "Essay question text here",
            "type": "essay",
            "explanation": "What to look for in a good answer",
            "points": 5
          }
        ]
      }

      COURSE CONTENT:
      ${courseContent}

      IMPORTANT INSTRUCTIONS:
      - Make sure the questions are directly related to the provided course material
      - For multiple choice questions, create 4 SPECIFIC, MEANINGFUL options based on the content
      - Do NOT use generic options like "Option A", "Option B" - use actual content-based options
      - Make sure there's only one clearly correct answer
      - For essay questions, ask for explanations, analysis, or application of concepts
      - Base all questions and options on the specific content provided
      - Return ONLY the JSON object, no other text or explanations`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log('Raw Gemini response:', text);

      // Try to parse the JSON response
      try {
        // Clean the text to extract JSON
        let jsonText = text.trim();
        
        // Remove any markdown formatting
        if (jsonText.startsWith('```json')) {
          jsonText = jsonText.replace(/```json\n?/, '').replace(/```\n?$/, '');
        } else if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```\n?/, '').replace(/```\n?$/, '');
        }
        
        // Find JSON object in the response
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
        
        console.log('Cleaned JSON text:', jsonText);
        
        const quizData = JSON.parse(jsonText);
        console.log('Parsed quiz data:', quizData);
        
        if (quizData.questions && Array.isArray(quizData.questions)) {
          console.log('Valid quiz data found, returning:', quizData);
          return quizData;
        } else {
          console.log('Invalid quiz data structure:', quizData);
        }
      } catch (parseError) {
        console.error('Failed to parse quiz JSON:', parseError);
        console.log('Raw text that failed to parse:', text);
      }

      // Fallback: create a simple quiz structure with better options
      return {
        questions: [
          {
            question: `What is the main concept discussed in "${topic}"?`,
            type: "multiple_choice",
            options: [
              "A mathematical description of the relationship between assets, liabilities and capital",
              "A simple addition problem",
              "A way to calculate profit",
              "A method for recording transactions"
            ],
            correctAnswer: "A mathematical description of the relationship between assets, liabilities and capital",
            explanation: "Based on the course content provided",
            points: 2
          },
          {
            question: `Explain the key principles of "${topic}" and how they apply in practice.`,
            type: "essay",
            explanation: "Look for understanding of core concepts and practical application",
            points: 5
          }
        ]
      };
    } catch (error) {
      console.error('Quiz generation error:', error);

      // Return a fallback quiz structure
      return {
        questions: [
          {
            question: `What is the main concept discussed in "${topic}"?`,
            type: "multiple_choice",
            options: [
              "A mathematical description of the relationship between assets, liabilities and capital",
              "A simple addition problem",
              "A way to calculate profit",
              "A method for recording transactions"
            ],
            correctAnswer: "A mathematical description of the relationship between assets, liabilities and capital",
            explanation: "Based on the course content provided",
            points: 2
          },
          {
            question: `Explain the key principles of "${topic}" and how they apply in practice.`,
            type: "essay",
            explanation: "Look for understanding of core concepts and practical application",
            points: 5
          }
        ]
      };
    }
  },

  // Explain concepts using Gemini
  explainConcept: async (concept: string, context?: any) => {
    try {
      if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
      }

      const contextInfo = context?.courseTitle ? ` in the context of "${context.courseTitle}"` : '';
      const prompt = `Explain the concept of "${concept}"${contextInfo} in a clear, educational way suitable for students.
      Include:
      1. A simple definition
      2. Key points or characteristics
      3. Real-world examples
      4. Why it's important to understand

      Keep the explanation engaging and easy to understand.`;

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || `${concept} is an important concept...`;

      return {
        explanation: text,
        concept,
        context
      };
    } catch (error) {
      console.error('Concept explanation error:', error);
      return {
        explanation: `${concept} is an important concept that involves understanding key principles and applying them in practical situations. It's essential for building a strong foundation in this subject area.`,
        concept,
        context
      };
    }
  }
};

// Build context-aware prompt for Gemini
const buildContextPrompt = (data: GeminiContext): string => {
  let prompt = `You are an intelligent AI learning assistant for "Excellence Coaching Hub", a comprehensive online learning platform. You help students with their studies and guide them through the platform features.

PLATFORM KNOWLEDGE:
- Excellence Coaching Hub is an online coaching platform with courses, live sessions, assessments, and AI-powered features
- Students can enroll in courses, attend live sessions, take assessments, track progress, and get AI assistance
- Features include: Course Content, Live Sessions, Assessments/Quizzes, Progress Tracking, AI Assistant, Course Enrollment
- Students have a dashboard with overview, courses, assessments, live sessions, progress tracking, and AI assistant
- The platform supports real-time communication, video conferencing, and interactive learning
- AI features include quiz generation FROM COURSE CONTENT (requires notes/materials), concept explanations, study tips, and conversational assistance
- IMPORTANT: Quizzes can only be generated when course content/notes are available - never create generic quizzes without actual course material

CURRENT CONTEXT:`;

  // Add context information
  if (data.context) {
    if (data.context.courseTitle) {
      prompt += `\n- Student is studying: "${data.context.courseTitle}"`;
      if (data.context.courseCategory) {
        prompt += ` (${data.context.courseCategory} category)`;
      }
    }

    if (data.context.page) {
      const pageDescriptions: { [key: string]: string } = {
        'course-content': 'viewing course materials and lessons',
        'courses': 'browsing available courses',
        'assessments': 'looking at assessments and quizzes',
        'live-sessions': 'checking live sessions',
        'progress': 'reviewing learning progress',
        'ai-assistant': 'using the AI assistant'
      };
      prompt += `\n- Current page: ${pageDescriptions[data.context.page] || data.context.page}`;
    }

    if (data.context.content) {
      prompt += `\n- Available content: ${data.context.content}`;
    }
  }

  // Add conversation history
  if (data.previousMessages && data.previousMessages.length > 0) {
    prompt += `\n\nCONVERSATION HISTORY:`;
    data.previousMessages.slice(-3).forEach((msg: any) => {
      prompt += `\n${msg.isUser ? 'Student' : 'AI'}: ${msg.text}`;
    });
  }

  prompt += `\n\nINSTRUCTIONS:
- Be conversational, friendly, and encouraging
- Provide specific, actionable help based on available course content
- If asked about platform features, explain them clearly with examples
- For study questions, provide detailed explanations with examples from the course content
- QUIZ GENERATION: Only offer to create quizzes if course content/notes are available
- If no course content is available, guide students to access materials first
- Help students navigate through their course step by step
- Suggest relevant platform features when appropriate
- If you don't know something specific about the platform, be honest but still helpful
- Always aim to enhance the student's learning experience with their actual course materials

STUDENT'S MESSAGE: "${data.userMessage}"

Please provide a helpful, conversational response that addresses their question and enhances their learning experience on Excellence Coaching Hub.`;

  return prompt;
};

// Generate contextual suggestions
const generateSuggestions = (userMessage: string, context?: any): string[] => {
  const message = userMessage.toLowerCase();
  const suggestions: string[] = [];

  // Platform/website help suggestions
  if (message.includes('how to') || message.includes('website') || message.includes('platform')) {
    suggestions.push('Show me course features', 'How do assessments work?', 'Explain live sessions', 'Track my progress');
  }
  // Learning content suggestions
  else if (message.includes('explain') || message.includes('what is')) {
    suggestions.push('Create a quiz on this', 'Show me examples', 'Study tips for this topic', 'How does this connect?');
  }
  // Quiz/test suggestions
  else if (message.includes('quiz') || message.includes('test')) {
    suggestions.push('Make it harder', 'Add more questions', 'Explain the answers', 'Different question types');
  }
  // Help/stuck suggestions
  else if (message.includes('help') || message.includes('stuck')) {
    suggestions.push('Break it down step by step', 'Show similar examples', 'Study strategies', 'Platform resources');
  }
  // Greeting suggestions
  else if (message.includes('hello') || message.includes('hi')) {
    suggestions.push('How do I use this platform?', 'Explain a concept', 'Create a practice quiz', 'Study tips');
  }
  // General suggestions
  else {
    suggestions.push('How to use the platform', 'Explain a concept', 'Create a quiz', 'Study strategies');
  }

  // Add context-specific suggestions
  if (context?.courseTitle) {
    suggestions.push(`Quiz on ${context.courseTitle}`);
  }

  if (context?.page === 'course-content') {
    suggestions.push('Explain this lesson');
  } else if (context?.page === 'assessments') {
    suggestions.push('How do assessments work?');
  } else if (context?.page === 'live-sessions') {
    suggestions.push('How to join sessions?');
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
};

// Enhanced mock response with better context awareness and platform knowledge
const getEnhancedMockResponse = (data: GeminiContext): GeminiResponse => {
  const message = data.userMessage.toLowerCase();
  const context = data.context;

  let response = '';

  // Platform and website help
  if (message.includes('how to use') || message.includes('how do i') || message.includes('website') || message.includes('platform')) {
    response = `I'm happy to help you navigate Excellence Coaching Hub! 🎓\n\n`;

    if (message.includes('course') || message.includes('enroll')) {
      response += `**To enroll in courses:**
1. Go to "My Courses" in the sidebar
2. Click the "Browse Courses" tab
3. Use filters to find courses you're interested in
4. Click "Enroll Now" on any course

`;
    }

    if (message.includes('assessment') || message.includes('quiz') || message.includes('test')) {
      response += `**For assessments and quizzes:**
1. Visit "Assessments" in the sidebar
2. See all available assessments for your enrolled courses
3. Click "Take Assessment" to start
4. Your results are automatically saved

`;
    }

    if (message.includes('live session') || message.includes('session')) {
      response += `**To join live sessions:**
1. Check "Live Sessions" in the sidebar
2. See upcoming sessions for your courses
3. Click "Join Session" when it's time
4. Participate in real-time with your instructor

`;
    }

    if (message.includes('progress') || message.includes('track')) {
      response += `**To track your progress:**
1. Visit "Progress" in the sidebar
2. See detailed charts of your learning journey
3. View completion rates, scores, and achievements
4. Identify areas that need more focus

`;
    }

    response += `**Other helpful features:**
• AI Assistant (that's me!) - Always available to help
• Course Content - Access all your learning materials
• Dashboard Overview - See everything at a glance

What specific feature would you like to know more about?`;

  } else if (message.includes('what can you do') || message.includes('what are you') || message.includes('who are you')) {
    response = `Hi there! I'm your AI learning assistant for Excellence Coaching Hub! 🤖✨\n\n`;
    response += `**Here's what I can help you with:**\n\n`;
    response += `📚 **Learning Support:**
• Explain complex concepts in simple terms
• Create practice quizzes on any topic
• Provide personalized study tips
• Help with homework and assignments

`;
    response += `🎯 **Platform Guidance:**
• Show you how to use website features
• Help you navigate courses and assessments
• Guide you through live sessions
• Explain how to track your progress

`;
    response += `💬 **Conversational Help:**
• Answer questions about your courses
• Discuss learning strategies
• Provide motivation and encouragement
• Chat about any topic related to your studies

`;
    response += `I'm context-aware, so I know what course you're studying and can provide relevant help. Just ask me anything!`;

  } else if (message.includes('explain') || message.includes('what is')) {
    response = `I'd be happy to explain that concept${context?.courseTitle ? ` in the context of ${context.courseTitle}` : ''}! 📖\n\n`;
    response += `Let me break this down for you with clear explanations and practical examples. `;
    response += `Understanding this concept is important because it builds the foundation for more advanced topics you'll encounter later.\n\n`;
    response += `Would you like me to:\n• Provide a detailed explanation with examples?\n• Create a quiz to test your understanding?\n• Show you how this connects to other concepts?`;

  } else if (message.includes('quiz') || message.includes('test') || message.includes('practice')) {
    response = `Great idea! I can create a personalized quiz for you${context?.courseTitle ? ` based on ${context.courseTitle}` : ''}! 📝\n\n`;
    response += `I'll generate questions that match your learning level and focus on the key concepts you need to master.\n\n`;
    response += `**Quiz options:**
• Multiple choice questions
• Short answer questions
• Mixed question types
• Different difficulty levels

`;
    response += `Just let me know what topic you'd like to practice, and I'll create a custom quiz for you!`;

  } else if (message.includes('study') || message.includes('tips') || message.includes('how to learn')) {
    response = `Here are some proven study strategies${context?.courseTitle ? ` for ${context.courseTitle}` : ''} that will boost your learning! 🎯\n\n`;
    response += `**Effective Study Techniques:**\n`;
    response += `1. **Active Recall** - Test yourself instead of just re-reading\n`;
    response += `2. **Spaced Repetition** - Review material at increasing intervals\n`;
    response += `3. **Pomodoro Technique** - Study in 25-minute focused sessions\n`;
    response += `4. **Connect Concepts** - Link new information to what you already know\n`;
    response += `5. **Practice Problems** - Apply concepts through exercises\n\n`;
    response += `**Platform-specific tips:**
• Use the Progress page to identify weak areas
• Take practice assessments regularly
• Attend live sessions for interactive learning
• Ask me questions whenever you're stuck!

`;
    response += `What specific study challenge are you facing?`;

  } else if (message.includes('help') || message.includes('stuck') || message.includes('confused')) {
    response = `Don't worry, I'm here to help you work through this! 💪\n\n`;
    response += `Getting stuck is a normal part of learning, and it often means you're pushing yourself to understand something new.\n\n`;
    response += `**Let's tackle this together:**\n`;
    response += `• Tell me specifically what's confusing you\n`;
    response += `• I can break complex topics into smaller, manageable pieces\n`;
    response += `• We can work through examples step by step\n`;
    response += `• I can suggest different ways to approach the problem\n\n`;
    response += `Remember, you can also:
• Check the Course Content for additional materials
• Review your Progress to see what you've mastered
• Join Live Sessions for real-time help from instructors

`;
    response += `What specific topic or concept is giving you trouble?`;

  } else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    response = `Hello! 👋 Welcome to Excellence Coaching Hub!\n\n`;
    response += `I'm your AI learning assistant, and I'm excited to help you on your learning journey! Whether you need help with coursework, want to understand how to use the platform, or just want to chat about your studies, I'm here for you.\n\n`;
    response += `**Quick start options:**\n`;
    response += `• Ask me to explain any concept\n`;
    response += `• Request a practice quiz\n`;
    response += `• Get study tips and strategies\n`;
    response += `• Learn how to use platform features\n\n`;
    response += `What would you like to explore today?`;

  } else {
    response = `That's an interesting question! I'm here to help you succeed in your learning journey on Excellence Coaching Hub. 🌟\n\n`;
    response += `I can assist you with:\n`;
    response += `📚 **Academic Help:** Explaining concepts, creating quizzes, study strategies\n`;
    response += `🖥️ **Platform Guidance:** How to use courses, assessments, live sessions\n`;
    response += `💬 **General Support:** Motivation, learning tips, answering questions\n\n`;
    response += `Could you tell me more about what you're looking for? I'm here to provide personalized help based on your needs!`;
  }

  return {
    message: response,
    suggestions: generateSuggestions(data.userMessage, context)
  };
};

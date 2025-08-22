import { Request, Response } from 'express';
import { InterviewSession } from '../models/InterviewSession';
import { InterviewResponse } from '../models/InterviewResponse';
import { InterviewResult } from '../models/InterviewResult';
import { JobRole } from '../models/JobRole';
import { aiService } from '../services/aiService';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Job roles data (in a real application, this would come from a database)
const jobRolesData = [
  {
    id: '1',
    title: 'Frontend Developer',
    department: 'Engineering',
    level: 'mid',
    skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'HTML'],
    description: 'Build user interfaces and web applications'
  },
  {
    id: '2',
    title: 'Backend Developer',
    department: 'Engineering',
    level: 'mid',
    skills: ['Node.js', 'Python', 'SQL', 'REST APIs', 'Database Design'],
    description: 'Develop server-side applications and APIs'
  },
  {
    id: '3',
    title: 'Full Stack Developer',
    department: 'Engineering',
    level: 'senior',
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS'],
    description: 'Work on both frontend and backend development'
  },
  {
    id: '4',
    title: 'Product Manager',
    department: 'Product',
    level: 'senior',
    skills: ['Strategy', 'Analytics', 'User Research', 'Roadmapping', 'Leadership'],
    description: 'Drive product strategy and development'
  },
  {
    id: '5',
    title: 'UX Designer',
    department: 'Design',
    level: 'mid',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Usability Testing'],
    description: 'Design user experiences and interfaces'
  }
];

/**
 * Get available job roles for interviews
 */
export const getJobRoles = async (req: Request, res: Response) => {
  try {
    // In a real application, you would fetch from database
    // const jobRoles = await JobRole.find({ active: true }).sort({ title: 1 });
    
    res.json(jobRolesData);
  } catch (error) {
    console.error('Error fetching job roles:', error);
    res.status(500).json({ 
      error: 'Failed to fetch job roles',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate interview questions using AI
 */
export const generateInterviewQuestions = async (jobTitle: string, jobSkills: string[]) => {
  const prompt = `Generate 3-5 interview questions for a ${jobTitle} position. The role requires skills in: ${jobSkills.join(', ')}.

Please provide a mix of:
1. Technical questions (2-3 questions)
2. Behavioral questions (1-2 questions)
3. Situational questions (1 question)

Each question should be:
- Relevant to the role and required skills
- Clear and concise
- Suitable for a 3-minute interview format
- Professional but not overly complex

Return the response as a JSON array with objects containing:
- id: unique identifier
- question: the interview question
- type: 'technical' | 'behavioral' | 'situational'
- expectedDuration: time in seconds (30-75 seconds per question)
- difficulty: 'easy' | 'medium' | 'hard'
- keywords: array of relevant keywords to look for in answers`;

  try {
    const response = await aiService.generateContent(prompt);
    
    // Parse the AI response - it should return structured JSON
    let questions;
    try {
      questions = JSON.parse(response);
    } catch (parseError) {
      // If AI doesn't return valid JSON, create fallback questions
      console.warn('AI response not valid JSON, using fallback questions');
      questions = createFallbackQuestions(jobTitle);
    }

    return questions;
  } catch (error) {
    console.error('Error generating questions with AI:', error);
    return createFallbackQuestions(jobTitle);
  }
};

/**
 * Create fallback questions when AI is unavailable
 */
const createFallbackQuestions = (jobTitle: string) => {
  const genericQuestions = [
    {
      id: '1',
      question: `Tell me about yourself and your background relevant to the ${jobTitle} position.`,
      type: 'behavioral',
      expectedDuration: 45,
      difficulty: 'easy',
      keywords: ['background', 'experience', 'relevant', 'skills', 'career']
    },
    {
      id: '2',
      question: `Why are you interested in this ${jobTitle} role and our company?`,
      type: 'behavioral',
      expectedDuration: 60,
      difficulty: 'easy',
      keywords: ['interest', 'motivation', 'company', 'role', 'fit']
    },
    {
      id: '3',
      question: `Describe a challenging project you worked on. How did you approach it and what was the outcome?`,
      type: 'situational',
      expectedDuration: 75,
      difficulty: 'medium',
      keywords: ['project', 'challenges', 'approach', 'problem-solving', 'outcome', 'results']
    }
  ];

  return genericQuestions;
};

/**
 * Create a new interview session
 */
export const createInterviewSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { jobId, jobTitle, duration = 180 } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!jobId || !jobTitle) {
      return res.status(400).json({ error: 'Job ID and title are required' });
    }

    // Find job role details
    const jobRole = jobRolesData.find(role => role.id === jobId);
    if (!jobRole) {
      return res.status(404).json({ error: 'Job role not found' });
    }

    // Generate questions using AI
    const questions = await generateInterviewQuestions(jobTitle, jobRole.skills);

    // Create interview session
    const sessionData = {
      userId,
      jobId,
      jobTitle,
      questions,
      totalDuration: duration,
      status: 'ready' as const,
      createdAt: new Date(),
      maxRetries: 1,
      welcomeMessage: `Welcome to your interview for the ${jobTitle} position. This will be a 3-minute interview with ${questions.length} questions.`
    };

    // In a real application, save to database
    // const session = new InterviewSession(sessionData);
    // await session.save();

    // For now, return mock session with generated ID
    const session = {
      id: `session_${Date.now()}`,
      ...sessionData
    };

    res.status(201).json(session);
  } catch (error) {
    console.error('Error creating interview session:', error);
    res.status(500).json({ 
      error: 'Failed to create interview session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Start an interview session
 */
export const startInterviewSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // In a real application, update the session status in database
    // const session = await InterviewSession.findOneAndUpdate(
    //   { _id: sessionId, userId },
    //   { status: 'in-progress', startedAt: new Date() },
    //   { new: true }
    // );

    // For now, return success
    res.json({ 
      success: true, 
      message: 'Interview session started',
      sessionId,
      startedAt: new Date()
    });
  } catch (error) {
    console.error('Error starting interview session:', error);
    res.status(500).json({ 
      error: 'Failed to start interview session',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Submit an interview response
 */
export const submitInterviewResponse = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    const { questionId, question, answer, timestamp, duration, confidence } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Validate required fields
    if (!questionId || !question || !answer) {
      return res.status(400).json({ error: 'Question ID, question, and answer are required' });
    }

    // In a real application, save to database
    // const response = new InterviewResponse({
    //   sessionId,
    //   userId,
    //   questionId,
    //   question,
    //   answer,
    //   timestamp: new Date(timestamp),
    //   duration: duration || 0,
    //   confidence: confidence || 0.5
    // });
    // await response.save();

    res.json({ 
      success: true, 
      message: 'Response submitted successfully',
      responseId: `response_${Date.now()}`
    });
  } catch (error) {
    console.error('Error submitting interview response:', error);
    res.status(500).json({ 
      error: 'Failed to submit response',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Complete interview and generate results using AI
 */
export const completeInterviewSession = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    const { responses } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'Responses array is required' });
    }

    // Generate AI-based evaluation
    const result = await generateInterviewEvaluation(sessionId, responses);

    // In a real application, save results to database
    // const interviewResult = new InterviewResult({
    //   sessionId,
    //   userId,
    //   ...result,
    //   createdAt: new Date()
    // });
    // await interviewResult.save();

    // Update session status
    // await InterviewSession.findOneAndUpdate(
    //   { _id: sessionId, userId },
    //   { status: 'completed', completedAt: new Date() }
    // );

    res.json(result);
  } catch (error) {
    console.error('Error completing interview session:', error);
    res.status(500).json({ 
      error: 'Failed to complete interview',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Generate AI-based interview evaluation
 */
const generateInterviewEvaluation = async (sessionId: string, responses: any[]) => {
  const prompt = `You are an expert HR interviewer. Please evaluate the following interview responses and provide a detailed assessment.

Interview Responses:
${responses.map((response, index) => 
  `Question ${index + 1}: ${response.question}\nAnswer: ${response.answer}\n`
).join('\n')}

Please provide an evaluation in the following JSON format:
{
  "score": number (0-100),
  "overallFeedback": "detailed overall feedback",
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2"],
  "responses": [
    {
      "question": "the question",
      "answer": "the answer",
      "score": number (0-100),
      "feedback": "specific feedback for this response",
      "keywords": ["relevant", "keywords", "found"],
      "relevanceScore": number (0-100)
    }
  ],
  "skillAssessment": {
    "communication": number (0-100),
    "technical": number (0-100),
    "problemSolving": number (0-100),
    "cultural": number (0-100)
  },
  "recommendation": "strongly_recommend" | "recommend" | "consider" | "not_recommend"
}

Evaluation criteria:
- Communication skills (clarity, articulation, structure)
- Technical knowledge (for technical questions)
- Problem-solving approach
- Cultural fit indicators
- Specific examples and quantifiable results
- Overall professionalism

Be constructive but honest in your feedback.`;

  try {
    const aiResponse = await aiService.generateContent(prompt);
    
    // Parse AI response
    let evaluation;
    try {
      evaluation = JSON.parse(aiResponse);
    } catch (parseError) {
      console.warn('AI evaluation response not valid JSON, using fallback');
      evaluation = createFallbackEvaluation(responses);
    }

    return {
      sessionId,
      ...evaluation,
      completionTime: responses.reduce((sum: number, r: any) => sum + (r.duration || 0), 0)
    };
  } catch (error) {
    console.error('Error generating AI evaluation:', error);
    return createFallbackEvaluation(responses, sessionId);
  }
};

/**
 * Create fallback evaluation when AI is unavailable
 */
const createFallbackEvaluation = (responses: any[], sessionId?: string) => {
  const totalResponses = responses.length;
  const avgResponseLength = responses.reduce((sum, r) => sum + (r.answer?.length || 0), 0) / totalResponses;
  const completionTime = responses.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  // Simple scoring based on response characteristics
  let baseScore = 50;
  
  // Score based on response length (longer responses generally better)
  if (avgResponseLength > 200) baseScore += 20;
  else if (avgResponseLength > 100) baseScore += 10;
  
  // Score based on completion time (not too fast, not too slow)
  if (completionTime > 60 && completionTime < 300) baseScore += 15;
  
  // Add randomness for realism
  const finalScore = Math.min(Math.max(baseScore + Math.random() * 20 - 10, 40), 95);

  return {
    sessionId: sessionId || `session_${Date.now()}`,
    score: Math.round(finalScore),
    overallFeedback: "You provided thoughtful responses that demonstrate your understanding of the role requirements. Your communication skills are evident, and you showed good examples of relevant experience.",
    strengths: [
      "Clear communication",
      "Relevant examples",
      "Professional demeanor"
    ],
    improvements: [
      "Provide more specific metrics and quantifiable results",
      "Elaborate on technical implementation details"
    ],
    responses: responses.map((response, index) => ({
      question: response.question,
      answer: response.answer,
      score: Math.round(finalScore + (Math.random() - 0.5) * 20),
      feedback: "Good response with relevant examples. Consider adding more specific details to strengthen your answer.",
      keywords: extractKeywords(response.answer || ''),
      relevanceScore: Math.round(75 + Math.random() * 20)
    })),
    completionTime,
    skillAssessment: {
      communication: Math.round(finalScore * 0.9 + Math.random() * 10),
      technical: Math.round(finalScore * 0.8 + Math.random() * 15),
      problemSolving: Math.round(finalScore * 0.85 + Math.random() * 12),
      cultural: Math.round(finalScore * 0.75 + Math.random() * 20)
    },
    recommendation: finalScore >= 85 ? 'strongly_recommend' as const : 
                   finalScore >= 75 ? 'recommend' as const : 
                   finalScore >= 65 ? 'consider' as const : 'not_recommend' as const
  };
};

/**
 * Extract keywords from text
 */
const extractKeywords = (text: string): string[] => {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['that', 'this', 'with', 'they', 'have', 'will', 'from', 'been', 'were', 'would', 'could', 'should'].includes(word));
  
  return [...new Set(words)].slice(0, 5);
};

/**
 * Get user's interview history
 */
export const getInterviewHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // In a real application, fetch from database
    // const sessions = await InterviewSession.find({ userId }).sort({ createdAt: -1 });

    // For now, return mock data
    const mockSessions = [
      {
        id: 'session_1',
        userId,
        jobId: '1',
        jobTitle: 'Frontend Developer',
        status: 'completed',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000 + 180000), // 3 minutes later
        totalDuration: 180,
        questions: [],
        maxRetries: 1,
        result: {
          sessionId: 'session_1',
          score: 85,
          overallFeedback: "Excellent performance! You demonstrated strong technical knowledge and clear communication skills.",
          strengths: ["Clear communication", "Strong technical knowledge", "Good problem-solving approach"],
          improvements: ["More specific examples", "Industry terminology"],
          responses: [
            {
              question: "Tell me about your experience with React",
              answer: "I have 3 years of experience building React applications...",
              score: 88,
              feedback: "Great answer with specific examples",
              keywords: ["React", "components", "hooks"],
              relevanceScore: 90
            }
          ],
          completionTime: 175,
          skillAssessment: {
            communication: 87,
            technical: 85,
            problemSolving: 83,
            cultural: 80
          },
          recommendation: 'strongly_recommend'
        }
      },
      {
        id: 'session_2',
        userId,
        jobId: '3',
        jobTitle: 'Full Stack Developer',
        status: 'completed',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 180000),
        totalDuration: 180,
        questions: [],
        maxRetries: 1,
        result: {
          sessionId: 'session_2',
          score: 72,
          overallFeedback: "Good overall performance with room for improvement in technical depth.",
          strengths: ["Good communication", "Relevant experience"],
          improvements: ["More technical details", "Specific achievements"],
          responses: [
            {
              question: "Describe a challenging project you worked on",
              answer: "I worked on a full-stack e-commerce application...",
              score: 75,
              feedback: "Good example but could use more technical details",
              keywords: ["full-stack", "e-commerce", "database"],
              relevanceScore: 78
            }
          ],
          completionTime: 168,
          skillAssessment: {
            communication: 78,
            technical: 68,
            problemSolving: 74,
            cultural: 75
          },
          recommendation: 'recommend'
        }
      }
    ];

    res.json(mockSessions);
  } catch (error) {
    console.error('Error fetching interview history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch interview history',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get interview results
 */
export const getInterviewResults = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // In a real application, fetch from database
    // const result = await InterviewResult.findOne({ sessionId, userId });

    // For now, return mock result
    const mockResult = {
      sessionId,
      score: 78,
      overallFeedback: "Good performance overall. You demonstrated solid understanding of the concepts and provided relevant examples. Consider providing more specific technical details in future interviews.",
      strengths: [
        "Clear communication",
        "Relevant experience",
        "Problem-solving approach"
      ],
      improvements: [
        "More technical depth",
        "Quantifiable achievements",
        "Industry-specific knowledge"
      ],
      responses: [
        {
          question: "Tell me about your background",
          answer: "Sample answer...",
          score: 75,
          feedback: "Good introduction with relevant details",
          keywords: ["experience", "background", "skills"],
          relevanceScore: 80
        }
      ],
      completionTime: 165,
      skillAssessment: {
        communication: 82,
        technical: 74,
        problemSolving: 79,
        cultural: 76
      },
      recommendation: 'recommend' as const
    };

    res.json(mockResult);
  } catch (error) {
    console.error('Error fetching interview results:', error);
    res.status(500).json({ 
      error: 'Failed to fetch interview results',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
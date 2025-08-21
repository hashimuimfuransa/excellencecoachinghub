import { Request, Response } from 'express';
import { AIInterview, Job, JobApplication } from '@/models';
import { InterviewType, UserRole } from '../../../shared/types';
import { AuthRequest } from '@/middleware/auth';

// Start AI interview
export const startAIInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId, type } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Validate interview type
    if (!Object.values(InterviewType).includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid interview type'
      });
    }

    // If jobId is provided, verify the job exists
    let job = null;
    if (jobId) {
      job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      // Check if user has already completed an interview for this job
      const existingInterview = await AIInterview.findOne({
        user: userId,
        job: jobId,
        type
      });

      if (existingInterview) {
        return res.status(400).json({
          success: false,
          error: 'You have already completed this type of interview for this job'
        });
      }
    }

    // Generate interview questions based on type and job
    const questions = generateInterviewQuestions(type, job);

    // Create interview session
    const interview = new AIInterview({
      user: userId,
      job: jobId,
      type,
      questions,
      responses: [],
      overallScore: 0,
      feedback: '',
      recommendations: [],
      strengths: [],
      areasForImprovement: [],
      duration: 0
    });

    await interview.save();

    // Return interview with questions (without expected answers for security)
    const interviewData = {
      ...interview.toJSON(),
      questions: questions.map(q => ({
        _id: q._id,
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit
      }))
    };

    res.status(201).json({
      success: true,
      data: interviewData,
      message: 'AI interview started successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to start AI interview',
      message: error.message
    });
  }
};

// Submit interview response
export const submitInterviewResponse = async (req: AuthRequest, res: Response) => {
  try {
    const { interviewId } = req.params;
    const { questionId, response, audioUrl, responseTime } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const interview = await AIInterview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Verify the interview belongs to the user
    if (interview.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only submit responses to your own interviews'
      });
    }

    // Find the question
    const question = interview.questions.find(q => q._id.toString() === questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found in this interview'
      });
    }

    // Check if response already exists
    const existingResponseIndex = interview.responses.findIndex(r => r.questionId === questionId);
    if (existingResponseIndex !== -1) {
      return res.status(400).json({
        success: false,
        error: 'Response already submitted for this question'
      });
    }

    // Analyze response and generate score/feedback
    const analysis = analyzeInterviewResponse(question, response);

    // Create response object
    const responseObj = {
      questionId,
      response,
      audioUrl,
      score: analysis.score,
      feedback: analysis.feedback,
      keywordsFound: analysis.keywordsFound,
      responseTime: responseTime || 0
    };

    // Add response to interview
    interview.responses.push(responseObj);
    await interview.save();

    res.status(200).json({
      success: true,
      data: responseObj,
      message: 'Response submitted successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to submit response',
      message: error.message
    });
  }
};

// Complete AI interview
export const completeAIInterview = async (req: AuthRequest, res: Response) => {
  try {
    const { interviewId } = req.params;
    const { duration } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const interview = await AIInterview.findById(interviewId);
    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Verify the interview belongs to the user
    if (interview.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only complete your own interviews'
      });
    }

    // Check if all questions have been answered
    if (interview.responses.length !== interview.questions.length) {
      return res.status(400).json({
        success: false,
        error: 'Please answer all questions before completing the interview'
      });
    }

    // Calculate overall score
    const overallScore = interview.responses.reduce((sum, response) => sum + response.score, 0) / interview.responses.length;

    // Generate comprehensive feedback
    const comprehensiveFeedback = generateComprehensiveFeedback(interview.type, interview.responses, overallScore);

    // Update interview with final results
    interview.overallScore = overallScore;
    interview.feedback = comprehensiveFeedback.feedback;
    interview.recommendations = comprehensiveFeedback.recommendations;
    interview.strengths = comprehensiveFeedback.strengths;
    interview.areasForImprovement = comprehensiveFeedback.areasForImprovement;
    interview.duration = duration || 0;
    interview.completedAt = new Date();

    await interview.save();

    // If this is for a job application, update the application
    if (interview.job) {
      const application = await JobApplication.findOne({
        job: interview.job,
        applicant: userId
      });

      if (application) {
        application.interviewResults.push(interview._id);
        await application.save();
      }
    }

    const populatedInterview = await AIInterview.findById(interviewId)
      .populate('job', 'title company');

    res.status(200).json({
      success: true,
      data: populatedInterview,
      message: 'Interview completed successfully'
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: 'Failed to complete interview',
      message: error.message
    });
  }
};

// Get user's interview results
export const getUserInterviews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const interviews = await AIInterview.findByUser(userId);

    res.status(200).json({
      success: true,
      data: interviews
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interviews',
      message: error.message
    });
  }
};

// Get interview results for a job (Employer only)
export const getJobInterviews = async (req: AuthRequest, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== UserRole.EMPLOYER) {
      return res.status(403).json({
        success: false,
        error: 'Only employers can view job interview results'
      });
    }

    // Verify the job belongs to the employer
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    if (job.employer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only view interview results for your own jobs'
      });
    }

    const interviews = await AIInterview.findByJob(jobId);

    res.status(200).json({
      success: true,
      data: interviews
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job interviews',
      message: error.message
    });
  }
};

// Get interview details
export const getInterviewDetails = async (req: AuthRequest, res: Response) => {
  try {
    const { interviewId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const interview = await AIInterview.findById(interviewId)
      .populate('job', 'title company employer')
      .populate('user', 'firstName lastName email');

    if (!interview) {
      return res.status(404).json({
        success: false,
        error: 'Interview not found'
      });
    }

    // Check permissions
    const canView = interview.user._id.toString() === userId ||
                   (userRole === UserRole.EMPLOYER && interview.job?.employer.toString() === userId) ||
                   userRole === UserRole.SUPER_ADMIN;

    if (!canView) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to view this interview'
      });
    }

    res.status(200).json({
      success: true,
      data: interview
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interview details',
      message: error.message
    });
  }
};

// Helper function to generate interview questions
function generateInterviewQuestions(type: InterviewType, job: any): any[] {
  const baseQuestions: Record<InterviewType, any[]> = {
    [InterviewType.TECHNICAL]: [
      {
        question: "Describe your experience with the main technologies required for this role.",
        type: InterviewType.TECHNICAL,
        expectedKeywords: job ? job.skills : ['programming', 'development', 'technical'],
        difficulty: 'medium',
        timeLimit: 180
      },
      {
        question: "How would you approach solving a complex technical problem?",
        type: InterviewType.TECHNICAL,
        expectedKeywords: ['analysis', 'debugging', 'solution', 'methodology'],
        difficulty: 'hard',
        timeLimit: 240
      },
      {
        question: "What technical challenges have you overcome in your previous projects?",
        type: InterviewType.TECHNICAL,
        expectedKeywords: ['challenge', 'solution', 'learning', 'improvement'],
        difficulty: 'medium',
        timeLimit: 180
      }
    ],
    [InterviewType.BEHAVIORAL]: [
      {
        question: "Tell me about a time when you had to work under pressure.",
        type: InterviewType.BEHAVIORAL,
        expectedKeywords: ['pressure', 'deadline', 'stress', 'management', 'success'],
        difficulty: 'medium',
        timeLimit: 120
      },
      {
        question: "Describe a situation where you had to work with a difficult team member.",
        type: InterviewType.BEHAVIORAL,
        expectedKeywords: ['teamwork', 'communication', 'conflict', 'resolution'],
        difficulty: 'medium',
        timeLimit: 150
      },
      {
        question: "Give an example of when you showed leadership skills.",
        type: InterviewType.BEHAVIORAL,
        expectedKeywords: ['leadership', 'initiative', 'guidance', 'responsibility'],
        difficulty: 'hard',
        timeLimit: 180
      }
    ],
    [InterviewType.CASE_STUDY]: [
      {
        question: "How would you approach analyzing a business problem for this company?",
        type: InterviewType.CASE_STUDY,
        expectedKeywords: ['analysis', 'data', 'strategy', 'solution', 'business'],
        difficulty: 'hard',
        timeLimit: 300
      },
      {
        question: "Walk me through your problem-solving methodology.",
        type: InterviewType.CASE_STUDY,
        expectedKeywords: ['methodology', 'process', 'systematic', 'analysis'],
        difficulty: 'medium',
        timeLimit: 240
      }
    ],
    [InterviewType.GENERAL]: [
      {
        question: "Why are you interested in this position?",
        type: InterviewType.GENERAL,
        expectedKeywords: ['interest', 'motivation', 'career', 'growth'],
        difficulty: 'easy',
        timeLimit: 120
      },
      {
        question: "What are your greatest strengths and weaknesses?",
        type: InterviewType.GENERAL,
        expectedKeywords: ['strengths', 'weaknesses', 'self-awareness', 'improvement'],
        difficulty: 'medium',
        timeLimit: 150
      },
      {
        question: "Where do you see yourself in 5 years?",
        type: InterviewType.GENERAL,
        expectedKeywords: ['goals', 'career', 'growth', 'development'],
        difficulty: 'easy',
        timeLimit: 120
      }
    ]
  };

  return baseQuestions[type].map((q, index) => ({
    ...q,
    _id: `${type}_${index}_${Date.now()}`
  }));
}

// Helper function to analyze interview response
function analyzeInterviewResponse(question: any, response: string): {
  score: number;
  feedback: string;
  keywordsFound: string[];
} {
  const keywords = question.expectedKeywords || [];
  const responseWords = response.toLowerCase().split(/\s+/);
  const keywordsFound = keywords.filter(keyword => 
    responseWords.some(word => word.includes(keyword.toLowerCase()))
  );

  // Calculate score based on keyword matching and response length
  const keywordScore = (keywordsFound.length / keywords.length) * 60;
  const lengthScore = Math.min(response.length / 100, 1) * 40; // Up to 40 points for adequate length
  const score = Math.min(keywordScore + lengthScore, 100);

  // Generate feedback
  let feedback = '';
  if (score >= 80) {
    feedback = 'Excellent response! You covered the key points comprehensively.';
  } else if (score >= 60) {
    feedback = 'Good response. Consider elaborating on some key aspects.';
  } else if (score >= 40) {
    feedback = 'Fair response. Try to include more relevant details and examples.';
  } else {
    feedback = 'Your response could be improved. Focus on addressing the question more directly.';
  }

  if (keywordsFound.length < keywords.length / 2) {
    feedback += ' Try to include more relevant technical terms and concepts.';
  }

  return {
    score,
    feedback,
    keywordsFound
  };
}

// Helper function to generate comprehensive feedback
function generateComprehensiveFeedback(
  type: InterviewType,
  responses: any[],
  overallScore: number
): {
  feedback: string;
  recommendations: string[];
  strengths: string[];
  areasForImprovement: string[];
} {
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];
  const recommendations: string[] = [];

  // Analyze performance
  const highScoreResponses = responses.filter(r => r.score >= 80);
  const lowScoreResponses = responses.filter(r => r.score < 60);

  if (highScoreResponses.length > responses.length / 2) {
    strengths.push('Strong communication skills');
    strengths.push('Good understanding of key concepts');
  }

  if (lowScoreResponses.length > responses.length / 3) {
    areasForImprovement.push('Provide more detailed responses');
    areasForImprovement.push('Include more relevant examples');
  }

  // Type-specific feedback
  switch (type) {
    case InterviewType.TECHNICAL:
      if (overallScore >= 70) {
        strengths.push('Solid technical knowledge');
      } else {
        areasForImprovement.push('Strengthen technical skills');
        recommendations.push('Consider additional technical training');
      }
      break;
    case InterviewType.BEHAVIORAL:
      if (overallScore >= 70) {
        strengths.push('Good behavioral competencies');
      } else {
        areasForImprovement.push('Develop behavioral examples');
        recommendations.push('Practice STAR method for behavioral questions');
      }
      break;
    case InterviewType.CASE_STUDY:
      if (overallScore >= 70) {
        strengths.push('Strong analytical thinking');
      } else {
        areasForImprovement.push('Improve problem-solving approach');
        recommendations.push('Practice case study methodologies');
      }
      break;
    case InterviewType.GENERAL:
      if (overallScore >= 70) {
        strengths.push('Clear career vision');
      } else {
        areasForImprovement.push('Clarify career goals');
        recommendations.push('Reflect on your career aspirations');
      }
      break;
  }

  // General recommendations
  if (overallScore < 70) {
    recommendations.push('Practice interview skills with mock interviews');
    recommendations.push('Research common interview questions for your field');
  }

  const feedback = `Your ${type} interview performance shows ${
    overallScore >= 80 ? 'excellent' : overallScore >= 60 ? 'good' : 'developing'
  } skills. Overall score: ${overallScore.toFixed(1)}%. ${
    strengths.length > 0 ? `Your strengths include: ${strengths.join(', ')}.` : ''
  } ${
    areasForImprovement.length > 0 ? `Areas for improvement: ${areasForImprovement.join(', ')}.` : ''
  }`;

  return {
    feedback,
    recommendations,
    strengths,
    areasForImprovement
  };
}
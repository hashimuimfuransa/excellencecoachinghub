import { Request, Response } from 'express';
import { AIInterview } from '@/models';
import { InterviewType } from '@/types/job';
import { AuthRequest } from '@/middleware/auth';

/**
 * Store quick interview results
 * POST /api/quick-interviews/:sessionId/results
 */
export const storeQuickInterviewResults = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { results, userResponses, sessionDetails } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!results || !sessionDetails) {
      return res.status(400).json({
        success: false,
        error: 'Results and session details are required'
      });
    }

    // Transform the quick interview data to AI Interview format
    const questionsData = userResponses?.map((response: any, index: number) => ({
      question: response.question,
      type: InterviewType.GENERAL,
      expectedKeywords: [], // Could be extracted from response
      difficulty: 'easy'
    })) || [];

    const responsesData = userResponses?.map((response: any) => ({
      questionId: response.questionId || `q_${Math.random().toString(36)}`,
      response: response.response,
      audioUrl: response.audioUrl,
      score: response.score || Math.floor(Math.random() * 30) + 70,
      feedback: response.feedback || 'Good response provided',
      keywordsFound: response.keywordsIdentified || [],
      responseTime: response.duration || 60
    })) || [];

    // Create AI interview record for quick interview
    const interview = new AIInterview({
      user: userId,
      job: null, // Quick interviews are not job-specific
      type: InterviewType.GENERAL,
      questions: questionsData,
      responses: responsesData,
      overallScore: results.overallScore || 75,
      feedback: Array.isArray(results.feedback) ? results.feedback.join('. ') : (results.feedback || 'Good overall performance'),
      recommendations: results.recommendations || [
        'Practice more behavioral questions',
        'Work on specific examples',
        'Improve technical explanations'
      ],
      strengths: results.strengths || [
        'Clear communication',
        'Professional demeanor',
        'Good problem-solving approach'
      ],
      areasForImprovement: results.improvements || [
        'Provide more detailed examples',
        'Practice technical terminology'
      ],
      completedAt: new Date(results.completedAt || Date.now()),
      duration: Math.round((sessionDetails.actualDuration || 180) / 60) // Convert to minutes
    });

    const savedInterview = await interview.save();

    // Return stored interview data
    res.status(201).json({
      success: true,
      data: {
        interviewId: savedInterview._id,
        sessionId: sessionId,
        overallScore: savedInterview.overallScore,
        completedAt: savedInterview.completedAt,
        duration: savedInterview.duration,
        questionsCount: savedInterview.questions.length,
        responsesCount: savedInterview.responses.length
      },
      message: 'Quick interview results stored successfully'
    });

  } catch (error: any) {
    console.error('Error storing quick interview results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to store quick interview results',
      message: error.message
    });
  }
};

/**
 * Get user's quick interview results
 * GET /api/quick-interviews/my-results
 */
export const getMyQuickInterviewResults = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Find all general interviews for this user (quick interviews)
    const interviews = await AIInterview.find({
      user: userId,
      type: InterviewType.GENERAL,
      job: null // Quick interviews have no job association
    })
    .sort({ completedAt: -1 })
    .limit(20); // Limit to recent results

    // Transform to quick interview result format
    const quickResults = interviews.map(interview => ({
      sessionId: interview._id.toString(),
      overallScore: interview.overallScore,
      scores: {
        communication: Math.round(interview.overallScore * 0.95 + Math.random() * 10),
        confidence: Math.round(interview.overallScore * 0.9 + Math.random() * 15),
        technical: Math.round(interview.overallScore * 0.88 + Math.random() * 20),
        clarity: Math.round(interview.overallScore * 1.02 + Math.random() * 8),
        professionalism: Math.round(interview.overallScore * 1.02 + Math.random() * 8)
      },
      feedback: interview.feedback ? [interview.feedback] : [],
      strengths: interview.strengths || [],
      improvements: interview.areasForImprovement || [],
      recommendations: interview.recommendations || [],
      completedAt: interview.completedAt.toISOString(),
      actualDuration: interview.duration * 60, // Convert back to seconds
      questionGrades: interview.responses.map((response, index) => ({
        questionNumber: index + 1,
        question: interview.questions[index]?.question || 'Question not available',
        userResponse: response.response,
        score: response.score,
        feedback: response.feedback,
        timeSpent: response.responseTime,
        keywordsIdentified: response.keywordsFound
      }))
    }));

    res.status(200).json({
      success: true,
      data: quickResults
    });

  } catch (error: any) {
    console.error('Error fetching quick interview results:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quick interview results',
      message: error.message
    });
  }
};

/**
 * Get quick interview statistics
 * GET /api/quick-interviews/stats
 */
export const getQuickInterviewStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const interviews = await AIInterview.find({
      user: userId,
      type: InterviewType.GENERAL,
      job: null
    });

    const stats = {
      totalInterviews: interviews.length,
      averageScore: interviews.length > 0 ? 
        Math.round(interviews.reduce((sum, interview) => sum + interview.overallScore, 0) / interviews.length) : 0,
      bestScore: interviews.length > 0 ? 
        Math.max(...interviews.map(interview => interview.overallScore)) : 0,
      totalTimeSpent: interviews.reduce((sum, interview) => sum + interview.duration, 0),
      recentImprovement: interviews.length >= 2 ? 
        interviews[0].overallScore - interviews[interviews.length - 1].overallScore : 0
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('Error fetching quick interview stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quick interview statistics',
      message: error.message
    });
  }
};
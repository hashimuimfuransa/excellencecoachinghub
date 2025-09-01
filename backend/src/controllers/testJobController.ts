import { Request, Response } from 'express';

// Simple test version of AI matched jobs
export const testAIMatchedJobs = async (req: Request, res: Response) => {
  try {
    console.log('🧪 Test AI matched jobs endpoint called');
    
    // Return simple success response
    res.status(200).json({
      success: true,
      data: [],
      message: 'Test endpoint working',
      meta: {
        totalJobsEvaluated: 0,
        matchesFound: 0,
        userSkillsCount: 0,
        averageMatchPercentage: 0
      }
    });
  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Test endpoint failed',
      message: error.message
    });
  }
};
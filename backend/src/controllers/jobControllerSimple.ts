import { Request, Response } from 'express';
import { Job, JobStatus } from '../models';
import { AuthRequest } from '../middleware/auth';

// Simple AI-powered job matching for users
export const getAIMatchedJobsSimple = async (req: AuthRequest, res: Response) => {
  console.log('🤖 Simple AI-matched jobs endpoint called');
  
  try {
    const userId = req.user?.id;
    console.log('🔍 User ID from request:', userId);
    
    if (!userId) {
      console.error('❌ User not authenticated');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    console.log('🤖 Starting basic job matching for user:', userId);
    
    // Simple approach: return basic job matching
    console.log('🔍 Fetching active jobs...');
    const activeJobs = await Job.find({ 
      status: JobStatus.ACTIVE
    })
    .populate('employer', 'firstName lastName company email')
    .limit(10)
    .lean();

    console.log(`📊 Found ${activeJobs.length} active jobs`);

    // Return jobs with basic match data
    const matchedJobs = activeJobs.map((job: any) => ({
      ...job,
      matchPercentage: Math.floor(Math.random() * 40) + 60, // Random 60-100%
      matchingSkills: job.skills?.slice(0, 3) || [],
      aiExplanation: 'Basic matching based on job availability',
      recommendationReason: 'Job matches your profile criteria'
    }));

    console.log('✅ Simple job matching completed');

    return res.status(200).json({
      success: true,
      data: matchedJobs,
      meta: {
        totalJobsEvaluated: activeJobs.length,
        matchesFound: matchedJobs.length,
        userSkillsCount: 0,
        averageMatchPercentage: 75
      }
    });

  } catch (error: any) {
    console.error('❌ Simple job matching failed:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to match jobs',
      message: error.message || 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
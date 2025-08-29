import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { CareerInsight, User, Job } from '../models';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// @desc    Get career insights for user
// @route   GET /api/insights/skills
// @access  Private
router.get('/skills', protect, asyncHandler(async (req: Request, res: Response) => {
  const insights = await CareerInsight.findByUser(req.user!._id.toString());

  if (!insights) {
    // Generate initial insights based on user profile
    const user = await User.findById(req.user!._id);
    
    const initialInsights = await CareerInsight.create({
      user: req.user!._id,
      skillsAssessment: {
        technicalSkills: (user?.skills || []).map(skill => ({
          skill,
          level: 3, // Default mid-level
          yearsOfExperience: 1
        })),
        softSkills: [
          { skill: 'Communication', level: 3 },
          { skill: 'Teamwork', level: 3 },
          { skill: 'Problem Solving', level: 3 },
          { skill: 'Time Management', level: 3 }
        ],
        overallScore: 60
      },
      careerPath: {
        currentRole: user?.jobTitle || 'Professional',
        experienceLevel: user?.experienceLevel || 'entry_level',
        suggestedRoles: [],
        careerProgression: []
      },
      marketInsights: {
        salaryRange: {
          min: 30000,
          max: 60000,
          currency: 'USD'
        },
        demandLevel: 'medium',
        growthPotential: 'stable',
        competitionLevel: 'medium'
      },
      recommendations: {
        skillsToImprove: ['Leadership', 'Project Management'],
        coursesRecommended: [],
        certificationsRecommended: [],
        jobsRecommended: []
      },
      quizResults: []
    });

    res.status(200).json({
      success: true,
      data: initialInsights
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: insights
  });
}));

// @desc    Submit mini skill quiz
// @route   POST /api/insights/quiz
// @access  Private
router.post('/quiz', protect, asyncHandler(async (req: Request, res: Response) => {
  const { quizType, answers, score } = req.body;

  if (!quizType || !answers || score === undefined) {
    res.status(400).json({
      success: false,
      error: 'Quiz type, answers, and score are required'
    });
    return;
  }

  // Find or create career insights
  let insights = await CareerInsight.findByUser(req.user!._id.toString());

  if (!insights) {
    insights = await CareerInsight.create({
      user: req.user!._id,
      skillsAssessment: {
        technicalSkills: [],
        softSkills: [],
        overallScore: 0
      },
      careerPath: {
        currentRole: '',
        experienceLevel: 'entry_level',
        suggestedRoles: [],
        careerProgression: []
      },
      marketInsights: {
        salaryRange: { min: 0, max: 0, currency: 'USD' },
        demandLevel: 'medium',
        growthPotential: 'stable',
        competitionLevel: 'medium'
      },
      recommendations: {
        skillsToImprove: [],
        coursesRecommended: [],
        certificationsRecommended: [],
        jobsRecommended: []
      },
      quizResults: []
    });
  }

  // Add quiz result
  insights.quizResults.push({
    quizType,
    score,
    completedAt: new Date(),
    results: answers
  });

  // Update overall score based on quiz results
  const avgScore = insights.quizResults.reduce((sum, quiz) => sum + quiz.score, 0) / insights.quizResults.length;
  insights.skillsAssessment.overallScore = Math.round(avgScore);

  // Generate recommendations based on score
  if (score < 60) {
    insights.recommendations.skillsToImprove.push(`${quizType} Skills`);
  }

  insights.lastUpdated = new Date();
  await insights.save();

  res.status(200).json({
    success: true,
    data: {
      score,
      overallScore: insights.skillsAssessment.overallScore,
      recommendations: generateRecommendationsFromQuiz(quizType, score)
    },
    message: 'Quiz submitted successfully'
  });
}));

// @desc    Update skills assessment
// @route   PUT /api/insights/skills
// @access  Private
router.put('/skills', protect, asyncHandler(async (req: Request, res: Response) => {
  const { technicalSkills, softSkills } = req.body;

  if (!technicalSkills && !softSkills) {
    res.status(400).json({
      success: false,
      error: 'Technical skills or soft skills data is required'
    });
    return;
  }

  const skillsAssessment = {
    technicalSkills: technicalSkills || [],
    softSkills: softSkills || [],
    overallScore: calculateOverallScore(technicalSkills || [], softSkills || [])
  };

  const insights = await CareerInsight.updateSkillsAssessment(
    req.user!._id.toString(),
    skillsAssessment
  );

  res.status(200).json({
    success: true,
    data: insights,
    message: 'Skills assessment updated successfully'
  });
}));

// @desc    Get career recommendations based on current profile
// @route   GET /api/insights/recommendations
// @access  Private
router.get('/recommendations', protect, asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!._id);
  const insights = await CareerInsight.findByUser(req.user!._id.toString());

  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  // Get job recommendations based on user skills
  const jobRecommendations = await Job.find({
    status: 'active',
    skills: { $in: user.skills || [] }
  })
  .select('title company location jobType experienceLevel')
  .limit(5);

  // Generate skill gap analysis
  const allJobSkills = await Job.aggregate([
    { $match: { status: 'active' } },
    { $unwind: '$skills' },
    { $group: { _id: '$skills', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 20 }
  ]);

  const userSkills = new Set(user.skills || []);
  const skillGaps = allJobSkills
    .filter(skill => !userSkills.has(skill._id))
    .slice(0, 5)
    .map(skill => skill._id);

  res.status(200).json({
    success: true,
    data: {
      jobRecommendations,
      skillGaps,
      currentSkills: user.skills || [],
      overallScore: insights?.skillsAssessment.overallScore || 0,
      recommendations: insights?.recommendations || {
        skillsToImprove: skillGaps,
        coursesRecommended: [],
        certificationsRecommended: [],
        jobsRecommended: jobRecommendations.map(job => job.title)
      }
    }
  });
}));

// @desc    Get market insights for specific role
// @route   GET /api/insights/market/:role
// @access  Private
router.get('/market/:role', protect, asyncHandler(async (req: Request, res: Response) => {
  const role = req.params.role;

  // Get market data for the role
  const roleJobs = await Job.find({
    title: { $regex: role, $options: 'i' },
    status: 'active'
  });

  const salaries = roleJobs
    .filter(job => job.salary && job.salary.min && job.salary.max)
    .map(job => ({ min: job.salary!.min, max: job.salary!.max }));

  let avgMinSalary = 0;
  let avgMaxSalary = 0;
  
  if (salaries.length > 0) {
    avgMinSalary = salaries.reduce((sum, sal) => sum + sal.min, 0) / salaries.length;
    avgMaxSalary = salaries.reduce((sum, sal) => sum + sal.max, 0) / salaries.length;
  }

  const marketInsights = {
    roleName: role,
    jobsAvailable: roleJobs.length,
    salaryRange: {
      min: Math.round(avgMinSalary),
      max: Math.round(avgMaxSalary),
      currency: 'USD'
    },
    demandLevel: roleJobs.length > 50 ? 'high' : roleJobs.length > 20 ? 'medium' : 'low',
    growthPotential: 'stable', // This would ideally come from external data
    competitionLevel: 'medium',
    topSkills: await getTopSkillsForRole(role),
    locations: getTopLocationsForJobs(roleJobs)
  };

  res.status(200).json({
    success: true,
    data: marketInsights
  });
}));

// Helper functions
function generateRecommendationsFromQuiz(quizType: string, score: number) {
  const recommendations = [];
  
  if (score < 60) {
    recommendations.push(`Consider taking courses to improve your ${quizType} skills`);
    recommendations.push(`Practice more in ${quizType} areas where you scored lower`);
  } else if (score < 80) {
    recommendations.push(`Good progress in ${quizType}! Focus on advanced concepts`);
    recommendations.push(`Consider mentoring others in ${quizType}`);
  } else {
    recommendations.push(`Excellent ${quizType} skills! Consider leadership roles`);
    recommendations.push(`Share your knowledge through teaching or content creation`);
  }
  
  return recommendations;
}

function calculateOverallScore(technicalSkills: any[], softSkills: any[]): number {
  const allSkills = [...technicalSkills, ...softSkills];
  if (allSkills.length === 0) return 0;
  
  const avgScore = allSkills.reduce((sum, skill) => sum + skill.level, 0) / allSkills.length;
  return Math.round((avgScore / 5) * 100); // Convert to percentage
}

async function getTopSkillsForRole(role: string): Promise<string[]> {
  const skills = await Job.aggregate([
    { $match: { title: { $regex: role, $options: 'i' }, status: 'active' } },
    { $unwind: '$skills' },
    { $group: { _id: '$skills', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  return skills.map(skill => skill._id);
}

function getTopLocationsForJobs(jobs: any[]): string[] {
  const locationCounts: { [key: string]: number } = {};
  
  jobs.forEach(job => {
    if (job.location) {
      locationCounts[job.location] = (locationCounts[job.location] || 0) + 1;
    }
  });
  
  return Object.entries(locationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([location]) => location);
}

export default router;
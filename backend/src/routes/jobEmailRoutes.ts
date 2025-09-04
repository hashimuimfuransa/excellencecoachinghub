import { Router } from 'express';
import { Request, Response } from 'express';
import { User, Job } from '../models';
import { IUserDocument } from '../models/User';
import { JobRecommendationEmailService } from '../services/jobRecommendationEmailService';

const router = Router();

/**
 * API endpoint to get users with complete profiles and jobs to send via email
 * This will be used by frontend to get the data and send emails using EmailJS
 */
router.post('/get-email-data', async (req: Request, res: Response) => {
  try {
    console.log('📥 Received request for job recommendation email data');

    // Get new jobs from the last 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const newJobs = await Job.find({
      status: 'active',
      createdAt: { $gte: yesterday }
    }).populate('employer', 'firstName lastName company email');

    console.log(`📊 Found ${newJobs.length} new jobs from the last 24 hours`);

    if (newJobs.length === 0) {
      return res.json({
        success: true,
        message: 'No new jobs found',
        data: {
          users: [],
          jobs: [],
          totalUsers: 0,
          totalJobs: 0
        }
      });
    }

    // Get users with complete profiles who want email notifications
    const eligibleUsers = await getEligibleUsers();
    console.log(`👥 Found ${eligibleUsers.length} eligible users for job recommendations`);

    if (eligibleUsers.length === 0) {
      return res.json({
        success: true,
        message: 'No eligible users found',
        data: {
          users: [],
          jobs: newJobs,
          totalUsers: 0,
          totalJobs: newJobs.length
        }
      });
    }

    // Process users and get their job recommendations
    const usersWithRecommendations = [];
    
    for (const user of eligibleUsers) {
      try {
        const recommendations = await getJobRecommendationsForUser(user, newJobs);
        
        if (recommendations.length > 0) {
          usersWithRecommendations.push({
            user: {
              id: user._id,
              email: user.email,
              firstName: user.firstName || user.name || 'Job Seeker',
              name: user.name
            },
            recommendations: recommendations.map(job => ({
              id: job._id,
              title: job.title,
              company: job.company,
              location: job.location || 'Remote/Various',
              jobType: formatJobType(job.jobType),
              matchPercentage: job.matchPercentage,
              salary: formatSalary(job.salary),
              skills: job.skills || job.skillsRequired || [],
              jobUrl: `${process.env.JOB_PORTAL_URL || 'http://localhost:3000'}/jobs/${job._id}`,
              matchColor: job.matchPercentage >= 80 ? '#4caf50' : 
                          job.matchPercentage >= 60 ? '#ff9800' : '#2196f3'
            }))
          });
        }
      } catch (error) {
        console.error(`❌ Failed to get recommendations for user ${user.email}:`, error);
      }
    }

    console.log(`✅ Prepared email data for ${usersWithRecommendations.length} users`);
    console.log(`📊 Total job recommendations: ${usersWithRecommendations.reduce((sum, item) => sum + item.recommendations.length, 0)}`);

    res.json({
      success: true,
      message: `Found ${usersWithRecommendations.length} users with job recommendations`,
      data: {
        users: usersWithRecommendations,
        totalUsers: usersWithRecommendations.length,
        totalJobs: newJobs.length,
        totalRecommendations: usersWithRecommendations.reduce((sum, item) => sum + item.recommendations.length, 0)
      }
    });

  } catch (error) {
    console.error('❌ Error getting job recommendation email data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get email data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Manual trigger endpoint for job recommendation emails
 */
router.post('/send-recommendations', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Manually triggering job recommendation email process...');
    
    const result = await JobRecommendationEmailService.runManually();
    
    res.json({
      success: result.success,
      message: result.message,
      data: result.data
    });
  } catch (error) {
    console.error('❌ Error manually sending job recommendation emails:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send job recommendation emails',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get users eligible for job recommendation emails
 */
async function getEligibleUsers(): Promise<IUserDocument[]> {
  try {
    // Find users who:
    // 1. Are job seekers or students
    // 2. Have email notifications enabled (default to true if not set)
    // 3. Have completed profiles (at least 80% complete)
    // 4. Are active and email verified
    const users = await User.find({
      $and: [
        {
          $or: [
            { role: 'student' },
            { role: 'user' },
            { userType: 'job_seeker' },
            { userType: 'student' }
          ]
        },
        { isActive: true },
        { isEmailVerified: true },
        { emailNotifications: { $ne: false } }, // Include undefined as true
        {
          $or: [
            { skills: { $exists: true, $not: { $size: 0 } } },
            { experience: { $exists: true, $not: { $size: 0 } } },
            { education: { $exists: true, $not: { $size: 0 } } }
          ]
        }
      ]
    });

    // Filter users with at least 80% profile completion
    const eligibleUsers = users.filter(user => getProfileCompletionPercentage(user) >= 80);
    
    console.log(`📊 User filtering results:`);
    console.log(`   📝 Initial users found: ${users.length}`);
    console.log(`   ✅ Users with 80%+ profile completion: ${eligibleUsers.length}`);
    
    return eligibleUsers;
  } catch (error) {
    console.error('❌ Error fetching eligible users:', error);
    return [];
  }
}

/**
 * Calculate profile completion percentage
 */
function getProfileCompletionPercentage(user: IUserDocument): number {
  let score = 0;
  let maxScore = 100;

  // Basic info (30 points)
  if (user.firstName && user.email) score += 30;
  
  // Skills (25 points)
  if (user.skills && Array.isArray(user.skills) && user.skills.length > 0) score += 25;
  
  // Experience (20 points)
  if (user.experience && Array.isArray(user.experience) && user.experience.length > 0) score += 20;
  
  // Education (15 points)
  if (user.education && Array.isArray(user.education) && user.education.length > 0) score += 15;
  
  // Additional details (10 points total)
  if (user.bio && user.bio.trim().length > 0) score += 3;
  if (user.location && user.location.trim().length > 0) score += 3;
  if (user.phone && user.phone.trim().length > 0) score += 2;
  if (user.resume || user.cvFile) score += 2;

  return Math.round((score / maxScore) * 100);
}

/**
 * Get job recommendations for a specific user
 */
async function getJobRecommendationsForUser(user: IUserDocument, newJobs: any[]): Promise<any[]> {
  try {
    // Use the same logic as the AI matching service
    const userSkills = (user.skills || []).map(skill => skill.toLowerCase());
    const experienceSkills = (user.experience || [])
      .flatMap(exp => (exp.technologies || []).map(tech => tech.toLowerCase()));
    const allUserSkills = [...new Set([...userSkills, ...experienceSkills])];
    
    const userEducation = user.education || [];
    const userExperience = user.experience || [];
    const userLocation = user.location?.toLowerCase() || '';

    // Match jobs using simplified version of the AI matching algorithm
    const jobMatches = newJobs.map((job: any) => {
      let matchScore = 0;

      // Skills matching (50% weight)
      const jobSkills = (job.skills || []).map(skill => skill.toLowerCase());
      if (jobSkills.length > 0 && allUserSkills.length > 0) {
        const matchingSkills = jobSkills.filter(jobSkill => 
          allUserSkills.some(userSkill => 
            userSkill === jobSkill || 
            userSkill.includes(jobSkill) || 
            jobSkill.includes(userSkill)
          )
        );
        
        if (matchingSkills.length > 0) {
          const skillScore = (matchingSkills.length / Math.max(jobSkills.length, 1)) * 50;
          matchScore += skillScore;
        }
      }

      // Education matching (25% weight)
      if (job.educationLevel && userEducation.length > 0) {
        const userDegrees = userEducation.map(edu => edu.degree?.toLowerCase() || '');
        const jobEducationLevel = job.educationLevel.toLowerCase();
        
        const educationMatch = userDegrees.some(degree => {
          return degree.includes(jobEducationLevel) || jobEducationLevel.includes(degree);
        });
        
        if (educationMatch) {
          matchScore += 25;
        }
      }

      // Location matching (25% weight)
      if (job.location && userLocation) {
        const jobLocation = job.location.toLowerCase();
        if (jobLocation.includes(userLocation) || userLocation.includes(jobLocation) ||
            jobLocation.includes('remote') || jobLocation.includes('anywhere')) {
          matchScore += 25;
        }
      }

      const matchPercentage = Math.round(matchScore);

      return {
        ...job.toObject(),
        matchPercentage
      };
    });

    // Filter jobs with at least 40% match and sort by match percentage
    const goodMatches = jobMatches
      .filter(job => job.matchPercentage >= 40)
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 5); // Limit to top 5 recommendations

    return goodMatches;
  } catch (error) {
    console.error(`❌ Error getting job recommendations for user ${user.email}:`, error);
    return [];
  }
}

/**
 * Format job type for display
 */
function formatJobType(jobType: string): string {
  const typeMap: { [key: string]: string } = {
    'full_time': 'Full Time',
    'part_time': 'Part Time',
    'contract': 'Contract',
    'internship': 'Internship',
    'remote': 'Remote',
    'freelance': 'Freelance'
  };
  return typeMap[jobType?.toLowerCase()] || jobType || 'Full Time';
}

/**
 * Format salary for display
 */
function formatSalary(salary: any): string {
  if (!salary) return '';
  
  if (typeof salary === 'string') return salary;
  
  if (salary.min && salary.max) {
    return `${salary.currency || 'UGX'} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  }
  
  if (salary.amount) {
    return `${salary.currency || 'UGX'} ${salary.amount.toLocaleString()}`;
  }
  
  return salary.toString();
}

export default router;
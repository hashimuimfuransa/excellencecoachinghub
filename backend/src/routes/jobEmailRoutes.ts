import { Router } from 'express';
import { Request, Response } from 'express';
import { User, Job, JobApplication } from '../models';
import { IUserDocument } from '../models/User';
import { JobRecommendationEmailService } from '../services/jobRecommendationEmailService';
import { ApplicationStatus } from '../types';
import { protect as auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';

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
    
    console.log(`🔄 Processing ${eligibleUsers.length} eligible users for job recommendations...`);
    
    for (let i = 0; i < eligibleUsers.length; i++) {
      const user = eligibleUsers[i];
      try {
        console.log(`📝 Processing user ${i + 1}/${eligibleUsers.length}: ${user.email}`);
        const recommendations = await getJobRecommendationsForUser(user, newJobs);
        
        console.log(`📊 Found ${recommendations.length} job recommendations for ${user.email}`);
        
        if (recommendations.length > 0) {
          // Generate a unique batch ID for this user's recommendations
          const batchId = `batch_${Date.now()}_${user._id}_${i}`;
          const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
          
          const userRecommendation = {
            user: {
              id: user._id,
              email: user.email,
              firstName: user.firstName || user.name || 'Job Seeker',
              name: user.name
            },
            batchId,
            confirmUrl: `${backendUrl}/api/job-emails/confirm-auto-apply/${user._id}/${batchId}`,
            rejectUrl: `${backendUrl}/api/job-emails/reject-auto-apply/${user._id}/${batchId}`,
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
          };
          
          usersWithRecommendations.push(userRecommendation);
          console.log(`✅ Added recommendations for ${user.email} (${recommendations.length} jobs)`);
        } else {
          console.log(`ℹ️  No suitable job recommendations found for ${user.email}`);
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
    console.log('🔍 Fetching eligible users for job recommendations...');

    // Debug: Check total users first
    const totalUsers = await User.countDocuments({});
    console.log(`📊 Total users in database: ${totalUsers}`);

    // Debug: Check active users
    const activeUsers = await User.countDocuments({ isActive: true });
    console.log(`📊 Active users: ${activeUsers}`);

    // Debug: Check what roles users actually have
    const allRoles = await User.aggregate([
      { $group: { _id: { role: '$role', userType: '$userType' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    console.log(`📊 All user roles and types:`, allRoles);

    // Debug: Check job seeker roles
    const jobSeekerRoles = await User.countDocuments({
      $or: [
        { role: 'student' },
        { role: 'job_seeker' },
        { userType: 'job_seeker' },
        { userType: 'student' }
      ]
    });
    console.log(`📊 Job seeker roles: ${jobSeekerRoles}`);

    // Be more inclusive - get most active users (excluding only admin/employer roles)
    const users = await User.find({
      isActive: true,
      role: { $nin: ['admin', 'super_admin', 'employer'] }, // Exclude admin and employer roles
      // Include all other roles: student, professional, teacher, job_seeker, etc.
    });

    console.log(`📊 Found ${users.length} active job seekers`);

    // Debug: Check a few users to see their email notification settings
    if (users.length > 0) {
      console.log('📊 Sample users email settings:', users.slice(0, 3).map(u => ({
        email: u.email,
        emailNotifications: u.emailNotifications,
        role: u.role,
        userType: u.userType
      })));
    }

    // Filter out users who explicitly disabled email notifications
    const usersWantingEmails = users.filter(user => 
      user.emailNotifications !== false
    );
    
    console.log(`📊 Users wanting emails: ${usersWantingEmails.length}`);

    // Filter users with at least 50% profile completion (optimized for better coverage)
    const eligibleUsers = [];
    
    for (const user of usersWantingEmails) {
      const completionPercentage = getProfileCompletionPercentage(user);
      console.log(`👤 Profile completion for ${user.email}: ${completionPercentage}%`, {
        firstName: !!user.firstName,
        lastName: !!user.lastName,
        email: !!user.email,
        skills: Array.isArray(user.skills) ? user.skills.length : 0,
        experience: Array.isArray(user.experience) ? user.experience.length : 0,
        education: Array.isArray(user.education) ? user.education.length : 0,
        phone: !!user.phone,
        location: !!user.location,
        bio: user.bio ? user.bio.length : 0,
        resume: !!(user.resume || user.cvFile)
      });
      
      if (completionPercentage >= 50) { // Keep the 50% threshold but ensure accurate calculation
        console.log(`👤 User ${user.email}: ${completionPercentage}% profile completion`);
        eligibleUsers.push(user);
      }
    }
    
    console.log(`📊 User filtering results:`);
    console.log(`   📝 Initial users found: ${usersWantingEmails.length}`);
    console.log(`   ✅ Users with 50%+ profile completion: ${eligibleUsers.length}`);
    
    // Create role breakdown for logging
    const roleBreakdown: { [key: string]: number } = {};
    usersWantingEmails.forEach(user => {
      const key = user.userType || user.role;
      roleBreakdown[key] = (roleBreakdown[key] || 0) + 1;
    });
    console.log(`   📋 User breakdown by role:`, roleBreakdown);
    
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

  // Debug logging for profile completion
  const debugInfo: any = {
    email: user.email,
    checks: {}
  };

  // Basic info (25 points)
  if (user.firstName && user.firstName.trim()) {
    score += 10;
    debugInfo.checks.firstName = true;
  }
  if (user.lastName && user.lastName.trim()) {
    score += 10;
    debugInfo.checks.lastName = true;
  }
  if (user.email && user.email.trim()) {
    score += 5;
    debugInfo.checks.email = true;
  }
  
  // Skills (25 points)
  if (user.skills && Array.isArray(user.skills) && user.skills.length > 0) {
    score += 25;
    debugInfo.checks.skills = user.skills.length;
  }
  
  // Experience (20 points)
  if (user.experience && Array.isArray(user.experience) && user.experience.length > 0) {
    score += 20;
    debugInfo.checks.experience = user.experience.length;
  }
  
  // Education (15 points)
  if (user.education && Array.isArray(user.education) && user.education.length > 0) {
    score += 15;
    debugInfo.checks.education = user.education.length;
  }
  
  // Contact details (8 points)
  if (user.phone && user.phone.trim().length > 0) {
    score += 4;
    debugInfo.checks.phone = true;
  }
  if (user.location && user.location.trim().length > 0) {
    score += 4;
    debugInfo.checks.location = true;
  }
  
  // Bio/Description (4 points)
  if (user.bio && user.bio.trim().length > 10) {
    score += 4;
    debugInfo.checks.bio = user.bio.length;
  }
  
  // Resume/CV (3 points)
  if (user.resume || user.cvFile) {
    score += 3;
    debugInfo.checks.resume = true;
  }

  const percentage = Math.round((score / maxScore) * 100);
  
  // Log details for users with high completion
  if (percentage >= 70) {
    console.log(`👤 Profile completion for ${user.email}: ${percentage}%`, debugInfo.checks);
  }

  return percentage;
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

      // Skills matching (40% weight) - more comprehensive
      const jobSkills = (job.skills || job.skillsRequired || []).map(skill => skill.toLowerCase());
      const jobTitle = (job.title || '').toLowerCase();
      const jobDescription = (job.description || '').toLowerCase();
      
      if (allUserSkills.length > 0) {
        let skillScore = 0;
        
        // Check skills array
        if (jobSkills.length > 0) {
          const matchingSkills = jobSkills.filter(jobSkill => 
            allUserSkills.some(userSkill => 
              userSkill === jobSkill || 
              userSkill.includes(jobSkill) || 
              jobSkill.includes(userSkill) ||
              // Fuzzy matching for similar skills
              (userSkill.length > 3 && jobSkill.includes(userSkill.substring(0, 3))) ||
              (jobSkill.length > 3 && userSkill.includes(jobSkill.substring(0, 3)))
            )
          );
          if (matchingSkills.length > 0) {
            skillScore += (matchingSkills.length / Math.max(jobSkills.length, 1)) * 30;
          }
        }
        
        // Check job title for skill matches
        const titleMatches = allUserSkills.filter(skill => 
          jobTitle.includes(skill) || skill.includes(jobTitle.split(' ')[0])
        );
        skillScore += titleMatches.length * 5;
        
        // Check job description for skill matches (limited weight)
        const descriptionMatches = allUserSkills.filter(skill => 
          jobDescription.includes(skill)
        );
        skillScore += Math.min(descriptionMatches.length * 2, 5);
        
        matchScore += Math.min(skillScore, 40); // Cap at 40%
      }

      // Education matching (20% weight) - more flexible
      if (userEducation.length > 0) {
        const userDegrees = userEducation.map(edu => edu.degree?.toLowerCase() || '');
        const userFields = userEducation.map(edu => edu.fieldOfStudy?.toLowerCase() || '');
        const allUserEducation = [...userDegrees, ...userFields].filter(Boolean);
        
        let educationScore = 0;
        
        if (job.educationLevel) {
          const jobEducationLevel = job.educationLevel.toLowerCase();
          const educationMatch = allUserEducation.some(item => {
            return item.includes(jobEducationLevel) || jobEducationLevel.includes(item);
          });
          
          if (educationMatch) {
            educationScore += 15;
          }
        }
        
        // Check job title/description for education field matches
        const fieldMatches = allUserEducation.filter(item => 
          jobTitle.includes(item) || jobDescription.includes(item)
        );
        educationScore += Math.min(fieldMatches.length * 3, 5);
        
        matchScore += educationScore;
      }

      // Location matching (20% weight) - more inclusive
      let locationScore = 0;
      if (job.location) {
        const jobLocation = job.location.toLowerCase();
        
        // Perfect location match
        if (userLocation && (jobLocation.includes(userLocation) || userLocation.includes(jobLocation))) {
          locationScore = 20;
        }
        // Remote work friendly
        else if (jobLocation.includes('remote') || jobLocation.includes('anywhere') || 
                 jobLocation.includes('work from home') || jobLocation.includes('hybrid')) {
          locationScore = 15;
        }
        // Same country (for Rwanda-based platform)
        else if (jobLocation.includes('rwanda') || jobLocation.includes('kigali')) {
          locationScore = 10;
        }
        // Any location specified gets some points
        else {
          locationScore = 5;
        }
      } else {
        // No location specified gets neutral points
        locationScore = 10;
      }
      
      matchScore += locationScore;

      // Experience matching (20% weight) - bonus for relevant experience
      if (userExperience.length > 0) {
        const userJobTitles = userExperience.map(exp => (exp.jobTitle || '').toLowerCase());
        const userTechnologies = userExperience.flatMap(exp => (exp.technologies || []).map(t => t.toLowerCase()));
        
        let experienceScore = 0;
        
        // Job title similarity
        const titleSimilarity = userJobTitles.filter(title => 
          jobTitle.includes(title) || title.includes(jobTitle.split(' ')[0])
        );
        experienceScore += Math.min(titleSimilarity.length * 8, 12);
        
        // Technology experience
        const techMatches = userTechnologies.filter(tech => 
          jobTitle.includes(tech) || jobDescription.includes(tech) || jobSkills.includes(tech)
        );
        experienceScore += Math.min(techMatches.length * 3, 8);
        
        matchScore += experienceScore;
      }

      const matchPercentage = Math.round(matchScore);

      return {
        ...job.toObject(),
        matchPercentage
      };
    });

    // More inclusive matching - lower the threshold and provide better fallbacks
    console.log(`📊 Job matching results for user ${user.email}:`, {
      totalJobs: jobMatches.length,
      matches40Plus: jobMatches.filter(job => job.matchPercentage >= 40).length,
      matches30Plus: jobMatches.filter(job => job.matchPercentage >= 30).length,
      matches20Plus: jobMatches.filter(job => job.matchPercentage >= 20).length,
      allMatches: jobMatches.map(job => ({ title: job.title, match: job.matchPercentage })).slice(0, 10)
    });

    // Try different thresholds to ensure users get recommendations
    let goodMatches = jobMatches
      .filter(job => job.matchPercentage >= 40)
      .sort((a, b) => b.matchPercentage - a.matchPercentage);

    // If no good matches at 40%, try 30%
    if (goodMatches.length === 0) {
      goodMatches = jobMatches
        .filter(job => job.matchPercentage >= 30)
        .sort((a, b) => b.matchPercentage - a.matchPercentage);
      console.log(`⚠️ Using 30% threshold for user ${user.email}, found ${goodMatches.length} matches`);
    }

    // If still no matches at 30%, try 20% but limit to 3 jobs
    if (goodMatches.length === 0) {
      goodMatches = jobMatches
        .filter(job => job.matchPercentage >= 20)
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 3);
      console.log(`⚠️ Using 20% threshold for user ${user.email}, found ${goodMatches.length} matches`);
    }

    // If still no matches, include top jobs regardless of match percentage (for very incomplete profiles)
    if (goodMatches.length === 0 && jobMatches.length > 0) {
      goodMatches = jobMatches
        .sort((a, b) => b.matchPercentage - a.matchPercentage)
        .slice(0, 2);
      console.log(`⚠️ Using any match for user ${user.email}, found ${goodMatches.length} jobs`);
    }

    const finalMatches = goodMatches.slice(0, 5); // Limit to top 5 recommendations
    console.log(`✅ Final recommendations for ${user.email}: ${finalMatches.length} jobs`);

    return finalMatches;
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

/**
 * Handle job recommendation confirmation - auto-apply to all recommended jobs
 */
router.get('/confirm-auto-apply/:userId/:batchId', async (req: Request, res: Response) => {
  try {
    const { userId, batchId } = req.params;
    
    console.log(`✅ Auto-apply confirmation received for user ${userId}, batch ${batchId}`);
    
    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #dc3545;">User Not Found</h2>
            <p>The user associated with this request could not be found.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Return to ExJobNet</a>
          </body>
        </html>
      `);
    }

    // Get the job recommendations for this batch (from recent recommendations)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const newJobs = await Job.find({
      status: 'active',
      createdAt: { $gte: yesterday }
    });

    const recommendations = await getJobRecommendationsForUser(user, newJobs);
    
    if (recommendations.length === 0) {
      return res.send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h2 style="color: #ffc107;">No Jobs Available</h2>
            <p>The recommended jobs are no longer available for automatic application.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Browse Jobs Manually</a>
          </body>
        </html>
      `);
    }

    // Auto-apply to all recommended jobs
    let successfulApplications = 0;
    let failedApplications = 0;
    const applicationResults = [];

    for (const job of recommendations) {
      try {
        // Check if user already applied to this job
        const existingApplication = await JobApplication.findOne({
          applicant: userId,
          job: job._id
        });

        if (existingApplication) {
          console.log(`⚠️  User ${user.email} already applied to job ${job.title}`);
          applicationResults.push({
            jobTitle: job.title,
            status: 'already_applied',
            company: job.company
          });
          continue;
        }

        // Create auto job application
        const jobApplication = new JobApplication({
          applicant: userId,
          job: job._id,
          status: ApplicationStatus.APPLIED,
          appliedAt: new Date(),
          resume: user.resume || user.cvFile || `Auto-generated resume for ${user.firstName} ${user.lastName || ''}`,
          coverLetter: `Dear Hiring Manager,

I am writing to express my interest in the ${job.title} position at ${job.company}. This application was submitted automatically based on my profile matching your requirements.

Based on my skills and experience profile:
- Skills: ${user.skills?.join(', ') || 'Various technical skills'}
- Experience: ${user.experience?.length || 0} positions
- Education: ${user.education?.length || 0} qualifications

I believe I would be a strong candidate for this role with a ${job.matchPercentage}% profile match.

I would welcome the opportunity to discuss how my background and skills can contribute to your team's success.

Best regards,
${user.firstName} ${user.lastName || ''}

---
This application was submitted automatically through ExJobNet's job recommendation system.
Contact: ${user.email}${user.phone ? ` | ${user.phone}` : ''}

Profile Snapshot:
- Match Percentage: ${job.matchPercentage}%
- Skills: ${user.skills?.join(', ') || 'N/A'}
- Experience: ${user.experience?.length || 0} positions
- Education: ${user.education?.length || 0} qualifications
- Location: ${user.location || 'Not specified'}
- Bio: ${user.bio || 'Not provided'}`,
          notes: `Auto-applied via email recommendation system. Match: ${job.matchPercentage}%`
        });

        await jobApplication.save();
        successfulApplications++;
        applicationResults.push({
          jobTitle: job.title,
          status: 'success',
          company: job.company,
          matchPercentage: job.matchPercentage
        });

        console.log(`✅ Auto-applied user ${user.email} to job ${job.title} at ${job.company}`);

      } catch (error) {
        console.error(`❌ Failed to auto-apply user ${user.email} to job ${job.title}:`, error);
        failedApplications++;
        applicationResults.push({
          jobTitle: job.title,
          status: 'failed',
          company: job.company,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Log the results
    console.log(`📊 Auto-apply results for ${user.email}: ${successfulApplications} successful, ${failedApplications} failed`);

    // Return success page
    const successApplicationsList = applicationResults
      .filter(app => app.status === 'success')
      .map(app => `• ${app.jobTitle} at ${app.company} (${app.matchPercentage}% match)`)
      .join('\n');

    const alreadyAppliedList = applicationResults
      .filter(app => app.status === 'already_applied')
      .map(app => `• ${app.jobTitle} at ${app.company}`)
      .join('\n');

    const failedApplicationsList = applicationResults
      .filter(app => app.status === 'failed')
      .map(app => `• ${app.jobTitle} at ${app.company}`)
      .join('\n');

    res.send(`
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Auto-Apply Confirmation - ExJobNet</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">🎉 Auto-Apply Completed!</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Your applications have been submitted</p>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #28a745; margin-top: 0;">✅ Results Summary</h2>
              <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; border-radius: 0 5px 5px 0;">
                <strong>Successfully Applied: ${successfulApplications} jobs</strong>
                ${successfulApplications > 0 ? `<pre style="margin: 10px 0; font-family: Arial; white-space: pre-wrap;">${successApplicationsList}</pre>` : ''}
              </div>
              
              ${alreadyAppliedList ? `
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 0 5px 5px 0;">
                <strong>Already Applied: ${applicationResults.filter(app => app.status === 'already_applied').length} jobs</strong>
                <pre style="margin: 10px 0; font-family: Arial; white-space: pre-wrap;">${alreadyAppliedList}</pre>
              </div>
              ` : ''}

              ${failedApplicationsList ? `
              <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 15px 0; border-radius: 0 5px 5px 0;">
                <strong>Failed Applications: ${failedApplications} jobs</strong>
                <pre style="margin: 10px 0; font-family: Arial; white-space: pre-wrap;">${failedApplicationsList}</pre>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 30px 0;">
                <h3 style="color: #333;">What's Next?</h3>
                <p style="color: #666; margin-bottom: 20px;">Monitor your applications and prepare for potential interviews!</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/applications" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 10px; display: inline-block;">📋 View My Applications</a>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 10px; display: inline-block;">🔍 Browse More Jobs</a>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
              <p style="margin: 0;"><strong>ExJobNet</strong> - Your applications are being processed by employers</p>
              <p style="margin: 5px 0 0 0;">You'll receive notifications when employers respond to your applications</p>
            </div>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error processing auto-apply confirmation:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #dc3545;">Error Processing Request</h2>
          <p>There was an error processing your auto-apply request. Please try applying manually.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Browse Jobs</a>
        </body>
      </html>
    `);
  }
});

/**
 * Handle job recommendation rejection - user will apply manually
 */
router.get('/reject-auto-apply/:userId/:batchId', async (req: Request, res: Response) => {
  try {
    const { userId, batchId } = req.params;
    
    console.log(`❌ Auto-apply rejection received for user ${userId}, batch ${batchId}`);
    
    // Get user for personalization
    const user = await User.findById(userId);
    const userName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Job Seeker';

    // Log the rejection for analytics
    console.log(`📊 User ${user?.email || userId} chose to apply manually to job recommendations`);

    // Return rejection confirmation page
    res.send(`
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Manual Application Choice - ExJobNet</title>
        </head>
        <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background: linear-gradient(135deg, #6c757d, #495057); color: white; padding: 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">👤 Manual Application Selected</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">You chose to apply manually</p>
            </div>
            <div style="padding: 30px;">
              <h2 style="color: #495057; margin-top: 0;">Perfect Choice, ${userName}!</h2>
              
              <div style="background: #e2e3e5; border-left: 4px solid #6c757d; padding: 20px; margin: 20px 0; border-radius: 0 5px 5px 0;">
                <h3 style="margin: 0 0 15px 0; color: #495057;">🎯 What This Means</h3>
                <ul style="margin: 0; padding-left: 20px; color: #6c757d;">
                  <li>No automatic applications were submitted</li>
                  <li>You have full control over your job applications</li>
                  <li>Review each job carefully before applying</li>
                  <li>Customize your application for each position</li>
                </ul>
              </div>

              <div style="background: #d1ecf1; border-left: 4px solid #0dcaf0; padding: 20px; margin: 20px 0; border-radius: 0 5px 5px 0;">
                <h3 style="margin: 0 0 15px 0; color: #0dcaf0;">💡 Pro Tips for Manual Applications</h3>
                <ul style="margin: 0; padding-left: 20px; color: #055160;">
                  <li>Read job descriptions thoroughly</li>
                  <li>Tailor your cover letter for each position</li>
                  <li>Highlight relevant skills and experience</li>
                  <li>Apply promptly to increase your chances</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <h3 style="color: #333;">Ready to Apply?</h3>
                <p style="color: #666; margin-bottom: 20px;">Browse the recommended jobs and apply to the ones that interest you most.</p>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs" style="background: #0dcaf0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 10px; display: inline-block;">🔍 Browse Recommended Jobs</a>
                <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; margin: 10px; display: inline-block;">👤 Update My Profile</a>
              </div>

              <div style="background: #f8f9fa; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #6c757d; text-align: center; font-size: 14px;">
                  <strong>Reminder:</strong> Keep your profile updated to receive better job matches in future recommendations.
                </p>
              </div>
            </div>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
              <p style="margin: 0;"><strong>ExJobNet</strong> - Connecting talent with opportunity</p>
              <p style="margin: 5px 0 0 0;">We'll continue sending you personalized job recommendations</p>
            </div>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    console.error('❌ Error processing auto-apply rejection:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #dc3545;">Error Processing Request</h2>
          <p>There was an error processing your request. Please browse jobs manually.</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/jobs" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Browse Jobs</a>
        </body>
      </html>
    `);
  }
});

/**
 * @route   GET /api/job-emails/debug-users
 * @desc    Debug endpoint to check user profiles and completion percentages
 * @access  Private - Admin
 */
router.get('/debug-users', auth, authorizeRoles(['super_admin', 'admin']), async (req, res) => {
  try {
    console.log('🔍 Debug endpoint: Analyzing user profiles...');

    // Get all users with basic info
    const allUsers = await User.find({}).select('email firstName lastName role userType isActive isEmailVerified skills experience education bio phone location resume cvFile').limit(20);
    
    const userAnalysis = allUsers.map(user => {
      const completion = getProfileCompletionPercentage(user);
      return {
        email: user.email,
        name: `${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`,
        role: user.role,
        userType: user.userType,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        completionPercentage: completion,
        profileData: {
          hasFirstName: !!user.firstName,
          hasLastName: !!user.lastName,
          hasSkills: !!(user.skills && user.skills.length > 0),
          skillsCount: user.skills?.length || 0,
          hasExperience: !!(user.experience && user.experience.length > 0),
          experienceCount: user.experience?.length || 0,
          hasEducation: !!(user.education && user.education.length > 0),
          educationCount: user.education?.length || 0,
          hasBio: !!(user.bio && user.bio.trim().length > 10),
          hasPhone: !!(user.phone && user.phone.trim().length > 0),
          hasLocation: !!(user.location && user.location.trim().length > 0),
          hasResume: !!(user.resume || user.cvFile)
        }
      };
    });

    // Filter for 80%+ completion
    const eligibleUsers = userAnalysis.filter(user => user.completionPercentage >= 80);
    
    res.json({
      success: true,
      message: 'User profile analysis completed',
      data: {
        summary: {
          totalUsers: allUsers.length,
          eligibleUsers: eligibleUsers.length,
          eligibilityRate: `${Math.round((eligibleUsers.length / allUsers.length) * 100)}%`
        },
        allUsers: userAnalysis,
        eligibleUsers: eligibleUsers,
        thresholds: {
          minimumCompletion: 80,
          currentScoring: {
            'First Name': 10,
            'Last Name': 10,
            'Email': 5,
            'Skills': 25,
            'Experience': 20,
            'Education': 15,
            'Phone': 4,
            'Location': 4,
            'Bio (10+ chars)': 4,
            'Resume/CV': 3
          }
        }
      }
    });
  } catch (error) {
    console.error('❌ Error in debug-users endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze user profiles',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
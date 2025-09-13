import * as cron from 'node-cron';
import axios from 'axios';
import { Job, JobStatus, User } from '../models';
import { IUserDocument } from '../models/User';

/**
 * Job Recommendation Email Service
 * 
 * ✅ IMPORTANT: This service uses EMAILJS (not Nodemailer)
 * - Backend prepares job recommendation data
 * - Frontend sends emails using EmailJS template: template_f0oaoz8
 * - Service ID: service_vtor3y8
 * - Public Key: VLY7_POWX21gRHMof
 * 
 * Sends daily email recommendations to users with complete profiles when new matching jobs are found
 */
export class JobRecommendationEmailService {
  private static isRunning = false;
  private static cronJob: cron.ScheduledTask | null = null;
  private static lastRunTime: Date | null = null;

  /**
   * Start the daily job recommendation email scheduler
   */
  static start(): void {
    if (this.cronJob) {
      console.log('⚠️ Job recommendation email scheduler is already running');
      return;
    }

    // Run every day at 8:00 AM (Rwanda time) - after job scraping at 2:00 AM
    this.cronJob = cron.schedule('0 0 8 * * *', async () => {
      await this.sendDailyJobRecommendations();
    }, {
      timezone: 'Africa/Kigali'
    });

    console.log('✅ Job recommendation email scheduler started - will run daily at 8:00 AM (Rwanda time)');

    // For development mode, run a test after 10 seconds
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 Running initial job recommendation email check in development mode...');
      setTimeout(() => {
        this.sendDailyJobRecommendations();
      }, 10000);
    }
  }

  /**
   * Stop the scheduler
   */
  static stop(): void {
    if (this.cronJob) {
      this.cronJob.destroy();
      this.cronJob = null;
      console.log('🛑 Job recommendation email scheduler stopped');
    }
  }

  /**
   * Main function to send daily job recommendations
   */
  static async sendDailyJobRecommendations(): Promise<{
    success: boolean;
    emailsSent: number;
    errors: string[];
  }> {
    if (this.isRunning) {
      console.log('⚠️ Job recommendation email process is already running');
      return {
        success: false,
        emailsSent: 0,
        errors: ['Email process already running']
      };
    }

    this.isRunning = true;
    const startTime = new Date();
    const results = {
      success: true,
      emailsSent: 0,
      errors: [] as string[]
    };

    try {
      console.log('🚀 Starting daily job recommendation email process...');

      // Get new jobs from the last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const newJobs = await Job.find({
        status: JobStatus.ACTIVE,
        createdAt: { $gte: yesterday }
      }).populate('employer', 'firstName lastName company email');

      console.log(`📊 Found ${newJobs.length} new jobs from the last 24 hours`);

      if (newJobs.length === 0) {
        console.log('✅ No new jobs found, skipping email process');
        return results;
      }

      // Get users with complete profiles who want email notifications
      const eligibleUsers = await this.getEligibleUsers();
      console.log(`👥 Found ${eligibleUsers.length} eligible users for job recommendations`);

      if (eligibleUsers.length === 0) {
        console.log('✅ No eligible users found for job recommendations');
        return results;
      }

      // Process all users and collect their recommendations for batch email sending
      const emailBatches: Array<{user: IUserDocument, recommendations: any[]}> = [];
      
      for (const user of eligibleUsers) {
        try {
          const recommendations = await this.getJobRecommendationsForUser(user, newJobs);
          
          if (recommendations.length > 0) {
            emailBatches.push({ user, recommendations });
            console.log(`✅ Found ${recommendations.length} job recommendations for ${user.firstName} ${user.lastName} (${user.email})`);
          } else {
            console.log(`ℹ️  No suitable job recommendations found for ${user.email}`);
          }
        } catch (error) {
          const errorMsg = `Failed to get recommendations for user ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      }

      // Send all emails in batch if we have any
      if (emailBatches.length > 0) {
        console.log(`📬 Preparing to send batch emails to ${emailBatches.length} users...`);
        console.log(`📊 Total job recommendations: ${emailBatches.reduce((sum, batch) => sum + batch.recommendations.length, 0)}`);
        
        try {
          await this.sendJobRecommendationsToUsers(emailBatches);
          results.emailsSent = emailBatches.length;
          console.log(`✅ Successfully processed email batch for ${emailBatches.length} users`);
        } catch (emailError) {
          const errorMsg = `Batch email sending failed: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`;
          console.error(`❌ ${errorMsg}`);
          results.errors.push(errorMsg);
        }
      } else {
        console.log(`ℹ️  No users have job recommendations to send`);
      }

      this.lastRunTime = new Date();
      const duration = Date.now() - startTime.getTime();
      console.log(`✅ Job recommendation email process completed in ${duration}ms`);
      console.log(`📊 Results: ${results.emailsSent} emails sent, ${results.errors.length} errors`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Job recommendation email process failed:', errorMessage);
      results.success = false;
      results.errors.push(errorMessage);
    } finally {
      this.isRunning = false;
    }

    return results;
  }

  /**
   * Get users eligible for job recommendation emails
   */
  private static async getEligibleUsers(): Promise<IUserDocument[]> {
    try {
      // Find users who:
      // 1. Are job seekers or students
      // 2. Have email notifications enabled
      // 3. Have completed profiles (skills, experience, or education)
      // 4. Are active and email verified
      // Be more inclusive - get most active users (excluding only admin/employer roles)
      const users = await User.find({
        isActive: true,
        role: { $nin: ['admin', 'super_admin', 'employer'] }, // Exclude admin and employer roles
        // Don't require isEmailVerified as it might be undefined for some users
        emailNotifications: { $ne: false }, // Include undefined as true
        // Include users with any profile information
        $or: [
          { skills: { $exists: true, $not: { $size: 0 } } },
          { experience: { $exists: true, $not: { $size: 0 } } },
          { education: { $exists: true, $not: { $size: 0 } } },
          { bio: { $exists: true, $ne: '' } },
          { location: { $exists: true, $ne: '' } }
        ]
      });

      // Additional filter for profile completeness
      const eligibleUsers = users.filter(user => this.isProfileComplete(user));
      
      console.log(`📊 User filtering results:`);
      console.log(`   📝 Initial users found: ${users.length}`);
      console.log(`   ✅ Profile-complete users: ${eligibleUsers.length}`);
      
      // Log user breakdown by role
      const roleBreakdown = eligibleUsers.reduce((acc, user) => {
        const role = user.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });
      
      console.log(`   📋 User breakdown by role:`, roleBreakdown);
      
      return eligibleUsers;
    } catch (error) {
      console.error('❌ Error fetching eligible users:', error);
      return [];
    }
  }

  /**
   * Check if user profile is complete enough for job recommendations
   */
  private static isProfileComplete(user: IUserDocument): boolean {
    const hasSkills = user.skills && Array.isArray(user.skills) && user.skills.length > 0;
    const hasExperience = user.experience && Array.isArray(user.experience) && user.experience.length > 0;
    const hasEducation = user.education && Array.isArray(user.education) && user.education.length > 0;
    const hasBasicInfo = user.firstName && user.email;
    
    // Additional profile completeness indicators
    const hasBio = user.bio && user.bio.trim().length > 10; // At least 10 characters
    const hasLocation = user.location && user.location.trim().length > 0;
    const hasPhone = user.phone && user.phone.trim().length > 0;

    // Calculate profile completion score (more inclusive)
    let completionScore = 0;
    if (hasBasicInfo) completionScore += 30; // Basic info is most important
    if (hasSkills) completionScore += 30; // Skills are crucial for matching
    if (hasExperience) completionScore += 25;
    if (hasEducation) completionScore += 20;
    if (hasBio) completionScore += 10;
    if (hasLocation) completionScore += 5;
    if (hasPhone) completionScore += 5;

    // More inclusive: User needs at least 45% completion (basic info + some additional info)
    const isComplete = completionScore >= 45;
    
    console.log(`👤 Profile analysis for ${user.email}: ${completionScore}% completion`, {
      hasBasicInfo,
      hasSkills,
      hasExperience,
      hasEducation,
      hasBio,
      hasLocation,
      hasPhone,
      isComplete
    });
    
    return isComplete;
  }

  /**
   * Get job recommendations for a specific user using the existing AI matching logic
   */
  private static async getJobRecommendationsForUser(user: IUserDocument, newJobs: any[]): Promise<any[]> {
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
        let maxPossibleScore = 100; // Simplified scoring

        // Skills matching (40% weight) - more comprehensive
        const jobSkills = (job.skills || job.skillsRequired || []).map(skill => skill.toLowerCase());
        const jobTitle = (job.title || '').toLowerCase();
        const jobDescription = (job.description || '').toLowerCase();
        
        if (allUserSkills.length > 0) {
          let skillMatchCount = 0;
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
            skillMatchCount += matchingSkills.length;
            if (matchingSkills.length > 0) {
              skillScore += (matchingSkills.length / Math.max(jobSkills.length, 1)) * 30;
            }
          }
          
          // Check job title for skill matches
          const titleMatches = allUserSkills.filter(skill => 
            jobTitle.includes(skill) || skill.includes(jobTitle.split(' ')[0])
          );
          skillMatchCount += titleMatches.length;
          skillScore += titleMatches.length * 5;
          
          // Check job description for skill matches (limited weight)
          const descriptionMatches = allUserSkills.filter(skill => 
            jobDescription.includes(skill)
          );
          skillMatchCount += Math.min(descriptionMatches.length, 2); // Limit description matches
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
          const userCompanies = userExperience.map(exp => (exp.company || '').toLowerCase());
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

      // More inclusive matching - provide recommendations for more users
      console.log(`📊 Job matching for ${user.email}:`, {
        totalJobs: jobMatches.length,
        matches40Plus: jobMatches.filter(job => job.matchPercentage >= 40).length,
        matches30Plus: jobMatches.filter(job => job.matchPercentage >= 30).length,
        matches20Plus: jobMatches.filter(job => job.matchPercentage >= 20).length
      });

      // Try multiple thresholds to ensure users get recommendations
      let goodMatches = jobMatches
        .filter(job => job.matchPercentage >= 40)
        .sort((a, b) => b.matchPercentage - a.matchPercentage);

      // If no matches at 40%, try 30%
      if (goodMatches.length === 0) {
        goodMatches = jobMatches
          .filter(job => job.matchPercentage >= 30)
          .sort((a, b) => b.matchPercentage - a.matchPercentage);
        console.log(`⚠️ Using 30% threshold for ${user.email}, found ${goodMatches.length} matches`);
      }

      // If still no matches at 30%, try 20%
      if (goodMatches.length === 0) {
        goodMatches = jobMatches
          .filter(job => job.matchPercentage >= 20)
          .sort((a, b) => b.matchPercentage - a.matchPercentage);
        console.log(`⚠️ Using 20% threshold for ${user.email}, found ${goodMatches.length} matches`);
      }

      // If still no matches, include top jobs anyway
      if (goodMatches.length === 0 && jobMatches.length > 0) {
        goodMatches = jobMatches
          .sort((a, b) => b.matchPercentage - a.matchPercentage)
          .slice(0, 3);
        console.log(`⚠️ Using any match for ${user.email}, found ${goodMatches.length} jobs`);
      }

      const finalMatches = goodMatches.slice(0, 5); // Limit to top 5 recommendations
      console.log(`✅ Final recommendations for ${user.email}: ${finalMatches.length} jobs`);

      return finalMatches;
    } catch (error) {
      console.error(`Error getting job recommendations for user ${user.email}:`, error);
      return [];
    }
  }



  /**
   * Send job recommendation emails by storing data for frontend to process
   * Frontend will periodically check for new data and send emails using EmailJS
   */
  private static async sendJobRecommendationsToUsers(emailBatches: Array<{user: IUserDocument, recommendations: any[]}>): Promise<void> {
    console.log(`🔄 Job recommendations ready for email processing: ${emailBatches.length} users`);
    console.log(`📊 Total recommendations: ${emailBatches.reduce((sum, batch) => sum + batch.recommendations.length, 0)}`);
    
    // The data is already available via the /api/job-emails/get-email-data endpoint
    // Frontend will automatically pick it up through periodic checks
    
    try {
      // Try to trigger frontend processing (optional - frontend also checks periodically)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const triggerEndpoint = `${frontendUrl}/api/trigger-job-emails`;
      
      // Make a simple GET request to trigger immediate processing
      console.log(`🚨 Attempting to trigger immediate frontend email processing...`);
      
      const response = await axios.get(triggerEndpoint, {
        timeout: 5000, // Short timeout since this is just a trigger
        headers: {
          'User-Agent': 'ExJobNet-BackendService/1.0'
        }
      });

      if (response.status === 200) {
        console.log(`✅ Frontend email processing triggered successfully`);
      }

    } catch (error: any) {
      // This is expected if frontend isn't running or doesn't have the trigger endpoint
      console.log(`ℹ️ Could not trigger immediate frontend processing (this is normal):`);
      console.log(`   Reason: ${error?.message || 'Frontend not available'}`);
      console.log(`   📧 Frontend will pick up emails during next periodic check`);
    }
    
    // Store data for fallback notifications if needed
    await this.fallbackEmailNotification(emailBatches);
  }

  /**
   * Fallback method: Store email notifications for users to see when they log in
   */
  private static async fallbackEmailNotification(emailBatches: Array<{user: IUserDocument, recommendations: any[]}>): Promise<void> {
    console.log(`📝 Creating in-app notifications as email fallback for ${emailBatches.length} users`);
    
    try {
      // Import notification model if available
      const { Notification } = await import('../models/Notification');
      
      const notifications = emailBatches.map(({ user, recommendations }) => ({
        recipient: user._id,
        type: 'job_recommendations',
        title: `🎯 ${recommendations.length} New Job Match${recommendations.length > 1 ? 'es' : ''} Found!`,
        message: `We found ${recommendations.length} job${recommendations.length > 1 ? 's' : ''} that match your profile. Check them out now!`,
        data: {
          jobCount: recommendations.length,
          jobs: recommendations.slice(0, 3).map(job => ({
            id: job._id,
            title: job.title,
            company: job.company,
            matchPercentage: job.matchPercentage
          }))
        },
        isRead: false
      }));

      await Notification.insertMany(notifications);
      console.log(`✅ Created ${notifications.length} in-app notifications as email fallback`);
      
    } catch (notificationError) {
      console.error(`⚠️  Could not create fallback notifications:`, notificationError);
      console.log(`📧 Email recipients for manual follow-up:`, emailBatches.map(b => b.user.email).join(', '));
    }
  }

  /**
   * Format job type for display
   */
  private static formatJobType(jobType: string): string {
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
  private static formatSalary(salary: any): string {
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
   * Manually run the job recommendation email process
   */
  static async runManually(): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    const result = await this.sendDailyJobRecommendations();
    return {
      success: result.success,
      message: result.success 
        ? `Successfully sent ${result.emailsSent} job recommendation emails`
        : `Email process failed with ${result.errors.length} errors`,
      data: result
    };
  }

  /**
   * Get scheduler status
   */
  static getStatus(): {
    isRunning: boolean;
    isScheduled: boolean;
    lastRunTime: Date | null;
    nextRunTime: string | null;
  } {
    let nextRunTime: string | null = null;
    
    if (this.cronJob) {
      try {
        const nextDate = this.cronJob.nextDate();
        nextRunTime = nextDate ? nextDate.toISO() : null;
      } catch (error) {
        console.error('Error getting next run time:', error);
      }
    }

    return {
      isRunning: this.isRunning,
      isScheduled: this.cronJob !== null,
      lastRunTime: this.lastRunTime,
      nextRunTime
    };
  }

  /**
   * Helper function to add delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
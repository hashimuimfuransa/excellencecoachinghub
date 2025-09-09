import { sendJobRecommendationEmails } from './emailjsService';

interface JobRecommendationEmailData {
  users: Array<{
    user: {
      id: string;
      email: string;
      firstName: string;
      name?: string;
    };
    batchId: string;
    confirmUrl: string;
    rejectUrl: string;
    recommendations: Array<{
      id: string;
      title: string;
      company: string;
      location: string;
      jobType: string;
      matchPercentage: number;
      salary: string;
      skills: string[];
      jobUrl: string;
      matchColor: string;
    }>;
  }>;
  totalUsers: number;
  totalJobs: number;
  totalRecommendations: number;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: JobRecommendationEmailData;
}

class JobEmailService {
  private static instance: JobEmailService;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  private readonly API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  private constructor() {}

  public static getInstance(): JobEmailService {
    if (!JobEmailService.instance) {
      JobEmailService.instance = new JobEmailService();
    }
    return JobEmailService.instance;
  }

  /**
   * Start the periodic job email checking service
   */
  public start(): void {
    if (this.isRunning) {
      console.log('📧 Job email service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting job email service - checking every 5 minutes');

    // Run immediately on start
    this.checkAndSendJobEmails();

    // Set up periodic checking
    this.intervalId = setInterval(() => {
      this.checkAndSendJobEmails();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop the periodic job email checking service
   */
  public stop(): void {
    if (!this.isRunning) {
      console.log('📧 Job email service is not running');
      return;
    }

    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log('⏹️ Job email service stopped');
  }

  /**
   * Check for job recommendations and send emails
   */
  private async checkAndSendJobEmails(): Promise<void> {
    try {
      console.log('🔍 Checking for new job recommendations to email...');

      // Fetch job recommendation data from backend
      const response = await fetch(`${this.API_URL}/job-emails/get-email-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const apiResponse: ApiResponse = await response.json();

      if (!apiResponse.success) {
        console.log('📧 No job recommendations to send:', apiResponse.message);
        return;
      }

      const { data } = apiResponse;

      if (!data.users || data.users.length === 0) {
        console.log('📧 No users with job recommendations found');
        return;
      }

      console.log(`📧 Found ${data.users.length} users with job recommendations`);
      console.log(`📊 Total recommendations: ${data.totalRecommendations}`);

      // Format the data for email sending
      const emailRequests = data.users.map(userWithRecommendations => ({
        user: userWithRecommendations.user,
        batchId: userWithRecommendations.batchId,
        confirmUrl: userWithRecommendations.confirmUrl,
        rejectUrl: userWithRecommendations.rejectUrl,
        recommendations: userWithRecommendations.recommendations
      }));

      // Send the emails
      const emailResults = await sendJobRecommendationEmails(emailRequests);

      // Log results
      console.log(`📊 Email sending results:`, {
        totalRequests: emailRequests.length,
        sent: emailResults.sent,
        failed: emailResults.failed,
        success: emailResults.success
      });

      if (emailResults.errors.length > 0) {
        console.error('❌ Email sending errors:', emailResults.errors);
      }

      if (emailResults.sent > 0) {
        console.log(`✅ Successfully sent ${emailResults.sent} job recommendation emails`);
      }

    } catch (error) {
      console.error('❌ Error in job email service:', error);
    }
  }

  /**
   * Manually trigger job email checking (for testing or immediate sending)
   */
  public async triggerManualCheck(): Promise<void> {
    console.log('🔧 Manual trigger: checking for job recommendations...');
    await this.checkAndSendJobEmails();
  }

  /**
   * Get the current status of the service
   */
  public getStatus(): {
    isRunning: boolean;
    checkInterval: number;
    nextCheck?: string;
  } {
    return {
      isRunning: this.isRunning,
      checkInterval: this.CHECK_INTERVAL,
      nextCheck: this.isRunning ? new Date(Date.now() + this.CHECK_INTERVAL).toISOString() : undefined
    };
  }
}

// Export singleton instance
export const jobEmailService = JobEmailService.getInstance();

// Auto-start the service (can be disabled by calling stop())
// We'll start this from the main app component
console.log('📧 Job email service module loaded');

// Export for manual control
export { JobEmailService };
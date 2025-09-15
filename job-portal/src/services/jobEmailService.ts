// Job email service - now handled entirely by backend SendGrid service
// This service is kept for backward compatibility but no longer needed

interface JobEmailServiceStatus {
  isRunning: boolean;
  message: string;
}

class JobEmailService {
  private static instance: JobEmailService;

  private constructor() {}

  public static getInstance(): JobEmailService {
    if (!JobEmailService.instance) {
      JobEmailService.instance = new JobEmailService();
    }
    return JobEmailService.instance;
  }

  /**
   * Job emails are now handled automatically by backend cron jobs
   * This method is kept for backward compatibility
   */
  public start(): void {
    console.log('📧 Job emails are now handled automatically by the backend SendGrid service');
    console.log('📧 No frontend email service needed - backend handles everything');
  }

  /**
   * Backend handles email sending automatically
   */
  public stop(): void {
    console.log('📧 Job email service is handled by backend - nothing to stop');
  }

  /**
   * Manual trigger not needed - backend handles scheduling
   */
  public async triggerManualCheck(): Promise<void> {
    console.log('📧 Job recommendations are sent automatically by backend - no manual trigger needed');
  }

  /**
   * Get service status
   */
  public getStatus(): JobEmailServiceStatus {
    return {
      isRunning: true, // Backend service is always running
      message: 'Job emails handled by backend SendGrid service'
    };
  }
}

// Export singleton instance
export const jobEmailService = JobEmailService.getInstance();

// Export for manual control
export { JobEmailService };

console.log('📧 Job email service module loaded - backend handles all email sending');
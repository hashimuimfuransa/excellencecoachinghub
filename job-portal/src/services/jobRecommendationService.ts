import { api } from './api';
import { sendJobRecommendationEmails } from './emailjsService';

export interface JobRecommendation {
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
}

export interface UserWithRecommendations {
  user: {
    id: string;
    email: string;
    firstName: string;
    name?: string;
  };
  recommendations: JobRecommendation[];
}

export interface JobEmailData {
  users: UserWithRecommendations[];
  totalUsers: number;
  totalJobs: number;
  totalRecommendations: number;
}

/**
 * Get job recommendation data from backend
 */
export const getJobEmailData = async (): Promise<{
  success: boolean;
  message: string;
  data: JobEmailData;
}> => {
  try {
    console.log('📥 Requesting job recommendation data from backend...');
    
    const response = await api.post('/job-emails/get-email-data');
    
    console.log('✅ Job recommendation data received:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Failed to get job email data:', error);
    throw new Error(error.response?.data?.message || 'Failed to get job email data');
  }
};

/**
 * Process and send job recommendation emails
 */
export const processJobRecommendationEmails = async (): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}> => {
  try {
    console.log('🚀 Starting job recommendation email process...');
    
    // Get data from backend
    const dataResult = await getJobEmailData();
    
    if (!dataResult.success || dataResult.data.users.length === 0) {
      console.log('ℹ️ No users with job recommendations found');
      return {
        success: true,
        sent: 0,
        failed: 0,
        errors: []
      };
    }

    console.log(`📊 Processing emails for ${dataResult.data.users.length} users...`);
    console.log(`📊 Total recommendations: ${dataResult.data.totalRecommendations}`);

    // Send emails using EmailJS
    const emailResult = await sendJobRecommendationEmails(dataResult.data.users);
    
    console.log('✅ Job recommendation email process completed:', emailResult);
    return emailResult;
    
  } catch (error: any) {
    console.error('❌ Job recommendation email process failed:', error);
    return {
      success: false,
      sent: 0,
      failed: 0,
      errors: [{ email: 'system', error: error.message }]
    };
  }
};

/**
 * Trigger job recommendation emails manually (for testing)
 */
export const triggerManualJobEmails = async (): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> => {
  try {
    console.log('🔧 Manually triggering job recommendation emails...');
    
    const result = await processJobRecommendationEmails();
    
    return {
      success: result.success,
      message: result.success 
        ? `Successfully sent ${result.sent} job recommendation emails`
        : `Email process completed with ${result.failed} failures`,
      data: result
    };
  } catch (error: any) {
    console.error('❌ Manual job email trigger failed:', error);
    return {
      success: false,
      message: error.message || 'Manual trigger failed'
    };
  }
};

/**
 * Set up automatic job recommendation email processing
 * This can be called when the frontend app loads
 */
export const setupJobRecommendationEmails = (): void => {
  console.log('📧 Setting up job recommendation email processor...');
  
  // Check for job emails every 30 minutes
  const checkInterval = 30 * 60 * 1000; // 30 minutes
  
  const checkForJobEmails = async () => {
    try {
      const dataResult = await getJobEmailData();
      
      if (dataResult.success && dataResult.data.users.length > 0) {
        console.log(`📬 Found ${dataResult.data.users.length} users with job recommendations, processing emails...`);
        await processJobRecommendationEmails();
      } else {
        console.log('ℹ️ No job recommendation emails to send');
      }
    } catch (error) {
      console.error('❌ Automatic job email check failed:', error);
    }
  };
  
  // Initial check after 5 seconds
  setTimeout(checkForJobEmails, 5000);
  
  // Set up periodic checks
  setInterval(checkForJobEmails, checkInterval);
  
  console.log(`✅ Job recommendation email processor set up (checking every ${checkInterval / 60000} minutes)`);
};

const jobRecommendationService = {
  getJobEmailData,
  processJobRecommendationEmails,
  triggerManualJobEmails,
  setupJobRecommendationEmails
};

export default jobRecommendationService;
import { api } from './api';

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
 * NOTE: Job emails are now sent automatically by backend SendGrid service
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
 * Job emails are now processed automatically by backend
 * This function is kept for backward compatibility
 */
export const processJobRecommendationEmails = async (): Promise<{
  success: boolean;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}> => {
  console.log('📧 Job recommendation emails are now handled automatically by backend SendGrid service');
  console.log('📧 No frontend processing needed - backend handles everything');
  
  return {
    success: true,
    sent: 0,
    failed: 0,
    errors: []
  };
};

/**
 * Trigger manual job emails (backend handles this automatically)
 */
export const triggerManualJobEmails = async (): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> => {
  console.log('🔧 Job recommendation emails are sent automatically by backend - no manual trigger needed');
  
  return {
    success: true,
    message: 'Job emails handled automatically by backend SendGrid service'
  };
};

/**
 * Setup is no longer needed - backend handles everything automatically
 */
export const setupJobRecommendationEmails = (): void => {
  console.log('📧 Job recommendation emails are now handled automatically by backend SendGrid service');
  console.log('📧 No frontend setup needed - backend cron jobs handle everything');
};

const jobRecommendationService = {
  getJobEmailData,
  processJobRecommendationEmails,
  triggerManualJobEmails,
  setupJobRecommendationEmails
};

export default jobRecommendationService;
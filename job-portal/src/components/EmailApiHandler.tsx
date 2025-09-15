import React, { useEffect } from 'react';
import jobRecommendationService from '../services/jobRecommendationService';

interface EmailApiHandlerProps {
  isActive: boolean;
}

/**
 * EmailApiHandler - Now simplified since emails are handled by backend SendGrid service
 * This component is kept for backward compatibility but no longer needed
 */
const EmailApiHandler: React.FC<EmailApiHandlerProps> = ({ isActive }) => {
  useEffect(() => {
    if (!isActive) return;

    console.log('📧 EmailApiHandler: Email service now handled entirely by backend SendGrid');
    console.log('📧 Job recommendation emails sent automatically by backend cron jobs');
    console.log('📧 No frontend email processing needed');

    // Set up service (which now just logs that backend handles everything)
    jobRecommendationService.setupJobRecommendationEmails();

    // Handle trigger endpoint for backward compatibility
    const originalFetch = window.fetch;
    window.fetch = async (input, init?) => {
      const url = typeof input === 'string' ? input : input.url;
      
      // Intercept trigger endpoint and explain backend handles emails
      if (url.includes('/api/trigger-job-emails')) {
        console.log('📧 EmailApiHandler: Job emails are now triggered automatically by backend cron jobs');
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Job emails are handled automatically by backend SendGrid service',
          data: {
            sent: 0,
            failed: 0,
            info: 'Backend handles all email sending automatically'
          }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // For all other requests, use original fetch
      return originalFetch(input, init);
    };

    // Cleanup function
    return () => {
      window.fetch = originalFetch; // Restore original fetch
      console.log('📧 EmailApiHandler: Cleanup completed');
    };
  }, [isActive]);

  // This component doesn't render anything visible
  return null;
};

export default EmailApiHandler;
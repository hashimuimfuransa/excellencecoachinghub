import React, { useEffect } from 'react';
import { sendJobRecommendationEmails, initEmailJS } from '../services/emailjsService';
import jobRecommendationService from '../services/jobRecommendationService';

interface EmailApiHandlerProps {
  isActive: boolean;
}

interface EmailRequest {
  user: {
    id: string;
    email: string;
    firstName: string;
    name?: string;
  };
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
}

interface BatchEmailRequest {
  emailRequests: EmailRequest[];
  source: string;
  timestamp: string;
}

/**
 * EmailApiHandler - Handles backend requests for sending job recommendation emails
 * This component listens for postMessage events from the backend service
 */
const EmailApiHandler: React.FC<EmailApiHandlerProps> = ({ isActive }) => {
  useEffect(() => {
    if (!isActive) return;

    console.log('📧 EmailApiHandler: Initializing EmailJS and API listener...');
    
    // Initialize EmailJS
    initEmailJS();

    // Set up automatic job recommendation email processing
    jobRecommendationService.setupJobRecommendationEmails();

    // Listen for postMessage events from backend or other sources
    const handleMessage = async (event: MessageEvent) => {
      // Verify origin for security (adjust based on your backend URL)
      const allowedOrigins = [
        'http://localhost:5000',
        'http://localhost:3000',
        window.location.origin
      ];
      
      if (!allowedOrigins.includes(event.origin)) {
        console.warn('📧 EmailApiHandler: Message from unauthorized origin:', event.origin);
        return;
      }

      console.log('📧 EmailApiHandler: Received message:', event.data);

      if (event.data.type === 'SEND_JOB_RECOMMENDATION_EMAILS') {
        try {
          const batchRequest = event.data.payload as BatchEmailRequest;
          
          console.log(`📧 EmailApiHandler: Processing ${batchRequest.emailRequests.length} email requests from ${batchRequest.source}`);
          
          const results = await sendJobRecommendationEmails(batchRequest.emailRequests);
          
          // Send response back to the source
          event.source?.postMessage({
            type: 'EMAIL_BATCH_RESPONSE',
            payload: {
              success: results.success,
              sent: results.sent,
              failed: results.failed,
              errors: results.errors,
              timestamp: new Date().toISOString()
            }
          }, event.origin);

          console.log(`📧 EmailApiHandler: Batch complete - ${results.sent} sent, ${results.failed} failed`);
          
        } catch (error) {
          console.error('📧 EmailApiHandler: Batch processing failed:', error);
          
          event.source?.postMessage({
            type: 'EMAIL_BATCH_RESPONSE',
            payload: {
              success: false,
              sent: 0,
              failed: 1,
              errors: [{ email: 'batch', error: error instanceof Error ? error.message : 'Unknown error' }],
              timestamp: new Date().toISOString()
            }
          }, event.origin);
        }
      }
    };

    // Listen for HTTP-like requests via fetch interception
    const originalFetch = window.fetch;
    window.fetch = async (input, init?) => {
      const url = typeof input === 'string' ? input : input.url;
      
      // Intercept our email API endpoints
      if (url.includes('/api/send-job-emails')) {
        console.log('📧 EmailApiHandler: Intercepted fetch to /api/send-job-emails');
        
        try {
          const body = init?.body ? JSON.parse(init.body as string) as BatchEmailRequest : null;
          
          if (!body || !body.emailRequests) {
            throw new Error('Invalid request body');
          }

          console.log(`📧 EmailApiHandler: Processing ${body.emailRequests.length} email requests via fetch`);
          
          const results = await sendJobRecommendationEmails(body.emailRequests);
          
          // Return a mock Response object
          return new Response(JSON.stringify({
            success: results.success,
            message: `Processed ${body.emailRequests.length} email requests`,
            data: {
              sent: results.sent,
              failed: results.failed,
              errors: results.errors
            }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        } catch (error) {
          console.error('📧 EmailApiHandler: Fetch processing failed:', error);
          
          return new Response(JSON.stringify({
            success: false,
            message: 'Email processing failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // Handle trigger endpoint for immediate job email processing
      if (url.includes('/api/trigger-job-emails')) {
        console.log('📧 EmailApiHandler: Intercepted fetch to /api/trigger-job-emails');
        
        try {
          console.log('🚨 Triggering immediate job recommendation email processing...');
          const result = await jobRecommendationService.processJobRecommendationEmails();
          
          return new Response(JSON.stringify({
            success: result.success,
            message: `Triggered email processing - ${result.sent} sent, ${result.failed} failed`,
            data: result
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
          
        } catch (error) {
          console.error('📧 EmailApiHandler: Trigger processing failed:', error);
          
          return new Response(JSON.stringify({
            success: false,
            message: 'Failed to trigger email processing',
            error: error instanceof Error ? error.message : 'Unknown error'
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
      
      // For all other requests, use original fetch
      return originalFetch(input, init);
    };

    window.addEventListener('message', handleMessage);

    // Cleanup function
    return () => {
      window.removeEventListener('message', handleMessage);
      window.fetch = originalFetch; // Restore original fetch
      console.log('📧 EmailApiHandler: Cleanup completed');
    };
  }, [isActive]);

  // This component doesn't render anything visible
  return null;
};

export default EmailApiHandler;
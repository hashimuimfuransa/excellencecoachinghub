import { testJobApplicationEmail } from '../services/jobApplicationEmailService';
import { initEmailJS } from '../services/emailjsService';

// Test utility to verify EmailJS integration
export const testEmailJSIntegration = async (testEmail: string = 'test@example.com') => {
  try {
    console.log('🧪 Testing EmailJS Integration for Job Applications...');
    
    // Initialize EmailJS
    initEmailJS();
    console.log('✅ EmailJS initialized');
    
    // Test job application email
    const result = await testJobApplicationEmail(testEmail);
    
    if (result) {
      console.log('✅ Job application email test successful!');
      console.log('📧 Email sent to:', testEmail);
      return true;
    } else {
      console.log('⚠️ Job application email test failed, but this is expected in demo mode');
      console.log('💡 Check console for fallback email content');
      return false;
    }
  } catch (error) {
    console.error('❌ EmailJS integration test failed:', error);
    return false;
  }
};

// Test function that can be called from browser console
(window as any).testJobApplicationEmail = testEmailJSIntegration;

export default testEmailJSIntegration;
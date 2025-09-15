import { testJobApplicationEmail } from '../services/jobApplicationEmailService';

// Test utility - now simplified since emails are handled by backend SendGrid
export const testEmailJSIntegration = async (testEmail: string = 'test@example.com') => {
  try {
    console.log('🧪 Testing Email Integration (now via backend SendGrid)...');
    
    // Test job application email (now handled by backend)
    const result = await testJobApplicationEmail(testEmail);
    
    if (result) {
      console.log('✅ Email system test successful!');
      console.log('📧 Backend SendGrid service is configured and ready');
      console.log('📧 Test emails would be sent to:', testEmail);
      return true;
    } else {
      console.log('⚠️ Email system test completed');
      console.log('💡 Backend SendGrid service handles all email sending automatically');
      return false;
    }
  } catch (error) {
    console.error('❌ Email integration test failed:', error);
    return false;
  }
};

// Test function that can be called from browser console
(window as any).testJobApplicationEmail = testEmailJSIntegration;

export default testEmailJSIntegration;
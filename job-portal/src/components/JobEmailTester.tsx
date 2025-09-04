import React, { useState } from 'react';
import jobRecommendationService from '../services/jobRecommendationService';
import { testJobRecommendationEmail } from '../services/emailjsService';

const JobEmailTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [emailData, setEmailData] = useState<any>(null);
  const [testEmail, setTestEmail] = useState('');

  const handleGetEmailData = async () => {
    setLoading(true);
    try {
      const data = await jobRecommendationService.getJobEmailData();
      setEmailData(data);
      console.log('📊 Email data retrieved:', data);
    } catch (error: any) {
      console.error('❌ Error getting email data:', error);
      setResult({ success: false, message: error.message });
    }
    setLoading(false);
  };

  const handleTriggerEmails = async () => {
    setLoading(true);
    try {
      const triggerResult = await jobRecommendationService.triggerManualJobEmails();
      setResult(triggerResult);
      console.log('📧 Email trigger result:', triggerResult);
    } catch (error: any) {
      console.error('❌ Error triggering emails:', error);
      setResult({ success: false, message: error.message });
    }
    setLoading(false);
  };

  const handleProcessEmails = async () => {
    setLoading(true);
    try {
      const processResult = await jobRecommendationService.processJobRecommendationEmails();
      setResult(processResult);
      console.log('📧 Email processing result:', processResult);
    } catch (error: any) {
      console.error('❌ Error processing emails:', error);
      setResult({ success: false, message: error.message });
    }
    setLoading(false);
  };

  const handleTestEmailJSTemplate = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      setResult({ success: false, message: 'Please enter a valid test email address' });
      return;
    }

    setLoading(true);
    try {
      console.log(`🧪 Testing EmailJS template_f0oaoz8 with email: ${testEmail}`);
      const success = await testJobRecommendationEmail(testEmail);
      setResult({
        success,
        message: success 
          ? `✅ Test job recommendation email sent successfully to ${testEmail}! Check your inbox.`
          : '❌ Test email failed. This usually means the template variables don\'t match your EmailJS template. Check browser console for details.',
        data: { sent: success ? 1 : 0, failed: success ? 0 : 1 }
      });
    } catch (error: any) {
      console.error('❌ Test EmailJS template error:', error);
      setResult({ success: false, message: `Error: ${error.message}` });
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ color: '#4CAF50', marginBottom: '20px' }}>
        📧 Job Recommendation Email Tester
      </h3>

      {/* Test Email Input */}
      <div style={{ marginBottom: '15px' }}>
        <input
          type="email"
          placeholder="Enter test email address (e.g., your@email.com)"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          style={{
            width: '300px',
            padding: '10px',
            marginRight: '10px',
            border: '2px solid #ddd',
            borderRadius: '4px',
            fontSize: '14px'
          }}
        />
        <button
          onClick={handleTestEmailJSTemplate}
          disabled={loading || !testEmail}
          style={{
            padding: '10px 15px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: (loading || !testEmail) ? 'not-allowed' : 'pointer',
            opacity: (loading || !testEmail) ? 0.6 : 1,
            fontWeight: 'bold'
          }}
        >
          🧪 Test EmailJS Template
        </button>
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={handleGetEmailData}
          disabled={loading}
          style={{
            padding: '10px 15px',
            marginRight: '10px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          📊 Get Email Data
        </button>
        
        <button
          onClick={handleProcessEmails}
          disabled={loading}
          style={{
            padding: '10px 15px',
            marginRight: '10px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          📧 Process Job Emails
        </button>
        
        <button
          onClick={handleTriggerEmails}
          disabled={loading}
          style={{
            padding: '10px 15px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          🚀 Trigger Manual Job Emails
        </button>
      </div>

      {loading && (
        <div style={{ color: '#666', fontStyle: 'italic', marginBottom: '15px' }}>
          ⏳ Processing...
        </div>
      )}

      {emailData && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '4px', 
          marginBottom: '15px',
          border: '1px solid #2196F3'
        }}>
          <h4 style={{ color: '#1976D2', marginTop: 0 }}>📊 Email Data Retrieved</h4>
          <p><strong>Success:</strong> {emailData.success ? '✅' : '❌'}</p>
          <p><strong>Message:</strong> {emailData.message}</p>
          {emailData.data && (
            <div>
              <p><strong>Users with Recommendations:</strong> {emailData.data.totalUsers}</p>
              <p><strong>Total New Jobs:</strong> {emailData.data.totalJobs}</p>
              <p><strong>Total Recommendations:</strong> {emailData.data.totalRecommendations}</p>
              
              {emailData.data.users.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Sample User Data:</strong>
                  <pre style={{ 
                    fontSize: '12px', 
                    backgroundColor: '#f5f5f5', 
                    padding: '10px', 
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {JSON.stringify(emailData.data.users[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {result && (
        <div style={{ 
          backgroundColor: result.success ? '#e8f5e8' : '#ffebee', 
          padding: '15px', 
          borderRadius: '4px',
          border: `1px solid ${result.success ? '#4CAF50' : '#f44336'}`
        }}>
          <h4 style={{ color: result.success ? '#2E7D32' : '#C62828', marginTop: 0 }}>
            📧 Email Processing Result
          </h4>
          <p><strong>Success:</strong> {result.success ? '✅' : '❌'}</p>
          <p><strong>Message:</strong> {result.message}</p>
          {result.data && (
            <div>
              <p><strong>Emails Sent:</strong> {result.data.sent || 0}</p>
              <p><strong>Failed:</strong> {result.data.failed || 0}</p>
              {result.data.errors && result.data.errors.length > 0 && (
                <div>
                  <strong>Errors:</strong>
                  <ul>
                    {result.data.errors.map((error: any, index: number) => (
                      <li key={index} style={{ color: '#d32f2f' }}>
                        {error.email}: {error.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{ 
        fontSize: '12px', 
        color: '#666', 
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px'
      }}>
        <strong>💡 How it works:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li><strong>Get Email Data:</strong> Fetches users with complete profiles and new job matches</li>
          <li><strong>Process Job Emails:</strong> Processes any available job recommendations and sends emails</li>
          <li><strong>Trigger Manual:</strong> Combines both steps - gets data and sends emails</li>
        </ul>
        <p style={{ margin: '5px 0' }}>
          The system automatically checks for new job recommendations every 30 minutes when the app is running.
        </p>
      </div>
    </div>
  );
};

export default JobEmailTester;
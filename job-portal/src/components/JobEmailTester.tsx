import React, { useState } from 'react';
import jobRecommendationService from '../services/jobRecommendationService';

const JobEmailTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [emailData, setEmailData] = useState<any>(null);

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

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px',
      border: '2px solid #4CAF50',
      borderRadius: '8px',
      backgroundColor: '#f8f9fa'
    }}>
      <h3 style={{ color: '#4CAF50', marginBottom: '20px' }}>
        📧 Job Recommendation Email System (Backend SendGrid)
      </h3>

      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '15px', 
        borderRadius: '4px', 
        marginBottom: '15px',
        border: '1px solid #2196F3'
      }}>
        <h4 style={{ color: '#1976D2', marginTop: 0 }}>ℹ️ Updated Email System</h4>
        <p><strong>✅ Job recommendation emails are now handled automatically by the backend SendGrid service!</strong></p>
        <p>• Emails are sent automatically via backend cron jobs</p>
        <p>• No frontend email processing needed</p>
        <p>• Better deliverability and reliability</p>
        <p>• Unsubscribe functionality included</p>
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
          📊 Get Email Data (View Only)
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
          📧 Check Email Status
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
          ℹ️ Email System Info
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
            📧 Email System Status
          </h4>
          <p><strong>Status:</strong> {result.success ? '✅' : '❌'}</p>
          <p><strong>Message:</strong> {result.message}</p>
          {result.data && (
            <div>
              <p><strong>Info:</strong> {result.data.info || 'Backend handles all email sending automatically'}</p>
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
        <strong>🚀 New SendGrid Email System:</strong>
        <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
          <li><strong>Automatic:</strong> Backend cron jobs handle all email scheduling</li>
          <li><strong>Reliable:</strong> Professional email delivery via SendGrid API</li>
          <li><strong>Complete:</strong> Includes unsubscribe links and proper formatting</li>
          <li><strong>Scalable:</strong> Can handle large volumes of emails efficiently</li>
        </ul>
        <p style={{ margin: '5px 0' }}>
          <strong>📧 Emails sent automatically include:</strong> Welcome emails, password resets, job recommendations, and application confirmations.
        </p>
      </div>
    </div>
  );
};

export default JobEmailTester;
// Environment configuration validation
export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  
  // D-ID Real-Time API Configuration
  didApiUrl: import.meta.env.VITE_DID_API_URL || 'https://api.d-id.com',
  didApiKey: import.meta.env.VITE_DID_API_KEY || '',
  
  // TalkAvatar Configuration (fallback)
  avatarTalkApiUrl: import.meta.env.VITE_AVATARTALK_API_URL || 'https://avatartalk.ai/api/inference',
  avatarTalkApiKey: import.meta.env.VITE_AVATARTALK_API_KEY || '',
  
  // Google OAuth
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'Excellence Coaching Hub - Job Portal',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
};

// Validation function to check if required env vars are present
export const validateConfig = () => {
  const missing: string[] = [];
  
  if (!config.googleClientId) {
    missing.push('VITE_GOOGLE_CLIENT_ID');
  }
  
  if (!config.apiUrl) {
    missing.push('VITE_API_URL');
  }
  
  // Check D-ID API configuration
  if (!config.didApiKey) {
    missing.push('VITE_DID_API_KEY');
  }
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing);
    console.warn('Please check your .env file');
    console.warn('📝 Create a .env file in the job-portal directory with:');
    console.warn('VITE_DID_API_KEY=sk-your_actual_api_key_here');
    return false;
  }
  
  console.log('✅ Environment configuration loaded successfully');
  console.log('Google Client ID configured:', config.googleClientId ? 'YES' : 'NO');
  console.log('D-ID API Key configured:', config.didApiKey ? 'YES' : 'NO');
  console.log('TalkAvatar API Key configured:', config.avatarTalkApiKey ? 'YES' : 'NO');
  return true;
};

// Run validation on import
validateConfig();

export default config;
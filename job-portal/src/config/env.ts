// Environment configuration validation
export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  
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
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing);
    console.warn('Please check your .env file');
    return false;
  }
  
  console.log('✅ Environment configuration loaded successfully');
  console.log('Google Client ID configured:', config.googleClientId ? 'YES' : 'NO');
  return true;
};

// Run validation on import
validateConfig();

export default config;
// Environment configuration for eLearning app
// This centralizes environment variable loading and validation

export const config = {
  // API Configuration
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000',
  
  // Google OAuth
  googleClientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
  
  // Gemini AI
  geminiApiKey: process.env.REACT_APP_GEMINI_API_KEY || '',
  
  // PDFTron
  pdftronLicenseKey: process.env.REACT_APP_PDFTRON_LICENSE_KEY || '',
  
  // App Configuration
  appName: process.env.REACT_APP_NAME || 'Excellence Coaching Hub - eLearning',
  appVersion: process.env.REACT_APP_VERSION || '1.0.0',
  environment: process.env.REACT_APP_ENVIRONMENT || process.env.NODE_ENV || 'development',
};

// Validation function to check if required env vars are present
export const validateConfig = () => {
  const missing: string[] = [];
  
  if (!config.googleClientId) {
    missing.push('REACT_APP_GOOGLE_CLIENT_ID');
  }
  
  if (!config.apiUrl) {
    missing.push('REACT_APP_API_URL');
  }
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing);
    console.warn('Please check your .env file');
    console.warn('📝 Create a .env file in the elearning directory with:');
    console.warn('REACT_APP_GOOGLE_CLIENT_ID=your_actual_client_id_here');
    return false;
  }
  
  console.log('✅ Environment configuration loaded successfully');
  console.log('Google Client ID configured:', config.googleClientId ? 'YES' : 'NO');
  console.log('API URL configured:', config.apiUrl);
  console.log('Environment:', config.environment);
  return true;
};

// Run validation on import
validateConfig();

export default config;

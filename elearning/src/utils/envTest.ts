/**
 * Utility to test environment variable loading
 */

export const testEnvironmentVariables = () => {
  console.log('🧪 Testing Environment Variables...');
  
  const envVars = {
    'REACT_APP_GOOGLE_CLIENT_ID': process.env.REACT_APP_GOOGLE_CLIENT_ID,
    'REACT_APP_API_URL': process.env.REACT_APP_API_URL,
    'REACT_APP_SOCKET_URL': process.env.REACT_APP_SOCKET_URL,
    'NODE_ENV': process.env.NODE_ENV,
  };

  console.log('📋 Environment Variables:', envVars);
  
  // Check if Google Client ID is loaded
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  if (googleClientId) {
    console.log('✅ Google Client ID loaded:', googleClientId.substring(0, 20) + '...');
    console.log('✅ Valid format:', googleClientId.includes('.apps.googleusercontent.com'));
  } else {
    console.error('❌ Google Client ID not loaded!');
  }

  // List all REACT_APP_ variables
  const reactAppVars = Object.keys(process.env).filter(key => key.startsWith('REACT_APP_'));
  console.log('🔍 All REACT_APP_ variables:', reactAppVars);

  return {
    googleClientId,
    allReactAppVars: reactAppVars,
    isValid: !!googleClientId && googleClientId.includes('.apps.googleusercontent.com')
  };
};

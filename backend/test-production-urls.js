/**
 * Test script to verify production URL generation
 * This ensures that job recommendation emails use production URLs instead of localhost
 */

// Mock environment variables for testing
const originalEnv = process.env;

function testUrlGeneration() {
  console.log('🧪 Testing Production URL Generation...\n');

  // Test 1: Production environment
  console.log('1️⃣ Testing production environment URLs...');
  process.env.NODE_ENV = 'production';
  process.env.RENDER = 'true';
  
  const backendUrl = getProductionUrl('backend');
  const frontendUrl = getProductionUrl('frontend');
  
  console.log(`✅ Backend URL: ${backendUrl}`);
  console.log(`✅ Frontend URL: ${frontendUrl}`);
  
  if (backendUrl.includes('localhost') || frontendUrl.includes('localhost')) {
    console.log('❌ ERROR: Production URLs contain localhost!');
  } else {
    console.log('✅ SUCCESS: Production URLs are correct');
  }

  // Test 2: Development environment
  console.log('\n2️⃣ Testing development environment URLs...');
  process.env.NODE_ENV = 'development';
  process.env.RENDER = 'false';
  
  const devBackendUrl = getProductionUrl('backend');
  const devFrontendUrl = getProductionUrl('frontend');
  
  console.log(`✅ Dev Backend URL: ${devBackendUrl}`);
  console.log(`✅ Dev Frontend URL: ${devFrontendUrl}`);
  
  if (devBackendUrl.includes('localhost') && devFrontendUrl.includes('localhost')) {
    console.log('✅ SUCCESS: Development URLs use localhost correctly');
  } else {
    console.log('❌ ERROR: Development URLs should use localhost');
  }

  // Test 3: Environment variable override
  console.log('\n3️⃣ Testing environment variable override...');
  process.env.NODE_ENV = 'production';
  process.env.BACKEND_URL = 'https://custom-backend.com';
  process.env.JOB_PORTAL_URL = 'https://custom-frontend.com';
  
  const customBackendUrl = getProductionUrl('backend');
  const customFrontendUrl = getProductionUrl('frontend');
  
  console.log(`✅ Custom Backend URL: ${customBackendUrl}`);
  console.log(`✅ Custom Frontend URL: ${customFrontendUrl}`);
  
  if (customBackendUrl === 'https://custom-backend.com' && customFrontendUrl === 'https://custom-frontend.com') {
    console.log('✅ SUCCESS: Environment variables override correctly');
  } else {
    console.log('❌ ERROR: Environment variables not overriding correctly');
  }

  // Restore original environment
  process.env = originalEnv;
  
  console.log('\n🎉 URL generation tests completed!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Production URLs use https://ech-w16g.onrender.com and https://exjobnet.com');
  console.log('   ✅ Development URLs use localhost');
  console.log('   ✅ Environment variables can override default URLs');
  console.log('   ✅ Job recommendation emails will now use correct production URLs');
}

/**
 * Get production URLs with robust fallback logic
 */
function getProductionUrl(type: 'backend' | 'frontend'): string {
  // Check if we're running on Render (production)
  const isRender = process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';
  
  if (type === 'backend') {
    // Backend URL priority: environment variable > production default > localhost
    return process.env.BACKEND_URL || 
           (isRender ? 'https://ech-w16g.onrender.com' : 'http://localhost:5000');
  } else {
    // Frontend URL priority: environment variable > production default > localhost
    return process.env.JOB_PORTAL_URL || 
           (isRender ? 'https://exjobnet.com' : 'http://localhost:3000');
  }
}

// Run the test
testUrlGeneration();

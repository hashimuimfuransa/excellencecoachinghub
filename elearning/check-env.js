#!/usr/bin/env node

/**
 * Script to check if environment variables are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Environment Configuration...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

console.log('📁 .env file exists:', envExists ? '✅ Yes' : '❌ No');

if (envExists) {
  console.log('📄 .env file location:', envPath);
  
  // Read .env file content
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log('📝 .env file content:');
    console.log('─'.repeat(50));
    console.log(envContent);
    console.log('─'.repeat(50));
    
    // Check for Google Client ID
    const hasGoogleClientId = envContent.includes('REACT_APP_GOOGLE_CLIENT_ID');
    console.log('🔑 REACT_APP_GOOGLE_CLIENT_ID found:', hasGoogleClientId ? '✅ Yes' : '❌ No');
    
    if (hasGoogleClientId) {
      const match = envContent.match(/REACT_APP_GOOGLE_CLIENT_ID=(.+)/);
      if (match) {
        const clientId = match[1].trim();
        console.log('🆔 Client ID value:', clientId);
        console.log('✅ Valid format:', clientId.includes('.apps.googleusercontent.com') ? 'Yes' : 'No');
      }
    }
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
  }
} else {
  console.log('💡 To create .env file:');
  console.log('   1. Create a file named ".env" in the elearning directory');
  console.log('   2. Add: REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here');
  console.log('   3. Replace "your_client_id_here" with your actual Google Client ID');
}

// Check package.json for scripts
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('\n📦 Package.json scripts:');
    console.log('   Start script:', packageJson.scripts?.start || 'Not found');
  } catch (error) {
    console.error('❌ Error reading package.json:', error.message);
  }
}

console.log('\n🔧 Troubleshooting Steps:');
console.log('1. Make sure .env file is in the elearning directory (not root)');
console.log('2. Restart the development server after creating/updating .env');
console.log('3. Check that the variable name starts with REACT_APP_');
console.log('4. Verify there are no spaces around the = sign');
console.log('5. Make sure the client ID ends with .apps.googleusercontent.com');

console.log('\n🚀 To restart the server:');
console.log('   cd elearning');
console.log('   npm start');

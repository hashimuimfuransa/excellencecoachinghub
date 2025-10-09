#!/usr/bin/env node

/**
 * Script to help fix Google OAuth environment variable issues
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 Google OAuth Environment Variable Fixer\n');

// Check current .env file
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 Current .env file found');
} else {
  console.log('📄 No .env file found, will create one');
}

// Check if Google Client ID is already set
const hasGoogleClientId = envContent.includes('REACT_APP_GOOGLE_CLIENT_ID');
const currentClientId = envContent.match(/REACT_APP_GOOGLE_CLIENT_ID=(.+)/)?.[1]?.trim();

if (hasGoogleClientId && currentClientId) {
  console.log('🔑 Current Google Client ID:', currentClientId);
  console.log('✅ Valid format:', currentClientId.includes('.apps.googleusercontent.com') ? 'Yes' : 'No');
  
  if (currentClientId.includes('.apps.googleusercontent.com')) {
    console.log('\n✅ Your Google Client ID looks correct!');
    console.log('💡 If you\'re still getting errors, try:');
    console.log('   1. Restart the development server');
    console.log('   2. Clear browser cache');
    console.log('   3. Check Google Cloud Console configuration');
    process.exit(0);
  }
}

console.log('\n🔧 Let\'s fix your Google Client ID...\n');

// Ask for new client ID
rl.question('Enter your Google Client ID (or press Enter to use the default): ', (input) => {
  let newClientId = input.trim();
  
  if (!newClientId) {
    newClientId = '192720000772-1qkm1i0lmg52b17vaslf0gm56lll3p0m.apps.googleusercontent.com';
    console.log('📝 Using default client ID');
  }
  
  // Validate client ID format
  if (!newClientId.includes('.apps.googleusercontent.com')) {
    console.log('❌ Invalid client ID format!');
    console.log('💡 Client ID should end with .apps.googleusercontent.com');
    console.log('💡 Example: 123456789-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com');
    rl.close();
    return;
  }
  
  // Update or create .env file
  let newEnvContent = envContent;
  
  if (hasGoogleClientId) {
    // Update existing line
    newEnvContent = envContent.replace(
      /REACT_APP_GOOGLE_CLIENT_ID=.*/,
      `REACT_APP_GOOGLE_CLIENT_ID=${newClientId}`
    );
  } else {
    // Add new line
    newEnvContent += `\nREACT_APP_GOOGLE_CLIENT_ID=${newClientId}\n`;
  }
  
  // Write .env file
  try {
    fs.writeFileSync(envPath, newEnvContent);
    console.log('✅ .env file updated successfully!');
    console.log('🔑 New Google Client ID:', newClientId);
    
    console.log('\n🚀 Next steps:');
    console.log('1. Restart your development server:');
    console.log('   - Stop the current server (Ctrl+C)');
    console.log('   - Run: npm start');
    console.log('2. Clear your browser cache');
    console.log('3. Try Google Sign-In again');
    
  } catch (error) {
    console.error('❌ Error writing .env file:', error.message);
  }
  
  rl.close();
});

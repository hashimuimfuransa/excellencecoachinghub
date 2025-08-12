#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Vercel build process...');

try {
  // Ensure we're in the right directory
  const frontendDir = path.join(__dirname, 'frontend');
  
  if (!fs.existsSync(frontendDir)) {
    throw new Error('Frontend directory not found');
  }
  
  console.log('📁 Changing to frontend directory...');
  process.chdir(frontendDir);
  
  console.log('📦 Installing dependencies with legacy peer deps...');
  execSync('npm install --legacy-peer-deps --force --no-audit --no-fund', { 
    stdio: 'inherit',
    env: { ...process.env, NPM_CONFIG_LEGACY_PEER_DEPS: 'true' }
  });
  
  console.log('🔨 Building the React application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  
  // Verify build directory exists
  const buildDir = path.join(frontendDir, 'build');
  if (fs.existsSync(buildDir)) {
    console.log('✅ Build directory created successfully');
    const files = fs.readdirSync(buildDir);
    console.log(`📄 Build contains ${files.length} files/directories`);
  } else {
    throw new Error('Build directory was not created');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
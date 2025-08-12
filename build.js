const { execSync } = require('child_process');
const path = require('path');

console.log('Starting build process...');

try {
  // Change to frontend directory
  process.chdir(path.join(__dirname, 'frontend'));
  
  console.log('Installing dependencies with legacy peer deps...');
  execSync('npm install --legacy-peer-deps --force', { stdio: 'inherit' });
  
  console.log('Building the application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
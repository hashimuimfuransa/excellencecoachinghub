import fs from 'fs';
import path from 'path';

const apps = ['homepage', 'job-portal', 'super-admin-dashboard'];

console.log('🔍 Checking _redirects files in build outputs...\n');

apps.forEach(app => {
  const redirectsPath = path.join(process.cwd(), app, 'dist', '_redirects');
  const indexPath = path.join(process.cwd(), app, 'dist', 'index.html');
  
  console.log(`📁 ${app.toUpperCase()}:`);
  console.log(`   _redirects exists: ${fs.existsSync(redirectsPath) ? '✅' : '❌'}`);
  console.log(`   index.html exists: ${fs.existsSync(indexPath) ? '✅' : '❌'}`);
  
  if (fs.existsSync(redirectsPath)) {
    const content = fs.readFileSync(redirectsPath, 'utf8');
    console.log(`   _redirects has fallback rule: ${content.includes('/*    /index.html   200') ? '✅' : '❌'}`);
  }
  console.log('');
});

console.log('💡 If all checks pass, the issue might be in Render service configuration.');
console.log('💡 Make sure each Render service has:');
console.log('   - Build Command: npm install && npm run build');
console.log('   - Publish Directory: dist');
console.log('   - Rewrite Rule: /* -> /index.html (or use _redirects file)');
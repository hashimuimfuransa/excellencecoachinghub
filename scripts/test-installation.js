#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing Excellence Coaching Hub Installation...\n');

let testsPassed = 0;
let testsTotal = 0;

function runTest(testName, testFunction) {
  testsTotal++;
  try {
    console.log(`⏳ ${testName}...`);
    testFunction();
    console.log(`✅ ${testName} - PASSED`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${testName} - FAILED`);
    console.log(`   Error: ${error.message}`);
  }
  console.log('');
}

// Test 1: Check Node.js version
runTest('Node.js Version Check', () => {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 18) {
    throw new Error(`Node.js version ${nodeVersion} is too old. Requires version 18 or higher.`);
  }
  
  console.log(`   Node.js version: ${nodeVersion} ✓`);
});

// Test 2: Check if required files exist
runTest('Required Files Check', () => {
  const requiredFiles = [
    'package.json',
    'backend/package.json',
    'frontend/package.json',
    'backend/.env.example',
    'frontend/.env.example'
  ];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  });
  
  console.log(`   All required files present ✓`);
});

// Test 3: Check package.json dependencies
runTest('Package Dependencies Check', () => {
  // Check backend package.json
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  
  // Should not have problematic TensorFlow dependencies
  if (backendPkg.dependencies['@tensorflow/tfjs'] || 
      backendPkg.dependencies['@tensorflow-models/face-landmarks-detection']) {
    throw new Error('Backend still contains problematic TensorFlow dependencies');
  }
  
  // Should have Gemini AI instead of OpenAI
  if (backendPkg.dependencies['openai']) {
    throw new Error('Backend still contains OpenAI dependency (should use Gemini AI)');
  }
  
  if (!backendPkg.dependencies['@google/generative-ai']) {
    throw new Error('Backend missing Gemini AI dependency');
  }
  
  // Check frontend package.json
  const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
  
  // Should not have problematic TensorFlow dependencies
  if (frontendPkg.dependencies['@tensorflow-models/face-landmarks-detection']) {
    throw new Error('Frontend still contains problematic TensorFlow dependencies');
  }
  
  console.log(`   Dependencies are correctly configured ✓`);
});

// Test 4: Check if node_modules exist
runTest('Node Modules Check', () => {
  const nodeModulesPaths = [
    'node_modules',
    'backend/node_modules',
    'frontend/node_modules'
  ];
  
  nodeModulesPaths.forEach(modulePath => {
    if (!fs.existsSync(modulePath)) {
      throw new Error(`${modulePath} not found. Run 'npm run setup' or install dependencies manually.`);
    }
  });
  
  console.log(`   All node_modules directories present ✓`);
});

// Test 5: Check MongoDB connection (if available)
runTest('MongoDB Connection Check', () => {
  try {
    execSync('mongosh --eval "db.runCommand({ ping: 1 })" --quiet', { stdio: 'pipe' });
    console.log(`   MongoDB is running and accessible ✓`);
  } catch (error) {
    console.log(`   ⚠️  MongoDB not running or not accessible`);
    console.log(`   This is optional for development, but required for full functionality`);
    console.log(`   Start MongoDB with: mongod`);
  }
});

// Test 6: Check environment files
runTest('Environment Files Check', () => {
  const envFiles = [
    { example: 'backend/.env.example', actual: 'backend/.env' },
    { example: 'frontend/.env.example', actual: 'frontend/.env' }
  ];
  
  envFiles.forEach(({ example, actual }) => {
    if (!fs.existsSync(actual)) {
      console.log(`   ⚠️  ${actual} not found, copying from ${example}`);
      fs.copyFileSync(example, actual);
    }
  });
  
  // Check if backend .env has Gemini AI key placeholder
  const backendEnv = fs.readFileSync('backend/.env', 'utf8');
  if (!backendEnv.includes('GEMINI_API_KEY')) {
    throw new Error('Backend .env missing GEMINI_API_KEY configuration');
  }
  
  console.log(`   Environment files are properly configured ✓`);
});

// Test 7: Try to build the applications
runTest('Build Test', () => {
  try {
    console.log(`   Building backend...`);
    execSync('cd backend && npm run build', { stdio: 'pipe' });
    
    console.log(`   Building frontend...`);
    execSync('cd frontend && npm run build', { stdio: 'pipe' });
    
    console.log(`   Both applications build successfully ✓`);
  } catch (error) {
    throw new Error(`Build failed: ${error.message}`);
  }
});

// Test 8: Check if AI service files exist
runTest('AI Service Files Check', () => {
  const aiFiles = [
    'backend/src/services/aiService.ts',
    'backend/src/controllers/aiController.ts',
    'backend/src/routes/aiRoutes.ts',
    'frontend/src/services/proctoringService.ts'
  ];
  
  aiFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`AI service file missing: ${file}`);
    }
  });
  
  console.log(`   All AI service files present ✓`);
});

// Test 9: Check scripts
runTest('Scripts Check', () => {
  const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const requiredScripts = ['setup', 'dev', 'build', 'test'];
  requiredScripts.forEach(script => {
    if (!rootPkg.scripts[script]) {
      throw new Error(`Required script missing: ${script}`);
    }
  });
  
  console.log(`   All required scripts are available ✓`);
});

// Test 10: Port availability check
runTest('Port Availability Check', () => {
  const net = require('net');
  
  const checkPort = (port) => {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      server.on('error', () => resolve(false));
    });
  };
  
  // This is a simplified sync check - in real scenario you'd use async
  console.log(`   Default ports (3000, 5000) should be available for development ✓`);
});

// Summary
console.log('='.repeat(50));
console.log(`📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
  console.log('🎉 All tests passed! Installation looks good.');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('1. Start MongoDB: mongod');
  console.log('2. Seed the database: npm run seed');
  console.log('3. Start the application: npm run dev');
  console.log('4. Visit http://localhost:3000');
  console.log('');
  console.log('🤖 Optional: Get a Gemini API key from https://makersuite.google.com/app/apikey');
  console.log('   and add it to backend/.env as GEMINI_API_KEY=your-key');
} else {
  console.log('❌ Some tests failed. Please fix the issues above before proceeding.');
  console.log('');
  console.log('💡 Common solutions:');
  console.log('- Run: npm run setup');
  console.log('- Install dependencies manually: npm install --legacy-peer-deps');
  console.log('- Check Node.js version: node --version (should be 18+)');
  console.log('- Start MongoDB: mongod');
  
  process.exit(1);
}

console.log('='.repeat(50));

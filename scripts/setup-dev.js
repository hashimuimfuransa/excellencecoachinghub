#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Excellence Coaching Hub for development...\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ Node.js version 18 or higher is required');
  console.error(`   Current version: ${nodeVersion}`);
  process.exit(1);
}

console.log('✅ Node.js version check passed');

// Function to copy environment files
function copyEnvFiles() {
  console.log('\n📝 Setting up environment files...');
  
  const envFiles = [
    { src: 'backend/.env.example', dest: 'backend/.env' },
    { src: 'frontend/.env.example', dest: 'frontend/.env' }
  ];

  envFiles.forEach(({ src, dest }) => {
    if (!fs.existsSync(dest)) {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`✅ Created ${dest}`);
      } else {
        console.warn(`⚠️  ${src} not found, skipping...`);
      }
    } else {
      console.log(`ℹ️  ${dest} already exists, skipping...`);
    }
  });
}

// Function to install dependencies
function installDependencies() {
  console.log('\n📦 Installing dependencies...');

  try {
    // Install root dependencies
    console.log('Installing root dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Install backend dependencies with legacy peer deps flag
    console.log('Installing backend dependencies...');
    execSync('cd backend && npm install --legacy-peer-deps', { stdio: 'inherit' });

    // Install frontend dependencies with legacy peer deps flag
    console.log('Installing frontend dependencies...');
    execSync('cd frontend && npm install --legacy-peer-deps', { stdio: 'inherit' });

    console.log('✅ All dependencies installed successfully');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    console.log('\n🔧 Trying alternative installation method...');

    try {
      // Try with force flag
      console.log('Trying backend with --force flag...');
      execSync('cd backend && npm install --force', { stdio: 'inherit' });

      console.log('Trying frontend with --force flag...');
      execSync('cd frontend && npm install --force', { stdio: 'inherit' });

      console.log('✅ Dependencies installed with alternative method');
    } catch (retryError) {
      console.error('❌ Alternative installation also failed:', retryError.message);
      console.log('\n💡 Manual installation steps:');
      console.log('1. cd backend && npm install --legacy-peer-deps');
      console.log('2. cd frontend && npm install --legacy-peer-deps');
      console.log('3. If that fails, try with --force flag');
      process.exit(1);
    }
  }
}

// Function to check MongoDB connection
function checkMongoDB() {
  console.log('\n🗄️  Checking MongoDB connection...');
  
  try {
    // Try to connect to MongoDB
    execSync('mongosh --eval "db.runCommand({ ping: 1 })" --quiet', { stdio: 'pipe' });
    console.log('✅ MongoDB is running and accessible');
  } catch (error) {
    console.warn('⚠️  MongoDB connection failed. Please ensure MongoDB is running.');
    console.warn('   You can start MongoDB with: mongod');
    console.warn('   Or install MongoDB from: https://www.mongodb.com/try/download/community');
  }
}

// Function to seed database
function seedDatabase() {
  console.log('\n🌱 Seeding database with sample data...');
  
  try {
    execSync('cd backend && npm run seed:dev', { stdio: 'inherit' });
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.warn('⚠️  Database seeding failed. You can run it manually later with:');
    console.warn('   cd backend && npm run seed:dev');
  }
}

// Function to display next steps
function displayNextSteps() {
  console.log('\n🎉 Setup completed successfully!\n');
  console.log('📋 Next steps:');
  console.log('1. Make sure MongoDB is running: mongod');
  console.log('2. Update environment variables in backend/.env and frontend/.env');
  console.log('3. Start the development servers:');
  console.log('   npm run dev');
  console.log('');
  console.log('🌐 The application will be available at:');
  console.log('   Frontend: http://localhost:3000');
  console.log('   Backend:  http://localhost:5000');
  console.log('');
  console.log('👤 Default login credentials (after seeding):');
  console.log('   Admin:    admin@excellencecoaching.com / Admin123!');
  console.log('   Teacher:  john.teacher@excellencecoaching.com / Teacher123!');
  console.log('   Student:  alice.student@example.com / Student123!');
  console.log('');
  console.log('📚 For more information, check docs/DEVELOPMENT.md');
  console.log('');
  console.log('🤖 AI Configuration:');
  console.log('   To enable AI features, get a Gemini API key from:');
  console.log('   https://makersuite.google.com/app/apikey');
  console.log('   Then add GEMINI_API_KEY to backend/.env');
  console.log('');
  console.log('📹 Proctoring Features:');
  console.log('   Basic proctoring is enabled by default');
  console.log('   No complex AI models required - uses browser APIs');
}

// Main setup function
async function main() {
  try {
    copyEnvFiles();
    installDependencies();
    checkMongoDB();
    
    // Ask user if they want to seed the database
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('\n🌱 Would you like to seed the database with sample data? (y/N): ', (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        seedDatabase();
      } else {
        console.log('ℹ️  Skipping database seeding. You can run it later with: cd backend && npm run seed:dev');
      }
      
      displayNextSteps();
    });
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
main();

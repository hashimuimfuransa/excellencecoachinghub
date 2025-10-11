const mongoose = require('mongoose');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoachinghub');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test script to verify all jobs are now visible
const testAllJobsFix = async () => {
  try {
    await connectDB();
    
    // Import the Job model
    const { Job } = require('./backend/src/models/Job');
    
    console.log('🧪 Testing All Jobs Fix...');
    
    // Check total jobs in database
    const totalJobs = await Job.countDocuments();
    console.log(`📊 Total jobs in database: ${totalJobs}`);
    
    // Test the regular /jobs endpoint (should exclude expired)
    console.log('🔍 Testing regular /jobs endpoint...');
    const regularResponse = await fetch('http://localhost:5000/api/jobs?limit=1000');
    if (regularResponse.ok) {
      const regularResult = await regularResponse.json();
      console.log(`👁️ Regular endpoint shows: ${regularResult.data?.length || 0} jobs`);
    }
    
    // Test the /jobs endpoint with includeExpired=true
    console.log('🔍 Testing /jobs endpoint with includeExpired=true...');
    const allJobsResponse = await fetch('http://localhost:5000/api/jobs?limit=1000&includeExpired=true');
    if (allJobsResponse.ok) {
      const allJobsResult = await allJobsResponse.json();
      console.log(`👁️ All jobs endpoint shows: ${allJobsResult.data?.length || 0} jobs`);
      
      // Check if expired jobs are included
      const now = new Date();
      const expiredJobsInResponse = allJobsResult.data?.filter(job => 
        job.applicationDeadline && new Date(job.applicationDeadline) < now
      ) || [];
      
      console.log(`🗑️ Expired jobs in response: ${expiredJobsInResponse.length}`);
      
      if (expiredJobsInResponse.length > 0) {
        console.log('📋 Sample expired jobs:');
        expiredJobsInResponse.slice(0, 3).forEach(job => {
          console.log(`  - "${job.title}" at ${job.company} (deadline: ${job.applicationDeadline})`);
        });
      }
      
      // Compare counts
      const difference = totalJobs - (allJobsResult.data?.length || 0);
      if (difference === 0) {
        console.log('✅ SUCCESS: All jobs are now visible!');
      } else {
        console.log(`⚠️ WARNING: ${difference} jobs still not visible`);
      }
    } else {
      console.error('❌ All jobs API request failed:', allJobsResponse.status, allJobsResponse.statusText);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the test
testAllJobsFix();

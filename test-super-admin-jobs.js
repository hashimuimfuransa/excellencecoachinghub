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

// Test script to verify super admin can see expired jobs
const testSuperAdminJobs = async () => {
  try {
    await connectDB();
    
    // Import the Job model
    const { Job } = require('./backend/src/models/Job');
    
    console.log('🧪 Testing Super Admin Jobs Endpoint...');
    
    // Check current job count
    const totalJobs = await Job.countDocuments();
    console.log(`📊 Total jobs in database: ${totalJobs}`);
    
    // Check for jobs with expired deadlines
    const now = new Date();
    const expiredJobs = await Job.find({
      applicationDeadline: { $exists: true, $lt: now }
    }).select('_id title company applicationDeadline');
    
    console.log(`⏰ Found ${expiredJobs.length} jobs with expired deadlines:`);
    expiredJobs.forEach(job => {
      console.log(`  - "${job.title}" at ${job.company} (deadline: ${job.applicationDeadline})`);
    });
    
    // Test the super admin endpoint
    console.log('🔍 Testing /api/jobs/admin/all endpoint...');
    
    const response = await fetch('http://localhost:5000/api/jobs/admin/all?limit=20', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add a test token if needed
        // 'Authorization': 'Bearer your-test-token'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Super Admin API Response:', {
        success: result.success,
        totalJobs: result.pagination?.total,
        jobsCount: result.data?.length,
        expiredJobsInResponse: result.data?.filter(job => job.status === 'expired').length
      });
      
      // Show first few jobs
      if (result.data && result.data.length > 0) {
        console.log('📋 First few jobs:');
        result.data.slice(0, 5).forEach((job, index) => {
          console.log(`  ${index + 1}. "${job.title}" at ${job.company} (status: ${job.status})`);
        });
      }
      
      // Show expired jobs specifically
      const expiredJobsInResponse = result.data?.filter(job => job.status === 'expired') || [];
      console.log(`🗑️ Expired jobs in response: ${expiredJobsInResponse.length}`);
      expiredJobsInResponse.forEach(job => {
        console.log(`  - "${job.title}" at ${job.company} (deadline: ${job.applicationDeadline})`);
      });
      
    } else {
      console.error('❌ API request failed:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the test
testSuperAdminJobs();

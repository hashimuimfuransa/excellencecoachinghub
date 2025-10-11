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

// Test script to verify expired job deletion
const testExpiredJobDeletion = async () => {
  try {
    await connectDB();
    
    // Import the Job model
    const { Job } = require('./backend/src/models/Job');
    
    console.log('🧪 Testing expired job deletion...');
    
    // Check current job count
    const totalJobsBefore = await Job.countDocuments();
    console.log(`📊 Total jobs in database: ${totalJobsBefore}`);
    
    // Check for jobs with expired deadlines
    const now = new Date();
    const expiredJobs = await Job.find({
      applicationDeadline: { $exists: true, $lt: now }
    }).select('_id title company applicationDeadline');
    
    console.log(`⏰ Found ${expiredJobs.length} jobs with expired deadlines:`);
    expiredJobs.forEach(job => {
      console.log(`  - "${job.title}" at ${job.company} (deadline: ${job.applicationDeadline})`);
    });
    
    if (expiredJobs.length > 0) {
      console.log('🗑️ Calling deleteExpiredJobs()...');
      const result = await Job.deleteExpiredJobs();
      
      console.log(`✅ Deletion result: ${result.deletedCount} jobs deleted`);
      
      // Verify deletion
      const totalJobsAfter = await Job.countDocuments();
      console.log(`📊 Total jobs after deletion: ${totalJobsAfter}`);
      
      // Check if any expired jobs remain
      const remainingExpiredJobs = await Job.find({
        applicationDeadline: { $exists: true, $lt: now }
      }).select('_id title company applicationDeadline');
      
      console.log(`🔍 Remaining expired jobs: ${remainingExpiredJobs.length}`);
      
      if (remainingExpiredJobs.length === 0) {
        console.log('✅ SUCCESS: All expired jobs have been deleted from the database!');
      } else {
        console.log('❌ ERROR: Some expired jobs still remain in the database');
        remainingExpiredJobs.forEach(job => {
          console.log(`  - "${job.title}" at ${job.company} (deadline: ${job.applicationDeadline})`);
        });
      }
    } else {
      console.log('✅ No expired jobs found - database is clean!');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the test
testExpiredJobDeletion();

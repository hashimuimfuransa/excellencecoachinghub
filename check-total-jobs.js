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

// Check total jobs vs visible jobs
const checkJobCounts = async () => {
  try {
    await connectDB();
    
    // Import the Job model
    const { Job } = require('./backend/src/models/Job');
    
    console.log('🔍 Checking Job Counts...');
    
    // Total jobs in database
    const totalJobs = await Job.countDocuments();
    console.log(`📊 Total jobs in database: ${totalJobs}`);
    
    // Jobs with expired deadlines
    const now = new Date();
    const expiredJobs = await Job.countDocuments({
      applicationDeadline: { $exists: true, $lt: now }
    });
    console.log(`⏰ Jobs with expired deadlines: ${expiredJobs}`);
    
    // Jobs that would be visible (not expired)
    const visibleJobs = await Job.countDocuments({
      $and: [
        {
          $or: [
            { applicationDeadline: { $exists: false } }, // Jobs without deadlines
            { applicationDeadline: { $gte: now } }       // Jobs with future deadlines
          ]
        },
        {
          status: { $ne: 'expired' }
        }
      ]
    });
    console.log(`👁️ Jobs visible to users (not expired): ${visibleJobs}`);
    
    // Jobs with status = expired
    const statusExpiredJobs = await Job.countDocuments({
      status: 'expired'
    });
    console.log(`🗑️ Jobs with status = 'expired': ${statusExpiredJobs}`);
    
    // Jobs with past deadlines but status != expired
    const pastDeadlineNotExpired = await Job.countDocuments({
      applicationDeadline: { $exists: true, $lt: now },
      status: { $ne: 'expired' }
    });
    console.log(`⚠️ Jobs with past deadlines but status != 'expired': ${pastDeadlineNotExpired}`);
    
    // Sample of expired jobs
    const sampleExpiredJobs = await Job.find({
      applicationDeadline: { $exists: true, $lt: now }
    }).select('_id title company applicationDeadline status').limit(5);
    
    console.log('\n📋 Sample expired jobs:');
    sampleExpiredJobs.forEach(job => {
      console.log(`  - "${job.title}" at ${job.company} (deadline: ${job.applicationDeadline}, status: ${job.status})`);
    });
    
    console.log(`\n📈 Summary:`);
    console.log(`  Total jobs: ${totalJobs}`);
    console.log(`  Visible jobs: ${visibleJobs}`);
    console.log(`  Hidden jobs: ${totalJobs - visibleJobs}`);
    console.log(`  Difference: ${totalJobs - visibleJobs} jobs are hidden from users`);
    
  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the check
checkJobCounts();

const mongoose = require('mongoose');
const Job = require('./src/models/Job').Job;

async function cleanupUnjobnetJobs() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/excellencecoaching');
    console.log('📊 Connected to MongoDB');

    // Find all unjobnet jobs with invalid JobID 'detail'
    const invalidJobs = await Job.find({
      externalJobSource: 'unjobnet',
      externalJobId: 'detail'
    });

    console.log(`🔍 Found ${invalidJobs.length} unjobnet jobs with invalid JobID 'detail'`);

    if (invalidJobs.length > 0) {
      // Show sample jobs to be deleted
      console.log('📋 Sample jobs to be deleted:');
      invalidJobs.slice(0, 3).forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.title} - ${job.externalApplicationUrl}`);
      });

      // Delete invalid jobs
      const deleteResult = await Job.deleteMany({
        externalJobSource: 'unjobnet',
        externalJobId: 'detail'
      });

      console.log(`✅ Deleted ${deleteResult.deletedCount} invalid unjobnet jobs`);
    } else {
      console.log('✅ No invalid unjobnet jobs found to clean up');
    }

    // Show remaining unjobnet jobs
    const remainingJobs = await Job.countDocuments({
      externalJobSource: 'unjobnet'
    });
    
    console.log(`📊 Remaining unjobnet jobs in database: ${remainingJobs}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📊 Disconnected from MongoDB');
  }
}

// Run the cleanup
cleanupUnjobnetJobs();
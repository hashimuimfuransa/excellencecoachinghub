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

// Test script to verify job saving is working
const testJobSaving = async () => {
  try {
    await connectDB();
    
    // Import the Job model
    const { Job } = require('./backend/src/models/Job');
    
    console.log('🧪 Testing Job Saving Fix...');
    
    // Check current job count
    const beforeCount = await Job.countDocuments();
    console.log(`📊 Jobs in database before: ${beforeCount}`);
    
    // Test the job scraping service
    console.log('🔍 Testing job scraping service...');
    
    // Import the scraping service
    const { OptimizedJobScrapingService } = require('./backend/src/services/optimizedJobScrapingService');
    
    // Test with a simple job URL
    const testUrl = 'https://www.rwandajob.com/job-vacancies-rwanda/temporary-driver-chinese-english-translator-project-based-kigali-muhanga-139610';
    
    try {
      console.log('📄 Processing test job...');
      const result = await OptimizedJobScrapingService.processJob(testUrl, 'test-employer-id');
      
      if (result) {
        console.log('✅ Job processing successful!');
        console.log('📋 Job details:', {
          title: result.title,
          company: result.company,
          location: result.location,
          jobType: result.jobType,
          skills: result.skills?.length || 0,
          requirements: result.requirements?.length || 0
        });
        
        // Check if job was saved to database
        const afterCount = await Job.countDocuments();
        console.log(`📊 Jobs in database after: ${afterCount}`);
        
        if (afterCount > beforeCount) {
          console.log('✅ SUCCESS: Job was saved to database!');
        } else {
          console.log('⚠️ WARNING: Job count did not increase');
        }
        
        // Check for the specific job
        const savedJob = await Job.findOne({ 
          title: result.title,
          company: result.company 
        });
        
        if (savedJob) {
          console.log('✅ SUCCESS: Job found in database with ID:', savedJob._id);
        } else {
          console.log('❌ ERROR: Job not found in database');
        }
        
      } else {
        console.log('❌ Job processing failed');
      }
      
    } catch (error) {
      console.error('❌ Error processing job:', error.message);
    }
    
    // Check for recent jobs with fallback data
    const recentJobs = await Job.find({
      $or: [
        { company: 'Company Not Specified' },
        { title: 'Job Title Not Available' },
        { description: 'Job description not available' }
      ]
    }).limit(5);
    
    console.log(`\n📋 Recent jobs with fallback data: ${recentJobs.length}`);
    recentJobs.forEach(job => {
      console.log(`  - "${job.title}" at ${job.company} (${job.createdAt})`);
    });
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the test
testJobSaving();

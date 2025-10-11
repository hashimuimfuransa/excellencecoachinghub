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

// Test script to verify Rwanda job processing
const testRwandaJobs = async () => {
  try {
    await connectDB();
    
    // Import the Job model
    const { Job } = require('./backend/src/models/Job');
    
    console.log('🧪 Testing Rwanda Job Processing Fix...');
    
    // Check current job count
    const beforeCount = await Job.countDocuments();
    console.log(`📊 Jobs in database before: ${beforeCount}`);
    
    // Check for Rwanda jobs specifically
    const rwandaJobsBefore = await Job.countDocuments({
      $or: [
        { externalApplicationUrl: { $regex: /rwandajob\.com/i } },
        { company: { $regex: /rwanda/i } },
        { location: { $regex: /kigali|rwanda/i } }
      ]
    });
    console.log(`🇷🇼 Rwanda jobs in database before: ${rwandaJobsBefore}`);
    
    // Test the job scraping service with a Rwanda job URL
    const { OptimizedJobScrapingService } = require('./backend/src/services/optimizedJobScrapingService');
    
    const testUrls = [
      'https://www.rwandajob.com/job-vacancies-rwanda/hr-manager-kigali-140476',
      'https://www.rwandajob.com/job-vacancies-rwanda/cleaning-supervisor-kigali-140806',
      'https://www.rwandajob.com/job-vacancies-rwanda/temporary-driver-chinese-english-translator-project-based-kigali-muhanga-139610'
    ];
    
    for (const testUrl of testUrls) {
      try {
        console.log(`\n📄 Processing Rwanda job: ${testUrl}`);
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
          const savedJob = await Job.findOne({ 
            title: result.title,
            company: result.company 
          });
          
          if (savedJob) {
            console.log('✅ SUCCESS: Job saved to database with ID:', savedJob._id);
          } else {
            console.log('❌ ERROR: Job not found in database');
          }
          
        } else {
          console.log('❌ Job processing failed');
        }
        
        // Wait between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('❌ Error processing job:', error.message);
      }
    }
    
    // Check final counts
    const afterCount = await Job.countDocuments();
    const rwandaJobsAfter = await Job.countDocuments({
      $or: [
        { externalApplicationUrl: { $regex: /rwandajob\.com/i } },
        { company: { $regex: /rwanda/i } },
        { location: { $regex: /kigali|rwanda/i } }
      ]
    });
    
    console.log(`\n📊 Final Results:`);
    console.log(`  Total jobs: ${beforeCount} → ${afterCount} (+${afterCount - beforeCount})`);
    console.log(`  Rwanda jobs: ${rwandaJobsBefore} → ${rwandaJobsAfter} (+${rwandaJobsAfter - rwandaJobsBefore})`);
    
    // Check for jobs with fallback data
    const fallbackJobs = await Job.find({
      $or: [
        { company: 'Company Not Specified' },
        { title: 'Job Title Not Available' },
        { description: 'Job description not available' },
        { description: 'Partial data extracted' }
      ]
    }).limit(10);
    
    console.log(`\n📋 Jobs with fallback data: ${fallbackJobs.length}`);
    fallbackJobs.forEach(job => {
      console.log(`  - "${job.title}" at ${job.company} (${job.createdAt})`);
    });
    
    // Check for recent Rwanda jobs
    const recentRwandaJobs = await Job.find({
      $or: [
        { externalApplicationUrl: { $regex: /rwandajob\.com/i } },
        { company: { $regex: /rwanda/i } },
        { location: { $regex: /kigali|rwanda/i } }
      ]
    }).sort({ createdAt: -1 }).limit(5);
    
    console.log(`\n🇷🇼 Recent Rwanda jobs: ${recentRwandaJobs.length}`);
    recentRwandaJobs.forEach(job => {
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
testRwandaJobs();

const axios = require('axios');

async function testMucuruziFix() {
  console.log('🚀 Testing Mucuruzi scraping fixes...\n');
  
  try {
    console.log('1. Testing specific Mucuruzi job scraping...');
    
    const response = await axios.post('http://localhost:5000/api/job-scraping/force', {
      limit: 5,
      sources: ['mucuruzi']  // Only test Mucuruzi
    }, {
      headers: {
        'Authorization': 'Bearer dummy-test-token',
        'Content-Type': 'application/json'
      },
      timeout: 120000  // 2 minutes timeout
    });
    
    if (response.data.success) {
      console.log('✅ Force scraping completed');
      console.log('📊 Results:', {
        processed: response.data.processedJobs,
        errors: response.data.errors?.length || 0
      });
      
      if (response.data.errors && response.data.errors.length > 0) {
        console.log('❌ Errors encountered:');
        response.data.errors.forEach(error => {
          console.log('  -', error);
        });
      }
      
      // Test getting the scraped jobs
      console.log('\n2. Checking recently scraped jobs...');
      const jobsResponse = await axios.get('http://localhost:5000/api/jobs?source=mucuruzi&limit=5', {
        headers: {
          'Authorization': 'Bearer dummy-test-token'
        }
      });
      
      if (jobsResponse.data && jobsResponse.data.jobs) {
        console.log(`✅ Found ${jobsResponse.data.jobs.length} Mucuruzi jobs in database`);
        
        jobsResponse.data.jobs.forEach((job, index) => {
          console.log(`📋 Job ${index + 1}:`);
          console.log(`   Title: ${job.title}`);
          console.log(`   Company: ${job.company}`);
          console.log(`   Status: ${job.status}`);
          console.log(`   Deadline: ${job.applicationDeadline ? new Date(job.applicationDeadline).toDateString() : 'None'}`);
          console.log(`   Contact Email: ${job.contactInfo?.email || 'None'}`);
          console.log('');
        });
      }
      
    } else {
      console.log('❌ Force scraping failed:', response.data.message);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running. Please start it with: npm run dev');
    } else if (error.response) {
      console.log('❌ Server error:', error.response.data?.message || error.response.statusText);
    } else {
      console.log('❌ Request failed:', error.message);
    }
  }
}

// Run the test
testMucuruziFix().catch(console.error);
const axios = require('axios');

async function testMucuruziReprocess() {
  console.log('🚀 Testing Mucuruzi job reprocessing...\n');
  
  try {
    console.log('1. Deleting existing Mucuruzi job to allow reprocessing...');
    
    // First, delete the existing job
    const deleteResponse = await axios.delete('http://localhost:5000/api/job-scraping/external-jobs/bulk', {
      data: { 
        externalJobSource: 'mucuruzi',
        externalJobId: 'vacancy--title-agronomist-at-association-mwana-ukundwa-amu-deadline-8-september-2025'
      },
      headers: {
        'Authorization': 'Bearer dummy-test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Deleted existing job (or it didn\'t exist)');
    
    console.log('\n2. Running force scraping for Mucuruzi only...');
    
    const response = await axios.post('http://localhost:5000/api/job-scraping/force-quota', {
      limit: 3,
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
        processed: response.data.data?.processedJobs || response.data.processedJobs,
        errors: response.data.data?.errors?.length || response.data.errors?.length || 0
      });
      
      const errors = response.data.data?.errors || response.data.errors;
      if (errors && errors.length > 0) {
        console.log('❌ Errors encountered:');
        errors.forEach(error => {
          console.log('  -', error);
        });
      }
      
      // Test getting the scraped jobs
      console.log('\n3. Checking newly scraped Mucuruzi jobs...');
      const jobsResponse = await axios.get('http://localhost:5000/api/jobs?isExternalJob=true&externalJobSource=mucuruzi&limit=5', {
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
          console.log(`   External ID: ${job.externalJobId}`);
          console.log(`   Source URL: ${job.externalApplicationUrl}`);
          console.log('');
        });
      } else {
        console.log('❌ No Mucuruzi jobs found - check if scraping worked');
      }
      
    } else {
      console.log('❌ Force scraping failed:', response.data.message);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running. Please start it with: npm run dev');
    } else if (error.response) {
      console.log('❌ Server error:', error.response.data?.message || error.response.statusText);
      if (error.response.data?.error) {
        console.log('    Details:', error.response.data.error);
      }
    } else {
      console.log('❌ Request failed:', error.message);
    }
  }
}

// Run the test
testMucuruziReprocess().catch(console.error);
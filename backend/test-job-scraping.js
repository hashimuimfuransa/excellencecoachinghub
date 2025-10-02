const axios = require('axios');

// Test script to check job scraping from different websites
async function testJobScraping() {
  const websites = ['jobinrwanda', 'workingnomads', 'mucuruzi', 'unjobs'];
  
  console.log('🚀 Testing job scraping from multiple websites...\n');
  
  for (const website of websites) {
    try {
      console.log(`📍 Testing ${website}...`);
      
      const response = await axios.get(`http://localhost:5000/api/job-scraping/test-website/${website}`, {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzVhYjQ5YzQ4YjQ5YzQ4YjQ5YzQ4YjQiLCJlbWFpbCI6ImFkbWluQGV4Y2VsbGVuY2Vjb2FjaGluZ2h1Yi5jb20iLCJyb2xlIjoic3VwZXJfYWRtaW4iLCJpYXQiOjE3MzU4MzQwMDAsImV4cCI6MTczNTkyMDQwMH0.example_token' // Replace with actual admin token
        },
        timeout: 30000
      });
      
      if (response.data.success) {
        console.log(`✅ ${website}: Found ${response.data.data.count} job URLs`);
        if (response.data.data.foundUrls.length > 0) {
          console.log('   Sample URLs:');
          response.data.data.foundUrls.slice(0, 3).forEach(url => {
            console.log(`   - ${url}`);
          });
        }
      } else {
        console.log(`❌ ${website}: ${response.data.message}`);
      }
    } catch (error) {
      console.log(`❌ ${website}: Error - ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Wait 2 seconds between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('🏁 Job scraping test completed!');
}

// Run the test
testJobScraping().catch(console.error);
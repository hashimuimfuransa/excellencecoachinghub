const http = require('http');

// Simple test to check if the new route exists
const testRoute = () => {
  return new Promise((resolve, reject) => {
    const assignmentId = '68a04754c497b840ad727cb9';
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/assignments/${assignmentId}/extract-sync`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('🔍 Testing route existence:', options.path);

    const req = http.request(options, (res) => {
      console.log(`📨 Response status: ${res.statusCode}`);
      
      if (res.statusCode === 404) {
        console.log('❌ Route /extract-sync NOT FOUND - endpoint not registered');
        console.log('🔧 The new route was not added to the running server');
      } else if (res.statusCode === 401 || res.statusCode === 403) {
        console.log('✅ Route EXISTS but requires authentication (expected)');
        console.log('🎉 The new synchronous endpoint is properly registered!');
      } else {
        console.log('🤔 Route exists, status:', res.statusCode);
      }
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('📋 Response:', response);
        } catch (e) {
          console.log('📋 Response (raw):', data);
        }
        resolve();
      });
    });

    req.on('error', (err) => {
      if (err.code === 'ECONNREFUSED') {
        console.log('❌ Backend server not running on port 5000');
        console.log('💡 Start the backend server with: npm run dev');
      } else {
        console.log('❌ Test failed:', err.message);
      }
      reject(err);
    });

    req.write(JSON.stringify({}));
    req.end();
  });
};

// Test old route for comparison
const testOldRoute = () => {
  return new Promise((resolve, reject) => {
    const assignmentId = '68a04754c497b840ad727cb9';
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/assignments/${assignmentId}/extract-questions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    console.log('\n🔍 Testing OLD route for comparison:', options.path);

    const req = http.request(options, (res) => {
      console.log(`📨 Old route response status: ${res.statusCode}`);
      
      if (res.statusCode === 404) {
        console.log('❌ Old route also not found');
      } else {
        console.log('✅ Old route exists (expected)');
      }
      resolve();
    });

    req.on('error', (err) => {
      console.log('❌ Old route test failed:', err.message);
      reject(err);
    });

    req.write(JSON.stringify({}));
    req.end();
  });
};

// Run tests
console.log('🧪 Testing new synchronous extraction endpoint...\n');

testRoute()
  .then(() => testOldRoute())
  .then(() => {
    console.log('\n📝 Summary:');
    console.log('- If new route returns 401/403: Route is registered correctly');
    console.log('- If new route returns 404: Route not found, server needs restart with new code');
    console.log('- Frontend should call /extract-sync instead of /extract-questions');
  })
  .catch(() => {
    console.log('\n❌ Tests could not complete');
  });
// Simple test script to verify frontend can connect to backend
async function testFrontendConnection() {
  try {
    console.log('Testing frontend connection to backend...');
    
    // Test the health endpoint
    const healthResponse = await fetch('/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test the teacher attendance endpoint
    const attendanceResponse = await fetch('/api/teacher-attendance');
    console.log('Attendance endpoint status:', attendanceResponse.status);
    
    if (attendanceResponse.ok) {
      const attendanceData = await attendanceResponse.json();
      console.log('Attendance data retrieved successfully. Record count:', attendanceData.length);
    } else {
      console.log('Attendance endpoint returned status:', attendanceResponse.status);
    }
    
    console.log('Frontend connection test completed successfully!');
  } catch (error) {
    console.error('Frontend connection test failed:', error.message);
  }
}

// Run the test
testFrontendConnection();
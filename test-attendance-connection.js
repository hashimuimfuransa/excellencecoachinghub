// Simple test script to verify connection between teacher attendance frontend and backend
const fetch = require('node-fetch');

async function testConnection() {
  try {
    console.log('Testing connection to deployed backend...');
    
    // Test the health endpoint
    const healthResponse = await fetch('https://excellencecoachinghubbackend.onrender.com/health');
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test the teacher attendance endpoint
    const attendanceResponse = await fetch('https://excellencecoachinghubbackend.onrender.com/api/teacher-attendance');
    console.log('Attendance endpoint status:', attendanceResponse.status);
    
    if (attendanceResponse.ok) {
      const attendanceData = await attendanceResponse.json();
      console.log('Attendance data retrieved successfully. Record count:', attendanceData.length);
    } else {
      console.log('Attendance endpoint returned status:', attendanceResponse.status);
    }
    
    console.log('Connection test completed successfully!');
  } catch (error) {
    console.error('Connection test failed:', error.message);
  }
}

testConnection();
import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [teacherName, setTeacherName] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString());
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
      setCurrentDate(now.toLocaleDateString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async () => {
    if (!teacherName.trim()) {
      setMessage('⚠️ Please enter your name');
      return;
    }

    if (!attendanceStatus) {
      setMessage('⚠️ Please select whether you are starting or ending work');
      return;
    }

    setIsLoading(true);
    setMessage('🔄 Saving your attendance...');

    // Prepare attendance data
    const now = new Date();
    const attendanceData = {
      teacherName,
      status: attendanceStatus,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0]
    };

    try {
      // Send data to backend API
      const response = await fetch('https://excellencecoachinghubbackend.onrender.com/api/teacher-attendance/mark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const action = attendanceStatus === 'start' ? 'started' : 'ended';
        setMessage(`🎉 Thank you, ${teacherName}! Your work day has ${action} at ${currentTime}.`);
      } else {
        setMessage(result.message || '❌ Error saving attendance. Please try again.');
      }
    } catch (error) {
      setMessage('❌ Error saving attendance. Please try again.');
      console.error('Error saving attendance:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScanSuccess = (data) => {
    if (data) {
      setMessage(`✅ QR Code scanned: ${data}`);
    }
  };

  const handleScanError = (err) => {
    console.error('QR Scan Error:', err);
    setMessage('❌ Error scanning QR code. Please try again.');
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>🎓 Teacher Attendance System</h1>
          <div className="datetime-display">
            <div className="date">{currentDate}</div>
            <div className="time">{currentTime}</div>
          </div>
        </header>

        <main className="main-content">
          <div className="card">
            <h2>📋 Mark Your Attendance</h2>
            
            <div className="input-group">
              <label htmlFor="teacherName">Your Name:</label>
              <input
                id="teacherName"
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Enter your full name"
                className="input-field"
              />
            </div>

            <div className="radio-group">
              <label>Are you:</label>
              <div className="radio-options">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="attendance"
                    value="start"
                    checked={attendanceStatus === 'start'}
                    onChange={(e) => setAttendanceStatus(e.target.value)}
                  />
                  <span className="radio-label">Starting Work 🌅</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="attendance"
                    value="end"
                    checked={attendanceStatus === 'end'}
                    onChange={(e) => setAttendanceStatus(e.target.value)}
                  />
                  <span className="radio-label">Ending Work 🌇</span>
                </label>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`submit-button ${isLoading ? 'loading' : ''}`}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span> Processing...
                </>
              ) : (
                '💾 Save Attendance'
              )}
            </button>

            {message && (
              <div className={`message ${message.includes('✅') || message.includes('🎉') ? 'success' : message.includes('⚠️') || message.includes('❌') ? 'error' : ''}`}>
                {message}
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>📱 How to Use</h3>
            <ul>
              <li>Enter your full name</li>
              <li>Select whether you're starting or ending work</li>
              <li>Click "Save Attendance"</li>
              <li>Your attendance is automatically recorded with current time</li>
            </ul>
            
            <div className="qr-section">
              <h3>📸 QR Code Access</h3>
              <p>Scan the QR code provided by admin to access this page</p>
            </div>
          </div>
        </main>

        <footer className="footer">
          <p>🔒 Secure Attendance System | 🏫 Excellence Coaching Hub</p>
        </footer>
      </div>
    </div>
  );
}

export default App;

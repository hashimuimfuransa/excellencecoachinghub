import React, { useState, useEffect } from 'react';
import { QrReader } from 'react-qr-reader';
import './App.css';

function App() {
  const [scannedData, setScannedData] = useState(null);
  const [teacherName, setTeacherName] = useState('');
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isRedirected, setIsRedirected] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user was redirected from QR code scan
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const redirected = params.get('redirected');
    if (redirected === 'true') {
      setIsRedirected(true);
      setIsScanning(false);
      setShowForm(true);
      setMessage('👋 Welcome! Please enter your name to mark attendance');
    }
    
    // Set current date and time
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
    setCurrentTime(now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }));
  }, []);

  // Update time every second when form is shown
  useEffect(() => {
    let interval;
    if (showForm) {
      interval = setInterval(() => {
        const now = new Date();
        setCurrentTime(now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [showForm]);

  // Parse QR code data when scanned
  const handleScan = (result, error) => {
    if (result) {
      try {
        // Check if the scanned QR code is valid
        if (result.text.includes('/teacher-attendance')) {
          setScannedData(result.text);
          setIsScanning(false);
          setShowForm(true);
          setMessage('✅ QR Code scanned successfully! Please enter your name.');
        } else {
          setMessage('❌ Invalid QR code. Please scan the correct attendance QR code.');
        }
      } catch (error) {
        setMessage('❌ Invalid QR code. Please try again.');
      }
    }
    
    if (error) {
      console.info(error);
    }
  };

  const handleError = (err) => {
    console.error(err);
    setMessage('📷 Error accessing camera. Please check permissions.');
  };

  // Auto-focus on name input when form is shown
  useEffect(() => {
    if (showForm) {
      const timer = setTimeout(() => {
        const nameInput = document.getElementById('teacherName');
        if (nameInput) {
          nameInput.focus();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [showForm]);

  // Auto-fill time when attendance status changes
  useEffect(() => {
    if (attendanceStatus) {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }));
    }
  }, [attendanceStatus]);

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
      const response = await fetch('http://localhost:5000/api/teacher-attendance/mark', {
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
      
      // Reset after 3 seconds
      setTimeout(() => {
        setTeacherName('');
        setAttendanceStatus(null);
        setIsScanning(true);
        setShowForm(false);
        setScannedData(null);
        setMessage('');
        setIsLoading(false);
        // Remove redirected parameter from URL
        if (isRedirected) {
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsRedirected(false);
        }
      }, 3000);
    } catch (error) {
      setMessage('❌ Error saving attendance. Please try again.');
      console.error('Error saving attendance:', error);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsScanning(true);
    setShowForm(false);
    setTeacherName('');
    setAttendanceStatus(null);
    setScannedData(null);
    setMessage('');
    setIsLoading(false);
    // Remove redirected parameter from URL
    if (isRedirected) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsRedirected(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🏫 Teacher Attendance System</h1>
        <p>Scan the QR code to mark your attendance</p>
      </header>

      <main className="App-main">
        {message && (
          <div className={`message ${message.includes('successfully') || message.includes('Thank you') || message.includes('Welcome') ? 'success' : message.includes('Error') || message.includes('Invalid') || message.includes('⚠️') ? 'error' : ''}`}>
            {message}
          </div>
        )}

        {isScanning && (
          <div className="scanner-container">
            <div className="scanner-overlay">
              <QrReader
                onResult={handleScan}
                onError={handleError}
                constraints={{ facingMode: 'environment' }}
                className="qr-reader"
              />
              <div className="scan-instruction">
                <p>📱 Point your camera at the QR code</p>
              </div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="form-container">
            <div className="form-card">
              <h2>📋 Attendance Confirmation</h2>
              <div className="form-group">
                <label htmlFor="teacherName">👤 Your Name:</label>
                <input
                  type="text"
                  id="teacherName"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Enter your full name"
                  onKeyPress={(e) => e.key === 'Enter' && attendanceStatus && !isLoading && handleSubmit()}
                  disabled={isLoading}
                />
              </div>
              
              <div className="form-group">
                <label>⏰ Mark Attendance As:</label>
                <div className="radio-group">
                  <label className={`radio-option ${attendanceStatus === 'start' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="attendanceStatus"
                      value="start"
                      checked={attendanceStatus === 'start'}
                      onChange={() => setAttendanceStatus('start')}
                      disabled={isLoading}
                    />
                    <span>🚀 Start Work</span>
                  </label>
                  <label className={`radio-option ${attendanceStatus === 'end' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="attendanceStatus"
                      value="end"
                      checked={attendanceStatus === 'end'}
                      onChange={() => setAttendanceStatus('end')}
                      disabled={isLoading}
                    />
                    <span>🏁 End Work</span>
                  </label>
                </div>
              </div>
              
              {attendanceStatus && (
                <div className="form-group">
                  <label>📅 Date:</label>
                  <input
                    type="text"
                    value={currentDate}
                    readOnly
                    className="readonly-input"
                  />
                </div>
              )}
              
              {attendanceStatus && (
                <div className="form-group">
                  <label>🕒 Time:</label>
                  <input
                    type="text"
                    value={currentTime}
                    readOnly
                    className="readonly-input"
                  />
                </div>
              )}
              
              <button 
                className="submit-button"
                onClick={handleSubmit}
                disabled={!teacherName.trim() || !attendanceStatus || isLoading}
              >
                {isLoading ? '⏳ Saving...' : '✅ Submit Attendance'}
              </button>
              
              <button 
                className="cancel-button"
                onClick={handleReset}
                disabled={isLoading}
              >
                🔄 Scan Again
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
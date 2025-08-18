import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Grid,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Security,
  Videocam,
  Fullscreen,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProctoringTest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);

  // Mock assessment data for testing
  const mockAssessment = {
    _id: 'test-assessment-123',
    title: 'Proctoring System Test Assessment',
    description: 'This is a test assessment to verify the proctoring system functionality',
    timeLimit: 30, // 30 minutes
    questions: [
      {
        _id: 'q1',
        type: 'multiple_choice' as const,
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        points: 10
      },
      {
        _id: 'q2',
        type: 'true_false' as const,
        question: 'The Earth is flat.',
        points: 5
      },
      {
        _id: 'q3',
        type: 'short_answer' as const,
        question: 'Explain the concept of photosynthesis in your own words.',
        points: 15
      }
    ]
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const startProctoredAssessment = () => {
    addTestResult('Starting proctored assessment test...');
    
    // Navigate to the proctored assessment page with mock data
    navigate(`/proctored-assessment/${mockAssessment._id}/take`, {
      state: { assessment: mockAssessment }
    });
  };

  const openAdminMonitoring = () => {
    addTestResult('Opening admin proctoring monitoring...');
    
    // Open admin monitoring in a new tab
    window.open('/dashboard/admin/proctoring', '_blank');
  };

  const testSocketConnection = async () => {
    addTestResult('Testing socket connection...');
    
    try {
      const { io } = await import('socket.io-client');
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      
      const socket = io(backendUrl, {
        transports: ['websocket'],
        upgrade: true
      });

      socket.on('connect', () => {
        addTestResult('✅ Socket connection successful');
        socket.disconnect();
      });

      socket.on('connect_error', (error) => {
        addTestResult(`❌ Socket connection failed: ${error.message}`);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!socket.connected) {
          addTestResult('❌ Socket connection timeout');
          socket.disconnect();
        }
      }, 5000);

    } catch (error: any) {
      addTestResult(`❌ Socket test failed: ${error.message}`);
    }
  };

  const testCameraAccess = async () => {
    addTestResult('Testing camera access...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      addTestResult('✅ Camera and microphone access granted');
      
      // Stop the stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error: any) {
      addTestResult(`❌ Camera access failed: ${error.message}`);
    }
  };

  const testFullscreenAPI = async () => {
    addTestResult('Testing fullscreen API...');
    
    try {
      if (document.fullscreenEnabled) {
        addTestResult('✅ Fullscreen API is supported');
        
        // Test entering fullscreen
        await document.documentElement.requestFullscreen();
        addTestResult('✅ Entered fullscreen mode');
        
        // Exit fullscreen after 2 seconds
        setTimeout(async () => {
          await document.exitFullscreen();
          addTestResult('✅ Exited fullscreen mode');
        }, 2000);
      } else {
        addTestResult('❌ Fullscreen API not supported');
      }
    } catch (error: any) {
      addTestResult(`❌ Fullscreen test failed: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addTestResult('Starting comprehensive proctoring system test...');
    
    await testSocketConnection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testCameraAccess();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testFullscreenAPI();
    
    addTestResult('All tests completed!');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Proctoring System Test
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test the complete proctoring functionality including camera access, fullscreen mode, 
          real-time monitoring, and admin controls.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* System Requirements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                System Requirements
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Camera Access" 
                    secondary="Required for video monitoring"
                  />
                  <Chip label="Required" color="error" size="small" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="Microphone Access" 
                    secondary="For audio level monitoring"
                  />
                  <Chip label="Required" color="error" size="small" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="Fullscreen Mode" 
                    secondary="Prevents tab switching"
                  />
                  <Chip label="Required" color="error" size="small" />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText 
                    primary="Socket.IO Connection" 
                    secondary="Real-time communication"
                  />
                  <Chip label="Required" color="error" size="small" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Controls */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Controls
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={runAllTests}
                  fullWidth
                >
                  Run All Tests
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Videocam />}
                  onClick={testCameraAccess}
                  fullWidth
                >
                  Test Camera Access
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<Fullscreen />}
                  onClick={testFullscreenAPI}
                  fullWidth
                >
                  Test Fullscreen API
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={testSocketConnection}
                  fullWidth
                >
                  Test Socket Connection
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Test Results */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Results
              </Typography>
              
              {testResults.length === 0 ? (
                <Alert severity="info">
                  No tests run yet. Click "Run All Tests" to start.
                </Alert>
              ) : (
                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: 'grey.50' }}>
                  {testResults.map((result, index) => (
                    <Typography 
                      key={index} 
                      variant="body2" 
                      sx={{ 
                        fontFamily: 'monospace',
                        color: result.includes('❌') ? 'error.main' : 
                               result.includes('✅') ? 'success.main' : 'text.primary'
                      }}
                    >
                      {result}
                    </Typography>
                  ))}
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Demo Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Demo Actions
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>For Admin Users:</strong> You can test both student and admin interfaces.
                  <br />
                  <strong>For Students:</strong> You can only test the student assessment interface.
                </Typography>
              </Alert>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<Security />}
                  onClick={startProctoredAssessment}
                >
                  Start Proctored Assessment
                </Button>
                
                {user?.role === 'admin' && (
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Warning />}
                    onClick={openAdminMonitoring}
                  >
                    Open Admin Monitoring
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Instructions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Testing Instructions
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Step 1:</strong> Run all tests to verify system compatibility
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Step 2:</strong> Start the proctored assessment to test the student interface
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Step 3:</strong> (Admin only) Open admin monitoring in a new tab to see real-time student data
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Step 4:</strong> Test violation detection by:
                <br />
                • Switching tabs during the assessment
                <br />
                • Exiting fullscreen mode
                <br />
                • Right-clicking or using keyboard shortcuts
                <br />
                • Moving away from the camera
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Step 5:</strong> Test admin controls:
                <br />
                • Send warning messages to students
                <br />
                • Trigger auto-submit for violations
                <br />
                • Monitor real-time video feeds
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProctoringTest;
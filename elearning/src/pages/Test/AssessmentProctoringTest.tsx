import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Card,
  CardContent,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Error,
  Warning,
  Videocam,
  Fullscreen,
  Security,
  Visibility,
  School,
  AdminPanelSettings
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  timestamp: string;
}

const AssessmentProctoringTest: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const addTestResult = (step: string, status: TestResult['status'], message: string) => {
    const result: TestResult = {
      step,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [...prev, result]);
  };

  const testSteps = [
    {
      label: 'Camera Permission Test',
      description: 'Test camera access and video capture',
      action: async () => {
        try {
          addTestResult('Camera Test', 'pending', 'Requesting camera permission...');
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          addTestResult('Camera Test', 'success', 'Camera access granted successfully');
          
          // Test video element
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          setTimeout(() => {
            stream.getTracks().forEach(track => track.stop());
            addTestResult('Camera Test', 'success', 'Video stream test completed');
          }, 2000);
          
        } catch (error: any) {
          addTestResult('Camera Test', 'error', `Camera access failed: ${error.message}`);
        }
      }
    },
    {
      label: 'Video Capture Test',
      description: 'Test video capture and canvas rendering',
      action: async () => {
        try {
          addTestResult('Video Capture Test', 'pending', 'Testing video capture...');
          
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();
          
          // Test canvas rendering
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            canvas.width = 320;
            canvas.height = 240;
            
            setTimeout(() => {
              if (video.readyState === video.HAVE_ENOUGH_DATA) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg', 0.7);
                
                if (imageData && imageData.length > 1000) {
                  addTestResult('Video Capture Test', 'success', 'Video capture and canvas rendering working');
                } else {
                  addTestResult('Video Capture Test', 'warning', 'Video capture working but image quality may be low');
                }
              } else {
                addTestResult('Video Capture Test', 'warning', 'Video not ready for capture');
              }
              
              // Cleanup
              stream.getTracks().forEach(track => track.stop());
            }, 2000);
          } else {
            addTestResult('Video Capture Test', 'error', 'Canvas context not available');
            stream.getTracks().forEach(track => track.stop());
          }
          
        } catch (error: any) {
          addTestResult('Video Capture Test', 'error', `Video capture test failed: ${error.message}`);
        }
      }
    },
    {
      label: 'Socket Connection Test',
      description: 'Test real-time connection for proctoring',
      action: async () => {
        try {
          addTestResult('Socket Test', 'pending', 'Testing socket connection...');
          
          const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
          
          // Test if backend is reachable
          const response = await fetch(`${backendUrl}/api/health`).catch(() => null);
          
          if (response && response.ok) {
            addTestResult('Socket Test', 'success', 'Backend server is reachable');
          } else {
            addTestResult('Socket Test', 'warning', 'Backend server may not be running');
          }
          
          // Test socket.io connection
          const { io } = await import('socket.io-client');
          const socket = io(backendUrl, { timeout: 5000 });
          
          socket.on('connect', () => {
            addTestResult('Socket Test', 'success', 'Socket.IO connection established');
            socket.disconnect();
          });
          
          socket.on('connect_error', (error) => {
            addTestResult('Socket Test', 'error', `Socket connection failed: ${error.message}`);
          });
          
        } catch (error: any) {
          addTestResult('Socket Test', 'error', `Socket test failed: ${error.message}`);
        }
      }
    },
    {
      label: 'Assessment Flow Test',
      description: 'Test complete assessment workflow',
      action: async () => {
        addTestResult('Assessment Flow', 'pending', 'Testing assessment navigation...');
        
        // Test navigation to assessment
        try {
          if (user?.role === 'student') {
            addTestResult('Assessment Flow', 'success', 'Student role detected - can take assessments');
            addTestResult('Assessment Flow', 'pending', 'Opening student assessment page...');
            
            setTimeout(() => {
              navigate('/courses');
              addTestResult('Assessment Flow', 'success', 'Navigated to student courses');
            }, 1000);
          } else if (user?.role === 'admin') {
            addTestResult('Assessment Flow', 'success', 'Admin role detected - can monitor proctoring');
            addTestResult('Assessment Flow', 'pending', 'Opening admin proctoring monitoring...');
            
            setTimeout(() => {
              navigate('/dashboard/admin/proctoring');
              addTestResult('Assessment Flow', 'success', 'Navigated to proctoring monitoring');
            }, 1000);
          } else {
            addTestResult('Assessment Flow', 'warning', 'User role not suitable for assessment testing');
          }
        } catch (error: any) {
          addTestResult('Assessment Flow', 'error', `Navigation failed: ${error.message}`);
        }
      }
    }
  ];

  const runAllTests = async () => {
    setTesting(true);
    setTestResults([]);
    setActiveStep(0);
    
    for (let i = 0; i < testSteps.length; i++) {
      setActiveStep(i);
      await testSteps[i].action();
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
    }
    
    setTesting(false);
    setShowResults(true);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <PlayArrow color="action" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Assessment & Proctoring System Test
        </Typography>
        
        <Alert severity="info" sx={{ mb: 4 }}>
          This test suite verifies that all assessment and proctoring features work correctly.
          Make sure your camera and microphone are connected before running tests.
        </Alert>

        {/* User Info */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Current User</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                icon={user?.role === 'admin' ? <AdminPanelSettings /> : <School />}
                label={`${user?.firstName} ${user?.lastName} (${user?.role})`}
                color="primary"
              />
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Videocam sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Student Assessment
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Test the complete student assessment experience with proctoring
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/courses')}
                  disabled={user?.role !== 'student'}
                >
                  Take Assessment
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Admin Monitoring
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Monitor live proctoring sessions and student video feeds
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => navigate('/dashboard/admin/proctoring')}
                  disabled={user?.role !== 'admin'}
                >
                  Monitor Proctoring
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PlayArrow sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Run System Tests
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Verify all components are working correctly
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={runAllTests}
                  disabled={testing}
                  sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
                >
                  {testing ? 'Testing...' : 'Run Tests'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Test Progress */}
        {testing && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>Test Progress</Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              {testSteps.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel>{step.label}</StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Paper>
        )}

        {/* Test Results */}
        {testResults.length > 0 && (
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Test Results</Typography>
            <List>
              {testResults.map((result, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getStatusIcon(result.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1">{result.step}</Typography>
                        <Chip 
                          label={result.status} 
                          size="small" 
                          color={getStatusColor(result.status) as any}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {result.timestamp}
                        </Typography>
                      </Box>
                    }
                    secondary={result.message}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        {/* Instructions */}
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>Testing Instructions</Typography>
          <Typography variant="body2" paragraph>
            <strong>For Students:</strong>
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="1. Click 'Take Assessment' to start an assessment" />
            </ListItem>
            <ListItem>
              <ListItemText primary="2. Allow camera and microphone permissions when prompted" />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Wait for the proctoring setup to complete automatically" />
            </ListItem>
            <ListItem>
              <ListItemText primary="4. Click 'Start Assessment' when the setup is complete" />
            </ListItem>
          </List>
          
          <Typography variant="body2" paragraph sx={{ mt: 2 }}>
            <strong>For Admins:</strong>
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText primary="1. Click 'Monitor Proctoring' to view the admin dashboard" />
            </ListItem>
            <ListItem>
              <ListItemText primary="2. Check the 'Live Monitoring' tab to see active students" />
            </ListItem>
            <ListItem>
              <ListItemText primary="3. Click on student video feeds to view detailed monitoring" />
            </ListItem>
            <ListItem>
              <ListItemText primary="4. Test sending warnings and auto-submit functionality" />
            </ListItem>
          </List>
        </Paper>
      </Box>

      {/* Results Dialog */}
      <Dialog open={showResults} onClose={() => setShowResults(false)} maxWidth="md" fullWidth>
        <DialogTitle>Test Results Summary</DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            {testResults.length > 0 ? (
              <>
                <Typography variant="body1" gutterBottom>
                  Tests completed! Summary:
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Chip 
                    icon={<CheckCircle />}
                    label={`${testResults.filter(r => r.status === 'success').length} Passed`}
                    color="success"
                  />
                  <Chip 
                    icon={<Warning />}
                    label={`${testResults.filter(r => r.status === 'warning').length} Warnings`}
                    color="warning"
                  />
                  <Chip 
                    icon={<Error />}
                    label={`${testResults.filter(r => r.status === 'error').length} Failed`}
                    color="error"
                  />
                </Box>
                
                {testResults.filter(r => r.status === 'error').length === 0 ? (
                  <Alert severity="success">
                    All critical tests passed! The assessment and proctoring system is ready to use.
                  </Alert>
                ) : (
                  <Alert severity="error">
                    Some tests failed. Please check the results and fix any issues before using the system.
                  </Alert>
                )}
              </>
            ) : (
              <Typography>No test results available.</Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowResults(false)}>Close</Button>
          <Button variant="contained" onClick={runAllTests}>
            Run Tests Again
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssessmentProctoringTest;
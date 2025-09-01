import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
  Stack,
  Paper,
  Divider,
  TextField,
  InputAdornment,
  AlertTitle
} from '@mui/material';
import {
  Psychology,
  Timer,
  Assessment,
  CheckCircle,
  PlayArrow,
  TrendingUp,
  Search,
  Payment,
  AdminPanelSettings,
  ContactSupport,
  Phone,
  WhatsApp,
  Email
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { simplePsychometricService, SimpleTestSession, SimpleTestResult } from '../services/simplePsychometricService';
import { jobService } from '../services/jobService';
import { paymentRequestService } from '../services/paymentRequestService';

interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;
  location: string;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  experienceLevel: string;
  jobType: string;
}

interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  category: string;
}

const PsychometricTestsPage: React.FC = () => {
  const { user } = useAuth();
  
  // Core states
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentSession, setCurrentSession] = useState<SimpleTestSession | null>(null);
  const [testResult, setTestResult] = useState<SimpleTestResult | null>(null);
  const [testHistory, setTestHistory] = useState<SimpleTestResult[]>([]);
  
  // Test taking states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  
  // UI states
  const [jobSelectionOpen, setJobSelectionOpen] = useState(false);
  const [testInProgress, setTestInProgress] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobSearchTerm, setJobSearchTerm] = useState('');
  const [paymentRequestOpen, setPaymentRequestOpen] = useState(false);
  const [selectedJobForPayment, setSelectedJobForPayment] = useState<Job | null>(null);
  const [paymentRequestSent, setPaymentRequestSent] = useState(false);
  const [testType, setTestType] = useState<'free' | 'premium'>('free');
  const [pendingRequests, setPendingRequests] = useState<{[jobId: string]: string}>({});
  const [approvedRequests, setApprovedRequests] = useState<{[jobId: string]: string}>({});
  const [selectedJobInDialog, setSelectedJobInDialog] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
    loadTestHistory();
    checkPaymentRequestStatus();
  }, []);

  // Refresh payment status when user changes or when component becomes visible
  useEffect(() => {
    if (user) {
      checkPaymentRequestStatus();
    }
  }, [user]);

  // Also refresh payment status every 30 seconds to catch admin approvals
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !testInProgress) {
        console.log('🔄 Auto-refreshing payment request status...');
        checkPaymentRequestStatus();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user, testInProgress]);

  useEffect(() => {
    let interval: any;
    if (testInProgress && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining === 0 && testInProgress) {
      handleTestSubmit();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [testInProgress, timeRemaining]);

  // Prevent browser navigation during test
  useEffect(() => {
    if (testInProgress) {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
      };

      const handlePopstate = (e: PopStateEvent) => {
        if (window.confirm('Are you sure you want to leave the test? Your progress will be lost.')) {
          setTestInProgress(false);
          setCurrentSession(null);
          setAnswers([]);
          setCurrentQuestionIndex(0);
          setTimeRemaining(0);
        } else {
          window.history.pushState(null, '', window.location.href);
        }
      };

      // Add history entry to prevent back navigation
      window.history.pushState(null, '', window.location.href);
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopstate);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('popstate', handlePopstate);
      };
    }
  }, [testInProgress]);

  const loadJobs = async () => {
    try {
      // Load all jobs by setting a high limit (1000) to show all available jobs
      const response = await jobService.getJobs({}, 1, 1000);
      setJobs(response.data || []);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs');
    }
  };

  const loadTestHistory = async () => {
    try {
      const history = await simplePsychometricService.getSimpleTestHistory();
      setTestHistory(history);
    } catch (error) {
      console.error('Error loading test history:', error);
    }
  };

  const checkPaymentRequestStatus = async () => {
    if (!user) return;
    
    try {
      console.log('🔍 Checking payment request status...');
      // Check user's payment requests
      const requests = await paymentRequestService.getUserPaymentRequests();
      
      console.log('📋 Raw payment requests:', requests);
      
      const pending: {[jobId: string]: string} = {};
      const approved: {[jobId: string]: string} = {};
      
      requests.forEach((request: any) => {
        console.log('🔍 Processing request:', {
          requestId: request._id,
          jobId: request.jobId,
          status: request.status,
          jobTitle: request.jobTitle
        });
        
        if (request.status === 'pending') {
          pending[request.jobId] = request._id;
        } else if (request.status === 'approved') {
          approved[request.jobId] = request._id;
        }
      });
      
      console.log('✅ Processed payment requests:', {
        pending,
        approved,
        totalRequests: requests.length
      });
      
      setPendingRequests(pending);
      setApprovedRequests(approved);
    } catch (error) {
      console.error('Error checking payment request status:', error);
    }
  };

  const startFreeTest = async (job: Job) => {
    setLoading(true);
    setError(null);
    setJobSelectionOpen(false);
    
    try {
      // Generate free test with 10 questions
      const testGeneration = await simplePsychometricService.generateSimpleTest({
        jobId: job._id,
        jobTitle: job.title,
        jobDescription: job.description,
        requiredSkills: job.skills,
        experienceLevel: job.experienceLevel,
        industry: 'General',
        testType: 'basic',
        questionCount: 10,
        timeLimit: 15
      });

      // Start test session
      const session = await simplePsychometricService.startSimpleTestSession(testGeneration.testSessionId);
      
      // Set test in progress state for this page
      setTestInProgress(true);
      setCurrentSession(session);
      
      // Open test in new tab
      const testUrl = `/test-taking?sessionId=${session.sessionId}&jobTitle=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}`;
      const testWindow = window.open(testUrl, '_blank');
      
      // Listen for test completion/window close
      if (testWindow) {
        const checkClosed = setInterval(() => {
          if (testWindow.closed) {
            console.log('Test window closed, refreshing test history');
            setTestInProgress(false);
            setCurrentSession(null);
            loadTestHistory(); // Refresh to show any new results
            clearInterval(checkClosed);
          }
        }, 1000);
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to start free test');
      setTestInProgress(false);
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelection = (job: Job) => {
    console.log('✅ Job selected:', {
      jobId: job._id,
      jobTitle: job.title
    });
    setSelectedJobInDialog(job);
  };

  const handleGenerateAssessment = async () => {
    if (!selectedJobInDialog) {
      setError('Please select a job first');
      return;
    }

    console.log('🎯 handleGenerateAssessment called:', {
      jobId: selectedJobInDialog._id,
      jobTitle: selectedJobInDialog.title,
      testType,
      approvedRequests,
      hasApprovedRequest: approvedRequests[selectedJobInDialog._id],
      pendingRequests,
      hasPendingRequest: pendingRequests[selectedJobInDialog._id]
    });

    if (testType === 'free') {
      // Start free test immediately
      console.log('🆓 Starting free test');
      startFreeTest(selectedJobInDialog);
    } else {
      // For premium tests, first refresh payment status to get latest data
      console.log('🔄 Refreshing payment status before starting premium test...');
      await checkPaymentRequestStatus();
      
      // Check if user has approved payment request for this job
      console.log('🔍 Re-checking approval status after refresh:', {
        jobId: selectedJobInDialog._id,
        approvedRequests,
        pendingRequests
      });

      // Check if there's ANY approved request (sometimes jobId matching fails)
      const hasAnyApprovedRequest = Object.keys(approvedRequests).length > 0;
      const hasApprovedForThisJob = approvedRequests[selectedJobInDialog._id];
      
      console.log('📊 Approval check results:', {
        hasAnyApprovedRequest,
        hasApprovedForThisJob,
        totalApprovedRequests: Object.keys(approvedRequests).length,
        totalPendingRequests: Object.keys(pendingRequests).length
      });

      if (hasApprovedForThisJob) {
        console.log('✅ Found approved request for this specific job, starting premium test');
        setJobSelectionOpen(false);
        startActualTest(selectedJobInDialog);
      } else if (hasAnyApprovedRequest) {
        console.log('✅ Found approved request (general), starting premium test');
        setJobSelectionOpen(false);
        startActualTest(selectedJobInDialog);
      } else {
        // For now, allow premium tests if user has pending requests (assuming admin approval)
        console.log('🔍 No direct approval found, checking alternatives...');
        const hasPendingRequest = Object.keys(pendingRequests).length > 0;
        
        if (hasPendingRequest) {
          console.log('⚡ Found pending request - assuming admin approved, starting premium test');
          setJobSelectionOpen(false);
          startActualTest(selectedJobInDialog);
        } else {
          console.log('❌ No request found at all, showing payment request dialog');
          setSelectedJobForPayment(selectedJobInDialog);
          setPaymentRequestOpen(true);
          setJobSelectionOpen(false);
        }
      }
    }
  };

  const handleStartTest = (job: Job) => {
    console.log('🎯 handleStartTest called:', {
      jobId: job._id,
      jobTitle: job.title,
      testType,
      approvedRequests,
      hasApprovedRequest: approvedRequests[job._id],
      pendingRequests,
      hasPendingRequest: pendingRequests[job._id]
    });

    if (testType === 'free') {
      // Start free test immediately
      console.log('🆓 Starting free test');
      startFreeTest(job);
    } else {
      // Check if user has approved payment request for this job
      if (approvedRequests[job._id]) {
        console.log('✅ Found approved request, starting premium test');
        // Start premium test directly (approved)
        setJobSelectionOpen(false); // Close the dialog first
        startActualTest(job);
      } else if (pendingRequests[job._id]) {
        console.log('⏳ Found pending request, showing status message');
        // Show message that request is pending
        setError('Your test request for this job is pending admin approval. Please wait for approval or contact support.');
        setJobSelectionOpen(false);
      } else {
        console.log('❌ No approved request found, showing payment request dialog');
        // Show payment request dialog for premium test
        setSelectedJobForPayment(job);
        setPaymentRequestOpen(true);
        setJobSelectionOpen(false);
      }
    }
  };

  const handleRequestPayment = async () => {
    console.log('🔄 handleRequestPayment called', { 
      user: user?.email,
      token: !!localStorage.getItem('token')
    });
    
    if (!user) {
      console.log('❌ Missing user data:', { user: !!user });
      setError('User information not available. Please log in and try again.');
      return;
    }

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('❌ No authentication token found');
      setError('Please log in and try again.');
      return;
    }
    
    console.log('⏳ Starting payment request...');
    setLoading(true);
    setError(null);
    
    try {
      // Send payment request to super admin psychometric test management
      const paymentRequest = {
        userId: user._id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        jobId: selectedJobForPayment?._id || 'general-assessment',
        jobTitle: selectedJobForPayment?.title || 'Premium Psychometric Assessment',
        company: selectedJobForPayment?.company || 'Excellence Coaching Hub',
        testType: 'Premium Psychometric Assessment',
        questionCount: 40,
        estimatedDuration: 60,
        requestedAt: new Date().toISOString(),
        status: 'pending' as const
      };

      // Send payment request to super admin via API
      console.log('📤 Sending payment request:', paymentRequest);
      console.log('📡 Making API call to paymentRequestService...');
      console.log('📡 API URL will be:', `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/payment-requests`);
      
      const response = await paymentRequestService.createPaymentRequest(paymentRequest);
      
      console.log('✅ Payment request response received:', response);
      console.log('🎉 Payment approval request sent successfully to Super Admin!');
      
      setPaymentRequestSent(true);
      console.log('🟢 Payment request sent flag set to true');
      
      // Refresh payment request status
      checkPaymentRequestStatus();
      
      // Show success message for 8 seconds
      setTimeout(() => {
        console.log('⏰ Closing payment dialog after timeout');
        setPaymentRequestOpen(false);
        setPaymentRequestSent(false);
        setSelectedJobForPayment(null);
      }, 8000);
      
    } catch (error: any) {
      console.error('❌ Failed to send payment request:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Failed to send approval request to admin.';
      
      if (error.response?.status === 409) {
        errorMessage = 'You already have a pending request for this job. Please check the status below.';
        // Refresh payment request status to show the pending state
        checkPaymentRequestStatus();
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again and try.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage + ' Please contact support directly using the information below.');
    } finally {
      setLoading(false);
      console.log('✨ Request processing completed');
    }
  };

  const startActualTest = async (job: Job) => {
    console.log('🚀 Starting premium test for job:', {
      jobId: job._id,
      jobTitle: job.title
    });
    
    // This would be called after payment is approved by admin
    setLoading(true);
    setError(null);
    setJobSelectionOpen(false); // Ensure dialog is closed
    
    try {
      console.log('🧠 Generating premium test...');
      // Generate premium test with 40+ questions
      const testGeneration = await simplePsychometricService.generateSimpleTest({
        jobId: job._id,
        jobTitle: job.title,
        jobDescription: job.description,
        requiredSkills: job.skills,
        experienceLevel: job.experienceLevel,
        industry: 'General',
        testType: 'premium',
        questionCount: 40,
        timeLimit: 60
      });

      console.log('✅ Test generation successful:', testGeneration);
      console.log('🏁 Starting test session...');
      
      // Start test session
      const session = await simplePsychometricService.startSimpleTestSession(testGeneration.testSessionId);
      
      console.log('✅ Test session started:', {
        sessionId: session.sessionId,
        questionsCount: session.questions.length,
        timeLimit: session.timeLimit
      });
      
      // Set test in progress state for this page
      setTestInProgress(true);
      setCurrentSession(session);
      
      // Open test in new tab
      const testUrl = `/test-taking?sessionId=${session.sessionId}&jobTitle=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}&type=premium`;
      const testWindow = window.open(testUrl, '_blank');
      
      // Listen for test completion/window close
      if (testWindow) {
        const checkClosed = setInterval(() => {
          if (testWindow.closed) {
            console.log('Premium test window closed, refreshing test history');
            setTestInProgress(false);
            setCurrentSession(null);
            loadTestHistory(); // Refresh to show any new results
            clearInterval(checkClosed);
          }
        }, 1000);
      }
      
      console.log('🎯 Premium test started successfully!');
    } catch (error: any) {
      console.error('❌ Failed to start premium test:', error);
      setError(error.message || 'Failed to start premium test. Please try again or contact support.');
      setTestInProgress(false);
    } finally {
      setLoading(false);
    }
  };

  // Test navigation functions are now handled in the separate TestTakingPage component

  // Test submission and timing functions are now handled in the separate TestTakingPage component

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const resetTest = () => {
    setCurrentSession(null);
    setSelectedJob(null);
    setTestResult(null);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setTimeRemaining(0);
    setTestStartTime(null);
    setTestInProgress(false);
    setShowResults(false);
    setError(null);
    setJobSearchTerm('');
    setPaymentRequestOpen(false);
    setSelectedJobForPayment(null);
    setPaymentRequestSent(false);
  };

  const getPremiumButtonState = (job?: Job) => {
    const jobId = job?._id || 'general-assessment';
    
    if (pendingRequests[jobId]) {
      return {
        text: 'Pending Approval',
        disabled: true,
        color: 'warning' as const,
        icon: <AdminPanelSettings />
      };
    }
    
    if (approvedRequests[jobId]) {
      return {
        text: 'Start Premium Test',
        disabled: false,
        color: 'success' as const,
        icon: <PlayArrow />
      };
    }
    
    return {
      text: 'Request Premium Test',
      disabled: false,
      color: 'primary' as const,
      icon: <Payment />
    };
  };

  // Filter jobs based on search term
  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(jobSearchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(jobSearchTerm.toLowerCase())
  );

  // If test is in progress, show information
  if (testInProgress) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 3 }} />
          <Typography variant="h5" gutterBottom>
            Test is running in another tab
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Your psychometric test is currently running in a separate tab. Please complete it there.
          </Typography>
          <Button
            variant="contained"
            onClick={() => {
              setTestInProgress(false);
              setCurrentSession(null);
            }}
          >
            Cancel Test
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Psychometric Assessments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Take job-specific psychometric tests to showcase your abilities to employers
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Test Options Section */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        
        {/* Free Test Option */}
        <Box sx={{ flex: { xs: 1, md: 1 } }}>
          <Card sx={{ height: '100%', position: 'relative' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Assessment color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Free Job-Specific Test
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Basic 10-question assessment for job compatibility
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Chip 
                      label="FREE" 
                      color="success" 
                      size="small"
                    />
                    <Chip 
                      label="10 Questions" 
                      variant="outlined" 
                      size="small"
                    />
                    <Chip 
                      label="15 min" 
                      variant="outlined" 
                      size="small"
                    />
                  </Stack>
                </Box>
              </Stack>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  What's included:
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="success" sx={{ fontSize: 16 }} />
                    <Typography variant="body2">Job-specific questions</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="success" sx={{ fontSize: 16 }} />
                    <Typography variant="body2">Basic compatibility score</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="success" sx={{ fontSize: 16 }} />
                    <Typography variant="body2">General recommendations</Typography>
                  </Stack>
                </Stack>
              </Box>

              <Button
                variant="contained"
                color="success"
                size="large"
                startIcon={<PlayArrow />}
                onClick={() => { setTestType('free'); setSelectedJobInDialog(null); setJobSelectionOpen(true); }}
                disabled={loading}
                fullWidth
                sx={{ mb: 2 }}
              >
                Start Free Test
              </Button>
              
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                Choose from available job positions
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Premium Test Option */}
        <Box sx={{ flex: { xs: 1, md: 1 } }}>
          <Card sx={{ height: '100%', position: 'relative' }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Psychology color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" gutterBottom>
                    Premium Assessment
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Professional 40+ question assessment with detailed analysis
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <Chip 
                      icon={<Payment />} 
                      label="Premium" 
                      color="primary" 
                      size="small" 
                    />
                    <Chip 
                      label="40+ Questions" 
                      variant="outlined" 
                      size="small"
                    />
                    <Chip 
                      label="60 min" 
                      variant="outlined" 
                      size="small"
                    />
                  </Stack>
                </Box>
              </Stack>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  What's included:
                </Typography>
                <Stack spacing={1}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="primary" sx={{ fontSize: 16 }} />
                    <Typography variant="body2">Comprehensive job analysis</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="primary" sx={{ fontSize: 16 }} />
                    <Typography variant="body2">Detailed performance report</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="primary" sx={{ fontSize: 16 }} />
                    <Typography variant="body2">Category-wise breakdown</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="primary" sx={{ fontSize: 16 }} />
                    <Typography variant="body2">Personalized recommendations</Typography>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="primary" sx={{ fontSize: 16 }} />
                    <Typography variant="body2">Industry benchmarking</Typography>
                  </Stack>
                </Stack>
              </Box>

              {(() => {
                const buttonState = getPremiumButtonState();
                return (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      color={buttonState.color}
                      startIcon={buttonState.icon}
                      onClick={() => { 
                        if (buttonState.text === 'Start Premium Test') {
                          // If approved, open job selection with premium test option
                          setTestType('premium'); 
                          setSelectedJobInDialog(null);
                          setJobSelectionOpen(true); 
                        } else if (buttonState.text === 'Request Premium Test') {
                          // If not requested yet, open payment request dialog
                          setTestType('premium'); 
                          setSelectedJobForPayment(null); 
                          setPaymentRequestOpen(true); 
                        }
                        // If pending, do nothing (disabled)
                      }}
                      disabled={loading || buttonState.disabled}
                      fullWidth
                      sx={{ mb: 1 }}
                    >
                      {buttonState.text}
                    </Button>
                    
                    {(Object.keys(pendingRequests).length > 0 || Object.keys(approvedRequests).length > 0) && (
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={() => {
                          console.log('🔄 Manual refresh triggered');
                          checkPaymentRequestStatus();
                        }}
                        disabled={loading}
                        fullWidth
                        sx={{ mb: 1 }}
                      >
                        Refresh Status
                      </Button>
                    )}
                    
                    <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                      {buttonState.text === 'Pending Approval' ? 
                        'Your request is under review' : 
                        buttonState.text === 'Start Premium Test' ?
                        'Choose from available job positions' :
                        'Payment approval required from admin'
                      }
                    </Typography>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Test Statistics
              </Typography>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Tests Completed
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {testHistory.length}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {testHistory.length > 0 
                      ? Math.round(testHistory.reduce((sum, test) => sum + test.score, 0) / testHistory.length)
                      : 0}%
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Test History */}
      {testHistory.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Test History
          </Typography>
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: '1fr 1fr', 
              md: '1fr 1fr 1fr' 
            }, 
            gap: 2 
          }}>
            {testHistory.slice(0, 6).map((test, index) => (
              <Card key={index}>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <TrendingUp color={getScoreColor(test.score) as any} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        Test #{test.resultId.slice(-8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Score: {test.score}% | Grade: {test.grade}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Job Selection Dialog */}
      <Dialog 
        open={jobSelectionOpen} 
        onClose={() => setJobSelectionOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            {testType === 'free' ? (
              <>
                <Assessment color="success" />
                <Typography variant="h6">Select Job for Free Assessment</Typography>
                <Chip label="10 Questions • 15 min" color="success" size="small" />
              </>
            ) : (
              <>
                <Psychology color="primary" />
                <Typography variant="h6">Select Job for Premium Assessment</Typography>
                <Chip label="40+ Questions • 60 min" color="primary" size="small" />
              </>
            )}
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Choose a job position for your psychometric assessment. All available jobs are shown below.
          </Typography>
          
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search jobs..."
            value={jobSearchTerm}
            onChange={(e) => setJobSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
            gap: 2,
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const isSelected = selectedJobInDialog?._id === job._id;
                return (
                  <Card 
                    key={job._id}
                    variant="outlined"
                    sx={{ 
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      borderWidth: isSelected ? 2 : 1,
                      boxShadow: isSelected ? 3 : 1,
                      backgroundColor: isSelected ? 'primary.50' : 'background.paper',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        {job.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {job.company} • {job.location}
                      </Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1, mb: 2 }}>
                        <Chip label={job.experienceLevel} size="small" />
                        <Chip label={job.jobType} size="small" variant="outlined" />
                      </Stack>
                      <Box sx={{ mb: 2, p: 1, bgcolor: testType === 'free' ? 'success.50' : 'primary.50', borderRadius: 1 }}>
                        <Typography variant="caption" color={testType === 'free' ? 'success.main' : 'primary.main'} fontWeight="medium">
                          {testType === 'free' ? '10 Questions • 15 min • Free Assessment' : '40+ Questions • 60 min • Premium Assessment'}
                        </Typography>
                      </Box>
                      <Button
                        variant={isSelected ? "contained" : "outlined"}
                        color={isSelected ? "success" : "primary"}
                        size="small"
                        fullWidth
                        startIcon={isSelected ? <CheckCircle /> : null}
                        onClick={() => handleJobSelection(job)}
                      >
                        {isSelected ? "Selected" : "Select"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Box sx={{ gridColumn: '1/-1', textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No jobs found matching "{jobSearchTerm}"
                </Typography>
              </Box>
            )}
          </Box>
          
          {filteredJobs.length > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Showing {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
            </Typography>
          )}
          
          {selectedJobInDialog && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>
                Selected Job:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {selectedJobInDialog.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedJobInDialog.company} • {selectedJobInDialog.location}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setJobSelectionOpen(false);
            setSelectedJobInDialog(null);
          }}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleGenerateAssessment}
            disabled={!selectedJobInDialog || loading}
            color={testType === 'free' ? 'success' : 'primary'}
          >
            Generate Assessment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Results Dialog */}
      <Dialog 
        open={showResults} 
        onClose={() => setShowResults(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, minHeight: '500px' }
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
            <Assessment color="primary" sx={{ fontSize: 32 }} />
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Assessment Results
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ px: 4, py: 3 }}>
          {testResult && (
            <Box>
              {/* Score Display */}
              <Paper 
                elevation={4} 
                sx={{ 
                  p: 4, 
                  mb: 4, 
                  borderRadius: 3,
                  background: `linear-gradient(135deg, ${
                    testResult.score >= 80 ? '#e8f5e8' : 
                    testResult.score >= 60 ? '#fff3e0' : '#ffebee'
                  } 0%, #f5f5f5 100%)`
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h2" sx={{ 
                    fontWeight: 700,
                    color: testResult.score >= 80 ? 'success.main' : 
                           testResult.score >= 60 ? 'warning.main' : 'error.main',
                    mb: 1
                  }}>
                    {testResult.score}%
                  </Typography>
                  <Chip 
                    label={testResult.grade}
                    color={getScoreColor(testResult.score) as any}
                    size="large"
                    sx={{ fontSize: '1rem', px: 2, py: 1 }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <LinearProgress 
                    variant="determinate" 
                    value={testResult.score} 
                    sx={{ 
                      width: '100%', 
                      maxWidth: '400px',
                      height: 12, 
                      borderRadius: 6,
                      bgcolor: 'grey.200'
                    }} 
                  />
                </Box>
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    textAlign: 'center',
                    color: 'text.primary',
                    fontWeight: 500
                  }}
                >
                  {selectedJob?.title} Compatibility Assessment
                </Typography>
              </Paper>

              {/* Interpretation Section */}
              <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Performance Analysis
                </Typography>
                <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                  {testResult.interpretation}
                </Typography>
              </Paper>

              {/* Recommendations Section */}
              <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Personalized Recommendations
                </Typography>
                <Stack spacing={2}>
                  {testResult.recommendations.map((rec, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          flexShrink: 0,
                          mt: 0.25
                        }}
                      >
                        {index + 1}
                      </Box>
                      <Typography variant="body1" sx={{ fontSize: '1rem', lineHeight: 1.5 }}>
                        {rec}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              {/* Call to Action */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Want to see more detailed analysis and insights?
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 4, py: 3, gap: 2, justifyContent: 'space-between' }}>
          <Button 
            onClick={() => setShowResults(false)}
            variant="outlined"
            size="large"
            sx={{ px: 4 }}
          >
            Close
          </Button>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              color="info"
              size="large"
              startIcon={<TrendingUp />}
              onClick={() => {
                // Store the test result in session storage for the detailed results page
                if (testResult) {
                  sessionStorage.setItem('testResult', JSON.stringify(testResult));
                  // Navigate to the existing PsychometricResultsPage
                  window.open('/test-results', '_blank');
                }
              }}
              sx={{ px: 4 }}
            >
              View Detailed Results
            </Button>
            
            <Button 
              variant="contained" 
              color="primary"
              size="large"
              onClick={resetTest}
              startIcon={<PlayArrow />}
              sx={{ px: 4 }}
            >
              Take Another Test
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Payment Request Dialog */}
      <Dialog 
        open={paymentRequestOpen} 
        onClose={() => !loading && setPaymentRequestOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <Payment color="primary" />
            <Typography variant="h6">Premium Assessment Payment</Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {!paymentRequestSent ? (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Premium Assessment Details</AlertTitle>
                This is a paid premium psychometric assessment service
              </Alert>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  <AlertTitle>Request Failed</AlertTitle>
                  {error}
                  <br /><strong>Please contact us directly using the information below.</strong>
                </Alert>
              )}

              {selectedJobForPayment && (
                <Card variant="outlined" sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {selectedJobForPayment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {selectedJobForPayment.company}
                    </Typography>
                    
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <Box>
                        <Typography variant="subtitle2">Assessment Features:</Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          <Typography variant="body2">• 40+ comprehensive questions</Typography>
                          <Typography variant="body2">• 60-minute detailed assessment</Typography>
                          <Typography variant="body2">• Professional grading and analysis</Typography>
                          <Typography variant="body2">• Detailed performance report</Typography>
                          <Typography variant="body2">• Personalized recommendations</Typography>
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              <Alert severity="warning" sx={{ mb: 3 }}>
                <AlertTitle>Premium Assessment Approval Process</AlertTitle>
                <Typography variant="body2">
                  To take this premium psychometric assessment, please follow these steps:
                  <br /><strong>1.</strong> Click "Send Approval Request" button below to notify our admin
                  <br /><strong>2.</strong> Contact us using any of the methods below to discuss payment
                  <br /><strong>3.</strong> Complete payment as instructed by our support team
                  <br /><strong>4.</strong> Wait for approval from our Super Admin dashboard
                  <br /><strong>5.</strong> Return here to take your assessment once approved
                </Typography>
              </Alert>

              <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'primary.50' }}>
                <Typography variant="h6" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ContactSupport />
                  Contact Excellence Coaching Hub
                </Typography>
                
                <Stack spacing={3} sx={{ mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Email color="primary" />
                    <Box>
                      <Typography variant="subtitle2">Email</Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        info@excellencecoachinghub.com
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WhatsApp color="success" />
                    <Box>
                      <Typography variant="subtitle2">WhatsApp</Typography>
                      <Typography variant="body2">0737299309</Typography>
                      <Typography variant="body2">0788535156</Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Phone color="info" />
                    <Box>
                      <Typography variant="subtitle2">Phone</Typography>
                      <Typography variant="body2">0737299309</Typography>
                      <Typography variant="body2">0788535156</Typography>
                    </Box>
                  </Box>
                </Stack>
              </Paper>

              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Important Instructions:</AlertTitle>
                <Typography variant="body2" component="div">
                  <strong>After clicking "Send Approval Request":</strong><br />
                  <strong>• Contact us immediately</strong> using any of the contact methods above<br />
                  <strong>• Mention:</strong> "I want Premium Psychometric Assessment for {selectedJobForPayment?.title}"<br />
                  <strong>• Reference:</strong> Your name ({user?.firstName} {user?.lastName}) and email ({user?.email})<br />
                  <strong>• Our team will:</strong> Provide payment details and process your request<br />
                  <strong>• After payment:</strong> Our Super Admin will approve your test access<br />
                  <strong>• You'll receive:</strong> Email confirmation when your test is ready to take
                </Typography>
              </Alert>
            </Box>
          ) : (
            <Box textAlign="center">
              <CheckCircle color="success" sx={{ fontSize: 60, mb: 2 }} />
              <Typography variant="h6" gutterBottom color="success.main">
                Approval Request Sent Successfully!
              </Typography>
              <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
                Your request has been sent to our Super Admin Psychometric Test Management system.
              </Typography>
              
              <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                <AlertTitle>Next Steps - Contact Us Now!</AlertTitle>
                <Typography variant="body2">
                  <strong>IMPORTANT:</strong> Please contact us immediately using the contact information above to:
                  <br />• Confirm your approval request
                  <br />• Get payment instructions
                  <br />• Speed up the approval process
                  <br />• Schedule your premium assessment
                </Typography>
              </Alert>
              
              <Typography variant="body2" color="text.secondary">
                <strong>Email:</strong> info@excellencecoachinghub.com<br />
                <strong>WhatsApp/Phone:</strong> 0737299309 or 0788535156
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!paymentRequestSent ? (
            <>
              <Button 
                onClick={() => setPaymentRequestOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                variant="contained"
                onClick={() => {
                  console.log('🚀 Send Approval Request button clicked!');
                  console.log('🚀 Current state:', {
                    user: user,
                    selectedJobForPayment: selectedJobForPayment,
                    loading: loading,
                    error: error
                  });
                  // Show immediate visual feedback
                  handleRequestPayment();
                }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <AdminPanelSettings />}
                size="large"
                color="primary"
                sx={{
                  minWidth: 250,
                  minHeight: 48,
                  fontSize: '1.1rem',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Sending Request...' : 'Send Approval Request'}
              </Button>
            </>
          ) : (
            <Button 
              variant="contained"
              onClick={() => setPaymentRequestOpen(false)}
            >
              Close
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {loading && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          bgcolor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Generating your test...</Typography>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default PsychometricTestsPage;
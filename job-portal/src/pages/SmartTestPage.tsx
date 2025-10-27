import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  useTheme,
  TextField,
  InputAdornment,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Autocomplete,
  Stack,
  Tabs,
  Tab,
  Snackbar
} from '@mui/material';
import {
  School,
  Work,
  Timer,
  QuestionAnswer,
  Assessment,
  TrendingUp,
  CheckCircle,
  Build,
  PlayArrow,
  Refresh,
  Info,
  Psychology,
  Speed,
  Search,
  FilterList,
  LocationOn,
  Business,
  Star,
  Close,
  Payment,
  Lock,
  AdminPanelSettings,
  ContactSupport,
  Phone,
  WhatsApp,
  Email,
  CardGiftcard,
  Settings,
  Person,
  Warning,
  VerifiedUser,
  Add
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/jobService';
import { smartTestService } from '../services/smartTestService';
import { paymentRequestService } from '../services/paymentRequestService';
import { User } from '../types/user';

interface Job {
  _id: string;
  title: string;
  company: string;
  industry?: string;
  location: string;
  experienceLevel: string;
  skills: string[];
  description: string;
}

interface SmartTest {
  _id: string;
  testId: string;
  title: string;
  description: string;
  jobId: string;
  jobTitle: string;
  company: string;
  questionCount: number;
  timeLimit: number;
  difficulty: string;
  skillsRequired: string[];
  createdAt: string;
  isAdminUploaded?: boolean;
  uploadedBy?: string;
}

interface AdminSmartTest {
  _id: string;
  testId: string;
  title: string;
  description: string;
  jobTitle: string;
  company: string;
  industry: string;
  questionCount: number;
  timeLimit: number;
  difficulty: string;
  skillsRequired: string[];
  createdAt: string;
  uploadedBy: string;
  isActive: boolean;
}

const SmartTestPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  // State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSmartTests, setUserSmartTests] = useState<SmartTest[]>([]);
  const [adminSmartTests, setAdminSmartTests] = useState<AdminSmartTest[]>([]);
  const [tabValue, setTabValue] = useState(0);
  
  // Job filtering state
  const [jobSearch, setJobSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [experienceLevelFilter, setExperienceLevelFilter] = useState('');
  
  // Dialog state
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generatingTest, setGeneratingTest] = useState(false);
  const [showStartTestDialog, setShowStartTestDialog] = useState(false);
  const [generatedTestId, setGeneratedTestId] = useState<string | null>(null);
  
  // Payment and test type state
  const [testType, setTestType] = useState<'free' | 'premium'>('free');
  const [hasUsedFreeTest, setHasUsedFreeTest] = useState(false);
  const [paymentRequestOpen, setPaymentRequestOpen] = useState(false);
  const [paymentRequestSent, setPaymentRequestSent] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<{[jobId: string]: string}>({});
  const [approvedRequests, setApprovedRequests] = useState<{[jobId: string]: string}>({});
  const [selectedJobForPayment, setSelectedJobForPayment] = useState<Job | null>(null);
  const [showRequestNewAssessment, setShowRequestNewAssessment] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  
  // Removed payment information dialog - now integrated into request dialog

  useEffect(() => {
    // Check permanent lock first from localStorage before any API calls
    const permanentLockCheck = () => {
      const localFreeUsed = localStorage.getItem('smartTestFreeUsed');
      const permanentLock = localStorage.getItem('smartTestFreePermanentLock');
      if (localFreeUsed === 'true' && permanentLock === 'true') {
        console.log('🔒 PERMANENT LOCK detected on page load - enforcing restriction');
        setHasUsedFreeTest(true);
        setTestType('premium');
      }
    };

    // Run permanent lock check immediately
    permanentLockCheck();
    
    fetchJobs();
    fetchUserSmartTests();
    fetchAdminSmartTests();
    checkFreeTestStatus();
    checkPaymentRequestStatus();
  }, [user]);

  // Check if user has used their free test
  const checkFreeTestStatus = async () => {
    try {
      const status = await smartTestService.checkFreeTestStatus();
      console.log('🔍 Free test status:', status);
      
      setHasUsedFreeTest(status.hasUsedFreeTest);
      
      // Set default test type to premium if user has used free test
      if (status.hasUsedFreeTest) {
        console.log('🔒 User has PERMANENTLY used free test - forever locked, defaulting to premium');
        console.log('📅 Lock date:', status.permanentLockDate || status.usedAt);
        setTestType('premium');
        
        // Store the PERMANENT lock state in localStorage as backup
        localStorage.setItem('smartTestFreeUsed', 'true');
        localStorage.setItem('smartTestFreePermanentLock', 'true');
        if (status.permanentLockDate || status.usedAt) {
          localStorage.setItem('smartTestFreeUsedAt', status.permanentLockDate || status.usedAt);
        }
      } else {
        // Double-check localStorage as backup (permanent lock check)
        const localFreeUsed = localStorage.getItem('smartTestFreeUsed');
        const permanentLock = localStorage.getItem('smartTestFreePermanentLock');
        if (localFreeUsed === 'true' && permanentLock === 'true') {
          console.log('🔒 LocalStorage indicates PERMANENT free test lock - syncing state');
          setHasUsedFreeTest(true);
          setTestType('premium');
        }
      }
    } catch (error) {
      console.error('Error checking free test status:', error);
      
      // Handle rate limiting errors specifically
      if (error?.response?.status === 429) {
        console.warn('🚨 Rate limit exceeded when checking free test status');
        // Show user-friendly message
        setError('Server is busy. Please wait a moment and refresh the page.');
        setTimeout(() => setError(null), 5000);
      }
      
      // Check localStorage as fallback (permanent lock check)
      const localFreeUsed = localStorage.getItem('smartTestFreeUsed');
      const permanentLock = localStorage.getItem('smartTestFreePermanentLock');
      if (localFreeUsed === 'true' && permanentLock === 'true') {
        console.log('📱 Using localStorage fallback - PERMANENT free test lock detected');
        setHasUsedFreeTest(true);
        setTestType('premium');
      }
    }
  };

  // Check payment request status for smart tests
  const checkPaymentRequestStatus = async () => {
    if (!user) return;
    
    try {
      const requests = await paymentRequestService.getUserPaymentRequests();
      
      const pending: {[jobId: string]: string} = {};
      const approved: {[jobId: string]: string} = {};
      
      requests.forEach((request: any) => {
        if (request.testType === 'smart_test') {
          if (request.status === 'pending') {
            pending[request.jobId] = request._id;
          } else if (request.status === 'approved') {
            approved[request.jobId] = request._id;
          }
        }
      });
      
      setPendingRequests(pending);
      setApprovedRequests(approved);
      
      // If there are approved requests, notify the user
      if (Object.keys(approved).length > 0) {
        console.log('🎉 Found approved payment requests:', approved);
        setSnackbarMessage(`🎉 Great news! Your payment has been verified for ${Object.keys(approved).length} premium test request(s). You can now generate premium tests!`);
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error checking smart test payment status:', error);
    }
  };

  // Refresh payment status when generate dialog opens
  useEffect(() => {
    if (showGenerateDialog && user) {
      console.log('🔄 Generate dialog opened - refreshing payment status');
      checkPaymentRequestStatus();
    }
  }, [showGenerateDialog, user]);

  // Ensure premium tests have at least 20 questions
  useEffect(() => {
    if (testType === 'premium' && questionCount < 20) {
      console.log('🔧 Premium test selected - ensuring minimum 20 questions');
      setQuestionCount(20);
    }
  }, [testType, questionCount]);

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = [...jobs];

    // Search filter
    if (jobSearch) {
      const searchLower = jobSearch.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchLower))
      );
    }

    // Location filter
    if (locationFilter) {
      filtered = filtered.filter(job =>
        job.location.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Industry filter
    if (industryFilter) {
      filtered = filtered.filter(job =>
        job.industry?.toLowerCase().includes(industryFilter.toLowerCase())
      );
    }

    // Experience level filter
    if (experienceLevelFilter) {
      filtered = filtered.filter(job =>
        job.experienceLevel.toLowerCase() === experienceLevelFilter.toLowerCase()
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, jobSearch, locationFilter, industryFilter, experienceLevelFilter]);

  const fetchJobs = async () => {
    try {
      setLoadingJobs(true);
      // First, get a small batch to determine total count
      const initialResponse = await jobService.getJobsForStudent(1, 10);
      const totalJobs = initialResponse.pagination?.total || 0;
      
      // Set a reasonable limit for fetching jobs to avoid performance issues
      const MAX_JOBS_TO_FETCH = 1000;
      const jobsToFetch = Math.min(totalJobs, MAX_JOBS_TO_FETCH);
      
      // Fetch all available jobs up to the limit
      if (totalJobs > 10) {
        const allJobsResponse = await jobService.getJobsForStudent(1, jobsToFetch);
        setJobs(allJobsResponse.data);
        setFilteredJobs(allJobsResponse.data);
      } else {
        setJobs(initialResponse.data);
        setFilteredJobs(initialResponse.data);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  // Get unique values for filter options
  const getUniqueLocations = () => {
    return Array.from(new Set(jobs.map(job => job.location).filter(Boolean)));
  };

  const getUniqueIndustries = () => {
    return Array.from(new Set(jobs.map(job => job.industry).filter(Boolean)));
  };

  const getUniqueExperienceLevels = () => {
    return Array.from(new Set(jobs.map(job => job.experienceLevel).filter(Boolean)));
  };

  const clearFilters = () => {
    setJobSearch('');
    setLocationFilter('');
    setIndustryFilter('');
    setExperienceLevelFilter('');
    setSelectedJob(null);
  };

  const fetchUserSmartTests = async () => {
    try {
      const tests = await smartTestService.getUserSmartTests();
      setUserSmartTests(tests);
    } catch (error) {
      console.error('Error fetching smart tests:', error);
    }
  };

  const fetchAdminSmartTests = async () => {
    try {
      const tests = await smartTestService.getAdminSmartTests();
      setAdminSmartTests(tests);
    } catch (error) {
      console.error('Error fetching admin smart tests:', error);
      
      // Handle rate limiting errors specifically
      if (error?.response?.status === 429) {
        console.warn('🚨 Rate limit exceeded when fetching admin smart tests');
        // Show user-friendly message
        setError('Server is busy loading tests. Please wait a moment and refresh the page.');
        setTimeout(() => setError(null), 5000);
      }
      
      // Don't show error for admin tests if endpoint doesn't exist yet
    }
  };

  const handleGenerateTest = async () => {
    if (!selectedJob) {
      setError('Please select a job first');
      return;
    }

    console.log('🎯 handleGenerateTest called:', {
      jobId: selectedJob._id,
      jobTitle: selectedJob.title,
      testType,
      hasUsedFreeTest,
      approvedRequests,
      hasApprovedRequest: approvedRequests[selectedJob._id],
      pendingRequests,
      hasPendingRequest: pendingRequests[selectedJob._id]
    });

    if (testType === 'free') {
      // Handle free test generation
      await generateFreeTest();
    } else {
      // Handle premium test generation
      await generatePremiumTest();
    }
  };

  const generateFreeTest = async () => {
    if (!selectedJob) return;

    if (hasUsedFreeTest) {
      setError('You have already used your one-time free smart test. Please request premium test approval.');
      return;
    }

    try {
      setGeneratingTest(true);
      setError(null);

      const testData = {
        jobId: selectedJob._id,
        difficulty: 'intermediate' as 'basic' | 'intermediate' | 'advanced',
        questionCount: 10, // Free test has 10 questions
      };

      console.log('Generating free smart test with data:', testData);
      
      const result = await smartTestService.generateFreeSmartTest(testData);
      console.log('✅ Free smart test generated successfully:', result);

      // IMMEDIATELY set permanent lock status
      console.log('🔒 Setting PERMANENT free test lock - cannot be reversed');
      setHasUsedFreeTest(true);
      setTestType('premium'); // Force switch to premium for future tests
      
      // Store PERMANENT lock in localStorage immediately
      localStorage.setItem('smartTestFreeUsed', 'true');
      localStorage.setItem('smartTestFreePermanentLock', 'true');
      localStorage.setItem('smartTestFreeUsedAt', new Date().toISOString());
      
      // Refresh user tests
      await fetchUserSmartTests();

      // Close dialog and show success
      setShowGenerateDialog(false);
      clearFilters();
      
      // Show success message and option to start test immediately
      setGeneratedTestId(result.testId);
      setShowStartTestDialog(true);

    } catch (error: any) {
      console.error('❌ Error generating free test:', error);
      
      // Handle the permanent free test lock
      if (error.response?.data?.code === 'FREE_TEST_ALREADY_USED' || 
          error.response?.data?.error?.includes('already used your one-time free test') ||
          error.message?.includes('FREE_TEST_ALREADY_USED') || 
          error.message?.includes('already used your one-time free test')) {
        
        console.log('🔒 Free test PERMANENTLY locked for this user - cannot be reset');
        setError('You have already used your one-time free smart test. This limitation is PERMANENT and cannot be reset. Please request premium test approval.');
        setHasUsedFreeTest(true);
        setTestType('premium'); // Force switch to premium
        
        // Store the PERMANENT lock state in localStorage
        localStorage.setItem('smartTestFreeUsed', 'true');
        localStorage.setItem('smartTestFreePermanentLock', 'true');
        localStorage.setItem('smartTestFreeUsedAt', new Date().toISOString());
        
      } else {
        setError(error.response?.data?.error || error.message || 'Failed to generate free test');
      }
    } finally {
      setGeneratingTest(false);
    }
  };

  const generatePremiumTest = async () => {
    if (!selectedJob) return;

    console.log('🔐 Premium test requested - checking payment approval status');

    // Check if payment has been approved for this job
    const hasApprovedPayment = approvedRequests[selectedJob._id];
    
    if (hasApprovedPayment) {
      console.log('✅ Payment already approved - generating premium test directly');
      
      // Generate the premium test directly since payment is approved
      try {
        setGeneratingTest(true);
        setError(null);

        const testData = {
          jobId: selectedJob._id,
          difficulty: 'intermediate' as 'basic' | 'intermediate' | 'advanced',
          questionCount: Math.max(questionCount, 20) // Ensure premium tests have at least 20 questions
        };

        console.log('Attempting to generate premium smart test with data:', testData);
        
        const result = await smartTestService.generatePremiumSmartTest(testData);
        console.log('✅ Premium smart test generated successfully:', result);

        // Refresh user tests
        await fetchUserSmartTests();

        // Close dialog and show success
        setShowGenerateDialog(false);
        clearFilters();
        
        // Show success message and option to start test immediately
        setGeneratedTestId(result.testId);
        setShowStartTestDialog(true);

      } catch (error: any) {
        console.error('❌ Error generating premium test:', error);
        setError(error.response?.data?.error || error.message || 'Failed to generate premium test');
      } finally {
        setGeneratingTest(false);
      }
    } else {
      console.log('❌ Payment not approved - showing payment request dialog');
      
      // Show payment request dialog for payment and request submission
      setSelectedJobForPayment(selectedJob);
      setShowGenerateDialog(false);
      setPaymentRequestOpen(true);
    }
  };

  const startTest = async (testId: string) => {
    try {
      setLoading(true);
      const session = await smartTestService.startSmartTest(testId);
      
      // Navigate to test taking page
      navigate('/take-smart-test', {
        state: {
          sessionId: session.sessionId,
          test: session.test
        }
      });
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to start test');
    } finally {
      setLoading(false);
    }
  };

  const startAdminTest = async (testId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Start admin test with AI-selected 20 questions
      const session = await smartTestService.startAdminTest(testId, {
        questionCount: 20,
        randomize: true
      });
      
      console.log('🎯 Admin test session started:', session);
      
      // Navigate to test taking page with admin test data
      navigate('/take-smart-test', {
        state: {
          sessionId: session.sessionId,
          test: session.test,
          questions: session.questions,
          isAdminTest: true,
          totalQuestions: session.totalQuestions,
          timeLimit: session.timeLimit
        }
      });
    } catch (error: any) {
      console.error('❌ Failed to start admin test:', error);
      setError(error.response?.data?.error || 'Failed to start admin test');
    } finally {
      setLoading(false);
    }
  };

  const handleStartGeneratedTest = async () => {
    if (generatedTestId) {
      setShowStartTestDialog(false);
      await startTest(generatedTestId);
    }
  };

  const handleViewTestsLater = () => {
    setShowStartTestDialog(false);
    setGeneratedTestId(null);
    // Tests are already refreshed, so user will see the new test in the list
  };

  // Payment request functions
  const handleCreatePaymentRequest = async () => {
    if (!selectedJobForPayment || !user) return;

    try {
      const requestData = {
        userId: user._id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        jobId: selectedJobForPayment._id,
        jobTitle: selectedJobForPayment.title,
        company: selectedJobForPayment.company,
        testType: 'smart_test' as const,
        questionCount,
        estimatedDuration: questionCount * 2, // Estimate 2 minutes per question
        requestedAt: new Date().toISOString(),
        status: 'pending' as const
      };

      await paymentRequestService.createPaymentRequest(requestData);
      
      setPaymentRequestSent(true);
      setPaymentRequestOpen(false);
      setSnackbarMessage('Premium test access request submitted successfully! You will be notified when approved.');
      setSnackbarOpen(true);
      
      // Refresh payment status
      setTimeout(() => {
        checkPaymentRequestStatus();
      }, 1000);

    } catch (error: any) {
      console.error('Error creating payment request:', error);
      setError(error.message || 'Failed to create payment request');
    }
  };

  const handleRequestNewAssessment = () => {
    setShowRequestNewAssessment(true);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'basic': return theme.palette.success.main;
      case 'intermediate': return theme.palette.warning.main;
      case 'advanced': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getDifficultyIcon = (level: string) => {
    switch (level) {
      case 'basic': return <School />;
      case 'intermediate': return <Work />;
      case 'advanced': return <Psychology />;
      default: return <Assessment />;
    }
  };



  if (loadingJobs) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* <>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Smart Job Preparation Tests
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Generate AI-powered tests tailored to specific job positions to prepare for real interviews and assessments
        </Typography>
        
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Smart Tests are different from Psychometric Tests:</strong> These tests focus on job-specific knowledge, 
            technical skills, and practical scenarios you'll encounter in your target role.
          </Typography>
        </Alert>
      </Box>

      {/* Main CTA Button */}
      <Box textAlign="center" mb={4}>
        <Button
          variant="contained"
          size="large"
          onClick={() => setShowGenerateDialog(true)}
          startIcon={hasUsedFreeTest ? <Payment /> : <CardGiftcard />}
          sx={{ 
            py: 2, 
            px: 6, 
            fontSize: '1.1rem',
            fontWeight: 'bold',
            background: hasUsedFreeTest 
              ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`
              : `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            boxShadow: 3,
            '&:hover': {
              boxShadow: 6,
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {hasUsedFreeTest 
            ? 'Generate Premium Test' 
            : 'Generate Your Free Test'}
        </Button>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {hasUsedFreeTest 
            ? 'Premium tests require approval - request access for unlimited testing'
            : 'Get your one-time free 10-question smart test tailored to any job position'}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={`My Generated Tests (${userSmartTests.length})`} 
            icon={<Build />}
          />
          <Tab 
            label={`Admin Tests (${adminSmartTests.length})`} 
            icon={<School />}
          />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <>
          {/* Test Status Overview */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                height: '100%',
                background: hasUsedFreeTest 
                  ? `linear-gradient(135deg, ${theme.palette.grey[100]} 0%, ${theme.palette.grey[200]} 100%)`
                  : `linear-gradient(135deg, ${theme.palette.success.light} 0%, ${theme.palette.success.main} 100%)`,
                color: hasUsedFreeTest ? theme.palette.text.primary : theme.palette.success.contrastText
              }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <CardGiftcard sx={{ fontSize: 40, mb: 2, opacity: hasUsedFreeTest ? 0.5 : 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Free Test Status
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {hasUsedFreeTest ? 'Used - One-time free test completed' : 'Available - Generate your free 10-question test'}
                  </Typography>
                  <Chip 
                    label={hasUsedFreeTest ? 'Used' : 'Available'}
                    color={hasUsedFreeTest ? 'default' : 'success'}
                    variant={hasUsedFreeTest ? 'outlined' : 'filled'}
                    sx={{ 
                      color: hasUsedFreeTest ? theme.palette.text.primary : theme.palette.success.contrastText,
                      borderColor: hasUsedFreeTest ? theme.palette.text.primary : theme.palette.success.contrastText
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Payment sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Premium Test Requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Track your premium test access requests
                  </Typography>
                  <Box display="flex" justifyContent="center" gap={1}>
                    <Chip 
                      label={`${Object.keys(pendingRequests).length} Pending`}
                      color="warning"
                      variant="outlined"
                      size="small"
                    />
                    <Chip 
                      label={`${Object.keys(approvedRequests).length} Approved`}
                      color="success"
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Build sx={{ fontSize: 40, color: theme.palette.secondary.main, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Generate New Test
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Create personalized job preparation tests
                  </Typography>
                  
                  <Button 
                    variant="contained" 
                    size="medium"
                    onClick={() => setShowGenerateDialog(true)}
                    startIcon={<Build />}
                    fullWidth
                    sx={{
                      backgroundColor: jobs.length === 0 ? theme.palette.warning.main : theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: jobs.length === 0 ? theme.palette.warning.dark : theme.palette.primary.dark,
                      }
                    }}
                  >
                    {jobs.length === 0 ? 'Setup Required' : 'Generate Test'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Assessment sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    View Test Results
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Review your performance and get detailed insights
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="large" 
                    onClick={() => navigate('/app/smart-test-results')}
                    startIcon={<TrendingUp />}
                    sx={{ mt: 2 }}
                  >
                    View Results
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <ContactSupport sx={{ fontSize: 48, color: theme.palette.info.main, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Need Help?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Contact support for assistance with tests or premium access
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center" mt={2}>
                    <Button
                      size="small"
                      startIcon={<WhatsApp />}
                      href="https://wa.me/250788551906"
                      target="_blank"
                      color="success"
                    >
                      WhatsApp
                    </Button>
                    <Button
                      size="small"
                      startIcon={<Email />}
                      href="mailto:support@excellencecoaching.rw"
                      target="_blank"
                    >
                      Email
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

      {/* My Smart Tests */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">
            My Smart Tests ({userSmartTests.length})
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchUserSmartTests}
            size="small"
          >
            Refresh
          </Button>
        </Box>

        {userSmartTests.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Assessment sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Smart Tests Generated Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {hasUsedFreeTest 
                  ? 'You have used your free test. Request premium access to generate more tests.'
                  : 'Generate your first smart test to start preparing for job interviews'}
              </Typography>
              
              {hasUsedFreeTest ? (
                <Box>
                  <Button 
                    variant="contained" 
                    onClick={handleRequestNewAssessment}
                    startIcon={<Payment />}
                    sx={{ mr: 2 }}
                  >
                    Request Premium Access
                  </Button>
                  <Button 
                    variant="outlined"
                    onClick={() => setShowGenerateDialog(true)}
                    startIcon={<Build />}
                  >
                    Try Generate Test
                  </Button>
                </Box>
              ) : (
                <Button 
                  variant="contained" 
                  onClick={() => setShowGenerateDialog(true)}
                  disabled={jobs.length === 0}
                  startIcon={<CardGiftcard />}
                >
                  Generate Free Test
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {userSmartTests.map((test) => (
              <Grid item xs={12} md={6} lg={4} key={test._id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      {getDifficultyIcon(test.difficulty)}
                      <Box ml={1}>
                        <Typography variant="h6" component="div" noWrap>
                          {test.jobTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {test.company}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box mb={2}>
                      <Chip 
                        label={test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
                        size="small"
                        sx={{ 
                          backgroundColor: getDifficultyColor(test.difficulty),
                          color: 'white',
                          mb: 1,
                          mr: 1
                        }}
                      />
                      <Chip 
                        label={`${test.questionCount} Questions`}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1, mr: 1 }}
                      />
                      <Chip 
                        label={`${test.timeLimit} min`}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      Skills: {test.skillsRequired.join(', ')}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(test.createdAt).toLocaleDateString()}
                    </Typography>

                    <Box mt={3}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<PlayArrow />}
                        onClick={() => startTest(test.testId)}
                        disabled={loading}
                      >
                        {loading ? 'Starting...' : 'Start Test'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
        </>
      )}

      {/* Admin Tests Tab */}
      {tabValue === 1 && (
        <Box mb={4}>
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Admin Uploaded Tests ({adminSmartTests.length})
          </Typography>
          
          {adminSmartTests.length === 0 ? (
            <Card>
              <CardContent sx={{ textAlign: 'center', py: 6 }}>
                <School sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Admin Tests Available
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Check back later for tests uploaded by administrators for specific job positions
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {adminSmartTests.map((test) => (
                <Grid item xs={12} md={6} lg={4} key={test._id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" mb={2}>
                        {getDifficultyIcon(test.difficulty)}
                        <Box ml={1}>
                          <Typography variant="h6" component="div" noWrap>
                            {test.jobTitle}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {test.company} • {test.industry}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography variant="body1" sx={{ mb: 2, fontWeight: 'medium' }}>
                        {test.title}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        {test.description}
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Box mb={2}>
                        <Chip 
                          label={test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1)}
                          size="small"
                          sx={{ 
                            backgroundColor: getDifficultyColor(test.difficulty),
                            color: 'white',
                            mb: 1,
                            mr: 1
                          }}
                        />
                        <Chip 
                          label={`${test.questionCount} Questions`}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1, mr: 1 }}
                        />
                        <Chip 
                          label={`${test.timeLimit} min`}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" paragraph>
                        Skills: {test.skillsRequired.join(', ')}
                      </Typography>

                      <Box mt={3} display="flex" flexDirection="column" gap={1}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<Psychology />}
                          onClick={() => startAdminTest(test._id)}
                          disabled={loading || !test.isActive}
                          color="primary"
                          sx={{ 
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                            fontWeight: 'bold'
                          }}
                        >
                          {!test.isActive ? 'Test Inactive' : loading ? 'Starting...' : 'Start AI Test (20 Questions)'}
                        </Button>
                        <Button
                          variant="outlined"
                          fullWidth
                          size="small"
                          startIcon={<Settings />}
                          onClick={() => startTest(test.testId)}
                          disabled={loading || !test.isActive}
                        >
                          {loading ? 'Starting...' : 'Full Test'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Generate Test Dialog - Enhanced */}
      <Dialog 
        open={showGenerateDialog} 
        onClose={() => !generatingTest && setShowGenerateDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            backgroundColor: theme.palette.background.paper,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                <Build />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Generate Smart Test
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a personalized test for your target job position
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => !generatingTest && setShowGenerateDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ px: 3 }}>
          <Grid container spacing={3}>
            {/* Job Filters Section */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 3, mb: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <FilterList sx={{ mr: 1 }} />
                  Find Your Target Job
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Search Jobs"
                      placeholder="Job title, company, or skills..."
                      value={jobSearch}
                      onChange={(e) => setJobSearch(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={getUniqueLocations()}
                      value={locationFilter}
                      onChange={(_, value) => setLocationFilter(value || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Location"
                          placeholder="Select location..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocationOn />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={getUniqueIndustries()}
                      value={industryFilter}
                      onChange={(_, value) => setIndustryFilter(value || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Industry"
                          placeholder="Select industry..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <Business />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={getUniqueExperienceLevels()}
                      value={experienceLevelFilter}
                      onChange={(_, value) => setExperienceLevelFilter(value || '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Experience Level"
                          placeholder="Select experience level..."
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <TrendingUp />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>

                <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    Found {filteredJobs.length} jobs
                  </Typography>
                  <Button
                    size="small"
                    onClick={clearFilters}
                    disabled={!jobSearch && !locationFilter && !industryFilter && !experienceLevelFilter}
                  >
                    Clear Filters
                  </Button>
                </Box>
              </Card>
            </Grid>

            {/* Job Selection */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Select Job Position
              </Typography>
              
              <Box sx={{ maxHeight: 300, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                {jobs.length === 0 ? (
                  <Box p={4} textAlign="center">
                    <Work sx={{ fontSize: 48, color: theme.palette.warning.main, mb: 2 }} />
                    <Typography variant="h6" color="text.primary" gutterBottom>
                      No Jobs Available
                    </Typography>
                    <Typography color="text.secondary" paragraph>
                      Jobs are still loading or there may be no jobs posted yet. You can still create a custom test by providing job details manually.
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => {
                        // For now, we'll create a placeholder job
                        const customJob = {
                          _id: 'custom-job',
                          title: 'Custom Job Position',
                          company: 'Your Target Company',
                          location: 'Any Location',
                          industry: 'General',
                          experienceLevel: 'Any Level',
                          skillsRequired: [],
                          description: 'Custom job position for test generation'
                        };
                        setSelectedJob(customJob as Job);
                      }}
                    >
                      Create Custom Test
                    </Button>
                  </Box>
                ) : filteredJobs.length === 0 ? (
                  <Box p={4} textAlign="center">
                    <Work sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
                    <Typography color="text.secondary">
                      No jobs found. Try adjusting your filters or create a custom test above.
                    </Typography>
                  </Box>
                ) : (
                  filteredJobs.map((job) => (
                    <Box
                      key={job._id}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        backgroundColor: selectedJob?._id === job._id ? theme.palette.primary.main : 'transparent',
                        color: selectedJob?._id === job._id ? theme.palette.primary.contrastText : 'inherit',
                        borderBottom: 1,
                        borderColor: 'divider',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover
                        },
                        '&:last-child': {
                          borderBottom: 0
                        }
                      }}
                      onClick={() => setSelectedJob(job)}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box flex={1}>
                          <Typography variant="subtitle1" fontWeight="medium">
                            {job.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {job.company} • {job.location}
                          </Typography>
                          
                          <Stack direction="row" spacing={1} flexWrap="wrap" mt={1}>
                            {job.industry && (
                              <Chip 
                                label={job.industry} 
                                size="small" 
                                variant="outlined"
                                icon={<Business />}
                              />
                            )}
                            <Chip 
                              label={job.experienceLevel} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                            {job.skills.slice(0, 3).map((skill) => (
                              <Chip
                                key={skill}
                                label={skill}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                            {job.skills.length > 3 && (
                              <Chip
                                label={`+${job.skills.length - 3} more`}
                                size="small"
                                variant="outlined"
                                color="secondary"
                              />
                            )}
                          </Stack>
                        </Box>
                        
                        <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                          {/* Show payment verified badge */}
                          {approvedRequests[job._id] && (
                            <Chip 
                              label="Payment Verified!" 
                              size="small" 
                              color="success"
                              variant="filled"
                              icon={<CheckCircle />}
                              sx={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 'bold',
                                animation: 'pulse 2s infinite'
                              }}
                            />
                          )}
                          
                          {/* Show payment pending verification badge */}
                          {pendingRequests[job._id] && !approvedRequests[job._id] && (
                            <Chip 
                              label="Payment Verification Pending" 
                              size="small" 
                              color="warning"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          
                          {selectedJob?._id === job._id && (
                            <CheckCircle sx={{ color: theme.palette.primary.contrastText }} />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </Grid>


            {/* Selected Job Details */}
            {selectedJob && (
              <Box sx={{ width: '100%', mb: 2 }}>
                <Alert 
                  severity={approvedRequests[selectedJob._id] ? "success" : pendingRequests[selectedJob._id] ? "warning" : "info"} 
                  variant="filled"
                >
                  <Box>
                    <Typography variant="body1" fontWeight="medium" gutterBottom>
                      Selected: {selectedJob.title} at {selectedJob.company}
                      {approvedRequests[selectedJob._id] && " 🎉 Payment Verified!"}
                      {pendingRequests[selectedJob._id] && !approvedRequests[selectedJob._id] && " ⏳ Payment Pending"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Industry:</strong> {selectedJob.industry || 'Not specified'} •{' '}
                      <strong>Experience:</strong> {selectedJob.experienceLevel} •{' '}
                      <strong>Location:</strong> {selectedJob.location}
                    </Typography>
                    {selectedJob.skills.length > 0 && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Skills to be tested:</strong> {selectedJob.skills.join(', ')}
                      </Typography>
                    )}
                    {approvedRequests[selectedJob._id] && (
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                        ✅ Payment verified! You can now generate premium tests for this job.
                      </Typography>
                    )}
                    {pendingRequests[selectedJob._id] && !approvedRequests[selectedJob._id] && (
                      <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                        ⏳ Payment verification in progress. Please wait for approval.
                      </Typography>
                    )}
                  </Box>
                </Alert>
              </Box>
            )}

            {/* Test Configuration */}
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Test Configuration
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Test Type Selection */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" gutterBottom fontWeight="medium">
                      Choose Test Type
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Card 
                          variant={testType === 'free' ? 'filled' : 'outlined'}
                          sx={{ 
                            cursor: hasUsedFreeTest ? 'not-allowed' : 'pointer',
                            opacity: hasUsedFreeTest ? 0.6 : 1,
                            border: testType === 'free' ? 2 : 1,
                            borderColor: testType === 'free' ? 'primary.main' : 'divider',
                            '&:hover': hasUsedFreeTest ? {} : {
                              borderColor: 'primary.main',
                              boxShadow: 1
                            }
                          }}
                          onClick={() => !hasUsedFreeTest && setTestType('free')}
                        >
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <CardGiftcard sx={{ fontSize: 40, color: hasUsedFreeTest ? 'text.disabled' : 'success.main', mb: 1 }} />
                            <Typography variant="h6" gutterBottom>
                              Free Test {hasUsedFreeTest && '(Used)'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              One-time free smart test
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              • 10 Questions
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              • ~15 minutes
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              • Basic insights
                            </Typography>
                            {hasUsedFreeTest && (
                              <Alert severity="warning" sx={{ mt: 2 }}>
                                <Typography variant="caption">
                                  You have already used your free test
                                </Typography>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Card 
                          variant={testType === 'premium' ? 'filled' : 'outlined'}
                          sx={{ 
                            cursor: 'pointer',
                            border: testType === 'premium' ? 2 : 1,
                            borderColor: testType === 'premium' ? 'primary.main' : 'divider',
                            '&:hover': {
                              borderColor: 'primary.main',
                              boxShadow: 1
                            }
                          }}
                          onClick={() => setTestType('premium')}
                        >
                          <CardContent sx={{ textAlign: 'center', py: 3 }}>
                            <Payment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                            <Typography variant="h6" gutterBottom>
                              Premium Test
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                              Full-featured smart test (requires admin approval)
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              • Customizable questions (20-30)
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              • Detailed analysis
                            </Typography>
                            <Typography variant="body2" fontWeight="medium">
                              • Performance insights
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </Grid>
                  
                  {/* Question Count (only for premium tests) */}
                  {testType === 'premium' && (
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Number of Questions</InputLabel>
                        <Select
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Number(e.target.value))}
                          label="Number of Questions"
                        >
                          <MenuItem value={20}>20 Questions (~40 min) - Recommended</MenuItem>
                          <MenuItem value={25}>25 Questions (~50 min)</MenuItem>
                          <MenuItem value={30}>30 Questions (~60 min)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}
                  
                  {testType === 'premium' ? (
                    <Grid item xs={12} md={6}>
                      <Alert severity="info">
                        <Typography variant="body2">
                          <strong>Smart Difficulty:</strong> Test difficulty will be automatically adjusted based on the job requirements and your profile.
                        </Typography>
                      </Alert>
                    </Grid>
                  ) : (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        <Typography variant="body2">
                          <strong>Smart Difficulty:</strong> Test difficulty will be automatically adjusted based on the job requirements and your profile.
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                  
                  {testType === 'free' && (
                    <Grid item xs={12}>
                      <Alert severity="info" icon={<CardGiftcard />}>
                        <Typography variant="body2">
                          <strong>Free Test Details:</strong> This is your one-time free smart test with 10 carefully selected questions (~15 minutes). 
                          For more comprehensive testing, you can request premium test approval.
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                  
                  {testType === 'premium' && (
                    <Grid item xs={12}>
                      {selectedJob && approvedRequests[selectedJob._id] ? (
                        <Alert severity="success" icon={<CheckCircle />}>
                          <Typography variant="body2">
                            <strong>Premium Test Approved:</strong> Your payment has been verified! 
                            You can now generate your premium smart test with 20+ personalized questions and detailed analysis.
                          </Typography>
                        </Alert>
                      ) : (
                        <Alert severity="warning" icon={<AdminPanelSettings />}>
                          <Typography variant="body2">
                            <strong>Premium Test:</strong> This requires payment verification. Once you submit the request with payment proof, 
                            our admin team will review and approve it. You'll be notified when you can generate the test.
                          </Typography>
                        </Alert>
                      )}
                    </Grid>
                  )}
                </Grid>
              </Card>
            </Grid>

            {generatingTest && (
              <Grid item xs={12}>
                <Card variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <CircularProgress size={40} sx={{ mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Generating Your Smart Test...
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    AI is creating personalized questions based on the job requirements
                  </Typography>
                  <LinearProgress sx={{ mt: 2 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    This may take 30-60 seconds
                  </Typography>
                </Card>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setShowGenerateDialog(false)}
            disabled={generatingTest}
            size="large"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateTest}
            variant="contained"
            disabled={!selectedJob || generatingTest || (testType === 'free' && hasUsedFreeTest)}
            startIcon={generatingTest ? <CircularProgress size={16} /> : (
              testType === 'free' ? <CardGiftcard /> : (
                selectedJob && approvedRequests[selectedJob._id] ? <CheckCircle /> : <Payment />
              )
            )}
            size="large"
            sx={{ px: 4 }}
            color={
              testType === 'premium' && selectedJob && approvedRequests[selectedJob._id] ? 'success' : 'primary'
            }
          >
            {generatingTest ? 'Generating...' : (
              testType === 'free' ? 'Generate Free Test' : (
                selectedJob && approvedRequests[selectedJob._id] ? 'Generate Premium Test' : 'Request Premium Test'
              )
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog - Start Generated Test */}
      <Dialog
        open={showStartTestDialog}
        onClose={() => setShowStartTestDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <CheckCircle color="success" sx={{ fontSize: 48, mb: 1 }} />
          <Typography variant="h4" component="div" gutterBottom>
            Smart Test Generated Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your personalized job preparation test is ready
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Your test has been saved and you can access it anytime from your smart tests list.
            </Typography>
          </Alert>
          
          <Typography variant="h6" gutterBottom>
            What would you like to do now?
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', gap: 2, p: 3, pt: 0 }}>
          <Button 
            onClick={handleViewTestsLater}
            variant="outlined"
            size="large"
            startIcon={<Info />}
          >
            View Tests Later
          </Button>
          <Button 
            onClick={handleStartGeneratedTest}
            variant="contained"
            size="large"
            startIcon={<PlayArrow />}
            sx={{ px: 4 }}
          >
            Start Test Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Request Dialog */}
      <Dialog open={paymentRequestOpen} onClose={() => setPaymentRequestOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Payment sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" component="div" gutterBottom>
            Premium Smart Test Payment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pay first, then submit your request for premium test access
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          {selectedJobForPayment && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Job Position:</strong> {selectedJobForPayment.title}
                </Typography>
                <Typography variant="body2">
                  <strong>Company:</strong> {selectedJobForPayment.company}
                </Typography>
                <Typography variant="body2">
                  <strong>Location:</strong> {selectedJobForPayment.location}
                </Typography>
                <Typography variant="body2">
                  <strong>Experience Level:</strong> {selectedJobForPayment.experienceLevel}
                </Typography>
              </Alert>

              <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: 'grey.50' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Premium Test Features:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                      {questionCount} personalized questions
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                      ~{questionCount * 2} minutes duration
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                      Detailed performance analysis
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, color: 'success.main', mr: 1 }} />
                      Skills improvement recommendations
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment Information */}
              <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: 'success.50' }}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Payment />
                  Payment Information
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Cost:</strong> 5,000 RWF for premium smart test generation
                  </Typography>
                </Alert>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      💳 Bank Transfer
                    </Typography>
                    <Typography variant="body2">
                      <strong>Bank:</strong> Bank of Kigali<br />
                      <strong>Account:</strong> 123456789<br />
                      <strong>Name:</strong> Excellence Coaching Hub Ltd
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      📱 Mobile Money
                    </Typography>
                    <Typography variant="body2">
                      <strong>MTN:</strong> *182*8*1*788551906*5000#<br />
                      <strong>Airtel:</strong> *185*9*788551906*5000#<br />
                      <strong>Name:</strong> Excellence Coaching
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Alert severity="warning" icon={<AdminPanelSettings />}>
                <Typography variant="body2">
                  <strong>Payment Process:</strong> After making payment, submit your request below. 
                  Our team will verify payment and approve your premium test access. 
                  This usually takes 1-2 business days.
                </Typography>
              </Alert>

              <Box sx={{ mt: 3, p: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Payment Support & Verification
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Contact us immediately after payment for quick verification:
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    size="small"
                    startIcon={<WhatsApp />}
                    href="https://wa.me/250788551906?text=Hi, I just paid 5000 RWF for premium smart test. Job: {selectedJobForPayment?.title}"
                    target="_blank"
                    color="success"
                    variant="contained"
                  >
                    WhatsApp Payment Proof
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Email />}
                    href="mailto:support@excellencecoaching.rw?subject=Premium Test Payment Confirmation&body=I have paid 5000 RWF for premium smart test access for: {selectedJobForPayment?.title}"
                    target="_blank"
                  >
                    Email Payment Proof
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Phone />}
                    href="tel:+250788551906"
                    target="_blank"
                  >
                    Call: +250 788 551 906
                  </Button>
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={() => setPaymentRequestOpen(false)} size="large">
            Cancel
          </Button>
          
          <Button 
            onClick={handleCreatePaymentRequest}
            variant="contained"
            startIcon={<CheckCircle />}
            size="large"
            sx={{ px: 4 }}
            color="success"
          >
            I Have Made Payment - Submit Request
          </Button>
        </DialogActions>
      </Dialog>

      {/* Request New Assessment Dialog */}
      <Dialog 
        open={showRequestNewAssessment} 
        onClose={() => setShowRequestNewAssessment(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <Assessment sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h5" component="div">
            Request New Assessment
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" paragraph>
            You have completed your assessments. To generate additional smart tests, 
            please request premium access approval from the administrator.
          </Typography>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Premium access allows you to generate unlimited smart tests for different job positions 
              with detailed performance analysis and personalized recommendations.
            </Typography>
          </Alert>
        </DialogContent>
        
        <DialogActions sx={{ justifyContent: 'center', p: 3, pt: 0 }}>
          <Button onClick={() => setShowRequestNewAssessment(false)}>
            Maybe Later
          </Button>
          <Button 
            onClick={() => {
              setShowRequestNewAssessment(false);
              setShowGenerateDialog(true);
              setTestType('premium');
            }}
            variant="contained"
            startIcon={<Payment />}
          >
            Request Premium Access
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Information Dialog removed - functionality integrated into payment request dialog */}
      {/* <Dialog 
        open={showPaymentInfo} 
        onClose={() => setShowPaymentInfo(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Payment sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" component="div" gutterBottom>
            Premium Test Approved! 🎉
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your premium test request has been approved. Please complete payment to proceed.
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          {selectedJobForPaymentInfo && (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>Approved for:</strong> {selectedJobForPaymentInfo.title}
                </Typography>
                <Typography variant="body2">
                  <strong>Company:</strong> {selectedJobForPaymentInfo.company}
                </Typography>
                <Typography variant="body2">
                  <strong>Location:</strong> {selectedJobForPaymentInfo.location}
                </Typography>
              </Alert>

              <Paper variant="outlined" sx={{ p: 3, mb: 3, backgroundColor: 'primary.50' }}>
                <Typography variant="h6" gutterBottom color="primary">
                  💳 Payment Information
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Amount:</strong> $15 USD (one-time payment per premium test)
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Payment Methods:
                </Typography>
                
                <Stack spacing={2}>
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      🏦 Bank Transfer (Recommended)
                    </Typography>
                    <Typography variant="body2">
                      <strong>Account Name:</strong> Excellence Coaching Hub Ltd<br/>
                      <strong>Bank:</strong> Bank of Kigali<br/>
                      <strong>Account Number:</strong> 00200101681200<br/>
                      <strong>Reference:</strong> SmartTest-{selectedJobForPaymentInfo.title.replace(/\s+/g, '')}-{user?.firstName || 'User'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      📱 Mobile Money (MTN/Airtel)
                    </Typography>
                    <Typography variant="body2">
                      <strong>MTN Number:</strong> 0788-551-906<br/>
                      <strong>Airtel Number:</strong> 0732-551-906<br/>
                      <strong>Name:</strong> MUREKATETE Claudine<br/>
                      <strong>Reference:</strong> SmartTest-{user?.firstName || 'User'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      💳 International Payment
                    </Typography>
                    <Typography variant="body2">
                      PayPal: payments@excellencecoaching.rw<br/>
                      Western Union: Contact support for details
                    </Typography>
                  </Box>
                </Stack>
              </Paper>

              <Alert severity="info" icon={<Info />}>
                <Typography variant="body2">
                  <strong>Next Steps:</strong>
                  <br/>1. Make payment using any method above
                  <br/>2. Send payment confirmation (receipt/screenshot) to: 
                  <strong> payments@excellencecoaching.rw</strong>
                  <br/>3. Include your name and the reference number
                  <br/>4. Your test will be activated within 2-4 hours after payment confirmation
                </Typography>
              </Alert>

              <Box sx={{ mt: 3, p: 3, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom color="primary">
                  Need help with payment?
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Button
                    size="small"
                    startIcon={<Email />}
                    href="mailto:payments@excellencecoaching.rw?subject=Smart Test Payment Help"
                    target="_blank"
                  >
                    Email Support
                  </Button>
                  <Button
                    size="small"
                    startIcon={<WhatsApp />}
                    href="https://wa.me/250788551906?text=Hi, I need help with smart test payment"
                    target="_blank"
                    color="success"
                  >
                    WhatsApp
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Phone />}
                    href="tel:+250788551906"
                    target="_blank"
                  >
                    Call Support
                  </Button>
                </Stack>
              </Box>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={() => setShowPaymentInfo(false)}>
            I'll Pay Later
          </Button>
          <Button 
            onClick={() => {
              setShowPaymentInfo(false);
              // Open generate dialog to generate the test after payment
              setShowGenerateDialog(true);
            }}
            variant="contained"
            color="success"
            startIcon={<Payment />}
          >
            I've Made Payment
          </Button>
        </DialogActions>
      </Dialog> */}

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
};

export default SmartTestPage;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  Skeleton,
  useTheme,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  Badge,
  Fade,
  alpha,
  Tabs,
  Tab,
  Slide,
  Grid
} from '@mui/material';
import { SafeSlideDown } from '../utils/transitionFix';
import {
  PlayArrow,
  Business,
  School,
  Assessment,
  EmojiEvents,
  Visibility,
  Refresh,
  Close,
  CheckCircle,
  Timer,
  Star,
  Search,
  FilterList,
  Clear,
  TrendingUp,
  AutoAwesome,
  Psychology,
  Speed,
  Lightbulb,
  Verified,
  ArrowForward,
  PlayCircleOutline,
  WorkOutline,
  Group,
  AccessTime,
  Analytics,
  ContactSupport,
  Email,
  WhatsApp,
  Phone,
  AdminPanelSettings,
  History,
  Headphones
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProfileAccessGuard from '../components/ProfileAccessGuard';
import { jobService, type Job } from '../services/jobService';
import { optimizedQuickInterviewService, QuickInterviewSession, QuickInterviewResult } from '../services/optimizedQuickInterviewService';
import InterviewLauncher from '../components/InterviewLauncher';
import QuickTestInterviewInterface from '../components/QuickTestInterviewInterface';
// Removed complex InterviewHistory component
import { testRequestService, TestRequest } from '../services/testRequestService';

interface AIInterviewsPageProps {}

const AIInterviewsPage: React.FC<AIInterviewsPageProps> = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Main states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'practice'>('practice');

  // Job selection states
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobSelectionOpen, setJobSelectionOpen] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  
  // Filter states for job selection
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  // Job interview states  
  const [jobInterviewSession, setJobInterviewSession] = useState<QuickInterviewSession | null>(null);
  const [jobInterviewOpen, setJobInterviewOpen] = useState(false);

  // Payment approval states
  const [paymentRequestOpen, setPaymentRequestOpen] = useState(false);
  const [paymentRequestSent, setPaymentRequestSent] = useState(false);
  const [paymentRequestLoading, setPaymentRequestLoading] = useState(false);

  // Results states
  const [interviewResults, setInterviewResults] = useState<QuickInterviewResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<QuickInterviewResult | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

  // Approved interviews states
  const [approvedInterviews, setApprovedInterviews] = useState<TestRequest[]>([]);
  const [loadingApproved, setLoadingApproved] = useState(false);

  useEffect(() => {
    if (user) {
      initializePage();
    }
  }, [user]);

  const initializePage = async () => {
    try {
      setLoading(true);
      
      // Load previous results from localStorage
      const savedResults = JSON.parse(localStorage.getItem('interview_results') || '[]');
      setInterviewResults(savedResults);
      
      // Load jobs for selection
      await loadJobs();
      
      // Load approved interviews
      await loadApprovedInterviews();
      
    } catch (error) {
      console.error('Error initializing page:', error);
      setError('Failed to load interview data');
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      // First, get a small batch to determine total count
      const initialResponse = await jobService.getJobs({}, 1, 10);
      const totalJobs = initialResponse.pagination?.total || 0;
      
      // Set a reasonable limit for fetching jobs to avoid performance issues
      const MAX_JOBS_TO_FETCH = 1000;
      const jobsToFetch = Math.min(totalJobs, MAX_JOBS_TO_FETCH);
      
      // Fetch all available jobs up to the limit
      if (totalJobs > 10) {
        const allJobsResponse = await jobService.getJobs({}, 1, jobsToFetch);
        setJobs(allJobsResponse.data || []);
      } else {
        setJobs(initialResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs');
      setJobs([]); // Set empty array on error
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadApprovedInterviews = async () => {
    try {
      setLoadingApproved(true);
      const response = await testRequestService.getApprovedTests();
      if (response.success) {
        // Filter only interview requests
        const interviewRequests = response.data.filter(
          request => request.requestType === 'interview' || request.requestType === 'both'
        );
        setApprovedInterviews(interviewRequests);
      } else {
        console.error('Failed to load approved interviews:', response.error);
        setApprovedInterviews([]);
      }
    } catch (error) {
      console.error('Error loading approved interviews:', error);
      setApprovedInterviews([]);
    } finally {
      setLoadingApproved(false);
    }
  };

  // Filter jobs based on search term, location, and department
  useEffect(() => {
    if (!jobs.length) return;
    
    let filtered = jobs.filter(job => {
      const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           job.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesLocation = !locationFilter || job.location?.toLowerCase().includes(locationFilter.toLowerCase());
      
      const matchesDepartment = !departmentFilter || job.department?.toLowerCase().includes(departmentFilter.toLowerCase());
      
      return matchesSearch && matchesLocation && matchesDepartment;
    });
    
    setFilteredJobs(filtered);
  }, [jobs, searchTerm, locationFilter, departmentFilter]);

  // Get unique filter options
  const getUniqueLocations = () => {
    const locations = jobs.map(job => job.location).filter(Boolean);
    return [...new Set(locations)];
  };

  const getUniqueDepartments = () => {
    const departments = jobs.map(job => job.department).filter(Boolean);
    return [...new Set(departments)];
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setDepartmentFilter('');
  };

  // =============================================================================
  // JOB SELECTION & QUESTION PRE-GENERATION
  // =============================================================================

  const handleJobSelection = async (job: Job) => {
    try {
      console.log('🎯 Job selected:', job.title);
      setJobSelectionOpen(false);
      setSelectedJob(job);
      setSuccess(`✅ Job selected: ${job.title}! Click "Start Interview" to request approval.`);
      
    } catch (error) {
      console.error('Failed to select job:', error);
      setError('Failed to select job. Please try again.');
    }
  };

  const requestInterviewApproval = () => {
    if (!selectedJob) {
      setError('Please select a job first.');
      return;
    }
    setPaymentRequestOpen(true);
    setPaymentRequestSent(false);
  };

  const startApprovedInterview = async (testRequest: TestRequest) => {
    try {
      setGeneratingQuestions(true);
      console.log('🎯 Starting approved interview for:', testRequest.job.title);

      // Create job object for the service
      const jobContext = {
        title: testRequest.job.title,
        company: testRequest.job.company,
        _id: testRequest.job._id,
        description: `Interview for ${testRequest.job.title} position`,
        requirements: testRequest.specifications?.focusAreas || ['Communication', 'Technical Skills', 'Problem Solving'],
        skills: testRequest.specifications?.focusAreas || ['Communication', 'Technical Skills']
      };

      // Determine difficulty from specifications
      const difficulty = testRequest.specifications?.difficulty as 'easy' | 'medium' | 'hard' || 'medium';

      // Create a proper interview session with generated questions
      const interviewSession = await optimizedQuickInterviewService.createJobInterviewSession(
        jobContext,
        difficulty,
        user?._id || ''
      );

      console.log('✅ Interview session created with questions:', interviewSession);

      setJobInterviewSession(interviewSession);
      setJobInterviewOpen(true);
      setSuccess(`Starting interview for ${testRequest.job.title}! Questions have been generated.`);
      
    } catch (error) {
      console.error('Failed to start approved interview:', error);
      setError('Failed to start interview. Please try again.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleInterviewPaymentRequest = async () => {
    if (!selectedJob) return;

    try {
      setPaymentRequestLoading(true);
      
      // Send request to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test-requests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          jobId: selectedJob._id,
          requestType: 'interview',
          notes: `AI Interview request for ${selectedJob.title} position at ${selectedJob.company}`,
          priority: 'normal'
        })
      });

      if (response.ok) {
        setPaymentRequestSent(true);
        setSuccess(`Interview approval request sent successfully for ${selectedJob.title}! You will be notified once approved.`);
        // Refresh approved interviews in case there are any changes
        setTimeout(() => {
          loadApprovedInterviews();
        }, 1000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send approval request');
      }
    } catch (error) {
      console.error('Error sending approval request:', error);
      setError('Failed to send approval request. Please try again.');
    } finally {
      setPaymentRequestLoading(false);
    }
  };

  // =============================================================================
  // INTERVIEW RESULTS NAVIGATION
  // =============================================================================

  const navigateToInterviewResults = () => {
    navigate('/app/interviews/history');
  };

  // =============================================================================
  // INTERVIEW COMPLETION HANDLERS
  // =============================================================================

  const handleJobInterviewComplete = (result: QuickInterviewResult) => {
    console.log('✅ Job interview completed:', result);
    
    // Add to results 
    setInterviewResults(prev => [result, ...prev]);
    
    // Close interface
    setJobInterviewOpen(false);
    setJobInterviewSession(null);
    
    // Navigate to feedback page with sessionId
    navigate(`/app/interviews/feedback/${result.sessionId}`);
  };

  // =============================================================================
  // DIALOG CLOSE HANDLERS
  // =============================================================================

  const handleCloseJobInterview = () => {
    setJobInterviewOpen(false);
    if (jobInterviewSession?.status !== 'completed') {
      setJobInterviewSession(null);
    }
  };

  // =============================================================================
  // RESULTS FUNCTIONS
  // =============================================================================

  const openResultDetails = (result: QuickInterviewResult) => {
    setSelectedResult(result);
    setResultDialogOpen(true);
  };



  // =============================================================================
  // RENDER COMPONENTS
  // =============================================================================

  const JobSelectionDialog = () => (
    <Dialog 
      open={jobSelectionOpen} 
      onClose={() => setJobSelectionOpen(false)}
      maxWidth="md"
      fullWidth
      fullScreen={isSmallScreen}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isSmallScreen ? 0 : 3,
          maxHeight: isSmallScreen ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold" component="div">
          Select a Job for Interview Practice
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a position to generate personalized interview questions
        </Typography>
      </DialogTitle>
      <DialogContent>
        {/* Filters Section */}
        <Box sx={{ mb: 3 }}>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <FilterList />
              <Typography variant="h6">
                Filter Jobs
              </Typography>
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={clearFilters}
                sx={{ ml: 'auto' }}
              >
                Clear All
              </Button>
            </Stack>
            
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Search jobs, companies, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1 }} />
                  }}
                />
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Location</InputLabel>
                  <Select
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                  >
                    <MenuItem value="">All Locations</MenuItem>
                    {getUniqueLocations().map((location) => (
                      <MenuItem key={location} value={location}>
                        {location}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {getUniqueDepartments().map((department) => (
                      <MenuItem key={department} value={department}>
                        {department}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </Stack>
        </Box>
        
        {/* Results Summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredJobs.length} of {jobs.length} jobs
          </Typography>
        </Box>
        
        {loadingJobs ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredJobs.length === 0 && jobs.length > 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              No jobs match your filters
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Clear />}
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredJobs.map((job) => (
              <Grid item xs={12} sm={6} key={job._id} {...({} as any)}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                  onClick={() => handleJobSelection(job)}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Business sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6" fontWeight="bold">
                        {job.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {job.company} • {job.location}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {job.description.substring(0, 100)}...
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {job.skills.slice(0, 3).map((skill, index) => (
                        <Chip key={index} label={skill} size="small" />
                      ))}
                      {job.skills.length > 3 && (
                        <Chip label={`+${job.skills.length - 3} more`} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setJobSelectionOpen(false)}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );

  const ResultDetailsDialog = () => (
    <Dialog
      open={resultDialogOpen}
      onClose={() => setResultDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Interview Results</Typography>
          <IconButton onClick={() => setResultDialogOpen(false)}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedResult && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    {selectedResult.overallScore}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Overall Score
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6">{selectedResult.scores.communication}%</Typography>
                      <Typography variant="body2" color="text.secondary">Communication</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6">{selectedResult.scores.confidence}%</Typography>
                      <Typography variant="body2" color="text.secondary">Confidence</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6">{selectedResult.scores.professionalism}%</Typography>
                      <Typography variant="body2" color="text.secondary">Professionalism</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h6">{selectedResult.scores.technicalKnowledge}%</Typography>
                      <Typography variant="body2" color="text.secondary">Technical Knowledge</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="success.main">
                Strengths
              </Typography>
              <ul>
                {selectedResult.strengths.map((strength, index) => (
                  <li key={index}>
                    <Typography variant="body2">{strength}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
            
            <Box mb={3}>
              <Typography variant="h6" gutterBottom color="warning.main">
                Areas for Improvement
              </Typography>
              <ul>
                {selectedResult.improvements.map((improvement, index) => (
                  <li key={index}>
                    <Typography variant="body2">{improvement}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
            
            <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="body1" fontWeight="bold" gutterBottom>
                Feedback:
              </Typography>
              <Typography variant="body2">
                {selectedResult.feedback}
              </Typography>
            </Paper>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );

  const PaymentApprovalDialog = () => (
    <Dialog 
      open={paymentRequestOpen} 
      onClose={() => setPaymentRequestOpen(false)}
      maxWidth="md"
      fullWidth
      fullScreen={isSmallScreen}
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: isSmallScreen ? 0 : 3,
          maxHeight: isSmallScreen ? '100vh' : '90vh'
        }
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <AdminPanelSettings color="primary" />
          <Typography variant="h6">Interview Payment Request</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {!paymentRequestSent ? (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Premium Interview Details</AlertTitle>
              <Typography variant="body1" sx={{ fontWeight: 'bold', fontSize: '1.1rem', mb: 1 }}>
                💰 Price: 3,000 RWF
              </Typography>
              This is a paid premium AI interview service designed to help you prepare for job-specific interviews with personalized feedback and analysis.
            </Alert>

            <Alert severity="warning" sx={{ mb: 3 }}>
              <AlertTitle>Premium Interview Approval Process</AlertTitle>
              <Typography variant="body2">
                To take this premium job-specific interview, please follow these steps:
                <br /><strong>1.</strong> Click "Send Approval Request" button below to notify our admin
                <br /><strong>2.</strong> Contact us using any of the methods below to discuss payment
                <br /><strong>3.</strong> Complete payment as instructed by our support team
                <br /><strong>4.</strong> Wait for approval from our Super Admin dashboard
                <br /><strong>5.</strong> Return here to take your interview once approved
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
                    <Button
                      size="small"
                      startIcon={<WhatsApp />}
                      href="https://wa.me/250788551906?text=Hi, I want Premium Interview Practice"
                      target="_blank"
                      color="success"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    >
                      Send Message
                    </Button>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Phone color="info" />
                  <Box>
                    <Typography variant="subtitle2">Phone</Typography>
                    <Button
                      size="small"
                      startIcon={<Phone />}
                      href="tel:+250788551906"
                      target="_blank"
                      color="info"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    >
                      +250 788 551 906
                    </Button>
                  </Box>
                </Box>
              </Stack>
            </Paper>

            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Important Instructions:</AlertTitle>
              <Typography variant="body2" component="div">
                <strong>After clicking "Send Approval Request":</strong><br />
                <strong>• Contact us immediately</strong> using any of the contact methods above<br />
                <strong>• Mention:</strong> "I want Premium Interview Practice for {selectedJob?.title}"<br />
                <strong>• Reference:</strong> Your name ({user?.firstName} {user?.lastName}) and email ({user?.email})<br />
                <strong>• Payment:</strong> 3,000 RWF - Our team will provide payment instructions<br />
                <strong>• After payment:</strong> Our Super Admin will approve your interview access<br />
                <strong>• You'll receive:</strong> Email confirmation when your interview is ready to take
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
              Your request has been sent to our Super Admin Interview Management system.
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <AlertTitle>Next Steps - Contact Us Now!</AlertTitle>
              <Typography variant="body2">
                <strong>IMPORTANT:</strong> Please contact us immediately using the contact information above to:
                <br />• Confirm your approval request
                <br />• Get payment instructions
                <br />• Speed up the approval process
                <br />• Schedule your premium interview practice
              </Typography>
            </Alert>
            
            <Typography variant="body2" color="text.secondary">
              <strong>Email:</strong> info@excellencecoachinghub.com<br />
              <strong>WhatsApp/Phone:</strong> +250 788 551 906<br />
              <strong>Cost:</strong> 3,000 RWF
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {!paymentRequestSent ? (
          <>
            <Button 
              onClick={() => setPaymentRequestOpen(false)}
              disabled={paymentRequestLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="contained"
              onClick={handleInterviewPaymentRequest}
              disabled={paymentRequestLoading}
              startIcon={paymentRequestLoading ? <CircularProgress size={20} /> : <AdminPanelSettings />}
              size="large"
              color="primary"
              sx={{
                minWidth: 250,
                minHeight: 48,
                fontSize: '1.1rem',
                fontWeight: 'bold'
              }}
            >
              {paymentRequestLoading ? 'Sending Request...' : 'Send Approval Request'}
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
  );

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box py={4}>
          <Fade in={loading}>
            <Box>
              <Skeleton 
                variant="text" 
                width={isMobile ? "80%" : "50%"} 
                height={isMobile ? 50 : 60} 
              />
              <Skeleton 
                variant="text" 
                width={isMobile ? "60%" : "30%"} 
                height={isMobile ? 30 : 40} 
              />
              <Grid container spacing={isMobile ? 2 : 3} mt={2}>
                {[1, 2].map((i) => (
                  <Grid item xs={12} md={6} key={i}>
                    <Skeleton 
                      variant="rectangular" 
                      height={isMobile ? 180 : 200} 
                      sx={{ borderRadius: 2 }}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Fade>
        </Box>
      </Container>
    );
  }

  return (
    <ProfileAccessGuard user={user} feature="aiInterviews">
      <Box 
        sx={{ 
          minHeight: '100vh',
          background: `linear-gradient(135deg, 
            ${alpha(theme.palette.primary.main, 0.05)} 0%, 
            ${alpha(theme.palette.secondary.main, 0.05)} 50%, 
            ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          pb: 4
        }}
      >
        <Container maxWidth="xl">
          <Box pt={isMobile ? 2 : 4} pb={2}>
            {/* Hero Section */}
            <Fade in timeout={800}>
              <Box 
                textAlign="center" 
                mb={isMobile ? 4 : 6}
                sx={{
                  background: `linear-gradient(135deg, 
                    ${alpha(theme.palette.primary.main, 0.1)} 0%, 
                    ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
                  borderRadius: 4,
                  p: isMobile ? 3 : 4,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}
              >
                <Avatar
                  sx={{
                    width: isMobile ? 60 : 80,
                    height: isMobile ? 60 : 80,
                    mx: 'auto',
                    mb: 2,
                    background: `linear-gradient(135deg, 
                      ${theme.palette.primary.main}, 
                      ${theme.palette.secondary.main})`,
                  }}
                >
                  <Psychology sx={{ fontSize: isMobile ? 30 : 40 }} />
                </Avatar>
                <Typography 
                  variant={isMobile ? "h4" : "h2"} 
                  component="h1" 
                  fontWeight="bold" 
                  gutterBottom
                  sx={{
                    background: `linear-gradient(135deg, 
                      ${theme.palette.primary.main}, 
                      ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  Smart Interview Practice
                </Typography>
                <Typography 
                  variant={isMobile ? "body1" : "h6"} 
                  color="text.secondary"
                  sx={{ maxWidth: 600, mx: 'auto', mb: 2 }}
                >
                  Master your interview skills with AI-powered practice sessions. Get instant feedback, 
                  improve your confidence, and land your dream job.
                </Typography>
                <Stack 
                  direction={isMobile ? "column" : "row"} 
                  spacing={2} 
                  justifyContent="center"
                  alignItems="center"
                  sx={{ mt: 2 }}
                >
                  <Chip
                    icon={<AutoAwesome />}
                    label="AI-Powered Feedback"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Speed />}
                    label="Instant Results"
                    color="success"
                    variant="outlined"
                  />
                  <Chip
                    icon={<Verified />}
                    label="Real Scenarios"
                    color="info"
                    variant="outlined"
                  />
                </Stack>
              </Box>
            </Fade>

            {/* Alerts */}
            {error && (
              <SafeSlideDown in={!!error} mountOnEnter unmountOnExit>
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2,
                    borderRadius: 2,
                    boxShadow: theme.shadows[3]
                  }} 
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              </SafeSlideDown>
            )}

            {success && (
              <SafeSlideDown in={!!success} mountOnEnter unmountOnExit>
                <Alert 
                  severity="success" 
                  sx={{ 
                    mb: 2,
                    borderRadius: 2,
                    boxShadow: theme.shadows[3]
                  }} 
                  onClose={() => setSuccess(null)}
                >
                  {success}
                </Alert>
              </SafeSlideDown>
            )}



            {/* Practice Interview Content */}
            <Box>
                {/* Progress for question generation */}
            {generatingQuestions && (
              <Fade in={generatingQuestions}>
                <Paper 
                  sx={{ 
                    p: 3, 
                    mb: 3,
                    borderRadius: 3,
                    background: `linear-gradient(135deg, 
                      ${alpha(theme.palette.info.main, 0.1)} 0%, 
                      ${alpha(theme.palette.info.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                  }}
                >
                  <Box display="flex" alignItems="center" mb={2}>
                    <CircularProgress size={24} sx={{ mr: 2 }} />
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold">
                        Generating AI-Powered Questions
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Creating personalized interview questions tailored to your selected position...
                      </Typography>
                    </Box>
                  </Box>
                  <LinearProgress 
                    sx={{ 
                      borderRadius: 1,
                      height: 6,
                      backgroundColor: alpha(theme.palette.info.main, 0.1)
                    }} 
                  />
                </Paper>
              </Fade>
            )}

            {/* Approved Interviews Section */}
            {approvedInterviews.length > 0 && (
              <Fade in timeout={800}>
                <Box mb={isMobile ? 4 : 6}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    mb={3}
                    sx={{
                      background: `linear-gradient(135deg, 
                        ${alpha(theme.palette.success.main, 0.1)} 0%, 
                        ${alpha(theme.palette.success.main, 0.05)} 100%)`,
                      borderRadius: 2,
                      p: 2,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }}
                  >
                    <CheckCircle sx={{ 
                      fontSize: 40, 
                      color: theme.palette.success.main,
                      mr: 2 
                    }} />
                    <Box>
                      <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="success.main">
                        Ready to Start - Approved Interviews
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your interview requests have been approved. Click "Start Interview" to begin!
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={isMobile ? 2 : 3}>
                    {approvedInterviews.map((testRequest) => (
                      <Grid item xs={12} sm={6} md={4} key={testRequest._id}>
                        <Slide direction="up" in timeout={600}>
                          <Card 
                            sx={{ 
                              height: '100%',
                              borderRadius: 3,
                              background: `linear-gradient(135deg, 
                                ${alpha(theme.palette.success.main, 0.08)} 0%, 
                                ${alpha(theme.palette.success.light, 0.04)} 100%)`,
                              border: `2px solid ${alpha(theme.palette.success.main, 0.3)}`,
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              position: 'relative',
                              '&:hover': {
                                transform: 'translateY(-8px)',
                                boxShadow: `0 20px 40px ${alpha(theme.palette.success.main, 0.3)}`,
                                border: `2px solid ${alpha(theme.palette.success.main, 0.5)}`
                              }
                            }}
                          >
                            {/* Approved Badge */}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                zIndex: 1
                              }}
                            >
                              <Chip
                                label="APPROVED"
                                color="success"
                                size="small"
                                icon={<Verified />}
                                sx={{ fontWeight: 'bold' }}
                              />
                            </Box>

                            <CardContent sx={{ p: isMobile ? 2 : 3, pb: 1 }}>
                              <Box mb={2}>
                                <Typography 
                                  variant="h6" 
                                  fontWeight="bold" 
                                  gutterBottom
                                  sx={{ pr: 8 }} // Leave space for badge
                                >
                                  {testRequest.job.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {testRequest.job.company}
                                </Typography>
                                {testRequest.title && (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    {testRequest.title}
                                  </Typography>
                                )}
                              </Box>

                              {/* Interview Specifications */}
                              {testRequest.specifications && (
                                <Box mb={2}>
                                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                    <Chip 
                                      size="small" 
                                      label={testRequest.specifications.interviewType || 'Interview'} 
                                      color="info"
                                      sx={{ fontSize: '0.75rem' }}
                                    />
                                    <Chip 
                                      size="small" 
                                      label={`${testRequest.specifications.duration || 30}min`} 
                                      variant="outlined"
                                      sx={{ fontSize: '0.75rem' }}
                                    />
                                    <Chip 
                                      size="small" 
                                      label={`${testRequest.specifications.questionCount || 10}Q`} 
                                      variant="outlined"
                                      sx={{ fontSize: '0.75rem' }}
                                    />
                                    <Chip 
                                      size="small" 
                                      label={testRequest.specifications.difficulty || 'medium'} 
                                      color="warning"
                                      sx={{ fontSize: '0.75rem' }}
                                    />
                                  </Stack>
                                </Box>
                              )}

                              {/* Approval Info */}
                              <Box display="flex" alignItems="center" mb={1}>
                                <AccessTime sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="caption" color="success.main">
                                  Approved {new Date(testRequest.approvedAt!).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </CardContent>

                            <CardActions sx={{ p: isMobile ? 2 : 3, pt: 0 }}>
                              <Button
                                variant="contained"
                                color="success"
                                fullWidth
                                size="large"
                                startIcon={<PlayCircleOutline />}
                                onClick={() => startApprovedInterview(testRequest)}
                                disabled={generatingQuestions}
                                sx={{
                                  py: 1.5,
                                  borderRadius: 2,
                                  fontWeight: 'bold',
                                  fontSize: isMobile ? '0.9rem' : '1rem',
                                  boxShadow: `0 4px 12px ${alpha(theme.palette.success.main, 0.4)}`,
                                  '&:hover': {
                                    background: `linear-gradient(135deg, 
                                      ${theme.palette.success.dark} 0%, 
                                      ${theme.palette.success.main} 100%)`,
                                    transform: 'translateY(-2px)',
                                    boxShadow: `0 6px 16px ${alpha(theme.palette.success.main, 0.5)}`
                                  }
                                }}
                              >
                                {generatingQuestions ? (
                                  <>
                                    <CircularProgress size={16} sx={{ mr: 1 }} />
                                    Starting...
                                  </>
                                ) : (
                                  'Start Interview'
                                )}
                              </Button>
                            </CardActions>
                          </Card>
                        </Slide>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Fade>
            )}

            {/* Main Content */}
            <Grid container spacing={isMobile ? 3 : 4}>
              {/* Job-Specific Interview */}
              <Grid item xs={12} md={8}>
                <Fade in timeout={1200}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      background: `linear-gradient(135deg, 
                        ${alpha(theme.palette.primary.main, 0.08)} 0%, 
                        ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.3)}`,
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`
                      }
                    }}
                  >
                    <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="space-between" 
                        mb={2}
                      >
                        <Box display="flex" alignItems="center">
                          <Avatar
                            sx={{
                              background: `linear-gradient(135deg, 
                                ${theme.palette.primary.main}, 
                                ${theme.palette.primary.light})`,
                              width: isMobile ? 50 : 60,
                              height: isMobile ? 50 : 60,
                              mr: 2
                            }}
                          >
                            <WorkOutline sx={{ fontSize: isMobile ? 24 : 28 }} />
                          </Avatar>
                          <Box>
                            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                              Job-Specific
                            </Typography>
                            <Chip 
                              label="PREMIUM" 
                              color="primary" 
                              size="small"
                              icon={<AdminPanelSettings />}
                            />
                          </Box>
                        </Box>
                        <Lightbulb 
                          sx={{ 
                            fontSize: 40, 
                            color: theme.palette.primary.main,
                            opacity: 0.6
                          }} 
                        />
                      </Box>
                      
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        mb={3}
                        sx={{ lineHeight: 1.6 }}
                      >
                        Advanced preparation! Get role-specific questions tailored to your target position 
                        with detailed performance analytics.
                      </Typography>
                      
                      <Grid container spacing={1} mb={2}>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Psychology sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">5 Questions</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Timer sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">15 Minutes</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Business sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">Role-Based</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <EmojiEvents sx={{ fontSize: 16, mr: 1, color: 'primary.main' }} />
                            <Typography variant="body2">Detailed Feedback</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions sx={{ p: isMobile ? 2 : 3, pt: 0 }}>
                      {selectedJob ? (
                        <Button
                          variant="contained"
                          fullWidth
                          size="large"
                          startIcon={<AdminPanelSettings />}
                          endIcon={<ArrowForward />}
                          onClick={requestInterviewApproval}
                          sx={{
                            background: `linear-gradient(135deg, 
                              ${theme.palette.primary.main} 0%, 
                              ${theme.palette.primary.light} 100%)`,
                            py: isMobile ? 1.5 : 2,
                            borderRadius: 2,
                            fontWeight: 'bold',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`,
                            '&:hover': {
                              background: `linear-gradient(135deg, 
                                ${theme.palette.primary.dark} 0%, 
                                ${theme.palette.primary.main} 100%)`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.5)}`
                            }
                          }}
                        >
                          Start {selectedJob.title.length > 15 && isMobile 
                            ? `${selectedJob.title.substring(0, 15)}...` 
                            : selectedJob.title} Interview
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          fullWidth
                          size="large"
                          startIcon={<Business />}
                          endIcon={<ArrowForward />}
                          onClick={() => setJobSelectionOpen(true)}
                          sx={{ 
                            py: isMobile ? 1.5 : 2,
                            borderRadius: 2,
                            borderWidth: 2,
                            fontWeight: 'bold',
                            fontSize: isMobile ? '0.9rem' : '1rem',
                            '&:hover': {
                              borderWidth: 2,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`
                            }
                          }}
                        >
                          Select Job Position
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>

              {/* Interview Results */}
              <Grid item xs={12} md={4}>
                <Fade in timeout={1400}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      borderRadius: 3,
                      background: `linear-gradient(135deg, 
                        ${alpha(theme.palette.secondary.main, 0.08)} 0%, 
                        ${alpha(theme.palette.secondary.light, 0.04)} 100%)`,
                      border: `2px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 40px ${alpha(theme.palette.secondary.main, 0.3)}`,
                        border: `2px solid ${alpha(theme.palette.secondary.main, 0.4)}`
                      }
                    }}
                  >
                    <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                      <Box 
                        display="flex" 
                        alignItems="center" 
                        justifyContent="space-between" 
                        mb={2}
                      >
                        <Box display="flex" alignItems="center">
                          <Avatar
                            sx={{
                              background: `linear-gradient(135deg, 
                                ${theme.palette.secondary.main}, 
                                ${theme.palette.secondary.light})`,
                              width: isMobile ? 50 : 60,
                              height: isMobile ? 50 : 60,
                              mr: 2
                            }}
                          >
                            <History sx={{ fontSize: isMobile ? 24 : 28 }} />
                          </Avatar>
                          <Box>
                            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                              Results & History
                            </Typography>
                            <Chip 
                              label="TRACK PROGRESS" 
                              color="secondary" 
                              size="small"
                              icon={<Analytics />}
                            />
                          </Box>
                        </Box>
                        <EmojiEvents 
                          sx={{ 
                            fontSize: 40, 
                            color: theme.palette.secondary.main,
                            opacity: 0.6
                          }} 
                        />
                      </Box>
                      
                      <Typography 
                        variant="body1" 
                        color="text.secondary" 
                        mb={3}
                        sx={{ lineHeight: 1.6 }}
                      >
                        View your completed interviews, detailed performance analytics, 
                        and track your progress over time.
                      </Typography>
                      
                      <Grid container spacing={1} mb={2}>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <History sx={{ fontSize: 16, mr: 1, color: 'secondary.main' }} />
                            <Typography variant="body2">All Sessions</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Analytics sx={{ fontSize: 16, mr: 1, color: 'secondary.main' }} />
                            <Typography variant="body2">Detailed Reports</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <TrendingUp sx={{ fontSize: 16, mr: 1, color: 'secondary.main' }} />
                            <Typography variant="body2">Progress Tracking</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <EmojiEvents sx={{ fontSize: 16, mr: 1, color: 'secondary.main' }} />
                            <Typography variant="body2">Score History</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions sx={{ p: isMobile ? 2 : 3, pt: 0 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={<History />}
                        endIcon={<ArrowForward />}
                        onClick={navigateToInterviewResults}
                        sx={{
                          background: `linear-gradient(135deg, 
                            ${theme.palette.secondary.main} 0%, 
                            ${theme.palette.secondary.light} 100%)`,
                          py: isMobile ? 1.5 : 2,
                          borderRadius: 2,
                          fontWeight: 'bold',
                          fontSize: isMobile ? '0.9rem' : '1rem',
                          boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.4)}`,
                          '&:hover': {
                            background: `linear-gradient(135deg, 
                              ${theme.palette.secondary.dark} 0%, 
                              ${theme.palette.secondary.main} 100%)`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 6px 16px ${alpha(theme.palette.secondary.main, 0.5)}`
                          }
                        }}
                      >
                        View Interview Results
                      </Button>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            </Grid>

            {/* Results Section */}
            {interviewResults.length > 0 && (
              <Fade in timeout={1500}>
                <Box mt={isMobile ? 4 : 6}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    mb={3}
                    sx={{
                      background: `linear-gradient(135deg, 
                        ${alpha(theme.palette.secondary.main, 0.1)} 0%, 
                        ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                      borderRadius: 2,
                      p: 2,
                      border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`
                    }}
                  >
                    <EmojiEvents sx={{ 
                      fontSize: 40, 
                      color: theme.palette.secondary.main,
                      mr: 2 
                    }} />
                    <Box>
                      <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
                        Your Interview Results
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Track your progress and improvements over time
                      </Typography>
                    </Box>
                    <Badge 
                      badgeContent={interviewResults.length} 
                      color="secondary"
                      sx={{ ml: 'auto' }}
                    >
                      <Analytics sx={{ fontSize: 32, color: theme.palette.secondary.main }} />
                    </Badge>
                  </Box>
                  <Grid container spacing={isMobile ? 2 : 3}>
                    {interviewResults.map((result, index) => (
                      <Grid item xs={12} md={6} lg={4} key={index}>
                        <Fade in timeout={1500 + (index * 200)}>
                          <Card
                            sx={{
                              borderRadius: 3,
                              background: `linear-gradient(135deg, 
                                ${alpha(result.overallScore >= 80 ? theme.palette.success.main : 
                                  result.overallScore >= 60 ? theme.palette.warning.main : 
                                  theme.palette.error.main, 0.08)} 0%, 
                                ${alpha(result.overallScore >= 80 ? theme.palette.success.light : 
                                  result.overallScore >= 60 ? theme.palette.warning.light : 
                                  theme.palette.error.light, 0.04)} 100%)`,
                              border: `2px solid ${alpha(result.overallScore >= 80 ? theme.palette.success.main : 
                                result.overallScore >= 60 ? theme.palette.warning.main : 
                                theme.palette.error.main, 0.2)}`,
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: `0 12px 24px ${alpha(result.overallScore >= 80 ? theme.palette.success.main : 
                                  result.overallScore >= 60 ? theme.palette.warning.main : 
                                  theme.palette.error.main, 0.2)}`
                              }
                            }}
                          >
                            <CardContent sx={{ p: isMobile ? 2 : 3 }}>
                              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Box display="flex" alignItems="center">
                                  <Avatar
                                    sx={{
                                      width: 40,
                                      height: 40,
                                      mr: 1.5,
                                      background: `linear-gradient(135deg, 
                                        ${result.overallScore >= 80 ? theme.palette.success.main : 
                                          result.overallScore >= 60 ? theme.palette.warning.main : 
                                          theme.palette.error.main}, 
                                        ${result.overallScore >= 80 ? theme.palette.success.light : 
                                          result.overallScore >= 60 ? theme.palette.warning.light : 
                                          theme.palette.error.light})`
                                    }}
                                  >
                                    <Typography variant="h6" color="white" fontWeight="bold">
                                      #{interviewResults.length - index}
                                    </Typography>
                                  </Avatar>
                                  <Box>
                                    <Typography variant="h6" fontWeight="bold">
                                      Interview Session
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      {new Date(result.completedAt).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Chip 
                                  label={`${result.overallScore}%`} 
                                  color={result.overallScore >= 80 ? 'success' : result.overallScore >= 60 ? 'warning' : 'error'}
                                  sx={{ 
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    height: 32
                                  }}
                                />
                              </Box>
                              
                              <Stack direction="row" spacing={2} mb={2}>
                                <Box display="flex" alignItems="center">
                                  <Star sx={{ 
                                    color: 'gold', 
                                    fontSize: 18, 
                                    mr: 0.5 
                                  }} />
                                  <Typography variant="body2">
                                    {result.totalQuestions} Questions
                                  </Typography>
                                </Box>
                                <Box display="flex" alignItems="center">
                                  <Timer sx={{ 
                                    color: theme.palette.info.main, 
                                    fontSize: 18, 
                                    mr: 0.5 
                                  }} />
                                  <Typography variant="body2">
                                    Completed
                                  </Typography>
                                </Box>
                              </Stack>
                              
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  mb: 2,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.4
                                }}
                              >
                                {Array.isArray(result.feedback) 
                                  ? result.feedback[0] || 'No feedback available'
                                  : (result.feedback || 'No feedback available')}
                              </Typography>
                            </CardContent>
                            <CardActions sx={{ p: isMobile ? 2 : 3, pt: 0 }}>
                              <Button
                                variant="outlined"
                                fullWidth
                                size="medium"
                                startIcon={<Visibility />}
                                endIcon={<ArrowForward />}
                                onClick={() => openResultDetails(result)}
                                sx={{
                                  borderRadius: 2,
                                  fontWeight: 'bold',
                                  '&:hover': {
                                    transform: 'translateY(-1px)',
                                    boxShadow: theme.shadows[4]
                                  }
                                }}
                              >
                                View Detailed Report
                              </Button>
                            </CardActions>
                          </Card>
                        </Fade>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Fade>
            )}
            </Box>
          </Box>
        </Container>

        {/* Dialogs */}
        <JobSelectionDialog />
        <ResultDetailsDialog />
        <PaymentApprovalDialog />

        {/* Interview Launcher */}
        {jobInterviewSession && (
          <InterviewLauncher
            open={jobInterviewOpen}
            onClose={handleCloseJobInterview}
            sessionId={jobInterviewSession.id}
            sessionTitle={`${jobInterviewSession.position || 'AI'} Interview`}
            questionCount={jobInterviewSession.questions.length}
            duration={jobInterviewSession.totalDuration}
            loading={generatingQuestions}
          />
        )}
      </Box>
    </ProfileAccessGuard>
  );
};

export default AIInterviewsPage;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
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
  Skeleton,
  useTheme,
  CircularProgress,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
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
  Star
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import ProfileAccessGuard from '../components/ProfileAccessGuard';
import { jobService, Job } from '../services/jobService';
import { optimizedQuickInterviewService, QuickInterviewSession, QuickInterviewResult } from '../services/optimizedQuickInterviewService';
import JobInterviewInterface from '../components/JobInterviewInterface';
import QuickTestInterviewInterface from '../components/QuickTestInterviewInterface';

interface AIInterviewsPageProps {}

const AIInterviewsPage: React.FC<AIInterviewsPageProps> = () => {
  const { user } = useAuth();
  const theme = useTheme();

  // Main states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Job selection states
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobSelectionOpen, setJobSelectionOpen] = useState(false);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Test interview states
  const [testInterviewSession, setTestInterviewSession] = useState<QuickInterviewSession | null>(null);
  const [testInterviewOpen, setTestInterviewOpen] = useState(false);
  const [testInterviewLoading, setTestInterviewLoading] = useState(false);

  // Job interview states  
  const [jobInterviewSession, setJobInterviewSession] = useState<QuickInterviewSession | null>(null);
  const [jobInterviewOpen, setJobInterviewOpen] = useState(false);

  // Results states
  const [interviewResults, setInterviewResults] = useState<QuickInterviewResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<QuickInterviewResult | null>(null);
  const [resultDialogOpen, setResultDialogOpen] = useState(false);

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
      const fetchedJobs = await jobService.getJobs();
      setJobs(fetchedJobs.slice(0, 12)); // Limit to 12 jobs for better UX
    } catch (error) {
      console.error('Error loading jobs:', error);
      setError('Failed to load jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  // =============================================================================
  // JOB SELECTION & QUESTION PRE-GENERATION
  // =============================================================================

  const handleJobSelection = async (job: Job) => {
    try {
      console.log('🎯 Job selected:', job.title);
      setGeneratingQuestions(true);
      setJobSelectionOpen(false);
      setSelectedJob(job);
      
      // Show progress message
      setSuccess(`Generating interview questions for ${job.title} position...`);
      
      // PRE-GENERATE ALL QUESTIONS when job is selected
      const session = await optimizedQuickInterviewService.createJobInterviewSession(
        job,
        'medium', // Default difficulty
        user?._id || ''
      );
      
      setJobInterviewSession(session);
      setSuccess(`✅ Interview questions ready for ${job.title}! Click "Start Interview" to begin.`);
      
      console.log('✅ Interview questions pre-generated successfully');
      
    } catch (error) {
      console.error('Failed to generate interview questions:', error);
      setError('Failed to generate interview questions. Please try again.');
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const startJobInterview = () => {
    if (jobInterviewSession) {
      setJobInterviewOpen(true);
    } else {
      setError('No interview session available. Please select a job first.');
    }
  };

  // =============================================================================
  // TEST INTERVIEW (FREE)
  // =============================================================================

  const startTestInterview = async () => {
    try {
      setTestInterviewLoading(true);
      
      // Create test interview with pre-generated questions
      const session = await optimizedQuickInterviewService.createTestInterviewSession(user?._id || '');
      setTestInterviewSession(session);
      setTestInterviewOpen(true);
      
    } catch (error) {
      console.error('Error starting test interview:', error);
      setError('Failed to start test interview');
    } finally {
      setTestInterviewLoading(false);
    }
  };

  // =============================================================================
  // INTERVIEW COMPLETION HANDLERS
  // =============================================================================

  const handleTestInterviewComplete = (result: QuickInterviewResult) => {
    console.log('✅ Test interview completed:', result);
    
    // Add to results
    setInterviewResults(prev => [result, ...prev]);
    
    // Close interface
    setTestInterviewOpen(false);
    setTestInterviewSession(null);
    
    // Show success
    setSuccess(`Test interview completed! You scored ${result.overallScore}%.`);
  };

  const handleJobInterviewComplete = (result: QuickInterviewResult) => {
    console.log('✅ Job interview completed:', result);
    
    // Add to results 
    setInterviewResults(prev => [result, ...prev]);
    
    // Close interface
    setJobInterviewOpen(false);
    setJobInterviewSession(null);
    
    // Show success
    setSuccess(`Interview completed! You scored ${result.overallScore}%.`);
  };

  // =============================================================================
  // DIALOG CLOSE HANDLERS
  // =============================================================================

  const handleCloseTestInterview = () => {
    setTestInterviewOpen(false);
    if (testInterviewSession?.status !== 'completed') {
      setTestInterviewSession(null);
    }
  };

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
    >
      <DialogTitle>
        <Typography variant="h5" fontWeight="bold">
          Select a Job for Interview Practice
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a position to generate personalized interview questions
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loadingJobs ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={2}>
            {jobs.map((job) => (
              <Grid item xs={12} sm={6} key={job._id}>
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

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box py={4}>
          <Skeleton variant="text" width="50%" height={60} />
          <Skeleton variant="text" width="30%" height={40} />
          <Grid container spacing={3} mt={2}>
            {[1, 2, 3, 4].map((i) => (
              <Grid item xs={12} md={6} lg={3} key={i}>
                <Skeleton variant="rectangular" height={200} />
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <ProfileAccessGuard user={user} feature="aiInterviews">
      <Container maxWidth="xl">
        <Box mb={4}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
                Smart Interview Practice
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Practice with AI-powered interviews and get instant feedback
              </Typography>
            </Box>
          </Box>

          {/* Alerts */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          {/* Progress for question generation */}
          {generatingQuestions && (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography variant="body1">
                  Generating personalized interview questions...
                </Typography>
              </Box>
              <LinearProgress />
            </Paper>
          )}

          {/* Main Content */}
          <Grid container spacing={4}>
            {/* Free Test Interview */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Assessment sx={{ mr: 2, color: 'success.main', fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        Free Test Interview
                      </Typography>
                      <Chip label="FREE" color="success" size="small" />
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.secondary" mb={3}>
                    Practice with our 3-minute general interview to get familiar with the AI interview experience.
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">• 3 general questions</Typography>
                    <Typography variant="body2">• 3 minutes duration</Typography>
                    <Typography variant="body2">• Instant AI feedback</Typography>
                    <Typography variant="body2">• Performance scoring</Typography>
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={testInterviewLoading ? <CircularProgress size={20} color="inherit" /> : <PlayArrow />}
                    disabled={testInterviewLoading}
                    onClick={startTestInterview}
                    sx={{
                      background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                      py: 1.5
                    }}
                  >
                    {testInterviewLoading ? 'Preparing...' : 'Start Test Interview'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Job-Specific Interview */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Business sx={{ mr: 2, color: 'primary.main', fontSize: 40 }} />
                    <Box>
                      <Typography variant="h5" fontWeight="bold">
                        Job-Specific Interview
                      </Typography>
                      <Chip label="AI POWERED" color="primary" size="small" />
                    </Box>
                  </Box>
                  <Typography variant="body1" color="text.secondary" mb={3}>
                    Get personalized interview questions generated specifically for your target job position.
                  </Typography>
                  <Stack spacing={1}>
                    <Typography variant="body2">• 5 job-specific questions</Typography>
                    <Typography variant="body2">• 15 minutes duration</Typography>
                    <Typography variant="body2">• Role-based scenarios</Typography>
                    <Typography variant="body2">• Detailed feedback</Typography>
                  </Stack>
                </CardContent>
                <CardActions>
                  {selectedJob && jobInterviewSession ? (
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<PlayArrow />}
                      onClick={startJobInterview}
                      sx={{
                        background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                        py: 1.5
                      }}
                    >
                      Start {selectedJob.title} Interview
                    </Button>
                  ) : (
                    <Button
                      variant="outlined"
                      fullWidth
                      size="large"
                      startIcon={<Business />}
                      onClick={() => setJobSelectionOpen(true)}
                      disabled={generatingQuestions}
                      sx={{ py: 1.5 }}
                    >
                      {generatingQuestions ? 'Generating Questions...' : 'Select Job Position'}
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          </Grid>

          {/* Results Section */}
          {interviewResults.length > 0 && (
            <Box mt={6}>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                Your Interview Results
              </Typography>
              <Grid container spacing={3}>
                {interviewResults.map((result, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" fontWeight="bold">
                            Interview #{interviewResults.length - index}
                          </Typography>
                          <Chip 
                            label={`${result.overallScore}%`} 
                            color={result.overallScore >= 80 ? 'success' : result.overallScore >= 60 ? 'warning' : 'error'}
                            sx={{ fontWeight: 'bold' }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Completed: {new Date(result.completedAt).toLocaleDateString()}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                          <Star sx={{ color: 'gold', fontSize: 20 }} />
                          <Typography variant="body2">
                            {result.totalQuestions} questions answered
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          {result.feedback.substring(0, 100)}...
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => openResultDetails(result)}
                        >
                          View Details
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>

        {/* Dialogs */}
        <JobSelectionDialog />
        <ResultDetailsDialog />

        {/* Interview Interfaces */}
        {testInterviewSession && (
          <QuickTestInterviewInterface
            key={`test-${testInterviewSession.id}`}
            open={testInterviewOpen}
            onClose={handleCloseTestInterview}
            session={testInterviewSession}
            onComplete={handleTestInterviewComplete}
          />
        )}

        {jobInterviewSession && (
          <JobInterviewInterface
            key={`job-${jobInterviewSession.id}`}
            open={jobInterviewOpen}
            onClose={handleCloseJobInterview}
            session={jobInterviewSession}
            onComplete={handleJobInterviewComplete}
          />
        )}
      </Container>
    </ProfileAccessGuard>
  );
};

export default AIInterviewsPage;
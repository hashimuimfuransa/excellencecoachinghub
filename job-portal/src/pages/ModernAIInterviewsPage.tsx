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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  Skeleton,
  useTheme,
  alpha,
  Avatar,
  Fab,
  Tooltip,
  Badge,
  LinearProgress,
  CircularProgress,
  IconButton,
  Zoom,
  Fade,
  Slide
} from '@mui/material';
import {
  Psychology,
  PlayArrow,
  Schedule,
  Assignment,
  TrendingUp,
  Star,
  Add,
  History,
  Assessment,
  MicExternalOn,
  VideoCall,
  SmartToy,
  WorkOutline,
  CheckCircle,
  School,
  Business,
  Person,
  Close,
  Info,
  Launch,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import ProfileAccessGuard from '../components/ProfileAccessGuard';
import ModernInterviewInterface from '../components/ModernInterviewInterface';
import {
  modernInterviewService,
  JobRole,
  InterviewSession,
  InterviewResult
} from '../services/modernInterviewService';
import { avatarTalkService } from '../services/avatarTalkService';
import { userService } from '../services/userService';

const ModernAIInterviewsPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobRoles, setJobRoles] = useState<JobRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<InterviewSession[]>([]);
  const [setupDialogOpen, setSetupDialogOpen] = useState(false);
  const [avatarConfigured, setAvatarConfigured] = useState(false);
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [freshUserData, setFreshUserData] = useState<any>(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [realJobs, setRealJobs] = useState<JobRole[]>([]);
  const [freeInterviewStatus, setFreeInterviewStatus] = useState({
    hasUsedFree: false,
    remainingFreeTests: 1,
    canUseFree: true
  });
  const [jobSelectionOpen, setJobSelectionOpen] = useState(false);
  const [showResults, setShowResults] = useState<InterviewResult | null>(null);

  useEffect(() => {
    initializePage();
  }, []);

  const fetchFreshUserData = async () => {
    try {
      if (!user?._id) return;
      
      console.log('🔍 ModernAIInterviewsPage fetching fresh user data for:', user._id);
      const freshUser = await userService.getUserProfile(user._id);
      console.log('📋 ModernAIInterviewsPage received fresh user data:', freshUser);
      setFreshUserData(freshUser);
    } catch (error) {
      console.error('❌ Error fetching fresh user data:', error);
      // Fallback to auth user data
      setFreshUserData(user);
    } finally {
      setUserDataLoading(false);
    }
  };

  const initializePage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check AvatarTalk configuration
      setAvatarConfigured(avatarTalkService.isConfigured());
      
      // Load job roles, history, real jobs, free status, and fresh user data in parallel
      const promises = [
        modernInterviewService.getJobRoles(),
        modernInterviewService.getInterviewHistory(),
        modernInterviewService.getRealJobsForInterview(),
        modernInterviewService.getFreeInterviewStatus()
      ];

      // Fetch fresh user data
      if (user?._id) {
        promises.push(fetchFreshUserData());
      }
      
      const [roles, history, jobs, freeStatus] = await Promise.all(promises);
      
      setJobRoles(roles);
      setInterviewHistory(history);
      setRealJobs(jobs);
      setFreeInterviewStatus(freeStatus);
      
    } catch (error) {
      console.error('Failed to initialize page:', error);
      setError('Failed to load interview data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartInterview = async (role: JobRole) => {
    if (!avatarConfigured) {
      setError('AvatarTalk service is not configured. Please check your API credentials.');
      return;
    }

    // Check if this is a free interview and if user can use it
    if (role.interviewType === 'free' && !freeInterviewStatus.canUseFree) {
      setError('You have already used your free interview. Upgrade to premium to continue practicing.');
      setPaymentRequired(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Create new interview session
      const session = await modernInterviewService.createInterviewSession(role.id, role.title);
      
      // Start the session
      await modernInterviewService.startInterviewSession(session.id);
      
      setInterviewSession({
        ...session,
        status: 'in-progress',
        startedAt: new Date()
      });
      
      setSelectedRole(role);
      
      // If this was a free interview, update the status
      if (role.interviewType === 'free') {
        setFreeInterviewStatus(prev => ({
          ...prev,
          remainingFreeTests: prev.remainingFreeTests - 1,
          canUseFree: prev.remainingFreeTests > 1
        }));
      }
      
    } catch (error) {
      console.error('Failed to start interview:', error);
      setError('Failed to start interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelection = (selectedJob: JobRole) => {
    setSelectedRole(selectedJob);
    setJobSelectionOpen(false);
    handleStartInterview(selectedJob);
  };

  const handleCompleteInterview = async (result: InterviewResult) => {
    try {
      setInterviewSession(null);
      
      // Refresh history
      const history = await modernInterviewService.getInterviewHistory();
      setInterviewHistory(history);
      
      // Navigate to results page
      navigate(`/app/interviews/results/${result.sessionId}`);
      
    } catch (error) {
      console.error('Failed to complete interview:', error);
      setError('Interview completed but failed to save results.');
    }
  };

  const handleCloseInterview = () => {
    setInterviewSession(null);
    setSelectedRole(null);
  };

  const handleViewResult = (sessionId: string) => {
    navigate(`/app/interviews/results/${sessionId}`);
  };

  const simulatePayment = () => {
    // Simulate payment process
    setPaymentRequired(false);
    setSetupDialogOpen(false);
    // Would integrate with actual payment system
  };

  const getRoleIcon = (department: string) => {
    switch (department.toLowerCase()) {
      case 'engineering': return <School color="primary" />;
      case 'product': return <Business color="secondary" />;
      case 'design': return <Person color="info" />;
      default: return <WorkOutline />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'entry': return 'success';
      case 'mid': return 'warning';
      case 'senior': return 'error';
      case 'lead': return 'secondary';
      default: return 'default';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'success';
    if (score >= 75) return 'warning';
    if (score >= 65) return 'info';
    return 'error';
  };

  if (loading && jobRoles.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="text" width={500} height={24} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item}>
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!user || userDataLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading user data...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <ProfileAccessGuard user={freshUserData || user} feature="aiInterviews">
      <Box sx={{ 
        minHeight: '100vh', 
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #0c0c1e 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        py: 4
      }}>
        <Container maxWidth="lg">
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Stack direction="row" justifyContent="center" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Avatar sx={{ 
                bgcolor: 'primary.main', 
                width: 64, 
                height: 64,
                boxShadow: theme.shadows[8] 
              }}>
                <SmartToy sx={{ fontSize: 32 }} />
              </Avatar>
              <Box>
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: 'white',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  AI Interview Hub
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.9)',
                    fontWeight: 300
                  }}
                >
                  Practice with AI-Powered Video Interviews
                </Typography>
              </Box>
            </Stack>
            
            {!avatarConfigured && (
              <Alert severity="warning" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                <AlertTitle>AvatarTalk Configuration Required</AlertTitle>
                The AvatarTalk API is not properly configured. Please check your environment variables.
              </Alert>
            )}

            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" sx={{ mb: 4 }}>
              <Chip 
                icon={<VideoCall />} 
                label="AI-Powered Avatars" 
                variant="outlined" 
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
              <Chip 
                icon={<MicExternalOn />} 
                label="Voice & Text Responses" 
                variant="outlined" 
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
              <Chip 
                icon={<Assessment />} 
                label="Instant Feedback" 
                variant="outlined" 
                sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
              />
            </Stack>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<WorkOutline />}
                onClick={() => setJobSelectionOpen(true)}
                sx={{
                  background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E8E 90%)',
                  boxShadow: theme.shadows[8],
                  px: 4,
                  py: 1.5
                }}
              >
                Practice with Real Jobs
              </Button>
              
              {freeInterviewStatus.canUseFree && (
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Star />}
                  onClick={() => {
                    const freeRole = jobRoles.find(r => r.interviewType === 'free');
                    if (freeRole) handleStartInterview(freeRole);
                  }}
                  sx={{
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Free Practice ({freeInterviewStatus.remainingFreeTests} left)
                </Button>
              )}
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Job Roles Grid */}
          <Grid container spacing={3} sx={{ mb: 6 }}>
            <Grid item xs={12}>
              <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                Choose Your Interview Role
              </Typography>
            </Grid>
            
            {jobRoles.map((role) => (
              <Grid item xs={12} sm={6} md={4} key={role.id}>
                <Zoom in={true} style={{ transitionDelay: `${jobRoles.indexOf(role) * 100}ms` }}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      transition: 'all 0.3s ease-in-out',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        background: 'rgba(255,255,255,0.2)',
                        boxShadow: theme.shadows[12]
                      }
                    }}
                    onClick={() => avatarConfigured && handleStartInterview(role)}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          {getRoleIcon(role.department)}
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {role.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              {role.department}
                            </Typography>
                          </Box>
                          <Chip 
                            label={role.level.toUpperCase()} 
                            color={getLevelColor(role.level) as any}
                            size="small" 
                            variant="outlined"
                          />
                        </Stack>

                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          {role.description}
                        </Typography>

                        <Box>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1, display: 'block' }}>
                            Key Skills:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap">
                            {role.skills.slice(0, 3).map((skill) => (
                              <Chip
                                key={skill}
                                label={skill}
                                size="small"
                                sx={{ 
                                  backgroundColor: 'rgba(255,255,255,0.2)',
                                  color: 'white',
                                  fontSize: '0.7rem'
                                }}
                              />
                            ))}
                            {role.skills.length > 3 && (
                              <Chip
                                label={`+${role.skills.length - 3} more`}
                                size="small"
                                sx={{ 
                                  backgroundColor: 'rgba(255,255,255,0.1)',
                                  color: 'rgba(255,255,255,0.7)',
                                  fontSize: '0.7rem'
                                }}
                              />
                            )}
                          </Stack>
                        </Box>
                      </Stack>
                    </CardContent>

                    <CardActions sx={{ px: 3, pb: 3 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<PlayArrow />}
                        disabled={!avatarConfigured}
                        sx={{
                          borderRadius: 2,
                          py: 1.5,
                          background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #5a67d8 30%, #6b46c1 90%)',
                          }
                        }}
                      >
                        Start 3-Min Interview
                      </Button>
                    </CardActions>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>

          {/* Interview History */}
          {interviewHistory.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
                Your Interview History
              </Typography>
              
              <Grid container spacing={2}>
                {interviewHistory.slice(0, 6).map((session, index) => (
                  <Grid item xs={12} sm={6} md={4} key={session.id}>
                    <Fade in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          background: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            background: 'rgba(255,255,255,0.2)',
                          }
                        }}
                        onClick={() => handleViewResult(session.id)}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ bgcolor: session.status === 'completed' ? 'success.main' : 'warning.main' }}>
                            {session.status === 'completed' ? <CheckCircle /> : <Schedule />}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                              {session.jobTitle}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                              {new Date(session.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <IconButton size="small" sx={{ color: 'white' }}>
                            <Launch fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Paper>
                    </Fade>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Quick Stats */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {interviewHistory.length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Interviews Completed
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {jobRoles.length}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Available Roles
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 3,
                  background: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                  3:00
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Minutes per Interview
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Floating Action Button for Refresh */}
          <Fab
            color="secondary"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              boxShadow: theme.shadows[8]
            }}
            onClick={initializePage}
          >
            <Refresh />
          </Fab>
        </Container>

        {/* Interview Interface Dialog */}
        {interviewSession && (
          <ModernInterviewInterface
            session={interviewSession}
            open={!!interviewSession}
            onClose={handleCloseInterview}
            onComplete={handleCompleteInterview}
          />
        )}

        {/* Job Selection Dialog */}
        <Dialog
          open={jobSelectionOpen}
          onClose={() => setJobSelectionOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }
          }}
        >
          <DialogTitle sx={{ textAlign: 'center', color: 'white' }}>
            <Stack spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'success.main', width: 64, height: 64 }}>
                <Assessment sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h5" fontWeight="bold">
                Interview Results
              </Typography>
            </Stack>
          </DialogTitle>

          <DialogContent sx={{ p: 4 }}>
            {showResults && (
              <Stack spacing={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {showResults.score}/100
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={showResults.score}
                    sx={{
                      mt: 2,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: showResults.score >= 75 ? '#4caf50' : showResults.score >= 60 ? '#ff9800' : '#f44336'
                      }
                    }}
                  />
                </Box>

                <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.9)' }}>
                  <Typography variant="body1" color="text.primary">
                    {showResults.overallFeedback}
                  </Typography>
                </Paper>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={2}>
                      <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUp color="success" /> Strengths
                      </Typography>
                      {showResults.strengths.map((strength, index) => (
                        <Chip
                          key={index}
                          label={strength}
                          color="success"
                          variant="outlined"
                          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                        />
                      ))}
                    </Stack>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Stack spacing={2}>
                      <Typography variant="h6" sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assignment color="warning" /> Improvements
                      </Typography>
                      {showResults.improvements.map((improvement, index) => (
                        <Chip
                          key={index}
                          label={improvement}
                          color="warning"
                          variant="outlined"
                          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                        />
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </Stack>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setShowResults(null)} variant="outlined" sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
              Close
            </Button>
            <Button variant="contained" color="primary" startIcon={<PlayArrow />}>
              Try Again
            </Button>
          </DialogActions>
        </Dialog>

        {/* Job Selection Dialog */}
        <Dialog
          open={jobSelectionOpen}
          onClose={() => setJobSelectionOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)'
            }
          }}
        >
          <DialogTitle sx={{ color: 'white', textAlign: 'center', pb: 2 }}>
            <Typography variant="h5" fontWeight="bold">
              Select a Job for Interview Practice
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1 }}>
              Choose from real job postings to get professional interview practice
            </Typography>
          </DialogTitle>
          
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {realJobs.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress sx={{ color: 'white', mb: 2 }} />
                    <Typography sx={{ color: 'white' }}>
                      Loading available jobs...
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                realJobs.map((job) => (
                  <Grid item xs={12} sm={6} md={4} key={job.id}>
                    <Card
                      sx={{
                        background: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          background: 'rgba(255,255,255,0.2)',
                          boxShadow: theme.shadows[8]
                        }
                      }}
                      onClick={() => handleJobSelection(job)}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Stack spacing={2}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                              <WorkOutline />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold', fontSize: '1rem' }}>
                                {job.title}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                {job.company}
                              </Typography>
                            </Box>
                          </Stack>

                          <Box>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              Location
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'white' }}>
                              {job.location || 'Remote'}
                            </Typography>
                          </Box>

                          {job.salary && (
                            <Box>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                                Salary
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'white' }}>
                                {job.salary}
                              </Typography>
                            </Box>
                          )}

                          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                            {job.skills.slice(0, 3).map((skill, index) => (
                              <Chip
                                key={index}
                                label={skill}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.2)',
                                  color: 'white',
                                  fontSize: '0.7rem'
                                }}
                              />
                            ))}
                            {job.skills.length > 3 && (
                              <Chip
                                label={`+${job.skills.length - 3}`}
                                size="small"
                                sx={{
                                  bgcolor: 'rgba(255,255,255,0.2)',
                                  color: 'white',
                                  fontSize: '0.7rem'
                                }}
                              />
                            )}
                          </Stack>

                          <Chip
                            label="Premium Interview"
                            color="warning"
                            size="small"
                            sx={{ alignSelf: 'flex-start' }}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, justifyContent: 'center' }}>
            <Button
              onClick={() => setJobSelectionOpen(false)}
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ProfileAccessGuard>
  );
};

export default ModernAIInterviewsPage;
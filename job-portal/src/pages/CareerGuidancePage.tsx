import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Fab,
  Badge,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Work as WorkIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  School as SchoolIcon,
  Star as StarIcon,
  CheckCircle as CheckIcon,
  PlayArrow as PlayIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  ArrowForward,
  Chat as ChatIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Close as CloseIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  BusinessCenter as BusinessIcon,
  EmojiEvents as AchievementIcon,
  Lightbulb as InsightIcon,
  Timeline as RoadmapIcon
} from '@mui/icons-material';

import { useAuth } from '../contexts/AuthContext';
import careerGuidanceService, {
  IJobReadinessAssessment,
  IJobReadinessResult,
  ICareerPathAnalysis
} from '../services/careerGuidanceService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CareerGuidancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<IJobReadinessAssessment[]>([]);
  const [latestResults, setLatestResults] = useState<IJobReadinessResult | null>(null);
  const [careerAnalysis, setCareerAnalysis] = useState<ICareerPathAnalysis | null>(null);
  const [jobMatches, setJobMatches] = useState<any[]>([]);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.firstName}! 👋 I'm your AI Career Mentor specializing in job readiness and career development. I can help you with interview preparation, skill development, job matching, and career advice. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [assessmentsData, jobMatchesData] = await Promise.allSettled([
        careerGuidanceService.getUserAssessments(),
        careerGuidanceService.getJobMatchingResults()
      ]);

      if (assessmentsData.status === 'fulfilled' && assessmentsData.value) {
        setAssessments(assessmentsData.value.assessments || []);
      }

      if (jobMatchesData.status === 'fulfilled' && jobMatchesData.value) {
        setJobMatches(jobMatchesData.value.matches || []);
      }

      // Load latest results if available
      const latestResult = await careerGuidanceService.getLatestJobReadinessResult();
      setLatestResults(latestResult);

      // Load career analysis if available
      if (latestResult) {
        try {
          const analysis = await careerGuidanceService.getCareerPathAnalysis();
          setCareerAnalysis(analysis);
        } catch (error) {
          console.error('Error loading career analysis:', error);
        }
      }

    } catch (error) {
      console.error('Error loading career guidance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = async () => {
    try {
      const assessment = await careerGuidanceService.generateJobReadinessAssessment();
      navigate(`/app/career/assessment/${assessment.assessmentId}`);
    } catch (error) {
      console.error('Error starting assessment:', error);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      const response = await careerGuidanceService.getChatMentorResponse(
        chatInput.trim(),
        chatMessages.map(msg => ({ role: msg.role, content: msg.content })),
        'job_portal'
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(response.timestamp)
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting chat response:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const readinessScore = latestResults ? 
    careerGuidanceService.calculateOverallReadinessScore(latestResults) : null;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  const hasCompletedAssessment = assessments.some(a => a.type === 'job_readiness' && a.isCompleted);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🎯 Career Guidance Center
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Assess your job readiness, discover career paths, and get matched with opportunities
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {readinessScore?.overallScore || 0}
              </Typography>
              <Typography variant="body2">Job Readiness Score</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <WorkIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {jobMatches.length}
              </Typography>
              <Typography variant="body2">Job Matches</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {careerAnalysis?.recommendedPaths.length || 0}
              </Typography>
              <Typography variant="body2">Career Paths</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SchoolIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                {latestResults?.learningRecommendations.length || 0}
              </Typography>
              <Typography variant="body2">Course Recommendations</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Job Readiness Assessment */}
          <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <PsychologyIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Job Readiness Assessment
              </Typography>
            </Box>

            {hasCompletedAssessment && latestResults ? (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  🎉 Assessment Complete! Your job readiness profile is ready.
                </Alert>

                {/* Readiness Score Breakdown */}
                {readinessScore && (
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'primary.main', borderRadius: 2, color: 'white' }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {readinessScore.overallScore}%
                        </Typography>
                        <Typography variant="h6">Overall Readiness</Typography>
                        <Chip 
                          label={readinessScore.readinessLevel} 
                          sx={{ mt: 1, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                        />
                      </Box>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>Score Breakdown:</Typography>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Personality Match</Typography>
                          <Typography variant="body2">{readinessScore.breakdown.personalityMatch}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={readinessScore.breakdown.personalityMatch} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Skills Proficiency</Typography>
                          <Typography variant="body2">{readinessScore.breakdown.skillsProficiency}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={readinessScore.breakdown.skillsProficiency} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Technical Readiness</Typography>
                          <Typography variant="body2">{readinessScore.breakdown.technicalReadiness}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={readinessScore.breakdown.technicalReadiness} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">Behavioral Fit</Typography>
                          <Typography variant="body2">{readinessScore.breakdown.behavioralFit}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={readinessScore.breakdown.behavioralFit} 
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                )}

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      const completedAssessment = assessments.find(a => a.isCompleted);
                      if (completedAssessment) {
                        navigate(`/app/career/assessment/${completedAssessment.id}/results`);
                      }
                    }}
                    startIcon={<InsightIcon />}
                  >
                    View Detailed Results
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => careerGuidanceService.generateCareerReport()}
                    startIcon={<DownloadIcon />}
                  >
                    Download Report
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleStartAssessment}
                    startIcon={<PlayIcon />}
                  >
                    Retake Assessment
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                  Take our comprehensive Job Readiness Assessment to evaluate your preparedness 
                  for the job market and get personalized recommendations for improvement.
                </Typography>

                <Box sx={{ bgcolor: 'grey.50', p: 3, borderRadius: 2, mb: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
                    Assessment Includes:
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Professional Competencies" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Technical Aptitude" />
                        </ListItem>
                      </List>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <List dense>
                        <ListItem>
                          <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Behavioral Assessment" />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon><CheckIcon color="success" /></ListItemIcon>
                          <ListItemText primary="Work Readiness Evaluation" />
                        </ListItem>
                      </List>
                    </Grid>
                  </Grid>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  onClick={handleStartAssessment}
                  startIcon={<PlayIcon />}
                  sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                >
                  Start Job Readiness Assessment
                </Button>
              </Box>
            )}
          </Paper>

          {/* Career Path Recommendations */}
          {careerAnalysis && (
            <Paper sx={{ p: 4, mb: 4, borderRadius: 2, boxShadow: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <RoadmapIcon sx={{ fontSize: 32, mr: 2, color: 'secondary.main' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  Recommended Career Paths
                </Typography>
              </Box>

              <Grid container spacing={3}>
                {careerAnalysis.recommendedPaths.slice(0, 3).map((path, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {path.careerPath}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {path.industry}
                        </Typography>
                        
                        <Box sx={{ mb: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={path.matchPercentage}
                            sx={{ height: 8, borderRadius: 4, mb: 1 }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {path.matchPercentage}% Match
                          </Typography>
                        </Box>

                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
                          Average Salary: {path.averageSalary}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                          Growth: {path.growthOutlook}
                        </Typography>

                        <Typography variant="caption" color="text.secondary">
                          Key Skills: {path.requiredSkills.slice(0, 3).join(', ')}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Job Matches */}
          {jobMatches.length > 0 && (
            <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <BusinessIcon sx={{ fontSize: 32, mr: 2, color: 'success.main' }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  Your Job Matches
                </Typography>
              </Box>

              <List>
                {jobMatches.slice(0, 5).map((job, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemIcon>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {job.company.charAt(0)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {job.jobTitle}
                            </Typography>
                            <Chip 
                              label={`${job.matchPercentage}% Match`} 
                              color="success" 
                              variant="outlined" 
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {job.company} • {job.location}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                              {job.salaryRange}
                            </Typography>
                            {job.missingSkills.length > 0 && (
                              <Typography variant="caption" color="warning.main">
                                Skills to develop: {job.missingSkills.slice(0, 2).join(', ')}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < jobMatches.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>

              <Button
                variant="contained"
                onClick={() => navigate('/app/jobs')}
                sx={{ mt: 2 }}
              >
                View All Jobs
              </Button>
            </Paper>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* AI Insights */}
          {latestResults && (
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <InsightIcon sx={{ mr: 1 }} />
                AI Insights
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
                "{latestResults.aiInsights.summary}"
              </Typography>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                Key Recommendations:
              </Typography>
              <List dense>
                {latestResults.aiInsights.keyRecommendations.slice(0, 3).map((rec, index) => (
                  <ListItem key={index}>
                    <ListItemIcon><StarIcon color="warning" fontSize="small" /></ListItemIcon>
                    <ListItemText primary={rec} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}

          {/* Learning Recommendations */}
          {latestResults && latestResults.learningRecommendations.length > 0 && (
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1 }} />
                Recommended Courses
              </Typography>

              {latestResults.learningRecommendations.slice(0, 3).map((course, index) => (
                <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < 2 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {course.courseName}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <Chip 
                      label={course.priority.toUpperCase()} 
                      size="small"
                      color={course.priority === 'high' ? 'error' : course.priority === 'medium' ? 'warning' : 'info'}
                    />
                    <Chip label={course.estimatedDuration} size="small" variant="outlined" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Skills: {course.skillsToGain.slice(0, 2).join(', ')}
                  </Typography>
                </Box>
              ))}

              <Button 
                variant="text" 
                size="small"
                onClick={() => window.open('/elearning', '_blank')}
              >
                Explore E-learning Platform
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>

      {/* AI Career Mentor Chat */}
      <Fab
        onClick={() => setChatOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
        }}
      >
        <Badge badgeContent={chatMessages.length > 1 ? chatMessages.length - 1 : 0} color="error">
          <ChatIcon />
        </Badge>
      </Fab>

      {/* Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2, maxHeight: '80vh' }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BotIcon sx={{ mr: 1.5 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              AI Career Mentor
            </Typography>
          </Box>
          <IconButton onClick={() => setChatOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, height: 400 }}>
          <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
              {chatMessages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    mb: 2,
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '80%',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: message.role === 'user' ? 'primary.main' : 'grey.100',
                      color: message.role === 'user' ? 'white' : 'text.primary'
                    }}
                  >
                    <Typography variant="body2">
                      {message.content}
                    </Typography>
                  </Box>
                </Box>
              ))}
              {chatLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'grey.100' }}>
                    <CircularProgress size={20} />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', width: '100%', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Ask about job readiness, interview tips, career advice..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
              disabled={chatLoading}
            />
            <Button
              variant="contained"
              onClick={handleChatSend}
              disabled={!chatInput.trim() || chatLoading}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              <SendIcon />
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CareerGuidancePage;
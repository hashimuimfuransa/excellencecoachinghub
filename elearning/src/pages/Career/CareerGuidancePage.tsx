import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
  styled,
  alpha,
  Fab,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  WorkOutline as WorkIcon,
  AutoAwesome as SparklesIcon,
  Timeline as RoadmapIcon,
  CheckCircle as CheckIcon,
  PlayArrow as StartIcon,
  Chat as ChatIcon,
  EmojiEvents as AchievementIcon,
  Star as StarIcon,
  ExpandMore as ExpandMoreIcon,
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Close as CloseIcon,
  Assignment as AssessmentIcon,
  Lightbulb as InsightIcon
} from '@mui/icons-material';

import { useAuth } from '../../store/AuthContext';
import careerGuidanceService, { 
  ICareerAssessment,
  ICareerAssessmentResult,
  IPersonalizedGuidance,
  ISuccessStory
} from '../../services/careerGuidanceService';

const GradientCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[12],
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
  }
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: 'white',
  borderRadius: theme.spacing(2),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    background: 'rgba(255, 255, 255, 0.1)',
    transform: 'skewX(-15deg)',
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: 'none',
  '&.primary': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
    color: 'white',
    '&:hover': {
      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[8],
    }
  }
}));

const ChatFab = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
  }
}));

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const CareerGuidancePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  const [loading, setLoading] = useState(true);
  const [assessmentLoading, setAssessmentLoading] = useState(false);
  const [assessments, setAssessments] = useState<ICareerAssessment[]>([]);
  const [guidance, setGuidance] = useState<IPersonalizedGuidance | null>(null);
  const [successStories, setSuccessStories] = useState<ISuccessStory[]>([]);
  const [latestResults, setLatestResults] = useState<ICareerAssessmentResult | null>(null);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello ${user?.firstName}! 👋 I'm your AI Career Mentor. I'm here to help you with career guidance, course recommendations, and answer any questions about your professional development. How can I assist you today?`,
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assessmentsData, guidanceData, storiesData] = await Promise.allSettled([
        careerGuidanceService.getCareerAssessments(),
        careerGuidanceService.getPersonalizedGuidance(),
        careerGuidanceService.getSuccessStories(undefined, 6)
      ]);

      if (assessmentsData.status === 'fulfilled') {
        setAssessments(assessmentsData.value.assessments);
      }

      if (guidanceData.status === 'fulfilled') {
        setGuidance(guidanceData.value);
      }

      if (storiesData.status === 'fulfilled') {
        setSuccessStories(storiesData.value.stories);
      }

      // Load latest results if available
      const latestResult = await careerGuidanceService.getLatestCareerAssessmentResult();
      setLatestResults(latestResult);

    } catch (error) {
      console.error('Error loading career guidance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAssessment = async () => {
    try {
      setAssessmentLoading(true);
      const assessment = await careerGuidanceService.generateCareerDiscoveryAssessment();
      navigate(`/dashboard/student/career/assessment/${assessment.assessmentId}`);
    } catch (error) {
      console.error('Error starting assessment:', error);
      // Show error message to user
      // TODO: Add proper error handling with snackbar/toast
    } finally {
      setAssessmentLoading(false);
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
        chatMessages.map(msg => ({ role: msg.role, content: msg.content }))
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  const hasCompletedAssessment = assessments.some(a => a.type === 'career_discovery' && a.isCompleted);
  const completedAssessments = assessments.filter(a => a.isCompleted).length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant={isMobile ? "h3" : "h2"} component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          🚀 Career Guidance Hub
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          Discover your ideal career path with AI-powered guidance and personalized recommendations
        </Typography>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <AssessmentIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {assessments.length}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Assessments Available
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <CheckIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {completedAssessments}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Completed
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <InsightIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {latestResults ? latestResults.careerRecommendations.length : 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Career Matches
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <TrendingUpIcon sx={{ fontSize: 40, mb: 1, opacity: 0.9 }} />
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                {guidance?.progressTracking.completedMilestones || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Milestones
              </Typography>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Main Content */}
        <Grid item xs={12} md={8}>
          {/* Assessment Section */}
          <GradientCard sx={{ mb: 4 }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <PsychologyIcon color="primary" sx={{ fontSize: 32, mr: 2 }} />
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  Career Discovery Assessment
                </Typography>
              </Box>

              {hasCompletedAssessment ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                    🎉 Congratulations! You've completed your career assessment. Check your results below.
                  </Alert>
                  
                  {latestResults && (
                    <Box sx={{ p: 3, background: alpha(theme.palette.success.main, 0.05), borderRadius: 2, mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'success.main' }}>
                        Your Career Profile Summary
                      </Typography>
                      <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.7 }}>
                        {latestResults.aiInsights.summary}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        Primary Personality Type: {latestResults.personalityProfile.primaryType}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {latestResults.personalityProfile.strengths.slice(0, 3).map((strength, index) => (
                          <Chip key={index} label={strength} color="success" size="small" />
                        ))}
                      </Box>
                    </Box>
                  )}

                  <ActionButton 
                    variant="outlined" 
                    onClick={() => {
                      const completedAssessment = assessments.find(a => a.type === 'career_discovery' && a.isCompleted);
                      if (completedAssessment) {
                        navigate(`/dashboard/student/career/assessment/${completedAssessment.id}/results`);
                      }
                    }}
                    sx={{ mr: 2 }}
                  >
                    View Detailed Results
                  </ActionButton>
                  <ActionButton 
                    variant="outlined"
                    onClick={handleStartAssessment}
                    disabled={assessmentLoading}
                    startIcon={assessmentLoading ? <CircularProgress size={20} /> : undefined}
                  >
                    {assessmentLoading ? 'Preparing Assessment...' : 'Retake Assessment'}
                  </ActionButton>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                    Discover your ideal career path through our comprehensive assessment that analyzes your 
                    personality, interests, skills, and values to provide personalized career recommendations.
                  </Typography>
                  
                  <Box sx={{ p: 3, background: alpha(theme.palette.info.main, 0.05), borderRadius: 2, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'info.main' }}>
                      What You'll Discover:
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Your personality type and work style preferences" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Top 5 career paths that match your profile" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Personalized learning roadmap with course recommendations" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CheckIcon color="success" fontSize="small" /></ListItemIcon>
                        <ListItemText primary="Skills analysis and development areas" />
                      </ListItem>
                    </List>
                  </Box>

                  <ActionButton 
                    className="primary"
                    size="large"
                    onClick={handleStartAssessment}
                    disabled={assessmentLoading}
                    startIcon={assessmentLoading ? <CircularProgress size={24} color="inherit" /> : <StartIcon />}
                  >
                    {assessmentLoading ? 'Preparing Your Assessment...' : 'Start Career Assessment'}
                  </ActionButton>
                </Box>
              )}
            </CardContent>
          </GradientCard>

          {/* Career Recommendations */}
          {latestResults && (
            <GradientCard sx={{ mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TrendingUpIcon color="secondary" sx={{ fontSize: 32, mr: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Your Top Career Matches
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  {latestResults.careerRecommendations.slice(0, 3).map((career, index) => (
                    <Grid item xs={12} sm={4} key={index}>
                      <Card sx={{ height: '100%', borderRadius: 2 }}>
                        <CardContent sx={{ p: 3, textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {career.careerPath}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {career.industry}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={career.matchPercentage}
                            sx={{ mb: 2, height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                            {career.matchPercentage}% Match
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {career.growthOutlook} Growth Outlook
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                  <ActionButton
                    variant="outlined"
                    size="large"
                    onClick={() => {
                      const completedAssessment = assessments.find(a => a.type === 'career_discovery' && a.isCompleted);
                      if (completedAssessment) {
                        navigate(`/dashboard/student/career/assessment/${completedAssessment.id}/results`);
                      }
                    }}
                    startIcon={<TrendingUpIcon />}
                  >
                    View Detailed Results & Analysis
                  </ActionButton>
                </Box>
              </CardContent>
            </GradientCard>
          )}

          {/* Learning Recommendations */}
          {latestResults && (
            <GradientCard sx={{ mb: 4 }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <SchoolIcon color="success" sx={{ fontSize: 32, mr: 2 }} />
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Recommended Learning Path
                  </Typography>
                </Box>

                <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.7 }}>
                  Based on your career goals, here are the courses that will help you develop the skills you need:
                </Typography>

                <List>
                  {latestResults.learningRecommendations.slice(0, 4).map((course, index) => (
                    <React.Fragment key={index}>
                      <ListItem sx={{ px: 0, py: 2 }}>
                        <ListItemIcon>
                          <Avatar sx={{ 
                            bgcolor: course.priority === 'high' ? 'error.main' : 
                                     course.priority === 'medium' ? 'warning.main' : 'info.main',
                            width: 32, 
                            height: 32, 
                            fontSize: '0.875rem' 
                          }}>
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {course.courseName}
                              </Typography>
                              <Chip 
                                label={course.priority.toUpperCase()} 
                                size="small"
                                color={course.priority === 'high' ? 'error' : 
                                       course.priority === 'medium' ? 'warning' : 'info'}
                              />
                            </Box>
                          }
                          secondary={
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Duration: {course.estimatedDuration} • Category: {course.category}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {course.skillsToGain.slice(0, 3).map((skill, skillIndex) => (
                                  <Chip 
                                    key={skillIndex} 
                                    label={skill} 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem', height: 24 }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < latestResults.learningRecommendations.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>

                <ActionButton 
                  variant="outlined"
                  onClick={() => navigate('/courses')}
                  sx={{ mt: 2 }}
                >
                  Explore All Courses
                </ActionButton>
              </CardContent>
            </GradientCard>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Progress Tracking */}
          {guidance && (
            <GradientCard sx={{ mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <RoadmapIcon color="primary" sx={{ mr: 1.5 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Progress Tracker
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Career Development Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(guidance.progressTracking.completedMilestones / guidance.progressTracking.totalMilestones) * 100}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {guidance.progressTracking.completedMilestones} of {guidance.progressTracking.totalMilestones} milestones completed
                  </Typography>
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Current Goals:
                </Typography>
                <List dense>
                  {guidance.progressTracking.currentGoals.map((goal, index) => (
                    <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <StarIcon color="warning" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={goal}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </GradientCard>
          )}

          {/* Success Stories */}
          <GradientCard>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AchievementIcon color="warning" sx={{ mr: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Success Stories
                </Typography>
              </Box>

              {successStories.slice(0, 2).map((story, index) => (
                <Box key={index} sx={{ mb: 3, pb: 2, borderBottom: index < 1 ? '1px solid' : 'none', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Avatar sx={{ width: 40, height: 40, mr: 1.5, bgcolor: 'primary.main' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        {story.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {story.currentRole} at {story.company}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.5 }}>
                    "{story.story.substring(0, 120)}..."
                  </Typography>
                  <Chip label={story.careerPath} size="small" color="success" variant="outlined" />
                </Box>
              ))}

              <Button 
                variant="text" 
                size="small"
                onClick={() => navigate('/dashboard/student/career/success-stories')}
              >
                View All Stories
              </Button>
            </CardContent>
          </GradientCard>
        </Grid>
      </Grid>

      {/* AI Career Mentor Chat */}
      <ChatFab
        onClick={() => setChatOpen(true)}
        color="primary"
        size={isMobile ? "medium" : "large"}
      >
        <Badge badgeContent={chatMessages.length > 1 ? chatMessages.length - 1 : 0} color="error">
          <ChatIcon />
        </Badge>
      </ChatFab>

      {/* Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
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
              placeholder="Ask about career advice, courses, skills..."
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
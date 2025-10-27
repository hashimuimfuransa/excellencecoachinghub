import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Stack,
  Avatar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Alert,
  AlertTitle,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { SafeSlideUp } from '../utils/transitionFix';
import {
  Assessment,
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  Star,
  StarBorder,
  Download,
  Share,
  PlayArrow,
  Refresh,
  Close,
  ExpandMore,
  CheckCircle,
  Warning,
  Info,
  Psychology,
  WorkOutline,
  Speed,
  Chat,
  Code,
  Group,
  Lightbulb,
  AutoAwesome,
  School,
  Print,
  Email,
  LinkedIn
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { modernInterviewService, InterviewResult } from '../services/modernInterviewService';
import { useAuth } from '../contexts/AuthContext';

const InterviewResultsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchResult();
    }
  }, [sessionId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError(null);
      const resultData = await modernInterviewService.getInterviewResult(sessionId!);
      setResult(resultData);
    } catch (error) {
      console.error('Error fetching interview result:', error);
      setError('Failed to load interview results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Average';
    if (score >= 40) return 'Below Average';
    return 'Needs Improvement';
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'strongly_recommend':
        return <EmojiEvents sx={{ color: theme.palette.success.main }} />;
      case 'recommend':
        return <CheckCircle sx={{ color: theme.palette.success.main }} />;
      case 'consider':
        return <Warning sx={{ color: theme.palette.warning.main }} />;
      default:
        return <Info sx={{ color: theme.palette.error.main }} />;
    }
  };

  const getRecommendationText = (recommendation: string) => {
    switch (recommendation) {
      case 'strongly_recommend':
        return 'Strongly Recommend for Hire';
      case 'recommend':
        return 'Recommend for Hire';
      case 'consider':
        return 'Consider for Interview';
      default:
        return 'Not Recommended';
    }
  };

  const handleDownloadReport = () => {
    // TODO: Implement PDF report generation
    console.log('Downloading report...');
  };

  const handleShareResults = () => {
    setShareDialogOpen(true);
  };

  const handleRetakeInterview = () => {
    navigate('/app/interviews');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your interview results...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !result) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error || 'Interview results not found.'}
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={() => navigate('/app/interviews')}>
              Back to Interviews
            </Button>
          </Box>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Interview Results
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Session: {result.sessionId}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={handleShareResults}
            >
              Share Results
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={handleRetakeInterview}
            >
              Retake Interview
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Overall Score Card */}
      <Card sx={{ mb: 4, background: `linear-gradient(135deg, ${alpha(getScoreColor(result.score), 0.1)}, ${alpha(getScoreColor(result.score), 0.05)})`, border: `2px solid ${getScoreColor(result.score)}` }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={result.score}
                    size={120}
                    thickness={6}
                    sx={{ color: getScoreColor(result.score) }}
                  />
                  <Box sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <Typography variant="h4" fontWeight="bold" color={getScoreColor(result.score)}>
                      {result.score}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      out of 100
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {getScoreGrade(result.score)}
                </Typography>
                <Chip
                  icon={getRecommendationIcon(result.recommendation)}
                  label={getRecommendationText(result.recommendation)}
                  color={result.recommendation === 'strongly_recommend' || result.recommendation === 'recommend' ? 'success' : result.recommendation === 'consider' ? 'warning' : 'error'}
                  variant="filled"
                  sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Overall Assessment
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
                {result.overallFeedback}
              </Typography>
              
              {/* Skills Assessment */}
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Skills Assessment
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Chat sx={{ fontSize: 32, color: theme.palette.primary.main, mb: 1 }} />
                    <Typography variant="caption" display="block" gutterBottom>
                      Communication
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={result.skillAssessment.communication}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                      {result.skillAssessment.communication}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Code sx={{ fontSize: 32, color: theme.palette.success.main, mb: 1 }} />
                    <Typography variant="caption" display="block" gutterBottom>
                      Technical
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={result.skillAssessment.technical}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                      {result.skillAssessment.technical}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Lightbulb sx={{ fontSize: 32, color: theme.palette.warning.main, mb: 1 }} />
                    <Typography variant="caption" display="block" gutterBottom>
                      Problem Solving
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={result.skillAssessment.problemSolving}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                      {result.skillAssessment.problemSolving}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <Group sx={{ fontSize: 32, color: theme.palette.info.main, mb: 1 }} />
                    <Typography variant="caption" display="block" gutterBottom>
                      Cultural Fit
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={result.skillAssessment.cultural}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                      {result.skillAssessment.cultural}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={4}>
        {/* Strengths & Improvements */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="success.main">
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Strengths
              </Typography>
              <List>
                {result.strengths.map((strength, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={strength} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" color="warning.main">
                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                Areas for Improvement
              </Typography>
              <List>
                {result.improvements.map((improvement, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon>
                      <AutoAwesome color="warning" />
                    </ListItemIcon>
                    <ListItemText primary={improvement} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Individual Question Results */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                <Assessment sx={{ mr: 1, verticalAlign: 'middle' }} />
                Question by Question Analysis
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Detailed breakdown of your performance on each interview question
              </Typography>
              
              {result.responses.map((response, index) => (
                <Accordion key={index} sx={{ mb: 2 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
                        Question {index + 1}: {response.question}
                      </Typography>
                      <Chip
                        label={`${response.score}/100`}
                        color={response.score >= 70 ? 'success' : response.score >= 50 ? 'warning' : 'error'}
                        sx={{ mr: 2 }}
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Your Answer:
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                          <Typography variant="body2">
                            {response.answer}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Feedback:
                        </Typography>
                        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: alpha(getScoreColor(response.score), 0.05) }}>
                          <Typography variant="body2">
                            {response.feedback}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                          Key Keywords Found:
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                          {response.keywords.map((keyword, keyIndex) => (
                            <Chip key={keyIndex} label={keyword} size="small" variant="outlined" />
                          ))}
                        </Stack>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth TransitionComponent={SafeSlideUp}>
        <DialogTitle>Share Interview Results</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Share your interview results with potential employers or on social media
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<LinkedIn />}
                onClick={() => console.log('Share on LinkedIn')}
              >
                LinkedIn
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Email />}
                onClick={() => console.log('Share via Email')}
              >
                Email
              </Button>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Print />}
                onClick={handleDownloadReport}
              >
                Print
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InterviewResultsPage;
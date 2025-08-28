import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  Avatar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  useTheme,
  alpha,
  Dialog,
  DialogContent,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  TrendingUp,
  Psychology,
  PlayArrow,
  Pause,
  VolumeUp,
  Close,
  School,
  WorkOutline,
  AutoAwesome,
  EmojiEvents,
  Star,
  ArrowForward
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { modernInterviewService, InterviewResult } from '../services/modernInterviewService';
import { avatarTalkService } from '../services/avatarTalkService';
import StreamingAvatarVideo from '../components/StreamingAvatarVideo';

const InterviewFeedbackPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId: string }>();
  
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [currentFeedbackText, setCurrentFeedbackText] = useState('');
  const [feedbackStage, setFeedbackStage] = useState<'welcome' | 'strengths' | 'improvements' | 'conclusion'>('welcome');
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);

  useEffect(() => {
    if (sessionId) {
      fetchResult();
    }
  }, [sessionId]);

  useEffect(() => {
    if (result) {
      startAvatarFeedback();
    }
  }, [result]);

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

  const startAvatarFeedback = async () => {
    if (!result) return;

    setAvatarLoading(true);
    setIsAvatarSpeaking(true);

    // Stage 1: Welcome message with specific job reference
    const jobTitle = result.responses[0]?.question.match(/for\s+(?:the\s+)?(.+?)\s+(?:position|role)/i)?.[1] || 'this role';
    const welcomeText = `Hello! Congratulations on completing your interview for the ${jobTitle} position. I've carefully analyzed all ${result.responses.length} of your responses and I'm excited to share some personalized feedback with you. You scored ${result.score} out of 100, which is ${getScoreGrade(result.score).toLowerCase()}! ${result.overallFeedback}`;
    
    setCurrentFeedbackText(welcomeText);
    setFeedbackStage('welcome');

    // Wait 6 seconds then move to strengths
    setTimeout(() => {
      moveToStrengths();
    }, 6000);

    setAvatarLoading(false);
  };

  const moveToStrengths = () => {
    if (!result) return;

    // Find best performing responses to mention specifically
    const bestResponse = result.responses.reduce((best, current) => 
      current.score > best.score ? current : best, result.responses[0]);
    
    const strengthsText = `Let me start with what you did really well. ${result.strengths.map((strength, index) => 
      `${index === 0 ? 'First,' : index === result.strengths.length - 1 ? 'And finally,' : 'Also,'} ${strength.toLowerCase()}`
    ).join(' ')} I was particularly impressed with your response about ${bestResponse.question.toLowerCase().replace(/^.+?tell me about|^.+?describe|^.+?explain/i, '').trim()}, where you scored ${bestResponse.score} out of 100. ${bestResponse.feedback}`;

    setCurrentFeedbackText(strengthsText);
    setFeedbackStage('strengths');

    // Wait 8 seconds then move to improvements
    setTimeout(() => {
      moveToImprovements();
    }, 8000);
  };

  const moveToImprovements = () => {
    if (!result) return;

    // Find lowest scoring response for specific feedback
    const lowestResponse = result.responses.reduce((lowest, current) => 
      current.score < lowest.score ? current : lowest, result.responses[0]);
    
    const improvementsText = `Now, let's talk about areas where you can grow even stronger. ${result.improvements.map((improvement, index) => 
      `${index === 0 ? '' : 'Additionally, '} ${improvement.toLowerCase()}`
    ).join(' ')} For example, in your response about ${lowestResponse.question.toLowerCase().replace(/^.+?tell me about|^.+?describe|^.+?explain/i, '').trim()}, you could have been more specific. ${lowestResponse.feedback} Remember, these are opportunities for growth, and with focused practice, you'll excel in these areas too.`;

    setCurrentFeedbackText(improvementsText);
    setFeedbackStage('improvements');

    // Wait 9 seconds then move to conclusion
    setTimeout(() => {
      moveToConclusion();
    }, 9000);
  };

  const moveToConclusion = () => {
    if (!result) return;

    // Calculate average response time and mention it
    const avgTime = Math.round(result.completionTime / result.responses.length);
    const timeComment = avgTime < 30 ? "You answered quite quickly" : avgTime < 60 ? "You took appropriate time to think" : "You were thorough in your responses";
    
    const conclusionText = `Based on your performance across all questions, I would ${result.recommendation === 'strongly_recommend' ? 'strongly recommend you for this position' : result.recommendation === 'recommend' ? 'recommend you for this position' : result.recommendation === 'consider' ? 'recommend you continue developing your skills' : 'suggest focusing on improvement areas'}. ${timeComment}, which shows ${avgTime < 30 ? 'confidence but remember to elaborate more' : avgTime < 60 ? 'good balance between thinking and responding' : 'careful consideration of each question'}. Your strongest skill area was ${Object.entries(result.skillAssessment).reduce((a, b) => result.skillAssessment[a[0]] > result.skillAssessment[b[0]] ? a : b)[0]} at ${Object.values(result.skillAssessment).reduce((a, b) => Math.max(a, b))}%. Keep practicing, stay confident, and remember that every interview is a learning opportunity. You're on the right path to success!`;

    setCurrentFeedbackText(conclusionText);
    setFeedbackStage('conclusion');

    // End avatar speaking after 8 seconds
    setTimeout(() => {
      setIsAvatarSpeaking(false);
    }, 8000);
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

  const getStageIcon = () => {
    switch (feedbackStage) {
      case 'welcome': return <Psychology sx={{ color: theme.palette.primary.main }} />;
      case 'strengths': return <EmojiEvents sx={{ color: theme.palette.success.main }} />;
      case 'improvements': return <TrendingUp sx={{ color: theme.palette.warning.main }} />;
      case 'conclusion': return <Star sx={{ color: theme.palette.primary.main }} />;
      default: return <Psychology sx={{ color: theme.palette.primary.main }} />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Preparing your personalized feedback...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !result) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" gutterBottom>
            {error || 'Interview results not found.'}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/app/interviews')}>
            Back to Interviews
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh' }}>
      <Grid container spacing={4}>
        {/* Avatar Feedback Section */}
        <Grid item xs={12} md={8}>
          <Card 
            sx={{ 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              minHeight: '500px'
            }}
          >
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              {/* Avatar Header */}
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 3 }}>
                {getStageIcon()}
                <Typography variant="h5" fontWeight="bold">
                  AI Interview Feedback
                </Typography>
              </Stack>

              {/* Avatar Video Container */}
              <Box 
                sx={{ 
                  position: 'relative',
                  width: '100%',
                  maxWidth: 400,
                  mx: 'auto',
                  mb: 3,
                  borderRadius: 3,
                  overflow: 'hidden',
                  background: theme.palette.background.paper
                }}
              >
                {avatarLoading ? (
                  <Box sx={{ py: 8 }}>
                    <CircularProgress />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading AI avatar...
                    </Typography>
                  </Box>
                ) : (
                  <StreamingAvatarVideo
                    text={currentFeedbackText}
                    avatar="european_woman"
                    emotion={feedbackStage === 'strengths' ? 'happy' : feedbackStage === 'improvements' ? 'serious' : 'neutral'}
                    language="en"
                    autoPlay={isAvatarSpeaking}
                    onVideoStart={() => {
                      console.log('🎬 Feedback avatar video started');
                    }}
                    onVideoEnd={() => {
                      console.log('🎬 Feedback avatar video ended');
                    }}
                    onError={(error) => {
                      console.error('Feedback avatar video error:', error);
                    }}
                  />
                )}
              </Box>

              {/* Current Feedback Text */}
              <Paper 
                sx={{ 
                  p: 3, 
                  mb: 3, 
                  background: alpha(theme.palette.background.paper, 0.8),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                }}
              >
                <Typography variant="body1" sx={{ lineHeight: 1.8, fontSize: '1.1rem' }}>
                  {currentFeedbackText}
                </Typography>
              </Paper>

              {/* Progress Indicator */}
              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                {['welcome', 'strengths', 'improvements', 'conclusion'].map((stage, index) => (
                  <Box
                    key={stage}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: feedbackStage === stage || 
                        (['welcome', 'strengths', 'improvements', 'conclusion'].indexOf(feedbackStage) > index) 
                        ? theme.palette.primary.main 
                        : alpha(theme.palette.primary.main, 0.3),
                      transition: 'all 0.3s ease'
                    }}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Section */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Overall Score */}
            <Card sx={{ background: `linear-gradient(135deg, ${alpha(getScoreColor(result.score), 0.1)}, ${alpha(getScoreColor(result.score), 0.05)})` }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                  <CircularProgress
                    variant="determinate"
                    value={result.score}
                    size={100}
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
                      /100
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {getScoreGrade(result.score)}
                </Typography>
                <Chip
                  label={result.recommendation.replace('_', ' ').toUpperCase()}
                  color={result.recommendation.includes('recommend') ? 'success' : 'warning'}
                  variant="filled"
                />
              </CardContent>
            </Card>

            {/* Skills Breakdown */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Skills Assessment
                </Typography>
                <Stack spacing={2}>
                  {Object.entries(result.skillAssessment).map(([skill, score]) => (
                    <Box key={skill}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {skill.replace(/([A-Z])/g, ' $1').trim()}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {score}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={score}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Stack spacing={2}>
              <Button
                variant="contained"
                startIcon={<ArrowForward />}
                onClick={() => navigate(`/app/interviews/results/${sessionId}`)}
                fullWidth
              >
                View Detailed Results
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate('/app/interviews')}
                fullWidth
              >
                Take Another Interview
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
};

export default InterviewFeedbackPage;
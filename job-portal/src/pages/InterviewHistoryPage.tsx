import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Stack,
  Avatar,
  LinearProgress,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Assessment,
  EmojiEvents,
  TrendingUp,
  TrendingDown,
  Visibility,
  Download,
  WorkOutline,
  School,
  CalendarToday,
  AccessTime
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { modernInterviewService, InterviewSession } from '../services/modernInterviewService';
import { useAuth } from '../contexts/AuthContext';

const InterviewHistoryPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInterviewHistory();
  }, []);

  const fetchInterviewHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const history = await modernInterviewService.getInterviewHistory();
      setSessions(history);
    } catch (error) {
      console.error('Error fetching interview history:', error);
      setError('Failed to load interview history. Please try again.');
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

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your interview history...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={fetchInterviewHistory}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Interview History
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Review your past interview performances and track your progress
        </Typography>
      </Box>

      {sessions.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Assessment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              No Interview History
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              You haven't completed any interviews yet. Start practicing to see your history here.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/app/interviews')}
              startIcon={<Assessment />}
            >
              Start Interview Practice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {sessions.map((session) => (
            <Grid item xs={12} md={6} lg={4} key={session.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8]
                  }
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  {/* Header */}
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Avatar sx={{ 
                      bgcolor: theme.palette.primary.main,
                      width: 48,
                      height: 48
                    }}>
                      <WorkOutline />
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {session.jobTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        AI Interview Practice
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Score */}
                  {session.result && (
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Overall Score
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" color={getScoreColor(session.result.score)}>
                          {session.result.score}/100
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={session.result.score}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getScoreColor(session.result.score)
                          }
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {getScoreGrade(session.result.score)}
                      </Typography>
                    </Box>
                  )}

                  {/* Interview Type */}
                  <Chip
                    label="AI Interview Practice"
                    color="primary"
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  {/* Date and Duration */}
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(session.completedAt || session.createdAt)}
                      </Typography>
                    </Stack>
                    {session.result && (
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          Duration: {formatDuration(session.result.completionTime)}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  {/* Actions */}
                  <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                    {session.result && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => navigate(`/app/interviews/results/${session.id}`)}
                        sx={{ flexGrow: 1 }}
                      >
                        View Results
                      </Button>
                    )}
                    <Tooltip title="Download Report">
                      <IconButton size="small" sx={{ border: 1, borderColor: 'divider' }}>
                        <Download />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Summary Stats */}
      {sessions.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Your Progress
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Assessment sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {sessions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Interviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <EmojiEvents sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {Math.round(sessions.filter(s => s.result).reduce((acc, s) => acc + s.result!.score, 0) / sessions.filter(s => s.result).length) || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <TrendingUp sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {Math.max(...sessions.filter(s => s.result).map(s => s.result!.score), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Best Score
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <School sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
                  <Typography variant="h4" fontWeight="bold">
                    {sessions.filter(s => s.jobRole?.interviewType === 'free').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Free Interviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default InterviewHistoryPage;
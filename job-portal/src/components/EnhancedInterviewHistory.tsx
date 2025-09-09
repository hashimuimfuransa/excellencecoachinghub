/**
 * Enhanced Interview History Component
 * Shows both regular interview results and recorded interviews with playback
 */

import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Tabs,
  Tab,
  Stack,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Divider,
  useTheme
} from '@mui/material';
import {
  Assessment,
  Mic,
  History,
  PlayArrow,
  TrendingUp,
  EmojiEvents
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { modernInterviewService, InterviewSession } from '../services/modernInterviewService';
import { interviewRecordingService, InterviewRecording } from '../services/interviewRecordingService';
import InterviewRecordingPlayer from './InterviewRecordingPlayer';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`interview-tabpanel-${index}`}
      aria-labelledby={`interview-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const EnhancedInterviewHistory: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  
  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Interview data
  const [interviewSessions, setInterviewSessions] = useState<InterviewSession[]>([]);
  const [interviewRecordings, setInterviewRecordings] = useState<InterviewRecording[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load both interview sessions and recordings
      const [sessions, recordings] = await Promise.all([
        modernInterviewService.getInterviewHistory(),
        loadRecordings()
      ]);

      setInterviewSessions(sessions);
      setInterviewRecordings(recordings);
    } catch (err) {
      console.error('Error loading interview data:', err);
      setError('Failed to load interview history. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRecordings = async (): Promise<InterviewRecording[]> => {
    try {
      return interviewRecordingService.getRecordings(user?._id);
    } catch (error) {
      console.error('Error loading recordings:', error);
      return [];
    }
  };

  const handleDeleteRecording = (recordingId: string) => {
    const success = interviewRecordingService.deleteRecording(recordingId);
    if (success) {
      setInterviewRecordings(prev => prev.filter(r => r.id !== recordingId));
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getTotalInterviews = (): number => {
    return interviewSessions.length + interviewRecordings.length;
  };

  const getAverageScore = (): number => {
    const scoresFromSessions = interviewSessions
      .filter(s => s.result?.score)
      .map(s => s.result!.score);
    
    const scoresFromRecordings = interviewRecordings
      .filter(r => r.overallScore)
      .map(r => r.overallScore!);
    
    const allScores = [...scoresFromSessions, ...scoresFromRecordings];
    
    if (allScores.length === 0) return 0;
    
    return Math.round(allScores.reduce((sum, score) => sum + score, 0) / allScores.length);
  };

  const getBestScore = (): number => {
    const scoresFromSessions = interviewSessions
      .filter(s => s.result?.score)
      .map(s => s.result!.score);
    
    const scoresFromRecordings = interviewRecordings
      .filter(r => r.overallScore)
      .map(r => r.overallScore!);
    
    const allScores = [...scoresFromSessions, ...scoresFromRecordings];
    
    return allScores.length > 0 ? Math.max(...allScores) : 0;
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
        <Button variant="contained" onClick={loadData}>
          Retry
        </Button>
      </Container>
    );
  }

  const totalInterviews = getTotalInterviews();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Interview History
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Review your interview sessions and recorded practice interviews
        </Typography>
      </Box>

      {/* Stats Cards */}
      {totalInterviews > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Assessment sx={{ fontSize: 40, color: theme.palette.primary.main, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {totalInterviews}
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
                  {getAverageScore()}
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
                  {getBestScore()}
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
                <Mic sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
                <Typography variant="h4" fontWeight="bold">
                  {interviewRecordings.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recorded Sessions
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {totalInterviews === 0 ? (
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
              startIcon={<Assessment />}
              href="/app/interviews"
            >
              Start Interview Practice
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="interview history tabs">
              <Tab 
                icon={<Assessment />} 
                label={`All Interviews (${totalInterviews})`} 
                id="interview-tab-0"
                aria-controls="interview-tabpanel-0"
              />
              <Tab 
                icon={<Mic />} 
                label={`Recorded Interviews (${interviewRecordings.length})`} 
                id="interview-tab-1"
                aria-controls="interview-tabpanel-1"
              />
              <Tab 
                icon={<History />} 
                label={`Session Results (${interviewSessions.length})`} 
                id="interview-tab-2"
                aria-controls="interview-tabpanel-2"
              />
            </Tabs>
          </Box>

          {/* All Interviews Tab */}
          <TabPanel value={activeTab} index={0}>
            <Stack spacing={3}>
              {/* Recorded Interviews */}
              {interviewRecordings.length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Mic /> Recorded Interviews ({interviewRecordings.length})
                  </Typography>
                  {interviewRecordings.map((recording) => (
                    <InterviewRecordingPlayer
                      key={recording.id}
                      recording={recording}
                      onDelete={handleDeleteRecording}
                    />
                  ))}
                </Box>
              )}

              {/* Session Results */}
              {interviewSessions.length > 0 && (
                <Box>
                  {interviewRecordings.length > 0 && <Divider sx={{ my: 3 }} />}
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Assessment /> Interview Sessions ({interviewSessions.length})
                  </Typography>
                  <Grid container spacing={3}>
                    {interviewSessions.map((session) => (
                      <Grid item xs={12} md={6} lg={4} key={session.id}>
                        <Card sx={{ 
                          height: '100%',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: theme.shadows[8]
                          }
                        }}>
                          <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                              {session.jobTitle}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {formatDate(session.completedAt || session.createdAt)}
                            </Typography>
                            {session.result && (
                              <Box sx={{ mt: 2 }}>
                                <Chip
                                  label={`Score: ${session.result.score}/100`}
                                  color={session.result.score >= 80 ? 'success' : session.result.score >= 60 ? 'warning' : 'error'}
                                />
                              </Box>
                            )}
                            <Button
                              size="small"
                              startIcon={<Assessment />}
                              href={`/app/interviews/results/${session.id}`}
                              sx={{ mt: 2 }}
                            >
                              View Results
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Stack>
          </TabPanel>

          {/* Recorded Interviews Tab */}
          <TabPanel value={activeTab} index={1}>
            {interviewRecordings.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 6 }}>
                <CardContent>
                  <Mic sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Recorded Interviews
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start recording your interview practice sessions to review them later.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={3}>
                {interviewRecordings.map((recording) => (
                  <InterviewRecordingPlayer
                    key={recording.id}
                    recording={recording}
                    onDelete={handleDeleteRecording}
                  />
                ))}
              </Stack>
            )}
          </TabPanel>

          {/* Session Results Tab */}
          <TabPanel value={activeTab} index={2}>
            {interviewSessions.length === 0 ? (
              <Card sx={{ textAlign: 'center', py: 6 }}>
                <CardContent>
                  <Assessment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Interview Sessions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete some interview practice sessions to see your results here.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {interviewSessions.map((session) => (
                  <Grid item xs={12} md={6} lg={4} key={session.id}>
                    <Card sx={{ 
                      height: '100%',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}>
                      <CardContent>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {session.jobTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {formatDate(session.completedAt || session.createdAt)}
                        </Typography>
                        {session.result && (
                          <Box sx={{ mt: 2 }}>
                            <Chip
                              label={`Score: ${session.result.score}/100`}
                              color={session.result.score >= 80 ? 'success' : session.result.score >= 60 ? 'warning' : 'error'}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {session.result.overallFeedback.substring(0, 100)}...
                            </Typography>
                          </Box>
                        )}
                        <Button
                          size="small"
                          startIcon={<Assessment />}
                          href={`/app/interviews/results/${session.id}`}
                          sx={{ mt: 2 }}
                        >
                          View Full Results
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </>
      )}
    </Container>
  );
};

export default EnhancedInterviewHistory;
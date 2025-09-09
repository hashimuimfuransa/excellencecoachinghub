import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Stack,
  Avatar,
  Tooltip,
  Alert
} from '@mui/material';
import { SafeDialogTransition } from '../utils/transitionFix';
import {
  PlayArrow,
  Pause,
  Stop,
  Download,
  Delete,
  Visibility,
  AccessTime,
  Score,
  Mic,
  VolumeUp,
  SmartToy,
  Business
} from '@mui/icons-material';
import { interviewStorageService, InterviewHistoryEntry, InterviewRecording } from '../services/interviewStorageService';

const InterviewHistory: React.FC = () => {
  const [interviews, setInterviews] = useState<InterviewHistoryEntry[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<InterviewHistoryEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingRecording, setPlayingRecording] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInterviewHistory();
  }, []);

  useEffect(() => {
    // Cleanup audio when component unmounts
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const loadInterviewHistory = () => {
    setLoading(true);
    try {
      const history = interviewStorageService.getInterviewHistory();
      setInterviews(history);
    } catch (error) {
      console.error('Failed to load interview history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (interview: InterviewHistoryEntry) => {
    setSelectedInterview(interview);
    setDetailsOpen(true);
  };

  const handleDeleteInterview = (interviewId: string) => {
    if (window.confirm('Are you sure you want to delete this interview? This action cannot be undone.')) {
      try {
        interviewStorageService.deleteInterviewFromHistory(interviewId);
        loadInterviewHistory();
        if (selectedInterview?.id === interviewId) {
          setDetailsOpen(false);
          setSelectedInterview(null);
        }
      } catch (error) {
        console.error('Failed to delete interview:', error);
      }
    }
  };

  const handlePlayRecording = async (recording: InterviewRecording) => {
    try {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setPlayingRecording(null);
      }

      // If clicking the same recording that was playing, just stop
      if (playingRecording === recording.id) {
        return;
      }

      // Play new recording
      const audio = await interviewStorageService.playRecording(recording);
      
      audio.addEventListener('ended', () => {
        setPlayingRecording(null);
        setCurrentAudio(null);
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setPlayingRecording(null);
        setCurrentAudio(null);
      });

      setCurrentAudio(audio);
      setPlayingRecording(recording.id);
      audio.play();
    } catch (error) {
      console.error('Failed to play recording:', error);
    }
  };

  const handleStopAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setPlayingRecording(null);
    }
  };

  const handleExportData = () => {
    try {
      const exportData = interviewStorageService.exportInterviewData();
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview_history_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getScoreColor = (score?: number): string => {
    if (!score) return 'default';
    if (score >= 85) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getStatusColor = (status: string): 'default' | 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'incomplete': return 'error';
      default: return 'default';
    }
  };

  const statistics = interviewStorageService.getInterviewStatistics();

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading interview history...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Statistics Overview */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
            Interview Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h3">{statistics.totalInterviews}</Typography>
                <Typography variant="body2">Total Interviews</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h3">{statistics.completedInterviews}</Typography>
                <Typography variant="body2">Completed</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h3">{statistics.averageScore}%</Typography>
                <Typography variant="body2">Average Score</Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center', color: 'white' }}>
                <Typography variant="h3">{formatDuration(statistics.totalRecordingTime)}</Typography>
                <Typography variant="body2">Total Recording Time</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button 
            variant="contained" 
            startIcon={<Download />} 
            onClick={handleExportData}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Export Data
          </Button>
        </CardActions>
      </Card>

      {/* Interview List */}
      {interviews.length === 0 ? (
        <Alert severity="info">
          No interview history found. Complete an AI interview to see your recordings here.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {interviews.map((interview) => (
            <Grid item xs={12} sm={6} md={4} key={interview.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                      <SmartToy fontSize="small" />
                    </Avatar>
                    <Chip 
                      label={interview.status}
                      color={getStatusColor(interview.status)}
                      size="small"
                    />
                  </Stack>
                  
                  <Typography variant="h6" gutterBottom noWrap>
                    {interview.jobTitle}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <Business fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {interview.company}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {interview.date.toLocaleDateString()} • {formatDuration(interview.totalDuration)}
                  </Typography>
                  
                  <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                    <Chip 
                      icon={<Mic />} 
                      label={`${interview.recordings.length} recordings`}
                      size="small" 
                      variant="outlined"
                    />
                    <Chip 
                      label={`${interview.questionsAsked}/10 questions`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                  
                  {interview.overallScore && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Score fontSize="small" color="primary" />
                      <Typography variant="body2">
                        Score: {interview.overallScore}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={interview.overallScore} 
                        sx={{ flexGrow: 1, height: 4, borderRadius: 2 }}
                        color={getScoreColor(interview.overallScore) as any}
                      />
                    </Stack>
                  )}
                </CardContent>
                
                <CardActions>
                  <Button 
                    size="small" 
                    startIcon={<Visibility />}
                    onClick={() => handleViewDetails(interview)}
                  >
                    View Details
                  </Button>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => handleDeleteInterview(interview.id)}
                  >
                    <Delete />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Interview Details Dialog */}
      <Dialog 
        open={detailsOpen && !!selectedInterview} 
        onClose={() => setDetailsOpen(false)}
        maxWidth="md" 
        fullWidth
        TransitionComponent={SafeDialogTransition}
      >
        {selectedInterview && (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <SmartToy />
                </Avatar>
                <Box>
                  <Typography variant="h6">{selectedInterview.jobTitle}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedInterview.company} • {selectedInterview.date.toLocaleDateString()}
                  </Typography>
                </Box>
              </Stack>
            </DialogTitle>
            
            <DialogContent>
              {/* Interview Summary */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">Duration</Typography>
                  <Typography variant="body1">{formatDuration(selectedInterview.totalDuration)}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">Questions</Typography>
                  <Typography variant="body1">{selectedInterview.questionsAsked}/10</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">Score</Typography>
                  <Typography variant="body1">
                    {selectedInterview.overallScore ? `${selectedInterview.overallScore}%` : 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">Avatar</Typography>
                  <Typography variant="body1">European Woman</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 2 }} />

              {/* Feedback */}
              {selectedInterview.feedback && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Feedback</Typography>
                  <Typography variant="body2">{selectedInterview.feedback}</Typography>
                </Box>
              )}

              {/* Recordings */}
              <Typography variant="h6" gutterBottom>
                Interview Recordings ({selectedInterview.recordings.length})
              </Typography>
              
              <List>
                {selectedInterview.recordings.map((recording, index) => (
                  <React.Fragment key={recording.id}>
                    <ListItem>
                      <ListItemText
                        primary={`Question ${index + 1}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              {recording.question}
                            </Typography>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                              <AccessTime fontSize="small" />
                              <Typography variant="caption">
                                {formatDuration(recording.duration)}
                              </Typography>
                              {recording.transcription && (
                                <Chip 
                                  label={`${Math.round((recording.confidence || 0) * 100)}% confidence`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title={playingRecording === recording.id ? "Stop playback" : "Play recording"}>
                          <IconButton 
                            onClick={() => 
                              playingRecording === recording.id 
                                ? handleStopAudio() 
                                : handlePlayRecording(recording)
                            }
                            color={playingRecording === recording.id ? "secondary" : "primary"}
                          >
                            {playingRecording === recording.id ? <Pause /> : <PlayArrow />}
                          </IconButton>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    
                    {/* Show transcription if available */}
                    {recording.transcription && (
                      <ListItem sx={{ pt: 0, pl: 4 }}>
                        <ListItemText
                          secondary={
                            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, mt: 1 }}>
                              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                                <VolumeUp fontSize="small" color="primary" />
                                <Typography variant="caption" color="primary">
                                  Your Response:
                                </Typography>
                              </Stack>
                              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                "{recording.transcription}"
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    )}
                    
                    {index < selectedInterview.recordings.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </DialogContent>
            
            <DialogActions>
              <Button onClick={handleStopAudio} startIcon={<Stop />}>
                Stop Audio
              </Button>
              <Button onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default InterviewHistory;
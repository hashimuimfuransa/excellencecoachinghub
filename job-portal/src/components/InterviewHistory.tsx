/**
 * Interview History Component
 * Displays recorded interview sessions with video playback and feedback
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Grid,
  Stack,
  Divider,
  LinearProgress,
  Alert,
  CircularProgress,
  Tooltip,
  Badge
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Download,
  Delete,
  VideoLibrary,
  Schedule,
  Person,
  Assessment,
  CheckCircle,
  Error,
  Refresh,
  Visibility,
  Feedback,
  Close
} from '@mui/icons-material';

interface InterviewRecording {
  id: string;
  sessionId: string;
  userId: string;
  jobTitle: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  avatarService: 'did' | 'talkavatar';
  quality: 'low' | 'medium' | 'high';
  status: 'recording' | 'processing' | 'completed' | 'failed';
  questions: Array<{
    id: string;
    text: string;
    questionNumber: number;
    timestamp: number;
  }>;
  userResponses: Array<{
    questionId: string;
    text: string;
    timestamp: number;
    duration: number;
  }>;
}

interface InterviewHistoryProps {
  userId: string;
  onClose?: () => void;
}

const InterviewHistory: React.FC<InterviewHistoryProps> = ({ userId, onClose }) => {
  const [recordings, setRecordings] = useState<InterviewRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecording, setSelectedRecording] = useState<InterviewRecording | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  useEffect(() => {
    loadRecordings();
  }, [userId]);

  const loadRecordings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        setRecordings([]);
        return;
      }

      // Load from localStorage as fallback
      const localRecordings = Object.keys(localStorage)
        .filter(key => key.startsWith('recording_'))
        .map(key => {
          try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      setRecordings(localRecordings);
    } catch (error) {
      console.error('Failed to load recordings:', error);
      setError('Failed to load interview recordings');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'processing': return <CircularProgress size={16} />;
      case 'failed': return <Error />;
      default: return <Schedule />;
    }
  };

  const handlePlayVideo = (recording: InterviewRecording) => {
    setSelectedRecording(recording);
    setVideoDialogOpen(true);
    setPlayingVideo(recording.id);
  };

  const handleDeleteRecording = async (recordingId: string) => {
    try {
      // Remove from localStorage if available
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(`recording_${recordingId}`);
      }
      
      // Update state
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
      
      // Close dialog if this recording was selected
      if (selectedRecording?.id === recordingId) {
        setVideoDialogOpen(false);
        setSelectedRecording(null);
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
    }
  };

  const handleDownloadVideo = async (recording: InterviewRecording) => {
    try {
      // Create download link
      const link = document.createElement('a');
      link.href = recording.videoUrl;
      link.download = `interview_${recording.id}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download video:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={loadRecordings}>
            <Refresh />
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Interview History
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadRecordings}
        >
          Refresh
        </Button>
      </Box>

      {recordings.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <VideoLibrary sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Interview Recordings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your recorded interviews will appear here
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {recordings.map((recording) => (
            <Grid item xs={12} md={6} lg={4} key={recording.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Thumbnail */}
                <CardMedia
                  component="div"
                  sx={{
                    height: 200,
                    backgroundColor: 'grey.200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  onClick={() => handlePlayVideo(recording)}
                >
                  {recording.thumbnailUrl ? (
                    <img
                      src={recording.thumbnailUrl}
                      alt="Interview thumbnail"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <VideoLibrary sx={{ fontSize: 48, color: 'text.secondary' }} />
                  )}
                  
                  {/* Play overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      borderRadius: '50%',
                      p: 1
                    }}
                  >
                    <PlayArrow sx={{ color: 'white', fontSize: 32 }} />
                  </Box>

                  {/* Status badge */}
                  <Chip
                    icon={getStatusIcon(recording.status)}
                    label={recording.status}
                    color={getStatusColor(recording.status) as any}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8
                    }}
                  />
                </CardMedia>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {recording.jobTitle}
                  </Typography>
                  
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(recording.startTime)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Duration: {formatDuration(recording.duration)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Assessment sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {recording.questions.length} questions
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handlePlayVideo(recording)}
                      sx={{ flexGrow: 1 }}
                    >
                      Play
                    </Button>
                    
                    <Tooltip title="Download">
                      <IconButton
                        onClick={() => handleDownloadVideo(recording)}
                        size="small"
                      >
                        <Download />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Delete">
                      <IconButton
                        onClick={() => handleDeleteRecording(recording.id)}
                        size="small"
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Video Player Dialog */}
      <Dialog
        open={videoDialogOpen}
        onClose={() => setVideoDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              {selectedRecording?.jobTitle} - Interview Recording
            </Typography>
            <IconButton onClick={() => setVideoDialogOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedRecording && (
            <Box>
              {/* Video Player */}
              <Box sx={{ mb: 3 }}>
                <video
                  controls
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: 8
                  }}
                  poster={selectedRecording.thumbnailUrl}
                >
                  <source src={selectedRecording.videoUrl} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </Box>

              {/* Recording Details */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Interview Details
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Job Title:</Typography>
                      <Typography variant="body2">{selectedRecording.jobTitle}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Date:</Typography>
                      <Typography variant="body2">{formatDate(selectedRecording.startTime)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Duration:</Typography>
                      <Typography variant="body2">{formatDuration(selectedRecording.duration)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Avatar Service:</Typography>
                      <Chip 
                        label={selectedRecording.avatarService === 'did' ? 'D-ID Real-Time' : 'TalkAvatar'}
                        color={selectedRecording.avatarService === 'did' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Quality:</Typography>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {selectedRecording.quality}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Questions & Responses
                  </Typography>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {selectedRecording.questions.map((question, index) => {
                      const response = selectedRecording.userResponses.find(r => r.questionId === question.id);
                      return (
                        <Box key={question.id} sx={{ mb: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>
                            Question {question.questionNumber}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            {question.text}
                          </Typography>
                          {response && (
                            <Box sx={{ mt: 1, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Your Response ({formatDuration(response.duration)}):
                              </Typography>
                              <Typography variant="body2">
                                {response.text}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setVideoDialogOpen(false)}>
            Close
          </Button>
          {selectedRecording && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => handleDownloadVideo(selectedRecording)}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterviewHistory;
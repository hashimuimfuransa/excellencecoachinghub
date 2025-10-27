/**
 * Interview Recording Player Component
 * Provides playback functionality for recorded interviews
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  IconButton,
  LinearProgress,
  Stack,
  Chip,
  Avatar,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  VolumeUp,
  VolumeDown,
  VolumeOff,
  FastForward,
  FastRewind,
  Download,
  Share,
  Delete,
  QuestionAnswer,
  AccessTime,
  CalendarToday,
  Work,
  Assessment
} from '@mui/icons-material';
import { InterviewRecording, RecordedQuestion, interviewRecordingService } from '../services/interviewRecordingService';

interface InterviewRecordingPlayerProps {
  recording: InterviewRecording;
  onDelete?: (recordingId: string) => void;
  showDetails?: boolean;
  compact?: boolean;
}

const InterviewRecordingPlayer: React.FC<InterviewRecordingPlayerProps> = ({
  recording,
  onDelete,
  showDetails = true,
  compact = false
}) => {
  const theme = useTheme();
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog states
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Load audio when component mounts
  useEffect(() => {
    loadAudio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [recording.id]);

  const loadAudio = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading audio for recording:', recording.id);
      const audioUrl = interviewRecordingService.createAudioUrl(recording);
      
      if (!audioUrl) {
        setError('Audio recording not found. This may be because the recording was not properly saved or has been cleared from browser storage.');
        return;
      }

      console.log('Audio URL created:', audioUrl);

      if (audioRef.current) {
        // Add error event listener
        audioRef.current.onerror = (e) => {
          console.error('Audio element error:', e);
          setError('Unable to play audio. The recording may be corrupted or in an unsupported format.');
        };

        audioRef.current.oncanplay = () => {
          console.log('Audio can play');
          setError(null);
        };

        audioRef.current.src = audioUrl;
        audioRef.current.load();
      }
    } catch (err) {
      console.error('Error loading audio:', err);
      setError('Failed to load audio recording. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const retryLoadAudio = async () => {
    console.log('Retrying audio load with refresh for recording:', recording.id);
    
    try {
      setLoading(true);
      setError(null);
      
      // First try to refresh the recording audio data
      const refreshed = interviewRecordingService.refreshRecordingAudio(recording.id);
      if (refreshed) {
        console.log('✅ Audio data refreshed successfully');
        
        // Get the refreshed recording data
        const refreshedRecording = interviewRecordingService.getRecording(recording.id);
        if (refreshedRecording?.audioUrl && audioRef.current) {
          console.log('Setting new audio URL:', refreshedRecording.audioUrl);
          
          // Set up event listeners
          audioRef.current.onerror = (e) => {
            console.error('Audio element error after refresh:', e);
            setError('Audio playback failed even after refresh. The recording data may be corrupted.');
          };

          audioRef.current.oncanplay = () => {
            console.log('✅ Audio can play after refresh');
            setError(null);
          };
          
          audioRef.current.src = refreshedRecording.audioUrl;
          audioRef.current.load();
        }
      } else {
        console.error('❌ Failed to refresh audio data');
        setError('Could not recover audio data. The recording may be permanently corrupted or missing.');
      }
    } catch (err) {
      console.error('Error during retry:', err);
      setError('Failed to retry audio loading. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Audio event handlers
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Player controls
  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err);
        setError('Failed to play audio');
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleSkip = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Utility functions
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const handleDownload = () => {
    const audioUrl = interviewRecordingService.createAudioUrl(recording);
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = `interview_${recording.jobTitle}_${recording.timestamp.getTime()}.webm`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(recording.id);
    }
    setDeleteConfirmOpen(false);
  };

  if (compact) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
              <Work sx={{ fontSize: 16 }} />
            </Avatar>
            
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body1" fontWeight="bold" noWrap>
                {recording.jobTitle}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {formatDate(recording.timestamp)}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <IconButton size="small" onClick={handlePlayPause} disabled={loading || !!error}>
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              
              <IconButton size="small" onClick={() => setDetailsOpen(true)}>
                <Assessment />
              </IconButton>
            </Stack>
          </Stack>

          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Avatar sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 56,
              height: 56
            }}>
              <Work sx={{ fontSize: 28 }} />
            </Avatar>
            
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {recording.jobTitle}
              </Typography>
              {recording.company && (
                <Typography variant="body2" color="text.secondary">
                  {recording.company}
                </Typography>
              )}
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 1 }}>
                <Chip
                  icon={<CalendarToday sx={{ fontSize: 16 }} />}
                  label={formatDate(recording.timestamp)}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<AccessTime sx={{ fontSize: 16 }} />}
                  label={`${Math.floor(recording.duration / 60000)}m ${Math.floor((recording.duration % 60000) / 1000)}s`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<QuestionAnswer sx={{ fontSize: 16 }} />}
                  label={`${recording.questions.length} questions`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              <Tooltip title="Download Recording">
                <IconButton onClick={handleDownload}>
                  <Download />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="View Details">
                <IconButton onClick={() => setDetailsOpen(true)}>
                  <Assessment />
                </IconButton>
              </Tooltip>
              
              {onDelete && (
                <Tooltip title="Delete Recording">
                  <IconButton 
                    onClick={() => setDeleteConfirmOpen(true)}
                    sx={{ color: theme.palette.error.main }}
                  >
                    <Delete />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          {error ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography color="error" variant="body2">
                {error}
              </Typography>
              <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                <Button size="small" onClick={retryLoadAudio}>
                  Retry
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => interviewRecordingService.debugRecording(recording.id)}
                >
                  Debug Info
                </Button>
              </Stack>
            </Box>
          ) : (
            <>
              {/* Player Controls */}
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <IconButton 
                  onClick={() => handleSkip(-10)}
                  disabled={loading}
                  size="large"
                >
                  <FastRewind />
                </IconButton>
                
                <IconButton 
                  onClick={handlePlayPause}
                  disabled={loading}
                  size="large"
                  sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}
                >
                  {loading ? (
                    <div style={{ width: 24, height: 24 }}>⏳</div>
                  ) : isPlaying ? (
                    <Pause />
                  ) : (
                    <PlayArrow />
                  )}
                </IconButton>
                
                <IconButton 
                  onClick={handleStop}
                  disabled={loading}
                  size="large"
                >
                  <Stop />
                </IconButton>
                
                <IconButton 
                  onClick={() => handleSkip(10)}
                  disabled={loading}
                  size="large"
                >
                  <FastForward />
                </IconButton>

                <Box sx={{ flexGrow: 1 }} />

                {/* Volume Control */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <VolumeDown />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    style={{ width: 100 }}
                  />
                  <VolumeUp />
                </Stack>
              </Stack>

              {/* Progress Bar */}
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(currentTime)}
                  </Typography>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      step="1"
                      value={currentTime}
                      onChange={handleSeek}
                      disabled={loading}
                      style={{ 
                        width: '100%',
                        height: '6px',
                        background: `linear-gradient(to right, ${theme.palette.primary.main} 0%, ${theme.palette.primary.main} ${(currentTime / (duration || 100)) * 100}%, ${theme.palette.grey[300]} ${(currentTime / (duration || 100)) * 100}%, ${theme.palette.grey[300]} 100%)`
                      }}
                    />
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(duration)}
                  </Typography>
                </Stack>
              </Box>
            </>
          )}

          {/* Hidden audio element */}
          <audio
            ref={audioRef}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Interview Recording Details
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {recording.jobTitle}
            </Typography>
            {recording.company && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Company: {recording.company}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              Recorded: {formatDate(recording.timestamp)}
            </Typography>
          </Box>

          {recording.questions.length > 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Questions & Answers ({recording.questions.length})
              </Typography>
              <List>
                {recording.questions.map((question, index) => (
                  <React.Fragment key={question.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={question.question}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.primary">
                              <strong>Answer:</strong> {question.answer}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Duration: {Math.floor(question.duration / 1000)}s
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recording.questions.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Delete Recording</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this interview recording? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default InterviewRecordingPlayer;
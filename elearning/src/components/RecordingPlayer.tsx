import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Slider,
  Stack,
  Chip,
  useTheme,
  alpha,
  LinearProgress
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Fullscreen,
  FullscreenExit,
  Forward10,
  Replay10,
  Settings,
  Close,
  PictureInPicture
} from '@mui/icons-material';
import { ILiveSession } from '../services/liveSessionService';
import { recordingService } from '../services/recordingService';

interface RecordingPlayerProps {
  open: boolean;
  onClose: () => void;
  session: ILiveSession;
  autoPlay?: boolean;
}

const RecordingPlayer: React.FC<RecordingPlayerProps> = ({
  open,
  onClose,
  session,
  autoPlay = false
}) => {
  const theme = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-hide controls timer
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  // Initialize video
  useEffect(() => {
    if (open && videoRef.current && session.recordingUrl) {
      const video = videoRef.current;
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        setLoading(false);
        if (autoPlay) {
          video.play().catch(console.error);
        }
      };

      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime);
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        setIsPlaying(false);
        // Mark as watched when video ends
        recordingService.markRecordingWatched(session._id).catch(console.error);
      };

      const handleError = () => {
        setError('Failed to load recording');
        setLoading(false);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('error', handleError);
      };
    }
  }, [open, session.recordingUrl, autoPlay, session._id]);

  // Handle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  };

  // Handle seek
  const handleSeek = (value: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value;
      setCurrentTime(value);
    }
  };

  // Handle volume change
  const handleVolumeChange = (value: number) => {
    if (videoRef.current) {
      videoRef.current.volume = value;
      setVolume(value);
      setIsMuted(value === 0);
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  // Picture in Picture
  const togglePictureInPicture = () => {
    if (videoRef.current) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch(console.error);
      } else {
        videoRef.current.requestPictureInPicture().catch(console.error);
      }
    }
  };

  // Show controls temporarily
  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  // Format time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'black',
          color: 'white',
          minHeight: '70vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: alpha(theme.palette.common.black, 0.8), 
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box>
          <Typography variant="h6">{session.title}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.7 }}>
            {session.instructor?.firstName} {session.instructor?.lastName} • {recordingService.formatDuration(session.duration)}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, bgcolor: 'black', position: 'relative' }}>
        {loading && (
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}>
            <LinearProgress sx={{ width: 200, mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'white', textAlign: 'center' }}>
              Loading recording...
            </Typography>
          </Box>
        )}

        {error && (
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 10
          }}>
            <Typography variant="h6" sx={{ color: 'error.main', mb: 2 }}>
              {error}
            </Typography>
            <Button variant="outlined" onClick={onClose}>
              Close
            </Button>
          </Box>
        )}

        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '60vh',
            bgcolor: 'black',
            cursor: showControls ? 'default' : 'none'
          }}
          onMouseMove={showControlsTemporarily}
          onClick={togglePlayPause}
        >
          <video
            ref={videoRef}
            src={session.recordingUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            onLoadStart={() => setLoading(true)}
          />

          {/* Video Controls Overlay */}
          {showControls && !loading && !error && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: `linear-gradient(transparent, ${alpha(theme.palette.common.black, 0.8)})`,
                p: 2,
                transition: 'opacity 0.3s ease'
              }}
            >
              {/* Progress Bar */}
              <Slider
                value={currentTime}
                max={duration}
                onChange={(_, value) => handleSeek(value as number)}
                sx={{
                  color: theme.palette.primary.main,
                  mb: 1,
                  '& .MuiSlider-thumb': {
                    width: 16,
                    height: 16,
                  }
                }}
              />

              {/* Control Buttons */}
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  <IconButton onClick={togglePlayPause} sx={{ color: 'white' }}>
                    {isPlaying ? <Pause /> : <PlayArrow />}
                  </IconButton>
                  
                  <IconButton onClick={() => skip(-10)} sx={{ color: 'white' }}>
                    <Replay10 />
                  </IconButton>
                  
                  <IconButton onClick={() => skip(10)} sx={{ color: 'white' }}>
                    <Forward10 />
                  </IconButton>

                  <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 2 }}>
                    <IconButton onClick={toggleMute} sx={{ color: 'white' }}>
                      {isMuted ? <VolumeOff /> : <VolumeUp />}
                    </IconButton>
                    <Slider
                      value={isMuted ? 0 : volume}
                      max={1}
                      step={0.1}
                      onChange={(_, value) => handleVolumeChange(value as number)}
                      sx={{ width: 80, color: 'white' }}
                    />
                  </Stack>

                  <Typography variant="body2" sx={{ color: 'white', ml: 2 }}>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </Typography>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={1}>
                  <Chip
                    label={`${Math.round(progressPercentage)}% watched`}
                    size="small"
                    sx={{ bgcolor: alpha(theme.palette.primary.main, 0.2), color: 'white' }}
                  />
                  
                  <IconButton onClick={togglePictureInPicture} sx={{ color: 'white' }}>
                    <PictureInPicture />
                  </IconButton>
                  
                  <IconButton onClick={toggleFullscreen} sx={{ color: 'white' }}>
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </IconButton>
                </Stack>
              </Stack>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ bgcolor: alpha(theme.palette.common.black, 0.8), color: 'white' }}>
        <Button onClick={onClose} sx={{ color: 'white' }}>
          Close
        </Button>
        <Button 
          variant="contained" 
          onClick={() => window.open(session.recordingUrl, '_blank')}
        >
          Open in New Tab
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecordingPlayer;
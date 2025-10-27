import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  Avatar,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  PlayArrow,
  OndemandVideo,
  Person,
  CalendarToday,
  Timer,
  Group,
  Storage,
  MenuBook,
  Fullscreen,
  Download,
  Share,
  Bookmark,
  BookmarkBorder,
  CheckCircle,
  School
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ILiveSession } from '../services/liveSessionService';
import { recordingService } from '../services/recordingService';

// Styled Components
const RecordingCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 8px 32px ${alpha(theme.palette.success.main, 0.15)}`,
    borderColor: theme.palette.success.main,
  },
}));

const ThumbnailBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  height: 180,
  backgroundColor: theme.palette.grey[900],
  borderRadius: theme.spacing(1),
  overflow: 'hidden',
  cursor: 'pointer',
  '&:hover .play-overlay': {
    opacity: 1,
  },
}));

const PlayOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: alpha(theme.palette.common.black, 0.5),
  opacity: 0,
  transition: 'opacity 0.3s ease',
  '&.play-overlay': {
    opacity: 0,
  },
}));

const PlayButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
  width: 64,
  height: 64,
  '&:hover': {
    backgroundColor: theme.palette.success.dark,
    transform: 'scale(1.1)',
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1, 2),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '0.9rem',
}));

interface RecordingCardProps {
  session: ILiveSession;
  onPlay: (session: ILiveSession) => void;
  onViewInCourse?: (courseId: string) => void;
  showProgress?: boolean;
}

const RecordingCardComponent: React.FC<RecordingCardProps> = ({
  session,
  onPlay,
  onViewInCourse,
  showProgress = false
}) => {
  const theme = useTheme();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [watchProgress, setWatchProgress] = useState(0);

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, 'MMM dd, yyyy'),
      time: format(date, 'HH:mm')
    };
  };

  const { date, time } = formatDateTime(session.scheduledTime);

  // Handle bookmark toggle
  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
    // TODO: Implement bookmark functionality
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share && session.recordingUrl) {
      try {
        await navigator.share({
          title: session.title,
          text: `Check out this recorded session: ${session.title}`,
          url: session.recordingUrl,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      if (session.recordingUrl) {
        navigator.clipboard.writeText(session.recordingUrl);
        // TODO: Show toast notification
      }
    }
  };

  // Handle download
  const handleDownload = () => {
    if (session.recordingUrl) {
      const link = document.createElement('a');
      link.href = session.recordingUrl;
      link.download = `${session.title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <>
      <RecordingCard>
        <CardContent sx={{ flex: 1, p: 3 }}>
          {/* Thumbnail and Play Button */}
          <ThumbnailBox onClick={() => onPlay(session)}>
            {/* Video thumbnail would go here */}
            <Box
              sx={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.8)}, ${alpha(theme.palette.success.dark, 0.9)})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}
            >
              <OndemandVideo sx={{ fontSize: 48, color: 'white', mb: 1 }} />
              <Typography variant="caption" sx={{ color: 'white', opacity: 0.9 }}>
                📹 Recorded Session
              </Typography>
            </Box>
            
            <PlayOverlay className="play-overlay">
              <PlayButton>
                <PlayArrow sx={{ fontSize: 32 }} />
              </PlayButton>
            </PlayOverlay>

            {/* Duration badge */}
            <Chip
              label={recordingService.formatDuration(session.duration)}
              size="small"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: alpha(theme.palette.common.black, 0.7),
                color: 'white',
                fontSize: '0.75rem',
              }}
            />
          </ThumbnailBox>

          {/* Header with title and bookmark */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mt: 2, mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
              {session.title}
            </Typography>
            <Tooltip title={isBookmarked ? "Remove bookmark" : "Bookmark recording"}>
              <IconButton size="small" onClick={handleBookmarkToggle}>
                {isBookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
              </IconButton>
            </Tooltip>
          </Box>

          {/* Recording status */}
          <Chip
            label="📹 Recording Available"
            color="success"
            variant="filled"
            size="small"
            sx={{ mb: 2, fontWeight: 600 }}
          />

          {/* Course Info */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
              <School sx={{ fontSize: 14 }} />
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {session.course?.title || 'Course Title'}
            </Typography>
          </Stack>

          {/* Instructor */}
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Avatar sx={{ width: 24, height: 24 }}>
              <Person sx={{ fontSize: 14 }} />
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {session.instructor ? 
                `${session.instructor.firstName} ${session.instructor.lastName}` : 
                'Instructor Name'
              }
            </Typography>
          </Stack>

          {/* Session Details */}
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                📅 Recorded on {date} at {time}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Timer sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                ⏱️ {recordingService.formatDuration(session.duration)}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                👥 {session.participants?.length || 0} participants
              </Typography>
            </Stack>

            {session.recordingSize && (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Storage sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  💾 {recordingService.formatFileSize(session.recordingSize)}
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* Description */}
          {session.description && (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                mb: 2,
                display: '-webkit-box',
                WebkitLineClamp: showFullDescription ? 'none' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                cursor: 'pointer'
              }}
              onClick={() => setShowFullDescription(!showFullDescription)}
            >
              {session.description}
            </Typography>
          )}

          {/* Watch Progress */}
          {showProgress && watchProgress > 0 && (
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Watch Progress
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round(watchProgress)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={watchProgress} 
                sx={{ 
                  height: 4, 
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.success.main, 0.2),
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: theme.palette.success.main,
                  }
                }}
              />
            </Box>
          )}
        </CardContent>

        <Divider />

        <CardActions sx={{ p: 2, justifyContent: 'space-between' }}>
          {/* Main action button */}
          <ActionButton
            variant="contained"
            color="success"
            startIcon={<PlayArrow />}
            onClick={() => onPlay(session)}
            sx={{ flex: 1, mr: 1 }}
          >
            📹 Watch Recording
          </ActionButton>

          {/* Secondary actions */}
          <Stack direction="row" spacing={0.5}>
            {onViewInCourse && (
              <Tooltip title="View in course">
                <IconButton
                  size="small"
                  onClick={() => onViewInCourse(session.course._id)}
                  sx={{ 
                    border: 1, 
                    borderColor: 'success.main',
                    color: 'success.main',
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      borderColor: 'success.dark'
                    }
                  }}
                >
                  <MenuBook sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Share recording">
              <IconButton
                size="small"
                onClick={handleShare}
                sx={{ 
                  border: 1, 
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    borderColor: 'success.dark'
                  }
                }}
              >
                <Share sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download recording">
              <IconButton
                size="small"
                onClick={handleDownload}
                sx={{ 
                  border: 1, 
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': { 
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    borderColor: 'success.dark'
                  }
                }}
              >
                <Download sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </CardActions>
      </RecordingCard>

      {/* Full Description Dialog */}
      <Dialog
        open={showFullDescription}
        onClose={() => setShowFullDescription(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{session.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {session.description}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFullDescription(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RecordingCardComponent;
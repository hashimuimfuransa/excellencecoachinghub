import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Paper,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Fab,
  Zoom,
  useTheme,
  useMediaQuery,
  styled,
  Stack,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  VideoCall,
  Schedule,
  Person,
  PlayArrow,
  LiveTv,
  Home,
  Dashboard,
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  ScreenShare,
  StopScreenShare,
  Chat,
  People,
  Settings,
  Fullscreen,
  FullscreenExit,
  VolumeUp,
  VolumeOff,
  FiberManualRecord,
  Stop,
  PauseCircle,
  Refresh,
  CheckCircle,
  AccessTime,
  Group,
  Star,
  EmojiEvents,
  LocalFireDepartment,
  Diamond,
  AutoAwesome,
  Psychology,
  School,
  Celebration
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { courseService } from '../../services/courseService';
import LiveClass from '../../components/Video/LiveClass';
import VideoSessionWrapper from '../../components/Video/VideoSessionWrapper';

// Styled components for enhanced UI
const GradientBackground = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
  minHeight: '100vh',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '300px',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    zIndex: -1,
  }
}));

const FloatingCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease-in-out',
  backdropFilter: 'blur(10px)',
  background: 'rgba(255,255,255,0.95)',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 4),
  fontSize: '1.1rem',
  fontWeight: 600,
  textTransform: 'none',
  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 35px rgba(0,0,0,0.2)',
  }
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  fontWeight: 600,
  padding: theme.spacing(0.5, 1),
  fontSize: '0.9rem',
  '& .MuiChip-icon': {
    fontSize: '1.2rem',
  }
}));

const ParticipantCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.spacing(2),
  textAlign: 'center',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  }
}));

interface SessionParticipant {
  id: string;
  name: string;
  role: 'instructor' | 'student';
  avatar?: string;
  isOnline: boolean;
  joinedAt?: Date;
}

const EnhancedVideoSessionPage: React.FC = () => {
  const { courseId, sessionId } = useParams<{ courseId?: string; sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [session, setSession] = useState<ILiveSession | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inVideoRoom, setInVideoRoom] = useState(false);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    totalParticipants: 0,
    duration: 0,
    isRecording: false,
    quality: 'HD'
  });

  // Load session data
  useEffect(() => {
    const loadSessionData = async () => {
      if (!sessionId || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Load session details
        const sessionData = await liveSessionService.joinSessionAsStudent(sessionId);
        setSession(sessionData);

        // Load course details if courseId is provided
        if (courseId) {
          try {
            const courseData = await courseService.getPublicCourseById(courseId);
            setCourse(courseData);
          } catch (courseError) {
            console.warn('Could not load course details:', courseError);
          }
        }

        // Mock participants data
        setParticipants([
          {
            id: '1',
            name: `${sessionData.instructor.firstName} ${sessionData.instructor.lastName}`,
            role: 'instructor',
            isOnline: true,
            joinedAt: new Date()
          },
          {
            id: '2',
            name: `${user.firstName} ${user.lastName}`,
            role: 'student',
            isOnline: true,
            joinedAt: new Date()
          }
        ]);

        // Auto-join video room if session is live
        if (sessionData.status === 'live') {
          // Don't auto-join, let user choose
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSessionData();
  }, [sessionId, courseId, user]);

  // Handle joining video room
  const handleJoinVideoRoom = () => {
    setInVideoRoom(true);
  };

  // Handle leaving video room
  const handleLeaveVideoRoom = () => {
    setInVideoRoom(false);
    if (courseId) {
      navigate(`/course/${courseId}`);
    } else {
      navigate('/dashboard/student/live-sessions');
    }
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'live':
        return { color: 'success', icon: <LiveTv />, text: 'Live Now' };
      case 'scheduled':
        return { color: 'warning', icon: <Schedule />, text: 'Scheduled' };
      case 'ended':
        return { color: 'error', icon: <Stop />, text: 'Ended' };
      default:
        return { color: 'default', icon: <Schedule />, text: 'Unknown' };
    }
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  if (loading) {
    return (
      <GradientBackground>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ ml: 2, color: 'white' }}>
            Loading session...
          </Typography>
        </Box>
      </GradientBackground>
    );
  }

  if (error || !session) {
    return (
      <GradientBackground>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error || 'Session not found'}
          </Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard/student/live-sessions')}
            variant="contained"
            sx={{ borderRadius: 2 }}
          >
            Back to Sessions
          </Button>
        </Container>
      </GradientBackground>
    );
  }

  // If in video room, show the video component
  if (inVideoRoom) {
    return (
      <VideoSessionWrapper>
        <LiveClass
          sessionId={sessionId}
          userRole="student"
          onLeave={handleLeaveVideoRoom}
        />
      </VideoSessionWrapper>
    );
  }

  const statusInfo = getStatusInfo(session.status);

  return (
    <GradientBackground>
      {/* Custom App Bar */}
      <AppBar position="fixed" sx={{ bgcolor: 'transparent', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => courseId ? navigate(`/course/${courseId}`) : navigate('/dashboard/student/live-sessions')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {session.title}
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/dashboard')}>
            <Dashboard />
          </IconButton>
          <IconButton color="inherit" onClick={() => navigate('/')}>
            <Home />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 12, pb: 4 }}>
        {/* Session Header */}
        <FloatingCard sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      bgcolor: 'secondary.main',
                      mr: 3,
                      boxShadow: 3
                    }}
                  >
                    <VideoCall sx={{ fontSize: 40 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {session.title}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      with {session.instructor.firstName} {session.instructor.lastName}
                    </Typography>
                  </Box>
                </Box>

                {session.description && (
                  <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
                    {session.description}
                  </Typography>
                )}

                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  <StatusChip 
                    label={statusInfo.text}
                    color={statusInfo.color as any}
                    icon={statusInfo.icon}
                  />
                  <StatusChip 
                    label={formatDuration(session.duration)}
                    color="info" 
                    icon={<AccessTime />}
                  />
                  <StatusChip 
                    label={`${participants.length} Participants`}
                    color="primary" 
                    icon={<Group />}
                  />
                  {session.isRecorded && (
                    <StatusChip 
                      label="Recording"
                      color="error" 
                      icon={<FiberManualRecord />}
                    />
                  )}
                </Stack>

                {/* Session Details */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Scheduled Time
                      </Typography>
                      <Typography variant="h6">
                        {new Date(session.scheduledTime).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Session Quality
                      </Typography>
                      <Typography variant="h6">
                        HD • {sessionStats.quality}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  {/* Session Status Indicator */}
                  <Box sx={{ mb: 3 }}>
                    {session.status === 'live' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: 'error.main',
                            mr: 1,
                            animation: 'pulse 2s infinite'
                          }}
                        />
                        <Typography variant="h6" color="error.main" sx={{ fontWeight: 600 }}>
                          LIVE NOW
                        </Typography>
                      </Box>
                    )}
                    
                    {session.status === 'scheduled' && (
                      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                        Session starts in{' '}
                        {Math.max(0, Math.ceil((new Date(session.scheduledTime).getTime() - new Date().getTime()) / (1000 * 60)))} minutes
                      </Alert>
                    )}

                    {session.status === 'ended' && (
                      <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                        This session has ended
                        {session.recordingUrl && ' • Recording available'}
                      </Alert>
                    )}
                  </Box>

                  {/* Action Buttons */}
                  <Stack spacing={2}>
                    {(session.status === 'live' || session.status === 'scheduled') && (
                      <ActionButton
                        variant="contained"
                        size="large"
                        startIcon={<VideoCall />}
                        onClick={handleJoinVideoRoom}
                        sx={{
                          background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                          color: 'white'
                        }}
                      >
                        {session.status === 'live' ? '🔴 Join Live Session' : '▶️ Start Session'}
                      </ActionButton>
                    )}

                    {session.status === 'ended' && session.recordingUrl && (
                      <ActionButton
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrow />}
                        onClick={() => window.open(session.recordingUrl, '_blank')}
                        sx={{
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          color: 'white'
                        }}
                      >
                        📹 Watch Recording
                      </ActionButton>
                    )}

                    <ActionButton
                      variant="outlined"
                      size="large"
                      startIcon={<People />}
                      onClick={() => setShowParticipants(true)}
                    >
                      View Participants ({participants.length})
                    </ActionButton>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </FloatingCard>

        {/* Session Features */}
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'white', mb: 4, textAlign: 'center' }}>
          🎥 Session Features
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <FloatingCard>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Diamond sx={{ fontSize: 50, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  HD Quality
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Crystal clear video and audio
                </Typography>
              </CardContent>
            </FloatingCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FloatingCard>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <ScreenShare sx={{ fontSize: 50, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Screen Sharing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Interactive presentations
                </Typography>
              </CardContent>
            </FloatingCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FloatingCard>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Chat sx={{ fontSize: 50, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Live Chat
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Real-time messaging
                </Typography>
              </CardContent>
            </FloatingCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FloatingCard>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <FiberManualRecord sx={{ fontSize: 50, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Recording
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {session.isRecorded ? 'Available after session' : 'Not recorded'}
                </Typography>
              </CardContent>
            </FloatingCard>
          </Grid>
        </Grid>

        {/* Course Context (if available) */}
        {course && (
          <FloatingCard sx={{ mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                📚 Part of Course: {course.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This session is part of your enrolled course. Access more materials and track your progress.
              </Typography>
              <Button
                variant="outlined"
                startIcon={<School />}
                onClick={() => navigate(`/course/${courseId}`)}
              >
                View Course Details
              </Button>
            </CardContent>
          </FloatingCard>
        )}
      </Container>

      {/* Participants Dialog */}
      <Dialog 
        open={showParticipants} 
        onClose={() => setShowParticipants(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <People sx={{ mr: 1 }} />
            Session Participants ({participants.length})
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {participants.map((participant, index) => (
              <React.Fragment key={participant.id}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: participant.role === 'instructor' ? 'primary.main' : 'secondary.main' }}>
                      {participant.role === 'instructor' ? <Person /> : <School />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={participant.name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={participant.role} 
                          size="small" 
                          color={participant.role === 'instructor' ? 'primary' : 'secondary'}
                        />
                        {participant.isOnline && (
                          <Chip 
                            label="Online" 
                            size="small" 
                            color="success"
                            icon={<CheckCircle />}
                          />
                        )}
                      </Box>
                    }
                  />
                </ListItem>
                {index < participants.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowParticipants(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
        <Tooltip title="Refresh Session" placement="left">
          <Fab 
            color="primary" 
            onClick={() => window.location.reload()}
            size="large"
          >
            <Refresh />
          </Fab>
        </Tooltip>
      </Box>

      {/* CSS for pulse animation */}
      <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.7;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </GradientBackground>
  );
};

export default EnhancedVideoSessionPage;
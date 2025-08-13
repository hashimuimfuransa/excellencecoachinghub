import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  Paper,
  Stack,
  IconButton,
  Badge,
  Tooltip,
  Fade,
  Zoom,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  VideoCall,
  Schedule,
  Search,
  AccessTime,
  Group,
  PlayArrow,
  Videocam,
  OndemandVideo,
  LiveTv,
  Notifications,
  Star,
  Person,
  CalendarToday,
  Timer,
  RecordVoiceOver,
  Chat,
  PanTool,
  ScreenShare,
  Bookmark,
  BookmarkBorder,
  Refresh,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';

// Styled Components
const HeroCard = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '300px',
    height: '300px',
    background: `radial-gradient(circle, ${alpha(theme.palette.common.white, 0.1)} 0%, transparent 70%)`,
    borderRadius: '50%',
    transform: 'translate(30%, -30%)',
  },
}));

const SessionCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
    borderColor: theme.palette.primary.main,
  },
}));

const LiveBadge = styled(Chip)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.error.main}, ${theme.palette.error.dark})`,
  color: theme.palette.error.contrastText,
  fontWeight: 700,
  animation: 'pulse 2s infinite',
  '&::before': {
    content: '"🔴"',
    marginRight: theme.spacing(0.5),
  },
  '@keyframes pulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0.7)}`,
    },
    '70%': {
      boxShadow: `0 0 0 10px ${alpha(theme.palette.error.main, 0)}`,
    },
    '100%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.error.main, 0)}`,
    },
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
  '&:hover': {
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
    transform: 'translateY(-2px)',
  },
}));

const FilterCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: theme.spacing(2),
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
}));

const StudentLiveSessions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  // State management
  const [sessions, setSessions] = useState<ILiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use student-specific endpoint to get sessions from enrolled courses
        const response = await liveSessionService.getStudentSessions({
          status: statusFilter === 'all' ? undefined : statusFilter
        });
        
        setSessions(response.sessions);
      } catch (err: any) {
        setError(err.message || 'Failed to load live sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, [statusFilter]);

  // Filter sessions based on search and tab
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const now = new Date();
    const sessionTime = new Date(session.scheduledTime);
    
    switch (tabValue) {
      case 0: // Upcoming
        return matchesSearch && session.status === 'scheduled' && sessionTime > now;
      case 1: // Live
        return matchesSearch && session.status === 'live';
      case 2: // Past
        return matchesSearch && (session.status === 'ended' || session.status === 'cancelled' || sessionTime < now);
      default:
        return matchesSearch;
    }
  });

  // Handle join session
  const handleJoinSession = (sessionId: string) => {
    navigate(`/video-session/student/${sessionId}`);
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Get status color
  const getStatusColor = (status: string, session?: ILiveSession) => {
    switch (status) {
      case 'live':
        return 'error';
      case 'scheduled':
        return 'primary';
      case 'ended':
        return session?.recordingUrl ? 'success' : 'default';
      case 'cancelled':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get status label
  const getStatusLabel = (status: string, session?: ILiveSession) => {
    switch (status) {
      case 'live':
        return 'LIVE NOW';
      case 'scheduled':
        return 'Scheduled';
      case 'ended':
        return session?.recordingUrl ? 'Recording Available' : 'Ended';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // Count sessions by status
  const liveSessions = sessions.filter(s => s.status === 'live').length;
  const upcomingSessions = sessions.filter(s => {
    const now = new Date();
    const sessionTime = new Date(s.scheduledTime);
    return s.status === 'scheduled' && sessionTime > now;
  }).length;
  const recordedSessions = sessions.filter(s => s.status === 'ended' && s.recordingUrl).length;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 400, justifyContent: 'center' }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading your live sessions...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Hero Section */}
      <Fade in={true}>
        <HeroCard elevation={0}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box sx={{ zIndex: 1 }}>
              <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                🎥 Live Learning Sessions
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                Join interactive sessions with your instructors and fellow students!
              </Typography>
              <Stack direction="row" spacing={2}>
                <ActionButton 
                  variant="contained" 
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                  startIcon={<LiveTv />}
                  onClick={() => setTabValue(1)}
                >
                  🔴 Join Live Now
                </ActionButton>
                <ActionButton 
                  variant="outlined" 
                  sx={{ 
                    borderColor: 'white', 
                    color: 'white',
                    '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.1) }
                  }}
                  startIcon={<Schedule />}
                  onClick={() => setTabValue(0)}
                >
                  📅 View Schedule
                </ActionButton>
              </Stack>
            </Box>
            <IconButton 
              onClick={() => window.location.reload()}
              sx={{ color: 'white', opacity: 0.7 }}
              title="Refresh sessions"
            >
              <Refresh />
            </IconButton>
          </Stack>
        </HeroCard>
      </Fade>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.error.main, 0.05), border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
            <LiveTv sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
              {liveSessions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              🔴 Live Now
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <Schedule sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {upcomingSessions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📅 Upcoming
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), border: `1px solid ${alpha(theme.palette.success.main, 0.2)}` }}>
            <OndemandVideo sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
              {recordedSessions}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📹 Recordings
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {error && (
        <Zoom in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }} 
            onClose={() => setError(null)}
            action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            }
          >
            {error}
          </Alert>
        </Zoom>
      )}

      {/* Search and Filters */}
      <FilterCard sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          🔍 Find Your Sessions
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search for sessions, courses, or instructors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'white',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>📊 Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="📊 Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  borderRadius: 3,
                  bgcolor: 'white',
                }}
              >
                <MenuItem value="all">🌟 All Sessions</MenuItem>
                <MenuItem value="live">🔴 Live Now</MenuItem>
                <MenuItem value="scheduled">📅 Scheduled</MenuItem>
                <MenuItem value="ended">📹 Ended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </FilterCard>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              py: 2,
            },
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: 2,
            },
          }}
        >
          <Tab 
            icon={<Badge badgeContent={upcomingSessions} color="primary"><Schedule /></Badge>} 
            iconPosition="start"
            label="📅 Upcoming Sessions" 
            sx={{ 
              '&.Mui-selected': { 
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          />
          <Tab 
            icon={<Badge badgeContent={liveSessions} color="error"><LiveTv /></Badge>} 
            iconPosition="start"
            label="🔴 Live Now" 
            sx={{ 
              '&.Mui-selected': { 
                color: 'error.main',
                bgcolor: alpha(theme.palette.error.main, 0.05)
              }
            }}
          />
          <Tab 
            icon={<Badge badgeContent={recordedSessions} color="success"><OndemandVideo /></Badge>} 
            iconPosition="start"
            label="📹 Past Sessions" 
            sx={{ 
              '&.Mui-selected': { 
                color: 'success.main',
                bgcolor: alpha(theme.palette.success.main, 0.05)
              }
            }}
          />
        </Tabs>
      </Paper>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'grey.50' }}>
          <Box sx={{ mb: 3 }}>
            {tabValue === 0 && <Schedule sx={{ fontSize: 80, color: 'primary.main', opacity: 0.7 }} />}
            {tabValue === 1 && <LiveTv sx={{ fontSize: 80, color: 'error.main', opacity: 0.7 }} />}
            {tabValue === 2 && <OndemandVideo sx={{ fontSize: 80, color: 'success.main', opacity: 0.7 }} />}
          </Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {tabValue === 0 && '📅 No upcoming sessions'}
            {tabValue === 1 && '🔴 No live sessions right now'}
            {tabValue === 2 && '📹 No past sessions yet'}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {tabValue === 0 && 'Check back later for scheduled sessions from your enrolled courses.'}
            {tabValue === 1 && 'When instructors start live sessions, they will appear here.'}
            {tabValue === 2 && 'Completed sessions with recordings will be available here.'}
          </Typography>
          <ActionButton
            variant="outlined"
            onClick={() => navigate('/dashboard/student/courses')}
            startIcon={<VideoCall />}
          >
            🎓 View My Courses
          </ActionButton>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredSessions.map((session, index) => {
            const { date, time } = formatDateTime(session.scheduledTime);
            const isLive = session.status === 'live';
            const hasRecording = session.status === 'ended' && session.recordingUrl;

            return (
              <Grid item xs={12} md={6} lg={4} key={session._id}>
                <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <SessionCard>
                    <CardContent sx={{ flex: 1, p: 3 }}>
                      {/* Status and Actions Header */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                        {isLive ? (
                          <LiveBadge label="LIVE NOW" />
                        ) : (
                          <Chip
                            label={getStatusLabel(session.status, session)}
                            color={getStatusColor(session.status, session) as any}
                            variant={hasRecording ? 'filled' : 'outlined'}
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        <Tooltip title="Bookmark session">
                          <IconButton size="small">
                            <BookmarkBorder />
                          </IconButton>
                        </Tooltip>
                      </Stack>

                      {/* Session Title */}
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                        {session.title}
                      </Typography>

                      {/* Course Info */}
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                          📚
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {session.course?.title || 'Course Title'}
                        </Typography>
                      </Stack>

                      {/* Instructor */}
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          <Person sx={{ fontSize: 16 }} />
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
                            📅 {date} at {time}
                          </Typography>
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Timer sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            ⏱️ {session.duration} minutes
                          </Typography>
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            👥 {session.participants?.length || 0} participants
                          </Typography>
                        </Stack>
                      </Stack>

                      {/* Description */}
                      {session.description && (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {session.description}
                        </Typography>
                      )}

                      {/* Features */}
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
                        {session.chatEnabled && (
                          <Chip icon={<Chat />} label="💬 Chat" size="small" variant="outlined" />
                        )}
                        {session.handRaiseEnabled && (
                          <Chip icon={<PanTool />} label="✋ Hand Raise" size="small" variant="outlined" />
                        )}
                        {session.screenShareEnabled && (
                          <Chip icon={<ScreenShare />} label="🖥️ Screen Share" size="small" variant="outlined" />
                        )}
                        {session.isRecorded && (
                          <Chip icon={<Videocam />} label="📹 Recorded" size="small" variant="outlined" />
                        )}
                      </Stack>
                    </CardContent>

                    <Divider />

                    <CardActions sx={{ p: 3 }}>
                      {isLive ? (
                        <ActionButton
                          fullWidth
                          variant="contained"
                          color="error"
                          size="large"
                          startIcon={<LiveTv />}
                          onClick={() => handleJoinSession(session._id)}
                          sx={{ 
                            fontWeight: 'bold',
                            animation: 'pulse 2s infinite',
                            bgcolor: 'error.main',
                            '&:hover': { bgcolor: 'error.dark' }
                          }}
                        >
                          🔴 Join Live Session
                        </ActionButton>
                      ) : session.status === 'scheduled' ? (
                        <ActionButton
                          fullWidth
                          variant="outlined"
                          startIcon={<Schedule />}
                          disabled
                        >
                          📅 Starts at {time}
                        </ActionButton>
                      ) : hasRecording ? (
                        <ActionButton
                          fullWidth
                          variant="contained"
                          color="success"
                          startIcon={<OndemandVideo />}
                          onClick={() => navigate(`/dashboard/student/courses/${session.course._id}/content`)}
                        >
                          📹 Watch Recording
                        </ActionButton>
                      ) : session.status === 'ended' ? (
                        <ActionButton
                          fullWidth
                          variant="outlined"
                          startIcon={<CheckCircle />}
                          disabled
                        >
                          ✅ Session Completed
                        </ActionButton>
                      ) : (
                        <ActionButton
                          fullWidth
                          variant="outlined"
                          disabled
                        >
                          Session Unavailable
                        </ActionButton>
                      )}
                    </CardActions>
                  </SessionCard>
                </Zoom>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default StudentLiveSessions;

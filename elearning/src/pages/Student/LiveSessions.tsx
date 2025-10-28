import React, { useState, useEffect, useRef } from 'react';
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
  styled,
  useMediaQuery
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
  CheckCircle,
  MenuBook,
  Storage,
  ArrowBack
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { recordingService } from '../../services/recordingService';
import RecordingCard from '../../components/RecordingCard';
import RecordingPlayer from '../../components/RecordingPlayer';
import apiService from '../../services/apiService';
import { useLocation } from 'react-router-dom';

// Styled Components
const HeroCard = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(3, 2.5),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(4),
  },
  marginBottom: theme.spacing(3),
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(4),
  },
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
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const tabsRef = useRef<HTMLDivElement>(null);

  // Parse courseId from query string if provided
  const params = new URLSearchParams(location.search);
  const courseIdFilter = params.get('courseId') || '';

  // Scroll to tabs section
  const scrollToTabs = () => {
    tabsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // State management
  const [sessions, setSessions] = useState<ILiveSession[]>([]);
  const [uploadedRecordings, setUploadedRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [selectedRecording, setSelectedRecording] = useState<ILiveSession | null>(null);
  const [showRecordingPlayer, setShowRecordingPlayer] = useState(false);

  // Load uploaded recordings from Cloudinary
  const loadUploadedRecordings = async () => {
    try {
      setRecordingsLoading(true);
      const response = await apiService.get('/recorded-sessions/student?page=1&limit=50');
      
      if (response.success && response.data) {
        setUploadedRecordings(response.data.recordings || []);
      }
    } catch (err: any) {
      console.error('Error loading uploaded recordings:', err);
      // Don't set error here as it's not critical for the main page
    } finally {
      setRecordingsLoading(false);
    }
  };

  // Load sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use student-specific endpoint to get sessions from enrolled courses
        const response = await liveSessionService.getStudentSessions({
          status: statusFilter === 'all' ? undefined : statusFilter,
          courseId: courseIdFilter || undefined
        } as any);
        
        let loaded = response.sessions || [];
        // Fallback client-side filter by courseId if backend ignores it
        if (courseIdFilter) {
          loaded = loaded.filter(s => (s.course as any)?._id === courseIdFilter || (s as any).courseId === courseIdFilter);
        }
        setSessions(loaded);
      } catch (err: any) {
        setError(err.message || 'Failed to load live sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
    loadUploadedRecordings(); // Also load uploaded recordings
  }, [statusFilter, courseIdFilter]);

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
      case 2: // Recordings
        return matchesSearch && session.status === 'ended' && session.recordingUrl;
      case 3: // Past (All past sessions)
        return matchesSearch && (session.status === 'ended' || session.status === 'cancelled' || sessionTime < now);
      default:
        return matchesSearch;
    }
  });

  // Handle join session
  const handleJoinSession = (sessionId: string) => {
    navigate(`/dashboard/student/live-sessions/${sessionId}/room`);
  };

  // Handle play recording
  const handlePlayRecording = (session: ILiveSession) => {
    setSelectedRecording(session);
    setShowRecordingPlayer(true);
  };

  // Handle close recording player
  const handleCloseRecordingPlayer = () => {
    setShowRecordingPlayer(false);
    setSelectedRecording(null);
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
  const liveSessionRecordings = sessions.filter(s => s.status === 'ended' && s.recordingUrl).length;
  const recordedSessions = liveSessionRecordings + uploadedRecordings.length;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 400, justifyContent: 'center' }}>
          <CircularProgress size={isMobile ? 40 : 60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Loading your live sessions...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default', minHeight: '100vh', pb: { xs: 2, sm: 3 }, overflowX: 'hidden' }}>
      <Box sx={{ width: '100%', maxWidth: { xs: '360px', sm: '540px', md: '900px', lg: '1240px' }, mx: 'auto', py: { xs: 1, sm: 2, md: 3 }, px: { xs: 2, sm: 2, md: 3 } }}>
        <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
          <Button 
            variant="text" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate(-1)} 
            sx={{ 
              color: 'text.primary',
              textTransform: 'none',
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
              pl: 0,
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) }
            }}
          >
            Back
          </Button>
        </Box>
      {/* Hero Section */}
      <Fade in={true}>
        <HeroCard elevation={0}>
          <Stack 
            direction="column" 
            alignItems="stretch" 
            justifyContent="space-between" 
            gap={{ xs: 2.5, sm: 3 }}
            sx={{ position: 'relative', zIndex: 2 }}
          >
            {/* Header with title and refresh button */}
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.4rem', sm: '2rem', md: '2.5rem' }, lineHeight: 1.15 }}>
                  🎥 Live Sessions
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.8rem', sm: '0.9rem' }, lineHeight: 1.4 }}>
                  Join live classes or stream recordings
                </Typography>
              </Box>
              <Tooltip title="Refresh">
                <IconButton 
                  onClick={() => window.location.reload()}
                  sx={{ 
                    color: 'white', 
                    opacity: 0.8,
                    '&:hover': { opacity: 1, transform: 'rotate(180deg)' },
                    transition: 'all 0.3s ease',
                    flexShrink: 0,
                    mt: -0.5
                  }}
                >
                  <Refresh sx={{ fontSize: { xs: 24, sm: 28 } }} />
                </IconButton>
              </Tooltip>
            </Stack>

            {/* Action buttons - optimized for mobile */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={1}
              sx={{ width: '100%' }}
            >
              <ActionButton 
                fullWidth
                variant="contained" 
                size="small"
                sx={{ 
                  bgcolor: 'white', 
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  py: { xs: 1, sm: 1.25 },
                  '&:hover': { bgcolor: 'grey.100', transform: 'translateY(-2px)' }
                }}
                startIcon={<LiveTv sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                onClick={() => { setTabValue(1); scrollToTabs(); }}
              >
                Join Live
              </ActionButton>
              <ActionButton 
                fullWidth
                variant="outlined" 
                size="small"
                sx={{ 
                  borderColor: 'white', 
                  color: 'white',
                  fontWeight: 600,
                  fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  py: { xs: 1, sm: 1.25 },
                  '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.15) }
                }}
                startIcon={<Schedule sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                onClick={() => { setTabValue(0); scrollToTabs(); }}
              >
                Schedule
              </ActionButton>
              {recordedSessions > 0 && (
                <ActionButton 
                  fullWidth
                  variant="outlined" 
                  size="small"
                  sx={{ 
                    borderColor: 'white', 
                    color: 'white',
                    fontWeight: 600,
                    fontSize: { xs: '0.85rem', sm: '0.95rem' },
                    py: { xs: 1, sm: 1.25 },
                    '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.15) }
                  }}
                  startIcon={<OndemandVideo sx={{ fontSize: { xs: 20, sm: 24 } }} />}
                  onClick={() => { setTabValue(2); scrollToTabs(); }}
                >
                  Recordings
                </ActionButton>
              )}
            </Stack>
          </Stack>
        </HeroCard>
      </Fade>

      {/* Quick Stats */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: { xs: 2.5, sm: 4, md: 5 } }}>
        <Grid item xs={6} sm={3}>
          <Card 
            sx={{ 
              textAlign: 'center', 
              p: { xs: 1.5, sm: 2, md: 2.5 }, 
              bgcolor: alpha(theme.palette.error.main, 0.08), 
              border: `2px solid ${alpha(theme.palette.error.main, 0.2)}`,
              cursor: liveSessions > 0 ? 'pointer' : 'default',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': liveSessions > 0 ? {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 20px ${alpha(theme.palette.error.main, 0.2)}`,
                borderColor: theme.palette.error.main
              } : {}
            }}
            onClick={() => liveSessions > 0 && setTabValue(1)}
          >
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: { xs: 36, sm: 44 }, 
              height: { xs: 36, sm: 44 }, 
              bgcolor: alpha(theme.palette.error.main, 0.2), 
              borderRadius: 2, 
              mb: 1 
            }}>
              <LiveTv sx={{ fontSize: { xs: 22, sm: 26 }, color: 'error.main' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'error.main', fontSize: { xs: '1.4rem', sm: '1.6rem' }, mb: 0.25, lineHeight: 1 }}>
              {liveSessions}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.85rem' }, fontWeight: 600 }}>
              Live
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card 
            sx={{ 
              textAlign: 'center', 
              p: { xs: 1.5, sm: 2, md: 2.5 }, 
              bgcolor: alpha(theme.palette.primary.main, 0.08), 
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              cursor: upcomingSessions > 0 ? 'pointer' : 'default',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': upcomingSessions > 0 ? {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.2)}`,
                borderColor: theme.palette.primary.main
              } : {}
            }}
            onClick={() => upcomingSessions > 0 && setTabValue(0)}
          >
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: { xs: 36, sm: 44 }, 
              height: { xs: 36, sm: 44 }, 
              bgcolor: alpha(theme.palette.primary.main, 0.2), 
              borderRadius: 2, 
              mb: 1 
            }}>
              <Schedule sx={{ fontSize: { xs: 22, sm: 26 }, color: 'primary.main' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.4rem', sm: '1.6rem' }, mb: 0.25, lineHeight: 1 }}>
              {upcomingSessions}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.85rem' }, fontWeight: 600 }}>
              Soon
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card 
            sx={{ 
              textAlign: 'center', 
              p: { xs: 1.5, sm: 2, md: 2.5 }, 
              bgcolor: alpha(theme.palette.success.main, 0.08), 
              border: `2px solid ${alpha(theme.palette.success.main, 0.2)}`,
              cursor: recordedSessions > 0 ? 'pointer' : 'default',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': recordedSessions > 0 ? {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 20px ${alpha(theme.palette.success.main, 0.2)}`,
                borderColor: theme.palette.success.main
              } : {}
            }}
            onClick={() => recordedSessions > 0 && setTabValue(2)}
          >
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: { xs: 36, sm: 44 }, 
              height: { xs: 36, sm: 44 }, 
              bgcolor: alpha(theme.palette.success.main, 0.2), 
              borderRadius: 2, 
              mb: 1 
            }}>
              <OndemandVideo sx={{ fontSize: { xs: 22, sm: 26 }, color: 'success.main' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'success.main', fontSize: { xs: '1.4rem', sm: '1.6rem' }, mb: 0.25, lineHeight: 1 }}>
              {recordedSessions}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.85rem' }, fontWeight: 600 }}>
              Videos
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card 
            sx={{ 
              textAlign: 'center', 
              p: { xs: 1.5, sm: 2, md: 2.5 }, 
              bgcolor: alpha(theme.palette.info.main, 0.08), 
              border: `2px solid ${alpha(theme.palette.info.main, 0.2)}`,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderRadius: 2.5,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 8px 20px ${alpha(theme.palette.info.main, 0.2)}`,
                borderColor: theme.palette.info.main
              }
            }}
            onClick={() => navigate('/dashboard/student/courses')}
          >
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: { xs: 36, sm: 44 }, 
              height: { xs: 36, sm: 44 }, 
              bgcolor: alpha(theme.palette.info.main, 0.2), 
              borderRadius: 2, 
              mb: 1 
            }}>
              <MenuBook sx={{ fontSize: { xs: 22, sm: 26 }, color: 'info.main' }} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: 'info.main', fontSize: { xs: '1.4rem', sm: '1.6rem' }, mb: 0.25, lineHeight: 1 }}>
              📚
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.85rem' }, fontWeight: 600 }}>
              Courses
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* New Recordings Alert */}
      {recordedSessions > 0 && tabValue !== 2 && (
        <Fade in={true}>
          <Alert 
            severity="success" 
            sx={{ 
              mb: { xs: 2, sm: 3 }, 
              borderRadius: 2,
              border: `1px solid ${theme.palette.success.main}`,
              bgcolor: alpha(theme.palette.success.main, 0.05)
            }}
            action={
              <Button 
                color="success" 
                size={isMobile ? 'small' : 'medium'} 
                onClick={() => setTabValue(2)}
                sx={{ fontWeight: 600 }}
              >
                📹 View Recordings
              </Button>
            }
            icon={<OndemandVideo />}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              🎉 New Recordings Available!
            </Typography>
            <Typography variant="body2">
              You have {recordedSessions} recorded session{recordedSessions > 1 ? 's' : ''} ready to watch from your instructors.
            </Typography>
          </Alert>
        </Fade>
      )}

      {error && (
        <Zoom in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: { xs: 2, sm: 3 }, borderRadius: 2 }} 
            onClose={() => setError(null)}
            action={
              <Button color="inherit" size={isMobile ? 'small' : 'medium'} onClick={() => window.location.reload()}>
                Try Again
              </Button>
            }
          >
            {error}
          </Alert>
        </Zoom>
      )}

      {/* Search and Filters */}
      <FilterCard sx={{ mb: { xs: 2.5, sm: 4, md: 5 }, p: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.2rem' } }}>
          🔍 Find Sessions
        </Typography>
        <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ width: '100%' }}>
          <TextField
            fullWidth
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'white',
                fontSize: { xs: '0.85rem', sm: '0.95rem' }
              },
              '& .MuiOutlinedInput-input::placeholder': {
                opacity: 0.6
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'primary.main', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            size={isMobile ? 'small' : 'medium'}
          />
          <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
            <InputLabel sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{
                borderRadius: 2,
                bgcolor: 'white',
                '& .MuiOutlinedInput-input': {
                  fontSize: { xs: '0.85rem', sm: '0.95rem' }
                }
              }}
            >
              <MenuItem value="all">All Sessions</MenuItem>
              <MenuItem value="live">🔴 Live Now</MenuItem>
              <MenuItem value="scheduled">📅 Scheduled</MenuItem>
              <MenuItem value="ended">📹 Ended</MenuItem>
              {tabValue === 2 && (
                <MenuItem value="recorded">🎬 With Recordings</MenuItem>
              )}
            </Select>
          </FormControl>
        </Stack>
      </FilterCard>

      {/* Navigation Tabs */}
      <Paper ref={tabsRef} sx={{ mb: { xs: 3, sm: 4, md: 5 }, borderRadius: 3, overflow: 'hidden', boxShadow: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          variant={isMobile ? 'scrollable' : 'fullWidth'}
          scrollButtons={isMobile ? 'auto' : undefined}
          allowScrollButtonsMobile
          sx={{
            bgcolor: 'background.paper',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' },
              fontWeight: 600,
              py: { xs: 1.5, sm: 2 },
              px: { xs: 1.5, sm: 2.5 },
              minHeight: { xs: 48, sm: 56 },
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.03)
              }
            },
            '& .MuiTabs-indicator': {
              height: 5,
              borderRadius: '5px 5px 0 0',
              background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
            },
          }}
        >
          <Tab 
            icon={<Badge badgeContent={upcomingSessions} color="primary" sx={{ '& .MuiBadge-badge': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}><Schedule /></Badge>} 
            iconPosition="start"
            label={isMobile ? "Upcoming" : "📅 Upcoming"}
            sx={{ 
              '&.Mui-selected': { 
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          />
          <Tab 
            icon={<Badge badgeContent={liveSessions} color="error" sx={{ '& .MuiBadge-badge': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}><LiveTv /></Badge>} 
            iconPosition="start"
            label={isMobile ? "Live" : "🔴 Live Now"}
            sx={{ 
              '&.Mui-selected': { 
                color: 'error.main',
                bgcolor: alpha(theme.palette.error.main, 0.05)
              }
            }}
          />
          <Tab 
            icon={<Badge badgeContent={recordedSessions} color="success" sx={{ '& .MuiBadge-badge': { fontSize: { xs: '0.65rem', sm: '0.75rem' } } }}><OndemandVideo /></Badge>} 
            iconPosition="start"
            label={isMobile ? "Recordings" : "📹 Recordings"}
            sx={{ 
              '&.Mui-selected': { 
                color: 'success.main',
                bgcolor: alpha(theme.palette.success.main, 0.05)
              }
            }}
          />
          <Tab 
            icon={<Schedule />} 
            iconPosition="start"
            label={isMobile ? "Past" : "📚 Past"}
            sx={{ 
              '&.Mui-selected': { 
                color: 'info.main',
                bgcolor: alpha(theme.palette.info.main, 0.05)
              }
            }}
          />
        </Tabs>
      </Paper>

      {/* Sessions Grid */}
      {(() => {
        // For recordings tab, combine both types of recordings
        if (tabValue === 2) {
          const liveRecordings = sessions.filter(s => s.status === 'ended' && s.recordingUrl);
          const allRecordings = [...liveRecordings, ...uploadedRecordings];
          
          // Filter recordings based on search
          const filteredRecordings = allRecordings.filter(recording => {
            const title = recording.title || '';
            const description = recording.description || '';
            return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   description.toLowerCase().includes(searchTerm.toLowerCase());
          });

          if (filteredRecordings.length === 0) {
            return (
              <Paper sx={{ p: { xs: 3, sm: 4, md: 6 }, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.03), border: `2px dashed ${alpha(theme.palette.success.main, 0.2)}` }}>
                <Box sx={{ mb: 3 }}>
                  <OndemandVideo sx={{ fontSize: { xs: 60, sm: 80, md: 100 }, color: 'success.main', opacity: 0.5 }} />
                </Box>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' } }}>
                  📹 No Recordings Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' }, lineHeight: 1.6 }}>
                  {recordingsLoading ? 'Loading recordings...' : 'Once your instructors record live sessions, they\'ll appear here for you to watch anytime.'}
                </Typography>
                {recordingsLoading && <CircularProgress size={30} sx={{ mt: 2 }} />}
                {!recordingsLoading && (
                  <ActionButton
                    variant="outlined"
                    size={isMobile ? 'small' : 'medium'}
                    onClick={() => navigate('/dashboard/student/courses')}
                    startIcon={<VideoCall />}
                    sx={{ mt: 2 }}
                  >
                    View My Courses
                  </ActionButton>
                )}
              </Paper>
            );
          }

          return (
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              {filteredRecordings.map((recording, index) => {
                const isLiveSessionRecording = 'status' in recording;
                
                return (
                  <Grid item xs={12} sm={6} md={6} lg={4} key={recording._id}>
                    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                      {isLiveSessionRecording ? (
                        <RecordingCard
                          session={recording}
                          onPlay={handlePlayRecording}
                          onViewInCourse={(courseId) => navigate(`/course/${courseId}`)}
                          showProgress={true}
                        />
                      ) : (
                        // Custom card for uploaded recordings
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <CardContent sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                              <Chip
                                label="📹 Uploaded Recording"
                                color="success"
                                variant="filled"
                                sx={{ fontWeight: 600 }}
                              />
                            </Stack>
                            
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                              {recording.title}
                            </Typography>
                            
                            {recording.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {recording.description}
                              </Typography>
                            )}
                            
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                              <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                                📚
                              </Avatar>
                              <Typography variant="body2" color="text.secondary">
                                {recording.course?.title || 'Course'}
                              </Typography>
                            </Stack>
                            
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                              <Avatar sx={{ width: 24, height: 24 }}>
                                <Person sx={{ fontSize: 16 }} />
                              </Avatar>
                              <Typography variant="body2" color="text.secondary">
                                {recording.instructor?.firstName} {recording.instructor?.lastName}
                              </Typography>
                            </Stack>
                            
                            {recording.duration && (
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Timer sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {recording.duration}
                                </Typography>
                              </Stack>
                            )}
                          </CardContent>
                          
                          <CardActions sx={{ p: { xs: 2, md: 3 }, pt: 0 }}>
                            <Button
                              fullWidth
                              variant="contained"
                              size={isMobile ? 'small' : 'medium'}
                              startIcon={<PlayArrow />}
                              onClick={() => {
                                // Open video in new tab or use a video player
                                window.open(recording.recordingUrl, '_blank');
                              }}
                              sx={{ borderRadius: 2 }}
                            >
                              Watch Recording
                            </Button>
                          </CardActions>
                        </Card>
                      )}
                    </Zoom>
                  </Grid>
                );
              })}
            </Grid>
          );
        }

        if (filteredSessions.length === 0) {
          return (
            <Paper sx={{ p: { xs: 3, sm: 4, md: 6 }, textAlign: 'center', borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.03), border: `2px dashed ${alpha(theme.palette.primary.main, 0.2)}` }}>
              <Box sx={{ mb: 3 }}>
                {tabValue === 0 && <Schedule sx={{ fontSize: { xs: 60, sm: 80, md: 100 }, color: 'primary.main', opacity: 0.5 }} />}
                {tabValue === 1 && <LiveTv sx={{ fontSize: { xs: 60, sm: 80, md: 100 }, color: 'error.main', opacity: 0.5 }} />}
                {tabValue === 3 && <Schedule sx={{ fontSize: { xs: 60, sm: 80, md: 100 }, color: 'info.main', opacity: 0.5 }} />}
              </Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: '1.2rem', sm: '1.5rem', md: '1.75rem' } }}>
                {tabValue === 0 && '📅 No Upcoming Sessions'}
                {tabValue === 1 && '🔴 No Live Sessions Now'}
                {tabValue === 3 && '📚 No Past Sessions'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' }, lineHeight: 1.6 }}>
                {tabValue === 0 && 'Stay tuned! Instructors will schedule sessions soon. Check back or enable notifications.'}
                {tabValue === 1 && 'No live sessions at the moment. View the schedule to see when instructors go live.'}
                {tabValue === 3 && 'Complete sessions will appear here for you to review.'}
              </Typography>
              <ActionButton
                variant="outlined"
                size={isMobile ? 'small' : 'medium'}
                onClick={() => navigate('/dashboard/student/courses')}
                startIcon={<VideoCall />}
                sx={{ mt: 2 }}
              >
                View My Courses
              </ActionButton>
            </Paper>
          );
        }

        return (
          <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
            {filteredSessions.map((session, index) => {
              const { date, time } = formatDateTime(session.scheduledTime);
              const isLive = session.status === 'live';
              const hasRecording = session.status === 'ended' && session.recordingUrl;

              return (
                <Grid item xs={12} sm={6} md={6} lg={4} key={session._id}>
                  <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                    <SessionCard>
                      <CardContent sx={{ flex: 1, p: { xs: 2.5, sm: 3, md: 3 } }}>
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
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
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

                          {/* Recording-specific information */}
                          {hasRecording && (
                            <>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <OndemandVideo sx={{ fontSize: 16, color: 'success.main' }} />
                                <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                                  📹 Recording Available
                                </Typography>
                              </Stack>
                              {session.recordingSize && (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                  <Storage sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    💾 {(session.recordingSize / (1024 * 1024)).toFixed(1)} MB
                                  </Typography>
                                </Stack>
                              )}
                            </>
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

                      <CardActions sx={{ p: { xs: 2, sm: 2.5, md: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 1 } }}>
                        {isLive ? (
                          <ActionButton
                            fullWidth
                            variant="contained"
                            color="error"
                            size={isMobile ? 'small' : 'medium'}
                            startIcon={<LiveTv />}
                            onClick={() => handleJoinSession(session._id)}
                            sx={{ 
                              fontWeight: 'bold',
                              animation: 'pulse 2s infinite',
                              bgcolor: 'error.main',
                              fontSize: { xs: '0.85rem', sm: '0.95rem' },
                              py: { xs: 0.75, sm: 1 },
                              '&:hover': { bgcolor: 'error.dark', transform: 'translateY(-1px)' }
                            }}
                          >
                            Join Live Session
                          </ActionButton>
                        ) : session.status === 'scheduled' ? (
                          <ActionButton
                            fullWidth
                            variant="outlined"
                            size={isMobile ? 'small' : 'medium'}
                            startIcon={<Schedule />}
                            disabled
                            sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}
                          >
                            Starts at {time}
                          </ActionButton>
                        ) : hasRecording ? (
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: '100%' }}>
                            <ActionButton
                              fullWidth
                              variant="contained"
                              color="success"
                              size={isMobile ? 'small' : 'medium'}
                              startIcon={<OndemandVideo />}
                              onClick={() => handlePlayRecording(session)}
                              sx={{ 
                                bgcolor: 'success.main',
                                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                                py: { xs: 0.75, sm: 1 },
                                '&:hover': { bgcolor: 'success.dark', transform: 'translateY(-1px)' }
                              }}
                            >
                              Watch Recording
                            </ActionButton>
                            <Tooltip title="View in course">
                              <IconButton
                                color="success"
                                onClick={() => navigate(`/course/${session.course._id}`)}
                                sx={{ 
                                  border: 1, 
                                  borderColor: 'success.main',
                                  '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) },
                                  alignSelf: { xs: 'stretch', sm: 'center' }
                                }}
                              >
                                <MenuBook />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : session.status === 'ended' ? (
                          <ActionButton
                            fullWidth
                            variant="outlined"
                            size={isMobile ? 'small' : 'medium'}
                            startIcon={<CheckCircle />}
                            disabled
                            sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}
                          >
                            Session Completed
                          </ActionButton>
                        ) : (
                          <ActionButton
                            fullWidth
                            variant="outlined"
                            size={isMobile ? 'small' : 'medium'}
                            disabled
                            sx={{ fontSize: { xs: '0.85rem', sm: '0.95rem' } }}
                          >
                            Unavailable
                          </ActionButton>
                        )}
                      </CardActions>
                    </SessionCard>
                  </Zoom>
                </Grid>
              );
            })}
          </Grid>
        );
      })()}

      {/* Recording Player Dialog */}
      {selectedRecording && (
        <RecordingPlayer
          open={showRecordingPlayer}
          onClose={handleCloseRecordingPlayer}
          session={selectedRecording}
          autoPlay={true}
        />
      )}
      </Box>
    </Box>
  );
};

export default StudentLiveSessions;

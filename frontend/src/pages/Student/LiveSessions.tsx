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
  Divider
} from '@mui/material';
import {
  VideoCall,
  Schedule,
  Search,
  AccessTime,
  Group
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';

const StudentLiveSessions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    navigate(`/dashboard/student/live-sessions/${sessionId}/room`);
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
        return 'LIVE';
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Live Sessions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Join live sessions with your instructors
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="live">Live</MenuItem>
                  <MenuItem value="ended">Ended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Upcoming" />
          <Tab label="Live Now" />
          <Tab label="Past Sessions" />
        </Tabs>
      </Box>

      {/* Sessions Grid */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <VideoCall sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No sessions found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 0 && 'No upcoming sessions scheduled for your enrolled courses'}
              {tabValue === 1 && 'No live sessions at the moment'}
              {tabValue === 2 && 'No past sessions to display. Completed sessions with recordings will appear here.'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredSessions.map((session) => {
            const { date, time } = formatDateTime(session.scheduledTime);
            const isLive = session.status === 'live';

            return (
              <Grid item xs={12} md={6} lg={4} key={session._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    {/* Status Badge */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Chip
                        label={getStatusLabel(session.status, session)}
                        color={getStatusColor(session.status, session) as any}
                        size="small"
                        variant={isLive || (session.status === 'ended' && session.recordingUrl) ? 'filled' : 'outlined'}
                      />
                      {isLive && (
                        <Chip
                          label="JOIN NOW"
                          color="error"
                          size="small"
                          sx={{ fontWeight: 'bold', animation: 'pulse 2s infinite' }}
                        />
                      )}
                      {session.status === 'ended' && session.recordingUrl && (
                        <Chip
                          label="📹 RECORDED"
                          color="success"
                          size="small"
                          variant="filled"
                          sx={{ fontWeight: 'bold' }}
                        />
                      )}
                    </Box>

                    {/* Session Title */}
                    <Typography variant="h6" gutterBottom>
                      {session.title}
                    </Typography>

                    {/* Course Info */}
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {session.course?.title || 'Course Title'}
                    </Typography>

                    {/* Instructor */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                        {session.instructor?.firstName?.charAt(0) || 'T'}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {session.instructor ? 
                          `${session.instructor.firstName} ${session.instructor.lastName}` : 
                          'Instructor Name'
                        }
                      </Typography>
                    </Box>

                    {/* Session Details */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Schedule sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {date} at {time}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <AccessTime sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {session.duration} minutes
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Group sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {session.participants?.length || 0} participants
                      </Typography>
                    </Box>

                    {/* Description */}
                    {session.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {session.description.length > 100 
                          ? `${session.description.substring(0, 100)}...` 
                          : session.description
                        }
                      </Typography>
                    )}

                    {/* Features */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {session.chatEnabled && (
                        <Chip label="Chat" size="small" variant="outlined" />
                      )}
                      {session.handRaiseEnabled && (
                        <Chip label="Hand Raise" size="small" variant="outlined" />
                      )}
                      {session.screenShareEnabled && (
                        <Chip label="Screen Share" size="small" variant="outlined" />
                      )}
                      {session.isRecorded && (
                        <Chip label="Recorded" size="small" variant="outlined" />
                      )}
                    </Box>
                  </CardContent>

                  <Divider />

                  <CardActions sx={{ p: 2 }}>
                    {isLive ? (
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        startIcon={<VideoCall />}
                        onClick={() => handleJoinSession(session._id)}
                        sx={{ fontWeight: 'bold' }}
                      >
                        Join Live Session
                      </Button>
                    ) : session.status === 'scheduled' ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Schedule />}
                        disabled
                      >
                        Scheduled for {time}
                      </Button>
                    ) : session.status === 'ended' && session.recordingUrl ? (
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        startIcon={<VideoCall />}
                        onClick={() => navigate(`/dashboard/student/courses/${session.course._id}/content`)}
                      >
                        Watch Recording
                      </Button>
                    ) : session.status === 'ended' ? (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<VideoCall />}
                        disabled
                      >
                        Session Ended (No Recording)
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="outlined"
                        disabled
                      >
                        {session.status === 'cancelled' ? 'Cancelled' : 'Session Ended'}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
};

export default StudentLiveSessions;

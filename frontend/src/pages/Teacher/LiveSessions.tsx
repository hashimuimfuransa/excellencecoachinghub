import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Divider,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Add,
  VideoCall,
  Schedule,
  People,
  PlayArrow,
  Stop,
  Edit,
  Delete,
  Visibility,
  AccessTime,
  CalendarToday,
  LiveTv,
  CheckCircle,
  Cancel,
  Warning
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';

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
      id={`sessions-tabpanel-${index}`}
      aria-labelledby={`sessions-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LiveSessions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // State management
  const [sessions, setSessions] = useState<ILiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ILiveSession | null>(null);

  // Get courseId from URL params if present
  const courseIdFilter = searchParams.get('courseId');

  // Load sessions
  useEffect(() => {
    loadSessions();
  }, [tabValue, courseIdFilter]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      const statusFilter = getStatusFilter(tabValue);
      const filters: any = {
        status: statusFilter,
        limit: 50
      };

      // Add courseId filter if present
      if (courseIdFilter) {
        filters.courseId = courseIdFilter;
      }

      const response = await liveSessionService.getTeacherSessions(filters);

      setSessions(response.sessions);
    } catch (err: any) {
      setError(err.message || 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusFilter = (tabIndex: number): string => {
    switch (tabIndex) {
      case 0: return 'all';
      case 1: return 'scheduled';
      case 2: return 'live';
      case 3: return 'ended';
      default: return 'all';
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle start session
  const handleStartSession = async (session: ILiveSession) => {
    try {
      setError(null);
      await liveSessionService.startSession(session._id);
      setSuccess('Session started successfully!');
      
      // Navigate to live session room
      navigate(`/dashboard/teacher/live-sessions/${session._id}/room`);
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
    }
  };

  // Handle end session
  const handleEndSession = async (session: ILiveSession) => {
    try {
      setError(null);
      await liveSessionService.endSession(session._id);
      setSuccess('Session ended successfully!');
      loadSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to end session');
    }
  };

  // Handle delete session
  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;

    try {
      setError(null);
      await liveSessionService.deleteSession(sessionToDelete._id);
      setSuccess('Session deleted successfully!');
      setDeleteDialogOpen(false);
      setSessionToDelete(null);
      loadSessions();
    } catch (err: any) {
      setError(err.message || 'Failed to delete session');
    }
  };

  // Get session status info
  const getSessionStatusInfo = (session: ILiveSession) => {
    const status = liveSessionService.formatSessionStatus(session.status);
    const timeStatus = liveSessionService.getSessionTimeStatus(session);
    
    return { status, timeStatus };
  };

  // Filter sessions based on current tab
  const getFilteredSessions = () => {
    switch (tabValue) {
      case 1: // Scheduled
        return sessions.filter(s => s.status === 'scheduled');
      case 2: // Live
        return sessions.filter(s => s.status === 'live');
      case 3: // Ended
        return sessions.filter(s => s.status === 'ended');
      default: // All
        return sessions;
    }
  };

  const filteredSessions = getFilteredSessions();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" gutterBottom>
            Live Sessions
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
            color="primary"
          >
            Create Session
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Manage your live teaching sessions and interact with students in real-time
        </Typography>

        {/* Course Filter Indicator */}
        {courseIdFilter && (
          <Box sx={{ mt: 2 }}>
            <Chip
              label={`Filtered by Course ID: ${courseIdFilter}`}
              onDelete={() => navigate('/dashboard/teacher/live-sessions')}
              color="primary"
              variant="outlined"
            />
          </Box>
        )}
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Session Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">
                    {sessions.filter(s => s.status === 'scheduled').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scheduled
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LiveTv color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">
                    {sessions.filter(s => s.status === 'live').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Live Now
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">
                    {sessions.filter(s => s.status === 'ended').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">
                    {sessions.reduce((total, s) => total + s.participants.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Participants
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Sessions List */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="session tabs">
            <Tab label="All Sessions" />
            <Tab label="Scheduled" />
            <Tab label="Live" />
            <Tab label="Ended" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredSessions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No sessions found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Create your first live session to start teaching online
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
              >
                Create Session
              </Button>
            </Box>
          ) : (
            <List>
              {filteredSessions.map((session, index) => {
                const { status, timeStatus } = getSessionStatusInfo(session);
                
                return (
                  <React.Fragment key={session._id}>
                    <ListItem sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Avatar sx={{ mr: 2, bgcolor: status.color === 'success' ? 'success.main' : 'primary.main' }}>
                          {session.status === 'live' ? <LiveTv /> : <VideoCall />}
                        </Avatar>
                        
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {session.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {session.course.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Chip
                              label={status.label}
                              color={status.color}
                              size="small"
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                              <Typography variant="caption">
                                {new Date(session.scheduledTime).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                              <Typography variant="caption">
                                {new Date(session.scheduledTime).toLocaleTimeString()}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <People sx={{ fontSize: 16, mr: 0.5 }} />
                              <Typography variant="caption">
                                {session.participants.length} participants
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {session.status === 'scheduled' && (
                            <Tooltip title="Start Session">
                              <IconButton
                                color="success"
                                onClick={() => handleStartSession(session)}
                              >
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
                          )}
                          
                          {session.status === 'live' && (
                            <>
                              <Tooltip title="Join Session">
                                <IconButton
                                  color="primary"
                                  onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id}/room`)}
                                >
                                  <VideoCall />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="End Session">
                                <IconButton
                                  color="error"
                                  onClick={() => handleEndSession(session)}
                                >
                                  <Stop />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          {session.status !== 'live' && (
                            <>
                              <Tooltip title="Edit Session">
                                <IconButton
                                  onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id}/edit`)}
                                >
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Session">
                                <IconButton
                                  color="error"
                                  onClick={() => {
                                    setSessionToDelete(session);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}

                          <Tooltip title="View Details">
                            <IconButton
                              onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id}`)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < filteredSessions.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Same content as above but filtered for scheduled sessions */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredSessions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No scheduled sessions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Schedule a session to start teaching your students
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
              >
                Create Session
              </Button>
            </Box>
          ) : (
            <List>
              {filteredSessions.map((session, index) => {
                const { status, timeStatus } = getSessionStatusInfo(session);
                
                return (
                  <React.Fragment key={session._id}>
                    <ListItem sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          <Schedule />
                        </Avatar>
                        
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {session.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {session.course.title}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                            <Chip
                              label={timeStatus}
                              color="info"
                              size="small"
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                              <Typography variant="caption">
                                {new Date(session.scheduledTime).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTime sx={{ fontSize: 16, mr: 0.5 }} />
                              <Typography variant="caption">
                                {new Date(session.scheduledTime).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Start Session">
                            <IconButton
                              color="success"
                              onClick={() => handleStartSession(session)}
                            >
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Session">
                            <IconButton
                              onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id}/edit`)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </ListItem>
                    {index < filteredSessions.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Live sessions */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredSessions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No live sessions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start a scheduled session to begin teaching live
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredSessions.map((session, index) => (
                <React.Fragment key={session._id}>
                  <ListItem sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'success.main' }}>
                        <LiveTv />
                      </Avatar>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {session.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {session.course.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                          <Chip
                            label="Live Now"
                            color="success"
                            size="small"
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <People sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="caption">
                              {session.participants.length} participants
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          startIcon={<VideoCall />}
                          onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id}/room`)}
                          color="primary"
                        >
                          Join Session
                        </Button>
                        <Tooltip title="End Session">
                          <IconButton
                            color="error"
                            onClick={() => handleEndSession(session)}
                          >
                            <Stop />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < filteredSessions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Ended sessions */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredSessions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No completed sessions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your completed sessions will appear here
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredSessions.map((session, index) => (
                <React.Fragment key={session._id}>
                  <ListItem sx={{ py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'grey.500' }}>
                        <CheckCircle />
                      </Avatar>
                      
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {session.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {session.course.title}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                          <Chip
                            label="Completed"
                            color="default"
                            size="small"
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarToday sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="caption">
                              {new Date(session.scheduledTime).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <People sx={{ fontSize: 16, mr: 0.5 }} />
                            <Typography variant="caption">
                              {session.attendees?.filter(a => a.participated).length || 0} attended
                            </Typography>
                          </Box>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id}`)}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < filteredSessions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </TabPanel>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{sessionToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteSession}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LiveSessions;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  Visibility,
  Schedule,
  CloudUpload,
  Edit,
  Delete,
  Share,
  Download,
  Analytics,
  Person,
  School,
  VideoLibrary,
  AccessTime,
  FileDownload,
  Link as LinkIcon,
  ContentCopy,
  TrendingUp,
  CalendarToday,
  Storage,
  BarChart
} from '@mui/icons-material';
import { recordedSessionService, IRecordedSession } from '../../services/recordedSessionService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { courseService, ICourse } from '../../services/courseService';
import { useAuth } from '../../hooks/useAuth';

interface ViewerData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  viewCount: number;
  totalWatchTime: number;
  lastViewed: string;
  completionPercentage: number;
}

const RecordedSessionDetails: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<IRecordedSession | ILiveSession | null>(null);
  const [sessionType, setSessionType] = useState<'live' | 'recorded'>('recorded');
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [viewersData, setViewersData] = useState<ViewerData[]>([]);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    courseId: ''
  });

  // Load session details
  useEffect(() => {
    const loadSessionDetails = async () => {
      if (!sessionId) return;

      try {
        setLoading(true);
        setError(null);

        let sessionData: IRecordedSession | ILiveSession;
        let isLiveSession = false;

        // Try to load as live session first
        try {
          sessionData = await liveSessionService.getTeacherSessionById(sessionId);
          setSessionType('live');
          isLiveSession = true;
          console.log('📹 Loaded as live session:', sessionData);
        } catch (liveError) {
          // If live session fails, try as recorded session
          try {
            const sessionResponse = await recordedSessionService.getRecordedSession(sessionId);
            sessionData = sessionResponse.data;
            setSessionType('recorded');
            console.log('📼 Loaded as recorded session:', sessionData);
          } catch (recordedError) {
            throw new Error('Session not found. It may have been deleted or you may not have permission to view it.');
          }
        }

        setSession(sessionData);

        // Load teacher's courses for editing
        const coursesResponse = await courseService.getTeacherCourses({
          instructor: user?._id
        });
        setCourses(coursesResponse.courses);

        // Set edit form initial values
        setEditForm({
          title: sessionData.title,
          description: sessionData.description || '',
          courseId: sessionData.course?._id || ''
        });

        // Mock viewers data (in real app, this would come from analytics API)
        setViewersData([
          {
            studentId: '1',
            studentName: 'John Doe',
            studentEmail: 'john@example.com',
            viewCount: 3,
            totalWatchTime: 1800, // 30 minutes in seconds
            lastViewed: new Date().toISOString(),
            completionPercentage: 85
          },
          {
            studentId: '2',
            studentName: 'Jane Smith',
            studentEmail: 'jane@example.com',
            viewCount: 1,
            totalWatchTime: 900, // 15 minutes in seconds
            lastViewed: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            completionPercentage: 45
          }
        ]);

      } catch (err: any) {
        console.error('Error loading session details:', err);
        setError(err.message || 'Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    loadSessionDetails();
  }, [sessionId, user]);

  // Handle edit session
  const handleEditSession = async () => {
    if (!sessionId) return;

    try {
      if (sessionType === 'live') {
        await liveSessionService.updateSession(sessionId, {
          title: editForm.title,
          description: editForm.description
        });
        // Reload session details
        const sessionData = await liveSessionService.getTeacherSessionById(sessionId);
        setSession(sessionData);
      } else {
        await recordedSessionService.updateRecordedSession(sessionId, editForm);
        // Reload session details
        const sessionResponse = await recordedSessionService.getRecordedSession(sessionId);
        setSession(sessionResponse.data);
      }

      setEditDialogOpen(false);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to update session');
    }
  };

  // Handle delete session
  const handleDeleteSession = async () => {
    if (!sessionId) return;

    try {
      if (sessionType === 'live') {
        await liveSessionService.deleteSession(sessionId);
      } else {
        await recordedSessionService.deleteRecordedSession(sessionId);
      }
      navigate('/dashboard/teacher/live-sessions');
    } catch (err: any) {
      setError(err.message || 'Failed to delete session');
    }
  };

  // Handle share link copy
  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/recorded-session/${sessionId}`;
    navigator.clipboard.writeText(shareUrl);
    // You could add a toast notification here
  };

  // Format time in seconds to readable format
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !session) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Session not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/teacher/course-management')}
        >
          Back to Course Management
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
          <IconButton onClick={() => navigate('/dashboard/teacher/course-management')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            📹 Recorded Session Details
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Detailed analytics and management for your recorded session
        </Typography>
      </Box>

      {/* Session Overview */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3}>
            {/* Video Info */}
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
                <VideoLibrary color="primary" sx={{ mr: 2, fontSize: 32 }} />
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {session.title}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={2} sx={{ mb: 1 }}>
                    <Chip
                      icon={<School />}
                      label={session.course?.title || 'No Course'}
                      color="primary"
                      variant="outlined"
                    />
                    <Chip
                      icon={<Schedule />}
                      label={sessionType === 'live' ? 
                        new Date(session.scheduledTime).toLocaleDateString() : 
                        new Date(session.createdAt).toLocaleDateString()
                      }
                      color="info"
                      variant="outlined"
                    />
                    <Chip
                      icon={<VideoLibrary />}
                      label={sessionType === 'live' ? 'Live Session' : 'Recorded Session'}
                      color={sessionType === 'live' ? 'warning' : 'success'}
                      variant="outlined"
                    />
                    {sessionType === 'live' && 'status' in session && (
                      <Chip
                        icon={<Schedule />}
                        label={session.status}
                        color={session.status === 'ended' ? 'error' : session.status === 'live' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    )}
                    {sessionType === 'recorded' && (
                      <Chip
                        icon={<Visibility />}
                        label={`${session.views || 0} views`}
                        color="success"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {session.description || 'No description provided'}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12} md={4}>
              <Box display="flex" flexDirection="column" gap={1}>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={() => window.open(recordedSessionService.getVideoStreamUrl(session.videoUrl), '_blank')}
                  fullWidth
                >
                  Watch Video
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => setEditDialogOpen(true)}
                  fullWidth
                >
                  Edit Details
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Share />}
                  onClick={() => setShareDialogOpen(true)}
                  fullWidth
                >
                  Share
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => setDeleteDialogOpen(true)}
                  fullWidth
                >
                  Delete
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h5" gutterBottom>
            📊 Analytics Overview
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Visibility color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{session.views || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Views
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Person color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{viewersData.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Unique Viewers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccessTime color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {formatTime(viewersData.reduce((sum, viewer) => sum + viewer.totalWatchTime, 0))}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Watch Time
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Storage color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {recordedSessionService.formatFileSize(session.videoSize || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    File Size
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Session Details */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📋 Session Information
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="Upload Date"
                    secondary={recordedSessionService.formatUploadDate(session.uploadDate)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <VideoLibrary />
                  </ListItemIcon>
                  <ListItemText
                    primary="Original Filename"
                    secondary={session.videoFileName || 'Unknown'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Schedule />
                  </ListItemIcon>
                  <ListItemText
                    primary="Duration"
                    secondary={recordedSessionService.formatDuration(session.duration)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Storage />
                  </ListItemIcon>
                  <ListItemText
                    primary="File Size"
                    secondary={recordedSessionService.formatFileSize(session.videoSize || 0)}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Engagement Metrics
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Average Completion Rate
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={viewersData.reduce((sum, viewer) => sum + viewer.completionPercentage, 0) / viewersData.length || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {Math.round(viewersData.reduce((sum, viewer) => sum + viewer.completionPercentage, 0) / viewersData.length || 0)}%
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Views per Day (Last 7 days)
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <TrendingUp color="success" />
                  <Typography variant="h6" color="success.main">
                    +{Math.floor(Math.random() * 10) + 1} views
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    this week
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Viewers Table */}
      {viewersData.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              👥 Viewer Analytics
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell align="center">Views</TableCell>
                    <TableCell align="center">Watch Time</TableCell>
                    <TableCell align="center">Completion</TableCell>
                    <TableCell align="center">Last Viewed</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {viewersData.map((viewer) => (
                    <TableRow key={viewer.studentId}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                            {viewer.studentName.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {viewer.studentName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {viewer.studentEmail}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={viewer.viewCount}
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell align="center">
                        {formatTime(viewer.totalWatchTime)}
                      </TableCell>
                      <TableCell align="center">
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <LinearProgress
                            variant="determinate"
                            value={viewer.completionPercentage}
                            sx={{ width: 60, height: 6, borderRadius: 3, mr: 1 }}
                          />
                          <Typography variant="caption">
                            {viewer.completionPercentage}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption">
                          {new Date(viewer.lastViewed).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Recorded Session</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Course</InputLabel>
              <Select
                value={editForm.courseId}
                onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value })}
                label="Course"
              >
                {courses.map((course) => (
                  <MenuItem key={course._id} value={course._id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSession} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete {sessionType === 'live' ? 'Live' : 'Recorded'} Session</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{session.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteSession} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Recorded Session</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Share this link with your students:
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <TextField
                fullWidth
                value={`${window.location.origin}/recorded-session/${sessionId}`}
                InputProps={{
                  readOnly: true,
                }}
              />
              <Tooltip title="Copy Link">
                <IconButton onClick={handleCopyShareLink}>
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default RecordedSessionDetails;
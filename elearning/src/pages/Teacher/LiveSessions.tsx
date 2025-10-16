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
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Badge,
  CardMedia,
  LinearProgress,
  Fab,
  Menu,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
  Collapse,
  ButtonGroup
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
  Warning,
  CloudUpload,
  FilterList,
  Search,
  ExpandMore,
  OndemandVideo,
  FileUpload,
  Close,
  Download,
  Share,
  MoreVert,
  PlaylistAdd,
  VideoLibrary,
  Analytics,
  TrendingUp,
  School,
  Class,
  PlayCircleOutline,
  Fullscreen,
  VolumeUp,
  VolumeOff
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { recordedSessionService, IRecordedSession } from '../../services/recordedSessionService';
import { courseService } from '../../services/courseService';
import { Widget } from '@uploadcare/react-widget';
import { SafeDialogTransition } from '../../utils/transitionFix';

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
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface RecordedSession {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  courseId?: string;
  courseName?: string;
  course?: {
    _id: string;
    title: string;
  };
  videoFile?: File | null;
  videoUrl?: string;
  uploadProgress?: number;
  isUploading?: boolean;
  duration?: string;
  uploadDate?: Date | string;
  videoUrl?: string;
  views?: number;
  videoFileName?: string;
  videoSize?: number;
  isPublished?: boolean;
}

const LiveSessions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  
  // Responsive breakpoints with defensive theme handling
  const isMobile = useMediaQuery(theme?.breakpoints?.down?.('sm') || '(max-width: 600px)');
  const isTablet = useMediaQuery(theme?.breakpoints?.down?.('md') || '(max-width: 900px)');
  const isSmallScreen = useMediaQuery(theme?.breakpoints?.down?.('lg') || '(max-width: 1200px)');

  // State management
  const [sessions, setSessions] = useState<ILiveSession[]>([]);
  const [recordedSessions, setRecordedSessions] = useState<RecordedSession[]>([]);
  const [recordedSessionsLoading, setRecordedSessionsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ILiveSession | null>(null);
  
  // New state for enhanced features
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  const [newRecording, setNewRecording] = useState<Partial<RecordedSession>>({
    title: '',
    description: '',
    courseId: '',
    courseName: '',
    videoFile: null,
    videoUrl: '',
    uploadProgress: 0,
    isUploading: false
  });
  const [ucUploading, setUcUploading] = useState(false);
  const uploadcarePublicKey = (
    (typeof process !== 'undefined' && (process as any)?.env?.REACT_APP_UPLOADCARE_PUBLIC_KEY)
    || ((typeof import.meta !== 'undefined' && (import.meta as any)?.env?.VITE_UPLOADCARE_PUBLIC_KEY))
    || ((typeof window !== 'undefined' && (window as any)?.UPLOADCARE_PUBLIC_KEY))
    || ''
  );
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedSession, setSelectedSession] = useState<ILiveSession | null>(null);
  
  // Video player state
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<RecordedSession | null>(null);

  // Get courseId from URL params if present
  const courseIdFilter = searchParams.get('courseId');

  // Load sessions
  useEffect(() => {
    loadSessions();
    loadRecordedSessions();
    loadTeacherCourses();
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

  const loadTeacherCourses = async () => {
    try {
      if (!user?._id) return;
      
      const response = await courseService.getTeacherCourses({
        instructor: user._id
      });
      setTeacherCourses(response.courses || []);
    } catch (err: any) {
      console.error('Failed to load teacher courses:', err);
    }
  };

  const loadRecordedSessions = async () => {
    try {
      setRecordedSessionsLoading(true);
      const response = await recordedSessionService.getTeacherRecordedSessions({
        courseId: courseIdFilter || undefined,
        search: searchTerm || undefined,
        page: 1,
        limit: 50
      });
      
      if (response.success) {
        // Transform API response to match component interface
        const transformedSessions: RecordedSession[] = response.data.sessions.map(session => ({
          _id: session._id,
          id: session._id,
          title: session.title,
          description: session.description,
          courseId: session.course._id,
          courseName: session.course.title,
          course: session.course,
          videoUrl: session.videoUrl,
          videoFileName: session.videoFileName,
          videoSize: session.videoSize,
          duration: session.duration,
          uploadDate: session.uploadDate,
          views: session.views,
          isPublished: session.isPublished,
          uploadProgress: 100,
          isUploading: false
        }));
        
        setRecordedSessions(transformedSessions);
      }
    } catch (err: any) {
      console.error('Failed to load recorded sessions:', err);
      setError(err.message || 'Failed to load recorded sessions');
    } finally {
      setRecordedSessionsLoading(false);
    }
  };

  const getStatusFilter = (tabIndex: number): string => {
    switch (tabIndex) {
      case 0: return 'all';
      case 1: return 'scheduled';
      case 2: return 'live';
      case 3: return 'ended';
      case 4: return 'recorded'; // New tab for recorded sessions
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
      navigate(`/video-session/teacher/${session._id}`);
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

  // Handle video upload
  const handleVideoUpload = async () => {
    if (!newRecording.videoUrl || !newRecording.title || !newRecording.courseId) {
      setError('Please fill in all required fields and upload a video');
      return;
    }

    try {
      setError(null);
      
      // Update recording state to show upload progress
      const recordingId = Date.now().toString();
      const uploadingRecording: RecordedSession = {
        id: recordingId,
        title: newRecording.title!,
        description: newRecording.description || '',
        courseId: newRecording.courseId!,
        courseName: newRecording.courseName!,
        videoFile: null,
        videoUrl: newRecording.videoUrl!,
        uploadProgress: 0,
        isUploading: true,
        uploadDate: new Date(),
        views: 0,
        duration: '00:00'
      };

      setRecordedSessions(prev => [...prev, uploadingRecording]);
      setUploadDialogOpen(false);

      // Start save progress simulation
      const progressInterval = setInterval(() => {
        setRecordedSessions(prev =>
          prev.map(session =>
            session.id === recordingId
              ? { ...session, uploadProgress: Math.min((session.uploadProgress || 0) + 10, 90) }
              : session
          )
        );
      }, 250);

      try {
        // Upload using the real API
        const response = await recordedSessionService.uploadRecordedSession({
          title: newRecording.title!,
          description: newRecording.description,
          courseId: newRecording.courseId!,
          videoUrl: newRecording.videoUrl!
        });

        clearInterval(progressInterval);

        if (response.success) {
          // Replace the temporary entry with the real data
          setRecordedSessions(prev => prev.map(session => 
            session.id === recordingId 
              ? {
                  _id: response.data._id,
                  id: response.data._id,
                  title: response.data.title,
                  description: response.data.description,
                  courseId: response.data.course._id,
                  courseName: response.data.course.title,
                  course: response.data.course,
                  videoUrl: response.data.videoUrl,
                  videoFileName: response.data.videoFileName,
                  videoSize: response.data.videoSize,
                  duration: response.data.duration,
                  uploadDate: response.data.uploadDate,
                  views: response.data.views,
                  isPublished: response.data.isPublished,
                  uploadProgress: 100,
                  isUploading: false
                }
              : session
          ));
          
          setSuccess('Video saved successfully!');
        }
      } catch (uploadError: any) {
        clearInterval(progressInterval);
        // Remove the failed upload entry
        setRecordedSessions(prev => prev.filter(session => session.id !== recordingId));
        throw uploadError;
      }

      // Reset form
      setNewRecording({
        title: '',
        description: '',
        courseId: '',
        courseName: '',
        videoFile: null,
        videoUrl: '',
        uploadProgress: 0,
        isUploading: false
      });
      setUcUploading(false);

    } catch (err: any) {
      setError(err.message || 'Failed to save video');
    }
  };

  // Handle video watching
  const handleWatchVideo = async (recording: RecordedSession) => {
    setCurrentVideo(recording);
    setVideoPlayerOpen(true);
    
    // Increment view count using real API
    try {
      const sessionId = recording._id || recording.id;
      if (sessionId) {
        await recordedSessionService.incrementViewCount(sessionId);
        setRecordedSessions(prev => prev.map(r => 
          (r._id || r.id) === sessionId 
            ? { ...r, views: (r.views || 0) + 1 }
            : r
        ));
      }
    } catch (error) {
      console.error('Failed to increment view count:', error);
      // Still allow video to play even if view count fails
    }
  };

  // Get session status info
  const getSessionStatusInfo = (session: ILiveSession) => {
    const status = liveSessionService.formatSessionStatus(session.status);
    const timeStatus = liveSessionService.getSessionTimeStatus(session);
    
    return { status, timeStatus };
  };

  // Filter sessions based on search and filters
  const getFilteredSessions = () => {
    let filtered = sessions;
    
    // Filter by tab
    switch (tabValue) {
      case 1: // Scheduled
        filtered = sessions.filter(s => s.status === 'scheduled');
        break;
      case 2: // Live
        filtered = sessions.filter(s => s.status === 'live');
        break;
      case 3: // Ended
        filtered = sessions.filter(s => s.status === 'ended');
        break;
      case 4: // Recorded
        return recordedSessions;
      default: // All
        break;
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.course.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply course filter
    if (courseFilter !== 'all') {
      filtered = filtered.filter(session => session.course._id === courseFilter);
    }

    return filtered;
  };

  const filteredSessions = getFilteredSessions();
  const uniqueCourses = Array.from(new Set(sessions.map(s => s.course._id))).map(id => {
    const session = sessions.find(s => s.course._id === id);
    return { id, title: session?.course.title || 'Unknown Course' };
  });

  // Enhanced session card component
  const SessionCard = ({ session, isRecorded = false }: { session: any, isRecorded?: boolean }) => {
    const { status, timeStatus } = isRecorded ? { status: { label: 'Recorded', color: 'info' as const }, timeStatus: '' } : getSessionStatusInfo(session);
    
    return (
      <Card 
        sx={{ 
          mb: { xs: 1.5, sm: 2 }, 
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: isMobile ? 'none' : 'translateY(-2px)',
            boxShadow: { xs: 1, sm: 4 }
          },
          background: session.status === 'live' 
            ? 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)' 
            : 'inherit'
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 }, '&:last-child': { pb: { xs: 2, sm: 3 } } }}>
          {/* Mobile Layout */}
          {isMobile ? (
            <Box>
              {/* Header with title and menu */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                  <Avatar 
                    sx={{ 
                      width: 40, 
                      height: 40, 
                      bgcolor: isRecorded ? 'info.main' : status.color === 'success' ? 'success.main' : 'primary.main' 
                    }}
                  >
                    {isRecorded ? <OndemandVideo /> : 
                     session.status === 'live' ? <LiveTv /> : 
                     session.status === 'scheduled' ? <Schedule /> : 
                     <CheckCircle />}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '1rem',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {session.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        mt: 0.5
                      }}
                    >
                      <School sx={{ fontSize: 12, mr: 0.5 }} />
                      {isRecorded ? (session.courseName || session.course?.title) : session.course.title}
                    </Typography>
                  </Box>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    setMenuAnchorEl(e.currentTarget);
                    setSelectedSession(session);
                  }}
                  sx={{ ml: 1 }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
              </Box>
              
              {/* Status and metadata */}
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                    sx={{ fontWeight: 500, fontSize: '0.7rem' }}
                  />
                  
                  {!isRecorded ? (
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {new Date(session.scheduledTime).toLocaleDateString()} • {' '}
                      {new Date(session.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  ) : (
                    <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                      {session.uploadDate && recordedSessionService.formatUploadDate(
                        typeof session.uploadDate === 'string' 
                          ? session.uploadDate 
                          : session.uploadDate.toISOString()
                      )}
                      {session.videoSize && (
                        <>
                          {' • '}
                          {recordedSessionService.formatFileSize(session.videoSize)}
                        </>
                      )}
                    </Typography>
                  )}
                </Box>
                
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  <People sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                  {isRecorded ? 'Recorded Session' : `${session.participants.length} participants`}
                  {isRecorded && session.duration && (
                    <>
                      {' • '}
                      <AccessTime sx={{ fontSize: 12, mx: 0.5, verticalAlign: 'middle' }} />
                      {session.duration}
                    </>
                  )}
                </Typography>
              </Box>

              {/* Upload progress for mobile */}
              {isRecorded && session.isUploading && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress variant="determinate" value={session.uploadProgress} sx={{ mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Uploading... {session.uploadProgress}%
                  </Typography>
                </Box>
              )}

              {/* Action buttons */}
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {!isRecorded && session.status === 'scheduled' && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => handleStartSession(session)}
                    color="success"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Start
                  </Button>
                )}
                
                {!isRecorded && session.status === 'live' && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<VideoCall />}
                      onClick={() => navigate(`/video-session/teacher/${session._id}`)}
                      color="primary"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Join
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Stop />}
                      onClick={() => handleEndSession(session)}
                      color="error"
                      sx={{ fontSize: '0.75rem' }}
                    >
                      End
                    </Button>
                  </>
                )}

                {isRecorded && session.videoUrl && !session.isUploading && (
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<PlayCircleOutline />}
                    onClick={() => handleWatchVideo(session)}
                    color="primary"
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Watch
                  </Button>
                )}

                {(isRecorded || session.status === 'ended') && (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Analytics />}
                    onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id || session.id}/analytics`)}
                    sx={{ fontSize: '0.75rem' }}
                  >
                    Analytics
                  </Button>
                )}

                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Visibility />}
                  onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id || session.id}`)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  Details
                </Button>
              </Stack>
            </Box>
          ) : (
            /* Desktop Layout */
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { sm: 2, md: 3 } }}>
              <Avatar 
                sx={{ 
                  width: { sm: 48, md: 56 }, 
                  height: { sm: 48, md: 56 }, 
                  bgcolor: isRecorded ? 'info.main' : status.color === 'success' ? 'success.main' : 'primary.main' 
                }}
              >
                {isRecorded ? <OndemandVideo /> : 
                 session.status === 'live' ? <LiveTv /> : 
                 session.status === 'scheduled' ? <Schedule /> : 
                 <CheckCircle />}
              </Avatar>
              
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { sm: '1.1rem', md: '1.25rem' } }}>
                    {session.title}
                  </Typography>
                  <IconButton 
                    size="small" 
                    onClick={(e) => {
                      setMenuAnchorEl(e.currentTarget);
                      setSelectedSession(session);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
                
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { sm: '0.875rem' } }}>
                  <School sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                  {isRecorded ? (session.courseName || session.course?.title) : session.course.title}
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { sm: 1.5, md: 2 }, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={status.label}
                    color={status.color}
                    size="small"
                    sx={{ fontWeight: 500 }}
                  />
                  
                  {!isRecorded && (
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarToday sx={{ fontSize: 14, mr: 0.5 }} />
                        <Typography variant="caption">
                          {new Date(session.scheduledTime).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTime sx={{ fontSize: 14, mr: 0.5 }} />
                        <Typography variant="caption">
                          {new Date(session.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </>
                  )}
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <People sx={{ fontSize: 14, mr: 0.5 }} />
                    <Typography variant="caption">
                      {isRecorded ? 'Recorded Session' : `${session.participants.length} participants`}
                    </Typography>
                  </Box>

                  {isRecorded && session.duration && (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime sx={{ fontSize: 14, mr: 0.5 }} />
                      <Typography variant="caption">
                        {session.duration}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {isRecorded && session.isUploading && (
                  <Box sx={{ mt: 1, mb: 2 }}>
                    <LinearProgress variant="determinate" value={session.uploadProgress} />
                    <Typography variant="caption" color="text.secondary">
                      Uploading... {session.uploadProgress}%
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {!isRecorded && session.status === 'scheduled' && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handleStartSession(session)}
                      color="success"
                    >
                      Start Session
                    </Button>
                  )}
                  
                  {!isRecorded && session.status === 'live' && (
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<VideoCall />}
                        onClick={() => navigate(`/video-session/teacher/${session._id}`)}
                        color="primary"
                      >
                        Join Session
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Stop />}
                        onClick={() => handleEndSession(session)}
                        color="error"
                      >
                        End
                      </Button>
                    </>
                  )}

                  {isRecorded && session.videoUrl && !session.isUploading && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PlayCircleOutline />}
                      onClick={() => handleWatchVideo(session)}
                      color="primary"
                    >
                      Watch Video
                    </Button>
                  )}

                  {(isRecorded || session.status === 'ended') && (
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<Analytics />}
                      onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id || session.id}/analytics`)}
                    >
                      Analytics
                    </Button>
                  )}

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/dashboard/teacher/live-sessions/${session._id || session.id}`)}
                  >
                    Details
                  </Button>
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: { xs: 2, sm: 3, md: 4 },
        px: { xs: 1, sm: 2, md: 3 }
      }}
    >
      {/* Header */}
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'flex-start' }, 
          mb: { xs: 2, md: 3 },
          gap: { xs: 2, md: 0 }
        }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant={isMobile ? "h5" : isTablet ? "h4" : "h4"} 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
              }}
            >
              Live Sessions Management
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
            >
              Organize live sessions and upload recorded content for your students
            </Typography>
          </Box>
          
          {/* Mobile Action Buttons */}
          {isMobile ? (
            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => setUploadDialogOpen(true)}
                color="secondary"
                size="small"
                fullWidth
              >
                Upload
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
                color="primary"
                size="small"
                fullWidth
              >
                Create
              </Button>
            </Stack>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => setUploadDialogOpen(true)}
                color="secondary"
                size={isTablet ? "small" : "medium"}
              >
                Upload Recording
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
                color="primary"
                size={isTablet ? "small" : "medium"}
              >
                Create Session
              </Button>
            </Box>
          )}
        </Box>

        {/* Course Filter Indicator */}
        {courseIdFilter && (
          <Box sx={{ mb: 2 }}>
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

      {/* Enhanced Stats Dashboard */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            minHeight: { xs: 120, sm: 140 }
          }}>
            <CardContent sx={{ 
              color: 'white',
              p: { xs: 1.5, sm: 2, md: 3 },
              '&:last-child': { pb: { xs: 1.5, sm: 2, md: 3 } }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Box>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                      fontWeight: 700, 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                    }}
                  >
                    {sessions.filter(s => s.status === 'scheduled').length}
                  </Typography>
                  <Typography 
                    variant={isMobile ? "caption" : "body1"} 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.75rem', sm: '1rem' }
                    }}
                  >
                    {isMobile ? "Scheduled" : "Scheduled Sessions"}
                  </Typography>
                </Box>
                <Schedule sx={{ 
                  fontSize: { xs: 24, sm: 36, md: 48 }, 
                  opacity: 0.8,
                  mt: { xs: 1, sm: 0 }
                }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            minHeight: { xs: 120, sm: 140 }
          }}>
            <CardContent sx={{ 
              color: 'white',
              p: { xs: 1.5, sm: 2, md: 3 },
              '&:last-child': { pb: { xs: 1.5, sm: 2, md: 3 } }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Box>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                      fontWeight: 700, 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                    }}
                  >
                    {sessions.filter(s => s.status === 'live').length}
                  </Typography>
                  <Typography 
                    variant={isMobile ? "caption" : "body1"} 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.75rem', sm: '1rem' }
                    }}
                  >
                    {isMobile ? "Live Now" : "Live Now"}
                  </Typography>
                </Box>
                <LiveTv sx={{ 
                  fontSize: { xs: 24, sm: 36, md: 48 }, 
                  opacity: 0.8,
                  mt: { xs: 1, sm: 0 }
                }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            minHeight: { xs: 120, sm: 140 }
          }}>
            <CardContent sx={{ 
              color: 'white',
              p: { xs: 1.5, sm: 2, md: 3 },
              '&:last-child': { pb: { xs: 1.5, sm: 2, md: 3 } }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Box>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                      fontWeight: 700, 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                    }}
                  >
                    {sessions.filter(s => s.status === 'ended').length}
                  </Typography>
                  <Typography 
                    variant={isMobile ? "caption" : "body1"} 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.75rem', sm: '1rem' }
                    }}
                  >
                    {isMobile ? "Completed" : "Completed"}
                  </Typography>
                </Box>
                <CheckCircle sx={{ 
                  fontSize: { xs: 24, sm: 36, md: 48 }, 
                  opacity: 0.8,
                  mt: { xs: 1, sm: 0 }
                }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} lg={3}>
          <Card sx={{ 
            height: '100%', 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            minHeight: { xs: 120, sm: 140 }
          }}>
            <CardContent sx={{ 
              color: 'white',
              p: { xs: 1.5, sm: 2, md: 3 },
              '&:last-child': { pb: { xs: 1.5, sm: 2, md: 3 } }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                flexDirection: { xs: 'column', sm: 'row' },
                textAlign: { xs: 'center', sm: 'left' }
              }}>
                <Box>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ 
                      fontWeight: 700, 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                    }}
                  >
                    {recordedSessions.length}
                  </Typography>
                  <Typography 
                    variant={isMobile ? "caption" : "body1"} 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.75rem', sm: '1rem' }
                    }}
                  >
                    {isMobile ? "Recorded" : "Recorded Sessions"}
                  </Typography>
                </Box>
                <VideoLibrary sx={{ 
                  fontSize: { xs: 24, sm: 36, md: 48 }, 
                  opacity: 0.8,
                  mt: { xs: 1, sm: 0 }
                }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enhanced Filters and Search */}
      <Card sx={{ mb: { xs: 2, md: 3 } }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Mobile: Collapsible filters */}
          {isMobile ? (
            <>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                  }}
                  size="small"
                />
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  size="small"
                  sx={{ minWidth: 'auto', px: 2 }}
                >
                  Filter
                </Button>
              </Box>
              
              <Collapse in={filtersOpen}>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Course</InputLabel>
                    <Select
                      value={courseFilter}
                      label="Course"
                      onChange={(e) => setCourseFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Courses</MenuItem>
                      {uniqueCourses.map(course => (
                        <MenuItem key={course.id} value={course.id}>
                          {course.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth size="small">
                    <InputLabel>Date Range</InputLabel>
                    <Select
                      value={dateFilter}
                      label="Date Range"
                      onChange={(e) => setDateFilter(e.target.value)}
                    >
                      <MenuItem value="all">All Time</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="week">This Week</MenuItem>
                      <MenuItem value="month">This Month</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Close />}
                    onClick={() => {
                      setSearchTerm('');
                      setCourseFilter('all');
                      setDateFilter('all');
                      setFiltersOpen(false);
                    }}
                    size="small"
                  >
                    Clear Filters
                  </Button>
                </Stack>
              </Collapse>
            </>
          ) : (
            /* Desktop: Horizontal layout */
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search sessions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
                  }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Course</InputLabel>
                  <Select
                    value={courseFilter}
                    label="Course"
                    onChange={(e) => setCourseFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Courses</MenuItem>
                    {uniqueCourses.map(course => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateFilter}
                    label="Date Range"
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => {
                    setSearchTerm('');
                    setCourseFilter('all');
                    setDateFilter('all');
                  }}
                  size="small"
                >
                  Clear
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="session tabs"
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile={isMobile}
            sx={{
              '& .MuiTab-root': {
                minWidth: { xs: 80, sm: 100, md: 120 },
                fontWeight: 600,
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                padding: { xs: theme?.spacing?.(1, 1) || '8px', sm: theme?.spacing?.(1.5, 2) || '12px 16px' }
              },
              '& .MuiTabs-scrollButtons': {
                '&.Mui-disabled': { opacity: 0.3 }
              }
            }}
          >
            <Tab 
              label={
                isMobile ? (
                  <Badge badgeContent={sessions.length} color="default" max={99}>
                    All
                  </Badge>
                ) : (
                  <Badge badgeContent={sessions.length} color="default" max={99}>
                    All Sessions
                  </Badge>
                )
              } 
            />
            <Tab 
              label={
                isMobile ? (
                  <Badge badgeContent={sessions.filter(s => s.status === 'scheduled').length} color="primary" max={99}>
                    Scheduled
                  </Badge>
                ) : (
                  <Badge badgeContent={sessions.filter(s => s.status === 'scheduled').length} color="primary" max={99}>
                    Scheduled
                  </Badge>
                )
              } 
            />
            <Tab 
              label={
                isMobile ? (
                  <Badge badgeContent={sessions.filter(s => s.status === 'live').length} color="error" max={99}>
                    Live
                  </Badge>
                ) : (
                  <Badge badgeContent={sessions.filter(s => s.status === 'live').length} color="error" max={99}>
                    Live
                  </Badge>
                )
              } 
            />
            <Tab 
              label={
                isMobile ? (
                  <Badge badgeContent={sessions.filter(s => s.status === 'ended').length} color="secondary" max={99}>
                    Ended
                  </Badge>
                ) : (
                  <Badge badgeContent={sessions.filter(s => s.status === 'ended').length} color="secondary" max={99}>
                    Ended
                  </Badge>
                )
              } 
            />
            <Tab 
              label={
                isMobile ? (
                  <Badge badgeContent={recordedSessions.length} color="info" max={99}>
                    Recorded
                  </Badge>
                ) : (
                  <Badge badgeContent={recordedSessions.length} color="info" max={99}>
                    Recorded
                  </Badge>
                )
              } 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={tabValue}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 4, sm: 8 } }}>
              <CircularProgress size={isMobile ? 36 : 48} />
            </Box>
          ) : filteredSessions.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: { xs: 4, sm: 8 } }}>
              <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                {tabValue === 4 ? <VideoLibrary sx={{ fontSize: { xs: 48, sm: 64 }, color: 'text.secondary' }} /> :
                 tabValue === 2 ? <LiveTv sx={{ fontSize: { xs: 48, sm: 64 }, color: 'text.secondary' }} /> :
                 <Schedule sx={{ fontSize: { xs: 48, sm: 64 }, color: 'text.secondary' }} />}
              </Box>
              <Typography 
                variant={isMobile ? "subtitle1" : "h6"} 
                color="text.secondary" 
                gutterBottom
                sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                {tabValue === 4 ? 'No recorded sessions' : 
                 tabValue === 2 ? 'No live sessions' :
                 tabValue === 1 ? 'No scheduled sessions' :
                 tabValue === 3 ? 'No completed sessions' :
                 'No sessions found'}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: { xs: 2, sm: 3 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  px: { xs: 2, sm: 0 }
                }}
              >
                {tabValue === 4 ? 'Upload your first recorded session to help students who missed live classes' :
                 'Create your first session to start teaching online'}
              </Typography>
              {tabValue === 4 ? (
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => setUploadDialogOpen(true)}
                  color="secondary"
                  size={isMobile ? "medium" : "large"}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {isMobile ? 'Upload' : 'Upload Recording'}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
                  size={isMobile ? "medium" : "large"}
                  sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                >
                  {isMobile ? 'Create' : 'Create Session'}
                </Button>
              )}
            </Box>
          ) : (
            <Box sx={{ px: { xs: 0, sm: 1 } }}>
              {filteredSessions.map((session: any) => (
                <SessionCard 
                  key={session._id || session.id} 
                  session={session} 
                  isRecorded={tabValue === 4}
                />
              ))}
            </Box>
          )}
        </TabPanel>
      </Card>

      {/* Upload Dialog */}
      <Dialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={SafeDialogTransition}
        PaperProps={{
          sx: {
            m: isMobile ? 0 : 2,
            maxHeight: isMobile ? '100%' : 'calc(100% - 64px)'
          }
        }}
      >
        <DialogTitle sx={{ pb: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Upload Recorded Session
            </Typography>
            <IconButton onClick={() => setUploadDialogOpen(false)} size={isMobile ? "small" : "medium"}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack spacing={{ xs: 2, sm: 3 }} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Session Title"
              value={newRecording.title}
              onChange={(e) => setNewRecording(prev => ({ ...prev, title: e.target.value }))}
              required
              size={isMobile ? "small" : "medium"}
              variant="outlined"
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={isMobile ? 3 : 4}
              value={newRecording.description}
              onChange={(e) => setNewRecording(prev => ({ ...prev, description: e.target.value }))}
              size={isMobile ? "small" : "medium"}
              variant="outlined"
            />
            
            <FormControl fullWidth required size={isMobile ? "small" : "medium"}>
              <InputLabel>Course</InputLabel>
              <Select
                value={newRecording.courseId}
                label="Course"
                onChange={(e) => {
                  const courseId = e.target.value;
                  const course = teacherCourses.find(c => c._id === courseId);
                  setNewRecording(prev => ({ 
                    ...prev, 
                    courseId,
                    courseName: course?.title || ''
                  }));
                }}
              >
                {teacherCourses.map(course => (
                  <MenuItem key={course._id} value={course._id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Widget
                publicKey={uploadcarePublicKey}
                multiple={false}
                tabs="file url"
                onFileSelect={(file: any) => {
                  if (!file) return;
                  setUcUploading(true);
                  // Track widget progress
                  file.progress((info: any) => {
                    const pct = Math.round((info.progress || 0) * 100);
                    setNewRecording(prev => ({ ...prev, uploadProgress: pct, isUploading: true }));
                  });
                  file.done((fileInfo: any) => {
                    const cdnUrl = fileInfo?.cdnUrl || (fileInfo?.cdnUrl && fileInfo?.cdnUrlModifiers ? `${fileInfo.cdnUrl}${fileInfo.cdnUrlModifiers}` : '') || fileInfo?.originalUrl;
                    setNewRecording(prev => ({ 
                      ...prev, 
                      videoUrl: cdnUrl || '',
                      isUploading: false,
                      uploadProgress: 100
                    }));
                    setUcUploading(false);
                  });
                  file.fail(() => {
                    setUcUploading(false);
                    setNewRecording(prev => ({ ...prev, isUploading: false }));
                    setError('Upload failed. Please try again.');
                  });
                }}
              />
              {(ucUploading || newRecording.isUploading) && (
                <Box sx={{ mt: 1 }}>
                  <LinearProgress variant="determinate" value={newRecording.uploadProgress || 0} />
                  <Typography variant="caption" color="text.secondary">
                    Uploading to Uploadcare... {newRecording.uploadProgress || 0}%
                  </Typography>
                </Box>
              )}
              {newRecording.videoUrl && !ucUploading && !newRecording.isUploading && (
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ mt: 1, display: 'block' }}
                >
                  Selected: {newRecording.videoUrl}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ 
          px: { xs: 2, sm: 3 }, 
          pb: { xs: 2, sm: 3 },
          pt: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 0 }
        }}>
          <Button 
            onClick={() => setUploadDialogOpen(false)}
            size={isMobile ? "medium" : "large"}
            fullWidth={isMobile}
            sx={{ order: { xs: 2, sm: 0 } }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleVideoUpload}
            variant="contained"
            disabled={!newRecording.title || !newRecording.courseId || !newRecording.videoUrl || ucUploading || newRecording.isUploading}
            size={isMobile ? "medium" : "large"}
            fullWidth={isMobile}
            sx={{ order: { xs: 1, sm: 0 } }}
          >
            Save Video
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        TransitionComponent={SafeDialogTransition}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this session? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteSession} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => setMenuAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            maxWidth: { xs: 200, sm: 250 },
            '& .MuiMenuItem-root': {
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 },
              px: { xs: 2, sm: 3 }
            },
            '& .MuiListItemIcon-root': {
              minWidth: { xs: 36, sm: 40 },
              '& .MuiSvgIcon-root': {
                fontSize: { xs: 18, sm: 20 }
              }
            }
          }
        }}
      >
        <MenuItem onClick={() => {
          if (selectedSession) navigate(`/dashboard/teacher/live-sessions/${selectedSession._id}/edit`);
          setMenuAnchorEl(null);
        }}>
          <ListItemIcon><Edit /></ListItemIcon>
          Edit Session
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedSession) navigate(`/dashboard/teacher/live-sessions/${selectedSession._id}`);
          setMenuAnchorEl(null);
        }}>
          <ListItemIcon><Visibility /></ListItemIcon>
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedSession) navigate(`/dashboard/teacher/live-sessions/${selectedSession._id}/analytics`);
          setMenuAnchorEl(null);
        }}>
          <ListItemIcon><Analytics /></ListItemIcon>
          View Analytics
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={() => {
            setSessionToDelete(selectedSession);
            setDeleteDialogOpen(true);
            setMenuAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}><Delete /></ListItemIcon>
          Delete Session
        </MenuItem>
      </Menu>

      {/* Floating Action Button for quick actions */}
      {!isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ 
            position: 'fixed', 
            bottom: { xs: 16, sm: 24 }, 
            right: { xs: 16, sm: 24 },
            zIndex: theme?.zIndex?.speedDial || 1000
          }}
          onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
        >
          <Add />
        </Fab>
      )}

      {/* Mobile Bottom Navigation Bar (Alternative to FAB) */}
      {isMobile && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0,
            zIndex: theme?.zIndex?.appBar || 1100,
            borderRadius: 0,
            borderTop: 1,
            borderColor: 'divider'
          }} 
          elevation={3}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-around',
            alignItems: 'center',
            py: 1,
            pb: 'env(safe-area-inset-bottom)' // Handle iPhone home indicator
          }}>
            <Button
              variant="text"
              startIcon={<Add />}
              onClick={() => navigate('/dashboard/teacher/live-sessions/create')}
              size="small"
              sx={{ 
                flex: 1,
                fontSize: '0.75rem',
                py: 1
              }}
            >
              Create Session
            </Button>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            <Button
              variant="text"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialogOpen(true)}
              size="small"
              sx={{ 
                flex: 1,
                fontSize: '0.75rem',
                py: 1
              }}
            >
              Upload Video
            </Button>
          </Box>
        </Paper>
      )}

      {/* Add bottom padding for mobile to account for bottom navigation */}
      {isMobile && <Box sx={{ height: 70 }} />}

      {/* Video Player Dialog */}
      <Dialog
        open={videoPlayerOpen}
        onClose={() => setVideoPlayerOpen(false)}
        maxWidth="lg"
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={SafeDialogTransition}
        PaperProps={{
          sx: {
            m: isMobile ? 0 : 2,
            maxHeight: isMobile ? '100%' : 'calc(100% - 64px)',
            bgcolor: 'black'
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'white', 
          bgcolor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" sx={{ color: 'white' }}>
            {currentVideo?.title}
          </Typography>
          <IconButton 
            onClick={() => setVideoPlayerOpen(false)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: 'black' }}>
          {currentVideo?.videoUrl && (
            <Box sx={{ position: 'relative', width: '100%', height: isMobile ? 'calc(100vh - 120px)' : '70vh' }}>
              <video
                controls
                autoPlay
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain'
                }}
                src={recordedSessionService.getVideoStreamUrl(currentVideo.videoUrl)}
              >
                Your browser does not support the video tag.
              </video>
            </Box>
          )}
          
          {/* Video Info */}
          <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.8)', color: 'white' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {currentVideo?.description}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', fontSize: '0.875rem' }}>
              <Typography variant="caption" sx={{ color: 'grey.300' }}>
                Course: {currentVideo?.courseName || currentVideo?.course?.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.300' }}>
                Duration: {currentVideo?.duration || 'Unknown'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'grey.300' }}>
                Views: {currentVideo?.views || 0}
              </Typography>
              {currentVideo?.uploadDate && (
                <Typography variant="caption" sx={{ color: 'grey.300' }}>
                  Uploaded: {recordedSessionService.formatUploadDate(
                    typeof currentVideo.uploadDate === 'string' 
                      ? currentVideo.uploadDate 
                      : currentVideo.uploadDate.toISOString()
                  )}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default LiveSessions;
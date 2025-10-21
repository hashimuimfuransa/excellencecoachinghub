import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Badge,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack,
  MenuBook,
  VideoCall,
  Assignment,
  Quiz,
  Announcement,
  Schedule,
  Person,
  PlayArrow,
  CheckCircle,
  RadioButtonUnchecked,
  School,
  LiveTv,
  NotificationsActive,
  VolumeUp
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { assessmentService } from '../../services/assessmentService';
import { announcementService } from '../../services/announcementService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { recordedSessionService } from '../../services/recordedSessionService';
import { progressService } from '../../services/progressService';
import LiveSessionStatus from '../../components/Student/LiveSessionStatus';

interface CourseStats {
  totalNotes: number;
  completedNotes: number;
  totalAssignments: number;
  completedAssignments: number;
  totalQuizzes: number;
  completedQuizzes: number;
  upcomingLiveSessions: number;
  unreadAnnouncements: number;
}

const CourseViewPage: React.FC = () => {
  console.log('CourseViewPage component rendering');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentDetails, setEnrollmentDetails] = useState<any>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [courseStats, setCourseStats] = useState<CourseStats>({
    totalNotes: 0,
    completedNotes: 0,
    totalAssignments: 0,
    completedAssignments: 0,
    totalQuizzes: 0,
    completedQuizzes: 0,
    upcomingLiveSessions: 0,
    unreadAnnouncements: 0
  });
  const [recentAnnouncements, setRecentAnnouncements] = useState<any[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<ILiveSession[]>([]);
  const [unseenRecordings, setUnseenRecordings] = useState<number>(0);

  // Load course data and stats
  useEffect(() => {
    const loadCourseData = async () => {
      if (!user || !id) {
        setError('Please log in to access course content');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load course details
        const courseData = await courseService.getPublicCourseById(id);
        setCourse(courseData);

        // Check if student is enrolled
        if (user.role === 'student') {
          try {
            const enrollmentData = await enrollmentService.getEnrollmentDetailsQuietly(id);
            const enrolled = !!enrollmentData;
            setIsEnrolled(enrolled);
            setEnrollmentDetails(enrollmentData);

            if (enrolled) {
              // Load course statistics
              await loadCourseStats();
              await loadRecentAnnouncements();
              await loadUpcomingSessions();
              await loadUnseenRecordings();
            }
          } catch (enrollmentError: any) {
            console.error('Enrollment check failed:', enrollmentError);
            setIsEnrolled(false);
          }
        } else {
          setError('Only enrolled students can access course content');
        }
      } catch (err: any) {
        console.error('Course data loading failed:', err);
        setError(err.message || 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [id, user]);

  // Load course statistics
  const loadCourseStats = async () => {
    if (!id) return;

    try {
      // Get progress data
      const progressData = await progressService.getCourseProgressQuietly(id);
      
      // Get assessments
      const assessments = await assessmentService.getCourseAssessments(id);
      console.log('CourseViewPage - assessments loaded:', assessments, 'isArray:', Array.isArray(assessments));
      
      // Get live sessions
      const sessions = await liveSessionService.getCourseSessions(id);
      
      // Get announcements
      const announcements = await announcementService.getCourseAnnouncements(id);

      // Calculate stats
      // Ensure all data is properly formatted as arrays
      const assessmentsArray = Array.isArray(assessments) ? assessments : [];
      const sessionsArray = Array.isArray(sessions) ? sessions : [];
      const announcementsArray = Array.isArray(announcements) ? announcements : [];
      const courseContentArray = Array.isArray(course?.content) ? course.content : [];
      
      const stats: CourseStats = {
        totalNotes: courseContentArray.filter(c => c.type === 'document').length || 0,
        completedNotes: progressData?.completedLessons?.length || 0,
        totalAssignments: assessmentsArray.filter((a: any) => a.type === 'assignment').length || 0,
        completedAssignments: 0, // TODO: Calculate from submissions
        totalQuizzes: assessmentsArray.filter((a: any) => a.type === 'quiz').length || 0,
        completedQuizzes: 0, // TODO: Calculate from submissions
        upcomingLiveSessions: sessionsArray.filter((s: any) => 
          s.status === 'scheduled' && new Date(s.scheduledTime) > new Date()
        ).length || 0,
        unreadAnnouncements: announcementsArray.filter((a: any) => !a.isRead).length || 0
      };

      setCourseStats(stats);
    } catch (error) {
      console.error('Failed to load course stats:', error);
    }
  };

  // Load unseen recorded sessions using a lightweight client-side tracker
  const loadUnseenRecordings = async () => {
    if (!id) return;
    try {
      const res = await recordedSessionService.getRecordedSessionsForStudents(id);
      const recordings = Array.isArray(res) ? res : (Array.isArray(res.data) ? res.data : []);
      const lastSeenKey = `course:${id}:recordingsLastSeen`;
      const lastSeenStr = localStorage.getItem(lastSeenKey);
      const lastSeen = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;
      const unseen = (recordings || []).filter((r: any) => new Date(r.uploadDate).getTime() > lastSeen).length;
      setUnseenRecordings(unseen);
    } catch (e) {
      // Ignore errors; keep UI silent
    }
  };

  const markRecordingsSeen = () => {
    if (!id) return;
    const lastSeenKey = `course:${id}:recordingsLastSeen`;
    localStorage.setItem(lastSeenKey, new Date().toISOString());
    setUnseenRecordings(0);
  };

  // Load recent announcements
  const loadRecentAnnouncements = async () => {
    if (!id) return;

    try {
      const announcements = await announcementService.getCourseAnnouncements(id, 3);
      setRecentAnnouncements(announcements || []);
    } catch (error) {
      console.error('Failed to load announcements:', error);
    }
  };

  // Load upcoming sessions
  const loadUpcomingSessions = async () => {
    if (!id) return;

    try {
      const sessions = await liveSessionService.getCourseSessions(id);
      // Ensure sessions is always an array before filtering
      const sessionsArray = Array.isArray(sessions) ? sessions : [];
      const upcoming = sessionsArray.filter((s: any) => 
        s.status === 'scheduled' && new Date(s.scheduledTime) > new Date()
      ).slice(0, 3);
      setUpcomingSessions(upcoming);
    } catch (error) {
      console.error('Failed to load upcoming sessions:', error);
    }
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const totalItems = courseStats.totalNotes + courseStats.totalAssignments + courseStats.totalQuizzes;
    const completedItems = courseStats.completedNotes + courseStats.completedAssignments + courseStats.completedQuizzes;
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  // Navigation handlers
  const handleNotesView = () => {
    navigate(`/course/${id}/hub`);
  };

  const handleLiveSessionsView = () => {
    navigate('/live-sessions');
  };

  const handleAssignmentsView = () => {
    navigate(`/course/${id}/assignments`);
  };

  const handleAssessmentsView = () => {
    navigate(`/course/${id}/assessments`);
  };

  const handleAnnouncementsView = () => {
    navigate(`/dashboard/student/course/${id}/announcements`);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !course) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Course not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/courses')}
          variant="outlined"
          size={isMobile ? 'small' : 'medium'}
        >
          Back to My Courses
        </Button>
      </Container>
    );
  }

  const handleEnroll = async () => {
    if (!id) return;
    
    try {
      setEnrolling(true);
      await enrollmentService.enrollInCourse(id);
      setIsEnrolled(true);
      // Reload the page data
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Failed to enroll in course');
      setEnrolling(false);
    }
  };

  if (!isEnrolled) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          You need to be enrolled in this course to access the content.
        </Alert>
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 2 },
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'flex-start' }
        }}>
          <Button
            onClick={handleEnroll}
            variant="contained"
            disabled={enrolling}
            startIcon={enrolling ? <CircularProgress size={20} /> : <School />}
            size={isMobile ? 'large' : 'medium'}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            {enrolling ? 'Enrolling...' : 'Enroll in Course'}
          </Button>
          <Button
            onClick={() => navigate('/courses')}
            variant="outlined"
            size={isMobile ? 'large' : 'medium'}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Browse All Courses
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/courses')}
          sx={{ mb: 2 }}
          size={isMobile ? 'small' : 'medium'}
        >
          Back to My Courses
        </Button>

        {/* Live Session Status */}
        <LiveSessionStatus courseId={id!} />

        <Card sx={{ mb: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              gap: { xs: 2, sm: 3 },
              flexDirection: { xs: 'column', sm: 'row' }
            }}>
              <Avatar
                sx={{ 
                  width: { xs: 60, sm: 80 }, 
                  height: { xs: 60, sm: 80 }, 
                  bgcolor: 'primary.main',
                  alignSelf: { xs: 'center', sm: 'flex-start' }
                }}
              >
                <School sx={{ fontSize: { xs: 30, sm: 40 } }} />
              </Avatar>
              <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography 
                  variant="h4" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                    lineHeight: 1.2
                  }}
                >
                  {course.title}
                </Typography>
                <Typography 
                  variant="body1" 
                  color="text.secondary" 
                  paragraph
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: 1.6
                  }}
                >
                  {course.description}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1, sm: 2 }, 
                  mb: 2,
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'center', sm: 'flex-start' }
                }}>
                  <Chip 
                    label={course.category} 
                    variant="outlined" 
                    size={isMobile ? 'small' : 'medium'}
                  />
                  <Chip 
                    label={course.level} 
                    variant="outlined" 
                    size={isMobile ? 'small' : 'medium'}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule fontSize="small" />
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {course.duration}h
                    </Typography>
                  </Box>
                </Box>

                {/* Progress Information */}
                <Box sx={{ mt: 2 }}>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    gutterBottom
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}
                  >
                    Overall Progress: {getOverallProgress()}% Complete
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getOverallProgress()} 
                    sx={{ 
                      height: { xs: 6, sm: 8 }, 
                      borderRadius: { xs: 3, sm: 4 },
                      mb: 1
                    }}
                  />
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      mt: 1, 
                      display: 'block',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}
                  >
                    Enrolled: {new Date(enrollmentDetails?.enrollmentDate || enrollmentDetails?.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Learning Path Options */}
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Choose Your Learning Path
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {/* Course Material Path */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(102, 126, 234, 0.3)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover::before': {
                opacity: 1
              }
            }}
            onClick={handleNotesView}
          >
            <CardContent sx={{ 
              textAlign: 'center', 
              py: { xs: 3, sm: 4 }, 
              position: 'relative', 
              zIndex: 1,
              px: { xs: 2, sm: 3 }
            }}>
              <Box sx={{ 
                display: 'inline-flex',
                p: { xs: 1.5, sm: 2 },
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                mb: { xs: 1.5, sm: 2 }
              }}>
                <MenuBook sx={{ fontSize: { xs: 36, sm: 48 }, color: 'white' }} />
              </Box>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600, 
                  color: 'white',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Course Material
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  mb: { xs: 2, sm: 3 }, 
                  px: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: 1.5
                }}
              >
                Access comprehensive course materials with advanced reading features, voice narration, and interactive learning tools
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: { xs: 0.5, sm: 1 }, 
                mb: { xs: 2, sm: 3 }, 
                flexWrap: 'wrap' 
              }}>
                <Chip 
                  label={`${courseStats.completedNotes}/${courseStats.totalNotes} Sections`}
                  icon={courseStats.completedNotes === courseStats.totalNotes ? <CheckCircle /> : <RadioButtonUnchecked />}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    backgroundColor: courseStats.completedNotes === courseStats.totalNotes ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    '& .MuiChip-icon': {
                      color: 'white',
                      fontSize: { xs: 16, sm: 20 }
                    }
                  }}
                />
                <Chip 
                  label="Voice Reader"
                  icon={<VolumeUp />}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    '& .MuiChip-icon': {
                      color: 'white',
                      fontSize: { xs: 16, sm: 20 }
                    }
                  }}
                />
              </Box>
              
              <Button 
                variant="contained"
                startIcon={<PlayArrow />}
                size={isMobile ? 'large' : 'medium'}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: { xs: '10px 20px', sm: '12px 24px' },
                  borderRadius: '25px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: { xs: 'none', sm: 'scale(1.05)' },
                  },
                }}
              >
                Start Learning
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Sessions Path */}
        <Grid item xs={12} md={6}>
          <Card 
            sx={{ 
              height: '100%', 
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(255, 107, 107, 0.3)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
              },
              '&:hover::before': {
                opacity: 1
              }
            }}
            onClick={() => { markRecordingsSeen(); handleLiveSessionsView(); }}
          >
            <CardContent sx={{ 
              textAlign: 'center', 
              py: { xs: 3, sm: 4 }, 
              position: 'relative', 
              zIndex: 1,
              px: { xs: 2, sm: 3 }
            }}>
              <Box sx={{ 
                display: 'inline-flex',
                p: { xs: 1.5, sm: 2 },
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                mb: { xs: 1.5, sm: 2 }
              }}>
                <VideoCall sx={{ fontSize: { xs: 36, sm: 48 }, color: 'white' }} />
              </Box>
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600, 
                  color: 'white',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' }
                }}
              >
                Live Sessions & Videos
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  mb: { xs: 2, sm: 3 }, 
                  px: { xs: 1, sm: 2 },
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: 1.5
                }}
              >
                Join live classes, watch recorded sessions, and interact with instructors in real-time
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: { xs: 0.5, sm: 1 }, 
                mb: { xs: 2, sm: 3 }, 
                flexWrap: 'wrap' 
              }}>
                <Badge badgeContent={courseStats.upcomingLiveSessions} color="warning">
                  <Chip 
                    label="Live Sessions"
                    icon={<LiveTv />}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      '& .MuiChip-icon': {
                        color: 'white',
                        fontSize: { xs: 16, sm: 20 }
                      }
                    }}
                  />
                </Badge>
                <Badge badgeContent={unseenRecordings} color="error" invisible={unseenRecordings === 0}>
                  <Chip 
                    label={unseenRecordings > 0 ? 'New Recordings' : 'Recordings'}
                    icon={<NotificationsActive />}
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 500,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      '& .MuiChip-icon': {
                        color: 'white',
                        fontSize: { xs: 16, sm: 20 }
                      }
                    }}
                  />
                </Badge>
                <Chip 
                  label="Interactive"
                  icon={<Person />}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500,
                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    '& .MuiChip-icon': {
                      color: 'white',
                      fontSize: { xs: 16, sm: 20 }
                    }
                  }}
                />
              </Box>
              
              <Button 
                variant="contained"
                startIcon={<PlayArrow />}
                size={isMobile ? 'large' : 'medium'}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: { xs: '10px 20px', sm: '12px 24px' },
                  borderRadius: '25px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: { xs: 'none', sm: 'scale(1.05)' },
                  },
                }}
              >
                Join Sessions
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Course Components */}
      <Typography 
        variant="h5" 
        gutterBottom 
        sx={{ 
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Course Components
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 3, sm: 4 } }}>
        {/* Assignments */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer', 
              '&:hover': { 
                boxShadow: { xs: 2, sm: 3 },
                transform: { xs: 'none', sm: 'translateY(-2px)' }
              },
              transition: 'all 0.3s ease'
            }}
            onClick={handleAssignmentsView}
          >
            <CardContent sx={{ 
              textAlign: 'center',
              p: { xs: 2, sm: 3 }
            }}>
              <Assignment sx={{ 
                fontSize: { xs: 36, sm: 48 }, 
                color: 'warning.main', 
                mb: 1 
              }} />
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Assignments
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {courseStats.completedAssignments}/{courseStats.totalAssignments} Completed
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={courseStats.totalAssignments > 0 ? (courseStats.completedAssignments / courseStats.totalAssignments) * 100 : 0}
                sx={{ 
                  mt: 1,
                  height: { xs: 4, sm: 6 },
                  borderRadius: { xs: 2, sm: 3 }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Assessments */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer', 
              '&:hover': { 
                boxShadow: { xs: 2, sm: 3 },
                transform: { xs: 'none', sm: 'translateY(-2px)' }
              },
              transition: 'all 0.3s ease'
            }}
            onClick={handleAssessmentsView}
          >
            <CardContent sx={{ 
              textAlign: 'center',
              p: { xs: 2, sm: 3 }
            }}>
              <Quiz sx={{ 
                fontSize: { xs: 36, sm: 48 }, 
                color: 'info.main', 
                mb: 1 
              }} />
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Assessments
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {courseStats.completedQuizzes}/{courseStats.totalQuizzes} Completed
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={courseStats.totalQuizzes > 0 ? (courseStats.completedQuizzes / courseStats.totalQuizzes) * 100 : 0}
                sx={{ 
                  mt: 1,
                  height: { xs: 4, sm: 6 },
                  borderRadius: { xs: 2, sm: 3 }
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Announcements */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              cursor: 'pointer', 
              '&:hover': { 
                boxShadow: { xs: 2, sm: 3 },
                transform: { xs: 'none', sm: 'translateY(-2px)' }
              },
              transition: 'all 0.3s ease'
            }}
            onClick={handleAnnouncementsView}
          >
            <CardContent sx={{ 
              textAlign: 'center',
              p: { xs: 2, sm: 3 }
            }}>
              <Badge badgeContent={courseStats.unreadAnnouncements} color="error">
                <Announcement sx={{ 
                  fontSize: { xs: 36, sm: 48 }, 
                  color: 'success.main', 
                  mb: 1 
                }} />
              </Badge>
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Announcements
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                {courseStats.unreadAnnouncements} Unread
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Progress */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            '&:hover': { 
              boxShadow: { xs: 2, sm: 3 },
              transform: { xs: 'none', sm: 'translateY(-2px)' }
            },
            transition: 'all 0.3s ease'
          }}>
            <CardContent sx={{ 
              textAlign: 'center',
              p: { xs: 2, sm: 3 }
            }}>
              <CheckCircle sx={{ 
                fontSize: { xs: 36, sm: 48 }, 
                color: 'primary.main', 
                mb: 1 
              }} />
              <Typography 
                variant="h6" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                Progress
              </Typography>
              <Typography 
                variant="h4" 
                color="primary.main" 
                gutterBottom
                sx={{ 
                  fontSize: { xs: '1.75rem', sm: '2.125rem' }
                }}
              >
                {getOverallProgress()}%
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                Course Completion
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Recent Announcements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                <NotificationsActive color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                Recent Announcements
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {recentAnnouncements.length > 0 ? (
                <List dense>
                  {recentAnnouncements.map((announcement, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemButton sx={{ py: { xs: 0.5, sm: 1 } }}>
                        <ListItemText
                          primary={announcement.title}
                          secondary={new Date(announcement.createdAt).toLocaleDateString()}
                          primaryTypographyProps={{
                            sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
                          }}
                          secondaryTypographyProps={{
                            sx: { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    textAlign: 'center',
                    py: 2
                  }}
                >
                  No recent announcements
                </Typography>
              )}
              <Button 
                size="small" 
                onClick={handleAnnouncementsView}
                sx={{ 
                  mt: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Sessions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography 
                variant="h6" 
                gutterBottom 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontSize: { xs: '1rem', sm: '1.25rem' }
                }}
              >
                <Schedule color="secondary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                Upcoming Sessions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {upcomingSessions.length > 0 ? (
                <List dense>
                  {upcomingSessions.map((session) => (
                    <ListItem key={session._id} disablePadding>
                      <ListItemButton sx={{ py: { xs: 0.5, sm: 1 } }}>
                        <ListItemIcon>
                          <VideoCall color="secondary" sx={{ fontSize: { xs: 18, sm: 20 } }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={session.title}
                          secondary={new Date(session.scheduledTime).toLocaleString()}
                          primaryTypographyProps={{
                            sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
                          }}
                          secondaryTypographyProps={{
                            sx: { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    textAlign: 'center',
                    py: 2
                  }}
                >
                  No upcoming sessions
                </Typography>
              )}
              <Button 
                size="small" 
                color="secondary"
                onClick={handleLiveSessionsView}
                sx={{ 
                  mt: 1,
                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                }}
              >
                View All Sessions
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

CourseViewPage.displayName = 'CourseViewPage';

export default CourseViewPage;
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
  LinearProgress
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
import { progressService } from '../../services/progressService';

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
    navigate(`/course/${id}/learn`);
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Course not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/courses')}
          variant="outlined"
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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          You need to be enrolled in this course to access the content.
        </Alert>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={handleEnroll}
            variant="contained"
            disabled={enrolling}
            startIcon={enrolling ? <CircularProgress size={20} /> : <School />}
          >
            {enrolling ? 'Enrolling...' : 'Enroll in Course'}
          </Button>
          <Button
            onClick={() => navigate('/courses')}
            variant="outlined"
          >
            Browse All Courses
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/courses')}
          sx={{ mb: 2 }}
        >
          Back to My Courses
        </Button>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
              <Avatar
                sx={{ width: 80, height: 80, bgcolor: 'primary.main' }}
              >
                <School sx={{ fontSize: 40 }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" gutterBottom>
                  {course.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {course.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip label={course.category} variant="outlined" />
                  <Chip label={course.level} variant="outlined" />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule fontSize="small" />
                    <Typography variant="body2">{course.duration}h</Typography>
                  </Box>
                </Box>

                {/* Progress Information */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Overall Progress: {getOverallProgress()}% Complete
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getOverallProgress()} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Enrolled: {new Date(enrollmentDetails?.enrollmentDate || enrollmentDetails?.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Learning Path Options */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Choose Your Learning Path
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
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
            <CardContent sx={{ textAlign: 'center', py: 4, position: 'relative', zIndex: 1 }}>
              <Box sx={{ 
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                mb: 2
              }}>
                <MenuBook sx={{ fontSize: 48, color: 'white' }} />
              </Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'white' }}>
                Course Material
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 3, px: 2 }}>
                Access comprehensive course materials with advanced reading features, voice narration, and interactive learning tools
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${courseStats.completedNotes}/${courseStats.totalNotes} Sections`}
                  icon={courseStats.completedNotes === courseStats.totalNotes ? <CheckCircle /> : <RadioButtonUnchecked />}
                  sx={{
                    backgroundColor: courseStats.completedNotes === courseStats.totalNotes ? 'rgba(76, 175, 80, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500,
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
                <Chip 
                  label="Voice Reader"
                  icon={<VolumeUp />}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500,
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              </Box>
              
              <Button 
                variant="contained"
                startIcon={<PlayArrow />}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'scale(1.05)',
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
            onClick={handleLiveSessionsView}
          >
            <CardContent sx={{ textAlign: 'center', py: 4, position: 'relative', zIndex: 1 }}>
              <Box sx={{ 
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                mb: 2
              }}>
                <VideoCall sx={{ fontSize: 48, color: 'white' }} />
              </Box>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: 'white' }}>
                Live Sessions & Videos
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 3, px: 2 }}>
                Join live classes, watch recorded sessions, and interact with instructors in real-time
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Badge badgeContent={courseStats.upcomingLiveSessions} color="warning">
                  <Chip 
                    label="Live Sessions"
                    icon={<LiveTv />}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 500,
                      '& .MuiChip-icon': {
                        color: 'white'
                      }
                    }}
                  />
                </Badge>
                <Chip 
                  label="Interactive"
                  icon={<Person />}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 500,
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              </Box>
              
              <Button 
                variant="contained"
                startIcon={<PlayArrow />}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    transform: 'scale(1.05)',
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
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Course Components
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Assignments */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
            onClick={handleAssignmentsView}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Assignment sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Assignments
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {courseStats.completedAssignments}/{courseStats.totalAssignments} Completed
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={courseStats.totalAssignments > 0 ? (courseStats.completedAssignments / courseStats.totalAssignments) * 100 : 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Assessments */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
            onClick={handleAssessmentsView}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Quiz sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Assessments
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {courseStats.completedQuizzes}/{courseStats.totalQuizzes} Completed
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={courseStats.totalQuizzes > 0 ? (courseStats.completedQuizzes / courseStats.totalQuizzes) * 100 : 0}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Announcements */}
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
            onClick={handleAnnouncementsView}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge badgeContent={courseStats.unreadAnnouncements} color="error">
                <Announcement sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
              </Badge>
              <Typography variant="h6" gutterBottom>
                Announcements
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {courseStats.unreadAnnouncements} Unread
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Progress */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                Progress
              </Typography>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {getOverallProgress()}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Course Completion
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        {/* Recent Announcements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsActive color="primary" />
                Recent Announcements
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {recentAnnouncements.length > 0 ? (
                <List dense>
                  {recentAnnouncements.map((announcement, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemButton>
                        <ListItemText
                          primary={announcement.title}
                          secondary={new Date(announcement.createdAt).toLocaleDateString()}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recent announcements
                </Typography>
              )}
              <Button 
                size="small" 
                onClick={handleAnnouncementsView}
                sx={{ mt: 1 }}
              >
                View All
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Sessions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule color="secondary" />
                Upcoming Sessions
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {upcomingSessions.length > 0 ? (
                <List dense>
                  {upcomingSessions.map((session) => (
                    <ListItem key={session._id} disablePadding>
                      <ListItemButton>
                        <ListItemIcon>
                          <VideoCall color="secondary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={session.title}
                          secondary={new Date(session.scheduledTime).toLocaleString()}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No upcoming sessions
                </Typography>
              )}
              <Button 
                size="small" 
                color="secondary"
                onClick={handleLiveSessionsView}
                sx={{ mt: 1 }}
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
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
  IconButton,
  Paper
} from '@mui/material';
import { 
  EmojiEvents, 
  Explore, 
  PlayArrow, 
  TrendingUp,
  Announcement,
  Close,
  BookmarkBorder,
  Assessment,
  Groups,
  LiveTv,
  ErrorOutline,
  CheckCircle,
  InfoOutlined,
  WarningAmber,
  Timer,
  CalendarToday
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { useAuth } from '../../store/AuthContext';
import { enrollmentService, IEnrollment } from '../../services/enrollmentService';
import { courseService, ICourse } from '../../services/courseService';
import { announcementService, Announcement as IAnnouncement } from '../../services/announcementService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';

const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  height: '100%',
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: theme.spacing(1),
  background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
  border: '1px solid rgba(0,0,0,0.05)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
  }
}));

const AnnouncementCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  padding: theme.spacing(2.5),
  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(14, 165, 233, 0.08))',
  border: '1px solid rgba(59, 130, 246, 0.2)',
  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    background: 'linear-gradient(180deg, #3b82f6, #0ea5e9)'
  }
}));

const CourseCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2.5),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: '1px solid rgba(0,0,0,0.05)',
  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-6px)',
    boxShadow: '0 12px 32px rgba(0,0,0,0.15)'
  }
}));

const HeroSection = styled(Box)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
  backgroundSize: '400% 400%',
  color: 'common.white',
  overflow: 'hidden',
  position: 'relative',
  animation: 'gradient 8s ease infinite',
  '@keyframes gradient': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' }
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: -50,
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1), transparent)',
    borderRadius: '50%'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: '250px',
    height: '250px',
    background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)',
    borderRadius: '50%'
  }
}));

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [enrollments, setEnrollments] = useState<IEnrollment[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<ICourse[]>([]);
  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<ILiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedAnnouncements, setDismissedAnnouncements] = useState<Set<string>>(new Set());
  const [countdownTime, setCountdownTime] = useState<string>('');

  const getAnnouncementIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <ErrorOutline sx={{ fontSize: 20, color: 'error.main' }} />;
      case 'high':
        return <WarningAmber sx={{ fontSize: 20, color: 'warning.main' }} />;
      case 'medium':
        return <InfoOutlined sx={{ fontSize: 20, color: 'info.main' }} />;
      default:
        return <CheckCircle sx={{ fontSize: 20, color: 'success.main' }} />;
    }
  };

  const generateGoogleCalendarUrl = (session: ILiveSession): string => {
    const startTime = new Date(session.scheduledTime);
    const endTime = new Date(startTime.getTime() + session.duration * 60000);
    
    const formatDateTime = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: session.title,
      details: `Course: ${session.course.title}\nInstructor: ${session.instructor.firstName} ${session.instructor.lastName}${session.meetingUrl ? `\nJoin: ${session.meetingUrl}` : ''}`,
      location: session.meetingUrl || 'Online',
      dates: `${formatDateTime(startTime)}/${formatDateTime(endTime)}`
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const calculateCountdown = (sessionTime: string): string => {
    const now = new Date();
    const sessionDate = new Date(sessionTime);
    const diffMs = sessionDate.getTime() - now.getTime();
    
    if (diffMs <= 0) return '';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m ${diffSeconds}s`;
    }
    return `${diffMinutes}m ${diffSeconds}s`;
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setEnrollments([]);
        setRelatedCourses([]);
        setAnnouncements([]);
        setUpcomingSessions([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const enrollmentResponse = await enrollmentService.getMyEnrollments({ limit: 12 });
        const rawEnrollments = enrollmentResponse.enrollments || [];
        const filteredEnrollments = rawEnrollments.filter(enrollment => enrollment?.course);
        setEnrollments(filteredEnrollments);
        
        let allAnnouncements: IAnnouncement[] = [];
        if (filteredEnrollments.length > 0) {
          try {
            for (const enrollment of filteredEnrollments.slice(0, 5)) {
              if (enrollment.course?._id) {
                const courseAnnouncements = await announcementService.getCourseAnnouncements(enrollment.course._id, 5);
                allAnnouncements = [...allAnnouncements, ...courseAnnouncements];
              }
            }
            const uniqueAnnouncements = Array.from(
              new Map(allAnnouncements.map(a => [a._id, a])).values()
            ).sort((a, b) => {
              if (a.isPinned === b.isPinned) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }
              return a.isPinned ? -1 : 1;
            }).slice(0, 5);
            setAnnouncements(uniqueAnnouncements);
          } catch (announcementError) {
            console.warn('Unable to load announcements', announcementError);
            setAnnouncements([]);
          }
        }

        try {
          const sessionsResponse = await liveSessionService.getStudentSessions({ limit: 10 });
          const allSessions = sessionsResponse.sessions || [];
          const upcomingSessions = allSessions
            .filter(session => liveSessionService.isSessionUpcoming(session))
            .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
            .slice(0, 1);
          setUpcomingSessions(upcomingSessions);
        } catch (sessionError) {
          console.warn('Unable to load live sessions', sessionError);
          setUpcomingSessions([]);
        }
        
        let recommended: ICourse[] = [];
        if (filteredEnrollments.length > 0) {
          const primaryCategory = filteredEnrollments[0]?.course?.category;
          if (primaryCategory) {
            try {
              const categoryResponse = await courseService.getPublicCourses({ limit: 6, category: primaryCategory });
              recommended = categoryResponse.courses || [];
            } catch {
              recommended = [];
            }
          }
        }
        if (recommended.length === 0) {
          try {
            const fallbackResponse = await courseService.getPublicCourses({ limit: 6 });
            recommended = fallbackResponse.courses || [];
          } catch {
            recommended = [];
          }
        }
        if (recommended.length > 0) {
          const enrolledIds = new Set(
            filteredEnrollments
              .map(enrollment => enrollment.course?._id)
              .filter((id): id is string => Boolean(id))
          );
          setRelatedCourses(recommended.filter(course => !enrolledIds.has(course._id)).slice(0, 3));
        } else {
          setRelatedCourses([]);
        }
      } catch (loadError) {
        console.warn('Unable to load student dashboard data', loadError);
        setEnrollments([]);
        setRelatedCourses([]);
        setAnnouncements([]);
        setUpcomingSessions([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    if (upcomingSessions.length === 0) return;

    const updateCountdown = () => {
      const nextSession = upcomingSessions[0];
      const countdown = calculateCountdown(nextSession.scheduledTime);
      setCountdownTime(countdown);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [upcomingSessions]);

  const stats = useMemo(() => {
    if (enrollments.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        averageProgress: 0
      };
    }
    const total = enrollments.length;
    const completed = enrollments.filter(item => item.progress?.totalProgress >= 100).length;
    const inProgress = enrollments.filter(item => (item.progress?.totalProgress || 0) > 0 && (item.progress?.totalProgress || 0) < 100).length;
    const averageProgress = Math.round(
      enrollments.reduce((sum, item) => sum + (item.progress?.totalProgress || 0), 0) / total
    );
    return { total, completed, inProgress, averageProgress };
  }, [enrollments]);

  const activeEnrollment = useMemo(() => {
    if (enrollments.length === 0) {
      return undefined;
    }
    const next = enrollments.find(item => item.progress?.totalProgress !== undefined && item.progress.totalProgress < 100 && item.isActive);
    return next || enrollments[0];
  }, [enrollments]);

  const visibleAnnouncements = announcements.filter(a => !dismissedAnnouncements.has(a._id));

  if (loading) {
    return (
      <ResponsiveDashboard>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={48} />
          </Box>
        </Container>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        <Stack spacing={{ xs: 3, md: 4 }}>
          
          {/* Hero Section */}
          <HeroSection sx={{ position: 'relative', zIndex: 1 }}>
            <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 2 }}>
              <Typography 
                variant={isMobile ? 'h5' : 'h4'} 
                fontWeight={800} 
                sx={{ 
                  textShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  lineHeight: 1.2
                }}
              >
                Welcome back, {user?.firstName || 'Learner'}! 👋
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  maxWidth: '500px',
                  lineHeight: 1.6
                }}
              >
                {activeEnrollment
                  ? `Continue your journey in ${activeEnrollment.course.title}. You're ${activeEnrollment.progress?.totalProgress || 0}% through!`
                  : 'Explore courses and start learning today. Your next breakthrough is waiting.'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
                <Button
                  variant="contained"
                  color="inherit"
                  startIcon={<PlayArrow />}
                  onClick={() => {
                    if (activeEnrollment) {
                      navigate(`/dashboard/student/course/${activeEnrollment.course._id}`);
                    } else {
                      navigate('/courses');
                    }
                  }}
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    px: 3,
                    py: 1.2,
                    borderRadius: 2.5,
                    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 28px rgba(0,0,0,0.25)'
                    }
                  }}
                >
                  {activeEnrollment ? 'Continue Learning' : 'Start Learning'}
                </Button>
                {upcomingSessions.length > 0 && (
                  <Button
                    variant="contained"
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.25)',
                      color: 'white',
                      fontWeight: 700,
                      px: 3,
                      py: 1.2,
                      borderRadius: 2.5,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.35)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 28px rgba(0,0,0,0.2)'
                      }
                    }}
                    startIcon={<LiveTv />}
                    onClick={() => navigate('/dashboard/student/live-sessions')}
                  >
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <span>Live Session</span>
                      {countdownTime && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ ml: 1, pl: 1, borderLeft: '1px solid rgba(255,255,255,0.5)' }}>
                          <Timer sx={{ fontSize: 16 }} />
                          <span sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{countdownTime}</span>
                        </Stack>
                      )}
                    </Stack>
                  </Button>
                )}
              </Stack>
            </Stack>
          </HeroSection>

          {/* Upcoming Live Sessions Section */}
          {upcomingSessions.length > 0 && (
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LiveTv sx={{ color: 'error.main' }} />
                Upcoming Live Session
              </Typography>
              {upcomingSessions.map((session) => (
                <Card 
                  key={session._id}
                  sx={{
                    borderRadius: 2.5,
                    background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.08), rgba(229, 57, 53, 0.08))',
                    border: '2px solid rgba(244, 63, 94, 0.3)',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 24px rgba(244, 63, 94, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                    <Stack spacing={2.5}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
                        <Stack spacing={1} sx={{ flex: 1 }}>
                          <Typography variant="h6" fontWeight={700}>
                            {session.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {session.course.title}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {session.instructor.firstName} {session.instructor.lastName}
                          </Typography>
                        </Stack>
                        <Stack 
                          direction={{ xs: 'column', sm: 'row' }} 
                          spacing={1}
                          sx={{ 
                            justifyContent: 'flex-end',
                            width: { xs: '100%', md: 'auto' }
                          }}
                        >
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<CalendarToday />}
                            onClick={() => {
                              window.open(generateGoogleCalendarUrl(session), '_blank');
                            }}
                            sx={{
                              borderRadius: 1.5,
                              fontWeight: 600,
                              textTransform: 'none'
                            }}
                          >
                            Add to Calendar
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<LiveTv />}
                            onClick={() => navigate('/dashboard/student/live-sessions')}
                            sx={{
                              borderRadius: 1.5,
                              fontWeight: 600,
                              textTransform: 'none'
                            }}
                          >
                            Join Session
                          </Button>
                        </Stack>
                      </Stack>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                          <CalendarToday sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {new Date(session.scheduledTime).toLocaleDateString(undefined, { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                          <Timer sx={{ fontSize: 18, color: 'error.main', fontWeight: 700 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                            {new Date(session.scheduledTime).toLocaleTimeString(undefined, { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true
                            })} • {liveSessionService.formatDuration(session.duration)}
                          </Typography>
                        </Stack>
                        {countdownTime && (
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
                            <Box sx={{ fontSize: 18, color: 'warning.main' }}>⏱️</Box>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'warning.main' }}>
                              {countdownTime}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          {/* Announcements Section */}
          {visibleAnnouncements.length > 0 && (
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Announcement sx={{ color: 'primary.main' }} />
                Announcements
              </Typography>
              <Stack spacing={2}>
                {visibleAnnouncements.map((announcement) => (
                  <AnnouncementCard key={announcement._id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                      <Box sx={{ flex: 1, pr: 1, display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Box sx={{ flexShrink: 0, mt: 0.5 }}>
                          {getAnnouncementIcon(announcement.priority)}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={700}>
                              {announcement.title}
                            </Typography>
                            {announcement.isPinned && (
                              <Chip label="Pinned" size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                            )}
                          </Stack>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5 }}>
                            {announcement.content}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.disabled">
                              {announcement.instructor?.firstName} {announcement.instructor?.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              •
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {new Date(announcement.createdAt).toLocaleDateString()}
                            </Typography>
                          </Stack>
                        </Box>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => {
                          const newDismissed = new Set(dismissedAnnouncements);
                          newDismissed.add(announcement._id);
                          setDismissedAnnouncements(newDismissed);
                        }}
                        sx={{ mt: -0.5 }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  </AnnouncementCard>
                ))}
              </Stack>
            </Box>
          )}

          {/* Quick Stats */}
          <Box>
            <Grid container spacing={{ xs: 1.5, md: 2 }}>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard>
                  <Stack spacing={0.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <BookmarkBorder sx={{ fontSize: 20, color: 'primary.main' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Enrolled
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.total}
                    </Typography>
                  </Stack>
                </StatCard>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard>
                  <Stack spacing={0.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <EmojiEvents sx={{ fontSize: 20, color: 'success.main' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Completed
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.completed}
                    </Typography>
                  </Stack>
                </StatCard>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard>
                  <Stack spacing={0.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <TrendingUp sx={{ fontSize: 20, color: 'info.main' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        In Progress
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700}>
                      {stats.inProgress}
                    </Typography>
                  </Stack>
                </StatCard>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <StatCard>
                  <Stack spacing={0.5}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Assessment sx={{ fontSize: 20, color: 'warning.main' }} />
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Progress
                      </Typography>
                    </Stack>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h5" fontWeight={700}>
                        {stats.averageProgress}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={stats.averageProgress} 
                      sx={{ 
                        borderRadius: 1, 
                        height: 6,
                        backgroundColor: 'rgba(0,0,0,0.08)'
                      }} 
                    />
                  </Stack>
                </StatCard>
              </Grid>
            </Grid>
          </Box>

          {/* My Courses Section */}
          {enrollments.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BookmarkBorder />
                  My Courses
                </Typography>
                <Button 
                  variant="text" 
                  size="small"
                  onClick={() => navigate('/dashboard/student/courses')}
                  sx={{ fontWeight: 600 }}
                >
                  View All →
                </Button>
              </Box>
              <Grid container spacing={{ xs: 2, md: 2.5 }}>
                {enrollments.slice(0, 3).map(enrollment => {
                  const course = enrollment.course;
                  if (!course) return null;
                  const progress = enrollment.progress?.totalProgress || 0;
                  const chipColor = progress >= 100 ? 'success' : progress > 0 ? 'primary' : 'default';
                  const chipLabel = progress >= 100 ? '✓ Completed' : progress > 0 ? 'In Progress' : 'Not Started';
                  
                  return (
                    <Grid item xs={12} sm={6} md={4} key={enrollment._id}>
                      <CourseCard>
                        <Box
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            color: 'white',
                            p: 2.5,
                            minHeight: 100,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <Typography variant="overline" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
                            {course.category || 'General'}
                          </Typography>
                          <Typography 
                            variant="h6" 
                            fontWeight={700}
                            sx={{ 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.3
                            }}
                          >
                            {course.title}
                          </Typography>
                        </Box>
                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Stack spacing={1}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                Progress
                              </Typography>
                              <Chip 
                                label={chipLabel} 
                                color={chipColor} 
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                              />
                            </Stack>
                            <LinearProgress 
                              variant="determinate" 
                              value={progress} 
                              sx={{ 
                                borderRadius: 1.5, 
                                height: 6,
                                backgroundColor: 'rgba(0,0,0,0.08)'
                              }} 
                            />
                            <Typography variant="caption" color="primary.main" fontWeight={600}>
                              {progress}% complete
                            </Typography>
                          </Stack>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            startIcon={<PlayArrow fontSize="small" />}
                            onClick={() => navigate(`/dashboard/student/course/${course._id}`)}
                            sx={{ borderRadius: 2, mt: 'auto', fontWeight: 600 }}
                          >
                            {progress >= 100 ? 'View Certificate' : 'Continue'}
                          </Button>
                        </CardContent>
                      </CourseCard>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* Quick Actions */}
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Paper
                  onClick={() => navigate('/dashboard/student/live-sessions')}
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <LiveTv sx={{ fontSize: 28, color: 'error.main', mb: 1 }} />
                  <Typography variant="caption" fontWeight={600} sx={{ display: 'block', lineHeight: 1.4 }}>
                    Live Sessions
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper
                  onClick={() => navigate('/dashboard/student/courses')}
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <BookmarkBorder sx={{ fontSize: 28, color: 'primary.main', mb: 1 }} />
                  <Typography variant="caption" fontWeight={600} sx={{ display: 'block', lineHeight: 1.4 }}>
                    All Courses
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper
                  onClick={() => navigate('/dashboard/student/assessments')}
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <Assessment sx={{ fontSize: 28, color: 'success.main', mb: 1 }} />
                  <Typography variant="caption" fontWeight={600} sx={{ display: 'block', lineHeight: 1.4 }}>
                    Assessments
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper
                  onClick={() => navigate('/community/feed')}
                  sx={{
                    p: 2.5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                    }
                  }}
                >
                  <Groups sx={{ fontSize: 28, color: 'info.main', mb: 1 }} />
                  <Typography variant="caption" fontWeight={600} sx={{ display: 'block', lineHeight: 1.4 }}>
                    Community
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Recommended Courses */}
          {relatedCourses.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Explore />
                  Recommended For You
                </Typography>
              </Box>
              <Grid container spacing={{ xs: 2, md: 2.5 }}>
                {relatedCourses.map(course => (
                  <Grid item xs={12} sm={6} md={4} key={course._id}>
                    <Card 
                      sx={{ 
                        borderRadius: 2.5, 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 12px 24px rgba(0,0,0,0.12)'
                        }
                      }}
                    >
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(14, 165, 233, 0.1))',
                          p: 2.5,
                          minHeight: 120,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'flex-end'
                        }}
                      >
                        <Typography variant="overline" color="primary" fontWeight={700} sx={{ fontSize: '0.75rem', mb: 0.5 }}>
                          {course.category}
                        </Typography>
                        <Typography 
                          variant="h6" 
                          fontWeight={700}
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: 1.3,
                            color: 'text.primary'
                          }}
                        >
                          {course.title}
                        </Typography>
                      </Box>
                      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {course.description?.slice(0, 100) || 'Upskill with engaging content and projects.'}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 'auto' }}>
                          <Chip label={course.level} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                          <Chip label={`${course.duration} hrs`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        </Stack>
                        <Button 
                          fullWidth 
                          variant="outlined" 
                          size="small"
                          onClick={() => navigate(`/courses/${course._id}`)} 
                          sx={{ borderRadius: 2, fontWeight: 600 }}
                        >
                          Explore
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* No Courses State */}
          {enrollments.length === 0 && (
            <Card sx={{ borderRadius: 3, p: { xs: 3, sm: 5 }, textAlign: 'center', border: '1px solid rgba(0,0,0,0.05)' }}>
              <BookmarkBorder sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                Ready to Start Learning?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                Explore our catalog of expertly-designed courses and begin your journey to mastery today.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center' }}>
                <Button 
                  variant="contained" 
                  onClick={() => navigate('/courses')}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  Browse All Courses
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/community/feed')}
                  sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                  Join Community
                </Button>
              </Stack>
            </Card>
          )}
        </Stack>
      </Container>
    </ResponsiveDashboard>
  );
};

export default StudentDashboard;

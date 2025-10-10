import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  Drawer,
  useTheme,
  useMediaQuery,
  Fab,
  Badge,
  Avatar,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  CheckCircle,
  Description,
  VideoFile,
  AudioFile,
  Image,
  Quiz,
  Assignment,
  School,
  Timer,
  Lock,
  LockOpen,
  Menu,
  Notifications,
  VideoCall,
  Announcement,
  Event,
  Schedule,
  TrendingUp,
  Person,
  Dashboard
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { weekService, Week, WeekMaterial } from '../../services/weekService';
import api from '../../services/api';

// Interface for the actual backend response
interface CourseProgressResponse {
  weekProgresses: any[];
  materialProgresses: any[];
}

const UnifiedLearningPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [course, setCourse] = useState<ICourse | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [progress, setProgress] = useState<CourseProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);

  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) {
        setError('No course ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load course, weeks, progress, announcements, and live sessions in parallel
        const [courseData, weeksData, progressResponse, announcementsResponse, liveSessionsResponse] = await Promise.all([
          courseService.getCourseById(courseId),
          weekService.getCourseWeeks(courseId),
          api.get(`/progress/courses/${courseId}/progress`).catch((error) => {
            console.warn('Progress API failed, using empty progress:', error);
            return { data: { data: { weekProgresses: [], materialProgresses: [] } } };
          }),
          // Fetch announcements for the course
          api.get(`/announcements/course/${courseId}`).catch((error) => {
            console.warn('Announcements API not available:', error.message);
            return { data: { data: [] } };
          }),
          // Fetch live sessions for the course
          api.get(`/live-sessions/course/${courseId}`).catch((error) => {
            console.warn('Live sessions API not available:', error.message);
            return { data: { data: [] } };
          })
        ]);
        
        setCourse(courseData);
        setWeeks(weeksData);
        setProgress(progressResponse.data.data || { weekProgresses: [], materialProgresses: [] });
        
        // Handle announcements - use real API data or fallback to mock data
        const announcementsData = announcementsResponse.data?.data || [];
        if (announcementsData.length === 0) {
          // Mock announcements for demonstration when no real data is available
          setAnnouncements([
            {
              title: "Welcome to the Course!",
              content: "Welcome to this comprehensive learning journey. Make sure to complete all materials to get the most out of this course.",
              createdAt: new Date().toISOString()
            },
            {
              title: "Live Session This Week",
              content: "Join us for a live Q&A session this Friday at 2:00 PM. Bring your questions!",
              createdAt: new Date(Date.now() - 86400000).toISOString()
            }
          ]);
        } else {
          setAnnouncements(announcementsData);
        }
        
        // Process live sessions for upcoming events - use real API data or fallback to mock data
        const sessionsData = liveSessionsResponse.data?.data?.sessions || [];
        if (sessionsData.length === 0) {
          // Mock upcoming sessions for demonstration when no real data is available
          const mockSessions = [
            {
              title: "Weekly Q&A Session",
              scheduledTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
              description: "Join us for a live Q&A session to discuss course materials and answer your questions."
            },
            {
              title: "Course Review Session",
              scheduledTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
              description: "Comprehensive review of all course topics covered so far."
            }
          ];
          setUpcomingEvents(mockSessions);
        } else {
          const upcomingSessions = sessionsData
            .filter((session: any) => new Date(session.scheduledTime) > new Date())
            .sort((a: any, b: any) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
            .slice(0, 3); // Show only next 3 upcoming sessions
          setUpcomingEvents(upcomingSessions);
        }
      } catch (err: any) {
        console.error('Error loading course data:', err);
        setError(err.message || 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  // Handle mobile sidebar
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleBack = () => {
    navigate('/dashboard/student/courses');
  };

  const handleGoToLiveSessions = () => {
    navigate(`/dashboard/student/course/${courseId}/live-sessions`);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard/student');
  };

  const handleMaterialClick = (material: WeekMaterial) => {
    navigate(`/material/${courseId}/${material._id}`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <Description />;
      case 'video':
        return <VideoFile />;
      case 'audio':
        return <AudioFile />;
      case 'quiz':
        return <Quiz />;
      case 'assignment':
        return <Assignment />;
      default:
        return <Description />;
    }
  };

  const isMaterialCompleted = (materialId: string) => {
    return progress?.materialProgresses?.some((mp: any) => mp.materialId === materialId && mp.status === 'completed') || false;
  };

  const getWeekProgress = (weekId: string) => {
    // For now, return a simple calculation based on completed materials
    const week = weeks.find(w => w._id === weekId);
    if (!week) return 0;
    
    // Only count published materials
    const publishedMaterials = week.materials.filter(mat => mat.isPublished);
    const completedMaterials = publishedMaterials.filter(mat => isMaterialCompleted(mat._id));
    return publishedMaterials.length > 0 ? (completedMaterials.length / publishedMaterials.length) * 100 : 0;
  };

  const handleMarkComplete = async (weekId: string, materialId: string) => {
    try {
      await api.post(`/progress/weeks/${weekId}/materials/${materialId}/complete`, { timeSpent: 5 });
      // Refresh progress data
      const progressResponse = await api.get(`/progress/courses/${courseId}/progress`);
      setProgress(progressResponse.data.data || { weekProgresses: [], materialProgresses: [] });
    } catch (err) {
      console.error('Error marking material complete:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Please log in to access this course.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading course...
            </Typography>
        </Container>
    );
  }

  if (error) {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Back to Courses
        </Button>
        </Container>
    );
  }

  if (!course) {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Course not found.
          </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Back to Courses
        </Button>
        </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top App Bar */}
      <AppBar position="static" sx={{ backgroundColor: 'white', color: 'text.primary', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <Toolbar sx={{ 
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1, sm: 2 }
        }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ 
              mr: { xs: 1, sm: 2 },
              p: { xs: 1, sm: 1.5 }
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              noWrap
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                fontWeight: 'bold'
              }}
            >
              {course?.title || 'Learning'}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 }
          }}>
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              onClick={handleGoToLiveSessions}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 },
                minWidth: { xs: 'auto', sm: 'auto' },
                '& .MuiButton-startIcon': {
                  mr: { xs: 0.5, sm: 1 }
                }
              }}
            >
              <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Live Sessions
              </Box>
              <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                Live
              </Box>
            </Button>
            
            <IconButton
              color="inherit"
              onClick={handleGoToDashboard}
              sx={{ 
                p: { xs: 1, sm: 1.5 },
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              <Dashboard />
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={toggleSidebar}
              sx={{ 
                p: { xs: 1, sm: 1.5 }
              }}
            >
              <Menu />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Drawer
          variant={isMobile ? "temporary" : "persistent"}
          open={sidebarOpen}
          onClose={toggleSidebar}
          sx={{
            width: { xs: 280, sm: 320 },
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: { xs: 280, sm: 320 },
              boxSizing: 'border-box',
              backgroundColor: 'grey.50',
              borderRight: '1px solid',
              borderColor: 'divider',
              // Mobile optimizations
              '@media (max-width: 600px)': {
                width: '100vw',
                maxWidth: '320px'
              }
            },
          }}
        >
          <Box sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            height: '100%', 
            overflow: 'auto',
            // Mobile scroll optimizations
            '@media (max-width: 600px)': {
              padding: 1
            }
          }}>
            {/* Course Info */}
            <Card sx={{ 
              mb: { xs: 1.5, sm: 2 }, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white' 
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  {course?.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    opacity: 0.9, 
                    mb: 2,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    lineHeight: 1.4
                  }}
                >
                  {course?.description}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 0.5, sm: 1 }, 
                  flexWrap: 'wrap' 
                }}>
                  <Chip
                    icon={<School />}
                    label={`${weeks.length} Weeks`}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      height: { xs: 24, sm: 28 }
                    }}
                  />
                  <Chip
                    icon={<Timer />}
                    label={`${weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).reduce((sum, mat) => sum + mat.estimatedDuration, 0), 0)} min`}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      height: { xs: 24, sm: 28 }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Course Progress Overview */}
            {progress && (
              <Card sx={{ mb: { xs: 1.5, sm: 2 } }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontSize: { xs: '0.9rem', sm: '1.25rem' },
                      fontWeight: 'bold'
                    }}
                  >
                    <TrendingUp />
                    Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress.materialProgresses?.length > 0 ?
                      (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length /
                        weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0}
                    sx={{ 
                      height: { xs: 6, sm: 8 }, 
                      borderRadius: 4, 
                      mb: 1 
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    {Math.round(progress.materialProgresses?.length > 0 ?
                      (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length /
                        weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0)}% Complete
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Announcements */}
            <Card sx={{ mb: { xs: 1.5, sm: 2 } }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '0.9rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  <Announcement />
                  Announcements
                </Typography>
                {announcements.length === 0 ? (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontStyle: 'italic',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    No announcements yet
                  </Typography>
                ) : (
                  <List dense>
                    {announcements.slice(0, 3).map((announcement, index) => (
                      <ListItem key={index} sx={{ px: 0, py: { xs: 0.5, sm: 1 } }}>
                        <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}>
                          <Announcement color="primary" sx={{ fontSize: { xs: 18, sm: 24 } }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={announcement.title}
                          secondary={announcement.content}
                          primaryTypographyProps={{ 
                            variant: 'body2', 
                            fontWeight: 'bold',
                            sx: { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                          }}
                          secondaryTypographyProps={{ 
                            variant: 'caption',
                            sx: { fontSize: { xs: '0.7rem', sm: '0.75rem' } }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card sx={{ mb: { xs: 1.5, sm: 2 } }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '0.9rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  <Event />
                  Upcoming Events
                </Typography>
                {upcomingEvents.length === 0 ? (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontStyle: 'italic',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    No upcoming events
                  </Typography>
                ) : (
                  <List dense>
                    {upcomingEvents.map((event, index) => (
                      <ListItem key={index} sx={{ px: 0, py: { xs: 0.5, sm: 1 } }}>
                        <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}>
                          <VideoCall color="secondary" sx={{ fontSize: { xs: 18, sm: 24 } }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={event.title}
                          secondary={
                            <Box>
                              <Typography 
                                variant="caption" 
                                display="block"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                              >
                                {new Date(event.scheduledTime).toLocaleDateString()}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                              >
                                {new Date(event.scheduledTime).toLocaleTimeString()}
                              </Typography>
                            </Box>
                          }
                          primaryTypographyProps={{ 
                            variant: 'body2', 
                            fontWeight: 'bold',
                            sx: { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '0.9rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  <Schedule />
                  Quick Actions
                </Typography>
                <Stack spacing={{ xs: 0.5, sm: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<VideoCall />}
                    onClick={handleGoToLiveSessions}
                    fullWidth
                    size="small"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      py: { xs: 0.5, sm: 1 },
                      '& .MuiButton-startIcon': {
                        mr: { xs: 0.5, sm: 1 }
                      }
                    }}
                  >
                    Join Live Session
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Dashboard />}
                    onClick={handleGoToDashboard}
                    fullWidth
                    size="small"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      py: { xs: 0.5, sm: 1 },
                      '& .MuiButton-startIcon': {
                        mr: { xs: 0.5, sm: 1 }
                      }
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 3 },
            backgroundColor: 'grey.50',
            minHeight: 'calc(100vh - 64px)',
            // Mobile optimizations
            '@media (max-width: 600px)': {
              p: 1
            }
          }}
        >
          {/* Course Progress Overview */}
          {progress && (
            <Card sx={{ mb: { xs: 2, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  <TrendingUp />
                  Course Progress
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress.materialProgresses?.length > 0 ?
                    (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length /
                      weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0}
                  sx={{ 
                    height: { xs: 6, sm: 8 }, 
                    borderRadius: 4, 
                    mb: 1 
                  }}
                />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '0.875rem' }
                  }}
                >
                  {Math.round(progress.materialProgresses?.length > 0 ?
                    (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length /
                      weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0)}% Complete
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Weeks and Materials */}
          {weeks.length === 0 ? (
            <Card>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: { xs: 3, sm: 4 },
                px: { xs: 2, sm: 3 }
              }}>
                <Typography 
                  variant="h6" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  No course content available yet
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '0.875rem' }
                  }}
                >
                  The instructor hasn't added any materials to this course.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {weeks.map((week, index) => (
                <Grid item xs={12} key={week._id}>
                  <Card sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-2px)' },
                      boxShadow: { xs: 2, sm: 4 }
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        mb: 2,
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 0 }
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            gutterBottom
                            sx={{ 
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                              fontWeight: 'bold'
                            }}
                          >
                            Week {week.weekNumber}: {week.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            paragraph
                            sx={{ 
                              fontSize: { xs: '0.875rem', sm: '0.875rem' },
                              mb: { xs: 1.5, sm: 2 }
                            }}
                          >
                            {week.description}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: { xs: 0.5, sm: 1 }, 
                            flexWrap: 'wrap', 
                            mb: 2 
                          }}>
                            <Chip
                              label={`${week.materials.filter(mat => mat.isPublished).length} Materials`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                height: { xs: 24, sm: 28 }
                              }}
                            />
                            <Chip
                              label={`${week.materials.filter(mat => mat.isPublished).reduce((sum, mat) => sum + mat.estimatedDuration, 0)} min`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                height: { xs: 24, sm: 28 }
                              }}
                            />
                            {week.isPublished ? (
                              <Chip 
                                label="Published" 
                                size="small" 
                                color="success"
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  height: { xs: 24, sm: 28 }
                                }}
                              />
                            ) : (
                              <Chip 
                                label="Draft" 
                                size="small" 
                                color="warning"
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  height: { xs: 24, sm: 28 }
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ 
                          textAlign: { xs: 'left', sm: 'right' },
                          alignSelf: { xs: 'flex-start', sm: 'auto' }
                        }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            Progress
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={getWeekProgress(week._id)}
                            sx={{ 
                              width: { xs: 80, sm: 100 }, 
                              height: { xs: 4, sm: 6 }, 
                              borderRadius: 3 
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.7rem', sm: '0.75rem' }
                            }}
                          >
                            {Math.round(getWeekProgress(week._id))}%
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Materials List */}
                      {week.materials.filter(mat => mat.isPublished).length === 0 ? (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontStyle: 'italic',
                            fontSize: { xs: '0.875rem', sm: '0.875rem' }
                          }}
                        >
                          {week.materials.length === 0 ? 'No materials added to this week yet.' : 'No published materials available yet.'}
                        </Typography>
                      ) : (
                        <List>
                          {week.materials.filter(mat => mat.isPublished).map((material, matIndex) => {
                            const isCompleted = isMaterialCompleted(material._id);
                            return (
                              <React.Fragment key={material._id}>
                                <ListItem
                                  sx={{
                                    backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                    borderRadius: 1,
                                    mb: 1,
                                    border: isCompleted ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid transparent',
                                    cursor: 'pointer',
                                    px: { xs: 1, sm: 2 },
                                    py: { xs: 1, sm: 1.5 },
                                    '&:hover': {
                                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                    }
                                  }}
                                  onClick={() => handleMaterialClick(material)}
                                >
                                  <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                                    {isCompleted ? (
                                      <CheckCircle color="success" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                    ) : (
                                      <Box sx={{ fontSize: { xs: 20, sm: 24 } }}>
                                        {getMaterialIcon(material.type)}
                                      </Box>
                                    )}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: { xs: 0.5, sm: 1 },
                                        flexWrap: 'wrap'
                                      }}>
                                        <Typography 
                                          variant="subtitle1"
                                          sx={{ 
                                            fontSize: { xs: '0.875rem', sm: '1rem' },
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          {material.title}
                                        </Typography>
                                        {material.isRequired && (
                                          <Chip 
                                            label="Required" 
                                            size="small" 
                                            color="error"
                                            sx={{ 
                                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                              height: { xs: 20, sm: 24 }
                                            }}
                                          />
                                        )}
                                        {isCompleted && (
                                          <Chip 
                                            label="Completed" 
                                            size="small" 
                                            color="success"
                                            sx={{ 
                                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                              height: { xs: 20, sm: 24 }
                                            }}
                                          />
                                        )}
                                      </Box>
                                    }
                                    secondary={
                                      <Box>
                                        <Typography 
                                          variant="body2" 
                                          color="text.secondary"
                                          sx={{ 
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                            mb: { xs: 0.5, sm: 0.5 }
                                          }}
                                        >
                                          {material.description}
                                        </Typography>
                                        <Box sx={{ 
                                          display: 'flex', 
                                          gap: { xs: 0.5, sm: 1 }, 
                                          flexWrap: 'wrap'
                                        }}>
                                          <Chip 
                                            label={material.type} 
                                            size="small" 
                                            variant="outlined"
                                            sx={{ 
                                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                              height: { xs: 20, sm: 24 }
                                            }}
                                          />
                                          <Chip
                                            icon={<Timer sx={{ fontSize: { xs: 12, sm: 16 } }} />}
                                            label={`${material.estimatedDuration} min`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ 
                                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                              height: { xs: 20, sm: 24 }
                                            }}
                                          />
                                        </Box>
                                      </Box>
                                    }
                                  />
                                  <Box sx={{ 
                                    display: 'flex', 
                                    gap: { xs: 0.5, sm: 1 },
                                    flexDirection: { xs: 'column', sm: 'row' }
                                  }}>
                                    <Tooltip title="View Material">
                                      <IconButton 
                                        size="small"
                                        sx={{ 
                                          p: { xs: 0.5, sm: 1 },
                                          minWidth: { xs: 32, sm: 40 },
                                          minHeight: { xs: 32, sm: 40 }
                                        }}
                                      >
                                        <PlayArrow sx={{ fontSize: { xs: 16, sm: 20 } }} />
                                      </IconButton>
                                    </Tooltip>
                                    {!isCompleted && (
                                      <Tooltip title="Mark as Complete">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkComplete(week._id, material._id);
                                          }}
                                          sx={{ 
                                            p: { xs: 0.5, sm: 1 },
                                            minWidth: { xs: 32, sm: 40 },
                                            minHeight: { xs: 32, sm: 40 }
                                          }}
                                        >
                                          <CheckCircle sx={{ fontSize: { xs: 16, sm: 20 } }} />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </ListItem>
                                {matIndex < week.materials.filter(mat => mat.isPublished).length - 1 && <Divider />}
                              </React.Fragment>
                            );
                          })}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default UnifiedLearningPage;
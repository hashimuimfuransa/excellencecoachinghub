import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Alert,
  Button,
  Chip,
  CircularProgress,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  IconButton,
  LinearProgress,
  Stack,
  alpha
} from '@mui/material';
import {
  Person,
  Schedule,
  CheckCircle,
  Close,
  Edit,
  TrendingUp,
  MenuBook,
  People,
  CalendarToday,
  AttachMoney,
  School,
  PendingActions,
  Settings,
  Visibility,
  Add,
  Analytics,
  VideoCall,
  Grade,
  ManageAccounts,
  Notifications,
  MoreVert,
  ArrowForward,
  TrendingDown,
  TrendingFlat
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import { Link } from 'react-router-dom';

const TeacherDashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Fetching teacher dashboard statistics...');
        
        // Add timeout to prevent hanging requests
        const timeoutId = setTimeout(() => {
          setError('Request timeout - please try again');
          setLoading(false);
        }, 10000); // 10 second timeout
        
        const data = await courseService.getTeacherDashboardStats();
        clearTimeout(timeoutId);
        
        console.log('📊 Dashboard data received:', data);
        setDashboardData(data);
      } catch (err) {
        console.error('❌ Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        
        // Auto-retry up to 2 times for network errors
        if (retryCount < 2 && (err instanceof Error && err.message.includes('network'))) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchDashboardData();
          }, 2000);
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [retryCount]);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="60vh"
        sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          mx: 2
        }}
      >
        <Box textAlign="center">
          <CircularProgress size={60} sx={{ color: 'white', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'white' }}>
            Loading your dashboard...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: '1rem'
            }
          }}
        >
          {error}
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => {
            setError(null);
            setRetryCount(0);
            setLoading(true);
          }}
          sx={{ borderRadius: 2 }}
        >
          Try Again
        </Button>
      </Container>
    );
  }

  const stats = dashboardData?.overview || {
    totalCourses: 0,
    activeCourses: 0,
    pendingCourses: 0,
    rejectedCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    liveSessionsCount: 0,
    averageCompletionRate: 0,
    completedCourses: 0,
    recentEnrollments: 0,
    totalEarnings: 0
  };

  const recentActivity = dashboardData?.recentActivity || [];
  const courses = dashboardData?.courses || [];

  // Calculate trend indicators
  const getTrendIcon = (value: number, previousValue: number = 0) => {
    if (value > previousValue) return <TrendingUp sx={{ color: 'success.main' }} />;
    if (value < previousValue) return <TrendingDown sx={{ color: 'error.main' }} />;
    return <TrendingFlat sx={{ color: 'text.secondary' }} />;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 3
    }}>
      <Container maxWidth="xl">
        {/* Modern Header */}
      <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 3,
            p: 4,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '50%',
              transform: 'translate(50%, -50%)'
            }
          }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                  Welcome back, {user?.firstName}! 👋
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                  Ready to inspire and educate? Let's make today amazing.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} textAlign="right">
              <Button 
                variant="contained" 
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                    }
                  }}
                component={Link}
                to="/dashboard/teacher/profile"
                startIcon={<Person />}
              >
                View Profile
              </Button>
            </Grid>
          </Grid>
          </Box>
        </Box>

        {/* Key Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -20,
                right: -20,
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }
            }}>
              <CardContent sx={{ p: 3, position: 'relative' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.activeCourses}
              </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Active Courses
              </Typography>
              {stats.pendingCourses > 0 && (
                <Chip 
                  label={`${stats.pendingCourses} pending`} 
                  size="small" 
                        sx={{ 
                          mt: 1,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          fontWeight: 500
                        }}
                      />
                    )}
                  </Box>
                  <School sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
            </CardContent>
          </Card>
        </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -20,
                right: -20,
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }
            }}>
              <CardContent sx={{ p: 3, position: 'relative' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.totalStudents}
              </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Total Students
              </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {stats.totalEnrollments} enrollments
              </Typography>
                  </Box>
                  <People sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
            </CardContent>
          </Card>
        </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -20,
                right: -20,
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }
            }}>
              <CardContent sx={{ p: 3, position: 'relative' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.liveSessionsCount}
              </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Live Sessions
              </Typography>
                  </Box>
                  <VideoCall sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
            </CardContent>
          </Card>
        </Grid>

          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -20,
                right: -20,
                width: '80px',
                height: '80px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%'
              }
            }}>
              <CardContent sx={{ p: 3, position: 'relative' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                {stats.averageCompletionRate}%
              </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9 }}>
                Completion Rate
              </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {stats.completedCourses} completed
              </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

        {/* Quick Actions Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Quick Actions
              </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                <Button 
                  component={Link}
                  to="/dashboard/teacher/courses/create"
                      variant="contained"
                      fullWidth
                      startIcon={<Add />}
                      sx={{ 
                        py: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                        }
                      }}
                    >
                      Create New Course
                </Button>
        </Grid>
                  <Grid item xs={12} sm={6}>
                <Button 
                  component={Link}
                      to="/dashboard/teacher/live-sessions/create"
                      variant="contained"
                      fullWidth
                      startIcon={<VideoCall />}
                      sx={{ 
                        py: 2,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #3d8bfe 0%, #00d4fe 100%)',
                        }
                      }}
                    >
                      Schedule Live Session
                </Button>
        </Grid>
                  <Grid item xs={12} sm={6}>
              <Button
                component={Link}
                to="/dashboard/teacher/courses"
                variant="outlined"
                fullWidth
                startIcon={<School />}
                      sx={{ py: 2, borderRadius: 2 }}
              >
                Manage Courses
              </Button>
            </Grid>
                  <Grid item xs={12} sm={6}>
              <Button
                component={Link}
                to="/dashboard/teacher/student-management"
                variant="outlined"
                fullWidth
                      startIcon={<ManageAccounts />}
                      sx={{ py: 2, borderRadius: 2 }}
              >
                Student Management
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  Performance Overview
                </Typography>
                <Stack spacing={3}>
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Course Completion Rate
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {stats.averageCompletionRate}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={stats.averageCompletionRate} 
                      sx={{ 
                        height: 8, 
                        borderRadius: 4,
                        backgroundColor: alpha('#667eea', 0.2),
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 4
                        }
                      }}
                    />
                  </Box>
                  
                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Total Earnings
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        ${stats.totalEarnings}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AttachMoney sx={{ color: 'success.main', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">
                        This month
                      </Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Recent Enrollments
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {stats.recentEnrollments}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getTrendIcon(stats.recentEnrollments)}
                      <Typography variant="body2" color="text.secondary">
                        Last 30 days
                      </Typography>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Activity & Courses */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Recent Activity
                  </Typography>
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Box>
                {recentActivity.length > 0 ? (
                  <List sx={{ p: 0 }}>
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <React.Fragment key={index}>
                        <ListItem sx={{ px: 0, py: 2 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ 
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              width: 40,
                              height: 40
                            }}>
                              <Notifications />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {activity.message}
                              </Typography>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                                  {new Date(activity.timestamp).toLocaleTimeString()}
            </Typography>
                                <br />
                                <Typography variant="caption" color="text.secondary">
                                  Course: {activity.course?.title || 'N/A'}
                    </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < recentActivity.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                ) : (
                  <Box textAlign="center" py={4}>
                    <Notifications sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No recent activity yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start by creating your first course!
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Your Courses
                  </Typography>
                  <Button
                    component={Link}
                    to="/dashboard/teacher/courses"
                    endIcon={<ArrowForward />}
                    size="small"
                    sx={{ textTransform: 'none' }}
                  >
                    View All
                  </Button>
                </Box>
                {courses.length > 0 ? (
                  <Stack spacing={2}>
                    {courses.slice(0, 4).map((course) => (
                      <Paper 
                        key={course._id} 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          '&:hover': {
                            borderColor: 'primary.main',
                            backgroundColor: alpha('#667eea', 0.05)
                          }
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="start">
                          <Box flex={1}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {course.title}
                            </Typography>
                            <Box display="flex" gap={1} mb={1}>
                              <Chip 
                                label={course.status} 
                                size="small" 
                                color={course.status === 'active' ? 'success' : 'default'}
                                sx={{ fontSize: '0.75rem' }}
                              />
                              <Chip 
                                label={`${course.enrollmentCount} students`} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.75rem' }}
                              />
                            </Box>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(course.createdAt).toLocaleDateString()}
                    </Typography>
                          </Box>
                      <Button
                        component={Link}
                            to={`/dashboard/teacher/courses/${course._id}/manage`}
                        size="small"
                            variant="outlined"
                        startIcon={<Settings />}
                            sx={{ ml: 2, textTransform: 'none' }}
                      >
                            Manage
                      </Button>
                    </Box>
                  </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Box textAlign="center" py={4}>
                    <School sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No courses yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Create your first course to get started!
                    </Typography>
                    <Button
                      component={Link}
                      to="/dashboard/teacher/courses/create"
                      variant="contained"
                      startIcon={<Add />}
                      sx={{ borderRadius: 2 }}
                    >
                      Create Course
                    </Button>
                  </Box>
                )}
          </CardContent>
        </Card>
          </Grid>
        </Grid>
    </Container>
    </Box>
  );
};

const TeacherDashboard: React.FC = () => {
  return <TeacherDashboardContent />;
};

export default TeacherDashboard;
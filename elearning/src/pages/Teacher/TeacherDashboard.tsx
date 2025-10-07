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
  Divider
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
  PendingActions
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import { Link } from 'react-router-dom';

const TeacherDashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Fetching teacher dashboard statistics...');
        
        const data = await courseService.getTeacherDashboardStats();
        console.log('📊 Dashboard data received:', data);
        
        setDashboardData(data);
      } catch (err) {
        console.error('❌ Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Here's what's happening with your teaching journey
        </Typography>
      </Box>

      {/* Welcome Card */}
      <Card elevation={2} sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Person color="primary" sx={{ fontSize: 32 }} />
                <Typography variant="h5" component="h2">
                  Welcome to Your Teaching Dashboard
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" paragraph>
                Manage your courses, students, and teaching activities from this central hub.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4} textAlign="right">
              <Button 
                variant="contained" 
                color="primary"
                component={Link}
                to="/dashboard/teacher/profile"
                startIcon={<Person />}
              >
                View Profile
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <MenuBook color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {stats.activeCourses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Courses
              </Typography>
              {stats.pendingCourses > 0 && (
                <Chip 
                  label={`${stats.pendingCourses} pending`} 
                  size="small" 
                  color="warning" 
                  sx={{ mt: 1 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <People color="secondary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {stats.totalStudents}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Students
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.totalEnrollments} enrollments
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <CalendarToday color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {stats.liveSessionsCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Live Sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {stats.averageCompletionRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completion Rate
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats.completedCourses} completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <School color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {stats.totalCourses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <AttachMoney color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                ${stats.totalEarnings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <PendingActions color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {stats.recentEnrollments}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Recent Enrollments
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Last 30 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <CheckCircle color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" component="div" gutterBottom>
                {stats.completedCourses}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed Courses
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                🚀 Get Started
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Ready to start teaching? Create your first course and begin your teaching journey.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="contained" 
                  color="primary"
                  component={Link}
                  to="/dashboard/teacher/courses/create"
                  startIcon={<MenuBook />}
                >
                  Create Course
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary"
                  component={Link}
                  to="/dashboard/teacher/courses"
                >
                  View Courses
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card elevation={2} sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                📚 Teaching Resources
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Access tools and resources to enhance your teaching experience.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  component={Link}
                  to="/dashboard/teacher/live-sessions"
                  startIcon={<CalendarToday />}
                >
                  Live Sessions
                </Button>
                <Button 
                  variant="outlined" 
                  color="secondary"
                  component={Link}
                  to="/dashboard/teacher/analytics"
                  startIcon={<TrendingUp />}
                >
                  Analytics
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Card elevation={2}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            📈 Recent Activity
          </Typography>
          {recentActivity.length > 0 ? (
            <List>
              {recentActivity.map((activity, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.message}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(activity.timestamp).toLocaleDateString()} at{' '}
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Course: {activity.course.title}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No recent activity yet. Start by creating your first course!
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Course Overview */}
      {courses.length > 0 && (
        <Card elevation={2} sx={{ mt: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              📚 Your Courses
            </Typography>
            <Grid container spacing={2}>
              {courses.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      {course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Status: {course.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enrollments: {course.enrollmentCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Created: {new Date(course.createdAt).toLocaleDateString()}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

const TeacherDashboard: React.FC = () => {
  return <TeacherDashboardContent />;
};

export default TeacherDashboard;
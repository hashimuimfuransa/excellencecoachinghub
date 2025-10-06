import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  Button,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Paper,
  IconButton,
  Alert
} from '@mui/material';
import {
  School,
  Quiz,
  VideoCall,
  TrendingUp,
  EmojiEvents,
  PlayArrow,
  Grade
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import { assessmentService } from '../../services/assessmentService';

// Mock data for demonstration
const mockData = {
  stats: {
    totalCourses: 5,
    completedCourses: 2,
    totalPoints: 1250,
    currentStreak: 7
  },
  recentActivity: [
    {
      id: '1',
      type: 'course_completed',
      title: 'Completed JavaScript Fundamentals',
      time: '2 hours ago',
      icon: <School color="success" />
    },
    {
      id: '2',
      type: 'quiz_submitted',
      title: 'Submitted React Hooks Quiz',
      time: '1 day ago',
      icon: <Quiz color="primary" />
    },
    {
      id: '3',
      type: 'live_session_attended',
      title: 'Attended Database Design Workshop',
      time: '2 days ago',
      icon: <VideoCall color="info" />
    }
  ],
  achievements: [
    { id: '1', name: 'First Course Completed', icon: '🎓', points: 100 },
    { id: '2', name: 'Quiz Master', icon: '🏆', points: 250 },
    { id: '3', name: 'Early Bird', icon: '🐦', points: 150 }
  ]
};

const StudentOverview: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [loading, setLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [upcomingAssessments, setUpcomingAssessments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load enrolled courses
        const coursesResponse = await courseService.getEnrolledCourses();
        setEnrolledCourses(coursesResponse.courses.slice(0, 3)); // Show only first 3

        // Load upcoming assessments
        const assessmentsResponse = await assessmentService.getStudentAssessments({ limit: 3 });
        setUpcomingAssessments(assessmentsResponse.assessments);

        // TODO: Load upcoming live sessions

      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <Typography>Loading dashboard...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Continue your learning journey and achieve your goals.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <School color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{mockData.stats.totalCourses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enrolled Courses
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
                <EmojiEvents color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{mockData.stats.totalPoints}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Points
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
                <TrendingUp color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{mockData.stats.currentStreak}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Day Streak
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
                <Grade color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{mockData.stats.completedCourses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* My Courses */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">My Courses</Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate('/courses')}
                >
                  View All
                </Button>
              </Box>
              
              {enrolledCourses.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No enrolled courses yet. Browse available courses to get started!
                </Typography>
              ) : (
                <Box>
                  {enrolledCourses.map((course) => (
                    <Box key={course._id} mb={2}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="subtitle1">{course.title}</Typography>
                        <Chip 
                          label={`${course.progress || 0}%`} 
                          size="small" 
                          color="primary" 
                        />
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={course.progress || 0} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Instructor: {course.instructor?.firstName} {course.instructor?.lastName}
                      </Typography>
                      {course !== enrolledCourses[enrolledCourses.length - 1] && <Divider sx={{ mt: 2 }} />}
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <List>
                {mockData.recentActivity.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem disablePadding>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {activity.icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.title}
                        secondary={activity.time}
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                    {index < mockData.recentActivity.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Assessments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Upcoming Assessments</Typography>
                <Button 
                  size="small" 
                  onClick={() => navigate('/dashboard/student/assessments')}
                >
                  View All
                </Button>
              </Box>
              
              {upcomingAssessments.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>
                  No upcoming assessments
                </Typography>
              ) : (
                <List>
                  {upcomingAssessments.map((assessment, index) => (
                    <React.Fragment key={assessment._id}>
                      <ListItem disablePadding>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            <Quiz />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={assessment.title}
                          secondary={`${assessment.course?.title} • Due: ${assessment.dueDate ? new Date(assessment.dueDate).toLocaleDateString() : 'No due date'}`}
                        />
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/dashboard/student/assessments/${assessment._id}`)}
                        >
                          <PlayArrow />
                        </IconButton>
                      </ListItem>
                      {index < upcomingAssessments.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Achievements */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Achievements
              </Typography>
              <Grid container spacing={2}>
                {mockData.achievements.map((achievement) => (
                  <Grid item xs={12} key={achievement.id}>
                    <Paper 
                      variant="outlined" 
                      sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}
                    >
                      <Typography variant="h4">{achievement.icon}</Typography>
                      <Box>
                        <Typography variant="subtitle2">{achievement.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          +{achievement.points} points
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<School />}
                    onClick={() => navigate('/courses')}
                  >
                    Browse Courses
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Quiz />}
                    onClick={() => navigate('/dashboard/student/assessments')}
                  >
                    Take Assessment
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<VideoCall />}
                    onClick={() => navigate('/dashboard/student/live-sessions')}
                  >
                    Join Live Session
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<TrendingUp />}
                    onClick={() => navigate('/dashboard/student/progress')}
                  >
                    View Progress
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentOverview;

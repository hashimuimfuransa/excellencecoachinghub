import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper
} from '@mui/material';
import {
  School,
  Edit,
  Visibility,
  MoreVert,
  Add,
  People,
  Schedule,
  TrendingUp,
  Settings,
  VideoCall,
  Assignment,
  Quiz,
  YouTube
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';

const TeacherCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch teacher's courses from the backend
      const response = await courseService.getTeacherCourses({
        page: 1,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      // Transform the courses to include additional counts
      const transformedCourses = response.courses.map(course => ({
        ...course,
        // Calculate additional counts from course content
        materialsCount: course.content?.filter(item => 
          item.type === 'document' || item.type === 'video'
        ).length || 0,
        liveSessionsCount: 0, // This would need to be fetched separately from live sessions API
        assignmentsCount: course.content?.filter(item => 
          item.type === 'assignment'
        ).length || 0,
        assessmentsCount: course.content?.filter(item => 
          item.type === 'quiz'
        ).length || 0,
        videosCount: course.content?.filter(item => 
          item.type === 'video'
        ).length || 0
      }));
      
      setCourses(transformedCourses);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      setError(err.message || 'Failed to load courses');
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    loadCourses();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, course: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  const handleManageCourse = () => {
    if (selectedCourse) {
      navigate(`/course/${selectedCourse._id}/manage`);
    }
    handleMenuClose();
  };

  const handleViewCourse = () => {
    if (selectedCourse) {
      navigate(`/dashboard/teacher/courses/${selectedCourse._id}`);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          {error}
          {retryCount > 0 && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Retry attempt: {retryCount}
            </Typography>
          )}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            My Courses
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage all your courses, materials, and student interactions.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          component={Link}
          to="/dashboard/teacher/courses/create"
        >
          Create New Course
        </Button>
        <Button
          variant="outlined"
          onClick={loadCourses}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
          sx={{ ml: 2 }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </Box>

      {courses.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No courses yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first course to start teaching and sharing knowledge.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            component={Link}
            to="/dashboard/teacher/courses/create"
          >
            Create Your First Course
          </Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} md={6} lg={4} key={course._id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {course.title}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, course)}
                    >
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary" paragraph>
                    {course.description}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Chip
                      label={course.status}
                      color={getStatusColor(course.status) as any}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  </Box>

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <People sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {course.enrolledStudents?.length || course.enrollmentCount || 0} students
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Schedule sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {course.liveSessionsCount} sessions
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Course Content:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      icon={<School />}
                      label={`${course.materialsCount} materials`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<VideoCall />}
                      label={`${course.liveSessionsCount} sessions`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<Assignment />}
                      label={`${course.assignmentsCount} assignments`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<Quiz />}
                      label={`${course.assessmentsCount} assessments`}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={<YouTube />}
                      label={`${course.videosCount} videos`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    variant="contained"
                    startIcon={<Settings />}
                    onClick={() => navigate(`/course/${course._id}/manage`)}
                    sx={{ flex: 1 }}
                  >
                    Manage Course
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/dashboard/teacher/courses/${course._id}`)}
                  >
                    View
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Course Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleManageCourse}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Manage Course</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleViewCourse}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Course</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Details</ListItemText>
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default TeacherCourses;

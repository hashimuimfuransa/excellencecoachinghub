import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Avatar,
  Rating,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  PlayArrow,
  Schedule,
  Person,
  School,
  AttachMoney,
  VideoLibrary,
  Assignment,
  Quiz,
  EmojiEvents,
  ArrowBack
} from '@mui/icons-material';
import { courseService, ICourse } from '../../services/courseService';
import { enrollmentService, IEnrollment } from '../../services/enrollmentService';
import { useAuth } from '../../store/AuthContext';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [enrollment, setEnrollment] = useState<IEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [unenrollDialogOpen, setUnenrollDialogOpen] = useState(false);

  // Load course details
  const loadCourseDetails = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Load course details using public endpoint
      const courseData = await courseService.getPublicCourseById(id);
      setCourse(courseData);

      // Check enrollment status if user is logged in and is a student
      if (user && user.role === 'student') {
        const enrollmentData = await enrollmentService.getEnrollmentDetailsQuietly(id);
        setEnrollment(enrollmentData);
      } else {
        // User is not logged in or not a student
        setEnrollment(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseDetails();
  }, [id, user]);

  // Handle enrollment
  const handleEnroll = async () => {
    if (!id || !user) return;

    try {
      setEnrolling(true);
      setError(null);

      const enrollmentData = await enrollmentService.enrollInCourse(id);
      setEnrollment(enrollmentData);
      setSuccess('Successfully enrolled in the course!');
      setEnrollDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  // Handle unenrollment
  const handleUnenroll = async () => {
    if (!id) return;

    try {
      setEnrolling(true);
      setError(null);

      await enrollmentService.unenrollFromCourse(id);
      setEnrollment(null);
      setSuccess('Successfully unenrolled from the course');
      setUnenrollDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unenroll from course');
    } finally {
      setEnrolling(false);
    }
  };

  // Get instructor display name
  const getInstructorName = (instructor: any) => {
    if (typeof instructor === 'string') return instructor;
    return `${instructor.firstName} ${instructor.lastName}`;
  };

  // Get course icon
  const getCourseIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('programming') || categoryLower.includes('development')) return '💻';
    if (categoryLower.includes('data') || categoryLower.includes('science')) return '📊';
    if (categoryLower.includes('marketing') || categoryLower.includes('business')) return '📱';
    if (categoryLower.includes('design')) return '🎨';
    if (categoryLower.includes('language')) return '🗣️';
    return '📚';
  };

  // Get gradient colors
  const getGradientColors = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('programming') || categoryLower.includes('development')) return '#667eea, #764ba2';
    if (categoryLower.includes('data') || categoryLower.includes('science')) return '#f093fb, #f5576c';
    if (categoryLower.includes('marketing') || categoryLower.includes('business')) return '#4facfe, #00f2fe';
    if (categoryLower.includes('design')) return '#43e97b, #38f9d7';
    if (categoryLower.includes('language')) return '#fa709a, #fee140';
    return '#a8edea, #fed6e3';
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

  if (error && !course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/courses')}
          variant="outlined"
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          Course not found
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/courses')}
          variant="outlined"
          sx={{ mt: 2 }}
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/courses')}
        sx={{ mb: 3 }}
      >
        Back to Courses
      </Button>

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

      <Grid container spacing={4}>
        {/* Course Header */}
        <Grid item xs={12}>
          <Card sx={{ mb: 4 }}>
            <CardMedia
              component="div"
              sx={{
                height: 300,
                background: `linear-gradient(45deg, ${getGradientColors(course.category)})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '4rem',
                position: 'relative'
              }}
            >
              {course.thumbnail ? (
                <img 
                  src={course.thumbnail} 
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                getCourseIcon(course.category)
              )}
              
              {/* Enrollment Status Badge */}
              {enrollment && (
                <Chip
                  label="Enrolled"
                  color="success"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    fontWeight: 'bold'
                  }}
                />
              )}
            </CardMedia>

            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={course.category}
                  color="primary"
                  sx={{ mr: 2 }}
                />
                <Chip
                  label={course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  variant="outlined"
                />
              </Box>

              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                {course.title}
              </Typography>

              <Typography variant="h6" color="text.secondary" paragraph>
                {course.description}
              </Typography>

              {/* Course Stats */}
              <Grid container spacing={3} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Person sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Instructor
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {getInstructorName(course.instructor)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Schedule sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Duration
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {course.duration} hours
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <School sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Students
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {course.enrollmentCount || 0}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AttachMoney sx={{ mr: 1, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Price
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary.main">
                        ${course.price}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>

              {/* Rating */}
              {course.rating && (
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
                  <Rating value={course.rating} precision={0.1} readOnly />
                  <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                    {course.rating.toFixed(1)} ({course.enrollmentCount || 0} students)
                  </Typography>
                </Box>
              )}

              {/* Enrollment Actions */}
              <Box sx={{ mt: 4 }}>
                {!user ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/login')}
                    sx={{ mr: 2 }}
                  >
                    Login to Enroll
                  </Button>
                ) : user.role !== 'student' ? (
                  <Alert severity="info">
                    Only students can enroll in courses
                  </Alert>
                ) : enrollment ? (
                  <Box>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrow />}
                      sx={{ mr: 2 }}
                      onClick={() => navigate(`/courses/${course._id}/content`)}
                    >
                      Access Course Content
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setUnenrollDialogOpen(true)}
                    >
                      Unenroll
                    </Button>
                    
                    {/* Progress Info */}
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progress: {enrollment.progress}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setEnrollDialogOpen(true)}
                    disabled={enrolling}
                  >
                    {enrolling ? <CircularProgress size={24} /> : 'Enroll Now'}
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Course Content Overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              What You'll Learn
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <VideoLibrary color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Video Lectures" 
                  secondary="Comprehensive video content covering all course topics"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Assignment color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Practical Assignments" 
                  secondary="Hands-on exercises to reinforce your learning"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Quiz color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Quizzes & Tests" 
                  secondary="Regular assessments to track your progress"
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <EmojiEvents color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Certificate of Completion" 
                  secondary="Earn a certificate upon successful course completion"
                />
              </ListItem>
            </List>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Course Description
            </Typography>
            <Typography variant="body1" paragraph>
              {course.description}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Course Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Category: {course.category}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Level: {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Duration: {course.duration} hours
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  Students: {course.enrollmentCount || 0}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Instructor Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Instructor
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ width: 64, height: 64, mr: 2 }}>
                {getInstructorName(course.instructor).split(' ').map(n => n[0]).join('')}
              </Avatar>
              <Box>
                <Typography variant="h6">
                  {getInstructorName(course.instructor)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Course Instructor
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Experienced instructor with expertise in {course.category.toLowerCase()}.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Enrollment Confirmation Dialog */}
      <Dialog open={enrollDialogOpen} onClose={() => setEnrollDialogOpen(false)}>
        <DialogTitle>Enroll in Course</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to enroll in "{course.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Price: ${course.price}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnrollDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleEnroll} 
            variant="contained"
            disabled={enrolling}
          >
            {enrolling ? <CircularProgress size={20} /> : 'Enroll Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unenroll Confirmation Dialog */}
      <Dialog open={unenrollDialogOpen} onClose={() => setUnenrollDialogOpen(false)}>
        <DialogTitle>Unenroll from Course</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to unenroll from "{course.title}"?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You will lose access to all course materials and your progress will be saved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUnenrollDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUnenroll} 
            color="error"
            variant="contained"
            disabled={enrolling}
          >
            {enrolling ? <CircularProgress size={20} /> : 'Unenroll'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseDetailPage;

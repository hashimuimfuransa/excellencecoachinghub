import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserRole } from '../../shared/types';
import { isLearnerRole } from '../../utils/roleUtils';
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

      // Check enrollment status if user is logged in and is a learner role
      if (user && isLearnerRole(user.role as UserRole)) {
        const enrollmentData = await enrollmentService.getEnrollmentDetailsQuietly(id);
        setEnrollment(enrollmentData);
      } else {
        // User is not logged in or not eligible to enroll
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

  // Additional effect to refresh enrollment status when user changes
  useEffect(() => {
    const refreshEnrollmentStatus = async () => {
      if (user && id && isLearnerRole(user.role as UserRole)) {
        try {
          console.log('🔄 Refreshing enrollment status for course:', id);
          const enrollmentData = await enrollmentService.getEnrollmentDetailsQuietly(id);
          console.log('📊 Enrollment data:', enrollmentData);
          setEnrollment(enrollmentData);
        } catch (err) {
          console.log('❌ No enrollment found for course:', id);
          // Enrollment might not exist yet, that's okay
          setEnrollment(null);
        }
      } else {
        console.log('👤 User not logged in or not eligible, clearing enrollment');
        setEnrollment(null);
      }
    };

    refreshEnrollmentStatus();
  }, [user, id]);

  // Check for pending enrollment after login
  useEffect(() => {
    const checkPendingEnrollment = async () => {
      if (user && id && isLearnerRole(user.role as UserRole)) {
        const pendingCourseId = localStorage.getItem('pendingEnrollment');
        console.log('🔍 Checking pending enrollment:', { pendingCourseId, currentCourseId: id });
        
        if (pendingCourseId === id) {
          console.log('✅ Found pending enrollment for current course, proceeding with auto-enrollment');
          // Clear the pending enrollment
          localStorage.removeItem('pendingEnrollment');
          
          // Small delay to ensure user context is fully loaded
          setTimeout(async () => {
            try {
              console.log('🚀 Starting auto-enrollment for course:', id);
              setEnrolling(true);
              setError(null);
              
              const enrollmentData = await enrollmentService.enrollInCourse(id);
              console.log('✅ Auto-enrollment successful:', enrollmentData);
              setEnrollment(enrollmentData);
              setSuccess('Successfully enrolled in the course! Welcome to your learning journey!');
              
              // Force refresh the enrollment status
              const updatedEnrollmentData = await enrollmentService.getEnrollmentDetailsQuietly(id);
              console.log('🔄 Updated enrollment data:', updatedEnrollmentData);
              setEnrollment(updatedEnrollmentData);
              
              // Refresh the course details to get updated enrollment count
              await loadCourseDetails();
            } catch (err) {
              console.error('❌ Auto-enrollment failed:', err);
              setError(err instanceof Error ? err.message : 'Failed to auto-enroll in course');
            } finally {
              setEnrolling(false);
            }
          }, 500);
        }
      }
    };

    checkPendingEnrollment();
  }, [user, id]);

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
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
      {/* Modern Hero Section */}
      <Box
        sx={{
          position: 'relative',
          height: '60vh',
          minHeight: 500,
          background: course.thumbnail 
            ? `linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%), url(${course.thumbnail})`
            : `linear-gradient(135deg, ${getGradientColors(course.category)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s ease-in-out infinite',
            pointerEvents: 'none'
          },
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' }
          }
        }}
      >
        {/* Floating Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
              '50%': { transform: 'translateY(-30px) rotate(180deg)' }
            }
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '15%',
            left: '8%',
            width: 80,
            height: 80,
            borderRadius: 3,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            animation: 'float 8s ease-in-out infinite reverse',
            transform: 'rotate(45deg)'
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              {/* Back Button */}
              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/courses')}
                sx={{
                  mb: 4,
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.3)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderColor: 'rgba(255,255,255,0.5)'
                  }
                }}
                variant="outlined"
              >
                Back to Courses
              </Button>

              {/* Course Category and Level */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Chip
                  label={course.category}
                  sx={{
                    background: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                />
                <Chip
                  label={course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                  variant="outlined"
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(10px)'
                  }}
                />
                {enrollment && (
                  <Chip
                    label="Enrolled"
                    sx={{
                      background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                      color: 'white',
                      fontWeight: 'bold',
                      animation: 'pulse 2s infinite',
                      '@keyframes pulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.05)' },
                        '100%': { transform: 'scale(1)' }
                      }
                    }}
                  />
                )}
              </Box>

              {/* Course Title */}
              <Typography
                variant="h2"
                component="h1"
                gutterBottom
                sx={{
                  fontWeight: 900,
                  mb: 3,
                  textShadow: '0 4px 8px rgba(0,0,0,0.3)',
                  background: 'linear-gradient(45deg, #ffffff 0%, #f0f0f0 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2.5rem', md: '3.5rem' }
                }}
              >
                {course.title}
              </Typography>

              {/* Course Description */}
              <Typography
                variant="h5"
                sx={{
                  opacity: 0.95,
                  mb: 4,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  fontWeight: 400,
                  maxWidth: '80%',
                  lineHeight: 1.6
                }}
              >
                {course.description}
              </Typography>

              {/* Course Stats */}
              <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                      {course.duration}h
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Duration
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                      {course.enrollmentCount || 0}+
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Students
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                      {course.rating ? course.rating.toFixed(1) : '4.8'}★
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Rating
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                      {course.price > 0 ? `$${course.price}` : 'FREE'}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Price
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {!user ? (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => {
                      localStorage.setItem('pendingEnrollment', id || '');
                      navigate('/login');
                    }}
                    sx={{
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      px: 4,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    🚀 Login to Enroll
                  </Button>
                ) : user.role && !isLearnerRole(user.role as UserRole) ? (
                  <Alert severity="info" sx={{ maxWidth: 400 }}>
                    Only learner accounts can enroll in courses
                  </Alert>
                ) : enrollment ? (
                  <>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PlayArrow />}
                      onClick={() => navigate(`/courses/${course._id}/content`)}
                      sx={{
                        background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                        px: 4,
                        py: 2,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 3,
                        boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #45a049, #7cb342)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      🎯 Continue Learning
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setUnenrollDialogOpen(true)}
                      sx={{
                        borderColor: 'rgba(255,255,255,0.5)',
                        color: 'white',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          borderColor: 'rgba(255,255,255,0.7)'
                        }
                      }}
                    >
                      Unenroll
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => setEnrollDialogOpen(true)}
                    disabled={enrolling}
                    sx={{
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      px: 4,
                      py: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {enrolling ? <CircularProgress size={24} sx={{ color: 'white' }} /> : '🎓 Enroll Now'}
                  </Button>
                )}
              </Box>

              {/* Progress Info for Enrolled Users */}
              {enrollment && (
                <Box sx={{ mt: 3, p: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, backdropFilter: 'blur(10px)' }}>
                  <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
                    📊 Your Progress
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Progress
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                        {enrollment.progress?.totalProgress || 0}%
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Enrolled
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                        {new Date(enrollment.createdAt || new Date()).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={4}>
              {/* Course Icon/Thumbnail */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 200,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 4,
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                }}
              >
                {course.thumbnail ? (
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      borderRadius: '16px'
                    }}
                  />
                ) : (
                  <Typography sx={{ fontSize: '6rem' }}>
                    {getCourseIcon(course.category)}
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          <Alert 
            severity="success" 
            onClose={() => setSuccess(null)}
            sx={{ 
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(76, 175, 80, 0.2)'
            }}
          >
            {success}
          </Alert>
        </Container>
      )}
      {error && (
        <Container maxWidth="lg" sx={{ pt: 4 }}>
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ 
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(244, 67, 54, 0.2)'
            }}
          >
            {error}
          </Alert>
        </Container>
      )}

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={6}>

          {/* Course Content Overview */}
          <Grid item xs={12} md={8}>
            <Paper 
              sx={{ 
                p: 4, 
                mb: 4,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(20px)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3
                }}
              >
                🎯 What You'll Learn
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2, borderRadius: 3, backgroundColor: 'rgba(102, 126, 234, 0.05)' }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: 'rgba(102, 126, 234, 0.1)',
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <VideoLibrary sx={{ color: '#667eea', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        Video Lectures
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Comprehensive video content covering all course topics
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2, borderRadius: 3, backgroundColor: 'rgba(118, 75, 162, 0.05)' }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: 'rgba(118, 75, 162, 0.1)',
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Assignment sx={{ color: '#764ba2', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        Practical Assignments
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Hands-on exercises to reinforce your learning
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2, borderRadius: 3, backgroundColor: 'rgba(76, 175, 80, 0.05)' }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Quiz sx={{ color: '#4caf50', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        Quizzes & Tests
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Regular assessments to track your progress
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', p: 2, borderRadius: 3, backgroundColor: 'rgba(255, 193, 7, 0.05)' }}>
                    <Box sx={{ 
                      p: 2, 
                      borderRadius: 2, 
                      backgroundColor: 'rgba(255, 193, 7, 0.1)',
                      mr: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <EmojiEvents sx={{ color: '#ffc107', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        Certificate
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Earn a certificate upon successful completion
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>

            <Paper 
              sx={{ 
                p: 4,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(20px)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3
                }}
              >
                📚 Course Description
              </Typography>
              
              <Typography 
                variant="body1" 
                paragraph 
                sx={{ 
                  fontSize: '1.1rem',
                  lineHeight: 1.8,
                  color: 'text.primary',
                  mb: 4
                }}
              >
                {course.description}
              </Typography>
              
              <Divider sx={{ my: 4, borderColor: 'rgba(0,0,0,0.1)' }} />
              
              <Typography 
                variant="h5" 
                gutterBottom 
                sx={{ 
                  fontWeight: 600,
                  mb: 3,
                  color: 'text.primary'
                }}
              >
                📋 Course Details
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 3, borderRadius: 3, backgroundColor: 'rgba(102, 126, 234, 0.05)', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Category
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
                      {course.category}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 3, borderRadius: 3, backgroundColor: 'rgba(118, 75, 162, 0.05)', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Level
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#764ba2' }}>
                      {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 3, borderRadius: 3, backgroundColor: 'rgba(76, 175, 80, 0.05)', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Duration
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#4caf50' }}>
                      {course.duration} hours
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 3, borderRadius: 3, backgroundColor: 'rgba(255, 193, 7, 0.05)', textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Students
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ffc107' }}>
                      {course.enrollmentCount || 0}+
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Instructor Info */}
          <Grid item xs={12} md={4}>
            <Paper 
              sx={{ 
                p: 4,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(20px)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Typography 
                variant="h4" 
                gutterBottom 
                sx={{ 
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 3
                }}
              >
                👨‍🏫 Instructor
              </Typography>
              
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    mx: 'auto', 
                    mb: 2,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    fontSize: '2rem',
                    fontWeight: 'bold'
                  }}
                >
                  {getInstructorName(course.instructor).split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  {getInstructorName(course.instructor)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Course Instructor
                </Typography>
                <Chip
                  label={`${course.category} Expert`}
                  sx={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              </Box>
              
              <Typography 
                variant="body1" 
                color="text.secondary" 
                sx={{ 
                  textAlign: 'center',
                  lineHeight: 1.6,
                  fontStyle: 'italic'
                }}
              >
                Experienced instructor with expertise in {course.category.toLowerCase()}. 
                Dedicated to providing high-quality education and helping students achieve their learning goals.
              </Typography>
              
              <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(102, 126, 234, 0.05)', borderRadius: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  💡 <strong>Teaching Philosophy:</strong> Learning through practical application and real-world examples
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Learning Journey Section */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 6,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s ease-in-out infinite',
                  pointerEvents: 'none'
                },
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '-200% 0' },
                  '100%': { backgroundPosition: '200% 0' }
                }
              }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  textAlign: 'center', 
                  fontWeight: 800, 
                  mb: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                🚀 Your Learning Journey
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  textAlign: 'center', 
                  mb: 6, 
                  opacity: 0.9,
                  maxWidth: 800,
                  mx: 'auto'
                }}
              >
                Experience a comprehensive learning ecosystem designed to maximize your success
              </Typography>

              <Grid container spacing={4}>
                {/* Live Sessions */}
                <Grid item xs={12} md={6} lg={4}>
                  <Box 
                    sx={{ 
                      p: 4, 
                      borderRadius: 4, 
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        background: 'rgba(255,255,255,0.15)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)'
                      }}>
                        <Typography sx={{ fontSize: '2rem' }}>📹</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Live Sessions
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, textAlign: 'center' }}>
                      Interactive live classes with real-time Q&A, screen sharing, and collaborative learning
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Weekly Sessions</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>3x per week</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Duration</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>90 minutes</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Recordings</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>Available</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Video Content */}
                <Grid item xs={12} md={6} lg={4}>
                  <Box 
                    sx={{ 
                      p: 4, 
                      borderRadius: 4, 
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        background: 'rgba(255,255,255,0.15)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(45deg, #4ecdc4, #44a08d)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)'
                      }}>
                        <Typography sx={{ fontSize: '2rem' }}>🎥</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Video Library
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, textAlign: 'center' }}>
                      Comprehensive video content with HD quality, subtitles, and interactive transcripts
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Total Videos</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>50+ hours</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Quality</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>4K HD</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Offline Access</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>Yes</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* AI Assistant */}
                <Grid item xs={12} md={6} lg={4}>
                  <Box 
                    sx={{ 
                      p: 4, 
                      borderRadius: 4, 
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        background: 'rgba(255,255,255,0.15)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                      }}>
                        <Typography sx={{ fontSize: '2rem' }}>🤖</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        AI Assistant
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, textAlign: 'center' }}>
                      Personalized AI tutor available 24/7 for instant help, explanations, and learning guidance
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Availability</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>24/7</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Languages</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>50+</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Response Time</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>&lt; 2s</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Learning Materials */}
                <Grid item xs={12} md={6} lg={4}>
                  <Box 
                    sx={{ 
                      p: 4, 
                      borderRadius: 4, 
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        background: 'rgba(255,255,255,0.15)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(45deg, #f093fb, #f5576c)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: '0 8px 32px rgba(240, 147, 251, 0.3)'
                      }}>
                        <Typography sx={{ fontSize: '2rem' }}>📚</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Learning Materials
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, textAlign: 'center' }}>
                      Comprehensive study materials including PDFs, slides, code examples, and reference guides
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">PDFs & Slides</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>100+</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Code Examples</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>50+</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Downloadable</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>Yes</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Interactive Tools */}
                <Grid item xs={12} md={6} lg={4}>
                  <Box 
                    sx={{ 
                      p: 4, 
                      borderRadius: 4, 
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        background: 'rgba(255,255,255,0.15)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: '0 8px 32px rgba(79, 172, 254, 0.3)'
                      }}>
                        <Typography sx={{ fontSize: '2rem' }}>🛠️</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Interactive Tools
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, textAlign: 'center' }}>
                      Hands-on coding environments, simulators, and interactive exercises for practical learning
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Coding Labs</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>20+</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Simulators</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>10+</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Cloud Access</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>Yes</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>

                {/* Community & Support */}
                <Grid item xs={12} md={6} lg={4}>
                  <Box 
                    sx={{ 
                      p: 4, 
                      borderRadius: 4, 
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        background: 'rgba(255,255,255,0.15)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box sx={{ 
                        width: 80, 
                        height: 80, 
                        borderRadius: '50%', 
                        background: 'linear-gradient(45deg, #43e97b, #38f9d7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: '0 8px 32px rgba(67, 233, 123, 0.3)'
                      }}>
                        <Typography sx={{ fontSize: '2rem' }}>👥</Typography>
                      </Box>
                      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Community & Support
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 3, opacity: 0.9, textAlign: 'center' }}>
                      Connect with peers, get expert support, and participate in study groups and forums
                    </Typography>
                    <Box sx={{ mt: 'auto' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Study Groups</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>Active</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Expert Support</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>24/7</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Peer Network</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#4caf50' }}>1000+</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Learning Path & Progress Tracking */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 6,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  textAlign: 'center', 
                  fontWeight: 700, 
                  mb: 2,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                📈 Learning Analytics & Progress
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  textAlign: 'center', 
                  mb: 6, 
                  color: 'text.secondary',
                  maxWidth: 600,
                  mx: 'auto'
                }}
              >
                Track your learning journey with detailed analytics and personalized insights
              </Typography>

              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ 
                      width: 100, 
                      height: 100, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                    }}>
                      <Typography sx={{ fontSize: '2.5rem' }}>📊</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      Real-time Analytics
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Monitor your progress with detailed analytics including time spent, completion rates, and performance metrics
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ 
                      width: 100, 
                      height: 100, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)'
                    }}>
                      <Typography sx={{ fontSize: '2.5rem' }}>🎯</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      Personalized Goals
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Set and track personalized learning goals with AI-powered recommendations and milestone celebrations
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ 
                      width: 100, 
                      height: 100, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #ff9800, #ff5722)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 32px rgba(255, 152, 0, 0.3)'
                    }}>
                      <Typography sx={{ fontSize: '2.5rem' }}>🏆</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      Achievements & Badges
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Earn badges and achievements as you complete modules, maintain streaks, and demonstrate mastery
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* YouTube Video Section */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 6,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.1) 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 3s ease-in-out infinite',
                  pointerEvents: 'none'
                },
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '-200% 0' },
                  '100%': { backgroundPosition: '200% 0' }
                }
              }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  textAlign: 'center', 
                  fontWeight: 800, 
                  mb: 2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                🎬 Discover Excellence Coaching Hub
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  textAlign: 'center', 
                  mb: 6, 
                  opacity: 0.9,
                  maxWidth: 800,
                  mx: 'auto'
                }}
              >
                Watch our comprehensive overview video to understand how we deliver world-class education
              </Typography>

              <Grid container spacing={6} alignItems="center">
                <Grid item xs={12} lg={8}>
                  <Box 
                    sx={{ 
                      position: 'relative',
                      borderRadius: 4,
                      overflow: 'hidden',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                      '&:hover': {
                        transform: 'scale(1.02)',
                        boxShadow: '0 25px 80px rgba(0,0,0,0.4)'
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <Box
                      sx={{
                        position: 'relative',
                        width: '100%',
                        height: 0,
                        paddingBottom: '56.25%', // 16:9 aspect ratio
                        background: 'linear-gradient(45deg, #1e3c72, #2a5298)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {/* YouTube Video Embed */}
                      <iframe
                        width="100%"
                        height="100%"
                        src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&showinfo=0"
                        title="Excellence Coaching Hub - How We Deliver World-Class Education"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          borderRadius: '16px'
                        }}
                      />
                    </Box>
                    
                    {/* Play Button Overlay (for visual appeal) */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0.8,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          opacity: 1,
                          transform: 'translate(-50%, -50%) scale(1.1)'
                        }
                      }}
                    >
                      <Typography sx={{ fontSize: '2rem', color: '#1e3c72' }}>▶️</Typography>
                    </Box>
                  </Box>
                </Grid>

                <Grid item xs={12} lg={4}>
                  <Box sx={{ pl: { xs: 0, lg: 4 } }}>
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 3,
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}
                    >
                      Why Choose Excellence Coaching Hub?
                    </Typography>
                    
                    <Box sx={{ mb: 4 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%', 
                          background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 3,
                          boxShadow: '0 4px 20px rgba(255, 107, 107, 0.3)'
                        }}>
                          <Typography sx={{ fontSize: '1.5rem' }}>🎓</Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            Expert Instructors
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Learn from industry professionals with years of experience
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%', 
                          background: 'linear-gradient(45deg, #4ecdc4, #44a08d)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 3,
                          boxShadow: '0 4px 20px rgba(78, 205, 196, 0.3)'
                        }}>
                          <Typography sx={{ fontSize: '1.5rem' }}>🚀</Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            Modern Learning
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Cutting-edge technology and interactive learning methods
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%', 
                          background: 'linear-gradient(45deg, #667eea, #764ba2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 3,
                          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                        }}>
                          <Typography sx={{ fontSize: '1.5rem' }}>🏆</Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            Proven Results
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Thousands of successful graduates and career transformations
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 50, 
                          height: 50, 
                          borderRadius: '50%', 
                          background: 'linear-gradient(45deg, #43e97b, #38f9d7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 3,
                          boxShadow: '0 4px 20px rgba(67, 233, 123, 0.3)'
                        }}>
                          <Typography sx={{ fontSize: '1.5rem' }}>💡</Typography>
                        </Box>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            Personalized Support
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Individual attention and customized learning paths
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ 
                      p: 3, 
                      backgroundColor: 'rgba(255,255,255,0.1)', 
                      borderRadius: 3, 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, textAlign: 'center' }}>
                        📊 Our Success Metrics
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                              95%
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              Success Rate
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                              10K+
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              Graduates
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Additional Video Features */}
          <Grid item xs={12}>
            <Paper 
              sx={{ 
                p: 6,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  textAlign: 'center', 
                  fontWeight: 700, 
                  mb: 2,
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                🎥 Video Learning Experience
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  textAlign: 'center', 
                  mb: 6, 
                  color: 'text.secondary',
                  maxWidth: 600,
                  mx: 'auto'
                }}
              >
                Experience our comprehensive video-based learning platform
              </Typography>

              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 32px rgba(255, 107, 107, 0.3)'
                    }}>
                      <Typography sx={{ fontSize: '2rem' }}>📺</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      HD Video Quality
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Crystal clear 4K video content with professional production quality for the best learning experience
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)'
                    }}>
                      <Typography sx={{ fontSize: '2rem' }}>📝</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      Interactive Transcripts
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Clickable transcripts with search functionality and synchronized playback for enhanced learning
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center', p: 3 }}>
                    <Box sx={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%', 
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                    }}>
                      <Typography sx={{ fontSize: '2rem' }}>📱</Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
                      Mobile Optimized
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Watch videos on any device with adaptive streaming and offline download capabilities
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Enrollment Confirmation Dialog */}
      <Dialog 
        open={enrollDialogOpen} 
        onClose={() => setEnrollDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontSize: '1.5rem', 
          fontWeight: 700,
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          py: 3
        }}>
          🎓 Enroll in Course
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
            Are you sure you want to enroll in
          </Typography>
          <Typography variant="h5" sx={{ 
            textAlign: 'center', 
            fontWeight: 600,
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 3
          }}>
            "{course.title}"?
          </Typography>
          <Box sx={{ 
            p: 3, 
            backgroundColor: 'rgba(102, 126, 234, 0.05)', 
            borderRadius: 3, 
            textAlign: 'center',
            border: '1px solid rgba(102, 126, 234, 0.1)'
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#667eea' }}>
              Course Price: {course.price > 0 ? `$${course.price}` : 'FREE'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
          <Button 
            onClick={() => setEnrollDialogOpen(false)}
            variant="outlined"
            sx={{ 
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEnroll} 
            variant="contained"
            disabled={enrolling}
            sx={{
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              '&:hover': {
                background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {enrolling ? <CircularProgress size={20} sx={{ color: 'white' }} /> : '🎓 Enroll Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unenroll Confirmation Dialog */}
      <Dialog 
        open={unenrollDialogOpen} 
        onClose={() => setUnenrollDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)'
          }
        }}
      >
        <DialogTitle sx={{ 
          textAlign: 'center', 
          fontSize: '1.5rem', 
          fontWeight: 700,
          color: '#f44336',
          py: 3
        }}>
          ⚠️ Unenroll from Course
        </DialogTitle>
        <DialogContent sx={{ px: 4, pb: 2 }}>
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
            Are you sure you want to unenroll from
          </Typography>
          <Typography variant="h5" sx={{ 
            textAlign: 'center', 
            fontWeight: 600,
            color: '#f44336',
            mb: 3
          }}>
            "{course.title}"?
          </Typography>
          <Box sx={{ 
            p: 3, 
            backgroundColor: 'rgba(244, 67, 54, 0.05)', 
            borderRadius: 3, 
            textAlign: 'center',
            border: '1px solid rgba(244, 67, 54, 0.1)'
          }}>
            <Typography variant="body1" color="text.secondary">
              You will lose access to all course materials and your progress will be saved.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 4, pb: 4, gap: 2 }}>
          <Button 
            onClick={() => setUnenrollDialogOpen(false)}
            variant="outlined"
            sx={{ 
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleUnenroll} 
            color="error"
            variant="contained"
            disabled={enrolling}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              fontWeight: 600,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(244, 67, 54, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {enrolling ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Unenroll'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseDetailPage;

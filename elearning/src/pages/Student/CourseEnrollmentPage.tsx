import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Avatar,
  Paper,
  Stack,
  useTheme,
  useMediaQuery,
  styled,
  Fab,
  Zoom
} from '@mui/material';
import {
  School,
  Person,
  People,
  Star,
  Search,
  FilterList,
  TrendingUp,
  EmojiEvents,
  AutoAwesome,
  Lightbulb,
  Psychology,
  Diamond,
  LocalFireDepartment,
  Celebration,
  ArrowBack,
  Dashboard,
  AccessTime
} from '@mui/icons-material';
import { courseService, ICourse } from '../../services/courseService';
import { enrollmentService } from '../../services/enrollmentService';
import { useAuth } from '../../hooks/useAuth';
import { getCourseImageUrl } from '../../utils/courseImageGenerator';

// Styled components for enhanced UI
const GradientBackground = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
  minHeight: '100vh',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '300px',
    background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    zIndex: -1,
  }
}));

const FloatingCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 30px 60px rgba(0,0,0,0.15)',
  }
}));

const CourseCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  }
}));

const WelcomeCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(3),
  background: `linear-gradient(135deg, ${theme.palette.primary.main}10, ${theme.palette.secondary.main}10)`,
  border: `2px solid ${theme.palette.primary.main}20`,
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 100,
    height: 100,
    background: `linear-gradient(45deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
    borderRadius: '50%',
  }
}));

const CourseEnrollmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Load available courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const coursesResponse = await courseService.getPublicCourses({
          search: searchTerm,
          category: categoryFilter,
          limit: 20
        });
        setCourses(coursesResponse.courses);
      } catch (err: any) {
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [searchTerm, categoryFilter]);

  const handleEnroll = async (courseId: string) => {
    try {
      setEnrolling(courseId);
      await enrollmentService.enrollInCourse(courseId);
      
      // Show celebration
      setShowCelebration(true);
      setTimeout(() => {
        setShowCelebration(false);
        navigate(`/course/${courseId}`);
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to enroll in course');
      setEnrolling(null);
    }
  };

  return (
    <GradientBackground>
      {/* Celebration Animation */}
      <Zoom in={showCelebration}>
        <Box sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          textAlign: 'center'
        }}>
          <Celebration sx={{ fontSize: 100, color: '#FFD700', mb: 2 }} />
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            🎉 Welcome to Your Learning Journey! 🎉
          </Typography>
          <Typography variant="h6" sx={{ color: 'white', mt: 1 }}>
            Redirecting to your course...
          </Typography>
        </Box>
      </Zoom>

      <Container maxWidth="lg" sx={{ pt: 4, pb: 4 }}>
        {/* Modern Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            component="h1"
            gutterBottom
            sx={{ 
              fontWeight: 800, 
              color: 'white',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 50%, #bbdefb 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              mb: 3
            }}
          >
            🎓 Explore Our Courses
          </Typography>
          
          <Typography
            variant="h5"
            sx={{ 
              color: 'rgba(255,255,255,0.9)', 
              maxWidth: 700, 
              mx: 'auto', 
              mb: 4,
              lineHeight: 1.6,
              fontWeight: 400
            }}
          >
            Discover thousands of courses taught by expert instructors
          </Typography>
          
          {/* Stats Row */}
          <Grid container spacing={4} justifyContent="center" sx={{ mt: 4 }}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                  {courses.length}+
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Courses
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                  50K+
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Students
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                  4.8★
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Rating
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'white' }}>
                  24/7
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Support
          </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Search and Filter */}
        <FloatingCard sx={{ mb: 4, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3, textAlign: 'center' }}>
              🔍 Find Your Perfect Course
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  placeholder="Search for courses, topics, or skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    label="Category"
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    sx={{
                      borderRadius: 3,
                    }}
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    <MenuItem value="Professional Coaching">💼 Professional Coaching</MenuItem>
                    <MenuItem value="Business & Entrepreneurship">🚀 Business & Entrepreneurship</MenuItem>
                    <MenuItem value="Academic Coaching">🎓 Academic Coaching</MenuItem>
                    <MenuItem value="Language Coaching">🌍 Language Coaching</MenuItem>
                    <MenuItem value="Technical & Digital">💻 Technical & Digital</MenuItem>
                    <MenuItem value="Job Seeker Coaching">💼 Job Seeker Coaching</MenuItem>
                    <MenuItem value="Personal & Corporate Development">🌟 Personal & Corporate Development</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </FloatingCard>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ ml: 2 }}>
              Loading amazing courses for you...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Course Grid */}
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'white', mb: 4, textAlign: 'center' }}>
              ✨ Available Courses ({courses.length})
            </Typography>

            <Grid container spacing={3}>
              {courses.map((course) => (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <CourseCard
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 3,
                      overflow: 'hidden',
                      background: 'white',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(0,0,0,0.05)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                        '& .course-image': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                  >
                    <CardMedia
                      component="div"
                      className="course-image"
                      sx={{
                        height: 200,
                        background: course.thumbnail 
                          ? `url(${course.thumbnail})` 
                          : `linear-gradient(135deg, ${
                              course.category.toLowerCase().includes('programming') || course.category.toLowerCase().includes('web') 
                                ? '#667eea 0%, #764ba2 100%' 
                                : course.category.toLowerCase().includes('data') || course.category.toLowerCase().includes('science')
                                ? '#f093fb 0%, #f5576c 100%' 
                                : '#4facfe 0%, #00f2fe 100%'
                            })`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '3rem',
                        position: 'relative',
                        transition: 'transform 0.4s ease',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: course.thumbnail 
                            ? 'linear-gradient(45deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))'
                            : 'linear-gradient(45deg, rgba(0,0,0,0.2), rgba(0,0,0,0.1))',
                          zIndex: 1
                        }
                      }}
                    >
                      <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                        {!course.thumbnail && (
                          <Box sx={{ fontSize: '4rem', mb: 1 }}>
                            {course.category.toLowerCase().includes('programming') || course.category.toLowerCase().includes('web') 
                              ? '💻' 
                              : course.category.toLowerCase().includes('data') || course.category.toLowerCase().includes('science')
                              ? '📊' 
                              : '📚'}
                          </Box>
                        )}
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700, 
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            fontSize: course.thumbnail ? '1.2rem' : '1rem'
                          }}
                        >
                          {course.thumbnail ? 'View Course' : course.category}
                        </Typography>
                      </Box>
                    </CardMedia>
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      {/* Category and Level Chips */}
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip 
                          label={course.category} 
                          size="small" 
                          sx={{ 
                            background: `linear-gradient(45deg, ${
                              course.category.toLowerCase().includes('programming') || course.category.toLowerCase().includes('web') 
                                ? '#667eea, #764ba2' 
                                : course.category.toLowerCase().includes('data') || course.category.toLowerCase().includes('science')
                                ? '#f093fb, #f5576c' 
                                : '#4facfe, #00f2fe'
                            })`,
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}
                        />
                        <Chip 
                          label={course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                          size="small" 
                          variant="outlined"
                          sx={{ 
                            borderColor: course.level === 'beginner' ? '#4caf50' : 
                                       course.level === 'intermediate' ? '#ff9800' : '#f44336',
                            color: course.level === 'beginner' ? '#4caf50' : 
                                   course.level === 'intermediate' ? '#ff9800' : '#f44336',
                            fontWeight: 600
                          }}
                        />
                      </Stack>

                      {/* Course Title */}
                      <Typography
                        variant="h6"
                        component="h3"
                        gutterBottom
                        sx={{ 
                          fontWeight: 700, 
                          lineHeight: 1.3,
                          mb: 2,
                          color: 'text.primary',
                          fontSize: '1.1rem'
                        }}
                      >
                        {course.title}
                      </Typography>

                      {/* Course Description */}
                      <Typography
                        variant="body2"
                        sx={{ 
                          color: 'text.secondary', 
                          mb: 3, 
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.9rem'
                        }}
                      >
                        {course.description}
                      </Typography>

                      {/* Instructor Info */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            width: 36, 
                            height: 36, 
                            mr: 1.5,
                            background: `linear-gradient(45deg, ${
                              course.category.toLowerCase().includes('programming') || course.category.toLowerCase().includes('web') 
                                ? '#667eea, #764ba2' 
                                : course.category.toLowerCase().includes('data') || course.category.toLowerCase().includes('science')
                                ? '#f093fb, #f5576c' 
                                : '#4facfe, #00f2fe'
                            })`,
                            fontSize: '0.9rem',
                            fontWeight: 600
                          }}
                        >
                          {course.instructor?.firstName && course.instructor?.lastName
                            ? `${course.instructor.firstName[0]}${course.instructor.lastName[0]}`
                            : 'IN'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                            Instructor
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {course.instructor?.firstName && course.instructor?.lastName
                              ? `${course.instructor.firstName} ${course.instructor.lastName}`
                              : 'Expert Instructor'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Rating and Students */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                          <Star sx={{ color: '#ffc107', fontSize: '1.1rem', mr: 0.5 }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            {course.rating ? course.rating.toFixed(1) : 'New'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <People sx={{ color: 'text.secondary', fontSize: '1.1rem', mr: 0.5 }} />
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {course.enrollmentCount || 0}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Price and Duration */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        pt: 2,
                        borderTop: '1px solid rgba(0,0,0,0.05)',
                        mb: 3
                      }}>
                        <Box>
                          {course.price > 0 ? (
                            <Typography
                              variant="h6"
                              sx={{ 
                                fontWeight: 700, 
                                color: 'primary.main',
                                fontSize: '1.3rem'
                              }}
                            >
                          ${course.price}
                        </Typography>
                          ) : (
                            <Chip
                              label="FREE"
                              sx={{ 
                                background: 'linear-gradient(45deg, #4caf50, #8bc34a)',
                                color: 'white',
                                fontWeight: 700,
                                fontSize: '0.9rem'
                              }}
                            />
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <AccessTime sx={{ color: 'text.secondary', fontSize: '1.1rem', mr: 0.5 }} />
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                            {course.duration}h
                          </Typography>
                        </Box>
                      </Box>

                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course._id}`);
                          }}
                          sx={{
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: 600,
                            borderColor: theme.palette.primary.main,
                            color: theme.palette.primary.main,
                            flex: 1,
                            '&:hover': {
                              borderColor: theme.palette.primary.dark,
                              backgroundColor: theme.palette.primary.main,
                              color: 'white',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          👁️ View Details
                        </Button>
                      <Button
                        variant="contained"
                        size="large"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnroll(course._id);
                          }}
                        disabled={enrolling === course._id}
                        sx={{
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: 600,
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                            flex: 1,
                          '&:hover': {
                            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                            },
                            transition: 'all 0.3s ease'
                        }}
                      >
                        {enrolling === course._id ? (
                          <>
                            <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            🚀 Enroll Now
                          </>
                        )}
                      </Button>
                      </Stack>
                    </CardContent>
                  </CourseCard>
                </Grid>
              ))}
            </Grid>

            {courses.length === 0 && !loading && (
              <Box textAlign="center" py={8}>
                <School sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  No courses found
                </Typography>
                <Typography variant="body1" color="text.secondary" mb={3}>
                  Try adjusting your search criteria or browse all categories
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            )}
          </>
        )}

        {/* Floating Action Button */}
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
          <Fab 
            color="primary" 
            onClick={() => navigate('/dashboard')}
            size="large"
          >
            <Dashboard />
          </Fab>
        </Box>
      </Container>
    </GradientBackground>
  );
};

export default CourseEnrollmentPage;
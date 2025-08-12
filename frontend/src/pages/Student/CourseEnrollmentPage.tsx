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
  Dashboard
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
        {/* Welcome Header */}
        <WelcomeCard sx={{ mb: 4, bgcolor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
          <Avatar
            sx={{ 
              width: 100, 
              height: 100, 
              bgcolor: 'primary.main',
              mx: 'auto',
              mb: 3,
              boxShadow: 3
            }}
          >
            <School sx={{ fontSize: 50 }} />
          </Avatar>
          
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
            🚀 Welcome to Excellence Coaching Hub!
          </Typography>
          
          <Typography variant="h5" color="text.secondary" paragraph>
            Hello {user?.firstName}! Ready to start your learning adventure?
          </Typography>
          
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', maxWidth: '600px', mx: 'auto' }}>
            You haven't enrolled in any courses yet. Choose from our amazing selection of courses 
            designed to help you achieve your goals and unlock your potential!
          </Typography>

          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Chip 
              icon={<EmojiEvents />} 
              label="Interactive Learning" 
              color="primary" 
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              icon={<Psychology />} 
              label="AI-Powered Quizzes" 
              color="secondary" 
              sx={{ fontWeight: 600 }}
            />
            <Chip 
              icon={<Diamond />} 
              label="Expert Instructors" 
              color="info" 
              sx={{ fontWeight: 600 }}
            />
          </Stack>
        </WelcomeCard>

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
                    <MenuItem value="Programming">💻 Programming</MenuItem>
                    <MenuItem value="Design">🎨 Design</MenuItem>
                    <MenuItem value="Business">💼 Business</MenuItem>
                    <MenuItem value="Marketing">📈 Marketing</MenuItem>
                    <MenuItem value="Data Science">📊 Data Science</MenuItem>
                    <MenuItem value="Languages">🌍 Languages</MenuItem>
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
                  <CourseCard>
                    <CardMedia
                      component="img"
                      height="200"
                      image={getCourseImageUrl(course)}
                      alt={course.title}
                      sx={{ borderRadius: '16px 16px 0 0' }}
                    />
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, minHeight: '48px' }}>
                        {course.title}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'secondary.main' }}>
                          <Person sx={{ fontSize: 18 }} />
                        </Avatar>
                        <Typography variant="body2" color="text.secondary">
                          {course.instructor?.firstName} {course.instructor?.lastName}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mb: 2, minHeight: '40px' }}>
                        {course.description?.substring(0, 100)}...
                      </Typography>

                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Chip 
                          label={course.category} 
                          size="small" 
                          color="primary"
                          icon={<School />}
                        />
                        <Chip 
                          label={course.level} 
                          size="small" 
                          color="secondary"
                          icon={<TrendingUp />}
                        />
                      </Stack>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                          ${course.price}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Star sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                          <Typography variant="body2">4.8</Typography>
                        </Box>
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => handleEnroll(course._id)}
                        disabled={enrolling === course._id}
                        sx={{
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: 600,
                          background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                          '&:hover': {
                            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                          }
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
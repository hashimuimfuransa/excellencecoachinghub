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
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Stack,
  Tooltip,
  Badge,
  Fade,
  Zoom,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  School,
  PlayArrow,
  Person,
  Schedule,
  Star,
  Search,
  FilterList,
  BookmarkBorder,
  Bookmark,
  TrendingUp,
  EmojiEvents,
  AccessTime,
  Group,
  CheckCircle,
  PlayCircleOutline,
  MenuBook,
  Lightbulb,
  AutoStories,
  Psychology,
  Explore,
  LocalLibrary
} from '@mui/icons-material';
import { courseService, ICourse } from '../../services/courseService';
import { enrollmentService, IEnrollment } from '../../services/enrollmentService';
import { useAuth } from '../../hooks/useAuth';
import { getCourseImageUrl } from '../../utils/courseImageGenerator';
import LearningTips from '../../components/Student/LearningTips';
import HelpButton from '../../components/Student/HelpButton';
import { studentProfileService } from '../../services/studentProfileService';
import { UserRole } from '../../shared/types';

// Styled Components for better visual appeal
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.15)}`,
    borderColor: theme.palette.primary.main,
  },
}));

const ProgressCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}08, ${theme.palette.secondary.main}08)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  borderRadius: theme.spacing(2),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const WelcomeCard = styled(Paper)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(3),
  padding: theme.spacing(4),
  marginBottom: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '200px',
    height: '200px',
    background: `radial-gradient(circle, ${alpha(theme.palette.common.white, 0.1)} 0%, transparent 70%)`,
    borderRadius: '50%',
    transform: 'translate(50%, -50%)',
  },
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  fontWeight: 600,
  textTransform: 'capitalize',
  '&.MuiChip-filled': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
    color: theme.palette.primary.contrastText,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.3)}`,
  '&:hover': {
    boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
    transform: 'translateY(-2px)',
  },
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`courses-tabpanel-${index}`}
      aria-labelledby={`courses-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const StudentCourses: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  // State management
  const [tabValue, setTabValue] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState<ICourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<ICourse[]>([]);
  const [enrollments, setEnrollments] = useState<IEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);

  // Profile completion state
  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 0,
    missingFields: [] as string[],
    isComplete: false
  });
  const [showProfileAlert, setShowProfileAlert] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Load courses
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      if (tabValue === 0) {
        // Load enrolled courses
        const [coursesResponse, enrollmentsResponse] = await Promise.all([
          courseService.getEnrolledCourses(),
          enrollmentService.getMyEnrollments()
        ]);
        setEnrolledCourses(coursesResponse.courses);
        setEnrollments(enrollmentsResponse.enrollments);
      } else {
        // Load available courses and enrollments
        const [coursesResponse, enrollmentsResponse] = await Promise.allSettled([
          courseService.getPublicCourses({
            search: searchTerm,
            category: categoryFilter,
            limit: 20
          }),
          enrollmentService.getMyEnrollments()
        ]);
        
        if (coursesResponse.status === 'fulfilled') {
          setAvailableCourses(coursesResponse.value.courses);
        }
        if (enrollmentsResponse.status === 'fulfilled') {
          setEnrollments(enrollmentsResponse.value.enrollments);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Load student profile completion status
  const loadProfileCompletion = async () => {
    if (user?.role === UserRole.STUDENT) {
      try {
        setProfileLoading(true);
        const response = await studentProfileService.getMyProfile();
        setProfileCompletion({
          percentage: response.completionPercentage,
          missingFields: response.missingFields,
          isComplete: response.completionPercentage === 100
        });
      } catch (error) {
        console.error('Failed to load student profile:', error);
        // Profile might not exist yet, that's okay
      } finally {
        setProfileLoading(false);
      }
    }
  };

  // Load courses when tab changes or filters change
  useEffect(() => {
    loadCourses();
  }, [tabValue, searchTerm, categoryFilter]);

  // Load profile completion on component mount
  useEffect(() => {
    loadProfileCompletion();
  }, [user]);

  // Listen for profile update events to refresh completion status
  useEffect(() => {
    const handleProfileUpdate = () => {
      loadProfileCompletion();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEnroll = async (courseId: string) => {
    // Check if already enrolled
    const isAlreadyEnrolled = enrollments.some(e => e.course?._id === courseId || e.course === courseId);
    if (isAlreadyEnrolled) {
      setError('You are already enrolled in this course');
      return;
    }

    try {
      setLoading(true);
      await enrollmentService.enrollInCourse(courseId);
      // Refresh courses to update enrollment status
      await loadCourses();
      // Show success message
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

  const getEnrollmentProgress = (courseId: string) => {
    const enrollment = enrollments.find(e => e.course?._id === courseId);
    return enrollment?.progress || 0;
  };

  // Helper function to get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'primary';
  };

  // Helper function to get level color
  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'primary';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Profile Completion Alert for Students */}
      {user?.role === UserRole.STUDENT && !profileCompletion.isComplete && showProfileAlert && (
        <Fade in={showProfileAlert}>
          <Paper
            elevation={2}
            sx={{
              mb: 4,
              p: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Person sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Complete Your Profile
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => setShowProfileAlert(false)}
                sx={{ color: 'white' }}
              >
                ✕
              </IconButton>
            </Box>
            
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.9 }}>
              Complete your profile to get personalized course recommendations and better learning experience.
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Profile Completion
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {profileCompletion.percentage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={profileCompletion.percentage}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: 'white'
                  }
                }}
              />
            </Box>
            
            {profileCompletion.missingFields.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                  Missing fields: {profileCompletion.missingFields.slice(0, 3).join(', ')}
                  {profileCompletion.missingFields.length > 3 && ` and ${profileCompletion.missingFields.length - 3} more`}
                </Typography>
              </Box>
            )}
            
            <ActionButton
              variant="contained"
              onClick={() => {
                // Open profile modal directly
                window.dispatchEvent(new CustomEvent('openProfileModal'));
              }}
              sx={{
                backgroundColor: 'white',
                color: '#667eea',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)'
                }
              }}
            >
              Complete Profile
            </ActionButton>
          </Paper>
        </Fade>
      )}

      {/* Welcome Card */}
      {showWelcome && (
        <Fade in={showWelcome}>
          <WelcomeCard elevation={0}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box sx={{ zIndex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                  🎓 Welcome to Your Learning Hub!
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  Hi {user?.firstName}! Ready to continue your learning journey?
                </Typography>
                <Stack direction="row" spacing={2}>
                  <ActionButton 
                    variant="contained" 
                    sx={{ 
                      bgcolor: 'white', 
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'grey.100' }
                    }}
                    startIcon={<PlayCircleOutline />}
                    onClick={() => setTabValue(0)}
                  >
                    Continue Learning
                  </ActionButton>
                  <ActionButton 
                    variant="outlined" 
                    sx={{ 
                      borderColor: 'white', 
                      color: 'white',
                      '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.1) }
                    }}
                    startIcon={<Explore />}
                    onClick={() => setTabValue(1)}
                  >
                    Discover New Courses
                  </ActionButton>
                </Stack>
              </Box>
              <IconButton 
                onClick={() => setShowWelcome(false)}
                sx={{ color: 'white', opacity: 0.7 }}
              >
                ✕
              </IconButton>
            </Stack>
          </WelcomeCard>
        </Fade>
      )}

      {/* Quick Stats */}
      {enrolledCourses.length > 0 && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <ProgressCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length || 0)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Progress
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <ProgressCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <EmojiEvents sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                  {enrollments.filter(e => (e.progress || 0) >= 100).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Courses
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>
          <Grid item xs={12} sm={4}>
            <ProgressCard>
              <CardContent sx={{ textAlign: 'center' }}>
                <LocalLibrary sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {enrolledCourses.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Courses
                </Typography>
              </CardContent>
            </ProgressCard>
          </Grid>
        </Grid>
      )}

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontSize: '1.1rem',
              fontWeight: 600,
              py: 2,
            },
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: 2,
            },
          }}
        >
          <Tab 
            icon={<MenuBook />} 
            iconPosition="start"
            label="📚 My Learning" 
            sx={{ 
              '&.Mui-selected': { 
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          />
          <Tab 
            icon={<Explore />} 
            iconPosition="start"
            label="🔍 Discover Courses" 
            sx={{ 
              '&.Mui-selected': { 
                color: 'primary.main',
                bgcolor: alpha(theme.palette.primary.main, 0.05)
              }
            }}
          />
        </Tabs>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Zoom in={!!error}>
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }} 
            onClose={() => setError(null)}
            action={
              <Button color="inherit" size="small" onClick={loadCourses}>
                Try Again
              </Button>
            }
          >
            {error}
          </Alert>
        </Zoom>
      )}

      {/* Enrolled Courses Tab */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={8}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              Loading your courses...
            </Typography>
          </Box>
        ) : enrolledCourses.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'grey.50' }}>
            <Box sx={{ mb: 3 }}>
              <AutoStories sx={{ fontSize: 80, color: 'primary.main', opacity: 0.7 }} />
            </Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
              🚀 Ready to Start Learning?
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
              You haven't enrolled in any courses yet. Let's find the perfect course to begin your learning adventure!
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <ActionButton
                variant="contained"
                size="large"
                onClick={() => setTabValue(1)}
                startIcon={<Explore />}
              >
                🔍 Explore Courses
              </ActionButton>
              <ActionButton
                variant="outlined"
                size="large"
                startIcon={<Lightbulb />}
              >
                💡 Get Recommendations
              </ActionButton>
            </Stack>
          </Paper>
        ) : (
          <>
            {/* Learning Progress Header */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
                📚 Your Learning Journey
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Keep up the great work! Here are your active courses.
              </Typography>
            </Box>

            {/* Learning Tips for new users */}
            {enrolledCourses.length <= 2 && (
              <LearningTips />
            )}

            <Grid container spacing={3}>
              {enrolledCourses.map((course, index) => {
                const progress = getEnrollmentProgress(course._id);
                const progressColor = getProgressColor(progress);
                const levelColor = getLevelColor(course.level);
                
                return (
                  <Grid item xs={12} sm={6} lg={4} key={course._id}>
                    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                      <StyledCard>
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="180"
                            image={getCourseImageUrl(course)}
                            alt={course.title}
                            sx={{ borderRadius: '16px 16px 0 0' }}
                          />
                          {progress >= 100 && (
                            <Chip
                              icon={<CheckCircle />}
                              label="Completed!"
                              color="success"
                              sx={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                fontWeight: 600,
                                boxShadow: 2
                              }}
                            />
                          )}
                          {progress > 0 && progress < 100 && (
                            <Chip
                              icon={<PlayCircleOutline />}
                              label="In Progress"
                              color="primary"
                              sx={{
                                position: 'absolute',
                                top: 12,
                                right: 12,
                                fontWeight: 600,
                                boxShadow: 2
                              }}
                            />
                          )}
                        </Box>
                        
                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                            {course.title}
                          </Typography>
                          
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              <Person sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {course.instructor?.firstName} {course.instructor?.lastName}
                            </Typography>
                          </Stack>

                          {/* Progress Section */}
                          <Box sx={{ mb: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                📈 Your Progress
                              </Typography>
                              <Typography variant="h6" color={`${progressColor}.main`} sx={{ fontWeight: 700 }}>
                                {Math.round(progress)}%
                              </Typography>
                            </Stack>
                            <StyledLinearProgress 
                              variant="determinate" 
                              value={progress}
                              color={progressColor}
                            />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {progress >= 100 ? '🎉 Course completed!' : 
                               progress >= 75 ? '🔥 Almost there!' :
                               progress >= 50 ? '💪 Great progress!' :
                               progress > 0 ? '🌱 Keep going!' : '▶️ Ready to start!'}
                            </Typography>
                          </Box>

                          {/* Course Details */}
                          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <CategoryChip 
                              label={`📂 ${course.category}`} 
                              size="small" 
                              variant="filled"
                            />
                            <CategoryChip 
                              label={`📊 ${course.level}`} 
                              size="small" 
                              color={levelColor}
                              variant="outlined"
                            />
                          </Stack>
                        </CardContent>
                        
                        <Box sx={{ p: 3, pt: 0 }}>
                          <ActionButton
                            fullWidth
                            variant="contained"
                            size="large"
                            startIcon={progress >= 100 ? <EmojiEvents /> : <PlayArrow />}
                            onClick={() => navigate(`/course/${course._id}`)}
                            sx={{ 
                              bgcolor: progress >= 100 ? 'success.main' : 'primary.main',
                              '&:hover': {
                                bgcolor: progress >= 100 ? 'success.dark' : 'primary.dark',
                              }
                            }}
                          >
                            {progress >= 100 ? '🏆 View Certificate' : 
                             progress > 0 ? '📖 Continue Learning' : '🚀 Start Course'}
                          </ActionButton>
                        </Box>
                      </StyledCard>
                    </Zoom>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </TabPanel>

      {/* Browse Courses Tab */}
      <TabPanel value={tabValue} index={1}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>
            🔍 Discover Amazing Courses
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Find the perfect course to expand your knowledge and skills
          </Typography>
        </Box>

        {/* Search and Filters */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, bgcolor: 'grey.50' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            🎯 Find Your Perfect Course
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="What would you like to learn today? (e.g., Python, Design, Marketing...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3,
                    bgcolor: 'white',
                  }
                }}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'primary.main' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>📂 Choose Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="📂 Choose Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{
                    borderRadius: 3,
                    bgcolor: 'white',
                  }}
                >
                  <MenuItem value="">🌟 All Categories</MenuItem>
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
        </Paper>

        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" py={8}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary' }}>
              Finding amazing courses for you...
            </Typography>
          </Box>
        ) : availableCourses.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: 'grey.50' }}>
            <Psychology sx={{ fontSize: 80, color: 'primary.main', opacity: 0.7, mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              🤔 No courses found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Try adjusting your search terms or browse all categories
            </Typography>
            <ActionButton
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
              }}
            >
              🔄 Clear Filters
            </ActionButton>
          </Paper>
        ) : (
          <>
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                ✨ Found {availableCourses.length} amazing course{availableCourses.length !== 1 ? 's' : ''} for you!
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {availableCourses.map((course, index) => {
                const levelColor = getLevelColor(course.level);
                const isEnrolled = enrollments.some(e => e.course?._id === course._id || e.course === course._id);
                const enrollmentProgress = isEnrolled ? getEnrollmentProgress(course._id) : 0;
                
                return (
                  <Grid item xs={12} sm={6} lg={4} key={course._id}>
                    <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                      <StyledCard>
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            height="180"
                            image={getCourseImageUrl(course)}
                            alt={course.title}
                            sx={{ borderRadius: '16px 16px 0 0' }}
                          />
                          {isEnrolled ? (
                            <Chip
                              icon={<CheckCircle />}
                              label={enrollmentProgress >= 100 ? "✅ Completed" : "📚 Enrolled"}
                              color={enrollmentProgress >= 100 ? "success" : "primary"}
                              sx={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                fontWeight: 600,
                                boxShadow: 2
                              }}
                            />
                          ) : (
                            <Chip
                              label="🆕 New"
                              color="secondary"
                              sx={{
                                position: 'absolute',
                                top: 12,
                                left: 12,
                                fontWeight: 600,
                                boxShadow: 2
                              }}
                            />
                          )}
                          <Tooltip title="Add to wishlist">
                            <IconButton
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: 'white',
                                '&:hover': { bgcolor: 'grey.100' }
                              }}
                            >
                              <BookmarkBorder />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        
                        <CardContent sx={{ flexGrow: 1, p: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
                            {course.title}
                          </Typography>
                          
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                            <Avatar sx={{ width: 24, height: 24 }}>
                              <Person sx={{ fontSize: 16 }} />
                            </Avatar>
                            <Typography variant="body2" color="text.secondary">
                              {course.instructor?.firstName} {course.instructor?.lastName}
                            </Typography>
                          </Stack>

                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 3, 
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {course.description || "Expand your skills with this comprehensive course designed for learners of all levels."}
                          </Typography>

                          {/* Course Details */}
                          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                            <CategoryChip 
                              label={`📂 ${course.category}`} 
                              size="small" 
                              variant="filled"
                            />
                            <CategoryChip 
                              label={`📊 ${course.level}`} 
                              size="small" 
                              color={levelColor}
                              variant="outlined"
                            />
                          </Stack>

                          {/* Price and Rating */}
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Box>
                              <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700 }}>
                                ${course.price || '49'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                💰 One-time payment
                              </Typography>
                            </Box>
                            <Box display="flex" alignItems="center">
                              <Stack direction="row" spacing={0.5}>
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} sx={{ color: 'gold', fontSize: 16 }} />
                                ))}
                              </Stack>
                              <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600 }}>
                                4.8 (124)
                              </Typography>
                            </Box>
                          </Stack>

                          {/* Course Features */}
                          <Stack spacing={0.5} sx={{ mb: 2 }}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                ⏱️ Self-paced learning
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Group sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary">
                                👥 Join 500+ students
                              </Typography>
                            </Stack>
                          </Stack>
                        </CardContent>
                        
                        <Box sx={{ p: 3, pt: 0 }}>
                          {isEnrolled ? (
                            <>
                              {/* Show progress if enrolled */}
                              {enrollmentProgress > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      📈 Your Progress
                                    </Typography>
                                    <Typography variant="body2" color="primary.main" sx={{ fontWeight: 700 }}>
                                      {Math.round(enrollmentProgress)}%
                                    </Typography>
                                  </Stack>
                                  <StyledLinearProgress 
                                    variant="determinate" 
                                    value={enrollmentProgress}
                                    color={getProgressColor(enrollmentProgress)}
                                  />
                                </Box>
                              )}
                              
                              <ActionButton
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={enrollmentProgress >= 100 ? <EmojiEvents /> : <PlayArrow />}
                                onClick={() => navigate(`/course/${course._id}`)}
                                sx={{ 
                                  bgcolor: enrollmentProgress >= 100 ? 'success.main' : 'primary.main',
                                  '&:hover': {
                                    bgcolor: enrollmentProgress >= 100 ? 'success.dark' : 'primary.dark',
                                  }
                                }}
                              >
                                {enrollmentProgress >= 100 ? '🏆 View Certificate' : 
                                 enrollmentProgress > 0 ? '📖 Continue Learning' : '🚀 Start Course'}
                              </ActionButton>
                              
                              <ActionButton
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{ mt: 1 }}
                                startIcon={<CheckCircle />}
                                disabled
                              >
                                ✅ Already Enrolled
                              </ActionButton>
                            </>
                          ) : (
                            <>
                              <ActionButton
                                fullWidth
                                variant="contained"
                                size="large"
                                startIcon={<School />}
                                onClick={() => handleEnroll(course._id)}
                              >
                                🚀 Enroll Now
                              </ActionButton>
                              <ActionButton
                                fullWidth
                                variant="outlined"
                                size="small"
                                sx={{ mt: 1 }}
                                onClick={() => navigate(`/course-preview/${course._id}`)}
                              >
                                👀 Preview Course
                              </ActionButton>
                            </>
                          )}
                        </Box>
                      </StyledCard>
                    </Zoom>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </TabPanel>

      {/* Floating Help Button */}
      <HelpButton />
    </Container>
  );
};

export default StudentCourses;

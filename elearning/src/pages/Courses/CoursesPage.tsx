import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  Chip,
  Rating,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  LinearProgress,
  Paper,
  IconButton,
  Collapse,
  Fade,
  useTheme,
  useMediaQuery,
  Stack,
  Badge,
  Tooltip
} from '@mui/material';
import { 
  Search, 
  FilterList, 
  Person, 
  Close, 
  ExpandMore, 
  Star, 
  People, 
  AccessTime, 
  PlayCircleOutline,
  TrendingUp,
  School,
  AutoAwesome,
  BookmarkBorder,
  Bookmark
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseService, ICourse } from '../../services/courseService';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../shared/types';
import { studentProfileService } from '../../services/studentProfileService';
import LearningInterestPopup from '../../components/Student/LearningInterestPopup';

const CoursesPage: React.FC = () => {
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
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [bookmarkedCourses, setBookmarkedCourses] = useState<Set<string>>(new Set());

  // Profile completion state
  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 0,
    missingFields: [] as string[],
    isComplete: false
  });
  const [showProfileAlert, setShowProfileAlert] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Learning interest popup state
  const [showInterestPopup, setShowInterestPopup] = useState(false);
  const [learningInterests, setLearningInterests] = useState<any>(null);
  const [hasCompletedInterestSetup, setHasCompletedInterestSetup] = useState(false);

  // Load courses
  const loadCourses = async (isLoadMore = false) => {
    try {
      if (!isLoadMore) {
        setLoading(true);
        setError(null);
      }

      const filters = {
        page: isLoadMore ? page : 1,
        limit: 12,
        search: searchTerm || undefined,
        category: categoryFilter || undefined,
        level: levelFilter || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const
      };

      const response = await courseService.getPublicCourses(filters);
      
      if (isLoadMore) {
        setCourses(prev => [...prev, ...response.courses]);
      } else {
        setCourses(response.courses);
      }
      
      setHasMore(response.pagination.hasNextPage);
      if (isLoadMore) {
        setPage(prev => prev + 1);
      } else {
        setPage(2);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load courses on component mount and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCourses();
    }, searchTerm ? 500 : 0); // Debounce search by 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter, levelFilter]);

  // Load profile completion on component mount
  useEffect(() => {
    loadProfileCompletion();
  }, [user]);

  // Handle learning interest popup for students
  useEffect(() => {
    if (user?.role === UserRole.STUDENT) {
      // Check if student has completed interest setup
      const hasSetup = localStorage.getItem('learningInterestsCompleted');
      if (!hasSetup) {
        setShowInterestPopup(true);
      } else {
        setHasCompletedInterestSetup(true);
        // Load saved interests
        const savedInterests = localStorage.getItem('learningInterests');
        if (savedInterests) {
          setLearningInterests(JSON.parse(savedInterests));
        }
      }
    }
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

  // Handle search
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1);
  };

  // Handle load more
  const handleLoadMore = () => {
    loadCourses(true);
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = (courseId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    setBookmarkedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  // Get unique categories from courses
  const categories = Array.from(new Set(courses.map(course => course.category)));

  // Get instructor display name
  const getInstructorName = (instructor: any) => {
    if (typeof instructor === 'string') return instructor;
    if (!instructor || !instructor.firstName) return 'Unknown Instructor';
    return `${instructor.firstName} ${instructor.lastName}`;
  };

  // Get course image/icon
  const getCourseIcon = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('programming') || categoryLower.includes('development')) return '💻';
    if (categoryLower.includes('data') || categoryLower.includes('science')) return '📊';
    if (categoryLower.includes('marketing') || categoryLower.includes('business')) return '📱';
    if (categoryLower.includes('design')) return '🎨';
    if (categoryLower.includes('language')) return '🗣️';
    if (categoryLower.includes('nursery')) return '👶';
    if (categoryLower.includes('professional')) return '💼';
    if (categoryLower.includes('academic')) return '🎓';
    if (categoryLower.includes('job') || categoryLower.includes('seeker')) return '💼';
    if (categoryLower.includes('personal') || categoryLower.includes('corporate')) return '🚀';
    if (categoryLower.includes('technical') || categoryLower.includes('digital')) return '💻';
    return '📚';
  };

  // Get gradient colors for course cards
  const getGradientColors = (category: string) => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('programming') || categoryLower.includes('development')) return '#667eea, #764ba2';
    if (categoryLower.includes('data') || categoryLower.includes('science')) return '#f093fb, #f5576c';
    if (categoryLower.includes('marketing') || categoryLower.includes('business')) return '#4facfe, #00f2fe';
    if (categoryLower.includes('design')) return '#43e97b, #38f9d7';
    if (categoryLower.includes('language')) return '#fa709a, #fee140';
    if (categoryLower.includes('nursery')) return '#FFB6C1, #FFD700';
    if (categoryLower.includes('professional')) return '#6c5ce7, #a29bfe';
    if (categoryLower.includes('academic')) return '#0984e3, #6c5ce7';
    if (categoryLower.includes('job') || categoryLower.includes('seeker')) return '#00b894, #55efc4';
    if (categoryLower.includes('personal') || categoryLower.includes('corporate')) return '#fd79a8, #fdcb6e';
    return '#a8edea, #fed6e3';
  };

  // Handle learning interest popup completion
  const handleInterestComplete = (data: any) => {
    setLearningInterests(data);
    setHasCompletedInterestSetup(true);
    setShowInterestPopup(false);
    
    // Save to localStorage
    localStorage.setItem('learningInterests', JSON.stringify(data));
    localStorage.setItem('learningInterestsCompleted', 'true');
    
    // Apply filters based on interests
    applyInterestFilters(data);
  };

  // Apply filters based on learning interests
  const applyInterestFilters = (interests: any) => {
    if (!interests) return;
    
    // Map learning categories to course categories
    const categoryMapping: { [key: string]: string } = {
      professional_coaching: 'Professional Coaching',
      business_entrepreneurship_coaching: 'Business & Entrepreneurship Coaching',
      academic_coaching: 'Academic Coaching',
      nursery_coaching: 'Nursery Coaching',
      language_coaching: 'Language Coaching',
      technical_digital_coaching: 'Technical & Digital Coaching',
      job_seeker_coaching: 'Job Seeker Coaching',
      personal_corporate_development_coaching: 'Personal & Corporate Development Coaching'
    } as any;
    
    // Set category filter based on selected categories
    if (interests.categories && interests.categories.length > 0) {
      const mappedCategories = interests.categories
        .map((cat: string) => categoryMapping[cat])
        .filter(Boolean);
      
      if (mappedCategories.length > 0) {
        setCategoryFilter(mappedCategories[0]);
      }
    }
    
    // Set level filter based on experience level
    if (interests.experienceLevel) {
      const levelMapping: { [key: string]: string } = {
        'beginner': 'Beginner',
        'intermediate': 'Intermediate',
        'advanced': 'Advanced'
      };
      setLevelFilter(levelMapping[interests.experienceLevel] || '');
    }
  };

  // Handle popup close
  const handleInterestClose = () => {
    setShowInterestPopup(false);
    // Mark as completed even if closed without completion
    localStorage.setItem('learningInterestsCompleted', 'true');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Modern Header with Gradient Background */}
      <Box 
        sx={{ 
          textAlign: 'center', 
          mb: 8,
          position: 'relative',
          overflow: 'hidden',
          py: 8,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
          borderRadius: 4,
          color: 'white',
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
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={800}>
            <Box>
              <Typography
                variant={isMobile ? "h3" : "h2"}
                component="h1"
                gutterBottom
                sx={{ 
                  fontWeight: 900, 
                  mb: 3,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  background: 'linear-gradient(45deg, #ffffff 0%, #f0f0f0 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}
              >
                🎓 Explore Our Courses
              </Typography>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                sx={{ 
                  opacity: 0.95, 
                  mb: 4,
                  textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                  fontWeight: 400
                }}
              >
                Discover thousands of courses taught by expert instructors
              </Typography>
              
              {/* Stats Row */}
              <Grid container spacing={4} justifyContent="center" sx={{ mt: 4 }}>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      {courses.length}+
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Courses
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      50K+
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Students
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      4.8★
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Rating
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
                      24/7
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Support
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Learning Interest Setup Button for Students */}
      {user?.role === UserRole.STUDENT && hasCompletedInterestSetup && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<AutoAwesome />}
            onClick={() => setShowInterestPopup(true)}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1,
              borderColor: 'primary.main',
              color: 'primary.main',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'primary.main',
                color: 'white',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Update Learning Interests
          </Button>
        </Box>
      )}

      {/* Modern Search and Filters */}
      <Fade in timeout={1000}>
        <Paper 
          elevation={0}
          sx={{ 
            mb: 6, 
            p: 4,
            background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
            border: '1px solid rgba(0,0,0,0.05)',
            borderRadius: 3
          }}
        >
          {/* Search Bar */}
          <Grid container spacing={3} alignItems="center" sx={{ mb: 4 }}>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search courses, instructors, or topics..."
                variant="outlined"
                value={searchTerm}
                onChange={handleSearch}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={levelFilter}
                  label="Level"
                  onChange={(e) => setLevelFilter(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value="beginner">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 1 }}>🟢</Box>
                      Beginner
                    </Box>
                  </MenuItem>
                  <MenuItem value="intermediate">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 1 }}>🟡</Box>
                      Intermediate
                    </Box>
                  </MenuItem>
                  <MenuItem value="advanced">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 1 }}>🔴</Box>
                      Advanced
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Categories Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '8px' }}>📚</span> Categories
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setCategoryFilter('')}
                  sx={{ 
                    textTransform: 'none',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.08)' }
                  }}
                >
                  Clear All
                </Button>
              </Box>
            </Box>

            {/* Category Pills */}
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 1.5,
              pb: 2
            }}>
              {/* All Categories Option */}
              <Chip
                icon={<Box sx={{ mr: 0.5 }}>📋</Box>}
                label="All Categories"
                onClick={() => setCategoryFilter('')}
                variant={categoryFilter === '' ? 'filled' : 'outlined'}
                sx={{
                  borderRadius: 2,
                  height: 40,
                  fontSize: '0.95rem',
                  fontWeight: categoryFilter === '' ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backgroundColor: categoryFilter === '' ? 'primary.main' : 'transparent',
                  color: categoryFilter === '' ? 'white' : 'inherit',
                  borderColor: categoryFilter === '' ? 'primary.main' : 'rgba(0,0,0,0.12)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    backgroundColor: categoryFilter === '' ? 'primary.dark' : 'rgba(33, 150, 243, 0.08)'
                  }
                }}
              />

              {/* Individual Category Pills */}
              {categories
                .filter(cat => cat && cat.trim()) // Filter out empty strings
                .sort() // Sort alphabetically for consistency
                .map((category) => (
                  <Chip
                    key={category}
                    label={`${getCourseIcon(category)} ${category}`}
                    onClick={() => setCategoryFilter(category)}
                    variant={categoryFilter === category ? 'filled' : 'outlined'}
                    sx={{
                      borderRadius: 2,
                      height: 40,
                      fontSize: '0.95rem',
                      fontWeight: categoryFilter === category ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backgroundColor: categoryFilter === category ? 'primary.main' : 'transparent',
                      color: categoryFilter === category ? 'white' : 'inherit',
                      borderColor: categoryFilter === category ? 'primary.main' : 'rgba(0,0,0,0.12)',
                      '& .MuiChip-label': {
                        paddingLeft: 0.5,
                        paddingRight: 1.5
                      },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        backgroundColor: categoryFilter === category ? 'primary.dark' : 'rgba(33, 150, 243, 0.08)'
                      }
                    }}
                  />
                ))}
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* Loading State */}
      {loading && courses.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Modern Course Grid */}
      {!loading || courses.length > 0 ? (
        <Grid container spacing={4}>
          {courses.map((course, index) => (
            <Grid item xs={12} sm={6} lg={4} key={course._id}>
              <Fade in timeout={1200 + index * 100}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
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
                      },
                      '& .bookmark-icon': {
                        opacity: 1,
                        transform: 'scale(1.1)'
                      }
                    }
                  }}
                >
                  {/* Bookmark Button */}
                  <IconButton
                    className="bookmark-icon"
                    onClick={(e) => handleBookmarkToggle(course._id, e)}
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      zIndex: 2,
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      backdropFilter: 'blur(10px)',
                      opacity: 0.8,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,1)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    {bookmarkedCourses.has(course._id) ? (
                      <Bookmark sx={{ color: '#ff6b6b' }} />
                    ) : (
                      <BookmarkBorder sx={{ color: '#666' }} />
                    )}
                  </IconButton>

                  {/* Course Image */}
                  <CardMedia
                    component="div"
                    className="course-image"
                    sx={{
                      height: 200,
                      background: course.thumbnail 
                        ? `url(${course.thumbnail})` 
                        : `linear-gradient(135deg, ${getGradientColors(course.category)})`,
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
                          {getCourseIcon(course.category)}
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
                          background: `linear-gradient(45deg, ${getGradientColors(course.category)})`,
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
                          background: `linear-gradient(45deg, ${getGradientColors(course.category)})`,
                          fontSize: '0.9rem',
                          fontWeight: 600
                        }}
                      >
                        {getInstructorName(course.instructor).split(' ').map(n => n[0]).join('')}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                          Instructor
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          {getInstructorName(course.instructor)}
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

                    {/* Action Buttons */}
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
                          borderColor: 'primary.main',
                          color: 'primary.main',
                          flex: 1,
                          '&:hover': {
                            borderColor: 'primary.dark',
                            backgroundColor: 'primary.main',
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
                          navigate(`/courses/${course._id}`);
                        }}
                        sx={{
                          borderRadius: 2,
                          py: 1.5,
                          fontWeight: 600,
                          background: 'linear-gradient(45deg, #667eea, #764ba2)',
                          flex: 1,
                          '&:hover': {
                            background: 'linear-gradient(45deg, #5a67d8, #6b46c1)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        🚀 Explore
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>
      ) : null}

      {/* Modern No Courses Message */}
      {!loading && courses.length === 0 && (
        <Fade in timeout={1000}>
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Box sx={{ mb: 4 }}>
              <School sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.5 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
              No courses found
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 400, mx: 'auto' }}>
              We couldn't find any courses matching your search criteria. Try adjusting your filters or search terms.
            </Typography>
            <Button 
              variant="outlined" 
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setLevelFilter('');
              }}
              sx={{ 
                px: 4,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </Fade>
      )}

      {/* Modern Load More Button */}
      {courses.length > 0 && hasMore && (
        <Fade in timeout={1200}>
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={handleLoadMore}
              disabled={loading}
              sx={{ 
                px: 6,
                py: 2,
                borderRadius: 3,
                background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1.1rem',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a67d8 0%, #6b46c1 100%)',
                  boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                  transform: 'translateY(-2px)'
                },
                '&:disabled': {
                  background: 'rgba(0,0,0,0.1)',
                  color: 'rgba(0,0,0,0.5)'
                }
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                  Loading...
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TrendingUp sx={{ mr: 1 }} />
                  Load More Courses
                </Box>
              )}
            </Button>
          </Box>
        </Fade>
      )}

      {/* Learning Interest Popup */}
      <LearningInterestPopup
        open={showInterestPopup}
        onClose={handleInterestClose}
        onComplete={handleInterestComplete}
      />
    </Container>
  );
};

export default CoursesPage;

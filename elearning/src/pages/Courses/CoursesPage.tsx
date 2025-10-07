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
  Collapse
} from '@mui/material';
import { Search, FilterList, Person, Close, ExpandMore } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseService, ICourse } from '../../services/courseService';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../shared/types';
import { studentProfileService } from '../../services/studentProfileService';

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Profile completion state
  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 0,
    missingFields: [] as string[],
    isComplete: false
  });
  const [showProfileAlert, setShowProfileAlert] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

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
    return '#a8edea, #fed6e3';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Profile Completion Alert for Students */}
      {user?.role === UserRole.STUDENT && !profileCompletion.isComplete && showProfileAlert && (
        <Paper
          elevation={2}
          sx={{
            mb: 4,
            p: 3,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 2
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
              <Close />
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
          
                 <Button
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
                 </Button>
        </Paper>
      )}

      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 700, color: 'text.primary' }}
        >
          Explore Our Courses
        </Typography>
        <Typography
          variant="h6"
          sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto' }}
        >
          Discover thousands of courses taught by expert instructors
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search courses..."
              variant="outlined"
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={levelFilter}
                label="Level"
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Loading State */}
      {loading && courses.length === 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Course Grid */}
      {!loading || courses.length > 0 ? (
        <Grid container spacing={3}>
          {courses.map((course) => (
            <Grid item xs={12} sm={6} lg={4} key={course._id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                  },
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/courses/${course._id}`)}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 200,
                    background: `linear-gradient(45deg, ${getGradientColors(course.category)})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '3rem'
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
                </CardMedia>

                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Chip
                      label={course.category}
                      size="small"
                      color="primary"
                      sx={{ mr: 1 }}
                    />
                    <Chip
                      label={course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography
                    variant="h6"
                    component="h3"
                    gutterBottom
                    sx={{ fontWeight: 600, lineHeight: 1.3 }}
                  >
                    {course.title}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ 
                      color: 'text.secondary', 
                      mb: 2, 
                      lineHeight: 1.6,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {course.description}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1 }}>
                      {getInstructorName(course.instructor).split(' ').map(n => n[0]).join('')}
                    </Avatar>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {getInstructorName(course.instructor)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={course.rating || 0} precision={0.1} size="small" readOnly />
                    <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                      {course.rating ? course.rating.toFixed(1) : 'No rating'} ({course.enrollmentCount || 0} students)
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      {course.price > 0 ? (
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: 'primary.main' }}
                        >
                          ${course.price}
                        </Typography>
                      ) : (
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: 'success.main' }}
                        >
                          FREE
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {course.duration} hours
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : null}

      {/* No Courses Message */}
      {!loading && courses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No courses found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Box>
      )}

      {/* Load More Button */}
      {courses.length > 0 && hasMore && (
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Button 
            variant="outlined" 
            size="large" 
            sx={{ px: 4 }}
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Load More Courses'}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default CoursesPage;

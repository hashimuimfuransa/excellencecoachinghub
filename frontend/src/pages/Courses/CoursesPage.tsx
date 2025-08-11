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
  Alert
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseService, ICourse } from '../../services/courseService';

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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

  // Load courses on component mount and when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCourses();
    }, searchTerm ? 500 : 0); // Debounce search by 500ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, categoryFilter, levelFilter]);

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
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: 'primary.main' }}
                      >
                        ${course.price}
                      </Typography>
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

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Button,
  Chip,
  Rating,
  Stack,
  TextField,
  InputAdornment,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Pagination,
  Paper,
  Avatar,
  LinearProgress,
  Skeleton,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  Alert
} from '@mui/material';
import {
  Search,
  FilterList,
  Star,
  Schedule,
  Person,
  PlayCircleOutline,
  BookmarkBorder,
  Bookmark,
  Share,
  TrendingUp,
  School,
  EmojiEvents,
  Clear,
  Sort,
  Category,
  AccessTime,
  Group,
  Language,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { courseService, Course } from '../services/courseService';
import { getCourseThumbnail, generateCourseUrl, getCategoryImage } from '../utils/courseImageGenerator';

// Interface for transformed course data (frontend format)
interface TransformedCourse extends Course {
  instructor: {
    name: string;
    avatar?: string;
    rating: number;
  };
  duration: string;
  studentsCount: number;
  lessonsCount: number;
  skills: string[];
  isPopular?: boolean;
  isBestseller?: boolean;
  isNew?: boolean;
  completionRate?: number;
  language: string;
  lastUpdated: string;
  originalPrice?: number;
}

const CoursesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState<TransformedCourse[]>([]);
  const [categories, setCategories] = useState<string[]>(['All Categories']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [savedCourses, setSavedCourses] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, [page, searchTerm, selectedCategory, selectedLevel, sortBy]);

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await courseService.getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {
        page,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        level: selectedLevel !== 'all' ? selectedLevel : undefined,
        sortBy: getSortByValue(),
        sortOrder: getSortOrder()
      };

      const response = await courseService.getPublicCourses(filters);
      
      // Transform courses to frontend format
      const transformedCourses = response.courses.map(course => transformCourseData(course));
      
      setCourses(transformedCourses);
      setTotalPages(response.pagination.totalPages);
      setTotalCourses(response.pagination.totalCourses);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      setError(error.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const transformCourseData = (course: Course): TransformedCourse => {
    return {
      ...course,
      instructor: {
        name: course.instructor ? `${course.instructor.firstName} ${course.instructor.lastName}` : 'Unknown Instructor',
        avatar: '',
        rating: 4.5 // Default instructor rating
      },
      duration: courseService.formatDuration(course.duration),
      studentsCount: course.enrollmentCount,
      lessonsCount: Math.floor(course.duration * 2), // Estimate 2 lessons per hour
      skills: course.tags,
      thumbnail: course.thumbnail || '',
      isPopular: course.enrollmentCount > 50,
      isBestseller: course.rating > 4.5 && course.enrollmentCount > 100,
      isNew: new Date(course.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      completionRate: Math.floor(Math.random() * 20) + 80, // Mock completion rate 80-100%
      language: 'English',
      lastUpdated: course.updatedAt,
      originalPrice: course.price > 0 ? course.price * 1.5 : undefined,
      price: course.notesPrice + course.liveSessionPrice || course.price
    };
  };

  const getSortByValue = () => {
    switch (sortBy) {
      case 'popular':
        return 'enrollmentCount';
      case 'rating':
        return 'rating';
      case 'newest':
        return 'createdAt';
      case 'price-low':
      case 'price-high':
        return 'price';
      default:
        return 'enrollmentCount';
    }
  };

  const getSortOrder = (): 'asc' | 'desc' => {
    return sortBy === 'price-low' ? 'asc' : 'desc';
  };

  const handleSaveCourse = (courseId: string) => {
    setSavedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1);
    // Tab filtering is now handled by the backend via the fetchCourses function
    fetchCourses();
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(1); // Reset to first page when searching
  };

  const handleCategoryChange = (event: any) => {
    setSelectedCategory(event.target.value);
    setPage(1); // Reset to first page when filtering
  };

  const handleLevelChange = (event: any) => {
    setSelectedLevel(event.target.value);
    setPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (event: any) => {
    setSortBy(event.target.value);
    setPage(1); // Reset to first page when sorting
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All Categories');
    setSelectedLevel('all');
    setSortBy('popular');
    setTabValue(0);
    setPage(1);
  };

  const handleRefresh = () => {
    fetchCourses();
    fetchCategories();
  };

  // Filter courses based on tab (client-side filtering for tabs)
  const getFilteredCoursesByTab = () => {
    switch (tabValue) {
      case 1: // Popular
        return courses.filter(course => course.isPopular);
      case 2: // New
        return courses.filter(course => course.isNew);
      case 3: // Bestsellers
        return courses.filter(course => course.isBestseller);
      default: // All
        return courses;
    }
  };

  // Get display courses (tab filtering is applied client-side, other filters server-side)
  const displayCourses = getFilteredCoursesByTab();

  const CourseCard: React.FC<{ course: TransformedCourse }> = ({ course }) => {
    const isSaved = savedCourses.includes(course._id);
    const discount = course.originalPrice ? Math.round((1 - course.price / course.originalPrice) * 100) : 0;

    // Generate course thumbnail if not available
    const courseThumbnail = course.thumbnail || getCourseThumbnail({
      title: course.title,
      category: course.category,
      level: course.level,
      instructor: course.instructor.name
    });

    const handleViewCourse = () => {
      // Redirect to e-learning platform
      const elearningUrl = generateCourseUrl(course._id, 'http://localhost:3000');
      window.open(elearningUrl, '_blank');
    };

    const handleEnrollCourse = () => {
      // Redirect to e-learning platform enrollment page
      const enrollmentUrl = `http://localhost:3000/courses?enroll=${course._id}`;
      window.open(enrollmentUrl, '_blank');
    };

    return (
      <Card 
        sx={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8]
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="200"
            image={courseThumbnail}
            alt={course.title}
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Fallback to category image if generated image fails
              const target = e.target as HTMLImageElement;
              target.src = getCategoryImage(course.category);
            }}
          />
          <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
            <Stack direction="row" spacing={1}>
              {course.isNew && (
                <Chip label="NEW" color="success" size="small" />
              )}
              {course.isBestseller && (
                <Chip label="BESTSELLER" color="warning" size="small" />
              )}
              {course.isPopular && (
                <Chip label="POPULAR" color="primary" size="small" />
              )}
            </Stack>
          </Box>
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <IconButton
              size="small"
              onClick={() => handleSaveCourse(course._id)}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 1)' }
              }}
            >
              {isSaved ? <Bookmark color="primary" /> : <BookmarkBorder />}
            </IconButton>
          </Box>
          {discount > 0 && (
            <Box sx={{ position: 'absolute', bottom: 8, left: 8 }}>
              <Chip 
                label={`${discount}% OFF`} 
                color="error" 
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          )}
        </Box>

        <CardContent sx={{ flexGrow: 1, p: 2 }}>
          <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
            {course.title}
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            {course.description}
          </Typography>

          <Box display="flex" alignItems="center" mb={2}>
            <Avatar src={course.instructor.avatar} sx={{ width: 24, height: 24, mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              {course.instructor.name}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
            <Chip label={course.category} size="small" variant="outlined" />
            <Chip label={courseService.formatLevel(course.level)} size="small" variant="outlined" />
            <Chip label={course.duration} size="small" variant="outlined" />
          </Stack>

          <Box display="flex" alignItems="center" mb={2}>
            <Rating value={course.rating} precision={0.1} size="small" readOnly />
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              {course.rating} ({course.studentsCount.toLocaleString()} students)
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} mb={2}>
            <Box display="flex" alignItems="center">
              <PlayCircleOutline fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{course.lessonsCount} lessons</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Language fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{course.language}</Typography>
            </Box>
          </Stack>

          {course.completionRate && (
            <Box mb={2}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="body2">Completion Rate</Typography>
                <Typography variant="body2">{course.completionRate}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={course.completionRate} 
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight="bold" color="primary.main">
                ${course.price}
              </Typography>
              {course.originalPrice && (
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ textDecoration: 'line-through' }}
                >
                  ${course.originalPrice}
                </Typography>
              )}
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ p: 2, pt: 0 }}>
          <Stack direction="row" spacing={1} width="100%">
            <Button
              variant="contained"
              fullWidth
              onClick={handleViewCourse}
              sx={{ flex: 1 }}
            >
              View Course
            </Button>
            <Button
              variant="outlined"
              onClick={handleEnrollCourse}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              Enroll
            </Button>
          </Stack>
        </CardActions>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Courses
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Enhance your skills with our comprehensive course library
        </Typography>
      </Box>

      {/* Course Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Courses" />
          <Tab 
            label={
              <Badge badgeContent={courses.filter(c => c.isPopular).length} color="primary">
                Popular
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={courses.filter(c => c.isNew).length} color="success">
                New
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={courses.filter(c => c.isBestseller).length} color="warning">
                Bestsellers
              </Badge>
            } 
          />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search courses..."
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchTerm('')}>
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                label="Category"
                onChange={handleCategoryChange}
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Level</InputLabel>
              <Select
                value={selectedLevel}
                label="Level"
                onChange={handleLevelChange}
              >
                <MenuItem value="all">All Levels</MenuItem>
                <MenuItem value="beginner">Beginner</MenuItem>
                <MenuItem value="intermediate">Intermediate</MenuItem>
                <MenuItem value="advanced">Advanced</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={handleSortChange}
              >
                <MenuItem value="popular">Most Popular</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
                <MenuItem value="newest">Newest</MenuItem>
                <MenuItem value="price-low">Price: Low to High</MenuItem>
                <MenuItem value="price-high">Price: High to Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Clear />}
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Summary */}
      <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body1" color="text.secondary">
          {loading ? 'Loading...' : `${totalCourses} course${totalCourses !== 1 ? 's' : ''} found`}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
          <Button variant="outlined" size="small" onClick={handleRefresh} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Courses Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 8 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <Skeleton variant="rectangular" height={200} />
                <CardContent>
                  <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="text" height={20} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" height={40} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : displayCourses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            No courses found
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Try adjusting your search criteria or browse all courses.
          </Typography>
          <Button
            variant="contained"
            onClick={handleClearFilters}
          >
            View All Courses
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {displayCourses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course._id}>
                <CourseCard course={course} />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default CoursesPage;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Stack,
  Container,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fab,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  School,
  People,
  Analytics,
  Settings as SettingsIcon,
  Visibility,
  Edit,
  TrendingUp,
  Schedule,
  CheckCircle,
  Warning,
  EditNote,
  Publish,
  ManageAccounts,
  VideoCall,
  MenuBook,
  Assignment,
  Quiz,
  Star,
  AccessTime,
  Group
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  category: string;
  level: string;
  status: 'draft' | 'published' | 'archived';
  enrollmentCount: number;
  totalStudents: number;
  createdAt: string;
  updatedAt: string;
  rating?: number;
  totalRatings?: number;
  completionRate?: number;
  lastActivity?: string;
}

const CourseManagementSelection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get teacher's courses
        const response = await courseService.getTeacherCourses();
        if (response && response.courses) {
          setCourses(response.courses);
        }
      } catch (err: any) {
        console.error('Failed to load courses:', err);
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories
  const categories = Array.from(new Set(courses.map(course => course.category)));

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'success';
      case 'draft': return 'warning';
      case 'archived': return 'error';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published': return <Publish />;
      case 'draft': return <EditNote />;
      case 'archived': return <Warning />;
      default: return <CheckCircle />;
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          variant="contained"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <School color="primary" sx={{ fontSize: 40 }} />
          Course Management Center
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select a course to manage its content, students, and settings
        </Typography>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="all">All Categories</MenuItem>
                  {categories.map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/dashboard/teacher/courses/create')}
                sx={{ height: 56 }}
              >
                New Course
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      {filteredCourses.length === 0 ? (
        <Card>
          <CardContent>
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={8}
              sx={{ color: 'text.secondary' }}
            >
              <School sx={{ fontSize: 80, mb: 2, opacity: 0.5 }} />
              <Typography variant="h5" gutterBottom>
                {courses.length === 0 ? 'No Courses Yet' : 'No Courses Found'}
              </Typography>
              <Typography variant="body1" textAlign="center" mb={3}>
                {courses.length === 0 
                  ? 'Create your first course to start teaching students.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </Typography>
              {courses.length === 0 && (
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/dashboard/teacher/courses/create')}
                >
                  Create Your First Course
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredCourses.map((course) => (
            <Grid item xs={12} sm={6} lg={4} key={course._id}>
              <Card 
                sx={{ 
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  }
                }}
              >
                {/* Course Image */}
                <Box sx={{ position: 'relative', height: 200 }}>
                  <Avatar
                    src={course.thumbnail}
                    variant="square"
                    sx={{ 
                      width: '100%', 
                      height: '100%',
                      bgcolor: 'primary.main'
                    }}
                  >
                    <School sx={{ fontSize: 60 }} />
                  </Avatar>
                  
                  {/* Status Badge */}
                  <Chip
                    icon={getStatusIcon(course.status)}
                    label={course.status}
                    color={getStatusColor(course.status) as any}
                    size="small"
                    sx={{ 
                      position: 'absolute', 
                      top: 12, 
                      right: 12,
                      textTransform: 'capitalize'
                    }}
                  />

                  {/* Rating Badge */}
                  {course.rating && (
                    <Chip
                      icon={<Star />}
                      label={`${course.rating.toFixed(1)} (${course.totalRatings})`}
                      size="small"
                      sx={{ 
                        position: 'absolute', 
                        top: 12, 
                        left: 12,
                        bgcolor: 'rgba(255,193,7,0.9)',
                        color: 'white'
                      }}
                    />
                  )}
                </Box>

                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Course Title */}
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {course.title}
                  </Typography>

                  {/* Course Description */}
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mb: 2, 
                      flexGrow: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {course.description}
                  </Typography>

                  {/* Course Stats */}
                  <Box sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                      <Chip
                        icon={<Group />}
                        label={`${course.enrollmentCount || 0} students`}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        icon={<TrendingUp />}
                        label={`${course.completionRate || 0}% completion`}
                        size="small"
                        variant="outlined"
                      />
                    </Stack>
                    
                    <Stack direction="row" spacing={1}>
                      <Chip
                        label={course.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={course.level}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    </Stack>
                  </Box>

                  {/* Progress Bar */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Course Progress
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {course.completionRate || 0}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={course.completionRate || 0}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>

                  {/* Last Activity */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Updated {format(new Date(course.updatedAt), 'MMM dd, yyyy')}
                  </Typography>

                  {/* Action Buttons */}
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<SettingsIcon />}
                      onClick={() => navigate(`/course-management/${course._id}`)}
                      sx={{ 
                        background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                        boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)'
                      }}
                    >
                      Manage Course
                    </Button>
                    <Tooltip title="View Course">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/courses/${course._id}`)}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Quick Actions FAB */}
      <Tooltip title="Create New Course">
        <Fab
          color="primary"
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
          }}
          onClick={() => navigate('/dashboard/teacher/courses/create')}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Container>
  );
};

export default CourseManagementSelection;
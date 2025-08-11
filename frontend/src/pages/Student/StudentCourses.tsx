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
  Tab
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
  Bookmark
} from '@mui/icons-material';
import { courseService, ICourse } from '../../services/courseService';
import { enrollmentService, IEnrollment } from '../../services/enrollmentService';
import { useAuth } from '../../hooks/useAuth';
import { getCourseImageUrl } from '../../utils/courseImageGenerator';

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

  // State management
  const [tabValue, setTabValue] = useState(0);
  const [enrolledCourses, setEnrolledCourses] = useState<ICourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<ICourse[]>([]);
  const [enrollments, setEnrollments] = useState<IEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

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
        // Load available courses
        const coursesResponse = await courseService.getPublicCourses({
          search: searchTerm,
          category: categoryFilter,
          limit: 20
        });
        setAvailableCourses(coursesResponse.courses);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  // Load courses when tab changes or filters change
  useEffect(() => {
    loadCourses();
  }, [tabValue, searchTerm, categoryFilter]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEnroll = async (courseId: string) => {
    try {
      await enrollmentService.enrollInCourse(courseId);
      // Refresh courses
      loadCourses();
    } catch (err: any) {
      setError(err.message || 'Failed to enroll in course');
    }
  };

  const getEnrollmentProgress = (courseId: string) => {
    const enrollment = enrollments.find(e => e.course?._id === courseId);
    return enrollment?.progress || 0;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Courses
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your enrolled courses and discover new learning opportunities
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Enrolled Courses" />
          <Tab label="Browse Courses" />
        </Tabs>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Enrolled Courses Tab */}
      <TabPanel value={tabValue} index={0}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : enrolledCourses.length === 0 ? (
          <Box textAlign="center" py={8}>
            <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Enrolled Courses
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Start your learning journey by enrolling in a course
            </Typography>
            <Button
              variant="contained"
              onClick={() => setTabValue(1)}
              startIcon={<School />}
            >
              Browse Courses
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {enrolledCourses.map((course) => {
              const progress = getEnrollmentProgress(course._id);
              return (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={getCourseImageUrl(course)}
                      alt={course.title}
                    />
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom noWrap>
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {course.instructor?.firstName} {course.instructor?.lastName}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="body2">Progress</Typography>
                          <Typography variant="body2">{Math.round(progress)}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={progress} />
                      </Box>

                      <Box display="flex" gap={1} mb={2}>
                        <Chip label={course.category} size="small" />
                        <Chip label={course.level} size="small" variant="outlined" />
                      </Box>
                    </CardContent>
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => navigate(`/dashboard/student/course-content/${course._id}`)}
                      >
                        Continue Learning
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </TabPanel>

      {/* Browse Courses Tab */}
      <TabPanel value={tabValue} index={1}>
        {/* Filters */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                <MenuItem value="Programming">Programming</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Business">Business</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {availableCourses.map((course) => (
              <Grid item xs={12} sm={6} md={4} key={course._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardMedia
                    component="img"
                    height="140"
                    image={getCourseImageUrl(course)}
                    alt={course.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" gutterBottom noWrap>
                      {course.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {course.instructor?.firstName} {course.instructor?.lastName}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }} noWrap>
                      {course.description}
                    </Typography>

                    <Box display="flex" gap={1} mb={2}>
                      <Chip label={course.category} size="small" />
                      <Chip label={course.level} size="small" variant="outlined" />
                    </Box>

                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" color="primary">
                        ${course.price}
                      </Typography>
                      <Box display="flex" alignItems="center">
                        <Star sx={{ color: 'gold', fontSize: 16, mr: 0.5 }} />
                        <Typography variant="body2">4.5</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleEnroll(course._id)}
                    >
                      Enroll Now
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </TabPanel>
    </Container>
  );
};

export default StudentCourses;

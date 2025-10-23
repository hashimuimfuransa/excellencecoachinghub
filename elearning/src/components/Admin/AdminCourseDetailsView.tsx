import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Breadcrumbs,
  Link,
  Paper,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import {
  ArrowBack,
  School,
  Folder,
  CalendarToday,
  Psychology,
  Quiz,
  Settings
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService, ICourse } from '../../services/courseService';

// Import all the smaller components
import AdminCourseOverview from './AdminCourseOverview';
import AdminCourseMaterials from './AdminCourseMaterials';
import AdminCourseWeeks from './AdminCourseWeeks';
import AdminCourseNotes from './AdminCourseNotes';
import AdminCourseQuizzes from './AdminCourseQuizzes';
import AdminCourseActions from './AdminCourseActions';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `course-tab-${index}`,
    'aria-controls': `course-tabpanel-${index}`,
  };
}

const AdminCourseDetailsView: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState<ICourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const courseData = await courseService.getCourseById(courseId!);
      setCourse(courseData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCourseUpdate = () => {
    loadCourse();
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/admin/courses')}
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mb: 2 }}>
          Course not found
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/admin/courses')}
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body1"
            onClick={() => navigate('/dashboard/admin/courses')}
            sx={{ textDecoration: 'none' }}
          >
            Course Management
          </Link>
          <Typography color="text.primary">Course Details</Typography>
        </Breadcrumbs>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard/admin/courses')}
              sx={{ mr: 2 }}
            >
              Back
            </Button>
            <Typography variant="h4" component="h1">
              {course.title}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Comprehensive course details and management
        </Typography>
      </Box>

      {/* Course Actions - Always visible at top */}
      <AdminCourseActions 
        course={course} 
        onCourseUpdate={handleCourseUpdate} 
      />

      {/* Tabbed Content */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<School />}
            label="Overview"
            iconPosition="start"
            {...a11yProps(0)}
          />
          <Tab
            icon={<Folder />}
            label="Materials"
            iconPosition="start"
            {...a11yProps(1)}
          />
          <Tab
            icon={<CalendarToday />}
            label="Weeks"
            iconPosition="start"
            {...a11yProps(2)}
          />
          <Tab
            icon={<Psychology />}
            label="Notes"
            iconPosition="start"
            {...a11yProps(3)}
          />
          <Tab
            icon={<Quiz />}
            label="Quizzes"
            iconPosition="start"
            {...a11yProps(4)}
          />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <AdminCourseOverview course={course} />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <AdminCourseMaterials courseId={courseId!} />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <AdminCourseWeeks courseId={courseId!} />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <AdminCourseNotes courseId={courseId!} />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <AdminCourseQuizzes courseId={courseId!} />
      </TabPanel>

      {/* Quick Stats Footer */}
      <Paper sx={{ p: 3, mt: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Course Quick Stats
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="primary">
                {course.enrollmentCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enrollments
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="success">
                {course.duration}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hours Duration
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="info">
                {course.price || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Price ($)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography variant="h4" color="warning">
                {new Date(course.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created Date
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AdminCourseDetailsView;

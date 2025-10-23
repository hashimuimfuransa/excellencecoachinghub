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
  Settings,
  Feedback
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
import AdminCourseStudentFeedback from './AdminCourseStudentFeedback';

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
      {value === index && <Box sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 0 } }}>{children}</Box>}
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
      
      // Use the admin-specific method with fallback approaches
      const courseData = await courseService.getCourseByIdForAdmin(courseId!);
      setCourse(courseData);
    } catch (err) {
      console.error('Failed to load course details:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load course details';
      setError(`${errorMessage}. This may be due to insufficient permissions or the course may not exist.`);
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
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Troubleshooting:</strong>
            <br />• Ensure you have super admin permissions
            <br />• Check if the course ID is correct
            <br />• Verify the course exists in the system
            <br />• Contact system administrator if the issue persists
          </Typography>
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
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Breadcrumbs sx={{ mb: 2, display: { xs: 'none', sm: 'flex' } }}>
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

        <Box 
          display="flex" 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          justifyContent="space-between"
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={{ xs: 2, sm: 0 }}
        >
          <Box display="flex" alignItems={{ xs: 'flex-start', sm: 'center' }} flexDirection={{ xs: 'column', sm: 'row' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate('/dashboard/admin/courses')}
              sx={{ 
                mr: { xs: 0, sm: 2 }, 
                mb: { xs: 1, sm: 0 },
                minWidth: 'auto',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 0.5, sm: 1 },
                px: { xs: 1, sm: 2 }
              }}
              size="small"
            >
              Back
            </Button>
            <Typography 
              variant="h4" 
              component="h1"
              sx={{ 
                wordBreak: 'break-word',
                lineHeight: { xs: 1.2, sm: 1.167 },
                fontSize: { xs: '1.5rem', sm: '2.125rem' }
              }}
            >
              {course.title}
            </Typography>
          </Box>
        </Box>
        
        <Typography 
          variant="body1" 
          color="text.secondary" 
          sx={{ 
            mt: 1,
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}
        >
          Comprehensive course details and management
        </Typography>
      </Box>

      {/* Course Actions - Always visible at top */}
      <AdminCourseActions 
        course={course} 
        onCourseUpdate={handleCourseUpdate} 
      />

      {/* Tabbed Content */}
      <Paper sx={{ mb: { xs: 2, sm: 3 } }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            '& .MuiTab-root': {
              minWidth: { xs: 'auto', sm: 160 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: '8px 12px', sm: '12px 16px' }
            },
            '& .MuiTab-iconWrapper': {
              display: { xs: 'none', sm: 'inline-block' },
              marginBottom: { xs: 0, sm: '4px' }
            }
          }}
        >
          <Tab
            icon={<School />}
            label="Overview"
            iconPosition={{ xs: 'top', sm: 'start' }}
            {...a11yProps(0)}
          />
          <Tab
            icon={<Folder />}
            label="Materials"
            iconPosition={{ xs: 'top', sm: 'start' }}
            {...a11yProps(1)}
          />
          <Tab
            icon={<CalendarToday />}
            label="Weeks"
            iconPosition={{ xs: 'top', sm: 'start' }}
            {...a11yProps(2)}
          />
          <Tab
            icon={<Psychology />}
            label="Notes"
            iconPosition={{ xs: 'top', sm: 'start' }}
            {...a11yProps(3)}
          />
          <Tab
            icon={<Quiz />}
            label="Quizzes"
            iconPosition={{ xs: 'top', sm: 'start' }}
            {...a11yProps(4)}
          />
          <Tab
            icon={<Feedback />}
            label="Feedback"
            iconPosition={{ xs: 'top', sm: 'start' }}
            {...a11yProps(5)}
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

      <TabPanel value={activeTab} index={5}>
        <AdminCourseStudentFeedback courseId={courseId!} />
      </TabPanel>

      {/* Quick Stats Footer */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mt: { xs: 2, sm: 3 }, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Course Quick Stats
        </Typography>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography 
                variant="h4" 
                color="primary"
                sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
              >
                {course.enrollmentCount || 0}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Enrollments
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography 
                variant="h4" 
                color="success"
                sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
              >
                {course.duration}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Hours Duration
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography 
                variant="h4" 
                color="info"
                sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
              >
                {course.price || 0}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Price ($)
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box textAlign="center">
              <Typography 
                variant="h4" 
                color="warning"
                sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
              >
                {new Date(course.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
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

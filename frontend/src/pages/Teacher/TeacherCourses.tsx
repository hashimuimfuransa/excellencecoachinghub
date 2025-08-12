import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add,
  Edit,
  Visibility,
  MoreVert,
  Delete,
  People,
  School,
  CheckCircle,
  Pending,
  Cancel,
  TrendingUp,
  VideoCall
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { CourseStatus } from '../../shared/types';
import { teacherProfileService } from '../../services/teacherProfileService';

const TeacherCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load courses
  useEffect(() => {
    const loadCourses = async () => {
      if (!user || user.role !== 'teacher') return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await courseService.getAllCourses({
          instructor: user._id,
          limit: 50
        });
        
        setCourses(response.courses);
      } catch (err: any) {
        console.error('Error loading courses:', err);
        setError(err.message || 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [user]);

  // Filter courses based on status
  const filteredCourses = courses.filter(course => {
    if (filterStatus === 'all') return true;
    return course.status === filterStatus;
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'pending': return <Pending />;
      case 'rejected': return <Cancel />;
      default: return <Pending />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Check teacher profile status before creating course
  const handleCreateCourse = async () => {
    try {
      // Check if teacher profile exists and is approved
      const profile = await teacherProfileService.getMyProfile();

      if (!profile) {
        setError('Please create your teacher profile before creating courses.');
        setTimeout(() => {
          navigate('/dashboard/teacher/profile');
        }, 3000);
        return;
      }

      if (profile.profileStatus !== 'approved') {
        let message = '';
        switch (profile.profileStatus) {
          case 'incomplete':
            message = 'Please complete your teacher profile before creating courses.';
            break;
          case 'pending':
            message = 'Your teacher profile is pending approval. You cannot create courses until your profile is approved.';
            break;
          case 'rejected':
            message = 'Your teacher profile has been rejected. Please update your profile and resubmit for approval.';
            break;
          default:
            message = 'Your teacher profile is not approved. Please contact support.';
        }

        setError(message);

        if (profile.profileStatus === 'incomplete' || profile.profileStatus === 'rejected') {
          setTimeout(() => {
            navigate('/dashboard/teacher/profile');
          }, 3000);
        }
        return;
      }

      // Profile is approved, navigate to create course
      navigate('/dashboard/teacher/courses/create');

    } catch (err: any) {
      console.error('Error checking teacher profile:', err);
      setError('Unable to verify teacher profile status. Please try again.');
    }
  };

  // Event handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, course: ICourse) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  const handleViewCourse = () => {
    if (selectedCourse) {
      navigate(`/dashboard/teacher/courses/${selectedCourse._id}/manage`);
    }
    handleMenuClose();
  };

  const handleManageCourse = () => {
    if (selectedCourse) {
      navigate(`/dashboard/teacher/courses/${selectedCourse._id}/manage`);
    }
    handleMenuClose();
  };

  const handleEditCourse = () => {
    if (selectedCourse) {
      navigate(`/dashboard/teacher/courses/${selectedCourse._id}/edit`);
    }
    handleMenuClose();
  };

  const handleViewSessions = () => {
    if (selectedCourse) {
      navigate(`/dashboard/teacher/live-sessions?courseId=${selectedCourse._id}`);
    }
    handleMenuClose();
  };

  const handleDeleteCourse = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = async () => {
    if (!selectedCourse) return;
    
    try {
      await courseService.deleteCourse(selectedCourse._id);
      setCourses(prev => prev.filter(c => c._id !== selectedCourse._id));
      setDeleteDialogOpen(false);
      setSelectedCourse(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete course');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Courses
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your courses and track student progress
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            startIcon={<VideoCall />}
            onClick={() => navigate('/dashboard/teacher/live-sessions')}
          >
            View Sessions
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateCourse}
          >
            Create Course
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <School color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{courses.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Courses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircle color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {courses.filter(c => c.status === 'approved').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Approved
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUp color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {courses.filter(c => c.status === CourseStatus.PENDING_APPROVAL).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Review
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Controls */}
      <Box mb={3}>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select
            value={filterStatus}
            label="Filter by Status"
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <MenuItem value="all">All Courses</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Courses Table */}
      <Card>
        <CardContent>
          {filteredCourses.length === 0 ? (
            <Box textAlign="center" py={4}>
              <School sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {filterStatus === 'all' ? 'No courses yet' : `No ${filterStatus} courses`}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {filterStatus === 'all' 
                  ? 'Create your first course to start teaching!'
                  : `You don't have any ${filterStatus} courses.`
                }
              </Typography>
              {filterStatus === 'all' && (
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => navigate('/dashboard/teacher/courses/create')}
                >
                  Create Your First Course
                </Button>
              )}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course</TableCell>
                    <TableCell align="center">Students</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Category</TableCell>
                    <TableCell align="center">Created</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCourses.map((course) => (
                    <TableRow key={course._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">{course.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.level} • ${course.price}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        {course.enrollmentCount || 0}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={course.status}
                          color={getStatusColor(course.status) as any}
                          size="small"
                          icon={getStatusIcon(course.status)}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={course.category} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="center">
                        {formatDate(course.createdAt)}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={(e) => handleMenuOpen(e, course)}
                          size="small"
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleManageCourse}>
          <School sx={{ mr: 1 }} />
          Manage Course
        </MenuItem>
        <MenuItem onClick={handleViewCourse}>
          <Visibility sx={{ mr: 1 }} />
          Preview Course
        </MenuItem>
        <MenuItem onClick={handleEditCourse}>
          <Edit sx={{ mr: 1 }} />
          Edit Course
        </MenuItem>
        <MenuItem onClick={handleViewSessions}>
          <VideoCall sx={{ mr: 1 }} />
          View Sessions
        </MenuItem>
        <MenuItem onClick={handleDeleteCourse} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Course
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Course</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedCourse?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherCourses;

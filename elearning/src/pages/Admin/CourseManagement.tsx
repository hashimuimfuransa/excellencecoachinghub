import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Avatar,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  TextField
} from '@mui/material';
import {
  Search,
  MoreVert,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Visibility,
  School,
  Person,
  Schedule,
  TrendingUp,
  FilterList,
  Refresh
} from '@mui/icons-material';

import { courseService, ICourse, CourseStats } from '../../services/courseService';
import { CourseStatus } from '../../shared/types';
import { useNavigate } from 'react-router-dom';

const CourseManagement: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<ICourse[]>([]);
  const [courseStats, setCourseStats] = useState<CourseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState(0);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCourse, setSelectedCourse] = useState<ICourse | null>(null);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState('');
  
  // Price setting states
  const [coursePrice, setCoursePrice] = useState<number>(0);

  // Load courses and statistics
  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine status filter based on current tab
      let statusFilter: string | undefined;
      if (currentTab === 1) statusFilter = CourseStatus.PENDING_APPROVAL;
      else if (currentTab === 2) statusFilter = CourseStatus.APPROVED;
      else if (currentTab === 3) statusFilter = CourseStatus.REJECTED;

      const [coursesResponse, statsResponse] = await Promise.all([
        courseService.getAllCourses({
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          status: statusFilter,
          category: categoryFilter !== 'all' ? categoryFilter : undefined
        }),
        courseService.getCourseStats()
      ]);

      setCourses(coursesResponse.courses);
      setCourseStats(statsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, currentTab, categoryFilter]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Since we're doing backend filtering, we can use courses directly
  const filteredCourses = courses || [];
  const paginatedCourses = filteredCourses;

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle menu
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, course: ICourse) => {
    setAnchorEl(event.currentTarget);
    setSelectedCourse(course);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCourse(null);
  };

  // Handle course actions
  const handleViewCourse = () => {
    setViewDialogOpen(true);
    setAnchorEl(null); // Close menu but keep selectedCourse
  };

  const handleApproveCourse = () => {
    setApproveDialogOpen(true);
    setAnchorEl(null); // Close menu but keep selectedCourse
  };

  const handleRejectCourse = () => {
    setRejectDialogOpen(true);
    setAnchorEl(null); // Close menu but keep selectedCourse
  };

  const handleEditCourse = () => {
    // TODO: Implement edit course functionality
    setSuccess('Edit course functionality will be implemented');
    handleMenuClose();
  };

  const handleDeleteCourse = async () => {
    if (selectedCourse) {
      try {
        await courseService.deleteCourse(selectedCourse._id);
        setSuccess('Course deleted successfully');
        loadCourses();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete course');
      }
    }
    handleMenuClose();
  };

  // Confirm approve course
  const confirmApproveCourse = async () => {
    if (selectedCourse) {
      try {
        await courseService.approveCourse(selectedCourse._id, {
          price: coursePrice
        });
        setSuccess('Course approved successfully with pricing set');
        loadCourses();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to approve course');
      }
    } else {
      setError('No course selected for approval');
    }
    setApproveDialogOpen(false);
    setSelectedCourse(null);
    setCoursePrice(0);
  };

  // Confirm reject course
  const confirmRejectCourse = async () => {
    if (selectedCourse && rejectFeedback.trim()) {
      try {
        await courseService.rejectCourse(selectedCourse._id, { feedback: rejectFeedback });
        setSuccess('Course rejected');
        setRejectFeedback('');
        loadCourses();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reject course');
      }
    }
    setRejectDialogOpen(false);
    setSelectedCourse(null);
  };

  // Get status color
  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.APPROVED:
        return 'success';
      case CourseStatus.PENDING_APPROVAL:
        return 'warning';
      case CourseStatus.REJECTED:
        return 'error';
      case CourseStatus.DRAFT:
        return 'info';
      case CourseStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  // Format status for display
  const formatStatus = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PENDING_APPROVAL:
        return 'Pending Approval';
      case CourseStatus.APPROVED:
        return 'Approved';
      case CourseStatus.REJECTED:
        return 'Rejected';
      case CourseStatus.DRAFT:
        return 'Draft';
      case CourseStatus.ARCHIVED:
        return 'Archived';
      default:
        return 'Unknown';
    }
  };

  // Get level color
  const getLevelColor = (level: string) => {
    const normalizedLevel = level?.toLowerCase();
    switch (normalizedLevel) {
      case 'beginner':
        return 'info';
      case 'intermediate':
        return 'warning';
      case 'advanced':
        return 'error';
      default:
        return 'default';
    }
  };

  // Format level for display
  const formatLevel = (level: string) => {
    return level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Unknown';
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(courses.map(course => course.category)));

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Typography variant="h4" gutterBottom>
          Course Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all courses, approve submissions, and assign moderators.
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Course Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <School color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{courseStats?.totalCourses || 0}</Typography>
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
                <Schedule color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {courseStats?.pendingCourses || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Approval
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
                    {courseStats?.activeCourses || 0}
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
                <Person color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {courseStats?.totalEnrollments || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Enrollments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Course Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => {
            setCurrentTab(newValue);
            setPage(0);
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label={`All Courses (${courseStats?.totalCourses || 0})`} />
          <Tab label={`Pending (${courseStats?.pendingCourses || 0})`} />
          <Tab label={`Approved (${courseStats?.approvedCourses || 0})`} />
          <Tab label={`Rejected (${courseStats?.rejectedCourses || 0})`} />
        </Tabs>
      </Paper>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search courses, instructors, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
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
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredCourses.length} of {courses.length} courses
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Courses Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Course</TableCell>
                <TableCell>Instructor</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Enrollments</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No courses found
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {course.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {course.duration} hours
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{course.instructor.firstName} {course.instructor.lastName}</TableCell>
                    <TableCell>{course.category}</TableCell>
                    <TableCell>
                      <Chip
                        label={course.level}
                        color={getLevelColor(course.level)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatStatus(course.status)}
                        color={getStatusColor(course.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{course.enrollmentCount || 0}</TableCell>
                    <TableCell>
                      {course.price > 0 ? (
                        <Typography variant="body2" fontWeight="medium">
                          ${course.price}
                        </Typography>
                      ) : (
                        <Chip label="FREE" color="success" size="small" />
                      )}
                    </TableCell>
                    <TableCell>{formatDate(course.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, course)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={courseStats?.totalCourses || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewCourse}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => navigate(`/dashboard/admin/courses/${selectedCourse._id}/details`)}>
          <Visibility sx={{ mr: 1 }} />
          Comprehensive View
        </MenuItem>
        {selectedCourse?.status === CourseStatus.PENDING_APPROVAL && (
          <>
            <MenuItem onClick={handleApproveCourse}>
              <CheckCircle sx={{ mr: 1 }} />
              Approve Course
            </MenuItem>
            <MenuItem onClick={handleRejectCourse}>
              <Cancel sx={{ mr: 1 }} />
              Reject Course
            </MenuItem>
          </>
        )}
        <MenuItem onClick={handleEditCourse}>
          <Edit sx={{ mr: 1 }} />
          Edit Course
        </MenuItem>
        <MenuItem onClick={handleDeleteCourse} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete Course
        </MenuItem>
      </Menu>

      {/* View Course Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => {
        setViewDialogOpen(false);
        setSelectedCourse(null);
      }} maxWidth="md" fullWidth>
        <DialogTitle>Course Details</DialogTitle>
        <DialogContent>
          {selectedCourse && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6">{selectedCourse.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    by {selectedCourse.instructor?.firstName} {selectedCourse.instructor?.lastName}
                    {selectedCourse.instructor?.email && (
                      <Typography component="span" variant="body2" color="text.secondary">
                        {' '}({selectedCourse.instructor.email})
                      </Typography>
                    )}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Category:</strong> {selectedCourse.category}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Level:</strong> {formatLevel(selectedCourse.level)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Duration:</strong> {selectedCourse.duration} hours</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Price:</strong> ${selectedCourse.price || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Enrollments:</strong> {selectedCourse.enrollmentCount || 0}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Status:</strong>
                    <Chip
                      label={formatStatus(selectedCourse.status)}
                      color={getStatusColor(selectedCourse.status)}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Created:</strong> {formatDate(selectedCourse.createdAt)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2"><strong>Updated:</strong> {formatDate(selectedCourse.updatedAt)}</Typography>
                </Grid>
                {selectedCourse.approvedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Approved:</strong> {formatDate(selectedCourse.approvedAt)}</Typography>
                  </Grid>
                )}
                {selectedCourse.rejectedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2"><strong>Rejected:</strong> {formatDate(selectedCourse.rejectedAt)}</Typography>
                  </Grid>
                )}
                {selectedCourse.adminFeedback && (
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Admin Feedback:</strong></Typography>
                    <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                      {selectedCourse.adminFeedback}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2"><strong>Description:</strong></Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {selectedCourse.description}
                  </Typography>
                </Grid>
                {selectedCourse.prerequisites && selectedCourse.prerequisites.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Prerequisites:</strong></Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedCourse.prerequisites.map((prereq: string, index: number) => (
                        <Chip
                          key={index}
                          label={prereq}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
                {selectedCourse.learningOutcomes && selectedCourse.learningOutcomes.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Learning Outcomes:</strong></Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedCourse.learningOutcomes.map((outcome: string, index: number) => (
                        <Typography key={index} variant="body2" sx={{ ml: 2, mb: 0.5 }}>
                          • {outcome}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                )}
                {selectedCourse.tags && selectedCourse.tags.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body2"><strong>Tags:</strong></Typography>
                    <Box sx={{ mt: 1 }}>
                      {selectedCourse.tags.map((tag: string, index: number) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewDialogOpen(false);
            setSelectedCourse(null);
          }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Approve Course Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => {
        setApproveDialogOpen(false);
        setSelectedCourse(null);
        setCoursePrice(0);
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Course & Set Price</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Approve the course "{selectedCourse?.title}" and set the course price.
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Course Price"
                type="number"
                value={coursePrice}
                onChange={(e) => setCoursePrice(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                helperText="Set to $0 for free course access"
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.contrastText">
                  💡 <strong>Pricing Information:</strong>
                  <br />• Set to $0 for free course access
                  <br />• Students will have access to all course materials and live sessions
                  <br />• Price includes complete course content and live session recordings
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setApproveDialogOpen(false);
            setSelectedCourse(null);
            setCoursePrice(0);
          }}>Cancel</Button>
          <Button
            color="success"
            variant="contained"
            onClick={confirmApproveCourse}
          >
            Approve & Set Price
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Course Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => {
        setRejectDialogOpen(false);
        setSelectedCourse(null);
        setRejectFeedback('');
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Course</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to reject the course "{selectedCourse?.title}"?
            Please provide feedback for the instructor.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Feedback"
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            placeholder="Explain why this course is being rejected..."
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRejectDialogOpen(false);
            setRejectFeedback('');
            setSelectedCourse(null);
          }}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmRejectCourse}
            disabled={!rejectFeedback.trim()}
          >
            Reject Course
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseManagement;

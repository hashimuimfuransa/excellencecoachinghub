import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Badge
} from '@mui/material';
import {
  Search,
  MoreVert,
  Person,
  Refresh,
  School,
  CalendarToday,
  TrendingUp,
  Assessment,
  CheckCircle,
  Cancel,
  Schedule,
  Group,
  BookmarkBorder,
  Visibility,
  Edit,
  Block,
  EventAvailable
} from '@mui/icons-material';

import { studentService, IStudent, StudentStats } from '../../services/studentService';
import AttendanceManagement from '../../components/Admin/AttendanceManagement';

const StudentManagement: React.FC = () => {
  // State management
  const [students, setStudents] = useState<IStudent[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState(0); // 0: All Students, 1: Active, 2: Inactive, 3: Low Attendance

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);

  // Selected student
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Total count for pagination
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  // Load students and statistics
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Determine status filter based on current tab
      let statusFilterValue: string | undefined;
      if (currentTab === 1) statusFilterValue = 'active';
      else if (currentTab === 2) statusFilterValue = 'inactive';
      
      const [studentsResponse, statsResponse] = await Promise.all([
        studentService.getAllStudents({
          page: page + 1,
          limit: rowsPerPage,
          search: searchTerm,
          status: statusFilterValue as 'active' | 'inactive' | undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc'
        }),
        studentService.getStudentStats()
      ]);
      
      // Filter for low attendance if on tab 3
      let filteredStudents = studentsResponse.students;
      if (currentTab === 3) {
        filteredStudents = studentsResponse.students.filter(student => 
          student.attendanceRate < 75 // Students with less than 75% attendance
        );
      }
      
      setStudents(filteredStudents);
      setStudentStats(statsResponse);
      setTotalStudentsCount(studentsResponse.pagination.totalStudents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load students');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, currentTab]);

  // Load data on component mount and when dependencies change
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Handle pagination
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle tab change
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setPage(0);
    setSearchTerm('');
    setStatusFilter('all');
  };

  // Handle menu
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, student: IStudent) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudent(student);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Clear student selection
  const clearStudentSelection = () => {
    setSelectedStudent(null);
  };

  // Handle student actions
  const handleViewStudent = () => {
    handleMenuClose();
    setViewDialogOpen(true);
  };

  const handleViewAttendance = () => {
    handleMenuClose();
    setAttendanceDialogOpen(true);
  };

  const handleToggleStudentStatus = async () => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      await studentService.updateStudentStatus(selectedStudent._id, !selectedStudent.isActive);
      setSuccess(`Student ${selectedStudent.isActive ? 'deactivated' : 'activated'} successfully`);
      loadStudents();
      clearStudentSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student status');
    } finally {
      setLoading(false);
    }
    handleMenuClose();
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get attendance color
  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'success';
    if (rate >= 75) return 'warning';
    return 'error';
  };

  // Get progress color
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Student Management
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={loadStudents}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* Error and Success Messages */}
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

      {/* Statistics Cards */}
      {studentStats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Group color="primary" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Students
                    </Typography>
                    <Typography variant="h4">
                      {studentStats.totalStudents}
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
                  <CheckCircle color="success" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Active Students
                    </Typography>
                    <Typography variant="h4">
                      {studentStats.activeStudents}
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
                  <School color="info" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Total Enrollments
                    </Typography>
                    <Typography variant="h4">
                      {studentStats.enrollmentStats.totalEnrollments}
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
                  <EventAvailable color="warning" sx={{ mr: 2, fontSize: 40 }} />
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      Attendance Rate
                    </Typography>
                    <Typography variant="h4">
                      {studentStats.overallAttendanceRate}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Student Management Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Students" />
          <Tab label="Active Students" />
          <Tab label="Inactive Students" />
          <Tab 
            label={
              <Badge badgeContent={students.filter(s => s.attendanceRate < 75).length} color="error">
                Low Attendance
              </Badge>
            }
          />
        </Tabs>
      </Paper>

      {/* Search and Filter */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search students by name or email..."
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
            <Button
              fullWidth
              variant="contained"
              onClick={loadStudents}
              disabled={loading}
            >
              Search
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPage(0);
                loadStudents();
              }}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Students Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Courses</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Attendance</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Avatar
                          src={student.avatar || undefined}
                          sx={{ mr: 2 }}
                        >
                          {student.firstName ? student.firstName.charAt(0) : 'S'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {student.firstName || 'Unknown'} {student.lastName || ''}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {student._id.slice(-6)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{student.email}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Last login: {student.lastLogin ? formatDate(student.lastLogin) : 'Never'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {student.totalCourses} enrolled
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.completedCourses} completed
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Chip
                          label={`${student.averageProgress}%`}
                          color={getProgressColor(student.averageProgress)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Chip
                          label={`${student.attendanceRate}%`}
                          color={getAttendanceColor(student.attendanceRate)}
                          size="small"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          ({student.presentDays}/{student.totalAttendanceDays})
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={student.isActive ? 'Active' : 'Inactive'}
                        color={student.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {student.createdAt ? formatDate(student.createdAt) : 'Unknown'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleMenuClick(e, student)}
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

        {/* Pagination */}
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalStudentsCount}
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
        <MenuItem onClick={handleViewStudent}>
          <Visibility sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleViewAttendance}>
          <Assessment sx={{ mr: 1 }} />
          View Attendance
        </MenuItem>
        <MenuItem onClick={handleToggleStudentStatus}>
          {selectedStudent?.isActive ? (
            <>
              <Block sx={{ mr: 1 }} />
              Deactivate
            </>
          ) : (
            <>
              <CheckCircle sx={{ mr: 1 }} />
              Activate
            </>
          )}
        </MenuItem>
      </Menu>

      {/* View Student Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          clearStudentSelection();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedStudent && `${selectedStudent.firstName} ${selectedStudent.lastName} - Details`}
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Grid container spacing={3} sx={{ pt: 2 }}>
              {/* Personal Information */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Personal Information</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {selectedStudent.email}</Typography>
                    <Typography variant="body2"><strong>Student ID:</strong> {selectedStudent._id.slice(-8)}</Typography>
                    <Typography variant="body2"><strong>Joined:</strong> {selectedStudent.createdAt ? formatDate(selectedStudent.createdAt) : 'Unknown'}</Typography>
                    <Typography variant="body2"><strong>Last Login:</strong> {selectedStudent.lastLogin ? formatDate(selectedStudent.lastLogin) : 'Never'}</Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}><strong>Account Status:</strong>
                      <Chip
                        label={selectedStudent.isActive ? 'Active' : 'Inactive'}
                        color={selectedStudent.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Academic Statistics */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Academic Statistics</Typography>
                    <Typography variant="body2"><strong>Total Courses:</strong> {selectedStudent.totalCourses}</Typography>
                    <Typography variant="body2"><strong>Completed Courses:</strong> {selectedStudent.completedCourses}</Typography>
                    <Typography variant="body2"><strong>Average Progress:</strong> {selectedStudent.averageProgress}%</Typography>
                    <Typography variant="body2"><strong>Attendance Rate:</strong>
                      <Chip
                        label={`${selectedStudent.attendanceRate}%`}
                        color={getAttendanceColor(selectedStudent.attendanceRate)}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    <Typography variant="body2"><strong>Total Attendance Days:</strong> {selectedStudent.totalAttendanceDays}</Typography>
                    <Typography variant="body2"><strong>Present Days:</strong> {selectedStudent.presentDays}</Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Enrollments */}
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Recent Enrollments</Typography>
                    {selectedStudent.enrollments && selectedStudent.enrollments.length > 0 ? (
                      <List>
                        {selectedStudent.enrollments.slice(0, 5).map((enrollment, index) => (
                          <React.Fragment key={index}>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar>
                                  <BookmarkBorder />
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`Course ${enrollment.courseId.slice(-6)}`}
                                secondary={
                                  <Box>
                                    <Typography variant="caption" display="block">
                                      Progress: {enrollment.progressPercentage}%
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      Enrolled: {formatDate(enrollment.enrollmentDate)}
                                    </Typography>
                                    <Typography variant="caption" display="block">
                                      Status: {enrollment.isCompleted ? 'Completed' : 'In Progress'}
                                    </Typography>
                                  </Box>
                                }
                              />
                              <Chip
                                label={enrollment.isCompleted ? 'Completed' : 'In Progress'}
                                color={enrollment.isCompleted ? 'success' : 'primary'}
                                size="small"
                              />
                            </ListItem>
                            {index < selectedStudent.enrollments.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No enrollments found
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setViewDialogOpen(false);
            clearStudentSelection();
          }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Management */}
      {selectedStudent && (
        <AttendanceManagement
          student={selectedStudent}
          open={attendanceDialogOpen}
          onClose={() => {
            setAttendanceDialogOpen(false);
            clearStudentSelection();
          }}
        />
      )}
    </Container>
  );
};

export default StudentManagement;

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
  Grid,
  Avatar,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import {
  Search,
  MoreVert,
  Edit,
  Block,
  CheckCircle,
  School,
  Person,
  Refresh,
  Star,
  Group,
  VideoCall
} from '@mui/icons-material';

import { teacherService, ITeacher, TeacherStats } from '../../services/teacherService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { teacherProfileService, ITeacherProfile } from '../../services/teacherProfileService';

const TeacherManagement: React.FC = () => {
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pagination data from backend
  const [totalTeachersCount, setTotalTeachersCount] = useState(0);
  
  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState(0); // 0: All Teachers, 1: Pending Approval, 2: Approved, 3: Rejected

  // Pending approvals
  const [pendingApprovals, setPendingApprovals] = useState<ITeacherProfile[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);

  // Teacher profile state
  const [selectedTeacherProfile, setSelectedTeacherProfile] = useState<ITeacherProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Live sessions state
  const [teacherSessions, setTeacherSessions] = useState<ILiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Load teachers and statistics
  const loadTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (currentTab === 1) {
        // Load pending approvals
        const [profilesResponse, statsResponse] = await Promise.all([
          teacherProfileService.getAllProfiles({
            page: page + 1,
            limit: rowsPerPage,
            search: searchTerm,
            status: 'pending'
          }),
          teacherService.getTeacherStats()
        ]);

        setPendingApprovals(profilesResponse.profiles);
        setTeacherStats(statsResponse);
        setTotalTeachersCount(profilesResponse.pagination.totalProfiles);
        setPendingCount(profilesResponse.pagination.totalProfiles);
      } else {
        // Load teachers based on tab
        let profileStatusFilter: string | undefined;
        if (currentTab === 2) profileStatusFilter = 'approved';
        else if (currentTab === 3) profileStatusFilter = 'rejected';

        const [teachersResponse, statsResponse, pendingResponse] = await Promise.all([
          teacherService.getAllTeachers({
            page: page + 1,
            limit: rowsPerPage,
            search: searchTerm,
            status: statusFilter !== 'all' ? statusFilter as 'active' | 'inactive' : undefined,
            profileStatus: profileStatusFilter
          }),
          teacherService.getTeacherStats(),
          teacherProfileService.getAllProfiles({ status: 'pending', limit: 1 }) // Just to get count
        ]);

        console.log('Loaded teachers:', teachersResponse.teachers);
        setTeachers(teachersResponse.teachers);
        setTeacherStats(statsResponse);
        setTotalTeachersCount(teachersResponse.pagination.totalTeachers);
        setPendingCount(pendingResponse.pagination.totalProfiles);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm, statusFilter, currentTab]);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  // Load teacher sessions
  const loadTeacherSessions = async (teacherId: string) => {
    try {
      setSessionsLoading(true);
      const sessions = await liveSessionService.getSessionsByTeacher(teacherId);
      setTeacherSessions(sessions.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teacher sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  // Backend handles filtering and pagination

  // Handle pagination
  const handleChangePage = (_event: unknown, newPage: number) => {
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
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, teacher: any) => {
    console.log('Menu clicked for teacher:', teacher);
    setAnchorEl(event.currentTarget);
    setSelectedTeacher(teacher);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedTeacher here as it's needed for dialog actions
  };

  // Clear teacher selection
  const clearTeacherSelection = () => {
    setSelectedTeacher(null);
  };

  // Handle teacher actions
  const handleViewTeacher = () => {
    console.log('View teacher called, selectedTeacher:', selectedTeacher);
    handleMenuClose(); // Close menu first
    setViewDialogOpen(true);
  };

  const handleViewSessions = () => {
    if (selectedTeacher) {
      handleMenuClose(); // Close menu first
      loadTeacherSessions(selectedTeacher._id);
      setSessionsDialogOpen(true);
    } else {
      handleMenuClose();
    }
  };

  // Session management handlers
  const handleForceEndSession = async (sessionId: string) => {
    try {
      await liveSessionService.forceEndSession(sessionId);
      setSuccess('Session ended successfully');
      // Reload sessions to update the list
      if (selectedTeacher) {
        loadTeacherSessions(selectedTeacher._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
    }
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      await liveSessionService.cancelSession(sessionId, {
        reason: 'Cancelled by admin'
      });
      setSuccess('Session cancelled successfully');
      // Reload sessions to update the list
      if (selectedTeacher) {
        loadTeacherSessions(selectedTeacher._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel session');
    }
  };

  const handleViewSessionDetails = async (sessionId: string) => {
    try {
      const session = await liveSessionService.getSessionById(sessionId);
      // You could open another dialog here to show detailed session info
      console.log('Session details:', session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load session details');
    }
  };

  // Load teacher profile for approval
  const loadTeacherProfile = async (teacherId: string) => {
    try {
      setProfileLoading(true);
      // First try to get the profile by user ID
      const profiles = await teacherProfileService.getAllProfiles({
        search: teacherId,
        limit: 1
      });

      if (profiles.profiles.length > 0) {
        setSelectedTeacherProfile(profiles.profiles[0]);
      } else {
        setSelectedTeacherProfile(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load teacher profile');
      setSelectedTeacherProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Handle teacher approval
  const handleApproveTeacher = () => {
    if (selectedTeacher) {
      handleMenuClose(); // Close menu first
      loadTeacherProfile(selectedTeacher._id);
      setApprovalDialogOpen(true);
    } else {
      handleMenuClose();
    }
  };

  // Approve teacher profile
  const approveTeacherProfile = async () => {
    if (selectedTeacherProfile) {
      try {
        await teacherProfileService.approveProfile(selectedTeacherProfile._id, {
          feedback: 'Profile approved by admin'
        });
        setSuccess('Teacher profile approved and account activated');
        setApprovalDialogOpen(false);
        clearTeacherSelection();
        loadTeachers(); // Refresh the list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to approve teacher profile');
      }
    }
  };

  // Reject teacher profile
  const rejectTeacherProfile = async (reason: string) => {
    if (selectedTeacherProfile) {
      try {
        await teacherProfileService.rejectProfile(selectedTeacherProfile._id, {
          reason,
          feedback: 'Profile needs improvement before approval'
        });
        setSuccess('Teacher profile rejected');
        setApprovalDialogOpen(false);
        clearTeacherSelection();
        loadTeachers(); // Refresh the list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reject teacher profile');
      }
    }
  };

  const handleToggleTeacherStatus = async () => {
    console.log('Toggle status called, selectedTeacher:', selectedTeacher);
    if (!selectedTeacher) {
      console.log('No teacher selected error');
      setError('No teacher selected');
      return;
    }

    handleMenuClose(); // Close the menu first

    if (selectedTeacher.isActive) {
      // Show confirmation dialog for deactivation
      setDeactivateDialogOpen(true);
    } else {
      // Activate teacher directly
      try {
        setLoading(true);
        await teacherService.activateTeacher(selectedTeacher._id);
        setSuccess(`${selectedTeacher.firstName} ${selectedTeacher.lastName} has been activated successfully`);
        loadTeachers(); // Refresh the list
        clearTeacherSelection(); // Clear selection after success
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to activate teacher');
        clearTeacherSelection(); // Clear selection after error
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditTeacher = () => {
    handleMenuClose(); // Close menu first
    setSuccess('Edit teacher functionality will be implemented');
    clearTeacherSelection();
  };

  // Confirm deactivate teacher
  const confirmDeactivateTeacher = async () => {
    if (!selectedTeacher) {
      setError('No teacher selected');
      setDeactivateDialogOpen(false);
      return;
    }

    try {
      setLoading(true);
      await teacherService.deactivateTeacher(selectedTeacher._id);
      setSuccess(`${selectedTeacher.firstName} ${selectedTeacher.lastName} has been deactivated successfully`);
      loadTeachers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate teacher');
    } finally {
      setLoading(false);
    }
    setDeactivateDialogOpen(false);
    clearTeacherSelection();
  };

  // Format date
  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Render table content based on current tab
  const renderTableContent = () => {
    if (currentTab === 1) {
      // Pending Approval Tab
      return pendingApprovals.length === 0 ? (
        <TableRow>
          <TableCell colSpan={9} align="center">
            No pending approvals found
          </TableCell>
        </TableRow>
      ) : (
        pendingApprovals.map((profile) => {
          const user = typeof profile.userId === 'object' ? profile.userId : null;
          return (
            <TableRow key={profile._id}>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <Avatar
                    src={(user as any)?.avatar || undefined}
                    sx={{ mr: 2 }}
                  >
                    {user?.firstName ? user.firstName.charAt(0) : 'T'}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {user?.firstName || 'Unknown'} {user?.lastName || ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Submitted: {profile.submittedAt ? formatDate(profile.submittedAt) : 'Unknown'}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Box>
                  <Typography variant="body2">{user?.email || 'No email'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Profile ID: {profile._id.slice(-6)}
                  </Typography>
                </Box>
              </TableCell>
            <TableCell>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {profile.specialization.slice(0, 2).map((spec, index) => (
                  <Chip key={index} label={spec} size="small" variant="outlined" />
                ))}
                {profile.specialization.length > 2 && (
                  <Chip label={`+${profile.specialization.length - 2}`} size="small" variant="outlined" />
                )}
              </Box>
            </TableCell>
            <TableCell>
              <Typography variant="body2">{profile.experience} years</Typography>
            </TableCell>
            <TableCell>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {profile.teachingAreas.slice(0, 2).map((area, index) => (
                  <Chip key={index} label={area} size="small" color="secondary" variant="outlined" />
                ))}
                {profile.teachingAreas.length > 2 && (
                  <Chip label={`+${profile.teachingAreas.length - 2}`} size="small" color="secondary" variant="outlined" />
                )}
              </Box>
            </TableCell>
            <TableCell>
              <Typography variant="body2">${profile.hourlyRate || 'Not set'}</Typography>
            </TableCell>
            <TableCell>
              <Chip
                label="Pending Review"
                color="warning"
                size="small"
              />
            </TableCell>
            <TableCell>
              <Typography variant="body2">
                {profile.submittedAt ? formatDate(profile.submittedAt) : 'Unknown'}
              </Typography>
            </TableCell>
            <TableCell>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => {
                  setSelectedTeacherProfile(profile);
                  setApprovalDialogOpen(true);
                }}
              >
                Review
              </Button>
            </TableCell>
          </TableRow>
        );
        })
      );
    } else {
      // Regular Teachers Tab
      return teachers.length === 0 ? (
        <TableRow>
          <TableCell colSpan={9} align="center">
            No teachers found
          </TableCell>
        </TableRow>
      ) : (
        teachers.map((teacher) => (
          <TableRow key={teacher._id}>
            <TableCell>
              <Box display="flex" alignItems="center">
                <Avatar
                  src={teacher.avatar || undefined}
                  sx={{ mr: 2 }}
                >
                  {teacher.firstName ? teacher.firstName.charAt(0) : 'T'}
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight="medium">
                    {teacher.firstName || 'Unknown'} {teacher.lastName || ''}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Joined: {teacher.createdAt ? formatDate(teacher.createdAt) : 'Unknown'}
                  </Typography>
                </Box>
              </Box>
            </TableCell>
            <TableCell>
              <Box>
                <Typography variant="body2">{teacher.email || 'No email'}</Typography>
                <Typography variant="caption" color="text.secondary">
                  Teacher ID: {teacher._id ? teacher._id.slice(-6) : 'N/A'}
                </Typography>
              </Box>
            </TableCell>
            <TableCell>{teacher.specialization || 'Not specified'}</TableCell>
            <TableCell>
              <Box>
                <Typography variant="body2">
                  {teacher.activeCourses || 0} active
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {teacher.totalCourses || 0} total
                </Typography>
              </Box>
            </TableCell>
            <TableCell>{teacher.totalStudents || 0}</TableCell>
            <TableCell>
              <Box display="flex" alignItems="center">
                <Star color="warning" sx={{ mr: 0.5, fontSize: 16 }} />
                <Typography variant="body2">{teacher.rating || 'N/A'}</Typography>
              </Box>
            </TableCell>
            <TableCell>
              <Box display="flex" flexDirection="column" gap={0.5}>
                <Chip
                  label={teacher.isActive ? 'Active' : 'Inactive'}
                  color={teacher.isActive ? 'success' : 'default'}
                  size="small"
                />
                {teacher.profileStatus && (
                  <Chip
                    label={`Profile: ${teacher.profileStatus.charAt(0).toUpperCase() + teacher.profileStatus.slice(1)}`}
                    color={
                      teacher.profileStatus === 'approved' ? 'success' :
                      teacher.profileStatus === 'pending' ? 'warning' :
                      teacher.profileStatus === 'rejected' ? 'error' : 'default'
                    }
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </TableCell>
            <TableCell>{teacher.lastLogin ? formatDate(teacher.lastLogin) : 'Never'}</TableCell>
            <TableCell>
              <IconButton
                onClick={(e) => handleMenuClick(e, teacher)}
              >
                <MoreVert />
              </IconButton>
            </TableCell>
          </TableRow>
        ))
      );
    }
  };

  // Use statistics from API or calculate from current data
  const totalTeachers = teacherStats?.totalTeachers || (teachers || []).length;
  const activeTeachers = teacherStats?.activeTeachers || (teachers || []).filter(t => t.isActive).length;
  const totalStudentsTaught = teacherStats?.totalStudentsTaught || (teachers || []).reduce((sum, teacher) => sum + (teacher.totalStudents || 0), 0);
  const totalActiveCourses = teacherStats?.totalActiveCourses || (teachers || []).reduce((sum, teacher) => sum + (teacher.activeCourses || 0), 0);

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
          Teacher Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all teachers, view their courses, and monitor student engagement.
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

      {/* Teacher Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Person color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{totalTeachers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Teachers
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
                  <Typography variant="h4">{activeTeachers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Teachers
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
                <Group color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{totalStudentsTaught}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students Taught
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
                <School color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{totalActiveCourses}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Courses
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Teacher Management Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="All Teachers" />
          <Tab
            label={
              <Badge badgeContent={pendingCount} color="error">
                Pending Approval
              </Badge>
            }
          />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Paper>

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search teachers by name, email, or specialization..."
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
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPage(0);
              }}
            >
              Clear
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="body2" color="text.secondary">
              Showing {(teachers || []).length} of {totalTeachersCount} teachers
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Teachers Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {currentTab === 1 ? (
                  // Pending Approval Headers
                  <>
                    <TableCell>Teacher</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Specialization</TableCell>
                    <TableCell>Experience</TableCell>
                    <TableCell>Teaching Areas</TableCell>
                    <TableCell>Hourly Rate</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </>
                ) : (
                  // Regular Teachers Headers
                  <>
                    <TableCell>Teacher</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Specialization</TableCell>
                    <TableCell>Courses</TableCell>
                    <TableCell>Students</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Actions</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                renderTableContent()
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalTeachersCount}
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
        <MenuItem onClick={handleViewTeacher}>
          <Person sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleViewSessions}>
          <VideoCall sx={{ mr: 1 }} />
          View Sessions
        </MenuItem>
        <MenuItem onClick={handleApproveTeacher}>
          <School sx={{ mr: 1 }} />
          Review Profile
        </MenuItem>
        <MenuItem onClick={handleEditTeacher}>
          <Edit sx={{ mr: 1 }} />
          Edit Teacher
        </MenuItem>
        <MenuItem onClick={handleToggleTeacherStatus}>
          {selectedTeacher?.isActive ? (
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

      {/* View Teacher Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          clearTeacherSelection();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Teacher Details</DialogTitle>
        <DialogContent>
          {selectedTeacher && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar
                      src={selectedTeacher.avatar || undefined}
                      sx={{ mr: 2, width: 64, height: 64 }}
                    >
                      {selectedTeacher.firstName ? selectedTeacher.firstName.charAt(0) : 'T'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedTeacher.firstName || 'Unknown'} {selectedTeacher.lastName || ''}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedTeacher.specialization || 'Not specified'}
                      </Typography>
                      <Box display="flex" alignItems="center" mt={1}>
                        <Star color="warning" sx={{ mr: 0.5, fontSize: 16 }} />
                        <Typography variant="body2">{selectedTeacher.rating || 'N/A'} rating</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography variant="body2"><strong>Email:</strong> {selectedTeacher.email || 'No email'}</Typography>
                  <Typography variant="body2"><strong>Teacher ID:</strong> {selectedTeacher._id ? selectedTeacher._id.slice(-8) : 'N/A'}</Typography>
                  <Typography variant="body2"><strong>Joined:</strong> {selectedTeacher.createdAt ? formatDate(selectedTeacher.createdAt) : 'Unknown'}</Typography>
                  <Typography variant="body2"><strong>Last Login:</strong> {selectedTeacher.lastLogin ? formatDate(selectedTeacher.lastLogin) : 'Never'}</Typography>
                  <Typography variant="body2"><strong>Account Status:</strong>
                    <Chip
                      label={selectedTeacher.isActive ? 'Active' : 'Inactive'}
                      color={selectedTeacher.isActive ? 'success' : 'default'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                  {selectedTeacher.profileStatus && (
                    <Typography variant="body2" sx={{ mt: 1 }}><strong>Profile Status:</strong>
                      <Chip
                        label={selectedTeacher.profileStatus.charAt(0).toUpperCase() + selectedTeacher.profileStatus.slice(1)}
                        color={
                          selectedTeacher.profileStatus === 'approved' ? 'success' :
                          selectedTeacher.profileStatus === 'pending' ? 'warning' :
                          selectedTeacher.profileStatus === 'rejected' ? 'error' : 'default'
                        }
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Statistics</Typography>
                  <Box mb={2}>
                    <Typography variant="body2">Total Students Taught</Typography>
                    <Typography variant="h4" color="primary">{selectedTeacher.totalStudents || 0}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2">Active Courses</Typography>
                    <Typography variant="h4" color="success.main">{selectedTeacher.activeCourses || 0}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2">Total Courses</Typography>
                    <Typography variant="h4">{selectedTeacher.totalCourses || 0}</Typography>
                  </Box>
                  <Box mb={2}>
                    <Typography variant="body2">Total Earnings</Typography>
                    <Typography variant="h4" color="warning.main">${selectedTeacher.totalEarnings || 0}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Courses</Typography>
                  <List>
                    {(selectedTeacher.courses || []).map((course: any, index: number) => (
                      <React.Fragment key={course.id}>
                        <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                          <ListItemAvatar>
                            <Avatar>
                              <School />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={course.title || 'Untitled Course'}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {course.students || 0} students enrolled
                                </Typography>
                                <Chip
                                  label={course.status ? course.status.charAt(0).toUpperCase() + course.status.slice(1) : 'Unknown'}
                                  size="small"
                                  color={
                                    course.status === 'active' ? 'success' :
                                    course.status === 'completed' ? 'info' :
                                    course.status === 'rejected' ? 'error' : 'default'
                                  }
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < (selectedTeacher.courses || []).length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedTeacher?.profileStatus === 'pending' && (
            <Button
              color="primary"
              variant="outlined"
              onClick={() => {
                setViewDialogOpen(false);
                handleApproveTeacher();
              }}
            >
              Review Profile
            </Button>
          )}

          {selectedTeacher && (
            <Button
              color={selectedTeacher.isActive ? 'error' : 'success'}
              variant="outlined"
              onClick={() => {
                setViewDialogOpen(false);
                handleToggleTeacherStatus();
              }}
              startIcon={selectedTeacher.isActive ? <Block /> : <CheckCircle />}
            >
              {selectedTeacher.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )}

          <Button onClick={() => {
            setViewDialogOpen(false);
            clearTeacherSelection();
          }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Teacher Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onClose={() => {
          setDeactivateDialogOpen(false);
          clearTeacherSelection();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Deactivate Teacher</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to deactivate <strong>"{selectedTeacher?.firstName} {selectedTeacher?.lastName}"</strong>?
          </Typography>

          {selectedTeacher && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
              <Typography variant="body2" color="warning.dark" gutterBottom>
                <strong>Warning:</strong> Deactivating this teacher will:
              </Typography>
              <Typography variant="body2" color="warning.dark" component="ul" sx={{ ml: 2 }}>
                <li>Prevent them from accessing their account</li>
                <li>Stop them from conducting live sessions</li>
                <li>Make their courses unavailable to new students</li>
                {selectedTeacher.activeCourses > 0 && (
                  <li><strong>{selectedTeacher.activeCourses} active course(s) will be affected</strong></li>
                )}
                {selectedTeacher.totalStudents > 0 && (
                  <li><strong>{selectedTeacher.totalStudents} student(s) will lose access</strong></li>
                )}
              </Typography>
            </Box>
          )}

          <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
            You can reactivate the teacher later if needed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeactivateDialogOpen(false);
            clearTeacherSelection();
          }}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={confirmDeactivateTeacher}
            disabled={loading}
          >
            {loading ? 'Deactivating...' : 'Deactivate Teacher'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Teacher Sessions Dialog */}
      <Dialog
        open={sessionsDialogOpen}
        onClose={() => {
          setSessionsDialogOpen(false);
          clearTeacherSelection();
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          {selectedTeacher && `${selectedTeacher.firstName} ${selectedTeacher.lastName}'s Live Sessions`}
        </DialogTitle>
        <DialogContent>
          {sessionsLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              {teacherSessions.length === 0 ? (
                <Typography variant="body1" color="text.secondary" align="center">
                  No sessions found for this teacher.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {teacherSessions.map((session) => (
                    <Grid item xs={12} md={6} key={session._id}>
                      <Card>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                            <Typography variant="h6" component="div">
                              {session.title}
                            </Typography>
                            <Chip
                              label={liveSessionService.formatSessionStatus(session.status).label}
                              color={liveSessionService.formatSessionStatus(session.status).color}
                              size="small"
                            />
                          </Box>

                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {session.description || 'No description'}
                          </Typography>

                          <Divider sx={{ my: 1 }} />

                          <Box display="flex" flexDirection="column" gap={1}>
                            <Typography variant="body2">
                              <strong>Course:</strong> {session.course?.title || 'No course'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Scheduled:</strong> {new Date(session.scheduledTime).toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Duration:</strong> {liveSessionService.formatDuration(session.duration)}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Participants:</strong> {session.participants?.length || 0} registered
                            </Typography>
                            <Typography variant="body2">
                              <strong>Attendees:</strong> {session.attendees?.filter(a => a.participated).length || 0} attended
                            </Typography>
                            {session.status === 'live' && (
                              <Typography variant="body2" color="success.main">
                                <strong>Status:</strong> {liveSessionService.getSessionTimeStatus(session)}
                              </Typography>
                            )}
                          </Box>

                          <Box display="flex" gap={1} mt={2}>
                            {session.status === 'live' && (
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                onClick={() => handleForceEndSession(session._id)}
                              >
                                Force End
                              </Button>
                            )}
                            {session.status === 'scheduled' && (
                              <Button
                                size="small"
                                color="warning"
                                variant="outlined"
                                onClick={() => handleCancelSession(session._id)}
                              >
                                Cancel
                              </Button>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleViewSessionDetails(session._id)}
                            >
                              View Details
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setSessionsDialogOpen(false);
            clearTeacherSelection();
          }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Teacher Profile Approval Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => {
          setApprovalDialogOpen(false);
          clearTeacherSelection();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTeacher && `Review ${selectedTeacher.firstName} ${selectedTeacher.lastName}'s Profile`}
        </DialogTitle>
        <DialogContent>
          {profileLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : selectedTeacherProfile ? (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Profile Status */}
                <Grid item xs={12}>
                  <Card sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Profile Status</Typography>
                        <Chip
                          label={selectedTeacherProfile.profileStatus.charAt(0).toUpperCase() + selectedTeacherProfile.profileStatus.slice(1)}
                          color={
                            selectedTeacherProfile.profileStatus === 'approved' ? 'success' :
                            selectedTeacherProfile.profileStatus === 'pending' ? 'warning' :
                            selectedTeacherProfile.profileStatus === 'rejected' ? 'error' : 'default'
                          }
                        />
                      </Box>
                      {selectedTeacherProfile.submittedAt && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Submitted: {new Date(selectedTeacherProfile.submittedAt).toLocaleString()}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Personal Information */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Personal Information</Typography>
                      <Typography variant="body2"><strong>Phone:</strong> {selectedTeacherProfile.phone || 'Not provided'}</Typography>
                      <Typography variant="body2"><strong>Bio:</strong></Typography>
                      <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
                        {selectedTeacherProfile.bio || 'No bio provided'}
                      </Typography>
                      {selectedTeacherProfile.socialLinks && (
                        <>
                          <Typography variant="body2"><strong>Social Links:</strong></Typography>
                          {selectedTeacherProfile.socialLinks.linkedin && (
                            <Typography variant="body2">LinkedIn: {selectedTeacherProfile.socialLinks.linkedin}</Typography>
                          )}
                          {selectedTeacherProfile.socialLinks.portfolio && (
                            <Typography variant="body2">Portfolio: {selectedTeacherProfile.socialLinks.portfolio}</Typography>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Professional Background */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Professional Background</Typography>
                      <Typography variant="body2"><strong>Experience:</strong> {selectedTeacherProfile.experience} years</Typography>
                      <Typography variant="body2"><strong>Hourly Rate:</strong> ${selectedTeacherProfile.hourlyRate || 'Not set'}</Typography>

                      <Typography variant="body2" sx={{ mt: 2 }}><strong>Education:</strong></Typography>
                      {selectedTeacherProfile.education.map((edu, index) => (
                        <Box key={index} sx={{ ml: 2, mt: 1 }}>
                          <Typography variant="body2">
                            {edu.degree} from {edu.institution} ({edu.year})
                            {edu.field && ` - ${edu.field}`}
                          </Typography>
                        </Box>
                      ))}

                      <Typography variant="body2" sx={{ mt: 2 }}><strong>Skills:</strong></Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                        {selectedTeacherProfile.skills.map((skill, index) => (
                          <Chip key={index} label={skill} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Teaching Expertise */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Teaching Expertise</Typography>

                      <Typography variant="body2"><strong>Specializations:</strong></Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} sx={{ mt: 1, mb: 2 }}>
                        {selectedTeacherProfile.specialization.map((spec, index) => (
                          <Chip key={index} label={spec} color="primary" size="small" />
                        ))}
                      </Box>

                      <Typography variant="body2"><strong>Teaching Areas:</strong></Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} sx={{ mt: 1, mb: 2 }}>
                        {selectedTeacherProfile.teachingAreas.map((area, index) => (
                          <Chip key={index} label={area} color="secondary" size="small" />
                        ))}
                      </Box>

                      <Typography variant="body2"><strong>Preferred Levels:</strong></Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} sx={{ mt: 1 }}>
                        {selectedTeacherProfile.preferredLevels.map((level, index) => (
                          <Chip key={index} label={level} variant="outlined" size="small" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Previous Feedback */}
                {(selectedTeacherProfile.adminFeedback || selectedTeacherProfile.rejectionReason) && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>Previous Review</Typography>
                        {selectedTeacherProfile.rejectionReason && (
                          <Typography variant="body2" color="error.main">
                            <strong>Rejection Reason:</strong> {selectedTeacherProfile.rejectionReason}
                          </Typography>
                        )}
                        {selectedTeacherProfile.adminFeedback && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Admin Feedback:</strong> {selectedTeacherProfile.adminFeedback}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body1" color="text.secondary" align="center">
                No profile found for this teacher. The teacher may not have completed their profile yet.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setApprovalDialogOpen(false);
            clearTeacherSelection();
          }}>Close</Button>
          {selectedTeacherProfile && selectedTeacherProfile.profileStatus === 'pending' && (
            <>
              <Button
                color="error"
                onClick={() => {
                  const reason = prompt('Please provide a reason for rejection:');
                  if (reason) {
                    rejectTeacherProfile(reason);
                  }
                }}
              >
                Reject
              </Button>
              <Button
                color="success"
                variant="contained"
                onClick={approveTeacherProfile}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherManagement;

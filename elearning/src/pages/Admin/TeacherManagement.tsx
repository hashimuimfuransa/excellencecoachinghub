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
  VideoCall,
  Download,
  Visibility,
  Close,
  Delete,
  CloudUpload,
  Description,
  Email,
  Phone,
  LocationOn
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
  const [cvUploadDialogOpen, setCvUploadDialogOpen] = useState(false);
  
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvUploading, setCvUploading] = useState(false);
  
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [approvalFeedback, setApprovalFeedback] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Teacher profile state
  const [selectedTeacherProfile, setSelectedTeacherProfile] = useState<ITeacherProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Edit teacher state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    specialization: '',
    bio: '',
    isActive: true
  });
  const [editLoading, setEditLoading] = useState(false);

  // Live sessions state
  const [teacherSessions, setTeacherSessions] = useState<ILiveSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Load teachers and statistics
  const loadTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (currentTab === 1) {
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
          teacherProfileService.getAllProfiles({ status: 'pending', limit: 1 })
        ]);

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

  // Handle teacher actions - Load full teacher profile from backend
  const handleViewTeacher = async () => {
    console.log('View teacher called, selectedTeacher:', selectedTeacher);
    handleMenuClose(); // Close menu first
    
    if (selectedTeacher) {
      try {
        setProfileLoading(true);
        // Fetch the full profile by teacher ID to get complete profile data
        if (selectedTeacher.profileId) {
          const fullProfile = await teacherProfileService.getProfileById(selectedTeacher.profileId);
          setSelectedTeacherProfile(fullProfile);
        } else {
          // If no profileId, try to load by searching
          const profiles = await teacherProfileService.getAllProfiles({
            search: selectedTeacher._id,
            limit: 1
          });
          if (profiles.profiles.length > 0) {
            setSelectedTeacherProfile(profiles.profiles[0]);
          }
        }
      } catch (err) {
        console.error('Error loading full teacher profile:', err);
        // Still open the dialog with basic info if profile load fails
      } finally {
        setProfileLoading(false);
      }
    }
    
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

  // Load teacher profile for approval - Now loads FULL profile by ID
  const loadTeacherProfile = async (profileId: string) => {
    try {
      setProfileLoading(true);
      // Fetch the full profile by ID to ensure we get all profile details
      const profile = await teacherProfileService.getProfileById(profileId);
      setSelectedTeacherProfile(profile);
    } catch (err) {
      console.error('Error loading full teacher profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load teacher profile');
      setSelectedTeacherProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  // Load pending teacher profile approvals
  const loadPendingApprovals = async () => {
    try {
      const response = await teacherProfileService.getAllProfiles({
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        status: 'pending'
      });
      setPendingApprovals(response.profiles);
      setPendingCount(response.pagination.totalProfiles);
    } catch (err) {
      console.error('Error loading pending approvals:', err);
      setError(err instanceof Error ? err.message : 'Failed to load pending approvals');
    }
  };

  // CV handling functions
  const handleCvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('CV file must be less than 10MB');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a PDF or Word document for CV');
        return;
      }

      setCvFile(file);
    }
  };

  const uploadCvForTeacher = async () => {
    if (!cvFile || !selectedTeacherProfile) return;

    setCvUploading(true);
    try {
      const formData = new FormData();
      formData.append('cv', cvFile);
      formData.append('teacherId', selectedTeacherProfile._id);

      const response = await teacherProfileService.uploadCV(formData);
      if (response.success) {
        setSuccess('CV uploaded successfully');
        setCvFile(null);
        setCvUploadDialogOpen(false);
        // Reload the profile to show updated CV
        await loadTeacherProfile(selectedTeacherProfile.userId as string);
      } else {
        setError(response.error || 'Failed to upload CV');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload CV');
    } finally {
      setCvUploading(false);
    }
  };

  const downloadCv = async (cvUrl: string, filename: string) => {
    try {
      const response = await fetch(cvUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download CV');
    }
  };

  const viewCv = (cvUrl: string) => {
    window.open(cvUrl, '_blank');
  };

  // Profile approval functions
  const handleApproveProfile = async () => {
    if (!selectedTeacherProfile) return;

    try {
      await teacherProfileService.approveProfile(selectedTeacherProfile._id, {
        feedback: approvalFeedback
      });
      setSuccess('Teacher profile approved successfully');
      setApprovalDialogOpen(false);
      setApprovalFeedback('');
      // Reload data
      loadTeachers();
      loadPendingApprovals();
    } catch (err: any) {
      setError(err.message || 'Failed to approve profile');
    }
  };

  const handleRejectProfile = async () => {
    if (!selectedTeacherProfile || !approvalReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      await teacherProfileService.rejectProfile(selectedTeacherProfile._id, {
        reason: approvalReason,
        feedback: approvalFeedback
      });
      setSuccess('Teacher profile rejected');
      setApprovalDialogOpen(false);
      setApprovalFeedback('');
      setApprovalReason('');
      // Reload data
      loadTeachers();
      loadPendingApprovals();
    } catch (err: any) {
      setError(err.message || 'Failed to reject profile');
    }
  };

  const openApprovalDialog = (profile: ITeacherProfile, action: 'approve' | 'reject') => {
    setSelectedTeacherProfile(profile);
    setApprovalAction(action);
  };

  // Handle teacher approval - Load and review full profile
  const handleApproveTeacher = async () => {
    if (selectedTeacher) {
      handleMenuClose(); // Close menu first
      
      try {
        setProfileLoading(true);
        // Try to get profile by profileId first, then fall back to search
        let profile: ITeacherProfile | null = null;
        
        if (selectedTeacher.profileId) {
          profile = await teacherProfileService.getProfileById(selectedTeacher.profileId);
        } else {
          const profilesByUser = await teacherProfileService.getAllProfiles({
            userId: selectedTeacher._id,
            limit: 1
          });

          if (profilesByUser.profiles.length > 0) {
            profile = profilesByUser.profiles[0];
          } else {
            const profilesBySearch = await teacherProfileService.getAllProfiles({
              search: selectedTeacher._id,
              limit: 1
            });

            if (profilesBySearch.profiles.length > 0) {
              profile = profilesBySearch.profiles[0];
            }
          }
        }
        
        if (profile) {
          setSelectedTeacherProfile(profile);
          setApprovalDialogOpen(true);
        } else {
          setError('No profile found for this teacher');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load teacher profile');
      } finally {
        setProfileLoading(false);
      }
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
    if (selectedTeacher) {
      handleMenuClose();
      setEditData({
        firstName: selectedTeacher.firstName || '',
        lastName: selectedTeacher.lastName || '',
        email: selectedTeacher.email || '',
        specialization: selectedTeacher.specialization || '',
        bio: selectedTeacher.bio || '',
        isActive: selectedTeacher.isActive || true
      });
      setEditDialogOpen(true);
    } else {
      handleMenuClose();
      setError('No teacher selected for editing');
    }
  };

  const handleDeleteTeacher = () => {
    if (selectedTeacher) {
      handleMenuClose();
      setDeleteDialogOpen(true);
    } else {
      handleMenuClose();
      setError('No teacher selected for deletion');
    }
  };

  // Save edited teacher data
  const handleSaveTeacherEdit = async () => {
    if (!selectedTeacher) {
      setError('No teacher selected');
      return;
    }

    try {
      setEditLoading(true);
      // Call teacher service to update teacher information
      await teacherService.updateTeacher(selectedTeacher._id, {
        firstName: editData.firstName,
        lastName: editData.lastName,
        email: editData.email,
        specialization: editData.specialization,
        bio: editData.bio,
        isActive: editData.isActive
      });
      
      setSuccess('Teacher information updated successfully');
      setEditDialogOpen(false);
      loadTeachers(); // Refresh the list
      clearTeacherSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update teacher');
    } finally {
      setEditLoading(false);
    }
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
      loadTeachers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate teacher');
    } finally {
      setLoading(false);
    }
    setDeactivateDialogOpen(false);
    clearTeacherSelection();
  };

  const confirmDeleteTeacher = async () => {
    if (!selectedTeacher) {
      setError('No teacher selected');
      setDeleteDialogOpen(false);
      return;
    }

    try {
      setDeleteLoading(true);
      await teacherService.deleteTeacher(selectedTeacher._id);
      setSuccess(`${selectedTeacher.firstName} ${selectedTeacher.lastName} has been deleted successfully`);
      loadTeachers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete teacher');
    } finally {
      setDeleteLoading(false);
    }
    setDeleteDialogOpen(false);
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
                onClick={async () => {
                  setSelectedTeacherProfile(profile);
                  setProfileLoading(true);
                  setApprovalDialogOpen(true);
                  // Load full profile details if needed
                  try {
                    const fullProfile = await teacherProfileService.getProfileById(profile._id);
                    setSelectedTeacherProfile(fullProfile);
                  } catch (err) {
                    console.error('Error loading full profile:', err);
                  } finally {
                    setProfileLoading(false);
                  }
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
        <MenuItem onClick={handleDeleteTeacher}>
          <Delete sx={{ mr: 1 }} />
          Delete Teacher
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

      {/* Enhanced Teacher Profile Approval Dialog */}
      <Dialog
        open={approvalDialogOpen}
        onClose={() => {
          setApprovalDialogOpen(false);
          setSelectedTeacherProfile(null);
          setApprovalFeedback('');
          setApprovalReason('');
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {selectedTeacherProfile && 
                `Review ${typeof selectedTeacherProfile.userId === 'object' ? 
                  `${selectedTeacherProfile.userId.firstName} ${selectedTeacherProfile.userId.lastName}` : 
                  'Teacher'}'s Profile`
              }
            </Typography>
            {selectedTeacherProfile && (
              <Chip
                label={selectedTeacherProfile.profileStatus.charAt(0).toUpperCase() + selectedTeacherProfile.profileStatus.slice(1)}
                color={
                  selectedTeacherProfile.profileStatus === 'approved' ? 'success' :
                  selectedTeacherProfile.profileStatus === 'pending' ? 'warning' :
                  selectedTeacherProfile.profileStatus === 'rejected' ? 'error' : 'default'
                }
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {profileLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : selectedTeacherProfile ? (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Contact Information */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Person sx={{ mr: 1 }} />
                        Contact Information
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Email sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {typeof selectedTeacherProfile.userId === 'object' ? 
                            selectedTeacherProfile.userId.email : 'No email'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Phone sx={{ mr: 1, fontSize: 16 }} />
                        <Typography variant="body2">
                          {selectedTeacherProfile.phone || 'Not provided'}
                        </Typography>
                      </Box>
                      {selectedTeacherProfile.address && (
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <LocationOn sx={{ mr: 1, fontSize: 16, mt: 0.2 }} />
                          <Typography variant="body2">
                            {[
                              selectedTeacherProfile.address.village,
                              selectedTeacherProfile.address.cell,
                              selectedTeacherProfile.address.sector,
                              selectedTeacherProfile.address.district,
                              selectedTeacherProfile.address.province,
                              selectedTeacherProfile.address.country
                            ].filter(Boolean).join(', ')}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        <strong>National ID:</strong> {selectedTeacherProfile.nationalId || 'Not provided'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date of Birth:</strong> {selectedTeacherProfile.dateOfBirth ? 
                          new Date(selectedTeacherProfile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Professional Information */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <School sx={{ mr: 1 }} />
                        Professional Background
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Experience:</strong> {selectedTeacherProfile.experience} years
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Hourly Rate:</strong> ${selectedTeacherProfile.hourlyRate || 'Not set'}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1 }}>
                        <strong>Payment Type:</strong> {selectedTeacherProfile.paymentType || 'Not specified'}
                      </Typography>
                      
                      <Typography variant="body2" sx={{ mt: 2, mb: 1 }}><strong>Specialization:</strong></Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                        {selectedTeacherProfile.specialization.map((spec, index) => (
                          <Chip key={index} label={spec} size="small" color="primary" variant="outlined" />
                        ))}
                      </Box>

                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Teaching Areas:</strong></Typography>
                      <Box display="flex" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
                        {selectedTeacherProfile.teachingAreas.map((area, index) => (
                          <Chip key={index} label={area} size="small" color="secondary" variant="outlined" />
                        ))}
                      </Box>

                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Preferred Levels:</strong></Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {selectedTeacherProfile.preferredLevels.map((level, index) => (
                          <Chip key={index} label={level} size="small" color="info" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Education & Skills */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Education & Skills</Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Education:</strong></Typography>
                      {selectedTeacherProfile.education.length > 0 ? (
                        selectedTeacherProfile.education.map((edu, index) => (
                          <Box key={index} sx={{ ml: 1, mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {edu.degree}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {edu.institution} • {edu.year}
                              {edu.field && ` • ${edu.field}`}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">No education information provided</Typography>
                      )}

                      <Typography variant="body2" sx={{ mt: 2, mb: 1 }}><strong>Skills:</strong></Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {selectedTeacherProfile.skills.map((skill, index) => (
                          <Chip key={index} label={skill} size="small" variant="outlined" />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                {/* CV and Documents */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Description sx={{ mr: 1 }} />
                        CV & Documents
                      </Typography>
                      
                      {selectedTeacherProfile.cvDocument ? (
                        <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
                          <Box display="flex" alignItems="center" justifyContent="space-between">
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {selectedTeacherProfile.cvDocument.originalName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Uploaded: {new Date(selectedTeacherProfile.cvDocument.uploadedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box>
                              <Button
                                size="small"
                                startIcon={<Visibility />}
                                onClick={() => viewCv(selectedTeacherProfile.cvDocument!.url)}
                                sx={{ mr: 1 }}
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Download />}
                                onClick={() => downloadCv(
                                  selectedTeacherProfile.cvDocument!.url,
                                  selectedTeacherProfile.cvDocument!.originalName
                                )}
                              >
                                Download
                              </Button>
                            </Box>
                          </Box>
                        </Box>
                      ) : (
                        <Box sx={{ p: 2, border: '1px dashed', borderColor: 'warning.main', borderRadius: 1, mb: 2, bgcolor: 'warning.light' }}>
                          <Typography variant="body2" color="warning.dark" sx={{ mb: 1 }}>
                            No CV uploaded
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            onClick={() => setCvUploadDialogOpen(true)}
                          >
                            Upload CV for Teacher
                          </Button>
                        </Box>
                      )}

                      {selectedTeacherProfile.profilePicture && (
                        <Box sx={{ textAlign: 'center', mt: 2 }}>
                          <Typography variant="body2" sx={{ mb: 1 }}><strong>Profile Picture:</strong></Typography>
                          <Avatar
                            src={selectedTeacherProfile.profilePicture}
                            sx={{ width: 80, height: 80, mx: 'auto' }}
                          />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Bio and Social Links */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>Bio & Social Links</Typography>
                      
                      <Typography variant="body2" sx={{ mb: 1 }}><strong>Bio:</strong></Typography>
                      <Typography variant="body2" sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        {selectedTeacherProfile.bio || 'No bio provided'}
                      </Typography>

                      {selectedTeacherProfile.socialLinks && (
                        <>
                          <Typography variant="body2" sx={{ mb: 1 }}><strong>Social Links:</strong></Typography>
                          {selectedTeacherProfile.socialLinks.linkedin && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>LinkedIn:</strong> 
                              <Button 
                                size="small" 
                                href={selectedTeacherProfile.socialLinks.linkedin} 
                                target="_blank"
                                sx={{ ml: 1 }}
                              >
                                View Profile
                              </Button>
                            </Typography>
                          )}
                          {selectedTeacherProfile.socialLinks.github && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>GitHub:</strong> 
                              <Button 
                                size="small" 
                                href={selectedTeacherProfile.socialLinks.github} 
                                target="_blank"
                                sx={{ ml: 1 }}
                              >
                                View Profile
                              </Button>
                            </Typography>
                          )}
                          {selectedTeacherProfile.socialLinks.portfolio && (
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Portfolio:</strong> 
                              <Button 
                                size="small" 
                                href={selectedTeacherProfile.socialLinks.portfolio} 
                                target="_blank"
                                sx={{ ml: 1 }}
                              >
                                View Portfolio
                              </Button>
                            </Typography>
                          )}
                          {selectedTeacherProfile.socialLinks.website && (
                            <Typography variant="body2">
                              <strong>Website:</strong> 
                              <Button 
                                size="small" 
                                href={selectedTeacherProfile.socialLinks.website} 
                                target="_blank"
                                sx={{ ml: 1 }}
                              >
                                Visit Website
                              </Button>
                            </Typography>
                          )}
                        </>
                      )}
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
            setSelectedTeacherProfile(null);
            setApprovalFeedback('');
            setApprovalReason('');
          }}>Close</Button>
          {selectedTeacherProfile && selectedTeacherProfile.profileStatus === 'pending' && (
            <>
              <Button
                color="error"
                startIcon={<Close />}
                onClick={() => openApprovalDialog(selectedTeacherProfile, 'reject')}
              >
                Reject
              </Button>
              <Button
                color="success"
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={() => openApprovalDialog(selectedTeacherProfile, 'approve')}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* CV Upload Dialog */}
      <Dialog
        open={cvUploadDialogOpen}
        onClose={() => {
          setCvUploadDialogOpen(false);
          setCvFile(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload CV for Teacher</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Upload a CV document for this teacher. Accepted formats: PDF, DOC, DOCX (Max 10MB)
            </Typography>
            
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleCvUpload}
              style={{ display: 'none' }}
              id="cv-upload-input"
            />
            <label htmlFor="cv-upload-input">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Choose CV File
              </Button>
            </label>

            {cvFile && (
              <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Selected: {cvFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Size: {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCvUploadDialogOpen(false);
            setCvFile(null);
          }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={uploadCvForTeacher}
            disabled={!cvFile || cvUploading}
            startIcon={cvUploading ? <CircularProgress size={20} /> : <CloudUpload />}
          >
            {cvUploading ? 'Uploading...' : 'Upload CV'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          clearTeacherSelection();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Teacher Information</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              value={editData.firstName}
              onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
            />
            <TextField
              fullWidth
              label="Last Name"
              value={editData.lastName}
              onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Specialization"
              value={editData.specialization}
              onChange={(e) => setEditData({ ...editData, specialization: e.target.value })}
              placeholder="e.g., Mathematics, Physics, etc."
            />
            <TextField
              fullWidth
              label="Bio"
              multiline
              rows={3}
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              placeholder="Brief bio or professional description"
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">Account Status:</Typography>
              <Chip
                label={editData.isActive ? 'Active' : 'Inactive'}
                color={editData.isActive ? 'success' : 'default'}
                onClick={() => setEditData({ ...editData, isActive: !editData.isActive })}
                clickable
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditDialogOpen(false);
            clearTeacherSelection();
          }}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveTeacherEdit}
            disabled={editLoading}
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          clearTeacherSelection();
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Teacher</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to permanently delete <strong>"{selectedTeacher?.firstName} {selectedTeacher?.lastName}"</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone and will remove the teacher's account, associated courses, and data.
            </Typography>
            <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
              Removing a teacher may impact linked courses and student enrollments.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            clearTeacherSelection();
          }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={confirmDeleteTeacher}
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} /> : <Delete />}
          >
            {deleteLoading ? 'Deleting...' : 'Delete Teacher'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={approvalAction !== null && selectedTeacherProfile !== null}
        onClose={() => {
          setApprovalAction('approve');
          setApprovalFeedback('');
          setApprovalReason('');
          setSelectedTeacherProfile(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {approvalAction === 'approve' ? 'Approve Teacher Profile' : 'Reject Teacher Profile'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {approvalAction === 'approve' 
                ? 'Are you sure you want to approve this teacher profile?' 
                : 'Please provide a reason for rejecting this teacher profile:'}
            </Typography>

            {approvalAction === 'reject' && (
              <TextField
                fullWidth
                label="Rejection Reason *"
                multiline
                rows={3}
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
            )}

            <TextField
              fullWidth
              label={approvalAction === 'approve' ? 'Approval Message (Optional)' : 'Additional Feedback (Optional)'}
              multiline
              rows={3}
              value={approvalFeedback}
              onChange={(e) => setApprovalFeedback(e.target.value)}
              placeholder={approvalAction === 'approve' 
                ? 'Welcome message or additional notes...' 
                : 'Additional feedback for improvement...'}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setApprovalDialogOpen(false);
            setApprovalFeedback('');
            setApprovalReason('');
          }}>Cancel</Button>
          <Button
            variant="contained"
            color={approvalAction === 'approve' ? 'success' : 'error'}
            onClick={approvalAction === 'approve' ? handleApproveProfile : handleRejectProfile}
            startIcon={approvalAction === 'approve' ? <CheckCircle /> : <Close />}
          >
            {approvalAction === 'approve' ? 'Approve Profile' : 'Reject Profile'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherManagement;

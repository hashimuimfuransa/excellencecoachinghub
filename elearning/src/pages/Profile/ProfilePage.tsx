import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Paper,
  LinearProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Autocomplete,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stepper,
  Step,
  StepLabel,
  StepContent
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Email,
  Person,
  AdminPanelSettings,
  Security,
  Visibility,
  VisibilityOff,
  CalendarToday,
  Badge,
  TrendingUp,
  Settings,
  Notifications,
  Shield,
  Key,
  AccountCircle,
  Dashboard,
  Analytics,
  School,
  Work,
  LocationOn,
  Phone,
  Language,
  Psychology,
  ExpandMore,
  Add,
  Delete,
  CheckCircle,
  Warning,
  Info
} from '@mui/icons-material';

import { useAuth } from '../../hooks/useAuth';
import { userService, UpdateProfileData, ChangePasswordData } from '../../services/userService';
import { studentProfileService, IUpdateStudentProfileData } from '../../services/studentProfileService';
import { IUser, IStudentProfile, UserRole } from '../../shared/types';
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { useResponsive } from '../../utils/responsive';
import { isLearnerRole } from '../../utils/roleUtils';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  // Profile editing state
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState<UpdateProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  // Student profile state
  const [studentProfile, setStudentProfile] = useState<IStudentProfile | null>(null);
  const [editingStudentProfile, setEditingStudentProfile] = useState(false);
  const [studentProfileData, setStudentProfileData] = useState<IUpdateStudentProfileData>({});
  const [profileCompletion, setProfileCompletion] = useState({
    percentage: 0,
    missingFields: [] as string[],
    isComplete: false
  });

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Profile stats (mock data for now)
  const [profileStats] = useState({
    totalLogins: 156,
    lastLogin: new Date().toISOString(),
    accountAge: 45, // days
    securityScore: 85,
    actionsPerformed: 1234,
    systemsManaged: 8
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    }
  }, [user]);

  // Listen for profile update events to refresh data
  useEffect(() => {
    const handleProfileUpdate = () => {
      // Reload profile data when updated
      if (user) {
        const loadStudentProfile = async () => {
          const userRoleString = String(user?.role).toLowerCase();
          const userIsStudent = isLearnerRole(user?.role);
          
          if (userIsStudent) {
            try {
              const response = await studentProfileService.getMyProfile();
              setStudentProfile(response.profile);
              setProfileCompletion({
                percentage: response.completionPercentage,
                missingFields: response.missingFields,
                isComplete: response.completionPercentage === 100
              });
            } catch (error) {
              console.error('Failed to reload student profile:', error);
            }
          }
        };
        loadStudentProfile();
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user]);

  // Load student profile if user is a student
  useEffect(() => {
    const loadStudentProfile = async () => {
      console.log('🔍 Loading student profile - User role:', user?.role);
      const userRoleString = String(user?.role).toLowerCase();
      const userIsStudent = isLearnerRole(user?.role);
      
      if (userIsStudent) {
        try {
          console.log('✅ User is a student, loading profile...');
          const response = await studentProfileService.getMyProfile();
          setStudentProfile(response.profile);
          setProfileCompletion({
            percentage: response.completionPercentage,
            missingFields: response.missingFields,
            isComplete: response.completionPercentage === 100
          });
        } catch (error) {
          console.error('Failed to load student profile:', error);
          // Profile might not exist yet, that's okay
        }
      } else {
        console.log('❌ User is not a student, skipping profile load. Role:', user?.role);
      }
    };

    if (user) {
      loadStudentProfile();
    }
  }, [user]);

  // Clear alerts after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleProfileEdit = () => {
    setEditingProfile(true);
    
    // Also enable student profile editing if user is a student
    if (isStudent) {
      handleStudentProfileEdit();
    }
  };

  const handleProfileCancel = () => {
    setEditingProfile(false);
    
    // Also cancel student profile editing if user is a student
    if (isStudent) {
      handleStudentProfileCancel();
    }
    
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      });
    }
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const updatedUser = await userService.updateProfile(profileData);
      updateUser(updatedUser);
      setEditingProfile(false);
      
      // Also save student profile if user is a student and student profile is being edited
      if (isStudent && editingStudentProfile) {
        await handleStudentProfileSave();
      }
      
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Student profile handlers
  const handleStudentProfileEdit = () => {
    if (studentProfile) {
      setStudentProfileData({
        // Map to backend fields
        age: studentProfile.age,
        educationLevel: (studentProfile as any).educationLevel || studentProfile.currentEducationLevel,
        jobInterests: (studentProfile as any).jobInterests || studentProfile.academicInterests || [],
        careerGoals: Array.isArray(studentProfile.careerGoals) ? 
                     studentProfile.careerGoals.join(', ') : 
                     (studentProfile.careerGoals || ''),
        // Additional fields
        dateOfBirth: studentProfile.dateOfBirth,
        gender: studentProfile.gender,
        phone: studentProfile.phone,
        address: studentProfile.address,
        emergencyContact: studentProfile.emergencyContact,
        currentEducationLevel: studentProfile.currentEducationLevel,
        schoolName: studentProfile.schoolName,
        fieldOfStudy: studentProfile.fieldOfStudy,
        graduationYear: studentProfile.graduationYear,
        gpa: studentProfile.gpa,
        academicInterests: studentProfile.academicInterests || [],
        preferredCareerPath: studentProfile.preferredCareerPath || [],
        workExperience: studentProfile.workExperience || [],
        skills: studentProfile.skills || [],
        languages: studentProfile.languages || [],
        preferredLearningStyle: studentProfile.preferredLearningStyle,
        studySchedule: studentProfile.studySchedule,
        learningGoals: studentProfile.learningGoals || []
      });
    }
    setEditingStudentProfile(true);
  };

  const handleStudentProfileCancel = () => {
    setEditingStudentProfile(false);
    setStudentProfileData({});
  };

  const handleStudentProfileSave = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate profile data
      const validation = studentProfileService.validateProfileData(studentProfileData);
      if (!validation.isValid) {
        setError(validation.errors.join(', '));
        return;
      }

      // Calculate age if date of birth is provided
      if (studentProfileData.dateOfBirth) {
        studentProfileData.age = studentProfileService.calculateAge(studentProfileData.dateOfBirth);
      }

      const response = await studentProfileService.updateMyProfile(studentProfileData);
      setStudentProfile(response.profile);
      setProfileCompletion({
        percentage: response.completionPercentage,
        missingFields: response.missingFields,
        isComplete: response.completionPercentage === 100
      });
      setEditingStudentProfile(false);
      setStudentProfileData({});
      setSuccess('Student profile updated successfully');
      
      // Force refresh of profile data
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('profileUpdated'));
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update student profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }

      setLoading(true);
      setError(null);

      await userService.changePassword(passwordData);
      setPasswordDialogOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setSuccess('Password changed successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setError(null);
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setLoading(true);
      setError(null);

      const result = await userService.uploadAvatar(avatarFile);

      // Update the user context with the new user data from the upload response
      updateUser(result.user);

      // Update local profile data
      setProfileData(prev => ({
        ...prev,
        avatar: result.avatarUrl
      }));

      setAvatarFile(null);
      setAvatarPreview(null);
      setSuccess('Avatar updated successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  if (!user) {
    return (
      <ResponsiveDashboard>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </ResponsiveDashboard>
    );
  }

  // More robust role detection with string comparison
  const userRoleString = String(user.role || '').toLowerCase();
  
  // Proper role detection logic - NO FALLBACK
  const isStudent = isLearnerRole(user.role);
  const isTeacher = user.role === UserRole.TEACHER || userRoleString === 'teacher';
  const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN || userRoleString === 'admin' || userRoleString === 'super_admin';
  
  // Only show profile if user has a valid role
  const hasValidRole = isStudent || isTeacher || isAdmin;
  const finalIsStudent = isStudent;
  const finalIsTeacher = isTeacher;
  const finalIsAdmin = isAdmin;

  // Debug logging for role detection
  console.log('🔍 Profile Page - User Role Debug:', {
    userRole: user.role,
    userRoleType: typeof user.role,
    userRoleString: String(user.role),
    userRoleStringLower: userRoleString,
    UserRoleEnum: UserRole,
    STUDENT_VALUE: UserRole.STUDENT,
    TEACHER_VALUE: UserRole.TEACHER,
    ADMIN_VALUE: UserRole.ADMIN,
    isStudent,
    isTeacher,
    isAdmin,
    hasValidRole,
    finalIsStudent,
    finalIsTeacher,
    finalIsAdmin,
    userObject: user,
    localStorageUser: localStorage.getItem('user'),
    localStorageUserParsed: JSON.parse(localStorage.getItem('user') || '{}')
  });

  // Get appropriate title and description based on role
  const getProfileTitle = () => {
    if (finalIsStudent) return 'Student Profile';
    if (finalIsTeacher) return 'Teacher Profile';
    if (finalIsAdmin) return 'Admin Profile';
    return 'Profile'; // Only for valid roles
  };

  const getProfileDescription = () => {
    if (finalIsStudent) return 'Complete your student profile to get personalized learning recommendations';
    if (finalIsTeacher) return 'Manage your teacher profile and account settings';
    if (finalIsAdmin) return 'Manage your account settings and preferences';
    return 'Manage your account settings and preferences'; // Only for valid roles
  };

  // If no valid role is detected, show error message
  if (!hasValidRole) {
    return (
      <ResponsiveDashboard>
        <Box mb={4}>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom color="error">
            Profile Access Error
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Unable to determine your user role. Please contact support or try logging in again.
          </Typography>
          <Box mt={3}>
            <Typography variant="body2" color="text.secondary">
              Debug Information:
            </Typography>
            <Typography variant="caption" component="pre" sx={{ 
              backgroundColor: 'grey.100', 
              p: 2, 
              borderRadius: 1, 
              mt: 1,
              fontSize: '0.75rem',
              overflow: 'auto'
            }}>
              {JSON.stringify({
                userRole: user.role,
                userRoleType: typeof user.role,
                userRoleString: String(user.role),
                userRoleStringLower: userRoleString,
                hasValidRole,
                isStudent,
                isTeacher,
                isAdmin
              }, null, 2)}
            </Typography>
          </Box>
        </Box>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard>
      <Box mb={4}>
        <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
          {getProfileTitle()}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {getProfileDescription()}
        </Typography>
        
        {/* Profile Completion Progress for Students */}
        {finalIsStudent && (
          <Box mt={2}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Profile Completion
              </Typography>
              <Typography variant="body2" color="primary.main" fontWeight={600}>
                {profileCompletion.percentage}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={profileCompletion.percentage}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  backgroundColor: profileCompletion.percentage === 100 ? 'success.main' : 'primary.main'
                }
              }}
            />
            {profileCompletion.missingFields.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Missing: {profileCompletion.missingFields.slice(0, 3).join(', ')}
                {profileCompletion.missingFields.length > 3 && ` and ${profileCompletion.missingFields.length - 3} more`}
              </Typography>
            )}
          </Box>
        )}
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

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <Box position="relative" mb={2}>
                  <Avatar
                    src={avatarPreview || user.avatar || undefined}
                    sx={{
                      width: 120,
                      height: 120,
                      mb: 2,
                      border: '4px solid',
                      borderColor: 'primary.main'
                    }}
                  >
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </Avatar>
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="avatar-upload"
                    type="file"
                    onChange={handleAvatarChange}
                  />
                  <label htmlFor="avatar-upload">
                    <Tooltip title="Upload new profile picture (Max 5MB, JPG/PNG/GIF/WebP)">
                      <IconButton
                        component="span"
                        sx={{
                          position: 'absolute',
                          bottom: 16,
                          right: -8,
                          backgroundColor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'primary.dark',
                          },
                        }}
                      >
                        <PhotoCamera />
                      </IconButton>
                    </Tooltip>
                  </label>
                </Box>

                {avatarFile && (
                  <Box mb={2}>
                    <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                      New avatar selected
                    </Typography>
                    <Box 
                      display="flex" 
                      flexDirection={{ xs: 'column', sm: 'row' }}
                      gap={{ xs: 1, sm: 1 }}
                      alignItems={{ xs: 'stretch', sm: 'center' }}
                    >
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleAvatarUpload}
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} /> : <PhotoCamera />}
                        sx={{ 
                        width: { xs: '100%', sm: 'auto' },
                        minWidth: { xs: 'auto', sm: 120 }
                      }}
                      >
                        {loading ? 'Uploading...' : 'Upload'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(null);
                        }}
                        disabled={loading}
                        sx={{ 
                        width: { xs: '100%', sm: 'auto' },
                        minWidth: { xs: 'auto', sm: 120 }
                      }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}

                <Typography variant="h5" gutterBottom>
                  {user.firstName} {user.lastName}
                </Typography>

                <Chip
                  icon={
                    finalIsStudent ? <School /> : 
                    finalIsTeacher ? <School /> : 
                    finalIsAdmin ? <AdminPanelSettings /> : 
                    <Person />
                  }
                  label={
                    finalIsStudent ? "Student" : 
                    finalIsTeacher ? "Teacher" : 
                    finalIsAdmin ? "Administrator" : 
                    "User"
                  }
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>

                <Box display="flex" alignItems="center" mt={1}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: user.isEmailVerified ? 'success.main' : 'error.main',
                      mr: 1
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Email {user.isEmailVerified ? 'Verified' : 'Not Verified'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Overview
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="Member Since"
                    secondary={formatDate(user.createdAt)}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp />
                  </ListItemIcon>
                  <ListItemText
                    primary="Total Logins"
                    secondary={profileStats.totalLogins.toLocaleString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Dashboard />
                  </ListItemIcon>
                  <ListItemText
                    primary="Actions Performed"
                    secondary={profileStats.actionsPerformed.toLocaleString()}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Shield />
                  </ListItemIcon>
                  <ListItemText
                    primary="Security Score"
                    secondary={
                      <Typography component="span" variant="body2" color="text.secondary">
                        {profileStats.securityScore}%
                      </Typography>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper>
            <Tabs
              value={currentTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant={isMobile ? "scrollable" : "fullWidth"}
              scrollButtons="auto"
            >
              <Tab icon={<Person />} label="Personal Info" />
              {finalIsStudent && <Tab icon={<School />} label="Academic Info" />}
              {finalIsStudent && <Tab icon={<Work />} label="Career & Skills" />}
              {finalIsStudent && <Tab icon={<Psychology />} label="Learning Preferences" />}
              <Tab icon={<Security />} label="Security" />
              <Tab icon={<Settings />} label="Preferences" />
              <Tab icon={<Analytics />} label="Activity" />
            </Tabs>

            {/* Personal Information Tab */}
            <TabPanel value={currentTab} index={0}>
              <Box>
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems={{ xs: 'flex-start', sm: 'center' }} 
                  mb={3}
                  flexDirection={{ xs: 'column', sm: 'row' }}
                  gap={{ xs: 2, sm: 0 }}
                >
                  <Typography variant="h6">Personal Information</Typography>
                  {!editingProfile ? (
                    <Button
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={handleProfileEdit}
                      sx={{ 
                        width: { xs: '100%', sm: 'auto' },
                        minWidth: { xs: 'auto', sm: 120 }
                      }}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Box 
                      display="flex" 
                      flexDirection={{ xs: 'column', sm: 'row' }}
                      gap={{ xs: 1, sm: 1 }}
                      width={{ xs: '100%', sm: 'auto' }}
                    >
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleProfileSave}
                        disabled={loading}
                        sx={{ 
                          width: { xs: '100%', sm: 'auto' },
                          minWidth: { xs: 'auto', sm: 100 }
                        }}
                      >
                        Save
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<Cancel />}
                        onClick={handleProfileCancel}
                        sx={{ 
                          width: { xs: '100%', sm: 'auto' },
                          minWidth: { xs: 'auto', sm: 100 }
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </Box>

                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      disabled={!editingProfile}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      disabled={!editingProfile}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      disabled={!editingProfile}
                      variant="outlined"
                      type="email"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Role"
                      value={
                        finalIsStudent ? "Student" : 
                        finalIsTeacher ? "Teacher" : 
                        finalIsAdmin ? "Administrator" : 
                        user.role || "User"
                      }
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Account Status"
                      value={user.isActive ? 'Active' : 'Inactive'}
                      disabled
                      variant="outlined"
                    />
                  </Grid>
                  
                  {/* Student-specific personal information fields */}
                  {isStudent && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Date of Birth"
                          type="date"
                          value={editingStudentProfile ? (studentProfileData.dateOfBirth || '') : (studentProfile?.dateOfBirth || '')}
                          onChange={(e) => setStudentProfileData({ ...studentProfileData, dateOfBirth: e.target.value })}
                          disabled={!editingStudentProfile}
                          variant="outlined"
                          InputLabelProps={{ shrink: true }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                          <InputLabel>Gender</InputLabel>
                          <Select
                            value={editingStudentProfile ? (studentProfileData.gender || '') : (studentProfile?.gender || '')}
                            label="Gender"
                            onChange={(e) => setStudentProfileData({ ...studentProfileData, gender: e.target.value as any })}
                            disabled={!editingStudentProfile}
                          >
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                            <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone Number"
                          value={editingStudentProfile ? (studentProfileData.phone || '') : (studentProfile?.phone || '')}
                          onChange={(e) => setStudentProfileData({ ...studentProfileData, phone: e.target.value })}
                          disabled={!editingStudentProfile}
                          variant="outlined"
                          placeholder="+250 123 456 789"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Age"
                          value={editingStudentProfile ? (studentProfileData.age || '') : (studentProfile?.age || '')}
                          disabled
                          variant="outlined"
                          helperText="Calculated from date of birth"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Address"
                          multiline
                          rows={2}
                          value={editingStudentProfile ? (studentProfileData.address?.street || '') : (studentProfile?.address?.street || '')}
                          onChange={(e) => setStudentProfileData({ 
                            ...studentProfileData, 
                            address: { 
                              ...studentProfileData.address, 
                              street: e.target.value 
                            } 
                          })}
                          disabled={!editingStudentProfile}
                          variant="outlined"
                          placeholder="Enter your address"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Emergency Contact Name"
                          value={editingStudentProfile ? (studentProfileData.emergencyContact?.name || '') : (studentProfile?.emergencyContact?.name || '')}
                          onChange={(e) => setStudentProfileData({ 
                            ...studentProfileData, 
                            emergencyContact: { 
                              name: e.target.value,
                              relationship: studentProfileData.emergencyContact?.relationship || '',
                              phone: studentProfileData.emergencyContact?.phone || '',
                              email: studentProfileData.emergencyContact?.email
                            } 
                          })}
                          disabled={!editingStudentProfile}
                          variant="outlined"
                          placeholder="Emergency contact name"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Emergency Contact Phone"
                          value={editingStudentProfile ? (studentProfileData.emergencyContact?.phone || '') : (studentProfile?.emergencyContact?.phone || '')}
                          onChange={(e) => setStudentProfileData({ 
                            ...studentProfileData, 
                            emergencyContact: { 
                              name: studentProfileData.emergencyContact?.name || '',
                              relationship: studentProfileData.emergencyContact?.relationship || '',
                              phone: e.target.value,
                              email: studentProfileData.emergencyContact?.email
                            } 
                          })}
                          disabled={!editingStudentProfile}
                          variant="outlined"
                          placeholder="Emergency contact phone"
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            </TabPanel>

            {/* Academic Information Tab - Students Only */}
            {finalIsStudent && (
              <TabPanel value={currentTab} index={1}>
                <Box>
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'flex-start', sm: 'center' }} 
                    mb={3}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    gap={{ xs: 2, sm: 0 }}
                  >
                    <Typography variant="h6">Academic Information</Typography>
                    {!editingStudentProfile ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleStudentProfileEdit}
                        sx={{ minWidth: { xs: 'auto', sm: 140 } }}
                      >
                        Edit Academic Info
                      </Button>
                    ) : (
                      <Box 
                        display="flex" 
                        flexDirection={{ xs: 'column', sm: 'row' }}
                        gap={{ xs: 1, sm: 1 }}
                        width={{ xs: '100%', sm: 'auto' }}
                      >
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleStudentProfileSave}
                          disabled={loading}
                          sx={{ minWidth: { xs: 'auto', sm: 100 } }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleStudentProfileCancel}
                          sx={{ minWidth: { xs: 'auto', sm: 100 } }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Current Education Level</InputLabel>
                        <Select
                          value={editingStudentProfile ? (studentProfileData.currentEducationLevel || '') : (studentProfile?.currentEducationLevel || '')}
                          label="Current Education Level"
                          onChange={(e) => setStudentProfileData({ ...studentProfileData, currentEducationLevel: e.target.value as any })}
                          disabled={!editingStudentProfile}
                        >
                          <MenuItem value="high_school">High School</MenuItem>
                          <MenuItem value="undergraduate">Undergraduate</MenuItem>
                          <MenuItem value="graduate">Graduate</MenuItem>
                          <MenuItem value="postgraduate">Postgraduate</MenuItem>
                          <MenuItem value="other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="School/University Name"
                        value={editingStudentProfile ? (studentProfileData.schoolName || '') : (studentProfile?.schoolName || '')}
                        onChange={(e) => setStudentProfileData({ ...studentProfileData, schoolName: e.target.value })}
                        disabled={!editingStudentProfile}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Field of Study"
                        value={editingStudentProfile ? (studentProfileData.fieldOfStudy || '') : (studentProfile?.fieldOfStudy || '')}
                        onChange={(e) => setStudentProfileData({ ...studentProfileData, fieldOfStudy: e.target.value })}
                        disabled={!editingStudentProfile}
                        variant="outlined"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Graduation Year"
                        type="number"
                        value={editingStudentProfile ? (studentProfileData.graduationYear || '') : (studentProfile?.graduationYear || '')}
                        onChange={(e) => setStudentProfileData({ ...studentProfileData, graduationYear: parseInt(e.target.value) || undefined })}
                        disabled={!editingStudentProfile}
                        variant="outlined"
                        inputProps={{ min: 1950, max: new Date().getFullYear() + 10 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="GPA (0.0 - 4.0)"
                        type="number"
                        value={editingStudentProfile ? (studentProfileData.gpa || '') : (studentProfile?.gpa || '')}
                        onChange={(e) => setStudentProfileData({ ...studentProfileData, gpa: parseFloat(e.target.value) || undefined })}
                        disabled={!editingStudentProfile}
                        variant="outlined"
                        inputProps={{ min: 0, max: 4, step: 0.1 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={['Mathematics', 'Science', 'Technology', 'Engineering', 'Business', 'Arts', 'Languages', 'History', 'Literature']}
                        value={editingStudentProfile ? (studentProfileData.academicInterests || []) : (studentProfile?.academicInterests || [])}
                        onChange={(event, newValue) => setStudentProfileData({ ...studentProfileData, academicInterests: newValue })}
                        disabled={!editingStudentProfile}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Academic Interests"
                            placeholder="Add your academic interests"
                            variant="outlined"
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              variant="outlined"
                              label={option}
                              {...getTagProps({ index })}
                              key={index}
                            />
                          ))
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>
            )}

            {/* Career & Skills Tab - Students Only */}
            {finalIsStudent && (
              <TabPanel value={currentTab} index={2}>
                <Box>
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'flex-start', sm: 'center' }} 
                    mb={3}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    gap={{ xs: 2, sm: 0 }}
                  >
                    <Typography variant="h6">Career & Skills</Typography>
                    {!editingStudentProfile ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleStudentProfileEdit}
                        sx={{ minWidth: { xs: 'auto', sm: 130 } }}
                      >
                        Edit Career Info
                      </Button>
                    ) : (
                      <Box 
                        display="flex" 
                        flexDirection={{ xs: 'column', sm: 'row' }}
                        gap={{ xs: 1, sm: 1 }}
                        width={{ xs: '100%', sm: 'auto' }}
                      >
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleStudentProfileSave}
                          disabled={loading}
                          sx={{ minWidth: { xs: 'auto', sm: 100 } }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleStudentProfileCancel}
                          sx={{ minWidth: { xs: 'auto', sm: 100 } }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Career Goals"
                        multiline
                        rows={3}
                        value={editingStudentProfile ? (studentProfileData.careerGoals || '') : (studentProfile?.careerGoals || '')}
                        onChange={(e) => setStudentProfileData({ ...studentProfileData, careerGoals: e.target.value })}
                        disabled={!editingStudentProfile}
                        variant="outlined"
                        placeholder="Describe your career aspirations and goals..."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={['Software Development', 'Data Science', 'Business Management', 'Marketing', 'Design', 'Healthcare', 'Education', 'Finance', 'Engineering', 'Research']}
                        value={editingStudentProfile ? (studentProfileData.preferredCareerPath || []) : (studentProfile?.preferredCareerPath || [])}
                        onChange={(event, newValue) => setStudentProfileData({ ...studentProfileData, preferredCareerPath: newValue })}
                        disabled={!editingStudentProfile}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Preferred Career Paths"
                            placeholder="Add your preferred career paths"
                            variant="outlined"
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              variant="outlined"
                              label={option}
                              {...getTagProps({ index })}
                              key={index}
                            />
                          ))
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={['JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'SQL', 'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Project Management']}
                        value={editingStudentProfile ? (studentProfileData.skills || []) : (studentProfile?.skills || [])}
                        onChange={(event, newValue) => setStudentProfileData({ ...studentProfileData, skills: newValue })}
                        disabled={!editingStudentProfile}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Skills"
                            placeholder="Add your skills"
                            variant="outlined"
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              variant="outlined"
                              label={option}
                              {...getTagProps({ index })}
                              key={index}
                            />
                          ))
                        }
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={['English', 'French', 'Kinyarwanda', 'Swahili', 'Spanish', 'German', 'Chinese', 'Arabic']}
                        value={editingStudentProfile ? (studentProfileData.languages || []) : (studentProfile?.languages || [])}
                        onChange={(event, newValue) => setStudentProfileData({ ...studentProfileData, languages: newValue })}
                        disabled={!editingStudentProfile}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Languages"
                            placeholder="Add languages you speak"
                            variant="outlined"
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              variant="outlined"
                              label={option}
                              {...getTagProps({ index })}
                              key={index}
                            />
                          ))
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>
            )}

            {/* Learning Preferences Tab - Students Only */}
            {finalIsStudent && (
              <TabPanel value={currentTab} index={3}>
                <Box>
                  <Box 
                    display="flex" 
                    justifyContent="space-between" 
                    alignItems={{ xs: 'flex-start', sm: 'center' }} 
                    mb={3}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    gap={{ xs: 2, sm: 0 }}
                  >
                    <Typography variant="h6">Learning Preferences</Typography>
                    {!editingStudentProfile ? (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleStudentProfileEdit}
                        sx={{ minWidth: { xs: 'auto', sm: 140 } }}
                      >
                        Edit Preferences
                      </Button>
                    ) : (
                      <Box 
                        display="flex" 
                        flexDirection={{ xs: 'column', sm: 'row' }}
                        gap={{ xs: 1, sm: 1 }}
                        width={{ xs: '100%', sm: 'auto' }}
                      >
                        <Button
                          variant="contained"
                          startIcon={<Save />}
                          onClick={handleStudentProfileSave}
                          disabled={loading}
                          sx={{ minWidth: { xs: 'auto', sm: 100 } }}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleStudentProfileCancel}
                          sx={{ minWidth: { xs: 'auto', sm: 100 } }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}
                  </Box>

                  <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Preferred Learning Style</InputLabel>
                        <Select
                          value={editingStudentProfile ? (studentProfileData.preferredLearningStyle || '') : (studentProfile?.preferredLearningStyle || '')}
                          label="Preferred Learning Style"
                          onChange={(e) => setStudentProfileData({ ...studentProfileData, preferredLearningStyle: e.target.value as any })}
                          disabled={!editingStudentProfile}
                        >
                          <MenuItem value="visual">Visual</MenuItem>
                          <MenuItem value="auditory">Auditory</MenuItem>
                          <MenuItem value="kinesthetic">Kinesthetic</MenuItem>
                          <MenuItem value="reading_writing">Reading/Writing</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Study Hours Per Week"
                        type="number"
                        value={editingStudentProfile ? (studentProfileData.studySchedule?.studyHoursPerWeek || '') : (studentProfile?.studySchedule?.studyHoursPerWeek || '')}
                        onChange={(e) => setStudentProfileData({ 
                          ...studentProfileData, 
                          studySchedule: { 
                            preferredTime: studentProfileData.studySchedule?.preferredTime || '',
                            studyHoursPerWeek: parseInt(e.target.value) || 0,
                            availableDays: studentProfileData.studySchedule?.availableDays || []
                          } 
                        })}
                        disabled={!editingStudentProfile}
                        variant="outlined"
                        inputProps={{ min: 0, max: 168 }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        multiple
                        freeSolo
                        options={['Improve technical skills', 'Career advancement', 'Personal interest', 'Academic requirements', 'Professional certification', 'Skill development']}
                        value={editingStudentProfile ? (studentProfileData.learningGoals || []) : (studentProfile?.learningGoals || [])}
                        onChange={(event, newValue) => setStudentProfileData({ ...studentProfileData, learningGoals: newValue })}
                        disabled={!editingStudentProfile}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Learning Goals"
                            placeholder="Add your learning goals"
                            variant="outlined"
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              variant="outlined"
                              label={option}
                              {...getTagProps({ index })}
                              key={index}
                            />
                          ))
                        }
                      />
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>
            )}

            {/* Security Tab */}
            <TabPanel value={currentTab} index={finalIsStudent ? 4 : 1}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Security Settings
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" gutterBottom>
                              Password
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Last changed: {formatDate(user.updatedAt)}
                            </Typography>
                          </Box>
                          <Button
                            variant="outlined"
                            startIcon={<Key />}
                            onClick={() => setPasswordDialogOpen(true)}
                          >
                            Change Password
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle1" gutterBottom>
                              Email Verification
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Your email address is {user.isEmailVerified ? 'verified' : 'not verified'}
                            </Typography>
                          </Box>
                          <Chip
                            label={user.isEmailVerified ? 'Verified' : 'Not Verified'}
                            color={user.isEmailVerified ? 'success' : 'warning'}
                            icon={user.isEmailVerified ? <Shield /> : <Email />}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Security Score
                        </Typography>
                        <Box display="flex" alignItems="center" mb={2}>
                          <LinearProgress
                            variant="determinate"
                            value={profileStats.securityScore}
                            color={getSecurityScoreColor(profileStats.securityScore) as any}
                            sx={{ flexGrow: 1, mr: 2 }}
                          />
                          <Typography variant="h6" color={`${getSecurityScoreColor(profileStats.securityScore)}.main`}>
                            {profileStats.securityScore}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Your account security is {profileStats.securityScore >= 80 ? 'excellent' : profileStats.securityScore >= 60 ? 'good' : 'needs improvement'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Preferences Tab */}
            <TabPanel value={currentTab} index={finalIsStudent ? 5 : 2}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Account Preferences
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Customize your account settings and preferences
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Notifications
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Manage how you receive notifications
                        </Typography>
                        <Button variant="outlined" startIcon={<Notifications />}>
                          Configure Notifications
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          System Preferences
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Customize your dashboard and system settings
                        </Typography>
                        <Button variant="outlined" startIcon={<Settings />}>
                          System Settings
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {/* Activity Tab */}
            <TabPanel value={currentTab} index={finalIsStudent ? 6 : 3}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Account Activity
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Last Login
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Account Created
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatDate(user.createdAt)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Recent Activity
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Activity tracking and detailed logs will be available in future updates
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Current Password</InputLabel>
              <OutlinedInput
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      edge="end"
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Current Password"
              />
            </FormControl>

            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>New Password</InputLabel>
              <OutlinedInput
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      edge="end"
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="New Password"
              />
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <InputLabel>Confirm New Password</InputLabel>
              <OutlinedInput
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      edge="end"
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                }
                label="Confirm New Password"
              />
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </ResponsiveDashboard>
  );
};

export default ProfilePage;

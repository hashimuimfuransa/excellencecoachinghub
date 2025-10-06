import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Alert,
  LinearProgress,
  Rating,
  Tabs,
  Tab,
  Paper,
  Stack,
  useTheme,
  alpha,
  Fade,
  Slide,
  Zoom,
  Tooltip,
  Badge,
  CircularProgress,
  Skeleton,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  InputAdornment,
  Collapse,
  Grow,
  Backdrop,
  Snackbar,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar
} from '@mui/material';
import {
  Person,
  Work,
  School,
  Psychology,
  EmojiEvents,
  Add,
  Edit,
  Delete,
  Save,
  Cancel,
  LinkedIn,
  GitHub,
  Language,
  Email,
  Phone,
  LocationOn,
  Download,
  Upload,
  Star,
  TrendingUp,
  Code,
  ExpandMore,
  Link as LinkIcon,
  Visibility,
  Share,
  PersonAdd,
  PersonRemove,
  Block,
  Notifications,
  Security,
  Palette,
  Public,
  Lock,
  PhotoCamera,
  Close,
  AttachFile,
  PlayArrow,
  Article,
  People,
  Settings,
  MoreVert,
  Favorite,
  Comment,
  Search,
  BusinessCenter,
  Assignment,
  Quiz,
  School as SchoolIcon,
  Timeline,
  CheckCircle,
  Warning,
  Info,
  TrendingDown,
  Assessment,
  Description,
  Build,
  AutoAwesome,
  Rocket,
  Lightbulb,
  Group,
  ConnectWithoutContact,
  Handshake,
  Recommend,
  ThumbUp,
  ThumbDown,
  Send,
  Message,
  CalendarToday,
  AccessTime,
  Verified,
  WorkspacePremium,
  CardGiftcard,
  LocalFireDepartment,
  NewReleases,
  Schedule,
  Public as PublicIcon,
  Language as WebIcon,
  Launch,
  BookmarkBorder,
  Bookmark,
  ContentCopy,
  Refresh,
  FilterList,
  Sort,
  ViewList,
  ViewModule,
  GridView,
  ExpandLess,
  ExpandMore as ExpandMoreIcon,
  TuneRounded,
  Close as CloseIcon,
  LocalFireDepartment as FireIcon,
  NewReleases as NewIcon,
  Schedule as ScheduleIcon,
  Public as PublicIconAlt,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Language as WebIconAlt,
  Launch as LaunchIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Bookmark as BookmarkIcon,
  Share as ShareIcon,
  ContentCopy as ContentCopyIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  GridView as GridViewIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIconAlt,
  TuneRounded as TuneRoundedIcon,
  Close as CloseIconAlt,
  RecordVoiceOver,
  AutoStories,
  Twitter,
  Facebook,
  WhatsApp,
  LightMode,
  DarkMode
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';
import { userService } from '../services/userService';
import { enhancedStoryService } from '../services/enhancedStoryService';
import { socialNetworkService } from '../services/socialNetworkService';
import type { User } from '../types/user';
import { useNavigate, useParams } from 'react-router-dom';
import { checkProfileCompletion, ProfileCompletionCheck } from '../utils/profileCompletionUtils';
import CreateStory from '../components/social/CreateStory';
import CVBuilderPopup from '../components/CVBuilderPopup';
import { shouldShowCVBuilderPopup, markCVBuilderDismissed } from '../utils/profileCompletionUtils';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ModernProfilePage: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleTheme } = useCustomTheme();
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user, updateUser, setUserData } = useAuth();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // Check if viewing own profile and determine target user ID
  const isOwnProfile = !userId || userId === user?._id;
  const targetUserId = userId || user?._id;
  
  // State for profile data
  const [profile, setProfile] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([]);
  const [userStories, setUserStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Loading states for different sections (for compatibility with existing code)
  const postsLoading = loading;
  const connectionsLoading = loading;
  const suggestionsLoading = loading;
  const storiesLoading = loading;
  
  // Additional state management
  const [successMessage, setSuccessMessage] = useState('');
  const [profileValidation, setProfileValidation] = useState<ProfileCompletionCheck | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  
  // Dialog states
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [connectionMenuAnchor, setConnectionMenuAnchor] = useState<null | HTMLElement>(null);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [showCVBuilderPopup, setShowCVBuilderPopup] = useState(false);
  
  // Load profile data using the same method as Profile Edit Page
  useEffect(() => {
    if (targetUserId) {
      loadUserProfile();
    }
  }, [targetUserId]);

  const loadUserProfile = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      const userProfile = await userService.getUserProfile(targetUserId);
      console.log('🔍 Modern Profile Page - Profile data received:', userProfile);
      
      // Debug individual fields
      const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'location', 'jobTitle', 'company', 'bio', 'skills', 'experience', 'education'];
      console.log('🔍 Modern Profile Page - Field analysis:');
      requiredFields.forEach(field => {
        const value = userProfile[field as keyof User];
        const hasValue = value && (!Array.isArray(value) || value.length > 0) && (typeof value !== 'string' || value.trim() !== '');
        console.log(`  ${field}: ${hasValue ? '✅' : '❌'} (${JSON.stringify(value)})`);
      });
      
      const validation = checkProfileCompletion(userProfile);
      console.log('📊 Modern Profile Page - Validation result:', validation);
      setProfile(userProfile);
      setProfileValidation(validation);
    } catch (error) {
      console.error('Error loading profile:', error);
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  // Check for CV builder popup when profile is loaded
  useEffect(() => {
    if (profile && isOwnProfile) {
      // Show CV builder popup if user doesn't have a CV and profile is reasonably complete
      const shouldShowCV = shouldShowCVBuilderPopup(profile);
      if (shouldShowCV) {
        // Delay the popup slightly to let the page load
        const timer = setTimeout(() => {
          setShowCVBuilderPopup(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [profile, isOwnProfile]);


  // Profile sharing functionality
  const handleShareProfile = async () => {
    try {
      const profileUrl = `${window.location.origin}/app/profile/view/${targetUserId}`;
      await navigator.clipboard.writeText(profileUrl);
      setSuccessMessage('Profile link copied to clipboard!');
      setShareMenuAnchor(null);
    } catch (error) {
      console.error('Error copying profile link:', error);
      setErrorMessage('Failed to copy profile link');
    }
  };

  const handleShareToSocial = (platform: string) => {
    const profileUrl = `${window.location.origin}/app/profile/view/${targetUserId}`;
    const text = `Check out ${profile?.firstName} ${profile?.lastName}'s profile on Excellence Coaching Hub!`;
    
    let shareUrl = '';
    switch (platform) {
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + profileUrl)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank');
    setShareMenuAnchor(null);
  };

  const loadUserStories = async () => {
    if (!targetUserId) return;
    
    setStoriesLoading(true);
    try {
      const storiesResponse = await enhancedStoryService.getUserStories();
      if (storiesResponse.success && storiesResponse.data) {
        // Filter stories for the specific user
        const userStoriesData = storiesResponse.data.filter((story: any) => 
          story.author?._id === targetUserId
        );
        setUserStories(userStoriesData);
      } else {
        setUserStories([]);
      }
    } catch (error) {
      console.error('Error loading user stories:', error);
      setUserStories([]);
    } finally {
      setStoriesLoading(false);
    }
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?._id) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const updatedProfile = await userService.uploadProfilePicture(profile._id, formData);
      setProfile(prevProfile => ({
        ...prevProfile,
        ...updatedProfile,
        profilePicture: updatedProfile.profilePicture
      }));
      
      setUserData({
        ...profile,
        ...updatedProfile,
        profilePicture: updatedProfile.profilePicture
      });
      
      setSuccessMessage('Profile picture updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
      event.target.value = '';
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setErrorMessage('Failed to upload profile picture');
      setTimeout(() => setErrorMessage(''), 3000);
      event.target.value = '';
    } finally {
      setUploadingImage(false);
    }
  };

  const handleConnect = async (userId: string) => {
    try {
      await socialNetworkService.sendConnectionRequest(userId);
      setSuggestedConnections(prev => prev.filter(conn => conn._id !== userId));
      setSuccessMessage('Connection request sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending connection request:', error);
      setErrorMessage('Failed to send connection request');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleRemoveConnection = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) return;
    
    try {
      await socialNetworkService.removeConnection(userId);
      setConnections(prevConnections => 
        prevConnections.filter(conn => conn.user._id !== userId)
      );
      setSuccessMessage('Connection removed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error removing connection:', error);
      setErrorMessage('Failed to remove connection. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleConnectionMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setConnectionMenuAnchor(event.currentTarget);
  };

  const handleConnectionMenuClose = () => {
    setConnectionMenuAnchor(null);
  };

  // CV Builder popup handlers
  const handleCVBuilderClose = () => {
    setShowCVBuilderPopup(false);
    if (profile) {
      markCVBuilderDismissed(profile._id);
    }
  };

  const handleCVBuilderAction = () => {
    setShowCVBuilderPopup(false);
    navigate('/app/cv-builder');
  };

  const handleCVBuilderContinueProfile = () => {
    setShowCVBuilderPopup(false);
    navigate('/app/profile/edit');
  };

  const getCompletionIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle color="success" />;
    if (percentage >= 50) return <TrendingUp color="info" />;
    return <Warning color="warning" />;
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'info';
    return 'warning';
  };

  // Quick Actions for job seekers
  const quickActions = [
    {
      id: 'cv-builder',
      title: 'CV Builder',
      description: 'Create a professional CV',
      icon: <Description />,
      color: theme.palette.primary.main,
      action: () => navigate('/app/cv-builder'),
      show: true
    },
    {
      id: 'find-jobs',
      title: 'Find Jobs',
      description: 'Discover opportunities',
      icon: <Work />,
      color: theme.palette.success.main,
      action: () => navigate('/app/jobs'),
      show: true
    },
    {
      id: 'take-tests',
      title: 'Take Tests',
      description: 'Boost your profile',
      icon: <Psychology />,
      color: '#9C27B0',
      action: () => navigate('/app/tests'),
      show: true
    },
    {
      id: 'view-applications',
      title: 'My Applications',
      description: 'Track your progress',
      icon: <Assignment />,
      color: theme.palette.info.main,
      action: () => navigate('/app/applications'),
      show: true
    },
    {
      id: 'interviews',
      title: 'AI Interviews',
      description: 'Practice interviews',
      icon: <RecordVoiceOver />,
      color: '#FF5722',
      action: () => navigate('/app/interviews'),
      show: true
    },
    {
      id: 'certificates',
      title: 'Certificates',
      description: 'View achievements',
      icon: <EmojiEvents />,
      color: '#FF9800',
      action: () => navigate('/app/certificates'),
      show: true
    }
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ textAlign: 'center' }}>
          Loading Profile...
        </Typography>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load profile data</Alert>
      </Container>
    );
  }

  const completionPercentage = profileValidation?.completionPercentage || 0;
  const missingFields = profileValidation?.missingFields || [];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        {/* Header Section */}
        <Box sx={{ mb: { xs: 2, sm: 3, md: 4 }, position: 'relative' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant={isMobile ? "h4" : "h3"} 
                component="h1" 
                gutterBottom 
                sx={{ 
                  fontWeight: 'bold', 
                  color: 'text.primary',
                  textAlign: { xs: 'center', md: 'left' }
                }}
              >
                👤 Profile Overview
              </Typography>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                color="text.secondary"
                sx={{ textAlign: { xs: 'center', md: 'left' } }}
              >
                Manage your professional information and boost your career
              </Typography>
            </Box>
            
            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              {/* Refresh Button */}
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={() => {
                    // Use the loadUserProfile function
                    loadUserProfile();
                  }}
                  sx={{
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backdropFilter: 'blur(8px)',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 15px ${alpha(theme.palette.success.main, 0.15)}`,
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <Refresh sx={{ color: theme.palette.success.main }} />
                </IconButton>
              </Tooltip>

              {/* Theme Switcher Button */}
              <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
                <IconButton
                  onClick={toggleTheme}
                  sx={{
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    backdropFilter: 'blur(8px)',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'scale(1.05)',
                      boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.15)}`,
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {mode === 'dark' ? (
                    <LightMode sx={{ color: theme.palette.warning.main }} />
                  ) : (
                    <DarkMode sx={{ color: theme.palette.primary.main }} />
                  )}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        {/* Alerts */}
        {successMessage && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              mx: { xs: 0, sm: 0 }
            }} 
            onClose={() => setSuccessMessage('')}
          >
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: { xs: 2, sm: 3 },
              mx: { xs: 0, sm: 0 }
            }} 
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  // Use the loadUserProfile function
                  loadUserProfile();
                }}
                sx={{ textTransform: 'none' }}
              >
                Retry
              </Button>
            }
            onClose={() => setErrorMessage('')}
          >
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {errorMessage}
              </Typography>
              {errorMessage.includes('Too many requests') && (
                <Typography variant="caption" color="text.secondary">
                  💡 Tip: Try refreshing the page or wait a few minutes before retrying
                </Typography>
              )}
              {errorMessage.includes('Network connection failed') && (
                <Typography variant="caption" color="text.secondary">
                  💡 Tip: Check your internet connection and try again
                </Typography>
              )}
            </Box>
          </Alert>
        )}

        <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
          {/* Left Sidebar - Profile Summary & Quick Actions */}
          <Grid item xs={12} md={4}>
            {/* Profile Summary Card */}
            <Card sx={{ 
              borderRadius: { xs: 2, sm: 3 }, 
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.primary.main}05 100%)`,
              border: `1px solid ${theme.palette.primary.main}20`,
              mb: { xs: 2, sm: 3 }
            }}>
              <CardContent sx={{ 
                textAlign: 'center', 
                p: { xs: 2, sm: 3, md: 4 }
              }}>
                <Box sx={{ position: 'relative', display: 'inline-block', mb: { xs: 2, sm: 3 } }}>
                  <Avatar
                    sx={{
                      width: { xs: 80, sm: 100, md: 120 },
                      height: { xs: 80, sm: 100, md: 120 },
                      fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                      border: `4px solid ${theme.palette.background.paper}`,
                      boxShadow: 3,
                      opacity: uploadingImage ? 0.6 : 1,
                      transition: 'opacity 0.3s ease'
                    }}
                    src={imagePreview || profile.profilePicture}
                  >
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </Avatar>
                {isOwnProfile && (
                  <>
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="profile-picture-upload"
                      type="file"
                      onChange={handleProfilePictureUpload}
                    />
                    <label htmlFor="profile-picture-upload">
                      <Tooltip title="Upload profile picture">
                        <IconButton
                          component="span"
                          sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            bgcolor: theme.palette.primary.main,
                            color: 'white',
                            '&:hover': { bgcolor: theme.palette.primary.dark },
                            boxShadow: theme.shadows[2]
                          }}
                          size="small"
                        >
                          <Upload />
                        </IconButton>
                      </Tooltip>
                    </label>
                  </>
                )}
                </Box>
                
                <Typography 
                  variant={isMobile ? "h5" : "h4"} 
                  fontWeight="bold" 
                  gutterBottom
                >
                  {profile.firstName} {profile.lastName}
                </Typography>
                <Typography 
                  variant={isMobile ? "body1" : "h6"} 
                  color="textSecondary" 
                  gutterBottom 
                  sx={{ mb: 2 }}
                >
                  {profile.jobTitle || profile.role?.replace('_', ' ') || 'Job Seeker'}
                </Typography>
                
                <Stack 
                  direction="row" 
                  spacing={1} 
                  justifyContent="center" 
                  sx={{ mb: { xs: 2, sm: 3 } }}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Chip
                    label={profile.role?.replace('_', ' ') || 'User'}
                    color="primary"
                    variant="outlined"
                    size={isMobile ? "small" : "medium"}
                  />
                  {completionPercentage >= 80 && (
                    <Chip
                      icon={<Star />}
                      label="Complete"
                      color="success"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                    />
                  )}
                </Stack>

                {/* Profile Completion */}
                <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                  <Typography 
                    variant={isMobile ? "caption" : "body2"} 
                    color="text.secondary" 
                    gutterBottom
                  >
                    Profile Completion: {completionPercentage}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={completionPercentage}
                    sx={{
                      height: { xs: 6, sm: 8 },
                      borderRadius: 4,
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        bgcolor: completionPercentage >= 80 ? 
                          theme.palette.success.main : 
                          completionPercentage >= 50 ? 
                          theme.palette.warning.main : 
                          theme.palette.error.main
                      }
                    }}
                  />
                </Box>

                {/* Action Buttons */}
                <Stack spacing={{ xs: 1.5, sm: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/app/profile/edit')}
                    startIcon={<Edit />}
                    fullWidth
                    size={isMobile ? "medium" : "large"}
                    sx={{ 
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      color: 'white',
                      fontWeight: 'bold',
                      py: { xs: 1, sm: 1.5 },
                      boxShadow: `0 4px 15px ${alpha(theme.palette.primary.main, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                        transform: 'translateY(-1px)',
                        boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    {completionPercentage >= 80 ? '✏️ Update Profile' : '✏️ Complete Profile'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/app/profile/professional')}
                    startIcon={<Work />}
                    fullWidth
                    size={isMobile ? "medium" : "large"}
                    sx={{ 
                      textTransform: 'none',
                      py: { xs: 1, sm: 1.5 }
                    }}
                  >
                    Professional Profile
                  </Button>

                  {/* Share Profile Button */}
                  <Button
                    variant="outlined"
                    onClick={(e) => setShareMenuAnchor(e.currentTarget)}
                    startIcon={<Share />}
                    fullWidth
                    size={isMobile ? "medium" : "large"}
                    sx={{ 
                      textTransform: 'none',
                      py: { xs: 1, sm: 1.5 },
                      borderColor: theme.palette.success.main,
                      color: theme.palette.success.main,
                      '&:hover': {
                        borderColor: theme.palette.success.dark,
                        backgroundColor: alpha(theme.palette.success.main, 0.1)
                      }
                    }}
                  >
                    Share Profile
                  </Button>
                </Stack>

                {/* LinkedIn-style mobile call-to-action */}
                {isMobile && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ textAlign: 'center', mb: 1 }}
                    >
                      Complete your profile to get 5x more profile views
                    </Typography>
                    <Button
                      variant="contained"
                      fullWidth
                      size="small"
                      sx={{ 
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 2
                      }}
                      onClick={() => navigate('/app/profile/edit')}
                    >
                      Complete Now
                    </Button>
                  </Box>
                )}
            </CardContent>
          </Card>

            {/* Quick Actions - Always visible on mobile, hidden on desktop */}
            <Card sx={{ 
              borderRadius: { xs: 2, sm: 3 }, 
              mb: { xs: 2, sm: 3 },
              display: { xs: 'block', md: 'none' } // Show on mobile, hide on desktop
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="subtitle1" 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    mb: 2
                  }}
                >
                  <Rocket color="primary" />
                  Quick Actions
                </Typography>
                
                {/* Responsive quick actions - Grid on desktop, horizontal scroll on mobile */}
                {isDesktop ? (
                  <Grid container spacing={2}>
                    {quickActions.map((action) => (
                      <Grid item xs={6} sm={4} key={action.id}>
                        <Button
                          variant="contained"
                          startIcon={action.icon}
                          onClick={action.action}
                          fullWidth
                          sx={{
                            py: 2,
                            borderRadius: 2,
                            textTransform: 'none',
                            background: `linear-gradient(135deg, ${action.color} 0%, ${alpha(action.color, 0.8)} 100%)`,
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            boxShadow: `0 2px 8px ${alpha(action.color, 0.3)}`,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${action.color} 0%, ${action.color} 100%)`,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 6px 16px ${alpha(action.color, 0.4)}`,
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {action.title}
                        </Button>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1.5, 
                    overflowX: 'auto',
                    pb: 1,
                    '&::-webkit-scrollbar': {
                      height: 4,
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      borderRadius: 2,
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderRadius: 2,
                    },
                  }}>
                    {quickActions.map((action) => (
                      <Button
                        key={action.id}
                        variant="contained"
                        startIcon={action.icon}
                        onClick={action.action}
                        sx={{
                          minWidth: 'auto',
                          px: 2,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          background: `linear-gradient(135deg, ${action.color} 0%, ${alpha(action.color, 0.8)} 100%)`,
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          boxShadow: `0 2px 8px ${alpha(action.color, 0.3)}`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${action.color} 0%, ${action.color} 100%)`,
                            transform: 'translateY(-1px)',
                            boxShadow: `0 4px 12px ${alpha(action.color, 0.4)}`,
                          },
                          transition: 'all 0.3s ease',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}
                      >
                        {action.title}
                      </Button>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Profile Stats */}
            <Card sx={{ 
              borderRadius: { xs: 2, sm: 3 }, 
              mb: { xs: 2, sm: 3 }
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <TrendingUp color="primary" />
                  Profile Stats
                </Typography>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        color="primary.main" 
                        fontWeight="bold"
                      >
                        {profile.profileViews || 0}
                      </Typography>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        color="text.secondary"
                      >
                        Profile Views
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        color="success.main" 
                        fontWeight="bold"
                      >
                        {connections?.length || 0}
                      </Typography>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        color="text.secondary"
                      >
                        Connections
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        color="info.main" 
                        fontWeight="bold"
                      >
                        {userPosts?.length || 0}
                      </Typography>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        color="text.secondary"
                      >
                        Posts
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography 
                        variant={isMobile ? "h5" : "h4"} 
                        color="warning.main" 
                        fontWeight="bold"
                      >
                        {profile.skills?.length || 0}
                      </Typography>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        color="text.secondary"
                      >
                        Skills
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Suggested Connections - Show on mobile too */}
            <Card sx={{ 
              borderRadius: { xs: 2, sm: 3 },
              display: { xs: 'block', md: 'block' } // Show on both mobile and desktop
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant={isMobile ? "subtitle1" : "h6"} 
                  fontWeight="bold" 
                  gutterBottom 
                  sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                >
                  <ConnectWithoutContact color="primary" />
                  Suggested Connections
                </Typography>
                
                {suggestionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : suggestedConnections.length > 0 ? (
                  <>
                    {/* Mobile: Horizontal scrollable cards */}
                    <Box sx={{ 
                      display: { xs: 'flex', sm: 'none' },
                      gap: 1.5, 
                      overflowX: 'auto',
                      pb: 1,
                      '&::-webkit-scrollbar': {
                        height: 4,
                      },
                      '&::-webkit-scrollbar-track': {
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        borderRadius: 2,
                      },
                      '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'rgba(0,0,0,0.3)',
                        borderRadius: 2,
                      },
                    }}>
                      {suggestedConnections.slice(0, 10).map((connection) => (
                        <Card 
                          key={connection._id} 
                          sx={{ 
                            minWidth: 140,
                            borderRadius: 2,
                            boxShadow: 1,
                            flexShrink: 0
                          }}
                        >
                          <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                            <Avatar 
                              src={connection.profilePicture}
                              sx={{ 
                                width: 40, 
                                height: 40, 
                                mx: 'auto', 
                                mb: 1 
                              }}
                            >
                              {connection.firstName?.charAt(0)}
                            </Avatar>
                            <Typography 
                              variant="caption" 
                              fontWeight="600" 
                              sx={{ 
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {connection.firstName} {connection.lastName}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mb: 1
                              }}
                            >
                              {connection.jobTitle}
                            </Typography>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<PersonAdd />}
                              sx={{ 
                                borderRadius: 20,
                                textTransform: 'none', 
                                fontSize: '0.7rem',
                                py: 0.5,
                                px: 1,
                                minWidth: 'auto'
                              }}
                              onClick={() => handleConnect(connection._id)}
                            >
                              Connect
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>

                    {/* Desktop: Vertical list */}
                    <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                      {suggestedConnections.slice(0, 5).map((connection) => (
                        <Box key={connection._id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar 
                            src={connection.profilePicture}
                            sx={{ width: 40, height: 40 }}
                          >
                            {connection.firstName?.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant="subtitle2" 
                              fontWeight="600" 
                              noWrap
                            >
                              {connection.firstName} {connection.lastName}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="text.secondary" 
                              noWrap
                            >
                              {connection.jobTitle} at {connection.company}
                            </Typography>
                            {connection.mutualConnections > 0 && (
                              <Typography 
                                variant="caption" 
                                color="primary.main"
                              >
                                {connection.mutualConnections} mutual connections
                              </Typography>
                            )}
                          </Box>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<PersonAdd />}
                            sx={{ 
                              borderRadius: 20,
                              textTransform: 'none', 
                              fontSize: '0.75rem'
                            }}
                            onClick={() => handleConnect(connection._id)}
                          >
                            Connect
                          </Button>
                        </Box>
                      ))}
                    </Stack>
                  </>
                ) : (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ textAlign: 'center', py: 2 }}
                  >
                    No suggested connections at the moment
                  </Typography>
                )}
              </CardContent>
            </Card>
        </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Card sx={{ 
              borderRadius: { xs: 2, sm: 3 }, 
              overflow: 'hidden'
            }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant={isMobile ? "scrollable" : "fullWidth"}
                scrollButtons={isMobile ? "auto" : false}
                sx={{
                  bgcolor: 'primary.main',
                  '& .MuiTab-root': {
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 'bold',
                    textTransform: 'none',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    minWidth: { xs: 'auto', sm: 'auto' },
                    px: { xs: 1, sm: 2 },
                    '&.Mui-selected': {
                      color: 'white'
                    }
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: 'white',
                    height: 3
                  }
                }}
              >
                <Tab
                  icon={<Person />}
                  label={isMobile ? "About" : "About"}
                  sx={{ '& .MuiSvgIcon-root': { mb: { xs: 0, sm: 1 } } }}
                />
                <Tab
                  icon={<Article />}
                  label={isMobile ? "Posts" : "Posts"}
                  sx={{ '& .MuiSvgIcon-root': { mb: { xs: 0, sm: 1 } } }}
                />
                <Tab
                  icon={<Badge badgeContent={userStories?.length || 0} color="secondary"><AutoStories /></Badge>}
                  label={isMobile ? "Stories" : "Stories"}
                  sx={{ '& .MuiSvgIcon-root': { mb: { xs: 0, sm: 1 } } }}
                />
                <Tab
                  icon={<Badge badgeContent={connections?.length || 0} color="secondary"><People /></Badge>}
                  label={isMobile ? "Connections" : "Connections"}
                  sx={{ '& .MuiSvgIcon-root': { mb: { xs: 0, sm: 1 } } }}
                />
                <Tab
                  icon={<Settings />}
                  label={isMobile ? "Settings" : "Settings"}
                  sx={{ '& .MuiSvgIcon-root': { mb: { xs: 0, sm: 1 } } }}
                />
              </Tabs>

              <Box sx={{ p: { xs: 2, sm: 3 }, minHeight: { xs: 300, sm: 400 } }}>
                {/* About Tab */}
                <TabPanel value={activeTab} index={0}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', sm: 'center' }, 
                    mb: { xs: 2, sm: 3 },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 }
                  }}>
                    <Typography 
                      variant={isMobile ? "h6" : "h5"} 
                      fontWeight="bold"
                    >
                      About Me
                    </Typography>
                    {isOwnProfile && (
                      <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => navigate('/app/profile/edit')}
                        size={isMobile ? "small" : "medium"}
                        sx={{ textTransform: 'none' }}
                      >
                        Edit Profile
                      </Button>
                    )}
                  </Box>

                  {/* Profile Completion Progress */}
                  <Card sx={{ 
                    mb: { xs: 2, sm: 3 }, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.primary.main, 0.05) 
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 1, sm: 2 }, 
                        mb: { xs: 1.5, sm: 2 },
                        flexDirection: { xs: 'column', sm: 'row' },
                        textAlign: { xs: 'center', sm: 'left' }
                      }}>
                        {getCompletionIcon(completionPercentage)}
                        <Typography 
                          variant={isMobile ? "subtitle1" : "h6"} 
                          fontWeight="bold"
                        >
                          Profile Completion: {completionPercentage}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={completionPercentage}
                        sx={{
                          height: { xs: 8, sm: 10 },
                          borderRadius: 5,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          mb: { xs: 1.5, sm: 2 },
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            bgcolor: completionPercentage >= 80 ? 
                              theme.palette.success.main : 
                              completionPercentage >= 50 ? 
                              theme.palette.warning.main : 
                              theme.palette.error.main
                          }
                        }}
                      />
                      {missingFields.length > 0 && (
                        <Box>
                          <Typography 
                            variant={isMobile ? "caption" : "body2"} 
                            color="text.secondary" 
                            sx={{ mb: 1 }}
                          >
                            Complete these fields to improve your profile:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {missingFields.slice(0, isMobile ? 2 : 4).map((field, index) => (
                              <Chip
                                key={index}
                                label={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                size="small"
                                variant="outlined"
                                color="warning"
                              />
                            ))}
                            {missingFields.length > (isMobile ? 2 : 4) && (
                              <Chip
                                label={`+${missingFields.length - (isMobile ? 2 : 4)} more`}
                                size="small"
                                variant="outlined"
                                color="warning"
                              />
                            )}
                          </Stack>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                
                  <Grid container spacing={{ xs: 2, sm: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={profile.firstName || 'Not provided'}
                        disabled
                        variant="filled"
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'text.secondary', fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={profile.lastName || 'Not provided'}
                        disabled
                        variant="filled"
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: <Person sx={{ mr: 1, color: 'text.secondary', fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        value={profile.email}
                        disabled
                        variant="filled"
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: <Email sx={{ mr: 1, color: 'text.secondary', fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={profile.phone || 'Not provided'}
                        disabled
                        variant="filled"
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary', fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Location"
                        value={profile.location || 'Not provided'}
                        disabled
                        variant="filled"
                        size={isMobile ? "small" : "medium"}
                        InputProps={{
                          startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary', fontSize: { xs: '1rem', sm: '1.25rem' } }} />
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Bio / Professional Summary"
                        value={profile.bio || 'Tell us about yourself...'}
                        disabled
                        variant="filled"
                        multiline
                        rows={isMobile ? 2 : 3}
                        size={isMobile ? "small" : "medium"}
                        placeholder="Tell us about your professional background, skills, and career goals..."
                      />
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: { xs: 3, sm: 4 } }} />

                  {/* Skills Section */}
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    fontWeight="bold" 
                    gutterBottom 
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                  >
                    Skills
                  </Typography>
                  <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                    {profile.skills && profile.skills.length > 0 ? (
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {profile.skills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            color="primary"
                            variant="outlined"
                            size={isMobile ? "small" : "medium"}
                            sx={{ mb: 1 }}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        color="text.secondary"
                      >
                        No skills added yet. Add your skills to improve your profile visibility.
                      </Typography>
                    )}
                  </Box>

                  {/* Experience Section */}
                  <Typography 
                    variant={isMobile ? "subtitle1" : "h6"} 
                    fontWeight="bold" 
                    gutterBottom 
                    sx={{ mb: { xs: 1.5, sm: 2 } }}
                  >
                    Experience
                  </Typography>
                  <Box>
                    {profile.experience && profile.experience.length > 0 ? (
                      <Stack spacing={{ xs: 1.5, sm: 2 }}>
                        {profile.experience.map((exp, index) => (
                          <Paper 
                            key={index} 
                            sx={{ 
                              p: { xs: 1.5, sm: 2 }, 
                              bgcolor: 'grey.50',
                              borderRadius: { xs: 1, sm: 2 }
                            }}
                          >
                            <Typography 
                              variant={isMobile ? "body2" : "subtitle1"} 
                              fontWeight="medium"
                            >
                              {exp.position} at {exp.company}
                            </Typography>
                            <Typography 
                              variant={isMobile ? "caption" : "body2"} 
                              color="text.secondary"
                            >
                              {exp.startDate} - {exp.endDate || 'Present'}
                            </Typography>
                            {exp.description && (
                              <Typography 
                                variant={isMobile ? "caption" : "body2"} 
                                sx={{ mt: 1 }}
                              >
                                {exp.description}
                              </Typography>
                            )}
                          </Paper>
                        ))}
                      </Stack>
                    ) : (
                      <Typography 
                        variant={isMobile ? "caption" : "body2"} 
                        color="text.secondary"
                      >
                        No work experience added yet. Add your experience to showcase your background.
                      </Typography>
                    )}
                  </Box>
              </TabPanel>

                {/* Posts Tab */}
                <TabPanel value={activeTab} index={1}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', sm: 'center' }, 
                    mb: { xs: 2, sm: 3 },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2, sm: 0 }
                  }}>
                    <Typography 
                      variant={isMobile ? "h6" : "h5"} 
                      sx={{ fontWeight: 'bold' }}
                    >
                      My Posts ({userPosts?.length || 0})
                    </Typography>
                  </Box>

                {postsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <LinearProgress sx={{ width: '100%' }} />
                  </Box>
                ) : !userPosts || userPosts.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Article sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No posts yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Share your first post to connect with others
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/app/network')}
                      sx={{ textTransform: 'none' }}
                    >
                      Go to Network
                    </Button>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {userPosts.map((post, index) => (
                      <Card key={post._id || `post-${index}`} sx={{ borderRadius: 2, boxShadow: 1 }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar src={post.author?.profilePicture} sx={{ width: 40, height: 40 }}>
                                {post.author?.firstName?.[0] || 'U'}{post.author?.lastName?.[0] || ''}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                  {post.author?.firstName || 'Unknown'} {post.author?.lastName || 'User'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date'}
                                </Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Typography variant="body1" sx={{ mb: 2 }}>
                            {post.content}
                          </Typography>

                          <Box sx={{ display: 'flex', gap: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Button
                              startIcon={<Favorite />}
                              size="small"
                              sx={{ textTransform: 'none', color: 'text.secondary' }}
                            >
                              {post.likesCount || 0} Likes
                            </Button>
                            <Button
                              startIcon={<Comment />}
                              size="small"
                              sx={{ textTransform: 'none', color: 'text.secondary' }}
                            >
                              {post.commentsCount || 0} Comments
                            </Button>
                            <Button
                              startIcon={<Share />}
                              size="small"
                              sx={{ textTransform: 'none', color: 'text.secondary' }}
                            >
                              {post.sharesCount || 0} Shares
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </TabPanel>

              {/* Stories Tab */}
              <TabPanel value={activeTab} index={2}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: { xs: 'flex-start', sm: 'center' }, 
                  mb: { xs: 2, sm: 3 },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 0 }
                }}>
                  <Typography 
                    variant={isMobile ? "h6" : "h5"} 
                    sx={{ fontWeight: 'bold' }}
                  >
                    My Stories ({userStories?.length || 0})
                  </Typography>
                  {isOwnProfile && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setShowCreateStory(true)}
                      size={isMobile ? "small" : "medium"}
                      sx={{ textTransform: 'none' }}
                    >
                      Create Story
                    </Button>
                  )}
                </Box>

                {storiesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <LinearProgress sx={{ width: '100%' }} />
                  </Box>
                ) : !userStories || userStories.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <AutoStories sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No stories yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Share your professional journey through stories
                    </Typography>
                    {isOwnProfile && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => setShowCreateStory(true)}
                        sx={{ textTransform: 'none' }}
                      >
                        Create Your First Story
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Stack spacing={{ xs: 2, sm: 3 }}>
                    {userStories.map((story, index) => (
                      <Card key={story._id || `story-${index}`} sx={{ 
                        borderRadius: { xs: 2, sm: 3 }, 
                        boxShadow: 2,
                        overflow: 'hidden',
                        background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`
                      }}>
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                          {/* Story Header */}
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start', 
                            mb: 2 
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Avatar 
                                src={story.author?.profilePicture} 
                                sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}
                              >
                                {story.author?.firstName?.[0] || 'U'}{story.author?.lastName?.[0] || ''}
                              </Avatar>
                              <Box>
                                <Typography 
                                  variant={isMobile ? "subtitle2" : "subtitle1"} 
                                  sx={{ fontWeight: 'bold' }}
                                >
                                  {story.author?.firstName || 'Unknown'} {story.author?.lastName || 'User'}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                >
                                  {story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Unknown date'}
                                </Typography>
                              </Box>
                            </Box>
                            <Chip
                              label={story.type?.replace('_', ' ') || 'Story'}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Box>

                          {/* Story Content */}
                          <Typography 
                            variant={isMobile ? "h6" : "h5"} 
                            fontWeight="bold" 
                            sx={{ mb: 1.5 }}
                          >
                            {story.title}
                          </Typography>
                          
                          <Typography 
                            variant={isMobile ? "body2" : "body1"} 
                            sx={{ mb: 2, lineHeight: 1.6 }}
                          >
                            {story.content}
                          </Typography>

                          {/* Story Media */}
                          {story.media && (
                            <Box sx={{ mb: 2 }}>
                              {story.media.type === 'video' ? (
                                <video
                                  src={story.media.url}
                                  style={{ 
                                    width: '100%', 
                                    maxHeight: 300, 
                                    borderRadius: 8,
                                    objectFit: 'cover'
                                  }}
                                  controls
                                />
                              ) : (
                                <img
                                  src={story.media.url}
                                  alt="Story media"
                                  style={{ 
                                    width: '100%', 
                                    maxHeight: 300, 
                                    borderRadius: 8,
                                    objectFit: 'cover'
                                  }}
                                />
                              )}
                            </Box>
                          )}

                          {/* Story Tags */}
                          {story.tags && story.tags.length > 0 && (
                            <Box sx={{ mb: 2 }}>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {story.tags.map((tag: string, tagIndex: number) => (
                                  <Chip
                                    key={tagIndex}
                                    label={`#${tag}`}
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                  />
                                ))}
                              </Stack>
                            </Box>
                          )}

                          {/* Story Actions */}
                          <Box sx={{ 
                            display: 'flex', 
                            gap: 2, 
                            pt: 1, 
                            borderTop: '1px solid', 
                            borderColor: 'divider' 
                          }}>
                            <Button
                              startIcon={<Favorite />}
                              size="small"
                              sx={{ textTransform: 'none', color: 'text.secondary' }}
                            >
                              {story.likesCount || 0} Likes
                            </Button>
                            <Button
                              startIcon={<Comment />}
                              size="small"
                              sx={{ textTransform: 'none', color: 'text.secondary' }}
                            >
                              {story.commentsCount || 0} Comments
                            </Button>
                            <Button
                              startIcon={<Share />}
                              size="small"
                              sx={{ textTransform: 'none', color: 'text.secondary' }}
                            >
                              Share
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </TabPanel>

              {/* Connections Tab */}
              <TabPanel value={activeTab} index={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    My Connections ({connections?.length || 0})
                  </Typography>
                </Box>

                {connectionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <LinearProgress sx={{ width: '100%' }} />
                  </Box>
                ) : connections.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      No connections yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start connecting with professionals in your field
                    </Typography>
                  </Box>
                ) : (
                  <List>
                    {connections.map((connection) => (
                      <ListItem
                        key={connection._id}
                        sx={{
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          mb: 1,
                          boxShadow: 1,
                          '&:hover': { boxShadow: 2 }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar src={connection.user?.profilePicture}>
                            {connection.user?.firstName?.[0] || 'U'}{connection.user?.lastName?.[0] || ''}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${connection.user?.firstName || 'Unknown'} ${connection.user?.lastName || 'User'}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {connection.user?.jobTitle || 'Professional'}
                                {connection.user?.company && ` at ${connection.user.company}`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Connected on {connection.connectedAt ? new Date(connection.connectedAt).toLocaleDateString() : 'Unknown date'}
                              </Typography>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <IconButton 
                            edge="end" 
                            color="error"
                            onClick={() => handleRemoveConnection(connection.user?._id || connection._id)}
                          >
                            <PersonRemove />
                          </IconButton>
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                )}
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel value={activeTab} index={4}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                  Account Settings
                </Typography>

                {!isOwnProfile ? (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    You can only view and modify your own account settings.
                  </Alert>
                ) : (
                  <Stack spacing={3}>
                    {/* Privacy Settings */}
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Security color="primary" />
                          Privacy & Security
                        </Typography>
                        <Stack spacing={2}>
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Profile visible to public"
                          />
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Show my activity status"
                          />
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Allow messages from others"
                          />
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Notification Settings */}
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Notifications color="primary" />
                          Notifications
                        </Typography>
                        <Stack spacing={2}>
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Email notifications"
                          />
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Push notifications"
                          />
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Job alert notifications"
                          />
                        </Stack>
                      </CardContent>
                    </Card>

                    {/* Appearance Settings */}
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Palette color="primary" />
                          Appearance & Preferences
                        </Typography>
                        <Stack spacing={2}>
                          <FormControlLabel
                            control={
                              <Switch 
                                checked={mode === 'dark'} 
                                onChange={toggleTheme}
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: theme.palette.primary.main,
                                    '& + .MuiSwitch-track': {
                                      backgroundColor: theme.palette.primary.main,
                                    },
                                  },
                                  '& .MuiSwitch-track': {
                                    backgroundColor: alpha(theme.palette.text.primary, 0.2),
                                  },
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                  Dark mode
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {mode === 'dark' ? 'Currently enabled' : 'Currently disabled'}
                                </Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            control={<Switch />}
                            label="Compact view"
                          />
                          <FormControlLabel
                            control={<Switch defaultChecked />}
                            label="Show animations"
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                )}
              </TabPanel>
            </Box>
          </Card>
        </Grid>
      </Grid>

      </Container>

      {/* Create Story Dialog */}
      <CreateStory
        open={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onStoryCreated={(newStory) => {
          setUserStories(prev => [newStory, ...prev]);
          setShowCreateStory(false);
        }}
      />

      {/* CV Builder Popup */}
      {profile && (
        <CVBuilderPopup
          open={showCVBuilderPopup}
          onClose={handleCVBuilderClose}
          onBuildCV={handleCVBuilderAction}
          onContinueProfile={handleCVBuilderContinueProfile}
          user={profile}
        />
      )}

      {/* Share Profile Menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={() => setShareMenuAnchor(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 200,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <MenuItem onClick={handleShareProfile} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <ContentCopy color="primary" />
          </ListItemIcon>
          <ListItemText primary="Copy Profile Link" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleShareToSocial('linkedin')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <LinkedIn sx={{ color: '#0077b5' }} />
          </ListItemIcon>
          <ListItemText primary="Share on LinkedIn" />
        </MenuItem>
        <MenuItem onClick={() => handleShareToSocial('twitter')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Twitter sx={{ color: '#1DA1F2' }} />
          </ListItemIcon>
          <ListItemText primary="Share on Twitter" />
        </MenuItem>
        <MenuItem onClick={() => handleShareToSocial('facebook')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <Facebook sx={{ color: '#1877f2' }} />
          </ListItemIcon>
          <ListItemText primary="Share on Facebook" />
        </MenuItem>
        <MenuItem onClick={() => handleShareToSocial('whatsapp')} sx={{ py: 1.5 }}>
          <ListItemIcon>
            <WhatsApp sx={{ color: '#25D366' }} />
          </ListItemIcon>
          <ListItemText primary="Share on WhatsApp" />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ModernProfilePage;

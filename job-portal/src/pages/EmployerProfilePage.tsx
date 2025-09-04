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
  Divider,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  Stack,
  Badge,
  CardMedia,
  CardActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  CircularProgress,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  Email,
  Phone,
  LocationOn,
  Security,
  Notifications,
  Upload,
  Settings,
  Public,
  Lock,
  Group,
  PostAdd,
  ThumbUp,
  Comment,
  Share,
  Business,
  CalendarToday,
  PeopleAlt,
  Delete,
  MoreVert
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { socialNetworkService } from '../services/socialNetworkService';
import type { User } from '../types/user';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { validateImageFile, processImage, blobToFile, createImagePreview } from '../utils/imageUtils';

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
      id={`employer-profile-tabpanel-${index}`}
      aria-labelledby={`employer-profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const EmployerProfilePage: React.FC = () => {
  const { user, setUserData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState<User | null>(user);
  const [editedProfile, setEditedProfile] = useState<Partial<User>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Social data
  const [connections, setConnections] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [socialLoading, setSocialLoading] = useState(false);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [postMenuAnchor, setPostMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});

  // Check if viewing someone else's profile
  const isOwnProfile = !location.state?.userId || location.state?.userId === user?._id;
  const viewingUserId = location.state?.userId || user?._id;

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    allowMessages: true,
    allowJobAlerts: true
  });

  useEffect(() => {
    if (isOwnProfile && user) {
      setProfile(user);
      setEditedProfile(user);
    } else if (!isOwnProfile && viewingUserId) {
      // Load other user's profile
      loadUserProfile(viewingUserId);
    }
    
    // Load social data
    loadSocialData();
  }, [user, viewingUserId, isOwnProfile]);

  const loadUserProfile = async (userId: string) => {
    setLoading(true);
    try {
      // In a real app, you'd have an API to get user by ID
      // For now, we'll use the current user as fallback
      setProfile(user);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setErrorMessage('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadSocialData = async () => {
    setSocialLoading(true);
    try {
      // Load connections
      const connectionsResponse = await socialNetworkService.getConnections();
      setConnections(connectionsResponse.data.slice(0, 6)); // Show first 6 connections
      setConnectionsCount(connectionsResponse.data.length);

      // Load real posts data
      const postsResponse = await socialNetworkService.getUserPosts(viewingUserId);
      setPosts(postsResponse.data || []);
      setPostsCount(postsResponse.data?.length || 0);
    } catch (error) {
      console.error('Error loading social data:', error);
      // In case of error, set empty arrays to avoid showing stale data
      setPosts([]);
      setPostsCount(0);
    } finally {
      setSocialLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleEditToggle = () => {
    setEditMode(!editMode);
    if (!editMode) {
      setEditedProfile({ ...profile });
    } else {
      setEditedProfile({});
    }
  };

  const handleInputChange = (field: keyof User) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSaveProfile = async () => {
    if (!profile?._id) return;

    setLoading(true);
    try {
      const updatedProfile = await userService.updateProfile(profile._id, editedProfile);
      
      // Update local state with the response
      setProfile(updatedProfile);
      setUserData(updatedProfile);
      
      setEditMode(false);
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (user: any) => {
    // Navigate to appropriate profile based on user role
    if (user.role === 'employer' || user.userType === 'employer') {
      navigate(`/app/employer/profile`, { state: { userId: user._id } });
    } else {
      navigate(`/app/profile/view/${user._id}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      await socialNetworkService.deletePost(postId);
      
      // Remove the post from local state
      setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      setPostsCount(prevCount => prevCount - 1);
      
      setSuccessMessage('Post deleted successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting post:', error);
      setErrorMessage('Failed to delete post. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
    
    // Close the menu
    setPostMenuAnchor(prev => ({ ...prev, [postId]: null }));
  };

  const handlePostMenuOpen = (event: React.MouseEvent<HTMLElement>, postId: string) => {
    setPostMenuAnchor(prev => ({ ...prev, [postId]: event.currentTarget }));
  };

  const handlePostMenuClose = (postId: string) => {
    setPostMenuAnchor(prev => ({ ...prev, [postId]: null }));
  };

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?._id) return;

    try {
      // Validate the image file
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid image file');
        setTimeout(() => setErrorMessage(''), 5000);
        // Clear the file input
        event.target.value = '';
        return;
      }

      setUploadingImage(true);
      setErrorMessage('');
      
      // Create preview for immediate UI feedback
      const preview = await createImagePreview(file);
      setImagePreview(preview);

      // Process the image (resize and compress)
      const processedBlob = await processImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.8,
        format: 'image/jpeg'
      });

      // Convert blob back to file
      const processedFile = blobToFile(processedBlob, `profile-${profile._id}.jpg`);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('profilePicture', processedFile);
      
      // Upload to server
      const updatedProfile = await userService.uploadProfilePicture(profile._id, formData);
      
      // Update local state with the response
      setProfile(prevProfile => ({
        ...prevProfile,
        ...updatedProfile,
        profilePicture: updatedProfile.profilePicture || preview
      }));
      
      // Update auth context if it's current user's profile - preserve existing data
      if (isOwnProfile) {
        setUserData({
          ...profile,
          ...updatedProfile,
          profilePicture: updatedProfile.profilePicture || preview
        });
      }
      
      setSuccessMessage('Profile picture updated successfully');
      setTimeout(() => {
        setSuccessMessage('');
        setImagePreview(null);
      }, 3000);
      
      // Clear the file input to allow re-upload of the same file if needed
      event.target.value = '';

    } catch (error) {
      console.error('Error uploading profile picture:', error);
      
      let errorMsg = 'Failed to upload profile picture. Please try again.';
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setTimeout(() => setErrorMessage(''), 5000);
      
      // Reset preview on error
      setImagePreview(null);
      
      // Clear the file input on error as well
      event.target.value = '';
    } finally {
      setUploadingImage(false);
      // Clear the file input
      event.target.value = '';
    }
  };

  if (!profile) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <LinearProgress sx={{ width: '100%' }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper elevation={1} sx={{ mb: 3, p: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={imagePreview || profile.avatar || profile.profilePicture}
                alt={`${profile.firstName} ${profile.lastName}`}
                sx={{ 
                  width: 100, 
                  height: 100,
                  border: 3,
                  borderColor: 'primary.main',
                  opacity: uploadingImage ? 0.6 : 1,
                  transition: 'opacity 0.3s ease'
                }}
              >
                {!imagePreview && !profile.avatar && !profile.profilePicture && 
                  `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`
                }
              </Avatar>
              
              {/* Loading indicator for image upload */}
              {uploadingImage && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              )}

              {isOwnProfile && (
                <>
                  <input
                    accept="image/*"
                    type="file"
                    id="profile-picture-upload"
                    style={{ display: 'none' }}
                    onChange={handleProfilePictureUpload}
                    disabled={uploadingImage}
                  />
                  <label htmlFor="profile-picture-upload">
                    <Tooltip title={uploadingImage ? "Uploading..." : "Change profile picture"}>
                      <IconButton
                        component="span"
                        disabled={uploadingImage}
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          bgcolor: 'primary.main',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                          '&:disabled': {
                            bgcolor: 'grey.400',
                          },
                        }}
                        size="small"
                      >
                        <Upload fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </label>
                </>
              )}
            </Box>
          </Grid>
          <Grid item xs>
            <Typography variant="h4" gutterBottom>
              {profile.firstName} {profile.lastName}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Employer Account
            </Typography>
            
            {/* Stats row */}
            <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {connectionsCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Connections
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {postsCount}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Posts
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {profile.profileViews || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Profile Views
                </Typography>
              </Box>
            </Stack>
          </Grid>
          
          {isOwnProfile && (
            <Grid item>
              <Button
                variant={editMode ? "outlined" : "contained"}
                startIcon={editMode ? <Cancel /> : <Edit />}
                onClick={handleEditToggle}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
              {editMode && (
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveProfile}
                  disabled={loading}
                  sx={{ ml: 1 }}
                >
                  Save Changes
                </Button>
              )}
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tabs */}
      <Paper elevation={1}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab 
              label="PERSONAL INFO" 
              icon={<Person />} 
              iconPosition="start"
            />
            <Tab 
              label={`POSTS (${postsCount})`}
              icon={<PostAdd />} 
              iconPosition="start"
            />
            <Tab 
              label={`CONNECTIONS (${connectionsCount})`}
              icon={<Group />} 
              iconPosition="start"
            />
            {isOwnProfile && (
              <>
                <Tab 
                  label="SECURITY" 
                  icon={<Security />} 
                  iconPosition="start"
                />
                <Tab 
                  label="PRIVACY" 
                  icon={<Lock />} 
                  iconPosition="start"
                />
              </>
            )}
          </Tabs>
        </Box>

        {/* Personal Info Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            {/* First Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                value={editedProfile.firstName || ''}
                onChange={handleInputChange('firstName')}
                disabled={!editMode}
                variant="outlined"
                InputProps={{
                  readOnly: !editMode,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    bgcolor: !editMode ? 'grey.100' : 'background.paper',
                  }
                }}
              />
            </Grid>

            {/* Last Name */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={editedProfile.lastName || ''}
                onChange={handleInputChange('lastName')}
                disabled={!editMode}
                variant="outlined"
                InputProps={{
                  readOnly: !editMode,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    bgcolor: !editMode ? 'grey.100' : 'background.paper',
                  }
                }}
              />
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                value={editedProfile.email || ''}
                onChange={handleInputChange('email')}
                disabled={!editMode}
                variant="outlined"
                type="email"
                InputProps={{
                  readOnly: !editMode,
                  startAdornment: <Email sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    bgcolor: !editMode ? 'grey.100' : 'background.paper',
                  }
                }}
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                value={editedProfile.phone || ''}
                onChange={handleInputChange('phone')}
                disabled={!editMode}
                variant="outlined"
                InputProps={{
                  readOnly: !editMode,
                  startAdornment: <Phone sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    bgcolor: !editMode ? 'grey.100' : 'background.paper',
                  }
                }}
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={editedProfile.location || ''}
                onChange={handleInputChange('location')}
                disabled={!editMode}
                variant="outlined"
                InputProps={{
                  readOnly: !editMode,
                  startAdornment: <LocationOn sx={{ color: 'text.secondary', mr: 1 }} />,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    bgcolor: !editMode ? 'grey.100' : 'background.paper',
                  }
                }}
              />
            </Grid>

            {/* Bio */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Bio"
                value={editedProfile.bio || ''}
                onChange={handleInputChange('bio')}
                disabled={!editMode}
                variant="outlined"
                multiline
                rows={4}
                InputProps={{
                  readOnly: !editMode,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    bgcolor: !editMode ? 'grey.100' : 'background.paper',
                  }
                }}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Posts Tab */}
        <TabPanel value={currentTab} index={1}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                <PostAdd sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recent Posts
              </Typography>
              {isOwnProfile && (
                <Button variant="contained" startIcon={<PostAdd />}>
                  Create Post
                </Button>
              )}
            </Box>

            {socialLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : posts.length > 0 ? (
              <Stack spacing={2}>
                {posts.map((post) => (
                  <motion.div
                    key={post._id}
                    whileHover={{ y: -2 }}
                    style={{ width: '100%' }}
                  >
                    <Card 
                      sx={{ 
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Avatar
                            src={post.author?.profilePicture || profile.avatar || profile.profilePicture}
                            sx={{ width: 40, height: 40, mr: 2 }}
                          >
                            {(post.author?.firstName?.[0] || profile.firstName?.[0])}{(post.author?.lastName?.[0] || profile.lastName?.[0])}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle1" fontWeight="600">
                              {post.author?.firstName || profile.firstName} {post.author?.lastName || profile.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <CalendarToday sx={{ fontSize: 12, mr: 0.5 }} />
                              {new Date(post.createdAt || post.timestamp).toLocaleDateString()}
                            </Typography>
                          </Box>
                          
                          {/* Post menu - only show for own posts */}
                          {isOwnProfile && (
                            <>
                              <IconButton
                                size="small"
                                onClick={(e) => handlePostMenuOpen(e, post._id)}
                                sx={{ color: 'text.secondary' }}
                              >
                                <MoreVert />
                              </IconButton>
                              
                              <Menu
                                anchorEl={postMenuAnchor[post._id]}
                                open={Boolean(postMenuAnchor[post._id])}
                                onClose={() => handlePostMenuClose(post._id)}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                              >
                                <MenuItem 
                                  onClick={() => handleDeletePost(post._id)}
                                  sx={{ color: 'error.main' }}
                                >
                                  <Delete sx={{ mr: 1 }} fontSize="small" />
                                  Delete Post
                                </MenuItem>
                              </Menu>
                            </>
                          )}
                        </Box>
                        
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {post.content}
                        </Typography>
                        
                        {/* Display post media if available */}
                        {post.media && post.media.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            {post.media.map((mediaItem: any, index: number) => (
                              <Box key={index} sx={{ mb: 1 }}>
                                {mediaItem.type === 'image' ? (
                                  <img
                                    src={mediaItem.url}
                                    alt="Post media"
                                    style={{
                                      width: '100%',
                                      maxHeight: '300px',
                                      objectFit: 'cover',
                                      borderRadius: '8px'
                                    }}
                                  />
                                ) : (
                                  <video
                                    src={mediaItem.url}
                                    controls
                                    style={{
                                      width: '100%',
                                      maxHeight: '300px',
                                      borderRadius: '8px'
                                    }}
                                  />
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
                        
                        <Divider sx={{ mb: 2 }} />
                        
                        <Stack direction="row" spacing={2}>
                          <Button
                            size="small"
                            startIcon={<ThumbUp />}
                            sx={{ color: 'text.secondary' }}
                          >
                            {post.likesCount || 0} Likes
                          </Button>
                          <Button
                            size="small"
                            startIcon={<Comment />}
                            sx={{ color: 'text.secondary' }}
                          >
                            {post.commentsCount || 0} Comments
                          </Button>
                          <Button
                            size="small"
                            startIcon={<Share />}
                            sx={{ color: 'text.secondary' }}
                          >
                            {post.sharesCount || 0} Shares
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Stack>
            ) : (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <PostAdd sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Posts Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isOwnProfile 
                      ? "Share your thoughts and updates with your network"
                      : "This user hasn't posted anything yet"
                    }
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Box>
        </TabPanel>

        {/* Connections Tab */}
        <TabPanel value={currentTab} index={2}>
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                <PeopleAlt sx={{ mr: 1, verticalAlign: 'middle' }} />
                Connections
              </Typography>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/app/connections')}
              >
                View All
              </Button>
            </Box>

            {socialLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : connections.length > 0 ? (
              <Grid container spacing={2}>
                {connections.map((connection) => (
                  <Grid item xs={12} sm={6} md={4} key={connection._id}>
                    <Card 
                      component={motion.div}
                      whileHover={{ y: -4 }}
                      sx={{ borderRadius: 2 }}
                    >
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Avatar
                          src={connection.user.profilePicture}
                          sx={{ width: 64, height: 64, mx: 'auto', mb: 2 }}
                        >
                          {connection.user.firstName?.[0]}{connection.user.lastName?.[0]}
                        </Avatar>
                        
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {connection.user.firstName} {connection.user.lastName}
                        </Typography>
                        
                        {connection.user.jobTitle && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {connection.user.jobTitle}
                          </Typography>
                        )}
                        
                        {connection.user.company && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            at {connection.user.company}
                          </Typography>
                        )}

                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewProfile(connection.user)}
                          fullWidth
                        >
                          View Profile
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <PeopleAlt sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No Connections Yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isOwnProfile 
                      ? "Start building your professional network"
                      : "This user hasn't connected with anyone yet"
                    }
                  </Typography>
                  {isOwnProfile && (
                    <Button 
                      variant="contained" 
                      sx={{ mt: 2 }}
                      onClick={() => navigate('/app/network')}
                    >
                      Discover People
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={currentTab} index={isOwnProfile ? 3 : 1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                Security Settings
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" color="text.secondary">
                Security settings are managed through your account settings. 
                Contact support if you need to change your password or enable two-factor authentication.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        {/* Privacy Tab */}
        {isOwnProfile && (
          <TabPanel value={currentTab} index={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Lock sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Privacy Settings
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  Privacy settings allow you to control how your information is displayed to other users.
                  As an employer, some information may be visible to job seekers when you post jobs or contact candidates.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>
        )}
      </Paper>
    </Container>
  );
};

export default EmployerProfilePage;
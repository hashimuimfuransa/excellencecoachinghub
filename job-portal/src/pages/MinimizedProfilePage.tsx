import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  IconButton,
  LinearProgress,
  Alert,
  Grid,
  Fade,
  Paper,
  Stack,
  Divider,
  useTheme,
  Tabs,
  Tab,
  Badge,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Switch,
  TextField,
  InputAdornment,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Person,
  Work,
  LocationOn,
  Email,
  Phone,
  CheckCircle,
  TrendingUp,
  Warning,
  Star,
  Visibility,
  Upload,
  Article,
  People,
  Settings,
  Add,
  Search,
  MoreVert,
  Favorite,
  Comment,
  Share,
  PersonAdd,
  PersonRemove,
  Block,
  Notifications,
  Security,
  Language,
  Palette,
  Delete,
  Public,
  Lock,
  PhotoCamera,
  Close,
  AttachFile,
  PlayArrow
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import type { User } from '../types/user';
import { useNavigate, useParams } from 'react-router-dom';
import { validateProfileSimple } from '../utils/simpleProfileValidation';
import { socialNetworkService, Post, Connection } from '../services/socialNetworkService';
import { settingsService, UserSettings } from '../services/settingsService';
import { enhancedStoryService } from '../services/enhancedStoryService';
import EnhancedCreateStory from '../components/social/EnhancedCreateStory';
import EnhancedStoryViewer from '../components/social/EnhancedStoryViewer';

const MinimizedProfilePage: React.FC = () => {
  const { user, updateUser, setUserData } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [profileValidation, setProfileValidation] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [newPostDialog, setNewPostDialog] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostPrivacy, setNewPostPrivacy] = useState<'public' | 'connections'>('public');
  const [createPostLoading, setCreatePostLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [searchConnections, setSearchConnections] = useState('');
  
  // Story-related state
  const [userStories, setUserStories] = useState<any[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [storyViewerStories, setStoryViewerStories] = useState<any[]>([]);
  
  // Real backend state
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [postsLoading, setPostsLoading] = useState(false);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = !userId || userId === user?._id;
  const targetUserId = userId || user?._id;

  useEffect(() => {
    if (targetUserId) {
      loadUserProfile();
      loadUserPosts();
      loadConnections();
      loadUserSettings();
      loadUserStories();
    }
  }, [targetUserId]);

  useEffect(() => {
    if (profile) {
      const validation = validateProfileSimple(profile);
      setProfileValidation(validation);
    }
  }, [profile]);

  const loadUserProfile = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      const userProfile = await userService.getUserProfile(targetUserId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPosts = async () => {
    if (!targetUserId) return;
    
    setPostsLoading(true);
    try {
      const posts = await socialNetworkService.getUserPosts(targetUserId);
      const safePosts = Array.isArray(posts) ? posts.map(post => ({
        ...post,
        likes: post.likes || [],
        likesCount: post.likesCount || 0,
        commentsCount: post.commentsCount || 0,
        sharesCount: post.sharesCount || 0,
        author: post.author || {},
        visibility: post.visibility || 'private'
      })) : [];
      setUserPosts(safePosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      setUserPosts([]); // Set empty array on error
    } finally {
      setPostsLoading(false);
    }
  };

  const loadConnections = async () => {
    setConnectionsLoading(true);
    try {
      const userConnections = await socialNetworkService.getConnections();
      setConnections(Array.isArray(userConnections) ? userConnections : []);
    } catch (error) {
      console.error('Error loading connections:', error);
      setConnections([]); // Set empty array on error
    } finally {
      setConnectionsLoading(false);
    }
  };

  const loadUserStories = async () => {
    if (!targetUserId) {
      console.log('📚 Profile Page - No targetUserId provided');
      return;
    }
    
    setStoriesLoading(true);
    try {
      console.log('📚 Profile Page - Loading stories for user:', targetUserId);
      console.log('📚 Profile Page - Current user:', user?._id);
      console.log('📚 Profile Page - Is own profile:', isOwnProfile);
      
      // Try the stories feed approach first (same as network page)
      let storiesResponse = await enhancedStoryService.getStoriesFeed(1, 20);
      
      console.log('📚 Profile Page - Stories feed response:', storiesResponse);
      
      if (storiesResponse.success && storiesResponse.data) {
        const allStories = Array.isArray(storiesResponse.data) ? storiesResponse.data : [storiesResponse.data];
        
        // Filter stories for the specific user
        const userStories = allStories.filter((story: any) => {
          const storyAuthorId = story.author?._id || story.author?.id;
          const targetId = targetUserId;
          console.log('📚 Profile Page - Comparing story author:', storyAuthorId, 'with target:', targetId);
          return storyAuthorId === targetId;
        });
        
        console.log('📚 Profile Page - Found user stories from feed:', userStories.length);
        console.log('📚 Profile Page - Stories details:', userStories.map(s => ({ id: s._id, title: s.title, type: s.type, author: s.author?._id })));
        setUserStories(userStories);
      } else {
        console.log('📚 Profile Page - Stories feed failed, trying getUserStories fallback');
        
        // Fallback to getUserStories if stories feed doesn't work
        const fallbackResponse = await enhancedStoryService.getUserStories(targetUserId);
        console.log('📚 Profile Page - Fallback response:', fallbackResponse);
        
        if (fallbackResponse.success && fallbackResponse.data) {
          const stories = Array.isArray(fallbackResponse.data) ? fallbackResponse.data : [fallbackResponse.data];
          console.log('📚 Profile Page - Found user stories from fallback:', stories.length);
          setUserStories(stories);
        } else {
          console.log('📚 Profile Page - No stories found in fallback either:', fallbackResponse.error);
          setUserStories([]);
        }
      }
    } catch (error) {
      console.error('📚 Profile Page - Error loading stories:', error);
      setUserStories([]);
    } finally {
      setStoriesLoading(false);
    }
  };

  const loadUserSettings = async () => {
    if (!targetUserId) return;
    
    setSettingsLoading(true);
    try {
      const settings = await settingsService.getUserSettings(targetUserId);
      setUserSettings(settings);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Set default settings when API fails
      const defaultSettings = {
        notifications: {
          email: true,
          push: true,
          jobAlerts: true,
          emailFrequency: 'daily' as const
        },
        privacy: {
          profileVisibility: 'public' as const,
          showEmail: false,
          showPhone: false,
          showLocation: true,
          allowMessages: true,
          allowJobAlerts: true,
          showOnlineStatus: true,
          allowSearchIndexing: true
        },
        appearance: {
          theme: 'system' as const,
          language: 'en',
          fontSize: 'medium' as const,
          compactMode: false,
          showAnimations: true
        },
        preferences: {
          autoSave: true,
          rememberMe: true,
          twoFactorAuth: false,
          sessionTimeout: 30
        }
      };
      setUserSettings(defaultSettings);
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleCompleteProfile = () => {
    navigate('/app/profile/edit');
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setMediaPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setMediaPreview(null);
      }
    }
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedMedia) return;
    
    try {
      setCreatePostLoading(true);
      
      const postData: any = {
        content: newPostContent.trim(),
        postType: selectedMedia ? (selectedMedia.type.startsWith('image/') ? 'image' : selectedMedia.type.startsWith('video/') ? 'video' : 'document') : 'text',
        visibility: newPostPrivacy
      };

      let newPost;
      if (selectedMedia) {
        // Upload with media
        const formData = new FormData();
        formData.append('content', newPostContent.trim());
        formData.append('postType', postData.postType);
        formData.append('visibility', newPostPrivacy);
        formData.append('media', selectedMedia);
        
        newPost = await socialNetworkService.createPostWithMedia(formData);
      } else {
        // Text only post
        newPost = await socialNetworkService.createPost(postData);
      }
      
      // Add the new post to the beginning of the posts array with proper defaults
      const safeNewPost = {
        ...newPost,
        likes: newPost.likes || [],
        likesCount: newPost.likesCount || 0,
        commentsCount: newPost.commentsCount || 0,
        sharesCount: newPost.sharesCount || 0,
        author: newPost.author || user,
        visibility: newPost.visibility || newPostPrivacy
      };
      setUserPosts(prevPosts => [safeNewPost, ...prevPosts]);
      
      // Reset form
      setNewPostContent('');
      setNewPostPrivacy('public');
      setSelectedMedia(null);
      setMediaPreview(null);
      setNewPostDialog(false);
      
      setSuccessMessage('Post created successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error creating post:', error);
      setErrorMessage('Failed to create post. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setCreatePostLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!postId) {
      console.error('Post ID is required for deletion');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await socialNetworkService.deletePost(postId);
      setUserPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
      setSuccessMessage('Post deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting post:', error);
      setErrorMessage('Failed to delete post. Please try again.');
      setTimeout(() => setErrorMessage(''), 3000);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!postId) {
      console.error('Post ID is required for liking');
      return;
    }
    
    try {
      await socialNetworkService.likePost(postId);
      // Refresh posts to get updated like count
      await loadUserPosts();
    } catch (error) {
      console.error('Error liking post:', error);
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

  // Story handlers
  const handleCreateStoryClick = () => {
    setShowCreateStory(true);
  };

  const handleStoryCreated = (newStory: any) => {
    setUserStories(prev => [newStory, ...prev]);
    setSuccessMessage('Story created successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleStoryClick = (story: any, index: number) => {
    setStoryViewerStories(userStories);
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  };

  const handleStoryViewerClose = () => {
    setShowStoryViewer(false);
    setSelectedStoryIndex(0);
  };

  const handleStoryChange = (index: number, story: any) => {
    setUserStories(prev => prev.map(s => s._id === story._id ? story : s));
  };

  const handleSettingsChange = async (section: keyof UserSettings, key: string, value: any) => {
    if (!userSettings || !targetUserId) return;

    const updatedSettings = {
      ...userSettings,
      [section]: {
        ...(userSettings[section] || {}),
        [key]: value
      }
    };

    setUserSettings(updatedSettings);

    try {
      // Save to backend based on section
      if (section === 'notifications') {
        await settingsService.updateNotificationSettings(targetUserId, updatedSettings.notifications);
      } else if (section === 'privacy') {
        await settingsService.updatePrivacySettings(targetUserId, updatedSettings.privacy);
      } else if (section === 'appearance') {
        await settingsService.updateAppearanceSettings(targetUserId, updatedSettings.appearance);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // Don't show error to user as it's saved locally
    }
  };

  const filteredConnections = (connections || []).filter(connection =>
    connection?.user?.firstName?.toLowerCase().includes(searchConnections.toLowerCase()) ||
    connection?.user?.lastName?.toLowerCase().includes(searchConnections.toLowerCase()) ||
    (connection?.user?.jobTitle?.toLowerCase().includes(searchConnections.toLowerCase())) ||
    (connection?.user?.company?.toLowerCase().includes(searchConnections.toLowerCase()))
  );

  const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile?._id) return;

    setLoading(true);
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
      setLoading(false);
    }
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

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography variant="h6" sx={{ textAlign: 'center' }}>
          Loading Profile...
        </Typography>
      </Container>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load profile data</Alert>
      </Container>
    );
  }

  const completionPercentage = profileValidation?.completionPercentage || 0;
  const missingFields = profileValidation?.missingFields || [];

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <IconButton 
          onClick={handleBack}
          sx={{ 
            mr: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': { bgcolor: 'grey.100' }
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="span" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Profile Overview
        </Typography>
      </Box>

      {/* Alerts */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Summary Card */}
        <Grid item xs={12}>
          <Card sx={{ 
            borderRadius: 3, 
            overflow: 'hidden',
            background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.primary.main}05 100%)`,
            border: `1px solid ${theme.palette.primary.main}20`
          }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={3} alignItems="center">
                {/* Profile Picture */}
                <Grid item xs="auto">
                  <Box sx={{ position: 'relative', display: 'inline-block' }}>
                    <Avatar
                      sx={{
                        width: 120,
                        height: 120,
                        fontSize: '2.5rem',
                        border: `4px solid ${theme.palette.background.paper}`,
                        boxShadow: 3
                      }}
                      src={profile.profilePicture}
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
                          <IconButton
                            component="span"
                            sx={{
                              position: 'absolute',
                              bottom: 0,
                              right: 0,
                              bgcolor: 'primary.main',
                              color: 'white',
                              width: 36,
                              height: 36,
                              '&:hover': { bgcolor: 'primary.dark' }
                            }}
                          >
                            <Upload fontSize="small" />
                          </IconButton>
                        </label>
                      </>
                    )}
                  </Box>
                </Grid>

                {/* Profile Info */}
                <Grid item xs>
                  <Stack spacing={1}>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                      {profile.firstName} {profile.lastName}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Work fontSize="small" />
                      {profile.jobTitle || profile.role?.replace('_', ' ') || 'Job Seeker'}
                    </Typography>
                    
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                      {profile.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {profile.email}
                          </Typography>
                        </Box>
                      )}
                      {profile.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Phone fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {profile.phone}
                          </Typography>
                        </Box>
                      )}
                      {profile.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {profile.location}
                          </Typography>
                        </Box>
                      )}
                    </Stack>

                    {profile.bio && (
                      <Typography variant="body1" sx={{ mt: 2, fontStyle: 'italic' }}>
                        "{profile.bio}"
                      </Typography>
                    )}
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Profile Completion Card */}
        <Grid item xs={12}>
          <Fade in timeout={1000}>
            <Paper
              elevation={3}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                background: completionPercentage >= 80 
                  ? `linear-gradient(135deg, ${theme.palette.success.main}15 0%, ${theme.palette.success.main}08 100%)`
                  : `linear-gradient(135deg, ${theme.palette.warning.main}15 0%, ${theme.palette.warning.main}08 100%)`,
                border: completionPercentage >= 80 
                  ? `2px solid ${theme.palette.success.main}30`
                  : `2px solid ${theme.palette.warning.main}30`,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item>
                    <Box sx={{ 
                      width: 80, 
                      height: 80, 
                      borderRadius: '50%',
                      bgcolor: theme.palette.background.paper,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 2
                    }}>
                      {getCompletionIcon(completionPercentage)}
                    </Box>
                  </Grid>
                  
                  <Grid item xs>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Profile Completion: {completionPercentage}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={completionPercentage}
                          sx={{
                            height: 12,
                            borderRadius: 6,
                            bgcolor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 6,
                              bgcolor: completionPercentage >= 80 
                                ? theme.palette.success.main 
                                : theme.palette.warning.main
                            }
                          }}
                        />
                      </Box>

                      {missingFields.length > 0 && (
                        <Box>
                          <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                            Complete these fields to improve your profile:
                          </Typography>
                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {missingFields.slice(0, 4).map((field, index) => (
                              <Box
                                key={index}
                                sx={{
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: 2,
                                  bgcolor: 'rgba(0,0,0,0.08)',
                                  fontSize: '0.875rem',
                                  color: 'text.secondary'
                                }}
                              >
                                {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </Box>
                            ))}
                            {missingFields.length > 4 && (
                              <Box
                                sx={{
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: 2,
                                  bgcolor: 'rgba(0,0,0,0.08)',
                                  fontSize: '0.875rem',
                                  color: 'text.secondary'
                                }}
                              >
                                +{missingFields.length - 4} more
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      )}
                    </Stack>
                  </Grid>

                  <Grid item>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleCompleteProfile}
                      sx={{
                        px: 4,
                        py: 2,
                        borderRadius: 3,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        boxShadow: 3,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: 6,
                        },
                        transition: 'all 0.3s ease'
                      }}
                      endIcon={<Edit />}
                    >
                      Complete Profile
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Paper>
          </Fade>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <Star sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Profile Views
                </Typography>
                <Typography variant="h4" color="primary.main">
                  {profile.profileViews || 0}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <Visibility sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Visibility
                </Typography>
                <Typography variant="h4" color="success.main">
                  {completionPercentage >= 80 ? 'High' : completionPercentage >= 50 ? 'Medium' : 'Low'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  transition: 'transform 0.2s ease',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <Person sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Status
                </Typography>
                <Typography variant="h4" color="info.main">
                  {completionPercentage >= 80 ? 'Complete' : 'Pending'}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Tabs Section */}
        <Grid item xs={12}>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              variant="fullWidth"
              sx={{
                bgcolor: 'primary.main',
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1rem',
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
                icon={<Article />}
                label="My Posts"
                sx={{ '& .MuiSvgIcon-root': { mb: 1 } }}
              />
              <Tab
                icon={<Star />}
                label="My Stories"
                sx={{ '& .MuiSvgIcon-root': { mb: 1 } }}
              />
              <Tab
                icon={<Badge badgeContent={connections?.length || 0} color="secondary"><People /></Badge>}
                label="Connections"
                sx={{ '& .MuiSvgIcon-root': { mb: 1 } }}
              />
              <Tab
                icon={<Settings />}
                label="Account"
                sx={{ '& .MuiSvgIcon-root': { mb: 1 } }}
              />
            </Tabs>

            <Box sx={{ p: 3, minHeight: 400 }}>
              {/* Posts Tab */}
              {activeTab === 0 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      My Posts ({userPosts?.length || 0})
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setNewPostDialog(true)}
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 3
                      }}
                    >
                      Create Post
                    </Button>
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
                        onClick={() => setNewPostDialog(true)}
                        sx={{ textTransform: 'none' }}
                      >
                        Create Your First Post
                      </Button>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {(userPosts || []).map((post, index) => (
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
                                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Unknown date'} • 
                                    <Chip 
                                      label={post.visibility ? post.visibility.charAt(0).toUpperCase() + post.visibility.slice(1) : 'Private'} 
                                      size="small" 
                                      icon={post.visibility === 'public' ? <Public /> : <Lock />}
                                      sx={{ ml: 1 }}
                                    />
                                  </Typography>
                                </Box>
                              </Box>
                              {isOwnProfile && (
                                <IconButton 
                                  size="small"
                                  onClick={() => post._id && handleDeletePost(post._id)}
                                  sx={{ color: 'error.main' }}
                                  disabled={!post._id}
                                >
                                  <Delete />
                                </IconButton>
                              )}
                            </Box>

                            <Typography variant="body1" sx={{ mb: 2 }}>
                              {post.content}
                            </Typography>

                            {/* Media Display */}
                            {post.mediaUrl && (
                              <Box sx={{ mb: 2, borderRadius: 1, overflow: 'hidden' }}>
                                {post.postType === 'image' ? (
                                  <Box
                                    component="img"
                                    src={post.mediaUrl}
                                    alt="Post media"
                                    sx={{
                                      width: '100%',
                                      maxHeight: 400,
                                      objectFit: 'contain',
                                      bgcolor: 'grey.100'
                                    }}
                                  />
                                ) : post.postType === 'video' ? (
                                  <Box
                                    component="video"
                                    controls
                                    src={post.mediaUrl}
                                    sx={{
                                      width: '100%',
                                      maxHeight: 400,
                                      bgcolor: 'grey.100'
                                    }}
                                  />
                                ) : post.postType === 'document' ? (
                                  <Box 
                                    sx={{ 
                                      p: 2, 
                                      border: '1px solid', 
                                      borderColor: 'divider', 
                                      borderRadius: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      cursor: 'pointer'
                                    }}
                                    onClick={() => window.open(post.mediaUrl, '_blank')}
                                  >
                                    <AttachFile />
                                    <Box>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                        Document Attachment
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Click to view or download
                                      </Typography>
                                    </Box>
                                  </Box>
                                ) : null}
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', gap: 2, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                              <Button
                                startIcon={<Favorite color={(post.likes || []).includes(user?._id || '') ? 'error' : 'inherit'} />}
                                size="small"
                                onClick={() => post._id && handleLikePost(post._id)}
                                disabled={!post._id}
                                sx={{ 
                                  textTransform: 'none', 
                                  color: (post.likes || []).includes(user?._id || '') ? 'error.main' : 'text.secondary' 
                                }}
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
                </Box>
              )}

              {/* Stories Tab */}
              {activeTab === 1 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      My Stories ({userStories?.length || 0})
                    </Typography>
                    {isOwnProfile && (
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleCreateStoryClick}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          px: 3,
                          background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #FFA000 0%, #FF8F00 100%)',
                          }
                        }}
                      >
                        Create Story
                      </Button>
                    )}
                  </Box>

                  {storiesLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <LinearProgress sx={{ width: '100%' }} />
                    </Box>
                  ) : userStories.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Star sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        {isOwnProfile ? 'No stories yet' : 'No stories available'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                        {isOwnProfile 
                          ? 'Share your professional journey and achievements with your network!'
                          : 'This user hasn\'t shared any stories yet.'
                        }
                      </Typography>
                      {isOwnProfile && (
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={handleCreateStoryClick}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            px: 3,
                            background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #FFA000 0%, #FF8F00 100%)',
                            }
                          }}
                        >
                          Create Your First Story
                        </Button>
                      )}
                    </Box>
                  ) : (
                    <Grid container spacing={3}>
                      {userStories.map((story, index) => (
                        <Grid item xs={12} sm={6} md={4} key={story._id}>
                          <Card
                            sx={{
                              borderRadius: 3,
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[8],
                              }
                            }}
                            onClick={() => handleStoryClick(story, index)}
                          >
                            {/* Story Media */}
                            {story.media ? (
                              <Box sx={{ position: 'relative', height: 200 }}>
                                {story.media.type === 'video' ? (
                                  <video
                                    src={story.media.url}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                    muted
                                  />
                                ) : (
                                  <img
                                    src={story.media.url}
                                    alt={story.title}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      objectFit: 'cover',
                                    }}
                                  />
                                )}
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                                  }}
                                />
                                <PlayArrow
                                  sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    color: 'white',
                                    fontSize: '3rem',
                                    opacity: 0.8,
                                  }}
                                />
                              </Box>
                            ) : (
                              <Box
                                sx={{
                                  height: 200,
                                  background: 'linear-gradient(135deg, #FFD70040 0%, #FFA00020 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                }}
                              >
                                <Star sx={{ color: '#FFD700', fontSize: '3rem' }} />
                              </Box>
                            )}

                            {/* Story Content */}
                            <CardContent sx={{ p: 3 }}>
                              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                                {story.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                  mb: 2,
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {story.content}
                              </Typography>
                              
                              {/* Story Stats */}
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Favorite sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {story.likes?.length || 0}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Visibility sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {story.viewers?.length || 0}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Share sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary">
                                    {story.shares || 0}
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}

              {/* Connections Tab */}
              {activeTab === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      My Connections ({connections?.length || 0})
                    </Typography>
                    <TextField
                      placeholder="Search connections..."
                      value={searchConnections}
                      onChange={(e) => setSearchConnections(e.target.value)}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search />
                          </InputAdornment>
                        )
                      }}
                      sx={{ minWidth: 250 }}
                    />
                  </Box>

                  {connectionsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <LinearProgress sx={{ width: '100%' }} />
                    </Box>
                  ) : filteredConnections.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <People sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        {searchConnections ? 'No connections found' : 'No connections yet'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchConnections ? 'Try adjusting your search terms' : 'Start connecting with professionals in your field'}
                      </Typography>
                    </Box>
                  ) : (
                    <List>
                      {filteredConnections.map((connection) => (
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
                </Box>
              )}

              {/* Account Settings Tab */}
              {activeTab === 3 && (
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                    Account Settings
                  </Typography>

                  {!isOwnProfile ? (
                    <Alert severity="info" sx={{ mb: 3 }}>
                      You can only view and modify your own account settings.
                    </Alert>
                  ) : null}

                  {settingsLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <LinearProgress sx={{ width: '100%' }} />
                    </Box>
                  ) : isOwnProfile ? (
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
                              control={
                                <Switch 
                                  checked={userSettings?.privacy?.profileVisibility === 'public'}
                                  onChange={(e) => handleSettingsChange('privacy', 'profileVisibility', e.target.checked ? 'public' : 'private')}
                                />
                              }
                              label="Profile visible to public"
                            />
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={userSettings?.privacy?.showOnlineStatus || false}
                                  onChange={(e) => handleSettingsChange('privacy', 'showOnlineStatus', e.target.checked)}
                                />
                              }
                              label="Show my activity status"
                            />
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={userSettings?.privacy?.allowMessages || false}
                                  onChange={(e) => handleSettingsChange('privacy', 'allowMessages', e.target.checked)}
                                />
                              }
                              label="Allow messages from others"
                            />
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={userSettings?.privacy?.allowSearchIndexing || false}
                                  onChange={(e) => handleSettingsChange('privacy', 'allowSearchIndexing', e.target.checked)}
                                />
                              }
                              label="Allow search engines to index my profile"
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
                              control={
                                <Switch 
                                  checked={userSettings?.notifications?.email || false}
                                  onChange={(e) => handleSettingsChange('notifications', 'email', e.target.checked)}
                                />
                              }
                              label="Email notifications"
                            />
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={userSettings?.notifications?.push || false}
                                  onChange={(e) => handleSettingsChange('notifications', 'push', e.target.checked)}
                                />
                              }
                              label="Push notifications"
                            />
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={userSettings?.notifications?.jobAlerts || false}
                                  onChange={(e) => handleSettingsChange('notifications', 'jobAlerts', e.target.checked)}
                                />
                              }
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
                                  checked={userSettings?.appearance?.theme === 'dark'}
                                  onChange={(e) => handleSettingsChange('appearance', 'theme', e.target.checked ? 'dark' : 'light')}
                                />
                              }
                              label="Dark mode"
                            />
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={userSettings?.appearance?.compactMode || false}
                                  onChange={(e) => handleSettingsChange('appearance', 'compactMode', e.target.checked)}
                                />
                              }
                              label="Compact view"
                            />
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={userSettings?.appearance?.showAnimations !== false}
                                  onChange={(e) => handleSettingsChange('appearance', 'showAnimations', e.target.checked)}
                                />
                              }
                              label="Show animations"
                            />
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* Danger Zone */}
                      <Card sx={{ borderRadius: 2, border: '1px solid', borderColor: 'error.main' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Delete />
                            Danger Zone
                          </Typography>
                          <Stack spacing={2}>
                            <Button
                              variant="outlined"
                              color="error"
                              sx={{ textTransform: 'none' }}
                            >
                              Deactivate Account
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              sx={{ textTransform: 'none' }}
                            >
                              Delete Account
                            </Button>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>
                  ) : null}
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* New Post Dialog */}
      <Dialog
        open={newPostDialog}
        onClose={() => setNewPostDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Article />
          Create New Post
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              multiline
              rows={4}
              fullWidth
              placeholder="Share your thoughts, updates, or achievements..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              variant="outlined"
            />
            
            {/* Media Upload */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                accept="image/*,video/*,.pdf,.doc,.docx"
                style={{ display: 'none' }}
                id="media-upload"
                type="file"
                onChange={handleMediaSelect}
              />
              <label htmlFor="media-upload">
                <Button
                  component="span"
                  variant="outlined"
                  size="small"
                  startIcon={<PhotoCamera />}
                  sx={{ textTransform: 'none' }}
                >
                  Add Media
                </Button>
              </label>
              
              <input
                accept=".pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleMediaSelect}
              />
              <label htmlFor="file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  size="small"
                  startIcon={<AttachFile />}
                  sx={{ textTransform: 'none' }}
                >
                  Attach File
                </Button>
              </label>
            </Box>

            {/* Media Preview */}
            {selectedMedia && (
              <Box sx={{ position: 'relative', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                <IconButton
                  size="small"
                  onClick={handleRemoveMedia}
                  sx={{ position: 'absolute', right: 8, top: 8, bgcolor: 'background.paper', zIndex: 1 }}
                >
                  <Close />
                </IconButton>
                
                {mediaPreview ? (
                  <Box
                    component="img"
                    src={mediaPreview}
                    alt="Preview"
                    sx={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'contain',
                      borderRadius: 1
                    }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                    <AttachFile />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {selectedMedia.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(selectedMedia.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Privacy</InputLabel>
              <Select
                value={newPostPrivacy}
                label="Privacy"
                onChange={(e) => setNewPostPrivacy(e.target.value as 'public' | 'connections')}
                startAdornment={
                  newPostPrivacy === 'public' ? <Public sx={{ mr: 1 }} /> : <People sx={{ mr: 1 }} />
                }
              >
                <MenuItem value="public">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Public />
                    Public
                  </Box>
                </MenuItem>
                <MenuItem value="connections">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <People />
                    Connections Only
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewPostDialog(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreatePost}
            variant="contained"
            disabled={(!newPostContent.trim() && !selectedMedia) || createPostLoading}
            startIcon={createPostLoading ? <LinearProgress /> : <Add />}
            sx={{ textTransform: 'none' }}
          >
            {createPostLoading ? 'Posting...' : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Actions */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { xs: 'flex', md: 'none' } // Only show on mobile
        }}
        onClick={() => setNewPostDialog(true)}
      >
        <Add />
      </Fab>

      {/* Story Dialogs */}
      <EnhancedCreateStory
        open={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onStoryCreated={handleStoryCreated}
        existingStories={userStories}
      />

      <EnhancedStoryViewer
        open={showStoryViewer}
        onClose={handleStoryViewerClose}
        stories={storyViewerStories}
        initialIndex={selectedStoryIndex}
        onStoryChange={handleStoryChange}
      />
    </Container>
  );
};

export default MinimizedProfilePage;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  IconButton,
  Divider,
  Stack,
  Badge,
  alpha,
  Chip,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  InputBase,
  Menu,
  MenuItem,
  AvatarGroup,
  styled,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Slide,
} from '@mui/material';
import {
  Add,
  Search,
  Home,
  People,
  Notifications,
  Chat,
  Bookmark,
  TrendingUp,
  Camera,
  VideoCall,
  Photo,
  Article,
  Poll,
  Event,
  Business,
  School,
  Work,
  LocationOn,
  MoreVert,
  Share,
  Comment,
  ThumbUp,
  Send,
  Close,
  Phone,
  Email,
  WhatsApp,
  Facebook,
  Instagram,
  LinkedIn,
  Twitter,
  VideoLibrary,
  Schedule,
  ContactSupport,
  Menu as MenuIcon,
  Groups,
  PersonAdd,
  CameraAlt,
  EmojiEmotions,
  Gif,
  AttachFile,
  Public,
  Lock,
  Group,
  Language,
  AccessTime,
  Star,
  Verified,
  Settings,
  Help,
  CheckCircle,
  Psychology,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SocialPost } from '../types/social';
import { socialNetworkService } from '../services/socialNetworkService';
import MobileFooterNavbar from '../components/MobileFooterNavbar';
import PostCard from '../components/social/PostCard';
import MobileCreatePost from '../components/social/MobileCreatePost';
import CreateStory from '../components/social/CreateStory';
import StoryViewer from '../components/social/StoryViewer';
import ProfileCompletionPopup from '../components/ProfileCompletionPopup';
import CVBuilderPopup from '../components/CVBuilderPopup';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { shouldShowProfileCompletionPopup, shouldShowCVBuilderPopup, markProfileCompletionDismissed, markCVBuilderDismissed } from '../utils/profileCompletionUtils';

// Styled components for modern design
const StyledSearchBar = styled(Paper)(({ theme }) => ({
  padding: '8px 16px',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: 400,
  borderRadius: 25,
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
    : '0 2px 8px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(33, 150, 243, 0.03) 100%)'
      : 'linear-gradient(135deg, rgba(76, 175, 80, 0.02) 0%, rgba(33, 150, 243, 0.01) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
    zIndex: 0,
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
    transform: 'translateY(-1px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)' 
      : '0 4px 16px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    '&::before': {
      opacity: 1,
    },
  },
  '&:focus-within': {
    backgroundColor: theme.palette.background.paper,
    boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.2)}, 0 4px 20px rgba(76, 175, 80, 0.15)`,
    border: `2px solid ${theme.palette.primary.main}`,
    transform: 'translateY(-2px)',
    '&::before': {
      opacity: 1,
    },
  },
}));

const StoryAvatar = styled(Avatar)(({ theme }) => ({
  width: 60,
  height: 60,
  border: `3px solid ${theme.palette.primary.main}`,
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const StyledPostCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 2px 8px rgba(0,0,0,0.3)' 
    : '0 1px 3px rgba(0,0,0,0.12)',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  transition: 'box-shadow 0.2s ease-in-out',
  '&:hover': {
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 4px 20px rgba(0,0,0,0.4)' 
      : '0 2px 8px rgba(0,0,0,0.15)',
  },
}));

const SidebarCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  position: 'sticky',
  top: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    position: 'relative',
    top: 'auto',
  },
}));

interface ModernSocialNetworkPageProps {}

const ModernSocialNetworkPage: React.FC<ModernSocialNetworkPageProps> = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));

  // State management
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState('home');
  const [stories, setStories] = useState<any[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [showProfileCompletionPopup, setShowProfileCompletionPopup] = useState(false);
  const [showCVBuilderPopup, setShowCVBuilderPopup] = useState(false);

  // Load posts and stories on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
    setLoading(true);
    setError(null);
        
        // Load posts from both local social feed and Learning Hub community
        const [localFeed, learningHubFeed] = await Promise.all([
          socialNetworkService.getFeed(),
          socialNetworkService.getLearningHubFeed(1, 10)
        ]);

        const localPosts = Array.isArray(localFeed) ? localFeed : (localFeed?.data || []);
        const hubPosts = Array.isArray(learningHubFeed) ? learningHubFeed : [];
        // Merge feeds with Learning Hub posts first to highlight them
        setPosts([ ...hubPosts, ...localPosts ]);
        
        // Load stories (with better error handling and fallback data)
        setStoriesLoading(true);
        try {
          const storiesData = await socialNetworkService.getStoriesFeed();
          console.log('📚 Stories data received:', storiesData);
          
          // Handle different response formats
          let stories = [];
          if (Array.isArray(storiesData)) {
            stories = storiesData;
          } else if (storiesData && storiesData.data) {
            stories = Array.isArray(storiesData.data) ? storiesData.data : [];
          }
          
          // Add fallback stories if none exist
          if (stories.length === 0) {
            console.log('📚 No stories found, adding fallback data');
            stories = [
              {
                _id: 'fallback-1',
                title: 'Welcome to ExJobNet!',
                content: 'Share your professional journey and connect with others in your field.',
                type: 'announcement',
                author: {
                  _id: 'system',
                  firstName: 'ExJobNet',
                  lastName: 'Team',
                  profilePicture: '',
                  jobTitle: 'Career Platform'
                },
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
                viewers: [],
                likes: [],
                shares: 0,
                tags: ['welcome', 'career', 'networking'],
                visibility: 'public',
                isActive: true,
                hasStory: true
              }
            ];
          }
          
          setStories(stories);
          console.log('📚 Stories set:', stories.length);
        } catch (storiesError) {
          console.error('Error loading stories:', storiesError);
          // Set fallback stories on error
          setStories([
            {
              _id: 'fallback-error',
              title: 'Welcome to ExJobNet!',
              content: 'Share your professional journey and connect with others in your field.',
              type: 'announcement',
              author: {
                _id: 'system',
                firstName: 'ExJobNet',
                lastName: 'Team',
                profilePicture: '',
                jobTitle: 'Career Platform'
              },
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
              viewers: [],
              likes: [],
              shares: 0,
              tags: ['welcome', 'career', 'networking'],
              visibility: 'public',
              isActive: true,
              hasStory: true
            }
          ]);
        } finally {
          setStoriesLoading(false);
        }
        
        // Load suggested connections
    setConnectionsLoading(true);
    try {
          const connectionsData = await socialNetworkService.getSuggestedConnections();
          setSuggestedConnections(Array.isArray(connectionsData) ? connectionsData : connectionsData.data || []);
        } catch (connectionsError) {
          console.error('Error loading suggested connections:', connectionsError);
          setSuggestedConnections([]);
    } finally {
      setConnectionsLoading(false);
    }
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load posts. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Check for profile completion popup on mount
  useEffect(() => {
    console.log('🔍 SocialNetworkPage - Profile completion check triggered');
    console.log('👤 User data:', user);
    
    if (user) {
      const shouldShowProfile = shouldShowProfileCompletionPopup(user);
      const shouldShowCV = shouldShowCVBuilderPopup(user);
      
      console.log('📊 Profile completion check results:', {
        shouldShowProfile,
        shouldShowCV,
        userCompletion: user ? 'User exists' : 'No user'
      });
      
      // Show profile completion popup first if needed
      if (shouldShowProfile) {
        console.log('✅ Showing profile completion popup');
        setShowProfileCompletionPopup(true);
      } else if (shouldShowCV) {
        console.log('✅ Showing CV builder popup');
        setShowCVBuilderPopup(true);
      } else {
        console.log('ℹ️ No popup needed');
      }
    } else {
      console.log('❌ No user data available');
    }
  }, [user]);

  // Handler functions
  const handleProfileCompletionClose = () => {
    setShowProfileCompletionPopup(false);
    // REMOVED: markProfileCompletionDismissed(user._id) - we want popup to show every time
    console.log('🚫 Profile completion popup closed - will show again on next visit if profile still incomplete');
  };

  const handleProfileCompletionAction = () => {
    setShowProfileCompletionPopup(false);
    navigate('/app/profile/edit');
  };

  const handleCVBuilderClose = () => {
    setShowCVBuilderPopup(false);
    // REMOVED: markCVBuilderDismissed(user._id) - we want popup to show every time
    console.log('🚫 CV Builder popup closed - will show again on next visit if no CV exists');
  };

  const handleCVBuilderAction = () => {
    setShowCVBuilderPopup(false);
    navigate('/app/cv-builder');
  };

  const handleCVBuilderContinueProfile = () => {
    setShowCVBuilderPopup(false);
    navigate('/app/profile/edit');
  };

  const handleConnect = async (userId: string) => {
    try {
      console.log('🔗 Sending connection request to:', userId);
      const response = await socialNetworkService.sendConnectionRequest(userId);
      
      // Find the user before removing from suggestions
      const userToConnect = suggestedConnections.find(conn => conn._id === userId);
      
      // Update the connection status instead of removing
      setSuggestedConnections(prev => prev.map(conn => {
        if (conn._id === userId) {
          return {
            ...conn,
            connectionStatus: 'pending',
            connectionRequestId: response.data?._id || `temp-${userId}`
          };
        }
        return conn;
      }));
      
      // Show success message
      if (userToConnect) {
        toast.success(`✅ Connection request sent to ${userToConnect.firstName} ${userToConnect.lastName}! They'll be notified.`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error('❌ Error sending connection request:', error);
      toast.error('❌ Failed to send connection request. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  };

  const handleTopicClick = (topic: string) => {
    console.log('🏷️ Topic clicked:', topic);
    // TODO: Implement topic filtering or navigation
    // This could filter posts by the selected topic
  };

  const handleFeelingActivity = () => {
    console.log('😊 Feeling/Activity clicked');
    // TODO: Implement feeling/activity selection
    // This could open a modal with activity options
    setShowCreatePost(true);
  };

  const handleLiveVideo = () => {
    console.log('📹 Live Video clicked');
    // TODO: Implement live video functionality
    // This could start a live video stream or open live video options
    alert('Live video feature coming soon!');
  };

  const handleFindJobs = () => {
    console.log('💼 Find Jobs clicked');
    navigate('/app/jobs');
  };

  const handleInterviewPrep = () => {
    console.log('🎓 Interview Preparation clicked');
    navigate('/app/interviews');
  };

  const handleNetworking = () => {
    console.log('🤝 Networking clicked');
    navigate('/connections');
  };

  const handleEvents = () => {
    console.log('📅 Events clicked');
    navigate('/events');
  };

  const handleArticles = () => {
    console.log('📰 Articles clicked');
    navigate('/articles');
  };

  const handlePoll = () => {
    console.log('📊 Poll clicked');
    // TODO: Implement poll creation
    alert('Poll feature coming soon!');
  };

  const handleBusiness = () => {
    console.log('🏢 Business clicked');
    navigate('/business');
  };

  const handlePsychometricTests = () => {
    console.log('🧠 Psychometric Tests clicked');
    navigate('/app/tests');
  };

  const handleProfile = () => {
    console.log('👤 Profile clicked');
    navigate('/app/profile');
  };

  const handleSettings = () => {
    console.log('⚙️ Settings clicked');
    navigate('/settings');
  };

  const handleHelp = () => {
    console.log('❓ Help clicked');
    setContactDialogOpen(true);
  };

  const handleContactOpen = () => {
    setContactDialogOpen(true);
  };

  const handleContactClose = () => {
    setContactDialogOpen(false);
  };

  const handleViewStory = (story: any) => {
    console.log('📖 Viewing story:', story);
    // Find the story index in the stories array
    const storyIndex = stories.findIndex(s => s._id === story._id);
    if (storyIndex !== -1) {
      setSelectedStoryIndex(storyIndex);
      setShowStoryViewer(true);
    } else {
      console.error('Story not found in stories array:', story);
    }
  };

  const handleInternships = () => {
    console.log('🎓 Internships clicked');
    navigate('/app/internships');
  };

  const handleApplications = () => {
    console.log('📋 Applications clicked');
    navigate('/app/applications');
  };

  const handleCareerGuidance = () => {
    console.log('🎯 Career Guidance clicked');
    navigate('/app/career-guidance');
  };

  const handleLearning = () => {
    console.log('📚 Learning clicked');
    navigate('/app/learning');
  };

  const handleSaved = () => {
    console.log('💾 Saved clicked');
    navigate('/app/saved');
  };

  const handleSmartExams = () => {
    console.log('🧠 Smart Exams clicked');
    navigate('/app/smart-tests');
  };

  const handleCVBuilder = () => {
    console.log('📄 CV Builder clicked');
    navigate('/app/cv-builder');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
  };

  const handleSearchClick = () => {
    console.log('🔍 Search clicked, navigating to search page...');
    // Navigate to dedicated search page with current search value
    const searchQuery = searchValue.trim();
    if (searchQuery) {
      console.log('🔍 Navigating to search page with query:', searchQuery);
      navigate(`/app/search?q=${encodeURIComponent(searchQuery)}`);
    } else {
      console.log('🔍 Navigating to search page');
      navigate('/app/search');
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('🔍 Enter pressed, navigating to search page...');
      handleSearchClick();
    }
  };

  // Sample posts data with modern structure
  const samplePosts: SocialPost[] = [
    {
      _id: '1',
      author: {
        _id: '1',
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: '',
        jobTitle: 'Software Engineer at Google',
      },
      content: '🚀 Excited to share that I just completed my first full-stack project using React, Node.js, and MongoDB! The journey was challenging but incredibly rewarding. Here are some key learnings:\n\n✅ Planning is crucial\n✅ Break down complex problems\n✅ Don\'t be afraid to ask for help\n\nLooking forward to applying these skills in new opportunities! #webdevelopment #react #nodejs #coding',
      tags: ['webdevelopment', 'react', 'nodejs', 'coding'],
      postType: 'text',
      likes: ['1'],
      likesCount: 24,
      commentsCount: 5,
      sharesCount: 2,
      visibility: 'public',
      isPinned: false,
      isPromoted: false,
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: '2',
      author: {
        _id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        profilePicture: '',
        jobTitle: 'UX Designer at Meta',
      },
      content: '🎨 Just attended the most inspiring UX conference! Key takeaways on accessibility and inclusive design that every designer should know. The future of design is inclusive! 💡\n\n#ux #design #accessibility #inclusion #userexperience',
      tags: ['ux', 'design', 'accessibility', 'inclusion'],
      postType: 'event',
      likes: ['1', '2', '3'],
      likesCount: 47,
      commentsCount: 12,
      sharesCount: 8,
      visibility: 'public',
      isPinned: false,
      isPromoted: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: '3',
      author: {
        _id: '3',
        firstName: 'Alex',
        lastName: 'Chen',
        profilePicture: '',
        jobTitle: 'Product Manager at Tesla',
      },
      content: '⚡ Thrilled to announce that our team has successfully launched the new autonomous driving feature! This represents months of hard work, innovation, and collaboration. \n\nShout out to our amazing engineering team! 🙌\n\n#tesla #innovation #autonomousdriving #teamwork #product',
      tags: ['tesla', 'innovation', 'autonomousdriving', 'teamwork'],
      postType: 'company_update',
      likes: ['1', '2', '3', '4'],
      likesCount: 156,
      commentsCount: 23,
      sharesCount: 34,
      visibility: 'public',
      isPinned: true,
      isPromoted: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const loadFeed = async () => {
    // This function is now handled by the useEffect above
    // Keeping it for backward compatibility but it's no longer used
  };

  const loadMorePosts = async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      const nextPage = page + 1;
      const postsData = await socialNetworkService.getFeed({ page: nextPage });
      const newPosts = Array.isArray(postsData) ? postsData : postsData.data || [];
      
      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error('Error loading more posts:', err);
      setError('Failed to load more posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostLike = (postId: string) => {
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
        const isLiked = post.likes.includes(user?._id || '');
          return {
            ...post,
            likes: isLiked 
              ? post.likes.filter(id => id !== user?._id)
              : [...post.likes, user?._id || ''],
            likesCount: isLiked ? post.likesCount - 1 : post.likesCount + 1,
          };
        }
        return post;
      }));
  };

  // Mobile Navigation Items
  const mobileNavItems = [
    { icon: <Home />, label: 'Home', value: 'home' },
    { icon: <Search />, label: 'Search', value: 'search' },
    { icon: <People />, label: 'Network', value: 'network' },
    { icon: <Notifications />, label: 'Notifications', value: 'notifications' },
    { icon: <Chat />, label: 'Messages', value: 'messages' },
  ];

  const jobPreparationServices = [
    {
      id: 'psychometric',
      title: 'Psychometric Tests',
      description: 'Discover strengths with tailored assessments',
      icon: Psychology,
      onClick: () => handlePsychometricTests(),
      gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)'
    },
    {
      id: 'smart-exams',
      title: 'Smart Exams',
      description: 'Practice adaptive tests for top performance',
      icon: TrendingUp,
      onClick: () => handleSmartExams(),
      gradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
    },
    {
      id: 'ai-interviews',
      title: 'AI Interviews',
      description: 'Rehearse interviews with instant analytics',
      icon: VideoCall,
      onClick: () => handleInterviewPrep(),
      gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)'
    },
    {
      id: 'cv-builder',
      title: 'CV Builder',
      description: 'Craft tailored CVs for every opportunity',
      icon: Article,
      onClick: () => handleCVBuilder(),
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)'
    },
    {
      id: 'career-guidance',
      title: 'Career Guidance',
      description: 'Get expert advice for your next move',
      icon: TrendingUp,
      onClick: () => handleCareerGuidance(),
      gradient: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)'
    }
  ];

  const renderJobPreparationColumn = () => (
    <Box sx={{ position: 'sticky', top: theme.spacing(2), display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Card sx={{ borderRadius: 3, background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)', color: 'white', boxShadow: '0 12px 30px rgba(17, 24, 39, 0.35)', px: 2, py: 3 }}>
        <Typography variant="overline" sx={{ letterSpacing: 1.5, opacity: 0.7 }}>
          Preparation Hub
        </Typography>
        <Typography variant="h5" fontWeight={700} sx={{ mt: 1 }}>
          Level up for your next role
        </Typography>
        <Typography variant="body2" sx={{ mt: 1.5, opacity: 0.8 }}>
          Access premium tools to build confidence before applying.
        </Typography>
      </Card>
      {jobPreparationServices.map((service) => {
        const IconComponent = service.icon;
        return (
          <Card
            key={service.id}
            onClick={service.onClick}
            sx={{
              borderRadius: 3,
              background: service.gradient,
              color: 'white',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.25)',
              cursor: 'pointer',
              transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 16px 30px rgba(15, 23, 42, 0.35)'
              }
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <IconComponent sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  {service.title}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.85 }}>
                  {service.description}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    mt: 1.5,
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'white',
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.12)'
                    }
                  }}
                >
                  Explore
                </Button>
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );

  const renderStories = () => {
    // Get user's own stories
    const userStories = stories.filter(story => story.author?._id === user?._id);
    const otherStories = stories.filter(story => story.author?._id !== user?._id);

    return (
      <Card sx={{ 
        mb: 2, 
        p: 2, 
        borderRadius: 3,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)'
          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 2px 12px rgba(0,0,0,0.3)'
          : '0 2px 12px rgba(0,0,0,0.08)',
      }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 2, 
          overflowX: 'auto',
          pb: 1,
          '&::-webkit-scrollbar': {
            height: 4,
          },
          '&::-webkit-scrollbar-track': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.1)' 
              : 'rgba(0,0,0,0.1)',
            borderRadius: 2,
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255,255,255,0.3)' 
              : 'rgba(0,0,0,0.3)',
            borderRadius: 2,
            '&:hover': {
              background: theme.palette.mode === 'dark' 
                ? 'rgba(255,255,255,0.5)' 
                : 'rgba(0,0,0,0.5)',
            },
          },
        }}>
          {/* User's own story button */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              minWidth: 80,
              cursor: 'pointer',
              position: 'relative',
            }}
            onClick={() => setShowCreateStory(true)}
          >
            <Box sx={{ position: 'relative' }}>
              <StoryAvatar 
                src={(user as any)?.profilePicture}
                sx={{ 
                  border: `3px solid ${theme.palette.primary.main}`,
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? theme.palette.grey[800] 
                    : theme.palette.grey[100],
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    transform: 'scale(1.1)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 20px rgba(102, 126, 234, 0.6)'
                      : '0 4px 20px rgba(102, 126, 234, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Add sx={{ color: 'white', fontSize: 24 }} />
              </StoryAvatar>
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <Add sx={{ color: 'white', fontSize: 12 }} />
              </Box>
            </Box>
            <Typography 
              variant="caption" 
              sx={{ 
                mt: 1, 
                textAlign: 'center', 
                fontSize: '0.75rem',
                fontWeight: 600,
                color: theme.palette.mode === 'dark' 
                  ? theme.palette.text.primary 
                  : theme.palette.text.primary,
                maxWidth: 70,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Your Story
            </Typography>
          </Box>

          {/* User's own stories */}
          {userStories.map((story, index) => (
            <motion.div
              key={`user-story-${story._id}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  minWidth: 80,
                  cursor: 'pointer',
                  position: 'relative',
                }}
                onClick={() => handleViewStory(story)}
              >
                <Box sx={{ position: 'relative' }}>
                  <StoryAvatar 
                    src={story.media?.thumbnail || story.media?.url}
                    sx={{ 
                      border: `3px solid ${theme.palette.success.main}`,
                      background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        boxShadow: theme.palette.mode === 'dark'
                          ? '0 4px 20px rgba(76, 175, 80, 0.6)'
                          : '0 4px 20px rgba(76, 175, 80, 0.4)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {!story.media?.thumbnail && !story.media?.url && (
                      <CameraAlt sx={{ color: 'white', fontSize: 20 }} />
                    )}
                  </StoryAvatar>
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    <Star sx={{ color: 'white', fontSize: 10 }} />
                  </Box>
                </Box>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    mt: 1, 
                    textAlign: 'center', 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: theme.palette.mode === 'dark' 
                      ? theme.palette.text.primary 
                      : theme.palette.text.primary,
                    maxWidth: 70,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {story.title || 'My Story'}
                </Typography>
              </Box>
            </motion.div>
          ))}
          
          {/* Other users' stories */}
          {storiesLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, index) => (
              <Box key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
                <Skeleton variant="circular" width={60} height={60} />
                <Skeleton variant="text" width={50} height={12} sx={{ mt: 1 }} />
              </Box>
            ))
          ) : otherStories.length > 0 ? (
            otherStories.map((story, index) => (
              <motion.div
                key={`other-story-${story._id || story.id}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (userStories.length + index) * 0.1 }}
              >
                <Box 
                  sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    minWidth: 80,
                    cursor: 'pointer',
                    position: 'relative',
                  }}
                  onClick={() => handleViewStory(story)}
                >
                  <Box sx={{ position: 'relative' }}>
                    <StoryAvatar 
                      src={story.author?.profilePicture || story.avatar}
                      sx={{ 
                        border: story.hasStory 
                          ? `3px solid ${theme.palette.primary.main}` 
                          : `2px solid ${theme.palette.divider}`,
                        background: story.hasStory 
                          ? 'linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)'
                          : theme.palette.mode === 'dark' 
                            ? theme.palette.grey[700] 
                            : theme.palette.grey[200],
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: story.hasStory 
                            ? theme.palette.mode === 'dark'
                              ? '0 4px 20px rgba(24, 119, 242, 0.6)'
                              : '0 4px 20px rgba(24, 119, 242, 0.4)'
                            : theme.palette.mode === 'dark'
                              ? '0 4px 20px rgba(255,255,255,0.2)'
                              : '0 4px 20px rgba(0,0,0,0.2)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      {!(story.author?.profilePicture || story.avatar) && 
                        (story.author?.firstName || story.name)?.charAt(0)}
                    </StoryAvatar>
                    {story.hasStory && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: -2,
                          right: -2,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px solid white',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      >
                        <Star sx={{ color: 'white', fontSize: 10 }} />
                      </Box>
                    )}
                  </Box>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 1, 
                      textAlign: 'center', 
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: theme.palette.mode === 'dark' 
                        ? theme.palette.text.primary 
                        : theme.palette.text.primary,
                      maxWidth: 70,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {story.author?.firstName || story.name}
                  </Typography>
                </Box>
              </motion.div>
            ))
          ) : (
            // No stories message
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              minWidth: 200, 
              py: 2,
              color: theme.palette.mode === 'dark' 
                ? theme.palette.text.secondary 
                : theme.palette.text.secondary,
            }}>
              <Typography variant="body2" sx={{ color: 'inherit' }}>
                No stories available
              </Typography>
            </Box>
          )}
        </Box>
      </Card>
    );
  };

  const renderCreatePost = () => (
    <StyledPostCard>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Avatar src={(user as any)?.profilePicture}>
                {user?.firstName?.charAt(0)}
              </Avatar>
          <Button
                variant="outlined"
                fullWidth
                onClick={() => setShowCreatePost(true)}
                sx={{
                  justifyContent: 'flex-start',
              borderRadius: 25,
              py: 1.5,
              color: 'text.secondary',
              textTransform: 'none',
              fontSize: '1rem',
                }}
              >
                What's on your mind, {user?.firstName}?
          </Button>
          </Box>
          
        <Divider sx={{ mb: 2 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          <Button startIcon={<VideoLibrary sx={{ color: '#f02849' }} />} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Video
              </Button>
          <Button startIcon={<Photo sx={{ color: '#45bd62' }} />} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Photo
              </Button>
          <Button startIcon={<EmojiEmotions sx={{ color: '#f7b928' }} />} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Feeling
              </Button>
          {!isMobile && (
            <Button startIcon={<Article sx={{ color: '#1877f2' }} />} sx={{ textTransform: 'none', color: 'text.secondary' }}>
              Article
            </Button>
          )}
          </Box>
        </CardContent>
    </StyledPostCard>
  );

  const renderPost = (post: SocialPost) => (
      <motion.div
        key={post._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PostCard post={post} />
    </motion.div>
  );

  const renderQuickActions = () => {
    const quickActions = [
      {
        id: 'find-jobs',
        label: 'Jobs',
        icon: <Work sx={{ fontSize: 16 }} />,
        onClick: () => handleFindJobs(),
        color: '#1877f2'
      },
      {
        id: 'interview-prep',
        label: 'Interview',
        icon: <School sx={{ fontSize: 16 }} />,
        onClick: () => handleInterviewPrep(),
        color: '#e91e63'
      },
      {
        id: 'psychometric-tests',
        label: 'Psychometric Tests',
        icon: <Article sx={{ fontSize: 16 }} />,
        onClick: () => handlePsychometricTests(),
        color: '#4caf50'
      },
      {
        id: 'smart-exams',
        label: 'Smart Exams',
        icon: <School sx={{ fontSize: 16 }} />,
        onClick: () => handleSmartExams(),
        color: '#ff5722'
      },
      {
        id: 'cv-builder',
        label: 'CV Builder',
        icon: <Article sx={{ fontSize: 16 }} />,
        onClick: () => handleCVBuilder(),
        color: '#795548'
      },
      {
        id: 'applications',
        label: 'Applications',
        icon: <PersonAdd sx={{ fontSize: 16 }} />,
        onClick: () => handleApplications(),
        color: '#9c27b0'
      },
      {
        id: 'career-guidance',
        label: 'Guidance',
        icon: <TrendingUp sx={{ fontSize: 16 }} />,
        onClick: () => handleCareerGuidance(),
        color: '#2196f3'
      },
      {
        id: 'networking',
        label: 'Network',
        icon: <People sx={{ fontSize: 16 }} />,
        onClick: () => handleNetworking(),
        color: '#9c27b0'
      },
      {
        id: 'events',
        label: 'Events',
        icon: <Event sx={{ fontSize: 16 }} />,
        onClick: () => handleEvents(),
        color: '#ff9800'
      },
      {
        id: 'articles',
        label: 'Articles',
        icon: <Article sx={{ fontSize: 16 }} />,
        onClick: () => handleArticles(),
        color: '#2196f3'
      },
      {
        id: 'saved',
        label: 'Saved',
        icon: <Bookmark sx={{ fontSize: 16 }} />,
        onClick: () => handleSaved(),
        color: '#795548'
      },
      {
        id: 'business',
        label: 'Business',
        icon: <Business sx={{ fontSize: 16 }} />,
        onClick: () => handleBusiness(),
        color: '#795548'
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: <PersonAdd sx={{ fontSize: 16 }} />,
        onClick: () => handleProfile(),
        color: '#607d8b'
      },
      {
        id: 'help',
        label: 'Help',
        icon: <Help sx={{ fontSize: 16 }} />,
        onClick: () => handleHelp(),
        color: '#ff5722'
      }
    ];

    return (
      <Card sx={{ mb: 2, borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          position: 'relative',
          p: 1.5,
          '&::before': {
            content: '""',
                          position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            backdropFilter: 'blur(10px)',
          }
        }}>
          {/* Auto-scrolling Actions Container */}
                          <Box sx={{
                            display: 'flex',
                      gap: 1,
            overflow: 'hidden',
            position: 'relative',
            height: 50,
          }}>
            <motion.div
              animate={{
                x: [0, -200, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                display: 'flex',
                gap: 8,
                              position: 'absolute',
                top: 0,
                left: 0,
              }}
            >
              {[...quickActions, ...quickActions].map((action, index) => (
                <motion.div
                  key={`${action.id}-${index}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{ flexShrink: 0 }}
                >
                  <Button
                    variant="contained"
                    startIcon={action.icon}
                    onClick={action.onClick}
                                sx={{
                      borderRadius: 20,
                      px: 2,
                      py: 0.8,
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                                  color: 'white',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      minWidth: 'auto',
                      whiteSpace: 'nowrap',
                      height: 36,
                                  '&:hover': {
                        background: 'rgba(255, 255, 255, 0.3)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {action.label}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
                            </Box>

          {/* Compact Scroll Indicators */}
                              <Box sx={{
                                display: 'flex',
                                justifyContent: 'center',
            mt: 0.5,
            gap: 0.3
          }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Box
                key={index}
                  sx={{ 
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
              </Box>
              </Box>
      </Card>
    );
  };

  const renderRightSidebar = () => (
    <Box sx={{ position: { xs: 'relative', md: 'sticky' }, top: { md: theme.spacing(2) } }}>
      {/* User Profile Section */}
      <SidebarCard sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        mb: 2,
      }}>
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
            <Avatar
              src={(user as any)?.profilePicture}
              sx={{
                width: 80,
                height: 80,
                border: '4px solid rgba(255,255,255,0.3)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                background: 'rgba(255,255,255,0.1)',
              }}
            >
              {user?.firstName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'rgba(76, 175, 80, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '3px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              <Verified sx={{ color: 'white', fontSize: 14 }} />
            </Box>
          </Box>
          
          <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5, color: 'white' }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
            {user?.jobTitle || 'Professional'}
          </Typography>
          
          <Button
            variant="outlined"
            sx={{
              borderColor: 'rgba(255,255,255,0.5)',
              color: 'white',
              borderRadius: 3,
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255,255,255,0.1)',
              },
            }}
            onClick={() => navigate('/app/profile')}
          >
            View Profile
          </Button>
        </CardContent>
      </SidebarCard>

      {/* Quick Navigation */}
      <SidebarCard sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2, color: theme.palette.text.primary }}>
            Quick Navigation
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button
              startIcon={<People sx={{ color: '#4caf50' }} />}
              variant="outlined"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                borderRadius: 2,
                py: 1.5,
                borderColor: '#4caf50',
                color: '#4caf50',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  borderColor: '#4caf50',
                },
              }}
              onClick={() => navigate('/network')}
            >
              My Network
            </Button>
            <Button
              startIcon={<Work sx={{ color: '#1877f2' }} />}
              variant="outlined"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                borderRadius: 2,
                py: 1.5,
                borderColor: '#1877f2',
                color: '#1877f2',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(24, 119, 242, 0.1)',
                  borderColor: '#1877f2',
                },
              }}
              onClick={() => navigate('/app/jobs')}
            >
              Jobs
            </Button>
            <Button
              startIcon={<Bookmark sx={{ color: '#9c27b0' }} />}
              variant="outlined"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                borderRadius: 2,
                py: 1.5,
                borderColor: '#9c27b0',
                color: '#9c27b0',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(156, 39, 176, 0.1)',
                  borderColor: '#9c27b0',
                },
              }}
              onClick={() => navigate('/saved')}
            >
              Saved
            </Button>
            <Button
              startIcon={<Event sx={{ color: '#e91e63' }} />}
              variant="outlined"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                borderRadius: 2,
                py: 1.5,
                borderColor: '#e91e63',
                color: '#e91e63',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: 'rgba(233, 30, 99, 0.1)',
                  borderColor: '#e91e63',
                },
              }}
              onClick={() => navigate('/events')}
            >
              Events
            </Button>
          </Box>
        </CardContent>
      </SidebarCard>

      {/* Suggested Connections */}
      <SidebarCard>
        <CardContent sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
          <Typography 
            variant="subtitle1" 
            fontWeight="700" 
            sx={{ 
              mb: 2,
              fontSize: { md: '0.95rem', lg: '1.125rem' },
              lineHeight: 1.2
            }}
          >
            Suggested Connections
          </Typography>
          
          {connectionsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {Array.from({ length: 3 }).map((_, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" height={14} />
                    <Skeleton variant="text" width="60%" height={12} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : suggestedConnections.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {suggestedConnections.slice(0, 5).map((connection) => (
                <Box key={connection._id} sx={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: 1.5,
                  pb: 1,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  '&:last-child': { borderBottom: 'none', pb: 0 }
                }}>
                  <Avatar 
                    src={connection.profilePicture}
                    sx={{ 
                      width: { md: 32, lg: 36 }, 
                      height: { md: 32, lg: 36 },
                      fontSize: { md: '0.8rem', lg: '0.9rem' }
                    }}
                  >
                    {connection.firstName?.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight="600" 
                      sx={{ 
                        fontSize: { md: '0.75rem', lg: '0.875rem' },
                        lineHeight: 1.2,
                        mb: 0.25,
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
                        fontSize: { md: '0.7rem', lg: '0.75rem' },
                        lineHeight: 1.1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block'
                      }}
                    >
                      {connection.jobTitle && connection.company 
                        ? `${connection.jobTitle} at ${connection.company}` 
                        : connection.jobTitle || connection.company || 'Professional'}
                    </Typography>
                    {connection.mutualConnections > 0 && (
                      <Typography 
                        variant="caption" 
                        color="primary.main"
                        sx={{ 
                          fontSize: { md: '0.65rem', lg: '0.7rem' },
                          fontWeight: 500,
                          display: 'block',
                          mt: 0.25
                        }}
                      >
                        {connection.mutualConnections} connection{connection.mutualConnections > 1 ? 's' : ''}
                      </Typography>
                    )}
                  </Box>
                  <Button
                    size="small"
                    variant={connection.connectionStatus === 'pending' ? 'contained' : 'outlined'}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none', 
                      fontSize: { md: '0.7rem', lg: '0.75rem' },
                      fontWeight: 600,
                      px: { md: 1, lg: 1.5 },
                      py: 0.5,
                      minWidth: { md: 'auto', lg: 'auto' },
                      backgroundColor: connection.connectionStatus === 'pending' ? '#4CAF50' : 'transparent',
                      color: connection.connectionStatus === 'pending' ? 'white' : 'inherit',
                      borderColor: connection.connectionStatus === 'pending' ? '#4CAF50' : 'inherit',
                      '&:hover': {
                        backgroundColor: connection.connectionStatus === 'pending' ? '#45a049' : 'rgba(25, 118, 210, 0.1)',
                      }
                    }}
                    onClick={() => handleConnect(connection._id)}
                  >
                    {connection.connectionStatus === 'pending' ? '✓' : '+'}
                  </Button>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ 
                textAlign: 'center', 
                py: 2,
                fontSize: { md: '0.75rem', lg: '0.875rem' },
                lineHeight: 1.4
              }}
            >
              No suggested connections
            </Typography>
          )}

          {suggestedConnections.length > 5 && (
                <Button
              fullWidth
              variant="text"
              sx={{ mt: 2, textTransform: 'none' }}
              onClick={() => navigate('/connections')}
            >
              View All Suggestions
                </Button>
              )}
        </CardContent>
      </SidebarCard>

      {/* Trending Topics */}
      <SidebarCard>
        <CardContent>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
            Trending Topics
            </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {['#career', '#networking', '#jobs', '#technology', '#leadership'].map((topic) => (
              <Chip
                key={topic}
                label={topic}
                variant="outlined"
                size="small"
                clickable
                sx={{ fontSize: '0.75rem' }}
                onClick={() => handleTopicClick(topic)}
              />
            ))}
          </Box>
        </CardContent>
      </SidebarCard>

      {/* Quick Actions */}
      <SidebarCard>
        <CardContent>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Career & Jobs */}
            <Button
              startIcon={<Work sx={{ color: '#1877f2' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #1877f2 0%, #42a5f5 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(24, 119, 242, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  boxShadow: '0 4px 12px rgba(24, 119, 242, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleFindJobs()}
            >
              Jobs
            </Button>
            <Button
              startIcon={<School sx={{ color: '#e91e63' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(233, 30, 99, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #c2185b 0%, #e91e63 100%)',
                  boxShadow: '0 4px 12px rgba(233, 30, 99, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleInterviewPrep()}
            >
              Interview Prep
            </Button>
            <Button
              startIcon={<PersonAdd sx={{ color: '#9c27b0' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
                  boxShadow: '0 4px 12px rgba(156, 39, 176, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleApplications()}
            >
              Applications
            </Button>
            
            {/* Assessment & Testing */}
            <Button
              startIcon={<Article sx={{ color: '#4caf50' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handlePsychometricTests()}
            >
              Psychometric Tests
            </Button>
            <Button
              startIcon={<School sx={{ color: '#ff5722' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #ff5722 0%, #ff8a65 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(255, 87, 34, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d84315 0%, #ff5722 100%)',
                  boxShadow: '0 4px 12px rgba(255, 87, 34, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleSmartExams()}
            >
              Smart Exams
            </Button>
            <Button
              startIcon={<Article sx={{ color: '#795548' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #795548 0%, #a1887f 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(121, 85, 72, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5d4037 0%, #795548 100%)',
                  boxShadow: '0 4px 12px rgba(121, 85, 72, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleCVBuilder()}
            >
              CV Builder
            </Button>
            
            {/* Professional Development */}
            <Button
              startIcon={<TrendingUp sx={{ color: '#2196f3' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleCareerGuidance()}
            >
              Career Guidance
            </Button>
            <Button
              startIcon={<People sx={{ color: '#9c27b0' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(156, 39, 176, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%)',
                  boxShadow: '0 4px 12px rgba(156, 39, 176, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleNetworking()}
            >
              My Network
            </Button>
            <Button
              startIcon={<Event sx={{ color: '#ff9800' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f57c00 0%, #ff9800 100%)',
                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleEvents()}
            >
              Events
            </Button>
            <Button
              startIcon={<Article sx={{ color: '#2196f3' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #2196f3 0%, #64b5f6 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
                  boxShadow: '0 4px 12px rgba(33, 150, 243, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleArticles()}
            >
              Articles
            </Button>
            
            {/* Platform Management */}
            <Button
              startIcon={<Bookmark sx={{ color: '#795548' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #795548 0%, #a1887f 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(121, 85, 72, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5d4037 0%, #795548 100%)',
                  boxShadow: '0 4px 12px rgba(121, 85, 72, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleSaved()}
            >
              Saved
            </Button>
            <Button
              startIcon={<Business sx={{ color: '#795548' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #795548 0%, #a1887f 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(121, 85, 72, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5d4037 0%, #795548 100%)',
                  boxShadow: '0 4px 12px rgba(121, 85, 72, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleBusiness()}
            >
              Business
            </Button>
            <Button
              startIcon={<PersonAdd sx={{ color: '#607d8b' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #607d8b 0%, #90a4ae 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(96, 125, 139, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #455a64 0%, #607d8b 100%)',
                  boxShadow: '0 4px 12px rgba(96, 125, 139, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleProfile()}
            >
              Profile
            </Button>
            <Button
              startIcon={<Help sx={{ color: '#ff5722' }} />}
              variant="contained"
              fullWidth
              sx={{ 
                justifyContent: 'flex-start', 
                textTransform: 'none',
                background: 'linear-gradient(135deg, #ff5722 0%, #ff8a65 100%)',
                color: 'white',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5,
                boxShadow: '0 2px 8px rgba(255, 87, 34, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d84315 0%, #ff5722 100%)',
                  boxShadow: '0 4px 12px rgba(255, 87, 34, 0.4)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.3s ease',
              }}
              onClick={() => handleHelp()}
            >
              Help
            </Button>
          </Box>
        </CardContent>
      </SidebarCard>
    </Box>
  );


  // Helper function to format distance to now
  const formatDistanceToNow = (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '50vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f0f2f5',
    }}>
      {/* Mobile Top Bar */}
      {isMobile && (
        <AppBar position="sticky" elevation={0} sx={{ 
          bgcolor: theme.palette.mode === 'dark' 
            ? 'rgba(15, 23, 42, 0.95)' 
            : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 32px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 4px 32px rgba(0, 0, 0, 0.08), 0 1px 0 rgba(255, 255, 255, 0.8)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(2, 6, 23, 0.98) 100%)'
              : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.95) 50%, rgba(226, 232, 240, 0.98) 100%)',
            zIndex: -1,
          },
        }}>
          <Toolbar sx={{ 
            px: { xs: 1.5, sm: 2 }, 
            py: { xs: 1, sm: 1.5 },
            minHeight: { xs: 65, sm: 70 },
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mr: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1.1rem', sm: '1.3rem' },
                letterSpacing: '-0.02em'
              }}
            >
              Social
            </Typography>
            
            <StyledSearchBar 
              sx={{ 
                flex: 1, 
                maxWidth: 'none', 
                mr: { xs: 1.5, sm: 2 },
                cursor: 'pointer',
                height: { xs: 40, sm: 44 },
                borderRadius: { xs: 20, sm: 22 },
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', sm: '0.95rem' },
                  fontWeight: 500,
                },
                '& .MuiInputBase-input': {
                  padding: { xs: '6px 0', sm: '8px 0' },
                  '&::placeholder': {
                    opacity: 0.7,
                    fontWeight: 400,
                  },
                },
              }}
              onClick={handleSearchClick}
            >
              <Search 
                sx={{ 
                  mr: { xs: 1, sm: 1.5 }, 
                  color: 'text.secondary',
                  fontSize: { xs: '1.1rem', sm: '1.2rem' },
                  transition: 'all 0.3s ease',
                }} 
              />
              <InputBase
                placeholder="Search posts and users..."
                value={searchValue}
                onChange={handleSearchChange}
                onKeyPress={handleSearchKeyPress}
                onClick={(e) => e.stopPropagation()}
                sx={{ 
                  flex: 1,
                  fontSize: { xs: '0.9rem', sm: '0.95rem' },
                  fontWeight: 500,
                  '& .MuiInputBase-input': {
                    padding: { xs: '6px 0', sm: '8px 0' },
                    '&::placeholder': {
                      opacity: 0.7,
                      fontWeight: 400,
                    },
                  },
                }}
              />
            </StyledSearchBar>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton 
                onClick={() => navigate('/app/notifications')}
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Notifications sx={{ fontSize: '1.3rem' }} />
              </IconButton>
              <IconButton
                sx={{
                  p: 1.2,
                  borderRadius: 2,
                  backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.15),
                    transform: 'scale(1.05)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <Chat sx={{ fontSize: '1.3rem' }} />
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      <Container maxWidth="xl" sx={{ py: isMobile ? 1 : 3, px: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
          
          {/* Left Job Preparation Column */}
          {!isMobile && (
            <Box sx={{ width: { md: 220, lg: 240 } }}>
              {renderJobPreparationColumn()}
            </Box>
          )}
          
          {/* Main Content */}
          <Box sx={{ flex: 1, maxWidth: { xs: '100%', md: '70%', lg: '60%' } }}>
            <Box sx={{ maxWidth: 680, mx: 'auto' }}>
              {/* Desktop Search Bar */}
              {!isMobile && (
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <StyledSearchBar 
                    sx={{ 
                      cursor: 'pointer',
                      height: 48,
                      borderRadius: 24,
                      '& .MuiInputBase-root': {
                        fontSize: '1rem',
                        fontWeight: 500,
                      },
                      '& .MuiInputBase-input': {
                        padding: '12px 0',
                        '&::placeholder': {
                          opacity: 0.7,
                          fontWeight: 400,
                        },
                      },
                    }}
                    onClick={handleSearchClick}
                  >
                    <Search 
                      sx={{ 
                        mr: 2, 
                        color: 'text.secondary',
                        fontSize: '1.3rem',
                        transition: 'all 0.3s ease',
                      }} 
                    />
                    <InputBase
                      placeholder="Search for posts, people, companies..."
                      value={searchValue}
                      onChange={handleSearchChange}
                      onKeyPress={handleSearchKeyPress}
                      onClick={(e) => e.stopPropagation()}
                      sx={{ 
                        flex: 1,
                        fontSize: '1rem',
                        fontWeight: 500,
                        '& .MuiInputBase-input': {
                          padding: '12px 0',
                          '&::placeholder': {
                            opacity: 0.7,
                            fontWeight: 400,
                          },
                        },
                      }}
                    />
                  </StyledSearchBar>
                  {!isMobile && (
                    <IconButton 
                      sx={{ 
                        bgcolor: 'background.paper', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        borderRadius: 2,
                        p: 1.5,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                          transform: 'scale(1.05)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                      onClick={() => navigate('/app/notifications')}
                    >
                      <Notifications sx={{ fontSize: '1.3rem' }} />
                    </IconButton>
                  )}
                </Box>
              )}

              {/* Stories */}
                {renderStories()}
              
              {/* Quick Actions */}
                {renderQuickActions()}
              
              {/* Create Post */}
                {renderCreatePost()}
              
              {/* Posts Feed */}
              {loading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box sx={{ flex: 1 }}>
                          <Skeleton variant="text" width="60%" height={20} />
                          <Skeleton variant="text" width="40%" height={16} />
                            </Box>
                          </Box>
                      <Skeleton variant="text" width="100%" height={20} />
                          <Skeleton variant="text" width="80%" height={20} />
                      <Skeleton variant="rectangular" width="100%" height={200} sx={{ mt: 2, borderRadius: 1 }} />
                      </Card>
                  ))}
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : posts.length > 0 ? (
                <AnimatePresence>
                  {posts.map((post) => renderPost(post))}
                </AnimatePresence>
              ) : (
                <Card sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    No posts yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Be the first to share something with your network!
                  </Typography>
                  <Button variant="contained" onClick={() => setShowCreatePost(true)}>
                    Create First Post
                  </Button>
                </Card>
              )}

              {/* Load More */}
              {posts.length > 0 && hasMore && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button 
                        variant="outlined" 
                    size="large" 
                    sx={{ borderRadius: 25 }}
                    onClick={loadMorePosts}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More Posts'}
                  </Button>
            </Box>
          )}
        </Box>
          </Box>

          {/* Right Sidebar */}
          <Box
            sx={{
              width: { xs: '100%', md: 260, lg: 300 },
              mt: { xs: 3, md: 0 }
            }}
          >
            {renderRightSidebar()}
          </Box>
            </Box>
      </Container>



          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

      {/* Create Post Dialog */}
      <MobileCreatePost
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={(newPost) => {
          setPosts(prev => [newPost, ...prev]);
          setShowCreatePost(false);
        }}
      />

      {/* Create Story Dialog */}
      <CreateStory
        open={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onStoryCreated={(newStory) => {
          setStories(prev => [newStory, ...prev]);
          setShowCreateStory(false);
        }}
      />

      {/* Story Viewer */}
      <StoryViewer
        open={showStoryViewer}
        onClose={() => setShowStoryViewer(false)}
        stories={stories}
        initialStoryIndex={selectedStoryIndex}
        currentUserId={user?._id}
      />

      {/* Contact Dialog */}
      <Dialog
        open={contactDialogOpen}
        onClose={handleContactClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.5)'
              : '0 20px 60px rgba(0, 0, 0, 0.15)',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(45deg, #22c55e, #4ade80)',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            py: 3,
          }}
        >
          <IconButton
            onClick={handleContactClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'white',
            }}
          >
            <Close />
          </IconButton>
          <Typography variant="h5" fontWeight={700}>
            Get in Touch
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
            We're here to help you succeed!
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Contact Methods */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
              Contact Methods
            </Typography>
            <List>
              <ListItem
                onClick={() => window.open('tel:+0788535156', '_self')}
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Phone sx={{ color: '#4caf50' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Call Us"
                  secondary="+250 0788535156"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              <ListItem
                onClick={() => window.open('https://wa.me/0788535156?text=Hello%20ExJobNet', '_blank')}
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <WhatsApp sx={{ color: '#25d366' }} />
                </ListItemIcon>
                <ListItemText
                  primary="WhatsApp"
                  secondary="Chat with us instantly"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              <ListItem
                onClick={() => window.open('mailto:info@excellencecoachinghub.com', '_self')}
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Email sx={{ color: '#1976d2' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Email"
                  secondary="info@excellencecoachinghub.com"
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
            </List>
          </Box>

          <Divider />

          {/* Social Media */}
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
              Follow Us
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Tooltip title="Facebook" arrow>
                <IconButton
                  onClick={() => window.open('https://facebook.com/excellencecoachinghub', '_blank')}
                  sx={{ color: '#1877f2' }}
                >
                  <Facebook />
                </IconButton>
              </Tooltip>
              <Tooltip title="Instagram" arrow>
                <IconButton
                  onClick={() => window.open('https://www.instagram.com/excellencecoachinghub/?utm_source=qr&igsh=Ym5xMXh5aXZmNHVi#', '_blank')}
                  sx={{ color: '#e4405f' }}
                >
                  <Instagram />
                </IconButton>
              </Tooltip>
              <Tooltip title="LinkedIn" arrow>
                <IconButton
                  onClick={() => window.open('https://www.linkedin.com/in/excellence-coachinghub-1b8b1a380?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app', '_blank')}
                  sx={{ color: '#0077b5' }}
                >
                  <LinkedIn />
                </IconButton>
              </Tooltip>
              <Tooltip title="Twitter" arrow>
                <IconButton
                  onClick={() => window.open('https://x.com/ECH_coachinghub?t=Awf4GVPp9eCkSZhDlHkFew&s=08', '_blank')}
                  sx={{ color: '#1DA1F2' }}
                >
                  <Twitter />
                </IconButton>
              </Tooltip>
              <Tooltip title="TikTok" arrow>
                <IconButton
                  onClick={() => window.open('https://www.tiktok.com/@excellence.coachi4?_t=ZM-8zCgEouFb8w&_r=1', '_blank')}
                  sx={{ color: '#ff0050' }}
                >
                  <VideoLibrary />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            onClick={handleContactClose}
            variant="contained"
            fullWidth
            sx={{
              background: 'linear-gradient(45deg, #22c55e, #4ade80)',
              boxShadow: '0 4px 15px rgba(34, 197, 94, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #16a34a, #22c55e)',
                boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Profile Completion Popup */}
      {user && (
        <ProfileCompletionPopup
          open={showProfileCompletionPopup}
          onClose={handleProfileCompletionClose}
          onCompleteProfile={handleProfileCompletionAction}
          user={user}
        />
      )}

      {/* CV Builder Popup */}
      {user && (
        <CVBuilderPopup
          open={showCVBuilderPopup}
          onClose={handleCVBuilderClose}
          onBuildCV={handleCVBuilderAction}
          onContinueProfile={handleCVBuilderContinueProfile}
          user={user}
        />
      )}
    </Box>
  );
};

export default ModernSocialNetworkPage;
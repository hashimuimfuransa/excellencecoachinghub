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
  Fab,
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
} from '@mui/material';
import {
  Add,
  Search,
  Home,
  People,
  Notifications,
  Chat,
  Bookmark,
  Trending,
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
  Menu as MenuIcon,
  Groups,
  PersonAdd,
  CameraAlt,
  VideoLibrary,
  EmojiEmotions,
  Gif,
  AttachFile,
  Public,
  Lock,
  Group,
  Language,
  TrendingUp,
  AccessTime,
  Star,
  Verified,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SocialPost } from '../types/social';
import MobileFooterNavbar from '../components/MobileFooterNavbar';
import ProfileCompletionPopup from '../components/ProfileCompletionPopup';
import CVBuilderPopup from '../components/CVBuilderPopup';
import { shouldShowProfileCompletionPopup, shouldShowCVBuilderPopup, markProfileCompletionDismissed, markCVBuilderDismissed } from '../utils/profileCompletionUtils';

// Styled components for modern design
const StyledSearchBar = styled(Paper)(({ theme }) => ({
  padding: '2px 16px',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: 400,
  borderRadius: 50,
  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f0f2f5',
  boxShadow: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#e4e6ea',
  },
  '&:focus-within': {
    backgroundColor: theme.palette.background.paper,
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`,
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

const PostCard = styled(Card)(({ theme }) => ({
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
  const [showProfileCompletionPopup, setShowProfileCompletionPopup] = useState(false);
  const [showCVBuilderPopup, setShowCVBuilderPopup] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  // Sample data for stories
  const stories = [
    { id: 1, name: 'Your story', avatar: user?.profilePicture || '', hasStory: false, isOwn: true },
    { id: 2, name: 'John Doe', avatar: '', hasStory: true },
    { id: 3, name: 'Sarah Johnson', avatar: '', hasStory: true },
    { id: 4, name: 'Mike Chen', avatar: '', hasStory: true },
    { id: 5, name: 'Emily Davis', avatar: '', hasStory: true },
    { id: 6, name: 'Alex Wilson', avatar: '', hasStory: true },
  ];

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

  // Sample suggested connections
  const suggestedConnections = [
    { id: '1', name: 'Emily Chen', title: 'Data Scientist at Netflix', avatar: '', mutualConnections: 12 },
    { id: '2', name: 'David Rodriguez', title: 'DevOps Engineer at AWS', avatar: '', mutualConnections: 8 },
    { id: '3', name: 'Lisa Thompson', title: 'Marketing Director at Spotify', avatar: '', mutualConnections: 15 },
  ];

  // Sample trending topics
  const trendingTopics = [
    { topic: '#WebDevelopment', posts: 1200 },
    { topic: '#AI', posts: 890 },
    { topic: '#RemoteWork', posts: 654 },
    { topic: '#CareerGrowth', posts: 432 },
    { topic: '#TechNews', posts: 321 },
  ];

  useEffect(() => {
    loadFeed();
  }, []);

  // Check for profile completion popup on mount
  useEffect(() => {
    if (user) {
      const shouldShowProfile = shouldShowProfileCompletionPopup(user);
      const shouldShowCV = shouldShowCVBuilderPopup(user);
      
      // Show profile completion popup first if needed
      if (shouldShowProfile) {
        setShowProfileCompletionPopup(true);
      } else if (shouldShowCV) {
        setShowCVBuilderPopup(true);
      }
    }
  }, [user]);

  const loadFeed = async () => {
    setLoading(true);
    try {
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPosts(samplePosts);
    } catch (error) {
      setError('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  // Popup handlers
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

  const renderStories = () => (
    <Card sx={{ mb: 2, p: 2, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
        {stories.map((story, index) => (
          <motion.div
            key={story.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 70 }}>
              <Box sx={{ position: 'relative' }}>
                <StoryAvatar 
                  src={story.avatar}
                  sx={{ 
                    border: story.hasStory 
                      ? `3px solid ${theme.palette.primary.main}` 
                      : `2px solid ${theme.palette.divider}`,
                  }}
                >
                  {!story.avatar && story.name.charAt(0)}
                </StoryAvatar>
                {story.isOwn && (
                  <IconButton 
                    size="small" 
                    sx={{ 
                      position: 'absolute', 
                      bottom: -5, 
                      right: -5, 
                      bgcolor: 'primary.main',
                      color: 'white',
                      width: 24,
                      height: 24,
                      '&:hover': { bgcolor: 'primary.dark' }
                    }}
                  >
                    <Add fontSize="small" />
                  </IconButton>
                )}
              </Box>
              <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', fontSize: '0.7rem' }}>
                {story.name.length > 10 ? `${story.name.slice(0, 10)}...` : story.name}
              </Typography>
            </Box>
          </motion.div>
        ))}
      </Box>
    </Card>
  );

  const renderCreatePost = () => (
    <PostCard>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
          <Avatar src={user?.profilePicture}>
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
    </PostCard>
  );

  const renderPost = (post: SocialPost) => (
    <motion.div
      key={post._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <PostCard>
        <CardContent sx={{ pb: 0 }}>
          {/* Post Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                src={post.author.profilePicture}
                sx={{ width: 48, height: 48 }}
              >
                {post.author.firstName.charAt(0)}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {post.author.firstName} {post.author.lastName}
                  </Typography>
                  {post.isPinned && <Star sx={{ color: 'gold', fontSize: 16 }} />}
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {post.author.jobTitle}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(new Date(post.createdAt))} ago
                  </Typography>
                  <Typography variant="caption" color="text.secondary">•</Typography>
                  <Public sx={{ fontSize: 12, color: 'text.secondary' }} />
                </Box>
              </Box>
            </Box>
            <IconButton>
              <MoreVert />
            </IconButton>
          </Box>

          {/* Post Content */}
          <Box sx={{ mb: 2 }}>
            {(() => {
              // Calculate if text should be truncated based on line count
              const lines = post.content.split('\n').filter(line => line.trim().length > 0);
              const totalLines = lines.reduce((acc, line) => {
                const estimatedLines = Math.ceil(line.length / (isMobile ? 35 : isTablet ? 45 : 55));
                return acc + Math.max(1, estimatedLines);
              }, 0);
              const shouldTruncate = totalLines > 2;
              
              // Get truncated text
              const getTruncatedText = (text: string) => {
                if (!shouldTruncate) return text;
                
                const lines = text.split('\n').filter(line => line.trim().length > 0);
                let truncatedLines = [];
                let currentLineCount = 0;
                const maxLines = 2;
                
                for (const line of lines) {
                  const estimatedLines = Math.ceil(line.length / (isMobile ? 35 : isTablet ? 45 : 55));
                  
                  if (currentLineCount + estimatedLines <= maxLines) {
                    truncatedLines.push(line);
                    currentLineCount += estimatedLines;
                  } else {
                    const remainingChars = (maxLines - currentLineCount) * (isMobile ? 35 : isTablet ? 45 : 55);
                    if (remainingChars > 0) {
                      truncatedLines.push(line.substring(0, remainingChars) + '...');
                    }
                    break;
                  }
                }
                
                return truncatedLines.join('\n');
              };
              
              return (
                <>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      lineHeight: 1.6,
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      whiteSpace: 'pre-line',
                      color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      mb: shouldTruncate ? 1 : 0,
                    }}
                  >
                    {isTextExpanded || !shouldTruncate 
                      ? post.content 
                      : getTruncatedText(post.content)
                    }
                  </Typography>
                  
                  {/* View More/Less Button for multi-line content */}
                  {shouldTruncate && (
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => setIsTextExpanded(!isTextExpanded)}
                      sx={{
                        p: 0,
                        minWidth: 'auto',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        textTransform: 'none',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          color: theme.palette.primary.dark,
                        }
                      }}
                    >
                      {isTextExpanded ? 'Show Less' : 'Show More'}
                    </Button>
                  )}
                </>
              );
            })()}
          </Box>

          {/* Post Tags */}
          {post.tags.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {post.tags.map(tag => (
                <Chip 
                  key={tag} 
                  label={`#${tag}`} 
                  size="small" 
                  variant="outlined"
                  clickable
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          )}

          {/* Engagement Stats */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{ 
                  width: 20, 
                  height: 20, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 0.5
                }}>
                  <ThumbUp sx={{ fontSize: 12, color: 'white' }} />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {post.likesCount}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {post.commentsCount} comments
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {post.sharesCount} shares
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <Divider />

        {/* Post Actions */}
        <Box sx={{ p: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
            <Button
              startIcon={<ThumbUp />}
              onClick={() => handlePostLike(post._id)}
              sx={{ 
                textTransform: 'none',
                color: post.likes.includes(user?._id || '') ? 'primary.main' : 'text.secondary',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
              }}
            >
              Like
            </Button>
            <Button 
              startIcon={<Comment />}
              sx={{ 
                textTransform: 'none', 
                color: 'text.secondary',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
              }}
            >
              Comment
            </Button>
            <Button 
              startIcon={<Share />}
              sx={{ 
                textTransform: 'none', 
                color: 'text.secondary',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
              }}
            >
              Share
            </Button>
            <Button 
              startIcon={<Send />}
              sx={{ 
                textTransform: 'none', 
                color: 'text.secondary',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
              }}
            >
              Send
            </Button>
          </Box>
        </Box>
      </PostCard>
    </motion.div>
  );

  const renderLeftSidebar = () => (
    <Box sx={{ position: 'sticky', top: theme.spacing(2) }}>
      {/* Profile Card */}
      <SidebarCard>
        <CardContent sx={{ textAlign: 'center' }}>
          <Avatar
            src={user?.profilePicture}
            sx={{ 
              width: 80, 
              height: 80, 
              mx: 'auto',
              mb: 2,
              border: '3px solid',
              borderColor: 'primary.main'
            }}
          >
            {user?.firstName?.charAt(0)}
          </Avatar>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {user?.jobTitle || 'Professional'}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => navigate('/profile')}
            sx={{ borderRadius: 20 }}
          >
            View Profile
          </Button>
        </CardContent>
      </SidebarCard>

      {/* Quick Navigation */}
      <SidebarCard>
        <List sx={{ py: 1 }}>
          <ListItemButton onClick={() => navigate('/connections')}>
            <ListItemIcon><People sx={{ color: 'primary.main' }} /></ListItemIcon>
            <ListItemText primary="My Network" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate('/jobs')}>
            <ListItemIcon><Work sx={{ color: 'primary.main' }} /></ListItemIcon>
            <ListItemText primary="Jobs" />
          </ListItemButton>
          <ListItemButton onClick={() => navigate('/learning')}>
            <ListItemIcon><School sx={{ color: 'primary.main' }} /></ListItemIcon>
            <ListItemText primary="Learning" />
          </ListItemButton>
          <ListItemButton>
            <ListItemIcon><Bookmark sx={{ color: 'primary.main' }} /></ListItemIcon>
            <ListItemText primary="Saved" />
          </ListItemButton>
          <ListItemButton>
            <ListItemIcon><Event sx={{ color: 'primary.main' }} /></ListItemIcon>
            <ListItemText primary="Events" />
          </ListItemButton>
        </List>
      </SidebarCard>
    </Box>
  );

  const renderRightSidebar = () => (
    <Box sx={{ position: 'sticky', top: theme.spacing(2) }}>
      {/* Trending Topics */}
      <SidebarCard>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              Trending
            </Typography>
          </Box>
          {trendingTopics.map((trend, index) => (
            <Box 
              key={trend.topic}
              sx={{ 
                py: 1, 
                cursor: 'pointer',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                borderRadius: 1,
                px: 1,
              }}
            >
              <Typography variant="body2" fontWeight="600" color="primary.main">
                {trend.topic}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {trend.posts} posts
              </Typography>
            </Box>
          ))}
        </CardContent>
      </SidebarCard>

      {/* Suggested Connections */}
      <SidebarCard>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <PersonAdd sx={{ mr: 1, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight="600">
              People you may know
            </Typography>
          </Box>
          {suggestedConnections.map((connection) => (
            <Box 
              key={connection.id}
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                py: 1,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                borderRadius: 1,
                px: 1,
              }}
            >
              <Avatar 
                src={connection.avatar} 
                sx={{ width: 40, height: 40, mr: 2 }}
              >
                {connection.name.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight="600">
                  {connection.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {connection.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {connection.mutualConnections} mutual connections
                </Typography>
              </Box>
              <IconButton size="small" color="primary">
                <PersonAdd />
              </IconButton>
            </Box>
          ))}
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
          bgcolor: 'background.paper',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`
        }}>
          <Toolbar>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mr: 2 }}>
              Social
            </Typography>
            <StyledSearchBar sx={{ flex: 1, maxWidth: 'none', mr: 2 }}>
              <Search sx={{ mr: 1, color: 'text.secondary' }} />
              <InputBase
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                sx={{ flex: 1 }}
              />
            </StyledSearchBar>
            <IconButton>
              <Chat />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}

      <Container maxWidth="xl" sx={{ py: isMobile ? 1 : 3, px: { xs: 1, sm: 2, md: 3 } }}>
        <Grid container spacing={3}>
          {/* Left Sidebar - Desktop only */}
          {isDesktop && (
            <Grid item xs={12} lg={3}>
              {renderLeftSidebar()}
            </Grid>
          )}

          {/* Main Content */}
          <Grid item xs={12} lg={isDesktop ? 6 : 9}>
            <Box sx={{ maxWidth: 680, mx: 'auto' }}>
              {/* Desktop Search Bar */}
              {!isMobile && (
                <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <StyledSearchBar>
                    <Search sx={{ mr: 2, color: 'text.secondary' }} />
                    <InputBase
                      placeholder="Search for posts, people, companies..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      sx={{ flex: 1 }}
                    />
                  </StyledSearchBar>
                  {!isMobile && (
                    <IconButton sx={{ bgcolor: 'background.paper', boxShadow: 1 }}>
                      <Notifications />
                    </IconButton>
                  )}
                </Box>
              )}

              {/* Stories */}
              {renderStories()}

              {/* Create Post */}
              {renderCreatePost()}

              {/* Posts Feed */}
              <AnimatePresence>
                {posts.map((post) => renderPost(post))}
              </AnimatePresence>

              {/* Load More */}
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button variant="outlined" size="large" sx={{ borderRadius: 25 }}>
                  Load More Posts
                </Button>
              </Box>
            </Box>
          </Grid>

          {/* Right Sidebar - Desktop and Tablet */}
          {!isMobile && (
            <Grid item xs={12} lg={3}>
              {renderRightSidebar()}
            </Grid>
          )}
        </Grid>
      </Container>


      {/* Floating Action Button for Create Post - Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{ 
            position: 'fixed', 
            bottom: 80, 
            right: 16,
            zIndex: 1000,
          }}
          onClick={() => setShowCreatePost(true)}
        >
          <Add />
        </Fab>
      )}

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

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
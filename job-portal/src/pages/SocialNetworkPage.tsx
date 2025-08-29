import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Tab,
  Tabs,
  Paper,
  CircularProgress,
  Alert,
  Fab,
  useTheme,
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  Button,
  Avatar,
  Chip,
  IconButton,
  Divider,
  Stack,
  Badge,
  alpha,
} from '@mui/material';
import { 
  Add, 
  Chat,
  Search,
  Work,
  School,
  Assignment,
  MenuBook,
  TrendingUp,
  People,
  Notifications,
  Bookmark,
  Settings,
  Star,
  ArrowForward,
  Timeline,
  Psychology,
  Business,
  Groups,
  CompareArrows,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/social/PostCard';
import CreatePost from '../components/social/CreatePost';
import FeedSidebar from '../components/social/FeedSidebar';
import { SocialPost } from '../types/social';
import { socialNetworkService, FeedOptions } from '../services/socialNetworkService';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box>{children}</Box>}
  </div>
);

const SocialNetworkPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [currentTab, setCurrentTab] = useState(0);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showWelcomeHeader, setShowWelcomeHeader] = useState(true);

  // Load posts on component mount and when filter changes
  useEffect(() => {
    loadPosts(true);
  }, [currentTab]);

  const loadPosts = async (reset = false) => {
    if (!user) return;
    
    setLoading(reset);
    setError(null);

    try {
      const currentPage = reset ? 1 : page;
      const filter = feedFilters[currentTab];
      
      const response = await socialNetworkService.getFeed({
        page: currentPage,
        limit: 10,
        filter
      });

      if (response.success) {
        const newPosts = response.data.posts || response.data || [];
        
        if (reset) {
          setPosts(newPosts);
          setPage(2);
        } else {
          setPosts(prev => [...prev, ...newPosts]);
          setPage(prev => prev + 1);
        }
        
        setHasMore(newPosts.length === 10);
      } else {
        throw new Error(response.message || 'Failed to load posts');
      }
    } catch (err: any) {
      console.error('Error loading posts:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: SocialPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowCreatePost(false);
  };

  const handlePostUpdate = (updatedPost: SocialPost) => {
    setPosts(prev => prev.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ));
  };

  const handlePostDelete = (postId: string) => {
    setPosts(prev => prev.filter(post => post._id !== postId));
  };

  const feedFilters: FeedOptions['filter'][] = ['all', 'jobs', 'people', 'training'];
  const tabLabels = ['All Posts', 'Job Posts', 'People', 'Training'];

  // Quick Action Buttons Data
  const quickActions = [
    {
      title: 'Search Jobs',
      subtitle: 'Find your dream career',
      icon: <Search sx={{ fontSize: 28 }} />,
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
      path: '/app/jobs',
      stats: '500+ Active',
    },
    {
      title: 'Get Prepared',
      subtitle: 'Interview & test prep',
      icon: <Psychology sx={{ fontSize: 28 }} />,
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)',
      path: '/app/job-preparation',
      stats: 'AI-Powered',
    },
    {
      title: 'Generate CV',
      subtitle: 'Professional resume builder',
      icon: <Assignment sx={{ fontSize: 28 }} />,
      color: '#2196F3',
      gradient: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
      path: '/app/cv-builder',
      stats: 'Free Templates',
    },
    {
      title: 'Courses',
      subtitle: 'Skill development programs',
      icon: <MenuBook sx={{ fontSize: 28 }} />,
      color: '#9C27B0',
      gradient: 'linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%)',
      path: '/app/courses',
      stats: '100+ Available',
    },
  ];

  useEffect(() => {
    loadFeed(1, true);
  }, [currentTab]);

  // Auto-hide welcome header after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowWelcomeHeader(false);
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, []);

  const loadFeed = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      setError(null);

      const options: FeedOptions = {
        page: pageNum,
        limit: 10,
        filter: feedFilters[currentTab],
      };

      const response = await socialNetworkService.getFeed(options);
      
      if (reset) {
        setPosts(response.data);
      } else {
        setPosts(prev => [...prev, ...response.data]);
      }
      
      setHasMore(response.data.length === 10);
      setPage(pageNum);
    } catch (err) {
      setError('Failed to load feed. Please try again.');
      console.error('Error loading feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const loadMorePosts = () => {
    if (!loading && hasMore) {
      loadPosts(false);
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)'
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)',
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '300px',
          background: theme.palette.mode === 'dark'
            ? 'radial-gradient(ellipse at top, rgba(102, 126, 234, 0.1) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at top, rgba(102, 126, 234, 0.05) 0%, transparent 70%)',
          zIndex: 0,
        }
      }}
    >
      <Container 
        maxWidth={false} 
        sx={{ 
          py: { xs: 4, md: 6 },
          px: { xs: 4, sm: 5, md: 8, lg: 10 },
          maxWidth: '1900px', // Increased from 1600px
          mx: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Enhanced Modern Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: showWelcomeHeader ? 1 : 0, 
            y: showWelcomeHeader ? 0 : -50,
            height: showWelcomeHeader ? 'auto' : 0,
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ overflow: 'hidden' }}
        >
          <Box 
            sx={{ 
              mb: showWelcomeHeader ? 10 : 0,
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 4,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              p: { xs: 3, md: 4 },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                background: 'linear-gradient(135deg, #667eea, #764ba2, #f093fb)',
                borderRadius: 'inherit',
                zIndex: -1,
                opacity: 0.1,
              }
            }}
          >
            {/* Floating elements */}
            <Box
              sx={{
                position: 'absolute',
                top: 20,
                right: 20,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
                opacity: 0.3,
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px)' },
                  '50%': { transform: 'translateY(-20px)' }
                }
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 30,
                left: 30,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: 'linear-gradient(45deg, #f093fb, #f5576c)',
                opacity: 0.4,
                animation: 'float 4s ease-in-out infinite reverse',
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 1, ease: "backOut" }}
                >
                  <Box
                    sx={{
                      width: { xs: 70, md: 80 },
                      height: { xs: 70, md: 80 },
                      mr: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
                      boxShadow: '0 10px 30px rgba(102, 126, 234, 0.2), 0 0 0 3px rgba(102, 126, 234, 0.1)',
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: -3,
                        left: -3,
                        right: -3,
                        bottom: -3,
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        zIndex: -1,
                        animation: 'spin 20s linear infinite',
                        '@keyframes spin': {
                          '0%': { transform: 'rotate(0deg)' },
                          '100%': { transform: 'rotate(360deg)' }
                        }
                      }
                    }}
                  >
                    <img 
                      src="/exjobnetlogo.png" 
                      alt="ExJobNet Logo"
                      style={{ width: '75%', height: '75%', objectFit: 'contain' }}
                    />
                  </Box>
                </motion.div>
                <Box sx={{ flex: 1 }}>
                  <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    <Typography
                      variant={isMobile ? "h4" : "h3"}
                      sx={{
                        fontWeight: 900,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 30%, #f093fb 60%, #4facfe 100%)',
                        backgroundSize: '200% 100%',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        lineHeight: 1.1,
                        mb: 1,
                        animation: 'gradient 3s ease infinite',
                        '@keyframes gradient': {
                          '0%, 100%': { backgroundPosition: '0% 50%' },
                          '50%': { backgroundPosition: '100% 50%' }
                        }
                      }}
                    >
                      Professional Network
                    </Typography>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <Typography 
                      variant={isMobile ? "h6" : "h5"}
                      sx={{ 
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1,
                      }}
                    >
                      Welcome back, {user?.firstName || 'Professional'}! 👋
                    </Typography>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                  >
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 600,
                        color: 'text.secondary',
                        fontStyle: 'italic',
                        letterSpacing: '0.5px',
                      }}
                    >
                      🚀 Connect • 💡 Share • 🌱 Grow Together
                    </Typography>
                  </motion.div>
                </Box>
              </Box>
            </motion.div>
          </Box>
        </motion.div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Box sx={{ mb: 8 }}>
            <Typography 
              variant="h6" 
              fontWeight="700" 
              sx={{ mb: 4, color: 'text.primary' }}
            >
              Quick Actions
            </Typography>
            <Grid container spacing={5}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} lg={3} key={action.title}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      whileHover={{ y: -5 }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          borderRadius: 3,
                          background: action.gradient,
                          color: 'white',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            boxShadow: `0 12px 30px ${alpha(action.color, 0.4)}`,
                            '& .action-arrow': {
                              transform: 'translateX(5px)',
                            },
                          },
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 60,
                            height: 60,
                            background: `radial-gradient(circle, ${alpha('#fff', 0.2)} 0%, transparent 70%)`,
                            transform: 'translate(20px, -20px)',
                          },
                        }}
                        onClick={() => navigate(action.path)}
                      >
                        <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box
                              sx={{
                                background: alpha('#fff', 0.2),
                                borderRadius: 2,
                                p: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {action.icon}
                            </Box>
                            <ArrowForward 
                              className="action-arrow"
                              sx={{ 
                                fontSize: 20,
                                transition: 'transform 0.3s ease',
                                opacity: 0.8,
                              }} 
                            />
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight="700" sx={{ mb: 0.5 }}>
                              {action.title}
                            </Typography>
                            <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                              {action.subtitle}
                            </Typography>
                            <Chip
                              label={action.stats}
                              size="small"
                              sx={{
                                bgcolor: alpha('#fff', 0.2),
                                color: 'white',
                                border: `1px solid ${alpha('#fff', 0.3)}`,
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>

          {/* Main Content Grid */}
          <Grid container spacing={6}>
            {/* Left Sidebar - User Actions & Trending */}
            {!isMobile && !isTablet && (
              <Grid item xl={2.5} lg={3}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Stack spacing={5}>
                    {/* Profile Quick View */}
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 5 }}>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              width: 60,
                              height: 60,
                              mx: 'auto',
                              mb: 1,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }}
                          >
                            {user?.firstName?.[0] || 'U'}
                          </Avatar>
                          <Typography variant="h6" fontWeight="600">
                            {user?.firstName} {user?.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {user?.profession || 'Professional'}
                          </Typography>
                        </Box>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => navigate('/app/profile')}
                          sx={{ borderRadius: 2 }}
                        >
                          View Profile
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Trending Topics */}
                    <Card sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 5 }}>
                        <Typography variant="h6" fontWeight="600" sx={{ mb: 3 }}>
                          Trending Today
                        </Typography>
                        <Stack spacing={3}>
                          {[
                            { topic: '#RemoteWork', posts: '2.4k posts' },
                            { topic: '#AI Jobs', posts: '1.8k posts' },
                            { topic: '#SkillDevelopment', posts: '956 posts' },
                            { topic: '#Networking', posts: '743 posts' },
                          ].map((trend, index) => (
                            <Box key={trend.topic} sx={{ cursor: 'pointer' }}>
                              <Typography variant="body2" fontWeight="600" color="primary">
                                {trend.topic}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {trend.posts}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Stack>
                </motion.div>
              </Grid>
            )}

            {/* Center Feed */}
            <Grid item xs={12} xl={isMobile ? 12 : isTablet ? 12 : 7} lg={isMobile ? 12 : isTablet ? 12 : 6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {/* Enhanced Navigation Tabs */}
                <Card 
                  sx={{ 
                    mb: 4, 
                    borderRadius: 4,
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 8px 32px rgba(0,0,0,0.3)'
                      : '0 8px 32px rgba(102, 126, 234, 0.1)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(102, 126, 234, 0.1)'}`,
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '2px',
                      background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #4facfe 100%)',
                    }
                  }}
                >
                  <Tabs
                    value={currentTab}
                    onChange={handleTabChange}
                    variant={isMobile ? "scrollable" : "fullWidth"}
                    scrollButtons="auto"
                    sx={{
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 700,
                        py: 2.5,
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease',
                        '&.Mui-selected': {
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                          color: theme.palette.primary.main,
                        },
                        '&:hover': {
                          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        }
                      },
                      '& .MuiTabs-indicator': {
                        height: 3,
                        borderRadius: '3px 3px 0 0',
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                      },
                    }}
                  >
                    {tabLabels.map((label, index) => (
                      <Tab key={index} label={label} />
                    ))}
                  </Tabs>
                </Card>

                {/* Create Post Section */}
                {(showCreatePost || !isMobile) && (
                  <Box sx={{ mb: 3 }}>
                    <CreatePost
                      onPostCreated={handlePostCreated}
                      onCancel={isMobile ? () => setShowCreatePost(false) : undefined}
                    />
                  </Box>
                )}

                {/* Feed Content */}
                {tabLabels.map((_, index) => (
                  <TabPanel key={index} value={currentTab} index={index}>
                    {error && (
                      <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
                        {error}
                      </Alert>
                    )}

                    {loading && posts.length === 0 ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : posts.length === 0 ? (
                      <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                          No posts found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Be the first to share something in this category! 🚀
                        </Typography>
                      </Card>
                    ) : (
                      <Stack spacing={4}>
                        {posts.map((post, index) => (
                          <motion.div
                            key={post._id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ 
                              duration: 0.5, 
                              delay: index * 0.1,
                              ease: [0.25, 0.46, 0.45, 0.94]
                            }}
                            whileHover={{ 
                              y: -2,
                              transition: { duration: 0.2 }
                            }}
                          >
                            <Box
                              sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                background: theme.palette.mode === 'dark'
                                  ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                                  : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                backdropFilter: 'blur(20px)',
                                boxShadow: theme.palette.mode === 'dark'
                                  ? '0 8px 32px rgba(0,0,0,0.3)'
                                  : '0 8px 32px rgba(102, 126, 234, 0.08)',
                                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(102, 126, 234, 0.08)'}`,
                                position: 'relative',
                                '&::before': {
                                  content: '""',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '2px',
                                  background: 'linear-gradient(90deg, transparent 0%, rgba(102, 126, 234, 0.5) 50%, transparent 100%)',
                                },
                                '&:hover': {
                                  boxShadow: theme.palette.mode === 'dark'
                                    ? '0 12px 40px rgba(0,0,0,0.4)'
                                    : '0 12px 40px rgba(102, 126, 234, 0.12)',
                                  transform: 'translateY(-2px)',
                                  transition: 'all 0.3s ease',
                                }
                              }}
                            >
                              <PostCard
                                post={post}
                                onPostUpdate={handlePostUpdate}
                                onPostDelete={handlePostDelete}
                              />
                            </Box>
                          </motion.div>
                        ))}

                        {/* Enhanced Load More Button */}
                        {hasMore && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant="contained"
                                onClick={loadMorePosts}
                                disabled={loading}
                                sx={{
                                  borderRadius: 4,
                                  px: 6,
                                  py: 2,
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  fontSize: '1rem',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
                                  border: 'none',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                                    boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)',
                                    transform: 'translateY(-2px)',
                                  },
                                  '&:disabled': {
                                    background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                                    boxShadow: 'none',
                                  }
                                }}
                              >
                                {loading ? '🔄 Loading...' : '📜 Load More Posts'}
                              </Button>
                            </motion.div>
                          </Box>
                        )}
                      </Stack>
                    )}
                  </TabPanel>
                ))}
              </motion.div>
            </Grid>

            {/* Right Sidebar - Suggestions & Activities */}
            {!isMobile && !isTablet && (
              <Grid item xl={2.5} lg={3}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <FeedSidebar />
                </motion.div>
              </Grid>
            )}
          </Grid>

          {/* Enhanced Floating Action Buttons for Mobile */}
          {isMobile && (
            <Box
              sx={{
                position: 'fixed',
                bottom: 100,
                right: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                zIndex: 1000,
              }}
            >
              {!showCreatePost && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Fab
                    color="primary"
                    sx={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                      width: 64,
                      height: 64,
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                        boxShadow: '0 12px 35px rgba(102, 126, 234, 0.5)',
                        transform: 'translateY(-2px)',
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: 28,
                      }
                    }}
                    onClick={() => setShowCreatePost(true)}
                  >
                    <Add />
                  </Fab>
                </motion.div>
              )}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Fab
                  color="secondary"
                  size="medium"
                  sx={{
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    boxShadow: '0 6px 20px rgba(79, 172, 254, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                      boxShadow: '0 8px 25px rgba(79, 172, 254, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: 24,
                    }
                  }}
                  onClick={() => navigate('/app/messages')}
                >
                  <Chat />
                </Fab>
              </motion.div>
            </Box>
          )}
      </Container>
    </Box>
  );
};

export default SocialNetworkPage;
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  CardActions,
  LinearProgress,
  Tooltip,
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
  SmartToy,
  Quiz,
  RecordVoiceOver,
  LocationOn,
  AttachMoney,
  Schedule,
  BookmarkBorder,
  PersonAdd,
  AccountCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PostCard from '../components/social/PostCard';
import CreatePost from '../components/social/CreatePost';
import FeedSidebar from '../components/social/FeedSidebar';
import { SocialPost } from '../types/social';
import { socialNetworkService, FeedOptions } from '../services/socialNetworkService';
import { useAuth } from '../contexts/AuthContext';
import { jobService } from '../services/jobService';
import { profileService } from '../services/profileService';
import { userService } from '../services/userService';
import { User } from '../types/user';

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
  const [showMobileConnections, setShowMobileConnections] = useState(false);
  
  // Suggested connections state
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [connectingUsers, setConnectingUsers] = useState<string[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

  // Jobs state
  const [matchedJobs, setMatchedJobs] = useState<any[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState<any>(null);
  const [profileValidation, setProfileValidation] = useState<any>(null);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());

  // Load posts on component mount and when filter changes
  useEffect(() => {
    if (currentTab === 1) { // Job Posts tab
      loadMatchedJobs();
    } else {
      loadPosts(true);
    }
  }, [currentTab]);

  // Load profile completion and validation on mount
  useEffect(() => {
    loadProfileData();
  }, [user]);

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

  // Load profile completion and validation data
  const loadProfileData = async () => {
    if (!user?._id) return;

    try {
      console.log('🔍 SocialNetworkPage fetching fresh user data for:', user._id);
      // Fetch fresh user data from the server to get the most up-to-date profile
      const freshUser = await userService.getUserProfile(user._id);
      console.log('📋 SocialNetworkPage received fresh user data:', freshUser);
      
      // Use fresh user data for validation
      const validation = await profileService.validateUserProfile(freshUser as User);
      console.log('✅ Profile validation result:', validation);
      setProfileValidation(validation);

      const completion = await profileService.getProfileCompletionStatus();
      console.log('📊 Profile completion status:', completion);
      setProfileCompletion(completion);
    } catch (error) {
      console.error('❌ Error loading profile data:', error);
      // Fallback to using auth context user data
      try {
        const validation = await profileService.validateUserProfile(user as User);
        setProfileValidation(validation);
        
        const completion = await profileService.getProfileCompletionStatus();
        setProfileCompletion(completion);
      } catch (fallbackError) {
        console.error('❌ Fallback profile validation also failed:', fallbackError);
      }
    }
  };

  // Load AI-matched jobs based on user skills and profile
  const loadMatchedJobs = async () => {
    if (!user?._id) return;

    setJobsLoading(true);
    setError(null);

    try {
      console.log('🤖 Loading AI-matched jobs for user:', user._id);
      
      // Fetch fresh user data to get the most up-to-date profile
      const freshUser = await userService.getUserProfile(user._id);
      console.log('📋 Fresh user data for job matching:', freshUser);

      // Validate the fresh profile data
      const validation = await profileService.validateUserProfile(freshUser as User);
      console.log('✅ Profile validation for job matching:', validation);

      // Check if profile is complete enough for job matching
      if (!validation || validation.completionPercentage < 30) {
        console.log('⚠️ Profile not complete enough for job matching. Completion:', validation?.completionPercentage || 0, '%');
        setMatchedJobs([]);
        setJobsLoading(false);
        return;
      }

      // Get user skills for basic validation
      const userSkills = (freshUser as User).skills || [];
      const experienceSkills = ((freshUser as User).experience || [])
        .flatMap(exp => exp.technologies || [])
        .filter(tech => tech && tech.trim());
      const allSkills = [...userSkills, ...experienceSkills];

      console.log('🎯 User skills for matching:', allSkills);

      if (allSkills.length === 0) {
        console.log('⚠️ No skills found for job matching');
        setMatchedJobs([]);
        setJobsLoading(false);
        return;
      }

      // Use enhanced AI-powered job matching service
      console.log('🤖 Calling enhanced AI-powered job matching service...');
      const response = await jobService.getAIMatchedJobs();

      console.log('📋 Enhanced AI Job matching response:', response);
      console.log('✅ AI found', response.data?.length || 0, 'matched jobs');
      console.log('📊 Matching stats:', response.meta);

      setMatchedJobs(response.data);
    } catch (err: any) {
      console.error('❌ Error loading AI-matched jobs:', err);
      
      // If AI matching fails, fall back to basic skill matching
      console.log('🔄 Falling back to basic skill matching...');
      try {
        const freshUser = await userService.getUserProfile(user._id);
        const userSkills = (freshUser as User).skills || [];
        const technicalSkills = ((freshUser as User).technicalSkills || []).map(ts => ts.skill);
        const allSkills = [...userSkills, ...technicalSkills];

        if (allSkills.length > 0) {
          const fallbackResponse = await jobService.getJobs({
            skills: allSkills.slice(0, 10),
            status: 'active' as any
          }, 1, 15);

          if (fallbackResponse.success) {
            console.log('✅ Fallback found', fallbackResponse.data.length, 'matched jobs');
            setMatchedJobs(fallbackResponse.data);
          } else {
            throw new Error('Failed to load jobs with fallback method');
          }
        } else {
          setMatchedJobs([]);
        }
      } catch (fallbackErr: any) {
        console.error('❌ Fallback job matching also failed:', fallbackErr);
        setError(fallbackErr.response?.data?.error || fallbackErr.message || 'Failed to load matched jobs');
        setMatchedJobs([]);
      }
    } finally {
      setJobsLoading(false);
    }
  };

  // Handle job bookmark toggle
  const handleJobBookmark = async (jobId: string) => {
    const newBookmarks = new Set(bookmarkedJobs);
    if (bookmarkedJobs.has(jobId)) {
      newBookmarks.delete(jobId);
    } else {
      newBookmarks.add(jobId);
    }
    setBookmarkedJobs(newBookmarks);
    // Here you could add API call to save bookmark
  };

  // Handle job application
  const handleJobApply = (jobId: string) => {
    navigate(`/app/jobs/${jobId}`);
  };

  // Load suggested connections
  useEffect(() => {
    const loadSuggestedConnections = async () => {
      if (!user) return;
      
      setSuggestionsLoading(true);
      try {
        const response = await socialNetworkService.getSuggestedConnections();
        if (response.success) {
          setSuggestedUsers(response.data || []);
        }
      } catch (error) {
        console.error('Error loading suggested connections:', error);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    loadSuggestedConnections();
  }, [user]);

  // Handle connection request
  const handleConnect = async (userId: string) => {
    if (!user || connectingUsers.includes(userId)) return;

    setConnectingUsers(prev => [...prev, userId]);
    try {
      const response = await socialNetworkService.sendConnectionRequest(userId);
      if (response.success) {
        // Remove the connected user from suggestions
        setSuggestedUsers(prev => prev.filter(u => u._id !== userId));
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
    } finally {
      setConnectingUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const feedFilters: FeedOptions['filter'][] = ['all', 'jobs', 'people', 'training'];
  const tabLabels = ['All Posts', 'Job Posts', 'People', 'Training', 'Suggestions'];

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
      subtitle: 'Interviews • Smart Exams • Psychometric tests',
      icon: <Psychology sx={{ fontSize: 28 }} />,
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #f57c00 100%)',
      path: '/app/job-preparation',
      stats: '4+ Services',
      services: [ 'Interviews • Smart Exams • Psychometric tests '],
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
          py: { xs: 2, sm: 3, md: 3, lg: 4 },
          px: { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 },
          maxWidth: { 
            xs: '100%', 
            sm: '100%', 
            md: '1200px', 
            lg: '1500px',
            xl: '1700px' 
          },
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
            <Grid container spacing={{ xs: 2, sm: 3, md: 2, lg: 3, xl: 4 }}>
                {quickActions.map((action, index) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3, lg: 3, xl: 3 }} key={action.title}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 * index }}
                      whileHover={{ y: -5 }}
                    >
                      <Card
                        sx={{
                          height: '100%',
                          minHeight: { xs: '140px', sm: '160px', md: isTablet ? '140px' : '180px' },
                          borderRadius: { xs: 2, sm: 3, md: isTablet ? 2 : 3 },
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
                            width: { xs: 40, sm: 60, md: isTablet ? 40 : 60 },
                            height: { xs: 40, sm: 60, md: isTablet ? 40 : 60 },
                            background: `radial-gradient(circle, ${alpha('#fff', 0.2)} 0%, transparent 70%)`,
                            transform: { xs: 'translate(15px, -15px)', sm: 'translate(20px, -20px)', md: isTablet ? 'translate(15px, -15px)' : 'translate(20px, -20px)' },
                          },
                        }}
                        onClick={() => navigate(action.path)}
                      >
                        <CardContent sx={{ 
                          p: { xs: 1.5, sm: 2.5, md: isTablet ? 2 : 3 }, 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column' 
                        }}>
                          <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start', 
                            mb: { xs: 1, sm: 1.5, md: isTablet ? 1 : 1.5 } 
                          }}>
                            <Box
                              sx={{
                                background: alpha('#fff', 0.2),
                                borderRadius: { xs: 1.5, sm: 2, md: isTablet ? 1.5 : 2 },
                                p: { xs: 0.75, sm: 1, md: isTablet ? 0.75 : 1 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {React.cloneElement(action.icon, { 
                                sx: { fontSize: { xs: 24, sm: 28, md: isTablet ? 22 : 28 } } 
                              })}
                            </Box>
                            <ArrowForward 
                              className="action-arrow"
                              sx={{ 
                                fontSize: { xs: 18, sm: 20, md: isTablet ? 16 : 20 },
                                transition: 'transform 0.3s ease',
                                opacity: 0.8,
                              }} 
                            />
                          </Box>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography 
                              variant="h6" 
                              fontWeight="700" 
                              sx={{ 
                                mb: isTablet ? 0.25 : 0.5, 
                                fontSize: { xs: '1rem', sm: '1.1rem', md: isTablet ? '0.95rem' : '1.25rem' },
                                lineHeight: isTablet ? 1.2 : 1.3
                              }}
                            >
                              {action.title}
                            </Typography>
                            {action.title === 'Get Prepared' ? (
                              <Box sx={{ mb: { xs: 1, sm: 1.5, md: isTablet ? 1 : 2 } }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    opacity: 0.9, 
                                    fontSize: { xs: '0.7rem', sm: '0.75rem', md: isTablet ? '0.7rem' : '0.8rem' },
                                    lineHeight: 1.4,
                                    textAlign: 'center',
                                    fontWeight: 500,
                                  }}
                                >
                                  🎯 AI Interviews • 🧠 Smart Tests<br/>
                                  📊 Psychometric • 🎤 Mock Prep
                                </Typography>
                              </Box>
                            ) : (
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  opacity: 0.9, 
                                  mb: { xs: 1, sm: 1.5, md: isTablet ? 1 : 2 },
                                  fontSize: { xs: '0.8rem', sm: '0.875rem', md: isTablet ? '0.75rem' : '0.875rem' },
                                  lineHeight: isTablet ? 1.2 : 1.4
                                }}
                              >
                                {action.subtitle}
                              </Typography>
                            )}
                            <Chip
                              label={action.stats}
                              size={isMobile ? "small" : "small"}
                              sx={{
                                bgcolor: alpha('#fff', 0.2),
                                color: 'white',
                                border: `1px solid ${alpha('#fff', 0.3)}`,
                                fontWeight: 600,
                                fontSize: { xs: '0.7rem', sm: '0.75rem', md: isTablet ? '0.65rem' : '0.75rem' },
                                height: { xs: 24, sm: 28, md: isTablet ? 22 : 28 },
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

          {/* Main Content Grid - Balanced Layout */}
          <Grid container spacing={{ xs: 2, sm: 3, md: 2, lg: 3, xl: 4 }}>
            {/* Left Sidebar - Hide only on mobile */}
            {!isMobile && (
              <Grid size={{ xl: 3, lg: 3, md: 3 }}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Stack spacing={isTablet ? 2 : 3}>
                    {/* Profile Quick View */}
                    <Card sx={{ borderRadius: isTablet ? 2 : 3 }}>
                      <CardContent sx={{ p: isTablet ? 3 : 5 }}>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                          <Avatar
                            sx={{
                              width: isTablet ? 50 : 60,
                              height: isTablet ? 50 : 60,
                              mx: 'auto',
                              mb: 1,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }}
                          >
                            {user?.firstName?.[0] || 'U'}
                          </Avatar>
                          <Typography variant={isTablet ? "subtitle1" : "h6"} fontWeight="600">
                            {user?.firstName} {user?.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: isTablet ? '0.8rem' : '0.875rem' }}>
                            {user?.profession || 'Professional'}
                          </Typography>
                        </Box>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={() => navigate('/app/profile')}
                          sx={{ borderRadius: 2, fontSize: isTablet ? '0.75rem' : '0.875rem' }}
                          size={isTablet ? "small" : "medium"}
                        >
                          View Profile
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Trending Topics */}
                    <Card sx={{ borderRadius: isTablet ? 2 : 3 }}>
                      <CardContent sx={{ p: isTablet ? 3 : 5 }}>
                        <Typography variant={isTablet ? "subtitle1" : "h6"} fontWeight="600" sx={{ mb: isTablet ? 2 : 3 }}>
                          Trending Today
                        </Typography>
                        <Stack spacing={isTablet ? 2 : 3}>
                          {[
                            { topic: '#RemoteWork', posts: '2.4k posts' },
                            { topic: '#AI Jobs', posts: '1.8k posts' },
                            { topic: '#SkillDevelopment', posts: '956 posts' },
                            { topic: '#Networking', posts: '743 posts' },
                          ].map((trend, index) => (
                            <Box key={trend.topic} sx={{ cursor: 'pointer' }}>
                              <Typography variant="body2" fontWeight="600" color="primary" sx={{ fontSize: isTablet ? '0.8rem' : '0.875rem' }}>
                                {trend.topic}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: isTablet ? '0.7rem' : '0.75rem' }}>
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

            {/* Center Feed - Optimized sizing for better post viewing */}
            <Grid size={{ 
              xs: 12, 
              sm: 12, 
              md: 6, 
              lg: 5, 
              xl: 6 
            }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                {/* Enhanced Navigation Tabs - Responsive */}
                <Card 
                  sx={{ 
                    mb: { xs: 2, sm: 2, md: 3, lg: 4 }, 
                    borderRadius: { xs: 2, md: 3 },
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 4px 16px rgba(0,0,0,0.3)'
                      : '0 4px 16px rgba(102, 126, 234, 0.1)',
                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(102, 126, 234, 0.1)'}`,
                    overflow: 'hidden',
                    position: 'relative',
                    mx: { xs: 0, sm: 'auto' },
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
                    variant="scrollable"
                    scrollButtons="auto"
                    allowScrollButtonsMobile
                    sx={{
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontWeight: 600,
                        py: { xs: 1.5, md: 2 },
                        px: { xs: 1, md: 2 },
                        fontSize: { xs: '0.85rem', md: '0.95rem' },
                        minWidth: { xs: 'auto', md: 90 },
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
                      '& .MuiTabs-scrollButtons': {
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    {tabLabels.map((label, index) => (
                      <Tab key={index} label={label} />
                    ))}
                  </Tabs>
                </Card>

                {/* Create Post Section - Responsive */}
                {(showCreatePost || !isMobile) && (
                  <Box sx={{ mb: { xs: 2, sm: 2, md: 3 }, mx: { xs: 0, sm: 'auto' } }}>
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

                    {index === 1 ? (
                      // Job Posts Tab - Show matched jobs
                      <>
                        {!profileValidation || profileValidation.completionPercentage < 30 ? (
                          <Card sx={{ 
                            p: 4, 
                            textAlign: 'center', 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.05) 0%, rgba(255, 193, 7, 0.05) 100%)',
                            border: '1px solid rgba(255, 152, 0, 0.2)'
                          }}>
                            <Avatar sx={{ 
                              width: 64, 
                              height: 64, 
                              mx: 'auto', 
                              mb: 2,
                              bgcolor: 'warning.main'
                            }}>
                              <AccountCircle sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                              Complete Your Profile to See Matched Jobs
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                              We need to know more about your skills and experience to show you jobs that fit your profile perfectly.
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                              Profile Completion: {profileValidation?.completionPercentage || 0}% 
                              (Minimum 30% required)
                            </Typography>
                            <Button 
                              variant="contained" 
                              startIcon={<PersonAdd />}
                              onClick={() => navigate('/app/profile')}
                              sx={{
                                borderRadius: 3,
                                px: 4,
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 'bold',
                                background: 'linear-gradient(135deg, #FF9800 0%, #FF5722 100%)',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #F57C00 0%, #E64A19 100%)',
                                  transform: 'translateY(-2px)',
                                  boxShadow: '0 8px 25px rgba(255, 152, 0, 0.3)'
                                }
                              }}
                            >
                              Complete Profile
                            </Button>
                          </Card>
                        ) : jobsLoading ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                          </Box>
                        ) : matchedJobs.length === 0 ? (
                          <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                            <Work sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                              No Matched Jobs Found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                              We couldn't find jobs that match your current skills. Try updating your profile with more skills.
                            </Typography>
                            <Stack direction="row" spacing={2} justifyContent="center">
                              <Button 
                                variant="outlined" 
                                startIcon={<PersonAdd />}
                                onClick={() => navigate('/app/profile')}
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                              >
                                Update Profile
                              </Button>
                              <Button 
                                variant="contained" 
                                startIcon={<Search />}
                                onClick={() => navigate('/app/jobs')}
                                sx={{ 
                                  borderRadius: 2, 
                                  textTransform: 'none',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                }}
                              >
                                Browse All Jobs
                              </Button>
                            </Stack>
                          </Card>
                        ) : (
                          <Stack spacing={{ xs: 2, sm: 2.5, md: 3, lg: 3.5 }}>
                            {/* AI-powered job matching header */}
                            <Card sx={{ 
                              p: 2, 
                              borderRadius: 3,
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                              border: '1px solid rgba(102, 126, 234, 0.2)'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <SmartToy color="primary" sx={{ fontSize: 20 }} />
                                <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                                  AI-Powered Job Matching
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                Showing {matchedJobs.length} jobs intelligently matched to your profile using advanced AI analysis
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Your skills: {((user as User)?.skills || []).slice(0, 3).join(', ')}
                                {((user as User)?.skills?.length || 0) > 3 && ` +${((user as User)?.skills?.length || 0) - 3} more`}
                              </Typography>
                            </Card>

                            {matchedJobs.map((job, index) => (
                              <motion.div
                                key={job._id}
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
                                <Card
                                  sx={{
                                    borderRadius: { xs: 2, sm: 3, md: 3, lg: 4 },
                                    overflow: 'hidden',
                                    background: theme.palette.mode === 'dark'
                                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                                      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: theme.palette.mode === 'dark'
                                      ? { xs: '0 4px 16px rgba(0,0,0,0.2)', sm: '0 6px 24px rgba(0,0,0,0.25)', md: '0 8px 32px rgba(0,0,0,0.3)' }
                                      : { xs: '0 4px 16px rgba(102, 126, 234, 0.06)', sm: '0 6px 24px rgba(102, 126, 234, 0.07)', md: '0 8px 32px rgba(102, 126, 234, 0.08)' },
                                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(102, 126, 234, 0.08)'}`,
                                    position: 'relative',
                                    cursor: 'pointer',
                                    '&:hover': {
                                      boxShadow: theme.palette.mode === 'dark'
                                        ? '0 12px 40px rgba(0,0,0,0.4)'
                                        : '0 12px 40px rgba(102, 126, 234, 0.12)',
                                      transform: 'translateY(-2px)',
                                      transition: 'all 0.3s ease',
                                    }
                                  }}
                                  onClick={() => handleJobApply(job._id)}
                                >
                                  {/* AI Job match indicator */}
                                  <Box sx={{ position: 'relative' }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={job.matchPercentage || 75} 
                                      sx={{ 
                                        height: 4,
                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: job.matchPercentage >= 90 ? '#4CAF50' : 
                                                         job.matchPercentage >= 75 ? '#FF9800' : '#2196F3'
                                        }
                                      }}
                                    />
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        position: 'absolute',
                                        right: 8,
                                        top: -20,
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        color: job.matchPercentage >= 90 ? 'success.main' : 
                                               job.matchPercentage >= 75 ? 'warning.main' : 'primary.main'
                                      }}
                                    >
                                      🤖 {job.matchPercentage || 75}% AI Match
                                    </Typography>
                                  </Box>
                                  
                                  <CardContent sx={{ p: 3 }}>
                                    {/* Header with company and bookmark */}
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
                                        <Avatar 
                                          sx={{ 
                                            width: 48, 
                                            height: 48, 
                                            bgcolor: 'primary.main',
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          {job.company?.charAt(0) || 'J'}
                                        </Avatar>
                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                          <Typography variant="h6" sx={{ 
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            lineHeight: 1.2,
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                          }}>
                                            {job.title}
                                          </Typography>
                                          <Typography variant="body2" color="text.secondary">
                                            {job.company}
                                          </Typography>
                                        </Box>
                                      </Box>
                                      <Tooltip title={bookmarkedJobs.has(job._id) ? 'Remove bookmark' : 'Bookmark job'}>
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleJobBookmark(job._id);
                                          }}
                                        >
                                          {bookmarkedJobs.has(job._id) ? <Bookmark color="primary" /> : <BookmarkBorder />}
                                        </IconButton>
                                      </Tooltip>
                                    </Box>

                                    {/* Job details */}
                                    <Stack spacing={1} sx={{ mb: 2 }}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <LocationOn fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                          {job.location || 'Remote'}
                                        </Typography>
                                      </Box>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Schedule fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary">
                                          {job.type || 'Full-time'}
                                        </Typography>
                                      </Box>
                                      {job.salary && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          <AttachMoney fontSize="small" color="action" />
                                          <Typography variant="body2" color="text.secondary">
                                            {typeof job.salary === 'object' 
                                              ? `$${job.salary.min?.toLocaleString()} - $${job.salary.max?.toLocaleString()}`
                                              : `$${job.salary.toLocaleString()}`
                                            }
                                          </Typography>
                                        </Box>
                                      )}
                                    </Stack>

                                    {/* AI-powered Skills match */}
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                        🤖 AI Skills Analysis:
                                      </Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                        {/* Show AI-matched skills if available */}
                                        {(job.matchingSkills && job.matchingSkills.length > 0) ? (
                                          job.matchingSkills.slice(0, 4).map((skill: string, skillIndex: number) => (
                                            <Chip
                                              key={skillIndex}
                                              label={skill}
                                              size="small"
                                              color="success"
                                              variant="filled"
                                              icon={<SmartToy sx={{ fontSize: 14 }} />}
                                              sx={{ 
                                                fontSize: '0.7rem',
                                                height: 24,
                                                '& .MuiChip-label': {
                                                  px: 1
                                                },
                                                '& .MuiChip-icon': {
                                                  fontSize: 14,
                                                  marginLeft: 1
                                                }
                                              }}
                                            />
                                          ))
                                        ) : (
                                          // Fallback to required skills with basic matching
                                          job.requiredSkills?.slice(0, 3).map((skill: string, skillIndex: number) => {
                                            const userSkills = [...((user as User)?.skills || []), ...((user as User)?.technicalSkills?.map(ts => ts.skill) || [])];
                                            const isMatch = userSkills.some(userSkill => 
                                              userSkill.toLowerCase().includes(skill.toLowerCase()) ||
                                              skill.toLowerCase().includes(userSkill.toLowerCase())
                                            );
                                            
                                            return (
                                              <Chip
                                                key={skillIndex}
                                                label={skill}
                                                size="small"
                                                color={isMatch ? "primary" : "default"}
                                                variant={isMatch ? "filled" : "outlined"}
                                                sx={{ 
                                                  fontSize: '0.7rem',
                                                  height: 24,
                                                  '& .MuiChip-label': {
                                                    px: 1
                                                  }
                                                }}
                                              />
                                            );
                                          })
                                        )}
                                        {((job.matchingSkills?.length || job.requiredSkills?.length || 0) > 3) && (
                                          <Chip
                                            label={`+${((job.matchingSkills?.length || job.requiredSkills?.length || 0) - 3)} more`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ fontSize: '0.7rem', height: 24 }}
                                          />
                                        )}
                                      </Box>
                                      {/* AI recommendation reason */}
                                      {job.recommendationReason && (
                                        <Typography variant="caption" color="success.main" sx={{ fontStyle: 'italic' }}>
                                          ✨ {job.recommendationReason}
                                        </Typography>
                                      )}
                                    </Box>
                                  </CardContent>

                                  <CardActions sx={{ px: 3, pb: 2, pt: 0 }}>
                                    <Button
                                      variant="contained"
                                      startIcon={<ArrowForward />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleJobApply(job._id);
                                      }}
                                      sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        fontWeight: 'bold',
                                        flex: 1,
                                        background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                        '&:hover': {
                                          background: 'linear-gradient(135deg, #45a049 0%, #4CAF50 100%)',
                                          transform: 'translateY(-1px)',
                                          boxShadow: '0 6px 20px rgba(76, 175, 80, 0.3)'
                                        }
                                      }}
                                    >
                                      Apply Now
                                    </Button>
                                    <Button
                                      variant="outlined"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/app/jobs/${job._id}`);
                                      }}
                                      sx={{
                                        borderRadius: 2,
                                        textTransform: 'none',
                                        borderColor: 'primary.main',
                                        color: 'primary.main'
                                      }}
                                    >
                                      View Details
                                    </Button>
                                  </CardActions>
                                </Card>
                              </motion.div>
                            ))}
                          </Stack>
                        )}
                      </>
                    ) : (
                      // Regular posts for other tabs
                      <>
                        {(loading && posts.length === 0) || (index === 1 && jobsLoading) ? (
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
                          <Stack spacing={{ xs: 2, sm: 2.5, md: 3, lg: 3.5 }}>
                            {posts.map((post, postIndex) => (
                              <motion.div
                                key={post._id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ 
                                  duration: 0.5, 
                                  delay: postIndex * 0.1,
                                  ease: [0.25, 0.46, 0.45, 0.94]
                                }}
                                whileHover={{ 
                                  y: -2,
                                  transition: { duration: 0.2 }
                                }}
                              >
                                <Box
                                  sx={{
                                    borderRadius: { xs: 2, sm: 3, md: 3, lg: 4 },
                                    overflow: 'hidden',
                                    background: theme.palette.mode === 'dark'
                                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                                      : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                                    backdropFilter: 'blur(20px)',
                                    boxShadow: theme.palette.mode === 'dark'
                                      ? { xs: '0 4px 16px rgba(0,0,0,0.2)', sm: '0 6px 24px rgba(0,0,0,0.25)', md: '0 8px 32px rgba(0,0,0,0.3)' }
                                      : { xs: '0 4px 16px rgba(102, 126, 234, 0.06)', sm: '0 6px 24px rgba(102, 126, 234, 0.07)', md: '0 8px 32px rgba(102, 126, 234, 0.08)' },
                                    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(102, 126, 234, 0.08)'}`,
                                    position: 'relative',
                                    mx: { xs: 0, sm: 'auto' },
                                    maxWidth: '100%',
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
                            {hasMore && index !== 1 && (
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
                      </>
                    )}
                  </TabPanel>
                ))}
              </motion.div>
            </Grid>

            {/* Right Sidebar - Balanced for connections display */}
            {!isMobile && (
              <Grid size={{ xl: 3, lg: 4, md: 3 }}>
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
              
              {/* Suggested Connections Button for Mobile */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Fab
                  color="success"
                  size="medium"
                  sx={{
                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #45a049 0%, #4CAF50 100%)',
                      boxShadow: '0 8px 25px rgba(76, 175, 80, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: 22,
                    }
                  }}
                  onClick={() => setShowMobileConnections(true)}
                >
                  <People />
                </Fab>
              </motion.div>
            </Box>
          )}

          {/* Mobile Suggested Connections Modal */}
          <Dialog
            open={showMobileConnections}
            onClose={() => setShowMobileConnections(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{
              sx: {
                borderRadius: { xs: 0, sm: 3 },
                maxHeight: '80vh',
                margin: { xs: 0, sm: 2 },
                width: { xs: '100%', sm: 'auto' },
              }
            }}
          >
            <DialogTitle sx={{ 
              pb: 1,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <People />
              Suggested Connections
            </DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <List>
                {/* Show real suggested connections */}
                {suggestedUsers.slice(0, 5).map((connection, index) => (
                  <ListItem key={index} disablePadding>
                    <ListItemButton 
                      sx={{ 
                        py: 2,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.04)
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={connection.profilePicture || connection.avatar}
                          sx={{ 
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            width: 48,
                            height: 48
                          }}
                        >
                          {connection.firstName?.[0]}{connection.lastName?.[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="600">
                            {connection.firstName} {connection.lastName}
                          </Typography>
                        }
                        secondary={
                          <Stack spacing={0.5}>
                            <Typography variant="body2" color="text.secondary">
                              {(connection.jobTitle || connection.profession) && 
                                `${connection.jobTitle || connection.profession}${connection.company ? ` at ${connection.company}` : ''}`
                              }
                            </Typography>
                            {connection.mutualConnections > 0 && (
                              <Typography variant="caption" color="primary">
                                {connection.mutualConnections} mutual connections
                              </Typography>
                            )}
                          </Stack>
                        }
                      />
                      <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handleConnect(connection._id)}
                        disabled={connectingUsers.includes(connection._id)}
                        sx={{ 
                          borderRadius: 2,
                          textTransform: 'none',
                          minWidth: 'auto',
                          px: 2
                        }}
                      >
                        {connectingUsers.includes(connection._id) ? 'Connecting...' : 'Connect'}
                      </Button>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
              <Button 
                onClick={() => {
                  setShowMobileConnections(false);
                  navigate('/app/connections');
                }}
                variant="contained"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  flex: 1
                }}
              >
                View All Connections
              </Button>
              <Button 
                onClick={() => setShowMobileConnections(false)}
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  minWidth: 80
                }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
      </Container>
    </Box>
  );
};

export default SocialNetworkPage;
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
  alpha,
  Chip,
  Fab,
  AvatarGroup,
  styled,
  CardMedia,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Skeleton,
} from '@mui/material';
import {
  Add,
  Home,
  People,
  Bookmark,
  TrendingUp,
  Camera,
  VideoCall,
  Photo,
  Article,
  Poll,
  Event,
  LocationOn,
  MoreVert,
  Share,
  Comment,
  ThumbUp,
  Send,
  Close,
  Groups,
  PersonAdd,
  CameraAlt,
  VideoLibrary,
  EmojiEmotions,
  AttachFile,
  Public,
  AccessTime,
  Star,
  Verified,
  FavoriteBorder,
  Favorite,
  ShareOutlined,
  ChatBubbleOutline,
  MoreHoriz,
  AddCircleOutline,
  PlayCircleOutline,
  AccountCircle,
  Settings,
  Logout,
  WorkOutline,
  SchoolOutlined,
  PlaceOutlined,
  CalendarTodayOutlined,
  LinkOutlined,
  ExpandMore,
  ExpandLess,
  BusinessCenter,
  Assessment,
  QuestionAnswer,
  EmojiEvents,
  Psychology,
  Assignment,
  Build,
  TrendingUpOutlined,
  VolumeOff,
  VolumeUp,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SocialPost } from '../types/social';
import { formatDistanceToNow } from 'date-fns';
import { socialNetworkService } from '../services/socialNetworkService';
import CreateStory from '../components/social/CreateStory';
import StoryViewer from '../components/social/StoryViewer';
import { enhancedStoryService } from '../services/enhancedStoryService';

// Modern Instagram-like Post Card with improved sizing and layout

const InstagramPostCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: 12,
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 2px 8px rgba(0,0,0,0.15), 0 1px 3px rgba(0,0,0,0.2)' 
    : '0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.1)',
  border: theme.palette.mode === 'dark' 
    ? `1px solid ${alpha(theme.palette.divider, 0.08)}`
    : `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'column',
  
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 8px 25px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.3)' 
      : '0 8px 25px rgba(0,0,0,0.12), 0 4px 10px rgba(0,0,0,0.15)',
  },
  
  '& .MuiCardContent-root': {
    padding: 0,
    '&:last-child': {
      paddingBottom: 0,
    },
  },
}));

// Instagram-like content container
const PostContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
}));

// Post header styling
const PostHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(1.5, 2),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(2, 2.5),
  },
}));

// Post media container
const PostMediaContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  maxHeight: '500px',
  overflow: 'hidden',
  backgroundColor: theme.palette.mode === 'dark' ? '#0a0a0a' : '#fafafa',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  
  [theme.breakpoints.up('md')]: {
    maxHeight: '600px',
  },
}));

// Post text content
const PostTextContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(2, 2.5),
  },
  
  '& .MuiTypography-body1': {
    fontSize: '0.9rem',
    lineHeight: 1.5,
  },
}));

// Post actions (like, comment, share)
const PostActions = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1, 2),
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
  
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(1.5, 2.5),
  },
}));

// Legacy support - keeping UniversalPostCard for backwards compatibility
const UniversalPostCard = InstagramPostCard;

// Content wrapper for ensuring uniform content display
const PostContentWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0, // Allow flex shrinking
  
  '& .post-media-section': {
    flex: '0 0 auto', // Don't grow/shrink, but allow wrapping
    minHeight: '200px', // Minimum height for media section
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    
    [theme.breakpoints.down('md')]: {
      minHeight: '180px',
    },
    [theme.breakpoints.down('sm')]: {
      minHeight: '160px',
    },
  },
  
  '& .post-text-section': {
    flex: '1 1 auto', // Grow to fill available space
    minHeight: '120px', // Minimum height for text content
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    
    [theme.breakpoints.down('md')]: {
      minHeight: '100px',
    },
    [theme.breakpoints.down('sm')]: {
      minHeight: '80px',
    },
  },
}));

const SidebarCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(1.2),
  borderRadius: 16,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
  position: 'sticky',
  top: theme.spacing(8),
  boxShadow: theme.palette.mode === 'dark' 
    ? '0 4px 12px rgba(0,0,0,0.15)' 
    : '0 2px 8px rgba(0,0,0,0.08)',
  backdropFilter: 'blur(10px)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 6px 16px rgba(0,0,0,0.2)' 
      : '0 4px 12px rgba(0,0,0,0.12)',
  },
  '& .MuiCardContent-root': {
    padding: `${theme.spacing(1.2)} ${theme.spacing(1.5)}`,
    '&:last-child': {
      paddingBottom: theme.spacing(1.2),
    },
  },
}));

const StoryContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(2, 2, 1.5, 2),
  overflowX: 'auto',
  scrollBehavior: 'smooth',
  '&::-webkit-scrollbar': {
    height: 3,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.divider, 0.3),
    borderRadius: 2,
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
}));

const StoryCircle = styled(Box)(({ theme }) => ({
  width: 60,
  height: 60,
  borderRadius: '50%',
  background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
  padding: 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'transform 0.15s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
  '&.viewed': {
    background: `linear-gradient(45deg, ${alpha(theme.palette.text.secondary, 0.3)}, ${alpha(theme.palette.text.secondary, 0.5)})`,
  },
}));

const CreatePostButton = styled(Button)(({ theme }) => ({
  justifyContent: 'flex-start',
  borderRadius: 25,
  padding: '12px 20px',
  color: theme.palette.text.secondary,
  textTransform: 'none',
  fontSize: '1rem',
  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f0f2f5',
  border: 'none',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#e4e6ea',
    border: 'none',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
    transition: 'left 0.5s ease',
  },
  '&:hover::before': {
    left: '100%',
  },
}));

const FloatingCreateButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(10),
  right: theme.spacing(3),
  zIndex: 1000,
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
    transform: 'scale(1.05)',
  },
}));

const EngagementButton = styled(IconButton)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1, 2),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    transform: 'scale(1.02)',
  },
}));

const QuickActionCard = styled(Card)(({ theme }) => ({
  borderRadius: 20,
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  cursor: 'pointer',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  backdropFilter: 'blur(10px)',
  '&:hover': {
    transform: 'translateY(-6px) scale(1.02)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 12px 35px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.2)' 
      : '0 8px 30px rgba(0,0,0,0.12), 0 4px 15px rgba(0,0,0,0.08)',
    '& .action-icon': {
      transform: 'scale(1.15) rotate(5deg)',
    },
    '& .action-glow': {
      opacity: 0.1,
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
    borderRadius: '20px 20px 0 0',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
    borderRadius: 20,
  },
  '&:hover::after': {
    opacity: 1,
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 12,
  padding: theme.spacing(1.5, 2),
  textTransform: 'none',
  fontSize: '0.875rem',
  fontWeight: 600,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
    borderColor: theme.palette.primary.main,
    '& .MuiButton-startIcon': {
      transform: 'scale(1.2)',
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.1)}, transparent)`,
    transition: 'left 0.5s ease',
  },
  '&:hover::before': {
    left: '100%',
  },
}));

interface SocialNetworkPageProps {}

const SocialNetworkPage: React.FC<SocialNetworkPageProps> = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Responsive breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallTablet = useMediaQuery(theme.breakpoints.between('md', 'lg')); // 768px to 1200px
  const isLargeTablet = useMediaQuery(theme.breakpoints.between('lg', 'xl')); // 1200px to 1536px
  const isDesktop = useMediaQuery(theme.breakpoints.up('xl')); // 1536px+

  // State management
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [suggestedConnections, setSuggestedConnections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedTab, setSelectedTab] = useState('home');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  
  // Video modal state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{ url: string; title?: string } | null>(null);
  
  // Video playback state - Initialize all videos as muted for auto-play compatibility
  const [mutedVideos, setMutedVideos] = useState<Set<string>>(new Set());
  const [playingVideos, setPlayingVideos] = useState<Set<string>>(new Set());
  
  // Create post form state
  const [postContent, setPostContent] = useState('');
  const [postMedia, setPostMedia] = useState<File[]>([]);
  const [postTags, setPostTags] = useState<string>('');
  const [isPosting, setIsPosting] = useState(false);
  
  // Comment state
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  
  // Story state
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [storyViewerStories, setStoryViewerStories] = useState<any[]>([]);

  // Sample modern posts data
  const samplePosts: SocialPost[] = [
    {
      _id: '1',
      author: {
        _id: '1',
        firstName: 'Alexandra',
        lastName: 'Thompson',
        profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        jobTitle: 'Senior Product Designer at Meta',
      },
      content: '🎉 Thrilled to share that our design system update has improved user engagement by 40%! Here\'s what we learned:\n\n✨ Consistency builds trust\n🎯 User feedback is gold\n🚀 Iterate fast, learn faster\n\nSpecial thanks to our amazing team who made this possible. The future of design is collaborative! 💙\n\n#ProductDesign #DesignSystem #UserExperience #Meta #TeamWork',
      tags: ['ProductDesign', 'DesignSystem', 'UserExperience', 'Meta', 'TeamWork'],
      postType: 'text',
      media: [
        {
          type: 'video',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=280&h=720&fit=crop'
        }
      ],
      likes: ['1', '2', '3'],
      likesCount: 127,
      commentsCount: 23,
      sharesCount: 15,
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
        firstName: 'Marcus',
        lastName: 'Rodriguez',
        profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        jobTitle: 'Full Stack Developer at Google',
      },
      content: '🚀 Just deployed our new AI-powered recommendation engine! After 6 months of development, we\'ve achieved:\n\n📈 35% increase in user retention\n⚡ 50% faster response times\n🎯 90% accuracy in recommendations\n\nThe power of machine learning never ceases to amaze me. Excited to see how this impacts our users! 🔥\n\n#AI #MachineLearning #WebDevelopment #Google #Innovation',
      tags: ['AI', 'MachineLearning', 'WebDevelopment', 'Google', 'Innovation'],
      postType: 'text',
      media: [
        {
          type: 'video',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=280&h=720&fit=crop'
        },
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?w=280&h=360&fit=crop'
        },
        {
          type: 'video',
          url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
          thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=280&h=720&fit=crop'
        }
      ],
      likes: ['1', '2', '3', '4', '5'],
      likesCount: 89,
      commentsCount: 31,
      sharesCount: 22,
      visibility: 'public',
      isPinned: true,
      isPromoted: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      _id: '3',
      author: {
        _id: '3',
        firstName: 'Priya',
        lastName: 'Patel',
        profilePicture: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        jobTitle: 'Data Scientist at Netflix',
      },
      content: '📊 Fascinating insights from our latest user behavior analysis! Did you know that 73% of users prefer personalized content over generic recommendations?\n\nKey findings:\n• Personalization increases engagement by 2.5x\n• Users spend 40% more time on personalized feeds\n• Satisfaction scores jumped from 3.2 to 4.7\n\nData truly tells a story! 📈\n\n#DataScience #Analytics #Netflix #UserBehavior #Insights',
      tags: ['DataScience', 'Analytics', 'Netflix', 'UserBehavior', 'Insights'],
      postType: 'text',
      likes: ['1', '2'],
      likesCount: 156,
      commentsCount: 42,
      sharesCount: 38,
      visibility: 'public',
      isPinned: false,
      isPromoted: true,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: '4',
      author: {
        _id: '4',
        firstName: 'David',
        lastName: 'Kim',
        profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        jobTitle: 'UI/UX Designer at Adobe',
      },
      content: '🎨 Just finished designing a new mobile app interface! Love how clean and intuitive it turned out. Here\'s a sneak peek at the onboarding screens.\n\n#UIDesign #MobileApp #UserExperience',
      tags: ['UIDesign', 'MobileApp', 'UserExperience'],
      postType: 'text',
      media: [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=480&h=300&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=150&h=100&fit=crop'
        }
      ],
      likes: ['2', '3'],
      likesCount: 67,
      commentsCount: 18,
      sharesCount: 12,
      visibility: 'public',
      isPinned: false,
      isPromoted: false,
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      updatedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      _id: '5',
      author: {
        _id: '5',
        firstName: 'Lisa',
        lastName: 'Wang',
        profilePicture: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        jobTitle: 'Marketing Director at Spotify',
      },
      content: '🚀 Our team presentation went amazing today! Here are some highlights from our quarterly review. Exciting things ahead! 📈✨\n\n#TeamWork #Marketing #Growth',
      tags: ['TeamWork', 'Marketing', 'Growth'],
      postType: 'text',
      media: [
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=480&h=300&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1553484771-371a605b060b?w=150&h=100&fit=crop'
        },
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=480&h=300&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&h=100&fit=crop'
        },
        {
          type: 'image',
          url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=480&h=300&fit=crop',
          thumbnail: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=150&h=100&fit=crop'
        }
      ],
      likes: ['1', '3', '4'],
      likesCount: 94,
      commentsCount: 27,
      sharesCount: 19,
      visibility: 'public',
      isPinned: false,
      isPromoted: true,
      createdAt: new Date(Date.now() - 10800000).toISOString(),
      updatedAt: new Date(Date.now() - 10800000).toISOString(),
    },
  ];

  // Sample stories
  const sampleStories = [
    { id: 'add', type: 'add', user: user },
    { id: '1', type: 'story', user: { name: 'Alex Chen', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' }, hasViewed: false },
    { id: '2', type: 'story', user: { name: 'Sarah Kim', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150' }, hasViewed: true },
    { id: '3', type: 'story', user: { name: 'David Lee', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' }, hasViewed: false },
    { id: '4', type: 'story', user: { name: 'Emma Wilson', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150' }, hasViewed: false },
  ];

  // Sample trending topics
  const trendingTopics = [
    { topic: '#AI', posts: 12400, growth: '+15%' },
    { topic: '#WebDevelopment', posts: 8900, growth: '+8%' },
    { topic: '#DesignSystem', posts: 6540, growth: '+22%' },
    { topic: '#RemoteWork', posts: 4320, growth: '+5%' },
    { topic: '#TechCareers', posts: 3210, growth: '+12%' },
  ];

  useEffect(() => {
    loadFeed();
    loadStories();
    loadSuggestedConnections();
  }, []);

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading social network feed...');
      const feedData = await socialNetworkService.getFeed({
        page: 1,
        limit: 20,
        filter: selectedTab === 'home' ? 'all' : 'all'
      });
      
      console.log('✅ Feed loaded:', feedData);
      
      // Handle different response formats
      const postsData = Array.isArray(feedData) ? feedData : feedData.data || [];
      
      // If no real posts from backend, fall back to sample data for better UX
      if (postsData.length === 0) {
        console.log('📝 No posts from backend, showing sample posts');
        setPosts(samplePosts);
      } else {
        setPosts(postsData);
      }
      
    } catch (error) {
      console.error('❌ Error loading feed:', error);
      setError('Failed to load feed. Showing sample content.');
      // Fallback to sample posts in case of error
      setPosts(samplePosts);
    } finally {
      setLoading(false);
    }
  };

  const loadStories = async () => {
    setStoriesLoading(true);
    try {
      console.log('🔄 Loading stories...');
      const storiesData = await socialNetworkService.getStoriesFeed(1, 10);
      
      console.log('✅ Stories loaded:', storiesData);
      
      // Handle different response formats
      const storiesArray = Array.isArray(storiesData) ? storiesData : storiesData.data || [];
      
      // Combine with user's "Add story" option
      const storiesWithAdd = [
        { id: 'add', type: 'add', user: user },
        ...storiesArray.map((story: any) => ({
          id: story._id,
          type: 'story',
          user: {
            name: `${story.author?.firstName || 'User'} ${story.author?.lastName || ''}`.trim(),
            avatar: story.author?.profilePicture || null
          },
          hasViewed: false, // TODO: Track viewed stories
          story: story
        }))
      ];
      
      setStories(storiesWithAdd);
      
    } catch (error) {
      console.error('❌ Error loading stories:', error);
      // Fallback to sample stories
      setStories(sampleStories);
    } finally {
      setStoriesLoading(false);
    }
  };

  const loadSuggestedConnections = async () => {
    setConnectionsLoading(true);
    try {
      console.log('🔄 Loading suggested connections...');
      const connectionsData = await socialNetworkService.getConnectionSuggestions(5);
      
      console.log('✅ Suggested connections loaded:', connectionsData);
      
      // Handle different response formats
      const connections = Array.isArray(connectionsData) ? connectionsData : connectionsData.data || [];
      
      setSuggestedConnections(connections.map((conn: any) => ({
        id: conn._id,
        name: `${conn.firstName} ${conn.lastName}`,
        title: conn.jobTitle || conn.company || 'Professional',
        avatar: conn.profilePicture,
        mutualConnections: conn.mutualConnections || 0
      })));
      
    } catch (error) {
      console.error('❌ Error loading suggested connections:', error);
      // Fallback to sample connections - Remove the const keyword
      setSuggestedConnections([
        { id: '1', name: 'Emily Chen', title: 'Senior Designer at Apple', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', mutualConnections: 12 },
        { id: '2', name: 'James Wilson', title: 'Product Manager at Microsoft', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', mutualConnections: 8 },
        { id: '3', name: 'Sofia Rodriguez', title: 'UX Researcher at Spotify', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', mutualConnections: 15 },
      ]);
    } finally {
      setConnectionsLoading(false);
    }
  };

  const handlePostLike = async (postId: string) => {
    try {
      // Optimistically update UI first
      const currentPost = posts.find(post => post._id === postId);
      const isLiked = currentPost?.likes.includes(user?._id || '');
      
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
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

      // Make API call
      console.log(`🔄 ${isLiked ? 'Unliking' : 'Liking'} post ${postId}...`);
      const result = await socialNetworkService.likePost(postId);
      console.log('✅ Like action result:', result);
      
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      
      // Revert optimistic update on error
      const isLiked = posts.find(post => post._id === postId)?.likes.includes(user?._id || '');
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            likes: isLiked 
              ? [...post.likes, user?._id || '']
              : post.likes.filter(id => id !== user?._id),
            likesCount: isLiked ? post.likesCount + 1 : post.likesCount - 1,
          };
        }
        return post;
      }));
      
      // Show error message
      setError('Failed to update post like. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handlePostShare = async (postId: string) => {
    try {
      // Optimistically update UI first
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            sharesCount: post.sharesCount + 1,
          };
        }
        return post;
      }));

      // Make API call
      console.log(`🔄 Sharing post ${postId}...`);
      const result = await socialNetworkService.sharePost(postId);
      console.log('✅ Share result:', result);
      
    } catch (error) {
      console.error('❌ Error sharing post:', error);
      
      // Revert optimistic update on error
      setPosts(prev => prev.map(post => {
        if (post._id === postId) {
          return {
            ...post,
            sharesCount: post.sharesCount - 1,
          };
        }
        return post;
      }));
      
      // Show error message
      setError('Failed to share post. Please try again.');
      setTimeout(() => setError(null), 3000);
    }
  };

  const togglePostExpansion = (postId: string) => {
    setExpandedPost(expandedPost === postId ? null : postId);
  };

  const handleVideoClick = (videoUrl: string, title?: string) => {
    setSelectedVideo({ url: videoUrl, title });
    setShowVideoModal(true);
  };

  const handleCloseVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideo(null);
  };

  // Story handlers
  const handleStoryClick = (story: any, index: number) => {
    if (story.type === 'add') {
      setShowCreateStory(true);
    } else {
      // Filter out the "add story" option for viewer
      const actualStories = stories.filter(s => s.type !== 'add').map(s => s.story);
      setStoryViewerStories(actualStories);
      setSelectedStoryIndex(index - 1); // Adjust index since we're removing the "add" story
      setShowStoryViewer(true);
    }
  };

  const handleStoryCreated = (newStory: any) => {
    console.log('New story created:', newStory);
    // Reload stories to include the new one
    loadStories();
  };

  const handleCloseStoryViewer = () => {
    setShowStoryViewer(false);
    setStoryViewerStories([]);
    setSelectedStoryIndex(0);
  };

  const handleCommentClick = (postId: string) => {
    setSelectedPostId(postId);
    setShowCommentDialog(true);
  };

  const handleCloseCommentDialog = () => {
    setShowCommentDialog(false);
    setSelectedPostId(null);
    setCommentContent('');
  };

  const handleAddComment = async () => {
    if (!commentContent.trim() || !selectedPostId || !user) return;

    setIsCommenting(true);
    try {
      // Optimistically update UI first
      setPosts(prev => prev.map(post => {
        if (post._id === selectedPostId) {
          return {
            ...post,
            commentsCount: post.commentsCount + 1,
          };
        }
        return post;
      }));

      // Make API call
      console.log(`🔄 Adding comment to post ${selectedPostId}...`);
      const result = await socialNetworkService.addComment(selectedPostId, commentContent.trim());
      console.log('✅ Comment added:', result);
      
      // Close dialog and reset
      handleCloseCommentDialog();
      
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      
      // Revert optimistic update on error
      setPosts(prev => prev.map(post => {
        if (post._id === selectedPostId) {
          return {
            ...post,
            commentsCount: post.commentsCount - 1,
          };
        }
        return post;
      }));
      
      // Show error message
      setError('Failed to add comment. Please try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsCommenting(false);
    }
  };

  const handleTabChange = (newTab: string) => {
    setSelectedTab(newTab);
    // Reload feed when tab changes to apply filter
    loadFeed();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setPostMedia(prevFiles => [...prevFiles, ...files]);
  };

  const removeMedia = (index: number) => {
    setPostMedia(prev => prev.filter((_, i) => i !== index));
  };

  // Video control functions
  const toggleVideoMute = (videoId: string) => {
    const videoElement = document.querySelector(`video[data-video-id="${videoId}"]`) as HTMLVideoElement;
    
    setMutedVideos(prev => {
      const newSet = new Set(prev);
      const willBeMuted = !newSet.has(videoId);
      
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      
      // Update the actual video element
      if (videoElement) {
        videoElement.muted = willBeMuted;
      }
      
      return newSet;
    });
  };

  const handleVideoIntersection = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      const videoElement = entry.target as HTMLVideoElement;
      const videoId = videoElement.dataset.videoId;
      
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        // Video is in view, start playing
        if (videoId) {
          setPlayingVideos(prev => new Set(prev).add(videoId));
          
          // Ensure video is muted for auto-play (browsers require this)
          const shouldBeMuted = mutedVideos.has(videoId);
          videoElement.muted = shouldBeMuted;
          
          videoElement.play().catch((error) => {
            console.log('Auto-play failed for video:', videoId, error);
            // If auto-play fails, try with muted
            if (!videoElement.muted) {
              videoElement.muted = true;
              setMutedVideos(prev => new Set(prev).add(videoId));
              videoElement.play().catch(() => {
                console.log('Auto-play failed even with mute for video:', videoId);
              });
            }
          });
        }
      } else {
        // Video is out of view, pause it
        if (videoId) {
          setPlayingVideos(prev => {
            const newSet = new Set(prev);
            newSet.delete(videoId);
            return newSet;
          });
          videoElement.pause();
        }
      }
    });
  };

  // Initialize video muting when posts change (but preserve existing mute states)
  useEffect(() => {
    const allVideoIds = new Set<string>();
    posts.forEach(post => {
      post.media?.forEach((media, index) => {
        if (media.type === 'video') {
          allVideoIds.add(`${post._id}-${index}`);
        }
      });
    });
    
    // Only add new video IDs to mutedVideos, don't reset existing ones
    setMutedVideos(prevMuted => {
      const updatedMuted = new Set(prevMuted);
      allVideoIds.forEach(videoId => {
        // Only add if it's not already in the set (new videos should be muted by default)
        if (!prevMuted.has(videoId)) {
          updatedMuted.add(videoId);
        }
      });
      
      // Remove video IDs that no longer exist in posts
      const currentVideoIds = Array.from(updatedMuted).filter(videoId => allVideoIds.has(videoId));
      return new Set(currentVideoIds);
    });
  }, [posts]);

  // Set up intersection observer for auto-play
  useEffect(() => {
    const observer = new IntersectionObserver(handleVideoIntersection, {
      threshold: 0.5, // Trigger when 50% of video is visible
      rootMargin: '0px 0px -10% 0px' // Start slightly before coming into view
    });

    // Observe all video elements
    const videoElements = document.querySelectorAll('video[data-video-id]');
    videoElements.forEach(video => observer.observe(video));

    return () => {
      observer.disconnect();
    };
  }, [posts]); // Re-run when posts change

  const handleCreatePost = async () => {
    if (!postContent.trim() && postMedia.length === 0) {
      setError('Please add content or media to your post.');
      return;
    }

    setIsPosting(true);
    try {
      console.log('🔄 Creating new post...', {
        content: postContent,
        mediaCount: postMedia.length,
        tags: postTags
      });

      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('content', postContent);
      formData.append('postType', 'text');
      formData.append('visibility', 'public');
      
      // Add tags if provided
      if (postTags.trim()) {
        const tagArray = postTags.split(',').map(tag => tag.trim()).filter(tag => tag);
        tagArray.forEach(tag => formData.append('tags[]', tag));
      }

      // Add media files
      postMedia.forEach((file) => {
        formData.append('media', file);
      });

      const newPost = await socialNetworkService.createPostWithMedia(formData);
      console.log('✅ Post created successfully:', newPost);

      // Add the new post to the beginning of the feed
      setPosts(prev => [newPost, ...prev]);

      // Reset form state
      setPostContent('');
      setPostMedia([]);
      setPostTags('');
      setShowCreatePost(false);

      // Show success message
      setError(null);

    } catch (error) {
      console.error('❌ Error creating post:', error);
      setError('Failed to create post. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsPosting(false);
    }
  };



  // Enhanced Quick Actions
  const quickActionsData = [
    {
      id: 'find-jobs',
      title: 'Find Jobs',
      description: 'Discover opportunities',
      icon: BusinessCenter,
      color: '#1976d2',
      gradient: 'linear-gradient(135deg, #1976d2, #42a5f5)',
      route: '/jobs',
    },
    {
      id: 'interview',
      title: 'Interview Prep',
      description: 'Practice & improve',
      icon: QuestionAnswer,
      color: '#9c27b0',
      gradient: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
      route: '/interview-prep',
    },
    {
      id: 'smart-exams',
      title: 'Smart Exams',
      description: 'Test your skills',
      icon: Psychology,
      color: '#f57c00',
      gradient: 'linear-gradient(135deg, #f57c00, #ffb74d)',
      route: '/exams',
    },
    {
      id: 'cv-builder',
      title: 'CV Builder',
      description: 'Create stunning CV',
      icon: Assignment,
      color: '#388e3c',
      gradient: 'linear-gradient(135deg, #388e3c, #66bb6a)',
      route: '/cv-builder',
    },
    {
      id: 'skill-assessment',
      title: 'Skills Test',
      description: 'Evaluate abilities',
      icon: Assessment,
      color: '#d32f2f',
      gradient: 'linear-gradient(135deg, #d32f2f, #f44336)',
      route: '/skills-assessment',
    },
    {
      id: 'achievements',
      title: 'Achievements',
      description: 'Track progress',
      icon: EmojiEvents,
      color: '#f9a825',
      gradient: 'linear-gradient(135deg, #f9a825, #fdd835)',
      route: '/achievements',
    },
  ];

  const renderEnhancedQuickActions = () => (
    <UniversalPostCard sx={{ mb: 2 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Enhanced Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }} />
            <Typography variant="h5" fontWeight={700} sx={{ 
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.4rem',
            }}>
              Quick Actions
            </Typography>
          </Box>
          <Box sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            background: alpha(theme.palette.primary.main, 0.1),
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}>
            <TrendingUpOutlined sx={{ color: 'primary.main', fontSize: 18 }} />
            <Typography variant="caption" fontWeight={600} color="primary.main">
              Popular
            </Typography>
          </Box>
        </Box>
        
        {/* Enhanced Grid Layout */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
          gap: 2 
        }}>
          {quickActionsData.map((action, index) => (
            <Box key={action.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <QuickActionCard
                  onClick={() => navigate(action.route)}
                  sx={{ 
                    height: '100%',
                    minHeight: 120,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    '&:hover': {
                      '& .action-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                      },
                      '& .action-glow': {
                        opacity: 1,
                      }
                    }
                  }}
                >
                  {/* Background Glow Effect */}
                  <Box className="action-glow" sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: action.gradient,
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    zIndex: 0,
                  }} />
                  
                  <CardContent sx={{ 
                    textAlign: 'center', 
                    p: 2, 
                    position: 'relative',
                    zIndex: 1,
                    '&:last-child': { pb: 2 } 
                  }}>
                    <Box
                      className="action-icon"
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: action.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1.5,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: `0 4px 12px ${alpha(action.color, 0.3)}`,
                      }}
                    >
                      <action.icon sx={{ fontSize: 24, color: 'white' }} />
                    </Box>
                    <Typography variant="body2" fontWeight={700} sx={{ 
                      fontSize: '0.85rem', 
                      mb: 0.5,
                      color: 'text.primary',
                      lineHeight: 1.2,
                    }}>
                      {action.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ 
                      fontSize: '0.7rem',
                      lineHeight: 1.3,
                      display: 'block',
                    }}>
                      {action.description}
                    </Typography>
                  </CardContent>
                </QuickActionCard>
              </motion.div>
            </Box>
          ))}
        </Box>

        {/* Enhanced Divider */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          my: 3,
          '&::before, &::after': {
            content: '""',
            flex: 1,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.3)}, transparent)`,
          }
        }}>
          <Typography variant="caption" sx={{ 
            px: 2, 
            color: 'text.secondary',
            fontWeight: 500,
            fontSize: '0.75rem',
          }}>
            More Tools
          </Typography>
        </Box>
        
        {/* Enhanced Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
          <ActionButton
            size="medium"
            startIcon={<Build sx={{ fontSize: 20 }} />}
            onClick={() => navigate('/tools')}
            sx={{ 
              flex: 1, 
              minWidth: 140,
              py: 1.5,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`,
                transform: 'translateY(-2px)',
              }
            }}
          >
            Career Tools
          </ActionButton>
          <ActionButton
            size="medium"
            startIcon={<Groups sx={{ fontSize: 20 }} />}
            onClick={() => navigate('/networking')}
            sx={{ 
              flex: 1, 
              minWidth: 140,
              py: 1.5,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
              color: 'white',
              fontWeight: 600,
              fontSize: '0.9rem',
              boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(135deg, ${theme.palette.secondary.dark}, ${theme.palette.secondary.main})`,
                boxShadow: `0 6px 16px ${alpha(theme.palette.secondary.main, 0.4)}`,
                transform: 'translateY(-2px)',
              }
            }}
          >
            Network
          </ActionButton>
        </Stack>
      </CardContent>
    </UniversalPostCard>
  );

  const renderStories = () => (
    <UniversalPostCard sx={{ mb: 2 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Enhanced Stories Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
            }} />
            <Typography variant="h6" fontWeight={700} sx={{ 
              background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.2rem',
            }}>
              Stories
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            {stories.length - 1} stories
          </Typography>
        </Box>
        
        <StoryContainer sx={{ px: 0 }}>
          {storiesLoading ? (
            // Enhanced loading skeleton for stories
            Array.from({ length: 5 }).map((_, index) => (
              <Box key={`skeleton-${index}`} sx={{ textAlign: 'center' }}>
                <Skeleton 
                  variant="circular" 
                  width={80} 
                  height={80} 
                  sx={{ 
                    borderRadius: '50%',
                    background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
                    padding: 2,
                  }} 
                />
                <Skeleton variant="text" width={60} height={16} sx={{ mt: 0.5 }} />
              </Box>
            ))
          ) : (
            stories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Box sx={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => handleStoryClick(story, index)}>
                  <StoryCircle className={story.hasViewed ? 'viewed' : ''}>
                    {story.type === 'add' ? (
                      <Avatar sx={{ 
                        width: 56, 
                        height: 56, 
                        bgcolor: 'background.paper',
                        border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          borderColor: theme.palette.primary.main,
                        }
                      }}>
                        <Add sx={{ color: 'primary.main', fontSize: 24 }} />
                      </Avatar>
                    ) : (
                      <Avatar 
                        src={story.user.avatar}
                        sx={{ 
                          width: 56, 
                          height: 56,
                          opacity: story.hasViewed ? 0.6 : 1,
                          border: story.hasViewed ? 'none' : `2px solid ${alpha('#f09433', 0.3)}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            opacity: 1,
                          }
                        }}
                      >
                        {story.user.name ? story.user.name.charAt(0).toUpperCase() : 'U'}
                      </Avatar>
                    )}
                  </StoryCircle>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      mt: 0.5, 
                      display: 'block',
                      fontWeight: story.type === 'add' ? 600 : 500,
                      color: story.type === 'add' ? 'primary.main' : 'text.secondary',
                      fontSize: '0.75rem',
                    }}
                  >
                    {story.type === 'add' ? 'Your story' : (story.user.name ? story.user.name.split(' ')[0] : 'User')}
                  </Typography>
                </Box>
              </motion.div>
            ))
          )}
        </StoryContainer>
      </CardContent>
    </UniversalPostCard>
  );

  const renderCreatePost = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <UniversalPostCard sx={{ mb: 2 }}>
        <CardContent sx={{ 
          p: { xs: 2, sm: 2.5, md: 3 },
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 4px 20px rgba(0,0,0,0.15)' 
            : '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          {/* Enhanced Post Composer Header */}
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1.5, sm: 2 }, 
            alignItems: 'center', 
            mb: { xs: 2, sm: 2.5 } 
          }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Avatar 
                src={(user as any)?.profilePicture || undefined}
                sx={{ 
                  width: { xs: 40, sm: 44, md: 48 }, 
                  height: { xs: 40, sm: 44, md: 48 },
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                  cursor: 'pointer',
                }}
              >
                {user?.firstName?.charAt(0)}
              </Avatar>
            </motion.div>
            <Box sx={{ flex: 1 }}>
              <CreatePostButton
                variant="outlined"
                fullWidth
                onClick={() => setShowCreatePost(true)}
                sx={{
                  borderRadius: { xs: 2.5, sm: 3 },
                  py: { xs: 1.2, sm: 1.5 },
                  px: { xs: 1.5, sm: 2 },
                  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f8f9fa',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 500,
                  color: 'text.secondary',
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#e9ecef',
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    transform: 'translateY(-2px)',
                    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  }
                }}
              >
                What's on your mind, {user?.firstName}?
              </CreatePostButton>
            </Box>
          </Box>
          
          {/* Enhanced Divider */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            my: { xs: 2, sm: 2.5 },
            '&::before, &::after': {
              content: '""',
              flex: 1,
              height: 1,
              background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.divider, 0.2)}, transparent)`,
            }
          }}>
            <Typography variant="caption" sx={{ 
              px: 2, 
              color: 'text.secondary',
              fontWeight: 600,
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Share
            </Typography>
          </Box>
          
          {/* Enhanced Responsive Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'space-between', sm: 'space-around' },
            gap: { xs: 0.5, sm: 1 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
          }}>
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                startIcon={<VideoLibrary sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
                sx={{ 
                  textTransform: 'none', 
                  color: 'text.secondary', 
                  borderRadius: { xs: 2.5, sm: 3 },
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.8, sm: 1 },
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  backgroundColor: alpha('#f02849', 0.05),
                  border: `1px solid ${alpha('#f02849', 0.1)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { xs: 'auto', sm: 120 },
                  '&:hover': {
                    backgroundColor: alpha('#f02849', 0.1),
                    borderColor: alpha('#f02849', 0.2),
                    transform: 'translateY(-2px)',
                    color: '#f02849',
                    boxShadow: `0 4px 12px ${alpha('#f02849', 0.2)}`,
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  }
                }}
                onClick={() => setShowCreatePost(true)}
              >
                <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Live video</Box>
                <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Live</Box>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                startIcon={<Photo sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
                sx={{ 
                  textTransform: 'none', 
                  color: 'text.secondary', 
                  borderRadius: { xs: 2.5, sm: 3 },
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.8, sm: 1 },
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  backgroundColor: alpha('#45bd62', 0.05),
                  border: `1px solid ${alpha('#45bd62', 0.1)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { xs: 'auto', sm: 120 },
                  '&:hover': {
                    backgroundColor: alpha('#45bd62', 0.1),
                    borderColor: alpha('#45bd62', 0.2),
                    transform: 'translateY(-2px)',
                    color: '#45bd62',
                    boxShadow: `0 4px 12px ${alpha('#45bd62', 0.2)}`,
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  }
                }}
                onClick={() => setShowCreatePost(true)}
              >
                <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Photo/video</Box>
                <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Photo</Box>
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                startIcon={<EmojiEmotions sx={{ fontSize: { xs: 18, sm: 20 } }} />} 
                sx={{ 
                  textTransform: 'none', 
                  color: 'text.secondary', 
                  borderRadius: { xs: 2.5, sm: 3 },
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.8, sm: 1 },
                  fontWeight: 600,
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  backgroundColor: alpha('#f7b928', 0.05),
                  border: `1px solid ${alpha('#f7b928', 0.1)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { xs: 'auto', sm: 120 },
                  '&:hover': {
                    backgroundColor: alpha('#f7b928', 0.1),
                    borderColor: alpha('#f7b928', 0.2),
                    transform: 'translateY(-2px)',
                    color: '#f7b928',
                    boxShadow: `0 4px 12px ${alpha('#f7b928', 0.2)}`,
                  },
                  '&:active': {
                    transform: 'translateY(0px)',
                  }
                }}
                onClick={() => setShowCreatePost(true)}
              >
                <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>Feeling/activity</Box>
                <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>Feeling</Box>
              </Button>
            </motion.div>
          </Box>
        </CardContent>
      </UniversalPostCard>
    </motion.div>
  );

  // Helper function to check if post contains video content
  const hasVideoContent = (post: SocialPost): boolean => {
    return post.media && post.media.some(media => media.type === 'video');
  };

  const renderPost = (post: SocialPost) => {
    const isLiked = post.likes.includes(user?._id || '');
    const isExpanded = expandedPost === post._id;
    const shouldTruncate = post.content.length > 280; // Instagram-like truncation length
    const displayContent = isExpanded || !shouldTruncate 
      ? post.content 
      : post.content.substring(0, 280) + '...';

    const isVideoPost = hasVideoContent(post);

    return (
      <motion.div
        key={post._id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <InstagramPostCard data-testid="post-card">
          <PostContentContainer>
            {/* Post Header - Modern Instagram style */}
            <PostHeader>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar 
                  src={(post.author as any)?.profilePicture}
                  sx={{ 
                    width: 40,
                    height: 40,
                    border: post.isPinned || post.isPromoted 
                      ? '2px solid #f09433'
                      : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                    }
                  }}
                >
                  {post.author.firstName.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight={600}
                      sx={{
                        fontSize: '0.95rem',
                        color: 'text.primary',
                        cursor: 'pointer',
                        '&:hover': {
                          color: 'primary.main',
                        }
                      }}
                    >
                      {post.author.firstName} {post.author.lastName}
                    </Typography>
                    {post.isPinned && <Star sx={{ color: '#FFD700', fontSize: 16 }} />}
                    {post.isPromoted && <TrendingUp sx={{ color: 'primary.main', fontSize: 16 }} />}
                  </Box>
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: '0.8rem',
                      fontWeight: 500,
                    }}
                  >
                    {post.author.jobTitle}
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" sx={{ borderRadius: '50%' }}>
                <MoreHoriz />
              </IconButton>
            </PostHeader>

            {/* Post Media - Instagram style (media first, then text) */}
            {post.media && post.media.length > 0 && (
              <PostMediaContainer>
                {post.media.length === 1 ? (
                  // Single media item
                  <Box sx={{ position: 'relative', width: '200%', maxHeight: 400, overflow: 'hidden' }}>
                    {post.media[0].type === 'image' ? (
                      <CardMedia
                        component="img"
                        image={post.media[0].url}
                        alt="Post media"
                        sx={{
                          width: '100%',
                          height: 'auto',
                          maxHeight: 400,
                          objectFit: 'cover',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(post.media[0].url, '_blank')}
                      />
                    ) : (
                      <Box 
                        sx={{ 
                          position: 'relative', 
                          width: '100%', 
                          height: 320,
                          aspectRatio: '16/9',
                          overflow: 'hidden',
                          backgroundColor: 'black'
                        }}
                      >
                        {/* Auto-playing Video */}
                        <video
                          data-video-id={`${post._id}-0`}
                          loop
                          muted={mutedVideos.has(`${post._id}-0`)}
                          playsInline
                          preload="metadata"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            cursor: 'pointer'
                          }}
                          poster={post.media[0].thumbnail}
                          onClick={() => handleVideoClick(post.media[0].url, `${post.author.firstName} ${post.author.lastName}'s video`)}
                        >
                          <source src={post.media[0].url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>

                        {/* Video Controls Overlay */}
                        <Box sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          display: 'flex',
                          gap: 1,
                          zIndex: 2
                        }}>
                          {/* Mute/Unmute Button */}
                          <IconButton
                            data-testid="volume-button"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleVideoMute(`${post._id}-0`);
                            }}
                            sx={{
                              backgroundColor: 'rgba(0,0,0,0.6)',
                              color: 'white',
                              width: 36,
                              height: 36,
                              '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.8)',
                              }
                            }}
                          >
                            {mutedVideos.has(`${post._id}-0`) ? (
                              <VolumeOff sx={{ fontSize: 18 }} />
                            ) : (
                              <VolumeUp sx={{ fontSize: 18 }} />
                            )}
                          </IconButton>
                        </Box>

                        {/* Video duration badge */}
                        <Box sx={{
                          position: 'absolute',
                          bottom: 12,
                          right: 12,
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {'0:30'}
                        </Box>

                        {/* Play indicator when paused */}
                        {!playingVideos.has(`${post._id}-0`) && (
                          <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            borderRadius: '50%',
                            width: 80,
                            height: 80,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none'
                          }}>
                            <PlayCircleOutline sx={{ fontSize: 48, color: 'white' }} />
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                ) : (
                  // Multiple media items - grid layout
                  <Box 
                    data-testid="video-grid"
                    sx={{ 
                      display: 'grid', 
                      gap: 1,
                      gridTemplateColumns: post.media.length === 2 ? '1fr 1fr' : hasVideoContent(post) ? 'repeat(auto-fit, minmax(180px, 1fr))' : 'repeat(auto-fit, minmax(220px, 1fr))',
                      maxHeight: hasVideoContent(post) ? 400 : 420, // Increased from 300/320 for better space utilization
                      overflow: 'hidden'
                    }}>
                    {post.media.slice(0, 4).map((media, index) => (
                      <Box key={index} sx={{ position: 'relative', height: hasVideoContent(post) ? 190 : 200, overflow: 'hidden', backgroundColor: 'black', borderRadius: 1 }}> {/* Increased from 140px/160px to 190px/200px */}
                        {media.type === 'image' ? (
                          <CardMedia
                            component="img"
                            image={media.url}
                            alt={`Post media ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: 0.5,
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(media.url, '_blank')}
                          />
                        ) : (
                          <>
                            {/* Auto-playing Video */}
                            <video
                              data-video-id={`${post._id}-${index}`}
                              loop
                              muted={mutedVideos.has(`${post._id}-${index}`)}
                              playsInline
                              preload="metadata"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                borderRadius: 4,
                                cursor: 'pointer'
                              }}
                              poster={media.thumbnail}
                              onClick={() => handleVideoClick(media.url, `${post.author.firstName} ${post.author.lastName}'s video ${index + 1}`)}
                            >
                              <source src={media.url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>

                            {/* Video Controls Overlay */}
                            <Box sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              zIndex: 2
                            }}>
                              {/* Mute/Unmute Button */}
                              <IconButton
                                data-testid="volume-button"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleVideoMute(`${post._id}-${index}`);
                                }}
                                sx={{
                                  backgroundColor: 'rgba(0,0,0,0.6)',
                                  color: 'white',
                                  width: 24,
                                  height: 24,
                                  '&:hover': {
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                  }
                                }}
                              >
                                {mutedVideos.has(`${post._id}-${index}`) ? (
                                  <VolumeOff sx={{ fontSize: 14 }} />
                                ) : (
                                  <VolumeUp sx={{ fontSize: 14 }} />
                                )}
                              </IconButton>
                            </Box>

                            {/* Play indicator when paused */}
                            {!playingVideos.has(`${post._id}-${index}`) && (
                              <Box sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                borderRadius: '50%',
                                width: 32,
                                height: 32,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                pointerEvents: 'none'
                              }}>
                                <PlayCircleOutline sx={{ fontSize: 24, color: 'white' }} />
                              </Box>
                            )}
                          </>
                        )}
                        {/* Show +X more overlay for last item if there are more than 4 items */}
                        {index === 3 && post.media.length > 4 && (
                          <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 0.5,
                            cursor: 'pointer'
                          }}>
                            <Typography variant="body2" color="white" fontWeight={600}>
                              +{post.media.length - 4}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </PostMediaContainer>
            )}

            {/* Instagram-style Action Buttons */}
            <PostActions>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton
                  data-testid="like-button"
                  onClick={() => handlePostLike(post._id)}
                  sx={{ 
                    color: isLiked ? '#ed4956' : 'text.primary',
                    p: 0.5,
                    '&:hover': {
                      color: isLiked ? '#c73641' : 'text.secondary',
                      backgroundColor: 'transparent',
                    }
                  }}
                >
                  {isLiked ? <Favorite sx={{ fontSize: 24 }} /> : <FavoriteBorder sx={{ fontSize: 24 }} />}
                </IconButton>
                
                <IconButton 
                  data-testid="comment-button"
                  onClick={() => handleCommentClick(post._id)}
                  sx={{ 
                    color: 'text.primary', 
                    p: 0.5,
                    '&:hover': {
                      color: 'text.secondary',
                      backgroundColor: 'transparent',
                    }
                  }}
                >
                  <ChatBubbleOutline sx={{ fontSize: 24 }} />
                </IconButton>
                
                <IconButton 
                  onClick={() => handlePostShare(post._id)}
                  sx={{ 
                    color: 'text.primary', 
                    p: 0.5,
                    '&:hover': {
                      color: 'text.secondary',
                      backgroundColor: 'transparent',
                    }
                  }}
                >
                  <ShareOutlined sx={{ fontSize: 24 }} />
                </IconButton>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 12, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {formatDistanceToNow(new Date(post.createdAt))} ago
                </Typography>
              </Box>
            </PostActions>

            {/* Instagram-style Text Content */}
            <PostTextContent>
              {/* Likes count */}
              {post.likesCount > 0 && (
                <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5, fontSize: '0.875rem' }}>
                  {post.likesCount.toLocaleString()} likes
                </Typography>
              )}

              {/* Post content */}
              <Typography 
                variant="body2" 
                sx={{ 
                  lineHeight: 1.4,
                  fontSize: '0.875rem',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                  mb: 1,
                }}
              >
                <Typography component="span" fontWeight={600} sx={{ mr: 1 }}>
                  {post.author.firstName.toLowerCase()}{post.author.lastName.toLowerCase()}
                </Typography>
                {displayContent}
              </Typography>

              {/* Show more/less button */}
              {shouldTruncate && (
                <Button
                  onClick={() => togglePostExpansion(post._id)}
                  sx={{ 
                    textTransform: 'none', 
                    p: 0, 
                    mb: 1,
                    fontWeight: 400,
                    minHeight: 'auto',
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                  }}
                >
                  {isExpanded ? 'Show less' : 'more'}
                </Button>
              )}

              {/* Tags - Instagram style */}
              {post.tags && post.tags.length > 0 && (
                <Box sx={{ mb: 1 }}>
                  {post.tags.slice(0, 5).map((tag, index) => (
                    <Typography
                      key={tag}
                      component="span"
                      variant="body2"
                      sx={{
                        color: '#00376b',
                        fontSize: '0.875rem',
                        mr: 0.5,
                        cursor: 'pointer',
                        '&:hover': {
                          textDecoration: 'underline',
                        }
                      }}
                    >
                      #{tag}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* Comments preview */}
              {post.commentsCount > 0 && (
                <Button
                  onClick={() => handleCommentClick(post._id)}
                  sx={{
                    textTransform: 'none',
                    p: 0,
                    fontSize: '0.875rem',
                    color: 'text.secondary',
                    fontWeight: 400,
                    justifyContent: 'flex-start',
                  }}
                >
                  View all {post.commentsCount} comments
                </Button>
              )}
            </PostTextContent>
          </PostContentContainer>
        </InstagramPostCard>
      </motion.div>
    );
  };

  const renderSidebar = () => (
    <Box>
      {/* Ultra-Compact Profile Summary */}
      <SidebarCard>
        <CardContent>
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              src={(user as any)?.profilePicture || undefined}
              sx={{ 
                width: 40, 
                height: 40, 
                mx: 'auto', 
                mb: 1,
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                boxShadow: `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`,
              }}
            >
              {user?.firstName?.charAt(0)}
            </Avatar>
            <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem', mb: 0.5 }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontSize: '0.7rem' }}>
              Full Stack Developer
            </Typography>
            {/* Compact stats in single row */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.2, textAlign: 'center' }}>
              <Box>
                <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ fontSize: '0.7rem' }}>1.9K</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem' }}>
                  Connect
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ fontSize: '0.7rem' }}>224</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.6rem' }}>
                  Posts
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </SidebarCard>

      {/* Ultra-Compact Career Hub */}
      <SidebarCard>
        <CardContent>
          <Typography variant="body2" fontWeight={700} sx={{ 
            mb: 1.2, 
            textAlign: 'center',
            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '0.85rem',
          }}>
            Career Hub
          </Typography>
          <Stack spacing={0.8}>
            <IconButton 
              size="small" 
              onClick={() => navigate('/jobs')}
              sx={{ 
                borderRadius: 2.5, 
                p: 0.8,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                color: 'white',
                width: '100%',
                height: 36,
                '&:hover': { 
                  background: 'linear-gradient(135deg, #1565c0, #1976d2)',
                  transform: 'scale(1.02)'
                }
              }}
            >
              <BusinessCenter fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => navigate('/interview-prep')}
              sx={{ 
                borderRadius: 2.5, 
                p: 0.8,
                background: 'linear-gradient(135deg, #9c27b0, #ba68c8)',
                color: 'white',
                width: '100%',
                height: 36,
                '&:hover': { 
                  background: 'linear-gradient(135deg, #7b1fa2, #9c27b0)',
                  transform: 'scale(1.02)'
                }
              }}
            >
              <QuestionAnswer fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => navigate('/cv-builder')}
              sx={{ 
                borderRadius: 2.5, 
                p: 0.8,
                background: 'linear-gradient(135deg, #388e3c, #66bb6a)',
                color: 'white',
                width: '100%',
                height: 36,
                '&:hover': { 
                  background: 'linear-gradient(135deg, #2e7d32, #388e3c)',
                  transform: 'scale(1.02)'
                }
              }}
            >
              <Assignment fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => navigate('/skills-assessment')}
              sx={{ 
                borderRadius: 2.5, 
                p: 0.8,
                background: 'linear-gradient(135deg, #d32f2f, #f44336)',
                color: 'white',
                width: '100%',
                height: 36,
                '&:hover': { 
                  background: 'linear-gradient(135deg, #c62828, #d32f2f)',
                  transform: 'scale(1.02)'
                }
              }}
            >
              <Assessment fontSize="small" />
            </IconButton>
          </Stack>
        </CardContent>
      </SidebarCard>

      {/* Ultra-Compact Trending */}
      <SidebarCard>
        <CardContent>
          <Typography variant="body2" fontWeight={700} sx={{ 
            mb: 1.2, 
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'text.primary',
          }}>
            Trending
          </Typography>
          <Stack spacing={0.6}>
            {trendingTopics.slice(0, 3).map((topic, index) => (
              <Box 
                key={index} 
                sx={{ 
                  p: 0.8, 
                  borderRadius: 1.5, 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  '&:hover': { 
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: alpha(theme.palette.primary.main, 0.2),
                    transform: 'translateY(-1px)',
                  }
                }}
              >
                <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ fontSize: '0.7rem', display: 'block' }}>
                  {topic.topic}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  {topic.posts > 1000 ? `${Math.round(topic.posts/1000)}k` : topic.posts} • {topic.growth}
                </Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </SidebarCard>
    </Box>
  );

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error}
          <Button onClick={loadFeed} sx={{ ml: 2 }}>
            Try Again
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)'
    }}>
      <Container maxWidth="xl" sx={{ py: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Left Sidebar - Desktop only */}
          {isDesktop && (
            <Box sx={{ 
              flex: '0 0 240px',
              maxWidth: '240px',
              minWidth: '200px'
            }}>
              {renderSidebar()}
            </Box>
          )}
          
          {/* Main Content - Modern Instagram-like centered feed */}
          <Box sx={{ 
            flex: isDesktop ? '0 0 680px' : '1 1 100%',
            maxWidth: isDesktop ? '680px' : '100%',
            minWidth: 0
          }}>
            <Box sx={{ 
              width: '100%', 
              maxWidth: { xs: '100%', sm: '600px', md: '650px', lg: '680px' },
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: { xs: 1.5, sm: 2, md: 2.5 },
              px: { xs: 1, sm: 1.5, md: 2 },
            }}>
              {/* Stories Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {renderStories()}
              </motion.div>
              
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {renderEnhancedQuickActions()}
              </motion.div>
              
              {/* Create Post */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {renderCreatePost()}
              </motion.div>
              
              {/* Posts Feed */}
              {loading ? (
                <Stack spacing={3}>
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    >
                      <Card sx={{ 
                        borderRadius: 3,
                        boxShadow: theme.palette.mode === 'dark' 
                          ? '0 4px 20px rgba(0,0,0,0.3)' 
                          : '0 4px 20px rgba(0,0,0,0.08)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                      }}>
                        <CardContent sx={{ p: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Skeleton variant="circular" width={48} height={48} />
                            <Box sx={{ ml: 2, flex: 1 }}>
                              <Skeleton variant="text" width="60%" height={24} />
                              <Skeleton variant="text" width="40%" height={20} />
                            </Box>
                          </Box>
                          <Skeleton variant="text" height={20} />
                          <Skeleton variant="text" height={20} />
                          <Skeleton variant="text" width="80%" height={20} />
                          <Skeleton variant="rectangular" height={200} sx={{ mt: 2, borderRadius: 2 }} />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </Stack>
              ) : (
                <AnimatePresence>
                  {posts.map((post, index) => (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -30 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: index * 0.1,
                        ease: "easeOut"
                      }}
                    >
                      {renderPost(post)}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </Box>
          </Box>
          
          {/* Right Sidebar - Desktop only */}
          {isDesktop && (
            <Box sx={{ 
              flex: '0 0 240px',
              maxWidth: '240px',
              minWidth: '200px'
            }}>
              <Box sx={{ position: 'sticky', top: 20 }}>
                <SidebarCard>
                  <CardContent>
                    <Typography variant="body2" fontWeight={700} sx={{ 
                      mb: 1.5,
                      textAlign: 'center',
                      background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: '0.9rem',
                    }}>
                      Career Tools
                    </Typography>
                    <Stack spacing={1}>
                      <ActionButton 
                        variant="outlined" 
                        startIcon={<BusinessCenter sx={{ fontSize: 18 }} />} 
                        fullWidth 
                        onClick={() => navigate('/jobs')}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          borderRadius: 2.5,
                          py: 1,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        Find Jobs
                      </ActionButton>
                      <ActionButton 
                        variant="outlined" 
                        startIcon={<QuestionAnswer sx={{ fontSize: 18 }} />} 
                        fullWidth 
                        onClick={() => navigate('/interview-prep')}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          borderRadius: 2.5,
                          py: 1,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        Interview Prep
                      </ActionButton>
                      <ActionButton 
                        variant="outlined" 
                        startIcon={<Assignment sx={{ fontSize: 18 }} />} 
                        fullWidth 
                        onClick={() => navigate('/cv-builder')}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          borderRadius: 2.5,
                          py: 1,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        CV Builder
                      </ActionButton>
                      <ActionButton 
                        variant="outlined" 
                        startIcon={<Assessment sx={{ fontSize: 18 }} />} 
                        fullWidth 
                        onClick={() => navigate('/skills-assessment')}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          borderRadius: 2.5,
                          py: 1,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        Skills Test
                      </ActionButton>
                      <ActionButton 
                        variant="outlined" 
                        startIcon={<Psychology sx={{ fontSize: 18 }} />} 
                        fullWidth 
                        onClick={() => navigate('/exams')}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          borderRadius: 2.5,
                          py: 1,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        Smart Exams
                      </ActionButton>
                      <ActionButton 
                        variant="outlined" 
                        startIcon={<EmojiEvents sx={{ fontSize: 18 }} />} 
                        fullWidth 
                        onClick={() => navigate('/achievements')}
                        sx={{ 
                          justifyContent: 'flex-start', 
                          borderRadius: 2.5,
                          py: 1,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        Achievements
                      </ActionButton>
                    </Stack>
                  </CardContent>
                </SidebarCard>
              </Box>
            </Box>
          )}
        </Box>
      </Container>

      {/* Floating Create Button - Mobile and Small Tablets */}
      {(isMobile || isSmallTablet) && (
        <FloatingCreateButton onClick={() => setShowCreatePost(true)}>
          <Add />
        </FloatingCreateButton>
      )}

      {/* Create Post Dialog */}
      <Dialog
        open={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Create post
          <IconButton onClick={() => setShowCreatePost(false)} disabled={isPosting}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Avatar src={(user as any)?.profilePicture}>
              {user?.firstName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Button size="small" startIcon={<Public />} sx={{ textTransform: 'none', minHeight: 'auto', p: 0 }}>
                Public
              </Button>
            </Box>
          </Box>
          
          <TextField
            multiline
            rows={4}
            placeholder="What's on your mind?"
            variant="outlined"
            fullWidth
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          {/* Tags Input */}
          <TextField
            placeholder="Add tags (comma separated, e.g., technology, career, innovation)"
            variant="outlined"
            fullWidth
            value={postTags}
            onChange={(e) => setPostTags(e.target.value)}
            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />

          {/* Media Preview */}
          {postMedia.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Attached Media ({postMedia.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {postMedia.map((file, index) => (
                  <Box key={index} sx={{ position: 'relative', width: 100, height: 80 }}>
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        borderRadius: 1,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'background.paper'
                      }}
                    >
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : file.type.startsWith('video/') ? (
                        <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                          <video
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          >
                            <source src={URL.createObjectURL(file)} type={file.type} />
                          </video>
                          <Box sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: 'white',
                            opacity: 0.8
                          }}>
                            <PlayCircleOutline sx={{ fontSize: 24 }} />
                          </Box>
                        </Box>
                      ) : (
                        <AttachFile sx={{ color: 'text.secondary' }} />
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => removeMedia(index)}
                      sx={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        bgcolor: 'error.main',
                        color: 'white',
                        width: 20,
                        height: 20,
                        '&:hover': {
                          bgcolor: 'error.dark',
                        }
                      }}
                    >
                      <Close sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <input
              accept="image/*,video/*"
              style={{ display: 'none' }}
              id="media-upload"
              multiple
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="media-upload">
              <Button 
                component="span"
                startIcon={<Photo sx={{ color: '#45bd62' }} />} 
                sx={{ textTransform: 'none', borderRadius: 2 }}
                disabled={isPosting}
              >
                Photo/Video
              </Button>
            </label>
            <Button 
              startIcon={<EmojiEmotions sx={{ color: '#f7b928' }} />} 
              sx={{ textTransform: 'none', borderRadius: 2 }}
              disabled={isPosting}
            >
              Feeling
            </Button>
            <Button 
              startIcon={<LocationOn sx={{ color: '#1877f2' }} />} 
              sx={{ textTransform: 'none', borderRadius: 2 }}
              disabled={isPosting}
            >
              Check in
            </Button>
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleCreatePost}
            disabled={isPosting || (!postContent.trim() && postMedia.length === 0)}
            sx={{ 
              borderRadius: 2, 
              py: 1.5,
              background: isPosting 
                ? 'rgba(0,0,0,0.12)' 
                : `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            }}
          >
            {isPosting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Posting...
              </Box>
            ) : (
              'Post'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={showCommentDialog}
        onClose={handleCloseCommentDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          pb: 2
        }}>
          <Typography variant="h6" fontWeight={600}>
            Add Comment
          </Typography>
          <IconButton 
            onClick={handleCloseCommentDialog}
            size="small"
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="What do you think about this post?"
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f8f9fa',
              }
            }}
          />
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            mt: 2,
            color: 'text.secondary'
          }}>
            <Avatar
              src={(user as any)?.profilePicture || undefined}
              sx={{ width: 32, height: 32 }}
            >
              {user?.firstName?.charAt(0)}
            </Avatar>
            <Typography variant="body2">
              Commenting as {user?.firstName} {user?.lastName}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleCloseCommentDialog}
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddComment}
            variant="contained"
            disabled={!commentContent.trim() || isCommenting}
            sx={{
              borderRadius: 2,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              px: 3,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              }
            }}
          >
            {isCommenting ? (
              <>
                <CircularProgress size={18} sx={{ mr: 1 }} />
                Posting...
              </>
            ) : (
              'Post Comment'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Video Modal */}
      <Dialog
        open={showVideoModal}
        onClose={handleCloseVideoModal}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'black',
            borderRadius: 2,
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            color: 'white', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pb: 1
          }}
        >
          <Typography variant="h6" sx={{ color: 'white' }}>
            {selectedVideo?.title || 'Video'}
          </Typography>
          <IconButton 
            onClick={handleCloseVideoModal}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, backgroundColor: 'black' }}>
          {selectedVideo && (
            <Box sx={{ 
              position: 'relative',
              width: '100%',
              height: 'auto',
              minHeight: '60vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <video
                controls
                autoPlay // Auto-play when modal opens
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '70vh',
                  objectFit: 'contain'
                }}
                onLoadStart={() => console.log('Video loading started')}
                onCanPlay={() => console.log('Video can play')}
                onError={(e) => console.error('Video error:', e)}
              >
                <source src={selectedVideo.url} type="video/mp4" />
                <source src={selectedVideo.url} type="video/webm" />
                <source src={selectedVideo.url} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Story Dialog */}
      <CreateStory
        open={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onStoryCreated={handleStoryCreated}
      />

      {/* Story Viewer */}
      <StoryViewer
        open={showStoryViewer}
        onClose={handleCloseStoryViewer}
        stories={storyViewerStories}
        initialStoryIndex={selectedStoryIndex}
        currentUserId={user?._id}
      />
    </Box>
  );
};

export default SocialNetworkPage;
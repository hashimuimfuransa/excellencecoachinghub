import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  Avatar,
  IconButton,
  Button,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Close,
  Favorite,
  FavoriteBorder,
  Share,
  Visibility,
  MoreVert,
  ArrowBack,
  PlayArrow,
  Pause,
  VolumeUp,
  VolumeOff,
  Star,
  EmojiEvents,
  School,
  Work,
  Psychology,
  TrendingUp,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { socialNetworkService } from '../services/socialNetworkService';
import { enhancedStoryService } from '../services/enhancedStoryService';
import EnhancedCreateStory from '../components/social/EnhancedCreateStory';
import EnhancedStoryViewer from '../components/social/EnhancedStoryViewer';

interface Story {
  _id: string;
  type: 'achievement' | 'milestone' | 'inspiration' | 'announcement';
  title: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  tags: string[];
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    jobTitle?: string;
    company?: string;
  };
  visibility: 'public' | 'connections' | 'private';
  createdAt: string;
  expiresAt: string;
  viewers: string[];
  likes: string[];
  shares: number;
}

const ViewStoriesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [storyViewerStories, setStoryViewerStories] = useState<Story[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await socialNetworkService.getStories();
      
      if (response.success && response.data) {
        setStories(response.data);
      } else {
        throw new Error(response.error || 'Failed to load stories');
      }
    } catch (error) {
      console.error('Error loading stories:', error);
      setError('Failed to load stories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (story: Story, index: number) => {
    setStoryViewerStories(stories);
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  };

  const handleCreateStoryClick = () => {
    setShowCreateStory(true);
  };

  const handleStoryCreated = (newStory: Story) => {
    setStories(prev => [newStory, ...prev]);
    setNotification({
      message: 'Story created successfully!',
      type: 'success'
    });
  };

  const handleStoryViewerClose = () => {
    setShowStoryViewer(false);
    setSelectedStoryIndex(0);
  };

  const handleStoryChange = (index: number, story: Story) => {
    // Update the story in the list if needed
    setStories(prev => prev.map(s => s._id === story._id ? story : s));
  };

  const getStoryTypeColor = (type: string) => {
    const colors = {
      achievement: '#FFD700',
      milestone: '#FF5722',
      inspiration: '#9C27B0',
      announcement: '#FF9800'
    };
    return colors[type as keyof typeof colors] || '#2196F3';
  };

  const getStoryTypeIcon = (type: string) => {
    const icons = {
      achievement: <EmojiEvents />,
      milestone: <TrendingUp />,
      inspiration: <Psychology />,
      announcement: <Star />
    };
    return icons[type as keyof typeof icons] || <Star />;
  };

  const getStoryTypeLabel = (type: string) => {
    const labels = {
      achievement: 'Career Achievement',
      milestone: 'Career Milestone',
      inspiration: 'Professional Insight',
      announcement: 'Announcement'
    };
    return labels[type as keyof typeof labels] || 'Story';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: isMobile ? 2 : 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: isMobile ? 2 : 4 }}>
        <IconButton onClick={handleBack} sx={{ color: 'text.secondary' }}>
          <ArrowBack />
        </IconButton>
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight={700} sx={{ flexGrow: 1 }}>
          Professional Stories
        </Typography>
        {!isMobile && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateStoryClick}
            sx={{
              borderRadius: 3,
              px: 3,
              py: 1.5,
              background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
              }
            }}
          >
            Create Story
          </Button>
        )}
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Stories Grid */}
      {stories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            No stories available yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Be the first to share your professional journey!
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleCreateStoryClick}
            sx={{ borderRadius: 3 }}
          >
            Create Your First Story
          </Button>
        </Box>
      ) : (
        <Grid container spacing={isMobile ? 2 : 3}>
          {stories.map((story, index) => (
            <Grid item xs={12} sm={6} md={4} key={story._id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
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
                        background: `linear-gradient(135deg, ${getStoryTypeColor(story.type)}40 0%, ${getStoryTypeColor(story.type)}20 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <Box sx={{ color: getStoryTypeColor(story.type), fontSize: '3rem' }}>
                        {getStoryTypeIcon(story.type)}
                      </Box>
                    </Box>
                  )}

                  {/* Story Content */}
                  <Box sx={{ p: 3 }}>
                    {/* Author Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        src={story.author.profilePicture}
                        sx={{
                          width: 40,
                          height: 40,
                          border: `2px solid ${getStoryTypeColor(story.type)}`,
                        }}
                      >
                        {story.author.firstName[0]}
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {story.author.firstName} {story.author.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {story.author.jobTitle} • {formatTimeAgo(story.createdAt)}
                        </Typography>
                      </Box>
                      <Chip
                        label={getStoryTypeLabel(story.type)}
                        size="small"
                        sx={{
                          backgroundColor: `${getStoryTypeColor(story.type)}20`,
                          color: getStoryTypeColor(story.type),
                          fontWeight: 600,
                        }}
                      />
                    </Box>

                    {/* Story Title */}
                    <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
                      {story.title}
                    </Typography>

                    {/* Story Content Preview */}
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

                    {/* Tags */}
                    {story.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {story.tags.slice(0, 3).map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            label={`#${tag}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              color: getStoryTypeColor(story.type),
                              borderColor: `${getStoryTypeColor(story.type)}40`,
                            }}
                          />
                        ))}
                        {story.tags.length > 3 && (
                          <Chip
                            label={`+${story.tags.length - 3}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              color: 'text.secondary',
                            }}
                          />
                        )}
                      </Box>
                    )}

                    {/* Story Stats */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Favorite sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {story.likes.length}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Visibility sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {story.viewers.length}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Share sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {story.shares}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Mobile Floating Action Button */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
            }
          }}
          onClick={handleCreateStoryClick}
        >
          <Add />
        </Fab>
      )}

      {/* Create Story Dialog */}
      <EnhancedCreateStory
        open={showCreateStory}
        onClose={() => setShowCreateStory(false)}
        onStoryCreated={handleStoryCreated}
        existingStories={stories}
      />

      {/* Story Viewer */}
      <EnhancedStoryViewer
        open={showStoryViewer}
        onClose={handleStoryViewerClose}
        stories={storyViewerStories}
        initialIndex={selectedStoryIndex}
        onStoryChange={handleStoryChange}
      />

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={4000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification && (
          <Alert
            onClose={() => setNotification(null)}
            severity={notification.type}
            variant="filled"
            sx={{ borderRadius: 2 }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
    </Container>
  );
};

export default ViewStoriesPage;

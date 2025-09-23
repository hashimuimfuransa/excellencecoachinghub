import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  LinearProgress,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  alpha,
} from '@mui/material';
import {
  Close,
  Visibility,
  Favorite,
  Share,
  TrendingUp,
  TrendingDown,
  Assessment,
  People,
  ThumbUp,
  ShareOutlined,
  Schedule,
  Delete,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { enhancedStoryService } from '../../services/enhancedStoryService';

interface StoryReviewInterfaceProps {
  open: boolean;
  onClose: () => void;
}

interface StoryData {
  _id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  expiresAt: string;
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
  };
}

interface StoryAnalytics {
  viewers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    viewedAt: string;
  }>;
  engagement: {
    views: number;
    likes: number;
    shares: number;
    reach: number;
  };
}

const StoryReviewInterface: React.FC<StoryReviewInterfaceProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryData[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryData | null>(null);
  const [storyAnalytics, setStoryAnalytics] = useState<StoryAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (open) {
      loadUserStories();
    }
  }, [open]);

  const loadUserStories = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('📊 Loading user stories for review...');
      const result = await enhancedStoryService.getUserStories(); // Get user stories
      console.log('🧪 TEST - User stories loaded:', result);
      
      if (result.success && result.data) {
        console.log('✅ User stories loaded:', result.data);
        setStories(result.data);
      } else {
        console.warn('⚠️ Failed to load user stories:', result.error);
        setError(result.error || 'Failed to load stories');
      }
    } catch (error: any) {
      console.error('❌ Error loading user stories:', error);
      setError(error.message || 'Failed to load stories');
    } finally {
      setLoading(false);
    }
  };

  const loadStoryAnalytics = async (storyId: string) => {
    setAnalyticsLoading(true);
    try {
      console.log('📈 Loading analytics for story:', storyId);
      const result = await enhancedStoryService.getStoryAnalytics(storyId);
      
      if (result.success && result.data) {
        console.log('✅ Story analytics loaded:', result.data);
        setStoryAnalytics(result.data);
      } else {
        console.warn('⚠️ Failed to load story analytics:', result.error);
        setStoryAnalytics(null);
      }
    } catch (error: any) {
      console.error('❌ Error loading story analytics:', error);
      setStoryAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleStorySelect = (story: StoryData) => {
    setSelectedStory(story);
    setTabValue(0);
    loadStoryAnalytics(story._id);
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting story:', storyId);
      const result = await enhancedStoryService.deleteStory(storyId);
      
      if (result.success) {
        console.log('✅ Story deleted successfully');
        // Remove from local state
        setStories(prev => prev.filter(story => story._id !== storyId));
        if (selectedStory?._id === storyId) {
          setSelectedStory(null);
          setStoryAnalytics(null);
        }
      } else {
        console.error('❌ Failed to delete story:', result.error);
        setError(result.error || 'Failed to delete story');
      }
    } catch (error: any) {
      console.error('❌ Error deleting story:', error);
      setError(error.message || 'Failed to delete story');
    }
  };

  const getStoryTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement': return '🏆';
      case 'milestone': return '🎯';
      case 'inspiration': return '💡';
      case 'announcement': return '📢';
      default: return '📝';
    }
  };

  const getStoryTypeColor = (type: string) => {
    switch (type) {
      case 'achievement': return '#FFD700';
      case 'milestone': return '#4CAF50';
      case 'inspiration': return '#9C27B0';
      case 'announcement': return '#2196F3';
      default: return '#757575';
    }
  };

  const calculateEngagementRate = (analytics: StoryAnalytics) => {
    if (!analytics.engagement.views) return 0;
    return Math.round(((analytics.engagement.likes + analytics.engagement.shares) / analytics.engagement.views) * 100);
  };

  const isStoryExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 2,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Assessment color="primary" />
          <Typography variant="h5" fontWeight="bold">
            Story Performance Review
          </Typography>
        </Box>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: 'flex', height: '70vh' }}>
          {/* Stories List */}
          <Box sx={{ 
            width: '40%', 
            borderRight: '1px solid #e0e0e0',
            overflow: 'auto',
            p: 2
          }}>
            <Typography variant="h6" gutterBottom>
              Your Stories ({stories.length})
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : stories.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="text.secondary">
                  No stories found. Create your first story to see analytics here!
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {stories.map((story) => (
                  <motion.div
                    key={story._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: selectedStory?._id === story._id ? '2px solid #2196F3' : '1px solid #e0e0e0',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }
                      }}
                      onClick={() => handleStorySelect(story)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Typography sx={{ fontSize: '1.5rem' }}>
                            {getStoryTypeIcon(story.type)}
                          </Typography>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight="bold" noWrap>
                              {story.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDistanceToNow(new Date(story.createdAt), { addSuffix: true })}
                            </Typography>
                          </Box>
                          {isStoryExpired(story.expiresAt) && (
                            <Chip 
                              label="Expired" 
                              size="small" 
                              color="error" 
                              variant="outlined"
                            />
                          )}
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {story.content.substring(0, 100)}...
                        </Typography>
                        
                        {story.tags.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {story.tags.slice(0, 3).map((tag, index) => (
                              <Chip
                                key={index}
                                label={`#${tag}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            ))}
                            {story.tags.length > 3 && (
                              <Typography variant="caption" color="text.secondary">
                                +{story.tags.length - 3} more
                              </Typography>
                            )}
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            )}
          </Box>

          {/* Analytics Panel */}
          <Box sx={{ flex: 1, p: 3 }}>
            {selectedStory ? (
              <>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography sx={{ fontSize: '2rem' }}>
                      {getStoryTypeIcon(selectedStory.type)}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {selectedStory.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDistanceToNow(new Date(selectedStory.createdAt), { addSuffix: true })}
                      </Typography>
                    </Box>
                    <IconButton
                      onClick={() => handleDeleteStory(selectedStory._id)}
                      color="error"
                      disabled={isStoryExpired(selectedStory.expiresAt)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {selectedStory.content}
                  </Typography>
                  
                  {selectedStory.tags.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      {selectedStory.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={`#${tag}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  )}
                </Box>

                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
                  <Tab label="Overview" />
                  <Tab label="Viewers" />
                  <Tab label="Performance" />
                </Tabs>

                {analyticsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : storyAnalytics ? (
                  <>
                    {/* Overview Tab */}
                    {tabValue === 0 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {/* Key Metrics */}
                        <Grid container spacing={2}>
                          <Grid item xs={6} sm={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                              <Visibility color="primary" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h4" fontWeight="bold" color="primary">
                                {storyAnalytics.engagement.views}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Views
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                              <Favorite color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h4" fontWeight="bold" color="secondary">
                                {storyAnalytics.engagement.likes}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Likes
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                              <ShareOutlined color="success" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h4" fontWeight="bold" color="success.main">
                                {storyAnalytics.engagement.shares}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Shares
                              </Typography>
                            </Card>
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Card sx={{ textAlign: 'center', p: 2 }}>
                              <TrendingUp color="warning" sx={{ fontSize: 40, mb: 1 }} />
                              <Typography variant="h4" fontWeight="bold" color="warning.main">
                                {storyAnalytics.engagement.reach}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Reach
                              </Typography>
                            </Card>
                          </Grid>
                        </Grid>

                        {/* Engagement Rate */}
                        <Card sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            Engagement Rate
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <LinearProgress
                              variant="determinate"
                              value={calculateEngagementRate(storyAnalytics)}
                              sx={{ flex: 1, height: 8, borderRadius: 4 }}
                            />
                            <Typography variant="h6" fontWeight="bold">
                              {calculateEngagementRate(storyAnalytics)}%
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Based on likes and shares relative to views
                          </Typography>
                        </Card>
                      </Box>
                    )}

                    {/* Viewers Tab */}
                    {tabValue === 1 && (
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Story Viewers ({storyAnalytics.viewers.length})
                        </Typography>
                        {storyAnalytics.viewers.length > 0 ? (
                          <List>
                            {storyAnalytics.viewers.map((viewer, index) => (
                              <React.Fragment key={viewer._id}>
                                <ListItem>
                                  <ListItemAvatar>
                                    <Avatar src={viewer.profilePicture}>
                                      {viewer.firstName[0]}
                                    </Avatar>
                                  </ListItemAvatar>
                                  <ListItemText
                                    primary={`${viewer.firstName} ${viewer.lastName}`}
                                    secondary={formatDistanceToNow(new Date(viewer.viewedAt), { addSuffix: true })}
                                  />
                                </ListItem>
                                {index < storyAnalytics.viewers.length - 1 && <Divider />}
                              </React.Fragment>
                            ))}
                          </List>
                        ) : (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <People sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                            <Typography color="text.secondary">
                              No viewers yet
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Performance Tab */}
                    {tabValue === 2 && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Card sx={{ p: 3 }}>
                          <Typography variant="h6" gutterBottom>
                            Performance Insights
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Views per hour
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {Math.round(storyAnalytics.engagement.views / Math.max(1, (Date.now() - new Date(selectedStory.createdAt).getTime()) / (1000 * 60 * 60)))}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Engagement quality
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {calculateEngagementRate(storyAnalytics) > 10 ? 'High' : 
                                 calculateEngagementRate(storyAnalytics) > 5 ? 'Medium' : 'Low'}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Story status
                              </Typography>
                              <Typography variant="body2" fontWeight="bold" color={isStoryExpired(selectedStory.expiresAt) ? 'error' : 'success'}>
                                {isStoryExpired(selectedStory.expiresAt) ? 'Expired' : 'Active'}
                              </Typography>
                            </Box>
                          </Box>
                        </Card>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Assessment sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography color="text.secondary">
                      No analytics data available for this story
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Assessment sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Select a story to view analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose a story from the list to see detailed performance metrics
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0' }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button onClick={loadUserStories} variant="contained" disabled={loading}>
          Refresh Data
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StoryReviewInterface;

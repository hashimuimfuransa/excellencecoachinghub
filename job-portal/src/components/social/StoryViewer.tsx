import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  Box,
  Avatar,
  Typography,
  IconButton,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Badge,
  Fade,
} from '@mui/material';
import {
  Close,
  PlayArrow,
  Pause,
  VolumeOff,
  VolumeUp,
  Visibility,
  Favorite,
  Share,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { socialNetworkService } from '../../services/socialNetworkService';
import { enhancedStoryService } from '../../services/enhancedStoryService';

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
  };
  visibility: 'public' | 'connections' | 'private';
  createdAt: string;
  expiresAt: string;
  viewers: string[];
  likes: string[];
  shares: number;
}

interface StoryViewerProps {
  open: boolean;
  onClose: () => void;
  stories: Story[];
  initialStoryIndex: number;
  currentUserId?: string;
}

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
      id={`story-tabpanel-${index}`}
      aria-labelledby={`story-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  open,
  onClose,
  stories,
  initialStoryIndex,
  currentUserId,
}) => {
  const { user } = useAuth();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [videoMuted, setVideoMuted] = useState(true);
  const [storyViewers, setStoryViewers] = useState<any[]>([]);
  const [storyEngagement, setStoryEngagement] = useState<any>({});
  const [autoUnmuted, setAutoUnmuted] = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentStory = stories[currentStoryIndex];
  const isOwnStory = currentStory?.author._id === user?._id;
  const storyDuration = currentStory?.media?.type === 'video' ? 10000 : 5000; // 10s for video, 5s for image

  useEffect(() => {
    if (open && currentStory) {
      // Load story analytics if it's user's own story
      if (isOwnStory) {
        loadStoryAnalytics(currentStory._id);
      }
      
      // Start progress
      startProgress();

      // Mark story as viewed after a brief delay to avoid render issues
      const timer = setTimeout(() => {
        markStoryAsViewed(currentStory._id);
      }, 100);

      return () => {
        clearTimeout(timer);
      };
    }
    
    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
    };
  }, [open, currentStoryIndex, currentStory]);

  // Update video mute state when videoMuted changes and handle auto-unmuting
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = videoMuted;
      
      // Auto-unmute after 2 seconds if user hasn't manually interacted
      if (currentStory?.media?.type === 'video' && videoMuted && !autoUnmuted) {
        const autoUnmuteTimer = setTimeout(() => {
          setVideoMuted(false);
          setAutoUnmuted(true);
        }, 2000);
        
        return () => clearTimeout(autoUnmuteTimer);
      }
    }
  }, [videoMuted, currentStory, autoUnmuted]);

  const markStoryAsViewed = async (storyId: string) => {
    try {
      await socialNetworkService.viewStory(storyId);
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  const loadStoryAnalytics = async (storyId: string) => {
    try {
      const analytics = await socialNetworkService.getStoryAnalytics(storyId);
      setStoryViewers(analytics.viewers || []);
      setStoryEngagement(analytics.engagement || {});
    } catch (error) {
      console.error('Error loading story analytics:', error);
    }
  };

  const startProgress = () => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    
    setProgress(0);
    const increment = 100 / (storyDuration / 100);
    
    progressRef.current = setInterval(() => {
      if (!isPaused) {
        setProgress(prev => {
          if (prev >= 100) {
            nextStory();
            return 0;
          }
          return prev + increment;
        });
      }
    }, 100);
  };

  const nextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
      setAutoUnmuted(false); // Reset auto-unmute for next story
    } else {
      onClose();
    }
  };

  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
      setAutoUnmuted(false); // Reset auto-unmute for previous story
    }
  };

  const handlePlayPause = () => {
    setIsPaused(!isPaused);
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleLikeStory = async () => {
    try {
      await socialNetworkService.likeStory(currentStory._id);
      // Update local state or refetch stories
    } catch (error) {
      console.error('Error liking story:', error);
    }
  };

  const handleShareStory = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: currentStory.title,
          text: currentStory.content,
          url: window.location.href,
        });
      } else {
        // Fallback to copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // Show success message
      }
    } catch (error) {
      console.error('Error sharing story:', error);
    }
  };

  if (!currentStory) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#000',
        },
      }}
    >
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header with progress bars */}
        <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
          {stories.map((_, index) => (
            <LinearProgress
              key={index}
              variant="determinate"
              value={
                index < currentStoryIndex ? 100 :
                index === currentStoryIndex ? progress : 0
              }
              sx={{
                flex: 1,
                height: 3,
                borderRadius: 1.5,
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white',
                },
              }}
            />
          ))}
        </Box>

        {/* Story header */}
        <Box sx={{ 
          px: 2, 
          py: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          color: 'white'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={currentStory.author.profilePicture}
              sx={{ width: 40, height: 40 }}
            >
              {currentStory.author.firstName[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight="bold">
                {currentStory.author.firstName} {currentStory.author.lastName}
              </Typography>
              <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
                {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isOwnStory && (
              <IconButton
                onClick={() => setShowViewers(true)}
                sx={{ color: 'white' }}
              >
                <Badge badgeContent={storyViewers.length} color="primary">
                  <Visibility />
                </Badge>
              </IconButton>
            )}
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Story content */}
        <Box 
          sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            cursor: 'pointer',
          }}
          onClick={handlePlayPause}
        >
          {/* Navigation areas */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '30%',
              height: '100%',
              zIndex: 2,
            }}
            onClick={(e) => {
              e.stopPropagation();
              previousStory();
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              width: '30%',
              height: '100%',
              zIndex: 2,
            }}
            onClick={(e) => {
              e.stopPropagation();
              nextStory();
            }}
          />

          {/* Media content */}
          {currentStory.media ? (
            currentStory.media.type === 'image' ? (
              <img
                src={currentStory.media.url}
                alt={currentStory.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <video
                ref={videoRef}
                src={currentStory.media.url}
                autoPlay
                muted={videoMuted}
                loop
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
                onPlay={() => setIsPaused(false)}
                onPause={() => setIsPaused(true)}
              />
            )
          ) : (
            <Box sx={{ textAlign: 'center', color: 'white', p: 4 }}>
              <Typography variant="h4" gutterBottom>
                {currentStory.title}
              </Typography>
              <Typography variant="body1">
                {currentStory.content}
              </Typography>
            </Box>
          )}

          {/* Play/pause overlay */}
          {currentStory.media?.type === 'video' && (
            <Fade in={isPaused} timeout={300}>
              <IconButton
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  },
                }}
              >
                {isPaused ? <PlayArrow fontSize="large" /> : <Pause fontSize="large" />}
              </IconButton>
            </Fade>
          )}
        </Box>

        {/* Story text content overlay */}
        {currentStory.media && (
          <Box sx={{ 
            position: 'absolute', 
            bottom: 120, 
            left: 16, 
            right: 16, 
            color: 'white',
            textShadow: '0 1px 3px rgba(0,0,0,0.5)'
          }}>
            <Typography variant="h6" gutterBottom>
              {currentStory.title}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {currentStory.content}
            </Typography>
            {currentStory.tags.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {currentStory.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={`#${tag}`}
                    size="small"
                    variant="outlined"
                    sx={{ color: 'white', borderColor: 'white' }}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* Action buttons */}
        <Box sx={{ 
          position: 'absolute', 
          bottom: 60, 
          right: 16, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2 
        }}>
          {currentStory.media?.type === 'video' && (
            <IconButton
              onClick={(e) => {
                e.stopPropagation();
                setVideoMuted(!videoMuted);
                setAutoUnmuted(true); // Mark as manually interacted
              }}
              sx={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.6)', 
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
                position: 'relative',
                '&::after': autoUnmuted && videoMuted ? {
                  content: '"Tap to unmute"',
                  position: 'absolute',
                  top: -35,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 1,
                  fontSize: '12px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none'
                } : {}
              }}
            >
              {videoMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          )}
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleLikeStory();
            }}
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.6)', 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
            }}
          >
            <Favorite />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleShareStory();
            }}
            sx={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.6)', 
              color: 'white',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
            }}
          >
            <Share />
          </IconButton>
        </Box>
      </Box>

      {/* Story Analytics Dialog (for own stories) */}
      <Dialog
        open={showViewers && isOwnStory}
        onClose={() => setShowViewers(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Story Analytics</Typography>
            <IconButton onClick={() => setShowViewers(false)}>
              <Close />
            </IconButton>
          </Box>

          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label={`Viewers (${storyViewers.length})`} />
            <Tab label="Engagement" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <List>
              {storyViewers.map((viewer, index) => (
                <ListItem key={index}>
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
              ))}
              {storyViewers.length === 0 && (
                <Typography color="text.secondary" textAlign="center">
                  No viewers yet
                </Typography>
              )}
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Views</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {storyEngagement.views || 0}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Likes</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {storyEngagement.likes || 0}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Shares</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {storyEngagement.shares || 0}
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Reach</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {storyEngagement.reach || 0}
                </Typography>
              </Box>
            </Box>
          </TabPanel>
        </Box>
      </Dialog>
    </Dialog>
  );
};

export default StoryViewer;
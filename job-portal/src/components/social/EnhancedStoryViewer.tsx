import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  Box,
  Typography,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  Paper,
  Backdrop,
  Fade,
  Tooltip,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Close,
  ChevronLeft,
  ChevronRight,
  Favorite,
  FavoriteBorder,
  Share,
  MoreVert,
  Pause,
  PlayArrow,
  VolumeUp,
  VolumeOff,
  Visibility,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { enhancedStoryService, StoryData } from '../../services/enhancedStoryService';

interface EnhancedStoryViewerProps {
  open: boolean;
  onClose: () => void;
  stories: StoryData[];
  initialIndex?: number;
  onStoryChange?: (index: number, story: StoryData) => void;
}

const EnhancedStoryViewer: React.FC<EnhancedStoryViewerProps> = ({
  open,
  onClose,
  stories,
  initialIndex = 0,
  onStoryChange,
}) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mobile touch handling
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  const currentStory = stories[currentIndex];
  const isOwnStory = currentStory?.author?._id === user?._id || currentStory?.author?._id === user?.email;

  // Duration for story progression (6 seconds for images, dynamic for videos)
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const storyDuration = currentStory?.media?.type === 'video' 
    ? (videoDuration ? videoDuration * 1000 : 10000) // Use actual video duration or fallback to 10s
    : 6000;

  // Prevent body scroll on mobile when story viewer is open
  useEffect(() => {
    if (open && isMobile) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      return () => {
        // Restore body scroll
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
      };
    }
  }, [open, isMobile]);

  // Initialize story data
  useEffect(() => {
    if (currentStory) {
      setIsLiked(currentStory.likes?.includes(user?._id || user?.email || '') || false);
      setLikes(currentStory.likes?.length || 0);
      setProgress(0);
      setVideoDuration(null); // Reset video duration for new story
      
      // Mark story as viewed
      if (!isOwnStory) {
        enhancedStoryService.viewStory(currentStory._id!);
      }
      
      // Notify parent about story change
      onStoryChange?.(currentIndex, currentStory);
    }
  }, [currentIndex, currentStory, isOwnStory, user, onStoryChange]);

  // Handle story progression
  useEffect(() => {
    if (!open || isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (storyDuration / 100));
        
        if (newProgress >= 100) {
          // Auto advance to next story
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(prev => prev + 1);
            return 0;
          } else {
            // End of stories, close viewer
            onClose();
            return 100;
          }
        }
        
        return newProgress;
      });
    }, 100);

    progressIntervalRef.current = interval;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [open, isPaused, currentIndex, stories.length, storyDuration, onClose]);

  // Handle controls visibility
  useEffect(() => {
    if (showControls) {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handleLike = async () => {
    if (!currentStory?._id) return;

    const previousLiked = isLiked;
    const previousLikes = likes;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);

    try {
      const response = await enhancedStoryService.likeStory(currentStory._id);
      
      if (response.success) {
        setNotification({
          message: isLiked ? 'Story unliked' : 'Story liked!',
          type: 'success'
        });
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(previousLiked);
      setLikes(previousLikes);
      
      setNotification({
        message: 'Failed to update like status',
        type: 'error'
      });
    }
  };

  const handleShare = () => {
    // Simple share functionality
    if (navigator.share && currentStory) {
      navigator.share({
        title: currentStory.title,
        text: currentStory.content,
        url: window.location.origin
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${currentStory?.title}\n\n${currentStory?.content}`);
      setNotification({
        message: 'Story copied to clipboard!',
        type: 'success'
      });
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
  };

  const handleTouchStart = () => {
    setShowControls(true);
  };

  // Mobile touch handling functions
  const handleTouchStartMobile = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent default touch behavior
    const touch = e.touches[0];
    const touchData = { x: touch.clientX, y: touch.clientY };
    setTouchStart(touchData);
    touchStartRef.current = touchData;
    setShowControls(true);
  };

  const handleTouchMoveMobile = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    const touch = e.touches[0];
    const touchData = { x: touch.clientX, y: touch.clientY };
    setTouchEnd(touchData);
    touchEndRef.current = touchData;
  };

  const handleTouchEndMobile = () => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const minSwipeDistance = 50;

    // Only handle horizontal swipes (ignore vertical swipes)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous story
        handlePrevious();
      } else {
        // Swipe left - go to next story
        handleNext();
      }
    } else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
      // Small movement = tap
      handleTapMobile();
    }

    // Reset touch data
    setTouchStart(null);
    setTouchEnd(null);
    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const handleTapMobile = () => {
    // Single tap to pause/play
    setIsPaused(prev => !prev);
    setShowControls(true);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!open) return;

      switch (event.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case ' ':
          event.preventDefault();
          setIsPaused(prev => !prev);
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [open, handlePrevious, handleNext, onClose]);

  if (!currentStory) return null;

  const getStoryTypeColor = (type: string) => {
    const colors = {
      achievement: '#FFD700',
      learning: '#4CAF50',
      networking: '#2196F3',
      insight: '#9C27B0',
      milestone: '#FF5722',
      announcement: '#FF9800'
    };
    return colors[type as keyof typeof colors] || '#2196F3';
  };

  const getStoryTypeEmoji = (type: string) => {
    const emojis = {
      achievement: '🏆',
      learning: '📚',
      networking: '🤝',
      insight: '💡',
      milestone: '🎯',
      announcement: '📢'
    };
    return emojis[type as keyof typeof emojis] || '📝';
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        fullScreen
        PaperProps={{
          sx: {
            background: 'rgba(0, 0, 0, 0.95)',
            backdropFilter: 'blur(10px)',
          }
        }}
        TransitionComponent={Fade}
      >
        <Backdrop open={open} sx={{ zIndex: -1 }}>
          <Box
            sx={{
              width: '100%',
              height: '100%',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseMove={!isMobile ? handleMouseMove : undefined}
            onTouchStart={isMobile ? handleTouchStartMobile : handleTouchStart}
            onTouchMove={isMobile ? handleTouchMoveMobile : undefined}
            onTouchEnd={isMobile ? handleTouchEndMobile : undefined}
          >
            {/* Progress Indicators */}
            <Box
              sx={{
                position: 'absolute',
                top: 20,
                left: 20,
                right: 20,
                zIndex: 10,
                display: 'flex',
                gap: 1,
              }}
            >
              {stories.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    flex: 1,
                    height: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}
                >
                  <LinearProgress
                    variant="determinate"
                    value={
                      index < currentIndex ? 100 :
                      index === currentIndex ? progress :
                      0
                    }
                    sx={{
                      height: '100%',
                      backgroundColor: 'transparent',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'white',
                      }
                    }}
                  />
                </Box>
              ))}
            </Box>

            {/* Story Content Container */}
            <Box
              sx={{
                width: '100%',
                maxWidth: isMobile ? '100%' : 400,
                height: '100%',
                position: 'relative',
                mx: 'auto',
                px: isMobile ? 1 : 0,
              }}
            >
              {/* Story Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Media Content */}
                  {currentStory.media ? (
                    <Box
                      sx={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {currentStory.media.type === 'video' ? (
                        <video
                          src={currentStory.media.url}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: 12,
                          }}
                          autoPlay
                          muted
                          playsInline
                          loop
                          controls={false}
                          onLoadedMetadata={(e) => {
                            // Set video duration for proper story progression
                            const video = e.target as HTMLVideoElement;
                            if (video.duration) {
                              console.log('Video duration:', video.duration);
                              setVideoDuration(video.duration);
                            }
                          }}
                          onEnded={() => {
                            // Auto advance to next story when video ends
                            handleNext();
                          }}
                        />
                      ) : (
                        <img
                          src={currentStory.media.url}
                          alt={currentStory.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: 12,
                          }}
                        />
                      )}
                    </Box>
                  ) : (
                    /* Text-only story with gradient background */
                    <Box
                      sx={{
                        flex: 1,
                        background: `linear-gradient(135deg, ${getStoryTypeColor(currentStory.type)}40 0%, ${getStoryTypeColor(currentStory.type)}20 100%)`,
                        borderRadius: 3,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        p: 4,
                        m: 2,
                        position: 'relative',
                        '&::before': {
                          content: `"${getStoryTypeEmoji(currentStory.type)}"`,
                          fontSize: '4rem',
                          position: 'absolute',
                          top: 20,
                          right: 20,
                          opacity: 0.3,
                        }
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{
                          color: 'white',
                          fontWeight: 700,
                          textAlign: 'center',
                          mb: 3,
                          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
                        }}
                      >
                        {currentStory.title}
                      </Typography>
                      
                      <Typography
                        variant="body1"
                        sx={{
                          color: 'rgba(255,255,255,0.9)',
                          textAlign: 'center',
                          fontSize: '1.1rem',
                          lineHeight: 1.6,
                          textShadow: '0 1px 5px rgba(0,0,0,0.3)',
                        }}
                      >
                        {currentStory.content}
                      </Typography>
                    </Box>
                  )}

                  {/* Story Info Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
                      p: 3,
                      borderRadius: '0 0 12px 12px',
                    }}
                  >
                    {/* Author Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar 
                        src={currentStory.author?.profilePicture} 
                        sx={{ 
                          width: 48, 
                          height: 48,
                          border: `3px solid ${getStoryTypeColor(currentStory.type)}`,
                        }}
                      >
                        {currentStory.author?.firstName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600 }}>
                          {currentStory.author?.firstName} {currentStory.author?.lastName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {currentStory.author?.jobTitle} at {currentStory.author?.company}
                        </Typography>
                      </Box>
                      <Chip 
                        label={currentStory.type}
                        size="small"
                        sx={{
                          backgroundColor: getStoryTypeColor(currentStory.type),
                          color: 'white',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      />
                    </Box>

                    {/* Story Content (for media stories) */}
                    {currentStory.media && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ color: 'white', mb: 1, fontWeight: 600 }}>
                          {currentStory.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                          {currentStory.content}
                        </Typography>
                      </Box>
                    )}

                    {/* Tags */}
                    {currentStory.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
                        {currentStory.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={`#${tag}`}
                            size="small"
                            variant="outlined"
                            sx={{
                              color: 'rgba(255,255,255,0.8)',
                              borderColor: 'rgba(255,255,255,0.3)',
                              fontSize: '0.7rem',
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Areas (invisible touch/click zones) - Desktop only */}
              {!isMobile && (
                <>
                  <Box
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '30%',
                      zIndex: 5,
                      cursor: 'pointer',
                    }}
                    onClick={handlePrevious}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      bottom: 0,
                      width: '30%',
                      zIndex: 5,
                      cursor: 'pointer',
                    }}
                    onClick={handleNext}
                  />
                  
                  {/* Center tap area for play/pause */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: '30%',
                      right: '30%',
                      top: 0,
                      bottom: 0,
                      zIndex: 5,
                      cursor: 'pointer',
                    }}
                    onClick={() => setIsPaused(prev => !prev)}
                  />
                </>
              )}
            </Box>

            {/* Controls Overlay */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Top Controls */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: isMobile ? 20 : 60,
                      right: isMobile ? 10 : 20,
                      zIndex: 10,
                      display: 'flex',
                      gap: 1,
                    }}
                  >
                    <IconButton
                      onClick={() => setIsPaused(prev => !prev)}
                      sx={{ 
                        color: 'white', 
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                        width: isMobile ? 40 : 48,
                        height: isMobile ? 40 : 48,
                      }}
                    >
                      {isPaused ? <PlayArrow fontSize={isMobile ? 'medium' : 'large'} /> : <Pause fontSize={isMobile ? 'medium' : 'large'} />}
                    </IconButton>
                    <IconButton
                      onClick={onClose}
                      sx={{ 
                        color: 'white', 
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                        width: isMobile ? 40 : 48,
                        height: isMobile ? 40 : 48,
                      }}
                    >
                      <Close fontSize={isMobile ? 'medium' : 'large'} />
                    </IconButton>
                  </Box>

                  {/* Navigation Controls - Desktop only */}
                  {!isMobile && (
                    <>
                      {currentIndex > 0 && (
                        <IconButton
                          onClick={handlePrevious}
                          sx={{
                            position: 'absolute',
                            left: 20,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                            zIndex: 10,
                          }}
                        >
                          <ChevronLeft fontSize="large" />
                        </IconButton>
                      )}

                      {currentIndex < stories.length - 1 && (
                        <IconButton
                          onClick={handleNext}
                          sx={{
                            position: 'absolute',
                            right: 20,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' },
                            zIndex: 10,
                          }}
                        >
                          <ChevronRight fontSize="large" />
                        </IconButton>
                      )}
                    </>
                  )}

                  {/* Bottom Action Controls */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: isMobile ? 10 : 20,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: isMobile ? 1 : 2,
                      zIndex: 10,
                    }}
                  >
                    <Tooltip title={isLiked ? 'Unlike' : 'Like'}>
                      <Paper
                        elevation={3}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: isMobile ? 0.5 : 1,
                          px: isMobile ? 1.5 : 2,
                          py: isMobile ? 0.5 : 1,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 3,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            transform: 'scale(1.05)',
                          }
                        }}
                        onClick={handleLike}
                      >
                        {isLiked ? (
                          <Favorite sx={{ color: '#ff4757', fontSize: isMobile ? '1rem' : '1.2rem' }} />
                        ) : (
                          <FavoriteBorder sx={{ color: 'white', fontSize: isMobile ? '1rem' : '1.2rem' }} />
                        )}
                        <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                          {likes}
                        </Typography>
                      </Paper>
                    </Tooltip>

                    <Tooltip title="Share Story">
                      <Paper
                        elevation={3}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: isMobile ? 36 : 44,
                          height: isMobile ? 36 : 44,
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(10px)',
                          borderRadius: 3,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            transform: 'scale(1.05)',
                          }
                        }}
                        onClick={handleShare}
                      >
                        <Share sx={{ color: 'white', fontSize: isMobile ? '1rem' : '1.2rem' }} />
                      </Paper>
                    </Tooltip>

                    {currentStory.viewers && currentStory.viewers.length > 0 && (
                      <Tooltip title={`${currentStory.viewers.length} views`}>
                        <Paper
                          elevation={3}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? 0.5 : 1,
                            px: isMobile ? 1.5 : 2,
                            py: isMobile ? 0.5 : 1,
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 3,
                          }}
                        >
                          <Visibility sx={{ color: 'white', fontSize: isMobile ? '1rem' : '1.2rem' }} />
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600, fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                            {currentStory.viewers.length}
                          </Typography>
                        </Paper>
                      </Tooltip>
                    )}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile Instructions Overlay */}
            {isMobile && showControls && (
              <Box
                sx={{
                  position: 'absolute',
                  top: isMobile ? 80 : 120,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 10,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem' }}>
                  👆 Tap to pause • 👈👉 Swipe to navigate
                </Typography>
              </Box>
            )}

            {/* Pause Indicator */}
            {isPaused && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 15,
                  color: 'white',
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  borderRadius: '50%',
                  p: 2,
                }}
              >
                <Pause fontSize="large" />
              </Box>
            )}
          </Box>
        </Backdrop>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={2000}
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
    </>
  );
};

export default EnhancedStoryViewer;
import React, { useState, useEffect, useRef } from 'react';
import { useGlobalVideo } from '../../contexts/GlobalVideoContext';
import {
  Card,
  CardContent,
  CardActions,
  Avatar,
  Typography,
  IconButton,
  Box,
  Chip,
  Button,
  Collapse,
  TextField,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogContent,
  alpha,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  MoreVert,
  Business,
  Event,
  LocationOn,
  AttachMoney,
  AccessTime,
  Chat,
  Work,
  Person,
  PlayArrow,
  Pause,
  Fullscreen,
  VolumeOff,
  VolumeUp,
  Close,
  PersonAdd,
  Check,
  ChevronLeft,
  ChevronRight,
  FiberManualRecord,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { SocialPost, SocialComment } from '../../types/social';
import { socialNetworkService } from '../../services/socialNetworkService';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface PostCardProps {
  post: SocialPost;
  onPostUpdate?: (updatedPost: SocialPost) => void;
  onPostDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdate, onPostDelete }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const globalVideo = useGlobalVideo();
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [sharesCount, setSharesCount] = useState(post.sharesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected' | 'loading'>('none');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  // Precompute authorId to avoid undefined access
  const authorId = post?.author?._id;

  // Check connection status on component mount
  useEffect(() => {
    const checkConnectionStatus = async () => {
      if (!user || !authorId || authorId === user._id) return;
      
      try {
        const response = await socialNetworkService.getConnectionStatus(authorId);
        const status = response.data?.status || 'none';
        // Map backend status to component status
        if (status === 'accepted') {
          setConnectionStatus('connected');
        } else if (status === 'pending') {
          setConnectionStatus('pending');
        } else {
          setConnectionStatus('none');
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
        setConnectionStatus('none');
      }
    };

    checkConnectionStatus();
  }, [user?._id, authorId]);

  // Enhanced Intersection Observer for auto-playing videos when scrolled into view
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement || !post.media?.some(media => media.type === 'video')) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const { isIntersecting, intersectionRatio, boundingClientRect } = entry;
          const viewportHeight = window.innerHeight;
          const cardTop = boundingClientRect.top;
          const cardHeight = boundingClientRect.height;
          const cardCenter = cardTop + (cardHeight / 2);
          const viewportMiddle = viewportHeight / 2;
          
          // More generous autoplay conditions for better user experience
          // Auto-play when card is 50% visible and center is in upper half of viewport
          const shouldAutoPlay = isIntersecting && 
                                 intersectionRatio >= 0.5 && 
                                 cardCenter <= viewportMiddle + 100; // Allow some buffer

          if (shouldAutoPlay) {
            // Card is properly positioned and visible, auto-play first video
            const firstVideoIndex = post.media?.findIndex(media => media.type === 'video');
            if (firstVideoIndex !== -1 && firstVideoIndex !== undefined) {
              const videoElement = videoRefs.current[firstVideoIndex];
              const videoId = `${post._id}-${firstVideoIndex}`;
              if (videoElement && videoElement.paused) {
                // Reduced delay for more responsive autoplay
                setTimeout(() => {
                  if (cardRef.current && isElementInOptimalPosition(cardRef.current)) {
                    console.log(`🎬 Auto-playing video ${videoId} for post ${post._id}`);
                    globalVideo.autoPlayVideo(videoId);
                  }
                }, 100);
              }
            }
          } else if (!isIntersecting || intersectionRatio < 0.2) {
            // Card is out of view or barely visible, pause videos
            post.media?.forEach((media, index) => {
              if (media.type === 'video') {
                const videoElement = videoRefs.current[index];
                const videoId = `${post._id}-${index}`;
                if (videoElement && !videoElement.paused) {
                  console.log(`⏸️ Auto-pausing video ${videoId} for post ${post._id}`);
                  pauseVideo(videoElement, videoId);
                }
              }
            });
          }
        });
      },
      {
        root: null, // Use viewport as root
        rootMargin: '-5% 0px -5% 0px', // Less restrictive margins for smoother autoplay
        threshold: [0.2, 0.5, 0.8] // Multiple thresholds for better precision
      }
    );

    observer.observe(cardElement);

    return () => {
      observer.unobserve(cardElement);
    };
  }, [post.media, globalVideo]);

  // Helper function to check if element is in optimal position for autoplay
  const isElementInOptimalPosition = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const cardCenter = rect.top + (rect.height / 2);
    const viewportMiddle = viewportHeight / 2;
    
    // More generous positioning for better autoplay experience
    return rect.top >= -50 && // Allow some buffer above viewport
           rect.bottom <= viewportHeight + 50 && // Allow some buffer below viewport
           cardCenter <= viewportMiddle + 150; // Allow more buffer for center positioning
  };

  const handleLike = async () => {
    try {
      await socialNetworkService.likePost(post._id);
      setLiked(!liked);
      setLikesCount(prev => liked ? prev - 1 : prev + 1);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleCommentToggle = async () => {
    if (!showComments && comments.length === 0) {
      setCommentsLoading(true);
      try {
        const response = await socialNetworkService.getPostComments(post._id);
        setComments(response.data);
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setCommentsLoading(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await socialNetworkService.addComment(post._id, newComment);
      setComments(prev => [response.data, ...prev]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getPostTypeColor = (type: string) => {
    const colors = {
      job_post: '#4caf50',
      event: '#ff9800',
      training: '#2196f3',
      company_update: '#9c27b0',
      text: '#757575'
    };
    return colors[type as keyof typeof colors] || colors.text;
  };

  const formatJobSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) return null;
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const handleShare = async () => {
    try {
      await socialNetworkService.sharePost(post._id);
      setSharesCount(prev => prev + 1);
      
      // Copy post URL to clipboard
      const postUrl = `${window.location.origin}/post/${post._id}`;
      await navigator.clipboard.writeText(postUrl);
      
      console.log('Post shared successfully');
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const handleStartChat = async () => {
    if (!user || !authorId || authorId === user._id) return;
    
    try {
      const chat = await chatService.createOrGetChat(
        [authorId], 
        `Hi! I saw your post about ${post.postType === 'job_post' ? 'the job position' : 'your post'}. I'd like to know more.`
      );
      
      // This would ideally open the chat window or navigate to messages
      // For now, we'll just show a success message
      console.log('Chat started:', chat);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleVideoToggle = (index: number, action: 'play' | 'mute', videoRef?: HTMLVideoElement) => {
    const videoId = `${post._id}-${index}`;
    const videoElement = videoRef || document.querySelector(`video[data-video-id="${videoId}"]`) as HTMLVideoElement;
    
    if (!videoElement) {
      console.error('Video element not found');
      return;
    }

    const currentState = globalVideo.videoStates[videoId] || { playing: false, muted: true };
    
    if (action === 'play') {
      if (currentState.playing) {
        pauseVideo(videoElement, videoId);
      } else {
        playVideo(videoElement, videoId);
      }
    } else if (action === 'mute') {
      const newMuted = !currentState.muted;
      videoElement.muted = newMuted;
      globalVideo.updateVideoState(videoId, { muted: newMuted });
      
      // If unmuting this video, mute all other videos
      if (!newMuted) {
        globalVideo.muteAllVideos();
        // Then unmute this specific video
        videoElement.muted = false;
        globalVideo.updateVideoState(videoId, { muted: false });
      }
    }
  };

  const handleVideoClick = (index: number, videoRef: HTMLVideoElement) => {
    const videoId = `${post._id}-${index}`;
    const currentState = globalVideo.videoStates[videoId] || { playing: false, muted: true };
    // Toggle play/pause
    handleVideoToggle(index, 'play', videoRef);
  };

  // Helper function to validate and clean video URLs
  const validateVideoUrl = (url: string): string | null => {
    try {
      // Check if it's a valid URL
      const urlObj = new URL(url);
      
      // Check if it's a reasonable length (Cloudinary URLs shouldn't be extremely long)
      if (url.length > 2000) {
        console.error('Video URL is suspiciously long:', url.length, 'characters');
        return null;
      }
      
      // Check if it contains expected patterns for video URLs
      if (url.includes('cloudinary.com') || url.includes('blob:') || url.includes('data:')) {
        return url;
      }
      
      return url; // Return as-is for other valid URLs
    } catch (error) {
      console.error('Invalid video URL:', error);
      return null;
    }
  };

  // Enhanced video play function with better error handling and graceful autoplay
  const playVideo = async (videoElement: HTMLVideoElement, videoId: string) => {
    try {
      console.log(`🎬 Attempting to play video ${videoId}`, videoElement);
      
      // Validate video source URL
      const videoSrc = videoElement.src;
      if (!validateVideoUrl(videoSrc)) {
        console.error(`❌ Invalid video URL for video ${videoId}:`, videoSrc);
        globalVideo.updateVideoState(videoId, { playing: false, error: 'Invalid video URL' });
        return;
      }
      
      // Pause all other videos first for better performance
      globalVideo.pauseAllExcept(videoId);
      
      // For autoplay, start muted to comply with browser policies
      // User can manually unmute if desired
      videoElement.muted = true;
      globalVideo.updateVideoState(videoId, { muted: true });
      
      // Ensure video is loaded
      if (videoElement.readyState >= 2) {
        videoElement.currentTime = 0; // Start from beginning
        await videoElement.play();
        globalVideo.updateVideoState(videoId, { playing: true, error: null });
        console.log(`✅ Video ${videoId} started playing successfully`);
      } else {
        console.log(`⏳ Video ${videoId} not ready, waiting for load...`);
        // Wait for video to load
        const loadHandler = async () => {
          try {
            videoElement.currentTime = 0;
            await videoElement.play();
            globalVideo.updateVideoState(videoId, { playing: true, error: null });
            console.log(`✅ Video ${videoId} started playing after load`);
          } catch (error) {
            console.error(`❌ Error playing video ${videoId} after load:`, error);
            globalVideo.updateVideoState(videoId, { playing: false, error: 'Failed to play video' });
          }
        };
        
        const errorHandler = () => {
          console.error(`❌ Video ${videoId} failed to load`);
          globalVideo.updateVideoState(videoId, { playing: false, error: 'Failed to load video' });
        };
        
        videoElement.addEventListener('loadeddata', loadHandler, { once: true });
        videoElement.addEventListener('error', errorHandler, { once: true });
        
        // Set a timeout for loading
        setTimeout(() => {
          if (videoElement.readyState < 2) {
            console.warn(`⏰ Video ${videoId} loading timeout`);
            globalVideo.updateVideoState(videoId, { playing: false, error: 'Video loading timeout' });
          }
        }, 8000); // Reduced timeout for better responsiveness
      }
    } catch (error) {
      console.error(`❌ Error playing video ${videoId}:`, error);
      // If autoplay is blocked, ensure video is muted and show appropriate state
      videoElement.muted = true;
      globalVideo.updateVideoState(videoId, { playing: false, muted: true, error: 'Autoplay blocked - click to play' });
    }
  };

  const pauseVideo = (videoElement: HTMLVideoElement, videoId: string) => {
    console.log(`⏸️ Pausing video ${videoId}`);
    videoElement.pause();
    globalVideo.updateVideoState(videoId, { playing: false });
  };

  const handleViewProfile = () => {
    // Always navigate to summary profile page to maintain consistency
    if (authorId) {
      navigate(`/app/profile/view/${authorId}`);
    }
  };

  const handleConnect = async () => {
    if (!user || !authorId || authorId === user._id || connectionStatus === 'loading') return;
    
    try {
      setConnectionStatus('loading');
      
      if (connectionStatus === 'none') {
        await socialNetworkService.sendConnectionRequest(authorId, 'connect');
        setConnectionStatus('pending');
      } else if (connectionStatus === 'pending') {
        // Cancel request if it was sent by current user
        await socialNetworkService.cancelConnectionRequest(authorId);
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error handling connection:', error);
      // Revert to previous state
      setConnectionStatus(connectionStatus === 'none' ? 'none' : 'pending');
    }
  };

  const getConnectButtonText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'pending': return 'Pending';
      case 'loading': return 'Loading...';
      default: return 'Connect';
    }
  };

  const getConnectButtonIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Check />;
      case 'pending': return <AccessTime />;
      case 'loading': return <AccessTime />;
      default: return <PersonAdd />;
    }
  };

  const getVideoAspectRatio = (media: any) => {
    // Check if video dimensions are available
    if (media.width && media.height) {
      const ratio = media.width / media.height;
      // If video is taller than it is wide (portrait), use 9/16 aspect ratio
      if (ratio < 1) {
        return '9/16';
      }
      // If video is wider than it is tall (landscape), use 16/9 aspect ratio
      return '16/9';
    }
    // Default to 16/9 for unknown dimensions
    return '16/9';
  };

  // Touch/Swipe handling for media carousel
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!post.media || post.media.length <= 1) return;
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !post.media || post.media.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - dragStartX;
    setDragOffset(diff);
  };

  const handleTouchEnd = () => {
    if (!isDragging || !post.media || post.media.length <= 1) return;
    
    // Filter valid media
    const validMedia = post.media.filter(media => media && (media.url || media.thumbnail));
    if (validMedia.length <= 1) return;
    
    const threshold = 50; // Minimum swipe distance
    const mediaCount = validMedia.length;
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        // Swipe right - go to previous media
        setCurrentMediaIndex(prev => prev === 0 ? mediaCount - 1 : prev - 1);
      } else {
        // Swipe left - go to next media
        setCurrentMediaIndex(prev => prev === mediaCount - 1 ? 0 : prev + 1);
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  // Mouse drag handling for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!post.media || post.media.length <= 1) return;
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragOffset(0);
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !post.media || post.media.length <= 1) return;
    const diff = e.clientX - dragStartX;
    setDragOffset(diff);
  };

  const handleMouseUp = () => {
    if (!isDragging || !post.media || post.media.length <= 1) return;
    
    // Filter valid media
    const validMedia = post.media.filter(media => media && (media.url || media.thumbnail));
    if (validMedia.length <= 1) return;
    
    const threshold = 50;
    const mediaCount = validMedia.length;
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        setCurrentMediaIndex(prev => prev === 0 ? mediaCount - 1 : prev - 1);
      } else {
        setCurrentMediaIndex(prev => prev === mediaCount - 1 ? 0 : prev + 1);
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

  // Reset media index when post changes
  useEffect(() => {
    setCurrentMediaIndex(0);
  }, [post._id]);

  const renderMediaGallery = () => {
    console.log('🎬 PostCard renderMediaGallery - Post:', post._id, 'Media:', post.media);
    
    // Check if post has media and it's an array with content
    if (!post.media || !Array.isArray(post.media) || post.media.length === 0) {
      console.log('🎬 No media found for post:', post._id);
      return null;
    }

    // Filter out any null/undefined media items
    const validMedia = post.media.filter(media => media && (media.url || media.thumbnail));
    
    if (validMedia.length === 0) {
      console.log('🎬 No valid media found for post:', post._id);
      return null;
    }

    const mediaCount = validMedia.length;
    const currentMedia = validMedia[currentMediaIndex];
    
    console.log('🎬 Rendering media gallery:', {
      postId: post._id,
      mediaCount,
      currentIndex: currentMediaIndex,
      currentMedia
    });
    
    return (
      <Box sx={{ 
        mb: 2,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Media Container with Carousel */}
        <Box
          ref={mediaContainerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          sx={{
            position: 'relative',
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: theme.palette.grey[100],
            aspectRatio: currentMedia?.type === 'video' ? getVideoAspectRatio(currentMedia) : 'auto',
            maxHeight: { xs: 400, sm: 450, md: 500, lg: 550 },
            width: '100%',
            maxWidth: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: mediaCount > 1 ? 'grab' : 'pointer',
            userSelect: 'none',
            transform: isDragging ? `translateX(${dragOffset * 0.1}px)` : 'none',
            transition: isDragging ? 'none' : 'transform 0.3s ease',
          }}
        >
          {/* Carousel Container - Shows only current media */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Current Media Display */}
            {currentMedia?.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt={`Post media ${currentMediaIndex + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  backgroundColor: '#000',
                }}
                onClick={() => setSelectedMedia(currentMediaIndex)}
              />
            ) : (
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                <video
                  ref={(el) => {
                    videoRefs.current[currentMediaIndex] = el;
                  }}
                  src={currentMedia?.url}
                  poster={currentMedia?.thumbnail}
                  playsInline
                  preload="metadata"
                  data-video-id={`${post._id}-${currentMediaIndex}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    backgroundColor: '#000',
                    cursor: 'pointer',
                  }}
                  muted={globalVideo.videoStates[`${post._id}-${currentMediaIndex}`]?.muted !== false}
                  onClick={(e) => {
                    e.preventDefault();
                    handleVideoClick(currentMediaIndex, e.target as HTMLVideoElement);
                  }}
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    if (currentMedia) {
                      currentMedia.width = video.videoWidth;
                      currentMedia.height = video.videoHeight;
                    }
                  }}
                  onPlay={() => {
                    const videoId = `${post._id}-${currentMediaIndex}`;
                    globalVideo.updateVideoState(videoId, { playing: true, error: null });
                  }}
                  onPause={() => {
                    const videoId = `${post._id}-${currentMediaIndex}`;
                    globalVideo.updateVideoState(videoId, { playing: false });
                  }}
                  onEnded={() => {
                    const videoId = `${post._id}-${currentMediaIndex}`;
                    globalVideo.updateVideoState(videoId, { playing: false });
                  }}
                  onError={(e) => {
                    console.error(`Video ${currentMediaIndex} error:`, e);
                    const videoId = `${post._id}-${currentMediaIndex}`;
                    globalVideo.updateVideoState(videoId, { playing: false, error: 'Failed to load video' });
                  }}
                />
                
                {/* Play/Pause Overlay */}
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVideoToggle(currentMediaIndex, 'play');
                  }}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    color: '#ffffff',
                    opacity: globalVideo.videoStates[`${post._id}-${currentMediaIndex}`]?.playing ? 0 : 1,
                    transition: 'opacity 0.3s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      opacity: 1,
                    },
                  }}
                >
                  {globalVideo.videoStates[`${post._id}-${currentMediaIndex}`]?.playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                </IconButton>

                {/* Video Controls */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 8,
                    right: 8,
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoToggle(currentMediaIndex, 'mute');
                    }}
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      },
                    }}
                  >
                    {globalVideo.videoStates[`${post._id}-${currentMediaIndex}`]?.muted !== false ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedMedia(currentMediaIndex)}
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      },
                    }}
                  >
                    <Fullscreen />
                  </IconButton>
                </Box>
              </Box>
            )}
          </Box>

          {/* Navigation Arrows - Only show if multiple media */}
          {mediaCount > 1 && (
            <>
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex(prev => prev === 0 ? mediaCount - 1 : prev - 1);
                }}
                sx={{
                  position: 'absolute',
                  left: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: '#ffffff',
                  opacity: 0.7,
                  transition: 'opacity 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    opacity: 1,
                  },
                }}
              >
                <ChevronLeft />
              </IconButton>

              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentMediaIndex(prev => prev === mediaCount - 1 ? 0 : prev + 1);
                }}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: '#ffffff',
                  opacity: 0.7,
                  transition: 'opacity 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    opacity: 1,
                  },
                }}
              >
                <ChevronRight />
              </IconButton>
            </>
          )}

          {/* Media Indicators/Dots */}
          {mediaCount > 1 && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 1,
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: 2,
                padding: '4px 8px',
              }}
            >
              {post.media.map((_, index) => (
                <Box
                  key={index}
                  onClick={() => setCurrentMediaIndex(index)}
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: index === currentMediaIndex ? '#ffffff' : alpha('#ffffff', 0.5),
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      backgroundColor: '#ffffff',
                      transform: 'scale(1.2)',
                    },
                  }}
                />
              ))}
            </Box>
          )}

          {/* Media Counter */}
          {mediaCount > 1 && (
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                color: '#ffffff',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {currentMediaIndex + 1} / {mediaCount}
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Card
      ref={cardRef}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        y: -2,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 12px 40px rgba(0,0,0,0.4)' 
          : '0 12px 40px rgba(102, 126, 234, 0.15)',
        transition: { duration: 0.3 }
      }}
      sx={{
        mb: { xs: 3, sm: 3.5, md: 4, lg: 4.5 }, // Enhanced spacing for larger posts
        borderRadius: { xs: 3, sm: 4, md: 4, lg: 5 }, // More rounded corners
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 50%, rgba(240,244,248,1) 100%)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(102, 126, 234, 0.08)'}`,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)' 
          : '0 8px 32px rgba(102, 126, 234, 0.1), 0 0 0 1px rgba(102, 126, 234, 0.05)',
        width: '100%',
        maxWidth: '100%', // Full width to take advantage of larger grid space
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        // Remove height restrictions to let content flow naturally
        minHeight: { 
          xs: '320px', // Larger minimum height for better content display
          sm: '350px', 
          md: '400px', 
          lg: '420px', 
          xl: '450px'
        },
        // No scale transforms - let posts be full size
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #4facfe 100%)',
          borderRadius: '5px 5px 0 0',
          opacity: 0.8,
        },
        '&:hover': {
          '&::before': {
            opacity: 1,
          }
        }
      }}
    >
      {/* Post Header */}
      <CardContent sx={{ 
        pb: { xs: 2, sm: 2.5, md: 3 }, // Enhanced bottom padding
        pt: { xs: 2.5, sm: 3, md: 3.5 }, // More generous top padding
        px: { xs: 2, sm: 2.5, md: 3, lg: 3.5 }, // Enhanced horizontal padding progression
        maxWidth: '100%',
        width: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: { xs: 2.5, sm: 2.5, md: 3 } }}>
          <Avatar
            src={post?.author?.profilePicture || undefined}
            sx={{ 
              width: { xs: 48, sm: 52, md: 56, lg: 60 }, // Larger, more prominent avatars
              height: { xs: 48, sm: 52, md: 56, lg: 60 }, 
              mr: { xs: 2, sm: 2.2, md: 2.5, lg: 3 }, // Enhanced margin progression
              cursor: 'pointer',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 4px 16px rgba(0,0,0,0.3)'
                : '0 4px 16px rgba(102, 126, 234, 0.2)',
              border: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(102, 126, 234, 0.1)'}`,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.08) translateY(-2px)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 6px 20px rgba(0,0,0,0.4)'
                  : '0 6px 20px rgba(102, 126, 234, 0.25)',
              }
            }}
            onClick={handleViewProfile}
          >
            {(post?.author?.firstName?.[0] || '')}{(post?.author?.lastName?.[0] || '')}
          </Avatar>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.15rem', lg: '1.2rem' }, // Larger, more prominent text
                cursor: 'pointer',
                lineHeight: 1.3,
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.87)',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  color: 'primary.main',
                  transform: 'translateX(2px)',
                }
              }}
              onClick={handleViewProfile}
            >
              {(post?.author?.firstName || '')} {(post?.author?.lastName || '')}
            </Typography>
            {post?.author?.jobTitle && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '0.9rem', md: '0.95rem' },
                  fontWeight: 500,
                  mt: 0.5,
                  lineHeight: 1.4,
                }}
              >
                {post?.author?.jobTitle} {post?.author?.company && `at ${post?.author?.company}`}
              </Typography>
            )}
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.8rem' },
                fontWeight: 500,
                mt: 0.5,
                display: 'block',
                opacity: 0.8,
              }}
            >
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Connect Button - Only show if not the current user's post */}
            {user && authorId && authorId !== user._id && (
              <Button
                size="small"
                variant={connectionStatus === 'connected' ? 'contained' : 'outlined'}
                color={connectionStatus === 'connected' ? 'success' : 'primary'}
                startIcon={getConnectButtonIcon()}
                onClick={handleConnect}
                disabled={connectionStatus === 'loading'}
                sx={{
                  minWidth: 100,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  borderRadius: 2,
                }}
              >
                {getConnectButtonText()}
              </Button>
            )}
            
            <Chip
              label={post.postType ? post.postType.replace('_', ' ').toUpperCase() : 'TEXT'}
              size="small"
              sx={{
                backgroundColor: getPostTypeColor(post.postType || 'text'),
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.75rem'
              }}
            />
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Post Content */}
        <Typography variant="body1" sx={{ 
          mb: { xs: 1, sm: 1, md: 1 }, // More compact margins on very small tablets
          lineHeight: { xs: 1.3, sm: 1.4, md: 1.5 }, // Much tighter on very small tablets
          fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' }, // Much smaller on very small tablets
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          maxWidth: '100%'
        }}>
          {post.content}
        </Typography>

        {/* Media Gallery */}
        {renderMediaGallery()}

        {/* Tags */}
        {post.tags.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {post.tags.map((tag, index) => (
              <Chip
                key={index}
                label={`#${tag}`}
                size="small"
                variant="outlined"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}

        {/* Related Job */}
        {post.relatedJob && (
          <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Business color="primary" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {post.relatedJob.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {post.relatedJob.company} • {post.relatedJob.location}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOn fontSize="small" color="disabled" />
                    <Typography variant="caption">{post.relatedJob.jobType}</Typography>
                  </Box>
                  {post.relatedJob.salary && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AttachMoney fontSize="small" color="disabled" />
                      <Typography variant="caption">
                        {formatJobSalary(post.relatedJob.salary)}
                      </Typography>
                    </Box>
                  )}
                  {post.relatedJob.applicationDeadline && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime fontSize="small" color="disabled" />
                      <Typography variant="caption">
                        Deadline: {new Date(post.relatedJob.applicationDeadline).toLocaleDateString()}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Card>
        )}

        {/* Related Event */}
        {post.relatedEvent && (
          <Card variant="outlined" sx={{ mb: 2, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Event color="primary" />
              <Box>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {post.relatedEvent.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {new Date(post.relatedEvent.date).toLocaleDateString()} • {post.relatedEvent.location}
                </Typography>
                <Typography variant="caption" color="primary">
                  {post.relatedEvent.eventType.replace('_', ' ').toUpperCase()}
                </Typography>
              </Box>
            </Box>
          </Card>
        )}
      </CardContent>

      {/* Post Actions */}
      <CardActions sx={{ px: { xs: 2, sm: 2.5, md: 2 }, pb: { xs: 1.5, sm: 1.8, md: 1 }, pt: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 1.2, md: 1 }, flexGrow: 1 }}>
          <IconButton 
            onClick={handleLike} 
            color={liked ? 'error' : 'default'}
            sx={{ 
              p: { xs: 1.2, sm: 1, md: 1 } // Larger touch target for small tablets
            }}
          >
            {liked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {likesCount}
          </Typography>

          <IconButton 
            onClick={handleCommentToggle}
            sx={{ 
              p: { xs: 1.2, sm: 1, md: 1 } // Larger touch target for small tablets
            }}
          >
            <Comment />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {post.commentsCount}
          </Typography>

          <IconButton 
            onClick={handleShare}
            sx={{ 
              p: { xs: 1.2, sm: 1, md: 1 } // Larger touch target for small tablets
            }}
          >
            <Share />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {sharesCount}
          </Typography>

          {/* Chat Button - Only show if not the current user's post */}
          {user && authorId && authorId !== user._id && (
            <IconButton 
              onClick={handleStartChat}
              sx={{ 
                ml: 'auto',
                p: { xs: 1.2, sm: 1, md: 1 } // Larger touch target for small tablets
              }}
              color="primary"
            >
              <Chat />
            </IconButton>
          )}
        </Box>
      </CardActions>

      {/* Comments Section */}
      <Collapse in={showComments}>
        <Divider />
        <Box sx={{ p: 2 }}>
          {/* Add Comment */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
            >
              Post
            </Button>
          </Box>

          {/* Comments List */}
          {commentsLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Loading comments...
            </Typography>
          ) : (
            comments.map((comment) => (
              <Box key={comment._id} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Avatar
                  src={comment.author.profilePicture}
                  sx={{ width: 32, height: 32 }}
                >
                  {comment.author.firstName[0]}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.05)' 
                        : 'rgba(0,0,0,0.05)',
                      borderRadius: 2,
                      p: 1.5
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {comment.author.firstName} {comment.author.lastName}
                    </Typography>
                    <Typography variant="body2">
                      {comment.content}
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </Typography>
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Collapse>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>Share</MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>Save</MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>Report</MenuItem>
      </Menu>

      {/* Media Viewer Dialog */}
      <Dialog
        open={selectedMedia !== null}
        onClose={() => setSelectedMedia(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            borderRadius: 2,
          }
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {selectedMedia !== null && post.media?.[selectedMedia] && (
            <>
              <IconButton
                onClick={() => setSelectedMedia(null)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  zIndex: 1,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  }
                }}
              >
                <Close />
              </IconButton>

              {post.media[selectedMedia].type === 'image' ? (
                <img
                  src={post.media[selectedMedia].url}
                  alt={`Media ${selectedMedia + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <video
                  src={post.media[selectedMedia].url}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '90vh',
                    objectFit: 'contain',
                    backgroundColor: '#000',
                  }}
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    if (post.media && post.media[selectedMedia]) {
                      post.media[selectedMedia].width = video.videoWidth;
                      post.media[selectedMedia].height = video.videoHeight;
                    }
                  }}
                />
              )}

              {/* Navigation arrows for multiple media */}
              {post.media.length > 1 && (
                <>
                  <IconButton
                    onClick={() => setSelectedMedia(selectedMedia > 0 ? selectedMedia - 1 : post.media!.length - 1)}
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      }
                    }}
                  >
                    <PlayArrow sx={{ transform: 'rotate(180deg)' }} />
                  </IconButton>

                  <IconButton
                    onClick={() => setSelectedMedia(selectedMedia < post.media!.length - 1 ? selectedMedia + 1 : 0)}
                    sx={{
                      position: 'absolute',
                      right: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      }
                    }}
                  >
                    <PlayArrow />
                  </IconButton>

                  {/* Media counter */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: '#ffffff',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {selectedMedia + 1} / {post.media.length}
                    </Typography>
                  </Box>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PostCard;
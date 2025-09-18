import React, { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogContent,
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
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [sharesCount, setSharesCount] = useState(post.sharesCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null);
  const [videoStates, setVideoStates] = useState<{ [key: number]: { playing: boolean; muted: boolean; error?: string | null } }>({});
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected' | 'loading'>('none');
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

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

  // Intersection Observer for auto-playing videos when in view
  useEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement || !post.media?.some(media => media.type === 'video')) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Card is in view, auto-play videos
            post.media?.forEach((media, index) => {
              if (media.type === 'video') {
                const videoElement = videoRefs.current[index];
                if (videoElement && videoElement.paused) {
                  playVideo(videoElement, index);
                }
              }
            });
          } else {
            // Card is out of view, pause videos
            post.media?.forEach((media, index) => {
              if (media.type === 'video') {
                const videoElement = videoRefs.current[index];
                if (videoElement && !videoElement.paused) {
                  pauseVideo(videoElement, index);
                }
              }
            });
          }
        });
      },
      {
        root: null, // Use viewport as root
        rootMargin: '-50px 0px -50px 0px', // Trigger when 50px visible
        threshold: 0.5 // Trigger when 50% of card is visible
      }
    );

    observer.observe(cardElement);

    return () => {
      observer.unobserve(cardElement);
    };
  }, [post.media]);

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
    // Use the passed videoRef or find by data-index
    const videoElement = videoRef || document.querySelector(`video[data-index="${index}"][data-post="${post._id}"]`) as HTMLVideoElement;
    
    if (!videoElement) {
      console.error('Video element not found');
      return;
    }

    const currentState = videoStates[index] || { playing: false, muted: true };
    
    if (action === 'play') {
      if (currentState.playing) {
        pauseVideo(videoElement, index);
      } else {
        playVideo(videoElement, index);
      }
    } else if (action === 'mute') {
      const newMuted = !currentState.muted;
      videoElement.muted = newMuted;
      setVideoStates(prev => ({
        ...prev,
        [index]: { ...prev[index], muted: newMuted }
      }));
    }
  };

  const handleVideoClick = (index: number, videoRef: HTMLVideoElement) => {
    const currentState = videoStates[index] || { playing: false, muted: true };
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

  // Enhanced video play function with better error handling
  const playVideo = async (videoElement: HTMLVideoElement, index: number) => {
    try {
      console.log(`Attempting to play video ${index}`, videoElement);
      
      // Validate video source URL
      const videoSrc = videoElement.src;
      if (!validateVideoUrl(videoSrc)) {
        console.error(`Invalid video URL for video ${index}:`, videoSrc);
        setVideoStates(prev => ({
          ...prev,
          [index]: { ...prev[index], playing: false, error: 'Invalid video URL' }
        }));
        return;
      }
      
      // Ensure video is loaded
      if (videoElement.readyState >= 2) {
        videoElement.currentTime = 0; // Start from beginning
        await videoElement.play();
        setVideoStates(prev => ({
          ...prev,
          [index]: { ...prev[index], playing: true, error: null }
        }));
        console.log(`Video ${index} started playing`);
      } else {
        console.log(`Video ${index} not ready, waiting for load...`);
        // Wait for video to load
        const loadHandler = async () => {
          try {
            videoElement.currentTime = 0;
            await videoElement.play();
            setVideoStates(prev => ({
              ...prev,
              [index]: { ...prev[index], playing: true, error: null }
            }));
            console.log(`Video ${index} started playing after load`);
          } catch (error) {
            console.error(`Error playing video ${index} after load:`, error);
            setVideoStates(prev => ({
              ...prev,
              [index]: { ...prev[index], playing: false, error: 'Failed to play video' }
            }));
          }
        };
        
        const errorHandler = () => {
          console.error(`Video ${index} failed to load`);
          setVideoStates(prev => ({
            ...prev,
            [index]: { ...prev[index], playing: false, error: 'Failed to load video' }
          }));
        };
        
        videoElement.addEventListener('loadeddata', loadHandler, { once: true });
        videoElement.addEventListener('error', errorHandler, { once: true });
        
        // Set a timeout for loading
        setTimeout(() => {
          if (videoElement.readyState < 2) {
            console.warn(`Video ${index} loading timeout`);
            setVideoStates(prev => ({
              ...prev,
              [index]: { ...prev[index], playing: false, error: 'Video loading timeout' }
            }));
          }
        }, 10000); // 10 second timeout
      }
    } catch (error) {
      console.error(`Error playing video ${index}:`, error);
      // If autoplay is blocked, update state anyway for UI feedback
      setVideoStates(prev => ({
        ...prev,
        [index]: { ...prev[index], playing: false, error: 'Autoplay blocked or error occurred' }
      }));
    }
  };

  const pauseVideo = (videoElement: HTMLVideoElement, index: number) => {
    console.log(`Pausing video ${index}`);
    videoElement.pause();
    setVideoStates(prev => ({
      ...prev,
      [index]: { ...prev[index], playing: false }
    }));
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

  const renderMediaGallery = () => {
    if (!post.media || post.media.length === 0) return null;

    const mediaCount = post.media.length;
    
    return (
      <Box sx={{ mb: 2 }}>
        {mediaCount === 1 ? (
          // Single media - full width
          <Box
            sx={{
              position: 'relative',
              borderRadius: 2,
              overflow: 'hidden',
              backgroundColor: theme.palette.grey[100],
              aspectRatio: post.media[0].type === 'video' ? getVideoAspectRatio(post.media[0]) : 'auto',
              maxHeight: { xs: 360, sm: 420, md: 600 },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {post.media[0].type === 'image' ? (
              <img
                src={post.media[0].url}
                alt="Post media"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  cursor: 'pointer',
                  backgroundColor: '#000',
                }}
                onClick={() => setSelectedMedia(0)}
              />
            ) : (
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                <Box sx={{ position: 'relative', height: '100%' }}>
                  <video
                    ref={(el) => {
                      videoRefs.current[0] = el;
                    }}
                    src={post.media[0].url}
                    poster={post.media[0].thumbnail}
                    playsInline
                    preload="metadata"
                    data-index="0"
                    data-post={post._id}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      backgroundColor: '#000',
                      cursor: 'pointer',
                    }}
                    muted={videoStates[0]?.muted !== false}
                    onClick={(e) => {
                      e.preventDefault();
                      handleVideoClick(0, e.target as HTMLVideoElement);
                    }}
                    onLoadedMetadata={(e) => {
                      const video = e.target as HTMLVideoElement;
                      // Update video dimensions for better aspect ratio handling
                      if (post.media && post.media[0]) {
                        post.media[0].width = video.videoWidth;
                        post.media[0].height = video.videoHeight;
                      }
                    }}
                    onPlay={() => {
                      setVideoStates(prev => ({
                        ...prev,
                        [0]: { ...prev[0], playing: true }
                      }));
                    }}
                    onPause={() => {
                      setVideoStates(prev => ({
                        ...prev,
                        [0]: { ...prev[0], playing: false }
                      }));
                    }}
                    onEnded={() => {
                      setVideoStates(prev => ({
                        ...prev,
                        [0]: { ...prev[0], playing: false }
                      }));
                    }}
                  />
                  
                  {/* Play/Pause Overlay */}
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoToggle(0, 'play');
                    }}
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      opacity: videoStates[0]?.playing ? 0 : 1,
                      transition: 'opacity 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        opacity: 1,
                      },
                    }}
                  >
                    {videoStates[0]?.playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                  </IconButton>

                  {/* Video Controls Overlay */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                      padding: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      '&:hover': {
                        opacity: 1,
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoToggle(0, 'mute');
                        }}
                        sx={{ color: 'white' }}
                      >
                        {videoStates[0]?.muted !== false ? <VolumeOff /> : <VolumeUp />}
                      </IconButton>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedMedia(0)}
                      sx={{ color: 'white' }}
                    >
                      <Fullscreen />
                    </IconButton>
                  </Box>
                </Box>
                {/* Enhanced video controls overlay */}
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
                      handleVideoToggle(0, 'mute');
                    }}
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      },
                    }}
                  >
                    {videoStates[0]?.muted !== false ? <VolumeOff /> : <VolumeUp />}
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setSelectedMedia(0)}
                    sx={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
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
        ) : (
          // Multiple media - grid layout
          <Box sx={{ display: 'grid', gap: 1, borderRadius: 2, overflow: 'hidden' }}>
            {mediaCount === 2 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {post.media.slice(0, 2).map((media, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      aspectRatio: '1',
                      backgroundColor: theme.palette.grey[100],
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={`Post media ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          backgroundColor: '#000',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedMedia(index)}
                      />
                    ) : (
                      <Box sx={{ position: 'relative', height: '100%' }}>
                        {validateVideoUrl(media.url) ? (
                          <video
                            src={media.url}
                            poster={media.thumbnail}
                            muted
                            playsInline
                            preload="metadata"
                            data-index={index}
                            data-post={post._id}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              backgroundColor: '#000',
                              cursor: 'pointer',
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              handleVideoClick(index, e.target as HTMLVideoElement);
                            }}
                            onLoadedMetadata={(e) => {
                              const video = e.target as HTMLVideoElement;
                              if (media) {
                                media.width = video.videoWidth;
                                media.height = video.videoHeight;
                              }
                            }}
                            onPlay={() => {
                              setVideoStates(prev => ({
                                ...prev,
                                [index]: { ...prev[index], playing: true, error: null }
                              }));
                            }}
                            onPause={() => {
                              setVideoStates(prev => ({
                                ...prev,
                                [index]: { ...prev[index], playing: false }
                              }));
                            }}
                            onEnded={() => {
                              setVideoStates(prev => ({
                                ...prev,
                                [index]: { ...prev[index], playing: false }
                              }));
                            }}
                            onError={(e) => {
                              console.error(`Video ${index} error:`, e);
                              setVideoStates(prev => ({
                                ...prev,
                                [index]: { ...prev[index], playing: false, error: 'Failed to load video' }
                              }));
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#000',
                              color: 'white',
                              flexDirection: 'column',
                              gap: 1
                            }}
                          >
                            <Typography variant="body2">Video unavailable</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Invalid video URL
                            </Typography>
                          </Box>
                        )}
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoToggle(index, 'play');
                          }}
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            opacity: videoStates[index]?.playing ? 0 : 1,
                            transition: 'opacity 0.3s ease',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                              opacity: 1,
                            },
                          }}
                        >
                          {videoStates[index]?.playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                        </IconButton>
                        
                        {/* Error overlay */}
                        {videoStates[index]?.error && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              backgroundColor: 'rgba(255, 0, 0, 0.8)',
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: 1,
                              fontSize: '0.75rem',
                            }}
                          >
                            {videoStates[index]?.error}
                          </Box>
                        )}
                        
                        {/* Mute/Unmute button for grid videos */}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVideoToggle(index, 'mute');
                          }}
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            },
                          }}
                        >
                          {videoStates[index]?.muted !== false ? <VolumeOff /> : <VolumeUp />}
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            )}
            
            {mediaCount >= 3 && (
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 1, aspectRatio: '2/1' }}>
                {/* First large media */}
                <Box
                  sx={{
                    position: 'relative',
                    backgroundColor: theme.palette.grey[100],
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  {post.media[0].type === 'image' ? (
                    <img
                      src={post.media[0].url}
                      alt="Post media 1"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        backgroundColor: '#000',
                        cursor: 'pointer',
                      }}
                      onClick={() => setSelectedMedia(0)}
                    />
                  ) : (
                    <Box sx={{ position: 'relative', height: '100%' }}>
                      <video
                        src={post.media[0].url}
                        poster={post.media[0].thumbnail}
                        muted
                        playsInline
                        preload="metadata"
                        data-index="0"
                        data-post={post._id}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          backgroundColor: '#000',
                          cursor: 'pointer',
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          handleVideoClick(0, e.target as HTMLVideoElement);
                        }}
                        onLoadedMetadata={(e) => {
                          const video = e.target as HTMLVideoElement;
                          if (post.media && post.media[0]) {
                            post.media[0].width = video.videoWidth;
                            post.media[0].height = video.videoHeight;
                          }
                        }}
                        onPlay={() => {
                          setVideoStates(prev => ({
                            ...prev,
                            [0]: { ...prev[0], playing: true }
                          }));
                        }}
                        onPause={() => {
                          setVideoStates(prev => ({
                            ...prev,
                            [0]: { ...prev[0], playing: false }
                          }));
                        }}
                        onEnded={() => {
                          setVideoStates(prev => ({
                            ...prev,
                            [0]: { ...prev[0], playing: false }
                          }));
                        }}
                      />
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVideoToggle(0, 'play');
                        }}
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: 'rgba(0, 0, 0, 0.6)',
                          color: 'white',
                          opacity: videoStates[0]?.playing ? 0 : 1,
                          transition: 'opacity 0.3s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            opacity: 1,
                          },
                        }}
                      >
                        {videoStates[0]?.playing ? <Pause fontSize="large" /> : <PlayArrow fontSize="large" />}
                      </IconButton>
                    </Box>
                  )}
                </Box>
                
                {/* Smaller media grid */}
                <Box sx={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 1 }}>
                  {post.media.slice(1, 3).map((media, index) => (
                    <Box
                      key={index + 1}
                      sx={{
                        position: 'relative',
                        backgroundColor: theme.palette.grey[100],
                        borderRadius: 1,
                        overflow: 'hidden',
                      }}
                    >
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt={`Post media ${index + 2}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            backgroundColor: '#000',
                            cursor: 'pointer',
                          }}
                          onClick={() => setSelectedMedia(index + 1)}
                        />
                      ) : (
                        <Box sx={{ position: 'relative', height: '100%' }}>
                          <video
                            src={media.url}
                            poster={media.thumbnail}
                            muted
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          <IconButton
                            onClick={() => setSelectedMedia(index + 1)}
                            sx={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              fontSize: '1.2rem',
                            }}
                          >
                            <PlayArrow />
                          </IconButton>
                        </Box>
                      )}
                      
                      {/* Show "+X more" overlay for the last visible item if there are more media */}
                      {index === 1 && mediaCount > 3 && (
                        <Box
                          onClick={() => setSelectedMedia(index + 1)}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                            +{mediaCount - 3} more
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Card
      ref={cardRef}
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      sx={{
        mb: 2,
        borderRadius: 2,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 4px 20px rgba(0,0,0,0.3)' 
          : '0 2px 10px rgba(0,0,0,0.1)',
      }}
    >
      {/* Post Header */}
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            src={post?.author?.profilePicture || undefined}
            sx={{ 
              width: 48, 
              height: 48, 
              mr: 2,
              cursor: 'pointer',
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s ease-in-out'
              }
            }}
            onClick={handleViewProfile}
          >
            {(post?.author?.firstName?.[0] || '')}{(post?.author?.lastName?.[0] || '')}
          </Avatar>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                fontSize: '1rem',
                cursor: 'pointer',
                '&:hover': {
                  color: 'primary.main',
                  textDecoration: 'underline'
                }
              }}
              onClick={handleViewProfile}
            >
              {(post?.author?.firstName || '')} {(post?.author?.lastName || '')}
            </Typography>
            {post?.author?.jobTitle && (
              <Typography variant="body2" color="text.secondary">
                {post?.author?.jobTitle} {post?.author?.company && `at ${post?.author?.company}`}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
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
              label={post.postType.replace('_', ' ').toUpperCase()}
              size="small"
              sx={{
                backgroundColor: getPostTypeColor(post.postType),
                color: 'white',
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
        <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
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
      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <IconButton onClick={handleLike} color={liked ? 'error' : 'default'}>
            {liked ? <Favorite /> : <FavoriteBorder />}
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {likesCount}
          </Typography>

          <IconButton onClick={handleCommentToggle}>
            <Comment />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {post.commentsCount}
          </Typography>

          <IconButton onClick={handleShare}>
            <Share />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            {sharesCount}
          </Typography>

          {/* Chat Button - Only show if not the current user's post */}
          {user && authorId && authorId !== user._id && (
            <IconButton 
              onClick={handleStartChat}
              sx={{ ml: 'auto' }}
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
                  color: 'white',
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
                      color: 'white',
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
                      color: 'white',
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
                      color: 'white',
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
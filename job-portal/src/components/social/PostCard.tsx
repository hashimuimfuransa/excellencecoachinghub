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
  ThumbUp,
  ThumbDown,
  SentimentSatisfiedAlt,
  CelebrationOutlined,
  EmojiEmotions,
  Reply,
  Send,
  EmojiEmotionsOutlined,
  Add,
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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [liked, setLiked] = useState(post.likes?.includes(user?._id || '') || false);
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [reactionMenuAnchor, setReactionMenuAnchor] = useState<null | HTMLElement>(null);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerCommentId, setEmojiPickerCommentId] = useState<string | null>(null);
  const [currentReaction, setCurrentReaction] = useState<string>('like');
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected' | 'loading'>('none');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});
  const mediaContainerRef = useRef<HTMLDivElement>(null);

  // Precompute authorId to avoid undefined access
  const authorId = post?.author?._id;

  // Text formatting helper
  const formatPostText = (text: string) => {
    if (!text) return '';
    
    // Split text into paragraphs and clean up
    return text
      .split('\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .join('\n\n');
  };

  // Check if text should be truncated based on line count
  const shouldTruncateText = (text: string) => {
    if (!text) return false;
    
    // Count lines by splitting on newlines and checking for wrapping
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const totalLines = lines.reduce((acc, line) => {
      // Estimate lines based on character count and container width
      const estimatedLines = Math.ceil(line.length / (isMobile ? 35 : isTablet ? 45 : 55));
      return acc + Math.max(1, estimatedLines);
    }, 0);
    
    // Show "View More" if more than 2 lines
    return totalLines > 2;
  };

  // Get truncated text based on line count
  const getTruncatedText = (text: string) => {
    if (!shouldTruncateText(text)) return text;
    
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
        // If adding this line would exceed max lines, truncate it
        const remainingChars = (maxLines - currentLineCount) * (isMobile ? 35 : isTablet ? 45 : 55);
        if (remainingChars > 0) {
          truncatedLines.push(line.substring(0, remainingChars) + '...');
        }
        break;
      }
    }
    
    return truncatedLines.join('\n');
  };

  // Update like state when post or user changes
  useEffect(() => {
    setLiked(post.likes?.includes(user?._id || '') || false);
    setLikesCount(post.likesCount || 0);
    setSharesCount(post.sharesCount || 0);
  }, [post.likes, post.likesCount, post.sharesCount, user?._id]);

  // Add CSS animation for heartbeat effect
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes heartbeat {
        0% { transform: scale(1); }
        25% { transform: scale(1.1); }
        50% { transform: scale(1); }
        75% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

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

  // Emoji reactions
  const reactions = [
    { type: 'like', icon: ThumbUp, color: '#1877f2', label: 'Like' },
    { type: 'love', icon: Favorite, color: '#e91e63', label: 'Love' },
    { type: 'laugh', icon: SentimentSatisfiedAlt, color: '#ffc107', label: 'Haha' },
    { type: 'celebrate', icon: CelebrationOutlined, color: '#ff9800', label: 'Celebrate' },
    { type: 'wow', icon: EmojiEmotions, color: '#2196f3', label: 'Wow' },
  ];

  const handleLike = async (reactionType: string = 'like') => {
    try {
      await socialNetworkService.likePost(post._id);
      setLiked(!liked);
      setLikesCount(prev => liked ? prev - 1 : prev + 1);
      setCurrentReaction(reactionType);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleReactionSelect = (reactionType: string) => {
    handleLike(reactionType);
    setReactionMenuAnchor(null);
  };

  const handleCommentToggle = async () => {
    // Always fetch comments when opening the comments section
    if (!showComments) {
      setCommentsLoading(true);
      try {
        console.log('🚀 Fetching comments for post:', post._id);
        const response = await socialNetworkService.getPostComments(post._id);
        console.log('📥 Raw comments response:', response);
        console.log('📥 Response type:', typeof response);
        console.log('📥 Is array:', Array.isArray(response));
        
        // The service already extracts response.data.data or response.data
        const commentsData = Array.isArray(response) ? response : (response?.data || []);
        console.log('📊 Processed comments data:', commentsData);
        console.log('📊 Number of comments found:', commentsData.length);
        
        setComments(commentsData);
        
        // Log each comment for debugging
        commentsData.forEach((comment, index) => {
          console.log(`💬 Comment ${index + 1}:`, {
            id: comment._id,
            content: comment.content?.substring(0, 50) + (comment.content?.length > 50 ? '...' : ''),
            author: comment.author?.firstName + ' ' + comment.author?.lastName,
            repliesCount: comment.repliesCount,
            repliesLength: comment.replies?.length || 0,
            hasReplies: comment.replies?.length > 0
          });
        });
      } catch (error) {
        console.error('Error loading comments:', error);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    }
    setShowComments(!showComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await socialNetworkService.addComment(post._id, newComment, replyingTo || undefined);
      const newCommentData = response;
      
      // Ensure the new comment has proper structure
      const safeComment = {
        _id: newCommentData._id || Math.random().toString(),
        author: newCommentData.author || {
          _id: user?._id || 'unknown',
          firstName: user?.firstName || 'Unknown',
          lastName: user?.lastName || 'User',
          profilePicture: user?.profilePicture || ''
        },
        content: newCommentData.content || newComment,
        likesCount: newCommentData.likesCount || 0,
        repliesCount: newCommentData.repliesCount || 0,
        createdAt: newCommentData.createdAt || new Date().toISOString()
      };
      
      setComments(prev => [safeComment, ...prev]);
      setNewComment('');
      setReplyingTo(null);
      
      console.log('Comment added successfully:', safeComment);
    } catch (error) {
      console.error('Error adding comment:', error);
      // Still add a local comment for better UX
      const fallbackComment = {
        _id: Math.random().toString(),
        author: {
          _id: user?._id || 'unknown',
          firstName: user?.firstName || 'Unknown',
          lastName: user?.lastName || 'User',
          profilePicture: user?.profilePicture || ''
        },
        content: newComment,
        likesCount: 0,
        repliesCount: 0,
        createdAt: new Date().toISOString()
      };
      setComments(prev => [fallbackComment, ...prev]);
      setNewComment('');
      setReplyingTo(null);
    }
  };

  const handleReplyToComment = (commentId: string) => {
    setReplyingTo(commentId);
    setReplyContent('');
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const addEmojiToComment = (emoji: string, commentId: string) => {
    if (commentId === 'new') {
      setNewComment(prev => prev + emoji);
    } else if (commentId) {
      setReplyContent(prev => prev + emoji);
    }
    setShowEmojiPicker(false);
    setEmojiPickerCommentId(null);
  };

  const refreshComments = async () => {
    console.log('🔄 Manually refreshing comments...');
    console.log('🔄 Post ID:', post._id);
    console.log('🔄 Post comments count:', post.commentsCount);
    setCommentsLoading(true);
    try {
      const response = await socialNetworkService.getPostComments(post._id);
      console.log('🔄 Refresh response:', response);
      console.log('🔄 Response type:', typeof response);
      console.log('🔄 Is array:', Array.isArray(response));
      console.log('🔄 Response.data:', response?.data);
      console.log('🔄 Response.data.data:', response?.data?.data);
      
      const commentsData = Array.isArray(response) ? response : (response?.data || []);
      console.log('🔄 Processed comments data:', commentsData);
      console.log('🔄 Comments data length:', commentsData.length);
      console.log('🔄 First comment preview:', commentsData[0] ? {
        id: commentsData[0]._id,
        content: commentsData[0].content?.substring(0, 50) + '...',
        author: commentsData[0].author?.firstName + ' ' + commentsData[0].author?.lastName,
        createdAt: commentsData[0].createdAt
      } : 'No comments in array');
      
      if (commentsData.length === 0) {
        console.log('🚨 WARNING: No comments returned despite post having', post.commentsCount, 'comments');
        console.log('🚨 This suggests either:');
        console.log('🚨 1. Backend filtering issue (all comments might be replies)');
        console.log('🚨 2. Database query issue');
        console.log('🚨 3. Parent comment field issue');
      }
      
      setComments(commentsData);
      console.log('🔄 Refresh completed. Comments set:', commentsData.length);
    } catch (error) {
      console.error('🔄 Refresh error:', error);
      console.error('🔄 Error details:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!replyContent.trim()) return;

    try {
      const response = await socialNetworkService.addComment(post._id, replyContent, commentId);
      const newReplyData = response;
      
      // Ensure the reply has proper structure
      const safeReply = {
        _id: newReplyData._id || Math.random().toString(),
        author: newReplyData.author || {
          _id: user?._id || 'unknown',
          firstName: user?.firstName || 'Unknown',
          lastName: user?.lastName || 'User',
          profilePicture: user?.profilePicture || ''
        },
        content: newReplyData.content || replyContent,
        likesCount: newReplyData.likesCount || 0,
        repliesCount: newReplyData.repliesCount || 0,
        createdAt: newReplyData.createdAt || new Date().toISOString()
      };
      
      // Add reply to the appropriate comment
      setComments(prev => prev.map(comment => 
        comment._id === commentId 
          ? { 
              ...comment, 
              repliesCount: (comment.repliesCount || 0) + 1,
              replies: [...(comment.replies || []), safeReply]
            }
          : comment
      ));
      
      // Automatically expand replies for this comment
      setExpandedReplies(prev => new Set([...prev, commentId]));
      
      setReplyContent('');
      setReplyingTo(null);
      
      console.log('Reply added successfully:', safeReply);
    } catch (error) {
      console.error('Error adding reply:', error);
      // Still update the reply count for better UX
      setComments(prev => prev.map(comment => 
        comment._id === commentId 
          ? { ...comment, repliesCount: (comment.repliesCount || 0) + 1 }
          : comment
      ));
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await socialNetworkService.likeComment(commentId);
      // Update the comment likes count locally
      setComments(prev => prev.map(comment => 
        comment._id === commentId 
          ? { ...comment, likesCount: (comment.likesCount || 0) + 1 }
          : comment
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
      // Still update locally for better UX
      setComments(prev => prev.map(comment => 
        comment._id === commentId 
          ? { ...comment, likesCount: (comment.likesCount || 0) + 1 }
          : comment
      ));
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

  const handleShare = async (platform?: string) => {
    try {
      await socialNetworkService.sharePost(post._id);
      setSharesCount(prev => prev + 1);
      
      const postUrl = `${window.location.origin}/post/${post._id}`;
      const shareText = `Check out this post: ${post.content.substring(0, 100)}...`;
      
      if (platform) {
        switch (platform) {
          case 'linkedin':
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
            break;
          case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`, '_blank');
            break;
          case 'facebook':
            window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`, '_blank');
            break;
          case 'whatsapp':
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + postUrl)}`, '_blank');
            break;
          case 'copy':
            await navigator.clipboard.writeText(postUrl);
            console.log('Post URL copied to clipboard');
            break;
        }
      } else {
        // Default sharing - copy to clipboard
        await navigator.clipboard.writeText(postUrl);
        console.log('Post URL copied to clipboard');
      }
      
      setShareMenuAnchor(null);
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

  // Debug comment state changes
  useEffect(() => {
    console.log('📝 Comments state changed:', {
      comments: comments,
      length: comments?.length,
      isUndefined: comments === undefined,
      postId: post._id,
      postCommentsCount: post.commentsCount
    });
  }, [comments, post._id, post.commentsCount]);

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
        mb: { xs: 3, sm: 3.5, md: 4, lg: 4.5 },
        borderRadius: { xs: 4, sm: 5, md: 6, lg: 7 },
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.95) 50%, rgba(240,244,248,0.9) 100%)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(102, 126, 234, 0.12)'}`,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 12px 40px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.08)' 
          : '0 12px 40px rgba(102, 126, 234, 0.15), 0 4px 16px rgba(102, 126, 234, 0.08), 0 0 0 1px rgba(102, 126, 234, 0.08)',
        width: '100%',
        maxWidth: '100%',
        minWidth: 0,
        overflow: 'hidden',
        position: 'relative',
        minHeight: { 
          xs: '320px',
          sm: '350px', 
          md: '400px', 
          lg: '420px', 
          xl: '450px'
        },
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(20px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 30%, #4facfe 60%, #00d4ff 100%)',
          borderRadius: '7px 7px 0 0',
          opacity: 0.9,
          transition: 'opacity 0.3s ease',
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.02) 0%, rgba(118, 75, 162, 0.02) 50%, rgba(79, 172, 254, 0.02) 100%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark' 
            ? '0 20px 60px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.12)' 
            : '0 20px 60px rgba(102, 126, 234, 0.2), 0 8px 24px rgba(102, 126, 234, 0.12), 0 0 0 1px rgba(102, 126, 234, 0.12)',
          '&::before': {
            opacity: 1,
          },
          '&::after': {
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
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={post?.author?.profilePicture || undefined}
              sx={{ 
                width: { xs: 52, sm: 56, md: 60, lg: 64 },
                height: { xs: 52, sm: 56, md: 60, lg: 64 }, 
                mr: { xs: 2.5, sm: 3, md: 3.5, lg: 4 },
                cursor: 'pointer',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 6px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)'
                  : '0 6px 20px rgba(102, 126, 234, 0.25), 0 0 0 1px rgba(102, 126, 234, 0.15)',
                border: `3px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(102, 126, 234, 0.2)'}`,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)'
                  : 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
                '&:hover': {
                  transform: 'scale(1.1) translateY(-3px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 8px 25px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.2)'
                    : '0 8px 25px rgba(102, 126, 234, 0.3), 0 0 0 2px rgba(102, 126, 234, 0.25)',
                }
              }}
              onClick={handleViewProfile}
            >
              {(post?.author?.firstName?.[0] || '')}{(post?.author?.lastName?.[0] || '')}
            </Avatar>
            {/* Online status indicator */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: '#4ade80',
                border: `3px solid ${theme.palette.background.paper}`,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%': {
                    boxShadow: '0 0 0 0 rgba(74, 222, 128, 0.7)',
                  },
                  '70%': {
                    boxShadow: '0 0 0 6px rgba(74, 222, 128, 0)',
                  },
                  '100%': {
                    boxShadow: '0 0 0 0 rgba(74, 222, 128, 0)',
                  },
                },
              }}
            />
          </Box>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem', lg: '1.3rem' },
                cursor: 'pointer',
                lineHeight: 1.2,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 100%)'
                  : 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  transform: 'translateX(3px)',
                }
              }}
              onClick={handleViewProfile}
            >
              {(post?.author?.firstName || '')} {(post?.author?.lastName || '')}
            </Typography>
            {post?.author?.jobTitle && (
              <Typography 
                variant="body2" 
                sx={{ 
                  fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                  fontWeight: 500,
                  mt: 0.5,
                  lineHeight: 1.4,
                  color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%)'
                    : 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {post?.author?.jobTitle} {post?.author?.company && `at ${post?.author?.company}`}
              </Typography>
            )}
            <Typography 
              variant="caption" 
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.85rem' },
                fontWeight: 500,
                mt: 0.5,
                display: 'block',
                opacity: 0.8,
                color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.3) 100%)'
                  : 'linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                background: `linear-gradient(135deg, ${getPostTypeColor(post.postType || 'text')} 0%, ${getPostTypeColor(post.postType || 'text')}dd 100%)`,
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '0.75rem',
                boxShadow: `0 2px 8px ${getPostTypeColor(post.postType || 'text')}40`,
                border: `1px solid ${getPostTypeColor(post.postType || 'text')}30`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${getPostTypeColor(post.postType || 'text')}60`,
                }
              }}
            />
            {/* Source marker for Learning Hub posts */}
            {(post as any).source === 'learning_hub' && (
              <Chip
                label="From Learning Hub"
                size="small"
                sx={{
                  bgcolor: alpha(theme.palette.success.main, 0.15),
                  color: theme.palette.success.main,
                  fontWeight: 600,
                }}
              />
            )}
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        {/* Post Content */}
        <Box sx={{ 
          mb: { xs: 2, sm: 2.5, md: 3 },
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: 'linear-gradient(180deg, #667eea 0%, #764ba2 50%, #4facfe 100%)',
            borderRadius: '0 2px 2px 0',
            opacity: 0.6,
          }
        }}>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: shouldTruncateText(post.content) ? 1 : 0,
              pl: 2,
              pr: 1,
              lineHeight: { xs: 1.6, sm: 1.7, md: 1.8 },
              fontSize: { xs: '0.95rem', sm: '1rem', md: '1.05rem' },
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              maxWidth: '100%',
              whiteSpace: 'pre-line',
              color: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)',
              fontWeight: 400,
              letterSpacing: '0.01em',
              textAlign: 'left',
              // Better text organization
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              // Responsive spacing
              mt: { xs: 0.5, sm: 1 },
              mb: { xs: 1, sm: 1.5 },
            }}
          >
            {isTextExpanded || !shouldTruncateText(post.content) 
              ? formatPostText(post.content) 
              : getTruncatedText(formatPostText(post.content))
            }
          </Typography>
          
          {/* View More/Less Button */}
          {shouldTruncateText(post.content) && (
            <Box sx={{ pl: 2, mt: 1 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => setIsTextExpanded(!isTextExpanded)}
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  minWidth: 'auto',
                  fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                  fontWeight: 600,
                  color: theme.palette.primary.main,
                  textTransform: 'none',
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.1)' 
                      : 'rgba(0,0,0,0.05)',
                    transform: 'translateX(2px)',
                    color: theme.palette.primary.dark,
                  },
                  // Better mobile touch target
                  minHeight: { xs: 32, sm: 36 },
                  px: { xs: 1, sm: 1.5 },
                }}
              >
                {isTextExpanded ? 'Show Less' : 'Show More'}
              </Button>
            </Box>
          )}
        </Box>

        {/* Media Gallery */}
        {renderMediaGallery()}

        {/* Tags */}
        {post.tags.length > 0 && (
          <Box sx={{ 
            mb: 2,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
          }}>
            {post.tags.map((tag, index) => (
              <Chip
                key={index}
                label={`#${tag}`}
                size="small"
                variant="outlined"
                sx={{ 
                  mr: 1, 
                  mb: 1,
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
                  color: theme.palette.mode === 'dark' ? 'rgba(102, 126, 234, 0.9)' : 'rgba(102, 126, 234, 0.8)',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    background: theme.palette.mode === 'dark'
                      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                      : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 2px 8px rgba(102, 126, 234, 0.3)'
                      : '0 2px 8px rgba(102, 126, 234, 0.2)',
                  }
                }}
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
      <CardActions sx={{ 
        px: { xs: 1.5, sm: 2, md: 2.5 }, 
        pb: { xs: 1, sm: 1.5, md: 1.8 }, 
        pt: 0,
        flexWrap: 'wrap',
        gap: { xs: 0.5, sm: 1 }
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          width: '100%',
          gap: { xs: 0.5, sm: 1, md: 1.5 }
        }}>
          {/* Enhanced Like Button with Reactions */}
          <Box sx={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 0.75, md: 1 },
            minWidth: { xs: 'auto', sm: '60px' }
          }}>
            <IconButton 
              onClick={() => handleLike()}
              onMouseEnter={(e) => setReactionMenuAnchor(e.currentTarget)}
              onMouseLeave={() => setTimeout(() => setReactionMenuAnchor(null), 300)}
              color={liked ? 'error' : 'default'}
              sx={{ 
                p: { xs: 0.8, sm: 1, md: 1.2 },
                minWidth: { xs: 32, sm: 36, md: 40 },
                minHeight: { xs: 32, sm: 36, md: 40 },
                bgcolor: liked ? alpha(theme.palette.error.main, 0.1) : 'transparent',
                border: liked ? `1px solid ${alpha(theme.palette.error.main, 0.3)}` : '1px solid transparent',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  bgcolor: liked 
                    ? alpha(theme.palette.error.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.08)
                },
                '&:active': {
                  transform: 'scale(0.95)'
                },
                transition: 'all 0.2s ease-in-out',
                borderRadius: 2,
                cursor: 'pointer'
              }}
            >
              {liked ? (
                <Favorite sx={{ 
                  fontSize: { xs: 18, sm: 20, md: 22 },
                  color: theme.palette.error.main,
                  animation: 'heartbeat 0.6s ease-in-out'
                }} />
              ) : (
                <FavoriteBorder sx={{ 
                  fontSize: { xs: 18, sm: 20, md: 22 },
                  color: theme.palette.text.secondary
                }} />
              )}
            </IconButton>
            
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                fontWeight: 500,
                minWidth: { xs: 'auto', sm: '20px' },
                textAlign: 'center'
              }}
            >
              {likesCount}
            </Typography>
            
            {/* Reaction Menu */}
            {reactionMenuAnchor && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: 'background.paper',
                  borderRadius: 25,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                  p: { xs: 0.5, sm: 1 },
                  display: 'flex',
                  gap: { xs: 0.5, sm: 1 },
                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                  zIndex: 1000,
                  mb: 1,
                  minWidth: { xs: 200, sm: 250 }
                }}
                onMouseEnter={() => setReactionMenuAnchor(reactionMenuAnchor)}
                onMouseLeave={() => setReactionMenuAnchor(null)}
              >
                {reactions.map((reaction) => (
                  <IconButton
                    key={reaction.type}
                    size="small"
                    onClick={() => handleReactionSelect(reaction.type)}
                    sx={{
                      width: { xs: 36, sm: 40 },
                      height: { xs: 36, sm: 40 },
                      bgcolor: reaction.color,
                      color: 'white',
                      '&:hover': {
                        bgcolor: reaction.color,
                        transform: 'scale(1.15)',
                      },
                      transition: 'all 0.2s ease-in-out',
                      borderRadius: '50%'
                    }}
                  >
                    <reaction.icon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                  </IconButton>
                ))}
              </Box>
            )}
          </Box>

          {/* Comment Button */}
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 0.75, md: 1 },
            minWidth: { xs: 'auto', sm: '60px' }
          }}>
            <IconButton 
              onClick={handleCommentToggle}
              sx={{ 
                p: { xs: 0.8, sm: 1, md: 1.2 },
                minWidth: { xs: 32, sm: 36, md: 40 },
                minHeight: { xs: 32, sm: 36, md: 40 },
                bgcolor: showComments ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                border: showComments ? `1px solid ${alpha(theme.palette.primary.main, 0.3)}` : '1px solid transparent',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  bgcolor: showComments 
                    ? alpha(theme.palette.primary.main, 0.15)
                    : alpha(theme.palette.primary.main, 0.08)
                },
                '&:active': {
                  transform: 'scale(0.95)'
                },
                transition: 'all 0.2s ease-in-out',
                borderRadius: 2,
                cursor: 'pointer'
              }}
            >
              <Comment sx={{ 
                fontSize: { xs: 18, sm: 20, md: 22 },
                color: showComments ? theme.palette.primary.main : theme.palette.text.secondary
              }} />
            </IconButton>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                fontWeight: 500,
                minWidth: { xs: 'auto', sm: '20px' },
                textAlign: 'center'
              }}
            >
              {post.commentsCount}
            </Typography>
          </Box>

          {/* Enhanced Share Button */}
          <Box sx={{ 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 0.75, md: 1 },
            minWidth: { xs: 'auto', sm: '60px' }
          }}>
            <IconButton 
              onClick={(e) => setShareMenuAnchor(e.currentTarget)}
              sx={{ 
                p: { xs: 0.8, sm: 1, md: 1.2 },
                minWidth: { xs: 32, sm: 36, md: 40 },
                minHeight: { xs: 32, sm: 36, md: 40 },
                bgcolor: Boolean(shareMenuAnchor) ? alpha(theme.palette.success.main, 0.1) : 'transparent',
                border: Boolean(shareMenuAnchor) ? `1px solid ${alpha(theme.palette.success.main, 0.3)}` : '1px solid transparent',
                '&:hover': { 
                  transform: 'scale(1.05)',
                  bgcolor: Boolean(shareMenuAnchor) 
                    ? alpha(theme.palette.success.main, 0.15)
                    : alpha(theme.palette.success.main, 0.08)
                },
                '&:active': {
                  transform: 'scale(0.95)'
                },
                transition: 'all 0.2s ease-in-out',
                borderRadius: 2,
                cursor: 'pointer'
              }}
            >
              <Share sx={{ 
                fontSize: { xs: 18, sm: 20, md: 22 },
                color: Boolean(shareMenuAnchor) ? theme.palette.success.main : theme.palette.text.secondary
              }} />
            </IconButton>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                fontWeight: 500,
                minWidth: { xs: 'auto', sm: '20px' },
                textAlign: 'center'
              }}
            >
              {sharesCount}
            </Typography>
          </Box>

          {/* Chat Button - Only show if not the current user's post */}
          {user && authorId && authorId !== user._id && (
            <Box sx={{ 
              display: 'flex',
              alignItems: 'center',
              ml: 'auto'
            }}>
              <IconButton 
                onClick={handleStartChat}
                sx={{ 
                  p: { xs: 0.8, sm: 1, md: 1.2 },
                  minWidth: { xs: 32, sm: 36, md: 40 },
                  minHeight: { xs: 32, sm: 36, md: 40 },
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                  '&:hover': { 
                    transform: 'scale(1.05)',
                    bgcolor: alpha(theme.palette.primary.main, 0.15)
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  },
                  transition: 'all 0.2s ease-in-out',
                  borderRadius: 2,
                  cursor: 'pointer',
                  color: 'primary.main'
                }}
              >
                <Chat sx={{ 
                  fontSize: { xs: 18, sm: 20, md: 22 },
                  color: theme.palette.primary.main
                }} />
              </IconButton>
              {/* Link to e-learning community for Learning Hub posts */}
              {(post as any).source === 'learning_hub' && (
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ ml: 1, textTransform: 'none', borderRadius: 2 }}
                  onClick={() => {
                    // Prefer known domain if available, fallback to relative
                    const url = 'https://www.elearning.excellencecoachinghub.com/community';
                    window.open(url, '_blank');
                  }}
                >
                  Open in Community
                </Button>
              )}
            </Box>
          )}
        </Box>
      </CardActions>

      {/* Comments Section */}
      <Collapse in={showComments}>
        <Divider />
        <Box sx={{ p: 2 }}>
          {/* Add Comment */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                value={replyingTo ? replyContent : newComment}
                onChange={(e) => replyingTo ? setReplyContent(e.target.value) : setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    if (replyingTo) {
                      handleAddReply(replyingTo);
                    } else {
                      handleAddComment();
                    }
                  }
                }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setEmojiPickerCommentId(replyingTo ? replyingTo : 'new');
                }}
                sx={{ color: theme.palette.text.secondary }}
              >
                <EmojiEmotionsOutlined />
              </IconButton>
              <Button
                variant="contained"
                size="small"
                onClick={() => replyingTo ? handleAddReply(replyingTo) : handleAddComment()}
                disabled={replyingTo ? !replyContent.trim() : !newComment.trim()}
                sx={{ textTransform: 'none' }}
              >
                {replyingTo ? 'Reply' : 'Post'}
              </Button>
              {replyingTo && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setReplyingTo(null)}
                  sx={{ textTransform: 'none' }}
                >
                  Cancel
                </Button>
              )}
            </Box>
            
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                p: 1, 
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                borderRadius: 1,
                flexWrap: 'wrap'
              }}>
                {['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'].map((emoji) => (
                  <IconButton
                    key={emoji}
                    size="small"
                    onClick={() => addEmojiToComment(emoji, emojiPickerCommentId || 'new')}
                    sx={{ 
                      fontSize: '1.2rem',
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.1)',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    {emoji}
                  </IconButton>
                ))}
              </Box>
            )}
          </Box>

          {/* Comments List */}
          {commentsLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Loading comments...
            </Typography>
          ) : comments !== undefined && comments.length > 0 ? (
            comments.map((comment) => {
              // Safe access to comment author with fallbacks
              const author = comment.author || {};
              const firstName = author.firstName || 'Unknown';
              const lastName = author.lastName || 'User';
              const profilePicture = author.profilePicture || '';
              const authorInitial = firstName.charAt(0) || 'U';
              const repliesCount = comment.repliesCount || 0;
              const hasReplies = repliesCount > 0;
              const showReplies = expandedReplies.has(comment._id);
              const replies = comment.replies || [];
              
              return (
                <Box key={comment._id || Math.random()} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Avatar
                      src={profilePicture}
                      sx={{ width: 32, height: 32 }}
                    >
                      {authorInitial}
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
                          {firstName} {lastName}
                        </Typography>
                        <Typography variant="body2">
                          {comment.content || 'No content'}
                        </Typography>
                      </Box>
                    
                      {/* Comment Actions */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, ml: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : 'Just now'}
                        </Typography>
                        
                        <Button
                          size="small"
                          startIcon={<ThumbUp />}
                          onClick={() => handleLikeComment(comment._id)}
                          sx={{ 
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5
                          }}
                        >
                          {comment.likesCount || 0}
                        </Button>
                        
                        <Button
                          size="small"
                          startIcon={<Reply />}
                          onClick={() => handleReplyToComment(comment._id)}
                          sx={{ 
                            textTransform: 'none',
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            px: 1,
                            py: 0.5
                          }}
                        >
                          Reply
                        </Button>
                        
                        {hasReplies && (
                          <Button
                            size="small"
                            onClick={() => toggleReplies(comment._id)}
                            sx={{ 
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              minWidth: 'auto',
                              px: 1,
                              py: 0.5,
                              color: 'primary.main'
                            }}
                          >
                            {showReplies ? 'Hide' : 'Show'} {repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}
                          </Button>
                        )}
                      </Box>
                      
                      {/* Replies Section */}
                      {hasReplies && showReplies && (
                        <Box sx={{ mt: 1, ml: 4, pl: 1, borderLeft: `2px solid ${theme.palette.divider}` }}>
                          {replies.map((reply: any) => {
                            const replyAuthor = reply.author || {};
                            const replyFirstName = replyAuthor.firstName || 'Unknown';
                            const replyLastName = replyAuthor.lastName || 'User';
                            const replyProfilePicture = replyAuthor.profilePicture || '';
                            const replyAuthorInitial = replyFirstName.charAt(0) || 'U';
                            
                            return (
                              <Box key={reply._id || Math.random()} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <Avatar
                                  src={replyProfilePicture}
                                  sx={{ width: 28, height: 28 }}
                                >
                                  {replyAuthorInitial}
                                </Avatar>
                                <Box sx={{ flexGrow: 1 }}>
                                  <Box
                                    sx={{
                                      backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255,255,255,0.03)' 
                                        : 'rgba(0,0,0,0.03)',
                                      borderRadius: 2,
                                      p: 1.25
                                    }}
                                  >
                                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                                      {replyFirstName} {replyLastName}
                                    </Typography>
                                    <Typography variant="body2">
                                      {reply.content || 'No content'}
                                    </Typography>
                                  </Box>
                                  
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, ml: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                      {reply.createdAt ? formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true }) : 'Just now'}
                                    </Typography>
                                    
                                    <Button
                                      size="small"
                                      startIcon={<ThumbUp />}
                                      onClick={() => handleLikeComment(reply._id)}
                                      sx={{ 
                                        textTransform: 'none',
                                        fontSize: '0.7rem',
                                        minWidth: 'auto',
                                        px: 0.5,
                                        py: 0.25
                                      }}
                                    >
                                      {reply.likesCount || 0}
                                    </Button>
                                  </Box>
                                </Box>
                              </Box>
                            );
                          })}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                No comments found. 
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Comments state: {comments === undefined ? 'undefined' : `Array(${comments.length})`}
                {post.commentsCount > 0 && ` | Post count: ${post.commentsCount}`}
              </Typography>
              <Typography variant="body2" color="primary" sx={{ mt: 1, cursor: 'pointer' }}
                onClick={refreshComments}>
                Refresh comments
              </Typography>
            </Box>
          )}
        </Box>
      </Collapse>

      {/* Share Menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={() => setShareMenuAnchor(null)}
        PaperProps={{
          sx: { 
            minWidth: { xs: 180, sm: 200, md: 220 },
            borderRadius: 2,
            mt: 1,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`
          }
        }}
        transformOrigin={{ horizontal: 'center', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'center', vertical: 'bottom' }}
      >
        <MenuItem 
          onClick={() => handleShare('copy')} 
          sx={{ 
            py: { xs: 1.2, sm: 1.5 },
            px: { xs: 1.5, sm: 2 },
            borderRadius: 1,
            mx: 0.5,
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.08)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Box sx={{ 
              width: { xs: 24, sm: 28 }, 
              height: { xs: 24, sm: 28 }, 
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              borderRadius: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Share sx={{ fontSize: { xs: 14, sm: 16 }, color: 'primary.main' }} />
            </Box>
            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '0.9rem' }, fontWeight: 500 }}>
              Copy Link
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleShare('linkedin')} 
          sx={{ 
            py: { xs: 1.2, sm: 1.5 },
            px: { xs: 1.5, sm: 2 },
            borderRadius: 1,
            mx: 0.5,
            '&:hover': {
              bgcolor: alpha('#0077b5', 0.08)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Box sx={{ 
              width: { xs: 24, sm: 28 }, 
              height: { xs: 24, sm: 28 }, 
              bgcolor: '#0077b5', 
              borderRadius: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography sx={{ color: 'white', fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 'bold' }}>
                in
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '0.9rem' }, fontWeight: 500 }}>
              LinkedIn
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleShare('twitter')} 
          sx={{ 
            py: { xs: 1.2, sm: 1.5 },
            px: { xs: 1.5, sm: 2 },
            borderRadius: 1,
            mx: 0.5,
            '&:hover': {
              bgcolor: alpha('#1da1f2', 0.08)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Box sx={{ 
              width: { xs: 24, sm: 28 }, 
              height: { xs: 24, sm: 28 }, 
              bgcolor: '#1da1f2', 
              borderRadius: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography sx={{ color: 'white', fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 'bold' }}>
                𝕏
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '0.9rem' }, fontWeight: 500 }}>
              Twitter
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleShare('facebook')} 
          sx={{ 
            py: { xs: 1.2, sm: 1.5 },
            px: { xs: 1.5, sm: 2 },
            borderRadius: 1,
            mx: 0.5,
            '&:hover': {
              bgcolor: alpha('#1877f2', 0.08)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Box sx={{ 
              width: { xs: 24, sm: 28 }, 
              height: { xs: 24, sm: 28 }, 
              bgcolor: '#1877f2', 
              borderRadius: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography sx={{ color: 'white', fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 'bold' }}>
                f
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '0.9rem' }, fontWeight: 500 }}>
              Facebook
            </Typography>
          </Box>
        </MenuItem>
        
        <MenuItem 
          onClick={() => handleShare('whatsapp')} 
          sx={{ 
            py: { xs: 1.2, sm: 1.5 },
            px: { xs: 1.5, sm: 2 },
            borderRadius: 1,
            mx: 0.5,
            '&:hover': {
              bgcolor: alpha('#25d366', 0.08)
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
            <Box sx={{ 
              width: { xs: 24, sm: 28 }, 
              height: { xs: 24, sm: 28 }, 
              bgcolor: '#25d366', 
              borderRadius: 1, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Typography sx={{ color: 'white', fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 'bold' }}>
                W
              </Typography>
            </Box>
            <Typography sx={{ fontSize: { xs: '0.875rem', sm: '0.9rem' }, fontWeight: 500 }}>
              WhatsApp
            </Typography>
          </Box>
        </MenuItem>
      </Menu>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
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
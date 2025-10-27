import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Stack,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  styled,
  Collapse,
  Alert
} from '@mui/material';
import {
  Add,
  EmojiEvents,
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  Share,
  BookmarkBorder,
  Bookmark,
  MoreVert,
  DeleteForever,
  Send,
  Image,
  VideoCall,
  Poll,
  School,
  Group,
  TrendingUp,
  Chat,
  Star,
  CheckCircle,
  Schedule,
  LocationOn,
  Tag,
  FilterList,
  Search,
  Sort,
  Refresh,
  AttachFile,
  CloudUpload,
  Delete,
  PlayArrow,
  KeyboardArrowDown,
  KeyboardArrowUp,
  UnfoldLess,
  UnfoldMore,
  Work
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { isLearnerRole } from '../../utils/roleUtils';
import { communityService, IPost } from '../../services/communityService';

// Styled Components
const PostCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: theme.shadows[4],
  },
}));

const CreatePostCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  borderRadius: theme.spacing(2),
  border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
  backgroundColor: alpha(theme.palette.primary.main, 0.02),
}));

// Use IPost from communityService
type Post = IPost;

interface CommunityFeedProps {}

const CommunityFeed: React.FC<CommunityFeedProps> = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    type: 'text' as const,
    tags: [] as string[],
    attachments: [] as File[]
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [postId: string]: any[] }>({});
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [minimizedReplies, setMinimizedReplies] = useState<{ [commentId: string]: boolean }>({});

  // Load posts
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated
        if (!user) {
          console.warn('User not authenticated, skipping posts load');
          setLoading(false);
          return;
        }

        console.log('Loading posts for user:', user);
        const response = await communityService.getPosts(1, 10);
        if (response.success) {
          setPosts(response.data.posts);
        }
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [user]);

  const goToDashboard = () => {
    navigate('/dashboard/student');
  };

  // Handle post actions
  const handleLike = async (postId: string) => {
    console.log('👍 Like button clicked for post:', postId);
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) {
        console.error('Post not found:', postId);
        return;
      }

      if (post.isLiked) {
        console.log('Unliking post:', postId);
        await communityService.unlikePost(postId);
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, isLiked: false, likes: p.likes - 1 }
            : p
        ));
      } else {
        console.log('Liking post:', postId);
        await communityService.likePost(postId);
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, isLiked: true, likes: p.likes + 1 }
            : p
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to update like. Please try again.');
    }
  };

  const handleBookmark = async (postId: string) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isBookmarked) {
        await communityService.unbookmarkPost(postId);
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, isBookmarked: false }
            : p
        ));
        toast.success('Post bookmark removed!');
      } else {
        await communityService.bookmarkPost(postId);
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, isBookmarked: true }
            : p
        ));
        toast.success('Post bookmarked!');
      }
    } catch (error) {
      console.error('Error bookmarking post:', error);
      toast.error('Failed to update bookmark. Please try again.');
    }
  };

  // Handle comments
  const handleToggleComments = async (postId: string) => {
    console.log('💬 Comment button clicked for post:', postId);
    if (commentsOpen === postId) {
      console.log('Closing comments for post:', postId);
      setCommentsOpen(null);
    } else {
      console.log('Opening comments for post:', postId);
      setCommentsOpen(postId);
      if (!comments[postId]) {
        try {
          console.log('Loading comments for post:', postId);
          const response = await communityService.getComments(postId);
          if (response.success) {
            console.log('Comments loaded:', response.data.comments);
            
            // Organize comments with their replies
            const organizedComments = response.data.comments.map(comment => ({
              ...comment,
              replies: response.data.comments.filter(reply => 
                reply.parentCommentId === comment.id
              )
            }));

            // Only show top-level comments (those without parentCommentId)
            const topLevelComments = organizedComments.filter(comment => !comment.parentCommentId);
            
            setComments(prev => ({
              ...prev,
              [postId]: topLevelComments
            }));
          }
        } catch (error) {
          console.error('Error loading comments:', error);
          toast.error('Failed to load comments. Please try again.');
        }
      }
    }
  };

  const handleCreateComment = async (postId: string) => {
    if (!newComment.trim()) return;

    setCommenting(true);
    try {
      const response = await communityService.createComment(postId, newComment);
      if (response.success) {
        setComments(prev => ({
          ...prev,
          [postId]: [response.data, ...(prev[postId] || [])]
        }));
        setNewComment('');
        // Update comment count in posts
        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, comments: p.comments + 1 }
            : p
        ));
        toast.success('Comment posted successfully!');
      }
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error('Failed to create comment. Please try again.');
    } finally {
      setCommenting(false);
    }
  };

  // Handle reply to comment
  const handleReplyToComment = async (postId: string, parentCommentId: string) => {
    if (!replyText.trim() || replyLoading) return;

    setReplyLoading(true);
    try {
      const response = await communityService.createComment(postId, replyText, parentCommentId);
      if (response.success) {
        // Add the reply to the parent comment's replies array
        setComments(prev => ({
          ...prev,
          [postId]: prev[postId]?.map(comment => 
            comment.id === parentCommentId
              ? { ...comment, replies: [...(comment.replies || []), response.data] }
              : comment
          ) || []
        }));
        setReplyText('');
        setReplyingTo(null);
        toast.success('Reply posted successfully!');
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error('Failed to post reply. Please try again.');
    } finally {
      setReplyLoading(false);
    }
  };

  // Handle minimize/expand replies
  const toggleRepliesMinimized = (commentId: string) => {
    setMinimizedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Handle sharing
  const handleShare = (post: any) => {
    console.log('📤 Share button clicked for post:', post.id);
    setSelectedPost(post);
    setShareDialogOpen(true);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await communityService.deletePost(postId);
      if (res.success) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        toast.success('Post deleted');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleStartChat = async (authorId: string, authorName: string) => {
    try {
      await communityService.createConversation([authorId], false);
      toast.success(`Chat started with ${authorName}`);
      // Navigate to chat view
      // If chatId is needed for selection, backend would need to return it; for now go to chat list
      (window as any).scrollTo({ top: 0, behavior: 'smooth' });
      // using window to avoid importing navigate here unnecessarily
      // but we already have navigate; use it directly
      try { (navigate as any) && navigate('/community/chat'); } catch {}
    } catch (e) {
      console.error('Failed to start chat', e);
      toast.error('Failed to start chat. Please try again.');
    }
  };

  const handleSharePost = async (platform: string) => {
    if (!selectedPost) return;

    try {
      const response = await communityService.sharePost(selectedPost.id, platform);
      if (response.success) {
        setPosts(prev => prev.map(p =>
          p.id === selectedPost.id
            ? { ...p, shares: response.data.shares }
            : p
        ));
        setShareDialogOpen(false);
        setSelectedPost(null);
        console.log('✅ Post shared successfully');
        toast.success('Post shared successfully!');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post. Please try again.');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const maxSize = 10 * 1024 * 1024; // 10MB for faster uploads
      
      if (!isImage && !isVideo) {
        alert('Please select only image or video files');
        return false;
      }
      
      if (file.size > maxSize) {
        alert('File size must be less than 10MB for faster uploads');
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 3) {
      alert('Maximum 3 files allowed per post');
      return;
    }

    setNewPost(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }));
  };

  const removeAttachment = (index: number) => {
    setNewPost(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleCreatePost = async () => {
    if (!newPost.content.trim() && newPost.attachments.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      // Upload attachments first
      let uploadedAttachments = [];
      if (newPost.attachments.length > 0) {
        setUploadProgress(25);
        const uploadResponse = await communityService.uploadFiles(newPost.attachments);
        if (uploadResponse.success) {
          uploadedAttachments = uploadResponse.data;
          setUploadProgress(75);
        }
      }

      const response = await communityService.createPost({
        content: newPost.content,
        type: newPost.type,
        tags: newPost.tags,
        attachments: uploadedAttachments.length > 0 ? uploadedAttachments : undefined
      });

      if (response.success) {
        setUploadProgress(100);
        setPosts(prev => [response.data, ...prev]);
        setNewPost({ content: '', type: 'text', tags: [], attachments: [] });
        setCreatePostOpen(false);
        console.log('✅ Post created successfully:', response.data.id);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  // Get post type color
  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'achievement': return 'success';
      case 'question': return 'warning';
      case 'announcement': return 'info';
      default: return 'default';
    }
  };

  // Get post type icon
  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <EmojiEvents />;
      case 'question': return <ChatBubbleOutline />;
      case 'announcement': return <School />;
      default: return <ChatBubbleOutline />;
    }
  };

  return (
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      maxWidth: 800, 
      mx: 'auto',
      width: '100%'
    }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
            Community Feed
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Connect with fellow learners and share your journey
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<School />} onClick={goToDashboard}>
          Back to Dashboard
        </Button>
      </Box>

      {/* Opportunities Card - Shown for learners with 40%+ profile completion */}
      {isLearnerRole(user?.role) && (
        <Card sx={{ mb: 2, borderRadius: 2, border: `1px solid ${theme.palette.success.light}`, background: alpha(theme.palette.success.main, 0.05) }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <Work color="success" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Career Opportunities</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Explore job opportunities on ExJobNet matched to your completed courses. Requires 40% profile completion and age 18+.
            </Typography>
            <Button variant="contained" color="success" onClick={() => navigate('/dashboard/student/opportunities')}>
              View Opportunities
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Post */}
      <CreatePostCard>
        <CardContent>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1.5, sm: 2 }} 
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <Avatar 
              src={user?.profilePicture}
              sx={{ width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 } }}

            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <TextField
              placeholder="What's on your mind? Share your learning journey..."
              fullWidth
              multiline
              maxRows={3}
              size="small"
              onClick={() => setCreatePostOpen(true)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: 'background.paper',
                }
              }}
            />
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreatePostOpen(true)}
              sx={{ width: { xs: '100%', sm: 'auto' } }}
            >
              Post
            </Button>
          </Stack>
        </CardContent>
      </CreatePostCard>

      {/* Posts */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography>Loading posts...</Typography>
        </Box>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id}>
            <CardContent>
              {/* Post Header */}
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Avatar src={post.author.avatar} sx={{ width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 } }}>
                  {post.author.name.split(' ').map(n => n[0]).join('')}
                </Avatar>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {post.author.name}
                    </Typography>
                    {post.author.verified && (
                      <CheckCircle color="primary" sx={{ fontSize: { xs: 14, sm: 16 } }} />
                    )}
                    <Chip
                      label={post.author.role}
                      size="small"
                      color={post.author.role === 'teacher' ? 'primary' : 'default'}
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    />
                    <Chip
                      icon={getPostTypeIcon(post.type)}
                      label={post.type}
                      size="small"
                      color={getPostTypeColor(post.type) as any}
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {formatTimestamp(post.timestamp)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  {(user && (user._id === post.author.id || user.role === 'admin')) && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeletePost(post.id);
                      }}
                      title="Delete post"
                    >
                      <DeleteForever />
                    </IconButton>
                  )}
                  <IconButton size="small">
                    <MoreVert />
                  </IconButton>
                </Stack>
              </Stack>

              {/* Achievement Badge */}
              {post.achievement && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'success.main', color: 'white' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="h4">{post.achievement.icon}</Typography>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        🎉 Achievement Unlocked!
                      </Typography>
                      <Typography variant="body2">
                        {post.achievement.title} - {post.achievement.points} points
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              )}

              {/* Post Content */}
              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                {post.content}
              </Typography>

              {/* Tags */}
              {post.tags.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  {post.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={`#${tag}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Stack>
              )}

              {/* Attachments */}
              {post.attachments && post.attachments.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  {post.attachments.map((attachment, index) => (
                    <Box key={index} sx={{ mb: 2 }}>
                      {attachment.type === 'image' ? (
                        <Box
                          component="img"
                          src={attachment.url}
                          alt={attachment.name}
                          sx={{
                            width: '100%',
                            maxHeight: 400,
                            objectFit: 'cover',
                            borderRadius: 2,
                            cursor: 'pointer'
                          }}
                          onClick={() => window.open(attachment.url, '_blank')}
                        />
                      ) : attachment.type === 'video' ? (
                        <Box
                          component="video"
                          src={attachment.url}
                          controls
                          sx={{
                            width: '100%',
                            maxHeight: 400,
                            borderRadius: 2
                          }}
                        />
                      ) : (
                        <Paper sx={{ p: 2, mb: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={2}>
                            <Image />
                            <Typography variant="body2">{attachment.name}</Typography>
                          </Stack>
                        </Paper>
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Post Actions */}
              <Stack direction="row" spacing={1} sx={{ pt: 1, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between', alignItems: 'center' }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                  <IconButton
                    color={post.isLiked ? 'error' : 'default'}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLike(post.id);
                    }}
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      borderRadius: 2,
                      px: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: post.isLiked ? 'error.light' : 'grey.100',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    {post.isLiked ? (
                      <Favorite sx={{ fontSize: 20, color: 'error.main' }} />
                    ) : (
                      <FavoriteBorder sx={{ fontSize: 20 }} />
                    )}
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {post.likes || 0}
                    </Typography>
                  </IconButton>

                  <IconButton
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStartChat(post.author.id, post.author.name);
                    }}
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      borderRadius: 2,
                      px: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'info.light',
                        color: 'info.main',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <Chat sx={{ fontSize: 20 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      Chat
                    </Typography>
                  </IconButton>

                  <IconButton
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggleComments(post.id);
                    }}
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      borderRadius: 2,
                      px: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'primary.main',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <ChatBubbleOutline sx={{ fontSize: 20 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {post.comments || 0}
                    </Typography>
                  </IconButton>

                  <IconButton
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleShare(post);
                    }}
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      borderRadius: 2,
                      px: 1,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: 'success.light',
                        color: 'success.main',
                        transform: 'scale(1.05)'
                      }
                    }}
                  >
                    <Share sx={{ fontSize: 20 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {post.shares || 0}
                    </Typography>
                  </IconButton>
                </Stack>

                <IconButton
                  color={post.isBookmarked ? 'warning' : 'default'}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleBookmark(post.id);
                  }}
                  sx={{ 
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: post.isBookmarked ? 'warning.light' : 'grey.100',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  {post.isBookmarked ? (
                    <Bookmark sx={{ fontSize: 20, color: 'warning.main' }} />
                  ) : (
                    <BookmarkBorder sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </Stack>

              {/* Comments Section */}
              <Collapse in={commentsOpen === post.id}>
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  {/* Comment Input */}
                  <Box sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      size="small"
                      multiline
                      rows={2}
                      InputProps={{
                        endAdornment: (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleCreateComment(post.id)}
                            disabled={!newComment.trim() || commenting}
                            sx={{ ml: 1 }}
                          >
                            {commenting ? 'Posting...' : 'Post'}
                          </Button>
                        )
                      }}
                    />
                  </Box>

                  {/* Comments List */}
                  {comments[post.id] && comments[post.id].length > 0 && (
                    <Stack spacing={2}>
                      {comments[post.id].map((comment: any) => (
                        <Box key={comment.id}>
                          {/* Parent Comment */}
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Avatar 
                              src={comment.author.avatar} 
                              sx={{ width: 32, height: 32 }}
                            >
                              {comment.author.name.charAt(0)}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={500}>
                                  {comment.author.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {formatTimestamp(comment.timestamp)}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {comment.content}
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <IconButton
                                  size="small"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      if (comment.isLiked) {
                                        await communityService.unlikeComment(comment.id);
                                      } else {
                                        await communityService.likeComment(comment.id);
                                      }
                                      
                                      // Update comment in local state
                                      setComments(prev => ({
                                        ...prev,
                                        [post.id]: prev[post.id]?.map(c => 
                                          c.id === comment.id 
                                            ? { 
                                                ...c, 
                                                isLiked: !c.isLiked, 
                                                likes: c.likes + (c.isLiked ? -1 : 1)
                                              }
                                            : c
                                        ) || []
                                      }));
                                      
                                      toast.success(comment.isLiked ? 'Comment unliked!' : 'Comment liked!');
                                    } catch (error) {
                                      console.error('Error liking comment:', error);
                                      toast.error('Failed to like comment');
                                    }
                                  }}
                                  sx={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    borderRadius: 1,
                                    px: 1,
                                    py: 0.5,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: comment.isLiked ? 'error.light' : 'grey.100',
                                      transform: 'scale(1.05)'
                                    }
                                  }}
                                >
                                  {comment.isLiked ? (
                                    <Favorite sx={{ fontSize: 16, color: 'error.main' }} />
                                  ) : (
                                    <FavoriteBorder sx={{ fontSize: 16 }} />
                                  )}
                                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                                    {comment.likes || 0}
                                  </Typography>
                                </IconButton>

                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                                    if (replyingTo !== comment.id) {
                                      setReplyText('');
                                    }
                                  }}
                                  sx={{ 
                                    borderRadius: 1,
                                    px: 1,
                                    py: 0.5,
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: 'primary.light',
                                      color: 'primary.main',
                                      transform: 'scale(1.05)'
                                    }
                                  }}
                                >
                                  <ChatBubbleOutline sx={{ fontSize: 14 }} />
                                </IconButton>

                                {/* Minimize/Expand Replies Button */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleRepliesMinimized(comment.id);
                                    }}
                                    sx={{ 
                                      borderRadius: 1,
                                      px: 1,
                                      py: 0.5,
                                      transition: 'all 0.2s ease',
                                      '&:hover': {
                                        backgroundColor: 'grey.200',
                                        transform: 'scale(1.05)'
                                      }
                                    }}
                                    title={minimizedReplies[comment.id] ? 'Show replies' : 'Hide replies'}
                                  >
                                    {minimizedReplies[comment.id] ? (
                                      <KeyboardArrowDown sx={{ fontSize: 14 }} />
                                    ) : (
                                      <KeyboardArrowUp sx={{ fontSize: 14 }} />
                                    )}
                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', ml: 0.5 }}>
                                      {comment.replies.length}
                                    </Typography>
                                  </IconButton>
                                )}
                              </Stack>

                              {/* Reply Input */}
                              {replyingTo === comment.id && (
                                <Box sx={{ mt: 2, ml: 4, p: 1, backgroundColor: 'grey.50', borderRadius: 1 }}>
                                  <TextField
                                    fullWidth
                                    placeholder={`Reply to ${comment.author.name}...`}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    size="small"
                                    multiline
                                    rows={2}
                                    sx={{ mb: 1 }}
                                  />
                                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                    <Button 
                                      size="small" 
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyText('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() => handleReplyToComment(post.id, comment.id)}
                                      disabled={!replyText.trim() || replyLoading}
                                    >
                                      {replyLoading ? 'Posting...' : 'Reply'}
                                    </Button>
                                  </Stack>
                                </Box>
                              )}
                            </Box>
                          </Box>

                          {/* Replies */}
                          {comment.replies && comment.replies.length > 0 && !minimizedReplies[comment.id] && (
                            <Stack spacing={1} sx={{ mt: 2, ml: 6, borderLeft: 2, borderColor: 'grey.200', pl: 2 }}>
                              {comment.replies.map((reply: any) => (
                                <Box key={reply.id} sx={{ display: 'flex', gap: 1 }}>
                                  <Avatar 
                                    src={reply.author.avatar} 
                                    sx={{ width: 24, height: 24 }}
                                  >
                                    {reply.author.name.charAt(0)}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                      <Typography variant="caption" fontWeight={500}>
                                        {reply.author.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                        {formatTimestamp(reply.timestamp)}
                                      </Typography>
                                    </Box>
                                    <Typography variant="caption" sx={{ mb: 1 }}>
                                      {reply.content}
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                      <IconButton
                                        size="small"
                                        onClick={async (e) => {
                                          e.stopPropagation();
                                          try {
                                            if (reply.isLiked) {
                                              await communityService.unlikeComment(reply.id);
                                            } else {
                                              await communityService.likeComment(reply.id);
                                            }
                                            
                                            // Update reply in local state
                                            setComments(prev => ({
                                              ...prev,
                                              [post.id]: prev[post.id]?.map(c => 
                                                c.id === comment.id
                                                  ? {
                                                      ...c,
                                                      replies: c.replies?.map(r =>
                                                        r.id === reply.id
                                                          ? { ...r, isLiked: !r.isLiked, likes: r.likes + (r.isLiked ? -1 : 1) }
                                                          : r
                                                      ) || []
                                                    }
                                                  : c
                                              ) || []
                                            }));
                                            
                                            toast.success(reply.isLiked ? 'Reply unliked!' : 'Reply liked!');
                                          } catch (error) {
                                            console.error('Error liking reply:', error);
                                            toast.error('Failed to like reply');
                                          }
                                        }}
                                        sx={{ 
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          borderRadius: 1,
                                          px: 1,
                                          py: 0.5,
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            backgroundColor: reply.isLiked ? 'error.light' : 'grey.100',
                                            transform: 'scale(1.05)'
                                          }
                                        }}
                                      >
                                        {reply.isLiked ? (
                                          <Favorite sx={{ fontSize: 14, color: 'error.main' }} />
                                        ) : (
                                          <FavoriteBorder sx={{ fontSize: 14 }} />
                                        )}
                                        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                          {reply.likes || 0}
                                        </Typography>
                                      </IconButton>
                                    </Stack>
                                  </Box>
                                </Box>
                              ))}
                            </Stack>
                          )}

                          {/* Minimized Replies Indicator */}
                          {comment.replies && comment.replies.length > 0 && minimizedReplies[comment.id] && (
                            <Box sx={{ mt: 1, ml: 6, py: 1, px: 2, backgroundColor: 'grey.100', borderRadius: 1, borderLeft: 2, borderColor: 'grey.300' }}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                                {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'} hidden - 
                                <Button 
                                  size="small" 
                                  onClick={() => toggleRepliesMinimized(comment.id)}
                                  sx={{ 
                                    minWidth: 'auto',
                                    p: 0,
                                    ml: 0.5,
                                    textDecoration: 'none',
                                    fontSize: '0.7rem',
                                    color: 'primary.main',
                                    '&:hover': {
                                      textDecoration: 'underline'
                                    }
                                  }}
                                >
                                  Click to show
                                </Button>
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </PostCard>
        ))
      )}

      {/* Create Post Dialog */}
      <Dialog 
        open={createPostOpen} 
        onClose={() => setCreatePostOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={window.innerWidth < 600}
      >
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Post Type</InputLabel>
              <Select
                value={newPost.type}
                label="Post Type"
                onChange={(e) => setNewPost(prev => ({ ...prev, type: e.target.value as any }))}
              >
                <MenuItem value="text">Text Post</MenuItem>
                <MenuItem value="question">Question</MenuItem>
                <MenuItem value="achievement">Achievement</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="What's on your mind?"
              multiline
              rows={4}
              fullWidth
              value={newPost.content}
              onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Share your learning journey, ask questions, or celebrate achievements..."
            />
            <TextField
              label="Tags (comma separated)"
              fullWidth
              value={newPost.tags.join(', ')}
              onChange={(e) => setNewPost(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
              }))}
              placeholder="react, javascript, learning"
            />
            
            {/* File Upload Section */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Attach Images or Videos
              </Typography>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  component="span"
                  variant="outlined"
                  startIcon={<AttachFile />}
                  sx={{ mb: 2 }}
                >
                  Choose Files
                </Button>
              </label>
              
              {/* Display selected files */}
              {newPost.attachments.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {newPost.attachments.map((file, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        {file.type.startsWith('image/') ? (
                          <Image color="primary" />
                        ) : (
                          <PlayArrow color="primary" />
                        )}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Box>
                      </Stack>
                      <IconButton
                        size="small"
                        onClick={() => removeAttachment(index)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePostOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleCreatePost}
          disabled={(!newPost.content.trim() && newPost.attachments.length === 0) || uploading}
        >
          {uploading ? `Posting... ${uploadProgress}%` : 'Post'}
        </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog 
        open={shareDialogOpen} 
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Post</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share this post on different platforms
          </Typography>
          <Stack spacing={2}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleSharePost('internal')}
              startIcon={<Share />}
            >
              Share in Community
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleSharePost('facebook')}
              startIcon={<Share />}
            >
              Share on Facebook
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => handleSharePost('twitter')}
              startIcon={<Share />}
            >
              Share on Twitter
            </Button>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                if (selectedPost) {
                  navigator.clipboard.writeText(`${window.location.origin}/community/feed?post=${selectedPost.id}`);
                  alert('Link copied to clipboard!');
                }
              }}
              startIcon={<Share />}
            >
              Copy Link
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CommunityFeed;

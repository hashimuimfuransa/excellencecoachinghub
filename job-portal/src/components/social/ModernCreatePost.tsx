import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Box,
  Typography,
  Button,
  Avatar,
  TextField,
  IconButton,
  Chip,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  alpha,
  useTheme,
  useMediaQuery,
  Paper,
  Grid,
  Card,
  CardMedia,
  LinearProgress,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Close,
  Photo,
  VideoLibrary,
  Poll,
  Event,
  LocationOn,
  EmojiEmotions,
  Gif,
  AttachFile,
  Public,
  Lock,
  Group,
  ExpandMore,
  Delete,
  Edit,
  Add,
  Article,
  Business,
  School,
  Work,
  Tag,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface ModernCreatePostProps {
  open: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

const ModernCreatePost: React.FC<ModernCreatePostProps> = ({
  open,
  onClose,
  onPostCreated,
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<'text' | 'job_post' | 'event' | 'training' | 'company_update'>('text');
  const [privacy, setPrivacy] = useState<'public' | 'connections' | 'private'>('public');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [location, setLocation] = useState('');
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!postContent.trim() && attachments.length === 0) return;

    setIsUploading(true);
    try {
      // Simulate post creation
      const newPost = {
        _id: Date.now().toString(),
        author: {
          _id: user?._id || '',
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          profilePicture: user?.profilePicture || '',
          jobTitle: user?.jobTitle || '',
        },
        content: postContent,
        tags,
        postType,
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        visibility: privacy,
        isPinned: false,
        isPromoted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      onPostCreated(newPost);
      handleClose();
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setPostContent('');
    setTags([]);
    setTagInput('');
    setAttachments([]);
    setLocation('');
    setShowPoll(false);
    setPollOptions(['', '']);
    onClose();
  };

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getPrivacyIcon = () => {
    switch (privacy) {
      case 'public': return <Public />;
      case 'connections': return <Group />;
      case 'private': return <Lock />;
      default: return <Public />;
    }
  };

  const getPostTypeLabel = () => {
    switch (postType) {
      case 'job_post': return 'Job Post';
      case 'event': return 'Event';
      case 'training': return 'Training';
      case 'company_update': return 'Company Update';
      default: return 'Post';
    }
  };

  const postTypeOptions = [
    { value: 'text', label: 'General Post', icon: <Article /> },
    { value: 'job_post', label: 'Job Post', icon: <Work /> },
    { value: 'event', label: 'Event', icon: <Event /> },
    { value: 'training', label: 'Training', icon: <School /> },
    { value: 'company_update', label: 'Company Update', icon: <Business /> },
  ];

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="600">
              Create {getPostTypeLabel()}
            </Typography>
            <IconButton onClick={handleClose} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          {/* Author Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              src={user?.profilePicture}
              sx={{ width: 48, height: 48, mr: 2 }}
            >
              {user?.firstName?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight="600">
                {user?.firstName} {user?.lastName}
              </Typography>
              <Button
                size="small"
                startIcon={getPrivacyIcon()}
                endIcon={<ExpandMore />}
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{ 
                  textTransform: 'none',
                  color: 'text.secondary',
                  minWidth: 'auto',
                  p: 0.5,
                  mt: 0.5,
                  borderRadius: 1,
                  fontSize: '0.8rem',
                }}
              >
                {privacy.charAt(0).toUpperCase() + privacy.slice(1)}
              </Button>
            </Box>
          </Box>

          {/* Post Type Selector */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Post Type</InputLabel>
            <Select
              value={postType}
              onChange={(e) => setPostType(e.target.value as any)}
              label="Post Type"
            >
              {postTypeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <ListItemIcon>{option.icon}</ListItemIcon>
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Content Input */}
          <TextField
            multiline
            minRows={4}
            maxRows={8}
            fullWidth
            placeholder={`What do you want to share, ${user?.firstName}?`}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            variant="outlined"
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />

          {/* Tags Input */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={`#${tag}`}
                  onDelete={() => handleRemoveTag(tag)}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Box>
            <TextField
              size="small"
              placeholder="Add tags (press Enter)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag(tagInput.replace('#', ''));
                }
              }}
              InputProps={{
                startAdornment: <Tag sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: '100%' }}
            />
          </Box>

          {/* Location Input */}
          {(postType === 'event' || postType === 'job_post') && (
            <TextField
              fullWidth
              placeholder="Add location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 2 }}
            />
          )}

          {/* Attachments Display */}
          {attachments.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Attachments ({attachments.length})
              </Typography>
              <Grid container spacing={1}>
                {attachments.map((file, index) => (
                  <Grid item xs={6} sm={4} key={index}>
                    <Card sx={{ position: 'relative' }}>
                      {file.type.startsWith('image/') ? (
                        <CardMedia
                          component="img"
                          height="100"
                          image={URL.createObjectURL(file)}
                          alt={file.name}
                          sx={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Box sx={{ 
                          height: 100, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          bgcolor: 'grey.100'
                        }}>
                          <Typography variant="caption" align="center">
                            {file.name}
                          </Typography>
                        </Box>
                      )}
                      <IconButton
                        size="small"
                        sx={{ 
                          position: 'absolute', 
                          top: 4, 
                          right: 4,
                          bgcolor: 'rgba(0,0,0,0.5)',
                          color: 'white',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
                        }}
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress />
            </Box>
          )}

          <Divider sx={{ mb: 2 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Add to your post
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Add Photo">
                <IconButton 
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ color: '#45bd62' }}
                >
                  <Photo />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add Video">
                <IconButton 
                  onClick={() => videoInputRef.current?.click()}
                  sx={{ color: '#f02849' }}
                >
                  <VideoLibrary />
                </IconButton>
              </Tooltip>
              <Tooltip title="Create Poll">
                <IconButton 
                  onClick={() => setShowPoll(!showPoll)}
                  sx={{ color: '#1877f2' }}
                >
                  <Poll />
                </IconButton>
              </Tooltip>
              <Tooltip title="Add Emoji">
                <IconButton sx={{ color: '#f7b928' }}>
                  <EmojiEmotions />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={handleClose} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!postContent.trim() && attachments.length === 0}
            sx={{ 
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
            }}
          >
            Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* Privacy Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { minWidth: 200 }
        }}
      >
        <MenuItem onClick={() => { setPrivacy('public'); setAnchorEl(null); }}>
          <ListItemIcon><Public /></ListItemIcon>
          <ListItemText primary="Public" secondary="Anyone can see" />
        </MenuItem>
        <MenuItem onClick={() => { setPrivacy('connections'); setAnchorEl(null); }}>
          <ListItemIcon><Group /></ListItemIcon>
          <ListItemText primary="Connections" secondary="Your connections only" />
        </MenuItem>
        <MenuItem onClick={() => { setPrivacy('private'); setAnchorEl(null); }}>
          <ListItemIcon><Lock /></ListItemIcon>
          <ListItemText primary="Only me" secondary="Only you can see" />
        </MenuItem>
      </Menu>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/*"
        multiple
        onChange={handleFileUpload}
      />
      <input
        type="file"
        ref={videoInputRef}
        hidden
        accept="video/*"
        onChange={handleFileUpload}
      />
    </>
  );
};

export default ModernCreatePost;
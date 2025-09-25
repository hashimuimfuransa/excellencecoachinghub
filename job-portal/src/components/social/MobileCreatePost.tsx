import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Avatar,
  Typography,
  IconButton,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  Grid,
  Paper,
  Slide,
  useMediaQuery,
  Divider,
  Stack,
  alpha,
} from '@mui/material';
import {
  Close,
  Image,
  VideoLibrary,
  Public,
  Group,
  Lock,
  Business,
  Event,
  Add,
  CloudUpload,
  DeleteOutline,
  PlayCircleOutline,
  Tag,
  Send,
  Camera,
  Videocam,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { TransitionProps } from '@mui/material/transitions';
import { CreatePostData, socialNetworkService } from '../../services/socialNetworkService';
import { uploadService } from '../../services/uploadService';
import { useAuth } from '../../contexts/AuthContext';
import { SafeSlideUp } from '../../utils/transitionFix';

interface MediaFile {
  file: File;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  uploading?: boolean;
  uploadProgress?: number;
}

interface MobileCreatePostProps {
  open: boolean;
  onClose: () => void;
  onPostCreated?: (post: any) => void;
}

const Transition = SafeSlideUp;

const MobileCreatePost: React.FC<MobileCreatePostProps> = ({ 
  open, 
  onClose, 
  onPostCreated 
}) => {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<CreatePostData['postType']>('text');
  const [visibility, setVisibility] = useState<CreatePostData['visibility']>('public');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [currentStep, setCurrentStep] = useState<'content' | 'media' | 'settings'>('content');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;

    setIsSubmitting(true);
    setUploadError('');
    setUploadProgress(0);
    setUploadStatus('Preparing post...');
    
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('content', content.trim());
      
      // Set post type based on media content
      if (mediaFiles.length > 0) {
        const hasVideo = mediaFiles.some(file => file.type === 'video');
        formData.append('postType', hasVideo ? 'video' : 'image');
      } else {
        formData.append('postType', 'text');
      }
      
      formData.append('visibility', visibility);
      
      // Add tags if provided
      if (tags.length > 0) {
        tags.forEach(tag => formData.append('tags[]', tag));
      }

      // Add media files
      mediaFiles.forEach((mediaFile) => {
        formData.append('media', mediaFile.file);
      });

      console.log('📝 Creating post with:', {
        content: content.trim(),
        postType: mediaFiles.length > 0 ? (mediaFiles.some(f => f.type === 'video') ? 'video' : 'image') : 'text',
        visibility,
        tags,
        mediaCount: mediaFiles.length
      });

      setUploadStatus('Uploading files...');
      
      // Create a custom axios instance with progress tracking
      const axios = (await import('axios')).default;
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/posts/create`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          timeout: 300000, // 5 minutes
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
              setUploadStatus(`Uploading... ${percentCompleted}%`);
            }
          }
        }
      );

      setUploadStatus('Creating post...');
      const createdPost = response.data.data || response.data;
      onPostCreated?.(createdPost);
      
      // Reset form and close
      handleClose();
      
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      // Extract error message from response
      let errorMessage = 'Failed to create post. Please try again.';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error.message) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Upload timed out. Please try with smaller files or check your connection.';
        } else if (error.message.includes('Network Error')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setUploadError(errorMessage);
      setUploadStatus('Upload failed');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleClose = () => {
    // Reset all states
    setContent('');
    setPostType('text');
    setVisibility('public');
    setTags([]);
    setTagInput('');
    setMediaFiles([]);
    setUploadError('');
    setCurrentStep('content');
    setShowMediaOptions(false);
    onClose();
  };


  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = event.target.files;
    if (!files) return;

    const maxFiles = 3; // Limit to 3 files for mobile
    const maxFileSize = 50 * 1024 * 1024; // 50MB limit

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size
      if (file.size > maxFileSize) {
        setUploadError(`File ${file.name} is too large. Maximum size is 50MB.`);
        return;
      }

      if (mediaFiles.length >= maxFiles) {
        setUploadError(`Maximum ${maxFiles} files allowed per post.`);
        break;
      }

      const validation = uploadService.validateFile(file, type);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file');
        continue;
      }

      const url = uploadService.createPreviewUrl(file);
      const newMedia: MediaFile = {
        file,
        type,
        url,
        uploading: false,
        uploadProgress: 0,
      };

      if (type === 'video') {
        try {
          const thumbnail = await uploadService.generateVideoThumbnail(file);
          newMedia.thumbnail = thumbnail;
        } catch (error) {
          console.error('Failed to generate thumbnail:', error);
        }
      }

      setMediaFiles(prev => [...prev, newMedia]);
      setUploadError('');
    }

    if (event.target) {
      event.target.value = '';
    }
    setShowMediaOptions(false);
  };

  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      const mediaToRemove = newFiles[index];
      
      uploadService.revokePreviewUrl(mediaToRemove.url);
      if (mediaToRemove.thumbnail) {
        uploadService.revokePreviewUrl(mediaToRemove.thumbnail);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleAddTag = (tag: string) => {
    const cleanTag = tag.trim().replace('#', '');
    if (cleanTag && !tags.includes(cleanTag) && tags.length < 5) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const getVisibilityIcon = (visibilityType: string) => {
    switch (visibilityType) {
      case 'public': return <Public fontSize="small" />;
      case 'connections': return <Group fontSize="small" />;
      case 'private': return <Lock fontSize="small" />;
      default: return <Public fontSize="small" />;
    }
  };

  const getPostTypeColor = (type: string) => {
    const colors = {
      text: theme.palette.grey[500],
      job_post: theme.palette.success.main,
      event: theme.palette.warning.main,
      training: theme.palette.info.main,
      company_update: theme.palette.secondary.main,
    };
    return colors[type as keyof typeof colors] || colors.text;
  };

  const renderContentStep = () => (
    <Box sx={{ p: 0 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, px: 3, pt: 3 }}>
        <Avatar
          src={user?.profilePicture}
          sx={{ 
            width: 40, 
            height: 40, 
            mr: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
        >
          {user?.firstName?.[0]}{user?.lastName?.[0]}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {getVisibilityIcon(visibility)}
            <Typography variant="caption" color="text.secondary">
              {visibility === 'public' ? 'Public' : visibility === 'connections' ? 'Connections' : 'Private'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Content Input */}
      <Box sx={{ px: 3, mb: 2 }}>
        <TextField
          multiline
          rows={6}
          fullWidth
          placeholder="What's on your mind? 💭"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          variant="outlined"
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '1rem',
              '& fieldset': {
                border: 'none',
              },
            },
            '& .MuiInputBase-input': {
              fontSize: '1rem',
              lineHeight: 1.5,
            }
          }}
        />
      </Box>

      {/* Media Preview */}
      {mediaFiles.length > 0 && (
        <Box sx={{ px: 3, mb: 2 }}>
          <Grid container spacing={1}>
            {mediaFiles.map((media, index) => (
              <Grid item xs={4} key={index}>
                <Paper
                  sx={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: 'pointer',
                  }}
                >
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt=""
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: '100%',
                        height: '100%',
                        background: `url(${media.thumbnail || media.url}) center/cover`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <PlayCircleOutline sx={{ color: 'white', fontSize: '2rem' }} />
                    </Box>
                  )}
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveMedia(index)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      bgcolor: alpha(theme.palette.common.black, 0.7),
                      color: 'white',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.common.black, 0.8),
                      },
                    }}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                  
                  {/* File size indicator */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      right: 4,
                      bgcolor: alpha(theme.palette.common.black, 0.7),
                      color: 'white',
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                      fontSize: '0.7rem',
                      textAlign: 'center',
                    }}
                  >
                    {(media.file.size / (1024 * 1024)).toFixed(1)} MB
                  </Box>
                  {media.uploading && (
                    <LinearProgress
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                      }}
                    />
                  )}
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <Box sx={{ px: 3, mb: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={`#${tag}`}
                size="small"
                onDelete={() => handleRemoveTag(tag)}
                sx={{ mb: 1 }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Error Alert */}
      {uploadError && (
        <Box sx={{ px: 3, mb: 2 }}>
          <Alert severity="error" onClose={() => setUploadError('')}>
            {uploadError}
          </Alert>
        </Box>
      )}
    </Box>
  );

  const renderMediaOptions = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Add Media
      </Typography>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Paper
            onClick={() => fileInputRef.current?.click()}
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: 2,
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            <Camera sx={{ fontSize: '2rem', color: 'primary.main', mb: 1 }} />
            <Typography variant="body2" fontWeight={600}>
              Photo
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={6}>
          <Paper
            onClick={() => videoInputRef.current?.click()}
            sx={{
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              borderRadius: 2,
              border: `2px dashed ${alpha(theme.palette.secondary.main, 0.3)}`,
              '&:hover': {
                bgcolor: alpha(theme.palette.secondary.main, 0.05),
              },
            }}
          >
            <Videocam sx={{ fontSize: '2rem', color: 'secondary.main', mb: 1 }} />
            <Typography variant="body2" fontWeight={600}>
              Video
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tag Input */}
      <Box sx={{ mt: 3 }}>
        <TextField
          fullWidth
          placeholder="Add tags (e.g., career, tech, growth)"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleAddTag(tagInput);
            }
          }}
          InputProps={{
            startAdornment: <Tag sx={{ mr: 1, color: 'text.secondary' }} />,
            endAdornment: tagInput ? (
              <IconButton onClick={() => handleAddTag(tagInput)} size="small">
                <Add />
              </IconButton>
            ) : null,
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
      </Box>
    </Box>
  );

  const renderSettingsStep = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
        Post Settings
      </Typography>

      {/* Post Type fixed to text; selector disabled */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Post Type</InputLabel>
        <Select value={"text" as any} label="Post Type" disabled>
          <MenuItem value="text">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box 
                sx={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  backgroundColor: getPostTypeColor('text') 
                }} 
              />
              Text Post
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      {/* Enhanced Visibility Selection */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.primary' }}>
          Who can see this post?
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            { value: 'public', label: 'Public', icon: <Public />, description: 'Anyone can see this post' },
            { value: 'connections', label: 'Connections', icon: <Group />, description: 'Only your connections can see this post' },
            { value: 'private', label: 'Private', icon: <Lock />, description: 'Only you can see this post' }
          ].map((option) => (
            <Paper
              key={option.value}
              onClick={() => setVisibility(option.value as CreatePostData['visibility'])}
              sx={{
                flex: 1,
                minWidth: 100,
                p: 2,
                cursor: 'pointer',
                border: visibility === option.value ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
                backgroundColor: visibility === option.value ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: theme.palette.primary.main,
                },
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  color: visibility === option.value ? 'primary.main' : 'text.secondary',
                  transition: 'color 0.3s ease'
                }}>
                  {option.icon}
                </Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    fontWeight: visibility === option.value ? 600 : 500,
                    color: visibility === option.value ? 'primary.main' : 'text.primary',
                    textAlign: 'center'
                  }}
                >
                  {option.label}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: 'text.secondary',
                    textAlign: 'center',
                    fontSize: '0.7rem',
                    lineHeight: 1.2
                  }}
                >
                  {option.description}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>
    </Box>
  );

  return (
    <>
      <Dialog
        fullScreen={isMobile}
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        maxWidth="sm"
        fullWidth
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 100, // Ensure it's above everything including mobile footer
        }}
        PaperProps={{
          sx: {
            ...(isMobile ? {
              borderRadius: 0,
            } : {
              borderRadius: 3,
              maxHeight: '90vh',
            }),
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.primary.main, 0.05),
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Create Post
          </Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Content */}
        <DialogContent sx={{ p: 0, flexGrow: 1 }}>
          {currentStep === 'content' && renderContentStep()}
          {currentStep === 'media' && renderMediaOptions()}
          {currentStep === 'settings' && renderSettingsStep()}
        </DialogContent>

        {/* Footer Actions */}
        <DialogActions
          sx={{
            p: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            background: alpha(theme.palette.background.paper, 0.8),
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Quick Actions */}
          {currentStep === 'content' && (
            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              <IconButton
                onClick={() => setShowMediaOptions(!showMediaOptions)}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                }}
              >
                <Image />
              </IconButton>
              <IconButton
                onClick={() => setCurrentStep('settings')}
                sx={{
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.2) },
                }}
              >
                <Public />
              </IconButton>
              <Box sx={{ flexGrow: 1 }} />
              
              {/* Upload Progress */}
              {isSubmitting && (
                <Box sx={{ width: '100%', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
                      {uploadStatus}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      {uploadProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      }
                    }} 
                  />
                </Box>
              )}
              
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!content.trim() && mediaFiles.length === 0}
                loading={isSubmitting}
                startIcon={<Send />}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                  },
                }}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </Stack>
          )}

          {/* Back/Next for other steps */}
          {currentStep !== 'content' && (
            <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
              <Button onClick={() => setCurrentStep('content')}>
                Back
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              {currentStep === 'settings' && (
                <>
                  {/* Upload Progress */}
                  {isSubmitting && (
                    <Box sx={{ width: '100%', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mr: 1 }}>
                          {uploadStatus}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 600 }}>
                          {uploadProgress}%
                        </Typography>
                      </Box>
                      <LinearProgress 
                        variant="determinate" 
                        value={uploadProgress} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          }
                        }} 
                      />
                    </Box>
                  )}
                  
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={!content.trim() && mediaFiles.length === 0}
                    loading={isSubmitting}
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </Button>
                </>
              )}
            </Stack>
          )}
        </DialogActions>

        {/* Media Options Overlay */}
        {showMediaOptions && currentStep === 'content' && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 70,
              left: 0,
              right: 0,
              bgcolor: 'background.paper',
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              borderRadius: '16px 16px 0 0',
              boxShadow: theme.shadows[8],
            }}
          >
            {renderMediaOptions()}
          </Box>
        )}
      </Dialog>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFileSelect(e, 'video')}
      />
    </>
  );
};

export default MobileCreatePost;
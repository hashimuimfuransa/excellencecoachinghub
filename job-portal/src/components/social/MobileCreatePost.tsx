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

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

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
  const [currentStep, setCurrentStep] = useState<'content' | 'media' | 'settings'>('content');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) return;

    setIsSubmitting(true);
    try {
      // Upload media files first if any
      const uploadedMediaList = [];
      for (const mediaFile of mediaFiles) {
        if (!mediaFile.uploading) {
          const uploadedMedia = await uploadMediaFile(mediaFile);
          uploadedMediaList.push(uploadedMedia);
        }
      }

      const postData: CreatePostData = {
        content: content.trim(),
        postType,
        visibility,
        tags: tags.length > 0 ? tags : undefined,
        media: uploadedMediaList.length > 0 ? uploadedMediaList : undefined,
      };

      const response = await socialNetworkService.createPost(postData);
      onPostCreated?.(response.data);
      
      // Reset form and close
      handleClose();
      
    } catch (error) {
      console.error('Error creating post:', error);
      setUploadError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  const uploadMediaFile = async (mediaFile: MediaFile): Promise<{ type: 'image' | 'video'; url: string; thumbnail?: string }> => {
    try {
      setMediaFiles(prev => prev.map(m => 
        m.url === mediaFile.url ? { ...m, uploading: true, uploadProgress: 0 } : m
      ));

      const response = await uploadService.uploadFile(mediaFile.file, 'post');
      
      setMediaFiles(prev => prev.map(m => 
        m.url === mediaFile.url ? { ...m, uploading: false, uploadProgress: 100 } : m
      ));

      return {
        type: mediaFile.type,
        url: response.data.url,
        thumbnail: mediaFile.thumbnail,
      };
    } catch (error) {
      console.error('Media upload error:', error);
      return {
        type: mediaFile.type,
        url: mediaFile.url,
        thumbnail: mediaFile.thumbnail,
      };
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = event.target.files;
    if (!files) return;

    const maxFiles = 3; // Limit to 3 files for mobile

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

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

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Post Type</InputLabel>
        <Select
          value={postType}
          label="Post Type"
          onChange={(e) => setPostType(e.target.value as CreatePostData['postType'])}
        >
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
          <MenuItem value="training">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VideoLibrary fontSize="small" sx={{ color: getPostTypeColor('training') }} />
              Training
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Visibility</InputLabel>
        <Select
          value={visibility}
          label="Visibility"
          onChange={(e) => setVisibility(e.target.value as CreatePostData['visibility'])}
        >
          <MenuItem value="public">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Public fontSize="small" />
              Public
            </Box>
          </MenuItem>
          <MenuItem value="connections">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Group fontSize="small" />
              Connections Only
            </Box>
          </MenuItem>
          <MenuItem value="private">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lock fontSize="small" />
              Private
            </Box>
          </MenuItem>
        </Select>
      </FormControl>
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
                Post
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
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={!content.trim() && mediaFiles.length === 0}
                  loading={isSubmitting}
                >
                  Post
                </Button>
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
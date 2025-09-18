import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  Avatar,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Typography,
  useTheme,
  Autocomplete,
  LinearProgress,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  Grid,
  Alert,
} from '@mui/material';
import {
  Image,
  VideoLibrary,
  Business,
  Event,
  Public,
  Group,
  Lock,
  Close,
  CloudUpload,
  DeleteOutline,
  PlayCircleOutline,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
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

interface CreatePostProps {
  onPostCreated?: (post: any) => void;
  onCancel?: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, onCancel }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<CreatePostData['postType']>('text');
  const [visibility, setVisibility] = useState<CreatePostData['visibility']>('public');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
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
        postType: 'text',
        visibility,
        tags: tags.length > 0 ? tags : undefined,
        media: uploadedMediaList.length > 0 ? uploadedMediaList : undefined,
      };

      // Enforce text-only posts
      if (postType !== 'text') {
        setUploadError('Only text posts are allowed at the moment.');
        return;
      }

      const createdPost = await socialNetworkService.createPost(postData);
      onPostCreated?.(createdPost);
      
      // Reset form
      setContent('');
      setPostType('text');
      setVisibility('public');
      setTags([]);
      setTagInput('');
      setMediaFiles([]);
      setUploadError('');
    } catch (error) {
      console.error('Error creating post:', error);
      setUploadError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadMediaFile = async (mediaFile: MediaFile): Promise<{ type: 'image' | 'video'; url: string; thumbnail?: string }> => {
    try {
      // Update upload progress
      setMediaFiles(prev => prev.map(m => 
        m.url === mediaFile.url ? { ...m, uploading: true, uploadProgress: 0 } : m
      ));

      const response = await uploadService.uploadFileSimple(mediaFile.file, 'post');
      
      setMediaFiles(prev => prev.map(m => 
        m.url === mediaFile.url ? { ...m, uploading: false, uploadProgress: 100 } : m
      ));

      return {
        type: mediaFile.type,
        url: response.url,
        thumbnail: mediaFile.thumbnail,
      };
    } catch (error) {
      console.error('Media upload error:', error);
      setMediaFiles(prev => prev.map(m => 
        m.url === mediaFile.url ? { ...m, uploading: false, uploadProgress: 0 } : m
      ));
      
      // For development/testing, use the preview URL
      console.warn('Using preview URL for development');
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

    const maxFiles = 5; // Maximum 5 media files per post

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check total files limit
      if (mediaFiles.length >= maxFiles) {
        setUploadError(`Maximum ${maxFiles} files allowed per post.`);
        break;
      }

      // Validate file using upload service
      const validation = uploadService.validateFile(file, type);
      if (!validation.valid) {
        setUploadError(validation.error || 'Invalid file');
        continue;
      }

      // Create preview URL
      const url = uploadService.createPreviewUrl(file);
      const newMedia: MediaFile = {
        file,
        type,
        url,
        uploading: false,
        uploadProgress: 0,
      };

      // Generate thumbnail for videos
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

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };



  const handleRemoveMedia = (index: number) => {
    setMediaFiles(prev => {
      const newFiles = [...prev];
      const mediaToRemove = newFiles[index];
      
      // Cleanup URLs
      uploadService.revokePreviewUrl(mediaToRemove.url);
      if (mediaToRemove.thumbnail) {
        uploadService.revokePreviewUrl(mediaToRemove.thumbnail);
      }
      
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleVideoUpload = () => {
    videoInputRef.current?.click();
  };

  const handleAddTag = (tag: string) => {
    const cleanTag = tag.trim().replace('#', '');
    if (cleanTag && !tags.includes(cleanTag)) {
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

  return (
    <Card
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      sx={{
        mb: 3,
        borderRadius: 3,
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 32px rgba(0,0,0,0.3)' 
          : '0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={user?.profilePicture}
            sx={{ 
              width: 50, 
              height: 50, 
              mr: 2,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 700 }}>
              Create a post
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Share your thoughts with the community ✨
            </Typography>
          </Box>
          {onCancel && (
            <IconButton 
              onClick={onCancel} 
              size="small"
              sx={{
                bgcolor: 'action.hover',
                '&:hover': { bgcolor: 'action.selected' }
              }}
            >
              <Close />
            </IconButton>
          )}
        </Box>

        {/* Content Input */}
        <TextField
          multiline
          rows={4}
          fullWidth
          placeholder="What's on your mind? Share your thoughts, achievements, or professional insights..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ 
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              fontSize: '1rem',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                }
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderWidth: 2,
                }
              }
            },
            '& .MuiInputBase-input': {
              fontSize: '1rem',
              lineHeight: 1.6,
            }
          }}
        />

        {/* Post Type & Visibility */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {/* Post Type fixed to text; selector removed per requirement */}
          <FormControl size="small" sx={{ minWidth: 140 }}>
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

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={visibility}
              label="Visibility"
              onChange={(e) => setVisibility(e.target.value as CreatePostData['visibility'])}
            >
              <MenuItem value="public">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getVisibilityIcon('public')}
                  Public
                </Box>
              </MenuItem>
              <MenuItem value="connections">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getVisibilityIcon('connections')}
                  Connections
                </Box>
              </MenuItem>
              <MenuItem value="private">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getVisibilityIcon('private')}
                  Private
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Tags */}
        <Autocomplete
          multiple
          freeSolo
          options={[]}
          value={tags}
          inputValue={tagInput}
          onInputChange={(event, newInputValue) => {
            setTagInput(newInputValue);
          }}
          onChange={(event, newValue) => {
            setTags(newValue as string[]);
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                variant="outlined"
                label={`#${option}`}
                {...getTagProps({ index })}
                key={index}
                size="small"
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              placeholder="Add tags (press Enter)"
              sx={{ mb: 2 }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && tagInput.trim()) {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
            />
          )}
        />

        {/* Upload Error Alert */}
        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError('')}>
            {uploadError}
          </Alert>
        )}

        {/* Media Preview */}
        {mediaFiles.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              Media ({mediaFiles.length}/5)
            </Typography>
            <Grid container spacing={2}>
              {mediaFiles.map((media, index) => (
                <Grid item xs={6} sm={4} md={3} key={media.url}>
                  <Box
                    sx={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid',
                      borderColor: 'divider',
                      background: theme.palette.grey[100],
                    }}
                  >
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt="Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                        {media.thumbnail ? (
                          <img
                            src={media.thumbnail}
                            alt="Video thumbnail"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <video
                            src={media.url}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                            muted
                          />
                        )}
                        <PlayCircleOutline
                          sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: 40,
                            color: 'white',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            borderRadius: '50%',
                          }}
                        />
                      </Box>
                    )}
                    
                    {/* Remove Button */}
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveMedia(index)}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        },
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>

                    {/* Upload Progress */}
                    {media.uploading && (
                      <Box
                        sx={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.7)',
                          p: 1,
                        }}
                      >
                        <LinearProgress
                          variant="determinate"
                          value={media.uploadProgress || 0}
                          sx={{ mb: 0.5 }}
                        />
                        <Typography variant="caption" color="white">
                          Uploading... {media.uploadProgress || 0}%
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Media Upload Options */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3, alignItems: 'center' }}>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            multiple
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <input
            type="file"
            ref={videoInputRef}
            style={{ display: 'none' }}
            accept="video/*"
            multiple
            onChange={(e) => handleFileSelect(e, 'video')}
          />
          
          <IconButton
            onClick={handleImageUpload}
            disabled={mediaFiles.length >= 5}
            sx={{
              backgroundColor: theme.palette.action.hover,
              '&:hover': {
                backgroundColor: theme.palette.action.selected,
              },
              '&:disabled': {
                opacity: 0.5,
              }
            }}
          >
            <Image />
          </IconButton>
          
          <IconButton
            onClick={handleVideoUpload}
            disabled={mediaFiles.length >= 5}
            sx={{
              backgroundColor: theme.palette.action.hover,
              '&:hover': {
                backgroundColor: theme.palette.action.selected,
              },
              '&:disabled': {
                opacity: 0.5,
              }
            }}
          >
            <VideoLibrary />
          </IconButton>
          
          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
            Add photos or videos (Max 5 files, 5MB images / 50MB videos)
          </Typography>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          {onCancel && (
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting}
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #0BB4D6 90%)',
              },
            }}
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
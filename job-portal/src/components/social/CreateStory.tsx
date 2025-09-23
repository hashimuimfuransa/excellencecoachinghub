import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  LinearProgress,
  Alert,
  Grid,
  Snackbar,
  Collapse,
  Slide,
} from '@mui/material';
import {
  Close,
  CloudUpload,
  Image,
  VideoLibrary,
  Delete,
  PlayCircleOutline,
  PhotoCamera,
  Videocam,
  Star,
  EmojiEvents,
  School,
  Work,
  TrendingUp,
  Psychology,
  Minimize,
  CheckCircle,
  Warning,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { uploadService } from '../../services/uploadService';
import { socialNetworkService } from '../../services/socialNetworkService';
import { enhancedStoryService } from '../../services/enhancedStoryService';

interface CreateStoryProps {
  open: boolean;
  onClose: () => void;
  onStoryCreated?: (story: any) => void;
}

interface StoryData {
  type: 'achievement' | 'learning' | 'networking' | 'insight' | 'milestone';
  title: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  tags: string[];
  visibility: 'public' | 'connections' | 'private';
}

const storyTypes = [
  {
    type: 'achievement',
    label: 'Career Achievement',
    icon: <EmojiEvents />,
    color: '#FFD700',
    description: 'Share your wins, promotions, and milestones'
  },
  {
    type: 'learning',
    label: 'Learning Journey',
    icon: <School />,
    color: '#4CAF50',
    description: 'Document new skills and knowledge gained'
  },
  {
    type: 'networking',
    label: 'Networking Win',
    icon: <Work />,
    color: '#2196F3',
    description: 'Share successful collaborations and connections'
  },
  {
    type: 'insight',
    label: 'Professional Insight',
    icon: <Psychology />,
    color: '#9C27B0',
    description: 'Share industry tips and advice'
  },
  {
    type: 'milestone',
    label: 'Career Milestone',
    icon: <TrendingUp />,
    color: '#FF5722',
    description: 'Mark important career moments'
  },
];

const CreateStory: React.FC<CreateStoryProps> = ({ open, onClose, onStoryCreated }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storyData, setStoryData] = useState<StoryData>({
    type: 'achievement',
    title: '',
    content: '',
    tags: [],
    visibility: 'connections',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentTag, setCurrentTag] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [backgroundUpload, setBackgroundUpload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleClose = () => {
    // Don't close if uploading in background
    if (backgroundUpload && uploading) {
      return;
    }
    
    setStoryData({
      type: 'achievement',
      title: '',
      content: '',
      tags: [],
      visibility: 'connections',
    });
    setSelectedFile(null);
    setPreview(null);
    setCurrentTag('');
    setIsMinimized(false);
    setUploadComplete(false);
    setBackgroundUpload(false);
    setUploadSuccess(false);
    setUploadError(null);
    onClose();
  };

  const handleMinimize = () => {
    if (uploading) {
      setBackgroundUpload(true);
      setIsMinimized(true);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Enhanced file validation with size limits
      const maxImageSize = 10 * 1024 * 1024; // 10MB for images
      const maxVideoSize = 100 * 1024 * 1024; // 100MB for videos
      
      const validation = uploadService.validateFile(file, file.type.startsWith('video/') ? 'video' : 'image');
      
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      
      // Additional size check with user-friendly messages
      if (file.type.startsWith('image/') && file.size > maxImageSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        console.log(`Large image detected: ${fileSizeMB}MB - will be compressed for faster upload`);
      } else if (file.type.startsWith('video/') && file.size > maxVideoSize) {
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        alert(`Video size (${fileSizeMB}MB) exceeds 100MB limit. Please compress your video before uploading.`);
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
      
      // Show file size info
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.log(`Selected file: ${file.name} (${fileSizeMB}MB)`);
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !storyData.tags.includes(currentTag.trim())) {
      setStoryData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setStoryData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleCreateStory = async () => {
    if (!storyData.title.trim() || !storyData.content.trim()) {
      alert('Please provide both a title and content for your story.');
      return;
    }

    if (storyData.title.length > 100) {
      alert('Title must be 100 characters or less.');
      return;
    }

    if (storyData.content.length > 500) {
      alert('Content must be 500 characters or less for better readability.');
      return;
    }

    // Check if user already has a story in the last 24 hours
    try {
      const userStoriesResponse = await enhancedStoryService.getUserStories(); // Get user stories
      console.log('🧪 TEST - User stories response:', userStoriesResponse);
      
      if (userStoriesResponse.success && userStoriesResponse.data) {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentStories = userStoriesResponse.data.filter((story: any) => {
          const createdAt = new Date(story.createdAt);
          return createdAt > last24Hours;
        });

        if (recentStories.length > 0) {
          console.log('🧪 TEST - Found recent stories:', recentStories);
          alert('You can only create one story per day. Please wait for your current story to expire.');
          return;
        }
      }
    } catch (error) {
      console.warn('Could not check existing stories:', error);
      // Continue with creation attempt
    }

    try {
      setUploading(true);
      
      let mediaData = undefined;
      
      // Upload media if selected
      if (selectedFile) {
        let fileToUpload = selectedFile;
        
        // Compress image files to reduce upload time
        if (selectedFile.type.startsWith('image/')) {
          const fileSizeMB = selectedFile.size / (1024 * 1024);
          if (fileSizeMB > 2) { // Compress files larger than 2MB
            console.log(`Compressing image file: ${fileSizeMB.toFixed(2)}MB`);
            setUploadProgress(5); // Show initial progress
            fileToUpload = await uploadService.compressImage(selectedFile, 0.8, 1920, 1080);
            const compressedSizeMB = fileToUpload.size / (1024 * 1024);
            console.log(`Compressed to: ${compressedSizeMB.toFixed(2)}MB`);
            setUploadProgress(10);
          }
        }
        
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('type', selectedFile.type.startsWith('video/') ? 'video' : 'image');
        
        // Add retry logic for upload
        let uploadResponse;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            uploadResponse = await uploadService.uploadFile(formData, (progress) => {
              // Adjust progress to account for compression step
              const adjustedProgress = selectedFile.type.startsWith('image/') 
                ? 10 + (progress * 0.9)  // 10% for compression + 90% for upload
                : progress;
              setUploadProgress(adjustedProgress);
            });
            break; // Success, exit retry loop
          } catch (error: any) {
            retries++;
            console.log(`Upload attempt ${retries} failed:`, error.message);
            
            if (retries === maxRetries) {
              throw error; // Re-throw if all retries failed
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
            setUploadProgress(10); // Reset progress for retry
          }
        }
        
        mediaData = {
          type: selectedFile.type.startsWith('video/') ? 'video' as const : 'image' as const,
          url: uploadResponse!.url,
          thumbnail: uploadResponse!.thumbnail
        };
      }

      // Create story using API
      const storyPayload = {
        ...storyData,
        media: mediaData,
        tags: storyData.tags || []
      };

      // Map story type for backend compatibility  
      if (storyPayload.type === 'learning' || storyPayload.type === 'insight') {
        storyPayload.type = 'announcement';
      } else if (storyPayload.type === 'networking') {
        storyPayload.type = 'milestone';
      }

      console.log('Creating story with payload:', storyPayload);
      
      const response = await enhancedStoryService.createStory(storyPayload);
      
      if (response.success && response.data) {
        console.log('Story created successfully:', response.data);
        setUploadSuccess(true);
        setUploadComplete(true);
        
        // Show success notification immediately
        setIsMinimized(false); // Ensure notifications show even if minimized
        setBackgroundUpload(false); // Clear background upload state
        
        // Call the callback to update the parent component
        onStoryCreated?.(response.data);
        
        // Show success message for longer to ensure user sees it, then close
        setTimeout(() => {
          setUploadSuccess(false);
          handleClose();
        }, 3000);
      } else {
        throw new Error(response.error || 'Failed to create story');
      }
      
    } catch (error) {
      console.error('Error creating story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create story';
      setUploadError(errorMessage);
      
      // Reset background upload state on error
      setBackgroundUpload(false);
      setIsMinimized(false);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const selectedStoryType = storyTypes.find(type => type.type === storyData.type);

  return (
    <>
      <AnimatePresence>
        {isMinimized && backgroundUpload && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 9999,
            }}
          >
            <Box
              sx={{
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: 3,
                p: 2,
                minWidth: 280,
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={user?.profilePicture} sx={{ width: 32, height: 32 }}>
                  {user?.firstName?.[0]?.toUpperCase()}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>
                  Creating Story...
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsMinimized(false);
                    setBackgroundUpload(false);
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              
              {uploadSuccess ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main">
                    Story uploaded successfully!
                  </Typography>
                </Box>
              ) : uploadError ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning color="error" fontSize="small" />
                  <Typography variant="body2" color="error.main">
                    Upload failed. Please try again.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    {uploadProgress < 10 && selectedFile?.type.startsWith('image/') ? 
                      'Compressing image...' : 
                      uploadProgress < 100 ? 
                        `Uploading... ${Math.round(uploadProgress)}%` : 
                        'Processing story...'
                    }
                  </Typography>
                </Box>
              )}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={open && !isMinimized}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }
        }}
      >
      <DialogTitle sx={{ 
        pb: 1,
        background: `linear-gradient(135deg, ${selectedStoryType?.color}20 0%, ${selectedStoryType?.color}10 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={user?.profilePicture}
            sx={{ width: 40, height: 40 }}
          >
            {user?.firstName?.[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              Create Professional Story
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share your professional journey
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {uploading && (
            <IconButton 
              onClick={handleMinimize}
              sx={{ 
                color: selectedStoryType?.color,
                '&:hover': {
                  backgroundColor: `${selectedStoryType?.color}20`,
                }
              }}
            >
              <Minimize />
            </IconButton>
          )}
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Story Type Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Story Type
          </Typography>
          <Grid container spacing={2}>
            {storyTypes.map((type) => (
              <Grid item xs={12} sm={6} md={4} key={type.type}>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Box
                    onClick={() => setStoryData(prev => ({ ...prev, type: type.type as any }))}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: `2px solid ${storyData.type === type.type ? type.color : 'transparent'}`,
                      backgroundColor: storyData.type === type.type 
                        ? `${type.color}20` 
                        : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: `${type.color}20`,
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Box sx={{ color: type.color }}>
                        {type.icon}
                      </Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {type.label}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" fontSize={12}>
                      {type.description}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Title */}
        <TextField
          fullWidth
          label="Story Title"
          value={storyData.title}
          onChange={(e) => setStoryData(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Give your story a compelling title..."
          inputProps={{ maxLength: 100 }}
          helperText={`${storyData.title.length}/100 characters`}
          sx={{ mb: 2 }}
        />

        {/* Content */}
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Your Story"
          value={storyData.content}
          onChange={(e) => setStoryData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Share your experience, learnings, or insights..."
          inputProps={{ maxLength: 500 }}
          helperText={`${storyData.content.length}/500 characters`}
          sx={{ mb: 2 }}
        />

        {/* Media Upload */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Add Media (Optional)
          </Typography>
          
          {preview ? (
            <Box sx={{ position: 'relative', mb: 2 }}>
              {selectedFile?.type.startsWith('video/') ? (
                <video
                  src={preview}
                  style={{ width: '100%', maxHeight: 200, borderRadius: 8 }}
                  controls
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }}
                />
              )}
              <IconButton
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  color: 'white',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.9)' }
                }}
              >
                <Delete />
              </IconButton>
            </Box>
          ) : (
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              Upload Image or Video
            </Button>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </Box>

        {/* Tags */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
            Tags
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            {storyData.tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                onDelete={() => handleRemoveTag(tag)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="Add a tag..."
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button variant="outlined" onClick={handleAddTag} disabled={!currentTag.trim()}>
              Add
            </Button>
          </Box>
        </Box>

        {/* Visibility */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Who can see this story?</InputLabel>
          <Select
            value={storyData.visibility}
            onChange={(e) => setStoryData(prev => ({ ...prev, visibility: e.target.value as any }))}
            label="Who can see this story?"
          >
            <MenuItem value="public">Everyone</MenuItem>
            <MenuItem value="connections">My Connections</MenuItem>
            <MenuItem value="private">Only Me</MenuItem>
          </Select>
        </FormControl>

        {uploading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {uploadProgress < 10 && selectedFile?.type.startsWith('image/') ? 
                'Compressing image...' : 
                uploadProgress < 100 ? 
                  `Uploading... ${Math.round(uploadProgress)}%` : 
                  'Processing story...'
              }
            </Typography>
            {selectedFile && (
              <Typography variant="caption" color="text.secondary">
                File: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button 
          onClick={handleClose}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreateStory}
          variant="contained"
          disabled={!storyData.title.trim() || !storyData.content.trim() || uploading}
          sx={{
            borderRadius: 2,
            background: `linear-gradient(135deg, ${selectedStoryType?.color} 0%, ${selectedStoryType?.color}CC 100%)`,
            px: 3
          }}
        >
          {uploading ? 'Creating...' : 'Share Story'}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Success Notification */}
    <Snackbar
      open={uploadSuccess && !uploading}
      autoHideDuration={3500}
      onClose={() => setUploadSuccess(false)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={() => setUploadSuccess(false)} 
        severity="success" 
        variant="filled"
        sx={{ 
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
          '& .MuiAlert-icon': {
            fontSize: '1.2rem'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle fontSize="small" />
          <Typography variant="body2" fontWeight={600}>
            🎉 Story uploaded successfully! Your story is now live.
          </Typography>
        </Box>
      </Alert>
    </Snackbar>

    {/* Error Notification */}
    <Snackbar
      open={!!uploadError && !uploading}
      autoHideDuration={6000}
      onClose={() => setUploadError(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert 
        onClose={() => setUploadError(null)} 
        severity="error" 
        variant="filled"
        sx={{ 
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(244, 67, 54, 0.3)',
          '& .MuiAlert-icon': {
            fontSize: '1.2rem'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning fontSize="small" />
          <Typography variant="body2" fontWeight={600}>
            ❌ {uploadError || 'Failed to upload story. Please try again.'}
          </Typography>
        </Box>
      </Alert>
    </Snackbar>
  </>
  );
};

export default CreateStory;
import React, { useState, useRef, useEffect } from 'react';
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
  Slide,
  Backdrop,
  CircularProgress,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Close,
  CloudUpload,
  Delete,
  Minimize,
  CheckCircle,
  Warning,
  Info,
  Star,
  EmojiEvents,
  School,
  Work,
  TrendingUp,
  Psychology,
  AccessTime,
  Visibility,
  VisibilityOff,
  Add,
  Preview,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { uploadService } from '../../services/uploadService';
import { socialNetworkService } from '../../services/socialNetworkService';

interface EnhancedCreateStoryProps {
  open: boolean;
  onClose: () => void;
  onStoryCreated?: (story: any) => void;
  existingStories?: any[];
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
    label: '🏆 Career Achievement',
    icon: <EmojiEvents />,
    color: '#FFD700',
    description: 'Share your wins, promotions, and career milestones',
    examples: ['Got promoted', 'Completed certification', 'Won award']
  },
  {
    type: 'learning',
    label: '📚 Learning Journey',
    icon: <School />,
    color: '#4CAF50',
    description: 'Document new skills and knowledge gained',
    examples: ['Learned new technology', 'Completed course', 'Gained new skills']
  },
  {
    type: 'networking',
    label: '🤝 Professional Network',
    icon: <Work />,
    color: '#2196F3',
    description: 'Share successful collaborations and connections',
    examples: ['Met industry leader', 'Joined new team', 'Partnership success']
  },
  {
    type: 'insight',
    label: '💡 Professional Insight',
    icon: <Psychology />,
    color: '#9C27B0',
    description: 'Share industry tips and professional advice',
    examples: ['Industry trends', 'Best practices', 'Lessons learned']
  },
  {
    type: 'milestone',
    label: '🎯 Career Milestone',
    icon: <TrendingUp />,
    color: '#FF5722',
    description: 'Mark important career moments and transitions',
    examples: ['New job start', 'Career change', 'Project completion']
  },
];

const EnhancedCreateStory: React.FC<EnhancedCreateStoryProps> = ({ 
  open, 
  onClose, 
  onStoryCreated,
  existingStories = []
}) => {
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
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Enhanced state management
  const [canCreateStory, setCanCreateStory] = useState(true);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Check if user can create a story (24-hour restriction)
  useEffect(() => {
    checkStoryCreationEligibility();
  }, [existingStories, open]);

  const checkStoryCreationEligibility = () => {
    if (!existingStories.length) {
      setCanCreateStory(true);
      setRemainingTime(null);
      return;
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Check for any story created in the last 24 hours
    const recentStories = existingStories.filter(story => {
      const createdAt = new Date(story.createdAt);
      return createdAt > last24Hours;
    });

    if (recentStories.length > 0) {
      setCanCreateStory(false);
      
      // Calculate remaining time until next story can be created
      const latestStory = recentStories.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      
      const latestStoryTime = new Date(latestStory.createdAt);
      const nextAllowedTime = new Date(latestStoryTime.getTime() + 24 * 60 * 60 * 1000);
      const timeRemaining = nextAllowedTime.getTime() - now.getTime();
      
      if (timeRemaining > 0) {
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        setRemainingTime(`${hours}h ${minutes}m`);
      } else {
        setCanCreateStory(true);
        setRemainingTime(null);
      }
    } else {
      setCanCreateStory(true);
      setRemainingTime(null);
    }
  };

  const validateStoryData = (): boolean => {
    const errors: string[] = [];
    
    if (!storyData.title.trim()) {
      errors.push('Title is required');
    }
    
    if (storyData.title.length > 100) {
      errors.push('Title must be 100 characters or less');
    }
    
    if (!storyData.content.trim()) {
      errors.push('Content is required');
    }
    
    if (storyData.content.length > 500) {
      errors.push('Content must be 500 characters or less');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleClose = () => {
    if (uploading) {
      return; // Prevent closing during upload
    }
    
    // Reset all state
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
    setUploadSuccess(false);
    setUploadError(null);
    setValidationErrors([]);
    setShowPreview(false);
    onClose();
  };

  const handleMinimize = () => {
    if (uploading) {
      setIsMinimized(true);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enhanced file validation
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    
    const validation = uploadService.validateFile(file, file.type.startsWith('video/') ? 'video' : 'image');
    
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }
    
    if (file.type.startsWith('image/') && file.size > maxImageSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(`Image size (${fileSizeMB}MB) exceeds 10MB limit`);
      return;
    }
    
    if (file.type.startsWith('video/') && file.size > maxVideoSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setUploadError(`Video size (${fileSizeMB}MB) exceeds 100MB limit`);
      return;
    }
    
    setSelectedFile(file);
    setUploadError(null);
    
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddTag = () => {
    const trimmedTag = currentTag.trim();
    if (trimmedTag && !storyData.tags.includes(trimmedTag) && storyData.tags.length < 5) {
      setStoryData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
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
    // Validate story data
    if (!validateStoryData()) {
      return;
    }

    // Double-check story creation eligibility
    if (!canCreateStory) {
      setUploadError(`You can only create one story per day. Please wait ${remainingTime} before creating another story.`);
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      
      let mediaData = undefined;
      
      // Upload media if selected
      if (selectedFile) {
        let fileToUpload = selectedFile;
        
        // Compress image files for better performance
        if (selectedFile.type.startsWith('image/')) {
          const fileSizeMB = selectedFile.size / (1024 * 1024);
          if (fileSizeMB > 2) {
            setUploadProgress(5);
            fileToUpload = await uploadService.compressImage(selectedFile, 0.8, 1920, 1080);
            setUploadProgress(10);
          }
        }
        
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('type', selectedFile.type.startsWith('video/') ? 'video' : 'image');
        
        // Enhanced upload with retry logic
        let uploadResponse;
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            uploadResponse = await uploadService.uploadFile(formData, (progress) => {
              const adjustedProgress = selectedFile.type.startsWith('image/') 
                ? 10 + (progress * 0.8)
                : progress * 0.9;
              setUploadProgress(adjustedProgress);
            });
            break;
          } catch (error: any) {
            retries++;
            if (retries === maxRetries) {
              throw new Error(`Upload failed after ${maxRetries} attempts: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
          }
        }
        
        mediaData = {
          type: selectedFile.type.startsWith('video/') ? 'video' as const : 'image' as const,
          url: uploadResponse!.url,
          thumbnail: uploadResponse!.thumbnail
        };
      }

      // Prepare story payload
      const storyPayload = {
        ...storyData,
        media: mediaData,
        tags: storyData.tags || []
      };

      // Map story types for backend compatibility
      if (storyPayload.type === 'learning' || storyPayload.type === 'insight') {
        storyPayload.type = 'announcement';
      } else if (storyPayload.type === 'networking') {
        storyPayload.type = 'milestone';
      }

      setUploadProgress(95);
      
      // Create the story
      const response = await socialNetworkService.createStory(storyPayload);
      
      if (response.success && response.data) {
        setUploadProgress(100);
        setUploadComplete(true);
        setUploadSuccess(true);
        
        // Enhanced success handling
        setTimeout(() => {
          if (onStoryCreated) {
            onStoryCreated(response.data);
          }
          
          // Show success notification for longer duration
          setTimeout(() => {
            setUploadSuccess(false);
            handleClose();
          }, 3500);
        }, 500);
        
      } else {
        throw new Error(response.error || 'Failed to create story');
      }
      
    } catch (error) {
      console.error('Error creating story:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create story. Please try again.';
      setUploadError(errorMessage);
      setIsMinimized(false);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const selectedStoryType = storyTypes.find(type => type.type === storyData.type);

  // Don't render if user can't create story
  if (!canCreateStory && open) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccessTime color="warning" />
          <Typography variant="h6">Story Creation Limit Reached</Typography>
          <IconButton onClick={onClose} sx={{ ml: 'auto' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            You can only create one story per 24-hour period to maintain quality and engagement.
          </Alert>
          <Typography variant="body1" sx={{ mb: 2 }}>
            You can create your next story in: <strong>{remainingTime}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use this time to plan your next amazing story! Consider what achievement, 
            insight, or milestone you'd like to share with your network.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            Understood
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <>
      {/* Background Upload Indicator */}
      <AnimatePresence>
        {isMinimized && uploading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              zIndex: 9999,
            }}
          >
            <Paper
              elevation={8}
              sx={{
                p: 3,
                minWidth: 300,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: 3,
                border: `2px solid ${selectedStoryType?.color}`,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar src={user?.profilePicture} sx={{ width: 40, height: 40 }}>
                  {user?.firstName?.[0]?.toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Creating Your Story...
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedStoryType?.label}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsMinimized(false);
                  }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              
              {uploadSuccess ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                  <CheckCircle fontSize="small" />
                  <Typography variant="body2" fontWeight={600}>
                    🎉 Story created successfully!
                  </Typography>
                </Box>
              ) : uploadError ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                  <Warning fontSize="small" />
                  <Typography variant="body2">
                    Upload failed. Please try again.
                  </Typography>
                </Box>
              ) : (
                <Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ 
                      mb: 1, 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: `${selectedStoryType?.color}20`,
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: selectedStoryType?.color,
                      }
                    }} 
                  />
                  <Typography variant="caption" color="text.secondary">
                    {uploadProgress < 10 && selectedFile?.type.startsWith('image/') ? 
                      '🔄 Optimizing media...' : 
                      uploadProgress < 100 ? 
                        `📤 Uploading... ${Math.round(uploadProgress)}%` : 
                        '✨ Finalizing story...'
                    }
                  </Typography>
                </Box>
              )}
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Dialog */}
      <Dialog
        open={open && !isMinimized}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '95vh',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          background: `linear-gradient(135deg, ${selectedStoryType?.color}15 0%, ${selectedStoryType?.color}08 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${selectedStoryType?.color} 0%, ${selectedStoryType?.color}CC 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}
            >
              {selectedStoryType?.icon}
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                Create Professional Story
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedStoryType?.description}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {uploading && (
              <Tooltip title="Minimize to background">
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
              </Tooltip>
            )}
            {showPreview && (
              <Tooltip title="Hide Preview">
                <IconButton 
                  onClick={() => setShowPreview(false)}
                  sx={{ color: 'text.secondary' }}
                >
                  <VisibilityOff />
                </IconButton>
              </Tooltip>
            )}
            {!showPreview && storyData.title && storyData.content && (
              <Tooltip title="Show Preview">
                <IconButton 
                  onClick={() => setShowPreview(true)}
                  sx={{ color: 'text.secondary' }}
                >
                  <Preview />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={handleClose} disabled={uploading}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert severity="error" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Please fix the following issues:</Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </Alert>
          )}

          {/* Story Type Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Star sx={{ color: selectedStoryType?.color }} />
              Story Type
            </Typography>
            <Grid container spacing={2}>
              {storyTypes.map((type) => (
                <Grid item xs={12} sm={6} md={4} key={type.type}>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Paper
                      onClick={() => setStoryData(prev => ({ ...prev, type: type.type as any }))}
                      elevation={storyData.type === type.type ? 4 : 1}
                      sx={{
                        p: 2.5,
                        borderRadius: 3,
                        border: `2px solid ${storyData.type === type.type ? type.color : 'transparent'}`,
                        backgroundColor: storyData.type === type.type 
                          ? `${type.color}15` 
                          : theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: `${type.color}12`,
                          transform: 'translateY(-2px)',
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                        <Box sx={{ color: type.color, fontSize: '1.3rem' }}>
                          {type.icon}
                        </Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {type.label}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" fontSize={12} sx={{ mb: 1 }}>
                        {type.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {type.examples.slice(0, 2).map((example, idx) => (
                          <Chip 
                            key={idx}
                            label={example} 
                            size="small" 
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.65rem', 
                              height: 20,
                              color: type.color,
                              borderColor: `${type.color}40`,
                            }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Story Content */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={showPreview ? 6 : 12}>
              {/* Title */}
              <TextField
                fullWidth
                label="Story Title"
                value={storyData.title}
                onChange={(e) => {
                  setStoryData(prev => ({ ...prev, title: e.target.value }));
                  setValidationErrors([]);
                }}
                placeholder={`Share your ${selectedStoryType?.label.toLowerCase()}...`}
                inputProps={{ maxLength: 100 }}
                helperText={`${storyData.title.length}/100 characters`}
                sx={{ mb: 3 }}
                error={validationErrors.some(error => error.includes('Title'))}
              />

              {/* Content */}
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Your Story"
                value={storyData.content}
                onChange={(e) => {
                  setStoryData(prev => ({ ...prev, content: e.target.value }));
                  setValidationErrors([]);
                }}
                placeholder="Share the details of your story, what happened, and what it means to you..."
                inputProps={{ maxLength: 500 }}
                helperText={`${storyData.content.length}/500 characters`}
                sx={{ mb: 3 }}
                error={validationErrors.some(error => error.includes('Content'))}
              />

              {/* Media Upload */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CloudUpload sx={{ color: selectedStoryType?.color }} />
                  Add Media (Optional)
                </Typography>
                
                {preview ? (
                  <Box sx={{ position: 'relative', mb: 2 }}>
                    {selectedFile?.type.startsWith('video/') ? (
                      <video
                        src={preview}
                        style={{ 
                          width: '100%', 
                          maxHeight: 250, 
                          borderRadius: 12,
                          objectFit: 'cover'
                        }}
                        controls
                      />
                    ) : (
                      <img
                        src={preview}
                        alt="Preview"
                        style={{ 
                          width: '100%', 
                          maxHeight: 250, 
                          objectFit: 'cover', 
                          borderRadius: 12 
                        }}
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
                    sx={{ 
                      mb: 2,
                      borderColor: selectedStoryType?.color,
                      color: selectedStoryType?.color,
                      '&:hover': {
                        borderColor: selectedStoryType?.color,
                        backgroundColor: `${selectedStoryType?.color}10`,
                      }
                    }}
                    fullWidth
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
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Tags (up to 5)
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  {storyData.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={`#${tag}`}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                      sx={{ 
                        backgroundColor: `${selectedStoryType?.color}20`,
                        color: selectedStoryType?.color,
                        '& .MuiChip-deleteIcon': {
                          color: selectedStoryType?.color,
                        }
                      }}
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
                    sx={{ flexGrow: 1 }}
                    disabled={storyData.tags.length >= 5}
                  />
                  <Button 
                    variant="outlined" 
                    onClick={handleAddTag} 
                    disabled={!currentTag.trim() || storyData.tags.length >= 5}
                    startIcon={<Add />}
                    sx={{
                      borderColor: selectedStoryType?.color,
                      color: selectedStoryType?.color,
                    }}
                  >
                    Add
                  </Button>
                </Box>
              </Box>

              {/* Visibility */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Who can see this story?</InputLabel>
                <Select
                  value={storyData.visibility}
                  onChange={(e) => setStoryData(prev => ({ ...prev, visibility: e.target.value as any }))}
                  label="Who can see this story?"
                >
                  <MenuItem value="public">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Visibility fontSize="small" />
                      Everyone (Public)
                    </Box>
                  </MenuItem>
                  <MenuItem value="connections">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Work fontSize="small" />
                      My Professional Network
                    </Box>
                  </MenuItem>
                  <MenuItem value="private">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VisibilityOff fontSize="small" />
                      Only Me (Private)
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Preview Panel */}
            {showPreview && (
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    background: theme.palette.mode === 'dark'
                      ? 'rgba(255,255,255,0.05)'
                      : 'rgba(0,0,0,0.02)',
                    border: `1px solid ${selectedStoryType?.color}40`,
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: selectedStoryType?.color }}>
                    📱 Story Preview
                  </Typography>
                  
                  {/* Preview Story Card */}
                  <Box
                    sx={{
                      background: theme.palette.background.paper,
                      borderRadius: 3,
                      p: 2,
                      border: `2px solid ${selectedStoryType?.color}`,
                      position: 'relative',
                    }}
                  >
                    {/* Author Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar 
                        src={user?.profilePicture} 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          border: `2px solid ${selectedStoryType?.color}`,
                        }}
                      >
                        {user?.firstName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {user?.firstName} {user?.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {selectedStoryType?.label} • Just now
                        </Typography>
                      </Box>
                    </Box>

                    {/* Story Content */}
                    {storyData.title && (
                      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, fontSize: '1rem' }}>
                        {storyData.title}
                      </Typography>
                    )}
                    
                    {storyData.content && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {storyData.content}
                      </Typography>
                    )}

                    {/* Preview Media */}
                    {preview && (
                      <Box sx={{ mb: 2 }}>
                        {selectedFile?.type.startsWith('video/') ? (
                          <video
                            src={preview}
                            style={{ 
                              width: '100%', 
                              maxHeight: 120, 
                              borderRadius: 8,
                              objectFit: 'cover'
                            }}
                            muted
                          />
                        ) : (
                          <img
                            src={preview}
                            alt="Preview"
                            style={{ 
                              width: '100%', 
                              maxHeight: 120, 
                              objectFit: 'cover', 
                              borderRadius: 8 
                            }}
                          />
                        )}
                      </Box>
                    )}

                    {/* Tags Preview */}
                    {storyData.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                        {storyData.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={`#${tag}`}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontSize: '0.7rem',
                              height: 18,
                              color: selectedStoryType?.color,
                              borderColor: `${selectedStoryType?.color}60`,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                    
                    {/* Story Type Badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -1,
                        right: -1,
                        background: selectedStoryType?.color,
                        color: 'white',
                        borderRadius: '0 12px 0 12px',
                        px: 1,
                        py: 0.5,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    >
                      {selectedStoryType?.label.split(' ')[0]}
                    </Box>
                  </Box>
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                    This is how your story will appear to others
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mt: 3, p: 3, backgroundColor: `${selectedStoryType?.color}08`, borderRadius: 3 }}>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ 
                  mb: 2, 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: `${selectedStoryType?.color}20`,
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: selectedStoryType?.color,
                    borderRadius: 4,
                  }
                }} 
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">
                  {uploadProgress < 10 && selectedFile?.type.startsWith('image/') ? 
                    '🔄 Optimizing your media for the best experience...' : 
                    uploadProgress < 95 ? 
                      `📤 Uploading your story... ${Math.round(uploadProgress)}%` : 
                      uploadProgress < 100 ?
                        '✨ Finalizing your professional story...' :
                        '🎉 Story created successfully!'
                  }
                </Typography>
                <Typography variant="caption" fontWeight={600} sx={{ color: selectedStoryType?.color }}>
                  {Math.round(uploadProgress)}%
                </Typography>
              </Box>
              {selectedFile && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  📎 {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
          <Button 
            onClick={handleClose}
            variant="outlined"
            disabled={uploading}
            sx={{ 
              borderRadius: 2,
              px: 3,
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateStory}
            variant="contained"
            disabled={!storyData.title.trim() || !storyData.content.trim() || uploading || validationErrors.length > 0}
            sx={{
              borderRadius: 2,
              px: 4,
              background: uploading 
                ? 'linear-gradient(135deg, #ccc 0%, #999 100%)'
                : `linear-gradient(135deg, ${selectedStoryType?.color} 0%, ${selectedStoryType?.color}CC 100%)`,
              '&:hover': {
                background: uploading 
                  ? 'linear-gradient(135deg, #ccc 0%, #999 100%)'
                  : `linear-gradient(135deg, ${selectedStoryType?.color}DD 0%, ${selectedStoryType?.color}BB 100%)`,
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #ccc 0%, #999 100%)',
                color: 'white',
              }
            }}
          >
            {uploading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: 'white' }} />
                Creating Story...
              </Box>
            ) : (
              '🚀 Share My Story'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Success Notification */}
      <Snackbar
        open={uploadSuccess && !uploading && !isMinimized}
        autoHideDuration={4000}
        onClose={() => setUploadSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' }}
      >
        <Alert 
          onClose={() => setUploadSuccess(false)} 
          severity="success" 
          variant="filled"
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)',
            minWidth: 350,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>
                🎉 Story Created Successfully!
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Your professional story is now live and visible to your network. Great job!
              </Typography>
            </Box>
          </Box>
        </Alert>
      </Snackbar>

      {/* Enhanced Error Notification */}
      <Snackbar
        open={!!uploadError && !uploading}
        autoHideDuration={6000}
        onClose={() => setUploadError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' }}
      >
        <Alert 
          onClose={() => setUploadError(null)} 
          severity="error" 
          variant="filled"
          sx={{ 
            borderRadius: 3,
            boxShadow: '0 12px 40px rgba(244, 67, 54, 0.4)',
            minWidth: 350,
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>
              ❌ Story Creation Failed
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {uploadError}
            </Typography>
          </Box>
        </Alert>
      </Snackbar>

      {/* Upload Loading Backdrop */}
      {uploading && !isMinimized && (
        <Backdrop
          sx={{ 
            color: '#fff', 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            backdropFilter: 'blur(4px)',
          }}
          open={uploading && !isMinimized}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress 
              size={60} 
              sx={{ 
                color: selectedStoryType?.color,
                mb: 2
              }} 
            />
            <Typography variant="h6" sx={{ mb: 1 }}>
              Creating Your Story...
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.8)">
              Please don't close this window
            </Typography>
          </Box>
        </Backdrop>
      )}
    </>
  );
};

export default EnhancedCreateStory;
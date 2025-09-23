import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  Avatar,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  LinearProgress,
  useTheme,
  useMediaQuery,
  Button,
  TextField,
  Chip,
  alpha,
  Fab,
  Paper,
} from '@mui/material';
import {
  Add,
  Close,
  Camera,
  VideoLibrary,
  TextFields,
  Palette,
  Send,
  Favorite,
  FavoriteBorder,
  Reply,
  MoreVert,
  ArrowBackIos,
  ArrowForwardIos,
  VolumeOff,
  VolumeUp,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface Story {
  id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    jobTitle?: string;
  };
  content: {
    type: 'image' | 'video' | 'text';
    url?: string;
    text?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  createdAt: string;
  viewsCount: number;
  isViewed: boolean;
  duration: number; // in seconds
}

interface ModernStoriesProps {
  stories: Story[];
  onCreateStory: (story: Omit<Story, 'id' | 'createdAt' | 'viewsCount' | 'isViewed'>) => void;
}

const ModernStories: React.FC<ModernStoriesProps> = ({ stories, onCreateStory }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');

  // Create story states
  const [createType, setCreateType] = useState<'image' | 'video' | 'text'>('text');
  const [storyText, setStoryText] = useState('');
  const [storyBg, setStoryBg] = useState('#1877f2');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Sample stories data
  const sampleStories: Story[] = [
    {
      id: '1',
      user: {
        _id: '1',
        firstName: 'John',
        lastName: 'Doe',
        profilePicture: '',
        jobTitle: 'Software Engineer',
      },
      content: {
        type: 'text',
        text: '🚀 Just deployed my latest React app! Feeling accomplished!',
        backgroundColor: '#667eea',
        textColor: '#ffffff',
      },
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      viewsCount: 45,
      isViewed: false,
      duration: 5,
    },
    {
      id: '2',
      user: {
        _id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        profilePicture: '',
        jobTitle: 'UX Designer',
      },
      content: {
        type: 'text',
        text: '☕ Morning coffee and design inspiration. What fuels your creativity?',
        backgroundColor: '#f093fb',
        textColor: '#ffffff',
      },
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      viewsCount: 32,
      isViewed: true,
      duration: 5,
    },
    {
      id: '3',
      user: {
        _id: '3',
        firstName: 'Mike',
        lastName: 'Chen',
        profilePicture: '',
        jobTitle: 'Product Manager',
      },
      content: {
        type: 'text',
        text: '📈 Exciting team meeting today! New product launch is going to be amazing.',
        backgroundColor: '#43e97b',
        textColor: '#ffffff',
      },
      createdAt: new Date(Date.now() - 1800000).toISOString(),
      viewsCount: 78,
      isViewed: false,
      duration: 5,
    },
  ];

  const combinedStories = [...sampleStories, ...stories];

  const startProgressTimer = (duration: number) => {
    setStoryProgress(0);
    progressInterval.current = setInterval(() => {
      setStoryProgress((prev) => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + (100 / (duration * 10));
      });
    }, 100);
  };

  const stopProgressTimer = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  const handleStoryClick = (index: number) => {
    setSelectedStoryIndex(index);
    setStoryProgress(0);
    if (isPlaying) {
      startProgressTimer(combinedStories[index].duration);
    }
  };

  const closeStoryViewer = () => {
    setSelectedStoryIndex(null);
    stopProgressTimer();
    setStoryProgress(0);
    setIsPlaying(true);
    setReplyText('');
  };

  const goToNextStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex < combinedStories.length - 1) {
      const nextIndex = selectedStoryIndex + 1;
      setSelectedStoryIndex(nextIndex);
      setStoryProgress(0);
      if (isPlaying) {
        stopProgressTimer();
        startProgressTimer(combinedStories[nextIndex].duration);
      }
    } else {
      closeStoryViewer();
    }
  };

  const goToPrevStory = () => {
    if (selectedStoryIndex !== null && selectedStoryIndex > 0) {
      const prevIndex = selectedStoryIndex - 1;
      setSelectedStoryIndex(prevIndex);
      setStoryProgress(0);
      if (isPlaying) {
        stopProgressTimer();
        startProgressTimer(combinedStories[prevIndex].duration);
      }
    }
  };

  const togglePlayPause = () => {
    if (selectedStoryIndex !== null) {
      setIsPlaying(!isPlaying);
      if (!isPlaying) {
        startProgressTimer(combinedStories[selectedStoryIndex].duration);
      } else {
        stopProgressTimer();
      }
    }
  };

  const handleCreateStory = async () => {
    if (!storyText.trim() && !selectedFile) return;

    const newStory: Omit<Story, 'id' | 'createdAt' | 'viewsCount' | 'isViewed'> = {
      user: {
        _id: user?._id || '',
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        profilePicture: user?.profilePicture || '',
        jobTitle: user?.jobTitle || '',
      },
      content: {
        type: createType,
        text: createType === 'text' ? storyText : undefined,
        backgroundColor: createType === 'text' ? storyBg : undefined,
        textColor: createType === 'text' ? '#ffffff' : undefined,
        url: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
      },
      duration: 5,
    };

    onCreateStory(newStory);
    setShowCreateStory(false);
    setStoryText('');
    setSelectedFile(null);
    setCreateType('text');
  };

  const backgroundGradients = [
    '#667eea',
    '#f093fb',
    '#43e97b',
    '#f093fb',
    '#4facfe',
    '#fa709a',
    '#a8edea',
    '#ff6a88',
  ];

  const renderStoryItem = (story: Story, index: number, isOwn: boolean = false) => (
    <motion.div
      key={`${story.id}-${index}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minWidth: 70,
          cursor: 'pointer',
        }}
        onClick={() => !isOwn && handleStoryClick(index)}
      >
        <Box sx={{ position: 'relative' }}>
          <Avatar
            src={story.user.profilePicture}
            sx={{
              width: 60,
              height: 60,
              border: story.isViewed
                ? `2px solid ${alpha(theme.palette.divider, 0.5)}`
                : `3px solid ${theme.palette.primary.main}`,
              cursor: 'pointer',
              transition: 'transform 0.2s ease-in-out',
            }}
          >
            {!story.user.profilePicture && story.user.firstName.charAt(0)}
          </Avatar>
          {isOwn && (
            <IconButton
              size="small"
              sx={{
                position: 'absolute',
                bottom: -5,
                right: -5,
                bgcolor: 'primary.main',
                color: 'white',
                width: 24,
                height: 24,
                '&:hover': { bgcolor: 'primary.dark' },
              }}
              onClick={() => setShowCreateStory(true)}
            >
              <Add fontSize="small" />
            </IconButton>
          )}
        </Box>
        <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', fontSize: '0.7rem' }}>
          {isOwn ? 'Your story' : `${story.user.firstName}`}
        </Typography>
      </Box>
    </motion.div>
  );

  const renderStoryViewer = () => {
    if (selectedStoryIndex === null) return null;

    const story = combinedStories[selectedStoryIndex];
    if (!story) return null;

    return (
      <Dialog
        open={true}
        onClose={closeStoryViewer}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: '#000',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogContent sx={{ p: 0, position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Progress bars */}
          <Box sx={{ display: 'flex', gap: 0.5, p: 1, zIndex: 2 }}>
            {combinedStories.map((_, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  height: 3,
                  bgcolor: alpha('#fff', 0.3),
                  borderRadius: 1.5,
                  overflow: 'hidden',
                }}
              >
                <LinearProgress
                  variant="determinate"
                  value={
                    index < selectedStoryIndex
                      ? 100
                      : index === selectedStoryIndex
                      ? storyProgress
                      : 0
                  }
                  sx={{
                    height: '100%',
                    bgcolor: 'transparent',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: '#fff',
                    },
                  }}
                />
              </Box>
            ))}
          </Box>

          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', p: 2, color: 'white', zIndex: 2 }}>
            <Avatar src={story.user.profilePicture} sx={{ width: 32, height: 32, mr: 2 }}>
              {story.user.firstName.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="600">
                {story.user.firstName} {story.user.lastName}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {Math.floor((Date.now() - new Date(story.createdAt).getTime()) / 3600000)}h ago
              </Typography>
            </Box>
            <IconButton sx={{ color: 'white' }} onClick={togglePlayPause}>
              {isPlaying ? <VolumeUp /> : <VolumeOff />}
            </IconButton>
            <IconButton sx={{ color: 'white' }}>
              <MoreVert />
            </IconButton>
            <IconButton sx={{ color: 'white' }} onClick={closeStoryViewer}>
              <Close />
            </IconButton>
          </Box>

          {/* Story Content */}
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              background: story.content.backgroundColor || '#000',
              backgroundImage: story.content.url ? `url(${story.content.url})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={togglePlayPause}
          >
            {story.content.type === 'text' && (
              <Typography
                variant="h4"
                sx={{
                  color: story.content.textColor || '#fff',
                  textAlign: 'center',
                  p: 4,
                  fontWeight: 600,
                  textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                  maxWidth: '80%',
                }}
              >
                {story.content.text}
              </Typography>
            )}

            {/* Navigation Areas */}
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '30%',
                cursor: 'pointer',
                zIndex: 1,
              }}
              onClick={(e) => {
                e.stopPropagation();
                goToPrevStory();
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: '30%',
                cursor: 'pointer',
                zIndex: 1,
              }}
              onClick={(e) => {
                e.stopPropagation();
                goToNextStory();
              }}
            />
          </Box>

          {/* Reply Box */}
          <Box sx={{ p: 2, bgcolor: alpha('#000', 0.8), zIndex: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                placeholder={`Reply to ${story.user.firstName}...`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: alpha('#fff', 0.1),
                    color: 'white',
                    borderRadius: 25,
                    '& fieldset': {
                      borderColor: alpha('#fff', 0.3),
                    },
                    '&:hover fieldset': {
                      borderColor: alpha('#fff', 0.5),
                    },
                  },
                  '& input::placeholder': {
                    color: alpha('#fff', 0.7),
                  },
                }}
              />
              <IconButton sx={{ color: 'primary.main' }}>
                <Send />
              </IconButton>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    );
  };

  const renderCreateStoryDialog = () => (
    <Dialog open={showCreateStory} onClose={() => setShowCreateStory(false)} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar src={user?.profilePicture} sx={{ width: 48, height: 48, mr: 2 }}>
            {user?.firstName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="600">
              Create Story
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share a moment with your network
            </Typography>
          </Box>
        </Box>

        {/* Content Type Selection */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant={createType === 'text' ? 'contained' : 'outlined'}
            startIcon={<TextFields />}
            onClick={() => setCreateType('text')}
            sx={{ flex: 1 }}
          >
            Text
          </Button>
          <Button
            variant={createType === 'image' ? 'contained' : 'outlined'}
            startIcon={<Camera />}
            onClick={() => {
              setCreateType('image');
              fileInputRef.current?.click();
            }}
            sx={{ flex: 1 }}
          >
            Photo
          </Button>
          <Button
            variant={createType === 'video' ? 'contained' : 'outlined'}
            startIcon={<VideoLibrary />}
            onClick={() => {
              setCreateType('video');
              videoInputRef.current?.click();
            }}
            sx={{ flex: 1 }}
          >
            Video
          </Button>
        </Box>

        {createType === 'text' && (
          <>
            <TextField
              multiline
              rows={4}
              fullWidth
              placeholder="What's on your mind?"
              value={storyText}
              onChange={(e) => setStoryText(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            {/* Background Color Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Background Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {backgroundGradients.map((color, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: color,
                      cursor: 'pointer',
                      border: storyBg === color ? '3px solid white' : '2px solid transparent',
                      boxShadow: storyBg === color ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
                    }}
                    onClick={() => setStoryBg(color)}
                  />
                ))}
              </Box>
            </Box>

            {/* Preview */}
            <Paper
              sx={{
                height: 200,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: storyBg,
                color: 'white',
                mb: 3,
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" textAlign="center" sx={{ p: 2 }}>
                {storyText || 'Your story preview'}
              </Typography>
            </Paper>
          </>
        )}

        {(createType === 'image' || createType === 'video') && selectedFile && (
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Selected file: {selectedFile.name}
            </Typography>
            {createType === 'image' && (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }}
              />
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button onClick={() => setShowCreateStory(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateStory}
            disabled={!storyText.trim() && !selectedFile}
          >
            Share Story
          </Button>
        </Box>
      </DialogContent>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept="image/*"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
      />
      <input
        type="file"
        ref={videoInputRef}
        hidden
        accept="video/*"
        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
      />
    </Dialog>
  );

  return (
    <>
      {/* Stories Container */}
      <Card sx={{ mb: 2, p: 2, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
          {/* Own story (create) */}
          {renderStoryItem(
            {
              id: 'own',
              user: {
                _id: user?._id || '',
                firstName: user?.firstName || 'Your',
                lastName: '',
                profilePicture: user?.profilePicture || '',
              },
              content: { type: 'text' },
              createdAt: new Date().toISOString(),
              viewsCount: 0,
              isViewed: false,
              duration: 5,
            },
            -1,
            true
          )}

          {/* Other stories */}
          {combinedStories.map((story, index) => renderStoryItem(story, index))}
        </Box>
      </Card>

      {/* Story Viewer */}
      <AnimatePresence>{selectedStoryIndex !== null && renderStoryViewer()}</AnimatePresence>

      {/* Create Story Dialog */}
      {renderCreateStoryDialog()}
    </>
  );
};

export default ModernStories;
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Stack,
  Fab,
  useTheme
} from '@mui/material';
import {
  Close,
  Image,
  AttachFile,
  EmojiEmotions,
  Send
} from '@mui/icons-material';

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
  onPost: (content: string) => void;
  userAvatar?: string;
  userName?: string;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  open,
  onClose,
  onPost,
  userAvatar,
  userName
}) => {
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const handlePost = () => {
    if (content.trim()) {
      onPost(content.trim());
      setContent('');
      setImages([]);
      onClose();
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      // In real implementation, upload files to server
      // For now, just simulate adding image URLs
      const newImages = Array.from(files).map(file => 
        URL.createObjectURL(file)
      );
      setImages(prev => [...prev, ...newImages]);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, sm: 2 },
          maxHeight: '90vh',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Create Post
        </Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* User Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              src={userAvatar} 
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 2,
                bgcolor: theme.palette.primary.main
              }}
            >
              {userName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {userName || 'Student'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Share your thoughts with the community
              </Typography>
            </Box>
          </Box>

          {/* Content Input */}
          <TextField
            fullWidth
            multiline
            rows={6}
            placeholder="What's on your mind? Share your learning journey, ask questions, or help fellow students..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="standard"
            sx={{
              mb: 2,
              '& .MuiInput-underline:before': {
                borderBottomColor: theme.palette.divider,
              },
              '& .MuiInput-underline:hover:before': {
                borderBottomColor: theme.palette.primary.main,
              },
              '& .MuiInputBase-input': {
                fontSize: '16px',
                lineHeight: 1.5,
              },
            }}
          />

          {/* Images Preview */}
          {images.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Images ({images.length})
              </Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {images.map((image, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      width: 80,
                      height: 80,
                      borderRadius: 1,
                      overflow: 'hidden',
                      bgcolor: theme.palette.grey[100],
                    }}
                  >
                    <img
                      src={image}
                      alt={`Upload ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <IconButton
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        width: 20,
                        height: 20,
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.7)',
                        },
                      }}
                      onClick={() => {
                        setImages(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Action Buttons */}
          <Stack 
            direction="row" 
            spacing={1} 
            sx={{ 
              mb: 2,
              flexWrap: 'wrap',
              gap: 1
            }}
          >
            <Button
              variant="outlined"
              startIcon={<Image />}
              size="small"
              component="label"
              sx={{
                borderColor: theme.palette.grey[300],
                color: theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                },
              }}
            >
              Photo
              <input
                type="file"
                hidden
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<AttachFile />}
              size="small"
              sx={{
                borderColor: theme.palette.grey[300],
                color: theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                },
              }}
            >
              Document
            </Button>

            <Button
              variant="outlined"
              startIcon={<EmojiEmotions />}
              size="small"
              sx={{
                borderColor: theme.palette.grey[300],
                color: theme.palette.text.secondary,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                },
              }}
            >
              Emoji
            </Button>
          </Stack>

          {/* Suggested Tags */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Suggested tags:
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {['#programming', '#questions', '#help', '#javascript', '#study'].map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  clickable
                  onClick={() => {
                    setContent(prev => `${prev} ${tag}`);
                  }}
                  sx={{
                    borderColor: theme.palette.grey[300],
                    color: theme.palette.text.secondary,
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          borderTop: `1px solid ${theme.palette.divider}`,
          p: 2,
          gap: 1,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderColor: theme.palette.grey[300],
            color: theme.palette.text.secondary,
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handlePost}
          variant="contained"
          disabled={!content.trim()}
          startIcon={<Send />}
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1,
          }}
        >
          Post
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePostModal;

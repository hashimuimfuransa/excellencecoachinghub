import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { CreatePostData, socialNetworkService } from '../../services/socialNetworkService';
import { useAuth } from '../../contexts/AuthContext';

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

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      const postData: CreatePostData = {
        content: content.trim(),
        postType,
        visibility,
        tags: tags.length > 0 ? tags : undefined,
      };

      const response = await socialNetworkService.createPost(postData);
      onPostCreated?.(response.data);
      
      // Reset form
      setContent('');
      setPostType('text');
      setVisibility('public');
      setTags([]);
      setTagInput('');
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
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
          <FormControl size="small" sx={{ minWidth: 140 }}>
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
              <MenuItem value="job_post">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business fontSize="small" sx={{ color: getPostTypeColor('job_post') }} />
                  Job Post
                </Box>
              </MenuItem>
              <MenuItem value="event">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Event fontSize="small" sx={{ color: getPostTypeColor('event') }} />
                  Event
                </Box>
              </MenuItem>
              <MenuItem value="training">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VideoLibrary fontSize="small" sx={{ color: getPostTypeColor('training') }} />
                  Training
                </Box>
              </MenuItem>
              <MenuItem value="company_update">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business fontSize="small" sx={{ color: getPostTypeColor('company_update') }} />
                  Company Update
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

        {/* Media Options (Coming Soon) */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <IconButton disabled>
            <Image />
          </IconButton>
          <IconButton disabled>
            <VideoLibrary />
          </IconButton>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
            Media uploads coming soon
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
            disabled={!content.trim() || isSubmitting}
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
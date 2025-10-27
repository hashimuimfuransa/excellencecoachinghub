import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  alpha,
  useTheme,
  Tooltip,
  AvatarGroup,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
} from '@mui/material';
import {
  ThumbUp,
  Comment,
  Share,
  Send,
  Favorite,
  CelebrationOutlined,
  SentimentSatisfiedAlt,
  ThumbDown,
  EmojiEmotions,
  Facebook,
  Twitter,
  LinkedIn,
  WhatsApp,
  ContentCopy,
  BookmarkBorder,
  Bookmark,
  Flag,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { SocialPost } from '../../types/social';

interface PostEngagementProps {
  post: SocialPost;
  onLike: (postId: string, reactionType?: string) => void;
  onComment: (postId: string) => void;
  onShare: (postId: string) => void;
  onSave: (postId: string) => void;
}

const PostEngagement: React.FC<PostEngagementProps> = ({
  post,
  onLike,
  onComment,
  onShare,
  onSave,
}) => {
  const theme = useTheme();
  const { user } = useAuth();

  const [reactionMenuAnchor, setReactionMenuAnchor] = useState<null | HTMLElement>(null);
  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [showLikesDialog, setShowLikesDialog] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const reactions = [
    { type: 'like', icon: ThumbUp, color: '#1877f2', label: 'Like' },
    { type: 'love', icon: Favorite, color: '#e91e63', label: 'Love' },
    { type: 'laugh', icon: SentimentSatisfiedAlt, color: '#ffc107', label: 'Haha' },
    { type: 'celebrate', icon: CelebrationOutlined, color: '#ff9800', label: 'Celebrate' },
    { type: 'wow', icon: EmojiEmotions, color: '#2196f3', label: 'Wow' },
  ];

  const shareOptions = [
    { label: 'Share to Feed', icon: Share, action: () => onShare(post._id) },
    { label: 'Send in Message', icon: Send, action: () => {} },
    { label: 'Copy Link', icon: ContentCopy, action: () => copyToClipboard() },
    { label: 'Share on LinkedIn', icon: LinkedIn, action: () => shareToLinkedIn() },
    { label: 'Share on Twitter', icon: Twitter, action: () => shareToTwitter() },
    { label: 'Share on WhatsApp', icon: WhatsApp, action: () => shareToWhatsApp() },
  ];

  // Sample users who liked the post
  const likedByUsers = [
    { _id: '1', firstName: 'John', lastName: 'Doe', profilePicture: '' },
    { _id: '2', firstName: 'Sarah', lastName: 'Johnson', profilePicture: '' },
    { _id: '3', firstName: 'Mike', lastName: 'Chen', profilePicture: '' },
    { _id: '4', firstName: 'Emma', lastName: 'Davis', profilePicture: '' },
    { _id: '5', firstName: 'Alex', lastName: 'Wilson', profilePicture: '' },
  ];

  const handleReactionSelect = (reactionType: string) => {
    onLike(post._id, reactionType);
    setReactionMenuAnchor(null);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareMenuAnchor(null);
  };

  const shareToLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.content.substring(0, 200) + '...');
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&text=${text}`, '_blank');
    setShareMenuAnchor(null);
  };

  const shareToTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(post.content.substring(0, 200) + '...');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    setShareMenuAnchor(null);
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(post.content + '\n' + window.location.href);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShareMenuAnchor(null);
  };

  const isLiked = post.likes.includes(user?._id || '');

  return (
    <>
      {/* Engagement Stats */}
      <Box sx={{ px: 2, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Reactions Display */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => setShowLikesDialog(true)}
          >
            {post.likesCount > 0 && (
              <>
                <AvatarGroup 
                  max={3} 
                  sx={{ 
                    '& .MuiAvatar-root': { 
                      width: 20, 
                      height: 20, 
                      fontSize: '0.75rem',
                      border: '1px solid white',
                    }
                  }}
                >
                  {reactions.slice(0, 3).map((reaction, index) => (
                    <Avatar 
                      key={reaction.type}
                      sx={{ 
                        bgcolor: reaction.color,
                        width: 20,
                        height: 20,
                      }}
                    >
                      <reaction.icon sx={{ fontSize: 12, color: 'white' }} />
                    </Avatar>
                  ))}
                </AvatarGroup>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {post.likesCount}
                </Typography>
              </>
            )}
          </Box>

          {/* Comments and Shares */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
              {post.commentsCount} comments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer' }}>
              {post.sharesCount} shares
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider />

      {/* Action Buttons */}
      <Box sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
          {/* Like Button with Reactions */}
          <Box sx={{ position: 'relative' }}>
            <Button
              startIcon={<ThumbUp />}
              onMouseEnter={(e) => setReactionMenuAnchor(e.currentTarget)}
              onMouseLeave={() => setTimeout(() => setReactionMenuAnchor(null), 300)}
              onClick={() => onLike(post._id)}
              sx={{ 
                textTransform: 'none',
                color: isLiked ? 'primary.main' : 'text.secondary',
                fontWeight: isLiked ? 600 : 400,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                borderRadius: 2,
                px: 2,
                py: 1,
              }}
            >
              Like
            </Button>

            {/* Reaction Menu */}
            <AnimatePresence>
              {reactionMenuAnchor && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  transition={{ duration: 0.2 }}
                  style={{ 
                    position: 'absolute', 
                    bottom: '100%', 
                    left: '50%', 
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                  }}
                  onMouseEnter={() => setReactionMenuAnchor(reactionMenuAnchor)}
                  onMouseLeave={() => setReactionMenuAnchor(null)}
                >
                  <Box
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: 25,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                      p: 1,
                      display: 'flex',
                      gap: 1,
                      border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                    }}
                  >
                    {reactions.map((reaction) => (
                      <Tooltip key={reaction.type} title={reaction.label}>
                        <IconButton
                          size="small"
                          onClick={() => handleReactionSelect(reaction.type)}
                          sx={{
                            width: 40,
                            height: 40,
                            bgcolor: reaction.color,
                            color: 'white',
                            '&:hover': {
                              bgcolor: reaction.color,
                              transform: 'scale(1.2)',
                            },
                            transition: 'transform 0.2s ease-in-out',
                          }}
                        >
                          <reaction.icon sx={{ fontSize: 20 }} />
                        </IconButton>
                      </Tooltip>
                    ))}
                  </Box>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>

          {/* Comment Button */}
          <Button 
            startIcon={<Comment />}
            onClick={() => onComment(post._id)}
            sx={{ 
              textTransform: 'none', 
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
              borderRadius: 2,
              px: 2,
              py: 1,
            }}
          >
            Comment
          </Button>

          {/* Share Button */}
          <Button 
            startIcon={<Share />}
            onClick={(e) => setShareMenuAnchor(e.currentTarget)}
            sx={{ 
              textTransform: 'none', 
              color: 'text.secondary',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
              borderRadius: 2,
              px: 2,
              py: 1,
            }}
          >
            Share
          </Button>

          {/* Save Button */}
          <IconButton
            onClick={() => {
              setIsSaved(!isSaved);
              onSave(post._id);
            }}
            sx={{ 
              color: isSaved ? 'primary.main' : 'text.secondary',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
            }}
          >
            {isSaved ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
        </Box>
      </Box>

      {/* Share Menu */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={() => setShareMenuAnchor(null)}
        PaperProps={{
          sx: { 
            minWidth: 250,
            borderRadius: 2,
            mt: 1,
          }
        }}
      >
        {shareOptions.map((option, index) => (
          <MenuItem 
            key={option.label} 
            onClick={option.action}
            sx={{ py: 1.5 }}
          >
            <ListItemIcon>
              <option.icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>

      {/* Likes Dialog */}
      <Dialog 
        open={showLikesDialog} 
        onClose={() => setShowLikesDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="600">
            People who reacted
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 0, py: 1 }}>
          <List>
            {likedByUsers.map((user, index) => (
              <ListItem key={user._id} disablePadding>
                <ListItemButton sx={{ px: 3, py: 1 }}>
                  <ListItemAvatar>
                    <Avatar src={user.profilePicture}>
                      {user.firstName.charAt(0)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={`${user.firstName} ${user.lastName}`}
                    secondary="Software Engineer"
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ThumbUp sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Button size="small" variant="outlined">
                      Connect
                    </Button>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PostEngagement;
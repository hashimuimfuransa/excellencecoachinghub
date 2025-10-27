import React, { useState, useEffect } from 'react';
import {
  Fab,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Chat } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';

const FloatingChatButton: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // Safe useAuth hook with error handling
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (error) {
    console.warn('FloatingChatButton: useAuth not available, component will not render');
    return null;
  }
  
  const [unreadCount, setUnreadCount] = useState(0);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    if (user) {
      loadUnreadCount();
      
      // Listen for new messages to update badge
      chatService.on('new-message', handleNewMessage);
      
      return () => {
        chatService.off('new-message', handleNewMessage);
      };
    }
  }, [user]);

  const loadUnreadCount = async () => {
    try {
      const chats = await chatService.getChats();
      const totalUnread = chats.reduce((total, chat) => total + chat.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const handleNewMessage = () => {
    loadUnreadCount();
  };

  const handleChatClick = () => {
    navigate('/app/messages');
  };

  if (!user) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      style={{
        position: 'fixed',
        bottom: isMobile ? 100 : 90, // Position above mobile footer navbar (adjusted for new footer height)
        right: 24,
        zIndex: 1200, // Ensure it's above the mobile footer
      }}
    >
      <Tooltip title="Open Messages" placement="left">
        <Badge
          badgeContent={unreadCount > 0 ? unreadCount : null}
          color="error"
          overlap="circular"
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
        >
          <Fab
            component={motion.button}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleChatClick}
            sx={{
              background: 'linear-gradient(45deg, #2196F3, #21CBF3)',
              boxShadow: '0 8px 25px rgba(33, 150, 243, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2, #1CB5E0)',
                boxShadow: '0 12px 35px rgba(33, 150, 243, 0.6)',
              },
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 5,
                ease: "easeInOut",
              }}
            >
              <Chat />
            </motion.div>
          </Fab>
        </Badge>
      </Tooltip>
    </motion.div>
  );
};

export default FloatingChatButton;
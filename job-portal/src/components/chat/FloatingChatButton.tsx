import React, { useState, useEffect } from 'react';
import {
  Fab,
  Badge,
  Tooltip,
  useTheme,
} from '@mui/material';
import { Chat, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import ChatSidebar from './ChatSidebar';
import ChatWindow from './ChatWindow';
import { chatService, ChatRoom } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';

const FloatingChatButton: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatRoom | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const handleChatToggle = () => {
    if (chatOpen) {
      setChatOpen(false);
      setSelectedChat(null);
    } else {
      setChatOpen(true);
    }
  };

  const handleChatSelect = (chat: ChatRoom) => {
    setSelectedChat(chat);
    setUnreadCount(prev => Math.max(0, prev - chat.unreadCount));
  };

  const handleCloseSidebar = () => {
    setChatOpen(false);
    setSelectedChat(null);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        style={{
          position: 'fixed',
          bottom: chatOpen ? 24 : 90, // Adjust position when chat is open
          right: 24,
          zIndex: 1200,
        }}
      >
        <Tooltip title={chatOpen ? "Close Chat" : "Open Messages"} placement="left">
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
              onClick={handleChatToggle}
              sx={{
                background: chatOpen 
                  ? 'linear-gradient(45deg, #f44336, #ff5722)'
                  : 'linear-gradient(45deg, #2196F3, #21CBF3)',
                boxShadow: chatOpen
                  ? '0 8px 25px rgba(244, 67, 54, 0.4)'
                  : '0 8px 25px rgba(33, 150, 243, 0.4)',
                '&:hover': {
                  background: chatOpen
                    ? 'linear-gradient(45deg, #d32f2f, #f57c00)'
                    : 'linear-gradient(45deg, #1976D2, #1CB5E0)',
                  boxShadow: chatOpen
                    ? '0 12px 35px rgba(244, 67, 54, 0.6)'
                    : '0 12px 35px rgba(33, 150, 243, 0.6)',
                },
              }}
            >
              <motion.div
                animate={chatOpen ? {} : {
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 5,
                  ease: "easeInOut",
                }}
              >
                {chatOpen ? <Close /> : <Chat />}
              </motion.div>
            </Fab>
          </Badge>
        </Tooltip>
      </motion.div>

      {/* Chat Interface */}
      {chatOpen && (
        <>
          {/* Chat Sidebar */}
          <ChatSidebar
            open={chatOpen && !selectedChat}
            onClose={handleCloseSidebar}
            onChatSelect={handleChatSelect}
            selectedChatId={selectedChat?._id}
          />

          {/* Chat Window */}
          {selectedChat && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '400px',
                height: '100vh',
                zIndex: 1250,
                boxShadow: theme.shadows[8],
              }}
            >
              <ChatWindow
                chat={selectedChat}
                onClose={() => setSelectedChat(null)}
              />
            </motion.div>
          )}

          {/* Backdrop for mobile */}
          {(chatOpen || selectedChat) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseSidebar}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1100,
                display: theme.breakpoints.down('md') ? 'block' : 'none',
              }}
            />
          )}
        </>
      )}
    </>
  );
};

export default FloatingChatButton;
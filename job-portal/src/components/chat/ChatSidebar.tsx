import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  TextField,
  InputAdornment,
  Badge,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Fade,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Chat,
  Search,
  Add,
  Close,
  PersonAdd,
  Circle,
  Work,
  Person,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService, ChatRoom, ChatUser } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';

interface ChatSidebarProps {
  open: boolean;
  onClose: () => void;
  onChatSelect: (chat: ChatRoom) => void;
  selectedChatId?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  open,
  onClose,
  onChatSelect,
  selectedChatId,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();

  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (open && user) {
      loadChats();
      initializeChatService();
    }
  }, [open, user]);

  useEffect(() => {
    // Listen for real-time updates
    chatService.on('new-message', handleNewMessage);
    chatService.on('user-online', handleUserOnline);
    chatService.on('user-offline', handleUserOffline);

    return () => {
      chatService.off('new-message', handleNewMessage);
      chatService.off('user-online', handleUserOnline);
      chatService.off('user-offline', handleUserOffline);
    };
  }, []);

  const initializeChatService = () => {
    if (user?._id) {
      chatService.initializeSocket(user._id);
    }
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const chatData = await chatService.getChats();
      setChats(chatData);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message: any) => {
    setChats(prevChats => 
      prevChats.map(chat => 
        chat._id === message.chatId 
          ? { ...chat, lastMessage: message, unreadCount: chat.unreadCount + 1 }
          : chat
      )
    );
  };

  const handleUserOnline = (userId: string) => {
    setOnlineUsers(prev => [...prev.filter(id => id !== userId), userId]);
  };

  const handleUserOffline = (userId: string) => {
    setOnlineUsers(prev => prev.filter(id => id !== userId));
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const users = await chatService.searchUsers(query);
      setSearchResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleStartChat = async (participant: ChatUser) => {
    try {
      const chat = await chatService.createOrGetChat([participant._id]);
      setChats(prevChats => {
        const existingIndex = prevChats.findIndex(c => c._id === chat._id);
        if (existingIndex >= 0) {
          return prevChats;
        }
        return [chat, ...prevChats];
      });
      onChatSelect(chat);
      setNewChatOpen(false);
      setSearchResults([]);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.participants.some(p => 
      p._id !== user?._id && 
      (`${p.firstName || ''} ${p.lastName || ''}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
       p.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const getOtherParticipant = (chat: ChatRoom): ChatUser => {
    return chat.participants.find(p => p._id !== user?._id) || chat.participants[0];
  };

  const isUserOnline = (userId: string): boolean => {
    return onlineUsers.includes(userId);
  };

  const formatLastMessage = (message: any): string => {
    if (!message) return 'No messages yet';
    if (message.messageType === 'file') return '📎 File';
    if (message.messageType === 'image') return '🖼️ Image';
    return message.content;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Drawer
        anchor="left"
        open={open}
        onClose={onClose}
        variant={isMobile ? "temporary" : "persistent"}
        PaperProps={{
          sx: {
            width: 350,
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)',
          }
        }}
      >
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chat color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Messages
                </Typography>
              </Box>
              <Box>
                <Tooltip title="Start New Chat">
                  <IconButton size="small" onClick={() => setNewChatOpen(true)}>
                    <Add />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton size="small" onClick={onClose}>
                    <Close />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Search */}
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ borderRadius: 2 }}
            />
          </Box>

          {/* Chat List */}
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            {loading ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Loading conversations...
                </Typography>
              </Box>
            ) : filteredChats.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Chat sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  onClick={() => setNewChatOpen(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Start Chatting
                </Button>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                <AnimatePresence>
                  {filteredChats.map((chat, index) => {
                    const otherParticipant = getOtherParticipant(chat);
                    const isSelected = selectedChatId === chat._id;
                    const isOnline = isUserOnline(otherParticipant._id);

                    return (
                      <motion.div
                        key={chat._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <ListItem
                          button
                          onClick={() => onChatSelect(chat)}
                          sx={{
                            backgroundColor: isSelected 
                              ? `${theme.palette.primary.main}20`
                              : 'transparent',
                            borderLeft: isSelected 
                              ? `3px solid ${theme.palette.primary.main}`
                              : '3px solid transparent',
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark' 
                                ? 'rgba(255,255,255,0.05)' 
                                : 'rgba(0,0,0,0.05)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <ListItemAvatar>
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              variant="dot"
                              color="success"
                              invisible={!isOnline}
                            >
                              <Avatar 
                                src={otherParticipant.profilePicture}
                                sx={{ 
                                  width: 40, 
                                  height: 40,
                                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                                }}
                              >
                                {otherParticipant.firstName?.charAt(0)?.toUpperCase() || otherParticipant.lastName?.charAt(0)?.toUpperCase() || '?'}
                              </Avatar>
                            </Badge>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: chat.unreadCount > 0 ? 600 : 400,
                                    color: isSelected ? 'primary.main' : 'text.primary',
                                  }}
                                >
                                  {`${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() || otherParticipant.email}
                                </Typography>
                                {otherParticipant.role === 'employer' && (
                                  <Work sx={{ fontSize: 12, color: 'primary.main' }} />
                                )}
                                {chat.unreadCount > 0 && (
                                  <Badge
                                    badgeContent={chat.unreadCount}
                                    color="primary"
                                    sx={{ ml: 'auto' }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: 'text.secondary',
                                    display: 'block',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: 200,
                                  }}
                                >
                                  {formatLastMessage(chat.lastMessage)}
                                </Typography>
                                {chat.lastMessage && (
                                  <Typography variant="caption" color="text.secondary">
                                    {formatTimestamp(chat.lastMessage.timestamp)}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </List>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* New Chat Dialog */}
      <Dialog
        open={newChatOpen}
        onClose={() => setNewChatOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PersonAdd color="primary" />
            <Typography variant="h6">Start New Conversation</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Search users by name or email..."
            onChange={(e) => searchUsers(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          {searchLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Searching...
            </Typography>
          ) : searchResults.length > 0 ? (
            <List>
              {searchResults.map((user) => (
                <ListItem
                  key={user._id}
                  button
                  onClick={() => handleStartChat(user)}
                  sx={{ borderRadius: 2, mb: 1 }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.profilePicture}>
                      {user.firstName?.charAt(0)?.toUpperCase() || user.lastName?.charAt(0)?.toUpperCase() || '?'}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}
                        {user.role === 'employer' && (
                          <Chip
                            label="Employer"
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    }
                    secondary={user.company || user.email}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              Start typing to search for users to chat with
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewChatOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ChatSidebar;
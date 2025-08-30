import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Divider,
  Badge,
  useTheme,
  CircularProgress,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Send,
  Search,
  MoreVert,
  Phone,
  VideoCall,
  AttachFile,
  Add,
  Refresh,
  FilterList,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { ChatRoom, ChatMessage } from '../types/chat';
import { chatService } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';

const MessagesPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showChatList, setShowChatList] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatRooms();
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom._id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const rooms = await chatService.getChats();
      setChatRooms(rooms);
      // Auto-select the first room if available
      if (rooms.length > 0 && !selectedRoom) {
        setSelectedRoom(rooms[0]);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      setMessagesLoading(true);
      const result = await chatService.getChatMessages(roomId);
      setMessages(result.messages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    try {
      const message = await chatService.sendMessage(selectedRoom._id, { content: newMessage.trim() });
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Update the selected room's last message
      setChatRooms(prev => 
        prev.map(room => 
          room._id === selectedRoom._id 
            ? { ...room, lastMessage: message, updatedAt: message.createdAt }
            : room
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredRooms = chatRooms.filter(room => {
    const otherParticipant = room.participants.find(p => p._id !== user?._id);
    const matchesSearch = otherParticipant && 
      `${otherParticipant.firstName} ${otherParticipant.lastName}`
        .toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterType === 'unread') {
      return matchesSearch && room.unreadCount > 0;
    }
    
    return matchesSearch;
  });

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find(p => p._id !== user?._id);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleFilterChange = (filter: 'all' | 'unread') => {
    setFilterType(filter);
    handleMenuClose();
  };

  const handleRefresh = () => {
    loadChatRooms();
    if (selectedRoom) {
      loadMessages(selectedRoom._id);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3, height: 'calc(100vh - 120px)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ height: '100%' }}
      >
        {/* Header with Actions */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3 
        }}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Messages
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={handleMenuOpen}
            >
              Filter: {filterType === 'all' ? 'All' : 'Unread'}
            </Button>
            
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowChatList(true)}
            >
              New Chat
            </Button>
          </Box>
        </Box>

        {/* Main Messages Area */}
        <Paper sx={{ height: 'calc(100% - 80px)', display: 'flex', flexDirection: 'column' }}>
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <Box sx={{ 
                p: 2, 
                borderBottom: 1, 
                borderColor: 'divider',
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(45deg, #1a1a2e, #16213e)'
                  : 'linear-gradient(45deg, #f8f9fa, #ffffff)'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Badge
                      color="success"
                      variant="dot"
                      invisible={!getOtherParticipant(selectedRoom)?.isOnline}
                    >
                      <Avatar 
                        src={getOtherParticipant(selectedRoom)?.profilePicture}
                        sx={{ width: 50, height: 50 }}
                      >
                        {getOtherParticipant(selectedRoom)?.firstName[0]}{getOtherParticipant(selectedRoom)?.lastName[0]}
                      </Avatar>
                    </Badge>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {getOtherParticipant(selectedRoom)?.firstName} {getOtherParticipant(selectedRoom)?.lastName}
                      </Typography>
                      {getOtherParticipant(selectedRoom)?.isOnline ? (
                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 500 }}>
                          Active now
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          {getOtherParticipant(selectedRoom)?.lastSeen && 
                            `Last seen ${formatDistanceToNow(new Date(getOtherParticipant(selectedRoom)!.lastSeen!), { addSuffix: true })}`
                          }
                        </Typography>
                      )}
                      {getOtherParticipant(selectedRoom)?.company && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {getOtherParticipant(selectedRoom)?.company}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton color="primary" title="Voice Call">
                      <Phone />
                    </IconButton>
                    <IconButton color="primary" title="Video Call">
                      <VideoCall />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      title="Switch Conversation"
                      onClick={() => setShowChatList(true)}
                    >
                      <Search />
                    </IconButton>
                    <IconButton>
                      <MoreVert />
                    </IconButton>
                  </Box>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messagesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <>
                    {messages.length === 0 ? (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        textAlign: 'center'
                      }}>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                          No messages yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Start a conversation with {getOtherParticipant(selectedRoom)?.firstName}
                        </Typography>
                      </Box>
                    ) : (
                      messages.map((message) => (
                        <Box
                          key={message._id}
                          sx={{
                            display: 'flex',
                            justifyContent: message.sender._id === user?._id ? 'flex-end' : 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Paper
                            elevation={2}
                            sx={{
                              p: 2,
                              maxWidth: '75%',
                              backgroundColor: message.sender._id === user?._id 
                                ? theme.palette.primary.main 
                                : theme.palette.mode === 'dark' 
                                  ? theme.palette.grey[800]
                                  : theme.palette.grey[100],
                              color: message.sender._id === user?._id 
                                ? 'white' 
                                : 'inherit',
                              borderRadius: message.sender._id === user?._id 
                                ? '20px 20px 5px 20px'
                                : '20px 20px 20px 5px',
                            }}
                          >
                            <Typography variant="body1" sx={{ mb: 0.5 }}>
                              {message.content}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                opacity: 0.7,
                                display: 'block',
                              }}
                            >
                              {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                            </Typography>
                          </Paper>
                        </Box>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              {/* Message Input */}
              <Box sx={{ 
                p: 2, 
                borderTop: 1, 
                borderColor: 'divider',
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(0,0,0,0.02)'
              }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                  <IconButton 
                    size="small" 
                    color="primary"
                    sx={{ 
                      backgroundColor: theme.palette.action.hover,
                      '&:hover': {
                        backgroundColor: theme.palette.action.selected,
                      }
                    }}
                  >
                    <AttachFile />
                  </IconButton>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    variant="outlined"
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '25px',
                        backgroundColor: theme.palette.background.paper,
                      }
                    }}
                  />
                  <IconButton 
                    color="primary" 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    sx={{ 
                      backgroundColor: newMessage.trim() ? theme.palette.primary.main : theme.palette.action.disabledBackground,
                      color: newMessage.trim() ? 'white' : theme.palette.action.disabled,
                      '&:hover': {
                        backgroundColor: newMessage.trim() ? theme.palette.primary.dark : theme.palette.action.disabledBackground,
                      }
                    }}
                  >
                    <Send />
                  </IconButton>
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              textAlign: 'center'
            }}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                Welcome to Messages
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Select a conversation or start a new one to begin messaging
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<Add />}
                onClick={() => setShowChatList(true)}
              >
                Start New Conversation
              </Button>
            </Box>
          )}
        </Paper>

        {/* Chat List Dialog */}
        <Dialog
          open={showChatList}
          onClose={() => setShowChatList(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              maxHeight: '80vh',
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Select Conversation</Typography>
              <IconButton onClick={() => setShowChatList(false)}>
                <MoreVert />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent>
            <TextField
              fullWidth
              size="small"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />
            
            <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
              {filteredRooms.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No conversations found
                  </Typography>
                </Box>
              ) : (
                filteredRooms.map((room) => {
                  const otherParticipant = getOtherParticipant(room);
                  if (!otherParticipant) return null;

                  return (
                    <ListItem
                      key={room._id}
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowChatList(false);
                      }}
                      sx={{
                        borderRadius: '12px',
                        mb: 1,
                        cursor: 'pointer',
                        backgroundColor: selectedRoom?._id === room._id ? theme.palette.primary.main + '20' : 'transparent',
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          color="success"
                          variant="dot"
                          invisible={!otherParticipant.isOnline}
                        >
                          <Avatar src={otherParticipant.profilePicture}>
                            {otherParticipant.firstName[0]}{otherParticipant.lastName[0]}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {room.lastMessage?.content || 'No messages yet'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {room.lastMessage && formatDistanceToNow(new Date(room.lastMessage.createdAt), { addSuffix: true })}
                            </Typography>
                          </Box>
                        }
                      />
                      {room.unreadCount > 0 && (
                        <Chip
                          label={room.unreadCount}
                          size="small"
                          color="primary"
                          sx={{ minWidth: 20, height: 20 }}
                        />
                      )}
                    </ListItem>
                  );
                })
              )}
            </List>
          </DialogContent>
        </Dialog>

        {/* Filter Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleFilterChange('all')}>
            All Conversations
          </MenuItem>
          <MenuItem onClick={() => handleFilterChange('unread')}>
            Unread Only
          </MenuItem>
        </Menu>

        {/* Floating Action Button for Mobile */}
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 100,
            right: 24,
            display: { xs: 'flex', md: 'none' }
          }}
          onClick={() => setShowChatList(true)}
        >
          <Add />
        </Fab>
      </motion.div>
    </Container>
  );
};

export default MessagesPage;
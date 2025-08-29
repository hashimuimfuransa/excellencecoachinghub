import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
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
} from '@mui/material';
import {
  Send,
  Search,
  MoreVert,
  Phone,
  VideoCall,
  AttachFile,
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
      const rooms = await chatService.getChatRooms();
      setChatRooms(rooms);
    } catch (error) {
      console.error('Error loading chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      setMessagesLoading(true);
      const roomMessages = await chatService.getMessages(roomId);
      setMessages(roomMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    try {
      const message = await chatService.sendMessage(selectedRoom._id, newMessage.trim());
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
    return otherParticipant && 
      `${otherParticipant.firstName} ${otherParticipant.lastName}`
        .toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getOtherParticipant = (room: ChatRoom) => {
    return room.participants.find(p => p._id !== user?._id);
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
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
          Messages
        </Typography>

        <Grid container spacing={2} sx={{ height: '100%' }}>
          {/* Chat Rooms List */}
          <Grid item xs={12} md={4} sx={{ height: '100%' }}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
                  }}
                />
              </Box>

              <List sx={{ flexGrow: 1, overflow: 'auto', p: 0 }}>
                {filteredRooms.length === 0 ? (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      No conversations yet
                    </Typography>
                  </Box>
                ) : (
                  filteredRooms.map((room) => {
                    const otherParticipant = getOtherParticipant(room);
                    if (!otherParticipant) return null;

                    return (
                      <ListItem
                        key={room._id}
                        button
                        onClick={() => setSelectedRoom(room)}
                        selected={selectedRoom?._id === room._id}
                        sx={{
                          borderBottom: 1,
                          borderColor: 'divider',
                          '&:hover': {
                            backgroundColor: theme.palette.action.hover,
                          },
                          '&.Mui-selected': {
                            backgroundColor: theme.palette.primary.main + '20',
                          }
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
            </Paper>
          </Grid>

          {/* Chat Messages */}
          <Grid item xs={12} md={8} sx={{ height: '100%' }}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {selectedRoom ? (
                <>
                  {/* Chat Header */}
                  <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={getOtherParticipant(selectedRoom)?.profilePicture}>
                          {getOtherParticipant(selectedRoom)?.firstName[0]}{getOtherParticipant(selectedRoom)?.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {getOtherParticipant(selectedRoom)?.firstName} {getOtherParticipant(selectedRoom)?.lastName}
                          </Typography>
                          {getOtherParticipant(selectedRoom)?.isOnline && (
                            <Typography variant="caption" color="success.main">
                              Active now
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton>
                          <Phone />
                        </IconButton>
                        <IconButton>
                          <VideoCall />
                        </IconButton>
                        <IconButton>
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>

                  {/* Messages */}
                  <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
                    {messagesLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <Box
                            key={message._id}
                            sx={{
                              display: 'flex',
                              justifyContent: message.sender._id === user?._id ? 'flex-end' : 'flex-start',
                              mb: 1,
                            }}
                          >
                            <Paper
                              sx={{
                                p: 1.5,
                                maxWidth: '70%',
                                backgroundColor: message.sender._id === user?._id 
                                  ? theme.palette.primary.main 
                                  : theme.palette.grey[100],
                                color: message.sender._id === user?._id 
                                  ? 'white' 
                                  : 'inherit',
                              }}
                            >
                              <Typography variant="body1">
                                {message.content}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  opacity: 0.7,
                                  display: 'block',
                                  mt: 0.5 
                                }}
                              >
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </Typography>
                            </Paper>
                          </Box>
                        ))}
                        <div ref={messagesEndRef} />
                      </>
                    )}
                  </Box>

                  {/* Message Input */}
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <IconButton size="small">
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
                      />
                      <IconButton 
                        color="primary" 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send />
                      </IconButton>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  height: '100%' 
                }}>
                  <Typography color="text.secondary" variant="h6">
                    Select a conversation to start messaging
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default MessagesPage;
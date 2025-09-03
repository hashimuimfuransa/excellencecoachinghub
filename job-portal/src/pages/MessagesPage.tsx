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
  useMediaQuery,
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
  alpha,
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
import { useLocation } from 'react-router-dom';
import { ChatRoom, ChatMessage } from '../types/chat';
import { chatService } from '../services/chatService';
import { realTimeNotificationService } from '../services/realTimeNotificationService';
import { useAuth } from '../contexts/AuthContext';

const MessagesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const location = useLocation();
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
    
    // Initialize real-time messaging
    if (user?._id) {
      chatService.initializeSocket(user._id);
      
      // Listen for real-time messages
      chatService.on('new-message', handleNewMessage);
      chatService.on('chat-unread-updated', handleUnreadUpdate);
      chatService.on('user-online', handleUserOnline);
      chatService.on('user-offline', handleUserOffline);
      
      return () => {
        chatService.off('new-message', handleNewMessage);
        chatService.off('chat-unread-updated', handleUnreadUpdate);
        chatService.off('user-online', handleUserOnline);
        chatService.off('user-offline', handleUserOffline);
      };
    }
  }, [user]);

  // Handle navigation state to start chat with specific user
  useEffect(() => {
    const state = location.state as { startChatWithUser?: string };
    if (state?.startChatWithUser && chatRooms.length > 0) {
      const targetUserId = state.startChatWithUser;
      
      // Find existing chat room with this user
      const existingRoom = chatRooms.find(room => 
        room.participants.some(p => p._id === targetUserId)
      );
      
      if (existingRoom) {
        setSelectedRoom(existingRoom);
        if (existingRoom._id) {
          loadMessages(existingRoom._id);
        }
      } else {
        // Create new chat room with this user
        createChatWithUser(targetUserId);
      }
    }
  }, [location.state, chatRooms]);

  const handleNewMessage = (data: { chatId: string; message: ChatMessage }) => {
    const { chatId, message } = data;
    
    // Update messages if this is the selected room
    if (selectedRoom && selectedRoom._id === chatId) {
      setMessages(prev => [...prev, message]);
    }
    
    // Update chat room's last message
    setChatRooms(prev => 
      prev.map(room => 
        room._id === chatId 
          ? { 
              ...room, 
              lastMessage: message, 
              updatedAt: message.createdAt,
              unreadCount: room._id === selectedRoom?._id ? 0 : room.unreadCount + 1
            }
          : room
      )
    );
  };

  const handleUnreadUpdate = (data: { chatId: string; unreadCount: number }) => {
    setChatRooms(prev => 
      prev.map(room => 
        room._id === data.chatId 
          ? { ...room, unreadCount: room.unreadCount + data.unreadCount }
          : room
      )
    );
  };

  const handleUserOnline = (userId: string) => {
    // Update user online status in chat rooms
    setChatRooms(prev => 
      prev.map(room => ({
        ...room,
        participants: room.participants.map(participant => 
          participant._id === userId 
            ? { ...participant, isOnline: true }
            : participant
        )
      }))
    );
  };

  const handleUserOffline = (userId: string) => {
    // Update user offline status in chat rooms
    setChatRooms(prev => 
      prev.map(room => ({
        ...room,
        participants: room.participants.map(participant => 
          participant._id === userId 
            ? { ...participant, isOnline: false }
            : participant
        )
      }))
    );
  };

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom._id);
    }
  }, [selectedRoom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle URL parameter changes
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const conversationId = urlParams.get('conversation');
    
    if (conversationId && chatRooms.length > 0) {
      console.log('URL changed, looking for conversation:', conversationId);
      const targetRoom = chatRooms.find(room => room._id === conversationId);
      
      if (targetRoom) {
        console.log('Found and selecting room from URL:', targetRoom);
        setSelectedRoom(targetRoom);
        // Clear URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [location.search, chatRooms]);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const rooms = await chatService.getChats();
      setChatRooms(rooms);
      
      // Check for conversation ID in URL parameters first
      const urlParams = new URLSearchParams(location.search);
      const conversationId = urlParams.get('conversation');
      
      if (conversationId) {
        console.log('Found conversation ID in URL:', conversationId);
        const targetRoom = rooms.find(room => room._id === conversationId);
        
        if (targetRoom) {
          console.log('Found target room:', targetRoom);
          setSelectedRoom(targetRoom);
          // Clear URL parameter by replacing the current history entry
          window.history.replaceState({}, document.title, window.location.pathname);
          return; // Exit early since we found and selected the room
        } else {
          console.log('Conversation not found in existing rooms, it may be new');
        }
      }
      
      // Check if there's a pre-selected chat from navigation
      const selectedChatDataStr = sessionStorage.getItem('selectedChatData');
      if (selectedChatDataStr) {
        try {
          const selectedChatData = JSON.parse(selectedChatDataStr);
          const { chatId, targetUserId, targetUserName, timestamp, requestId } = selectedChatData;
          
          // Check if the data is not too old (within last 5 minutes)
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            let targetRoom: any = null;
            
            // First, try to find the chat by chat ID
            targetRoom = rooms.find(room => room._id === chatId);
            
            // If not found by chat ID, try to find a chat that includes the target user
            if (!targetRoom && targetUserId) {
              targetRoom = rooms.find(room => 
                room.participants.some((participant: any) => participant._id === targetUserId)
              );
            }
            
            // If still not found, try to create/get a chat with the target user
            if (!targetRoom && targetUserId) {
              try {
                const newChat = await chatService.createOrGetChat([targetUserId]);
                
                // Reload chat rooms to include the new chat
                const updatedRooms = await chatService.getChats();
                setChatRooms(updatedRooms);
                
                // Find the newly created/retrieved chat
                targetRoom = updatedRooms.find(room => room._id === newChat._id);
              } catch (chatError) {
                console.error('Error creating/getting chat:', chatError);
              }
            }
            
            // Select the target room if found
            if (targetRoom) {
              setSelectedRoom(targetRoom);
            } else {
              // Fallback to first room
              if (rooms.length > 0 && !selectedRoom) {
                setSelectedRoom(rooms[0]);
              }
            }
            
            // Clear the stored chat data after using it
            sessionStorage.removeItem('selectedChatData');
          } else {
            // Data is too old, ignore it
            sessionStorage.removeItem('selectedChatData');
            if (rooms.length > 0 && !selectedRoom) {
              setSelectedRoom(rooms[0]);
            }
          }
        } catch (parseError) {
          console.error('Error parsing selectedChatData:', parseError);
          sessionStorage.removeItem('selectedChatData');
          if (rooms.length > 0 && !selectedRoom) {
            setSelectedRoom(rooms[0]);
          }
        }
      } else {
        // Auto-select the first room if available and no room is currently selected
        if (rooms.length > 0 && !selectedRoom) {
          setSelectedRoom(rooms[0]);
        }
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

  const createChatWithUser = async (targetUserId: string) => {
    try {
      setLoading(true);
      
      // Create or get existing chat with the target user
      const newChat = await chatService.createOrGetChat([targetUserId]);
      
      // Reload chat rooms to include the new/existing chat
      const updatedRooms = await chatService.getChats();
      setChatRooms(updatedRooms);
      
      // Find and select the chat room
      const targetRoom = updatedRooms.find(room => room._id === newChat._id);
      if (targetRoom) {
        setSelectedRoom(targetRoom);
        if (targetRoom._id) {
          loadMessages(targetRoom._id);
        }
      }
    } catch (error) {
      console.error('Error creating chat with user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom || !user) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      const message = await chatService.sendMessage(selectedRoom._id, { content: messageContent });
      
      // The message will be added to the UI via the real-time handler
      // but add it immediately for the sender to see
      setMessages(prev => {
        // Check if message already exists (from real-time update)
        const exists = prev.some(m => m._id === message._id);
        return exists ? prev : [...prev, message];
      });
      
      // Update the selected room's last message
      setChatRooms(prev => 
        prev.map(room => 
          room._id === selectedRoom._id 
            ? { ...room, lastMessage: message, updatedAt: message.createdAt, unreadCount: 0 }
            : room
        )
      );

      // Mark messages as read for this chat
      await chatService.markMessagesAsRead(selectedRoom._id);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message in the input field if sending failed
      setNewMessage(messageContent);
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
      <Container 
        maxWidth="lg" 
        sx={{ 
          py: { xs: 2, sm: 3 },
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        py: { xs: 1, sm: 2, md: 3 }, 
        px: { xs: 1, sm: 2, md: 3 },
        height: { xs: 'calc(100vh - 80px)', sm: 'calc(100vh - 120px)' }
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ height: '100%' }}
      >
        {/* Header with Actions */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: { xs: 2, sm: 3 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            Messages
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            alignItems: 'center',
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            width: { xs: '100%', sm: 'auto' }
          }}>
            <IconButton
              color="primary"
              onClick={handleRefresh}
              size={isMobile ? "small" : "medium"}
              title="Refresh"
              sx={{ 
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: 1,
                display: { xs: 'inline-flex', sm: 'none' }
              }}
            >
              <Refresh />
            </IconButton>
            
            <Button
              variant="outlined"
              startIcon={!isMobile ? <Refresh /> : undefined}
              onClick={handleRefresh}
              size="small"
              sx={{ 
                display: { xs: 'none', sm: 'inline-flex' },
                minWidth: 'auto'
              }}
            >
              {!isMobile && 'Refresh'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={!isMobile ? <FilterList /> : undefined}
              onClick={handleMenuOpen}
              size="small"
              sx={{ 
                minWidth: { xs: 'auto', sm: '120px' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {isMobile ? 'Filter' : `Filter: ${filterType === 'all' ? 'All' : 'Unread'}`}
            </Button>
            
            <Button
              variant="contained"
              startIcon={!isMobile ? <Add /> : undefined}
              onClick={() => setShowChatList(true)}
              size="small"
              sx={{ 
                minWidth: { xs: 'auto', sm: '110px' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {isMobile ? <Add /> : 'New Chat'}
            </Button>
          </Box>
        </Box>

        {/* Main Messages Area */}
        <Paper sx={{ 
          height: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 180px)', md: 'calc(100% - 80px)' }, 
          display: 'flex', 
          flexDirection: 'column',
          borderRadius: { xs: 1, sm: 2, md: 3 },
          overflow: 'hidden'
        }}>
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <Box sx={{ 
                p: { xs: 1, sm: 1.5, md: 2 }, 
                borderBottom: 1, 
                borderColor: 'divider',
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(45deg, #1a1a2e, #16213e)'
                  : 'linear-gradient(45deg, #f8f9fa, #ffffff)',
                flexShrink: 0
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: { xs: 1, sm: 2 }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 1, sm: 1.5 },
                    flex: 1,
                    minWidth: 0 // Allow text truncation
                  }}>
                    <Badge
                      color="success"
                      variant="dot"
                      invisible={!getOtherParticipant(selectedRoom)?.isOnline}
                    >
                      <Avatar 
                        src={getOtherParticipant(selectedRoom)?.profilePicture}
                        sx={{ 
                          width: { xs: 36, sm: 44, md: 50 }, 
                          height: { xs: 36, sm: 44, md: 50 },
                          flexShrink: 0
                        }}
                      >
                        {getOtherParticipant(selectedRoom)?.firstName?.[0]}{getOtherParticipant(selectedRoom)?.lastName?.[0]}
                      </Avatar>
                    </Badge>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {getOtherParticipant(selectedRoom)?.firstName} {getOtherParticipant(selectedRoom)?.lastName}
                      </Typography>
                      {getOtherParticipant(selectedRoom)?.isOnline ? (
                        <Typography 
                          variant="caption" 
                          color="success.main" 
                          sx={{ 
                            fontWeight: 500,
                            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                            display: 'block',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          Active now
                        </Typography>
                      ) : (
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ 
                            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' },
                            display: 'block',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {getOtherParticipant(selectedRoom)?.lastSeen && 
                            `Last seen ${formatDistanceToNow(new Date(getOtherParticipant(selectedRoom)!.lastSeen!), { addSuffix: true })}`
                          }
                        </Typography>
                      )}
                      {getOtherParticipant(selectedRoom)?.company && (
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            display: { xs: 'none', sm: 'block' },
                            fontSize: '0.7rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {getOtherParticipant(selectedRoom)?.company}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 0.25, sm: 0.5, md: 1 },
                    flexShrink: 0
                  }}>
                    <IconButton 
                      color="primary" 
                      title="Voice Call"
                      size="small"
                      sx={{ 
                        display: { xs: 'none', md: 'inline-flex' },
                        p: { sm: 0.5, md: 1 }
                      }}
                    >
                      <Phone fontSize="small" />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      title="Video Call"
                      size="small"
                      sx={{ 
                        display: { xs: 'none', md: 'inline-flex' },
                        p: { sm: 0.5, md: 1 }
                      }}
                    >
                      <VideoCall fontSize="small" />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      title="Switch Conversation"
                      onClick={() => setShowChatList(true)}
                      size="small"
                      sx={{ p: { xs: 0.5, sm: 0.75, md: 1 } }}
                    >
                      <Search fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small"
                      sx={{ p: { xs: 0.5, sm: 0.75, md: 1 } }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>

              {/* Messages */}
              <Box sx={{ 
                flexGrow: 1, 
                overflow: 'auto', 
                p: { xs: 1, sm: 1.5, md: 2 },
                minHeight: 0, // Important for proper scrolling
                display: 'flex',
                flexDirection: 'column'
              }}>
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
                      messages.map((message) => {
                        const isSentByUser = message.sender._id === user?._id;
                        return (
                          <Box
                            key={message._id}
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-end',
                              mb: { xs: 1.5, sm: 2 },
                              px: { xs: 1, sm: 2 },
                              width: '100%',
                              flexDirection: isSentByUser ? 'row-reverse' : 'row',
                              gap: 1,
                            }}
                          >
                            {/* Avatar for received messages - always show for received */}
                            {!isSentByUser && (
                              <Avatar 
                                src={getOtherParticipant(selectedRoom)?.profilePicture}
                                sx={{ 
                                  width: { xs: 28, sm: 32, md: 36 }, 
                                  height: { xs: 28, sm: 32, md: 36 }, 
                                  flexShrink: 0,
                                }}
                              >
                                {getOtherParticipant(selectedRoom)?.firstName?.[0] || 'U'}
                              </Avatar>
                            )}
                            
                            {/* Message content */}
                            <Box
                              sx={{
                                maxWidth: { xs: '70%', sm: '65%', md: '60%' },
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: isSentByUser ? 'flex-end' : 'flex-start',
                              }}
                            >
                              <Paper
                                elevation={isSentByUser ? 2 : 1}
                                sx={{
                                  p: { xs: 1.5, sm: 2 },
                                  backgroundColor: isSentByUser 
                                    ? theme.palette.primary.main 
                                    : theme.palette.mode === 'dark' 
                                      ? theme.palette.grey[800]
                                      : theme.palette.grey[100],
                                  color: isSentByUser 
                                    ? 'white' 
                                    : 'inherit',
                                  borderRadius: isSentByUser 
                                    ? '20px 20px 6px 20px'
                                    : '20px 20px 20px 6px',
                                  boxShadow: isSentByUser 
                                    ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.3)}`
                                    : theme.palette.mode === 'dark'
                                      ? '0 1px 3px rgba(255, 255, 255, 0.1)'
                                      : '0 1px 3px rgba(0, 0, 0, 0.1)',
                                }}
                              >
                                <Typography 
                                  variant="body1" 
                                  sx={{ 
                                    fontSize: { xs: '0.875rem', sm: '1rem' },
                                    lineHeight: 1.4,
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {message.content}
                                </Typography>
                              </Paper>
                              
                              {/* Timestamp */}
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: 'text.secondary',
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  mt: 0.5,
                                  px: 1,
                                  textAlign: isSentByUser ? 'right' : 'left',
                                }}
                              >
                                {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                              </Typography>
                            </Box>

                            {/* Avatar placeholder for sent messages to keep alignment */}
                            {isSentByUser && (
                              <Box sx={{ width: { xs: 28, sm: 32, md: 36 }, flexShrink: 0 }} />
                            )}
                          </Box>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              {/* Message Input */}
              <Box sx={{ 
                p: { xs: 1.5, sm: 2 }, 
                borderTop: 1, 
                borderColor: 'divider',
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.02)'
                  : 'rgba(0,0,0,0.02)',
                flexShrink: 0
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1, sm: 2 }, 
                  alignItems: 'flex-end' 
                }}>
                  <IconButton 
                    size={isMobile ? "small" : "medium"} 
                    color="primary"
                    sx={{ 
                      backgroundColor: theme.palette.action.hover,
                      display: { xs: 'none', sm: 'inline-flex' }, // Hide on mobile to save space
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
                    maxRows={isMobile ? 3 : 4}
                    placeholder={isMobile ? "Message..." : "Type a message..."}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    variant="outlined"
                    size={isMobile ? "small" : "small"}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: { xs: '20px', sm: '25px' },
                        backgroundColor: theme.palette.background.paper,
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        '& .MuiOutlinedInput-input': {
                          py: { xs: 1, sm: 1.25 },
                        }
                      }
                    }}
                  />
                  <IconButton 
                    color="primary" 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    size={isMobile ? "medium" : "large"}
                    sx={{ 
                      backgroundColor: newMessage.trim() ? theme.palette.primary.main : theme.palette.action.disabledBackground,
                      color: newMessage.trim() ? 'white' : theme.palette.action.disabled,
                      width: { xs: 44, sm: 48 },
                      height: { xs: 44, sm: 48 },
                      minWidth: 'auto',
                      '&:hover': {
                        backgroundColor: newMessage.trim() ? theme.palette.primary.dark : theme.palette.action.disabledBackground,
                      },
                      '&:disabled': {
                        backgroundColor: theme.palette.action.disabledBackground,
                      }
                    }}
                  >
                    <Send sx={{ fontSize: { xs: 18, sm: 20 } }} />
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
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Paper,
  InputAdornment,
  Badge,
  Chip,
  CircularProgress,
  Button,
  useTheme,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Image,
  EmojiEmotions,
  MoreVert,
  Work,
  Person,
  Circle,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { chatService, ChatRoom, Message, ChatUser } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';

interface ChatWindowProps {
  chat: ChatRoom;
  onClose?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat, onClose }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  const otherParticipant: ChatUser = chat.participants.find(p => p._id !== user?._id) || chat.participants[0];

  useEffect(() => {
    loadMessages();
    
    // Join chat room for real-time updates
    chatService.joinChat(chat._id);
    
    // Mark messages as read
    chatService.markMessagesAsRead(chat._id);

    // Listen for real-time events
    chatService.on('new-message', handleNewMessage);
    chatService.on('typing', handleTyping);
    chatService.on('message-read', handleMessageRead);

    return () => {
      chatService.leaveChat(chat._id);
      chatService.off('new-message', handleNewMessage);
      chatService.off('typing', handleTyping);
      chatService.off('message-read', handleMessageRead);
    };
  }, [chat._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { messages: chatMessages, hasMore: hasMoreMessages } = await chatService.getChatMessages(chat._id, 1, 50);
      setMessages(chatMessages.reverse()); // Reverse to show oldest first
      setHasMore(hasMoreMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message: Message) => {
    if (message.chatId === chat._id) {
      setMessages(prev => [...prev, message]);
      chatService.markMessagesAsRead(chat._id);
    }
  };

  const handleTyping = ({ chatId, userId, isTyping }: { chatId: string; userId: string; isTyping: boolean }) => {
    if (chatId === chat._id && userId !== user?._id) {
      setTyping(prev => {
        if (isTyping) {
          return [...prev.filter(id => id !== userId), userId];
        } else {
          return prev.filter(id => id !== userId);
        }
      });
    }
  };

  const handleMessageRead = ({ chatId }: { chatId: string }) => {
    if (chatId === chat._id) {
      setMessages(prev => 
        prev.map(msg => ({ ...msg, isRead: true }))
      );
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await chatService.sendMessage(chat._id, {
        content: messageContent,
        messageType: 'text',
      });
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message on error
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setSending(true);
      const { fileUrl, fileName } = await chatService.uploadChatFile(file);
      
      await chatService.sendMessage(chat._id, {
        content: fileName,
        messageType: file.type.startsWith('image/') ? 'image' : 'file',
        fileUrl,
        fileName,
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setSending(false);
    }
  };

  const handleTypingIndicator = (value: string) => {
    setNewMessage(value);
    if (user?._id) {
      chatService.sendTypingIndicator(chat._id, user._id, value.length > 0);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMessageDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const shouldShowDateDivider = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  const isConsecutiveMessage = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return false;
    
    const timeDiff = new Date(currentMessage.timestamp).getTime() - new Date(previousMessage.timestamp).getTime();
    const isSameSender = currentMessage.sender._id === previousMessage.sender._id;
    const isWithin5Minutes = timeDiff < 5 * 60 * 1000; // 5 minutes
    
    return isSameSender && isWithin5Minutes;
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(45deg, #1a1a2e, #16213e)'
            : 'linear-gradient(45deg, #ffffff, #f8f9fa)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              variant="dot"
              color="success"
              invisible={!otherParticipant.isOnline}
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
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {`${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() || otherParticipant.email}
                </Typography>
                {otherParticipant.role === 'employer' && (
                  <Chip
                    icon={<Work />}
                    label="Employer"
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {otherParticipant.isOnline ? 'Online' : `Last seen ${otherParticipant.lastSeen ? new Date(otherParticipant.lastSeen).toLocaleTimeString() : 'recently'}`}
              </Typography>
              {otherParticipant.company && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {otherParticipant.company}
                </Typography>
              )}
            </Box>
          </Box>
          
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreVert />
          </IconButton>
        </Box>
      </Paper>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ maxWidth: '100%' }}>
            <AnimatePresence>
              {messages.map((message, index) => {
                const isOwn = message.sender._id === user?._id;
                const previousMessage = messages[index - 1];
                const showDate = shouldShowDateDivider(message, previousMessage);
                const isConsecutive = isConsecutiveMessage(message, previousMessage);

                return (
                  <motion.div
                    key={message._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {showDate && (
                      <Box sx={{ textAlign: 'center', my: 2 }}>
                        <Chip
                          label={formatMessageDate(message.timestamp)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    )}

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        mb: isConsecutive ? 0.5 : 2,
                        alignItems: 'flex-end',
                      }}
                    >
                      {!isOwn && !isConsecutive && (
                        <Avatar
                          src={message.sender.profilePicture}
                          sx={{ width: 24, height: 24, mr: 1 }}
                        >
                          {message.sender.firstName?.charAt(0)?.toUpperCase() || message.sender.lastName?.charAt(0)?.toUpperCase() || '?'}
                        </Avatar>
                      )}
                      
                      <Box
                        sx={{
                          maxWidth: '70%',
                          ml: !isOwn && isConsecutive ? '32px' : 0,
                        }}
                      >
                        {!isOwn && !isConsecutive && (
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {`${message.sender.firstName || ''} ${message.sender.lastName || ''}`.trim() || message.sender.email}
                          </Typography>
                        )}
                        
                        <Paper
                          elevation={1}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            background: isOwn
                              ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
                              : theme.palette.mode === 'dark'
                                ? '#2a2a3a'
                                : '#f5f5f5',
                            color: isOwn ? 'white' : 'text.primary',
                            borderBottomRightRadius: isOwn && isConsecutive ? 4 : 16,
                            borderBottomLeftRadius: !isOwn && isConsecutive ? 4 : 16,
                          }}
                        >
                          {message.messageType === 'image' && message.fileUrl && (
                            <Box
                              component="img"
                              src={message.fileUrl}
                              alt={message.fileName}
                              sx={{
                                maxWidth: '100%',
                                maxHeight: 200,
                                borderRadius: 1,
                                mb: message.content !== message.fileName ? 1 : 0,
                              }}
                            />
                          )}
                          
                          {message.messageType === 'file' && message.fileUrl && (
                            <Button
                              variant="text"
                              startIcon={<AttachFile />}
                              onClick={() => window.open(message.fileUrl, '_blank')}
                              sx={{ color: isOwn ? 'white' : 'primary.main', mb: 1 }}
                            >
                              {message.fileName}
                            </Button>
                          )}
                          
                          <Typography variant="body2">
                            {message.content}
                          </Typography>
                          
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {formatMessageTime(message.timestamp)}
                            </Typography>
                            {isOwn && (
                              <Circle 
                                sx={{ 
                                  fontSize: 8, 
                                  color: message.isRead ? '#4caf50' : 'rgba(255,255,255,0.5)',
                                  ml: 1 
                                }} 
                              />
                            )}
                          </Box>
                        </Paper>
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Typing Indicator */}
            {typing.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                    {otherParticipant.firstName?.charAt(0)?.toUpperCase() || otherParticipant.lastName?.charAt(0)?.toUpperCase() || '?'}
                  </Avatar>
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: theme.palette.mode === 'dark' ? '#2a2a3a' : '#f5f5f5',
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {`${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim() || otherParticipant.email} is typing...
                    </Typography>
                  </Paper>
                </Box>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </Box>
        )}
      </Box>

      {/* Message Input */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <form onSubmit={handleSendMessage}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => handleTypingIndicator(e.target.value)}
            disabled={sending}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Tooltip title="Attach File">
                    <IconButton 
                      size="small" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sending}
                    >
                      <AttachFile />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Send Message">
                    <IconButton
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      sx={{
                        background: newMessage.trim() ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)' : 'none',
                        color: newMessage.trim() ? 'white' : 'action.disabled',
                        '&:hover': {
                          background: newMessage.trim() ? 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)' : 'none',
                        },
                      }}
                    >
                      {sending ? <CircularProgress size={20} /> : <Send />}
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
              },
            }}
          />
        </form>
      </Paper>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />

      {/* Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          View Profile
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          Clear Chat
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ChatWindow;
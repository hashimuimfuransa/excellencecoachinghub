import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Stack,
  Chip,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Badge,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  Send,
  AttachFile,
  EmojiEmotions,
  MoreVert,
  Search,
  FilterList,
  Group,
  Person,
  School,
  VideoCall,
  Phone,
  Info,
  Settings,
  Block,
  Report,
  Star,
  StarBorder,
  Bookmark,
  BookmarkBorder,
  Archive,
  Delete,
  Notifications,
  NotificationsOff,
  CheckCircle,
  CheckCircleOutline,
  Schedule,
  Timer,
  HourglassEmpty,
  HourglassFull,
  WatchLater,
  Update,
  Cached,
  Autorenew,
  Loop,
  Shuffle,
  Repeat,
  RepeatOne,
  FastRewind,
  FastForward,
  FirstPage,
  LastPage,
  NavigateBefore,
  NavigateNext,
  Computer,
  Business,
  DesignServices,
  Language,
  Science,
  Engineering,
  HealthAndSafety,
  Attractions,
  MusicNote,
  Palette,
  Build,
  Biotech,
  AccountBalance,
  Restaurant,
  DirectionsCar,
  Flight,
  Hotel,
  ShoppingCart,
  Pets,
  Nature,
  WbSunny,
  Cloud,
  Water,
  Eco,
  Recycling,
  Park,
  Forest,
  Beach,
  Mountain,
  City,
  Home,
  Work,
  Favorite,
  ThumbUp,
  Comment,
  Bookmark as BookmarkIcon,
  MoreVert as MoreVertIcon,
  ContentCopy,
  OpenInNew,
  GetApp,
  CloudUpload,
  CloudDownload,
  SyncProblem,
  Error,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';

// Styled Components
const ChatContainer = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 200px)',
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(2),
  overflow: 'hidden',
}));

const ChatBubble = styled(Paper)(({ theme, isOwn, isSystem }) => ({
  padding: theme.spacing(1.5, 2),
  borderRadius: theme.spacing(2),
  maxWidth: '70%',
  backgroundColor: isSystem 
    ? alpha(theme.palette.info.main, 0.1)
    : isOwn 
      ? theme.palette.primary.main 
      : theme.palette.grey[100],
  color: isSystem
    ? theme.palette.info.main
    : isOwn 
      ? theme.palette.primary.contrastText 
      : theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  border: isSystem ? `1px solid ${alpha(theme.palette.info.main, 0.3)}` : 'none',
}));

const ContactCard = styled(Card)(({ theme, isActive }) => ({
  marginBottom: theme.spacing(1),
  borderRadius: theme.spacing(1),
  border: `1px solid ${isActive ? theme.palette.primary.main : alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
}));

// Interfaces
interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'system' | 'image' | 'file';
  attachments?: Attachment[];
  isOwn: boolean;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface ChatContact {
  id: string;
  name: string;
  avatar?: string;
  role: 'student' | 'teacher';
  isOnline: boolean;
  lastSeen: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isGroup: boolean;
  groupMembers?: number;
  isPinned: boolean;
  isMuted: boolean;
}

interface CommunityChatProps {}

const CommunityChat: React.FC<CommunityChatProps> = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Load contacts and messages
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Mock contacts data
        const mockContacts: ChatContact[] = [
          {
            id: 'teacher-1',
            name: 'Dr. Sarah Johnson',
            avatar: '/avatars/sarah.jpg',
            role: 'teacher',
            isOnline: true,
            lastSeen: new Date().toISOString(),
            lastMessage: 'Great work on your latest assignment!',
            lastMessageTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            unreadCount: 2,
            isGroup: false,
            isPinned: true,
            isMuted: false
          },
          {
            id: 'group-1',
            name: 'React Developers',
            avatar: '/group-avatars/react.jpg',
            role: 'student',
            isOnline: false,
            lastSeen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            lastMessage: 'Alex: Has anyone tried the new React 18 features?',
            lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            unreadCount: 5,
            isGroup: true,
            groupMembers: 1250,
            isPinned: false,
            isMuted: false
          },
          {
            id: 'student-1',
            name: 'Mike Chen',
            avatar: '/avatars/mike.jpg',
            role: 'student',
            isOnline: true,
            lastSeen: new Date().toISOString(),
            lastMessage: 'Thanks for the help with the project!',
            lastMessageTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            unreadCount: 0,
            isGroup: false,
            isPinned: false,
            isMuted: false
          },
          {
            id: 'group-2',
            name: 'Data Science Beginners',
            avatar: '/group-avatars/datascience.jpg',
            role: 'student',
            isOnline: false,
            lastSeen: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            lastMessage: 'Emma: Can someone explain pandas to me?',
            lastMessageTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            unreadCount: 0,
            isGroup: true,
            groupMembers: 850,
            isPinned: false,
            isMuted: true
          }
        ];

        setContacts(mockContacts);
        
        // Load messages for first contact
        if (mockContacts.length > 0) {
          loadMessages(mockContacts[0].id);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Load messages for selected contact
  const loadMessages = async (contactId: string) => {
    try {
      // Mock messages data
      const mockMessages: Message[] = [
        {
          id: 'msg-1',
          senderId: 'teacher-1',
          senderName: 'Dr. Sarah Johnson',
          senderAvatar: '/avatars/sarah.jpg',
          content: 'Welcome to the course! I\'m excited to have you in my class.',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          type: 'text',
          isOwn: false
        },
        {
          id: 'msg-2',
          senderId: user?._id || 'current-user',
          senderName: `${user?.firstName} ${user?.lastName}`,
          senderAvatar: user?.profilePicture,
          content: 'Thank you! I\'m looking forward to learning from you.',
          timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          type: 'text',
          isOwn: true
        },
        {
          id: 'msg-3',
          senderId: 'system',
          senderName: 'System',
          content: 'You can now send messages to your teacher',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          type: 'system',
          isOwn: false
        },
        {
          id: 'msg-4',
          senderId: 'teacher-1',
          senderName: 'Dr. Sarah Johnson',
          senderAvatar: '/avatars/sarah.jpg',
          content: 'Great! Don\'t hesitate to reach out if you have any questions.',
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          type: 'text',
          isOwn: false
        },
        {
          id: 'msg-5',
          senderId: 'teacher-1',
          senderName: 'Dr. Sarah Johnson',
          senderAvatar: '/avatars/sarah.jpg',
          content: 'Reminder: The quiz for Chapter 1 is due tomorrow at 11:59 PM.',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          type: 'text',
          isOwn: false
        },
        {
          id: 'msg-6',
          senderId: 'teacher-1',
          senderName: 'Dr. Sarah Johnson',
          senderAvatar: '/avatars/sarah.jpg',
          content: 'Great work on your latest assignment!',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          isRead: false,
          type: 'text',
          isOwn: false
        }
      ];

      setMessages(mockMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Handle contact selection
  const handleContactSelect = (contact: ChatContact) => {
    setSelectedContact(contact);
    loadMessages(contact.id);
    
    // Mark messages as read
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, unreadCount: 0 } : c
    ));
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    try {
      const message: Message = {
        id: `msg-${Date.now()}`,
        senderId: user?._id || 'current-user',
        senderName: `${user?.firstName} ${user?.lastName}`,
        senderAvatar: user?.profilePicture,
        content: newMessage,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'text',
        isOwn: true
      };

      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      // Update contact's last message
      setContacts(prev => prev.map(contact => 
        contact.id === selectedContact.id 
          ? { 
              ...contact, 
              lastMessage: newMessage,
              lastMessageTime: new Date().toISOString()
            }
          : contact
      ));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading chat...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 120px)' }}>
      <Grid container spacing={3} sx={{ height: '100%' }}>
        {/* Contacts Sidebar */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                  Messages
                </Typography>
                <IconButton>
                  <Search />
                </IconButton>
                <IconButton>
                  <MoreVert />
                </IconButton>
              </Stack>
            </CardContent>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
              <List sx={{ p: 0 }}>
                {contacts.map((contact) => (
                  <ListItem
                    key={contact.id}
                    sx={{ p: 0 }}
                  >
                    <ContactCard
                      isActive={selectedContact?.id === contact.id}
                      sx={{ width: '100%', m: 1 }}
                    >
                      <CardContent
                        sx={{ p: 2, cursor: 'pointer' }}
                        onClick={() => handleContactSelect(contact)}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  backgroundColor: contact.isOnline ? 'success.main' : 'grey.400',
                                  border: `2px solid ${theme.palette.background.paper}`,
                                }}
                              />
                            }
                          >
                            <Avatar src={contact.avatar}>
                              {contact.name.split(' ').map(n => n[0]).join('')}
                            </Avatar>
                          </Badge>
                          
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }}>
                                {contact.name}
                              </Typography>
                              {contact.isPinned && <Star color="warning" sx={{ fontSize: 16 }} />}
                              {contact.isMuted && <NotificationsOff color="disabled" sx={{ fontSize: 16 }} />}
                              {contact.unreadCount > 0 && (
                                <Badge badgeContent={contact.unreadCount} color="error" />
                              )}
                            </Stack>
                            
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Chip
                                label={contact.role}
                                size="small"
                                color={contact.role === 'teacher' ? 'primary' : 'default'}
                                variant="outlined"
                              />
                              {contact.isGroup && (
                                <Chip
                                  label={`${contact.groupMembers} members`}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>
                            
                            {contact.lastMessage && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  mt: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {contact.lastMessage}
                              </Typography>
                            )}
                            
                            {contact.lastMessageTime && (
                              <Typography variant="caption" color="text.secondary">
                                {formatTimestamp(contact.lastMessageTime)}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </CardContent>
                    </ContactCard>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Card>
        </Grid>

        {/* Chat Area */}
        <Grid item xs={12} md={8}>
          {selectedContact ? (
            <ChatContainer>
              {/* Chat Header */}
              <Paper sx={{ p: 2, borderRadius: 0, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar src={selectedContact.avatar}>
                    {selectedContact.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {selectedContact.name}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Chip
                        label={selectedContact.role}
                        size="small"
                        color={selectedContact.role === 'teacher' ? 'primary' : 'default'}
                        variant="outlined"
                      />
                      {selectedContact.isGroup && (
                        <Chip
                          label={`${selectedContact.groupMembers} members`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {selectedContact.isOnline ? 'Online' : `Last seen ${formatTimestamp(selectedContact.lastSeen)}`}
                      </Typography>
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <IconButton>
                      <VideoCall />
                    </IconButton>
                    <IconButton>
                      <Phone />
                    </IconButton>
                    <IconButton>
                      <Info />
                    </IconButton>
                    <IconButton>
                      <MoreVert />
                    </IconButton>
                  </Stack>
                </Stack>
              </Paper>

              {/* Messages */}
              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                <Stack spacing={1}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: message.isOwn ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {!message.isOwn && !message.type === 'system' && (
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <Avatar src={message.senderAvatar} sx={{ width: 24, height: 24 }}>
                            {message.senderName.split(' ').map(n => n[0]).join('')}
                          </Avatar>
                          <Typography variant="caption" color="text.secondary">
                            {message.senderName}
                          </Typography>
                        </Stack>
                      )}
                      
                      <ChatBubble 
                        isOwn={message.isOwn} 
                        isSystem={message.type === 'system'}
                      >
                        <Typography variant="body2">
                          {message.content}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {formatTimestamp(message.timestamp)}
                          </Typography>
                          {message.isOwn && (
                            message.isRead ? <CheckCircle sx={{ fontSize: 16 }} /> : <CheckCircleOutline sx={{ fontSize: 16 }} />
                          )}
                        </Stack>
                      </ChatBubble>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Stack>
              </Box>

              {/* Message Input */}
              <Paper sx={{ p: 2, borderRadius: 0, borderTop: 1, borderColor: 'divider' }}>
                <Stack direction="row" spacing={1} alignItems="flex-end">
                  <IconButton>
                    <AttachFile />
                  </IconButton>
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    multiline
                    maxRows={3}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 3,
                      }
                    }}
                  />
                  <IconButton>
                    <EmojiEmotions />
                  </IconButton>
                  <Button
                    variant="contained"
                    startIcon={<Send />}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    sx={{ borderRadius: 3 }}
                  >
                    Send
                  </Button>
                </Stack>
              </Paper>
            </ChatContainer>
          ) : (
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to start chatting
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose from your contacts or groups to begin messaging
                </Typography>
              </Box>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default CommunityChat;

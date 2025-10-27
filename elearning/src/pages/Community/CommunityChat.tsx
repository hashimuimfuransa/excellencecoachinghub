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
  styled,
  Menu,
  MenuItem,
  Pagination,
  Tooltip,
  CircularProgress,
  Drawer,
  useMediaQuery,
  Hidden,
  Fab
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
  Info as InfoIcon,
  Reply,
  Delete as DeleteIcon,
  Edit,
  Forward,
  CopyAll,
  Menu as MenuIcon,
  Close,
  ArrowBack,
  Mic,
  MicOff,
  Image,
  PlayArrow,
  Pause,
  Stop
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { communityService, IUser } from '../../services/communityService';
import { io } from 'socket.io-client';

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
  type: 'text' | 'system' | 'image' | 'file' | 'audio';
  attachments?: Attachment[];
  isOwn: boolean;
  fileUrl?: string;
  fileName?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
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
  
  // Responsive breakpoints
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<IUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<{message: Message | null, element: HTMLElement | null}>({message: null, element: null});
  const [contactPage, setContactPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [contactsLimit] = useState(10);
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // File upload and voice recording states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [sendingVoiceMessage, setSendingVoiceMessage] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  
  // Remove complex ref tracking - use simple job portal approach
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  
  // Audio player refs for cleanup
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  
  // Debug recording state changes
  useEffect(() => {
    console.log('Recording state changed:', { isRecording, recordingDuration, hasInterval: !!recordingIntervalRef.current });
  }, [isRecording, recordingDuration]);
  

  // Load contacts and messages
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch real conversations from backend
        const conversations = await communityService.getConversations();
        console.log('Loaded conversations:', conversations); // Debug log
        
        // Transform conversations to ChatContact format (only users with existing conversations)
        const contacts: ChatContact[] = conversations
          .filter((conv: any) => {
            // Only include conversations that have participants with valid data
            if (conv.isGroup) {
              return conv.groupName && conv.groupName.trim() !== '';
            } else {
              // For direct chats, ensure we have a valid other participant
              const otherParticipant = conv.participants.find((p: any) => p._id !== user?._id);
              return otherParticipant && otherParticipant.firstName && otherParticipant.lastName;
            }
          })
          .map((conv: any) => {
            // For direct chats, find the other participant
            const otherParticipant = conv.participants.find((p: any) => p._id !== user?._id);
            
            return {
              id: conv._id.toString(),
              name: conv.isGroup ? conv.groupName : `${otherParticipant.firstName} ${otherParticipant.lastName}`,
              avatar: conv.isGroup ? conv.groupAvatar : otherParticipant?.profilePicture,
              role: otherParticipant?.role || 'student',
              isOnline: conv.participants.some((p: any) => p._id !== user?._id && p.isOnline),
              lastSeen: otherParticipant?.lastSeen || new Date().toISOString(),
              lastMessage: conv.lastMessage?.content || 'No messages yet',
              lastMessageTime: conv.lastMessage?.createdAt || conv.updatedAt,
              unreadCount: conv.unreadCount || 0,
              isGroup: conv.isGroup,
              groupMembers: conv.isGroup ? conv.participants.length : undefined,
            isPinned: false,
            isMuted: false
            };
          });
        
        console.log('Created contacts:', contacts); // Debug log
        
        // Store all conversations for pagination
        setAllConversations(conversations);
        setTotalContacts(contacts.length);
        
        // Only show first page of contacts initially
        const currentContacts = contacts.slice(0, contactsLimit);
        setContacts(currentContacts);
        
        // If no conversation is selected, auto-select the first one
        if (currentContacts.length > 0) {
          console.log('Auto selecting first contact:', currentContacts[0]); // Debug log
          setSelectedContact(currentContacts[0]);
          loadMessages(currentContacts[0].id);
        }
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

    // Load users when modal opens
    useEffect(() => {
      if (showUserSearch) {
        loadAllUsers();
      } else {
        // Clear users and search when modal closes
        setAvailableUsers([]);
        setSearchQuery('');
      }
    }, [showUserSearch]);

    // Initialize Socket.IO connection for real-time messaging
    useEffect(() => {
      if (user) {
        const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        const newSocket = io(backendUrl, {
          auth: {
            userId: user._id
          }
        });

        setSocket(newSocket);

        // Listen for new messages
        newSocket.on('new-message', (data) => {
          console.log('New message received:', data);
          
          // Only add message if it's for the currently selected chat
          if (selectedContact && data.chatId === selectedContact.id) {
            const message: Message = {
              id: data.message._id.toString(),
              senderId: data.message.sender._id?.toString() || data.message.sender?.toString() || user._id,
              senderName: `${data.sender.firstName} ${data.sender.lastName}`,
              senderAvatar: data.message.sender?.profilePicture || '',
              content: data.message.content,
              timestamp: data.message.createdAt,
              isRead: data.message.readBy?.includes(user._id) || false,
              type: data.message.messageType || 'text',
              isOwn: (data.message.sender._id?.toString() === user._id) || (data.message.sender?.toString() === user._id),
              replyTo: data.message.replyTo ? {
                id: data.message.replyTo._id.toString(),
                content: data.message.replyTo.content,
                senderName: `${data.message.replyTo.sender?.firstName} ${data.message.replyTo.sender?.lastName}` || 'Unknown'
              } : undefined
            };

            console.log('Adding message to chat:', message); // Debug log
            
            // Add message only if it's not a duplicate (avoid duplicates from our own messages)
            setMessages(prev => {
              const messageExists = prev.some(msg => msg.id === message.id);
              if (messageExists) {
                console.log('Message already exists, not adding duplicate');
                return prev; // Don't add duplicate
              }
              return [...prev, message];
            });
          }

          // Update contacts list with new message
          setContacts(prev => prev.map(contact => {
            if (contact.id === data.chatId) {
              return {
                ...contact,
                lastMessage: data.message.content,
                lastMessageTime: data.message.createdAt,
                unreadCount: contact.unreadCount + 1
              };
            }
            return contact;
          }));
        });

        // Listen for join chat room
        newSocket.on('connect', () => {
          console.log('Connected to chat server');
        });

        return () => {
          newSocket.disconnect();
        };
      }
    }, [user, selectedContact]);

  // Cleanup socket and recording on component unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
      // Cleanup recording resources on unmount
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      // Cleanup audio preview
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
      }
    };
  }, [socket, audioPreviewUrl]);

  // Load messages for selected contact
  const loadMessages = async (contactId: string) => {
    try {
      console.log('Loading messages for contact:', contactId); // Debug log
      
      // Only load messages for existing conversations
      const messagesResponse = await communityService.getMessages(contactId, 1, 50);
      
      console.log('Messages response:', messagesResponse); // Debug log
      
      // Handle different response structures
      const messagesData = messagesResponse.data || messagesResponse.messages || messagesResponse;
      
      if (!Array.isArray(messagesData)) {
        console.error('Invalid messages response format:', messagesData);
        setMessages([]);
        return;
      }

      if (messagesData.length === 0) {
        console.log('No messages found for contact:', contactId);
        setMessages([]);
        return;
      }
      
      // Transform backend messages to frontend format
      const messages: Message[] = messagesData.map((msg: any) => {
        console.log('Processing message:', {
          id: msg._id,
          type: msg.messageType,
          content: msg.content,
          fileUrl: msg.fileUrl,
          fileName: msg.fileName,
          raw: msg
        }); // Enhanced debug log
        
        const messageContent = {
          id: msg._id.toString(),
          senderId: msg.sender?._id?.toString() || msg.sender?.toString() || user?._id,
          senderName: `${msg.sender?.firstName || ''} ${msg.sender?.lastName || ''}` || 'Unknown User',
          senderAvatar: msg.sender?.profilePicture || '',
          content: msg.content,
          timestamp: msg.createdAt || msg.timestamp,
          isRead: msg.readBy?.includes(user?._id) || msg.isRead || false,
          type: msg.messageType || 'text',
          isOwn: (msg.sender?._id?.toString() === user?._id) || (msg.sender?.toString() === user?._id),
          fileUrl: msg.fileUrl || msg.file?.url || msg.attachments?.[0]?.url,
          fileName: msg.fileName || msg.file?.name || msg.attachments?.[0]?.name || 'Unknown File',
          replyTo: msg.replyTo ? {
            id: msg.replyTo._id.toString(),
            content: msg.replyTo.content,
            senderName: `${msg.replyTo.sender?.firstName} ${msg.replyTo.sender?.lastName}` || 'Unknown'
          } : undefined
        };
        
        // Special logging for audio messages
        if (msg.messageType === 'audio') {
          console.log('Audio message details:', {
            hasFileUrl: !!messageContent.fileUrl,
            fileUrl: messageContent.fileUrl,
            fileName: messageContent.fileName,
            content: messageContent.content
          });
        }
        
        return messageContent;
      });

      console.log('Processed messages:', messages); // Debug log
      setMessages(messages);
      
    } catch (error) {
      console.error('Error loading messages:', error);
      console.error('Error details:', error.response?.data || error.message);
      setMessages([]);
    }
  };

  // Handle contact selection
  const handleContactSelect = (contact: ChatContact) => {
    console.log('Selecting contact:', contact); // Debug log
    setSelectedContact(contact);
    loadMessages(contact.id);
    
    // Join chat room for real-time updates
    if (socket) {
      socket.emit('join-chat', contact.id);
    }
    
    // Mark messages as read
    markMessagesAsRead(contact.id);
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return;

    console.log('About to send message:', {
      message: newMessage,
      replyingTo: replyingTo?.id,
      replyingToContent: replyingTo?.content
    }); // Debug log

    setSendingMessage(true); // Start loading state

    try {
      // Send message to backend
      const messageData = {
        content: newMessage,
        messageType: 'text' as const,
        ...(replyingTo && { replyTo: replyingTo.id })
      };
      
      console.log('Sending message data:', messageData); // Debug log
      console.log('Reply state:', replyingTo); // Debug log
      
      const messageResponse = await communityService.sendMessage(selectedContact.id, messageData);

      console.log('Message response:', messageResponse); // Debug log

      // The response structure should match the backend ChatMessage model
      const responseData = messageResponse.data || messageResponse;
      console.log('Response data structure:', responseData); // Debug log
      
      // Transform backend response to frontend format
      const message: Message = {
        id: responseData._id.toString(),
        senderId: responseData.sender?._id?.toString() || responseData.sender?.toString() || user?._id,
        senderName: `${responseData.sender?.firstName || user?.firstName} ${responseData.sender?.lastName || user?.lastName}`,
        senderAvatar: responseData.sender?.profilePicture || user?.profilePicture,
        content: responseData.content,
        timestamp: responseData.createdAt || new Date().toISOString(),
        isRead: responseData.readBy?.includes(user?._id) || false,
        type: responseData.messageType || 'text',
        isOwn: responseData.sender?._id?.toString() === user?._id || responseData.sender?.toString() === user?._id,
        replyTo: responseData.replyTo ? {
          id: responseData.replyTo._id.toString(),
          content: responseData.replyTo.content,
          senderName: `${responseData.replyTo.sender?.firstName} ${responseData.replyTo.sender?.lastName}` || 'Unknown'
        } : undefined
      };

      // Add message to local state immediately for instant UI update
      setMessages(prev => [...prev, message]);
      
      // Clear input and reply state IMMEDIATELY (before any potential errors)
      setNewMessage('');
      setReplyingTo(null);
      
      console.log('Message sent successfully, input cleared'); // Debug log
      
      // Auto-scroll to bottom to show new message
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      setSendingMessage(false); // Clear loading state
      
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

      // Emit message through socket for real-time updates
      if (socket) {
        socket.emit('send-message', {
          chatId: selectedContact.id,
          message: messageData,
          sender: {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName
          },
          replyTo: replyingTo ? {
            _id: replyingTo.id,
            content: replyingTo.content,
            sender: {
              _id: replyingTo.senderId,
              firstName: replyingTo.senderName.split(' ')[0],
              lastName: replyingTo.senderName.split(' ')[1] || ''
            }
          } : null
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Even if there's an error, clear the input to prevent confusion
      setNewMessage('');
      setReplyingTo(null);
      
      // Show user feedback if needed
      console.log('Message failed to send, but input cleared for retry');
    } finally {
      setSendingMessage(false); // Always clear loading state
    }
  };

  // Handle key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Load all users when modal opens
  const loadAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const users = await communityService.getUsers({
        // No limit specified to get all users
      });
      setAvailableUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };


  // Filter users based on search query
  const filteredUsers = availableUsers.filter(user => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.company && user.company.toLowerCase().includes(query))
    );
  });

  // Start conversation with selected user
  const handleStartConversation = async (userToChat: IUser) => {
    try {
      const conversation = await communityService.createConversation([userToChat._id], false, undefined, 'Hi! I started this conversation.');
      
      // Create new contact
      const newContact: ChatContact = {
        id: conversation._id.toString(),
        name: `${userToChat.firstName} ${userToChat.lastName}`,
        avatar: userToChat.profilePicture,
        role: userToChat.role,
        isOnline: userToChat.isOnline,
        lastSeen: userToChat.lastSeen || new Date().toISOString(),
        lastMessage: 'Hi! I started this conversation.',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isGroup: false,
        isPinned: false,
        isMuted: false
      };

      // Add to contacts
      setContacts(prev => [newContact, ...prev]);
      setSelectedContact(newContact);
      
      // Clear search and close modal
      setShowUserSearch(false);
      setSearchQuery('');
      setAvailableUsers([]);
      
      // Load messages for new conversation
      loadMessages(newContact.id);
      
      // Join chat room for new conversation
      if (socket) {
        socket.emit('join-chat', newContact.id);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  // Mark messages as read when viewing a chat
  const markMessagesAsRead = async (chatId: string) => {
    try {
      await communityService.markMessagesAsRead(chatId);
      
      // Update contacts to remove unread count
      setContacts(prev => prev.map(contact => 
        contact.id === chatId ? { ...contact, unreadCount: 0 } : contact
      ));
      
      // Update messages to show as read
      setMessages(prev => prev.map(msg => 
        msg.senderId !== user?._id ? { ...msg, isRead: true } : msg
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Handle message menu actions
  const handleMessageMenu = (event: React.MouseEvent, message: Message) => {
    event.preventDefault();
    setMessageMenuAnchor({ message, element: event.currentTarget as HTMLElement });
  };

  const closeMessageMenu = () => {
    setMessageMenuAnchor({ message: null, element: null });
  };

  const handleReply = () => {
    console.log('Starting reply:', messageMenuAnchor.message); // Debug log
    setReplyingTo(messageMenuAnchor.message);
    closeMessageMenu();
  };

  const handleDeleteMessage = async () => {
    const message = messageMenuAnchor.message;
    if (!message || !selectedContact) return;

    try {
      await communityService.deleteMessage(selectedContact.id, message.id);
      setMessages(prev => prev.filter(msg => msg.id !== message.id));
      closeMessageMenu();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageMenuAnchor.message?.content || '');
    closeMessageMenu();
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Responsive drawer functions
  const toggleDrawer = (open: boolean) => (event: KeyboardEvent | MouseEvent) => {
    if (
      event.type === 'keydown' &&
      ((event as KeyboardEvent).key === 'Tab' ||
        (event as KeyboardEvent).key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleContactSelectMobile = (contact: ChatContact) => {
    handleContactSelect(contact);
    if (isMobile) {
      setDrawerOpen(false); // Close drawer on mobile after selecting contact
    }
  };

  // Voice recording functions (job portal implementation)
  const startRecording = async () => {
    // Prevent multiple recordings
    if (isRecording || mediaRecorder) {
      console.log('Recording already in progress, ignoring start request');
      return;
    }
    
    try {
      console.log('Starting recording...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Audio stream obtained');
      
      const mediaRecorder = new MediaRecorder(stream);
      setMediaRecorder(mediaRecorder);
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      mediaRecorder.onstart = () => {
        console.log('MediaRecorder started successfully');
      };
      
      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, chunks received:', chunks.length);
        
        // Only create audio blob if we have chunks
        if (chunks.length > 0 && chunks.some(chunk => chunk.size > 0)) {
          const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
          console.log('Audio blob created, size:', blob.size, 'type:', blob.type);
          
          if (blob.size > 0) {
            // Audio chunks already stored during recording
            
            try {
              // Upload to Cloudinary immediately for preview
              console.log('Uploading audio to Cloudinary for preview...');
              const uploadData = await communityService.uploadAudio(
                new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
              );
              
              console.log('Audio uploaded to Cloudinary:', uploadData.fileUrl);
              setAudioPreviewUrl(uploadData.fileUrl);
            } catch (error) {
              console.error('Failed to upload audio to Cloudinary:', error);
              // Fallback to blob URL if Cloudinary upload fails
              const url = URL.createObjectURL(blob);
              console.log('Using blob URL as fallback:', url);
              setAudioPreviewUrl(url);
            }
          } else {
            console.warn('Audio blob is empty, recording may have failed');
          }
        } else {
          console.warn('No valid audio chunks received');
        }
        
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Removed track:', track.kind);
        });
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Start duration counter - exactly like job portal
      console.log('Setting up timer...');
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          console.log('Timer tick - updating duration to:', newDuration);
          return newDuration;
        });
      }, 1000);
      
      console.log('Recording started successfully', {
        intervalSet: !!recordingIntervalRef.current,
        mediaRecorderState: mediaRecorder.state,
        isRecording: true,
        intervalId: recordingIntervalRef.current
      });
      
      // Force immediate test of timer
      setTimeout(() => {
        console.log('Timer test - 2 sec later:', {
          hasInterval: !!recordingIntervalRef.current,
          currentDuration: recordingDuration
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Microphone access denied. Please enable microphone permissions.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
    
    setIsRecording(false);
    setRecordingDuration(0);
    setAudioChunks([]);
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    
    setMediaRecorder(null);
  };

  const sendVoiceMessage = async () => {
    if (!audioChunks || audioChunks.length === 0 || !selectedContact || sendingVoiceMessage) return;

    try {
      setSendingVoiceMessage(true);
      
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
      
      // Upload voice file
      const uploadResult = await communityService.uploadAudio(audioFile);
      
      // Send message with audio reference (use 'file' type to match job portal)
      const messageData = {
        content: `🎤 Voice message (${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')})`,
        messageType: 'file',
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName
      };
      
      const messageResponse = await communityService.sendMessage(selectedContact.id, messageData);
      
      // Add to messages list
      const responseData = messageResponse.data || messageResponse;
      const message: Message = {
        id: responseData._id.toString(),
        senderId: responseData.sender?._id?.toString() || responseData.sender?.toString() || user?._id,
        senderName: `${responseData.sender?.firstName || user?.firstName} ${responseData.sender?.lastName || user?.lastName}`,
        senderAvatar: responseData.sender?.profilePicture || user?.profilePicture,
        content: messageData.content,
        timestamp: responseData.createdAt || new Date().toISOString(),
        isRead: responseData.readBy?.includes(user?._id) || false,
        type: 'file',
        isOwn: responseData.sender?._id?.toString() === user?._id || responseData.sender?.toString() === user?._id,
        fileUrl: uploadResult.fileUrl,
        fileName: messageData.fileName
      };

      setMessages(prev => [...prev, message]);
      
      // Reset recording state
      setAudioChunks([]);
      setRecordingDuration(0);
      
      // Clean up preview URL
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
      }
      
      setMediaRecorder(null);
      
      console.log('Voice message sent successfully');
    } catch (error) {
      console.error('Error sending voice message:', error);
    } finally {
      setSendingVoiceMessage(false);
    }
  };

  // Image upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const isAudio = file.type.startsWith('audio/');
      
      if (isImage || isAudio) {
        setSelectedFile(file);
        
        if (isImage) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFilePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
        }
        
        setShowFilePreview(true);
      } else {
        alert('Please select an image or audio file');
      }
    }
  };

  const sendImageMessage = async (file: File) => {
    if (!selectedContact) return;
    
    try {
      setSendingMessage(true);
      
      // Upload image file using service
      const uploadData = await communityService.uploadImage(file);
      
      // Send message with audio reference
      const messageData = {
        content: 'Image',
        messageType: 'image',
        fileUrl: uploadData.fileUrl,
        fileName: file.name
      };
      
      const messageResponse = await communityService.sendMessage(selectedContact.id, messageData);
      
      // Add to messages list
      const responseData = messageResponse.data || messageResponse;
      const message: Message = {
        id: responseData._id.toString(),
        senderId: responseData.sender?._id?.toString() || responseData.sender?.toString() || user?._id,
        senderName: `${responseData.sender?.firstName || user?.firstName} ${responseData.sender?.lastName || user?.lastName}`,
        senderAvatar: responseData.sender?.profilePicture || user?.profilePicture,
        content: 'Image',
        timestamp: responseData.createdAt || new Date().toISOString(),
        isRead: responseData.readBy?.includes(user?._id) || false,
        type: 'image',
        isOwn: responseData.sender?._id?.toString() === user?._id || responseData.sender?.toString() === user?._id,
        fileUrl: uploadData.fileUrl,
        fileName: file.name
      };

      setMessages(prev => [...prev, message]);
      
      // Clear file selection
      setSelectedFile(null);
      setFilePreview(null);
      setShowFilePreview(false);
      
    } catch (error) {
      console.error('Error sending image:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const cancelFileUpload = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setShowFilePreview(false);
  };

  // Audio playback functions



  // Handle pagination for contacts
  const handleContactPageChange = (event: any, page: number) => {
    setContactPage(page);
    
    // Transform stored conversations to contacts
    const contacts: ChatContact[] = allConversations
      .filter((conv: any) => {
        if (conv.isGroup) {
          return conv.groupName && conv.groupName.trim() !== '';
        } else {
          const otherParticipant = conv.participants.find((p: any) => p._id !== user?._id);
          return otherParticipant && otherParticipant.firstName && otherParticipant.lastName;
        }
      })
      .map((conv: any) => {
        const otherParticipant = conv.participants.find((p: any) => p._id !== user?._id);
        return {
          id: conv._id.toString(),
          name: conv.isGroup ? conv.groupName : `${otherParticipant.firstName} ${otherParticipant.lastName}`,
          avatar: conv.isGroup ? conv.groupAvatar : otherParticipant?.profilePicture,
          role: otherParticipant?.role || 'student',
          isOnline: conv.participants.some((p: any) => p._id !== user?._id && p.isOnline),
          lastSeen: otherParticipant?.lastSeen || new Date().toISOString(),
          lastMessage: conv.lastMessage?.content || 'No messages yet',
          lastMessageTime: conv.lastMessage?.createdAt || conv.updatedAt,
          unreadCount: conv.unreadCount || 0,
          isGroup: conv.isGroup,
          groupMembers: conv.isGroup ? conv.participants.length : undefined,
          isPinned: false,
          isMuted: false
        };
      });

    const startIndex = (page - 1) * contactsLimit;
    const endIndex = startIndex + contactsLimit;
    const paginatedContacts = contacts.slice(startIndex, endIndex);
    setContacts(paginatedContacts);
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
    <Box sx={{ 
      p: { xs: 1, sm: 2, md: 3 }, 
      height: { xs: '100vh', sm: 'calc(100vh - 120px)' },
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        display: 'flex', 
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Mobile Drawer for Contacts */}
        <Drawer
          variant={isMobile ? "temporary" : "permanent"}
          open={drawerOpen || !isMobile}
          onClose={toggleDrawer(false)}
          sx={{
            ...(isMobile && {
              '& .MuiDrawer-paper': {
                borderRadius: { xs: 0 },
                height: '100%',
                border: 'none'
              },
            }),
            ...(!isMobile && {
              position: 'static',
              flexShrink: 0,
              width: { md: '350px', lg: '400px' },
              '& .MuiDrawer-paper': {
                position: 'static',
                border: 'none',
                borderRight: 1,
                borderColor: 'divider'
              },
            }),
          }}
        >
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: { xs: 0 },
            width: { xs: '280px', sm: '320px', md: '350px', lg: '400px' },
            boxShadow: 'none'
          }}>
            {/* Mobile Header with Close Button */}
            {isMobile && (
              <CardContent sx={{ borderBottom: 1, borderColor: 'divider', p: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <IconButton onClick={() => setDrawerOpen(false)}>
                    <ArrowBack />
                  </IconButton>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Messages
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Group />}
                    onClick={() => setShowUserSearch(true)}
                  >
                    Start Chat
                  </Button>
                </Stack>
              </CardContent>
            )}
            
            {/* Desktop Header */}
            {!isMobile && (
            <CardContent sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                  <IconButton 
                    onClick={handleDrawerToggle} 
                    sx={{ display: { md: 'block', lg: 'none' } }}
                  >
                    <MenuIcon />
                  </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                  Messages
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Group />}
                  onClick={() => setShowUserSearch(true)}
                >
                  Start Chat
                </Button>
                <IconButton>
                  <Search />
                </IconButton>
                <IconButton>
                  <MoreVert />
                </IconButton>
              </Stack>
            </CardContent>
            )}
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                        onClick={() => handleContactSelectMobile(contact)}
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
              
              {/* Pagination for contacts */}
              {totalContacts > contactsLimit && (
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Pagination
                    count={Math.ceil(totalContacts / contactsLimit)}
                    page={contactPage}
                    onChange={handleContactPageChange}
                    size="small"
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Box>
          </Card>
        </Drawer>

        {/* Main Chat Area */}
        <Box sx={{ 
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0 // Prevents flex overflow
        }}>
          {selectedContact ? (
            <ChatContainer>
              {/* Chat Header */}
              <Paper sx={{ 
                p: 2, 
                borderRadius: 0, 
                borderBottom: 1, 
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, sm: 2 }} sx={{ flexGrow: 1 }}>
                  {/* Mobile Menu Button */}
                  {isMobile && (
                    <IconButton 
                      onClick={() => setDrawerOpen(true)}
                      size="large"
                      sx={{ 
                        minWidth: '48px',
                        minHeight: '48px',
                        p: 1
                      }}
                    >
                      <MenuIcon fontSize="medium" />
                    </IconButton>
                  )}
                  
                  <Avatar 
                    src={selectedContact.avatar}
                    sx={{ 
                      width: { xs: 40, sm: 44 }, 
                      height: { xs: 40, sm: 44 } 
                    }}
                  >
                    {selectedContact.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography 
                      variant={isMobile ? "subtitle1" : "h6"} 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1rem', sm: '1.25rem' },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {selectedContact.name}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1 }}>
                      <Chip
                        label={selectedContact.isOnline ? 'Online' : 'Offline'}
                        size={isMobile ? "small" : "small"}
                        color={selectedContact.isOnline ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ 
                          height: { xs: 18, sm: 20 },
                          fontSize: { xs: '0.625rem', sm: '0.75rem' }
                        }}
                      />
                      {selectedContact.role && (
                        <Chip
                          label={selectedContact.role}
                          size={isMobile ? "small" : "small"}
                          color="primary"
                          variant="outlined"
                          sx={{ 
                            height: { xs: 18, sm: 20 },
                            fontSize: { xs: '0.625rem', sm: '0.75rem' }
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }}>
                  {!isMobile && (
                    <>
                      <IconButton size={isMobile ? "large" : "medium"}>
                        <VideoCall fontSize={isMobile ? "medium" : "small"} />
                    </IconButton>
                      <IconButton size={isMobile ? "large" : "medium"}>
                        <Phone fontSize={isMobile ? "medium" : "small"} />
                    </IconButton>
                    </>
                  )}
                  <IconButton 
                    size={isMobile ? "large" : "medium"}
                    sx={{
                      minWidth: { xs: '48px', sm: 'auto' },
                      minHeight: { xs: '48px', sm: 'auto' }
                    }}
                  >
                    <Info fontSize={isMobile ? "medium" : "small"} />
                    </IconButton>
                  <IconButton 
                    size={isMobile ? "large" : "medium"}
                    sx={{
                      minWidth: { xs: '48px', sm: 'auto' },
                      minHeight: { xs: '48px', sm: 'auto' }
                    }}
                  >
                    <MoreVert fontSize={isMobile ? "medium" : "small"} />
                    </IconButton>
                </Stack>
              </Paper>

              {/* Messages Area */}
              <Box sx={{ 
                flexGrow: 1, 
                overflowY: 'auto', 
                p: { xs: 1, sm: 2 }, 
                minHeight: 0 
              }}>
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
                      
                      <Tooltip title="Right-click for options">
                      <ChatBubble 
                        isOwn={message.isOwn} 
                        isSystem={message.type === 'system'}
                          onContextMenu={(e) => !message.type?.includes('system') && handleMessageMenu(e, message)}
                        >
                          <Box sx={{ cursor: 'context-menu' }}>
                            {/* Show reply reference */}
                            {message.replyTo && (
                              <Box sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                borderRadius: 1,
                                p: 1,
                                mb: 1,
                                borderLeft: `3px solid ${theme.palette.primary.main}`
                              }}>
                                <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                                  Replying to {message.replyTo.senderName}
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7, mt: 0.5 }}>
                                  {message.replyTo.content}
                                </Typography>
                              </Box>
                            )}
                            
                            {/* Message content based on type */}
                            {(message.type === 'file' && message.content.includes('Voice message')) ? (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                minWidth: 200,
                                mb: 1,
                              }}>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    console.log('Playing voice message:', message.fileUrl);
                                    
                                    // Stop any currently playing audio
                                    if (playingAudioId && playingAudioId !== message.id) {
                                      setPlayingAudioId(null);
                                    }
                                    
                                    // Toggle play/pause for same audio
                                    if (playingAudioId === message.id) {
                                      setPlayingAudioId(null);
                                      return;
                                    }
                                    
                                    // Play new audio
                                    setPlayingAudioId(message.id);
                                    const audio = new Audio(message.fileUrl);
                                    
                                    // Handle audio events
                                    audio.addEventListener('play', () => {
                                      console.log('Playing:', message.id);
                                      setPlayingAudioId(message.id);
                                    });
                                    
                                    audio.addEventListener('pause', () => {
                                      console.log('Paused:', message.id);
                                      setPlayingAudioId(null);
                                    });
                                    
                                    audio.addEventListener('ended', () => {
                                      console.log('Ended:', message.id);
                                      setPlayingAudioId(null);
                                    });
                                    
                                    audio.addEventListener('error', () => {
                                      console.log('Error:', message.id);
                                      setPlayingAudioId(null);
                                    });
                                    
                                    audio.play().catch(error => {
                                      console.error('Error playing audio:', error);
                                      setPlayingAudioId(null);
                                    });
                                  }}
                                  disabled={!message.fileUrl}
                                  sx={{
                                    backgroundColor: message.isOwn 
                                      ? 'rgba(255, 255, 255, 0.2)' 
                                      : theme.palette.primary.main,
                                    color: 'white',
                                    '&:hover': {
                                      backgroundColor: message.isOwn 
                                        ? 'rgba(255, 255, 255, 0.3)' 
                                        : theme.palette.primary.dark,
                                    },
                                    minWidth: 36,
                                    minHeight: 36,
                                  }}
                                >
                                  {playingAudioId === message.id ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
                                </IconButton>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {message.content}
                                </Typography>
                              </Box>
                            ) : message.type === 'image' ? (
                              <Box>
                                <img 
                                  src={message.fileUrl} 
                                  alt="Message" 
                                  style={{ 
                                    maxWidth: '100%', 
                                    height: 'auto', 
                                    borderRadius: 8,
                                    maxHeight: 300
                                  }} 
                                />
                                {message.content !== 'Image' && (
                                  <Typography variant="body2" sx={{ mt: 1 }}>
                                    {message.content}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                        <Typography variant="body2">
                          {message.content}
                        </Typography>
                            )}
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {formatTimestamp(message.timestamp)}
                          </Typography>
                          {message.isOwn && (
                            message.isRead ? <CheckCircle sx={{ fontSize: 16 }} /> : <CheckCircleOutline sx={{ fontSize: 16 }} />
                          )}
                              {!message.type?.includes('system') && (
                                <Tooltip title="Message options">
                                  <IconButton 
                                    size="small" 
                                    onClick={(e) => handleMessageMenu(e, message)}
                                    sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                                  >
                                    <MoreVert fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                        </Stack>
                          </Box>
                      </ChatBubble>
                      </Tooltip>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Stack>
              </Box>

              {/* Reply Indicator */}
              {replyingTo && (
                <Paper sx={{ p: 1, mx: 2, mb: 1, borderRadius: 2, bgcolor: 'grey.100' }}>
                  <Stack direction='row' justifyContent='space-between' alignItems='center'>
                    <Box>
                      <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                        Replying to {replyingTo.senderName}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.7 }}>
                        "{replyingTo.content}"
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={cancelReply}>
                      ✕
                    </IconButton>
                  </Stack>
                </Paper>
              )}

              {/* Voice Recording Preview */}
              {audioChunks.length > 0 && !isRecording && (
                <Paper sx={{ 
                  p: 2, 
                  mx: 2, 
                  mb: 1, 
                  borderRadius: 3, 
                  background: 'linear-gradient(45deg, #ffffff, #f8f9ff)',
                  border: '1px solid rgba(25, 118, 210, 0.2)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
              }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Fab
                      size="small"
                      onClick={isPlayingPreview ? 
                        () => {
                          if (audioPreviewRef.current) {
                            audioPreviewRef.current.pause();
                            audioPreviewRef.current.currentTime = 0;
                          }
                          setIsPlayingPreview(false);
                        } : 
                        () => {
                          console.log('Preview play button clicked:', 'audioPreviewUrl:', audioPreviewUrl);
                          if (!audioPreviewUrl) return;
                          if (audioPreviewRef.current) {
                            audioPreviewRef.current.pause();
                          }
                          const audio = new Audio(audioPreviewUrl);
                          audioPreviewRef.current = audio;
                          audio.addEventListener('play', () => setIsPlayingPreview(true));
                          audio.addEventListener('pause', () => setIsPlayingPreview(false));
                          audio.addEventListener('ended', () => setIsPlayingPreview(false));
                          audio.play().catch(error => {
                            console.error('Error playing preview:', error);
                            setIsPlayingPreview(false);
                          });
                        }
                      }
                      disabled={!audioPreviewUrl}
                      sx={{ 
                        background: isPlayingPreview 
                          ? 'linear-gradient(45deg, #f44336, #e53935)' 
                          : 'linear-gradient(45deg, #2196f3, #21cbf3)',
                        color: 'white',
                        animation: isPlayingPreview ? 'play-pulse 1s infinite' : 'none',
                        '@keyframes play-pulse': {
                          '0%': {
                            boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.7)',
                            transform: 'scale(1)'
                          },
                          '70%': {
                            boxShadow: '0 0 0 10px rgba(33, 150, 243, 0)',
                            transform: 'scale(1.1)'
                          },
                          '100%': {
                            boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)',
                            transform: 'scale(1)'
                          },
                        },
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }
                      }}
                    >
                      {isPlayingPreview ? <Pause /> : <PlayArrow />}
                    </Fab>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Mic sx={{ fontSize: 16, color: 'primary.main' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                          Voice Message
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Duration: {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                        {isPlayingPreview ? ' • Playing' : ' • Tap to preview'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      onClick={cancelRecording}
                      sx={{ borderRadius: 2 }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={sendVoiceMessage}
                      disabled={sendingMessage}
                      sx={{ 
                        borderRadius: 2,
                        background: 'linear-gradient(45deg, #4caf50, #45a049)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #388e3c, #2e7d32)'
                        }
                      }}
                    >
                      {sendingMessage ? 'Sending...' : 'Send'}
                    </Button>
                  </Stack>
                </Paper>
              )}

                    {/* File Preview */}
              {showFilePreview && selectedFile && (
                <Paper sx={{ 
                  p: 2, 
                  mx: 2, 
                  mb: 1, 
                  borderRadius: 2, 
                  bgcolor: 'grey.50'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {selectedFile.type.startsWith('image/') && filePreview && (
                      <Box>
                        <img 
                          src={filePreview} 
                          alt="Preview" 
                          style={{ 
                            width: 60, 
                            height: 60, 
                            objectFit: 'cover', 
                            borderRadius: 4 
                          }} 
                        />
                      </Box>
                    )}
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={cancelFileUpload}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => selectedFile && sendImageMessage(selectedFile)}
                        disabled={sendingMessage}
                          startIcon={selectedFile.type.startsWith('image/') ? <Image /> : <Mic />}
                      >
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </Button>
                    </Stack>
                  </Box>
                </Paper>
              )}

              {/* Message Input */}
              <Paper sx={{ 
                p: { xs: 2, sm: 2 }, 
                borderRadius: 0, 
                borderTop: 1, 
                borderColor: 'divider',
                position: 'sticky',
                bottom: 0,
                backgroundColor: 'background.paper',
                zIndex: 1
              }}>
                {/* Mobile Layout */}
                <Box sx={{ 
                  display: { xs: 'block', sm: 'none' }
                }}>
                  {/* Mobile: Input field */}
                  <TextField
                    fullWidth
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    multiline
                    maxRows={2}
                    sx={{
                      mb: 1,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        fontSize: '16px', // Prevents zoom on iOS
                        '& input': {
                          padding: { xs: '16px', sm: '14px' }
                        }
                      }
                    }}
                  />
                  
                  {/* Mobile: Action buttons */}
                  <Stack 
                    direction="row" 
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Stack direction="row" spacing={0.5}>
                      <IconButton 
                        size="large"
                        sx={{ 
                          p: 1.5,
                          minWidth: '48px',
                          minHeight: '48px'
                        }}
                        component="label"
                      >
                        <input
                          type="file"
                          hidden
                          accept="image/*,audio/*"
                          onChange={handleFileSelect}
                        />
                        <AttachFile fontSize="medium" />
                      </IconButton>
                      <IconButton 
                        size="large"
                        sx={{ 
                          p: 1.5,
                          minWidth: '48px',
                          minHeight: '48px'
                        }}
                      >
                        <EmojiEmotions fontSize="medium" />
                      </IconButton>
                  <IconButton 
                    size={isMobile ? "large" : "medium"} 
                    color={isRecording ? "error" : "primary"}
                    onClick={isRecording ? stopRecording : startRecording}
                    sx={{ 
                      backgroundColor: isRecording ? theme.palette.error.light : theme.palette.action.hover,
                      '&:hover': {
                        backgroundColor: isRecording ? theme.palette.error.main : theme.palette.action.selected,
                      }
                    }}
                  >
                    {isRecording ? <MicOff /> : <Mic />}
                  </IconButton>
                    </Stack>
                    
                    <Button
                      variant="contained"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      sx={{ 
                        borderRadius: 2,
                        minWidth: '48px',
                        minHeight: '48px',
                        px: 3,
                        py: 1
                      }}
                    >
                      {sendingMessage ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    </Button>
                  </Stack>
                </Box>

                {/* Desktop Layout */}
                <Stack 
                  direction="row" 
                  spacing={1} 
                  alignItems="flex-end"
                  sx={{ display: { xs: 'none', sm: 'flex' } }}
                >
                  <IconButton size="medium" component="label">
                    <input
                      type="file"
                      hidden
                      accept="image/*,audio/*"
                      onChange={handleFileSelect}
                    />
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
                  <IconButton 
                    size="medium" 
                    color={isRecording ? "error" : "primary"}
                    onClick={isRecording ? stopRecording : startRecording}
                    sx={{ 
                      backgroundColor: isRecording ? theme.palette.error.light : theme.palette.action.hover,
                      '&:hover': {
                        backgroundColor: isRecording ? theme.palette.error.main : theme.palette.action.selected,
                      }
                    }}
                  >
                    {isRecording ? <MicOff /> : <Mic />}
                  </IconButton>
                  <IconButton size="medium">
                    <EmojiEmotions />
                  </IconButton>
                  <Button
                    variant="contained"
                    startIcon={sendingMessage ? <CircularProgress size={20} /> : <Send />}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sendingMessage}
                    sx={{ 
                      borderRadius: 3,
                      minWidth: '80px',
                      px: 3
                    }}
                  >
                    {sendingMessage ? 'Sending...' : 'Send'}
                  </Button>
                </Stack>
              </Paper>

              {/* Voice Recording Interface (Job Portal Style) */}
              {isRecording && (
                <Box sx={{ 
                  p: 2, 
                  borderTop: 1, 
                  borderColor: 'divider',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(0,0,0,0.02)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      backgroundColor: theme.palette.error.main,
                      animation: 'pulse 1s infinite',
                      '@keyframes pulse': {
                        '0%': {
                          boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.7)',
                        },
                        '70%': {
                          boxShadow: '0 0 0 10px rgba(244, 67, 54, 0)',
                        },
                        '100%': {
                          boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)',
                        },
                      }
                    }} />
                    <Typography variant="body2" color="text.secondary" key={`recording-${recordingDuration}`}>
                      Recording... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={stopRecording}
                      startIcon={<Stop />}
                    >
                      Stop Recording
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={cancelRecording}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Voice Message Preview (Job Portal Style) */}
              {audioChunks.length > 0 && !isRecording && (
                <Box sx={{ 
                  p: 2, 
                  borderTop: 1, 
                  borderColor: 'divider',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(0,0,0,0.02)',
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Voice Message Ready ({Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')})
                    {audioPreviewUrl && (
                      <Chip 
                        label="Preview Available" 
                        size="small" 
                        color="success" 
                        sx={{ ml: 1, fontSize: '0.7rem' }}
                      />
                    )}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={isPlayingPreview ? 
                        () => {
                          if (audioPreviewRef.current) {
                            audioPreviewRef.current.pause();
                            audioPreviewRef.current.currentTime = 0;
                          }
                          setIsPlayingPreview(false);
                        } : 
                        () => {
                          console.log('Preview play button clicked:', 'audioPreviewUrl:', audioPreviewUrl);
                          if (!audioPreviewUrl) return;
                          if (audioPreviewRef.current) {
                            audioPreviewRef.current.pause();
                          }
                          const audio = new Audio(audioPreviewUrl);
                          audioPreviewRef.current = audio;
                          audio.addEventListener('play', () => setIsPlayingPreview(true));
                          audio.addEventListener('pause', () => setIsPlayingPreview(false));
                          audio.addEventListener('ended', () => setIsPlayingPreview(false));
                          audio.play().catch(error => {
                            console.error('Error playing preview:', error);
                            setIsPlayingPreview(false);
                          });
                        }
                      }
                      disabled={sendingVoiceMessage}
                      startIcon={isPlayingPreview ? <Pause /> : <PlayArrow />}
                      sx={{ minWidth: 'auto' }}
                    >
                      {isPlayingPreview ? 'Pause' : 'Preview'}
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={sendVoiceMessage}
                      disabled={sendingVoiceMessage}
                      startIcon={sendingVoiceMessage ? <CircularProgress size={16} /> : <Send />}
                    >
                      {sendingVoiceMessage ? 'Sending...' : 'Send Voice Message'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={cancelRecording}
                      disabled={sendingVoiceMessage}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </ChatContainer>
          ) : (
            <Box sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              p: 3,
              textAlign: 'center',
              minHeight: 0
            }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {isMobile ? 'Tap on a contact to start chatting' : 'Select a conversation to start chatting'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                Choose from your contacts or start a new conversation
                </Typography>
              {isMobile && (
                <Button
                  variant="contained"
                  onClick={() => setDrawerOpen(true)}
                  sx={{ mt: 2 }}
                  startIcon={<MenuIcon />}
                >
                  Open Contacts
                </Button>
              )}
              </Box>
          )}
        </Box>
      </Box>

      {/* User Search Modal */}
      {showUserSearch && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
          onClick={() => setShowUserSearch(false)}
        >
          <Card
            sx={{
              width: { xs: '95vw', sm: '400px' },
              maxWidth: { xs: '95vw', sm: '400px' },
              maxHeight: { xs: '90vh', sm: '80vh' },
              height: { xs: '85vh', sm: 'auto' },
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                  Start New Chat
                </Typography>
                <IconButton onClick={() => setShowUserSearch(false)}>
                  ✕
                </IconButton>
              </Stack>
              
              <TextField
                fullWidth
                placeholder="Search users by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={{ mt: 2 }}
              />
            </CardContent>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', maxHeight: '400px' }}>
              {loadingUsers ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">Loading users...</Typography>
                </Box>
              ) : filteredUsers.length > 0 ? (
                <>
                  <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                    </Typography>
                  </Box>
                  <List sx={{ p: 0 }}>
                    {filteredUsers.map((userToChat) => (
                      <ListItem key={userToChat._id} sx={{ px: 2 }}>
                        <Card sx={{ width: '100%', cursor: 'pointer' }} onClick={() => handleStartConversation(userToChat)}>
                          <CardContent sx={{ p: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Avatar src={userToChat.profilePicture}>
                                {userToChat.firstName[0]}{userToChat.lastName[0]}
                              </Avatar>
                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                  {userToChat.firstName} {userToChat.lastName}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {userToChat.email}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                  <Chip
                                    label={userToChat.role}
                                    size="small"
                                    color={userToChat.role === 'teacher' ? 'primary' : 'default'}
                                    variant="outlined"
                                  />
                                  {userToChat.company && (
                                    <Chip
                                      label={userToChat.company}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Stack>
                              </Box>
                              {userToChat.isOnline && (
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: 'success.main'
                                  }}
                                />
                              )}
                            </Stack>
                          </CardContent>
            </Card>
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">No users found matching "{searchQuery}"</Typography>
                </Box>
              )}
            </Box>
          </Card>
        </div>
      )}

      {/* Message Context Menu */}
      <Menu
        anchorEl={messageMenuAnchor.element}
        open={Boolean(messageMenuAnchor.element)}
        onClose={closeMessageMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={handleReply}>
          <Reply fontSize="small" sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        <MenuItem onClick={handleCopyMessage}>
          <CopyAll fontSize="small" sx={{ mr: 1 }} />
          Copy Text
        </MenuItem>
        <MenuItem onClick={handleDeleteMessage} disabled={!messageMenuAnchor.message?.isOwn} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Message
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default CommunityChat;

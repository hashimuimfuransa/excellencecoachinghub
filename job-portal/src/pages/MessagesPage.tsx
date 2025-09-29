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
  Tabs,
  Tab,
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
  Image,
  Mic,
  Stop,
  PlayArrow,
  Pause,
  Close,
  Person,
  Message,
  Delete,
  Reply,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatRoom, ChatMessage } from '../types/chat';
import { chatService } from '../services/chatService';
import { realTimeNotificationService } from '../services/realTimeNotificationService';
import { useAuth } from '../contexts/AuthContext';

const MessagesPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Add CSS animation for recording pulse
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.5; }
        100% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
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
  const [chatListTab, setChatListTab] = useState(0); // 0: Conversations, 1: Browse Users
  const [allUsersForChat, setAllUsersForChat] = useState<any[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [usersOffset, setUsersOffset] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});
  const [selectedMessageForMenu, setSelectedMessageForMenu] = useState<ChatMessage | null>(null);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadChatRooms();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // Initialize real-time messaging
    if (user?._id) {
      chatService.initializeSocket(user._id);
      
      // Listen for real-time messages
      chatService.on('new-message', handleNewMessage);
      chatService.on('chat-unread-updated', handleUnreadUpdate);
      chatService.on('user-online', handleUserOnline);
      chatService.on('user-offline', handleUserOffline);
      chatService.on('typing', handleTypingIndicator);
      
      return () => {
        chatService.off('new-message', handleNewMessage);
        chatService.off('chat-unread-updated', handleUnreadUpdate);
        chatService.off('user-online', handleUserOnline);
        chatService.off('user-offline', handleUserOffline);
        chatService.off('typing', handleTypingIndicator);
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
    console.log('New message received:', data);
    
    // Update messages if this is the selected room
    if (selectedRoom && selectedRoom._id === chatId) {
      setMessages(prev => {
        const exists = prev.some(m => m._id === message._id);
        return exists ? prev : [...prev, message];
      });
      
      // Auto-scroll to bottom
      setTimeout(() => {
        const messagesContainer = document.getElementById('messages-container');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
      }, 100);
    }
    
    // Update chat room's last message
    setChatRooms(prev => 
      prev.map(room => 
        room._id === chatId 
          ? { 
              ...room, 
              lastMessage: message, 
              updatedAt: message.createdAt,
              unreadCount: room._id === selectedRoom?._id ? 0 : (room.unreadCount || 0) + 1
            }
          : room
      )
    );
    
    // Show notification if message is not from current user and chat is not selected
    if (message.sender._id !== user?._id && chatId !== selectedRoom?._id) {
      showNotification(message);
    }
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

  // Handle typing indicator
  const handleTypingIndicator = (data: { chatId: string; userId: string; isTyping: boolean }) => {
    if (data.chatId !== selectedRoom?._id || data.userId === user?._id) return;
    
    setTypingUsers(prev => {
      const newSet = new Set(prev);
      if (data.isTyping) {
        newSet.add(data.userId);
      } else {
        newSet.delete(data.userId);
      }
      return newSet;
    });
  };

  // Show notification for new messages
  const showNotification = (message: ChatMessage) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(`New message from ${message.sender.firstName} ${message.sender.lastName}`, {
        body: message.content,
        icon: message.sender.profilePicture || '/default-avatar.png',
        tag: message.chat,
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  };

  // Handle typing change
  const handleTypingChange = (value: string) => {
    if (!selectedRoom || !user) return;
    
    const isCurrentlyTyping = value.length > 0;
    
    if (isCurrentlyTyping && !isTyping) {
      setIsTyping(true);
      chatService.sendTypingIndicator(selectedRoom._id, user._id, true);
    } else if (!isCurrentlyTyping && isTyping) {
      setIsTyping(false);
      chatService.sendTypingIndicator(selectedRoom._id, user._id, false);
    }
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing indicator
    if (isCurrentlyTyping) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
        chatService.sendTypingIndicator(selectedRoom._id, user._id, false);
      }, 2000); // Stop typing indicator after 2 seconds of inactivity
      
      setTypingTimeout(timeout);
    }
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

  // Cleanup recording interval on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // Load all users when Browse Users tab is selected in chat dialog
  useEffect(() => {
    if (showChatList && chatListTab === 1 && allUsersForChat.length === 0) {
      loadAllUsersForChat();
    }
  }, [showChatList, chatListTab]);

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
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      chatService.sendTypingIndicator(selectedRoom._id, user._id, false);
    }
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

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

  // File upload functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...imageFiles]);
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFiles.length || !selectedRoom || uploadingFiles) return;

    setUploadingFiles(true);
    
    try {
      for (const file of selectedFiles) {
        // Upload file
        const uploadResult = await chatService.uploadChatFile(file);
        
        // Send message with image
        await chatService.sendMessage(selectedRoom._id, {
          content: `📷 ${file.name}`,
          messageType: 'image',
          fileUrl: uploadResult.fileUrl,
          fileName: uploadResult.fileName
        });
      }
      
      setSelectedFiles([]);
      
      // Reload messages to show the new image messages
      loadMessages(selectedRoom._id);
      
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      setMediaRecorder(recorder);
      setAudioChunks([]);
      setIsRecording(true);
      setRecordingDuration(0);
      
      // Store chunks in a local variable for better access
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        
        // Create preview URL after recording stops
        setTimeout(() => {
          if (chunks.length > 0) {
            const audioBlob = new Blob(chunks, { type: 'audio/webm' });
            const previewUrl = URL.createObjectURL(audioBlob);
            setAudioPreviewUrl(previewUrl);
            console.log('Preview URL created:', previewUrl);
            console.log('Audio blob size:', audioBlob.size);
          } else {
            console.log('No audio chunks available for preview');
          }
        }, 200); // Increased delay to ensure chunks are ready
      };
      
      recorder.start();
      
      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
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
      
      // Backup: Create preview URL immediately if not created in onstop
      setTimeout(() => {
        if (!audioPreviewUrl && audioChunks.length > 0) {
          console.log('Creating backup preview URL');
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          const previewUrl = URL.createObjectURL(audioBlob);
          setAudioPreviewUrl(previewUrl);
          console.log('Backup preview URL created:', previewUrl);
        }
      }, 500);
    }
  };

  const sendVoiceMessage = async () => {
    if (!audioChunks.length || !selectedRoom || sendingVoiceMessage) return;

    try {
      setSendingVoiceMessage(true);
      
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' });
      
      // Upload voice file
      const uploadResult = await chatService.uploadChatFile(audioFile);
      
      // Send voice message
      await chatService.sendMessage(selectedRoom._id, {
        content: `🎤 Voice message (${Math.floor(recordingDuration / 60)}:${(recordingDuration % 60).toString().padStart(2, '0')})`,
        messageType: 'file',
        fileUrl: uploadResult.fileUrl,
        fileName: uploadResult.fileName
      });
      
      // Reset recording state
      setAudioChunks([]);
      setRecordingDuration(0);
      
      // Clean up preview URL
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
      }
      
      // Clean up audio reference
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      setIsPlayingPreview(false);
      
      // Reload messages
      loadMessages(selectedRoom._id);
      
    } catch (error) {
      console.error('Error sending voice message:', error);
    } finally {
      setSendingVoiceMessage(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
    
    // Reset recording state
    setAudioChunks([]);
    setRecordingDuration(0);
    
    // Clean up preview URL
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    
    // Clean up audio reference
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  // Voice preview functions
  const playPreview = () => {
    console.log('Play preview clicked');
    console.log('Audio preview URL:', audioPreviewUrl);
    console.log('Audio chunks length:', audioChunks.length);
    
    if (audioPreviewUrl) {
      // Stop any existing audio
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current.currentTime = 0;
      }
      
      // Create new audio element
      const audio = new Audio(audioPreviewUrl);
      audioPreviewRef.current = audio;
      
      audio.onplay = () => {
        console.log('Audio started playing');
        setIsPlayingPreview(true);
      };
      audio.onended = () => {
        console.log('Audio ended');
        setIsPlayingPreview(false);
      };
      audio.onerror = (error) => {
        console.error('Audio error:', error);
        setIsPlayingPreview(false);
      };
      audio.onpause = () => {
        console.log('Audio paused');
        setIsPlayingPreview(false);
      };
      
      audio.play().catch(error => {
        console.error('Error playing preview:', error);
        setIsPlayingPreview(false);
      });
    } else {
      console.log('No preview URL available');
      // Try to create preview URL from current chunks
      if (audioChunks.length > 0) {
        console.log('Creating preview URL from chunks');
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(previewUrl);
        
        // Try playing again
        setTimeout(() => {
          const audio = new Audio(previewUrl);
          audioPreviewRef.current = audio;
          audio.onplay = () => setIsPlayingPreview(true);
          audio.onended = () => setIsPlayingPreview(false);
          audio.onerror = () => setIsPlayingPreview(false);
          audio.play().catch(error => {
            console.error('Error playing preview after creating URL:', error);
            setIsPlayingPreview(false);
          });
        }, 100);
      }
    }
  };

  const stopPreview = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
    }
    setIsPlayingPreview(false);
  };

  // Message menu handlers
  const handleMessageMenuOpen = (event: React.MouseEvent<HTMLElement>, message: ChatMessage) => {
    event.stopPropagation();
    setMessageMenuAnchor(prev => ({
      ...prev,
      [message._id]: event.currentTarget
    }));
    setSelectedMessageForMenu(message);
  };

  const handleMessageMenuClose = (messageId: string) => {
    setMessageMenuAnchor(prev => ({
      ...prev,
      [messageId]: null
    }));
    setSelectedMessageForMenu(null);
  };

  const handleMenuReply = (message: ChatMessage) => {
    handleMessageMenuClose(message._id);
    handleReplyToMessage(message);
  };


  // Message actions
  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedRoom || !user) return;
    
    try {
      setDeletingMessageId(messageId);
      await chatService.deleteMessage(selectedRoom._id, messageId);
      
      // Remove message from local state
      setMessages(prev => prev.filter(msg => msg._id !== messageId));
      
      // Update last message if this was the last message
      setChatRooms(prev => 
        prev.map(room => 
          room._id === selectedRoom._id 
            ? { 
                ...room, 
                lastMessage: room.lastMessage?._id === messageId ? null : room.lastMessage,
                updatedAt: new Date().toISOString()
              }
            : room
        )
      );
      
      // Close confirmation dialog
      setDeleteConfirmOpen(false);
      setMessageToDelete(null);
      
    } catch (error) {
      console.error('Error deleting message:', error);
    } finally {
      setDeletingMessageId(null);
    }
  };

  const handleDeleteClick = (message: ChatMessage) => {
    setMessageToDelete(message);
    setDeleteConfirmOpen(true);
    handleMessageMenuClose(message._id);
  };

  const handleReplyToMessage = (message: ChatMessage) => {
    setReplyingTo(message);
    setReplyText(`Replying to ${message.sender.firstName}: `);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyText('');
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedRoom || !user || !replyingTo) return;

    const messageContent = replyText.trim();
    setReplyText('');
    setReplyingTo(null);
    
    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      chatService.sendTypingIndicator(selectedRoom._id, user._id, false);
    }
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    try {
      const message = await chatService.sendMessage(selectedRoom._id, { 
        content: messageContent,
        replyTo: replyingTo._id
      });
      
      // Add message to UI
      setMessages(prev => {
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
      console.error('Error sending reply:', error);
      // Restore the reply text if sending failed
      setReplyText(messageContent);
      setReplyingTo(replyingTo);
    }
  };

  // Profile viewing functionality
  const handleViewProfile = (user: any) => {
    // Navigate to appropriate profile based on user role
    if (user.role === 'employer' || user.userType === 'employer') {
      navigate(`/app/employer/profile`, { state: { userId: user._id } });
    } else {
      navigate(`/app/profile/view/${user._id}`);
    }
  };

  // Load all users for chat dialog
  const loadAllUsersForChat = async (loadMore: boolean = false) => {
    try {
      setAllUsersLoading(true);
      
      if (loadMore) {
        // For now, just reload all users since backend pagination might not work
        const result = await chatService.getAllUsers(200, 0);
        setAllUsersForChat(result.users);
        setHasMoreUsers(false); // Disable load more for now
      } else {
        // Load initial users
        const result = await chatService.getAllUsers(200, 0);
        setAllUsersForChat(result.users);
        setHasMoreUsers(false); // Disable load more for now
        setTotalUsers(result.users.length);
      }
    } catch (error) {
      console.error('Error loading all users:', error);
      // Fallback to search with empty query
      try {
        const users = await chatService.searchUsers('', 'all', 200, 0);
        setAllUsersForChat(users);
        setTotalUsers(users.length);
        setHasMoreUsers(false);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setAllUsersLoading(false);
    }
  };

  // Search users for chat dialog
  const searchUsersForChatDialog = async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }

    try {
      setUserSearchLoading(true);
      const results = await chatService.searchUsers(query, 'all', 200, 0); // Increased limit for search
      setUserSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setUserSearchLoading(false);
    }
  };

  // Handle user search input change for chat dialog
  const handleUserSearchChangeDialog = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setUserSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsersForChatDialog(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Start chat with user from dialog
  const handleStartChatFromDialog = async (userId: string, userName: string) => {
    try {
      // Create or get existing chat with the user
      const chat = await chatService.createOrGetChat([userId]);
      
      // Reload chat rooms to include the new/existing chat
      const updatedRooms = await chatService.getChats();
      setChatRooms(updatedRooms);
      
      // Find and select the chat room
      const targetRoom = updatedRooms.find(room => room._id === chat._id);
      if (targetRoom) {
        setSelectedRoom(targetRoom);
        setShowChatList(false);
        if (targetRoom._id) {
          loadMessages(targetRoom._id);
        }
      }
    } catch (error) {
      console.error('Error starting chat with user:', error);
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
    <>
      <style>
        {`
          @keyframes typing {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: 0.4;
            }
            30% {
              transform: translateY(-10px);
              opacity: 1;
            }
          }
        `}
      </style>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper sx={{ 
            height: { xs: 'calc(100vh - 200px)', sm: 'calc(100vh - 180px)', md: 'calc(100% - 80px)' }, 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: { xs: 2, sm: 3, md: 4 },
            overflow: 'hidden',
            boxShadow: theme.palette.mode === 'dark' 
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(0, 0, 0, 0.1)',
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
          }}>
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Box sx={{ 
                  p: { xs: 1.5, sm: 2, md: 2.5 }, 
                  borderBottom: 1, 
                  borderColor: 'divider',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(0, 0, 0, 0.02) 0%, rgba(0, 0, 0, 0.01) 100%)',
                  backdropFilter: 'blur(10px)',
                  flexShrink: 0,
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: `linear-gradient(90deg, transparent 0%, ${theme.palette.primary.main} 50%, transparent 100%)`,
                    opacity: 0.3
                  }
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
                      sx={{
                        '& .MuiBadge-badge': {
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          border: `2px solid ${theme.palette.background.paper}`,
                          animation: getOtherParticipant(selectedRoom)?.isOnline ? 'pulse 2s infinite' : 'none'
                        }
                      }}
                    >
                      <Avatar 
                        src={getOtherParticipant(selectedRoom)?.profilePicture}
                        sx={{ 
                          width: { xs: 40, sm: 48, md: 56 }, 
                          height: { xs: 40, sm: 48, md: 56 },
                          flexShrink: 0,
                          border: `3px solid ${theme.palette.primary.main}`,
                          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.05)',
                            boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.4)}`
                          }
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
                    gap: { xs: 0.5, sm: 1, md: 1.5 },
                    flexShrink: 0
                  }}>
                    <IconButton 
                      color="primary" 
                      title="Voice Call"
                      size="small"
                      sx={{ 
                        display: { xs: 'none', md: 'inline-flex' },
                        p: { sm: 0.75, md: 1 },
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
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
                        p: { sm: 0.75, md: 1 },
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <VideoCall fontSize="small" />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      title="Switch Conversation"
                      onClick={() => setShowChatList(true)}
                      size="small"
                      sx={{ 
                        p: { xs: 0.75, sm: 1, md: 1.25 },
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Search fontSize="small" />
                    </IconButton>
                    <IconButton 
                      color="primary" 
                      title="View Profile"
                      onClick={() => handleViewProfile(getOtherParticipant(selectedRoom))}
                      size="small"
                      sx={{ 
                        p: { xs: 0.75, sm: 1, md: 1.25 },
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.2),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Person fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small"
                      sx={{ 
                        p: { xs: 0.75, sm: 1, md: 1.25 },
                        backgroundColor: alpha(theme.palette.grey[500], 0.1),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.grey[500], 0.2),
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                </Box>
              </motion.div>

              {/* Messages */}
              <Box sx={{ 
                flexGrow: 1, 
                overflow: 'auto', 
                p: { xs: 1.5, sm: 2, md: 2.5 },
                minHeight: 0, // Important for proper scrolling
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.02) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(0, 0, 0, 0.01) 0%, transparent 100%)',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '20px',
                  background: `linear-gradient(180deg, ${theme.palette.background.paper} 0%, transparent 100%)`,
                  zIndex: 1,
                  pointerEvents: 'none'
                }
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
                      messages.map((message, index) => {
                        const isSentByUser = message.sender._id === user?._id;
                        return (
                          <motion.div
                            key={message._id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ 
                              duration: 0.3, 
                              delay: index * 0.05,
                              ease: "easeOut"
                            }}
                          >
                            <Box
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
                                {/* Image Message */}
                                {message.messageType === 'image' && message.fileUrl && (
                                  <Box sx={{ mb: 1 }}>
                                    <img
                                      src={message.fileUrl}
                                      alt={message.fileName || 'Image'}
                                      style={{
                                        maxWidth: '100%',
                                        maxHeight: '300px',
                                        borderRadius: '8px',
                                        objectFit: 'cover',
                                        cursor: 'pointer'
                                      }}
                                      onClick={() => window.open(message.fileUrl, '_blank')}
                                    />
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        opacity: 0.8,
                                        mt: 0.5,
                                        fontStyle: 'italic'
                                      }}
                                    >
                                      {message.fileName}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Voice Message */}
                                {message.messageType === 'file' && message.fileUrl && message.content.includes('Voice message') && (
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1,
                                    mb: 1,
                                    p: 1,
                                    borderRadius: 1,
                                    backgroundColor: isSentByUser 
                                      ? 'rgba(255, 255, 255, 0.1)' 
                                      : 'rgba(0, 0, 0, 0.05)'
                                  }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        const audio = new Audio(message.fileUrl);
                                        audio.play();
                                      }}
                                      sx={{
                                        backgroundColor: isSentByUser 
                                          ? 'rgba(255, 255, 255, 0.2)' 
                                          : theme.palette.primary.main,
                                        color: isSentByUser ? 'white' : 'white',
                                        '&:hover': {
                                          backgroundColor: isSentByUser 
                                            ? 'rgba(255, 255, 255, 0.3)' 
                                            : theme.palette.primary.dark,
                                        }
                                      }}
                                    >
                                      <PlayArrow />
                                    </IconButton>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                        opacity: 0.9
                                      }}
                                    >
                                      Voice Message
                                    </Typography>
                                  </Box>
                                )}

                                {/* Reply Preview */}
                                {message.replyTo && (
                                  <Box sx={{ 
                                    mb: 1,
                                    p: 1.5,
                                    backgroundColor: isSentByUser 
                                      ? 'rgba(255, 255, 255, 0.1)' 
                                      : 'rgba(0, 0, 0, 0.05)',
                                    borderRadius: 1,
                                    borderLeft: `3px solid ${isSentByUser ? 'rgba(255, 255, 255, 0.5)' : theme.palette.primary.main}`,
                                    maxWidth: '100%',
                                  }}>
                                    <Typography variant="caption" sx={{ 
                                      color: isSentByUser ? 'rgba(255, 255, 255, 0.8)' : theme.palette.text.secondary,
                                      fontWeight: 500,
                                      display: 'block',
                                      mb: 0.5
                                    }}>
                                      Replying to {message.replyTo.sender?.firstName} {message.replyTo.sender?.lastName}
                                    </Typography>
                                    <Typography variant="body2" sx={{ 
                                      color: isSentByUser ? 'rgba(255, 255, 255, 0.7)' : theme.palette.text.secondary,
                                      fontStyle: 'italic',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                    }}>
                                      {message.replyTo.content}
                                    </Typography>
                                  </Box>
                                )}

                                {/* Text Content */}
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

                              {/* Message Actions */}
                              <Box sx={{ 
                                display: 'flex', 
                                gap: 0.5, 
                                mt: 0.5,
                                justifyContent: isSentByUser ? 'flex-end' : 'flex-start',
                                opacity: 1, // Always visible
                                transition: 'opacity 0.2s ease',
                              }}>
                                {/* Three-dot menu */}
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMessageMenuOpen(e, message)}
                                  sx={{ 
                                    p: 0.5,
                                    opacity: 0.6, // Slightly transparent when not hovered
                                    transition: 'opacity 0.2s ease',
                                    '&:hover': {
                                      backgroundColor: theme.palette.action.hover,
                                      opacity: 1, // Fully opaque on hover
                                    }
                                  }}
                                >
                                  <MoreVert sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            </Box>

                            {/* Avatar placeholder for sent messages to keep alignment */}
                            {isSentByUser && (
                              <Box sx={{ width: { xs: 28, sm: 32, md: 36 }, flexShrink: 0 }} />
                            )}
                          </Box>
                          </motion.div>
                        );
                      })
                    )}
                    
                    {/* Typing Indicator */}
                    {typingUsers.size > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 2,
                            py: 1,
                            mb: 1,
                          }}
                        >
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {Array.from(typingUsers).map((userId) => {
                              const participant = selectedRoom?.participants.find(p => p._id === userId);
                              return (
                                <Box key={userId} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                                    {participant?.firstName} is typing
                                  </Typography>
                                  <Box sx={{ display: 'flex', gap: 0.25 }}>
                                    <Box
                                      sx={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        backgroundColor: theme.palette.primary.main,
                                        animation: 'typing 1.4s infinite ease-in-out',
                                        '&:nth-of-type(1)': { animationDelay: '0s' },
                                        '&:nth-of-type(2)': { animationDelay: '0.2s' },
                                        '&:nth-of-type(3)': { animationDelay: '0.4s' },
                                      }}
                                    />
                                    <Box
                                      sx={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        backgroundColor: theme.palette.primary.main,
                                        animation: 'typing 1.4s infinite ease-in-out',
                                        animationDelay: '0.2s',
                                      }}
                                    />
                                    <Box
                                      sx={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: '50%',
                                        backgroundColor: theme.palette.primary.main,
                                        animation: 'typing 1.4s infinite ease-in-out',
                                        animationDelay: '0.4s',
                                      }}
                                    />
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </Box>

              {/* Message Actions Menu */}
              {selectedMessageForMenu && (
                <Menu
                  anchorEl={messageMenuAnchor[selectedMessageForMenu._id]}
                  open={Boolean(messageMenuAnchor[selectedMessageForMenu._id])}
                  onClose={() => handleMessageMenuClose(selectedMessageForMenu._id)}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                  PaperProps={{
                    sx: {
                      borderRadius: 2,
                      minWidth: 120,
                      boxShadow: theme.shadows[8],
                    }
                  }}
                >
                  <MenuItem 
                    onClick={() => handleMenuReply(selectedMessageForMenu)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 1,
                      px: 2,
                    }}
                  >
                    <Reply sx={{ fontSize: 18 }} />
                    <Typography variant="body2">Reply</Typography>
                  </MenuItem>
                  
                  {selectedMessageForMenu.sender._id === user?._id && (
                    <MenuItem 
                      onClick={() => handleDeleteClick(selectedMessageForMenu)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        py: 1,
                        px: 2,
                        color: theme.palette.error.main,
                        '&:hover': {
                          backgroundColor: theme.palette.error.light + '10',
                        }
                      }}
                    >
                      <Delete sx={{ fontSize: 18 }} />
                      <Typography variant="body2">Delete</Typography>
                    </MenuItem>
                  )}
                </Menu>
              )}

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <Box sx={{ 
                  p: 2, 
                  borderTop: 1, 
                  borderColor: 'divider',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(0,0,0,0.02)',
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Selected Images ({selectedFiles.length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedFiles.map((file, index) => (
                      <Box key={index} sx={{ position: 'relative' }}>
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: `2px solid ${theme.palette.primary.main}`
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => removeSelectedFile(index)}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            backgroundColor: theme.palette.error.main,
                            color: 'white',
                            width: 20,
                            height: 20,
                            '&:hover': {
                              backgroundColor: theme.palette.error.dark,
                            }
                          }}
                        >
                          <Close sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleFileUpload}
                      disabled={uploadingFiles}
                      startIcon={uploadingFiles ? <CircularProgress size={16} /> : <Send />}
                    >
                      {uploadingFiles ? 'Uploading...' : 'Send Images'}
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => setSelectedFiles([])}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Voice Recording Interface */}
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
                      animation: 'pulse 1s infinite'
                    }} />
                    <Typography variant="body2" color="text.secondary">
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

              {/* Voice Message Preview */}
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
                      onClick={isPlayingPreview ? stopPreview : playPreview}
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

              {/* Reply Preview */}
              {replyingTo && (
                <Box sx={{ 
                  p: 2, 
                  borderTop: 1, 
                  borderColor: 'divider',
                  background: theme.palette.mode === 'dark' 
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(0,0,0,0.02)',
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    p: 1.5,
                    borderRadius: 1,
                    backgroundColor: theme.palette.primary.main + '10',
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                  }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="primary" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Replying to {replyingTo.sender.firstName}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: '300px'
                        }}
                      >
                        {replyingTo.content}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={handleCancelReply}
                      sx={{ ml: 1 }}
                    >
                      <Close sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>
              )}

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
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                  />
                  
                  <IconButton 
                    size={isMobile ? "small" : "medium"} 
                    color="primary"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ 
                      backgroundColor: theme.palette.action.hover,
                      '&:hover': {
                        backgroundColor: theme.palette.action.selected,
                      }
                    }}
                  >
                    <Image />
                  </IconButton>
                  
                  <IconButton 
                    size={isMobile ? "small" : "medium"} 
                    color={isRecording ? "error" : "primary"}
                    onClick={isRecording ? stopRecording : startRecording}
                    sx={{ 
                      backgroundColor: isRecording ? theme.palette.error.light : theme.palette.action.hover,
                      '&:hover': {
                        backgroundColor: isRecording ? theme.palette.error.main : theme.palette.action.selected,
                      }
                    }}
                  >
                    {isRecording ? <Stop /> : <Mic />}
                  </IconButton>
                  
                  <TextField
                    fullWidth
                    multiline
                    maxRows={isMobile ? 3 : 4}
                    placeholder={replyingTo ? "Reply..." : (isMobile ? "Message..." : "Type a message...")}
                    value={replyingTo ? replyText : newMessage}
                    onChange={(e) => {
                      if (replyingTo) {
                        setReplyText(e.target.value);
                      } else {
                        setNewMessage(e.target.value);
                        handleTypingChange(e.target.value);
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        replyingTo ? handleSendReply() : handleSendMessage();
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
                    onClick={replyingTo ? handleSendReply : handleSendMessage}
                    disabled={replyingTo ? !replyText.trim() : !newMessage.trim()}
                    size={isMobile ? "medium" : "large"}
                    sx={{ 
                      backgroundColor: (replyingTo ? replyText.trim() : newMessage.trim()) ? theme.palette.primary.main : theme.palette.action.disabledBackground,
                      color: (replyingTo ? replyText.trim() : newMessage.trim()) ? 'white' : theme.palette.action.disabled,
                      width: { xs: 44, sm: 48 },
                      height: { xs: 44, sm: 48 },
                      minWidth: 'auto',
                      '&:hover': {
                        backgroundColor: (replyingTo ? replyText.trim() : newMessage.trim()) ? theme.palette.primary.dark : theme.palette.action.disabledBackground,
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
        </motion.div>

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
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0 }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
              <Tabs 
                value={chatListTab} 
                onChange={(e, newValue) => setChatListTab(newValue)}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    minHeight: 48,
                  }
                }}
              >
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Message />
                      Conversations ({filteredRooms.length})
                    </Box>
                  } 
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person />
                      Browse Users ({allUsersForChat.length})
                    </Box>
                  } 
                />
              </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{ p: 2 }}>
              {chatListTab === 0 ? (
                // Conversations Tab
                <>
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
                </>
              ) : (
                // Browse Users Tab
                <>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search users by name, company, or role..."
                    value={userSearchQuery}
                    onChange={handleUserSearchChangeDialog}
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
                    }}
                  />

                  {/* Search Results */}
                  {userSearchQuery && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Search Results ({userSearchResults.length})
                      </Typography>
                      
                      {userSearchLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                          <CircularProgress />
                        </Box>
                      ) : userSearchResults.length > 0 ? (
                        <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                          {userSearchResults.map((user) => (
                            <ListItem
                              key={user._id}
                              sx={{
                                borderRadius: '12px',
                                mb: 1,
                                cursor: 'pointer',
                                '&:hover': {
                                  backgroundColor: theme.palette.action.hover,
                                },
                              }}
                            >
                              <ListItemAvatar>
                                <Badge
                                  color="success"
                                  variant="dot"
                                  invisible={!user.isOnline}
                                >
                                  <Avatar src={user.profilePicture}>
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                  </Avatar>
                                </Badge>
                              </ListItemAvatar>
                              <ListItemText
                                primary={`${user.firstName} ${user.lastName}`}
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {user.title || user.role}
                                    </Typography>
                                    {user.company && (
                                      <Typography variant="caption" color="text.secondary">
                                        {user.company}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStartChatFromDialog(user._id, `${user.firstName} ${user.lastName}`)}
                                sx={{ ml: 1 }}
                              >
                                Chat
                              </Button>
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                          <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                            No users found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Try a different search term or browse all users below.
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  )}

                  {/* All Users */}
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        All Users ({allUsersForChat.length} of {totalUsers})
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Refresh />}
                          onClick={() => loadAllUsersForChat(false)}
                          disabled={allUsersLoading}
                        >
                          Refresh
                        </Button>
                        {hasMoreUsers && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => loadAllUsersForChat(true)}
                            disabled={allUsersLoading}
                          >
                            Load More
                          </Button>
                        )}
                      </Box>
                    </Box>
                    
                    {allUsersLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : allUsersForChat.length > 0 ? (
                      <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
                        {allUsersForChat.map((user) => (
                          <ListItem
                            key={user._id}
                            sx={{
                              borderRadius: '12px',
                              mb: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Badge
                                color="success"
                                variant="dot"
                                invisible={!user.isOnline}
                              >
                                <Avatar src={user.profilePicture}>
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </Avatar>
                              </Badge>
                            </ListItemAvatar>
                            <ListItemText
                              primary={`${user.firstName} ${user.lastName}`}
                              secondary={
                                <Box>
                                  <Typography variant="body2" color="text.secondary">
                                    {user.title || user.role}
                                  </Typography>
                                  {user.company && (
                                    <Typography variant="caption" color="text.secondary">
                                      {user.company}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleStartChatFromDialog(user._id, `${user.firstName} ${user.lastName}`)}
                              sx={{ ml: 1 }}
                            >
                              Chat
                            </Button>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Box sx={{ p: 3, textAlign: 'center' }}>
                        <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                          No users available
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Click refresh to load users from the platform.
                        </Typography>
                        <Button
                          variant="contained"
                          startIcon={<Refresh />}
                          onClick={loadAllUsersForChat}
                          disabled={allUsersLoading}
                        >
                          Load Users
                        </Button>
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </Box>
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            p: 2,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Delete Message
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pb: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete this message? This action cannot be undone.
          </Typography>
          
          {messageToDelete && (
            <Box sx={{ 
              p: 2, 
              backgroundColor: theme.palette.grey[50], 
              borderRadius: 1,
              border: `1px solid ${theme.palette.grey[200]}`,
              mb: 2
            }}>
              <Typography variant="body2" sx={{ fontStyle: 'italic', color: theme.palette.text.secondary }}>
                "{messageToDelete.content}"
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions sx={{ pt: 1, gap: 1 }}>
          <Button
            onClick={() => setDeleteConfirmOpen(false)}
            variant="outlined"
            disabled={deletingMessageId !== null}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (messageToDelete) {
                handleDeleteMessage(messageToDelete._id);
              }
            }}
            variant="contained"
            color="error"
            disabled={deletingMessageId !== null}
            startIcon={deletingMessageId ? <CircularProgress size={16} /> : <Delete />}
            sx={{ borderRadius: 2 }}
          >
            {deletingMessageId ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </>
  );
};

export default MessagesPage;
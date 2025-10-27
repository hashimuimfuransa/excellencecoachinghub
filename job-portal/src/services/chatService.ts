import { api, apiGet, apiPost, apiPut, apiDelete } from './api';
import { io, Socket } from 'socket.io-client';

export interface ChatUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: string;
  role: 'job_seeker' | 'employer' | 'admin';
  company?: string;
  title?: string;
  location?: string;
}

export interface Message {
  _id: string;
  chat: string;
  sender: ChatUser;
  content: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readBy: string[];
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
}

export interface ChatRoom {
  _id: string;
  participants: ChatUser[];
  lastMessage?: Message;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequest {
  participantIds: string[];
  isGroup?: boolean;
  groupName?: string;
  initialMessage?: string;
}

export interface SendMessageRequest {
  content: string;
  messageType?: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
}

class ChatService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  // Initialize socket connection
  initializeSocket(userId: string) {
    if (!this.socket) {
      const token = localStorage.getItem('token');
      this.socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: {
          token,
        },
        transports: ['websocket', 'polling'],
      });

      this.setupSocketEvents();
      
      // Join chat system
      this.socket.emit('chat:join', userId);
    }
    return this.socket;
  }

  // Setup socket event listeners
  private setupSocketEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
      this.emit('socket-connected', true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      this.emit('socket-connected', false);
    });

    this.socket.on('new-message', (data: { chatId: string; message: Message }) => {
      this.emit('new-message', data);
      
      // Update unread count for the chat
      this.emit('chat-unread-updated', { 
        chatId: data.chatId, 
        unreadCount: 1 // increment by 1
      });
    });

    this.socket.on('messages-read', (data: { chatId: string; readBy: string }) => {
      this.emit('messages-read', data);
    });

    this.socket.on('user:online', (userId: string) => {
      this.emit('user-online', userId);
    });

    this.socket.on('user:offline', (userId: string) => {
      this.emit('user-offline', userId);
    });

    this.socket.on('user:typing', (data: { chatId: string; userId: string; isTyping: boolean }) => {
      this.emit('typing', data);
    });
  }

  // Event system for components to listen to chat events
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // API Methods

  // Get all chats for current user
  async getChats(): Promise<ChatRoom[]> {
    try {
      const response = await apiGet<{ success: boolean; data: ChatRoom[] }>('/chat/conversations');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching chats:', error);
      throw error;
    }
  }

  // Get messages for a specific chat
  async getChatMessages(chatId: string, page: number = 1, limit: number = 50): Promise<{ messages: Message[]; hasMore: boolean }> {
    try {
      const response = await apiGet<{ 
        success: boolean; 
        data: Message[]; 
        pagination: { hasMore: boolean; total: number; page: number; limit: number; }
      }>(`/chat/${chatId}/messages`, { page, limit });
      
      return {
        messages: response.data || [],
        hasMore: response.pagination?.hasMore || false,
      };
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  }

  // Create new chat or get existing one
  async createOrGetChat(participantIds: string[], initialMessage?: string): Promise<ChatRoom> {
    try {
      console.log('Creating chat with participants:', participantIds);
      console.log('Initial message:', initialMessage);
      
      const payload = {
        participantIds,
        initialMessage,
      };
      console.log('Chat creation payload:', payload);
      
      const response = await apiPost<{ success: boolean; data: ChatRoom }>('/chat/create', payload);
      console.log('Chat creation response:', response);
      
      if (!response.data) {
        throw new Error('No chat data returned from server');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating chat:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      throw new Error(error.response?.data?.message || error.message || 'Failed to create conversation');
    }
  }

  // Send message
  async sendMessage(chatId: string, data: SendMessageRequest): Promise<Message> {
    try {
      const response = await apiPost<{ success: boolean; data: Message }>(`/chat/${chatId}/message`, data);
      
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Delete message
  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    try {
      await apiDelete(`/chat/${chatId}/message/${messageId}`);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(chatId: string): Promise<void> {
    try {
      await apiPut(`/chat/${chatId}/read`);
      
      // Emit via socket
      if (this.socket) {
        this.socket.emit('mark-read', { chatId });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }

  // Search users to chat with
  async searchUsers(query: string, userType?: 'all' | 'job_seekers' | 'employers', limit?: number, offset?: number): Promise<ChatUser[]> {
    try {
      const response = await apiGet<{ success: boolean; data: ChatUser[] }>('/chat/users/search', {
        query,
        type: userType || 'all',
        excludeCurrentUser: true,
        limit: limit || 100, // Default to 100 users
        offset: offset || 0,
      });
      return response.data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Get all users with pagination
  async getAllUsers(limit?: number, offset?: number): Promise<{ users: ChatUser[]; hasMore: boolean; total: number }> {
    try {
      // Use the existing search endpoint with empty query to get all users
      const response = await apiGet<{ 
        success: boolean; 
        data: ChatUser[]; 
        pagination?: { hasMore: boolean; total: number; limit: number; offset: number; }
      }>('/chat/users/search', {
        query: '', // Empty query to get all users
        type: 'all',
        excludeCurrentUser: true,
        limit: limit || 100,
        offset: offset || 0,
      });
      
      // Since the backend might not support pagination, we'll simulate it
      const users = response.data || [];
      const hasMore = users.length === (limit || 100); // Assume more if we got the full limit
      const total = users.length; // We don't have total count from backend
      
      return {
        users,
        hasMore,
        total,
      };
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  // Get online users
  async getOnlineUsers(): Promise<ChatUser[]> {
    try {
      const response = await apiGet<{ success: boolean; data: ChatUser[] }>('/chat/online-users');
      return response.data || [];
    } catch (error) {
      console.error('Error fetching online users:', error);
      throw error;
    }
  }

  // Socket methods for real-time features
  joinChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('chat:join-room', chatId);
    }
  }

  leaveChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('chat:leave-room', chatId);
    }
  }

  sendTypingIndicator(chatId: string, userId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('chat:typing', { chatId, userId, isTyping });
    }
  }

  // File upload for chat
  async uploadChatFile(file: File): Promise<{ fileUrl: string; fileName: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'chat');

      const response = await api.post<{ 
        success: boolean; 
        data: { url: string; fileName: string; fileSize: number; mimeType: string; type: string }; 
        message: string 
      }>('/upload/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success || !response.data.data) {
        throw new Error('Upload failed');
      }

      return {
        fileUrl: response.data.data.url,
        fileName: response.data.data.fileName
      };
    } catch (error) {
      console.error('Error uploading chat file:', error);
      throw error;
    }
  }

  // Cleanup socket connection
  disconnect(userId?: string) {
    if (this.socket) {
      if (userId) {
        this.socket.emit('chat:leave', userId);
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  // Get total unread messages count
  async getTotalUnreadCount(): Promise<number> {
    try {
      const chats = await this.getChats();
      return chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
    } catch (error) {
      console.error('Error getting total unread count:', error);
      return 0;
    }
  }

  // Get socket connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Alias method for backward compatibility
  async createConversation(participantIds: string[], initialMessage?: string): Promise<ChatRoom> {
    return this.createOrGetChat(participantIds, initialMessage);
  }
}

export const chatService = new ChatService();
export default chatService;
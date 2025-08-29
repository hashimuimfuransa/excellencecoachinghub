import { api, apiGet, apiPost, apiPut } from './api';
import { io, Socket } from 'socket.io-client';

export interface ChatUser {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: string;
  role?: 'job_seeker' | 'employer' | 'admin';
  company?: string;
}

export interface Message {
  _id: string;
  chatId: string;
  sender: ChatUser;
  content: string;
  timestamp: string;
  isRead: boolean;
  messageType?: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
}

export interface ChatRoom {
  _id: string;
  participants: ChatUser[];
  messages: Message[];
  lastMessage?: Message;
  unreadCount: number;
  isGroup?: boolean;
  groupName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequest {
  participantId: string;
  initialMessage?: string;
}

export interface SendMessageRequest {
  chatId: string;
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
          userId,
        },
        transports: ['websocket', 'polling'],
      });

      this.setupSocketEvents();
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

    this.socket.on('new-message', (message: Message) => {
      this.emit('new-message', message);
    });

    this.socket.on('message-read', (data: { chatId: string; messageId: string; readBy: string }) => {
      this.emit('message-read', data);
    });

    this.socket.on('user-online', (userId: string) => {
      this.emit('user-online', userId);
    });

    this.socket.on('user-offline', (userId: string) => {
      this.emit('user-offline', userId);
    });

    this.socket.on('typing', (data: { chatId: string; userId: string; isTyping: boolean }) => {
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
  async createOrGetChat(participantId: string, initialMessage?: string): Promise<ChatRoom> {
    try {
      const response = await apiPost<{ success: boolean; data: ChatRoom }>('/chat/create', {
        participantId,
        initialMessage,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  // Send message
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    try {
      const response = await apiPost<{ success: boolean; data: Message }>('/chat/message', data);
      
      // Emit via socket for real-time updates
      if (this.socket) {
        this.socket.emit('send-message', response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
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
  async searchUsers(query: string, userType?: 'all' | 'job_seekers' | 'employers'): Promise<ChatUser[]> {
    try {
      const response = await apiGet<{ success: boolean; data: ChatUser[] }>('/users/search', {
        query,
        type: userType || 'all',
        excludeCurrentUser: true,
      });
      return response.data || [];
    } catch (error) {
      console.error('Error searching users:', error);
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
      this.socket.emit('join-chat', chatId);
    }
  }

  leaveChat(chatId: string) {
    if (this.socket) {
      this.socket.emit('leave-chat', chatId);
    }
  }

  sendTypingIndicator(chatId: string, isTyping: boolean) {
    if (this.socket) {
      this.socket.emit('typing', { chatId, isTyping });
    }
  }

  // File upload for chat
  async uploadChatFile(file: File): Promise<{ fileUrl: string; fileName: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'chat');

      const response = await api.post<{ success: boolean; data: { fileUrl: string; fileName: string } }>('/upload/chat-file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data;
    } catch (error) {
      console.error('Error uploading chat file:', error);
      throw error;
    }
  }

  // Cleanup socket connection
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  // Get socket connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const chatService = new ChatService();
export default chatService;
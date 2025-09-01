import { io, Socket } from 'socket.io-client';
import { notificationService, Notification as AppNotification } from './notificationService';

// Types for real-time events
export interface RealTimeNotification {
  _id: string;
  type: 'connection_accepted' | 'connection_request' | 'message' | 'job_match' | 'event_reminder';
  title: string;
  message: string;
  data?: {
    userId?: string;
    userName?: string;
    userProfilePicture?: string;
    chatId?: string;
    jobId?: string;
    eventId?: string;
    url?: string;
  };
  isRead: boolean;
  createdAt: string;
  timestamp: number;
}

export interface NewMessage {
  _id: string;
  chatId: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: string;
  isRead: boolean;
}

export interface ConnectionRequest {
  fromUserId: string;
  fromUserName: string;
  timestamp: string;
}

export interface ConnectionAccepted {
  acceptedBy: string;
  accepterName: string;
  timestamp: string;
}

class RealTimeNotificationService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  // Initialize connection
  connect(userId: string, token: string) {
    if (this.socket?.connected && this.userId === userId) {
      return; // Already connected for this user
    }

    this.userId = userId;
    this.disconnect(); // Disconnect any existing connection

    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    this.socket = io(baseUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: this.maxReconnectAttempts,
      timeout: 20000,
    });

    this.setupEventListeners();
    console.log(`🔄 Connecting to real-time notifications for user: ${userId}`);
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      console.log('🔌 Disconnected from real-time notifications');
    }
  }

  // Setup socket event listeners
  private setupEventListeners() {
    if (!this.socket || !this.userId) return;

    // Connection events
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Connected to real-time notifications');

      // Join user-specific rooms
      this.socket?.emit('user:join', this.userId);
      this.socket?.emit('notification:join', this.userId);

      // Send heartbeat every 30 seconds
      const heartbeatInterval = setInterval(() => {
        if (this.socket?.connected) {
          this.socket.emit('heartbeat', this.userId);
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 30000);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log(`❌ Disconnected from real-time notifications: ${reason}`);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.reconnectAttempts++;
        if (this.reconnectAttempts <= this.maxReconnectAttempts) {
          console.log(`🔄 Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        }
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      this.isConnected = false;
    });

    // Heartbeat acknowledgment
    this.socket.on('heartbeat-ack', (data) => {
      console.log('💓 Heartbeat acknowledged:', data);
    });

    // Real-time notification events
    this.socket.on('notification:new', (notification: RealTimeNotification) => {
      console.log('🔔 New real-time notification:', notification);
      this.handleNewNotification(notification);
      this.emit('notification:new', notification);
    });

    this.socket.on('notification:read', (data: { notificationId: string; timestamp: number }) => {
      console.log('✅ Notification marked as read:', data.notificationId);
      this.emit('notification:read', data);
    });

    this.socket.on('notification:all-read', (data: { timestamp: number }) => {
      console.log('✅ All notifications marked as read');
      this.emit('notification:all-read', data);
    });

    this.socket.on('notification:deleted', (data: { notificationId: string; timestamp: number }) => {
      console.log('🗑️ Notification deleted:', data.notificationId);
      this.emit('notification:deleted', data);
    });

    // Chat message events
    this.socket.on('new-message', (data: { chatId: string; message: any; sender: any; timestamp: string }) => {
      console.log('💬 New message received:', data);
      this.handleNewMessage(data);
      this.emit('new-message', data);
    });

    this.socket.on('message:new', (message: NewMessage) => {
      console.log('💬 New real-time message:', message);
      this.emit('message:new', message);
    });

    this.socket.on('message:read-receipt', (data: { messageId: string; readBy: string; timestamp: string }) => {
      console.log('✅ Message read receipt:', data);
      this.emit('message:read-receipt', data);
    });

    // Connection events
    this.socket.on('connection:request-received', (data: ConnectionRequest) => {
      console.log('🤝 Connection request received:', data);
      this.emit('connection:request-received', data);
      
      // Show browser notification if permission granted
      this.showBrowserNotification(
        'New Connection Request',
        `${data.fromUserName} wants to connect with you`,
        '/app/connections?tab=requests'
      );
    });

    this.socket.on('connection:accepted', (data: ConnectionAccepted) => {
      console.log('✅ Connection accepted:', data);
      this.emit('connection:accepted', data);
      
      // Show browser notification if permission granted
      this.showBrowserNotification(
        'Connection Accepted',
        `${data.accepterName} accepted your connection request`,
        '/app/connections'
      );
    });

    // User status events
    this.socket.on('user:status-update', (data: { userId: string; status: string; timestamp: string }) => {
      console.log('👤 User status update:', data);
      this.emit('user:status-update', data);
    });
  }

  // Handle new notification
  private handleNewNotification(notification: RealTimeNotification) {
    // Show browser notification if permission granted
    this.showBrowserNotification(
      notification.title,
      notification.message,
      notification.data?.url || '/app/notifications'
    );

    // Play notification sound (optional)
    this.playNotificationSound();
  }

  // Handle new message
  private handleNewMessage(data: { chatId: string; message: any; sender: any; timestamp: string }) {
    // Show browser notification for messages if permission granted
    const senderName = `${data.sender.firstName} ${data.sender.lastName}`;
    this.showBrowserNotification(
      `New message from ${senderName}`,
      data.message.content,
      `/app/chat/${data.chatId}`
    );

    // Play message sound (optional)
    this.playMessageSound();
  }

  // Show browser notification
  private showBrowserNotification(title: string, body: string, url?: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/logo192.png',
        badge: '/badge-icon.png',
        tag: 'realtime-notification',
        requireInteraction: true,
      });

      notification.onclick = () => {
        window.focus();
        if (url) {
          window.location.href = url;
        }
        notification.close();
      };

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);
    }
  }

  // Play notification sound
  private playNotificationSound() {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Could not play notification sound:', error);
    }
  }

  // Play message sound
  private playMessageSound() {
    try {
      const audio = new Audio('/message-sound.mp3');
      audio.volume = 0.2;
      audio.play().catch(e => console.log('Could not play message sound:', e));
    } catch (error) {
      console.log('Could not play message sound:', error);
    }
  }

  // Event listener management
  on(eventName: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName)!.add(callback);
  }

  off(eventName: string, callback: (...args: any[]) => void) {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.delete(callback);
      if (eventListeners.size === 0) {
        this.listeners.delete(eventName);
      }
    }
  }

  private emit(eventName: string, ...args: any[]) {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(...args));
    }
  }

  // Send real-time message
  sendMessage(data: {
    chatId: string;
    senderId: string;
    senderName: string;
    content: string;
    messageType: 'text' | 'image' | 'file';
    recipientId?: string;
  }) {
    if (this.socket?.connected) {
      this.socket.emit('message:send', data);
    } else {
      console.warn('Cannot send message: socket not connected');
    }
  }

  // Join chat room
  joinChatRoom(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('chat:join', chatId);
      console.log(`💬 Joined chat room: ${chatId}`);
    }
  }

  // Leave chat room
  leaveChatRoom(chatId: string) {
    if (this.socket?.connected) {
      this.socket.emit('chat:leave', chatId);
      console.log(`💬 Left chat room: ${chatId}`);
    }
  }

  // Send typing indicator
  sendTypingIndicator(chatId: string, isTyping: boolean) {
    if (this.socket?.connected && this.userId) {
      this.socket.emit('chat:typing', {
        chatId,
        userId: this.userId,
        isTyping
      });
    }
  }

  // Mark message as read
  markMessageAsRead(messageId: string, chatId: string) {
    if (this.socket?.connected && this.userId) {
      this.socket.emit('message:read', {
        messageId,
        chatId,
        userId: this.userId
      });
    }
  }

  // Update user status
  updateUserStatus(status: 'online' | 'away' | 'busy' | 'offline') {
    if (this.socket?.connected && this.userId) {
      this.socket.emit('user:status', {
        userId: this.userId,
        status
      });
    }
  }

  // Request browser notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    }

    return Notification.permission;
  }

  // Get connection status
  get connected(): boolean {
    return this.isConnected;
  }

  // Get current user ID
  get currentUserId(): string | null {
    return this.userId;
  }
}

export const realTimeNotificationService = new RealTimeNotificationService();
export default realTimeNotificationService;
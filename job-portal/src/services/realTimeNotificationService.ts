import { io, Socket } from 'socket.io-client';
import { notificationService, Notification as AppNotification } from './notificationService';
import { pushNotificationService, PushNotificationPayload } from './pushNotificationService';

export interface RealtimeNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  sender?: any;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  sound: boolean;
  vibration: boolean;
  connectionRequests: boolean;
  messages: boolean;
  jobMatches: boolean;
  courseUpdates: boolean;
  systemNotifications: boolean;
}

class RealTimeNotificationService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();
  private unreadCount: number = 0;
  private preferences: NotificationPreferences = {
    email: true,
    push: true,
    inApp: true,
    sound: true,
    vibration: true,
    connectionRequests: true,
    messages: true,
    jobMatches: true,
    courseUpdates: true,
    systemNotifications: true
  };
  private audioContext: AudioContext | null = null;
  private notificationSound: AudioBuffer | null = null;

  /**
   * Initialize the real-time notification service
   */
  async init(userId: string): Promise<void> {
    try {
      await this.initializeSocket(userId);
      await this.loadPreferences();
      await this.initializeAudio();
      await pushNotificationService.init();
      
      console.log('Real-time notification service initialized');
    } catch (error) {
      console.error('Error initializing real-time notification service:', error);
    }
  }

  /**
   * Initialize Socket.IO connection
   */
  private async initializeSocket(userId: string): Promise<void> {
    if (!this.socket) {
      const token = localStorage.getItem('token');
      this.socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      this.setupSocketEvents();
      this.socket.emit('notification:join', userId);
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketEvents(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to notification server');
      this.emit('socket-connected', true);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from notification server');
      this.emit('socket-connected', false);
    });

    this.socket.on('notification', (notificationData: RealtimeNotification) => {
      this.handleIncomingNotification(notificationData);
    });

    this.socket.on('notification:read', (data: { notificationId: string }) => {
      this.emit('notification-read', data);
    });

    this.socket.on('notification:deleted', (data: { notificationId: string }) => {
      this.emit('notification-deleted', data);
    });

    this.socket.on('unread-count', (count: number) => {
      this.unreadCount = count;
      this.emit('unread-count-changed', count);
    });
  }

  /**
   * Handle incoming notifications
   */
  private async handleIncomingNotification(notification: RealtimeNotification): Promise<void> {
    try {
      console.log('Received real-time notification:', notification);

      // Check if notification type is enabled
      if (!this.isNotificationTypeEnabled(notification.type)) {
        console.log('Notification type disabled:', notification.type);
        return;
      }

      // Update unread count
      this.unreadCount++;
      this.emit('unread-count-changed', this.unreadCount);

      // Show in-app notification
      if (this.preferences.inApp) {
        this.emit('new-notification', notification);
      }

      // Play notification sound
      if (this.preferences.sound) {
        this.playNotificationSound();
      }

      // Vibrate if supported and enabled
      if (this.preferences.vibration && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }

      // Show push notification if page is not visible
      if (this.preferences.push && document.hidden) {
        await this.showPushNotification(notification);
      }

      // Show desktop notification if page is not visible
      if (document.hidden && Notification.permission === 'granted') {
        await this.showDesktopNotification(notification);
      }

    } catch (error) {
      console.error('Error handling incoming notification:', error);
    }
  }

  /**
   * Check if notification type is enabled in preferences
   */
  private isNotificationTypeEnabled(type: string): boolean {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return this.preferences.connectionRequests;
      case 'message':
        return this.preferences.messages;
      case 'job_match':
        return this.preferences.jobMatches;
      case 'course_enrolled':
      case 'course_updated':
        return this.preferences.courseUpdates;
      default:
        return this.preferences.systemNotifications;
    }
  }

  /**
   * Show push notification
   */
  private async showPushNotification(notification: RealtimeNotification): Promise<void> {
    const payload: PushNotificationPayload = {
      title: notification.title,
      body: notification.message,
      icon: this.getNotificationIcon(notification.type),
      badge: '/logo192.png',
      data: {
        id: notification.id,
        type: notification.type,
        actionUrl: notification.actionUrl,
        ...notification.data
      },
      tag: `notification-${notification.id}`,
      requireInteraction: notification.priority === 'urgent',
      timestamp: new Date(notification.createdAt).getTime()
    };

    await pushNotificationService.showLocalNotification(payload);
  }

  /**
   * Show desktop notification
   */
  private async showDesktopNotification(notification: RealtimeNotification): Promise<void> {
    const desktopNotification = new Notification(notification.title, {
      body: notification.message,
      icon: this.getNotificationIcon(notification.type),
      badge: '/logo192.png',
      data: notification.data,
      tag: `notification-${notification.id}`,
      requireInteraction: notification.priority === 'urgent',
      timestamp: new Date(notification.createdAt).getTime()
    });

    desktopNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.href = notification.actionUrl;
      }
      desktopNotification.close();
    };

    // Auto-close after 5 seconds for non-urgent notifications
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        desktopNotification.close();
      }, 5000);
    }
  }

  /**
   * Get notification icon based on type
   */
  private getNotificationIcon(type: string): string {
    switch (type) {
      case 'connection_request':
      case 'connection_accepted':
        return '/icons/connection.png';
      case 'message':
        return '/icons/message.png';
      case 'job_match':
        return '/icons/job.png';
      case 'course_enrolled':
      case 'course_updated':
        return '/icons/course.png';
      default:
        return '/logo192.png';
    }
  }

  /**
   * Initialize audio context and load notification sound
   */
  private async initializeAudio(): Promise<void> {
    try {
      if ('AudioContext' in window || 'webkitAudioContext' in (window as any)) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Load notification sound
        const response = await fetch('/sounds/notification.mp3');
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          this.notificationSound = await this.audioContext.decodeAudioData(arrayBuffer);
        }
      }
    } catch (error) {
      console.warn('Could not initialize audio:', error);
    }
  }

  /**
   * Play notification sound
   */
  private playNotificationSound(): void {
    try {
      if (this.audioContext && this.notificationSound) {
        const source = this.audioContext.createBufferSource();
        source.buffer = this.notificationSound;
        source.connect(this.audioContext.destination);
        source.start(0);
      }
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  /**
   * Load user notification preferences
   */
  private async loadPreferences(): Promise<void> {
    try {
      const response = await fetch('/api/user/notification-preferences', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.preferences = { ...this.preferences, ...data };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      // Use default preferences
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      this.preferences = { ...this.preferences, ...newPreferences };
      
      await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(this.preferences)
      });
      
      console.log('Notification preferences updated');
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  /**
   * Get current notification preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Get current unread count
   */
  getUnreadCount(): number {
    return this.unreadCount;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await notificationService.markAsRead(notificationId);
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.emit('unread-count-changed', this.unreadCount);
      
      if (this.socket) {
        this.socket.emit('notification:read', { notificationId });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await notificationService.markAllAsRead();
      this.unreadCount = 0;
      this.emit('unread-count-changed', this.unreadCount);
      
      if (this.socket) {
        this.socket.emit('notification:mark-all-read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await notificationService.deleteNotification(notificationId);
      
      if (this.socket) {
        this.socket.emit('notification:deleted', { notificationId });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  /**
   * Event system for components to listen to notification events
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Test notification (for development/testing)
   */
  async testNotification(): Promise<void> {
    const testNotification: RealtimeNotification = {
      id: 'test-' + Date.now(),
      type: 'message',
      title: 'Test Notification',
      message: 'This is a test notification to check if everything is working properly.',
      data: { test: true },
      priority: 'medium',
      actionUrl: '/app',
      actionText: 'Open App',
      createdAt: new Date().toISOString(),
      isRead: false
    };

    await this.handleIncomingNotification(testNotification);
  }

  /**
   * Cleanup and disconnect
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.eventListeners.clear();
  }
}

export const realTimeNotificationService = new RealTimeNotificationService();
export default realTimeNotificationService;
import { api } from './api';

export interface PushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

class PushNotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey = '';

  /**
   * Initialize VAPID key from backend
   */
  async initVapidKey(): Promise<void> {
    try {
      const response = await api.get('/notifications/vapid-public-key');
      if (response.data.success) {
        this.vapidPublicKey = response.data.data.publicKey;
      }
    } catch (error) {
      console.error('Error fetching VAPID public key:', error);
      // Fallback to hardcoded key
      this.vapidPublicKey = 'BOxZ9nZnr7CyOeOFwYgVYGNXmhLTGwgz0fgTr7W3GNxnWgYJgJvEYKQmQXVXQGZjEgHnE7dQE5C1PjO5vE5LnV4';
    }
  }

  /**
   * Initialize service worker and check for notification permission
   */
  async init(): Promise<void> {
    try {
      // Initialize VAPID key first
      await this.initVapidKey();

      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported');
        return;
      }

      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return;
      }

      // Register service worker
      this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported');
        return;
      }

      // Request notification permission if not already granted
      await this.requestPermission();
      
      // Subscribe to push notifications if permission granted
      if (window.Notification && window.Notification.permission === 'granted') {
        await this.subscribeUser();
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!window.Notification) {
      return 'denied';
    }
    
    let permission = window.Notification.permission;

    if (permission === 'default') {
      permission = await window.Notification.requestPermission();
    }

    if (permission === 'granted') {
      console.log('Notification permission granted');
    } else if (permission === 'denied') {
      console.warn('Notification permission denied');
    }

    return permission;
  }

  /**
   * Subscribe user to push notifications
   */
  async subscribeUser(): Promise<PushSubscription | null> {
    try {
      if (!this.swRegistration) {
        throw new Error('Service worker not registered');
      }

      // Check if already subscribed
      let subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        console.log('User already subscribed to push notifications');
        // Send existing subscription to server
        await this.sendSubscriptionToServer(subscription);
        return this.subscriptionToObject(subscription);
      }

      // Subscribe user
      subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('User subscribed to push notifications');

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return this.subscriptionToObject(subscription);
    } catch (error) {
      console.error('Failed to subscribe user:', error);
      return null;
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribeUser(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('User unsubscribed from push notifications');
        
        // Remove subscription from server
        await this.removeSubscriptionFromServer(subscription);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe user:', error);
      return false;
    }
  }

  /**
   * Check if user is subscribed to push notifications
   */
  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        return false;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    try {
      if (!this.swRegistration) {
        return null;
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      return subscription ? this.subscriptionToObject(subscription) : null;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Show local notification
   */
  async showLocalNotification(payload: PushNotificationPayload): Promise<void> {
    try {
      if (!this.swRegistration) {
        // Fallback to browser notification if service worker not available
        new window.Notification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          image: payload.image,
          data: payload.data,
          tag: payload.tag,
          requireInteraction: payload.requireInteraction,
          silent: payload.silent,
          timestamp: payload.timestamp || Date.now()
        });
        return;
      }

      await this.swRegistration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/logo192.png',
        badge: payload.badge || '/logo192.png',
        image: payload.image,
        data: payload.data,
        actions: payload.actions,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        timestamp: payload.timestamp || Date.now()
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: any): Promise<void> {
    try {
      await api.post('/notifications/push-subscription', {
        subscription: this.subscriptionToObject(subscription)
      });
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(subscription: any): Promise<void> {
    try {
      await api.delete('/notifications/push-subscription', {
        data: {
          endpoint: subscription.endpoint
        }
      });
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  /**
   * Convert subscription object to plain object
   */
  private subscriptionToObject(subscription: any): PushSubscription {
    return {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')),
        auth: this.arrayBufferToBase64(subscription.getKey('auth'))
      }
    };
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
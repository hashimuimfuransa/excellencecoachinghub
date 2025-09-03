import webpush from 'web-push';
import { PushSubscription } from '../models/PushSubscription';

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
  vibrate?: number[];
}

class PushNotificationServiceClass {
  private vapidPublicKey: string;
  private vapidPrivateKey: string;
  private vapidSubject: string;

  constructor() {
    // Set VAPID keys from environment variables
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BOxZ9nZnr7CyOeOFwYgVYGNXmhLTGwgz0fgTr7W3GNxnWgYJgJvEYKQmQXVXQGZjEgHnE7dQE5C1PjO5vE5LnV4';
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'your-private-key-here';
    this.vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@excellencecoachinghub.com';

    // Configure web-push only if we have proper keys
    try {
      if (this.vapidPrivateKey && this.vapidPrivateKey !== 'your-private-key-here') {
        webpush.setVapidDetails(
          this.vapidSubject,
          this.vapidPublicKey,
          this.vapidPrivateKey
        );
      }
    } catch (error) {
      console.warn('Warning: Invalid VAPID keys, push notifications disabled:', error.message);
    }
  }

  /**
   * Send push notification to a specific user
   */
  async sendToUser(userId: string, payload: PushNotificationPayload): Promise<void> {
    try {
      // Get all push subscriptions for the user
      const subscriptions = await PushSubscription.find({ userId });

      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${userId}`);
        return;
      }

      // Prepare notification payload
      const notificationPayload = {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/logo192.png',
        badge: payload.badge || '/logo192.png',
        image: payload.image,
        data: payload.data || {},
        actions: payload.actions || [],
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false,
        timestamp: payload.timestamp || Date.now(),
        vibrate: payload.vibrate || [200, 100, 200]
      };

      // Send notifications to all user's devices
      const notifications = subscriptions.map(async (subscription) => {
        try {
          // Check if subscription is expired
          if (subscription.isExpired && subscription.isExpired()) {
            console.log(`Subscription expired for user ${userId}, removing...`);
            await subscription.deleteOne();
            return;
          }

          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth
            }
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify(notificationPayload)
          );

          console.log(`Push notification sent successfully to user ${userId}`);
        } catch (error: any) {
          console.error(`Error sending push notification to user ${userId}:`, error);

          // Handle specific errors
          if (error.statusCode === 410 || error.statusCode === 404) {
            // Subscription is no longer valid, remove it
            console.log(`Removing invalid subscription for user ${userId}`);
            await subscription.deleteOne();
          }
        }
      });

      await Promise.allSettled(notifications);
    } catch (error) {
      console.error(`Error sending push notifications to user ${userId}:`, error);
    }
  }

  /**
   * Send push notification to multiple users
   */
  async sendToUsers(userIds: string[], payload: PushNotificationPayload): Promise<void> {
    const notifications = userIds.map(userId => this.sendToUser(userId, payload));
    await Promise.allSettled(notifications);
  }

  /**
   * Send chat message notification
   */
  async sendChatMessageNotification(
    recipientUserId: string,
    senderName: string,
    messageContent: string,
    chatId: string
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: `New message from ${senderName}`,
      body: messageContent.length > 50 ? `${messageContent.substring(0, 47)}...` : messageContent,
      icon: '/chat-icon.png',
      badge: '/badge-icon.png',
      tag: `chat-${chatId}`,
      requireInteraction: true,
      data: {
        type: 'chat-message',
        chatId,
        senderId: recipientUserId,
        timestamp: Date.now(),
        url: `/app/chat/${chatId}`
      },
      actions: [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/reply-icon.png'
        },
        {
          action: 'open_chat',
          title: 'Open Chat',
          icon: '/chat-icon.png'
        }
      ],
      vibrate: [200, 100, 200, 100, 200]
    };

    await this.sendToUser(recipientUserId, payload);
  }

  /**
   * Send connection request notification
   */
  async sendConnectionNotification(
    recipientUserId: string,
    senderName: string,
    type: 'request' | 'accepted'
  ): Promise<void> {
    const isRequest = type === 'request';
    const payload: PushNotificationPayload = {
      title: isRequest ? 'New Connection Request' : 'Connection Accepted',
      body: isRequest 
        ? `${senderName} wants to connect with you`
        : `${senderName} accepted your connection request`,
      icon: '/connection-icon.png',
      badge: '/badge-icon.png',
      tag: `connection-${type}`,
      requireInteraction: true,
      data: {
        type: `connection-${type}`,
        senderName,
        timestamp: Date.now(),
        url: '/app/connections'
      },
      actions: isRequest ? [
        {
          action: 'accept',
          title: 'Accept',
          icon: '/accept-icon.png'
        },
        {
          action: 'view_profile',
          title: 'View Profile',
          icon: '/profile-icon.png'
        }
      ] : [
        {
          action: 'view_connections',
          title: 'View Connections',
          icon: '/connections-icon.png'
        }
      ]
    };

    await this.sendToUser(recipientUserId, payload);
  }

  /**
   * Send job match notification
   */
  async sendJobMatchNotification(
    userId: string,
    jobTitle: string,
    company: string,
    matchScore: number
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title: 'New Job Match Found!',
      body: `${jobTitle} at ${company} (${matchScore}% match)`,
      icon: '/job-icon.png',
      badge: '/badge-icon.png',
      tag: 'job-match',
      requireInteraction: true,
      data: {
        type: 'job-match',
        jobTitle,
        company,
        matchScore,
        timestamp: Date.now(),
        url: '/app/jobs'
      },
      actions: [
        {
          action: 'view_job',
          title: 'View Job',
          icon: '/job-icon.png'
        },
        {
          action: 'apply',
          title: 'Apply Now',
          icon: '/apply-icon.png'
        }
      ]
    };

    await this.sendToUser(userId, payload);
  }

  /**
   * Clean up expired subscriptions for all users
   */
  async cleanupExpiredSubscriptions(): Promise<void> {
    try {
      const expiredCount = await PushSubscription.deleteMany({
        expirationTime: { $lt: Date.now() }
      });

      console.log(`Cleaned up ${expiredCount.deletedCount} expired push subscriptions`);
    } catch (error) {
      console.error('Error cleaning up expired subscriptions:', error);
    }
  }

  /**
   * Get VAPID public key for frontend
   */
  getVapidPublicKey(): string {
    return this.vapidPublicKey;
  }
}

export const pushNotificationService = new PushNotificationServiceClass();
export default pushNotificationService;
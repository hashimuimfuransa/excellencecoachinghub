import { Notification, INotification } from '../models/Notification';
import { pushNotificationService } from './pushNotificationService';
import mongoose from 'mongoose';

export interface NotificationData {
  recipient: string;
  type: 'connection_accepted' | 'connection_request' | 'message' | 'job_match' | 'event_reminder' | 'payment_approved' | 'payment_rejected' | 'payment_success' | 'payment_failed' | 'test_request_created' | 'test_request_approved' | 'test_request_rejected' | 'tests_generated' | 'application_update';
  title: string;
  message: string;
  data?: {
    userId?: string;
    userName?: string;
    userProfilePicture?: string;
    chatId?: string;
    jobId?: string;
    eventId?: string;
    paymentRequestId?: string;
    testType?: string;
    requestId?: string;
    applicationId?: string;
    url?: string;
  };
}

class NotificationServiceClass {
  private io: any = null;

  /**
   * Set Socket.IO instance
   */
  setSocketIO(socketIO: any) {
    this.io = socketIO;
    console.log('✅ Socket.IO instance set for notification service');
  }

  /**
   * Send notification (wrapper for sendRealTimeNotification for backwards compatibility)
   */
  async sendNotification(userId: string, notificationData: Omit<NotificationData, 'recipient'>): Promise<INotification | null> {
    return this.sendRealTimeNotification({
      ...notificationData,
      recipient: userId
    });
  }

  /**
   * Send real-time notification (Socket.IO + Push Notification + Database)
   */
  async sendRealTimeNotification(notificationData: NotificationData): Promise<INotification | null> {
    try {
      // 1. Save to database
      const notification = await this.createNotification(notificationData);
      if (!notification) return null;

      // 2. Send real-time Socket.IO notification
      if (this.io) {
        this.io.to(`user_${notificationData.recipient}`).emit('notification:new', {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
          timestamp: Date.now()
        });

        console.log(`🔔 Real-time notification sent to user ${notificationData.recipient}`);
      }

      // 3. Send push notification (for offline users or background)
      try {
        await pushNotificationService.sendToUser(notificationData.recipient, {
          title: notificationData.title,
          body: notificationData.message,
          icon: '/logo192.png',
          badge: '/badge-icon.png',
          tag: `notification-${notification.type}`,
          requireInteraction: true,
          data: {
            type: notification.type,
            notificationId: notification._id.toString(),
            url: notificationData.data?.url || '/app/notifications',
            ...notificationData.data
          }
        });
      } catch (pushError) {
        console.error('Push notification failed (user may not have push enabled):', pushError);
      }

      return notification;
    } catch (error) {
      console.error('Error sending real-time notification:', error);
      return null;
    }
  }

  /**
   * Create notification in database
   */
  async createNotification(data: NotificationData): Promise<INotification | null> {
    try {
      const notification = new Notification({
        recipient: new mongoose.Types.ObjectId(data.recipient),
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data ? {
          userId: data.data.userId ? new mongoose.Types.ObjectId(data.data.userId) : undefined,
          userName: data.data.userName,
          userProfilePicture: data.data.userProfilePicture,
          chatId: data.data.chatId ? new mongoose.Types.ObjectId(data.data.chatId) : undefined,
          jobId: data.data.jobId ? new mongoose.Types.ObjectId(data.data.jobId) : undefined,
          eventId: data.data.eventId ? new mongoose.Types.ObjectId(data.data.eventId) : undefined,
          paymentRequestId: data.data.paymentRequestId ? new mongoose.Types.ObjectId(data.data.paymentRequestId) : undefined,
          testType: data.data.testType,
          url: data.data.url
        } : undefined
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  /**
   * Send connection request notification
   */
  async sendConnectionRequestNotification(recipientId: string, senderName: string, senderId: string, senderProfilePicture?: string): Promise<void> {
    await this.sendRealTimeNotification({
      recipient: recipientId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${senderName} wants to connect with you`,
      data: {
        userId: senderId,
        userName: senderName,
        userProfilePicture: senderProfilePicture,
        url: '/app/connections?tab=requests'
      }
    });

    // Also send push notification
    await pushNotificationService.sendConnectionNotification(recipientId, senderName, 'request');
  }

  /**
   * Send connection accepted notification
   */
  async sendConnectionAcceptedNotification(recipientId: string, accepterName: string, accepterId: string, accepterProfilePicture?: string): Promise<void> {
    await this.sendRealTimeNotification({
      recipient: recipientId,
      type: 'connection_accepted',
      title: 'Connection Accepted',
      message: `${accepterName} accepted your connection request`,
      data: {
        userId: accepterId,
        userName: accepterName,
        userProfilePicture: accepterProfilePicture,
        url: '/app/connections'
      }
    });

    // Also send push notification
    await pushNotificationService.sendConnectionNotification(recipientId, accepterName, 'accepted');
  }

  /**
   * Send new message notification
   */
  async sendMessageNotification(
    recipientId: string, 
    senderName: string, 
    senderId: string, 
    messageContent: string, 
    chatId: string,
    senderProfilePicture?: string
  ): Promise<void> {
    await this.sendRealTimeNotification({
      recipient: recipientId,
      type: 'message',
      title: `New message from ${senderName}`,
      message: messageContent.length > 50 ? `${messageContent.substring(0, 47)}...` : messageContent,
      data: {
        userId: senderId,
        userName: senderName,
        userProfilePicture: senderProfilePicture,
        chatId,
        url: `/app/chat/${chatId}`
      }
    });

    // Also send push notification for chat messages
    await pushNotificationService.sendChatMessageNotification(recipientId, senderName, messageContent, chatId);
  }

  /**
   * Send job match notification
   */
  async sendJobMatchNotification(
    userId: string, 
    jobTitle: string, 
    company: string, 
    jobId: string,
    matchScore: number
  ): Promise<void> {
    await this.sendRealTimeNotification({
      recipient: userId,
      type: 'job_match',
      title: 'New Job Match Found!',
      message: `${jobTitle} at ${company} (${matchScore}% match)`,
      data: {
        jobId,
        url: `/app/jobs/${jobId}`
      }
    });

    // Also send push notification
    await pushNotificationService.sendJobMatchNotification(userId, jobTitle, company, matchScore);
  }

  /**
   * Send payment request approval notification
   */
  async sendPaymentApprovalNotification(
    userId: string, 
    paymentRequestId: string, 
    status: 'approved' | 'rejected',
    jobTitle: string,
    testType: string,
    adminNotes?: string
  ): Promise<void> {
    const isApproved = status === 'approved';
    
    await this.sendRealTimeNotification({
      recipient: userId,
      type: isApproved ? 'payment_approved' : 'payment_rejected',
      title: isApproved ? 'Premium Test Approved! 🎉' : 'Premium Test Request Update',
      message: isApproved 
        ? `Your request for ${testType} for ${jobTitle} has been approved! You can now take the premium psychometric test.`
        : `Your request for ${testType} for ${jobTitle} has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : 'Please contact support for more information.'}`,
      data: {
        paymentRequestId,
        testType,
        url: '/app/psychometric-tests'
      }
    });
  }

  /**
   * Send application status update notification
   */
  async sendApplicationStatusNotification(
    userId: string,
    applicationId: string,
    jobTitle: string,
    company: string,
    status: 'shortlisted' | 'rejected' | 'interview_scheduled' | 'offered',
    additionalInfo?: string
  ): Promise<void> {
    let title: string;
    let message: string;
    let icon: string;

    switch (status) {
      case 'shortlisted':
        title = 'Application Shortlisted! 🎉';
        message = `Great news! You have been shortlisted for ${jobTitle} at ${company}`;
        icon = '🎉';
        break;
      case 'rejected':
        title = 'Application Update';
        message = `Thank you for your interest in ${jobTitle} at ${company}. Unfortunately, we have decided to move forward with other candidates.`;
        icon = '📧';
        break;
      case 'interview_scheduled':
        title = 'Interview Scheduled! 📅';
        message = `Your interview for ${jobTitle} at ${company} has been scheduled. ${additionalInfo || ''}`;
        icon = '📅';
        break;
      case 'offered':
        title = 'Job Offer Received! 🎊';
        message = `Congratulations! You have received a job offer for ${jobTitle} at ${company}`;
        icon = '🎊';
        break;
      default:
        title = 'Application Update';
        message = `Your application for ${jobTitle} at ${company} has been updated`;
        icon = '📧';
    }

    await this.sendRealTimeNotification({
      recipient: userId,
      type: 'application_update',
      title,
      message,
      data: {
        applicationId,
        url: '/app/applications'
      }
    });
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId: string, page = 1, limit = 20): Promise<{
    notifications: INotification[];
    totalCount: number;
    unreadCount: number;
    hasMore: boolean;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      const [notifications, totalCount, unreadCount] = await Promise.all([
        Notification.find({ recipient: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('data.userId', 'name profilePicture'),
        Notification.countDocuments({ recipient: userId }),
        Notification.countDocuments({ recipient: userId, isRead: false })
      ]);

      return {
        notifications,
        totalCount,
        unreadCount,
        hasMore: totalCount > skip + notifications.length
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return { notifications: [], totalCount: 0, unreadCount: 0, hasMore: false };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await Notification.findOneAndUpdate(
        { _id: notificationId, recipient: userId },
        { isRead: true },
        { new: true }
      );

      if (result && this.io) {
        // Send real-time update about read status
        this.io.to(`user_${userId}`).emit('notification:read', {
          notificationId,
          timestamp: Date.now()
        });
      }

      return !!result;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await Notification.updateMany(
        { recipient: userId, isRead: false },
        { isRead: true }
      );

      if (result.modifiedCount > 0 && this.io) {
        // Send real-time update about all notifications being read
        this.io.to(`user_${userId}`).emit('notification:all-read', {
          timestamp: Date.now()
        });
      }

      return result.modifiedCount;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return 0;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await Notification.findOneAndDelete({
        _id: notificationId,
        recipient: userId
      });

      if (result && this.io) {
        // Send real-time update about deletion
        this.io.to(`user_${userId}`).emit('notification:deleted', {
          notificationId,
          timestamp: Date.now()
        });
      }

      return !!result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  async cleanupOldNotifications(): Promise<number> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        isRead: true // Only delete read notifications
      });

      console.log(`🧹 Cleaned up ${result.deletedCount} old notifications`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      return 0;
    }
  }

  /**
   * Get unread notification count for user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({
        recipient: userId,
        isRead: false
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationServiceClass();

// Export setSocketIO function for backwards compatibility
export const setSocketIO = (socketIO: any) => {
  notificationService.setSocketIO(socketIO);
};

export default notificationService;
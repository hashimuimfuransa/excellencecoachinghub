import { Request, Response } from 'express';
import { Notification, INotificationDocument } from '../models/Notification';
import { User } from '../models/User';
import { NotificationType } from '../../../shared/types';
import mongoose from 'mongoose';

// Get notifications for current user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      category,
      isRead,
      isArchived,
      actionRequired,
      startDate,
      endDate
    } = req.query;

    // Build filter
    const filter: any = {
      recipient: userId
    };

    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (isRead !== undefined) filter.isRead = isRead === 'true';
    if (isArchived !== undefined) filter.isArchived = isArchived === 'true';
    if (actionRequired !== undefined) filter.actionRequired = actionRequired === 'true';

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Calculate pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get notifications
    const notifications = await Notification.find(filter)
      .populate('sender', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Transform notifications to match frontend interface
    const transformedNotifications = notifications.map((notification: any) => ({
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: mapNotificationTypeToFrontend(notification.type),
      priority: notification.priority,
      category: mapNotificationTypeToCategory(notification.type),
      recipient: notification.recipient,
      sender: notification.sender,
      isRead: notification.isRead,
      isArchived: notification.isArchived || false,
      actionRequired: !!notification.actionUrl,
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      expiresAt: notification.expiresAt,
      metadata: notification.data || {},
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      readAt: notification.readAt
    }));

    // Get total count
    const totalNotifications = await Notification.countDocuments(filter);
    const totalPages = Math.ceil(totalNotifications / limitNum);

    // Get stats
    const stats = await getNotificationStats(userId);

    res.status(200).json({
      success: true,
      data: {
        notifications: transformedNotifications,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalNotifications,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1
        },
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

// Get notification statistics
export const getNotificationStats = async (userId: string) => {
  try {
    const stats = await Notification.aggregate([
      {
        $match: {
          recipient: new mongoose.Types.ObjectId(userId),
          isArchived: false
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0]
            }
          },
          actionRequired: {
            $sum: {
              $cond: [{ $eq: ['$actionRequired', true] }, 1, 0]
            }
          },
          types: {
            $push: '$type'
          },
          priorities: {
            $push: '$priority'
          },
          categories: {
            $push: '$category'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return {
        total: 0,
        unread: 0,
        byType: { info: 0, success: 0, warning: 0, error: 0 },
        byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
        byCategory: { system: 0, user: 0, course: 0, payment: 0, security: 0, maintenance: 0 },
        actionRequired: 0
      };
    }

    const result = stats[0];
    
    // Count by type (map backend types to frontend types)
    const byType = { info: 0, success: 0, warning: 0, error: 0 };
    result.types.forEach((type: NotificationType) => {
      const frontendType = mapNotificationTypeToFrontend(type);
      byType[frontendType]++;
    });

    // Count by priority
    const byPriority = { low: 0, medium: 0, high: 0, urgent: 0 };
    result.priorities.forEach((priority: string) => {
      if (byPriority.hasOwnProperty(priority)) {
        byPriority[priority as keyof typeof byPriority]++;
      }
    });

    // Count by category (map backend types to frontend categories)
    const byCategory = { system: 0, user: 0, course: 0, payment: 0, security: 0, maintenance: 0 };
    result.types.forEach((type: NotificationType) => {
      const category = mapNotificationTypeToCategory(type);
      byCategory[category]++;
    });

    return {
      total: result.total,
      unread: result.unread,
      byType,
      byPriority,
      byCategory,
      actionRequired: result.actionRequired
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return {
      total: 0,
      unread: 0,
      byType: { info: 0, success: 0, warning: 0, error: 0 },
      byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
      byCategory: { system: 0, user: 0, course: 0, payment: 0, security: 0, maintenance: 0 },
      actionRequired: 0
    };
  }
};

// Get notification statistics endpoint
export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const stats = await getNotificationStats(userId);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics'
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
      isArchived: false
    });

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count'
    });
  }
};

// Mark notification as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { 
        isRead: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark multiple notifications as read
export const markMultipleAsRead = async (req: Request, res: Response) => {
  try {
    const { notificationIds } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(notificationIds)) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds must be an array'
      });
    }

    const result = await Notification.updateMany(
      { 
        _id: { $in: notificationIds }, 
        recipient: userId 
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notifications as read'
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

// Archive notification
export const archiveNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { isArchived: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification archived'
    });
  } catch (error) {
    console.error('Error archiving notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive notification'
    });
  }
};

// Delete notification
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification'
    });
  }
};

// Create notification (admin only)
export const createNotification = async (req: Request, res: Response) => {
  try {
    const {
      title,
      message,
      type = 'info',
      priority = 'medium',
      category,
      recipient,
      actionRequired = false,
      actionUrl,
      actionText,
      expiresAt,
      metadata
    } = req.body;

    // Validate required fields
    if (!title || !message || !category || !recipient) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, category, and recipient are required'
      });
    }

    // Verify recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }

    const notification = new Notification({
      title,
      message,
      type,
      priority,
      category,
      recipient,
      sender: req.user._id,
      actionRequired,
      actionUrl,
      actionText,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata
    });

    await notification.save();

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully'
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification'
    });
  }
};

// Send bulk notifications (admin only)
export const sendBulkNotifications = async (req: Request, res: Response) => {
  try {
    const {
      recipients,
      title,
      message,
      type = 'info',
      priority = 'medium',
      category,
      actionRequired = false,
      actionUrl,
      actionText,
      expiresAt,
      metadata
    } = req.body;

    // Validate required fields
    if (!title || !message || !category || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        message: 'Title, message, category, and recipients array are required'
      });
    }

    // Verify recipients exist
    const validRecipients = await User.find({ _id: { $in: recipients } }).select('_id');
    const validRecipientIds = validRecipients.map(user => user._id.toString());

    const notifications = recipients
      .filter((recipientId: string) => validRecipientIds.includes(recipientId))
      .map((recipientId: string) => ({
        title,
        message,
        type,
        priority,
        category,
        recipient: recipientId,
        sender: req.user._id,
        actionRequired,
        actionUrl,
        actionText,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        metadata
      }));

    const result = await Notification.insertMany(notifications);

    res.status(201).json({
      success: true,
      data: {
        created: result.length,
        failed: recipients.length - result.length
      },
      message: `${result.length} notifications sent successfully`
    });
  } catch (error) {
    console.error('Error sending bulk notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications'
    });
  }
};

// Get system alerts (admin only)
export const getSystemAlerts = async (req: Request, res: Response) => {
  try {
    const alerts = await Notification.find({
      category: 'system',
      priority: { $in: ['high', 'urgent'] },
      isArchived: false
    })
    .populate('recipient', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system alerts'
    });
  }
};

// Helper functions to map backend notification types to frontend interface

// Map backend notification types to frontend types
function mapNotificationTypeToFrontend(backendType: NotificationType): 'info' | 'success' | 'warning' | 'error' {
  switch (backendType) {
    case NotificationType.TEACHER_PROFILE_APPROVED:
    case NotificationType.COURSE_APPROVED:
      return 'success';
    case NotificationType.TEACHER_PROFILE_REJECTED:
    case NotificationType.COURSE_REJECTED:
      return 'error';
    case NotificationType.TEACHER_PROFILE_PENDING:
    case NotificationType.COURSE_PENDING_APPROVAL:
      return 'warning';
    case NotificationType.COURSE_ENROLLMENT:
    case NotificationType.COURSE_UPDATE:
    case NotificationType.ASSIGNMENT_DUE:
    case NotificationType.EXAM_REMINDER:
      return 'info';
    case NotificationType.PROCTORING_ALERT:
      return 'error';
    case NotificationType.GRADE_POSTED:
      return 'success';
    default:
      return 'info';
  }
}

// Map backend notification types to frontend categories
function mapNotificationTypeToCategory(backendType: NotificationType): 'system' | 'user' | 'course' | 'payment' | 'security' | 'maintenance' {
  switch (backendType) {
    case NotificationType.TEACHER_PROFILE_PENDING:
    case NotificationType.TEACHER_PROFILE_APPROVED:
    case NotificationType.TEACHER_PROFILE_REJECTED:
      return 'user';
    case NotificationType.COURSE_PENDING_APPROVAL:
    case NotificationType.COURSE_APPROVED:
    case NotificationType.COURSE_REJECTED:
    case NotificationType.COURSE_ENROLLMENT:
    case NotificationType.COURSE_UPDATE:
    case NotificationType.ASSIGNMENT_DUE:
    case NotificationType.EXAM_REMINDER:
    case NotificationType.GRADE_POSTED:
      return 'course';
    case NotificationType.PROCTORING_ALERT:
      return 'security';
    default:
      return 'system';
  }
}

// Test endpoint to create a sample notification (Admin only)
export const createTestNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🧪 Creating test notification...');

    // Create a test notification for the current admin user
    const notification = new Notification({
      recipient: req.user?._id,
      type: NotificationType.TEACHER_PROFILE_PENDING,
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      data: {
        testData: 'This is test data',
        timestamp: new Date().toISOString()
      },
      priority: 'high',
      actionUrl: '/dashboard/admin/teachers',
      actionText: 'View Test',
      isRead: false
    });

    await notification.save();
    console.log('✅ Test notification created:', notification._id);

    res.status(201).json({
      success: true,
      data: { notification },
      message: 'Test notification created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating test notification:', error);
    next(error);
  }
};

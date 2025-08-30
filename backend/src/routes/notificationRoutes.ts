import express, { Request, Response } from 'express';
import { Notification } from '../models/Notification';
import { PushSubscription } from '../models/PushSubscription';
import { auth } from '../middleware/auth';
import mongoose from 'mongoose';

const router = express.Router();

// Get notifications for current user
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('type title message data isRead createdAt updatedAt');

    const total = await Notification.countDocuments({ recipient: userId });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get unread notifications count
router.get('/unread/count', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const unreadCount = await Notification.countDocuments({ 
      recipient: userId,
      isRead: false
    });

    res.status(200).json({
      success: true,
      data: { count: unreadCount }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const notificationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true },
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
      message: 'Failed to mark notification as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark all notifications as read
router.put('/read/all', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: `Marked ${result.modifiedCount} notifications as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete notification
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const notificationId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid notification ID'
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
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
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create notification (internal use - for testing or admin)
router.post('/', auth, async (req: Request, res: Response) => {
  try {
    const { recipient, type, title, message, data } = req.body;

    if (!recipient || !type || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: recipient, type, title, message'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(recipient)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipient ID'
      });
    }

    const notification = new Notification({
      recipient,
      type,
      title,
      message,
      data
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
      message: 'Failed to create notification',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Subscribe to push notifications
router.post('/subscribe', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    // Remove any existing subscription for this endpoint
    await PushSubscription.deleteOne({ endpoint: subscription.endpoint });

    // Create new subscription
    const pushSubscription = new PushSubscription({
      userId,
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      },
      userAgent: req.headers['user-agent']
    });

    await pushSubscription.save();

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to push notifications'
    });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to subscribe to push notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    // Remove subscription
    const result = await PushSubscription.deleteOne({
      endpoint: subscription.endpoint,
      userId
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe from push notifications',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's push subscriptions
router.get('/subscriptions', auth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const subscriptions = await PushSubscription.find({ userId })
      .select('endpoint expirationTime createdAt userAgent');

    res.status(200).json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Helper function to create notification (can be imported and used by other modules)
export const createNotification = async (notificationData: {
  recipient: string;
  type: 'connection_accepted' | 'connection_request' | 'message' | 'job_match' | 'event_reminder';
  title: string;
  message: string;
  data?: any;
}) => {
  try {
    const notification = new Notification(notificationData);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export default router;
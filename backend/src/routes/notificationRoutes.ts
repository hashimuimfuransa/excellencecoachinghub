import express from 'express';
import { auth } from '../middleware/auth';
import { notificationService } from '../services/notificationService';
import { pushNotificationService } from '../services/pushNotificationService';
import { PushSubscription } from '../models/PushSubscription';
import { validationResult, body, param, query } from 'express-validator';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req: any, res: any, next: any) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array()
    });
  }
  next();
};

/**
 * GET /api/notifications
 * Get user notifications with pagination
 */
router.get(
  '/',
  auth,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await notificationService.getUserNotifications(userId, page, limit);

      res.json({
        success: true,
        data: {
          notifications: result.notifications,
          totalCount: result.totalCount,
          unreadCount: result.unreadCount,
          hasMore: result.hasMore,
          currentPage: page,
          limit
        }
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get notifications'
      });
    }
  }
);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get(
  '/unread-count',
  auth,
  async (req: any, res: any) => {
    try {
      const userId = req.user._id;
      const count = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get unread count'
      });
    }
  }
);

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put(
  '/:id/read',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid notification ID')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const userId = req.user._id;
      const notificationId = req.params.id;

      const success = await notificationService.markAsRead(notificationId, userId);

      if (success) {
        res.json({
          success: true,
          message: 'Notification marked as read'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read'
      });
    }
  }
);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put(
  '/read-all',
  auth,
  async (req: any, res: any) => {
    try {
      const userId = req.user._id;
      const count = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: `${count} notifications marked as read`,
        data: { markedCount: count }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read'
      });
    }
  }
);

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete(
  '/:id',
  auth,
  [
    param('id').isMongoId().withMessage('Invalid notification ID')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const userId = req.user._id;
      const notificationId = req.params.id;

      const success = await notificationService.deleteNotification(notificationId, userId);

      if (success) {
        res.json({
          success: true,
          message: 'Notification deleted'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification'
      });
    }
  }
);

/**
 * POST /api/notifications/push-subscription
 * Subscribe to push notifications
 */
router.post(
  '/push-subscription',
  auth,
  [
    body('subscription').notEmpty().withMessage('Push subscription is required'),
    body('subscription.endpoint').isURL().withMessage('Valid endpoint URL is required'),
    body('subscription.keys').notEmpty().withMessage('Subscription keys are required'),
    body('subscription.keys.p256dh').notEmpty().withMessage('p256dh key is required'),
    body('subscription.keys.auth').notEmpty().withMessage('auth key is required')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const userId = req.user._id;
      const { subscription } = req.body;

      // Use upsert to avoid duplicate key errors
      const pushSubscription = await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        {
          userId,
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth
          },
          expirationTime: subscription.expirationTime
        },
        { 
          upsert: true, 
          new: true,
          runValidators: true
        }
      );

      res.status(201).json({
        success: true,
        message: 'Push subscription saved successfully'
      });
    } catch (error: any) {
      console.error('Error saving push subscription:', error);
      
      // Handle duplicate key error specifically
      if (error.code === 11000) {
        return res.json({
          success: true,
          message: 'Push subscription already exists'
        });
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to save push subscription'
      });
    }
  }
);

/**
 * DELETE /api/notifications/push-subscription
 * Unsubscribe from push notifications
 */
router.delete(
  '/push-subscription',
  auth,
  [
    body('endpoint').isURL().withMessage('Valid endpoint URL is required')
  ],
  handleValidationErrors,
  async (req: any, res: any) => {
    try {
      const userId = req.user._id;
      const { endpoint } = req.body;

      await PushSubscription.findOneAndDelete({
        userId,
        endpoint
      });

      res.json({
        success: true,
        message: 'Push subscription removed successfully'
      });
    } catch (error) {
      console.error('Error removing push subscription:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to remove push subscription'
      });
    }
  }
);

/**
 * GET /api/notifications/vapid-public-key
 * Get VAPID public key for push notifications
 */
router.get('/vapid-public-key', (req: any, res: any) => {
  try {
    const publicKey = pushNotificationService.getVapidPublicKey();
    res.json({
      success: true,
      data: { publicKey }
    });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get VAPID public key'
    });
  }
});

/**
 * POST /api/notifications/test
 * Send test notification (development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.post(
    '/test',
    auth,
    [
      body('title').notEmpty().withMessage('Title is required'),
      body('message').notEmpty().withMessage('Message is required'),
      body('type').optional().isIn(['connection_accepted', 'connection_request', 'message', 'job_match', 'event_reminder'])
    ],
    handleValidationErrors,
    async (req: any, res: any) => {
      try {
        const userId = req.user._id;
        const { title, message, type = 'message' } = req.body;

        await notificationService.sendRealTimeNotification({
          recipient: userId,
          type,
          title,
          message
        });

        res.json({
          success: true,
          message: 'Test notification sent'
        });
      } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to send test notification'
        });
      }
    }
  );
}

export default router;
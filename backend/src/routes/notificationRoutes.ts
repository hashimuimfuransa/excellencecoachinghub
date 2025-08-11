import express from 'express';
import {
  getNotifications,
  getStats,
  getUnreadCount,
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  archiveNotification,
  deleteNotification,
  createNotification,
  sendBulkNotifications,
  getSystemAlerts,
  createTestNotification
} from '../controllers/notificationController';
import { protect, authorize } from '../middleware/auth';
import { UserRole } from '../../../shared/types';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// User notification routes
router.get('/', getNotifications);
router.get('/stats', getStats);
router.get('/unread-count', getUnreadCount);
router.patch('/mark-read', markMultipleAsRead);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markAsRead);
router.patch('/:id/archive', archiveNotification);
router.delete('/:id', deleteNotification);

// Admin-only routes
router.post('/', authorize(UserRole.ADMIN), createNotification);
router.post('/bulk', authorize(UserRole.ADMIN), sendBulkNotifications);
router.post('/test', authorize(UserRole.ADMIN), createTestNotification);
router.get('/system-alerts', authorize(UserRole.ADMIN), getSystemAlerts);

export default router;

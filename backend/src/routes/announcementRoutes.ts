import express from 'express';
import {
  getCourseAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  markAsRead,
  markAsUnread,
  getReadStatus,
  getUnreadCount,
  searchAnnouncements,
  getPinnedAnnouncements,
  togglePinStatus,
  getAnnouncementStats,
  bulkOperations
} from '../controllers/announcementController';
import { protect, authorize } from '../middleware/auth';
import { upload } from '../utils/fileUpload';
import { UserRole } from '../../../shared/types';

const router = express.Router();

// Apply authentication to all routes
router.use(protect);

// Course announcements routes
router.get('/course/:courseId', getCourseAnnouncements);
router.get('/course/:courseId/read-status', getReadStatus);
router.get('/course/:courseId/unread-count', getUnreadCount);
router.get('/course/:courseId/search', searchAnnouncements);
router.get('/course/:courseId/pinned', getPinnedAnnouncements);

// Individual announcement routes
router.get('/:id', getAnnouncementById);
router.get('/:id/stats', authorize(UserRole.TEACHER), getAnnouncementStats);

// Create announcement (instructors only)
router.post('/', 
  authorize(UserRole.TEACHER), 
  upload.array('attachments', 5), 
  createAnnouncement
);

// Update announcement (instructors only)
router.put('/:id', 
  authorize(UserRole.TEACHER), 
  upload.array('attachments', 5), 
  updateAnnouncement
);

// Delete announcement (instructors only)
router.delete('/:id', authorize(UserRole.TEACHER), deleteAnnouncement);

// Read/unread operations (students and instructors)
router.post('/:id/read', markAsRead);
router.delete('/:id/read', markAsUnread);

// Pin/unpin operations (instructors only)
router.patch('/:id/pin', authorize(UserRole.TEACHER), togglePinStatus);

// Bulk operations (instructors only)
router.post('/bulk', authorize(UserRole.TEACHER), bulkOperations);

export default router;
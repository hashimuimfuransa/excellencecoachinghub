import { Router } from 'express';
import {
  getDashboardAnalytics,
  getRecentUsers,
  getUserAnalytics,
  getCourseAnalytics,
  getPerformanceAnalytics,
  getSystemAlerts,
  getPendingApprovals
} from '../controllers/analyticsController';
import { protect } from '../middleware/auth';
import { requireAdmin } from '../middleware/roleAuth';

const router = Router();

// All routes require authentication and admin role
router.use(protect);
router.use(requireAdmin);

// Analytics routes
router.get('/dashboard', getDashboardAnalytics);
router.get('/recent-users', getRecentUsers);
router.get('/users', getUserAnalytics);
router.get('/courses', getCourseAnalytics);
router.get('/performance', getPerformanceAnalytics);
router.get('/alerts', getSystemAlerts);
router.get('/pending-approvals', getPendingApprovals);

export default router;

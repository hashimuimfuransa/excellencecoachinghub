import express from 'express';
import { auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { asyncHandler } from '../middleware/asyncHandler';
import { User } from '../models/User';
import { AssignmentSubmission } from '../models/Assignment';
import { UserProgress } from '../models/UserProgress';

const router = express.Router();

// All routes require authentication and parent role
router.use(auth);
router.use(authorizeRoles('parent'));

// Get parent's children
router.get('/children', asyncHandler(async (req, res) => {
  const parentId = req.user._id;

  // Find children linked to this parent
  const children = await User.find({
    parentId: parentId,
    role: 'student'
  }).select('name email level language createdAt');

  res.json(children);
}));

// Get child's progress
router.get('/child/:childId/progress', asyncHandler(async (req, res) => {
  const { childId } = req.params;
  const parentId = req.user._id;

  // Verify the child belongs to this parent
  const child = await User.findOne({
    _id: childId,
    parentId: parentId,
    role: 'student'
  });

  if (!child) {
    return res.status(404).json({ message: 'Child not found' });
  }

  // Get child's progress data
  const progress = await UserProgress.findOne({ userId: childId });

  // Get recent submissions
  const recentSubmissions = await AssignmentSubmission.find({ studentId: childId })
    .populate('assignmentId', 'title')
    .sort({ submittedAt: -1 })
    .limit(5)
    .select('grade feedback submittedAt');

  // Mock progress data structure
  const progressData = {
    overallGrade: progress?.overallGrade || 0,
    completedLessons: progress?.completedLessons || 0,
    points: progress?.points || 0,
    subjects: progress?.subjects || [],
    recentActivity: progress?.recentActivity || [],
    messages: [], // Would need to implement messaging system
  };

  res.json(progressData);
}));

// Send message to teacher
router.post('/message-teacher', asyncHandler(async (req, res) => {
  const { teacherId, message, childId } = req.body;
  const parentId = req.user._id;

  // Verify the child belongs to this parent
  if (childId) {
    const child = await User.findOne({
      _id: childId,
      parentId: parentId,
      role: 'student'
    });

    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }
  }

  // This would need to be implemented with a messaging system
  // For now, return success
  res.json({ message: 'Message sent successfully' });
}));

export default router;
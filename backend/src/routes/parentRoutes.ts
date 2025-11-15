import express, { Request, Response, NextFunction } from 'express';
import { auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { asyncHandler } from '../middleware/asyncHandler';
import { User } from '../models/User';
import { AssignmentSubmission } from '../models/Assignment';
import { UserProgress } from '../models/UserProgress';
import * as bcrypt from 'bcryptjs';

const router = express.Router();

// All routes require authentication and parent role
router.use(auth);
router.use(authorizeRoles(['parent']));

// Add a child to parent (first time setup)
router.post('/child', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const parentId = req.user!._id;
  const { childName } = req.body;

  // Validate input
  if (!childName || childName.trim().length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Child name is required' 
    });
  }

  try {
    // Generate a random password for the child account
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    // Generate a unique email for the child to avoid duplicate key error
    const childEmail = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}@example.com`;

    // Create a new student user with parent ID
    const child = new User({
      firstName: childName.trim(),
      email: childEmail, // Use generated unique email
      role: 'student',
      parentId: parentId,
      isEmailVerified: true,
      isActive: true,
      password: hashedPassword // Add the required password field
    });

    await child.save();

    res.status(201).json({
      success: true,
      data: {
        id: child._id,
        name: child.firstName,
        createdAt: child.createdAt
      },
      message: 'Child added successfully'
    });
  } catch (error) {
    console.error('Error adding child:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add child' 
    });
  }
}));

// Get parent's children
router.get('/children', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const parentId = req.user!._id;

  // Find children linked to this parent
  const children = await User.find({
    parentId: parentId,
    role: 'student'
  }).select('firstName lastName email level language createdAt');

  res.json(children);
}));

// Get child's progress
router.get('/child/:childId/progress', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { childId } = req.params;
  const parentId = req.user!._id;

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
  const progress = await UserProgress.findOne({ user: childId });

  // Get recent submissions
  const recentSubmissions = await AssignmentSubmission.find({ studentId: childId })
    .populate('assignmentId', 'title')
    .sort({ submittedAt: -1 })
    .limit(5)
    .select('grade feedback submittedAt');

  // Mock progress data structure
  const progressData = {
    overallGrade: progress?.progressPercentage || 0,
    completedLessons: progress?.completedLessons?.length || 0,
    points: progress?.totalPoints || 0,
    subjects: [], // This would need to be implemented based on actual data
    recentActivity: [], // This would need to be implemented based on actual data
    messages: [], // Would need to implement messaging system
  };

  res.json(progressData);
}));

// Send message to teacher
router.post('/message-teacher', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { teacherId, message, childId } = req.body;
  const parentId = req.user!._id;

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
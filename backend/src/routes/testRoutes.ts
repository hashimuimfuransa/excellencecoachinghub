import { Router } from 'express';
import { protect } from '../middleware/auth';
import { CourseEnrollment } from '../models/CourseEnrollment';
import { Course } from '../models/Course';

const router = Router();

// Test endpoint to check enrollment system
router.get('/enrollment-test', protect, async (req, res) => {
  try {
    const userId = req.user?._id;
    
    // Get user's enrollments
    const enrollments = await CourseEnrollment.find({ student: userId })
      .populate('course', 'title status')
      .limit(5);
    
    // Get available courses
    const availableCourses = await Course.find({ status: 'approved' })
      .select('title notesPrice liveSessionPrice enrollmentDeadline')
      .limit(5);
    
    res.json({
      success: true,
      data: {
        userRole: req.user?.role,
        enrollmentCount: enrollments.length,
        enrollments: enrollments.map(e => ({
          courseTitle: e.course?.title,
          enrollmentType: e.enrollmentType,
          paymentStatus: e.paymentStatus,
          enrolledAt: e.enrolledAt
        })),
        availableCourses: availableCourses.map(c => ({
          title: c.title,
          notesPrice: c.notesPrice,
          liveSessionPrice: c.liveSessionPrice,
          enrollmentDeadline: c.enrollmentDeadline
        }))
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Test failed',
      details: error.message
    });
  }
});

export default router;
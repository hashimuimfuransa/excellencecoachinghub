import { Request, Response, NextFunction } from 'express';
import { TeacherProfile } from '../models/TeacherProfile';

interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: string;
    email: string;
  };
}

// Middleware to check if teacher profile is approved
export const requireApprovedTeacherProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Only apply to teachers
    if (req.user?.role !== 'teacher') {
      return next();
    }

    // Check if teacher has a profile
    const teacherProfile = await TeacherProfile.findOne({ userId: req.user._id });
    
    if (!teacherProfile) {
      return res.status(403).json({
        success: false,
        error: 'Teacher profile not found. Please complete your profile first.',
        requiresProfileCompletion: true
      });
    }

    // Check if profile is approved
    if (teacherProfile.profileStatus !== 'approved') {
      let message = 'Your teacher profile is not approved yet.';
      
      switch (teacherProfile.profileStatus) {
        case 'incomplete':
          message = 'Please complete your teacher profile and submit it for approval.';
          break;
        case 'pending':
          message = 'Your teacher profile is pending approval. Please wait for admin review.';
          break;
        case 'rejected':
          message = `Your teacher profile was rejected. Reason: ${teacherProfile.rejectionReason || 'No reason provided'}. Please update your profile and resubmit.`;
          break;
      }

      return res.status(403).json({
        success: false,
        error: message,
        profileStatus: teacherProfile.profileStatus,
        rejectionReason: teacherProfile.rejectionReason,
        requiresProfileApproval: true
      });
    }

    // Profile is approved, continue
    next();
  } catch (error) {
    console.error('Error checking teacher profile approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify teacher profile status'
    });
  }
};

// Middleware to get teacher profile status (non-blocking)
export const getTeacherProfileStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user?.role === 'teacher') {
      const teacherProfile = await TeacherProfile.findOne({ userId: req.user._id });
      
      // Add profile status to request for use in controllers
      (req as any).teacherProfileStatus = teacherProfile?.profileStatus || 'incomplete';
      (req as any).teacherProfile = teacherProfile;
    }
    
    next();
  } catch (error) {
    console.error('Error getting teacher profile status:', error);
    // Don't block the request, just continue without profile status
    next();
  }
};
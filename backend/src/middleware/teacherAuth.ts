import { Request, Response, NextFunction } from 'express';
import { TeacherProfile } from '../models/TeacherProfile';
import { UserRole } from '../../../shared/types';

/**
 * Middleware to check if teacher profile is approved
 * Only allows teachers with approved profiles to proceed
 */
export const requireApprovedTeacher = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Check if user is a teacher
    if (req.user.role !== UserRole.TEACHER) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Teacher role required.'
      });
      return;
    }

    // Find teacher profile
    const teacherProfile = await TeacherProfile.findByUserId(req.user._id.toString());
    
    if (!teacherProfile) {
      res.status(403).json({
        success: false,
        error: 'Teacher profile not found. Please create your profile first.',
        code: 'PROFILE_NOT_FOUND'
      });
      return;
    }

    // Check if profile is approved
    if (teacherProfile.profileStatus !== 'approved') {
      let message = '';
      let code = '';
      
      switch (teacherProfile.profileStatus) {
        case 'incomplete':
          message = 'Please complete your teacher profile before creating courses.';
          code = 'PROFILE_INCOMPLETE';
          break;
        case 'pending':
          message = 'Your teacher profile is pending approval. You cannot create courses until your profile is approved.';
          code = 'PROFILE_PENDING';
          break;
        case 'rejected':
          message = 'Your teacher profile has been rejected. Please update your profile and resubmit for approval.';
          code = 'PROFILE_REJECTED';
          break;
        default:
          message = 'Your teacher profile is not approved. Please contact support.';
          code = 'PROFILE_NOT_APPROVED';
      }

      res.status(403).json({
        success: false,
        error: message,
        code,
        profileStatus: teacherProfile.profileStatus,
        submittedAt: teacherProfile.submittedAt,
        reviewedAt: teacherProfile.reviewedAt,
        adminFeedback: teacherProfile.adminFeedback,
        rejectionReason: teacherProfile.rejectionReason
      });
      return;
    }

    // Profile is approved, proceed to next middleware
    next();
  } catch (error) {
    console.error('Error in requireApprovedTeacher middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while checking teacher profile status'
    });
  }
};

/**
 * Middleware to check if teacher profile exists (for profile-related operations)
 */
export const requireTeacherProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    // Check if user is a teacher
    if (req.user.role !== UserRole.TEACHER) {
      res.status(403).json({
        success: false,
        error: 'Access denied. Teacher role required.'
      });
      return;
    }

    // Find teacher profile
    const teacherProfile = await TeacherProfile.findByUserId(req.user._id.toString());
    
    if (!teacherProfile) {
      res.status(404).json({
        success: false,
        error: 'Teacher profile not found. Please create your profile first.',
        code: 'PROFILE_NOT_FOUND'
      });
      return;
    }

    // Add profile to request for use in controllers
    req.teacherProfile = teacherProfile;
    next();
  } catch (error) {
    console.error('Error in requireTeacherProfile middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while checking teacher profile'
    });
  }
};

/**
 * Middleware to get teacher profile status (non-blocking)
 * Adds profile info to request if available
 */
export const getTeacherProfileStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user && req.user.role === UserRole.TEACHER) {
      const teacherProfile = await TeacherProfile.findByUserId(req.user._id.toString());
      if (teacherProfile) {
        req.teacherProfile = teacherProfile;
      }
    }
    next();
  } catch (error) {
    console.error('Error in getTeacherProfileStatus middleware:', error);
    // Don't block the request, just log the error
    next();
  }
};

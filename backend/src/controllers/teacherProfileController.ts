import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { TeacherProfile } from '../models/TeacherProfile';
import { User } from '../models/User';
import { UserRole } from '../../../shared/types';
import { notificationService } from '../services/notificationService';

// Get teacher profile (for the logged-in teacher)
export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    let profile = await TeacherProfile.findByUserId(userId);
    
    // If profile doesn't exist, create an incomplete one
    if (!profile) {
      profile = new TeacherProfile({
        userId,
        specialization: [],
        experience: 0,
        education: [],
        certifications: [],
        skills: [],
        languages: [],
        teachingAreas: [],
        preferredLevels: [],
        documents: [],
        profileStatus: 'incomplete'
      });
      await profile.save();
    }

    res.status(200).json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

// Update teacher profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('=== UPDATE PROFILE REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User ID:', req.user?._id);
    console.log('User role:', req.user?.role);
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const userId = req.user?._id;
    const updateData = req.body;

    console.log('Looking for profile with userId:', userId);
    let profile = await TeacherProfile.findOne({ userId });
    console.log('Found existing profile:', profile ? 'Yes' : 'No');
    
    if (!profile) {
      // Create new profile if it doesn't exist
      profile = new TeacherProfile({
        userId,
        ...updateData,
        profileStatus: 'incomplete'
      });
    } else {
      // Update existing profile
      Object.assign(profile, updateData);
      
      // If profile was rejected and now being updated, reset to incomplete
      if (profile.profileStatus === 'rejected') {
        profile.profileStatus = 'incomplete';
        profile.rejectionReason = undefined;
        profile.adminFeedback = undefined;
      }
    }

    console.log('Saving profile...');
    await profile.save();
    console.log('Profile saved successfully');

    res.status(200).json({
      success: true,
      data: { profile },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Submit profile for approval
export const submitForApproval = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    
    const profile = await TeacherProfile.findOne({ userId });
    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
      return;
    }

    // Validate required fields for submission
    const requiredFields = ['specialization', 'experience', 'education', 'teachingAreas'];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!profile[field as keyof typeof profile] || 
          (Array.isArray(profile[field as keyof typeof profile]) && 
           (profile[field as keyof typeof profile] as any[]).length === 0)) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      res.status(400).json({
        success: false,
        error: 'Profile incomplete',
        message: `Please complete the following fields: ${missingFields.join(', ')}`
      });
      return;
    }

    profile.profileStatus = 'pending';
    profile.submittedAt = new Date();
    await profile.save();

    // Notify admins about pending teacher profile approval
    try {
      console.log('🔔 Starting notification process for teacher profile submission...');
      const teacher = await User.findById(userId).select('firstName lastName');
      console.log('👤 Teacher found:', teacher);

      if (teacher) {
        console.log('📤 Calling notificationService.notifyAdminsTeacherProfilePending...');
        await notificationService.notifyAdminsTeacherProfilePending(
          (userId as any).toString(),
          `${teacher.firstName} ${teacher.lastName}`
        );
        console.log(`✅ Successfully notified admins about pending teacher profile: ${teacher.firstName} ${teacher.lastName}`);
      } else {
        console.log('❌ Teacher not found for notification');
      }
    } catch (notificationError) {
      console.error('❌ Failed to send teacher profile notification:', notificationError);
      console.error('❌ Notification error stack:', (notificationError as any)?.stack);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: { profile },
      message: 'Profile submitted for approval successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get all teacher profiles (Admin only)
export const getAllProfiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string || '';

    // Build filter
    const filter: any = {};
    if (status && status !== 'all') {
      filter.profileStatus = status;
    }

    // Build search query
    let profiles;
    if (search) {
      profiles = await TeacherProfile.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $match: {
            ...filter,
            $or: [
              { 'user.firstName': { $regex: search, $options: 'i' } },
              { 'user.lastName': { $regex: search, $options: 'i' } },
              { 'user.email': { $regex: search, $options: 'i' } },
              { specialization: { $in: [new RegExp(search, 'i')] } },
              { teachingAreas: { $in: [new RegExp(search, 'i')] } }
            ]
          }
        },
        { $sort: { submittedAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit }
      ]);
    } else {
      profiles = await TeacherProfile.find(filter)
        .populate('userId', 'firstName lastName email')
        .sort({ submittedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const totalProfiles = await TeacherProfile.countDocuments(filter);
    const totalPages = Math.ceil(totalProfiles / limit);

    res.status(200).json({
      success: true,
      data: {
        profiles,
        pagination: {
          currentPage: page,
          totalPages,
          totalProfiles,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher profile by ID (Admin only)
export const getProfileById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    const profile = await TeacherProfile.findById(id)
      .populate('userId', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName');

    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    next(error);
  }
};

// Approve teacher profile (Admin only)
export const approveProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    
    const profile = await TeacherProfile.findById(id);
    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
      return;
    }

    // Update profile status
    profile.profileStatus = 'approved';
    profile.reviewedAt = new Date();
    profile.reviewedBy = req.user?._id;
    if (feedback) {
      profile.adminFeedback = feedback;
    }
    await profile.save();

    // Activate the user account
    await User.findByIdAndUpdate(profile.userId, {
      isActive: true,
      isEmailVerified: true
    });

    // Notify teacher about profile approval
    try {
      await notificationService.notifyTeacherProfileStatus(
        profile.userId.toString(),
        'approved',
        (req.user?._id as any)?.toString() || '',
        feedback
      );
      console.log(`✅ Notified teacher about profile approval: ${profile.userId}`);
    } catch (notificationError) {
      console.error('❌ Failed to send profile approval notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: { profile },
      message: 'Teacher profile approved and account activated'
    });
  } catch (error) {
    next(error);
  }
};

// Reject teacher profile (Admin only)
export const rejectProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, feedback } = req.body;
    
    if (!reason) {
      res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
      return;
    }

    const profile = await TeacherProfile.findById(id);
    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
      return;
    }

    // Update profile status
    profile.profileStatus = 'rejected';
    profile.reviewedAt = new Date();
    profile.reviewedBy = req.user?._id as any;
    profile.rejectionReason = reason;
    if (feedback) {
      profile.adminFeedback = feedback;
    }
    await profile.save();

    // Notify teacher about profile rejection
    try {
      await notificationService.notifyTeacherProfileStatus(
        profile.userId.toString(),
        'rejected',
        (req.user?._id as any)?.toString() || '',
        feedback || reason
      );
      console.log(`✅ Notified teacher about profile rejection: ${profile.userId}`);
    } catch (notificationError) {
      console.error('❌ Failed to send profile rejection notification:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({
      success: true,
      data: { profile },
      message: 'Teacher profile rejected'
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher profile statistics (Admin only)
export const getProfileStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalProfiles = await TeacherProfile.countDocuments();
    const pendingProfiles = await TeacherProfile.countDocuments({ profileStatus: 'pending' });
    const approvedProfiles = await TeacherProfile.countDocuments({ profileStatus: 'approved' });
    const rejectedProfiles = await TeacherProfile.countDocuments({ profileStatus: 'rejected' });
    const incompleteProfiles = await TeacherProfile.countDocuments({ profileStatus: 'incomplete' });

    // Get recent submissions
    const recentSubmissions = await TeacherProfile.find({ profileStatus: 'pending' })
      .populate('userId', 'firstName lastName email')
      .sort({ submittedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalProfiles,
        pendingProfiles,
        approvedProfiles,
        rejectedProfiles,
        incompleteProfiles,
        recentSubmissions
      }
    });
  } catch (error) {
    next(error);
  }
};

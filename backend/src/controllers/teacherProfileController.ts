import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { TeacherProfile } from '../models/TeacherProfile';
import { User } from '../models/User';
import { UserRole } from '../../../shared/types';
import { notificationService } from '../services/notificationService';
import { TeacherNotificationService } from '../services/teacherNotificationService';
import { uploadDocumentToCloudinary } from '../config/cloudinary';

// Get teacher profile (for the logged-in teacher)
export const getMyProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('=== GET MY PROFILE REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User ID:', req.user?._id);
    console.log('User role:', req.user?.role);
    console.log('User email:', req.user?.email);
    console.log('User firstName:', req.user?.firstName);
    console.log('User lastName:', req.user?.lastName);
    console.log('Full req.user object:', JSON.stringify(req.user, null, 2));
    
    const userId = req.user?._id;
    
    if (!userId) {
      console.error('❌ No user ID found in request');
      res.status(400).json({
        success: false,
        error: 'User ID not found in request'
      });
      return;
    }
    
    console.log('🔍 Searching for profile with userId:', userId);
    let profile = await TeacherProfile.findByUserId(userId);
    console.log('🔍 Profile found:', profile ? 'YES' : 'NO');
    
    if (profile) {
      console.log('🔍 Profile ID:', profile._id);
      console.log('🔍 Profile userId:', profile.userId);
      console.log('🔍 Profile status:', profile.profileStatus);
      console.log('🔍 Profile keys:', Object.keys(profile.toObject()));
    } else {
      console.log('🔍 No profile found, creating new one...');
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

    console.log('✅ Profile retrieved successfully:', profile._id);
    console.log('🔍 Backend: Profile object keys:', Object.keys(profile.toObject()));
    console.log('🔍 Backend: Profile status:', profile.profileStatus);
    console.log('🔍 Backend: Profile status type:', typeof profile.profileStatus);
    console.log('🔍 Backend: Full profile object:', JSON.stringify(profile.toObject(), null, 2));
    
    res.status(200).json({
      success: true,
      data: { profile }
    });
  } catch (error) {
    console.error('❌ Error in getMyProfile:', error);
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
    
    // Clean up empty strings for optional fields that have validation
    if (updateData.nationalId === '') {
      updateData.nationalId = undefined;
    }
    
    // Clean up empty strings in address fields
    if (updateData.address) {
      Object.keys(updateData.address).forEach(key => {
        if (updateData.address[key] === '') {
          updateData.address[key] = undefined;
        }
      });
    }
    
    // Clean up empty strings in social links
    if (updateData.socialLinks) {
      Object.keys(updateData.socialLinks).forEach(key => {
        if (updateData.socialLinks[key] === '') {
          updateData.socialLinks[key] = undefined;
        }
      });
    }

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
      const user = await User.findById(profile.userId);
      if (user) {
        await TeacherNotificationService.sendApprovalNotification({
          teacherName: `${user.firstName} ${user.lastName}`,
          teacherEmail: user.email,
          adminName: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName}` : 'Admin',
          adminFeedback: feedback
        });
      }
      
      // Also send in-app notification
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
      const user = await User.findById(profile.userId);
      if (user) {
        await TeacherNotificationService.sendRejectionNotification({
          teacherName: `${user.firstName} ${user.lastName}`,
          teacherEmail: user.email,
          adminName: req.user?.firstName ? `${req.user.firstName} ${req.user.lastName}` : 'Admin',
          rejectionReason: reason,
          adminFeedback: feedback
        });
      }
      
      // Also send in-app notification
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

// Upload CV document
export const uploadCV = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No CV file uploaded'
      });
      return;
    }

    const userId = req.user?._id;
    
    // Find or create teacher profile
    let profile = await TeacherProfile.findOne({ userId });
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
    }

    // Upload CV to Cloudinary
    const uploadResult = await uploadDocumentToCloudinary(
      req.file.buffer,
      userId,
      req.file.originalname,
      `excellence-coaching-hub/teacher-profiles/${userId}/cv`
    );

    console.log('📄 Cloudinary upload result:', {
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      size: uploadResult.size
    });

    // Update profile with CV info
    profile.cvDocument = {
      filename: uploadResult.publicId,
      originalName: req.file.originalname,
      url: uploadResult.url,
      uploadedAt: new Date()
    };

    console.log('📄 Profile cvDocument updated:', profile.cvDocument);

    await profile.save();

    console.log('📄 Profile saved with CV document');

    res.status(200).json({
      success: true,
      data: { 
        cvDocument: profile.cvDocument,
        profile 
      },
      message: 'CV uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading CV:', error);
    next(error);
  }
};

// Submit profile for review
export const submitProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('=== SUBMIT PROFILE REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('User ID:', req.user?._id);
    console.log('User role:', req.user?.role);
    
    const userId = req.user?._id;
    
    if (!userId) {
      console.error('❌ No user ID found in request');
      res.status(400).json({
        success: false,
        error: 'User ID not found in request'
      });
      return;
    }
    
    const profile = await TeacherProfile.findOne({ userId });
    if (!profile) {
      console.error('❌ Profile not found for user:', userId);
      res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
      return;
    }

    console.log('📋 Profile found:', profile._id);
    console.log('📋 Profile status:', profile.profileStatus);

    // Validate required fields for submission
    const requiredFields = [
      'specialization',
      'bio',
      'experience',
      'education',
      'teachingAreas',
      'hourlyRate'
    ];

    const missingFields = requiredFields.filter(field => {
      const value = profile[field as keyof typeof profile];
      console.log(`📋 Field ${field}:`, value);
      return !value || (Array.isArray(value) && value.length === 0);
    });

    console.log('📋 Missing fields:', missingFields);

    if (missingFields.length > 0) {
      console.error('❌ Profile incomplete, missing fields:', missingFields);
      res.status(400).json({
        success: false,
        error: 'Profile incomplete',
        missingFields,
        message: `Please complete the following fields: ${missingFields.join(', ')}`
      });
      return;
    }

    // Update profile status
    profile.profileStatus = 'pending';
    profile.submittedAt = new Date();
    await profile.save();

    console.log('✅ Profile status updated to pending');

    // Send submission confirmation email
    try {
      const user = await User.findById(userId);
      if (user) {
        await TeacherNotificationService.sendSubmissionConfirmation({
          teacherName: `${user.firstName} ${user.lastName}`,
          teacherEmail: user.email
        });
        console.log('✅ Submission confirmation email sent');
      }
    } catch (emailError) {
      console.error('❌ Failed to send submission confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      data: { profile },
      message: 'Profile submitted for review successfully'
    });
  } catch (error) {
    console.error('❌ Error in submitProfile:', error);
    next(error);
  }
};

// Upload profile picture
export const uploadProfilePicture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No profile picture uploaded'
      });
      return;
    }

    const userId = req.user?._id;
    
    // Find or create teacher profile
    let profile = await TeacherProfile.findOne({ userId });
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
    }

    // Upload profile picture to Cloudinary
    const uploadResult = await uploadDocumentToCloudinary(
      req.file.buffer,
      userId,
      req.file.originalname,
      `excellence-coaching-hub/teacher-profiles/${userId}/profile-picture`
    );

    // Update profile with profile picture URL
    profile.profilePicture = uploadResult.url;
    await profile.save();

    res.status(200).json({
      success: true,
      data: { 
        profilePicture: profile.profilePicture,
        profile 
      },
      message: 'Profile picture uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    next(error);
  }
};

// Download teacher documents (Admin only)
export const downloadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { profileId, documentType } = req.params;
    
    const profile = await TeacherProfile.findById(profileId);
    if (!profile) {
      res.status(404).json({
        success: false,
        error: 'Profile not found'
      });
      return;
    }

    let documentUrl = '';
    let filename = '';

    if (documentType === 'cv' && profile.cvDocument) {
      documentUrl = profile.cvDocument.url;
      filename = profile.cvDocument.originalName;
    } else {
      // Find document in documents array
      const document = profile.documents.find(doc => doc.type === documentType);
      if (document) {
        documentUrl = document.url;
        filename = document.originalName;
      }
    }

    if (!documentUrl) {
      res.status(404).json({
        success: false,
        error: 'Document not found'
      });
      return;
    }

    // Redirect to the document URL for download
    res.redirect(documentUrl);
  } catch (error) {
    next(error);
  }
};

export const uploadDiploma = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No diploma file uploaded'
      });
      return;
    }

    const userId = req.user?._id;
    const educationIndex = parseInt(req.body.educationIndex || '0');
    
    let profile = await TeacherProfile.findOne({ userId });
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
    }

    const uploadResult = await uploadDocumentToCloudinary(
      req.file.buffer,
      userId,
      req.file.originalname,
      `excellence-coaching-hub/teacher-profiles/${userId}/education/${educationIndex}/diploma`
    );

    if (profile.education && profile.education[educationIndex]) {
      profile.education[educationIndex].diploma = {
        filename: uploadResult.publicId,
        originalName: req.file.originalname,
        url: uploadResult.url,
        uploadedAt: new Date()
      };
    }

    await profile.save();

    res.status(200).json({
      success: true,
      data: { 
        diploma: profile.education?.[educationIndex]?.diploma,
        profile 
      },
      message: 'Diploma uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading diploma:', error);
    next(error);
  }
};

export const uploadCertificate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No certificate file uploaded'
      });
      return;
    }

    const userId = req.user?._id;
    const educationIndex = parseInt(req.body.educationIndex || '0');
    
    let profile = await TeacherProfile.findOne({ userId });
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
    }

    const uploadResult = await uploadDocumentToCloudinary(
      req.file.buffer,
      userId,
      req.file.originalname,
      `excellence-coaching-hub/teacher-profiles/${userId}/education/${educationIndex}/certificate`
    );

    if (profile.education && profile.education[educationIndex]) {
      profile.education[educationIndex].certificate = {
        filename: uploadResult.publicId,
        originalName: req.file.originalname,
        url: uploadResult.url,
        uploadedAt: new Date()
      };
    }

    await profile.save();

    res.status(200).json({
      success: true,
      data: { 
        certificate: profile.education?.[educationIndex]?.certificate,
        profile 
      },
      message: 'Certificate uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading certificate:', error);
    next(error);
  }
};

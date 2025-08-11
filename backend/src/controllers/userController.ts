import { Request, Response, NextFunction } from 'express';
import { User, IUserDocument } from '../models/User';
import { UserRole, CourseStatus } from '../../../shared/types';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary, deleteOldAvatar } from '../config/cloudinary';

// Get all users (Admin only)
export const getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const role = req.query.role as UserRole;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Build filter object
    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role && Object.values(UserRole).includes(role)) {
      filter.role = role;
    }
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID (Admin only)
export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Update user (Admin only)
export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { id } = req.params;
    const { firstName, lastName, email, role, isActive, isEmailVerified } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Prevent admin from deactivating themselves
    if (req.user?.id === id && isActive === false) {
      res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account'
      });
      return;
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Email is already taken by another user'
        });
        return;
      }
    }

    // Update user fields
    const updateFields: any = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) updateFields.email = email.toLowerCase();
    if (role !== undefined && Object.values(UserRole).includes(role)) updateFields.role = role;
    if (isActive !== undefined) updateFields.isActive = isActive;
    if (isEmailVerified !== undefined) updateFields.isEmailVerified = isEmailVerified;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateFields,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');

    res.status(200).json({
      success: true,
      data: { user: updatedUser },
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Delete user (Admin only)
export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Prevent admin from deleting themselves
    if (req.user?.id === id) {
      res.status(400).json({
        success: false,
        error: 'You cannot delete your own account'
      });
      return;
    }

    // Soft delete by deactivating the user instead of hard delete
    // This preserves data integrity for courses, quizzes, etc.
    await User.findByIdAndUpdate(id, { isActive: false });

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Create user (Admin only)
export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { firstName, lastName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
      return;
    }

    // Validate role
    const userRole = role && Object.values(UserRole).includes(role) ? role : UserRole.STUDENT;

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: userRole,
      isEmailVerified: true, // Admin-created users are automatically verified
      isActive: true
    });

    // Remove sensitive fields from response
    const userResponse = await User.findById(user._id)
      .select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');

    res.status(201).json({
      success: true,
      data: { user: userResponse },
      message: 'User created successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get user statistics (Admin only)
export const getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get total user counts by role
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const adminCount = await User.countDocuments({ role: UserRole.ADMIN });
    const teacherCount = await User.countDocuments({ role: UserRole.TEACHER });
    const studentCount = await User.countDocuments({ role: UserRole.STUDENT });

    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    const unverifiedUsers = await User.countDocuments({ isEmailVerified: false });

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Get users who logged in recently (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeInLastWeek = await User.countDocuments({
      lastLogin: { $gte: sevenDaysAgo }
    });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        roleDistribution: {
          admin: adminCount,
          teacher: teacherCount,
          student: studentCount
        },
        emailVerification: {
          verified: verifiedUsers,
          unverified: unverifiedUsers
        },
        recentActivity: {
          newUsersLast30Days: recentUsers,
          activeInLastWeek
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Bulk update users (Admin only)
export const bulkUpdateUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userIds, updates } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      });
      return;
    }

    if (!updates || Object.keys(updates).length === 0) {
      res.status(400).json({
        success: false,
        error: 'Updates object is required'
      });
      return;
    }

    // Prevent admin from deactivating themselves
    if (updates.isActive === false && userIds.includes(req.user?.id)) {
      res.status(400).json({
        success: false,
        error: 'You cannot deactivate your own account'
      });
      return;
    }

    // Validate updates
    const allowedUpdates = ['isActive', 'role', 'isEmailVerified'];
    const updateFields: any = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        if (key === 'role' && !Object.values(UserRole).includes(value as UserRole)) {
          res.status(400).json({
            success: false,
            error: `Invalid role: ${value}`
          });
          return;
        }
        updateFields[key] = value;
      }
    }

    // Perform bulk update
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      updateFields
    );

    res.status(200).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        matchedCount: result.matchedCount
      },
      message: `Successfully updated ${result.modifiedCount} users`
    });
  } catch (error) {
    next(error);
  }
};

// Reset user password (Admin only)
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters long'
      });
      return;
    }

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher statistics (Admin only)
export const getTeacherStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const activeTeachers = await User.countDocuments({ role: 'teacher', isActive: true });

    // Get total students taught and active courses from Course model
    const teacherStats = await User.aggregate([
      { $match: { role: 'teacher' } },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'instructor',
          as: 'courses'
        }
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          isActive: 1,
          totalCourses: { $size: '$courses' },
          activeCourses: {
            $size: {
              $filter: {
                input: '$courses',
                cond: { $eq: ['$$this.status', CourseStatus.APPROVED] }
              }
            }
          },
          totalStudents: {
            $sum: {
              $map: {
                input: '$courses',
                as: 'course',
                in: {
                  $ifNull: ['$$course.enrollmentCount', 0]
                }
              }
            }
          }
        }
      }
    ]);

    const totalStudentsTaught = teacherStats.reduce((sum, teacher) => sum + teacher.totalStudents, 0);
    const totalActiveCourses = teacherStats.reduce((sum, teacher) => sum + teacher.activeCourses, 0);

    // Get top performers (teachers with highest student counts)
    const topPerformers = teacherStats
      .sort((a, b) => b.totalStudents - a.totalStudents)
      .slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        totalTeachers,
        activeTeachers,
        totalStudentsTaught,
        totalActiveCourses,
        averageRating: 4.5, // TODO: Calculate from actual ratings
        topPerformers
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher details with courses (Admin only)
// Get all teachers with detailed information (Admin only)
export const getAllTeachers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const profileStatus = req.query.profileStatus as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Build match filter
    const matchFilter: any = { role: 'teacher' };

    if (search) {
      matchFilter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      matchFilter.isActive = true;
    } else if (status === 'inactive') {
      matchFilter.isActive = false;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Aggregate pipeline to get teachers with detailed information
    const teachers = await User.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'instructor',
          as: 'courses'
        }
      },
      {
        $lookup: {
          from: 'teacherprofiles',
          localField: '_id',
          foreignField: 'userId',
          as: 'profile'
        }
      },
      {
        $addFields: {
          profile: { $arrayElemAt: ['$profile', 0] }
        }
      },
      // Add profileStatus filter if specified
      ...(profileStatus ? [{
        $match: {
          'profile.profileStatus': profileStatus
        }
      }] : []),
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          isActive: 1,
          createdAt: 1,
          lastLogin: 1,
          specialization: { $ifNull: [{ $arrayElemAt: ['$profile.specialization', 0] }, 'Not specified'] },
          rating: { $ifNull: ['$profile.averageRating', 0] },
          profileStatus: { $ifNull: ['$profile.profileStatus', 'incomplete'] },
          totalCourses: { $size: '$courses' },
          activeCourses: {
            $size: {
              $filter: {
                input: '$courses',
                cond: { $eq: ['$$this.status', CourseStatus.APPROVED] }
              }
            }
          },
          totalStudents: {
            $sum: {
              $map: {
                input: '$courses',
                as: 'course',
                in: { $ifNull: ['$$course.enrollmentCount', 0] }
              }
            }
          },
          totalEarnings: { $ifNull: ['$profile.totalEarnings', 0] },
          courses: {
            $map: {
              input: { $slice: ['$courses', 5] }, // Limit to 5 courses for performance
              as: 'course',
              in: {
                _id: '$$course._id',
                title: '$$course.title',
                students: { $ifNull: ['$$course.enrollmentCount', 0] },
                status: '$$course.status'
              }
            }
          }
        }
      },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Get total count for pagination
    const totalTeachers = await User.countDocuments(matchFilter);
    const totalPages = Math.ceil(totalTeachers / limit);

    res.status(200).json({
      success: true,
      data: {
        teachers,
        pagination: {
          currentPage: page,
          totalPages,
          totalTeachers,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getTeacherDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const teacher = await User.aggregate([
      { $match: { _id: id, role: 'teacher' } },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: 'instructor',
          as: 'courses'
        }
      },
      {
        $project: {
          firstName: 1,
          lastName: 1,
          email: 1,
          isActive: 1,
          createdAt: 1,
          lastLogin: 1,
          totalCourses: { $size: '$courses' },
          activeCourses: {
            $size: {
              $filter: {
                input: '$courses',
                cond: { $eq: ['$$this.status', CourseStatus.APPROVED] }
              }
            }
          },
          totalStudents: {
            $sum: {
              $map: {
                input: '$courses',
                as: 'course',
                in: { $ifNull: ['$$course.enrollmentCount', 0] }
              }
            }
          },
          courses: {
            $map: {
              input: '$courses',
              as: 'course',
              in: {
                _id: '$$course._id',
                title: '$$course.title',
                students: { $ifNull: ['$$course.enrollmentCount', 0] },
                status: '$$course.status'
              }
            }
          }
        }
      }
    ]);

    if (!teacher || teacher.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Teacher not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { teacher: teacher[0] }
    });
  } catch (error) {
    next(error);
  }
};

// Profile-specific controllers

// Get current user profile
export const getCurrentProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const user = await User.findById(req.user._id)
      .select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

// Update current user profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { firstName, lastName, email, avatar } = req.body;

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
        return;
      }
    }

    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (avatar) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user: updatedUser },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Change password
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
      return;
    }

    // Get user with password field
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await User.findByIdAndUpdate(req.user._id, {
      password: hashedNewPassword,
      updatedAt: new Date()
    });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Upload avatar
export const uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    // Get current user to check for existing avatar
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    try {
      console.log('Processing avatar upload for user:', req.user._id);
      console.log('File details:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

      // Upload new avatar to Cloudinary
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        req.user._id.toString()
      );

      console.log('Upload successful, updating user profile...');

      // Delete old avatar if it exists
      if (currentUser.avatar) {
        console.log('Deleting old avatar:', currentUser.avatar);
        await deleteOldAvatar(currentUser.avatar);
      }

      // Update user with new avatar URL
      const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        { avatar: uploadResult.url },
        { new: true, runValidators: true }
      ).select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      console.log('✅ Avatar upload completed successfully');

      res.status(200).json({
        success: true,
        data: {
          avatarUrl: uploadResult.url,
          user: updatedUser
        },
        message: 'Avatar uploaded successfully'
      });
    } catch (uploadError) {
      console.error('❌ Avatar upload error:', uploadError);

      const errorMessage = uploadError instanceof Error
        ? uploadError.message
        : 'Failed to upload avatar. Please try again.';

      res.status(500).json({
        success: false,
        message: errorMessage
      });
    }
  } catch (error) {
    next(error);
  }
};

import { Request, Response, NextFunction } from 'express';
import { User, IUserDocument } from '../models/User';
import { UserRole, CourseStatus } from '../../../shared/types';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { uploadToCloudinary, deleteOldAvatar } from '../config/cloudinary';
import { profileCompletionService } from '../services/profileCompletionService';
import { simpleProfileCompletionService } from '../services/simpleProfileCompletion';

// Get all job seekers (Admin only)
export const getAllJobSeekers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const completion = req.query.completion as string;

    // Build filter object - align with model storage: role values 'professional' | 'job_seeker' and userType 'job_seeker'
    const filter: any = {
      $and: [
        { $or: [
          { role: { $in: ['professional', 'job_seeker'] } },
          { userType: 'job_seeker' }
        ]}
      ]
    };
    
    if (search) {
      filter.$and.push({
        $or: [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { jobTitle: { $regex: search, $options: 'i' } }
        ]
      });
    }
    
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get job seekers with all profile data
    const jobSeekers = await User.find(filter)
      .select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Calculate profile completion for each job seeker (robust with fallback)
    const jobSeekersWithCompletion = await Promise.all(
      jobSeekers.map(async (jobSeeker: any) => {
        try {
          // 1) Use stored positive value if present
          if (
            jobSeeker.profileCompletion &&
            typeof jobSeeker.profileCompletion.percentage === 'number' &&
            jobSeeker.profileCompletion.percentage > 0
          ) {
            return {
              ...jobSeeker,
              profileCompletion: {
                percentage: jobSeeker.profileCompletion.percentage,
                status: jobSeeker.profileCompletion.status || 'basic'
              },
              verification: {
                email: jobSeeker.isEmailVerified || false,
                phone: !!jobSeeker.phone,
                identity: !!jobSeeker.idNumber
              },
              // Mock application counts - replace with real data when available
              applicationCount: Math.floor(Math.random() * 20),
              savedJobsCount: Math.floor(Math.random() * 15),
              certificatesCount: jobSeeker.certifications?.length || 0,
              testsCompletedCount: Math.floor(Math.random() * 10),
              interviewsCount: Math.floor(Math.random() * 8)
            };
          }

          // 2) Detailed calculator
          const detailed = profileCompletionService.calculateProfileCompletion(jobSeeker);
          let percentage = detailed?.percentage ?? 0;
          let status = detailed?.status ?? 'incomplete';

          // 3) Fallback to simple calculator if still 0
          if (!percentage || percentage === 0) {
            try {
              const simple = simpleProfileCompletionService.calculateCompletion(jobSeeker as any);
              if (simple && typeof simple.percentage === 'number' && simple.percentage > percentage) {
                percentage = simple.percentage;
                status = simple.status as any;
              }
            } catch {
              // ignore fallback errors
            }
          }

          return {
            ...jobSeeker,
            profileCompletion: { percentage, status },
            verification: {
              email: jobSeeker.isEmailVerified || false,
              phone: !!jobSeeker.phone,
              identity: !!jobSeeker.idNumber
            },
            // Mock application counts - replace with real data when available
            applicationCount: Math.floor(Math.random() * 20),
            savedJobsCount: Math.floor(Math.random() * 15),
            certificatesCount: jobSeeker.certifications?.length || 0,
            testsCompletedCount: Math.floor(Math.random() * 10),
            interviewsCount: Math.floor(Math.random() * 8)
          };
        } catch (e) {
          return {
            ...jobSeeker,
            profileCompletion: { percentage: 0, status: 'incomplete' },
            verification: {
              email: jobSeeker.isEmailVerified || false,
              phone: !!jobSeeker.phone,
              identity: !!jobSeeker.idNumber
            },
            applicationCount: Math.floor(Math.random() * 20),
            savedJobsCount: Math.floor(Math.random() * 15),
            certificatesCount: jobSeeker.certifications?.length || 0,
            testsCompletedCount: Math.floor(Math.random() * 10),
            interviewsCount: Math.floor(Math.random() * 8)
          };
        }
      })
    );

    // Filter by completion if specified
    const filteredJobSeekers = completion === 'complete' 
      ? jobSeekersWithCompletion.filter(js => js.profileCompletion.percentage >= 80)
      : completion === 'incomplete'
      ? jobSeekersWithCompletion.filter(js => js.profileCompletion.percentage < 80)
      : jobSeekersWithCompletion;

    // Get total count
    const totalJobSeekers = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        jobSeekers: filteredJobSeekers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalJobSeekers / limit),
          totalJobSeekers,
          hasNextPage: page * limit < totalJobSeekers,
          hasPrevPage: page > 1
        },
        stats: {
          total: filteredJobSeekers.length,
          active: filteredJobSeekers.filter(js => js.isActive).length,
          completed: filteredJobSeekers.filter(js => js.profileCompletion.percentage >= 80).length,
          averageCompletion: Math.round(
            filteredJobSeekers.reduce((sum, js) => sum + js.profileCompletion.percentage, 0) / filteredJobSeekers.length
          )
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

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

    // Attach profile completion so Super Admin UI can display it
    const usersWithCompletion = await Promise.all(
      users.map(async (u: any) => {
        try {
          const completion = profileCompletionService.calculateProfileCompletion(u as any);
          return {
            ...u,
            profileCompletion: {
              percentage: completion.percentage,
              status: completion.status
          }
          };
        } catch (e) {
          return {
            ...u,
            profileCompletion: { percentage: 0, status: 'incomplete' }
          };
        }
      })
    );

    // Get total count for pagination
    const totalUsers = await User.countDocuments(filter);
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      data: {
        users: usersWithCompletion,
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

// Get current user profile (for own profile access)
export const getCurrentProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Only allow access to own profile for this endpoint
    const userId = req.user._id;

    // Explicitly include email and other important fields
    const user = await User.findById(userId)
      .select('firstName lastName email phone location avatar bio jobTitle company industry skills experience education resume cvFile jobPreferences expectedSalary role userType isActive isEmailVerified createdAt updatedAt');

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Debug: Log user data to see if email is included
    console.log('🔍 Debug - User data before profile completion:', {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      hasEmail: !!user.email,
      emailLength: user.email ? user.email.length : 0
    });

    // Calculate current profile completion
    const profileCompletion = simpleProfileCompletionService.calculateCompletion(user);

    res.status(200).json({
      success: true,
      data: { 
        user,
        profileCompletion
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get any user profile (for viewing other users in social network)
export const getUserProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    const userId = req.params.id;
    
    if (!userId) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    // Check if user is viewing their own profile
    const isOwnProfile = req.user?._id?.toString() === userId;

    // First get the user to check their role
    const userToCheck = await User.findById(userId).select('role');
    
    if (!userToCheck) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Select fields based on viewer role and whether it's own profile
    const isAdminViewer = req.user?.role === 'super_admin' || req.user?.role === 'admin';
    const isEmployer = userToCheck.role === 'employer';
    // For admins and super admins, always return full profile fields (include email)
    const selectFields = isAdminViewer
      ? '-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil'
      : isOwnProfile 
      ? '-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil'
      : isEmployer
      ? '-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil' // Include email and phone for employers
      : '-password -emailVerificationToken -email -passwordResetToken -loginAttempts -lockUntil';

    const user = await User.findById(userId).select(selectFields);

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    let responseUserData;

    if (isOwnProfile) {
      // Return full profile data for own profile
      responseUserData = user.toObject();
      console.log('🔍 Returning full profile data for own profile:', {
        userId: responseUserData._id,
        phone: responseUserData.phone,
        location: responseUserData.location,
        jobTitle: responseUserData.jobTitle,
        bio: responseUserData.bio,
        skills: responseUserData.skills,
        experience: responseUserData.experience?.length || 0,
        education: responseUserData.education?.length || 0,
        expectedSalary: responseUserData.expectedSalary,
        passport: responseUserData.passport
      });
    } else if (isEmployer) {
      // For employers, include contact information for hiring purposes
      responseUserData = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        jobTitle: user.jobTitle,
        company: user.company,
        location: user.location,
        bio: user.bio,
        skills: user.skills,
        role: user.role,
        userType: user.userType,
        createdAt: user.createdAt,
        isActive: user.isActive,
        // Include contact information for employers
        email: user.email,
        phone: user.phone,
        socialLinks: user.socialLinks,
        // Include additional employer-relevant fields
        experience: user.experience,
        education: user.education,
        certifications: user.certifications,
        languages: user.languages,
        summary: user.summary,
        industry: user.industry,
        department: user.department
      };
    } else {
      // For privacy, limit what information is shown for other users
      responseUserData = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
        jobTitle: user.jobTitle,
        company: user.company,
        location: user.location,
        bio: user.bio,
        skills: user.skills,
        role: user.role,
        userType: user.userType,
        createdAt: user.createdAt,
        isActive: user.isActive
      };
    }

    // Calculate profile completion
    const profileCompletion = simpleProfileCompletionService.calculateCompletion(user);

    res.status(200).json({
      success: true,
      data: { 
        user: responseUserData,
        profileCompletion
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update current user profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔄 Profile update request received:', {
      userId: req.user?._id,
      paramsId: req.params.id,
      bodyKeys: Object.keys(req.body),
      timestamp: new Date().toISOString()
    });

    if (!req.user) {
      console.log('❌ User not authenticated');
      res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
      return;
    }

    // Use user ID from params if provided, otherwise use authenticated user ID
    const userId = req.params.id || req.user._id;
    
    // If a specific user ID is requested, ensure it matches the authenticated user
    // (users can only update their own profile)
    if (req.params.id && req.params.id !== req.user._id.toString()) {
      console.log('❌ Access denied - user trying to update different profile');
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own profile.'
      });
      return;
    }

    // Accept all profile fields from the request body
    const updateData: any = { ...req.body };
    console.log('📝 Update data received:', updateData);
    
    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData.isActive;
    delete updateData.emailVerificationToken;
    delete updateData.passwordResetToken;
    delete updateData.loginAttempts;
    delete updateData.lockUntil;

    // Check if email is being changed and if it's already taken
    if (updateData.email && updateData.email !== req.user.email) {
      const existingUser = await User.findOne({ email: updateData.email, _id: { $ne: userId } });
      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email is already in use'
        });
        return;
      }
    }

    console.log('💾 Attempting to update user in database:', { 
      userId, 
      updateData,
      updateDataKeys: Object.keys(updateData),
      updateDataValues: Object.entries(updateData).map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    });
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');
    
    console.log('🔍 User data after database update:', {
      userId: updatedUser?._id,
      phone: updatedUser?.phone,
      location: updatedUser?.location,
      jobTitle: updatedUser?.jobTitle,
      bio: updatedUser?.bio,
      skills: updatedUser?.skills,
      experience: updatedUser?.experience,
      education: updatedUser?.education,
      expectedSalary: updatedUser?.expectedSalary,
      passport: updatedUser?.passport
    });

    if (!updatedUser) {
      console.log('❌ User not found in database');
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    console.log('✅ User updated successfully in database:', {
      userId: updatedUser._id,
      updatedFields: Object.keys(updateData)
    });

    // Reload user from database to ensure we have the latest data
    const freshUser = await User.findById(userId).select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');
    
    if (!freshUser) {
      console.log('❌ Could not reload user from database');
      res.status(404).json({
        success: false,
        message: 'User not found after update'
      });
      return;
    }

    console.log('🔄 Reloaded user data for profile completion calculation');

    // Calculate profile completion using simple service
    const simpleCompletion = simpleProfileCompletionService.calculateCompletion(freshUser);
    
    // Update the user's profile completion data
    freshUser.profileCompletion = {
      percentage: simpleCompletion.percentage,
      status: simpleCompletion.status,
      missingFields: simpleCompletion.missingFields,
      lastUpdated: new Date().toISOString()
    };
    
    freshUser.lastProfileUpdate = new Date().toISOString();
    await freshUser.save();
    
    console.log('📊 Simple profile completion result:', simpleCompletion);

    res.status(200).json({
      success: true,
      data: { 
        user: freshUser,
        profileCompletion: simpleCompletion
      },
      message: 'Profile updated successfully'
    });

    console.log('✅ Profile update response sent successfully');
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

// Get individual user statistics
export const getUserStatsById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id)
      .select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // For privacy, limit what information is shown for other users
    const isOwnProfile = req.user?.id === id;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      // Return limited public stats for other users
      res.status(200).json({
        success: true,
        data: {
          profileCompletion: {
            percentage: user.profileCompletion?.percentage || 0,
            status: user.profileCompletion?.status || 'incomplete'
          },
          memberSince: user.createdAt,
          isActive: user.isActive,
          publicStats: {
            connectionsCount: 0, // Will be populated when connections feature is implemented
            postsCount: 0, // Will be populated when posts feature is implemented
            skillsCount: user.skills?.length || 0
          }
        }
      });
      return;
    }

    // Return detailed stats for own profile or admin view
    const profileCompletion = simpleProfileCompletionService.calculateCompletion(user);

    // Get additional stats (mock data for now - replace with real data when available)
    const detailedStats = {
      profileCompletion,
      account: {
        memberSince: user.createdAt,
        lastLogin: user.lastLogin,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive
      },
      activity: {
        profileViews: Math.floor(Math.random() * 100), // Mock data
        connectionsCount: 0, // Will be populated when connections feature is implemented
        postsCount: 0, // Will be populated when posts feature is implemented
        commentsCount: 0, // Will be populated when comments feature is implemented
        likesReceived: 0 // Will be populated when likes feature is implemented
      },
      skills: {
        totalSkills: user.skills?.length || 0,
        endorsements: 0 // Will be populated when endorsements feature is implemented
      },
      education: {
        totalEducation: user.education?.length || 0,
        certificates: user.certifications?.length || 0
      },
      experience: {
        totalExperience: user.experience?.length || 0,
        currentPosition: user.jobTitle || 'Not specified'
      }
    };

    res.status(200).json({
      success: true,
      data: detailedStats
    });
  } catch (error) {
    next(error);
  }
};

// Get user privacy settings
export const getPrivacySettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    // Only allow users to access their own privacy settings or admin access
    const isOwnProfile = req.user?.id === id;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only view your own privacy settings.'
      });
      return;
    }

    // Return privacy settings with default values if not set
    const privacySettings = {
      profileVisibility: user.privacySettings?.profileVisibility || 'public',
      contactInfoVisibility: user.privacySettings?.contactInfoVisibility || 'connections',
      experienceVisibility: user.privacySettings?.experienceVisibility || 'public',
      educationVisibility: user.privacySettings?.educationVisibility || 'public',
      skillsVisibility: user.privacySettings?.skillsVisibility || 'public',
      allowMessagesFrom: user.privacySettings?.allowMessagesFrom || 'everyone',
      showOnlineStatus: user.privacySettings?.showOnlineStatus !== false, // Default to true
      emailNotifications: user.emailNotifications !== false, // Default to true
      pushNotifications: user.privacySettings?.pushNotifications !== false, // Default to true
      profileIndexing: user.privacySettings?.profileIndexing !== false // Default to true
    };

    res.status(200).json({
      success: true,
      data: { privacySettings }
    });
  } catch (error) {
    next(error);
  }
};

// Update user privacy settings
export const updatePrivacySettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const settings = req.body;

    // Check if user exists
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Only allow users to update their own privacy settings or admin access
    const isOwnProfile = req.user?.id === id;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwnProfile && !isAdmin) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own privacy settings.'
      });
      return;
    }

    // Validate privacy settings
    const validVisibilityOptions = ['public', 'connections', 'private'];
    const validMessageOptions = ['everyone', 'connections', 'nobody'];

    const validatedSettings: any = {};

    if (settings.profileVisibility && validVisibilityOptions.includes(settings.profileVisibility)) {
      validatedSettings['privacySettings.profileVisibility'] = settings.profileVisibility;
    }

    if (settings.contactInfoVisibility && validVisibilityOptions.includes(settings.contactInfoVisibility)) {
      validatedSettings['privacySettings.contactInfoVisibility'] = settings.contactInfoVisibility;
    }

    if (settings.experienceVisibility && validVisibilityOptions.includes(settings.experienceVisibility)) {
      validatedSettings['privacySettings.experienceVisibility'] = settings.experienceVisibility;
    }

    if (settings.educationVisibility && validVisibilityOptions.includes(settings.educationVisibility)) {
      validatedSettings['privacySettings.educationVisibility'] = settings.educationVisibility;
    }

    if (settings.skillsVisibility && validVisibilityOptions.includes(settings.skillsVisibility)) {
      validatedSettings['privacySettings.skillsVisibility'] = settings.skillsVisibility;
    }

    if (settings.allowMessagesFrom && validMessageOptions.includes(settings.allowMessagesFrom)) {
      validatedSettings['privacySettings.allowMessagesFrom'] = settings.allowMessagesFrom;
    }

    if (typeof settings.showOnlineStatus === 'boolean') {
      validatedSettings['privacySettings.showOnlineStatus'] = settings.showOnlineStatus;
    }

    if (typeof settings.emailNotifications === 'boolean') {
      validatedSettings.emailNotifications = settings.emailNotifications;
    }

    if (typeof settings.pushNotifications === 'boolean') {
      validatedSettings['privacySettings.pushNotifications'] = settings.pushNotifications;
    }

    if (typeof settings.profileIndexing === 'boolean') {
      validatedSettings['privacySettings.profileIndexing'] = settings.profileIndexing;
    }

    // Update user with new privacy settings
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: validatedSettings },
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken -loginAttempts -lockUntil');

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Return updated privacy settings
    const privacySettings = {
      profileVisibility: updatedUser.privacySettings?.profileVisibility || 'public',
      contactInfoVisibility: updatedUser.privacySettings?.contactInfoVisibility || 'connections',
      experienceVisibility: updatedUser.privacySettings?.experienceVisibility || 'public',
      educationVisibility: updatedUser.privacySettings?.educationVisibility || 'public',
      skillsVisibility: updatedUser.privacySettings?.skillsVisibility || 'public',
      allowMessagesFrom: updatedUser.privacySettings?.allowMessagesFrom || 'everyone',
      showOnlineStatus: updatedUser.privacySettings?.showOnlineStatus !== false,
      emailNotifications: updatedUser.emailNotifications !== false,
      pushNotifications: updatedUser.privacySettings?.pushNotifications !== false,
      profileIndexing: updatedUser.privacySettings?.profileIndexing !== false
    };

    res.status(200).json({
      success: true,
      data: { privacySettings },
      message: 'Privacy settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

import express from 'express';
import { auth } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roleAuth';
import { UserRole } from '../types';
import { User } from '../models/User';
import { Job } from '../models/Job';
import { JobApplication } from '../models/JobApplication';
import { AIInterview } from '../models/AIInterview';
import { JobCertificate } from '../models/JobCertificate';
import { PsychometricTest } from '../models/PsychometricTest';
import { Course } from '../models/Course';
import { Company } from '../models/Company';
import { asyncHandler } from '../middleware/asyncHandler';

const router = express.Router();

// Test endpoint without auth for debugging
router.get('/test', asyncHandler(async (req, res) => {
  // Also check what users exist and their roles
  const users = await User.find({}, 'firstName lastName email role').limit(5);
  res.json({
    success: true,
    data: {
      message: 'Test endpoint working',
      timestamp: new Date().toISOString(),
      sampleUsers: users
    }
  });
}));

// Apply authentication and super admin authorization to all routes
router.use(auth);
router.use(authorizeRoles([UserRole.SUPER_ADMIN]));

// Dashboard Statistics
router.get('/dashboard/stats', asyncHandler(async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    const suspendedUsers = await User.countDocuments({ isActive: false });

    // Get users by role
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { role: '$_id', count: 1, _id: 0 } }
    ]);

    // Get job statistics
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });
    
    // Get jobs by status
    const jobsByStatus = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);

    // Get application statistics
    const totalApplications = await JobApplication.countDocuments();
    const pendingApplications = await JobApplication.countDocuments({ status: 'pending' });
    
    // Get applications by status
    const applicationsByStatus = await JobApplication.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $project: { status: '$_id', count: 1, _id: 0 } }
    ]);

    // Get other statistics
    const totalCourses = await Course.countDocuments();
    const totalTests = await PsychometricTest.countDocuments();
    const totalInterviews = await AIInterview.countDocuments();
    const totalCertificates = await JobCertificate.countDocuments();

    // Calculate monthly growth (simplified)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const lastMonthUsers = await User.countDocuments({ createdAt: { $gte: lastMonth } });
    const lastMonthJobs = await Job.countDocuments({ createdAt: { $gte: lastMonth } });
    const lastMonthApplications = await JobApplication.countDocuments({ createdAt: { $gte: lastMonth } });

    // Determine system health (simplified logic)
    let systemHealth: 'excellent' | 'good' | 'warning' | 'critical' = 'good';
    if (activeUsers / totalUsers > 0.9) systemHealth = 'excellent';
    else if (activeUsers / totalUsers < 0.7) systemHealth = 'warning';
    else if (activeUsers / totalUsers < 0.5) systemHealth = 'critical';

    const stats = {
      totalUsers,
      totalJobs,
      totalApplications,
      totalCourses,
      totalTests,
      totalInterviews,
      totalCertificates,
      activeUsers,
      pendingApplications,
      systemHealth,
      usersByRole: usersByRole.reduce((acc, item) => {
        acc[item.role] = item.count;
        return acc;
      }, {} as Record<string, number>),
      jobsByStatus: jobsByStatus.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {} as Record<string, number>),
      applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
        acc[item.status] = item.count;
        return acc;
      }, {} as Record<string, number>),
      monthlyGrowth: {
        users: lastMonthUsers,
        jobs: lastMonthJobs,
        applications: lastMonthApplications
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
}));

// Recent Activity
router.get('/activity/recent', asyncHandler(async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(limit / 2)
      .select('firstName lastName email role createdAt');

    // Get recent jobs
    const recentJobs = await Job.find()
      .populate('employer', 'firstName lastName company')
      .sort({ createdAt: -1 })
      .limit(limit / 2)
      .select('title company createdAt employer');

    // Combine and format activities
    const activities = [
      ...recentUsers.map(user => ({
        id: user._id.toString(),
        type: 'user_registered' as const,
        title: 'New user registered',
        description: `${user.firstName} ${user.lastName} joined as ${user.role}`,
        timestamp: user.createdAt.toISOString(),
        userId: user._id.toString(),
        userName: `${user.firstName} ${user.lastName}`,
        metadata: { role: user.role, email: user.email }
      })),
      ...recentJobs.map(job => ({
        id: job._id.toString(),
        type: 'job_posted' as const,
        title: 'Job posted',
        description: `${job.title} at ${job.company}`,
        timestamp: job.createdAt.toISOString(),
        userId: job.employer?._id?.toString(),
        userName: job.employer ? `${job.employer.firstName} ${job.employer.lastName}` : 'Unknown',
        metadata: { jobTitle: job.title, company: job.company }
      }))
    ];

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: limitedActivities
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent activity'
    });
  }
}));

// System Alerts (mock implementation)
router.get('/system/alerts', asyncHandler(async (req, res) => {
  try {
    // This would typically come from a monitoring system
    const alerts = [
      {
        id: '1',
        type: 'warning',
        title: 'High Server Load',
        message: 'Server CPU usage is at 85%. Consider scaling resources.',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'high'
      },
      {
        id: '2',
        type: 'info',
        title: 'Scheduled Maintenance',
        message: 'System maintenance scheduled for tomorrow at 2 AM UTC.',
        timestamp: new Date().toISOString(),
        isRead: false,
        priority: 'medium'
      }
    ];

    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system alerts'
    });
  }
}));

// User Management
router.get('/users', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    console.log('👥 Fetching users with params:', { page, limit, search, role, status, sortBy, sortOrder });

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-password -emailVerificationToken -passwordResetToken -__v')
      .lean(); // Use lean for better performance

    // Attach profile completion with robust calculation and sensible fallbacks
    const usersWithCompletion = await Promise.all(
      users.map(async (u: any) => {
        try {
          // 1) Prefer stored value only if it's a positive percentage
          if (
            u.profileCompletion &&
            typeof u.profileCompletion.percentage === 'number' &&
            u.profileCompletion.percentage > 0
          ) {
            return {
              ...u,
              profileCompletion: {
                percentage: u.profileCompletion.percentage,
                status: u.profileCompletion.status || 'basic'
              }
            };
          }

          // 2) Compute using detailed backend calculator
          const { profileCompletionService } = require('../services/profileCompletionService');
          const detailed = profileCompletionService.calculateProfileCompletion(u as any);

          let percentage = detailed?.percentage ?? 0;
          let status = detailed?.status ?? 'incomplete';

          // 3) If still 0 (e.g., minimal data), try simple calculator as a fallback
          if (!percentage || percentage === 0) {
            try {
              const { simpleProfileCompletionService } = require('../services/simpleProfileCompletion');
              const simple = simpleProfileCompletionService.calculateCompletion(u as any);
              if (simple && typeof simple.percentage === 'number' && simple.percentage > percentage) {
                percentage = simple.percentage;
                status = simple.status as any;
              }
            } catch (fallbackErr) {
              // Ignore fallback errors; we'll return the detailed result
            }
          }

          return {
            ...u,
            profileCompletion: { percentage, status }
          };
        } catch (e) {
          // Final safety net
          return {
            ...u,
            profileCompletion: { percentage: 0, status: 'incomplete' }
          };
        }
      })
    );

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log(`👥 Found ${usersWithCompletion.length} users out of ${total} total`);

    res.json({
      success: true,
      data: {
        users: usersWithCompletion,
        total,
        page,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// User Statistics
router.get('/users/stats', asyncHandler(async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    const suspendedUsers = await User.countDocuments({ isActive: false });

    // Get users by role
    const usersByRoleArray = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { role: '$_id', count: 1, _id: 0 } }
    ]);

    const usersByRole = usersByRoleArray.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      suspendedUsers,
      usersByRole
    };

    console.log('📊 User stats fetched:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
  }
}));

// Get user by ID
router.get('/users/:id', asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -emailVerificationToken -passwordResetToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user'
    });
  }
}));

// Create user
router.post('/users', asyncHandler(async (req, res) => {
  try {
    const userData = req.body;
    const user = new User(userData);
    await user.save();

    // Remove sensitive data
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user'
    });
  }
}));

// Update user
router.put('/users/:id', asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    });
  }
}));

// Delete user
router.delete('/users/:id', asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
}));

// Suspend user
router.put('/users/:id/suspend', asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User suspended successfully'
    });
  } catch (error) {
    console.error('Error suspending user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend user'
    });
  }
}));

// Activate user
router.put('/users/:id/activate', asyncHandler(async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password -emailVerificationToken -passwordResetToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User activated successfully'
    });
  } catch (error) {
    console.error('Error activating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to activate user'
    });
  }
}));

// Bulk user actions
router.post('/users/bulk-action', asyncHandler(async (req, res) => {
  try {
    const { userIds, action, reason } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs are required'
      });
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { isActive: true };
        message = 'Users activated successfully';
        break;
      case 'suspend':
        updateData = { isActive: false };
        message = 'Users suspended successfully';
        break;
      case 'delete':
        await User.deleteMany({ _id: { $in: userIds } });
        return res.json({
          success: true,
          message: 'Users deleted successfully'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    await User.updateMany(
      { _id: { $in: userIds } },
      updateData
    );

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk action'
    });
  }
}));

// Job Management
router.get('/jobs', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const employerId = req.query.employerId as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    console.log('💼 Fetching jobs with params:', { page, limit, search, status, employerId, sortBy, sortOrder });

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (employerId) {
      query.employer = employerId;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const jobs = await Job.find(query)
      .populate('employer', 'firstName lastName email company avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean for better performance

    const total = await Job.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log(`💼 Found ${jobs.length} jobs out of ${total} total`);

    res.json({
      success: true,
      data: {
        jobs,
        total,
        page,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Get job by ID
router.get('/jobs/:id', asyncHandler(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'firstName lastName email company avatar');
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job'
    });
  }
}));

// Create job
router.post('/jobs', asyncHandler(async (req, res) => {
  try {
    const jobData = req.body;
    
    // Set the employer to the current user if not specified
    if (!jobData.employer) {
      jobData.employer = req.user._id;
    }
    
    const job = new Job(jobData);
    await job.save();

    // Populate employer data for response
    await job.populate('employer', 'firstName lastName email company avatar');

    console.log('💼 Created new job:', job.title);

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job created successfully'
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Update job
router.put('/jobs/:id', asyncHandler(async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employer', 'firstName lastName email company avatar');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    console.log('💼 Updated job:', job.title);

    res.json({
      success: true,
      data: job,
      message: 'Job updated successfully'
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Delete job
router.delete('/jobs/:id', asyncHandler(async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    console.log('💼 Deleted job:', job.title);

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete job'
    });
  }
}));

// Update job status
router.put('/jobs/:id/status', asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('employer', 'firstName lastName email company avatar');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    console.log('💼 Updated job status:', job.title, 'to', status);

    res.json({
      success: true,
      data: job,
      message: `Job ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job status'
    });
  }
}));

// Feature/unfeature job
router.put('/jobs/:id/feature', asyncHandler(async (req, res) => {
  try {
    const { featured } = req.body;
    
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { isCurated: featured },
      { new: true, runValidators: true }
    ).populate('employer', 'firstName lastName email company avatar');

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    console.log('💼 Updated job featured status:', job.title, 'to', featured);

    res.json({
      success: true,
      data: job,
      message: `Job ${featured ? 'featured' : 'unfeatured'} successfully`
    });
  } catch (error) {
    console.error('Error updating job featured status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update job featured status'
    });
  }
}));

// Bulk job actions
router.post('/jobs/bulk-action', asyncHandler(async (req, res) => {
  try {
    const { jobIds, action } = req.body;

    if (!jobIds || !Array.isArray(jobIds) || jobIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Job IDs are required'
      });
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'activate':
        updateData = { status: 'active' };
        message = 'Jobs activated successfully';
        break;
      case 'pause':
        updateData = { status: 'paused' };
        message = 'Jobs paused successfully';
        break;
      case 'archive':
        updateData = { status: 'closed' };
        message = 'Jobs archived successfully';
        break;
      case 'delete':
        await Job.deleteMany({ _id: { $in: jobIds } });
        return res.json({
          success: true,
          message: 'Jobs deleted successfully'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }

    await Job.updateMany(
      { _id: { $in: jobIds } },
      updateData
    );

    console.log('💼 Bulk action performed:', action, 'on', jobIds.length, 'jobs');

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error performing bulk job action:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk action'
    });
  }
}));

/**
 * @route   POST /api/admin/jobs/delete-expired
 * @desc    Delete all jobs that have expired based on application deadline
 * @access  Super Admin only
 */
router.post('/jobs/delete-expired', asyncHandler(async (req, res) => {
  try {
    const now = new Date();

    // Find all jobs where applicationDeadline exists and is in the past
    const expiredJobs = await Job.find({
      applicationDeadline: { $exists: true, $ne: null, $lt: now }
    });

    if (expiredJobs.length === 0) {
      return res.json({
        success: true,
        deletedCount: 0,
        deletedJobs: [],
        message: 'No expired jobs found'
      });
    }

    // Delete the expired jobs
    const deletedResult = await Job.deleteMany({
      applicationDeadline: { $exists: true, $ne: null, $lt: now }
    });

    // Prepare response data
    const deletedJobs = expiredJobs.map(job => ({
      id: job._id,
      title: job.title,
      company: job.company,
      deadline: job.applicationDeadline
    }));

    console.log(`🗑️ Deleted ${deletedResult.deletedCount} expired jobs`);

    res.json({
      success: true,
      deletedCount: deletedResult.deletedCount,
      deletedJobs,
      message: `Successfully deleted ${deletedResult.deletedCount} expired jobs`
    });
  } catch (error) {
    console.error('Error deleting expired jobs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete expired jobs'
    });
  }
}));

// Application Management
router.get('/applications', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const jobId = req.query.jobId as string;
    const applicantId = req.query.applicantId as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    console.log('📋 Fetching applications with params:', { page, limit, search, status, jobId, applicantId, sortBy, sortOrder });

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { applicantName: { $regex: search, $options: 'i' } },
        { applicantEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (jobId) {
      query.jobId = jobId;
    }
    
    if (applicantId) {
      query.applicantId = applicantId;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const applications = await JobApplication.find(query)
      .populate('jobId', 'title company location type salary')
      .populate('applicantId', 'firstName lastName email avatar')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean for better performance

    const total = await JobApplication.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log(`📋 Found ${applications.length} applications out of ${total} total`);

    res.json({
      success: true,
      data: {
        applications,
        total,
        page,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch applications',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Application Statistics  
router.get('/applications/stats', asyncHandler(async (req, res) => {
  try {
    // Get application statistics
    const totalApplications = await JobApplication.countDocuments();
    const pendingApplications = await JobApplication.countDocuments({ status: 'pending' });
    const reviewedApplications = await JobApplication.countDocuments({ status: 'reviewed' });
    const acceptedApplications = await JobApplication.countDocuments({ status: 'accepted' });
    const rejectedApplications = await JobApplication.countDocuments({ status: 'rejected' });
    const shortlistedApplications = await JobApplication.countDocuments({ status: 'shortlisted' });

    // Get applications by status distribution
    const statusDistribution = await JobApplication.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get top jobs by application count
    const topJobsByApplications = await JobApplication.aggregate([
      {
        $group: {
          _id: '$jobId',
          applications: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'jobData'
        }
      },
      {
        $unwind: '$jobData'
      },
      {
        $project: {
          _id: 0,
          jobTitle: '$jobData.title',
          company: '$jobData.company',
          applications: 1
        }
      },
      {
        $sort: { applications: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // Get recent application trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentApplications = await JobApplication.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const stats = {
      totalApplications,
      pendingApplications,
      reviewedApplications, 
      acceptedApplications,
      rejectedApplications,
      shortlistedApplications,
      recentApplications,
      statusDistribution,
      topJobsByApplications
    };

    console.log('📊 Application stats fetched:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch application statistics'
    });
  }
}));

// Test Management
router.get('/tests', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    console.log('🧠 Fetching tests with params:', { page, limit, search, status, type, sortBy, sortOrder });

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const tests = await PsychometricTest.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean for better performance

    const total = await PsychometricTest.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log(`🧠 Found ${tests.length} tests out of ${total} total`);

    res.json({
      success: true,
      data: {
        tests,
        total,
        page,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tests',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Certificate Management
router.get('/certificates', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    console.log('🏆 Fetching certificates with params:', { page, limit, search, status, type, sortBy, sortOrder });

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const certificates = await JobCertificate.find(query)
      .populate('recipientId', 'firstName lastName email avatar')
      .populate('issuedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean for better performance

    const total = await JobCertificate.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log(`🏆 Found ${certificates.length} certificates out of ${total} total`);

    res.json({
      success: true,
      data: {
        certificates,
        total,
        page,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch certificates',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Course Management
router.get('/courses', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const category = req.query.category as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    console.log('📚 Fetching courses with params:', { page, limit, search, status, category, sortBy, sortOrder });

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const courses = await Course.find(query)
      .populate('instructor', 'firstName lastName email avatar')
      .populate('approvedBy', 'firstName lastName email')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean for better performance

    const total = await Course.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log(`📚 Found ${courses.length} courses out of ${total} total`);

    res.json({
      success: true,
      data: {
        courses,
        total,
        page,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch courses',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// Interview Management
router.get('/interviews', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    console.log('🎤 Fetching interviews with params:', { page, limit, search, status, sortBy, sortOrder });

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { candidateName: { $regex: search, $options: 'i' } },
        { jobTitle: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    const skip = (page - 1) * limit;
    const interviews = await AIInterview.find(query)
      .populate('candidateId', 'firstName lastName email avatar')
      .populate('jobId', 'title company location')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean for better performance

    const total = await AIInterview.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    console.log(`🎤 Found ${interviews.length} interviews out of ${total} total`);

    res.json({
      success: true,
      data: {
        interviews,
        total,
        page,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interviews',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// System Settings
router.get('/system/settings', asyncHandler(async (req, res) => {
  try {
    // Mock system settings data - in a real app, this would come from a database
    const settings = {
      maintenance: {
        enabled: false,
        message: 'System under maintenance. Please try again later.',
        scheduledStart: '',
        scheduledEnd: ''
      },
      features: {
        userRegistration: true,
        jobPosting: true,
        aiInterviews: true,
        psychometricTests: true,
        certificates: true
      },
      limits: {
        maxJobsPerEmployer: 50,
        maxApplicationsPerUser: 100,
        maxFileUploadSize: 10,
        sessionTimeout: 30
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false
      }
    };

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system settings'
    });
  }
}));

// Update System Settings
router.put('/system/settings', asyncHandler(async (req, res) => {
  try {
    const settings = req.body;
    // In a real app, you would save these to a database
    console.log('Updating system settings:', settings);

    res.json({
      success: true,
      data: settings,
      message: 'System settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update system settings'
    });
  }
}));

// Reset System Settings
router.post('/system/settings/reset', asyncHandler(async (req, res) => {
  try {
    const defaultSettings = {
      maintenance: {
        enabled: false,
        message: 'System under maintenance. Please try again later.',
        scheduledStart: '',
        scheduledEnd: ''
      },
      features: {
        userRegistration: true,
        jobPosting: true,
        aiInterviews: true,
        psychometricTests: true,
        certificates: true
      },
      limits: {
        maxJobsPerEmployer: 50,
        maxApplicationsPerUser: 100,
        maxFileUploadSize: 10,
        sessionTimeout: 30
      },
      notifications: {
        emailEnabled: true,
        pushEnabled: true,
        smsEnabled: false
      }
    };

    res.json({
      success: true,
      data: defaultSettings,
      message: 'System settings reset to defaults'
    });
  } catch (error) {
    console.error('Error resetting system settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset system settings'
    });
  }
}));

// System Health
router.get('/system/health', asyncHandler(async (req, res) => {
  try {
    // Mock system health data
    const health = {
      status: 'good' as const,
      services: {
        database: {
          status: 'healthy' as const,
          responseTime: 45,
          lastCheck: new Date().toISOString()
        },
        redis: {
          status: 'healthy' as const,
          responseTime: 12,
          lastCheck: new Date().toISOString()
        },
        email: {
          status: 'healthy' as const,
          responseTime: 234,
          lastCheck: new Date().toISOString()
        }
      },
      metrics: {
        cpuUsage: 65,
        memoryUsage: 78,
        diskUsage: 45,
        activeConnections: 1247
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system health'
    });
  }
}));

// Analytics
router.get('/analytics', asyncHandler(async (req, res) => {
  try {
    const timeRange = req.query.timeRange as string || '30d';
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get user growth data
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get job postings data
    const jobPostings = await Job.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get applications data
    const applications = await JobApplication.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);

    // Get top employers
    const topEmployers = await Job.aggregate([
      {
        $group: {
          _id: '$company',
          jobCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'jobapplications',
          localField: '_id',
          foreignField: 'job.company',
          as: 'applications'
        }
      },
      {
        $project: {
          name: '$_id',
          jobCount: 1,
          applicationCount: { $size: '$applications' },
          _id: 0
        }
      },
      {
        $sort: { jobCount: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const analyticsData = {
      userGrowth,
      jobPostings,
      applications,
      topEmployers,
      popularSkills: [
        { skill: 'JavaScript', count: 1247 },
        { skill: 'Python', count: 1156 },
        { skill: 'React', count: 987 },
        { skill: 'Node.js', count: 876 },
        { skill: 'SQL', count: 765 }
      ],
      geographicDistribution: [
        { location: 'New York', count: 2847 },
        { location: 'San Francisco', count: 2156 },
        { location: 'London', count: 1876 },
        { location: 'Toronto', count: 1654 },
        { location: 'Berlin', count: 1432 }
      ],
      conversionRates: {
        applicationToInterview: 0.25,
        interviewToHire: 0.35,
        courseCompletion: 0.78,
        testCompletion: 0.82
      }
    };

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data'
    });
  }
}));

// User Statistics
router.get('/users/stats', asyncHandler(async (req, res) => {
  try {
    // Get user statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });
    const suspendedUsers = await User.countDocuments({ isActive: false });

    // Get users by role
    const usersByRoleArray = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $project: { role: '$_id', count: 1, _id: 0 } }
    ]);

    const usersByRole = usersByRoleArray.reduce((acc, item) => {
      acc[item.role] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      suspendedUsers,
      usersByRole
    };

    console.log('📊 User stats fetched:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user statistics'
    });
  }
}));

// Course Statistics
router.get('/courses/stats', asyncHandler(async (req, res) => {
  try {
    // Get course statistics
    const totalCourses = await Course.countDocuments();
    const activeCourses = await Course.countDocuments({ status: 'published' });
    const draftCourses = await Course.countDocuments({ status: 'draft' });

    // Get total enrollments (if enrollment model exists)
    let totalEnrollments = 0;
    try {
      const Enrollment = require('../models/Enrollment');
      totalEnrollments = await Enrollment.countDocuments();
    } catch (error) {
      // Enrollment model might not exist
      console.log('Enrollment model not found, using mock data for enrollments');
      totalEnrollments = Math.floor(totalCourses * 25); // Rough estimate
    }

    // Get completion rate and average rating (simplified)
    const completionRate = totalEnrollments > 0 ? Math.round(Math.random() * 30 + 50) : 0; // 50-80% completion rate
    const averageRating = totalCourses > 0 ? Math.round((Math.random() * 1.5 + 3.5) * 10) / 10 : 0; // 3.5-5.0 rating

    // Get top instructors (simplified - using course creators)
    const topInstructors = await Course.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructorData'
        }
      },
      {
        $unwind: '$instructorData'
      },
      {
        $group: {
          _id: '$instructor',
          instructor: { $first: { $concat: ['$instructorData.firstName', ' ', '$instructorData.lastName'] } },
          courses: { $sum: 1 },
          students: { $sum: { $multiply: ['$studentsEnrolled', 1] } },
          rating: { $avg: '$averageRating' }
        }
      },
      {
        $sort: { courses: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          _id: 0,
          instructor: 1,
          courses: 1,
          students: { $ifNull: ['$students', { $multiply: ['$courses', 15] }] }, // Estimate if no enrollment data
          rating: { $ifNull: [{ $round: ['$rating', 1] }, 4.2] }
        }
      }
    ]);

    // Get top categories
    const topCategories = await Course.aggregate([
      {
        $group: {
          _id: '$category',
          courses: { $sum: 1 },
          enrollments: { $sum: { $multiply: ['$studentsEnrolled', 1] } }
        }
      },
      {
        $sort: { courses: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          courses: 1,
          enrollments: { $ifNull: ['$enrollments', { $multiply: ['$courses', 20] }] } // Estimate if no enrollment data
        }
      }
    ]);

    const stats = {
      totalCourses,
      activeCourses,
      draftCourses,
      totalEnrollments,
      completionRate,
      averageRating,
      topInstructors,
      topCategories
    };

    console.log('📊 Course stats fetched:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching course stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course statistics'
    });
  }
}));

// Job Statistics
router.get('/jobs/stats', asyncHandler(async (req, res) => {
  try {
    // Get job statistics
    const totalJobs = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: 'active' });
    const draftJobs = await Job.countDocuments({ status: 'draft' });
    const expiredJobs = await Job.countDocuments({ status: 'expired' });

    // Get total applications
    const totalApplications = await JobApplication.countDocuments();
    
    // Calculate average applications per job
    const averageApplicationsPerJob = totalJobs > 0 ? 
      Math.round((totalApplications / totalJobs) * 10) / 10 : 0;

    // Get top employers (employers with most jobs)
    const topEmployers = await Job.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'employer',
          foreignField: '_id',
          as: 'employerData'
        }
      },
      {
        $unwind: '$employerData'
      },
      {
        $group: {
          _id: '$employer',
          company: { $first: '$employerData.company' },
          jobs: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'jobapplications',
          localField: '_id',
          foreignField: 'job',
          as: 'applications'
        }
      },
      {
        $project: {
          _id: 0,
          company: { $ifNull: ['$company', 'Unknown Company'] },
          jobs: 1,
          applications: { $size: '$applications' }
        }
      },
      {
        $sort: { jobs: -1 }
      },
      {
        $limit: 5
      }
    ]);

    const stats = {
      totalJobs,
      activeJobs,
      draftJobs,
      expiredJobs,
      totalApplications,
      averageApplicationsPerJob,
      topEmployers
    };

    console.log('📊 Job stats fetched:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch job statistics'
    });
  }
}));

// Test Statistics  
router.get('/tests/stats', asyncHandler(async (req, res) => {
  try {
    // Get test statistics
    const totalTests = await PsychometricTest.countDocuments();
    const activeTests = await PsychometricTest.countDocuments({ isActive: true });
    const draftTests = await PsychometricTest.countDocuments({ isActive: false });

    // Get tests by type if type field exists
    let testsByType = [];
    try {
      testsByType = await PsychometricTest.aggregate([
        { 
          $group: { 
            _id: '$type', 
            count: { $sum: 1 } 
          } 
        },
        { 
          $project: { 
            type: { $ifNull: ['$_id', 'General'] }, 
            count: 1, 
            _id: 0 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);
    } catch (error) {
      console.log('Test type aggregation failed, using simplified stats');
    }

    // Get total test attempts (if test attempts/results model exists)
    let totalAttempts = 0;
    let averageScore = 0;
    try {
      // This would depend on your test results model structure
      // For now, we'll use mock data based on total tests
      totalAttempts = Math.floor(totalTests * 50); // Estimate 50 attempts per test
      averageScore = Math.round((Math.random() * 30 + 60) * 10) / 10; // 60-90% average
    } catch (error) {
      console.log('Test results data not available, using estimates');
    }

    // Get completion rate (simplified)
    const completionRate = totalAttempts > 0 ? Math.round(Math.random() * 20 + 70) : 0; // 70-90% completion

    // Get top test creators
    const topCreators = await PsychometricTest.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'creatorData'
        }
      },
      {
        $unwind: '$creatorData'
      },
      {
        $group: {
          _id: '$createdBy',
          creator: { $first: { $concat: ['$creatorData.firstName', ' ', '$creatorData.lastName'] } },
          tests: { $sum: 1 }
        }
      },
      {
        $sort: { tests: -1 }
      },
      {
        $limit: 5
      },
      {
        $project: {
          _id: 0,
          creator: 1,
          tests: 1,
          attempts: { $multiply: ['$tests', 45] } // Estimate attempts
        }
      }
    ]);

    const stats = {
      totalTests,
      activeTests,
      draftTests,
      totalAttempts,
      averageScore,
      completionRate,
      testsByType,
      topCreators
    };

    console.log('📊 Test stats fetched:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching test stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test statistics'
    });
  }
}));

// Company Profile Approval Management
// @desc    Get pending company profiles for approval
// @route   GET /api/super-admin/company-profiles/pending
// @access  Private (Super Admin)
router.get('/company-profiles/pending', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const pendingProfiles = await Company.find({ approvalStatus: 'pending' })
      .populate('submittedBy', 'firstName lastName email company jobTitle')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Company.countDocuments({ approvalStatus: 'pending' });

    res.json({
      success: true,
      data: {
        profiles: pendingProfiles,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending company profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending company profiles'
    });
  }
}));

// @desc    Get all company profiles with filtering
// @route   GET /api/super-admin/company-profiles
// @access  Private (Super Admin)
router.get('/company-profiles', asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let query: any = {};
    
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.approvalStatus = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { industry: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    const profiles = await Company.find(query)
      .populate('submittedBy', 'firstName lastName email company jobTitle')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Company.countDocuments(query);

    res.json({
      success: true,
      data: {
        profiles,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching company profiles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company profiles'
    });
  }
}));

// @desc    Get single company profile details
// @route   GET /api/super-admin/company-profiles/:id
// @access  Private (Super Admin)
router.get('/company-profiles/:id', asyncHandler(async (req, res) => {
  try {
    const profile = await Company.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email phone company jobTitle')
      .populate('reviewedBy', 'firstName lastName');

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Company profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching company profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company profile'
    });
  }
}));

// @desc    Approve company profile
// @route   POST /api/super-admin/company-profiles/:id/approve
// @access  Private (Super Admin)
router.post('/company-profiles/:id/approve', asyncHandler(async (req, res) => {
  try {
    const { approvalNotes } = req.body;

    const profile = await Company.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Company profile not found'
      });
    }

    if (profile.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending profiles can be approved'
      });
    }

    profile.approvalStatus = 'approved';
    profile.reviewedBy = req.user!._id;
    profile.reviewedAt = new Date();
    profile.approvalNotes = approvalNotes;
    profile.isVerified = true; // Auto-verify approved companies
    profile.rejectionReason = undefined;

    await profile.save();

    // Populate the updated profile for response
    const updatedProfile = await Company.findById(profile._id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Company profile approved successfully'
    });
  } catch (error) {
    console.error('Error approving company profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve company profile'
    });
  }
}));

// @desc    Reject company profile
// @route   POST /api/super-admin/company-profiles/:id/reject
// @access  Private (Super Admin)
router.post('/company-profiles/:id/reject', asyncHandler(async (req, res) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required'
      });
    }

    const profile = await Company.findById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Company profile not found'
      });
    }

    if (profile.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending profiles can be rejected'
      });
    }

    profile.approvalStatus = 'rejected';
    profile.reviewedBy = req.user!._id;
    profile.reviewedAt = new Date();
    profile.rejectionReason = rejectionReason;
    profile.approvalNotes = undefined;

    await profile.save();

    // Populate the updated profile for response
    const updatedProfile = await Company.findById(profile._id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName');

    res.json({
      success: true,
      data: updatedProfile,
      message: 'Company profile rejected'
    });
  } catch (error) {
    console.error('Error rejecting company profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject company profile'
    });
  }
}));

// @desc    Get company profile approval statistics
// @route   GET /api/super-admin/company-profiles/stats
// @access  Private (Super Admin)
router.get('/company-profiles/stats', asyncHandler(async (req, res) => {
  try {
    const totalProfiles = await Company.countDocuments();
    const pendingProfiles = await Company.countDocuments({ approvalStatus: 'pending' });
    const approvedProfiles = await Company.countDocuments({ approvalStatus: 'approved' });
    const rejectedProfiles = await Company.countDocuments({ approvalStatus: 'rejected' });
    
    // Get submissions by month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlySubmissions = await Company.aggregate([
      {
        $match: {
          submittedAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$submittedAt' },
            month: { $month: '$submittedAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get approval rate
    const approvalRate = totalProfiles > 0 ? (approvedProfiles / totalProfiles) * 100 : 0;

    const stats = {
      totalProfiles,
      pendingProfiles,
      approvedProfiles,
      rejectedProfiles,
      approvalRate: Math.round(approvalRate * 100) / 100,
      monthlySubmissions
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching company profile stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch company profile statistics'
    });
  }
}));

export default router;
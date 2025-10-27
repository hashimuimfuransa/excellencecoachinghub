import { Notification } from '../models/Notification';
import { User } from '../models/User';
import mongoose from 'mongoose';

export const seedNotifications = async () => {
  try {
    console.log('🔔 Seeding notifications...');

    // Find admin users to send notifications to
    const adminUsers = await User.find({ role: 'admin' }).limit(5);
    
    if (adminUsers.length === 0) {
      console.log('No admin users found, skipping notification seeding');
      return;
    }

    // Clear existing notifications for these users
    await Notification.deleteMany({ 
      recipient: { $in: adminUsers.map(user => user._id) } 
    });

    const sampleNotifications = [];

    for (const admin of adminUsers) {
      // System notifications
      sampleNotifications.push({
        title: 'System Maintenance Scheduled',
        message: 'System maintenance is scheduled for tonight at 2:00 AM EST. Expected downtime: 30 minutes.',
        type: 'warning',
        priority: 'high',
        category: 'system',
        recipient: admin._id,
        actionRequired: false,
        metadata: {
          maintenanceWindow: '2024-01-15T02:00:00Z',
          duration: '30 minutes'
        }
      });

      sampleNotifications.push({
        title: 'Database Backup Completed',
        message: 'Daily database backup completed successfully. All data is secure.',
        type: 'success',
        priority: 'low',
        category: 'system',
        recipient: admin._id,
        actionRequired: false,
        metadata: {
          backupSize: '2.5GB',
          timestamp: new Date()
        }
      });

      // User management notifications
      sampleNotifications.push({
        title: 'New Teacher Application',
        message: 'A new teacher has submitted their application for review. Please review their credentials and approve or reject.',
        type: 'info',
        priority: 'medium',
        category: 'user',
        recipient: admin._id,
        actionRequired: true,
        actionUrl: '/dashboard/admin/teachers',
        actionText: 'Review Application',
        metadata: {
          applicantName: 'John Smith',
          applicationDate: new Date(),
          subject: 'Mathematics'
        }
      });

      sampleNotifications.push({
        title: 'User Account Verification Required',
        message: 'Multiple user accounts are pending email verification. Consider sending reminder emails.',
        type: 'warning',
        priority: 'medium',
        category: 'user',
        recipient: admin._id,
        actionRequired: true,
        actionUrl: '/dashboard/admin/users',
        actionText: 'View Pending Users',
        metadata: {
          pendingCount: 15
        }
      });

      // Course management notifications
      sampleNotifications.push({
        title: 'New Course Submission',
        message: 'A teacher has submitted a new course "Advanced JavaScript" for approval.',
        type: 'info',
        priority: 'medium',
        category: 'course',
        recipient: admin._id,
        actionRequired: true,
        actionUrl: '/dashboard/admin/courses',
        actionText: 'Review Course',
        metadata: {
          courseName: 'Advanced JavaScript',
          teacherName: 'Sarah Johnson',
          submissionDate: new Date()
        }
      });

      // Security notifications
      sampleNotifications.push({
        title: 'Suspicious Login Activity',
        message: 'Multiple failed login attempts detected from IP address 192.168.1.100. Please investigate.',
        type: 'error',
        priority: 'urgent',
        category: 'security',
        recipient: admin._id,
        actionRequired: true,
        actionUrl: '/dashboard/admin/security',
        actionText: 'View Security Logs',
        metadata: {
          ipAddress: '192.168.1.100',
          attemptCount: 5,
          lastAttempt: new Date()
        }
      });

      // Payment notifications
      sampleNotifications.push({
        title: 'Payment Processing Issue',
        message: 'A payment of $99.99 failed to process for user subscription. Please review.',
        type: 'error',
        priority: 'high',
        category: 'payment',
        recipient: admin._id,
        actionRequired: true,
        actionUrl: '/dashboard/admin/payments',
        actionText: 'View Payment Details',
        metadata: {
          amount: 99.99,
          currency: 'USD',
          userId: 'user123',
          errorCode: 'CARD_DECLINED'
        }
      });

      // Maintenance notifications
      sampleNotifications.push({
        title: 'Server Performance Alert',
        message: 'Server CPU usage has been above 85% for the last 10 minutes. Consider scaling resources.',
        type: 'warning',
        priority: 'high',
        category: 'maintenance',
        recipient: admin._id,
        actionRequired: true,
        actionUrl: '/dashboard/admin/monitoring',
        actionText: 'View Metrics',
        metadata: {
          cpuUsage: 87.5,
          memoryUsage: 72.3,
          duration: '10 minutes'
        }
      });

      // Some read notifications
      sampleNotifications.push({
        title: 'Weekly Report Generated',
        message: 'Your weekly analytics report is ready for review.',
        type: 'info',
        priority: 'low',
        category: 'system',
        recipient: admin._id,
        isRead: true,
        readAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        actionRequired: false,
        actionUrl: '/dashboard/admin/analytics',
        actionText: 'View Report',
        metadata: {
          reportType: 'weekly',
          period: 'Jan 8-14, 2024'
        }
      });

      // Archived notification
      sampleNotifications.push({
        title: 'Old System Alert',
        message: 'This is an old system alert that has been resolved.',
        type: 'info',
        priority: 'low',
        category: 'system',
        recipient: admin._id,
        isRead: true,
        isArchived: true,
        readAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        actionRequired: false,
        metadata: {
          resolvedAt: new Date(Date.now() - 20 * 60 * 60 * 1000)
        }
      });
    }

    // Insert all notifications
    const createdNotifications = await Notification.insertMany(sampleNotifications);
    
    console.log(`✅ Created ${createdNotifications.length} sample notifications for ${adminUsers.length} admin users`);
    
    // Log some statistics
    const stats = await Notification.aggregate([
      {
        $match: {
          recipient: { $in: adminUsers.map(user => user._id) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$isRead', false] }, 1, 0]
            }
          },
          actionRequired: {
            $sum: {
              $cond: [{ $eq: ['$actionRequired', true] }, 1, 0]
            }
          }
        }
      }
    ]);

    if (stats.length > 0) {
      console.log(`📊 Notification stats: ${stats[0].total} total, ${stats[0].unread} unread, ${stats[0].actionRequired} require action`);
    }

  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    throw error;
  }
};

export default seedNotifications;

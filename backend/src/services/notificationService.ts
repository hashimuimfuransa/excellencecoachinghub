import { Notification } from '../models/Notification';
import { User } from '../models/User';
import { NotificationType, UserRole, CourseStatus } from '../../../shared/types';

// Import io instance - will be set after server initialization
let io: any = null;

export const setSocketIO = (socketInstance: any) => {
  io = socketInstance;
};

export interface CreateNotificationData {
  recipient?: string; // Specific user ID
  recipientRole?: UserRole; // Send to all users with this role
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  sender?: string;
  expiresAt?: Date;
}

class NotificationService {
  /**
   * Create and send notification to specific user or all users with a role
   */
  async createNotification(notificationData: CreateNotificationData): Promise<void> {
    try {
      console.log('🔔 CreateNotification called with data:', {
        type: notificationData.type,
        title: notificationData.title,
        recipientRole: notificationData.recipientRole,
        recipient: notificationData.recipient
      });

      let recipients: string[] = [];

      if (notificationData.recipient) {
        // Send to specific user
        recipients = [notificationData.recipient];
        console.log('📤 Sending to specific user:', notificationData.recipient);
      } else if (notificationData.recipientRole) {
        // Send to all users with specific role
        console.log('🔍 Finding users with role:', notificationData.recipientRole);
        const users = await User.find({
          role: notificationData.recipientRole,
          isActive: true
        }).select('_id firstName lastName email');
        recipients = users.map(user => user._id.toString());
        console.log('👥 Found recipients:', recipients.length, 'users');
        console.log('📋 Recipient details:', users.map(u => ({ id: u._id, name: `${u.firstName} ${u.lastName}`, email: u.email })));

        if (recipients.length === 0) {
          console.log('⚠️ WARNING: No active users found with role:', notificationData.recipientRole);
          console.log('💡 TIP: Make sure there are active admin users in the database');
          return; // Don't create notifications if no recipients
        }
      } else {
        throw new Error('Either recipient or recipientRole must be specified');
      }

      // Create notifications for all recipients
      console.log('💾 Creating notifications for recipients...');
      const notifications = await Promise.all(
        recipients.map(async (recipientId) => {
          console.log('📝 Creating notification for recipient:', recipientId);
          const notification = new Notification({
            recipient: recipientId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data || {},
            priority: notificationData.priority || 'medium',
            actionUrl: notificationData.actionUrl,
            actionText: notificationData.actionText,
            sender: notificationData.sender,
            expiresAt: notificationData.expiresAt,
            isRead: false
          });

          await notification.save();
          console.log('✅ Notification saved to database:', notification._id);

          await notification.populate('sender', 'firstName lastName');
          console.log('👤 Notification populated with sender info');

          return notification;
        })
      );

      console.log(`📊 Created ${notifications.length} notification(s) in database`);

      // Send real-time notifications via Socket.IO
      if (io) {
        console.log('🔌 Socket.IO instance available, sending real-time notifications...');
        notifications.forEach(notification => {
          const room = `user:${notification.recipient}`;
          console.log('📡 Emitting notification to room:', room);
          io.to(room).emit('notification', {
            id: notification._id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            data: notification.data,
            priority: notification.priority,
            actionUrl: notification.actionUrl,
            actionText: notification.actionText,
            sender: notification.sender,
            createdAt: notification.createdAt,
            isRead: notification.isRead
          });
          console.log('✅ Notification emitted to room:', room);
        });
      } else {
        console.log('❌ Socket.IO instance not available, skipping real-time notifications');
      }

      console.log(`✅ Created ${notifications.length} notification(s) of type: ${notificationData.type}`);
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Notify admins about pending teacher profile approval
   */
  async notifyAdminsTeacherProfilePending(teacherId: string, teacherName: string): Promise<void> {
    console.log('🔔 NotificationService: notifyAdminsTeacherProfilePending called');
    console.log('📋 Teacher ID:', teacherId);
    console.log('👤 Teacher Name:', teacherName);

    try {
      await this.createNotification({
        recipientRole: UserRole.ADMIN,
        type: NotificationType.TEACHER_PROFILE_PENDING,
        title: 'New Teacher Profile Pending Approval',
        message: `${teacherName} has submitted their teacher profile for approval.`,
        data: {
          teacherId,
          teacherName,
          profileUrl: `/dashboard/admin/teacher-profiles/${teacherId}`
        },
        priority: 'high',
        actionUrl: `/dashboard/admin/teacher-profiles`,
        actionText: 'Review Profile',
        sender: teacherId
      });
      console.log('✅ NotificationService: Successfully created notification for teacher profile');
    } catch (error) {
      console.error('❌ NotificationService: Error in notifyAdminsTeacherProfilePending:', error);
      throw error;
    }
  }

  /**
   * Notify teacher about profile approval status
   */
  async notifyTeacherProfileStatus(
    teacherId: string, 
    status: 'approved' | 'rejected', 
    adminId: string,
    feedback?: string
  ): Promise<void> {
    const isApproved = status === 'approved';
    
    await this.createNotification({
      recipient: teacherId,
      type: isApproved ? NotificationType.TEACHER_PROFILE_APPROVED : NotificationType.TEACHER_PROFILE_REJECTED,
      title: `Teacher Profile ${isApproved ? 'Approved' : 'Rejected'}`,
      message: isApproved 
        ? 'Congratulations! Your teacher profile has been approved. You can now create courses.'
        : `Your teacher profile has been rejected. ${feedback ? `Reason: ${feedback}` : 'Please review and resubmit.'}`,
      data: {
        status,
        feedback,
        adminId,
        profileUrl: '/dashboard/teacher/profile'
      },
      priority: 'high',
      actionUrl: '/dashboard/teacher/profile',
      actionText: isApproved ? 'View Profile' : 'Update Profile',
      sender: adminId
    });
  }

  /**
   * Notify admins about pending course approval
   */
  async notifyAdminsCoursesPending(courseId: string, courseTitle: string, instructorId: string, instructorName: string): Promise<void> {
    await this.createNotification({
      recipientRole: UserRole.ADMIN,
      type: NotificationType.COURSE_PENDING_APPROVAL,
      title: 'New Course Pending Approval',
      message: `${instructorName} has submitted a new course "${courseTitle}" for approval.`,
      data: {
        courseId,
        courseTitle,
        instructorId,
        instructorName,
        courseUrl: `/dashboard/admin/courses/${courseId}`
      },
      priority: 'high',
      actionUrl: `/dashboard/admin/courses`,
      actionText: 'Review Course',
      sender: instructorId
    });
  }

  /**
   * Notify teacher about course approval status
   */
  async notifyTeacherCourseStatus(
    instructorId: string,
    courseId: string,
    courseTitle: string,
    status: CourseStatus,
    adminId: string,
    feedback?: string
  ): Promise<void> {
    const isApproved = status === CourseStatus.APPROVED;
    
    await this.createNotification({
      recipient: instructorId,
      type: isApproved ? NotificationType.COURSE_APPROVED : NotificationType.COURSE_REJECTED,
      title: `Course ${isApproved ? 'Approved' : 'Rejected'}`,
      message: isApproved
        ? `Your course "${courseTitle}" has been approved and is now live!`
        : `Your course "${courseTitle}" has been rejected. ${feedback ? `Reason: ${feedback}` : 'Please review and resubmit.'}`,
      data: {
        courseId,
        courseTitle,
        status,
        feedback,
        adminId,
        courseUrl: `/dashboard/teacher/courses/${courseId}`
      },
      priority: 'high',
      actionUrl: '/dashboard/teacher/courses',
      actionText: isApproved ? 'View Course' : 'Edit Course',
      sender: adminId
    });
  }

  /**
   * Get notification statistics for admin dashboard
   */
  async getNotificationStats(): Promise<{
    totalUnread: number;
    pendingTeacherProfiles: number;
    pendingCourses: number;
    recentNotifications: any[];
  }> {
    const [
      totalUnread,
      pendingTeacherProfiles,
      pendingCourses,
      recentNotifications
    ] = await Promise.all([
      Notification.countDocuments({ isRead: false }),
      Notification.countDocuments({ 
        type: NotificationType.TEACHER_PROFILE_PENDING,
        isRead: false 
      }),
      Notification.countDocuments({ 
        type: NotificationType.COURSE_PENDING_APPROVAL,
        isRead: false 
      }),
      Notification.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('sender', 'firstName lastName')
        .populate('recipient', 'firstName lastName')
    ]);

    return {
      totalUnread,
      pendingTeacherProfiles,
      pendingCourses,
      recentNotifications
    };
  }

  /**
   * Notify instructor about new student enrollment
   */
  async notifyInstructorNewEnrollment(
    instructorId: string,
    courseId: string,
    courseTitle: string,
    studentName: string
  ): Promise<void> {
    try {
      const notification = new Notification({
        recipient: instructorId,
        type: NotificationType.COURSE_ENROLLMENT,
        title: 'New Student Enrollment',
        message: `${studentName} has enrolled in your course "${courseTitle}"`,
        data: {
          courseId,
          courseTitle,
          studentName,
          action: 'enrollment'
        }
      });

      await notification.save();

      // Send real-time notification if instructor is online
      if (this.io) {
        this.io.to(`user_${instructorId}`).emit('notification', {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          createdAt: notification.createdAt
        });
      }

      console.log(`✅ Notified instructor ${instructorId} about new enrollment in course ${courseTitle}`);
    } catch (error) {
      console.error('❌ Failed to notify instructor about enrollment:', error);
      throw error;
    }
  }

  /**
   * Notify students about upcoming live session
   */
  async notifyStudentsLiveSessionScheduled(
    courseId: string,
    courseTitle: string,
    sessionTitle: string,
    sessionId: string,
    scheduledTime: Date,
    instructorName: string
  ): Promise<void> {
    try {
      // Get all enrolled students for the course from UserProgress
      const UserProgress = require('../models/UserProgress').UserProgress;
      const enrollments = await UserProgress.find({ course: courseId })
        .populate('user', '_id firstName lastName email')
        .select('user');

      if (!enrollments || !enrollments.length) {
        console.log('No enrolled students found for course:', courseId);
        return;
      }

      const studentIds = enrollments
        .filter((enrollment: any) => enrollment.user)
        .map((enrollment: any) => enrollment.user._id.toString());

      await this.createNotification({
        recipient: undefined, // Will be set for each student
        type: NotificationType.LIVE_SESSION_SCHEDULED,
        title: 'Live Session Scheduled',
        message: `A new live session "${sessionTitle}" has been scheduled for ${courseTitle} on ${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString()}`,
        data: {
          courseId,
          courseTitle,
          sessionId,
          sessionTitle,
          scheduledTime: scheduledTime.toISOString(),
          instructorName
        },
        priority: 'high',
        actionUrl: `/dashboard/student/live-sessions/${sessionId}`,
        actionText: 'View Session',
        // Send to each student individually
        recipientRole: undefined
      });

      // Create individual notifications for each student
      for (const studentId of studentIds) {
        await this.createNotification({
          recipient: studentId,
          type: NotificationType.LIVE_SESSION_SCHEDULED,
          title: 'Live Session Scheduled',
          message: `A new live session "${sessionTitle}" has been scheduled for ${courseTitle} on ${scheduledTime.toLocaleDateString()} at ${scheduledTime.toLocaleTimeString()}`,
          data: {
            courseId,
            courseTitle,
            sessionId,
            sessionTitle,
            scheduledTime: scheduledTime.toISOString(),
            instructorName
          },
          priority: 'high',
          actionUrl: `/dashboard/student/live-sessions/${sessionId}`,
          actionText: 'View Session'
        });
      }

      console.log(`✅ Notified ${studentIds.length} students about live session: ${sessionTitle}`);
    } catch (error) {
      console.error('❌ Failed to notify students about live session:', error);
      throw error;
    }
  }

  /**
   * Notify students that a live session is starting soon (15 minutes before)
   */
  async notifyStudentsLiveSessionStartingSoon(
    courseId: string,
    courseTitle: string,
    sessionTitle: string,
    sessionId: string,
    scheduledTime: Date,
    instructorName: string
  ): Promise<void> {
    try {
      const UserProgress = require('../models/UserProgress').UserProgress;
      const enrollments = await UserProgress.find({ course: courseId })
        .populate('user', '_id firstName lastName email')
        .select('user');

      if (!enrollments || !enrollments.length) {
        return;
      }

      const studentIds = enrollments
        .filter((enrollment: any) => enrollment.user)
        .map((enrollment: any) => enrollment.user._id.toString());

      for (const studentId of studentIds) {
        await this.createNotification({
          recipient: studentId,
          type: NotificationType.LIVE_SESSION_STARTING,
          title: 'Live Session Starting Soon',
          message: `"${sessionTitle}" for ${courseTitle} starts in 15 minutes!`,
          data: {
            courseId,
            courseTitle,
            sessionId,
            sessionTitle,
            scheduledTime: scheduledTime.toISOString(),
            instructorName
          },
          priority: 'urgent',
          actionUrl: `/dashboard/student/live-sessions/${sessionId}/room`,
          actionText: 'Join Now'
        });
      }

      console.log(`✅ Notified ${studentIds.length} students that live session is starting soon: ${sessionTitle}`);
    } catch (error) {
      console.error('❌ Failed to notify students about live session starting soon:', error);
      throw error;
    }
  }

  /**
   * Notify students that a live session is now live
   */
  async notifyStudentsLiveSessionLive(
    courseId: string,
    courseTitle: string,
    sessionTitle: string,
    sessionId: string,
    instructorName: string
  ): Promise<void> {
    try {
      const UserProgress = require('../models/UserProgress').UserProgress;
      const enrollments = await UserProgress.find({ course: courseId })
        .populate('user', '_id firstName lastName email')
        .select('user');

      if (!enrollments || !enrollments.length) {
        return;
      }

      const studentIds = enrollments
        .filter((enrollment: any) => enrollment.user)
        .map((enrollment: any) => enrollment.user._id.toString());

      for (const studentId of studentIds) {
        await this.createNotification({
          recipient: studentId,
          type: NotificationType.LIVE_SESSION_LIVE,
          title: 'Live Session is Now Live!',
          message: `"${sessionTitle}" for ${courseTitle} is now live. Join now!`,
          data: {
            courseId,
            courseTitle,
            sessionId,
            sessionTitle,
            instructorName
          },
          priority: 'urgent',
          actionUrl: `/dashboard/student/live-sessions/${sessionId}/room`,
          actionText: 'Join Live Session'
        });
      }

      console.log(`✅ Notified ${studentIds.length} students that live session is live: ${sessionTitle}`);
    } catch (error) {
      console.error('❌ Failed to notify students about live session being live:', error);
      throw error;
    }
  }

  /**
   * Notify students that a live session recording is available
   */
  async notifyStudentsRecordingAvailable(
    courseId: string,
    courseTitle: string,
    sessionTitle: string,
    sessionId: string,
    recordingUrl: string,
    instructorName: string
  ): Promise<void> {
    try {
      const UserProgress = require('../models/UserProgress').UserProgress;
      const enrollments = await UserProgress.find({ course: courseId })
        .populate('user', '_id firstName lastName email')
        .select('user');

      if (!enrollments || !enrollments.length) {
        console.log('No enrolled students found for recording notification:', courseId);
        return;
      }

      const studentIds = enrollments
        .filter((enrollment: any) => enrollment.user)
        .map((enrollment: any) => enrollment.user._id.toString());

      for (const studentId of studentIds) {
        await this.createNotification({
          recipient: studentId,
          type: NotificationType.LIVE_SESSION_RECORDED,
          title: 'Session Recording Available',
          message: `The recording for "${sessionTitle}" from ${courseTitle} is now available to watch.`,
          data: {
            courseId,
            courseTitle,
            sessionId,
            sessionTitle,
            recordingUrl,
            instructorName
          },
          priority: 'medium',
          actionUrl: `/dashboard/student/courses/${courseId}/recordings/${sessionId}`,
          actionText: 'Watch Recording'
        });
      }

      console.log(`✅ Notified ${studentIds.length} students about recording availability: ${sessionTitle}`);
    } catch (error) {
      console.error('❌ Failed to notify students about recording availability:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();

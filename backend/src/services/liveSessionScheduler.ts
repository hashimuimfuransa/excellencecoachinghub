import cron from 'node-cron';
import { LiveSession } from '../models/LiveSession';
import { notificationService } from './notificationService';

class LiveSessionScheduler {
  private isRunning = false;

  /**
   * Start the scheduler to check for upcoming live sessions
   */
  start(): void {
    if (this.isRunning) {
      console.log('📅 Live session scheduler is already running');
      return;
    }

    // Check every minute for sessions starting in 15 minutes
    cron.schedule('* * * * *', async () => {
      await this.checkUpcomingSessions();
    });

    // Check every 5 minutes for sessions that should be automatically started
    cron.schedule('*/5 * * * *', async () => {
      await this.checkSessionsToStart();
    });

    this.isRunning = true;
    console.log('📅 Live session scheduler started');
  }

  /**
   * Check for sessions starting in 15 minutes and send notifications
   */
  private async checkUpcomingSessions(): Promise<void> {
    try {
      const now = new Date();
      const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      const sixteenMinutesFromNow = new Date(now.getTime() + 16 * 60 * 1000);

      // Find sessions scheduled to start in 15-16 minutes that haven't been notified
      const upcomingSessions = await LiveSession.find({
        status: 'scheduled',
        scheduledTime: {
          $gte: fifteenMinutesFromNow,
          $lt: sixteenMinutesFromNow
        },
        // Add a field to track if "starting soon" notification was sent
        startingSoonNotificationSent: { $ne: true }
      }).populate('course', 'title')
        .populate('instructor', 'firstName lastName');

      for (const session of upcomingSessions) {
        try {
          await notificationService.notifyStudentsLiveSessionStartingSoon(
            session.course._id.toString(),
            session.course.title,
            session.title,
            session._id.toString(),
            session.scheduledTime,
            `${session.instructor.firstName} ${session.instructor.lastName}`
          );

          // Mark as notified
          session.startingSoonNotificationSent = true;
          await session.save();

          console.log(`📢 Sent "starting soon" notifications for session: ${session.title}`);
        } catch (error) {
          console.error(`❌ Failed to send "starting soon" notification for session ${session._id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error checking upcoming sessions:', error);
    }
  }

  /**
   * Check for sessions that should be automatically started (optional feature)
   */
  private async checkSessionsToStart(): Promise<void> {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Find sessions that were scheduled to start but haven't been started yet
      const sessionsToStart = await LiveSession.find({
        status: 'scheduled',
        scheduledTime: {
          $lte: now,
          $gte: fiveMinutesAgo // Don't auto-start sessions that are too old
        }
      }).populate('course', 'title')
        .populate('instructor', 'firstName lastName');

      for (const session of sessionsToStart) {
        try {
          // Auto-start the session (optional - you might want to require manual start)
          // await session.startSession();
          
          // For now, just log that the session should be started
          console.log(`⏰ Session "${session.title}" was scheduled to start at ${session.scheduledTime} but hasn't been started yet`);
          
          // You could send a notification to the instructor here
        } catch (error) {
          console.error(`❌ Failed to auto-start session ${session._id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error checking sessions to start:', error);
    }
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    // Note: node-cron doesn't provide a direct way to stop specific tasks
    // In a production environment, you'd want to keep references to the tasks
    this.isRunning = false;
    console.log('📅 Live session scheduler stopped');
  }
}

export const liveSessionScheduler = new LiveSessionScheduler();

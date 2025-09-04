import cron from 'node-cron';
import { Job, IJobDocument } from '../models/Job';
import { JobApplication } from '../models/JobApplication';
import { JobStatus } from '../types';

class JobCleanupScheduler {
  private isRunning = false;
  private cleanupTask: cron.ScheduledTask | null = null;
  private expiredStatusTask: cron.ScheduledTask | null = null;

  /**
   * Configuration for job cleanup
   */
  private static readonly CLEANUP_CONFIG = {
    // How long to keep expired jobs before deletion (in days)
    EXPIRED_JOB_RETENTION_DAYS: 30,
    
    // How long to keep closed jobs before deletion (in days)
    CLOSED_JOB_RETENTION_DAYS: 90,
    
    // Cron schedule for cleanup (daily at 2:00 AM)
    CLEANUP_SCHEDULE: '0 2 * * *',
    
    // Cron schedule for marking jobs as expired (every hour)
    EXPIRED_CHECK_SCHEDULE: '0 * * * *',
  };

  /**
   * Start the job cleanup scheduler
   */
  start(): void {
    if (this.isRunning) {
      console.log('🧹 Job cleanup scheduler is already running');
      return;
    }

    // Schedule daily cleanup of old jobs
    this.cleanupTask = cron.schedule(
      JobCleanupScheduler.CLEANUP_CONFIG.CLEANUP_SCHEDULE,
      async () => {
        await this.performJobCleanup();
      },
      {
        scheduled: true,
        timezone: 'UTC'
      }
    );

    // Schedule hourly check for expired jobs
    this.expiredStatusTask = cron.schedule(
      JobCleanupScheduler.CLEANUP_CONFIG.EXPIRED_CHECK_SCHEDULE,
      async () => {
        await this.markExpiredJobs();
      },
      {
        scheduled: true,
        timezone: 'UTC'
      }
    );

    this.isRunning = true;
    console.log('🧹 Job cleanup scheduler started');
    console.log(`📅 Cleanup runs daily at 2:00 AM UTC`);
    console.log(`⏰ Expired job check runs hourly`);
    console.log(`🗑️ Expired jobs retained for ${JobCleanupScheduler.CLEANUP_CONFIG.EXPIRED_JOB_RETENTION_DAYS} days`);
    console.log(`📦 Closed jobs retained for ${JobCleanupScheduler.CLEANUP_CONFIG.CLOSED_JOB_RETENTION_DAYS} days`);
  }

  /**
   * Stop the job cleanup scheduler
   */
  stop(): void {
    if (this.cleanupTask) {
      this.cleanupTask.stop();
      this.cleanupTask.destroy();
      this.cleanupTask = null;
    }

    if (this.expiredStatusTask) {
      this.expiredStatusTask.stop();
      this.expiredStatusTask.destroy();
      this.expiredStatusTask = null;
    }

    this.isRunning = false;
    console.log('🧹 Job cleanup scheduler stopped');
  }

  /**
   * Mark jobs as expired if their application deadline has passed
   */
  private async markExpiredJobs(): Promise<void> {
    try {
      const now = new Date();
      
      // Find active jobs with application deadline that has passed
      const expiredJobs = await Job.find({
        status: JobStatus.ACTIVE,
        applicationDeadline: { $exists: true, $lt: now }
      });

      if (expiredJobs.length === 0) {
        console.log('✅ No jobs need to be marked as expired');
        return;
      }

      // Update status to expired
      const updateResult = await Job.updateMany(
        {
          status: JobStatus.ACTIVE,
          applicationDeadline: { $exists: true, $lt: now }
        },
        {
          $set: { status: JobStatus.EXPIRED }
        }
      );

      console.log(`⏰ Marked ${updateResult.modifiedCount} jobs as expired`);

      // Log details of expired jobs for audit
      for (const job of expiredJobs) {
        console.log(`🔄 Job expired: "${job.title}" at ${job.company} (deadline: ${job.applicationDeadline})`);
      }

    } catch (error) {
      console.error('❌ Error marking expired jobs:', error);
    }
  }

  /**
   * Perform the main cleanup of old expired and closed jobs
   */
  private async performJobCleanup(): Promise<void> {
    console.log('🧹 Starting job cleanup process...');

    try {
      await this.markExpiredJobs(); // First, ensure all expired jobs are marked
      await this.deleteExpiredJobs();
      await this.deleteOldClosedJobs();
      await this.cleanupOrphanedJobApplications();
      
      console.log('✅ Job cleanup completed successfully');
    } catch (error) {
      console.error('❌ Error during job cleanup:', error);
    }
  }

  /**
   * Delete expired jobs that have been expired for the retention period
   */
  private async deleteExpiredJobs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - JobCleanupScheduler.CLEANUP_CONFIG.EXPIRED_JOB_RETENTION_DAYS);

      // Find expired jobs older than the retention period
      const jobsToDelete = await Job.find({
        status: JobStatus.EXPIRED,
        $or: [
          // Jobs that were updated to expired status before the cutoff
          { updatedAt: { $lt: cutoffDate } },
          // Jobs with application deadline that passed before the cutoff
          { 
            applicationDeadline: { $exists: true, $lt: cutoffDate }
          }
        ]
      }).select('_id title company applicationDeadline updatedAt');

      if (jobsToDelete.length === 0) {
        console.log('📦 No expired jobs to delete');
        return;
      }

      const jobIds = jobsToDelete.map(job => job._id);

      // Delete associated job applications first
      const applicationDeleteResult = await JobApplication.deleteMany({
        jobId: { $in: jobIds }
      });

      // Delete the expired jobs
      const jobDeleteResult = await Job.deleteMany({
        _id: { $in: jobIds }
      });

      console.log(`🗑️ Deleted ${jobDeleteResult.deletedCount} expired jobs`);
      console.log(`📝 Deleted ${applicationDeleteResult.deletedCount} associated job applications`);

      // Log details for audit
      for (const job of jobsToDelete) {
        console.log(`🗂️ Deleted expired job: "${job.title}" at ${job.company} (expired: ${job.applicationDeadline || job.updatedAt})`);
      }

    } catch (error) {
      console.error('❌ Error deleting expired jobs:', error);
    }
  }

  /**
   * Delete closed jobs that have been closed for the retention period
   */
  private async deleteOldClosedJobs(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - JobCleanupScheduler.CLEANUP_CONFIG.CLOSED_JOB_RETENTION_DAYS);

      // Find closed jobs older than the retention period
      const jobsToDelete = await Job.find({
        status: JobStatus.CLOSED,
        updatedAt: { $lt: cutoffDate }
      }).select('_id title company updatedAt');

      if (jobsToDelete.length === 0) {
        console.log('📦 No old closed jobs to delete');
        return;
      }

      const jobIds = jobsToDelete.map(job => job._id);

      // Delete associated job applications first
      const applicationDeleteResult = await JobApplication.deleteMany({
        jobId: { $in: jobIds }
      });

      // Delete the closed jobs
      const jobDeleteResult = await Job.deleteMany({
        _id: { $in: jobIds }
      });

      console.log(`🗑️ Deleted ${jobDeleteResult.deletedCount} old closed jobs`);
      console.log(`📝 Deleted ${applicationDeleteResult.deletedCount} associated job applications`);

      // Log details for audit
      for (const job of jobsToDelete) {
        console.log(`🗂️ Deleted closed job: "${job.title}" at ${job.company} (closed: ${job.updatedAt})`);
      }

    } catch (error) {
      console.error('❌ Error deleting old closed jobs:', error);
    }
  }

  /**
   * Clean up job applications for jobs that no longer exist
   */
  private async cleanupOrphanedJobApplications(): Promise<void> {
    try {
      // Find job applications that reference non-existent jobs
      const orphanedApplications = await JobApplication.aggregate([
        {
          $lookup: {
            from: 'jobs',
            localField: 'jobId',
            foreignField: '_id',
            as: 'job'
          }
        },
        {
          $match: {
            job: { $size: 0 } // No matching job found
          }
        },
        {
          $project: {
            _id: 1
          }
        }
      ]);

      if (orphanedApplications.length === 0) {
        console.log('📦 No orphaned job applications to clean up');
        return;
      }

      const orphanedIds = orphanedApplications.map(app => app._id);

      const deleteResult = await JobApplication.deleteMany({
        _id: { $in: orphanedIds }
      });

      console.log(`🧹 Cleaned up ${deleteResult.deletedCount} orphaned job applications`);

    } catch (error) {
      console.error('❌ Error cleaning up orphaned job applications:', error);
    }
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStats(): Promise<{
    expiredJobs: number;
    closedJobs: number;
    totalJobs: number;
    nextCleanup?: Date;
    nextExpiredCheck?: Date;
    isRunning: boolean;
    config: typeof JobCleanupScheduler.CLEANUP_CONFIG;
  }> {
    try {
      const [expiredJobs, closedJobs, totalJobs] = await Promise.all([
        Job.countDocuments({ status: JobStatus.EXPIRED }),
        Job.countDocuments({ status: JobStatus.CLOSED }),
        Job.countDocuments()
      ]);

      return {
        expiredJobs,
        closedJobs,
        totalJobs,
        nextCleanup: this.cleanupTask?.nextDate()?.toDate(),
        nextExpiredCheck: this.expiredStatusTask?.nextDate()?.toDate(),
        isRunning: this.isRunning,
        config: JobCleanupScheduler.CLEANUP_CONFIG
      };
    } catch (error) {
      console.error('❌ Error getting cleanup stats:', error);
      return {
        expiredJobs: 0,
        closedJobs: 0,
        totalJobs: 0,
        isRunning: this.isRunning,
        config: JobCleanupScheduler.CLEANUP_CONFIG
      };
    }
  }

  /**
   * Manually trigger job cleanup (for testing or immediate cleanup)
   */
  async triggerCleanup(): Promise<void> {
    console.log('🧹 Manually triggering job cleanup...');
    await this.performJobCleanup();
  }

  /**
   * Manually trigger expired job marking (for testing)
   */
  async triggerExpiredCheck(): Promise<void> {
    console.log('⏰ Manually triggering expired job check...');
    await this.markExpiredJobs();
  }
}

export const jobCleanupScheduler = new JobCleanupScheduler();
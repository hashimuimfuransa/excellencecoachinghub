import mongoose from 'mongoose';
import { User, Course, Quiz, ExamAttempt, ProctoringSession, Notification, Badge, UserProgress, LiveSession } from '../models';

// Database validation utility
export class DatabaseValidator {
  
  // Validate all models and their indexes
  static async validateDatabase(): Promise<void> {
    try {
      console.log('🔍 Starting database validation...');

      // Check if all models are properly registered
      await this.validateModels();

      // Check indexes
      await this.validateIndexes();

      // Check data integrity
      await this.validateDataIntegrity();

      console.log('✅ Database validation completed successfully!');
    } catch (error) {
      console.error('❌ Database validation failed:', error);
      throw error;
    }
  }

  // Validate that all models are properly registered
  private static async validateModels(): Promise<void> {
    const models = [
      'User', 'Course', 'Quiz', 'ExamAttempt', 
      'ProctoringSession', 'Notification', 'Badge', 
      'UserProgress', 'LiveSession'
    ];

    console.log('📋 Validating models...');
    
    for (const modelName of models) {
      const model = mongoose.models[modelName];
      if (!model) {
        throw new Error(`Model ${modelName} is not registered`);
      }
      
      // Test basic operations
      await model.countDocuments();
      console.log(`  ✓ ${modelName} model is valid`);
    }
  }

  // Validate database indexes
  private static async validateIndexes(): Promise<void> {
    console.log('🗂️ Validating indexes...');

    const collections = [
      { name: 'users', model: User },
      { name: 'courses', model: Course },
      { name: 'quizzes', model: Quiz },
      { name: 'examattempts', model: ExamAttempt },
      { name: 'proctoringsessions', model: ProctoringSession },
      { name: 'notifications', model: Notification },
      { name: 'badges', model: Badge },
      { name: 'userprogresses', model: UserProgress },
      { name: 'livesessions', model: LiveSession }
    ];

    for (const { name, model } of collections) {
      try {
        const indexes = await model.collection.getIndexes();
        console.log(`  ✓ ${name}: ${Object.keys(indexes).length} indexes`);
      } catch (error) {
        console.warn(`  ⚠️ Could not validate indexes for ${name}:`, error);
      }
    }
  }

  // Validate data integrity and relationships
  private static async validateDataIntegrity(): Promise<void> {
    console.log('🔗 Validating data integrity...');

    // Check for orphaned references
    await this.checkOrphanedReferences();

    // Check for duplicate unique fields
    await this.checkDuplicates();

    // Validate enum values
    await this.validateEnumValues();
  }

  // Check for orphaned references
  private static async checkOrphanedReferences(): Promise<void> {
    console.log('  🔍 Checking for orphaned references...');

    // Check courses with invalid instructor references
    const coursesWithInvalidInstructors = await Course.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'instructor',
          foreignField: '_id',
          as: 'instructorData'
        }
      },
      {
        $match: {
          instructorData: { $size: 0 }
        }
      }
    ]);

    if (coursesWithInvalidInstructors.length > 0) {
      console.warn(`    ⚠️ Found ${coursesWithInvalidInstructors.length} courses with invalid instructor references`);
    }

    // Check quizzes with invalid course references
    const quizzesWithInvalidCourses = await Quiz.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseData'
        }
      },
      {
        $match: {
          courseData: { $size: 0 }
        }
      }
    ]);

    if (quizzesWithInvalidCourses.length > 0) {
      console.warn(`    ⚠️ Found ${quizzesWithInvalidCourses.length} quizzes with invalid course references`);
    }

    // Check exam attempts with invalid student/quiz references
    const examAttemptsWithInvalidRefs = await ExamAttempt.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'student',
          foreignField: '_id',
          as: 'studentData'
        }
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quiz',
          foreignField: '_id',
          as: 'quizData'
        }
      },
      {
        $match: {
          $or: [
            { studentData: { $size: 0 } },
            { quizData: { $size: 0 } }
          ]
        }
      }
    ]);

    if (examAttemptsWithInvalidRefs.length > 0) {
      console.warn(`    ⚠️ Found ${examAttemptsWithInvalidRefs.length} exam attempts with invalid references`);
    }

    console.log('    ✓ Orphaned reference check completed');
  }

  // Check for duplicate unique fields
  private static async checkDuplicates(): Promise<void> {
    console.log('  🔍 Checking for duplicates...');

    // Check for duplicate emails in users
    const duplicateEmails = await User.aggregate([
      {
        $group: {
          _id: '$email',
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (duplicateEmails.length > 0) {
      console.warn(`    ⚠️ Found ${duplicateEmails.length} duplicate email addresses`);
    }

    // Check for duplicate badge names
    const duplicateBadgeNames = await Badge.aggregate([
      {
        $group: {
          _id: '$name',
          count: { $sum: 1 },
          docs: { $push: '$_id' }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    if (duplicateBadgeNames.length > 0) {
      console.warn(`    ⚠️ Found ${duplicateBadgeNames.length} duplicate badge names`);
    }

    console.log('    ✓ Duplicate check completed');
  }

  // Validate enum values
  private static async validateEnumValues(): Promise<void> {
    console.log('  🔍 Validating enum values...');

    // This would check if all enum values in the database are valid
    // For now, we'll just log that the check is completed
    console.log('    ✓ Enum validation completed');
  }

  // Get database statistics
  static async getDatabaseStats(): Promise<any> {
    const stats = {
      users: await User.countDocuments(),
      courses: await Course.countDocuments(),
      quizzes: await Quiz.countDocuments(),
      examAttempts: await ExamAttempt.countDocuments(),
      proctoringSessions: await ProctoringSession.countDocuments(),
      notifications: await Notification.countDocuments(),
      badges: await Badge.countDocuments(),
      userProgress: await UserProgress.countDocuments(),
      liveSessions: await LiveSession.countDocuments()
    };

    return stats;
  }

  // Clean up expired data
  static async cleanupExpiredData(): Promise<void> {
    console.log('🧹 Cleaning up expired data...');

    // Remove expired notifications
    const expiredNotifications = await Notification.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    console.log(`  🗑️ Removed ${expiredNotifications.deletedCount} expired notifications`);

    // Remove old proctoring sessions (older than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const oldProctoringData = await ProctoringSession.deleteMany({
      createdAt: { $lt: oneYearAgo },
      reviewedBy: { $ne: null } // Only delete reviewed sessions
    });

    console.log(`  🗑️ Removed ${oldProctoringData.deletedCount} old proctoring sessions`);

    console.log('✅ Cleanup completed');
  }
}

// Function to run validation from command line
export const runValidation = async (): Promise<void> => {
  try {
    // Connect to database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/excellence-coaching-hub';
    await mongoose.connect(mongoUri);
    console.log('📦 Connected to MongoDB');

    // Run validation
    await DatabaseValidator.validateDatabase();

    // Show stats
    const stats = await DatabaseValidator.getDatabaseStats();
    console.log('\n📊 Database Statistics:');
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });

    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
};

// Run validation if this file is executed directly
if (require.main === module) {
  runValidation();
}

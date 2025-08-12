import mongoose, { Schema, Document, Model } from 'mongoose';

// User progress document interface
export interface IUserProgressDocument extends Document {
  user: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  completedLessons: string[];
  completedQuizzes: mongoose.Types.ObjectId[];
  totalTimeSpent: number; // in minutes
  progressPercentage: number;
  lastAccessed: Date;
  badges: mongoose.Types.ObjectId[];
  totalPoints: number;
  streakDays: number;
  lastActivityDate: Date;
  enrollmentDate: Date;
  completionDate?: Date;
  isCompleted: boolean;
  certificateIssued: boolean;
  certificateUrl?: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  updateProgress(): Promise<IUserProgressDocument>;
  addCompletedLesson(lessonId: string): Promise<IUserProgressDocument>;
  addCompletedQuiz(quizId: string): Promise<IUserProgressDocument>;
  awardBadge(badgeId: string): Promise<IUserProgressDocument>;
  addPoints(points: number): Promise<IUserProgressDocument>;
  updateStreak(): Promise<IUserProgressDocument>;
  markAsCompleted(): Promise<IUserProgressDocument>;
}

// User progress model interface
export interface IUserProgressModel extends Model<IUserProgressDocument> {
  findByUser(userId: string): Promise<IUserProgressDocument[]>;
  findByCourse(courseId: string): Promise<IUserProgressDocument[]>;
  findByUserAndCourse(userId: string, courseId: string): Promise<IUserProgressDocument | null>;
  findCompleted(): Promise<IUserProgressDocument[]>;
  getLeaderboard(courseId?: string, limit?: number): Promise<IUserProgressDocument[]>;
  getUserStats(userId: string): Promise<any>;
}

// User progress schema
const userProgressSchema = new Schema<IUserProgressDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  completedLessons: [{
    type: String
  }],
  completedQuizzes: [{
    type: Schema.Types.ObjectId,
    ref: 'Quiz'
  }],
  totalTimeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: [0, 'Progress percentage cannot be negative'],
    max: [100, 'Progress percentage cannot exceed 100']
  },
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  badges: [{
    type: Schema.Types.ObjectId,
    ref: 'Badge'
  }],
  totalPoints: {
    type: Number,
    default: 0,
    min: [0, 'Total points cannot be negative']
  },
  streakDays: {
    type: Number,
    default: 0,
    min: [0, 'Streak days cannot be negative']
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    default: null
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userProgressSchema.index({ user: 1 });
userProgressSchema.index({ course: 1 });
userProgressSchema.index({ user: 1, course: 1 }, { unique: true });
userProgressSchema.index({ isCompleted: 1 });
userProgressSchema.index({ totalPoints: -1 });
userProgressSchema.index({ progressPercentage: -1 });
userProgressSchema.index({ lastAccessed: -1 });
userProgressSchema.index({ streakDays: -1 });

// Virtual for days since enrollment
userProgressSchema.virtual('daysSinceEnrollment').get(function(this: IUserProgressDocument) {
  return Math.floor((Date.now() - this.enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for completion time (if completed)
userProgressSchema.virtual('completionTimeInDays').get(function(this: IUserProgressDocument) {
  if (this.completionDate) {
    return Math.floor((this.completionDate.getTime() - this.enrollmentDate.getTime()) / (1000 * 60 * 60 * 24));
  }
  return null;
});

// Pre-save middleware to update progress percentage
userProgressSchema.pre<IUserProgressDocument>('save', async function(next) {
  if (this.isModified('completedLessons') || this.isModified('completedQuizzes')) {
    // This would need to calculate based on total course content
    // For now, we'll use a simple calculation
    const totalLessons = this.completedLessons.length;
    const totalQuizzes = this.completedQuizzes.length;
    
    // This is a placeholder calculation - should be based on actual course content
    this.progressPercentage = Math.min(((totalLessons + totalQuizzes) / 10) * 100, 100);
    
    if (this.progressPercentage >= 100 && !this.isCompleted) {
      this.isCompleted = true;
      this.completionDate = new Date();
    }
  }
  
  next();
});

// Instance method to update progress
userProgressSchema.methods.updateProgress = async function(): Promise<IUserProgressDocument> {
  this.lastAccessed = new Date();
  return this.save();
};

// Instance method to add completed lesson
userProgressSchema.methods.addCompletedLesson = async function(lessonId: string): Promise<IUserProgressDocument> {
  if (!this.completedLessons.includes(lessonId)) {
    this.completedLessons.push(lessonId);
    this.lastAccessed = new Date();
    this.lastActivityDate = new Date();
  }
  return this.save();
};

// Instance method to add completed quiz
userProgressSchema.methods.addCompletedQuiz = async function(quizId: string): Promise<IUserProgressDocument> {
  const quizObjectId = new mongoose.Types.ObjectId(quizId);
  if (!this.completedQuizzes.some(id => id.equals(quizObjectId))) {
    this.completedQuizzes.push(quizObjectId);
    this.lastAccessed = new Date();
    this.lastActivityDate = new Date();
  }
  return this.save();
};

// Instance method to award badge
userProgressSchema.methods.awardBadge = async function(badgeId: string): Promise<IUserProgressDocument> {
  const badgeObjectId = new mongoose.Types.ObjectId(badgeId);
  if (!this.badges.some(id => id.equals(badgeObjectId))) {
    this.badges.push(badgeObjectId);
  }
  return this.save();
};

// Instance method to add points
userProgressSchema.methods.addPoints = async function(points: number): Promise<IUserProgressDocument> {
  this.totalPoints += points;
  return this.save();
};

// Instance method to update streak
userProgressSchema.methods.updateStreak = async function(): Promise<IUserProgressDocument> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastActivity = new Date(this.lastActivityDate);
  
  // Check if last activity was yesterday (continue streak) or today (maintain streak)
  if (this.isSameDay(lastActivity, yesterday)) {
    this.streakDays += 1;
  } else if (!this.isSameDay(lastActivity, today)) {
    // Reset streak if more than a day has passed
    this.streakDays = 1;
  }
  
  this.lastActivityDate = today;
  return this.save();
};

// Helper method to check if two dates are the same day
userProgressSchema.methods.isSameDay = function(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Instance method to mark as completed
userProgressSchema.methods.markAsCompleted = async function(): Promise<IUserProgressDocument> {
  this.isCompleted = true;
  this.completionDate = new Date();
  this.progressPercentage = 100;
  return this.save();
};

// Static method to find progress by user
userProgressSchema.statics.findByUser = function(userId: string): Promise<IUserProgressDocument[]> {
  return this.find({ user: userId })
    .populate('course', 'title thumbnail')
    .populate('badges', 'name icon points')
    .sort({ lastAccessed: -1 });
};

// Static method to find progress by course
userProgressSchema.statics.findByCourse = function(courseId: string): Promise<IUserProgressDocument[]> {
  return this.find({ course: courseId })
    .populate('user', 'firstName lastName email')
    .sort({ progressPercentage: -1 });
};

// Static method to find progress by user and course
userProgressSchema.statics.findByUserAndCourse = function(
  userId: string, 
  courseId: string
): Promise<IUserProgressDocument | null> {
  return this.findOne({ user: userId, course: courseId })
    .populate('course', 'title')
    .populate('badges', 'name icon points');
};

// Static method to find completed courses
userProgressSchema.statics.findCompleted = function(): Promise<IUserProgressDocument[]> {
  return this.find({ isCompleted: true })
    .populate('user', 'firstName lastName')
    .populate('course', 'title')
    .sort({ completionDate: -1 });
};

// Static method to get leaderboard
userProgressSchema.statics.getLeaderboard = function(
  courseId?: string, 
  limit: number = 10
): Promise<IUserProgressDocument[]> {
  const query = courseId ? { course: courseId } : {};
  
  return this.find(query)
    .populate('user', 'firstName lastName avatar')
    .populate('course', 'title')
    .sort({ totalPoints: -1, progressPercentage: -1 })
    .limit(limit);
};

// Static method to get user stats
userProgressSchema.statics.getUserStats = async function(userId: string): Promise<any> {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalCourses: { $sum: 1 },
        completedCourses: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        totalPoints: { $sum: '$totalPoints' },
        totalTimeSpent: { $sum: '$totalTimeSpent' },
        averageProgress: { $avg: '$progressPercentage' },
        maxStreak: { $max: '$streakDays' }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    totalCourses: 0,
    completedCourses: 0,
    totalPoints: 0,
    totalTimeSpent: 0,
    averageProgress: 0,
    maxStreak: 0
  };
};

// Create and export the model
export const UserProgress = mongoose.model<IUserProgressDocument, IUserProgressModel>('UserProgress', userProgressSchema);

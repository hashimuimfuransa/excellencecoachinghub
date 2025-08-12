import mongoose, { Schema, Document, Model } from 'mongoose';

// Reading progress document interface
export interface IReadingProgressDocument extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  courseNotes: mongoose.Types.ObjectId;
  isCompleted: boolean;
  completedAt?: Date;
  timeSpent: number; // in minutes
  currentSection?: string; // section ID where student left off
  sectionsCompleted: string[]; // array of completed section IDs
  bookmarks: {
    sectionId: string;
    note?: string;
    createdAt: Date;
  }[];
  quizGenerated: boolean; // whether AI quiz was generated for this chapter
  quizScore?: number; // score on the AI-generated quiz
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  markSectionComplete(sectionId: string): Promise<IReadingProgressDocument>;
  addBookmark(sectionId: string, note?: string): Promise<IReadingProgressDocument>;
  removeBookmark(sectionId: string): Promise<IReadingProgressDocument>;
  getCompletionPercentage(): number;
}

// Reading progress model interface
export interface IReadingProgressModel extends Model<IReadingProgressDocument> {
  findByStudent(studentId: string): Promise<IReadingProgressDocument[]>;
  findByCourse(courseId: string): Promise<IReadingProgressDocument[]>;
  getStudentProgress(studentId: string, courseId: string): Promise<IReadingProgressDocument[]>;
  getCourseStatistics(courseId: string): Promise<any>;
}

// Reading progress schema
const readingProgressSchema = new Schema<IReadingProgressDocument>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  courseNotes: {
    type: Schema.Types.ObjectId,
    ref: 'CourseNotes',
    required: [true, 'Course notes is required']
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  timeSpent: {
    type: Number,
    default: 0,
    min: [0, 'Time spent cannot be negative']
  },
  currentSection: {
    type: String
  },
  sectionsCompleted: [{
    type: String
  }],
  bookmarks: [{
    sectionId: {
      type: String,
      required: true
    },
    note: {
      type: String,
      trim: true,
      maxlength: [500, 'Bookmark note cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  quizGenerated: {
    type: Boolean,
    default: false
  },
  quizScore: {
    type: Number,
    min: [0, 'Quiz score cannot be negative'],
    max: [100, 'Quiz score cannot exceed 100']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
readingProgressSchema.index({ student: 1, course: 1 });
readingProgressSchema.index({ student: 1, courseNotes: 1 }, { unique: true });
readingProgressSchema.index({ course: 1 });
readingProgressSchema.index({ isCompleted: 1 });

// Instance method to mark section as complete
readingProgressSchema.methods.markSectionComplete = async function(sectionId: string): Promise<IReadingProgressDocument> {
  if (!this.sectionsCompleted.includes(sectionId)) {
    this.sectionsCompleted.push(sectionId);
  }
  this.currentSection = sectionId;
  
  // Check if all sections are completed
  const courseNotes = await mongoose.model('CourseNotes').findById(this.courseNotes);
  if (courseNotes) {
    const totalSections = courseNotes.sections.filter((s: any) => s.isRequired).length;
    const completedRequiredSections = this.sectionsCompleted.filter(sectionId => {
      const section = courseNotes.sections.find((s: any) => s.id === sectionId);
      return section && section.isRequired;
    }).length;
    
    if (completedRequiredSections >= totalSections) {
      this.isCompleted = true;
      this.completedAt = new Date();
    }
  }
  
  return this.save();
};

// Instance method to add bookmark
readingProgressSchema.methods.addBookmark = async function(sectionId: string, note?: string): Promise<IReadingProgressDocument> {
  // Remove existing bookmark for this section
  this.bookmarks = this.bookmarks.filter(b => b.sectionId !== sectionId);
  
  // Add new bookmark
  this.bookmarks.push({
    sectionId,
    note,
    createdAt: new Date()
  });
  
  return this.save();
};

// Instance method to remove bookmark
readingProgressSchema.methods.removeBookmark = async function(sectionId: string): Promise<IReadingProgressDocument> {
  this.bookmarks = this.bookmarks.filter(b => b.sectionId !== sectionId);
  return this.save();
};

// Instance method to get completion percentage
readingProgressSchema.methods.getCompletionPercentage = function(): number {
  if (this.isCompleted) return 100;
  
  // This would need to be calculated based on the course notes sections
  // For now, return a simple calculation
  return Math.min(Math.round((this.sectionsCompleted.length / 10) * 100), 100);
};

// Static method to find progress by student
readingProgressSchema.statics.findByStudent = function(studentId: string): Promise<IReadingProgressDocument[]> {
  return this.find({ student: studentId })
    .populate('course', 'title')
    .populate('courseNotes', 'title chapter')
    .sort({ updatedAt: -1 });
};

// Static method to find progress by course
readingProgressSchema.statics.findByCourse = function(courseId: string): Promise<IReadingProgressDocument[]> {
  return this.find({ course: courseId })
    .populate('student', 'firstName lastName')
    .populate('courseNotes', 'title chapter')
    .sort({ updatedAt: -1 });
};

// Static method to get student progress for a specific course
readingProgressSchema.statics.getStudentProgress = function(studentId: string, courseId: string): Promise<IReadingProgressDocument[]> {
  return this.find({ 
    student: studentId, 
    course: courseId 
  })
  .populate('courseNotes', 'title chapter totalEstimatedTime')
  .sort({ 'courseNotes.chapter': 1 });
};

// Static method to get course statistics
readingProgressSchema.statics.getCourseStatistics = async function(courseId: string): Promise<any> {
  const stats = await this.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        completedStudents: {
          $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
        },
        averageTimeSpent: { $avg: '$timeSpent' },
        totalTimeSpent: { $sum: '$timeSpent' }
      }
    }
  ]);

  const result = stats[0] || {
    totalStudents: 0,
    completedStudents: 0,
    averageTimeSpent: 0,
    totalTimeSpent: 0
  };

  result.completionRate = result.totalStudents > 0 
    ? Math.round((result.completedStudents / result.totalStudents) * 100) 
    : 0;

  return result;
};

export const ReadingProgress = mongoose.model<IReadingProgressDocument, IReadingProgressModel>('ReadingProgress', readingProgressSchema);

import mongoose, { Schema, Document, Model } from 'mongoose';

// Note section interface
export interface INoteSection {
  id: string;
  title: string;
  content: string;
  order: number;
  type: 'text' | 'image' | 'video' | 'audio' | 'file';
  fileUrl?: string;
  duration?: number; // for video/audio in seconds
  isRequired: boolean;
  estimatedReadTime?: number; // in minutes
  hasAudioNarration?: boolean; // Whether this section has text-to-speech
  audioLanguage?: string; // Language for text-to-speech (e.g., 'en-US', 'fr-FR')
  audioSpeed?: number; // Speed multiplier for audio (0.5 to 2.0)
}

// Course notes document interface
export interface ICourseNotesDocument extends Document {
  title: string;
  description?: string;
  course: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  chapter: number;
  sections: INoteSection[];
  totalEstimatedTime: number; // in minutes
  timerEnabled: boolean; // Whether to show timer for this notes
  recommendedStudyTime: number; // Recommended time to spend on this notes (in minutes)
  breakInterval?: number; // Suggested break interval in minutes (e.g., 25 for Pomodoro)
  prerequisites?: string[]; // IDs of previous notes that should be read first
  learningObjectives?: string[];
  tags?: string[];
  isPublished: boolean;
  publishedAt?: Date;
  version: number;
  attachments?: string[]; // file URLs
  audioSettings: {
    defaultLanguage: string; // Default language for text-to-speech
    defaultSpeed: number; // Default speed for audio playback
    enableAutoPlay: boolean; // Whether to auto-play audio when section loads
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateTotalTime(): number;
  getNextChapter(): Promise<ICourseNotesDocument | null>;
  getPreviousChapter(): Promise<ICourseNotesDocument | null>;
  markAsRead(studentId: string): Promise<void>;
  isReadBy(studentId: string): Promise<boolean>;
}

// Course notes model interface
export interface ICourseNotesModel extends Model<ICourseNotesDocument> {
  findByCourse(courseId: string): Promise<ICourseNotesDocument[]>;
  findByInstructor(instructorId: string): Promise<ICourseNotesDocument[]>;
  findPublished(): Promise<ICourseNotesDocument[]>;
  getProgressiveOrder(courseId: string): Promise<ICourseNotesDocument[]>;
}

// Note section schema
const noteSectionSchema = new Schema({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Section title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true,
    min: [1, 'Order must be at least 1']
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file'],
    default: 'text'
  },
  fileUrl: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    min: [0, 'Duration cannot be negative']
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  estimatedReadTime: {
    type: Number,
    min: [0, 'Estimated read time cannot be negative']
  },
  hasAudioNarration: {
    type: Boolean,
    default: false
  },
  audioLanguage: {
    type: String,
    default: 'en-US'
  },
  audioSpeed: {
    type: Number,
    default: 1.0,
    min: [0.5, 'Audio speed cannot be less than 0.5'],
    max: [2.0, 'Audio speed cannot be more than 2.0']
  }
}, { _id: false });

// Course notes schema
const courseNotesSchema = new Schema<ICourseNotesDocument>({
  title: {
    type: String,
    required: [true, 'Notes title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  chapter: {
    type: Number,
    required: [true, 'Chapter number is required'],
    min: [1, 'Chapter number must be at least 1']
  },
  sections: [noteSectionSchema],
  totalEstimatedTime: {
    type: Number,
    default: 0,
    min: [0, 'Total estimated time cannot be negative']
  },
  prerequisites: [{
    type: Schema.Types.ObjectId,
    ref: 'CourseNotes'
  }],
  learningObjectives: [{
    type: String,
    trim: true
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  attachments: [{
    type: String,
    trim: true
  }],
  timerEnabled: {
    type: Boolean,
    default: true
  },
  recommendedStudyTime: {
    type: Number,
    default: 30, // 30 minutes default
    min: [5, 'Recommended study time must be at least 5 minutes']
  },
  breakInterval: {
    type: Number,
    default: 25, // Pomodoro technique default
    min: [5, 'Break interval must be at least 5 minutes']
  },
  audioSettings: {
    defaultLanguage: {
      type: String,
      default: 'en-US'
    },
    defaultSpeed: {
      type: Number,
      default: 1.0,
      min: [0.5, 'Default speed cannot be less than 0.5'],
      max: [2.0, 'Default speed cannot be more than 2.0']
    },
    enableAutoPlay: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
courseNotesSchema.index({ course: 1, chapter: 1 }, { unique: true });
courseNotesSchema.index({ instructor: 1 });
courseNotesSchema.index({ isPublished: 1 });
courseNotesSchema.index({ course: 1, isPublished: 1 });
courseNotesSchema.index({ tags: 1 });

// Instance method to calculate total estimated time
courseNotesSchema.methods.calculateTotalTime = function(): number {
  return this.sections.reduce((total: number, section: INoteSection) => {
    return total + (section.estimatedReadTime || 0);
  }, 0);
};

// Instance method to get next chapter
courseNotesSchema.methods.getNextChapter = async function(): Promise<ICourseNotesDocument | null> {
  return await mongoose.model('CourseNotes').findOne({
    course: this.course,
    chapter: this.chapter + 1,
    isPublished: true
  });
};

// Instance method to get previous chapter
courseNotesSchema.methods.getPreviousChapter = async function(): Promise<ICourseNotesDocument | null> {
  return await mongoose.model('CourseNotes').findOne({
    course: this.course,
    chapter: this.chapter - 1,
    isPublished: true
  });
};

// Instance method to mark as read by student
courseNotesSchema.methods.markAsRead = async function(studentId: string): Promise<void> {
  const ReadingProgress = require('./ReadingProgress').ReadingProgress;
  
  await ReadingProgress.findOneAndUpdate(
    {
      student: studentId,
      courseNotes: this._id
    },
    {
      student: studentId,
      courseNotes: this._id,
      course: this.course,
      isCompleted: true,
      completedAt: new Date(),
      timeSpent: this.totalEstimatedTime
    },
    { upsert: true }
  );
};

// Instance method to check if read by student
courseNotesSchema.methods.isReadBy = async function(studentId: string): Promise<boolean> {
  const ReadingProgress = require('./ReadingProgress').ReadingProgress;
  
  const progress = await ReadingProgress.findOne({
    student: studentId,
    courseNotes: this._id,
    isCompleted: true
  });
  
  return !!progress;
};

// Pre-save middleware to calculate total time and set published date
courseNotesSchema.pre('save', function(next) {
  this.totalEstimatedTime = this.calculateTotalTime();
  
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Static method to find notes by course
courseNotesSchema.statics.findByCourse = function(courseId: string): Promise<ICourseNotesDocument[]> {
  return this.find({ course: courseId })
    .populate('instructor', 'firstName lastName')
    .sort({ chapter: 1 });
};

// Static method to find notes by instructor
courseNotesSchema.statics.findByInstructor = function(instructorId: string): Promise<ICourseNotesDocument[]> {
  return this.find({ instructor: instructorId })
    .populate('course', 'title')
    .sort({ createdAt: -1 });
};

// Static method to find published notes
courseNotesSchema.statics.findPublished = function(): Promise<ICourseNotesDocument[]> {
  return this.find({ isPublished: true })
    .populate('course', 'title')
    .populate('instructor', 'firstName lastName')
    .sort({ course: 1, chapter: 1 });
};

// Static method to get notes in progressive order for a course
courseNotesSchema.statics.getProgressiveOrder = function(courseId: string): Promise<ICourseNotesDocument[]> {
  return this.find({ 
    course: courseId, 
    isPublished: true 
  })
  .populate('prerequisites')
  .sort({ chapter: 1 });
};

export const CourseNotes = mongoose.model<ICourseNotesDocument, ICourseNotesModel>('CourseNotes', courseNotesSchema);

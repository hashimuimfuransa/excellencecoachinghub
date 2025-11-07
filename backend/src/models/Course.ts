import mongoose, { Schema, Document, Model } from 'mongoose';
import { CourseStatus } from '../types';

// Course chapter interface
export interface ICourseChapter {
  _id?: string;
  title: string;
  description?: string;
  order: number;
  estimatedTimeMinutes: number;
  lessons: ICourseContent[];
  isRequired: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Course content interface for lessons, videos, etc.
export interface ICourseContent {
  _id?: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'live_session' | 'reading' | 'exercise';
  content?: string; // For text content
  fileUrl?: string; // For uploaded files
  videoUrl?: string; // For video content
  duration?: number; // In minutes
  order: number;
  isRequired: boolean;
  liveSessionId?: mongoose.Types.ObjectId; // Reference to live session for recorded sessions
  chapterId?: mongoose.Types.ObjectId; // Reference to parent chapter
  createdAt?: Date;
  updatedAt?: Date;
}

// Course document interface
export interface ICourseDocument extends Document {
  title: string;
  description: string;
  instructor: mongoose.Types.ObjectId;
  status: CourseStatus;
  thumbnail?: string;
  category: string;
  tags: string[];
  duration: number; // in hours
  level: 'beginner' | 'intermediate' | 'advanced';
  price: number; // Legacy field - will be deprecated
  notesPrice: number; // Price for accessing notes/materials
  liveSessionPrice: number; // Price for accessing live sessions
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  content: ICourseContent[];
  chapters: ICourseChapter[];
  prerequisites: string[];
  learningOutcomes: string[];
  targetAudience: string[];
  courseObjectives: string[];
  assessmentMethods: string[];
  resources: string[];
  totalEstimatedTime: number; // Total course time in hours
  weeklyTimeCommitment: number; // Hours per week
  courseFormat: 'self_paced' | 'instructor_led' | 'hybrid';
  language: string;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  certificationOffered: boolean;
  certificateRequirements: string[];
  // New fields for better discoverability
  careerGoal: string; // Target career goal for the course
  experienceLevel: string; // Target experience level
  timeCommitment: string; // Expected time commitment
  learningStyle: string; // Primary learning style
  specificInterests: string[]; // Specific topics and skills covered
  learningCategories: string[]; // Learning categories for better discoverability
  learningSubcategories?: string[]; // Specific subcategories within learning categories
  nurseryLevel?: string; // Nursery level (Nursery 1, 2, or 3) for nursery coaching courses
  isPublished: boolean;
  publishedAt?: Date;
  enrollmentDeadline?: Date; // When enrollment closes
  courseStartDate?: Date; // When the course actually starts
  courseEndDate?: Date; // When the course ends
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  updateRating(newRating: number): Promise<ICourseDocument>;
  addContent(content: ICourseContent): Promise<ICourseDocument>;
  removeContent(contentId: string): Promise<ICourseDocument>;
  incrementEnrollment(): Promise<ICourseDocument>;
  decrementEnrollment(): Promise<ICourseDocument>;
}

// Course model interface
export interface ICourseModel extends Model<ICourseDocument> {
  findByInstructor(instructorId: string): Promise<ICourseDocument[]>;
  findByCategory(category: string): Promise<ICourseDocument[]>;
  findByStatus(status: CourseStatus): Promise<ICourseDocument[]>;
  findPublished(): Promise<ICourseDocument[]>;
  findPopular(limit?: number): Promise<ICourseDocument[]>;
  searchCourses(query: string): Promise<ICourseDocument[]>;
}

// Course chapter schema
const courseChapterSchema = new Schema<ICourseChapter>({
  title: {
    type: String,
    required: [true, 'Chapter title is required'],
    trim: true,
    maxlength: [200, 'Chapter title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Chapter description cannot exceed 1000 characters']
  },
  order: {
    type: Number,
    required: [true, 'Chapter order is required'],
    min: [0, 'Order cannot be negative']
  },
  estimatedTimeMinutes: {
    type: Number,
    required: [true, 'Estimated time is required'],
    min: [0, 'Estimated time cannot be negative']
  },
  lessons: [{
    type: Schema.Types.ObjectId,
    ref: 'CourseContent'
  }],
  isRequired: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Course content schema
const courseContentSchema = new Schema<ICourseContent>({
  title: {
    type: String,
    required: [true, 'Content title is required'],
    trim: true,
    maxlength: [200, 'Content title cannot exceed 200 characters']
  },
  type: {
    type: String,
    enum: ['video', 'document', 'quiz', 'assignment', 'live_session', 'reading', 'exercise'],
    required: [true, 'Content type is required']
  },
  content: {
    type: String,
    default: null
  },
  fileUrl: {
    type: String,
    default: null
  },
  videoUrl: {
    type: String,
    default: null
  },
  duration: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  order: {
    type: Number,
    required: [true, 'Content order is required'],
    min: [0, 'Order cannot be negative']
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  liveSessionId: {
    type: Schema.Types.ObjectId,
    ref: 'LiveSession',
    default: null
  },
  chapterId: {
    type: Schema.Types.ObjectId,
    ref: 'CourseChapter',
    default: null
  }
}, {
  timestamps: true
});

// Course schema
const courseSchema = new Schema<ICourseDocument>({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    maxlength: [200, 'Course title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    maxlength: [2000, 'Course description cannot exceed 2000 characters']
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Course instructor is required']
  },
  status: {
    type: String,
    enum: CourseStatus ? Object.values(CourseStatus) : ['draft', 'pending_approval', 'approved', 'rejected', 'archived'],
    default: CourseStatus.DRAFT
  },
  thumbnail: {
    type: String,
    default: null
  },
  category: {
    type: String,
    required: [true, 'Course category is required'],
    trim: true,
    maxlength: [100, 'Category cannot exceed 100 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  duration: {
    type: Number,
    required: [true, 'Course duration is required'],
    min: [0, 'Duration cannot be negative']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Course level is required']
  },
  price: {
    type: Number,
    default: 0, // Legacy field - will be deprecated
    min: [0, 'Price cannot be negative']
  },
  notesPrice: {
    type: Number,
    default: 0,
    min: [0, 'Notes price cannot be negative']
  },
  liveSessionPrice: {
    type: Number,
    default: 0,
    min: [0, 'Live session price cannot be negative']
  },
  enrollmentCount: {
    type: Number,
    default: 0,
    min: [0, 'Enrollment count cannot be negative']
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: [0, 'Rating count cannot be negative']
  },
  content: [courseContentSchema],
  chapters: [courseChapterSchema],
  prerequisites: [{
    type: String,
    trim: true,
    maxlength: [200, 'Prerequisite cannot exceed 200 characters']
  }],
  learningOutcomes: [{
    type: String,
    trim: true,
    maxlength: [200, 'Learning outcome cannot exceed 200 characters']
  }],
  targetAudience: [{
    type: String,
    trim: true,
    maxlength: [200, 'Target audience cannot exceed 200 characters']
  }],
  courseObjectives: [{
    type: String,
    trim: true,
    maxlength: [200, 'Course objective cannot exceed 200 characters']
  }],
  assessmentMethods: [{
    type: String,
    trim: true,
    maxlength: [200, 'Assessment method cannot exceed 200 characters']
  }],
  resources: [{
    type: String,
    trim: true,
    maxlength: [500, 'Resource cannot exceed 500 characters']
  }],
  totalEstimatedTime: {
    type: Number,
    default: 0,
    min: [0, 'Total estimated time cannot be negative']
  },
  weeklyTimeCommitment: {
    type: Number,
    default: 0,
    min: [0, 'Weekly time commitment cannot be negative']
  },
  courseFormat: {
    type: String,
    enum: ['self_paced', 'instructor_led', 'hybrid'],
    default: 'self_paced'
  },
  language: {
    type: String,
    default: 'English',
    trim: true,
    maxlength: [50, 'Language cannot exceed 50 characters']
  },
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    default: 'beginner'
  },
  certificationOffered: {
    type: Boolean,
    default: false
  },
  certificateRequirements: [{
    type: String,
    trim: true,
    maxlength: [200, 'Certificate requirement cannot exceed 200 characters']
  }],
  // New fields for better discoverability
  careerGoal: {
    type: String,
    enum: ['employment', 'business_owner', 'student', 'career_change', 'skill_upgrade', 'exploring'],
    default: 'exploring'
  },
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  timeCommitment: {
    type: String,
    enum: ['light', 'moderate', 'intensive', 'full_time'],
    default: 'moderate'
  },
  learningStyle: {
    type: String,
    enum: ['visual', 'hands_on', 'theoretical', 'interactive'],
    default: 'hands_on'
  },
  specificInterests: [{
    type: String,
    trim: true,
    maxlength: [100, 'Specific interest cannot exceed 100 characters']
  }],
  learningCategories: [{
    type: String,
    enum: [
      'professional_coaching',
      'business_entrepreneurship_coaching',
      'academic_coaching',
      'nursery_coaching',
      'language_coaching',
      'technical_digital_coaching',
      'job_seeker_coaching',
      'personal_corporate_development_coaching'
    ],
    trim: true
  }],
  learningSubcategories: [{
    type: String,
    trim: true,
    maxlength: [100, 'Subcategory cannot exceed 100 characters']
  }],
  nurseryLevel: {
    type: String,
    enum: ['Nursery 1', 'Nursery 2', 'Nursery 3', ''],
    default: '',
    trim: true
  },
  courseEndDate: {
    type: Date,
    default: null
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    default: null
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null,
    maxlength: [500, 'Rejection reason cannot exceed 500 characters']
  },
  enrollmentDeadline: {
    type: Date,
    default: null
  },
  courseStartDate: {
    type: Date,
    default: null
  },
  maxEnrollments: {
    type: Number,
    default: null,
    min: [1, 'Max enrollments must be at least 1']
  },
  adminFeedback: {
    type: String,
    default: null,
    maxlength: [1000, 'Admin feedback cannot exceed 1000 characters']
  },
  rejectedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rejectedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
courseSchema.index({ instructor: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ rating: -1 });
courseSchema.index({ enrollmentCount: -1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ publishedAt: -1 });
courseSchema.index({ tags: 1 });
courseSchema.index({ learningCategories: 1 });
courseSchema.index({ title: 'text', description: 'text' }); // Text search index

// Virtual for average rating calculation
courseSchema.virtual('averageRating').get(function(this: ICourseDocument) {
  return this.ratingCount > 0 ? this.rating / this.ratingCount : 0;
});

// Instance method to update rating
courseSchema.methods.updateRating = async function(newRating: number): Promise<ICourseDocument> {
  this.rating = ((this.rating * this.ratingCount) + newRating) / (this.ratingCount + 1);
  this.ratingCount += 1;
  return this.save();
};

// Instance method to add content
courseSchema.methods.addContent = async function(content: ICourseContent): Promise<ICourseDocument> {
  this.content.push(content);
  return this.save();
};

// Instance method to remove content
courseSchema.methods.removeContent = async function(contentId: string): Promise<ICourseDocument> {
  this.content = this.content.filter(item => item._id?.toString() !== contentId);
  return this.save();
};

// Instance method to increment enrollment
courseSchema.methods.incrementEnrollment = async function(): Promise<ICourseDocument> {
  this.enrollmentCount += 1;
  return this.save();
};

// Instance method to decrement enrollment
courseSchema.methods.decrementEnrollment = async function(): Promise<ICourseDocument> {
  if (this.enrollmentCount > 0) {
    this.enrollmentCount -= 1;
  }
  return this.save();
};

// Static method to find courses by instructor
courseSchema.statics.findByInstructor = function(instructorId: string): Promise<ICourseDocument[]> {
  return this.find({ instructor: instructorId }).populate('instructor', 'firstName lastName email');
};

// Static method to find courses by category
courseSchema.statics.findByCategory = function(category: string): Promise<ICourseDocument[]> {
  return this.find({ category, status: CourseStatus.APPROVED, isPublished: true })
    .populate('instructor', 'firstName lastName');
};

// Static method to find courses by status
courseSchema.statics.findByStatus = function(status: CourseStatus): Promise<ICourseDocument[]> {
  return this.find({ status }).populate('instructor', 'firstName lastName email');
};

// Static method to find published courses
courseSchema.statics.findPublished = function(): Promise<ICourseDocument[]> {
  return this.find({ status: CourseStatus.APPROVED, isPublished: true })
    .populate('instructor', 'firstName lastName');
};

// Static method to find popular courses
courseSchema.statics.findPopular = function(limit: number = 10): Promise<ICourseDocument[]> {
  return this.find({ status: CourseStatus.APPROVED, isPublished: true })
    .sort({ enrollmentCount: -1, rating: -1 })
    .limit(limit)
    .populate('instructor', 'firstName lastName');
};

// Static method to search courses
courseSchema.statics.searchCourses = function(query: string): Promise<ICourseDocument[]> {
  return this.find({
    $text: { $search: query },
    status: CourseStatus.APPROVED,
    isPublished: true
  }).populate('instructor', 'firstName lastName');
};

// Pre-save middleware to set published date
courseSchema.pre<ICourseDocument>('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Create and export the model
export const Course = mongoose.model<ICourseDocument, ICourseModel>('Course', courseSchema);

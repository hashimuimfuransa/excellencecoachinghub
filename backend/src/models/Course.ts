import mongoose, { Schema, Document, Model } from 'mongoose';
import { CourseStatus } from '../../../shared/types';

// Course content interface for lessons, videos, etc.
export interface ICourseContent {
  _id?: string;
  title: string;
  type: 'video' | 'document' | 'quiz' | 'assignment' | 'live_session';
  content?: string; // For text content
  fileUrl?: string; // For uploaded files
  videoUrl?: string; // For video content
  duration?: number; // In minutes
  order: number;
  isRequired: boolean;
  liveSessionId?: mongoose.Types.ObjectId; // Reference to live session for recorded sessions
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
  price: number;
  enrollmentCount: number;
  rating: number;
  ratingCount: number;
  content: ICourseContent[];
  prerequisites: string[];
  learningOutcomes: string[];
  isPublished: boolean;
  publishedAt?: Date;
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
    enum: ['video', 'document', 'quiz', 'assignment', 'live_session'],
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
    enum: Object.values(CourseStatus),
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
    required: [true, 'Course price is required'],
    min: [0, 'Price cannot be negative']
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

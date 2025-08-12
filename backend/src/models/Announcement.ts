import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAnnouncementDocument extends Document {
  title: string;
  content: string;
  course: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  type: 'general' | 'assignment' | 'exam' | 'schedule' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isPinned: boolean;
  isPublished: boolean;
  scheduledDate?: Date;
  expiryDate?: Date;
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedAt: Date;
  }>;
  readBy: Array<{
    student: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  isExpired(): boolean;
  isScheduled(): boolean;
  markAsReadBy(studentId: string): Promise<IAnnouncementDocument>;
  markAsUnreadBy(studentId: string): Promise<IAnnouncementDocument>;
  isReadBy(studentId: string): boolean;
}

export interface IAnnouncementModel extends Model<IAnnouncementDocument> {
  findByCourse(courseId: string): Promise<IAnnouncementDocument[]>;
  findByInstructor(instructorId: string): Promise<IAnnouncementDocument[]>;
  findByType(courseId: string, type: string): Promise<IAnnouncementDocument[]>;
  findByPriority(courseId: string, priority: string): Promise<IAnnouncementDocument[]>;
  findPinned(courseId: string): Promise<IAnnouncementDocument[]>;
  findPublished(courseId: string): Promise<IAnnouncementDocument[]>;
  findUnreadByStudent(courseId: string, studentId: string): Promise<IAnnouncementDocument[]>;
  searchAnnouncements(courseId: string, query: string): Promise<IAnnouncementDocument[]>;
}

const announcementSchema = new Schema<IAnnouncementDocument>({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required'],
    trim: true,
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required'],
    index: true
  },
  instructor: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required'],
    index: true
  },
  type: {
    type: String,
    enum: ['general', 'assignment', 'exam', 'schedule', 'urgent'],
    default: 'general',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  isPinned: {
    type: Boolean,
    default: false,
    index: true
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  scheduledDate: {
    type: Date,
    default: null
  },
  expiryDate: {
    type: Date,
    default: null
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true,
      min: 0
    },
    mimeType: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  readBy: [{
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
announcementSchema.index({ course: 1, createdAt: -1 });
announcementSchema.index({ course: 1, type: 1 });
announcementSchema.index({ course: 1, priority: 1 });
announcementSchema.index({ course: 1, isPinned: 1 });
announcementSchema.index({ instructor: 1, createdAt: -1 });
announcementSchema.index({ scheduledDate: 1 });
announcementSchema.index({ expiryDate: 1 });
announcementSchema.index({ title: 'text', content: 'text' }); // Text search index

// Virtual for read count
announcementSchema.virtual('readCount').get(function(this: IAnnouncementDocument) {
  return this.readBy.length;
});

// Instance method to check if announcement is expired
announcementSchema.methods.isExpired = function(): boolean {
  if (!this.expiryDate) return false;
  return new Date() > this.expiryDate;
};

// Instance method to check if announcement is scheduled
announcementSchema.methods.isScheduled = function(): boolean {
  if (!this.scheduledDate) return false;
  return new Date() < this.scheduledDate;
};

// Instance method to mark as read by student
announcementSchema.methods.markAsReadBy = async function(studentId: string): Promise<IAnnouncementDocument> {
  const existingRead = this.readBy.find(read => read.student.toString() === studentId);
  
  if (!existingRead) {
    this.readBy.push({
      student: new mongoose.Types.ObjectId(studentId),
      readAt: new Date()
    });
    await this.save();
  }
  
  return this;
};

// Instance method to mark as unread by student
announcementSchema.methods.markAsUnreadBy = async function(studentId: string): Promise<IAnnouncementDocument> {
  this.readBy = this.readBy.filter(read => read.student.toString() !== studentId);
  await this.save();
  return this;
};

// Instance method to check if read by student
announcementSchema.methods.isReadBy = function(studentId: string): boolean {
  return this.readBy.some(read => read.student.toString() === studentId);
};

// Static method to find announcements by course
announcementSchema.statics.findByCourse = function(courseId: string): Promise<IAnnouncementDocument[]> {
  return this.find({ 
    course: courseId, 
    isPublished: true,
    $or: [
      { scheduledDate: { $lte: new Date() } },
      { scheduledDate: null }
    ]
  })
  .populate('instructor', 'firstName lastName avatar')
  .sort({ isPinned: -1, createdAt: -1 });
};

// Static method to find announcements by instructor
announcementSchema.statics.findByInstructor = function(instructorId: string): Promise<IAnnouncementDocument[]> {
  return this.find({ instructor: instructorId })
    .populate('course', 'title')
    .sort({ createdAt: -1 });
};

// Static method to find announcements by type
announcementSchema.statics.findByType = function(courseId: string, type: string): Promise<IAnnouncementDocument[]> {
  return this.find({ 
    course: courseId, 
    type, 
    isPublished: true,
    $or: [
      { scheduledDate: { $lte: new Date() } },
      { scheduledDate: null }
    ]
  })
  .populate('instructor', 'firstName lastName avatar')
  .sort({ isPinned: -1, createdAt: -1 });
};

// Static method to find announcements by priority
announcementSchema.statics.findByPriority = function(courseId: string, priority: string): Promise<IAnnouncementDocument[]> {
  return this.find({ 
    course: courseId, 
    priority, 
    isPublished: true,
    $or: [
      { scheduledDate: { $lte: new Date() } },
      { scheduledDate: null }
    ]
  })
  .populate('instructor', 'firstName lastName avatar')
  .sort({ isPinned: -1, createdAt: -1 });
};

// Static method to find pinned announcements
announcementSchema.statics.findPinned = function(courseId: string): Promise<IAnnouncementDocument[]> {
  return this.find({ 
    course: courseId, 
    isPinned: true, 
    isPublished: true,
    $or: [
      { scheduledDate: { $lte: new Date() } },
      { scheduledDate: null }
    ]
  })
  .populate('instructor', 'firstName lastName avatar')
  .sort({ createdAt: -1 });
};

// Static method to find published announcements
announcementSchema.statics.findPublished = function(courseId: string): Promise<IAnnouncementDocument[]> {
  return this.find({ 
    course: courseId, 
    isPublished: true,
    $or: [
      { scheduledDate: { $lte: new Date() } },
      { scheduledDate: null }
    ]
  })
  .populate('instructor', 'firstName lastName avatar')
  .sort({ isPinned: -1, createdAt: -1 });
};

// Static method to find unread announcements by student
announcementSchema.statics.findUnreadByStudent = function(courseId: string, studentId: string): Promise<IAnnouncementDocument[]> {
  return this.find({ 
    course: courseId, 
    isPublished: true,
    'readBy.student': { $ne: studentId },
    $or: [
      { scheduledDate: { $lte: new Date() } },
      { scheduledDate: null }
    ]
  })
  .populate('instructor', 'firstName lastName avatar')
  .sort({ isPinned: -1, createdAt: -1 });
};

// Static method to search announcements
announcementSchema.statics.searchAnnouncements = function(courseId: string, query: string): Promise<IAnnouncementDocument[]> {
  return this.find({
    course: courseId,
    isPublished: true,
    $text: { $search: query },
    $or: [
      { scheduledDate: { $lte: new Date() } },
      { scheduledDate: null }
    ]
  })
  .populate('instructor', 'firstName lastName avatar')
  .sort({ score: { $meta: 'textScore' }, isPinned: -1, createdAt: -1 });
};

// Pre-save middleware to validate scheduled date
announcementSchema.pre<IAnnouncementDocument>('save', function(next) {
  if (this.scheduledDate && this.scheduledDate < new Date()) {
    // If scheduled date is in the past, make it immediately available
    this.scheduledDate = undefined;
  }
  
  if (this.expiryDate && this.expiryDate <= new Date()) {
    // If expiry date is in the past or now, unpublish the announcement
    this.isPublished = false;
  }
  
  next();
});

// Pre-save middleware to handle priority-based pinning
announcementSchema.pre<IAnnouncementDocument>('save', function(next) {
  if (this.priority === 'urgent' && !this.isPinned) {
    this.isPinned = true;
  }
  next();
});

export const Announcement = mongoose.model<IAnnouncementDocument, IAnnouncementModel>('Announcement', announcementSchema);
export default Announcement;
import mongoose, { Document, Schema } from 'mongoose';

export interface IAssignment extends Document {
  title: string;
  description: string;
  instructions: string;
  course: mongoose.Types.ObjectId;
  instructor: mongoose.Types.ObjectId;
  dueDate: Date;
  maxPoints: number;
  submissionType: 'file' | 'text' | 'both';
  allowedFileTypes: string[];
  maxFileSize: number; // in MB
  isRequired: boolean;
  status: 'draft' | 'published' | 'closed';
  assignmentDocument?: {
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IAssignmentSubmission extends Document {
  assignment: mongoose.Types.ObjectId;
  student: mongoose.Types.ObjectId;
  submissionText?: string;
  sections?: Array<{
    id: string;
    title: string;
    content: string;
    type: 'text' | 'essay' | 'code' | 'math';
    completed: boolean;
  }>;
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  submittedAt?: Date;
  isLate: boolean;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  autoSubmitted?: boolean;
  aiGrade?: {
    score: number;
    feedback: string;
    confidence: number;
    gradedAt: Date;
  };
  gradedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  version: number;
  autoSavedAt?: Date;
}

const AssignmentSchema = new Schema<IAssignment>({
  title: {
    type: String,
    required: [true, 'Assignment title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Assignment description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  instructions: {
    type: String,
    required: [true, 'Assignment instructions are required'],
    trim: true,
    maxlength: [5000, 'Instructions cannot exceed 5000 characters']
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
  dueDate: {
    type: Date,
    required: [true, 'Due date is required'],
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'Due date must be in the future'
    }
  },
  maxPoints: {
    type: Number,
    required: [true, 'Maximum points is required'],
    min: [1, 'Maximum points must be at least 1'],
    max: [1000, 'Maximum points cannot exceed 1000']
  },
  submissionType: {
    type: String,
    enum: ['file', 'text', 'both'],
    required: [true, 'Submission type is required'],
    default: 'both'
  },
  allowedFileTypes: {
    type: [String],
    default: ['pdf', 'doc', 'docx', 'txt'],
    validate: {
      validator: function(types: string[]) {
        const validTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'zip', 'rar'];
        return types.every(type => validTypes.includes(type.toLowerCase()));
      },
      message: 'Invalid file type specified'
    }
  },
  maxFileSize: {
    type: Number,
    default: 10, // 10MB
    min: [1, 'Maximum file size must be at least 1MB'],
    max: [100, 'Maximum file size cannot exceed 100MB']
  },
  isRequired: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'closed'],
    default: 'draft'
  },
  assignmentDocument: {
    filename: {
      type: String
    },
    originalName: {
      type: String
    },
    fileUrl: {
      type: String
    },
    fileSize: {
      type: Number
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const AssignmentSubmissionSchema = new Schema<IAssignmentSubmission>({
  assignment: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: [true, 'Assignment is required']
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  submissionText: {
    type: String,
    trim: true,
    maxlength: [10000, 'Submission text cannot exceed 10000 characters']
  },
  sections: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    content: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      enum: ['text', 'essay', 'code', 'math'],
      default: 'text'
    },
    completed: {
      type: Boolean,
      default: false
    }
  }],
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
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  submittedAt: {
    type: Date
  },
  isLate: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'graded', 'returned'],
    default: 'draft'
  },
  grade: {
    type: Number,
    min: [0, 'Grade cannot be negative'],
    validate: {
      validator: function(this: IAssignmentSubmission, value: number) {
        // We'll populate assignment to get maxPoints for validation
        return true; // Will be validated in the controller
      }
    }
  },
  feedback: {
    type: String,
    trim: true,
    maxlength: [2000, 'Feedback cannot exceed 2000 characters']
  },
  autoSubmitted: {
    type: Boolean,
    default: false
  },
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  aiGrade: {
    score: {
      type: Number,
      min: [0, 'AI grade score cannot be negative'],
      max: [100, 'AI grade score cannot exceed 100']
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [5000, 'AI feedback cannot exceed 5000 characters']
    },
    confidence: {
      type: Number,
      min: [0, 'Confidence cannot be negative'],
      max: [1, 'Confidence cannot exceed 1']
    },
    gradedAt: {
      type: Date,
      default: Date.now
    }
  },
  version: {
    type: Number,
    default: 1,
    min: [1, 'Version must be at least 1']
  },
  autoSavedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
AssignmentSchema.index({ course: 1, status: 1 });
AssignmentSchema.index({ instructor: 1 });
AssignmentSchema.index({ dueDate: 1 });
AssignmentSchema.index({ createdAt: -1 });

AssignmentSubmissionSchema.index({ assignment: 1, student: 1, version: -1 });
AssignmentSubmissionSchema.index({ student: 1 });
AssignmentSubmissionSchema.index({ submittedAt: -1 });

// Virtual for checking if assignment is overdue
AssignmentSchema.virtual('isOverdue').get(function() {
  return new Date() > this.dueDate;
});

// Virtual for time remaining
AssignmentSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diff = due.getTime() - now.getTime();
  
  if (diff <= 0) return 'Overdue';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
});

// Pre-save middleware to set isLate flag
AssignmentSubmissionSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const assignment = await mongoose.model('Assignment').findById(this.assignment);
      if (assignment) {
        this.isLate = new Date() > assignment.dueDate;
      }
    } catch (error) {
      console.error('Error checking if submission is late:', error);
    }
  }
  next();
});

// Static method to get assignments by course
AssignmentSchema.statics.findByCourse = function(courseId: string, status?: string) {
  const query: any = { course: courseId };
  if (status) {
    query.status = status;
  }
  return this.find(query)
    .populate('instructor', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

// Static method to get upcoming assignments
AssignmentSchema.statics.findUpcoming = function(courseId: string, days: number = 7) {
  const now = new Date();
  const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
  
  return this.find({
    course: courseId,
    status: 'published',
    dueDate: { $gte: now, $lte: futureDate }
  })
  .populate('instructor', 'firstName lastName email')
  .sort({ dueDate: 1 });
};

// Static method to get overdue assignments
AssignmentSchema.statics.findOverdue = function(courseId: string) {
  return this.find({
    course: courseId,
    status: 'published',
    dueDate: { $lt: new Date() }
  })
  .populate('instructor', 'firstName lastName email')
  .sort({ dueDate: -1 });
};

export const Assignment = mongoose.model<IAssignment>('Assignment', AssignmentSchema);
export const AssignmentSubmission = mongoose.model<IAssignmentSubmission>('AssignmentSubmission', AssignmentSubmissionSchema);

export default Assignment;
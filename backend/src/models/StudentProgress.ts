import mongoose, { Schema, Document } from 'mongoose';

export interface IStudentProgressDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  weekId: mongoose.Types.ObjectId;
  materialId: mongoose.Types.ObjectId;
  completedAt: Date;
  timeSpent: number; // in minutes
  score?: number; // for quizzes/assessments
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface IWeekProgressDocument extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  weekId: mongoose.Types.ObjectId;
  materialsCompleted: number;
  totalMaterials: number;
  assessmentCompleted: boolean;
  assignmentCompleted: boolean;
  weekCompleted: boolean;
  completedAt?: Date;
  progressPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const studentProgressSchema = new Schema<IStudentProgressDocument>({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  weekId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Week', 
    required: true 
  },
  materialId: { 
    type: Schema.Types.ObjectId, 
    required: true 
  },
  completedAt: { 
    type: Date, 
    default: Date.now 
  },
  timeSpent: { 
    type: Number, 
    default: 0 
  },
  score: { 
    type: Number 
  },
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed', 'failed'],
    default: 'not_started'
  }
}, {
  timestamps: true
});

const weekProgressSchema = new Schema<IWeekProgressDocument>({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  weekId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Week', 
    required: true 
  },
  materialsCompleted: { 
    type: Number, 
    default: 0 
  },
  totalMaterials: { 
    type: Number, 
    required: true 
  },
  assessmentCompleted: { 
    type: Boolean, 
    default: false 
  },
  assignmentCompleted: { 
    type: Boolean, 
    default: false 
  },
  weekCompleted: { 
    type: Boolean, 
    default: false 
  },
  completedAt: { 
    type: Date 
  },
  progressPercentage: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

// Indexes for better performance
studentProgressSchema.index({ studentId: 1, courseId: 1, weekId: 1, materialId: 1 }, { unique: true });
weekProgressSchema.index({ studentId: 1, courseId: 1, weekId: 1 }, { unique: true });

export const StudentProgress = mongoose.model<IStudentProgressDocument>('StudentProgress', studentProgressSchema);
export const WeekProgress = mongoose.model<IWeekProgressDocument>('WeekProgress', weekProgressSchema);

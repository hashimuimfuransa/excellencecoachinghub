import mongoose, { Document, Schema } from 'mongoose';

export interface IWeekFeedback extends Document {
  weekId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  overallRating: number; // 1-5 stars
  contentQuality: number; // 1-5 stars
  difficultyLevel: 'too_easy' | 'just_right' | 'too_hard';
  paceRating: number; // 1-5 stars
  instructorRating: number; // 1-5 stars
  materialsRating: number; // 1-5 stars
  comments: string;
  suggestions: string;
  wouldRecommend: boolean;
  favoriteAspects: string[];
  challenges: string[];
  timeSpent: number; // in minutes
  completedMaterials: number;
  totalMaterials: number;
  createdAt: Date;
  updatedAt: Date;
}

const weekFeedbackSchema = new Schema<IWeekFeedback>({
  weekId: {
    type: Schema.Types.ObjectId,
    ref: 'Week',
    required: true,
    index: true
  },
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  overallRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  contentQuality: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  difficultyLevel: {
    type: String,
    required: true,
    enum: ['too_easy', 'just_right', 'too_hard']
  },
  paceRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  instructorRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  materialsRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    required: true,
    maxlength: 2000
  },
  suggestions: {
    type: String,
    maxlength: 2000
  },
  wouldRecommend: {
    type: Boolean,
    required: true
  },
  favoriteAspects: [{
    type: String,
    maxlength: 100
  }],
  challenges: [{
    type: String,
    maxlength: 100
  }],
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  },
  completedMaterials: {
    type: Number,
    required: true,
    min: 0
  },
  totalMaterials: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
weekFeedbackSchema.index({ weekId: 1, studentId: 1 }, { unique: true });
weekFeedbackSchema.index({ courseId: 1, createdAt: -1 });
weekFeedbackSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model<IWeekFeedback>('WeekFeedback', weekFeedbackSchema);

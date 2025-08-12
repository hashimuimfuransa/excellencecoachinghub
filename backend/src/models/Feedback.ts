import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedback extends Document {
  sessionId: string;
  roomId: string;
  studentId: mongoose.Types.ObjectId;
  teacherId?: mongoose.Types.ObjectId;
  rating: number; // 1-5 stars
  comment: string;
  sessionStartTime: Date;
  sessionEndTime: Date;
  attendanceDuration: number; // in seconds
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  roomId: {
    type: String,
    required: true,
    index: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  teacherId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  sessionStartTime: {
    type: Date,
    required: true
  },
  sessionEndTime: {
    type: Date,
    required: true
  },
  attendanceDuration: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
feedbackSchema.index({ sessionId: 1, studentId: 1 }, { unique: true });
feedbackSchema.index({ teacherId: 1, createdAt: -1 });

export default mongoose.model<IFeedback>('Feedback', feedbackSchema);

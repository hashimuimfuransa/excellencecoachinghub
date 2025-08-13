import mongoose, { Document, Schema } from 'mongoose';

export interface IRecordedSession extends Document {
  title: string;
  description?: string;
  teacher: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  videoUrl: string;
  videoFileName: string;
  videoSize: number;
  duration?: string;
  thumbnail?: string;
  views: number;
  isPublished: boolean;
  uploadDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RecordedSessionSchema = new Schema<IRecordedSession>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  videoUrl: {
    type: String,
    required: true
  },
  videoFileName: {
    type: String,
    required: true
  },
  videoSize: {
    type: Number,
    required: true
  },
  duration: {
    type: String,
    default: '00:00'
  },
  thumbnail: {
    type: String
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
RecordedSessionSchema.index({ teacher: 1, course: 1 });
RecordedSessionSchema.index({ uploadDate: -1 });
RecordedSessionSchema.index({ isPublished: 1 });

// Virtual for formatted upload date
RecordedSessionSchema.virtual('formattedUploadDate').get(function() {
  return this.uploadDate.toLocaleDateString();
});

// Virtual for formatted file size
RecordedSessionSchema.virtual('formattedSize').get(function() {
  const sizeInMB = this.videoSize / (1024 * 1024);
  return `${sizeInMB.toFixed(2)} MB`;
});

export default mongoose.model<IRecordedSession>('RecordedSession', RecordedSessionSchema);
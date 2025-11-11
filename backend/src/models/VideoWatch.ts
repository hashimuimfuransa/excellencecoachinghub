import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoWatch extends Document {
  user: mongoose.Types.ObjectId;
  video: mongoose.Types.ObjectId;
  watchedAt: Date;
  watchDuration?: number; // in seconds
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VideoWatchSchema = new Schema<IVideoWatch>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  video: {
    type: Schema.Types.ObjectId,
    ref: 'UploadedVideo',
    required: true
  },
  watchedAt: {
    type: Date,
    default: Date.now
  },
  watchDuration: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate watches
VideoWatchSchema.index({ user: 1, video: 1 }, { unique: true });

export default mongoose.model<IVideoWatch>('VideoWatch', VideoWatchSchema);
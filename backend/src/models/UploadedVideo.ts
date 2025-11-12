import mongoose, { Document, Schema } from 'mongoose';

export interface IUploadedVideo extends Document {
  title: string;
  description?: string;
  videoUrl: string;
  youtubeUrl?: string;
  videoType: 'uploadcare' | 'youtube';
  thumbnailUrl?: string;
  duration?: number;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  isPublic: boolean;
  views: number;
  shareToken?: string;
  shareUrl?: string;
  uploadDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UploadedVideoSchema = new Schema<IUploadedVideo>({
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
  videoUrl: {
    type: String,
    required: true
  },
  youtubeUrl: {
    type: String
  },
  videoType: {
    type: String,
    enum: ['uploadcare', 'youtube'],
    default: 'uploadcare'
  },
  thumbnailUrl: {
    type: String
  },
  duration: {
    type: Number
  },
  fileSize: {
    type: Number,
    required: function() {
      return this.videoType === 'uploadcare';
    }
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  views: {
    type: Number,
    default: 0
  },
  shareToken: {
    type: String,
    sparse: true
  },
  shareUrl: {
    type: String
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

UploadedVideoSchema.index({ uploadedBy: 1, uploadDate: -1 });
UploadedVideoSchema.index({ isPublic: 1, uploadDate: -1 });

UploadedVideoSchema.virtual('formattedSize').get(function() {
  const sizeInMB = this.fileSize / (1024 * 1024);
  return `${sizeInMB.toFixed(2)} MB`;
});

export default mongoose.model<IUploadedVideo>('UploadedVideo', UploadedVideoSchema);

import mongoose, { Document, Schema } from 'mongoose';

export interface IVideoProvider extends Document {
  name: 'agora' | '100ms';
  isActive: boolean;
  config: {
    appId?: string;
    appCertificate?: string;
    channelName?: string;
    uid?: string;
    role?: 'publisher' | 'subscriber';
    // 100ms specific config
    templateId?: string;
    roomId?: string;
    userId?: string;
    userName?: string;
  };
  fallbackProvider?: 'agora' | '100ms';
  createdAt: Date;
  updatedAt: Date;
}

const videoProviderSchema = new Schema<IVideoProvider>({
  name: {
    type: String,
    enum: ['agora', '100ms'],
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: false
  },
  config: {
    appId: String,
    appCertificate: String,
    channelName: String,
    uid: String,
    role: {
      type: String,
      enum: ['publisher', 'subscriber'],
      default: 'publisher'
    },
    // 100ms specific config
    templateId: String,
    roomId: String,
    userId: String,
    userName: String
  },
  fallbackProvider: {
    type: String,
    enum: ['agora', '100ms']
  }
}, {
  timestamps: true
});

// Ensure only one provider is active at a time
videoProviderSchema.pre('save', async function(next) {
  if (this.isActive) {
    await mongoose.model('VideoProvider').updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

export default mongoose.model<IVideoProvider>('VideoProvider', videoProviderSchema);

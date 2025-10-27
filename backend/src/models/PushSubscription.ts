import { Schema, model, Document } from 'mongoose';

export interface IPushSubscription extends Document {
  userId: Schema.Types.ObjectId;
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const pushSubscriptionSchema = new Schema<IPushSubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endpoint: {
    type: String,
    required: true
  },
  expirationTime: {
    type: Number,
    default: null
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
pushSubscriptionSchema.index({ userId: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

// Remove expired subscriptions
pushSubscriptionSchema.methods.isExpired = function(): boolean {
  if (!this.expirationTime) return false;
  return Date.now() > this.expirationTime;
};

export const PushSubscription = model<IPushSubscription>('PushSubscription', pushSubscriptionSchema);
export default PushSubscription;
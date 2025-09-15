import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailEvent extends Document {
  email: string;
  event: 'delivered' | 'bounce' | 'open' | 'click' | 'spam_report' | 'unsubscribe' | 'group_unsubscribe' | 'group_resubscribe' | 'dropped' | 'deferred' | 'processed';
  timestamp: number;
  sgEventId?: string;
  sgMessageId?: string;
  reason?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  useragent?: string;
  attempt?: number;
  response?: string;
  status?: string;
  tls?: boolean;
  cert_err?: boolean;
  type?: string;
  category?: string[];
  uniqueArgs?: Record<string, any>;
  marketingCampaignId?: string;
  marketingCampaignName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailEventSchema: Schema<IEmailEvent> = new Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  event: {
    type: String,
    required: true,
    enum: ['delivered', 'bounce', 'open', 'click', 'spam_report', 'unsubscribe', 'group_unsubscribe', 'group_resubscribe', 'dropped', 'deferred', 'processed'],
    index: true
  },
  timestamp: {
    type: Number,
    required: true,
    index: true
  },
  sgEventId: {
    type: String,
    sparse: true
  },
  sgMessageId: {
    type: String,
    sparse: true,
    index: true
  },
  reason: {
    type: String
  },
  url: {
    type: String
  },
  userAgent: {
    type: String
  },
  ip: {
    type: String
  },
  useragent: {
    type: String
  },
  attempt: {
    type: Number
  },
  response: {
    type: String
  },
  status: {
    type: String
  },
  tls: {
    type: Boolean
  },
  cert_err: {
    type: Boolean
  },
  type: {
    type: String
  },
  category: [{
    type: String
  }],
  uniqueArgs: {
    type: Schema.Types.Mixed
  },
  marketingCampaignId: {
    type: String
  },
  marketingCampaignName: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'emailevents'
});

// Compound index for efficient querying
emailEventSchema.index({ email: 1, timestamp: -1 });
emailEventSchema.index({ event: 1, timestamp: -1 });

export const EmailEvent = mongoose.model<IEmailEvent>('EmailEvent', emailEventSchema);
export default EmailEvent;
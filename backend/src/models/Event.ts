import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEventDocument extends Document {
  title: string;
  description: string;
  organizer: string; // User ID or Company ID
  organizerType: 'user' | 'company';
  eventType: 'training' | 'webinar' | 'workshop' | 'conference' | 'networking' | 'job_fair';
  date: Date;
  endDate?: Date;
  location: string;
  isOnline: boolean;
  meetingLink?: string;
  capacity?: number;
  attendees: string[]; // Array of User IDs
  attendeesCount: number;
  price?: number;
  currency?: string;
  tags: string[];
  banner?: string;
  isPublic: boolean;
  registrationRequired: boolean;
  registrationDeadline?: Date;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface IEventModel extends Model<IEventDocument> {
  findUpcoming(limit?: number): Promise<IEventDocument[]>;
  findByOrganizer(organizerId: string): Promise<IEventDocument[]>;
  findByType(eventType: string): Promise<IEventDocument[]>;
}

const eventSchema = new Schema<IEventDocument>({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Event title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    trim: true,
    maxlength: [3000, 'Event description cannot exceed 3000 characters']
  },
  organizer: {
    type: Schema.Types.ObjectId,
    refPath: 'organizerType',
    required: [true, 'Event organizer is required']
  },
  organizerType: {
    type: String,
    enum: ['User', 'Company'],
    default: 'User',
    required: true
  },
  eventType: {
    type: String,
    enum: ['training', 'webinar', 'workshop', 'conference', 'networking', 'job_fair'],
    required: [true, 'Event type is required']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required'],
    validate: {
      validator: function(this: IEventDocument, value: Date) {
        return value > new Date();
      },
      message: 'Event date must be in the future'
    }
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(this: IEventDocument, value: Date) {
        return !value || value > this.date;
      },
      message: 'End date must be after start date'
    }
  },
  location: {
    type: String,
    required: [true, 'Event location is required'],
    trim: true,
    maxlength: [300, 'Location cannot exceed 300 characters']
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  meetingLink: {
    type: String,
    trim: true,
    required: function(this: IEventDocument) {
      return this.isOnline;
    }
  },
  capacity: {
    type: Number,
    min: 1
  },
  attendees: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  attendeesCount: {
    type: Number,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD',
    maxlength: [3, 'Currency code cannot exceed 3 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }],
  banner: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  registrationRequired: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date,
    validate: {
      validator: function(this: IEventDocument, value: Date) {
        return !value || value <= this.date;
      },
      message: 'Registration deadline must be before event date'
    }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
eventSchema.index({ date: 1 });
eventSchema.index({ organizer: 1, organizerType: 1 });
eventSchema.index({ eventType: 1, date: 1 });
eventSchema.index({ status: 1, date: 1 });
eventSchema.index({ isPublic: 1, status: 1, date: 1 });
eventSchema.index({ tags: 1 });

// Text search index
eventSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    tags: 5,
    description: 1
  }
});

// Static methods
eventSchema.statics.findUpcoming = function(limit = 10): Promise<IEventDocument[]> {
  return this.find({
    status: 'published',
    isPublic: true,
    date: { $gte: new Date() }
  })
  .populate('organizer')
  .sort({ date: 1 })
  .limit(limit);
};

eventSchema.statics.findByOrganizer = function(organizerId: string): Promise<IEventDocument[]> {
  return this.find({ organizer: organizerId })
    .sort({ date: -1 });
};

eventSchema.statics.findByType = function(eventType: string): Promise<IEventDocument[]> {
  return this.find({ 
    eventType,
    status: 'published',
    isPublic: true,
    date: { $gte: new Date() }
  })
  .populate('organizer')
  .sort({ date: 1 });
};

export const Event = mongoose.model<IEventDocument, IEventModel>('Event', eventSchema);
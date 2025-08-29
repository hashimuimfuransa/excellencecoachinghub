import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUserDocument } from './User';

export interface IConnectionDocument extends Document {
  requester: string; // User ID who sent the request
  recipient: string; // User ID who received the request
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  connectionType: 'follow' | 'connect'; // follow = one-way, connect = mutual
  createdAt: Date;
  updatedAt: Date;
}

// Interface for populated connections
export interface IPopulatedConnectionDocument extends Omit<IConnectionDocument, 'requester' | 'recipient'> {
  requester: IUserDocument;
  recipient: IUserDocument;
}

export interface IConnectionModel extends Model<IConnectionDocument> {
  findConnections(userId: string): Promise<IPopulatedConnectionDocument[]>;
  findPendingRequests(userId: string): Promise<IPopulatedConnectionDocument[]>;
  findSentRequests(userId: string): Promise<IPopulatedConnectionDocument[]>;
  findMutualConnections(userId1: string, userId2: string): Promise<IConnectionDocument[]>;
  areConnected(userId1: string, userId2: string): Promise<boolean>;
}

const connectionSchema = new Schema<IConnectionDocument>({
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Connection requester is required']
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Connection recipient is required']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending',
    required: true
  },
  connectionType: {
    type: String,
    enum: ['follow', 'connect'],
    default: 'connect',
    required: true
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

// Ensure unique connections
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });
connectionSchema.index({ recipient: 1, status: 1 });
connectionSchema.index({ requester: 1, status: 1 });

// Validation to prevent self-connections
connectionSchema.pre('save', function(next) {
  if (this.requester.toString() === this.recipient.toString()) {
    next(new Error('Users cannot connect to themselves'));
  } else {
    next();
  }
});

// Static methods
connectionSchema.statics.findConnections = function(userId: string): Promise<IPopulatedConnectionDocument[]> {
  return this.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  })
  .populate('requester', 'firstName lastName profilePicture company jobTitle role userType bio location')
  .populate('recipient', 'firstName lastName profilePicture company jobTitle role userType bio location');
};

connectionSchema.statics.findPendingRequests = function(userId: string): Promise<IPopulatedConnectionDocument[]> {
  return this.find({
    recipient: userId,
    status: 'pending'
  })
  .populate('requester', 'firstName lastName profilePicture company jobTitle role userType bio location')
  .sort({ createdAt: -1 });
};

connectionSchema.statics.findSentRequests = function(userId: string): Promise<IPopulatedConnectionDocument[]> {
  return this.find({
    requester: userId,
    status: 'pending'
  })
  .populate('recipient', 'firstName lastName profilePicture company jobTitle role userType bio location')
  .sort({ createdAt: -1 });
};

connectionSchema.statics.findMutualConnections = function(userId1: string, userId2: string): Promise<IConnectionDocument[]> {
  return this.aggregate([
    {
      $match: {
        status: 'accepted',
        $or: [
          { requester: new mongoose.Types.ObjectId(userId1) },
          { recipient: new mongoose.Types.ObjectId(userId1) }
        ]
      }
    },
    {
      $lookup: {
        from: 'connections',
        let: { 
          user1Connections: {
            $cond: [
              { $eq: ['$requester', new mongoose.Types.ObjectId(userId1)] },
              '$recipient',
              '$requester'
            ]
          }
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$status', 'accepted'] },
                  {
                    $or: [
                      {
                        $and: [
                          { $eq: ['$requester', new mongoose.Types.ObjectId(userId2)] },
                          { $eq: ['$recipient', '$$user1Connections'] }
                        ]
                      },
                      {
                        $and: [
                          { $eq: ['$recipient', new mongoose.Types.ObjectId(userId2)] },
                          { $eq: ['$requester', '$$user1Connections'] }
                        ]
                      }
                    ]
                  }
                ]
              }
            }
          }
        ],
        as: 'mutualConnection'
      }
    },
    {
      $match: {
        'mutualConnection.0': { $exists: true }
      }
    }
  ]);
};

connectionSchema.statics.areConnected = async function(userId1: string, userId2: string): Promise<boolean> {
  const connection = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2, status: 'accepted' },
      { requester: userId2, recipient: userId1, status: 'accepted' }
    ]
  });
  return !!connection;
};

export const Connection = mongoose.model<IConnectionDocument, IConnectionModel>('Connection', connectionSchema);
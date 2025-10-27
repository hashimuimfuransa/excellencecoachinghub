import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'audio';
  fileUrl?: string;
  fileName?: string;
  replyTo?: mongoose.Types.ObjectId;
  isRead: boolean;
  readBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  groupId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  getUnreadCount(userId: string): Promise<number>;
}

const chatMessageSchema = new Schema<IChatMessage>({
  chat: {
    type: Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'audio'],
    default: 'text',
  },
  fileUrl: {
    type: String,
  },
  fileName: {
    type: String,
  },
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'ChatMessage',
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

const chatSchema = new Schema<IChat>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'ChatMessage',
  },
  isGroup: {
    type: Boolean,
    default: false,
  },
  groupName: {
    type: String,
    trim: true,
  },
  groupAvatar: {
    type: String,
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: 'Group',
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Instance method to get unread count for a specific user
chatSchema.methods.getUnreadCount = async function(userId: string): Promise<number> {
  const unreadCount = await ChatMessage.countDocuments({
    chat: this._id,
    sender: { $ne: userId },
    readBy: { $ne: userId },
  });
  return unreadCount;
};

// Indexes for better performance
chatMessageSchema.index({ chat: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1, createdAt: -1 });
chatMessageSchema.index({ chat: 1, readBy: 1 });

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessage: 1 });
chatSchema.index({ createdAt: -1 });

export const ChatMessage = mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
export const Chat = mongoose.model<IChat>('Chat', chatSchema);

export default { Chat, ChatMessage };
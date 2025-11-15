import mongoose, { Document, Schema } from 'mongoose';

export interface IHomeworkHelp extends Document {
  student: mongoose.Types.ObjectId;
  studentName?: string;
  subject: string;
  description: string;
  file?: {
    fileUrl: string;
    uploadedAt: Date;
  };
  comments: Array<{
    _id?: mongoose.Types.ObjectId;
    author: string;
    authorId: mongoose.Types.ObjectId;
    text: string;
    createdAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const HomeworkHelpSchema = new Schema<IHomeworkHelp>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student is required']
    },
    studentName: {
      type: String,
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    file: {
      fileUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    },
    comments: [
      {
        author: {
          type: String,
          required: true,
          trim: true
        },
        authorId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        text: {
          type: String,
          required: true,
          trim: true,
          maxlength: [1000, 'Comment cannot exceed 1000 characters']
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

HomeworkHelpSchema.index({ student: 1, createdAt: -1 });
HomeworkHelpSchema.index({ subject: 1 });

export const HomeworkHelp = mongoose.model<IHomeworkHelp>(
  'HomeworkHelp',
  HomeworkHelpSchema
);
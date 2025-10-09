import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnotation extends Document {
  documentId: string;
  materialId: string;
  weekId: string;
  userId: mongoose.Types.ObjectId;
  annotation: any; // PDFTron annotation object
  createdAt: Date;
  updatedAt: Date;
}

const annotationSchema = new Schema<IAnnotation>({
  documentId: {
    type: String,
    required: true,
    index: true
  },
  materialId: {
    type: String,
    required: true,
    index: true
  },
  weekId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  annotation: {
    type: Schema.Types.Mixed,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound indexes for efficient queries
annotationSchema.index({ documentId: 1, userId: 1 });
annotationSchema.index({ materialId: 1, userId: 1 });
annotationSchema.index({ weekId: 1, userId: 1 });

// Update the updatedAt field before saving
annotationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Annotation = mongoose.model<IAnnotation>('Annotation', annotationSchema);

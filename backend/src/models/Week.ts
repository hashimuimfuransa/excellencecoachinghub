import mongoose, { Schema, Document } from 'mongoose';

export interface IWeekDocument extends Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  materials: IWeekMaterial[];
  assessment?: mongoose.Types.ObjectId;
  assignment?: mongoose.Types.ObjectId;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWeekMaterial {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  type: 'document' | 'video' | 'audio' | 'link' | 'quiz' | 'structured_notes' | 'image' | 'exam';
  url?: string;
  filePath?: string;
  order: number;
  estimatedDuration: number; // in minutes
  isRequired: boolean;
  isPublished: boolean;
  // Exam-specific fields
  examType?: 'quiz' | 'general_exam';
  examSettings?: {
    timeLimit?: number; // in minutes
    totalMarks?: number;
    passingScore?: number;
    attempts?: number;
    instructions?: string;
    isTimed?: boolean;
    allowReview?: boolean;
  };
  content?: {
    extractedText?: string;
    structuredNotes?: {
      title: string;
      summary: string;
      keyPoints: string[];
      sections: {
        title: string;
        content: string;
        keyPoints: string[];
        order: number;
      }[];
      metadata: {
        totalSections: number;
        estimatedReadingTime: number;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        topics: string[];
      };
    };
    // Exam-specific content
    examContent?: {
      questions?: Array<{
        id: string;
        type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
        question: string;
        options?: string[];
        correctAnswer?: string;
        points: number;
        order: number;
      }>;
      totalQuestions?: number;
      examStructure?: {
        sections: Array<{
          title: string;
          questionCount: number;
          points: number;
          order: number;
        }>;
      };
    };
    originalFileName?: string;
    fileSize?: number;
    mimeType?: string;
    processedAt?: string;
    processingTime?: number;
  };
}

const weekMaterialSchema = new Schema<IWeekMaterial>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['document', 'video', 'audio', 'link', 'quiz', 'structured_notes', 'image', 'exam'],
    required: true 
  },
  url: { type: String },
  filePath: { type: String },
  order: { type: Number, required: true },
  estimatedDuration: { type: Number, required: true, default: 30 },
  isRequired: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: true },
  // Exam-specific fields
  examType: { 
    type: String, 
    enum: ['quiz', 'general_exam'] 
  },
  examSettings: {
    timeLimit: { type: Number },
    totalMarks: { type: Number },
    passingScore: { type: Number },
    attempts: { type: Number },
    instructions: { type: String },
    isTimed: { type: Boolean },
    allowReview: { type: Boolean }
  },
  content: {
    extractedText: { type: String },
    structuredNotes: {
      title: { type: String },
      summary: { type: String },
      keyPoints: [{ type: String }],
      sections: [{
        title: { type: String },
        content: { type: String },
        keyPoints: [{ type: String }],
        order: { type: Number }
      }],
      metadata: {
        totalSections: { type: Number },
        estimatedReadingTime: { type: Number },
        difficulty: { 
          type: String, 
          enum: ['beginner', 'intermediate', 'advanced'] 
        },
        topics: [{ type: String }]
      }
    },
    // Exam-specific content
    examContent: {
      questions: [{
        id: { type: String },
        type: { 
          type: String, 
          enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'] 
        },
        question: { type: String },
        options: [{ type: String }],
        correctAnswer: { type: String },
        points: { type: Number },
        order: { type: Number }
      }],
      totalQuestions: { type: Number },
      examStructure: {
        sections: [{
          title: { type: String },
          questionCount: { type: Number },
          points: { type: Number },
          order: { type: Number }
        }]
      }
    },
    originalFileName: { type: String },
    fileSize: { type: Number },
    mimeType: { type: String },
    processedAt: { type: String },
    processingTime: { type: Number }
  }
});

const weekSchema = new Schema<IWeekDocument>({
  courseId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Course', 
    required: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String, 
    required: true 
  },
  weekNumber: { 
    type: Number, 
    required: true,
    min: 1
  },
  startDate: { 
    type: Date, 
    required: true 
  },
  endDate: { 
    type: Date, 
    required: true 
  },
  materials: [weekMaterialSchema],
  assessment: { 
    type: Schema.Types.ObjectId, 
    ref: 'Assessment' 
  },
  assignment: { 
    type: Schema.Types.ObjectId, 
    ref: 'Assignment' 
  },
  isPublished: { 
    type: Boolean, 
    default: false 
  }
}, {
  timestamps: true
});

// Indexes for better performance
weekSchema.index({ courseId: 1, weekNumber: 1 }, { unique: true });
weekSchema.index({ courseId: 1, startDate: 1 });

export const Week = mongoose.model<IWeekDocument>('Week', weekSchema);

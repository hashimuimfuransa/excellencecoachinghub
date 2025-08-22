import mongoose, { Document, Schema } from 'mongoose';

export interface IInterviewResponse extends Document {
  sessionId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  questionId: string;
  question: string;
  answer: string;
  audioUrl?: string; // URL to stored audio file
  responseMethod: 'voice' | 'text';
  timestamp: Date;
  duration: number; // time taken to answer in seconds
  confidence: number; // 0-1 based on speech recognition confidence
  wordCount: number;
  keywordsFound: string[];
  sentimentScore?: number; // -1 to 1, where 1 is most positive
  clarityScore?: number; // 0-1, measures how clear the response is
  relevanceScore?: number; // 0-1, measures how relevant the answer is to the question
  processingStatus: 'pending' | 'processed' | 'failed';
  aiAnalysis?: {
    score: number; // 0-100
    feedback: string;
    strengths: string[];
    improvements: string[];
    technicalAccuracy?: number; // for technical questions
    communicationScore?: number;
    structure?: 'poor' | 'fair' | 'good' | 'excellent';
  };
}

const InterviewResponseSchema = new Schema({
  sessionId: { 
    type: Schema.Types.ObjectId, 
    ref: 'InterviewSession', 
    required: true,
    index: true
  },
  userId: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  questionId: { type: String, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  audioUrl: { type: String }, // CloudinaryURL or file path
  responseMethod: { 
    type: String, 
    enum: ['voice', 'text'], 
    required: true 
  },
  timestamp: { type: Date, default: Date.now, index: true },
  duration: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 300 // 5 minutes max per answer
  },
  confidence: { 
    type: Number, 
    min: 0, 
    max: 1, 
    default: 0.5 
  },
  wordCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  keywordsFound: [{ type: String }],
  sentimentScore: { 
    type: Number, 
    min: -1, 
    max: 1 
  },
  clarityScore: { 
    type: Number, 
    min: 0, 
    max: 1 
  },
  relevanceScore: { 
    type: Number, 
    min: 0, 
    max: 1 
  },
  processingStatus: { 
    type: String, 
    enum: ['pending', 'processed', 'failed'], 
    default: 'pending',
    index: true
  },
  aiAnalysis: {
    score: { 
      type: Number, 
      min: 0, 
      max: 100 
    },
    feedback: { type: String },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    technicalAccuracy: { 
      type: Number, 
      min: 0, 
      max: 100 
    },
    communicationScore: { 
      type: Number, 
      min: 0, 
      max: 100 
    },
    structure: { 
      type: String, 
      enum: ['poor', 'fair', 'good', 'excellent'] 
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
InterviewResponseSchema.index({ sessionId: 1, timestamp: 1 });
InterviewResponseSchema.index({ userId: 1, timestamp: -1 });
InterviewResponseSchema.index({ processingStatus: 1, timestamp: 1 });

// Virtual for response quality assessment
InterviewResponseSchema.virtual('qualityScore').get(function(this: IInterviewResponse) {
  let score = 0;
  let factors = 0;

  // Word count factor (optimal range: 50-200 words)
  if (this.wordCount > 0) {
    const wordScore = Math.min(this.wordCount / 100, 1); // Normalize to 0-1
    score += wordScore * 25; // 25 points for word count
    factors++;
  }

  // Confidence factor
  if (this.confidence > 0) {
    score += this.confidence * 25; // 25 points for confidence
    factors++;
  }

  // Clarity factor
  if (this.clarityScore && this.clarityScore > 0) {
    score += this.clarityScore * 25; // 25 points for clarity
    factors++;
  }

  // Relevance factor
  if (this.relevanceScore && this.relevanceScore > 0) {
    score += this.relevanceScore * 25; // 25 points for relevance
    factors++;
  }

  return factors > 0 ? Math.round(score / factors) : 0;
});

// Virtual for response efficiency (words per second)
InterviewResponseSchema.virtual('efficiency').get(function(this: IInterviewResponse) {
  if (this.duration === 0) return 0;
  return Number((this.wordCount / this.duration).toFixed(2));
});

// Pre-save middleware to calculate word count and basic metrics
InterviewResponseSchema.pre('save', function(this: IInterviewResponse) {
  // Calculate word count
  if (this.answer) {
    this.wordCount = this.answer.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  // Extract basic keywords if not already set
  if (this.keywordsFound.length === 0 && this.answer) {
    this.keywordsFound = this.extractKeywords(this.answer);
  }
});

// Instance methods
InterviewResponseSchema.methods.extractKeywords = function(this: IInterviewResponse, text: string): string[] {
  // Simple keyword extraction
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => 
      word.length > 3 && 
      !['that', 'this', 'with', 'they', 'have', 'will', 'from', 'been', 'were', 'would', 'could', 'should'].includes(word)
    );
  
  // Return unique words, limited to top 10
  return [...new Set(words)].slice(0, 10);
};

InterviewResponseSchema.methods.processWithAI = async function(this: IInterviewResponse, aiService: any) {
  try {
    this.processingStatus = 'pending';
    await this.save();

    // Call AI service to analyze the response
    const analysis = await aiService.analyzeInterviewResponse({
      question: this.question,
      answer: this.answer,
      duration: this.duration,
      wordCount: this.wordCount
    });

    // Update with AI analysis results
    this.aiAnalysis = analysis;
    this.clarityScore = analysis.communicationScore / 100;
    this.relevanceScore = analysis.score / 100;
    this.processingStatus = 'processed';

    await this.save();
    return analysis;
  } catch (error) {
    this.processingStatus = 'failed';
    await this.save();
    throw error;
  }
};

// Static methods
InterviewResponseSchema.statics.findBySession = function(sessionId: string) {
  return this.find({ sessionId: new mongoose.Types.ObjectId(sessionId) })
    .sort({ timestamp: 1 });
};

InterviewResponseSchema.statics.findByUser = function(userId: string, limit: number = 50) {
  return this.find({ userId: new mongoose.Types.ObjectId(userId) })
    .sort({ timestamp: -1 })
    .limit(limit);
};

InterviewResponseSchema.statics.getResponseStats = function(userId: string) {
  return this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$responseMethod',
        count: { $sum: 1 },
        avgDuration: { $avg: '$duration' },
        avgWordCount: { $avg: '$wordCount' },
        avgConfidence: { $avg: '$confidence' }
      }
    }
  ]);
};

InterviewResponseSchema.statics.findPendingProcessing = function(limit: number = 100) {
  return this.find({ processingStatus: 'pending' })
    .sort({ timestamp: 1 })
    .limit(limit);
};

export const InterviewResponse = mongoose.model<IInterviewResponse>('InterviewResponse', InterviewResponseSchema);
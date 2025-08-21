import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJobCourseMatchDocument extends Document {
  job: string;
  course: string;
  relevanceScore: number;
  matchingSkills: string[];
  createdBy: string;
  createdAt: Date;
}

export interface IJobCourseMatchModel extends Model<IJobCourseMatchDocument> {
  findByJob(jobId: string): Promise<IJobCourseMatchDocument[]>;
  findByCourse(courseId: string): Promise<IJobCourseMatchDocument[]>;
  findHighRelevanceMatches(minScore?: number): Promise<IJobCourseMatchDocument[]>;
  findBySkills(skills: string[]): Promise<IJobCourseMatchDocument[]>;
}

const jobCourseMatchSchema = new Schema<IJobCourseMatchDocument>({
  job: {
    type: Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job is required']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  relevanceScore: {
    type: Number,
    required: [true, 'Relevance score is required'],
    min: [0, 'Relevance score cannot be negative'],
    max: [100, 'Relevance score cannot exceed 100']
  },
  matchingSkills: [{
    type: String,
    trim: true,
    maxlength: [100, 'Skill name cannot exceed 100 characters']
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
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
jobCourseMatchSchema.index({ job: 1 });
jobCourseMatchSchema.index({ course: 1 });
jobCourseMatchSchema.index({ relevanceScore: -1 });
jobCourseMatchSchema.index({ matchingSkills: 1 });
jobCourseMatchSchema.index({ createdBy: 1 });
jobCourseMatchSchema.index({ createdAt: -1 });

// Compound indexes
jobCourseMatchSchema.index({ job: 1, relevanceScore: -1 });
jobCourseMatchSchema.index({ course: 1, relevanceScore: -1 });
jobCourseMatchSchema.index({ matchingSkills: 1, relevanceScore: -1 });

// Unique constraint to prevent duplicate matches
jobCourseMatchSchema.index({ job: 1, course: 1 }, { unique: true });

// Virtual for relevance level
jobCourseMatchSchema.virtual('relevanceLevel').get(function(this: IJobCourseMatchDocument) {
  if (this.relevanceScore >= 90) return 'Excellent';
  if (this.relevanceScore >= 80) return 'Very Good';
  if (this.relevanceScore >= 70) return 'Good';
  if (this.relevanceScore >= 60) return 'Fair';
  return 'Poor';
});

// Virtual for matching skills count
jobCourseMatchSchema.virtual('matchingSkillsCount').get(function(this: IJobCourseMatchDocument) {
  return this.matchingSkills ? this.matchingSkills.length : 0;
});

// Static methods
jobCourseMatchSchema.statics.findByJob = function(jobId: string): Promise<IJobCourseMatchDocument[]> {
  return this.find({ job: jobId })
    .populate('course', 'title description category level')
    .populate('createdBy', 'firstName lastName')
    .sort({ relevanceScore: -1 });
};

jobCourseMatchSchema.statics.findByCourse = function(courseId: string): Promise<IJobCourseMatchDocument[]> {
  return this.find({ course: courseId })
    .populate('job', 'title company location jobType')
    .populate('createdBy', 'firstName lastName')
    .sort({ relevanceScore: -1 });
};

jobCourseMatchSchema.statics.findHighRelevanceMatches = function(minScore: number = 70): Promise<IJobCourseMatchDocument[]> {
  return this.find({ relevanceScore: { $gte: minScore } })
    .populate('job', 'title company location jobType')
    .populate('course', 'title description category level')
    .populate('createdBy', 'firstName lastName')
    .sort({ relevanceScore: -1 });
};

jobCourseMatchSchema.statics.findBySkills = function(skills: string[]): Promise<IJobCourseMatchDocument[]> {
  return this.find({ matchingSkills: { $in: skills } })
    .populate('job', 'title company location jobType')
    .populate('course', 'title description category level')
    .populate('createdBy', 'firstName lastName')
    .sort({ relevanceScore: -1 });
};

export const JobCourseMatch = mongoose.model<IJobCourseMatchDocument, IJobCourseMatchModel>('JobCourseMatch', jobCourseMatchSchema);
import mongoose, { Schema, Document, Model } from 'mongoose';
import { EducationLevel } from '../types/job';

export interface IStudentProfileDocument extends Document {
  user: string;
  age?: number;
  educationLevel: EducationLevel;
  completedCourses: string[];
  certificates: string[];
  jobInterests: string[];
  careerGoals: string[];
  // Additional fields
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  currentEducationLevel?: 'high_school' | 'undergraduate' | 'graduate' | 'postgraduate' | 'other';
  schoolName?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
  gpa?: number;
  academicInterests?: string[];
  preferredCareerPath?: string[];
  workExperience?: Array<{
    company?: string;
    position?: string;
    startDate?: Date;
    endDate?: Date;
    description?: string;
    isCurrent?: boolean;
  }>;
  skills?: string[];
  languages?: string[];
  preferredLearningStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'reading_writing';
  studySchedule?: {
    preferredTime?: string;
    studyHoursPerWeek?: number;
    availableDays?: string[];
  };
  learningGoals?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentProfileModel extends Model<IStudentProfileDocument> {
  findByEducationLevel(educationLevel: EducationLevel): Promise<IStudentProfileDocument[]>;
  findByJobInterests(interests: string[]): Promise<IStudentProfileDocument[]>;
  findEligibleForJobs(): Promise<IStudentProfileDocument[]>;
  findByCompletedCourses(courseIds: string[]): Promise<IStudentProfileDocument[]>;
}

const studentProfileSchema = new Schema<IStudentProfileDocument>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  age: {
    type: Number,
    min: [13, 'Age must be at least 13'],
    max: [100, 'Age cannot exceed 100']
  },
  educationLevel: {
    type: String,
    enum: EducationLevel ? Object.values(EducationLevel) : ['high_school', 'associate', 'bachelor', 'master', 'doctorate', 'professional'],
    required: [true, 'Education level is required']
  },
  completedCourses: [{
    type: Schema.Types.ObjectId,
    ref: 'Course'
  }],
  certificates: [{
    type: Schema.Types.ObjectId,
    ref: 'JobCertificate'
  }],
  jobInterests: [{
    type: String,
    trim: true,
    maxlength: [100, 'Job interest cannot exceed 100 characters']
  }],
  careerGoals: [{
    type: String,
    trim: true,
    maxlength: [200, 'Career goal cannot exceed 200 characters']
  }],
  // Additional fields from frontend
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String,
    email: String
  },
  currentEducationLevel: {
    type: String,
    enum: ['high_school', 'undergraduate', 'graduate', 'postgraduate', 'other']
  },
  schoolName: {
    type: String,
    trim: true
  },
  fieldOfStudy: {
    type: String,
    trim: true
  },
  graduationYear: {
    type: Number,
    min: 1950,
    max: 2030
  },
  gpa: {
    type: Number,
    min: 0,
    max: 4.0
  },
  academicInterests: [{
    type: String,
    trim: true
  }],
  preferredCareerPath: [{
    type: String,
    trim: true
  }],
  workExperience: [{
    company: String,
    position: String,
    startDate: Date,
    endDate: Date,
    description: String,
    isCurrent: Boolean
  }],
  skills: [{
    type: String,
    trim: true
  }],
  languages: [{
    type: String,
    trim: true
  }],
  preferredLearningStyle: {
    type: String,
    enum: ['visual', 'auditory', 'kinesthetic', 'reading_writing']
  },
  studySchedule: {
    preferredTime: String,
    studyHoursPerWeek: {
      type: Number,
      min: 0,
      max: 168
    },
    availableDays: [String]
  },
  learningGoals: [{
    type: String,
    trim: true
  }]
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
studentProfileSchema.index({ user: 1 });
studentProfileSchema.index({ educationLevel: 1 });
studentProfileSchema.index({ jobInterests: 1 });
studentProfileSchema.index({ completedCourses: 1 });
studentProfileSchema.index({ createdAt: -1 });

// Compound indexes
studentProfileSchema.index({ educationLevel: 1, jobInterests: 1 });
studentProfileSchema.index({ completedCourses: 1, educationLevel: 1 });

// Virtual for checking if eligible for jobs
studentProfileSchema.virtual('isEligibleForJobs').get(function(this: IStudentProfileDocument) {
  const eligibleLevels = [
    EducationLevel.HIGH_SCHOOL,
    EducationLevel.ASSOCIATE,
    EducationLevel.BACHELOR,
    EducationLevel.MASTER,
    EducationLevel.DOCTORATE,
    EducationLevel.PROFESSIONAL
  ];
  return eligibleLevels.includes(this.educationLevel);
});

// Virtual for completed courses count
studentProfileSchema.virtual('completedCoursesCount').get(function(this: IStudentProfileDocument) {
  return this.completedCourses ? this.completedCourses.length : 0;
});

// Virtual for certificates count
studentProfileSchema.virtual('certificatesCount').get(function(this: IStudentProfileDocument) {
  return this.certificates ? this.certificates.length : 0;
});

// Static methods
studentProfileSchema.statics.findByEducationLevel = function(educationLevel: EducationLevel): Promise<IStudentProfileDocument[]> {
  return this.find({ educationLevel })
    .populate('user', 'firstName lastName email avatar')
    .populate('completedCourses', 'title description')
    .populate('certificates')
    .sort({ createdAt: -1 });
};

studentProfileSchema.statics.findByJobInterests = function(interests: string[]): Promise<IStudentProfileDocument[]> {
  return this.find({ jobInterests: { $in: interests } })
    .populate('user', 'firstName lastName email avatar')
    .populate('completedCourses', 'title description')
    .populate('certificates')
    .sort({ createdAt: -1 });
};

studentProfileSchema.statics.findEligibleForJobs = function(): Promise<IStudentProfileDocument[]> {
  const eligibleLevels = [
    EducationLevel.HIGH_SCHOOL,
    EducationLevel.ASSOCIATE,
    EducationLevel.BACHELOR,
    EducationLevel.MASTER,
    EducationLevel.DOCTORATE,
    EducationLevel.PROFESSIONAL
  ];
  
  return this.find({ educationLevel: { $in: eligibleLevels } })
    .populate('user', 'firstName lastName email avatar')
    .populate('completedCourses', 'title description')
    .populate('certificates')
    .sort({ createdAt: -1 });
};

studentProfileSchema.statics.findByCompletedCourses = function(courseIds: string[]): Promise<IStudentProfileDocument[]> {
  return this.find({ completedCourses: { $in: courseIds } })
    .populate('user', 'firstName lastName email avatar')
    .populate('completedCourses', 'title description')
    .populate('certificates')
    .sort({ createdAt: -1 });
};

export const StudentProfile = mongoose.model<IStudentProfileDocument, IStudentProfileModel>('StudentProfile', studentProfileSchema);
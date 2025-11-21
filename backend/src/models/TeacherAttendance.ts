import mongoose, { Schema, Document, Model } from 'mongoose';

// Teacher Attendance record document interface
export interface ITeacherAttendanceDocument extends Document {
  teacherName: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // in minutes
  status: 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateDuration(): number;
}

// Teacher Attendance model interface
export interface ITeacherAttendanceModel extends Model<ITeacherAttendanceDocument> {
  findByTeacherName(teacherName: string): Promise<ITeacherAttendanceDocument[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<ITeacherAttendanceDocument[]>;
  getTodaysRecord(teacherName: string): Promise<ITeacherAttendanceDocument | null>;
  getTeacherStats(teacherName: string): Promise<any>;
}

// Teacher Attendance schema
const teacherAttendanceSchema = new Schema<ITeacherAttendanceDocument>({
  teacherName: {
    type: String,
    required: [true, 'Teacher name is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Attendance date is required'],
    default: Date.now
  },
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
teacherAttendanceSchema.index({ teacherName: 1 });
teacherAttendanceSchema.index({ date: -1 });
teacherAttendanceSchema.index({ teacherName: 1, date: -1 });

// Compound index for unique attendance per teacher per day
teacherAttendanceSchema.index({ teacherName: 1, date: 1 }, { 
  unique: true
});

// Virtual for formatted date
teacherAttendanceSchema.virtual('formattedDate').get(function(this: ITeacherAttendanceDocument) {
  return this.date.toISOString().split('T')[0];
});

// Virtual for formatted start time
teacherAttendanceSchema.virtual('formattedStartTime').get(function(this: ITeacherAttendanceDocument) {
  return this.startTime ? this.startTime.toTimeString().split(' ')[0] : null;
});

// Virtual for formatted end time
teacherAttendanceSchema.virtual('formattedEndTime').get(function(this: ITeacherAttendanceDocument) {
  return this.endTime ? this.endTime.toTimeString().split(' ')[0] : null;
});

// Instance method to calculate duration
teacherAttendanceSchema.methods.calculateDuration = function(): number {
  if (this.startTime && this.endTime) {
    return Math.floor((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
  }
  return 0;
};

// Pre-save middleware to calculate duration
teacherAttendanceSchema.pre<ITeacherAttendanceDocument>('save', function(next) {
  if (this.startTime && this.endTime) {
    this.duration = this.calculateDuration();
    this.status = 'completed';
  }
  next();
});

// Static method to find attendance by teacher name
teacherAttendanceSchema.statics.findByTeacherName = function(teacherName: string): Promise<ITeacherAttendanceDocument[]> {
  return this.find({ teacherName })
    .sort({ date: -1 });
};

// Static method to find attendance by date range
teacherAttendanceSchema.statics.findByDateRange = function(startDate: Date, endDate: Date): Promise<ITeacherAttendanceDocument[]> {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .sort({ date: -1 });
};

// Static method to get today's record for a teacher
teacherAttendanceSchema.statics.getTodaysRecord = async function(teacherName: string): Promise<ITeacherAttendanceDocument | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.findOne({
    teacherName,
    date: {
      $gte: today,
      $lt: tomorrow
    }
  });
};

// Static method to get teacher statistics
teacherAttendanceSchema.statics.getTeacherStats = async function(teacherName: string): Promise<any> {
  const records: ITeacherAttendanceDocument[] = await this.find({ teacherName });
  
  const totalDays = records.length;
  const completedDays = records.filter((r: ITeacherAttendanceDocument) => r.status === 'completed').length;
  
  // Calculate average working hours
  const totalMinutes = records.reduce((sum: number, record: ITeacherAttendanceDocument) => sum + (record.duration || 0), 0);
  const averageMinutes = totalDays > 0 ? totalMinutes / totalDays : 0;
  
  return {
    totalDays,
    completedDays,
    completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
    averageWorkingHours: Math.round(averageMinutes / 60 * 100) / 100,
    totalWorkingHours: Math.round(totalMinutes / 60 * 100) / 100
  };
};

// Create and export the model
export const TeacherAttendance = mongoose.model<ITeacherAttendanceDocument, ITeacherAttendanceModel>('TeacherAttendance', teacherAttendanceSchema);
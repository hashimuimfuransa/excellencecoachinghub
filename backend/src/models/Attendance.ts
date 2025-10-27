import mongoose, { Schema, Document, Model } from 'mongoose';

// Attendance record document interface
export interface IAttendanceDocument extends Document {
  student: mongoose.Types.ObjectId;
  course: mongoose.Types.ObjectId;
  session?: mongoose.Types.ObjectId; // For live session attendance
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  checkInTime?: Date;
  checkOutTime?: Date;
  duration?: number; // in minutes
  location?: string; // 'online' | 'classroom' | 'hybrid'
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
    platform?: string;
  };
  notes?: string;
  markedBy: mongoose.Types.ObjectId; // Teacher or system
  autoMarked: boolean; // Whether attendance was automatically marked
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  calculateDuration(): number;
  isLate(): boolean;
}

// Attendance model interface
export interface IAttendanceModel extends Model<IAttendanceDocument> {
  findByStudent(studentId: string): Promise<IAttendanceDocument[]>;
  findByCourse(courseId: string): Promise<IAttendanceDocument[]>;
  findByDateRange(startDate: Date, endDate: Date): Promise<IAttendanceDocument[]>;
  getAttendanceRate(studentId: string, courseId?: string): Promise<number>;
  getStudentAttendanceStats(studentId: string): Promise<any>;
  getCourseAttendanceStats(courseId: string): Promise<any>;
  markAttendance(studentId: string, courseId: string, status: string, markedBy: string): Promise<IAttendanceDocument>;
}

// Attendance schema
const attendanceSchema = new Schema<IAttendanceDocument>({
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student reference is required']
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course reference is required']
  },
  session: {
    type: Schema.Types.ObjectId,
    ref: 'LiveSession',
    default: null
  },
  date: {
    type: Date,
    required: [true, 'Attendance date is required'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused'],
    required: [true, 'Attendance status is required']
  },
  checkInTime: {
    type: Date,
    default: null
  },
  checkOutTime: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: 0,
    min: [0, 'Duration cannot be negative']
  },
  location: {
    type: String,
    enum: ['online', 'classroom', 'hybrid'],
    default: 'online'
  },
  deviceInfo: {
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
    platform: { type: String, default: null }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  markedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Marked by reference is required']
  },
  autoMarked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
attendanceSchema.index({ student: 1 });
attendanceSchema.index({ course: 1 });
attendanceSchema.index({ date: -1 });
attendanceSchema.index({ student: 1, course: 1 });
attendanceSchema.index({ student: 1, date: -1 });
attendanceSchema.index({ course: 1, date: -1 });
attendanceSchema.index({ status: 1 });
attendanceSchema.index({ session: 1 });

// Compound index for unique attendance per student per course per day
attendanceSchema.index({ student: 1, course: 1, date: 1 }, { 
  unique: true,
  partialFilterExpression: { session: { $exists: false } }
});

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function(this: IAttendanceDocument) {
  return this.date.toISOString().split('T')[0];
});

// Instance method to calculate duration
attendanceSchema.methods.calculateDuration = function(): number {
  if (this.checkInTime && this.checkOutTime) {
    return Math.floor((this.checkOutTime.getTime() - this.checkInTime.getTime()) / (1000 * 60));
  }
  return 0;
};

// Instance method to check if late
attendanceSchema.methods.isLate = function(): boolean {
  return this.status === 'late';
};

// Pre-save middleware to calculate duration
attendanceSchema.pre<IAttendanceDocument>('save', function(next) {
  if (this.checkInTime && this.checkOutTime) {
    this.duration = this.calculateDuration();
  }
  next();
});

// Static method to find attendance by student
attendanceSchema.statics.findByStudent = function(studentId: string): Promise<IAttendanceDocument[]> {
  return this.find({ student: studentId })
    .populate('course', 'title instructor')
    .populate('session', 'title scheduledTime')
    .populate('markedBy', 'firstName lastName')
    .sort({ date: -1 });
};

// Static method to find attendance by course
attendanceSchema.statics.findByCourse = function(courseId: string): Promise<IAttendanceDocument[]> {
  return this.find({ course: courseId })
    .populate('student', 'firstName lastName email')
    .populate('session', 'title scheduledTime')
    .populate('markedBy', 'firstName lastName')
    .sort({ date: -1 });
};

// Static method to find attendance by date range
attendanceSchema.statics.findByDateRange = function(startDate: Date, endDate: Date): Promise<IAttendanceDocument[]> {
  return this.find({
    date: {
      $gte: startDate,
      $lte: endDate
    }
  })
    .populate('student', 'firstName lastName email')
    .populate('course', 'title instructor')
    .populate('session', 'title scheduledTime')
    .sort({ date: -1 });
};

// Static method to get attendance rate
attendanceSchema.statics.getAttendanceRate = async function(studentId: string, courseId?: string): Promise<number> {
  const query: any = { student: studentId };
  if (courseId) {
    query.course = courseId;
  }

  const totalAttendance = await this.countDocuments(query);
  const presentAttendance = await this.countDocuments({
    ...query,
    status: { $in: ['present', 'late'] }
  });

  return totalAttendance > 0 ? (presentAttendance / totalAttendance) * 100 : 0;
};

// Static method to get student attendance statistics
attendanceSchema.statics.getStudentAttendanceStats = async function(studentId: string): Promise<any> {
  const stats = await this.aggregate([
    { $match: { student: new mongoose.Types.ObjectId(studentId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalAttendance = await this.countDocuments({ student: studentId });
  const attendanceRate = await this.getAttendanceRate(studentId);

  return {
    totalDays: totalAttendance,
    attendanceRate: Math.round(attendanceRate * 100) / 100,
    breakdown: stats.reduce((acc: any, stat: any) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  };
};

// Static method to get course attendance statistics
attendanceSchema.statics.getCourseAttendanceStats = async function(courseId: string): Promise<any> {
  const stats = await this.aggregate([
    { $match: { course: new mongoose.Types.ObjectId(courseId) } },
    {
      $group: {
        _id: {
          student: '$student',
          status: '$status'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.student',
        attendance: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        totalDays: { $sum: '$count' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'student'
      }
    },
    {
      $unwind: '$student'
    },
    {
      $project: {
        studentName: { $concat: ['$student.firstName', ' ', '$student.lastName'] },
        studentEmail: '$student.email',
        totalDays: 1,
        attendance: 1,
        attendanceRate: {
          $multiply: [
            {
              $divide: [
                {
                  $size: {
                    $filter: {
                      input: '$attendance',
                      cond: { $in: ['$$this.status', ['present', 'late']] }
                    }
                  }
                },
                { $size: '$attendance' }
              ]
            },
            100
          ]
        }
      }
    }
  ]);

  return stats;
};

// Static method to mark attendance
attendanceSchema.statics.markAttendance = async function(
  studentId: string, 
  courseId: string, 
  status: string, 
  markedBy: string
): Promise<IAttendanceDocument> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingAttendance = await this.findOne({
    student: studentId,
    course: courseId,
    date: {
      $gte: today,
      $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    }
  });

  if (existingAttendance) {
    existingAttendance.status = status;
    existingAttendance.markedBy = markedBy;
    if (status === 'present' || status === 'late') {
      existingAttendance.checkInTime = new Date();
    }
    return existingAttendance.save();
  }

  const attendance = new this({
    student: studentId,
    course: courseId,
    date: today,
    status,
    markedBy,
    checkInTime: (status === 'present' || status === 'late') ? new Date() : undefined
  });

  return attendance.save();
};

// Create and export the model
export const Attendance = mongoose.model<IAttendanceDocument, IAttendanceModel>('Attendance', attendanceSchema);

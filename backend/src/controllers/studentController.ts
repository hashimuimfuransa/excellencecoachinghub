import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { User, UserProgress, Course, Attendance, LiveSession } from '../models';
import { UserRole } from '../../../shared/types';

// Get all students with their enrollment and attendance data
export const getAllStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || '';
    const status = req.query.status as string;
    const courseId = req.query.courseId as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as string || 'desc';

    // Build match conditions
    const matchConditions: any = {
      role: UserRole.STUDENT
    };

    if (status) {
      matchConditions.isActive = status === 'active';
    }

    if (search) {
      matchConditions.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'userprogresses',
          localField: '_id',
          foreignField: 'user',
          as: 'enrollments'
        }
      },
      {
        $lookup: {
          from: 'attendances',
          localField: '_id',
          foreignField: 'student',
          as: 'attendanceRecords'
        }
      },
      {
        $addFields: {
          totalCourses: { $size: '$enrollments' },
          completedCourses: {
            $size: {
              $filter: {
                input: '$enrollments',
                cond: { $eq: ['$$this.isCompleted', true] }
              }
            }
          },
          totalAttendanceDays: { $size: '$attendanceRecords' },
          presentDays: {
            $size: {
              $filter: {
                input: '$attendanceRecords',
                cond: { $in: ['$$this.status', ['present', 'late']] }
              }
            }
          },
          attendanceRate: {
            $cond: {
              if: { $gt: [{ $size: '$attendanceRecords' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$attendanceRecords',
                            cond: { $in: ['$$this.status', ['present', 'late']] }
                          }
                        }
                      },
                      { $size: '$attendanceRecords' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          },
          averageProgress: {
            $cond: {
              if: { $gt: [{ $size: '$enrollments' }, 0] },
              then: { $avg: '$enrollments.progressPercentage' },
              else: 0
            }
          }
        }
      }
    ];

    // Add course filter if specified
    if (courseId) {
      pipeline.push({
        $match: {
          'enrollments.course': new require('mongoose').Types.ObjectId(courseId)
        }
      });
    }

    // Add sorting
    const sortStage: any = {};
    sortStage[sortBy] = sortOrder === 'desc' ? -1 : 1;
    pipeline.push({ $sort: sortStage });

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    // Project final fields
    pipeline.push({
      $project: {
        firstName: 1,
        lastName: 1,
        email: 1,
        isActive: 1,
        createdAt: 1,
        lastLogin: 1,
        totalCourses: 1,
        completedCourses: 1,
        totalAttendanceDays: 1,
        presentDays: 1,
        attendanceRate: { $round: ['$attendanceRate', 2] },
        averageProgress: { $round: ['$averageProgress', 2] },
        enrollments: {
          $map: {
            input: { $slice: ['$enrollments', 5] }, // Limit to 5 recent enrollments
            as: 'enrollment',
            in: {
              courseId: '$$enrollment.course',
              progressPercentage: '$$enrollment.progressPercentage',
              enrollmentDate: '$$enrollment.enrollmentDate',
              lastAccessed: '$$enrollment.lastAccessed',
              isCompleted: '$$enrollment.isCompleted'
            }
          }
        }
      }
    });

    const students = await User.aggregate(pipeline);

    // Get total count for pagination
    const totalCountPipeline = [
      { $match: matchConditions }
    ];

    if (courseId) {
      totalCountPipeline.push(
        {
          $lookup: {
            from: 'userprogresses',
            localField: '_id',
            foreignField: 'user',
            as: 'enrollments'
          }
        },
        {
          $match: {
            'enrollments.course': new require('mongoose').Types.ObjectId(courseId)
          }
        }
      );
    }

    totalCountPipeline.push({ $count: 'total' });
    const totalCountResult = await User.aggregate(totalCountPipeline);
    const totalStudents = totalCountResult[0]?.total || 0;

    // Calculate pagination info
    const totalPages = Math.ceil(totalStudents / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.status(200).json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: page,
          totalPages,
          totalStudents,
          studentsPerPage: limit,
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get student details with comprehensive data
export const getStudentDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    // Get student basic info
    const student = await User.findById(id).select('-password -emailVerificationToken -passwordResetToken');
    if (!student || student.role !== UserRole.STUDENT) {
      res.status(404).json({
        success: false,
        error: 'Student not found'
      });
      return;
    }

    // Get enrollments with course details
    const enrollments = await UserProgress.find({ user: id })
      .populate({
        path: 'course',
        select: 'title description instructor category level duration price',
        populate: {
          path: 'instructor',
          select: 'firstName lastName email'
        }
      })
      .sort({ enrollmentDate: -1 });

    // Get attendance records
    const attendanceRecords = await Attendance.find({ student: id })
      .populate('course', 'title')
      .populate('session', 'title scheduledTime')
      .sort({ date: -1 })
      .limit(50); // Limit to recent 50 records

    // Get attendance statistics
    const attendanceStats = await Attendance.getStudentAttendanceStats(id);

    // Get live session participation
    const sessionParticipation = await LiveSession.find({
      'attendees.user': id
    })
      .populate('course', 'title')
      .populate('instructor', 'firstName lastName')
      .select('title scheduledTime duration status attendees')
      .sort({ scheduledTime: -1 })
      .limit(20);

    // Calculate overall statistics
    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.isCompleted).length;
    const averageProgress = totalCourses > 0 
      ? enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / totalCourses 
      : 0;

    res.status(200).json({
      success: true,
      data: {
        student: {
          ...student.toObject(),
          statistics: {
            totalCourses,
            completedCourses,
            averageProgress: Math.round(averageProgress * 100) / 100,
            totalAttendanceDays: attendanceStats.totalDays,
            attendanceRate: attendanceStats.attendanceRate,
            attendanceBreakdown: attendanceStats.breakdown
          }
        },
        enrollments,
        attendanceRecords,
        sessionParticipation: sessionParticipation.map(session => ({
          ...session.toObject(),
          studentAttendance: session.attendees.find(a => a.user.toString() === id)
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get student attendance for a specific course
export const getStudentCourseAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { studentId, courseId } = req.params;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Build query
    const query: any = {
      student: studentId,
      course: courseId
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('session', 'title scheduledTime')
      .populate('markedBy', 'firstName lastName')
      .sort({ date: -1 });

    const attendanceRate = await Attendance.getAttendanceRate(studentId, courseId);

    res.status(200).json({
      success: true,
      data: {
        attendance,
        attendanceRate: Math.round(attendanceRate * 100) / 100
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mark student attendance
export const markAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { studentId, courseId, status, notes, sessionId } = req.body;
    const markedBy = req.user?.id;

    // Verify student exists and is enrolled in course
    const student = await User.findById(studentId);
    if (!student || student.role !== UserRole.STUDENT) {
      res.status(404).json({
        success: false,
        error: 'Student not found'
      });
      return;
    }

    const enrollment = await UserProgress.findOne({ user: studentId, course: courseId });
    if (!enrollment) {
      res.status(400).json({
        success: false,
        error: 'Student is not enrolled in this course'
      });
      return;
    }

    // Mark attendance
    const attendance = await Attendance.markAttendance(studentId, courseId, status, markedBy);
    
    if (notes) {
      attendance.notes = notes;
    }
    
    if (sessionId) {
      attendance.session = sessionId;
    }

    await attendance.save();

    // Populate the response
    await attendance.populate([
      { path: 'student', select: 'firstName lastName email' },
      { path: 'course', select: 'title' },
      { path: 'session', select: 'title scheduledTime' },
      { path: 'markedBy', select: 'firstName lastName' }
    ]);

    res.status(200).json({
      success: true,
      data: { attendance },
      message: 'Attendance marked successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Get course attendance report
export const getCourseAttendanceReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId } = req.params;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    // Build date filter
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get course attendance statistics
    const attendanceStats = await Attendance.getCourseAttendanceStats(courseId);

    // Get daily attendance summary
    const dailyAttendance = await Attendance.aggregate([
      {
        $match: {
          course: new require('mongoose').Types.ObjectId(courseId),
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          totalStudents: { $sum: 1 },
          present: {
            $sum: {
              $cond: [{ $eq: ['$status', 'present'] }, 1, 0]
            }
          },
          late: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
            }
          },
          absent: {
            $sum: {
              $cond: [{ $eq: ['$status', 'absent'] }, 1, 0]
            }
          },
          excused: {
            $sum: {
              $cond: [{ $eq: ['$status', 'excused'] }, 1, 0]
            }
          }
        }
      },
      {
        $addFields: {
          date: '$_id',
          attendanceRate: {
            $multiply: [
              {
                $divide: [
                  { $add: ['$present', '$late'] },
                  '$totalStudents'
                ]
              },
              100
            ]
          }
        }
      },
      {
        $project: {
          _id: 0,
          date: 1,
          totalStudents: 1,
          present: 1,
          late: 1,
          absent: 1,
          excused: 1,
          attendanceRate: { $round: ['$attendanceRate', 2] }
        }
      },
      { $sort: { date: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        studentStats: attendanceStats,
        dailyAttendance
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get student statistics
export const getStudentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get total students
    const totalStudents = await User.countDocuments({ role: UserRole.STUDENT });
    const activeStudents = await User.countDocuments({ role: UserRole.STUDENT, isActive: true });

    // Get enrollment statistics
    const enrollmentStats = await UserProgress.aggregate([
      {
        $group: {
          _id: null,
          totalEnrollments: { $sum: 1 },
          completedCourses: {
            $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
          },
          averageProgress: { $avg: '$progressPercentage' },
          totalTimeSpent: { $sum: '$totalTimeSpent' }
        }
      }
    ]);

    // Get attendance statistics
    const attendanceStats = await Attendance.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent enrollments
    const recentEnrollments = await UserProgress.find()
      .populate('user', 'firstName lastName email')
      .populate('course', 'title instructor')
      .sort({ enrollmentDate: -1 })
      .limit(10);

    // Calculate overall attendance rate
    const totalAttendanceRecords = await Attendance.countDocuments();
    const presentRecords = await Attendance.countDocuments({
      status: { $in: ['present', 'late'] }
    });
    const overallAttendanceRate = totalAttendanceRecords > 0
      ? (presentRecords / totalAttendanceRecords) * 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        activeStudents,
        inactiveStudents: totalStudents - activeStudents,
        enrollmentStats: enrollmentStats[0] || {
          totalEnrollments: 0,
          completedCourses: 0,
          averageProgress: 0,
          totalTimeSpent: 0
        },
        attendanceBreakdown: attendanceStats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {}),
        overallAttendanceRate: Math.round(overallAttendanceRate * 100) / 100,
        recentEnrollments
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update student status
export const updateStudentStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const student = await User.findById(id);
    if (!student || student.role !== UserRole.STUDENT) {
      res.status(404).json({
        success: false,
        error: 'Student not found'
      });
      return;
    }

    student.isActive = isActive;
    await student.save();

    res.status(200).json({
      success: true,
      data: { student },
      message: `Student ${isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    next(error);
  }
};

// Bulk mark attendance
export const bulkMarkAttendance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, date, attendanceData } = req.body;
    const markedBy = req.user?.id;

    const results = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        const { studentId, status, notes } = record;

        // Find or create attendance record
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        let attendance = await Attendance.findOne({
          student: studentId,
          course: courseId,
          date: {
            $gte: attendanceDate,
            $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (attendance) {
          attendance.status = status;
          attendance.markedBy = markedBy;
          if (notes) attendance.notes = notes;
        } else {
          attendance = new Attendance({
            student: studentId,
            course: courseId,
            date: attendanceDate,
            status,
            markedBy,
            notes: notes || undefined
          });
        }

        await attendance.save();
        results.push({ studentId, status: 'success' });
      } catch (error) {
        errors.push({
          studentId: record.studentId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        successful: results.length,
        failed: errors.length,
        results,
        errors
      },
      message: `Bulk attendance marked: ${results.length} successful, ${errors.length} failed`
    });
  } catch (error) {
    next(error);
  }
};

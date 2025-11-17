import { Request, Response, NextFunction } from 'express';
import { Course, Enrollment, Assignment, AssignmentSubmission } from '../models';

// Get teacher's stats
export const getTeacherStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    
    if (!teacherId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Get teacher's courses
    const teacherCourses = await Course.find({ instructor: teacherId });
    const totalCourses = teacherCourses.length;
    const activeCourses = teacherCourses.filter(course => course.status === 'published').length;
    const pendingCourses = teacherCourses.filter(course => course.status === 'pending').length;
    const rejectedCourses = teacherCourses.filter(course => course.status === 'rejected').length;
    
    // Calculate student statistics
    let totalStudents = 0;
    let totalEnrollments = 0;
    
    for (const course of teacherCourses) {
      const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
      totalEnrollments += enrollmentCount;
      // Count unique students
      const uniqueStudents = await Enrollment.distinct('student', { course: course._id });
      totalStudents += uniqueStudents.length;
    }
    
    // Get teacher's homework assignments
    const teacherHomework = await Assignment.find({ instructor: teacherId });
    const totalHomework = teacherHomework.length;
    
    // Get homework submissions for the teacher's assignments
    const homeworkIds = teacherHomework.map(hw => hw._id);
    const homeworkSubmissions = await AssignmentSubmission.find({ 
      assignment: { $in: homeworkIds } 
    }).populate('student', 'firstName lastName email');
    
    // Calculate homework submission statistics
    const totalSubmissions = homeworkSubmissions.length;
    const gradedSubmissions = homeworkSubmissions.filter(sub => sub.status === 'graded');
    const averageGrade = gradedSubmissions.length > 0 
      ? gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) / gradedSubmissions.length
      : 0;
    
    // Get recent activity (recent enrollments)
    const recentEnrollments = await Enrollment.find({ 
      course: { $in: teacherCourses.map(course => course._id) }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('student', 'firstName lastName email')
    .populate('course', 'title');
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalCourses,
          activeCourses,
          pendingCourses,
          rejectedCourses,
          totalStudents,
          totalEnrollments,
          totalHomework,
          totalSubmissions,
          averageGrade: Math.round(averageGrade * 100) / 100, // Round to 2 decimal places
          recentEnrollments: recentEnrollments.map(enrollment => ({
            student: {
              _id: (enrollment.student as any)._id,
              firstName: (enrollment.student as any).firstName || '',
              lastName: (enrollment.student as any).lastName || '',
              email: (enrollment.student as any).email || ''
            },
            course: {
              _id: (enrollment.course as any)._id,
              title: (enrollment.course as any).title || ''
            },
            enrolledAt: enrollment.createdAt
          }))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher's students
export const getTeacherStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    
    if (!teacherId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Get teacher's courses
    const teacherCourses = await Course.find({ instructor: teacherId }).select('_id');
    const courseIds = teacherCourses.map(course => course._id);
    
    if (courseIds.length === 0) {
      res.status(200).json({
        success: true,
        data: {
          students: [],
          totalStudents: 0,
          courses: []
        }
      });
      return;
    }
    
    // Get enrollments for teacher's courses
    const enrollments = await Enrollment.find({ 
      course: { $in: courseIds }
    }).populate('student', 'firstName lastName email profilePicture')
      .populate('course', 'title');
    
    // Get unique students
    const studentMap = new Map();
    const courseMap = new Map();
    
    enrollments.forEach(enrollment => {
      // Add student to map
      if (!studentMap.has((enrollment.student as any)._id.toString())) {
        studentMap.set((enrollment.student as any)._id.toString(), {
          _id: (enrollment.student as any)._id,
          firstName: (enrollment.student as any).firstName || '',
          lastName: (enrollment.student as any).lastName || '',
          email: (enrollment.student as any).email || '',
          profilePicture: (enrollment.student as any).profilePicture || '',
          courses: [],
          totalEnrollments: 0
        });
      }
      
      // Update student data
      const student = studentMap.get((enrollment.student as any)._id.toString());
      student.courses.push({
        _id: (enrollment.course as any)._id,
        title: (enrollment.course as any).title || ''
      });
      student.totalEnrollments += 1;
      
      // Add course to map
      if (!courseMap.has((enrollment.course as any)._id.toString())) {
        courseMap.set((enrollment.course as any)._id.toString(), {
          _id: (enrollment.course as any)._id,
          title: (enrollment.course as any).title || '',
          studentCount: 0
        });
      }
      
      // Update course data
      const course = courseMap.get((enrollment.course as any)._id.toString());
      course.studentCount += 1;
    });
    
    const students = Array.from(studentMap.values());
    const courses = Array.from(courseMap.values());
    
    res.status(200).json({
      success: true,
      data: {
        students,
        totalStudents: students.length,
        courses
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher's homework assignments
export const getTeacherHomework = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    
    if (!teacherId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Get teacher's homework assignments
    const teacherHomework = await Assignment.find({ instructor: teacherId })
      .select('title description level language dueDate maxPoints status createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        homework: teacherHomework,
        totalHomework: teacherHomework.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get teacher's homework submissions
export const getTeacherSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const teacherId = req.user?._id;
    
    if (!teacherId) {
      res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
      return;
    }

    // Get teacher's homework assignments
    const teacherHomework = await Assignment.find({ instructor: teacherId });
    const homeworkIds = teacherHomework.map(hw => hw._id);
    
    // Get all submissions for the teacher's assignments
    const submissions = await AssignmentSubmission.find({ 
      assignment: { $in: homeworkIds } 
    })
    .populate('assignment', 'title')
    .populate('student', 'firstName lastName email')
    .sort({ submittedAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        submissions: submissions.map(sub => ({
          _id: sub._id,
          assignment: {
            _id: (sub.assignment as any)._id,
            title: (sub.assignment as any).title || ''
          },
          student: {
            _id: (sub.student as any)._id,
            firstName: (sub.student as any).firstName || '',
            lastName: (sub.student as any).lastName || '',
            email: (sub.student as any).email || ''
          },
          submittedAt: sub.submittedAt,
          status: sub.status,
          grade: sub.grade,
          isLate: sub.isLate
        })),
        totalSubmissions: submissions.length
      }
    });
  } catch (error) {
    next(error);
  }
};
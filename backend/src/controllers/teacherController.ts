import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Course } from '../models/Course';
import { Enrollment } from '../models/Enrollment';
import { CourseStatus } from '../../../shared/types';

// Get teacher statistics
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
    
    // Calculate statistics
    const totalCourses = teacherCourses.length;
    const activeCourses = teacherCourses.filter(course => course.status === CourseStatus.APPROVED).length;
    const pendingCourses = teacherCourses.filter(course => course.status === CourseStatus.PENDING).length;
    const rejectedCourses = teacherCourses.filter(course => course.status === CourseStatus.REJECTED).length;
    
    // Calculate total students from enrollments
    let totalStudents = 0;
    let totalEnrollments = 0;
    
    for (const course of teacherCourses) {
      const enrollmentCount = await Enrollment.countDocuments({ course: course._id });
      totalEnrollments += enrollmentCount;
      // Count unique students
      const uniqueStudents = await Enrollment.distinct('student', { course: course._id });
      totalStudents += uniqueStudents.length;
    }
    
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
          recentEnrollments: recentEnrollments.map(enrollment => ({
            student: {
              _id: enrollment.student._id,
              firstName: enrollment.student.firstName,
              lastName: enrollment.student.lastName,
              email: enrollment.student.email
            },
            course: {
              _id: enrollment.course._id,
              title: enrollment.course.title
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
      if (!studentMap.has(enrollment.student._id.toString())) {
        studentMap.set(enrollment.student._id.toString(), {
          _id: enrollment.student._id,
          firstName: enrollment.student.firstName,
          lastName: enrollment.student.lastName,
          email: enrollment.student.email,
          profilePicture: enrollment.student.profilePicture,
          courses: [],
          totalEnrollments: 0
        });
      }
      
      // Update student data
      const student = studentMap.get(enrollment.student._id.toString());
      student.courses.push({
        _id: enrollment.course._id,
        title: enrollment.course.title
      });
      student.totalEnrollments += 1;
      
      // Add course to map
      if (!courseMap.has(enrollment.course._id.toString())) {
        courseMap.set(enrollment.course._id.toString(), {
          _id: enrollment.course._id,
          title: enrollment.course.title,
          studentCount: 0
        });
      }
      
      // Update course data
      const course = courseMap.get(enrollment.course._id.toString());
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
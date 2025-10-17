import { Request, Response, NextFunction } from 'express';
import { Course } from '../models/Course';
import { UserRole } from '../../../shared/types';

/**
 * Middleware to check if user can access/modify a course
 * Allows course instructors and admins to access their courses
 */
export const requireCourseAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;
    
    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is admin or the course instructor
    const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;
    const isInstructor = course.instructor.toString() === req.user._id.toString();

    if (!isAdmin && !isInstructor) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own courses.'
      });
      return;
    }

    // Add course to request for use in controllers
    req.course = course;
    next();
  } catch (error) {
    console.error('Error in requireCourseAccess middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while checking course access'
    });
  }
};

/**
 * Middleware to check if user can modify a course
 * Allows course instructors and admins to modify courses
 */
export const requireCourseModification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const { id } = req.params;
    
    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      res.status(404).json({
        success: false,
        error: 'Course not found'
      });
      return;
    }

    // Check if user is admin or the course instructor
    const isAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPER_ADMIN;
    const isInstructor = course.instructor.toString() === req.user._id.toString();

    if (!isAdmin && !isInstructor) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only modify your own courses.'
      });
      return;
    }

    // Add course to request for use in controllers
    req.course = course;
    next();
  } catch (error) {
    console.error('Error in requireCourseModification middleware:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error while checking course modification access'
    });
  }
};

import { Request, Response, NextFunction } from 'express';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        id: string;
        email: string;
        role: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

// Role-based authorization middleware
export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Check if user is authenticated (should be done by auth middleware first)
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Access denied. Please log in to continue.'
        });
        return;
      }

      // Check if user's role is in the allowed roles
      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`
        });
        return;
      }

      // User has the required role, proceed to next middleware
      next();
    } catch (error) {
      console.error('Role authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during role authorization'
      });
    }
  };
};

// Specific role authorization functions for convenience
export const requireAdmin = authorizeRoles(['admin', 'super_admin']);
export const requireTeacher = authorizeRoles(['teacher', 'admin', 'super_admin']);
export const requireStudent = authorizeRoles(['student', 'job_seeker', 'professional', 'teacher', 'admin', 'super_admin']);

// Check if user owns the resource or has admin/teacher privileges
export const authorizeOwnerOrRole = (allowedRoles: string[] = ['admin', 'teacher', 'super_admin']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Access denied. Please log in to continue.'
        });
        return;
      }

      // Get the resource owner ID from request params or body
      const resourceOwnerId = req.params.userId || req.body.userId || req.params.id;
      
      // Allow if user is the owner of the resource (check both _id and id for compatibility)
      if (resourceOwnerId && (req.user._id === resourceOwnerId || req.user.id === resourceOwnerId)) {
        next();
        return;
      }

      // Allow if user has one of the allowed roles
      if (allowedRoles.includes(req.user.role)) {
        next();
        return;
      }

      // Deny access
      res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources or need higher privileges.'
      });
    } catch (error) {
      console.error('Owner/Role authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error during authorization'
      });
    }
  };
};

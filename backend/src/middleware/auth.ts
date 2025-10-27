import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUserDocument } from '../models/User';
import { ITeacherProfileDocument } from '../models/TeacherProfile';
import { UserRole } from '../types';

// Extend Request interface to include user and teacherProfile
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
      teacherProfile?: ITeacherProfileDocument;
    }
  }
}

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

// Extended Request interface for authenticated routes
export interface AuthRequest extends Request {
  user?: IUserDocument;
  teacherProfile?: ITeacherProfileDocument;
}

// Protect routes - require authentication
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // Get user from token
      const user = await User.findById(decoded.userId);

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'No user found with this token'
        });
        return;
      }

      // Check if user is active
      if (!user.isActive) {
        res.status(401).json({
          success: false,
          error: 'User account is deactivated'
        });
        return;
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
      return;
    }
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`
      });
      return;
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If no token, continue without user
    if (!token) {
      next();
      return;
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      // Get user from token
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.log('Invalid token in optional auth:', error);
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user owns the resource or is admin
export const checkOwnership = (resourceUserField: string = 'user') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
      return;
    }

    // Admin can access everything
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    // Check if user owns the resource
    const resourceUserId = req.params[resourceUserField] || req.body[resourceUserField];
    
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      res.status(403).json({
        success: false,
        error: 'Not authorized to access this resource'
      });
      return;
    }

    next();
  };
};

// Verify email required for certain actions
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
    return;
  }

  if (!req.user.isEmailVerified) {
    res.status(403).json({
      success: false,
      error: 'Email verification required to access this resource'
    });
    return;
  }

  next();
};

// Alias for protect (for backward compatibility)
export const auth = protect;

// Alias for authorize (for backward compatibility)
export const requireRole = authorize;

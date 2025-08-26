import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUserDocument } from '../models/User';
import { UserRole } from '../types';
import { sendEmail, sendWelcomeEmail } from '../services/emailService';
import * as simpleEmailService from '../services/simpleEmailService';

// Generate JWT token
const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
};

// Send token response
const sendTokenResponse = (user: IUserDocument, statusCode: number, res: Response): void => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Update last login
  user.lastLogin = new Date();
  user.save();

  res.status(statusCode).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token,
      refreshToken
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName, role, platform } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({
        success: false,
        error: 'Missing Required Information',
        message: 'Please fill in all required fields: email, password, first name, and last name.',
        details: {
          type: 'MISSING_REQUIRED_FIELDS',
          suggestion: 'Make sure all fields are completed before submitting'
        }
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Password Too Short',
        message: 'Your password must be at least 8 characters long for security purposes.',
        details: {
          type: 'WEAK_PASSWORD',
          suggestion: 'Use a combination of letters, numbers, and special characters for a strong password'
        }
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Account Already Exists',
        message: 'An account with this email address already exists. Please use a different email or sign in to your existing account.',
        details: {
          type: 'DUPLICATE_EMAIL',
          suggestion: 'Try signing in instead, or use the "Forgot Password" feature if you can\'t remember your password'
        }
      });
      return;
    }

    // Validate role (only allow student registration by default, admin can create other roles)
    const userRole = role && Object.values(UserRole).includes(role) ? role : UserRole.STUDENT;

    // Create user with email auto-verified
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: userRole,
      isEmailVerified: true // Auto-verify email
    });

    // Detect platform from request headers, body, or referrer
    const detectPlatform = (): 'homepage' | 'job-portal' | 'elearning' => {
      if (platform && ['homepage', 'job-portal', 'elearning'].includes(platform)) {
        return platform;
      }
      
      // Check referrer header to detect platform
      const referrer = req.get('Referer') || req.get('Origin') || '';
      
      if (referrer.includes(':3001') || referrer.includes('job-portal')) {
        return 'job-portal';
      } else if (referrer.includes(':3002') || referrer.includes('elearning')) {
        return 'elearning';
      } else if (referrer.includes(':3000') || referrer.includes('homepage')) {
        return 'homepage';
      }
      
      // Default based on role
      if (userRole === UserRole.PROFESSIONAL || userRole === UserRole.EMPLOYER) {
        return 'job-portal';
      } else if (userRole === UserRole.STUDENT || userRole === UserRole.TEACHER) {
        return 'elearning';
      }
      
      return 'homepage';
    };

    // Send enhanced welcome email
    try {
      const detectedPlatform = detectPlatform();
      
      // Send enhanced HTML welcome email
      await sendWelcomeEmail({
        email: user.email,
        firstName: user.firstName,
        platform: detectedPlatform
      });
      
      console.log(`✅ Enhanced welcome email sent to ${user.email} for ${detectedPlatform} platform`);
      
      // Also send console welcome email as fallback
      await simpleEmailService.sendWelcomeEmail(
        user.email,
        user.firstName,
        userRole
      );
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide email and password'
      });
      return;
    }

    // Check for user and include password
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Login Failed',
        message: 'We couldn\'t find an account with that email address. Please check your email and try again, or create a new account if you haven\'t registered yet.',
        details: {
          type: 'EMAIL_NOT_FOUND',
          suggestion: 'Double-check your email address or register for a new account'
        }
      });
      return;
    }

    // Check if account is active
    if (!user.isActive) {
      res.status(401).json({
        success: false,
        error: 'Account Suspended',
        message: 'Your account has been temporarily deactivated. This could be due to security reasons or administrative action.',
        details: {
          type: 'ACCOUNT_INACTIVE',
          suggestion: 'Please contact our support team for assistance in reactivating your account'
        }
      });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      res.status(401).json({
        success: false,
        error: 'Invalid Credentials',
        message: 'The password you entered is incorrect. Please check your password and try again.',
        details: {
          type: 'INVALID_PASSWORD',
          suggestion: 'Make sure Caps Lock is off and try typing your password again. If you\'ve forgotten your password, use the "Forgot Password" option.'
        }
      });
      return;
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user as IUserDocument;

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // In a more sophisticated setup, you might want to blacklist the token
    // For now, we'll just send a success response
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};



// @desc    Test email service
// @route   POST /api/auth/test-email
// @access  Public (for testing only)
export const testEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    // Send test email using simple email service
    try {
      const testCode = simpleEmailService.generateVerificationCode();
      await simpleEmailService.sendVerificationEmail(
        email,
        'Test User',
        testCode
      );

      res.status(200).json({
        success: true,
        message: 'Test email sent successfully! Check console for verification details.'
      });
    } catch (emailError) {
      console.error('Failed to send test email:', emailError);
      res.status(500).json({
        success: false,
        error: 'Failed to send test email'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        success: false,
        error: 'Email is required'
      });
      return;
    }

    const user = await User.findByEmail(email);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'No user found with this email address'
      });
      return;
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email using simple email service (console logging for development)
    try {
      // Use simple email service for console logging (development mode)
      await simpleEmailService.sendPasswordResetEmail(
        user.email,
        user.firstName,
        resetToken
      );

      // Always send a proper JSON response - frontend will handle actual email sending via EmailJS
      const responseData = {
        success: true,
        message: 'Password reset instructions have been sent',
        data: {
          email: user.email,
          firstName: user.firstName,
          resetToken: resetToken
        }
      };

      res.status(200).json(responseData);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);

      // Clear reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      // Send proper error JSON response
      res.status(500).json({
        success: false,
        error: 'Failed to process password reset request',
        message: 'Unable to send password reset email. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long'
      });
      return;
    }

    // Hash the token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching token that hasn't expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token',
        message: 'The password reset token is invalid or has expired. Please request a new password reset.'
      });
      return;
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth authentication
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userInfo, credential, accessToken } = req.body;

    if (!userInfo && !credential) {
      res.status(400).json({
        success: false,
        error: 'User information or credential is required'
      });
      return;
    }

    let userData;
    
    // Handle different types of Google auth data
    if (userInfo) {
      userData = userInfo;
    } else if (credential) {
      // Parse JWT credential if provided
      try {
        const base64Url = credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        userData = JSON.parse(jsonPayload);
      } catch (error) {
        res.status(400).json({
          success: false,
          error: 'Invalid credential format'
        });
        return;
      }
    }

    if (!userData || !userData.email) {
      res.status(400).json({
        success: false,
        error: 'Invalid user data received from Google'
      });
      return;
    }

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: userData.email },
        { googleId: userData.sub || userData.id }
      ]
    });

    if (user) {
      // User exists - check if registration is completed
      if (!user.registrationCompleted) {
        // User needs to complete role selection
        res.status(200).json({
          success: true,
          data: {
            requiresRoleSelection: true,
            googleUserData: {
              email: userData.email,
              firstName: userData.given_name || userData.name?.split(' ')[0] || 'Google',
              lastName: userData.family_name || userData.name?.split(' ').slice(1).join(' ') || 'User',
              googleId: userData.sub || userData.id,
              profilePicture: userData.picture,
              provider: 'google',
              isEmailVerified: userData.email_verified || true
            }
          }
        });
        return;
      }

      // User exists and registration is complete - log them in
      sendTokenResponse(user, 200, res);
    } else {
      // New user - needs role selection
      res.status(200).json({
        success: true,
        data: {
          requiresRoleSelection: true,
          googleUserData: {
            email: userData.email,
            firstName: userData.given_name || userData.name?.split(' ')[0] || 'Google',
            lastName: userData.family_name || userData.name?.split(' ').slice(1).join(' ') || 'User',
            googleId: userData.sub || userData.id,
            profilePicture: userData.picture,
            provider: 'google',
            isEmailVerified: userData.email_verified || true
          }
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Complete Google OAuth registration
// @route   POST /api/auth/google/complete-registration
// @access  Public
export const googleCompleteRegistration = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { 
      email, 
      firstName, 
      lastName, 
      role, 
      googleId, 
      profilePicture, 
      provider = 'google',
      isEmailVerified = true,
      platform 
    } = req.body;

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: email },
        { googleId: googleId }
      ]
    });

    if (user) {
      // Update existing user with role and complete registration
      user.role = role;
      user.registrationCompleted = true;
      user.isEmailVerified = isEmailVerified;
      if (profilePicture) {
        user.avatar = profilePicture;
      }
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        email,
        firstName,
        lastName,
        role,
        googleId,
        provider,
        avatar: profilePicture,
        isEmailVerified,
        registrationCompleted: true,
        // No password required for Google OAuth users
      });
    }

    // Detect platform and send welcome email for new registrations
    const detectPlatform = (): 'homepage' | 'job-portal' | 'elearning' => {
      if (platform && ['homepage', 'job-portal', 'elearning'].includes(platform)) {
        return platform;
      }
      
      // Check referrer header to detect platform
      const referrer = req.get('Referer') || req.get('Origin') || '';
      
      if (referrer.includes(':3001') || referrer.includes('job-portal')) {
        return 'job-portal';
      } else if (referrer.includes(':3002') || referrer.includes('elearning')) {
        return 'elearning';
      } else if (referrer.includes(':3000') || referrer.includes('homepage')) {
        return 'homepage';
      }
      
      // Default based on role
      if (role === UserRole.PROFESSIONAL || role === UserRole.EMPLOYER) {
        return 'job-portal';
      } else if (role === UserRole.STUDENT || role === UserRole.TEACHER) {
        return 'elearning';
      }
      
      return 'homepage';
    };

    // Send welcome email for new Google OAuth users
    try {
      const detectedPlatform = detectPlatform();
      
      // Send enhanced HTML welcome email
      await sendWelcomeEmail({
        email: user.email,
        firstName: user.firstName,
        platform: detectedPlatform
      });
      
      console.log(`✅ Enhanced welcome email sent to ${user.email} for ${detectedPlatform} platform (Google OAuth)`);
      
      // Also send console welcome email as fallback
      await simpleEmailService.sendWelcomeEmail(
        user.email,
        user.firstName,
        role
      );
    } catch (emailError) {
      console.error('Failed to send welcome email for Google OAuth user:', emailError);
      // Don't fail registration if email fails
    }

    // Send token response
    sendTokenResponse(user, 201, res);
  } catch (error: any) {
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const message = `User with this ${field} already exists`;
      res.status(400).json({
        success: false,
        error: message
      });
      return;
    }
    next(error);
  }
};

// @desc    Update user profile
// @route   POST /api/auth/update-profile
// @access  Private
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData.isEmailVerified;
    delete updateData.isActive;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          // Include any additional profile fields
          ...updateData
        }
      }
    });
  } catch (error: any) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const message = `User with this ${field} already exists`;
      res.status(400).json({
        success: false,
        error: message
      });
      return;
    }
    next(error);
  }
};

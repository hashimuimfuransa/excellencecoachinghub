import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUserDocument } from '../models/User';
import { UserRole } from '../types';
import { sendEmail, sendWelcomeEmail, sendEmployerWelcomeEmail } from '../services/emailService';
import * as simpleEmailService from '../services/simpleEmailService';
import { OAuth2Client } from 'google-auth-library';

// Generate JWT token
const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ userId }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  } as jwt.SignOptions);
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }
  return jwt.sign({ userId }, jwtRefreshSecret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  } as jwt.SignOptions);
};

// Send token response
const sendTokenResponse = async (user: IUserDocument, statusCode: number, res: Response): Promise<void> => {
  try {
    const token = generateToken((user as any)._id.toString());
    const refreshToken = generateRefreshToken((user as any)._id.toString());

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.status(statusCode).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName || '',
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          level: (user as any).level,
          language: (user as any).language
        },
        token,
        refreshToken
      }
    });
  } catch (error: any) {
    console.error('❌ Error in sendTokenResponse:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authentication tokens'
    });
  }
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, password, firstName, lastName, name, role, platform } = req.body;

    // Parse name into firstName and lastName if they are missing
    let finalFirstName = firstName;
    let finalLastName = lastName;

    if ((!finalFirstName || !finalLastName) && name) {
      const nameParts = name.trim().split(' ');
      finalFirstName = finalFirstName || nameParts[0] || '';
      finalLastName = finalLastName || nameParts.slice(1).join(' ') || '';
    }

    // Validate required fields
    if (!identifier || !password || (!finalFirstName && !name)) {
      res.status(400).json({
        success: false,
        error: 'Missing Required Information',
        message: 'Please fill in all required fields: email or phone number, password, and name or first name.',
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

    // Check if user already exists by email or phone
    let existingUser;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(identifier)) {
      // It's an email
      existingUser = await User.findByEmail(identifier);
    } else {
      // It's a phone number
      existingUser = await User.findOne({ phone: identifier });
    }
    
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'Account Already Exists',
        message: 'An account with this email or phone number already exists. Please use a different identifier or sign in to your existing account.',
        details: {
          type: 'DUPLICATE_IDENTIFIER',
          suggestion: 'Try signing in instead, or use the "Forgot Password" feature if you can\'t remember your password'
        }
      });
      return;
    }

    // Validate role (only allow student registration by default, admin can create other roles)
    const userRole = role && Object.values(UserRole).includes(role) ? role : UserRole.STUDENT;

    // Create user with email or phone
    const userData: any = {
      password,
      firstName: finalFirstName,
      lastName: finalLastName,
      role: userRole,
      isEmailVerified: true // Auto-verify email
    };

    // Set email or phone based on identifier type
    if (emailRegex.test(identifier)) {
      userData.email = identifier.toLowerCase();
    } else {
      userData.phone = identifier;
    }

    const user = await User.create(userData);

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
      
      // Send role-specific welcome email
      if (userRole === UserRole.EMPLOYER) {
        // Send employer-specific welcome email using template_o0k3j0q
        await sendEmployerWelcomeEmail({
          email: user.email,
          firstName: user.firstName,
          platform: detectedPlatform
        });
        console.log(`✅ Employer welcome email sent to ${user.email} for ${detectedPlatform} platform using template_o0k3j0q`);
      } else if (user.email) {
        // Send regular welcome email for other roles (only if email exists)
        await sendWelcomeEmail({
          email: user.email,
          firstName: user.firstName,
          platform: detectedPlatform
        });
        console.log(`✅ Standard welcome email sent to ${user.email} for ${detectedPlatform} platform`);
      }
      
      // Also send console welcome email as fallback (only if email exists)
      if (user.email) {
        await simpleEmailService.sendWelcomeEmail(
          user.email,
          user.firstName,
          userRole
        );
      }
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail registration if email fails
    }

    await sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    // Validate identifier and password
    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        error: 'Please provide email or phone number and password'
      });
      return;
    }

    // Check for user by email or phone
    let user;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(identifier)) {
      // It's an email
      user = await User.findOne({ email: identifier.toLowerCase() }).select('+password');
    } else {
      // It's a phone number
      user = await User.findOne({ phone: identifier }).select('+password');
    }
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Login Failed',
        message: 'We couldn\'t find an account with that email or phone number. Please check your credentials and try again, or create a new account if you haven\'t registered yet.',
        details: {
          type: 'IDENTIFIER_NOT_FOUND',
          suggestion: 'Double-check your email or phone number or register for a new account'
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

    await sendTokenResponse(user, 200, res);
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
          lastName: user.lastName || '',
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          level: (user as any).level,
          language: (user as any).language
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
    const { email, identifier } = req.body;
    const searchIdentifier = identifier || email;

    if (!searchIdentifier) {
      res.status(400).json({
        success: false,
        error: 'Email or phone number is required'
      });
      return;
    }

    // Find user by email or phone number
    let user;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(searchIdentifier)) {
      // It's an email
      user = await User.findByEmail(searchIdentifier);
    } else {
      // It's a phone number
      user = await User.findOne({ phone: searchIdentifier });
    }

    if (!user) {
      // Don't reveal whether user exists or not for security reasons
      res.status(200).json({
        success: true,
        message: 'If an account exists with that email or phone number, you will receive password reset instructions.'
      });
      return;
    }

    // Generate reset token and expiration
    const resetToken = user.generatePasswordResetToken();
    const resetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Set reset token and expiration
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(resetExpires);
    
    await user.save({ validateBeforeSave: false });
    
    // Send reset email using simple email service (console logging for development)
    try {
      if (user.email) {
        await simpleEmailService.sendPasswordResetEmail(
          user.email,
          user.firstName,
          resetToken
        );
      }
      
      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully! Check console for reset token details.'
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Even if email fails, we still want to show success to prevent user enumeration
      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully! Check console for reset token details.'
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
    delete user.passwordResetToken;
    delete user.passwordResetExpires;

    // Reset login attempts
    user.loginAttempts = 0;
    delete user.lockUntil;

    await user.save();

    await sendTokenResponse(user, 200, res);
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
        // Complete registration with default role
        user.role = UserRole.STUDENT;
        user.registrationCompleted = true;
        user.avatar = userData.picture || user.avatar;
        await user.save();
      }

      // User exists and registration is complete - log them in
      await sendTokenResponse(user, 200, res);
    } else {
      // New user - create with default role
      const newUser = await User.create({
        email: userData.email,
        firstName: userData.given_name || userData.name?.split(' ')[0] || 'Google',
        lastName: userData.family_name || userData.name?.split(' ').slice(1).join(' ') || 'User',
        googleId: userData.sub || userData.id,
        provider: 'google',
        role: UserRole.STUDENT, // Default role
        isEmailVerified: userData.email_verified || true,
        avatar: userData.picture,
        registrationCompleted: true
      });

      await sendTokenResponse(newUser, 201, res);
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
    console.log('🔍 Google Complete Registration - Request body:', req.body);
    console.log('🔍 Google Complete Registration - Request headers:', req.headers);
    
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

    console.log('🔍 Google Complete Registration - Extracted data:', {
      email,
      firstName,
      lastName,
      role,
      googleId,
      profilePicture,
      provider,
      isEmailVerified,
      platform
    });

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
        registrationCompleted: true
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
      
      // Send role-specific welcome email
      if (role === UserRole.EMPLOYER) {
        // Send employer-specific welcome email using template_o0k3j0q
        await sendEmployerWelcomeEmail({
          email: user.email,
          firstName: user.firstName,
          platform: detectedPlatform
        });
        console.log(`✅ Employer welcome email sent to ${user.email} for ${detectedPlatform} platform (Google OAuth) using template_o0k3j0q`);
      } else {
        // Send regular welcome email for other roles
        await sendWelcomeEmail({
          email: user.email,
          firstName: user.firstName,
          platform: detectedPlatform
        });
        console.log(`✅ Standard welcome email sent to ${user.email} for ${detectedPlatform} platform (Google OAuth)`);
      }
      
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
    await sendTokenResponse(user, 201, res);
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
          level: user.level,
          language: user.language,
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

// @desc    Google OAuth callback handler
// @route   POST /api/auth/google/callback
// @access  Public
// @desc    Google OAuth ID token validation (improved method)
// @route   POST /api/auth/google/exchange-code
// @access  Public
export const googleExchangeCode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  console.log('🚀 START: Google Exchange Code endpoint called');
  console.log('📝 Request body keys:', Object.keys(req.body));
  console.log('📝 Request headers:', req.headers);
  
  try {
    const { idToken, platform } = req.body;

    if (!idToken) {
      console.log('❌ No ID token provided');
      res.status(400).json({
        success: false,
        error: 'Google ID token is required'
      });
      return;
    }

    console.log('🔄 Validating Google ID token...');
    console.log('🔧 Google Client ID:', process.env.GOOGLE_CLIENT_ID ? `${process.env.GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'Missing');
    console.log('📝 Token length:', idToken?.length || 0);
    console.log('📝 Platform:', platform);
    
    // Decode token header to check issuer (for debugging)
    try {
      const tokenParts = idToken.split('.');
      if (tokenParts.length >= 2) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('🔍 Token audience from payload:', payload.aud);
        console.log('🔍 Token issuer:', payload.iss);
        console.log('🔍 Token expiry:', new Date(payload.exp * 1000));
      }
    } catch (decodeError) {
      console.log('⚠️ Could not decode token for debugging');
    }

    // Validate environment variables
    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error('❌ Missing Google Client ID');
      res.status(500).json({
        success: false,
        error: 'Google OAuth not properly configured'
      });
      return;
    }

    // Initialize Google OAuth2 client
    console.log('🔧 Initializing OAuth2Client...');
    let client;
    try {
      client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      console.log('✅ OAuth2Client initialized successfully');
    } catch (clientError: any) {
      console.error('❌ Failed to initialize OAuth2Client:', clientError);
      throw new Error(`OAuth2Client initialization failed: ${clientError.message}`);
    }

    // Verify the ID token with Google using official library
    console.log('🔍 Starting token verification...');
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: [process.env.GOOGLE_CLIENT_ID],  // Accept our client ID as valid audience
      });
      
      payload = ticket.getPayload();
      if (!payload) {
        console.error('❌ ID token verification failed - no payload');
        res.status(400).json({
          success: false,
          error: 'Invalid Google ID token'
        });
        return;
      }
    } catch (verifyError: any) {
      console.error('❌ ID token verification failed:', verifyError.message);
      console.error('🔍 Full error details:', verifyError);
      
      let errorMessage = 'Invalid Google ID token';
      if (verifyError.message && verifyError.message.includes('audience')) {
        errorMessage = 'Invalid token audience - Client ID mismatch';
        console.error('🔧 Expected audience (Client ID):', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
      }
      
      res.status(400).json({
        success: false,
        error: errorMessage
      });
      return;
    }

    console.log('✅ ID token verified successfully');
    console.log('📧 User email:', payload.email);

    if (!payload.email) {
      console.error('❌ No email in ID token');
      res.status(400).json({
        success: false,
        error: 'No email found in token'
      });
      return;
    }

    console.log('✅ Google ID token validated successfully:', payload.email);

    // Use the same logic as the existing googleAuth function
    const email = payload.email;
    console.log('🔍 Searching for user with email:', email);
    
    let user;
    try {
      user = await User.findOne({ email });
      console.log('🔍 Database query result:', user ? 'User found' : 'User not found');
    } catch (dbError: any) {
      console.error('❌ Database query error:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (user) {
      // Existing user - log them in
      console.log('✅ Existing user found, logging in');
      console.log('🔍 User details:', {
        id: user._id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      });
      await sendTokenResponse(user, 200, res);
    } else {
      // New user - require role selection
      console.log('🆕 New user detected, requiring role selection');
      res.status(200).json({
        success: true,
        data: {
          requiresRoleSelection: true,
          googleUserData: {
            email: payload.email,
            firstName: payload.given_name || '',
            lastName: payload.family_name || '',
            googleId: payload.sub,
            profilePicture: payload.picture || '',
            verified: payload.email_verified || false,
            platform: platform || 'job-portal'
          }
        }
      });
    }
  } catch (error: any) {
    console.error('❌ CRITICAL ERROR in Google Exchange Code:', error);
    console.error('🔍 Error name:', error.name);
    console.error('🔍 Error message:', error.message);
    console.error('🔍 Error stack:', error.stack);
    console.error('🔍 Error code:', error.code);
    console.error('🔍 Full error object:', JSON.stringify(error, null, 2));
    
    // Provide specific error messages based on error type
    let errorMessage = 'Failed to validate Google ID token';
    let statusCode = 500;
    
    if (error.message) {
      if (error.message.includes('Token used too early') || error.message.includes('Token used too late')) {
        errorMessage = 'Google token has expired or is not yet valid. Please try signing in again.';
        statusCode = 400;
      } else if (error.message.includes('audience')) {
        errorMessage = 'Invalid token audience. Please check your Google OAuth configuration.';
        statusCode = 400;
      } else if (error.message.includes('issuer')) {
        errorMessage = 'Invalid token issuer. Token was not issued by Google.';
        statusCode = 400;
      } else if (error.message.includes('signature')) {
        errorMessage = 'Invalid token signature. Please try signing in again.';
        statusCode = 400;
      } else if (error.message.includes('format')) {
        errorMessage = 'Invalid token format. Please try signing in again.';
        statusCode = 400;
      } else if (error.name === 'MongoError' || error.name === 'ValidationError') {
        errorMessage = 'Database error occurred during authentication. Please try again.';
        statusCode = 500;
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage
    });
  }
};



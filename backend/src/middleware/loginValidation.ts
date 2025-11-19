import { Request, Response, NextFunction } from 'express';

// Custom middleware for login validation
export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { identifier, email, password } = req.body;
  const loginIdentifier = identifier || email;

  // Validate identifier and password
  if (!loginIdentifier || !password) {
    res.status(400).json({
      success: false,
      error: 'Missing Required Fields',
      message: 'Please provide both email/phone number and password',
      details: {
        type: 'MISSING_FIELDS',
        fields: {
          identifier: identifier ? 'provided' : 'missing',
          email: email ? 'provided' : 'missing',
          password: password ? 'provided' : 'missing'
        },
        suggestion: 'Make sure both email/phone and password fields are filled in'
      }
    });
    return;
  }

  // Validate identifier format (email or phone)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  
  if (!emailRegex.test(loginIdentifier) && !phoneRegex.test(loginIdentifier)) {
    res.status(400).json({
      success: false,
      error: 'Invalid Identifier Format',
      message: 'Please provide a valid email or phone number',
      details: {
        type: 'INVALID_IDENTIFIER',
        received: loginIdentifier,
        suggestion: 'Enter a valid email address (e.g., user@example.com) or phone number (e.g., +1234567890)'
      }
    });
    return;
  }

  next();
};
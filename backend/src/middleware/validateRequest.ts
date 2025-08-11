import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

// Middleware to handle validation errors
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    console.log('❌ Validation failed for request:', {
      url: req.url,
      method: req.method,
      body: req.body,
      errors: errorMessages
    });

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
    return;
  }
  
  next();
};

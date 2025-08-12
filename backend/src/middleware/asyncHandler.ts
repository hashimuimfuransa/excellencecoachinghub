import { Request, Response, NextFunction } from 'express';

// Async error handler wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('❌ Async handler caught error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    next(error);
  });
};

// Global async error catcher middleware
export const globalAsyncErrorCatcher = (req: Request, res: Response, next: NextFunction) => {
  // Wrap the next function to catch any async errors
  const originalNext = next;
  
  next = (error?: any) => {
    if (error) {
      console.error('❌ Global async error caught:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    }
    originalNext(error);
  };
  
  next();
};

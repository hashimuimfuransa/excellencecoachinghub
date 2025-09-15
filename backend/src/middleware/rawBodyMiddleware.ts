import { Request, Response, NextFunction } from 'express';
import getRawBody from 'raw-body';

/**
 * Raw body middleware for webhook signature verification
 * This middleware captures the raw request body before it's parsed by express.json()
 * Required for verifying webhook signatures from SendGrid
 */

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export const rawBodyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only capture raw body for SendGrid webhook endpoints
  if (!req.path.includes('/sendgrid/events')) {
    return next();
  }

  getRawBody(req, {
    length: req.headers['content-length'],
    limit: '1mb',
    encoding: 'utf8'
  })
  .then((rawBody: Buffer) => {
    req.rawBody = rawBody;
    next();
  })
  .catch((err: Error) => {
    console.error('❌ Error capturing raw body:', err);
    next(err);
  });
};

export default rawBodyMiddleware;
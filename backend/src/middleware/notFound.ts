import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  // List of static file extensions that should be handled silently
  const staticFileExtensions = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.css', '.js', '.map', '.json'];
  const isStaticFile = staticFileExtensions.some(ext => req.originalUrl.toLowerCase().endsWith(ext));

  // Common static files that browsers request automatically
  const commonStaticFiles = ['/favicon.ico', '/robots.txt', '/sitemap.xml'];
  const isCommonStaticFile = commonStaticFiles.includes(req.originalUrl.toLowerCase());

  // Handle webpack HMR (Hot Module Replacement) files
  const isHMRFile = req.originalUrl.includes('.hot-update.') || req.originalUrl.includes('webpack');
  const isWebpackAsset = req.originalUrl.startsWith('/static/') || req.originalUrl.startsWith('/assets/');
  const isDevelopmentAsset = isHMRFile || isWebpackAsset;

  if (isStaticFile || isCommonStaticFile || isDevelopmentAsset) {
    // For static files, just return 404 without logging as error
    res.status(404).json({
      success: false,
      error: 'File not found'
    });
    return;
  }

  // For API routes and other requests, create an error to be handled by error middleware
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

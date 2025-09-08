// Migration: This file now exports the optimized job scraping service
// All functionality has been moved to OptimizedJobScrapingService with improvements

export { OptimizedJobScrapingService as JobScrapingService } from './optimizedJobScrapingService';

// For backward compatibility, also export the optimized service directly
export { OptimizedJobScrapingService } from './optimizedJobScrapingService';
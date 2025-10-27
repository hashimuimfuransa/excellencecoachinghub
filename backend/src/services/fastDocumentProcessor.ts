import { DocumentParser } from '../utils/documentParser';
import { uploadDocumentToCloudinary } from '../config/cloudinary';

interface FastProcessingResult {
  documentUrl: string;
  documentText: string;
  isValid: boolean;
  errors?: string[];
  processingTime: number;
}

class FastDocumentProcessor {
  private static instance: FastDocumentProcessor;
  private processingCache = new Map<string, FastProcessingResult>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): FastDocumentProcessor {
    if (!FastDocumentProcessor.instance) {
      FastDocumentProcessor.instance = new FastDocumentProcessor();
    }
    return FastDocumentProcessor.instance;
  }

  /**
   * Process document with optimized parallel operations
   */
  async processDocument(
    fileBuffer: Buffer,
    mimetype: string,
    originalname: string,
    folder: string = 'assignments'
  ): Promise<FastProcessingResult> {
    const startTime = Date.now();
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(fileBuffer, mimetype, originalname);
    
    // Check cache first
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log(`📋 Using cached document processing result for: ${originalname}`);
      return cached;
    }

    try {
      console.log(`🚀 Fast processing document: ${originalname} (${mimetype})`);

      // Step 1: Start upload and parsing in parallel
      const [uploadResult, parseResult] = await Promise.all([
        this.uploadWithRetry(fileBuffer, mimetype, originalname, folder),
        this.parseWithOptimization(fileBuffer, mimetype, originalname)
      ]);

      // Step 2: Quick validation
      const validation = DocumentParser.validateDocument(parseResult);
      
      const result: FastProcessingResult = {
        documentUrl: uploadResult.url,
        documentText: DocumentParser.cleanText(parseResult.text),
        isValid: validation.isValid,
        errors: validation.errors,
        processingTime: Date.now() - startTime
      };

      // Cache the result
      this.cacheResult(cacheKey, result);

      console.log(`✅ Fast document processing completed in ${result.processingTime}ms`);
      return result;

    } catch (error: any) {
      console.error('Fast document processing failed:', error);
      throw new Error(`Document processing failed: ${error.message}`);
    }
  }

  /**
   * Upload with retry mechanism
   */
  private async uploadWithRetry(
    fileBuffer: Buffer,
    mimetype: string,
    originalname: string,
    folder: string,
    maxRetries: number = 2
  ): Promise<{ url: string }> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Use uploadDocumentToCloudinary with proper parameters
        const result = await uploadDocumentToCloudinary(
          fileBuffer,
          'system', // userId - using 'system' for assignment documents
          originalname,
          `excellence-coaching-hub/${folder}`
        );

        return { url: result.url };
      } catch (error: any) {
        lastError = error;
        console.warn(`Upload attempt ${attempt} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Upload failed after all retries');
  }

  /**
   * Parse document with optimization
   */
  private async parseWithOptimization(
    fileBuffer: Buffer,
    mimetype: string,
    originalname: string
  ): Promise<any> {
    // For large files, we might want to limit parsing time
    const timeout = this.getParsingTimeout(fileBuffer.length);
    
    return Promise.race([
      DocumentParser.parseDocument(fileBuffer, mimetype, originalname),
      this.createTimeoutPromise(timeout)
    ]);
  }

  /**
   * Get appropriate parsing timeout based on file size
   */
  private getParsingTimeout(fileSize: number): number {
    // Base timeout: 10 seconds
    // Add 1 second per MB
    const basTimeout = 10000;
    const fileSizeMB = fileSize / (1024 * 1024);
    return basTimeout + (fileSizeMB * 1000);
  }

  /**
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Document parsing timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Generate cache key for document
   */
  private generateCacheKey(fileBuffer: Buffer, mimetype: string, originalname: string): string {
    const crypto = require('crypto');
    const hash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    return `${hash}_${mimetype}_${originalname}`;
  }

  /**
   * Get cached result if available and not expired
   */
  private getCachedResult(cacheKey: string): FastProcessingResult | null {
    const cached = this.processingCache.get(cacheKey);
    if (!cached) return null;

    // Check if cache is expired (we'll add timestamp to cache entries)
    const now = Date.now();
    const cacheTime = (cached as any).cacheTime || 0;
    
    if (now - cacheTime > this.CACHE_TTL) {
      this.processingCache.delete(cacheKey);
      return null;
    }

    return cached;
  }

  /**
   * Cache processing result
   */
  private cacheResult(cacheKey: string, result: FastProcessingResult): void {
    // Add cache timestamp
    const cachedResult = {
      ...result,
      cacheTime: Date.now()
    };

    this.processingCache.set(cacheKey, cachedResult);

    // Clean up old cache entries periodically
    if (this.processingCache.size > 100) {
      this.cleanupCache();
    }
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, value] of this.processingCache.entries()) {
      const cacheTime = (value as any).cacheTime || 0;
      if (now - cacheTime > this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.processingCache.delete(key));
    console.log(`🧹 Cleaned up ${keysToDelete.length} expired cache entries`);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all cache (for testing or memory management)
   */
  clearCache(): void {
    this.processingCache.clear();
    console.log('🧹 Document processing cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.processingCache.size,
      maxSize: 100,
      ttl: this.CACHE_TTL
    };
  }
}

export const fastDocumentProcessor = FastDocumentProcessor.getInstance();
export default fastDocumentProcessor;

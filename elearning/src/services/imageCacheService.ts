class ImageCacheService {
  private cache = new Map<string, string>();
  private failedUrls = new Set<string>();
  private retryCount = new Map<string, number>();
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

  /**
   * Get cached image or return original URL
   */
  getImageUrl(originalUrl: string): string {
    // If URL failed recently, don't retry immediately
    if (this.failedUrls.has(originalUrl)) {
      const retryCount = this.retryCount.get(originalUrl) || 0;
      if (retryCount < this.maxRetries) {
        // Schedule retry
        setTimeout(() => {
          this.failedUrls.delete(originalUrl);
        }, this.retryDelay * (retryCount + 1));
      }
      return this.getFallbackUrl(originalUrl);
    }

    // Return cached URL if available
    if (this.cache.has(originalUrl)) {
      return this.cache.get(originalUrl)!;
    }

    // Return original URL for first attempt
    return originalUrl;
  }

  /**
   * Mark image as failed to load
   */
  markImageFailed(url: string): void {
    this.failedUrls.add(url);
    const retryCount = this.retryCount.get(url) || 0;
    this.retryCount.set(url, retryCount + 1);
    
    console.warn(`🖼️ Image failed to load (attempt ${retryCount + 1}/${this.maxRetries}):`, url);
  }

  /**
   * Mark image as successfully loaded
   */
  markImageSuccess(url: string): void {
    this.cache.set(url, url);
    this.failedUrls.delete(url);
    this.retryCount.delete(url);
  }

  /**
   * Get fallback URL for failed images
   */
  private getFallbackUrl(originalUrl: string): string {
    // For Google profile images, return a default avatar
    if (originalUrl.includes('googleusercontent.com') || originalUrl.includes('googleapis.com')) {
      return '/default-avatar.svg'; // Use the SVG default avatar
    }
    
    // For other images, return original URL (will show fallback in component)
    return originalUrl;
  }

  /**
   * Clear cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.cache.clear();
    this.failedUrls.clear();
    this.retryCount.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { cached: number; failed: number; retries: number } {
    return {
      cached: this.cache.size,
      failed: this.failedUrls.size,
      retries: this.retryCount.size
    };
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();
export default imageCacheService;

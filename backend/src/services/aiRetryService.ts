import { EventEmitter } from 'events';

interface QueueItem {
  id: string;
  operation: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  retryCount: number;
  maxRetries: number;
  priority: number;
  timestamp: number;
}

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  priority?: number;
}

class AIRetryService extends EventEmitter {
  private queue: QueueItem[] = [];
  private processing = false;
  private concurrentLimit = 2; // Limit concurrent AI requests
  private activeRequests = 0;
  private lastRequestTime = 0;
  private minRequestInterval = 2000; // Minimum 2 seconds between requests

  constructor() {
    super();
    this.processQueue();
  }

  /**
   * Add an AI operation to the retry queue
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      priority = 0
    } = options;

    return new Promise<T>((resolve, reject) => {
      const queueItem: QueueItem = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        operation,
        resolve,
        reject,
        retryCount: 0,
        maxRetries,
        priority,
        timestamp: Date.now()
      };

      // Insert item based on priority (higher priority first)
      const insertIndex = this.queue.findIndex(item => item.priority < priority);
      if (insertIndex === -1) {
        this.queue.push(queueItem);
      } else {
        this.queue.splice(insertIndex, 0, queueItem);
      }

      console.log(`📋 Added AI operation to queue: ${queueItem.id} (Priority: ${priority}, Queue size: ${this.queue.length})`);
      this.emit('queueUpdated', { size: this.queue.length });
    });
  }

  /**
   * Process the queue continuously
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 || this.activeRequests > 0) {
      // Check if we can process more requests
      if (this.activeRequests >= this.concurrentLimit || this.queue.length === 0) {
        await this.sleep(100);
        continue;
      }

      // Rate limiting - ensure minimum interval between requests
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      if (timeSinceLastRequest < this.minRequestInterval) {
        await this.sleep(this.minRequestInterval - timeSinceLastRequest);
      }

      const item = this.queue.shift();
      if (!item) continue;

      this.activeRequests++;
      this.lastRequestTime = Date.now();

      // Process the item without blocking the queue
      this.processItem(item).finally(() => {
        this.activeRequests--;
      });
    }

    this.processing = false;
  }

  /**
   * Process a single queue item with retry logic
   */
  private async processItem(item: QueueItem): Promise<void> {
    try {
      console.log(`🔄 Processing AI operation: ${item.id} (Attempt ${item.retryCount + 1}/${item.maxRetries + 1})`);
      
      const result = await item.operation();
      item.resolve(result);
      
      console.log(`✅ AI operation completed successfully: ${item.id}`);
      this.emit('operationCompleted', { id: item.id, success: true });
      
    } catch (error: any) {
      console.error(`❌ AI operation failed: ${item.id}`, error.message);
      
      // Check if this is a retryable error
      const isRetryable = this.isRetryableError(error);
      const canRetry = item.retryCount < item.maxRetries && isRetryable;
      
      if (canRetry) {
        item.retryCount++;
        const delay = this.calculateRetryDelay(item.retryCount);
        
        console.log(`🔄 Retrying AI operation: ${item.id} in ${delay}ms (Attempt ${item.retryCount + 1}/${item.maxRetries + 1})`);
        
        // Wait before retry
        await this.sleep(delay);
        
        // Re-add to queue with higher priority for retry
        item.priority += 10;
        const insertIndex = this.queue.findIndex(queueItem => queueItem.priority < item.priority);
        if (insertIndex === -1) {
          this.queue.push(item);
        } else {
          this.queue.splice(insertIndex, 0, item);
        }
        
        this.emit('operationRetried', { id: item.id, attempt: item.retryCount + 1 });
      } else {
        // Max retries reached or non-retryable error
        const finalError = new Error(
          `AI operation failed after ${item.retryCount + 1} attempts: ${error.message}`
        );
        item.reject(finalError);
        
        console.error(`💥 AI operation permanently failed: ${item.id}`);
        this.emit('operationFailed', { id: item.id, error: finalError.message });
      }
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Retryable errors
    const retryablePatterns = [
      'overloaded',
      '503',
      'service unavailable',
      'timeout',
      'rate limit',
      'quota exceeded',
      'temporarily unavailable',
      'network error',
      'connection error'
    ];
    
    // Non-retryable errors
    const nonRetryablePatterns = [
      'invalid api key',
      'unauthorized',
      '401',
      '403',
      'forbidden',
      'invalid request',
      '400'
    ];
    
    // Check for non-retryable errors first
    if (nonRetryablePatterns.some(pattern => errorMessage.includes(pattern))) {
      return false;
    }
    
    // Check for retryable errors
    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  private calculateRetryDelay(retryCount: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds
    const backoffMultiplier = 2;
    
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    let delay = Math.min(baseDelay * Math.pow(backoffMultiplier, retryCount - 1), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.3 * delay; // ±30% jitter
    delay += jitter;
    
    return Math.floor(delay);
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests,
      processing: this.processing,
      concurrentLimit: this.concurrentLimit
    };
  }

  /**
   * Clear the queue (emergency stop)
   */
  clearQueue() {
    const clearedItems = this.queue.length;
    this.queue.forEach(item => {
      item.reject(new Error('Queue cleared by administrator'));
    });
    this.queue = [];
    console.log(`🧹 Cleared ${clearedItems} items from AI queue`);
    return clearedItems;
  }

  /**
   * Update concurrent limit
   */
  setConcurrentLimit(limit: number) {
    this.concurrentLimit = Math.max(1, Math.min(limit, 5)); // Between 1 and 5
    console.log(`⚙️ AI concurrent limit updated to: ${this.concurrentLimit}`);
  }

  /**
   * Update minimum request interval
   */
  setMinRequestInterval(interval: number) {
    this.minRequestInterval = Math.max(500, interval); // Minimum 500ms
    console.log(`⚙️ AI request interval updated to: ${this.minRequestInterval}ms`);
  }
}

// Export singleton instance
export const aiRetryService = new AIRetryService();
export default aiRetryService;
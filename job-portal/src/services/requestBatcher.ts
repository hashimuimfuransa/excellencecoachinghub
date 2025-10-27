/**
 * Request Batcher Service
 * Handles batching and queuing of API requests to prevent rate limiting
 * and improve performance across all pages
 */

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  data?: any;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
}

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTime: number;
  retryAttempts: number;
  retryDelay: number;
}

class RequestBatcher {
  private queue: QueuedRequest[] = [];
  private processing = false;
  private batchTimer: NodeJS.Timeout | null = null;
  private config: BatchConfig;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: config.maxBatchSize || 10,
      maxWaitTime: config.maxWaitTime || 1000, // 1 second
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 2000,
    };
  }

  /**
   * Add a request to the batch queue
   */
  async addRequest<T>(
    url: string,
    method: string = 'GET',
    data?: any,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const request: QueuedRequest = {
        id: `${Date.now()}-${Math.random()}`,
        url,
        method,
        data,
        resolve,
        reject,
        timestamp: Date.now(),
        priority,
      };

      // Insert request based on priority
      this.insertByPriority(request);
      
      // Start processing if not already running
      this.scheduleProcessing();
    });
  }

  /**
   * Insert request into queue based on priority
   */
  private insertByPriority(request: QueuedRequest): void {
    const { priority } = request;
    
    if (priority === 'high') {
      // High priority requests go to the front
      this.queue.unshift(request);
    } else if (priority === 'low') {
      // Low priority requests go to the back
      this.queue.push(request);
    } else {
      // Normal priority requests go after high priority but before low priority
      const highPriorityCount = this.queue.filter(r => r.priority === 'high').length;
      this.queue.splice(highPriorityCount, 0, request);
    }
  }

  /**
   * Schedule processing of the queue
   */
  private scheduleProcessing(): void {
    if (this.processing) return;

    // Clear existing timer
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    // Process immediately if queue is full
    if (this.queue.length >= this.config.maxBatchSize) {
      this.processBatch();
      return;
    }

    // Schedule processing after max wait time
    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.config.maxWaitTime);
  }

  /**
   * Process a batch of requests
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    try {
      // Take requests up to max batch size
      const batch = this.queue.splice(0, this.config.maxBatchSize);
      
      if (batch.length === 0) {
        this.processing = false;
        return;
      }

      console.log(`🔄 Processing batch of ${batch.length} requests`);

      // Process requests with staggered delays to prevent rate limiting
      const results = await this.processRequestsWithStagger(batch);
      
      // Resolve all promises
      batch.forEach((request, index) => {
        if (results[index].success) {
          request.resolve(results[index].data);
        } else {
          request.reject(new Error(results[index].error));
        }
      });

    } catch (error) {
      console.error('❌ Batch processing error:', error);
      
      // Reject all requests in the batch
      const batch = this.queue.splice(0, this.config.maxBatchSize);
      batch.forEach(request => {
        request.reject(error);
      });
    } finally {
      this.processing = false;
      
      // Process remaining requests if any
      if (this.queue.length > 0) {
        setTimeout(() => this.processBatch(), 100);
      }
    }
  }

  /**
   * Process requests with staggered delays to prevent rate limiting
   */
  private async processRequestsWithStagger(requests: QueuedRequest[]): Promise<any[]> {
    const results: any[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      try {
        // Import api dynamically to avoid circular dependencies
        const { api } = await import('./api');
        
        let response;
        switch (request.method.toUpperCase()) {
          case 'GET':
            response = await api.get(request.url);
            break;
          case 'POST':
            response = await api.post(request.url, request.data);
            break;
          case 'PUT':
            response = await api.put(request.url, request.data);
            break;
          case 'PATCH':
            response = await api.patch(request.url, request.data);
            break;
          case 'DELETE':
            response = await api.delete(request.url);
            break;
          default:
            throw new Error(`Unsupported method: ${request.method}`);
        }

        results.push({
          success: true,
          data: response.data,
        });

      } catch (error: any) {
        console.error(`❌ Request failed: ${request.method} ${request.url}`, error);
        
        results.push({
          success: false,
          error: error.message || 'Request failed',
        });
      }

      // Add delay between requests to prevent rate limiting
      if (i < requests.length - 1) {
        await this.delay(200); // 200ms delay between requests
      }
    }

    return results;
  }

  /**
   * Utility function to create a delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus(): {
    queueLength: number;
    processing: boolean;
    config: BatchConfig;
  } {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      config: this.config,
    };
  }

  /**
   * Clear the queue (useful for cleanup)
   */
  clearQueue(): void {
    this.queue.forEach(request => {
      request.reject(new Error('Request cancelled'));
    });
    this.queue = [];
    
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }
}

// Create singleton instance
export const requestBatcher = new RequestBatcher();

// Export types
export type { QueuedRequest, BatchConfig };
export default requestBatcher;

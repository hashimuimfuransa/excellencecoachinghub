/**
 * Global API Service with Request Batching
 * Provides a unified API interface that automatically batches requests
 * to prevent rate limiting and improve performance across all pages
 */

import { requestBatcher } from './requestBatcher';

export interface ApiRequestOptions {
  priority?: 'high' | 'normal' | 'low';
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

class GlobalApiService {
  /**
   * Make a GET request with automatic batching
   */
  async get<T = any>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    try {
      const response = await requestBatcher.addRequest<ApiResponse<T>>(
        url,
        'GET',
        undefined,
        options.priority || 'normal'
      );
      
      if (response.success) {
        return response.data as T;
      } else {
        throw new Error(response.error || 'Request failed');
      }
    } catch (error: any) {
      console.error(`❌ GET ${url} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a POST request with automatic batching
   */
  async post<T = any>(url: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
    try {
      const response = await requestBatcher.addRequest<ApiResponse<T>>(
        url,
        'POST',
        data,
        options.priority || 'normal'
      );
      
      if (response.success) {
        return response.data as T;
      } else {
        throw new Error(response.error || 'Request failed');
      }
    } catch (error: any) {
      console.error(`❌ POST ${url} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a PUT request with automatic batching
   */
  async put<T = any>(url: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
    try {
      const response = await requestBatcher.addRequest<ApiResponse<T>>(
        url,
        'PUT',
        data,
        options.priority || 'normal'
      );
      
      if (response.success) {
        return response.data as T;
      } else {
        throw new Error(response.error || 'Request failed');
      }
    } catch (error: any) {
      console.error(`❌ PUT ${url} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a PATCH request with automatic batching
   */
  async patch<T = any>(url: string, data?: any, options: ApiRequestOptions = {}): Promise<T> {
    try {
      const response = await requestBatcher.addRequest<ApiResponse<T>>(
        url,
        'PATCH',
        data,
        options.priority || 'normal'
      );
      
      if (response.success) {
        return response.data as T;
      } else {
        throw new Error(response.error || 'Request failed');
      }
    } catch (error: any) {
      console.error(`❌ PATCH ${url} failed:`, error);
      throw error;
    }
  }

  /**
   * Make a DELETE request with automatic batching
   */
  async delete<T = any>(url: string, options: ApiRequestOptions = {}): Promise<T> {
    try {
      const response = await requestBatcher.addRequest<ApiResponse<T>>(
        url,
        'DELETE',
        undefined,
        options.priority || 'normal'
      );
      
      if (response.success) {
        return response.data as T;
      } else {
        throw new Error(response.error || 'Request failed');
      }
    } catch (error: any) {
      console.error(`❌ DELETE ${url} failed:`, error);
      throw error;
    }
  }

  /**
   * Batch multiple requests together for better performance
   */
  async batch<T = any>(requests: Array<{
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: any;
    priority?: 'high' | 'normal' | 'low';
  }>): Promise<T[]> {
    const promises = requests.map(req => {
      switch (req.method) {
        case 'GET':
          return this.get<T>(req.url, { priority: req.priority });
        case 'POST':
          return this.post<T>(req.url, req.data, { priority: req.priority });
        case 'PUT':
          return this.put<T>(req.url, req.data, { priority: req.priority });
        case 'PATCH':
          return this.patch<T>(req.url, req.data, { priority: req.priority });
        case 'DELETE':
          return this.delete<T>(req.url, { priority: req.priority });
        default:
          throw new Error(`Unsupported method: ${req.method}`);
      }
    });

    return Promise.all(promises);
  }

  /**
   * Get user profile with high priority
   */
  async getUserProfile(userId: string): Promise<any> {
    return this.get(`/users/${userId}/profile`, { priority: 'high' });
  }

  /**
   * Get user posts with normal priority
   */
  async getUserPosts(userId: string): Promise<any[]> {
    return this.get(`/posts/user/${userId}`, { priority: 'normal' });
  }

  /**
   * Get connections with normal priority
   */
  async getConnections(): Promise<any[]> {
    return this.get('/connections', { priority: 'normal' });
  }

  /**
   * Get suggested connections with low priority
   */
  async getSuggestedConnections(): Promise<any[]> {
    return this.get('/connections/suggestions', { priority: 'low' });
  }

  /**
   * Get user stories with normal priority
   */
  async getUserStories(): Promise<any[]> {
    return this.get('/social/stories/my-stories', { priority: 'normal' });
  }

  /**
   * Get notifications with high priority
   */
  async getNotifications(): Promise<any[]> {
    return this.get('/notifications/unread-count', { priority: 'high' });
  }

  /**
   * Load all profile data efficiently
   */
  async loadProfileData(userId: string): Promise<{
    profile: any;
    posts: any[];
    connections: any[];
    suggestions: any[];
    stories: any[];
    notifications: any[];
  }> {
    const requests = [
      { url: `/users/${userId}/profile`, method: 'GET' as const, priority: 'high' as const },
      { url: `/posts/user/${userId}`, method: 'GET' as const, priority: 'normal' as const },
      { url: '/connections', method: 'GET' as const, priority: 'normal' as const },
      { url: '/connections/suggestions', method: 'GET' as const, priority: 'low' as const },
      { url: '/social/stories/my-stories', method: 'GET' as const, priority: 'normal' as const },
      { url: '/notifications/unread-count', method: 'GET' as const, priority: 'high' as const },
    ];

    const results = await this.batch(requests);
    
    return {
      profile: results[0],
      posts: results[1] || [],
      connections: results[2] || [],
      suggestions: results[3] || [],
      stories: results[4] || [],
      notifications: results[5] || [],
    };
  }

  /**
   * Get queue status for debugging
   */
  getQueueStatus() {
    return requestBatcher.getQueueStatus();
  }

  /**
   * Clear the request queue
   */
  clearQueue() {
    requestBatcher.clearQueue();
  }
}

// Create singleton instance
export const globalApiService = new GlobalApiService();

// Export default
export default globalApiService;

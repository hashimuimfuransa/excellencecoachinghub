/**
 * Universal API Data Hook
 * Provides consistent data fetching with rate limiting protection across all pages
 */

import { useState, useEffect, useCallback } from 'react';
import { globalApiService } from '../services/globalApiService';

export interface UseApiDataOptions {
  priority?: 'high' | 'normal' | 'low';
  retryAttempts?: number;
  retryDelay?: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
}

export interface UseApiDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  retry: () => void;
}

/**
 * Hook for fetching single API endpoint
 */
export function useApiData<T = any>(
  url: string,
  options: UseApiDataOptions = {}
): UseApiDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    priority = 'normal',
    retryAttempts = 3,
    retryDelay = 2000,
    enabled = true,
    onError,
    onSuccess,
  } = options;

  const fetchData = useCallback(async (isRetry = false) => {
    if (!enabled) return;

    setLoading(true);
    if (!isRetry) {
      setError(null);
    }

    try {
      const result = await globalApiService.get<T>(url, { priority });
      setData(result);
      setError(null);
      setRetryCount(0);
      onSuccess?.(result);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch data';
      setError(errorMessage);
      onError?.(err);

      // Auto-retry for rate limit errors
      if (errorMessage.includes('Too many requests') && retryCount < retryAttempts) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchData(true);
        }, retryDelay * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setLoading(false);
    }
  }, [url, priority, enabled, retryCount, retryAttempts, retryDelay, onError, onSuccess]);

  const refetch = useCallback(() => {
    setRetryCount(0);
    fetchData();
  }, [fetchData]);

  const retry = useCallback(() => {
    if (retryCount < retryAttempts) {
      setRetryCount(prev => prev + 1);
      fetchData(true);
    }
  }, [fetchData, retryCount, retryAttempts]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    retry,
  };
}

/**
 * Hook for fetching multiple API endpoints efficiently
 */
export function useBatchApiData<T = any>(
  requests: Array<{
    key: string;
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    data?: any;
    priority?: 'high' | 'normal' | 'low';
  }>,
  options: UseApiDataOptions = {}
): {
  data: Record<string, T>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  retry: () => void;
} {
  const [data, setData] = useState<Record<string, T>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    retryAttempts = 3,
    retryDelay = 2000,
    enabled = true,
    onError,
    onSuccess,
  } = options;

  const fetchBatchData = useCallback(async (isRetry = false) => {
    if (!enabled || requests.length === 0) return;

    setLoading(true);
    if (!isRetry) {
      setError(null);
    }

    try {
      const batchRequests = requests.map(req => ({
        url: req.url,
        method: req.method || 'GET',
        data: req.data,
        priority: req.priority || 'normal',
      }));

      const results = await globalApiService.batch(batchRequests);
      
      const batchData: Record<string, T> = {};
      requests.forEach((req, index) => {
        batchData[req.key] = results[index];
      });

      setData(batchData);
      setError(null);
      setRetryCount(0);
      onSuccess?.(batchData);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch batch data';
      setError(errorMessage);
      onError?.(err);

      // Auto-retry for rate limit errors
      if (errorMessage.includes('Too many requests') && retryCount < retryAttempts) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchBatchData(true);
        }, retryDelay * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  }, [requests, enabled, retryCount, retryAttempts, retryDelay, onError, onSuccess]);

  const refetch = useCallback(() => {
    setRetryCount(0);
    fetchBatchData();
  }, [fetchBatchData]);

  const retry = useCallback(() => {
    if (retryCount < retryAttempts) {
      setRetryCount(prev => prev + 1);
      fetchBatchData(true);
    }
  }, [fetchBatchData, retryCount, retryAttempts]);

  useEffect(() => {
    fetchBatchData();
  }, [fetchBatchData]);

  return {
    data,
    loading,
    error,
    refetch,
    retry,
  };
}

/**
 * Hook specifically for profile data (commonly used across pages)
 */
export function useProfileData(userId?: string) {
  const [profileData, setProfileData] = useState<{
    profile: any;
    posts: any[];
    connections: any[];
    suggestions: any[];
    stories: any[];
    notifications: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const loadProfileData = useCallback(async (isRetry = false) => {
    if (!userId) return;

    setLoading(true);
    if (!isRetry) {
      setError(null);
    }

    try {
      const data = await globalApiService.loadProfileData(userId);
      setProfileData(data);
      setError(null);
      setRetryCount(0);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load profile data';
      setError(errorMessage);

      // Auto-retry for rate limit errors
      if (errorMessage.includes('Too many requests') && retryCount < 2) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadProfileData(true);
        }, 3000 * (retryCount + 1));
      }
    } finally {
      setLoading(false);
    }
  }, [userId, retryCount]);

  const refetch = useCallback(() => {
    setRetryCount(0);
    loadProfileData();
  }, [loadProfileData]);

  const retry = useCallback(() => {
    if (retryCount < 2) {
      setRetryCount(prev => prev + 1);
      loadProfileData(true);
    }
  }, [loadProfileData, retryCount]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  return {
    profileData,
    loading,
    error,
    refetch,
    retry,
  };
}

/**
 * Hook for job-related data
 */
export function useJobData(jobId?: string) {
  return useApiData(jobId ? `/jobs/${jobId}` : '', {
    priority: 'high',
    enabled: !!jobId,
  });
}

/**
 * Hook for user posts
 */
export function useUserPosts(userId?: string) {
  return useApiData(userId ? `/posts/user/${userId}` : '', {
    priority: 'normal',
    enabled: !!userId,
  });
}

/**
 * Hook for connections
 */
export function useConnections() {
  return useApiData('/connections', {
    priority: 'normal',
  });
}

/**
 * Hook for notifications
 */
export function useNotifications() {
  return useApiData('/notifications/unread-count', {
    priority: 'high',
  });
}

export default useApiData;

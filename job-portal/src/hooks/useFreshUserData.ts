import { useState, useEffect } from 'react';
import { User } from '../types/user';
import { userService } from '../services/userService';

interface UseFreshUserDataResult {
  freshUser: User | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage fresh user data from the backend
 * This ensures components always have up-to-date profile information
 */
export const useFreshUserData = (user: User | null): UseFreshUserDataResult => {
  const [freshUser, setFreshUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFreshUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?._id) {
        console.log('⚠️ useFreshUserData: No user ID provided, using cached user data');
        setFreshUser(user);
        return;
      }

      console.log('🔍 useFreshUserData: Fetching fresh user data for:', user._id);
      const freshUserData = await userService.getUserProfile(user._id);
      console.log('📋 useFreshUserData: Received fresh user data:', freshUserData);
      
      setFreshUser(freshUserData);
    } catch (error) {
      console.error('❌ useFreshUserData: Error fetching fresh user data:', error);
      setError('Failed to fetch latest profile data');
      // Fallback to cached user data
      setFreshUser(user);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreshUserData();
  }, [user?._id]);

  return {
    freshUser,
    loading,
    error,
    refetch: fetchFreshUserData
  };
};
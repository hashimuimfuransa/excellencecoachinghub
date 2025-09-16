import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useSessionManager = () => {
  const { isAuthenticated } = useAuth();

  // Refresh session timestamp on user activity - more efficient
  const refreshSession = useCallback(() => {
    if (!isAuthenticated) return;
    
    const isGoogleSession = localStorage.getItem('google_oauth_session') === 'true';
    const isPersistentSession = localStorage.getItem('google_oauth_persistent') === 'true';
    
    if (isGoogleSession || isPersistentSession) {
      const currentTimestamp = localStorage.getItem('session_timestamp');
      const currentTime = Date.now();
      
      // Only refresh if it's been more than 5 minutes since last refresh (reduce overhead)
      if (!currentTimestamp || (currentTime - parseInt(currentTimestamp)) > 5 * 60 * 1000) {
        localStorage.setItem('session_timestamp', currentTime.toString());
        // Clear any consecutive error counts on user activity
        sessionStorage.removeItem('consecutive_401s');
        console.log('🔄 Session refreshed on user activity (5+ min since last refresh)');
      }
    }
  }, [isAuthenticated]);

  // Track user activity to refresh session
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['click', 'keydown', 'scroll', 'mousemove', 'touchstart'];
    let throttleTimer: NodeJS.Timeout | null = null;

    const throttledRefresh = () => {
      if (throttleTimer) return;
      
      throttleTimer = setTimeout(() => {
        refreshSession();
        throttleTimer = null;
      }, 60000); // Throttle to once per minute
    };

    events.forEach(event => {
      document.addEventListener(event, throttledRefresh, { passive: true });
    });

    // Also refresh session every 15 minutes for active users (reduced frequency)
    const intervalId = setInterval(refreshSession, 15 * 60 * 1000);

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledRefresh);
      });
      clearInterval(intervalId);
      if (throttleTimer) {
        clearTimeout(throttleTimer);
      }
    };
  }, [isAuthenticated, refreshSession]);

  return { refreshSession };
};
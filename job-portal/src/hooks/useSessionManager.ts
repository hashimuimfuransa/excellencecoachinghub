import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useSessionManager = () => {
  const { isAuthenticated } = useAuth();

  // Refresh session timestamp on user activity
  const refreshSession = useCallback(() => {
    if (!isAuthenticated) return;
    
    const isGoogleSession = localStorage.getItem('google_oauth_session') === 'true';
    if (isGoogleSession) {
      localStorage.setItem('session_timestamp', Date.now().toString());
      // Clear any consecutive error counts on user activity
      sessionStorage.removeItem('consecutive_401s');
      console.log('🔄 Session refreshed on user activity');
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

    // Also refresh session every 5 minutes for active users
    const intervalId = setInterval(refreshSession, 5 * 60 * 1000);

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
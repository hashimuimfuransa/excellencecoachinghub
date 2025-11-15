import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      // If user is authenticated, redirect to their dashboard
      navigate('/dashboard', { replace: true });
    } else {
      // If user is not authenticated, redirect to login
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Show nothing while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
    </div>
  );
};

export default Home;
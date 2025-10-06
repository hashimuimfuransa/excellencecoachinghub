import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const RouteHandler: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Handle direct navigation to protected routes
    const path = location.pathname;
    
    // If user is not authenticated and trying to access protected routes
    if (!user && path.startsWith('/dashboard')) {
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
      return;
    }

    // If user is authenticated but on wrong dashboard
    if (user && path === '/dashboard') {
      const redirectPath = user.role === 'admin' || user.role === 'super_admin'
        ? '/dashboard/admin'
        : user.role === 'teacher'
        ? '/dashboard/teacher'
        : '/dashboard/student';
      
      navigate(redirectPath, { replace: true });
      return;
    }

    // Handle legacy routes or common mistyped routes
    const routeMap: { [key: string]: string } = {
      '/recordings': '/dashboard/student/recorded-sessions',
      '/recording': '/dashboard/student/recorded-sessions',
      '/sessions': '/dashboard/student/live-sessions',
      '/session': '/dashboard/student/live-sessions',
      '/courses': user ? '/dashboard/student/courses' : '/courses',
      '/course': user ? '/dashboard/student/courses' : '/courses',
      '/profile': '/dashboard/profile',
      '/settings': user?.role === 'student' 
        ? '/dashboard/student/settings' 
        : user?.role === 'teacher'
        ? '/dashboard/teacher/settings'
        : user?.role === 'admin' || user?.role === 'super_admin'
        ? '/dashboard/admin/settings'
        : '/dashboard/settings'
    };

    if (routeMap[path]) {
      navigate(routeMap[path], { replace: true });
    }
  }, [location, navigate, user]);

  return null;
};

export default RouteHandler;
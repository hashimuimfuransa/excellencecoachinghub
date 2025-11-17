import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const BottomNavbar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  // Define navigation items based on user role
  const getNavItems = () => {
    switch (user?.role) {
      case 'student':
        return [
          { path: '/dashboard', icon: '🏠', label: t('dashboard') },
          { path: '/homework', icon: '📝', label: t('homework') },
          { path: '/homework/help/request', icon: '🆘', label: t('help') },
          { path: '/leaderboard', icon: '🏆', label: t('leaderboard') },
        ];
      case 'teacher':
        return [
          { path: '/dashboard', icon: '🏠', label: 'Dashboard' },
          { path: '/homework/manage', icon: '📝', label: 'Homework Management' }, // Changed from '/homework' to '/homework/manage'
          { path: '/students', icon: '👥', label: 'Students' },
          { path: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
        ];
      case 'parent':
        return [
          { path: '/dashboard', icon: '🏠', label: t('dashboard') },
          { path: '/leaderboard', icon: '🏆', label: t('leaderboard') },
        ];
      default:
        return [
          { path: '/dashboard', icon: '🏠', label: t('dashboard') },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center py-2 px-1 text-xs font-medium transition-colors ${
              location.pathname === item.path
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg mb-0.5">{item.icon}</span>
            <span className="leading-tight">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BottomNavbar;
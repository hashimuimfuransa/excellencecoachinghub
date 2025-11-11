import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: '🏠',
      },
    ];

    const studentItems = [
      {
        name: 'Videos',
        href: '/videos',
        icon: '📹',
      },
      {
        name: 'Homework',
        href: '/homework',
        icon: '📝',
      },
      {
        name: 'Chat',
        href: '/chat',
        icon: '💬',
      },
      {
        name: 'Leaderboard',
        href: '/leaderboard',
        icon: '🏆',
      },
      {
        name: 'Offline Resources',
        href: '/offline-resources',
        icon: '📱',
      },
    ];

    const teacherItems = [
      {
        name: 'Students',
        href: '/students',
        icon: '👥',
      },
      {
        name: 'Upload Content',
        href: '/upload',
        icon: '⬆️',
      },
      {
        name: 'Live Sessions',
        href: '/live-sessions',
        icon: '🎥',
      },
      {
        name: 'Homework Review',
        href: '/homework-review',
        icon: '📋',
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: '📊',
      },
    ];

    const parentItems = [
      {
        name: 'Child Progress',
        href: '/child-progress',
        icon: '📈',
      },
      {
        name: 'Messages',
        href: '/messages',
        icon: '💬',
      },
      {
        name: 'Reports',
        href: '/reports',
        icon: '📄',
      },
    ];

    const adminItems = [
      {
        name: 'User Management',
        href: '/admin/users',
        icon: '👥',
      },
      {
        name: 'Content Management',
        href: '/admin/content',
        icon: '📚',
      },
      {
        name: 'System Settings',
        href: '/admin/settings',
        icon: '⚙️',
      },
      {
        name: 'Reports',
        href: '/admin/reports',
        icon: '📊',
      },
    ];

    switch (user?.role) {
      case 'student':
        return [...baseItems, ...studentItems];
      case 'teacher':
        return [...baseItems, ...teacherItems];
      case 'parent':
        return [...baseItems, ...parentItems];
      case 'admin':
        return [...baseItems, ...adminItems];
      default:
        return baseItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">e</span>
              </div>
              <span className="text-xl font-bold text-gray-900">ecoach</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
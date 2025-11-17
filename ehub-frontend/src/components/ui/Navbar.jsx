import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import NotificationBell from './NotificationBell';
import LanguageSelector from './LanguageSelector';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'student':
        return '/dashboard';
      case 'teacher':
        return '/dashboard';
      case 'admin':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  // Define navigation items based on user role
  const getDesktopNavItems = () => {
    if (user?.role === 'teacher') {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/homework/manage', label: 'Homework Management' }, // Changed from '/homework' to '/homework/manage'
        { path: '/students', label: 'Students' },
        { path: '/leaderboard', label: 'Leaderboard' },
      ];
    } else if (user?.role === 'student') {
      return [
        { path: '/dashboard', label: t('dashboard') },
        { path: '/homework', label: t('homework') },
        { path: '/homework/help/request', label: t('help') },
        { path: '/leaderboard', label: t('leaderboard') },
      ];
    }
    // Default navigation for other roles or unauthenticated users
    return [
      { path: '/dashboard', label: t('dashboard') },
    ];
  };

  // Define mobile navigation items based on user role
  const getMobileNavItems = () => {
    if (user?.role === 'teacher') {
      return [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/homework/manage', label: 'Homework Management' }, // Changed from '/homework' to '/homework/manage'
        { path: '/students', label: 'Students' },
        { path: '/leaderboard', label: 'Leaderboard' },
      ];
    } else if (user?.role === 'student') {
      return [
        { path: '/dashboard', label: t('dashboard') },
        { path: '/homework', label: t('homework') },
        { path: '/homework/help/request', label: t('help') },
        { path: '/leaderboard', label: t('leaderboard') },
      ];
    }
    // Default navigation for other roles or unauthenticated users
    return [
      { path: '/dashboard', label: t('dashboard') },
    ];
  };

  const desktopNavItems = getDesktopNavItems();
  const mobileNavItems = getMobileNavItems();

  return (
    // Improved navbar styling for better mobile appearance
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14 md:h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={isAuthenticated ? getDashboardLink() : "/"} className="flex-shrink-0 flex items-center">
              <img 
                src="/logo.webp" 
                alt="ecoach Logo" 
                className="h-8 w-auto"
              />
              <span className="ml-2 text-lg md:text-xl font-bold text-white hidden sm:block">eCoach</span>
            </Link>
          </div>

          {/* Navigation Links - Only show when authenticated */}
          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {desktopNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-blue-100 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white hover:bg-opacity-10"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {/* Mobile menu button - Always show for all users */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 rounded-md text-white hover:bg-white hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Right side items - Always show language selector */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {/* Always show language selector for all users */}
            <LanguageSelector />
            
            {isAuthenticated ? (
              <>
                <NotificationBell />
                
                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-blue-100 hover:text-white focus:outline-none">
                    <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <span className="hidden lg:block text-sm font-medium text-white">
                      {user?.firstName} {user?.lastName}
                    </span>
                    <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100">
                    <Link
                      to="/profile"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {t('profile_settings')}
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {t('preferences')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    >
                      {t('sign_out')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-blue-100 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white hover:bg-opacity-10"
                >
                  {t('sign_in')}
                </Link>
                <Link
                  to="/register"
                  className="bg-white bg-opacity-20 text-white hover:bg-opacity-30 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  {t('get_started')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Improved mobile menu with better styling and spacing */}
      <div className={`md:hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="border-t border-white border-opacity-20 bg-white bg-opacity-95 backdrop-blur-lg shadow-xl">
          {/* Language selector */}
          <div className="px-4 py-3 bg-blue-500 bg-opacity-10 border-b border-white border-opacity-20">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-100">{t('language')}</span>
              <LanguageSelector />
            </div>
          </div>
          
          <div className="px-2 pt-2 pb-3 space-y-1 max-h-[calc(100vh-120px)] overflow-y-auto">
            {isAuthenticated ? (
              <>
                {mobileNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}

                <div className="border-t border-gray-200 my-1"></div>

                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {t('profile_settings')}
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {t('preferences')}
                </Link>

                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {t('sign_out')}
                </button>
              </>
            ) : (
              <div className="space-y-2 py-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-base font-medium text-center text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                >
                  {t('sign_in')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-base font-medium text-center bg-blue-500 bg-opacity-10 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  {t('get_started')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
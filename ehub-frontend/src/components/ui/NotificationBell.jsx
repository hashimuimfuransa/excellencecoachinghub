import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, clearNotifications } = useSocket();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (notificationId) => {
    // In a real app, you'd call an API to mark as read
    console.log('Mark notification as read:', notificationId);
  };

  const handleClearAll = () => {
    clearNotifications();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-700 hover:text-primary-600 focus:outline-none"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5h5l-5-5zM4 12h9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-md shadow-lg z-50 border border-gray-200">
          <div className="py-2">
            <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-primary-600 hover:text-primary-500"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5h5l-5-5zM4 12h9" />
                  </svg>
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            notification.type === 'homework' ? 'bg-blue-100' :
                            notification.type === 'video' ? 'bg-green-100' :
                            notification.type === 'chat' ? 'bg-purple-100' :
                            'bg-gray-100'
                          }`}>
                            {notification.type === 'homework' ? '📝' :
                             notification.type === 'video' ? '📹' :
                             notification.type === 'chat' ? '💬' :
                             '🔔'}
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default NotificationBell;
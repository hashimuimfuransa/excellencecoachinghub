/* eslint-disable no-restricted-globals */

// Service worker for push notifications
const CACHE_NAME = 'excellence-coaching-hub-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'Excellence Coaching Hub',
      body: event.data.text() || 'You have a new notification',
      icon: '/logo192.png',
      badge: '/logo192.png'
    };
  }

  const title = notificationData.title || 'Excellence Coaching Hub';
  const options = {
    body: notificationData.body || 'You have a new notification',
    icon: notificationData.icon || '/logo192.png',
    badge: notificationData.badge || '/logo192.png',
    image: notificationData.image,
    data: notificationData.data || {},
    actions: notificationData.actions || [],
    tag: notificationData.tag || 'default',
    requireInteraction: notificationData.requireInteraction || false,
    silent: notificationData.silent || false,
    timestamp: notificationData.timestamp || Date.now(),
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    // Add sound for notifications (requires user interaction first)
    sound: '/notification-sound.mp3'
  };

  // Add default actions for different notification types
  if (notificationData.type === 'connection_request') {
    options.actions = [
      {
        action: 'accept',
        title: 'Accept',
        icon: '/icons/accept.png'
      },
      {
        action: 'decline',
        title: 'Decline',
        icon: '/icons/decline.png'
      },
      {
        action: 'view',
        title: 'View Profile',
        icon: '/icons/profile.png'
      }
    ];
  } else if (notificationData.type === 'message') {
    options.actions = [
      {
        action: 'reply',
        title: 'Reply',
        icon: '/icons/reply.png'
      },
      {
        action: 'view',
        title: 'View Chat',
        icon: '/icons/chat.png'
      }
    ];
  } else if (notificationData.type === 'job_match') {
    options.actions = [
      {
        action: 'view',
        title: 'View Job',
        icon: '/icons/job.png'
      },
      {
        action: 'apply',
        title: 'Apply Now',
        icon: '/icons/apply.png'
      }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  let urlToOpen = '/app';

  // Handle different actions
  if (action === 'accept' && data.type === 'connection_request') {
    // Handle connection accept
    urlToOpen = `/app/connections?action=accept&id=${data.connectionId}`;
  } else if (action === 'decline' && data.type === 'connection_request') {
    // Handle connection decline
    urlToOpen = `/app/connections?action=decline&id=${data.connectionId}`;
  } else if (action === 'reply' && data.type === 'message') {
    // Handle message reply
    urlToOpen = `/app/messages?chat=${data.chatId}`;
  } else if (action === 'view') {
    // Handle view actions based on type
    if (data.type === 'message') {
      urlToOpen = `/app/messages?chat=${data.chatId}`;
    } else if (data.type === 'connection_request') {
      urlToOpen = `/app/profile/${data.userId}`;
    } else if (data.type === 'job_match') {
      urlToOpen = `/app/jobs/${data.jobId}`;
    } else {
      urlToOpen = data.actionUrl || '/app';
    }
  } else if (action === 'apply' && data.type === 'job_match') {
    urlToOpen = `/app/jobs/${data.jobId}?action=apply`;
  } else {
    // Default click - navigate to the appropriate page based on notification type
    if (data.type === 'message') {
      urlToOpen = `/app/messages${data.chatId ? `?chat=${data.chatId}` : ''}`;
    } else if (data.type === 'connection_request' || data.type === 'connection_accepted') {
      urlToOpen = `/app/connections`;
    } else if (data.type === 'job_match') {
      urlToOpen = `/app/jobs${data.jobId ? `/${data.jobId}` : ''}`;
    } else {
      urlToOpen = data.actionUrl || '/app';
    }
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no existing window found, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event);
  
  // Track notification dismissal analytics if needed
  const notification = event.notification;
  const data = notification.data || {};
  
  if (data.trackDismissal) {
    // Send dismissal tracking to analytics
    fetch('/api/analytics/notification-dismissed', {
      method: 'POST',
      body: JSON.stringify({
        notificationId: data.id,
        type: data.type,
        dismissedAt: new Date().toISOString()
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    }).catch(err => console.log('Failed to track notification dismissal:', err));
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'background-message-send') {
    event.waitUntil(syncMessages());
  } else if (event.tag === 'background-connection-action') {
    event.waitUntil(syncConnectionActions());
  }
});

// Sync pending messages when back online
async function syncMessages() {
  try {
    // Get pending messages from IndexedDB or localStorage
    const pendingMessages = JSON.parse(localStorage.getItem('pendingMessages') || '[]');
    
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/chat/send-message', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          // Remove from pending messages
          const updatedPending = pendingMessages.filter(m => m.id !== message.id);
          localStorage.setItem('pendingMessages', JSON.stringify(updatedPending));
        }
      } catch (err) {
        console.error('Failed to sync message:', err);
      }
    }
  } catch (err) {
    console.error('Background sync failed:', err);
  }
}

// Sync pending connection actions when back online
async function syncConnectionActions() {
  try {
    const pendingActions = JSON.parse(localStorage.getItem('pendingConnectionActions') || '[]');
    
    for (const action of pendingActions) {
      try {
        const response = await fetch(`/api/connections/${action.type}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ userId: action.userId })
        });
        
        if (response.ok) {
          // Remove from pending actions
          const updatedPending = pendingActions.filter(a => a.id !== action.id);
          localStorage.setItem('pendingConnectionActions', JSON.stringify(updatedPending));
        }
      } catch (err) {
        console.error('Failed to sync connection action:', err);
      }
    }
  } catch (err) {
    console.error('Background sync failed:', err);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync:', event.tag);
  
  if (event.tag === 'background-refresh') {
    event.waitUntil(refreshData());
  }
});

// Refresh data periodically when app is not active
async function refreshData() {
  try {
    // Refresh notifications, messages, etc.
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // Check for new notifications
    const notificationsResponse = await fetch('/api/notifications/unread/count', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (notificationsResponse.ok) {
      const data = await notificationsResponse.json();
      if (data.count > 0) {
        // Show aggregated notification if there are new items
        self.registration.showNotification('Excellence Coaching Hub', {
          body: `You have ${data.count} new notification${data.count > 1 ? 's' : ''}`,
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'aggregate-notification',
          data: { type: 'aggregate', count: data.count }
        });
      }
    }
  } catch (err) {
    console.error('Periodic refresh failed:', err);
  }
}
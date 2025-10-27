import { test, expect } from '@playwright/test';

// Test notification endpoints functionality
test.describe('Notification Endpoints', () => {
  let authToken: string;
  let userId: string;

  // Setup: Login to get auth token
  test.beforeEach(async ({ request }) => {
    // First create a test user (if not exists) and login
    const loginResponse = await request.post('http://localhost:5000/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'testpass123'
      }
    });

    if (loginResponse.ok()) {
      const loginData = await loginResponse.json();
      authToken = loginData.token;
      userId = loginData.user._id;
    } else {
      // If login fails, try to register first
      const registerResponse = await request.post('http://localhost:5000/api/auth/register', {
        data: {
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          password: 'testpass123',
          role: 'student'
        }
      });

      if (registerResponse.ok()) {
        const registerData = await registerResponse.json();
        authToken = registerData.token;
        userId = registerData.user._id;
      }
    }
  });

  test('should get notifications with proper authentication', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/notifications', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('notifications');
  });

  test('should get unread notifications count', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/notifications/unread-count', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('count');
    expect(typeof data.data.count).toBe('number');
  });

  test('should subscribe to push notifications', async ({ request }) => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint-123',
      keys: {
        p256dh: 'test-p256dh-key',
        auth: 'test-auth-key'
      }
    };

    const response = await request.post('http://localhost:5000/api/notifications/push-subscription', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        subscription: mockSubscription
      }
    });

    expect(response.status()).toBe(201);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Push subscription saved successfully');
  });

  test('should handle duplicate push subscription', async ({ request }) => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/duplicate-test-endpoint',
      keys: {
        p256dh: 'test-p256dh-key-duplicate',
        auth: 'test-auth-key-duplicate'
      }
    };

    // Subscribe first time
    await request.post('http://localhost:5000/api/notifications/push-subscription', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        subscription: mockSubscription
      }
    });

    // Subscribe second time with same endpoint
    const response = await request.post('http://localhost:5000/api/notifications/push-subscription', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        subscription: mockSubscription
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Push subscription already exists');
  });

  test('should unsubscribe from push notifications', async ({ request }) => {
    const mockSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/unsubscribe-test-endpoint',
      keys: {
        p256dh: 'test-p256dh-key-unsubscribe',
        auth: 'test-auth-key-unsubscribe'
      }
    };

    // Subscribe first
    await request.post('http://localhost:5000/api/notifications/push-subscription', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        subscription: mockSubscription
      }
    });

    // Then unsubscribe
    const response = await request.delete('http://localhost:5000/api/notifications/push-subscription', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        endpoint: mockSubscription.endpoint
      }
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('Push subscription removed successfully');
  });

  test('should get VAPID public key', async ({ request }) => {
    const response = await request.get('http://localhost:5000/api/notifications/vapid-public-key');

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('publicKey');
    expect(typeof data.data.publicKey).toBe('string');
  });

  test('should require authentication for protected endpoints', async ({ request }) => {
    const endpoints = [
      'http://localhost:5000/api/notifications',
      'http://localhost:5000/api/notifications/unread-count'
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Not authorized');
    }
  });

  test('should validate push subscription data', async ({ request }) => {
    const invalidSubscription = {
      // Missing required fields
    };

    const response = await request.post('http://localhost:5000/api/notifications/push-subscription', {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        subscription: invalidSubscription
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe('Validation error');
  });
});
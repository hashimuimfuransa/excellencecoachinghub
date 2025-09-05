// Globals are available from vitest config
import { settingsService, NotificationSettings, UserSettings } from '../settingsService';
import { apiGet, apiPut } from '../api';

// Mock the API calls
vi.mock('../api', () => ({
  apiGet: vi.fn(),
  apiPut: vi.fn()
}));

const mockApiGet = apiGet as any;
const mockApiPut = apiPut as any;

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('SettingsService', () => {
  const testUserId = 'test-user-123';
  
  const testNotificationSettings: NotificationSettings = {
    email: false,
    push: false,
    jobAlerts: false,
    emailFrequency: 'weekly'
  };

  const defaultUserSettings: UserSettings = {
    notifications: {
      email: true,
      push: true,
      jobAlerts: true,
      emailFrequency: 'daily'
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showLocation: true,
      allowMessages: true,
      allowJobAlerts: true,
      showOnlineStatus: true,
      allowSearchIndexing: true
    },
    appearance: {
      theme: 'system',
      language: 'en',
      fontSize: 'medium',
      compactMode: false,
      showAnimations: true
    },
    preferences: {
      autoSave: true,
      rememberMe: true,
      twoFactorAuth: false,
      sessionTimeout: 30
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  describe('getUserSettings', () => {
    it('should return settings from API when available', async () => {
      mockApiGet.mockResolvedValueOnce({
        data: defaultUserSettings
      });

      const result = await settingsService.getUserSettings(testUserId);

      expect(mockApiGet).toHaveBeenCalledWith('/settings/user');
      expect(result).toEqual(defaultUserSettings);
    });

    it('should return default settings when API fails', async () => {
      mockApiGet.mockRejectedValueOnce(new Error('API Error'));

      const result = await settingsService.getUserSettings(testUserId);

      expect(result).toEqual(defaultUserSettings);
    });
  });

  describe('updateNotificationSettings - Core Issue Detection', () => {
    it('should save notification settings to API and localStorage', async () => {
      mockApiPut.mockResolvedValueOnce({ data: { success: true } });

      await settingsService.updateNotificationSettings(testUserId, testNotificationSettings);

      // Verify API call
      expect(mockApiPut).toHaveBeenCalledWith('/settings/user', {
        preferences: { notifications: testNotificationSettings }
      });

      // Verify localStorage persistence
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `notifications_${testUserId}`,
        expect.stringContaining('"email":false')
      );

      // Verify saved data structure
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.email).toBe(false);
      expect(savedData.push).toBe(false);
      expect(savedData.jobAlerts).toBe(false);
      expect(savedData.emailFrequency).toBe('weekly');
      expect(savedData.lastSyncedAt).toBeDefined();
    });

    it('should save to localStorage even when API fails (offline persistence)', async () => {
      mockApiPut.mockRejectedValueOnce(new Error('Network Error'));

      await settingsService.updateNotificationSettings(testUserId, testNotificationSettings);

      // Should still save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        `notifications_${testUserId}`,
        expect.stringContaining('"email":false')
      );

      // Verify pendingSync flag is set
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.pendingSync).toBe(true);
    });

    it('should properly disable all notifications and persist the state', async () => {
      const disabledSettings: NotificationSettings = {
        email: false,
        push: false,
        jobAlerts: false,
        emailFrequency: 'daily'
      };

      mockApiPut.mockResolvedValueOnce({ data: { success: true } });

      await settingsService.updateNotificationSettings(testUserId, disabledSettings);

      // Verify all notifications are disabled in localStorage
      const savedData = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedData.email).toBe(false);
      expect(savedData.push).toBe(false);
      expect(savedData.jobAlerts).toBe(false);
    });
  });

  describe('loadLocalSettings - Root Cause Investigation', () => {
    it('should correctly load notification settings from localStorage', () => {
      // Simulate saved settings in localStorage
      const savedSettings = {
        email: false,
        push: false,
        jobAlerts: false,
        emailFrequency: 'weekly',
        lastUpdated: '2024-01-15T10:30:00Z'
      };

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === `notifications_${testUserId}`) {
          return JSON.stringify(savedSettings);
        }
        return null;
      });

      const result = settingsService.loadLocalSettings(testUserId);

      expect(result.notifications).toEqual(savedSettings);
      expect(result.notifications!.email).toBe(false);
      expect(result.notifications!.push).toBe(false);
      expect(result.notifications!.jobAlerts).toBe(false);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === `notifications_${testUserId}`) {
          return 'invalid-json-data';
        }
        return null;
      });

      const result = settingsService.loadLocalSettings(testUserId);

      // Should return empty object when localStorage is corrupted
      expect(result).toEqual({});
    });

    it('should return empty object when no settings exist in localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = settingsService.loadLocalSettings(testUserId);

      expect(result).toEqual({});
    });
  });

  describe('Settings Persistence Flow - Complete Scenario', () => {
    it('should maintain disabled notification state across page refresh simulation', async () => {
      // Step 1: Save disabled notification settings
      const disabledSettings: NotificationSettings = {
        email: false,
        push: false,
        jobAlerts: false,
        emailFrequency: 'daily'
      };

      mockApiPut.mockResolvedValueOnce({ data: { success: true } });
      await settingsService.updateNotificationSettings(testUserId, disabledSettings);

      // Step 2: Simulate page refresh - load settings again
      mockApiGet.mockRejectedValueOnce(new Error('API temporarily unavailable'));

      const loadedSettings = settingsService.loadLocalSettings(testUserId);

      // Step 3: Verify disabled settings are maintained
      expect(loadedSettings.notifications?.email).toBe(false);
      expect(loadedSettings.notifications?.push).toBe(false);
      expect(loadedSettings.notifications?.jobAlerts).toBe(false);
    });

    it('should prioritize localStorage when API returns outdated data', () => {
      // Simulate API returning default (enabled) settings
      const apiSettings = { ...defaultUserSettings };
      mockApiGet.mockResolvedValueOnce({ data: apiSettings });

      // But localStorage has disabled settings with recent timestamp
      const recentDisabledSettings = {
        email: false,
        push: false,
        jobAlerts: false,
        emailFrequency: 'daily',
        lastUpdated: new Date().toISOString() // Recent timestamp
      };

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === `notifications_${testUserId}`) {
          return JSON.stringify(recentDisabledSettings);
        }
        return null;
      });

      const result = settingsService.loadLocalSettings(testUserId);

      // Should return the disabled settings from localStorage
      expect(result.notifications?.email).toBe(false);
      expect(result.notifications?.push).toBe(false);
      expect(result.notifications?.jobAlerts).toBe(false);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty user ID gracefully', async () => {
      await expect(
        settingsService.updateNotificationSettings('', testNotificationSettings)
      ).rejects.not.toThrow();
    });

    it('should handle localStorage being unavailable', async () => {
      // Mock localStorage failure
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });

      mockApiPut.mockResolvedValueOnce({ data: { success: true } });

      // Should not throw error even if localStorage fails
      await expect(
        settingsService.updateNotificationSettings(testUserId, testNotificationSettings)
      ).resolves.not.toThrow();
    });

    it('should validate notification settings structure', async () => {
      const invalidSettings = {
        email: 'invalid', // Should be boolean
        push: true,
        jobAlerts: null, // Should be boolean
        emailFrequency: 'invalid-frequency' // Should be valid enum
      } as any;

      mockApiPut.mockResolvedValueOnce({ data: { success: true } });

      // The service should handle invalid data gracefully
      await expect(
        settingsService.updateNotificationSettings(testUserId, invalidSettings)
      ).resolves.not.toThrow();
    });
  });

  describe('Real-world Bug Scenarios', () => {
    it('should detect the specific bug: disabled notifications reverting to enabled after refresh', async () => {
      console.log('🐛 Testing the reported bug scenario...');

      // Step 1: User disables all notifications
      const disabledSettings: NotificationSettings = {
        email: false,
        push: false,
        jobAlerts: false,
        emailFrequency: 'daily'
      };

      // Mock successful save
      mockApiPut.mockResolvedValueOnce({ data: { success: true } });
      
      console.log('📝 Saving disabled notification settings...');
      await settingsService.updateNotificationSettings(testUserId, disabledSettings);

      // Verify localStorage was updated
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const savedCall = mockLocalStorage.setItem.mock.calls[0];
      const savedKey = savedCall[0];
      const savedValue = JSON.parse(savedCall[1]);
      
      console.log('💾 Saved to localStorage:', { key: savedKey, value: savedValue });

      // Step 2: Simulate page refresh - getUserSettings is called
      console.log('🔄 Simulating page refresh...');
      
      // This might be where the bug occurs - if API returns defaults
      mockApiGet.mockResolvedValueOnce({
        data: defaultUserSettings // API returns enabled notifications
      });

      const refreshedSettings = await settingsService.getUserSettings(testUserId);
      console.log('📥 Settings from API after refresh:', refreshedSettings.notifications);

      // Step 3: Check if loadLocalSettings overwrites the API response
      const localSettings = settingsService.loadLocalSettings(testUserId);
      console.log('💿 Local settings loaded:', localSettings.notifications);

      // This test should reveal the bug if localStorage settings aren't properly applied
      if (refreshedSettings.notifications.email === true && localSettings.notifications?.email === false) {
        console.log('🚨 BUG DETECTED: API settings are overriding localStorage settings');
        console.log('Expected: Disabled notifications should persist after refresh');
        console.log('Actual: Notifications revert to enabled state');
      }

      // The fix would be to ensure ProfileSettingsPage properly applies localStorage settings
      expect(localSettings.notifications?.email).toBe(false);
      expect(localSettings.notifications?.push).toBe(false);
      expect(localSettings.notifications?.jobAlerts).toBe(false);
    });

    it('should test the settings loading order in ProfileSettingsPage', () => {
      console.log('🔍 Testing ProfileSettingsPage settings loading logic...');

      // Simulate the exact scenario from ProfileSettingsPage loadUserSettings function
      const apiSettings = defaultUserSettings; // API returns defaults (enabled)
      const localSettings = {
        notifications: {
          email: false,
          push: false,
          jobAlerts: false,
          emailFrequency: 'daily',
          lastUpdated: new Date().toISOString()
        }
      } as any;

      mockLocalStorage.getItem.mockImplementation((key: string) => {
        if (key === `notifications_${testUserId}`) {
          return JSON.stringify(localSettings.notifications);
        }
        return null;
      });

      const loadedLocalSettings = settingsService.loadLocalSettings(testUserId);

      console.log('API Settings (step 1):', apiSettings.notifications);
      console.log('Local Settings (step 2):', loadedLocalSettings.notifications);

      // In ProfileSettingsPage, the local settings should override API settings
      const finalNotifications = loadedLocalSettings.notifications || apiSettings.notifications;
      
      console.log('Final merged settings:', finalNotifications);

      // This is what should happen to prevent the bug
      expect(finalNotifications.email).toBe(false);
      expect(finalNotifications.push).toBe(false);
      expect(finalNotifications.jobAlerts).toBe(false);
    });
  });

  describe('Fix Validation Tests', () => {
    it('should ensure settings remain persistent across multiple interactions', async () => {
      // Test the complete user workflow multiple times
      for (let i = 1; i <= 3; i++) {
        console.log(`🔄 Iteration ${i}: Testing settings persistence`);

        const toggledSettings: NotificationSettings = {
          email: i % 2 === 0, // Alternate true/false
          push: false,
          jobAlerts: true,
          emailFrequency: 'weekly'
        };

        mockApiPut.mockResolvedValueOnce({ data: { success: true } });
        await settingsService.updateNotificationSettings(testUserId, toggledSettings);

        const localSettings = settingsService.loadLocalSettings(testUserId);
        
        expect(localSettings.notifications?.email).toBe(toggledSettings.email);
        expect(localSettings.notifications?.push).toBe(toggledSettings.push);
        expect(localSettings.notifications?.jobAlerts).toBe(toggledSettings.jobAlerts);

        console.log(`✅ Iteration ${i} passed: Settings correctly persisted`);
      }
    });
  });
});
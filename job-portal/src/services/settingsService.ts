import { apiGet, apiPut } from './api';

export interface NotificationSettings {
  // Essential notification methods
  email: boolean;
  push: boolean;
  jobAlerts: boolean;
  
  // Email frequency control
  emailFrequency: 'immediate' | 'daily' | 'weekly';
  
  // Security notifications (always enabled - not stored in user preferences)
  // securityAlerts: true (handled separately, always enabled)
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'employers' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  allowMessages: boolean;
  allowJobAlerts: boolean;
  showOnlineStatus: boolean;
  allowSearchIndexing: boolean;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
  showAnimations: boolean;
}

export interface AccountPreferences {
  autoSave: boolean;
  rememberMe: boolean;
  twoFactorAuth: boolean;
  sessionTimeout: number;
}

export interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
  preferences: AccountPreferences;
}

class SettingsService {
  // Get all user settings
  async getUserSettings(userId: string): Promise<UserSettings> {
    try {
      const response = await apiGet(`/settings/user`);
      return response.data;
    } catch (error) {
      console.warn('Settings API not available, using defaults');
      return this.getDefaultSettings();
    }
  }

  // Update notification settings with persistence
  async updateNotificationSettings(userId: string, notifications: NotificationSettings): Promise<void> {
    try {
      console.log('💾 Saving notification settings...');
      await apiPut('/settings/user', { preferences: { notifications } });
      
      // Save to localStorage for persistence and offline access
      const settingsData = {
        ...notifications,
        lastUpdated: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString()
      };
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(settingsData));
      console.log('✅ Notification settings saved successfully');
      
    } catch (error) {
      console.warn('⚠️ Notification API not available, storing locally');
      const settingsData = {
        ...notifications,
        lastUpdated: new Date().toISOString(),
        pendingSync: true
      };
      localStorage.setItem(`notifications_${userId}`, JSON.stringify(settingsData));
      // Don't throw error since we saved locally
    }
  }

  // Update privacy settings with persistence
  async updatePrivacySettings(userId: string, privacy: PrivacySettings): Promise<void> {
    try {
      console.log('💾 Saving privacy settings...');
      await apiPut('/settings/user', { preferences: { privacy } });
      
      // Save to localStorage for persistence and offline access
      const settingsData = {
        ...privacy,
        lastUpdated: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString()
      };
      localStorage.setItem(`privacy_${userId}`, JSON.stringify(settingsData));
      console.log('✅ Privacy settings saved successfully');
      
    } catch (error) {
      console.warn('⚠️ Privacy API not available, storing locally');
      const settingsData = {
        ...privacy,
        lastUpdated: new Date().toISOString(),
        pendingSync: true
      };
      localStorage.setItem(`privacy_${userId}`, JSON.stringify(settingsData));
    }
  }

  // Update appearance settings with persistence
  async updateAppearanceSettings(userId: string, appearance: AppearanceSettings): Promise<void> {
    try {
      console.log('💾 Saving appearance settings...');
      await apiPut('/settings/user', { preferences: { appearance } });
      
      // Save to localStorage for persistence and offline access
      const settingsData = {
        ...appearance,
        lastUpdated: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString()
      };
      localStorage.setItem(`appearance_${userId}`, JSON.stringify(settingsData));
      console.log('✅ Appearance settings saved successfully');
      
    } catch (error) {
      console.warn('⚠️ Appearance API not available, storing locally');
      const settingsData = {
        ...appearance,
        lastUpdated: new Date().toISOString(),
        pendingSync: true
      };
      localStorage.setItem(`appearance_${userId}`, JSON.stringify(settingsData));
    }
  }

  // Update account preferences with persistence
  async updateAccountPreferences(userId: string, preferences: AccountPreferences): Promise<void> {
    try {
      console.log('💾 Saving account preferences...');
      await apiPut('/settings/user', { preferences });
      
      // Save to localStorage for persistence and offline access
      const settingsData = {
        ...preferences,
        lastUpdated: new Date().toISOString(),
        lastSyncedAt: new Date().toISOString()
      };
      localStorage.setItem(`preferences_${userId}`, JSON.stringify(settingsData));
      console.log('✅ Account preferences saved successfully');
      
    } catch (error) {
      console.warn('⚠️ Preferences API not available, storing locally');
      const settingsData = {
        ...preferences,
        lastUpdated: new Date().toISOString(),
        pendingSync: true
      };
      localStorage.setItem(`preferences_${userId}`, JSON.stringify(settingsData));
    }
  }

  // Reset all settings to defaults
  async resetSettings(userId: string): Promise<void> {
    const defaultSettings = this.getDefaultSettings();
    await Promise.all([
      this.updateNotificationSettings(userId, defaultSettings.notifications),
      this.updatePrivacySettings(userId, defaultSettings.privacy),
      this.updateAppearanceSettings(userId, defaultSettings.appearance),
      this.updateAccountPreferences(userId, defaultSettings.preferences)
    ]);
  }

  // Get default settings
  private getDefaultSettings(): UserSettings {
    return {
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
  }

  // Load settings from localStorage (fallback)
  loadLocalSettings(userId: string): Partial<UserSettings> {
    const settings: Partial<UserSettings> = {};
    
    try {
      const notifications = localStorage.getItem(`notifications_${userId}`);
      if (notifications) settings.notifications = JSON.parse(notifications);
      
      const privacy = localStorage.getItem(`privacy_${userId}`);
      if (privacy) settings.privacy = JSON.parse(privacy);
      
      const appearance = localStorage.getItem(`appearance_${userId}`);
      if (appearance) settings.appearance = JSON.parse(appearance);
      
      const preferences = localStorage.getItem(`preferences_${userId}`);
      if (preferences) settings.preferences = JSON.parse(preferences);
    } catch (error) {
      console.warn('Failed to load local settings:', error);
    }
    
    return settings;
  }
}

export const settingsService = new SettingsService();
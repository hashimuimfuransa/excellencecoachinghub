import { api } from './api';

export interface StoryData {
  _id?: string;
  type: 'achievement' | 'learning' | 'networking' | 'insight' | 'milestone' | 'announcement';
  title: string;
  content: string;
  media?: {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  };
  tags: string[];
  visibility: 'public' | 'connections' | 'private';
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    company?: string;
    jobTitle?: string;
  };
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
  isActive?: boolean;
  viewers?: string[];
  likes?: string[];
  shares?: number;
}

export interface StoryResponse {
  success: boolean;
  data?: StoryData | StoryData[];
  error?: string;
  message?: string;
}

export interface StoryAnalytics {
  viewers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    viewedAt: string;
  }>;
  engagement: {
    views: number;
    likes: number;
    shares: number;
    reach: number;
  };
}

class EnhancedStoryService {
  private getUserKey(): string {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userKey = currentUser._id || currentUser.id || currentUser.email || currentUser.googleId;
    
    // Enhanced debugging for user identification
    console.log('🔍 Enhanced Story Service - User identification:', {
      currentUser,
      userKey,
      hasUser: Object.keys(currentUser).length > 0
    });
    
    return userKey || 'anonymous';
  }

  private isGoogleUser(): boolean {
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isGoogle = token?.startsWith('google_') || currentUser.authProvider === 'google' || !!currentUser.googleId;
    
    console.log('🔍 Enhanced Story Service - Google user check:', {
      token: token?.substring(0, 10) + '...',
      authProvider: currentUser.authProvider,
      hasGoogleId: !!currentUser.googleId,
      isGoogle
    });
    
    return isGoogle;
  }

  private getStorageKey(userId?: string): string {
    const userKey = userId || this.getUserKey();
    const storageKey = `enhancedStories_${userKey}`;
    
    console.log('🔍 Enhanced Story Service - Storage key:', {
      userId,
      userKey,
      storageKey
    });
    
    return storageKey;
  }

  private generateMockStory(storyData: Partial<StoryData>): StoryData {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const now = new Date();
    
    return {
      _id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: storyData.type || 'achievement',
      title: storyData.title || '',
      content: storyData.content || '',
      media: storyData.media,
      tags: storyData.tags || [],
      visibility: storyData.visibility || 'connections',
      author: {
        _id: currentUser._id || currentUser.email || 'user_' + Date.now(),
        firstName: currentUser.firstName || 'User',
        lastName: currentUser.lastName || '',
        profilePicture: currentUser.profilePicture || null,
        company: currentUser.company || 'Professional',
        jobTitle: currentUser.jobTitle || 'Career Professional',
      },
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      viewers: [],
      likes: [],
      shares: 0,
    };
  }

  async createStory(storyData: Omit<StoryData, '_id' | 'author' | 'createdAt' | 'updatedAt' | 'expiresAt' | 'isActive' | 'viewers' | 'likes' | 'shares'>): Promise<StoryResponse> {
    try {
      console.log('📝 Creating story:', storyData);

      // Check for 24-hour restriction first
      const existingStories = await this.getUserStories();
      if (existingStories.success && existingStories.data) {
        const stories = Array.isArray(existingStories.data) ? existingStories.data : [existingStories.data];
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const recentStories = stories.filter(story => {
          const createdAt = new Date(story.createdAt || '');
          return createdAt > last24Hours;
        });

        if (recentStories.length > 0) {
          return {
            success: false,
            error: 'You can only create one story per 24-hour period. Please wait before creating another story.'
          };
        }
      }

      if (this.isGoogleUser()) {
        console.log('🔄 Creating mock story for Google user');
        
        const mockStory = this.generateMockStory(storyData);
        
        // Save to localStorage with enhanced key management
        const storageKey = this.getStorageKey();
        console.log('💾 Saving story with storage key:', storageKey);
        const existingStories = JSON.parse(localStorage.getItem(storageKey) || '[]');
        console.log('💾 Existing stories before adding new one:', existingStories.length);
        
        // Add new story at the beginning
        existingStories.unshift(mockStory);
        
        // Keep only the last 20 stories for performance
        const limitedStories = existingStories.slice(0, 20);
        localStorage.setItem(storageKey, JSON.stringify(limitedStories));
        console.log('💾 Stories saved to localStorage. Total stories now:', limitedStories.length);
        
        // Also save to a global stories feed for cross-user visibility
        const globalStoriesKey = 'globalStoryFeed';
        const globalStories = JSON.parse(localStorage.getItem(globalStoriesKey) || '[]');
        globalStories.unshift(mockStory);
        localStorage.setItem(globalStoriesKey, JSON.stringify(globalStories.slice(0, 100))); // Keep 100 global stories
        
        console.log('✅ Story created successfully with enhanced storage');
        
        return {
          success: true,
          data: mockStory,
          message: 'Story created successfully! Your professional story is now live and visible to your network.'
        };
      }
      
      // For regular users, use API
      console.log('🌐 Using API for regular user story creation');
      try {
        const response = await api.post('/social/stories', storyData);
        console.log('🌐 API response for story creation:', response.data);
        
        if (response.data && response.data.success && response.data.data) {
          // Also save to localStorage as backup for better UX
          const story = response.data.data;
          const globalStoriesKey = 'globalStoryFeed';
          const globalStories = JSON.parse(localStorage.getItem(globalStoriesKey) || '[]');
          globalStories.unshift(story);
          localStorage.setItem(globalStoriesKey, JSON.stringify(globalStories.slice(0, 100)));
          console.log('💾 Story also saved to localStorage as backup');
          
          return {
            success: true,
            data: story,
            message: response.data.message || 'Story created successfully!'
          };
        } else {
          throw new Error('API returned invalid response');
        }
      } catch (apiError) {
        console.warn('⚠️ API story creation failed, trying localStorage fallback:', apiError);
        
        // Fallback to localStorage if API fails
        const mockStory = this.generateMockStory(storyData);
        
        const storageKey = this.getStorageKey();
        const existingStories = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existingStories.unshift(mockStory);
        localStorage.setItem(storageKey, JSON.stringify(existingStories.slice(0, 20)));
        
        // Also save to global feed
        const globalStoriesKey = 'globalStoryFeed';
        const globalStories = JSON.parse(localStorage.getItem(globalStoriesKey) || '[]');
        globalStories.unshift(mockStory);
        localStorage.setItem(globalStoriesKey, JSON.stringify(globalStories.slice(0, 100)));
        
        console.log('💾 Story saved to localStorage as fallback');
        
        return {
          success: true,
          data: mockStory,
          message: 'Story created successfully (saved locally)!'
        };
      }
      
    } catch (error: any) {
      console.error('❌ Error creating story:', error);
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.message ||
                          'Failed to create story. Please check your connection and try again.';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getUserStories(userId?: string): Promise<StoryResponse> {
    try {
      const targetUserId = userId || this.getUserKey();
      
      console.log('📚 Enhanced Story Service - getUserStories called:', {
        userId,
        targetUserId,
        isGoogleUser: this.isGoogleUser()
      });
      
      if (this.isGoogleUser() || userId) {
        console.log('📚 Loading enhanced user stories for:', targetUserId);
        
        const storageKey = this.getStorageKey(targetUserId);
        
        // Try to get stories from localStorage
        const storageValue = localStorage.getItem(storageKey);
        console.log('📚 Storage value for key', storageKey, ':', storageValue);
        
        const savedStories = JSON.parse(storageValue || '[]');
        
        // Also check if there are stories with alternate key formats (for debugging)
        const alternateKeys = [
          `stories_${targetUserId}`,
          `enhancedStories_${targetUserId}`,
          `userStories_${targetUserId}`
        ];
        
        let alternateStoriesFound = false;
        alternateKeys.forEach(key => {
          const altValue = localStorage.getItem(key);
          if (altValue && altValue !== '[]') {
            console.log(`📚 Found alternate stories under key ${key}:`, altValue);
            alternateStoriesFound = true;
          }
        });
        
        // Filter only active (non-expired) stories
        const now = new Date();
        const activeStories = savedStories.filter((story: StoryData) => {
          if (!story.expiresAt) {
            console.log('📚 Story without expiration date:', story._id);
            return false;
          }
          const expiresAt = new Date(story.expiresAt);
          const isActive = expiresAt > now;
          console.log(`📚 Story ${story._id} expires at ${expiresAt}, isActive: ${isActive}`);
          return isActive;
        });
        
        console.log(`📊 Enhanced Story Service - Found ${activeStories.length} active stories out of ${savedStories.length} total`);
        console.log('📊 Active stories details:', activeStories.map(s => ({ id: s._id, title: s.title, expiresAt: s.expiresAt })));
        
        return {
          success: true,
          data: activeStories
        };
      }
      
      // For regular users, use API
      console.log('📚 Using API for regular user stories');
      const response = await api.get('/social/stories/my-stories');
      console.log('📚 API response for user stories:', response.data);
      
      return {
        success: true,
        data: response.data.data || []
      };
      
    } catch (error: any) {
      console.error('❌ Enhanced Story Service - Error fetching user stories:', error);
      
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || error.message || 'Failed to fetch stories'
      };
    }
  }

  // Test method to get stories without expiration filter
  async getUserStoriesTest(): Promise<StoryResponse> {
    console.log('🧪 TEST - Enhanced Story Service - getUserStoriesTest called:', { userId: this.getUserKey() });
    
    if (this.isGoogleUser()) {
      console.log('🧪 TEST - Using localStorage for Google user stories');
      const storageKey = this.getStorageKey();
      const stories = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      return {
        success: true,
        data: stories
      };
    }
    
    // For regular users, use API test endpoint
    console.log('🧪 TEST - Using API test endpoint for regular user stories');
    const response = await api.get('/social/stories/my-stories-test');
    console.log('🧪 TEST - API response for user stories:', response.data);
    
    return response.data;
  }

  async getStoriesFeed(page: number = 1, limit: number = 20): Promise<StoryResponse> {
    try {
      if (this.isGoogleUser()) {
        console.log('🌐 Loading enhanced stories feed for Google user');
        
        // Get stories from global feed and user's own stories
        const globalStoriesKey = 'globalStoryFeed';
        const globalStories = JSON.parse(localStorage.getItem(globalStoriesKey) || '[]');
        console.log('🌐 Global stories from localStorage:', globalStories.length);
        
        // Also include stories from localStorage users simulation
        const mockNetworkStories = this.generateMockNetworkStories();
        console.log('🌐 Mock network stories:', mockNetworkStories.length);
        
        const allStories = [...globalStories, ...mockNetworkStories];
        console.log('🌐 Total stories before filtering:', allStories.length);
        
        // Filter active stories only
        const now = new Date();
        const activeStories = allStories.filter((story: StoryData) => {
          if (!story.expiresAt) return false;
          const expiresAt = new Date(story.expiresAt);
          return expiresAt > now;
        });
        console.log('🌐 Active stories after filtering:', activeStories.length);
        
        // Sort by creation date (newest first)
        activeStories.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        
        // Paginate results
        const start = (page - 1) * limit;
        const paginatedStories = activeStories.slice(start, start + limit);
        
        console.log(`📊 Returning ${paginatedStories.length} stories from enhanced feed`);
        
        return {
          success: true,
          data: paginatedStories
        };
      }
      
      // For regular users, try API first, then fallback to localStorage if needed
      console.log('🌐 Using API for regular user stories feed');
      try {
        const response = await api.get(`/social/stories?page=${page}&limit=${limit}`);
        console.log('🌐 API response for stories feed:', response.data);
        
        if (response.data && response.data.success && response.data.data) {
          return {
            success: true,
            data: response.data.data || []
          };
        } else {
          console.warn('⚠️ API returned empty or invalid data, trying localStorage fallback');
          throw new Error('API returned empty data');
        }
      } catch (apiError) {
        console.warn('⚠️ API call failed, trying localStorage fallback:', apiError);
        
        // Fallback to localStorage if API fails
        const globalStoriesKey = 'globalStoryFeed';
        const globalStories = JSON.parse(localStorage.getItem(globalStoriesKey) || '[]');
        
        const mockNetworkStories = this.generateMockNetworkStories();
        const allStories = [...globalStories, ...mockNetworkStories];
        
        // Filter active stories only
        const now = new Date();
        const activeStories = allStories.filter((story: StoryData) => {
          if (!story.expiresAt) return false;
          const expiresAt = new Date(story.expiresAt);
          return expiresAt > now;
        });
        
        // Sort by creation date (newest first)
        activeStories.sort((a, b) => 
          new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        );
        
        // Paginate results
        const start = (page - 1) * limit;
        const paginatedStories = activeStories.slice(start, start + limit);
        
        console.log(`📊 Fallback: Returning ${paginatedStories.length} stories from localStorage`);
        
        return {
          success: true,
          data: paginatedStories
        };
      }
      
    } catch (error: any) {
      console.error('❌ Error fetching stories feed:', error);
      
      return {
        success: false,
        data: [],
        error: error.response?.data?.error || error.message || 'Failed to fetch stories feed'
      };
    }
  }

  private generateMockNetworkStories(): StoryData[] {
    // Generate some mock network stories for better demo experience
    const mockStories: StoryData[] = [
      {
        _id: 'mock_story_1',
        type: 'achievement',
        title: 'Successfully Completed AWS Certification',
        content: 'Just passed my AWS Solutions Architect certification! The journey was challenging but incredibly rewarding. Looking forward to applying these cloud skills in upcoming projects.',
        tags: ['aws', 'certification', 'cloud', 'achievement'],
        visibility: 'public',
        author: {
          _id: 'mock_user_1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          profilePicture: null,
          company: 'Tech Innovations Inc.',
          jobTitle: 'Senior Developer'
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(), // 22 hours remaining
        isActive: true,
        viewers: [],
        likes: ['user_1', 'user_2'],
        shares: 0
      },
      {
        _id: 'mock_story_2',
        type: 'milestone',
        title: 'Started My New Role as Product Manager',
        content: 'Excited to announce that I\'ve started my new position as Product Manager at Digital Solutions Corp! Ready to lead innovative projects and work with amazing teams.',
        tags: ['career', 'newjob', 'productmanagement', 'milestone'],
        visibility: 'connections',
        author: {
          _id: 'mock_user_2',
          firstName: 'Michael',
          lastName: 'Chen',
          profilePicture: null,
          company: 'Digital Solutions Corp',
          jobTitle: 'Product Manager'
        },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 19 * 60 * 60 * 1000).toISOString(), // 19 hours remaining
        isActive: true,
        viewers: [],
        likes: ['user_3'],
        shares: 1
      }
    ];

    return mockStories;
  }

  async likeStory(storyId: string): Promise<StoryResponse> {
    try {
      // Check if this is a mock story ID (for Google users)
      if (storyId.startsWith('mock_story_') || storyId.startsWith('story_')) {
        console.log('👍 Liking mock story (local):', storyId);
        
        // Update in user's stories
        const storageKey = this.getStorageKey();
        const userStories = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const userStoryIndex = userStories.findIndex((s: StoryData) => s._id === storyId);
        if (userStoryIndex !== -1) {
          const currentUserId = this.getUserKey();
          const likes = userStories[userStoryIndex].likes || [];
          
          if (!likes.includes(currentUserId)) {
            likes.push(currentUserId);
            userStories[userStoryIndex].likes = likes;
            localStorage.setItem(storageKey, JSON.stringify(userStories));
          }
        }
        
        return {
          success: true,
          data: userStories[userStoryIndex] || null,
          message: 'Story liked successfully'
        };
      }
      
      if (this.isGoogleUser()) {
        console.log('👍 Liking story (local):', storyId);
        
        // Update in user's stories
        const storageKey = this.getStorageKey();
        const userStories = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const userStoryIndex = userStories.findIndex((s: StoryData) => s._id === storyId);
        if (userStoryIndex !== -1) {
          const currentUserId = this.getUserKey();
          const likes = userStories[userStoryIndex].likes || [];
          
          if (!likes.includes(currentUserId)) {
            likes.push(currentUserId);
            userStories[userStoryIndex].likes = likes;
            localStorage.setItem(storageKey, JSON.stringify(userStories));
          }
        }
        
        // Also update in global feed
        const globalStoriesKey = 'globalStoryFeed';
        const globalStories = JSON.parse(localStorage.getItem(globalStoriesKey) || '[]');
        const globalStoryIndex = globalStories.findIndex((s: StoryData) => s._id === storyId);
        
        if (globalStoryIndex !== -1) {
          const currentUserId = this.getUserKey();
          const likes = globalStories[globalStoryIndex].likes || [];
          
          if (!likes.includes(currentUserId)) {
            likes.push(currentUserId);
            globalStories[globalStoryIndex].likes = likes;
            localStorage.setItem(globalStoriesKey, JSON.stringify(globalStories));
          }
        }
        
        return {
          success: true,
          message: 'Story liked successfully'
        };
      }
      
      // For regular users, use API
      const response = await api.post(`/social/stories/${storyId}/like`);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
      
    } catch (error: any) {
      console.error('❌ Error liking story:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to like story'
      };
    }
  }

  async viewStory(storyId: string): Promise<StoryResponse> {
    try {
      // Check if this is a mock story ID (for Google users)
      if (storyId.startsWith('mock_story_') || storyId.startsWith('story_')) {
        console.log('👁️ Viewing mock story (local):', storyId);
        
        // For mock stories, handle locally without API call
        const storageKey = this.getStorageKey();
        const userStories = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const storyIndex = userStories.findIndex((s: StoryData) => s._id === storyId);
        if (storyIndex !== -1) {
          const currentUserId = this.getUserKey();
          const viewers = userStories[storyIndex].viewers || [];
          
          if (!viewers.includes(currentUserId)) {
            viewers.push(currentUserId);
            userStories[storyIndex].viewers = viewers;
            localStorage.setItem(storageKey, JSON.stringify(userStories));
          }
        }
        
        return {
          success: true,
          data: userStories[storyIndex] || null,
          message: 'Story viewed successfully'
        };
      }
      
      if (this.isGoogleUser()) {
        console.log('👁️ Viewing story (local):', storyId);
        
        // Update view count in local storage
        const storageKey = this.getStorageKey();
        const userStories = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const storyIndex = userStories.findIndex((s: StoryData) => s._id === storyId);
        if (storyIndex !== -1) {
          const currentUserId = this.getUserKey();
          const viewers = userStories[storyIndex].viewers || [];
          
          if (!viewers.includes(currentUserId)) {
            viewers.push(currentUserId);
            userStories[storyIndex].viewers = viewers;
            localStorage.setItem(storageKey, JSON.stringify(userStories));
          }
        }
        
        return {
          success: true,
          message: 'Story viewed successfully'
        };
      }
      
      // For regular users, use API
      const response = await api.post(`/social/stories/${storyId}/view`);
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
      
    } catch (error: any) {
      console.error('❌ Error viewing story:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to view story'
      };
    }
  }

  // Enhanced storage consistency check and repair method
  repairStorageConsistency(): void {
    console.log('🔧 Enhanced Story Service - Repairing storage consistency...');
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userKey = this.getUserKey();
      const storageKey = this.getStorageKey();
      
      console.log('🔧 Current user data:', { currentUser, userKey, storageKey });
      
      // Get all localStorage keys that might contain stories
      const allKeys = Object.keys(localStorage);
      const storyKeys = allKeys.filter(key => 
        key.includes('stories') || key.includes('Stories')
      );
      
      console.log('🔧 Found potential story keys:', storyKeys);
      
      // Check if user has stories under different key formats
      storyKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value && value !== '[]') {
          console.log(`🔧 Found stories under key ${key}:`, JSON.parse(value).length, 'stories');
        }
      });
      
      // If we don't have stories under the current key but have them elsewhere, consolidate
      const currentStories = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (currentStories.length === 0) {
        // Look for stories in other keys
        const legacyKeys = [
          `stories_${userKey}`,
          `userStories_${userKey}`,
          `stories_${currentUser.email}`,
          `enhancedStories_${currentUser.email}`,
          `enhancedStories_${currentUser._id}`,
          `enhancedStories_${currentUser.id}`
        ];
        
        let consolidatedStories: StoryData[] = [];
        
        legacyKeys.forEach(legacyKey => {
          const legacyStories = JSON.parse(localStorage.getItem(legacyKey) || '[]');
          if (legacyStories.length > 0) {
            console.log(`🔧 Found ${legacyStories.length} stories in legacy key ${legacyKey}`);
            consolidatedStories = [...consolidatedStories, ...legacyStories];
          }
        });
        
        if (consolidatedStories.length > 0) {
          // Remove duplicates based on _id
          const uniqueStories = consolidatedStories.filter((story, index, self) => 
            index === self.findIndex(s => s._id === story._id)
          );
          
          console.log(`🔧 Consolidating ${uniqueStories.length} unique stories to ${storageKey}`);
          localStorage.setItem(storageKey, JSON.stringify(uniqueStories));
          
          // Clean up old keys
          legacyKeys.forEach(legacyKey => {
            if (localStorage.getItem(legacyKey)) {
              console.log(`🔧 Removing legacy key ${legacyKey}`);
              localStorage.removeItem(legacyKey);
            }
          });
        }
      }
      
      console.log('🔧 Storage consistency repair completed');
      
    } catch (error) {
      console.error('❌ Error repairing storage consistency:', error);
    }
  }

  async deleteStory(storyId: string): Promise<StoryResponse> {
    try {
      if (this.isGoogleUser()) {
        console.log('🗑️ Deleting story (local):', storyId);
        
        // Remove from user's stories
        const storageKey = this.getStorageKey();
        const userStories = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const filteredUserStories = userStories.filter((s: StoryData) => s._id !== storyId);
        localStorage.setItem(storageKey, JSON.stringify(filteredUserStories));
        
        // Remove from global feed
        const globalStoriesKey = 'globalStoryFeed';
        const globalStories = JSON.parse(localStorage.getItem(globalStoriesKey) || '[]');
        const filteredGlobalStories = globalStories.filter((s: StoryData) => s._id !== storyId);
        localStorage.setItem(globalStoriesKey, JSON.stringify(filteredGlobalStories));
        
        return {
          success: true,
          message: 'Story deleted successfully'
        };
      }
      
      // For regular users, use API
      const response = await api.delete(`/social/stories/${storyId}`);
      
      return {
        success: true,
        message: response.data.message || 'Story deleted successfully'
      };
      
    } catch (error: any) {
      console.error('❌ Error deleting story:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete story'
      };
    }
  }

  async getStoryAnalytics(storyId: string): Promise<{ success: boolean; data?: StoryAnalytics; error?: string }> {
    try {
      if (this.isGoogleUser()) {
        console.log('📊 Getting story analytics (local):', storyId);
        
        const storageKey = this.getStorageKey();
        const userStories = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const story = userStories.find((s: StoryData) => s._id === storyId);
        
        if (!story) {
          return {
            success: false,
            error: 'Story not found'
          };
        }
        
        const analytics: StoryAnalytics = {
          viewers: (story.viewers || []).map((viewerId: string) => ({
            _id: viewerId,
            firstName: 'Viewer',
            lastName: 'User',
            profilePicture: null,
            viewedAt: new Date().toISOString()
          })),
          engagement: {
            views: story.viewers?.length || 0,
            likes: story.likes?.length || 0,
            shares: story.shares || 0,
            reach: (story.viewers?.length || 0) + (story.shares || 0) * 2
          }
        };
        
        return {
          success: true,
          data: analytics
        };
      }
      
      // For regular users, use API
      const response = await api.get(`/social/stories/${storyId}/analytics`);
      
      return {
        success: true,
        data: response.data.data
      };
      
    } catch (error: any) {
      console.error('❌ Error getting story analytics:', error);
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get story analytics'
      };
    }
  }

  // Utility method to check if user can create a story (24-hour restriction)
  async canUserCreateStory(): Promise<{ canCreate: boolean; remainingTime?: string; error?: string }> {
    try {
      const userStoriesResponse = await this.getUserStories();
      
      if (!userStoriesResponse.success) {
        return { canCreate: true }; // If we can't check, allow creation
      }
      
      const stories = Array.isArray(userStoriesResponse.data) ? userStoriesResponse.data : [userStoriesResponse.data];
      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recentStories = stories.filter(story => {
        if (!story || !story.createdAt) return false;
        const createdAt = new Date(story.createdAt);
        return createdAt > last24Hours;
      });
      
      if (recentStories.length === 0) {
        return { canCreate: true };
      }
      
      // Calculate remaining time
      const latestStory = recentStories.sort((a, b) => 
        new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
      )[0];
      
      const latestStoryTime = new Date(latestStory.createdAt || '');
      const nextAllowedTime = new Date(latestStoryTime.getTime() + 24 * 60 * 60 * 1000);
      const timeRemaining = nextAllowedTime.getTime() - now.getTime();
      
      if (timeRemaining > 0) {
        const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        return { 
          canCreate: false, 
          remainingTime: `${hours}h ${minutes}m`,
          error: `You can create your next story in ${hours}h ${minutes}m`
        };
      }
      
      return { canCreate: true };
      
    } catch (error: any) {
      console.error('❌ Error checking story creation eligibility:', error);
      return { canCreate: true }; // If check fails, allow creation
    }
  }

  // Clean up expired stories (utility method)
  cleanupExpiredStories(): void {
    try {
      const now = new Date();
      
      // Clean user stories
      const storageKey = this.getStorageKey();
      const userStories = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const activeUserStories = userStories.filter((story: StoryData) => {
        if (!story.expiresAt) return false;
        return new Date(story.expiresAt) > now;
      });
      localStorage.setItem(storageKey, JSON.stringify(activeUserStories));
      
      // Clean global stories
      const globalStoriesKey = 'globalStoryFeed';
      const globalStories = JSON.parse(localStorage.getItem(globalStoriesKey) || '[]');
      const activeGlobalStories = globalStories.filter((story: StoryData) => {
        if (!story.expiresAt) return false;
        return new Date(story.expiresAt) > now;
      });
      localStorage.setItem(globalStoriesKey, JSON.stringify(activeGlobalStories));
      
      console.log('🧹 Cleaned up expired stories');
    } catch (error) {
      console.error('❌ Error cleaning up expired stories:', error);
    }
  }
}

export const enhancedStoryService = new EnhancedStoryService();
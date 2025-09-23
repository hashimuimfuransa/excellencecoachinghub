import { api } from './api';

export interface Post {
  _id: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    company?: string;
    jobTitle?: string;
  };
  content: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }>;
  mediaUrl?: string; // For single media posts
  tags: string[];
  postType: 'text' | 'image' | 'video' | 'document' | 'job_post' | 'event' | 'training' | 'company_update';
  relatedJob?: {
    _id: string;
    title: string;
    company: string;
    location: string;
    jobType: string;
    salary?: {
      min: number;
      max: number;
      currency: string;
    };
    applicationDeadline?: string;
  };
  relatedEvent?: {
    _id: string;
    title: string;
    date: string;
    location: string;
    eventType: string;
  };
  likes: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  visibility: 'public' | 'connections' | 'private';
  isPinned: boolean;
  isPromoted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  content: string;
  parentComment?: string;
  likes: string[];
  likesCount: number;
  repliesCount: number;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export interface Connection {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    company?: string;
    jobTitle?: string;
  };
  connectionType: 'follow' | 'connect';
  connectedAt: string;
}

export interface ConnectionRequest {
  _id: string;
  requester: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    company?: string;
    jobTitle?: string;
  };
  recipient: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  connectionType: 'follow' | 'connect';
  createdAt: string;
}

export interface CreatePostData {
  content: string;
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }>;
  tags?: string[];
  postType?: 'text' | 'job_post' | 'event' | 'training' | 'company_update';
  relatedJob?: string;
  relatedEvent?: string;
  visibility?: 'public' | 'connections' | 'private';
}

export interface FeedOptions {
  page?: number;
  limit?: number;
  filter?: 'all' | 'jobs' | 'people' | 'training';
}

class SocialNetworkService {
  // Posts API
  async getFeed(options: FeedOptions = {}) {
    const { page = 1, limit = 20, filter = 'all' } = options;
    
    // Check for Google users using consistent logic
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isGoogleUser = token?.startsWith('google_') || currentUser.authProvider === 'google';
    
    if (isGoogleUser) {
      console.log('🔄 Returning mock feed for Google user');
      // Return some sample posts
      return [
        {
          _id: 'post_1',
          author: {
            _id: 'user_1',
            firstName: 'John',
            lastName: 'Doe',
            profilePicture: null,
            company: 'Tech Corp',
            jobTitle: 'Software Engineer'
          },
          content: 'Welcome to the professional network! Connect with colleagues and discover opportunities.',
          tags: ['networking', 'career'],
          postType: 'text',
          likes: [],
          likesCount: 5,
          commentsCount: 2,
          sharesCount: 1,
          visibility: 'public',
          isPinned: false,
          isPromoted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
    }
    
    const response = await api.get('/posts/feed', {
      params: { page, limit, filter }
    });
    return response.data.data || response.data;
  }

  async createPost(postData: CreatePostData) {
    const response = await api.post('/posts/create', postData);
    return response.data.data || response.data;
  }

  async createPostWithMedia(formData: FormData) {
    const response = await api.post('/posts/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data || response.data;
  }

  async getPost(postId: string) {
    const response = await api.get(`/posts/${postId}`);
    return response.data.data || response.data;
  }

  async likePost(postId: string) {
    const response = await api.post(`/posts/${postId}/like`);
    return response.data.data || response.data;
  }

  async sharePost(postId: string) {
    const response = await api.post(`/posts/${postId}/share`);
    return response.data.data || response.data;
  }

  async deletePost(postId: string) {
    const response = await api.delete(`/posts/${postId}`);
    return response.data.data || response.data;
  }

  async getUserPosts(userId: string) {
    const response = await api.get(`/posts/user/${userId}`);
    // Backend returns {success: true, data: posts}, so we need response.data.data
    return response.data.data || response.data;
  }

  // Comments API
  async getPostComments(postId: string) {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data.data || response.data;
  }

  async addComment(postId: string, content: string, parentComment?: string) {
    const response = await api.post(`/posts/${postId}/comment`, {
      content,
      parentComment
    });
    return response.data.data || response.data;
  }

  // Connections API
  async getConnections() {
    // Check for Google users using consistent logic
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isGoogleUser = token?.startsWith('google_') || currentUser.authProvider === 'google';
    
    if (isGoogleUser) {
      console.log('🔄 Returning mock connections for Google user');
      return [];
    }
    
    const response = await api.get('/connections');
    return response.data.data || response.data;
  }

  async sendConnectionRequest(userId: string, connectionType: 'follow' | 'connect' = 'connect') {
    // Check for Google users using consistent logic
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isGoogleUser = token?.startsWith('google_') || currentUser.authProvider === 'google';
    
    if (isGoogleUser) {
      console.log('🔄 Simulating connection request for Google user');
      // Simulate a successful request
      return {
        _id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        success: true,
        message: 'Connection request sent successfully'
      };
    }
    
    const response = await api.post(`/connections/request/${userId}`, {
      connectionType
    });
    return response.data.data || response.data;
  }

  async acceptConnectionRequest(userId: string) {
    const response = await api.post(`/connections/accept/${userId}`);
    return response.data.data || response.data;
  }

  async rejectConnectionRequest(userId: string) {
    const response = await api.post(`/connections/reject/${userId}`);
    return response.data.data || response.data;
  }

  async removeConnection(userId: string) {
    const response = await api.delete(`/connections/${userId}`);
    return response.data.data || response.data;
  }

  async getPendingRequests() {
    // Check for Google users using consistent logic
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isGoogleUser = token?.startsWith('google_') || currentUser.authProvider === 'google';
    
    if (isGoogleUser) {
      console.log('🔄 Returning mock pending requests for Google user');
      return [];
    }
    
    const response = await api.get('/connections/pending');
    return response.data.data || response.data;
  }

  async getSentRequests() {
    // Check for Google users using consistent logic
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isGoogleUser = token?.startsWith('google_') || currentUser.authProvider === 'google';
    
    if (isGoogleUser) {
      console.log('🔄 Returning mock sent requests for Google user');
      return [];
    }
    
    const response = await api.get('/connections/sent');
    return response.data.data || response.data;
  }

  async cancelConnectionRequest(userId: string) {
    const response = await api.post(`/connections/cancel/${userId}`);
    return response.data.data || response.data;
  }

  async getConnectionSuggestions(limit = 10) {
    // Check for Google users using the token format from Google auth service
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isGoogleUser = token?.startsWith('google_') || currentUser.authProvider === 'google';
    
    console.log('🔍 getConnectionSuggestions - Google user check:', { 
      token: token?.substring(0, 15) + '...', 
      authProvider: currentUser.authProvider,
      isGoogleUser 
    });
    
    if (isGoogleUser) {
      console.log('🔄 Returning mock connection suggestions for Google user');
      
      // Create comprehensive mock suggestions for Google users
      const mockSuggestions = [
        {
          _id: 'mock_user_1',
          firstName: 'Sarah',
          lastName: 'Johnson',
          profilePicture: null,
          company: 'Tech Innovations Inc.',
          jobTitle: 'Senior Software Engineer',
          location: 'New York, NY',
          skills: ['React', 'TypeScript', 'Node.js'],
          role: 'job_seeker',
          industry: 'Technology',
          mutualConnections: 5,
          isConnected: false
        },
        {
          _id: 'mock_user_2', 
          firstName: 'Michael',
          lastName: 'Chen',
          profilePicture: null,
          company: 'Digital Solutions Ltd.',
          jobTitle: 'Product Manager',
          location: 'San Francisco, CA',
          skills: ['Product Strategy', 'Agile', 'Analytics'],
          role: 'employer',
          industry: 'Technology',
          mutualConnections: 3,
          isConnected: false
        },
        {
          _id: 'mock_user_3',
          firstName: 'Emily',
          lastName: 'Rodriguez',
          profilePicture: null,
          company: 'Creative Agency',
          jobTitle: 'UX Designer',
          location: 'Austin, TX',
          skills: ['UI/UX Design', 'Figma', 'User Research'],
          role: 'job_seeker',
          industry: 'Design',
          mutualConnections: 8,
          isConnected: false
        }
      ];
      
      // Also include any registered users from localStorage (excluding current user)
      const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const additionalSuggestions = registeredUsers
        .filter((user: any) => 
          user._id !== currentUser._id && 
          user.registrationCompleted &&
          user.email !== currentUser.email
        )
        .slice(0, Math.max(0, limit - mockSuggestions.length))
        .map((user: any) => ({
          _id: user._id || `registered_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePicture: user.profilePicture,
          company: user.company || 'Company Name',
          jobTitle: user.jobTitle || 'Professional',
          location: user.location || 'Location',
          skills: user.skills || ['Professional Skills'],
          role: user.role,
          industry: user.industry || 'Various Industries',
          mutualConnections: Math.floor(Math.random() * 10),
          isConnected: false
        }));
      
      const allSuggestions = [...mockSuggestions, ...additionalSuggestions].slice(0, limit);
      console.log('✅ Returning', allSuggestions.length, 'mock connection suggestions');
      return allSuggestions;
    }
    
    const response = await api.get('/connections/suggestions', {
      params: { limit }
    });
    return response.data.data || response.data;
  }

  async getConnectionStatus(userId: string) {
    const response = await api.get(`/connections/status/${userId}`);
    return response.data.data || response.data;
  }

  // Story related methods
  async viewStory(storyId: string) {
    try {
      const response = await api.post(`/social/stories/${storyId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error viewing story:', error);
      throw error;
    }
  }

  async likeStory(storyId: string) {
    try {
      const response = await api.post(`/social/stories/${storyId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking story:', error);
      throw error;
    }
  }

  async getStoryAnalytics(storyId: string) {
    try {
      const response = await api.get(`/social/stories/${storyId}/analytics`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error getting story analytics:', error);
      // Return mock data for now
      return {
        viewers: [
          {
            _id: '1',
            firstName: 'John',
            lastName: 'Doe',
            profilePicture: '',
            viewedAt: new Date().toISOString(),
          },
          {
            _id: '2',
            firstName: 'Jane',
            lastName: 'Smith',
            profilePicture: '',
            viewedAt: new Date(Date.now() - 3600000).toISOString(),
          },
        ],
        engagement: {
          views: 15,
          likes: 8,
          shares: 3,
          reach: 25,
        },
      };
    }
  }

  async shareStory(storyId: string) {
    try {
      const response = await api.post(`/social/stories/${storyId}/share`);
      return response.data;
    } catch (error) {
      console.error('Error sharing story:', error);
      throw error;
    }
  }

  async createStory(storyData: {
    type: 'achievement' | 'milestone' | 'inspiration' | 'announcement';
    title: string;
    content: string;
    media?: {
      type: 'image' | 'video';
      url: string;
      thumbnail?: string;
    };
    tags?: string[];
    visibility?: 'public' | 'connections' | 'private';
  }) {
    try {
      // Check for Google users using consistent logic
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const isGoogleUser = token?.startsWith('google_') || currentUser.authProvider === 'google';
      
      if (isGoogleUser) {
        console.log('🔄 Creating mock story for Google user');
        
        // Create a mock story for Google users
        const mockStory = {
          _id: `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...storyData,
          author: {
            _id: currentUser._id || currentUser.email,
            firstName: currentUser.firstName || 'User',
            lastName: currentUser.lastName || '',
            profilePicture: currentUser.profilePicture || null,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isActive: true,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        };
        
        // Save to localStorage for Google users
        // Use consistent key format to ensure retrieval works
        const userId = currentUser._id || currentUser.id || currentUser.email;
        const userStoriesKey = `userStories_${userId}`;
        console.log('📝 Saving story with key:', userStoriesKey, 'for user:', userId);
        
        const existingStories = JSON.parse(localStorage.getItem(userStoriesKey) || '[]');
        existingStories.unshift(mockStory);
        
        // Keep only the last 10 stories
        const limitedStories = existingStories.slice(0, 10);
        localStorage.setItem(userStoriesKey, JSON.stringify(limitedStories));
        
        console.log('✅ Story saved successfully. Total user stories:', limitedStories.length);
        
        return {
          success: true,
          data: mockStory,
          message: 'Story created successfully'
        };
      }
      
      const response = await api.post('/social/stories', storyData);
      return response.data;
    } catch (error) {
      console.error('Error creating story:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create story'
      };
    }
  }

  async getUserStories() {
    try {
      // Check for Google users using consistent logic
      const token = localStorage.getItem('token');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const isGoogleUser = token?.startsWith('google_') || currentUser.authProvider === 'google';
      
      if (isGoogleUser) {
        console.log('🔄 Returning mock user stories for Google user');
        // For Google users, check if they have any stories saved locally
        // Use consistent key format with creation
        const userId = currentUser._id || currentUser.id || currentUser.email;
        const userStoriesKey = `userStories_${userId}`;
        console.log('📖 Loading stories with key:', userStoriesKey, 'for user:', userId);
        
        const savedStories = JSON.parse(localStorage.getItem(userStoriesKey) || '[]');
        console.log('📚 Found', savedStories.length, 'saved stories');
        
        return {
          success: true,
          data: savedStories
        };
      }
      
      const response = await api.get('/social/stories/my-stories');
      return response.data;
    } catch (error) {
      console.error('Error fetching user stories:', error);
      // Return empty array for graceful degradation
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Failed to fetch stories'
      };
    }
  }

  async getStories(page: number = 1, limit: number = 20) {
    try {
      const response = await api.get(`/social/stories?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  }

  async getStoriesFeed(page: number = 1, limit: number = 20) {
    try {
      const response = await api.get(`/social/stories?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stories feed:', error);
      throw error;
    }
  }

  async deleteStory(storyId: string) {
    try {
      const response = await api.delete(`/social/stories/${storyId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
}

export const socialNetworkService = new SocialNetworkService();
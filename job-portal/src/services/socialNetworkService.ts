import { api } from './api';
import { uploadApi } from './uploadService';

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
          // Return some sample posts with media
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
              media: [],
              likes: [],
              likesCount: 5,
              commentsCount: 2,
              sharesCount: 1,
              visibility: 'public',
              isPinned: false,
              isPromoted: false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              _id: 'post_2',
              author: {
                _id: 'user_2',
                firstName: 'Sarah',
                lastName: 'Johnson',
                profilePicture: null,
                company: 'Design Studio',
                jobTitle: 'UI/UX Designer'
              },
              content: 'Just finished working on this amazing project! Check out the design process and final result.',
              tags: ['design', 'ui', 'ux'],
              postType: 'text',
              media: [
                {
                  type: 'image',
                  url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&h=600&fit=crop',
                  thumbnail: 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=400&h=300&fit=crop'
                },
                {
                  type: 'image',
                  url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
                  thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop'
                }
              ],
              likes: [],
              likesCount: 12,
              commentsCount: 8,
              sharesCount: 3,
              visibility: 'public',
              isPinned: false,
              isPromoted: false,
              createdAt: new Date(Date.now() - 3600000).toISOString(),
              updatedAt: new Date(Date.now() - 3600000).toISOString()
            },
            {
              _id: 'post_3',
              author: {
                _id: 'user_3',
                firstName: 'Mike',
                lastName: 'Chen',
                profilePicture: null,
                company: 'Video Productions',
                jobTitle: 'Video Editor'
              },
              content: 'Behind the scenes of our latest video production! The team did an incredible job.',
              tags: ['video', 'production', 'teamwork'],
              postType: 'text',
              media: [
                {
                  type: 'video',
                  url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                  thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=600&fit=crop'
                }
              ],
              likes: [],
              likesCount: 8,
              commentsCount: 4,
              sharesCount: 2,
              visibility: 'public',
              isPinned: false,
              isPromoted: false,
              createdAt: new Date(Date.now() - 7200000).toISOString(),
              updatedAt: new Date(Date.now() - 7200000).toISOString()
            }
          ];
        }
    
    const response = await api.get('/posts/feed', {
      params: { page, limit, filter }
    });
    
    console.log('📊 Posts API Response:', response.data);
    const posts = response.data.data || response.data;
    console.log('📊 Processed Posts:', posts);
    
    // Log media information for debugging
    if (Array.isArray(posts)) {
      posts.forEach((post, index) => {
        console.log(`📊 Post ${index + 1}:`, {
          id: post._id,
          content: post.content?.substring(0, 50) + '...',
          mediaCount: post.media?.length || 0,
          media: post.media
        });
      });
    }
    
    return posts;
  }

  // Fetch posts from the Learning Hub community feed and map to SocialPost/Post shape
  async getLearningHubFeed(page: number = 1, limit: number = 20) {
    try {
      const response = await api.get(`/community/posts`, {
        params: { page, limit }
      });

      const payload = response.data?.data || response.data || {};
      const items = payload.posts || payload || [];

      // Map e-learning community posts to the job portal Post shape
      const mapped = (Array.isArray(items) ? items : []).map((p: any) => {
        const name = p?.author?.name || '';
        const [firstName, ...rest] = name.split(' ');
        const lastName = rest.join(' ');

        const media = (p?.attachments || [])
          .filter((a: any) => a && (a.type === 'image' || a.type === 'video'))
          .map((a: any) => ({
            type: a.type,
            url: a.url,
            thumbnail: a.thumbnail,
          }));

        return {
          _id: p.id || p._id,
          author: {
            _id: p?.author?.id || p?.author?._id || 'unknown',
            firstName: firstName || (p?.author?.firstName || ''),
            lastName: lastName || (p?.author?.lastName || ''),
            profilePicture: p?.author?.avatar || p?.author?.profilePicture,
            company: '',
            jobTitle: p?.author?.role === 'teacher' ? 'Teacher' : 'Student',
          },
          content: p?.content || '',
          media: media,
          tags: p?.tags || [],
          postType: (p?.type === 'achievement' ? 'company_update' : 'text') as any,
          likes: [],
          likesCount: p?.likes || 0,
          commentsCount: p?.comments || 0,
          sharesCount: p?.shares || 0,
          visibility: 'public',
          isPinned: false,
          isPromoted: false,
          createdAt: p?.timestamp || p?.createdAt || new Date().toISOString(),
          updatedAt: p?.updatedAt || p?.timestamp || new Date().toISOString(),
          // mark source for UI annotation
          source: 'learning_hub',
        } as any;
      });

      return mapped;
    } catch (error) {
      console.error('Error fetching Learning Hub feed:', error);
      return [];
    }
  }

  async createPost(postData: CreatePostData) {
    const response = await api.post('/posts/create', postData);
    return response.data.data || response.data;
  }

  async createPostWithMedia(formData: FormData) {
    // Check for Google users using consistent logic
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isGoogleUser = token?.startsWith('google_') || currentUser.authProvider === 'google';
    
    if (isGoogleUser) {
      console.log('🔄 Creating mock post for Google user');
      
      // Extract data from FormData for Google users
      const content = formData.get('content') as string;
      const postType = formData.get('postType') as string || 'text';
      const visibility = formData.get('visibility') as string || 'public';
      const tags = formData.getAll('tags[]') as string[];
      
      // Create a mock post for Google users
      const mockPost = {
        _id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        author: {
          _id: currentUser._id || currentUser.email,
          firstName: currentUser.firstName || 'User',
          lastName: currentUser.lastName || '',
          profilePicture: currentUser.profilePicture || null,
          company: currentUser.company || 'Company',
          jobTitle: currentUser.jobTitle || 'Professional'
        },
        content: content || 'New post',
        media: [], // For now, we'll handle media separately for Google users
        tags: tags || [],
        postType: postType || 'text',
        likes: [],
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        visibility: visibility || 'public',
        isPinned: false,
        isPromoted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Mock post created successfully:', mockPost);
      return mockPost;
    }
    
    const response = await uploadApi.post('/posts/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000, // 5 minutes for file uploads
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        console.log(`📤 Upload progress: ${percentCompleted}%`);
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

  async likeComment(commentId: string) {
    const response = await api.post(`/comments/${commentId}/like`);
    return response.data.data || response.data;
  }

  async unlikeComment(commentId: string) {
    const response = await api.delete(`/comments/${commentId}/like`);
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
      const mockResponse = {
        _id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        success: true,
        message: 'Connection request sent successfully'
      };
      
      // Note: For Google users, notifications are handled by the backend
      // when the actual connection request is processed
      
      return mockResponse;
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
      // Check if this is a mock story ID (for Google users)
      if (storyId.startsWith('mock_story_') || storyId.startsWith('story_')) {
        console.log('👁️ Viewing mock story (local):', storyId);
        
        // For mock stories, handle locally without API call
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser._id || currentUser.id || currentUser.email;
        const userStoriesKey = `userStories_${userId}`;
        const userStories = JSON.parse(localStorage.getItem(userStoriesKey) || '[]');
        
        const storyIndex = userStories.findIndex((s: any) => s._id === storyId);
        if (storyIndex !== -1) {
          const viewers = userStories[storyIndex].viewers || [];
          
          if (!viewers.includes(userId)) {
            viewers.push(userId);
            userStories[storyIndex].viewers = viewers;
            localStorage.setItem(userStoriesKey, JSON.stringify(userStories));
          }
        }
        
        return {
          success: true,
          data: userStories[storyIndex] || null,
          message: 'Story viewed successfully'
        };
      }
      
      const response = await api.post(`/social/stories/${storyId}/view`);
      return response.data;
    } catch (error) {
      console.error('Error viewing story:', error);
      throw error;
    }
  }

  async likeStory(storyId: string) {
    try {
      // Check if this is a mock story ID (for Google users)
      if (storyId.startsWith('mock_story_') || storyId.startsWith('story_')) {
        console.log('👍 Liking mock story (local):', storyId);
        
        // For mock stories, handle locally without API call
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = currentUser._id || currentUser.id || currentUser.email;
        const userStoriesKey = `userStories_${userId}`;
        const userStories = JSON.parse(localStorage.getItem(userStoriesKey) || '[]');
        
        const storyIndex = userStories.findIndex((s: any) => s._id === storyId);
        if (storyIndex !== -1) {
          const likes = userStories[storyIndex].likes || [];
          
          if (!likes.includes(userId)) {
            likes.push(userId);
            userStories[storyIndex].likes = likes;
            localStorage.setItem(userStoriesKey, JSON.stringify(userStories));
          }
        }
        
        return {
          success: true,
          data: userStories[storyIndex] || null,
          message: 'Story liked successfully'
        };
      }
      
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
      console.log('📚 Fetching stories from API...');
      const response = await api.get(`/social/stories?page=${page}&limit=${limit}`);
      console.log('📚 Stories API Response:', response.data);
      
      const stories = response.data.data || response.data;
      console.log('📚 Processed Stories:', stories);
      
      // Log story information for debugging
      if (Array.isArray(stories)) {
        stories.forEach((story, index) => {
          console.log(`📚 Story ${index + 1}:`, {
            id: story._id,
            title: story.title,
            author: story.author?.firstName + ' ' + story.author?.lastName,
            type: story.type,
            hasMedia: !!story.media,
            mediaType: story.media?.type
          });
        });
      }
      
      return stories;
    } catch (error) {
      console.error('Error fetching stories feed:', error);
      
      // Return empty array instead of mock data to encourage real data usage
      console.log('📚 No stories available from API, returning empty array');
      return [];
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

  // Connections API
  async getSuggestedConnections() {
    try {
      console.log('👥 Fetching suggested connections from API...');
      const response = await api.get('/connections/suggestions');
      console.log('👥 Suggested connections API response:', response.data);
      
      const connections = response.data.data || response.data;
      console.log('👥 Processed suggested connections:', connections);
      
      // Log connection information for debugging
      if (Array.isArray(connections)) {
        connections.forEach((connection, index) => {
          console.log(`👥 Connection ${index + 1}:`, {
            id: connection._id,
            name: connection.firstName + ' ' + connection.lastName,
            company: connection.company,
            jobTitle: connection.jobTitle,
            mutualConnections: connection.mutualConnections || 0
          });
        });
      }
      
      return connections;
    } catch (error) {
      console.error('Error fetching suggested connections:', error);
      
      // Return empty array instead of mock data to encourage real data usage
      console.log('👥 No suggested connections available from API, returning empty array');
      return [];
    }
  }


  async acceptConnectionRequest(requestId: string) {
    try {
      console.log('✅ Accepting connection request:', requestId);
      const response = await api.post(`/connections/accept/${requestId}`);
      console.log('✅ Connection acceptance response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error accepting connection request:', error);
      throw error;
    }
  }

  async rejectConnectionRequest(requestId: string) {
    try {
      console.log('❌ Rejecting connection request:', requestId);
      const response = await api.post(`/connections/reject/${requestId}`);
      console.log('❌ Connection rejection response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      throw error;
    }
  }

  // Search functionality
  async searchPosts(query: string) {
    try {
      console.log('🔍 Searching posts with query:', query);
      const response = await api.get(`/posts/search?q=${encodeURIComponent(query)}`);
      console.log('🔍 Posts search results:', response.data);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error searching posts:', error);
      return [];
    }
  }

  async searchUsers(query: string) {
    try {
      console.log('👥 Searching users with query:', query);
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      console.log('👥 Users search results:', response.data);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  async searchJobs(query: string) {
    try {
      console.log('💼 Searching jobs with query:', query);
      const response = await api.get(`/jobs/search?q=${encodeURIComponent(query)}`);
      console.log('💼 Jobs search results:', response.data);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error searching jobs:', error);
      return [];
    }
  }

  async searchCompanies(query: string) {
    try {
      console.log('🏢 Searching companies with query:', query);
      const response = await api.get(`/companies/search?q=${encodeURIComponent(query)}`);
      console.log('🏢 Companies search results:', response.data);
      return response.data.data || response.data || [];
    } catch (error) {
      console.error('Error searching companies:', error);
      return [];
    }
  }
}

export const socialNetworkService = new SocialNetworkService();
import api from './api';

export interface SearchUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  role: string;
  title?: string;
  company?: string;
  location?: string;
  skills?: string[];
  connections?: number;
  isConnected?: boolean;
  isConnectionPending?: boolean;
}

export interface SearchJob {
  _id: string;
  title: string;
  company: {
    _id: string;
    name: string;
    logo?: string;
  };
  location: string;
  type: string;
  level: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  skills: string[];
  postedAt: string;
  deadline: string;
  isRemote: boolean;
  isSaved?: boolean;
}

export interface SearchPost {
  _id: string;
  content: string;
  postType: 'text' | 'job_post' | 'event' | 'training' | 'company_update';
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    title?: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  tags?: string[];
  media?: Array<{
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
  }>;
}

export interface SearchResults {
  users: SearchUser[];
  jobs: SearchJob[];
  posts: SearchPost[];
  total: {
    users: number;
    jobs: number;
    posts: number;
  };
}

export interface SearchFilters {
  type?: 'all' | 'users' | 'jobs' | 'posts';
  location?: string;
  jobType?: string[];
  experienceLevel?: string[];
  skills?: string[];
  postedWithin?: '1d' | '3d' | '7d' | '30d';
  sortBy?: 'relevance' | 'recent' | 'popular';
  page?: number;
  limit?: number;
}

class SearchService {
  // Comprehensive search across users, jobs, and posts
  async search(query: string, filters: SearchFilters = {}): Promise<SearchResults> {
    try {
      const response = await api.get('/search', {
        params: {
          q: query,
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error performing search:', error);
      throw error;
    }
  }

  // Search specifically for users
  async searchUsers(query: string, filters: Partial<SearchFilters> = {}): Promise<{ users: SearchUser[]; total: number }> {
    try {
      const response = await api.get('/search/users', {
        params: {
          q: query,
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Search specifically for jobs
  async searchJobs(query: string, filters: Partial<SearchFilters> = {}): Promise<{ jobs: SearchJob[]; total: number }> {
    try {
      const response = await api.get('/search/jobs', {
        params: {
          q: query,
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching jobs:', error);
      throw error;
    }
  }

  // Search specifically for posts
  async searchPosts(query: string, filters: Partial<SearchFilters> = {}): Promise<{ posts: SearchPost[]; total: number }> {
    try {
      const response = await api.get('/search/posts', {
        params: {
          q: query,
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  }

  // Get search suggestions as user types
  async getSuggestions(query: string): Promise<{
    users: string[];
    jobs: string[];
    skills: string[];
    companies: string[];
  }> {
    try {
      const response = await api.get('/search/suggestions', {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return {
        users: [],
        jobs: [],
        skills: [],
        companies: [],
      };
    }
  }

  // Get trending/popular searches
  async getTrendingSearches(): Promise<{
    queries: string[];
    users: SearchUser[];
    jobs: SearchJob[];
    skills: string[];
  }> {
    try {
      const response = await api.get('/search/trending');
      return response.data;
    } catch (error) {
      console.error('Error getting trending searches:', error);
      return {
        queries: [],
        users: [],
        jobs: [],
        skills: [],
      };
    }
  }

  // Save search history
  async saveSearch(query: string, type: string = 'all'): Promise<void> {
    try {
      await api.post('/search/history', {
        query,
        type,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error saving search:', error);
      // Don't throw error for history saving
    }
  }

  // Get user's search history
  async getSearchHistory(limit: number = 10): Promise<Array<{
    query: string;
    type: string;
    timestamp: string;
  }>> {
    try {
      const response = await api.get(`/search/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  // Clear search history
  async clearSearchHistory(): Promise<void> {
    try {
      await api.delete('/search/history');
    } catch (error) {
      console.error('Error clearing search history:', error);
      throw error;
    }
  }
}

export default new SearchService();
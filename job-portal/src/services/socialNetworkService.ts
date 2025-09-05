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
    const response = await api.post('/posts/create-with-media', formData, {
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
    const response = await api.get('/connections');
    return response.data.data || response.data;
  }

  async sendConnectionRequest(userId: string, connectionType: 'follow' | 'connect' = 'connect') {
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
    const response = await api.get('/connections/pending');
    return response.data.data || response.data;
  }

  async getSentRequests() {
    const response = await api.get('/connections/sent');
    return response.data.data || response.data;
  }

  async cancelConnectionRequest(userId: string) {
    const response = await api.post(`/connections/cancel/${userId}`);
    return response.data.data || response.data;
  }

  async getConnectionSuggestions(limit = 10) {
    const response = await api.get('/connections/suggestions', {
      params: { limit }
    });
    return response.data.data || response.data;
  }

  async getConnectionStatus(userId: string) {
    const response = await api.get(`/connections/status/${userId}`);
    return response.data.data || response.data;
  }
}

export const socialNetworkService = new SocialNetworkService();
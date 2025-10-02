import api from './api';

// Interfaces
export interface IPost {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    role: 'student' | 'teacher';
    verified?: boolean;
  };
  content: string;
  type: 'text' | 'achievement' | 'question' | 'announcement';
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked: boolean;
  tags: string[];
  attachments?: {
    type: 'image' | 'video' | 'document';
    url: string;
    name: string;
  }[];
  achievement?: {
    title: string;
    description: string;
    icon: string;
    points: number;
  };
}

export interface IGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  avatar?: string;
  coverImage?: string;
  memberCount: number;
  maxMembers?: number;
  isPrivate: boolean;
  isJoined: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  createdAt: string;
  lastActivity: string;
  tags: string[];
  rules: string[];
  recentPosts: number;
  upcomingEvents: number;
}

export interface IAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'engagement' | 'milestone' | 'special';
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
  requirements: {
    type: 'lessons_completed' | 'time_spent' | 'quiz_score' | 'streak' | 'points_earned';
    target: number;
    current: number;
    description: string;
  }[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  sharedBy?: number;
  likes?: number;
}

export interface ITeacher {
  id: string;
  name: string;
  title: string;
  avatar?: string;
  coverImage?: string;
  bio: string;
  specialties: string[];
  experience: number;
  rating: number;
  totalRatings: number;
  studentsCount: number;
  coursesCount: number;
  isOnline: boolean;
  isVerified: boolean;
  isFollowing: boolean;
  location?: string;
  education: string[];
  certifications: string[];
  socialLinks: {
    website?: string;
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  recentCourses: {
    id: string;
    title: string;
    students: number;
    rating: number;
  }[];
  availability: {
    timezone: string;
    schedule: string;
  };
}

export interface IMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type: 'text' | 'system' | 'image' | 'file';
  attachments?: {
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }[];
  isOwn: boolean;
}

export interface IChatContact {
  id: string;
  name: string;
  avatar?: string;
  role: 'student' | 'teacher';
  isOnline: boolean;
  lastSeen: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isGroup: boolean;
  groupMembers?: number;
  isPinned: boolean;
  isMuted: boolean;
}

// API Response Types
export interface PostsResponse {
  posts: IPost[];
  total: number;
  page: number;
  limit: number;
}

export interface GroupsResponse {
  groups: IGroup[];
  total: number;
  page: number;
  limit: number;
}

export interface AchievementsResponse {
  achievements: IAchievement[];
  total: number;
  page: number;
  limit: number;
}

export interface TeachersResponse {
  teachers: ITeacher[];
  total: number;
  page: number;
  limit: number;
}

export interface MessagesResponse {
  messages: IMessage[];
  total: number;
  page: number;
  limit: number;
}

export interface ContactsResponse {
  contacts: IChatContact[];
  total: number;
}

// Community Service
class CommunityService {
  // Posts
  async getPosts(page = 1, limit = 20): Promise<PostsResponse> {
    const response = await api.get(`/community/posts?page=${page}&limit=${limit}`);
    return response.data;
  }

  async createPost(postData: {
    content: string;
    type: 'text' | 'achievement' | 'question' | 'announcement';
    tags: string[];
    attachments?: any[];
  }): Promise<IPost> {
    const response = await api.post('/community/posts', postData);
    return response.data;
  }

  async likePost(postId: string): Promise<void> {
    await api.post(`/community/posts/${postId}/like`, { action: 'like' });
  }

  async unlikePost(postId: string): Promise<void> {
    await api.post(`/community/posts/${postId}/like`, { action: 'unlike' });
  }

  async sharePost(postId: string, platform: string = 'internal', message?: string): Promise<any> {
    const response = await api.post(`/community/posts/${postId}/share`, {
      platform,
      message
    });
    return response.data;
  }

  async bookmarkPost(postId: string): Promise<void> {
    await api.post(`/community/posts/${postId}/bookmark`, { action: 'bookmark' });
  }

  async unbookmarkPost(postId: string): Promise<void> {
    await api.post(`/community/posts/${postId}/bookmark`, { action: 'unbookmark' });
  }

  // Groups
  async getGroups(page = 1, limit = 20): Promise<GroupsResponse> {
    const response = await api.get(`/community/groups?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getMyGroups(): Promise<IGroup[]> {
    const response = await api.get('/community/groups/my');
    return response.data;
  }

  async createGroup(groupData: {
    name: string;
    description: string;
    category: string;
    isPrivate: boolean;
    tags: string[];
  }): Promise<IGroup> {
    const response = await api.post('/community/groups', groupData);
    return response.data;
  }

  async joinGroup(groupId: string): Promise<void> {
    await api.post(`/community/groups/${groupId}/join`);
  }

  async leaveGroup(groupId: string): Promise<void> {
    await api.delete(`/community/groups/${groupId}/leave`);
  }

  // Achievements
  async getAchievements(page = 1, limit = 20): Promise<AchievementsResponse> {
    const response = await api.get(`/community/achievements?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getMyAchievements(): Promise<IAchievement[]> {
    const response = await api.get('/community/achievements/my');
    return response.data;
  }

  async shareAchievement(achievementId: string): Promise<void> {
    await api.post(`/community/achievements/${achievementId}/share`);
  }

  async likeAchievement(achievementId: string): Promise<void> {
    await api.post(`/community/achievements/${achievementId}/like`);
  }

  // Teachers
  async getTeachers(page = 1, limit = 20, filters?: {
    specialty?: string;
    online?: boolean;
    following?: boolean;
  }): Promise<TeachersResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters?.specialty) params.append('specialty', filters.specialty);
    if (filters?.online !== undefined) params.append('online', filters.online.toString());
    if (filters?.following !== undefined) params.append('following', filters.following.toString());

    const response = await api.get(`/community/teachers?${params.toString()}`);
    return response.data;
  }

  async followTeacher(teacherId: string): Promise<void> {
    await api.post(`/community/teachers/${teacherId}/follow`);
  }

  async unfollowTeacher(teacherId: string): Promise<void> {
    await api.delete(`/community/teachers/${teacherId}/follow`);
  }

  // Chat
  async getContacts(): Promise<ContactsResponse> {
    const response = await api.get('/community/chat/contacts');
    return response.data;
  }

  async getMessages(contactId: string, page = 1, limit = 50): Promise<MessagesResponse> {
    const response = await api.get(`/community/chat/contacts/${contactId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  }

  async sendMessage(contactId: string, messageData: {
    content: string;
    type: 'text' | 'image' | 'file';
    attachments?: any[];
  }): Promise<IMessage> {
    const response = await api.post(`/community/chat/contacts/${contactId}/messages`, messageData);
    return response.data;
  }

  async markMessagesAsRead(contactId: string): Promise<void> {
    await api.put(`/community/chat/contacts/${contactId}/read`);
  }

  // Search
  async searchPosts(query: string, page = 1, limit = 20): Promise<PostsResponse> {
    const response = await api.get(`/community/search/posts?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  }

  async searchGroups(query: string, page = 1, limit = 20): Promise<GroupsResponse> {
    const response = await api.get(`/community/search/groups?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  }

  async searchTeachers(query: string, page = 1, limit = 20): Promise<TeachersResponse> {
    const response = await api.get(`/community/search/teachers?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
    return response.data;
  }

  // Notifications
  async getNotifications(page = 1, limit = 20): Promise<any[]> {
    const response = await api.get(`/community/notifications?page=${page}&limit=${limit}`);
    return response.data;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await api.put(`/community/notifications/${notificationId}/read`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await api.put('/community/notifications/read-all');
  }

  // File upload
  async uploadFiles(files: File[]): Promise<any> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await api.post('/community/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // Comments
  async getComments(postId: string, page: number = 1, limit: number = 10): Promise<any> {
    const response = await api.get(`/community/posts/${postId}/comments?page=${page}&limit=${limit}`);
    return response.data;
  }

  async createComment(postId: string, content: string, parentCommentId?: string): Promise<any> {
    const response = await api.post(`/community/posts/${postId}/comments`, {
      content,
      parentCommentId
    });
    return response.data;
  }

  async likeComment(commentId: string): Promise<any> {
    const response = await api.post(`/community/comments/${commentId}/like`, { action: 'like' });
    return response.data;
  }

  async unlikeComment(commentId: string): Promise<any> {
    const response = await api.post(`/community/comments/${commentId}/like`, { action: 'unlike' });
    return response.data;
  }

}

export const communityService = new CommunityService();
export default communityService;

import api from './api';

// Interfaces
export interface IPost {
  success: any;
  data: IPost;
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
  data: any;
  success: any;
  posts: IPost[];
  total: number;
  page: number;
  limit: number;
}

export interface TrendingResponse {
  posts: IPost[];
  groups: IGroup[];
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

export interface IUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  role: 'student' | 'teacher' | 'admin';
  isOnline: boolean;
  lastSeen?: string;
  company?: string;
  bio?: string;
  specializations?: string[];
}

// Community Service
class CommunityService {
  // Posts
  async getPosts(page = 1, limit = 20): Promise<PostsResponse> {
    const response = await api.get(`/community/posts?page=${page}&limit=${limit}`);
    return response.data;
  }

  async getTrending(limit = 10): Promise<TrendingResponse> {
    const response = await api.get(`/community/trending?limit=${limit}`);
    const payload = response.data?.data || response.data;
    return payload as TrendingResponse;
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

  async likePost(postId: string): Promise<any> {
    const response = await api.post(`/community/posts/${postId}/like`, { action: 'like' });
    return response.data;
  }

  async unlikePost(postId: string): Promise<any> {
    const response = await api.post(`/community/posts/${postId}/like`, { action: 'unlike' });
    return response.data;
  }

  async sharePost(postId: string, platform: string = 'internal', message?: string): Promise<any> {
    const response = await api.post(`/community/posts/${postId}/share`, {
      platform,
      message
    });
    return response.data;
  }

  async bookmarkPost(postId: string): Promise<any> {
    const response = await api.post(`/community/posts/${postId}/bookmark`, { action: 'bookmark' });
    return response.data;
  }

  async unbookmarkPost(postId: string): Promise<any> {
    const response = await api.post(`/community/posts/${postId}/bookmark`, { action: 'unbookmark' });
    return response.data;
  }

  async deletePost(postId: string): Promise<any> {
    const response = await api.delete(`/community/posts/${postId}`);
    return response.data;
  }

  // Groups
  async getGroups(page = 1, limit = 20): Promise<GroupsResponse> {
    const response = await api.get(`/community/groups?page=${page}&limit=${limit}`);
    return response.data.data || response.data;
  }

  async getMyGroups(): Promise<IGroup[]> {
    const response = await api.get('/community/groups/my');
    return response.data.data || response.data;
  }

  async createGroup(groupData: {
    name: string;
    description: string;
    category: string;
    isPrivate: boolean;
    tags: string[];
  }): Promise<IGroup> {
    const response = await api.post('/community/groups', groupData);
    return response.data.data || response.data;
  }

  async joinGroup(groupId: string): Promise<any> {
    const response = await api.post(`/community/groups/${groupId}/join`);
    return response.data;
  }

  async leaveGroup(groupId: string): Promise<any> {
    const response = await api.delete(`/community/groups/${groupId}/leave`);
    return response.data;
  }

  // Achievements
  async getAchievements(page = 1, limit = 20): Promise<AchievementsResponse> {
    const response = await api.get(`/community/achievements?page=${page}&limit=${limit}`);
    const payload = response.data?.data || response.data;
    // Normalize to AchievementsResponse shape { achievements, total, page, limit }
    if (payload?.achievements && payload?.pagination) {
      return {
        achievements: payload.achievements,
        total: payload.pagination.total,
        page: payload.pagination.page,
        limit: payload.pagination.limit,
      };
    }
    return payload;
  }

  async getMyAchievements(): Promise<IAchievement[]> {
    const response = await api.get('/community/achievements/my');
    return response.data?.data || response.data;
  }

  async shareAchievement(achievementId: string): Promise<any> {
    const response = await api.post(`/community/achievements/${achievementId}/share`);
    return response.data?.data || response.data;
  }

  async likeAchievement(achievementId: string): Promise<any> {
    const response = await api.post(`/community/achievements/${achievementId}/like`);
    return response.data?.data || response.data;
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

  async followTeacher(teacherId: string): Promise<any> {
    const response = await api.post(`/community/teachers/${teacherId}/follow`);
    return response.data;
  }

  async unfollowTeacher(teacherId: string): Promise<any> {
    const response = await api.delete(`/community/teachers/${teacherId}/follow`);
    return response.data;
  }

  // Chat
  async getContacts(): Promise<ContactsResponse> {
    const response = await api.get('/community/chat/contacts');
    return response.data;
  }

  async getMessages(chatId: string, page = 1, limit = 50): Promise<MessagesResponse> {
    const response = await api.get(`/chat/${chatId}/messages?page=${page}&limit=${limit}`);
    return response.data;
  }

  async sendMessage(chatId: string, messageData: {
    content: string;
    messageType: 'text' | 'image' | 'file' | 'audio';
    fileUrl?: string;
    fileName?: string;
    replyTo?: string;
  }): Promise<any> { 
    const response = await api.post(`/chat/${chatId}/message`, messageData);
    return response.data;
  }

  async markMessagesAsRead(chatId: string): Promise<void> {
    await api.put(`/chat/${chatId}/read`);
  }

  async deleteMessage(chatId: string, messageId: string): Promise<void> {
    await api.delete(`/chat/${chatId}/message/${messageId}`);
  }

  // File upload methods using Cloudinary like job portal
  async uploadImage(file: File): Promise<{fileUrl: string}> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'chat');
    const response = await api.post('/upload/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { fileUrl: response.data.data.url };
  }

  async uploadAudio(file: File): Promise<{fileUrl: string}> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'chat');
    const response = await api.post('/upload/media', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return { fileUrl: response.data.data.url };
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

  async markNotificationAsRead(notificationId: string): Promise<any> {
    const response = await api.put(`/community/notifications/${notificationId}/read`);
    return response.data;
  }

  async markAllNotificationsAsRead(): Promise<any> {
    const response = await api.put('/community/notifications/read-all');
    return response.data;
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

  // User management for chat
  async getUsers(params?: {
    query?: string;
    role?: 'student' | 'teacher';
    limit?: number;
  }): Promise<IUser[]> {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.append('query', params.query);
    if (params?.role) searchParams.append('type', params.role);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    
    const response = await api.get(`/chat/users/search?${searchParams.toString()}`);
    return response.data.data;
  }

  async getOnlineUsers(): Promise<IUser[]> {
    const response = await api.get('/chat/online-users');
    return response.data.data;
  }

  // Chat conversation management
  async getConversations(): Promise<any[]> {
    const response = await api.get('/chat/conversations');
    return response.data.data;
  }

  async createConversation(participantIds: string[], isGroup: boolean = false, groupName?: string, initialMessage?: string): Promise<any> {
    const response = await api.post('/chat/create', {
      participantIds,
      isGroup,
      groupName,
      initialMessage
    });
    return response.data.data;
  }

  // Group-specific methods
  async getGroupChats(): Promise<any> {
    const response = await api.get('/chat/conversations?type=group');
    return response.data.data;
  }

  async joinGroupChat(groupId: string): Promise<any> {
    const response = await api.post(`/chat/groups/${groupId}/join`);
    return response.data.data;
  }

  async leaveGroupChat(groupId: string): Promise<any> {
    const response = await api.delete(`/chat/groups/${groupId}/leave`);
    return response.data.data;
  }

  async createGroupChat(groupId: string): Promise<any> {
    const response = await api.post(`/community/groups/${groupId}/create-chat`);
    return response.data.data;
  }

  async joinGroupByCode(joinCode: string, userId: string): Promise<any> {
    const response = await api.post(`/community/groups/join-code/${joinCode}`, {}, {
      headers: {
        'userid': userId
      }
    });
    return response.data.data;
  }

  async getGroupMembers(groupId: string): Promise<any> {
    const response = await api.get(`/community/groups/${groupId}/members`);
    return response.data.data;
  }

  async deleteGroup(groupId: string): Promise<any> {
    const response = await api.delete(`/community/groups/${groupId}`);
    return response.data.data;
  }

  async updateGroupSettings(groupId: string, settings: any): Promise<any> {
    const response = await api.put(`/community/groups/${groupId}`, settings);
    return response.data.data;
  }

  async updateMemberRole(groupId: string, memberId: string, newRole: string): Promise<any> {
    const response = await api.post(`/community/groups/${groupId}/members/${memberId}/role`, { newRole });
    return response.data.data;
  }

  async removeMember(groupId: string, memberId: string): Promise<any> {
    const response = await api.delete(`/community/groups/${groupId}/members/${memberId}`);
    return response.data.data;
  }

  async generateJoinCode(groupId: string): Promise<any> {
    const response = await api.post(`/community/groups/${groupId}/generate-join-code`);
    return response.data.data;
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

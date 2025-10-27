export interface ChatUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: string;
  role: 'job_seeker' | 'employer' | 'admin';
  company?: string;
  title?: string;
  location?: string;
}

export interface ChatMessage {
  _id: string;
  sender: ChatUser;
  content: string;
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
  isRead: boolean;
  readBy: string[];
}

export interface ChatRoom {
  _id: string;
  participants: ChatUser[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequest {
  participantIds: string[];
  isGroup?: boolean;
  groupName?: string;
  initialMessage?: string;
}

export interface SendMessageRequest {
  content: string;
  messageType?: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
}

export interface ChatTypingIndicator {
  chatId: string;
  userId: string;
  isTyping: boolean;
}

export interface ChatStatus {
  isConnected: boolean;
  typingUsers: ChatTypingIndicator[];
  onlineUsers: string[];
}
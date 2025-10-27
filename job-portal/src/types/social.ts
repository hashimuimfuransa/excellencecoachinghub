export interface SocialPost {
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
  tags: string[];
  postType: 'text' | 'job_post' | 'event' | 'training' | 'company_update';
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

export interface SocialComment {
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
  replies?: SocialComment[];
}

export interface SocialConnection {
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
    role?: string;
  };
  recipient: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  connectionType: 'follow' | 'connect';
  createdAt: string;
}

export interface SentRequest {
  _id: string;
  recipient: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    company?: string;
    jobTitle?: string;
    role?: string;
  };
  requester: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  connectionType: 'follow' | 'connect';
  createdAt: string;
}

export interface SocialCompany {
  _id: string;
  name: string;
  description?: string;
  industry: string;
  website?: string;
  logo?: string;
  coverImage?: string;
  location: string;
  size: string;
  founded?: number;
  employees: string[];
  followers: string[];
  followersCount: number;
  jobsCount: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  isVerified: boolean;
  recentJobs?: Array<{
    _id: string;
    title: string;
    location: string;
    jobType: string;
    experienceLevel: string;
    applicationDeadline?: string;
  }>;
  isFollowing?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialEvent {
  _id: string;
  title: string;
  description: string;
  organizer: {
    _id: string;
    firstName?: string;
    lastName?: string;
    name?: string;
  };
  organizerType: 'User' | 'Company';
  eventType: 'training' | 'webinar' | 'workshop' | 'conference' | 'networking' | 'job_fair';
  date: string;
  endDate?: string;
  location: string;
  isOnline: boolean;
  meetingLink?: string;
  capacity?: number;
  attendees: string[];
  attendeesCount: number;
  price?: number;
  currency?: string;
  tags: string[];
  banner?: string;
  isPublic: boolean;
  registrationRequired: boolean;
  registrationDeadline?: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  isRegistered?: boolean;
  createdAt: string;
  updatedAt: string;
}
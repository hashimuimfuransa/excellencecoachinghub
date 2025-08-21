// Shared authentication types for Homepage

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  profilePicture?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User | null;
  token: string;
  refreshToken?: string;
  requiresRoleSelection?: boolean;
  googleUserData?: any;
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
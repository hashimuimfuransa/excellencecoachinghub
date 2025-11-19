import { apiPost, apiGet, handleApiResponse } from './api';

// Local type definitions
export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  company?: string;
  jobTitle?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  company?: string;
  jobTitle?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Log the credentials being sent for debugging
      console.log('AuthService: Sending login request with credentials:', {
        email: credentials.email,
        password: credentials.password ? '***' : '(empty)'
      });
      
      const response = await apiPost('/auth/login', credentials);
      const authData = handleApiResponse(response);
      
      // Store token and user data
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      
      return authData;
    } catch (error: any) {
      console.error('AuthService: Login error:', error);
      // Re-throw with better error handling for login failures
      if (error.response?.status === 401) {
        const errorData = error.response.data;
        const enhancedError = new Error(errorData.message || errorData.error || 'Authentication failed');
        (enhancedError as any).response = error.response;
        throw enhancedError;
      }
      throw error;
    }
  }

  // Register user
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await apiPost('/auth/register', userData);
    const authData = handleApiResponse(response);
    
    // Store token and user data
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    
    return authData;
  }

  // Logout user
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.logout();
        return null;
      }
    }
    return null;
  }

  // Get current token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Refresh user data
  async refreshUser(): Promise<User> {
    const response = await apiGet('/auth/me');
    const user = handleApiResponse(response);
    
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    const response = await apiPost('/auth/forgot-password', { email });
    handleApiResponse(response);
  }

  // Reset password
  async resetPassword(token: string, password: string): Promise<void> {
    const response = await apiPost('/auth/reset-password', { token, password });
    handleApiResponse(response);
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await apiPost('/auth/change-password', {
      currentPassword,
      newPassword
    });
    handleApiResponse(response);
  }

  // Update profile
  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await apiPost('/auth/update-profile', userData);
    const user = handleApiResponse(response);
    
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.role === role;
  }

  // Check if user has any of the specified roles
  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }
}

export const authService = new AuthService();
export default authService;
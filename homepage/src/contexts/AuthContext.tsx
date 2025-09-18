import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { socialAuthService } from '../services/socialAuthService';
import type { User, AuthResponse } from '../types/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<AuthResponse>;
  completeGoogleRegistration: (userData: any, role: string) => Promise<void>;
  updateUser: (user: User) => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { authService } = await import('../services/authService');
        const token = authService.getToken();
        const storedUser = authService.getStoredUser();
        
        if (token && storedUser) {
          // Verify token is still valid by fetching current user
          try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
          } catch (error) {
            // Token is invalid, clear auth data
            authService.clearAuth();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        const { authService } = await import('../services/authService');
        authService.clearAuth();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const { authService } = await import('../services/authService');
      const response = await authService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setLoading(true);
      const { authService } = await import('../services/authService');
      const response = await authService.register({
        ...userData,
        role: userData.role || 'student'
      });
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      const { authService } = await import('../services/authService');
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if server logout fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    const { authService } = await import('../services/authService');
    await authService.forgotPassword(email);
  };

  const resetPassword = async (token: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const { authService } = await import('../services/authService');
      const response = await authService.resetPassword(token, password);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<AuthResponse> => {
    try {
      setLoading(true);
      const response = await socialAuthService.signInWithGoogle();
      
      // Only set user if not requiring role selection
      if (response.user && !response.requiresRoleSelection) {
        setUser(response.user);
      }
      
      return response;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleRegistration = async (userData: any, role: string): Promise<void> => {
    try {
      setLoading(true);
      const result = await socialAuthService.completeRegistration(userData, role);
      
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        throw new Error(result.error || 'Failed to complete registration');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (newUser: User): void => {
    setUser(newUser);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    loginWithGoogle,
    completeGoogleRegistration,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
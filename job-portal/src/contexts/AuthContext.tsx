import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Local User interface to avoid import issues
interface User {
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

// Local UserRole enum to avoid import issues
export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PROFESSIONAL = 'professional',
  EMPLOYER = 'employer',
  JOB_SEEKER = 'job_seeker'
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<{requiresRoleSelection?: boolean; userData?: any}>;
  register: (userData: any) => Promise<void>;
  registerWithGoogle: (userData: any, role: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  setUserData: (userData: User) => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  forgotPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component is unmounted
    
    const initializeAuth = async () => {
      try {
        const { default: authService } = await import('../services/authService');
        const currentUser = authService.getCurrentUser();
        const token = authService.getToken();
        
        // Only set user if component is still mounted and we have valid auth data
        if (isMounted && currentUser && token) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear invalid auth data without redirecting
        if (isMounted) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { default: authService } = await import('../services/authService');
      const authData = await authService.login({ email, password });
      setUser(authData.user);
    } catch (error) {
      console.error('❌ Login error in AuthContext:', error);
      throw error; // Re-throw the error to preserve error details
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<{requiresRoleSelection?: boolean; userData?: any}> => {
    try {
      setIsLoading(true);
      const { default: googleAuthService } = await import('../services/googleAuthService');
      const result = await googleAuthService.authenticate();
      
      if (!result.success) {
        throw new Error(result.error || 'Google authentication failed');
      }

      if (result.requiresRoleSelection && result.userData) {
        // Return user data for role selection
        return { requiresRoleSelection: true, userData: result.userData };
      }

      // If user already exists and is registered, we would have gotten user data back
      // For now, this will always require role selection for new Google users
      return { requiresRoleSelection: true, userData: result.userData };
    } catch (error) {
      console.error('❌ Google login error in AuthContext:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<void> => {
    try {
      setIsLoading(true);
      const { default: authService } = await import('../services/authService');
      const authData = await authService.register(userData);
      setUser(authData.user);
    } catch (error) {
      console.error('❌ Registration error in AuthContext:', error);
      throw error; // Re-throw the error to preserve error details
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithGoogle = async (userData: any, role: string): Promise<void> => {
    try {
      setIsLoading(true);
      const { default: authService } = await import('../services/authService');
      
      // Prepare Google registration data - only include fields expected by backend
      const googleRegisterData = {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        password: `google_oauth_${userData.googleId || Date.now().toString()}`, // Ensure at least 8 chars
        role: role,
        platform: 'job-portal'
      };
      
      console.log('🔍 Sending Google registration data:', {
        ...googleRegisterData,
        password: '[HIDDEN]' // Don't log the password
      });
      
      const authData = await authService.register(googleRegisterData);
      setUser(authData.user);
    } catch (error) {
      console.error('❌ Google registration error in AuthContext:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const { default: authService } = await import('../services/authService');
      authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
      // Clear localStorage directly if service fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      // Always clear the user state
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      const { default: authService } = await import('../services/authService');
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const setUserData = (userData: User): void => {
    console.log('🔄 AuthContext updating user data:', userData);
    setUser(userData);
    // Update localStorage as well
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      const { default: authService } = await import('../services/authService');
      await authService.forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithGoogle,
    register,
    registerWithGoogle,
    logout,
    updateUser,
    setUserData,
    hasRole,
    hasAnyRole,
    forgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
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
  loginWithGoogleMobile: () => Promise<{requiresRoleSelection?: boolean; userData?: any}>;
  createGoogleMobileButton: (element: HTMLElement) => Promise<{requiresRoleSelection?: boolean; userData?: any}>;
  handleGoogleOAuthCallback: () => Promise<{requiresRoleSelection?: boolean; userData?: any} | null>;
  getMobilePopupInstructions: () => string;
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
    const initializeAuth = async () => {
      try {
        const { default: authService } = await import('../services/authService');
        const token = authService.getToken();
        const storedUser = authService.getCurrentUser();
        
        console.log('🔍 AuthContext initialization:', { hasUser: !!storedUser, hasToken: !!token });
        
        // Simple validation like homepage - just check if both exist
        if (token && storedUser) {
          setUser(storedUser);
          console.log('✅ User session restored successfully:', storedUser.email);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear auth data on critical errors only
        try {
          const { default: authService } = await import('../services/authService');
          authService.logout();
        } catch (logoutError) {
          console.error('Error during cleanup logout:', logoutError);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
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
      const result = await googleAuthService.signIn();
      
      if (!result.success) {
        throw new Error(result.error || 'Google authentication failed');
      }

      if (result.requiresRoleSelection && result.userData) {
        // New user needs role selection
        return { requiresRoleSelection: true, userData: result.userData };
      }

      // User already exists and is logged in
      if (result.user && result.token) {
        setUser(result.user);
        return { requiresRoleSelection: false };
      }

      // Shouldn't reach here, but handle edge case
      throw new Error('Unexpected Google login result');
    } catch (error) {
      console.error('❌ Google login error in AuthContext:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogleMobile = async (): Promise<{requiresRoleSelection?: boolean; userData?: any}> => {
    try {
      setIsLoading(true);
      const { default: googleAuthService } = await import('../services/googleAuthService');
      const result = await googleAuthService.signInMobile();
      
      if (!result.success) {
        throw new Error(result.error || 'Mobile Google authentication failed');
      }

      if (result.requiresRoleSelection && result.userData) {
        // New user needs role selection
        return { requiresRoleSelection: true, userData: result.userData };
      }

      // User already exists and is logged in
      if (result.user && result.token) {
        setUser(result.user);
        return { requiresRoleSelection: false };
      }

      // Shouldn't reach here, but handle edge case
      throw new Error('Unexpected Google mobile login result');
    } catch (error) {
      console.error('❌ Google mobile login error in AuthContext:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createGoogleMobileButton = async (element: HTMLElement): Promise<{requiresRoleSelection?: boolean; userData?: any}> => {
    try {
      setIsLoading(true);
      const { default: googleAuthService } = await import('../services/googleAuthService');
      const result = await googleAuthService.createMobileButton(element);
      
      if (!result.success) {
        throw new Error(result.error || 'Mobile Google button authentication failed');
      }

      if (result.requiresRoleSelection && result.userData) {
        return { requiresRoleSelection: true, userData: result.userData };
      }

      if (result.user && result.token) {
        setUser(result.user);
        return { requiresRoleSelection: false };
      }

      throw new Error('Unexpected Google mobile button result');
    } catch (error) {
      console.error('❌ Google mobile button error in AuthContext:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleOAuthCallback = async (): Promise<{requiresRoleSelection?: boolean; userData?: any} | null> => {
    try {
      setIsLoading(true);
      const { default: googleAuthService } = await import('../services/googleAuthService');
      const result = await googleAuthService.handleOAuthCallback();
      
      if (!result) {
        return null; // Not an OAuth callback
      }

      if (!result.success) {
        throw new Error(result.error || 'OAuth callback failed');
      }

      if (result.requiresRoleSelection && result.userData) {
        return { requiresRoleSelection: true, userData: result.userData };
      }

      if (result.user && result.token) {
        setUser(result.user);
        return { requiresRoleSelection: false };
      }

      throw new Error('Unexpected OAuth callback result');
    } catch (error) {
      console.error('❌ OAuth callback error in AuthContext:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getMobilePopupInstructions = (): string => {
    try {
      const { default: googleAuthService } = require('../services/googleAuthService');
      return googleAuthService.getMobilePopupInstructions();
    } catch (error) {
      console.error('Error getting mobile popup instructions:', error);
      return `📱 Enable Popups on Mobile:
1. Open your browser settings
2. Find "Site Settings" or "Permissions"  
3. Look for "Pop-ups" or "Pop-ups and redirects"
4. Set to "Allow" for this site
5. Return here and try Google sign-in again`;
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
      const { default: googleAuthService } = await import('../services/googleAuthService');
      
      // Complete registration with the new Google auth service
      const result = await googleAuthService.completeRegistration(userData, role);
      
      if (!result.success) {
        throw new Error(result.error || 'Google registration failed');
      }

      // Set the user in context to log them in
      if (result.user) {
        setUser(result.user);
        console.log('✅ User set in AuthContext after Google registration:', result.user);
      } else {
        throw new Error('User data not returned from registration');
      }
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
    // Simple localStorage update like homepage
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
    loginWithGoogleMobile,
    createGoogleMobileButton,
    handleGoogleOAuthCallback,
    getMobilePopupInstructions,
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
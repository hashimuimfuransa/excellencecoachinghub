import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { IUser } from '../shared/types';

// Auth state interface
interface AuthState {
  user: IUser | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// Auth actions
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: IUser; token: string } }
  | { type: 'AUTH_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: IUser };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  loading: true,
  isAuthenticated: false,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        isAuthenticated: true,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        isAuthenticated: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        isAuthenticated: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

// Auth context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ user: IUser; token: string }>;
  register: (userData: any) => Promise<{ user: IUser; token: string }>;
  logout: () => void;
  updateUser: (user: IUser) => void;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export AuthContext for testing purposes
export { AuthContext };

// Auth provider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { authService } = await import('../services/authService');

        if (authService.isAuthenticated()) {
          try {
            // In production, if we have a token but can't reach the server,
            // still allow the app to load with cached user data
            const cachedUser = authService.getStoredUser();
            const token = authService.getToken();

            console.log('🔍 Auth Context - Cached user:', cachedUser);

            if (cachedUser && token) {
              // Try to verify with server, but don't block the app if it fails
              try {
                const user = await authService.getCurrentUser();
                console.log('🔍 Auth Context - Server user:', user);
                dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
              } catch (serverError) {
                console.warn('Server verification failed, using cached user data:', serverError);
                // Use cached user data if server is unavailable
                dispatch({ type: 'AUTH_SUCCESS', payload: { user: cachedUser, token } });
              }
            } else {
              authService.clearAuth();
              dispatch({ type: 'AUTH_FAILURE' });
            }
          } catch (error) {
            console.warn('Could not verify authentication:', error);
            authService.clearAuth();
            dispatch({ type: 'AUTH_FAILURE' });
          }
        } else {
          dispatch({ type: 'AUTH_FAILURE' });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        dispatch({ type: 'AUTH_FAILURE' });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<{ user: IUser; token: string }> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { authService } = await import('../services/authService');
      const authData = await authService.login({ email, password });

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: authData.user,
          token: authData.token
        }
      });

      return { user: authData.user, token: authData.token };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  // Register function
  const register = async (userData: any): Promise<{ user: IUser; token: string }> => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { authService } = await import('../services/authService');
      const authData = await authService.register(userData);

      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: authData.user,
          token: authData.token
        }
      });

      return { user: authData.user, token: authData.token };
    } catch (error) {
      dispatch({ type: 'AUTH_FAILURE' });
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      const { authService } = await import('../services/authService');
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Update user function
  const updateUser = (user: IUser): void => {
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  // Refresh user data from server
  const refreshUser = async (): Promise<void> => {
    try {
      const { authService } = await import('../services/authService');
      const user = await authService.getCurrentUser();
      updateUser(user);
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        // Set user data immediately from localStorage to avoid delays
        setUser(parsedUser);
        setIsAuthenticated(true);
        setLoading(false);
        
        // Verify token in the background
        authApi.getCurrentUser()
          .then(response => {
            const userData = response.data.user || response.data.data?.user || response.data;
            setUser(userData);
            // Update user data in localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            setIsAuthenticated(true);
          })
          .catch((error) => {
            // Only clear auth data if it's definitely an auth error
            // Not all errors mean the token is invalid
            if (error.response?.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
            } else {
              // For other errors (network issues, server down, etc.), 
              // keep the user logged in with cached data
              setUser(parsedUser);
              setIsAuthenticated(true);
            }
          });
      } catch (e) {
        console.error('Error parsing saved user data:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      // No token or user data in localStorage
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      let response;

      // Check if it's Google login
      if (credentials.googleToken) {
        response = await authApi.googleLogin(credentials.googleToken);
      } else {
        response = await authApi.login(credentials);
      }

      // Handle the response structure from the backend
      const responseData = response.data;
      const token = responseData.token || responseData.data?.token;
      const userData = responseData.user || responseData.data?.user || responseData.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        return { success: true, user: userData };
      } else {
        return { success: false, error: 'Login failed - no token received' };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.response?.data?.error || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      let response;

      // Check if it's Google registration
      if (userData.googleToken) {
        response = await authApi.googleLogin(userData.googleToken);
      } else {
        response = await authApi.register(userData);
      }

      // Handle the response structure from the backend
      const responseData = response.data;
      const token = responseData.token || responseData.data?.token;
      const newUser = responseData.user || responseData.data?.user || responseData.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(newUser));
        setUser(newUser);
        setIsAuthenticated(true);
        return { success: true, user: newUser };
      } else {
        return { success: false, error: 'Registration successful but login failed' };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.response?.data?.error || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (userData) => {
    try {
      const response = await authApi.updateProfile(userData);
      const updatedUser = response.data.user || response.data.data?.user || response.data;
      setUser(updatedUser);
      // Update user data in localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Update failed' };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
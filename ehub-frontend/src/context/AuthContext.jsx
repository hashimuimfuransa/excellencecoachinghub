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
          })
          .catch(() => {
            // If verification fails, clear auth data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          });
      } catch (e) {
        console.error('Error parsing saved user data:', e);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
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

      const token = response.data.token || response.data.data?.token;
      const userData = response.data.user || response.data.data?.user || response.data;

      if (token) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
      }
      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
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

      const { token, user: newUser } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
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
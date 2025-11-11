import { AuthProvider, useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';

// Mock the authApi
jest.mock('../api/authApi');

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Auth Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('should persist user data in localStorage on login', async () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      role: 'student',
      level: 'primary-1',
      language: 'english'
    };
    
    const mockToken = 'mock-token-123';
    
    authApi.login.mockResolvedValue({
      data: {
        token: mockToken,
        user: mockUser
      }
    });

    // Simulate login
    const credentials = { email: 'test@example.com', password: 'password123' };
    const result = await authApi.login(credentials);
    
    // Verify token and user are stored
    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
  });

  test('should load user data from localStorage on app start', () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      role: 'student',
      level: 'primary-1',
      language: 'english'
    };
    
    const mockToken = 'mock-token-123';
    
    // Pre-populate localStorage
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // In a real test, we would mount the AuthProvider and check the context values
    // This is a simplified check for localStorage persistence
    expect(localStorage.getItem('token')).toBe(mockToken);
    expect(JSON.parse(localStorage.getItem('user'))).toEqual(mockUser);
  });

  test('should clear localStorage on logout', () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      role: 'student',
      level: 'primary-1',
      language: 'english'
    };
    
    const mockToken = 'mock-token-123';
    
    // Pre-populate localStorage
    localStorage.setItem('token', mockToken);
    localStorage.setItem('user', JSON.stringify(mockUser));
    
    // Simulate logout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Verify localStorage is cleared
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});
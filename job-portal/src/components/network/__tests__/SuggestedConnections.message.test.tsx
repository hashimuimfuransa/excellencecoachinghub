import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import SuggestedConnections from '../SuggestedConnections';
import { socialNetworkService } from '../../../services/socialNetworkService';
import { chatService } from '../../../services/chatService';
import { AuthContext } from '../../../contexts/AuthContext';

// Mock the services
jest.mock('../../../services/socialNetworkService');
jest.mock('../../../services/chatService');

const mockSocialNetworkService = socialNetworkService as jest.Mocked<typeof socialNetworkService>;
const mockChatService = chatService as jest.Mocked<typeof chatService>;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: jest.fn(() => null),
    setItem: jest.fn(() => null),
    removeItem: jest.fn(() => null),
    clear: jest.fn(() => null),
  },
  writable: true,
});

const theme = createTheme();

const mockUser = {
  _id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'job_seeker' as const,
};

const mockSuggestedUser = {
  _id: 'user456',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  role: 'job_seeker',
  company: 'TechCorp',
  jobTitle: 'Software Engineer',
  skills: ['JavaScript', 'React', 'Node.js'],
  mutualConnections: 2,
};

const mockChat = {
  _id: 'chat123',
  participants: [mockUser, mockSuggestedUser],
  lastMessage: undefined,
  unreadCount: 0,
  isGroup: false,
  createdBy: 'user123',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAuthValue = {
    user: mockUser,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    isAuthenticated: true,
    loading: false,
    updateProfile: jest.fn(),
  };

  return (
    <AuthContext.Provider value={mockAuthValue}>
      {children}
    </AuthContext.Provider>
  );
};

const renderSuggestedConnections = () => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <MockAuthProvider>
          <SuggestedConnections />
        </MockAuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('SuggestedConnections - Message Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockSocialNetworkService.getSuggestedConnections.mockResolvedValue({
      success: true,
      data: [mockSuggestedUser],
      message: '',
    });
  });

  test('should display message button for suggested users', async () => {
    renderSuggestedConnections();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Look for both Connect and Message buttons
    const connectButton = screen.getByRole('button', { name: /connect/i });
    const messageButton = screen.getByRole('button', { name: /message/i });
    
    expect(connectButton).toBeInTheDocument();
    expect(messageButton).toBeInTheDocument();
  });

  test('should create chat and navigate to messages when message button clicked', async () => {
    mockChatService.createOrGetChat.mockResolvedValue(mockChat);

    renderSuggestedConnections();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click the message button
    const messageButton = screen.getByRole('button', { name: /message/i });
    fireEvent.click(messageButton);

    await waitFor(() => {
      // Verify chat service was called with correct user ID
      expect(mockChatService.createOrGetChat).toHaveBeenCalledWith(['user456']);
      
      // Verify sessionStorage was updated with chat selection data
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'selectedChatData',
        JSON.stringify({
          chatId: 'chat123',
          targetUserId: 'user456',
          targetUserName: 'Jane Smith',
          timestamp: expect.any(Number)
        })
      );
      
      // Verify navigation to messages page
      expect(mockNavigate).toHaveBeenCalledWith('/app/messages');
    });
  });

  test('should show loading state during message creation', async () => {
    // Mock a delayed response
    let resolveChat: (value: any) => void;
    const chatPromise = new Promise((resolve) => {
      resolveChat = resolve;
    });
    mockChatService.createOrGetChat.mockReturnValue(chatPromise as any);

    renderSuggestedConnections();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click the message button
    const messageButton = screen.getByRole('button', { name: /message/i });
    fireEvent.click(messageButton);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Starting...')).toBeInTheDocument();
    });

    // Button should be disabled during loading
    expect(messageButton).toBeDisabled();

    // Resolve the promise
    resolveChat!(mockChat);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/messages');
    });
  });

  test('should handle chat creation failure', async () => {
    const errorMessage = 'Failed to create chat';
    mockChatService.createOrGetChat.mockRejectedValue(new Error(errorMessage));

    renderSuggestedConnections();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click the message button
    const messageButton = screen.getByRole('button', { name: /message/i });
    fireEvent.click(messageButton);

    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText(/Failed to start chat with Jane Smith. Please try again./)).toBeInTheDocument();
      
      // Verify navigation was not called
      expect(mockNavigate).not.toHaveBeenCalled();
      
      // Verify sessionStorage was not updated
      expect(window.sessionStorage.setItem).not.toHaveBeenCalled();
    });

    await waitFor(() => {
      // Button should be re-enabled after error
      expect(messageButton).not.toBeDisabled();
      expect(screen.getByText('Message')).toBeInTheDocument();
    });
  });

  test('should prevent multiple simultaneous message requests', async () => {
    // Mock a delayed response
    let resolveChat: (value: any) => void;
    const chatPromise = new Promise((resolve) => {
      resolveChat = resolve;
    });
    mockChatService.createOrGetChat.mockReturnValue(chatPromise as any);

    renderSuggestedConnections();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click the message button
    const messageButton = screen.getByRole('button', { name: /message/i });
    fireEvent.click(messageButton);

    // Try to click again - should be disabled
    fireEvent.click(messageButton);

    // Should only be called once
    expect(mockChatService.createOrGetChat).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolveChat!(mockChat);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/messages');
    });
  });

  test('should display suggested user information correctly', async () => {
    renderSuggestedConnections();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('at TechCorp')).toBeInTheDocument();
      expect(screen.getByText('2 mutual connections')).toBeInTheDocument();
      
      // Check skills
      expect(screen.getByText('JavaScript')).toBeInTheDocument();
      expect(screen.getByText('React')).toBeInTheDocument();
    });
  });
});
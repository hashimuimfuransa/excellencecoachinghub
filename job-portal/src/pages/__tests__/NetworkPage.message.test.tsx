import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NetworkPage from '../NetworkPage';
import { socialNetworkService } from '../../services/socialNetworkService';
import { chatService } from '../../services/chatService';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the services
jest.mock('../../services/socialNetworkService');
jest.mock('../../services/chatService');

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

const mockConnection = {
  _id: 'connection123',
  user: {
    _id: 'user456',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    role: 'job_seeker',
    company: 'TechCorp',
    jobTitle: 'Software Engineer',
  },
  connectionType: 'connect' as const,
  createdAt: '2023-01-01T00:00:00.000Z',
};

const mockChat = {
  _id: 'chat123',
  participants: [mockUser, mockConnection.user],
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

const renderNetworkPage = () => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <MockAuthProvider>
          <NetworkPage />
        </MockAuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('NetworkPage - Message Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    mockSocialNetworkService.getConnections.mockResolvedValue({
      success: true,
      data: [mockConnection],
      message: '',
    });
    
    mockSocialNetworkService.getPendingRequests.mockResolvedValue({
      success: true,
      data: [],
      message: '',
    });
    
    mockSocialNetworkService.getSentRequests.mockResolvedValue({
      success: true,
      data: [],
      message: '',
    });
    
    mockSocialNetworkService.getConnectionSuggestions.mockResolvedValue({
      success: true,
      data: [],
      message: '',
    });
  });

  test('should display message button for connections', async () => {
    renderNetworkPage();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Look for the message button
    const messageButton = screen.getByRole('button', { name: /message/i });
    expect(messageButton).toBeInTheDocument();
  });

  test('should create chat and navigate to messages when message button clicked', async () => {
    mockChatService.createOrGetChat.mockResolvedValue(mockChat);

    renderNetworkPage();

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
          targetUserName: 'Jane',
          timestamp: expect.any(Number)
        })
      );
      
      // Verify navigation to messages page
      expect(mockNavigate).toHaveBeenCalledWith('/app/messages');
    });
  });

  test('should handle messaging loading state', async () => {
    // Mock a delayed response
    let resolveChat: (value: any) => void;
    const chatPromise = new Promise((resolve) => {
      resolveChat = resolve;
    });
    mockChatService.createOrGetChat.mockReturnValue(chatPromise as any);

    renderNetworkPage();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click the message button
    const messageButton = screen.getByRole('button', { name: /message/i });
    fireEvent.click(messageButton);

    // The message button should still be present (not disabled in this implementation)
    expect(messageButton).toBeInTheDocument();

    // Resolve the promise
    resolveChat!(mockChat);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/app/messages');
    });
  });

  test('should handle chat creation failure', async () => {
    const errorMessage = 'Failed to create chat';
    mockChatService.createOrGetChat.mockRejectedValue(new Error(errorMessage));

    renderNetworkPage();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click the message button
    const messageButton = screen.getByRole('button', { name: /message/i });
    fireEvent.click(messageButton);

    await waitFor(() => {
      // Verify error message is displayed
      expect(screen.getByText(/Failed to start chat with Jane. Please try again./)).toBeInTheDocument();
      
      // Verify navigation was not called
      expect(mockNavigate).not.toHaveBeenCalled();
      
      // Verify sessionStorage was not updated
      expect(window.sessionStorage.setItem).not.toHaveBeenCalled();
    });
  });

  test('should auto-select chat after creation', async () => {
    mockChatService.createOrGetChat.mockResolvedValue(mockChat);

    renderNetworkPage();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Click the message button
    const messageButton = screen.getByRole('button', { name: /message/i });
    fireEvent.click(messageButton);

    await waitFor(() => {
      // Verify the correct chat data was stored for auto-selection
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'selectedChatData',
        expect.stringContaining('"targetUserId":"user456"')
      );
    });
  });
});
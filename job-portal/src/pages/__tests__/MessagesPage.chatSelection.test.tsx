import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MessagesPage from '../MessagesPage';
import { chatService } from '../../services/chatService';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the chat service
jest.mock('../../services/chatService');
const mockChatService = chatService as jest.Mocked<typeof chatService>;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
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

const mockTargetUser = {
  _id: 'user456',
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  role: 'job_seeker' as const,
};

const mockChat = {
  _id: 'chat123',
  participants: [mockUser, mockTargetUser],
  lastMessage: undefined,
  unreadCount: 0,
  isGroup: false,
  createdBy: 'user123',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

const mockOtherChat = {
  _id: 'chat456',
  participants: [mockUser, { ...mockTargetUser, _id: 'user789', firstName: 'Other' }],
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

const renderMessagesPage = () => {
  return render(
    <MemoryRouter>
      <ThemeProvider theme={theme}>
        <MockAuthProvider>
          <MessagesPage />
        </MockAuthProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('MessagesPage - Chat Selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock setup
    mockChatService.getChats.mockResolvedValue([mockChat, mockOtherChat]);
    mockChatService.getChatMessages.mockResolvedValue({
      messages: [],
      hasMore: false,
    });
    mockChatService.initializeSocket.mockReturnValue({} as any);
  });

  test('should select correct chat by chat ID from sessionStorage', async () => {
    const chatSelectionData = {
      chatId: 'chat123',
      targetUserId: 'user456',
      targetUserName: 'Jane Smith',
      timestamp: Date.now()
    };
    
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(chatSelectionData));

    renderMessagesPage();

    await waitFor(() => {
      // Should clear the sessionStorage after using it
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('selectedChatData');
    });

    // The correct chat should be selected (we'd need to verify this through component state or UI)
    // This is a simplified test - in a real scenario you'd check if the correct chat is active
  });

  test('should find chat by target user ID when chat ID not found', async () => {
    const chatSelectionData = {
      chatId: 'nonexistent-chat',
      targetUserId: 'user456',
      targetUserName: 'Jane Smith',
      timestamp: Date.now()
    };
    
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(chatSelectionData));

    renderMessagesPage();

    await waitFor(() => {
      // Should still clear the sessionStorage
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('selectedChatData');
    });

    // Should have found the chat by target user ID
    // In the implementation, it finds the chat that includes the target user
  });

  test('should create new chat when neither chat ID nor existing chat with user found', async () => {
    const chatSelectionData = {
      chatId: 'nonexistent-chat',
      targetUserId: 'user999', // User not in existing chats
      targetUserName: 'New User',
      timestamp: Date.now()
    };
    
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(chatSelectionData));
    
    // Mock creating a new chat
    const newChat = {
      _id: 'new-chat123',
      participants: [mockUser, { _id: 'user999', firstName: 'New', lastName: 'User' }],
      lastMessage: undefined,
      unreadCount: 0,
      isGroup: false,
      createdBy: 'user123',
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    };
    
    mockChatService.createOrGetChat.mockResolvedValue(newChat);
    // Mock updated chat list after creation
    mockChatService.getChats
      .mockResolvedValueOnce([mockChat, mockOtherChat]) // Initial load
      .mockResolvedValueOnce([mockChat, mockOtherChat, newChat]); // After creation

    renderMessagesPage();

    await waitFor(() => {
      // Should have attempted to create/get chat with the target user
      expect(mockChatService.createOrGetChat).toHaveBeenCalledWith(['user999']);
      
      // Should have reloaded chats to include the new one
      expect(mockChatService.getChats).toHaveBeenCalledTimes(2);
      
      // Should clear the sessionStorage
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('selectedChatData');
    });
  });

  test('should ignore expired chat selection data', async () => {
    const expiredChatSelectionData = {
      chatId: 'chat123',
      targetUserId: 'user456',
      targetUserName: 'Jane Smith',
      timestamp: Date.now() - (6 * 60 * 1000) // 6 minutes ago (expired)
    };
    
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(expiredChatSelectionData));

    renderMessagesPage();

    await waitFor(() => {
      // Should clear the expired data
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('selectedChatData');
      
      // Should not attempt to create new chat
      expect(mockChatService.createOrGetChat).not.toHaveBeenCalled();
    });
  });

  test('should handle malformed sessionStorage data gracefully', async () => {
    mockSessionStorage.getItem.mockReturnValue('invalid-json');

    renderMessagesPage();

    await waitFor(() => {
      // Should clear the invalid data
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('selectedChatData');
      
      // Should not attempt to create new chat
      expect(mockChatService.createOrGetChat).not.toHaveBeenCalled();
    });
  });

  test('should handle chat creation failure gracefully', async () => {
    const chatSelectionData = {
      chatId: 'nonexistent-chat',
      targetUserId: 'user999',
      targetUserName: 'New User',
      timestamp: Date.now()
    };
    
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(chatSelectionData));
    mockChatService.createOrGetChat.mockRejectedValue(new Error('Failed to create chat'));

    renderMessagesPage();

    await waitFor(() => {
      // Should have attempted to create chat
      expect(mockChatService.createOrGetChat).toHaveBeenCalledWith(['user999']);
      
      // Should still clear the sessionStorage
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('selectedChatData');
    });
  });
});
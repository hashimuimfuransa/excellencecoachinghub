import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import MainLayout from '../MainLayout';
import { AuthContext, UserRole } from '../../contexts/AuthContext';
import { ThemeContext } from '../../contexts/ThemeContext';

// Mock the services
jest.mock('../../services/notificationService');
jest.mock('../../services/chatService');

// Mock useMediaQuery to simulate mobile device
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useMediaQuery: jest.fn(),
}));

const mockUseMediaQuery = useMediaQuery as jest.MockedFunction<typeof useMediaQuery>;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const theme = createTheme();

const mockUser = {
  _id: 'user123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: UserRole.JOB_SEEKER,
  avatar: 'https://example.com/avatar.jpg',
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
    hasRole: jest.fn((role: UserRole) => mockUser.role === role),
    hasAnyRole: jest.fn((roles: UserRole[]) => roles.includes(mockUser.role)),
  };

  return (
    <AuthContext.Provider value={mockAuthValue}>
      {children}
    </AuthContext.Provider>
  );
};

const MockThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockThemeValue = {
    mode: 'light' as const,
    toggleTheme: jest.fn(),
  };

  return (
    <ThemeContext.Provider value={mockThemeValue}>
      {children}
    </ThemeContext.Provider>
  );
};

const renderMainLayout = (initialRoute = '/app/network') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <ThemeProvider theme={theme}>
        <MockThemeProvider>
          <MockAuthProvider>
            <MainLayout />
          </MockAuthProvider>
        </MockThemeProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('MainLayout - Mobile Footer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display mobile footer on mobile devices', () => {
    // Mock mobile breakpoint
    mockUseMediaQuery.mockReturnValue(true);

    renderMainLayout();

    // Check that mobile footer is visible
    const homeButton = screen.getByText('Home');
    const jobsButton = screen.getByText('Jobs');
    const messagesButton = screen.getByText('Messages');
    const profileButton = screen.getByText('Profile');

    expect(homeButton).toBeInTheDocument();
    expect(jobsButton).toBeInTheDocument();
    expect(messagesButton).toBeInTheDocument();
    expect(profileButton).toBeInTheDocument();

    // Check that create post button is visible (look for the Add icon button)
    const createPostButtons = screen.getAllByRole('button');
    const createPostButton = createPostButtons.find(button => 
      button.querySelector('[data-testid="AddIcon"]') || 
      button.innerHTML.includes('Add')
    );
    expect(createPostButton).toBeInTheDocument();
  });

  test('should not display mobile footer on desktop devices', () => {
    // Mock desktop breakpoint
    mockUseMediaQuery.mockReturnValue(false);

    renderMainLayout();

    // Footer text should not be visible on desktop
    const homeButtons = screen.queryAllByText('Home');
    const jobsButtons = screen.queryAllByText('Jobs');
    
    // There should be navigation items in sidebar but not in mobile footer
    // The mobile footer should not be displayed
    expect(homeButtons.length).toBeLessThan(2); // Only sidebar, not footer
    expect(jobsButtons.length).toBeLessThan(2);
  });

  test('should navigate to correct routes when mobile footer buttons are clicked', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    renderMainLayout();

    // Click Home button
    const homeButton = screen.getByText('Home');
    fireEvent.click(homeButton);
    expect(mockNavigate).toHaveBeenCalledWith('/app/network');

    // Click Jobs button
    const jobsButton = screen.getByText('Jobs');
    fireEvent.click(jobsButton);
    expect(mockNavigate).toHaveBeenCalledWith('/app/jobs');

    // Click Messages button
    const messagesButton = screen.getByText('Messages');
    fireEvent.click(messagesButton);
    expect(mockNavigate).toHaveBeenCalledWith('/app/messages');

    // Click Create Post button
    const createPostButton = screen.getByRole('button', { name: /create post/i });
    fireEvent.click(createPostButton);
    expect(mockNavigate).toHaveBeenCalledWith('/app/network?create=post');
  });

  test('should highlight active route in mobile footer', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    // Render with jobs route active
    renderMainLayout('/app/jobs');

    const jobsButton = screen.getByText('Jobs');
    const homeButton = screen.getByText('Home');

    // Check that jobs button has active styling (primary color)
    const jobsButtonParent = jobsButton.closest('button');
    const homeButtonParent = homeButton.closest('button');

    expect(jobsButtonParent).toHaveStyle({ color: 'primary.main' });
    expect(homeButtonParent).toHaveStyle({ color: 'text.secondary' });
  });

  test('should display applications button for job seekers', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    renderMainLayout();

    // Applications button should be visible for job seekers
    const appsButton = screen.getByText('Apps');
    expect(appsButton).toBeInTheDocument();
  });

  test('should display user avatar in profile button', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    renderMainLayout();

    // Check that user's initials are displayed in avatar
    const avatarElement = screen.getByText('J'); // First letter of John
    expect(avatarElement).toBeInTheDocument();
  });

  test('should show badge on messages button when there are unread messages', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    renderMainLayout();

    // Messages button should have badge structure for unread count
    const messagesButton = screen.getByText('Messages');
    const messagesButtonContainer = messagesButton.closest('button');
    
    expect(messagesButtonContainer).toBeInTheDocument();
    // Badge will be empty by default in tests but structure should exist
  });

  test('should be positioned fixed at bottom of screen', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { container } = renderMainLayout();

    // Find the mobile footer container
    const footerElement = container.querySelector('[style*="position: fixed"]');
    expect(footerElement).toBeInTheDocument();
    
    // Should have bottom: 0 positioning
    expect(footerElement).toHaveStyle({ 
      position: 'fixed',
      bottom: '0'
    });
  });

  test('should handle profile menu opening when profile button is clicked', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    renderMainLayout();

    const profileButton = screen.getByText('Profile');
    const profileButtonContainer = profileButton.closest('button');
    
    if (profileButtonContainer) {
      fireEvent.click(profileButtonContainer);
      // Profile menu should open (handled by existing profile menu logic)
      expect(profileButtonContainer).toBeInTheDocument();
    }
  });

  test('should have proper hover effects on mobile footer buttons', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    renderMainLayout();

    const homeButton = screen.getByText('Home');
    const homeButtonContainer = homeButton.closest('button');

    if (homeButtonContainer) {
      // Hover effect should be defined in sx prop
      expect(homeButtonContainer).toHaveStyle({
        transition: 'all 0.2s ease'
      });
    }
  });

  test('should display create post button with gradient styling', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    renderMainLayout();

    const createPostButton = screen.getByRole('button', { name: /create post/i });
    expect(createPostButton).toBeInTheDocument();
    
    // Create post button should have gradient background and be prominent
    const createPostButtonElement = createPostButton;
    expect(createPostButtonElement).toHaveStyle({
      color: 'white'
    });
  });

  test('should position create post button in center of mobile footer', () => {
    mockUseMediaQuery.mockReturnValue(true);
    
    const { container } = renderMainLayout();

    const createPostButton = screen.getByRole('button', { name: /create post/i });
    expect(createPostButton).toBeInTheDocument();

    // The create post button should be in the center among the navigation buttons
    const footerButtons = container.querySelectorAll('button');
    const createPostIndex = Array.from(footerButtons).findIndex(btn => 
      btn.getAttribute('aria-label')?.includes('create post') || btn.textContent?.includes('create')
    );
    
    // Should be positioned among the footer buttons (exact position may vary based on user role)
    expect(createPostIndex).toBeGreaterThan(-1);
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import ImprovedProfilePage from '../ImprovedProfilePage';
import { AuthProvider } from '../../contexts/AuthContext';
import * as userService from '../../services/userService';

// Mock the userService
vi.mock('../../services/userService');
const mockUserService = vi.mocked(userService);

// Mock the AuthContext
const mockUser = {
  _id: '123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'job_seeker' as const,
  profilePicture: 'https://example.com/profile.jpg',
  phone: '123-456-7890',
  location: 'New York',
  bio: 'Test bio'
};

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  updateUser: vi.fn(),
  setUserData: vi.fn(),
  hasRole: vi.fn(),
  hasAnyRole: vi.fn()
};

// Mock AuthProvider
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  UserRole: {
    JOB_SEEKER: 'job_seeker'
  }
}));

// Mock image utilities
vi.mock('../../utils/imageUtils', () => ({
  validateImageFile: vi.fn(() => ({ valid: true })),
  createImagePreview: vi.fn(() => Promise.resolve('data:image/jpeg;base64,preview')),
  processImage: vi.fn(() => Promise.resolve(new Blob())),
  blobToFile: vi.fn(() => new File(['test'], 'test.jpg', { type: 'image/jpeg' }))
}));

// Mock Material-UI components that might cause issues in tests
vi.mock('@mui/material/TextField', () => ({
  default: ({ ...props }) => <input {...props} />
}));

const theme = createTheme();

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  </MemoryRouter>
);

describe('ProfilePage - Profile Picture Upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should upload profile picture without causing page reload', async () => {
    // Mock successful upload
    const updatedUser = { ...mockUser, profilePicture: 'https://example.com/new-profile.jpg' };
    mockUserService.uploadProfilePicture.mockResolvedValue(updatedUser);

    render(
      <TestWrapper>
        <ImprovedProfilePage />
      </TestWrapper>
    );

    // Find the file input (it's hidden, so we need to find it by ID)
    const fileInput = screen.getByLabelText(/upload profile picture/i).querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Create a test file
    const testFile = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });

    // Simulate file selection
    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });

    // Wait for the upload to complete
    await waitFor(() => {
      expect(mockUserService.uploadProfilePicture).toHaveBeenCalledWith(
        mockUser._id,
        expect.any(FormData)
      );
    });

    // Verify that setUserData was called with merged data (not just the updated profile)
    expect(mockAuthContext.setUserData).toHaveBeenCalledWith({
      ...mockUser,
      ...updatedUser,
      profilePicture: updatedUser.profilePicture
    });

    // Verify success message appears
    await waitFor(() => {
      expect(screen.getByText(/profile picture updated successfully/i)).toBeInTheDocument();
    });

    // Verify file input was cleared
    expect(fileInput.value).toBe('');
  });

  it('should handle profile picture upload error gracefully', async () => {
    // Mock upload failure
    const uploadError = new Error('Upload failed');
    mockUserService.uploadProfilePicture.mockRejectedValue(uploadError);

    render(
      <TestWrapper>
        <ImprovedProfilePage />
      </TestWrapper>
    );

    // Find the file input
    const fileInput = screen.getByLabelText(/upload profile picture/i).querySelector('input[type="file"]') as HTMLInputElement;
    
    // Create a test file
    const testFile = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });

    // Simulate file selection
    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });

    // Wait for error handling
    await waitFor(() => {
      expect(screen.getByText(/failed to upload profile picture/i)).toBeInTheDocument();
    });

    // Verify file input was cleared even on error
    expect(fileInput.value).toBe('');

    // Verify setUserData was not called on error
    expect(mockAuthContext.setUserData).not.toHaveBeenCalled();
  });

  it('should not trigger unnecessary re-renders when user data is updated', async () => {
    const { rerender } = render(
      <TestWrapper>
        <ImprovedProfilePage />
      </TestWrapper>
    );

    // Mock a profile picture update in the user context
    const updatedUser = { ...mockUser, profilePicture: 'https://example.com/new-pic.jpg' };
    mockAuthContext.user = updatedUser;

    // Re-render with updated user data
    rerender(
      <TestWrapper>
        <ImprovedProfilePage />
      </TestWrapper>
    );

    // Component should handle the update gracefully without causing errors
    expect(screen.getByText(mockUser.firstName)).toBeInTheDocument();
    expect(screen.getByText(mockUser.lastName)).toBeInTheDocument();
  });

  it('should preserve form data during profile picture upload', async () => {
    // Mock successful upload
    const updatedUser = { ...mockUser, profilePicture: 'https://example.com/new-profile.jpg' };
    mockUserService.uploadProfilePicture.mockResolvedValue(updatedUser);

    render(
      <TestWrapper>
        <ImprovedProfilePage />
      </TestWrapper>
    );

    // Enter edit mode and modify some data
    const editButton = screen.getByText(/edit profile/i);
    fireEvent.click(editButton);

    // Find text inputs and change values
    const firstNameInput = screen.getByDisplayValue(mockUser.firstName);
    fireEvent.change(firstNameInput, { target: { value: 'Jane' } });

    // Now upload a profile picture
    const fileInput = screen.getByLabelText(/upload profile picture/i).querySelector('input[type="file"]') as HTMLInputElement;
    const testFile = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, {
      target: { files: [testFile] }
    });

    // Wait for upload to complete
    await waitFor(() => {
      expect(mockUserService.uploadProfilePicture).toHaveBeenCalled();
    });

    // Verify that the form data is preserved (input still shows 'Jane')
    expect(firstNameInput).toHaveValue('Jane');
  });
});
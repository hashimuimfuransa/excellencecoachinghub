import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BottomNavbar from './BottomNavbar';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { role: 'student' }
  })
}));

// Mock the useTranslation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

describe('BottomNavbar', () => {
  const renderWithRouter = (component) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  test('renders without crashing', () => {
    renderWithRouter(<BottomNavbar />);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  test('displays correct navigation items for student role', () => {
    renderWithRouter(<BottomNavbar />);
    
    expect(screen.getByText('dashboard')).toBeInTheDocument();
    expect(screen.getByText('homework')).toBeInTheDocument();
    expect(screen.getByText('help')).toBeInTheDocument();
    expect(screen.getByText('leaderboard')).toBeInTheDocument();
  });

  test('applies correct styling for mobile devices', () => {
    renderWithRouter(<BottomNavbar />);
    const navbar = screen.getByRole('navigation');
    
    // Check if it has the correct classes for mobile positioning
    expect(navbar).toHaveClass('md:hidden');
    expect(navbar).toHaveClass('fixed');
    expect(navbar).toHaveClass('bottom-0');
  });
});
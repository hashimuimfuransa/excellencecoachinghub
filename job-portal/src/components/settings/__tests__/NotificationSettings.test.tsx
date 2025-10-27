import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import NotificationSettings from '../NotificationSettings';
import { NotificationSettings as NotificationSettingsType } from '../../../services/settingsService';

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('NotificationSettings Component', () => {
  const defaultSettings: NotificationSettingsType = {
    email: true,
    push: true,
    jobAlerts: true,
    emailFrequency: 'daily'
  };

  const disabledSettings: NotificationSettingsType = {
    email: false,
    push: false,
    jobAlerts: false,
    emailFrequency: 'daily'
  };

  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Render and State', () => {
    it('should render with enabled notification settings', () => {
      renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Check that all switches are enabled
      expect(screen.getByRole('switch', { name: /email notifications/i })).toBeChecked();
      expect(screen.getByRole('switch', { name: /browser notifications/i })).toBeChecked();
      expect(screen.getByRole('switch', { name: /job alerts/i })).toBeChecked();

      // Check success alert is shown
      expect(screen.getByText(/notifications are enabled/i)).toBeInTheDocument();
    });

    it('should render with disabled notification settings', () => {
      renderWithTheme(
        <NotificationSettings
          settings={disabledSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Check that all switches are disabled
      expect(screen.getByRole('switch', { name: /email notifications/i })).not.toBeChecked();
      expect(screen.getByRole('switch', { name: /browser notifications/i })).not.toBeChecked();
      expect(screen.getByRole('switch', { name: /job alerts/i })).not.toBeChecked();

      // Check warning alert is shown
      expect(screen.getByText(/all notifications are disabled/i)).toBeInTheDocument();
    });

    it('should show email frequency selector only when email is enabled', () => {
      const { rerender } = renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Email frequency should be visible when email is enabled
      expect(screen.getByLabelText(/email frequency/i)).toBeInTheDocument();

      // Rerender with email disabled
      rerender(
        <ThemeProvider theme={theme}>
          <NotificationSettings
            settings={disabledSettings}
            onChange={mockOnChange}
            disabled={false}
          />
        </ThemeProvider>
      );

      // Email frequency should not be visible when email is disabled
      expect(screen.queryByLabelText(/email frequency/i)).not.toBeInTheDocument();
    });
  });

  describe('User Interactions - Core Bug Testing', () => {
    it('should disable all notifications when user clicks disable all', async () => {
      renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Click "Disable All" button
      const disableAllButton = screen.getByRole('button', { name: /disable all/i });
      fireEvent.click(disableAllButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          email: false,
          push: false,
          jobAlerts: false,
          emailFrequency: 'daily' // Should preserve frequency
        });
      });
    });

    it('should enable essential notifications when user clicks enable essential', async () => {
      renderWithTheme(
        <NotificationSettings
          settings={disabledSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Click "Enable Essential" button
      const enableEssentialButton = screen.getByRole('button', { name: /enable essential/i });
      fireEvent.click(enableEssentialButton);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          email: true,
          push: true,
          jobAlerts: true,
          emailFrequency: 'daily'
        });
      });
    });

    it('should toggle individual notification settings correctly', async () => {
      renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Toggle email notifications off
      const emailSwitch = screen.getByRole('switch', { name: /email notifications/i });
      fireEvent.click(emailSwitch);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          email: false, // Should be toggled off
          push: true,
          jobAlerts: true,
          emailFrequency: 'daily'
        });
      });
    });

    it('should maintain disabled state when saving and reloading (bug scenario)', () => {
      console.log('🧪 Testing notification disable/enable persistence bug...');

      // Step 1: Render with enabled settings (initial state)
      const { rerender } = renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      console.log('📝 Initial state: All notifications enabled');

      // Step 2: Disable all notifications (user action)
      const disableAllButton = screen.getByRole('button', { name: /disable all/i });
      fireEvent.click(disableAllButton);

      // Verify onChange was called with disabled settings
      expect(mockOnChange).toHaveBeenLastCalledWith({
        email: false,
        push: false,
        jobAlerts: false,
        emailFrequency: 'daily'
      });

      console.log('🔄 User disabled all notifications');

      // Step 3: Simulate page refresh with disabled settings (what should happen)
      rerender(
        <ThemeProvider theme={theme}>
          <NotificationSettings
            settings={disabledSettings}
            onChange={mockOnChange}
            disabled={false}
          />
        </ThemeProvider>
      );

      console.log('🔄 Simulated page refresh');

      // Step 4: Verify all switches remain disabled
      expect(screen.getByRole('switch', { name: /email notifications/i })).not.toBeChecked();
      expect(screen.getByRole('switch', { name: /browser notifications/i })).not.toBeChecked();
      expect(screen.getByRole('switch', { name: /job alerts/i })).not.toBeChecked();

      // Verify warning message is shown
      expect(screen.getByText(/all notifications are disabled/i)).toBeInTheDocument();

      console.log('✅ Disabled state maintained after refresh - Component working correctly');
    });
  });

  describe('Email Frequency Control', () => {
    it('should update email frequency when changed', async () => {
      renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Find and click the email frequency select
      const frequencySelect = screen.getByLabelText(/email frequency/i);
      fireEvent.mouseDown(frequencySelect);

      // Select weekly option
      const weeklyOption = await screen.findByText(/weekly digest on mondays/i);
      fireEvent.click(weeklyOption);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith({
          email: true,
          push: true,
          jobAlerts: true,
          emailFrequency: 'weekly'
        });
      });
    });

    it('should show different frequency options', async () => {
      renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Open the select dropdown
      const frequencySelect = screen.getByLabelText(/email frequency/i);
      fireEvent.mouseDown(frequencySelect);

      // Check all frequency options are available
      await waitFor(() => {
        expect(screen.getByText(/send emails immediately/i)).toBeInTheDocument();
        expect(screen.getByText(/once per day at 9 am/i)).toBeInTheDocument();
        expect(screen.getByText(/weekly digest on mondays/i)).toBeInTheDocument();
      });
    });
  });

  describe('Disabled State Handling', () => {
    it('should disable all controls when disabled prop is true', () => {
      renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      // All switches should be disabled
      expect(screen.getByRole('switch', { name: /email notifications/i })).toBeDisabled();
      expect(screen.getByRole('switch', { name: /browser notifications/i })).toBeDisabled();
      expect(screen.getByRole('switch', { name: /job alerts/i })).toBeDisabled();

      // Action buttons should be disabled
      expect(screen.getByRole('button', { name: /disable all/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /enable essential/i })).toBeDisabled();
    });

    it('should show appropriate button states based on current settings', () => {
      // Test with all enabled
      const { rerender } = renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Disable All should be enabled, Enable Essential should be disabled
      expect(screen.getByRole('button', { name: /disable all/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /enable essential/i })).toBeDisabled();

      // Test with all disabled
      rerender(
        <ThemeProvider theme={theme}>
          <NotificationSettings
            settings={disabledSettings}
            onChange={mockOnChange}
            disabled={false}
          />
        </ThemeProvider>
      );

      // Disable All should be disabled, Enable Essential should be enabled
      expect(screen.getByRole('button', { name: /disable all/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /enable essential/i })).not.toBeDisabled();
    });
  });

  describe('Information and Help Text', () => {
    it('should show warning when all notifications are disabled', () => {
      renderWithTheme(
        <NotificationSettings
          settings={disabledSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Should show warning about missing opportunities
      expect(screen.getByText(/with all notifications disabled, you may miss important job opportunities/i)).toBeInTheDocument();
    });

    it('should show security notifications as always enabled', () => {
      renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Security notifications should be shown as always on
      expect(screen.getByText(/security alerts/i)).toBeInTheDocument();
      expect(screen.getByText(/always on/i)).toBeInTheDocument();
      
      // Security switch should be checked and disabled
      const securitySwitch = screen.getAllByRole('switch').find(sw => 
        sw.closest('.MuiCardContent-root')?.textContent?.includes('Security Alerts')
      );
      expect(securitySwitch).toBeChecked();
      expect(securitySwitch).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithTheme(
        <NotificationSettings
          settings={defaultSettings}
          onChange={mockOnChange}
          disabled={false}
        />
      );

      // Check switches have proper labels
      expect(screen.getByRole('switch', { name: /email notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /browser notifications/i })).toBeInTheDocument();
      expect(screen.getByRole('switch', { name: /job alerts/i })).toBeInTheDocument();

      // Check select has proper label
      expect(screen.getByLabelText(/email frequency/i)).toBeInTheDocument();

      // Check buttons are properly labeled
      expect(screen.getByRole('button', { name: /enable essential/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /disable all/i })).toBeInTheDocument();
    });
  });
});
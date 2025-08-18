import { createTheme, ThemeOptions } from '@mui/material/styles';

// Define explicit color values
const colors = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#dc004e',
    light: '#ff5983',
    dark: '#9a0036',
    contrastText: '#ffffff',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: '#000000',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
    contrastText: '#ffffff',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
    contrastText: '#ffffff',
  },
};

// Create a bulletproof theme with explicit overrides
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    success: colors.success,
    background: {
      default: '#f8fafc',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a202c',
      secondary: '#718096',
    },
    grey: {
      50: '#f7fafc',
      100: '#edf2f7',
      200: '#e2e8f0',
      300: '#cbd5e0',
      400: '#a0aec0',
      500: '#718096',
      600: '#4a5568',
      700: '#2d3748',
      800: '#1a202c',
      900: '#171923',
    },
    action: {
      disabled: '#cccccc',
      disabledBackground: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 800,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    // Completely override Button component to prevent theme access errors
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: '4px',
          padding: '8px 16px',
          // Override all variants with explicit colors
          '&.MuiButton-contained': {
            backgroundColor: colors.primary.main,
            color: colors.primary.contrastText,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: colors.primary.dark,
              boxShadow: 'none',
            },
            '&:disabled': {
              backgroundColor: '#cccccc',
              color: '#666666',
            },
          },
          '&.MuiButton-containedPrimary': {
            backgroundColor: colors.primary.main,
            color: colors.primary.contrastText,
            '&:hover': {
              backgroundColor: colors.primary.dark,
            },
            '&:disabled': {
              backgroundColor: '#cccccc',
              color: '#666666',
            },
          },
          '&.MuiButton-containedSecondary': {
            backgroundColor: colors.secondary.main,
            color: colors.secondary.contrastText,
            '&:hover': {
              backgroundColor: colors.secondary.dark,
            },
            '&:disabled': {
              backgroundColor: '#cccccc',
              color: '#666666',
            },
          },
          '&.MuiButton-containedSuccess': {
            backgroundColor: colors.success.main,
            color: colors.success.contrastText,
            '&:hover': {
              backgroundColor: colors.success.dark,
            },
            '&:disabled': {
              backgroundColor: '#cccccc',
              color: '#666666',
            },
          },
          '&.MuiButton-containedError': {
            backgroundColor: colors.error.main,
            color: colors.error.contrastText,
            '&:hover': {
              backgroundColor: colors.error.dark,
            },
            '&:disabled': {
              backgroundColor: '#cccccc',
              color: '#666666',
            },
          },
          '&.MuiButton-containedInfo': {
            backgroundColor: colors.info.main,
            color: colors.info.contrastText,
            '&:hover': {
              backgroundColor: colors.info.dark,
            },
            '&:disabled': {
              backgroundColor: '#cccccc',
              color: '#666666',
            },
          },
          '&.MuiButton-containedWarning': {
            backgroundColor: colors.warning.main,
            color: colors.warning.contrastText,
            '&:hover': {
              backgroundColor: colors.warning.dark,
            },
            '&:disabled': {
              backgroundColor: '#cccccc',
              color: '#666666',
            },
          },
        },
      },
    },
    // Override Chip component
    MuiChip: {
      styleOverrides: {
        root: {
          '&.MuiChip-colorPrimary': {
            backgroundColor: colors.primary.main,
            color: colors.primary.contrastText,
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: colors.secondary.main,
            color: colors.secondary.contrastText,
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: colors.success.main,
            color: colors.success.contrastText,
          },
          '&.MuiChip-colorError': {
            backgroundColor: colors.error.main,
            color: colors.error.contrastText,
          },
          '&.MuiChip-colorInfo': {
            backgroundColor: colors.info.main,
            color: colors.info.contrastText,
          },
          '&.MuiChip-colorWarning': {
            backgroundColor: colors.warning.main,
            color: colors.warning.contrastText,
          },
        },
      },
    },
    // Override IconButton component
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&.MuiIconButton-colorPrimary': {
            color: colors.primary.main,
          },
          '&.MuiIconButton-colorSecondary': {
            color: colors.secondary.main,
          },
          '&.MuiIconButton-colorSuccess': {
            color: colors.success.main,
          },
          '&.MuiIconButton-colorError': {
            color: colors.error.main,
          },
          '&.MuiIconButton-colorInfo': {
            color: colors.info.main,
          },
          '&.MuiIconButton-colorWarning': {
            color: colors.warning.main,
          },
        },
      },
    },
  },
});

// Create dark theme (simplified)
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    warning: colors.warning,
    info: colors.info,
    success: colors.success,
  },
});

// Ensure theme is properly created
console.log('Theme created successfully with bulletproof overrides');
console.log('Primary color:', theme.palette.primary.main);
console.log('Success color:', theme.palette.success.main);
console.log('Error color:', theme.palette.error.main);
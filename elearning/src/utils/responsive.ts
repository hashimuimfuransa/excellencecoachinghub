import { useTheme, useMediaQuery } from '@mui/material';
import { Breakpoint } from '@mui/material/styles';

// Responsive breakpoints for different devices
export const breakpoints = {
  mobile: 'xs' as Breakpoint,      // 0px - 599px (smartphones)
  tablet: 'sm' as Breakpoint,      // 600px - 899px (tablets)
  laptop: 'md' as Breakpoint,      // 900px - 1199px (laptops)
  desktop: 'lg' as Breakpoint,     // 1200px - 1535px (desktops)
  widescreen: 'xl' as Breakpoint   // 1536px+ (large desktops)
};

// Custom hook for responsive design
export const useResponsive = () => {
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isLaptop = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  const isDesktop = useMediaQuery(theme.breakpoints.between('lg', 'xl'));
  const isWidescreen = useMediaQuery(theme.breakpoints.up('xl'));
  
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md')); // mobile + tablet
  const isMediumScreen = useMediaQuery(theme.breakpoints.between('md', 'lg')); // laptop
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg')); // desktop + widescreen
  
  return {
    isMobile,
    isTablet,
    isLaptop,
    isDesktop,
    isWidescreen,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    breakpoints: theme.breakpoints
  };
};

// Grid spacing based on device type
export const getGridSpacing = (device: 'mobile' | 'tablet' | 'laptop' | 'desktop') => {
  switch (device) {
    case 'mobile':
      return { xs: 1, sm: 1.5 };
    case 'tablet':
      return { xs: 1.5, sm: 2 };
    case 'laptop':
      return { xs: 2, sm: 2.5 };
    case 'desktop':
      return { xs: 2.5, sm: 3 };
    default:
      return { xs: 2, sm: 2.5 };
  }
};

// Card dimensions for different devices
export const getCardDimensions = () => ({
  mobile: {
    minHeight: 120,
    padding: 1,
    titleSize: 'h6',
    subtitleSize: 'body2'
  },
  tablet: {
    minHeight: 140,
    padding: 1.5,
    titleSize: 'h6',
    subtitleSize: 'body2'
  },
  laptop: {
    minHeight: 160,
    padding: 2,
    titleSize: 'h5',
    subtitleSize: 'body1'
  },
  desktop: {
    minHeight: 180,
    padding: 2.5,
    titleSize: 'h5',
    subtitleSize: 'body1'
  }
});

// Drawer width for different devices
export const getDrawerWidth = () => ({
  mobile: 260,  // Reduced for better mobile experience
  tablet: 280,  // Reduced for better tablet experience
  laptop: 260,  // Reduced for better space utilization
  desktop: 280  // Reduced for better space utilization
});

// Container max widths for different devices
export const getContainerMaxWidth = () => ({
  mobile: 'sm' as Breakpoint,
  tablet: 'md' as Breakpoint,
  laptop: 'lg' as Breakpoint,
  desktop: 'xl' as Breakpoint
});

// Typography scaling for different devices
export const getTypographyScale = () => ({
  mobile: {
    h1: { fontSize: '1.75rem' },
    h2: { fontSize: '1.5rem' },
    h3: { fontSize: '1.25rem' },
    h4: { fontSize: '1.125rem' },
    h5: { fontSize: '1rem' },
    h6: { fontSize: '0.875rem' },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.75rem' }
  },
  tablet: {
    h1: { fontSize: '2rem' },
    h2: { fontSize: '1.75rem' },
    h3: { fontSize: '1.5rem' },
    h4: { fontSize: '1.25rem' },
    h5: { fontSize: '1.125rem' },
    h6: { fontSize: '1rem' },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' }
  },
  laptop: {
    h1: { fontSize: '2.25rem' },
    h2: { fontSize: '2rem' },
    h3: { fontSize: '1.75rem' },
    h4: { fontSize: '1.5rem' },
    h5: { fontSize: '1.25rem' },
    h6: { fontSize: '1.125rem' },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.875rem' }
  },
  desktop: {
    h1: { fontSize: '2.5rem' },
    h2: { fontSize: '2.25rem' },
    h3: { fontSize: '2rem' },
    h4: { fontSize: '1.75rem' },
    h5: { fontSize: '1.5rem' },
    h6: { fontSize: '1.25rem' },
    body1: { fontSize: '1.125rem' },
    body2: { fontSize: '1rem' }
  }
});

// Button sizes for different devices
export const getButtonSize = (device: 'mobile' | 'tablet' | 'laptop' | 'desktop') => {
  switch (device) {
    case 'mobile':
      return 'small';
    case 'tablet':
      return 'medium';
    case 'laptop':
      return 'medium';
    case 'desktop':
      return 'large';
    default:
      return 'medium';
  }
};

// Icon sizes for different devices
export const getIconSize = (device: 'mobile' | 'tablet' | 'laptop' | 'desktop') => {
  switch (device) {
    case 'mobile':
      return 'small';
    case 'tablet':
      return 'medium';
    case 'laptop':
      return 'medium';
    case 'desktop':
      return 'large';
    default:
      return 'medium';
  }
};

// Table pagination sizes for different devices
export const getTablePageSize = (device: 'mobile' | 'tablet' | 'laptop' | 'desktop') => {
  switch (device) {
    case 'mobile':
      return 5;
    case 'tablet':
      return 8;
    case 'laptop':
      return 10;
    case 'desktop':
      return 15;
    default:
      return 10;
  }
};

// Chart dimensions for different devices
export const getChartDimensions = () => ({
  mobile: {
    height: 200,
    width: '100%'
  },
  tablet: {
    height: 250,
    width: '100%'
  },
  laptop: {
    height: 300,
    width: '100%'
  },
  desktop: {
    height: 350,
    width: '100%'
  }
});

export default {
  useResponsive,
  getGridSpacing,
  getCardDimensions,
  getDrawerWidth,
  getContainerMaxWidth,
  getTypographyScale,
  getButtonSize,
  getIconSize,
  getTablePageSize,
  getChartDimensions,
  breakpoints
};

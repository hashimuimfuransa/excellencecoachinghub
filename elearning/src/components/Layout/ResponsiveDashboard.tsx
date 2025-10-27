import React from 'react';
import {
  Container,
  Grid,
  Box,
  useTheme,
  styled
} from '@mui/material';
import { useResponsive, getContainerMaxWidth, getGridSpacing } from '../../utils/responsive';

// Styled components for responsive dashboard
const ResponsiveContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  [theme.breakpoints.between('sm', 'md')]: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(1.5),
  },
  [theme.breakpoints.between('md', 'lg')]: {
    paddingLeft: theme.spacing(3),
    paddingRight: theme.spacing(3),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
  },
  [theme.breakpoints.up('lg')]: {
    paddingLeft: theme.spacing(2),  // Reduced from 4 to 2 for better space utilization
    paddingRight: theme.spacing(2), // Reduced from 4 to 2 for better space utilization
    paddingTop: theme.spacing(2),   // Reduced from 3 to 2 for better space utilization
    paddingBottom: theme.spacing(2), // Reduced from 3 to 2 for better space utilization
  },
}));

const ResponsiveGrid = styled(Grid)(({ theme }) => ({
  '& .MuiGrid-item': {
    [theme.breakpoints.down('sm')]: {
      paddingLeft: theme.spacing(0.5),
      paddingRight: theme.spacing(0.5),
    },
    [theme.breakpoints.between('sm', 'md')]: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
    },
    [theme.breakpoints.between('md', 'lg')]: {
      paddingLeft: theme.spacing(1.5),
      paddingRight: theme.spacing(1.5),
    },
    [theme.breakpoints.up('lg')]: {
      paddingLeft: theme.spacing(1),  // Reduced from 2 to 1 for better space utilization
      paddingRight: theme.spacing(1), // Reduced from 2 to 1 for better space utilization
    },
  }
}));

interface ResponsiveDashboardProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  spacing?: number;
  disableGutters?: boolean;
}

const ResponsiveDashboard: React.FC<ResponsiveDashboardProps> = ({
  children,
  maxWidth,
  spacing,
  disableGutters = false
}) => {
  const { isMobile, isTablet, isLaptop, isDesktop } = useResponsive();
  const theme = useTheme();

  // Determine container max width based on device
  const getMaxWidth = () => {
    if (maxWidth !== undefined) return maxWidth;
    
    if (isMobile) return 'sm';
    if (isTablet) return 'md';
    if (isLaptop) return 'xl';  // Increased from 'lg' to 'xl' for better space utilization
    if (isDesktop) return 'xl';
    return 'xl';  // Default to 'xl' for better desktop experience
  };

  // Determine grid spacing based on device
  const getSpacing = () => {
    if (spacing !== undefined) return spacing;
    
    if (isMobile) return 1;
    if (isTablet) return 1.5;
    if (isLaptop) return 2;
    if (isDesktop) return 2.5;
    return 2;
  };

  return (
    <ResponsiveContainer
      maxWidth={getMaxWidth()}
      disableGutters={disableGutters}
    >
      <ResponsiveGrid
        container
        spacing={getSpacing()}
        sx={{
          width: '100%',
          margin: 0,
          '& > .MuiGrid-item': {
            paddingTop: theme.spacing(getSpacing()),
            paddingLeft: theme.spacing(getSpacing()),
          }
        }}
      >
        {children}
      </ResponsiveGrid>
    </ResponsiveContainer>
  );
};

export default ResponsiveDashboard;

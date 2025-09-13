import React from 'react';
import {
  Box,
  Chip,
  Typography,
  useTheme,
  alpha,
  Stack,
  ButtonGroup,
  Button,
  Divider
} from '@mui/material';
import {
  Work,
  LocationOn,
  Schedule,
  AttachMoney,
  BusinessCenter,
  Computer,
  Home,
  Apartment,
  TrendingUp,
  FilterList,
  Clear
} from '@mui/icons-material';
import { FilterState } from '../hooks/useJobFilters';

interface QuickJobFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onClearFilters: () => void;
  totalJobs: number;
  isLoading?: boolean;
}

interface QuickFilter {
  key: keyof FilterState;
  label: string;
  icon: React.ReactNode;
  options: Array<{
    value: any;
    label: string;
    color?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
  }>;
}

const QuickJobFilters: React.FC<QuickJobFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  totalJobs,
  isLoading = false
}) => {
  const theme = useTheme();

  const quickFilters: QuickFilter[] = [
    {
      key: 'jobTypes',
      label: 'Job Type',
      icon: <Work fontSize="small" />,
      options: [
        { value: 'full-time', label: 'Full Time', color: 'primary' },
        { value: 'part-time', label: 'Part Time', color: 'secondary' },
        { value: 'contract', label: 'Contract', color: 'info' },
        { value: 'freelance', label: 'Freelance', color: 'warning' },
        { value: 'internship', label: 'Internship', color: 'success' }
      ]
    },
    {
      key: 'workLocation',
      label: 'Work Style',
      icon: <LocationOn fontSize="small" />,
      options: [
        { value: 'remote', label: 'Remote', color: 'success' },
        { value: 'hybrid', label: 'Hybrid', color: 'info' },
        { value: 'on-site', label: 'On-site', color: 'primary' }
      ]
    },
    {
      key: 'experienceLevel',
      label: 'Experience',
      icon: <TrendingUp fontSize="small" />,
      options: [
        { value: 'entry', label: 'Entry Level', color: 'success' },
        { value: 'mid', label: 'Mid Level', color: 'primary' },
        { value: 'senior', label: 'Senior', color: 'warning' },
        { value: 'lead', label: 'Lead/Manager', color: 'error' }
      ]
    },
    {
      key: 'postedDate',
      label: 'Posted',
      icon: <Schedule fontSize="small" />,
      options: [
        { value: 'today', label: 'Today', color: 'success' },
        { value: 'week', label: 'This Week', color: 'primary' },
        { value: 'month', label: 'This Month', color: 'info' },
        { value: 'all', label: 'All Time', color: 'secondary' }
      ]
    },
    {
      key: 'categories',
      label: 'Category',
      icon: <BusinessCenter fontSize="small" />,
      options: [
        { value: 'jobs', label: 'Jobs', color: 'primary' },
        { value: 'internships', label: 'Internships', color: 'success' },
        { value: 'access_to_finance', label: 'Access to Finance', color: 'warning' },
        { value: 'tenders', label: 'Tenders', color: 'error' },
        { value: 'trainings', label: 'Trainings', color: 'info' },
        { value: 'scholarships', label: 'Scholarships', color: 'secondary' },
        { value: 'technology', label: 'Technology', color: 'primary' },
        { value: 'healthcare', label: 'Healthcare', color: 'success' },
        { value: 'finance', label: 'Finance', color: 'warning' },
        { value: 'education', label: 'Education', color: 'info' },
        { value: 'marketing', label: 'Marketing', color: 'secondary' },
        { value: 'business', label: 'Business', color: 'primary' },
        { value: 'engineering', label: 'Engineering', color: 'error' },
        { value: 'design', label: 'Design', color: 'secondary' }
      ]
    }
  ];

  const handleFilterClick = (filterKey: keyof FilterState, value: any) => {
    const currentValues = filters[filterKey];
    
    if (filterKey === 'postedDate' || filterKey === 'location') {
      // Single selection for posted date and location
      onFilterChange(filterKey, currentValues === value ? '' : value);
    } else if (Array.isArray(currentValues)) {
      // Multiple selection for arrays
      const currentArray = currentValues as any[];
      const newValues = currentArray.includes(value)
        ? currentArray.filter(v => v !== value)
        : [...currentArray, value];
      onFilterChange(filterKey, newValues);
    } else {
      // Single selection for strings
      onFilterChange(filterKey, currentValues === value ? '' : value);
    }
  };

  const isFilterActive = (filterKey: keyof FilterState, value: any): boolean => {
    const currentValues = filters[filterKey];
    
    if (Array.isArray(currentValues)) {
      const currentArray = currentValues as any[];
      return currentArray.includes(value);
    }
    return currentValues === value;
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.location.trim()) count++;
    if (filters.jobTypes.length > 0) count++;
    if (filters.workLocation.length > 0) count++;
    if (filters.experienceLevel.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.postedDate !== 'all') count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();

  return (
    <Box
      sx={{
        borderRadius: 3,
        background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(theme.palette.background.paper, 0.9)} 100%)`,
        backdropFilter: 'blur(12px)',
        border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
        p: 3,
        mb: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.success.main} 100%)`,
          borderRadius: '3px 3px 0 0'
        }
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              color: 'white',
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
            }}
          >
            <FilterList />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Smart Filters
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Find your perfect match
            </Typography>
          </Box>
          {totalJobs > 0 && (
            <Chip
              size="small"
              label={`${totalJobs.toLocaleString()} opportunities`}
              sx={{
                bgcolor: alpha(theme.palette.success.main, 0.15),
                color: 'success.main',
                fontWeight: 600,
                '& .MuiChip-label': {
                  px: 1.5
                }
              }}
            />
          )}
        </Box>
        
        {activeCount > 0 && (
          <Button
            size="small"
            startIcon={<Clear />}
            onClick={onClearFilters}
            variant="outlined"
            sx={{
              color: 'error.main',
              borderColor: alpha(theme.palette.error.main, 0.3),
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1),
                borderColor: 'error.main',
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.2)}`
              },
              transition: 'all 0.2s ease'
            }}
          >
            Clear All ({activeCount})
          </Button>
        )}
      </Box>

      {/* Filter Groups */}
      <Stack spacing={2.5}>
        {quickFilters.map((filter, index) => (
          <Box key={filter.key}>
            <Typography
              variant="subtitle2"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1.5,
                fontWeight: 700,
                color: 'text.primary',
                fontSize: '0.9rem'
              }}
            >
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main'
                }}
              >
                {filter.icon}
              </Box>
              {filter.label}
            </Typography>
            
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              {filter.options.map((option) => {
                const isActive = isFilterActive(filter.key, option.value);
                
                return (
                  <Chip
                    key={option.value}
                    label={option.label}
                    onClick={() => handleFilterClick(filter.key, option.value)}
                    color={isActive ? option.color || 'primary' : 'default'}
                    variant={isActive ? 'filled' : 'outlined'}
                    size="small"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      borderRadius: 2.5,
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.8rem',
                      height: 32,
                      '&:hover': {
                        transform: 'translateY(-2px) scale(1.02)',
                        boxShadow: `0 6px 20px ${alpha(theme.palette[option.color || 'primary'].main, 0.25)}`,
                        borderColor: theme.palette[option.color || 'primary'].main
                      },
                      ...(isActive && {
                        boxShadow: `0 4px 16px ${alpha(theme.palette[option.color || 'primary'].main, 0.3)}`,
                        border: `2px solid ${theme.palette[option.color || 'primary'].main}`,
                        '&:hover': {
                          transform: 'translateY(-2px) scale(1.02)',
                          boxShadow: `0 8px 24px ${alpha(theme.palette[option.color || 'primary'].main, 0.4)}`
                        }
                      }),
                      '&:active': {
                        transform: 'translateY(0) scale(0.98)'
                      }
                    }}
                  />
                );
              })}
            </Box>
            
            {index < quickFilters.length - 1 && (
              <Divider 
                sx={{ 
                  mt: 3, 
                  mb: 1,
                  opacity: 0.2,
                  background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.divider, 0.5)} 50%, transparent 100%)`
                }} 
              />
            )}
          </Box>
        ))}
      </Stack>

      {/* Loading State */}
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(4px)',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Filtering jobs...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default QuickJobFilters;
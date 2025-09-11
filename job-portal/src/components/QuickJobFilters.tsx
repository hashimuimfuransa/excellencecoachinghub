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
        { value: 'technology', label: 'Technology', color: 'primary' },
        { value: 'healthcare', label: 'Healthcare', color: 'success' },
        { value: 'finance', label: 'Finance', color: 'warning' },
        { value: 'education', label: 'Education', color: 'info' },
        { value: 'marketing', label: 'Marketing', color: 'secondary' },
        { value: 'sales', label: 'Sales', color: 'error' },
        { value: 'internship', label: 'Internship', color: 'success' }
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
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        backdropFilter: 'blur(8px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        p: 2,
        mb: 2
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Quick Filters
          </Typography>
          {totalJobs > 0 && (
            <Chip
              size="small"
              label={`${totalJobs.toLocaleString()} jobs`}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        
        {activeCount > 0 && (
          <Button
            size="small"
            startIcon={<Clear />}
            onClick={onClearFilters}
            sx={{
              color: 'error.main',
              '&:hover': {
                backgroundColor: alpha(theme.palette.error.main, 0.1)
              }
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
                gap: 0.5,
                mb: 1,
                fontWeight: 600,
                color: 'text.secondary'
              }}
            >
              {filter.icon}
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
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: theme.shadows[4]
                      },
                      ...(isActive && {
                        fontWeight: 600,
                        boxShadow: theme.shadows[2]
                      })
                    }}
                  />
                );
              })}
            </Box>
            
            {index < quickFilters.length - 1 && (
              <Divider sx={{ mt: 2, opacity: 0.3 }} />
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
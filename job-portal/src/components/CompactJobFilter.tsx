import React, { useState } from 'react';
import {
  Box,
  Chip,
  Typography,
  useTheme,
  alpha,
  Stack,
  Button,
  Divider,
  Collapse,
  IconButton,
  Card,
  CardContent,
  Badge
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
  Clear,
  ExpandMore,
  ExpandLess,
  School,
  Code,
  DesignServices,
  Engineering,
  AccountBalance,
  LocalHospital,
  Construction,
  Restaurant,
  Star
} from '@mui/icons-material';
import { FilterState } from '../hooks/useJobFilters';

interface CompactJobFilterProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onClearFilters: () => void;
  totalJobs: number;
  isLoading?: boolean;
  type?: 'jobs' | 'internships';
}

interface FilterSection {
  key: keyof FilterState;
  label: string;
  icon: React.ReactNode;
  color: string;
  options: Array<{
    value: string;
    label: string;
    color?: string;
    icon?: React.ReactNode;
  }>;
  expanded?: boolean;
}

const CompactJobFilter: React.FC<CompactJobFilterProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  totalJobs,
  isLoading = false,
  type = 'jobs'
}) => {
  const theme = useTheme();
  const [expandedSections, setExpandedSections] = useState<string[]>(['categories']);

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionKey)
        ? prev.filter(key => key !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const filterSections: FilterSection[] = [
    {
      key: 'categories',
      label: type === 'internships' ? 'Internship Areas' : 'Categories',
      icon: <BusinessCenter />,
      color: '#1976d2',
      options: type === 'internships' 
        ? [
            { value: 'technology', label: 'Technology', color: '#1976d2', icon: <Code /> },
            { value: 'design', label: 'Design', color: '#e91e63', icon: <DesignServices /> },
            { value: 'business', label: 'Business', color: '#ff9800', icon: <BusinessCenter /> },
            { value: 'engineering', label: 'Engineering', color: '#4caf50', icon: <Engineering /> },
            { value: 'finance', label: 'Finance', color: '#2196f3', icon: <AccountBalance /> },
            { value: 'healthcare', label: 'Healthcare', color: '#f44336', icon: <LocalHospital /> },
            { value: 'construction', label: 'Construction', color: '#795548', icon: <Construction /> },
            { value: 'hospitality', label: 'Hospitality', color: '#9c27b0', icon: <Restaurant /> }
          ]
        : [
            { value: 'jobs', label: 'Jobs', color: '#1976d2', icon: <Work /> },
            { value: 'internships', label: 'Internships', color: '#4caf50', icon: <School /> },
            { value: 'access_to_finance', label: 'Finance Access', color: '#ff9800', icon: <AttachMoney /> },
            { value: 'tenders', label: 'Tenders', color: '#f44336', icon: <BusinessCenter /> },
            { value: 'trainings', label: 'Trainings', color: '#2196f3', icon: <School /> },
            { value: 'scholarships', label: 'Scholarships', color: '#9c27b0', icon: <Star /> }
          ]
    },
    {
      key: 'jobTypes',
      label: type === 'internships' ? 'Duration' : 'Job Types',
      icon: <Work />,
      color: '#4caf50',
      options: type === 'internships'
        ? [
            { value: '1-3_months', label: '1-3 Months', color: '#4caf50' },
            { value: '3-6_months', label: '3-6 Months', color: '#2196f3' },
            { value: '6-12_months', label: '6-12 Months', color: '#ff9800' },
            { value: '12+_months', label: '12+ Months', color: '#f44336' }
          ]
        : [
            { value: 'full-time', label: 'Full-time', color: '#4caf50' },
            { value: 'part-time', label: 'Part-time', color: '#2196f3' },
            { value: 'contract', label: 'Contract', color: '#ff9800' },
            { value: 'freelance', label: 'Freelance', color: '#f44336' },
            { value: 'temporary', label: 'Temporary', color: '#9c27b0' }
          ]
    },
    {
      key: 'workLocation',
      label: 'Work Location',
      icon: <LocationOn />,
      color: '#ff9800',
      options: [
        { value: 'remote', label: 'Remote', color: '#4caf50', icon: <Computer /> },
        { value: 'hybrid', label: 'Hybrid', color: '#2196f3', icon: <Home /> },
        { value: 'on-site', label: 'On-site', color: '#ff9800', icon: <Apartment /> }
      ]
    },
    {
      key: 'experienceLevel',
      label: 'Experience Level',
      icon: <TrendingUp />,
      color: '#2196f3',
      options: [
        { value: 'entry', label: 'Entry Level', color: '#4caf50' },
        { value: 'junior', label: 'Junior (1-2 years)', color: '#2196f3' },
        { value: 'mid', label: 'Mid (3-5 years)', color: '#ff9800' },
        { value: 'senior', label: 'Senior (5+ years)', color: '#f44336' },
        { value: 'executive', label: 'Executive', color: '#9c27b0' }
      ]
    }
  ];

  const handleFilterClick = (filterKey: keyof FilterState, value: any) => {
    const currentValues = filters[filterKey];
    
    if (Array.isArray(currentValues)) {
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      onFilterChange(filterKey, newValues);
    } else {
      onFilterChange(filterKey, currentValues === value ? '' : value);
    }
  };

  const isFilterActive = (filterKey: keyof FilterState, value: any): boolean => {
    const currentValues = filters[filterKey];
    
    if (Array.isArray(currentValues)) {
      return currentValues.includes(value);
    }
    return currentValues === value;
  };

  const getActiveFiltersCount = (): number => {
    let count = 0;
    if (filters.searchTerm?.trim()) count++;
    if (filters.location?.trim()) count++;
    if (Array.isArray(filters.jobTypes) && filters.jobTypes.length > 0) count++;
    if (Array.isArray(filters.workLocation) && filters.workLocation.length > 0) count++;
    if (Array.isArray(filters.experienceLevel) && filters.experienceLevel.length > 0) count++;
    if (Array.isArray(filters.categories) && filters.categories.length > 0) count++;
    if (filters.postedDate && filters.postedDate !== 'all') count++;
    return count;
  };

  const activeCount = getActiveFiltersCount();

  return (
    <Card
      sx={{
        height: 'fit-content',
        maxHeight: '80vh',
        overflowY: 'auto',
        position: 'sticky',
        top: 20,
        background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.98)} 0%, ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        borderRadius: 3,
        boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.12)}`,
        '&::-webkit-scrollbar': {
          width: '4px'
        },
        '&::-webkit-scrollbar-track': {
          background: alpha(theme.palette.divider, 0.1)
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.primary.main, 0.3),
          borderRadius: '2px'
        }
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                color: 'white',
                boxShadow: `0 4px 12px ${alpha('#667eea', 0.3)}`
              }}
            >
              <FilterList fontSize="small" />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
                Smart Filters
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalJobs.toLocaleString()} {type}
              </Typography>
            </Box>
          </Box>

          {activeCount > 0 && (
            <Button
              fullWidth
              size="small"
              startIcon={<Clear />}
              onClick={onClearFilters}
              variant="outlined"
              sx={{
                borderColor: alpha(theme.palette.error.main, 0.3),
                color: 'error.main',
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                height: 36,
                '&:hover': {
                  borderColor: 'error.main',
                  backgroundColor: alpha(theme.palette.error.main, 0.08),
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

        {/* Filter Sections */}
        <Stack spacing={2}>
          {filterSections.map((section) => {
            const isExpanded = expandedSections.includes(section.key);
            const sectionActiveCount = Array.isArray(filters[section.key]) 
              ? (filters[section.key] as any[]).length 
              : (filters[section.key] ? 1 : 0);

            return (
              <Box key={section.key}>
                <Button
                  fullWidth
                  onClick={() => toggleSection(section.key)}
                  sx={{
                    justifyContent: 'space-between',
                    textTransform: 'none',
                    color: 'text.primary',
                    fontWeight: 600,
                    borderRadius: 2,
                    p: 1.5,
                    backgroundColor: alpha(section.color, 0.08),
                    border: `1px solid ${alpha(section.color, 0.2)}`,
                    '&:hover': {
                      backgroundColor: alpha(section.color, 0.12),
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(section.color, 0.2)}`
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        color: section.color,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {section.icon}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {section.label}
                    </Typography>
                    {sectionActiveCount > 0 && (
                      <Badge
                        badgeContent={sectionActiveCount}
                        color="primary"
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.7rem',
                            height: 18,
                            minWidth: 18
                          }
                        }}
                      />
                    )}
                  </Box>
                  {isExpanded ? <ExpandLess /> : <ExpandMore />}
                </Button>

                <Collapse in={isExpanded}>
                  <Box sx={{ p: 1.5, pt: 2 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                      {section.options.map((option) => {
                        const isActive = isFilterActive(section.key, option.value);
                        
                        return (
                          <Chip
                            key={option.value}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {option.icon}
                                {option.label}
                              </Box>
                            }
                            onClick={() => handleFilterClick(section.key, option.value)}
                            variant={isActive ? 'filled' : 'outlined'}
                            size="small"
                            sx={{
                              cursor: 'pointer',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              borderRadius: 2,
                              fontWeight: isActive ? 700 : 500,
                              fontSize: '0.75rem',
                              height: 28,
                              backgroundColor: isActive 
                                ? option.color || section.color
                                : 'transparent',
                              borderColor: option.color || section.color,
                              color: isActive 
                                ? 'white'
                                : option.color || section.color,
                              '&:hover': {
                                transform: 'translateY(-2px) scale(1.05)',
                                boxShadow: `0 6px 20px ${alpha(option.color || section.color, 0.3)}`,
                                backgroundColor: isActive 
                                  ? option.color || section.color
                                  : alpha(option.color || section.color, 0.1)
                              },
                              '&:active': {
                                transform: 'translateY(0) scale(0.98)'
                              }
                            }}
                          />
                        );
                      })}
                    </Stack>
                  </Box>
                </Collapse>

                <Divider 
                  sx={{ 
                    my: 1,
                    opacity: 0.2,
                    background: `linear-gradient(90deg, transparent 0%, ${alpha(theme.palette.divider, 0.5)} 50%, transparent 100%)`
                  }} 
                />
              </Box>
            );
          })}
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
              backgroundColor: alpha(theme.palette.background.paper, 0.8),
              backdropFilter: 'blur(4px)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Updating filters...
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default CompactJobFilter;
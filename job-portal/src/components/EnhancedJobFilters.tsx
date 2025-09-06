import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  Grid,
  Chip,
  Typography,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  useTheme,
  alpha,
  Collapse,
  Tooltip,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Search,
  LocationOn,
  FilterList,
  Clear,
  ExpandMore,
  Work,
  AttachMoney,
  Schedule,
  School,
  Business,
  Tune,
  Sort,
  Home,
  Computer,
  AutoAwesome,
  LocalOffer,
  AccessTime,
  TrendingUp,
  Psychology,
  Star,
  BookmarkBorder
} from '@mui/icons-material';

export interface FilterState {
  searchTerm: string;
  location: string;
  jobTypes: string[];
  workLocation: string[];
  salaryRange: [number, number];
  experienceLevel: string[];
  categories: string[];
  companies: string[];
  postedDate: string;
  sortBy: string;
}

export interface EnhancedJobFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  jobCategories: Array<{ key: string; label: string; count: number }>;
  companies: string[];
  locations: string[];
  totalJobs: number;
  filteredJobs: number;
  isLoading?: boolean;
  isMobile?: boolean;
  showAdvanced?: boolean;
}

const EnhancedJobFilters: React.FC<EnhancedJobFiltersProps> = ({
  filters,
  onFiltersChange,
  jobCategories,
  companies,
  locations,
  totalJobs,
  filteredJobs,
  isLoading = false,
  isMobile = false,
  showAdvanced = false
}) => {
  const theme = useTheme();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced);
  const [searchDebounce, setSearchDebounce] = useState(filters.searchTerm);

  // Pre-defined filter options for better UX
  const jobTypeOptions = [
    { value: 'full-time', label: 'Full-time', icon: Work, color: 'primary' },
    { value: 'part-time', label: 'Part-time', icon: Schedule, color: 'info' },
    { value: 'contract', label: 'Contract', icon: Business, color: 'warning' },
    { value: 'freelance', label: 'Freelance', icon: Computer, color: 'success' },
    { value: 'internship', label: 'Internship', icon: School, color: 'secondary' }
  ];

  const workLocationOptions = [
    { value: 'remote', label: 'Remote', icon: Computer, description: 'Work from anywhere' },
    { value: 'hybrid', label: 'Hybrid', icon: Psychology, description: 'Mix of office & remote' },
    { value: 'on-site', label: 'On-site', icon: Home, description: 'Office-based work' }
  ];

  const experienceLevelOptions = [
    { value: 'entry', label: 'Entry Level', description: '0-2 years' },
    { value: 'junior', label: 'Junior', description: '1-3 years' },
    { value: 'mid', label: 'Mid Level', description: '3-5 years' },
    { value: 'senior', label: 'Senior', description: '5+ years' },
    { value: 'lead', label: 'Lead/Manager', description: '7+ years' },
    { value: 'executive', label: 'Executive', description: '10+ years' }
  ];

  const postedDateOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  const sortOptions = [
    { value: 'relevance', label: 'Most Relevant', icon: AutoAwesome },
    { value: 'date', label: 'Latest Posted', icon: AccessTime },
    { value: 'salary-high', label: 'Highest Salary', icon: TrendingUp },
    { value: 'salary-low', label: 'Lowest Salary', icon: AttachMoney },
    { value: 'title', label: 'Job Title A-Z', icon: Sort },
    { value: 'company', label: 'Company A-Z', icon: Business }
  ];

  // Debounced search to improve performance
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchDebounce !== filters.searchTerm) {
        updateFilter('searchTerm', searchDebounce);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchDebounce]);

  // Update filter helper
  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  // Toggle array filter helper
  const toggleArrayFilter = (key: keyof FilterState, value: string) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    updateFilter(key, newArray);
  };

  // Clear all filters
  const clearAllFilters = () => {
    onFiltersChange({
      searchTerm: '',
      location: '',
      jobTypes: [],
      workLocation: [],
      salaryRange: [0, 200],
      experienceLevel: [],
      categories: [],
      companies: [],
      postedDate: 'all',
      sortBy: 'relevance'
    });
    setSearchDebounce('');
  };

  // Calculate active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm.trim()) count++;
    if (filters.location.trim()) count++;
    if (filters.jobTypes.length > 0) count++;
    if (filters.workLocation.length > 0) count++;
    if (filters.salaryRange[0] > 0 || filters.salaryRange[1] < 200) count++;
    if (filters.experienceLevel.length > 0) count++;
    if (filters.categories.length > 0) count++;
    if (filters.companies.length > 0) count++;
    if (filters.postedDate !== 'all') count++;
    return count;
  }, [filters]);

  // Get filtered percentage for visual feedback
  const filteredPercentage = totalJobs > 0 ? (filteredJobs / totalJobs) * 100 : 100;

  return (
    <Box sx={{ mb: 3 }}>
      {/* Main Search Bar */}
      <Paper
        elevation={2}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2,
          borderRadius: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
        }}
      >
        <Grid container spacing={2} alignItems="center">
          {/* Search Input */}
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              placeholder={isMobile ? "Search jobs..." : "Search for jobs, companies, skills, or keywords..."}
              value={searchDebounce}
              onChange={(e) => setSearchDebounce(e.target.value)}
              size={isMobile ? 'small' : 'medium'}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchDebounce && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchDebounce('');
                        updateFilter('searchTerm', '');
                      }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper
                  }
                }
              }}
            />
          </Grid>

          {/* Location Input with Autocomplete */}
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              freeSolo
              options={locations}
              value={filters.location}
              onChange={(_, newValue) => updateFilter('location', newValue || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder={isMobile ? "Location" : "Location or Remote"}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: alpha(theme.palette.background.paper, 0.8)
                    }
                  }}
                />
              )}
            />
          </Grid>

          {/* Quick Sort */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
              <Select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                displayEmpty
                sx={{
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }
                }}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <option.icon fontSize="small" />
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Filter Toggle & Clear */}
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1}>
              <Badge badgeContent={activeFiltersCount} color="primary">
                <Button
                  variant={isAdvancedOpen ? 'contained' : 'outlined'}
                  startIcon={<Tune />}
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{ borderRadius: 3, minWidth: 'auto' }}
                >
                  {isMobile ? 'Filters' : 'Advanced Filters'}
                </Button>
              </Badge>
              
              {activeFiltersCount > 0 && (
                <Tooltip title="Clear all filters">
                  <IconButton
                    onClick={clearAllFilters}
                    size="small"
                    sx={{
                      color: 'error.main',
                      '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1) }
                    }}
                  >
                    <Clear />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Grid>
        </Grid>

        {/* Results Summary */}
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing <strong>{filteredJobs.toLocaleString()}</strong> of{' '}
            <strong>{totalJobs.toLocaleString()}</strong> jobs
          </Typography>
          
          {filteredPercentage < 100 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, maxWidth: 200 }}>
              <LinearProgress
                variant="determinate"
                value={filteredPercentage}
                sx={{
                  flex: 1,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3
                  }
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {Math.round(filteredPercentage)}%
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Advanced Filters */}
      <Collapse in={isAdvancedOpen}>
        <Paper
          elevation={1}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(10px)'
          }}
        >
          {/* Quick Filter Chips */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Quick Filters
            </Typography>
            
            {/* Job Categories */}
            <Box sx={{ mb: 2 }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {jobCategories.slice(0, isMobile ? 4 : 8).map((category) => (
                  <Chip
                    key={category.key}
                    label={`${category.label} (${category.count})`}
                    variant={filters.categories.includes(category.key) ? 'filled' : 'outlined'}
                    color={filters.categories.includes(category.key) ? 'primary' : 'default'}
                    size={isMobile ? 'small' : 'medium'}
                    onClick={() => toggleArrayFilter('categories', category.key)}
                    sx={{
                      borderRadius: 20,
                      '&:hover': { transform: 'scale(1.05)' },
                      transition: 'all 0.2s ease',
                      fontSize: { xs: '0.75rem', md: '0.875rem' }
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Work Location Types */}
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              {workLocationOptions.map((option) => (
                <Tooltip key={option.value} title={option.description}>
                  <Chip
                    icon={<option.icon />}
                    label={option.label}
                    variant={filters.workLocation.includes(option.value) ? 'filled' : 'outlined'}
                    color={filters.workLocation.includes(option.value) ? 'primary' : 'default'}
                    onClick={() => toggleArrayFilter('workLocation', option.value)}
                    sx={{
                      borderRadius: 20,
                      '&:hover': { transform: 'scale(1.05)' },
                      transition: 'all 0.2s ease'
                    }}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Detailed Filters */}
          <Grid container spacing={3}>
            {/* Job Types */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Employment Type
              </Typography>
              <Stack spacing={1}>
                {jobTypeOptions.map((type) => (
                  <Chip
                    key={type.value}
                    icon={<type.icon />}
                    label={type.label}
                    variant={filters.jobTypes.includes(type.value) ? 'filled' : 'outlined'}
                    color={filters.jobTypes.includes(type.value) ? (type.color as any) : 'default'}
                    onClick={() => toggleArrayFilter('jobTypes', type.value)}
                    sx={{
                      justifyContent: 'flex-start',
                      borderRadius: 2,
                      '&:hover': { transform: 'translateX(4px)' },
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </Stack>
            </Grid>

            {/* Experience Level */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Experience Level
              </Typography>
              <Stack spacing={1}>
                {experienceLevelOptions.map((exp) => (
                  <Tooltip key={exp.value} title={exp.description} placement="right">
                    <Chip
                      label={exp.label}
                      variant={filters.experienceLevel.includes(exp.value) ? 'filled' : 'outlined'}
                      color={filters.experienceLevel.includes(exp.value) ? 'primary' : 'default'}
                      onClick={() => toggleArrayFilter('experienceLevel', exp.value)}
                      sx={{
                        justifyContent: 'flex-start',
                        borderRadius: 2,
                        '&:hover': { transform: 'translateX(4px)' },
                        transition: 'all 0.2s ease'
                      }}
                    />
                  </Tooltip>
                ))}
              </Stack>
            </Grid>

            {/* Salary Range */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Salary Range (USD)
              </Typography>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={filters.salaryRange}
                  onChange={(_, newValue) => updateFilter('salaryRange', newValue)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `$${value}k`}
                  min={0}
                  max={200}
                  step={5}
                  marks={[
                    { value: 0, label: '$0k' },
                    { value: 50, label: '$50k' },
                    { value: 100, label: '$100k' },
                    { value: 200, label: '$200k+' }
                  ]}
                  sx={{
                    color: 'primary.main',
                    height: 8,
                    '& .MuiSlider-track': { border: 'none' },
                    '& .MuiSlider-thumb': {
                      height: 24,
                      width: 24,
                      '&:hover': { boxShadow: '0px 0px 0px 8px rgba(58, 133, 137, 0.16)' }
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    ${filters.salaryRange[0]}k
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {filters.salaryRange[1] >= 200 ? '$200k+' : `$${filters.salaryRange[1]}k`}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Posted Date & Company */}
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
                Posted Date
              </Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                {postedDateOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    variant={filters.postedDate === option.value ? 'filled' : 'outlined'}
                    color={filters.postedDate === option.value ? 'primary' : 'default'}
                    onClick={() => updateFilter('postedDate', option.value)}
                    sx={{
                      justifyContent: 'flex-start',
                      borderRadius: 2,
                      '&:hover': { transform: 'translateX(4px)' },
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </Stack>

              {/* Companies */}
              {companies.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Top Companies
                  </Typography>
                  <Autocomplete
                    multiple
                    options={companies}
                    value={filters.companies}
                    onChange={(_, newValue) => updateFilter('companies', newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          size="small"
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Select companies..."
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2
                          }
                        }}
                      />
                    )}
                  />
                </>
              )}
            </Grid>
          </Grid>

          {/* Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}` }}>
            <Typography variant="body2" color="text.secondary">
              {activeFiltersCount} active filter{activeFiltersCount !== 1 ? 's' : ''}
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Clear />}
                onClick={clearAllFilters}
                disabled={activeFiltersCount === 0}
                sx={{ borderRadius: 2 }}
              >
                Clear All
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsAdvancedOpen(false)}
                sx={{ borderRadius: 2 }}
              >
                Hide Filters
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Collapse>

      {/* Loading Indicator */}
      {isLoading && (
        <LinearProgress
          sx={{
            mt: 1,
            borderRadius: 1,
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            '& .MuiLinearProgress-bar': {
              borderRadius: 1
            }
          }}
        />
      )}
    </Box>
  );
};

export default EnhancedJobFilters;
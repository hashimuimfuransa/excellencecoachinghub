import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Chip,
  Stack,
  Popper,
  ClickAwayListener,
  Fade,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  useTheme,
  alpha,
  Avatar,
  Badge,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  Grid,
  ButtonGroup,
  Button
} from '@mui/material';
import {
  Search,
  Clear,
  TrendingUp,
  Work,
  LocationOn,
  Business,
  Psychology,
  Code,
  AutoAwesome,
  History,
  Star,
  Bookmark,
  LocalOffer,
  Title,
  Person,
  Category,
  ExpandMore
} from '@mui/icons-material';

export type SearchType = 'all' | 'title' | 'company' | 'skills' | 'location' | 'category';

interface SearchSuggestion {
  type: 'job' | 'company' | 'skill' | 'location' | 'category' | 'trending' | 'recent';
  text: string;
  subtitle?: string;
  count?: number;
  icon?: React.ReactNode;
}

interface SmartJobSearchProps {
  searchTerm: string;
  searchType?: SearchType;
  onSearchChange: (term: string, type?: SearchType) => void;
  onSearchTypeChange?: (type: SearchType) => void;
  onSuggestionSelect?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  autoFocus?: boolean;
  recentSearches?: string[];
  trendingSearches?: string[];
  popularJobs?: Array<{ title: string; count: number }>;
  popularCompanies?: Array<{ name: string; count: number }>;
  popularSkills?: Array<{ name: string; count: number }>;
  popularLocations?: Array<{ name: string; count: number }>;
  isLoading?: boolean;
  disabled?: boolean;
  showSearchType?: boolean;
}

const SmartJobSearch: React.FC<SmartJobSearchProps> = ({
  searchTerm,
  searchType = 'all',
  onSearchChange,
  onSearchTypeChange,
  onSuggestionSelect,
  placeholder,
  size = 'medium',
  autoFocus = false,
  recentSearches = [],
  trendingSearches = [],
  popularJobs = [],
  popularCompanies = [],
  popularSkills = [],
  popularLocations = [],
  isLoading = false,
  disabled = false,
  showSearchType = true
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchTerm);
  const [currentSearchType, setCurrentSearchType] = useState<SearchType>(searchType);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const popperRef = useRef<HTMLDivElement>(null);

  // Search type options with icons and descriptions
  const searchTypeOptions = [
    { 
      value: 'all' as SearchType, 
      label: 'All', 
      icon: Search, 
      placeholder: 'Search jobs, companies, skills...',
      description: 'Search everything'
    },
    { 
      value: 'title' as SearchType, 
      label: 'Job Title', 
      icon: Work, 
      placeholder: 'e.g., Software Engineer, Designer...',
      description: 'Search by job titles'
    },
    { 
      value: 'company' as SearchType, 
      label: 'Company', 
      icon: Business, 
      placeholder: 'e.g., Google, Microsoft...',
      description: 'Search by company names'
    },
    { 
      value: 'skills' as SearchType, 
      label: 'Skills', 
      icon: Code, 
      placeholder: 'e.g., React, Python, Design...',
      description: 'Search by required skills'
    },
    { 
      value: 'location' as SearchType, 
      label: 'Location', 
      icon: LocationOn, 
      placeholder: 'e.g., New York, Remote...',
      description: 'Search by job location'
    },
    { 
      value: 'category' as SearchType, 
      label: 'Category', 
      icon: Category, 
      placeholder: 'e.g., Technology, Marketing...',
      description: 'Search by job category'
    }
  ];

  const getCurrentSearchOption = () => 
    searchTypeOptions.find(opt => opt.value === currentSearchType) || searchTypeOptions[0];

  const dynamicPlaceholder = placeholder || getCurrentSearchOption().placeholder;

  // Update local search when prop changes
  useEffect(() => {
    setSearchInput(searchTerm);
  }, [searchTerm]);

  // Update search type when prop changes
  useEffect(() => {
    setCurrentSearchType(searchType);
  }, [searchType]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        onSearchChange(searchInput, currentSearchType);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput, searchTerm, currentSearchType, onSearchChange]);

  // Handle search type change
  const handleSearchTypeChange = (newType: SearchType) => {
    setCurrentSearchType(newType);
    if (onSearchTypeChange) {
      onSearchTypeChange(newType);
    }
    // Immediately trigger search with new type if there's a search term
    if (searchInput.trim()) {
      onSearchChange(searchInput, newType);
    }
  };

  // Generate suggestions based on search input and type
  const suggestions = useMemo(() => {
    const results: SearchSuggestion[] = [];
    const query = searchInput.toLowerCase().trim();

    if (!query) {
      // Show type-specific suggestions when empty
      if (recentSearches.length > 0) {
        results.push(
          ...recentSearches.slice(0, 3).map(search => ({
            type: 'recent' as const,
            text: search,
            icon: <History fontSize="small" color="action" />
          }))
        );
      }

      // Show type-specific popular items
      switch (currentSearchType) {
        case 'title':
        case 'all':
          if (popularJobs.length > 0) {
            results.push(
              ...popularJobs.slice(0, currentSearchType === 'title' ? 6 : 3).map(job => ({
                type: 'job' as const,
                text: job.title,
                count: job.count,
                icon: <Work fontSize="small" color="primary" />
              }))
            );
          }
          break;
        case 'company':
          if (popularCompanies.length > 0) {
            results.push(
              ...popularCompanies.slice(0, 6).map(company => ({
                type: 'company' as const,
                text: company.name,
                count: company.count,
                icon: <Business fontSize="small" color="secondary" />
              }))
            );
          }
          break;
        case 'skills':
          if (popularSkills.length > 0) {
            results.push(
              ...popularSkills.slice(0, 6).map(skill => ({
                type: 'skill' as const,
                text: skill.name,
                count: skill.count,
                icon: <Code fontSize="small" color="info" />
              }))
            );
          }
          break;
        case 'location':
          if (popularLocations.length > 0) {
            results.push(
              ...popularLocations.slice(0, 6).map(location => ({
                type: 'location' as const,
                text: location.name,
                count: location.count,
                icon: <LocationOn fontSize="small" color="warning" />
              }))
            );
          }
          break;
      }

      if (trendingSearches.length > 0 && currentSearchType === 'all') {
        results.push(
          ...trendingSearches.slice(0, 4).map(search => ({
            type: 'trending' as const,
            text: search,
            icon: <TrendingUp fontSize="small" color="primary" />
          }))
        );
      }

      return results.slice(0, 8);
    }

    // Filter suggestions based on query and search type
    const addIfMatch = (items: any[], type: SearchSuggestion['type'], iconFunc: () => React.ReactNode, textKey: string = 'name', countKey?: string) => {
      items.forEach(item => {
        const text = typeof item === 'string' ? item : item[textKey];
        if (text.toLowerCase().includes(query)) {
          results.push({
            type,
            text,
            count: countKey ? item[countKey] : undefined,
            icon: iconFunc()
          });
        }
      });
    };

    // Search based on selected type
    switch (currentSearchType) {
      case 'all':
        // Search in all categories
        addIfMatch(popularJobs, 'job', () => <Work fontSize="small" color="primary" />, 'title', 'count');
        addIfMatch(popularCompanies, 'company', () => <Business fontSize="small" color="secondary" />, 'name', 'count');
        addIfMatch(popularSkills, 'skill', () => <Code fontSize="small" color="info" />, 'name', 'count');
        addIfMatch(popularLocations, 'location', () => <LocationOn fontSize="small" color="warning" />, 'name', 'count');
        break;
      case 'title':
        addIfMatch(popularJobs, 'job', () => <Work fontSize="small" color="primary" />, 'title', 'count');
        break;
      case 'company':
        addIfMatch(popularCompanies, 'company', () => <Business fontSize="small" color="secondary" />, 'name', 'count');
        break;
      case 'skills':
        addIfMatch(popularSkills, 'skill', () => <Code fontSize="small" color="info" />, 'name', 'count');
        break;
      case 'location':
        addIfMatch(popularLocations, 'location', () => <LocationOn fontSize="small" color="warning" />, 'name', 'count');
        break;
    }

    // Smart suggestions based on common patterns
    if (query.includes('remote')) {
      results.unshift({
        type: 'category',
        text: 'Remote Jobs',
        subtitle: 'Work from anywhere',
        icon: <Psychology fontSize="small" color="success" />
      });
    }

    if (query.includes('part') || query.includes('part-time')) {
      results.unshift({
        type: 'category',
        text: 'Part-time Jobs',
        subtitle: 'Flexible hours',
        icon: <LocalOffer fontSize="small" color="info" />
      });
    }

    if (query.includes('intern')) {
      results.unshift({
        type: 'category',
        text: 'Internship Opportunities',
        subtitle: 'Entry-level positions',
        icon: <Star fontSize="small" color="warning" />
      });
    }

    return results.slice(0, 8);
  }, [searchInput, currentSearchType, recentSearches, trendingSearches, popularJobs, popularCompanies, popularSkills, popularLocations]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchInput(suggestion.text);
    onSearchChange(suggestion.text, currentSearchType);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else if (searchInput.trim()) {
          onSearchChange(searchInput, currentSearchType);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear search
  const handleClear = () => {
    setSearchInput('');
    onSearchChange('', currentSearchType);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  // Get suggestion type label
  const getSuggestionTypeLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'job': return 'Job Title';
      case 'company': return 'Company';
      case 'skill': return 'Skill';
      case 'location': return 'Location';
      case 'category': return 'Category';
      case 'trending': return 'Trending';
      case 'recent': return 'Recent';
      default: return '';
    }
  };

  // Get suggestion type color
  const getSuggestionTypeColor = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'job': return 'primary';
      case 'company': return 'secondary';
      case 'skill': return 'info';
      case 'location': return 'warning';
      case 'category': return 'success';
      case 'trending': return 'primary';
      case 'recent': return 'default';
      default: return 'default';
    }
  };

  return (
    <ClickAwayListener onClickAway={() => setIsOpen(false)}>
      <Box sx={{ position: 'relative', width: '100%' }}>
        {/* Search Type Selector + Search Bar */}
        <Box 
          sx={{ 
            display: 'flex', 
            gap: 1,
            alignItems: 'stretch'
          }}
        >
          {/* Search Type Selector */}
          {showSearchType && (
            <FormControl 
              size={size} 
              sx={{ 
                minWidth: { xs: 100, sm: 140 },
                '& .MuiOutlinedInput-root': {
                  borderRadius: size === 'large' ? 4 : 3,
                  backgroundColor: alpha(theme.palette.background.paper, 0.9),
                  backdropFilter: 'blur(8px)',
                  '&:hover': {
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: `0 2px 10px ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                }
              }}
            >
              <Select
                value={currentSearchType}
                onChange={(e) => handleSearchTypeChange(e.target.value as SearchType)}
                displayEmpty
                disabled={disabled}
                sx={{
                  '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    py: size === 'small' ? 0.6 : size === 'large' ? 1.2 : 0.9
                  }
                }}
              >
                {searchTypeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Icon fontSize="small" />
                        <Typography variant="body2">
                          {option.label}
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          )}

          {/* Main Search Input */}
          <TextField
            ref={inputRef}
            fullWidth
            value={searchInput}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            placeholder={dynamicPlaceholder}
            size={size}
            autoFocus={autoFocus}
            disabled={disabled}
            InputProps={{
              startAdornment: !showSearchType && (
                <InputAdornment position="start">
                  {React.createElement(getCurrentSearchOption().icon, {
                    color: "action",
                    fontSize: size === 'small' ? 'small' : 'medium'
                  })}
                </InputAdornment>
              ),
              endAdornment: searchInput && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={handleClear}
                    sx={{
                      color: 'text.secondary',
                      '&:hover': { 
                        color: 'error.main',
                        backgroundColor: alpha(theme.palette.error.main, 0.1)
                      }
                    }}
                  >
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: size === 'large' ? 4 : 3,
                backgroundColor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease',
                minHeight: size === 'small' ? 44 : size === 'large' ? 58 : 50,
                '&:hover': {
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.1)}`
                },
                '&.Mui-focused': {
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: `0 6px 30px ${alpha(theme.palette.primary.main, 0.15)}`,
                  '& fieldset': {
                    borderColor: theme.palette.primary.main,
                    borderWidth: 2
                  }
                }
              },
              '& .MuiOutlinedInput-input': {
                py: size === 'small' ? 0.8 : size === 'large' ? 1.2 : 1,
                fontSize: size === 'large' ? '1.05rem' : size === 'small' ? '0.85rem' : '0.95rem'
              }
            }}
          />
        </Box>

        {/* Search Type Description */}
        {showSearchType && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ 
              display: 'block',
              mt: 0.5,
              ml: 1,
              opacity: 0.8
            }}
          >
            {getCurrentSearchOption().description}
          </Typography>
        )}

        {/* Suggestions Dropdown */}
        <Popper
          open={isOpen && suggestions.length > 0}
          anchorEl={inputRef.current}
          ref={popperRef}
          placement="bottom-start"
          style={{ width: inputRef.current?.offsetWidth, zIndex: 1300 }}
          transition
        >
          {({ TransitionProps }) => (
            <Fade {...TransitionProps} timeout={200}>
              <Paper
                elevation={8}
                sx={{
                  mt: 1,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                  backgroundColor: alpha(theme.palette.background.paper, 0.95),
                  backdropFilter: 'blur(12px)',
                  maxHeight: 400,
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: 6,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    borderRadius: 3,
                  }
                }}
              >
                <List disablePadding>
                  {suggestions.map((suggestion, index) => (
                    <ListItemButton
                      key={`${suggestion.type}-${suggestion.text}-${index}`}
                      selected={index === highlightedIndex}
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.05)
                        },
                        '&.Mui-selected': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.15)
                          }
                        }
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {suggestion.icon}
                      </ListItemIcon>
                      
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {suggestion.text}
                            </Typography>
                            {suggestion.count && (
                              <Badge
                                badgeContent={suggestion.count}
                                color="primary"
                                sx={{
                                  '& .MuiBadge-badge': {
                                    fontSize: '0.7rem',
                                    minWidth: 18,
                                    height: 18
                                  }
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={suggestion.subtitle}
                        sx={{
                          '& .MuiListItemText-primary': {
                            mb: suggestion.subtitle ? 0.5 : 0
                          },
                          '& .MuiListItemText-secondary': {
                            fontSize: '0.75rem',
                            color: 'text.secondary'
                          }
                        }}
                      />
                      
                      <Chip
                        label={getSuggestionTypeLabel(suggestion.type)}
                        size="small"
                        variant="outlined"
                        color={getSuggestionTypeColor(suggestion.type) as any}
                        sx={{
                          fontSize: '0.65rem',
                          height: 20,
                          '& .MuiChip-label': {
                            px: 1
                          }
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>

                {/* Footer with search tip */}
                {searchInput && (
                  <>
                    <Divider />
                    <Box sx={{ p: 1.5, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Press Enter to search for "{searchInput}"
                      </Typography>
                    </Box>
                  </>
                )}
              </Paper>
            </Fade>
          )}
        </Popper>
      </Box>
    </ClickAwayListener>
  );
};

export default SmartJobSearch;
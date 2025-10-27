import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  InputBase,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Chip,
  Divider,
  CircularProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  Person,
  Work,
  Business,
  TrendingUp,
  History,
  Clear,
  Article,
  LocationOn,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import searchService, { SearchUser, SearchJob, SearchPost } from '../../services/searchService';
import { debounce } from 'lodash';

interface SearchSuggestion {
  type: 'user' | 'job' | 'post' | 'skill' | 'company' | 'history' | 'trending';
  id?: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  icon?: React.ReactElement;
  data?: SearchUser | SearchJob | SearchPost;
}

interface EnhancedSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResultSelect?: (result: any) => void;
  showSuggestions?: boolean;
  maxSuggestions?: number;
}

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  placeholder = "Search jobs, people, companies, skills...",
  onSearch,
  onResultSelect,
  showSuggestions = true,
  maxSuggestions = 10
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [trendingData, setTrendingData] = useState<any>(null);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const [suggestionsData, searchResults] = await Promise.all([
        searchService.getSuggestions(searchQuery),
        searchService.search(searchQuery, { limit: 5 })
      ]);

      const newSuggestions: SearchSuggestion[] = [];

      // Add user suggestions
      searchResults.users.slice(0, 3).forEach(user => {
        newSuggestions.push({
          type: 'user',
          id: user._id,
          title: `${user.firstName} ${user.lastName}`,
          subtitle: user.title || user.role,
          avatar: user.profilePicture,
          data: user
        });
      });

      // Add job suggestions
      searchResults.jobs.slice(0, 3).forEach(job => {
        newSuggestions.push({
          type: 'job',
          id: job._id,
          title: job.title,
          subtitle: `${job.company.name} • ${job.location}`,
          avatar: job.company.logo,
          icon: <Work fontSize="small" />,
          data: job
        });
      });

      // Add post suggestions
      searchResults.posts.slice(0, 2).forEach(post => {
        newSuggestions.push({
          type: 'post',
          id: post._id,
          title: post.content.slice(0, 60) + (post.content.length > 60 ? '...' : ''),
          subtitle: `by ${post.author.firstName} ${post.author.lastName}`,
          avatar: post.author.profilePicture,
          icon: <Article fontSize="small" />,
          data: post
        });
      });

      // Add skill suggestions
      suggestionsData.skills.slice(0, 2).forEach(skill => {
        newSuggestions.push({
          type: 'skill',
          title: skill,
          subtitle: 'Skill',
          icon: <TrendingUp fontSize="small" />
        });
      });

      // Add company suggestions
      suggestionsData.companies.slice(0, 2).forEach(company => {
        newSuggestions.push({
          type: 'company',
          title: company,
          subtitle: 'Company',
          icon: <Business fontSize="small" />
        });
      });

      setSuggestions(newSuggestions.slice(0, maxSuggestions));
    } catch (error) {
      console.error('Search error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, 300);

  // Load search history and trending data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [history, trending] = await Promise.all([
          searchService.getSearchHistory(5),
          searchService.getTrendingSearches()
        ]);
        
        setSearchHistory(history.map(h => h.query));
        setTrendingData(trending);
      } catch (error) {
        console.error('Error loading initial search data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setQuery(value);
    
    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      loadDefaultSuggestions();
    }
  };

  // Load default suggestions (history + trending)
  const loadDefaultSuggestions = () => {
    if (!showSuggestions) return;

    const defaultSuggestions: SearchSuggestion[] = [];

    // Add search history
    searchHistory.slice(0, 3).forEach(historyQuery => {
      defaultSuggestions.push({
        type: 'history',
        title: historyQuery,
        subtitle: 'Recent search',
        icon: <History fontSize="small" />
      });
    });

    // Add trending users
    if (trendingData?.users) {
      trendingData.users.slice(0, 2).forEach((user: SearchUser) => {
        defaultSuggestions.push({
          type: 'user',
          id: user._id,
          title: `${user.firstName} ${user.lastName}`,
          subtitle: 'Trending professional',
          avatar: user.profilePicture,
          data: user
        });
      });
    }

    // Add trending jobs
    if (trendingData?.jobs) {
      trendingData.jobs.slice(0, 2).forEach((job: SearchJob) => {
        defaultSuggestions.push({
          type: 'job',
          id: job._id,
          title: job.title,
          subtitle: `${job.company.name} • Trending`,
          avatar: job.company.logo,
          icon: <Work fontSize="small" />,
          data: job
        });
      });
    }

    setSuggestions(defaultSuggestions);
  };

  // Handle focus
  const handleFocus = () => {
    setShowDropdown(true);
    if (!query.trim()) {
      loadDefaultSuggestions();
    }
  };

  // Handle search submit
  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    // Save search to history
    searchService.saveSearch(finalQuery);
    
    // Call onSearch callback
    onSearch?.(finalQuery);
    
    // Navigate to search results page
    navigate(`/app/jobs?search=${encodeURIComponent(finalQuery)}`);
    
    // Close dropdown
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'user' && suggestion.data) {
      const user = suggestion.data as SearchUser;
      navigate(`/app/profile/view/${user._id}`);
    } else if (suggestion.type === 'job' && suggestion.data) {
      const job = suggestion.data as SearchJob;
      navigate(`/app/jobs/${job._id}`);
    } else if (suggestion.type === 'post' && suggestion.data) {
      navigate('/app/network'); // Navigate to social network page
    } else if (suggestion.type === 'skill') {
      navigate(`/app/jobs?skills=${encodeURIComponent(suggestion.title)}`);
    } else if (suggestion.type === 'company') {
      navigate(`/app/jobs?company=${encodeURIComponent(suggestion.title)}`);
    } else if (suggestion.type === 'history') {
      setQuery(suggestion.title);
      handleSearch(suggestion.title);
    }
    
    // Call onResultSelect callback
    onResultSelect?.(suggestion);
    
    // Close dropdown
    setShowDropdown(false);
  };

  // Handle key press
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    } else if (event.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (suggestion: SearchSuggestion) => {
    if (suggestion.avatar) {
      return (
        <ListItemAvatar>
          <Avatar src={suggestion.avatar} sx={{ width: 32, height: 32 }}>
            {suggestion.type === 'user' ? <Person /> : <Business />}
          </Avatar>
        </ListItemAvatar>
      );
    }
    
    return (
      <ListItemIcon sx={{ minWidth: 40 }}>
        {suggestion.icon || <Search fontSize="small" />}
      </ListItemIcon>
    );
  };

  return (
    <Box ref={searchRef} sx={{ position: 'relative', width: '100%', maxWidth: 600 }}>
      {/* Search Input */}
      <Box
        sx={{
          position: 'relative',
          backgroundColor: theme.palette.mode === 'dark' 
            ? alpha(theme.palette.common.white, 0.05)
            : alpha(theme.palette.common.black, 0.04),
          borderRadius: 3,
          border: `1px solid ${theme.palette.mode === 'dark' 
            ? alpha(theme.palette.common.white, 0.12)
            : alpha(theme.palette.common.black, 0.12)}`,
          '&:hover': {
            backgroundColor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.common.white, 0.08)
              : alpha(theme.palette.common.black, 0.06),
            borderColor: theme.palette.primary.main,
          },
          '&:focus-within': {
            backgroundColor: theme.palette.background.paper,
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.12)}`,
          }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search sx={{ fontSize: 20 }} />
        </Box>
        
        <InputBase
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyPress}
          sx={{
            width: '100%',
            '& .MuiInputBase-input': {
              padding: '12px 48px 12px 44px',
              fontSize: '0.95rem',
              '&::placeholder': {
                color: 'text.secondary',
                opacity: 0.8,
              }
            },
          }}
        />
        
        {/* Clear Button */}
        {query && (
          <Box
            sx={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <Box
              component="button"
              onClick={handleClear}
              sx={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                padding: 0.5,
                borderRadius: 1,
                '&:hover': {
                  color: 'text.primary',
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                }
              }}
            >
              <Clear sx={{ fontSize: 18 }} />
            </Box>
          </Box>
        )}
        
        {/* Loading Indicator */}
        {loading && (
          <Box
            sx={{
              position: 'absolute',
              right: query ? 44 : 12,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            <CircularProgress size={16} />
          </Box>
        )}
      </Box>

      {/* Suggestions Dropdown */}
      {showDropdown && showSuggestions && (suggestions.length > 0 || loading) && (
        <Paper
          elevation={8}
          sx={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            mt: 1,
            borderRadius: 2,
            overflow: 'hidden',
            zIndex: 1300,
            maxHeight: 400,
            overflowY: 'auto',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          }}
        >
          {loading ? (
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Searching...
              </Typography>
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {suggestions.map((suggestion, index) => (
                <React.Fragment key={`${suggestion.type}-${suggestion.id || index}`}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        }
                      }}
                    >
                      {getIcon(suggestion)}
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {suggestion.title}
                            </Typography>
                            {suggestion.type === 'history' && (
                              <Chip 
                                label="Recent" 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                            {suggestion.type === 'user' && (
                              <Chip 
                                label="User" 
                                size="small" 
                                color="primary"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            )}
                          </Box>
                        }
                        secondary={suggestion.subtitle}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontSize: '0.875rem',
                          },
                          '& .MuiListItemText-secondary': {
                            fontSize: '0.75rem',
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < suggestions.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default EnhancedSearchBar;
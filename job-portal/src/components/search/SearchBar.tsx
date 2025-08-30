import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  InputBase,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  Typography,
  Chip,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Fade,
  useTheme,
  alpha,
  Badge,
} from '@mui/material';
import {
  Search,
  SearchOff,
  Person,
  Work,
  Article,
  Business,
  TrendingUp,
  History,
  Clear,
  FilterList,
  Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../hooks/useDebounce';
import searchService, { SearchUser, SearchJob, SearchPost } from '../../services/searchService';

interface SearchBarProps {
  onClose?: () => void;
  autoFocus?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
}

interface SearchSuggestion {
  type: 'user' | 'job' | 'post' | 'skill' | 'company' | 'query';
  id?: string;
  title: string;
  subtitle?: string;
  avatar?: string;
  badge?: number;
  data?: SearchUser | SearchJob | SearchPost;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onClose,
  autoFocus = false,
  placeholder = "Search for people, jobs, posts, or skills...",
  fullWidth = false,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const debouncedQuery = useDebounce(query, 300);

  // Load search history
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        const history = await searchService.getSearchHistory(5);
        setSearchHistory(history.map(item => item.query));
      } catch (error) {
        console.error('Error loading search history:', error);
      }
    };

    if (isOpen) {
      loadSearchHistory();
    }
  }, [isOpen]);

  // Get suggestions when query changes
  useEffect(() => {
    const getSuggestions = async () => {
      if (!debouncedQuery.trim()) {
        // Show trending searches and history when no query
        try {
          const trending = await searchService.getTrendingSearches();
          const historySuggestions: SearchSuggestion[] = searchHistory.map(historyQuery => ({
            type: 'query' as const,
            title: historyQuery,
            subtitle: 'From your search history',
          }));

          const trendingSuggestions: SearchSuggestion[] = [
            ...trending.users.slice(0, 3).map(user => ({
              type: 'user' as const,
              id: user._id,
              title: `${user.firstName} ${user.lastName}`,
              subtitle: user.title || user.role,
              avatar: user.profilePicture,
              data: user,
            })),
            ...trending.jobs.slice(0, 3).map(job => ({
              type: 'job' as const,
              id: job._id,
              title: job.title,
              subtitle: job.company.name,
              avatar: job.company.logo,
              data: job,
            })),
            ...trending.skills.slice(0, 3).map(skill => ({
              type: 'skill' as const,
              title: skill,
              subtitle: 'Trending skill',
            })),
          ];

          setSuggestions([...historySuggestions, ...trendingSuggestions]);
        } catch (error) {
          console.error('Error loading trending:', error);
        }
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [suggestionsData, searchResults] = await Promise.all([
          searchService.getSuggestions(debouncedQuery),
          searchService.search(debouncedQuery, { limit: 6 }),
        ]);

        const newSuggestions: SearchSuggestion[] = [
          // Direct search results
          ...searchResults.users.slice(0, 3).map(user => ({
            type: 'user' as const,
            id: user._id,
            title: `${user.firstName} ${user.lastName}`,
            subtitle: user.title || user.role,
            avatar: user.profilePicture,
            data: user,
          })),
          ...searchResults.jobs.slice(0, 3).map(job => ({
            type: 'job' as const,
            id: job._id,
            title: job.title,
            subtitle: job.company.name,
            avatar: job.company.logo,
            data: job,
          })),
          ...searchResults.posts.slice(0, 2).map(post => ({
            type: 'post' as const,
            id: post._id,
            title: post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content,
            subtitle: `${post.author.firstName} ${post.author.lastName}`,
            avatar: post.author.profilePicture,
            data: post,
          })),
          // Suggestion queries
          ...suggestionsData.companies.slice(0, 2).map(company => ({
            type: 'company' as const,
            title: company,
            subtitle: 'Company',
          })),
          ...suggestionsData.skills.slice(0, 2).map(skill => ({
            type: 'skill' as const,
            title: skill,
            subtitle: 'Skill',
          })),
        ];

        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error getting suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    getSuggestions();
  }, [debouncedQuery, searchHistory]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else if (query.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        if (onClose) onClose();
        break;
    }
  }, [selectedIndex, suggestions, query, onClose]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    await searchService.saveSearch(query);
    setIsOpen(false);
    navigate(`/app/search?q=${encodeURIComponent(query)}`);
    if (onClose) onClose();
  }, [query, navigate, onClose]);

  const handleSuggestionClick = useCallback(async (suggestion: SearchSuggestion) => {
    await searchService.saveSearch(suggestion.title, suggestion.type);
    setIsOpen(false);

    switch (suggestion.type) {
      case 'user':
        navigate(`/app/profile/view/${suggestion.id}`);
        break;
      case 'job':
        navigate(`/app/jobs/${suggestion.id}`);
        break;
      case 'post':
        navigate(`/app/network?post=${suggestion.id}`);
        break;
      case 'company':
        navigate(`/app/search?q=${encodeURIComponent(suggestion.title)}&type=jobs`);
        break;
      case 'skill':
        navigate(`/app/search?q=${encodeURIComponent(suggestion.title)}&type=all`);
        break;
      case 'query':
        setQuery(suggestion.title);
        navigate(`/app/search?q=${encodeURIComponent(suggestion.title)}`);
        break;
    }

    if (onClose) onClose();
  }, [navigate, onClose]);

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'user': return <Person fontSize="small" />;
      case 'job': return <Work fontSize="small" />;
      case 'post': return <Article fontSize="small" />;
      case 'company': return <Business fontSize="small" />;
      case 'skill': return <TrendingUp fontSize="small" />;
      case 'query': return <History fontSize="small" />;
      default: return <Search fontSize="small" />;
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'user': return theme.palette.primary.main;
      case 'job': return theme.palette.success.main;
      case 'post': return theme.palette.info.main;
      case 'company': return theme.palette.warning.main;
      case 'skill': return theme.palette.secondary.main;
      case 'query': return theme.palette.text.secondary;
      default: return theme.palette.text.primary;
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setSelectedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  const clearSearch = () => {
    setQuery('');
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: fullWidth ? '100%' : { xs: '100%', sm: 400, md: 500 },
        maxWidth: '100%',
      }}
    >
      <Paper
        elevation={isOpen ? 8 : 2}
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 0.5,
          borderRadius: 3,
          border: `1px solid ${
            isOpen ? theme.palette.primary.main : 'transparent'
          }`,
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.background.paper, 0.9)
            : theme.palette.background.paper,
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
          },
        }}
      >
        <Search
          sx={{
            color: 'text.secondary',
            mr: 1,
          }}
        />
        
        <InputBase
          ref={inputRef}
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          sx={{
            flex: 1,
            fontSize: '0.95rem',
            '&::placeholder': {
              color: 'text.secondary',
              opacity: 0.7,
            },
          }}
        />

        {isLoading && (
          <CircularProgress size={16} sx={{ mx: 1 }} />
        )}

        {query && !isLoading && (
          <IconButton
            size="small"
            onClick={clearSearch}
            sx={{ 
              ml: 1,
              '&:hover': { color: 'error.main' },
            }}
          >
            <Clear fontSize="small" />
          </IconButton>
        )}

        {onClose && (
          <IconButton
            size="small"
            onClick={onClose}
            sx={{ ml: 1 }}
          >
            <Close fontSize="small" />
          </IconButton>
        )}
      </Paper>

      <AnimatePresence>
        {isOpen && (
          <Paper
            component={motion.div}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            elevation={12}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              maxHeight: 400,
              overflowY: 'auto',
              zIndex: 1300,
              borderRadius: 2,
              background: theme.palette.mode === 'dark'
                ? alpha(theme.palette.background.paper, 0.95)
                : theme.palette.background.paper,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            }}
          >
            {suggestions.length > 0 ? (
              <List dense sx={{ py: 1 }}>
                {!query && searchHistory.length > 0 && (
                  <>
                    <ListItem>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: 1,
                        }}
                      >
                        Recent Searches
                      </Typography>
                    </ListItem>
                    <Divider sx={{ mb: 1 }} />
                  </>
                )}
                
                {suggestions.map((suggestion, index) => (
                  <ListItemButton
                    key={`${suggestion.type}-${suggestion.id || suggestion.title}-${index}`}
                    selected={selectedIndex === index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    sx={{
                      py: 1.5,
                      borderRadius: 1,
                      mx: 1,
                      mb: 0.5,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                      },
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.16),
                        },
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 48 }}>
                      {suggestion.avatar ? (
                        <Avatar
                          src={suggestion.avatar}
                          sx={{ width: 32, height: 32 }}
                        >
                          {suggestion.title.charAt(0).toUpperCase()}
                        </Avatar>
                      ) : (
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: alpha(getSuggestionColor(suggestion.type), 0.15),
                            color: getSuggestionColor(suggestion.type),
                          }}
                        >
                          {getSuggestionIcon(suggestion.type)}
                        </Box>
                      )}
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: 'text.primary',
                          }}
                        >
                          {suggestion.title}
                        </Typography>
                      }
                      secondary={
                        suggestion.subtitle && (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            {getSuggestionIcon(suggestion.type)}
                            {suggestion.subtitle}
                          </Typography>
                        )
                      }
                    />
                    
                    {suggestion.badge && (
                      <Badge
                        badgeContent={suggestion.badge}
                        color="primary"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </ListItemButton>
                ))}
                
                {query && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <ListItemButton
                      onClick={handleSearch}
                      sx={{
                        py: 1.5,
                        borderRadius: 1,
                        mx: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        '&:hover': {
                          backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        },
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 48 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                          }}
                        >
                          <Search fontSize="small" />
                        </Box>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Search for "{query}"
                          </Typography>
                        }
                        secondary="See all results"
                      />
                    </ListItemButton>
                  </>
                )}
              </List>
            ) : query && !isLoading ? (
              <Box
                sx={{
                  p: 3,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                <SearchOff sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2">
                  No suggestions found for "{query}"
                </Typography>
                <Typography variant="caption">
                  Try a different search term
                </Typography>
              </Box>
            ) : null}
          </Paper>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default SearchBar;
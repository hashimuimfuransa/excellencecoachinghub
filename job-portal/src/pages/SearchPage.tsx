import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  alpha,
  Divider,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Search,
  Person,
  Work,
  Article,
  Business,
  LocationOn,
  AccessTime,
  TrendingUp,
  FilterList,
  Clear,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { socialNetworkService } from '../services/socialNetworkService';
import { toast } from 'react-toastify';

interface SearchResult {
  _id: string;
  type: 'user' | 'post' | 'job' | 'company';
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
  company?: string;
  location?: string;
  createdAt?: string;
  tags?: string[];
}

const SearchPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectingUsers, setConnectingUsers] = useState<Set<string>>(new Set());

  // Tab configuration
  const tabs = [
    { label: 'All', value: 'all' },
    { label: 'People', value: 'users' },
    { label: 'Posts', value: 'posts' },
    { label: 'Jobs', value: 'jobs' },
    { label: 'Companies', value: 'companies' },
  ];

  // Search functionality
  const performSearch = async (query: string, type: string = 'all') => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchPromises = [];

      if (type === 'all' || type === 'users') {
        searchPromises.push(
          socialNetworkService.searchUsers(query).then(users => 
            users.map(user => ({
              _id: user._id,
              type: 'user' as const,
              title: `${user.firstName} ${user.lastName}`,
              subtitle: user.jobTitle || 'Professional',
              description: user.company || user.bio,
              image: user.profilePicture,
              company: user.company,
              location: user.location,
              tags: user.skills || [],
            }))
          )
        );
      }

      if (type === 'all' || type === 'posts') {
        searchPromises.push(
          socialNetworkService.searchPosts(query).then(posts => 
            posts.map(post => ({
              _id: post._id,
              type: 'post' as const,
              title: post.content?.substring(0, 100) + (post.content?.length > 100 ? '...' : ''),
              subtitle: `Post by ${post.author?.firstName} ${post.author?.lastName}`,
              description: post.tags?.join(', '),
              image: post.author?.profilePicture,
              author: post.author,
              createdAt: post.createdAt,
              tags: post.tags || [],
            }))
          )
        );
      }

      if (type === 'all' || type === 'jobs') {
        searchPromises.push(
          socialNetworkService.searchJobs(query).then(jobs => 
            jobs.map(job => ({
              _id: job._id,
              type: 'job' as const,
              title: job.title,
              subtitle: job.company,
              description: job.description?.substring(0, 150) + (job.description?.length > 150 ? '...' : ''),
              location: job.location,
              createdAt: job.createdAt,
              tags: job.skills || [],
            }))
          )
        );
      }

      if (type === 'all' || type === 'companies') {
        searchPromises.push(
          socialNetworkService.searchCompanies(query).then(companies => 
            companies.map(company => ({
              _id: company._id,
              type: 'company' as const,
              title: company.name,
              subtitle: company.industry,
              description: company.description?.substring(0, 150) + (company.description?.length > 150 ? '...' : ''),
              location: company.location,
              createdAt: company.createdAt,
              tags: company.specialties || [],
            }))
          )
        );
      }

      // Extract companies from jobs and posts for "all" search
      if (type === 'all') {
        // Get companies from jobs
        const jobsPromise = socialNetworkService.searchJobs(query).then(jobs => {
          const companiesFromJobs = jobs
            .map(job => job.company)
            .filter((company, index, self) => company && self.indexOf(company) === index) // Remove duplicates
            .map(company => ({
              _id: `job-company-${company}`,
              type: 'company' as const,
              title: company,
              subtitle: 'Company from Jobs',
              description: `Company mentioned in job postings`,
              tags: ['Jobs'],
            }));
          return companiesFromJobs;
        });

        // Get companies from posts
        const postsPromise = socialNetworkService.searchPosts(query).then(posts => {
          const companiesFromPosts = posts
            .map(post => post.author?.company)
            .filter((company, index, self) => company && self.indexOf(company) === index) // Remove duplicates
            .map(company => ({
              _id: `post-company-${company}`,
              type: 'company' as const,
              title: company,
              subtitle: 'Company from Posts',
              description: `Company mentioned in posts`,
              tags: ['Posts'],
            }));
          return companiesFromPosts;
        });

        searchPromises.push(jobsPromise, postsPromise);
      }

      const searchResults = await Promise.all(searchPromises);
      const allResults = searchResults.flat();
      
      // Sort results by relevance (simple implementation)
      const sortedResults = allResults.sort((a, b) => {
        const aRelevance = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
        const bRelevance = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
        return bRelevance - aRelevance;
      });

      setResults(sortedResults);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    
    // Update URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    if (value.trim()) {
      newSearchParams.set('q', value);
    } else {
      newSearchParams.delete('q');
    }
    setSearchParams(newSearchParams, { replace: true });

    // Debounced search
    const timeoutId = setTimeout(() => {
      performSearch(value, tabs[activeTab].value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (searchQuery.trim()) {
      performSearch(searchQuery, tabs[newValue].value);
    }
  };

  // Handle connection request
  const handleConnect = async (userId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the card click
    
    setConnectingUsers(prev => new Set(prev).add(userId));
    
    try {
      const response = await socialNetworkService.sendConnectionRequest(userId);
      
      // Find the user before removing from results
      const userResult = results.find(result => result.type === 'user' && result._id === userId);
      
      // Update the result to show pending status instead of removing
      setResults(prev => prev.map(result => {
        if (result.type === 'user' && result._id === userId) {
          return {
            ...result,
            connectionStatus: 'pending',
            connectionRequestId: response.data?._id || `temp-${userId}`
          };
        }
        return result;
      }));
      
      // Show success message
      if (userResult) {
        toast.success(`✅ Connection request sent to ${userResult.firstName} ${userResult.lastName}! They'll be notified.`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    } catch (error) {
      console.error('❌ Error sending connection request:', error);
      toast.error('❌ Failed to send connection request. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      // Remove user from connecting state after a delay to show pending state
      setTimeout(() => {
        setConnectingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }, 1000);
    }
  };

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'user':
        navigate(`/app/profile/view/${result._id}`);
        break;
      case 'post':
        navigate(`/app/network`);
        break;
      case 'job':
        navigate(`/app/jobs/${result._id}`);
        break;
      case 'company':
        navigate(`/company/${result._id}`);
        break;
      default:
        break;
    }
  };

  // Get result icon
  const getResultIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Person />;
      case 'post':
        return <Article />;
      case 'job':
        return <Work />;
      case 'company':
        return <Business />;
      default:
        return <Search />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Initial search on component mount
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery, tabs[activeTab].value);
    }
  }, []);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#f0f2f5',
      py: { xs: 2, sm: 3 }
    }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            fontWeight="700" 
            sx={{ mb: 2, color: 'primary.main' }}
          >
            Search Everything
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ mb: 3, fontSize: { xs: '0.9rem', sm: '1rem' } }}
          >
            Find people, posts, jobs, and companies
          </Typography>

          {/* Search Bar */}
          <Paper
            elevation={2}
            sx={{
              borderRadius: { xs: 2, sm: 3 },
              overflow: 'hidden',
              backgroundColor: theme.palette.background.paper,
            }}
          >
            <TextField
              fullWidth
              placeholder={isMobile ? "Search..." : "Search for people, posts, jobs, companies..."}
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: 'text.secondary', fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => {
                        setSearchQuery('');
                        setResults([]);
                        const newSearchParams = new URLSearchParams(searchParams);
                        newSearchParams.delete('q');
                        setSearchParams(newSearchParams, { replace: true });
                      }}
                      size="small"
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                ),
                sx: {
                  fontSize: { xs: '1rem', sm: '1.1rem' },
                  py: { xs: 0.5, sm: 1 },
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  border: 'none',
                  '& fieldset': {
                    border: 'none',
                  },
                },
              }}
            />
          </Paper>
        </Box>

        {/* Tabs */}
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 'auto',
                px: { xs: 2, sm: 3 },
                fontSize: { xs: '0.8rem', sm: '0.9rem' },
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={tab.value} label={tab.label} />
            ))}
          </Tabs>
        </Box>

        {/* Results */}
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          ) : results.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </Typography>
              
              <AnimatePresence>
                {results.map((result, index) => (
                  <motion.div
                    key={result._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: theme.palette.mode === 'dark' 
                            ? '0 8px 25px rgba(0,0,0,0.3)' 
                            : '0 8px 25px rgba(0,0,0,0.1)',
                        },
                      }}
                      onClick={() => handleResultClick(result)}
                    >
                      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', gap: { xs: 1.5, sm: 2 }, alignItems: 'flex-start' }}>
                          {/* Avatar/Icon */}
                          <Box sx={{ flexShrink: 0 }}>
                            {result.image ? (
                              <Avatar
                                src={result.image}
                                sx={{ width: { xs: 48, sm: 56 }, height: { xs: 48, sm: 56 } }}
                              >
                                {result.title.charAt(0)}
                              </Avatar>
                            ) : (
                              <Box
                                sx={{
                                  width: { xs: 48, sm: 56 },
                                  height: { xs: 48, sm: 56 },
                                  borderRadius: '50%',
                                  backgroundColor: theme.palette.primary.main,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'white',
                                }}
                              >
                                {getResultIcon(result.type)}
                              </Box>
                            )}
                          </Box>

                          {/* Content */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography 
                              variant={isMobile ? "subtitle1" : "h6"} 
                              fontWeight="600" 
                              sx={{ mb: 0.5, fontSize: { xs: '0.9rem', sm: '1.1rem' } }}
                            >
                              {result.title}
                            </Typography>
                            
                            {result.subtitle && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {result.subtitle}
                              </Typography>
                            )}
                            
                            {result.description && (
                              <Typography 
                                variant="body2" 
                                sx={{ mb: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {result.description}
                              </Typography>
                            )}

                            {/* Meta information */}
                            <Box sx={{ 
                              display: 'flex', 
                              gap: { xs: 1, sm: 2 }, 
                              alignItems: 'center', 
                              mb: 1,
                              flexWrap: 'wrap'
                            }}>
                              {result.location && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <LocationOn sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                    {result.location}
                                  </Typography>
                                </Box>
                              )}
                              
                              {result.createdAt && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <AccessTime sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary' }} />
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                                    {formatDate(result.createdAt)}
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            {/* Tags */}
                            {result.tags && result.tags.length > 0 && (
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                {result.tags.slice(0, isMobile ? 2 : 3).map((tag, tagIndex) => (
                                  <Chip
                                    key={tagIndex}
                                    label={tag}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}
                                  />
                                ))}
                                {result.tags.length > (isMobile ? 2 : 3) && (
                                  <Chip
                                    label={`+${result.tags.length - (isMobile ? 2 : 3)} more`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' } }}
                                  />
                                )}
                              </Box>
                            )}

                            {/* Connect button for users */}
                            {result.type === 'user' && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={(e) => handleConnect(result._id, e)}
                                disabled={connectingUsers.has(result._id) || result.connectionStatus === 'pending'}
                                sx={{
                                  mt: 1,
                                  textTransform: 'none',
                                  fontSize: { xs: '0.7rem', sm: '0.8rem' },
                                  px: { xs: 1.5, sm: 2 },
                                  py: { xs: 0.3, sm: 0.5 },
                                  backgroundColor: result.connectionStatus === 'pending' 
                                    ? '#4CAF50' 
                                    : connectingUsers.has(result._id) 
                                      ? '#ccc' 
                                      : '#2196F3',
                                }}
                              >
                                {connectingUsers.has(result._id) ? (
                                  <>
                                    <CircularProgress size={10} sx={{ mr: 1 }} />
                                    {isMobile ? 'Sending...' : 'Sending...'}
                                  </>
                                ) : result.connectionStatus === 'pending' ? (
                                  'Pending'
                                ) : (
                                  'Connect'
                                )}
                              </Button>
                            )}
                          </Box>

                          {/* Type indicator */}
                          <Chip
                            label={result.type}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ 
                              textTransform: 'capitalize', 
                              fontSize: { xs: '0.6rem', sm: '0.7rem' },
                              height: { xs: 20, sm: 24 }
                            }}
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          ) : searchQuery.trim() ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                No results found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try different keywords or check your spelling
              </Typography>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                Start searching
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enter a search term to find people, posts, jobs, and companies
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default SearchPage;

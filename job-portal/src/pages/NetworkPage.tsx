import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Tab,
  Tabs,
  Paper,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  useTheme,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Stack,
  Divider,
  useMediaQuery,
  Fade,
  Grow,
  Skeleton,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  Search,
  Group,
  PersonAdd,
  Check,
  Close,
  Message,
  CheckCircle,
  FilterList,
  ExpandMore,
  Work,
  LocationOn,
  Business,
  School,
  Sort,
  Clear,
  TrendingUp,
  People,
  NetworkCheck,
  Handshake,
  Article,
  BusinessCenter,
  Assignment,
  Bookmark,
  Event,
  SupervisorAccount,
  GroupAdd,
  AssignmentInd,
  Refresh,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { SocialConnection, ConnectionRequest, SentRequest } from '../types/social';
import { socialNetworkService } from '../services/socialNetworkService';
import { chatService } from '../services/chatService';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import FloatingContact from '../components/FloatingContact';
import ProfileCompletionPopup from '../components/ProfileCompletionPopup';
import CVBuilderPopup from '../components/CVBuilderPopup';
import { toast } from 'react-toastify';
import { networkCache, CACHE_KEYS } from '../utils/networkCache';
import { shouldShowProfileCompletionPopup, shouldShowCVBuilderPopup, markProfileCompletionDismissed, markCVBuilderDismissed } from '../utils/profileCompletionUtils';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box>{children}</Box>}
  </div>
);

// Skeleton components for Instagram-like loading
const ConnectionSkeleton: React.FC = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Skeleton variant="circular" width={56} height={56} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="30%" height={16} />
        </Box>
        <Skeleton variant="rectangular" width={100} height={36} />
      </Box>
    </CardContent>
  </Card>
);

const SuggestionsSkeleton: React.FC = () => (
  <Card sx={{ mb: 2 }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="70%" height={20} />
          <Skeleton variant="text" width="50%" height={16} />
        </Box>
        <Skeleton variant="rectangular" width={24} height={24} />
      </Box>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Skeleton variant="chip" width={60} height={32} />
        <Skeleton variant="chip" width={80} height={32} />
        <Skeleton variant="chip" width={70} height={32} />
      </Box>
    </CardContent>
  </Card>
);

const NetworkPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [currentTab, setCurrentTab] = useState(0);
  
  // Progressive loading states - like Instagram
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [pendingRequestsLoading, setPendingRequestsLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [sentRequestsLoading, setSentRequestsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  
  // Browse Users tab states
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allUsersLoading, setAllUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requestingUsers, setRequestingUsers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter states for Discover tab
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    location: '',
    company: '',
    skills: [] as string[],
    industry: '',
    experienceLevel: '',
    sortBy: 'newest', // newest, connections, completion
  });

  // Profile completion popup states
  const [showProfileCompletionPopup, setShowProfileCompletionPopup] = useState(false);
  const [showCVBuilderPopup, setShowCVBuilderPopup] = useState(false);

  // Progressive loading effect - like Instagram's instant UI
  useEffect(() => {
    const loadDataProgressively = async () => {
      // Show UI immediately, then load data
      setInitialLoading(false);
      
      // Load data in background without blocking UI
      setTimeout(() => {
        loadNetworkData();
      }, 50); // Small delay to ensure UI renders first
    };
    
    loadDataProgressively();
  }, []);

  // Load all users when Browse Users tab is selected
  useEffect(() => {
    if (currentTab === 3 && allUsers.length === 0) {
      loadAllUsers();
    }
  }, [currentTab]);

  // Check for profile completion popup on mount
  useEffect(() => {
    if (user) {
      const shouldShowProfile = shouldShowProfileCompletionPopup(user);
      const shouldShowCV = shouldShowCVBuilderPopup(user);
      
      // Show profile completion popup first if needed
      if (shouldShowProfile) {
        setShowProfileCompletionPopup(true);
      } else if (shouldShowCV) {
        setShowCVBuilderPopup(true);
      }
    }
  }, [user]);

  // Memoized filtered suggestions for better performance
  const filteredSuggestions = useMemo(() => {
    return (suggestions || [])
      // Ensure each suggestion is a valid object with an _id
      .filter((u: any) => Boolean(u && u._id))
    .filter(user => {
      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const title = (user.jobTitle || '').toLowerCase();
        const company = (user.company || '').toLowerCase();
        const bio = (user.bio || '').toLowerCase();
        
        if (!fullName.includes(query) && !title.includes(query) && !company.includes(query) && !bio.includes(query)) {
          return false;
        }
      }

    // Role filter
    if (filters.role && (user.role || user.userType) !== filters.role) {
      return false;
    }

    // Company filter
    if (filters.company && !user.company?.toLowerCase().includes(filters.company.toLowerCase())) {
      return false;
    }

    // Location filter
    if (filters.location && !user.location?.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }

    // Industry filter
    if (filters.industry && user.industry !== filters.industry) {
      return false;
    }

    // Skills filter
    if (filters.skills.length > 0) {
      const userSkills = user.skills || [];
      const hasMatchingSkill = filters.skills.some(skill => 
        userSkills.some((userSkill: string) => 
          userSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (!hasMatchingSkill) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sortBy) {
      case 'connections':
        return (b.connectionsCount || 0) - (a.connectionsCount || 0);
      case 'completion':
        return (b.profileCompletion || 0) - (a.profileCompletion || 0);
      case 'alphabetical':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'newest':
      default:
        return new Date(b.createdAt || b.joinedAt || '').getTime() - new Date(a.createdAt || a.joinedAt || '').getTime();
    }
  });
  }, [suggestions, searchQuery, filters]);

  // Filter management functions
  const handleFilterChange = (filterType: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleSkillToggle = (skill: string) => {
    setFilters(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const clearFilters = () => {
    setFilters({
      role: '',
      location: '',
      company: '',
      skills: [],
      industry: '',
      experienceLevel: '',
      sortBy: 'newest',
    });
    setSearchQuery('');
  };

  // Get unique values for filter options
  const getUniqueOptions = (field: string) => {
    const values = suggestions
      .map(user => user[field])
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);
    return values.sort();
  };

  const getAllSkills = () => {
    const allSkills = suggestions
      .flatMap(user => user.skills || [])
      .filter((skill, index, array) => array.indexOf(skill) === index);
    return allSkills.sort();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.role) count++;
    if (filters.location) count++;
    if (filters.company) count++;
    if (filters.skills.length > 0) count++;
    if (filters.industry) count++;
    if (filters.experienceLevel) count++;
    if (searchQuery) count++;
    return count;
  };

  // Optimized progressive loading - like Instagram's approach
  const loadNetworkData = useCallback(async () => {
    setError(null);

    // Load connections first (most important) with caching
    const loadConnections = async () => {
      try {
        setConnectionsLoading(true);
        
        // Check cache first
        const cachedConnections = networkCache.get<SocialConnection[]>(CACHE_KEYS.CONNECTIONS);
        if (cachedConnections) {
          console.log('📦 Loading connections from cache');
          setConnections(cachedConnections);
          return;
        }

        const connectionsRes = await socialNetworkService.getConnections();
        const connectionsData = Array.isArray(connectionsRes) ? connectionsRes : (connectionsRes?.data || []);
        const validConnections = connectionsData.filter((conn: any) => conn?.user != null);
        
        // Cache the result
        networkCache.set(CACHE_KEYS.CONNECTIONS, validConnections);
        setConnections(validConnections);
        console.log('Connections loaded:', validConnections.length);
      } catch (err) {
        console.error('Error loading connections:', err);
      } finally {
        setConnectionsLoading(false);
      }
    };

    // Load pending requests with caching
    const loadPendingRequests = async () => {
      try {
        setPendingRequestsLoading(true);
        
        const cachedRequests = networkCache.get<ConnectionRequest[]>(CACHE_KEYS.PENDING_REQUESTS);
        if (cachedRequests) {
          console.log('📦 Loading pending requests from cache');
          setPendingRequests(cachedRequests);
          return;
        }

        const requestsRes = await socialNetworkService.getPendingRequests();
        const requestsData = Array.isArray(requestsRes) ? requestsRes : (requestsRes?.data || []);
        
        networkCache.set(CACHE_KEYS.PENDING_REQUESTS, requestsData, 2 * 60 * 1000); // 2 minutes cache
        setPendingRequests(requestsData);
      } catch (err) {
        console.error('Error loading pending requests:', err);
      } finally {
        setPendingRequestsLoading(false);
      }
    };

    // Load sent requests with caching
    const loadSentRequests = async () => {
      try {
        setSentRequestsLoading(true);
        
        const cachedSentRequests = networkCache.get<SentRequest[][]>(CACHE_KEYS.SENT_REQUESTS);
        if (cachedSentRequests) {
          console.log('📦 Loading sent requests from cache');
          setSentRequests(cachedSentRequests);
          return;
        }

        const sentRequestsRes = await socialNetworkService.getSentRequests();
        const sentRequestsData = Array.isArray(sentRequestsRes) ? sentRequestsRes : (sentRequestsRes?.data || []);
        
        networkCache.set(CACHE_KEYS.SENT_REQUESTS, sentRequestsData, 2 * 60 * 1000); // 2 minutes cache
        setSentRequests(sentRequestsData);
      } catch (err) {
        console.error('Error loading sent requests:', err);
      } finally {
        setSentRequestsLoading(false);
      }
    };

    // Load suggestions with caching (can be last since it's for discovery)
    const loadSuggestions = async () => {
      try {
        setSuggestionsLoading(true);
        
        const cachedSuggestions = networkCache.get<any[]>(CACHE_KEYS.SUGGESTIONS);
        if (cachedSuggestions) {
          console.log('📦 Loading suggestions from cache');
          setSuggestions(cachedSuggestions);
          return;
        }

        const suggestionsRes = await socialNetworkService.getConnectionSuggestions(20);
        const suggestionsData = Array.isArray(suggestionsRes) ? suggestionsRes : (suggestionsRes?.data || []);
        const validSuggestions = suggestionsData.filter((u: any) => Boolean(u && u._id));
        
        networkCache.set(CACHE_KEYS.SUGGESTIONS, validSuggestions); // Use default TTL
        setSuggestions(validSuggestions);
        console.log('Suggestions loaded:', validSuggestions.length);
      } catch (err) {
        console.error('Error loading suggestions:', err);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    // Load data in parallel but with individual loading states
    await Promise.allSettled([
      loadConnections(),
      loadPendingRequests(),
      loadSentRequests(),
      loadSuggestions(),
    ]);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSendRequest = async (userId: string) => {
    // Add user to requesting state immediately
    setRequestingUsers(prev => new Set(prev).add(userId));
    
    try {
      const response = await socialNetworkService.sendConnectionRequest(userId);
      
      // Find the user before removing from suggestions
      const userToAdd = (suggestions || []).find((user: any) => user && user._id === userId);
      
      // Remove from suggestions (guard against bad items)
      setSuggestions(prev => (prev || []).filter((user: any) => user && user._id !== userId));
      
      // Invalidate related caches
      networkCache.delete(CACHE_KEYS.SUGGESTIONS);
      networkCache.delete(CACHE_KEYS.SENT_REQUESTS);
      
      if (userToAdd) {
        // Add to sent requests to show pending status
        const newSentRequest: SentRequest = {
          _id: response.data?._id || `temp-${userId}`,
          recipient: {
            _id: userToAdd._id,
            firstName: userToAdd.firstName,
            lastName: userToAdd.lastName,
            profilePicture: userToAdd.profilePicture,
            company: userToAdd.company,
            jobTitle: userToAdd.jobTitle,
          },
          requester: userId,
          status: 'pending',
          connectionType: 'connect',
          createdAt: new Date().toISOString(),
        };
        
        // Add to sent requests
        setSentRequests(prev => [newSentRequest, ...prev]);
        
        // Show success message with toast notification
        toast.success(`✅ Connection request sent to ${userToAdd.firstName} ${userToAdd.lastName}! They'll be notified.`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
      
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast.error('❌ Failed to send connection request. Please try again.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      // Remove user from requesting state after a short delay to show the pending state
      setTimeout(() => {
        setRequestingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }, 1000);
    }
  };

  const handleAcceptRequest = async (userId: string) => {
    try {
      await socialNetworkService.acceptConnectionRequest(userId);
      setPendingRequests(prev => prev.filter(req => req.requester._id !== userId));
      loadNetworkData(); // Refresh to update connections
    } catch (error) {
      console.error('Error accepting connection request:', error);
    }
  };

  const handleRejectRequest = async (userId: string) => {
    try {
      await socialNetworkService.rejectConnectionRequest(userId);
      setPendingRequests(prev => prev.filter(req => req.requester._id !== userId));
    } catch (error) {
      console.error('Error rejecting connection request:', error);
    }
  };

  const handleCancelRequest = async (userId: string) => {
    try {
      await socialNetworkService.cancelConnectionRequest(userId);
      setSentRequests(prev => prev.filter(req => req.recipient._id !== userId));
      setSuccessMessage('Connection request cancelled successfully!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (error) {
      console.error('Error cancelling connection request:', error);
      setError('Failed to cancel connection request. Please try again.');
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleRemoveConnection = async (userId: string) => {
    try {
      await socialNetworkService.removeConnection(userId);
      setConnections(prev => prev.filter(conn => conn.user?._id !== userId));
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const handleStartChat = async (userId: string, userName: string) => {
    try {
      // Create or get existing chat with the user
      const chat = await chatService.createOrGetChat([userId]);
      
      // Store both chat ID and target user info in sessionStorage for reliable selection
      const chatSelectionData = {
        chatId: chat._id,
        targetUserId: userId,
        targetUserName: userName,
        timestamp: Date.now(),
        requestId: `${userId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };
      sessionStorage.setItem('selectedChatData', JSON.stringify(chatSelectionData));
      
      // Navigate to messages page
      navigate('/app/messages');
      
      // Show success message
      setSuccessMessage(`Opening chat with ${userName}...`);
      setTimeout(() => setSuccessMessage(null), 2000);
      
    } catch (error) {
      console.error('Error starting chat:', error);
      setError(`Failed to start chat with ${userName}. Please try again.`);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleViewProfile = (user: any) => {
    // Navigate to appropriate profile based on user role
    if (user.role === UserRole.EMPLOYER || user.userType === UserRole.EMPLOYER || 
        user.role === 'employer' || user.userType === 'employer') {
      navigate(`/app/employer/profile`, { state: { userId: user._id } });
    } else {
      navigate(`/app/profile/view/${user._id}`);
    }
  };

  // Profile completion popup handlers
  const handleProfileCompletionClose = () => {
    setShowProfileCompletionPopup(false);
    // REMOVED: markProfileCompletionDismissed(user._id) - we want popup to show every time
    console.log('🚫 Profile completion popup closed - will show again on next visit if profile still incomplete');
  };

  const handleProfileCompletionAction = () => {
    setShowProfileCompletionPopup(false);
    navigate('/app/profile/edit');
  };

  const handleCVBuilderClose = () => {
    setShowCVBuilderPopup(false);
    // REMOVED: markCVBuilderDismissed(user._id) - we want popup to show every time
    console.log('🚫 CV Builder popup closed - will show again on next visit if no CV exists');
  };

  const handleCVBuilderAction = () => {
    setShowCVBuilderPopup(false);
    navigate('/app/cv-builder');
  };

  const handleCVBuilderContinueProfile = () => {
    setShowCVBuilderPopup(false);
    navigate('/app/profile/edit');
  };

  // Load all users for browsing
  const loadAllUsers = async () => {
    try {
      setAllUsersLoading(true);
      const result = await chatService.getAllUsers(200, 0); // Load more users initially
      setAllUsers(result.users);
    } catch (error) {
      console.error('Error loading all users:', error);
      // Fallback to search with empty query
      try {
        const users = await chatService.searchUsers('', 'all', 200, 0);
        setAllUsers(users);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    } finally {
      setAllUsersLoading(false);
    }
  };

  // Search users for chat
  const searchUsersForChat = async (query: string) => {
    if (!query.trim()) {
      setUserSearchResults([]);
      return;
    }

    try {
      setUserSearchLoading(true);
      const results = await chatService.searchUsers(query, 'all', 200, 0); // Increased limit for search
      setUserSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setUserSearchLoading(false);
    }
  };

  // Handle user search input change
  const handleUserSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setUserSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      searchUsersForChat(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const filteredConnections = connections.filter(conn => {
    // Skip connections where user data is null or undefined
    if (!conn?.user) {
      return false;
    }
    
    const fullName = `${conn.user.firstName || ''} ${conn.user.lastName || ''}`.toLowerCase();
    const company = conn.user.company?.toLowerCase() || '';
    const jobTitle = conn.user.jobTitle?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    return fullName.includes(query) || 
           company.includes(query) || 
           jobTitle.includes(query);
  });

  // Only show loading screen for initial load (Instagram-style)
 if (initialLoading) {
   return (
     <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', flexDirection: 'column', gap: 2 }}>
         <CircularProgress size={60} thickness={4} />
         <Typography variant="h6" color="text.secondary">
           Loading your network...
         </Typography>
       </Box>
     </Container>
   );
 }

  return (
    <>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        {/* Modern Header */}
        <Box sx={{ 
          mb: { xs: 3, md: 4 }, 
          textAlign: { xs: 'center', sm: 'left' },
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          background: `linear-gradient(135deg, 
            ${theme.palette.primary.main}15 0%, 
            ${theme.palette.secondary.main}15 100%)`,
          p: { xs: 3, md: 4 },
          border: `1px solid ${theme.palette.divider}`,
        }}>
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', sm: 'flex-start' }, gap: 2, mb: 2 }}>
              <Box sx={{ 
                p: 1.5,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <NetworkCheck sx={{ fontSize: { xs: 24, md: 28 } }} />
              </Box>
              <Box>
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  sx={{
                    fontWeight: 800,
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: '-0.5px'
                  }}
                >
                  My Network
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                  {isMobile ? 'Connect & Discover' : 'Build meaningful professional connections and discover new opportunities'}
                </Typography>
              </Box>
            </Box>
            
            {/* Quick Stats */}
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {connections.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Connections
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {pendingRequests.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Requests
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>
                    {suggestions.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Suggestions
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
          
          {/* Background decoration */}
          <Box sx={{ 
            position: 'absolute',
            top: -20,
            right: -20,
            width: { xs: 100, md: 150 },
            height: { xs: 100, md: 150 },
            background: `linear-gradient(135deg, ${theme.palette.primary.main}20, ${theme.palette.secondary.main}20)`,
            borderRadius: '50%',
            zIndex: 1
          }} />
        </Box>

        {/* Role-Based Quick Actions */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Paper 
            sx={{ 
              mb: { xs: 3, md: 4 }, 
              p: { xs: 2.5, md: 3.5 }, 
              borderRadius: 3,
              background: hasRole(UserRole.EMPLOYER) 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: hasRole(UserRole.EMPLOYER) 
                ? '0 8px 32px rgba(102, 126, 234, 0.3)'
                : '0 8px 32px rgba(25, 118, 210, 0.3)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                width: { xs: '150px', md: '200px' },
                height: { xs: '150px', md: '200px' },
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                transform: 'translate(50%, -50%)',
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.2)',
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp sx={{ fontSize: 24 }} />
                </Box>
                <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700 }}>
                  {hasRole(UserRole.EMPLOYER) ? '🚀 Expand Your Talent Network' : '🎯 Accelerate Your Career'}
                </Typography>
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  mb: 3, 
                  opacity: 0.95, 
                  fontSize: { xs: '0.9rem', md: '1rem' },
                  lineHeight: 1.5
                }}
              >
                {hasRole(UserRole.EMPLOYER) 
                  ? (isMobile 
                    ? 'Connect with top talent and grow your team.'
                    : 'Connect with top talent and grow your team. Post jobs and internships to attract the best candidates.')
                  : (isMobile
                    ? 'Find opportunities and build your professional network.'
                    : 'Find opportunities and build your professional network. Apply for jobs and internships to advance your career.')
                }
              </Typography>
              
              {/* Job Seeker Quick Actions */}
              {!hasRole(UserRole.EMPLOYER) && (
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1.5, md: 2 }, 
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'center', sm: 'flex-start' }
                }}>
                  <Button
                    variant="contained"
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      px: { xs: 2, md: 3 },
                      py: { xs: 0.8, md: 1 },
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    startIcon={<Work />}
                    onClick={() => navigate('/app/jobs')}
                  >
                    Browse Jobs
                  </Button>
                  <Button
                    variant="outlined"
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      color: 'white',
                      fontWeight: 600,
                      px: { xs: 2, md: 3 },
                      py: { xs: 0.8, md: 1 },
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.6)',
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    startIcon={<Assignment />}
                    onClick={() => navigate('/app/internships')}
                  >
                    Browse Internships
                  </Button>
                  <Button
                    variant="outlined"
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      color: 'white',
                      fontWeight: 600,
                      px: { xs: 2, md: 3 },
                      py: { xs: 0.8, md: 1 },
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.6)',
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    startIcon={<Article />}
                    onClick={() => navigate('/app/profile')}
                  >
                    Build CV
                  </Button>
                  {!isMobile && (
                    <Button
                      variant="text"
                      size="large"
                      sx={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontWeight: 600,
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        '&:hover': {
                          color: 'white',
                          bgcolor: 'rgba(255, 255, 255, 0.15)',
                          transform: 'translateY(-1px)',
                        },
                        transition: 'all 0.2s ease-in-out'
                      }}
                      startIcon={<School />}
                      onClick={() => navigate('/app/courses')}
                    >
                      Learning Center
                    </Button>
                  )}
                </Box>
              )}
              
              {/* Employer Quick Actions */}
              {hasRole(UserRole.EMPLOYER) && (
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1.5, md: 2 }, 
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'center', sm: 'flex-start' }
                }}>
                  <Button
                    variant="contained"
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontWeight: 600,
                      px: { xs: 2, md: 3 },
                      py: { xs: 0.8, md: 1 },
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.3)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 20px rgba(255, 255, 255, 0.3)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    startIcon={<Work />}
                    onClick={() => navigate('/app/jobs/create')}
                  >
                    Post Job
                  </Button>
                  <Button
                    variant="outlined"
                    size={isMobile ? "medium" : "large"}
                    sx={{
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      color: 'white',
                      fontWeight: 600,
                      px: { xs: 2, md: 3 },
                      py: { xs: 0.8, md: 1 },
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: 'rgba(255, 255, 255, 0.6)',
                        bgcolor: 'rgba(255, 255, 255, 0.15)',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    startIcon={<AssignmentInd />}
                    onClick={() => navigate('/app/internships/create')}
                  >
                    Create Internship
                  </Button>
                  {!isMobile && (
                    <>
                      <Button
                        variant="text"
                        size="large"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: 600,
                          px: 3,
                          py: 1,
                          borderRadius: 2,
                          '&:hover': {
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                            transform: 'translateY(-1px)',
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        startIcon={<SupervisorAccount />}
                        onClick={() => navigate('/app/employer/jobs')} 
                      >
                        Manage Jobs
                      </Button>
                      <Button
                        variant="text"
                        size="large"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontWeight: 600,
                          px: 3,
                          py: 1,
                          borderRadius: 2,
                          '&:hover': {
                            color: 'white',
                            bgcolor: 'rgba(255, 255, 255, 0.15)',
                            transform: 'translateY(-1px)',
                          },
                          transition: 'all 0.2s ease-in-out'
                        }}
                        startIcon={<Business />}
                        onClick={() => navigate('/app/employer/internships')}
                      >
                        Manage Internships
                    </Button>
                  </>
                  )}
                </Box>
              )}
            </Box>
          </Paper>
        </motion.div>

        {error && (
          <Fade in={!!error}>
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: { xs: 20, md: 24 }
                }
              }}
            >
              {error}
            </Alert>
          </Fade>
        )}

        {successMessage && (
          <Grow in={!!successMessage}>
            <Alert 
              severity="success" 
              sx={{ 
                mb: 2,
                borderRadius: 2,
                '& .MuiAlert-icon': {
                  fontSize: { xs: 20, md: 24 }
                }
              }}
              icon={<CheckCircle />}
            >
              {successMessage}
            </Alert>
          </Grow>
        )}

        {/* Modern Navigation Tabs */}
        <Paper 
          sx={{ 
            mb: { xs: 3, md: 4 }, 
            borderRadius: 3,
            overflow: 'hidden',
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons={isMobile ? "auto" : false}
            allowScrollButtonsMobile
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                py: { xs: 1.5, md: 2 },
                px: { xs: 1, md: 2 },
                minHeight: { xs: 60, md: 72 },
                fontSize: { xs: '0.875rem', md: '1rem' },
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.08)'
                },
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  fontWeight: 700
                }
              },
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`
              }
            }}
          >
            <Tab 
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 0.5, md: 1 },
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <People sx={{ fontSize: { xs: 18, md: 22 } }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                      {isMobile ? 'Connections' : 'My Connections'}
                    </Typography>
                    <Chip 
                      label={connections.length} 
                      size="small" 
                      color="primary"
                      sx={{ 
                        height: 18,
                        fontSize: '0.7rem',
                        mt: 0.5,
                        display: { xs: 'inline-flex', sm: 'none' }
                      }}
                    />
                    {!isMobile && (
                      <Typography variant="caption" color="text.secondary">
                        ({connections.length})
                      </Typography>
                    )}
                  </Box>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 0.5, md: 1 },
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Handshake sx={{ fontSize: { xs: 18, md: 22 } }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                      Requests
                    </Typography>
                    <Chip 
                      label={pendingRequests.length + sentRequests.length} 
                      size="small" 
                      color="success"
                      sx={{ 
                        height: 18,
                        fontSize: '0.7rem',
                        mt: 0.5,
                        display: { xs: 'inline-flex', sm: 'none' }
                      }}
                    />
                    {!isMobile && (
                      <Typography variant="caption" color="text.secondary">
                        ({pendingRequests.length + sentRequests.length})
                      </Typography>
                    )}
                  </Box>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 0.5, md: 1 },
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Search sx={{ fontSize: { xs: 18, md: 22 } }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                      Discover
                    </Typography>
                    <Chip 
                      label={filteredSuggestions.length} 
                      size="small" 
                      color="info"
                      sx={{ 
                        height: 18,
                        fontSize: '0.7rem',
                        mt: 0.5,
                        display: { xs: 'inline-flex', sm: 'none' }
                      }}
                    />
                    {!isMobile && (
                      <Typography variant="caption" color="text.secondary">
                        ({filteredSuggestions.length})
                      </Typography>
                    )}
                  </Box>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 0.5, md: 1 },
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Message sx={{ fontSize: { xs: 18, md: 22 } }} />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'inherit' }}>
                      Browse Users
                    </Typography>
                    <Chip 
                      label={allUsers.length} 
                      size="small" 
                      color="secondary"
                      sx={{ 
                        height: 18,
                        fontSize: '0.7rem',
                        mt: 0.5,
                        display: { xs: 'inline-flex', sm: 'none' }
                      }}
                    />
                    {!isMobile && (
                      <Typography variant="caption" color="text.secondary">
                        ({allUsers.length})
                      </Typography>
                    )}
                  </Box>
                </Box>
              } 
            />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        
        {/* Connections Tab */}
        <TabPanel value={currentTab} index={0}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Search your connections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          <Grid container spacing={2}>
            {/* Skeleton loading for connections */}
            {connectionsLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={`skeleton-${index}`}>
                  <Card sx={{ borderRadius: 2, height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Skeleton variant="circular" width={64} height={64} sx={{ mx: 'auto', mb: 2 }} />
                      <Skeleton variant="text" width="70%" height={24} sx={{ mx: 'auto', mb: 1 }} />
                      <Skeleton variant="text" width="50%" height={16} sx={{ mx: 'auto', mb: 1 }} />
                      <Skeleton variant="text" width="40%" height={16} sx={{ mx: 'auto', mb: 2 }} />
                      <Skeleton variant="rectangular" width={100} height={36} sx={{ mx: 'auto' }} />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              filteredConnections.map((connection) => (
              <Grid item xs={12} sm={6} md={4} key={connection._id}>
                <Card
                  component={motion.div}
                  whileHover={{ y: -4 }}
                  sx={{ 
                    borderRadius: 2, 
                    height: '100%',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4
                    }
                  }}
                  onClick={() => {
                    if (connection.user) {
                      handleViewProfile(connection.user);
                    }
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    {connection.user ? (
                      <>
                        <Avatar
                          src={connection.user.profilePicture}
                          sx={{ width: 64, height: 64, mx: 'auto', mb: 2 }}
                          loading="lazy"
                        >
                          {connection.user.firstName?.[0] || ''}{connection.user.lastName?.[0] || ''}
                        </Avatar>
                        
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {connection.user.firstName || ''} {connection.user.lastName || ''}
                        </Typography>
                        
                        {connection.user.jobTitle && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {connection.user.jobTitle}
                          </Typography>
                        )}
                        
                        {connection.user.company && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            at {connection.user.company}
                          </Typography>
                        )}

                        {/* Show user role/type */}
                        {(connection.user as any).role && (
                          <Chip
                            label={
                              ((connection.user as any).role === 'job_seeker' || (connection.user as any).role === 'jobseeker') 
                                ? 'Job Seeker' 
                                : (connection.user as any).role?.charAt(0).toUpperCase() + (connection.user as any).role?.slice(1)
                            }
                            size="small"
                            color="secondary"
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                        )}

                        <Chip
                          label={connection.connectionType === 'follow' ? 'Following' : 'Connected'}
                          size="small"
                          color="primary"
                          variant="filled"
                          sx={{ mb: 2 }}
                        />

                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Message />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const userId = connection.user?._id;
                              const userName = `${connection.user?.firstName || ''} ${connection.user?.lastName || ''}`;
                              if (userId && userName.trim()) {
                                handleStartChat(userId, userName);
                              }
                            }}
                          >
                            Message
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (connection.user?._id) {
                                handleRemoveConnection(connection.user._id);
                              }
                            }}
                          >
                            Remove
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        User data unavailable
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
          </Grid>

          {!connectionsLoading && filteredConnections.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {searchQuery ? 'No connections found' : 'No connections yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? 'Try adjusting your search terms' : 'Start building your professional network!'}
              </Typography>
            </Paper>
          )}
        </TabPanel>

        {/* Requests Tab */}
        <TabPanel value={currentTab} index={1}>
          {/* Incoming Requests Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              Incoming Requests ({pendingRequests.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              People who want to connect with you
            </Typography>
            
            <Grid container spacing={2}>
              {/* Skeleton loading for pending requests */}
              {pendingRequestsLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`pending-skeleton-${index}`}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Skeleton variant="circular" width={48} height={48} />
                          <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="70%" height={20} />
                            <Skeleton variant="text" width="50%" height={16} />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Skeleton variant="rectangular" width={80} height={36} />
                          <Skeleton variant="rectangular" width={80} height={36} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                pendingRequests.map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request._id}>
                  <Card
                    component={motion.div}
                    whileHover={{ y: -4 }}
                    sx={{ 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'success.main',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(76, 175, 80, 0.02)',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 4
                      }
                    }}
                    onClick={() => {
                      handleViewProfile(request.requester);
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={request.requester.profilePicture}
                        sx={{ 
                          width: 64, 
                          height: 64, 
                          mx: 'auto', 
                          mb: 2,
                          border: '2px solid',
                          borderColor: 'success.main',
                        }}
                        loading="lazy"
                      >
                        {request.requester.firstName[0]}{request.requester.lastName[0]}
                      </Avatar>
                      
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {request.requester.firstName} {request.requester.lastName}
                      </Typography>
                      
                      {request.requester.jobTitle && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {request.requester.jobTitle}
                        </Typography>
                      )}
                      
                      {request.requester.company && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          at {request.requester.company}
                        </Typography>
                      )}

                      {/* Show user role/type */}
                      {(request.requester as any).role && (
                        <Chip
                          label={
                            ((request.requester as any).role === 'job_seeker' || (request.requester as any).role === 'jobseeker') 
                              ? 'Job Seeker' 
                              : (request.requester as any).role?.charAt(0).toUpperCase() + (request.requester as any).role?.slice(1)
                          }
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      )}

                      <Typography variant="caption" color="success.main" sx={{ mb: 2, display: 'block', fontWeight: 600 }}>
                        Wants to {request.connectionType === 'follow' ? 'follow' : 'connect with'} you
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<Check />}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAcceptRequest(request.requester._id);
                          }}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Close />}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRejectRequest(request.requester._id);
                          }}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Decline
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
              )}
            </Grid>

            {!pendingRequestsLoading && pendingRequests.length === 0 && (
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, mt: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  No incoming requests
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No one has sent you a connection request yet.
                </Typography>
              </Paper>
            )}
          </Box>

          {/* Sent Requests Section */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'warning.main' }}>
              Sent Requests ({sentRequests.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Connection requests you've sent to others
            </Typography>
            
            <Grid container spacing={2}>
              {/* Skeleton loading for sent requests */}
              {sentRequestsLoading ? (
                Array.from({ length: 2 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`sent-skeleton-${index}`}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Skeleton variant="circular" width={64} height={64} sx={{ mx: 'auto', mb: 2 }} />
                        <Skeleton variant="text" width="70%" height={20} sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="50%" height={16} sx={{ mb: 2 }} />
                        <Skeleton variant="rectangular" width={100} height={32} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              ) : (
                sentRequests.map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request._id}>
                  <Card
                    component={motion.div}
                    whileHover={{ y: -4 }}
                    sx={{ 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'warning.main',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.05)' : 'rgba(255, 152, 0, 0.02)',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 4
                      }
                    }}
                    onClick={() => {
                      handleViewProfile(request.recipient);
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={request.recipient.profilePicture}
                        sx={{ 
                          width: 64, 
                          height: 64, 
                          mx: 'auto', 
                          mb: 2,
                          border: '2px solid',
                          borderColor: 'warning.main',
                        }}
                        loading="lazy"
                      >
                        {request.recipient.firstName[0]}{request.recipient.lastName[0]}
                      </Avatar>
                      
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {request.recipient.firstName} {request.recipient.lastName}
                      </Typography>
                      
                      {request.recipient.jobTitle && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {request.recipient.jobTitle}
                        </Typography>
                      )}
                      
                      {request.recipient.company && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          at {request.recipient.company}
                        </Typography>
                      )}

                      {/* Show user role/type */}
                      {(request.recipient as any).role && (
                        <Chip
                          label={
                            ((request.recipient as any).role === 'job_seeker' || (request.recipient as any).role === 'jobseeker') 
                              ? 'Job Seeker' 
                              : (request.recipient as any).role?.charAt(0).toUpperCase() + (request.recipient as any).role?.slice(1)
                          }
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      )}

                      <Typography variant="caption" color="warning.main" sx={{ mb: 2, display: 'block', fontWeight: 600 }}>
                        Pending {request.connectionType === 'follow' ? 'follow' : 'connection'} request
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          variant="outlined"
                          color="warning"
                          size="small"
                          startIcon={<Close />}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCancelRequest(request.recipient._id);
                          }}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Cancel Request
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))
              )}
            </Grid>

            {!sentRequestsLoading && sentRequests.length === 0 && (
              <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 2, mt: 2 }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  No sent requests
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You haven't sent any connection requests yet.
                </Typography>
              </Paper>
            )}
          </Box>

          {/* Show overall message when both sections are empty */}
          {pendingRequests.length === 0 && sentRequests.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, mt: 3 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No connection requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You're all caught up! Start connecting with professionals in the Discover tab.
              </Typography>
            </Paper>
          )}
        </TabPanel>

        {/* Discover Tab */}
        <TabPanel value={currentTab} index={2}>
          <Box sx={{ mb: 3 }}>
            {/* Header */}
            <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Discover Professionals
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Connect with job seekers, students, and employers. Build your professional network!
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{ minWidth: 120 }}
                >
                  Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
                </Button>
              </Box>

              {/* Search Bar */}
              <TextField
                placeholder="Search professionals by name, title, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setSearchQuery('')} size="small">
                        <Clear />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mt: 1 }}
              />
            </Paper>

            {/* Filters Panel */}
            <Collapse in={showFilters}>
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FilterList />
                    Filters
                  </Typography>
                  <Button
                    startIcon={<Clear />}
                    onClick={clearFilters}
                    color="secondary"
                    disabled={getActiveFiltersCount() === 0}
                  >
                    Clear All
                  </Button>
                </Box>

                <Grid container spacing={3}>
                  {/* Role Filter */}
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Role</InputLabel>
                      <Select
                        value={filters.role}
                        label="Role"
                        onChange={(e) => handleFilterChange('role', e.target.value)}
                        startAdornment={<Work sx={{ mr: 1, color: 'text.secondary' }} />}
                      >
                        <MenuItem value="">All Roles</MenuItem>
                        <MenuItem value="job_seeker">Job Seeker</MenuItem>
                        <MenuItem value="employer">Employer</MenuItem>
                        <MenuItem value="student">Student</MenuItem>
                        <MenuItem value="recruiter">Recruiter</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Company Filter */}
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Company"
                      value={filters.company}
                      onChange={(e) => handleFilterChange('company', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Business />
                          </InputAdornment>
                        ),
                      }}
                      placeholder="Enter company name"
                    />
                  </Grid>

                  {/* Location Filter */}
                  <Grid item xs={12} sm={6} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Location"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn />
                          </InputAdornment>
                        ),
                      }}
                      placeholder="Enter location"
                    />
                  </Grid>

                  {/* Industry Filter */}
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Industry</InputLabel>
                      <Select
                        value={filters.industry}
                        label="Industry"
                        onChange={(e) => handleFilterChange('industry', e.target.value)}
                      >
                        <MenuItem value="">All Industries</MenuItem>
                        <MenuItem value="Technology">Technology</MenuItem>
                        <MenuItem value="Healthcare">Healthcare</MenuItem>
                        <MenuItem value="Finance">Finance</MenuItem>
                        <MenuItem value="Education">Education</MenuItem>
                        <MenuItem value="Marketing">Marketing</MenuItem>
                        <MenuItem value="Sales">Sales</MenuItem>
                        <MenuItem value="Engineering">Engineering</MenuItem>
                        <MenuItem value="Design">Design</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Sort By */}
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={filters.sortBy}
                        label="Sort By"
                        onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        startAdornment={<Sort sx={{ mr: 1, color: 'text.secondary' }} />}
                      >
                        <MenuItem value="newest">Newest First</MenuItem>
                        <MenuItem value="alphabetical">Alphabetical</MenuItem>
                        <MenuItem value="connections">Most Connected</MenuItem>
                        <MenuItem value="completion">Profile Completion</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Skills Filter */}
                  {getAllSkills().length > 0 && (
                    <Grid item xs={12}>
                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <School />
                            Skills {filters.skills.length > 0 && `(${filters.skills.length} selected)`}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          <FormGroup row>
                            {getAllSkills().slice(0, 20).map((skill) => (
                              <FormControlLabel
                                key={skill}
                                control={
                                  <Checkbox
                                    checked={filters.skills.includes(skill)}
                                    onChange={() => handleSkillToggle(skill)}
                                    size="small"
                                  />
                                }
                                label={skill}
                                sx={{ mb: 1, mr: 2 }}
                              />
                            ))}
                          </FormGroup>
                          {getAllSkills().length > 20 && (
                            <Typography variant="caption" color="text.secondary">
                              Showing top 20 skills
                            </Typography>
                          )}
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Collapse>

            {/* Results Count */}
            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                {filteredSuggestions.length} professional{filteredSuggestions.length !== 1 ? 's' : ''} found
              </Typography>
              {filters.skills.length > 0 && (
                <Stack direction="row" spacing={1}>
                  {filters.skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      size="small"
                      onDelete={() => handleSkillToggle(skill)}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              )}
            </Box>
          </Box>

          {/* Skeleton loading for suggestions */}
          {suggestionsLoading ? (
            <Grid container spacing={2}>
              {Array.from({ length: 8 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={`suggestion-skeleton-${index}`}>
                  <SuggestionsSkeleton />
                </Grid>
              ))}
            </Grid>
          ) : filteredSuggestions.length > 0 ? (
            <Grid container spacing={2}>
              {filteredSuggestions.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user._id}>
                  <Card
                    component={motion.div}
                    whileHover={{ y: -4 }}
                    sx={{ 
                      borderRadius: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: 4
                      }
                    }}
                    onClick={() => {
                      handleViewProfile(user);
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Avatar
                        src={user.profilePicture}
                        sx={{ width: 64, height: 64, mx: 'auto', mb: 2 }}
                        loading="lazy"
                      >
                        {user.firstName[0]}{user.lastName[0]}
                      </Avatar>
                      
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                        {user.firstName} {user.lastName}
                      </Typography>
                      
                      {user.jobTitle && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {user.jobTitle}
                        </Typography>
                      )}
                      
                      {user.company && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          at {user.company}
                        </Typography>
                      )}

                      {/* Show user role/type */}
                      {(user.role || user.userType) && (
                        <Chip
                          label={
                            ((user.role || user.userType) === 'job_seeker' || (user.role || user.userType) === 'jobseeker') 
                              ? 'Job Seeker' 
                              : (user.role || user.userType)?.charAt(0).toUpperCase() + (user.role || user.userType)?.slice(1)
                          }
                          size="small"
                          color="info"
                          variant="filled"
                          sx={{ mb: 1 }}
                        />
                      )}

                      {/* Profile Completion Badge */}
                      {(user as any).profileCompletion && (
                        <Chip
                          label={`${(user as any).profileCompletion}% Complete`}
                          size="small"
                          color={(user as any).profileCompletion >= 90 ? 'success' : 
                                (user as any).profileCompletion >= 70 ? 'warning' : 'error'}
                          variant="outlined"
                          sx={{ mb: 2 }}
                        />
                      )}

                      {user.bio && (
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                          {user.bio.length > 80 ? `${user.bio.substring(0, 80)}...` : user.bio}
                        </Typography>
                      )}

                      <Stack direction="column" spacing={1} justifyContent="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleViewProfile(user);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            borderColor: theme.palette.primary.main,
                            color: theme.palette.primary.main,
                            '&:hover': {
                              backgroundColor: theme.palette.primary.main,
                              color: 'white',
                            }
                          }}
                        >
                          View Profile
                        </Button>
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={
                              requestingUsers.has(user._id) 
                                ? <CircularProgress size={16} color="inherit" /> 
                                : sentRequests.some(req => req.recipient._id === user._id && req.status === 'pending')
                                  ? <CheckCircle />
                                  : <PersonAdd />
                            }
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSendRequest(user._id);
                            }}
                            disabled={requestingUsers.has(user._id) || sentRequests.some(req => req.recipient._id === user._id && req.status === 'pending')}
                            sx={{
                              background: requestingUsers.has(user._id) 
                                ? 'linear-gradient(45deg, #ccc 30%, #ddd 90%)'
                                : sentRequests.some(req => req.recipient._id === user._id && req.status === 'pending')
                                  ? 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)'
                                  : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                              textTransform: 'none',
                              fontWeight: 600,
                              flex: 1,
                            }}
                          >
                            {requestingUsers.has(user._id) 
                              ? 'Sending...' 
                              : sentRequests.some(req => req.recipient._id === user._id && req.status === 'pending')
                                ? 'Pending'
                                : 'Connect'
                            }
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Message />}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const userId = user._id;
                              const userName = `${user.firstName} ${user.lastName}`;
                              handleStartChat(userId, userName);
                            }}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 600,
                            }}
                          >
                            Message
                          </Button>
                        </Stack>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              </Box>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No professionals found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
                {getActiveFiltersCount() > 0 
                  ? "Try adjusting your filters or search terms to find more professionals."
                  : "No professionals match your search criteria. Try a different search term."}
              </Typography>
              {getActiveFiltersCount() > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </Paper>
          )}

          {!suggestionsLoading && suggestions.length === 0 && (
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                No suggestions available
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We show users who have completed at least 70% of their profile.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Check back later for new job seekers, students, and employers!
              </Typography>
            </Paper>
          )}
        </TabPanel>

        {/* Browse Users Tab */}
        <TabPanel value={currentTab} index={3}>
          <Box sx={{ mb: 3 }}>
            <Paper sx={{ p: 2, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    Browse All Users
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Search and chat with any user on the platform
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={loadAllUsers}
                  disabled={allUsersLoading}
                >
                  Refresh
                </Button>
              </Box>
              
              <TextField
                fullWidth
                placeholder="Search users by name, company, or role..."
                value={userSearchQuery}
                onChange={handleUserSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                sx={{ maxWidth: 500 }}
              />
            </Paper>
          </Box>

          {/* Search Results */}
          {userSearchQuery && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Search Results ({userSearchResults.length})
              </Typography>
              
              {userSearchLoading ? (
                <Grid container spacing={2}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Grid item xs={12} sm={6} md={4} key={`search-skeleton-${index}`}>
                      <Card sx={{ borderRadius: 2, height: '100%' }}>
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Skeleton variant="circular" width={64} height={64} sx={{ mx: 'auto', mb: 2 }} />
                          <Skeleton variant="text" width="70%" height={24} sx={{ mx: 'auto', mb: 1 }} />
                          <Skeleton variant="text" width="50%" height={16} sx={{ mx: 'auto', mb: 1 }} />
                          <Skeleton variant="text" width="40%" height={16} sx={{ mx: 'auto', mb: 2 }} />
                          <Skeleton variant="rectangular" width={100} height={36} sx={{ mx: 'auto' }} />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : userSearchResults.length > 0 ? (
                <Grid container spacing={2}>
                  {userSearchResults.map((user) => (
                    <Grid item xs={12} sm={6} md={4} key={user._id}>
                      <Card sx={{ 
                        borderRadius: 2, 
                        height: '100%',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8]
                        }
                      }}>
                        <CardContent sx={{ textAlign: 'center', p: 3 }}>
                          <Box sx={{ position: 'relative', mb: 2 }}>
                            <Avatar
                              src={user.profilePicture}
                              sx={{ 
                                width: 64, 
                                height: 64, 
                                mx: 'auto',
                                border: `3px solid ${user.isOnline ? theme.palette.success.main : theme.palette.grey[300]}`
                              }}
                            >
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </Avatar>
                            {user.isOnline && (
                              <Box sx={{
                                position: 'absolute',
                                bottom: 2,
                                right: '50%',
                                transform: 'translateX(50%)',
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                bgcolor: theme.palette.success.main,
                                border: `2px solid ${theme.palette.background.paper}`
                              }} />
                            )}
                          </Box>
                          
                          <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                            {user.firstName} {user.lastName}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {user.title || user.role}
                          </Typography>
                          
                          {user.company && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {user.company}
                            </Typography>
                          )}
                          
                          {user.location && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                              {user.location}
                            </Typography>
                          )}
                          
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Message />}
                              onClick={() => handleStartChat(user._id, `${user.firstName} ${user.lastName}`)}
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600
                              }}
                            >
                              Chat
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleViewProfile(user)}
                              sx={{ 
                                borderRadius: 2,
                                textTransform: 'none',
                                fontWeight: 600
                              }}
                            >
                              Profile
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                  <Search sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                    No users found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try a different search term or browse all users below.
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {/* All Users */}
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              All Users ({allUsers.length})
            </Typography>
            
            {allUsersLoading ? (
              <Grid container spacing={2}>
                {Array.from({ length: 9 }).map((_, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`all-skeleton-${index}`}>
                    <Card sx={{ borderRadius: 2, height: '100%' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Skeleton variant="circular" width={64} height={64} sx={{ mx: 'auto', mb: 2 }} />
                        <Skeleton variant="text" width="70%" height={24} sx={{ mx: 'auto', mb: 1 }} />
                        <Skeleton variant="text" width="50%" height={16} sx={{ mx: 'auto', mb: 1 }} />
                        <Skeleton variant="text" width="40%" height={16} sx={{ mx: 'auto', mb: 2 }} />
                        <Skeleton variant="rectangular" width={100} height={36} sx={{ mx: 'auto' }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : allUsers.length > 0 ? (
              <Grid container spacing={2}>
                {allUsers.map((user) => (
                  <Grid item xs={12} sm={6} md={4} key={user._id}>
                    <Card sx={{ 
                      borderRadius: 2, 
                      height: '100%',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[8]
                      }
                    }}>
                      <CardContent sx={{ textAlign: 'center', p: 3 }}>
                        <Box sx={{ position: 'relative', mb: 2 }}>
                          <Avatar
                            src={user.profilePicture}
                            sx={{ 
                              width: 64, 
                              height: 64, 
                              mx: 'auto',
                              border: `3px solid ${user.isOnline ? theme.palette.success.main : theme.palette.grey[300]}`
                            }}
                          >
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </Avatar>
                          {user.isOnline && (
                            <Box sx={{
                              position: 'absolute',
                              bottom: 2,
                              right: '50%',
                              transform: 'translateX(50%)',
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              bgcolor: theme.palette.success.main,
                              border: `2px solid ${theme.palette.background.paper}`
                            }} />
                          )}
                        </Box>
                        
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {user.title || user.role}
                        </Typography>
                        
                        {user.company && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {user.company}
                          </Typography>
                        )}
                        
                        {user.location && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            <LocationOn sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {user.location}
                          </Typography>
                        )}
                        
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Message />}
                            onClick={() => handleStartChat(user._id, `${user.firstName} ${user.lastName}`)}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Chat
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewProfile(user)}
                            sx={{ 
                              borderRadius: 2,
                              textTransform: 'none',
                              fontWeight: 600
                            }}
                          >
                            Profile
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  No users available
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Click refresh to load users from the platform.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={loadAllUsers}
                  disabled={allUsersLoading}
                >
                  Load Users
                </Button>
              </Paper>
            )}
          </Box>
        </TabPanel>
      </motion.div>

      </Container>

      {/* Profile Completion Popup */}
      {user && (
        <ProfileCompletionPopup
          open={showProfileCompletionPopup}
          onClose={handleProfileCompletionClose}
          onCompleteProfile={handleProfileCompletionAction}
          user={user}
        />
      )}

      {/* CV Builder Popup */}
      {user && (
        <CVBuilderPopup
          open={showCVBuilderPopup}
          onClose={handleCVBuilderClose}
          onBuildCV={handleCVBuilderAction}
          onContinueProfile={handleCVBuilderContinueProfile}
          user={user}
        />
      )}

      {/* Floating Contact - Fixed position, always visible like the message icon */}
      <FloatingContact />
    </>
  );
};

export default NetworkPage;
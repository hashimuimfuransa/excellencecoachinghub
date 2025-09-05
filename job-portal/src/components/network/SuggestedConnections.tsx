import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Avatar,
  Button,
  Box,
  Stack,
  Chip,
  IconButton,
  Skeleton,
  Alert,
  Divider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  PersonAdd,
  Work,
  LocationOn,
  Refresh,
  Close,
  Person,
  Message,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { socialNetworkService } from '../../services/socialNetworkService';
import { chatService } from '../../services/chatService';
import { useNavigate } from 'react-router-dom';

interface SuggestedUser {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePicture?: string;
  company?: string;
  jobTitle?: string;
  industry?: string;
  location?: string;
  skills?: string[];
  role?: string;
  userType?: string;
  profession?: string;
  avatar?: string;
  isConnected?: boolean;
  mutualConnections?: number;
}

const SuggestedConnections: React.FC = () => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedUsers, setDismissedUsers] = useState<string[]>([]);
  const [connectingUsers, setConnectingUsers] = useState<string[]>([]);
  const [messagingUsers, setMessagingUsers] = useState<string[]>([]);

  const fetchSuggestedUsers = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Use the dedicated connection suggestions endpoint - show fewer on tablets to save space
      const limit = isTablet ? 6 : 12;
      const response = await socialNetworkService.getConnectionSuggestions(limit);
      console.log('Connection suggestions response:', response);
      
      // The service returns the array directly, not wrapped in {success, data}
      if (Array.isArray(response)) {
        // Filter out dismissed users
        const filtered = response
          .filter((u: SuggestedUser) => !dismissedUsers.includes(u._id));

        console.log('Filtered suggestions:', filtered);
        setSuggestedUsers(filtered);
        
        if (filtered.length === 0) {
          setError('No connection suggestions available at the moment');
        }
      } else {
        console.error('Invalid response format:', response);
        setError('Failed to load suggestions - invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching suggested users:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError(`Failed to load suggestions: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestedUsers();
  }, [user]);

  const handleConnect = async (userId: string) => {
    if (!user) return;

    setConnectingUsers(prev => [...prev, userId]);

    try {
      // Send connection request using the real API
      await socialNetworkService.sendConnectionRequest(userId, 'connect');
      
      // Remove user from suggestions after sending request
      setSuggestedUsers(prev => prev.filter(u => u._id !== userId));
      
      // Show success message if needed
      console.log('Connection request sent successfully');
    } catch (err) {
      console.error('Error sending connection request:', err);
      setError('Failed to send connection request');
    } finally {
      setConnectingUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleDismiss = (userId: string) => {
    setDismissedUsers(prev => [...prev, userId]);
    setSuggestedUsers(prev => prev.filter(u => u._id !== userId));
  };

  const handleRefresh = () => {
    setDismissedUsers([]);
    fetchSuggestedUsers();
  };

  const handleStartChat = async (userId: string, userName: string) => {
    if (!user || messagingUsers.includes(userId)) return;

    setMessagingUsers(prev => [...prev, userId]);
    try {
      // Create or get existing chat with the user
      const chat = await chatService.createOrGetChat([userId]);
      
      // Store both chat ID and target user info in sessionStorage for reliable selection
      const chatSelectionData = {
        chatId: chat._id,
        targetUserId: userId,
        targetUserName: userName,
        timestamp: Date.now()
      };
      sessionStorage.setItem('selectedChatData', JSON.stringify(chatSelectionData));
      
      // Navigate to messages page
      navigate('/app/messages');
    } catch (error) {
      console.error('Error starting chat:', error);
      setError(`Failed to start chat with ${userName}. Please try again.`);
    } finally {
      setMessagingUsers(prev => prev.filter(id => id !== userId));
    }
  };

  if (loading && suggestedUsers.length === 0) {
    return (
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="600" sx={{ mb: 2 }}>
            Suggested Connections
          </Typography>
          <Stack spacing={2}>
            {[1, 2, 3].map((index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="rectangular" width={80} height={32} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ borderRadius: isTablet ? 2 : 3, overflow: 'hidden' }}>
      <CardContent sx={{ p: isTablet ? 2 : 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: isTablet ? 1.5 : 2 }}>
          <Typography variant={isTablet ? "subtitle1" : "h6"} fontWeight="600" sx={{ fontSize: isTablet ? '1rem' : '1.25rem' }}>
            Suggested Connections
          </Typography>
          <IconButton onClick={handleRefresh} size="small" sx={{ color: 'primary.main' }}>
            <Refresh sx={{ fontSize: isTablet ? 18 : 20 }} />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <AnimatePresence mode="popLayout">
          <Stack spacing={isTablet ? 1.5 : 2}>
            {suggestedUsers.length === 0 && !loading ? (
              <Box sx={{ textAlign: 'center', py: isTablet ? 2 : 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: isTablet ? '0.8rem' : '0.875rem' }}>
                  No new suggestions available
                </Typography>
                <Button 
                  onClick={handleRefresh} 
                  size="small" 
                  sx={{ mt: 1, fontSize: isTablet ? '0.75rem' : '0.875rem' }}
                >
                  Refresh
                </Button>
              </Box>
            ) : (
              suggestedUsers.map((suggestedUser, index) => (
                <motion.div
                  key={suggestedUser._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: isTablet ? 1.5 : 2,
                      p: isTablet ? 1.5 : 2,
                      borderRadius: isTablet ? 1.5 : 2,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                      position: 'relative',
                    }}
                  >
                    <IconButton
                      onClick={() => handleDismiss(suggestedUser._id)}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        opacity: 0.6,
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>

                    <Avatar
                      src={suggestedUser.profilePicture || suggestedUser.avatar}
                      sx={{
                        width: isTablet ? 40 : 48,
                        height: isTablet ? 40 : 48,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        fontSize: isTablet ? '0.875rem' : '1rem'
                      }}
                    >
                      {suggestedUser.firstName?.[0]}{suggestedUser.lastName?.[0]}
                    </Avatar>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography 
                        variant="subtitle2" 
                        fontWeight="600"
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main' },
                          fontSize: isTablet ? '0.85rem' : '0.875rem'
                        }}
                        noWrap
                      >
                        {suggestedUser.firstName} {suggestedUser.lastName}
                      </Typography>

                      {(suggestedUser.jobTitle || suggestedUser.profession) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: isTablet ? 0.25 : 0.5 }}>
                          <Work sx={{ fontSize: isTablet ? 11 : 12, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: isTablet ? '0.7rem' : '0.75rem' }}>
                            {suggestedUser.jobTitle || suggestedUser.profession}
                            {suggestedUser.company && ` at ${suggestedUser.company}`}
                          </Typography>
                        </Box>
                      )}

                      {(suggestedUser.role || suggestedUser.userType) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: isTablet ? 0.25 : 0.5 }}>
                          <Person sx={{ fontSize: isTablet ? 11 : 12, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: isTablet ? '0.7rem' : '0.75rem' }}>
                            {((suggestedUser.role || suggestedUser.userType) === 'job_seeker' || (suggestedUser.role || suggestedUser.userType) === 'jobseeker') 
                              ? 'Job Seeker' 
                              : (suggestedUser.role || suggestedUser.userType)?.charAt(0).toUpperCase() + (suggestedUser.role || suggestedUser.userType)?.slice(1)}
                          </Typography>
                        </Box>
                      )}

                      {/* Profile Completion Badge */}
                      {(suggestedUser as any).profileCompletion && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: (suggestedUser as any).profileCompletion >= 90 ? 'success.main' : 
                                     (suggestedUser as any).profileCompletion >= 70 ? 'warning.main' : 'error.main',
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              px: 0.5,
                              py: 0.25,
                              borderRadius: '4px',
                              backgroundColor: (suggestedUser as any).profileCompletion >= 90 ? 'success.light' : 
                                              (suggestedUser as any).profileCompletion >= 70 ? 'warning.light' : 'error.light',
                            }}
                          >
                            {(suggestedUser as any).profileCompletion}% Profile
                          </Typography>
                        </Box>
                      )}

                      {suggestedUser.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <LocationOn sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {suggestedUser.location}
                          </Typography>
                        </Box>
                      )}

                      {suggestedUser.skills && suggestedUser.skills.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 0.5, mb: 1, flexWrap: 'wrap' }}>
                          {suggestedUser.skills.slice(0, 2).map((skill, skillIndex) => (
                            <Chip
                              key={skillIndex}
                              label={skill}
                              size="small"
                              variant="outlined"
                              sx={{ 
                                fontSize: '0.65rem',
                                height: 20,
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          ))}
                          {suggestedUser.skills.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                              +{suggestedUser.skills.length - 2}
                            </Typography>
                          )}
                        </Box>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                        <Button
                          component={motion.button}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          variant="contained"
                          size="small"
                          startIcon={<PersonAdd sx={{ fontSize: isTablet ? 14 : 16 }} />}
                          onClick={() => handleConnect(suggestedUser._id)}
                          loading={connectingUsers.includes(suggestedUser._id)}
                          disabled={connectingUsers.includes(suggestedUser._id)}
                          sx={{
                            borderRadius: isTablet ? 1.5 : 2,
                            textTransform: 'none',
                            fontSize: isTablet ? '0.7rem' : '0.75rem',
                            py: isTablet ? 0.4 : 0.5,
                            px: isTablet ? 1.2 : 1.5,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            flex: 1,
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                            },
                          }}
                        >
                          {connectingUsers.includes(suggestedUser._id) ? 'Connecting...' : 'Connect'}
                        </Button>
                        
                        <Button
                          component={motion.button}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          variant="outlined"
                          size="small"
                          startIcon={<Message sx={{ fontSize: isTablet ? 14 : 16 }} />}
                          onClick={() => handleStartChat(suggestedUser._id, `${suggestedUser.firstName} ${suggestedUser.lastName}`)}
                          disabled={messagingUsers.includes(suggestedUser._id)}
                          sx={{
                            borderRadius: isTablet ? 1.5 : 2,
                            textTransform: 'none',
                            fontSize: isTablet ? '0.7rem' : '0.75rem',
                            py: isTablet ? 0.4 : 0.5,
                            px: isTablet ? 1.2 : 1.5,
                            flex: 1,
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white',
                            },
                          }}
                        >
                          {messagingUsers.includes(suggestedUser._id) ? 'Starting...' : 'Message'}
                        </Button>
                      </Box>

                      {suggestedUser.mutualConnections && suggestedUser.mutualConnections > 0 && (
                        <Typography variant="caption" color="primary.main" sx={{ mt: isTablet ? 0.4 : 0.5, display: 'block', fontSize: isTablet ? '0.7rem' : '0.75rem' }}>
                          {suggestedUser.mutualConnections} mutual connection{suggestedUser.mutualConnections > 1 ? 's' : ''}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  {index < suggestedUsers.length - 1 && <Divider />}
                </motion.div>
              ))
            )}
          </Stack>
        </AnimatePresence>

        {suggestedUsers.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: isTablet ? 1.5 : 2, pt: isTablet ? 1.5 : 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="text"
              size="small"
              onClick={() => navigate('/app/connections')}
              sx={{
                textTransform: 'none',
                fontSize: isTablet ? '0.75rem' : '0.85rem',
                fontWeight: 600,
                py: isTablet ? 0.5 : 0.75,
                px: isTablet ? 1 : 1.5,
              }}
            >
              See More Suggestions
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SuggestedConnections;
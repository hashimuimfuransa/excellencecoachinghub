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
} from '@mui/material';
import {
  PersonAdd,
  Work,
  LocationOn,
  Refresh,
  Close,
  Person,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { socialNetworkService } from '../../services/socialNetworkService';

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
  const { user } = useAuth();
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedUsers, setDismissedUsers] = useState<string[]>([]);
  const [connectingUsers, setConnectingUsers] = useState<string[]>([]);

  const fetchSuggestedUsers = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Use the dedicated connection suggestions endpoint
      const response = await socialNetworkService.getConnectionSuggestions(12);
      console.log('Connection suggestions response:', response);
      
      if (response.success && response.data) {
        // Filter out dismissed users
        const filtered = response.data
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
    <Card sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="600">
            Suggested Connections
          </Typography>
          <IconButton onClick={handleRefresh} size="small" sx={{ color: 'primary.main' }}>
            <Refresh />
          </IconButton>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <AnimatePresence mode="popLayout">
          <Stack spacing={2}>
            {suggestedUsers.length === 0 && !loading ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No new suggestions available
                </Typography>
                <Button 
                  onClick={handleRefresh} 
                  size="small" 
                  sx={{ mt: 1 }}
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
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
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
                        width: 48,
                        height: 48,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                          '&:hover': { color: 'primary.main' }
                        }}
                        noWrap
                      >
                        {suggestedUser.firstName} {suggestedUser.lastName}
                      </Typography>

                      {(suggestedUser.jobTitle || suggestedUser.profession) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Work sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {suggestedUser.jobTitle || suggestedUser.profession}
                            {suggestedUser.company && ` at ${suggestedUser.company}`}
                          </Typography>
                        </Box>
                      )}

                      {(suggestedUser.role || suggestedUser.userType) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Person sx={{ fontSize: 12, color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary" noWrap>
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

                      <Button
                        component={motion.button}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        variant="contained"
                        size="small"
                        startIcon={<PersonAdd />}
                        onClick={() => handleConnect(suggestedUser._id)}
                        loading={connectingUsers.includes(suggestedUser._id)}
                        disabled={connectingUsers.includes(suggestedUser._id)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          py: 0.5,
                          px: 1.5,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                          },
                        }}
                      >
                        {connectingUsers.includes(suggestedUser._id) ? 'Connecting...' : 'Connect'}
                      </Button>

                      {suggestedUser.mutualConnections && suggestedUser.mutualConnections > 0 && (
                        <Typography variant="caption" color="primary.main" sx={{ mt: 0.5, display: 'block' }}>
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
          <Box sx={{ textAlign: 'center', mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button
              variant="text"
              size="small"
              onClick={handleRefresh}
              sx={{
                textTransform: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
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
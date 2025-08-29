import React, { useState, useEffect } from 'react';
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
  Grid,
  Chip,
  IconButton,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  Group,
  PersonAdd,
  Check,
  Close,
  Message,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { SocialConnection, ConnectionRequest, SentRequest } from '../types/social';
import { socialNetworkService } from '../services/socialNetworkService';
import { chatService } from '../services/chatService';

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

const NetworkPage: React.FC = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<SentRequest[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [requestingUsers, setRequestingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNetworkData();
  }, []);

  const loadNetworkData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [connectionsRes, requestsRes, sentRequestsRes, suggestionsRes] = await Promise.all([
        socialNetworkService.getConnections(),
        socialNetworkService.getPendingRequests(),
        socialNetworkService.getSentRequests(),
        socialNetworkService.getConnectionSuggestions(20),
      ]);

      setConnections(connectionsRes.data);
      setPendingRequests(requestsRes.data);
      setSentRequests(sentRequestsRes.data);
      setSuggestions(suggestionsRes.data);
    } catch (err) {
      setError('Failed to load network data. Please try again.');
      console.error('Error loading network data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSendRequest = async (userId: string) => {
    // Add user to requesting state
    setRequestingUsers(prev => new Set(prev).add(userId));
    
    try {
      const response = await socialNetworkService.sendConnectionRequest(userId);
      
      // Remove from suggestions
      setSuggestions(prev => prev.filter(user => user._id !== userId));
      
      // Find the user to add to pending requests
      const userToAdd = suggestions.find(user => user._id === userId);
      if (userToAdd) {
        const newPendingRequest: ConnectionRequest = {
          _id: response.data?._id || `temp-${userId}`,
          requester: {
            _id: userToAdd._id,
            firstName: userToAdd.firstName,
            lastName: userToAdd.lastName,
            profilePicture: userToAdd.profilePicture,
            company: userToAdd.company,
            jobTitle: userToAdd.jobTitle,
          },
          recipient: userId,
          status: 'pending',
          connectionType: 'connect',
          createdAt: new Date().toISOString(),
        };
        
        // Note: This would show in "sent requests" not "received requests"
        // For now, we'll just show the success message
      }
      
      // Show success message
      setSuccessMessage(`Connection request sent to ${userToAdd?.firstName} ${userToAdd?.lastName}!`);
      setTimeout(() => setSuccessMessage(null), 5000); // Clear after 5 seconds
      
    } catch (error) {
      console.error('Error sending connection request:', error);
      setError('Failed to send connection request. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      // Remove user from requesting state
      setRequestingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
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
      setConnections(prev => prev.filter(conn => conn.user._id !== userId));
    } catch (error) {
      console.error('Error removing connection:', error);
    }
  };

  const handleStartChat = async (userId: string, userName: string) => {
    try {
      const chat = await chatService.createOrGetChat(userId, `Hi ${userName}! I'd like to connect with you.`);
      // This would ideally open the chat window or navigate to messages
      console.log('Chat started:', chat);
      // You could dispatch an action here to open a chat modal or navigate to chat page
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const filteredConnections = connections.filter(conn =>
    `${conn.user.firstName} ${conn.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.user.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.user.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
            }}
          >
            My Network
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your professional connections and discover new opportunities
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert 
            severity="success" 
            sx={{ mb: 2 }}
            icon={<CheckCircle />}
          >
            {successMessage}
          </Alert>
        )}

        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
              },
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Group />
                  Connections ({connections.length})
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAdd />
                  Requests ({pendingRequests.length + sentRequests.length})
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Search />
                  Discover
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
            {filteredConnections.map((connection) => (
              <Grid item xs={12} sm={6} md={4} key={connection._id}>
                <Card
                  component={motion.div}
                  whileHover={{ y: -4 }}
                  sx={{ borderRadius: 2, height: '100%' }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar
                      src={connection.user.profilePicture}
                      sx={{ width: 64, height: 64, mx: 'auto', mb: 2 }}
                    >
                      {connection.user.firstName[0]}{connection.user.lastName[0]}
                    </Avatar>
                    
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {connection.user.firstName} {connection.user.lastName}
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
                        onClick={() => handleStartChat(connection.user._id, connection.user.firstName)}
                      >
                        Message
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={() => handleRemoveConnection(connection.user._id)}
                      >
                        Remove
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {filteredConnections.length === 0 && (
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
              {pendingRequests.map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request._id}>
                  <Card
                    component={motion.div}
                    whileHover={{ y: -4 }}
                    sx={{ 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'success.main',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.05)' : 'rgba(76, 175, 80, 0.02)',
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
                          onClick={() => handleAcceptRequest(request.requester._id)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Close />}
                          onClick={() => handleRejectRequest(request.requester._id)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Decline
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {pendingRequests.length === 0 && (
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
              {sentRequests.map((request) => (
                <Grid item xs={12} sm={6} md={4} key={request._id}>
                  <Card
                    component={motion.div}
                    whileHover={{ y: -4 }}
                    sx={{ 
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'warning.main',
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.05)' : 'rgba(255, 152, 0, 0.02)',
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
                          onClick={() => handleCancelRequest(request.recipient._id)}
                          sx={{ textTransform: 'none', fontWeight: 600 }}
                        >
                          Cancel Request
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {sentRequests.length === 0 && (
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
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Discover Professionals
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Connect with job seekers, students with completed profiles, and employers. 
              Build your professional network to unlock new opportunities!
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {suggestions.map((user) => (
              <Grid item xs={12} sm={6} md={4} key={user._id}>
                <Card
                  component={motion.div}
                  whileHover={{ y: -4 }}
                  sx={{ borderRadius: 2 }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Avatar
                      src={user.profilePicture}
                      sx={{ width: 64, height: 64, mx: 'auto', mb: 2 }}
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

                    <Button
                      variant="contained"
                      size="small"
                      startIcon={requestingUsers.has(user._id) ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}
                      onClick={() => handleSendRequest(user._id)}
                      disabled={requestingUsers.has(user._id)}
                      sx={{
                        background: requestingUsers.has(user._id) 
                          ? 'linear-gradient(45deg, #ccc 30%, #ddd 90%)'
                          : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {requestingUsers.has(user._id) ? 'Sending...' : 'Connect'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {suggestions.length === 0 && (
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
      </motion.div>
    </Container>
  );
};

export default NetworkPage;
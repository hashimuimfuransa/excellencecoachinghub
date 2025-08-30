import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  LocationOn,
  Email,
  Phone,
  Business,
  School,
  ArrowBack,
  PersonAdd,
  Check,
  AccessTime,
  Message,
  LinkedIn,
  GitHub,
  Language,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/userService';
import { socialNetworkService } from '../services/socialNetworkService';
import type { User } from '../types/user';
import { motion } from 'framer-motion';

const SummaryProfilePage: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected' | 'loading'>('none');

  useEffect(() => {
    if (userId) {
      loadProfile();
      if (user && userId !== user._id) {
        checkConnectionStatus();
      }
    }
  }, [userId, user]);

  const loadProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const userProfile = await userService.getUserProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    if (!userId || !user) return;
    
    try {
      const response = await socialNetworkService.getConnectionStatus(userId);
      const status = response.data?.status || 'none';
      // Map backend status to component status
      if (status === 'accepted') {
        setConnectionStatus('connected');
      } else if (status === 'pending') {
        setConnectionStatus('pending');
      } else {
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus('none');
    }
  };

  const handleConnect = async () => {
    if (!user || !userId || connectionStatus === 'loading') return;
    
    try {
      setConnectionStatus('loading');
      
      if (connectionStatus === 'none') {
        await socialNetworkService.sendConnectionRequest(userId, 'connect');
        setConnectionStatus('pending');
      } else if (connectionStatus === 'pending') {
        await socialNetworkService.cancelConnectionRequest(userId);
        setConnectionStatus('none');
      }
    } catch (error) {
      console.error('Error handling connection:', error);
      setConnectionStatus(connectionStatus === 'none' ? 'none' : 'pending');
    }
  };

  const handleMessage = () => {
    // Navigate to chat or open messaging
    navigate(`/app/chat/${userId}`);
  };

  const getConnectButtonText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'pending': return 'Pending';
      case 'loading': return 'Loading...';
      default: return 'Connect';
    }
  };

  const getConnectButtonIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Check />;
      case 'pending': return <AccessTime />;
      case 'loading': return <AccessTime />;
      default: return <PersonAdd />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Profile not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" fontWeight="bold">
            Profile Summary
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Main Profile Card */}
          <Grid item xs={12} md={4}>
            <Card
              component={motion.div}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              sx={{ 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'visible'
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Avatar
                  src={profile.profilePicture}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    border: '4px solid white',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                  }}
                >
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </Avatar>
                
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {profile.firstName} {profile.lastName}
                </Typography>
                
                {profile.jobTitle && (
                  <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                    {profile.jobTitle}
                  </Typography>
                )}
                
                {profile.company && (
                  <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                    at {profile.company}
                  </Typography>
                )}

                <Chip
                  label={profile.role?.replace('_', ' ') || 'User'}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    mb: 3
                  }}
                />

                {/* Action Buttons */}
                {user && userId !== user._id && (
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                    <Button
                      variant="contained"
                      color={connectionStatus === 'connected' ? 'success' : 'primary'}
                      startIcon={getConnectButtonIcon()}
                      onClick={handleConnect}
                      disabled={connectionStatus === 'loading'}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.3)',
                        }
                      }}
                    >
                      {getConnectButtonText()}
                    </Button>
                    
                    {connectionStatus === 'connected' && (
                      <Button
                        variant="contained"
                        startIcon={<Message />}
                        onClick={handleMessage}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.2)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.3)',
                          }
                        }}
                      >
                        Message
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Profile Details */}
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              {/* Contact Information */}
              <Grid item xs={12}>
                <Card
                  component={motion.div}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Contact Information
                    </Typography>
                    <List dense>
                      {profile.email && (
                        <ListItem>
                          <ListItemIcon>
                            <Email color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={profile.email} />
                        </ListItem>
                      )}
                      {profile.phone && (
                        <ListItem>
                          <ListItemIcon>
                            <Phone color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={profile.phone} />
                        </ListItem>
                      )}
                      {profile.location && (
                        <ListItem>
                          <ListItemIcon>
                            <LocationOn color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={profile.location} />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Professional Information */}
              <Grid item xs={12}>
                <Card
                  component={motion.div}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      Professional Information
                    </Typography>
                    <List dense>
                      {profile.jobTitle && (
                        <ListItem>
                          <ListItemIcon>
                            <Business color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Position" 
                            secondary={profile.jobTitle}
                          />
                        </ListItem>
                      )}
                      {profile.company && (
                        <ListItem>
                          <ListItemIcon>
                            <Business color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Company" 
                            secondary={profile.company}
                          />
                        </ListItem>
                      )}
                      {profile.education && (
                        <ListItem>
                          <ListItemIcon>
                            <School color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary="Education" 
                            secondary={profile.education}
                          />
                        </ListItem>
                      )}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              {/* Bio/About */}
              {profile.bio && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        About
                      </Typography>
                      <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                        {profile.bio}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Skills */}
              {profile.skills && profile.skills.length > 0 && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Skills
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {profile.skills.map((skill, index) => (
                          <Chip
                            key={index}
                            label={skill}
                            variant="outlined"
                            color="primary"
                            size="small"
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Social Links */}
              {(profile.socialLinks?.linkedin || profile.socialLinks?.github || profile.socialLinks?.website) && (
                <Grid item xs={12}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        Social Links
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {profile.socialLinks?.linkedin && (
                          <Button
                            variant="outlined"
                            startIcon={<LinkedIn />}
                            href={profile.socialLinks.linkedin}
                            target="_blank"
                            size="small"
                          >
                            LinkedIn
                          </Button>
                        )}
                        {profile.socialLinks?.github && (
                          <Button
                            variant="outlined"
                            startIcon={<GitHub />}
                            href={profile.socialLinks.github}
                            target="_blank"
                            size="small"
                          >
                            GitHub
                          </Button>
                        )}
                        {profile.socialLinks?.website && (
                          <Button
                            variant="outlined"
                            startIcon={<Language />}
                            href={profile.socialLinks.website}
                            target="_blank"
                            size="small"
                          >
                            Website
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </motion.div>
    </Container>
  );
};

export default SummaryProfilePage;
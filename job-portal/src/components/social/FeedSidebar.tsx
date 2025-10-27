import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Refresh,
  TrendingUp,
  Event,
  Business,
  School,
  Group,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { SocialConnection, SocialEvent, SocialCompany } from '../../types/social';
import { socialNetworkService } from '../../services/socialNetworkService';
import { eventService } from '../../services/eventService';
import { companyService } from '../../services/companyService';
import SuggestedConnections from '../network/SuggestedConnections';

const FeedSidebar: React.FC = () => {
  const theme = useTheme();
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SocialEvent[]>([]);
  const [suggestedCompanies, setSuggestedCompanies] = useState<SocialCompany[]>([]);
  const [loading, setLoading] = useState(true);

  const trendingTopics = [
    { name: 'Remote Work', count: 156 },
    { name: 'JavaScript', count: 89 },
    { name: 'Career Growth', count: 76 },
    { name: 'AI Technology', count: 65 },
    { name: 'Software Engineering', count: 54 },
  ];

  useEffect(() => {
    loadSidebarData();
  }, []);

  const loadSidebarData = async () => {
    setLoading(true);
    try {
      const [connectionsRes, eventsRes, companiesRes] = await Promise.all([
        socialNetworkService.getConnections(),
        eventService.getUpcomingEvents(3),
        companyService.getCompanySuggestions(3),
      ]);

      // Handle direct array responses from services
      const connectionsData = Array.isArray(connectionsRes) ? connectionsRes : (connectionsRes?.data || []);
      const eventsData = Array.isArray(eventsRes) ? eventsRes : (eventsRes?.data || []);
      const companiesData = Array.isArray(companiesRes) ? companiesRes : (companiesRes?.data || []);

      setConnections(connectionsData.slice(0, 5));
      setUpcomingEvents(eventsData);
      setSuggestedCompanies(companiesData);
    } catch (error) {
      console.error('Error loading sidebar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowCompany = async (companyId: string) => {
    try {
      await companyService.followCompany(companyId);
      setSuggestedCompanies(prev => 
        prev.map(company => 
          company._id === companyId 
            ? { ...company, isFollowing: !company.isFollowing }
            : company
        )
      );
    } catch (error) {
      console.error('Error following company:', error);
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      display: { xs: 'none', sm: 'block' },
      maxWidth: 'none'
    }}>
      {/* Suggested Connections */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Box sx={{ mb: { xs: 2, sm: 2.5, md: 3, lg: 3 } }}>
          <SuggestedConnections />
        </Box>
      </motion.div>

      {/* Trending Topics */}
      <Card
        component={motion.div}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        sx={{ mb: isTablet ? 2 : 3, borderRadius: isTablet ? 2 : 2 }}
      >
        <CardContent sx={{ p: isTablet ? 2 : 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: isTablet ? 1.5 : 2 }}>
            <TrendingUp color="primary" sx={{ mr: 1, fontSize: isTablet ? 20 : 24 }} />
            <Typography variant={isTablet ? "subtitle1" : "h6"} sx={{ fontSize: isTablet ? '1rem' : '1.1rem', fontWeight: 600 }}>
              Trending Topics
            </Typography>
            <IconButton size="small" sx={{ ml: 'auto' }} onClick={loadSidebarData}>
              <Refresh sx={{ fontSize: isTablet ? 18 : 20 }} />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: isTablet ? 0.5 : 1 }}>
            {trendingTopics.slice(0, isTablet ? 4 : 5).map((topic, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: isTablet ? 0.75 : 1,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.05)' 
                      : 'rgba(0,0,0,0.05)',
                  },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: isTablet ? '0.8rem' : '0.875rem' }}>
                  #{topic.name}
                </Typography>
                <Chip 
                  label={topic.count} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: isTablet ? '0.65rem' : '0.75rem', height: isTablet ? 20 : 24 }}
                />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Recent Connections */}
      <Card
        component={motion.div}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        sx={{ mb: isTablet ? 2 : 3, borderRadius: 2 }}
      >
        <CardContent sx={{ p: isTablet ? 2 : 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: isTablet ? 1.5 : 2 }}>
            <Group color="primary" sx={{ mr: 1, fontSize: isTablet ? 20 : 24 }} />
            <Typography variant={isTablet ? "subtitle1" : "h6"} sx={{ fontSize: isTablet ? '1rem' : '1.1rem', fontWeight: 600 }}>
              Your Network
            </Typography>
          </Box>
          
          <List sx={{ p: 0 }}>
            {connections.slice(0, isTablet ? 3 : 4).map((connection, index) => (
              <ListItem key={connection._id} sx={{ px: 0, py: isTablet ? 0.75 : 1 }}>
                <ListItemAvatar>
                  <Avatar
                    src={connection.user?.profilePicture}
                    sx={{ width: isTablet ? 28 : 32, height: isTablet ? 28 : 32 }}
                  >
                    {connection.user?.firstName?.[0]}{connection.user?.lastName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: isTablet ? '0.8rem' : '0.875rem' }}>
                      {connection.user?.firstName} {connection.user?.lastName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: isTablet ? '0.7rem' : '0.75rem' }}>
                      {connection.user?.jobTitle || 'Professional'}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
          
          {connections.length > (isTablet ? 3 : 4) && (
            <Button size="small" sx={{ mt: 1, fontSize: isTablet ? '0.75rem' : '0.875rem' }}>
              View all {connections.length} connections
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Events - Show only on desktop to save space on tablets */}
      {!isTablet && (
        <Card
          component={motion.div}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Event color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                Upcoming Events
              </Typography>
            </Box>
            
            {upcomingEvents.length > 0 ? (
              <List sx={{ p: 0 }}>
                {upcomingEvents.map((event, index) => (
                  <ListItem key={event._id} sx={{ px: 0, py: 1 }}>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          {event.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(event.date).toLocaleDateString()}
                          </Typography>
                          <Chip
                            label={event.eventType}
                            size="small"
                            variant="outlined"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No upcoming events
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggested Companies - Show only on desktop to save space on tablets */}
      {!isTablet && (
        <Card
          component={motion.div}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          sx={{ borderRadius: 2 }}
        >
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Business color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                Companies to Follow
              </Typography>
            </Box>
            
            {suggestedCompanies.length > 0 ? (
              <List sx={{ p: 0 }}>
                {suggestedCompanies.map((company, index) => (
                  <ListItem key={company._id} sx={{ px: 0, py: 1 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={company.logo}
                        sx={{ width: 32, height: 32 }}
                      >
                        {company.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {company.name}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          {company.followersCount} followers
                        </Typography>
                      }
                    />
                    <Button
                      size="small"
                      variant={company.isFollowing ? "outlined" : "contained"}
                      onClick={() => handleFollowCompany(company._id)}
                      sx={{ ml: 1 }}
                    >
                      {company.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No company suggestions
              </Typography>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default FeedSidebar;
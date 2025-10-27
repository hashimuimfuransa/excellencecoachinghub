import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  AppBar,
  Toolbar,
  Avatar,
  Stack,
  Divider,
  Badge,
  Fab,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack,
  Event,
  Announcement,
  CalendarToday,
  AccessTime,
  LocationOn,
  VideoCall,
  Person,
  FilterList,
  Search,
  Refresh,
  MoreVert,
  Star,
  StarBorder,
  Share,
  Bookmark,
  BookmarkBorder,
  Notifications,
  NotificationsOff
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { motion } from 'framer-motion';
import api from '../../services/api';

// Event Card Component
const EventCard: React.FC<{ event: any; onJoin?: (event: any) => void }> = ({ event, onJoin }) => (
  <Card 
    component={motion.div}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: { xs: 2, sm: 3 },
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: { xs: 'none', sm: 'translateY(-4px)' },
        boxShadow: { xs: '0 4px 20px rgba(0,0,0,0.08)', sm: '0 8px 30px rgba(0,0,0,0.15)' },
        borderColor: 'primary.main'
      }
    }}
  >
    <CardContent sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 1.5 }, mb: 2 }}>
        <Box sx={{
          p: { xs: 1, sm: 1.5 },
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Event sx={{ fontSize: { xs: 20, sm: 24 }, color: 'info.main' }} />
        </Box>
        <Typography variant="h6" sx={{ 
          fontWeight: 700, 
          flex: 1,
          fontSize: { xs: '1rem', sm: '1.25rem' },
          lineHeight: 1.3
        }}>
          {event.title || 'Live Session'}
        </Typography>
        <IconButton size="small" sx={{ flexShrink: 0 }}>
          <MoreVert sx={{ fontSize: { xs: 18, sm: 20 } }} />
        </IconButton>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ 
        mb: 2, 
        lineHeight: 1.5,
        fontSize: { xs: '0.875rem', sm: '0.875rem' },
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {event.description || 'Join this live session to learn more about the course content.'}
      </Typography>
      
      <Stack spacing={{ xs: 1, sm: 1.5 }} sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarToday sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary', flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {event.scheduledTime ? new Date(event.scheduledTime).toLocaleDateString() : 'TBA'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary', flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {event.scheduledTime ? new Date(event.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBA'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocationOn sx={{ fontSize: { xs: 14, sm: 16 }, color: 'text.secondary', flexShrink: 0 }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            {event.location || 'Online'}
          </Typography>
        </Box>
      </Stack>
      
      <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap', mb: 2 }}>
        <Chip
          label={event.type || 'Live Session'}
          size="small"
          sx={{ 
            backgroundColor: 'rgba(33, 150, 243, 0.1)', 
            color: 'info.main',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            height: { xs: 24, sm: 28 }
          }}
        />
        <Chip
          label={event.isOnline ? 'Online' : 'In-Person'}
          size="small"
          sx={{ 
            backgroundColor: 'rgba(76, 175, 80, 0.1)', 
            color: 'success.main',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            height: { xs: 24, sm: 28 }
          }}
        />
      </Box>
    </CardContent>
    
    <Box sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
      <Button
        variant="contained"
        fullWidth
        startIcon={<VideoCall sx={{ fontSize: { xs: 16, sm: 18 } }} />}
        onClick={() => onJoin?.(event)}
        sx={{
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          borderRadius: { xs: 1.5, sm: 2 },
          py: { xs: 1.25, sm: 1.5 },
          fontWeight: 600,
          fontSize: { xs: '0.875rem', sm: '1rem' },
          '&:hover': {
            background: 'linear-gradient(135deg, #5b5bd6, #7c3aed)'
          }
        }}
      >
        Join Event
      </Button>
    </Box>
  </Card>
);

// Announcement Card Component
const AnnouncementCard: React.FC<{ announcement: any; onRead?: (announcement: any) => void }> = ({ announcement, onRead }) => (
  <Card 
    component={motion.div}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: { xs: 2, sm: 3 },
      border: announcement.priority === 'urgent' 
        ? '2px solid rgba(244, 67, 54, 0.3)' 
        : announcement.priority === 'high'
        ? '2px solid rgba(255, 152, 0, 0.3)'
        : '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: { xs: 'none', sm: 'translateY(-4px)' },
        boxShadow: { xs: '0 4px 20px rgba(0,0,0,0.08)', sm: '0 8px 30px rgba(0,0,0,0.15)' },
        borderColor: announcement.priority === 'urgent' ? 'error.main' : announcement.priority === 'high' ? 'warning.main' : 'primary.main'
      }
    }}
  >
    <CardContent sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: { xs: 1, sm: 1.5 }, mb: 2 }}>
        <Box sx={{
          p: { xs: 1, sm: 1.5 },
          backgroundColor: announcement.priority === 'urgent' 
            ? 'rgba(244, 67, 54, 0.1)' 
            : announcement.priority === 'high'
            ? 'rgba(255, 152, 0, 0.1)'
            : 'rgba(0,0,0,0.05)',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Announcement sx={{ 
            fontSize: { xs: 20, sm: 24 }, 
            color: announcement.priority === 'urgent' ? 'error.main' : announcement.priority === 'high' ? 'warning.main' : 'text.secondary' 
          }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 700, 
            mb: 1,
            fontSize: { xs: '1rem', sm: '1.25rem' },
            lineHeight: 1.3,
            color: announcement.priority === 'urgent' ? 'error.main' : announcement.priority === 'high' ? 'warning.main' : 'text.primary'
          }}>
            {announcement.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 }, mb: 1, flexWrap: 'wrap' }}>
            <Avatar sx={{ width: { xs: 20, sm: 24 }, height: { xs: 20, sm: 24 }, fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              {announcement.instructor?.firstName?.charAt(0) || 'I'}
            </Avatar>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              {announcement.instructor?.firstName} {announcement.instructor?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>•</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
              {announcement.createdAt ? new Date(announcement.createdAt).toLocaleDateString() : 'Recently'}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {announcement.priority === 'urgent' && (
            <Box sx={{
              width: { xs: 6, sm: 8 },
              height: { xs: 6, sm: 8 },
              backgroundColor: 'error.main',
              borderRadius: '50%',
              animation: 'pulse 2s infinite'
            }} />
          )}
          <IconButton size="small">
            <MoreVert sx={{ fontSize: { xs: 18, sm: 20 } }} />
          </IconButton>
        </Box>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ 
        mb: 2, 
        lineHeight: 1.5,
        fontSize: { xs: '0.875rem', sm: '0.875rem' },
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {announcement.content}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: { xs: 0.5, sm: 1 }, flexWrap: 'wrap', mb: 2 }}>
        <Chip
          label={announcement.type || 'General'}
          size="small"
          sx={{ 
            backgroundColor: announcement.priority === 'urgent' 
              ? 'rgba(244, 67, 54, 0.1)' 
              : announcement.priority === 'high'
              ? 'rgba(255, 152, 0, 0.1)'
              : 'rgba(0,0,0,0.05)',
            color: announcement.priority === 'urgent' ? 'error.main' : announcement.priority === 'high' ? 'warning.main' : 'text.secondary',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            height: { xs: 24, sm: 28 }
          }}
        />
        <Chip
          label={announcement.priority || 'Medium'}
          size="small"
          sx={{ 
            backgroundColor: announcement.priority === 'urgent' 
              ? 'rgba(244, 67, 54, 0.1)' 
              : announcement.priority === 'high'
              ? 'rgba(255, 152, 0, 0.1)'
              : 'rgba(0,0,0,0.05)',
            color: announcement.priority === 'urgent' ? 'error.main' : announcement.priority === 'high' ? 'warning.main' : 'text.secondary',
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            height: { xs: 24, sm: 28 }
          }}
        />
        {announcement.isPinned && (
          <Chip
            icon={<Star sx={{ fontSize: { xs: 12, sm: 14 } }} />}
            label="Pinned"
            size="small"
            sx={{ 
              backgroundColor: 'rgba(255, 193, 7, 0.1)', 
              color: 'warning.main',
              fontSize: { xs: '0.7rem', sm: '0.75rem' },
              height: { xs: 24, sm: 28 }
            }}
          />
        )}
      </Box>
    </CardContent>
    
    <Box sx={{ p: { xs: 2, sm: 3 }, pt: 0 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<BookmarkBorder sx={{ fontSize: { xs: 14, sm: 16 } }} />}
          sx={{ 
            borderRadius: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.75, sm: 1 },
            flex: { xs: 'none', sm: 1 }
          }}
        >
          Save
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Share sx={{ fontSize: { xs: 14, sm: 16 } }} />}
          sx={{ 
            borderRadius: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.75, sm: 1 },
            flex: { xs: 'none', sm: 1 }
          }}
        >
          Share
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={() => onRead?.(announcement)}
          sx={{
            background: 'linear-gradient(135deg, #6366f1, #a855f7)',
            borderRadius: { xs: 1.5, sm: 2 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            py: { xs: 0.75, sm: 1 },
            flex: { xs: 'none', sm: 1 },
            '&:hover': {
              background: 'linear-gradient(135deg, #5b5bd6, #7c3aed)'
            }
          }}
        >
          Mark as Read
        </Button>
      </Stack>
    </Box>
  </Card>
);

// Filter Component
const FilterComponent: React.FC<{ 
  activeTab: number; 
  onTabChange: (tab: number) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}> = ({ activeTab, onTabChange, searchQuery, onSearchChange }) => (
  <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 }, borderRadius: { xs: 2, sm: 3 } }}>
    <Tabs 
      value={activeTab} 
      onChange={(_, newValue) => onTabChange(newValue)}
      variant="scrollable"
      scrollButtons="auto"
      sx={{
        '& .MuiTab-root': {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: { xs: 1.5, sm: 2 },
          mx: { xs: 0.25, sm: 0.5 },
          minWidth: { xs: 'auto', sm: '120px' },
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          py: { xs: 1, sm: 1.5 },
          px: { xs: 1, sm: 2 },
          '&.Mui-selected': {
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: 'primary.main'
          }
        },
        '& .MuiTabs-scrollButtons': {
          width: { xs: 32, sm: 40 }
        }
      }}
    >
      <Tab label="All Events" />
      <Tab label="Live Sessions" />
      <Tab label="All Announcements" />
      <Tab label="Urgent" />
    </Tabs>
    
    <Box sx={{ mt: { xs: 1.5, sm: 2 }, display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Search sx={{ color: 'text.secondary', fontSize: { xs: 18, sm: 20 } }} />
        <input
          type="text"
          placeholder="Search events and announcements..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            flex: 1,
            padding: '8px',
            fontSize: window.innerWidth < 600 ? '14px' : '14px',
            backgroundColor: 'transparent'
          }}
        />
      </Box>
      <IconButton size="small">
        <FilterList sx={{ fontSize: { xs: 18, sm: 20 } }} />
      </IconButton>
    </Box>
  </Paper>
);

// Main Page Component
const EventsAndAnnouncementsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [events, setEvents] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = async () => {
    if (!courseId) return;

    try {
      setLoading(true);
      setError(null);

      const [eventsResponse, announcementsResponse] = await Promise.all([
        api.get(`/live-sessions/course/${courseId}`).catch(() => ({ data: { data: [] } })),
        api.get(`/announcements/course/${courseId}`).catch(() => ({ data: { data: [] } }))
      ]);

      // Ensure we always have arrays
      const eventsData = eventsResponse.data?.data;
      const announcementsData = announcementsResponse.data?.data;
      
      console.log('Events response:', eventsResponse.data);
      console.log('Announcements response:', announcementsResponse.data);
      console.log('Events data type:', typeof eventsData, Array.isArray(eventsData));
      console.log('Announcements data type:', typeof announcementsData, Array.isArray(announcementsData));
      
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setAnnouncements(Array.isArray(announcementsData) ? announcementsData : []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load events and announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleBack = () => {
    navigate(`/dashboard/student/course/${courseId}`);
  };

  const handleJoinEvent = (event: any) => {
    console.log('Joining event:', event);
    // Implement event joining logic
  };

  const handleReadAnnouncement = (announcement: any) => {
    console.log('Marking announcement as read:', announcement);
    // Implement mark as read logic
  };

  const filteredEvents = (Array.isArray(events) ? events : []).filter(event => {
    if (activeTab === 1 && !event.title?.toLowerCase().includes('live')) return false;
    if (searchQuery && !event.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredAnnouncements = (Array.isArray(announcements) ? announcements : []).filter(announcement => {
    if (activeTab === 3 && announcement.priority !== 'urgent') return false;
    if (searchQuery && !announcement.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Please log in to access this page.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading events and announcements...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Back to Course
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* Header */}
      <AppBar position="sticky" sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.98)', 
        backdropFilter: 'blur(20px)',
        color: 'text.primary', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Events & Announcements
          </Typography>
          <IconButton onClick={loadData}>
            <Refresh />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
        {/* Filter Component */}
        <FilterComponent
          activeTab={activeTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Content */}
        {(activeTab === 0 || activeTab === 1) && (
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}>
              {activeTab === 1 ? 'Live Sessions' : 'Upcoming Events'} ({Array.isArray(filteredEvents) ? filteredEvents.length : 0})
            </Typography>
            
            {(Array.isArray(filteredEvents) ? filteredEvents.length : 0) === 0 ? (
              <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center', borderRadius: { xs: 2, sm: 3 } }}>
                <Event sx={{ fontSize: { xs: 48, sm: 64 }, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  No events found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  {searchQuery ? 'Try adjusting your search terms' : 'No events are scheduled at the moment'}
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {Array.isArray(filteredEvents) && filteredEvents.map((event, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={event._id || index}>
                    <EventCard event={event} onJoin={handleJoinEvent} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {(activeTab === 0 || activeTab === 2 || activeTab === 3) && (
          <Box>
            <Typography variant="h5" sx={{ 
              fontWeight: 700, 
              mb: { xs: 2, sm: 3 },
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}>
              {activeTab === 3 ? 'Urgent Announcements' : activeTab === 2 ? 'All Announcements' : 'Recent Announcements'} ({Array.isArray(filteredAnnouncements) ? filteredAnnouncements.length : 0})
            </Typography>
            
            {(Array.isArray(filteredAnnouncements) ? filteredAnnouncements.length : 0) === 0 ? (
              <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center', borderRadius: { xs: 2, sm: 3 } }}>
                <Announcement sx={{ fontSize: { xs: 48, sm: 64 }, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  No announcements found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                  {searchQuery ? 'Try adjusting your search terms' : 'No announcements have been posted yet'}
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {Array.isArray(filteredAnnouncements) && filteredAnnouncements.map((announcement, index) => (
                  <Grid item xs={12} sm={6} lg={4} key={announcement._id || index}>
                    <AnnouncementCard announcement={announcement} onRead={handleReadAnnouncement} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Container>

      {/* Floating Action Button */}
      <Fab
        sx={{
          position: 'fixed',
          bottom: { xs: 16, sm: 24 },
          right: { xs: 16, sm: 24 },
          width: { xs: 48, sm: 56 },
          height: { xs: 48, sm: 56 },
          background: 'linear-gradient(135deg, #6366f1, #a855f7)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5b5bd6, #7c3aed)'
          }
        }}
        onClick={loadData}
      >
        <Refresh sx={{ fontSize: { xs: 20, sm: 24 } }} />
      </Fab>
    </Box>
  );
};

export default EventsAndAnnouncementsPage;

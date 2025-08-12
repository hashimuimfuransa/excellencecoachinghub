import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack,
  Announcement,
  NotificationsActive,
  Schedule,
  Person,
  Search,
  FilterList,
  ExpandMore,
  PushPin,
  Info,
  Warning,
  CheckCircle,
  Error,
  School,
  CalendarToday,
  AccessTime,
  Visibility,
  VisibilityOff,
  MarkEmailRead,
  MarkEmailUnread
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { announcementService } from '../../services/announcementService';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  course: string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  type: 'general' | 'assignment' | 'exam' | 'schedule' | 'urgent';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isPinned: boolean;
  isPublished: boolean;
  scheduledDate?: Date;
  expiryDate?: Date;
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  readBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface AnnouncementRead {
  announcementId: string;
  readAt: Date;
}

const CourseAnnouncementsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [readFilter, setReadFilter] = useState('all');

  // Dialog state
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Load announcements
  useEffect(() => {
    const loadAnnouncements = async () => {
      if (!user || !id) {
        setError('Please log in to access announcements');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load course details
        const courseData = await courseService.getPublicCourseById(id);
        setCourse(courseData);

        // Load announcements
        const announcementsData = await announcementService.getCourseAnnouncements(id);
        setAnnouncements(announcementsData || []);

        // Load read status
        const readStatusData = await announcementService.getReadStatus(id);
        const statusMap: Record<string, boolean> = {};
        readStatusData?.forEach((status: AnnouncementRead) => {
          statusMap[status.announcementId] = true;
        });
        setReadStatus(statusMap);

      } catch (err: any) {
        console.error('Announcements loading failed:', err);
        setError(err.message || 'Failed to load announcements');
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, [id, user]);

  // Get announcement type info
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'assignment':
        return { color: 'warning', icon: <School />, label: 'Assignment' };
      case 'exam':
        return { color: 'error', icon: <Warning />, label: 'Exam' };
      case 'schedule':
        return { color: 'info', icon: <Schedule />, label: 'Schedule' };
      case 'urgent':
        return { color: 'error', icon: <Error />, label: 'Urgent' };
      default:
        return { color: 'primary', icon: <Info />, label: 'General' };
    }
  };

  // Get priority info
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { color: 'error', label: 'Urgent', weight: 4 };
      case 'high':
        return { color: 'warning', label: 'High', weight: 3 };
      case 'medium':
        return { color: 'info', label: 'Medium', weight: 2 };
      default:
        return { color: 'default', label: 'Low', weight: 1 };
    }
  };

  // Filter and search announcements
  const getFilteredAnnouncements = () => {
    let filtered = announcements;

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(announcement =>
        announcement.title.toLowerCase().includes(term) ||
        announcement.content.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(announcement => announcement.type === typeFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(announcement => announcement.priority === priorityFilter);
    }

    // Read status filter
    if (readFilter === 'read') {
      filtered = filtered.filter(announcement => readStatus[announcement._id]);
    } else if (readFilter === 'unread') {
      filtered = filtered.filter(announcement => !readStatus[announcement._id]);
    }

    // Sort by priority and date
    return filtered.sort((a, b) => {
      // Pinned announcements first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then by priority
      const aPriority = getPriorityInfo(a.priority).weight;
      const bPriority = getPriorityInfo(b.priority).weight;
      if (aPriority !== bPriority) return bPriority - aPriority;

      // Finally by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  // Mark announcement as read
  const markAsRead = async (announcementId: string) => {
    if (readStatus[announcementId]) return;

    try {
      await announcementService.markAsRead(announcementId);
      setReadStatus(prev => ({ ...prev, [announcementId]: true }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  // Toggle read status
  const toggleReadStatus = async (announcementId: string) => {
    try {
      const isRead = readStatus[announcementId];
      if (isRead) {
        await announcementService.markAsUnread(announcementId);
        setReadStatus(prev => ({ ...prev, [announcementId]: false }));
      } else {
        await announcementService.markAsRead(announcementId);
        setReadStatus(prev => ({ ...prev, [announcementId]: true }));
      }
    } catch (error) {
      console.error('Failed to toggle read status:', error);
      setError('Failed to update read status');
    }
  };

  // View announcement details
  const viewAnnouncementDetails = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setDetailsDialogOpen(true);
    markAsRead(announcement._id);
  };

  // Download attachment
  const downloadAttachment = async (attachment: any) => {
    try {
      const response = await fetch(attachment.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download attachment');
    }
  };

  // Get unread count
  const getUnreadCount = () => {
    return announcements.filter(announcement => !readStatus[announcement._id]).length;
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/dashboard/student/course/${id}`)}
          variant="outlined"
        >
          Back to Course
        </Button>
      </Container>
    );
  }

  const filteredAnnouncements = getFilteredAnnouncements();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/dashboard/student/course/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to Course
        </Button>

        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Badge badgeContent={getUnreadCount()} color="error">
                <Announcement color="primary" />
              </Badge>
              {course?.title} - Announcements
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Stay updated with important course information and announcements from your instructor
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="assignment">Assignment</MenuItem>
                  <MenuItem value="exam">Exam</MenuItem>
                  <MenuItem value="schedule">Schedule</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => setPriorityFilter(e.target.value)}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={readFilter}
                  label="Status"
                  onChange={(e) => setReadFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="unread">Unread</MenuItem>
                  <MenuItem value="read">Read</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {getUnreadCount()} unread
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Announcement sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No announcements found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || typeFilter !== 'all' || priorityFilter !== 'all' || readFilter !== 'all'
              ? "No announcements match your current filters."
              : "Your instructor hasn't posted any announcements yet."
            }
          </Typography>
        </Paper>
      ) : (
        <Box>
          {filteredAnnouncements.map((announcement) => {
            const typeInfo = getTypeInfo(announcement.type);
            const priorityInfo = getPriorityInfo(announcement.priority);
            const isRead = readStatus[announcement._id];

            return (
              <Card 
                key={announcement._id} 
                sx={{ 
                  mb: 2,
                  border: isRead ? 'none' : '2px solid',
                  borderColor: isRead ? 'transparent' : 'primary.main',
                  bgcolor: isRead ? 'background.paper' : 'primary.light',
                  opacity: isRead ? 0.8 : 1
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {announcement.isPinned && (
                          <PushPin color="warning" fontSize="small" />
                        )}
                        <Typography variant="h6" sx={{ fontWeight: isRead ? 'normal' : 'bold' }}>
                          {announcement.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Chip
                            icon={typeInfo.icon}
                            label={typeInfo.label}
                            color={typeInfo.color as any}
                            size="small"
                          />
                          <Chip
                            label={priorityInfo.label}
                            color={priorityInfo.color as any}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Avatar 
                            src={announcement.instructor.avatar}
                            sx={{ width: 24, height: 24 }}
                          >
                            {announcement.instructor.firstName[0]}
                          </Avatar>
                          <Typography variant="body2" color="text.secondary">
                            {announcement.instructor.firstName} {announcement.instructor.lastName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarToday fontSize="small" />
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(announcement.createdAt)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <AccessTime fontSize="small" />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(announcement.createdAt).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography 
                        variant="body1" 
                        paragraph
                        sx={{ 
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}
                      >
                        {announcement.content}
                      </Typography>

                      {announcement.attachments.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Attachments ({announcement.attachments.length}):
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {announcement.attachments.map((attachment, index) => (
                              <Chip
                                key={index}
                                label={attachment.originalName}
                                size="small"
                                onClick={() => downloadAttachment(attachment)}
                                clickable
                              />
                            ))}
                          </Box>
                        </Box>
                      )}

                      {announcement.expiryDate && new Date(announcement.expiryDate) > new Date() && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          This announcement expires on {new Date(announcement.expiryDate).toLocaleDateString()}
                        </Alert>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                      <Tooltip title={isRead ? "Mark as unread" : "Mark as read"}>
                        <IconButton
                          onClick={() => toggleReadStatus(announcement._id)}
                          color={isRead ? "default" : "primary"}
                        >
                          {isRead ? <MarkEmailUnread /> : <MarkEmailRead />}
                        </IconButton>
                      </Tooltip>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => viewAnnouncementDetails(announcement)}
                      >
                        View Details
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Announcement Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedAnnouncement?.isPinned && (
              <PushPin color="warning" />
            )}
            {selectedAnnouncement?.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedAnnouncement && (
            <Box>
              {/* Announcement Meta */}
              <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar 
                        src={selectedAnnouncement.instructor.avatar}
                        sx={{ width: 32, height: 32 }}
                      >
                        {selectedAnnouncement.instructor.firstName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Posted by
                        </Typography>
                        <Typography variant="body1">
                          {selectedAnnouncement.instructor.firstName} {selectedAnnouncement.instructor.lastName}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Posted on
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  {(() => {
                    const typeInfo = getTypeInfo(selectedAnnouncement.type);
                    const priorityInfo = getPriorityInfo(selectedAnnouncement.priority);
                    return (
                      <>
                        <Chip
                          icon={typeInfo.icon}
                          label={typeInfo.label}
                          color={typeInfo.color as any}
                          size="small"
                        />
                        <Chip
                          label={priorityInfo.label}
                          color={priorityInfo.color as any}
                          size="small"
                          variant="outlined"
                        />
                      </>
                    );
                  })()}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Announcement Content */}
              <Typography variant="body1" paragraph style={{ whiteSpace: 'pre-wrap' }}>
                {selectedAnnouncement.content}
              </Typography>

              {/* Attachments */}
              {selectedAnnouncement.attachments.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Attachments
                  </Typography>
                  <List>
                    {selectedAnnouncement.attachments.map((attachment, index) => (
                      <ListItem key={index}>
                        <ListItemButton onClick={() => downloadAttachment(attachment)}>
                          <ListItemIcon>
                            <School />
                          </ListItemIcon>
                          <ListItemText
                            primary={attachment.originalName}
                            secondary={`${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB`}
                          />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Expiry Notice */}
              {selectedAnnouncement.expiryDate && (
                <Alert 
                  severity={new Date(selectedAnnouncement.expiryDate) > new Date() ? "info" : "warning"}
                  sx={{ mt: 2 }}
                >
                  {new Date(selectedAnnouncement.expiryDate) > new Date() 
                    ? `This announcement expires on ${new Date(selectedAnnouncement.expiryDate).toLocaleDateString()}`
                    : "This announcement has expired"
                  }
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseAnnouncementsPage;
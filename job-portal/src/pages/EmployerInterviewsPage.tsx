import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  useTheme,
  alpha,
  Fade,
  Pagination,
  Tab,
  Tabs,
  LinearProgress,
  Rating
} from '@mui/material';
import {
  Schedule,
  Person,
  Email,
  Phone,
  LocationOn,
  Work,
  VideocamOutlined,
  PersonOutlined,
  PhoneOutlined,
  MoreVert,
  Visibility,
  Edit,
  CheckCircle,
  Cancel,
  AccessTime,
  CalendarToday,
  Assessment,
  Star,
  Add,
  EventNote,
  Feedback,
  PlayCircleOutline
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

interface Interview {
  _id: string;
  candidate: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
  };
  job: {
    _id: string;
    title: string;
    department?: string;
  };
  scheduledDate: string;
  interviewType: 'video' | 'phone' | 'in-person';
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  duration: number; // in minutes
  interviewer: string;
  notes?: string;
  feedback?: {
    rating: number;
    technicalSkills: number;
    communication: number;
    culturalFit: number;
    experience: number;
    comments: string;
    recommendation: 'hire' | 'maybe' | 'reject';
  };
  meetingLink?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

const EmployerInterviewsPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [anchorEls, setAnchorEls] = useState<Record<string, HTMLElement | null>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('scheduled');
  const [feedback, setFeedback] = useState({
    rating: 0,
    technicalSkills: 0,
    communication: 0,
    culturalFit: 0,
    experience: 0,
    comments: '',
    recommendation: 'maybe' as 'hire' | 'maybe' | 'reject'
  });
  const [newInterview, setNewInterview] = useState({
    scheduledDate: dayjs(),
    interviewType: 'video' as 'video' | 'phone' | 'in-person',
    duration: 60,
    interviewer: '',
    notes: ''
  });

  const interviewsPerPage = 8;

  // Mock data for demonstration
  const mockInterviews: Interview[] = [
    {
      _id: '1',
      candidate: {
        _id: 'c1',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@email.com',
        phone: '+1 (555) 123-4567',
      },
      job: {
        _id: 'j1',
        title: 'Frontend Developer',
        department: 'Engineering'
      },
      scheduledDate: '2023-12-15T14:00:00Z',
      interviewType: 'video',
      status: 'scheduled',
      duration: 60,
      interviewer: 'John Smith',
      notes: 'Focus on React and TypeScript experience',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
      createdAt: '2023-12-01T10:00:00Z',
      updatedAt: '2023-12-01T10:00:00Z'
    },
    {
      _id: '2',
      candidate: {
        _id: 'c2',
        firstName: 'Michael',
        lastName: 'Chen',
        email: 'michael.chen@email.com',
        phone: '+1 (555) 234-5678',
      },
      job: {
        _id: 'j2',
        title: 'Full Stack Developer',
        department: 'Engineering'
      },
      scheduledDate: '2023-12-10T16:30:00Z',
      interviewType: 'video',
      status: 'completed',
      duration: 45,
      interviewer: 'Sarah Williams',
      notes: 'Technical round - Django and React assessment',
      meetingLink: 'https://meet.google.com/xyz-uvwx-yz',
      feedback: {
        rating: 4,
        technicalSkills: 4,
        communication: 5,
        culturalFit: 4,
        experience: 3,
        comments: 'Strong technical skills and good communication. Some areas for growth in advanced backend concepts.',
        recommendation: 'hire'
      },
      createdAt: '2023-12-05T09:00:00Z',
      updatedAt: '2023-12-10T17:00:00Z'
    },
    {
      _id: '3',
      candidate: {
        _id: 'c3',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily.davis@email.com',
      },
      job: {
        _id: 'j3',
        title: 'UX Designer',
        department: 'Design'
      },
      scheduledDate: '2023-12-12T11:00:00Z',
      interviewType: 'in-person',
      status: 'completed',
      duration: 90,
      interviewer: 'Mike Johnson',
      location: 'Conference Room A',
      notes: 'Portfolio review and design challenge',
      feedback: {
        rating: 5,
        technicalSkills: 5,
        communication: 5,
        culturalFit: 5,
        experience: 4,
        comments: 'Exceptional portfolio and great design thinking. Perfect fit for our team.',
        recommendation: 'hire'
      },
      createdAt: '2023-12-02T14:00:00Z',
      updatedAt: '2023-12-12T12:30:00Z'
    },
    {
      _id: '4',
      candidate: {
        _id: 'c4',
        firstName: 'David',
        lastName: 'Rodriguez',
        email: 'david.rodriguez@email.com',
      },
      job: {
        _id: 'j4',
        title: 'DevOps Engineer',
        department: 'Infrastructure'
      },
      scheduledDate: '2023-12-08T10:00:00Z',
      interviewType: 'phone',
      status: 'no-show',
      duration: 30,
      interviewer: 'Jennifer Lee',
      notes: 'Initial screening call',
      createdAt: '2023-12-03T16:00:00Z',
      updatedAt: '2023-12-08T10:30:00Z'
    }
  ];

  useEffect(() => {
    fetchInterviews();
  }, [currentPage, activeTab]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      // Using mock data for now
      let filtered = mockInterviews;
      if (activeTab !== 'all') {
        filtered = mockInterviews.filter(interview => interview.status === activeTab);
      }
      setFilteredInterviews(filtered);
      setTotalPages(Math.ceil(filtered.length / interviewsPerPage));
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (interview: Interview) => {
    setSelectedInterview(interview);
    setDetailsDialogOpen(true);
  };

  const handleProvideFeedback = (interview: Interview) => {
    setSelectedInterview(interview);
    if (interview.feedback) {
      setFeedback(interview.feedback);
    } else {
      setFeedback({
        rating: 0,
        technicalSkills: 0,
        communication: 0,
        culturalFit: 0,
        experience: 0,
        comments: '',
        recommendation: 'maybe'
      });
    }
    setFeedbackDialogOpen(true);
  };

  const handleSaveFeedback = async () => {
    if (selectedInterview) {
      // Update the interview with feedback
      setInterviews(prev => prev.map(interview =>
        interview._id === selectedInterview._id
          ? { ...interview, feedback, status: 'completed' as const }
          : interview
      ));
      setFeedbackDialogOpen(false);
    }
  };

  const handleUpdateStatus = async (interviewId: string, newStatus: Interview['status']) => {
    setInterviews(prev => prev.map(interview =>
      interview._id === interviewId
        ? { ...interview, status: newStatus }
        : interview
    ));
  };

  const handleMenuOpen = (interviewId: string, event: React.MouseEvent<HTMLElement>) => {
    setAnchorEls(prev => ({ ...prev, [interviewId]: event.currentTarget }));
  };

  const handleMenuClose = (interviewId: string) => {
    setAnchorEls(prev => ({ ...prev, [interviewId]: null }));
  };

  const formatDateTime = (dateString: string) => {
    return dayjs(dateString).format('MMM DD, YYYY • h:mm A');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'no-show': return 'warning';
      default: return 'default';
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideocamOutlined />;
      case 'phone': return <PhoneOutlined />;
      case 'in-person': return <PersonOutlined />;
      default: return <Schedule />;
    }
  };

  const InterviewCard = ({ interview }: { interview: Interview }) => (
    <Fade in={true}>
      <Card 
        sx={{ 
          height: '100%',
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            transform: 'translateY(-2px)'
          },
          borderLeft: `4px solid ${theme.palette[getStatusColor(interview.status) as keyof typeof theme.palette].main}`
        }}
      >
        <CardHeader
          avatar={
            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
              {interview.candidate.firstName[0]}{interview.candidate.lastName[0]}
            </Avatar>
          }
          action={
            <>
              <IconButton
                onClick={(e) => handleMenuOpen(interview._id, e)}
                size="small"
              >
                <MoreVert />
              </IconButton>
              <Menu
                anchorEl={anchorEls[interview._id]}
                open={Boolean(anchorEls[interview._id])}
                onClose={() => handleMenuClose(interview._id)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem onClick={() => handleViewDetails(interview)}>
                  <Visibility sx={{ mr: 1 }} />
                  View Details
                </MenuItem>
                {interview.status === 'scheduled' && (
                  <>
                    <MenuItem>
                      <Edit sx={{ mr: 1 }} />
                      Edit Interview
                    </MenuItem>
                    <MenuItem onClick={() => handleUpdateStatus(interview._id, 'completed')}>
                      <CheckCircle sx={{ mr: 1 }} />
                      Mark Complete
                    </MenuItem>
                    <MenuItem onClick={() => handleUpdateStatus(interview._id, 'cancelled')}>
                      <Cancel sx={{ mr: 1 }} />
                      Cancel
                    </MenuItem>
                  </>
                )}
                {(interview.status === 'completed' || interview.status === 'scheduled') && (
                  <MenuItem onClick={() => handleProvideFeedback(interview)}>
                    <Assessment sx={{ mr: 1 }} />
                    {interview.feedback ? 'Edit Feedback' : 'Provide Feedback'}
                  </MenuItem>
                )}
              </Menu>
            </>
          }
          title={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6" fontWeight="bold">
                {interview.candidate.firstName} {interview.candidate.lastName}
              </Typography>
              <Chip
                label={interview.status}
                size="small"
                color={getStatusColor(interview.status) as any}
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
          }
          subheader={
            <Box>
              <Typography variant="body2" color="text.secondary">
                {interview.job.title} • {interview.job.department}
              </Typography>
            </Box>
          }
        />
        
        <CardContent sx={{ pt: 0 }}>
          <Stack spacing={2}>
            <Box>
              <Box display="flex" alignItems="center" mb={1}>
                <CalendarToday fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" fontWeight="medium">
                  {formatDateTime(interview.scheduledDate)}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                {getInterviewTypeIcon(interview.interviewType)}
                <Typography variant="body2" sx={{ ml: 0.5, textTransform: 'capitalize' }}>
                  {interview.interviewType} Interview
                </Typography>
                <Chip 
                  label={`${interview.duration} min`} 
                  size="small" 
                  sx={{ ml: 1, fontSize: '0.75rem' }}
                />
              </Box>
              <Box display="flex" alignItems="center">
                <Person fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Interviewer: {interview.interviewer}
                </Typography>
              </Box>
            </Box>

            {interview.meetingLink && (
              <Box>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PlayCircleOutline />}
                  fullWidth
                  onClick={() => window.open(interview.meetingLink, '_blank')}
                >
                  Join Meeting
                </Button>
              </Box>
            )}

            {interview.location && (
              <Box display="flex" alignItems="center">
                <LocationOn fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {interview.location}
                </Typography>
              </Box>
            )}

            {interview.notes && (
              <Box>
                <Typography variant="body2" fontWeight="medium" mb={1}>
                  Notes
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {interview.notes}
                </Typography>
              </Box>
            )}

            {interview.feedback && (
              <Box>
                <Typography variant="body2" fontWeight="medium" mb={1}>
                  Feedback Summary
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Rating value={interview.feedback.rating} readOnly size="small" />
                  <Chip
                    label={interview.feedback.recommendation}
                    size="small"
                    color={
                      interview.feedback.recommendation === 'hire' ? 'success' :
                      interview.feedback.recommendation === 'reject' ? 'error' : 'warning'
                    }
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </Box>
            )}

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleViewDetails(interview)}
                startIcon={<Visibility />}
                fullWidth
              >
                Details
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => handleProvideFeedback(interview)}
                startIcon={<Assessment />}
                fullWidth
                disabled={interview.status === 'cancelled' || interview.status === 'no-show'}
              >
                Feedback
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  );

  // Stats calculation
  const stats = {
    total: interviews.length,
    scheduled: interviews.filter(i => i.status === 'scheduled').length,
    completed: interviews.filter(i => i.status === 'completed').length,
    cancelled: interviews.filter(i => i.status === 'cancelled').length,
    noShow: interviews.filter(i => i.status === 'no-show').length
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Header */}
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                Interview Management
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Schedule, conduct, and track candidate interviews
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setScheduleDialogOpen(true)}
            >
              Schedule Interview
            </Button>
          </Box>
        </Paper>

        {/* Stats Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {stats.scheduled}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Scheduled
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {stats.cancelled}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cancelled
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
            <Paper sx={{ p: 2, textAlign: 'center', borderRadius: 2 }}>
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {stats.noShow}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No Show
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All" value="all" />
            <Tab label="Scheduled" value="scheduled" />
            <Tab label="Completed" value="completed" />
            <Tab label="Cancelled" value="cancelled" />
            <Tab label="No Show" value="no-show" />
          </Tabs>
        </Paper>

        {/* Results */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredInterviews.length > 0 ? (
          <>
            <Grid container spacing={3}>
              {filteredInterviews.map((interview) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={interview._id}>
                  <InterviewCard interview={interview} />
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={4}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No interviews found
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {activeTab === 'all'
                ? "You haven't scheduled any interviews yet."
                : `No ${activeTab} interviews found.`
              }
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setScheduleDialogOpen(true)}
            >
              Schedule Interview
            </Button>
          </Paper>
        )}

        {/* Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedInterview && (
            <>
              <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">
                    Interview Details
                  </Typography>
                  <Chip
                    label={selectedInterview.status}
                    color={getStatusColor(selectedInterview.status) as any}
                    sx={{ textTransform: 'capitalize' }}
                  />
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" gutterBottom>Candidate Information</Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Name:</strong> {selectedInterview.candidate.firstName} {selectedInterview.candidate.lastName}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Email:</strong> {selectedInterview.candidate.email}
                      </Typography>
                      {selectedInterview.candidate.phone && (
                        <Typography variant="body2">
                          <strong>Phone:</strong> {selectedInterview.candidate.phone}
                        </Typography>
                      )}
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="subtitle2" gutterBottom>Interview Details</Typography>
                    <Stack spacing={1}>
                      <Typography variant="body2">
                        <strong>Position:</strong> {selectedInterview.job.title}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Date & Time:</strong> {formatDateTime(selectedInterview.scheduledDate)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Type:</strong> {selectedInterview.interviewType}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Duration:</strong> {selectedInterview.duration} minutes
                      </Typography>
                      <Typography variant="body2">
                        <strong>Interviewer:</strong> {selectedInterview.interviewer}
                      </Typography>
                    </Stack>
                  </Grid>
                  {selectedInterview.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2">{selectedInterview.notes}</Typography>
                      </Paper>
                    </Grid>
                  )}
                  {selectedInterview.feedback && (
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="subtitle2" gutterBottom>Interview Feedback</Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" gutterBottom>
                              <strong>Overall Rating:</strong>
                            </Typography>
                            <Rating value={selectedInterview.feedback.rating} readOnly />
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" gutterBottom>
                              <strong>Recommendation:</strong>
                            </Typography>
                            <Chip
                              label={selectedInterview.feedback.recommendation}
                              color={
                                selectedInterview.feedback.recommendation === 'hire' ? 'success' :
                                selectedInterview.feedback.recommendation === 'reject' ? 'error' : 'warning'
                              }
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </Grid>
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="body2" gutterBottom>
                              <strong>Comments:</strong>
                            </Typography>
                            <Typography variant="body2">
                              {selectedInterview.feedback.comments}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setDetailsDialogOpen(false)}>
                  Close
                </Button>
                {selectedInterview.meetingLink && (
                  <Button
                    variant="outlined"
                    startIcon={<PlayCircleOutline />}
                    onClick={() => window.open(selectedInterview.meetingLink, '_blank')}
                  >
                    Join Meeting
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={() => handleProvideFeedback(selectedInterview)}
                  startIcon={<Assessment />}
                >
                  {selectedInterview.feedback ? 'Edit Feedback' : 'Provide Feedback'}
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Feedback Dialog */}
        <Dialog
          open={feedbackDialogOpen}
          onClose={() => setFeedbackDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Interview Feedback
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <Box>
                <Typography variant="body2" gutterBottom>Overall Rating</Typography>
                <Rating
                  value={feedback.rating}
                  onChange={(_, value) => setFeedback(prev => ({ ...prev, rating: value || 0 }))}
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" gutterBottom>Technical Skills</Typography>
                  <Rating
                    value={feedback.technicalSkills}
                    onChange={(_, value) => setFeedback(prev => ({ ...prev, technicalSkills: value || 0 }))}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" gutterBottom>Communication</Typography>
                  <Rating
                    value={feedback.communication}
                    onChange={(_, value) => setFeedback(prev => ({ ...prev, communication: value || 0 }))}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" gutterBottom>Cultural Fit</Typography>
                  <Rating
                    value={feedback.culturalFit}
                    onChange={(_, value) => setFeedback(prev => ({ ...prev, culturalFit: value || 0 }))}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body2" gutterBottom>Experience</Typography>
                  <Rating
                    value={feedback.experience}
                    onChange={(_, value) => setFeedback(prev => ({ ...prev, experience: value || 0 }))}
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth>
                <InputLabel>Recommendation</InputLabel>
                <Select
                  value={feedback.recommendation}
                  onChange={(e) => setFeedback(prev => ({ ...prev, recommendation: e.target.value as any }))}
                  label="Recommendation"
                >
                  <MenuItem value="hire">Hire</MenuItem>
                  <MenuItem value="maybe">Maybe</MenuItem>
                  <MenuItem value="reject">Reject</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Comments"
                multiline
                rows={4}
                value={feedback.comments}
                onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}
                placeholder="Share your thoughts about the candidate's performance..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFeedbackDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained" onClick={handleSaveFeedback}>
              Save Feedback
            </Button>
          </DialogActions>
        </Dialog>

        {/* Schedule Interview Dialog */}
        <Dialog
          open={scheduleDialogOpen}
          onClose={() => setScheduleDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Schedule New Interview
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              <DateTimePicker
                label="Date & Time"
                value={newInterview.scheduledDate}
                onChange={(date) => setNewInterview(prev => ({ ...prev, scheduledDate: date || dayjs() }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
              
              <FormControl fullWidth>
                <InputLabel>Interview Type</InputLabel>
                <Select
                  value={newInterview.interviewType}
                  onChange={(e) => setNewInterview(prev => ({ ...prev, interviewType: e.target.value as any }))}
                  label="Interview Type"
                >
                  <MenuItem value="video">Video Call</MenuItem>
                  <MenuItem value="phone">Phone Call</MenuItem>
                  <MenuItem value="in-person">In Person</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={newInterview.duration}
                onChange={(e) => setNewInterview(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
              />

              <TextField
                fullWidth
                label="Interviewer"
                value={newInterview.interviewer}
                onChange={(e) => setNewInterview(prev => ({ ...prev, interviewer: e.target.value }))}
              />

              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={newInterview.notes}
                onChange={(e) => setNewInterview(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes or special instructions..."
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="contained">
              Schedule Interview
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default EmployerInterviewsPage;
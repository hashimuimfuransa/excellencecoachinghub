import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  Avatar,
  Rating,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  Paper,
  Badge,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import {
  VideoCall,
  Psychology,
  Schedule,
  Person,
  Work,
  Assessment,
  PlayArrow,
  Stop,
  Pause,
  Visibility,
  Edit,
  Delete,
  MoreVert,
  Add,
  FilterList,
  Search,
  Download,
  Refresh,
  CheckCircle,
  Warning,
  Error,
  Info,
  TrendingUp,
  TrendingDown,
  Timer,
  Star,
  QuestionAnswer,
  Mic,
  MicOff,
  Videocam,
  VideocamOff,
  RecordVoiceOver,
  SmartToy,
  Analytics,
  Report,
  Share,
  PendingActions,
  Approval,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { superAdminService } from '../../services/superAdminService';
import type { AIInterview } from '../../types/common';

interface InterviewStats {
  totalInterviews: number;
  completedInterviews: number;
  scheduledInterviews: number;
  inProgressInterviews: number;
  averageScore: number;
  averageDuration: number;
  passRate: number;
  topPerformers: Array<{ name: string; score: number; jobTitle: string }>;
}

interface InterviewFilters {
  search: string;
  status: string;
  jobTitle: string;
  dateRange: string;
  scoreRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CreateInterviewDialog {
  open: boolean;
  jobId: string;
  candidateId: string;
  scheduledAt: string;
  questions: string[];
}

const AIInterviewManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(1); // Start with Pending Requests tab
  const [interviews, setInterviews] = useState<AIInterview[]>([]);
  const [interviewRequests, setInterviewRequests] = useState<any[]>([]);
  const [approvedRequests, setApprovedRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInterview, setSelectedInterview] = useState<AIInterview | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState<CreateInterviewDialog>({
    open: false,
    jobId: '',
    candidateId: '',
    scheduledAt: '',
    questions: []
  });

  const [stats, setStats] = useState<InterviewStats>({
    totalInterviews: 0,
    completedInterviews: 0,
    scheduledInterviews: 0,
    inProgressInterviews: 0,
    averageScore: 0,
    averageDuration: 0,
    passRate: 0,
    topPerformers: []
  });

  const [filters, setFilters] = useState<InterviewFilters>({
    search: '',
    status: '',
    jobTitle: '',
    dateRange: '',
    scoreRange: '',
    sortBy: 'scheduledAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    const initializePage = async () => {
      if (activeTab === 0) {
        await loadInterviews();
        await loadStats();
      } else if (activeTab === 1) {
        await loadInterviewRequests();
        setLoading(false); // Set main loading to false after requests are loaded
      } else if (activeTab === 2) {
        await loadApprovedRequests();
        setLoading(false); // Set main loading to false after approved requests are loaded
      }
    };
    
    initializePage();
  }, [page, rowsPerPage, filters, activeTab]);

  const loadInterviews = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await superAdminService.getAllInterviews({
        page: page + 1,
        limit: rowsPerPage,
        search: filters.search || undefined,
        status: filters.status || undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      console.log('🔍 AIInterviewManagementPage: Raw API response:', response);

      // Handle different possible response structures
      let interviewsData: AIInterview[] = [];
      let totalCount = 0;

      if (response) {
        // Check if response has interviews directly
        if (response.interviews && Array.isArray(response.interviews)) {
          interviewsData = response.interviews;
          totalCount = response.total || response.interviews.length;
        }
        // Check if response has data.interviews structure
        else if (response.data && response.data.interviews && Array.isArray(response.data.interviews)) {
          interviewsData = response.data.interviews;
          totalCount = response.data.total || response.data.interviews.length;
        }
        // Check if response is directly an array
        else if (Array.isArray(response)) {
          interviewsData = response;
          totalCount = response.length;
        }
        // Check if response has success and data structure
        else if (response.success && response.data) {
          if (Array.isArray(response.data)) {
            interviewsData = response.data;
            totalCount = response.data.length;
          } else if (response.data.interviews) {
            interviewsData = response.data.interviews;
            totalCount = response.data.total || response.data.interviews.length;
          }
        }
      }

      console.log('🔍 AIInterviewManagementPage: Extracted interviews data:', interviewsData);
      console.log('🔍 AIInterviewManagementPage: Total count:', totalCount);
      
      setInterviews(interviewsData);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error loading interviews:', err);
      setError('Failed to load interviews');
      // Use enhanced fallback data
      const fallbackInterviews: AIInterview[] = [
        {
          id: '1',
          jobId: 'job-1',
          candidateId: 'user-1',
          candidateName: 'John Doe',
          jobTitle: 'Senior React Developer',
          status: 'completed',
          score: 8.5,
          feedback: 'Excellent technical knowledge and communication skills. Strong problem-solving abilities demonstrated through coding challenges.',
          questions: [
            {
              id: 'q1',
              question: 'Explain React hooks and their benefits over class components',
              candidateAnswer: 'React hooks allow functional components to have state and lifecycle methods. They provide better code reusability, easier testing, and cleaner component logic...',
              aiScore: 9,
              aiComment: 'Comprehensive understanding demonstrated with practical examples'
            },
            {
              id: 'q2', 
              question: 'How would you optimize a React application for performance?',
              candidateAnswer: 'I would use React.memo, useCallback, useMemo for performance optimization. Also implement code splitting with lazy loading...',
              aiScore: 8,
              aiComment: 'Good knowledge of optimization techniques with specific examples'
            },
            {
              id: 'q3',
              question: 'Describe your experience with state management in React',
              candidateAnswer: 'I have worked with Redux, Context API, and Zustand. Each has its use cases depending on application complexity...',
              aiScore: 8.5,
              aiComment: 'Well-rounded experience with multiple state management solutions'
            }
          ],
          duration: 45,
          scheduledAt: new Date('2024-01-20T10:00:00Z').toISOString(),
          completedAt: new Date('2024-01-20T10:45:00Z').toISOString(),
          createdAt: new Date('2024-01-19T15:00:00Z').toISOString()
        },
        {
          id: '2',
          jobId: 'job-2',
          candidateId: 'user-2',
          candidateName: 'Sarah Wilson',
          jobTitle: 'Frontend Developer',
          status: 'in_progress',
          score: null,
          feedback: null,
          questions: [
            {
              id: 'q1',
              question: 'What is your experience with CSS frameworks?',
              candidateAnswer: 'Currently answering...',
              aiScore: null,
              aiComment: null
            }
          ],
          duration: null,
          scheduledAt: new Date('2024-01-21T14:00:00Z').toISOString(),
          completedAt: null,
          createdAt: new Date('2024-01-20T09:00:00Z').toISOString()
        },
        {
          id: '3',
          jobId: 'job-3',
          candidateId: 'user-3',
          candidateName: 'Mike Johnson',
          jobTitle: 'Full Stack Developer',
          status: 'scheduled',
          score: null,
          feedback: null,
          questions: [],
          duration: null,
          scheduledAt: new Date('2024-01-22T16:00:00Z').toISOString(),
          completedAt: null,
          createdAt: new Date('2024-01-21T11:00:00Z').toISOString()
        },
        {
          id: '4',
          jobId: 'job-4',
          candidateId: 'user-4',
          candidateName: 'Emily Chen',
          jobTitle: 'UI/UX Designer',
          status: 'completed',
          score: 7.8,
          feedback: 'Strong design thinking and user experience knowledge. Good understanding of design systems and accessibility.',
          questions: [
            {
              id: 'q1',
              question: 'How do you approach user research in your design process?',
              candidateAnswer: 'I start with user interviews and surveys to understand pain points, then create personas and user journey maps...',
              aiScore: 8,
              aiComment: 'Systematic approach to user research with clear methodology'
            },
            {
              id: 'q2',
              question: 'Explain the importance of accessibility in web design',
              candidateAnswer: 'Accessibility ensures that websites are usable by people with disabilities. I follow WCAG guidelines and test with screen readers...',
              aiScore: 7.5,
              aiComment: 'Good awareness of accessibility principles and practical implementation'
            }
          ],
          duration: 38,
          scheduledAt: new Date('2024-01-18T11:00:00Z').toISOString(),
          completedAt: new Date('2024-01-18T11:38:00Z').toISOString(),
          createdAt: new Date('2024-01-17T14:00:00Z').toISOString()
        }
      ];
      
      setInterviews(fallbackInterviews);
      setTotal(fallbackInterviews.length);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Calculate stats from interviews data
      const completed = interviews.filter(i => i.status === 'completed');
      const scheduled = interviews.filter(i => i.status === 'scheduled');
      const inProgress = interviews.filter(i => i.status === 'in_progress');
      
      const avgScore = completed.length > 0 
        ? completed.reduce((sum, i) => sum + (i.score || 0), 0) / completed.length 
        : 0;
      
      const avgDuration = completed.length > 0
        ? completed.reduce((sum, i) => sum + (i.duration || 0), 0) / completed.length
        : 0;

      const passRate = completed.length > 0
        ? (completed.filter(i => (i.score || 0) >= 7).length / completed.length) * 100
        : 0;

      setStats({
        totalInterviews: interviews.length,
        completedInterviews: completed.length,
        scheduledInterviews: scheduled.length,
        inProgressInterviews: inProgress.length,
        averageScore: avgScore,
        averageDuration: avgDuration,
        passRate: passRate,
        topPerformers: completed
          .sort((a, b) => (b.score || 0) - (a.score || 0))
          .slice(0, 5)
          .map(i => ({
            name: i.candidateName,
            score: i.score || 0,
            jobTitle: i.jobTitle
          }))
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadInterviewRequests = async () => {
    console.log('🔍 Loading interview requests...');
    console.log('🌐 API URL:', import.meta.env.VITE_API_URL);
    console.log('🔑 Token exists:', !!localStorage.getItem('token'));
    
    setRequestsLoading(true);
    
    // Now using real API calls
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test-requests/pending`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Raw test-requests response:', result);
        console.log('📊 Total requests found:', result.success ? result.data?.length || 0 : 0);
        
        // Log all request types for debugging
        if (result.success && result.data) {
          console.log('🔍 Request types breakdown:', result.data.map((req: any) => ({
            id: req._id,
            type: req.requestType,
            status: req.status,
            user: req.user?.firstName + ' ' + req.user?.lastName,
            job: req.job?.title
          })));
        }
        
        // Filter for interview requests only
        const filteredRequests = (result.success ? result.data : []).filter((req: any) => 
          req.requestType === 'interview' || req.requestType === 'both'
        );
        
        console.log('🎯 Filtered interview requests:', filteredRequests);
        console.log('📊 Interview requests count:', filteredRequests.length);
        setInterviewRequests(filteredRequests);
      } else {
        console.log('❌ API call failed, status:', response.status);
        const errorText = await response.text();
        console.log('📋 Error response body:', errorText);
        setInterviewRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading interview requests:', error);
      if (error.name === 'AbortError') {
        console.error('⏰ Request timed out after 10 seconds');
      }
      // Set empty requests on error
      setInterviewRequests([]);
    } finally {
      setRequestsLoading(false);
    }
  };

  const loadApprovedRequests = async () => {
    setApprovedLoading(true);
    
    try {
      console.log('🔄 Loading approved interview requests...');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test-requests/approved`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Approved requests response:', result);
        
        // Filter for interview requests only
        const filteredRequests = (result.success ? result.data : []).filter((req: any) => 
          req.requestType === 'interview' || req.requestType === 'both'
        );
        
        console.log('🎯 Approved interview requests:', filteredRequests);
        setApprovedRequests(filteredRequests);
      } else {
        console.log('❌ Approved requests API call failed, status:', response.status);
        setApprovedRequests([]);
      }
    } catch (error) {
      console.error('❌ Error loading approved requests:', error);
      setApprovedRequests([]);
    } finally {
      setApprovedLoading(false);
    }
  };

  const handleInterviewRequestAction = async (requestId: string, action: 'approve' | 'reject', notes?: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/test-requests/${requestId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected',
          rejectionReason: notes
        })
      });

      if (response.ok) {
        // Remove the request from the pending list
        setInterviewRequests(prev => prev.filter(req => req._id !== requestId));
        
        if (action === 'approve') {
          // Generate the interview setup
          await fetch(`${import.meta.env.VITE_API_URL}/test-requests/${requestId}/generate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          // Refresh approved requests to show the newly approved one
          loadApprovedRequests();
        }
      }
    } catch (error) {
      console.error('Error handling interview request action:', error);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key: keyof InterviewFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'scheduled': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'in_progress': return <PlayArrow />;
      case 'scheduled': return <Schedule />;
      case 'cancelled': return <Error />;
      default: return <Info />;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend > 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={trend > 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(trend)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading AI Interview Management...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 2,
        p: 3,
        color: 'white'
      }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          <VideoCall sx={{ mr: 2, verticalAlign: 'middle', fontSize: 'inherit' }} />
          AI Interview Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
          Manage AI-powered interviews • Real-time monitoring and analytics
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`${stats.totalInterviews} Total Interviews`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
          <Chip 
            label={`${stats.completedInterviews} Completed`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
          <Chip 
            label={`${stats.averageScore.toFixed(1)} Avg Score`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
          <Chip 
            label={`${stats.passRate.toFixed(1)}% Pass Rate`} 
            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }}
          />
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Interviews"
            value={stats.totalInterviews}
            icon={<VideoCall />}
            color="primary"
            trend={12}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Completed"
            value={stats.completedInterviews}
            icon={<CheckCircle />}
            color="success"
            trend={8}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Average Score"
            value={stats.averageScore.toFixed(1)}
            icon={<Star />}
            color="warning"
            trend={-2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pass Rate"
            value={`${stats.passRate.toFixed(1)}%`}
            icon={<TrendingUp />}
            color="info"
            trend={5}
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<VideoCall />} 
            label="Interview Management" 
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
          <Tab 
            icon={
              <Badge badgeContent={interviewRequests.length} color="error" max={99}>
                <PendingActions />
              </Badge>
            } 
            label="Pending Requests" 
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
          <Tab 
            icon={
              <Badge badgeContent={approvedRequests.length} color="success" max={99}>
                <Approval />
              </Badge>
            } 
            label="Approved Requests" 
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      {activeTab === 0 && (
        <>
          {/* Filters and Actions */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search interviews..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Job Title</InputLabel>
                <Select
                  value={filters.jobTitle}
                  label="Job Title"
                  onChange={(e) => handleFilterChange('jobTitle', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="developer">Developer</MenuItem>
                  <MenuItem value="designer">Designer</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Score Range</InputLabel>
                <Select
                  value={filters.scoreRange}
                  label="Score Range"
                  onChange={(e) => handleFilterChange('scoreRange', e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="9-10">Excellent (9-10)</MenuItem>
                  <MenuItem value="7-8">Good (7-8)</MenuItem>
                  <MenuItem value="5-6">Average (5-6)</MenuItem>
                  <MenuItem value="0-4">Poor (0-4)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setCreateDialog({ ...createDialog, open: true })}
                >
                  Schedule Interview
                </Button>
                <IconButton onClick={() => loadInterviews()}>
                  <Refresh />
                </IconButton>
                <IconButton>
                  <Download />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Interviews Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {interviews.map((interview) => (
                  <TableRow key={interview.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {interview.candidateName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2">
                            {interview.candidateName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {interview.candidateId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {interview.jobTitle}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(interview.status)}
                        label={interview.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(interview.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {interview.score ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating
                            value={interview.score / 2}
                            precision={0.1}
                            size="small"
                            readOnly
                          />
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {interview.score.toFixed(1)}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          N/A
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(interview.duration)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(interview.scheduledAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedInterview(interview);
                              setDetailDialog(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {interview.status === 'scheduled' && (
                          <Tooltip title="Start Interview">
                            <IconButton size="small" color="success">
                              <PlayArrow />
                            </IconButton>
                          </Tooltip>
                        )}
                        {interview.status === 'in_progress' && (
                          <Tooltip title="Monitor Interview">
                            <IconButton size="small" color="warning">
                              <Videocam />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="More Actions">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              setAnchorEl(e.currentTarget);
                              setSelectedInterview(interview);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

        </>
      )}

      {/* Tab 2: Interview Requests */}
      {activeTab === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Pending Interview Requests ({interviewRequests.length})
              </Typography>
              <Button
                startIcon={<Refresh />}
                onClick={loadInterviewRequests}
                disabled={requestsLoading}
              >
                Refresh
              </Button>
            </Box>

            {requestsLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Loading interview requests...
                </Typography>
              </Box>
            ) : interviewRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <PendingActions sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Pending Requests
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All interview requests have been processed.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {interviewRequests.map((request) => (
                  <Grid item xs={12} md={6} lg={4} key={request._id}>
                    <Card 
                      variant="outlined"
                      sx={{ 
                        height: '100%',
                        position: 'relative',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 2
                        }
                      }}
                    >
                      {/* Priority Badge */}
                      <Chip
                        label={request.priority.toUpperCase()}
                        color={request.priority === 'high' ? 'error' : request.priority === 'normal' ? 'warning' : 'default'}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 1
                        }}
                      />

                      <CardContent sx={{ pb: 1 }}>
                        <Stack spacing={2}>
                          {/* Header */}
                          <Box>
                            <Typography variant="h6" sx={{ pr: 8 }}>
                              {request.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {request.description}
                            </Typography>
                          </Box>

                          {/* User Info */}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'secondary.main' }}>
                              <VideoCall />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {request.user.firstName} {request.user.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.user.email}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Job Info */}
                          {request.job && (
                            <Box sx={{ bgcolor: 'grey.50', p: 1.5, borderRadius: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Work sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="subtitle2">
                                  {request.job.title}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {request.job.company}
                              </Typography>
                            </Box>
                          )}

                          {/* Interview Specifications */}
                          {request.specifications && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Interview Specifications
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                <Chip 
                                  size="small" 
                                  label={request.specifications.interviewType} 
                                  color="info"
                                />
                                <Chip 
                                  size="small" 
                                  label={`${request.specifications.duration}min`} 
                                  variant="outlined"
                                />
                                <Chip 
                                  size="small" 
                                  label={`${request.specifications.questionCount}Q`} 
                                  variant="outlined"
                                />
                                <Chip 
                                  size="small" 
                                  label={request.specifications.difficulty} 
                                  color={
                                    request.specifications.difficulty === 'hard' ? 'error' :
                                    request.specifications.difficulty === 'medium' ? 'warning' : 'success'
                                  }
                                />
                              </Stack>
                              {request.specifications.focusAreas && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Focus Areas:
                                  </Typography>
                                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                    {request.specifications.focusAreas.map((area: string) => (
                                      <Chip 
                                        key={area}
                                        size="small" 
                                        label={area}
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem', height: '20px' }}
                                      />
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* Requested Date */}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              Requested {new Date(request.requestedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>

                      {/* Actions */}
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            startIcon={<Approval />}
                            onClick={() => handleInterviewRequestAction(request._id, 'approve')}
                            sx={{ flex: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<Delete />}
                            onClick={() => handleInterviewRequestAction(request._id, 'reject')}
                            sx={{ flex: 1 }}
                          >
                            Reject
                          </Button>
                        </Stack>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: Approved Requests */}
      {activeTab === 2 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6">
                Approved Interview Requests ({approvedRequests.length})
              </Typography>
              <Button
                startIcon={<Refresh />}
                onClick={loadApprovedRequests}
                disabled={approvedLoading}
              >
                Refresh
              </Button>
            </Box>

            {approvedLoading ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Loading approved requests...
                </Typography>
              </Box>
            ) : approvedRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Approved Requests
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Approved interview requests will appear here.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {approvedRequests.map((request) => (
                  <Grid item xs={12} md={6} lg={4} key={request._id}>
                    <Card 
                      variant="outlined"
                      sx={{ 
                        height: '100%',
                        position: 'relative',
                        borderColor: 'success.main',
                        borderWidth: 2,
                        '&:hover': {
                          boxShadow: 2
                        }
                      }}
                    >
                      {/* Status Badge */}
                      <Chip
                        label="APPROVED"
                        color="success"
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          right: 12,
                          zIndex: 1
                        }}
                      />

                      <CardContent sx={{ pb: 1 }}>
                        <Stack spacing={2}>
                          {/* Header */}
                          <Box>
                            <Typography variant="h6" sx={{ pr: 8 }}>
                              {request.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {request.description}
                            </Typography>
                          </Box>

                          {/* User Info */}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'success.main' }}>
                              <VideoCall />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2">
                                {request.user.firstName} {request.user.lastName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.user.email}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Job Info */}
                          {request.job && (
                            <Box sx={{ bgcolor: 'success.50', p: 1.5, borderRadius: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Work sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                <Typography variant="subtitle2">
                                  {request.job.title}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {request.job.company}
                              </Typography>
                            </Box>
                          )}

                          {/* Interview Specifications */}
                          {request.specifications && (
                            <Box>
                              <Typography variant="subtitle2" gutterBottom>
                                Interview Specifications
                              </Typography>
                              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                                <Chip 
                                  size="small" 
                                  label={request.specifications.interviewType} 
                                  color="info"
                                />
                                <Chip 
                                  size="small" 
                                  label={`${request.specifications.duration}min`} 
                                  variant="outlined"
                                />
                                <Chip 
                                  size="small" 
                                  label={`${request.specifications.questionCount}Q`} 
                                  variant="outlined"
                                />
                                <Chip 
                                  size="small" 
                                  label={request.specifications.difficulty} 
                                  color="success"
                                />
                              </Stack>
                              {request.specifications.focusAreas && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Focus Areas:
                                  </Typography>
                                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                    {request.specifications.focusAreas.map((area: string) => (
                                      <Chip 
                                        key={area}
                                        size="small" 
                                        label={area}
                                        variant="outlined"
                                        sx={{ fontSize: '0.7rem', height: '20px' }}
                                      />
                                    ))}
                                  </Stack>
                                </Box>
                              )}
                            </Box>
                          )}

                          {/* Approval Info */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CheckCircle sx={{ fontSize: 16, mr: 0.5, color: 'success.main' }} />
                              <Typography variant="caption" color="success.main">
                                Approved {new Date(request.approvedAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            {request.approvedBy && (
                              <Typography variant="caption" color="text.secondary">
                                By: {request.approvedBy.firstName} {request.approvedBy.lastName}
                              </Typography>
                            )}
                          </Box>

                          {/* Requested Date */}
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary">
                              Originally requested {new Date(request.requestedAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><Edit /></ListItemIcon>
          <ListItemText>Edit Interview</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><Report /></ListItemIcon>
          <ListItemText>Generate Report</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><Share /></ListItemIcon>
          <ListItemText>Share Results</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: 'error.main' }}>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete Interview</ListItemText>
        </MenuItem>
      </Menu>

      {/* Interview Detail Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Interview Details - {selectedInterview?.candidateName}
        </DialogTitle>
        <DialogContent>
          {selectedInterview && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2">Job Title</Typography>
                      <Typography variant="body2">{selectedInterview.jobTitle}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Status</Typography>
                      <Chip
                        label={selectedInterview.status.replace('_', ' ').toUpperCase()}
                        color={getStatusColor(selectedInterview.status) as any}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2">Scheduled At</Typography>
                      <Typography variant="body2">{formatDate(selectedInterview.scheduledAt)}</Typography>
                    </Box>
                    {selectedInterview.completedAt && (
                      <Box>
                        <Typography variant="subtitle2">Completed At</Typography>
                        <Typography variant="body2">{formatDate(selectedInterview.completedAt)}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Performance
                  </Typography>
                  <Stack spacing={2}>
                    {selectedInterview.score && (
                      <Box>
                        <Typography variant="subtitle2">Overall Score</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Rating
                            value={selectedInterview.score / 2}
                            precision={0.1}
                            readOnly
                          />
                          <Typography variant="h6" sx={{ ml: 1 }}>
                            {selectedInterview.score.toFixed(1)}/10
                          </Typography>
                        </Box>
                      </Box>
                    )}
                    <Box>
                      <Typography variant="subtitle2">Duration</Typography>
                      <Typography variant="body2">{formatDuration(selectedInterview.duration)}</Typography>
                    </Box>
                    {selectedInterview.feedback && (
                      <Box>
                        <Typography variant="subtitle2">AI Feedback</Typography>
                        <Typography variant="body2">{selectedInterview.feedback}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>
              </Grid>

              {selectedInterview.questions && selectedInterview.questions.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Interview Questions & Responses
                  </Typography>
                  <Stack spacing={2}>
                    {selectedInterview.questions.map((q, index) => (
                      <Paper key={q.id} sx={{ p: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Question {index + 1}: {q.question}
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Answer:</strong> {q.candidateAnswer}
                        </Typography>
                        {q.aiScore && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Rating value={q.aiScore / 2} precision={0.1} size="small" readOnly />
                            <Typography variant="caption">
                              Score: {q.aiScore}/10
                            </Typography>
                          </Box>
                        )}
                        {q.aiComment && (
                          <Typography variant="caption" color="text.secondary">
                            AI Comment: {q.aiComment}
                          </Typography>
                        )}
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<Download />}>
            Export Report
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AIInterviewManagementPage;
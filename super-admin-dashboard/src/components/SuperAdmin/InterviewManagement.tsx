import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
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
  Button,
  IconButton,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  LinearProgress,
  Paper,
  Stack,
  Badge,
  Rating
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  PlayArrow,
  Stop,
  Delete,
  MoreVert,
  Download,
  Schedule,
  Person,
  Work,
  Assessment,
  VideoCall,
  Refresh,
  Add,
  CheckCircle,
  Warning,
  Error,
  Info,
  PlaylistPlay
} from '@mui/icons-material';
import { superAdminService } from '../../services/superAdminService';
import type { AIInterview } from '../../types/common';

interface InterviewFilters {
  search: string;
  status: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface InterviewStats {
  totalInterviews: number;
  completedInterviews: number;
  scheduledInterviews: number;
  inProgressInterviews: number;
  averageScore: number;
  completionRate: number;
}

const InterviewManagement: React.FC = () => {
  const [interviews, setInterviews] = useState<AIInterview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInterview, setSelectedInterview] = useState<AIInterview | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [stats, setStats] = useState<InterviewStats>({
    totalInterviews: 0,
    completedInterviews: 0,
    scheduledInterviews: 0,
    inProgressInterviews: 0,
    averageScore: 0,
    completionRate: 0
  });

  const [filters, setFilters] = useState<InterviewFilters>({
    search: '',
    status: '',
    dateRange: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  useEffect(() => {
    loadInterviews();
    loadStats();
  }, [page, rowsPerPage, filters]);

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

      console.log('🔍 InterviewManagement: Raw API response:', response);

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

      console.log('🔍 InterviewManagement: Extracted interviews data:', interviewsData);
      console.log('🔍 InterviewManagement: Total count:', totalCount);
      
      setInterviews(interviewsData);
      setTotal(totalCount);
    } catch (err) {
      console.error('Error loading interviews:', err);
      setError('Failed to load interviews');
      // Use fallback data
      const fallbackInterviews: AIInterview[] = [
        {
          id: '1',
          jobId: 'job-1',
          candidateId: 'user-1',
          candidateName: 'John Doe',
          jobTitle: 'Senior React Developer',
          status: 'completed',
          score: 8.5,
          feedback: 'Excellent technical knowledge and communication skills. Strong problem-solving abilities.',
          questions: [
            {
              id: 'q1',
              question: 'Explain React hooks and their benefits',
              candidateAnswer: 'React hooks allow functional components to have state and lifecycle methods...',
              aiScore: 9,
              aiComment: 'Comprehensive understanding demonstrated'
            },
            {
              id: 'q2', 
              question: 'How would you optimize a React application?',
              candidateAnswer: 'I would use React.memo, useCallback, useMemo for performance optimization...',
              aiScore: 8,
              aiComment: 'Good knowledge of optimization techniques'
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
          questions: [],
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
        }
      ];
      
      setInterviews(fallbackInterviews);
      setTotal(fallbackInterviews.length);
    } finally {
      setLoading(false);
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

  const handleViewInterview = (interview: AIInterview) => {
    setSelectedInterview(interview);
    setDetailDialog(true);
    setAnchorEl(null);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="bold">
          AI Interview Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={loadInterviews}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                placeholder="Search interviews..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
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
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  label="Date Range"
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                >
                  <MenuItem value="">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={filters.sortBy}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="createdAt">Created Date</MenuItem>
                  <MenuItem value="scheduledAt">Scheduled Date</MenuItem>
                  <MenuItem value="score">Score</MenuItem>
                  <MenuItem value="candidateName">Candidate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Interviews Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {loading && <LinearProgress />}
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Candidate</TableCell>
                  <TableCell>Job Position</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Scheduled</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {interviews.map((interview) => (
                  <TableRow key={interview.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar>
                          <Person />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {interview.candidateName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {interview.candidateId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {interview.jobTitle}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Job ID: {interview.jobId}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Rating value={interview.score / 2} readOnly size="small" />
                          <Typography variant="body2" fontWeight="medium">
                            {interview.score}/10
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Pending
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDateTime(interview.scheduledAt)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(interview.duration)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewInterview(interview)}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
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
                    </TableCell>
                  </TableRow>
                ))}
                {interviews.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No interviews found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </CardContent>
      </Card>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleViewInterview(selectedInterview!)}>
          <ListItemIcon><Visibility /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        {selectedInterview?.status === 'completed' && (
          <MenuItem>
            <ListItemIcon><Download /></ListItemIcon>
            <ListItemText>Download Report</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem>
          <ListItemIcon><Delete color="error" /></ListItemIcon>
          <ListItemText>Delete Interview</ListItemText>
        </MenuItem>
      </Menu>

      {/* Interview Details Dialog */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Interview Details</Typography>
            <IconButton onClick={() => setDetailDialog(false)}>
              <MoreVert />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedInterview && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Basic Info */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Interview Information
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Candidate</Typography>
                        <Typography variant="body1">{selectedInterview.candidateName}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Job Position</Typography>
                        <Typography variant="body1">{selectedInterview.jobTitle}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Status</Typography>
                        <Chip
                          label={selectedInterview.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(selectedInterview.status) as any}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Duration</Typography>
                        <Typography variant="body1">{formatDuration(selectedInterview.duration)}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Score & Feedback */}
                {selectedInterview.score && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Assessment Results
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Overall Score</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Rating value={selectedInterview.score / 2} readOnly />
                          <Typography variant="h6">{selectedInterview.score}/10</Typography>
                        </Box>
                      </Box>
                      {selectedInterview.feedback && (
                        <Box>
                          <Typography variant="body2" color="text.secondary">AI Feedback</Typography>
                          <Typography variant="body1">{selectedInterview.feedback}</Typography>
                        </Box>
                      )}
                    </Paper>
                  </Grid>
                )}

                {/* Questions & Answers */}
                {selectedInterview.questions && selectedInterview.questions.length > 0 && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                        Questions & Answers
                      </Typography>
                      <Stack spacing={2}>
                        {selectedInterview.questions.map((qa, index) => (
                          <Box key={qa.id} sx={{ borderLeft: 2, borderColor: 'primary.light', pl: 2 }}>
                            <Typography variant="body2" fontWeight="medium" gutterBottom>
                              Q{index + 1}: {qa.question}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
                              Answer: {qa.candidateAnswer}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Rating value={qa.aiScore / 2} readOnly size="small" />
                              <Typography variant="caption">
                                {qa.aiScore}/10 - {qa.aiComment}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          {selectedInterview?.status === 'completed' && (
            <Button variant="contained" startIcon={<Download />}>
              Export Report
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InterviewManagement;
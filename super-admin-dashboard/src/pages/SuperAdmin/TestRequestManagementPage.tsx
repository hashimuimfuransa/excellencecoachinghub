import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  Chip, 
  Box, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  PlayArrow as GenerateIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { green, red, orange, blue } from '@mui/material/colors';
import { apiService } from '../../services/apiService';

interface TestRequest {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  job: {
    _id: string;
    title: string;
    company: string;
  };
  requestType: 'psychometric_test' | 'interview' | 'both';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  priority: 'normal' | 'high' | 'urgent';
  notes?: string;
  psychometricTest?: {
    testId: string;
    generatedAt: string;
    isGenerated: boolean;
  };
  interview?: {
    interviewId: string;
    generatedAt: string;
    isGenerated: boolean;
  };
}

interface RequestDialogData {
  request: TestRequest;
  action: 'approve' | 'reject' | 'generate' | 'view';
}

const TestRequestManagementPage: React.FC = () => {
  const [requests, setRequests] = useState<TestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<RequestDialogData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.get('/test-requests/pending');
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to fetch test requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return orange[500];
      case 'approved':
        return green[500];
      case 'rejected':
        return red[500];
      case 'completed':
        return blue[500];
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return red[500];
      case 'high':
        return orange[500];
      case 'normal':
        return green[500];
      default:
        return 'default';
    }
  };

  const formatRequestType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleAction = (request: TestRequest, action: 'approve' | 'reject' | 'generate' | 'view') => {
    setDialogData({ request, action });
    setDialogOpen(true);
    setRejectionReason('');
  };

  const handleConfirmAction = async () => {
    if (!dialogData) return;

    const { request, action } = dialogData;

    try {
      if (action === 'approve') {
        await apiService.put(`/test-requests/${request._id}/status`, {
          status: 'approved'
        });
      } else if (action === 'reject') {
        if (!rejectionReason.trim()) {
          setError('Rejection reason is required');
          return;
        }
        await apiService.put(`/test-requests/${request._id}/status`, {
          status: 'rejected',
          rejectionReason
        });
      } else if (action === 'generate') {
        await apiService.post(`/test-requests/${request._id}/generate`);
      }

      setDialogOpen(false);
      setDialogData(null);
      await fetchPendingRequests();
    } catch (error: any) {
      setError(error.response?.data?.error || `Failed to ${action} request`);
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filterType && request.requestType !== filterType) return false;
    if (filterPriority && request.priority !== filterPriority) return false;
    return true;
  });

  const renderDialog = () => {
    if (!dialogData) return null;

    const { request, action } = dialogData;

    const getDialogTitle = () => {
      switch (action) {
        case 'approve':
          return 'Approve Test Request';
        case 'reject':
          return 'Reject Test Request';
        case 'generate':
          return 'Generate Tests';
        case 'view':
          return 'Request Details';
        default:
          return 'Test Request';
      }
    };

    return (
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          <Box mb={2}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  User
                </Typography>
                <Typography variant="body1">
                  {request.user.firstName} {request.user.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {request.user.email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Job
                </Typography>
                <Typography variant="body1">
                  {request.job.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {request.job.company}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Request Type
                </Typography>
                <Typography variant="body1">
                  {formatRequestType(request.requestType)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">
                  Priority
                </Typography>
                <Chip 
                  label={request.priority.toUpperCase()} 
                  size="small"
                  sx={{ backgroundColor: getPriorityColor(request.priority), color: 'white' }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">
                  Requested At
                </Typography>
                <Typography variant="body1">
                  {new Date(request.requestedAt).toLocaleString()}
                </Typography>
              </Grid>
              {request.notes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Notes
                  </Typography>
                  <Typography variant="body1">
                    {request.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Box>

          {action === 'reject' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              sx={{ mt: 2 }}
            />
          )}

          {action === 'generate' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This will generate the requested tests for the user. The process may take a few minutes.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          {action !== 'view' && (
            <Button 
              onClick={handleConfirmAction}
              variant="contained"
              color={action === 'reject' ? 'error' : 'primary'}
            >
              {action === 'approve' ? 'Approve' : action === 'reject' ? 'Reject' : 'Generate'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  const requestCounts = {
    total: requests.length,
    urgent: requests.filter(r => r.priority === 'urgent').length,
    high: requests.filter(r => r.priority === 'high').length,
    psychometric: requests.filter(r => r.requestType === 'psychometric_test' || r.requestType === 'both').length,
    interview: requests.filter(r => r.requestType === 'interview' || r.requestType === 'both').length
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading test requests...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Test Request Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={fetchPendingRequests}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Requests
              </Typography>
              <Typography variant="h4">
                {requestCounts.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="error" gutterBottom>
                Urgent
              </Typography>
              <Typography variant="h4" color="error">
                {requestCounts.urgent}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                High Priority
              </Typography>
              <Typography variant="h4" sx={{ color: orange[500] }}>
                {requestCounts.high}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Psychometric
              </Typography>
              <Typography variant="h4">
                {requestCounts.psychometric}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Interview
              </Typography>
              <Typography variant="h4">
                {requestCounts.interview}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={filterType}
                label="Filter by Type"
                onChange={(e) => setFilterType(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="psychometric_test">Psychometric Test</MenuItem>
                <MenuItem value="interview">Interview</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Priority</InputLabel>
              <Select
                value={filterPriority}
                label="Filter by Priority"
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="normal">Normal</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Test Requests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Job</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Requested</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRequests.map((request) => (
              <TableRow key={request._id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {request.user.firstName} {request.user.lastName}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {request.user.email}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {request.job.title}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {request.job.company}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={formatRequestType(request.requestType)} 
                    size="small"
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={request.priority.toUpperCase()} 
                    size="small"
                    sx={{ 
                      backgroundColor: getPriorityColor(request.priority),
                      color: 'white'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={request.status.toUpperCase()} 
                    size="small"
                    sx={{ 
                      backgroundColor: getStatusColor(request.status),
                      color: 'white'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {new Date(request.requestedAt).toLocaleDateString()}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {new Date(request.requestedAt).toLocaleTimeString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box display="flex" gap={1}>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small"
                        onClick={() => handleAction(request, 'view')}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    
                    {request.status === 'pending' && (
                      <>
                        <Tooltip title="Approve">
                          <IconButton 
                            size="small"
                            sx={{ color: green[600] }}
                            onClick={() => handleAction(request, 'approve')}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton 
                            size="small"
                            sx={{ color: red[600] }}
                            onClick={() => handleAction(request, 'reject')}
                          >
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    
                    {request.status === 'approved' && 
                     (!request.psychometricTest?.isGenerated || !request.interview?.isGenerated) && (
                      <Tooltip title="Generate Tests">
                        <IconButton 
                          size="small"
                          sx={{ color: blue[600] }}
                          onClick={() => handleAction(request, 'generate')}
                        >
                          <GenerateIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredRequests.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="textSecondary">
            No test requests found
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {filterType || filterPriority ? 'Try adjusting your filters' : 'No pending requests at the moment'}
          </Typography>
        </Box>
      )}

      {renderDialog()}
    </Container>
  );
};

export default TestRequestManagementPage;
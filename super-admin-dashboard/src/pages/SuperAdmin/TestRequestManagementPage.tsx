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
  InputLabel,
  Tab,
  Tabs,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  PlayArrow as GenerateIcon,
  Refresh as RefreshIcon,
  RequestPage as RequestIcon,
  Assessment as TestIcon
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

interface TestPurchase {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  test: {
    _id: string;
    title: string;
    type: string;
    description: string;
  };
  job?: {
    _id: string;
    title: string;
    company: string;
  };
  amount: number;
  currency: string;
  status: string;
  approvalStatus: 'not_required' | 'pending_approval' | 'approved' | 'rejected';
  approvalRequestedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  purchasedAt: string;
  attemptsUsed: number;
  maxAttempts: number;
}

interface PurchaseDialogData {
  purchase: TestPurchase;
  action: 'approve' | 'reject' | 'view';
}

const TestRequestManagementPage: React.FC = () => {
  // Tab management
  const [activeTab, setActiveTab] = useState(0);
  
  // Existing request states
  const [requests, setRequests] = useState<TestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<RequestDialogData | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  
  // New test purchase states
  const [purchases, setPurchases] = useState<TestPurchase[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchaseDialogData, setPurchaseDialogData] = useState<PurchaseDialogData | null>(null);
  const [purchaseRejectionReason, setPurchaseRejectionReason] = useState('');

  useEffect(() => {
    fetchPendingRequests();
    fetchPendingPurchases();
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

  // New functions for test purchase management
  const fetchPendingPurchases = async () => {
    try {
      setPurchasesLoading(true);
      const response = await apiService.get('/payment-requests');
      if (response.data.success) {
        setPurchases(response.data.data);
      }
    } catch (error: any) {
      setPurchasesError(error.response?.data?.error || 'Failed to load pending test approvals');
    } finally {
      setPurchasesLoading(false);
    }
  };

  const handlePurchaseAction = (purchase: TestPurchase, action: 'approve' | 'reject' | 'view') => {
    setPurchaseDialogData({ purchase, action });
    setPurchaseDialogOpen(true);
    setPurchaseRejectionReason('');
  };

  const handleConfirmPurchaseAction = async () => {
    if (!purchaseDialogData) return;

    const { purchase, action } = purchaseDialogData;

    try {
      if (action === 'approve') {
        await apiService.post(`/psychometric-tests/approvals/${purchase._id}/approve`);
      } else if (action === 'reject') {
        if (!purchaseRejectionReason.trim()) {
          setPurchasesError('Rejection reason is required');
          return;
        }
        await apiService.post(`/psychometric-tests/approvals/${purchase._id}/reject`, {
          reason: purchaseRejectionReason
        });
      }

      setPurchaseDialogOpen(false);
      setPurchaseDialogData(null);
      await fetchPendingPurchases();
    } catch (error: any) {
      setPurchasesError(error.response?.data?.error || `Failed to ${action} test`);
    }
  };

  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return orange[500];
      case 'approved':
        return green[500];
      case 'rejected':
        return red[500];
      default:
        return 'default';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
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

  const renderPurchaseDialog = () => {
    if (!purchaseDialogData) return null;

    const { purchase, action } = purchaseDialogData;

    const getDialogTitle = () => {
      switch (action) {
        case 'approve':
          return 'Approve Test Purchase';
        case 'reject':
          return 'Reject Test Purchase';
        case 'view':
          return 'Test Purchase Details';
        default:
          return 'Test Purchase';
      }
    };

    return (
      <Dialog open={purchaseDialogOpen} onClose={() => setPurchaseDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{getDialogTitle()}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Purchase Details */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>User Information</Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {purchase.user.firstName} {purchase.user.lastName}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {purchase.user.email}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>Test Information</Typography>
                <Typography variant="body2">
                  <strong>Title:</strong> {purchase.test.title}
                </Typography>
                <Typography variant="body2">
                  <strong>Type:</strong> {purchase.test.type}
                </Typography>
                <Typography variant="body2">
                  <strong>Amount:</strong> {formatCurrency(purchase.amount, purchase.currency)}
                </Typography>
              </Grid>
            </Grid>

            {/* Job Information */}
            {purchase.job && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>Job Information</Typography>
                <Typography variant="body2">
                  <strong>Position:</strong> {purchase.job.title}
                </Typography>
                <Typography variant="body2">
                  <strong>Company:</strong> {purchase.job.company}
                </Typography>
              </Box>
            )}

            {/* Test Description */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Test Description</Typography>
              <Typography variant="body2" color="text.secondary">
                {purchase.test.description}
              </Typography>
            </Box>

            {/* Approval Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Approval Status</Typography>
              <Chip
                label={purchase.approvalStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                sx={{
                  backgroundColor: getApprovalStatusColor(purchase.approvalStatus),
                  color: 'white',
                  fontWeight: 600
                }}
              />
              {purchase.approvalRequestedAt && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>Requested:</strong> {new Date(purchase.approvalRequestedAt).toLocaleString()}
                </Typography>
              )}
            </Box>

            {/* Action specific content */}
            {action === 'reject' && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Rejection Reason"
                value={purchaseRejectionReason}
                onChange={(e) => setPurchaseRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this test purchase..."
                required
                sx={{ mt: 2 }}
              />
            )}

            {action === 'approve' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Once approved, the user will be able to start taking this psychometric test.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPurchaseDialogOpen(false)}>
            Cancel
          </Button>
          {action !== 'view' && (
            <Button 
              onClick={handleConfirmPurchaseAction}
              variant="contained"
              color={action === 'approve' ? 'success' : 'error'}
              disabled={action === 'reject' && !purchaseRejectionReason.trim()}
            >
              {action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    );
  };

  if (loading && purchasesLoading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" py={8}>
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading test management...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Test Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={() => {
            fetchPendingRequests();
            fetchPendingPurchases();
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab 
            icon={<RequestIcon />} 
            label={`Test Requests (${requests.length})`} 
            iconPosition="start"
          />
          <Tab 
            icon={<TestIcon />} 
            label={`Purchase Approvals (${purchases.length})`} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Panel 0: Test Requests */}
      {activeTab === 0 && (
        <>
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
        </>
      )}

      {/* Tab Panel 1: Test Purchase Approvals */}
      {activeTab === 1 && (
        <>
          {purchasesError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setPurchasesError(null)}>
              {purchasesError}
            </Alert>
          )}

          {purchasesLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress />
              <Typography variant="h6" sx={{ ml: 2 }}>
                Loading test purchase approvals...
              </Typography>
            </Box>
          ) : (
            <>
              {/* Statistics Cards for Purchases */}
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Pending Approvals
                      </Typography>
                      <Typography variant="h4" sx={{ color: orange[500] }}>
                        {purchases.length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Total Value
                      </Typography>
                      <Typography variant="h4">
                        {formatCurrency(purchases.reduce((sum, p) => sum + p.amount, 0), 'USD')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Personality Tests
                      </Typography>
                      <Typography variant="h4">
                        {purchases.filter(p => p.test.type === 'personality').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" gutterBottom>
                        Cognitive Tests
                      </Typography>
                      <Typography variant="h4">
                        {purchases.filter(p => p.test.type === 'cognitive').length}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Purchases Table */}
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>User</TableCell>
                      <TableCell>Test</TableCell>
                      <TableCell>Job</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Requested</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase._id} hover>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {purchase.user.firstName} {purchase.user.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {purchase.user.email}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {purchase.test.title}
                            </Typography>
                            <Chip
                              label={purchase.test.type}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          {purchase.job ? (
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {purchase.job.title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                at {purchase.job.company}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              General Assessment
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {formatCurrency(purchase.amount, purchase.currency)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {purchase.attemptsUsed}/{purchase.maxAttempts} attempts
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {purchase.approvalRequestedAt ? (
                            <Typography variant="body2">
                              {new Date(purchase.approvalRequestedAt).toLocaleDateString()}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Not requested
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={purchase.approvalStatus.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            size="small"
                            sx={{
                              backgroundColor: getApprovalStatusColor(purchase.approvalStatus),
                              color: 'white',
                              fontWeight: 600
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box display="flex" gap={1} justifyContent="center">
                            <Tooltip title="View Details">
                              <IconButton 
                                size="small"
                                onClick={() => handlePurchaseAction(purchase, 'view')}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            
                            {purchase.approvalStatus === 'pending_approval' && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton 
                                    size="small"
                                    sx={{ color: green[600] }}
                                    onClick={() => handlePurchaseAction(purchase, 'approve')}
                                  >
                                    <ApproveIcon />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton 
                                    size="small"
                                    sx={{ color: red[600] }}
                                    onClick={() => handlePurchaseAction(purchase, 'reject')}
                                  >
                                    <RejectIcon />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {purchases.length === 0 && (
                <Box textAlign="center" py={4}>
                  <TestIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No pending test approvals
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    All test purchases have been processed or no approvals are required.
                  </Typography>
                </Box>
              )}

              {renderPurchaseDialog()}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default TestRequestManagementPage;
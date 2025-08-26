import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  AlertTitle,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Snackbar
} from '@mui/material';
import {
  Quiz as TestIcon,
  Schedule as ClockIcon,
  CheckCircle as CheckIcon,
  Pending as PendingIcon,
  Cancel as RejectIcon,
  PlayArrow as StartIcon,
  Receipt as ReceiptIcon,
  RequestPage as RequestIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { psychometricTestService } from '../services/psychometricTestService';

interface TestPurchase {
  _id: string;
  test: {
    _id: string;
    title: string;
    type: string;
    description: string;
    timeLimit: number;
  };
  job?: {
    _id: string;
    title: string;
    company: string;
  };
  amount: number;
  currency: string;
  maxAttempts: number;
  attemptsUsed: number;
  status: string;
  purchasedAt: string;
  expiresAt?: string;
  
  // Approval workflow fields
  approvalStatus: 'not_required' | 'pending_approval' | 'approved' | 'rejected';
  approvalRequestedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  autoApproval: boolean;
  
  // Virtual fields
  isValid?: boolean;
  canRequestApproval?: boolean;
  isApprovalPending?: boolean;
  approvalStatusDisplay?: string;
}

const SavedCardsManager: React.FC = () => {
  const [purchases, setPurchases] = useState<TestPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<TestPurchase | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [requestingApproval, setRequestingApproval] = useState<string | null>(null);
  const [startingTest, setStartingTest] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Separate effect for auto-refresh that doesn't depend on purchases state
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    // Check if there are pending approvals and set up interval
    const checkAndSetupRefresh = () => {
      const pendingApprovals = purchases.filter(p => p.approvalStatus === 'pending_approval');
      
      if (pendingApprovals.length > 0) {
        if (!interval) {
          console.log(`🔄 Setting up auto-refresh for ${pendingApprovals.length} pending approval(s)...`);
          console.log('📝 Pending approvals:', pendingApprovals.map(p => ({
            id: p._id,
            testTitle: p.test?.title,
            status: p.approvalStatus,
            requestedAt: p.approvalRequestedAt
          })));
          
          // Determine refresh interval based on recency of approval requests
          const recentRequests = pendingApprovals.filter(p => {
            if (!p.approvalRequestedAt) return false;
            const requestTime = new Date(p.approvalRequestedAt);
            const now = new Date();
            const minutesAgo = (now.getTime() - requestTime.getTime()) / (1000 * 60);
            return minutesAgo < 5; // Recent if within last 5 minutes
          });
          
          const refreshInterval = recentRequests.length > 0 ? 5000 : 10000; // 5s for recent, 10s for older
          
          interval = setInterval(() => {
            console.log('🔄 Auto-refreshing purchases for approval status updates...');
            console.log('⏰ Current time:', new Date().toISOString());
            console.log(`🚀 Using ${refreshInterval/1000}s interval (recent requests: ${recentRequests.length})`);
            fetchPurchases();
          }, refreshInterval);
        }
      } else {
        if (interval) {
          console.log('✅ Clearing auto-refresh - no pending approvals');
          clearInterval(interval);
          interval = null;
        }
      }
    };

    checkAndSetupRefresh();
    
    return () => {
      if (interval) {
        console.log('🧹 Cleaning up auto-refresh interval');
        clearInterval(interval);
      }
    };
  }, [purchases, fetchPurchases]);

  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await psychometricTestService.getUserTestPurchases();
      console.log('📊 Fetched user test purchases:', data.length, 'purchases');
      data.forEach((purchase, index) => {
        console.log(`  Purchase ${index + 1}:`, {
          id: purchase._id,
          test: purchase.test?.title,
          status: purchase.status,
          approvalStatus: purchase.approvalStatus,
          approvalStatusDisplay: purchase.approvalStatusDisplay,
          approvedAt: purchase.approvedAt,
          approvalRequestedAt: purchase.approvalRequestedAt,
          updatedAt: purchase.updatedAt
        });
      });
      
      // Check for status changes
      const statusChanges = data.filter(purchase => 
        purchases.find(existing => 
          existing._id === purchase._id && 
          existing.approvalStatus !== purchase.approvalStatus
        )
      );
      
      if (statusChanges.length > 0) {
        console.log('🔄 Status changes detected:', statusChanges.map(p => ({
          id: p._id,
          test: p.test?.title,
          oldStatus: purchases.find(existing => existing._id === p._id)?.approvalStatus,
          newStatus: p.approvalStatus
        })));
        
        statusChanges.forEach(purchase => {
          if (purchase.approvalStatus === 'approved') {
            setSnackbar({
              open: true,
              message: `Test "${purchase.test?.title}" has been approved! You can now start the test.`,
              severity: 'success'
            });
          } else if (purchase.approvalStatus === 'rejected') {
            setSnackbar({
              open: true,
              message: `Test "${purchase.test?.title}" was rejected. Please contact support for details.`,
              severity: 'error'
            });
          }
        });
      }
      
      setPurchases(data);
    } catch (error: any) {
      console.error('❌ Failed to fetch purchases:', error);
      setError('Failed to load your saved tests. Please try again.');
      toast.error('Failed to load your saved tests');
    } finally {
      setLoading(false);
    }
  }, [purchases]);

  const handleRequestApproval = async (purchaseId: string) => {
    try {
      setRequestingApproval(purchaseId);
      await psychometricTestService.requestTestApproval(purchaseId);
      toast.success('Approval requested successfully! You will be notified when an admin reviews your request.');
      await fetchPurchases(); // Refresh the list
    } catch (error: any) {
      console.error('Failed to request approval:', error);
      toast.error(error.message || 'Failed to request approval');
    } finally {
      setRequestingApproval(null);
    }
  };

  const handleStartTest = async (purchase: TestPurchase) => {
    try {
      setStartingTest(purchase._id);
      
      // Check test access first
      const accessCheck = await psychometricTestService.checkTestAccess(purchase.test._id, purchase.job?._id);
      
      if (!accessCheck.canTakeTest) {
        toast.error(accessCheck.reason || 'Cannot start test at this time');
        return;
      }

      // Start test session
      const session = await psychometricTestService.startTestSession(purchase.test._id, purchase.job?._id);
      
      // Navigate to test interface or show success message
      toast.success('Test session started successfully!');
      // You would typically navigate to the test interface here
      // navigate(`/test/${purchase.test._id}/session/${session.sessionId}`);
      
    } catch (error: any) {
      console.error('Failed to start test:', error);
      toast.error(error.message || 'Failed to start test');
    } finally {
      setStartingTest(null);
    }
  };

  const getStatusColor = (approvalStatus: string, testStatus: string) => {
    if (testStatus !== 'completed') return 'warning';
    
    switch (approvalStatus) {
      case 'not_required':
        return 'success';
      case 'approved':
        return 'success';
      case 'pending_approval':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (approvalStatus: string, testStatus: string) => {
    if (testStatus !== 'completed') return <PendingIcon />;
    
    switch (approvalStatus) {
      case 'not_required':
        return <CheckIcon />;
      case 'approved':
        return <CheckIcon />;
      case 'pending_approval':
        return <PendingIcon />;
      case 'rejected':
        return <RejectIcon />;
      default:
        return <InfoIcon />;
    }
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const handleManualRefresh = useCallback(async () => {
    setSnackbar({
      open: true,
      message: 'Refreshing test status...',
      severity: 'info'
    });
    
    try {
      await fetchPurchases();
      setTimeout(() => {
        setSnackbar({
          open: true,
          message: 'Test status updated successfully!',
          severity: 'success'
        });
      }, 500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to refresh status. Please try again.',
        severity: 'error'
      });
    }
  }, [fetchPurchases]);

  const canTakeTest = (purchase: TestPurchase) => {
    return purchase.status === 'completed' && 
           (purchase.approvalStatus === 'not_required' || purchase.approvalStatus === 'approved') &&
           purchase.attemptsUsed < purchase.maxAttempts &&
           (!purchase.expiresAt || new Date() <= new Date(purchase.expiresAt));
  };

  const showPurchaseDetails = (purchase: TestPurchase) => {
    setSelectedPurchase(purchase);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={fetchPurchases} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <TestIcon sx={{ mr: 2, verticalAlign: 'middle' }} />
          My Saved Tests
        </Typography>
        <Button
          variant="outlined"
          onClick={handleManualRefresh}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
        >
          Refresh
        </Button>
      </Box>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your purchased psychometric tests. Request approval when needed and start tests when ready.
      </Typography>

      {/* Pending Approvals Alert */}
      {purchases.some(p => p.approvalStatus === 'pending_approval') && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleManualRefresh}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {loading ? 'Refreshing...' : 'Check Status'}
            </Button>
          }
        >
          <AlertTitle>Approval Status Updates</AlertTitle>
          You have {purchases.filter(p => p.approvalStatus === 'pending_approval').length} test(s) 
          pending admin approval. Status updates automatically every {
            purchases.some(p => {
              if (!p.approvalRequestedAt) return false;
              const requestTime = new Date(p.approvalRequestedAt);
              const now = new Date();
              const minutesAgo = (now.getTime() - requestTime.getTime()) / (1000 * 60);
              return minutesAgo < 5;
            }) ? '5' : '10'
          } seconds, or click "Check Status" to refresh immediately.
        </Alert>
      )}

      {purchases.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <TestIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No saved tests found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Purchase a test to get started with psychometric assessments.
            </Typography>
            <Button variant="contained" color="primary" href="/tests">
              Browse Available Tests
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {purchases.map((purchase) => (
            <Grid item xs={12} md={6} lg={4} key={purchase._id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.shadows[8]
                    }
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    {/* Test Header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <TestIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="h2" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        {purchase.test.title}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(purchase.approvalStatus, purchase.status)}
                        label={purchase.approvalStatusDisplay || purchase.status}
                        color={getStatusColor(purchase.approvalStatus, purchase.status)}
                        size="small"
                        sx={{
                          ...(purchase.approvalStatus === 'pending_approval' && {
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                              '0%': { opacity: 1 },
                              '50%': { opacity: 0.7 },
                              '100%': { opacity: 1 }
                            }
                          })
                        }}
                      />
                    </Box>

                    {/* Job Info */}
                    {purchase.job && (
                      <Box sx={{ mb: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Applied for
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {purchase.job.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          at {purchase.job.company}
                        </Typography>
                      </Box>
                    )}

                    {/* Test Details */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {purchase.test.description}
                    </Typography>

                    {/* Test Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ClockIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption">
                          {purchase.test.timeLimit} min
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <ReceiptIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption">
                          {formatCurrency(purchase.amount, purchase.currency)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Attempts */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Attempts
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {purchase.attemptsUsed} / {purchase.maxAttempts}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(purchase.attemptsUsed / purchase.maxAttempts) * 100}
                        sx={{ height: 4, borderRadius: 2 }}
                        color={purchase.attemptsUsed >= purchase.maxAttempts ? 'error' : 'primary'}
                      />
                    </Box>

                    {/* Purchase Date */}
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                      Purchased on {formatDate(purchase.purchasedAt)}
                    </Typography>

                    {/* Rejection Reason */}
                    {purchase.approvalStatus === 'rejected' && purchase.rejectionReason && (
                      <Alert severity="error" sx={{ mb: 2, '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
                        <strong>Rejected:</strong> {purchase.rejectionReason}
                      </Alert>
                    )}
                  </CardContent>

                  {/* Action Buttons */}
                  <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {/* Request Approval Button */}
                    {purchase.canRequestApproval && (
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        startIcon={requestingApproval === purchase._id ? <CircularProgress size={16} /> : <RequestIcon />}
                        onClick={() => handleRequestApproval(purchase._id)}
                        disabled={requestingApproval === purchase._id}
                        sx={{ flexGrow: 1 }}
                      >
                        Request Approval
                      </Button>
                    )}

                    {/* Start Test Button */}
                    {canTakeTest(purchase) && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={startingTest === purchase._id ? <CircularProgress size={16} /> : <StartIcon />}
                        onClick={() => handleStartTest(purchase)}
                        disabled={startingTest === purchase._id}
                        sx={{ flexGrow: 1 }}
                      >
                        Start Test
                      </Button>
                    )}

                    {/* Details Button */}
                    <Button
                      variant="text"
                      color="primary"
                      size="small"
                      startIcon={<InfoIcon />}
                      onClick={() => showPurchaseDetails(purchase)}
                    >
                      Details
                    </Button>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Purchase Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <TestIcon />
            Test Purchase Details
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPurchase && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Test Information</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Title</strong></TableCell>
                          <TableCell>{selectedPurchase.test.title}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell>
                            <Chip label={selectedPurchase.test.type} size="small" />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Time Limit</strong></TableCell>
                          <TableCell>{selectedPurchase.test.timeLimit} minutes</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Description</strong></TableCell>
                          <TableCell>{selectedPurchase.test.description}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Purchase Information</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Amount</strong></TableCell>
                          <TableCell>{formatCurrency(selectedPurchase.amount, selectedPurchase.currency)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell>
                            <Chip 
                              label={selectedPurchase.status} 
                              color={selectedPurchase.status === 'completed' ? 'success' : 'warning'}
                              size="small" 
                            />
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Purchased</strong></TableCell>
                          <TableCell>{formatDate(selectedPurchase.purchasedAt)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Attempts</strong></TableCell>
                          <TableCell>{selectedPurchase.attemptsUsed} / {selectedPurchase.maxAttempts}</TableCell>
                        </TableRow>
                        {selectedPurchase.expiresAt && (
                          <TableRow>
                            <TableCell><strong>Expires</strong></TableCell>
                            <TableCell>{formatDate(selectedPurchase.expiresAt)}</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Approval Information */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Approval Status</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Status</strong></TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(selectedPurchase.approvalStatus, selectedPurchase.status)}
                              label={selectedPurchase.approvalStatusDisplay}
                              color={getStatusColor(selectedPurchase.approvalStatus, selectedPurchase.status)}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                        {selectedPurchase.approvalRequestedAt && (
                          <TableRow>
                            <TableCell><strong>Requested</strong></TableCell>
                            <TableCell>{formatDate(selectedPurchase.approvalRequestedAt)}</TableCell>
                          </TableRow>
                        )}
                        {selectedPurchase.approvedAt && (
                          <TableRow>
                            <TableCell><strong>Approved</strong></TableCell>
                            <TableCell>{formatDate(selectedPurchase.approvedAt)}</TableCell>
                          </TableRow>
                        )}
                        {selectedPurchase.rejectedAt && (
                          <TableRow>
                            <TableCell><strong>Rejected</strong></TableCell>
                            <TableCell>{formatDate(selectedPurchase.rejectedAt)}</TableCell>
                          </TableRow>
                        )}
                        {selectedPurchase.rejectionReason && (
                          <TableRow>
                            <TableCell><strong>Reason</strong></TableCell>
                            <TableCell>
                              <Alert severity="error" sx={{ mt: 1 }}>
                                {selectedPurchase.rejectionReason}
                              </Alert>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>

                {/* Job Information */}
                {selectedPurchase.job && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Job Information</Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Position</strong></TableCell>
                            <TableCell>{selectedPurchase.job.title}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Company</strong></TableCell>
                            <TableCell>{selectedPurchase.job.company}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SavedCardsManager;
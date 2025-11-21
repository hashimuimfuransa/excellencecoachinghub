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

  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { simplePsychometricService } from '../services/simplePsychometricService';

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
  
  // Virtual fields
  isValid?: boolean;
}

const SavedCardsManager: React.FC = () => {
  const [purchases, setPurchases] = useState<TestPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<TestPurchase | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [startingTest, setStartingTest] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' | 'warning' | 'error' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);




  const fetchPurchases = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Using simple service instead of complex one
      const data = []; // Simple service doesn't have this functionality
      console.log('📊 Using simple psychometric service - no purchase functionality');
      
      setPurchases(data);
    } catch (error: any) {
      console.error('❌ Failed to fetch purchases:', error);
      setError('Failed to load your saved tests. Please try again.');
      toast.error('Failed to load your saved tests');
    } finally {
      setLoading(false);
    }
  }, [purchases]);




  const handleStartTest = async (purchase: TestPurchase) => {
    try {
      setStartingTest(purchase._id);
      
      // Simple service doesn't have access checking
      // Just show a message that test starting is not implemented in simple version
      toast.info('Test starting functionality not implemented in simple version');
      
    } catch (error: any) {
      console.error('Failed to start test:', error);
      toast.error(error.message || 'Failed to start test');
    } finally {
      setStartingTest(null);
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'completed' ? 'success' : 'warning';
  };

  const getStatusIcon = (status: string) => {
    return status === 'completed' ? <CheckIcon /> : <PendingIcon />;
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
        Manage your purchased psychometric tests and start them when ready.
      </Typography>



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
                        icon={getStatusIcon(purchase.status)}
                        label={purchase.status === 'completed' ? 'Ready to Start' : 'Processing'}
                        color={getStatusColor(purchase.status)}
                        size="small"
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


                  </CardContent>

                  {/* Action Buttons */}
                  <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>


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
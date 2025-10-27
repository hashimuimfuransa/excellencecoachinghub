import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Box,
  Chip,
  Grid,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Add as AddIcon,
  Psychology as PsychologyIcon,
  RecordVoiceOver as InterviewIcon,
  Schedule as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  PlayArrow as PlayIcon,
  Assignment as TestIcon
} from '@mui/icons-material';
import { green, orange, red, blue } from '@mui/material/colors';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/apiService';

interface TestRequest {
  _id: string;
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
  testResults?: {
    psychometricScore?: number;
    interviewScore?: number;
    overallPerformance?: string;
  };
}

interface Job {
  _id: string;
  title: string;
  company: string;
  description: string;
}

const TestRequestsPage: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<TestRequest[]>([]);
  const [approvedTests, setApprovedTests] = useState<TestRequest[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState('');
  const [requestType, setRequestType] = useState<'psychometric_test' | 'interview' | 'both'>('both');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('normal');
  
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TestRequest | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [requestsRes, approvedRes, jobsRes] = await Promise.all([
        apiService.get('/test-requests/my-requests'),
        apiService.get('/test-requests/approved'),
        apiService.get('/jobs')
      ]);

      setRequests(requestsRes.data.data || []);
      setApprovedTests(approvedRes.data.data || []);
      setJobs(jobsRes.data.data || []);
    } catch (error: any) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      if (!selectedJob || !requestType) {
        setError('Please select a job and request type');
        return;
      }

      await apiService.post('/test-requests/create', {
        jobId: selectedJob,
        requestType,
        notes,
        priority
      });

      setSuccess('Test request created successfully!');
      setCreateDialogOpen(false);
      setSelectedJob('');
      setRequestType('both');
      setNotes('');
      setPriority('normal');
      await fetchData();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create test request');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <PendingIcon sx={{ color: orange[500] }} />;
      case 'approved':
        return <ApprovedIcon sx={{ color: green[500] }} />;
      case 'rejected':
        return <RejectedIcon sx={{ color: red[500] }} />;
      case 'completed':
        return <TestIcon sx={{ color: blue[500] }} />;
      default:
        return <PendingIcon />;
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

  const formatRequestType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const canTakeTest = (request: TestRequest) => {
    return request.status === 'approved' && 
           ((request.psychometricTest?.isGenerated || request.requestType === 'interview') &&
            (request.interview?.isGenerated || request.requestType === 'psychometric_test'));
  };

  const handleTakeTest = (request: TestRequest) => {
    // Redirect to appropriate test/interview page
    if (request.requestType === 'psychometric_test' && request.psychometricTest?.testId) {
      window.location.href = `/psychometric-test/${request.psychometricTest.testId}`;
    } else if (request.requestType === 'interview' && request.interview?.interviewId) {
      window.location.href = `/ai-interview/${request.interview.interviewId}`;
    } else if (request.requestType === 'both') {
      // Show dialog to choose which test to take first
      setSelectedRequest(request);
      setDetailsDialogOpen(true);
    }
  };

  const renderCreateDialog = () => (
    <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Request Test Access</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Select Job</InputLabel>
            <Select
              value={selectedJob}
              label="Select Job"
              onChange={(e) => setSelectedJob(e.target.value)}
            >
              {jobs.map((job) => (
                <MenuItem key={job._id} value={job._id}>
                  <Box>
                    <Typography variant="body1">{job.title}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {job.company}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Request Type</InputLabel>
            <Select
              value={requestType}
              label="Request Type"
              onChange={(e) => setRequestType(e.target.value as any)}
            >
              <MenuItem value="psychometric_test">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyIcon />
                  Psychometric Test Only
                </Box>
              </MenuItem>
              <MenuItem value="interview">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InterviewIcon />
                  AI Interview Only
                </Box>
              </MenuItem>
              <MenuItem value="both">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PsychologyIcon />
                  <InterviewIcon />
                  Both Tests
                </Box>
              </MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              value={priority}
              label="Priority"
              onChange={(e) => setPriority(e.target.value as any)}
            >
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="urgent">Urgent</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific requirements or additional information..."
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
        <Button onClick={handleCreateRequest} variant="contained">
          Submit Request
        </Button>
      </DialogActions>
    </Dialog>
  );

  const renderDetailsDialog = () => (
    <Dialog 
      open={detailsDialogOpen} 
      onClose={() => setDetailsDialogOpen(false)} 
      maxWidth="md" 
      fullWidth
    >
      <DialogTitle>Test Options</DialogTitle>
      <DialogContent>
        {selectedRequest && (
          <Box>
            <Typography variant="h6" gutterBottom>
              {selectedRequest.job.title} - {selectedRequest.job.company}
            </Typography>
            
            <List>
              {(selectedRequest.requestType === 'psychometric_test' || selectedRequest.requestType === 'both') && 
               selectedRequest.psychometricTest?.isGenerated && (
                <ListItem 
                  button 
                  onClick={() => window.location.href = `/psychometric-test/${selectedRequest.psychometricTest?.testId}`}
                >
                  <ListItemIcon>
                    <PsychologyIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Psychometric Test"
                    secondary="Assess your personality traits and cognitive abilities"
                  />
                </ListItem>
              )}
              
              {(selectedRequest.requestType === 'interview' || selectedRequest.requestType === 'both') && 
               selectedRequest.interview?.isGenerated && (
                <ListItem 
                  button 
                  onClick={() => window.location.href = `/ai-interview/${selectedRequest.interview?.interviewId}`}
                >
                  <ListItemIcon>
                    <InterviewIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="AI Interview"
                    secondary="Complete your interactive interview session"
                  />
                </ListItem>
              )}
            </List>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Test Requests
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Request Test Access
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Available Tests */}
      {approvedTests.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ color: green[600] }}>
            Available Tests
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            These tests have been approved and are ready for you to take.
          </Typography>
          
          <Grid container spacing={2}>
            {approvedTests.map((request) => (
              <Grid item xs={12} md={6} lg={4} key={request._id}>
                <Card 
                  sx={{ 
                    border: `2px solid ${green[300]}`,
                    '&:hover': { boxShadow: 4 }
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box>
                        <Typography variant="h6" component="h3">
                          {request.job.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {request.job.company}
                        </Typography>
                      </Box>
                      <Chip 
                        label={formatRequestType(request.requestType)} 
                        size="small"
                        color="success"
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Approved on {new Date(request.approvedAt!).toLocaleDateString()}
                    </Typography>
                    
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<PlayIcon />}
                      onClick={() => handleTakeTest(request)}
                      disabled={!canTakeTest(request)}
                      color="success"
                    >
                      {canTakeTest(request) ? 'Take Test' : 'Test Being Generated...'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* Request History */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Request History
        </Typography>
        
        {requests.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" color="textSecondary">
              No test requests yet
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Request access to psychometric tests and AI interviews for jobs you're interested in.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Your First Request
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {requests.map((request) => (
              <Grid item xs={12} md={6} lg={4} key={request._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" component="h3">
                          {request.job.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {request.job.company}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(request.status)}
                        <Chip 
                          label={request.status.toUpperCase()} 
                          size="small"
                          sx={{ 
                            backgroundColor: getStatusColor(request.status),
                            color: 'white'
                          }}
                        />
                      </Box>
                    </Box>
                    
                    <Chip 
                      label={formatRequestType(request.requestType)} 
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                      Requested on {new Date(request.requestedAt).toLocaleDateString()}
                    </Typography>
                    
                    {request.status === 'rejected' && request.rejectionReason && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        <Typography variant="caption">
                          Reason: {request.rejectionReason}
                        </Typography>
                      </Alert>
                    )}
                    
                    {request.status === 'completed' && request.testResults && (
                      <Box sx={{ mt: 1 }}>
                        <Divider sx={{ mb: 1 }} />
                        <Typography variant="body2" fontWeight="medium">
                          Results:
                        </Typography>
                        {request.testResults.psychometricScore && (
                          <Typography variant="body2">
                            Psychometric: {request.testResults.psychometricScore}%
                          </Typography>
                        )}
                        {request.testResults.interviewScore && (
                          <Typography variant="body2">
                            Interview: {request.testResults.interviewScore}%
                          </Typography>
                        )}
                        {request.testResults.overallPerformance && (
                          <Typography variant="body2" color="primary">
                            Overall: {request.testResults.overallPerformance}
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                      onClick={() => {
                        setSelectedRequest(request);
                        setDetailsDialogOpen(true);
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {renderCreateDialog()}
      {renderDetailsDialog()}
    </Container>
  );
};

export default TestRequestsPage;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Grid,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  Divider,
  Badge
} from '@mui/material';
import {
  Refresh,
  PlayArrow,
  Stop,
  Timeline,
  Work,
  Info,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  Language,
  Business,
  LocationOn,
  Visibility,
  Launch
} from '@mui/icons-material';
import { format } from 'date-fns';

interface InternshipRwJob {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
  externalJobId: string;
  createdAt: string;
}

interface ScrapingStatistics {
  totalJobs: number;
  activeJobs: number;
  jobsLast24Hours: number;
}

interface SchedulerStatus {
  isRunning: boolean;
  isScheduled: boolean;
  lastRunTime: string | null;
  nextRunTime: string | null;
  timezone: string;
}

interface SourceInfo {
  name: string;
  url: string;
  type: string;
  scrapingEnabled: boolean;
  hourlySchedule: boolean;
  lastScrapingTime: string | null;
}

interface InternshipRwStatus {
  scheduler: SchedulerStatus;
  statistics: ScrapingStatistics;
  recentJobs: InternshipRwJob[];
  sourceInfo: SourceInfo;
}

interface ScrapingResult {
  success: boolean;
  message: string;
  data?: {
    jobsFound: number;
    jobsSaved: number;
    employerRequests: number;
    errors: number;
    duration: string;
  };
}

const InternshipRwScrapingMonitor: React.FC = () => {
  const [status, setStatus] = useState<InternshipRwStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [scrapingResult, setScrapingResult] = useState<ScrapingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch internship.rw status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/job-scraping/internship-rw/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch status');
      }

      const data = await response.json();
      if (data.success) {
        setStatus(data.data);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to fetch status');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      console.error('Error fetching internship.rw status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manually trigger scraping
  const triggerScraping = async () => {
    setScraping(true);
    setScrapingResult(null);
    
    try {
      const response = await fetch('/api/job-scraping/internship-rw/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setScrapingResult(data);
      
      if (data.success) {
        // Refresh status after successful scraping
        setTimeout(fetchStatus, 2000);
      }
    } catch (err) {
      setScrapingResult({
        success: false,
        message: err instanceof Error ? err.message : 'Scraping failed'
      });
    } finally {
      setScraping(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'success' : 'warning';
  };

  const getJobStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'success';
      case 'closed':
      case 'expired':
        return 'error';
      case 'paused':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={fetchStatus}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  if (!status) {
    return (
      <Alert severity="info">
        No internship.rw data available
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h5" component="h2" fontWeight="bold">
            <Language sx={{ mr: 1, color: 'primary.main' }} />
            Internship.rw Scraping Monitor
          </Typography>
          <Box>
            <Tooltip title="Refresh Status">
              <IconButton onClick={fetchStatus} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={scraping ? <CircularProgress size={16} /> : <PlayArrow />}
              onClick={triggerScraping}
              disabled={scraping}
              sx={{ ml: 1 }}
            >
              {scraping ? 'Scraping...' : 'Run Scraping'}
            </Button>
          </Box>
        </Box>

        {/* Status Cards */}
        <Grid container spacing={3}>
          {/* Source Information */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Business sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Source Information</Typography>
                </Box>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Portal Name
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {status.sourceInfo.name}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      URL
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body1" fontWeight="medium">
                        {status.sourceInfo.url}
                      </Typography>
                      <IconButton 
                        size="small" 
                        onClick={() => window.open(status.sourceInfo.url, '_blank')}
                        sx={{ ml: 1 }}
                      >
                        <Launch fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip 
                      label={status.sourceInfo.type}
                      color="primary"
                      size="small"
                    />
                    <Chip 
                      label={status.sourceInfo.scrapingEnabled ? 'Enabled' : 'Disabled'}
                      color={status.sourceInfo.scrapingEnabled ? 'success' : 'error'}
                      size="small"
                    />
                    <Chip 
                      label="Hourly Schedule"
                      color={status.sourceInfo.hourlySchedule ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Scheduler Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Schedule sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Scheduler Status</Typography>
                </Box>
                <Stack spacing={2}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Chip 
                      label={status.scheduler.isRunning ? 'Running' : 'Idle'}
                      color={status.scheduler.isRunning ? 'success' : 'default'}
                      size="small"
                    />
                    <Chip 
                      label={status.scheduler.isScheduled ? 'Scheduled' : 'Not Scheduled'}
                      color={status.scheduler.isScheduled ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Last Run
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {status.scheduler.lastRunTime 
                        ? format(new Date(status.scheduler.lastRunTime), 'PPpp')
                        : 'Never'
                      }
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Next Run ({status.scheduler.timezone})
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {status.scheduler.nextRunTime 
                        ? format(new Date(status.scheduler.nextRunTime), 'PPpp')
                        : 'Not scheduled'
                      }
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Statistics */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <Timeline sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6">Statistics</Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="primary.main">
                        {status.statistics.totalJobs}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Total Jobs Scraped
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="success.main">
                        {status.statistics.activeJobs}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Active Jobs
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box textAlign="center">
                      <Typography variant="h3" fontWeight="bold" color="info.main">
                        {status.statistics.jobsLast24Hours}
                      </Typography>
                      <Typography variant="body1" color="text.secondary">
                        Jobs (Last 24h)
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Scraping Result */}
      {scrapingResult && (
        <Box sx={{ mt: 3 }}>
          <Alert 
            severity={scrapingResult.success ? 'success' : 'error'}
            onClose={() => setScrapingResult(null)}
          >
            <Typography variant="body1" fontWeight="medium">
              {scrapingResult.message}
            </Typography>
            {scrapingResult.data && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Jobs Found: {scrapingResult.data.jobsFound} | 
                  Jobs Saved: {scrapingResult.data.jobsSaved} | 
                  Employer Requests: {scrapingResult.data.employerRequests} | 
                  Errors: {scrapingResult.data.errors} | 
                  Duration: {scrapingResult.data.duration}
                </Typography>
              </Box>
            )}
          </Alert>
        </Box>
      )}

      {/* Recent Jobs */}
      <Box sx={{ mt: 4 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Recent Jobs from Internship.rw
          </Typography>
          {status.recentJobs.length > 0 && (
            <Button
              size="small"
              endIcon={<Visibility />}
              onClick={() => setDetailsOpen(true)}
            >
              View Details
            </Button>
          )}
        </Box>

        {status.recentJobs.length === 0 ? (
          <Alert severity="info">
            No jobs found from internship.rw yet. Try running the scraper manually.
          </Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {status.recentJobs.slice(0, 5).map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {job.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {job.externalJobId}
                      </Typography>
                    </TableCell>
                    <TableCell>{job.company}</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
                        {job.location}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        color={getJobStatusColor(job.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(job.createdAt), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Job Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          All Jobs from Internship.rw
        </DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Job Title</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>External ID</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {status.recentJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>{job.title}</TableCell>
                    <TableCell>{job.company}</TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>
                      <Chip
                        label={job.status}
                        color={getJobStatusColor(job.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" fontFamily="monospace">
                        {job.externalJobId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(job.createdAt), 'PPpp')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InternshipRwScrapingMonitor;
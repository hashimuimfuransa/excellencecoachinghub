import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Skeleton,
  FormControl,
  InputLabel,
  Select,
  Badge,
  LinearProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  VideoCall as InterviewIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Message as MessageIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Candidate {
  _id: string;
  candidate: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
    avatar?: string;
    bio?: string;
    skills?: string[];
    experience?: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
    }>;
  };
  applications: Array<{
    _id: string;
    job: {
      _id: string;
      title: string;
    };
    status: string;
    appliedAt: string;
    psychometricTestResults: any[];
    interviewResults: any[];
  }>;
  totalApplications: number;
  latestApplication: string;
}

interface Application {
  _id: string;
  applicant: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    phone?: string;
    location?: string;
  };
  job: {
    _id: string;
    title: string;
    company: string;
  };
  status: string;
  appliedAt: string;
  psychometricTestResults: any[];
  interviewResults: any[];
  resume?: string;
  coverLetter?: string;
  notes?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`candidates-tabpanel-${index}`}
      aria-labelledby={`candidates-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const EmployerCandidatesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCandidates, setTotalCandidates] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'candidates' | 'applications'>('applications');
  
  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  
  // Dialog states
  const [candidateDetailsOpen, setCandidateDetailsOpen] = useState(false);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [scheduleInterviewOpen, setScheduleInterviewOpen] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (viewMode === 'candidates') {
      fetchCandidates();
    } else {
      fetchApplications();
    }
  }, [viewMode, page, rowsPerPage, searchQuery, statusFilter, jobFilter]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });

      if (searchQuery) params.append('q', searchQuery);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/employer/candidates?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch candidates');
      }

      const data = await response.json();
      setCandidates(data.data);
      setTotalCandidates(data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/employer/jobs`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }

      const data = await response.json();
      // Get all jobs and their applications
      const allApplications: Application[] = [];
      
      // This is a simplified version - in reality, you'd fetch applications from multiple jobs
      for (const job of data.data) {
        const applicationsResponse = await fetch(
          `${import.meta.env.VITE_API_URL}/employer/jobs/${job._id}/applications`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );

        if (applicationsResponse.ok) {
          const applicationsData = await applicationsResponse.json();
          allApplications.push(...applicationsData.data);
        }
      }

      setApplications(allApplications);
      setTotalCandidates(allApplications.length);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, item: Candidate | Application) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    if (viewMode === 'candidates') {
      setSelectedCandidate(item as Candidate);
    } else {
      setSelectedApplication(item as Application);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCandidate(null);
    setSelectedApplication(null);
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employer/applications/${applicationId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update application status');
      }

      // Refresh data
      if (viewMode === 'applications') {
        fetchApplications();
      }
      handleMenuClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update application status');
    }
  };

  const handleAddNotes = async (applicationId: string, notes: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employer/applications/${applicationId}/notes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ notes }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add notes');
      }

      // Refresh data
      if (viewMode === 'applications') {
        fetchApplications();
      }
      setNotesDialogOpen(false);
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to add notes');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'info';
      case 'shortlisted':
        return 'success';
      case 'interview_scheduled':
        return 'warning';
      case 'interviewed':
        return 'primary';
      case 'offered':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getExperienceYears = (experience: any[]) => {
    if (!experience || experience.length === 0) return 0;
    
    const totalMonths = experience.reduce((total, exp) => {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      return total + months;
    }, 0);
    
    return Math.round(totalMonths / 12);
  };

  const CandidateCard = ({ candidate }: { candidate: Candidate }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar
            src={candidate.candidate.avatar}
            sx={{ width: 60, height: 60 }}
          >
            {candidate.candidate.firstName[0]}{candidate.candidate.lastName[0]}
          </Avatar>
          
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              {candidate.candidate.firstName} {candidate.candidate.lastName}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              {candidate.candidate.email && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    {candidate.candidate.email}
                  </Typography>
                </Box>
              )}
              
              {candidate.candidate.location && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    {candidate.candidate.location}
                  </Typography>
                </Box>
              )}
            </Box>

            {candidate.candidate.bio && (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                {candidate.candidate.bio}
              </Typography>
            )}

            <Box display="flex" gap={1} mb={2}>
              {candidate.candidate.skills?.slice(0, 3).map((skill, index) => (
                <Chip key={index} label={skill} size="small" variant="outlined" />
              ))}
              {(candidate.candidate.skills?.length || 0) > 3 && (
                <Chip 
                  label={`+${(candidate.candidate.skills?.length || 0) - 3} more`} 
                  size="small" 
                  variant="outlined" 
                />
              )}
            </Box>

            <Box display="flex" gap={3}>
              <Typography variant="body2" color="textSecondary">
                {candidate.totalApplications} applications
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {getExperienceYears(candidate.candidate.experience || [])} years experience
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Latest: {formatDate(candidate.latestApplication)}
              </Typography>
            </Box>
          </Box>

          <IconButton onClick={(e) => handleMenuClick(e, candidate)}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  const ApplicationCard = ({ application }: { application: Application }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar
            src={application.applicant.avatar}
            sx={{ width: 50, height: 50 }}
          >
            {application.applicant.firstName[0]}{application.applicant.lastName[0]}
          </Avatar>
          
          <Box flex={1}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
              <Box>
                <Typography variant="h6">
                  {application.applicant.firstName} {application.applicant.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Applied for: {application.job.title}
                </Typography>
              </Box>
              <Box display="flex" gap={1}>
                <Chip 
                  label={application.status} 
                  size="small" 
                  color={getStatusColor(application.status) as any}
                />
                {application.psychometricTestResults.length > 0 && (
                  <Badge badgeContent={application.psychometricTestResults.length} color="primary">
                    <AssessmentIcon fontSize="small" color="action" />
                  </Badge>
                )}
                {application.interviewResults.length > 0 && (
                  <Badge badgeContent={application.interviewResults.length} color="secondary">
                    <InterviewIcon fontSize="small" color="action" />
                  </Badge>
                )}
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" color="textSecondary">
                  {application.applicant.email}
                </Typography>
              </Box>
              
              {application.applicant.location && (
                <Box display="flex" alignItems="center" gap={0.5}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="textSecondary">
                    {application.applicant.location}
                  </Typography>
                </Box>
              )}
            </Box>

            <Typography variant="body2" color="textSecondary">
              Applied on {formatDate(application.appliedAt)}
            </Typography>
          </Box>

          <IconButton onClick={(e) => handleMenuClick(e, application)}>
            <MoreVertIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading && (candidates.length === 0 && applications.length === 0)) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Candidates & Applications
        </Typography>
        <Grid container spacing={2}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} key={i}>
              <Card>
                <CardContent>
                  <Box display="flex" gap={2}>
                    <Skeleton variant="circular" width={60} height={60} />
                    <Box flex={1}>
                      <Skeleton variant="text" width="60%" height={32} />
                      <Skeleton variant="text" width="40%" />
                      <Skeleton variant="text" width="80%" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Candidates & Applications
        </Typography>
        <Box display="flex" gap={2}>
          <Button
            variant={viewMode === 'applications' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('applications')}
          >
            Applications
          </Button>
          <Button
            variant={viewMode === 'candidates' ? 'contained' : 'outlined'}
            onClick={() => setViewMode('candidates')}
          >
            Candidates
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search and Filters */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder={`Search ${viewMode}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth>
            <InputLabel>Status Filter</InputLabel>
            <Select
              value={statusFilter}
              label="Status Filter"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="applied">Applied</MenuItem>
              <MenuItem value="shortlisted">Shortlisted</MenuItem>
              <MenuItem value="interview_scheduled">Interview Scheduled</MenuItem>
              <MenuItem value="interviewed">Interviewed</MenuItem>
              <MenuItem value="offered">Offered</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ height: '56px' }}
          >
            Export Data
          </Button>
        </Grid>
      </Grid>

      {/* Content */}
      {viewMode === 'candidates' ? (
        candidates.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={6}>
                <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No candidates found
                </Typography>
                <Typography color="textSecondary">
                  Candidates will appear here once people apply to your jobs.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <>
            {candidates.map((candidate) => (
              <CandidateCard key={candidate._id} candidate={candidate} />
            ))}
            <TablePagination
              component="div"
              count={totalCandidates}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )
      ) : (
        applications.length === 0 ? (
          <Card>
            <CardContent>
              <Box textAlign="center" py={6}>
                <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No applications found
                </Typography>
                <Typography color="textSecondary">
                  Applications will appear here once people apply to your jobs.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ) : (
          <>
            {applications.map((application) => (
              <ApplicationCard key={application._id} application={application} />
            ))}
            <TablePagination
              component="div"
              count={totalCandidates}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {viewMode === 'candidates' && selectedCandidate ? (
          <>
            <MenuItem onClick={() => {
              navigate(`/app/employer/candidates/${selectedCandidate.candidate._id}`);
              handleMenuClose();
            }}>
              <ViewIcon fontSize="small" sx={{ mr: 1 }} />
              View Full Profile
            </MenuItem>
            <MenuItem onClick={() => {
              // TODO: Implement message candidate
              handleMenuClose();
            }}>
              <MessageIcon fontSize="small" sx={{ mr: 1 }} />
              Send Message
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => {
              // TODO: Implement view all applications
              handleMenuClose();
            }}>
              <WorkIcon fontSize="small" sx={{ mr: 1 }} />
              View All Applications
            </MenuItem>
          </>
        ) : selectedApplication ? (
          <>
            <MenuItem onClick={() => {
              navigate(`/app/applications/${selectedApplication._id}`);
              handleMenuClose();
            }}>
              <ViewIcon fontSize="small" sx={{ mr: 1 }} />
              View Details
            </MenuItem>
            <MenuItem onClick={() => {
              handleUpdateApplicationStatus(selectedApplication._id, 'shortlisted');
            }}>
              <ThumbUpIcon fontSize="small" sx={{ mr: 1 }} />
              Shortlist
            </MenuItem>
            <MenuItem onClick={() => {
              setScheduleInterviewOpen(true);
              handleMenuClose();
            }}>
              <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
              Schedule Interview
            </MenuItem>
            <MenuItem onClick={() => {
              setNotesDialogOpen(true);
              handleMenuClose();
            }}>
              <MessageIcon fontSize="small" sx={{ mr: 1 }} />
              Add Notes
            </MenuItem>
            <Divider />
            <MenuItem 
              onClick={() => {
                handleUpdateApplicationStatus(selectedApplication._id, 'rejected');
              }}
              sx={{ color: 'error.main' }}
            >
              <ThumbDownIcon fontSize="small" sx={{ mr: 1 }} />
              Reject
            </MenuItem>
          </>
        ) : null}
      </Menu>

      {/* Notes Dialog */}
      <Dialog open={notesDialogOpen} onClose={() => setNotesDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Notes</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Add your notes about this candidate..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotesDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => selectedApplication && handleAddNotes(selectedApplication._id, notes)}
            variant="contained"
            disabled={!notes.trim()}
          >
            Add Notes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={scheduleInterviewOpen} onClose={() => setScheduleInterviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Interview</DialogTitle>
        <DialogContent>
          <Typography color="textSecondary" gutterBottom>
            Schedule an interview with {selectedApplication?.applicant.firstName} {selectedApplication?.applicant.lastName}
          </Typography>
          {/* TODO: Add interview scheduling form */}
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Interview scheduling functionality will be implemented here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleInterviewOpen(false)}>Cancel</Button>
          <Button variant="contained">Schedule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployerCandidatesPage;
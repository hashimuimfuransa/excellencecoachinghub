import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Divider,
  Badge,
  Stack,
  LinearProgress
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  LocationOn,
  Work,
  School,
  Star,
  StarBorder,
  Download,
  Visibility,
  CheckCircle,
  Cancel,
  Schedule,
  Psychology,
  AutoAwesome,
  TrendingUp,
  FilterList,
  Search,
  Refresh
} from '@mui/icons-material';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { employerService } from '../services/employerService';
import { formatDistanceToNow } from 'date-fns';

interface Application {
  _id: string;
  applicant: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
    skills?: string[];
    experience?: any[];
    education?: any[];
    summary?: string;
    currentPosition?: string;
    avatar?: string;
    profileCompletion?: { percentage: number };
  };
  job: {
    _id: string;
    title: string;
    company: string;
    location?: string;
  };
  status: string;
  appliedAt: string;
  notes?: string;
  resume?: string;
  coverLetter?: string;
  psychometricTestResults?: any[];
  interviewResults?: any[];
  testScore?: number;
}

interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skillsRequired: string[];
  experienceLevel: string;
  applicationsCount?: number;
  type?: 'job' | 'internship'; // Add type to distinguish between jobs and internships
}

interface AIShortlistResult {
  applicationId: string;
  score: number;
  reasoning: string;
  strengths: string[];
  concerns: string[];
}

interface AIAnalysisData {
  jobTitle: string;
  totalApplications: number;
  shortlistedCandidates: AIShortlistResult[];
  summary: string;
  analysisDate: string;
}

const EmployerCandidatesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI Shortlisting states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<AIAnalysisData | null>(null);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedForShortlisting, setSelectedForShortlisting] = useState<string[]>([]);
  const [maxCandidates, setMaxCandidates] = useState(10);

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
  }, []);

  // Load applications when job is selected
  useEffect(() => {
    if (selectedJob) {
      loadApplications();
    }
  }, [selectedJob, statusFilter]);

  // Set initial job from URL params
  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (jobId && jobs.length > 0) {
      setSelectedJob(jobId);
    } else if (jobs.length > 0) {
      setSelectedJob(jobs[0]._id);
    }
  }, [jobs, searchParams]);

  const loadJobs = async () => {
    try {
      // Load both jobs and internships
      const [jobsResponse, internshipsResponse] = await Promise.all([
        employerService.getJobs().catch(err => {
          console.warn('Error loading jobs:', err);
          return { data: [] };
        }),
        employerService.getInternships().catch(err => {
          console.warn('Error loading internships:', err);
          return { data: [] };
        })
      ]);

      console.log('Jobs response:', jobsResponse); // Debug log
      console.log('Internships response:', internshipsResponse); // Debug log

      // Transform jobs to include type
      const jobs = (jobsResponse.data || []).map((job: any) => ({
        ...job,
        type: 'job' as const
      }));

      // Transform internships to match Job interface
      const internships = (internshipsResponse.data || []).map((internship: any) => ({
        _id: internship._id,
        title: internship.title,
        company: internship.company,
        location: internship.location,
        description: internship.description,
        requirements: internship.requirements || [],
        skillsRequired: internship.skills || [],
        experienceLevel: internship.experienceLevel,
        applicationsCount: internship.applicationsCount,
        type: 'internship' as const
      }));

      // Combine jobs and internships
      const allPostings = [...jobs, ...internships];
      setJobs(allPostings);
    } catch (error) {
      console.error('Error loading jobs and internships:', error);
    }
  };

  const loadApplications = async () => {
    if (!selectedJob) return;
    
    setLoading(true);
    try {
      // Find the selected job/internship to determine its type
      const selectedPosting = jobs.find(job => job._id === selectedJob);
      const postingType = selectedPosting?.type || 'job';
      
      const response = await employerService.getAllApplications(selectedJob, postingType);
      console.log('Applications response:', response); // Debug log
      setApplications(response.data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleJobChange = (jobId: string) => {
    setSelectedJob(jobId);
    setAiResults(null); // Clear AI results when changing jobs
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await employerService.updateApplicationStatus(applicationId, newStatus);
      loadApplications(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating application status:', error);
      // You could add a toast notification here
    }
  };

  const handleDownloadCV = async (candidateId: string) => {
    try {
      const { blob, filename, contentType } = await employerService.downloadCandidateCV(candidateId);
      // Handle file download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading CV:', error);
    }
  };

  // AI Shortlisting Functions
  const handleAIShortlist = async () => {
    if (!selectedJob) return;
    
    // Check if there are applications to analyze
    const applicationsToAnalyze = applications.filter(app => app.status === 'applied');
    if (applicationsToAnalyze.length === 0) {
      alert('No new applications to analyze. Please ensure there are candidates with "applied" status.');
      return;
    }
    
    setAiLoading(true);
    try {
      // Find the selected job/internship to determine its type
      const selectedPosting = jobs.find(job => job._id === selectedJob);
      const postingType = selectedPosting?.type || 'job';
      
      const response = await employerService.aiShortlistCandidates({
        jobId: selectedJob,
        maxCandidates,
        postingType
      });
      
      if (response.success && response.data) {
        setAiResults(response.data);
        setAiDialogOpen(true);
      } else {
        throw new Error(response.error || 'AI shortlisting failed');
      }
    } catch (error: any) {
      console.error('Error performing AI shortlisting:', error);
      alert(`AI shortlisting failed: ${error.message || 'Unknown error'}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAIShortlisting = async () => {
    if (!selectedForShortlisting.length) return;
    
    try {
      await employerService.applyAIShortlisting({
        applicationIds: selectedForShortlisting,
        notes: 'Shortlisted by AI recommendation'
      });
      setAiDialogOpen(false);
      setSelectedForShortlisting([]);
      loadApplications(); // Reload to show updated statuses
    } catch (error) {
      console.error('Error applying AI shortlisting:', error);
    }
  };

  const toggleCandidateSelection = (applicationId: string) => {
    setSelectedForShortlisting(prev => 
      prev.includes(applicationId) 
        ? prev.filter(id => id !== applicationId)
        : [...prev, applicationId]
    );
  };

  // Filter applications based on current tab and filters
  const getFilteredApplications = () => {
    let filtered = applications;

    // Filter by status based on tab
    switch (tabValue) {
      case 0: // All Applications
        if (statusFilter !== 'all') {
          filtered = filtered.filter(app => app.status === statusFilter);
        }
        break;
      case 1: // New Applications
        filtered = filtered.filter(app => app.status === 'applied');
        break;
      case 2: // Shortlisted
        filtered = filtered.filter(app => app.status === 'shortlisted');
        break;
      case 3: // Interviewed
        filtered = filtered.filter(app => app.status === 'interviewed');
        break;
      case 4: // Hired
        filtered = filtered.filter(app => app.status === 'hired');
        break;
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(app => 
        `${app.applicant.firstName} ${app.applicant.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (app.applicant.skills || []).some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    return filtered;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'applied': return 'default';
      case 'shortlisted': return 'primary';
      case 'interviewed': return 'info';
      case 'hired': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'applied': return <Schedule />;
      case 'shortlisted': return <Star />;
      case 'interviewed': return <Person />;
      case 'hired': return <CheckCircle />;
      case 'rejected': return <Cancel />;
      default: return <Schedule />;
    }
  };

  const selectedJobData = jobs.find(job => job._id === selectedJob);
  const filteredApplications = getFilteredApplications();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Candidate Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage applications and shortlist candidates using AI
        </Typography>
      </Box>

      {/* Job Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Select Job/Internship</InputLabel>
              <Select
                value={selectedJob}
                onChange={(e) => handleJobChange(e.target.value)}
                label="Select Job/Internship"
              >
                {jobs.map((job) => (
                  <MenuItem key={job._id} value={job._id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {job.type === 'internship' ? <School fontSize="small" /> : <Work fontSize="small" />}
                      <Box>
                        <Typography variant="body2">
                          {job.title} - {job.company}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {job.type === 'internship' ? 'Internship' : 'Job'} • {job.applicationsCount || 0} applications
                        </Typography>
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status Filter"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="applied">Applied</MenuItem>
                <MenuItem value="shortlisted">Shortlisted</MenuItem>
                <MenuItem value="interviewed">Interviewed</MenuItem>
                <MenuItem value="hired">Hired</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Stack direction="row" spacing={1}>
              <TextField
                size="small"
                type="number"
                label="Max Candidates"
                value={maxCandidates}
                onChange={(e) => setMaxCandidates(Math.max(1, Math.min(20, parseInt(e.target.value) || 10)))}
                sx={{ width: 120 }}
                inputProps={{ min: 1, max: 20 }}
              />
              <Button
                variant="contained"
                startIcon={aiLoading ? <CircularProgress size={20} /> : <AutoAwesome />}
                onClick={handleAIShortlist}
                disabled={!selectedJob || aiLoading || !applications.some(app => app.status === 'applied')}
                sx={{ flexGrow: 1 }}
              >
                {aiLoading ? 'Analyzing...' : 'AI Shortlist'}
              </Button>
              <IconButton onClick={loadApplications} disabled={loading}>
                <Refresh />
              </IconButton>
            </Stack>
          </Grid>
        </Grid>

        {selectedJobData && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {selectedJobData.type === 'internship' ? <School /> : <Work />}
              <Typography variant="h6">{selectedJobData.title}</Typography>
              <Chip 
                label={selectedJobData.type === 'internship' ? 'Internship' : 'Job'} 
                size="small" 
                color={selectedJobData.type === 'internship' ? 'success' : 'primary'}
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {selectedJobData.company} • {selectedJobData.location} • {applications.length} applications
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Tabs for different application views */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`All Applications (${applications.length})`} />
          <Tab label={`New (${applications.filter(app => app.status === 'applied').length})`} />
          <Tab label={`Shortlisted (${applications.filter(app => app.status === 'shortlisted').length})`} />
          <Tab label={`Interviewed (${applications.filter(app => app.status === 'interviewed').length})`} />
          <Tab label={`Hired (${applications.filter(app => app.status === 'hired').length})`} />
        </Tabs>
      </Paper>

      {/* Applications List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredApplications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No applications found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedJob ? 'No applications match your current filters.' : 'Please select a job to view applications.'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredApplications.map((application) => (
            <Grid item xs={12} key={application._id}>
              <Card>
                <CardContent>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6} md={4}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={application.applicant.avatar}
                          sx={{ width: 50, height: 50 }}
                        >
                          {application.applicant.firstName[0]}{application.applicant.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {application.applicant.firstName} {application.applicant.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {application.applicant.currentPosition || 'Job Seeker'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Applied {formatDistanceToNow(new Date(application.appliedAt))} ago
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(application.applicant.skills || []).slice(0, 3).map((skill) => (
                          <Chip key={skill} label={skill} size="small" />
                        ))}
                        {(application.applicant.skills || []).length > 3 && (
                          <Chip label={`+${(application.applicant.skills || []).length - 3}`} size="small" />
                        )}
                        {(!application.applicant.skills || application.applicant.skills.length === 0) && (
                          <Typography variant="caption" color="text.secondary">No skills listed</Typography>
                        )}
                      </Box>
                      {application.applicant.profileCompletion && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Profile: {application.applicant.profileCompletion.percentage}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={application.applicant.profileCompletion.percentage} 
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6} md={2}>
                      <Chip
                        label={application.status.toUpperCase()}
                        color={getStatusColor(application.status) as any}
                        icon={getStatusIcon(application.status)}
                        sx={{ minWidth: 100 }}
                      />
                      {application.testScore && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Test Score: {application.testScore}%
                          </Typography>
                        </Box>
                      )}
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleViewDetails(application)}
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          startIcon={<Download />}
                          onClick={() => handleDownloadCV(application.applicant._id)}
                        >
                          CV
                        </Button>
                        {application.status === 'applied' && (
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<Star />}
                            onClick={() => handleStatusUpdate(application._id, 'shortlisted')}
                          >
                            Shortlist
                          </Button>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* AI Results Dialog */}
      <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AutoAwesome color="primary" />
            AI Shortlisting Results
          </Box>
        </DialogTitle>
        <DialogContent>
          {aiResults && (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="h6">Analysis Summary</Typography>
                <Typography variant="body2">{aiResults.summary}</Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Job: {aiResults.jobTitle} • Total Applications: {aiResults.totalApplications} • 
                  Recommended: {aiResults.shortlistedCandidates.length} candidates
                </Typography>
              </Alert>

              <Typography variant="h6" gutterBottom>
                Recommended Candidates ({aiResults.shortlistedCandidates.length})
              </Typography>

              {aiResults.shortlistedCandidates.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    No candidates met the minimum score threshold of 60. Consider lowering your requirements or reviewing applications manually.
                  </Typography>
                </Alert>
              ) : (
                <List>
                {aiResults.shortlistedCandidates.map((result, index) => {
                  const application = applications.find(app => app._id === result.applicationId);
                  if (!application) return null;

                  return (
                    <React.Fragment key={result.applicationId}>
                      <ListItem>
                        <ListItemAvatar>
                          <Badge badgeContent={result.score} color="primary">
                            <Avatar src={application.applicant.avatar}>
                              {application.applicant.firstName[0]}{application.applicant.lastName[0]}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${application.applicant.firstName} ${application.applicant.lastName}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ mb: 1 }}>
                                {result.reasoning}
                              </Typography>
                              <Box sx={{ mb: 1 }}>
                                <Typography variant="caption" color="success.main">
                                  Strengths: {result.strengths.join(', ')}
                                </Typography>
                              </Box>
                              {result.concerns.length > 0 && (
                                <Box>
                                  <Typography variant="caption" color="warning.main">
                                    Concerns: {result.concerns.join(', ')}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Button
                            variant={selectedForShortlisting.includes(result.applicationId) ? "contained" : "outlined"}
                            onClick={() => toggleCandidateSelection(result.applicationId)}
                            startIcon={selectedForShortlisting.includes(result.applicationId) ? <CheckCircle /> : <StarBorder />}
                          >
                            {selectedForShortlisting.includes(result.applicationId) ? 'Selected' : 'Select'}
                          </Button>
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < aiResults.shortlistedCandidates.length - 1 && <Divider />}
                    </React.Fragment>
                  );
                })}
                </List>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApplyAIShortlisting}
            disabled={selectedForShortlisting.length === 0}
            startIcon={<CheckCircle />}
          >
            Shortlist Selected ({selectedForShortlisting.length})
          </Button>
        </DialogActions>
      </Dialog>

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Application Details
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Avatar
                      src={selectedApplication.applicant.avatar}
                      sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
                    >
                      {selectedApplication.applicant.firstName[0]}{selectedApplication.applicant.lastName[0]}
                    </Avatar>
                    <Typography variant="h6">
                      {selectedApplication.applicant.firstName} {selectedApplication.applicant.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedApplication.applicant.currentPosition || 'Job Seeker'}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={8}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" />
                      <Typography>{selectedApplication.applicant.email}</Typography>
                    </Box>
                    
                    {selectedApplication.applicant.phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Phone fontSize="small" />
                        <Typography>{selectedApplication.applicant.phone}</Typography>
                      </Box>
                    )}
                    
                    {selectedApplication.applicant.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" />
                        <Typography>{selectedApplication.applicant.location}</Typography>
                      </Box>
                    )}
                  </Stack>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>Skills</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(selectedApplication.applicant.skills || []).length > 0 ? (
                      selectedApplication.applicant.skills!.map((skill) => (
                        <Chip key={skill} label={skill} />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">No skills listed</Typography>
                    )}
                  </Box>
                </Grid>

                {selectedApplication.applicant.summary && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Summary</Typography>
                    <Typography variant="body2">{selectedApplication.applicant.summary}</Typography>
                  </Grid>
                )}

                {selectedApplication.coverLetter && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Cover Letter</Typography>
                    <Typography variant="body2">{selectedApplication.coverLetter}</Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedApplication && (
            <>
              <Button
                startIcon={<Download />}
                onClick={() => handleDownloadCV(selectedApplication.applicant._id)}
              >
                Download CV
              </Button>
              {selectedApplication.status === 'applied' && (
                <Button
                  variant="contained"
                  startIcon={<Star />}
                  onClick={() => {
                    handleStatusUpdate(selectedApplication._id, 'shortlisted');
                    setDetailsOpen(false);
                  }}
                >
                  Shortlist
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmployerCandidatesPage;
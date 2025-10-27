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
  Badge,
  LinearProgress,
  Tabs,
  Tab,
  Collapse,
  Link as MuiLink
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Assessment as AssessmentIcon,
  VideoCall as InterviewIcon,
  Schedule as ScheduleIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  PictureAsPdf as PdfIcon,
  Description as FileIcon,
  Grade as GradeIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface TestResult {
  _id: string;
  testName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  categories: Array<{
    name: string;
    score: number;
    maxScore: number;
  }>;
  completedAt: string;
}

interface InterviewResult {
  _id: string;
  overallScore: number;
  responses: Array<{
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }>;
  completedAt: string;
}

interface Application {
  _id: string;
  applicant: {
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
      description: string;
    }>;
    education?: Array<{
      institution: string;
      degree: string;
      startDate: string;
      endDate?: string;
    }>;
  };
  job: {
    _id: string;
    title: string;
    company: string;
    location: string;
  };
  status: string;
  appliedAt: string;
  resume?: string;
  coverLetter?: string;
  psychometricTestResults: TestResult[];
  interviewResults: InterviewResult[];
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
      id={`applications-tabpanel-${index}`}
      aria-labelledby={`applications-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const JobApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const { user } = useAuth();
  const [job, setJob] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  // Menu and dialog states
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notesDialog, setNotesDialog] = useState(false);
  const [interviewDialog, setInterviewDialog] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (jobId) {
      fetchJobAndApplications();
    }
  }, [jobId, statusFilter]);

  const fetchJobAndApplications = async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await fetch(`${import.meta.env.VITE_API_URL}/jobs/${jobId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData.data);
      }

      // Fetch applications for this job
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const appsResponse = await fetch(
        `${import.meta.env.VITE_API_URL}/employer/jobs/${jobId}/applications?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!appsResponse.ok) {
        throw new Error('Failed to fetch applications');
      }

      const appsData = await appsResponse.json();
      setApplications(appsData.data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, application: Application) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedApplication(application);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedApplication(null);
  };

  const handleStatusUpdate = async (applicationId: string, status: string) => {
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
        throw new Error('Failed to update status');
      }

      fetchJobAndApplications();
      handleMenuClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleAddNotes = async () => {
    if (!selectedApplication || !notes.trim()) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/employer/applications/${selectedApplication._id}/notes`,
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

      fetchJobAndApplications();
      setNotesDialog(false);
      setNotes('');
    } catch (err: any) {
      setError(err.message || 'Failed to add notes');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'applied': return 'info';
      case 'shortlisted': return 'success';
      case 'interview_scheduled': return 'warning';
      case 'interviewed': return 'primary';
      case 'offered': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'success.main';
    if (percentage >= 60) return 'warning.main';
    return 'error.main';
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const ApplicationCard = ({ application }: { application: Application }) => {
    const hasTests = application.psychometricTestResults.length > 0;
    const hasInterviews = application.interviewResults.length > 0;
    const avgTestScore = hasTests 
      ? application.psychometricTestResults.reduce((sum, test) => sum + test.percentage, 0) / application.psychometricTestResults.length
      : 0;
    const avgInterviewScore = hasInterviews
      ? application.interviewResults.reduce((sum, interview) => sum + interview.overallScore, 0) / application.interviewResults.length
      : 0;

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="flex-start" gap={2}>
            <Avatar
              src={application.applicant.avatar}
              sx={{ width: 60, height: 60 }}
              onClick={() => {
                setSelectedApplication(application);
                setDetailsOpen(true);
              }}
              style={{ cursor: 'pointer' }}
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
                    {application.applicant.email}
                  </Typography>
                  {application.applicant.location && (
                    <Typography variant="body2" color="textSecondary">
                      📍 {application.applicant.location}
                    </Typography>
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Chip 
                    label={application.status} 
                    size="small" 
                    color={getStatusColor(application.status) as any}
                  />
                  <IconButton onClick={(e) => handleMenuClick(e, application)}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Skills */}
              {application.applicant.skills && application.applicant.skills.length > 0 && (
                <Box display="flex" gap={0.5} mb={2} flexWrap="wrap">
                  {application.applicant.skills.slice(0, 3).map((skill, index) => (
                    <Chip key={index} label={skill} size="small" variant="outlined" />
                  ))}
                  {application.applicant.skills.length > 3 && (
                    <Chip 
                      label={`+${application.applicant.skills.length - 3}`} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Box>
              )}

              {/* Test and Interview Scores */}
              <Box display="flex" gap={3} mb={2}>
                {hasTests && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <AssessmentIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Test Score
                      </Typography>
                      <Typography variant="body2" sx={{ color: getScoreColor(avgTestScore) }}>
                        {Math.round(avgTestScore)}%
                      </Typography>
                    </Box>
                  </Box>
                )}
                
                {hasInterviews && (
                  <Box display="flex" alignItems="center" gap={1}>
                    <InterviewIcon fontSize="small" color="action" />
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        Interview Score
                      </Typography>
                      <Typography variant="body2" sx={{ color: getScoreColor(avgInterviewScore) }}>
                        {Math.round(avgInterviewScore)}%
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Quick actions */}
              <Box display="flex" gap={1}>
                <Button
                  size="small"
                  startIcon={<ViewIcon />}
                  onClick={() => {
                    setSelectedApplication(application);
                    setDetailsOpen(true);
                  }}
                >
                  View Details
                </Button>
                {application.resume && (
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    component="a"
                    href={application.resume}
                    target="_blank"
                  >
                    Resume
                  </Button>
                )}
                <Typography variant="caption" color="textSecondary" sx={{ alignSelf: 'center', ml: 'auto' }}>
                  Applied {formatDate(application.appliedAt)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="rectangular" width="100%" height={200} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" component="h1">
            Applications for {job?.title}
          </Typography>
          <Typography color="textSecondary">
            {applications.length} applications • {job?.company}
          </Typography>
        </Box>
      </Box>

      {/* Status Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab 
            label={`All (${applications.length})`}
            onClick={() => setStatusFilter('all')}
          />
          <Tab 
            label={`New (${applications.filter(app => app.status === 'applied').length})`}
            onClick={() => setStatusFilter('applied')}
          />
          <Tab 
            label={`Shortlisted (${applications.filter(app => app.status === 'shortlisted').length})`}
            onClick={() => setStatusFilter('shortlisted')}
          />
          <Tab 
            label={`Interviewed (${applications.filter(app => app.status === 'interviewed').length})`}
            onClick={() => setStatusFilter('interviewed')}
          />
        </Tabs>
      </Box>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={6}>
              <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No applications found
              </Typography>
              <Typography color="textSecondary">
                {statusFilter === 'all' 
                  ? "No one has applied to this job yet."
                  : `No applications with status "${statusFilter}".`
                }
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        applications.map((application) => (
          <ApplicationCard key={application._id} application={application} />
        ))
      )}

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedApplication?.applicant.firstName} {selectedApplication?.applicant.lastName}
            </Typography>
            <Chip 
              label={selectedApplication?.status} 
              color={getStatusColor(selectedApplication?.status || '') as any}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedApplication && (
            <Box>
              {/* Contact Info */}
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>Contact Information</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Email</Typography>
                    <Typography variant="body1">{selectedApplication.applicant.email}</Typography>
                  </Grid>
                  {selectedApplication.applicant.phone && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Phone</Typography>
                      <Typography variant="body1">{selectedApplication.applicant.phone}</Typography>
                    </Grid>
                  )}
                  {selectedApplication.applicant.location && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Location</Typography>
                      <Typography variant="body1">{selectedApplication.applicant.location}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Bio */}
              {selectedApplication.applicant.bio && (
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>About</Typography>
                  <Typography variant="body2">{selectedApplication.applicant.bio}</Typography>
                </Box>
              )}

              {/* Skills */}
              {selectedApplication.applicant.skills && selectedApplication.applicant.skills.length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>Skills</Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap">
                    {selectedApplication.applicant.skills.map((skill, index) => (
                      <Chip key={index} label={skill} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Experience */}
              {selectedApplication.applicant.experience && selectedApplication.applicant.experience.length > 0 && (
                <Box mb={3}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="space-between"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => toggleSection('experience')}
                  >
                    <Typography variant="subtitle1">Experience</Typography>
                    {expandedSections.experience ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>
                  <Collapse in={expandedSections.experience}>
                    <Box mt={2}>
                      {selectedApplication.applicant.experience.map((exp, index) => (
                        <Card key={index} sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle2">{exp.position}</Typography>
                            <Typography variant="body2" color="textSecondary">{exp.company}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                            </Typography>
                            {exp.description && (
                              <Typography variant="body2" sx={{ mt: 1 }}>{exp.description}</Typography>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              )}

              {/* Test Results */}
              {selectedApplication.psychometricTestResults.length > 0 && (
                <Box mb={3}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="space-between"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => toggleSection('tests')}
                  >
                    <Typography variant="subtitle1">Test Results</Typography>
                    {expandedSections.tests ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>
                  <Collapse in={expandedSections.tests}>
                    <Box mt={2}>
                      {selectedApplication.psychometricTestResults.map((test, index) => (
                        <Card key={index} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                              <Typography variant="subtitle2">{test.testName}</Typography>
                              <Chip 
                                label={`${test.percentage}%`} 
                                color={test.percentage >= 80 ? 'success' : test.percentage >= 60 ? 'warning' : 'error'}
                                size="small"
                              />
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={test.percentage} 
                              sx={{ mb: 2 }}
                            />
                            <Typography variant="caption" color="textSecondary">
                              Completed on {formatDate(test.completedAt)}
                            </Typography>
                            
                            {test.categories && test.categories.length > 0 && (
                              <Box mt={2}>
                                <Typography variant="body2" gutterBottom>Category Breakdown:</Typography>
                                {test.categories.map((category, catIndex) => (
                                  <Box key={catIndex} display="flex" justifyContent="space-between" alignItems="center">
                                    <Typography variant="caption">{category.name}</Typography>
                                    <Typography variant="caption">
                                      {category.score}/{category.maxScore} ({Math.round((category.score/category.maxScore) * 100)}%)
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              )}

              {/* Interview Results */}
              {selectedApplication.interviewResults.length > 0 && (
                <Box mb={3}>
                  <Box 
                    display="flex" 
                    alignItems="center" 
                    justifyContent="space-between"
                    sx={{ cursor: 'pointer' }}
                    onClick={() => toggleSection('interviews')}
                  >
                    <Typography variant="subtitle1">Interview Results</Typography>
                    {expandedSections.interviews ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </Box>
                  <Collapse in={expandedSections.interviews}>
                    <Box mt={2}>
                      {selectedApplication.interviewResults.map((interview, index) => (
                        <Card key={index} sx={{ mb: 2 }}>
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                              <Typography variant="subtitle2">AI Interview</Typography>
                              <Chip 
                                label={`${interview.overallScore}%`} 
                                color={interview.overallScore >= 80 ? 'success' : interview.overallScore >= 60 ? 'warning' : 'error'}
                                size="small"
                              />
                            </Box>
                            <Typography variant="caption" color="textSecondary">
                              Completed on {formatDate(interview.completedAt)}
                            </Typography>
                            
                            {interview.responses && interview.responses.length > 0 && (
                              <Box mt={2}>
                                <Typography variant="body2" gutterBottom>Responses:</Typography>
                                {interview.responses.slice(0, 2).map((response, respIndex) => (
                                  <Box key={respIndex} mb={1}>
                                    <Typography variant="caption" fontWeight="bold">
                                      Q: {response.question}
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                      A: {response.answer}
                                    </Typography>
                                    <Box display="flex" justifyContent="between" alignItems="center">
                                      <Typography variant="caption" color="textSecondary">
                                        Score: {response.score}%
                                      </Typography>
                                    </Box>
                                  </Box>
                                ))}
                                {interview.responses.length > 2 && (
                                  <Typography variant="caption" color="textSecondary">
                                    ... and {interview.responses.length - 2} more responses
                                  </Typography>
                                )}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Collapse>
                </Box>
              )}

              {/* Application Documents */}
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>Documents</Typography>
                <Grid container spacing={1}>
                  {selectedApplication.resume && (
                    <Grid item>
                      <Button
                        variant="outlined"
                        startIcon={<PdfIcon />}
                        component="a"
                        href={selectedApplication.resume}
                        target="_blank"
                        size="small"
                      >
                        Resume
                      </Button>
                    </Grid>
                  )}
                  {selectedApplication.coverLetter && (
                    <Grid item>
                      <Button
                        variant="outlined"
                        startIcon={<FileIcon />}
                        size="small"
                      >
                        Cover Letter
                      </Button>
                    </Grid>
                  )}
                </Grid>
              </Box>

              {/* Notes */}
              {selectedApplication.notes && (
                <Box mb={3}>
                  <Typography variant="subtitle1" gutterBottom>Notes</Typography>
                  <Typography variant="body2">{selectedApplication.notes}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button 
            startIcon={<ScheduleIcon />}
            onClick={() => setInterviewDialog(true)}
          >
            Schedule Interview
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (selectedApplication) {
                handleStatusUpdate(selectedApplication._id, 'shortlisted');
                setDetailsOpen(false);
              }
            }}
          >
            Shortlist Candidate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => {
          if (selectedApplication) {
            setDetailsOpen(true);
          }
          handleMenuClose();
        }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => {
          if (selectedApplication) {
            handleStatusUpdate(selectedApplication._id, 'shortlisted');
          }
        }}>
          <ThumbUpIcon fontSize="small" sx={{ mr: 1 }} />
          Shortlist
        </MenuItem>
        <MenuItem onClick={() => {
          setNotesDialog(true);
          handleMenuClose();
        }}>
          <StarIcon fontSize="small" sx={{ mr: 1 }} />
          Add Notes
        </MenuItem>
        <MenuItem onClick={() => {
          setInterviewDialog(true);
          handleMenuClose();
        }}>
          <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
          Schedule Interview
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (selectedApplication) {
            handleStatusUpdate(selectedApplication._id, 'rejected');
          }
        }} sx={{ color: 'error.main' }}>
          <ThumbDownIcon fontSize="small" sx={{ mr: 1 }} />
          Reject
        </MenuItem>
      </Menu>

      {/* Notes Dialog */}
      <Dialog open={notesDialog} onClose={() => setNotesDialog(false)} maxWidth="sm" fullWidth>
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
          <Button onClick={() => setNotesDialog(false)}>Cancel</Button>
          <Button onClick={handleAddNotes} variant="contained">
            Add Notes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Interview Dialog */}
      <Dialog open={interviewDialog} onClose={() => setInterviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Schedule Interview</DialogTitle>
        <DialogContent>
          <Typography>
            Interview scheduling functionality would be implemented here.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInterviewDialog(false)}>Cancel</Button>
          <Button variant="contained">Schedule</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobApplicationsPage;
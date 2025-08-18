import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  Avatar,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Badge,
  Paper
} from '@mui/material';
import {
  Quiz,
  Assignment,
  Schedule,
  PlayArrow,
  Info,
  AccessTime,
  Grade,
  Warning,
  CheckCircle,
  Security,
  Videocam,
  Download,
  Upload,
  EmojiEvents,
  School,
  TrendingUp,
  AssignmentTurnedIn
} from '@mui/icons-material';
import { format } from 'date-fns';
import { enhancedAssessmentService, IEnhancedAssessment, IAssessmentSubmission, ICertificate } from '../../services/enhancedAssessmentService';
import { useAuth } from '../../hooks/useAuth';

const EnhancedAssessments: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [assessments, setAssessments] = useState<IEnhancedAssessment[]>([]);
  const [submissions, setSubmissions] = useState<IAssessmentSubmission[]>([]);
  const [certificates, setCertificates] = useState<ICertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: 'all',
    courseId: 'all',
    status: 'all',
    search: ''
  });
  const [selectedAssessment, setSelectedAssessment] = useState<IEnhancedAssessment | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'assessments' | 'submissions' | 'certificates'>('assessments');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'assessments') {
        const filterParams: any = {
          page,
          limit: 12
        };

        if (filters.type !== 'all') {
          filterParams.type = filters.type;
        }

        if (filters.courseId !== 'all') {
          filterParams.courseId = filters.courseId;
        }

        if (filters.status !== 'all') {
          filterParams.status = filters.status;
        }

        const response = await enhancedAssessmentService.getStudentAssessments(filterParams);
        
        // Filter by search term locally
        let filteredAssessments = response.assessments;
        if (filters.search) {
          filteredAssessments = response.assessments.filter(assessment =>
            assessment.title.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        setAssessments(filteredAssessments);
        setTotalPages(response.pagination.totalPages);
      } else if (activeTab === 'submissions') {
        const submissionsData = await enhancedAssessmentService.getStudentSubmissions();
        setSubmissions(submissionsData);
      } else if (activeTab === 'certificates') {
        const certificatesData = await enhancedAssessmentService.getStudentCertificates();
        setCertificates(certificatesData);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, filters, activeTab]);

  // Load data
  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleStartAssessment = async (assessment: IEnhancedAssessment) => {
    try {
      // Navigate to the enhanced assessment taking page
      navigate(`/assignment/:assignmentId`);
    } catch (error) {
      console.error('Error starting assessment:', error);
    }
  };

  const showAssessmentInfo = (assessment: IEnhancedAssessment) => {
    setSelectedAssessment(assessment);
    setInfoDialogOpen(true);
  };

  const getAssessmentStatus = (assessment: IEnhancedAssessment) => {
    const now = new Date();
    const dueDate = assessment.dueDate ? new Date(assessment.dueDate) : null;
    const scheduledDate = assessment.scheduledDate ? new Date(assessment.scheduledDate) : null;

    if (assessment.status === 'draft') return { status: 'Draft', color: 'default' as const };
    if (assessment.status === 'archived') return { status: 'Archived', color: 'default' as const };

    if (scheduledDate && now < scheduledDate) {
      return { status: 'Scheduled', color: 'info' as const };
    }

    if (dueDate && now > dueDate) {
      return { status: 'Overdue', color: 'error' as const };
    }

    return { status: 'Available', color: 'success' as const };
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Quiz />;
      case 'assignment':
        return <Assignment />;
      case 'final':
        return <School />;
      default:
        return <Quiz />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'primary';
      case 'assignment':
        return 'secondary';
      case 'final':
        return 'error';
      default:
        return 'default';
    }
  };

  const getSubmissionStatus = (submission: IAssessmentSubmission) => {
    switch (submission.status) {
      case 'draft':
        return { status: 'Draft', color: 'default' as const };
      case 'submitted':
        return { status: 'Submitted', color: 'info' as const };
      case 'ai_graded':
        return { status: 'AI Graded', color: 'warning' as const };
      case 'teacher_reviewed':
        return { status: 'Teacher Reviewed', color: 'success' as const };
      case 'finalized':
        return { status: 'Finalized', color: 'success' as const };
      default:
        return { status: 'Unknown', color: 'default' as const };
    }
  };

  const getCertificateStatus = (certificate: ICertificate) => {
    switch (certificate.status) {
      case 'pending':
        return { status: 'Pending', color: 'warning' as const };
      case 'issued':
        return { status: 'Issued', color: 'success' as const };
      case 'expired':
        return { status: 'Expired', color: 'error' as const };
      case 'revoked':
        return { status: 'Revoked', color: 'error' as const };
      default:
        return { status: 'Unknown', color: 'default' as const };
    }
  };

  const handleDownloadCertificate = async (certificate: ICertificate) => {
    try {
      const blob = await enhancedAssessmentService.downloadCertificatePDF(certificate._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificate-${certificate.certificateNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading certificate:', error);
    }
  };

  const renderAssessmentsTab = () => (
    <>
      {/* Filters */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Search assessments"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                label="Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="assignment">Assignment</MenuItem>
                <MenuItem value="final">Final</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Assessments Grid */}
      <Grid container spacing={3}>
        {assessments.map((assessment) => {
          const status = getAssessmentStatus(assessment);
          return (
            <Grid item xs={12} sm={6} md={4} key={assessment._id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                minHeight: { xs: 350, sm: 320 },
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}>
                <CardContent sx={{ 
                  flexGrow: 1,
                  p: { xs: 2, sm: 3 },
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${getTypeColor(assessment.type)}.main`, mr: 1 }}>
                      {getTypeIcon(assessment.type)}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" noWrap>
                        {assessment.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {assessment.description || 'No description available'}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={status.status}
                      color={status.color}
                      size="small"
                    />
                    {assessment.requireProctoring && (
                      <Chip
                        icon={<Security />}
                        label="Proctored"
                        color="warning"
                        size="small"
                      />
                    )}
                    {assessment.autoGrade && (
                      <Chip
                        icon={<TrendingUp />}
                        label="Auto Grade"
                        color="info"
                        size="small"
                      />
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2">
                      <Grade sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                      {assessment.totalPoints} points
                    </Typography>
                    {assessment.duration && (
                      <Typography variant="body2">
                        <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {assessment.duration} min
                      </Typography>
                    )}
                  </Box>

                  {assessment.dueDate && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Due: {format(new Date(assessment.dueDate), 'MMM dd, yyyy')}
                    </Typography>
                  )}

                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1, 
                    mt: 'auto',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: 'stretch'
                  }}>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrow />}
                      onClick={() => handleStartAssessment(assessment)}
                      fullWidth
                      disabled={status.status === 'Draft' || status.status === 'Archived'}
                      sx={{
                        minHeight: { xs: 48, sm: 36 },
                        fontSize: { xs: '1rem', sm: '0.875rem' },
                        fontWeight: 'bold',
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                          transform: 'translateY(-1px)'
                        },
                        '&:disabled': {
                          opacity: 0.6
                        }
                      }}
                    >
                      Start Assessment
                    </Button>
                    <IconButton
                      onClick={() => showAssessmentInfo(assessment)}
                      size="small"
                      sx={{
                        minWidth: { xs: 48, sm: 'auto' },
                        minHeight: { xs: 48, sm: 'auto' },
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          backgroundColor: 'action.hover'
                        }
                      }}
                    >
                      <Info />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </>
  );

  const renderSubmissionsTab = () => (
    <List>
      {submissions.map((submission) => {
        const status = getSubmissionStatus(submission);
        return (
          <ListItem
            key={submission._id}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 1,
              mb: 1,
              bgcolor: 'background.paper'
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: `${status.color}.main` }}>
                <AssignmentTurnedIn />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={submission.assessmentId}
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Submitted: {submission.submittedAt ? format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm') : 'Not submitted'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time spent: {Math.floor(submission.timeSpent / 60)}m {submission.timeSpent % 60}s
                  </Typography>
                  {submission.score !== undefined && (
                    <Typography variant="body2" color="text.secondary">
                      Score: {submission.score}/{submission.totalPoints} ({submission.percentage}%)
                    </Typography>
                  )}
                </Box>
              }
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={status.status}
                color={status.color}
                size="small"
              />
              {submission.grade && (
                <Chip
                  label={submission.grade}
                  color="primary"
                  size="small"
                />
              )}
            </Box>
          </ListItem>
        );
      })}
    </List>
  );

  const renderCertificatesTab = () => (
    <Grid container spacing={3}>
      {certificates.map((certificate) => {
        const status = getCertificateStatus(certificate);
        return (
          <Grid item xs={12} sm={6} md={4} key={certificate._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'success.main', mr: 1 }}>
                    <EmojiEvents />
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" noWrap>
                      Certificate #{certificate.certificateNumber}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Course Completion
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Issued on {format(new Date(certificate.issueDate), 'MMM dd, yyyy')}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip
                    label={status.status}
                    color={status.color}
                    size="small"
                  />
                  <Chip
                    label={certificate.grade}
                    color="primary"
                    size="small"
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body2">
                    Score: {certificate.score}/{certificate.totalPoints}
                  </Typography>
                  <Typography variant="body2">
                    {certificate.score}%
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleDownloadCertificate(certificate)}
                    fullWidth
                    disabled={!certificate.pdfUrl}
                  >
                    Download PDF
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Enhanced Assessments
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant={activeTab === 'assessments' ? 'contained' : 'text'}
            onClick={() => setActiveTab('assessments')}
            startIcon={<Quiz />}
          >
            Assessments
          </Button>
          <Button
            variant={activeTab === 'submissions' ? 'contained' : 'text'}
            onClick={() => setActiveTab('submissions')}
            startIcon={<AssignmentTurnedIn />}
          >
            Submissions
          </Button>
          <Button
            variant={activeTab === 'certificates' ? 'contained' : 'text'}
            onClick={() => setActiveTab('certificates')}
            startIcon={<EmojiEvents />}
          >
            Certificates
          </Button>
        </Box>
      </Box>

      {/* Tab Content */}
      {activeTab === 'assessments' && renderAssessmentsTab()}
      {activeTab === 'submissions' && renderSubmissionsTab()}
      {activeTab === 'certificates' && renderCertificatesTab()}

      {/* Assessment Info Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedAssessment && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getTypeIcon(selectedAssessment.type)}
                {selectedAssessment.title}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedAssessment.description}
              </Typography>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body2">
                    {selectedAssessment.type.charAt(0).toUpperCase() + selectedAssessment.type.slice(1)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Points
                  </Typography>
                  <Typography variant="body2">
                    {selectedAssessment.totalPoints}
                  </Typography>
                </Grid>
                {selectedAssessment.duration && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Duration
                    </Typography>
                    <Typography variant="body2">
                      {selectedAssessment.duration} minutes
                    </Typography>
                  </Grid>
                )}
                {selectedAssessment.dueDate && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Due Date
                    </Typography>
                    <Typography variant="body2">
                      {format(new Date(selectedAssessment.dueDate), 'MMM dd, yyyy')}
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {selectedAssessment.requireProctoring && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This assessment requires proctoring with camera and screen sharing enabled.
                </Alert>
              )}

              {selectedAssessment.autoGrade && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  This assessment will be automatically graded upon submission.
                </Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setInfoDialogOpen(false)}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setInfoDialogOpen(false);
                  handleStartAssessment(selectedAssessment);
                }}
              >
                Start Assessment
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default EnhancedAssessments;

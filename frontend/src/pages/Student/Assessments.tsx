import React, { useState, useEffect } from 'react';
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
  DialogActions
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
  Videocam
} from '@mui/icons-material';
import { format } from 'date-fns';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import ProctoringMonitor, { ProctoringViolation, ProctoringStatus } from '../../components/Proctoring/ProctoringMonitor';

const StudentAssessments: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: 'all',
    courseId: 'all',
    search: ''
  });
  const [selectedAssessment, setSelectedAssessment] = useState<IAssessment | null>(null);
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);

  // Load assessments
  useEffect(() => {
    loadAssessments();
  }, [page, filters]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError(null);

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

      const response = await assessmentService.getStudentAssessments(filterParams);
      
      // Filter by search term locally
      let filteredAssessments = response.assessments;
      if (filters.search) {
        filteredAssessments = response.assessments.filter(assessment =>
          assessment.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          assessment.course.title.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setAssessments(filteredAssessments);
      setTotalPages(response.pagination.totalPages);

    } catch (err: any) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filters change
  };

  // Handle assessment start
  const handleStartAssessment = async (assessment: IAssessment) => {
    try {
      const response = await assessmentService.startAssessment(assessment._id);
      navigate(`/dashboard/student/assessments/${assessment._id}/take`, {
        state: { submission: response.submission, assessment: response.assessment }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to start assessment');
    }
  };

  // Show assessment info
  const showAssessmentInfo = (assessment: IAssessment) => {
    setSelectedAssessment(assessment);
    setInfoDialogOpen(true);
  };

  // Get assessment status
  const getAssessmentStatus = (assessment: any) => {
    if (assessment.isExpired) {
      return { label: 'Expired', color: 'error' as const, icon: <Warning /> };
    }
    if (!assessment.isAvailable) {
      return { label: 'Not Available', color: 'default' as const, icon: <Schedule /> };
    }
    if (assessment.attemptsUsed >= assessment.attempts) {
      return { label: 'Completed', color: 'success' as const, icon: <CheckCircle /> };
    }
    if (assessment.submissionStatus === 'draft') {
      return { label: 'In Progress', color: 'warning' as const, icon: <PlayArrow /> };
    }
    return { label: 'Available', color: 'primary' as const, icon: <PlayArrow /> };
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Quiz />;
      case 'assignment':
        return <Assignment />;
      case 'exam':
        return <Grade />;
      default:
        return <Assignment />;
    }
  };

  if (loading && assessments.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Assessments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Take quizzes, assignments, and exams for your enrolled courses
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search assessments..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="assignment">Assignment</MenuItem>
                  <MenuItem value="exam">Exam</MenuItem>
                  <MenuItem value="project">Project</MenuItem>
                  <MenuItem value="homework">Homework</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Course</InputLabel>
                <Select
                  value={filters.courseId}
                  label="Course"
                  onChange={(e) => handleFilterChange('courseId', e.target.value)}
                >
                  <MenuItem value="all">All Courses</MenuItem>
                  {/* TODO: Add actual courses */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilters({ type: 'all', courseId: 'all', search: '' });
                  setPage(1);
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Assessments Grid */}
      {assessments.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Quiz sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No assessments found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filters.search || filters.type !== 'all' || filters.courseId !== 'all'
                  ? 'Try adjusting your filters to see more assessments.'
                  : 'No assessments are currently available.'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {assessments.map((assessment) => {
              const status = getAssessmentStatus(assessment);
              
              return (
                <Grid item xs={12} sm={6} md={4} key={assessment._id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flex: 1 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          {getTypeIcon(assessment.type)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="h6" noWrap>
                            {assessment.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {assessment.course.title}
                          </Typography>
                        </Box>
                        <Tooltip title="Assessment Info">
                          <IconButton
                            size="small"
                            onClick={() => showAssessmentInfo(assessment)}
                          >
                            <Info />
                          </IconButton>
                        </Tooltip>
                      </Box>

                      {/* Status and Type */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                        <Chip
                          label={status.label}
                          color={status.color}
                          size="small"
                          icon={status.icon}
                        />
                        <Chip
                          label={assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                          variant="outlined"
                          size="small"
                        />
                      </Box>

                      {/* Details */}
                      <Box sx={{ mb: 2 }}>
                        {assessment.totalPoints && (
                          <Typography variant="body2" color="text.secondary">
                            <Grade sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {assessment.totalPoints} points
                          </Typography>
                        )}
                        {assessment.timeLimit && (
                          <Typography variant="body2" color="text.secondary">
                            <AccessTime sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {assessment.timeLimit} minutes
                          </Typography>
                        )}
                        {assessment.dueDate && (
                          <Typography variant="body2" color="text.secondary">
                            <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            Due: {format(new Date(assessment.dueDate), 'MMM dd, yyyy')}
                          </Typography>
                        )}
                      </Box>

                      {/* Attempts */}
                      {(assessment as any).attemptsUsed !== undefined && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Attempts: {(assessment as any).attemptsUsed} / {assessment.attempts}
                        </Typography>
                      )}

                      {/* Description */}
                      {assessment.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}
                        >
                          {assessment.description}
                        </Typography>
                      )}
                    </CardContent>

                    {/* Actions */}
                    <Box sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => handleStartAssessment(assessment)}
                        disabled={!status.label.includes('Available') && !status.label.includes('In Progress')}
                      >
                        {status.label.includes('In Progress') ? 'Continue' : 'Start Assessment'}
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Assessment Info Dialog */}
      <Dialog
        open={infoDialogOpen}
        onClose={() => setInfoDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Assessment Information
        </DialogTitle>
        <DialogContent>
          {selectedAssessment && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedAssessment.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedAssessment.course.title}
              </Typography>
              
              {selectedAssessment.description && (
                <Typography variant="body1" paragraph>
                  {selectedAssessment.description}
                </Typography>
              )}

              {selectedAssessment.instructions && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Instructions:
                  </Typography>
                  <Typography variant="body2">
                    {selectedAssessment.instructions}
                  </Typography>
                </Box>
              )}

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Type:</strong> {selectedAssessment.type.charAt(0).toUpperCase() + selectedAssessment.type.slice(1)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Points:</strong> {selectedAssessment.totalPoints || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Time Limit:</strong> {selectedAssessment.timeLimit ? `${selectedAssessment.timeLimit} minutes` : 'No limit'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">
                    <strong>Attempts:</strong> {selectedAssessment.attempts}
                  </Typography>
                </Grid>
                {selectedAssessment.dueDate && (
                  <Grid item xs={12}>
                    <Typography variant="body2">
                      <strong>Due Date:</strong> {format(new Date(selectedAssessment.dueDate), 'MMMM dd, yyyy at hh:mm a')}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInfoDialogOpen(false)}>
            Close
          </Button>
          {selectedAssessment && (
            <Button
              variant="contained"
              onClick={() => {
                setInfoDialogOpen(false);
                handleStartAssessment(selectedAssessment);
              }}
            >
              Start Assessment
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentAssessments;

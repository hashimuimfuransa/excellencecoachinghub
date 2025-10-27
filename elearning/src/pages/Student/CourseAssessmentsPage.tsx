import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack,
  Quiz,
  CheckCircle,
  Schedule,
  PlayArrow,
  Visibility,
  Warning,
  Info,
  Timer,
  CalendarToday,
  Grade,
  TrendingUp,
  Assessment,
  School,
  EmojiEvents,
  Speed,
  Psychology
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { assessmentService } from '../../services/assessmentService';

interface Assessment {
  _id: string;
  title: string;
  description?: string;
  course: {
    _id: string;
    title: string;
  } | string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  } | string;
  type: 'quiz' | 'assignment' | 'exam' | 'project' | 'homework';
  status: 'draft' | 'published' | 'archived';
  questions: any[];
  totalPoints: number;
  totalQuestions: number;
  timeLimit?: number;
  attempts: number;
  dueDate?: string;
  scheduledDate?: Date;
  availableFrom?: string;
  availableUntil?: string;
  instructions?: string;
  isPublished: boolean;
  allowLateSubmission: boolean;
  lateSubmissionPenalty?: number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  requireProctoring: boolean;
  requireCamera: boolean;
  aiCheatingDetection: boolean;
  proctoringEnabled: boolean;
  isRequired: boolean;
  requiredForCompletion: boolean;
  averageScore: number;
  passRate: number;
  passingScore?: number;
  gradingRubric?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

interface AssessmentAttempt {
  _id: string;
  submissionId?: string;
  assessment: Assessment | string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;
  course: {
    _id: string;
    title: string;
  };
  answers: any[];
  submittedAt?: string;
  startedAt: string;
  startTime: Date;
  completedAt?: string;
  endTime?: Date;
  timeSpent: number;
  attemptNumber: number;
  status: 'draft' | 'submitted' | 'graded' | 'returned' | 'in_progress' | 'completed' | 'abandoned';
  score?: number;
  percentage?: number;
  passed: boolean;
  grade?: string;
  feedback?: string;
  isLate: boolean;
  latePenaltyApplied?: number;
  gradedBy?: string;
  gradedAt?: string;
  aiGraded: boolean;
  requiresManualReview: boolean;
  proctoringData?: {
    faceDetections: any[];
    tabSwitches: number;
    suspiciousActivity: any[];
    screenshots: string[];
  };
  createdAt: Date;
}

const CourseAssessmentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attempts, setAttempts] = useState<Record<string, AssessmentAttempt[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Assessment details state
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Results state
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<AssessmentAttempt | null>(null);

  // Filter state
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Load assessments and attempts
  useEffect(() => {
    const loadAssessments = async () => {
      if (!user || !id) {
        setError('Please log in to access assessments');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load course details
        const courseData = await courseService.getPublicCourseById(id);
        setCourse(courseData);

        // Load assessments for this course
        console.log('🔍 Loading assessments for course:', id);
        const assessmentsData = await assessmentService.getCourseAssessments(id);
        console.log('📚 Assessments loaded:', assessmentsData);
        setAssessments((assessmentsData || []) as Assessment[]);

        // Load student attempts for this course
        console.log('🔍 Loading student attempts for course:', id);
        const attemptsData = await assessmentService.getStudentAttempts(id);
        console.log('📝 Student attempts loaded:', attemptsData);
        const attemptsMap: Record<string, AssessmentAttempt[]> = {};
        attemptsData?.forEach((attempt: any) => {
          const assessmentId = typeof attempt.assessment === 'string' ? attempt.assessment : attempt.assessment._id;
          if (!attemptsMap[assessmentId]) {
            attemptsMap[assessmentId] = [];
          }
          attemptsMap[assessmentId].push(attempt as AssessmentAttempt);
        });
        setAttempts(attemptsMap);

      } catch (err: any) {
        console.error('Assessments loading failed:', err);
        setError(err.message || 'Failed to load assessments');
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
  }, [id, user]);

  // Get assessment status
  const getAssessmentStatus = (assessment: Assessment) => {
    const assessmentAttempts = attempts[assessment._id] || [];
    const now = new Date();

    // Check if completed with passing grade
    const passedAttempt = assessmentAttempts.find(attempt => attempt.passed);
    if (passedAttempt) return 'passed';

    // Check if has attempts but not passed
    const completedAttempts = assessmentAttempts.filter(attempt => attempt.status === 'completed');
    if (completedAttempts.length > 0) {
      if (completedAttempts.length >= assessment.attempts) return 'failed';
      return 'attempted';
    }

    // Check if in progress
    const inProgressAttempt = assessmentAttempts.find(attempt => attempt.status === 'in_progress');
    if (inProgressAttempt) return 'in-progress';

    // Check availability
    if (!assessment.isPublished) return 'not-available';
    if (assessment.scheduledDate && assessment.scheduledDate > now) return 'scheduled';
    if (assessment.dueDate && new Date(assessment.dueDate) < now) return 'expired';

    return 'available';
  };

  // Get status info
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'passed':
        return { color: 'success', icon: <CheckCircle />, label: 'Passed' };
      case 'failed':
        return { color: 'error', icon: <Warning />, label: 'Failed' };
      case 'attempted':
        return { color: 'warning', icon: <Quiz />, label: 'Attempted' };
      case 'in-progress':
        return { color: 'info', icon: <Timer />, label: 'In Progress' };
      case 'expired':
        return { color: 'error', icon: <Warning />, label: 'Expired' };
      case 'scheduled':
        return { color: 'default', icon: <Schedule />, label: 'Scheduled' };
      case 'not-available':
        return { color: 'default', icon: <Info />, label: 'Not Available' };
      default:
        return { color: 'primary', icon: <PlayArrow />, label: 'Available' };
    }
  };

  // Filter assessments
  const getFilteredAssessments = () => {
    let filtered = assessments;

    if (typeFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(assessment => {
        const status = getAssessmentStatus(assessment);
        return status === statusFilter;
      });
    }

    return filtered;
  };

  // Start assessment
  const startAssessment = (assessment: Assessment) => {
    navigate(`/proctored-assessment/${assessment._id}/take`, {
      state: { assessment }
    });
  };

  // View assessment details
  const viewAssessmentDetails = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setDetailsDialogOpen(true);
  };

  // View attempt results
  const viewAttemptResults = (assessment: Assessment, attempt: AssessmentAttempt) => {
    setSelectedAssessment(assessment);
    setSelectedAttempt(attempt);
    setResultsDialogOpen(true);
  };

  // Get best attempt
  const getBestAttempt = (assessmentId: string) => {
    const assessmentAttempts = attempts[assessmentId] || [];
    const completedAttempts = assessmentAttempts.filter(attempt => attempt.status === 'completed');
    
    if (completedAttempts.length === 0) return null;
    
    return completedAttempts.reduce((best, current) =>
      (current.score ?? 0) > (best.score ?? 0) ? current : best
    );
  };

  // Get remaining attempts
  const getRemainingAttempts = (assessment: Assessment) => {
    const assessmentAttempts = attempts[assessment._id] || [];
    const completedAttempts = assessmentAttempts.filter(attempt => attempt.status === 'completed');
    return Math.max(0, assessment.attempts - completedAttempts.length);
  };

  // Calculate overall progress
  const getOverallProgress = () => {
    const totalAssessments = assessments.length;
    const passedAssessments = assessments.filter(assessment => {
      const status = getAssessmentStatus(assessment);
      return status === 'passed';
    }).length;

    return totalAssessments > 0 ? Math.round((passedAssessments / totalAssessments) * 100) : 0;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/course/${id}`)}
          variant="outlined"
        >
          Back to Course
        </Button>
      </Container>
    );
  }

  const filteredAssessments = getFilteredAssessments();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/course/${id}`)}
            sx={{ 
              mb: 3,
              color: 'white',
              borderColor: 'rgba(255,255,255,0.3)',
              '&:hover': {
                borderColor: 'white',
                bgcolor: 'rgba(255,255,255,0.1)'
              }
            }}
            variant="outlined"
          >
            Back to Course
          </Button>

          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ 
                background: 'rgba(255,255,255,0.95)', 
                backdropFilter: 'blur(10px)',
                borderRadius: 3,
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h4" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    color: 'primary.main',
                    fontWeight: 'bold'
                  }}>
                    <Assessment sx={{ fontSize: 40 }} />
                    {course?.title} - Assessments
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
                    Test your knowledge and track your progress through quizzes and exams
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ 
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}>
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    <TrendingUp />
                    Overall Progress
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {getOverallProgress()}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={getOverallProgress()}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: 'white'
                      }
                    }}
                  />
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    {assessments.filter(a => getAssessmentStatus(a) === 'passed').length} of {assessments.length} assessments passed
                  </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)'
            }} 
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              textAlign: 'center'
            }}>
              <CardContent>
                <Quiz sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {assessments.length}
                </Typography>
                <Typography variant="body2">
                  Total Assessments
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 3,
              textAlign: 'center'
            }}>
              <CardContent>
                <CheckCircle sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {assessments.filter(a => getAssessmentStatus(a) === 'passed').length}
                </Typography>
                <Typography variant="body2">
                  Completed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 3,
              textAlign: 'center'
            }}>
              <CardContent>
                <PlayArrow sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {assessments.filter(a => getAssessmentStatus(a) === 'available').length}
                </Typography>
                <Typography variant="body2">
                  Available
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              borderRadius: 3,
              textAlign: 'center'
            }}>
              <CardContent>
                <Warning sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {assessments.filter(a => getAssessmentStatus(a) === 'expired').length}
                </Typography>
                <Typography variant="body2">
                  Expired
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filters */}
        <Card sx={{ 
          mb: 3,
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(10px)',
          borderRadius: 3
        }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                  <Tab label="All Assessments" />
                  <Tab label="Available" />
                  <Tab label="Completed" />
                </Tabs>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Type</InputLabel>
                  <Select
                    value={typeFilter}
                    label="Filter by Type"
                    onChange={(e) => setTypeFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="quiz">Quizzes</MenuItem>
                    <MenuItem value="exam">Exams</MenuItem>
                    <MenuItem value="project">Projects</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Filter by Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Filter by Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="available">Available</MenuItem>
                    <MenuItem value="passed">Passed</MenuItem>
                    <MenuItem value="attempted">Attempted</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Assessments List */}
        {filteredAssessments.length === 0 ? (
          <Paper sx={{ 
            p: 4, 
            textAlign: 'center',
            background: 'rgba(255,255,255,0.95)', 
            backdropFilter: 'blur(10px)',
            borderRadius: 3
          }}>
            <Assessment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No assessments found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {typeFilter === 'all' && statusFilter === 'all'
                ? "Your instructor hasn't created any assessments yet."
                : "No assessments match the selected filters."
              }
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {filteredAssessments.map((assessment) => {
              const status = getAssessmentStatus(assessment);
              const statusInfo = getStatusInfo(status);
              const bestAttempt = getBestAttempt(assessment._id);
              const remainingAttempts = getRemainingAttempts(assessment);
              const assessmentAttempts = attempts[assessment._id] || [];

              return (
                <Grid item xs={12} md={6} key={assessment._id}>
                  <Card sx={{ 
                    background: 'rgba(255,255,255,0.95)', 
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      borderColor: 'primary.main'
                    }
                  }}>
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between', 
                      alignItems: isMobile ? 'stretch' : 'flex-start', 
                      mb: 2 
                    }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {assessment.title}
                          <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap',
                            gap: 1, 
                            mt: 1
                          }}>
                            <Chip 
                              label={assessment.type.toUpperCase()} 
                              color="primary" 
                              size="small" 
                            />
                            {assessment.isRequired && (
                              <Chip 
                                label="Required" 
                                color="error" 
                                size="small" 
                              />
                            )}
                            {assessment.requireProctoring && (
                              <Chip 
                                label="Proctored" 
                                color="warning" 
                                size="small" 
                                icon={<Psychology />}
                              />
                            )}
                          </Box>
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {assessment.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            color={statusInfo.color as any}
                            size="small"
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Quiz fontSize="small" />
                            <Typography variant="body2">
                              {assessment.totalQuestions} questions
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Grade fontSize="small" />
                            <Typography variant="body2">
                              {assessment.totalPoints} points
                            </Typography>
                          </Box>
                          {assessment.timeLimit && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Timer fontSize="small" />
                              <Typography variant="body2">
                                {assessment.timeLimit} minutes
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Attempt Information */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Attempts: {assessmentAttempts.filter(a => a.status === 'completed').length}/{assessment.attempts}
                          </Typography>
                          {bestAttempt && (
                            <Typography variant="body2" color="text.secondary">
                              Best Score: {bestAttempt.score}/{assessment.totalPoints} ({bestAttempt.percentage}%)
                            </Typography>
                          )}
                        </Box>

                        {/* Due Date */}
                        {assessment.dueDate && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <CalendarToday fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              Due: {new Date(assessment.dueDate).toLocaleString()}
                            </Typography>
                          </Box>
                        )}

                        {/* Best Attempt Display */}
                        {bestAttempt && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: bestAttempt.passed ? 'success.light' : 'warning.light', borderRadius: 1 }}>
                            <Typography variant="body2" gutterBottom>
                              <strong>Best Attempt:</strong> {bestAttempt.score}/{assessment.totalPoints} ({bestAttempt.percentage}%)
                              {bestAttempt.passed ? (
                                <Chip label="PASSED" color="success" size="small" sx={{ ml: 1 }} />
                              ) : (
                                <Chip label="FAILED" color="error" size="small" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                            <Typography variant="body2">
                              Completed: {new Date(bestAttempt.endTime || bestAttempt.startTime).toLocaleString()}
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Desktop Button Layout */}
                      {!isMobile && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                          <Button
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => viewAssessmentDetails(assessment)}
                          >
                            View Details
                          </Button>
                          
                          {status === 'available' && remainingAttempts > 0 && (
                            <Button
                              variant="contained"
                              startIcon={<PlayArrow />}
                              onClick={() => startAssessment(assessment)}
                            >
                              Start Assessment
                            </Button>
                          )}
                          
                          {status === 'attempted' && remainingAttempts > 0 && (
                            <Button
                              variant="contained"
                              startIcon={<PlayArrow />}
                              onClick={() => startAssessment(assessment)}
                            >
                              Retry ({remainingAttempts} left)
                            </Button>
                          )}
                          
                          {bestAttempt && (
                            <Button
                              variant="outlined"
                              startIcon={<Grade />}
                              onClick={() => viewAttemptResults(assessment, bestAttempt)}
                            >
                              View Results
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>

                    {/* Mobile Button Layout - Below Content */}
                    {isMobile && (
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 2, 
                        mt: 3,
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider'
                      }}>
                        {/* Mobile Status Indicator */}
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center', 
                          mb: 1 
                        }}>
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            color={statusInfo.color as any}
                            size="medium"
                            sx={{ 
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              px: 2,
                              py: 1
                            }}
                          />
                        </Box>

                        {/* Primary Action Button */}
                        {status === 'available' && remainingAttempts > 0 && (
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<PlayArrow />}
                            onClick={() => startAssessment(assessment)}
                            fullWidth
                            sx={{
                              py: 2.5,
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              borderRadius: 3,
                              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                              '&:hover': {
                                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                                transform: 'translateY(-3px)',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🚀 Start Assessment Now
                          </Button>
                        )}
                        
                        {status === 'attempted' && remainingAttempts > 0 && (
                          <Button
                            variant="contained"
                            size="large"
                            startIcon={<PlayArrow />}
                            onClick={() => startAssessment(assessment)}
                            fullWidth
                            sx={{
                              py: 2.5,
                              fontSize: '1.2rem',
                              fontWeight: 700,
                              textTransform: 'none',
                              borderRadius: 3,
                              background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                              boxShadow: '0 6px 20px rgba(255, 152, 0, 0.3)',
                              '&:hover': {
                                background: `linear-gradient(45deg, ${theme.palette.warning.dark}, ${theme.palette.warning.main})`,
                                transform: 'translateY(-3px)',
                                boxShadow: '0 10px 30px rgba(255, 152, 0, 0.4)'
                              },
                              transition: 'all 0.3s ease'
                            }}
                          >
                            🔄 Retry Assessment ({remainingAttempts} left)
                          </Button>
                        )}

                        {/* Not Available Message */}
                        {(status === 'expired' || status === 'not-available' || status === 'scheduled' || (status === 'failed' && remainingAttempts === 0)) && (
                          <Box sx={{ 
                            textAlign: 'center', 
                            py: 2, 
                            px: 3,
                            bgcolor: 'grey.100',
                            borderRadius: 2,
                            mb: 2
                          }}>
                            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                              {status === 'expired' && '⏰ Assessment has expired'}
                              {status === 'not-available' && '🔒 Assessment not yet available'}
                              {status === 'scheduled' && '📅 Assessment is scheduled'}
                              {status === 'failed' && remainingAttempts === 0 && '❌ No more attempts remaining'}
                            </Typography>
                          </Box>
                        )}

                        {/* Passed Status */}
                        {status === 'passed' && (
                          <Box sx={{ 
                            textAlign: 'center', 
                            py: 2, 
                            px: 3,
                            bgcolor: 'success.light',
                            borderRadius: 2,
                            mb: 2
                          }}>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.dark' }}>
                              ✅ Assessment Completed Successfully!
                            </Typography>
                          </Box>
                        )}

                        {/* Secondary Action Buttons */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            startIcon={<Visibility />}
                            onClick={() => viewAssessmentDetails(assessment)}
                            fullWidth
                            sx={{ py: 1.5, fontSize: '0.95rem' }}
                          >
                            View Details
                          </Button>
                          
                          {bestAttempt && (
                            <Button
                              variant="outlined"
                              startIcon={<Grade />}
                              onClick={() => viewAttemptResults(assessment, bestAttempt)}
                              fullWidth
                              sx={{ py: 1.5, fontSize: '0.95rem' }}
                            >
                              View Results
                            </Button>
                          )}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Assessment Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Assessment Details: {selectedAssessment?.title}
        </DialogTitle>
        <DialogContent>
          {selectedAssessment && (
            <Box>
              <Typography variant="body1" paragraph>
                {selectedAssessment.description}
              </Typography>
              
              {selectedAssessment.instructions && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Instructions
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      {selectedAssessment.instructions}
                    </Typography>
                  </Paper>
                </Box>
              )}

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Type
                  </Typography>
                  <Typography variant="body1">
                    {selectedAssessment.type.charAt(0).toUpperCase() + selectedAssessment.type.slice(1)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Questions
                  </Typography>
                  <Typography variant="body1">
                    {selectedAssessment.totalQuestions}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Points
                  </Typography>
                  <Typography variant="body1">
                    {selectedAssessment.totalPoints}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Passing Score
                  </Typography>
                  <Typography variant="body1">
                    {selectedAssessment.passingScore} ({selectedAssessment.passingScore && selectedAssessment.totalPoints ? Math.round((selectedAssessment.passingScore / selectedAssessment.totalPoints) * 100) : 0}%)
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Attempts Allowed
                  </Typography>
                  <Typography variant="body1">
                    {selectedAssessment.attempts}
                  </Typography>
                </Grid>
                {selectedAssessment.timeLimit && (
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Time Limit
                    </Typography>
                    <Typography variant="body1">
                      {selectedAssessment.timeLimit} minutes
                    </Typography>
                  </Grid>
                )}
              </Grid>

              {/* Requirements */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Requirements
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      {selectedAssessment.isRequired ? <CheckCircle color="success" /> : <Info />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={selectedAssessment.isRequired ? "Required for course completion" : "Optional assessment"}
                    />
                  </ListItem>
                  {selectedAssessment.requireProctoring && (
                    <ListItem>
                      <ListItemIcon>
                        <Psychology color="warning" />
                      </ListItemIcon>
                      <ListItemText primary="Proctoring required" />
                    </ListItem>
                  )}
                  {selectedAssessment.requireCamera && (
                    <ListItem>
                      <ListItemIcon>
                        <Warning color="warning" />
                      </ListItemIcon>
                      <ListItemText primary="Camera access required" />
                    </ListItem>
                  )}
                </List>
              </Box>

              {/* Statistics */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Class Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Average Score
                    </Typography>
                    <Typography variant="h6" color="primary.main">
                      {selectedAssessment.averageScore}%
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Pass Rate
                    </Typography>
                    <Typography variant="h6" color="success.main">
                      {selectedAssessment.passRate}%
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          {selectedAssessment && getAssessmentStatus(selectedAssessment) === 'available' && (
            <Button 
              onClick={() => {
                setDetailsDialogOpen(false);
                startAssessment(selectedAssessment);
              }}
              variant="contained"
            >
              Start Assessment
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Results Dialog */}
      <Dialog 
        open={resultsDialogOpen} 
        onClose={() => setResultsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Assessment Results: {selectedAssessment?.title}
        </DialogTitle>
        <DialogContent>
          {selectedAttempt && selectedAssessment && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h3" color={selectedAttempt.passed ? 'success.main' : 'error.main'} gutterBottom>
                  {selectedAttempt.percentage}%
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {selectedAttempt.passed ? '🎉 Congratulations! You passed!' : '📚 Keep studying and try again!'}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Score: {selectedAttempt.score}/{selectedAssessment.totalPoints} points
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Attempt Number
                  </Typography>
                  <Typography variant="body1">
                    {selectedAttempt.attemptNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Time Spent
                  </Typography>
                  <Typography variant="body1">
                    {Math.round(selectedAttempt.timeSpent / 60)} minutes
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Started At
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedAttempt.startTime).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Completed At
                  </Typography>
                  <Typography variant="body1">
                    {selectedAttempt.endTime ? new Date(selectedAttempt.endTime).toLocaleString() : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>

              {selectedAttempt.feedback && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Instructor Feedback
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'info.light' }}>
                    <Typography variant="body1">
                      {selectedAttempt.feedback}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* Performance Comparison */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Performance Comparison
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Your Score vs Class Average
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={selectedAttempt.percentage}
                    sx={{ height: 8, borderRadius: 4, mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">
                      Your Score: {selectedAttempt.percentage}%
                    </Typography>
                    <Typography variant="body2">
                      Class Average: {selectedAssessment.averageScore}%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultsDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      </Container>
    </Box>
  );
};

export default CourseAssessmentsPage;
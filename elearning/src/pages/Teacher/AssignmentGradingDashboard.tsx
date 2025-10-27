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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  Grade,
  Visibility,
  AutoAwesome,
  Psychology,
  CheckCircle,
  Schedule,
  Person,
  Assignment as AssignmentIcon,
  Download,
  Refresh
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { assignmentService } from '../../services/assignmentService';

interface AssignmentSubmission {
  _id: string;
  student: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  sections?: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    completed: boolean;
    feedback?: string;
    score?: number;
  }>;
  submittedAt: string;
  status: 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  gradedAt?: string;
  gradedBy?: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  maxPoints: number;
  questions?: Array<{
    _id: string;
    question: string;
    type: string;
    points: number;
    options?: string[];
    correctAnswer?: string | string[];
  }>;
  course: {
    _id: string;
    title: string;
  };
}

const AssignmentGradingDashboard: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [gradingData, setGradingData] = useState({
    score: 0,
    feedback: '',
    answers: [] as Array<{
      questionId: string;
      score: number;
      feedback: string;
    }>
  });

  useEffect(() => {
    loadAssignmentAndSubmissions();
  }, [assignmentId]);

  const loadAssignmentAndSubmissions = async () => {
    if (!assignmentId) return;

    try {
      setLoading(true);
      setError(null);

      // Load assignment details
      const assignmentData = await assignmentService.getAssignmentById(assignmentId);
      setAssignment(assignmentData);

      // Load submissions
      const submissionsData = await assignmentService.getAssignmentSubmissionsForGrading(assignmentId);
      setSubmissions(submissionsData.submissions || []);

    } catch (err: any) {
      console.error('Error loading assignment and submissions:', err);
      setError(err.message || 'Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission);
    
    // Initialize grading data
    const initialAnswers = (assignment?.questions || []).map((question, index) => ({
      questionId: question._id,
      score: submission.sections?.[index]?.score || 0,
      feedback: submission.sections?.[index]?.feedback || ''
    }));

    setGradingData({
      score: submission.grade || 0,
      feedback: submission.feedback || '',
      answers: initialAnswers
    });

    setGradingDialogOpen(true);
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;

    try {
      setLoading(true);

      await assignmentService.gradeSubmission(selectedSubmission._id, {
        answers: gradingData.answers,
        feedback: gradingData.feedback,
        score: gradingData.score
      });

      setSuccess('Submission graded successfully!');
      setGradingDialogOpen(false);
      setSelectedSubmission(null);
      
      // Reload submissions
      await loadAssignmentAndSubmissions();

    } catch (err: any) {
      console.error('Error grading submission:', err);
      setError(err.message || 'Failed to grade submission');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'warning';
      case 'graded': return 'success';
      default: return 'default';
    }
  };

  const getGradePercentage = (grade: number, maxPoints: number) => {
    return Math.round((grade / maxPoints) * 100);
  };

  if (loading && !assignment) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error && !assignment) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back to Course
        </Button>
        
        <Typography variant="h4" component="h1" gutterBottom>
          Assignment Grading Dashboard
        </Typography>
        
        {assignment && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    {assignment.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {assignment.description}
                  </Typography>
                  <Typography variant="body2">
                    Course: {assignment.course.title}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {assignment.maxPoints}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Max Points
                    </Typography>
                  </Box>
                  {assignment.questions && (
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                      <Typography variant="h6" color="success.main">
                        {assignment.questions.length}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        AI Questions
                      </Typography>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Submissions Table */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Student Submissions ({submissions.length})
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={loadAssignmentAndSubmissions}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {submissions.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
              <AssignmentIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Submissions Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Students haven't submitted their assignments yet.
              </Typography>
            </Paper>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Student</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission._id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {submission.student.firstName[0]}{submission.student.lastName[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {submission.student.firstName} {submission.student.lastName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {submission.student.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(new Date(submission.submittedAt), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                          color={getStatusColor(submission.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {submission.grade !== undefined ? (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {submission.grade}/{assignment?.maxPoints}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ({getGradePercentage(submission.grade, assignment?.maxPoints || 100)}%)
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not graded
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={submission.sections ? (submission.sections.filter(s => s.completed).length / submission.sections.length) * 100 : 0}
                            sx={{ width: 60, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">
                            {submission.sections ? Math.round((submission.sections.filter(s => s.completed).length / submission.sections.length) * 100) : 0}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Grade Submission">
                            <IconButton
                              onClick={() => handleGradeSubmission(submission)}
                              color="primary"
                              size="small"
                            >
                              <Grade />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View Details">
                            <IconButton
                              onClick={() => navigate(`/dashboard/teacher/assignments/submissions/${submission._id}`)}
                              color="info"
                              size="small"
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Grading Dialog */}
      <Dialog
        open={gradingDialogOpen}
        onClose={() => setGradingDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Grade Assignment Submission
          {selectedSubmission && (
            <Typography variant="subtitle2" color="text.secondary">
              Student: {selectedSubmission.student.firstName} {selectedSubmission.student.lastName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Overall Grade */}
            <TextField
              label="Overall Score"
              type="number"
              value={gradingData.score}
              onChange={(e) => setGradingData(prev => ({ ...prev, score: Number(e.target.value) }))}
              inputProps={{ min: 0, max: assignment?.maxPoints }}
              fullWidth
              sx={{ mb: 3 }}
            />

            {/* Overall Feedback */}
            <TextField
              label="Overall Feedback"
              multiline
              rows={4}
              value={gradingData.feedback}
              onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
              fullWidth
              sx={{ mb: 3 }}
            />

            {/* Individual Question Grading */}
            {assignment?.questions && assignment.questions.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Individual Question Scores
                </Typography>
                {assignment.questions.map((question, index) => (
                  <Card key={question._id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Question {index + 1}: {question.question}
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            label="Score"
                            type="number"
                            value={gradingData.answers[index]?.score || 0}
                            onChange={(e) => {
                              const newAnswers = [...gradingData.answers];
                              newAnswers[index] = {
                                ...newAnswers[index],
                                questionId: question._id,
                                score: Number(e.target.value)
                              };
                              setGradingData(prev => ({ ...prev, answers: newAnswers }));
                            }}
                            inputProps={{ min: 0, max: question.points }}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={8}>
                          <TextField
                            label="Feedback"
                            value={gradingData.answers[index]?.feedback || ''}
                            onChange={(e) => {
                              const newAnswers = [...gradingData.answers];
                              newAnswers[index] = {
                                ...newAnswers[index],
                                questionId: question._id,
                                feedback: e.target.value
                              };
                              setGradingData(prev => ({ ...prev, answers: newAnswers }));
                            }}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradingDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveGrade}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Grade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssignmentGradingDashboard;
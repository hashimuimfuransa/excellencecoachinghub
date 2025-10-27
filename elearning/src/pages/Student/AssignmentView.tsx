import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Grid,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Timer,
  CheckCircle,
  Warning,
  ArrowBack,
  ArrowForward,
  Save,
  Send,
  Lightbulb,
  Help,
  Refresh
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { assignmentService } from '../../services/assignmentService';
import EnhancedQuestionRenderer from '../../components/Assignment/EnhancedQuestionRenderer';

interface Question {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay' | 'fill-in-blank' | 'matching' | 'ordering' | 'numerical' | 'code';
  options?: string[];
  correctAnswer?: string | string[];
  matchingPairs?: Array<{ left: string; right: string }>;
  codeLanguage?: string;
  numericalRange?: { min: number; max: number };
  points: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    firstName: string;
    lastName: string;
  };
  dueDate: string;
  maxPoints: number;
  questions?: Question[]; // AI extracted questions
  extractedQuestions?: Question[]; // Legacy support
  timeLimit?: number; // in minutes
  allowedAttempts?: number;
  status: 'draft' | 'published' | 'closed';
}

interface Answer {
  questionIndex: number;
  answer: string | string[];
  questionType: string;
  timeSpent?: number;
  attempts?: number;
}

interface Submission {
  _id?: string;
  extractedAnswers: Answer[];
  submittedAt?: string;
  status: 'draft' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
  timeSpent: number;
  version: number;
}

const AssignmentView: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime] = useState(Date.now());
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled && answers.length > 0 && assignment) {
      const autoSaveInterval = setInterval(() => {
        handleSave(true);
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(autoSaveInterval);
    }
  }, [answers, autoSaveEnabled, assignment]);

  // Load assignment and existing submission
  useEffect(() => {
    const loadAssignmentData = async () => {
      if (!assignmentId) return;

      try {
        setLoading(true);

        // Load assignment with extracted questions
        const assignmentData = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(assignmentData);

        // Load existing submission
        try {
          const existingSubmission = await assignmentService.getSubmissionByAssignment(assignmentId);
          
          if (existingSubmission) {
            setSubmission(existingSubmission);
            setAnswers(existingSubmission.sections?.map((section, index) => ({
              questionIndex: index,
              answer: section.content || '',
              questionType: assignmentData.questions?.[index]?.type || 'short-answer',
              timeSpent: 0,
              attempts: 0
            })) || []);
          } else {
            // Initialize empty answers array for extracted questions
            const initialAnswers = (assignmentData.questions || []).map((_: any, index: number) => ({
              questionIndex: index,
              answer: '',
              questionType: assignmentData.questions[index].type,
              timeSpent: 0,
              attempts: 0
            }));
            setAnswers(initialAnswers);
          }
        } catch (submissionError) {
          // No existing submission, initialize empty answers
          const initialAnswers = (assignmentData.questions || []).map((_: any, index: number) => ({
            questionIndex: index,
            answer: '',
            questionType: assignmentData.questions[index].type,
            timeSpent: 0,
            attempts: 0
          }));
          setAnswers(initialAnswers);
        }

      } catch (err: any) {
        console.error('Error loading assignment:', err);
        setError(err.message || 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    loadAssignmentData();
  }, [assignmentId]);

  const handleAnswerChange = (questionIndex: number, answer: string | string[], timeSpent?: number) => {
    setAnswers(prev => {
      const newAnswers = [...prev];
      const existingAnswerIndex = newAnswers.findIndex(a => a.questionIndex === questionIndex);
      
      if (existingAnswerIndex >= 0) {
        newAnswers[existingAnswerIndex] = {
          ...newAnswers[existingAnswerIndex],
          answer,
          timeSpent: timeSpent || newAnswers[existingAnswerIndex].timeSpent,
          attempts: newAnswers[existingAnswerIndex].attempts + 1
        };
      } else {
        newAnswers.push({
          questionIndex,
          answer,
          questionType: assignment?.questions?.[questionIndex]?.type || 'short-answer',
          timeSpent: timeSpent || 0,
          attempts: 1
        });
      }
      
      return newAnswers;
    });
  };

  const handleSave = async (isAutoSave = false) => {
    if (!assignment || !assignmentId) return;

    try {
      if (!isAutoSave) setSaving(true);

      // Convert answers to sections format
      const sections = answers.map((answer, index) => ({
        id: `question_${index}`,
        title: `Question ${index + 1}`,
        content: Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer.toString(),
        type: answer.questionType as 'text' | 'essay' | 'code' | 'math',
        completed: !!answer.answer
      }));

      const submissionData = {
        assignmentId,
        sections,
        isDraft: true
      };

      const savedSubmission = await assignmentService.submitAssignment(submissionData);
      setSubmission(savedSubmission);
      
      if (!isAutoSave) {
        setError(null);
      }
    } catch (err: any) {
      console.error('Error saving submission:', err);
      if (!isAutoSave) {
        setError(err.message || 'Failed to save submission');
      }
    } finally {
      if (!isAutoSave) setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!assignment || !assignmentId) return;

    try {
      setSubmitting(true);

      // Convert answers to sections format
      const sections = answers.map((answer, index) => ({
        id: `question_${index}`,
        title: `Question ${index + 1}`,
        content: Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer.toString(),
        type: answer.questionType as 'text' | 'essay' | 'code' | 'math',
        completed: !!answer.answer
      }));

      const submissionData = {
        assignmentId,
        sections,
        isDraft: false
      };

      const submittedAssignment = await assignmentService.submitAssignment(submissionData);
      setSubmission(submittedAssignment);
      setShowSubmitDialog(false);
      
      // Redirect to assignments list
      navigate('/dashboard/student/assignments');
    } catch (err: any) {
      console.error('Error submitting assignment:', err);
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = (): number => {
    if (!assignment || !assignment.questions) return 0;
    const answeredQuestions = answers.filter(a => a.answer && a.answer !== '').length;
    return (answeredQuestions / assignment.questions.length) * 100;
  };

  const isOverdue = (): boolean => {
    if (!assignment) return false;
    return new Date() > new Date(assignment.dueDate);
  };

  const canSubmit = (): boolean => {
    return !isOverdue() && submission?.status !== 'submitted' && answers.some(a => a.answer && a.answer !== '');
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!assignment) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Assignment not found</Alert>
      </Container>
    );
  }

  const currentQuestion = assignment?.questions?.[currentQuestionIndex] || assignment?.extractedQuestions?.[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionIndex === currentQuestionIndex);
  const isSubmitted = submission?.status === 'submitted';

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" gutterBottom>
            {assignment.title}
          </Typography>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard/student/assignments')}
          >
            Back to Assignments
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary" paragraph>
          {assignment.description}
        </Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Chip
              label={`${assignment.course.title}`}
              color="primary"
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Chip
              label={`${assignment.instructor.firstName} ${assignment.instructor.lastName}`}
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Chip
              icon={<Timer />}
              label={`Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
              color={isOverdue() ? 'error' : 'default'}
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Chip
              label={`${assignment.maxPoints} points`}
              color="secondary"
              variant="outlined"
            />
          </Grid>
          {isSubmitted && (
            <Grid item>
              <Chip
                icon={<CheckCircle />}
                label="Submitted"
                color="success"
              />
            </Grid>
          )}
        </Grid>

        {/* Progress and Status */}
        <Box mt={3}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="body2">
              Progress: {Math.round(getProgress())}% ({answers.filter(a => a.answer && a.answer !== '').length}/{(assignment.questions || assignment.extractedQuestions || []).length} questions)
            </Typography>
            <Typography variant="body2">
              Time spent: {formatTime(timeSpent)}
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={getProgress()} />
        </Box>

        {isOverdue() && (
          <Alert severity="error" sx={{ mt: 2 }}>
            This assignment is overdue. You can still work on it, but it will be marked as late.
          </Alert>
        )}
      </Paper>

      {/* Instructions */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Instructions
        </Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {assignment.instructions}
        </Typography>
      </Paper>

      {/* Question Navigation */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={currentQuestionIndex} alternativeLabel>
          {(assignment.questions || assignment.extractedQuestions || []).map((_, index) => {
            const hasAnswer = answers.some(a => a.questionIndex === index && a.answer && a.answer !== '');
            return (
              <Step key={index} completed={hasAnswer}>
                <StepLabel
                  onClick={() => setCurrentQuestionIndex(index)}
                  sx={{ cursor: 'pointer' }}
                >
                  Q{index + 1}
                </StepLabel>
              </Step>
            );
          })}
        </Stepper>
      </Paper>

      {/* Current Question */}
      {currentQuestion && (
        <EnhancedQuestionRenderer
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          answer={currentAnswer}
          onAnswerChange={handleAnswerChange}
          isSubmitted={isSubmitted}
          timeLimit={assignment.timeLimit ? assignment.timeLimit * 60 : undefined}
        />
      )}

      {/* Navigation and Actions */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" gap={2}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            <Button
              endIcon={<ArrowForward />}
              onClick={() => setCurrentQuestionIndex(Math.min((assignment.questions || assignment.extractedQuestions || []).length - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === (assignment.questions || assignment.extractedQuestions || []).length - 1}
            >
              Next
            </Button>
          </Box>

          <Box display="flex" gap={2}>
            <Button
              startIcon={<Save />}
              onClick={() => handleSave()}
              disabled={saving || isSubmitted}
              variant="outlined"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </Button>
            <Button
              startIcon={<Send />}
              onClick={() => setShowSubmitDialog(true)}
              disabled={!canSubmit() || submitting}
              variant="contained"
              color="primary"
            >
              Submit Assignment
            </Button>
          </Box>
        </Box>

        <Box mt={2}>
          <Typography variant="caption" color="text.secondary">
            Auto-save is {autoSaveEnabled ? 'enabled' : 'disabled'}. 
            Your progress is automatically saved every 30 seconds.
          </Typography>
        </Box>
      </Paper>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>Submit Assignment</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to submit this assignment? Once submitted, you won't be able to make any changes.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Progress: {Math.round(getProgress())}% complete ({answers.filter(a => a.answer && a.answer !== '').length}/{(assignment.questions || assignment.extractedQuestions || []).length} questions answered)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AssignmentView;
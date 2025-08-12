import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip,
  IconButton,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import {
  Security,
  Send,
  NavigateBefore,
  NavigateNext,
  AutoAwesome,
  Grade,
  Assignment,
  AccessTime
} from '@mui/icons-material';
import ProctoringMonitor, { ProctoringViolation, ProctoringStatus } from '../../components/Proctoring/ProctoringMonitor';
import { enhancedAssessmentService, IEnhancedAssessment, IExtractedQuestion } from '../../services/enhancedAssessmentService';
import { useAuth } from '../../hooks/useAuth';

interface AssessmentAnswer {
  questionIndex: number;
  answer: string;
  timeSpent: number;
}

const EnhancedTakeAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [assessment, setAssessment] = useState<IEnhancedAssessment | null>(null);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(false);
  const [autoSubmitWarning, setAutoSubmitWarning] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const startTime = useRef(Date.now());

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Load assessment
  useEffect(() => {
    if (!assessmentId) return;

    const loadAssessment = async () => {
      try {
        setLoading(true);
        const data = await enhancedAssessmentService.getAssessmentById(assessmentId);
        setAssessment(data);
        
        // Initialize answers if questions are available
        if (data.extractedQuestions && data.extractedQuestions.length > 0) {
          const initialAnswers: AssessmentAnswer[] = data.extractedQuestions.map((_, index) => ({
            questionIndex: index,
            answer: '',
            timeSpent: 0
          }));
          setAnswers(initialAnswers);
        }

        // Set timer if duration exists
        if (data.duration) {
          setTimeRemaining(data.duration * 60); // Convert minutes to seconds
        }

        // Enable proctoring if required
        if (data.requireProctoring || data.requireCamera) {
          setProctoringActive(true);
          // Request fullscreen
          try {
            await document.documentElement.requestFullscreen();
          } catch (error) {
            console.warn('Could not enter fullscreen mode:', error);
          }
        }

        setLoading(false);
      } catch (error: any) {
        setError(error.message || 'Failed to load assessment');
        setLoading(false);
      }
    };

    loadAssessment();
  }, [assessmentId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !submitting) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeRemaining, submitting]);

  // Track question time
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
  }, [currentQuestionIndex]);

  const handleQuestionNavigation = (direction: 'next' | 'prev') => {
    // Update time spent on current question
    const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
    setAnswers(prev => {
      const newAnswers = [...prev];
      if (newAnswers[currentQuestionIndex]) {
        newAnswers[currentQuestionIndex].timeSpent += timeSpent;
      }
      return newAnswers;
    });

    if (direction === 'next' && currentQuestionIndex < (assessment?.extractedQuestions?.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (!assessment || !user) return;

    try {
      setSubmitting(true);
      setError(null);

      // Calculate time spent
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000 / 60); // Convert to minutes

      // Submit assessment for grading
      const submissionResult = await enhancedAssessmentService.submitAssessmentForGrading(
        assessmentId!,
        {
          answers: answers,
          timeSpent: timeSpent
        }
      );

      // Update student progress
      try {
        await enhancedAssessmentService.updateStudentProgress(
          assessmentId!,
          submissionResult.score,
          timeSpent
        );
      } catch (progressError) {
        console.warn('Failed to update progress:', progressError);
        // Don't fail the submission if progress update fails
      }

      setSubmissionResult(submissionResult);
      setAssessmentCompleted(true);

      // Show success notification
      setSuccess('Assessment submitted successfully! Your progress has been updated.');

    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  }, [assessment, user, assessmentId, answers]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: IExtractedQuestion, answer: AssessmentAnswer) => {
    const handleAnswerChange = (value: string) => {
      setAnswers(prev => {
        const newAnswers = [...prev];
        if (newAnswers[currentQuestionIndex]) {
          newAnswers[currentQuestionIndex].answer = value;
        }
        return newAnswers;
      });
    };

    const handleMultipleChoiceChange = (option: string, checked: boolean) => {
      setAnswers(prev => {
        const newAnswers = [...prev];
        if (newAnswers[currentQuestionIndex]) {
          const currentAnswer = newAnswers[currentQuestionIndex].answer;
          const answers = currentAnswer ? currentAnswer.split(',').filter(a => a.trim()) : [];
          
          if (checked && !answers.includes(option)) {
            answers.push(option);
          } else if (!checked && answers.includes(option)) {
            const index = answers.indexOf(option);
            answers.splice(index, 1);
          }
          
          newAnswers[currentQuestionIndex].answer = answers.join(',');
        }
        return newAnswers;
      });
    };

    switch (question.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={answer.answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
          >
            {question.options?.map((option, index) => (
              <FormControlLabel
                key={index}
                value={option}
                control={<Radio />}
                label={option}
              />
            ))}
          </RadioGroup>
        );

      case 'multiple_choice_multiple':
        const selectedOptions = answer.answer ? answer.answer.split(',').filter(a => a.trim()) : [];
        return (
          <Box>
            {question.options?.map((option, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={selectedOptions.includes(option)}
                    onChange={(e) => handleMultipleChoiceChange(option, e.target.checked)}
                  />
                }
                label={option}
              />
            ))}
          </Box>
        );

      case 'true_false':
        return (
          <RadioGroup
            value={answer.answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
          >
            <FormControlLabel value="true" control={<Radio />} label="True" />
            <FormControlLabel value="false" control={<Radio />} label="False" />
          </RadioGroup>
        );

      case 'short_answer':
      case 'essay':
        return (
          <TextField
            fullWidth
            multiline
            rows={question.type === 'essay' ? 6 : 3}
            value={answer.answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={`Enter your ${question.type === 'essay' ? 'detailed' : 'brief'} answer here...`}
            variant="outlined"
          />
        );

      case 'fill_in_blank':
        return (
          <TextField
            fullWidth
            value={answer.answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Fill in the blank..."
            variant="outlined"
          />
        );

      case 'numerical':
        return (
          <TextField
            fullWidth
            type="number"
            value={answer.answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Enter numerical answer..."
            variant="outlined"
          />
        );

      default:
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            value={answer.answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Enter your answer here..."
            variant="outlined"
          />
        );
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'multiple_choice_multiple':
        return 'Multiple Choice (Multiple Answers)';
      case 'true_false':
        return 'True/False';
      case 'short_answer':
        return 'Short Answer';
      case 'essay':
        return 'Essay';
      case 'fill_in_blank':
        return 'Fill in the Blank';
      case 'numerical':
        return 'Numerical';
      default:
        return 'Question';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/student/enhanced-assessments')}>
          Back to Assessments
        </Button>
      </Container>
    );
  }

  if (!assessment) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Assessment not found
        </Alert>
      </Container>
    );
  }

  const currentQuestion = assessment.extractedQuestions?.[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  if (assessmentCompleted && submissionResult) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                Assessment Submitted!
              </Typography>
              <Typography variant="h6" color="primary" gutterBottom>
                Score: {submissionResult.score}/{submissionResult.totalPoints} ({submissionResult.percentage}%)
              </Typography>
              <Chip
                label={submissionResult.grade}
                color={submissionResult.percentage >= 70 ? 'success' : 'warning'}
                sx={{ fontSize: '1.2rem', p: 1 }}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              AI Feedback:
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {submissionResult.aiFeedback}
            </Typography>

            {submissionResult.requiresTeacherReview && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Your submission has been AI graded and is pending teacher review. You will be notified when the final grade is available.
              </Alert>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                onClick={() => navigate('/student/enhanced-assessments')}
              >
                Back to Assessments
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  function setProctoringStatus(status: ProctoringStatus) {
    throw new Error('Function not implemented.');
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Success Alert */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {assessment.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {assessment.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {assessment.autoGrade && (
              <Chip
                icon={<AutoAwesome />}
                label="AI Graded"
                color="info"
              />
            )}
            {assessment.requireProctoring && (
              <Chip
                icon={<Security />}
                label="Proctored"
                color="warning"
              />
            )}
            <Chip
              icon={<Grade />}
              label={`${assessment.totalPoints} points`}
              color="primary"
            />
          </Box>
        </Box>

        {/* Progress and Timer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ flex: 1, mr: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Question {currentQuestionIndex + 1} of {assessment.extractedQuestions?.length || 0}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={((currentQuestionIndex + 1) / (assessment.extractedQuestions?.length || 1)) * 100}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
          {timeRemaining > 0 && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color={timeRemaining < 300 ? 'error' : 'text.primary'}>
                {formatTime(timeRemaining)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Time Remaining
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>

      {/* Proctoring Monitor */}
      {proctoringActive && (
        <Box sx={{ mb: 3 }}>
          <ProctoringMonitor
            assessmentId={assessmentId || ''}
            isActive={proctoringActive}
            onViolation={(violation: ProctoringViolation) => {
              console.log('Proctoring violation:', violation);
            }}
            onStatusChange={(status: ProctoringStatus) => {
              setProctoringStatus(status);
            }}
          />
        </Box>
      )}

      {/* Question */}
      {currentQuestion && currentAnswer && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom>
                  Question {currentQuestionIndex + 1}
                </Typography>
                <Chip
                  label={getQuestionTypeLabel(currentQuestion.type)}
                  size="small"
                  sx={{ mb: 2 }}
                />
                <Typography variant="body1" sx={{ mb: 3 }}>
                  {currentQuestion.question}
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {currentQuestion.points} points
              </Typography>
            </Box>

            {renderQuestion(currentQuestion, currentAnswer)}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<NavigateBefore />}
          onClick={() => handleQuestionNavigation('prev')}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {assessment.extractedQuestions?.map((_, index) => (
            <IconButton
              key={index}
              size="small"
              onClick={() => {
                handleQuestionNavigation('next');
                setCurrentQuestionIndex(index);
              }}
              sx={{
                bgcolor: index === currentQuestionIndex ? 'primary.main' : 'grey.300',
                color: index === currentQuestionIndex ? 'white' : 'text.primary',
                '&:hover': {
                  bgcolor: index === currentQuestionIndex ? 'primary.dark' : 'grey.400',
                }
              }}
            >
              {index + 1}
            </IconButton>
          ))}
        </Box>

        {currentQuestionIndex === (assessment.extractedQuestions?.length || 0) - 1 ? (
          <Button
            variant="contained"
            color="success"
            endIcon={<Send />}
            onClick={() => setShowSubmitDialog(true)}
            disabled={submitting}
          >
            Submit Assessment
          </Button>
        ) : (
          <Button
            variant="contained"
            endIcon={<NavigateNext />}
            onClick={() => handleQuestionNavigation('next')}
          >
            Next
          </Button>
        )}
      </Box>

      {/* Submit Dialog */}
      <Dialog
        open={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Submit Assessment</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to submit your assessment? This action cannot be undone.
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Summary:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <Assignment />
                </ListItemIcon>
                <ListItemText
                  primary={`${assessment.extractedQuestions?.length || 0} questions`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Grade />
                </ListItemIcon>
                <ListItemText
                  primary={`${assessment.totalPoints} total points`}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AccessTime />
                </ListItemIcon>
                <ListItemText
                  primary={`${Math.floor(answers.reduce((total, answer) => total + answer.timeSpent, 0) / 60)} minutes spent`}
                />
              </ListItem>
            </List>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowSubmitDialog(false);
              handleSubmit();
            }}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Auto-submit Warning */}
      {autoSubmitWarning && (
        <Dialog open={autoSubmitWarning} maxWidth="sm" fullWidth>
          <DialogTitle>Time's Up!</DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Your assessment has been automatically submitted due to time expiration.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAutoSubmitWarning(false)}>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Container>
  );
};

export default EnhancedTakeAssessment;


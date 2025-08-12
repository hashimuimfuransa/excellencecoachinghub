import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Tooltip
} from '@mui/material';
import {
  Timer,
  Security,
  Warning,
  Send,
  Save,
  Fullscreen,
  FullscreenExit,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import ProctoringMonitor, { ProctoringViolation, ProctoringStatus } from '../../components/Proctoring/ProctoringMonitor';
import SpecialCharacterInput from '../../components/SpecialCharacterInput';
import { assessmentService, IAssessment, IQuestion } from '../../services/assessmentService';

interface AssessmentAnswer {
  questionId: string;
  answer: string | string[];
  timeSpent: number;
}

const TakeAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  // State management
  const [assessment, setAssessment] = useState<IAssessment | null>(null);
  const [answers, setAnswers] = useState<{ [key: string]: AssessmentAnswer }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(false);
  const [proctoringStatus, setProctoringStatus] = useState<ProctoringStatus | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [autoSubmitWarning, setAutoSubmitWarning] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());
  const submissionRef = useRef<string | null>(null);

  // Load assessment
  useEffect(() => {
    if (!assessmentId) return;

    const loadAssessment = async () => {
      try {
        setLoading(true);
        const data = await assessmentService.getAssessmentById(assessmentId);
        setAssessment(data);
        
        // Initialize answers
        const initialAnswers: { [key: string]: AssessmentAnswer } = {};
        data.questions.forEach((question: IQuestion) => {
          const questionId = question._id || question.id;
          initialAnswers[questionId] = {
            questionId: questionId,
            answer: question.type === 'multiple_choice_multiple' ? [] : '',
            timeSpent: 0
          };
        });
        setAnswers(initialAnswers);

        // Set timer if time limit exists
        if (data.timeLimit) {
          setTimeRemaining(data.timeLimit * 60); // Convert minutes to seconds
        }

        // Enable proctoring if required
        if (data.proctoringEnabled || data.requireProctoring) {
          setProctoringActive(true);
          // Request fullscreen
          document.documentElement.requestFullscreen?.();
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [assessmentId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && assessment) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Auto-submit when time runs out
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timeRemaining, assessment]);

  // Handle answer changes
  const handleAnswerChange = useCallback((questionId: string, answer: string | string[]) => {
    const currentTime = Date.now();
    const timeSpent = currentTime - questionStartTimeRef.current;

    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        timeSpent: prev[questionId].timeSpent + timeSpent
      }
    }));

    questionStartTimeRef.current = currentTime;
  }, []);

  // Handle question navigation
  const handleQuestionNavigation = (direction: 'next' | 'prev') => {
    const currentTime = Date.now();
    const timeSpent = currentTime - questionStartTimeRef.current;
    
    // Update time spent on current question
    if (assessment?.questions[currentQuestionIndex]) {
      const question = assessment.questions[currentQuestionIndex];
      const questionId = question._id || question.id;
      setAnswers(prev => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          timeSpent: prev[questionId].timeSpent + timeSpent
        }
      }));
    }

    // Navigate
    if (direction === 'next' && currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }

    questionStartTimeRef.current = Date.now();
  };

  // Handle proctoring violations
  const handleProctoringViolation = useCallback((violation: ProctoringViolation) => {
    console.log('Proctoring violation:', violation);
    
    // Check if too many violations occurred
    if (proctoringStatus && proctoringStatus.warningCount >= 3) {
      setAutoSubmitWarning(true);
      // Auto-submit after 10 seconds
      setTimeout(() => {
        handleSubmit(true);
      }, 10000);
    }
  }, [proctoringStatus]);

  // Handle proctoring status changes
  const handleProctoringStatusChange = useCallback((status: ProctoringStatus) => {
    setProctoringStatus(status);
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Handle assessment submission
  const handleSubmit = async (autoSubmit = false) => {
    if (!assessment || !assessmentId) return;

    try {
      setSubmitting(true);

      // Prepare submission data
      const submissionData = {
        assessmentId,
        answers: Object.values(answers),
        totalTimeSpent: Object.values(answers).reduce((total, answer) => total + answer.timeSpent, 0),
        proctoringData: proctoringStatus ? {
          violations: proctoringStatus.violations,
          warningCount: proctoringStatus.warningCount
        } : undefined,
        isAutoSubmitted: autoSubmit
      };

      const result = await assessmentService.submitAssessment(submissionData);
      const submissionId = result.submissionId || result._id;
      submissionRef.current = submissionId;

      // Disable proctoring
      setProctoringActive(false);

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen?.();
      }

      // Navigate to results
      navigate(`/dashboard/student/assessments/${assessmentId}/result/${submissionId}`);

    } catch (err: any) {
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Render question based on type
  const renderQuestion = (question: IQuestion, answer: AssessmentAnswer) => {
    const questionId = question._id || question.id;

    switch (question.type) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={answer.answer as string}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
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
        return (
          <Box>
            {question.options?.map((option, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={(answer.answer as string[]).includes(option)}
                    onChange={(e) => {
                      const currentAnswers = answer.answer as string[];
                      const newAnswers = e.target.checked
                        ? [...currentAnswers, option]
                        : currentAnswers.filter(a => a !== option);
                      handleAnswerChange(questionId, newAnswers);
                    }}
                  />
                }
                label={option}
              />
            ))}
          </Box>
        );

      case 'short_answer':
        return (
          <TextField
            fullWidth
            multiline
            rows={3}
            value={answer.answer as string}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Enter your answer..."
          />
        );

      case 'essay':
        return (
          <TextField
            fullWidth
            multiline
            rows={8}
            value={answer.answer as string}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Write your essay here..."
          />
        );

      case 'mathematical':
        return (
          <SpecialCharacterInput
            value={answer.answer as string}
            onChange={(value) => handleAnswerChange(questionId, value)}
            placeholder="Enter your mathematical answer..."
          />
        );

      default:
        return (
          <TextField
            fullWidth
            value={answer.answer as string}
            onChange={(e) => handleAnswerChange(questionId, e.target.value)}
            placeholder="Enter your answer..."
          />
        );
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography>Loading assessment...</Typography>
        </Box>
      </Container>
    );
  }

  if (error || !assessment) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Assessment not found'}
        </Alert>
      </Container>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Proctoring Monitor */}
      {proctoringActive && (
        <ProctoringMonitor
          assessmentId={assessmentId!}
          isActive={proctoringActive}
          onViolation={handleProctoringViolation}
          onStatusChange={handleProctoringStatusChange}
        />
      )}

      <Container maxWidth="lg" sx={{ pt: proctoringActive ? 8 : 4, pb: 4 }}>
        {/* Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5">{assessment.title}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {timeRemaining > 0 && (
                  <Chip
                    icon={<Timer />}
                    label={formatTime(timeRemaining)}
                    color={timeRemaining < 300 ? 'error' : 'primary'}
                    variant="outlined"
                  />
                )}
                {(assessment.proctoringEnabled || assessment.requireProctoring) && (
                  <Tooltip title="Proctoring Active">
                    <Chip
                      icon={<Security />}
                      label="Monitored"
                      color="warning"
                      variant="outlined"
                    />
                  </Tooltip>
                )}
                <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                  <IconButton onClick={toggleFullscreen}>
                    {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Progress */}
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  Question {currentQuestionIndex + 1} of {assessment.questions.length}
                </Typography>
                <Typography variant="body2">
                  {Math.round(progress)}% Complete
                </Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} />
            </Box>
          </CardContent>
        </Card>

        {/* Question */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {currentQuestion.question}
            </Typography>
            
            {currentQuestion.points && (
              <Chip
                label={`${currentQuestion.points} points`}
                size="small"
                color="primary"
                sx={{ mb: 2 }}
              />
            )}

            <Box sx={{ mt: 3 }}>
              {renderQuestion(currentQuestion, answers[currentQuestion._id || currentQuestion.id])}
            </Box>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            onClick={() => handleQuestionNavigation('prev')}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Save />}
              onClick={() => {/* Auto-save functionality */}}
            >
              Save Progress
            </Button>

            {currentQuestionIndex === assessment.questions.length - 1 ? (
              <Button
                variant="contained"
                startIcon={<Send />}
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
        </Box>

        {/* Auto-submit Warning */}
        {autoSubmitWarning && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="h6">Warning: Too Many Violations Detected</Typography>
            <Typography>
              Your assessment will be automatically submitted in 10 seconds due to multiple proctoring violations.
            </Typography>
          </Alert>
        )}
      </Container>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>Submit Assessment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to submit your assessment? You cannot make changes after submission.
          </Typography>
          {proctoringStatus && proctoringStatus.warningCount > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Note: {proctoringStatus.warningCount} proctoring violations were recorded during this assessment.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button onClick={() => handleSubmit()} variant="contained" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeAssessment;

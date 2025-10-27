import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Paper,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Divider,
  IconButton,
  TextField,
  useTheme
} from '@mui/material';
import {
  Timer,
  NavigateNext,
  NavigateBefore,
  Flag,
  CheckCircle,
  Warning,
  Info,
  Close,
  ArrowBack
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { smartTestService } from '../services/smartTestService';
import SimpleProfileGuard from '../components/SimpleProfileGuard';

interface SmartTestQuestion {
  id: string;
  question: string;
  type: string;
  options: string[];
  category: string;
}

interface SmartTest {
  _id: string;
  testId: string;
  title: string;
  description: string;
  jobTitle: string;
  company: string;
  questions: SmartTestQuestion[];
  timeLimit: number;
  difficulty: string;
  questionCount: number;
}

const TakeSmartTestPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAuth();

  // Get data from navigation state
  const { sessionId, test, questions: adminQuestions, isAdminTest, totalQuestions, timeLimit } = location.state as { 
    sessionId: string; 
    test: SmartTest; 
    questions?: SmartTestQuestion[];
    isAdminTest?: boolean;
    totalQuestions?: number;
    timeLimit?: number;
  };

  // Determine which questions to use - admin questions if available, otherwise test questions
  const testQuestions = adminQuestions || test.questions || [];
  const testTimeLimit = timeLimit || test.timeLimit;

  // State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(testTimeLimit * 60); // Convert to seconds
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (!test || !sessionId) {
      navigate('/smart-tests');
      return;
    }
    
    // Debug logging for questions structure
    console.log('Test Questions Debug:', {
      isAdminTest,
      adminQuestions: adminQuestions?.length || 0,
      testQuestions: test.questions?.length || 0,
      totalTestQuestions: testQuestions.length,
      firstQuestionId: testQuestions[0]?.id,
      firstQuestionStructure: testQuestions[0]
    });
  }, [test, sessionId, navigate]);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time up - auto submit
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    const percentage = (timeRemaining / (test.timeLimit * 60)) * 100;
    if (percentage > 20) return theme.palette.success.main;
    if (percentage > 10) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    console.log(`Answer changed for question ${questionId}:`, value);
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: value
      };
      console.log('Updated answers object:', newAnswers);
      return newAnswers;
    });
  };

  const renderAnswerInput = (question: SmartTestQuestion) => {
    const questionType = question.type || 'multiple_choice';
    
    // For questions that require text input (no options or open-ended questions)
    if (!question.options || question.options.length === 0 || 
        questionType === 'technical' || questionType === 'case_study' || 
        questionType === 'coding_challenge') {
      
      return (
        <TextField
          fullWidth
          multiline
          rows={6}
          value={answers[question.id] || ''}
          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          placeholder="Type your answer here..."
          variant="outlined"
          sx={{
            '& .MuiOutlinedInput-root': {
              fontSize: '1rem',
              lineHeight: 1.5
            }
          }}
        />
      );
    }
    
    // For multiple choice questions
    return (
      <FormControl component="fieldset" fullWidth>
        <RadioGroup
          value={answers[question.id] !== undefined ? answers[question.id] : ''}
          onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
        >
          {question.options.map((option, index) => (
            <FormControlLabel
              key={index}
              value={index}
              control={<Radio />}
              label={
                <Typography variant="body1" sx={{ py: 1 }}>
                  {option}
                </Typography>
              }
              sx={{
                mb: 1,
                p: 2,
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                }
              }}
            />
          ))}
        </RadioGroup>
      </FormControl>
    );
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < testQuestions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const handleSubmitTest = async () => {
    try {
      setSubmitting(true);
      
      // Calculate time spent
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      console.log('Submitting smart test with:', {
        testId: test.testId,
        sessionId,
        answers,
        timeSpent,
        answersKeys: Object.keys(answers),
        answersValues: Object.values(answers),
        questionIds: testQuestions.map(q => q.id),
        totalQuestions: testQuestions.length
      });

      // Use appropriate test ID - for admin tests use _id, for regular tests use testId
      const testIdToSubmit = isAdminTest ? test._id : test.testId;
      
      const result = await smartTestService.submitSmartTest(
        testIdToSubmit,
        sessionId,
        answers,
        timeSpent
      );

      console.log('Smart test submitted successfully:', result);

      if (!result || !result._id) {
        console.error('Invalid result structure:', result);
        throw new Error('Invalid response from server');
      }

      console.log('Navigating to results page with resultId:', result._id);

      // Navigate to results page
      try {
        navigate('/app/smart-test-results', {
          state: { 
            resultId: result._id,
            justCompleted: true 
          }
        });
        console.log('Navigation successful');
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Fallback: Try to navigate to results page without state
        navigate('/app/smart-test-results');
      }

    } catch (error: any) {
      console.error('Error submitting smart test:', error);
      
      // Provide specific error message based on error type
      let errorMessage = 'Failed to submit test';
      if (error.message === 'Invalid response from server') {
        errorMessage = 'Invalid response from server. Please try again.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const isQuestionAnswered = (question: SmartTestQuestion) => {
    const answer = answers[question.id];
    if (answer === undefined || answer === null) return false;
    // For text answers, check if it's not empty
    if (typeof answer === 'string') return answer.trim().length > 0;
    // For multiple choice, check if it's a valid number (including 0)
    return typeof answer === 'number' && answer >= 0;
  };

  const getAnsweredQuestionsCount = () => {
    return testQuestions.filter(isQuestionAnswered).length;
  };

  const currentQuestion = testQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / testQuestions.length) * 100;
  const isLastQuestion = currentQuestionIndex === testQuestions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  if (!test || !sessionId || !testQuestions || testQuestions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          {!test || !sessionId 
            ? "Invalid test session. Please start a new test." 
            : "No questions available for this test. Please contact support."
          }
        </Alert>
        <Box mt={2}>
          <Button 
            variant="contained" 
            onClick={() => navigate('/smart-tests')}
            startIcon={<ArrowBack />}
          >
            Back to Tests
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <SimpleProfileGuard feature="smartTests">
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header with timer and progress */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Box display="flex" alignItems="center">
            <IconButton
              onClick={() => navigate(-1)}
              sx={{ 
                mr: 2,
                '&:hover': {
                  bgcolor: theme.palette.action.hover
                }
              }}
            >
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                {test.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {test.jobTitle} at {test.company}
              </Typography>
            </Box>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              icon={<Timer />}
              label={formatTime(timeRemaining)}
              color={timeRemaining < 300 ? 'error' : timeRemaining < 600 ? 'warning' : 'success'}
              sx={{ fontSize: '1rem', px: 2 }}
            />
            
            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                Question {currentQuestionIndex + 1} of {testQuestions.length}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ width: 120, mt: 0.5 }}
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Question Navigation */}
      <Box mb={3}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Questions Overview ({getAnsweredQuestionsCount()}/{testQuestions.length} answered)
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={1}>
          {testQuestions.map((question, index) => (
            <Button
              key={index}
              variant={index === currentQuestionIndex ? 'contained' : 'outlined'}
              color={isQuestionAnswered(question) ? 'success' : 'inherit'}
              size="small"
              onClick={() => goToQuestion(index)}
              sx={{ minWidth: 40, height: 40 }}
            >
              {index + 1}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Current Question */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box mb={3}>
            <Box display="flex" alignItems="center" mb={2} gap={1}>
              <Chip 
                label={`Question ${currentQuestionIndex + 1}`}
                color="primary"
                size="small"
              />
              <Chip 
                label={currentQuestion.category}
                variant="outlined"
                size="small"
              />
              <Chip 
                label={currentQuestion.type?.replace('_', ' ') || 'multiple choice'}
                color="secondary"
                size="small"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            
            <Typography variant="h6" component="div" sx={{ lineHeight: 1.5 }}>
              {currentQuestion.question}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Answer Options */}
          {renderAnswerInput(currentQuestion)}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Button
          variant="outlined"
          startIcon={<NavigateBefore />}
          onClick={() => goToQuestion(currentQuestionIndex - 1)}
          disabled={isFirstQuestion}
        >
          Previous
        </Button>

        <Box display="flex" gap={2}>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<Flag />}
            onClick={() => setShowSubmitDialog(true)}
            disabled={submitting}
          >
            Submit Test
          </Button>

          {!isLastQuestion ? (
            <Button
              variant="contained"
              endIcon={<NavigateNext />}
              onClick={() => goToQuestion(currentQuestionIndex + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => setShowSubmitDialog(true)}
              disabled={submitting}
            >
              Finish Test
            </Button>
          )}
        </Box>
      </Box>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => !submitting && setShowSubmitDialog(false)}>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Warning sx={{ mr: 1, color: theme.palette.warning.main }} />
            Submit Smart Test
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Are you sure you want to submit your test? This action cannot be undone.
          </Alert>
          
          <Box>
            <Typography variant="body1" gutterBottom>
              <strong>Test Summary:</strong>
            </Typography>
            <Typography variant="body2">
              • Questions Answered: {getAnsweredQuestionsCount()} / {testQuestions.length}
            </Typography>
            <Typography variant="body2">
              • Time Remaining: {formatTime(timeRemaining)}
            </Typography>
            <Typography variant="body2">
              • Unanswered Questions: {testQuestions.length - getAnsweredQuestionsCount()}
            </Typography>
          </Box>
          
          {getAnsweredQuestionsCount() < testQuestions.length && (
            <Alert severity="info" sx={{ mt: 2 }}>
              You have {testQuestions.length - getAnsweredQuestionsCount()} unanswered questions. 
              These will be marked as incorrect.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowSubmitDialog(false)}
            disabled={submitting}
          >
            Continue Test
          </Button>
          <Button 
            onClick={handleSubmitTest}
            variant="contained"
            color="warning"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Warning for page refresh/close */}
      {typeof window !== 'undefined' && (
        <Box
          component="script"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('beforeunload', function(e) {
                e.preventDefault();
                e.returnValue = 'Are you sure you want to leave? Your test progress will be lost.';
              });
            `
          }}
        />
      )}
    </Container>
    </SimpleProfileGuard>
  );
};

export default TakeSmartTestPage;
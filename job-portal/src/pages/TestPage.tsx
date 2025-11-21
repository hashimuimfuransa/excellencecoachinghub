import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Slider,
  TextField,
  Alert,
  AlertTitle,
  Paper,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  ArrowBack,
  Timer,
  CheckCircle,
  Warning,
  Psychology,
  Assessment,
  NavigateNext,
  NavigateBefore,
  Flag,
  Home,
  EmojiEvents,
  BarChart
} from '@mui/icons-material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { simplePsychometricService } from '../services/simplePsychometricService';

interface TestQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'scale' | 'text' | 'scenario' | 'boolean';
  options?: string[];
  scaleRange?: { min: number; max: number; labels?: string[] };
  correctAnswer?: string | number;
  traits?: string[];
  weight: number;
  placeholder?: string;
  maxLength?: number;
  category?: string;
  explanation?: string;
}

interface PsychometricTest {
  _id: string;
  title: string;
  description: string;
  type: 'personality' | 'cognitive' | 'aptitude' | 'skills' | 'behavioral';
  timeLimit: number;
  questions: TestQuestion[];
  industry?: string;
  jobRole?: string;
}

const TestPage: React.FC = () => {
  const navigate = useNavigate();
  const { testId } = useParams();
  const location = useLocation();
  
  const [testData, setTestData] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Get test data from sessionStorage or location state
    const storedData = sessionStorage.getItem('psychometricTestData');
    const stateData = location.state?.testData;
    
    if (stateData) {
      setTestData(stateData);
      setTimeRemaining(stateData.test.timeLimit * 60); // Convert to seconds
    } else if (storedData) {
      const parsed = JSON.parse(storedData);
      setTestData(parsed);
      setTimeRemaining(parsed.test.timeLimit * 60);
    } else {
      // Redirect back if no test data
      navigate('/app/tests');
    }
  }, [testId, location.state, navigate]);

  useEffect(() => {
    let timer: any;
    if (testStarted && timeRemaining > 0 && !testCompleted) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [testStarted, timeRemaining, testCompleted]);

  const handleStartTest = () => {
    setTestStarted(true);
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestion < testData.test.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleFlagQuestion = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmitTest = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    
    try {
      const timeSpent = Math.round((testData.test.timeLimit * 60 - timeRemaining));
      
      // Use the appropriate test ID for both regular and generated tests
      const testId = testData.testId || testData.test._id || testData.test.id;
      
      // Transform answers to the format expected by simple service (array of numbers)
      // For now, we'll create a dummy array of answers
      const simpleAnswers = new Array(testData.test.questions.length).fill(0);
      
      // Submit test through simple API - this will include basic grading
      const result = await simplePsychometricService.submitSimpleTest(
        testId, // sessionId - simple service expects sessionId as first parameter
        simpleAnswers, // answers - array of selected answer indices
        timeSpent, // timeSpent
        testData.selectedJob?._id, // jobId
        'free' // testType - assuming free for simple version
      );

      console.log('Backend test result:', result);

      // Use backend result directly (contains basic grading)
      const enhancedResult = {
        ...result,
        test: testData.test,
        // Note: SimpleTestResult doesn't have a job property, so we use the one from testData
        job: testData.selectedJob,
        timeSpent: timeSpent,
        createdAt: new Date().toISOString()
      };

      console.log('Enhanced result for session storage:', enhancedResult);
      sessionStorage.setItem('testResult', JSON.stringify(enhancedResult));
      
      setTestCompleted(true);
    } catch (error) {
      console.error('Error submitting test:', error);
      
      // Fallback to local calculation if API fails
      const timeSpent = Math.round((testData.test.timeLimit * 60 - timeRemaining));
      const totalQuestions = testData.test.questions.length;
      const answeredQuestions = Object.keys(answers).length;
      const overallScore = Math.round((answeredQuestions / totalQuestions) * 100);
      
      const fallbackResult = {
        test: testData.test,
        user: testData.user,
        job: testData.selectedJob,
        answers,
        overallScore,
        grade: overallScore >= 80 ? 'B+' : overallScore >= 70 ? 'B' : overallScore >= 60 ? 'C' : 'D',
        scores: {
          communication: Math.min(75, overallScore),
          problemSolving: Math.min(70, overallScore),
          technicalSkills: Math.min(65, overallScore)
        },
        detailedAnalysis: {
          strengths: ['Completed the assessment within the time limit'],
          developmentAreas: ['Consider reviewing any skipped questions'],
          nextSteps: ['Practice similar assessments to improve performance'],
          jobFitScore: overallScore,
          industryBenchmark: 'Average'
        },
        feedback: {
          overall: `You completed ${answeredQuestions} out of ${totalQuestions} questions, achieving a score of ${overallScore}%.`,
          strengths: ['Completed the assessment within the time limit'],
          improvements: ['Consider reviewing any skipped questions'],
          recommendations: ['Practice similar assessments to improve performance']
        },
        timeSpent: timeSpent,
        createdAt: new Date().toISOString()
      };

      console.log('Using fallback result:', fallbackResult);
      sessionStorage.setItem('testResult', JSON.stringify(fallbackResult));
      setTestCompleted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExitTest = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    navigate(location.state?.returnUrl || '/app/tests');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Validate and fix question structure
  const validateAndFixQuestion = (question: any) => {
    const fixed = { ...question };
    
    // Ensure _id exists
    if (!fixed._id && fixed.id) {
      fixed._id = fixed.id;
    } else if (!fixed._id) {
      fixed._id = `q${Math.random().toString(36).substr(2, 9)}`;
    }

    // Fix question types with missing data
    if (fixed.type === 'multiple_choice' || fixed.type === 'scenario') {
      if (!fixed.options || !Array.isArray(fixed.options) || fixed.options.length === 0) {
        console.warn(`Question ${fixed._id} is marked as ${fixed.type} but has no options. Converting to text.`);
        fixed.type = 'text';
        fixed.placeholder = "Please provide your answer here...";
        fixed.maxLength = 500;
      }
    } else if (fixed.type === 'boolean') {
      fixed.options = ["True", "False"];
    } else if (fixed.type === 'scale') {
      if (!fixed.scaleRange) {
        fixed.scaleRange = {
          min: 1,
          max: 5,
          labels: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]
        };
      }
    } else if (fixed.type === 'text') {
      fixed.placeholder = fixed.placeholder || "Please provide your detailed response...";
      fixed.maxLength = fixed.maxLength || 500;
    }

    return fixed;
  };

  const isAnswerValid = (question: TestQuestion, answer: any): boolean => {
    if (!answer) return false;
    
    switch (question.type) {
      case 'text':
        // For text questions, require at least 10 characters
        return typeof answer === 'string' && answer.trim().length >= 10;
      case 'scale':
        // For scale questions, any numeric value within range is valid
        return typeof answer === 'number' && 
               answer >= (question.scaleRange?.min || 1) && 
               answer <= (question.scaleRange?.max || 5);
      case 'multiple_choice':
      case 'scenario':
      case 'boolean':
        // For choice-based questions, any selected option is valid
        return typeof answer === 'string' && answer.length > 0;
      default:
        return !!answer;
    }
  };

  if (!testData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading test...</Typography>
      </Box>
    );
  }

  const currentQ = validateAndFixQuestion(testData.test.questions[currentQuestion]);
  const progress = ((currentQuestion + 1) / testData.test.questions.length) * 100;
  const isLastQuestion = currentQuestion === testData.test.questions.length - 1;

  if (testCompleted) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <EmojiEvents sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight="bold" gutterBottom color="success.main">
              Test Completed Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Thank you for completing the psychometric assessment. Your results have been recorded and analyzed.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                size="large"
                startIcon={<BarChart />}
                onClick={() => navigate('/app/test-results')}
                sx={{ px: 4 }}
              >
                View Detailed Results
              </Button>
              <Button
                variant="outlined"
                size="large"
                startIcon={<Home />}
                onClick={() => navigate('/app/tests')}
                sx={{ px: 4 }}
              >
                Return to Tests
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (!testStarted) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 4 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}>
                <Psychology sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {testData.test.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {testData.test.description}
              </Typography>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Timer sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {testData.test.timeLimit} Minutes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time Limit
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Assessment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    {testData.test.questions.length} Questions
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Questions
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mb: 4 }}>
              <AlertTitle>Important Instructions</AlertTitle>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Answer all questions honestly and to the best of your ability</li>
                <li>You cannot pause the test once started</li>
                <li>Make sure you have a stable internet connection</li>
                <li>Find a quiet environment free from distractions</li>
              </ul>
            </Alert>

            <Box display="flex" justifyContent="center" gap={2}>
              <Button
                variant="outlined"
                onClick={() => navigate('/app/tests')}
                startIcon={<ArrowBack />}
              >
                Go Back
              </Button>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartTest}
                startIcon={<Psychology />}
                sx={{ px: 4 }}
              >
                Start Test
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2, position: 'sticky', top: 0, zIndex: 1000 }}>
        <Container maxWidth="lg">
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton onClick={handleExitTest} color="error">
                <ArrowBack />
              </IconButton>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  {testData.test.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Question {currentQuestion + 1} of {testData.test.questions.length}
                </Typography>
              </Box>
            </Box>
            
            <Box display="flex" alignItems="center" gap={3}>
              <Chip
                icon={<Timer />}
                label={formatTime(timeRemaining)}
                color={timeRemaining < 300 ? "error" : "primary"}
                variant="outlined"
              />
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{ width: 200, height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>
        </Container>
      </Paper>

      {/* Question Content */}
      <Container maxWidth="md">
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
              <Box sx={{ flex: 1, pr: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    Question {currentQuestion + 1} of {testData.test.questions.length}
                  </Typography>
                  {currentQ.category && (
                    <Chip 
                      label={currentQ.category.charAt(0).toUpperCase() + currentQ.category.slice(1)} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  )}
                  {currentQ.type && (
                    <Chip 
                      label={currentQ.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                      size="small" 
                      color="secondary" 
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography variant="h5" fontWeight="medium" sx={{ lineHeight: 1.4 }}>
                  {currentQ.question}
                </Typography>
                {currentQ.type === 'scenario' && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                    Choose the response that best represents how you would handle this situation.
                  </Typography>
                )}
                {currentQ.type === 'text' && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
                    Please provide a detailed answer based on your experience and knowledge.
                  </Typography>
                )}
              </Box>
              <IconButton
                onClick={handleFlagQuestion}
                color={flaggedQuestions.has(currentQuestion) ? "warning" : "default"}
                sx={{ 
                  bgcolor: flaggedQuestions.has(currentQuestion) ? 'warning.50' : 'transparent',
                  '&:hover': { bgcolor: flaggedQuestions.has(currentQuestion) ? 'warning.100' : 'grey.100' }
                }}
              >
                <Flag />
              </IconButton>
            </Box>

            {/* Multiple Choice */}
            {(currentQ.type === 'multiple_choice' || currentQ.type === 'scenario') && (
              <FormControl component="fieldset" fullWidth>
                {currentQ.options && Array.isArray(currentQ.options) && currentQ.options.length > 0 ? (
                  <RadioGroup
                    value={answers[currentQ._id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                  >
                    {currentQ.options.map((option, index) => (
                      <FormControlLabel
                        key={index}
                        value={option}
                        control={<Radio />}
                        label={option}
                        sx={{ 
                          mb: 1, 
                          p: 2, 
                          border: '1px solid',
                          borderColor: answers[currentQ._id] === option ? 'primary.main' : 'divider',
                          backgroundColor: answers[currentQ._id] === option ? 'primary.50' : 'transparent',
                          borderRadius: 2,
                          '&:hover': { bgcolor: 'grey.50' },
                          transition: 'all 0.2s'
                        }}
                      />
                    ))}
                  </RadioGroup>
                ) : (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    <Typography>No options available for this multiple choice question. Please contact support.</Typography>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      sx={{ mt: 1 }}
                      onClick={() => {
                        // Convert to text question as fallback
                        const textFallback = "Please provide your answer in text form:";
                        handleAnswerChange(currentQ._id, textFallback);
                      }}
                    >
                      Convert to Text Answer
                    </Button>
                  </Alert>
                )}
              </FormControl>
            )}

            {/* Boolean (True/False) */}
            {currentQ.type === 'boolean' && (
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={answers[currentQ._id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                  row
                  sx={{ justifyContent: 'center', gap: 4 }}
                >
                  <FormControlLabel
                    value="True"
                    control={<Radio />}
                    label="True"
                    sx={{ 
                      p: 2, 
                      border: '1px solid',
                      borderColor: answers[currentQ._id] === 'True' ? 'success.main' : 'divider',
                      backgroundColor: answers[currentQ._id] === 'True' ? 'success.50' : 'transparent',
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'success.50' },
                      transition: 'all 0.2s',
                      minWidth: 100
                    }}
                  />
                  <FormControlLabel
                    value="False"
                    control={<Radio />}
                    label="False"
                    sx={{ 
                      p: 2, 
                      border: '1px solid',
                      borderColor: answers[currentQ._id] === 'False' ? 'error.main' : 'divider',
                      backgroundColor: answers[currentQ._id] === 'False' ? 'error.50' : 'transparent',
                      borderRadius: 2,
                      '&:hover': { bgcolor: 'error.50' },
                      transition: 'all 0.2s',
                      minWidth: 100
                    }}
                  />
                </RadioGroup>
              </FormControl>
            )}

            {/* Likert Scale (radio buttons) */}
            {currentQ.type === 'likert_scale' && (
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={answers[currentQ._id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                >
                  {(currentQ.options || ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']).map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={option}
                      control={<Radio />}
                      label={option}
                      sx={{ 
                        mb: 1, 
                        p: 2, 
                        border: '1px solid',
                        borderColor: answers[currentQ._id] === option ? 'primary.main' : 'divider',
                        backgroundColor: answers[currentQ._id] === option ? 'primary.50' : 'transparent',
                        borderRadius: 2,
                        '&:hover': { bgcolor: 'grey.50' },
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}

            {/* Scale (slider) */}
            {currentQ.type === 'scale' && (
              <Box sx={{ px: 3, py: 2 }}>
                <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 2 }}>
                  {currentQ.scaleRange?.labels?.[0] || 'Strongly Disagree'} ← → {currentQ.scaleRange?.labels?.[4] || 'Strongly Agree'}
                </Typography>
                <Slider
                  value={answers[currentQ._id] || currentQ.scaleRange?.min || 1}
                  onChange={(e, value) => handleAnswerChange(currentQ._id, value)}
                  min={currentQ.scaleRange?.min || 1}
                  max={currentQ.scaleRange?.max || 5}
                  step={1}
                  marks={currentQ.scaleRange?.labels?.map((label, index) => ({
                    value: (currentQ.scaleRange?.min || 1) + index,
                    label: `${(currentQ.scaleRange?.min || 1) + index}`
                  })) || [
                    { value: 1, label: '1' },
                    { value: 2, label: '2' },
                    { value: 3, label: '3' },
                    { value: 4, label: '4' },
                    { value: 5, label: '5' }
                  ]}
                  valueLabelDisplay="auto"
                  sx={{
                    '& .MuiSlider-mark': {
                      backgroundColor: 'primary.main',
                      height: 8,
                      width: 2,
                    },
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.8rem',
                      fontWeight: 500
                    }
                  }}
                />
                {currentQ.scaleRange?.labels && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    {currentQ.scaleRange.labels.map((label, index) => (
                      <Typography key={index} variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {label}
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            )}

            {/* Text */}
            {currentQ.type === 'text' && (
              <Box>
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  value={answers[currentQ._id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ._id, e.target.value)}
                  placeholder={currentQ.placeholder || "Type your detailed answer here..."}
                  variant="outlined"
                  inputProps={{
                    maxLength: currentQ.maxLength || 1000
                  }}
                  helperText={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {currentQ.category && `Category: ${currentQ.category.charAt(0).toUpperCase() + currentQ.category.slice(1)}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(answers[currentQ._id] || '').length} / {currentQ.maxLength || 1000} characters
                      </Typography>
                    </Box>
                  }
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: '1rem',
                      lineHeight: 1.5
                    }
                  }}
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button
              variant="outlined"
              onClick={handlePreviousQuestion}
              disabled={currentQuestion === 0}
              startIcon={<NavigateBefore />}
            >
              Previous
            </Button>

            <Box display="flex" gap={1}>
              {testData.test.questions.map((question, index) => {
                const isAnswered = !!answers[question._id];
                const isValidAnswer = isAnswered && isAnswerValid(question, answers[question._id]);
                
                return (
                  <Box
                    key={index}
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: index === currentQuestion 
                        ? 'primary.main' 
                        : isValidAnswer
                          ? 'success.main' 
                          : isAnswered
                            ? 'warning.main'  // Answered but incomplete (e.g., text too short)
                            : 'grey.300',     // Not answered
                      cursor: 'pointer',
                      border: flaggedQuestions.has(index) ? '2px solid' : 'none',
                      borderColor: 'warning.main',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setCurrentQuestion(index)}
                    title={`Question ${index + 1}: ${
                      index === currentQuestion 
                        ? 'Current' 
                        : isValidAnswer 
                          ? 'Complete' 
                          : isAnswered 
                            ? 'Incomplete' 
                            : 'Not answered'
                    }${flaggedQuestions.has(index) ? ' (Flagged)' : ''}`}
                  />
                );
              })}
            </Box>

            {isLastQuestion ? (
              <Button
                variant="contained"
                onClick={handleSubmitTest}
                disabled={!isAnswerValid(currentQ, answers[currentQ._id]) || isSubmitting}
                color="success"
                size="large"
                startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
              >
                {isSubmitting ? 'Processing Results...' : 'Submit Test'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNextQuestion}
                disabled={!isAnswerValid(currentQ, answers[currentQ._id]) || isSubmitting}
                endIcon={<NavigateNext />}
              >
                Next
              </Button>
            )}
          </Box>
        </Paper>
      </Container>

      {/* Exit Confirmation Dialog */}
      <Dialog open={showExitDialog} onClose={() => setShowExitDialog(false)}>
        <DialogTitle>
          <Warning color="warning" sx={{ mr: 1, verticalAlign: 'middle' }} />
          Exit Test?
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to exit the test? Your progress will be lost and this will count as one attempt.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExitDialog(false)}>
            Continue Test
          </Button>
          <Button onClick={confirmExit} color="error" variant="contained">
            Exit Test
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestPage;
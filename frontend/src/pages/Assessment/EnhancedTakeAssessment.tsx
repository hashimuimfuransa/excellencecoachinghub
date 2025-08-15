import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  AppBar,
  Toolbar,
  Avatar,
  Stack,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  CircularProgress,
  Select,
  MenuItem,
  alpha,
  useTheme
} from '@mui/material';
import {
  Timer,
  Visibility,
  VisibilityOff,
  Warning,
  Security,
  Videocam,
  VideocamOff,
  ScreenShare,
  Stop,
  Flag,
  Help,
  NavigateNext,
  NavigateBefore,
  Save,
  Send,
  Psychology,
  AutoAwesome,
  Shield
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { assessmentService } from '../../services/assessmentService';
import { proctoringService } from '../../services/proctoringService';
import { aiGradingService } from '../../services/aiGradingService';
import MathInput from '../../components/MathInput/MathInput';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';

interface Question {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'math' | 'code';
  options?: string[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
  timeLimit?: number;
  allowPartialCredit?: boolean;
}

interface Assessment {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  questions: Question[];
  timeLimit: number;
  attempts: number;
  passingScore: number;
  isProctored: boolean;
  proctoringSettings: {
    enableWebcam: boolean;
    enableScreenRecording: boolean;
    enableTabSwitchDetection: boolean;
    enableCopyPasteDetection: boolean;
    enableFaceDetection: boolean;
    enableAIMonitoring: boolean;
    allowedTabSwitches: number;
    warningThreshold: number;
    terminationThreshold: number;
  };
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Answer {
  questionId: string;
  answer: string;
  timeSpent: number;
  flagged: boolean;
}

const EnhancedTakeAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();

  // Redirect to proctored interface
  useEffect(() => {
    if (assessmentId) {
      navigate(`/proctored-assessment/${assessmentId}/take`, {
        state: location.state,
        replace: true
      });
    }
  }, [assessmentId, navigate, location.state]);

  // Assessment state
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Proctoring state
  const [proctoringActive, setProctoringActive] = useState(false);
  const [proctoringSession, setProctoringSession] = useState<any>(null);
  const [violations, setViolations] = useState<any[]>([]);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [screenShareEnabled, setScreenShareEnabled] = useState(false);

  // UI state
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSystemCheck, setShowSystemCheck] = useState(false);
  const [systemRequirements, setSystemRequirements] = useState<any>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Load assessment
  useEffect(() => {
    const loadAssessment = async () => {
      if (!assessmentId) return;

      try {
        setLoading(true);
        const data = await assessmentService.getAssessmentById(assessmentId);
        setAssessment(data);
        setTimeRemaining(data.timeLimit * 60); // Convert minutes to seconds
        
        // Initialize answers
        const initialAnswers: Answer[] = data.questions.map(q => ({
          questionId: q._id,
          answer: '',
          timeSpent: 0,
          flagged: false
        }));
        setAnswers(initialAnswers);

        // Check if proctoring is required
        if (data.isProctored) {
          setShowSystemCheck(true);
        } else {
          setShowInstructions(true);
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
    if (timeRemaining > 0 && !showInstructions && !showSystemCheck) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeRemaining, showInstructions, showSystemCheck]);

  // System requirements check
  const checkSystemRequirements = async () => {
    try {
      const requirements = await proctoringService.checkSystemRequirements();
      setSystemRequirements(requirements);
      
      if (!requirements.webcam || !requirements.screenShare) {
        setError('System requirements not met. Please ensure webcam and screen sharing are available.');
        return false;
      }
      
      return true;
    } catch (error) {
      setError('Failed to check system requirements');
      return false;
    }
  };

  // Start proctoring
  const startProctoring = async () => {
    if (!assessment?.isProctored) return;

    try {
      const session = await proctoringService.startSession(
        assessment._id,
        assessment.proctoringSettings
      );
      setProctoringSession(session);
      setProctoringActive(true);
      setWebcamEnabled(true);
      setScreenShareEnabled(true);
    } catch (error: any) {
      setError(error.message || 'Failed to start proctoring');
    }
  };

  // Start assessment
  const startAssessment = async () => {
    if (assessment?.isProctored) {
      const requirementsOk = await checkSystemRequirements();
      if (!requirementsOk) return;
      
      await startProctoring();
    }
    
    setShowInstructions(false);
    setShowSystemCheck(false);
    questionStartTime.current = Date.now();
  };

  // Handle answer change
  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => prev.map(a => 
      a.questionId === questionId 
        ? { ...a, answer }
        : a
    ));
  };

  // Navigate to question
  const goToQuestion = (index: number) => {
    if (index < 0 || index >= (assessment?.questions.length || 0)) return;
    
    // Update time spent on current question
    const timeSpent = Date.now() - questionStartTime.current;
    setAnswers(prev => prev.map(a => 
      a.questionId === assessment?.questions[currentQuestionIndex]._id
        ? { ...a, timeSpent: a.timeSpent + timeSpent }
        : a
    ));
    
    setCurrentQuestionIndex(index);
    questionStartTime.current = Date.now();
  };

  // Flag question
  const toggleFlag = (questionId: string) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });

    setAnswers(prev => prev.map(a => 
      a.questionId === questionId 
        ? { ...a, flagged: !a.flagged }
        : a
    ));
  };

  // Auto submit when time runs out
  const handleAutoSubmit = async () => {
    await handleSubmit(true);
  };

  // Submit assessment
  const handleSubmit = async (autoSubmit = false) => {
    if (!assessment || submitting) return;

    try {
      setSubmitting(true);

      // Stop proctoring
      if (proctoringActive) {
        await proctoringService.endSession();
        setProctoringActive(false);
      }

      // Submit answers
      const submission = {
        assessmentId: assessment._id,
        answers: answers.map(a => ({
          questionId: a.questionId,
          answer: a.answer
        })),
        timeSpent: (assessment.timeLimit * 60) - timeRemaining,
        autoSubmitted: autoSubmit
      };

      await assessmentService.submitAssessment(submission);

      // Navigate to results
      navigate(`/assessment/${assessmentId}/results`);
      
    } catch (error: any) {
      setError(error.message || 'Failed to submit assessment');
      setSubmitting(false);
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get time color based on remaining time
  const getTimeColor = (): 'error' | 'warning' | 'primary' => {
    const totalTime = (assessment?.timeLimit || 0) * 60;
    const percentage = (timeRemaining / totalTime) * 100;
    
    if (percentage <= 10) return 'error';
    if (percentage <= 25) return 'warning';
    return 'primary';
  };

  // Render question based on type
  const renderQuestion = (question: Question, answer: string) => {
    switch (question.type) {
      case 'multiple_choice':
        // Handle different ways options might be stored
        const options = question.options || [];
        
        if (!options || options.length === 0) {
          return (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Options not available</strong><br/>
                This appears to be a multiple choice question, but no options were provided.
                Please contact your instructor.
              </Typography>
            </Alert>
          );
        }
        
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'medium', color: 'text.secondary' }}>
              📝 Select one answer:
            </Typography>
            <RadioGroup
              value={answer}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            >
              {options.map((option, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderColor: answer === option ? 'primary.main' : 'grey.300',
                      backgroundColor: answer === option 
                        ? alpha(theme.palette.primary.main, 0.08) 
                        : 'transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateY(-1px)',
                        boxShadow: 1
                      }
                    }}
                    onClick={() => handleAnswerChange(question._id, option)}
                  >
                    <FormControlLabel
                      value={option}
                      control={
                        <Radio 
                          checked={answer === option}
                          sx={{ 
                            color: answer === option ? 'primary.main' : 'grey.400',
                            '&.Mui-checked': { color: 'primary.main' }
                          }} 
                        />
                      }
                      label={
                        <Typography variant="body1" sx={{ ml: 1 }}>
                          <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                        </Typography>
                      }
                      sx={{ margin: 0, width: '100%' }}
                    />
                  </Paper>
                </Box>
              ))}
            </RadioGroup>
          </Box>
        );

      case 'true_false':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'medium', color: 'text.secondary' }}>
              🎯 Select True or False:
            </Typography>
            <Grid container spacing={2}>
              {['true', 'false'].map((option, index) => (
                <Grid item xs={6} key={option}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 3,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      borderColor: answer === option ? 'primary.main' : 'grey.300',
                      backgroundColor: answer === option
                        ? alpha(theme.palette.primary.main, 0.08)
                        : 'transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                    onClick={() => handleAnswerChange(question._id, option)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <Radio
                        checked={answer === option}
                        sx={{ 
                          color: answer === option ? 'primary.main' : 'grey.400',
                          '&.Mui-checked': { color: 'primary.main' }
                        }}
                      />
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        color: answer === option ? 'primary.main' : 'text.primary'
                      }}>
                        {option === 'true' ? '✓ TRUE' : '✗ FALSE'}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        );

      case 'short_answer':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', color: 'text.secondary' }}>
              ✏️ Enter your answer:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={answer}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              placeholder="Type your answer here..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  }
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Characters: {answer.length}
            </Typography>
          </Box>
        );

      case 'essay':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', color: 'text.secondary' }}>
              📝 Write your essay response:
            </Typography>
            <Paper variant="outlined" sx={{ p: 1, minHeight: 250 }}>
              <RichTextEditor
                value={answer}
                onChange={(value) => handleAnswerChange(question._id, value)}
                placeholder="Write your detailed essay response here. Use the toolbar to format your text..."
                minHeight={200}
                allowMath={true}
                allowLinks={false}
                allowImages={false}
              />
            </Paper>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 Tip: Use formatting tools to structure your response clearly
            </Typography>
          </Box>
        );

      case 'math':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', color: 'text.secondary' }}>
              🔢 Enter your mathematical expression:
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <MathInput
                value={answer}
                onChange={(value) => handleAnswerChange(question._id, value)}
                placeholder="Enter your mathematical expression..."
              />
            </Paper>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 Use LaTeX syntax for mathematical expressions
            </Typography>
          </Box>
        );

      case 'code':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', color: 'text.secondary' }}>
              💻 Write your code:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={10}
              value={answer}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              placeholder="Write your code here..."
              variant="outlined"
              InputProps={{
                style: { 
                  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                  fontSize: '0.9rem'
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'grey.50',
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  }
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Lines: {(answer.match(/\n/g) || []).length + 1} • Characters: {answer.length}
            </Typography>
          </Box>
        );

      default:
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', color: 'text.secondary' }}>
              💬 Enter your response:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={5}
              value={answer}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              placeholder="Enter your detailed answer here..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  }
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Characters: {answer.length} • Be detailed and clear in your response
            </Typography>
          </Box>
        );
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !assessment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Assessment not found'}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  // Instructions dialog
  if (showInstructions) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom align="center">
              {assessment.title}
            </Typography>
            
            <Typography variant="h6" color="primary" gutterBottom>
              Instructions
            </Typography>
            
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {assessment.instructions}
            </Typography>

            <Grid container spacing={2} sx={{ my: 3 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{assessment.questions.length}</Typography>
                  <Typography variant="body2">Questions</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{assessment.timeLimit}</Typography>
                  <Typography variant="body2">Minutes</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{assessment.attempts}</Typography>
                  <Typography variant="body2">Attempts</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{assessment.passingScore}%</Typography>
                  <Typography variant="body2">Passing Score</Typography>
                </Paper>
              </Grid>
            </Grid>

            {assessment.isProctored && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                  This assessment is proctored
                </Typography>
                <Typography variant="body2">
                  • Webcam and screen recording will be enabled
                  • Tab switching and copy/paste are monitored
                  • AI will monitor your behavior during the exam
                  • Violations may result in assessment termination
                </Typography>
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                size="large"
                onClick={startAssessment}
                startIcon={assessment.isProctored ? <Security /> : <Timer />}
              >
                {assessment.isProctored ? 'Start Proctored Assessment' : 'Start Assessment'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // System check dialog
  if (showSystemCheck) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom align="center">
              <Shield sx={{ mr: 1, verticalAlign: 'middle' }} />
              System Requirements Check
            </Typography>
            
            <Typography variant="body1" paragraph>
              Please ensure your system meets the following requirements for proctored assessment:
            </Typography>

            {systemRequirements && (
              <Grid container spacing={2} sx={{ my: 3 }}>
                {Object.entries(systemRequirements).map(([key, value]) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                      {value ? (
                        <Chip 
                          label="✓" 
                          size="small" 
                          sx={{
                            backgroundColor: '#4caf50',
                            color: '#ffffff',
                          }}
                        />
                      ) : (
                        <Chip 
                          label="✗" 
                          size="small" 
                          sx={{
                            backgroundColor: '#f44336',
                            color: '#ffffff',
                          }}
                        />
                      )}
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button variant="outlined" onClick={checkSystemRequirements}>
                Recheck System
              </Button>
              <Button 
                variant="contained" 
                onClick={startAssessment}
                disabled={systemRequirements && (!systemRequirements.webcam || !systemRequirements.screenShare)}
              >
                Continue to Assessment
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion._id)?.answer || '';
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Top Bar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {assessment.title}
          </Typography>
          
          {/* Proctoring Status */}
          {assessment.isProctored && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
              <Tooltip title={webcamEnabled ? 'Webcam Active' : 'Webcam Inactive'}>
                <IconButton 
                  size="small" 
                  sx={{
                    color: webcamEnabled ? '#4caf50' : '#f44336'
                  }}
                >
                  {webcamEnabled ? <Videocam /> : <VideocamOff />}
                </IconButton>
              </Tooltip>
              <Tooltip title={screenShareEnabled ? 'Screen Share Active' : 'Screen Share Inactive'}>
                <IconButton 
                  size="small" 
                  sx={{
                    color: screenShareEnabled ? '#4caf50' : '#f44336'
                  }}
                >
                  <ScreenShare />
                </IconButton>
              </Tooltip>
              <Chip 
                label={`${violations.length} violations`}
                size="small"
                color={violations.length > 0 ? 'warning' : 'success'}
              />
            </Box>
          )}
          
          {/* Timer */}
          <Chip
            label={formatTime(timeRemaining)}
            color={getTimeColor()}
            icon={<Timer />}
            sx={{ fontWeight: 'bold', fontSize: '1rem' }}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Question Navigation */}
          <Grid item xs={12} md={3}>
            <Card sx={{ position: 'sticky', top: 100 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Questions
                </Typography>
                
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ mb: 2 }}
                />
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {currentQuestionIndex + 1} of {assessment.questions.length}
                </Typography>

                <Grid container spacing={1}>
                  {assessment.questions.map((_, index) => {
                    const answer = answers[index];
                    const isAnswered = answer?.answer.trim() !== '';
                    const isFlagged = flaggedQuestions.has(assessment.questions[index]._id);
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <Grid item xs={4} key={index}>
                        <Button
                          variant={isCurrent ? 'contained' : 'outlined'}
                          size="small"
                          onClick={() => goToQuestion(index)}
                          sx={{
                            minWidth: 40,
                            height: 40,
                            bgcolor: isFlagged ? 'warning.light' : 
                                   isAnswered ? 'success.light' : 'inherit',
                            '&:hover': {
                              bgcolor: isFlagged ? 'warning.main' : 
                                     isAnswered ? 'success.main' : 'inherit'
                            }
                          }}
                        >
                          {index + 1}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'success.light', borderRadius: 1 }} />
                  <Typography variant="caption">Answered</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'warning.light', borderRadius: 1 }} />
                  <Typography variant="caption">Flagged</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: 'grey.300', borderRadius: 1 }} />
                  <Typography variant="caption">Not answered</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Question Content */}
          <Grid item xs={12} md={9}>
            <Card>
              <CardContent sx={{ p: 4 }}>
                {/* Question Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Typography variant="h6">
                    Question {currentQuestionIndex + 1} of {assessment.questions.length}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={`${currentQuestion.points} points`}
                      size="small"
                      color="primary"
                    />
                    <Tooltip title={flaggedQuestions.has(currentQuestion._id) ? 'Remove flag' : 'Flag for review'}>
                      <IconButton
                        size="small"
                        onClick={() => toggleFlag(currentQuestion._id)}
                        color={flaggedQuestions.has(currentQuestion._id) ? 'warning' : 'default'}
                      >
                        <Flag />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Question Text */}
                <Typography 
                  variant="body1" 
                  sx={{ mb: 4, fontSize: '1.1rem', lineHeight: 1.6 }}
                  dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
                />

                {/* Answer Input */}
                <Box sx={{ mb: 4 }}>
                  {renderQuestion(currentQuestion, currentAnswer)}
                </Box>

                {/* Navigation */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    startIcon={<NavigateBefore />}
                    onClick={() => goToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Save />}
                      onClick={() => {
                        // Auto-save functionality could be added here
                      }}
                    >
                      Save Progress
                    </Button>

                    {currentQuestionIndex === assessment.questions.length - 1 ? (
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<Send />}
                        onClick={() => setConfirmSubmit(true)}
                        size="large"
                      >
                        Submit Assessment
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        endIcon={<NavigateNext />}
                        onClick={() => goToQuestion(currentQuestionIndex + 1)}
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Submit Confirmation Dialog */}
      <Dialog open={confirmSubmit} onClose={() => setConfirmSubmit(false)}>
        <DialogTitle>Submit Assessment</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to submit your assessment? You cannot make changes after submission.
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            • Answered questions: {answers.filter(a => a.answer.trim() !== '').length} of {assessment.questions.length}
            • Flagged questions: {flaggedQuestions.size}
            • Time remaining: {formatTime(timeRemaining)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSubmit(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleSubmit()} 
            variant="contained" 
            color="success"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={20} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedTakeAssessment;
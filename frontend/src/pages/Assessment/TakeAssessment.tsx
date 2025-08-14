import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  TextField,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  Fab,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import {
  Timer,
  Visibility,
  VisibilityOff,
  Warning,
  Security,
  Psychology,
  Camera,
  Mic,
  MicOff,
  Fullscreen,
  FullscreenExit,
  Save,
  Send,
  NavigateNext,
  NavigateBefore,
  Flag,
  CheckCircle,
  Error,
  Info,
  Functions,
  Calculate,
  TextFields,
  PlayArrow
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { assessmentService } from '../../services/assessmentService';
import MathInput from '../../components/MathInput/MathInput';
import ProctoringMonitor from '../../components/Proctoring/ProctoringMonitor';
import AIGradingService from '../../services/aiGradingService';

interface Question {
  _id: string;
  type: 'multiple-choice' | 'multiple-select' | 'true-false' | 'short-answer' | 'essay' | 'math' | 'code';
  question: string;
  options?: string[];
  correctAnswer?: any;
  points: number;
  explanation?: string;
  mathFormula?: boolean;
  codeLanguage?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
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
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResultsImmediately: boolean;
  showCorrectAnswers: boolean;
  requireProctoring: boolean;
  requireCamera: boolean;
  aiCheatingDetection: boolean;
  allowCalculator: boolean;
  allowNotes: boolean;
  course: {
    _id: string;
    title: string;
  };
}

interface Answer {
  questionId: string;
  answer: any;
  timeSpent: number;
  flagged: boolean;
  confidence: number;
}

const TakeAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Assessment state
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Exam state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  
  // UI state
  const [fullscreen, setFullscreen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  
  // Proctoring state
  const [proctoringActive, setProctoringActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [proctoringViolations, setProctoringViolations] = useState<string[]>([]);
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTime = useRef<number>(Date.now());

  // Load assessment
  useEffect(() => {
    const loadAssessment = async () => {
      if (!assessmentId) return;

      try {
        setLoading(true);
        const data = await assessmentService.getAssessmentById(assessmentId);
        setAssessment(data);
        setTimeRemaining(data.timeLimit * 60); // Convert to seconds
        
        // Initialize answers
        const initialAnswers: Record<string, Answer> = {};
        data.questions.forEach(question => {
          initialAnswers[question._id] = {
            questionId: question._id,
            answer: question.type === 'multiple-select' ? [] : '',
            timeSpent: 0,
            flagged: false,
            confidence: 0
          };
        });
        setAnswers(initialAnswers);
        
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
    if (examStarted && timeRemaining > 0 && !examSubmitted) {
      timerRef.current = setInterval(() => {
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
        clearInterval(timerRef.current);
      }
    };
  }, [examStarted, timeRemaining, examSubmitted]);

  // Auto-save effect
  useEffect(() => {
    if (examStarted && !examSubmitted) {
      autoSaveRef.current = setInterval(() => {
        handleAutoSave();
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, [examStarted, examSubmitted, answers]);

  // Proctoring setup
  useEffect(() => {
    if (assessment?.requireProctoring && examStarted) {
      setupProctoring();
    }
  }, [assessment, examStarted]);

  const setupProctoring = async () => {
    try {
      if (assessment?.requireCamera) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraPermission(true);
        setMicPermission(true);
        setProctoringActive(true);
        stream.getTracks().forEach(track => track.stop()); // Stop for now, will be handled by ProctoringMonitor
      }
    } catch (error) {
      setError('Camera and microphone access required for this proctored exam');
    }
  };

  const handleStartExam = async () => {
    if (assessment?.requireProctoring && !cameraPermission) {
      await setupProctoring();
      return;
    }

    setExamStarted(true);
    setShowInstructions(false);
    questionStartTime.current = Date.now();
    
    if (assessment?.requireProctoring) {
      enterFullscreen();
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    const currentTime = Date.now();
    const timeSpent = currentTime - questionStartTime.current;
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        answer,
        timeSpent: prev[questionId].timeSpent + timeSpent
      }
    }));
    
    questionStartTime.current = currentTime;
  };

  const handleQuestionNavigation = (direction: 'next' | 'prev' | number) => {
    if (typeof direction === 'number') {
      setCurrentQuestion(direction);
    } else if (direction === 'next' && currentQuestion < (assessment?.questions.length || 0) - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (direction === 'prev' && currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
    questionStartTime.current = Date.now();
  };

  const handleFlagQuestion = (questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  };

  const handleAutoSave = async () => {
    if (!assessment || !examStarted || examSubmitted) return;
    
    try {
      setAutoSaving(true);
      await assessmentService.saveProgress(assessment._id, {
        answers,
        currentQuestion,
        timeRemaining,
        flaggedQuestions: Array.from(flaggedQuestions)
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleSubmitExam = async () => {
    if (!assessment) return;

    try {
      setLoading(true);
      
      // Prepare submission data
      const submissionData = {
        assessmentId: assessment._id,
        answers: Object.values(answers),
        timeSpent: (assessment.timeLimit * 60) - timeRemaining,
        proctoringViolations,
        submittedAt: new Date().toISOString()
      };

      // Submit to backend
      const result = await assessmentService.submitAssessment(submissionData);
      
      // AI Grading
      if (result.requiresGrading) {
        const aiGradingResult = await AIGradingService.gradeAssessment(assessment, answers);
        await assessmentService.updateGrades(result._id, aiGradingResult);
      }

      setExamSubmitted(true);
      setShowSubmitDialog(false);
      
      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      
      // Navigate to results
      navigate(`/assessment/${assessmentId}/results`);
      
    } catch (error: any) {
      setError(error.message || 'Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitExam();
  };

  const enterFullscreen = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!assessment) return 0;
    const answeredQuestions = Object.values(answers).filter(answer => 
      answer.answer !== '' && answer.answer !== null && answer.answer !== undefined
    ).length;
    return (answeredQuestions / assessment.questions.length) * 100;
  };

  const renderQuestion = (question: Question, index: number) => {
    const answer = answers[question._id];
    
    return (
      <Card key={question._id} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              Question {index + 1} of {assessment?.questions.length}
              <Chip 
                label={`${question.points} pts`} 
                size="small" 
                color="primary" 
                sx={{ ml: 2 }}
              />
              <Chip 
                label={question.difficulty} 
                size="small" 
                color={question.difficulty === 'easy' ? 'success' : question.difficulty === 'medium' ? 'warning' : 'error'}
                sx={{ ml: 1 }}
              />
            </Typography>
            <Tooltip title={flaggedQuestions.has(index) ? "Remove flag" : "Flag for review"}>
              <IconButton 
                onClick={() => handleFlagQuestion(index)}
                color={flaggedQuestions.has(index) ? "warning" : "default"}
              >
                <Flag />
              </IconButton>
            </Tooltip>
          </Box>

          <Typography variant="body1" sx={{ mb: 3, whiteSpace: 'pre-wrap' }}>
            {question.question}
          </Typography>

          {/* Multiple Choice */}
          {question.type === 'multiple-choice' && (
            <FormControl component="fieldset">
              <RadioGroup
                value={answer?.answer || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              >
                {question.options?.map((option, optionIndex) => (
                  <FormControlLabel
                    key={optionIndex}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {/* Multiple Select */}
          {question.type === 'multiple-select' && (
            <FormControl component="fieldset">
              <FormLabel component="legend">Select all that apply:</FormLabel>
              {question.options?.map((option, optionIndex) => (
                <FormControlLabel
                  key={optionIndex}
                  control={
                    <Checkbox
                      checked={(answer?.answer || []).includes(option)}
                      onChange={(e) => {
                        const currentAnswers = answer?.answer || [];
                        const newAnswers = e.target.checked
                          ? [...currentAnswers, option]
                          : currentAnswers.filter((a: string) => a !== option);
                        handleAnswerChange(question._id, newAnswers);
                      }}
                    />
                  }
                  label={option}
                />
              ))}
            </FormControl>
          )}

          {/* True/False */}
          {question.type === 'true-false' && (
            <FormControl component="fieldset">
              <RadioGroup
                value={answer?.answer || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              >
                <FormControlLabel value="true" control={<Radio />} label="True" />
                <FormControlLabel value="false" control={<Radio />} label="False" />
              </RadioGroup>
            </FormControl>
          )}

          {/* Short Answer */}
          {question.type === 'short-answer' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              value={answer?.answer || ''}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              placeholder="Enter your answer..."
              variant="outlined"
            />
          )}

          {/* Essay */}
          {question.type === 'essay' && (
            <TextField
              fullWidth
              multiline
              rows={8}
              value={answer?.answer || ''}
              onChange={(e) => handleAnswerChange(question._id, e.target.value)}
              placeholder="Write your essay here..."
              variant="outlined"
            />
          )}

          {/* Math */}
          {question.type === 'math' && (
            <Box>
              <MathInput
                value={answer?.answer || ''}
                onChange={(value) => handleAnswerChange(question._id, value)}
                allowSymbols={true}
                allowCalculator={assessment?.allowCalculator}
              />
              {assessment?.allowCalculator && (
                <Box sx={{ mt: 2 }}>
                  <Button startIcon={<Calculate />} variant="outlined" size="small">
                    Open Calculator
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {/* Code */}
          {question.type === 'code' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Language: {question.codeLanguage}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={12}
                value={answer?.answer || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                placeholder={`Write your ${question.codeLanguage} code here...`}
                variant="outlined"
                sx={{ fontFamily: 'monospace' }}
              />
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!assessment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Assessment not found</Alert>
      </Container>
    );
  }

  // Instructions screen
  if (showInstructions && !examStarted) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Psychology color="primary" />
              {assessment.title}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {assessment.description}
            </Typography>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Instructions:
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-wrap' }}>
              {assessment.instructions}
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Timer color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">{assessment.timeLimit} minutes</Typography>
                  <Typography variant="body2" color="text.secondary">Time Limit</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <CheckCircle color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h6">{assessment.questions.length} questions</Typography>
                  <Typography variant="body2" color="text.secondary">Total Questions</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Proctoring Requirements */}
            {assessment.requireProctoring && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Proctored Exam Requirements:
                </Typography>
                <List dense>
                  {assessment.requireCamera && (
                    <ListItem>
                      <Camera sx={{ mr: 1 }} />
                      <ListItemText primary="Camera access required for monitoring" />
                    </ListItem>
                  )}
                  <ListItem>
                    <Fullscreen sx={{ mr: 1 }} />
                    <ListItemText primary="Exam will run in fullscreen mode" />
                  </ListItem>
                  <ListItem>
                    <Psychology sx={{ mr: 1 }} />
                    <ListItemText primary="AI monitoring for suspicious behavior" />
                  </ListItem>
                </List>
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button variant="outlined" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button 
                variant="contained" 
                size="large"
                onClick={handleStartExam}
                startIcon={<PlayArrow />}
              >
                Start Exam
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // Main exam interface
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Top Bar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {assessment.title}
          </Typography>
          
          {/* Progress */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 3 }}>
            <Typography variant="body2">
              Progress: {Math.round(getProgressPercentage())}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={getProgressPercentage()} 
              sx={{ width: 100 }}
            />
          </Box>

          {/* Timer */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
            <Timer color={timeRemaining < 300 ? "error" : "primary"} />
            <Typography 
              variant="h6" 
              color={timeRemaining < 300 ? "error" : "primary"}
              sx={{ minWidth: 80, textAlign: 'center' }}
            >
              {formatTime(timeRemaining)}
            </Typography>
          </Box>

          {/* Auto-save indicator */}
          {autoSaving && (
            <Tooltip title="Auto-saving...">
              <CircularProgress size={20} />
            </Tooltip>
          )}

          {/* Fullscreen toggle */}
          <IconButton onClick={fullscreen ? exitFullscreen : enterFullscreen}>
            {fullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Question Navigation Sidebar */}
          <Grid item xs={12} md={3}>
            <Card sx={{ position: 'sticky', top: 100 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Questions
                </Typography>
                <Grid container spacing={1}>
                  {assessment.questions.map((_, index) => {
                    const isAnswered = answers[assessment.questions[index]._id]?.answer !== '' && 
                                     answers[assessment.questions[index]._id]?.answer !== null &&
                                     answers[assessment.questions[index]._id]?.answer !== undefined;
                    const isFlagged = flaggedQuestions.has(index);
                    const isCurrent = index === currentQuestion;
                    
                    return (
                      <Grid item xs={4} key={index}>
                        <Button
                          variant={isCurrent ? "contained" : "outlined"}
                          size="small"
                          onClick={() => handleQuestionNavigation(index)}
                          sx={{
                            minWidth: 40,
                            height: 40,
                            bgcolor: isAnswered ? 'success.light' : undefined,
                            borderColor: isFlagged ? 'warning.main' : undefined,
                            '&:hover': {
                              bgcolor: isAnswered ? 'success.main' : undefined
                            }
                          }}
                        >
                          {index + 1}
                          {isFlagged && <Flag sx={{ fontSize: 12, ml: 0.5 }} />}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary">
                  Answered: {Object.values(answers).filter(a => a.answer !== '' && a.answer !== null).length} / {assessment.questions.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Flagged: {flaggedQuestions.size}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Question Area */}
          <Grid item xs={12} md={9}>
            {renderQuestion(assessment.questions[currentQuestion], currentQuestion)}
            
            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<NavigateBefore />}
                onClick={() => handleQuestionNavigation('prev')}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={handleAutoSave}
                  disabled={autoSaving}
                >
                  {autoSaving ? 'Saving...' : 'Save Progress'}
                </Button>
                
                {currentQuestion === assessment.questions.length - 1 ? (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Send />}
                    onClick={() => setShowSubmitDialog(true)}
                  >
                    Submit Exam
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
          </Grid>
        </Grid>
      </Container>

      {/* Proctoring Monitor */}
      {assessment.requireProctoring && proctoringActive && (
        <ProctoringMonitor
          onViolation={(violation) => setProctoringViolations(prev => [...prev, violation])}
          requireCamera={assessment.requireCamera}
          aiDetection={assessment.aiCheatingDetection}
        />
      )}

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)}>
        <DialogTitle>Submit Exam</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to submit your exam? You cannot make changes after submission.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Answered questions: {Object.values(answers).filter(a => a.answer !== '' && a.answer !== null).length} / {assessment.questions.length}
          </Typography>
          {flaggedQuestions.size > 0 && (
            <Typography variant="body2" color="warning.main">
              You have {flaggedQuestions.size} flagged questions for review.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitExam} 
            variant="contained" 
            color="success"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Exam'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TakeAssessment;
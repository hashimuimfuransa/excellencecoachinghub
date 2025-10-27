import React, { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  Grid,
  Stack,
  Avatar,
  useTheme,
  AppBar,
  Toolbar,
  Fab,
  Snackbar
} from '@mui/material';
import {
  Timer,
  Send,
  NavigateBefore,
  NavigateNext,
  Assignment,
  Grade,
  AccessTime,
  ArrowBack,
  CheckCircle,
  Warning,
  Flag,
  FlagOutlined,
  Refresh,
  Psychology,
  Save,
  AutoAwesome
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { assignmentService } from '../../services/assignmentService';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';

interface AssignmentQuestion {
  _id?: string;
  id?: string;
  question: string;
  type: string;
  options?: string[];
  choices?: string[];
  correctAnswer?: string | string[];
  points: number;
  aiExtracted?: boolean;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface AssignmentAnswer {
  questionId: string;
  answer: string;
  timeSpent: number;
  flagged: boolean;
  lastModified?: Date;
}

interface AssignmentData {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  maxPoints: number;
  timeLimit?: number;
  dueDate: Date;
  questions?: AssignmentQuestion[];
  extractedQuestions?: AssignmentQuestion[];
  hasQuestions: boolean;
  aiProcessingStatus?: string;
  aiExtractionStatus?: string;
  assignmentDocument?: {
    filename: string;
    fileUrl: string;
  };
}

const TakeExam: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  // State management
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [questions, setQuestions] = useState<AssignmentQuestion[]>([]);
  const [answers, setAnswers] = useState<AssignmentAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Load assignment data and existing progress
  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId) return;

      try {
        setLoading(true);
        console.log('🔄 Loading assignment:', assignmentId);
        
        const response = await assignmentService.getAssignmentById(assignmentId);
        console.log('📋 Raw assignment data:', response);
        console.log('🔍 Assignment fields:', {
          hasQuestions: response.hasQuestions,
          questionsCount: response.questions?.length || 0,
          extractedQuestionsCount: response.extractedQuestions?.length || 0,
          aiProcessingStatus: response.aiProcessingStatus,
          aiExtractionStatus: response.aiExtractionStatus,
          hasAssignmentDocument: !!response.assignmentDocument,
          assignmentDocumentUrl: response.assignmentDocument?.fileUrl
        });
        
        // Process questions from different sources with proper priority
        let assignmentQuestions: AssignmentQuestion[] = [];
        
        // Priority 1: Check for extracted questions from assignment document processing
        if (response.extractedQuestions && response.extractedQuestions.length > 0) {
          const extracted = response.extractedQuestions.map((q: any, index: number) => ({
            ...q,
            _id: q.id || q._id || `extracted_${index}`,
            id: q.id || q._id || `extracted_${index}`,
            type: q.type || 'multiple_choice',
            options: q.options || q.choices || [],
            points: q.points || 10,
            aiExtracted: true
          }));
          assignmentQuestions = [...assignmentQuestions, ...extracted];
          console.log('🤖 Found AI extracted questions:', response.extractedQuestions.length);
          console.log('🎯 Sample extracted questions:', extracted.slice(0, 2));
        }
        
        // Priority 2: Check for manually created questions
        if (response.questions && response.questions.length > 0) {
          const manual = response.questions.filter((q: any) => !q.aiExtracted).map((q: any, index: number) => ({
            ...q,
            _id: q._id || q.id || `manual_${index}`,
            id: q._id || q.id || `manual_${index}`,
            aiExtracted: false
          }));
          assignmentQuestions = [...assignmentQuestions, ...manual];
          console.log('✅ Found manual questions:', manual.length);
        }

        // Priority 3: Check if document is still being processed (check both field names)
        const isProcessing = response.aiProcessingStatus === 'pending' || 
                           response.aiExtractionStatus === 'pending' ||
                           response.aiProcessingStatus === 'not_started';
        
        // Set up auto-refresh if still processing
        if (isProcessing && assignmentQuestions.length === 0) {
          console.log(`⏰ Assignment is still processing, setting up auto-refresh in 10 seconds`);
          setTimeout(() => {
            console.log(`🔄 Auto-refreshing assignment data...`);
            window.location.reload();
          }, 10000);
        }
        
        console.log('📊 Final assignment state:', {
          totalQuestionsFound: assignmentQuestions.length,
          isProcessing,
          shouldHaveQuestions: response.hasQuestions || !!response.assignmentDocument,
          processingStatus: response.aiProcessingStatus
        });

        const assignmentData: AssignmentData = {
          ...response,
          questions: assignmentQuestions,
          hasQuestions: assignmentQuestions.length > 0 || response.hasQuestions,
          aiProcessingStatus: response.aiProcessingStatus,
          aiExtractionStatus: response.aiExtractionStatus
        };

        setAssignment(assignmentData);
        setQuestions(assignmentQuestions);

        // Try to load existing submission/progress
        let existingAnswers: AssignmentAnswer[] = [];
        try {
          const existingSubmission = await assignmentService.getAssignmentSubmission(assignmentId);
          if (existingSubmission && existingSubmission.extractedAnswers) {
            existingAnswers = existingSubmission.extractedAnswers.map((ea: any) => ({
              questionId: assignmentQuestions[ea.questionIndex]?._id || assignmentQuestions[ea.questionIndex]?.id || '',
              answer: ea.answer || '',
              timeSpent: ea.timeSpent || 0,
              flagged: false,
              lastModified: new Date()
            }));
            console.log('📄 Loaded existing progress:', existingAnswers.length, 'answers');
          }
        } catch (err) {
          console.log('💡 No existing submission found, starting fresh');
        }

        // Initialize or merge answers
        if (assignmentQuestions.length > 0) {
          const initialAnswers = assignmentQuestions.map((q, index) => {
            const existingAnswer = existingAnswers.find(a => a.questionId === (q._id || q.id));
            return existingAnswer || {
              questionId: q._id || q.id || `question_${index}`,
              answer: '',
              timeSpent: 0,
              flagged: false,
              lastModified: new Date()
            };
          });
          setAnswers(initialAnswers);
          console.log('📝 Initialized answers for', initialAnswers.length, 'questions');
        } else {
          console.log('⚠️ No questions found - checking if processing is needed');
          if (response.assignmentDocument && !isProcessing && response.aiProcessingStatus !== 'completed') {
            console.log('🔄 Document found but not processed - may need manual extraction');
          }
        }

        // Set up timer
        if (response.timeLimit) {
          setTimeRemaining(response.timeLimit * 60);
        }

      } catch (err: any) {
        console.error('❌ Error loading assignment:', err);
        setError(err.message || 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [assignmentId]);

  // Auto-save functionality
  const autoSave = async () => {
    if (!assignment || !isDirty || saving || submitting) return;

    try {
      setSaving(true);
      const formattedAnswers = answers.map((answer, index) => ({
        questionIndex: index,
        answer: answer.answer || '',
        questionType: questions[index]?.type || 'short-answer',
        timeSpent: answer.timeSpent || 0,
        attempts: 1
      }));

      await assignmentService.saveAssignmentProgress({
        assignmentId: assignment._id,
        extractedAnswers: formattedAnswers,
        autoSaved: true,
        status: 'draft'
      });

      setIsDirty(false);
      setSaveMessage('Progress saved automatically');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (error: any) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (isDirty && !showInstructions && !submitting) {
      // Auto-save every 30 seconds
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(autoSave, 30000);
    }

    return () => {
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    };
  }, [isDirty, showInstructions, submitting]);

  // Periodic auto-save every 2 minutes regardless of changes (to track time)
  useEffect(() => {
    if (!showInstructions && !submitting && assignment) {
      const periodicSave = setInterval(() => {
        if (!saving) {
          // Update time spent on current question
          if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
            const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
            const currentQuestionId = questions[currentQuestionIndex]?._id || questions[currentQuestionIndex]?.id;
            
            if (currentQuestionId && timeSpent > 0) {
              setAnswers(prev => prev.map(a =>
                a.questionId === currentQuestionId
                  ? { ...a, timeSpent: (a.timeSpent || 0) + timeSpent, lastModified: new Date() }
                  : a
              ));
              questionStartTimeRef.current = Date.now(); // Reset timer
              setIsDirty(true);
            }
          }
          
          // Auto-save progress
          autoSave();
        }
      }, 120000); // Every 2 minutes

      return () => clearInterval(periodicSave);
    }
  }, [showInstructions, submitting, assignment, currentQuestionIndex, questions.length, saving]);

  // Prevent accidental page leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !submitting) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, submitting]);

  // Manual save function
  const manualSave = async () => {
    await autoSave();
  };

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && assignment?.timeLimit && !showInstructions) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [timeRemaining, assignment, showInstructions]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): 'error' | 'warning' | 'primary' => {
    if (!assignment?.timeLimit) return 'primary';
    const totalTime = assignment.timeLimit * 60;
    const percentage = (timeRemaining / totalTime) * 100;
    
    if (percentage <= 10) return 'error';
    if (percentage <= 25) return 'warning';
    return 'primary';
  };

  const handleAnswerChange = (questionId: string, newAnswer: string) => {
    console.log('🔄 Answer changed:', { questionId, answer: newAnswer.substring(0, 50) });
    setAnswers(prev => prev.map(a => 
      a.questionId === questionId 
        ? { ...a, answer: newAnswer, lastModified: new Date() }
        : a
    ));
    setIsDirty(true);
  };

  const toggleFlag = (questionId: string) => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlaggedQuestions(newFlagged);
    
    // Update answer flag status
    setAnswers(prev => prev.map(a =>
      a.questionId === questionId
        ? { ...a, flagged: newFlagged.has(questionId), lastModified: new Date() }
        : a
    ));
    setIsDirty(true);
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      // Update time spent on current question before navigating
      if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
        const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
        const currentQuestionId = questions[currentQuestionIndex]?._id || questions[currentQuestionIndex]?.id;
        
        if (currentQuestionId) {
          setAnswers(prev => prev.map(a =>
            a.questionId === currentQuestionId
              ? { ...a, timeSpent: (a.timeSpent || 0) + timeSpent, lastModified: new Date() }
              : a
          ));
          setIsDirty(true);
        }
      }

      // Auto-save on navigation if there are unsaved changes
      if (isDirty) {
        autoSave();
      }
      
      setCurrentQuestionIndex(index);
      questionStartTimeRef.current = Date.now();
    }
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentQuestionIndex > 0) {
      goToQuestion(currentQuestionIndex - 1);
    } else if (direction === 'next' && currentQuestionIndex < questions.length - 1) {
      goToQuestion(currentQuestionIndex + 1);
    }
  };

  const startAssignment = () => {
    setShowInstructions(false);
    setStartTime(new Date());
    questionStartTimeRef.current = Date.now();
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!assignment) return;

    try {
      setSubmitting(true);

      // Update time spent on current question before submitting
      if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
        const timeSpent = Math.floor((Date.now() - questionStartTimeRef.current) / 1000);
        const currentQuestionId = questions[currentQuestionIndex]?._id || questions[currentQuestionIndex]?.id;
        
        if (currentQuestionId) {
          setAnswers(prev => prev.map(a =>
            a.questionId === currentQuestionId
              ? { ...a, timeSpent: (a.timeSpent || 0) + timeSpent, lastModified: new Date() }
              : a
          ));
        }
      }

      // Format answers for AI grading
      const formattedAnswers = answers.map((answer, index) => ({
        questionIndex: index,
        answer: answer.answer || '',
        questionType: questions[index]?.type || 'short-answer',
        timeSpent: answer.timeSpent || 0,
        attempts: 1,
        flagged: answer.flagged || false,
        submittedAt: new Date()
      }));

      console.log('📤 Submitting assignment for AI grading:', {
        assignmentId: assignment._id,
        answersCount: formattedAnswers.length,
        isAutoSubmit,
        hasTimer: !!assignment.timeLimit,
        totalTimeSpent: startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0,
        sampleAnswers: formattedAnswers.slice(0, 2)
      });

      const submissionData = {
        assignmentId: assignment._id,
        extractedAnswers: formattedAnswers,
        submissionText: `Assignment completed with ${formattedAnswers.length} questions answered`,
        finalSubmission: true,
        isAutoSubmit,
        timeSpent: startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0,
        submittedAt: new Date(),
        status: 'submitted'
      };

      const result = await assignmentService.submitAssignmentWithExtractedAnswers(submissionData);
      
      setSuccess(isAutoSubmit 
        ? 'Assignment auto-submitted due to time limit and sent for grading' 
        : 'Assignment submitted successfully and sent for grading!');
      
      setTimeout(() => {
        navigate(`/dashboard/student/assignment/${assignmentId}/results`);
      }, 2000);

    } catch (error: any) {
      console.error('❌ Submit error:', error);
      setError(error.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    await handleSubmit(true);
  };

  const normalizeQuestionType = (type: string) => {
    return type.replace('-', '_');
  };

  const renderQuestion = (question: AssignmentQuestion, answer: AssignmentAnswer) => {
    const normalizedType = normalizeQuestionType(question.type);
    const options = question.options || question.choices || [];

    console.log('🎨 Rendering question:', {
      type: question.type,
      normalizedType,
      hasOptions: options.length > 0,
      optionsCount: options.length
    });

    switch (normalizedType) {
      case 'multiple_choice':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'medium', color: 'text.secondary' }}>
              📝 Select one answer:
            </Typography>
            <RadioGroup
              value={answer.answer}
              onChange={(e) => handleAnswerChange(answer.questionId, e.target.value)}
            >
              {options.map((option: string, index: number) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: answer.answer === option ? 2 : 1,
                      borderColor: answer.answer === option ? 'primary.main' : 'grey.300',
                      backgroundColor: answer.answer === option ? 'primary.50' : 'transparent',
                      '&:hover': {
                        backgroundColor: answer.answer === option ? 'primary.100' : 'grey.50',
                        transform: 'translateY(-1px)',
                        boxShadow: 1
                      }
                    }}
                    onClick={() => handleAnswerChange(answer.questionId, option)}
                  >
                    <FormControlLabel
                      value={option}
                      control={<Radio checked={answer.answer === option} />}
                      label={option}
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
              ❓ Select True or False:
            </Typography>
            <RadioGroup
              value={answer.answer}
              onChange={(e) => handleAnswerChange(answer.questionId, e.target.value)}
            >
              {['True', 'False'].map((option) => (
                <Paper
                  key={option}
                  variant="outlined"
                  sx={{
                    p: 2,
                    mb: 1,
                    cursor: 'pointer',
                    border: answer.answer === option ? 2 : 1,
                    borderColor: answer.answer === option ? 'primary.main' : 'grey.300',
                    backgroundColor: answer.answer === option ? 'primary.50' : 'transparent',
                    '&:hover': {
                      backgroundColor: answer.answer === option ? 'primary.100' : 'grey.50',
                    }
                  }}
                  onClick={() => handleAnswerChange(answer.questionId, option)}
                >
                  <FormControlLabel
                    value={option}
                    control={<Radio checked={answer.answer === option} />}
                    label={option}
                    sx={{ margin: 0, width: '100%' }}
                  />
                </Paper>
              ))}
            </RadioGroup>
          </Box>
        );

      case 'short_answer':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'medium', color: 'text.secondary' }}>
              ✍️ Type your short answer:
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={answer.answer}
              onChange={(e) => handleAnswerChange(answer.questionId, e.target.value)}
              placeholder="Type your answer here..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          </Box>
        );

      case 'essay':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'medium', color: 'text.secondary' }}>
              📝 Write your essay response:
            </Typography>
            <Paper variant="outlined" sx={{ p: 1, minHeight: 250 }}>
              <RichTextEditor
                value={answer.answer}
                onChange={(value) => handleAnswerChange(answer.questionId, value)}
                placeholder="Write your detailed essay response here..."
                minHeight={200}
              />
            </Paper>
          </Box>
        );

      case 'fill_in_blank':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'medium', color: 'text.secondary' }}>
              📝 Fill in the blank:
            </Typography>
            <TextField
              fullWidth
              value={answer.answer}
              onChange={(e) => handleAnswerChange(answer.questionId, e.target.value)}
              placeholder="Type your answer..."
              variant="outlined"
            />
          </Box>
        );

      case 'numerical':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'medium', color: 'text.secondary' }}>
              🔢 Enter your numerical answer:
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={answer.answer}
              onChange={(e) => handleAnswerChange(answer.questionId, e.target.value)}
              placeholder="Enter number..."
              variant="outlined"
              inputProps={{ step: "any" }}
            />
          </Box>
        );

      default:
        return (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Question type "{question.type}" is not yet supported. Please contact your instructor.
            </Alert>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={answer.answer}
              onChange={(e) => handleAnswerChange(answer.questionId, e.target.value)}
              placeholder="Type your answer here..."
              variant="outlined"
            />
          </Box>
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" flexDirection="column" alignItems="center" minHeight="400px" justifyContent="center">
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Loading Assignment...
          </Typography>
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate(-1)} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!assignment) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">Assignment not found</Alert>
      </Container>
    );
  }

  // Success state
  if (success) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            {success}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Redirecting to results...
          </Typography>
          <CircularProgress />
        </Paper>
      </Container>
    );
  }

  // Instructions screen
  if (showInstructions) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mx: 'auto', mb: 2 }}>
              <Assignment sx={{ fontSize: 32 }} />
            </Avatar>
            <Typography variant="h4" gutterBottom>
              {assignment.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {assignment.description}
            </Typography>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assignment Details
                  </Typography>
                  <Stack spacing={2}>
                    {assignment.dueDate && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTime fontSize="small" />
                        <Typography variant="body2">
                          Due: {format(new Date(assignment.dueDate), 'PPpp')}
                        </Typography>
                      </Box>
                    )}
                    <Box display="flex" alignItems="center" gap={1}>
                      <Grade fontSize="small" />
                      <Typography variant="body2">
                        Max Points: {assignment.maxPoints}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Psychology fontSize="small" />
                      <Typography variant="body2">
                        Questions: {questions.length}
                      </Typography>
                    </Box>
                    {assignment.timeLimit && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Timer fontSize="small" />
                        <Typography variant="body2">
                          Time Limit: {assignment.timeLimit} minutes
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Instructions
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {assignment.instructions || 'Read each question carefully and select the best answer.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {assignment.timeLimit && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                This assignment has a time limit of {assignment.timeLimit} minutes. 
                Once you start, the timer will begin counting down.
              </Typography>
            </Alert>
          )}

          {questions.length === 0 && (
            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                No questions found for this assignment. This might be because questions are still being processed 
                from the uploaded document. Please refresh the page or contact your instructor.
              </Typography>
            </Alert>
          )}

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button
              variant="contained"
              size="large"
              onClick={startAssignment}
              startIcon={<Send />}
              sx={{ minWidth: 200 }}
              disabled={questions.length === 0}
            >
              Start Assignment
            </Button>
            {questions.length === 0 && (
              <Button
                variant="outlined"
                size="large"
                onClick={() => window.location.reload()}
                startIcon={<Refresh />}
                sx={{ minWidth: 200, ml: 2 }}
              >
                Refresh Page
              </Button>
            )}
          </Box>
        </Paper>
      </Container>
    );
  }

  // No questions found
  if (questions.length === 0) {
    const isProcessing = assignment.aiProcessingStatus === 'pending' || 
                        assignment.aiExtractionStatus === 'pending' ||
                        assignment.aiProcessingStatus === 'not_started';
    const hasDocument = !!assignment.assignmentDocument?.fileUrl;
    const processingFailed = assignment.aiProcessingStatus === 'failed' || 
                           assignment.aiProcessingStatus === 'no_questions_found' ||
                           assignment.aiExtractionStatus === 'failed';

    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          {isProcessing ? (
            <>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h6" color="primary.main" gutterBottom>
                Processing Assignment Questions
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                AI is currently extracting questions from the uploaded assignment document.
                This usually takes 30-60 seconds. The page will automatically refresh when complete.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Document: {assignment.assignmentDocument?.filename || assignment.assignmentDocument?.originalName || 'Assignment Document'}<br/>
                Processing Status: {assignment.aiProcessingStatus || 'Unknown'}<br/>
                Extraction Status: {assignment.aiExtractionStatus || 'Unknown'}
              </Typography>
              <Typography variant="caption" color="primary.main" sx={{ fontStyle: 'italic' }}>
                ⏰ Auto-refreshing in 10 seconds...
              </Typography>
            </>
          ) : processingFailed ? (
            <>
              <Warning sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" color="warning.main" gutterBottom>
                No Questions Could Be Extracted
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                The system couldn't extract any questions from the uploaded document.
                This might be because:
              </Typography>
              <Box component="ul" sx={{ textAlign: 'left', maxWidth: 400, mx: 'auto', mb: 3 }}>
                <li>The document doesn't contain properly formatted questions</li>
                <li>The questions are in an unsupported format</li>
                <li>The document is corrupted or unreadable</li>
                <li>The AI processing encountered an error</li>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Please contact your instructor for assistance.
              </Typography>
            </>
          ) : hasDocument ? (
            <>
              <Assignment sx={{ fontSize: 48, color: 'info.main', mb: 2 }} />
              <Typography variant="h6" color="info.main" gutterBottom>
                Questions Not Yet Available
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                This assignment has a document uploaded, but questions haven't been processed yet.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Document: {assignment.assignmentDocument?.filename || assignment.assignmentDocument?.originalName || 'Assignment Document'}<br/>
                Processing Status: {assignment.aiProcessingStatus || 'Unknown'}<br/>
                Extraction Status: {assignment.aiExtractionStatus || 'Unknown'}<br/>
                Has Questions Flag: {assignment.hasQuestions ? 'Yes' : 'No'}<br/>
                Questions Count: {assignment.questions?.length || 0}<br/>
                Extracted Questions Count: {assignment.extractedQuestions?.length || 0}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Questions Available
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                This assignment doesn't have any questions set up yet.
                Please contact your instructor.
              </Typography>
            </>
          )}

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              onClick={() => window.location.reload()}
              variant="outlined"
              startIcon={<Refresh />}
            >
              Refresh Page
            </Button>
            <Button
              onClick={() => navigate(-1)}
              variant="outlined"
              startIcon={<ArrowBack />}
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === (currentQuestion._id || currentQuestion.id));

  if (!currentQuestion || !currentAnswer) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Unable to load question data. Please refresh the page.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header with timer and progress */}
      <AppBar position="fixed" color="default" elevation={1}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
              <Assignment fontSize="small" />
            </Avatar>
            <Typography variant="h6" component="div" noWrap>
              {assignment.title}
            </Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            {/* Save Status Indicator */}
            {saving && (
              <Chip
                icon={<CircularProgress size={16} />}
                label="Saving..."
                color="info"
                variant="outlined"
                size="small"
              />
            )}
            {saveMessage && !saving && (
              <Chip
                icon={<Save />}
                label={saveMessage}
                color="success"
                variant="outlined"
                size="small"
              />
            )}
            {isDirty && !saving && !saveMessage && (
              <Chip
                label="Unsaved changes"
                color="warning"
                variant="outlined"
                size="small"
              />
            )}

            {assignment.timeLimit && (
              <Chip
                icon={<Timer />}
                label={formatTime(timeRemaining)}
                color={getTimeColor()}
                variant="outlined"
              />
            )}

            <Chip
              label={`${currentQuestionIndex + 1} of ${questions.length}`}
              variant="outlined"
            />

            <Button
              variant="outlined"
              onClick={manualSave}
              startIcon={saving ? <CircularProgress size={16} /> : <Save />}
              disabled={saving || !isDirty}
              size="small"
              sx={{ mr: 1 }}
            >
              Save
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={() => setShowSubmitDialog(true)}
              startIcon={<Send />}
              disabled={submitting}
            >
              Submit
            </Button>
          </Stack>
        </Toolbar>

        <Box sx={{ px: 2, pb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={((currentQuestionIndex + 1) / questions.length) * 100}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      </AppBar>

      {/* Main content */}
      <Container maxWidth="lg" sx={{ pt: 14, pb: 4 }}>
        {/* Question Header */}
        <Paper 
          sx={{ 
            p: 3, 
            mb: 2, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}
          elevation={3}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                <Typography variant="h6" fontWeight="bold">
                  {currentQuestionIndex + 1}
                </Typography>
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Grade sx={{ fontSize: 16 }} />
                  <Typography variant="body2">
                    {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                  </Typography>
                  {currentQuestion.difficulty && (
                    <>
                      <Typography variant="body2" sx={{ mx: 1 }}>•</Typography>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {currentQuestion.difficulty}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Box>

            <IconButton
              onClick={() => toggleFlag(currentAnswer.questionId)}
              sx={{ 
                color: currentAnswer.flagged ? '#ffc107' : 'rgba(255,255,255,0.7)',
                '&:hover': { 
                  color: currentAnswer.flagged ? '#ff9800' : 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              {currentAnswer.flagged ? <Flag /> : <FlagOutlined />}
            </IconButton>
          </Box>
        </Paper>

        {/* Question Content */}
        <Paper sx={{ p: 4, mb: 3 }} elevation={2}>
          {/* Question Text */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 2, 
                lineHeight: 1.6,
                fontSize: '1.2rem',
                fontWeight: 'medium',
                color: 'text.primary'
              }}
            >
              {currentQuestion.question}
            </Typography>
            <Divider sx={{ my: 3 }} />
          </Box>

          {/* Answer Area */}
          <Box sx={{ mt: 2 }}>
            {renderQuestion(currentQuestion, currentAnswer)}
          </Box>

          {/* Answer Status */}
          <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {currentAnswer.answer ? (
                <>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    Question answered
                  </Typography>
                </>
              ) : (
                <>
                  <Warning color="warning" fontSize="small" />
                  <Typography variant="body2" color="warning.main" fontWeight="medium">
                    Not answered yet
                  </Typography>
                </>
              )}
              {currentAnswer.flagged && (
                <>
                  <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                  <Flag color="warning" fontSize="small" />
                  <Typography variant="body2" color="warning.main" fontWeight="medium">
                    Flagged for review
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<NavigateBefore />}
            onClick={() => handleNavigation('prev')}
            disabled={currentQuestionIndex === 0}
            variant="outlined"
          >
            Previous
          </Button>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
            {questions.map((_, index) => {
              const answer = answers[index];
              return (
                <Chip
                  key={index}
                  label={index + 1}
                  size="small"
                  onClick={() => goToQuestion(index)}
                  color={
                    index === currentQuestionIndex ? 'primary' :
                    answer?.flagged ? 'warning' :
                    answer?.answer ? 'success' : 'default'
                  }
                  variant={index === currentQuestionIndex ? 'filled' : 'outlined'}
                  sx={{ cursor: 'pointer', minWidth: 36 }}
                />
              );
            })}
          </Box>

          <Button
            endIcon={<NavigateNext />}
            onClick={() => handleNavigation('next')}
            disabled={currentQuestionIndex === questions.length - 1}
            variant="outlined"
          >
            Next
          </Button>
        </Box>
      </Container>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Assignment</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to submit this assignment? You won't be able to make changes after submission.
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Progress Summary:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label={`${answers.filter(a => a.answer).length}/${answers.length} Answered`}
                color={answers.filter(a => a.answer).length === answers.length ? 'success' : 'warning'}
                size="small"
              />
              {flaggedQuestions.size > 0 && (
                <Chip
                  label={`${flaggedQuestions.size} Flagged`}
                  color="warning"
                  size="small"
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>Cancel</Button>
          <Button
            onClick={() => handleSubmit()}
            variant="contained"
            color="success"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Save Status Snackbar */}
      <Snackbar
        open={!!saveMessage}
        autoHideDuration={3000}
        onClose={() => setSaveMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSaveMessage(null)} severity="success" sx={{ width: '100%' }}>
          {saveMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TakeExam;
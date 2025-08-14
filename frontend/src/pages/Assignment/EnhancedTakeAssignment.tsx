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
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
  Grid,
  FormControl,
  Select,
  MenuItem,
  Tooltip,
  AppBar,
  Toolbar,
  Fab
} from '@mui/material';
import {
  Security,
  Send,
  NavigateBefore,
  NavigateNext,
  Assignment,
  Grade,
  AccessTime,
  ArrowBack,
  Save,
  AutoAwesome,
  CheckCircle,
  Warning,
  Upload,
  AttachFile,
  Delete
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { assignmentService, Assignment as AssignmentType } from '../../services/assignmentService';
import { fileUploadService } from '../../services/fileUploadService';

interface AssignmentQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'multiple_choice_multiple' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching';
  options?: string[];
  correctAnswer?: string | string[];
  points: number;
  section?: string;
  sectionTitle?: string;
  leftItems?: string[];
  rightItems?: string[];
  matchingPairs?: Array<{ left: string; right: string; }>;
}

interface AssignmentAnswer {
  questionId: string;
  answer: string;
  timeSpent: number;
  attachments?: File[];
}

interface EnhancedAssignment extends AssignmentType {
  questions?: AssignmentQuestion[];
  hasQuestions: boolean;
  autoSubmit: boolean;
  timeLimit?: number; // in minutes
}

const EnhancedTakeAssignment: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [assignment, setAssignment] = useState<EnhancedAssignment | null>(null);
  const [answers, setAnswers] = useState<AssignmentAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [autoSubmitWarning, setAutoSubmitWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // File upload state
  const [attachments, setAttachments] = useState<File[]>([]);
  const [textResponse, setTextResponse] = useState('');

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Load assignment data
  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId) return;

      try {
        setLoading(true);
        const assignmentData = await assignmentService.getAssignmentById(assignmentId);
        
        // Check if this is an enhanced assignment with questions
        const enhancedAssignment: EnhancedAssignment = {
          ...assignmentData,
          hasQuestions: !!(assignmentData.questions && assignmentData.questions.length > 0),
          autoSubmit: assignmentData.autoSubmit || false,
          timeLimit: assignmentData.timeLimit
        };

        setAssignment(enhancedAssignment);

        // Initialize answers for questions if they exist
        if (enhancedAssignment.questions) {
          const initialAnswers = enhancedAssignment.questions.map(q => ({
            questionId: q._id,
            answer: '',
            timeSpent: 0,
            attachments: []
          }));
          setAnswers(initialAnswers);
        }

        // Set up timer if there's a time limit
        if (enhancedAssignment.timeLimit) {
          setTimeRemaining(enhancedAssignment.timeLimit * 60); // Convert to seconds
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [assignmentId]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && assignment?.timeLimit) {
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
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timeRemaining, assignment]);

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges) {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      
      autoSaveRef.current = setTimeout(() => {
        handleAutoSave();
      }, 5000);
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [answers, textResponse, attachments, hasUnsavedChanges]);

  const handleAutoSave = async () => {
    if (!assignment) return;
    
    try {
      setAutoSaving(true);
      
      const saveData = {
        assignmentId: assignment._id,
        answers: assignment.hasQuestions ? answers : undefined,
        textResponse: !assignment.hasQuestions ? textResponse : undefined,
        attachments: attachments,
        isDraft: true
      };

      await assignmentService.saveDraft(saveData);
      setHasUnsavedChanges(false);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setAutoSaving(false);
    }
  };

  const handleAutoSubmit = async () => {
    setAutoSubmitWarning(true);
    await handleSubmit(true);
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!assignment) return;

    try {
      setSubmitting(true);

      const submissionData = {
        assignmentId: assignment._id,
        answers: assignment.hasQuestions ? answers : undefined,
        textResponse: !assignment.hasQuestions ? textResponse : undefined,
        attachments: attachments,
        finalSubmission: true,
        isAutoSubmit
      };

      await assignmentService.submitAssignment(submissionData);
      
      setSuccess(isAutoSubmit ? 'Assignment auto-submitted due to time limit' : 'Assignment submitted successfully!');
      
      setTimeout(() => {
        navigate(`/assignment/${assignmentId}/results`);
      }, 2000);

    } catch (error: any) {
      setError(error.message || 'Failed to submit assignment');
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

  const handleQuestionNavigation = (direction: 'prev' | 'next') => {
    if (!assignment?.questions) return;

    // Save time spent on current question
    const timeSpent = Date.now() - questionStartTimeRef.current;
    setAnswers(prev => {
      const newAnswers = [...prev];
      if (newAnswers[currentQuestionIndex]) {
        newAnswers[currentQuestionIndex].timeSpent += timeSpent;
      }
      return newAnswers;
    });

    // Navigate
    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (direction === 'next' && currentQuestionIndex < assignment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }

    questionStartTimeRef.current = Date.now();
  };

  const renderQuestion = (question: AssignmentQuestion, answer: AssignmentAnswer) => {
    const handleAnswerChange = (value: string) => {
      setAnswers(prev => {
        const newAnswers = [...prev];
        const index = newAnswers.findIndex(a => a.questionId === question._id);
        if (index !== -1) {
          newAnswers[index].answer = value;
        }
        return newAnswers;
      });
      setHasUnsavedChanges(true);
    };

    const handleMultipleChoiceChange = (option: string, checked: boolean) => {
      setAnswers(prev => {
        const newAnswers = [...prev];
        const index = newAnswers.findIndex(a => a.questionId === question._id);
        if (index !== -1) {
          const currentAnswer = newAnswers[index].answer;
          const answers = currentAnswer ? currentAnswer.split(',').filter(a => a.trim()) : [];
          
          if (checked && !answers.includes(option)) {
            answers.push(option);
          } else if (!checked && answers.includes(option)) {
            const optionIndex = answers.indexOf(option);
            answers.splice(optionIndex, 1);
          }
          
          newAnswers[index].answer = answers.join(',');
        }
        return newAnswers;
      });
      setHasUnsavedChanges(true);
    };

    const handleMatchingChange = (leftItem: string, rightItem: string) => {
      setAnswers(prev => {
        const newAnswers = [...prev];
        const index = newAnswers.findIndex(a => a.questionId === question._id);
        if (index !== -1) {
          const currentAnswer = newAnswers[index].answer;
          let matchingPairs: Record<string, string> = {};
          
          if (currentAnswer) {
            try {
              matchingPairs = JSON.parse(currentAnswer);
            } catch (e) {
              matchingPairs = {};
            }
          }
          
          matchingPairs[leftItem] = rightItem;
          newAnswers[index].answer = JSON.stringify(matchingPairs);
        }
        return newAnswers;
      });
      setHasUnsavedChanges(true);
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
                sx={{ mb: 1 }}
              />
            ))}
          </RadioGroup>
        );

      case 'multiple_choice_multiple':
        const selectedAnswers = answer.answer ? answer.answer.split(',') : [];
        return (
          <Box>
            {question.options?.map((option, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={selectedAnswers.includes(option)}
                    onChange={(e) => handleMultipleChoiceChange(option, e.target.checked)}
                  />
                }
                label={option}
                sx={{ display: 'block', mb: 1 }}
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

      case 'matching':
        const currentMatches = answer.answer ? JSON.parse(answer.answer || '{}') : {};
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Match the items from the left column with the correct items from the right column.
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Column A
                </Typography>
                <List dense>
                  {question.leftItems?.map((leftItem, index) => (
                    <ListItem key={index} sx={{ bgcolor: 'grey.50', mb: 1, borderRadius: 1 }}>
                      <ListItemText primary={leftItem} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Column B
                </Typography>
                {question.leftItems?.map((leftItem, leftIndex) => (
                  <Box key={leftIndex} sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Match for "{leftItem}":
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={currentMatches[leftItem] || ''}
                        onChange={(e) => handleMatchingChange(leftItem, e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Select a match</em>
                        </MenuItem>
                        {question.rightItems?.map((rightItem, rightIndex) => (
                          <MenuItem key={rightIndex} value={rightItem}>
                            {rightItem}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                ))}
              </Grid>
            </Grid>
          </Box>
        );

      default:
        return (
          <TextField
            fullWidth
            multiline
            rows={question.type === 'essay' ? 8 : 3}
            value={answer.answer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Enter your answer here..."
            variant="outlined"
          />
        );
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
    setHasUnsavedChanges(true);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!assignment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Assignment not found</Alert>
      </Container>
    );
  }

  const currentQuestion = assignment.questions?.[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?._id);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Top Bar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>
          <IconButton 
            edge="start" 
            onClick={() => navigate(-1)} 
            sx={{ 
              mr: { xs: 1, md: 2 },
              minWidth: { xs: 40, md: 48 },
              minHeight: { xs: 40, md: 48 }
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', md: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {assignment.title}
          </Typography>

          {/* Auto-save indicator */}
          {autoSaving && (
            <Tooltip title="Auto-saving...">
              <CircularProgress size={20} sx={{ mr: { xs: 1, md: 2 } }} />
            </Tooltip>
          )}
          
          {hasUnsavedChanges && (
            <Tooltip title="You have unsaved changes">
              <Warning color="warning" sx={{ mr: { xs: 1, md: 2 } }} />
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      {/* Success/Error Alerts */}
      {success && (
        <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Container maxWidth="lg" sx={{ py: { xs: 1, md: 3 } }}>
        {/* Timer and Progress */}
        {assignment.timeLimit && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ flex: 1, mr: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {assignment.hasQuestions 
                    ? `Question ${currentQuestionIndex + 1} of ${assignment.questions?.length || 0}`
                    : 'Assignment Progress'
                  }
                </Typography>
                {assignment.hasQuestions && (
                  <LinearProgress
                    variant="determinate"
                    value={((currentQuestionIndex + 1) / (assignment.questions?.length || 1)) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                )}
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
        )}

        {/* Question-based Assignment */}
        {assignment.hasQuestions && currentQuestion && currentAnswer ? (
          <>
            {/* Question */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                {/* Section Header */}
                {currentQuestion.section && (
                  <Box sx={{ 
                    mb: 3, 
                    p: 2, 
                    bgcolor: 'primary.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.200'
                  }}>
                    <Typography variant="h6" color="primary.main" gutterBottom>
                      Section {currentQuestion.section}
                    </Typography>
                    {currentQuestion.sectionTitle && (
                      <Typography variant="body2" color="text.secondary">
                        {currentQuestion.sectionTitle}
                      </Typography>
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Question {currentQuestionIndex + 1}
                      {currentQuestion.section && (
                        <Chip 
                          label={`Section ${currentQuestion.section}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, fontSize: '1.1rem', lineHeight: 1.6 }}>
                      {currentQuestion.question}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="body2" color="text.secondary">
                      {currentQuestion.points} points
                    </Typography>
                  </Box>
                </Box>

                {renderQuestion(currentQuestion, currentAnswer)}
              </CardContent>
            </Card>

            {/* Navigation */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', md: 'center' },
              gap: 2,
              mb: 3
            }}>
              <Button
                variant="outlined"
                startIcon={<NavigateBefore />}
                onClick={() => handleQuestionNavigation('prev')}
                disabled={currentQuestionIndex === 0}
                sx={{
                  minHeight: { xs: 48, md: 36 },
                  order: { xs: 2, md: 1 }
                }}
              >
                Previous
              </Button>

              {/* Question Navigation Grid */}
              <Box sx={{ 
                display: 'flex', 
                gap: 1, 
                flexWrap: 'wrap',
                justifyContent: 'center',
                order: { xs: 1, md: 2 },
                maxWidth: { xs: '100%', md: '400px' },
                overflow: 'auto'
              }}>
                {assignment.questions?.map((question, index) => {
                  const isAnswered = answers[index]?.answer && answers[index].answer.trim() !== '';
                  return (
                    <Tooltip 
                      key={index}
                      title={`Question ${index + 1}${question.section ? ` (Section ${question.section})` : ''} - ${isAnswered ? 'Answered' : 'Not answered'}`}
                    >
                      <IconButton
                        size="small"
                        onClick={() => setCurrentQuestionIndex(index)}
                        sx={{
                          minWidth: 40,
                          minHeight: 40,
                          bgcolor: index === currentQuestionIndex 
                            ? 'primary.main' 
                            : isAnswered 
                              ? 'success.light'
                              : 'grey.300',
                          color: index === currentQuestionIndex 
                            ? 'white' 
                            : isAnswered
                              ? 'success.contrastText'
                              : 'text.primary',
                          '&:hover': {
                            bgcolor: index === currentQuestionIndex 
                              ? 'primary.dark' 
                              : isAnswered
                                ? 'success.main'
                                : 'grey.400',
                          }
                        }}
                      >
                        {index + 1}
                      </IconButton>
                    </Tooltip>
                  );
                })}
              </Box>

              {currentQuestionIndex === (assignment.questions?.length || 0) - 1 ? (
                <Button
                  variant="contained"
                  color="success"
                  endIcon={<Send />}
                  onClick={() => setShowSubmitDialog(true)}
                  disabled={submitting}
                  sx={{
                    minHeight: { xs: 48, md: 36 },
                    order: { xs: 3, md: 3 },
                    fontWeight: 'bold'
                  }}
                >
                  Submit Assignment
                </Button>
              ) : (
                <Button
                  variant="contained"
                  endIcon={<NavigateNext />}
                  onClick={() => handleQuestionNavigation('next')}
                  sx={{
                    minHeight: { xs: 48, md: 36 },
                    order: { xs: 3, md: 3 }
                  }}
                >
                  Next
                </Button>
              )}
            </Box>
          </>
        ) : (
          /* Traditional Assignment Interface */
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assignment Instructions
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 3 }}>
                    {assignment.instructions}
                  </Typography>
                  
                  <Divider sx={{ my: 3 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Your Response
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={12}
                    value={textResponse}
                    onChange={(e) => {
                      setTextResponse(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Write your response here..."
                    variant="outlined"
                    sx={{ mb: 3 }}
                  />

                  {/* File Attachments */}
                  <Typography variant="h6" gutterBottom>
                    Attachments
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <input
                      accept={assignment.allowedFileTypes?.map(type => `.${type}`).join(',')}
                      style={{ display: 'none' }}
                      id="file-upload"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<Upload />}
                        sx={{ mb: 2 }}
                      >
                        Upload Files
                      </Button>
                    </label>
                  </Box>

                  {attachments.length > 0 && (
                    <List>
                      {attachments.map((file, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <AttachFile />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                          />
                          <IconButton onClick={() => removeAttachment(index)}>
                            <Delete />
                          </IconButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assignment Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Points: {assignment.maxPoints}
                  </Typography>
                  
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Send />}
                      onClick={() => setShowSubmitDialog(true)}
                      disabled={submitting || (!textResponse.trim() && attachments.length === 0)}
                      fullWidth
                      sx={{
                        minHeight: { xs: 48, md: 36 },
                        fontWeight: 'bold'
                      }}
                    >
                      Submit Assignment
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Submit Dialog */}
        <Dialog
          open={showSubmitDialog}
          onClose={() => setShowSubmitDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Submit Assignment</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to submit your assignment? This action cannot be undone.
            </Typography>
            
            {assignment.hasQuestions && (
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
                      primary={`${assignment.questions?.length || 0} questions`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Grade />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${assignment.maxPoints} total points`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <AccessTime />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${Math.floor(answers.reduce((total, answer) => total + answer.timeSpent, 0) / 60000)} minutes spent`}
                    />
                  </ListItem>
                </List>
              </Box>
            )}
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
              {submitting ? 'Submitting...' : 'Submit Assignment'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Auto-submit Warning */}
        {autoSubmitWarning && (
          <Dialog open={autoSubmitWarning} maxWidth="sm" fullWidth>
            <DialogTitle>Time's Up!</DialogTitle>
            <DialogContent>
              <Typography variant="body1">
                Your assignment has been automatically submitted due to time expiration.
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

      {/* Floating Save Button */}
      {hasUnsavedChanges && (
        <Fab
          color="primary"
          onClick={handleAutoSave}
          disabled={autoSaving}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000
          }}
        >
          {autoSaving ? <CircularProgress size={24} /> : <Save />}
        </Fab>
      )}
    </Box>
  );
};

export default EnhancedTakeAssignment;
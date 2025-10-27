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
  FormLabel,
  Select,
  MenuItem,
  Tooltip,
  AppBar,
  Toolbar,
  Fab,
  Stack,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import {
  Timer,
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
  Delete,
  Flag,
  FlagOutlined,
  Help,
  Visibility,
  VisibilityOff,
  Psychology,
  Shield
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { assignmentService, Assignment as AssignmentType } from '../../services/assignmentService';
import { fileUploadService } from '../../services/fileUploadService';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';

interface AssignmentQuestion {
  _id?: string;
  id?: string;
  question: string;
  type: 'multiple_choice' | 'multiple_choice_multiple' | 'true_false' | 'short_answer' | 'essay' | 'fill_in_blank' | 'numerical' | 'matching';
  options?: string[];
  choices?: string[]; // Alternative field name for options
  correctAnswer?: string | string[];
  points: number;
  section?: string;
  sectionTitle?: string;
  leftItems?: string[];
  rightItems?: string[];
  matchingPairs?: Array<{ left: string; right: string; }>;
  timeLimit?: number;
  aiExtracted?: boolean; // Flag to indicate if this was extracted by AI
}

interface AssignmentAnswer {
  questionId: string;
  answer: string;
  timeSpent: number;
  flagged: boolean;
  attachments?: File[];
}

interface EnhancedAssignment extends AssignmentType {
  questions?: AssignmentQuestion[];
  hasQuestions: boolean;
  autoSubmit: boolean;
  timeLimit?: number; // in minutes
  shouldHaveQuestions?: boolean;
  isProcessingQuestions?: boolean;
}

const EnhancedTakeAssignment: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();

  // State management
  const [assignment, setAssignment] = useState<EnhancedAssignment | null>(null);
  const [answers, setAnswers] = useState<AssignmentAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [autoSaving, setAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [showQuestionOverview, setShowQuestionOverview] = useState(false);

  // File upload state for non-question assignments
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
        
        // Check for questions in multiple possible locations and combine them
        let questions: AssignmentQuestion[] = [];
        
        // Add manually created questions
        if (assignmentData.questions && assignmentData.questions.length > 0) {
          questions = [...questions, ...assignmentData.questions];
        }
        
        // Add extracted questions with proper IDs
        if (assignmentData.extractedQuestions && assignmentData.extractedQuestions.length > 0) {
          const extractedWithIds = assignmentData.extractedQuestions.map((q: any, index: number) => ({
            ...q,
            _id: q._id || q.id || `extracted_${index}`,
            id: q.id || q._id || `extracted_${index}`,
          }));
          questions = [...questions, ...extractedWithIds];
        }
        
        // Also check assignmentDocument.extractedQuestions as fallback
        if (questions.length === 0 && assignmentData.assignmentDocument?.extractedQuestions) {
          const docExtractedWithIds = assignmentData.assignmentDocument.extractedQuestions.map((q: any, index: number) => ({
            ...q,
            _id: q._id || q.id || `doc_extracted_${index}`,
            id: q.id || q._id || `doc_extracted_${index}`,
          }));
          questions = [...questions, ...docExtractedWithIds];
        }
        
        // Debug logging to understand the data structure
        console.log('🔍 Assignment Data Debug:', {
          assignmentId,
          hasQuestions: assignmentData.questions?.length || 0,
          hasExtractedQuestions: assignmentData.extractedQuestions?.length || 0,
          hasDocumentQuestions: assignmentData.assignmentDocument?.extractedQuestions?.length || 0,
          finalQuestions: questions.length,
          questionsStructure: questions.slice(0, 2), // Show first 2 questions for debugging
          assignmentDocument: assignmentData.assignmentDocument ? {
            filename: assignmentData.assignmentDocument.filename,
            hasExtractedQuestions: !!assignmentData.assignmentDocument.extractedQuestions
          } : null,
          aiProcessingStatus: assignmentData.aiProcessingStatus,
          aiExtractionStatus: assignmentData.aiExtractionStatus,
          hasDocumentFile: !!assignmentData.assignmentDocument?.fileUrl,
          rawData: {
            questions: assignmentData.questions,
            extractedQuestions: assignmentData.extractedQuestions,
            documentExtractedQuestions: assignmentData.assignmentDocument?.extractedQuestions
          }
        });

        // If no questions found, provide detailed feedback
        if (questions.length === 0) {
          console.log('⚠️ NO QUESTIONS FOUND - Detailed Analysis:', {
            aiProcessingStatus: assignmentData.aiProcessingStatus,
            aiExtractionStatus: assignmentData.aiExtractionStatus,
            hasDocument: !!assignmentData.assignmentDocument,
            documentStatus: assignmentData.assignmentDocument ? {
              hasFile: !!assignmentData.assignmentDocument.fileUrl,
              filename: assignmentData.assignmentDocument.filename
            } : 'No document'
          });
        }
        
        // Determine if this assignment should have questions
        const shouldHaveQuestions = !!(assignmentData.assignmentDocument?.fileUrl) || 
                                   !!(assignmentData.extractedQuestions) || 
                                   !!(assignmentData.questions);
        
        const isProcessingQuestions = assignmentData.aiProcessingStatus === 'pending' || 
                                     assignmentData.aiExtractionStatus === 'pending';
        
        // Check if this is an enhanced assignment with questions
        const enhancedAssignment: EnhancedAssignment = {
          ...assignmentData,
          questions: questions,
          hasQuestions: !!(questions && questions.length > 0),
          autoSubmit: assignmentData.autoSubmit || false,
          timeLimit: assignmentData.timeLimit,
          shouldHaveQuestions,
          isProcessingQuestions
        };



        setAssignment(enhancedAssignment);

        // Initialize answers for questions if they exist
        if (enhancedAssignment.questions && enhancedAssignment.questions.length > 0) {
          const initialAnswers = enhancedAssignment.questions.map((q, index) => {
            const questionId = q._id || q.id || `question_${index}`;
            console.log(`🔧 Initializing answer for question ${index}:`, {
              questionId,
              hasId: !!q._id,
              hasIdFallback: !!q.id,
              questionText: q.question?.substring(0, 50) + '...'
            });
            return {
              questionId,
              answer: '',
              timeSpent: 0,
              flagged: false,
              attachments: []
            };
          });
          console.log('📝 Initialized answers:', initialAnswers.length);
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
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [timeRemaining, assignment, showInstructions]);

  // Auto-save effect
  useEffect(() => {
    if (hasUnsavedChanges && !showInstructions) {
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
  }, [answers, textResponse, attachments, hasUnsavedChanges, showInstructions]);

  const handleAutoSave = async () => {
    if (!assignment) return;
    
    try {
      setAutoSaving(true);
      
      const saveData = {
        assignmentId: assignment._id,
        answers: assignment.hasQuestions ? answers : undefined,
        submissionText: !assignment.hasQuestions ? textResponse : undefined,
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
    await handleSubmit(true);
  };

  const startAssignment = () => {
    setShowInstructions(false);
    questionStartTimeRef.current = Date.now();
  };

  const handleSubmit = async (isAutoSubmit = false) => {
    if (!assignment) return;

    try {
      setSubmitting(true);

      const submissionData = {
        assignmentId: assignment._id,
        answers: assignment.hasQuestions ? answers : undefined,
        submissionText: !assignment.hasQuestions ? textResponse : undefined,
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

  const getTimeColor = (): 'error' | 'warning' | 'primary' => {
    if (!assignment?.timeLimit) return 'primary';
    const totalTime = assignment.timeLimit * 60;
    const percentage = (timeRemaining / totalTime) * 100;
    
    if (percentage <= 10) return 'error';
    if (percentage <= 25) return 'warning';
    return 'primary';
  };

  const goToQuestion = (index: number) => {
    if (!assignment?.questions || index < 0 || index >= assignment.questions.length) return;
    
    // Update time spent on current question
    const timeSpent = Date.now() - questionStartTimeRef.current;
    setAnswers(prev => prev.map(a => 
      a.questionId === assignment.questions![currentQuestionIndex]._id
        ? { ...a, timeSpent: a.timeSpent + timeSpent }
        : a
    ));
    
    setCurrentQuestionIndex(index);
    questionStartTimeRef.current = Date.now();
  };

  const handleQuestionNavigation = (direction: 'prev' | 'next') => {
    if (!assignment?.questions) return;

    const timeSpent = Date.now() - questionStartTimeRef.current;
    setAnswers(prev => {
      const newAnswers = [...prev];
      if (newAnswers[currentQuestionIndex]) {
        newAnswers[currentQuestionIndex].timeSpent += timeSpent;
      }
      return newAnswers;
    });

    if (direction === 'prev' && currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (direction === 'next' && currentQuestionIndex < assignment.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }

    questionStartTimeRef.current = Date.now();
  };

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
    setHasUnsavedChanges(true);
  };

  // Helper function to get consistent question ID
  const getQuestionId = (question: AssignmentQuestion, index?: number): string => {
    return question._id || question.id || `question_${index || 0}`;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => prev.map(a => 
      a.questionId === questionId 
        ? { ...a, answer }
        : a
    ));
    setHasUnsavedChanges(true);
  };

  const renderQuestion = (question: AssignmentQuestion, answer: AssignmentAnswer, questionId?: string) => {
    const effectiveQuestionId = questionId || getQuestionId(question, currentQuestionIndex);
    switch (question.type) {
      case 'multiple_choice':
        // Handle different ways options might be stored
        const options = question.options || 
                       question.choices || 
                       [];
        

        
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
              value={answer.answer}
              onChange={(e) => handleAnswerChange(effectiveQuestionId, e.target.value)}
            >
              {options.map((option: string, index: number) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderColor: answer.answer === option ? 'primary.main' : 'grey.300',
                      backgroundColor: answer.answer === option 
                        ? alpha(theme.palette.primary.main, 0.08) 
                        : 'transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateY(-1px)',
                        boxShadow: 1
                      }
                    }}
                    onClick={() => handleAnswerChange(effectiveQuestionId, option)}
                  >
                    <FormControlLabel
                      value={option}
                      control={
                        <Radio 
                          checked={answer.answer === option}
                          sx={{ 
                            color: answer.answer === option ? 'primary.main' : 'grey.400',
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

      case 'multiple_choice_multiple':
        const selectedAnswers = answer.answer ? answer.answer.split(',').filter(a => a.trim()) : [];
        const multipleOptions = question.options || 
                              question.choices || 
                              [];
        

        
        if (!multipleOptions || multipleOptions.length === 0) {
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
              ✅ Select all correct answers:
            </Typography>
            <Box>
              {multipleOptions.map((option: string, index: number) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderColor: selectedAnswers.includes(option) ? 'primary.main' : 'grey.300',
                      backgroundColor: selectedAnswers.includes(option)
                        ? alpha(theme.palette.primary.main, 0.08) 
                        : 'transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateY(-1px)',
                        boxShadow: 1
                      }
                    }}
                    onClick={() => {
                      const currentAnswers = [...selectedAnswers];
                      if (currentAnswers.includes(option)) {
                        const optionIndex = currentAnswers.indexOf(option);
                        currentAnswers.splice(optionIndex, 1);
                      } else {
                        currentAnswers.push(option);
                      }
                      handleAnswerChange(effectiveQuestionId, currentAnswers.join(','));
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedAnswers.includes(option)}
                          sx={{ 
                            color: selectedAnswers.includes(option) ? 'primary.main' : 'grey.400',
                            '&.Mui-checked': { color: 'primary.main' }
                          }}
                        />
                      }
                      label={
                        <Typography variant="body1" sx={{ ml: 1 }}>
                          <strong>{String.fromCharCode(65 + index)}.</strong> {option}
                        </Typography>
                      }
                      sx={{ margin: 0, width: '100%', pointerEvents: 'none' }}
                    />
                  </Paper>
                </Box>
              ))}
            </Box>
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
                      borderColor: answer.answer === option ? 'primary.main' : 'grey.300',
                      backgroundColor: answer.answer === option
                        ? alpha(theme.palette.primary.main, 0.08)
                        : 'transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        backgroundColor: alpha(theme.palette.primary.main, 0.04),
                        transform: 'translateY(-2px)',
                        boxShadow: 2
                      }
                    }}
                    onClick={() => handleAnswerChange(effectiveQuestionId, option)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <Radio
                        checked={answer.answer === option}
                        sx={{ 
                          color: answer.answer === option ? 'primary.main' : 'grey.400',
                          '&.Mui-checked': { color: 'primary.main' }
                        }}
                      />
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        color: answer.answer === option ? 'primary.main' : 'text.primary'
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
              value={answer.answer}
              onChange={(e) => handleAnswerChange(effectiveQuestionId, e.target.value)}
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
              Characters: {answer.answer.length}
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
                value={answer.answer}
                onChange={(value) => handleAnswerChange(effectiveQuestionId, value)}
                placeholder="Write your detailed essay response here. Use the toolbar to format your text..."
                minHeight={200}
              />
            </Paper>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              💡 Tip: Use formatting tools to structure your response clearly
            </Typography>
          </Box>
        );

      case 'fill_in_blank':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', color: 'text.secondary' }}>
              🔤 Fill in the blank:
            </Typography>
            <TextField
              fullWidth
              value={answer.answer}
              onChange={(e) => handleAnswerChange(effectiveQuestionId, e.target.value)}
              placeholder="Type your answer to fill in the blank..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1.1rem',
                  fontWeight: 'medium',
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  }
                }
              }}
            />
          </Box>
        );

      case 'numerical':
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium', color: 'text.secondary' }}>
              🔢 Enter numerical answer:
            </Typography>
            <TextField
              fullWidth
              type="number"
              value={answer.answer}
              onChange={(e) => handleAnswerChange(effectiveQuestionId, e.target.value)}
              placeholder="Enter your numerical answer..."
              variant="outlined"
              inputProps={{ 
                step: "any",
                style: { fontSize: '1.2rem', textAlign: 'center', fontWeight: 'bold' }
              }}
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
              💡 Enter numbers only (decimals allowed)
            </Typography>
          </Box>
        );

      case 'matching':
        const matchingPairs = answer.answer ? JSON.parse(answer.answer || '{}') : {};
        return (
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 'medium', color: 'text.secondary' }}>
              🔗 Match the items:
            </Typography>
            <Grid container spacing={3}>
              {question.leftItems?.map((leftItem, index) => (
                <Grid item xs={12} key={index}>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={4}>
                        <Paper sx={{ p: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
                          <Typography variant="body1" fontWeight="medium">
                            {String.fromCharCode(65 + index)}. {leftItem}
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="body2" color="text.secondary" fontWeight="bold">
                            ↔
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={7}>
                        <FormControl fullWidth>
                          <Select
                            value={matchingPairs[leftItem] || ''}
                            onChange={(e) => {
                              const newPairs = { ...matchingPairs };
                              newPairs[leftItem] = e.target.value;
                              handleAnswerChange(effectiveQuestionId, JSON.stringify(newPairs));
                            }}
                            displayEmpty
                            variant="outlined"
                            sx={{
                              backgroundColor: 'white',
                              '& .MuiSelect-select': {
                                py: 1.5
                              }
                            }}
                          >
                            <MenuItem value="" disabled>
                              <em>Select a match...</em>
                            </MenuItem>
                            {question.rightItems?.map((rightItem, rightIndex) => (
                              <MenuItem key={rightIndex} value={rightItem}>
                                <Typography variant="body1">
                                  {rightItem}
                                </Typography>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              💡 Match each item on the left with the most appropriate item on the right
            </Typography>
          </Box>
        );

  
        
      
    }
  };

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
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
                    {assignment.hasQuestions && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Help fontSize="small" />
                        <Typography variant="body2">
                          Questions: {assignment.questions?.length || 0}
                        </Typography>
                      </Box>
                    )}
                    {/* Show assignment type */}
                    <Box display="flex" alignItems="center" gap={1}>
                      <Assignment fontSize="small" />
                      <Typography variant="body2">
                        Type: {assignment.hasQuestions ? 'Question-based Assignment' : 'Traditional Assignment'}
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
                    {assignment.instructions || 'No specific instructions provided.'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {assignment.timeLimit && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                This assignment has a time limit of {assignment.timeLimit} minutes. 
                Once you start, the timer will begin counting down. Make sure you have enough time to complete the assignment.
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
            >
              Start Assignment
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  const currentQuestion = assignment.questions?.[currentQuestionIndex];
  const currentQuestionId = currentQuestion?._id || currentQuestion?.id || `question_${currentQuestionIndex}`;
  const currentAnswer = answers.find(a => a.questionId === currentQuestionId);
  
  // Debug logging for rendering issues
  console.log('🎯 Render Debug:', {
    hasAssignment: !!assignment,
    hasQuestions: assignment?.hasQuestions,
    questionsLength: assignment?.questions?.length,
    currentQuestionIndex,
    currentQuestionId,
    currentQuestion: currentQuestion ? {
      id: currentQuestion._id,
      idFallback: currentQuestion.id,
      question: currentQuestion.question?.substring(0, 50) + '...',
      type: currentQuestion.type
    } : null,
    currentAnswer: currentAnswer ? {
      questionId: currentAnswer.questionId,
      hasAnswer: !!currentAnswer.answer
    } : null,
    answersLength: answers.length,
    showInstructions
  });

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
            {autoSaving && (
              <Tooltip title="Auto-saving...">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    Saving...
                  </Typography>
                </Box>
              </Tooltip>
            )}

            {assignment.timeLimit && (
              <Chip
                icon={<Timer />}
                label={formatTime(timeRemaining)}
                color={getTimeColor()}
                variant="outlined"
              />
            )}

            {assignment.hasQuestions && (
              <Chip
                label={`${currentQuestionIndex + 1} of ${assignment.questions?.length}`}
                variant="outlined"
              />
            )}

            <Button
              variant="outlined"
              onClick={() => setShowQuestionOverview(true)}
              size="small"
              disabled={!assignment.hasQuestions}
            >
              Overview
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

        {assignment.hasQuestions && assignment.questions && (
          <Box sx={{ px: 2, pb: 1 }}>
            <LinearProgress
              variant="determinate"
              value={((currentQuestionIndex + 1) / assignment.questions.length) * 100}
              sx={{ height: 6, borderRadius: 3 }}
            />
          </Box>
        )}
      </AppBar>

      {/* Main content */}
      <Container maxWidth="lg" sx={{ pt: assignment.hasQuestions ? 14 : 12, pb: 4 }}>
        {/* Assignment content */}
        
        {assignment.hasQuestions ? (
          // Show questions interface if assignment has questions
          assignment.questions && assignment.questions.length > 0 ? (
            currentQuestion && currentAnswer ? (
            /* Question-based assignment */
            <Box>
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
                        Question {currentQuestionIndex + 1} of {assignment.questions?.length}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Grade sx={{ fontSize: 16 }} />
                        <Typography variant="body2">
                          {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
                        </Typography>
                        {currentQuestion.section && (
                          <>
                            <Typography variant="body2" sx={{ mx: 1 }}>•</Typography>
                            <Typography variant="body2">{currentQuestion.section}</Typography>
                          </>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Tooltip title={currentAnswer.flagged ? 'Remove flag' : 'Flag for review'}>
                    <IconButton
                      onClick={() => toggleFlag(currentQuestionId)}
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
                  </Tooltip>
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
                  {renderQuestion(currentQuestion, currentAnswer, currentQuestionId)}
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
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
              <Button
                startIcon={<NavigateBefore />}
                onClick={() => handleQuestionNavigation('prev')}
                disabled={currentQuestionIndex === 0}
                variant="outlined"
              >
                Previous
              </Button>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {assignment.questions?.map((_, index) => (
                  <Tooltip
                    key={index}
                    title={`Question ${index + 1}${answers[index]?.flagged ? ' (Flagged)' : ''}${answers[index]?.answer ? ' (Answered)' : ' (Not answered)'}`}
                  >
                    <Chip
                      label={index + 1}
                      size="small"
                      onClick={() => goToQuestion(index)}
                      color={
                        index === currentQuestionIndex ? 'primary' :
                        answers[index]?.flagged ? 'warning' :
                        answers[index]?.answer ? 'success' : 'default'
                      }
                      variant={index === currentQuestionIndex ? 'filled' : 'outlined'}
                      sx={{ cursor: 'pointer', minWidth: 36 }}
                    />
                  </Tooltip>
                ))}
              </Box>

              <Button
                endIcon={<NavigateNext />}
                onClick={() => handleQuestionNavigation('next')}
                disabled={currentQuestionIndex === (assignment.questions?.length || 1) - 1}
                variant="outlined"
              >
                Next
              </Button>
            </Box>
            </Box>
          ) : (
            /* Questions exist but not ready yet */
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Loading Questions...
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Questions: {assignment.questions?.length || 0}<br/>
                Current Index: {currentQuestionIndex}<br/>
                Answers Initialized: {answers.length}
              </Typography>
              <CircularProgress />
            </Paper>
          )
        ) : assignment.isProcessingQuestions ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <CircularProgress size={48} sx={{ mb: 2 }} />
              <Typography variant="h6" color="primary.main" gutterBottom>
                Processing Questions
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                AI is currently extracting questions from the assignment document.
                This usually takes 30-60 seconds.
              </Typography>
              <Button
                onClick={() => window.location.reload()}
                variant="outlined"
                sx={{ mt: 2 }}
              >
                Check Status
              </Button>
            </Paper>
          ) : assignment.shouldHaveQuestions ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main" gutterBottom>
                No Questions Found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This assignment should have questions, but none were found.
                This might be because:
              </Typography>
              <Box component="ul" sx={{ mt: 2, textAlign: 'left', maxWidth: 500, mx: 'auto', pl: 3 }}>
                <li>Questions are still being extracted from the document</li>
                <li>No questions could be extracted from the uploaded document</li>
                <li>The extraction process failed</li>
                <li>The instructor hasn't added questions yet</li>
              </Box>
              <Button
                onClick={() => window.location.reload()}
                variant="outlined"
                color="warning"
                sx={{ mt: 2 }}
              >
                Refresh Page
              </Button>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="info.main" gutterBottom>
                Traditional Assignment
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This assignment doesn't have structured questions.
                Please submit your work using the text editor and file upload below.
              </Typography>
            </Paper>
          )
        ) : (
          /* Traditional file/text assignment */
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom>
              {assignment.title}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {assignment.description}
            </Typography>
            
            {assignment.instructions && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {assignment.instructions}
                </Typography>
              </Alert>
            )}

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Your Response
              </Typography>
              <RichTextEditor
                value={textResponse}
                onChange={setTextResponse}
                placeholder="Enter your assignment response here..."
                minHeight={300}
              />
            </Box>

            {assignment.submissionType !== 'text' && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  File Attachments
                </Typography>
                <Box sx={{ border: 2, borderStyle: 'dashed', borderColor: 'grey.300', p: 3, textAlign: 'center' }}>
                  <Upload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Drop files here or click to browse
                  </Typography>
                  <Button variant="outlined" sx={{ mt: 2 }}>
                    Choose Files
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        )}
      </Container>

      {/* Submit Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Assignment</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to submit this assignment? You won't be able to make changes after submission.
          </Typography>
          
          {assignment.hasQuestions && (
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
          )}
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

      {/* Question Overview Dialog */}
      {assignment.hasQuestions && (
        <Dialog 
          open={showQuestionOverview} 
          onClose={() => setShowQuestionOverview(false)} 
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>Question Overview</DialogTitle>
          <DialogContent>
            <List>
              {assignment.questions?.map((question, index) => (
                <ListItem key={question._id} divider>
                  <ListItemIcon>
                    <Chip
                      label={index + 1}
                      size="small"
                      color={
                        answers[index]?.flagged ? 'warning' :
                        answers[index]?.answer ? 'success' : 'default'
                      }
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={question.question.length > 100 ? `${question.question.substring(0, 100)}...` : question.question}
                    secondary={
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Chip label={`${question.points} pts`} size="small" variant="outlined" />
                        {answers[index]?.flagged && <Chip label="Flagged" size="small" color="warning" />}
                        {answers[index]?.answer && <Chip label="Answered" size="small" color="success" />}
                      </Stack>
                    }
                  />
                  <Button
                    size="small"
                    onClick={() => {
                      goToQuestion(index);
                      setShowQuestionOverview(false);
                    }}
                  >
                    Go to Question
                  </Button>
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowQuestionOverview(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default EnhancedTakeAssignment;
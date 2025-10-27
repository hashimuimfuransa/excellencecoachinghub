import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Paper,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  Tooltip,
  Divider,
  AppBar,
  Toolbar,
  Fab,
  CircularProgress,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  useTheme
} from '@mui/material';
import {
  Assignment,
  Save,
  Send,
  AutoAwesome,
  Timer,
  CheckCircle,
  Warning,
  Info,
  Edit,
  ArrowBack,
  ExpandMore,
  Code,
  TextFields,
  Functions,
  Description,
  Refresh,
  Visibility,
  DoneAll
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { assignmentService } from '../../services/assignmentService';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';

interface AssignmentData {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: Date;
  maxPoints: number;
  submissionType: 'file' | 'text' | 'both';
  status: 'draft' | 'published' | 'closed';
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

interface ExtractedQuestion {
  id: string;
  question: string;
  type: 'text' | 'essay' | 'code' | 'math';
  points?: number;
}

interface AssignmentSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'essay' | 'code' | 'math';
  completed: boolean;
}

interface Submission {
  _id?: string;
  submissionText?: string;
  sections?: AssignmentSection[];
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  aiGrade?: {
    score: number;
    feedback: string;
    confidence: number;
  };
  submittedAt?: Date;
  isLate: boolean;
  autoSubmitted?: boolean;
}

const EnhancedWorkOnAssignment: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  
  // Auto-save timer ref
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<Date>(new Date());
  
  // Assignment state
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Work state
  const [sections, setSections] = useState<AssignmentSection[]>([]);
  const [submissionText, setSubmissionText] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [autoSubmitDialog, setAutoSubmitDialog] = useState(false);

  // Extract questions from assignment instructions
  const extractQuestionsFromInstructions = useCallback((instructions: string, description: string): ExtractedQuestion[] => {
    const questions: ExtractedQuestion[] = [];
    const combinedText = `${instructions} ${description}`;
    
    // Common question patterns - improved to handle more cases
    const questionPatterns = [
      // Numbered questions: 1. 2. 3. etc.
      /(?:^|\n)\s*(\d+)[\.\)]\s*(.+?)(?=\n\s*\d+[\.\)]|\n\s*[A-Z][\.\)]|\n\s*$|$)/gms,
      // Lettered questions: A. B. C. etc.
      /(?:^|\n)\s*([A-Z])[\.\)]\s*(.+?)(?=\n\s*[A-Z][\.\)]|\n\s*\d+[\.\)]|\n\s*$|$)/gms,
      // Question keywords
      /(?:^|\n)\s*(?:Question\s*(\d*):?\s*|Q(\d*):?\s*)(.+?)(?=\n\s*(?:Question\s*\d*:?\s*|Q\d*:?\s*)|\n\s*$|$)/gims,
      // Task/Part keywords
      /(?:^|\n)\s*(?:Task\s*(\d*):?\s*|Part\s*(\d*):?\s*)(.+?)(?=\n\s*(?:Task\s*\d*:?\s*|Part\s*\d*:?\s*)|\n\s*$|$)/gims,
      // Problem keywords
      /(?:^|\n)\s*(?:Problem\s*(\d*):?\s*)(.+?)(?=\n\s*(?:Problem\s*\d*:?\s*)|\n\s*$|$)/gims,
      // Exercise keywords
      /(?:^|\n)\s*(?:Exercise\s*(\d*):?\s*)(.+?)(?=\n\s*(?:Exercise\s*\d*:?\s*)|\n\s*$|$)/gims
    ];

    let questionId = 1;
    const foundQuestions = new Set(); // To avoid duplicates
    
    questionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(combinedText)) !== null) {
        // Get the question text from the appropriate capture group
        const questionText = match[3] || match[2] || match[1];
        if (questionText && questionText.trim().length > 10) {
          const cleanQuestion = questionText.trim().replace(/\s+/g, ' ');
          
          // Skip if we already found this question
          if (foundQuestions.has(cleanQuestion.toLowerCase())) {
            continue;
          }
          foundQuestions.add(cleanQuestion.toLowerCase());
          
          // Determine question type based on content
          let type: 'text' | 'essay' | 'code' | 'math' = 'text';
          const lowerQuestion = cleanQuestion.toLowerCase();
          
          if (lowerQuestion.includes('code') || 
              lowerQuestion.includes('program') ||
              lowerQuestion.includes('algorithm') ||
              lowerQuestion.includes('function') ||
              lowerQuestion.includes('implement') ||
              lowerQuestion.includes('write a') && (lowerQuestion.includes('script') || lowerQuestion.includes('method'))) {
            type = 'code';
          } else if (lowerQuestion.includes('essay') ||
                    lowerQuestion.includes('explain') ||
                    lowerQuestion.includes('discuss') ||
                    lowerQuestion.includes('analyze') ||
                    lowerQuestion.includes('describe') ||
                    lowerQuestion.includes('compare') ||
                    lowerQuestion.includes('evaluate') ||
                    cleanQuestion.length > 150) {
            type = 'essay';
          } else if (lowerQuestion.includes('calculate') ||
                    lowerQuestion.includes('solve') ||
                    lowerQuestion.includes('equation') ||
                    lowerQuestion.includes('formula') ||
                    lowerQuestion.includes('compute') ||
                    lowerQuestion.includes('find the value') ||
                    /\d+\s*[\+\-\*\/]\s*\d+/.test(cleanQuestion)) {
            type = 'math';
          }

          // Extract points if mentioned
          const pointsMatch = cleanQuestion.match(/\((\d+)\s*(?:points?|pts?|marks?)\)/i);
          const points = pointsMatch ? parseInt(pointsMatch[1]) : undefined;

          questions.push({
            id: `question-${questionId}`,
            question: cleanQuestion.replace(/\(\d+\s*(?:points?|pts?|marks?)\)/i, '').trim(),
            type,
            points
          });
          
          questionId++;
        }
      }
    });

    // If no structured questions found, look for question marks and imperative sentences
    if (questions.length === 0) {
      const sentences = combinedText.split(/[.!?]+/);
      sentences.forEach((sentence, index) => {
        const trimmed = sentence.trim();
        if ((trimmed.includes('?') || 
             trimmed.toLowerCase().startsWith('write') ||
             trimmed.toLowerCase().startsWith('create') ||
             trimmed.toLowerCase().startsWith('implement') ||
             trimmed.toLowerCase().startsWith('solve') ||
             trimmed.toLowerCase().startsWith('explain') ||
             trimmed.toLowerCase().startsWith('describe')) && 
            trimmed.length > 20) {
          
          let type: 'text' | 'essay' | 'code' | 'math' = 'text';
          const lowerSentence = trimmed.toLowerCase();
          
          if (lowerSentence.includes('code') || lowerSentence.includes('program')) {
            type = 'code';
          } else if (lowerSentence.includes('explain') || lowerSentence.includes('describe')) {
            type = 'essay';
          } else if (lowerSentence.includes('calculate') || lowerSentence.includes('solve')) {
            type = 'math';
          }
          
          questions.push({
            id: `question-${index + 1}`,
            question: trimmed + (trimmed.includes('?') ? '' : '?'),
            type
          });
        }
      });
    }

    return questions.slice(0, 10); // Limit to 10 questions max
  }, []);

  // Default sections based on assignment type and extracted questions
  const getDefaultSections = useCallback((assignmentTitle: string, instructions: string, questions: ExtractedQuestion[]): AssignmentSection[] => {
    // If we have extracted questions, create sections based on them
    if (questions.length > 0) {
      const questionSections: AssignmentSection[] = questions.map((question, index) => ({
        id: `question-${index + 1}`,
        title: `Question ${index + 1}`,
        content: '',
        type: question.type,
        completed: false
      }));

      return questionSections;
    }

    // Fallback to default sections if no questions extracted
    const defaultSections: AssignmentSection[] = [
      {
        id: 'introduction',
        title: 'Introduction',
        content: '',
        type: 'essay',
        completed: false
      },
      {
        id: 'main-content',
        title: 'Main Content',
        content: '',
        type: 'essay',
        completed: false
      },
      {
        id: 'conclusion',
        title: 'Conclusion',
        content: '',
        type: 'essay',
        completed: false
      }
    ];

    // If it's a code assignment, add code sections
    if (assignmentTitle.toLowerCase().includes('code') || instructions.toLowerCase().includes('program')) {
      defaultSections.push({
        id: 'code-implementation',
        title: 'Code Implementation',
        content: '',
        type: 'code',
        completed: false
      });
    }

    // If it's a math assignment, add math sections
    if (assignmentTitle.toLowerCase().includes('math') || instructions.toLowerCase().includes('equation')) {
      defaultSections.push({
        id: 'calculations',
        title: 'Calculations',
        content: '',
        type: 'math',
        completed: false
      });
    }

    return defaultSections;
  }, []);

  // Load assignment data
  useEffect(() => {
    const loadAssignment = async () => {
      if (!assignmentId) return;
      
      try {
        setLoading(true);
        setError(null);

        // Load assignment
        const assignmentData = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(assignmentData);

        // Extract questions from assignment
        const questions = extractQuestionsFromInstructions(assignmentData.instructions, assignmentData.description);
        setExtractedQuestions(questions);

        // Load existing submission
        const existingSubmission = await assignmentService.getSubmissionByAssignment(assignmentId);
        
        if (existingSubmission) {
          setSubmission(existingSubmission);
          setSubmissionText(existingSubmission.submissionText || '');
          
          if (existingSubmission.sections && existingSubmission.sections.length > 0) {
            setSections(existingSubmission.sections);
          } else {
            // Create default sections
            setSections(getDefaultSections(assignmentData.title, assignmentData.instructions, questions));
          }
        } else {
          // Create default sections for new submission
          setSections(getDefaultSections(assignmentData.title, assignmentData.instructions, questions));
        }

        // Calculate time remaining
        const dueDate = new Date(assignmentData.dueDate);
        const now = new Date();
        const remaining = Math.max(0, dueDate.getTime() - now.getTime());
        setTimeRemaining(remaining);

      } catch (err: any) {
        console.error('Failed to load assignment:', err);
        setError(err.message || 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    loadAssignment();
  }, [assignmentId, getDefaultSections, extractQuestionsFromInstructions]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        const newTime = Math.max(0, prev - 1000);
        
        // Show warning when 5 minutes left
        if (newTime <= 5 * 60 * 1000 && newTime > 0) {
          setShowTimeWarning(true);
        }
        
        // Auto-submit when time is up
        if (newTime === 0) {
          handleAutoSubmit();
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Auto-save functionality
  const performAutoSave = useCallback(async () => {
    if (!isDirty || saving || !assignment) return;

    try {
      setSaving(true);
      
      await assignmentService.submitAssignment({
        assignmentId: assignment._id,
        submissionText,
        sections,
        isDraft: true
      });
      
      setIsDirty(false);
      lastSaveRef.current = new Date();
      
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [assignment, submissionText, sections, isDirty, saving]);

  // Auto-save timer
  useEffect(() => {
    if (isDirty) {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
      
      autoSaveTimer.current = setTimeout(() => {
        performAutoSave();
      }, 30000); // Auto-save every 30 seconds
    }

    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [isDirty, performAutoSave]);

  // Handle section content change
  const handleSectionChange = (sectionId: string, content: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, content, completed: content.trim().length > 50 }
        : section
    ));
    setIsDirty(true);
  };

  // Handle submission text change
  const handleSubmissionTextChange = (content: string) => {
    setSubmissionText(content);
    setIsDirty(true);
  };

  // Manual save
  const handleSave = async () => {
    if (!assignment) return;
    
    try {
      setSaving(true);
      setError(null);
      
      await assignmentService.submitAssignment({
        assignmentId: assignment._id,
        submissionText,
        sections,
        isDraft: true
      });
      
      setIsDirty(false);
      setSuccess('Draft saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // Submit assignment
  const handleSubmit = async () => {
    if (!assignment) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      await assignmentService.submitAssignment({
        assignmentId: assignment._id,
        submissionText,
        sections,
        isDraft: false
      });
      
      setSuccess('Assignment submitted successfully! You will receive your grade shortly.');
      
      // Navigate back after a delay
      setTimeout(() => {
        navigate(`/dashboard/student`);
      }, 2000);
      
    } catch (err: any) {
      console.error('Submit failed:', err);
      setError(err.message || 'Failed to submit assignment');
      setSubmitting(false);
    }
  };

  // Auto-submit when time runs out
  const handleAutoSubmit = async () => {
    if (!assignment) return;
    
    setAutoSubmitDialog(true);
    
    try {
      await assignmentService.submitAssignment({
        assignmentId: assignment._id,
        submissionText,
        sections,
        isDraft: false,
        autoSubmit: true
      });
      
      setTimeout(() => {
        navigate(`/dashboard/student`);
      }, 3000);
      
    } catch (err: any) {
      console.error('Auto-submit failed:', err);
    }
  };

  // Format time remaining
  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Get section icon
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'code': return <Code />;
      case 'math': return <Functions />;
      case 'essay': return <Description />;
      default: return <TextFields />;
    }
  };

  // Calculate completion percentage
  const completionPercentage = sections.length > 0 
    ? Math.round((sections.filter(s => s.completed).length / sections.length) * 100)
    : 0;

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header with Timer */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar>
          <IconButton 
            onClick={() => navigate('/dashboard/student')} 
            sx={{ mr: 2 }}
            color="primary"
          >
            <ArrowBack />
          </IconButton>
          
          <Assignment color="primary" sx={{ mr: 2 }} />
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              {assignment.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Due: {format(new Date(assignment.dueDate), 'PPp')}
            </Typography>
          </Box>

          {/* Timer */}
          {timeRemaining > 0 && (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Timer color={showTimeWarning ? 'error' : 'primary'} />
              <Typography 
                variant="h6" 
                sx={{ 
                  color: showTimeWarning ? 'error.main' : 'primary.main',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
              >
                {formatTimeRemaining(timeRemaining)}
              </Typography>
            </Stack>
          )}

          {/* Save Button */}
          <Tooltip title="Save Draft">
            <IconButton 
              onClick={handleSave} 
              disabled={!isDirty || saving}
              color="primary"
              sx={{ ml: 1 }}
            >
              {saving ? <CircularProgress size={20} /> : <Save />}
            </IconButton>
          </Tooltip>
        </Toolbar>

        {/* Progress Bar */}
        <Box sx={{ px: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              Progress: {completionPercentage}%
            </Typography>
            {isDirty && (
              <Chip 
                label="Unsaved changes" 
                size="small" 
                color="warning" 
                variant="outlined"
              />
            )}
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completionPercentage} 
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {showTimeWarning && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6">⚠️ Time Warning!</Typography>
            Less than 5 minutes remaining! Your work will be auto-submitted when time runs out.
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Instructions Panel */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2}>
              {/* Instructions Card */}
              <Card sx={{ position: 'sticky', top: 100 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <Info sx={{ mr: 1 }} />
                    Instructions
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  
                  <Typography variant="body2" color="text.secondary" paragraph>
                    <strong>Max Points:</strong> {assignment.maxPoints}
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    {assignment.instructions}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle2" gutterBottom>
                    Section Progress
                  </Typography>
                  {sections.map((section) => (
                    <Box key={section.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {section.completed ? (
                        <CheckCircle color="success" sx={{ fontSize: 16, mr: 1 }} />
                      ) : (
                        <Warning color="warning" sx={{ fontSize: 16, mr: 1 }} />
                      )}
                      <Typography variant="body2" color={section.completed ? 'success.main' : 'text.secondary'}>
                        {section.title}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Extracted Questions Card */}
              {extractedQuestions.length > 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Help sx={{ mr: 1 }} />
                      Assignment Questions
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Make sure to address all these questions in your submission:
                    </Typography>
                    
                    {extractedQuestions.map((question, index) => (
                      <Paper 
                        key={question.id} 
                        elevation={0} 
                        sx={{ 
                          p: 2, 
                          mb: 2, 
                          border: '1px solid', 
                          borderColor: 'divider',
                          borderLeft: '4px solid',
                          borderLeftColor: question.type === 'code' ? 'info.main' : 
                                          question.type === 'math' ? 'warning.main' :
                                          question.type === 'essay' ? 'success.main' : 'primary.main'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                            Q{index + 1}.
                          </Typography>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" paragraph>
                              {question.question}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip 
                                label={question.type} 
                                size="small" 
                                variant="outlined"
                                color={question.type === 'code' ? 'info' : 
                                      question.type === 'math' ? 'warning' :
                                      question.type === 'essay' ? 'success' : 'primary'}
                              />
                              {question.points && (
                                <Chip 
                                  label={`${question.points} pts`} 
                                  size="small" 
                                  variant="filled"
                                  color="secondary"
                                />
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                    
                    <Alert severity="info" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Tip:</strong> Structure your response to clearly address each question. 
                        Use the sections below to organize your answers.
                      </Typography>
                    </Alert>
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>

          {/* Work Area */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* General Submission Text - Only show if no questions extracted */}
              {assignment.submissionType !== 'file' && extractedQuestions.length === 0 && (
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Description sx={{ mr: 1 }} />
                      General Response
                    </Typography>
                    <RichTextEditor
                      value={submissionText}
                      onChange={handleSubmissionTextChange}
                      placeholder="Enter your general response here..."
                    />
                  </CardContent>
                </Card>
              )}

              {/* Sections */}
              {sections.map((section, index) => {
                // For question sections, find the corresponding question
                let correspondingQuestion = null;
                if (section.id.startsWith('question-')) {
                  const questionIndex = parseInt(section.id.split('-')[1]) - 1;
                  correspondingQuestion = extractedQuestions[questionIndex];
                }
                return (
                  <Accordion key={section.id} defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {getSectionIcon(section.type)}
                        <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                          {correspondingQuestion ? 
                            `${section.title}: ${correspondingQuestion.question.substring(0, 60)}${correspondingQuestion.question.length > 60 ? '...' : ''}` : 
                            section.title
                          }
                        </Typography>
                        {section.completed && (
                          <CheckCircle color="success" sx={{ mr: 1 }} />
                        )}
                        <Chip 
                          label={correspondingQuestion ? `${section.type} - ${correspondingQuestion.points || 'N/A'} pts` : section.type} 
                          size="small" 
                          variant="outlined"
                          color="primary"
                        />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      {/* Show corresponding question if available */}
                      {correspondingQuestion && (
                        <Card sx={{ mb: 3, bgcolor: 'primary.light', border: '2px solid', borderColor: 'primary.main' }}>
                          <CardContent>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'primary.dark' }}>
                              📝 Question:
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 2, fontSize: '1.1rem', lineHeight: 1.6 }}>
                              {correspondingQuestion.question}
                            </Typography>
                            {correspondingQuestion.points && (
                              <Chip 
                                label={`${correspondingQuestion.points} Points`} 
                                color="primary" 
                                size="small"
                                sx={{ fontWeight: 'bold' }}
                              />
                            )}
                            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                              💡 Provide your answer in the text area below
                            </Typography>
                          </CardContent>
                        </Card>
                      )}
                      
                      {section.type === 'code' ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={8}
                        value={section.content}
                        onChange={(e) => handleSectionChange(section.id, e.target.value)}
                        placeholder="Enter your code here..."
                        sx={{ 
                          '& .MuiInputBase-input': { 
                            fontFamily: 'monospace',
                            fontSize: '0.875rem'
                          }
                        }}
                      />
                    ) : (
                      <RichTextEditor
                        value={section.content}
                        onChange={(content) => handleSectionChange(section.id, content)}
                        placeholder={`Enter your ${section.title.toLowerCase()} here...`}
                      />
                    )}
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Words: {section.content.split(/\s+/).filter(word => word.length > 0).length}
                      </Typography>
                      {section.completed && (
                        <Chip 
                          icon={<DoneAll />}
                          label="Completed" 
                          size="small" 
                          color="success"
                        />
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
                );
              })}

              {/* Submit Button */}
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={submitting || (sections.length > 0 && sections.filter(s => s.completed).length === 0)}
                  startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                  sx={{ px: 4, py: 1.5 }}
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Make sure to complete at least one section before submitting
                </Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Auto-submit Dialog */}
      <Dialog open={autoSubmitDialog} disableEscapeKeyDown>
        <DialogTitle>Time's Up!</DialogTitle>
        <DialogContent>
          <Typography>
            The assignment deadline has been reached. Your work has been automatically submitted for grading.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate('/dashboard/student')} variant="contained">
            Go to Dashboard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedWorkOnAssignment;
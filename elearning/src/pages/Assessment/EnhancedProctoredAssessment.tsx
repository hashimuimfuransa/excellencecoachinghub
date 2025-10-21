import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Fab
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
  Shield,
  Fullscreen,
  FullscreenExit,
  CameraAlt,
  RecordVoiceOver,
  ExpandMore,
  CheckCircle,
  RadioButtonUnchecked,
  Assignment,
  Quiz,
  School,
  AccessTime,
  Star,
  TrendingUp
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { assessmentService, IAssessment, IQuestion } from '../../services/assessmentService';
import { proctoringService } from '../../services/proctoringService';
import { OrganizedAssessment } from '../../services/aiAssessmentOrganizerService';
import { SafeDialogTransition } from '../../utils/transitionFix';

interface ProctoringData {
  isActive: boolean;
  webcamStream: MediaStream | null;
  screenStream: MediaStream | null;
  violations: Array<{
    type: string;
    timestamp: Date;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  tabSwitches: number;
  suspiciousActivity: number;
  aiAlerts: Array<{
    type: string;
    confidence: number;
    timestamp: Date;
    description: string;
  }>;
}

interface AssessmentSection {
  id: string;
  title: string;
  description?: string;
  questions: IQuestion[];
  timeLimit?: number;
  instructions?: string;
}

const EnhancedProctoredAssessment: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Get organized assessment from location state
  const organizedAssessment = location.state?.organizedAssessment as OrganizedAssessment | undefined;
  
  // Assessment state
  const [assessment, setAssessment] = useState<IAssessment | null>(null);
  const [sections, setSections] = useState<AssessmentSection[]>([]);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Proctoring state
  const [proctoringData, setProctoringData] = useState<ProctoringData>({
    isActive: false,
    webcamStream: null,
    screenStream: null,
    violations: [],
    tabSwitches: 0,
    suspiciousActivity: 0,
    aiAlerts: []
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proctoringEnabled, setProctoringEnabled] = useState(false);
  const [webcamPermission, setWebcamPermission] = useState(false);
  const [screenPermission, setScreenPermission] = useState(false);
  
  // UI state
  const [showInstructions, setShowInstructions] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [aiEnhanced, setAiEnhanced] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const proctoringRef = useRef<NodeJS.Timeout | null>(null);
  const aiMonitoringRef = useRef<NodeJS.Timeout | null>(null);

  // Load assessment data
  useEffect(() => {
    const loadAssessment = async () => {
      if (!assessmentId) return;

      try {
        setLoading(true);
        
        // Check if we have exam material data from week navigation
        const examMaterial = location.state?.examMaterial;
        const weekAssessment = location.state?.assessment;
        const fromWeek = location.state?.fromWeek;
        
        if (fromWeek && weekAssessment && examMaterial) {
          console.log('📝 Loading exam from week material:', examMaterial.title);
          setAssessment(weekAssessment);
          
          // Create sections from exam content
          const examSections: AssessmentSection[] = [];
          
          if (examMaterial.content?.examContent?.questions && examMaterial.content.examContent.questions.length > 0) {
            // Use extracted questions from exam content
            const questions = examMaterial.content.examContent.questions;
            examSections.push({
              id: 'A',
              title: 'Exam Questions',
              description: `Complete all ${questions.length} questions`,
              questions: questions,
              timeLimit: examMaterial.examSettings?.timeLimit || 60,
              instructions: examMaterial.examSettings?.instructions || 'Answer all questions to the best of your ability.'
            });
          } else {
            // Fallback: create a basic section if no questions are extracted
            examSections.push({
              id: 'A',
              title: 'Exam Questions',
              description: 'Complete the exam questions',
              questions: [],
              timeLimit: examMaterial.examSettings?.timeLimit || 60,
              instructions: examMaterial.examSettings?.instructions || 'Answer all questions to the best of your ability.'
            });
          }
          
          setSections(examSections);
          setTimeRemaining((examMaterial.examSettings?.timeLimit || 60) * 60);
          setProctoringEnabled(true); // Enable proctoring for exams
          
        } else if (organizedAssessment) {
          // Check if we have AI-organized assessment data
          console.log('🤖 Using AI-organized assessment data');
          setAssessment(organizedAssessment.originalAssessment);
          setAiEnhanced(organizedAssessment.aiOrganized);
          
          // Use AI-organized sections instead of default organization
          const aiSections: AssessmentSection[] = organizedAssessment.sections.map((section, index) => ({
            id: section.id,
            title: section.title,
            description: section.description,
            questions: section.questions,
            timeLimit: section.timeAllocation,
            instructions: section.instructions
          }));
          
          setSections(aiSections);
          setTimeRemaining(organizedAssessment.estimatedCompletionTime * 60); // Convert to seconds
          
        } else {
          // Fallback to standard assessment loading
          console.log('📝 Loading standard assessment');
          const assessmentData = await assessmentService.getAssessmentById(assessmentId);
          setAssessment(assessmentData);
          
          // Organize questions into sections using the existing method
          const organizedSections = organizeQuestionsIntoSections(assessmentData.questions || []);
          setSections(organizedSections);
          
          setTimeRemaining(assessmentData.timeLimit ? assessmentData.timeLimit * 60 : 3600);
        }
        
        // Check if proctoring is required
        const currentAssessment = weekAssessment || organizedAssessment?.originalAssessment || assessment;
        if (currentAssessment && (currentAssessment.requireProctoring || currentAssessment.proctoringEnabled)) {
          setProctoringEnabled(true);
        }
        
      } catch (err: any) {
        console.error('Failed to load assessment:', err);
        setError(err.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };

    loadAssessment();
  }, [assessmentId, organizedAssessment, location.state]);

  // Organize questions into sections based on their section property or create default sections
  const organizeQuestionsIntoSections = (questions: IQuestion[]): AssessmentSection[] => {
    const sectionMap = new Map<string, IQuestion[]>();
    
    questions.forEach(question => {
      const sectionKey = question.section || 'A'; // Default to section A
      if (!sectionMap.has(sectionKey)) {
        sectionMap.set(sectionKey, []);
      }
      sectionMap.get(sectionKey)!.push(question);
    });

    return Array.from(sectionMap.entries()).map(([sectionKey, sectionQuestions], index) => ({
      id: sectionKey,
      title: `Section ${sectionKey}`,
      description: getSectionDescription(sectionKey, sectionQuestions),
      questions: sectionQuestions,
      timeLimit: Math.ceil(sectionQuestions.length * 2), // 2 minutes per question
      instructions: getSectionInstructions(sectionKey)
    }));
  };

  const getSectionDescription = (section: string, sectionQuestions: IQuestion[]): string => {
    const questionCount = sectionQuestions.length;
    const questionTypes = sectionQuestions.map(q => q.type);
    const uniqueTypes = new Set(questionTypes);
    
    // Generate description based on actual question types
    const typeDescriptions: string[] = [];
    for (const type of uniqueTypes) {
      const count = questionTypes.filter(t => t === type).length;
      const typeNames: Record<string, string> = {
        multiple_choice: 'Multiple Choice',
        multiple_choice_multiple: 'Multiple Choice (Multiple Answers)', 
        true_false: 'True/False',
        short_answer: 'Short Answer',
        essay: 'Essay',
        fill_in_blank: 'Fill in the Blank',
        numerical: 'Numerical'
      };
      typeDescriptions.push(`${count} ${typeNames[type] || type}`);
    }
    
    const typeDescriptionsText = typeDescriptions.join(', ');
    
    return `Section ${section} - ${typeDescriptionsText} (${questionCount} total)`;
  };

  const getSectionInstructions = (section: string): string => {
    const instructions: Record<string, string> = {
      'A': 'Choose the best answer for each question. Only one answer is correct.',
      'B': 'Provide clear and concise answers. Show your work where applicable.',
      'C': 'Write detailed responses. Support your answers with examples and explanations.'
    };
    return instructions[section] || 'Answer all questions in this section to the best of your ability.';
  };

  // Fullscreen management
  const enterFullscreen = useCallback(async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      setWarningMessage('Fullscreen mode is required for this assessment');
      setShowWarning(true);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && assessmentStarted && proctoringEnabled) {
        // Log violation
        setProctoringData(prev => ({
          ...prev,
          violations: [...prev.violations, {
            type: 'fullscreen_exit',
            timestamp: new Date(),
            severity: 'high',
            description: 'Student exited fullscreen mode'
          }],
          suspiciousActivity: prev.suspiciousActivity + 1
        }));
        
        setWarningMessage('You must remain in fullscreen mode during the assessment');
        setShowWarning(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [assessmentStarted, proctoringEnabled]);

  // Camera and screen sharing setup
  const setupProctoring = useCallback(async () => {
    if (!proctoringEnabled) return;

    try {
      // Request webcam permission
      const webcamStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = webcamStream;
      }
      
      setWebcamPermission(true);
      setProctoringData(prev => ({ ...prev, webcamStream, isActive: true }));
      
      // Start AI monitoring
      startAIMonitoring();
      
    } catch (error) {
      console.error('Failed to setup proctoring:', error);
      setError('Camera access is required for this proctored assessment');
    }
  }, [proctoringEnabled]);

  // AI monitoring for cheating detection
  const startAIMonitoring = useCallback(() => {
    if (!proctoringEnabled) return;

    aiMonitoringRef.current = setInterval(async () => {
      try {
        // Capture frame from video for AI analysis
        if (videoRef.current && proctoringData.webcamStream) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);
            
            // Convert to blob and send for AI analysis
            canvas.toBlob(async (blob) => {
              if (blob) {
                try {
                  const analysis = await proctoringService.analyzeFrame(blob);
                  
                  if (analysis.violations.length > 0) {
                    setProctoringData(prev => ({
                      ...prev,
                      aiAlerts: [...prev.aiAlerts, ...analysis.violations.map(v => ({
                        type: v.type,
                        confidence: v.confidence,
                        timestamp: new Date(),
                        description: v.description
                      }))],
                      suspiciousActivity: prev.suspiciousActivity + analysis.violations.length
                    }));
                  }
                } catch (error) {
                  console.error('AI analysis failed:', error);
                }
              }
            }, 'image/jpeg', 0.8);
          }
        }
      } catch (error) {
        console.error('AI monitoring error:', error);
      }
    }, 5000); // Analyze every 5 seconds
  }, [proctoringEnabled, proctoringData.webcamStream]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && assessmentStarted && proctoringEnabled) {
        setProctoringData(prev => ({
          ...prev,
          tabSwitches: prev.tabSwitches + 1,
          violations: [...prev.violations, {
            type: 'tab_switch',
            timestamp: new Date(),
            severity: 'medium',
            description: 'Student switched tabs or minimized window'
          }],
          suspiciousActivity: prev.suspiciousActivity + 1
        }));
        
        setWarningMessage('Tab switching is not allowed during the assessment');
        setShowWarning(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [assessmentStarted, proctoringEnabled]);

  // Timer management
  useEffect(() => {
    if (assessmentStarted && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitAssessment();
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
  }, [assessmentStarted, timeRemaining]);

  // Start assessment
  const handleStartAssessment = async () => {
    try {
      if (proctoringEnabled) {
        await setupProctoring();
        await enterFullscreen();
      }
      
      setAssessmentStarted(true);
      setShowInstructions(false);
      
      // Log assessment start
      await proctoringService.logEvent({
        type: 'assessment_started',
        assessmentId: assessmentId!,
        timestamp: new Date(),
        data: { proctoringEnabled }
      });
      
    } catch (error) {
      console.error('Failed to start assessment:', error);
      setError('Failed to start assessment. Please try again.');
    }
  };

  // Handle answer change
  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  // Navigation
  const goToNextQuestion = () => {
    const currentSectionData = sections[currentSection];
    if (currentQuestion < currentSectionData.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
      setCurrentQuestion(0);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    } else if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
      const prevSectionData = sections[currentSection - 1];
      setCurrentQuestion(prevSectionData.questions.length - 1);
    }
  };

  const goToSection = (sectionIndex: number) => {
    setCurrentSection(sectionIndex);
    setCurrentQuestion(0);
  };

  // Submit assessment
  const handleSubmitAssessment = async () => {
    try {
      setSubmitting(true);
      
      // Check if this is an exam from a week
      const examMaterial = location.state?.examMaterial;
      const fromWeek = location.state?.fromWeek;
      const weekId = location.state?.weekId;
      
      if (fromWeek && examMaterial) {
        // Handle exam submission from week
        console.log('📝 Submitting exam from week:', examMaterial.title);
        
        // Calculate score based on answers
        const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
        const answeredQuestions = Object.keys(answers).length;
        const score = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
        
        // Mark exam as completed in progress
        try {
          const { progressService } = await import('../../services/progressService');
          await progressService.markContentCompleted(
            weekId || examMaterial.weekId || '',
            examMaterial._id
          );
          
          console.log('✅ Exam progress saved successfully');
        } catch (progressError) {
          console.error('❌ Failed to save exam progress:', progressError);
        }
        
        // Navigate back to the course with success message
        navigate(`/course/${location.state?.courseId || 'unknown'}`, {
          state: {
            examCompleted: true,
            examTitle: examMaterial.title,
            score: score,
            timeSpent: assessment?.timeLimit ? (assessment.timeLimit * 60 - timeRemaining) : 0
          }
        });
        return;
      }
      
      // Original assessment submission logic
      const submissionData = {
        assessmentId: assessmentId!,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
          timeSpent: 0 // Calculate based on tracking
        })),
        totalTimeSpent: assessment?.timeLimit ? (assessment.timeLimit * 60 - timeRemaining) : 0,
        proctoringData: proctoringEnabled ? {
          violations: proctoringData.violations,
          tabSwitches: proctoringData.tabSwitches,
          suspiciousActivity: proctoringData.suspiciousActivity,
          aiAlerts: proctoringData.aiAlerts
        } : undefined
      };
      
      // Submit assessment
      await assessmentService.submitAssessment(submissionData);
      
      // Cleanup
      if (proctoringData.webcamStream) {
        proctoringData.webcamStream.getTracks().forEach(track => track.stop());
      }
      if (isFullscreen) {
        await exitFullscreen();
      }
      
      // Navigate to results
      navigate(`/dashboard/student/assessments/${assessmentId}/results`);
      
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      setError('Failed to submit assessment. Please try again.');
    } finally {
      setSubmitting(false);
      setShowSubmitDialog(false);
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

  // Get progress percentage
  const getProgress = (): number => {
    const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
    const answeredQuestions = Object.keys(answers).length;
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  };

  // Render question based on type
  const renderQuestion = (question: IQuestion) => {
    const questionId = question._id || question.id;
    const currentAnswer = answers[questionId];

    switch (question.type) {
      case 'multiple_choice':
        return (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold' }}>
              {question.question}
            </FormLabel>
            <RadioGroup
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
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
          </FormControl>
        );

      case 'multiple_choice_multiple':
        return (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold' }}>
              {question.question}
            </FormLabel>
            <Box>
              {question.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={currentAnswer?.includes(option) || false}
                      onChange={(e) => {
                        const newAnswer = currentAnswer || [];
                        if (e.target.checked) {
                          handleAnswerChange(questionId, [...newAnswer, option]);
                        } else {
                          handleAnswerChange(questionId, newAnswer.filter((a: string) => a !== option));
                        }
                      }}
                    />
                  }
                  label={option}
                  sx={{ display: 'block', mb: 1 }}
                />
              ))}
            </Box>
          </FormControl>
        );

      case 'true_false':
        return (
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend" sx={{ mb: 2, fontSize: '1.1rem', fontWeight: 'bold' }}>
              {question.question}
            </FormLabel>
            <RadioGroup
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              row
            >
              <FormControlLabel value="true" control={<Radio />} label="True" />
              <FormControlLabel value="false" control={<Radio />} label="False" />
            </RadioGroup>
          </FormControl>
        );

      case 'short_answer':
      case 'essay':
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              {question.question}
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={question.type === 'essay' ? 8 : 3}
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              placeholder={question.type === 'essay' ? 'Write your detailed response here...' : 'Enter your answer here...'}
              variant="outlined"
            />
          </Box>
        );

      default:
        return (
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
              {question.question}
            </Typography>
            <TextField
              fullWidth
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(questionId, e.target.value)}
              placeholder="Enter your answer here..."
              variant="outlined"
            />
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
        <Button 
          onClick={() => navigate('/dashboard/student')}
          sx={{
            backgroundColor: '#1976d2',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '4px',
            textTransform: 'none',
            fontWeight: 500,
            '&:hover': {
              backgroundColor: '#1565c0',
            },
          }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  // Instructions screen
  if (showInstructions) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ mb: 4 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Quiz color="primary" />
              {assessment.title}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              {assessment.description}
            </Typography>

            {/* Assessment Info */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
                  <AccessTime color="primary" sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h6" color="primary">
                    {assessment.timeLimit || 60} min
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Time Limit
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                  <Assignment color="success" sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h6" color="success.main">
                    {sections.reduce((sum, s) => sum + s.questions.length, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Questions
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                  <Star color="warning" sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h6" color="warning.main">
                    {assessment.passingScore || 70}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Passing Score
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                  <TrendingUp color="info" sx={{ fontSize: 32, mb: 1 }} />
                  <Typography variant="h6" color="info.main">
                    {assessment.attempts || 1}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Attempts
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Sections Overview */}
            <Typography variant="h6" gutterBottom sx={{ mt: 4, mb: 2 }}>
              Assessment Sections
            </Typography>
            {sections.map((section, index) => (
              <Accordion key={section.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <Chip label={section.id} color="primary" size="small" />
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {section.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                      {section.questions.length} questions
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {section.description}
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    Instructions: {section.instructions}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}

            {/* Proctoring Notice */}
            {proctoringEnabled && (
              <Alert severity="warning" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  <Shield sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Proctored Assessment Notice
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  This assessment is proctored and monitored. The following will be tracked:
                </Typography>
                <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                  <li>Webcam recording for identity verification</li>
                  <li>Screen activity and tab switching</li>
                  <li>AI-powered behavior analysis</li>
                  <li>Fullscreen mode enforcement</li>
                </Box>
              </Alert>
            )}

            {/* Instructions */}
            {assessment.instructions && (
              <Alert severity="info" sx={{ mt: 4, mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Instructions
                </Typography>
                <Typography variant="body2">
                  {assessment.instructions}
                </Typography>
              </Alert>
            )}

            {/* AI Enhanced Assessment Notice */}
            {aiEnhanced && organizedAssessment && (
              <Alert 
                severity="success" 
                sx={{ mt: 4, mb: 4, border: '2px solid', borderColor: 'success.main' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <AutoAwesome sx={{ mr: 1, color: 'success.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    AI-Enhanced Assessment
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  This assessment has been optimally organized by AI to enhance your learning experience.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip 
                    size="small" 
                    label={`${sections.length} Sections`} 
                    color="success" 
                    variant="outlined" 
                  />
                  <Chip 
                    size="small" 
                    label={`~${organizedAssessment.estimatedCompletionTime} min`} 
                    color="success" 
                    variant="outlined" 
                  />
                  <Chip 
                    size="small" 
                    label="AI Optimized" 
                    color="success" 
                    variant="outlined" 
                  />
                </Box>
                
                <Button
                  size="small"
                  onClick={() => setShowAiInsights(true)}
                  startIcon={<Psychology />}
                  sx={{ mt: 2 }}
                >
                  View AI Insights & Tips
                </Button>
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleStartAssessment}
                startIcon={proctoringEnabled ? <Security /> : <Quiz />}
                sx={{ px: 4, py: 2 }}
              >
                {proctoringEnabled ? 'Start Proctored Assessment' : 'Start Assessment'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
    );
  }

  const currentSectionData = sections[currentSection];
  const currentQuestionData = currentSectionData?.questions[currentQuestion];
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const currentQuestionNumber = sections.slice(0, currentSection).reduce((sum, section) => sum + section.questions.length, 0) + currentQuestion + 1;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <AppBar position="sticky" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            {assessment.title}
          </Typography>
          
          {/* Timer */}
          <Chip
            icon={<Timer />}
            label={formatTime(timeRemaining)}
            color={timeRemaining < 300 ? 'error' : timeRemaining < 900 ? 'warning' : 'success'}
            sx={{ mr: 2, fontWeight: 'bold' }}
          />
          
          {/* Progress */}
          <Chip
            label={`${currentQuestionNumber}/${totalQuestions}`}
            color="primary"
            sx={{ mr: 2 }}
          />
          
          {/* Proctoring Status */}
          {proctoringEnabled && (
            <Tooltip title="Proctoring Active">
              <Chip
                icon={<Security />}
                label="Monitored"
                color="error"
                size="small"
                sx={{ mr: 2 }}
              />
            </Tooltip>
          )}
          
          {/* Fullscreen Toggle */}
          <IconButton
            onClick={isFullscreen ? exitFullscreen : enterFullscreen}
            color="primary"
          >
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Toolbar>
        
        {/* Progress Bar */}
        <LinearProgress
          variant="determinate"
          value={getProgress()}
          sx={{ height: 4 }}
        />
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Sidebar - Section Navigation */}
          <Grid item xs={12} md={3}>
            <Card sx={{ position: 'sticky', top: 100 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Sections
                </Typography>
                <Stack spacing={1}>
                  {sections.map((section, index) => {
                    const sectionAnswered = section.questions.filter(q => 
                      answers.hasOwnProperty(q._id || q.id)
                    ).length;
                    const isCurrentSection = index === currentSection;
                    
                    return (
                      <Button
                        key={section.id}
                        variant={isCurrentSection ? 'contained' : 'outlined'}
                        onClick={() => goToSection(index)}
                        sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                        startIcon={
                          sectionAnswered === section.questions.length ? 
                            <CheckCircle color="success" /> : 
                            <RadioButtonUnchecked />
                        }
                      >
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {section.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {sectionAnswered}/{section.questions.length} answered
                          </Typography>
                        </Box>
                      </Button>
                    );
                  })}
                </Stack>
                
                {/* Proctoring Info */}
                {proctoringEnabled && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'error.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" color="error" gutterBottom>
                      Monitoring Status
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption">Tab Switches:</Typography>
                        <Typography variant="caption" color="error">
                          {proctoringData.tabSwitches}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption">Violations:</Typography>
                        <Typography variant="caption" color="error">
                          {proctoringData.violations.length}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption">AI Alerts:</Typography>
                        <Typography variant="caption" color="error">
                          {proctoringData.aiAlerts.length}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={6}>
            <Card sx={{ minHeight: 500 }}>
              <CardContent sx={{ p: 4 }}>
                {/* Section Header */}
                <Box sx={{ mb: 3 }}>
                  <Chip 
                    label={currentSectionData.title} 
                    color="primary" 
                    sx={{ mb: 2 }} 
                  />
                  <Typography variant="body2" color="text.secondary">
                    {currentSectionData.instructions}
                  </Typography>
                </Box>

                {/* Question */}
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h6" sx={{ color: 'primary.main' }}>
                      Question {currentQuestion + 1} of {currentSectionData.questions.length}
                    </Typography>
                    {currentQuestionData?.difficulty && (
                      <Chip 
                        label={currentQuestionData.difficulty}
                        size="small"
                        color={
                          currentQuestionData.difficulty === 'easy' ? 'success' :
                          currentQuestionData.difficulty === 'hard' ? 'error' : 'warning'
                        }
                        sx={{ textTransform: 'capitalize' }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Points: {currentQuestionData?.points || 1}
                  </Typography>
                  
                  {currentQuestionData && renderQuestion(currentQuestionData)}
                </Box>

                {/* Navigation */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                  <Button
                    startIcon={<NavigateBefore />}
                    onClick={goToPreviousQuestion}
                    disabled={currentSection === 0 && currentQuestion === 0}
                    variant="outlined"
                  >
                    Previous
                  </Button>
                  
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      startIcon={<Save />}
                      variant="outlined"
                      color="success"
                    >
                      Save Progress
                    </Button>
                    
                    {currentSection === sections.length - 1 && 
                     currentQuestion === currentSectionData.questions.length - 1 ? (
                      <Button
                        startIcon={<Send />}
                        onClick={() => setShowSubmitDialog(true)}
                        variant="contained"
                        color="success"
                      >
                        Submit Assessment
                      </Button>
                    ) : (
                      <Button
                        endIcon={<NavigateNext />}
                        onClick={goToNextQuestion}
                        variant="contained"
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Sidebar - Camera & Tools */}
          <Grid item xs={12} md={3}>
            {/* Camera Feed */}
            {proctoringEnabled && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CameraAlt />
                    Proctoring Camera
                  </Typography>
                  <Box sx={{ position: 'relative', bgcolor: 'black', borderRadius: 1, overflow: 'hidden' }}>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      style={{ width: '100%', height: 'auto' }}
                    />
                    {proctoringData.isActive && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        bgcolor: 'error.main', 
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        fontSize: '0.75rem'
                      }}>
                        REC
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Question Navigator */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Question Navigator
                </Typography>
                <Grid container spacing={1}>
                  {currentSectionData.questions.map((question, index) => {
                    const questionId = question._id || question.id;
                    const isAnswered = answers.hasOwnProperty(questionId);
                    const isCurrent = index === currentQuestion;
                    
                    return (
                      <Grid item xs={3} key={questionId}>
                        <Button
                          size="small"
                          variant={isCurrent ? 'contained' : isAnswered ? 'outlined' : 'text'}
                          color={isAnswered ? 'success' : 'primary'}
                          onClick={() => setCurrentQuestion(index)}
                          sx={{ 
                            minWidth: 40, 
                            height: 40,
                            fontSize: '0.75rem'
                          }}
                        >
                          {index + 1}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Warning Dialog */}
      <Dialog open={showWarning} onClose={() => setShowWarning(false)} TransitionComponent={SafeDialogTransition}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="warning" />
          Assessment Warning
        </DialogTitle>
        <DialogContent>
          <Typography>{warningMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowWarning(false)}>
            Understood
          </Button>
        </DialogActions>
      </Dialog>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onClose={() => setShowSubmitDialog(false)} TransitionComponent={SafeDialogTransition}>
        <DialogTitle>Submit Assessment</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to submit your assessment? You cannot make changes after submission.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Progress: {Object.keys(answers).length} of {totalQuestions} questions answered
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSubmitDialog(false)}>
            Continue Working
          </Button>
          <Button 
            onClick={handleSubmitAssessment}
            variant="contained"
            color="success"
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={16} /> : <Send />}
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* AI Insights Dialog */}
      <Dialog 
        open={showAiInsights} 
        onClose={() => setShowAiInsights(false)}
        maxWidth="md"
        fullWidth
        TransitionComponent={SafeDialogTransition}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Psychology color="primary" />
            <Typography variant="h6" component="div">
              AI Insights & Study Tips
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {organizedAssessment && (
            <Grid container spacing={3}>
              {/* Study Recommendations */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, h: 'fit-content' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <School color="primary" />
                    <Typography variant="h6">Study Recommendations</Typography>
                  </Box>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {organizedAssessment.studyRecommendations.map((recommendation, index) => (
                      <li key={index}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {recommendation}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              {/* Time Management Tips */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, h: 'fit-content' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <AccessTime color="primary" />
                    <Typography variant="h6">Time Management</Typography>
                  </Box>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {organizedAssessment.timeManagementTips.map((tip, index) => (
                      <li key={index}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {tip}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              {/* AI Analysis */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, h: 'fit-content' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <TrendingUp color="success" />
                    <Typography variant="h6">Your Strengths</Typography>
                  </Box>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {organizedAssessment.aiInsights.strengths.map((strength, index) => (
                      <li key={index}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {strength}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              {/* Preparation Tips */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, h: 'fit-content' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Star color="warning" />
                    <Typography variant="h6">Preparation Tips</Typography>
                  </Box>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {organizedAssessment.aiInsights.preparationTips.map((tip, index) => (
                      <li key={index}>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {tip}
                        </Typography>
                      </li>
                    ))}
                  </Box>
                </Paper>
              </Grid>

              {/* Difficulty Analysis */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
                    <Assignment color="info" />
                    <Typography variant="h6">Assessment Analysis</Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="success.main" sx={{ fontWeight: 'bold' }}>
                          {organizedAssessment.difficultyAnalysis.easy}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Easy Questions
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="warning.main" sx={{ fontWeight: 'bold' }}>
                          {organizedAssessment.difficultyAnalysis.medium}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Medium Questions
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Typography variant="h4" color="error.main" sx={{ fontWeight: 'bold' }}>
                          {organizedAssessment.difficultyAnalysis.hard}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Hard Questions
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                    Estimated completion time: {organizedAssessment.estimatedCompletionTime} minutes
                  </Typography>
                </Paper>
              </Grid>

              {/* Overall Instructions */}
              {organizedAssessment.overallInstructions && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      AI-Generated Instructions
                    </Typography>
                    <Typography variant="body2">
                      {organizedAssessment.overallInstructions}
                    </Typography>
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setShowAiInsights(false)} variant="outlined">
            Close
          </Button>
          <Button 
            onClick={() => {
              setShowAiInsights(false);
              handleStartAssessment();
            }} 
            variant="contained"
            startIcon={<Quiz />}
          >
            Start Assessment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Help */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => {
          // Open help dialog or contact support
        }}
      >
        <Help />
      </Fab>
    </Box>
  );
};

export default EnhancedProctoredAssessment;
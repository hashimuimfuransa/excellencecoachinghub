import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  Drawer,
  useTheme,
  useMediaQuery,
  Fab,
  Badge,
  Avatar,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  CheckCircle,
  Description,
  VideoFile,
  AudioFile,
  Image,
  Quiz,
  Assignment as AssignmentIcon,
  School,
  Timer,
  Lock,
  LockOpen,
  Menu,
  Notifications,
  VideoCall,
  Announcement,
  Event,
  Schedule,
  TrendingUp,
  Person,
  Dashboard,
  Refresh,
  AccessTime,
  AutoAwesome
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { motion, useScroll, useSpring } from 'framer-motion';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TextField from '@mui/material/TextField';
import { courseService, ICourse } from '../../services/courseService';
import { weekService, Week, WeekMaterial } from '../../services/weekService';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import { assignmentService, Assignment as AssignmentType } from '../../services/assignmentService';
import api from '../../services/api';
import LiveSessionStatus from '../../components/Student/LiveSessionStatus';
import { useLocation } from 'react-router-dom';
import { liveSessionService } from '../../services/liveSessionService';
import { recordedSessionService } from '../../services/recordedSessionService';
import { 
  aiAssessmentOrganizerService, 
  OrganizedAssessment, 
  AssessmentOrganizationRequest 
} from '../../services/aiAssessmentOrganizerService';

// Interface for the actual backend response
interface CourseProgressResponse {
  weekProgresses: any[];
  materialProgresses: any[];
}

// Countdown timer component
interface CountdownTimerProps {
  dueDate: string;
  onTimeReached?: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ dueDate, onTimeReached }) => {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const due = new Date(dueDate).getTime();
      const difference = due - now;

      if (difference <= 0) {
        setIsExpired(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        if (onTimeReached) {
          onTimeReached();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
      setIsExpired(false);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [dueDate, onTimeReached]);

  if (isExpired) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTime color="error" sx={{ fontSize: { xs: 16, sm: 18 } }} />
        <Typography 
          variant="caption" 
          color="error"
          sx={{ 
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            fontWeight: 'bold'
          }}
        >
          Assessment Available Now
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AccessTime color="primary" sx={{ fontSize: { xs: 16, sm: 18 } }} />
      <Typography 
        variant="caption" 
        color="text.secondary"
        sx={{ 
          fontSize: { xs: '0.7rem', sm: '0.75rem' }
        }}
      >
        Available in: {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m {timeLeft.seconds}s
      </Typography>
    </Box>
  );
};

const UnifiedLearningPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Scroll progress for modern feel
  const { scrollYProgress } = useScroll();
  const progressSpring = useSpring(scrollYProgress, { stiffness: 120, damping: 20, mass: 0.2 });

  const [course, setCourse] = useState<ICourse | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [progress, setProgress] = useState<CourseProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);
  const [availableAssessments, setAvailableAssessments] = useState<Set<string>>(new Set());
  const [unseenRecordings, setUnseenRecordings] = useState<number>(0);
  const [organizingAssessment, setOrganizingAssessment] = useState<Set<string>>(new Set());
  const [organizationProgress, setOrganizationProgress] = useState<Record<string, string>>({});
  // Improve organization: collapse/expand weeks
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set());
  // AI assistant state
  const [aiOpen, setAiOpen] = useState<boolean>(false);
  // Materials quick filter
  const [materialFilter, setMaterialFilter] = useState<'all' | 'required' | 'completed' | 'video' | 'document'>('all');
  const liveSectionRef = React.useRef<HTMLDivElement | null>(null);

  // Local helper types and utilities for organizing assessment questions in fallback
  type SimpleSection = {
    id: string;
    title: string;
    description?: string;
    questions: any[];
    instructions?: string;
    timeAllocation?: number;
  };

  const organizeQuestionsIntoSections = (questions: any[]): SimpleSection[] => {
    const sectionMap = new Map<string, any[]>();
    (questions || []).forEach((q: any) => {
      const key = q?.section || 'A';
      if (!sectionMap.has(key)) sectionMap.set(key, []);
      sectionMap.get(key)!.push(q);
    });
    const instructionsByKey: Record<string, string> = {
      A: 'Choose the best answer for each question.',
      B: 'Provide concise answers and show your work when applicable.',
      C: 'Write detailed responses supported by examples.'
    };
    return Array.from(sectionMap.entries()).map(([key, qs]) => ({
      id: key,
      title: `Section ${key}`,
      description: `Section ${key} with ${qs.length} questions`,
      questions: qs,
      instructions: instructionsByKey[key] || 'Answer all questions in this section.'
    }));
  };

  const loadCourseData = async () => {
    if (!courseId) {
      setError('No course ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Load course, weeks, progress, announcements, live sessions, assessments, and assignments in parallel
      const [courseData, weeksData, progressResponse, announcementsResponse, liveSessionsResponse, assessmentsResponse, assignmentsResponse] = await Promise.all([
        courseService.getCourseById(courseId),
        weekService.getCourseWeeks(courseId),
        api.get(`/progress/courses/${courseId}/progress`).catch((error) => {
          console.warn('Progress API failed, using empty progress:', error);
          return { data: { data: { weekProgresses: [], materialProgresses: [] } } };
        }),
        // Fetch announcements for the course
        api.get(`/announcements/course/${courseId}`).catch((error) => {
          console.warn('Announcements API not available:', error.message);
          return { data: { data: [] } };
        }),
        // Fetch live sessions for the course
        api.get(`/live-sessions/course/${courseId}`).catch((error) => {
          console.warn('Live sessions API not available:', error.message);
          return { data: { data: [] } };
        }),
        // Fetch assessments for the course
        assessmentService.getCourseAssessments(courseId).catch((error) => {
          console.warn('Assessments API not available:', error.message);
          return [];
        }),
        // Fetch assignments for the course
        assignmentService.getCourseAssignments(courseId).catch((error) => {
          console.warn('Assignments API not available:', error.message);
          return [];
        })
      ]);
      
      setCourse(courseData);
      setWeeks(weeksData);
      setProgress(progressResponse.data.data || { weekProgresses: [], materialProgresses: [] });
      
      setAssessments(Array.isArray(assessmentsResponse) ? assessmentsResponse : []);
      setAssignments(Array.isArray(assignmentsResponse) ? assignmentsResponse : []);
      
      console.log('📊 Loaded assessments:', assessmentsResponse);
      console.log('📊 Loaded assignments:', assignmentsResponse);
      
      // Handle announcements - use real API data
      const announcementsData = announcementsResponse.data?.data || [];
      console.log('📢 Loaded announcements:', announcementsData.length, announcementsData);
      setAnnouncements(announcementsData);
      
      // Process live sessions for upcoming events - normalize API shape, with service fallback
      let sessionsData = liveSessionsResponse?.data?.data?.sessions
        || liveSessionsResponse?.data?.sessions
        || liveSessionsResponse?.data
        || [];

      if (!Array.isArray(sessionsData)) {
        sessionsData = [];
      }

      if (sessionsData.length === 0) {
        try {
          const serviceSessions = await liveSessionService.getCourseSessions(courseId);
          if (Array.isArray(serviceSessions)) {
            sessionsData = serviceSessions;
          }
        } catch (e) {
          console.warn('Fallback to liveSessionService failed:', e);
        }
      }

      const upcomingSessions = sessionsData
        .filter((session: any) => {
          const sessionDate = new Date(session.scheduledTime);
          const now = new Date();
          return sessionDate > now;
        })
        .sort((a: any, b: any) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
        .slice(0, 5);
      setUpcomingEvents(upcomingSessions);

      // Compute unseen recorded sessions using client-side lastSeen marker
      try {
        const recRes = await recordedSessionService.getRecordedSessionsForStudents(courseId);
        const recordings = Array.isArray(recRes?.data) ? recRes.data : (Array.isArray(recRes) ? recRes : []);
        const lastSeenKey = `course:${courseId}:recordingsLastSeen`;
        const lastSeenStr = localStorage.getItem(lastSeenKey);
        const lastSeen = lastSeenStr ? new Date(lastSeenStr).getTime() : 0;
        const unseen = (recordings || []).filter((r: any) => new Date(r.uploadDate).getTime() > lastSeen).length;
        setUnseenRecordings(unseen);
      } catch (e) {
        setUnseenRecordings(0);
      }
    } catch (err: any) {
      console.error('Error loading course data:', err);
      setError(err.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  // Expand the first week by default after weeks load
  useEffect(() => {
    if (weeks && weeks.length > 0) {
      setExpandedWeeks(new Set([weeks[0]._id]));
    }
  }, [weeks]);

  // Scroll to live section when navigated with ?section=live
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section === 'live' && liveSectionRef.current) {
      setTimeout(() => {
        liveSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
  }, [location.search, upcomingEvents.length]);

  // Handle mobile sidebar
  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  const handleBack = () => {
    navigate('/dashboard/student/courses');
  };

  const handleGoToLiveSessions = () => {
    if (courseId) {
      localStorage.setItem(`course:${courseId}:recordingsLastSeen`, new Date().toISOString());
      setUnseenRecordings(0);
    }
    navigate(`/dashboard/student/course/${courseId}/live-sessions`);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard/student');
  };

  const handleMaterialClick = (material: WeekMaterial) => {
    navigate(`/material/${courseId}/${material._id}`);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleWeekExpanded = (weekId: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekId)) next.delete(weekId); else next.add(weekId);
      return next;
    });
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <Description />;
      case 'video':
        return <VideoFile />;
      case 'audio':
        return <AudioFile />;
      case 'quiz':
        return <Quiz />;
      case 'assignment':
        return <AssignmentIcon />;
      default:
        return <Description />;
    }
  };

  const isMaterialCompleted = (materialId: string) => {
    return progress?.materialProgresses?.some((mp: any) => mp.materialId === materialId && mp.status === 'completed') || false;
  };

  const getMaterialProgressPct = (materialId: string): number => {
    const mp = progress?.materialProgresses?.find((m: any) => m.materialId === materialId);
    if (!mp) return 0;
    const pct = typeof mp.progressPercentage === 'number' ? mp.progressPercentage
      : typeof mp.progress === 'number' ? mp.progress
      : mp.status === 'completed' ? 100 : 0;
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    return Number.isFinite(clamped) ? clamped : 0;
  };

  const getWeekProgress = (weekId: string) => {
    // For now, return a simple calculation based on completed materials
    const week = weeks.find(w => w._id === weekId);
    if (!week) return 0;
    
    // Only count published materials
    const publishedMaterials = week.materials.filter(mat => mat.isPublished);
    const completedMaterials = publishedMaterials.filter(mat => isMaterialCompleted(mat._id));
    return publishedMaterials.length > 0 ? (completedMaterials.length / publishedMaterials.length) * 100 : 0;
  };

  const handleMarkComplete = async (weekId: string, materialId: string) => {
    try {
      await api.post(`/progress/weeks/${weekId}/materials/${materialId}/complete`, { timeSpent: 5 });
      // Refresh progress data
      const progressResponse = await api.get(`/progress/courses/${courseId}/progress`);
      setProgress(progressResponse.data.data || { weekProgresses: [], materialProgresses: [] });
    } catch (err) {
      console.error('Error marking material complete:', err);
    }
  };

  const isAssessmentAvailable = (assessment: IAssessment) => {
    if (!assessment.dueDate) return true; // If no due date, always available
    return new Date(assessment.dueDate).getTime() <= new Date().getTime();
  };

  const handleAssessmentTimeReached = (assessmentId: string) => {
    setAvailableAssessments(prev => {
      const newSet = new Set<string>();
      prev.forEach(id => newSet.add(id));
      newSet.add(assessmentId);
      return newSet;
    });
  };

  const handleTakeAssessment = async (assessmentId: string) => {
    const assessment = assessments.find(a => a._id === assessmentId);
    if (!assessment || !isAssessmentAvailable(assessment)) {
      return;
    }

    try {
      // Show loading state for this specific assessment
      setOrganizingAssessment(prev => new Set(prev).add(assessmentId));
      setOrganizationProgress(prev => ({ ...prev, [assessmentId]: 'Initializing...' }));
      
      console.log('🤖 Starting AI assessment organization for:', assessment.title);
      
      // Check if we have a cached organized assessment first
      setOrganizationProgress(prev => ({ ...prev, [assessmentId]: 'Checking cache...' }));
      let organizedAssessment = await aiAssessmentOrganizerService.getCachedOrganizedAssessment(assessmentId);
      
      if (organizedAssessment) {
        console.log('📦 Using cached organized assessment');
        setOrganizationProgress(prev => ({ ...prev, [assessmentId]: 'Loading cached assessment...' }));
        // Navigate immediately with cached data
        navigate(`/assessment/${assessmentId}/take`, { 
          state: { 
            organizedAssessment,
            fromUnifiedLearning: true 
          } 
        });
        return;
      }
      
      // If no cache, show progress indication and organize with AI
      console.log('🔄 Organizing assessment with AI - this may take up to 30 seconds...');
      setOrganizationProgress(prev => ({ ...prev, [assessmentId]: 'Analyzing questions...' }));
      
      // Create organization request with available context
      const organizationRequest: AssessmentOrganizationRequest = {
        assessmentId,
        courseContext: {
          courseTitle: course?.title,
          currentWeek: getCurrentWeekNumber(),
          completedTopics: getCompletedTopics()
        },
        studentProfile: {
          preferredLearningStyle: (user && (user as unknown as { preferences?: { learningStyle?: string } }).preferences?.learningStyle) || 'visual',
          // Add more student profile data if available
        }
      };

      // Set a timeout to prevent indefinite waiting
      const organizationPromise = Promise.resolve().then(async () => {
        setOrganizationProgress(prev => ({ ...prev, [assessmentId]: 'AI analyzing questions...' }));
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate progress
        
        setOrganizationProgress(prev => ({ ...prev, [assessmentId]: 'Creating sections...' }));
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate progress
        
        setOrganizationProgress(prev => ({ ...prev, [assessmentId]: 'Generating study tips...' }));
        const result = await aiAssessmentOrganizerService.organizeAssessment(organizationRequest);
        
        setOrganizationProgress(prev => ({ ...prev, [assessmentId]: 'Finalizing...' }));
        return result;
      });
      
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('AI organization timeout')), 45000); // 45 second timeout
      });

      try {
        // Race between AI organization and timeout
        organizedAssessment = await Promise.race([organizationPromise, timeoutPromise]);
        
        if (organizedAssessment) {
          // Cache the organized assessment for future use
          aiAssessmentOrganizerService.cacheOrganizedAssessment(organizedAssessment);
          console.log('✅ Assessment organization complete: AI Enhanced');
          setOrganizationProgress(prev => ({ ...prev, [assessmentId]: 'Ready to start!' }));
        } else {
          throw new Error('Organization returned null');
        }
        
      } catch (timeoutError) {
        console.warn('⏰ AI organization taking too long, proceeding with fallback');
        setOrganizationProgress(prev => ({ ...prev, [assessmentId]: 'Creating fallback...' }));
        throw timeoutError;
      }
      
      // Navigate to assessment with organized data
      navigate(`/assessment/${assessmentId}/take`, { 
        state: { 
          organizedAssessment,
          fromUnifiedLearning: true 
        } 
      });
      
    } catch (error) {
      console.error('❌ Error organizing assessment:', error);
      
      // Create a quick fallback organized assessment to maintain enhanced UI
      try {
        console.log('🔄 Creating fallback enhanced assessment...');
        const basicAssessment = await assessmentService.getAssessmentById(assessmentId);
        const fallbackOrganizedAssessment = await createQuickFallbackOrganization(basicAssessment);
        
        console.log('✅ Using fallback enhanced assessment');
        navigate(`/assessment/${assessmentId}/take`, { 
          state: { 
            organizedAssessment: fallbackOrganizedAssessment,
            fromUnifiedLearning: true 
          } 
        });
        
      } catch (fallbackError) {
        console.error('❌ Fallback also failed, proceeding with standard assessment');
        navigate(`/assessment/${assessmentId}/take`);
      }
      
    } finally {
      // Remove loading state
      setOrganizingAssessment(prev => {
        const newSet = new Set(prev);
        newSet.delete(assessmentId);
        return newSet;
      });
    }
  };

  // Create a quick fallback organization when AI fails
  const createQuickFallbackOrganization = async (assessment: IAssessment): Promise<OrganizedAssessment> => {
    // Group questions into logical sections
    const sections = organizeQuestionsIntoSections(assessment.questions).map(section => ({
      id: section.id,
      title: section.title,
      description: section.description || `Section with ${section.questions.length} questions`,
      questions: section.questions,
      timeAllocation: Math.ceil(section.questions.length * 2), // 2 minutes per question
      difficulty: 'medium' as const,
      instructions: section.instructions || 'Answer all questions in this section carefully.',
      objectives: [`Complete ${section.questions.length} questions in this section`],
      suggestedApproach: 'Read each question carefully and select the best answer.'
    }));

    const totalQuestions = assessment.questions.length;
    const estimatedTime = Math.ceil(totalQuestions * 2); // 2 minutes per question

    return {
      originalAssessment: assessment,
      aiOrganized: false, // Mark as fallback, not AI-organized
      organizationTimestamp: new Date().toISOString(),
      sections,
      overallInstructions: 'This assessment has been organized to help you succeed. Take your time and read each question carefully.',
      studyRecommendations: [
        'Review course materials before starting',
        'Read each question carefully before answering',
        'Manage your time effectively across all sections',
        'Double-check your answers before submitting'
      ],
      timeManagementTips: [
        `You have approximately ${Math.ceil(estimatedTime / totalQuestions)} minutes per question`,
        'Start with questions you find easier',
        'Don\'t spend too long on any single question',
        'Save time for review at the end'
      ],
      difficultyAnalysis: {
        easy: Math.floor(totalQuestions * 0.3),
        medium: Math.floor(totalQuestions * 0.5),
        hard: Math.ceil(totalQuestions * 0.2)
      },
      estimatedCompletionTime: estimatedTime,
      aiInsights: {
        strengths: ['Systematic question organization', 'Clear section structure'],
        challenges: ['Time management', 'Question complexity'],
        preparationTips: [
          'Review your course notes',
          'Practice similar question types',
          'Ensure you have a quiet environment'
        ]
      }
    };
  };

  const getCurrentWeekNumber = (): number => {
    // Calculate current week based on course start date or progress
    const completedWeeks = weeks.filter(week => getWeekProgress(week._id) === 100).length;
    return completedWeeks + 1;
  };

  const getCompletedTopics = (): string[] => {
    // Extract completed topics from completed materials
    const completedMaterials = weeks
      .flatMap(week => week.materials)
      .filter(material => isMaterialCompleted(material._id));
    
    return completedMaterials.map(material => material.title || material.type).slice(0, 10);
  };

  const handleTakeAssignment = (assignmentId: string) => {
    // Use the correct assignment taking route within the dashboard
    navigate(`/dashboard/student/assignment/${assignmentId}`);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Please log in to access this course.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading course...
            </Typography>
        </Container>
    );
  }

  if (error) {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Back to Courses
        </Button>
        </Container>
    );
  }

  if (!course) {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Course not found.
          </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Back to Courses
        </Button>
        </Container>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      {/* Animated background gradient */}
      <motion.div
        aria-hidden
        initial={{ backgroundPosition: '0% 50%' }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(120deg, #f7f9ff 0%, #eef2ff 35%, #fdf2f8 70%, #eef2ff 100%)',
          backgroundSize: '200% 200%'
        }}
      />
      {/* Subtle grid overlay */}
      <Box aria-hidden sx={{ position: 'fixed', inset: 0, zIndex: 1, backgroundImage: 'radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
      {/* Scroll progress bar */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 30, pt: 0.25, px: 0.5 }}>
        <Box sx={{ height: 3, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <motion.div style={{ scaleX: progressSpring, height: 3, transformOrigin: '0 0', backgroundImage: 'linear-gradient(90deg,#6366f1,#a855f7,#06b6d4)', backgroundSize: '200% 100%' }} />
        </Box>
      </Box>
      {/* Top App Bar */}
      <AppBar position="sticky" sx={{ backgroundColor: 'white', color: 'text.primary', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 5 }}>
        <Toolbar sx={{ 
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1, sm: 2 }
        }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ 
              mr: { xs: 1, sm: 2 },
              p: { xs: 1, sm: 1.5 }
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography 
              variant="h6" 
              noWrap
              sx={{ 
                fontSize: { xs: '1rem', sm: '1.25rem' },
                fontWeight: 'bold'
              }}
            >
              {course?.title || 'Learning'}
            </Typography>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 }
          }}>
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              onClick={handleGoToLiveSessions}
              sx={{
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                px: { xs: 1, sm: 2 },
                py: { xs: 0.5, sm: 1 },
                minWidth: { xs: 'auto', sm: 'auto' },
                '& .MuiButton-startIcon': {
                  mr: { xs: 0.5, sm: 1 }
                }
              }}
            >
              <Badge badgeContent={unseenRecordings} color="error" overlap="circular" invisible={unseenRecordings === 0}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Live Sessions
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Live
                </Box>
              </Badge>
            </Button>
            
            <IconButton
              color="inherit"
              onClick={handleGoToDashboard}
              sx={{ 
                p: { xs: 1, sm: 1.5 },
                display: { xs: 'none', sm: 'flex' }
              }}
            >
              <Dashboard />
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={() => {
                // Reload course data
                if (courseId) {
                  loadCourseData();
                }
              }}
              sx={{ 
                p: { xs: 1, sm: 1.5 }
              }}
              title="Refresh Data"
            >
              <Refresh />
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={toggleSidebar}
              sx={{ 
                p: { xs: 1, sm: 1.5 }
              }}
            >
              <Menu />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Live Session Status */}
      <Box sx={{
        // Keep full width, but offset for persistent sidebar on desktop
        ml: { xs: 0, sm: 0, md: sidebarOpen ? '320px' : 0 },
        transition: 'margin-left 200ms ease',
      }}>
        <Box component={motion.div} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <LiveSessionStatus courseId={courseId!} fullWidth />
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <Drawer
          variant={isMobile ? "temporary" : "persistent"}
          open={sidebarOpen}
          onClose={toggleSidebar}
          sx={{
            width: { xs: 280, sm: 320 },
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: { xs: 280, sm: 320 },
              boxSizing: 'border-box',
              backgroundColor: 'grey.50',
              borderRight: '1px solid',
              borderColor: 'divider',
              // Mobile optimizations
              '@media (max-width: 600px)': {
                width: '100vw',
                maxWidth: '320px'
              }
            },
          }}
        >
          <Box sx={{ 
            p: { xs: 1.5, sm: 2 }, 
            height: '100%', 
            overflow: 'auto',
            // Mobile scroll optimizations
            '@media (max-width: 600px)': {
              padding: 1
            }
          }}>
            {/* Course Info */}
            <Card component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} sx={{ 
              mb: { xs: 1.5, sm: 2 }, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white' 
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  {course?.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    opacity: 0.9, 
                    mb: 2,
                    fontSize: { xs: '0.8rem', sm: '0.875rem' },
                    lineHeight: 1.4
                  }}
                >
                  {course?.description}
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 0.5, sm: 1 }, 
                  flexWrap: 'wrap' 
                }}>
                  <Chip
                    icon={<School />}
                    label={`${weeks.length} Weeks`}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      height: { xs: 24, sm: 28 }
                    }}
                  />
                  <Chip
                    icon={<Timer />}
                    label={`${weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).reduce((sum, mat) => sum + mat.estimatedDuration, 0), 0)} min`}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      height: { xs: 24, sm: 28 }
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Course Progress Overview */}
            {progress && (
              <Card component={motion.div} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
                <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      fontSize: { xs: '0.9rem', sm: '1.25rem' },
                      fontWeight: 'bold'
                    }}
                  >
                    <TrendingUp />
                    Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={progress.materialProgresses?.length > 0 ?
                      (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length /
                        weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0}
                    sx={{ 
                      height: { xs: 6, sm: 8 }, 
                      borderRadius: 4, 
                      mb: 1 
                    }}
                  />
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    {Math.round(progress.materialProgresses?.length > 0 ?
                      (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length /
                        weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0)}% Complete
                  </Typography>
                </CardContent>
              </Card>
            )}

            {/* Announcements */}
            <Card component={motion.div} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} sx={{ mb: { xs: 1.5, sm: 2 } }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '0.9rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  <Announcement />
                  Announcements
                </Typography>
                {announcements.length === 0 ? (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontStyle: 'italic',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    No announcements yet
                  </Typography>
                ) : (
                  <List dense>
                    {announcements.slice(0, 3).map((announcement, index) => (
                      <ListItem key={announcement._id || index} sx={{ px: 0, py: { xs: 0.5, sm: 1 } }}>
                        <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}>
                          <Announcement 
                            color={
                              announcement.priority === 'urgent' ? 'error' :
                              announcement.priority === 'high' ? 'error' :
                              announcement.priority === 'medium' ? 'warning' :
                              'primary'
                            } 
                            sx={{ fontSize: { xs: 18, sm: 24 } }} 
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {announcement.title}
                              </Typography>
                              {announcement.priority && (
                                <Chip
                                  label={announcement.priority}
                                  size="small"
                                  sx={{
                                    fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                    height: { xs: 16, sm: 18 },
                                    mt: 0.5,
                                    color: announcement.priority === 'urgent' || announcement.priority === 'high' ? 'white' : 'inherit',
                                    backgroundColor: 
                                      announcement.priority === 'urgent' ? 'error.main' :
                                      announcement.priority === 'high' ? 'error.main' :
                                      announcement.priority === 'medium' ? 'warning.main' :
                                      'grey.300'
                                  }}
                                />
                              )}
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography 
                                variant="caption"
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  display: 'block',
                                  mb: 0.5
                                }}
                              >
                                {announcement.content}
                              </Typography>
                              {announcement.createdAt && (
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary"
                                  sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' } }}
                                >
                                  {new Date(announcement.createdAt).toLocaleDateString()}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card ref={liveSectionRef} sx={{ mb: { xs: 1.5, sm: 2 } }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '0.9rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  <Event />
                  Upcoming Events
                  <Badge badgeContent={unseenRecordings} color="error" sx={{ ml: 1 }} invisible={unseenRecordings === 0}>
                    <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                      {unseenRecordings > 0 ? 'New recordings' : ''}
                    </Typography>
                  </Badge>
                </Typography>
                {upcomingEvents.length === 0 ? (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontStyle: 'italic',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}
                  >
                    No upcoming events
                  </Typography>
                ) : (
                  <List dense>
                    {upcomingEvents.map((event, index) => (
                      <ListItem key={event._id || index} sx={{ px: 0, py: { xs: 0.5, sm: 1 } }}>
                        <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}>
                          <VideoCall color="secondary" sx={{ fontSize: { xs: 18, sm: 24 } }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box>
                              <Typography 
                                variant="body2" 
                                fontWeight="bold"
                                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                              >
                                {event.title}
                              </Typography>
                              {event.description && (
                                <Typography 
                                  variant="caption"
                                  sx={{ 
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    display: 'block',
                                    opacity: 0.8
                                  }}
                                >
                                  {event.description}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={new Date(event.scheduledTime).toLocaleString()}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                {unseenRecordings > 0 && (
                  <Box sx={{ mt: 2, p: { xs: 1, sm: 1.5 }, bgcolor: 'rgba(255, 99, 71, 0.06)', borderRadius: 1, border: '1px solid', borderColor: 'error.light' }}>
                    <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Badge badgeContent={unseenRecordings} color="error">
                        <VideoCall color="error" sx={{ mr: 0.5 }} />
                      </Badge>
                      New recorded session{unseenRecordings > 1 ? 's' : ''} available
                    </Typography>
                    <Button size="small" variant="contained" color="error" onClick={handleGoToLiveSessions}>
                      View recordings
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card component={motion.div} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '0.9rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  <Schedule />
                  Quick Actions
                </Typography>
                <Stack spacing={{ xs: 0.5, sm: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<VideoCall />}
                    onClick={handleGoToLiveSessions}
                    fullWidth
                    size="small"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      py: { xs: 0.5, sm: 1 },
                      '& .MuiButton-startIcon': {
                        mr: { xs: 0.5, sm: 1 }
                      }
                    }}
                  >
                    Join Live Session
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Dashboard />}
                    onClick={handleGoToDashboard}
                    fullWidth
                    size="small"
                    sx={{
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      py: { xs: 0.5, sm: 1 },
                      '& .MuiButton-startIcon': {
                        mr: { xs: 0.5, sm: 1 }
                      }
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 3 },
            backgroundColor: 'grey.50',
            minHeight: 'calc(100vh - 64px)',
            position: 'relative',
            zIndex: 5,
            // Mobile optimizations
            '@media (max-width: 600px)': {
              p: 1
            }
          }}
        >
          <Container maxWidth="lg" sx={{ p: 0 }}>
          {/* Hero header with key actions */}
          <Card component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} sx={{ mb: { xs: 2, sm: 3 }, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.2, backgroundImage: 'linear-gradient(90deg,#6366f1,#a855f7)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                    {course?.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Jump back in or explore assessments and assignments curated for you.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                    <Button variant="contained" onClick={() => navigate(`/dashboard/student/course/${courseId}/weeks`)} sx={{ textTransform: 'none' }}>Open Course Plan</Button>
                    <Button variant="outlined" onClick={() => liveSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} sx={{ textTransform: 'none' }}>Upcoming Events</Button>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          {/* Section quick nav */}
          <Stack direction="row" spacing={1} sx={{ mb: { xs: 1.5, sm: 2 } }}>
            <Chip clickable label="Assessments" onClick={() => document.getElementById('assessments-section')?.scrollIntoView({ behavior: 'smooth' })} />
            <Chip clickable label="Assignments" onClick={() => document.getElementById('assignments-section')?.scrollIntoView({ behavior: 'smooth' })} />
            <Chip clickable label="Weeks" onClick={() => document.getElementById('weeks-section')?.scrollIntoView({ behavior: 'smooth' })} />
          </Stack>
          {/* Course Progress Overview */}
          {progress && (
            <Card sx={{ mb: { xs: 2, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  <TrendingUp />
                  Course Progress
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={progress.materialProgresses?.length > 0 ?
                    (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length /
                      weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0}
                  sx={{ 
                    height: { xs: 6, sm: 8 }, 
                    borderRadius: 4, 
                    mb: 1 
                  }}
                />
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '0.875rem' }
                  }}
                >
                  {Math.round(progress.materialProgresses?.length > 0 ?
                    (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length /
                      weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0)}% Complete
                </Typography>
              </CardContent>
            </Card>
          )}



          {/* Assessments Section */}
          {assessments.length > 0 && (
            <Card id="assessments-section" component={motion.div} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  <Quiz />
                  Assessments
                </Typography>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  {assessments.map((assessment) => (
                    <Grid item xs={12} sm={6} md={4} key={assessment._id}>
                      <Card 
                        sx={{ 
                          cursor: organizingAssessment.has(assessment._id) ? 'wait' : 'pointer',
                          transition: 'all 0.3s ease',
                          opacity: organizingAssessment.has(assessment._id) ? 0.8 : 1,
                          '&:hover': {
                            transform: organizingAssessment.has(assessment._id) ? 'none' : 'translateY(-2px)',
                            boxShadow: organizingAssessment.has(assessment._id) ? 1 : 4
                          },
                          position: 'relative'
                        }}
                        onClick={() => !organizingAssessment.has(assessment._id) && handleTakeAssessment(assessment._id)}
                      >
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Quiz color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            <Typography 
                              variant="subtitle1" 
                              fontWeight="bold"
                              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                            >
                              {assessment.title}
                            </Typography>
                          </Box>
                          
                          {/* AI Organization Status */}
                          {organizingAssessment.has(assessment._id) && (
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: 'column',
                              gap: 1, 
                              mb: 1, 
                              p: 1.5, 
                              backgroundColor: 'rgba(25, 118, 210, 0.1)', 
                              borderRadius: 1,
                              border: '1px solid rgba(25, 118, 210, 0.2)'
                            }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography 
                                  variant="caption" 
                                  color="primary"
                                  fontWeight="medium"
                                  sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                                >
                                  AI is enhancing your assessment...
                                </Typography>
                              </Box>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                  fontStyle: 'italic'
                                }}
                              >
                                • Analyzing questions and organizing sections<br/>
                                • Creating personalized study tips<br/>
                                • Optimizing difficulty progression<br/>
                                <strong>This may take up to 45 seconds...</strong>
                              </Typography>
                            </Box>
                          )}
                          
                          {/* AI Enhancement Indicator */}
                          {!organizingAssessment.has(assessment._id) && (
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 0.5, 
                              mb: 1 
                            }}>
                              <AutoAwesome sx={{ fontSize: 14, color: 'primary.main' }} />
                              <Typography 
                                variant="caption" 
                                color="primary"
                                sx={{ 
                                  fontSize: { xs: '0.65rem', sm: '0.7rem' },
                                  fontWeight: 'medium'
                                }}
                              >
                                AI-Enhanced Assessment
                              </Typography>
                            </Box>
                          )}
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {assessment.description || 'No description available'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={`${assessment.totalQuestions} Questions`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                            <Chip
                              label={`${assessment.totalPoints} Points`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                            {assessment.timeLimit && (
                              <Chip
                                label={`${assessment.timeLimit} min`}
                                size="small"
                                color="warning"
                                variant="outlined"
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                              />
                            )}
                          </Box>
                          {assessment.dueDate && (
                            <Box sx={{ mt: 1 }}>
                              <CountdownTimer 
                                dueDate={assessment.dueDate}
                                onTimeReached={() => handleAssessmentTimeReached(assessment._id)}
                              />
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  display: 'block',
                                  mt: 0.5
                                }}
                              >
                                Due: {new Date(assessment.dueDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              startIcon={isAssessmentAvailable(assessment) ? <Quiz /> : <Lock />}
                              disabled={!isAssessmentAvailable(assessment)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTakeAssessment(assessment._id);
                              }}
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                px: 2
                              }}
                            >
                              {isAssessmentAvailable(assessment) ? 'Take Assessment' : 'Assessment Locked'}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Assignments Section */}
          {assignments.length > 0 && (
            <Card id="assignments-section" component={motion.div} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    fontSize: { xs: '1rem', sm: '1.25rem' },
                    fontWeight: 'bold'
                  }}
                >
                  <AssignmentIcon />
                  Assignments
                </Typography>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  {assignments.map((assignment) => (
                    <Grid item xs={12} sm={6} md={4} key={assignment._id}>
                      <Card 
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 4
                          }
                        }}
                        onClick={() => handleTakeAssignment(assignment._id)}
                      >
                        <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AssignmentIcon color="warning" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            <Typography 
                              variant="subtitle1" 
                              fontWeight="bold"
                              sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                            >
                              {assignment.title}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.75rem', sm: '0.875rem' },
                              mb: 1,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {assignment.description || 'No description available'}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={`${assignment.maxPoints} Points`}
                              size="small"
                              color="warning"
                              variant="outlined"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                            <Chip
                              label={assignment.submissionType}
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                            <Chip
                              label={assignment.status}
                              size="small"
                              color={assignment.status === 'published' ? 'success' : 'default'}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            />
                          </Box>
                          {assignment.dueDate && (
                            <Typography 
                              variant="caption" 
                              color="text.secondary"
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                display: 'block',
                                mt: 1
                              }}
                            >
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Weeks and Materials */}
          {weeks.length === 0 ? (
            <Card>
              <CardContent sx={{ 
                textAlign: 'center', 
                py: { xs: 3, sm: 4 },
                px: { xs: 2, sm: 3 }
              }}>
                <Typography 
                  variant="h6" 
                  color="text.secondary" 
                  gutterBottom
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  No course content available yet
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ 
                    fontSize: { xs: '0.875rem', sm: '0.875rem' }
                  }}
                >
                  The instructor hasn't added any materials to this course.
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <>
            {/* Materials filter chips */}
            <Stack direction="row" spacing={1} sx={{ mb: { xs: 1.5, sm: 2 }, flexWrap: 'wrap' }}>
              <Chip clickable color={materialFilter === 'all' ? 'primary' : 'default'} label="All" onClick={() => setMaterialFilter('all')} />
              <Chip clickable color={materialFilter === 'required' ? 'primary' : 'default'} label="Required" onClick={() => setMaterialFilter('required')} />
              <Chip clickable color={materialFilter === 'completed' ? 'primary' : 'default'} label="Completed" onClick={() => setMaterialFilter('completed')} />
              <Chip clickable color={materialFilter === 'video' ? 'primary' : 'default'} label="Videos" onClick={() => setMaterialFilter('video')} />
              <Chip clickable color={materialFilter === 'document' ? 'primary' : 'default'} label="Documents" onClick={() => setMaterialFilter('document')} />
            </Stack>
            <Grid id="weeks-section" container spacing={{ xs: 2, sm: 3 }}>
              {weeks.map((week, index) => (
                <Grid item xs={12} key={week._id}>
                  <Card component={motion.div} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} sx={{
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: { xs: 'none', sm: 'translateY(-2px)' },
                      boxShadow: { xs: 2, sm: 4 }
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        mb: 2,
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: { xs: 2, sm: 0 }
                      }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography 
                            variant="h6" 
                            gutterBottom
                            sx={{ 
                              fontSize: { xs: '1rem', sm: '1.25rem' },
                              fontWeight: 'bold'
                            }}
                          >
                            {week.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            paragraph
                            sx={{ 
                              fontSize: { xs: '0.875rem', sm: '0.875rem' },
                              mb: { xs: 1.5, sm: 2 }
                            }}
                          >
                            {week.description}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            gap: { xs: 0.5, sm: 1 }, 
                            flexWrap: 'wrap', 
                            mb: 2 
                          }}>
                            <Chip
                              label={`${week.materials.filter(mat => mat.isPublished).length} Materials`}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                height: { xs: 24, sm: 28 }
                              }}
                            />
                            <Chip
                              label={`${week.materials.filter(mat => mat.isPublished).reduce((sum, mat) => sum + mat.estimatedDuration, 0)} min`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ 
                                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                height: { xs: 24, sm: 28 }
                              }}
                            />
                            {week.isPublished ? (
                              <Chip 
                                label="Published" 
                                size="small" 
                                color="success"
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  height: { xs: 24, sm: 28 }
                                }}
                              />
                            ) : (
                              <Chip 
                                label="Draft" 
                                size="small" 
                                color="warning"
                                sx={{ 
                                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                  height: { xs: 24, sm: 28 }
                                }}
                              />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ 
                          textAlign: { xs: 'left', sm: 'right' },
                          alignSelf: { xs: 'flex-start', sm: 'auto' }
                        }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.75rem', sm: '0.875rem' }
                            }}
                          >
                            Progress
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={getWeekProgress(week._id)}
                            sx={{ 
                              width: { xs: 80, sm: 100 }, 
                              height: { xs: 4, sm: 6 }, 
                              borderRadius: 3 
                            }}
                          />
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ 
                              fontSize: { xs: '0.7rem', sm: '0.75rem' }
                            }}
                          >
                            {Math.round(getWeekProgress(week._id))}%
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => toggleWeekExpanded(week._id)}
                              sx={{ textTransform: 'none' }}
                            >
                              {expandedWeeks.has(week._id) ? 'Hide Content' : 'Show Content'}
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                      
                      {/* Materials List */}
                      {expandedWeeks.has(week._id) && (week.materials.filter(mat => mat.isPublished).length === 0 ? (
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          sx={{ 
                            fontStyle: 'italic',
                            fontSize: { xs: '0.875rem', sm: '0.875rem' }
                          }}
                        >
                          {week.materials.length === 0 ? 'No materials added to this week yet.' : 'No published materials available yet.'}
                        </Typography>
                      ) : (
                        <List>
                          {week.materials
                            .filter(mat => mat.isPublished)
                            .filter(material => {
                              if (materialFilter === 'all') return true;
                              if (materialFilter === 'required') return material.isRequired;
                              if (materialFilter === 'completed') return isMaterialCompleted(material._id);
                              if (materialFilter === 'video') return material.type === 'video';
                              if (materialFilter === 'document') return material.type === 'document';
                              return true;
                            })
                            .map((material, matIndex) => {
                            const isCompleted = isMaterialCompleted(material._id);
                            return (
                              <React.Fragment key={material._id}>
                                <ListItem
                                  sx={{
                                    backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                    borderRadius: 1,
                                    mb: 1,
                                    border: isCompleted ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid transparent',
                                    cursor: 'pointer',
                                    px: { xs: 1, sm: 2 },
                                    py: { xs: 1, sm: 1.5 },
                                      '&:hover': {
                                      backgroundColor: 'rgba(99,102,241,0.06)',
                                      }
                                  }}
                                  onClick={() => handleMaterialClick(material)}
                                >
                                  <ListItemIcon sx={{ minWidth: { xs: 36, sm: 40 } }}>
                                    {isCompleted ? (
                                      <CheckCircle color="success" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                                    ) : (
                                      <Box sx={{ fontSize: { xs: 20, sm: 24 } }}>
                                        {getMaterialIcon(material.type)}
                                      </Box>
                                    )}
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: { xs: 0.5, sm: 1 },
                                        flexWrap: 'wrap'
                                      }}>
                                        <Typography 
                                          variant="subtitle1"
                                          sx={{ 
                                            fontSize: { xs: '0.875rem', sm: '1rem' },
                                            fontWeight: 'bold'
                                          }}
                                        >
                                          {material.title}
                                        </Typography>
                                        <Chip 
                                          label={material.type}
                                          size="small"
                                          variant="outlined"
                                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                                        />
                                        {material.isRequired && (
                                          <Chip 
                                            label="Required" 
                                            size="small" 
                                            color="error"
                                            sx={{ 
                                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                              height: { xs: 20, sm: 24 }
                                            }}
                                          />
                                        )}
                                        {isCompleted && (
                                          <Chip 
                                            label="Completed" 
                                            size="small" 
                                            color="success"
                                            sx={{ 
                                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                              height: { xs: 20, sm: 24 }
                                            }}
                                          />
                                        )}
                                      </Box>
                                    }
                                    secondary={
                                      <Box>
                                        <Typography 
                                          variant="body2" 
                                          color="text.secondary"
                                          sx={{ 
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                            mb: { xs: 0.5, sm: 0.5 }
                                          }}
                                        >
                                          {material.description}
                                        </Typography>
                                        <Box sx={{ 
                                          display: 'flex', 
                                          gap: { xs: 0.5, sm: 1 }, 
                                          flexWrap: 'wrap'
                                        }}>
                                          <Chip
                                            icon={<Timer sx={{ fontSize: { xs: 12, sm: 16 } }} />}
                                            label={`${material.estimatedDuration} min`}
                                            size="small"
                                            variant="outlined"
                                            sx={{ 
                                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                              height: { xs: 20, sm: 24 }
                                            }}
                                          />
                                        </Box>
                                        {/* Per-material progress */}
                                        <Box sx={{ mt: 0.75 }}>
                                          <LinearProgress 
                                            variant="determinate" 
                                            value={getMaterialProgressPct(material._id)} 
                                            sx={{ height: 6, borderRadius: 3 }} 
                                          />
                                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                            {getMaterialProgressPct(material._id)}%
                                          </Typography>
                                        </Box>
                                      </Box>
                                    }
                                  />
                                  <Box sx={{ 
                                    display: 'flex', 
                                    gap: { xs: 0.5, sm: 1 },
                                    flexDirection: { xs: 'column', sm: 'row' }
                                  }}>
                                    <Tooltip title="View Material">
                                      <IconButton 
                                        size="small"
                                        sx={{ 
                                          p: { xs: 0.5, sm: 1 },
                                          minWidth: { xs: 32, sm: 40 },
                                          minHeight: { xs: 32, sm: 40 }
                                        }}
                                      >
                                        <PlayArrow sx={{ fontSize: { xs: 16, sm: 20 } }} />
                                      </IconButton>
                                    </Tooltip>
                                    {!isCompleted && (
                                      <Tooltip title="Mark as Complete">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkComplete(week._id, material._id);
                                          }}
                                          sx={{ 
                                            p: { xs: 0.5, sm: 1 },
                                            minWidth: { xs: 32, sm: 40 },
                                            minHeight: { xs: 32, sm: 40 }
                                          }}
                                        >
                                          <CheckCircle sx={{ fontSize: { xs: 16, sm: 20 } }} />
                                        </IconButton>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </ListItem>
                                {matIndex < week.materials.filter(mat => mat.isPublished).length - 1 && <Divider />}
                              </React.Fragment>
                            );
                          })}
                        </List>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            </>
          )}
          </Container>
        </Box>
      </Box>

      {/* Floating AI Assistant */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 50 }}>
        <Tooltip title="AI Study Assistant">
          <Fab color="primary" onClick={() => setAiOpen(true)}>
            <SmartToyIcon />
          </Fab>
        </Tooltip>
      </Box>

      {/* AI Assistant Drawer */}
      <Drawer anchor="right" open={aiOpen} onClose={() => setAiOpen(false)} sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 420 } } }}>
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <SmartToyIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 800 }}>AI Study Assistant</Typography>
          </Stack>
          <Button onClick={() => setAiOpen(false)}>Close</Button>
        </Box>

        <Box sx={{ p: 2 }}>
          {/* Quick suggestions based on context */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>Quick Suggestions</Typography>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Button variant="outlined" size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => navigate(`/dashboard/student/course/${courseId}/weeks`)}>
              Suggest next material
            </Button>
            {assessments.length > 0 && (
              <Button variant="outlined" size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => handleTakeAssessment(assessments[0]._id)}>
                Help me prepare for: {assessments[0].title}
              </Button>
            )}
            {assignments.length > 0 && (
              <Button variant="outlined" size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => handleTakeAssignment(assignments[0]._id)}>
                Guide me through assignment: {assignments[0].title}
              </Button>
            )}
            <Button variant="outlined" size="small" sx={{ justifyContent: 'flex-start' }} onClick={() => handleGoToLiveSessions()}>
              Show upcoming live sessions
            </Button>
          </Stack>

          {/* Simple chat mockup - placeholder for real AI */}
          <Paper variant="outlined" sx={{ p: 1.5, height: 280, overflowY: 'auto', mb: 1 }}>
            <Typography variant="caption" color="text.secondary">
              AI: Hi! I can recommend materials, summarize a week, or help plan your study.
            </Typography>
          </Paper>
          <Stack direction="row" spacing={1}>
            <TextField fullWidth placeholder="Ask anything... e.g., ‘What should I study next?’" size="small" />
            <Button variant="contained">Send</Button>
          </Stack>
        </Box>
      </Drawer>
    </Box>
  );
};

export default UnifiedLearningPage;
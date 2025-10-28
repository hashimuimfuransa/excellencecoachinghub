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
  Stack,
  CardMedia,
  CardActions,
  Tabs,
  Tab,
  Menu as MuiMenu,
  MenuItem,
  InputAdornment,
  Rating,
  Skeleton,
  Snackbar,
  Fade,
  Zoom,
  Slide,
  Collapse
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
  AutoAwesome,
  Search,
  Star,
  People,
  CalendarToday,
  PlayCircleOutline,
  BookmarkBorder,
  Bookmark,
  FilterList,
  Sort,
  MoreVert,
  AccountCircle,
  Settings,
  ExitToApp,
  Grade,
  EmojiEvents,
  LocalFireDepartment,
  Psychology,
  Lightbulb,
  Chat,
  HelpOutline,
  Article,
  Description as DescriptionIcon,
  MilitaryTech,
  WorkspacePremium,
  Diamond,
  Rocket,
  Speed,
  FlashOn,
  Whatshot,
  Bolt,
  ThumbUp,
  Favorite,
  Share,
  BookmarkAdd,
  Visibility,
  VisibilityOff,
  ExpandMore,
  ExpandLess,
  KeyboardArrowUp,
  KeyboardArrowDown,
  TrendingFlat,
  Timeline,
  BarChart,
  PieChart,
  Assessment,
  Analytics,
  Insights,
  Psychology as PsychologyIcon,
  School as SchoolIcon,
  Science,
  Code,
  Build,
  Palette,
  MusicNote,
  SportsEsports,
  FitnessCenter,
  Spa,
  Restaurant,
  LocalLibrary,
  AutoStories,
  MenuBook,
  ImportContacts,
  ContactSupport,
  SupportAgent,
  QuestionAnswer,
  Quiz as QuizIcon,
  AssignmentTurnedIn,
  AssignmentLate,
  AssignmentReturned,
  AssignmentReturn,
  AssignmentInd,
  Assignment,
  Assignment as AssignmentIconAlt,
  CheckCircleOutline,
  RadioButtonUnchecked,
  CheckBox,
  CheckBoxOutlineBlank,
  IndeterminateCheckBox,
  CheckBoxOutlined,
  CheckBoxTwoTone,
  CheckBoxSharp,
  CheckBoxRounded,
  Close,
  Edit
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { motion, useScroll, useSpring } from 'framer-motion';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import TextField from '@mui/material/TextField';
import { courseService, ICourse } from '../../services/courseService';
import { weekService, Week, WeekMaterial } from '../../services/weekService';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import { assignmentService, Assignment as AssignmentType } from '../../services/assignmentService';
import { progressService } from '../../services/progressService';
import { progressTrackingService } from '../../services/progressTrackingService';
import { weekFeedbackService, WeekFeedback } from '../../services/weekFeedbackService';
import WeekEndFeedback from '../../components/WeekEndFeedback';
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
import { gamificationService } from '../../services/gamificationService';

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
  const [materialFilter, setMaterialFilter] = useState<'all' | 'required' | 'completed' | 'video' | 'document' | 'exam'>('all');
  const liveSectionRef = React.useRef<HTMLDivElement | null>(null);
  
  // New state for enhanced features
  const [activeTab, setActiveTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [courseRating, setCourseRating] = useState(4.5);
  const [enrolledStudents, setEnrolledStudents] = useState(120);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);
  const [recommendedNext, setRecommendedNext] = useState<any[]>([]);
  const [markingComplete, setMarkingComplete] = useState<Set<string>>(new Set());
  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(new Set());
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [completedWeek, setCompletedWeek] = useState<Week | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<Set<string>>(new Set());
  
  // Gamification state
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [gamificationLoading, setGamificationLoading] = useState(true);

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

  const loadGamificationData = async (courseId: string) => {
    try {
      setGamificationLoading(true);
      
      // Load gamification data in parallel
      const [
        levelInfo,
        studyStats,
        earnedBadges,
        achievementsData,
        leaderboardData
      ] = await Promise.allSettled([
        gamificationService.getLevelInfo(courseId),
        gamificationService.getStudyStats(courseId),
        gamificationService.getEarnedBadges(courseId),
        gamificationService.getAchievements(courseId),
        gamificationService.getLeaderboard(courseId, 10)
      ]);

      // Set level and XP data
      if (levelInfo.status === 'fulfilled' && levelInfo.value) {
        setUserLevel(levelInfo.value.currentLevel || 1);
        setUserXP(levelInfo.value.currentXP || 0);
      }

      // Set streak data
      if (studyStats.status === 'fulfilled' && studyStats.value) {
        setUserStreak(studyStats.value.currentStreak || 0);
      }

      // Set badges data
      if (earnedBadges.status === 'fulfilled' && earnedBadges.value) {
        const formattedBadges = earnedBadges.value.map((badge: any) => ({
          id: badge._id,
          name: badge.name,
          icon: badge.icon || '🏆',
          earned: true,
          description: badge.description,
          points: badge.points || 0
        }));
        setUserBadges(formattedBadges);
      }

      // Set achievements data
      if (achievementsData.status === 'fulfilled' && achievementsData.value) {
        const formattedAchievements = achievementsData.value.map((achievement: any) => ({
          id: achievement._id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon || '🎯',
          progress: achievement.progress || 0,
          total: achievement.requirements?.value || 1,
          isUnlocked: achievement.isUnlocked || false
        }));
        setAchievements(formattedAchievements);
      }

      // Set leaderboard data
      if (leaderboardData.status === 'fulfilled' && leaderboardData.value) {
        const formattedLeaderboard = leaderboardData.value.map((entry: any, index: number) => ({
          rank: index + 1,
          name: `${entry.user?.firstName || ''} ${entry.user?.lastName || ''}`.trim() || 'Anonymous',
          xp: entry.points || 0,
          avatar: entry.user?.firstName?.charAt(0) || 'A',
          streak: Math.floor(Math.random() * 30) + 1, // Mock streak for now
          isCurrentUser: entry.user?._id === user?._id
        }));
        setLeaderboard(formattedLeaderboard);
      }

    } catch (error) {
      console.error('Error loading gamification data:', error);
      // Set fallback data
      setUserLevel(1);
      setUserXP(0);
      setUserStreak(0);
      setUserBadges([]);
      setAchievements([]);
      setLeaderboard([]);
    } finally {
      setGamificationLoading(false);
    }
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
      
      // Load gamification data
      await loadGamificationData(courseId);
      
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

  const refreshProgressData = async () => {
    if (!courseId) return;
    
    try {
      console.log('🔄 Refreshing progress data...');
      const progressResponse = await api.get(`/progress/courses/${courseId}/progress`);
      setProgress(progressResponse.data.data || { weekProgresses: [], materialProgresses: [] });
      console.log('✅ Progress data refreshed successfully');
    } catch (err: any) {
      console.error('❌ Failed to refresh progress data:', err);
    }
  };

  const checkForCompletedWeeks = async () => {
    if (!courseId || !user) return;

    try {
      // Check each week to see if it's completed
      for (const week of weeks) {
        const weekProgress = getWeekProgress(week._id);
        
        // If week is 100% complete and we haven't shown feedback yet
        if (weekProgress === 100 && !feedbackSubmitted.has(week._id)) {
          // Check if user has already submitted feedback for this week
          const hasSubmitted = await weekFeedbackService.hasSubmittedFeedback(week._id, user._id);
          
          if (!hasSubmitted) {
            console.log(`🎉 Week "${week.title}" completed! Showing feedback dialog...`);
            setCompletedWeek(week);
            setShowFeedbackDialog(true);
            break; // Only show one feedback dialog at a time
          } else {
            // Mark as submitted to avoid checking again
            setFeedbackSubmitted(prev => new Set(prev).add(week._id));
          }
        }
      }
    } catch (err: any) {
      console.error('❌ Error checking for completed weeks:', err);
    }
  };

  const handleFeedbackSubmit = async (feedback: WeekFeedback) => {
    if (!courseId || !completedWeek || !user) return;

    try {
      const feedbackData: WeekFeedback = {
        ...feedback,
        weekId: completedWeek._id,
        courseId: courseId,
        timeSpent: Math.floor(Math.random() * 60) + 30, // Mock time spent
        completedMaterials: completedWeek.materials.filter(mat => mat.isPublished).length,
        totalMaterials: completedWeek.materials.filter(mat => mat.isPublished).length
      };

      await weekFeedbackService.submitWeekFeedback(feedbackData);
      
      // Mark feedback as submitted for this week
      setFeedbackSubmitted(prev => new Set(prev).add(completedWeek._id));
      
      console.log('✅ Feedback submitted successfully');
      setShowFeedbackDialog(false);
      setCompletedWeek(null);
      
      // Show success message
      alert('Thank you for your feedback! It helps us improve the course experience.');
      
    } catch (err: any) {
      console.error('❌ Error submitting feedback:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  // Refresh progress when user returns to the page (e.g., after watching a video)
  useEffect(() => {
    const handleFocus = () => {
      // Refresh progress data when user returns to the tab
      refreshProgressData();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh progress data when user returns to the tab
        refreshProgressData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [courseId]);

  // Check for completed weeks after progress updates
  useEffect(() => {
    if (weeks.length > 0 && progress) {
      checkForCompletedWeeks();
    }
  }, [weeks, progress, feedbackSubmitted]);

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
    // Track material view for progress analytics
    trackMaterialView(material);
    
    // Handle exam materials differently - redirect to proctored assessment
    if (material.type === 'exam') {
      // Create a mock assessment object from the exam material
      const examAssessment = {
        _id: material._id,
        title: material.title,
        description: material.description,
        type: material.examType || 'quiz',
        questions: material.content?.examContent?.questions || [],
        totalPoints: material.examSettings?.totalMarks || 100,
        totalQuestions: material.content?.examContent?.totalQuestions || 0,
        timeLimit: material.examSettings?.timeLimit || 60,
        attempts: material.examSettings?.attempts || 1,
        passingScore: material.examSettings?.passingScore || 70,
        instructions: material.examSettings?.instructions || '',
        requireProctoring: true,
        proctoringEnabled: true,
        isPublished: material.isPublished,
        allowLateSubmission: false,
        lateSubmissionPenalty: 0,
        randomizeQuestions: false,
        showResultsImmediately: true,
        course: {
          _id: courseId,
          title: course?.title || 'Course'
        },
        instructor: {
          _id: course?.instructor?._id || '',
          firstName: course?.instructor?.firstName || '',
          lastName: course?.instructor?.lastName || ''
        }
      };
      
      // Navigate to the proctored assessment page with the exam data
      navigate(`/assessment/${material._id}`, {
        state: {
          examMaterial: material,
          assessment: examAssessment,
          fromWeek: true,
          courseId: courseId
        }
      });
      return;
    }
    
    // For other materials, use the existing navigation
    navigate(`/material/${courseId}/${material._id}`);
  };

  const trackMaterialView = async (material: WeekMaterial) => {
    try {
      // Track that the material was viewed (for analytics and progress)
      console.log(`📊 Tracking view of material: ${material.title}`);
      
      // Optional: You could add additional tracking here
      // For example, tracking time spent, scroll progress, etc.
      // This helps with analytics and could be used for auto-completion logic
    } catch (err) {
      console.warn('Failed to track material view:', err);
    }
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
      case 'exam':
        return <Quiz />;
      default:
        return <Description />;
    }
  };

  const isMaterialCompleted = (materialId: string) => {
    // Check both server progress and local state for immediate UI updates
    return progress?.materialProgresses?.some((mp: any) => mp.materialId === materialId && mp.status === 'completed') || 
           completedMaterials.has(materialId) || 
           false;
  };

  const getMaterialProgressPct = (materialId: string): number => {
    // If material is completed locally, show 100%
    if (completedMaterials.has(materialId)) {
      return 100;
    }
    
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
    // Add to loading state
    setMarkingComplete(prev => new Set(prev).add(materialId));
    
    try {
      // Use the same progress tracking service as MaterialView for consistency
      await progressTrackingService.markMaterialCompleted(courseId!, weekId, materialId, 5); // Default 5 minutes
      
      // Immediately update UI state to show completion
      setCompletedMaterials(prev => new Set(prev).add(materialId));
      
      // Show success notification
      setSuccessMessage('Material marked as completed! 🎉');
      setShowSuccessSnackbar(true);
      
      // Refresh progress data to reflect the changes
      await refreshProgressData();
      
      // Show success feedback
      console.log(`✅ Material ${materialId} marked as completed`);
      
    } catch (err: any) {
      console.error('❌ Error marking material complete:', err);
      
      // Try fallback method if the main method fails
      try {
        console.log('🔄 Trying fallback progress tracking method...');
        await api.post(`/progress/weeks/${weekId}/materials/${materialId}/complete`, { timeSpent: 5 });
        
        // Immediately update UI state to show completion
        setCompletedMaterials(prev => new Set(prev).add(materialId));
        
        // Show success notification
        setSuccessMessage('Material marked as completed! 🎉');
        setShowSuccessSnackbar(true);
        
        // Refresh progress data
        await refreshProgressData();
        
        console.log('✅ Material marked as completed using fallback method');
      } catch (fallbackErr: any) {
        console.error('❌ Fallback method also failed:', fallbackErr);
        // You could show a toast notification here
      }
    } finally {
      // Remove from loading state
      setMarkingComplete(prev => {
        const newSet = new Set(prev);
        newSet.delete(materialId);
        return newSet;
      });
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

  const handleGoToPastPapers = () => {
    navigate('/past-papers');
  };

  // New helper functions for enhanced features
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      default:
        return '🟢';
    }
  };

  const getNextRecommendedMaterial = () => {
    for (const week of weeks) {
      for (const material of week.materials.filter(mat => mat.isPublished)) {
        if (!isMaterialCompleted(material._id)) {
          return { week, material };
        }
      }
    }
    return null;
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

  // Gamification Components
  const GamificationCard = ({ children, title, icon, gradient = 'primary', sx = {} }: any) => (
    <Card 
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        background: gradient === 'primary' 
          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)'
          : gradient === 'success'
          ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(139, 195, 74, 0.05) 100%)'
          : 'linear-gradient(135deg, rgba(255, 193, 7, 0.05) 0%, rgba(255, 152, 0, 0.05) 100%)',
        border: '1px solid rgba(0,0,0,0.05)',
        borderRadius: 3,
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
          borderColor: gradient === 'primary' ? 'primary.main' : gradient === 'success' ? 'success.main' : 'warning.main'
        },
        ...sx
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {title}
          </Typography>
        </Box>
        {children}
      </CardContent>
    </Card>
  );

  const ProgressRing = ({ progress, size = 60, strokeWidth = 4, color = 'primary' }: any) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(0,0,0,0.1)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color === 'primary' ? '#6366f1' : color === 'success' ? '#4caf50' : '#ff9800'}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {Math.round(progress)}%
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      position: 'relative', 
      overflowX: 'hidden',
      backgroundColor: '#fafafa'
    }}>
      {/* Modern gradient background */}
      <Box aria-hidden sx={{ 
        position: 'fixed', 
        inset: 0, 
        zIndex: 0,
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 50%, rgba(76, 175, 80, 0.02) 100%)',
        pointerEvents: 'none' 
      }} />
      
      {/* Modern scroll progress indicator */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 30, height: 3 }}>
        <motion.div 
          style={{ 
            scaleX: progressSpring, 
            height: 3, 
            transformOrigin: '0 0', 
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #4caf50)',
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
          }} 
        />
      </Box>
      
      {/* Modern Top App Bar with enhanced design */}
      <AppBar position="sticky" sx={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
        backdropFilter: 'blur(30px)',
        color: 'text.primary', 
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)', 
        zIndex: 5,
        borderBottom: '1px solid rgba(99, 102, 241, 0.1)',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(99, 102, 241, 0.3), transparent)'
        }
      }}>
        <Toolbar sx={{ 
          minHeight: { xs: 64, sm: 72 },
          px: { xs: 2, sm: 4 },
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          gap: { xs: 1, sm: 2 }
        }}>
          {/* Back Button with modern styling */}
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            sx={{ 
              mr: { xs: 1, sm: 2 },
              p: 1.5,
              borderRadius: 3,
              backgroundColor: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
          
          {/* Course Title with enhanced typography */}
          <Box sx={{ 
            flexGrow: 1, 
            minWidth: 0, 
            order: { xs: 3, sm: 1 }, 
            width: { xs: '100%', sm: 'auto' },
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Box>
              <Typography 
                variant="h5" 
                noWrap
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: { xs: 'center', sm: 'left' },
                  mb: 0.5
                }}
              >
                {course?.title || 'Learning Hub'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'text.secondary',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  opacity: 0.8
                }}
              >
                {course?.category || 'Interactive Learning Experience'}
              </Typography>
            </Box>
          </Box>
          
          {/* Enhanced Search Bar */}
          <Box sx={{ 
            display: { xs: 'none', lg: 'flex' },
            mr: 2,
            minWidth: 280,
            maxWidth: 400
          }}>
            <TextField
              size="small"
              placeholder="Search materials, videos, assignments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    borderColor: 'rgba(99, 102, 241, 0.25)',
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'white',
                    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.1)',
                    borderColor: 'primary.main',
                  }
                }
              }}
            />
          </Box>
          
          {/* Enhanced Action Buttons */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 1.5 },
            order: { xs: 2, sm: 2 },
            flexWrap: { xs: 'wrap', sm: 'nowrap' }
          }}>
            {/* Gamification XP Display with modern design */}
            <Box sx={{ 
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 1.5,
              px: 3,
              py: 1.5,
              backgroundColor: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))',
              borderRadius: 4,
              border: '1px solid rgba(99, 102, 241, 0.2)',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0.5,
                backgroundColor: 'rgba(255, 193, 7, 0.15)',
                borderRadius: 2,
                px: 1.5,
                py: 0.5
              }}>
                <EmojiEvents sx={{ fontSize: 18, color: '#ffd700' }} />
                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#b8860b' }}>
                  {userXP}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem', color: 'text.primary' }}>
                XP
              </Typography>
            </Box>

            {/* Live Sessions Button with enhanced styling */}
            <Button
              variant="outlined"
              startIcon={<VideoCall sx={{ fontSize: { xs: 16, sm: 18 } }} />}
              onClick={handleGoToLiveSessions}
              sx={{
                borderColor: 'primary.main',
                color: 'primary.main',
                backgroundColor: 'rgba(99, 102, 241, 0.08)',
                borderRadius: 3,
                px: { xs: 2, sm: 3 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                textTransform: 'none',
                fontWeight: 600,
                minWidth: { xs: 'auto', sm: 'auto' },
                border: '1px solid rgba(99, 102, 241, 0.2)',
                '&:hover': { 
                  backgroundColor: 'primary.main',
                  color: 'white',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(99, 102, 241, 0.3)',
                  borderColor: 'primary.main'
                },
                transition: 'all 0.3s ease',
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
            
            {/* Dashboard Button */}
            <IconButton
              color="inherit"
              onClick={handleGoToDashboard}
              sx={{ 
                p: { xs: 1, sm: 1.5 },
                display: { xs: 'none', sm: 'flex' },
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Dashboard sx={{ fontSize: { xs: 20, sm: 22 } }} />
            </IconButton>
            
            {/* Refresh Button */}
            <IconButton
              color="inherit"
              onClick={() => {
                if (courseId) {
                  loadCourseData();
                  refreshProgressData();
                }
              }}
              sx={{ 
                p: { xs: 1, sm: 1.5 },
                borderRadius: 3,
                backgroundColor: 'rgba(0,0,0,0.05)',
                '&:hover': {
                  backgroundColor: 'rgba(76, 175, 80, 0.1)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                },
                transition: 'all 0.3s ease'
              }}
              title="Refresh Course Data & Progress"
            >
              <Refresh sx={{ fontSize: { xs: 20, sm: 22 } }} />
            </IconButton>
            
            {/* Profile Menu with enhanced avatar */}
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
              sx={{ 
                p: { xs: 0.5, sm: 1 },
                borderRadius: 3,
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  transform: 'scale(1.05)',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              <Avatar sx={{ 
                width: { xs: 32, sm: 36 }, 
                height: { xs: 32, sm: 36 }, 
                background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                border: '2px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)'
              }}>
                {user?.firstName?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            
            <MuiMenu
              anchorEl={profileMenuAnchor}
              open={Boolean(profileMenuAnchor)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.1)',
                  mt: 1
                }
              }}
            >
              <MenuItem onClick={handleProfileMenuClose} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
                <AccountCircle sx={{ mr: 2, color: 'primary.main' }} />
                My Profile
              </MenuItem>
              <MenuItem onClick={handleProfileMenuClose} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
                <Settings sx={{ mr: 2, color: 'primary.main' }} />
                Settings
              </MenuItem>
              <Divider sx={{ my: 1 }} />
              <MenuItem onClick={handleProfileMenuClose} sx={{ borderRadius: 2, mx: 1, my: 0.5 }}>
                <ExitToApp sx={{ mr: 2, color: 'error.main' }} />
                Sign Out
              </MenuItem>
            </MuiMenu>

          </Box>
        </Toolbar>
      </AppBar>

      {/* Live Session Status */}
      <Box sx={{
        width: '100%'
      }}>
        <Box component={motion.div} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <LiveSessionStatus courseId={courseId!} fullWidth />
        </Box>
        
        {/* Compact Live Session Navigation Indicator */}
        <Container 
          maxWidth="lg" 
          sx={{ 
            p: { xs: 1, sm: 1.5, md: 2 },
            width: '100%',
            maxWidth: '100%',
            mx: 'auto',
            mb: { xs: 2, sm: 2.5, md: 3 }
          }}
        >
          <Card 
            component={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: { xs: 2.5, sm: 3, md: 3.5 },
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.25)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.35)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.05) 100%)',
                pointerEvents: 'none'
              }
            }}
            onClick={handleGoToLiveSessions}
          >
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 }, position: 'relative', zIndex: 1 }}>
              <Stack spacing={{ xs: 2, sm: 0 }} sx={{ justifyContent: 'space-between', height: '100%' }}>
                {/* Header Row */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: 2
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: { xs: 40, sm: 48 },
                      height: { xs: 40, sm: 48 },
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <VideoCall sx={{ fontSize: { xs: 24, sm: 28 } }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', sm: '1.125rem' }, mb: 0.25 }}>
                        Live Sessions
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.85, fontSize: { xs: '0.75rem', sm: '0.8rem' } }}>
                        Join & interact live
                      </Typography>
                    </Box>
                  </Box>

                  {/* Stats Pills */}
                  <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 0.75,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.15)'
                    }}>
                      <VideoCall sx={{ fontSize: 16 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {upcomingEvents.length} Upcoming
                      </Typography>
                    </Box>
                    {unseenRecordings > 0 && (
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        backgroundColor: 'rgba(255,107,53,0.2)',
                        borderRadius: 1.5,
                        px: 1.5,
                        py: 0.75,
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,107,53,0.4)'
                      }}>
                        <PlayCircleOutline sx={{ fontSize: 16 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                          {unseenRecordings} New
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>

                {/* Mobile Stats */}
                <Stack direction="row" spacing={0.75} sx={{ display: { xs: 'flex', sm: 'none' }, width: '100%' }}>
                  <Box sx={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.15)'
                  }}>
                    <VideoCall sx={{ fontSize: 14 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                      {upcomingEvents.length} Upcoming
                    </Typography>
                  </Box>
                  {unseenRecordings > 0 && (
                    <Box sx={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      backgroundColor: 'rgba(255,107,53,0.2)',
                      borderRadius: 1,
                      px: 1,
                      py: 0.5,
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,107,53,0.4)'
                    }}>
                      <PlayCircleOutline sx={{ fontSize: 14 }} />
                      <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                        {unseenRecordings} New
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {/* Actions Row */}
                <Stack 
                  direction={{ xs: 'column', sm: 'row' }} 
                  spacing={{ xs: 1, sm: 1.5 }}
                  sx={{ display: 'flex', justifyContent: 'flex-end' }}
                >
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<VideoCall sx={{ fontSize: 18 }} />}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.25)',
                      color: 'white',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.35)',
                      borderRadius: { xs: 1.5, sm: 2 },
                      px: { xs: 2, sm: 2.5 },
                      py: { xs: 0.75, sm: 1 },
                      fontSize: { xs: '0.8rem', sm: '0.875rem' },
                      fontWeight: 600,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.35)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {upcomingEvents.length > 0 ? 'Join Session' : 'View Sessions'}
                  </Button>
                  
                  {unseenRecordings > 0 && (
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<PlayCircleOutline sx={{ fontSize: 18 }} />}
                      sx={{
                        color: 'white',
                        borderColor: 'rgba(255,255,255,0.4)',
                        borderRadius: { xs: 1.5, sm: 2 },
                        px: { xs: 2, sm: 2.5 },
                        py: { xs: 0.75, sm: 1 },
                        fontSize: { xs: '0.8rem', sm: '0.875rem' },
                        fontWeight: 600,
                        textTransform: 'none',
                        whiteSpace: 'nowrap',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,255,0.15)',
                          borderColor: 'white',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Watch Recordings
                    </Button>
                  )}
                </Stack>
              </Stack>
            </CardContent>
            
            {/* Animated pulse effect for new recordings */}
            {unseenRecordings > 0 && (
              <Box sx={{
                position: 'absolute',
                top: { xs: 12, sm: 16 },
                right: { xs: 12, sm: 16 },
                width: 10,
                height: 10,
                backgroundColor: '#ff6b35',
                borderRadius: '50%',
                animation: 'pulse 2s infinite',
                boxShadow: '0 0 8px rgba(255, 107, 53, 0.6)',
                '@keyframes pulse': {
                  '0%': {
                    transform: 'scale(1)',
                    opacity: 1
                  },
                  '50%': {
                    transform: 'scale(1.2)',
                    opacity: 0.7
                  },
                  '100%': {
                    transform: 'scale(1)',
                    opacity: 1
                  }
                }
              }} />
            )}
          </Card>
        </Container>
      </Box>

        {/* Main Content Area */}
        <Box sx={{ 
          display: 'flex', 
          flex: 1,
          position: 'relative'
        }}>


        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 5,
            width: '100%',
            maxWidth: '100%'
          }}
        >
          <Container 
            maxWidth="lg" 
            sx={{ 
              p: { xs: 1, sm: 1.5, md: 2 },
              width: '100%',
              maxWidth: '100%',
              mx: 'auto'
            }}
          >
          {/* Hero Section */}
          <Box component={motion.div} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5 }}
            sx={{ 
              mb: { xs: 1.5, sm: 2, md: 2.5 },
              p: { xs: 2, sm: 2.5, md: 3 },
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              borderRadius: { xs: 2, sm: 3, md: 4 },
              border: '1px solid rgba(0,0,0,0.05)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
            }}
          >
            <Grid container spacing={{ xs: 2, sm: 3 }} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  lineHeight: 1.2, 
                  mb: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' },
                  color: 'text.primary'
                }}>
                  {course?.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ 
                  mb: { xs: 1.5, sm: 2 },
                  fontSize: { xs: '0.875rem', sm: '1rem', md: '1.125rem' },
                  lineHeight: 1.6
                }}>
                  Master your learning journey with interactive content, assessments, and live sessions.
                </Typography>
                
                {/* Quick Stats */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 2, sm: 3 }, 
                  flexWrap: 'wrap', 
                  mb: { xs: 1.5, sm: 2 },
                  justifyContent: { xs: 'space-between', sm: 'flex-start' }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    minWidth: { xs: '30%', sm: 'auto' }
                  }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: 'success.main' 
                    }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {weeks.length} Weeks
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    minWidth: { xs: '30%', sm: 'auto' }
                  }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: 'primary.main' 
                    }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)} Materials
                    </Typography>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    minWidth: { xs: '30%', sm: 'auto' }
                  }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: 'warning.main' 
                    }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {assessments.length} Assessments
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={{ xs: 1.5, sm: 2 }} sx={{ width: '100%' }}>
                  <Button 
                    variant="contained" 
                    size="large"
                    onClick={() => document.getElementById('weeks-section')?.scrollIntoView({ behavior: 'smooth' })} 
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: { xs: 2, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 2, sm: 3 },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                      boxShadow: '0 4px 20px rgba(99, 102, 241, 0.3)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5b5bd6, #7c3aed)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)'
                      },
                      transition: 'all 0.3s ease',
                      width: '100%'
                    }}
                  >
                    Start Learning
                  </Button>
                  <Button 
                    variant="outlined" 
                    size="large"
                    onClick={() => liveSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} 
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: { xs: 2, sm: 3 },
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 2, sm: 3 },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      backgroundColor: 'rgba(99, 102, 241, 0.05)',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(99, 102, 241, 0.3)'
                      },
                      transition: 'all 0.3s ease',
                      width: '100%'
                    }}
                  >
                    View Live Sessions
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Box>

          {/* Materials Filter - Moved to Top for Fast Access */}
          {weeks.length > 0 && (
            <Box sx={{ 
              mb: { xs: 2, sm: 3, md: 4 },
              p: { xs: 1.5, sm: 2 },
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              borderRadius: { xs: 2, sm: 3 },
              border: '1px solid rgba(0,0,0,0.05)',
              width: '100%'
            }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1rem', sm: '1.125rem' }
              }}>
                Filter Content
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: { xs: 0.75, sm: 1 },
                justifyContent: { xs: 'space-between', sm: 'flex-start' }
              }}>
                {[
                  { key: 'all', label: 'All', icon: <FilterList sx={{ fontSize: { xs: 14, sm: 16 } }} /> },
                  { key: 'required', label: 'Required', icon: <Star sx={{ fontSize: { xs: 14, sm: 16 } }} /> },
                  { key: 'completed', label: 'Completed', icon: <CheckCircle sx={{ fontSize: { xs: 14, sm: 16 } }} /> },
                  { key: 'video', label: 'Videos', icon: <VideoFile sx={{ fontSize: { xs: 14, sm: 16 } }} /> },
                  { key: 'document', label: 'Documents', icon: <Description sx={{ fontSize: { xs: 14, sm: 16 } }} /> },
                  { key: 'exam', label: 'Exams', icon: <Quiz sx={{ fontSize: { xs: 14, sm: 16 } }} /> }
                ].map((filter) => (
                  <Chip 
                    key={filter.key}
                    clickable 
                    icon={filter.icon}
                    label={filter.label}
                    onClick={() => setMaterialFilter(filter.key as any)}
                    sx={{
                      backgroundColor: materialFilter === filter.key 
                        ? 'rgba(99, 102, 241, 0.1)' 
                        : 'rgba(0,0,0,0.05)',
                      color: materialFilter === filter.key 
                        ? 'primary.main' 
                        : 'text.secondary',
                      fontWeight: 600,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      height: { xs: 28, sm: 32 },
                      minWidth: { xs: '18%', sm: 'auto' },
                      flex: { xs: '1 1 18%', sm: 'none' },
                      '& .MuiChip-icon': {
                        fontSize: { xs: 14, sm: 16 }
                      },
                      '&:hover': {
                        backgroundColor: materialFilter === filter.key 
                          ? 'rgba(99, 102, 241, 0.15)' 
                          : 'rgba(0,0,0,0.1)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Course Content/Weeks Section */}
          {weeks.length > 0 && (
            <Grid id="weeks-section" container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ width: '100%', mb: { xs: 2, sm: 3, md: 4 } }}>
              {weeks.map((week) => (
                <Grid item xs={12} key={week._id} sx={{ width: '100%' }}>
                  <Box 
                    component={motion.div} 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true, amount: 0.2 }}
                    sx={{
                      p: { xs: 2, sm: 2.5, md: 3 },
                      backgroundColor: 'rgba(255, 255, 255, 0.6)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: { xs: 2, sm: 3, md: 4 },
                      border: '1px solid rgba(0,0,0,0.05)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease',
                      width: '100%',
                      maxWidth: '100%',
                      boxSizing: 'border-box',
                      '&:hover': {
                        transform: { xs: 'none', sm: 'translateY(-4px)' },
                        boxShadow: { xs: '0 4px 20px rgba(0,0,0,0.08)', sm: '0 8px 30px rgba(0,0,0,0.15)' },
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      mb: { xs: 2, sm: 3 },
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 2, sm: 0 }
                    }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
                            fontWeight: 700,
                            mb: { xs: 0.75, sm: 1 },
                            color: 'text.primary'
                          }}
                        >
                          {week.title}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          color="text.secondary" 
                          sx={{ 
                            mb: { xs: 1.5, sm: 2 },
                            lineHeight: 1.6,
                            fontSize: { xs: '0.875rem', sm: '1rem' }
                          }}
                        >
                          {week.description}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: { xs: 0.75, sm: 1.5 }, 
                          flexWrap: 'wrap', 
                          mb: { xs: 2, sm: 3 },
                          justifyContent: { xs: 'space-between', sm: 'flex-start' }
                        }}>
                          <Chip
                            icon={<Description sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                            label={`${week.materials.filter(mat => mat.isPublished).length} Materials`}
                            sx={{ 
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              color: 'primary.main',
                              fontWeight: 600,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              height: { xs: 24, sm: 32 }
                            }}
                          />
                          <Chip
                            icon={<Timer sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                            label={`${week.materials.filter(mat => mat.isPublished).reduce((sum, mat) => sum + mat.estimatedDuration, 0)} min`}
                            sx={{ 
                              backgroundColor: 'rgba(156, 39, 176, 0.1)',
                              color: 'secondary.main',
                              fontWeight: 600,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              height: { xs: 24, sm: 32 }
                            }}
                          />
                          <Chip
                            icon={week.isPublished ? <CheckCircle sx={{ fontSize: { xs: 14, sm: 16 } }} /> : <Edit sx={{ fontSize: { xs: 14, sm: 16 } }} />}
                            label={week.isPublished ? 'Published' : 'Draft'}
                            sx={{ 
                              backgroundColor: week.isPublished 
                                ? 'rgba(76, 175, 80, 0.1)' 
                                : 'rgba(255, 152, 0, 0.1)',
                              color: week.isPublished 
                                ? 'success.main' 
                                : 'warning.main',
                              fontWeight: 600,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              height: { xs: 24, sm: 32 }
                            }}
                          />
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: { xs: 1.5, sm: 2 },
                        flexDirection: { xs: 'row', sm: 'column' },
                        width: { xs: '100%', sm: 'auto' },
                        justifyContent: { xs: 'space-between', sm: 'flex-end' }
                      }}>
                        <Box sx={{ 
                          textAlign: { xs: 'left', sm: 'right' },
                          flex: { xs: 1, sm: 'none' }
                        }}>
                          <Typography variant="h4" sx={{ 
                            fontWeight: 700, 
                            color: 'primary.main',
                            mb: 0.5,
                            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
                          }}>
                            {Math.round(getWeekProgress(week._id))}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ 
                            mb: 1,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                          }}>
                            Complete
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={getWeekProgress(week._id)}
                            sx={{ 
                              width: { xs: '100%', sm: 150 }, 
                              height: { xs: 6, sm: 8 }, 
                              borderRadius: { xs: 3, sm: 4 },
                              backgroundColor: 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                                borderRadius: { xs: 3, sm: 4 }
                              }
                            }}
                          />
                        </Box>
                        
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={() => toggleWeekExpanded(week._id)}
                          startIcon={expandedWeeks.has(week._id) ? <ExpandLess /> : <ExpandMore />}
                          sx={{ 
                            textTransform: 'none',
                            fontWeight: 600,
                            borderRadius: { xs: 1.5, sm: 2 },
                            px: { xs: 2, sm: 3 },
                            py: { xs: 1, sm: 1.5 },
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            minWidth: { xs: 'auto', sm: '140px' }
                          }}
                        >
                          {expandedWeeks.has(week._id) ? 'Hide' : 'Show'}
                        </Button>
                      </Box>
                    </Box>
                      
                    {/* Materials List */}
                    <Collapse in={expandedWeeks.has(week._id)}>
                      {week.materials.filter(mat => mat.isPublished).length === 0 ? (
                        <Box sx={{ 
                          textAlign: 'center', 
                          py: 4,
                          backgroundColor: 'rgba(0,0,0,0.02)',
                          borderRadius: 2,
                          border: '1px dashed rgba(0,0,0,0.1)'
                        }}>
                          <Typography 
                            variant="body1" 
                            color="text.secondary" 
                            sx={{ 
                              fontStyle: 'italic',
                              opacity: 0.8
                            }}
                          >
                            {week.materials.length === 0 ? 'No materials added to this week yet.' : 'No published materials available yet.'}
                          </Typography>
                        </Box>
                      ) : (
                        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mt: 2, width: '100%' }}>
                          {week.materials
                            .filter(mat => mat.isPublished)
                            .filter(material => {
                              if (materialFilter === 'all') return true;
                              if (materialFilter === 'required') return material.isRequired;
                              if (materialFilter === 'completed') return isMaterialCompleted(material._id);
                              if (materialFilter === 'video') return material.type === 'video';
                              if (materialFilter === 'document') return material.type === 'document';
                              if (materialFilter === 'exam') return material.type === 'exam';
                              return true;
                            })
                            .map((material) => {
                            const isCompleted = isMaterialCompleted(material._id);
                            return (
                              <Grid item xs={12} sm={6} md={4} key={material._id} sx={{ width: '100%' }}>
                                <Box
                                  sx={{
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    p: { xs: 2, sm: 2.5, md: 3 },
                                    backgroundColor: isCompleted 
                                      ? 'rgba(76, 175, 80, 0.05)' 
                                      : 'rgba(255, 255, 255, 0.6)',
                                    backdropFilter: 'blur(20px)',
                                    borderRadius: { xs: 2, sm: 2.5, md: 3 },
                                    border: isCompleted 
                                      ? '2px solid rgba(76, 175, 80, 0.3)' 
                                      : '1px solid rgba(0,0,0,0.05)',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    width: '100%',
                                    maxWidth: '100%',
                                    boxSizing: 'border-box',
                                    '&:hover': {
                                      transform: { xs: 'none', sm: 'translateY(-4px)' },
                                      boxShadow: { xs: '0 4px 20px rgba(0,0,0,0.08)', sm: '0 8px 30px rgba(0,0,0,0.15)' },
                                      borderColor: isCompleted ? 'success.main' : 'primary.main'
                                    }
                                  }}
                                  onClick={() => handleMaterialClick(material)}
                                >
                                  {/* Material Header */}
                                  <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1.5, 
                                    mb: 2 
                                  }}>
                                    <Box sx={{
                                      p: 1.5,
                                      backgroundColor: material.type === 'video' 
                                        ? 'rgba(102, 126, 234, 0.1)'
                                        : material.type === 'document'
                                        ? 'rgba(240, 147, 251, 0.1)'
                                        : material.type === 'exam'
                                        ? 'rgba(255, 152, 0, 0.1)'
                                        : 'rgba(79, 172, 254, 0.1)',
                                      borderRadius: 2,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}>
                                      {getMaterialIcon(material.type)}
                                    </Box>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography 
                                        variant="h6" 
                                        sx={{ 
                                          fontWeight: 700,
                                          fontSize: '1.125rem',
                                          mb: 0.5,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {material.title}
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                        {isCompleted && (
                                          <Chip
                                            icon={<CheckCircle />}
                                            label="Completed"
                                            size="small"
                                            sx={{ 
                                              backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                              color: 'success.main',
                                              fontWeight: 600,
                                              fontSize: '0.7rem'
                                            }}
                                          />
                                        )}
                                        {material.isRequired && (
                                          <Chip
                                            label="Required"
                                            size="small"
                                            sx={{ 
                                              backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                              color: 'error.main',
                                              fontWeight: 600,
                                              fontSize: '0.7rem'
                                            }}
                                          />
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>
                                  
                                  <Typography 
                                    variant="body2" 
                                    color="text.secondary"
                                    sx={{ 
                                      mb: 2,
                                      lineHeight: 1.5,
                                      display: '-webkit-box',
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden'
                                    }}
                                  >
                                    {material.description}
                                  </Typography>
                                  
                                  {/* Material Info */}
                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                                    <Chip 
                                      icon={getMaterialIcon(material.type)}
                                      label={material.type === 'exam' ? (material.examType || 'EXAM').toUpperCase() : material.type.toUpperCase()}
                                      size="small"
                                      sx={{ 
                                        backgroundColor: material.type === 'video' 
                                          ? 'rgba(102, 126, 234, 0.1)' 
                                          : material.type === 'document'
                                          ? 'rgba(240, 147, 251, 0.1)'
                                          : material.type === 'exam'
                                          ? 'rgba(255, 152, 0, 0.1)'
                                          : 'rgba(79, 172, 254, 0.1)',
                                        color: material.type === 'video' 
                                          ? '#667eea' 
                                          : material.type === 'document'
                                          ? '#f093fb'
                                          : material.type === 'exam'
                                          ? '#ff9800'
                                          : '#4facfe',
                                        fontWeight: 600
                                      }}
                                    />
                                    <Chip
                                      icon={<Timer sx={{ fontSize: 14 }} />}
                                      label={`${material.estimatedDuration} min`}
                                      size="small"
                                      sx={{ 
                                        backgroundColor: 'rgba(0,0,0,0.05)',
                                        color: 'text.secondary',
                                        fontWeight: 600
                                      }}
                                    />
                                  </Box>
                                  
                                  {/* Progress */}
                                  <Box sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                                        Progress
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
                                        {getMaterialProgressPct(material._id)}%
                                      </Typography>
                                    </Box>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={getMaterialProgressPct(material._id)} 
                                      sx={{ 
                                        height: 6, 
                                        borderRadius: 3,
                                        backgroundColor: 'rgba(0,0,0,0.1)',
                                        '& .MuiLinearProgress-bar': {
                                          background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                                          borderRadius: 3
                                        }
                                      }} 
                                    />
                                  </Box>
                                  
                                  {/* Actions */}
                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                    <Button
                                      variant="contained"
                                      size="large"
                                      startIcon={<PlayArrow />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMaterialClick(material);
                                      }}
                                      sx={{
                                        flex: 1,
                                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                        '&:hover': { 
                                          background: 'linear-gradient(135deg, #5b5bd6, #7c3aed)',
                                          transform: 'translateY(-1px)'
                                        },
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        borderRadius: 2,
                                        py: 1.5
                                      }}
                                    >
                                      {isCompleted ? 'Review' : 'Start'}
                                    </Button>
                                    {!isCompleted && (
                                      <IconButton
                                        size="large"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMarkComplete(week._id, material._id);
                                        }}
                                        disabled={markingComplete.has(material._id)}
                                        sx={{ 
                                          backgroundColor: markingComplete.has(material._id) 
                                            ? 'rgba(76, 175, 80, 0.3)' 
                                            : completedMaterials.has(material._id)
                                            ? 'rgba(76, 175, 80, 0.8)'
                                            : 'rgba(76, 175, 80, 0.1)',
                                          '&:hover': {
                                            backgroundColor: markingComplete.has(material._id)
                                              ? 'rgba(76, 175, 80, 0.3)'
                                              : completedMaterials.has(material._id)
                                              ? 'rgba(76, 175, 80, 0.9)'
                                              : 'rgba(76, 175, 80, 0.2)'
                                          }
                                        }}
                                      >
                                        {markingComplete.has(material._id) ? (
                                          <CircularProgress size={24} sx={{ color: 'success.main' }} />
                                        ) : completedMaterials.has(material._id) ? (
                                          <CheckCircle sx={{ fontSize: 24, color: 'white' }} />
                                        ) : (
                                          <CheckCircle sx={{ fontSize: 24, color: 'success.main' }} />
                                        )}
                                      </IconButton>
                                    )}
                                  </Box>
                                </Box>
                              </Grid>
                            );
                          })}
                        </Grid>
                      )}
                    </Collapse>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Mobile-Optimized Content Navigation */}
          <Box sx={{ 
            mb: { xs: 2, sm: 3, md: 4 },
            p: { xs: 1.5, sm: 2, md: 2.5 },
            backgroundColor: 'rgba(255, 255, 255, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRadius: { xs: 2, sm: 3 },
            border: '1px solid rgba(0,0,0,0.05)',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                  py: { xs: 1, sm: 1.5 },
                  px: { xs: 1, sm: 2 },
                  borderRadius: { xs: 1.5, sm: 2 },
                  mx: { xs: 0.25, sm: 0.5 },
                  minHeight: 'auto',
                  minWidth: { xs: 'auto', sm: '120px' },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    color: 'primary.main'
                  }
                },
                '& .MuiTabs-indicator': {
                  display: 'none'
                },
                '& .MuiTabs-scrollButtons': {
                  width: { xs: 32, sm: 40 },
                  '&.Mui-disabled': {
                    opacity: 0.3
                  }
                }
              }}
            >
              <Tab 
                icon={<Quiz sx={{ fontSize: { xs: 16, sm: 18 } }} />} 
                iconPosition="start"
                label="Assessments" 
                onClick={() => document.getElementById('assessments-section')?.scrollIntoView({ behavior: 'smooth' })}
              />
              <Tab 
                icon={<AssignmentIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />} 
                iconPosition="start"
                label="Assignments" 
                onClick={() => document.getElementById('assignments-section')?.scrollIntoView({ behavior: 'smooth' })}
              />
              <Tab 
                icon={<CalendarToday sx={{ fontSize: { xs: 16, sm: 18 } }} />} 
                iconPosition="start"
                label="Course Content" 
                onClick={() => document.getElementById('weeks-section')?.scrollIntoView({ behavior: 'smooth' })}
              />
              <Tab 
                icon={<Article sx={{ fontSize: { xs: 16, sm: 18 } }} />} 
                iconPosition="start"
                label="Past Papers" 
                onClick={handleGoToPastPapers}
              />
              <Tab 
                icon={<Event sx={{ fontSize: { xs: 16, sm: 18 } }} />} 
                iconPosition="start"
                label="Events & Announcements" 
                onClick={() => navigate(`/dashboard/student/course/${courseId}/events`)}
              />
            </Tabs>
          </Box>
          {/* Mobile-Optimized Progress Overview */}
          {progress && (
            <Box sx={{ 
              mb: { xs: 2, sm: 3, md: 4 },
              p: { xs: 1.5, sm: 2, md: 2.5 },
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              borderRadius: { xs: 2, sm: 3 },
              border: '1px solid rgba(0,0,0,0.05)',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                mb: { xs: 1.5, sm: 2 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700, 
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                }}>
                  Course Progress
                </Typography>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700, 
                  color: 'primary.main',
                  fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
                }}>
                  {Math.round(progress?.materialProgresses?.length > 0 ?
                    (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length /
                      weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress?.materialProgresses?.length > 0 ?
                  (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length /
                    weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0}
                sx={{ 
                  height: { xs: 6, sm: 8 }, 
                  borderRadius: { xs: 3, sm: 4 },
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                    borderRadius: { xs: 3, sm: 4 }
                  }
                }}
              />
            </Box>
          )}



          {/* Mobile-Responsive Assessments Section */}
          {assessments.length > 0 && (
            <Box id="assessments-section" component={motion.div} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true, amount: 0.2 }} 
              sx={{ 
                mb: { xs: 2, sm: 3, md: 4 },
                width: '100%',
                maxWidth: '100%'
              }}
            >
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                color: 'text.primary'
              }}>
                Assessments
              </Typography>
              <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ width: '100%' }}>
                {assessments.map((assessment) => (
                  <Grid item xs={12} sm={6} md={4} key={assessment._id}>
                    <Box 
                      sx={{ 
                        cursor: organizingAssessment.has(assessment._id) ? 'wait' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: organizingAssessment.has(assessment._id) ? 0.8 : 1,
                        p: { xs: 2, sm: 2.5, md: 3 },
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: { xs: 2, sm: 2.5, md: 3 },
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        position: 'relative',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        '&:hover': {
                          transform: organizingAssessment.has(assessment._id) ? 'none' : { xs: 'none', sm: 'translateY(-4px)' },
                          boxShadow: organizingAssessment.has(assessment._id) ? '0 4px 20px rgba(0,0,0,0.08)' : { xs: '0 4px 20px rgba(0,0,0,0.08)', sm: '0 8px 30px rgba(0,0,0,0.15)' },
                          borderColor: 'primary.main'
                        }
                      }}
                      onClick={() => !organizingAssessment.has(assessment._id) && handleTakeAssessment(assessment._id)}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                          <Box sx={{
                            p: 1,
                            backgroundColor: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Quiz sx={{ fontSize: 24, color: 'primary.main' }} />
                          </Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 700,
                              fontSize: { xs: '1rem', sm: '1.125rem' },
                              color: 'text.primary'
                            }}
                          >
                            {assessment.title}
                          </Typography>
                        </Box>
                        
                        {/* AI Organization Status */}
                        {organizingAssessment.has(assessment._id) && (
                          <Box sx={{ 
                            p: 2, 
                            backgroundColor: 'rgba(25, 118, 210, 0.1)', 
                            borderRadius: 2,
                            border: '1px solid rgba(25, 118, 210, 0.2)',
                            mb: 2
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <CircularProgress size={16} />
                              <Typography variant="body2" color="primary" fontWeight="600">
                                AI is enhancing your assessment...
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              Analyzing questions and creating personalized study tips
                            </Typography>
                          </Box>
                        )}
                        
                        {/* AI Enhancement Indicator */}
                        {!organizingAssessment.has(assessment._id) && (
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5, 
                            mb: 2 
                          }}>
                            <AutoAwesome sx={{ fontSize: 16, color: 'primary.main' }} />
                            <Typography variant="caption" color="primary" fontWeight="600">
                              AI-Enhanced Assessment
                            </Typography>
                          </Box>
                        )}
                        
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            mb: 2,
                            lineHeight: 1.5
                          }}
                        >
                          {assessment.description || 'No description available'}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          <Chip
                            label={`${assessment.totalQuestions} Questions`}
                            size="small"
                            sx={{ 
                              backgroundColor: 'rgba(99, 102, 241, 0.1)',
                              color: 'primary.main',
                              fontWeight: 600
                            }}
                          />
                          <Chip
                            label={`${assessment.totalPoints} Points`}
                            size="small"
                            sx={{ 
                              backgroundColor: 'rgba(156, 39, 176, 0.1)',
                              color: 'secondary.main',
                              fontWeight: 600
                            }}
                          />
                          {assessment.timeLimit && (
                            <Chip
                              label={`${assessment.timeLimit} min`}
                              size="small"
                              sx={{ 
                                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                color: 'warning.main',
                                fontWeight: 600
                              }}
                            />
                          )}
                        </Box>
                        
                        {assessment.dueDate && (
                          <Box sx={{ mb: 2 }}>
                            <CountdownTimer 
                              dueDate={assessment.dueDate}
                              onTimeReached={() => handleAssessmentTimeReached(assessment._id)}
                            />
                          </Box>
                        )}
                        
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={isAssessmentAvailable(assessment) ? <Quiz /> : <Lock />}
                          disabled={!isAssessmentAvailable(assessment)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTakeAssessment(assessment._id);
                          }}
                          sx={{ 
                            width: '100%',
                            py: 1.5,
                            borderRadius: 2,
                            fontWeight: 600,
                            background: isAssessmentAvailable(assessment) 
                              ? 'linear-gradient(135deg, #6366f1, #a855f7)'
                              : 'rgba(0,0,0,0.1)',
                            '&:hover': {
                              background: isAssessmentAvailable(assessment)
                                ? 'linear-gradient(135deg, #5b5bd6, #7c3aed)'
                                : 'rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          {isAssessmentAvailable(assessment) ? 'Take Assessment' : 'Assessment Locked'}
                        </Button>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

          {/* Mobile-Responsive Assignments Section */}
          {assignments.length > 0 && (
            <Box id="assignments-section" component={motion.div} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true, amount: 0.2 }} 
              sx={{ 
                mb: { xs: 2, sm: 3, md: 4 },
                width: '100%',
                maxWidth: '100%'
              }}
            >
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                mb: { xs: 2, sm: 3 },
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
                color: 'text.primary'
              }}>
                Assignments
              </Typography>
              <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ width: '100%' }}>
                {assignments.map((assignment) => (
                  <Grid item xs={12} sm={6} md={4} key={assignment._id}>
                    <Box 
                      sx={{ 
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        p: { xs: 2, sm: 2.5, md: 3 },
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: { xs: 2, sm: 2.5, md: 3 },
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                        width: '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box',
                        '&:hover': {
                          transform: { xs: 'none', sm: 'translateY(-4px)' },
                          boxShadow: { xs: '0 4px 20px rgba(0,0,0,0.08)', sm: '0 8px 30px rgba(0,0,0,0.15)' },
                          borderColor: 'warning.main'
                        }
                      }}
                      onClick={() => handleTakeAssignment(assignment._id)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{
                          p: 1,
                          backgroundColor: 'rgba(255, 152, 0, 0.1)',
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <AssignmentIcon sx={{ fontSize: 24, color: 'warning.main' }} />
                        </Box>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700,
                            fontSize: { xs: '1rem', sm: '1.125rem' },
                            color: 'text.primary'
                          }}
                        >
                          {assignment.title}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          mb: 2,
                          lineHeight: 1.5
                        }}
                      >
                        {assignment.description || 'No description available'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        <Chip
                          label={`${assignment.maxPoints} Points`}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(255, 152, 0, 0.1)',
                            color: 'warning.main',
                            fontWeight: 600
                          }}
                        />
                        <Chip
                          label={assignment.submissionType}
                          size="small"
                          sx={{ 
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            color: 'info.main',
                            fontWeight: 600
                          }}
                        />
                        <Chip
                          label={assignment.status}
                          size="small"
                          sx={{ 
                            backgroundColor: assignment.status === 'published' 
                              ? 'rgba(76, 175, 80, 0.1)' 
                              : 'rgba(0,0,0,0.1)',
                            color: assignment.status === 'published' 
                              ? 'success.main' 
                              : 'text.secondary',
                            fontWeight: 600
                          }}
                        />
                      </Box>
                      
                      {assignment.dueDate && (
                        <Box sx={{ mb: 2 }}>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontWeight: 600 }}
                          >
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      )}
                      
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<AssignmentIcon />}
                        sx={{ 
                          width: '100%',
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #ff9800, #f57c00)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #f57c00, #ef6c00)'
                          }
                        }}
                      >
                        Start Assignment
                      </Button>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Minimalist Course Content Section */}
          {weeks.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: { xs: 4, sm: 6 },
              px: { xs: 3, sm: 4 },
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <Typography 
                variant="h5" 
                color="text.secondary" 
                gutterBottom
                sx={{ 
                  fontWeight: 600,
                  mb: 2
                }}
              >
                No course content available yet
              </Typography>
              <Typography 
                variant="body1" 
                color="text.secondary"
                sx={{ 
                  opacity: 0.8
                }}
              >
                The instructor hasn't added any materials to this course.
              </Typography>
            </Box>
          ) : null}
          </Container>
        </Box>
      </Box>

      {/* Minimalist Floating AI Assistant */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
        <Tooltip title="AI Study Assistant" arrow>
          <Fab 
            onClick={() => setAiOpen(true)}
            sx={{
              background: 'linear-gradient(135deg, #6366f1, #a855f7)',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5b5bd6, #7c3aed)',
                transform: 'scale(1.1)',
                boxShadow: '0 12px 35px rgba(99, 102, 241, 0.6)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <SmartToyIcon sx={{ color: 'white' }} />
          </Fab>
        </Tooltip>
      </Box>

      {/* Minimalist AI Assistant Drawer */}
      <Drawer 
        anchor="right" 
        open={aiOpen} 
        onClose={() => setAiOpen(false)} 
        sx={{ 
          '& .MuiDrawer-paper': { 
            width: { xs: '100%', sm: 420 },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(0,0,0,0.05)'
          } 
        }}
      >
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          backgroundColor: 'rgba(99, 102, 241, 0.05)'
        }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{
              p: 1,
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <SmartToyIcon sx={{ color: 'primary.main' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
              AI Study Assistant
            </Typography>
          </Stack>
          <IconButton onClick={() => setAiOpen(false)} sx={{ color: 'text.secondary' }}>
            <Close />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Quick suggestions based on context */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
            Quick Actions
          </Typography>
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            <Button 
              variant="outlined" 
              size="large" 
              startIcon={<PlayArrow />}
              sx={{ 
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5
              }} 
              onClick={() => navigate(`/dashboard/student/course/${courseId}/weeks`)}
            >
              Suggest next material
            </Button>
            {assessments.length > 0 && (
              <Button 
                variant="outlined" 
                size="large" 
                startIcon={<Quiz />}
                sx={{ 
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  py: 1.5
                }} 
                onClick={() => handleTakeAssessment(assessments[0]._id)}
              >
                Help me prepare for: {assessments[0].title}
              </Button>
            )}
            {assignments.length > 0 && (
              <Button 
                variant="outlined" 
                size="large" 
                startIcon={<AssignmentIcon />}
                sx={{ 
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: 2,
                  py: 1.5
                }} 
                onClick={() => handleTakeAssignment(assignments[0]._id)}
              >
                Guide me through assignment: {assignments[0].title}
              </Button>
            )}
            <Button 
              variant="outlined" 
              size="large" 
              startIcon={<VideoCall />}
              sx={{ 
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5
              }} 
              onClick={() => handleGoToLiveSessions()}
            >
              Show upcoming live sessions
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              startIcon={<Event />}
              sx={{ 
                justifyContent: 'flex-start',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5
              }} 
              onClick={() => navigate(`/dashboard/student/course/${courseId}/events`)}
            >
              View all events and announcements
            </Button>
          </Stack>

          {/* AI Chat Interface */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Chat with AI
            </Typography>
            <Paper 
              variant="outlined" 
              sx={{ 
                p: 2, 
                height: 280, 
                overflowY: 'auto', 
                mb: 2,
                backgroundColor: 'rgba(0,0,0,0.02)',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.05)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Box sx={{
                  p: 1,
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 32,
                  height: 32
                }}>
                  <SmartToyIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  Hi! I can recommend materials, summarize a week, or help plan your study. What would you like to know?
                </Typography>
              </Box>
            </Paper>
            <Stack direction="row" spacing={1}>
              <TextField 
                fullWidth 
                placeholder="Ask anything... e.g., 'What should I study next?'" 
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'rgba(0,0,0,0.02)'
                  }
                }}
              />
              <Button 
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                  borderRadius: 2,
                  px: 3,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5b5bd6, #7c3aed)'
                  }
                }}
              >
                Send
              </Button>
            </Stack>
          </Box>
        </Box>
      </Drawer>

      {/* Week End Feedback Dialog */}
      <WeekEndFeedback
        open={showFeedbackDialog}
        onClose={() => setShowFeedbackDialog(false)}
        weekTitle={completedWeek?.title || ''}
        courseTitle={course?.title || ''}
        onSubmit={handleFeedbackSubmit}
      />

      {/* Minimalist Success Notification */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 2 }}
      >
        <Alert 
          onClose={() => setShowSuccessSnackbar(false)} 
          severity="success" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: '0 8px 25px rgba(76, 175, 80, 0.3)',
            '& .MuiAlert-icon': {
              fontSize: '1.5rem'
            }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>


      {/* AI Assistant Floating Button */}
      <Fab
        color="secondary"
        onClick={() => setAiOpen(true)}
        sx={{
          position: 'fixed',
          bottom: { xs: 100, sm: 24 },
          right: 24,
          zIndex: 1000,
          background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
          boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #45a049, #7cb342)',
            transform: 'scale(1.1)',
            boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)'
          },
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          width: 56,
          height: 56
        }}
      >
        <SmartToyIcon sx={{ color: 'white' }} />
      </Fab>
    </Box>
  );
};

export default UnifiedLearningPage;
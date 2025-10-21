import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Grid, Paper, Typography, Button, Stack, Avatar, Chip, Divider, Tooltip, LinearProgress, Badge, CircularProgress, useMediaQuery, useTheme, Card, CardContent, CardMedia, CardActions, IconButton, Rating } from '@mui/material';
import { LiveTv, VideoLibrary, Groups, LibraryBooks, Person4, RocketLaunch, AutoFixHigh, TrendingUp, PlayArrow, ErrorOutline, ArrowBack, EmojiEvents, LocalFireDepartment, Star, School, Psychology, Speed, CheckCircle, Lock, LockOpen } from '@mui/icons-material';
import { courseService, ICourse } from '../../services/courseService';
import { CourseStatus } from '../../shared/types';
import { weekService, progressService, Week, WeekMaterial } from '../../services/weekService';
import { liveSessionService } from '../../services/liveSessionService';
import { recordedSessionService } from '../../services/recordedSessionService';
import { assessmentService } from '../../services/assessmentService';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

// Re-using the excellent glassmorphism style
const cardSx = {
  p: { xs: 2, md: 2.5 },
  borderRadius: 3,
  cursor: 'pointer',
  transition: 'all 0.35s ease',
  background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(255,255,255,0.65) 100%)',
  border: '1px solid rgba(255,255,255,0.55)',
  boxShadow: '0 10px 25px rgba(2,10,60,0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
  backdropFilter: 'blur(10px)',
  // Increased hover effect for a more engaging feel
  '&:hover': {
    boxShadow: '0 18px 45px rgba(2,10,60,0.2), inset 0 1px 0 rgba(255,255,255,0.6)',
    transform: 'translateY(-6px) scale(1.02)' 
  }
} as const;

// New Featured Card Style for the Personalized Path
const featuredCardSx = {
    ...cardSx,
    p: 3,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(200,200,255,0.8) 100%)',
    border: '2px solid #8b5cf6', // Highlight border
    boxShadow: '0 20px 50px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.7)',
    '&:hover': {
        boxShadow: '0 25px 60px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.8)',
        transform: 'translateY(-8px) scale(1.025)' 
    }
}

// Data structure for learning paths to simplify rendering
const learningPaths = [
    {
        title: "Your Personalized Path",
        subtitle: "AI-driven next steps & recommendations",
        icon: <AutoFixHigh sx={{ color: '#8b5cf6' }} />,
        onClickPath: (courseId: string) => `/course/${courseId}/personalized`,
        isFeatured: true,
        tooltip: "The fastest way to reach your goals. Based on your progress.",
    },
    {
        title: "Dive into Materials",
        subtitle: "Notes, structured weeks, and assignments",
        icon: <LibraryBooks sx={{ color: '#38bdf8' }} />,
        onClickPath: (courseId: string) => `/course/${courseId}/learn`,
        tooltip: "Browse all static resources and complete assignments.",
    },
    {
        title: "Join Live Sessions",
        subtitle: "See schedule and join upcoming classes",
        icon: <LiveTv sx={{ color: '#a78bfa' }} />,
        onClickPath: (courseId: string) => `/dashboard/student/course/${courseId}/live-sessions`,
        tooltip: "Real-time learning and Q&A with instructors.",
    },
    {
        title: "Rewatch Videos & Labs",
        subtitle: "Watch past classes and video library",
        icon: <VideoLibrary sx={{ color: '#60a5fa' }} />,
        onClickPath: (courseId: string) => `/dashboard/student/recorded-sessions?courseId=${courseId}`,
        tooltip: "Catch up on missed classes or review concepts at your own pace.",
    },
    {
        title: "1:1 Coaching & AI Chat",
        subtitle: "Personalized guidance and focused help",
        icon: <Person4 sx={{ color: '#22d3ee' }} />,
        onClickPath: (courseId: string) => `/dashboard/student/ai-assistant`,
        tooltip: "Get focused, individual support from a coach or AI assistant.",
    },
    {
        title: "Community & Discussion",
        subtitle: "Discuss with peers and get peer support",
        icon: <Groups sx={{ color: '#60a5fa' }} />,
        onClickPath: (_: string) => `/community`,
        tooltip: "Engage with other learners and share knowledge.",
    },
];


const LearningHub: React.FC = () => {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [course, setCourse] = useState<ICourse | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [materials, setMaterials] = useState<WeekMaterial[]>([]);
  const [availableAssignments, setAvailableAssignments] = useState<any[]>([]);
  const [upcomingSessionsCount, setUpcomingSessionsCount] = useState<number>(0);
  const [recordingsCount, setRecordingsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Gamification state
  const [userLevel, setUserLevel] = useState<number>(1);
  const [userXP, setUserXP] = useState<number>(0);
  const [userStreak, setUserStreak] = useState<number>(0);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [leaderboardPosition, setLeaderboardPosition] = useState<number>(0);
  
  // Related courses state
  const [relatedCourses, setRelatedCourses] = useState<ICourse[]>([]);
  const [relatedCoursesLoading, setRelatedCoursesLoading] = useState<boolean>(false);

  // Scroll-linked animations are kept (great for a modern feel)
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 20, mass: 0.2 });
  const parallaxY1 = useTransform(progress, [0, 1], [0, -120]);
  const heroGlowOpacity = useTransform(progress, [0, 0.4, 1], [0.9, 0.4, 0.15]);
  
  // Real progress state
  const [progressPct, setProgressPct] = useState<number>(0);
  const [completedMaterials, setCompletedMaterials] = useState<number>(0);
  const [totalMaterials, setTotalMaterials] = useState<number>(0);
  const [nextAssignmentTitle, setNextAssignmentTitle] = useState<string | null>(null);
  const [daysStreak, setDaysStreak] = useState<number>(0); // placeholder if backend provides

  useEffect(() => {
    const loadData = async () => {
      if (!courseId) return;
      try {
        setLoading(true);
        setError(null);

        const [courseRes, weeksRes, sessionsRes, assessmentsRes, recordingsRes, progressRes] = await Promise.allSettled([
          // Prefer public course for students
          ((courseService as any).getPublicCourseById?.(courseId)) ?? courseService.getCourseById(courseId),
          weekService.getCourseWeeks(courseId),
          liveSessionService.getCourseSessions(courseId),
          assessmentService.getCourseAssessments(courseId),
          recordedSessionService.getRecordedSessionsForStudents(courseId),
          progressService.getStudentCourseProgress(courseId)
        ]);

        // Load gamification data (mock data for now)
        setUserLevel(Math.floor(Math.random() * 10) + 1);
        setUserXP(Math.floor(Math.random() * 1000));
        setUserStreak(Math.floor(Math.random() * 30) + 1);
        setAchievements([
          { id: 1, name: 'First Steps', description: 'Complete your first lesson', icon: '🎯', unlocked: true },
          { id: 2, name: 'Streak Master', description: 'Maintain a 7-day learning streak', icon: '🔥', unlocked: true },
          { id: 3, name: 'Quiz Champion', description: 'Score 90%+ on 5 quizzes', icon: '🏆', unlocked: false }
        ]);
        setBadges([
          { id: 1, name: 'Quick Learner', description: 'Complete lessons faster than average', icon: '⚡', color: '#FFD700' },
          { id: 2, name: 'Dedicated Student', description: 'Consistent daily learning', icon: '📚', color: '#4CAF50' }
        ]);
        setLeaderboardPosition(Math.floor(Math.random() * 50) + 1);

        // Load related courses - always try to load, with fallback
        if (courseRes.status === 'fulfilled' && courseRes.value) {
          setRelatedCoursesLoading(true);
          try {
            console.log('🔍 Loading related courses for category:', courseRes.value.category);
            const related = await courseService.getAllCourses({ 
              category: courseRes.value.category,
              limit: 5
            });
            console.log('🔍 Related courses API response:', related);
            // Filter out the current course
            const filteredCourses = (related.courses || []).filter(course => course._id !== courseId).slice(0, 4);
            console.log('🔍 Filtered related courses:', filteredCourses);
            if (filteredCourses.length > 0) {
              setRelatedCourses(filteredCourses);
            } else {
              // If no related courses found, use mock data
              throw new Error('No related courses found');
            }
          } catch (error) {
            console.warn('Failed to load related courses:', error);
            // Fallback: Create mock related courses
            const mockCourses = [
              {
                _id: 'mock-1',
                title: 'Advanced Web Development',
                description: 'Take your web development skills to the next level with advanced concepts and modern frameworks.',
                category: courseRes.value.category || 'Technology',
                level: 'intermediate' as const,
                status: CourseStatus.APPROVED,
                price: 299,
                duration: 40,
                enrolledStudents: [],
                students: [],
                instructor: {
                  _id: 'instructor-1',
                  firstName: 'John',
                  lastName: 'Doe',
                  email: 'john@example.com'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                isPublished: true,
                enrollmentCount: 156,
                rating: 4.8,
                ratingCount: 89,
                tags: ['web development', 'javascript', 'react'],
                prerequisites: ['Basic HTML/CSS', 'JavaScript fundamentals'],
                learningOutcomes: ['Build modern web applications', 'Master React framework', 'Implement responsive design']
              },
              {
                _id: 'mock-2',
                title: 'Data Science Fundamentals',
                description: 'Learn the basics of data science, statistics, and machine learning from scratch.',
                category: courseRes.value.category || 'Technology',
                level: 'beginner' as const,
                status: CourseStatus.APPROVED,
                price: 199,
                duration: 30,
                enrolledStudents: [],
                students: [],
                instructor: {
                  _id: 'instructor-2',
                  firstName: 'Jane',
                  lastName: 'Smith',
                  email: 'jane@example.com'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                isPublished: true,
                enrollmentCount: 203,
                rating: 4.6,
                ratingCount: 124,
                tags: ['data science', 'python', 'statistics'],
                prerequisites: ['Basic math', 'Python basics'],
                learningOutcomes: ['Analyze data with Python', 'Apply statistical methods', 'Build ML models']
              },
              {
                _id: 'mock-3',
                title: 'Digital Marketing Mastery',
                description: 'Master digital marketing strategies, SEO, social media, and content marketing.',
                category: courseRes.value.category || 'Business',
                level: 'intermediate' as const,
                status: CourseStatus.APPROVED,
                price: 249,
                duration: 35,
                enrolledStudents: [],
                students: [],
                instructor: {
                  _id: 'instructor-3',
                  firstName: 'Mike',
                  lastName: 'Johnson',
                  email: 'mike@example.com'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                isPublished: true,
                enrollmentCount: 98,
                rating: 4.7,
                ratingCount: 67,
                tags: ['marketing', 'SEO', 'social media'],
                prerequisites: ['Basic business knowledge'],
                learningOutcomes: ['Create marketing campaigns', 'Optimize for SEO', 'Manage social media']
              },
              {
                _id: 'mock-4',
                title: 'Project Management Essentials',
                description: 'Learn project management methodologies, tools, and best practices for successful project delivery.',
                category: courseRes.value.category || 'Business',
                level: 'beginner' as const,
                status: CourseStatus.APPROVED,
                price: 179,
                duration: 25,
                enrolledStudents: [],
                students: [],
                instructor: {
                  _id: 'instructor-4',
                  firstName: 'Sarah',
                  lastName: 'Wilson',
                  email: 'sarah@example.com'
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
                isPublished: true,
                enrollmentCount: 142,
                rating: 4.5,
                ratingCount: 78,
                tags: ['project management', 'leadership', 'planning'],
                prerequisites: ['Basic organizational skills'],
                learningOutcomes: ['Plan projects effectively', 'Manage teams', 'Use PM tools']
              }
            ];
            console.log('🔍 Using mock related courses:', mockCourses);
            setRelatedCourses(mockCourses as ICourse[]);
          } finally {
            setRelatedCoursesLoading(false);
          }
        } else {
          // Fallback: Always show some related courses even if course data is not available
          console.log('🔍 Course data not available, using mock related courses');
          const mockCourses = [
            {
              _id: 'mock-1',
              title: 'Advanced Web Development',
              description: 'Take your web development skills to the next level with advanced concepts and modern frameworks.',
              category: 'Technology',
              level: 'intermediate' as const,
              status: 'approved' as const,
              price: 299,
              duration: 40,
              enrolledStudents: [],
              students: [],
              instructor: {
                _id: 'instructor-1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isActive: true,
              isPublished: true,
              enrollmentCount: 156,
              rating: 4.8,
              ratingCount: 89,
              tags: ['web development', 'javascript', 'react'],
              prerequisites: ['Basic HTML/CSS', 'JavaScript fundamentals'],
              learningOutcomes: ['Build modern web applications', 'Master React framework', 'Implement responsive design']
            },
            {
              _id: 'mock-2',
              title: 'Data Science Fundamentals',
              description: 'Learn the basics of data science, statistics, and machine learning from scratch.',
              category: 'Technology',
              level: 'beginner' as const,
              status: 'approved' as const,
              price: 199,
              duration: 30,
              enrolledStudents: [],
              students: [],
              instructor: {
                _id: 'instructor-2',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com'
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isActive: true,
              isPublished: true,
              enrollmentCount: 203,
              rating: 4.6,
              ratingCount: 124,
              tags: ['data science', 'python', 'statistics'],
              prerequisites: ['Basic math', 'Python basics'],
              learningOutcomes: ['Analyze data with Python', 'Apply statistical methods', 'Build ML models']
            },
            {
              _id: 'mock-3',
              title: 'Digital Marketing Mastery',
              description: 'Master digital marketing strategies, SEO, social media, and content marketing.',
              category: 'Business',
              level: 'intermediate' as const,
              status: 'approved' as const,
              price: 249,
              duration: 35,
              enrolledStudents: [],
              students: [],
              instructor: {
                _id: 'instructor-3',
                firstName: 'Mike',
                lastName: 'Johnson',
                email: 'mike@example.com'
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isActive: true,
              isPublished: true,
              enrollmentCount: 98,
              rating: 4.7,
              ratingCount: 67,
              tags: ['marketing', 'SEO', 'social media'],
              prerequisites: ['Basic business knowledge'],
              learningOutcomes: ['Create marketing campaigns', 'Optimize for SEO', 'Manage social media']
            },
            {
              _id: 'mock-4',
              title: 'Project Management Essentials',
              description: 'Learn project management methodologies, tools, and best practices for successful project delivery.',
              category: 'Business',
              level: 'beginner' as const,
              status: 'approved' as const,
              price: 179,
              duration: 25,
              enrolledStudents: [],
              students: [],
              instructor: {
                _id: 'instructor-4',
                firstName: 'Sarah',
                lastName: 'Wilson',
                email: 'sarah@example.com'
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              isActive: true,
              isPublished: true,
              enrollmentCount: 142,
              rating: 4.5,
              ratingCount: 78,
              tags: ['project management', 'leadership', 'planning'],
              prerequisites: ['Basic organizational skills'],
              learningOutcomes: ['Plan projects effectively', 'Manage teams', 'Use PM tools']
            }
          ];
          setRelatedCourses(mockCourses as ICourse[]);
        }

        if (courseRes.status === 'fulfilled') setCourse(courseRes.value);
        if (weeksRes.status === 'fulfilled') {
          setWeeks(weeksRes.value || []);
          const allMaterials = (weeksRes.value || []).flatMap((w: Week) => w.materials || []);
          setMaterials(allMaterials);
          setTotalMaterials(allMaterials.length);
        }
        if (sessionsRes.status === 'fulfilled') {
          const count = (sessionsRes.value || []).filter((s: any) => s.status === 'scheduled' && new Date(s.scheduledTime) > new Date()).length;
          setUpcomingSessionsCount(count);
        }
        if (assessmentsRes.status === 'fulfilled') {
          const available = (assessmentsRes.value || []).filter((a: any) => a.isPublished !== false);
          setAvailableAssignments(available);
          setNextAssignmentTitle(available[0]?.title || null);
        }
        if (recordingsRes.status === 'fulfilled') {
          const payload = recordingsRes.value as { success: boolean; data: any } | any[];
          const recs = Array.isArray(payload) ? payload : (Array.isArray((payload as any)?.data) ? (payload as any).data : []);
          setRecordingsCount(recs.length);
        }
        if (progressRes.status === 'fulfilled') {
          const mp = progressRes.value?.materialProgresses || [];
          const completed = mp.filter((m: any) => m.status === 'completed').length;
          setCompletedMaterials(completed);
          const denom = (materials.length || mp.length || 1);
          const pct = Math.round((completed / denom) * 100);
          setProgressPct(Number.isFinite(pct) ? pct : 0);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load learning hub');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [courseId]);

  const hasMaterials = useMemo(() => (materials?.length || 0) > 0, [materials]);
  const hasAssignments = useMemo(() => (availableAssignments?.length || 0) > 0, [availableAssignments]);
  const hasSessions = useMemo(() => upcomingSessionsCount > 0, [upcomingSessionsCount]);
  const hasRecordings = useMemo(() => recordingsCount > 0, [recordingsCount]);

  const featuredPath = learningPaths.find(p => p.isFeatured);
  const otherPaths = learningPaths.filter(p => !p.isFeatured);


  return (
    <Box sx={{
      bgcolor: '#0b1020',
      minHeight: '100vh',
      position: 'relative',
      overflowX: 'hidden',
      overflowY: 'visible',
      perspective: 1200
    }}>
      {/* Background and Scroll Indicator (Kept for great UX) */}
      <motion.div
        aria-hidden
        initial={{ backgroundPosition: '0% 50%' }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: 'linear-gradient(120deg, #0b1020 0%, #0b1020 5%, #0e1632 35%, #111b3d 55%, #0e1632 75%, #0b1020 100%)',
          backgroundSize: '200% 200%', pointerEvents: 'none'
        }}
      />
      <Box aria-hidden sx={{ position: 'fixed', inset: 0, zIndex: 1, backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '18px 18px', pointerEvents: 'none' }} />
      <Box sx={{ position: 'sticky', top: 0, zIndex: 30, pt: 0.25, px: 0.5 }}>
        <Box sx={{ height: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <motion.div style={{ scaleX: progress, height: 3, transformOrigin: '0 0', backgroundImage: 'linear-gradient(90deg,#6ee7f9,#8b5cf6,#22d3ee)', backgroundSize: '200% 100%' }} />
        </Box>
      </Box>

      {/* Animated background orbs (Enhanced) */}
      <motion.div style={{ position: 'absolute', top: -80, left: -80, width: 260, height: 260, borderRadius: '50%', filter: 'blur(34px)', background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.45), rgba(99,102,241,0.06))', y: parallaxY1, opacity: heroGlowOpacity, zIndex: 2 }} />
      <motion.div style={{ position: 'absolute', bottom: -120, right: -120, width: 320, height: 320, borderRadius: '50%', filter: 'blur(40px)', background: 'radial-gradient(circle at 70% 70%, rgba(34,211,238,0.35), rgba(34,211,238,0.06))', y: parallaxY1, opacity: heroGlowOpacity, zIndex: 2 }} />

      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 }, position: 'relative', zIndex: 5 }}>
        {/* Back Button */}
        <Box sx={{ mb: { xs: 1.5, md: 2 } }}>
          <Button variant="text" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ color: 'white', '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent' } }}>
            Back
          </Button>
        </Box>

        {/* Gamification Dashboard */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* User Stats Card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,248,255,0.8) 100%)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', backdropFilter: 'blur(15px)' }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: '#8b5cf6', width: 50, height: 50 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>L{userLevel}</Typography>
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0b1020' }}>
                    Level {userLevel} Learner
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(2,10,60,0.7)' }}>
                    {userXP} XP • #{leaderboardPosition} on leaderboard
                  </Typography>
                </Box>
              </Stack>
              <LinearProgress 
                variant="determinate" 
                value={(userXP % 1000) / 10} 
                sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(139,92,246,0.2)' }}
              />
              <Typography variant="caption" sx={{ color: 'rgba(2,10,60,0.7)', mt: 1, display: 'block' }}>
                {1000 - (userXP % 1000)} XP to next level
              </Typography>
            </Paper>
          </Grid>

          {/* Streak Card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,248,240,0.8) 100%)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', backdropFilter: 'blur(15px)' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <LocalFireDepartment sx={{ color: '#ff6b35', fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#0b1020' }}>
                    {userStreak}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(2,10,60,0.7)' }}>
                    Day Streak
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="caption" sx={{ color: 'rgba(2,10,60,0.7)', mt: 1, display: 'block' }}>
                Keep it up! 🔥
              </Typography>
            </Paper>
          </Grid>

          {/* Achievements Card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,255,240,0.8) 100%)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', backdropFilter: 'blur(15px)' }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <EmojiEvents sx={{ color: '#f59e0b', fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#0b1020' }}>
                    Achievements
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(2,10,60,0.7)' }}>
                    {achievements.filter(a => a.unlocked).length}/{achievements.length} unlocked
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1}>
                {achievements.slice(0, 3).map((achievement, index) => (
                  <Tooltip key={achievement.id} title={achievement.description}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: achievement.unlocked ? 'rgba(34,197,94,0.2)' : 'rgba(156,163,175,0.2)',
                      border: `2px solid ${achievement.unlocked ? '#22c55e' : '#9ca3af'}`,
                      opacity: achievement.unlocked ? 1 : 0.5
                    }}>
                      <Typography sx={{ fontSize: '1.2rem' }}>
                        {achievement.icon}
                      </Typography>
                    </Box>
                  </Tooltip>
                ))}
              </Stack>
            </Paper>
          </Grid>
        </Grid>
        
        {/* === Hero Header Section (Refined) === */}
        <Paper component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} sx={{ p: { xs: 1.5, sm: 2, md: 3 }, borderRadius: 3, mb: { xs: 2, md: 4 }, border: '1px solid rgba(255,255,255,0.4)', background: 'linear-gradient(135deg, rgba(255,255,255,0.70) 0%, rgba(245,247,255,0.55) 100%)', overflow: 'hidden', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.18)', backdropFilter: 'blur(12px)' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <Avatar sx={{ width: { xs: 44, sm: 56, md: 60 }, height: { xs: 44, sm: 56, md: 60 }, bgcolor: 'primary.main', boxShadow: 4, fontSize: { xs: 24, sm: 28, md: 32 } }}>{(course?.title || 'C').slice(0,1)}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 900, 
                lineHeight: 1.15, 
                backgroundImage: 'linear-gradient(90deg,#60a5fa,#a78bfa)', 
                WebkitBackgroundClip: 'text', 
                color: 'transparent',
                mb: 0.5,
                fontSize: { xs: '1.25rem', sm: '1.6rem', md: '2rem' },
                wordBreak: 'break-word'
              }}>
                {course?.title || 'Your Learning Hub'}
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 0.5, color: 'rgba(2,10,60,0.85)', fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                Hi, Welcome back! What’s your focus for today?
              </Typography>
              {course && (
                <Stack direction="row" spacing={1} sx={{ mt: 1.0, flexWrap: 'wrap', rowGap: 0.75 }}>
                  <Chip size="small" label={course.category} sx={{ bgcolor: 'rgba(59,130,246,0.15)', color: '#003366', fontWeight: 600, maxWidth: { xs: '100%', sm: 'unset' } }} />
                  <Chip size="small" color="primary" label={course.level} sx={{ bgcolor: 'rgba(139,92,246,0.18)', color: '#330066', fontWeight: 600, maxWidth: { xs: '100%', sm: 'unset' } }} />
                  <Chip size="small" color="secondary" icon={<AutoFixHigh />} label="AI Guidance Active" sx={{ bgcolor: 'rgba(236,72,153,0.18)', color: '#660033', fontWeight: 600, maxWidth: { xs: '100%', sm: 'unset' } }} />
                </Stack>
              )}
            </Box>
            <Tooltip title="Jump straight to the structured course plan" disableHoverListener={isMobile} disableFocusListener={isMobile}>
              <Button 
                variant="text"
                size="large" 
                startIcon={<RocketLaunch />} 
                onClick={() => navigate(`/dashboard/student/course/${courseId}/weeks`)} 
                sx={{
                  px: 0, py: 0.5, borderRadius: 1, textTransform: 'none', fontWeight: 900,
                  color: '#1e40af',
                  '& .MuiSvgIcon-root': { color: '#1e40af' },
                  letterSpacing: 0.2,
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: { xs: 'center', sm: 'flex-start' },
                  '&:hover': { textDecoration: 'underline', backgroundColor: 'transparent', transform: 'none', color: '#1d4ed8' }
              }}>
                Open Course Plan
              </Button>
            </Tooltip>
          </Stack>
        </Paper>

        {loading && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <CircularProgress size={18} />
            <Typography variant="caption" sx={{ color: 'white' }}>Loading your learning data…</Typography>
          </Stack>
        )}
        {!!error && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <ErrorOutline sx={{ color: '#fecaca' }} />
            <Typography variant="caption" sx={{ color: '#fecaca' }}>{error}</Typography>
          </Stack>
        )}

        {/* === Main Content Grid === */}
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* === Left Column: Featured Path, Progress, Quick Plan === */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>

                {/* 1. Featured Path (New, stands out) */}
                {featuredPath && (
                    <Paper 
                        component={motion.div} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.6 }} 
                        sx={featuredCardSx} 
                        onClick={() => navigate(featuredPath.onClickPath(courseId || ''))}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ p: 1.5, borderRadius: '50%', bgcolor: 'rgba(139,92,246,0.2)', border: '2px solid #8b5cf6' }}>
                                {featuredPath.icon}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" sx={{ fontWeight: 900, color: '#0b1020', lineHeight: 1.2 }}>
                                    {featuredPath.title}
                                </Typography>
                                <Typography variant="body1" sx={{ color: 'rgba(2,10,60,0.8)', mt: 0.5 }}>
                                    {featuredPath.subtitle}
                                </Typography>
                            </Box>
                            <Button variant="contained" size="large" sx={{ 
                                textTransform: 'none', 
                                fontWeight: 700, 
                                borderRadius: 999, 
                                background: 'linear-gradient(90deg,#8b5cf6,#a78bfa)',
                                boxShadow: '0 8px 15px rgba(139,92,246,0.3)',
                                color: 'white'
                            }}>
                                Start Now
                            </Button>
                        </Stack>
                    </Paper>
                )}
                
                {/* 2. Progress & Next Step (Real data) */}
                <Paper 
                    component={motion.div} 
                    initial={{ opacity: 0, y: 20 }} 
                    whileInView={{ opacity: 1, y: 0 }} 
                    viewport={{ once: true, amount: 0.3 }}
                    sx={{ p: 2.5, borderRadius: 3, border: '1px solid rgba(255,255,255,0.4)', background: 'linear-gradient(135deg, rgba(255,255,255,0.70) 0%, rgba(245,247,255,0.55) 100%)', backdropFilter: 'blur(10px)', boxShadow: '0 16px 32px rgba(0,0,0,0.18)' }}
                >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
                        <Box sx={{ flex: 1, width: { xs: '100%', sm: 'auto' } }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0b1020', mb: 1 }}>Your Current Streak & Progress</Typography>
                            <LinearProgress 
                                variant="determinate" 
                                value={progressPct} 
                                sx={{ height: 10, borderRadius: 5, bgcolor: 'rgba(0,0,0,0.1)', '& .MuiLinearProgress-bar': { bgcolor: 'secondary.main' } }} 
                            />
                            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'rgba(2,10,60,0.8)' }}>{progressPct}% Completed ({completedMaterials}/{totalMaterials})</Typography>
                                <Chip size="small" icon={<TrendingUp />} label={`${daysStreak} Day Streak`} sx={{ bgcolor: 'rgba(236,72,153,0.18)', color: '#660033', fontWeight: 600 }} />
                            </Stack>
                        </Box>
                        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' }, mx: 2 }} />
                        <Box>
                            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0b1020', whiteSpace: 'nowrap' }}>
                                Next Up:
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(2,10,60,0.8)', fontWeight: 600 }}>
                                {nextAssignmentTitle ? `${nextAssignmentTitle} (Assignment)` : hasMaterials ? 'Continue with your next material' : 'No next steps available yet'}
                            </Typography>
                            <Button size="small" variant="outlined" sx={{ mt: 1, textTransform: 'none', borderRadius: 999, color: '#0b1020', borderColor: 'rgba(2,10,60,0.35)' }} onClick={() => {
                              if (hasMaterials) navigate(`/dashboard/student/course/${courseId}/weeks`);
                              else if (hasAssignments && availableAssignments[0]?._id) navigate(`/dashboard/student/assignment/${availableAssignments[0]._id}`);
                            }}>
                                {hasMaterials ? 'Open Course Plan' : hasAssignments ? 'Start Assignment' : 'Explore Course'}
                            </Button>
                        </Box>
                    </Stack>
                </Paper>

                {/* 3. Embedded Quick Start Video (Kept) */}
                <Paper component={motion.div} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} sx={{ p: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 16px 32px rgba(0,0,0,0.18)', transition: 'transform 300ms ease', backdropFilter: 'blur(10px)', background: 'linear-gradient(135deg, rgba(255,255,255,0.70) 0%, rgba(245,247,255,0.55) 100%)', '&:hover': { transform: 'translateY(-2px)' } }}>
                    <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
                        <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                            <iframe
                                width="100%" height="100%"
                                src={`https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0`}
                                title="Getting Started" frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            />
                        </Box>
                    </Box>
                    <Box sx={{ p: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 0.5, color: '#0b1020' }}>
                            Watch: Quickstart Guide
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(2,10,60,0.8)' }}>
                            Learn how to navigate materials, live sessions, and more.
                        </Typography>
                    </Box>
                </Paper>
            </Stack>
          </Grid>

          {/* === Right Column: Learning Modes Grid === */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'white', textShadow: '0 0 5px rgba(255,255,255,0.1)' }}>
                Other Learning Modes
            </Typography>
            <Stack spacing={2} component={motion.div} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}>
                {otherPaths.map((path, index) => {
                  const isMaterials = path.title.includes('Materials');
                  const isLive = path.title.includes('Live');
                  const isVideos = path.title.includes('Videos');
                  const isCoaching = path.title.includes('1:1');

                  const availability = isMaterials ? (hasMaterials ? materials.length : 0)
                    : isLive ? upcomingSessionsCount
                    : isVideos ? recordingsCount
                    : undefined;

                  const availableLabel = availability !== undefined ? `${availability} ${availability === 1 ? 'item' : 'items'}` : undefined;

                  const canStart = isMaterials ? hasMaterials : isLive ? hasSessions : isVideos ? hasRecordings : true;
                  const progressMini = isMaterials ? (totalMaterials ? Math.round((completedMaterials / totalMaterials) * 100) : 0) : undefined;

                  return (
                    <Tooltip title={path.tooltip} key={index} disableHoverListener={isMobile} disableFocusListener={isMobile}>
                      <Paper 
                        component={motion.div} 
                        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} 
                        whileHover={isMobile ? undefined : { y: -6, rotateX: index % 2 === 0 ? 3 : -3, rotateY: index % 2 === 0 ? -3 : 3 }} 
                        whileTap={{ scale: 0.98 }} 
                        sx={{...cardSx, p: 2}} 
                      >
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent={{ xs: 'flex-start', sm: 'space-between' }}>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                            {path.icon}
                            <Box>
                              <Typography sx={{ fontWeight: 700, color: '#0b1020' }}>
                                {path.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: 'rgba(2,10,60,0.8)' }}>
                                {path.subtitle}
                              </Typography>
                              {availableLabel !== undefined && (
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                  <Badge color={canStart ? 'primary' : 'warning'} badgeContent={availability} overlap="rectangular">
                                    <Chip size="small" label={canStart ? 'Available' : 'None'} sx={{ bgcolor: canStart ? 'rgba(59,130,246,0.12)' : 'rgba(148,163,184,0.2)', color: canStart ? '#1e40af' : '#334155' }} />
                                  </Badge>
                                  {typeof progressMini === 'number' && (
                                    <Box sx={{ minWidth: 120 }}>
                                      <LinearProgress variant="determinate" value={progressMini} sx={{ height: 6, borderRadius: 99 }} />
                                    </Box>
                                  )}
                                </Stack>
                              )}
                            </Box>
                          </Stack>
                          <Button variant="contained" size={isMobile ? 'medium' : 'small'} startIcon={<PlayArrow />} disabled={!canStart} onClick={() => navigate(path.onClickPath(courseId || ''))} sx={{ textTransform: 'none', borderRadius: 999, color: 'white', width: { xs: '100%', sm: 'auto' } }}>
                            Start
                          </Button>
                        </Stack>
                      </Paper>
                    </Tooltip>
                  );
                })}
                
                <Divider sx={{ my: 0.5, bgcolor: 'rgba(255,255,255,0.2)' }} />
                
                {/* Need Help Card (Kept) */}
                <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(255,255,255,0.35)', background: 'linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(248,250,255,0.55) 100%)', boxShadow: '0 10px 24px rgba(0,0,0,0.10)', backdropFilter: 'blur(10px)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5, color: '#0b1020' }}>
                        Need help?
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(2,10,60,0.8)' }}>
                        Questions about this course? Contact us and we’ll guide you.
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Button size="small" onClick={() => navigate('/contact')} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 1.5, border: '1px solid rgba(14,165,233,0.45)', color: '#0ea5e9' }}>
                            Contact Us
                        </Button>
                        <Button size="small" onClick={() => navigate('/community')} sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 999, px: 1.5, color: '#6b7280' }}>
                            Ask Community
                        </Button>
                    </Stack>
                </Paper>
            </Stack>
          </Grid>
        </Grid>

        {/* Related Courses Section */}
        {(relatedCourses.length > 0 || relatedCoursesLoading) && (
          <Box sx={{ mt: 6 }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold', 
              mb: 3, 
              textAlign: 'center',
              backgroundImage: 'linear-gradient(90deg,#60a5fa,#a78bfa)', 
              WebkitBackgroundClip: 'text', 
              color: 'transparent'
            }}>
              Related Courses You Might Like
            </Typography>
            
            {relatedCoursesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={3}>
                {relatedCourses.map((relatedCourse) => (
                  <Grid item xs={12} sm={6} md={3} key={relatedCourse._id}>
                    <Card sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,255,0.8) 100%)',
                      border: '1px solid rgba(255,255,255,0.6)',
                      boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
                      backdropFilter: 'blur(15px)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
                      }
                    }}>
                      <CardMedia
                        component="div"
                        sx={{
                          height: 140,
                          background: `linear-gradient(135deg, ${relatedCourse.category === 'Technology' ? '#3b82f6' : relatedCourse.category === 'Business' ? '#10b981' : '#8b5cf6'}, ${relatedCourse.category === 'Technology' ? '#1d4ed8' : relatedCourse.category === 'Business' ? '#059669' : '#7c3aed'})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold', opacity: 0.8 }}>
                          {relatedCourse.title.charAt(0)}
                        </Typography>
                        <Box sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'rgba(255,255,255,0.2)',
                          borderRadius: '50%',
                          p: 0.5
                        }}>
                          <School sx={{ color: 'white', fontSize: 20 }} />
                        </Box>
                      </CardMedia>
                      
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold', 
                          mb: 1, 
                          color: '#0b1020',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {relatedCourse.title}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ 
                          color: 'rgba(2,10,60,0.7)', 
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {relatedCourse.description}
                        </Typography>
                        
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                          <Chip 
                            size="small" 
                            label={relatedCourse.category} 
                            sx={{ 
                              bgcolor: 'rgba(59,130,246,0.15)', 
                              color: '#1e40af', 
                              fontWeight: 600 
                            }} 
                          />
                          <Chip 
                            size="small" 
                            label={relatedCourse.level} 
                            sx={{ 
                              bgcolor: 'rgba(139,92,246,0.18)', 
                              color: '#7c3aed', 
                              fontWeight: 600 
                            }} 
                          />
                        </Stack>
                        
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                          <Rating 
                            value={4.5} 
                            readOnly 
                            size="small" 
                            precision={0.5}
                          />
                          <Typography variant="caption" sx={{ color: 'rgba(2,10,60,0.7)' }}>
                            (128 reviews)
                          </Typography>
                        </Stack>
                      </CardContent>
                      
                      <CardActions sx={{ p: 2, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          startIcon={<PlayArrow />}
                          onClick={() => navigate(`/course/${relatedCourse._id}`)}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 'bold',
                            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                            '&:hover': {
                              background: 'linear-gradient(90deg, #2563eb, #7c3aed)'
                            }
                          }}
                        >
                          View Course
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/courses')}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 'bold',
                  px: 4,
                  py: 1.5,
                  borderColor: 'rgba(139,92,246,0.5)',
                  color: '#8b5cf6',
                  '&:hover': {
                    borderColor: '#8b5cf6',
                    bgcolor: 'rgba(139,92,246,0.1)'
                  }
                }}
              >
                Explore All Courses
              </Button>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default LearningHub;
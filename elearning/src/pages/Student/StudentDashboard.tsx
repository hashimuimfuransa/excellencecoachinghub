import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { EmojiEvents, Explore, PlayArrow, TrendingUp } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import ResponsiveDashboard from '../../components/Layout/ResponsiveDashboard';
import { useAuth } from '../../store/AuthContext';
import { enrollmentService, IEnrollment } from '../../services/enrollmentService';
import { courseService, ICourse } from '../../services/courseService';

const StatCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  height: '100%',
  padding: theme.spacing(2.5),
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: theme.spacing(1.5),
  boxShadow: '0 14px 40px rgba(15, 23, 42, 0.08)'
}));

const StepCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  padding: theme.spacing(3),
  height: '100%',
  background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.1), rgba(79, 70, 229, 0.12))',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)'
}));

const CourseCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.spacing(3),
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  boxShadow: '0 18px 40px rgba(15, 23, 42, 0.1)'
}));

const HeroBadge = styled(Chip)(({ theme }) => ({
  backgroundColor: 'rgba(255,255,255,0.2)',
  color: theme.palette.common.white,
  fontWeight: 600,
  backdropFilter: 'blur(8px)'
}));

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [enrollments, setEnrollments] = useState<IEnrollment[]>([]);
  const [relatedCourses, setRelatedCourses] = useState<ICourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setEnrollments([]);
        setRelatedCourses([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const enrollmentResponse = await enrollmentService.getMyEnrollments({ limit: 12 });
        const rawEnrollments = enrollmentResponse.enrollments || [];
        const filteredEnrollments = rawEnrollments.filter(enrollment => enrollment?.course);
        setEnrollments(filteredEnrollments);
        let recommended: ICourse[] = [];
        if (filteredEnrollments.length > 0) {
          const primaryCategory = filteredEnrollments[0]?.course?.category;
          if (primaryCategory) {
            try {
              const categoryResponse = await courseService.getPublicCourses({ limit: 6, category: primaryCategory });
              recommended = categoryResponse.courses || [];
            } catch {
              recommended = [];
            }
          }
        }
        if (recommended.length === 0) {
          try {
            const fallbackResponse = await courseService.getPublicCourses({ limit: 6 });
            recommended = fallbackResponse.courses || [];
          } catch {
            recommended = [];
          }
        }
        if (recommended.length > 0) {
          const enrolledIds = new Set(
            filteredEnrollments
              .map(enrollment => enrollment.course?._id)
              .filter((id): id is string => Boolean(id))
          );
          setRelatedCourses(recommended.filter(course => !enrolledIds.has(course._id)).slice(0, 4));
        } else {
          setRelatedCourses([]);
        }
      } catch (loadError) {
        console.warn('Unable to load student dashboard data', loadError);
        setEnrollments([]);
        setRelatedCourses([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const stats = useMemo(() => {
    if (enrollments.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        averageProgress: 0
      };
    }
    const total = enrollments.length;
    const completed = enrollments.filter(item => item.progress?.totalProgress >= 100).length;
    const inProgress = enrollments.filter(item => (item.progress?.totalProgress || 0) > 0 && (item.progress?.totalProgress || 0) < 100).length;
    const averageProgress = Math.round(
      enrollments.reduce((sum, item) => sum + (item.progress?.totalProgress || 0), 0) / total
    );
    return { total, completed, inProgress, averageProgress };
  }, [enrollments]);

  const activeEnrollment = useMemo(() => {
    if (enrollments.length === 0) {
      return undefined;
    }
    const next = enrollments.find(item => item.progress?.totalProgress !== undefined && item.progress.totalProgress < 100 && item.isActive);
    return next || enrollments[0];
  }, [enrollments]);

  const learningSteps = useMemo(() => {
    if (!activeEnrollment) {
      return [
        {
          title: 'Discover a course that matches your ambition',
          detail: 'Browse curated programs designed to fast-track your goals and add your first course to the journey.',
          actionLabel: 'Browse courses',
          onClick: () => navigate('/courses')
        },
        {
          title: 'Build momentum with a guided roadmap',
          detail: 'Each course packs a structured path with milestones and support so you always know the next move.',
          actionLabel: 'View learning paths',
          onClick: () => navigate('/courses')
        },
        {
          title: 'Stay inspired with tailored recommendations',
          detail: 'Unlock career tips, live sessions, and practice material aligned with the skills you want to sharpen.',
          actionLabel: 'Explore opportunities',
          onClick: () => navigate('/dashboard/student/opportunities')
        }
      ];
    }
    return [
      {
        title: 'Review today’s learning focus',
        detail: 'Jump into your course journey to see upcoming lessons, assignments, and achievements waiting for you.',
        actionLabel: 'Open course journey',
        onClick: () => navigate(`/dashboard/student/course/${activeEnrollment.course._id}`)
      },
      {
        title: 'Join live or catch up on sessions',
        detail: 'Connect with instructors, ask questions, and replay recent classes to reinforce understanding.',
        actionLabel: 'View live schedule',
        onClick: () => navigate('/dashboard/student/live-sessions')
      },
      {
        title: 'Practice and validate your knowledge',
        detail: 'Tackle assessments, quizzes, and projects to earn badges while building confidence in the material.',
        actionLabel: 'Practice now',
        onClick: () => navigate('/dashboard/student/assessments')
      }
    ];
  }, [activeEnrollment, navigate]);

  if (loading) {
    return (
      <ResponsiveDashboard>
        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress size={48} />
          </Box>
        </Container>
      </ResponsiveDashboard>
    );
  }

  if (error) {
    return (
      <ResponsiveDashboard>
        <Container maxWidth="md" sx={{ py: 6 }}>
          <Alert severity="error" sx={{ borderRadius: 3, boxShadow: '0 12px 32px rgba(239, 68, 68, 0.15)' }}>
            {error}
          </Alert>
        </Container>
      </ResponsiveDashboard>
    );
  }

  return (
    <ResponsiveDashboard>
      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 5 } }}>
        <Stack spacing={{ xs: 4, md: 6 }}>
          <Box
            sx={{
              position: 'relative',
              borderRadius: { xs: 4, md: 5 },
              p: { xs: 3, sm: 5 },
              background: 'linear-gradient(135deg, #4338CA 0%, #0EA5E9 100%)',
              color: 'common.white',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.25), transparent 55%)', opacity: 0.5 }} />
            <Stack spacing={3} sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                <HeroBadge label="Your learning hub" />
                {stats.averageProgress > 0 && (
                  <HeroBadge label={`Avg progress ${stats.averageProgress}%`} />
                )}
              </Stack>
              <Typography variant={isMobile ? 'h4' : 'h3'} fontWeight={700} lineHeight={1.2} sx={{ maxWidth: { md: '60%' } }}>
                {`Welcome back, ${user?.firstName || 'Super Learner'}!`}
              </Typography>
              <Typography variant="h6" sx={{ maxWidth: { md: '60%' }, color: 'rgba(255,255,255,0.88)', fontWeight: 400 }}>
                {activeEnrollment
                  ? `Pick up where you left off in ${activeEnrollment.course.title}. Stay on track with curated steps, progress insights, and recommendations tailored to your goals.`
                  : 'Start your journey with immersive courses, hands-on projects, and guidance every step of the way.'}
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="inherit"
                  startIcon={<PlayArrow />}
                  onClick={() => {
                    if (activeEnrollment) {
                      navigate(`/dashboard/student/course/${activeEnrollment.course._id}`);
                    } else {
                      navigate('/courses');
                    }
                  }}
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 700,
                    px: 3,
                    py: 1.5,
                    borderRadius: 3,
                    boxShadow: '0 14px 28px rgba(15, 23, 42, 0.25)'
                  }}
                >
                  {activeEnrollment ? 'Continue learning' : 'Explore courses'}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<Explore />}
                  onClick={() => navigate('/dashboard/student/courses')}
                  sx={{
                    borderRadius: 3,
                    borderColor: 'rgba(255,255,255,0.8)',
                    color: 'common.white',
                    fontWeight: 600,
                    px: 3,
                    py: 1.5,
                    '&:hover': { borderColor: 'common.white', backgroundColor: 'rgba(255,255,255,0.12)' }
                  }}
                >
                  See all courses
                </Button>
              </Stack>
            </Stack>
          </Box>

          <Grid container spacing={{ xs: 2, md: 3 }}>
            <Grid item xs={6} md={3}>
              <StatCard>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Enrolled Courses
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TrendingUp color="primary" />
                  <Typography variant="h4" fontWeight={700}>
                    {stats.total}
                  </Typography>
                </Stack>
              </StatCard>
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Courses Completed
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmojiEvents color="secondary" />
                  <Typography variant="h4" fontWeight={700}>
                    {stats.completed}
                  </Typography>
                </Stack>
              </StatCard>
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  In Progress
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {stats.inProgress}
                </Typography>
              </StatCard>
            </Grid>
            <Grid item xs={6} md={3}>
              <StatCard>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                  Average Progress
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {`${stats.averageProgress}%`}
                </Typography>
                <LinearProgress variant="determinate" value={stats.averageProgress} sx={{ borderRadius: 2, height: 8 }} />
              </StatCard>
            </Grid>
          </Grid>

          <Box>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1} sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={700}>
                Your guided path
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Structured steps crafted to keep your learning momentum high
              </Typography>
            </Stack>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {learningSteps.map((step, index) => (
                <Grid item xs={12} md={4} key={step.title}>
                  <StepCard>
                    <Chip label={`Step ${index + 1}`} color="primary" sx={{ alignSelf: 'flex-start', mb: 2, fontWeight: 600 }} />
                    <Stack spacing={2}>
                      <Typography variant="h6" fontWeight={700}>
                        {step.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {step.detail}
                      </Typography>
                      <Button variant="contained" onClick={step.onClick} sx={{ borderRadius: 2, mt: 1 }}>
                        {step.actionLabel}
                      </Button>
                    </Stack>
                  </StepCard>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box>
            <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1} sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={700}>
                My courses
              </Typography>
              {enrollments.length > 0 && (
                <Button variant="text" onClick={() => navigate('/dashboard/student/courses')} sx={{ fontWeight: 600 }}>
                  Manage all
                </Button>
              )}
            </Stack>
            {enrollments.length === 0 ? (
              <Card sx={{ borderRadius: 3, p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  You have no active enrollments yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Discover expert-led courses, follow guided steps, and track progress from one inspiring hub.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/courses')} sx={{ borderRadius: 2 }}>
                  Browse catalog
                </Button>
              </Card>
            ) : (
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {enrollments.map(enrollment => {
                  const course = enrollment.course;
                  if (!course) {
                    return null;
                  }
                  const progress = enrollment.progress?.totalProgress || 0;
                  const chipColor = progress >= 100 ? 'success' : progress > 0 ? 'primary' : 'default';
                  const chipLabel = progress >= 100 ? 'Completed' : progress > 0 ? 'In progress' : 'Not started';
                  return (
                    <Grid item xs={12} md={6} key={enrollment._id}>
                      <CourseCard>
                        <Box
                          sx={{
                            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            color: theme.palette.common.white,
                            p: 3
                          }}
                        >
                          <Stack spacing={1.5}>
                            <Typography variant="overline" sx={{ opacity: 0.85 }}>
                              {course.category || 'General'}
                            </Typography>
                            <Typography variant="h5" fontWeight={700}>
                              {course.title}
                            </Typography>
                            <Chip label={chipLabel} color={chipColor} sx={{ alignSelf: 'flex-start', fontWeight: 600 }} />
                          </Stack>
                        </Box>
                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <Stack spacing={1.5}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                                Course progress
                              </Typography>
                              <Typography variant="h6" fontWeight={700} color={progress >= 100 ? 'success.main' : 'primary.main'}>
                                {`${progress}%`}
                              </Typography>
                            </Stack>
                            <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 2, height: 8 }} />
                            <Typography variant="body2" color="text.secondary">
                              {progress >= 100
                                ? 'Celebrate your achievement and download your certificate.'
                                : progress >= 60
                                  ? 'Fantastic momentum. Keep pushing to reach mastery.'
                                  : progress > 0
                                    ? 'Great start. Continue learning to unlock the next badge.'
                                    : 'Kick things off with lesson one and set your study rhythm.'}
                            </Typography>
                          </Stack>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                            <Button
                              fullWidth
                              variant="contained"
                              startIcon={<PlayArrow />}
                              onClick={() => navigate(`/dashboard/student/course/${course._id}`)}
                              sx={{ borderRadius: 2 }}
                            >
                              {progress >= 100 ? 'View certificate' : 'Continue learning'}
                            </Button>
                            <Button
                              fullWidth
                              variant="outlined"
                              onClick={() => navigate(`/dashboard/student/course/${course._id}/weeks`)}
                              sx={{ borderRadius: 2 }}
                            >
                              Open roadmap
                            </Button>
                          </Stack>
                        </CardContent>
                      </CourseCard>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>

          {relatedCourses.length > 0 && (
            <Box>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={1} sx={{ mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                  Recommended for you
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Curated picks that complement your current learning focus
                </Typography>
              </Stack>
              <Grid container spacing={{ xs: 2, md: 3 }}>
                {relatedCourses.map(course => (
                  <Grid item xs={12} md={3} key={course._id}>
                    <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 14px 36px rgba(15, 23, 42, 0.08)' }}>
                      <Box
                        sx={{
                          background: 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(14,165,233,0.2))',
                          p: 3,
                          minHeight: 140,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 1
                        }}
                      >
                        <Typography variant="overline" color="primary">
                          {course.category}
                        </Typography>
                        <Typography variant="h6" fontWeight={700}>
                          {course.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {course.description?.slice(0, 110) || 'Upskill with engaging content and real-world projects.'}
                        </Typography>
                      </Box>
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Stack direction="row" spacing={1}>
                          <Chip label={course.level} size="small" variant="outlined" />
                          <Chip label={`${course.duration} hrs`} size="small" variant="outlined" />
                        </Stack>
                        <Button variant="contained" onClick={() => navigate(`/courses/${course._id}`)} sx={{ borderRadius: 2, mt: 'auto' }}>
                          Explore course
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Stack>
      </Container>
    </ResponsiveDashboard>
  );
};

export default StudentDashboard;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Container,
  Stack,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Fab,
  Badge,
  Snackbar
} from '@mui/material';
import {
  Work,
  Person,
  TrendingUp,
  Notifications,
  Add,
  Business,
  School,
  Bookmark,
  Search,
  LocationOn,
  AttachMoney,
  Schedule,
  Visibility,
  CheckCircle,
  ArrowForward,
  Refresh,
  Psychology,
  MenuBook,
  Assignment,
  EmojiEvents,
  Speed,
  Timeline,
  LocalOffer,
  PlayArrow,
  Filter,
  Sort,
  Share,
  BookmarkBorder,
  Send,
  KeyboardArrowRight,
  Star,
  TrendingDown,
  TrendingFlat,
  CalendarToday,
  Warning,
  Info,
  Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../contexts/AuthContext';
import { jobService } from '../services/jobService';
import { jobApplicationService } from '../services/jobApplicationService';
import { certificateService } from '../services/certificateService';
import { userService } from '../services/userService';
import WelcomeSetupCard from '../components/WelcomeSetupCard';
import ModernProfileCompletion from '../components/ModernProfileCompletion';
import JobRecommendations from '../components/JobRecommendations';


// Enhanced interfaces
interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  status: string;
  salary?: string;
  postedAt?: string;
  deadline?: string;
  skills?: string[];
  logo?: string;
  urgency?: 'high' | 'medium' | 'low';
  remote?: boolean;
}

interface JobApplication {
  _id: string;
  job: Job;
  applicant: any;
  status: 'pending' | 'reviewing' | 'interview' | 'rejected' | 'accepted';
  appliedAt?: string;
  interviewDate?: string;
  feedback?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  action: () => void;
  badge?: number;
}

interface ActivityItem {
  id: string;
  type: 'application' | 'interview' | 'job_saved' | 'profile_view' | 'certificate';
  title: string;
  description: string;
  time: string;
  status?: string;
  icon: React.ReactElement;
  color: string;
}

const ModernDashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  
  // Force navigation using window.location to ensure page actually changes
  const forceNavigate = (path: string, context?: string) => {
    console.log(`🔍 [Force Navigation] Navigating to: ${path} from: ${context || 'unknown'}`);
    console.log('🔍 [Force Navigation] Current location:', window.location.pathname);
    
    // Use window.location.href to force actual navigation
    window.location.href = path;
  };
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState({
    totalApplications: 0,
    interviewsScheduled: 0,
    savedJobs: 0,
    profileViews: 0,
    skillMatchingJobs: 0
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);


  const isJobSeeker = hasRole(UserRole.PROFESSIONAL) || hasRole(UserRole.STUDENT);
  
  // Calculate profile completion
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    let score = 0;
    const checks = [
      { field: user.firstName, weight: 5 },
      { field: user.lastName, weight: 5 },
      { field: user.email, weight: 5 },
      { field: user.phone, weight: 15 },
      { field: user.location, weight: 15 },
      { field: user.bio, weight: 20 },
      { field: user.skills?.length > 0, weight: 15 },
      { field: user.experience?.length > 0, weight: 20 }
    ];
    checks.forEach(check => {
      if (check.field) score += check.weight;
    });
    return score;
  };
  
  const profileCompletion = calculateProfileCompletion();
  const isProfileComplete = profileCompletion >= 70;

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchJobs(),
        fetchApplications(),
        fetchStats(),
        fetchActivity()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await jobService.getCuratedJobs(1, 6);
      setRecentJobs(response.data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const userApplications = await jobApplicationService.getUserApplications();
      setApplications(userApplications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Mock data for now - replace with actual API calls
      setStats({
        totalApplications: applications.length || 12,
        interviewsScheduled: 3,
        savedJobs: 8,
        profileViews: 45,
        skillMatchingJobs: 23
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchActivity = async () => {
    // Mock activity data
    const mockActivity: ActivityItem[] = [
      {
        id: '1',
        type: 'application',
        title: 'Application Submitted',
        description: 'Frontend Developer at Tech Solutions Inc.',
        time: '2 hours ago',
        status: 'pending',
        icon: <Send />,
        color: 'primary'
      },
      {
        id: '2',
        type: 'interview',
        title: 'Interview Scheduled',
        description: 'Data Analyst position tomorrow at 2:00 PM',
        time: '5 hours ago',
        status: 'scheduled',
        icon: <CalendarToday />,
        color: 'success'
      },
      {
        id: '3',
        type: 'profile_view',
        title: 'Profile Viewed',
        description: 'Your profile was viewed by Creative Design Studio',
        time: '1 day ago',
        icon: <Visibility />,
        color: 'info'
      }
    ];
    setRecentActivity(mockActivity);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    setSnackbarMessage('Dashboard updated!');
    setSnackbarOpen(true);
  };

  // Quick actions for job seekers
  const quickActions: QuickAction[] = [
    {
      id: 'prepare-job',
      title: 'Prepare for Jobs',
      description: 'Psychometric tests, AI interviews & more',
      icon: <Psychology />,
      color: theme.palette.primary.main,
      action: () => forceNavigate('/app/career-guidance', 'learn and grow quick action'),
      badge: 5 // Number of preparation options
    },
    {
      id: 'find-jobs',
      title: 'Find Jobs',
      description: 'Browse and apply to opportunities',
      icon: <Search />,
      color: theme.palette.secondary.main,
      action: () => forceNavigate('/app/jobs', 'find jobs quick action'),
      badge: stats.skillMatchingJobs
    },
    {
      id: 'applications',
      title: 'My Applications',
      description: 'Track your applications',
      icon: <Assignment />,
      color: theme.palette.info.main,
      action: () => forceNavigate('/app/applications', 'applications quick action'),
      badge: stats.totalApplications
    },
    {
      id: 'learn',
      title: 'Live Courses',
      description: 'Expert-led learning sessions',
      icon: <MenuBook />,
      color: theme.palette.success.main,
      action: () => window.open('https://www.elearning.excellencecoachinghub.com/', '_blank')
    }
  ];

  // Enhanced stat card with better visual hierarchy
  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactElement;
    color: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    onClick?: () => void;
  }> = ({ title, value, icon, color, subtitle, trend, trendValue, onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        border: `1px solid ${alpha(color, 0.2)}`,
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: `0 8px 25px ${alpha(color, 0.3)}`,
          border: `1px solid ${color}`
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: alpha(color, 0.1),
              color: color
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Chip
              icon={
                trend === 'up' ? <TrendingUp /> :
                trend === 'down' ? <TrendingDown /> :
                <TrendingFlat />
              }
              label={trendValue}
              size="small"
              color={trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'default'}
              variant="outlined"
            />
          )}
        </Stack>
        <Typography variant="h3" fontWeight="bold" color={color} gutterBottom>
          {value}
        </Typography>
        <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Quick action card
  const QuickActionCard: React.FC<{ action: QuickAction }> = ({ action }) => (
    <Card
      sx={{
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: `1px solid ${alpha(action.color, 0.2)}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 30px ${alpha(action.color, 0.3)}`,
          border: `1px solid ${action.color}`
        }
      }}
      onClick={action.action}
    >
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <Badge badgeContent={action.badge} color="error" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              borderRadius: '16px',
              bgcolor: alpha(action.color, 0.1),
              color: action.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto'
            }}
          >
            {action.icon}
          </Box>
        </Badge>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          {action.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {action.description}
        </Typography>
      </CardContent>
    </Card>
  );



  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography variant="h3" fontWeight="bold" gutterBottom>
            Hello, {user?.firstName}! 👋
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Ready to take the next step in your career?
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Tooltip title="Notifications">
            <IconButton>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Refresh dashboard">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Welcome Setup for New Users */}
      {isNewUser && showWelcome && (
        <WelcomeSetupCard onDismiss={() => setShowWelcome(false)} />
      )}

      {/* Profile Completion for Existing Users */}
      {!isNewUser && user && (
        <ModernProfileCompletion 
          user={user}
          onEditProfile={() => forceNavigate('/app/profile', 'profile completion button')}
        />
      )}

      {/* Quick Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Applications"
            value={stats.totalApplications}
            icon={<Assignment />}
            color={theme.palette.primary.main}
            subtitle="This month"
            trend="up"
            trendValue="+12%"
            onClick={() => forceNavigate('/app/applications', 'applications stat card')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Interviews"
            value={stats.interviewsScheduled}
            icon={<CalendarToday />}
            color={theme.palette.success.main}
            subtitle="Scheduled"
            trend="up"
            trendValue="+1"
            onClick={() => forceNavigate('/app/interviews', 'interviews stat card')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Saved Jobs"
            value={stats.savedJobs}
            icon={<Bookmark />}
            color={theme.palette.info.main}
            subtitle="Favorites"
            onClick={() => forceNavigate('/app/saved-jobs', 'saved jobs stat card')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Profile Views"
            value={stats.profileViews}
            icon={<Visibility />}
            color={theme.palette.warning.main}
            subtitle="This week"
            trend="up"
            trendValue="+8"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Job Matches"
            value={stats.skillMatchingJobs}
            icon={<TrendingUp />}
            color={theme.palette.secondary.main}
            subtitle="Based on skills"
            onClick={() => forceNavigate('/app/jobs', 'job matches stat card')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          {/* Quick Actions */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom mb={3}>
              Quick Actions
            </Typography>
            <Grid container spacing={3}>
              {quickActions.map((action) => (
                <Grid item xs={12} sm={6} md={3} key={action.id}>
                  <QuickActionCard action={action} />
                </Grid>
              ))}
            </Grid>
          </Paper>

          {/* Recommended Jobs */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <JobRecommendations
              jobs={recentJobs}
              title="Recommended for You"
              subtitle="Jobs that match your skills and preferences"
              onViewAll={() => forceNavigate('/app/jobs', 'job recommendations view all')}
              compact
            />
          </Paper>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          {/* Recent Activity */}
          <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom mb={2}>
              Recent Activity
            </Typography>
            <List>
              {recentActivity.map((activity) => (
                <ListItem key={activity.id} sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32, 
                        bgcolor: alpha(theme.palette[activity.color as keyof typeof theme.palette].main, 0.1),
                        color: theme.palette[activity.color as keyof typeof theme.palette].main
                      }}
                    >
                      {activity.icon}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={activity.title}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {activity.description}
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                          {activity.time}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            {recentActivity.length === 0 && (
              <Box textAlign="center" py={3}>
                <Timeline sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  No recent activity
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Job Preparation Hub */}
          <Paper 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
            }}
          >
            <Typography variant="h6" fontWeight="bold" gutterBottom color="success.main">
              🎯 Job Preparation Hub
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Get ready for your dream job with comprehensive preparation resources.
            </Typography>
            
            <Stack spacing={1.5}>
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
                onClick={() => forceNavigate('/app/tests', 'psychometric tests')}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Psychology sx={{ color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="medium">
                      Psychometric Tests
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Real questions from recent years
                    </Typography>
                  </Box>
                </Stack>
              </Box>
              
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: alpha(theme.palette.secondary.main, 0.05),
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  }
                }}
                onClick={() => forceNavigate('/app/interviews', 'AI mock interviews')}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Assignment sx={{ color: 'secondary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="medium">
                      AI Mock Interviews
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Job-specific interview practice
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Button
                variant="contained"
                fullWidth
                startIcon={<EmojiEvents />}
                onClick={() => forceNavigate('/app/career-guidance', 'start preparing for job')}
                sx={{ 
                  textTransform: 'none',
                  mt: 2,
                  background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.primary.main} 90%)`
                }}
              >
                Start Preparing for Job
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        onClick={() => forceNavigate('/app/tests', 'floating action button')}
      >
        <Psychology />
      </Fab>

      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>


    </Container>
  );
};

export default ModernDashboardPage;
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  Paper,
  Container,
  Stack,
  IconButton,
  Tooltip,
  Badge,
  useTheme,
  alpha,
  CircularProgress,
  Skeleton,
  Alert,
  AlertTitle,
  CardActions,
  CardHeader,
  Fade,
  Slide,
  Zoom,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import ProfileCompletionDashboard from '../components/ProfileCompletionDashboard';
import FloatingContact from '../components/FloatingContact';
import {
  Work,
  Person,
  People,
  Assessment,
  EmojiEvents,
  TrendingUp,
  Notifications,
  Add,
  Business,
  School,
  Bookmark,
  Search,
  Star,
  StarBorder,
  LocationOn,
  AttachMoney,
  Schedule,
  Visibility,
  CheckCircle,
  ArrowForward,
  Refresh,
  BarChart,
  Timeline,
  Lightbulb,
  MenuBook,
  Psychology,
  Close,
  Warning,
  Info,
  AutoAwesome,
  Insights,
  TrendingDown,
  TrendingFlat,
  CalendarToday,
  AccessTime,
  Speed,
  Group,
  LocalOffer,
  Assignment,
  PlayCircleOutline,
  BookmarkBorder,
  Share,
  GetApp
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../contexts/AuthContext';
import { jobService } from '../services/jobService';
import { jobApplicationService } from '../services/jobApplicationService';
import { profileService } from '../services/profileService';
import { certificateService } from '../services/certificateService';
import { userService } from '../services/userService';

// Local interfaces to avoid import issues
interface Job {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  jobType: string;
  experienceLevel: string;
  status: string;
  salary?: {
    min: number;
    max: number;
    currency: string;
  } | string;
  postedAt?: string;
  deadline?: string;
  skills?: string[];
  logo?: string;
}

interface JobApplication {
  _id: string;
  job: Job;
  applicant: any;
  status: string;
  appliedAt?: string;
}

interface JobCertificate {
  _id: string;
  user: any;
  type: string;
  title: string;
  issuedAt: string;
  issuer?: string;
  expiresAt?: string;
  credentialId?: string;
}

interface Skill {
  name: string;
  level: number;
}

interface RecommendedCourse {
  id: string;
  title: string;
  provider: string;
  duration: string;
  level: string;
  image?: string;
}

// Mock data for demonstration
const mockJobs: Job[] = [
  {
    _id: '1',
    title: 'Frontend Developer',
    description: 'We are looking for a skilled frontend developer...',
    company: 'Tech Solutions Inc.',
    location: 'Remote',
    jobType: 'Full-time',
    experienceLevel: 'Mid-level',
    status: 'active',
    salary: '$70,000 - $90,000',
    postedAt: '2023-05-15T10:30:00Z',
    deadline: '2023-06-15T23:59:59Z',
    skills: ['React', 'TypeScript', 'CSS', 'HTML']
  },
  {
    _id: '2',
    title: 'Data Analyst',
    description: 'Join our data team to analyze business metrics...',
    company: 'Data Insights Co.',
    location: 'New York, NY',
    jobType: 'Full-time',
    experienceLevel: 'Entry-level',
    status: 'active',
    salary: '$60,000 - $75,000',
    postedAt: '2023-05-18T14:45:00Z',
    deadline: '2023-06-18T23:59:59Z',
    skills: ['SQL', 'Python', 'Excel', 'Tableau']
  },
  {
    _id: '3',
    title: 'UX/UI Designer',
    description: 'Design beautiful and intuitive user interfaces...',
    company: 'Creative Design Studio',
    location: 'San Francisco, CA',
    jobType: 'Contract',
    experienceLevel: 'Senior',
    status: 'active',
    salary: '$90,000 - $120,000',
    postedAt: '2023-05-20T09:15:00Z',
    deadline: '2023-06-20T23:59:59Z',
    skills: ['Figma', 'Adobe XD', 'Sketch', 'User Research']
  }
];

const mockApplications: JobApplication[] = [
  {
    _id: 'app1',
    job: mockJobs[0],
    applicant: { id: 'user1', name: 'John Doe' },
    status: 'pending',
    appliedAt: '2023-05-16T11:30:00Z'
  },
  {
    _id: 'app2',
    job: mockJobs[1],
    applicant: { id: 'user1', name: 'John Doe' },
    status: 'interview',
    appliedAt: '2023-05-19T10:15:00Z'
  }
];

const mockCertificates: JobCertificate[] = [
  {
    _id: 'cert1',
    user: { id: 'user1', name: 'John Doe' },
    type: 'technical',
    title: 'AWS Certified Solutions Architect',
    issuedAt: '2023-01-15T00:00:00Z',
    issuer: 'Amazon Web Services',
    expiresAt: '2026-01-15T00:00:00Z',
    credentialId: 'AWS-123456'
  },
  {
    _id: 'cert2',
    user: { id: 'user1', name: 'John Doe' },
    type: 'soft-skills',
    title: 'Leadership Excellence',
    issuedAt: '2023-03-10T00:00:00Z',
    issuer: 'Excellence Coaching Hub',
    credentialId: 'ECH-789012'
  }
];

const mockSkills: Skill[] = [
  { name: 'JavaScript', level: 85 },
  { name: 'React', level: 80 },
  { name: 'TypeScript', level: 70 },
  { name: 'Node.js', level: 65 },
  { name: 'CSS/SCSS', level: 90 }
];

const mockRecommendedCourses: RecommendedCourse[] = [
  {
    id: 'course1',
    title: 'Advanced React Patterns',
    provider: 'Excellence Coaching Hub',
    duration: '6 weeks',
    level: 'Intermediate',
    image: ''
  },
  {
    id: 'course2',
    title: 'Data Visualization with D3.js',
    provider: 'Excellence Coaching Hub',
    duration: '4 weeks',
    level: 'Intermediate',
    image: ''
  }
];

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  // Helper function to format salary
  const formatSalary = (salary?: { min: number; max: number; currency: string } | string) => {
    if (!salary) return 'Competitive salary';
    if (typeof salary === 'string') return salary;
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.currency} ${salary.max.toLocaleString()}`;
  };
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Real data states
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [certificates, setCertificates] = useState<JobCertificate[]>([]);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [dashboardStats, setDashboardStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    certificates: 0,
    completedTests: 0,
    savedJobs: 0,
    profileViews: 0,
    profileCompleteness: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [recommendedCourses] = useState<RecommendedCourse[]>(mockRecommendedCourses); // Keep mock for now
  const [freshUserData, setFreshUserData] = useState<any>(null);
  const [userDataVersion, setUserDataVersion] = useState(0);
  const [preparationDialogOpen, setPreparationDialogOpen] = useState(false);

  const isStudent = hasRole(UserRole.STUDENT);
  const isJobSeeker = hasRole(UserRole.PROFESSIONAL) || hasRole(UserRole.JOB_SEEKER);
  const isEmployer = hasRole(UserRole.EMPLOYER);

  // For job seekers (students or professionals)
  const isJobSeekerView = isStudent || isJobSeeker;

  // Data fetching functions
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch jobs
      if (isJobSeekerView) {
        await Promise.all([
          fetchRecentJobs(),
          fetchUserApplications(),
          fetchUserCertificates(),
          fetchProfileData(),
          fetchFreshUserData()
        ]);
      } else if (isEmployer) {
        await Promise.all([
          fetchEmployerJobs(),
          fetchEmployerApplications()
        ]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentJobs = async () => {
    try {
      setJobsLoading(true);
      const response = await jobService.getCuratedJobs(1, 6);
      setRecentJobs(response.data || []);
      setDashboardStats(prev => ({ ...prev, totalJobs: response.pagination?.total || 0 }));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setRecentJobs(mockJobs); // Fallback to mock data
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    try {
      setApplicationsLoading(true);
      const userApplications = await jobApplicationService.getUserApplications();
      setApplications(userApplications || []);
      // Use real application count from user profile or fetched applications count
      const userData = freshUserData || user;
      const applicationCount = userData?.applicationCount || userApplications?.length || 0;
      setDashboardStats(prev => ({ ...prev, totalApplications: applicationCount }));
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications(mockApplications); // Fallback to mock data
    } finally {
      setApplicationsLoading(false);
    }
  };

  const fetchUserCertificates = async () => {
    try {
      setCertificatesLoading(true);
      const userCertificates = await certificateService.getUserCertificates();
      setCertificates(userCertificates || []);
      setDashboardStats(prev => ({ ...prev, certificates: userCertificates?.length || 0 }));
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setCertificates(mockCertificates); // Fallback to mock data
    } finally {
      setCertificatesLoading(false);
    }
  };

  const fetchFreshUserData = async () => {
    try {
      if (!user?._id) return;
      
      console.log('🔍 Dashboard fetching fresh user data for:', user._id);
      const freshUser = await userService.getUserProfile(user._id);
      console.log('📋 Dashboard received fresh user data:', freshUser);
      setFreshUserData(freshUser);
      setUserDataVersion(prev => prev + 1);
    } catch (error) {
      console.error('❌ Error fetching fresh user data:', error);
      // Fallback to auth user data
      setFreshUserData(user);
    }
  };

  const fetchProfileData = async () => {
    try {
      const profileStatus = await profileService.getProfileCompletionStatus();
      const completionPercentage = isStudent 
        ? profileStatus.student.completionPercentage 
        : profileStatus.jobSeeker.completionPercentage;
      
      setProfileCompletion(completionPercentage);
      // Get real stats from user data
      const userData = freshUserData || user;
      setDashboardStats(prev => ({ 
        ...prev, 
        profileCompleteness: completionPercentage,
        profileViews: userData?.profileViews || 0,
        savedJobs: userData?.savedJobsCount || 0,
        completedTests: userData?.testsCompletedCount || 0
      }));

      // Fetch skills if job seeker profile exists
      if (profileStatus.jobSeeker.exists) {
        const profile = await profileService.getJobSeekerProfile();
        if (profile.skills) {
          const skillsWithLevels = profile.skills.map(skill => ({
            name: skill,
            level: Math.floor(Math.random() * 40) + 60 // Mock levels for now
          }));
          setSkills(skillsWithLevels);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setSkills(mockSkills); // Fallback to mock data
      setProfileCompletion(85);
    }
  };

  const fetchEmployerJobs = async () => {
    try {
      setJobsLoading(true);
      const employerJobs = await jobService.getJobsByEmployer();
      setRecentJobs(employerJobs || []);
      setDashboardStats(prev => ({ ...prev, totalJobs: employerJobs?.length || 0 }));
    } catch (error) {
      console.error('Error fetching employer jobs:', error);
      setRecentJobs([]);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchEmployerApplications = async () => {
    try {
      setApplicationsLoading(true);
      const employerApplications = await jobApplicationService.getEmployerApplications();
      setApplications(employerApplications || []);
      setDashboardStats(prev => ({ ...prev, totalApplications: employerApplications?.length || 0 }));
    } catch (error) {
      console.error('Error fetching employer applications:', error);
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchDashboardData();
  }, [user, isJobSeekerView, isEmployer]);

  const recentApplications = applications.slice(0, 5);

  // Data refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // Refresh user data when component mounts or user changes
  useEffect(() => {
    if (user && !loading) {
      fetchFreshUserData();
    }
  }, [user]);

  // Refresh data when the page becomes visible (user returns from profile page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('🔄 Page became visible, refreshing user data');
        fetchFreshUserData();
      }
    };

    const handleFocus = () => {
      if (user) {
        console.log('🔄 Window focused, refreshing user data');
        fetchFreshUserData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  // Enhanced stat card with animation and better styling
  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactElement;
    color: string;
    onClick?: () => void;
    subtitle?: string;
  }> = ({ title, value, icon, color, onClick, subtitle }) => (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        height: '100%',
        transition: 'transform 0.3s, box-shadow 0.3s',
        '&:hover': onClick ? { 
          transform: 'translateY(-5px)', 
          boxShadow: theme.shadows[10] 
        } : {}
      }}
      onClick={onClick}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="h6" fontWeight="medium" color="text.primary">
            {title}
          </Typography>
          <Avatar sx={{ bgcolor: alpha(color, 0.2), color: color, width: 40, height: 40 }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h3" component="div" fontWeight="bold" mb={1}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  // Job card component for better job display
  const JobCard: React.FC<{ job: Job }> = ({ job }) => {
    const postedDate = job.postedAt ? new Date(job.postedAt) : new Date();
    const daysAgo = Math.floor((new Date().getTime() - postedDate.getTime()) / (1000 * 3600 * 24));
    
    return (
      <Card sx={{ 
        mb: 2, 
        transition: 'transform 0.2s',
        '&:hover': { 
          transform: 'translateX(5px)',
          boxShadow: 3
        }
      }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" component="h3" fontWeight="bold">
                {job.title}
              </Typography>
              <Typography variant="subtitle1" color="primary.main" gutterBottom>
                {job.company}
              </Typography>
            </Box>
            <IconButton size="small">
              <Bookmark />
            </IconButton>
          </Box>
          
          <Stack direction="row" spacing={2} mb={2} flexWrap="wrap">
            <Box display="flex" alignItems="center">
              <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{job.location}</Typography>
            </Box>
            {job.salary && (
              <Box display="flex" alignItems="center">
                <AttachMoney fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2">{formatSalary(job.salary)}</Typography>
              </Box>
            )}
            <Box display="flex" alignItems="center">
              <Schedule fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}</Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={1} mb={2} flexWrap="wrap">
            <Chip 
              label={job.jobType} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={job.experienceLevel} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
            {job.skills && job.skills.slice(0, 2).map(skill => (
              <Chip 
                key={skill} 
                label={skill} 
                size="small" 
                variant="outlined"
              />
            ))}
            {job.skills && job.skills.length > 2 && (
              <Chip 
                label={`+${job.skills.length - 2} more`} 
                size="small" 
                variant="outlined"
              />
            )}
          </Stack>
          
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Button 
              variant="contained" 
              size="small" 
              color="primary"
              onClick={() => navigate(`/app/jobs/${job._id}`)}
              endIcon={<ArrowForward />}
            >
              View Details
            </Button>
            <Typography variant="caption" color="text.secondary">
              {job.deadline ? `Deadline: ${new Date(job.deadline).toLocaleDateString()}` : 'Open until filled'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Application card component
  const ApplicationCard: React.FC<{ application: JobApplication }> = ({ application }) => {
    const getStatusColor = (status: string) => {
      switch(status.toLowerCase()) {
        case 'accepted':
        case 'hired':
          return 'success';
        case 'rejected':
          return 'error';
        case 'interview':
          return 'warning';
        case 'pending':
        default:
          return 'info';
      }
    };
    
    const getStatusIcon = (status: string) => {
      switch(status.toLowerCase()) {
        case 'accepted':
        case 'hired':
          return <CheckCircle />;
        case 'rejected':
          return <Close />;
        case 'interview':
          return <Person />;
        case 'pending':
        default:
          return <Schedule />;
      }
    };
    
    return (
      <Card sx={{ mb: 2, borderLeft: `4px solid ${theme.palette[getStatusColor(application.status)].main}` }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h6" component="h3" fontWeight="medium">
                {application.job.title}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {application.job.company}
              </Typography>
            </Box>
            <Chip
              icon={getStatusIcon(application.status)}
              label={application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              color={getStatusColor(application.status)}
              size="small"
            />
          </Box>
          
          <Stack direction="row" spacing={2} mb={2}>
            <Box display="flex" alignItems="center">
              <LocationOn fontSize="small" color="action" sx={{ mr: 0.5 }} />
              <Typography variant="body2">{application.job.location}</Typography>
            </Box>
            {application.appliedAt && (
              <Box display="flex" alignItems="center">
                <Schedule fontSize="small" color="action" sx={{ mr: 0.5 }} />
                <Typography variant="body2">
                  Applied: {new Date(application.appliedAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Stack>
          
          <Box display="flex" justifyContent="flex-end">
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => navigate(`/app/applications/${application._id}`)}
            >
              View Application
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box flex={1}>
            <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
              Welcome back, {user?.firstName}! 👋
            </Typography>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {isJobSeekerView 
                ? "Your personalized job search dashboard" 
                : "Manage your recruitment activities"}
            </Typography>
            {isJobSeekerView && (
              <Button
                variant="contained"
                size="large"
                startIcon={<Psychology />}
                onClick={() => setPreparationDialogOpen(true)}
                sx={{
                  mt: 2,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.primary.main} 90%)`,
                  boxShadow: `0 4px 14px 0 ${alpha(theme.palette.success.main, 0.3)}`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.success.dark} 30%, ${theme.palette.primary.dark} 90%)`,
                    boxShadow: `0 6px 20px 0 ${alpha(theme.palette.success.main, 0.4)}`,
                  }
                }}
              >
                Start Prepare for Job
              </Button>
            )}
          </Box>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <CircularProgress size={24} /> : <Refresh />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            <AlertTitle>Error</AlertTitle>
            {error}
          </Alert>
        )}

        {/* Profile Completion Dashboard - For job seekers */}
        {isJobSeekerView && (freshUserData || user) && (
          <Fade in={!loading} timeout={800}>
            <Box sx={{ mb: 4 }}>
              <ProfileCompletionDashboard
                key={`profile-completion-${userDataVersion}`}
                user={freshUserData || user}
                onEditProfile={() => {
                  console.log('🚀 DashboardPage onEditProfile called - navigating to /app/profile');
                  navigate('/app/profile');
                }}
                showRecommendations={true}
              />
            </Box>
          </Fade>
        )}

        {/* Stats Cards - Different for job seekers and employers */}
        <Grid container spacing={3} mb={4}>
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Skeleton variant="rectangular" height={40} sx={{ mb: 2 }} />
                    <Skeleton variant="text" height={60} sx={{ mb: 1 }} />
                    <Skeleton variant="text" height={20} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : isJobSeekerView ? (
            // Job Seeker Stats
            <>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Zoom in={!loading} timeout={600}>
                  <div>
                    <StatCard
                      title="Available Jobs"
                      value={dashboardStats.totalJobs}
                      icon={<Work />}
                      color={theme.palette.primary.main}
                      onClick={() => navigate('/app/jobs')}
                      subtitle="Browse open positions"
                    />
                  </div>
                </Zoom>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Zoom in={!loading} timeout={800}>
                  <div>
                    <StatCard
                      title="My Applications"
                      value={dashboardStats.totalApplications}
                      icon={<Assignment />}
                      color={theme.palette.success.main}
                      onClick={() => navigate('/app/applications')}
                      subtitle="Track your job applications"
                    />
                  </div>
                </Zoom>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Zoom in={!loading} timeout={1000}>
                  <div>
                    <StatCard
                      title="Saved Jobs"
                      value={dashboardStats.savedJobs}
                      icon={<BookmarkBorder />}
                      color={theme.palette.warning.main}
                      onClick={() => navigate('/app/saved-jobs')}
                      subtitle="Jobs you've bookmarked"
                    />
                  </div>
                </Zoom>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Zoom in={!loading} timeout={1200}>
                  <div>
                    <StatCard
                      title="Profile Views"
                      value={dashboardStats.profileViews}
                      icon={<Visibility />}
                      color={theme.palette.info.main}
                      onClick={() => navigate('/app/profile')}
                      subtitle="Employers who viewed your profile"
                    />
                  </div>
                </Zoom>
              </Grid>
            </>
          ) : (
            // Employer Stats
            <>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Zoom in={!loading} timeout={600}>
                  <div>
                    <StatCard
                      title="Active Jobs"
                      value={dashboardStats.totalJobs}
                      icon={<Work />}
                      color={theme.palette.primary.main}
                      onClick={() => navigate('/app/employer/jobs')}
                      subtitle="Your posted positions"
                    />
                  </div>
                </Zoom>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Zoom in={!loading} timeout={800}>
                  <div>
                    <StatCard
                      title="Applications"
                      value={dashboardStats.totalApplications}
                      icon={<Group />}
                      color={theme.palette.success.main}
                      onClick={() => navigate('/app/employer/candidates')}
                      subtitle="Candidates who applied"
                    />
                  </div>
                </Zoom>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Zoom in={!loading} timeout={1000}>
                  <div>
                    <StatCard
                      title="Interviews"
                      value={1}
                      icon={<Assessment />}
                      color={theme.palette.warning.main}
                      onClick={() => navigate('/app/employer/interviews')}
                      subtitle="Scheduled interviews"
                    />
                  </div>
                </Zoom>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Zoom in={!loading} timeout={1200}>
                  <div>
                    <StatCard
                      title="Hired"
                      value={0}
                      icon={<CheckCircle />}
                      color={theme.palette.info.main}
                      onClick={() => navigate('/app/employer/hired')}
                      subtitle="Candidates you've hired"
                    />
                  </div>
                </Zoom>
              </Grid>
            </>
          )}
        </Grid>

        {/* Main Content Area */}
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Job Seeker View */}
            {isJobSeekerView && (
              <>
                {/* Recommended Jobs Section */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Recommended for You
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/app/jobs')}
                      endIcon={<ArrowForward />}
                    >
                      View All Jobs
                    </Button>
                  </Box>
                  
                  {jobsLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : recentJobs.length > 0 ? (
                    <Box>
                      {recentJobs.map(job => (
                        <JobCard key={job._id} job={job} />
                      ))}
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4} bgcolor={alpha(theme.palette.primary.main, 0.05)} borderRadius={2}>
                      <Work sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No jobs available at the moment
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        We'll notify you when new positions matching your profile are posted
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/jobs')}
                        startIcon={<Search />}
                      >
                        Browse All Jobs
                      </Button>
                    </Box>
                  )}
                </Paper>

                {/* Applications Section */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Your Applications
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/applications')}
                      endIcon={<ArrowForward />}
                    >
                      View All
                    </Button>
                  </Box>
                  
                  {applicationsLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : applications.length > 0 ? (
                    <Box>
                      {applications.map(application => (
                        <ApplicationCard key={application._id} application={application} />
                      ))}
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4} bgcolor={alpha(theme.palette.primary.main, 0.05)} borderRadius={2}>
                      <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No applications yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Start applying to jobs to track your application status here
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/jobs')}
                        startIcon={<Work />}
                      >
                        Find Jobs
                      </Button>
                    </Box>
                  )}
                </Paper>

                {/* E-Learning Promotion Section */}
                <Paper 
                  sx={{ 
                    p: 4, 
                    mb: 3, 
                    borderRadius: 3, 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" mb={2}>
                        <Box
                          sx={{
                            p: 1.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            borderRadius: '12px',
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <School sx={{ color: theme.palette.primary.main, fontSize: '28px' }} />
                        </Box>
                        <Box>
                          <Typography variant="h5" component="h2" fontWeight="bold" color="primary.main">
                            Boost Your Career with Our E-Learning Platform
                          </Typography>
                          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                            Get job-ready with comprehensive courses and personalized coaching
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant="body1" color="text.secondary" paragraph>
                        Transform your career with our comprehensive e-learning platform designed specifically to prepare you for your dream job. 
                        Access expert-led courses, live coaching sessions, and practice materials tailored to your industry.
                      </Typography>

                      {/* Features Grid */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <PlayCircleOutline sx={{ color: theme.palette.success.main, mr: 1, fontSize: '20px' }} />
                            <Typography variant="body2" fontWeight="medium">
                              Live Video Sessions with Expert Instructors
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <MenuBook sx={{ color: theme.palette.info.main, mr: 1, fontSize: '20px' }} />
                            <Typography variant="body2" fontWeight="medium">
                              Comprehensive Study Materials & Resources
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Assessment sx={{ color: theme.palette.warning.main, mr: 1, fontSize: '20px' }} />
                            <Typography variant="body2" fontWeight="medium">
                              Practice Tests & Skill Assessments
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Psychology sx={{ color: theme.palette.secondary.main, mr: 1, fontSize: '20px' }} />
                            <Typography variant="body2" fontWeight="medium">
                              Interview Preparation & Mock Sessions
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <EmojiEvents sx={{ color: theme.palette.error.main, mr: 1, fontSize: '20px' }} />
                            <Typography variant="body2" fontWeight="medium">
                              Industry-Recognized Certifications
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <Group sx={{ color: theme.palette.primary.main, mr: 1, fontSize: '20px' }} />
                            <Typography variant="body2" fontWeight="medium">
                              Peer Learning & Community Support
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Specialization Options */}
                      <Box 
                        sx={{ 
                          bgcolor: alpha(theme.palette.background.paper, 0.7), 
                          borderRadius: 2, 
                          p: 2.5, 
                          mb: 3,
                          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}
                      >
                        <Typography variant="subtitle1" fontWeight="bold" color="primary.main" gutterBottom>
                          Choose Your Learning Path:
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                          {[
                            'Technical Skills', 
                            'Soft Skills', 
                            'Leadership', 
                            'Data Analysis', 
                            'Programming', 
                            'Digital Marketing',
                            'Project Management',
                            'Communication Skills'
                          ].map((skill) => (
                            <Chip 
                              key={skill}
                              label={skill}
                              variant="outlined"
                              size="small"
                              sx={{ 
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                borderColor: alpha(theme.palette.primary.main, 0.2),
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  borderColor: theme.palette.primary.main
                                }
                              }}
                            />
                          ))}
                        </Stack>
                      </Box>

                      {/* Call to Action */}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<School />}
                          onClick={() => window.open('https://www.elearning.excellencecoachinghub.com/', '_blank')}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            py: 1.5,
                            background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                            boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
                            '&:hover': {
                              background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                              boxShadow: `0 6px 20px 0 ${alpha(theme.palette.primary.main, 0.4)}`,
                            }
                          }}
                        >
                          Start Learning Today
                        </Button>
                        <Button
                          variant="outlined"
                          size="large"
                          startIcon={<Visibility />}
                          onClick={() => window.open('https://www.elearning.excellencecoachinghub.com/', '_blank')}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 500,
                            px: 3,
                            py: 1.5,
                            borderWidth: 2,
                            '&:hover': {
                              borderWidth: 2,
                              bgcolor: alpha(theme.palette.primary.main, 0.05)
                            }
                          }}
                        >
                          Browse Courses
                        </Button>
                      </Stack>
                    </Box>

                    {/* Right side illustration/icon */}
                    <Box 
                      sx={{ 
                        display: { xs: 'none', md: 'flex' },
                        ml: 3,
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '120px'
                      }}
                    >
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
                          borderRadius: '20px',
                          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`
                        }}
                      >
                        <AutoAwesome sx={{ color: 'white', fontSize: '36px' }} />
                      </Box>
                    </Box>
                  </Box>

                  {/* Bottom Stats/Highlights */}
                  <Box 
                    sx={{ 
                      bgcolor: alpha(theme.palette.background.paper, 0.5), 
                      borderRadius: 2, 
                      p: 2,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                    }}
                  >
                    <Grid container spacing={3}>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <Typography variant="h6" fontWeight="bold" color="primary.main">
                            500+
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Expert-Led Courses
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <Typography variant="h6" fontWeight="bold" color="success.main">
                            95%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Job Placement Rate
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Box textAlign="center">
                          <Typography variant="h6" fontWeight="bold" color="info.main">
                            24/7
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Learning Support
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </>
            )}

            {/* Employer View */}
            {isEmployer && (
              <>
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Your Active Job Postings
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => navigate('/jobs/create')}
                      startIcon={<Add />}
                    >
                      Post New Job
                    </Button>
                  </Box>
                  
                  {jobsLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : recentJobs.length > 0 ? (
                    <Box>
                      {recentJobs.map(job => (
                        <JobCard key={job._id} job={job} />
                      ))}
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4} bgcolor={alpha(theme.palette.primary.main, 0.05)} borderRadius={2}>
                      <Work sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No active job postings
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Create your first job posting to start receiving applications
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={() => navigate('/jobs/create')}
                        startIcon={<Add />}
                      >
                        Post a Job
                      </Button>
                    </Box>
                  )}
                </Paper>

                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Recent Applications
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/employer/candidates')}
                      endIcon={<ArrowForward />}
                    >
                      View All Candidates
                    </Button>
                  </Box>
                  
                  {applicationsLoading ? (
                    <Box display="flex" justifyContent="center" py={4}>
                      <CircularProgress />
                    </Box>
                  ) : applications.length > 0 ? (
                    <Box>
                      {applications.map(application => (
                        <ApplicationCard key={application._id} application={application} />
                      ))}
                    </Box>
                  ) : (
                    <Box textAlign="center" py={4} bgcolor={alpha(theme.palette.primary.main, 0.05)} borderRadius={2}>
                      <Person sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No applications received yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Applications will appear here once candidates apply to your jobs
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </>
            )}
          </Grid>

          {/* Right Column - Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Job Seeker Sidebar */}
            {isJobSeekerView && (
              <>
                {/* Skills Section */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Your Skills
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate('/app/profile')}
                    >
                      Edit
                    </Button>
                  </Box>
                  
                  {skills.length > 0 ? (
                    <Box>
                      {skills.map(skill => (
                        <Box key={skill.name} mb={2}>
                          <Box display="flex" justifyContent="space-between" mb={0.5}>
                            <Typography variant="body2">{skill.name}</Typography>
                            <Typography variant="body2" color="text.secondary">{skill.level}%</Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={skill.level} 
                            sx={{ 
                              height: 6, 
                              borderRadius: 3,
                              backgroundColor: alpha(theme.palette.primary.main, 0.1)
                            }} 
                          />
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={2}>
                      Add skills to your profile to improve job matches
                    </Typography>
                  )}
                </Paper>

                {/* Certificates Section */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Certificates
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => navigate('/app/certificates')}
                      endIcon={<ArrowForward />}
                    >
                      View All
                    </Button>
                  </Box>
                  
                  {certificates.length > 0 ? (
                    <List disablePadding>
                      {certificates.map(cert => (
                        <ListItem 
                          key={cert._id} 
                          disablePadding 
                          sx={{ 
                            mb: 1, 
                            pb: 1, 
                            borderBottom: `1px solid ${theme.palette.divider}` 
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: theme.palette.warning.light }}>
                              <EmojiEvents sx={{ color: theme.palette.warning.dark }} />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={cert.title}
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {cert.issuer || 'Unknown Issuer'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={2}>
                      No certificates added yet
                    </Typography>
                  )}
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    color="primary"
                    onClick={() => navigate('/app/certificates/add')}
                    startIcon={<Add />}
                    sx={{ mt: 2 }}
                  >
                    Add Certificate
                  </Button>
                </Paper>

                {/* Recommended Courses Section */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Recommended Courses
                    </Typography>
                    <Tooltip title="Courses based on your profile and job interests">
                      <IconButton size="small">
                        <Lightbulb color="warning" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  {recommendedCourses.length > 0 ? (
                    <Grid container spacing={2}>
                      {recommendedCourses.map(course => (
                        <Grid size={{ xs: 12 }} key={course.id}>
                          <Card variant="outlined" sx={{ display: 'flex', height: '100%' }}>
                            <CardContent sx={{ flex: 1, p: 2 }}>
                              <Typography variant="subtitle1" fontWeight="medium">
                                {course.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {course.provider} • {course.duration} • {course.level}
                              </Typography>
                              <Button 
                                size="small" 
                                component={Link} 
                                to={`/courses/${course.id}`}
                                sx={{ mt: 1 }}
                              >
                                Learn More
                              </Button>
                            </CardContent>
                            <Box 
                              sx={{ 
                                width: 80, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                bgcolor: 'background.default'
                              }}
                            >
                              <MenuBook sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                            </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Typography color="text.secondary" textAlign="center" py={2}>
                      Complete your profile to get course recommendations
                    </Typography>
                  )}
                  
                  <Button
                    fullWidth
                    variant="text"
                    color="primary"
                    onClick={() => navigate('/app/courses')}
                    endIcon={<ArrowForward />}
                    sx={{ mt: 2 }}
                  >
                    Browse All Courses
                  </Button>
                </Paper>

                {/* Psychometric Tests Section */}
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Career Assessment
                    </Typography>
                    <Psychology color="secondary" />
                  </Box>
                  
                  <Typography variant="body2" paragraph>
                    Take our psychometric tests to discover your strengths and get better job matches.
                  </Typography>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate('/app/tests')}
                    sx={{ mb: 1 }}
                  >
                    Take Assessment
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate('/app/interviews')}
                  >
                    Practice AI Interview
                  </Button>
                </Paper>
              </>
            )}

            {/* Employer Sidebar */}
            {isEmployer && (
              <>
                {/* Quick Actions */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Typography variant="h5" component="h2" fontWeight="bold" mb={3}>
                    Quick Actions
                  </Typography>
                  
                  <Stack spacing={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<Add />}
                      onClick={() => navigate('/app/jobs/create')}
                    >
                      Post New Job
                    </Button>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Person />}
                      onClick={() => navigate('/app/employer/candidates')}
                    >
                      View Candidates
                    </Button>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Business />}
                      onClick={() => navigate('/app/employer/company-profile')}
                    >
                      Edit Company Profile
                    </Button>
                    
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Assessment />}
                      onClick={() => navigate('/app/employer/interviews')}
                    >
                      Manage Interviews
                    </Button>
                  </Stack>
                </Paper>

                {/* Analytics Preview */}
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Recruitment Analytics
                    </Typography>
                    <BarChart color="primary" />
                  </Box>
                  
                  <Grid container spacing={2} mb={2}>
                    <Grid size={{ xs: 6 }}>
                      <Box textAlign="center" p={1.5} bgcolor={alpha(theme.palette.primary.main, 0.1)} borderRadius={1}>
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                          {applications.length}
                        </Typography>
                        <Typography variant="body2">Applications</Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box textAlign="center" p={1.5} bgcolor={alpha(theme.palette.success.main, 0.1)} borderRadius={1}>
                        <Typography variant="h4" color="success.main" fontWeight="bold">
                          {recentJobs.length}
                        </Typography>
                        <Typography variant="body2">Active Jobs</Typography>
                      </Box>
                    </Grid>
                  </Grid>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    endIcon={<Timeline />}
                    onClick={() => navigate('/app/employer/analytics')}
                  >
                    View Full Analytics
                  </Button>
                </Paper>

                {/* Candidate Matching */}
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" component="h2" fontWeight="bold">
                      Talent Pool
                    </Typography>
                    <People color="primary" />
                  </Box>
                  
                  <Typography variant="body2" paragraph>
                    Browse our talent pool to find candidates that match your requirements.
                  </Typography>
                  
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/app/employer/talent-pool')}
                    sx={{ mb: 1 }}
                  >
                    Search Candidates
                  </Button>
                  
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => navigate('/app/employer/saved-candidates')}
                  >
                    Saved Candidates
                  </Button>
                </Paper>
              </>
            )}
          </Grid>
        </Grid>

        {/* Student-specific section */}
        {isStudent && (
          <Box mt={4}>
            <Paper 
              elevation={3} 
              sx={{ 
                p: 3, 
                borderRadius: 2,
                background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.1)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
                }
              }}
            >
              <Grid container spacing={3} alignItems="center">
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="h5" component="h2" fontWeight="bold" color="secondary.main" gutterBottom>
                    Student Career Advantage Program
                  </Typography>
                  <Typography variant="body1" paragraph>
                    As a student of Excellence Coaching Hub, you have access to exclusive job opportunities, 
                    internships, and career development resources designed specifically for students.
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <School color="secondary" fontSize="small" />
                        <Typography variant="subtitle2">Student-Friendly Jobs</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Find part-time positions that work with your class schedule
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <MenuBook color="secondary" fontSize="small" />
                        <Typography variant="subtitle2">Course-Aligned Internships</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Apply your classroom knowledge in real-world settings
                      </Typography>
                    </Grid>
                  </Grid>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate('/app/jobs?filter=student')}
                    startIcon={<Search />}
                  >
                    Browse Student Opportunities
                  </Button>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }} sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Box 
                    sx={{ 
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%'
                    }}
                  >
                    <School sx={{ fontSize: 160, color: alpha(theme.palette.secondary.main, 0.2) }} />
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}
      </Box>

      {/* Job Preparation Dialog */}
      <Dialog
        open={preparationDialogOpen}
        onClose={() => setPreparationDialogOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
            <Box
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                borderRadius: '16px',
                mr: 2
              }}
            >
              <Psychology sx={{ color: theme.palette.primary.main, fontSize: '32px' }} />
            </Box>
            <Box textAlign="left">
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                Prepare for Your Dream Job
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Choose your preparation path and get ready for success
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 3 }}>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ textAlign: 'center', mb: 4 }}>
            Our comprehensive preparation program helps you build the skills, confidence, and knowledge needed to excel in job applications and interviews. 
            Choose the areas you'd like to focus on:
          </Typography>

          <Grid container spacing={3}>
            {/* Psychometric Tests Card */}
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${alpha(theme.palette.warning.main, 0.3)}`,
                    border: `2px solid ${theme.palette.warning.main}`,
                  }
                }}
                onClick={() => {
                  setPreparationDialogOpen(false);
                  navigate('/app/tests');
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '16px',
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <Assessment sx={{ color: theme.palette.warning.main, fontSize: '28px' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Psychometric Tests
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Assess your cognitive abilities, personality traits, and problem-solving skills with professional-grade tests.
                  </Typography>
                  <Chip
                    label="Skill Assessment"
                    size="small"
                    sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      color: theme.palette.warning.main,
                      fontWeight: 600
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Interview Preparation Card */}
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.success.main, 0.1)}`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.3)}`,
                    border: `2px solid ${theme.palette.success.main}`,
                  }
                }}
                onClick={() => {
                  setPreparationDialogOpen(false);
                  navigate('/app/interviews');
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '16px',
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <Person sx={{ color: theme.palette.success.main, fontSize: '28px' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Interview Practice
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Master interview techniques with AI-powered mock interviews and personalized feedback.
                  </Typography>
                  <Chip
                    label="Communication Skills"
                    size="small"
                    sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1),
                      color: theme.palette.success.main,
                      fontWeight: 600
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Courses Card */}
            <Grid item xs={12} md={4}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 8px 25px ${alpha(theme.palette.primary.main, 0.3)}`,
                    border: `2px solid ${theme.palette.primary.main}`,
                  }
                }}
                onClick={() => {
                  window.open('https://www.elearning.excellencecoachinghub.com/', '_blank');
                  setPreparationDialogOpen(false);
                }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '16px',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2
                    }}
                  >
                    <School sx={{ color: theme.palette.primary.main, fontSize: '28px' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Professional Courses
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Enhance your skills with expert-led courses, live sessions, and industry-recognized certifications.
                  </Typography>
                  <Chip
                    label="Skill Development"
                    size="small"
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      fontWeight: 600
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box 
            sx={{ 
              mt: 4, 
              p: 2, 
              bgcolor: alpha(theme.palette.info.main, 0.05), 
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
            }}
          >
            <Typography variant="body2" color="info.main" textAlign="center" fontWeight="medium">
              💡 Pro Tip: Combining all three preparation methods gives you the best chance of landing your dream job!
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={() => setPreparationDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Floating Contact Component */}
      <FloatingContact />
    </Container>
  );
};

export default DashboardPage;
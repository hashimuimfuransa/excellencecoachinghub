import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Rating,
  Fade,
  Slide,
  Zoom,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
  alpha,
  Skeleton,
  CircularProgress,
  Pagination
} from '@mui/material';
import {
  Work,
  School,
  TrendingUp,
  People,
  Search,
  LocationOn,
  Star,
  CheckCircle,
  ArrowForward,
  Business,
  Psychology,
  Speed,
  Security,
  Support,
  Verified,
  PlayArrow,
  KeyboardArrowRight,
  RocketLaunch,
  EmojiEvents,
  Groups,
  AutoAwesome,
  Person,
  AccessTime,
  AttachMoney,
  FiberNew,
  Description,
  Email,
  Phone
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import { jobService } from '../services/jobService';
import { useAuth } from '../contexts/AuthContext';
import FloatingContact from '../components/FloatingContact';
import FloatingAIAssistant from '../components/FloatingAIAssistant';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { isAuthenticated, isLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [animationTrigger, setAnimationTrigger] = useState(false);
  const [featuredJobs, setFeaturedJobs] = useState<any[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobError, setJobError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const jobsPerPage = 6;

  useEffect(() => {
    setAnimationTrigger(true);
    fetchFeaturedJobs();
  }, []);
  
  const fetchFeaturedJobs = async (page = 1) => {
    try {
      setLoadingJobs(true);
      // Fetch active jobs instead of curated jobs to ensure we get results
      const filters = {
        status: 'active' as const
      };
      const response = await jobService.getJobs(filters, page, jobsPerPage);
      if (response.data && response.data.length > 0) {
        setFeaturedJobs(response.data);
        setTotalPages(response.pagination.pages);
        setTotalJobs(response.pagination.total);
        setCurrentPage(page);
      } else {
        setJobError('No jobs found');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobError('Failed to load jobs');
    } finally {
      setLoadingJobs(false);
    }
  };

  const features = [
    {
      icon: <Work sx={{ fontSize: 48, color: '#4caf50' }} />,
      title: 'Professional Networking',
      description: 'Connect with industry professionals, build meaningful relationships, and expand your career network across Africa.',
      action: () => navigate('/app/jobs'),
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)'
    },
    {
      icon: <Psychology sx={{ fontSize: 48, color: '#66bb6a' }} />,
      title: 'Interactive Job Preparation',
      description: 'Access comprehensive preparation tools including AI-powered interview coaching, skill assessments, and career guidance.',
      action: () => navigate('/app/interviews'),
      color: '#66bb6a',
      bgColor: 'rgba(102, 187, 106, 0.1)',
      gradient: 'linear-gradient(135deg, #66bb6a 0%, #4caf50 100%)'
    },
    {
      icon: <School sx={{ fontSize: 48, color: '#81c784' }} />,
      title: 'Secure Certifications',
      description: 'Earn verified, blockchain-secured certificates that validate your skills and boost your professional credibility.',
      action: () => navigate('/app/certificates'),
      color: '#81c784',
      bgColor: 'rgba(129, 199, 132, 0.1)',
      gradient: 'linear-gradient(135deg, #81c784 0%, #66bb6a 100%)'
    },
    {
      icon: <TrendingUp sx={{ fontSize: 48, color: '#388e3c' }} />,
      title: 'Personalized Profiles',
      description: 'Create dynamic career profiles that showcase your expertise, achievements, and career aspirations to potential employers.',
      action: () => navigate('/app/profile'),
      color: '#388e3c',
      bgColor: 'rgba(56, 142, 60, 0.1)',
      gradient: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)'
    }
  ];

  const benefits = [
    { icon: <Speed />, title: 'Streamlined Process', description: 'Efficient application and networking process designed for busy professionals' },
    { icon: <Security />, title: 'Enterprise Security', description: 'Bank-level encryption and data protection for all your professional information' },
    { icon: <Support />, title: 'Live Career Coaching', description: 'Access professional coaching and mentorship from industry experts' },
    { icon: <Verified />, title: 'Verified Network', description: 'Connect only with authenticated professionals and legitimate organizations' }
  ];

  const popularCategories = [
    'Software Development', 'Data Science', 'Digital Marketing', 'Product Management',
    'UI/UX Design', 'Sales', 'Finance', 'Healthcare', 'Education', 'Engineering'
  ];

  const howItWorksSteps = [
    {
      step: '01',
      title: 'Build Your Profile',
      description: 'Create a comprehensive professional profile showcasing your skills, experience, and career aspirations.',
      icon: <Person sx={{ fontSize: 40 }} />,
      color: '#4caf50'
    },
    {
      step: '02',
      title: 'Network & Connect',
      description: 'Discover and connect with industry professionals, mentors, and potential collaborators in your field.',
      icon: <AutoAwesome sx={{ fontSize: 40 }} />,
      color: '#66bb6a'
    },
    {
      step: '03',
      title: 'Prepare & Upskill',
      description: 'Access interactive preparation tools, live coaching sessions, and secure certification programs.',
      icon: <Psychology sx={{ fontSize: 40 }} />,
      color: '#81c784'
    },
    {
      step: '04',
      title: 'Advance Your Career',
      description: 'Leverage your enhanced profile and network to secure better opportunities and career growth.',
      icon: <EmojiEvents sx={{ fontSize: 40 }} />,
      color: '#388e3c'
    }
  ];

  const companyLogos = [
    { name: 'Google', logo: 'G' },
    { name: 'Microsoft', logo: 'M' },
    { name: 'Apple', logo: 'A' },
    { name: 'Amazon', logo: 'Am' },
    { name: 'Meta', logo: 'F' },
    { name: 'Netflix', logo: 'N' },
    { name: 'Tesla', logo: 'T' },
    { name: 'Spotify', logo: 'S' }
  ];

  const jobCategories = [
    { name: 'Technology', count: '2,500+', icon: <Work />, color: '#4caf50' },
    { name: 'Healthcare', count: '1,200+', icon: <School />, color: '#66bb6a' },
    { name: 'Finance', count: '800+', icon: <TrendingUp />, color: '#81c784' },
    { name: 'Marketing', count: '600+', icon: <People />, color: '#388e3c' },
    { name: 'Education', count: '400+', icon: <School />, color: '#2e7d32' },
    { name: 'Design', count: '300+', icon: <Work />, color: '#1b5e20' }
  ];

  const handleSearch = () => {
    navigate(`/jobs?search=${searchTerm}&location=${location}`);
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    fetchFeaturedJobs(page);
  };

  const handleViewMore = () => {
    navigate('/jobs');
  };

  const handleViewJobDetails = (jobId: string) => {
    navigate('/jobs');
  };

  const formatSalary = (salary: any): string => {
    if (!salary) return 'Salary not specified';
    if (typeof salary === 'string') return salary;
    if (typeof salary === 'object' && salary.min && salary.max) {
      return `${salary.currency || '$'} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
    }
    return 'Salary not specified';
  };

  return (
    <PublicLayout>
      <Box>
      {/* Modern Hero Section with Animated Background */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
          color: 'white',
          py: { xs: 6, sm: 8, md: 12, lg: 16 },
          px: { xs: 1, sm: 2 },
          position: 'relative',
          overflow: 'hidden',
          borderRadius: { xs: 0, md: '0 0 50px 50px' },
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          minHeight: { xs: '100vh', md: 'auto' },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url("/find job.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.3,
            animation: 'pulse 15s infinite alternate'
          },
          '@keyframes pulse': {
            '0%': { opacity: 0.2, transform: 'scale(1)' },
            '100%': { opacity: 0.4, transform: 'scale(1.05)' }
          }
        }}
      >
        {/* Floating Decorative Elements */}
        <Box sx={{ 
          position: 'absolute', 
          top: '20%', 
          left: '10%', 
          animation: 'float1 6s ease-in-out infinite',
          zIndex: 0,
          '@keyframes float1': {
            '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
            '50%': { transform: 'translate(20px, -30px) rotate(180deg)' }
          }
        }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            background: 'rgba(255,255,255,0.1)', 
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255,255,255,0.2)'
          }} />
        </Box>
        
        <Box sx={{ 
          position: 'absolute', 
          top: '60%', 
          right: '15%', 
          animation: 'float2 8s ease-in-out infinite reverse',
          zIndex: 0,
          '@keyframes float2': {
            '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
            '50%': { transform: 'translate(-30px, -20px) rotate(-180deg)' }
          }
        }}>
          <Box sx={{ 
            width: 60, 
            height: 60, 
            borderRadius: '20px', 
            background: 'rgba(255,255,255,0.08)', 
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255,255,255,0.2)',
            transform: 'rotate(45deg)'
          }} />
        </Box>

        <Box sx={{ 
          position: 'absolute', 
          top: '30%', 
          right: '25%', 
          animation: 'float3 10s ease-in-out infinite',
          zIndex: 0,
          '@keyframes float3': {
            '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
            '33%': { transform: 'translate(15px, -25px) scale(1.2)' },
            '66%': { transform: 'translate(-10px, -15px) scale(0.8)' }
          }
        }}>
          <Box sx={{ 
            width: 30, 
            height: 30, 
            borderRadius: '50%', 
            background: 'rgba(200,230,201,0.3)', 
            backdropFilter: 'blur(10px)',
            boxShadow: '0 0 20px rgba(200,230,201,0.2)'
          }} />
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in={animationTrigger} timeout={1000}>
            <Box textAlign="center">
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', lg: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: { xs: 3, sm: 4, md: 5, lg: 4 },
                mb: { xs: 3, sm: 4, md: 6 },
                px: { xs: 1, sm: 2, md: 0 }
              }}>
                <Zoom in={animationTrigger} timeout={1200}>
                  <Box sx={{ 
                    textAlign: { xs: 'center', lg: 'left' },
                    maxWidth: { xs: '100%', sm: '90%', md: '80%', lg: '600px' },
                    mx: { xs: 'auto', lg: 0 }
                  }}>
                    <Typography 
                      variant="h1" 
                      component="h1" 
                      gutterBottom 
                      fontWeight="900"
                      sx={{ 
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3.2rem', lg: '4rem', xl: '5rem' },
                        background: 'linear-gradient(45deg, #fff 20%, #e8f5e8 50%, #c8e6c9 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 4px 20px rgba(255,255,255,0.4)',
                        lineHeight: 1.1,
                        letterSpacing: '-0.02em',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '120%',
                          height: '120%',
                          background: 'radial-gradient(ellipse, rgba(255,255,255,0.1) 0%, transparent 70%)',
                          borderRadius: '50%',
                          zIndex: -1,
                          animation: 'glow 3s ease-in-out infinite alternate'
                        },
                        '@keyframes glow': {
                          '0%': { opacity: 0.3, transform: 'translate(-50%, -50%) scale(1)' },
                          '100%': { opacity: 0.6, transform: 'translate(-50%, -50%) scale(1.1)' }
                        }
                      }}
                    >
                      Unlock Your <Box component="span" sx={{ 
                        color: '#8eff8e', 
                        WebkitTextFillColor: '#8eff8e',
                        textShadow: '0 0 30px rgba(76, 175, 80, 0.8)',
                        position: 'relative',
                        backgroundClip: 'unset',
                        WebkitBackgroundClip: 'unset',
                        fontWeight: 'inherit',
                        '&::before': {
                          content: '"✨"',
                          position: 'absolute',
                          top: '-10px',
                          right: '-15px',
                          fontSize: '0.4em',
                          animation: 'sparkle 2s ease-in-out infinite'
                        },
                        '@keyframes sparkle': {
                          '0%, 100%': { opacity: 0.5, transform: 'rotate(0deg) scale(1)' },
                          '50%': { opacity: 1, transform: 'rotate(180deg) scale(1.2)' }
                        }
                      }}>Career Potential</Box> Today 🚀
                    </Typography>
                    <Typography 
                      variant="h4" 
                      component="h2" 
                      gutterBottom 
                      sx={{ 
                        mb: 3,
                        fontSize: { xs: '1.3rem', sm: '1.6rem', md: '1.8rem', lg: '2.1rem' },
                        fontWeight: 400,
                        opacity: 0.95,
                        background: 'linear-gradient(45deg, #ffffff 30%, #c8e6c9 90%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 2px 15px rgba(255,255,255,0.3)'
                      }}
                    >
                      🎯 Where Talent Meets Opportunity - Africa's Premier Career Network
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        mb: 3, 
                        opacity: 0.9,
                        maxWidth: { xs: '95%', sm: '90%', md: '600px' },
                        mx: { xs: 'auto', lg: 0 },
                        lineHeight: { xs: 1.5, md: 1.7 },
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem', lg: '1.2rem' },
                        fontWeight: 300,
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                        px: { xs: 1, sm: 0 }
                      }}
                    >
                      🌟 ExJobNet is a dynamic career platform combining the best of professional networking and job readiness. With personalized profiles, interactive job preparation tools, live coaching, and secure certifications, we empower both individuals and organizations across Africa's thriving job ecosystem.
                    </Typography>

                    {/* Key Benefits Pills */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: { xs: 1, sm: 1.5 }, 
                      mb: { xs: 3, md: 4 },
                      justifyContent: { xs: 'center', lg: 'flex-start' },
                      px: { xs: 1, sm: 0 }
                    }}>
                      {[
                        { icon: '🎯', text: 'Smart Matching', color: '#4caf50' },
                        { icon: '⚡', text: 'Instant Connect', color: '#66bb6a' },
                        { icon: '📈', text: 'Career Growth', color: '#81c784' },
                        { icon: '🛡️', text: 'Secure Platform', color: '#388e3c' }
                      ].map((benefit, index) => (
                        <Chip
                          key={index}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <span style={{ fontSize: '1.1em' }}>{benefit.icon}</span>
                              <span>{benefit.text}</span>
                            </Box>
                          }
                          sx={{
                            backgroundColor: alpha('#fff', 0.15),
                            color: 'white',
                            fontWeight: 600,
                            fontSize: { xs: '0.75rem', sm: '0.85rem' },
                            py: { xs: 1, sm: 1.5 },
                            px: { xs: 1.5, sm: 2 },
                            backdropFilter: 'blur(15px)',
                            border: `1px solid ${alpha(benefit.color, 0.4)}`,
                            boxShadow: `0 4px 15px ${alpha(benefit.color, 0.2)}`,
                            '&:hover': {
                              backgroundColor: alpha('#fff', 0.25),
                              transform: 'translateY(-3px)',
                              boxShadow: `0 8px 25px ${alpha(benefit.color, 0.3)}`
                            },
                            transition: 'all 0.3s ease'
                          }}
                        />
                      ))}
                    </Box>
                    
                    {/* Hero CTA Buttons */}
                    <Box sx={{ 
                      display: 'flex', 
                      gap: { xs: 1.5, sm: 2 }, 
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: 'center',
                      justifyContent: { xs: 'center', lg: 'flex-start' },
                      px: { xs: 1, sm: 0 }
                    }}>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth={isMobile}
                        startIcon={<RocketLaunch sx={{ fontSize: '1.2em' }} />}
                        sx={{ 
                          background: 'linear-gradient(45deg, #ffffff 0%, #f8f9fa 50%, #ffffff 100%)', 
                          color: 'primary.main',
                          px: { xs: 3, sm: 4, md: 5 },
                          py: { xs: 1.5, sm: 2 },
                          borderRadius: 4,
                          fontWeight: 'bold',
                          boxShadow: '0 8px 25px rgba(255,255,255,0.3), 0 4px 15px rgba(0,0,0,0.1)',
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                          border: '2px solid rgba(255,255,255,0.5)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': { 
                            background: 'linear-gradient(45deg, #f0f0f0 0%, #e8e8e8 50%, #f0f0f0 100%)',
                            transform: 'translateY(-4px) scale(1.02)',
                            boxShadow: '0 12px 35px rgba(255,255,255,0.4), 0 8px 25px rgba(0,0,0,0.15)',
                            border: '2px solid rgba(255,255,255,0.8)'
                          },
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                            animation: 'shine 3s ease-in-out infinite'
                          },
                          '@keyframes shine': {
                            '0%': { left: '-100%' },
                            '100%': { left: '100%' }
                          }
                        }}
                        onClick={() => navigate('/jobs')}
                      >
                        🚀 Find Your Dream Job
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        fullWidth={isMobile}
                        startIcon={<PlayArrow sx={{ fontSize: '1.2em' }} />}
                        sx={{ 
                          borderColor: 'rgba(255,255,255,0.7)', 
                          color: 'white',
                          px: { xs: 3, sm: 4, md: 5 },
                          py: { xs: 1.5, sm: 2 },
                          borderRadius: 4,
                          fontWeight: 'bold',
                          borderWidth: 2,
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                          backdropFilter: 'blur(15px)',
                          background: 'rgba(255,255,255,0.1)',
                          boxShadow: '0 4px 15px rgba(255,255,255,0.1)',
                          '&:hover': { 
                            borderColor: 'white', 
                            bgcolor: 'rgba(255,255,255,0.2)',
                            transform: 'translateY(-4px) scale(1.02)',
                            boxShadow: '0 8px 25px rgba(255,255,255,0.2)',
                            background: 'rgba(255,255,255,0.15)'
                          },
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        onClick={() => navigate('/register')}
                      >
                        ✨ Get Started Free
                      </Button>
                    </Box>
                  </Box>
                </Zoom>
                
                {/* Hero Image/Illustration */}
                <Zoom in={animationTrigger} timeout={1500}>
                  <Box sx={{ 
                    display: { xs: 'none', sm: 'block' },
                    position: 'relative',
                    width: '100%',
                    maxWidth: { sm: '300px', md: '400px', lg: '500px' },
                    height: { sm: '250px', md: '350px', lg: '400px' },
                    mt: { sm: 3, md: 0 },
                    mx: 'auto'
                  }}>
                    <Box
                      component="img"
                      src="/career-growth_graph_trending_chart-100747018-orig.webp"
                      alt="Career Growth Illustration"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))'
                      }}
                    />
                    
                    {/* Floating elements */}
                    <Box sx={{ 
                      position: 'absolute',
                      top: '10%',
                      right: '10%',
                      animation: 'float 3s ease-in-out infinite alternate',
                      '@keyframes float': {
                        '0%': { transform: 'translateY(0px)' },
                        '100%': { transform: 'translateY(-20px)' }
                      }
                    }}>
                      <Paper
                        elevation={6}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <CheckCircle color="success" />
                        <Typography variant="body2" fontWeight="bold" color="text.primary">
                          Perfect Match!
                        </Typography>
                      </Paper>
                    </Box>
                    
                    <Box sx={{ 
                      position: 'absolute',
                      bottom: '15%',
                      left: '5%',
                      animation: 'float 4s ease-in-out infinite alternate-reverse',
                      '@keyframes float': {
                        '0%': { transform: 'translateY(0px)' },
                        '100%': { transform: 'translateY(-20px)' }
                      }
                    }}>
                      <Paper
                        elevation={6}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <Star sx={{ color: '#FFD700' }} />
                        <Typography variant="body2" fontWeight="bold" color="text.primary">
                          Smart Powered
                        </Typography>
                      </Paper>
                    </Box>
                  </Box>
                </Zoom>
              </Box>
              
              {/* Trusted By Logos */}
              <Fade in={animationTrigger} timeout={2000}>
                <Box sx={{ mt: 6 }}>
                  <Typography variant="subtitle1" sx={{ opacity: 0.8, mb: 3 }}>
                    Trusted by leading companies worldwide
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: { xs: 2, md: 4 },
                    mx: 'auto',
                    maxWidth: '800px'
                  }}>
                    {companyLogos.map((company, index) => (
                      <Avatar
                        key={index}
                        sx={{
                          width: 50,
                          height: 50,
                          bgcolor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,0.3)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.2s'
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Fade>

              {/* CTA Buttons - Moved to hero content */}
            </Box>
          </Fade>
        </Container>
      </Box>

      {/* Featured Jobs Section - Live from Database - Moved right after hero section */}
      <Fade in={animationTrigger} timeout={2500}>
        <Box sx={{ 
          mb: 8, 
          mt: { xs: 0, md: -4 }, 
          py: { xs: 4, sm: 5, md: 6 }, 
          px: { xs: 2, sm: 0 },
          background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.03) 0%, rgba(46, 125, 50, 0.07) 100%)',
          borderRadius: { xs: 2, md: 4 }
        }}>
          <Container>
            <Box textAlign="center" sx={{ mb: { xs: 4, md: 6 } }}>
              <Typography 
                variant="h3" 
                component="h2" 
                gutterBottom 
                fontWeight="bold"
                sx={{ 
                  position: 'relative',
                  display: 'inline-block',
                  background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -10,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: { xs: 60, md: 80 },
                    height: 4,
                    borderRadius: 2,
                    bgcolor: 'primary.main'
                  }
                }}
              >
                Latest Job Opportunities
              </Typography>
              <Typography 
                variant="h6" 
                color="text.secondary" 
                sx={{ 
                  maxWidth: '700px', 
                  mx: 'auto', 
                  mb: 4, 
                  mt: 4,
                  fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
                }}
              >
                Discover the latest job opportunities from top employers
              </Typography>
              
              {/* Modern Search Bar */}
              <Paper
                elevation={3}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  mb: 4,
                  maxWidth: '800px',
                  mx: 'auto',
                  borderRadius: 3,
                  background: 'white',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.12)'
                  }
                }}
              >
                <Grid container spacing={{ xs: 2, md: 2 }} alignItems="stretch">
                  <Grid item xs={12} md={5}>
                    <TextField
                      fullWidth
                      placeholder="💼 Job title, keywords, or company"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Search sx={{ color: '#4caf50' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 3,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(10px)',
                          height: { xs: '56px', md: '64px' },
                          fontSize: { xs: '0.9rem', md: '1rem' },
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(76, 175, 80, 0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 6px 20px rgba(76, 175, 80, 0.15)',
                            transform: 'translateY(-2px)',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#4caf50',
                              borderWidth: '2px'
                            }
                          },
                          '&.Mui-focused': {
                            boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)',
                            transform: 'translateY(-2px)'
                          }
                        } 
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      placeholder="📍 Location (Remote, City, State)"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LocationOn sx={{ color: '#4caf50' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': { 
                          borderRadius: 3,
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
                          backdropFilter: 'blur(10px)',
                          height: { xs: '56px', md: '64px' },
                          fontSize: { xs: '0.9rem', md: '1rem' },
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(76, 175, 80, 0.2)',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: '0 6px 20px rgba(76, 175, 80, 0.15)',
                            transform: 'translateY(-2px)',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#4caf50',
                              borderWidth: '2px'
                            }
                          },
                          '&.Mui-focused': {
                            boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)',
                            transform: 'translateY(-2px)'
                          }
                        } 
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleSearch}
                      startIcon={<Search sx={{ fontSize: '1.2em' }} />}
                      sx={{
                        height: { xs: '56px', md: '64px' },
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
                        boxShadow: '0 6px 20px rgba(76, 175, 80, 0.3)',
                        fontSize: { xs: '0.9rem', md: '1rem' },
                        fontWeight: 'bold',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #66bb6a 0%, #388e3c 100%)',
                          transform: 'translateY(-3px) scale(1.02)',
                          boxShadow: '0 8px 25px rgba(76, 175, 80, 0.4)',
                        }
                      }}
                    >
                      🚀 Find Jobs
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Box>
            
            {loadingJobs ? (
              <Grid container spacing={{ xs: 2, sm: 3 }}>
                {[1, 2, 3, 4, 5, 6].map((item) => (
                  <Grid item xs={12} sm={6} lg={4} key={item}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                      <Skeleton variant="text" width="60%" height={40} />
                      <Skeleton variant="text" width="40%" height={30} />
                      <Box sx={{ display: 'flex', mt: 2, mb: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                        <Skeleton variant="text" width="70%" height={40} />
                      </Box>
                      <Skeleton variant="rectangular" height={40} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                        <Skeleton variant="text" width="30%" height={30} />
                        <Skeleton variant="text" width="30%" height={30} />
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            ) : jobError ? (
              <Paper elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <Typography color="error">{jobError}</Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={() => fetchFeaturedJobs(1)}
                >
                  Retry
                </Button>
              </Paper>
            ) : (
              <>
                <Grid container spacing={{ xs: 2, sm: 3 }}>
                  {featuredJobs.map((job, index) => (
                    <Grid item xs={12} sm={6} lg={4} key={index}>
                      <Zoom in={animationTrigger} timeout={1500 + index * 150}>
                        <Paper 
                          component="div"
                          elevation={3} 
                          sx={{ 
                            p: { xs: 2.5, sm: 3 }, 
                            borderRadius: { xs: 2, sm: 3 },
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'all 0.3s',
                            cursor: 'pointer',
                            '&:hover': {
                              transform: 'translateY(-5px)',
                              boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                            }
                          }}
                          onClick={() => handleViewJobDetails(job._id || job.id)}
                        >
                          {/* New tag if job is recent */}
                          {job.isNew && (
                            <Chip 
                              icon={<FiberNew />} 
                              label="New" 
                              color="primary" 
                              size="small"
                              sx={{ 
                                position: 'absolute',
                                top: 16,
                                right: 16,
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                          
                          {/* Company logo */}
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            mb: 2,
                            gap: 1.5
                          }}>
                            <Avatar 
                              src={job.companyLogo} 
                              alt={job.company}
                              sx={{ 
                                width: { xs: 40, sm: 50 }, 
                                height: { xs: 40, sm: 50 }, 
                                flexShrink: 0,
                                bgcolor: job.companyLogo ? 'transparent' : 'primary.main',
                                fontSize: { xs: '0.9rem', sm: '1.2rem' }
                              }}
                            >
                              {!job.companyLogo && job.company?.charAt(0)}
                            </Avatar>
                            <Box sx={{ minWidth: 0, flex: 1 }}>
                              <Typography 
                                variant="h6" 
                                fontWeight="bold" 
                                sx={{ 
                                  fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' },
                                  lineHeight: { xs: 1.3, sm: 1.4 },
                                  display: '-webkit-box',
                                  WebkitLineClamp: { xs: 2, sm: 1 },
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  wordBreak: 'break-word',
                                  hyphens: 'auto'
                                }}
                                title={job.title}
                              >
                                {job.title}
                              </Typography>
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{
                                  fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                                title={job.company}
                              >
                                {job.company}
                              </Typography>
                            </Box>
                          </Box>
                          
                          {/* Job details */}
                          <Box sx={{ mb: 2, flex: 1 }}>
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: { xs: 0.8, sm: 1 },
                              minHeight: { xs: 'auto', sm: '20px' }
                            }}>
                              <LocationOn 
                                fontSize="small" 
                                color="action" 
                                sx={{ 
                                  mr: 1, 
                                  fontSize: { xs: '0.9rem', sm: '1.2rem' },
                                  flexShrink: 0
                                }} 
                              />
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                                title={job.location}
                              >
                                {job.location}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: { xs: 0.8, sm: 1 },
                              minHeight: { xs: 'auto', sm: '20px' }
                            }}>
                              <Work 
                                fontSize="small" 
                                color="action" 
                                sx={{ 
                                  mr: 1,
                                  fontSize: { xs: '0.9rem', sm: '1.2rem' },
                                  flexShrink: 0
                                }} 
                              />
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{ 
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                              >
                                {job.jobType || 'Full-time'}
                              </Typography>
                            </Box>
                            
                            {job.salary && (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mb: { xs: 0.8, sm: 1 },
                                minHeight: { xs: 'auto', sm: '20px' }
                              }}>
                                <AttachMoney 
                                  fontSize="small" 
                                  color="action" 
                                  sx={{ 
                                    mr: 1,
                                    fontSize: { xs: '0.9rem', sm: '1.2rem' },
                                    flexShrink: 0
                                  }} 
                                />
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                                    display: '-webkit-box',
                                    WebkitLineClamp: 1,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {formatSalary(job.salary)}
                                </Typography>
                              </Box>
                            )}
                            
                            {job.postedAt && (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                minHeight: { xs: 'auto', sm: '20px' }
                              }}>
                                <AccessTime 
                                  fontSize="small" 
                                  color="action" 
                                  sx={{ 
                                    mr: 1,
                                    fontSize: { xs: '0.9rem', sm: '1.2rem' },
                                    flexShrink: 0
                                  }} 
                                />
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary" 
                                  sx={{ 
                                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                  }}
                                >
                                  {new Date(job.postedAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          
                          {/* Skills/tags */}
                          <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: { xs: 0.5, sm: 1 }, 
                            mb: { xs: 1.5, sm: 2 } 
                          }}>
                            {job.skills?.slice(0, isMobile ? 2 : 3).map((skill, idx) => (
                              <Chip 
                                key={idx} 
                                label={skill} 
                                size="small" 
                                sx={{ 
                                  bgcolor: 'primary.light',
                                  color: 'primary.dark',
                                  fontWeight: 500,
                                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                  height: { xs: 20, sm: 24 }
                                }} 
                              />
                            ))}
                            {job.skills?.length > (isMobile ? 2 : 3) && (
                              <Chip 
                                label={`+${job.skills.length - (isMobile ? 2 : 3)}`} 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  fontWeight: 500,
                                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                                  height: { xs: 20, sm: 24 }
                                }} 
                              />
                            )}
                          </Box>
                          
                          {/* Action Buttons */}
                          <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <Button
                              variant="contained"
                              color="primary"
                              endIcon={<ArrowForward sx={{ fontSize: { xs: '0.9rem', sm: '1.2rem' } }} />}
                              fullWidth
                              sx={{ 
                                borderRadius: { xs: 1.5, sm: 2 },
                                py: { xs: 0.8, sm: 1 },
                                fontWeight: 'bold',
                                fontSize: { xs: '0.8rem', sm: '0.9rem' },
                                minHeight: { xs: 32, sm: 40 },
                                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                                '&:hover': {
                                  background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/jobs');
                              }}
                            >
                              View More Details
                            </Button>
                            <Button
                              variant="outlined"
                              color="secondary"
                              startIcon={<Psychology sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }} />}
                              fullWidth
                              sx={{ 
                                borderRadius: { xs: 1.5, sm: 2 },
                                py: { xs: 0.7, sm: 0.9 },
                                fontWeight: 500,
                                fontSize: { xs: '0.75rem', sm: '0.85rem' },
                                minHeight: { xs: 30, sm: 36 },
                                borderWidth: 1.5,
                                '&:hover': {
                                  bgcolor: alpha(theme.palette.secondary.main, 0.05),
                                  borderWidth: 1.5,
                                  borderColor: theme.palette.secondary.main
                                }
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/register');
                              }}
                            >
                              Get Prepared
                            </Button>
                          </Box>
                        </Paper>
                      </Zoom>
                    </Grid>
                  ))}
                </Grid>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mt: { xs: 3, md: 4 }, 
                    mb: 2,
                    px: { xs: 2, sm: 0 }
                  }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size={isMobile ? "small" : "medium"}
                      showFirstButton={!isMobile}
                      showLastButton={!isMobile}
                      siblingCount={isMobile ? 0 : 1}
                      boundaryCount={isMobile ? 1 : 2}
                      sx={{
                        '& .MuiPaginationItem-root': {
                          borderRadius: { xs: 1.5, sm: 2 },
                          fontWeight: 'bold',
                          fontSize: { xs: '0.8rem', sm: '0.875rem' },
                          minWidth: { xs: 28, sm: 32 },
                          height: { xs: 28, sm: 32 },
                          margin: { xs: '0 1px', sm: '0 2px' },
                          '&.Mui-selected': {
                            background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                            color: 'white',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #66bb6a 30%, #388e3c 90%)',
                            }
                          },
                          '&:hover': {
                            backgroundColor: alpha('#4caf50', 0.08)
                          }
                        }
                      }}
                    />
                  </Box>
                )}

                {/* Jobs Summary */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {featuredJobs.length} of {totalJobs} job opportunities
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center', mt: 6 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    endIcon={<ArrowForward />}
                    sx={{ 
                      mt: 2,
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 'bold',
                      background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                      boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #66bb6a 30%, #388e3c 90%)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 10px 2px rgba(76, 175, 80, .3)',
                      },
                      transition: 'all 0.3s'
                    }}
                    onClick={handleViewMore}
                  >
                    {isAuthenticated ? 'View More in Dashboard' : 'Browse All Jobs'}
                  </Button>
                </Box>
              </>
            )}
          </Container>
        </Box>
      </Fade>

      {/* Features Section with Enhanced Cards */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Fade in={animationTrigger} timeout={1000}>
          <Box textAlign="center" mb={8}>
            <Typography 
              variant="h2" 
              component="h2" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Why Choose Our Platform?
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ 
              maxWidth: '650px', 
              mx: 'auto',
              fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.3rem' },
              lineHeight: 1.6,
              fontWeight: 300
            }}>
              Everything you need to succeed in your career journey, powered by cutting-edge intelligent technology 🚀
            </Typography>
          </Box>
        </Fade>

        <Grid container spacing={{ xs: 3, md: 4 }} mb={8}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={6} key={index}>
              <Zoom in={animationTrigger} timeout={1000 + index * 200}>
                <Card 
                  elevation={6}
                  sx={{ 
                    height: '100%',
                    borderRadius: { xs: 3, md: 4 },
                    overflow: 'hidden',
                    transition: 'all 0.4s ease',
                    background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
                    border: '1px solid rgba(76, 175, 80, 0.1)',
                    cursor: 'pointer',
                    position: 'relative',
                    '&:hover': { 
                      transform: { xs: 'translateY(-4px)', md: 'translateY(-8px)' },
                      boxShadow: '0 15px 40px rgba(76, 175, 80, 0.15)',
                      '& .feature-icon': {
                        transform: 'scale(1.1) rotate(5deg)',
                        color: feature.color
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: feature.gradient || 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                      borderRadius: '4px 4px 0 0'
                    }
                  }}
                >
                  <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'center', sm: 'flex-start' },
                      textAlign: { xs: 'center', sm: 'left' },
                      mb: 3
                    }}>
                      <Avatar
                        className="feature-icon"
                        sx={{ 
                          bgcolor: feature.bgColor,
                          color: feature.color,
                          width: { xs: 70, md: 80 },
                          height: { xs: 70, md: 80 },
                          mb: { xs: 2, sm: 0 },
                          mr: { sm: 3 },
                          boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                          transition: 'all 0.3s ease',
                          fontSize: '2.5rem'
                        }}
                      >
                        {feature.icon}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h5" 
                          component="h3" 
                          gutterBottom 
                          fontWeight="bold"
                          sx={{ 
                            fontSize: { xs: '1.3rem', md: '1.5rem' },
                            color: feature.color,
                            mb: 2
                          }}
                        >
                          {feature.title}
                        </Typography>
                        <Typography 
                          variant="body1" 
                          color="text.secondary" 
                          sx={{ 
                            fontSize: { xs: '0.95rem', md: '1rem' },
                            lineHeight: 1.6,
                            fontWeight: 300
                          }}
                        >
                          {feature.description}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ px: { xs: 3, md: 4 }, pb: { xs: 3, md: 3 }, mt: 'auto' }}>
                    <Button 
                      variant="outlined" 
                      color="primary" 
                      endIcon={<KeyboardArrowRight />}
                      onClick={feature.action}
                      fullWidth
                      sx={{ 
                        fontWeight: 'bold',
                        borderRadius: 3,
                        py: 1.2,
                        borderColor: feature.color,
                        color: feature.color,
                        fontSize: { xs: '0.85rem', md: '0.9rem' },
                        '&:hover': { 
                          bgcolor: feature.bgColor,
                          borderColor: feature.color,
                          transform: 'translateY(-2px)',
                          boxShadow: `0 6px 20px ${alpha(feature.color, 0.2)}`
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Explore Now
                    </Button>
                  </CardActions>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* Benefits Section */}
        <Fade in={animationTrigger} timeout={1500}>
          <Box textAlign="center" mb={8}>
            <Typography 
              variant="h3" 
              component="h2" 
              gutterBottom 
              fontWeight="bold"
              sx={{ 
                background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Benefits of Our Platform
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto', mb: 6 }}>
              We've designed our platform to make your job search experience seamless and effective
            </Typography>
            
            <Grid container spacing={{ xs: 3, md: 4 }}>
              {benefits.map((benefit, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Zoom in={animationTrigger} timeout={1500 + index * 200}>
                    <Paper
                      elevation={3}
                      sx={{
                        p: { xs: 2.5, md: 3 },
                        height: '100%',
                        borderRadius: { xs: 3, md: 4 },
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                        }
                      }}
                    >
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        height: '100%'
                      }}>
                        <Avatar
                          sx={{
                            bgcolor: 'primary.light',
                            width: { xs: 50, md: 60 },
                            height: { xs: 50, md: 60 },
                            mb: { xs: 1.5, md: 2 }
                          }}
                        >
                          {React.cloneElement(benefit.icon, { sx: { color: 'primary.main' } })}
                        </Avatar>
                        <Typography 
                          variant="h6" 
                          gutterBottom 
                          fontWeight="bold"
                          sx={{ 
                            fontSize: { xs: '1.1rem', md: '1.25rem' },
                            textAlign: 'center'
                          }}
                        >
                          {benefit.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary" 
                          align="center"
                          sx={{ 
                            fontSize: { xs: '0.85rem', md: '0.875rem' },
                            lineHeight: 1.5
                          }}
                        >
                          {benefit.description}
                        </Typography>
                      </Box>
                    </Paper>
                  </Zoom>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>

        {/* Enhanced Stats Section */}
        <Fade in={animationTrigger} timeout={2000}>
          <Paper 
            elevation={8}
            sx={{ 
              p: { xs: 3, sm: 4, md: 6 }, 
              mb: { xs: 6, md: 8 }, 
              borderRadius: { xs: 2, md: 4 },
              background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Typography 
              variant="h3" 
              component="h2" 
              textAlign="center" 
              gutterBottom 
              fontWeight="bold" 
              sx={{ 
                mb: { xs: 4, md: 6 },
                fontSize: { xs: '1.8rem', sm: '2.2rem', md: '3rem' }
              }}
            >
              Our Impact in Numbers
            </Typography>
            <Grid container spacing={{ xs: 2, md: 4 }} textAlign="center">
              <Grid item xs={6} md={3}>
                <Box>
                  <EmojiEvents sx={{ fontSize: { xs: 36, md: 48 }, mb: { xs: 1, md: 2 }, opacity: 0.9 }} />
                  <Typography 
                    variant="h2" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' } }}
                  >
                    10K+
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                    }}
                  >
                    Job Opportunities
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Groups sx={{ fontSize: { xs: 36, md: 48 }, mb: { xs: 1, md: 2 }, opacity: 0.9 }} />
                  <Typography 
                    variant="h2" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' } }}
                  >
                    5K+
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      opacity: 0.9,
                      fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }
                    }}
                  >
                    Active Users
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <CheckCircle sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h2" fontWeight="bold" gutterBottom>
                    2K+
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Successful Placements
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} md={3}>
                <Box>
                  <Business sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
                  <Typography variant="h2" fontWeight="bold" gutterBottom>
                    500+
                  </Typography>
                  <Typography variant="h6" sx={{ opacity: 0.9 }}>
                    Partner Companies
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Fade>

        {/* Job Categories Section */}
        <Fade in={animationTrigger} timeout={2000}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 6, 
              mb: 8, 
              borderRadius: 4,
              background: 'white',
              position: 'relative'
            }}
          >
            <Typography variant="h3" component="h2" textAlign="center" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
              Explore Job Categories
            </Typography>
            <Typography variant="h5" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
              Find opportunities in your field of expertise
            </Typography>
            <Grid container spacing={3}>
              {jobCategories.map((category, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      border: '2px solid transparent',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        borderColor: category.color,
                        boxShadow: `0 10px 30px rgba(${category.color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.3)`
                      }
                    }}
                    onClick={() => navigate(`/app/jobs?category=${category.name}`)}
                  >
                    <Box
                      sx={{
                        mb: 2,
                        p: 2,
                        borderRadius: '50%',
                        background: `rgba(${category.color.slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.1)`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {React.cloneElement(category.icon, { sx: { fontSize: 32, color: category.color } })}
                    </Box>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      {category.name}
                    </Typography>
                    <Typography variant="h4" color={category.color} fontWeight="bold" gutterBottom>
                      {category.count}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Open Positions
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Fade>

        {/* Our Services Section */}
        <Fade in={animationTrigger} timeout={3000}>
          <Box sx={{ 
            mb: 8, 
            mt: 6, 
            py: 6, 
            background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(46, 125, 50, 0.1) 100%)',
            borderRadius: 4,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 0,
              width: { xs: '100%', md: '40%' },
              height: '100%',
              background: 'url("/services-bg.svg")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.1,
              zIndex: 0
            }
          }}>
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
              <Box textAlign="center" sx={{ mb: 8 }}>
                <Typography 
                  variant="h3" 
                  component="h2" 
                  gutterBottom 
                  fontWeight="bold"
                  sx={{ 
                    position: 'relative',
                    display: 'inline-block',
                    background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -10,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 80,
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'primary.main'
                    }
                  }}
                >
                  Our Premium Services
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '700px', mx: 'auto', mt: 4 }}>
                  Comprehensive solutions to accelerate your career growth and professional development
                </Typography>
              </Box>
              
              <Grid container spacing={4}>
                {[
                  {
                    title: "AI-Powered Job Matching",
                    description: "Our advanced algorithms analyze your skills, experience, and preferences to connect you with the perfect job opportunities that match your profile.",
                    icon: <Work sx={{ fontSize: 40, color: '#4caf50' }} />,
                    color: '#4caf50',
                    buttonText: "Find Matches"
                  },
                  {
                    title: "Resume Building & Optimization",
                    description: "Create professional resumes with our AI-powered tools that highlight your strengths and optimize your resume for applicant tracking systems.",
                    icon: <Description sx={{ fontSize: 40, color: '#66bb6a' }} />,
                    color: '#66bb6a',
                    buttonText: "Build Resume"
                  },
                  {
                    title: "Interview Preparation",
                    description: "Practice with our AI interview coach that simulates real interviews and provides personalized feedback to improve your performance.",
                    icon: <Psychology sx={{ fontSize: 40, color: '#81c784' }} />,
                    color: '#81c784',
                    buttonText: "Start Practice"
                  },
                  {
                    title: "Career Coaching",
                    description: "Get personalized guidance from industry experts who can help you navigate your career path and achieve your professional goals.",
                    icon: <TrendingUp sx={{ fontSize: 40, color: '#388e3c' }} />,
                    color: '#388e3c',
                    buttonText: "Book Session"
                  },
                  {
                    title: "Skill Certification",
                    description: "Earn industry-recognized certificates through our assessment platform to showcase your expertise to potential employers.",
                    icon: <School sx={{ fontSize: 40, color: '#2e7d32' }} />,
                    color: '#2e7d32',
                    buttonText: "Get Certified"
                  },
                  {
                    title: "Networking Opportunities",
                    description: "Connect with professionals in your field through our networking events, webinars, and community forums.",
                    icon: <People sx={{ fontSize: 40, color: '#1b5e20' }} />,
                    color: '#1b5e20',
                    buttonText: "Join Network"
                  }
                ].map((service, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Zoom in={animationTrigger} timeout={1500 + index * 200}>
                      <Paper
                        elevation={3}
                        sx={{
                          p: 4,
                          height: '100%',
                          borderRadius: 4,
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 32px rgba(0,0,0,0.1)'
                          },
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '5px',
                            background: `linear-gradient(90deg, ${service.color} 0%, ${service.color}99 100%)`
                          }
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: `${service.color}22`,
                            width: 70,
                            height: 70,
                            mb: 3,
                            '& .MuiSvgIcon-root': {
                              fontSize: 36
                            }
                          }}
                        >
                          {service.icon}
                        </Avatar>
                        
                        <Typography variant="h5" component="h3" gutterBottom fontWeight="bold">
                          {service.title}
                        </Typography>
                        
                        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 3, flex: 1 }}>
                          {service.description}
                        </Typography>
                        
                        <Button
                          variant="outlined"
                          color="primary"
                          endIcon={<ArrowForward />}
                          sx={{
                            mt: 'auto',
                            borderRadius: 2,
                            borderColor: service.color,
                            color: service.color,
                            '&:hover': {
                              borderColor: service.color,
                              bgcolor: `${service.color}11`
                            }
                          }}
                          onClick={() => navigate('/app/services')}
                        >
                          {service.buttonText}
                        </Button>
                      </Paper>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
              
              <Box sx={{ textAlign: 'center', mt: 6 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  endIcon={<ArrowForward />}
                  sx={{ 
                    mt: 2,
                    borderRadius: 2,
                    px: 4,
                    py: 1.5,
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                    boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #66bb6a 30%, #388e3c 90%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 10px 2px rgba(76, 175, 80, .3)',
                    },
                    transition: 'all 0.3s'
                  }}
                  onClick={() => navigate('/app/services')}
                >
                  Explore All Services
                </Button>
              </Box>
            </Container>
          </Box>
        </Fade>

        {/* Training Features Section */}
        <Fade in={animationTrigger} timeout={2800}>
          <Box sx={{ py: 8, mb: 8, bgcolor: alpha('#4caf50', 0.03) }}>
            <Container maxWidth="lg">
              <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h3" component="h2" gutterBottom fontWeight="bold" sx={{ mb: 2 }}>
                  How Job Seekers Get <Box component="span" sx={{ color: 'primary.main' }}>Trained</Box>
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}>
                  Our comprehensive training platform prepares you for success with cutting-edge AI technology and personalized learning paths
                </Typography>
              </Box>

              <Grid container spacing={4}>
                {[
                  {
                    icon: <Psychology sx={{ fontSize: 48, color: '#4caf50' }} />,
                    title: 'Psychometric Testing',
                    description: 'Take scientifically-designed assessments to understand your personality, cognitive abilities, and career preferences. Get detailed insights to help employers and yourself understand your strengths.',
                    features: ['Personality Assessment', 'Cognitive Ability Tests', 'Career Interest Profiling', 'Behavioral Analysis'],
                    color: '#4caf50'
                  },
                  {
                    icon: <Work sx={{ fontSize: 48, color: '#66bb6a' }} />,
                    title: 'AI-Powered Interviews',
                    description: 'Practice with our advanced AI interview coach that simulates real interview scenarios. Get real-time feedback on your responses, body language, and communication skills.',
                    features: ['Mock Interviews', 'Real-time Feedback', 'Industry-specific Questions', 'Performance Analytics'],
                    color: '#66bb6a'
                  },
                  {
                    icon: <School sx={{ fontSize: 48, color: '#81c784' }} />,
                    title: 'Live Learning Sessions',
                    description: 'Join interactive courses and workshops led by industry experts. Learn in-demand skills through hands-on projects and collaborative learning experiences.',
                    features: ['Expert-led Workshops', 'Interactive Projects', 'Peer Collaboration', 'Live Q&A Sessions'],
                    color: '#81c784'
                  },
                  {
                    icon: <EmojiEvents sx={{ fontSize: 48, color: '#388e3c' }} />,
                    title: 'Skill Certification',
                    description: 'Earn industry-recognized certificates that validate your expertise. Showcase your achievements to potential employers and advance your career.',
                    features: ['Industry Recognition', 'Portfolio Building', 'LinkedIn Integration', 'Employer Verification'],
                    color: '#388e3c'
                  }
                ].map((training, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Zoom in={animationTrigger} timeout={2000 + index * 200}>
                      <Paper
                        elevation={4}
                        sx={{
                          p: 4,
                          height: '100%',
                          borderRadius: 3,
                          transition: 'all 0.3s ease',
                          border: `2px solid transparent`,
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            borderColor: training.color,
                            boxShadow: `0 20px 40px ${alpha(training.color, 0.1)}`
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
                          <Avatar
                            sx={{
                              bgcolor: alpha(training.color, 0.1),
                              width: 80,
                              height: 80,
                              flexShrink: 0
                            }}
                          >
                            {training.icon}
                          </Avatar>
                          <Box>
                            <Typography variant="h5" fontWeight="bold" gutterBottom>
                              {training.title}
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                              {training.description}
                            </Typography>
                          </Box>
                        </Box>

                        <Box sx={{ mt: 3 }}>
                          <Typography variant="h6" gutterBottom sx={{ color: training.color, fontSize: '1.1rem', fontWeight: 600 }}>
                            Key Features:
                          </Typography>
                          <Grid container spacing={1}>
                            {training.features.map((feature, featureIndex) => (
                              <Grid item xs={12} sm={6} key={featureIndex}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CheckCircle sx={{ fontSize: 18, color: training.color }} />
                                  <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                                    {feature}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>

                        <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha(training.color, 0.2)}` }}>
                          <Button
                            variant="contained"
                            fullWidth
                            sx={{
                              bgcolor: training.color,
                              py: 1.2,
                              borderRadius: 2,
                              fontWeight: 'bold',
                              '&:hover': { bgcolor: training.color }
                            }}
                            onClick={() => navigate('/app/tests')}
                          >
                            Start Training
                          </Button>
                        </Box>
                      </Paper>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>

              {/* Training CTA */}
              <Box sx={{ textAlign: 'center', mt: 6 }}>
                <Paper
                  elevation={6}
                  sx={{
                    p: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #e8f5e8 0%, #f3e5f5 100%)',
                    border: '1px solid',
                    borderColor: alpha('#4caf50', 0.2)
                  }}
                >
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Ready to Start Your Training Journey?
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}>
                    Join thousands of successful job seekers who improved their interview skills and landed their dream jobs through our comprehensive training platform.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<Psychology />}
                      onClick={() => navigate('/app/tests')}
                      sx={{ borderRadius: 2, px: 3 }}
                    >
                      Take Free Assessment
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      startIcon={<PlayArrow />}
                      onClick={() => navigate('/app/interviews')}
                      sx={{ borderRadius: 2, px: 3 }}
                    >
                      Try AI Interview
                    </Button>
                  </Box>
                </Paper>
              </Box>
            </Container>
          </Box>
        </Fade>

        {/* Enhanced Contact Us Section */}
        <Fade in={animationTrigger} timeout={3000}>
          <Box sx={{ py: 8, mb: 8, bgcolor: alpha('#2e7d32', 0.02) }}>
            <Container maxWidth="lg">
              <Grid container spacing={6} alignItems="center">
                {/* Contact Information */}
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
                      Get in <Box component="span" sx={{ color: 'primary.main' }}>Touch</Box>
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
                      Have questions? Need support? Ready to transform your career? We're here to help you every step of the way.
                    </Typography>

                    {/* Contact Methods */}
                    <Box sx={{ mb: 4 }}>
                      {[
                        {
                          icon: <Email sx={{ fontSize: 24, color: '#4caf50' }} />,
                          title: 'Email Us',
                          description: 'Get detailed support via email',
                          contact: 'support@excellencehub.com',
                          action: 'mailto:support@excellencehub.com'
                        },
                        {
                          icon: <Phone sx={{ fontSize: 24, color: '#66bb6a' }} />,
                          title: 'Call Us',
                          description: 'Speak directly with our team',
                          contact: '+1 (555) 123-4567',
                          action: 'tel:+15551234567'
                        },
                        {
                          icon: <LocationOn sx={{ fontSize: 24, color: '#81c784' }} />,
                          title: 'Visit Us',
                          description: 'Meet us at our office',
                          contact: '123 Innovation Street, Tech City',
                          action: '#'
                        }
                      ].map((contact, index) => (
                        <Paper
                          key={index}
                          elevation={2}
                          sx={{
                            p: 3,
                            mb: 2,
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              transform: 'translateX(8px)',
                              bgcolor: alpha('#4caf50', 0.02),
                              borderLeft: '4px solid #4caf50'
                            }
                          }}
                          onClick={() => contact.action !== '#' && window.open(contact.action)}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: alpha(contact.icon.props.sx.color, 0.1), width: 50, height: 50 }}>
                              {contact.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" fontWeight="bold">
                                {contact.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                                {contact.description}
                              </Typography>
                              <Typography variant="body2" color="primary" fontWeight="medium">
                                {contact.contact}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      ))}
                    </Box>

                    {/* Quick Stats */}
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {[
                        { number: '50,000+', label: 'Happy Job Seekers' },
                        { number: '24/7', label: 'Support Available' },
                        { number: '< 2hrs', label: 'Average Response Time' }
                      ].map((stat, index) => (
                        <Box key={index} sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight="bold" color="primary.main">
                            {stat.number}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {stat.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Grid>

                {/* Contact Form */}
                <Grid item xs={12} md={6}>
                  <Paper
                    elevation={6}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      border: '1px solid',
                      borderColor: alpha('#4caf50', 0.1)
                    }}
                  >
                    <Typography variant="h5" fontWeight="bold" gutterBottom>
                      Send us a Message
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Fill out the form below and we'll get back to you within 24 hours.
                    </Typography>

                    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="First Name"
                            variant="outlined"
                            sx={{ bgcolor: 'white', borderRadius: 1 }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            variant="outlined"
                            sx={{ bgcolor: 'white', borderRadius: 1 }}
                          />
                        </Grid>
                      </Grid>
                      
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        variant="outlined"
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Subject"
                        variant="outlined"
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                      />
                      
                      <TextField
                        fullWidth
                        label="Message"
                        multiline
                        rows={4}
                        variant="outlined"
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                      />
                      
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForward />}
                        sx={{
                          mt: 2,
                          py: 1.5,
                          borderRadius: 2,
                          fontWeight: 'bold',
                          background: 'linear-gradient(45deg, #4caf50 30%, #2e7d32 90%)',
                          boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #66bb6a 30%, #388e3c 90%)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 10px 2px rgba(76, 175, 80, .3)',
                          },
                          transition: 'all 0.3s'
                        }}
                      >
                        Send Message
                      </Button>
                    </Box>

                    {/* Trust Indicators */}
                    <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: alpha('#4caf50', 0.1) }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<Verified />}
                          label="Secure & Private"
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                        <Chip
                          icon={<AccessTime />}
                          label="Quick Response"
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        <Chip
                          icon={<Support />}
                          label="Expert Support"
                          size="small"
                          variant="outlined"
                          color="info"
                        />
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Container>
          </Box>
        </Fade>

        {/* SEO-Rich Statistics Section */}
        <Fade in={animationTrigger} timeout={2800}>
          <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'grey.50' }}>
            <Container maxWidth="lg">
              <Typography 
                variant="h2" 
                component="h2" 
                textAlign="center" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  mb: 2,
                  color: 'primary.main'
                }}
              >
                Trusted by Professionals Worldwide
              </Typography>
              <Typography 
                variant="h5" 
                textAlign="center" 
                sx={{ 
                  mb: 6, 
                  color: 'text.secondary',
                  maxWidth: '600px',
                  mx: 'auto'
                }}
              >
                Real numbers from real success stories in career advancement and job placement
              </Typography>
              
              <Grid container spacing={4}>
                {[
                  { number: '50,000+', label: 'Professionals Hired', description: 'Successfully placed in dream careers across 50+ countries', icon: <People sx={{ fontSize: 50 }} /> },
                  { number: '15,000+', label: 'Partner Companies', description: 'From startups to Fortune 500 companies actively recruiting', icon: <Business sx={{ fontSize: 50 }} /> },
                  { number: '95%', label: 'Success Rate', description: 'Of users who complete our career coaching program get hired', icon: <EmojiEvents sx={{ fontSize: 50 }} /> },
                  { number: '4.8/5', label: 'User Satisfaction', description: 'Average rating from over 25,000 verified user reviews', icon: <Star sx={{ fontSize: 50 }} /> },
                  { number: '3x', label: 'Faster Hiring', description: 'Average time to get hired compared to traditional job search', icon: <Speed sx={{ fontSize: 50 }} /> },
                  { number: '$75K+', label: 'Average Salary', description: 'Median salary increase for users after using our platform', icon: <TrendingUp sx={{ fontSize: 50 }} /> }
                ].map((stat, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Zoom in={animationTrigger} timeout={1000 + index * 200}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          textAlign: 'center', 
                          p: 3,
                          borderRadius: 3,
                          boxShadow: '0 8px 32px rgba(76, 175, 80, 0.1)',
                          border: '1px solid',
                          borderColor: 'divider',
                          '&:hover': {
                            transform: 'translateY(-8px)',
                            boxShadow: '0 16px 48px rgba(76, 175, 80, 0.2)',
                            borderColor: 'primary.main'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <Box sx={{ color: 'primary.main', mb: 2 }}>
                          {stat.icon}
                        </Box>
                        <Typography variant="h3" component="h3" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {stat.number}
                        </Typography>
                        <Typography variant="h6" component="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                          {stat.label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                          {stat.description}
                        </Typography>
                      </Card>
                    </Zoom>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>
        </Fade>

        {/* Comprehensive FAQ Section */}
        <Fade in={animationTrigger} timeout={3000}>
          <Box sx={{ py: { xs: 6, md: 10 } }}>
            <Container maxWidth="lg">
              <Typography 
                variant="h2" 
                component="h2" 
                textAlign="center" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  mb: 2,
                  color: 'primary.main'
                }}
              >
                Frequently Asked Questions
              </Typography>
              <Typography 
                variant="h5" 
                textAlign="center" 
                sx={{ 
                  mb: 6, 
                  color: 'text.secondary',
                  maxWidth: '700px',
                  mx: 'auto'
                }}
              >
                Everything you need to know about finding your dream career with ExJobNet
              </Typography>
              
              <Grid container spacing={4}>
                {[
                  {
                    question: "How does ExJobNet's job matching work?",
                    answer: "Our AI-powered system analyzes your skills, experience, preferences, and career goals to match you with the most relevant job opportunities. We use advanced algorithms to ensure you see positions that align with your professional aspirations and have a high likelihood of success."
                  },
                  {
                    question: "What makes your interview coaching different?",
                    answer: "Our AI interview coach provides personalized, real-time feedback on your responses, body language, and speaking pace. It simulates real interview scenarios specific to your industry and gives you detailed analytics to improve your performance. Over 95% of users report feeling more confident after our coaching sessions."
                  },
                  {
                    question: "Are the job postings verified and legitimate?",
                    answer: "Yes, every company on our platform goes through a rigorous verification process. We validate business licenses, check company reputation, and ensure all job postings meet our quality standards. Our dedicated team reviews each posting to protect job seekers from scams and fraudulent opportunities."
                  },
                  {
                    question: "How much does it cost to use ExJobNet?",
                    answer: "Basic job searching is completely free. Our premium features like advanced analytics, unlimited AI coaching sessions, priority support, and exclusive job opportunities are available through affordable monthly plans starting at $29/month. Many users find jobs within the free tier."
                  },
                  {
                    question: "Can I use the platform if I'm currently employed?",
                    answer: "Absolutely! Our platform is designed for both active job seekers and passive candidates. You can set your profile to 'open to opportunities' privately, receive confidential job recommendations, and network with recruiters without your current employer knowing."
                  },
                  {
                    question: "What types of jobs are available on the platform?",
                    answer: "We feature opportunities across all major industries including Technology, Healthcare, Finance, Marketing, Education, Engineering, Design, Sales, and more. From entry-level positions to executive roles, full-time to contract work, remote to on-site - we have opportunities for every career stage."
                  },
                  {
                    question: "How long does it typically take to find a job?",
                    answer: "On average, active users find suitable opportunities within 2-4 weeks. Users who complete our career optimization program and actively engage with our coaching tools typically see results 3x faster than traditional job search methods. Success depends on market conditions, your experience level, and industry."
                  },
                  {
                    question: "Do you offer support for career changers?",
                    answer: "Yes! We specialize in career transitions. Our platform includes career assessment tools, skill gap analysis, personalized learning recommendations, and mentorship programs. We help you identify transferable skills and position yourself effectively for new industries or roles."
                  }
                ].map((faq, index) => (
                  <Grid item xs={12} md={6} key={index}>
                    <Card 
                      sx={{ 
                        p: 3, 
                        height: '100%',
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: '0 8px 32px rgba(76, 175, 80, 0.1)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Typography 
                        variant="h6" 
                        component="h3" 
                        gutterBottom 
                        sx={{ 
                          fontWeight: 'bold',
                          color: 'primary.main',
                          mb: 2
                        }}
                      >
                        {faq.question}
                      </Typography>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          color: 'text.secondary',
                          lineHeight: 1.7
                        }}
                      >
                        {faq.answer}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>
        </Fade>

        {/* Success Stories & Testimonials */}
        <Fade in={animationTrigger} timeout={3200}>
          <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'primary.main', color: 'white' }}>
            <Container maxWidth="lg">
              <Typography 
                variant="h2" 
                component="h2" 
                textAlign="center" 
                gutterBottom
                sx={{ 
                  fontWeight: 'bold',
                  mb: 2,
                  color: 'white'
                }}
              >
                Success Stories That Inspire
              </Typography>
              <Typography 
                variant="h5" 
                textAlign="center" 
                sx={{ 
                  mb: 6, 
                  opacity: 0.9,
                  maxWidth: '600px',
                  mx: 'auto'
                }}
              >
                Real professionals sharing their career transformation journeys
              </Typography>
              
              <Grid container spacing={4}>
                {[
                  {
                    name: "Sarah Mitchell",
                    role: "Senior Data Scientist at Google",
                    company: "Google",
                    story: "ExJobNet transformed my career completely. Their AI interview coach helped me prepare for technical interviews, and I landed my dream role at Google with a 60% salary increase. The personalized job matching saved me months of searching.",
                    rating: 5,
                    image: "S",
                    previousRole: "Junior Analyst",
                    timeToHire: "3 weeks"
                  },
                  {
                    name: "Michael Chen",
                    role: "Product Manager at Microsoft",
                    company: "Microsoft",
                    story: "As a career changer from engineering to product management, I was lost. The platform's career guidance and mentorship program gave me the roadmap I needed. Now I'm leading product strategy at Microsoft.",
                    rating: 5,
                    image: "M",
                    previousRole: "Software Engineer",
                    timeToHire: "5 weeks"
                  },
                  {
                    name: "Emma Rodriguez",
                    role: "Marketing Director at Shopify",
                    company: "Shopify",
                    story: "The networking features and exclusive job opportunities are unmatched. I connected directly with hiring managers and skipped the traditional application process entirely. My career has accelerated beyond my expectations.",
                    rating: 5,
                    image: "E",
                    previousRole: "Marketing Specialist",
                    timeToHire: "2 weeks"
                  }
                ].map((testimonial, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card 
                      sx={{ 
                        p: 4, 
                        height: '100%',
                        bgcolor: 'rgba(255,255,255,0.1)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: 3,
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.15)',
                          transform: 'translateY(-5px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'white', 
                            color: 'primary.main', 
                            width: 60, 
                            height: 60,
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            mr: 2
                          }}
                        >
                          {testimonial.image}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                            {testimonial.name}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.8 }}>
                            {testimonial.role}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                            <Rating value={testimonial.rating} readOnly size="small" />
                            <Typography variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                              Hired in {testimonial.timeToHire}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontStyle: 'italic',
                          lineHeight: 1.6,
                          mb: 2
                        }}
                      >
                        "{testimonial.story}"
                      </Typography>
                      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', my: 2 }} />
                      <Typography variant="body2" sx={{ opacity: 0.8 }}>
                        Career transition: {testimonial.previousRole} → {testimonial.role}
                      </Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>
        </Fade>

        {/* Final CTA Section */}
        <Fade in={animationTrigger} timeout={3000}>
          <Paper
            elevation={8}
            sx={{
              p: { xs: 4, md: 8 },
              mb: 8,
              borderRadius: 4,
              background: 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)',
              color: 'white',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z" fill="%23ffffff" fill-opacity="0.1" fill-rule="evenodd"/%3E%3C/svg%3E")',
                opacity: 0.3
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, maxWidth: '800px', mx: 'auto' }}>
              <Typography variant="h3" component="h2" gutterBottom fontWeight="bold">
                Ready to Accelerate Your Career?
              </Typography>
              <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, maxWidth: '600px', mx: 'auto' }}>
                Join thousands of professionals who have found their dream jobs through our platform
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<RocketLaunch />}
                  sx={{ 
                    bgcolor: 'white', 
                    color: 'primary.main',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    '&:hover': { 
                      bgcolor: 'grey.100',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.3)'
                    },
                    transition: 'all 0.3s'
                  }}
                  onClick={() => navigate('/register')}
                >
                  Create Free Account
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Search />}
                  sx={{ 
                    borderColor: 'white', 
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    fontWeight: 'bold',
                    borderWidth: 2,
                    '&:hover': { 
                      borderColor: 'white', 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s'
                  }}
                  onClick={() => navigate('/app/jobs')}
                >
                  Browse Jobs
                </Button>
              </Box>
            </Box>
          </Paper>
        </Fade>
      </Container>
      </Box>
      <FloatingContact />
      <FloatingAIAssistant />
    </PublicLayout>
  );
};

export default HomePage;
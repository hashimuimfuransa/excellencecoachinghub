import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Avatar,
  Chip,
  Rating,
  useTheme,
  useMediaQuery,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Divider,
  Paper,
  LinearProgress,
  IconButton
} from '@mui/material';
import {
  School,
  Quiz,
  VideoCall,
  EmojiEvents,
  Security,
  TrendingUp,
  People,
  Star,
  PlayArrow,
  CheckCircle,
  ExpandMore,
  HelpOutline,
  QuestionAnswer,
  Email,
  AutoAwesome,
  Psychology,
  Speed,
  Groups,
  Verified,
  WorkspacePremium,
  SmartToy,
  Analytics,
  Code,
  DataUsage,
  Palette,
  Business,
  Language,
  LocalHospital,
  Engineering,
  Functions,
  RocketLaunch,
  ElectricBolt,
  LightbulbOutlined,
  MenuBook,
  AutoGraph,
  Support,
  Explore,
  Description,
  Assessment
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from 'react-query';
import { courseService } from '../../services/courseService';
import FloatingContact from '../../components/FloatingContact';
import FloatingAIAssistant from '../../components/FloatingAIAssistant';
import HomeLearningInterestPopup from '../../components/Home/HomeLearningInterestPopup';

// Ultra-Modern Hero Section with Contemporary Design
const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        background: `
          linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%),
          linear-gradient(45deg, rgba(0,0,0,0.8) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)
        `,
        backgroundSize: '300% 300%',
        animation: 'gradientShift 8s ease infinite',
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        color: 'white',
        pt: { xs: 4, md: 6 },
        pb: { xs: 8, md: 12 },
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center'
      }}
    >
      {/* Glassmorphism Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '50%': { transform: 'translateY(-30px) rotate(180deg)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '8%',
          width: 150,
          height: 150,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'float 8s ease-in-out infinite reverse',
          transform: 'rotate(45deg)'
        }}
      />
      
      {/* Modern Mesh Gradient Overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 25% 25%, rgba(120, 119, 198, 0.4) 0%, transparent 60%),
            radial-gradient(circle at 75% 75%, rgba(255, 119, 198, 0.3) 0%, transparent 60%),
            radial-gradient(circle at 50% 50%, rgba(74, 144, 226, 0.2) 0%, transparent 60%),
            conic-gradient(from 45deg at 80% 20%, rgba(255, 183, 77, 0.2) 0deg, transparent 120deg),
            conic-gradient(from 225deg at 20% 80%, rgba(129, 200, 132, 0.2) 0deg, transparent 120deg)
          `,
          opacity: 0.8
        }}
      />
      
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Grid container spacing={6} alignItems="center" sx={{ minHeight: '80vh' }}>
          <Grid item xs={12} lg={6}>
            {/* AI-Powered Badge */}
            <Box sx={{ mb: 4 }}>
              <Chip
                icon={<AutoAwesome sx={{ fontSize: 18, color: '#FFD700 !important' }} />}
                label="🚀 Excellence Coaching Hub"
                sx={{
                  bgcolor: 'rgba(255, 215, 0, 0.15)',
                  color: '#FFD700',
                  fontWeight: 600,
                  px: 2,
                  py: 0.5,
                  fontSize: '0.9rem',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  backdropFilter: 'blur(10px)',
                  '& .MuiChip-icon': { color: '#FFD700' }
                }}
              />
            </Box>

            <Typography
              variant="h1"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 900,
                fontSize: { xs: '3rem', md: '5.5rem' },
                lineHeight: 0.9,
                mb: 4,
                background: 'linear-gradient(135deg, #ffffff 0%, #e3f2fd 25%, #bbdefb 50%, #90caf9 75%, #64b5f6 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 60px rgba(255, 255, 255, 0.5)',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              Empower Your Future
              <Box 
                component="span" 
                sx={{ 
                  display: 'block',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA726 50%, #FF7043 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    bottom: -10,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: 'linear-gradient(135deg, #FFD700, #FF7043)',
                    borderRadius: 2,
                    opacity: 0.7
                  }
                }}
              >
                with Excellence
              </Box>
            </Typography>
            
            <Typography
              variant="h4"
              sx={{
                mb: 6,
                opacity: 0.95,
                fontWeight: 400,
                lineHeight: 1.5,
                color: '#f8fafc',
                maxWidth: 600,
                fontSize: { xs: '1.3rem', md: '1.6rem' }
              }}
            >
              Join thousands of learners and job seekers gaining in-demand skills through expert-led online courses, personalized coaching, and real-world assessments designed for today's competitive job market.
            </Typography>
            
            {/* Modern Trust Indicators */}
            <Paper
              elevation={0}
              sx={{
                mb: 6,
                p: 3,
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 3
              }}
            >
              <Typography variant="body2" sx={{ color: '#e3f2fd', mb: 2, opacity: 0.9, fontWeight: 500 }}>
                🏆 Excellence Coaching Hub - Empowering Job Seekers & Professionals
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1.5 }}>
                {[
                  { name: '✅ In-Demand Job Market Skills', color: '#4CAF50' },
                  { name: '✅ Career-Focused Training', color: '#2196F3' },
                  { name: '✅ Industry-Ready Certification', color: '#FF9800' },
                  { name: '✅ Job Placement Support', color: '#9C27B0' },
                  { name: '✅ Future Skills Development', color: '#F44336' }
                ].map((feature, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      px: 2.5,
                      py: 1.2,
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${feature.color}40`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                        transform: 'translateY(-2px)',
                        boxShadow: `0 8px 25px ${feature.color}30`
                      }
                    }}
                  >
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: 'white', 
                        fontWeight: 600,
                        fontSize: '0.85rem'
                      }}
                    >
                      {feature.name}
                    </Typography>
                  </Paper>
                ))}
              </Stack>
            </Paper>
            
            {/* Modern CTA Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ mb: 6 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<RocketLaunch />}
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  px: 3.5,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  boxShadow: '0 6px 24px rgba(102, 126, 234, 0.35)',
                  minWidth: { xs: '100%', sm: '200px' },
                  height: '52px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 32px rgba(102, 126, 234, 0.5)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {isAuthenticated ? 'Continue Learning' : 'Start Learning Today'}
              </Button>
              
              <Button
                variant="contained"
                size="large"
                startIcon={<Description />}
                onClick={() => navigate('/past-papers')}
                sx={{
                  background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
                  color: 'white',
                  px: 3.5,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: 2.5,
                  textTransform: 'none',
                  boxShadow: '0 6px 24px rgba(233, 30, 99, 0.35)',
                  minWidth: { xs: '100%', sm: '200px' },
                  height: '52px',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d81b60 0%, #9c27b0 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 10px 32px rgba(233, 30, 99, 0.5)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                📝 Practice Past Papers
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<PlayArrow />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  color: 'white',
                  px: 3.5,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2.5,
                  borderWidth: 2,
                  textTransform: 'none',
                  backdropFilter: 'blur(10px)',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  minWidth: { xs: '100%', sm: '180px' },
                  height: '52px',
                  '&:hover': {
                    borderColor: '#FFD700',
                    color: '#FFD700',
                    bgcolor: 'rgba(255, 215, 0, 0.1)',
                    transform: 'translateY(-2px)',
                    borderWidth: 2
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Watch Demo
              </Button>
            </Stack>
            
            {/* Enhanced Stats with Progress Animations */}
            <Grid container spacing={4}>
              {[
                { value: '50K+', label: 'Active Learners', icon: Groups, color: '#4CAF50' },
                { value: '200+', label: 'Expert Courses', icon: MenuBook, color: '#FF9800' },
                { value: '95%', label: 'Completion Rate', icon: TrendingUp, color: '#2196F3' }
              ].map((stat, index) => (
                <Grid item xs={4} key={index}>
                  <Box 
                    sx={{ 
                      textAlign: 'center',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        bgcolor: 'rgba(255, 255, 255, 0.15)'
                      }
                    }}
                  >
                    <stat.icon sx={{ fontSize: 24, color: stat.color, mb: 1 }} />
                    <Typography variant="h5" sx={{ fontWeight: 800, color: stat.color, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.75rem' }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
          
          <Grid item xs={12} lg={6}>
            <Box
              sx={{
                position: 'relative',
                height: { xs: 300, md: 500 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {/* Ultra-Modern 3D Floating Cards */}
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  perspective: '1000px',
                  '& .floating-card': {
                    position: 'absolute',
                    borderRadius: 4,
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-15px) rotateY(5deg) scale(1.05)',
                      boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)'
                    }
                  }
                }}
              >
                {/* AI Learning Card */}
                <Paper
                  className="floating-card"
                  elevation={0}
                  sx={{
                    top: '10%',
                    right: '5%',
                    width: 200,
                    p: 3,
                    bgcolor: 'rgba(102, 126, 234, 0.15)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    animation: 'float 6s ease-in-out infinite',
                    '@keyframes float': {
                      '0%, 100%': { transform: 'translateY(0px) rotateY(0deg)' },
                      '50%': { transform: 'translateY(-25px) rotateY(10deg)' }
                    }
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <People sx={{ fontSize: 40, color: '#667eea', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                      Expert Instructors
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Professional Coaching
                    </Typography>
                  </Box>
                </Paper>

                {/* Interactive Sessions Card */}
                <Paper
                  className="floating-card"
                  elevation={0}
                  sx={{
                    top: '30%',
                    left: '10%',
                    width: 180,
                    p: 3,
                    bgcolor: 'rgba(255, 107, 107, 0.15)',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                    animation: 'float 8s ease-in-out infinite',
                    animationDelay: '2s'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <VideoCall sx={{ fontSize: 40, color: '#ff6b6b', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                      Live & Recorded
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Flexible Learning
                    </Typography>
                  </Box>
                </Paper>

                {/* Certification Card */}
                <Paper
                  className="floating-card"
                  elevation={0}
                  sx={{
                    bottom: '20%',
                    right: '10%',
                    width: 190,
                    p: 3,
                    bgcolor: 'rgba(255, 193, 7, 0.15)',
                    border: '1px solid rgba(255, 193, 7, 0.3)',
                    animation: 'float 10s ease-in-out infinite',
                    animationDelay: '4s'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <WorkspacePremium sx={{ fontSize: 40, color: '#ffc107', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                      Certification
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Progress Tracking
                    </Typography>
                  </Box>
                </Paper>

                {/* Progress Analytics Card */}
                <Paper
                  className="floating-card"
                  elevation={0}
                  sx={{
                    bottom: '10%',
                    left: '5%',
                    width: 175,
                    p: 3,
                    bgcolor: 'rgba(76, 175, 80, 0.15)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    animation: 'float 7s ease-in-out infinite',
                    animationDelay: '1s'
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <MenuBook sx={{ fontSize: 40, color: '#4caf50', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', mb: 1 }}>
                      Weekly Paths
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Structured Learning
                    </Typography>
                  </Box>
                </Paper>

                {/* Central Glow Effect */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 100,
                    height: 100,
                    transform: 'translate(-50%, -50%)',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                    animation: 'pulse 4s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
                      '50%': { transform: 'translate(-50%, -50%) scale(1.2)' }
                    }
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

// Modern Categories Section with Enhanced Design
const CategoriesSection: React.FC = () => {
  const navigate = useNavigate();
  
  const categories = [
    {
      name: 'Professional Coaching',
      id: 'professional_coaching',
      icon: Business,
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      count: '⭐ Popular',
      description: 'Leadership, Executive, Project Management, CPA/CAT/ACCA',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
    },
    {
      name: 'Business & Entrepreneurship Coaching',
      id: 'business_entrepreneurship',
      icon: TrendingUp,
      color: '#4facfe',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      count: '⭐ Popular',
      description: 'Startup, Strategy, Finance, Marketing, Innovation',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
    },
    {
      name: 'Academic Coaching',
      id: 'academic_coaching',
      icon: School,
      color: '#a8edea',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      count: 'All levels',
      description: 'Primary, Secondary, University, Nursery, Exams, Research',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87d7ce4a1?w=500&h=300&fit=crop'
    },
    {
      name: 'Language Coaching',
      id: 'language_coaching',
      icon: QuestionAnswer,
      color: '#fa709a',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      count: 'Fluency',
      description: 'English, French, Kinyarwanda, Business Communication',
      image: 'https://images.unsplash.com/photo-1516534775068-bb57b42fc91d?w=500&h=300&fit=crop'
    },
    {
      name: 'Technical & Digital Coaching',
      id: 'technical_digital_coaching',
      icon: Code,
      color: '#43e97b',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      count: 'In-demand',
      description: 'AI, Data, Cybersecurity, Cloud, Dev, Digital Marketing',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop'
    },
    {
      name: 'Job Seeker Coaching',
      id: 'job_seeker_coaching',
      icon: WorkspacePremium,
      color: '#ff9966',
      gradient: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
      count: 'Career-ready',
      description: 'Career choice, skills, exams, interview, resume',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
    },
    {
      name: 'Personal & Corporate Development',
      id: 'personal_corporate_coaching',
      icon: Psychology,
      color: '#b06ab3',
      gradient: 'linear-gradient(135deg, #b06ab3 0%, #4568dc 100%)',
      count: 'Growth',
      description: 'Communication, EI, Time, Team, HR, Ethics',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop'
    }
  ];

  return (
    <Box 
      sx={{ 
        py: 12, 
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage: `
            radial-gradient(circle at 25% 25%, #667eea 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, #f093fb 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #4facfe 0%, transparent 50%)
          `
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Box sx={{ mb: 3 }}>
            <Chip
              icon={<LightbulbOutlined />}
              label="🎯 Choose Your Path"
              sx={{
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                color: '#667eea',
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.9rem',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}
            />
          </Box>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 800, 
              color: 'text.primary',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #667eea 0%, #f093fb 50%, #4facfe 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3
            }}
          >
            Explore Our Top Programs
          </Typography>
          <Typography
            variant="h5"
            sx={{ 
              color: 'text.secondary', 
              maxWidth: 700, 
              mx: 'auto',
              lineHeight: 1.6,
              fontWeight: 400
            }}
          >
            Master in-demand skills for today's job market — from leadership to technology, academic success to business mastery. Enhance your employability with future-ready competencies.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {categories.map((category, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 4,
                  overflow: 'hidden',
                  position: 'relative',
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    transform: 'translateY(-12px) scale(1.02)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.15)',
                    borderColor: category.color,
                    '& .category-gradient': {
                      opacity: 1,
                      transform: 'scale(1.1)'
                    },
                    '& .category-icon': {
                      transform: 'scale(1.2) rotate(10deg)',
                      color: '#fff'
                    }
                  }
                }}
                onClick={() => {
                  if ((category as any).id) {
                    const interests = { categories: [(category as any).id] } as any;
                    const encoded = encodeURIComponent(JSON.stringify(interests));
                    navigate(`/dashboard/student/courses?tab=discover&interests=${encoded}`);
                  } else {
                    navigate(`/courses?category=${encodeURIComponent(category.name)}`);
                  }
                }}
              >
                {/* Category Image */}
                {(category as any).image && (
                  <Box
                    sx={{
                      width: '100%',
                      height: 180,
                      backgroundImage: `url(${(category as any).image})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.6) 100%)',
                        zIndex: 1
                      }
                    }}
                  />
                )}
                
                {/* Gradient Overlay */}
                <Box
                  className="category-gradient"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: category.gradient,
                    opacity: 0,
                    transition: 'all 0.4s ease',
                    transform: 'scale(0.8)',
                    borderRadius: 4
                  }}
                />
                
                <CardContent sx={{ p: 4, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  <Box sx={{ mb: 3 }}>
                    <category.icon
                      className="category-icon"
                      sx={{
                        fontSize: 48,
                        color: category.color,
                        transition: 'all 0.4s ease'
                      }}
                    />
                  </Box>
                  
                  <Typography
                    variant="h5"
                    component="h3"
                    gutterBottom
                    sx={{ 
                      fontWeight: 700,
                      color: 'text.primary',
                      mb: 2,
                      position: 'relative',
                      zIndex: 2
                    }}
                  >
                    {category.name}
                  </Typography>
                  
                  <Typography
                    variant="body2"
                    sx={{ 
                      color: 'text.secondary',
                      mb: 2,
                      lineHeight: 1.5,
                      position: 'relative',
                      zIndex: 2
                    }}
                  >
                    {category.description}
                  </Typography>
                  
                  <Chip
                    label={category.count}
                    size="small"
                    sx={{
                      bgcolor: `${category.color}15`,
                      color: category.color,
                      fontWeight: 600,
                      border: `1px solid ${category.color}30`,
                      position: 'relative',
                      zIndex: 2
                    }}
                  />
                </CardContent>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<ElectricBolt />}
            onClick={() => navigate('/courses')}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: 3,
              textTransform: 'none',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Explore All Categories
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

// Job Market Skills Section
const JobMarketSkillsSection: React.FC = () => {
  const navigate = useNavigate();
  
  const inDemandSkills = [
    { 
      skill: 'Digital Marketing',
      demand: 'High',
      growth: '+85%',
      averageSalary: '$45-65K',
      icon: TrendingUp,
      color: '#4facfe'
    },
    { 
      skill: 'Data Analysis',
      demand: 'Very High',
      growth: '+120%',
      averageSalary: '$55-75K',
      icon: Analytics,
      color: '#f093fb'
    },
    { 
      skill: 'Project Management',
      demand: 'High',
      growth: '+70%',
      averageSalary: '$60-80K',
      icon: Business,
      color: '#43e97b'
    },
    { 
      skill: 'Public Speaking',
      demand: 'Medium',
      growth: '+45%',
      averageSalary: '$40-60K',
      icon: QuestionAnswer,
      color: '#fa709a'
    }
  ];

  return (
    <Box 
      sx={{ 
        py: 12, 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
        position: 'relative'
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip
            icon={<TrendingUp sx={{ fontSize: 18, color: '#4CAF50 !important' }} />}
            label="🚀 Job Market Insights"
            sx={{
              bgcolor: 'rgba(76, 175, 80, 0.1)',
              color: '#4CAF50',
              fontWeight: 600,
              px: 2,
              py: 0.5,
              fontSize: '0.9rem',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              mb: 3
            }}
          />
          
          <Typography
            variant="h3"
            component="h2"
            gutterBottom
            sx={{
              fontWeight: 800,
              color: '#1a202c',
              mb: 3
            }}
          >
            Master Skills That Employers Want
          </Typography>
          
          <Typography
            variant="h5"
            sx={{ 
              color: 'text.secondary', 
              maxWidth: 700, 
              mx: 'auto',
              lineHeight: 1.6,
              fontWeight: 400,
              mb: 6
            }}
          >
            Enhance your job prospects with our carefully curated courses focused on the most in-demand skills in today's competitive job market.
          </Typography>
        </Box>

        {/* Skills Grid */}
        <Grid container spacing={4}>
          {inDemandSkills.map((skillData, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: `0 20px 40px ${skillData.color}20`,
                    borderColor: skillData.color
                  }
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      bgcolor: `${skillData.color}15`,
                      mb: 2,
                      border: `2px solid ${skillData.color}30`
                    }}
                  >
                    <skillData.icon sx={{ fontSize: 28, color: skillData.color }} />
                  </Box>
                  
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a202c' }}>
                    {skillData.skill}
                  </Typography>
                  
                  <Chip
                    label={`${skillData.demand} Demand`}
                    size="small"
                    sx={{
                      bgcolor: `${skillData.color}15`,
                      color: skillData.color,
                      fontWeight: 600,
                      mb: 2
                    }}
                  />
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      <strong>Job Growth:</strong> {skillData.growth}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      <strong>Avg. Salary:</strong> {skillData.averageSalary}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* CTA */}
        <Box sx={{ textAlign: 'center', mt: 8 }}>
          <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
            Ready to build your future career?
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<RocketLaunch />}
            onClick={() => navigate('/courses')}
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              px: 6,
              py: 2,
              fontSize: '1.1rem',
              fontWeight: 700,
              borderRadius: 3,
              textTransform: 'none',
              boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049 0%, #388e3c 100%)',
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            Start Building Job-Ready Skills
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

// Next-Gen Features Section with Advanced Design
const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: People,
      title: 'Expert Instructors',
      description: 'Learn from industry professionals and certified coaches with real-world experience and proven track records.',
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      badge: 'Expert Learning'
    },
    {
      icon: VideoCall,
      title: 'Live & Recorded Sessions',
      description: 'Join interactive live classes or access comprehensive recorded sessions anytime, anywhere at your own pace.',
      color: '#f093fb',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      badge: 'Flexible Learning'
    },
    {
      icon: MenuBook,
      title: 'Weekly Learning Paths',
      description: 'Follow structured weekly learning plans designed for optimal knowledge retention and skill development.',
      color: '#4facfe',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      badge: 'Structured Progress'
    },
    {
      icon: Support,
      title: 'Cloud-Based Materials',
      description: 'Access all course materials, resources, and tools from our secure cloud platform on any device.',
      color: '#43e97b',
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      badge: 'Always Available'
    },
    {
      icon: Analytics,
      title: 'Progress Tracking & Certification',
      description: 'Monitor your learning journey with detailed analytics and earn recognized certificates upon completion.',
      color: '#fa709a',
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      badge: 'Measurable Results'
    },
    {
      icon: WorkspacePremium,
      title: 'Job Market Readiness',
      description: 'Build job-ready skills with industry-focused curriculum designed to enhance your employability and career prospects.',
      color: '#a8edea',
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      badge: 'Career Ready'
    }
  ];

  return (
    <Box 
      sx={{ 
        py: 15, 
        background: `
          linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%),
          linear-gradient(45deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%)
        `,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 40% 60%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
          animation: 'shimmer 8s ease-in-out infinite',
          '@keyframes shimmer': {
            '0%, 100%': { opacity: 0.3 },
            '50%': { opacity: 0.8 }
          }
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 12 }}>
          <Box sx={{ mb: 4 }}>
            <Chip
              icon={<AutoAwesome sx={{ color: '#FFD700 !important' }} />}
              label="✨ Next-Generation Features"
              sx={{
                bgcolor: 'rgba(255, 215, 0, 0.15)',
                color: '#FFD700',
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.95rem',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                backdropFilter: 'blur(20px)'
              }}
            />
          </Box>
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 900, 
              fontSize: { xs: '2.5rem', md: '4rem' },
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 60px rgba(255, 255, 255, 0.3)',
              mb: 4
            }}
          >
            Why Excellence Coaching Hub?
          </Typography>
          <Typography
            variant="h4"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              maxWidth: 800, 
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6,
              fontSize: { xs: '1.2rem', md: '1.5rem' }
            }}
          >
            Excellence Coaching Hub is a modern eLearning platform built to empower students, professionals, job seekers, and organizations with practical, high-quality learning experiences that drive career success.
          </Typography>
        </Box>

        <Grid container spacing={5}>
          {features.map((feature, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 4,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  '&:hover': {
                    transform: 'translateY(-15px) rotateY(5deg) scale(1.02)',
                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)',
                    background: 'rgba(255, 255, 255, 0.15)',
                    '& .feature-gradient': {
                      opacity: 1,
                      transform: 'scale(1.1) rotate(5deg)'
                    },
                    '& .feature-icon': {
                      transform: 'scale(1.3) rotate(15deg)',
                      filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))'
                    },
                    '& .feature-badge': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 8px 25px rgba(255, 215, 0, 0.4)'
                    }
                  }
                }}
              >
                {/* Dynamic Gradient Overlay */}
                <Box
                  className="feature-gradient"
                  sx={{
                    position: 'absolute',
                    top: -50,
                    left: -50,
                    right: -50,
                    bottom: -50,
                    background: feature.gradient,
                    opacity: 0,
                    transition: 'all 0.4s ease',
                    transform: 'scale(0.8) rotate(-5deg)',
                    borderRadius: 6,
                    filter: 'blur(40px)'
                  }}
                />
                
                <CardContent sx={{ 
                  p: 5, 
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 1,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <Box>
                    {/* Feature Badge */}
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                      <Chip
                        className="feature-badge"
                        label={feature.badge}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(255, 215, 0, 0.2)',
                          color: '#FFD700',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          transition: 'all 0.3s ease'
                        }}
                      />
                    </Box>

                    {/* Feature Icon */}
                    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                      <Box
                        sx={{
                          p: 3,
                          borderRadius: '50%',
                          background: 'rgba(255, 255, 255, 0.1)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <feature.icon
                          className="feature-icon"
                          sx={{
                            fontSize: 40,
                            color: feature.color,
                            transition: 'all 0.4s ease'
                          }}
                        />
                      </Box>
                    </Box>

                    <Typography
                      variant="h4"
                      component="h3"
                      gutterBottom
                      sx={{ 
                        fontWeight: 700,
                        color: 'white',
                        mb: 3,
                        fontSize: { xs: '1.3rem', md: '1.5rem' }
                      }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.85)', 
                      lineHeight: 1.7,
                      fontSize: '1rem',
                      fontWeight: 400
                    }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// Ultra-Modern Featured Courses Section with Enhanced Design
const FeaturedCoursesSection: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Fetch courses based on authentication status
  const { data: coursesData, isLoading, error } = useQuery(
    ['featuredCourses', isAuthenticated, user?.role],
    () => {
      if (isAuthenticated && user?.role === 'student') {
        // Show enrolled courses for authenticated students
        return courseService.getEnrolledCourses({ 
          limit: 6, 
          sortBy: 'enrollmentDate', 
          sortOrder: 'desc' 
        });
      } else {
        // Show public courses for non-authenticated users or non-students
        return courseService.getPublicCourses({ 
          limit: 6, 
          sortBy: 'enrollmentCount', 
          sortOrder: 'desc' 
        });
      }
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const featuredCourses = coursesData?.courses || [];

  return (
    <Box 
      sx={{ 
        py: 12, 
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Floating Geometric Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          opacity: 0.1,
          animation: 'float 8s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '8%',
          width: 80,
          height: 80,
          borderRadius: 2,
          background: 'linear-gradient(135deg, #f093fb, #f5576c)',
          opacity: 0.1,
          animation: 'float 6s ease-in-out infinite reverse'
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Box sx={{ mb: 4 }}>
            <Chip
              icon={<MenuBook sx={{ color: '#667eea !important' }} />}
              label={isAuthenticated && user?.role === 'student' ? "🎓 My Learning Path" : "⭐ Featured Courses"}
              sx={{
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                color: '#667eea',
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.95rem',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}
            />
          </Box>
          
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 800, 
              color: 'text.primary',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #667eea 0%, #f093fb 50%, #4facfe 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 4
            }}
          >
            {isAuthenticated && user?.role === 'student' ? 'Continue Your Journey' : 'Trending Courses'}
          </Typography>
          
          <Typography
            variant="h5"
            sx={{ 
              color: 'text.secondary', 
              maxWidth: 700, 
              mx: 'auto', 
              mb: 6,
              lineHeight: 1.6,
              fontWeight: 400
            }}
          >
            {isAuthenticated && user?.role === 'student' 
              ? 'Pick up where you left off and accelerate your learning with personalized recommendations'
              : 'Explore our most popular courses designed by industry experts and loved by learners worldwide'
            }
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} justifyContent="center" sx={{ mb: 4 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<Explore />}
              onClick={() => navigate('/courses')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                px: 3.5,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 6px 24px rgba(102, 126, 234, 0.3)',
                minWidth: { xs: '100%', sm: '200px' },
                height: '48px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 32px rgba(102, 126, 234, 0.4)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              Explore All Courses
            </Button>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<Description />}
              onClick={() => navigate('/past-papers')}
              sx={{
                background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
                px: 3.5,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: 2.5,
                textTransform: 'none',
                boxShadow: '0 6px 24px rgba(233, 30, 99, 0.3)',
                minWidth: { xs: '100%', sm: '200px' },
                height: '48px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d81b60 0%, #9c27b0 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 32px rgba(233, 30, 99, 0.4)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              📝 Practice Past Papers
            </Button>
            
            {!isAuthenticated && (
              <Button
                variant="outlined"
                size="large"
                startIcon={<RocketLaunch />}
                onClick={() => navigate('/register')}
                sx={{
                  borderColor: 'rgba(102, 126, 234, 0.5)',
                  color: '#667eea',
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 3,
                  borderWidth: 2,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#667eea',
                    bgcolor: 'rgba(102, 126, 234, 0.05)',
                    transform: 'translateY(-3px)',
                    borderWidth: 2
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                Start Learning Free
              </Button>
            )}
          </Stack>
        </Box>

          {/* Loading State */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Error State */}
          {!!error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              Failed to load courses. Please try again later.
            </Alert>
          )}

          {/* Enhanced Courses Grid */}
          {!isLoading && !error && (
            <>
            <Grid container spacing={5}>
              {featuredCourses.length === 0 ? (
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      textAlign: 'center',
                      py: 8,
                      px: 4,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%)',
                      borderRadius: 4,
                      border: '1px solid rgba(102, 126, 234, 0.2)'
                    }}
                  >
                    <MenuBook sx={{ fontSize: 60, color: '#667eea', mb: 3, opacity: 0.7 }} />
                    <Typography variant="h5" color="text.primary" sx={{ fontWeight: 600, mb: 2 }}>
                      No courses available at the moment
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Check back soon for exciting new learning opportunities!
                    </Typography>
                  </Paper>
                </Grid>
              ) : (
                featuredCourses.map((course) => (
                <Grid item xs={12} sm={6} lg={4} key={course._id}>
                  <Paper
                    elevation={0}
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: '1px solid rgba(0, 0, 0, 0.08)',
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.15)',
                        border: '1px solid rgba(102, 126, 234, 0.3)',
                        '& .course-image': {
                          transform: 'scale(1.1)',
                        },
                        '& .course-overlay': {
                          opacity: 1,
                        }
                      }
                    }}
                  >
                    {/* Course Image/Thumbnail */}
                    <Box
                      sx={{
                        height: 220,
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <CardMedia
                        className="course-image"
                        component="div"
                        sx={{
                          height: '100%',
                          background: course.thumbnail 
                            ? `url(${course.thumbnail})` 
                            : `linear-gradient(135deg, ${
                                course.category.toLowerCase().includes('programming') || course.category.toLowerCase().includes('web') 
                                  ? '#667eea 0%, #764ba2 100%' 
                                  : course.category.toLowerCase().includes('data') || course.category.toLowerCase().includes('science')
                                  ? '#f093fb 0%, #f5576c 100%' 
                                  : '#4facfe 0%, #00f2fe 100%'
                              })`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '4rem',
                          transition: 'transform 0.4s ease',
                          position: 'relative'
                        }}
                      >
                        {!course.thumbnail && (
                          course.category.toLowerCase().includes('programming') || course.category.toLowerCase().includes('web') 
                            ? '💻' 
                            : course.category.toLowerCase().includes('data') || course.category.toLowerCase().includes('science')
                            ? '📊' 
                            : '📚'
                        )}
                      </CardMedia>
                      
                      {/* Gradient Overlay */}
                      <Box
                        className="course-overlay"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.7) 100%)',
                          opacity: 0,
                          transition: 'opacity 0.4s ease',
                          display: 'flex',
                          alignItems: 'flex-end',
                          p: 3
                        }}
                      >
                        <PlayArrow 
                          sx={{ 
                            color: 'white', 
                            fontSize: 48,
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))'
                          }} 
                        />
                      </Box>
                    </Box>

                    <CardContent sx={{ flexGrow: 1, p: 4, pb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <Chip
                          label={course.category}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(102, 126, 234, 0.1)',
                            color: '#667eea',
                            fontWeight: 600,
                            border: '1px solid rgba(102, 126, 234, 0.2)',
                            '& .MuiChip-label': { fontSize: '0.8rem' }
                          }}
                        />
                        <Chip
                          label={course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(240, 147, 251, 0.1)',
                            color: '#f093fb',
                            fontWeight: 600,
                            border: '1px solid rgba(240, 147, 251, 0.2)',
                            '& .MuiChip-label': { fontSize: '0.8rem' }
                          }}
                        />
                      </Box>

                      <Typography
                        variant="h5"
                        component="h3"
                        gutterBottom
                        sx={{ 
                          fontWeight: 700, 
                          lineHeight: 1.3,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          color: 'text.primary',
                          mb: 2,
                          fontSize: '1.3rem'
                        }}
                      >
                        {course.title}
                      </Typography>

                      <Typography
                        variant="body1"
                        sx={{ 
                          color: 'text.secondary', 
                          mb: 3, 
                          lineHeight: 1.6,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '0.95rem'
                        }}
                      >
                        {course.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Avatar 
                          sx={{ 
                            width: 40, 
                            height: 40, 
                            mr: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            fontWeight: 600
                          }}
                        >
                          {course.instructor && course.instructor.firstName && course.instructor.lastName 
                            ? `${course.instructor.firstName[0]}${course.instructor.lastName[0]}`
                            : 'IN'
                          }
                        </Avatar>
                        <Box>
                          <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
                            {course.instructor && course.instructor.firstName 
                              ? `${course.instructor.firstName} ${course.instructor.lastName}`
                              : 'Expert Instructor'
                            }
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            Course Instructor
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Rating 
                          value={course.rating || 0} 
                          precision={0.1} 
                          size="small" 
                          readOnly 
                          sx={{ mr: 2 }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mr: 1 }}>
                          {course.rating ? course.rating.toFixed(1) : 'New'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          ({course.enrollmentCount || 0} students)
                        </Typography>
                      </Box>

                      <Divider sx={{ mb: 3 }} />

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                        <Box>
                          {course.price > 0 ? (
                            <Typography
                              variant="h5"
                              sx={{ 
                                fontWeight: 800, 
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                            >
                              ${course.price}
                            </Typography>
                          ) : (
                            <Typography
                              variant="h5"
                              sx={{ 
                                fontWeight: 800, 
                                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                            >
                              FREE
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <TrendingUp sx={{ fontSize: 18, color: 'text.secondary', mr: 0.5 }} />
                          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                            {course.duration}h course
                          </Typography>
                        </Box>
                      </Box>

                      {/* Action Buttons */}
                      <Stack direction="row" spacing={2}>
                        <Button
                          variant="outlined"
                          size="large"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course._id}`);
                          }}
                          sx={{
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: 600,
                            borderColor: '#667eea',
                            color: '#667eea',
                            flex: 1,
                            '&:hover': {
                              borderColor: '#5a67d8',
                              backgroundColor: '#667eea',
                              color: 'white',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          👁️ View Details
                        </Button>
                        <Button
                          variant="contained"
                          size="large"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/courses/${course._id}`);
                          }}
                          sx={{
                            borderRadius: 2,
                            py: 1.5,
                            fontWeight: 600,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            flex: 1,
                            '&:hover': {
                              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          🚀 Explore
                        </Button>
                      </Stack>
                    </CardContent>
                  </Paper>
                </Grid>
              ))
            )}
          </Grid>
        </>
      )}
      </Container>
    </Box>
  );
};

// Ultra-Modern Testimonials Section with Enhanced Design
const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'John Uwimana',
      role: 'Business Development Manager',
      company: 'Local Enterprise, Kigali',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
      rating: 5,
      text: 'Excellence Coaching Hub transformed the way I learn — I finally completed a course that gave me practical confidence in my career. The weekly structure made learning manageable.',
      achievement: 'Career Growth: Leadership Role Promotion',
      color: '#4285F4'
    },
    {
      name: 'Marie Kamikazi',
      role: 'Digital Marketing Specialist',
      company: 'Tech Startup, Rwanda',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
      rating: 5,
      text: 'Their weekly course structure made learning manageable and consistent. The expert instructors provided practical skills that I could immediately apply to my work.',
      achievement: 'Skills Gained: Digital Marketing Expertise',
      color: '#00A4EF'
    },
    {
      name: 'James Nsabimana',
      role: 'Academic Coordinator',
      company: 'Professional Learner',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
      rating: 5,
      text: 'As a professional, I found the coaching approach incredibly effective. The cloud-based materials and progress tracking made continuous learning accessible anytime.',
      achievement: 'Impact: Improved teaching methodology',
      color: '#FF9900'
    }
  ];

  return (
    <Box 
      sx={{ 
        py: 15, 
        background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '5%',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(102, 126, 234, 0.1)',
          animation: 'float 10s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: 80,
          height: 80,
          borderRadius: 3,
          background: 'rgba(240, 147, 251, 0.1)',
          animation: 'float 8s ease-in-out infinite reverse'
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 12 }}>
          <Box sx={{ mb: 4 }}>
            <Chip
              icon={<Star sx={{ color: '#FFD700 !important' }} />}
              label="💬 Success Stories"
              sx={{
                bgcolor: 'rgba(255, 215, 0, 0.15)',
                color: '#FFD700',
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.95rem',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}
            />
          </Box>
          
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 800, 
              color: 'text.primary',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #667eea 0%, #f093fb 50%, #4facfe 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 4
            }}
          >
            What Our Learners Say
          </Typography>
          
          <Typography
            variant="h5"
            sx={{ 
              color: 'text.secondary', 
              maxWidth: 800, 
              mx: 'auto',
              lineHeight: 1.6,
              fontWeight: 400,
              mb: 2
            }}
          >
            Real stories from learners who have transformed their careers through Excellence Coaching Hub
          </Typography>
          
          <Typography
            variant="body1"
            sx={{ 
              color: 'text.secondary', 
              maxWidth: 600, 
              mx: 'auto',
              opacity: 0.8
            }}
          >
            Real stories from real people who trusted us with their future
          </Typography>
        </Box>

        <Grid container spacing={5}>
          {testimonials.map((testimonial, index) => (
            <Grid item xs={12} lg={4} key={index}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  p: 5,
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 0, 0, 0.08)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-15px) scale(1.02)',
                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.15)',
                    border: `1px solid ${testimonial.color}50`,
                    '& .testimonial-gradient': {
                      opacity: 1,
                      transform: 'scale(1.1)'
                    },
                    '& .testimonial-avatar': {
                      transform: 'scale(1.1)',
                      boxShadow: `0 15px 40px ${testimonial.color}40`
                    }
                  }
                }}
              >
                {/* Background Gradient */}
                <Box
                  className="testimonial-gradient"
                  sx={{
                    position: 'absolute',
                    top: -50,
                    left: -50,
                    right: -50,
                    bottom: -50,
                    background: `radial-gradient(circle, ${testimonial.color}20 0%, transparent 70%)`,
                    opacity: 0,
                    transition: 'all 0.4s ease',
                    transform: 'scale(0.8)',
                    borderRadius: 6
                  }}
                />

                <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                  {/* Company Badge */}
                  <Box sx={{ mb: 3 }}>
                    <Chip
                      label={testimonial.company}
                      size="small"
                      sx={{
                        bgcolor: `${testimonial.color}15`,
                        color: testimonial.color,
                        fontWeight: 600,
                        border: `1px solid ${testimonial.color}30`,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>

                  {/* Enhanced Avatar */}
                  <Avatar
                    className="testimonial-avatar"
                    src={testimonial.avatar}
                    sx={{
                      width: 90,
                      height: 90,
                      mx: 'auto',
                      mb: 3,
                      background: `linear-gradient(135deg, ${testimonial.color} 0%, ${testimonial.color}CC 100%)`,
                      fontSize: '2rem',
                      fontWeight: 700,
                      border: '3px solid rgba(255, 255, 255, 0.8)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.4s ease',
                      objectFit: 'cover'
                    }}
                  >
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </Avatar>

                  {/* Rating */}
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                    <Rating
                      value={testimonial.rating}
                      readOnly
                      size="small"
                      sx={{ 
                        '& .MuiRating-iconFilled': {
                          color: '#FFD700'
                        }
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      5.0
                    </Typography>
                  </Box>

                  {/* Testimonial Text */}
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 4,
                      fontStyle: 'italic',
                      lineHeight: 1.7,
                      color: 'text.primary',
                      fontSize: '1rem',
                      position: 'relative',
                      '&:before': {
                        content: '""',
                        position: 'absolute',
                        top: -20,
                        left: -10,
                        fontSize: '4rem',
                        color: testimonial.color,
                        opacity: 0.3,
                        fontFamily: 'serif'
                      }
                    }}
                  >
                    {testimonial.text}
                  </Typography>

                  {/* Achievement Badge */}
                  <Box sx={{ mb: 3 }}>
                    <Chip
                      label={testimonial.achievement}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(76, 175, 80, 0.1)',
                        color: '#4CAF50',
                        fontWeight: 600,
                        border: '1px solid rgba(76, 175, 80, 0.2)',
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>

                  {/* Name and Role */}
                  <Typography
                    variant="h6"
                    sx={{ 
                      fontWeight: 700, 
                      mb: 1,
                      color: 'text.primary'
                    }}
                  >
                    {testimonial.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{ 
                      color: 'text.secondary',
                      fontWeight: 500,
                      fontSize: '0.9rem'
                    }}
                  >
                    {testimonial.role}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// Ultra-Modern Statistics Section with Data Visualization
const StatisticsSection: React.FC = () => {
  const stats = [
    { 
      number: '50K+', 
      label: 'Active Learners', 
      icon: <Groups />, 
      color: '#667eea',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      description: 'Students and professionals growing daily',
      growth: '+150%'
    },
    { 
      number: '100+', 
      label: 'Expert Instructors', 
      icon: <School />, 
      color: '#4CAF50',
      gradient: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
      description: 'Industry professionals & certified coaches',
      growth: '+80%'
    },
    { 
      number: '320+', 
      label: 'Quality Courses', 
      icon: <MenuBook />, 
      color: '#FF9800',
      gradient: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
      description: 'Comprehensive academic & professional programs',
      growth: '+200%'
    },
    { 
      number: '95%', 
      label: 'Success Rate', 
      icon: <EmojiEvents />, 
      color: '#f093fb',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      description: 'Course completion & learner satisfaction',
      growth: '+12%'
    }
  ];

  return (
    <Box
      sx={{
        py: 15,
        background: `
          linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%),
          linear-gradient(45deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%)
        `,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 60%),
            radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.08) 0%, transparent 60%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 60%)
          `,
          animation: 'shimmer 10s ease-in-out infinite',
          '@keyframes shimmer': {
            '0%, 100%': { opacity: 0.3 },
            '50%': { opacity: 0.8 }
          }
        }}
      />

      {/* Floating Particles */}
      {[...Array(6)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.6)',
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`
          }}
        />
      ))}
      
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 12 }}>
          <Box sx={{ mb: 4 }}>
            <Chip
              icon={<TrendingUp sx={{ color: '#FFD700 !important' }} />}
              label="📈 Our Impact"
              sx={{
                bgcolor: 'rgba(255, 215, 0, 0.15)',
                color: '#FFD700',
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.95rem',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                backdropFilter: 'blur(20px)'
              }}
            />
          </Box>
          
          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 900, 
              color: 'white',
              fontSize: { xs: '2.5rem', md: '4rem' },
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 60px rgba(255, 255, 255, 0.3)',
              mb: 4
            }}
          >
            Powering Dreams Globally
          </Typography>
          
          <Typography
            variant="h4"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.9)', 
              maxWidth: 800, 
              mx: 'auto',
              opacity: 0.95,
              lineHeight: 1.6,
              fontSize: { xs: '1.2rem', md: '1.5rem' }
            }}
          >
            Join a thriving ecosystem of learners, educators, and innovators transforming the future of education
          </Typography>
        </Box>

        <Grid container spacing={5}>
          {stats.map((stat, index) => (
            <Grid item xs={6} lg={3} key={index}>
              <Paper
                elevation={0}
                sx={{ 
                  textAlign: 'center',
                  p: 4,
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-15px) scale(1.05)',
                    background: 'rgba(255, 255, 255, 0.15)',
                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.3)',
                    '& .stat-gradient': {
                      opacity: 1,
                      transform: 'scale(1.2)'
                    },
                    '& .stat-icon': {
                      transform: 'scale(1.2) rotate(10deg)',
                      filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.5))'
                    },
                    '& .stat-growth': {
                      opacity: 1,
                      transform: 'translateY(0)'
                    }
                  }
                }}
              >
                {/* Background Gradient */}
                <Box
                  className="stat-gradient"
                  sx={{
                    position: 'absolute',
                    top: -50,
                    left: -50,
                    right: -50,
                    bottom: -50,
                    background: stat.gradient,
                    opacity: 0.1,
                    transition: 'all 0.4s ease',
                    transform: 'scale(0.8)',
                    borderRadius: 6,
                    filter: 'blur(30px)'
                  }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  {/* Growth Indicator */}
                  <Box 
                    className="stat-growth"
                    sx={{ 
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      opacity: 0,
                      transform: 'translateY(-10px)',
                      transition: 'all 0.4s ease'
                    }}
                  >
                    <Chip
                      label={stat.growth}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(76, 175, 80, 0.2)',
                        color: '#4CAF50',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        border: '1px solid rgba(76, 175, 80, 0.3)'
                      }}
                    />
                  </Box>

                  {/* Enhanced Icon */}
                  <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        p: 3,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        position: 'relative'
                      }}
                    >
                      {React.cloneElement(stat.icon, { 
                        className: 'stat-icon',
                        sx: { 
                          fontSize: 48, 
                          color: stat.color,
                          transition: 'all 0.4s ease',
                          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                        } 
                      })}
                    </Box>
                  </Box>

                  {/* Number with Animation */}
                  <Typography
                    variant="h1"
                    sx={{ 
                      fontWeight: 900, 
                      mb: 2,
                      background: stat.gradient,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      textShadow: '0 0 30px rgba(255, 255, 255, 0.3)',
                      position: 'relative'
                    }}
                  >
                    {stat.number}
                  </Typography>

                  {/* Label */}
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      color: 'white',
                      fontWeight: 700,
                      mb: 2,
                      fontSize: { xs: '1.1rem', md: '1.3rem' }
                    }}
                  >
                    {stat.label}
                  </Typography>

                  {/* Description */}
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '0.9rem',
                      lineHeight: 1.5
                    }}
                  >
                    {stat.description}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

// Ultra-Modern CTA Section with Interactive Elements
const CTASection: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Box 
      sx={{ 
        py: 15, 
        background: `
          linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%),
          linear-gradient(45deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)
        `,
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Dynamic Background Effects */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
          animation: 'shimmer 12s ease-in-out infinite',
          '@keyframes shimmer': {
            '0%, 100%': { opacity: 0.4 },
            '50%': { opacity: 1 }
          }
        }}
      />

      {/* Floating Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'float 8s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '20%',
          left: '8%',
          width: 100,
          height: 100,
          borderRadius: 3,
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(15px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          animation: 'float 10s ease-in-out infinite reverse',
          transform: 'rotate(45deg)'
        }}
      />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Box sx={{ mb: 4 }}>
            <Chip
              icon={<RocketLaunch sx={{ color: '#FFD700 !important' }} />}
              label="🎯 Start Your Journey"
              sx={{
                bgcolor: 'rgba(255, 215, 0, 0.15)',
                color: '#FFD700',
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.95rem',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                backdropFilter: 'blur(20px)'
              }}
            />
          </Box>

          <Typography
            variant="h1"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 900, 
              color: 'white', 
              mb: 4,
              fontSize: { xs: '2.5rem', md: '4.5rem' },
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 60px rgba(255, 255, 255, 0.4)',
              lineHeight: 1.1
            }}
          >
            Start Your Journey to
            <Box component="span" sx={{ display: 'block' }}>
              Excellence Today!
            </Box>
          </Typography>

          <Typography
            variant="h4"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.95)', 
              mb: 8, 
              lineHeight: 1.6,
              maxWidth: 800,
              mx: 'auto',
              fontSize: { xs: '1.3rem', md: '1.7rem' },
              fontWeight: 400
            }}
          >
            Join thousands of learners and job seekers gaining in-demand skills through expert-led courses, personalized coaching, and career-focused learning experiences.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4} justifyContent="center" sx={{ mb: 8 }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ElectricBolt />}
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
              sx={{
                px: 8,
                py: 3,
                fontSize: '1.4rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC107 100%)',
                color: '#000',
                borderRadius: 4,
                textTransform: 'none',
                boxShadow: '0 12px 40px rgba(255, 215, 0, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
                  transform: 'translateY(-5px) scale(1.05)',
                  boxShadow: '0 20px 60px rgba(255, 215, 0, 0.6)'
                },
                transition: 'all 0.4s ease'
              }}
            >
              {isAuthenticated ? 'Continue Learning' : 'Join Now'}
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<Explore />}
              onClick={() => navigate('/courses')}
              sx={{
                px: 8,
                py: 3,
                fontSize: '1.4rem',
                fontWeight: 700,
                borderWidth: 3,
                borderColor: 'rgba(255, 255, 255, 0.8)',
                color: 'white',
                borderRadius: 4,
                textTransform: 'none',
                backdropFilter: 'blur(20px)',
                background: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  borderWidth: 3,
                  borderColor: '#FFD700',
                  color: '#FFD700',
                  background: 'rgba(255, 215, 0, 0.1)',
                  transform: 'translateY(-5px) scale(1.05)',
                  boxShadow: '0 20px 60px rgba(255, 215, 0, 0.3)'
                },
                transition: 'all 0.4s ease'
              }}
            >
              Explore Courses
            </Button>
          </Stack>

          <Paper
            elevation={0}
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: { xs: 2, md: 6 }, 
              flexWrap: 'wrap',
              p: 5,
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 4,
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Glow */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
                opacity: 0.6
              }}
            />
            
            {[
              { icon: CheckCircle, text: 'Free 14-day trial', color: '#4CAF50' },
              { icon: Verified, text: 'No credit card required', color: '#2196F3' },
              { icon: AutoAwesome, text: 'Cancel anytime', color: '#FF9800' },
              { icon: WorkspacePremium, text: 'Money-back guarantee', color: '#9C27B0' }
            ].map((feature, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative', zIndex: 1 }}>
                <feature.icon sx={{ color: feature.color, fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white', fontSize: { xs: '1rem', md: '1.2rem' } }}>
                  {feature.text}
                </Typography>
              </Box>
            ))}
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

// Ultra-Modern FAQ Section with Enhanced Interactivity
const FAQSection: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const faqs = [
    {
      question: "How do I get started with Excellence Coaching Hub?",
      answer: "Getting started is simple! Browse our course catalog, choose your program, and enroll. Follow our structured weekly learning paths designed for optimal knowledge retention and skill development.",
      icon: RocketLaunch,
      color: '#667eea'
    },
    {
      question: "What makes Excellence Coaching Hub different?",
      answer: "We offer expert instructors, live & recorded sessions, weekly learning paths, cloud-based materials, and progress tracking with certification. Our approach combines academic coaching, professional courses, and business coaching.",
      icon: AutoAwesome,
      color: '#f093fb'
    },
    {
      question: "What types of courses do you offer?",
      answer: "We provide business leadership & communication, digital marketing mastery, personal growth & productivity, tech skills for modern work, public speaking & confidence, academic coaching, professional development, and business coaching programs.",
      icon: MenuBook,
      color: '#4CAF50'
    },
    {
      question: "Can I access materials anytime, anywhere?",
      answer: "Yes! All course materials and resources are stored in our secure cloud platform, accessible on any device. You can learn at your own pace with both live sessions and recorded content available 24/7.",
      icon: Support,
      color: '#FF9800'
    },
    {
      question: "Do you provide certificates upon completion?",
      answer: "Absolutely! Monitor your learning journey with detailed progress tracking and earn recognized certificates upon successful course completion. These certificates demonstrate your newly acquired skills and knowledge.",
      icon: Verified,
      color: '#2196F3'
    },
    {
      question: "What kind of support do instructors provide?",
      answer: "Our expert instructors are industry professionals and certified coaches with real-world experience. You receive personalized coaching sessions tailored to your goals, challenges, and learning preferences.",
      icon: Psychology,
      color: '#9C27B0'
    }
  ];

  return (
    <Box 
      sx={{ 
        py: 12, 
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '5%',
          right: '3%',
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(102, 126, 234, 0.05)',
          animation: 'float 12s ease-in-out infinite'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '5%',
          left: '5%',
          width: 120,
          height: 120,
          borderRadius: 3,
          background: 'rgba(240, 147, 251, 0.05)',
          animation: 'float 10s ease-in-out infinite reverse'
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 10 }}>
          <Box sx={{ mb: 4 }}>
            <Chip
              icon={<HelpOutline sx={{ color: '#667eea !important' }} />}
              label="❓ Got Questions?"
              sx={{
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                color: '#667eea',
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '0.95rem',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}
            />
          </Box>

          <Typography
            variant="h2"
            component="h2"
            gutterBottom
            sx={{ 
              fontWeight: 800, 
              color: 'text.primary',
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              background: 'linear-gradient(135deg, #667eea 0%, #f093fb 50%, #4facfe 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 4
            }}
          >
            Everything You Need to Know
          </Typography>
          
          <Typography
            variant="h5"
            sx={{ 
              color: 'text.secondary', 
              maxWidth: 800, 
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              lineHeight: 1.6,
              fontWeight: 400
            }}
          >
            Get instant answers to common questions about our cutting-edge learning platform and transformative educational experience
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={10} sx={{ mx: 'auto' }}>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                sx={{
                  mb: 3,
                  borderRadius: 4,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  overflow: 'hidden',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:before': {
                    display: 'none'
                  },
                  '&.Mui-expanded': {
                    margin: '0 0 24px 0',
                    boxShadow: `0 12px 48px ${faq.color}20`,
                    border: `1px solid ${faq.color}30`,
                    transform: 'translateY(-2px)'
                  },
                  '&:hover': {
                    boxShadow: `0 12px 48px ${faq.color}15`,
                    border: `1px solid ${faq.color}20`
                  }
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: faq.color, fontSize: 28 }} />}
                  sx={{
                    py: 3,
                    px: 4,
                    minHeight: 80,
                    '&.Mui-expanded': {
                      minHeight: 80,
                      backgroundColor: `${faq.color}08`
                    },
                    '& .MuiAccordionSummary-content': {
                      margin: '16px 0',
                      '&.Mui-expanded': {
                        margin: '16px 0'
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: '50%',
                        background: `${faq.color}15`,
                        border: `1px solid ${faq.color}30`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 3,
                        minWidth: 56,
                        height: 56
                      }}
                    >
                      <faq.icon sx={{ color: faq.color, fontSize: 28 }} />
                    </Box>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        fontSize: { xs: '1.1rem', md: '1.3rem' },
                        lineHeight: 1.3
                      }}
                    >
                      {faq.question}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    px: 4,
                    pb: 4,
                    pt: 0
                  }}
                >
                  <Box sx={{ pl: 9 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'text.secondary',
                        lineHeight: 1.8,
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        fontWeight: 400
                      }}
                    >
                      {faq.answer}
                    </Typography>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(240, 147, 251, 0.1) 100%)',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Glow */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
                opacity: 0.6
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography variant="h4" sx={{ mb: 2, color: 'text.primary', fontWeight: 700 }}>
                Still have questions?
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', maxWidth: 600, mx: 'auto' }}>
                Our expert support team is available 24/7 to help you succeed
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center">
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Email />}
                  sx={{
                    px: 6,
                    py: 2,
                    borderRadius: 3,
                    borderColor: '#667eea',
                    borderWidth: 2,
                    color: '#667eea',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#667eea',
                      borderWidth: 2,
                      backgroundColor: 'rgba(102, 126, 234, 0.05)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Contact Support
                </Button>
                
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<HelpOutline />}
                  sx={{
                    px: 6,
                    py: 2,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Visit Help Center
                </Button>
                
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<QuestionAnswer />}
                  sx={{
                    px: 6,
                    py: 2,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    textTransform: 'none',
                    boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #45a049 0%, #388e3c 100%)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 12px 40px rgba(76, 175, 80, 0.4)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  Live Chat
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
};

// Ultra-Modern Past Papers Section
const PastPapersSection: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box
      sx={{
        py: { xs: 8, md: 12 },
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 80%, rgba(233, 30, 99, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(156, 39, 176, 0.1) 0%, transparent 50%)
          `,
          zIndex: 0
        }}
      />
      
      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Box sx={{ mb: 4 }}>
            <Chip
              icon={<Description sx={{ color: '#e91e63 !important' }} />}
              label="📝 Past Papers"
              sx={{
                bgcolor: 'rgba(233, 30, 99, 0.1)',
                color: '#e91e63',
                fontWeight: 600,
                px: 3,
                py: 1,
                fontSize: '1rem',
                mb: 3,
                '& .MuiChip-icon': {
                  fontSize: '1.2rem'
                }
              }}
            />
          </Box>
          
          <Typography
            variant="h2"
            component="h2"
            sx={{
              fontWeight: 800,
              mb: 3,
              background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '2.5rem', md: '3.5rem' }
            }}
          >
            Practice with Past Papers
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
              mb: 6,
              lineHeight: 1.6,
              fontSize: { xs: '1.1rem', md: '1.3rem' }
            }}
          >
            Test your knowledge with real exam questions from previous years. 
            Get instant feedback and track your progress.
          </Typography>
        </Box>

        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                p: 4,
                height: '100%',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%), url(https://images.unsplash.com/photo-1546410531-bb4caa6b0e2b?w=500&h=400&fit=crop)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid rgba(233, 30, 99, 0.1)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                backgroundBlendMode: 'overlay',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(233, 30, 99, 0.15)',
                  borderColor: 'rgba(233, 30, 99, 0.3)'
                }
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <Assessment sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Real Exam Questions
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Practice with authentic questions from previous exam sessions
                </Typography>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                p: 4,
                height: '100%',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%), url(https://images.unsplash.com/photo-1516321318423-f06b74b8c6f1?w=500&h=400&fit=crop)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                backgroundBlendMode: 'overlay',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(102, 126, 234, 0.15)',
                  borderColor: 'rgba(102, 126, 234, 0.3)'
                }
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <Speed sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Instant Feedback
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Get immediate results and detailed explanations for each question
                </Typography>
              </Box>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                p: 4,
                height: '100%',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%), url(https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=400&fit=crop)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                border: '1px solid rgba(156, 39, 176, 0.1)',
                borderRadius: 3,
                transition: 'all 0.3s ease',
                backgroundBlendMode: 'overlay',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: '0 20px 40px rgba(156, 39, 176, 0.15)',
                  borderColor: 'rgba(156, 39, 176, 0.3)'
                }
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 3
                  }}
                >
                  <TrendingUp sx={{ fontSize: 40, color: 'white' }} />
                </Box>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  Track Progress
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Monitor your performance and identify areas for improvement
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<Description />}
            onClick={() => navigate('/past-papers')}
            sx={{
              background: 'linear-gradient(135deg, #e91e63 0%, #ad1457 100%)',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: 2.5,
              textTransform: 'none',
              boxShadow: '0 6px 24px rgba(233, 30, 99, 0.3)',
              minWidth: '200px',
              height: '50px',
              '&:hover': {
                background: 'linear-gradient(135deg, #d81b60 0%, #9c27b0 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 32px rgba(233, 30, 99, 0.4)'
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            Browse Past Papers
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

// Main HomePage Component
const HomePage: React.FC = () => {
  const [showInterestPopup, setShowInterestPopup] = useState(false);
  const [hasSeenPopup, setHasSeenPopup] = useState(false);

  // Show popup for new visitors
  useEffect(() => {
    const hasSeen = localStorage.getItem('homeInterestPopupSeen');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowInterestPopup(true);
      }, 3000); // Show after 3 seconds
      return () => clearTimeout(timer);
    } else {
      setHasSeenPopup(true);
    }
  }, []);

  const handleInterestComplete = (data: any, type: 'courses' | 'past-papers' = 'courses') => {
    // Save interests to localStorage
    localStorage.setItem('homeLearningInterests', JSON.stringify(data));
    localStorage.setItem('homeInterestPopupSeen', 'true');
    setShowInterestPopup(false);
    setHasSeenPopup(true);
    
    // Check if user is already logged in
    const isLoggedIn = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (isLoggedIn) {
      // If logged in, navigate based on selection
      if (type === 'past-papers') {
        window.location.href = `/past-papers?interests=${encodeURIComponent(JSON.stringify(data))}`;
      } else {
        window.location.href = `/dashboard/student/courses?tab=discover&interests=${encodeURIComponent(JSON.stringify(data))}`;
      }
    } else {
      // If not logged in, navigate based on selection
      const interestsParam = encodeURIComponent(JSON.stringify(data));
      if (type === 'past-papers') {
        window.location.href = `/past-papers?interests=${interestsParam}`;
      } else {
        window.location.href = `/register?interests=${interestsParam}`;
      }
    }
  };

  const handleInterestClose = () => {
    setShowInterestPopup(false);
    localStorage.setItem('homeInterestPopupSeen', 'true');
  };

  return (
    <Box>
      <HeroSection />
      <CategoriesSection />
      <JobMarketSkillsSection />
      <FeaturesSection />
      <FeaturedCoursesSection />
      <PastPapersSection />
      <StatisticsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
      <FloatingContact />
      <FloatingAIAssistant />
      
      {/* Learning Interest Popup */}
      <HomeLearningInterestPopup
        open={showInterestPopup}
        onClose={handleInterestClose}
        onComplete={handleInterestComplete}
      />
    </Box>
  );
};

export default HomePage;

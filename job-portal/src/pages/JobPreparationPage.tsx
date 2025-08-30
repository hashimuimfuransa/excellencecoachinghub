import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Stack,
  Divider,
  Avatar,
  LinearProgress,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Assignment as AssessmentIcon,
  School as SchoolIcon,
  SmartToy as BotIcon,
  CheckCircle as CheckIcon,
  PlayArrow as PlayIcon,
  Share as ShareIcon,
  ArrowForward,
  Work as WorkIcon,
  EmojiEvents as AchievementIcon,
  TrendingUp as TrendingUpIcon,
  Bolt as FastIcon,
  Star as StarIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon
} from '@mui/icons-material';

const JobPreparationPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  // Enhanced preparation options with better UX features
  const preparationOptions = [
    {
      id: 'smart-test',
      title: 'Smart Job Tests',
      subtitle: 'Job-Specific & Tailored',
      description: 'Get personalized tests tailored to your dream job role and company requirements',
      icon: <BotIcon />,
      color: '#9c27b0',
      route: '/app/smart-tests',
      features: ['Job-Specific Questions', 'Personalized Content', 'Real Company Tests', 'Instant Feedback'],
      difficulty: 'Adaptive',
      popularity: 'New & Hot',
      duration: '15-30 min',
      level: 'advanced',
      isRecommended: true,
      completionRate: 89,
      userCount: '12.5k+'
    },
    {
      id: 'psychometric-tests',
      title: 'Psychometric Tests',
      subtitle: 'Real Employer Tests',
      description: 'Practice with actual personality, cognitive and skills assessments used by top companies',
      icon: <PsychologyIcon />,
      color: '#2196f3',
      route: '/app/tests',
      features: ['Personality Assessment', 'Cognitive Tests', 'Skills Evaluation', 'Real Test Questions'],
      difficulty: 'All Levels',
      popularity: 'Most Popular',
      duration: '20-45 min',
      level: 'beginner',
      isRecommended: true,
      completionRate: 94,
      userCount: '28.3k+'
    },
    {
      id: 'mock-interviews',
      title: 'Mock Interviews',
      subtitle: 'Practice Makes Perfect',
      description: 'Master interview skills with realistic mock interviews and get instant feedback',
      icon: <BotIcon />,
      color: '#ff6b35',
      route: '/app/interviews',
      features: ['Job-specific Questions', 'Real-time Feedback', 'Performance Analytics', 'Multiple Rounds'],
      difficulty: 'Interactive',
      popularity: 'Trending',
      duration: '30-60 min',
      level: 'beginner',
      isRecommended: false,
      completionRate: 87,
      userCount: '15.7k+'
    },
    {
      id: 'career-assessment',
      title: 'Career Discovery',
      subtitle: 'Find Your Perfect Match',
      description: 'Comprehensive evaluation to discover your ideal career path and matching opportunities',
      icon: <AssessmentIcon />,
      color: '#4caf50',
      route: '/app/career-guidance',
      features: ['Skills Analysis', 'Career Path Discovery', 'Job Matching', 'Personal Recommendations'],
      difficulty: 'Comprehensive',
      popularity: 'Recommended',
      duration: '25-40 min',
      level: 'beginner',
      isRecommended: true,
      completionRate: 91,
      userCount: '22.1k+'
    },
    {
      id: 'skill-courses',
      title: 'Live Skill Courses',
      subtitle: 'Expert-Led Training',
      description: 'Join live courses and certification programs led by industry experts',
      icon: <SchoolIcon />,
      color: '#9c27b0',
      route: 'https://www.elearning.excellencecoachinghub.com/',
      external: true,
      features: ['Live Expert Sessions', 'Certification Programs', 'Hands-on Projects', 'Industry Skills'],
      difficulty: 'Expert-Led',
      popularity: 'New',
      duration: '2-8 weeks',
      level: 'advanced',
      isRecommended: false,
      completionRate: 78,
      userCount: '8.9k+'
    }
  ];

  const handleOptionClick = (option: any) => {
    if (option.external) {
      window.open(option.route, '_blank');
    } else if (option.route) {
      navigate(option.route);
    }
  };

  const getPopularityColor = (popularity: string) => {
    switch (popularity) {
      case 'Most Popular': return '#ff4444';
      case 'Trending': return '#ff9800';
      case 'Recommended': return '#4caf50';
      case 'New': return '#2196f3';
      case 'New & Hot': return '#e91e63';
      default: return '#757575';
    }
  };



  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Compact Header */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ 
          fontWeight: 'bold', 
          color: 'primary.main',
          mb: 1
        }}>
          🚀 Land Your Dream Job
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3, fontWeight: 500 }}>
          Fast-track your career with smart preparation tools
        </Typography>
      </Box>

      {/* Enhanced Success Stats */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
            background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3,
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
            ⚡ Join 50,000+ Success Stories
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '2rem' }}>85%</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Success Rate</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '2rem' }}>40%</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Faster Hiring</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '2rem' }}>30%</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Higher Salary</Typography>
            </Grid>
            <Grid item xs={3}>
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: '2rem' }}>24/7</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Support</Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Enhanced Preparation Options */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" gutterBottom sx={{ mb: 5, color: 'primary.main' }}>
          🎯 Choose Your Preparation Path
        </Typography>
        <Grid container spacing={3} sx={{ justifyContent: 'center', maxWidth: 1200, mx: 'auto' }}>
          {preparationOptions.map((option, index) => (
            <Grid item xs={12} sm={12} md={6} lg={6} xl={6} key={option.id}>
                <Card
                  sx={{
                    height: '100%',
                    minHeight: 350,
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: `2px solid ${option.color}20`,
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    background: theme.palette.mode === 'dark' 
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)'
                      : 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 20px 40px ${option.color}30`,
                      border: `2px solid ${option.color}`,
                      '& .option-icon': {
                        transform: 'scale(1.1)',
                      },
                      '& .start-button': {
                        transform: 'scale(1.05)',
                      }
                    }
                  }}
                  onClick={() => handleOptionClick(option)}
                >
                    {/* Compact Header */}
                    <Box
                      sx={{
                        background: `linear-gradient(135deg, ${option.color} 0%, ${option.color}CC 100%)`,
                        color: 'white',
                        p: 2,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Badges */}
                      <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2, display: 'flex', gap: 0.5 }}>
                        <Chip
                          label={option.popularity}
                          size="small"
                          sx={{
                            bgcolor: getPopularityColor(option.popularity),
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.65rem',
                            height: 20
                          }}
                        />
                        {option.isRecommended && (
                          <Chip
                            label="⭐"
                            size="small"
                            sx={{
                              bgcolor: 'rgba(255,193,7,0.9)',
                              color: 'white',
                              minWidth: 'auto',
                              height: 20,
                              '& .MuiChip-label': { px: 0.5 }
                            }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          className="option-icon"
                          sx={{
                            width: 50,
                            height: 50,
                            borderRadius: 2,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            transition: 'all 0.3s ease',
                            flexShrink: 0
                          }}
                        >
                          {option.icon}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 0.5 }}>
                            {option.title}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9, fontWeight: 500 }}>
                            {option.subtitle}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Compact Card Content */}
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.primary" sx={{ mb: 2, lineHeight: 1.5 }}>
                        {option.description}
                      </Typography>

                      {/* Compact Stats */}
                      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip 
                          label={option.userCount}
                          size="small" 
                          sx={{ 
                            bgcolor: `${option.color}10`, 
                            color: option.color,
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            height: 24
                          }} 
                        />
                        <Chip 
                          label={option.duration}
                          size="small" 
                          sx={{ 
                            bgcolor: `${theme.palette.info.main}15`, 
                            color: theme.palette.info.main,
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            height: 24
                          }} 
                        />
                        <Chip 
                          label={`${option.completionRate}% success`}
                          size="small" 
                          sx={{ 
                            bgcolor: `${theme.palette.success.main}15`, 
                            color: theme.palette.success.main,
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            height: 24
                          }} 
                        />
                      </Box>

                      {/* Compact Features */}
                      <Box sx={{ mb: 2 }}>
                        <List dense sx={{ py: 0 }}>
                          {option.features.slice(0, 2).map((feature, featureIndex) => (
                            <ListItem key={featureIndex} sx={{ py: 0.25, pl: 0 }}>
                              <ListItemIcon sx={{ minWidth: 20 }}>
                                <CheckIcon sx={{ fontSize: 14, color: 'success.main' }} />
                              </ListItemIcon>
                              <ListItemText 
                                primary={feature} 
                                primaryTypographyProps={{ variant: 'body2', fontSize: '0.85rem', color: 'text.secondary' }}
                              />
                            </ListItem>
                          ))}
                          <ListItem sx={{ py: 0.25, pl: 0 }}>
                            <ListItemIcon sx={{ minWidth: 20 }}>
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>+</Typography>
                            </ListItemIcon>
                            <ListItemText 
                              primary={`${option.features.length - 2} more features`}
                              primaryTypographyProps={{ variant: 'body2', fontSize: '0.85rem', color: 'text.secondary', fontStyle: 'italic' }}
                            />
                          </ListItem>
                        </List>
                      </Box>

                      {/* Compact Action Section */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip 
                          label={option.difficulty} 
                          size="small" 
                          sx={{ 
                            bgcolor: `${option.color}15`, 
                            color: option.color,
                            fontWeight: 'bold',
                            fontSize: '0.7rem',
                            height: 24
                          }} 
                        />
                        <Button
                          className="start-button"
                          variant="contained"
                          size="medium"
                          sx={{ 
                            bgcolor: option.color,
                            '&:hover': { bgcolor: `${option.color}DD` },
                            textTransform: 'none',
                            fontWeight: 'bold',
                            borderRadius: 2,
                            px: 2,
                            py: 0.5,
                            fontSize: '0.85rem',
                            transition: 'all 0.2s ease',
                            minWidth: 'auto'
                          }}
                          endIcon={option.external ? <ShareIcon sx={{ fontSize: 16 }} /> : <ArrowForward sx={{ fontSize: 16 }} />}
                        >
                          {option.external ? 'Visit' : 'Start'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

      {/* Enhanced Call to Action */}
      <Paper 
        sx={{ 
          p: 6, 
          mt: 6,
          borderRadius: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 60%)`,
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
              }}
            >
              <AchievementIcon sx={{ fontSize: 50 }} />
            </Box>
          </Box>
          
          <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
            Your Dream Job Awaits! 🎯
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, maxWidth: 600, mx: 'auto', lineHeight: 1.5 }}>
            Don't let another opportunity slip away. Start your preparation journey now and join thousands who landed their dream jobs.
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="center" sx={{ mb: 4 }}>
            <Button
              variant="contained"
              size="large"
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.9)',
                color: 'primary.main',
                '&:hover': { 
                  bgcolor: 'rgba(255,255,255,1)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.2)'
                },
                textTransform: 'none',
                fontWeight: 'bold',
                px: 4,
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                transition: 'all 0.3s ease'
              }}
              startIcon={<FastIcon />}
              onClick={() => navigate('/app/smart-tests')}
            >
              Start Free Assessment
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ 
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                '&:hover': { 
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  transform: 'translateY(-2px)'
                },
                textTransform: 'none',
                fontWeight: 'bold',
                px: 4,
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                transition: 'all 0.3s ease'
              }}
              startIcon={<WorkIcon />}
              onClick={() => navigate('/app/jobs')}
            >
              Browse Jobs
            </Button>
          </Stack>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)', mb: 4 }} />

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                Free
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                No hidden costs
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                5 Min
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Quick start
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                Smart Tools
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Advanced preparation
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default JobPreparationPage;
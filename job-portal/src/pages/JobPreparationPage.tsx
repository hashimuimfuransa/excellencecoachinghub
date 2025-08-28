import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
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
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

const JobPreparationPage: React.FC = () => {
  const navigate = useNavigate();

  // Preparation options for job seekers
  const preparationOptions = [
    {
      id: 'psychometric-tests',
      title: 'Psychometric Tests',
      description: 'Take personality, cognitive and skills assessments used by real employers',
      icon: <PsychologyIcon />,
      color: '#2196f3',
      route: '/app/tests',
      features: ['Personality Assessment', 'Cognitive Ability Tests', 'Skills Evaluation', 'Real Test Questions'],
      difficulty: 'Beginner to Advanced',
      popularity: 'Most Popular'
    },
    {
      id: 'ai-interviews',
      title: 'AI Mock Interviews',
      description: 'Practice interviews with AI for different job roles and get instant feedback',
      icon: <BotIcon />,
      color: '#ff6b35',
      route: '/app/interviews',
      features: ['Job-specific Questions', 'Real-time Feedback', 'Performance Analytics', 'Multiple Rounds'],
      difficulty: 'All Levels',
      popularity: 'Trending'
    },
    {
      id: 'career-assessment',
      title: 'Career Assessment',
      description: 'Comprehensive evaluation to discover your ideal career path and job matches',
      icon: <AssessmentIcon />,
      color: '#4caf50',
      route: '/app/career-guidance',
      features: ['Skills Analysis', 'Career Path Discovery', 'Job Matching', 'Personalized Recommendations'],
      difficulty: 'All Levels',
      popularity: 'Recommended'
    },
    {
      id: 'skill-courses',
      title: 'Skill Development',
      description: 'Access live courses and training programs to boost your skills',
      icon: <SchoolIcon />,
      color: '#9c27b0',
      route: 'https://www.elearning.excellencecoachinghub.com/',
      external: true,
      features: ['Live Expert Sessions', 'Certification Programs', 'Hands-on Projects', 'Industry-Relevant Skills'],
      difficulty: 'Beginner to Expert',
      popularity: 'New'
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
      default: return '#757575';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          🚀 Get Prepared for Job Success
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
          Choose your preparation path and increase your chances of landing your dream job
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 800, mx: 'auto' }}>
          Our comprehensive preparation tools are designed to help you excel in every aspect of the job search process. 
          From psychometric tests to AI-powered interviews, we've got everything you need to stand out to employers.
        </Typography>
      </Box>

      {/* Success Stats */}
      <Paper 
        sx={{ 
          p: 4, 
          mb: 6, 
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center'
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Join 50,000+ Job Seekers Who Got Hired
        </Typography>
        <Grid container spacing={4} sx={{ mt: 2 }}>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h2" fontWeight="bold">85%</Typography>
              <Typography variant="h6">Success Rate</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Of users who completed all preparation steps
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h2" fontWeight="bold">40%</Typography>
              <Typography variant="h6">Faster Hiring</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Average time reduction in job search
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box>
              <Typography variant="h2" fontWeight="bold">30%</Typography>
              <Typography variant="h6">Higher Salary</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Average salary increase for prepared candidates
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Preparation Options */}
      <Grid container spacing={4} sx={{ mb: 5 }}>
        {preparationOptions.map((option) => (
          <Grid item xs={12} md={6} key={option.id}>
            <Card
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `2px solid ${option.color}20`,
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: `0 20px 40px ${option.color}30`,
                  border: `2px solid ${option.color}`,
                }
              }}
              onClick={() => handleOptionClick(option)}
            >
              {/* Popularity Badge */}
              <Chip
                label={option.popularity}
                size="small"
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: getPopularityColor(option.popularity),
                  color: 'white',
                  fontWeight: 'bold',
                  zIndex: 1
                }}
              />

              {/* Card Header */}
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${option.color} 0%, ${option.color}DD 100%)`,
                  color: 'white',
                  p: 3,
                  textAlign: 'center',
                  position: 'relative'
                }}
              >
                <Box
                  sx={{
                    width: 80,
                    height: 80,
                    borderRadius: '20px',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                    fontSize: '2.5rem'
                  }}
                >
                  {option.icon}
                </Box>
                <Typography variant="h4" fontWeight="bold" gutterBottom>
                  {option.title}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  {option.description}
                </Typography>
              </Box>

              {/* Card Content */}
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="primary.main" fontWeight="bold" gutterBottom>
                    What You'll Get:
                  </Typography>
                  <List dense>
                    {option.features.map((feature, index) => (
                      <ListItem key={index} sx={{ py: 0.5, pl: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon sx={{ fontSize: 18, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={feature} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={option.difficulty} 
                    size="small" 
                    sx={{ 
                      bgcolor: `${option.color}15`, 
                      color: option.color,
                      fontWeight: 'bold'
                    }} 
                  />
                  <Button
                    variant="contained"
                    sx={{ 
                      bgcolor: option.color,
                      '&:hover': { bgcolor: `${option.color}DD` },
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                    endIcon={option.external ? <ShareIcon /> : <ArrowForward />}
                  >
                    {option.external ? 'Open Course' : 'Start Now'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Call to Action */}
      <Paper 
        sx={{ 
          p: 4, 
          borderRadius: 3,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white'
        }}
      >
        <AchievementIcon sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Ready to Transform Your Career?
        </Typography>
        <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
          Start with any preparation option above and take the first step toward your dream job
        </Typography>
        <Button
          variant="contained"
          size="large"
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            textTransform: 'none',
            fontWeight: 'bold',
            px: 4,
            py: 1.5
          }}
          startIcon={<WorkIcon />}
          onClick={() => navigate('/app/jobs')}
        >
          Browse Available Jobs
        </Button>
      </Paper>
    </Container>
  );
};

export default JobPreparationPage;
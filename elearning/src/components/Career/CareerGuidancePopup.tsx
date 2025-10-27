import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery,
  styled,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  School as SchoolIcon,
  WorkOutline as WorkIcon,
  AutoAwesome as SparklesIcon,
  Timeline as RoadmapIcon
} from '@mui/icons-material';

interface CareerGuidancePopupProps {
  open: boolean;
  onClose: () => void;
  onTakeCareerTest: () => void;
  userFirstName?: string;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    background: theme.palette.background.paper,
    boxShadow: `0 20px 40px rgba(0, 0, 0, 0.15)`,
    overflow: 'visible',
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
      borderRadius: `${theme.spacing(2)} ${theme.spacing(2)} 0 0`,
    }
  }
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: theme.spacing(1.5),
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.secondary.main, 0.08)} 100%)`,
  }
}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  border: 0,
  borderRadius: theme.spacing(1.5),
  boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
  color: 'white',
  height: 48,
  padding: '0 30px',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
    transform: 'translateY(-1px)',
    boxShadow: `0 6px 10px 4px ${alpha(theme.palette.primary.main, 0.3)}`,
  }
}));

const CareerGuidancePopup: React.FC<CareerGuidancePopupProps> = ({
  open,
  onClose,
  onTakeCareerTest,
  userFirstName = 'Student'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const features = [
    {
      icon: <PsychologyIcon color="primary" />,
      title: 'Career Discovery Test',
      description: 'Discover your personality type, interests, and ideal career paths through our comprehensive assessment.',
      color: theme.palette.primary.main
    },
    {
      icon: <TrendingUpIcon color="secondary" />,
      title: 'Personalized Career Paths',
      description: 'Get tailored career recommendations based on your unique profile and market trends.',
      color: theme.palette.secondary.main
    },
    {
      icon: <SchoolIcon color="success" />,
      title: 'Learning Roadmap',
      description: 'Receive a customized learning path with courses that match your career goals.',
      color: theme.palette.success.main
    },
    {
      icon: <WorkIcon color="warning" />,
      title: 'Job Matching',
      description: 'Find job opportunities that align with your skills and career aspirations.',
      color: theme.palette.warning.main
    },
    {
      icon: <SparklesIcon color="info" />,
      title: 'AI Career Mentor',
      description: 'Chat with our AI mentor for personalized career guidance and advice anytime.',
      color: theme.palette.info.main
    },
    {
      icon: <RoadmapIcon color="error" />,
      title: 'Progress Tracking',
      description: 'Monitor your career development journey with milestone tracking and achievements.',
      color: theme.palette.error.main
    }
  ];

  return (
    <StyledDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[100]} 100%)`
        }}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} component="h2" sx={{ fontWeight: 700, mb: 1 }}>
            🚀 Unlock Your Career Potential!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Hi {userFirstName}! Take your career to the next level with personalized guidance
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'text.secondary',
            '&:hover': {
              background: theme.palette.error.light,
              color: theme.palette.error.main
            }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {/* Main Message */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          {/* Hero Icon */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            mb: 2 
          }}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '50%', 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}>
              <PsychologyIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
            🚀 Discover Your Perfect Career Path!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8, fontSize: '1.1rem' }}>
            Let our <strong>AI-powered Career Discovery Test</strong> analyze your personality, interests, and skills to <em>unlock your ideal career path</em> and create a personalized learning journey!
          </Typography>

          {/* Benefits Preview - Enhanced */}
          <Box sx={{ 
            p: 3, 
            background: theme.palette.success.light,
            borderRadius: 3,
            border: `2px solid ${theme.palette.success.main}`,
            mb: 3,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.info.main})`,
            }
          }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'success.main' }}>
              🎁 Your Complete Career Discovery Package:
            </Typography>
            <Grid container spacing={1}>
              {[
                { icon: '🧠', label: 'Personality Profile', desc: 'Deep Analysis' },
                { icon: '🎯', label: 'Career Matches', desc: 'Perfect Fits' },
                { icon: '📈', label: 'Skills Assessment', desc: 'Strengths & Gaps' },
                { icon: '🛣️', label: 'Learning Path', desc: 'Custom Roadmap' },
                { icon: '💼', label: 'Job Opportunities', desc: 'Real Positions' }
              ].map((item, index) => (
                <Grid item xs={6} sm={4} md={2.4} key={index}>
                  <Box sx={{ 
                    textAlign: 'center',
                    p: 1.5,
                    borderRadius: 2,
                    background: theme.palette.background.paper,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      background: theme.palette.success.light
                    }
                  }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>{item.icon}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.dark', display: 'block' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Box>

        {/* Why This Will Transform Your Future */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, textAlign: 'center', color: 'primary.main' }}>
            🌟 Why This Assessment Will Shape Your Future:
          </Typography>
          <Grid container spacing={2}>
            {[
              { icon: '🔬', title: 'Scientific Analysis', desc: 'AI analyzes your personality using proven psychological frameworks to identify your natural strengths and preferences.', color: 'primary' },
              { icon: '🎨', title: 'Perfect Career Match', desc: 'Discover careers that align with who you are, not just what you think you want. Find your true calling.', color: 'secondary' },
              { icon: '📚', title: 'Personalized Learning', desc: 'Get a custom learning roadmap with courses that will prepare you for your ideal career path.', color: 'success' },
              { icon: '💡', title: 'AI Career Coach', desc: 'Chat with our AI mentor anytime for guidance, advice, and answers to your career questions.', color: 'info' }
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ 
                  p: 3,
                  borderRadius: 2,
                  background: theme.palette[feature.color].light,
                  border: `1px solid ${theme.palette[feature.color].main}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: theme.palette[feature.color].main,
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[8]
                  }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Typography variant="h4" sx={{ flexShrink: 0 }}>{feature.icon}</Typography>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1, color: `${feature.color}.main` }}>
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                        {feature.desc}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Assessment Info - Enhanced */}
        <Box sx={{ 
          p: 3, 
          background: theme.palette.warning.light,
          borderRadius: 3,
          border: `2px solid ${theme.palette.warning.main}`,
          textAlign: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
            borderRadius: '3px 3px 0 0'
          }
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'warning.dark' }}>
            ⏱️ Comprehensive Yet Simple Assessment
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: alpha(theme.palette.background.paper, 0.8),
                border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`
              }}>
                <Typography variant="h4" sx={{ color: 'warning.main', mb: 1 }}>⏰</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Time Investment</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.dark' }}>25-30 min</Typography>
                <Typography variant="caption" color="text.secondary">Deep & thorough analysis</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: alpha(theme.palette.background.paper, 0.8),
                border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              }}>
                <Typography variant="h4" sx={{ color: 'info.main', mb: 1 }}>❓</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Questions</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.dark' }}>~60 smart</Typography>
                <Typography variant="caption" color="text.secondary">Psychology-based & precise</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: alpha(theme.palette.background.paper, 0.8),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
              }}>
                <Typography variant="h4" sx={{ color: 'success.main', mb: 1 }}>🤖</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>AI Analysis</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.dark' }}>Instant</Typography>
                <Typography variant="caption" color="text.secondary">Advanced AI insights</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Student Success Stats */}
        <Box sx={{ 
          textAlign: 'center', 
          mt: 4,
          p: 3,
          background: `linear-gradient(135deg, ${theme.palette.grey[50]} 0%, ${theme.palette.grey[100]} 100%)`,
          borderRadius: 3,
          border: `2px dashed ${theme.palette.primary.main}`,
          position: 'relative'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
            🎓 Join 50,000+ Students Who Found Their Path!
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main' }}>94%</Typography>
              <Typography variant="caption" color="text.secondary">Found Career Direction</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'info.main' }}>89%</Typography>
              <Typography variant="caption" color="text.secondary">Chose Right Major</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'warning.main' }}>96%</Typography>
              <Typography variant="caption" color="text.secondary">Feel More Confident</Typography>
            </Grid>
          </Grid>
          
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', fontWeight: 500 }}>
            🌟 "Your dream career is waiting to be discovered. Take the first step toward your bright future!"
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 2, 
        background: theme.palette.grey[50],
        gap: 2,
        flexDirection: isMobile ? 'column' : 'row',
        borderTop: `1px solid ${theme.palette.divider}`
      }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            borderRadius: 2,
            px: 4,
            py: 1.5,
            minWidth: isMobile ? '100%' : 140,
            borderColor: theme.palette.text.secondary,
            color: 'text.secondary',
            fontWeight: 600,
            '&:hover': {
              borderColor: theme.palette.text.secondary,
              background: theme.palette.grey[100],
              transform: 'translateY(-1px)'
            }
          }}
        >
          ⏰ Ask Me Later
        </Button>
        <GradientButton
          onClick={() => {
            onTakeCareerTest();
            onClose();
          }}
          variant="contained"
          size="large"
          sx={{ 
            minWidth: isMobile ? '100%' : 250,
            fontSize: '1.1rem',
            fontWeight: 700,
            py: 1.8,
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
              transition: 'left 0.5s ease-in-out',
            },
            '&:hover::before': {
              left: '100%',
            }
          }}
        >
          🚀 Discover My Career Path
        </GradientButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default CareerGuidancePopup;
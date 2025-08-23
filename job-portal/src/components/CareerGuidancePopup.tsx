import React from 'react';
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
  useTheme,
  useMediaQuery,
  styled,
  alpha
} from '@mui/material';
import {
  Close as CloseIcon,
  Psychology as PsychologyIcon,
  TrendingUp as TrendingUpIcon,
  Work as WorkIcon,
  AutoAwesome as SparklesIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

interface CareerGuidancePopupProps {
  open: boolean;
  onClose: () => void;
  onTakeJobReadinessTest: () => void;
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
  onTakeJobReadinessTest,
  userFirstName = 'Job Seeker'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const features = [
    {
      icon: <PsychologyIcon color="primary" />,
      title: 'Job Readiness Assessment',
      description: 'Evaluate your preparedness for the job market and identify areas for improvement.',
      color: theme.palette.primary.main
    },
    {
      icon: <TrendingUpIcon color="secondary" />,
      title: 'Career Path Analysis',
      description: 'Discover career opportunities that match your skills and personality.',
      color: theme.palette.secondary.main
    },
    {
      icon: <WorkIcon color="success" />,
      title: 'Job Matching',
      description: 'Get matched with job opportunities based on your assessment results.',
      color: theme.palette.success.main
    },
    {
      icon: <SparklesIcon color="info" />,
      title: 'AI Career Mentor',
      description: 'Get personalized career advice and guidance from our AI mentor.',
      color: theme.palette.info.main
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
            🎯 Boost Your Job Readiness!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Hi {userFirstName}! Take our assessment to improve your chances of landing your dream job
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
              <AssessmentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
            🚀 Ready to Accelerate Your Job Search?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8, fontSize: '1.1rem' }}>
            Take our <strong>Job Readiness Assessment</strong> and get personalized insights to <em>stand out to employers</em> and land your dream job faster!
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
              🎯 Your Personalized Career Boost Package:
            </Typography>
            <Grid container spacing={1}>
              {[
                { icon: '📊', label: 'Readiness Score', desc: '0-100 Rating' },
                { icon: '💼', label: 'Job Matches', desc: 'Targeted Roles' },
                { icon: '🧠', label: 'Skills Analysis', desc: 'Strengths & Gaps' },
                { icon: '🎤', label: 'Interview Tips', desc: 'Proven Strategies' },
                { icon: '🎯', label: 'Career Roadmap', desc: 'Action Plan' }
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

        {/* Why Take This Assessment? */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, textAlign: 'center', color: 'primary.main' }}>
            🤔 Why This Assessment Will Transform Your Job Hunt:
          </Typography>
          <Grid container spacing={2}>
            {[
              { icon: '🎯', title: 'Know Your Score', desc: 'Get an objective job-readiness rating (0-100) and see exactly where you stand in the market.', color: 'primary' },
              { icon: '🔍', title: 'Find Perfect Jobs', desc: 'Our AI matches you with jobs that fit your skills, experience, and career goals perfectly.', color: 'secondary' },
              { icon: '📈', title: 'Skill Gap Analysis', desc: 'Identify missing skills employers want and get a clear roadmap to fill those gaps.', color: 'success' },
              { icon: '🎤', title: 'Interview Mastery', desc: 'Learn proven interview strategies and get personalized tips for your target roles.', color: 'info' }
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ 
                  p: 2.5,
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
            ⏱️ Quick & Easy Assessment
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.warning.main}`
              }}>
                <Typography variant="h4" sx={{ color: 'warning.main', mb: 1 }}>⏰</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Time Needed</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'warning.dark' }}>20-25 min</Typography>
                <Typography variant="caption" color="text.secondary">Perfect for lunch break</Typography>
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
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.dark' }}>~50 smart</Typography>
                <Typography variant="caption" color="text.secondary">AI-powered & relevant</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                background: alpha(theme.palette.background.paper, 0.8),
                border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
              }}>
                <Typography variant="h4" sx={{ color: 'success.main', mb: 1 }}>⚡</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Results</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.dark' }}>Instant</Typography>
                <Typography variant="caption" color="text.secondary">No waiting, immediate insights</Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Call to Action & Stats */}
        <Box sx={{ 
          textAlign: 'center', 
          mt: 4,
          p: 3,
          background: theme.palette.primary.light,
          borderRadius: 3,
          border: `2px dashed ${theme.palette.primary.main}`,
          position: 'relative'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
            🔥 Join 10,000+ Job Seekers Who Boosted Their Careers!
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={4}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'success.main' }}>87%</Typography>
              <Typography variant="caption" color="text.secondary">Got Interviews</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'info.main' }}>3.2x</Typography>
              <Typography variant="caption" color="text.secondary">Faster Job Search</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'warning.main' }}>92%</Typography>
              <Typography variant="caption" color="text.secondary">Found Job Match</Typography>
            </Grid>
          </Grid>
          
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'text.secondary', fontWeight: 500 }}>
            💡 "Your next job is just one assessment away. Take the first step toward your career breakthrough!"
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
          ⏰ Remind Me Later
        </Button>
        <GradientButton
          onClick={() => {
            onTakeJobReadinessTest();
            onClose();
          }}
          variant="contained"
          size="large"
          sx={{ 
            minWidth: isMobile ? '100%' : 240,
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
          🚀 Start My Career Assessment
        </GradientButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default CareerGuidancePopup;
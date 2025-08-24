import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  IconButton,
  useTheme,
  alpha,
  Stack,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper
} from '@mui/material';
import {
  Close,
  Psychology,
  MenuBook,
  Assignment,
  EmojiEvents,
  TrendingUp,
  School,
  WorkOutline,
  CheckCircle,
  Star,
  Timeline,
  QuestionAnswer,
  Speed,
  Certificate,
  LiveTv,
  Quiz,
  ArrowForward,
  Warning,
  Info,
  Lock
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface PreparationFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactElement;
  color: string;
  benefits: string[];
  action: () => void;
  requiresProfile: boolean;
  comingSoon?: boolean;
}

interface JobPreparationDialogProps {
  open: boolean;
  onClose: () => void;
  userProfileComplete?: boolean;
}

const JobPreparationDialog: React.FC<JobPreparationDialogProps> = ({
  open,
  onClose,
  userProfileComplete = false
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const preparationFeatures: PreparationFeature[] = [
    {
      id: 'psychometric',
      title: 'Psychometric Tests',
      description: 'Practice cognitive abilities, personality assessments, and aptitude tests',
      icon: <Psychology />,
      color: theme.palette.primary.main,
      benefits: [
        'Real test questions from recent years',
        'Timed practice sessions',
        'Detailed performance analysis',
        'Industry-specific assessments'
      ],
      action: () => navigate('/app/tests'),
      requiresProfile: true
    },
    {
      id: 'ai-interviews',
      title: 'AI Mock Interviews',
      description: 'Practice interviews with AI for specific job roles',
      icon: <QuestionAnswer />,
      color: theme.palette.secondary.main,
      benefits: [
        'Job-specific interview questions',
        'Real-time feedback',
        'Voice and video analysis',
        'Multiple interview formats'
      ],
      action: () => navigate('/app/interviews'),
      requiresProfile: true
    },
    {
      id: 'live-courses',
      title: 'Live Expert Courses',
      description: 'Join live sessions with industry experts',
      icon: <LiveTv />,
      color: theme.palette.success.main,
      benefits: [
        'Expert-led live sessions',
        'Interactive Q&A',
        'Industry insights',
        'Networking opportunities'
      ],
      action: () => window.open('https://www.elearning.excellencecoachinghub.com/', '_blank'),
      requiresProfile: false
    },
    {
      id: 'skill-assessments',
      title: 'Skill Assessments',
      description: 'Validate your technical and soft skills',
      icon: <Assignment />,
      color: theme.palette.info.main,
      benefits: [
        'Technical skill validation',
        'Industry-standard tests',
        'Verified certificates',
        'Progress tracking'
      ],
      action: () => navigate('/app/certificates'),
      requiresProfile: true
    },
    {
      id: 'career-guidance',
      title: 'Career Path Guidance',
      description: 'Get personalized career recommendations',
      icon: <Timeline />,
      color: theme.palette.warning.main,
      benefits: [
        'Personalized career paths',
        'Industry trend analysis',
        'Skills gap identification',
        'Growth recommendations'
      ],
      action: () => navigate('/app/career-guidance'),
      requiresProfile: true
    },
    {
      id: 'job-specific-prep',
      title: 'Job-Specific Preparation',
      description: 'Tailored preparation for specific job roles',
      icon: <WorkOutline />,
      color: theme.palette.error.main,
      benefits: [
        'Role-specific test questions',
        'Company-specific preparation',
        'Previous year questions',
        'Success rate insights'
      ],
      action: () => {}, // Will be handled differently
      requiresProfile: true,
      comingSoon: true
    }
  ];

  const handleFeatureClick = (feature: PreparationFeature) => {
    if (feature.comingSoon) {
      return;
    }

    if (feature.requiresProfile && !userProfileComplete) {
      setSelectedFeature(feature.id);
    } else {
      feature.action();
      onClose();
    }
  };

  const handleCompleteProfile = () => {
    navigate('/app/profile');
    onClose();
  };

  const FeatureCard: React.FC<{ feature: PreparationFeature }> = ({ feature }) => (
    <Card
      sx={{
        height: '100%',
        cursor: feature.comingSoon ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        border: `1px solid ${alpha(feature.color, 0.2)}`,
        opacity: feature.comingSoon ? 0.6 : 1,
        position: 'relative',
        '&:hover': feature.comingSoon ? {} : {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 30px ${alpha(feature.color, 0.3)}`,
          border: `1px solid ${feature.color}`
        }
      }}
      onClick={() => handleFeatureClick(feature)}
    >
      {feature.comingSoon && (
        <Chip
          label="Coming Soon"
          size="small"
          color="default"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 1
          }}
        />
      )}

      {feature.requiresProfile && !userProfileComplete && !feature.comingSoon && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: alpha(theme.palette.common.black, 0.7),
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1
          }}
        >
          <Stack alignItems="center" spacing={1} sx={{ color: 'white', textAlign: 'center', p: 2 }}>
            <Lock sx={{ fontSize: 32 }} />
            <Typography variant="body2" fontWeight="bold">
              Complete Profile Required
            </Typography>
          </Stack>
        </Box>
      )}

      <CardContent sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box display="flex" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: alpha(feature.color, 0.1),
                color: feature.color,
                width: 48,
                height: 48
              }}
            >
              {feature.icon}
            </Avatar>
            <Box flex={1} ml={2}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              What you'll get:
            </Typography>
            <List dense>
              {feature.benefits.slice(0, 3).map((benefit, index) => (
                <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}>
                    <CheckCircle sx={{ fontSize: 16, color: feature.color }} />
                  </ListItemIcon>
                  <ListItemText>
                    <Typography variant="caption" color="text.secondary">
                      {benefit}
                    </Typography>
                  </ListItemText>
                </ListItem>
              ))}
            </List>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              🚀 Prepare for Your Dream Job
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Choose from our comprehensive preparation resources
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Profile Completion Alert */}
        {!userProfileComplete && (
          <Alert 
            severity="warning" 
            sx={{ mb: 3 }}
            action={
              <Button color="inherit" size="small" onClick={handleCompleteProfile}>
                Complete Now
              </Button>
            }
          >
            <Typography variant="body2" fontWeight="medium">
              Complete your profile to unlock all preparation features and get personalized recommendations.
            </Typography>
          </Alert>
        )}

        {/* Features Grid */}
        <Grid container spacing={3}>
          {preparationFeatures.map((feature) => (
            <Grid item xs={12} md={6} key={feature.id}>
              <FeatureCard feature={feature} />
            </Grid>
          ))}
        </Grid>

        {/* Additional Info */}
        <Paper sx={{ p: 3, mt: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            🎯 Job-Specific Test Questions
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Get access to real test questions from recent years for specific job roles and companies. 
            Our database includes:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Star sx={{ color: 'primary.main', fontSize: 16 }} />
                <Typography variant="caption">
                  Previous year questions from top companies
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Star sx={{ color: 'primary.main', fontSize: 16 }} />
                <Typography variant="caption">
                  Role-specific psychometric assessments
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Star sx={{ color: 'primary.main', fontSize: 16 }} />
                <Typography variant="caption">
                  Industry-standard skill evaluations
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Star sx={{ color: 'primary.main', fontSize: 16 }} />
                <Typography variant="caption">
                  Success rate and difficulty analysis
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Profile Completion Requirement Dialog */}
        {selectedFeature && (
          <Paper 
            sx={{ 
              p: 3, 
              mt: 3, 
              border: `2px solid ${theme.palette.warning.main}`,
              borderRadius: 2
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" mb={2}>
              <Warning sx={{ color: 'warning.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Profile Completion Required
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph>
              To access this feature and get personalized preparation materials, 
              you need to complete your profile first. This helps us:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText primary="Provide job-specific test questions" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText primary="Customize difficulty levels" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                </ListItemIcon>
                <ListItemText primary="Track your progress effectively" />
              </ListItem>
            </List>
            <Stack direction="row" spacing={2} mt={2}>
              <Button
                variant="contained"
                onClick={handleCompleteProfile}
                startIcon={<ArrowForward />}
              >
                Complete Profile
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSelectedFeature(null)}
              >
                Maybe Later
              </Button>
            </Stack>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose} variant="outlined" size="large">
          Close
        </Button>
        {userProfileComplete && (
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/app/tests')}
            startIcon={<Psychology />}
          >
            Start Preparing
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default JobPreparationDialog;
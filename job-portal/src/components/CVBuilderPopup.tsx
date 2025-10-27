import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Chip,
  Grid,
  Slide,
} from '@mui/material';
import {
  Close,
  Description,
  Work,
  School,
  Code,
  Language,
  Star,
  EmojiEvents,
  Person,
  ArrowForward,
  CheckCircle,
  AutoAwesome,
  Download,
  Preview,
  TrendingUp,
  Article,
} from '@mui/icons-material';
import { User } from '../types/user';

interface CVBuilderPopupProps {
  open: boolean;
  onClose: () => void;
  onBuildCV: () => void;
  onContinueProfile: () => void;
  user: User;
}

const CVBuilderPopup: React.FC<CVBuilderPopupProps> = ({
  open,
  onClose,
  onBuildCV,
  onContinueProfile,
  user,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Check if user already has a CV
  const hasExistingCV = user.cvFile && user.cvFile.trim() !== '';

  const cvFeatures = [
    {
      icon: <AutoAwesome color="primary" />,
      title: 'AI-Powered Builder',
      description: 'Smart suggestions and templates',
    },
    {
      icon: <Description color="success" />,
      title: 'Professional Templates',
      description: 'Multiple modern CV designs',
    },
    {
      icon: <Download color="info" />,
      title: 'Easy Export',
      description: 'Download as PDF or Word',
    },
    {
      icon: <Preview color="warning" />,
      title: 'Live Preview',
      description: 'See changes in real-time',
    },
  ];

  const cvSections = [
    { icon: <Person />, name: 'Personal Information' },
    { icon: <Work />, name: 'Work Experience' },
    { icon: <School />, name: 'Education' },
    { icon: <Code />, name: 'Skills' },
    { icon: <Language />, name: 'Languages' },
    { icon: <Star />, name: 'Projects' },
    { icon: <EmojiEvents />, name: 'Certifications' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={isMobile ? 'sm' : 'md'}
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Slide}
      TransitionProps={{ direction: 'up' }}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(25, 25, 25, 0.98) 50%, rgba(20, 20, 20, 1) 100%)'
            : 'linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,0.95) 50%, rgba(240,244,248,0.9) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 20px 60px rgba(102, 126, 234, 0.2)',
          minHeight: isMobile ? '100vh' : 'auto',
          maxHeight: isMobile ? '100vh' : '90vh',
          overflow: 'hidden',
          border: theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : 'none',
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: isMobile ? 2 : 1,
        pt: isMobile ? 3 : 2,
        px: isMobile ? 2 : 3,
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #2e7d32 0%, #4caf50 100%)'
          : 'linear-gradient(135deg, #795548 0%, #a1887f 100%)',
        color: 'white',
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 2,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(90deg, #66bb6a 0%, #81c784 100%)'
            : 'linear-gradient(90deg, #4facfe 0%, #00d4ff 100%)',
        }
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: isMobile ? 1.5 : 2, flex: 1 }}>
            <Avatar
              sx={{
                width: isMobile ? 40 : 48,
                height: isMobile ? 40 : 48,
                border: '3px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.2)',
              }}
            >
              <Description />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant={isMobile ? 'h6' : 'h6'} 
                fontWeight="bold" 
                sx={{ 
                  color: 'white',
                  fontSize: isMobile ? '1.1rem' : '1.25rem',
                  lineHeight: 1.2,
                }}
              >
                Build Your Professional CV
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.8)',
                  fontSize: isMobile ? '0.8rem' : '0.875rem',
                  mt: 0.5,
                }}
              >
                Create a standout CV that gets you noticed
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'white',
              p: isMobile ? 1 : 1.5,
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)',
              }
            }}
          >
            <Close fontSize={isMobile ? 'medium' : 'large'} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        p: isMobile ? 2 : 3,
        overflow: 'auto',
        flex: 1,
      }}>
        {/* Main Content */}
        <Box sx={{ textAlign: 'center', mb: { xs: 2, sm: 3 } }}>
          <Article sx={{ 
            fontSize: { xs: 80, sm: 100 }, 
            color: hasExistingCV ? theme.palette.info.main : theme.palette.success.main, 
            mb: 2,
            filter: `drop-shadow(0 5px 15px ${alpha(hasExistingCV ? theme.palette.info.main : theme.palette.success.main, 0.3)})`,
          }} />
          <Typography variant={isMobile ? "h6" : "h5"} fontWeight={600} gutterBottom>
            {hasExistingCV ? `Great, ${user?.firstName || 'User'}!` : `Ready to Stand Out, ${user?.firstName || 'User'}?`}
          </Typography>
          <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary" sx={{ mb: 2 }}>
            {hasExistingCV 
              ? "You already have a CV! You can continue completing your profile to maximize your job opportunities."
              : "A CV is required to complete your profile. Our AI-powered CV builder helps you create a stunning resume in minutes."
            }
          </Typography>
        </Box>
        <Box sx={{ mb: isMobile ? 2 : 3 }}>
          <Typography 
            variant={isMobile ? 'subtitle2' : 'subtitle1'} 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
          >
            {hasExistingCV ? 'Profile Completion Benefits' : 'CV Required for Profile Completion'}
          </Typography>
          {!hasExistingCV && (
            <Typography 
              variant="body2" 
              color="error" 
              sx={{ 
                mb: 2, 
                fontWeight: 600,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                textAlign: 'center',
                bgcolor: theme.palette.mode === 'dark'
                  ? alpha(theme.palette.error.main, 0.15)
                  : alpha(theme.palette.error.main, 0.1),
                p: 1,
                borderRadius: 1,
                border: theme.palette.mode === 'dark'
                  ? `1px solid ${alpha(theme.palette.error.main, 0.3)}`
                  : `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
              }}
            >
              ⚠️ A CV is mandatory to complete your profile and access all features
            </Typography>
          )}
          <Grid container spacing={isMobile ? 1 : 2}>
            {(hasExistingCV ? [
              {
                icon: <CheckCircle color="success" />,
                title: 'Complete Profile',
                description: 'Fill out all sections to increase your visibility to employers'
              },
              {
                icon: <Work color="primary" />,
                title: 'Better Job Matches',
                description: 'Complete profiles get better job recommendations'
              },
              {
                icon: <Star color="warning" />,
                title: 'Professional Image',
                description: 'A complete profile shows professionalism and attention to detail'
              },
              {
                icon: <TrendingUp color="info" />,
                title: 'Career Growth',
                description: 'Complete profiles lead to more opportunities and connections'
              }
            ] : cvFeatures).map((feature, index) => (
              <Grid item xs={12} sm={6} key={index}>
                <Box sx={{ 
                  p: isMobile ? 1.5 : 2, 
                  borderRadius: 2, 
                  background: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.08)
                    : alpha(theme.palette.primary.main, 0.05),
                  border: theme.palette.mode === 'dark'
                    ? `1px solid ${alpha(theme.palette.primary.main, 0.15)}`
                    : `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  height: '100%',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    background: theme.palette.mode === 'dark'
                      ? alpha(theme.palette.primary.main, 0.12)
                      : alpha(theme.palette.primary.main, 0.08),
                    border: theme.palette.mode === 'dark'
                      ? `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
                      : `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    transform: 'translateY(-2px)',
                  },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {feature.icon}
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="bold"
                      sx={{ fontSize: isMobile ? '0.8rem' : '0.875rem' }}
                    >
                      {feature.title}
                    </Typography>
                  </Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: isMobile ? '0.75rem' : '0.8rem' }}
                  >
                    {feature.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CV Sections */}
        <Box sx={{ mb: isMobile ? 2 : 3 }}>
          <Typography 
            variant={isMobile ? 'subtitle2' : 'subtitle1'} 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
          >
            What You'll Include
          </Typography>
          <List dense sx={{ maxHeight: isMobile ? 200 : 'none', overflow: 'auto' }}>
            {cvSections.map((section, index) => (
              <ListItem key={index} sx={{ py: 0.5, px: 0 }}>
                <ListItemIcon sx={{ minWidth: isMobile ? 32 : 36 }}>
                  {section.icon}
                </ListItemIcon>
                <ListItemText
                  primary={section.name}
                  primaryTypographyProps={{ 
                    variant: 'body2',
                    sx: { fontSize: isMobile ? '0.8rem' : '0.875rem' }
                  }}
                />
                <CheckCircle color="success" fontSize="small" />
              </ListItem>
            ))}
          </List>
        </Box>

        {/* Benefits */}
        <Box sx={{ 
          p: isMobile ? 1.5 : 2, 
          borderRadius: 2, 
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.success.main, 0.08)
            : alpha(theme.palette.success.main, 0.05),
          border: theme.palette.mode === 'dark'
            ? `1px solid ${alpha(theme.palette.success.main, 0.15)}`
            : `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
          mb: isMobile ? 2 : 3,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.success.main, 0.12)
              : alpha(theme.palette.success.main, 0.08),
            border: theme.palette.mode === 'dark'
              ? `1px solid ${alpha(theme.palette.success.main, 0.2)}`
              : `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
          },
        }}>
          <Typography 
            variant={isMobile ? 'subtitle2' : 'subtitle1'} 
            fontWeight="bold" 
            gutterBottom
            sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}
          >
            Benefits of a Professional CV
          </Typography>
          <List dense>
            <ListItem sx={{ py: 0.5, px: 0 }}>
              <ListItemIcon sx={{ minWidth: isMobile ? 32 : 36 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Stand out from other candidates"
                primaryTypographyProps={{ 
                  variant: 'body2',
                  sx: { fontSize: isMobile ? '0.8rem' : '0.875rem' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>
              <ListItemIcon sx={{ minWidth: isMobile ? 32 : 36 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="ATS-friendly format for better visibility"
                primaryTypographyProps={{ 
                  variant: 'body2',
                  sx: { fontSize: isMobile ? '0.8rem' : '0.875rem' }
                }}
              />
            </ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>
              <ListItemIcon sx={{ minWidth: isMobile ? 32 : 36 }}>
                <CheckCircle color="success" fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Professional presentation of your skills"
                primaryTypographyProps={{ 
                  variant: 'body2',
                  sx: { fontSize: isMobile ? '0.8rem' : '0.875rem' }
                }}
              />
            </ListItem>
          </List>
        </Box>

        {/* User Info */}
        <Box sx={{ 
          p: isMobile ? 1.5 : 2, 
          borderRadius: 2, 
          background: theme.palette.mode === 'dark'
            ? alpha(theme.palette.info.main, 0.08)
            : alpha(theme.palette.info.main, 0.05),
          border: theme.palette.mode === 'dark'
            ? `1px solid ${alpha(theme.palette.info.main, 0.15)}`
            : `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.info.main, 0.12)
              : alpha(theme.palette.info.main, 0.08),
            border: theme.palette.mode === 'dark'
              ? `1px solid ${alpha(theme.palette.info.main, 0.2)}`
              : `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
          },
        }}>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              textAlign: 'center',
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              lineHeight: 1.4,
            }}
          >
            {hasExistingCV 
              ? `Hi ${user?.firstName}! Since you already have a CV, focus on completing your profile to maximize your job opportunities.`
              : `Hi ${user?.firstName}! A CV is mandatory to complete your profile. We can help you create a professional CV that showcases your skills and experience.`
            }
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: isMobile ? 2 : 3, 
        pt: 0,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0,
      }}>
        {/* I Already Have CV Button - Always visible */}
        <Button
          onClick={onClose}
          variant="text"
          fullWidth={isMobile}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            py: isMobile ? 1 : 0.5,
            fontSize: isMobile ? '0.8rem' : '0.875rem',
            color: theme.palette.mode === 'dark' 
              ? alpha(theme.palette.text.secondary, 0.8)
              : theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark'
                ? alpha(theme.palette.text.secondary, 0.1)
                : alpha(theme.palette.text.secondary, 0.05),
              color: theme.palette.mode === 'dark' 
                ? theme.palette.text.secondary
                : theme.palette.text.primary,
            },
            mb: isMobile ? 1 : 0,
          }}
        >
          I Already Have CV
        </Button>

        {hasExistingCV ? (
          // If user has CV, show "Continue Profile" as primary action
          <>
            <Button
              onClick={onBuildCV}
              variant="outlined"
              fullWidth={isMobile}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                py: isMobile ? 1.5 : 1,
                fontSize: isMobile ? '0.9rem' : '0.875rem',
                borderColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.3)
                  : theme.palette.primary.main,
                color: theme.palette.mode === 'dark' 
                  ? theme.palette.primary.light
                  : theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              Update My CV
            </Button>
            <Button
              onClick={onContinueProfile}
              variant="contained"
              size="large"
              fullWidth={isMobile}
              endIcon={<ArrowForward />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                px: isMobile ? 2 : 4,
                py: isMobile ? 1.5 : 1.5,
                fontSize: isMobile ? '0.9rem' : '1rem',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                  : 'linear-gradient(135deg, #795548 0%, #a1887f 100%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(76, 175, 80, 0.3)'
                  : '0 4px 12px rgba(121, 85, 72, 0.3)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)'
                    : 'linear-gradient(135deg, #5d4037 0%, #795548 100%)',
                  transform: isMobile ? 'none' : 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 16px rgba(76, 175, 80, 0.4)'
                    : '0 6px 16px rgba(121, 85, 72, 0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Continue Completing Profile
            </Button>
          </>
        ) : (
          // If user doesn't have CV, show CV builder as primary action
          <>
            <Button
              onClick={onContinueProfile}
              variant="outlined"
              fullWidth={isMobile}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                py: isMobile ? 1.5 : 1,
                fontSize: isMobile ? '0.9rem' : '0.875rem',
                borderColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.3)
                  : theme.palette.primary.main,
                color: theme.palette.mode === 'dark' 
                  ? theme.palette.primary.light
                  : theme.palette.primary.main,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.1)
                    : alpha(theme.palette.primary.main, 0.05),
                },
              }}
            >
              Complete Profile First
            </Button>
            <Button
              onClick={onBuildCV}
              variant="contained"
              size="large"
              fullWidth={isMobile}
              endIcon={<ArrowForward />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 'bold',
                px: isMobile ? 2 : 4,
                py: isMobile ? 1.5 : 1.5,
                fontSize: isMobile ? '0.9rem' : '1rem',
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                  : 'linear-gradient(135deg, #795548 0%, #a1887f 100%)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(76, 175, 80, 0.3)'
                  : '0 4px 12px rgba(121, 85, 72, 0.3)',
                '&:hover': {
                  background: theme.palette.mode === 'dark'
                    ? 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)'
                    : 'linear-gradient(135deg, #5d4037 0%, #795548 100%)',
                  transform: isMobile ? 'none' : 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark'
                    ? '0 6px 16px rgba(76, 175, 80, 0.4)'
                    : '0 6px 16px rgba(121, 85, 72, 0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Build My CV
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CVBuilderPopup;

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Slide,
  Grow,
  Stack,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Close as CloseIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { useNavigate } from 'react-router-dom';
import { SafeSlideUp } from '../utils/transitionFix';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

interface AccountTypeModalProps {
  open: boolean;
  onClose: () => void;
  redirectType?: string;
  jobId?: string;
}

const Transition = SafeSlideUp;

const AccountTypeModal: React.FC<AccountTypeModalProps> = ({ 
  open, 
  onClose, 
  redirectType, 
  jobId 
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [hoveredType, setHoveredType] = useState<string>('');
  const navigate = useNavigate();
  const theme = useTheme();
  const { mode } = useCustomTheme();
  const isDark = mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const getAccountTypes = () => [
    {
      id: 'employer',
      title: 'Employer',
      description: 'Post jobs, find qualified candidates, and manage your recruitment process',
      icon: <BusinessIcon sx={{ fontSize: isMobile ? 30 : 40, color: '#ffffff' }} />,
      gradient: isDark 
        ? 'linear-gradient(135deg, #66BB6A 0%, #4CAF50 100%)'
        : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      features: ['Post unlimited jobs', 'Access to candidate database', 'Recruitment analytics', 'Priority support']
    },
    {
      id: 'job_seeker',
      title: 'Job Seeker',
      description: 'Find jobs matching your skills and experience, prepare for interviews',
      icon: <PersonIcon sx={{ fontSize: isMobile ? 30 : 40, color: '#ffffff' }} />,
      gradient: isDark 
        ? 'linear-gradient(135deg, #81C784 0%, #66BB6A 100%)'
        : 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
      features: ['Browse thousands of jobs', 'Smart job matching', 'Resume builder', 'Interview preparation']
    },
    {
      id: 'student',
      title: 'Student',
      description: 'Access courses, get certified, and find internships or entry-level positions',
      icon: <SchoolIcon sx={{ fontSize: isMobile ? 30 : 40, color: '#ffffff' }} />,
      gradient: isDark 
        ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'
        : 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
      features: ['Access to courses', 'Certification programs', 'Internship opportunities', 'Career guidance']
    }
  ];

  const accountTypes = getAccountTypes();

  const handleContinue = () => {
    if (!selectedType) return;

    // Build the registration URL with the selected role and redirect params
    let registrationUrl = `/register?role=${selectedType}`;
    if (redirectType === 'job' && jobId) {
      registrationUrl += `&redirect=job&jobId=${jobId}`;
    }
    
    navigate(registrationUrl);
    onClose();
  };

  const handleCardClick = (typeId: string) => {
    setSelectedType(typeId);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      maxWidth={isMobile ? 'sm' : 'md'}
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          background: isDark 
            ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.95) 0%, rgba(45, 45, 45, 0.95) 100%)'
            : 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          boxShadow: isDark
            ? '0 20px 60px rgba(0, 0, 0, 0.5)'
            : '0 20px 60px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'blur(20px)',
          border: isDark 
            ? '1px solid rgba(102, 187, 106, 0.2)' 
            : '1px solid rgba(255, 255, 255, 0.2)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: isDark 
              ? 'linear-gradient(90deg, #66BB6A, #81C784, #4CAF50)'
              : 'linear-gradient(90deg, #2e7d32, #1976d2, #f57c00)',
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: isMobile ? 2 : 1,
        pt: isMobile ? 4 : 3,
        px: isMobile ? 2 : 3,
        position: 'relative',
        background: isDark 
          ? 'linear-gradient(45deg, rgba(102, 187, 106, 0.1) 0%, rgba(129, 199, 132, 0.1) 100%)'
          : 'linear-gradient(45deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
        borderBottom: isDark 
          ? '1px solid rgba(102, 187, 106, 0.2)' 
          : '1px solid rgba(102, 126, 234, 0.2)',
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography 
              variant={isMobile ? "h5" : "h4"}
              component="h2" 
              sx={{ 
                fontWeight: 700,
                background: isDark 
                  ? 'linear-gradient(45deg, #66BB6A, #81C784)'
                  : 'linear-gradient(45deg, #2e7d32, #1976d2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                fontSize: isMobile ? '1.5rem' : '2rem'
              }}
            >
              Choose Your Account Type
            </Typography>
            <Typography 
              variant={isMobile ? "body2" : "body1"}
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.9rem' : '1.1rem' }}
            >
              Select the option that best describes your professional status
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: isDark ? '#66BB6A' : 'text.secondary',
              '&:hover': { 
                backgroundColor: isDark 
                  ? 'rgba(102, 187, 106, 0.1)' 
                  : 'rgba(0, 0, 0, 0.05)',
                color: isDark ? '#4CAF50' : 'text.primary' 
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ 
        px: isMobile ? 2 : 3, 
        py: isMobile ? 2 : 2,
        overflow: 'auto',
        maxHeight: isMobile ? 'calc(100vh - 200px)' : '70vh'
      }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: '1fr', 
            sm: isTablet ? '1fr' : 'repeat(2, 1fr)', 
            md: 'repeat(3, 1fr)' 
          },
          gap: isMobile ? 1.5 : 2,
          mb: 3
        }}>
          {accountTypes.map((type, index) => (
            <Grow
              key={type.id}
              in={open}
              timeout={500 + (index * 200)}
            >
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: selectedType === type.id ? 'scale(1.02)' : 'scale(1)',
                  border: selectedType === type.id 
                    ? '3px solid' 
                    : '2px solid transparent',
                  borderImage: selectedType === type.id 
                    ? type.gradient + ' 1'
                    : 'none',
                  borderRadius: isMobile ? '12px' : '16px',
                  background: selectedType === type.id 
                    ? (isDark 
                        ? 'linear-gradient(rgba(30, 30, 30, 0.95), rgba(30, 30, 30, 0.95)) padding-box, ' + type.gradient + ' border-box'
                        : 'linear-gradient(white, white) padding-box, ' + type.gradient + ' border-box')
                    : (isDark ? 'rgba(30, 30, 30, 0.8)' : 'white'),
                  boxShadow: selectedType === type.id
                    ? (isDark 
                        ? '0 8px 30px rgba(102, 187, 106, 0.3)'
                        : '0 8px 30px rgba(0, 0, 0, 0.12)')
                    : (isDark 
                        ? '0 2px 10px rgba(0, 0, 0, 0.3)'
                        : '0 2px 10px rgba(0, 0, 0, 0.08)'),
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: isDark
                      ? '0 8px 30px rgba(102, 187, 106, 0.4)'
                      : '0 8px 30px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => handleCardClick(type.id)}
                  onMouseEnter={() => setHoveredType(type.id)}
                  onMouseLeave={() => setHoveredType('')}
                  sx={{ p: 0, height: '100%' }}
                >
                  <CardContent sx={{ 
                    p: isMobile ? 2 : 3, 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column' 
                  }}>
                    <Box sx={{ textAlign: 'center', mb: isMobile ? 1.5 : 2 }}>
                      <Box
                        sx={{
                          width: isMobile ? 60 : 80,
                          height: isMobile ? 60 : 80,
                          borderRadius: '50%',
                          background: type.gradient,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                          transition: 'transform 0.3s ease',
                          transform: hoveredType === type.id || selectedType === type.id 
                            ? 'scale(1.1)' 
                            : 'scale(1)',
                        }}
                      >
                        {type.icon}
                      </Box>
                      <Typography 
                        variant={isMobile ? "subtitle1" : "h6"}
                        sx={{ 
                          fontWeight: 700,
                          mb: 1,
                          color: selectedType === type.id 
                            ? (isDark ? '#66BB6A' : 'primary.main') 
                            : 'text.primary'
                        }}
                      >
                        {type.title}
                      </Typography>
                      <Typography 
                        variant={isMobile ? "caption" : "body2"}
                        color="text.secondary"
                        sx={{ 
                          lineHeight: 1.5,
                          fontSize: isMobile ? '0.8rem' : '0.95rem',
                          mb: isMobile ? 1.5 : 2
                        }}
                      >
                        {type.description}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: isMobile ? 1 : 1.5 }} />

                    <Box sx={{ mt: 'auto' }}>
                      <Typography 
                        variant={isMobile ? "caption" : "subtitle2"}
                        sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          color: 'text.primary',
                          fontSize: isMobile ? '0.75rem' : '0.875rem'
                        }}
                      >
                        Key Features:
                      </Typography>
                      <Stack spacing={isMobile ? 0.3 : 0.5}>
                        {type.features.map((feature, idx) => (
                          <Typography 
                            key={idx}
                            variant="caption" 
                            sx={{ 
                              fontSize: isMobile ? '0.7rem' : '0.8rem',
                              color: 'text.secondary',
                              display: 'flex',
                              alignItems: 'center',
                              '&::before': {
                                content: '"✓"',
                                color: isDark ? '#66BB6A' : 'success.main',
                                fontWeight: 'bold',
                                marginRight: '6px'
                              }
                            }}
                          >
                            {feature}
                          </Typography>
                        ))}
                      </Stack>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grow>
          ))}
        </Box>

        {selectedType && (
          <Grow in={!!selectedType} timeout={300}>
            <Box
              sx={{
                p: isMobile ? 1.5 : 2,
                borderRadius: 2,
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(102, 187, 106, 0.15) 0%, rgba(129, 199, 132, 0.15) 100%)'
                  : 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
                border: isDark 
                  ? '1px solid rgba(102, 187, 106, 0.3)' 
                  : '1px solid #c8e6c8',
                textAlign: 'center'
              }}
            >
              <Typography 
                variant={isMobile ? "body2" : "body1"} 
                sx={{ 
                  fontWeight: 500, 
                  color: isDark ? '#66BB6A' : 'success.dark',
                  fontSize: isMobile ? '0.85rem' : '1rem'
                }}
              >
                ✓ Great choice! You'll be creating a{' '}
                <strong>{accountTypes.find(t => t.id === selectedType)?.title}</strong> account
              </Typography>
            </Box>
          </Grow>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        px: isMobile ? 2 : 3, 
        pb: isMobile ? 3 : 3, 
        pt: 1,
        background: isDark 
          ? 'linear-gradient(45deg, rgba(102, 187, 106, 0.05) 0%, rgba(129, 199, 132, 0.05) 100%)'
          : 'linear-gradient(45deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
        borderTop: isDark 
          ? '1px solid rgba(102, 187, 106, 0.2)' 
          : '1px solid rgba(102, 126, 234, 0.2)',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        <Button
          onClick={onClose}
          variant="text"
          sx={{ 
            mr: isMobile ? 0 : 2,
            color: isDark ? '#66BB6A' : 'text.secondary',
            '&:hover': { 
              backgroundColor: isDark 
                ? 'rgba(102, 187, 106, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)' 
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedType}
          variant="contained"
          endIcon={<ArrowForwardIcon />}
          sx={{
            background: selectedType 
              ? accountTypes.find(t => t.id === selectedType)?.gradient || (isDark ? 'linear-gradient(45deg, #66BB6A, #81C784)' : 'linear-gradient(45deg, #2e7d32, #1976d2)')
              : 'rgba(0, 0, 0, 0.12)',
            color: 'white',
            fontWeight: 600,
            px: isMobile ? 2 : 3,
            py: isMobile ? 1.5 : 1,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: isMobile ? '0.9rem' : '1rem',
            width: isMobile ? '100%' : 'auto',
            '&:hover': {
              background: selectedType 
                ? accountTypes.find(t => t.id === selectedType)?.gradient || (isDark ? 'linear-gradient(45deg, #4CAF50, #66BB6A)' : 'linear-gradient(45deg, #1b5e20, #1565c0)')
                : 'rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-1px)',
              boxShadow: isDark
                ? '0 4px 15px rgba(102, 187, 106, 0.4)'
                : '0 4px 15px rgba(0, 0, 0, 0.2)',
            },
            '&:disabled': {
              background: isDark 
                ? 'rgba(102, 187, 106, 0.2)' 
                : 'rgba(0, 0, 0, 0.12)',
              color: isDark 
                ? 'rgba(102, 187, 106, 0.5)' 
                : 'rgba(0, 0, 0, 0.26)',
            }
          }}
        >
          Continue to Registration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountTypeModal;
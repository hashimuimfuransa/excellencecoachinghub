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
  Divider
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

interface AccountTypeModalProps {
  open: boolean;
  onClose: () => void;
  redirectType?: string;
  jobId?: string;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const AccountTypeModal: React.FC<AccountTypeModalProps> = ({ 
  open, 
  onClose, 
  redirectType, 
  jobId 
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [hoveredType, setHoveredType] = useState<string>('');
  const navigate = useNavigate();

  const accountTypes = [
    {
      id: 'employer',
      title: 'Employer',
      description: 'Post jobs, find qualified candidates, and manage your recruitment process',
      icon: <BusinessIcon sx={{ fontSize: 40, color: '#ffffff' }} />,
      gradient: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
      features: ['Post unlimited jobs', 'Access to candidate database', 'Recruitment analytics', 'Priority support']
    },
    {
      id: 'job_seeker',
      title: 'Job Seeker',
      description: 'Find jobs matching your skills and experience, prepare for interviews',
      icon: <PersonIcon sx={{ fontSize: 40, color: '#ffffff' }} />,
      gradient: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
      features: ['Browse thousands of jobs', 'Smart job matching', 'Resume builder', 'Interview preparation']
    },
    {
      id: 'student',
      title: 'Student',
      description: 'Access courses, get certified, and find internships or entry-level positions',
      icon: <SchoolIcon sx={{ fontSize: 40, color: '#ffffff' }} />,
      gradient: 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)',
      features: ['Access to courses', 'Certification programs', 'Internship opportunities', 'Career guidance']
    }
  ];

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
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: 'linear-gradient(90deg, #2e7d32, #1976d2, #f57c00)',
          }
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        pt: 3,
        px: 3,
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography 
              variant="h4" 
              component="h2" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #2e7d32, #1976d2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Choose Your Account Type
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ fontSize: '1.1rem' }}
            >
              Select the option that best describes your professional status
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ 
              color: 'text.secondary',
              '&:hover': { 
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                color: 'text.primary' 
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 2 }}>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
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
                  borderRadius: '16px',
                  background: selectedType === type.id 
                    ? 'linear-gradient(white, white) padding-box, ' + type.gradient + ' border-box'
                    : 'white',
                  boxShadow: selectedType === type.id
                    ? '0 8px 30px rgba(0, 0, 0, 0.12)'
                    : '0 2px 10px rgba(0, 0, 0, 0.08)',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => handleCardClick(type.id)}
                  onMouseEnter={() => setHoveredType(type.id)}
                  onMouseLeave={() => setHoveredType('')}
                  sx={{ p: 0, height: '100%' }}
                >
                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ textAlign: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 80,
                          height: 80,
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
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700,
                          mb: 1,
                          color: selectedType === type.id ? 'primary.main' : 'text.primary'
                        }}
                      >
                        {type.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          lineHeight: 1.5,
                          fontSize: '0.95rem',
                          mb: 2
                        }}
                      >
                        {type.description}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ mt: 'auto' }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: 600,
                          mb: 1,
                          color: 'text.primary'
                        }}
                      >
                        Key Features:
                      </Typography>
                      <Stack spacing={0.5}>
                        {type.features.map((feature, idx) => (
                          <Typography 
                            key={idx}
                            variant="caption" 
                            sx={{ 
                              fontSize: '0.8rem',
                              color: 'text.secondary',
                              display: 'flex',
                              alignItems: 'center',
                              '&::before': {
                                content: '"✓"',
                                color: 'success.main',
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
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #e8f5e8 0%, #f0f8f0 100%)',
                border: '1px solid #c8e6c8',
                textAlign: 'center'
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500, color: 'success.dark' }}>
                ✓ Great choice! You'll be creating a{' '}
                <strong>{accountTypes.find(t => t.id === selectedType)?.title}</strong> account
              </Typography>
            </Box>
          </Grow>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="text"
          sx={{ 
            mr: 2,
            color: 'text.secondary',
            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.05)' }
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
              ? accountTypes.find(t => t.id === selectedType)?.gradient || 'linear-gradient(45deg, #2e7d32, #1976d2)'
              : 'rgba(0, 0, 0, 0.12)',
            color: 'white',
            fontWeight: 600,
            px: 3,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            '&:hover': {
              background: selectedType 
                ? accountTypes.find(t => t.id === selectedType)?.gradient || 'linear-gradient(45deg, #1b5e20, #1565c0)'
                : 'rgba(0, 0, 0, 0.12)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)',
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
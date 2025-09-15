import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  CircularProgress,
  Alert,
  Slide,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  School, 
  Person, 
  Business,
  CheckCircle,
  Google 
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { UserRole } from '../contexts/AuthContext';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface GoogleRoleSelectionModalProps {
  open: boolean;
  onClose: () => void;
  userData: any;
  onRoleSelect: (role: string, userData: any) => Promise<void>;
  loading?: boolean;
}

const GoogleRoleSelectionModal: React.FC<GoogleRoleSelectionModalProps> = ({
  open,
  onClose,
  userData,
  onRoleSelect,
  loading = false
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const roleOptions = [
    {
      value: UserRole.STUDENT,
      title: 'Student',
      icon: <School sx={{ fontSize: 32, color: '#4CAF50' }} />,
      description: 'Access courses, get certified, and find internships or entry-level positions',
      color: '#4CAF50'
    },
    {
      value: UserRole.PROFESSIONAL,
      title: 'Job Seeker',
      icon: <Person sx={{ fontSize: 32, color: '#2196F3' }} />,
      description: 'Find jobs matching your skills and experience, prepare for interviews',
      color: '#2196F3'
    },
    {
      value: UserRole.EMPLOYER,
      title: 'Employer',
      icon: <Business sx={{ fontSize: 32, color: '#FF9800' }} />,
      description: 'Post jobs, find qualified candidates, and manage your recruitment process',
      color: '#FF9800'
    }
  ];

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setError('');
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      setError('Please select a role to continue');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onRoleSelect(selectedRole, userData);
    } catch (error: any) {
      console.error('Role selection error:', error);
      setError(error.message || 'Failed to complete registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading || submitting ? undefined : onClose}
      TransitionComponent={Transition}
      maxWidth="md"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)',
          minHeight: isMobile ? '100vh' : 'auto'
        }
      }}
    >
      <DialogTitle sx={{ 
        textAlign: 'center', 
        pb: 1,
        background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
        color: 'white'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
          <Google sx={{ color: '#fff' }} />
          <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
            Complete Your Registration
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          Choose your role to personalize your ExJobNet experience
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3, minHeight: 300 }}>
        {userData && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            mb: 3, 
            p: 2,
            background: 'rgba(76, 175, 80, 0.1)',
            borderRadius: 2,
            border: '1px solid rgba(76, 175, 80, 0.2)'
          }}>
            <Avatar 
              src={userData.profilePicture} 
              sx={{ width: 48, height: 48 }}
            >
              {userData.firstName?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Welcome, {userData.firstName} {userData.lastName}!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userData.email}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <CheckCircle sx={{ color: '#4CAF50' }} />
            </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, color: '#2E7D32' }}>
          Select Your Role
        </Typography>

        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 2
        }}>
          {roleOptions.map((role) => (
            <Card
              key={role.value}
              sx={{
                border: selectedRole === role.value ? `2px solid ${role.color}` : '1px solid #e0e0e0',
                backgroundColor: selectedRole === role.value ? `${role.color}10` : 'white',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                }
              }}
            >
              <CardActionArea 
                onClick={() => handleRoleSelect(role.value)}
                disabled={loading || submitting}
                sx={{ p: 0 }}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ mb: 2 }}>
                    {role.icon}
                  </Box>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 600, 
                    mb: 1,
                    color: selectedRole === role.value ? role.color : 'inherit'
                  }}>
                    {role.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                    {role.description}
                  </Typography>
                  {selectedRole === role.value && (
                    <Box sx={{ mt: 2 }}>
                      <CheckCircle sx={{ color: role.color }} />
                    </Box>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 1,
        background: 'rgba(250, 250, 250, 0.5)',
        borderTop: '1px solid #e0e0e0'
      }}>
        <Button 
          onClick={onClose}
          disabled={loading || submitting}
          sx={{ color: 'text.secondary' }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!selectedRole || loading || submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
          sx={{
            background: 'linear-gradient(45deg, #2E7D32 30%, #4CAF50 90%)',
            px: 4,
            py: 1,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              background: 'linear-gradient(45deg, #1B5E20 30%, #388E3C 90%)'
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.12)'
            }
          }}
        >
          {submitting ? 'Setting up your account...' : 'Continue with ExJobNet'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GoogleRoleSelectionModal;
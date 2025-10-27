import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Box, 
  Typography, 
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import {
  Launch,
  Computer,
  Smartphone,
  Warning,
  CheckCircle,
  Schedule,
  ArrowForward
} from '@mui/icons-material';

interface InterviewLauncherProps {
  open: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
  questionCount: number;
  duration: number;
  loading?: boolean;
}

const InterviewLauncher: React.FC<InterviewLauncherProps> = ({
  open,
  onClose,
  sessionId,
  sessionTitle,
  questionCount,
  duration,
  loading = false
}) => {
  
  const isDesktop = window.innerWidth >= 1024;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} minutes`;
  };

  const handleLaunchInNewTab = () => {
    const interviewUrl = `/interview/${sessionId}`;
    // Open in new tab without window constraints for full layout
    window.open(interviewUrl, '_blank');
    onClose();
  };

  const handleLaunchDesktop = () => {
    // Launch in new tab instead of popup window for full layout experience
    const interviewUrl = `/interview/${sessionId}`;
    window.open(interviewUrl, '_blank');
    onClose();
  };

  const getDeviceAdvice = () => {
    if (isDesktop) {
      return {
        icon: <Computer sx={{ fontSize: 40, color: '#4caf50' }} />,
        title: 'Perfect Device',
        description: 'Your desktop setup is ideal for this interview.',
        color: '#4caf50'
      };
    } else if (isTablet) {
      return {
        icon: <Warning sx={{ fontSize: 40, color: '#ff9800' }} />,
        title: 'Suboptimal Device',
        description: 'This interview works better on desktop. You may experience limited features.',
        color: '#ff9800'
      };
    } else {
      return {
        icon: <Smartphone sx={{ fontSize: 40, color: '#f44336' }} />,
        title: 'Not Recommended',
        description: 'This interview requires a desktop or laptop for the best experience.',
        color: '#f44336'
      };
    }
  };

  const deviceInfo = getDeviceAdvice();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          🎯 Launch Interview
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 500 }}>
          {sessionTitle}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: 4 }}>
        {/* Interview Details */}
        <Paper sx={{ p: 3, mb: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2 }}>
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
            <Chip
              icon={<Schedule />}
              label={`${formatDuration(duration)}`}
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            <Chip
              icon={<CheckCircle />}
              label={`${questionCount} Questions`}
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          </Stack>
          
          <Typography variant="h6" sx={{ textAlign: 'center', mb: 2 }}>
            Interview Overview
          </Typography>
          <Typography variant="body1" sx={{ textAlign: 'center', opacity: 0.9 }}>
            You'll be asked {questionCount} questions about your experience and competencies. 
            The interview will take approximately {formatDuration(duration)} to complete.
          </Typography>
        </Paper>

        {/* Device Compatibility */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            {deviceInfo.icon}
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: deviceInfo.color }}>
            {deviceInfo.title}
          </Typography>
          <Typography variant={`body1`} sx={{ mb: 2, opacity: 0.9 }}>
            {deviceInfo.description}
          </Typography>
          
          {!isDesktop && (
            <Alert 
              severity={isTablet ? "warning" : "error"} 
              sx={{ 
                mb: 3, 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                color: 'white',
                border: 'none'
              }}
            >
              <Typography variant="body2">
                For the best interview experience, we recommend using a desktop computer or laptop with:
              </Typography>
              <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                <li>Screen width of 1024px or larger</li>
                <li>Good microphone access</li>
                <li>Stable internet connection</li>
                <li>Chrome, Firefox, or Edge browser</li>
              </ul>
            </Alert>
          )}
        </Box>

        {/* Launch Options */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            Choose Launch Method:
          </Typography>
          
          <Stack spacing={2} direction="row" justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              onClick={isDesktop ? handleLaunchDesktop : handleLaunchInNewTab}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Launch />}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { 
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)'
                },
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                transition: 'all 0.3s ease',
                borderRadius: 2
              }}
            >
              {loading ? 'Preparing...' : 'Launch Interview'}
            </Button>
            
            {!isDesktop && (
              <Button
                variant="outlined"
                size="large"
                onClick={handleLaunchInNewTab}
                disabled={loading}
                sx={{
                  borderColor: 'rgba(255,255,255,0.5)',
                  color: 'white',
                  '&:hover': { 
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: 'white'
                  },
                  px: 3,
                  py: 1.5,
                  borderRadius: 2
                }}
              >
                Try Anyway
              </Button>
            )}
          </Stack>
        </Box>

        {/* Desktop Experience Preview */}
        {isDesktop && (
          <Paper sx={{ p: 3, mt: 4, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Computer sx={{ fontSize: 24 }} />
              Desktop Experience Features
            </Typography>
            <Stack spacing={1} sx={{ opacity: 0.9 }}>
              <Typography variant="body2">✓ Full-screen immersive interface</Typography>
              <Typography variant="body2">✓ Professional interview layout</Typography>
              <Typography variant="body2">✓ High-quality audio recording</Typography>
              <Typography variant="body2">✓ Real-time transcript display</Typography>
              <Typography variant="body2">✓ Advanced progress tracking</Typography>
            </Stack>
          </Paper>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { 
              color: 'white',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InterviewLauncher;

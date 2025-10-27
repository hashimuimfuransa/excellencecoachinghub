import React, { useState, useEffect } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Button,
  Box,
  Typography,
  Stack,
  Chip,
  Avatar,
  Slide,
  SlideProps
} from '@mui/material';
import {
  CheckCircle,
  Notifications,
  PlayArrow,
  Schedule
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { SafeSlideDown } from '../utils/transitionFix';

interface ApprovalNotificationProps {
  open: boolean;
  onClose: () => void;
  onStartAssessment?: () => void;
  assessmentLevel?: {
    name: string;
    difficulty: string;
    attemptsRemaining: number;
  };
  autoHideDuration?: number;
}

const SlideTransition = SafeSlideDown;

const ApprovalNotification: React.FC<ApprovalNotificationProps> = ({
  open,
  onClose,
  onStartAssessment,
  assessmentLevel,
  autoHideDuration = 8000
}) => {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (open) {
      // Show animation details after a brief delay
      const timer = setTimeout(() => setShowDetails(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShowDetails(false);
    }
  }, [open]);

  const handleStartNow = () => {
    onClose();
    if (onStartAssessment) {
      onStartAssessment();
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      TransitionComponent={SlideTransition}
      sx={{ mt: 2 }}
    >
      <Alert
        onClose={onClose}
        severity="success"
        variant="filled"
        sx={{
          minWidth: 400,
          maxWidth: 500,
          background: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
          boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          '& .MuiAlert-icon': {
            fontSize: '2rem'
          }
        }}
        icon={
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <CheckCircle />
          </motion.div>
        }
      >
        <Box>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <AlertTitle sx={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>
              🎉 Assessment Approved!
            </AlertTitle>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.95)', mb: 2 }}>
              Your payment has been approved and your custom assessment is ready!
            </Typography>
          </motion.div>

          <AnimatePresence>
            {showDetails && assessmentLevel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ 
                  bgcolor: 'rgba(255, 255, 255, 0.15)', 
                  borderRadius: 2, 
                  p: 2, 
                  mb: 2,
                  backdropFilter: 'blur(10px)'
                }}>
                  <Stack direction="row" alignItems="center" spacing={2} mb={1}>
                    <Avatar sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.2)', 
                      color: 'white',
                      width: 32,
                      height: 32
                    }}>
                      <Notifications sx={{ fontSize: 18 }} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" sx={{ color: 'white' }}>
                        {assessmentLevel.name}
                      </Typography>
                      <Stack direction="row" spacing={1} mt={0.5}>
                        <Chip 
                          label={assessmentLevel.difficulty}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '0.75rem',
                            height: 24
                          }}
                        />
                        <Chip 
                          label={`${assessmentLevel.attemptsRemaining} attempts left`}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontSize: '0.75rem',
                            height: 24
                          }}
                        />
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                size="small"
                onClick={onClose}
                sx={{ 
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    bgcolor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Later
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<PlayArrow />}
                onClick={handleStartNow}
                sx={{ 
                  bgcolor: 'white',
                  color: '#4CAF50',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.9)'
                  }
                }}
              >
                Start Now
              </Button>
            </Stack>
          </motion.div>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default ApprovalNotification;
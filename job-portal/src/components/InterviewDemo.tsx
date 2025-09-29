import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import {
  Computer,
  Smartphone,
  Launch,
  Mic,
  Timer,
  Assessment,
  Star,
  CheckCircle
} from '@mui/icons-material';
import InterviewLauncher from './InterviewLauncher';

const InterviewDemo: React.FC = () => {
  const [launcherOpen, setLauncherOpen] = useState(false);

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4, textAlign: 'center' }}>
        🎯 New Desktop-Focused Interview Interface
      </Typography>

      <Stack spacing={3}>
        {/* Features Overview */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            ✨ Key Features
          </Typography>
          <Stack spacing={2} direction="row" flexWrap="wrap">
            <Chip icon={<Computer />} label="Desktop Optimized" color="primary" />
            <Chip icon={<Mic />} label="Voice & Text Input" color="success" />
            <Chip icon={<Timer />} label="Live Timer" color="warning" />
            <Chip icon={<Assessment />} label="Progress Tracking" color="info" />
            <Chip icon={<Star />} label="Professional UI" color="secondary" />
            <Chip icon={<CheckCircle />} label="Real-time Feedback" color="default" />
          </Stack>
        </Card>

        {/* Device Compatibility */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            📱 Device Compatibility
          </Typography>
          <Stack spacing={2}>
            <Paper sx={{ p: 2, backgroundColor: '#e8f5e8', borderLeft: '4px solid #4caf50' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Computer sx={{ color: '#4caf50' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Desktop & Laptop (Recommended)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Full-screen immersive experience with professional layout
                  </Typography>
                </Box>
              </Stack>
            </Paper>
            
            <Paper sx={{ p: 2, backgroundColor: '#fff3e0', borderLeft: '4px solid #ff9800' }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Smartphone sx={{ color: '#ff9800' }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Mobile Devices
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Warning shown - recommends using desktop for best experience
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </Card>

        {/* Launch Demonstration */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            🚀 Try It Out
          </Typography>
          <Stack spacing={2}>
            <Alert severity="info">
              Click the button below to see the desktop-focused interview launcher in action. 
              It will detect your device and show appropriate warnings.
            </Alert>
            <Button
              variant="contained"
              size="large"
              onClick={() => setLauncherOpen(true)}
              startIcon={<Launch />}
              sx={{
                backgroundColor: '#4caf50',
                '&:hover': { backgroundColor: '#388e3c' },
                py: 1.5,
                px: 4
              }}
            >
              Launch Interview Demo
            </Button>
          </Stack>
        </Card>

        {/* Benefits */}
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
            🎯 Benefits for Candidates
          </Typography>
          <Stack spacing={2}>
            <Typography variant="body1">
              • <strong>Professional Experience:</strong> Full-screen layout mimics real interview environments
            </Typography>
            <Typography variant="body1">
              • <strong>Better Focus:</strong> Opens in new tab to eliminate distractions
            </Typography>
            <Typography variant="body1">
              • <strong>Enhanced Interface:</strong> Modern design with clear visual hierarchy
            </Typography>
            <Typography variant="body1">
              • <strong>Optimal Recording:</strong> Desktop microphone setup for better audio quality
            </Typography>
            <Typography variant="body1">
              • <strong>Progress Visibility:</strong> Real-time feedback on completion and performance
            </Typography>
          </Stack>
        </Card>
      </Stack>

      {/* Dialog */}
      <InterviewLauncher
        open={launcherOpen}
        onClose={() => setLauncherOpen(false)}
        sessionId="demo-session-123"
        sessionTitle="Demo AI Interview"
        questionCount={5}
        duration={900}
        loading={false}
      />
    </Box>
  );
};

export default InterviewDemo;

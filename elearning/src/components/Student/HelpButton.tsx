import React, { useState } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Card,
  CardContent,
  IconButton,
  useTheme,
  alpha
} from '@mui/material';
import {
  Help,
  Close,
  School,
  PlayArrow,
  Search,
  Psychology,
  Support
} from '@mui/icons-material';

const HelpButton: React.FC = () => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const helpTopics = [
    {
      icon: <School sx={{ color: 'primary.main' }} />,
      title: "How to enroll in a course?",
      description: "Click on 'Discover Courses' tab, find a course you like, and click 'Enroll Now' button."
    },
    {
      icon: <PlayArrow sx={{ color: 'success.main' }} />,
      title: "How to start learning?",
      description: "Go to 'My Learning' tab and click 'Continue Learning' or 'Start Course' on any enrolled course."
    },
    {
      icon: <Search sx={{ color: 'info.main' }} />,
      title: "How to find specific courses?",
      description: "Use the search bar in 'Discover Courses' to type what you want to learn, or filter by category."
    },
    {
      icon: <Psychology sx={{ color: 'secondary.main' }} />,
      title: "Need help while learning?",
      description: "Use the AI Assistant feature or contact your instructor through the course page."
    }
  ];

  return (
    <>
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: { xs: 100, sm: 100, md: 24 }, // Positioned above mobile bottom nav (60px + padding)
          right: { xs: 96, sm: 96, md: 96 }, // Positioned to the left of AI Assistant (64px + 8px spacing)
          zIndex: 1200, // Higher z-index to ensure it's above bottom nav
          boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.3)}`,
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.4)}`,
          },
          transition: 'all 0.3s ease',
        }}
        onClick={() => setOpen(true)}
      >
        <Help />
      </Fab>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.secondary.main, 0.02)})`,
          }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={1}>
              <Support sx={{ color: 'primary.main' }} />
              <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                🤝 Need Help?
              </Typography>
            </Stack>
            <IconButton onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Here are answers to common questions to help you get started!
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2}>
            {helpTopics.map((topic, index) => (
              <Card 
                key={index} 
                sx={{ 
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    boxShadow: 2,
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ mt: 0.5 }}>
                      {topic.icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {topic.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {topic.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'info.main', textAlign: 'center' }}>
              💬 Still need help? Contact our support team or use the AI Assistant!
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={() => setOpen(false)} 
            variant="contained"
            fullWidth
            sx={{ borderRadius: 2 }}
          >
            Got it, thanks! 👍
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default HelpButton;
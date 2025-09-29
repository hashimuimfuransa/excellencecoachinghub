import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import {
  Box,
  CircularProgress,
  Typography,
  Alert,
  Paper,
  Container
} from '@mui/material';
import { 
  Computer,
  PhoneAndroid 
} from '@mui/icons-material';
import DesktopInterviewInterface from '../components/DesktopInterviewInterface';
import { QuickInterviewSession, quickInterviewService } from '../services/quickInterviewService';
import { useAuth } from '../contexts/AuthContext';

const StandaloneInterviewPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user } = useAuth();
  const [session, setSession] = useState<QuickInterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check device compatibility
  const isDesktop = window.innerWidth >= 1024;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        const interviewSession = await quickInterviewService.getSession(sessionId);
        
        if (!interviewSession) {
          setError('Interview session not found');
          return;
        }

        setSession(interviewSession);
      } catch (err) {
        console.error('Failed to load interview session:', err);
        setError('Failed to load interview session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId]);

  const handleInterviewComplete = (result: any) => {
    console.log('Interview completed:', result);
    // Close the window or redirect
    if (window.opener) {
      // This is opened in a popup/new tab
      window.close();
    } else {
      // This might be accessed directly, redirect to results
      window.location.href = `/interviews/results/${sessionId}`;
    }
  };

  const handleClose = () => {
    if (window.opener) {
      window.close();
    } else {
      window.location.href = '/interviews';
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0a0a0a',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%)',
          color: 'white'
        }}
      >
        <CircularProgress size={80} sx={{ color: '#4caf50', mb: 4 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
          Loading Interview...
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.7 }}>
          Preparing your interview environment
        </Typography>
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%)',
          color: 'white'
        }}
      >
        <Container maxWidth="sm">
          <Paper
            sx={{
              p: 4,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 3,
              textAlign: 'center'
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#f44336' }}>
              ❌ Interview Error
            </Typography>
            <Typography variant="body1" sx={{ mb: 4 }}>
              {error}
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Please try refreshing the page or contact support if the issue persists.
            </Alert>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}  
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/interviews'}
                style={{
                  backgroundColor: '#757575',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                Return to Interviews
              </button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Show device compatibility warning for non-desktop
  if (!isDesktop && !isTablet) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.15) 0%, transparent 50%)',
          color: 'white'
        }}
      >
        <Container maxWidth="md">
          <Paper
            sx={{
              p: 6,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 4,
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)'
            }}
          >
            <Box sx={{ mb: 4 }}>
              <PhoneAndroid sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
              <Computer sx={{ fontSize: 60, color: '#757575', position: 'relative', top: -20 }} />
            </Box>
            
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 3, color: '#1976d2' }}>
              Desktop Required
            </Typography>
            
            <Typography variant="h5" sx={{ mb: 4, color: '#37474f' }}>
              This interview interface is designed for desktop computers and laptops
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 4, textAlign: 'left' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Why desktop is recommended:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li><Typography variant="body2">Better visual layout for interview questions</Typography></li>
                <li><Typography variant="body2">More comfortable typing and recording setup</Typography></li>
                <li><Typography variant="body2">Professional interview environment</Typography></li>
                <li><Typography variant="body2">Full-screen experience without distractions</Typography></li>
                <li><Typography variant="body2">Better microphone and audio quality</Typography></li>
              </ul>
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 4, color: '#616161' }}>
              Please access this interview from a desktop computer or laptop for the best experience.
              You can still access your interview history and results from any device.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.href = '/interviews'}
                style={{
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '15px 30px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  boxShadow: '0 3px 5px 2px rgba(25, 118, 210, .3)'
                }}
              >
                Return to Interviews
              </button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // Render desktop interview interface
  if (session) {
    return (
      <DesktopInterviewInterface
        open={true}
        onClose={handleClose}
        session={session}
        onComplete={handleInterviewComplete}
      />
    );
  }

  // Fallback
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}
    >
      <Typography variant="h5">Something went wrong. Please try again.</Typography>
    </Box>
  );
};

export default StandaloneInterviewPage;

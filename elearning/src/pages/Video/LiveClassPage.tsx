import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Breadcrumbs,
  Link
} from '@mui/material';
import { ArrowBack, Home, VideoCall } from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import LiveClass from '../../components/Video/LiveClass';

const LiveClassPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState<ILiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inRoom, setInRoom] = useState(false);

  // Get user role from URL params or user data
  const userRole = (searchParams.get('role') as 'student' | 'teacher' | 'admin' | 'professional') || 
                   (user?.role as 'student' | 'teacher' | 'admin' | 'professional') || 
                   'student';

  // Fetch session details
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError('Session ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch session details based on user role
        let sessionData: ILiveSession;
        
        if (userRole === 'teacher') {
          sessionData = await liveSessionService.getSessionById(sessionId);
        } else if (userRole === 'student') {
          // For students, we might need to use a different endpoint
          sessionData = await liveSessionService.getSessionById(sessionId);
        } else {
          // Admin can access any session
          sessionData = await liveSessionService.getSessionById(sessionId);
        }

        setSession(sessionData);

        // Auto-join if session is live
        if (sessionData.status === 'live') {
          setInRoom(true);
        }

      } catch (err) {
        console.error('Error fetching session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, userRole]);

  // Handle joining the room
  const handleJoinRoom = () => {
    setInRoom(true);
  };

  // Handle leaving the room
  const handleLeaveRoom = () => {
    setInRoom(false);
    // Navigate back to appropriate dashboard
    if (userRole === 'teacher') {
      navigate('/dashboard/teacher/live-sessions');
    } else if (userRole === 'admin') {
      navigate('/dashboard/admin');
    } else {
      // Both student and professional use student dashboard
      navigate('/dashboard/student/live-sessions');
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (userRole === 'teacher') {
      navigate('/dashboard/teacher/live-sessions');
    } else if (userRole === 'admin') {
      navigate('/dashboard/admin');
    } else {
      // Both student and professional use student dashboard
      navigate('/dashboard/student/live-sessions');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading session...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error || !session) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="h6">Failed to load session</Typography>
          <Typography>{error || 'Session not found'}</Typography>
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBack}
          variant="contained"
        >
          Go Back
        </Button>
      </Container>
    );
  }

  // If user is in the room, show the video component
  if (inRoom) {
    return (
      <LiveClass
        sessionId={sessionId}
        userRole={userRole}
        onLeave={handleLeaveRoom}
      />
    );
  }

  // Show session details and join button
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body1"
          onClick={() => navigate('/dashboard')}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <Home sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link
          component="button"
          variant="body1"
          onClick={handleBack}
        >
          Live Sessions
        </Link>
        <Typography color="text.primary">
          {session.title}
        </Typography>
      </Breadcrumbs>

      {/* Back button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={handleBack}
        sx={{ mb: 3 }}
      >
        Back to Sessions
      </Button>

      {/* Session details */}
      <Paper sx={{ p: 4, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <VideoCall sx={{ mr: 2, fontSize: 32 }} color="primary" />
          <Typography variant="h4" component="h1">
            {session.title}
          </Typography>
        </Box>

        {session.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {session.description}
          </Typography>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Session Details
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Scheduled Time:</strong> {new Date(session.scheduledTime).toLocaleString()}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Duration:</strong> {session.duration} minutes
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Status:</strong> {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </Typography>
          {session.maxParticipants && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Max Participants:</strong> {session.maxParticipants}
            </Typography>
          )}
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Recording:</strong> {session.isRecorded ? 'Enabled' : 'Disabled'}
          </Typography>
        </Box>

        {/* Session status and actions */}
        {session.status === 'scheduled' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This session is scheduled to start at {new Date(session.scheduledTime).toLocaleString()}.
              {userRole === 'teacher' && ' You can start the session early if needed.'}
            </Typography>
          </Alert>
        )}

        {session.status === 'live' && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This session is currently live! Click the button below to join.
            </Typography>
          </Alert>
        )}

        {session.status === 'ended' && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This session has ended.
              {session.recordingUrl && ' You can watch the recording if available.'}
            </Typography>
          </Alert>
        )}

        {session.status === 'cancelled' && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This session has been cancelled.
            </Typography>
          </Alert>
        )}

        {/* Action buttons */}
        <Box display="flex" gap={2}>
          {session.status === 'live' && (
            <Button
              variant="contained"
              size="large"
              startIcon={<VideoCall />}
              onClick={handleJoinRoom}
              color="error"
              sx={{ fontWeight: 'bold' }}
            >
              Join Live Session
            </Button>
          )}

          {session.status === 'scheduled' && userRole === 'teacher' && (
            <Button
              variant="contained"
              size="large"
              startIcon={<VideoCall />}
              onClick={handleJoinRoom}
              color="primary"
              sx={{ fontWeight: 'bold' }}
            >
              Start Session
            </Button>
          )}

          {session.status === 'scheduled' && userRole !== 'teacher' && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<VideoCall />}
              disabled
            >
              Session Not Started
            </Button>
          )}

          {session.status === 'ended' && session.recordingUrl && (
            <Button
              variant="contained"
              size="large"
              startIcon={<VideoCall />}
              onClick={() => window.open(session.recordingUrl, '_blank')}
              color="primary"
            >
              Watch Recording
            </Button>
          )}

          {userRole === 'admin' && session.status !== 'ended' && session.status !== 'cancelled' && (
            <Button
              variant="outlined"
              size="large"
              startIcon={<VideoCall />}
              onClick={handleJoinRoom}
              color="secondary"
            >
              Monitor Session
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default LiveClassPage;

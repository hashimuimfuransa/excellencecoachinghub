import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Container,
  CircularProgress
} from '@mui/material';
import {
  VideoCall,
  ArrowBack
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';

import LiveClass from '../../components/Video/LiveClass';



const LiveSessionRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [session, setSession] = useState<ILiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inVideoRoom, setInVideoRoom] = useState(false);

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        setError(null);

        const sessionData = await liveSessionService.getTeacherSessionById(id);
        setSession(sessionData);

        // Auto-join video room if session is live
        if (sessionData.status === 'live') {
          setInVideoRoom(true);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [id, user]);

  // Handle joining video room
  const handleJoinVideoRoom = () => {
    setInVideoRoom(true);
  };

  // Handle leaving video room
  const handleLeaveVideoRoom = () => {
    setInVideoRoom(false);
    navigate('/dashboard/teacher/live-sessions');
  };











  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading session...
        </Typography>
      </Box>
    );
  }

  if (error || !session) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || 'Session not found'}
        </Alert>
        <Button onClick={() => navigate('/dashboard/teacher/live-sessions')}>
          Back to Sessions
        </Button>
      </Box>
    );
  }

  // If in video room, show the 100ms LiveClass component
  if (inVideoRoom) {
    return (
      <LiveClass
        sessionId={id}
        userRole="teacher"
        onLeave={handleLeaveVideoRoom}
      />
    );
  }

  // Show session details and join button
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard/teacher/live-sessions')}
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
              You can start the session early if needed.
            </Typography>
          </Alert>
        )}

        {session.status === 'live' && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              This session is currently live! Click the button below to join the video room.
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

        {/* Action buttons */}
        <Box display="flex" gap={2}>
          {(session.status === 'live' || session.status === 'scheduled') && (
            <Button
              variant="contained"
              size="large"
              startIcon={<VideoCall />}
              onClick={handleJoinVideoRoom}
              color="primary"
              sx={{ fontWeight: 'bold' }}
            >
              {session.status === 'live' ? 'Join Live Session' : 'Start Session'}
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
        </Box>
      </Paper>
    </Container>
  );
};

export default LiveSessionRoom;
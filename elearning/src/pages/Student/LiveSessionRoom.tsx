import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Alert,
  Container,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  VideoCall,
  ArrowBack,
  PlayArrow,
  OndemandVideo,
  Event,
  LiveTv
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';

import LiveClass from '../../components/Video/LiveClass';
import VideoSessionWrapper from '../../components/Video/VideoSessionWrapper';

const normalizeYoutubeUrls = (url: string) => {
  if (!url) {
    return { embed: '', watch: '' };
  }
  const trimmed = url.trim();
  const idMatch = trimmed.match(/(?:embed\/|watch\?v=|youtu\.be\/)([\w-]{11})/i);
  const id = idMatch ? idMatch[1] : '';
  if (id) {
    return {
      embed: `https://www.youtube.com/embed/${id}`,
      watch: `https://www.youtube.com/watch?v=${id}`,
    };
  }
  return { embed: trimmed, watch: trimmed };
};

const getYoutubeUrlsFromSession = (session?: ILiveSession | null) => {
  if (!session) {
    return { embed: '', watch: '' };
  }
  const sources = [session.youtubeEmbedUrl, session.meetingUrl];
  for (const source of sources) {
    if (!source) continue;
    const normalized = normalizeYoutubeUrls(source);
    const { embed, watch } = normalized;
    if ((watch && watch.includes('youtu')) || (embed && embed.includes('youtu'))) {
      return normalized;
    }
  }
  return { embed: '', watch: '' };
};

const StudentLiveSessionRoom: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const focusTarget = (location.state as { focus?: 'youtube' } | null)?.focus;
  const youtubeContainerRef = useRef<HTMLDivElement | null>(null);
  const hasAutoFocusedYoutube = useRef(false);

  // State management
  const [session, setSession] = useState<ILiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inVideoRoom, setInVideoRoom] = useState(false);

  const { embed: youtubeEmbedUrl, watch: youtubeWatchUrl } = getYoutubeUrlsFromSession(session);
  const isYoutubeStream = session?.streamProvider === 'youtube' || !!youtubeEmbedUrl || !!youtubeWatchUrl;

  useEffect(() => {
    if (!isYoutubeStream || hasAutoFocusedYoutube.current) {
      return;
    }
    if (focusTarget === 'youtube' || session?.status === 'live') {
      hasAutoFocusedYoutube.current = true;
      youtubeContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusTarget, isYoutubeStream, session?.status]);

  // Load session data
  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId || !user) return;

      try {
        setLoading(true);
        setError(null);

        const sessionData = await liveSessionService.joinSessionAsStudent(sessionId);
        setSession(sessionData);
        hasAutoFocusedYoutube.current = false;

        const youtubeUrls = getYoutubeUrlsFromSession(sessionData);
        const isYoutube = sessionData.streamProvider === 'youtube' || !!youtubeUrls.embed || !!youtubeUrls.watch;
        if (sessionData.status === 'live' && !isYoutube) {
          setInVideoRoom(true);
        } else {
          setInVideoRoom(false);
        }

      } catch (err: any) {
        setError(err.message || 'Failed to load session');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, user]);

  // Handle joining video room
  const handleJoinVideoRoom = () => {
    if (isYoutubeStream) {
      youtubeContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setInVideoRoom(true);
  };

  // Handle leaving video room
  const handleLeaveVideoRoom = () => {
    setInVideoRoom(false);
    navigate('/dashboard/student/live-sessions');
  };

  // Helpers to build Google Calendar URL for this session
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const toCalendarDateTime = (d: Date) => {
    const yyyy = d.getUTCFullYear();
    const MM = pad(d.getUTCMonth() + 1);
    const dd = pad(d.getUTCDate());
    const hh = pad(d.getUTCHours());
    const mm = pad(d.getUTCMinutes());
    const ss = pad(d.getUTCSeconds());
    return `${yyyy}${MM}${dd}T${hh}${mm}${ss}Z`;
  };

  const buildGoogleCalendarUrl = (s: ILiveSession) => {
    const start = new Date(s.scheduledTime);
    const durationMinutes = (s as any).duration ? Number((s as any).duration) : 60;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const text = encodeURIComponent(s.title || 'Live Session');
    const details = encodeURIComponent(`Join your course live session.${s.description ? `\n\nDetails: ${s.description}` : ''}`);
    const location = encodeURIComponent('Online');
    const dates = `${toCalendarDateTime(start)}/${toCalendarDateTime(end)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`;
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
        <Button onClick={() => navigate('/dashboard/student/live-sessions')}>
          Back to Sessions
        </Button>
      </Box>
    );
  }

  // If in video room, show the 100ms LiveClass component
  if (inVideoRoom) {
    return (
      <VideoSessionWrapper>
        <LiveClass
          sessionId={sessionId}
          userRole="student"
          onLeave={handleLeaveVideoRoom}
        />
      </VideoSessionWrapper>
    );
  }

  // Show session details and join button
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/dashboard/student/live-sessions')}
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
            <strong>Instructor:</strong> {session.instructor.firstName} {session.instructor.lastName}
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
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Stream Type:</strong> {isYoutubeStream ? 'YouTube Livestream' : 'Interactive Video Room'}
          </Typography>
          {/* Add to Google Calendar */}
          {(session.status === 'scheduled') && (
            <Button 
              variant="outlined"
              startIcon={<Event />}
              onClick={() => window.open(buildGoogleCalendarUrl(session), '_blank', 'noopener,noreferrer')}
              sx={{ mt: 1 }}
            >
              Add to Google Calendar
            </Button>
          )}
        </Box>

        {/* Session status and actions */}
        {session.status === 'scheduled' && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {isYoutubeStream
                ? `This YouTube livestream starts at ${new Date(session.scheduledTime).toLocaleString()}.`
                : `This session is scheduled to start at ${new Date(session.scheduledTime).toLocaleString()}.`}
            </Typography>
          </Alert>
        )}

        {session.status === 'live' && (
          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {isYoutubeStream
                ? 'This session is streaming live on YouTube. Use the button below to watch the livestream.'
                : 'This session is currently live! Click the button below to join the video room.'}
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
              startIcon={isYoutubeStream ? <LiveTv /> : <VideoCall />}
              onClick={handleJoinVideoRoom}
              color="primary"
              sx={{ fontWeight: 'bold' }}
            >
              {isYoutubeStream ? 'Watch Livestream' : session.status === 'live' ? 'Join Live Session' : 'Start Session'}
            </Button>
          )}

          {session.status === 'ended' && session.recordingUrl && (
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrow />}
              onClick={() => window.open(session.recordingUrl, '_blank')}
              color="primary"
            >
              Watch Recording
            </Button>
          )}
        </Box>

        {isYoutubeStream && youtubeEmbedUrl && (
          <Box sx={{ mt: 4 }} ref={youtubeContainerRef}>
            <Typography variant="h6" gutterBottom>
              Livestream
            </Typography>
            <Box
              component="iframe"
              src={`${youtubeEmbedUrl}?rel=0`}
              sx={{
                width: '100%',
                border: 0,
                borderRadius: 2,
                minHeight: { xs: 220, sm: 340 },
                boxShadow: 3
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <Button
              variant="outlined"
              startIcon={<PlayArrow />}
              sx={{ mt: 2 }}
              onClick={() => window.open(youtubeWatchUrl || youtubeEmbedUrl, '_blank', 'noopener,noreferrer')}
            >
              Watch on YouTube
            </Button>
          </Box>
        )}

        {/* Enhanced Recording Section for Students */}
        {session.status === 'ended' && (
          <>
            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Session Recording
              </Typography>
              
              {session.recordingUrl ? (
                // Show available recording with details
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Recording is available to watch. You can replay this session anytime.
                    </Typography>
                  </Alert>
                  
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <OndemandVideo sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {session.recordingTitle || `${session.title} - Recording`}
                        </Typography>
                        {session.recordingDescription && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {session.recordingDescription}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box display="flex" gap={2} flexWrap="wrap">
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={<PlayArrow />}
                        onClick={() => window.open(session.recordingUrl, '_blank')}
                        color="primary"
                      >
                        Watch Full Recording
                      </Button>
                      
                      <Button
                        variant="outlined"
                        startIcon={<OndemandVideo />}
                        onClick={() => window.open(session.recordingUrl, '_blank')}
                      >
                        Download Recording
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              ) : (
                // Show when no recording is available
                <Alert severity="info">
                  <Typography variant="body2">
                    The instructor has not uploaded a recording for this session yet.
                    {session.status === 'ended' && ' Check back later for the recorded content.'}
                  </Typography>
                </Alert>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default StudentLiveSessionRoom;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Fade,
  Slide,
  Container
} from '@mui/material';
import {
  VideoCall,
  Schedule,
  PlayArrow,
  OndemandVideo,
  NotificationsActive,
  AccessTime,
  Close,
  Event
} from '@mui/icons-material';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';

interface LiveSessionStatusProps {
  courseId: string;
  compact?: boolean;
  fullWidth?: boolean;
}

const LiveSessionStatus: React.FC<LiveSessionStatusProps> = ({ 
  courseId, 
  compact = false, 
  fullWidth = false 
}) => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<ILiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  useEffect(() => {
    const loadSessions = async () => {
      try {
        const response = await liveSessionService.getCourseSessions(courseId);
        const sessionsArray = Array.isArray(response) ? response : [];
        setSessions(sessionsArray);
      } catch (error) {
        console.error('Failed to load live sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      loadSessions();
    }
  }, [courseId]);

  // Ticking clock for countdown updates (every 1s)
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Find the most relevant session to show
  const getRelevantSession = () => {
    if (sessions.length === 0) return null;

    const now = new Date(nowTick);
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const preJoinMinutes = 5; // allow pre-join window if needed (still treated as upcoming)

    // Normalize sessions with time windows
    const normalized = sessions.map((s) => {
      const start = new Date(s.scheduledTime);
      const durationMinutes = (s as any).duration ? Number((s as any).duration) : 60; // fallback
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      const inLiveWindow = now >= start && now <= end;
      const inPreJoinWindow = now >= new Date(start.getTime() - preJoinMinutes * 60 * 1000) && now < start;
      return { raw: s, start, end, inLiveWindow, inPreJoinWindow };
    });

    // Priority 1: Truly live by time window only
    const liveByTime = normalized.find(n => n.inLiveWindow);
    if (liveByTime) {
      return { session: liveByTime.raw, type: 'live' as const, start: liveByTime.start };
    }

    // Priority 2: Upcoming within 2 days (including pre-join window)
    const upcoming = normalized
      .filter(n => n.start > now && n.start <= twoDaysFromNow)
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0];

    if (upcoming) {
      return { session: upcoming.raw, type: 'upcoming' as const, start: upcoming.start };
    }

    // Priority 3: Recent ended within 1 day
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recent = normalized
      .filter(n => n.end < now && n.end >= oneDayAgo)
      .sort((a, b) => b.end.getTime() - a.end.getTime())[0];

    if (recent) {
      return { session: recent.raw, type: 'recent' as const, start: recent.start };
    }

    return null;
  };

  const relevantSession = getRelevantSession();

  if (loading || !relevantSession || dismissed) {
    return null;
  }

  const { session, type } = relevantSession;
  const sessionTime = new Date(session.scheduledTime);

  const getCountdown = () => {
    const target = sessionTime.getTime();
    const diff = Math.max(0, target - nowTick);
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  };

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const toCalendarDateTime = (d: Date) => {
    // Google expects UTC in YYYYMMDDTHHMMSSZ
    const yyyy = d.getUTCFullYear();
    const MM = pad(d.getUTCMonth() + 1);
    const dd = pad(d.getUTCDate());
    const hh = pad(d.getUTCHours());
    const mm = pad(d.getUTCMinutes());
    const ss = pad(d.getUTCSeconds());
    return `${yyyy}${MM}${dd}T${hh}${mm}${ss}Z`;
  };

  const buildGoogleCalendarUrl = () => {
    const start = new Date(session.scheduledTime);
    const durationMinutes = (session as any).duration ? Number((session as any).duration) : 60;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

    const text = encodeURIComponent(session.title || 'Live Session');
    const details = encodeURIComponent(`Join your course live session.\n\nCourse: ${courseId}${session.description ? `\n\nDetails: ${session.description}` : ''}`);
    const location = encodeURIComponent('Online');
    const dates = `${toCalendarDateTime(start)}/${toCalendarDateTime(end)}`;

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`;
  };

  // Provide display metadata for each state (live/upcoming/recent)
  const getStatusInfo = () => {
    switch (type) {
      case 'live':
        return {
          severity: 'success' as const,
          icon: <VideoCall />,
          title: 'Live Session in Progress',
          message: `${session.title} is happening now!`,
          actionText: 'Join Now',
          actionIcon: <PlayArrow />,
          color: 'success',
          bg: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)'
        };
      case 'upcoming':
        const c = getCountdown();
        const timeText = c.days > 0
          ? `${c.days}d ${c.hours}h`
          : c.hours > 0
            ? `${c.hours}h ${c.minutes}m`
            : `${c.minutes}m ${c.seconds}s`;
        return {
          severity: 'info' as const,
          icon: <Schedule />,
          title: 'Upcoming Live Session',
          message: `${session.title} starts in ${timeText}`,
          actionText: 'View Details',
          actionIcon: <NotificationsActive />,
          color: 'info',
          bg: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)'
        };
      case 'recent':
        return {
          severity: 'warning' as const,
          icon: <OndemandVideo />,
          title: 'Session Recording Available',
          message: `${session.title} recording is now available`,
          actionText: 'View Recording',
          actionIcon: <PlayArrow />,
          color: 'warning',
          bg: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();
  if (!statusInfo) return null;

  const handleAction = () => {
    switch (type) {
      case 'live':
        navigate(`/dashboard/student/live-sessions/${session._id}/room`);
        break;
      case 'upcoming':
        navigate(`/dashboard/student/live-sessions?courseId=${courseId}`);
        break;
      case 'recent':
        navigate('/dashboard/student/recorded-sessions');
        break;
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  if (compact) {
    return (
      <Fade in={!dismissed}>
        <Chip
          icon={statusInfo.icon}
          label={statusInfo.message}
          color={statusInfo.color}
          variant="filled"
          onClick={handleAction}
          onDelete={handleDismiss}
          deleteIcon={<Close />}
          sx={{ 
            mb: 1,
            '& .MuiChip-icon': { color: 'white' },
            '& .MuiChip-label': { color: 'white', fontWeight: 'bold' }
          }}
        />
      </Fade>
    );
  }

  const AlertComponent = (
    <Alert
      severity={statusInfo.severity}
      icon={statusInfo.icon}
      variant="filled"
      action={
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 0.5, sm: 1, md: 1.5 },
          flexWrap: 'wrap'
        }}>
          <Button
            color="inherit"
            size="small"
            startIcon={statusInfo.actionIcon}
            onClick={handleAction}
            variant="contained"
            sx={{ 
              fontWeight: 'bold',
              textTransform: 'none',
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '0.9rem' },
              px: { xs: 1, sm: 2, md: 3 },
              py: { xs: 0.5, sm: 1, md: 1.5 },
              minWidth: { xs: 'auto', sm: '120px', md: '140px' },
              borderRadius: { xs: 1, sm: 2 },
              bgcolor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)'
              }
            }}
          >
            {statusInfo.actionText}
          </Button>
          <Tooltip title="Dismiss">
            <IconButton
              size="small"
              onClick={handleDismiss}
              color="inherit"
              sx={{ p: { xs: 0.5, sm: 1, md: 1.5 } }}
            >
              <Close />
            </IconButton>
          </Tooltip>
        </Box>
      }
      sx={{
        mb: { xs: 1, sm: 2, md: 3 },
        mx: { xs: 1, sm: 2, md: 3 },
        borderRadius: { xs: 1, sm: 2 },
        backgroundImage: statusInfo.bg,
        color: '#fff',
        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        '& .MuiAlert-message': {
          width: '100%',
          pr: { xs: 1, sm: 2, md: 3 }
        },
        '& .MuiAlert-action': {
          alignItems: 'flex-start',
          pt: { xs: 0.5, sm: 1, md: 1.5 }
        },
        '& .MuiAlert-icon': {
          fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' },
          color: '#fff'
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        justifyContent: 'space-between', 
        width: '100%',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: { xs: 1, sm: 2, md: 3 }
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 'bold', 
              mb: 0.5,
              fontSize: { xs: '0.875rem', sm: '1rem', md: '1.1rem' }
            }}
          >
            {type === 'live' && (
              <Box sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: '#ff5252',
                boxShadow: '0 0 0 0 rgba(255,82,82,0.7)',
                animation: 'pulse 1.5s infinite',
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(255,82,82,0.7)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(255,82,82,0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(255,82,82,0)' }
                }
              }} />
            )}
            {statusInfo.title}
          </Typography>
          <Typography 
            variant="body2"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
              wordBreak: 'break-word'
            }}
          >
            {statusInfo.message}
          </Typography>

          {type === 'upcoming' && (() => {
            const c = getCountdown();
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label={`${c.days}d`}
                  color="default"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }}
                />
                <Chip 
                  label={`${c.hours}h`}
                  color="default"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }}
                />
                <Chip 
                  label={`${c.minutes}m`}
                  color="default"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }}
                />
                <Chip 
                  label={`${c.seconds}s`}
                  color="default"
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff' }}
                />
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {sessionTime.toLocaleDateString()} at {sessionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Button 
                  size="small"
                  variant="outlined"
                  startIcon={<Event />}
                  onClick={() => window.open(buildGoogleCalendarUrl(), '_blank', 'noopener,noreferrer')}
                  sx={{ 
                    ml: 1,
                    borderColor: 'rgba(255,255,255,0.6)',
                    color: '#fff',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    backdropFilter: 'blur(2px)',
                    '& .MuiButton-startIcon': { color: '#fff' },
                    '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Add to Google Calendar
                </Button>
              </Box>
            );
          })()}
        </Box>
      </Box>
    </Alert>
  );

  if (fullWidth) {
    return (
      <Slide direction="down" in={!dismissed} mountOnEnter unmountOnExit>
        <Box sx={{ width: '100%' }}>
          {AlertComponent}
        </Box>
      </Slide>
    );
  }

  return (
    <Slide direction="down" in={!dismissed} mountOnEnter unmountOnExit>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        {AlertComponent}
      </Container>
    </Slide>
  );
};

export default LiveSessionStatus;
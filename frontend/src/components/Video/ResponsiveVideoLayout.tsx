import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
  Fab,
  Collapse,
  Slide
} from '@mui/material';
import {
  Chat,
  People,
  Fullscreen,
  FullscreenExit,
  ExpandMore,
  ExpandLess,
  Close,
  MicOff,
  VideocamOff
} from '@mui/icons-material';
import { HMSPeer, useHMSActions } from '@100mslive/react-sdk';

interface ResponsiveVideoLayoutProps {
  peers: HMSPeer[];
  localPeer: HMSPeer | null;
  isFullscreen?: boolean;
  fullscreenPeerId?: string | null;
  onFullscreenToggle?: (peerId: string) => void;
  userRole?: 'student' | 'teacher' | 'admin';
  chatComponent?: React.ReactNode;
  participantsComponent?: React.ReactNode;
  controlsComponent?: React.ReactNode;
  className?: string;
  // Add props for syncing chat/participants state
  chatOpen?: boolean;
  participantsOpen?: boolean;
  onChatToggle?: () => void;
  onParticipantsToggle?: () => void;
}

const ResponsiveVideoLayout: React.FC<ResponsiveVideoLayoutProps> = ({
  peers,
  localPeer,
  isFullscreen = false,
  fullscreenPeerId = null,
  onFullscreenToggle,
  userRole,
  chatComponent,
  participantsComponent,
  controlsComponent,
  className,
  chatOpen = false,
  participantsOpen = false,
  onChatToggle,
  onParticipantsToggle
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  const [controlsVisible, setControlsVisible] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(isMobile);

  // Auto-hide controls on mobile after inactivity
  useEffect(() => {
    if (!isMobile) return;

    const timer = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);

    const showControls = () => {
      setControlsVisible(true);
      clearTimeout(timer);
    };

    document.addEventListener('touchstart', showControls);
    document.addEventListener('mousemove', showControls);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('touchstart', showControls);
      document.removeEventListener('mousemove', showControls);
    };
  }, [isMobile]);

  // Handle fullscreen toggle for individual peers
  const handlePeerFullscreenToggle = (peerId: string) => {
    onFullscreenToggle?.(peerId);
  };

  // Calculate video grid layout based on screen size and peer count
  const getVideoGridProps = () => {
    const peerCount = peers.length;
    
    if (isMobile) {
      // Mobile: Stack videos vertically or show main speaker
      if (peerCount <= 2) {
        return { xs: 12 };
      } else {
        return { xs: 6 }; // 2 columns on mobile for more peers
      }
    } else if (isTablet) {
      // Tablet: 2-3 columns
      if (peerCount <= 4) {
        return { xs: 6, md: 6 };
      } else {
        return { xs: 4, md: 4 };
      }
    } else {
      // Desktop: Responsive grid based on peer count
      if (peerCount <= 2) {
        return { xs: 12, md: 6 };
      } else if (peerCount <= 4) {
        return { xs: 6, md: 6 };
      } else if (peerCount <= 6) {
        return { xs: 4, md: 4 };
      } else {
        return { xs: 3, md: 3 };
      }
    }
  };

  // Individual peer video component with HMS integration
  const PeerVideo: React.FC<{ peer: HMSPeer }> = ({ peer }) => {
    const hmsActions = useHMSActions();
    const isTeacher = peer.roleName?.toLowerCase().includes('teacher') || 
                     peer.roleName?.toLowerCase().includes('host');
    const isFullscreenPeer = fullscreenPeerId === peer.id;

    useEffect(() => {
      if (peer.videoTrack && typeof peer.videoTrack === 'string') {
        const videoElement = document.getElementById(`video-${peer.id}`) as HTMLVideoElement;
        if (videoElement) {
          hmsActions.attachVideo(peer.videoTrack as string, videoElement);
        }
      }
      return () => {
        if (peer.videoTrack && typeof peer.videoTrack === 'string') {
          const videoElement = document.getElementById(`video-${peer.id}`) as HTMLVideoElement;
          if (videoElement) {
            hmsActions.detachVideo(peer.videoTrack as string, videoElement);
          }
        }
      };
    }, [peer.videoTrack, peer.id, hmsActions]);

    return (
      <Paper
        elevation={isTeacher ? 4 : 2}
        sx={{
          position: 'relative',
          aspectRatio: '16/9',
          bgcolor: 'black',
          borderRadius: 2,
          overflow: 'hidden',
          border: isTeacher ? 2 : 0,
          borderColor: 'primary.main',
          cursor: 'pointer',
          '&:hover': {
            '& .peer-controls': {
              opacity: 1
            }
          }
        }}
        onClick={() => handlePeerFullscreenToggle(peer.id)}
      >
        {/* Video element */}
        <video
          id={`video-${peer.id}`}
          autoPlay
          muted={peer.isLocal}
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
        />

        {/* Video disabled overlay */}
        {!peer.videoTrack && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}
          >
            <VideocamOff sx={{ fontSize: 48, mb: 1 }} />
            <Box sx={{ textAlign: 'center' }}>
              {peer.name}
              {isTeacher && ' (Teacher)'}
            </Box>
          </Box>
        )}

        {/* Peer name and status overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 8,
            right: 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: 1,
            p: 1
          }}
        >
          <Box
            sx={{
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 'medium',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1
            }}
          >
            {peer.name} {peer.isLocal && '(You)'} {isTeacher && !peer.isLocal && '(Teacher)'}
          </Box>
          
          {/* Audio/Video status indicators */}
          <Box display="flex" gap={0.5} alignItems="center">
            {!peer.audioTrack && (
              <MicOff sx={{ fontSize: 16, color: 'error.main' }} />
            )}
            {!peer.videoTrack && (
              <VideocamOff sx={{ fontSize: 16, color: 'error.main' }} />
            )}
          </Box>
        </Box>

        {/* Fullscreen toggle */}
        <IconButton
          className="peer-controls"
          size="small"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            opacity: 0,
            transition: 'opacity 0.2s',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.8)'
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
            handlePeerFullscreenToggle(peer.id);
          }}
        >
          {isFullscreenPeer ? <FullscreenExit /> : <Fullscreen />}
        </IconButton>
      </Paper>
    );
  };

  // Render individual peer video
  const renderPeerVideo = (peer: HMSPeer) => {
    return (
      <Grid item {...getVideoGridProps()} key={peer.id}>
        <PeerVideo peer={peer} />
      </Grid>
    );
  };

  return (
    <Box
      className={className}
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'grey.900'
      }}
    >
      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Video grid */}
        <Box sx={{ flex: 1, overflow: 'auto', p: isMobile ? 1 : 2 }}>
          <Grid container spacing={isMobile ? 1 : 2}>
            {/* Local peer first for teachers */}
            {localPeer && (userRole === 'teacher' || userRole === 'admin') && renderPeerVideo(localPeer)}
            
            {/* Other peers */}
            {peers
              .filter(peer => peer.id !== localPeer?.id)
              .map(renderPeerVideo)
            }
            
            {/* Local peer for students (after others) */}
            {localPeer && userRole === 'student' && renderPeerVideo(localPeer)}
          </Grid>
        </Box>

        {/* Desktop sidebar */}
        {!isMobile && (chatOpen || participantsOpen) && (
          <Paper
            sx={{
              width: sidebarCollapsed ? 60 : 320,
              display: 'flex',
              flexDirection: 'column',
              transition: 'width 0.3s ease',
              borderRadius: 0,
              borderLeft: 1,
              borderColor: 'divider'
            }}
          >
            {/* Sidebar header */}
            <Box
              sx={{
                p: 1,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <IconButton
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                size="small"
              >
                {sidebarCollapsed ? <ExpandMore /> : <ExpandLess />}
              </IconButton>
              {!sidebarCollapsed && (
                <IconButton
                  onClick={() => {
                    if (chatOpen) onChatToggle?.();
                    if (participantsOpen) onParticipantsToggle?.();
                  }}
                  size="small"
                >
                  <Close />
                </IconButton>
              )}
            </Box>

            {/* Sidebar content */}
            <Collapse in={!sidebarCollapsed} sx={{ flex: 1 }}>
              <Box sx={{ height: '100%', overflow: 'hidden' }}>
                {chatOpen && chatComponent}
                {participantsOpen && participantsComponent}
              </Box>
            </Collapse>
          </Paper>
        )}

        {/* Mobile drawers */}
        {isMobile && (
          <>
            <Drawer
              anchor="right"
              open={chatOpen}
              onClose={onChatToggle}
              PaperProps={{
                sx: { width: '90vw', maxWidth: 400 }
              }}
            >
              {chatComponent}
            </Drawer>

            <Drawer
              anchor="right"
              open={participantsOpen}
              onClose={onParticipantsToggle}
              PaperProps={{
                sx: { width: '90vw', maxWidth: 400 }
              }}
            >
              {participantsComponent}
            </Drawer>
          </>
        )}

        {/* Mobile floating action buttons for quick access */}
        {isMobile && (
          <Box
            sx={{
              position: 'fixed',
              right: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              zIndex: 1000
            }}
          >
            <Fab
              size="small"
              color="primary"
              onClick={onChatToggle}
              sx={{
                opacity: controlsVisible ? 1 : 0.3,
                transition: 'opacity 0.3s ease'
              }}
            >
              <Chat />
            </Fab>
            <Fab
              size="small"
              color="secondary"
              onClick={onParticipantsToggle}
              sx={{
                opacity: controlsVisible ? 1 : 0.3,
                transition: 'opacity 0.3s ease'
              }}
            >
              <People />
            </Fab>
          </Box>
        )}
      </Box>

      {/* Bottom controls */}
      <Slide direction="up" in={controlsVisible} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            p: isMobile ? 1 : 2
          }}
        >
          {controlsComponent}
        </Box>
      </Slide>
    </Box>
  );
};

export default ResponsiveVideoLayout;
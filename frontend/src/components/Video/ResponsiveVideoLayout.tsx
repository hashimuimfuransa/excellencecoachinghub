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
  Close
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
  className
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
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
        return { xs: 12, sm: 6, md: 6 };
      } else {
        return { xs: 12, sm: 6, md: 4 };
      }
    } else {
      // Desktop: 3-4 columns
      if (peerCount <= 4) {
        return { xs: 12, sm: 6, md: 6, lg: 6 };
      } else if (peerCount <= 9) {
        return { xs: 12, sm: 6, md: 4, lg: 4 };
      } else {
        return { xs: 12, sm: 6, md: 4, lg: 3 };
      }
    }
  };

  // Get video tile height based on screen size
  const getVideoTileHeight = () => {
    if (isMobile) {
      return isFullscreen ? '25vh' : '200px';
    } else if (isTablet) {
      return isFullscreen ? '30vh' : '250px';
    } else {
      return isFullscreen ? '35vh' : '300px';
    }
  };

  const videoGridProps = getVideoGridProps();
  const videoTileHeight = getVideoTileHeight();

  return (
    <Box
      className={className}
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Main video area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          position: 'relative',
          minHeight: 0 // Important for flex child to shrink
        }}
      >
        {/* Video grid */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: isMobile ? 1 : 2,
            pr: (!isMobile && (chatOpen || participantsOpen) && !sidebarCollapsed) ? 0 : undefined
          }}
        >
          {isFullscreen && fullscreenPeerId ? (
            // Fullscreen mode - show only the selected peer
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(() => {
                const fullscreenPeer = peers.find(peer => peer.id === fullscreenPeerId);
                return fullscreenPeer ? (
                  <ResponsiveVideoTile
                    peer={fullscreenPeer}
                    height="100vh"
                    isLocal={fullscreenPeer.isLocal}
                    isMobile={isMobile}
                    isFullscreen={true}
                    onFullscreenToggle={handlePeerFullscreenToggle}
                    userRole={userRole}
                  />
                ) : null;
              })()}
            </Box>
          ) : (
            // Normal grid mode
            <Grid container spacing={isMobile ? 1 : 2}>
              {peers.map((peer) => (
                <Grid item {...videoGridProps} key={peer.id}>
                  <ResponsiveVideoTile
                    peer={peer}
                    height={videoTileHeight}
                    isLocal={peer.isLocal}
                    isMobile={isMobile}
                    isFullscreen={fullscreenPeerId === peer.id}
                    onFullscreenToggle={handlePeerFullscreenToggle}
                    userRole={userRole}
                  />
                </Grid>
              ))}
            </Grid>
          )}
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
                    setChatOpen(false);
                    setParticipantsOpen(false);
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
              onClose={() => setChatOpen(false)}
              PaperProps={{
                sx: { width: '90vw', maxWidth: 400 }
              }}
            >
              {chatComponent}
            </Drawer>

            <Drawer
              anchor="right"
              open={participantsOpen}
              onClose={() => setParticipantsOpen(false)}
              PaperProps={{
                sx: { width: '90vw', maxWidth: 400 }
              }}
            >
              {participantsComponent}
            </Drawer>
          </>
        )}

        {/* Fullscreen toggle button */}
        <Fab
          size="small"
          onClick={() => {
            // This is a global fullscreen toggle - not used in our implementation
            // We use individual peer fullscreen toggles instead
          }}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            opacity: controlsVisible ? 1 : 0.3,
            transition: 'opacity 0.3s ease',
            display: 'none' // Hide this button since we use individual peer fullscreen
          }}
        >
          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
        </Fab>

        {/* Mobile floating action buttons */}
        {isMobile && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 80,
              right: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              opacity: controlsVisible ? 1 : 0.3,
              transition: 'opacity 0.3s ease'
            }}
          >
            {chatComponent && (
              <Fab
                size="small"
                onClick={() => setChatOpen(true)}
                color={chatOpen ? 'primary' : 'default'}
              >
                <Chat />
              </Fab>
            )}
            {participantsComponent && (
              <Fab
                size="small"
                onClick={() => setParticipantsOpen(true)}
                color={participantsOpen ? 'primary' : 'default'}
              >
                <People />
              </Fab>
            )}
          </Box>
        )}
      </Box>

      {/* Controls */}
      <Slide direction="up" in={controlsVisible || !isMobile}>
        <Box
          sx={{
            position: isMobile ? 'absolute' : 'relative',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000
          }}
        >
          {controlsComponent}
        </Box>
      </Slide>
    </Box>
  );
};

// Responsive video tile component
interface ResponsiveVideoTileProps {
  peer: HMSPeer;
  height: string;
  isLocal: boolean;
  isMobile: boolean;
  isFullscreen?: boolean;
  onFullscreenToggle?: (peerId: string) => void;
  userRole?: 'student' | 'teacher' | 'admin';
}

const ResponsiveVideoTile: React.FC<ResponsiveVideoTileProps> = ({
  peer,
  height,
  isLocal,
  isMobile,
  isFullscreen = false,
  onFullscreenToggle,
  userRole
}) => {
  const hmsActions = useHMSActions();
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Attach video track to video element
  useEffect(() => {
    if (peer.videoTrack && typeof peer.videoTrack === 'string') {
      const attachVideo = () => {
        if (videoRef.current) {
          console.log(`🎥 Attaching video track for peer: ${peer.name} (${peer.id})`);
          hmsActions.attachVideo(peer.videoTrack as string, videoRef.current);
        } else {
          console.warn(`⚠️ Video element not ready for peer: ${peer.name} (${peer.id})`);
        }
      };

      // Try immediately, then with a small delay if needed
      attachVideo();
      const timeoutId = setTimeout(attachVideo, 100);
      const timeoutId2 = setTimeout(attachVideo, 500);

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(timeoutId2);
        if (videoRef.current) {
          console.log(`🎥 Detaching video track for peer: ${peer.name} (${peer.id})`);
          hmsActions.detachVideo(peer.videoTrack as string, videoRef.current);
        }
      };
    } else {
      console.log(`📹 No video track for peer: ${peer.name} (${peer.id})`);
    }
  }, [peer.videoTrack, peer.id, hmsActions]);

  return (
    <Paper
      sx={{
        height,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: isMobile ? 1 : 2,
        bgcolor: 'black'
      }}
    >
      <video
        ref={videoRef}
        id={`video-${peer.id}`}
        autoPlay
        muted={isLocal}
        playsInline
        controls={false}
        onLoadedData={() => {
          console.log(`🎬 Video element loaded for peer: ${peer.name} (${peer.id})`);
        }}
        onError={(e) => {
          console.error(`❌ Video element error for peer: ${peer.name} (${peer.id})`, e);
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000'
        }}
      />
      
      {/* Peer name overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          bgcolor: 'rgba(0,0,0,0.7)',
          color: 'white',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          maxWidth: 'calc(100% - 16px)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {peer.name} {isLocal && '(You)'}
      </Box>

      {/* Audio/Video status indicators and fullscreen button */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          display: 'flex',
          gap: 0.5
        }}
      >
        {/* Fullscreen button - only for students viewing teachers */}
        {userRole === 'student' && !isLocal && onFullscreenToggle && (
          <Box
            sx={{
              bgcolor: 'rgba(0,0,0,0.7)',
              color: 'white',
              borderRadius: '50%',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'rgba(0,0,0,0.9)'
              }
            }}
            onClick={() => onFullscreenToggle(peer.id)}
          >
            {isFullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
          </Box>
        )}
        
        {!peer.audioTrack && (
          <Box
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              borderRadius: '50%',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              component="span"
              sx={{
                width: isMobile ? 12 : 16,
                height: isMobile ? 12 : 16,
                fontSize: isMobile ? '0.7rem' : '0.8rem'
              }}
            >
              🔇
            </Box>
          </Box>
        )}
        {!peer.videoTrack && (
          <Box
            sx={{
              bgcolor: 'error.main',
              color: 'white',
              borderRadius: '50%',
              p: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Box
              component="span"
              sx={{
                width: isMobile ? 12 : 16,
                height: isMobile ? 12 : 16,
                fontSize: isMobile ? '0.7rem' : '0.8rem'
              }}
            >
              📹
            </Box>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ResponsiveVideoLayout;

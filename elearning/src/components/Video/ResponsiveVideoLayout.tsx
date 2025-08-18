import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  IconButton,
  useTheme,
  useMediaQuery,
  Fab,
  Slide,
  Typography
} from '@mui/material';
import {
  Chat,
  People,
  Fullscreen,
  FullscreenExit,
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
  // Add raise hand requests for notification badge
  raiseHandRequests?: Set<string>;
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
  onParticipantsToggle,
  raiseHandRequests = new Set()
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
  const PeerVideo: React.FC<{ peer: HMSPeer; isMainVideo?: boolean }> = ({ peer, isMainVideo = false }) => {
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
        elevation={isMainVideo ? 0 : (isTeacher ? 4 : 2)}
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          aspectRatio: isMainVideo ? 'auto' : '16/9',
          bgcolor: 'black',
          borderRadius: isMainVideo ? 0 : 2,
          overflow: 'hidden',
          border: isTeacher && !isMainVideo ? 2 : 0,
          borderColor: 'primary.main',
          cursor: isMainVideo ? 'default' : 'pointer',
          '&:hover': {
            '& .peer-controls': {
              opacity: 1
            }
          }
        }}
        onClick={isMainVideo ? undefined : () => handlePeerFullscreenToggle(peer.id)}
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
            <VideocamOff sx={{ fontSize: isMainVideo ? 96 : 48, mb: 1 }} />
            <Box sx={{ 
              textAlign: 'center',
              fontSize: isMainVideo ? '1.5rem' : '1rem',
              fontWeight: 'medium'
            }}>
              {peer.name}
              {isTeacher && ' (Teacher)'}
              {peer.isLocal && ' (You)'}
            </Box>
          </Box>
        )}

        {/* Peer name and status overlay */}
        <Box
          sx={{
            position: 'absolute',
            bottom: isMainVideo ? 16 : 8,
            left: isMainVideo ? 16 : 8,
            right: isMainVideo ? 16 : 8,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: 1,
            p: isMainVideo ? 2 : 1
          }}
        >
          <Box
            sx={{
              color: 'white',
              fontSize: isMainVideo ? '1.25rem' : '0.875rem',
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
              <MicOff sx={{ fontSize: isMainVideo ? 24 : 16, color: 'error.main' }} />
            )}
            {!peer.videoTrack && (
              <VideocamOff sx={{ fontSize: isMainVideo ? 24 : 16, color: 'error.main' }} />
            )}
          </Box>
        </Box>

        {/* Fullscreen toggle - only show on non-main videos */}
        {!isMainVideo && (
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
        )}
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

  // Thumbnail videos component
  const ThumbnailVideos: React.FC<{
    peers: HMSPeer[];
    userRole?: 'student' | 'teacher' | 'admin';
    isMobile: boolean;
    onPeerClick: (peerId: string) => void;
  }> = ({ peers, userRole, isMobile, onPeerClick }) => {
    const hmsActions = useHMSActions();

    // Filter out the main peer (teacher/presenter)
    const thumbnailPeers = peers.filter(peer => {
      const teacherPeer = peers.find(p => 
        p.roleName?.toLowerCase().includes('teacher') || 
        p.roleName?.toLowerCase().includes('host') ||
        (userRole === 'student' && !p.isLocal)
      );
      const mainPeer = teacherPeer || peers[0];
      return peer.id !== mainPeer.id;
    });

    // Attach video tracks to thumbnail elements
    useEffect(() => {
      thumbnailPeers.forEach(peer => {
        if (peer.videoTrack && typeof peer.videoTrack === 'string') {
          const videoElement = document.getElementById(`thumbnail-video-${peer.id}`) as HTMLVideoElement;
          if (videoElement) {
            hmsActions.attachVideo(peer.videoTrack as string, videoElement);
          }
        }
      });

      return () => {
        thumbnailPeers.forEach(peer => {
          if (peer.videoTrack && typeof peer.videoTrack === 'string') {
            const videoElement = document.getElementById(`thumbnail-video-${peer.id}`) as HTMLVideoElement;
            if (videoElement) {
              hmsActions.detachVideo(peer.videoTrack as string, videoElement);
            }
          }
        });
      };
    }, [thumbnailPeers, hmsActions]);

    return (
      <Box
        sx={{
          position: 'absolute',
          bottom: isMobile ? 80 : 100,
          right: isMobile ? 16 : 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          zIndex: 1100,
          maxHeight: '40vh',
          overflowY: 'auto'
        }}
      >
        {thumbnailPeers.map(peer => (
          <Paper
            key={peer.id}
            elevation={4}
            sx={{
              width: isMobile ? 80 : 120,
              height: isMobile ? 60 : 90,
              position: 'relative',
              borderRadius: 1,
              overflow: 'hidden',
              cursor: 'pointer',
              border: peer.isLocal ? 2 : 0,
              borderColor: 'primary.main',
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s ease'
              }
            }}
            onClick={() => onPeerClick(peer.id)}
          >
            <video
              id={`thumbnail-video-${peer.id}`}
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
            
            {/* Video disabled overlay for thumbnails */}
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
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}
              >
                <VideocamOff sx={{ fontSize: isMobile ? 16 : 20 }} />
              </Box>
            )}

            {/* Thumbnail name overlay */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                bgcolor: 'rgba(0, 0, 0, 0.7)',
                color: 'white',
                fontSize: isMobile ? '0.6rem' : '0.7rem',
                p: 0.5,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {peer.name} {peer.isLocal && '(You)'}
            </Box>

            {/* Audio status for thumbnails */}
            {!peer.audioTrack && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  bgcolor: 'error.main',
                  borderRadius: '50%',
                  p: 0.25
                }}
              >
                <MicOff sx={{ fontSize: isMobile ? 10 : 12, color: 'white' }} />
              </Box>
            )}
          </Paper>
        ))}
      </Box>
    );
  };

  // Popup component for chat and participants
  const PopupPanel: React.FC<{
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title: string;
  }> = ({ open, onClose, children, title }) => {
    if (!open) return null;

    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300
        }}
        onClick={onClose}
      >
        <Paper
          elevation={8}
          sx={{
            width: isMobile ? '90vw' : '400px',
            maxWidth: isMobile ? '90vw' : '500px',
            height: isMobile ? '70vh' : '500px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 2,
            overflow: 'hidden',
            bgcolor: 'background.paper',
            outline: 'none',
            animation: 'slideUp 0.3s ease-out',
            '@keyframes slideUp': {
              from: {
                transform: 'translateY(50px)',
                opacity: 0
              },
              to: {
                transform: 'translateY(0)',
                opacity: 1
              }
            }
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </Paper>
      </Box>
    );
  };

  return (
    <Box
      className={className}
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'grey.900',
        position: 'relative'
      }}
    >
      {/* Full screen video area */}
      <Box sx={{ 
        flex: 1, 
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Main teacher video (full screen) */}
        {peers.length > 0 ? (
          <Box sx={{ 
            width: '100%', 
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Find teacher/presenter or first peer for main video */}
            {(() => {
              const teacherPeer = peers.find(peer => 
                peer.roleName?.toLowerCase().includes('teacher') || 
                peer.roleName?.toLowerCase().includes('host') ||
                (userRole === 'student' && !peer.isLocal)
              );
              const mainPeer = teacherPeer || peers[0];
              
              return (
                <Box sx={{ 
                  width: '100%', 
                  height: '100%',
                  position: 'relative'
                }}>
                  <PeerVideo peer={mainPeer} isMainVideo={true} />
                </Box>
              );
            })()}
          </Box>
        ) : (
          <Box sx={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'grey.900',
            color: 'white'
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <VideocamOff sx={{ fontSize: 96, mb: 2 }} />
              <Box sx={{ fontSize: '1.5rem', fontWeight: 'medium' }}>
                Waiting for participants to join...
              </Box>
            </Box>
          </Box>
        )}

        {/* Floating action buttons for chat and participants */}
        <Box
          sx={{
            position: 'absolute',
            right: isMobile ? 16 : 24,
            top: isMobile ? 80 : 100,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            zIndex: 1200
          }}
        >
          <Fab
            size={isMobile ? "medium" : "large"}
            color="primary"
            onClick={onChatToggle}
            sx={{
              opacity: controlsVisible ? 0.9 : 0.6,
              transition: 'all 0.3s ease',
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
                transform: 'scale(1.1)'
              },
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}
          >
            <Chat />
          </Fab>
          <Fab
            size={isMobile ? "medium" : "large"}
            color="secondary"
            onClick={onParticipantsToggle}
            sx={{
              opacity: controlsVisible ? 0.9 : 0.6,
              transition: 'all 0.3s ease',
              bgcolor: 'secondary.main',
              '&:hover': {
                bgcolor: 'secondary.dark',
                transform: 'scale(1.1)'
              },
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <People />
            {/* Raise hand notification badge */}
            {userRole === 'teacher' && raiseHandRequests.size > 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  bgcolor: 'warning.main',
                  color: 'white',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  animation: 'pulse 1s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(1)' },
                    '50%': { transform: 'scale(1.2)' },
                    '100%': { transform: 'scale(1)' }
                  }
                }}
              >
                🤚
              </Box>
            )}
          </Fab>
        </Box>

        {/* Floating raise hand notification for teachers on mobile */}
        {userRole === 'teacher' && isMobile && raiseHandRequests.size > 0 && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'warning.main',
              color: 'white',
              px: 3,
              py: 1.5,
              borderRadius: 3,
              zIndex: 1250,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              animation: 'slideDown 0.3s ease-out',
              '@keyframes slideDown': {
                from: {
                  transform: 'translateX(-50%) translateY(-100%)',
                  opacity: 0
                },
                to: {
                  transform: 'translateX(-50%) translateY(0)',
                  opacity: 1
                }
              }
            }}
            onClick={onParticipantsToggle}
          >
            <Box sx={{ fontSize: '1.2rem' }}>🤚</Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {raiseHandRequests.size} student{raiseHandRequests.size > 1 ? 's' : ''} want{raiseHandRequests.size === 1 ? 's' : ''} to speak
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Tap to view
            </Typography>
          </Box>
        )}

        {/* Small participant thumbnails (bottom right) */}
        {peers.length > 1 && (
          <ThumbnailVideos 
            peers={peers}
            userRole={userRole}
            isMobile={isMobile}
            onPeerClick={handlePeerFullscreenToggle}
          />
        )}
      </Box>

      {/* Chat Popup */}
      <PopupPanel
        open={chatOpen}
        onClose={onChatToggle || (() => {})}
        title="Chat"
      >
        {chatComponent}
      </PopupPanel>

      {/* Participants Popup */}
      <PopupPanel
        open={participantsOpen}
        onClose={onParticipantsToggle || (() => {})}
        title="Participants"
      >
        {participantsComponent}
      </PopupPanel>

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
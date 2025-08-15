import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Chip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  VideoCall,
  VideocamOff,
  Mic,
  MicOff,
  Warning,
  Security,
  ExitToApp,
  Visibility,
  VisibilityOff,
  Face,
  RemoveRedEye,
  Group
} from '@mui/icons-material';
import {
  HMSRoomProvider,
  useHMSActions,
  useHMSStore,
  selectIsConnectedToRoom,
  selectPeers,
  selectLocalPeer,
  selectIsLocalVideoEnabled,
  selectIsLocalAudioEnabled,
  HMSPeer
} from '@100mslive/react-sdk';
import { useAuth } from '../../store/AuthContext';
import { apiService } from '../../services/apiService';
import { socketService } from '../../services/socketService';
import AIBehaviorDetector from './AIBehaviorDetector';

interface ExamProctoringProps {
  examId: string;
  userRole: 'student' | 'admin';
  onLeave?: () => void;
  onViolationDetected?: (violation: ViolationData) => void;
}

interface ViolationData {
  type: 'face_not_detected' | 'multiple_faces' | 'looking_away' | 'suspicious_movement';
  confidence: number;
  timestamp: Date;
  description: string;
}

interface VideoTokenResponse {
  token: string;
  roomId: string;
  userId: string;
  role: string;
  userName: string;
}

const ExamProctoringContent: React.FC<ExamProctoringProps> = ({
  examId,
  userRole,
  onLeave,
  onViolationDetected
}) => {
  const { user } = useAuth();
  const hmsActions = useHMSActions();
  
  // HMS Store selectors
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);

  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [violations, setViolations] = useState<ViolationData[]>([]);
  const [showViolations, setShowViolations] = useState(false);
  const [proctoringActive, setProctoringActive] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [currentWarning, setCurrentWarning] = useState<ViolationData | null>(null);

  // Refs
  const violationCountRef = useRef(0);
  const lastViolationTimeRef = useRef<Date | null>(null);

  // Initialize HMS connection for proctoring
  useEffect(() => {
    const initializeProctoringRoom = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get HMS token for proctoring room (using default room)
        const response = await apiService.post<VideoTokenResponse>('/video/token', {
          role: userRole,
          userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
          isRecorder: userRole === 'admin' // Admins join as recorders/observers
        });

        if (!response.success || !response.data) {
          throw new Error('Failed to get proctoring token');
        }

        const { token } = response.data;

        // Join HMS proctoring room
        await hmsActions.join({
          userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
          authToken: token
        });

        // For students, ensure video and audio are enabled
        if (userRole === 'student') {
          await hmsActions.setLocalVideoEnabled(true);
          await hmsActions.setLocalAudioEnabled(true);
          setProctoringActive(true);
        }

        console.log('✅ Successfully joined proctoring room');

      } catch (err) {
        console.error('❌ Error joining proctoring room:', err);
        setError(err instanceof Error ? err.message : 'Failed to join proctoring room');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      initializeProctoringRoom();
    }

    // Cleanup on unmount
    return () => {
      if (isConnected) {
        hmsActions.leave();
      }
    };
  }, [user, examId, userRole, hmsActions, isConnected]);

  // Handle violation detection
  const handleViolationDetected = useCallback((violation: ViolationData) => {
    console.log('🚨 Violation detected:', violation);
    
    setViolations(prev => [...prev, violation]);
    violationCountRef.current += 1;
    lastViolationTimeRef.current = new Date();

    // Show warning to student
    if (userRole === 'student') {
      setCurrentWarning(violation);
      setWarningDialogOpen(true);
    }

    // Notify admin via WebSocket
    socketService.sendChatMessage({
      sessionId: `exam-${examId}`,
      userId: user?._id?.toString() || 'unknown',
      userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
      message: `PROCTORING_VIOLATION:${JSON.stringify(violation)}`,
      isTeacher: false,
      type: 'system'
    });

    // Call parent callback
    if (onViolationDetected) {
      onViolationDetected(violation);
    }

    // Auto-close warning after 5 seconds
    if (userRole === 'student') {
      setTimeout(() => {
        setWarningDialogOpen(false);
        setCurrentWarning(null);
      }, 5000);
    }
  }, [userRole, examId, user, onViolationDetected]);

  // Handle leave room
  const handleLeave = useCallback(async () => {
    try {
      setProctoringActive(false);
      await hmsActions.leave();
      if (onLeave) {
        onLeave();
      }
    } catch (error) {
      console.error('Error leaving proctoring room:', error);
    }
  }, [hmsActions, onLeave]);

  // Get violation severity color
  const getViolationSeverity = (type: ViolationData['type']) => {
    switch (type) {
      case 'face_not_detected':
      case 'multiple_faces':
        return 'error';
      case 'looking_away':
        return 'warning';
      case 'suspicious_movement':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Initializing exam proctoring...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="h6">Failed to initialize proctoring</Typography>
        <Typography>{error}</Typography>
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ mt: 1 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  if (!isConnected) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Connecting to proctoring room...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, mb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Security color="primary" />
            <Typography variant="h6">
              Exam Proctoring - {userRole === 'student' ? 'Student View' : 'Admin Monitor'}
            </Typography>
            {proctoringActive && (
              <Chip
                icon={<Visibility />}
                label="Monitoring Active"
                color="success"
                size="small"
              />
            )}
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            {/* Violation count */}
            {violations.length > 0 && (
              <Badge badgeContent={violations.length} color="error">
                <Button
                  startIcon={<Warning />}
                  onClick={() => setShowViolations(true)}
                  color="error"
                  size="small"
                >
                  Violations
                </Button>
              </Badge>
            )}
            
            {/* Participants count */}
            <Typography variant="body2">
              {peers.length} participant{peers.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
        {userRole === 'student' ? (
          <StudentProctoringView
            localPeer={localPeer || null}
            onViolationDetected={handleViolationDetected}
            proctoringActive={proctoringActive}
          />
        ) : (
          <AdminMonitorView peers={peers} violations={violations} />
        )}
      </Box>

      {/* Controls */}
      <Paper elevation={2} sx={{ p: 2, mt: 1 }}>
        <Box display="flex" justifyContent="center" alignItems="center" gap={2}>
          {userRole === 'student' && (
            <>
              <Chip
                icon={isLocalVideoEnabled ? <VideoCall /> : <VideocamOff />}
                label={isLocalVideoEnabled ? 'Camera On' : 'Camera Off'}
                color={isLocalVideoEnabled ? 'success' : 'error'}
              />
              <Chip
                icon={isLocalAudioEnabled ? <Mic /> : <MicOff />}
                label={isLocalAudioEnabled ? 'Mic On' : 'Mic Off'}
                color={isLocalAudioEnabled ? 'success' : 'error'}
              />
            </>
          )}
          
          <Button
            onClick={handleLeave}
            color="error"
            startIcon={<ExitToApp />}
            variant="contained"
          >
            {userRole === 'student' ? 'End Exam' : 'Stop Monitoring'}
          </Button>
        </Box>
      </Paper>

      {/* Warning Dialog for Students */}
      <Dialog open={warningDialogOpen} onClose={() => setWarningDialogOpen(false)}>
        <DialogTitle sx={{ color: 'error.main' }}>
          <Warning sx={{ mr: 1 }} />
          Proctoring Alert
        </DialogTitle>
        <DialogContent>
          <Typography>
            {currentWarning?.description}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Please ensure you maintain proper exam conditions.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setWarningDialogOpen(false)} 
            sx={{
              backgroundColor: '#1976d2',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '4px',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#1565c0',
              },
            }}
          >
            Understood
          </Button>
        </DialogActions>
      </Dialog>

      {/* Violations Dialog */}
      <Dialog 
        open={showViolations} 
        onClose={() => setShowViolations(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Proctoring Violations</DialogTitle>
        <DialogContent>
          <List>
            {violations.map((violation, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Warning color={getViolationSeverity(violation.type) as any} />
                </ListItemIcon>
                <ListItemText
                  primary={violation.description}
                  secondary={`${violation.timestamp.toLocaleTimeString()} - Confidence: ${Math.round(violation.confidence * 100)}%`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViolations(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Student Proctoring View Component
const StudentProctoringView: React.FC<{
  localPeer: HMSPeer | null;
  onViolationDetected: (violation: ViolationData) => void;
  proctoringActive: boolean;
}> = ({ localPeer, onViolationDetected, proctoringActive }) => {
  const hmsActions = useHMSActions();

  useEffect(() => {
    if (localPeer?.videoTrack && typeof localPeer.videoTrack === 'string') {
      const videoElement = document.getElementById('student-video') as HTMLVideoElement;
      if (videoElement) {
        hmsActions.attachVideo(localPeer.videoTrack as string, videoElement);
      }
    }
    return () => {
      if (localPeer?.videoTrack && typeof localPeer.videoTrack === 'string') {
        const videoElement = document.getElementById('student-video') as HTMLVideoElement;
        if (videoElement) {
          hmsActions.detachVideo(localPeer.videoTrack as string, videoElement);
        }
      }
    };
  }, [localPeer?.videoTrack, hmsActions]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Student's video feed */}
      <Card sx={{ flex: 1, position: 'relative' }}>
        <video
          id="student-video"
          autoPlay
          muted
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            backgroundColor: '#000'
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            px: 2,
            py: 1,
            borderRadius: 1
          }}
        >
          <Typography variant="h6">Your Exam View</Typography>
          <Typography variant="body2">
            Stay focused and maintain eye contact with the camera
          </Typography>
        </Box>
      </Card>

      {/* AI Behavior Detection */}
      {proctoringActive && (
        <AIBehaviorDetector
          videoElementId="student-video"
          onViolationDetected={onViolationDetected}
          isActive={proctoringActive}
        />
      )}
    </Box>
  );
};

// Admin Monitor View Component
const AdminMonitorView: React.FC<{
  peers: HMSPeer[];
  violations: ViolationData[];
}> = ({ peers, violations }) => {
  const studentPeers = peers.filter(peer => !peer.isLocal);

  return (
    <Box sx={{ flex: 1 }}>
      <Grid container spacing={2}>
        {studentPeers.map((peer) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={peer.id}>
            <AdminVideoTile peer={peer} violations={violations} />
          </Grid>
        ))}
        {studentPeers.length === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Group sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="textSecondary">
                No students connected
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Students will appear here when they join the exam
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

// Admin Video Tile Component
const AdminVideoTile: React.FC<{
  peer: HMSPeer;
  violations: ViolationData[];
}> = ({ peer, violations }) => {
  const hmsActions = useHMSActions();
  const peerViolations = violations.filter(v => v.timestamp > new Date(Date.now() - 300000)); // Last 5 minutes

  useEffect(() => {
    if (peer.videoTrack && typeof peer.videoTrack === 'string') {
      const videoElement = document.getElementById(`admin-video-${peer.id}`) as HTMLVideoElement;
      if (videoElement) {
        hmsActions.attachVideo(peer.videoTrack as string, videoElement);
      }
    }
    return () => {
      if (peer.videoTrack && typeof peer.videoTrack === 'string') {
        const videoElement = document.getElementById(`admin-video-${peer.id}`) as HTMLVideoElement;
        if (videoElement) {
          hmsActions.detachVideo(peer.videoTrack as string, videoElement);
        }
      }
    };
  }, [peer.videoTrack, peer.id, hmsActions]);

  return (
    <Card sx={{ height: 250, position: 'relative' }}>
      <video
        id={`admin-video-${peer.id}`}
        autoPlay
        muted
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: '#000'
        }}
      />
      
      {/* Student name */}
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
          fontSize: '0.75rem'
        }}
      >
        {peer.name}
      </Box>

      {/* Violation indicator */}
      {peerViolations.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'error.main',
            color: 'white',
            borderRadius: 1,
            px: 1,
            py: 0.5,
            fontSize: '0.75rem'
          }}
        >
          {peerViolations.length} violation{peerViolations.length !== 1 ? 's' : ''}
        </Box>
      )}

      {/* Audio/Video status */}
      <Box
        sx={{
          position: 'absolute',
          top: 8,
          left: 8,
          display: 'flex',
          gap: 0.5
        }}
      >
        {!peer.audioTrack && (
          <Box sx={{ bgcolor: 'error.main', color: 'white', borderRadius: '50%', p: 0.5 }}>
            <MicOff fontSize="small" />
          </Box>
        )}
        {!peer.videoTrack && (
          <Box sx={{ bgcolor: 'error.main', color: 'white', borderRadius: '50%', p: 0.5 }}>
            <VideocamOff fontSize="small" />
          </Box>
        )}
      </Box>
    </Card>
  );
};

// Main component with HMS Provider
const ExamProctoring: React.FC<ExamProctoringProps> = (props) => {
  return (
    <HMSRoomProvider>
      <ExamProctoringContent {...props} />
    </HMSRoomProvider>
  );
};

export default ExamProctoring;

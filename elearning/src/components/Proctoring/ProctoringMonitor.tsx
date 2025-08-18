import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  LinearProgress
} from '@mui/material';
import {
  Camera,
  CameraAlt,
  Mic,
  MicOff,
  Visibility,
  VisibilityOff,
  Warning,
  Security,
  Psychology,
  Person,
  PersonOff,
  VolumeUp,
  VolumeOff,
  TabUnselected,
  Fullscreen,
  FullscreenExit,
  Videocam
} from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';

interface ProctoringMonitorProps {
  onViolation: (violation: string) => void;
  requireCamera?: boolean;
  aiDetection?: boolean;
  onStatusChange?: (status: 'active' | 'inactive' | 'error') => void;
  assessmentId?: string;
  studentId?: string;
  enableLiveStreaming?: boolean;
}

interface ViolationEvent {
  type: 'face_not_detected' | 'multiple_faces' | 'tab_switch' | 'fullscreen_exit' | 'audio_detected' | 'suspicious_movement';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

const ProctoringMonitor: React.FC<ProctoringMonitorProps> = ({
  onViolation,
  requireCamera = true,
  aiDetection = true,
  onStatusChange,
  assessmentId,
  studentId,
  enableLiveStreaming = true
}) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // State
  const [isActive, setIsActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(false);
  const [micPermission, setMicPermission] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [violations, setViolations] = useState<ViolationEvent[]>([]);
  const [showViolations, setShowViolations] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Initialize proctoring
  useEffect(() => {
    initializeProctoring();
    setupEventListeners();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeProctoring = async () => {
    try {
      if (requireCamera) {
        await setupCamera();
      }
      await setupAudioMonitoring();
      
      if (enableLiveStreaming && assessmentId && studentId) {
        await setupSocketConnection();
      }
      
      setIsActive(true);
      onStatusChange?.('active');
    } catch (error: any) {
      setError(error.message);
      onStatusChange?.('error');
    }
  };

  const setupCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: true
      });

      streamRef.current = stream;
      setCameraPermission(true);
      setMicPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      if (aiDetection) {
        startFaceDetection();
      }
    } catch (error: any) {
      throw new Error('Camera access denied. Please allow camera access for proctored exam.');
    }
  };

  const setupAudioMonitoring = async () => {
    try {
      if (!streamRef.current) return;

      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      monitorAudioLevel();
    } catch (error) {
      console.warn('Audio monitoring setup failed:', error);
    }
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const checkAudio = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average);

      // Detect suspicious audio levels (potential cheating)
      if (average > 50) {
        recordViolation({
          type: 'audio_detected',
          timestamp: new Date(),
          severity: 'medium',
          description: 'Unusual audio activity detected'
        });
      }

      requestAnimationFrame(checkAudio);
    };

    checkAudio();
  };

  const startFaceDetection = () => {
    if (!videoRef.current || !canvasRef.current) return;

    detectionIntervalRef.current = setInterval(() => {
      detectFaces();
    }, 2000); // Check every 2 seconds
  };

  const detectFaces = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      // Simple face detection using basic image analysis
      // In a real implementation, you would use a proper face detection library
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const faceDetected = await performBasicFaceDetection(imageData);
      
      setFaceDetected(faceDetected);

      if (!faceDetected) {
        recordViolation({
          type: 'face_not_detected',
          timestamp: new Date(),
          severity: 'high',
          description: 'Student face not detected in camera view'
        });
      }
    } catch (error) {
      console.error('Face detection error:', error);
    }
  };

  const performBasicFaceDetection = async (imageData: ImageData): Promise<boolean> => {
    // This is a simplified face detection algorithm
    // In production, you would use libraries like face-api.js or MediaPipe
    const data = imageData.data;
    let skinPixels = 0;
    let totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Simple skin color detection
      if (r > 95 && g > 40 && b > 20 && 
          Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
          Math.abs(r - g) > 15 && r > g && r > b) {
        skinPixels++;
      }
    }

    const skinRatio = skinPixels / totalPixels;
    return skinRatio > 0.02; // At least 2% skin pixels indicates face presence
  };

  const setupEventListeners = () => {
    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount(prev => prev + 1);
        recordViolation({
          type: 'tab_switch',
          timestamp: new Date(),
          severity: 'high',
          description: 'Student switched to another tab or application'
        });
      }
    };

    // Fullscreen exit detection
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isFullscreen);
      
      if (!isFullscreen) {
        recordViolation({
          type: 'fullscreen_exit',
          timestamp: new Date(),
          severity: 'high',
          description: 'Student exited fullscreen mode'
        });
      }
    };

    // Keyboard shortcuts detection
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common cheating shortcuts
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 't')) ||
        (e.altKey && e.key === 'Tab') ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
        recordViolation({
          type: 'suspicious_movement',
          timestamp: new Date(),
          severity: 'medium',
          description: `Suspicious keyboard shortcut detected: ${e.key}`
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  };

  const recordViolation = useCallback((violation: ViolationEvent) => {
    setViolations(prev => [...prev, violation]);
    onViolation(violation.description);
    
    // Send violation to admin via socket
    if (socketRef.current && assessmentId && studentId) {
      socketRef.current.emit('proctoring_violation', {
        assessmentId,
        studentId,
        violation: {
          ...violation,
          timestamp: violation.timestamp.toISOString()
        }
      });
    }
  }, [onViolation, assessmentId, studentId]);

  // Setup socket connection for live streaming
  const setupSocketConnection = async () => {
    try {
      setConnectionStatus('connecting');
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      socketRef.current = io(backendUrl, {
        transports: ['websocket'],
        upgrade: true
      });

      socketRef.current.on('connect', () => {
        console.log('Socket connected for proctoring');
        setConnectionStatus('connected');
        
        // Join proctoring room
        socketRef.current?.emit('join_proctoring_session', {
          assessmentId,
          studentId,
          role: 'student'
        });
        
        // Start video streaming
        if (streamRef.current) {
          startVideoStreaming();
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnectionStatus('disconnected');
        setIsStreaming(false);
      });

      socketRef.current.on('admin_message', (data) => {
        // Handle messages from admin (warnings, auto-submit, etc.)
        if (data.type === 'warning') {
          recordViolation({
            type: 'suspicious_movement',
            timestamp: new Date(),
            severity: 'high',
            description: `Admin Warning: ${data.message}`
          });
        } else if (data.type === 'auto_submit') {
          // Trigger auto-submit
          window.dispatchEvent(new CustomEvent('admin_auto_submit', { 
            detail: { reason: data.message } 
          }));
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnectionStatus('disconnected');
      });

    } catch (error) {
      console.error('Failed to setup socket connection:', error);
      setConnectionStatus('disconnected');
    }
  };

  // Start video streaming to admin
  const startVideoStreaming = () => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;
    
    setIsStreaming(true);
    
    streamingIntervalRef.current = setInterval(() => {
      captureAndSendFrame();
    }, 1000); // Send frame every second
  };

  // Capture video frame and send to admin
  const captureAndSendFrame = () => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0);
    
    // Convert to base64 image
    const imageData = canvas.toDataURL('image/jpeg', 0.7);
    
    // Send frame to admin
    socketRef.current.emit('video_frame', {
      assessmentId,
      studentId,
      frame: imageData,
      timestamp: new Date().toISOString(),
      metadata: {
        faceDetected,
        audioLevel,
        violations: violations.length,
        tabSwitches: tabSwitchCount
      }
    });
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
    
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    setIsActive(false);
    setIsStreaming(false);
    setConnectionStatus('disconnected');
    onStatusChange?.('inactive');
  };

  const getViolationIcon = (type: ViolationEvent['type']) => {
    switch (type) {
      case 'face_not_detected':
        return <PersonOff color="error" />;
      case 'multiple_faces':
        return <Person color="warning" />;
      case 'tab_switch':
        return <TabUnselected color="error" />;
      case 'fullscreen_exit':
        return <FullscreenExit color="error" />;
      case 'audio_detected':
        return <VolumeUp color="warning" />;
      case 'suspicious_movement':
        return <Warning color="warning" />;
      default:
        return <Warning />;
    }
  };

  const getSeverityColor = (severity: ViolationEvent['severity']) => {
    switch (severity) {
      case 'low':
        return 'info';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ position: 'fixed', top: 80, right: 16, zIndex: 9999 }}>
        Proctoring Error: {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Proctoring Status Bar */}
      <Paper
        sx={{
          position: 'fixed',
          top: 80,
          right: 16,
          p: 2,
          zIndex: 9999,
          minWidth: 300,
          bgcolor: isActive ? 'success.light' : 'error.light'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security color={isActive ? 'success' : 'error'} />
            Proctoring {isActive ? 'Active' : 'Inactive'}
          </Typography>
          <IconButton size="small" onClick={() => setShowViolations(true)}>
            <Visibility />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={faceDetected ? <Person /> : <PersonOff />}
            label="Face"
            color={faceDetected ? 'success' : 'error'}
            size="small"
          />
          <Chip
            icon={cameraPermission ? <Camera /> : <CameraAlt />}
            label="Camera"
            color={cameraPermission ? 'success' : 'error'}
            size="small"
          />
          <Chip
            icon={micPermission ? <Mic /> : <MicOff />}
            label="Mic"
            color={micPermission ? 'success' : 'error'}
            size="small"
          />
          {enableLiveStreaming && (
            <Chip
              icon={<Videocam />}
              label={isStreaming ? 'Streaming' : connectionStatus === 'connecting' ? 'Connecting' : 'Offline'}
              color={isStreaming ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'error'}
              size="small"
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption">
            Violations: {violations.length}
          </Typography>
          <Typography variant="caption">
            Tab switches: {tabSwitchCount}
          </Typography>
        </Box>

        {audioLevel > 0 && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption">Audio Level:</Typography>
            <LinearProgress 
              variant="determinate" 
              value={Math.min(audioLevel * 2, 100)} 
              sx={{ height: 4 }}
            />
          </Box>
        )}
      </Paper>

      {/* Hidden video element for face detection */}
      {requireCamera && (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999 }}>
          <Paper sx={{ p: 1 }}>
            <video
              ref={videoRef}
              width={160}
              height={120}
              autoPlay
              muted
              style={{ borderRadius: 4 }}
            />
            <canvas
              ref={canvasRef}
              style={{ display: 'none' }}
            />
          </Paper>
        </Box>
      )}

      {/* Violations Dialog */}
      <Dialog
        open={showViolations}
        onClose={() => setShowViolations(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Proctoring Violations
          <Typography variant="body2" color="text.secondary">
            Total violations: {violations.length}
          </Typography>
        </DialogTitle>
        <DialogContent>
          {violations.length === 0 ? (
            <Typography color="text.secondary">
              No violations detected.
            </Typography>
          ) : (
            <List>
              {violations.slice().reverse().map((violation, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getViolationIcon(violation.type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={violation.description}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={violation.severity}
                          color={getSeverityColor(violation.severity) as any}
                          size="small"
                        />
                        <Typography variant="caption">
                          {violation.timestamp.toLocaleTimeString()}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowViolations(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProctoringMonitor;
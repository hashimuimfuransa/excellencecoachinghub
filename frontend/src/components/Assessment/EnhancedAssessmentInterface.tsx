import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  Snackbar
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Fullscreen,
  FullscreenExit,
  Warning,
  Security,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';

// Custom Button component that completely avoids theme access issues
const SafeButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'contained' | 'outlined' | 'text';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  disabled?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  sx?: any;
  className?: string;
}> = ({ 
  children, 
  onClick, 
  variant = 'contained', 
  color = 'primary', 
  disabled = false,
  fullWidth = false,
  size = 'medium',
  startIcon,
  endIcon,
  sx = {},
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const colorMap = {
    primary: { main: '#1976d2', dark: '#1565c0', light: '#42a5f5', contrastText: '#ffffff' },
    secondary: { main: '#dc004e', dark: '#9a0036', light: '#ff5983', contrastText: '#ffffff' },
    success: { main: '#4caf50', dark: '#388e3c', light: '#81c784', contrastText: '#ffffff' },
    error: { main: '#f44336', dark: '#d32f2f', light: '#e57373', contrastText: '#ffffff' },
    warning: { main: '#ff9800', dark: '#f57c00', light: '#ffb74d', contrastText: '#000000' },
    info: { main: '#2196f3', dark: '#1976d2', light: '#64b5f6', contrastText: '#ffffff' }
  };

  const getButtonStyles = (): React.CSSProperties => {
    const colorScheme = colorMap[color];
    
    const baseStyles: React.CSSProperties = {
      padding: size === 'small' ? '6px 12px' : size === 'large' ? '12px 24px' : '8px 16px',
      borderRadius: '4px',
      textTransform: 'none',
      fontWeight: 500,
      fontSize: size === 'small' ? '0.8125rem' : size === 'large' ? '0.9375rem' : '0.875rem',
      minWidth: size === 'small' ? '64px' : '80px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      border: 'none',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      width: fullWidth ? '100%' : 'auto',
      transition: 'all 0.2s ease-in-out',
      fontFamily: 'inherit',
      outline: 'none',
      textDecoration: 'none',
      boxSizing: 'border-box',
      userSelect: 'none',
      ...sx
    };

    if (disabled) {
      return {
        ...baseStyles,
        backgroundColor: '#e0e0e0',
        color: '#9e9e9e',
        opacity: 0.6,
        cursor: 'not-allowed'
      };
    }

    if (variant === 'contained') {
      return {
        ...baseStyles,
        backgroundColor: isHovered ? colorScheme.dark : colorScheme.main,
        color: colorScheme.contrastText,
        boxShadow: isHovered ? '0 2px 8px rgba(0,0,0,0.15)' : '0 1px 3px rgba(0,0,0,0.12)'
      };
    } else if (variant === 'outlined') {
      return {
        ...baseStyles,
        backgroundColor: isHovered ? `${colorScheme.main}08` : 'transparent',
        color: colorScheme.main,
        border: `1px solid ${colorScheme.main}`,
        borderColor: isHovered ? colorScheme.dark : colorScheme.main
      };
    } else {
      return {
        ...baseStyles,
        backgroundColor: isHovered ? `${colorScheme.main}08` : 'transparent',
        color: colorScheme.main
      };
    }
  };

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={getButtonStyles()}
      disabled={disabled}
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {startIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{startIcon}</span>}
      {children}
      {endIcon && <span style={{ display: 'flex', alignItems: 'center' }}>{endIcon}</span>}
    </button>
  );
};

interface EnhancedAssessmentInterfaceProps {
  assessmentId: string;
  studentId: string;
  assessmentTitle: string;
  onStart: () => void;
  onViolation: (violation: string) => void;
  children: React.ReactNode;
}

interface AdminMessage {
  type: 'warning' | 'auto_submit';
  message: string;
  timestamp: string;
}

const EnhancedAssessmentInterface: React.FC<EnhancedAssessmentInterfaceProps> = ({
  assessmentId,
  studentId,
  assessmentTitle,
  onStart,
  onViolation,
  children
}) => {
  const { user } = useAuth();
  // Proctoring setup state (fullscreen step removed)
  const [setupStep, setSetupStep] = useState<'initial' | 'camera' | 'ready' | 'started'>('initial');
  const [cameraPermission, setCameraPermission] = useState<'pending' | 'granted' | 'denied'>('pending');
  // Fullscreen functionality removed as requested
  // const [fullscreenActive, setFullscreenActive] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  
  // Proctoring monitoring state
  const [violations, setViolations] = useState<string[]>([]);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [faceDetected, setFaceDetected] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Admin communication
  const [adminMessage, setAdminMessage] = useState<AdminMessage | null>(null);
  const [showAdminMessage, setShowAdminMessage] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const frameIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Initialize socket connection
  useEffect(() => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    socketRef.current = io(backendUrl, {
      transports: ['websocket'],
      upgrade: true
    });

    socketRef.current.on('connect', () => {
      console.log('Student socket connected for proctoring');
      setConnectionStatus('connected');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Student socket disconnected');
      setConnectionStatus('disconnected');
    });

    socketRef.current.on('admin_message', (data: AdminMessage) => {
      console.log('Received admin message:', data);
      setAdminMessage(data);
      setShowAdminMessage(true);
      
      if (data.type === 'auto_submit') {
        // Force submit the assessment
        handleAutoSubmit(data.message);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Monitor tab visibility and focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (setupStep === 'started' && document.hidden) {
        const violation = 'Tab switched or window minimized';
        setTabSwitches(prev => prev + 1);
        setViolations(prev => [...prev, violation]);
        onViolation(violation);
        reportViolation('tab_switch', violation, 'medium');
      }
    };

    const handleFocusChange = () => {
      if (setupStep === 'started' && !document.hasFocus()) {
        const violation = 'Window lost focus';
        setViolations(prev => [...prev, violation]);
        onViolation(violation);
        reportViolation('focus_loss', violation, 'low');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleFocusChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleFocusChange);
    };
  }, [setupStep, onViolation]);

  // Fullscreen monitoring removed as requested
  // useEffect(() => {
  //   const handleFullscreenChange = () => {
  //     const isFullscreen = !!document.fullscreenElement;
  //     setFullscreenActive(isFullscreen);
  //     
  //     // If we just entered fullscreen during setup, move to ready step
  //     if (isFullscreen && (setupStep === 'camera' || setupStep === 'fullscreen')) {
  //       setSetupStep('ready');
  //     }
  //     
  //     // If we exited fullscreen during the assessment, record violation
  //     if (setupStep === 'started' && !isFullscreen) {
  //       const violation = 'Exited fullscreen mode';
  //       setViolations(prev => [...prev, violation]);
  //       onViolation(violation);
  //       reportViolation('fullscreen_exit', violation, 'high');
  //     }
  //   };

  //   document.addEventListener('fullscreenchange', handleFullscreenChange);
  //   return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  // }, [setupStep, onViolation]);

  // Prevent right-click and keyboard shortcuts
  useEffect(() => {
    if (setupStep === 'started') {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        const violation = 'Right-click attempted';
        setViolations(prev => [...prev, violation]);
        onViolation(violation);
        reportViolation('right_click', violation, 'low');
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        // Prevent common shortcuts
        if (
          (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'a' || e.key === 't' || e.key === 'w')) ||
          e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          e.altKey && e.key === 'Tab'
        ) {
          e.preventDefault();
          const violation = `Keyboard shortcut attempted: ${e.ctrlKey ? 'Ctrl+' : ''}${e.altKey ? 'Alt+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`;
          setViolations(prev => [...prev, violation]);
          onViolation(violation);
          reportViolation('keyboard_shortcut', violation, 'medium');
        }
      };

      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [setupStep, onViolation]);

  const requestCameraPermission = async () => {
    try {
      setSetupError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        }, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setCameraPermission('granted');
      setSetupStep('ready'); // Skip fullscreen step, go directly to ready
      
      // Setup audio monitoring
      setupAudioMonitoring(stream);
      
    } catch (error: any) {
      console.error('Camera permission denied:', error);
      setCameraPermission('denied');
      setSetupError('Camera access is required for proctored assessments. Please allow camera access and try again.');
    }
  };

  const setupAudioMonitoring = (stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      source.connect(analyserRef.current);
      
      // Monitor audio levels
      const monitorAudio = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          
          // Check for suspicious audio levels
          if (average > 100) {
            const violation = 'High audio level detected';
            reportViolation('audio_level', violation, 'low');
          }
        }
        
        if (setupStep === 'started') {
          requestAnimationFrame(monitorAudio);
        }
      };
      
      monitorAudio();
    } catch (error) {
      console.error('Audio monitoring setup failed:', error);
    }
  };

  // Fullscreen functionality removed
  // const enterFullscreen = async () => {
  //   try {
  //     setSetupError(null);
  //     await document.documentElement.requestFullscreen();
  //     // The fullscreen change event will handle setting fullscreenActive to true
  //     // and updating the setup step to 'ready'
  //   } catch (error) {
  //     console.error('Fullscreen request failed:', error);
  //     setSetupError('Fullscreen mode is required for proctored assessments. Please click the fullscreen button and allow fullscreen access.');
  //   }
  // };

  const startAssessment = () => {
    if (!socketRef.current) {
      setSetupError('Connection to proctoring server failed. Please refresh and try again.');
      return;
    }

    // Join proctoring session
    socketRef.current.emit('join_proctoring_session', {
      role: 'student',
      studentId,
      assessmentId,
      assessmentTitle,
      studentName: user ? `${user.firstName} ${user.lastName}` : 'Unknown Student',
      studentEmail: user?.email || 'unknown@email.com'
    });

    setSetupStep('started');
    onStart();
    
    // Start video frame capture
    startVideoCapture();
  };

  const startVideoCapture = () => {
    if (!videoRef.current || !canvasRef.current || !socketRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Higher resolution for better admin monitoring
    canvas.width = 480; 
    canvas.height = 360;

    const captureFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 with better quality for admin monitoring
        const frameData = canvas.toDataURL('image/jpeg', 0.8);
        
        // Simple face detection (check if there's significant content in face area)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const faceArea = ctx.getImageData(
          canvas.width * 0.25, 
          canvas.height * 0.2, 
          canvas.width * 0.5, 
          canvas.height * 0.4
        );
        
        // Basic face detection based on pixel variance
        const variance = calculatePixelVariance(faceArea.data);
        const currentFaceDetected = variance > 1000; // Threshold for face detection
        
        if (currentFaceDetected !== faceDetected) {
          setFaceDetected(currentFaceDetected);
          if (!currentFaceDetected) {
            const violation = 'Face not detected in camera';
            setViolations(prev => [...prev, violation]);
            onViolation(violation);
            reportViolation('no_face', violation, 'high');
          }
        }

        // Send frame to server with enhanced metadata
        socketRef.current?.emit('video_frame', {
          studentId,
          assessmentId,
          frame: frameData,
          timestamp: new Date().toISOString(),
          metadata: {
            faceDetected: currentFaceDetected,
            audioLevel,
            violations: violations.length,
            tabSwitches,
            windowFocused: document.hasFocus(),
            resolution: `${canvas.width}x${canvas.height}`
          }
        });
      }
    };

    // Capture frames every 1.5 seconds for better monitoring
    frameIntervalRef.current = setInterval(captureFrame, 1500);
  };

  const calculatePixelVariance = (pixels: Uint8ClampedArray): number => {
    let sum = 0;
    let sumSquares = 0;
    const length = pixels.length / 4; // RGBA, so divide by 4

    for (let i = 0; i < pixels.length; i += 4) {
      const gray = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      sum += gray;
      sumSquares += gray * gray;
    }

    const mean = sum / length;
    const variance = (sumSquares / length) - (mean * mean);
    return variance;
  };

  const reportViolation = (type: string, description: string, severity: 'low' | 'medium' | 'high') => {
    if (socketRef.current) {
      socketRef.current.emit('proctoring_violation', {
        studentId,
        assessmentId,
        violation: {
          type,
          description,
          severity,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  const handleAutoSubmit = (reason: string) => {
    // This would trigger the parent component to submit the assessment
    alert(`Assessment will be auto-submitted: ${reason}`);
    // You might want to call a callback prop here to handle the actual submission
  };

  const cleanup = useCallback(() => {
    if (frameIntervalRef.current) {
      clearInterval(frameIntervalRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    // Fullscreen cleanup removed
    // if (document.fullscreenElement) {
    //   document.exitFullscreen();
    // }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  if (setupStep !== 'started') {
    return (
      <Dialog open={true} maxWidth="md" fullWidth disableEscapeKeyDown>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security sx={{ color: '#1976d2' }} />
            <Typography variant="h6">Proctored Assessment Setup</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              {assessmentTitle}
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              This is a proctored assessment. Your camera will be monitored throughout the exam.
            </Alert>

            {setupError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {setupError}
              </Alert>
            )}

            {/* Setup Steps */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Setup Requirements:
              </Typography>
              
              {/* Camera Permission */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {cameraPermission === 'granted' ? (
                  <CheckCircle sx={{ mr: 1, color: '#4caf50' }} />
                ) : cameraPermission === 'denied' ? (
                  <ErrorIcon sx={{ mr: 1, color: '#f44336' }} />
                ) : (
                  <Videocam sx={{ mr: 1, color: '#666666' }} />
                )}
                <Typography>
                  Camera Access {cameraPermission === 'granted' ? '✓' : ''}
                </Typography>
              </Box>

              {/* Fullscreen requirement removed */}

              {/* Connection Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {connectionStatus === 'connected' ? (
                  <CheckCircle sx={{ mr: 1, color: '#4caf50' }} />
                ) : (
                  <Warning sx={{ mr: 1, color: '#ff9800' }} />
                )}
                <Typography>
                  Proctoring Connection: {connectionStatus}
                </Typography>
              </Box>
            </Box>

            {/* Camera Preview */}
            {cameraPermission === 'granted' && (
              <Box sx={{ mb: 3, textAlign: 'center' }}>
                <Typography variant="subtitle2" gutterBottom>
                  Camera Preview:
                </Typography>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  style={{
                    width: '300px',
                    height: '225px',
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                  }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
              </Box>
            )}

            {/* Instructions */}
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>Important Guidelines:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • Keep your face visible in the camera at all times
                <br />
                • Do not switch tabs or minimize the window
                <br />
                • Do not use external resources or communication tools
                <br />
                • Stay focused on the assessment window
                <br />
                • Any violations will be recorded and may result in automatic submission
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          {setupStep === 'initial' && (
            <SafeButton
              onClick={requestCameraPermission}
              startIcon={<Videocam />}
            >
              Enable Camera
            </SafeButton>
          )}
          
          {/* Fullscreen buttons removed */}
          
          {setupStep === 'ready' && (
            <SafeButton
              onClick={startAssessment}
              disabled={connectionStatus !== 'connected'}
              color="success"
            >
              Start Assessment
            </SafeButton>
          )}
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Box sx={{ position: 'relative', minHeight: '100vh' }}>
      {/* Proctoring Status Bar */}
      <Paper 
        sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1300,
          p: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f44336',
          color: '#ffffff'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Security />
          <Typography variant="body2" fontWeight="bold">
            PROCTORED ASSESSMENT
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            icon={faceDetected ? <CheckCircle /> : <Warning />}
            label={faceDetected ? 'Face Detected' : 'No Face'}
            sx={{
              backgroundColor: faceDetected ? '#4caf50' : '#f44336',
              color: '#ffffff',
            }}
          />
          
          {violations.length > 0 && (
            <Chip
              size="small"
              icon={<Warning />}
              label={`${violations.length} Violations`}
              sx={{
                backgroundColor: '#f44336',
                color: '#ffffff',
              }}
            />
          )}
          
          <Chip
            size="small"
            label={`Connection: ${connectionStatus}`}
            sx={{
              backgroundColor: connectionStatus === 'connected' ? '#4caf50' : '#f44336',
              color: '#ffffff',
            }}
          />
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ pt: 7 }}>
        {children}
      </Box>

      {/* Hidden video for continuous monitoring */}
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 150,
          height: 100,
          border: '2px solid #f44336',
          borderRadius: 8,
          zIndex: 1300
        }}
      />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Admin Message Snackbar */}
      <Snackbar
        open={showAdminMessage}
        autoHideDuration={adminMessage?.type === 'auto_submit' ? null : 6000}
        onClose={() => setShowAdminMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={adminMessage?.type === 'auto_submit' ? 'error' : 'warning'}
          onClose={() => setShowAdminMessage(false)}
          sx={{ minWidth: 400 }}
        >
          <Typography variant="body2" fontWeight="bold">
            {adminMessage?.type === 'auto_submit' ? 'Assessment Auto-Submit' : 'Proctor Warning'}
          </Typography>
          <Typography variant="body2">
            {adminMessage?.message}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnhancedAssessmentInterface;
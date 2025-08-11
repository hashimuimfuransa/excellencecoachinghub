import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Alert,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  LinearProgress
} from '@mui/material';
import {
  Videocam,
  VideocamOff,
  Warning,
  Security,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

interface ProctoringMonitorProps {
  assessmentId: string;
  isActive: boolean;
  onViolation: (violation: ProctoringViolation) => void;
  onStatusChange: (status: ProctoringStatus) => void;
}

export interface ProctoringViolation {
  type: 'tab_switch' | 'face_not_detected' | 'multiple_faces' | 'suspicious_movement' | 'window_blur' | 'fullscreen_exit';
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ProctoringStatus {
  isActive: boolean;
  cameraEnabled: boolean;
  faceDetected: boolean;
  violations: ProctoringViolation[];
  warningCount: number;
}

const ProctoringMonitor: React.FC<ProctoringMonitorProps> = ({
  assessmentId,
  isActive,
  onViolation,
  onStatusChange
}) => {
  // State management
  const [status, setStatus] = useState<ProctoringStatus>({
    isActive: false,
    cameraEnabled: false,
    faceDetected: false,
    violations: [],
    warningCount: 0
  });
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [currentViolation, setCurrentViolation] = useState<ProctoringViolation | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const violationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera and face detection
  const initializeCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        setStatus(prev => ({ ...prev, cameraEnabled: true }));
        setPermissionDenied(false);
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      setPermissionDenied(true);
      setStatus(prev => ({ ...prev, cameraEnabled: false }));
      
      // Report violation for camera denial
      const violation: ProctoringViolation = {
        type: 'face_not_detected',
        timestamp: new Date(),
        severity: 'high',
        description: 'Camera access denied or not available'
      };
      handleViolation(violation);
    }
  }, []);

  // Face detection using basic video analysis
  const detectFace = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isActive) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for analysis
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Simple face detection based on skin tone and movement
    let skinPixels = 0;
    let totalPixels = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Basic skin tone detection
      if (r > 95 && g > 40 && b > 20 && 
          Math.max(r, g, b) - Math.min(r, g, b) > 15 &&
          Math.abs(r - g) > 15 && r > g && r > b) {
        skinPixels++;
      }
    }

    const skinRatio = skinPixels / totalPixels;
    const faceDetected = skinRatio > 0.02; // Threshold for face detection

    setStatus(prev => ({ ...prev, faceDetected }));

    // Check for violations
    if (!faceDetected) {
      const violation: ProctoringViolation = {
        type: 'face_not_detected',
        timestamp: new Date(),
        severity: 'medium',
        description: 'Face not detected in camera view'
      };
      handleViolation(violation);
    }
  }, [isActive]);

  // Handle proctoring violations
  const handleViolation = useCallback((violation: ProctoringViolation) => {
    setStatus(prev => {
      const newViolations = [...prev.violations, violation];
      const newWarningCount = prev.warningCount + 1;
      
      const newStatus = {
        ...prev,
        violations: newViolations,
        warningCount: newWarningCount
      };

      onStatusChange(newStatus);
      return newStatus;
    });

    setCurrentViolation(violation);
    setShowWarningDialog(true);
    onViolation(violation);

    // Auto-close warning after 5 seconds
    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
    }
    violationTimeoutRef.current = setTimeout(() => {
      setShowWarningDialog(false);
    }, 5000);
  }, [onViolation, onStatusChange]);

  // Monitor tab switching and window focus
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const violation: ProctoringViolation = {
          type: 'tab_switch',
          timestamp: new Date(),
          severity: 'high',
          description: 'Student switched tabs or minimized window'
        };
        handleViolation(violation);
      }
    };

    const handleWindowBlur = () => {
      const violation: ProctoringViolation = {
        type: 'window_blur',
        timestamp: new Date(),
        severity: 'medium',
        description: 'Window lost focus'
      };
      handleViolation(violation);
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        const violation: ProctoringViolation = {
          type: 'fullscreen_exit',
          timestamp: new Date(),
          severity: 'high',
          description: 'Student exited fullscreen mode'
        };
        handleViolation(violation);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isActive, handleViolation]);

  // Start/stop proctoring
  useEffect(() => {
    if (isActive) {
      initializeCamera();
      
      // Start face detection
      detectionIntervalRef.current = setInterval(detectFace, 2000); // Check every 2 seconds
      
      setStatus(prev => ({ ...prev, isActive: true }));
    } else {
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      // Clear intervals
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
        detectionIntervalRef.current = null;
      }
      
      setStatus(prev => ({ 
        ...prev, 
        isActive: false, 
        cameraEnabled: false, 
        faceDetected: false 
      }));
    }

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
      }
    };
  }, [isActive, initializeCamera, detectFace]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      {/* Proctoring Status Bar */}
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 9999,
        bgcolor: status.isActive ? 'success.main' : 'error.main',
        color: 'white',
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Security />
          <Typography variant="body2">
            Proctoring: {status.isActive ? 'Active' : 'Inactive'}
          </Typography>
          
          <Chip
            icon={status.cameraEnabled ? <Videocam /> : <VideocamOff />}
            label={status.cameraEnabled ? 'Camera On' : 'Camera Off'}
            size="small"
            color={status.cameraEnabled ? 'success' : 'error'}
            variant="outlined"
          />
          
          <Chip
            icon={status.faceDetected ? <Visibility /> : <VisibilityOff />}
            label={status.faceDetected ? 'Face Detected' : 'No Face'}
            size="small"
            color={status.faceDetected ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2">
            Warnings: {status.warningCount}
          </Typography>
          {status.warningCount > 0 && (
            <Warning color="warning" />
          )}
        </Box>
      </Box>

      {/* Hidden video element for face detection */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{ display: 'none' }}
      />
      
      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Permission Denied Alert */}
      {permissionDenied && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Camera access is required for proctoring. Please enable camera permissions and refresh the page.
        </Alert>
      )}

      {/* Violation Warning Dialog */}
      <Dialog
        open={showWarningDialog}
        onClose={() => setShowWarningDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          bgcolor: 'error.main', 
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <Warning />
          Proctoring Violation Detected
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {currentViolation && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {currentViolation.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Severity: {currentViolation.severity.toUpperCase()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Time: {currentViolation.timestamp.toLocaleTimeString()}
              </Typography>
              
              <Alert severity="warning" sx={{ mt: 2 }}>
                Multiple violations may result in automatic submission of your assessment.
                Please ensure you follow all proctoring guidelines.
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowWarningDialog(false)}
            variant="contained"
            color="primary"
          >
            I Understand
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProctoringMonitor;

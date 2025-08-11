import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as blazeface from '@tensorflow-models/blazeface';
import { Box, Typography, Chip } from '@mui/material';
import { Face, Warning, CheckCircle } from '@mui/icons-material';

interface ViolationData {
  type: 'face_not_detected' | 'multiple_faces' | 'looking_away' | 'suspicious_movement';
  confidence: number;
  timestamp: Date;
  description: string;
}

interface AIBehaviorDetectorProps {
  videoElementId: string;
  onViolationDetected: (violation: ViolationData) => void;
  isActive: boolean;
  detectionInterval?: number; // milliseconds
  confidenceThreshold?: number; // 0-1
}

interface DetectionState {
  faceDetected: boolean;
  faceCount: number;
  eyeGazeDirection: 'center' | 'left' | 'right' | 'up' | 'down' | 'unknown';
  lastFacePosition: { x: number; y: number } | null;
  consecutiveViolations: number;
  lastViolationTime: Date | null;
}

const AIBehaviorDetector: React.FC<AIBehaviorDetectorProps> = ({
  videoElementId,
  onViolationDetected,
  isActive,
  detectionInterval = 1000, // Check every second
  confidenceThreshold = 0.7
}) => {
  const [model, setModel] = useState<blazeface.BlazeFaceModel | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [detectionState, setDetectionState] = useState<DetectionState>({
    faceDetected: false,
    faceCount: 0,
    eyeGazeDirection: 'unknown',
    lastFacePosition: null,
    consecutiveViolations: 0,
    lastViolationTime: null
  });

  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const violationCooldownRef = useRef<Map<string, Date>>(new Map());

  // Initialize TensorFlow.js and load BlazeFace model
  useEffect(() => {
    const initializeModel = async () => {
      try {
        setIsModelLoading(true);
        
        // Set TensorFlow.js backend
        await tf.ready();
        console.log('🤖 TensorFlow.js initialized');

        // Load BlazeFace model for face detection
        const blazefaceModel = await blazeface.load();
        setModel(blazefaceModel);
        
        console.log('✅ BlazeFace model loaded successfully');
      } catch (error) {
        console.error('❌ Error loading AI models:', error);
      } finally {
        setIsModelLoading(false);
      }
    };

    initializeModel();

    // Cleanup
    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, []);

  // Start/stop detection based on isActive prop
  useEffect(() => {
    if (isActive && model && !isModelLoading) {
      startDetection();
    } else {
      stopDetection();
    }

    return () => {
      stopDetection();
    };
  }, [isActive, model, isModelLoading]);

  // Start behavior detection
  const startDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }

    detectionIntervalRef.current = setInterval(() => {
      performDetection();
    }, detectionInterval);

    console.log('🔍 AI behavior detection started');
  }, [detectionInterval]);

  // Stop behavior detection
  const stopDetection = useCallback(() => {
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    console.log('⏹️ AI behavior detection stopped');
  }, []);

  // Perform AI-based behavior detection
  const performDetection = useCallback(async () => {
    if (!model || !isActive) return;

    const videoElement = document.getElementById(videoElementId) as HTMLVideoElement;
    if (!videoElement || videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
      return;
    }

    try {
      // Detect faces using BlazeFace
      const predictions = await model.estimateFaces(videoElement, false);
      
      const currentTime = new Date();
      const newDetectionState: DetectionState = {
        faceDetected: predictions.length > 0,
        faceCount: predictions.length,
        eyeGazeDirection: 'unknown',
        lastFacePosition: null,
        consecutiveViolations: detectionState.consecutiveViolations,
        lastViolationTime: detectionState.lastViolationTime
      };

      // Analyze face detection results
      if (predictions.length === 0) {
        // No face detected
        await handleViolation({
          type: 'face_not_detected',
          confidence: 0.9,
          timestamp: currentTime,
          description: 'No face detected in the camera view. Please ensure you are visible to the camera.'
        });
        newDetectionState.consecutiveViolations += 1;
      } else if (predictions.length > 1) {
        // Multiple faces detected
        await handleViolation({
          type: 'multiple_faces',
          confidence: 0.95,
          timestamp: currentTime,
          description: `${predictions.length} faces detected. Only the exam taker should be visible.`
        });
        newDetectionState.consecutiveViolations += 1;
      } else {
        // Single face detected - analyze gaze and position
        const face = predictions[0];

        // Extract coordinates from BlazeFace prediction
        let topLeft: number[], bottomRight: number[];

        if (Array.isArray(face.topLeft)) {
          topLeft = face.topLeft as number[];
        } else {
          // Handle Tensor1D case
          const topLeftData = await (face.topLeft as any).data();
          topLeft = [topLeftData[0], topLeftData[1]];
        }

        if (Array.isArray(face.bottomRight)) {
          bottomRight = face.bottomRight as number[];
        } else {
          // Handle Tensor1D case
          const bottomRightData = await (face.bottomRight as any).data();
          bottomRight = [bottomRightData[0], bottomRightData[1]];
        }

        const faceBox = [...topLeft, ...bottomRight] as [number, number, number, number];
        
        // Calculate face center
        const faceCenterX = (faceBox[0] + faceBox[2]) / 2;
        const faceCenterY = (faceBox[1] + faceBox[3]) / 2;
        
        newDetectionState.lastFacePosition = { x: faceCenterX, y: faceCenterY };

        // Analyze eye gaze direction (simplified heuristic)
        const gazeDirection = analyzeGazeDirection(face, videoElement);
        newDetectionState.eyeGazeDirection = gazeDirection;

        // Check for looking away violation
        if (gazeDirection !== 'center' && gazeDirection !== 'unknown') {
          await handleViolation({
            type: 'looking_away',
            confidence: 0.7,
            timestamp: currentTime,
            description: `Looking ${gazeDirection}. Please maintain focus on the exam screen.`
          });
          newDetectionState.consecutiveViolations += 1;
        } else {
          // Reset consecutive violations if behavior is normal
          newDetectionState.consecutiveViolations = Math.max(0, newDetectionState.consecutiveViolations - 1);
        }

        // Check for suspicious movement (rapid position changes)
        if (detectionState.lastFacePosition) {
          const movement = calculateMovement(detectionState.lastFacePosition, newDetectionState.lastFacePosition);
          if (movement > 50) { // Threshold for suspicious movement
            await handleViolation({
              type: 'suspicious_movement',
              confidence: 0.6,
              timestamp: currentTime,
              description: 'Rapid head movement detected. Please remain steady during the exam.'
            });
          }
        }
      }

      setDetectionState(newDetectionState);

    } catch (error) {
      console.error('❌ Error during AI detection:', error);
    }
  }, [model, isActive, videoElementId, detectionState]);

  // Handle violation detection with cooldown
  const handleViolation = useCallback(async (violation: ViolationData) => {
    const now = new Date();
    const cooldownKey = violation.type;
    const lastViolationTime = violationCooldownRef.current.get(cooldownKey);
    
    // Apply cooldown to prevent spam (30 seconds between same violation types)
    if (lastViolationTime && (now.getTime() - lastViolationTime.getTime()) < 30000) {
      return;
    }

    // Only trigger if confidence is above threshold
    if (violation.confidence >= confidenceThreshold) {
      violationCooldownRef.current.set(cooldownKey, now);
      onViolationDetected(violation);
      console.log('🚨 Violation detected:', violation);
    }
  }, [confidenceThreshold, onViolationDetected]);

  // Analyze gaze direction based on face landmarks (simplified)
  const analyzeGazeDirection = (face: any, videoElement: HTMLVideoElement): DetectionState['eyeGazeDirection'] => {
    try {
      // This is a simplified gaze detection
      // In a real implementation, you would use more sophisticated eye tracking
      const faceBox = face.topLeft.concat(face.bottomRight) as [number, number, number, number];
      const faceWidth = faceBox[2] - faceBox[0];
      const faceHeight = faceBox[3] - faceBox[1];
      const faceCenterX = (faceBox[0] + faceBox[2]) / 2;
      const faceCenterY = (faceBox[1] + faceBox[3]) / 2;
      
      const videoWidth = videoElement.videoWidth;
      const videoHeight = videoElement.videoHeight;
      
      // Calculate relative position
      const relativeX = faceCenterX / videoWidth;
      const relativeY = faceCenterY / videoHeight;
      
      // Simple heuristic for gaze direction
      if (relativeX < 0.3) return 'left';
      if (relativeX > 0.7) return 'right';
      if (relativeY < 0.3) return 'up';
      if (relativeY > 0.7) return 'down';
      
      return 'center';
    } catch (error) {
      return 'unknown';
    }
  };

  // Calculate movement between two positions
  const calculateMovement = (pos1: { x: number; y: number }, pos2: { x: number; y: number }): number => {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Get status color based on detection state
  const getStatusColor = (): 'success' | 'warning' | 'error' => {
    if (!detectionState.faceDetected) return 'error';
    if (detectionState.faceCount > 1) return 'error';
    if (detectionState.eyeGazeDirection !== 'center' && detectionState.eyeGazeDirection !== 'unknown') return 'warning';
    return 'success';
  };

  // Get status text
  const getStatusText = (): string => {
    if (isModelLoading) return 'Loading AI models...';
    if (!isActive) return 'Detection inactive';
    if (!detectionState.faceDetected) return 'No face detected';
    if (detectionState.faceCount > 1) return `${detectionState.faceCount} faces detected`;
    if (detectionState.eyeGazeDirection === 'center') return 'Monitoring active';
    if (detectionState.eyeGazeDirection !== 'unknown') return `Looking ${detectionState.eyeGazeDirection}`;
    return 'Monitoring active';
  };

  // Get status icon
  const getStatusIcon = () => {
    const color = getStatusColor();
    if (color === 'error') return <Warning />;
    if (color === 'warning') return <Face />;
    return <CheckCircle />;
  };

  return (
    <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1000 }}>
      <Chip
        icon={getStatusIcon()}
        label={getStatusText()}
        color={getStatusColor()}
        size="small"
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.9)',
          '& .MuiChip-icon': {
            color: 'inherit'
          }
        }}
      />
      
      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && isActive && (
        <Box sx={{ mt: 1, p: 1, bgcolor: 'rgba(0, 0, 0, 0.7)', borderRadius: 1 }}>
          <Typography variant="caption" color="white" display="block">
            Faces: {detectionState.faceCount}
          </Typography>
          <Typography variant="caption" color="white" display="block">
            Gaze: {detectionState.eyeGazeDirection}
          </Typography>
          <Typography variant="caption" color="white" display="block">
            Violations: {detectionState.consecutiveViolations}
          </Typography>
        </Box>
      )}
      
      {/* Hidden canvas for processing (if needed) */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        width={640}
        height={480}
      />
    </Box>
  );
};

export default AIBehaviorDetector;

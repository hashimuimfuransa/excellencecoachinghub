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
  Tooltip,
  Badge,
  Divider,
  useTheme,
  useMediaQuery,
  Drawer
} from '@mui/material';
import {
  VideoCall,
  VideocamOff,
  Mic,
  MicOff,
  ScreenShare,
  StopScreenShare,
  Chat,
  People,
  ExitToApp,
  Settings,

  PanTool,
  Fullscreen,
  FullscreenExit,
  Star,
  StarBorder,
  RateReview
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
  selectIsLocalScreenShared,
  selectBroadcastMessages,
  selectRoomState,
  HMSMessage,
  HMSPeer
} from '@100mslive/react-sdk';
import { useAuth } from '../../store/AuthContext';
import { apiService } from '../../services/apiService';
import { videoService } from '../../services/videoService';
import ResponsiveVideoLayout from './ResponsiveVideoLayout';

interface LiveClassProps {
  sessionId?: string;
  roomId?: string;
  userRole: 'student' | 'teacher' | 'admin';
  onLeave?: () => void;
}

interface VideoTokenResponse {
  token: string;
  roomId: string;
  userId: string;
  role: string;
  userName: string;
}

const LiveClassContent: React.FC<LiveClassProps> = ({
  sessionId,
  roomId,
  userRole,
  onLeave
}) => {
  const { user } = useAuth();
  const hmsActions = useHMSActions();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // HMS Store selectors
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const peers = useHMSStore(selectPeers);
  const localPeer = useHMSStore(selectLocalPeer);
  const isLocalVideoEnabled = useHMSStore(selectIsLocalVideoEnabled);
  const isLocalAudioEnabled = useHMSStore(selectIsLocalAudioEnabled);
  const isLocalScreenShared = useHMSStore(selectIsLocalScreenShared);
  const messages = useHMSStore(selectBroadcastMessages) || [];
  const roomState = useHMSStore(selectRoomState);

  // Component state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [cameraPermissionRequested, setCameraPermissionRequested] = useState(false);
  const [raiseHandRequests, setRaiseHandRequests] = useState<Set<string>>(new Set());
  const [allowedToSpeak, setAllowedToSpeak] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenPeerId, setFullscreenPeerId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | undefined>(undefined);
  const [attendance, setAttendance] = useState<Map<string, { joinTime: Date; duration: number }>>(new Map());
  const [sessionEnded, setSessionEnded] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Ref to prevent double joining in React strict mode
  const hasJoinedRef = useRef(false);

  // Track attendance when peers join/leave
  const trackAttendance = useCallback((peerId: string, action: 'join' | 'leave') => {
    if (action === 'join') {
      setAttendance(prev => {
        const newMap = new Map(prev);
        newMap.set(peerId, { joinTime: new Date(), duration: 0 });
        return newMap;
      });
    } else if (action === 'leave') {
      setAttendance(prev => {
        const newMap = new Map(prev);
        const attendance = newMap.get(peerId);
        if (attendance) {
          const duration = Math.floor((new Date().getTime() - attendance.joinTime.getTime()) / 1000);
          newMap.set(peerId, { ...attendance, duration });
        }
        return newMap;
      });
    }
  }, []);

  // Request notification permissions
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('✅ Notification permission granted');
      }
    }
  }, []);

  // Configure audio quality settings - OPTIMIZED (non-blocking)
  const configureAudioQuality = useCallback(() => {
    // Run audio configuration in background without blocking room join
    setTimeout(async () => {
      try {
        // Simplified audio configuration with timeout
        const audioConfig = navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } as MediaTrackConstraints,
          video: false
        });

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<MediaStream>((_, reject) => {
          setTimeout(() => reject(new Error('Audio config timeout')), 3000);
        });

        const stream = await Promise.race([audioConfig, timeoutPromise]);
        stream.getTracks().forEach(track => track.stop());
        
        console.log('✅ Audio quality configured in background');
      } catch (error) {
        console.warn('⚠️ Background audio config failed (non-critical):', error);
      }
    }, 1000); // Delay to not block room joining

    // Return immediately to not block the main flow
    return Promise.resolve();
  }, []);

  // Check and request camera permissions (mainly for teachers)
  const checkCameraPermissions = useCallback(async () => {
    if (cameraPermissionRequested) return;

    try {
      setCameraPermissionRequested(true);

      // Check if camera permission is already granted
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });

      if (permissionStatus.state === 'granted') {
        console.log('✅ Camera permission already granted');
        return true;
      }

      // Request camera access
      console.log('🎥 Requesting camera permission for teacher...');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

      // Stop the stream immediately - we just needed to check permission
      stream.getTracks().forEach(track => track.stop());

      console.log('✅ Camera permission granted for teacher');
      return true;

    } catch (error) {
      console.error('❌ Camera permission denied:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (userRole === 'teacher' || userRole === 'admin') {
        setError('Teacher camera access is required for video calls. Please allow camera permissions and refresh the page.');
      } else {
        console.log('📚 Camera not required for students');
      }
      return false;
    }
  }, [cameraPermissionRequested, userRole]);

  // Initialize HMS connection
  useEffect(() => {
    let isInitializing = false;
    let connectionTimeout: NodeJS.Timeout;
    let hasJoined = false;
    let retryCount = 0;
    const maxRetries = 2;

    const initializeRoom = async () => {
      // Prevent multiple simultaneous join attempts
      if (isInitializing || isConnected || hasJoinedRef.current) {
        console.log('🔄 Skipping room initialization - already connected or initializing');
        return;
      }

      // Additional check for HMS room state
      if (roomState === 'Connected' || roomState === 'Connecting') {
        console.log('🔄 Skipping room initialization - HMS room already in state:', roomState);
        return;
      }

      // In development, add extra protection against hot module reload
      if (process.env.NODE_ENV === 'development' && window.location.href.includes('hot-update')) {
        console.log('🔄 Skipping room initialization - hot module reload detected');
        return;
      }

      isInitializing = true;
      hasJoinedRef.current = true;

      try {
        setLoading(true);
        setError(null);

        // Set a connection timeout - REDUCED for faster feedback
        connectionTimeout = setTimeout(() => {
          if (!isConnected) {
            console.log('⏰ Connection timeout, stopping initialization');
            setError('Connection timeout - please try again');
            setLoading(false);
            isInitializing = false;
            hasJoinedRef.current = false;
          }
        }, 8000); // 8 second timeout (reduced from 15)

        // Get HMS token from backend with timeout
        console.log('🔑 Requesting video token for:', { 
          role: userRole, 
          userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
          sessionId,
          roomId 
        });
        
        const tokenPromise = apiService.post<VideoTokenResponse>('/video/token', {
          role: userRole,
          userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
          sessionId,
          roomId
        });

        // Add timeout to token request
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Token request timeout')), 5000);
        });

        const response = await Promise.race([tokenPromise, timeoutPromise]);

        console.log('🔑 Video token response:', { 
          success: response.success, 
          hasData: !!response.data,
          hasToken: !!response.data?.token 
        });

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to get video token');
        }

        const { token } = response.data;

        // Join HMS room only if not already connected
        if (!isConnected) {
          await hmsActions.join({
            userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
            authToken: token
          });

                    console.log('✅ Successfully joined HMS room');
          
          // Clear loading state immediately after joining
          setLoading(false);
          clearTimeout(connectionTimeout);
          
          // Set session start time
          setSessionStartTime(new Date());
          
          // Track attendance for current user
          trackAttendance(user?._id || '', 'join');
          
          // Run non-blocking optimizations in background without blocking UI
          setTimeout(() => {
            const backgroundTasks = [
              configureAudioQuality(),
              userRole === 'teacher' || userRole === 'admin' ? requestNotificationPermission() : Promise.resolve()
            ];
            
            // Don't await these - let them run in background
            Promise.allSettled(backgroundTasks).then(results => {
              results.forEach((result, index) => {
                if (result.status === 'rejected') {
                  console.warn(`Background task ${index} failed:`, result.reason);
                }
              });
            });
          }, 500);

          // Auto-enable video for teachers only (students don't need cameras)
          if (userRole === 'teacher' || userRole === 'admin') {
            setTimeout(async () => {
              try {
                console.log('🎥 Auto-enabling video for teacher...');

                // Check camera permissions first
                const hasPermission = await checkCameraPermissions();
                if (!hasPermission) {
                  return;
                }

                // Wait a bit more for HMS to fully initialize tracks
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Check if we're still connected before enabling video
                if (!isConnected) {
                  console.log('⚠️ Not connected, skipping video enable');
                  return;
                }

                await hmsActions.setLocalVideoEnabled(true);
                console.log('✅ Video enabled successfully for teacher');

                // Force a small delay to let the track settle
                setTimeout(() => {
                  console.log('🎥 Video track should now be active');
                }, 500);

              } catch (error) {
                console.error('❌ Error enabling video:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                setError(`Teacher camera error: ${errorMessage}. Please allow camera permissions and refresh.`);
              }
            }, 3000); // Wait 3 seconds for connection to fully stabilize
          } else {
            console.log('📚 Student joined - camera not required');
            // Students start muted by default
            setTimeout(async () => {
              try {
                await hmsActions.setLocalAudioEnabled(false);
                console.log('🔇 Student audio muted by default');
              } catch (error) {
                console.error('Error muting student:', error);
              }
            }, 2000);
          }
        }

      } catch (err) {
        console.error('❌ Error joining room:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to join video room';
        
        // Retry logic for token or connection failures
        if (retryCount < maxRetries && (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('Token request timeout'))) {
          retryCount++;
          console.log(`🔄 Retrying connection (attempt ${retryCount}/${maxRetries})...`);
          isInitializing = false;
          hasJoinedRef.current = false;
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 2000));
          return initializeRoom();
        }
        
        // Check if the error is related to room not being active
        if (errorMessage.toLowerCase().includes('room not active') || 
            errorMessage.toLowerCase().includes('room is not active') || 
            errorMessage.toLowerCase().includes('inactive room')) {
          
          // Only teachers and admins can enable rooms
          if (userRole === 'teacher' || userRole === 'admin') {
            try {
              console.log('🔄 Room not active, attempting to enable room...');
              setError('Room is not active. Attempting to enable it...');
              
              // Get the room ID from the provided roomId parameter
               let roomIdToEnable = roomId;
               
               // If we still don't have a roomId, try to extract it from the error message
               if (!roomIdToEnable && errorMessage) {
                 // Common patterns in HMS error messages: "Server error room not active"
                 // Try different regex patterns to match various error formats
                 let roomIdMatch = errorMessage.match(/Room ([a-zA-Z0-9-_]+) (is not active|not active|inactive)/i);
                 
                 // If the first pattern didn't match, try the pattern from the current error
                 if (!roomIdMatch) {
                   roomIdMatch = errorMessage.match(/Server error room not active/i);
                   if (roomIdMatch) {
                     // If we have a session ID, use it as the room ID
                     roomIdToEnable = sessionId;
                     console.log('📋 Using session ID as room ID:', roomIdToEnable);
                   }
                 } else if (roomIdMatch && roomIdMatch[1]) {
                   roomIdToEnable = roomIdMatch[1];
                   console.log('📋 Extracted room ID from error message:', roomIdToEnable);
                 }
                 
                 // Log the error message for debugging
                 console.log('🔍 Error message for room ID extraction:', errorMessage);
               }
              
              if (roomIdToEnable) {
                // Call the enableRoom endpoint
                const enableResult = await videoService.enableRoom(roomIdToEnable);
                
                if (enableResult.enabled) {
                  console.log('✅ Room enabled successfully, retrying connection...');
                  setError('Room enabled successfully. Reconnecting...');
                  
                  // Wait a moment for the room to fully activate
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  // Get a new token and retry joining
                  const tokenResponse = await apiService.post<VideoTokenResponse>('/video/token', {
                    role: userRole,
                    userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
                    sessionId,
                    roomId: roomIdToEnable
                  });
                  
                  if (!tokenResponse.success || !tokenResponse.data) {
                    throw new Error('Failed to get video token after enabling room');
                  }
                  
                  // Retry joining the room with the new token
                  await hmsActions.join({
                    userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
                    authToken: tokenResponse.data.token
                  });
                  
                  console.log('✅ Successfully joined HMS room after enabling');
                  setError(null);
                } else {
                  setError('Failed to enable room. Please try again later.');
                }
              } else {
                setError('Could not determine room ID to enable. Please try again.');
              }
            } catch (enableError) {
              console.error('❌ Error enabling room:', enableError);
              setError('Failed to enable room: ' + (enableError instanceof Error ? enableError.message : 'Unknown error'));
            }
          } else {
            // Students can't enable rooms
            setError('This room is not active. Please ask your teacher to start the session.');
          }
        } else {
          // Generic error handling with user-friendly messages
          let userFriendlyError = 'Failed to join video room';
          
          if (errorMessage.includes('timeout') || errorMessage.includes('Token request timeout')) {
            userFriendlyError = 'Connection timeout - please check your internet connection and try again';
          } else if (errorMessage.includes('HMS credentials validation failed')) {
            userFriendlyError = 'Video service configuration error - please contact support';
          } else if (errorMessage.includes('User not found')) {
            userFriendlyError = 'Authentication error - please log in again';
          } else if (errorMessage.includes('Session not found')) {
            userFriendlyError = 'Session not found - please check the session ID';
          } else if (errorMessage.includes('network') || errorMessage.includes('Network')) {
            userFriendlyError = 'Network error - please check your internet connection';
          } else {
            userFriendlyError = errorMessage;
          }
          
          setError(userFriendlyError);
          setLoading(false);
          isInitializing = false;
          hasJoinedRef.current = false;
        }
      } finally {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        // Only set loading to false if it wasn't already set by successful join
        if (loading) {
          setLoading(false);
        }
        isInitializing = false;
      }
    };

    if (user && !isConnected && roomState !== 'Connected' && roomState !== 'Connecting') {
      initializeRoom();
    }

    // Cleanup on unmount
    return () => {
      isInitializing = false;
      hasJoinedRef.current = false;
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
    };
  }, [user, sessionId, userRole, roomState]); // Added roomState to prevent multiple joins

  // Monitor video track state for debugging
  useEffect(() => {
    if (localPeer && (userRole === 'teacher' || userRole === 'admin')) {
      const videoTrack = localPeer.videoTrack;
      console.log('🎥 Local peer video track state:', {
        hasTrack: !!videoTrack,
        isLocalVideoEnabled,
        peerName: localPeer.name,
        peerId: localPeer.id,
        trackState: videoTrack ? 'active' : 'inactive',
        trackId: videoTrack?.id || 'none'
      });
      
      // If video is enabled but no track, try to enable it again
      if (isLocalVideoEnabled && !videoTrack) {
        console.log('⚠️ Video enabled but no track detected, retrying...');
        setTimeout(async () => {
          try {
            await hmsActions.setLocalVideoEnabled(false);
            await new Promise(resolve => setTimeout(resolve, 500));
            await hmsActions.setLocalVideoEnabled(true);
            console.log('🔄 Video track retry completed');
          } catch (error) {
            console.error('❌ Error retrying video track:', error);
          }
        }, 2000);
      }
    }
  }, [localPeer, isLocalVideoEnabled, userRole, hmsActions]);

  // Monitor all peers for debugging and track attendance
  useEffect(() => {
    console.log('👥 All peers:', peers.map(peer => ({
      name: peer.name,
      id: peer.id,
      isLocal: peer.isLocal,
      hasVideoTrack: !!peer.videoTrack,
      hasAudioTrack: !!peer.audioTrack
    })));

    // Track new peers joining
    peers.forEach(peer => {
      if (!attendance.has(peer.id)) {
        trackAttendance(peer.id, 'join');
      }
    });
  }, [peers, attendance, trackAttendance]);

  // Handle incoming messages for raise hand requests and teacher permissions
  useEffect(() => {
    messages.forEach(message => {
      if (message.message.includes('🤚') && message.message.includes('wants to speak')) {
        // Extract student name from message
        const studentName = message.message.split(' wants to speak')[0].replace('🤚 ', '');
        // Find the peer who sent the message (improved matching)
        const studentPeer = peers.find(peer => {
          const peerName = peer.name.toLowerCase().trim();
          const messageName = studentName.toLowerCase().trim();
          return peerName.includes(messageName) || messageName.includes(peerName);
        });
        
        if (studentPeer && userRole === 'teacher') {
          setRaiseHandRequests(prev => {
            const newSet = new Set(prev);
            newSet.add(studentPeer.id);
            return newSet;
          });
          
          // Show notification for teachers
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Student wants to speak', {
              body: `${studentName} has raised their hand to speak`,
              icon: '/favicon.ico',
              tag: 'raise-hand',
              requireInteraction: true
            });
          }
          
          console.log(`🤚 Student ${studentName} (ID: ${studentPeer.id}) raised hand`);
        }
      }
      
      // Handle student lowering hand
      if (message.message.includes('🤚') && message.message.includes('has lowered their hand')) {
        const studentName = message.message.split(' has lowered their hand')[0].replace('🤚 ', '');
        
        // Find the peer who sent the message
        const studentPeer = peers.find(peer => {
          const peerName = peer.name.toLowerCase().trim();
          const messageName = studentName.toLowerCase().trim();
          return peerName.includes(messageName) || messageName.includes(peerName);
        });
        
        if (studentPeer && userRole === 'teacher') {
          setRaiseHandRequests(prev => {
            const newSet = new Set(prev);
            newSet.delete(studentPeer.id);
            return newSet;
          });
          
          console.log(`🤚 Student ${studentName} (ID: ${studentPeer.id}) lowered hand`);
        }
      }
      
      // Handle teacher allowing student to speak
      if (message.message.includes('🎤') && message.message.includes('has allowed you to speak')) {
        if (userRole === 'student') {
          const userId = user?._id;
          if (userId) {
            setAllowedToSpeak(prev => new Set(prev).add(userId));
            setError(null); // Clear any previous error messages
            
            // Show success notification to student
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Permission Granted', {
                body: 'You can now speak! Click the microphone button to unmute.',
                icon: '/favicon.ico'
              });
            }
          }
        }
      }
      
      // Handle permission expiration
      if (message.message.includes('⏰') && message.message.includes('Speaking permission has expired')) {
        if (userRole === 'student') {
          const userId = user?._id;
          if (userId) {
            setAllowedToSpeak(prev => {
              const newSet = new Set(prev);
              newSet.delete(userId);
              return newSet;
            });
            // Auto-mute the student when permission expires
            if (isLocalAudioEnabled) {
              hmsActions.setLocalAudioEnabled(false);
            }
          }
        }
      }
    });
  }, [messages, peers, userRole, user, isLocalAudioEnabled, hmsActions]);

  // Cleanup effect for leaving room on unmount
  useEffect(() => {
    return () => {
      // Use a timeout to ensure this runs after any other cleanup
      setTimeout(() => {
        try {
          hmsActions.leave();
        } catch (error) {
          // Ignore errors during cleanup
          console.warn('Error during cleanup leave:', error);
        }
      }, 0);
    };
  }, []); // Only run on unmount

  // Handle video toggle
  const toggleVideo = useCallback(async () => {
    try {
      const action = isLocalVideoEnabled ? 'disabling' : 'enabling';
      console.log(`🎥 ${action} video for ${userRole}...`);

      await hmsActions.setLocalVideoEnabled(!isLocalVideoEnabled);
      console.log(`✅ Video ${action} successful`);
    } catch (error) {
      console.error('❌ Error toggling video:', error);

      // Provide user-friendly error messages
      const errorMessage = error instanceof Error ? error.message : String(error);
      const roleContext = userRole === 'student' ? 'Student camera' : 'Teacher camera';

      if (errorMessage?.includes('Permission denied') || errorMessage?.includes('NotAllowedError')) {
        setError(`${roleContext} access denied. Please allow camera permissions in your browser and try again.`);
      } else if (errorMessage?.includes('NotFoundError')) {
        setError(`${roleContext}: No camera found. Please connect a camera and try again.`);
      } else if (errorMessage?.includes('NotReadableError')) {
        setError(`${roleContext} is being used by another application. Please close other apps using the camera.`);
      } else {
        setError(`${roleContext} error: ${errorMessage}`);
      }
    }
  }, [hmsActions, isLocalVideoEnabled, userRole]);

  // Handle audio toggle (students can only unmute if teacher allows)
  const toggleAudio = useCallback(async () => {
    try {
      if (userRole === 'student') {
        // Students cannot unmute themselves - they must be allowed by teacher
        if (!isLocalAudioEnabled) {
          const userId = user?._id;
          if (!userId || !allowedToSpeak.has(userId)) {
            setError('Please raise your hand to request permission to speak');
            return;
          }
        }
      }
      
      await hmsActions.setLocalAudioEnabled(!isLocalAudioEnabled);
    } catch (error) {
      console.error('Error toggling audio:', error);
    }
  }, [hmsActions, isLocalAudioEnabled, userRole, user, allowedToSpeak]);

  // Handle raise hand request
  const handleRaiseHand = useCallback(async () => {
    if (userRole === 'student') {
      try {
        // Send raise hand message to teacher
        await hmsActions.sendBroadcastMessage(`🤚 ${user?.firstName || 'Student'} wants to speak`);
        
        // Add to local raise hand requests
        setRaiseHandRequests(prev => new Set(prev).add(user?._id || ''));
        
        console.log('🤚 Raise hand request sent successfully');
        
        // Show confirmation to student
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Hand Raised', {
            body: 'Your request to speak has been sent to the teacher.',
            icon: '/favicon.ico'
          });
        } else {
          // Fallback: set a temporary success message
          setError('✋ Hand raised! Waiting for teacher permission...');
          setTimeout(() => setError(null), 3000);
        }
        
      } catch (error) {
        console.error('Error sending raise hand request:', error);
        setError('Failed to raise hand. Please try again.');
      }
    }
  }, [hmsActions, userRole, user]);

  // Handle lower hand request
  const handleLowerHand = useCallback(async () => {
    if (userRole === 'student') {
      try {
        const userId = user?._id || '';
        
        // Remove from local raise hand requests
        setRaiseHandRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        
        // Optionally notify teacher
        const userName = `${user?.firstName || 'Student'} ${user?.lastName || ''}`.trim();
        await hmsActions.sendBroadcastMessage(`🤚 ${userName} has lowered their hand`);
        
        console.log('🤚 Hand lowered successfully');
        
        // Show confirmation to student
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Hand Lowered', {
            body: 'You have lowered your hand.',
            icon: '/favicon.ico'
          });
        } else {
          // Fallback: set a temporary message
          setError('👋 Hand lowered successfully');
          setTimeout(() => setError(null), 2000);
        }
        
      } catch (error) {
        console.error('Error lowering hand:', error);
      }
    }
  }, [hmsActions, userRole, user]);

  // Handle fullscreen mode
  const handleFullscreenToggle = useCallback((peerId: string) => {
    if (isFullscreen && fullscreenPeerId === peerId) {
      // Exit fullscreen
      setIsFullscreen(false);
      setFullscreenPeerId(null);
    } else {
      // Enter fullscreen for this peer
      setIsFullscreen(true);
      setFullscreenPeerId(peerId);
    }
  }, [isFullscreen, fullscreenPeerId]);

  // End session and save data
  const endSession = useCallback(async () => {
    try {
      setSessionEnded(true);
      
      // Calculate final attendance
      const finalAttendance = Array.from(attendance.entries()).map(([peerId, data]) => {
        const duration = data.duration || Math.floor((new Date().getTime() - data.joinTime.getTime()) / 1000);
        return { peerId, joinTime: data.joinTime, duration };
      });

      // Save session data
      const sessionData = {
        sessionId,
        roomId,
        startTime: sessionStartTime,
        endTime: new Date(),
        attendance: finalAttendance,
        participants: peers.map(peer => ({
          id: peer.id,
          name: peer.name
        }))
      };

      // Send session data to backend
      await apiService.post('/live-sessions/end', sessionData);
      
      console.log('✅ Session ended and data saved');
    } catch (error) {
      console.error('❌ Error ending session:', error);
    }
  }, [sessionId, roomId, sessionStartTime, attendance, peers]);

  // Handle allowing student to speak (for teachers)
  const handleAllowStudentToSpeak = useCallback(async (studentId: string) => {
    if (userRole === 'teacher' || userRole === 'admin') {
      try {
        // Find the student peer
        const studentPeer = peers.find(peer => peer.id === studentId);
        if (!studentPeer) {
          console.warn('Student peer not found');
          return;
        }

        // Add student to allowed to speak list
        setAllowedToSpeak(prev => new Set(prev).add(studentId));
        
        // Send message to student that they can now speak
        await hmsActions.sendBroadcastMessage(`🎤 ${user?.firstName || 'Teacher'} has allowed you to speak. You can now unmute yourself.`);
        
        // Remove from raise hand requests
        setRaiseHandRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(studentId);
          return newSet;
        });
        
        // Auto-remove permission after 5 minutes
        setTimeout(() => {
          setAllowedToSpeak(prev => {
            const newSet = new Set(prev);
            newSet.delete(studentId);
            return newSet;
          });
          
          // Send message that permission has expired
          hmsActions.sendBroadcastMessage(`⏰ Speaking permission has expired. Please raise your hand again if needed.`);
        }, 5 * 60 * 1000); // 5 minutes
        
        console.log('🎤 Student allowed to speak');
      } catch (error) {
        console.error('Error allowing student to speak:', error);
      }
    }
  }, [hmsActions, userRole, user, peers]);

  // Handle screen share toggle
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isLocalScreenShared) {
        await hmsActions.setScreenShareEnabled(false);
      } else {
        await hmsActions.setScreenShareEnabled(true);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }, [hmsActions, isLocalScreenShared]);



  // Handle leave room
  const handleLeave = useCallback(async () => {
    try {
      // Show confirmation for teachers ending session
      if (userRole === 'teacher' || userRole === 'admin') {
        const confirmMessage = 'Are you sure you want to end this session? All participants will be disconnected.';
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      // Track attendance before leaving
      trackAttendance(user?._id || '', 'leave');
      
      // End session if teacher/admin is leaving
      if (userRole === 'teacher' || userRole === 'admin') {
        console.log('🏁 Teacher ending session...');
        await endSession();
      }

      // Only leave if currently connected
      if (isConnected) {
        await hmsActions.leave();
      }
      if (onLeave) {
        onLeave();
      }
    } catch (error) {
      console.error('Error leaving room:', error);
      // Still call onLeave even if HMS leave fails
      if (onLeave) {
        onLeave();
      }
    }
  }, [hmsActions, onLeave, isConnected, userRole, user, trackAttendance, endSession, sessionId, roomId]);

  // Send chat message
  const sendMessage = useCallback(async (message: string) => {
    try {
      await hmsActions.sendBroadcastMessage(message);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [hmsActions]);

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Joining video room...
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', maxWidth: 300 }}>
          This may take a few moments. Please ensure you have a stable internet connection.
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <Typography variant="h6">Failed to join video room</Typography>
        <Typography>{error}</Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Retry
          </Button>
          {error.includes('Camera') && (
            <Button
              variant="outlined"
              onClick={async () => {
                setCameraPermissionRequested(false);
                await checkCameraPermissions();
              }}
            >
              Test Camera
            </Button>
          )}
        </Box>
      </Alert>
    );
  }

  if (!isConnected) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Connecting to room...
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <ResponsiveVideoLayout
        peers={peers}
        localPeer={localPeer || null}
        isFullscreen={isFullscreen}
        fullscreenPeerId={fullscreenPeerId}
        onFullscreenToggle={handleFullscreenToggle}
        userRole={userRole}
        chatOpen={chatOpen}
        participantsOpen={participantsOpen}
        onChatToggle={() => setChatOpen(!chatOpen)}
        onParticipantsToggle={() => setParticipantsOpen(!participantsOpen)}
        raiseHandRequests={raiseHandRequests}
        chatComponent={
          <ChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            onClose={() => setChatOpen(false)}
            userRole={userRole}
            peers={peers}
            raiseHandRequests={raiseHandRequests}
            onAllowStudentToSpeak={handleAllowStudentToSpeak}
          />
        }
        participantsComponent={
          <ParticipantsPanel
            peers={peers}
            raiseHandRequests={raiseHandRequests}
            userRole={userRole}
            attendance={attendance}
            onClose={() => setParticipantsOpen(false)}
            onAllowStudentToSpeak={handleAllowStudentToSpeak}
          />
        }
        controlsComponent={
          <ResponsiveControls
            userRole={userRole}
            isLocalVideoEnabled={isLocalVideoEnabled}
            isLocalAudioEnabled={isLocalAudioEnabled}
            isLocalScreenShared={isLocalScreenShared}
            peers={peers}
            messages={messages}
            chatOpen={chatOpen}
            participantsOpen={participantsOpen}
            isMobile={isMobile}
            raiseHandRequests={raiseHandRequests}
            currentUserHandRaised={raiseHandRequests.has(user?._id || '')}
            isFullscreen={isFullscreen}
            fullscreenPeerId={fullscreenPeerId}
            attendance={attendance}
            onToggleVideo={toggleVideo}
            onToggleAudio={toggleAudio}
            onToggleScreenShare={toggleScreenShare}
            onToggleChat={() => setChatOpen(!chatOpen)}
            onToggleParticipants={() => setParticipantsOpen(!participantsOpen)}
            onRaiseHand={handleRaiseHand}
            onLowerHand={handleLowerHand}
            onAllowStudentToSpeak={handleAllowStudentToSpeak}
            onFullscreenToggle={handleFullscreenToggle}
            onFeedbackOpen={() => setFeedbackOpen(true)}
            onLeave={handleLeave}
          />
        }
      />
      
      {/* Feedback Dialog */}
      <Drawer
        anchor="right"
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        PaperProps={{
          sx: { width: '90vw', maxWidth: 400 }
        }}
      >
        <FeedbackPanel
          sessionId={sessionId}
          roomId={roomId}
          userRole={userRole}
          sessionStartTime={sessionStartTime}
          sessionEndTime={sessionEnded ? new Date() : undefined}
          attendanceDuration={user?._id ? attendance.get(user._id)?.duration || 0 : 0}
          onClose={() => setFeedbackOpen(false)}
        />
      </Drawer>
    </>
  );
};

// Responsive Controls Component
interface ResponsiveControlsProps {
  userRole: 'student' | 'teacher' | 'admin';
  isLocalVideoEnabled: boolean;
  isLocalAudioEnabled: boolean;
  isLocalScreenShared: boolean;
  peers: HMSPeer[];
  messages: HMSMessage[];
  chatOpen: boolean;
  participantsOpen: boolean;
  isMobile: boolean;
  raiseHandRequests: Set<string>;
  currentUserId?: string;
  isFullscreen?: boolean;
  fullscreenPeerId?: string | null;
  attendance: Map<string, { joinTime: Date; duration: number }>;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onRaiseHand: () => void;
  onLowerHand?: () => void;
  onAllowStudentToSpeak: (studentId: string) => void;
  onFullscreenToggle: (peerId: string) => void;
  onFeedbackOpen: () => void;
  onLeave: () => void;
}

const ResponsiveControls: React.FC<ResponsiveControlsProps> = ({
  userRole,
  isLocalVideoEnabled,
  isLocalAudioEnabled,
  isLocalScreenShared,
  peers,
  messages,
  chatOpen,
  participantsOpen,
  isMobile,
  raiseHandRequests,
  currentUserId = '',
  isFullscreen = false,
  fullscreenPeerId = null,
  attendance,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onRaiseHand,
  onLowerHand,
  onAllowStudentToSpeak,
  onFullscreenToggle,
  onFeedbackOpen,
  onLeave
}) => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: isMobile ? 1 : 2,
        bgcolor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}
    >
      {/* Header info for mobile */}
      {isMobile && (
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" fontWeight="bold">
            Live Class - {userRole === 'teacher' ? 'Teaching' : 'Attending'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {peers.length} participant{peers.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}

      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        gap={isMobile ? 1 : 2}
        flexWrap={isMobile ? 'wrap' : 'nowrap'}
      >
        {/* Primary controls */}
        <Box display="flex" alignItems="center" gap={isMobile ? 0.5 : 1}>
          {/* Video toggle */}
          <Tooltip title={
            isLocalVideoEnabled
              ? 'Turn off camera'
              : userRole === 'student'
                ? 'Turn on camera (optional for students)'
                : 'Turn on camera'
          }>
            <IconButton
              onClick={onToggleVideo}
              color={isLocalVideoEnabled ? 'primary' : 'default'}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                bgcolor: isLocalVideoEnabled ? 'primary.light' : 'grey.300',
                '&:hover': { bgcolor: isLocalVideoEnabled ? 'primary.main' : 'grey.400' }
              }}
            >
              {isLocalVideoEnabled ? <VideoCall /> : <VideocamOff />}
            </IconButton>
          </Tooltip>

          {/* Audio toggle */}
          <Tooltip title={
            isLocalAudioEnabled 
              ? 'Mute microphone' 
              : userRole === 'student' 
                ? 'Unmute microphone (requires teacher permission)'
                : 'Unmute microphone'
          }>
            <IconButton
              onClick={onToggleAudio}
              color={isLocalAudioEnabled ? 'primary' : 'default'}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                bgcolor: isLocalAudioEnabled ? 'primary.light' : 'grey.300',
                '&:hover': { bgcolor: isLocalAudioEnabled ? 'primary.main' : 'grey.400' },
                opacity: userRole === 'student' && !isLocalAudioEnabled ? 0.6 : 1
              }}
            >
              {isLocalAudioEnabled ? <Mic /> : <MicOff />}
            </IconButton>
          </Tooltip>

          {/* Raise/Lower hand button (students only) */}
          {userRole === 'student' && (
            <Tooltip title={
              raiseHandRequests.has(currentUserId) 
                ? "Click to lower hand" 
                : "Raise hand to request to speak"
            }>
              <IconButton
                onClick={raiseHandRequests.has(currentUserId) ? onLowerHand : onRaiseHand}
                color="warning"
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  bgcolor: raiseHandRequests.has(currentUserId) 
                    ? 'warning.main' 
                    : 'warning.light',
                  '&:hover': { 
                    bgcolor: raiseHandRequests.has(currentUserId) 
                      ? 'warning.dark' 
                      : 'warning.main' 
                  },
                  color: raiseHandRequests.has(currentUserId) ? 'white' : 'inherit',
                  animation: raiseHandRequests.has(currentUserId) 
                    ? 'pulse 2s infinite' 
                    : 'none',
                  '@keyframes pulse': {
                    '0%': {
                      transform: 'scale(1)',
                      opacity: 0.9,
                    },
                    '50%': {
                      transform: 'scale(1.05)',
                      opacity: 1,
                    },
                    '100%': {
                      transform: 'scale(1)',
                      opacity: 0.9,
                    },
                  }
                }}
              >
                <PanTool />
              </IconButton>
            </Tooltip>
          )}

          {/* Screen share (teacher/admin only) */}
          {(userRole === 'teacher' || userRole === 'admin') && (
            <Tooltip title={isLocalScreenShared ? 'Stop screen share' : 'Share screen'}>
              <IconButton
                onClick={onToggleScreenShare}
                color={isLocalScreenShared ? 'primary' : 'default'}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  bgcolor: isLocalScreenShared ? 'primary.light' : 'grey.300',
                  '&:hover': { bgcolor: isLocalScreenShared ? 'primary.main' : 'grey.400' }
                }}
              >
                {isLocalScreenShared ? <StopScreenShare /> : <ScreenShare />}
              </IconButton>
            </Tooltip>
          )}


        </Box>

        {!isMobile && <Divider orientation="vertical" flexItem />}

                  {/* Feedback button */}
          <Tooltip title="Session Feedback">
            <IconButton
              onClick={onFeedbackOpen}
              color="primary"
              size={isMobile ? 'small' : 'medium'}
            >
              <RateReview />
            </IconButton>
          </Tooltip>

          {/* Fullscreen exit button (when in fullscreen mode) */}
          {isFullscreen && fullscreenPeerId && (
            <Tooltip title="Exit fullscreen">
              <IconButton
                onClick={() => onFullscreenToggle(fullscreenPeerId)}
                color="primary"
                size={isMobile ? 'small' : 'medium'}
              >
                <FullscreenExit />
              </IconButton>
            </Tooltip>
          )}

          {/* Leave room / End session */}
          <Tooltip title={userRole === 'teacher' || userRole === 'admin' ? 'End Session' : 'Leave room'}>
            <IconButton
              onClick={onLeave}
              color="error"
              size={isMobile ? 'small' : 'medium'}
              sx={{
                bgcolor: userRole === 'teacher' || userRole === 'admin' ? 'error.light' : 'grey.300',
                '&:hover': { 
                  bgcolor: userRole === 'teacher' || userRole === 'admin' ? 'error.main' : 'grey.400' 
                }
              }}
            >
              <ExitToApp />
            </IconButton>
          </Tooltip>
      </Box>
    </Paper>
  );
};

// Video Tile Component
const VideoTile: React.FC<{ peer: HMSPeer }> = ({ peer }) => {
  const hmsActions = useHMSActions();

  useEffect(() => {
    if (peer.videoTrack && typeof peer.videoTrack === 'string') {
      const videoElement = document.getElementById(`video-${peer.id}`) as HTMLVideoElement;
      if (videoElement) {
        console.log('🎥 Attaching video track to element:', peer.id);
        hmsActions.attachVideo(peer.videoTrack as string, videoElement);
      }
    }
    return () => {
      if (peer.videoTrack && typeof peer.videoTrack === 'string') {
        const videoElement = document.getElementById(`video-${peer.id}`) as HTMLVideoElement;
        if (videoElement) {
          console.log('🎥 Detaching video track from element:', peer.id);
          hmsActions.detachVideo(peer.videoTrack as string, videoElement);
        }
      }
    };
  }, [peer.videoTrack, peer.id, hmsActions]);

  return (
    <Card sx={{ height: 200, position: 'relative' }}>
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
        {peer.name} {peer.isLocal && '(You)'}
      </Box>
      {!peer.audioTrack && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'error.main',
            color: 'white',
            borderRadius: '50%',
            p: 0.5
          }}
        >
          <MicOff fontSize="small" />
        </Box>
      )}
    </Card>
  );
};

// Chat Panel Component
const ChatPanel: React.FC<{
  messages: HMSMessage[];
  onSendMessage: (message: string) => void;
  onClose: () => void;
  userRole?: 'student' | 'teacher' | 'admin';
  peers?: HMSPeer[];
  raiseHandRequests?: Set<string>;
  onAllowStudentToSpeak?: (studentId: string) => void;
}> = ({ 
  messages, 
  onSendMessage, 
  onClose, 
  userRole, 
  peers = [], 
  raiseHandRequests = new Set(), 
  onAllowStudentToSpeak 
}) => {
  const [newMessage, setNewMessage] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  // Find students who have raised hands
  const studentsWithRaisedHands = peers.filter(peer => 
    raiseHandRequests.has(peer.id) && !peer.isLocal
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', position: 'relative' }}>
        <Typography variant="h6">Chat</Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          ×
        </IconButton>
      </Box>

      {/* Raise hand notifications for teachers */}
      {userRole === 'teacher' && studentsWithRaisedHands.length > 0 && (
        <Box sx={{ p: 2, bgcolor: 'warning.light', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            🤚 Students want to speak:
          </Typography>
          {studentsWithRaisedHands.map(student => (
            <Box key={student.id} sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 1,
              p: 1,
              bgcolor: 'background.paper',
              borderRadius: 1
            }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {student.name}
              </Typography>
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<Mic />}
                onClick={() => onAllowStudentToSpeak?.(student.id)}
                sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}
              >
                Allow
              </Button>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {messages.map((message, index) => {
          const isRaiseHandMessage = message.message.includes('🤚') && message.message.includes('wants to speak');
          
          return (
            <Box 
              key={index} 
              sx={{ 
                mb: 1,
                p: isRaiseHandMessage ? 1 : 0,
                bgcolor: isRaiseHandMessage ? 'warning.light' : 'transparent',
                borderRadius: isRaiseHandMessage ? 1 : 0,
                border: isRaiseHandMessage ? 1 : 0,
                borderColor: isRaiseHandMessage ? 'warning.main' : 'transparent'
              }}
            >
              <Typography variant="caption" color="textSecondary">
                {message.senderName}
              </Typography>
              <Typography variant="body2" sx={{ 
                fontWeight: isRaiseHandMessage ? 600 : 400,
                color: isRaiseHandMessage ? 'warning.dark' : 'inherit'
              }}>
                {message.message}
              </Typography>
              
              {/* Quick action button for raise hand messages */}
              {isRaiseHandMessage && userRole === 'teacher' && onAllowStudentToSpeak && (
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    startIcon={<Mic />}
                    onClick={() => {
                      // Extract student name and find peer
                      const studentName = message.message.split(' wants to speak')[0].replace('🤚 ', '');
                      const studentPeer = peers.find(peer => peer.name.includes(studentName));
                      if (studentPeer) {
                        onAllowStudentToSpeak(studentPeer.id);
                      }
                    }}
                    sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                  >
                    Allow to Speak
                  </Button>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box display="flex" gap={1}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          <Button onClick={handleSend} variant="contained" size="small">
            Send
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// Participants Panel Component
// Feedback Component
const FeedbackPanel: React.FC<{
  sessionId?: string;
  roomId?: string;
  userRole: 'student' | 'teacher' | 'admin';
  sessionStartTime?: Date;
  sessionEndTime?: Date;
  attendanceDuration?: number;
  onClose: () => void;
}> = ({ sessionId, roomId, userRole, sessionStartTime, sessionEndTime, attendanceDuration, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    try {
      await apiService.post('/feedback/submit', {
        sessionId,
        roomId,
        rating,
        comment,
        sessionStartTime: sessionStartTime || new Date(),
        sessionEndTime: sessionEndTime || new Date(),
        attendanceDuration: attendanceDuration || 0
      });
      setSubmitted(true);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (submitted) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="success.main">
          Thank you for your feedback! ✅
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Session Feedback</Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          ×
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, p: 2 }}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          How would you rate this session?
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <IconButton
              key={star}
              onClick={() => setRating(star)}
              color={star <= rating ? 'primary' : 'default'}
            >
              {star <= rating ? <Star /> : <StarBorder />}
            </IconButton>
          ))}
        </Box>

        <Typography variant="body2" sx={{ mb: 2 }}>
          Additional comments (optional):
        </Typography>
        
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about the session..."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '8px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            resize: 'vertical'
          }}
        />

        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={rating === 0}
            fullWidth
          >
            Submit Feedback
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

const ParticipantsPanel: React.FC<{
  peers: HMSPeer[];
  raiseHandRequests: Set<string>;
  userRole: 'student' | 'teacher' | 'admin';
  attendance: Map<string, { joinTime: Date; duration: number }>;
  onClose: () => void;
  onAllowStudentToSpeak: (studentId: string) => void;
}> = ({ peers, raiseHandRequests, userRole, attendance, onClose, onAllowStudentToSpeak }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', position: 'relative' }}>
        <Typography variant="h6">Participants ({peers.length})</Typography>
        {raiseHandRequests.size > 0 && userRole === 'teacher' && (
          <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
            {raiseHandRequests.size} student{raiseHandRequests.size > 1 ? 's' : ''} want{raiseHandRequests.size === 1 ? 's' : ''} to speak
          </Typography>
        )}
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          ×
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {peers.map((peer) => {
          const hasRaisedHand = raiseHandRequests.has(peer.id);
          const isStudent = !peer.isLocal && userRole === 'teacher';
          const peerAttendance = attendance.get(peer.id);
          const duration = peerAttendance ? Math.floor((new Date().getTime() - peerAttendance.joinTime.getTime()) / 1000) : 0;
          
          return (
            <Box
              key={peer.id}
              sx={{
                p: isMobile ? 2 : 1.5,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: hasRaisedHand ? 'warning.light' : 'transparent',
                minHeight: isMobile ? 80 : 60
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant={isMobile ? "body1" : "body2"} sx={{ fontWeight: hasRaisedHand ? 600 : 400 }}>
                  {peer.name} {peer.isLocal && '(You)'}
                </Typography>
                {hasRaisedHand && (
                  <Typography variant={isMobile ? "body2" : "caption"} sx={{ color: 'warning.main', mt: 0.5 }}>
                    🤚 Wants to speak
                  </Typography>
                )}
                {peerAttendance && (
                  <Typography variant="caption" color="textSecondary">
                    Duration: {Math.floor(duration / 60)}m {duration % 60}s
                  </Typography>
                )}
              </Box>
              
              <Box display="flex" gap={isMobile ? 1 : 0.5} alignItems="center" flexDirection={isMobile && hasRaisedHand ? 'column' : 'row'}>
                {/* Status indicators */}
                <Box display="flex" gap={0.5} alignItems="center">
                  {!peer.audioTrack && <MicOff fontSize="small" color="error" />}
                  {!peer.videoTrack && <VideocamOff fontSize="small" color="error" />}
                  {hasRaisedHand && <PanTool fontSize="small" color="warning" />}
                </Box>
                
                {/* Allow to speak button - more prominent on mobile */}
                {isStudent && hasRaisedHand && (
                  <Box>
                    {isMobile ? (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<Mic />}
                        onClick={() => onAllowStudentToSpeak(peer.id)}
                        sx={{ 
                          minWidth: 120,
                          fontSize: '0.75rem',
                          py: 0.5
                        }}
                      >
                        Allow to Speak
                      </Button>
                    ) : (
                      <Tooltip title="Allow student to speak">
                        <IconButton
                          size="medium"
                          onClick={() => onAllowStudentToSpeak(peer.id)}
                          color="success"
                          sx={{
                            bgcolor: 'success.light',
                            '&:hover': { bgcolor: 'success.main' }
                          }}
                        >
                          <Mic />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

// Main component with HMS Provider
const LiveClass: React.FC<LiveClassProps> = (props) => {
  return (
    <HMSRoomProvider>
      <LiveClassContent {...props} />
    </HMSRoomProvider>
  );
};

export default LiveClass;

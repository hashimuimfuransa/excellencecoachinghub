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
  FiberManualRecord,
  Stop,
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
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
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

  // Configure audio quality settings with advanced filtering
  const configureAudioQuality = useCallback(async () => {
    try {
      // Get user media with advanced audio constraints for maximum quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 48000 },
          channelCount: { ideal: 1 }
        } as MediaTrackConstraints,
        video: false
      });

      // Apply additional audio processing if available
      if (stream.getAudioTracks().length > 0) {
        const audioTrack = stream.getAudioTracks()[0];
        
        // Apply additional constraints for better quality
        await audioTrack.applyConstraints({
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } as MediaTrackConstraints);
      }

      // Stop the stream immediately - we just needed to check settings
      stream.getTracks().forEach(track => track.stop());
      
      console.log('✅ Advanced audio quality settings configured');
    } catch (error) {
      console.warn('⚠️ Could not configure advanced audio quality settings:', error);
      
      // Fallback to basic settings
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: { ideal: 48000 },
            channelCount: { ideal: 1 }
          } as MediaTrackConstraints,
          video: false
        });
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Basic audio quality settings configured');
      } catch (fallbackError) {
        console.warn('⚠️ Could not configure basic audio quality settings:', fallbackError);
      }
    }
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

    const initializeRoom = async () => {
      // Prevent multiple simultaneous join attempts
      if (isInitializing || isConnected || hasJoinedRef.current) {
        console.log('🔄 Skipping room initialization - already connected or initializing');
        return;
      }

      isInitializing = true;
      hasJoinedRef.current = true;

      try {
        setLoading(true);
        setError(null);

        // Set a connection timeout
        connectionTimeout = setTimeout(() => {
          if (!isConnected) {
            setError('Connection timeout - please try again');
            setLoading(false);
            isInitializing = false;
          }
        }, 30000); // 30 second timeout

        // Get HMS token from backend
        const response = await apiService.post<VideoTokenResponse>('/video/token', {
          role: userRole,
          userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
          sessionId,
          roomId
        });

        if (!response.success || !response.data) {
          throw new Error('Failed to get video token');
        }

        const { token } = response.data;

        // Join HMS room only if not already connected
        if (!isConnected) {
          await hmsActions.join({
            userName: user?.firstName + ' ' + user?.lastName || 'Unknown User',
            authToken: token
          });

                    console.log('✅ Successfully joined HMS room');
          
          // Set session start time
          setSessionStartTime(new Date());
          
          // Track attendance for current user
          trackAttendance(user?._id || '', 'join');
          
          // Configure audio quality for all users
          await configureAudioQuality();
          
          // Request notification permissions for teachers
          if (userRole === 'teacher' || userRole === 'admin') {
            await requestNotificationPermission();
          }

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
          // For other errors, just show the error message
          setError(errorMessage);
        }
      } finally {
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }
        setLoading(false);
        isInitializing = false;
      }
    };

    if (user && !isConnected) {
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
  }, [user, sessionId, userRole]); // Removed dependencies that cause unnecessary re-runs

  // Monitor video track state for debugging
  useEffect(() => {
    if (localPeer && (userRole === 'teacher' || userRole === 'admin')) {
      const videoTrack = localPeer.videoTrack;
      console.log('🎥 Local peer video track state:', {
        hasTrack: !!videoTrack,
        isLocalVideoEnabled,
        peerName: localPeer.name,
        peerId: localPeer.id
      });
    }
  }, [localPeer, isLocalVideoEnabled, userRole]);

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
        const studentPeer = peers.find(peer => peer.name.includes(studentName));
        if (studentPeer && userRole === 'teacher') {
          setRaiseHandRequests(prev => new Set(prev).add(studentPeer.id));
          
          // Show notification for teachers
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Student wants to speak', {
              body: `${studentName} has raised their hand to speak`,
              icon: '/favicon.ico'
            });
          }
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
        
        console.log('🤚 Raise hand request sent');
      } catch (error) {
        console.error('Error sending raise hand request:', error);
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
        recordingId,
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
  }, [sessionId, roomId, sessionStartTime, attendance, recordingId, peers]);

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

  // Handle recording toggle
  const toggleRecording = useCallback(async () => {
    try {
      if (isRecording) {
        // Stop recording
        console.log('🛑 Stopping recording with data:', {
          sessionId,
          roomId,
          recordingId,
          hasRecordingId: !!recordingId
        });

        if (!recordingId) {
          console.error('❌ No recording ID available to stop recording');
          alert('Cannot stop recording: No recording ID found');
          return;
        }

        const response = await apiService.post('/video/recording/stop', {
          sessionId,
          roomId,
          recordingId
        });

        if (response.success) {
          setIsRecording(false);
          setRecordingId(null);
          console.log('✅ Recording stopped successfully');
        }
      } else {
        // Start recording
        console.log('🎥 Starting recording with data:', {
          sessionId,
          roomId
        });

        const response = await apiService.post<{ data: any }>('/video/recording/start', {
          sessionId,
          roomId
        });
        
        console.log('🎥 Recording start response:', response);
        
        if (response.success && response.data) {
          // Handle different possible response structures
          let newRecordingId: string | undefined;
          const responseData = response.data as any;
          
          if (responseData.data?.recordingId) {
            // Structure: { success: true, data: { data: { recordingId: "..." } } }
            newRecordingId = responseData.data.recordingId;
          } else if (responseData.recordingId) {
            // Structure: { success: true, data: { recordingId: "..." } }
            newRecordingId = responseData.recordingId;
          } else if (typeof responseData === 'string') {
            // Structure: { success: true, data: "recording-id" }
            newRecordingId = responseData;
          }
          
          if (newRecordingId) {
            setIsRecording(true);
            setRecordingId(newRecordingId);
            console.log('✅ Recording started successfully with ID:', newRecordingId);
          } else {
            console.error('❌ No recording ID found in response:', response);
            alert('Recording started but no recording ID received. Please try stopping and starting again.');
          }
        } else {
          console.error('❌ Recording start failed:', response);
          alert('Failed to start recording. Please try again.');
        }
      }
    } catch (error: any) {
      console.error('❌ Error toggling recording:', error);
      if (error?.response?.data) {
        console.error('Error details:', error.response.data);
        alert(`Recording error: ${error.response.data.error || 'Unknown error'}`);
      } else {
        alert(`Recording error: ${error?.message || 'Unknown error'}`);
      }
    }
  }, [isRecording, sessionId, roomId, recordingId]);

  // Handle leave room
  const handleLeave = useCallback(async () => {
    try {
      // Show confirmation for teachers ending session
      if (userRole === 'teacher' || userRole === 'admin') {
        const confirmMessage = isRecording 
          ? 'Are you sure you want to end this session? The recording will be stopped and saved automatically.'
          : 'Are you sure you want to end this session? All participants will be disconnected.';
        
        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      // Track attendance before leaving
      trackAttendance(user?._id || '', 'leave');
      
      // Stop recording if teacher/admin is leaving and recording is active
      if ((userRole === 'teacher' || userRole === 'admin') && isRecording && recordingId) {
        try {
          console.log('🛑 Auto-stopping recording before ending session');
          await apiService.post('/video/recording/stop', {
            sessionId,
            roomId,
            recordingId
          });
          setIsRecording(false);
          setRecordingId(null);
          console.log('✅ Recording stopped before ending session');
        } catch (error) {
          console.error('❌ Error stopping recording before ending session:', error);
        }
      }
      
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
  }, [hmsActions, onLeave, isConnected, userRole, user, trackAttendance, endSession, isRecording, recordingId, sessionId, roomId]);

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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Joining video room...
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
        chatComponent={
          <ChatPanel
            messages={messages}
            onSendMessage={sendMessage}
            onClose={() => setChatOpen(false)}
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
            isRecording={isRecording}
            peers={peers}
            messages={messages}
            chatOpen={chatOpen}
            participantsOpen={participantsOpen}
            isMobile={isMobile}
            raiseHandRequests={raiseHandRequests}
            isFullscreen={isFullscreen}
            fullscreenPeerId={fullscreenPeerId}
            attendance={attendance}
            onToggleVideo={toggleVideo}
            onToggleAudio={toggleAudio}
            onToggleScreenShare={toggleScreenShare}
            onToggleRecording={toggleRecording}
            onToggleChat={() => setChatOpen(!chatOpen)}
            onToggleParticipants={() => setParticipantsOpen(!participantsOpen)}
            onRaiseHand={handleRaiseHand}
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
  isRecording: boolean;
  peers: HMSPeer[];
  messages: HMSMessage[];
  chatOpen: boolean;
  participantsOpen: boolean;
  isMobile: boolean;
  raiseHandRequests: Set<string>;
  isFullscreen?: boolean;
  fullscreenPeerId?: string | null;
  attendance: Map<string, { joinTime: Date; duration: number }>;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  onToggleRecording: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onRaiseHand: () => void;
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
  isRecording,
  peers,
  messages,
  chatOpen,
  participantsOpen,
  isMobile,
  raiseHandRequests,
  isFullscreen = false,
  fullscreenPeerId = null,
  attendance,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onToggleRecording,
  onToggleChat,
  onToggleParticipants,
  onRaiseHand,
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
          <Box display="flex" alignItems="center" gap={1}>
            {isRecording && (
              <Badge color="error" variant="dot">
                <Typography variant="caption" color="error">
                  REC
                </Typography>
              </Badge>
            )}
            <Typography variant="caption">
              {peers.length} participant{peers.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
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

          {/* Raise hand button (students only) */}
          {userRole === 'student' && (
            <Tooltip title="Raise hand to request to speak">
              <IconButton
                onClick={onRaiseHand}
                color="warning"
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  bgcolor: 'warning.light',
                  '&:hover': { bgcolor: 'warning.main' }
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

          {/* Recording (teacher/admin only) */}
          {(userRole === 'teacher' || userRole === 'admin') && (
            <Tooltip title={isRecording ? 'Stop recording' : 'Start recording'}>
              <IconButton
                onClick={onToggleRecording}
                color={isRecording ? 'error' : 'default'}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  bgcolor: isRecording ? 'error.light' : 'grey.300',
                  '&:hover': { bgcolor: isRecording ? 'error.main' : 'grey.400' }
                }}
              >
                {isRecording ? <Stop /> : <FiberManualRecord />}
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {!isMobile && <Divider orientation="vertical" flexItem />}

        {/* Secondary controls (desktop only) */}
        {!isMobile && (
          <Box display="flex" alignItems="center" gap={1}>
            {/* Chat toggle */}
            <Tooltip title="Toggle chat">
              <IconButton
                onClick={onToggleChat}
                color={chatOpen ? 'primary' : 'default'}
                size="medium"
              >
                <Badge badgeContent={messages.length} color="error">
                  <Chat />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Participants toggle */}
            <Tooltip title="Show participants">
              <IconButton
                onClick={onToggleParticipants}
                color={participantsOpen ? 'primary' : 'default'}
                size="medium"
              >
                <Badge 
                  badgeContent={
                    userRole === 'teacher' ? raiseHandRequests.size : 0
                  } 
                  color="warning"
                >
                  <People />
                </Badge>
              </IconButton>
            </Tooltip>
          </Box>
        )}

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
}> = ({ messages, onSendMessage, onClose }) => {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Chat</Typography>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          ×
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {messages.map((message, index) => (
          <Box key={index} sx={{ mb: 1 }}>
            <Typography variant="caption" color="textSecondary">
              {message.senderName}
            </Typography>
            <Typography variant="body2">{message.message}</Typography>
          </Box>
        ))}
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
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Participants ({peers.length})</Typography>
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
                p: 2,
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                bgcolor: hasRaisedHand ? 'warning.light' : 'transparent'
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2">
                  {peer.name} {peer.isLocal && '(You)'}
                  {hasRaisedHand && (
                    <Box component="span" sx={{ ml: 1, color: 'warning.main' }}>
                      🤚 Wants to speak
                    </Box>
                  )}
                </Typography>
                {peerAttendance && (
                  <Typography variant="caption" color="textSecondary">
                    Duration: {Math.floor(duration / 60)}m {duration % 60}s
                  </Typography>
                )}
              </Box>
              <Box display="flex" gap={0.5} alignItems="center">
                {!peer.audioTrack && <MicOff fontSize="small" color="error" />}
                {!peer.videoTrack && <VideocamOff fontSize="small" color="error" />}
                {hasRaisedHand && <PanTool fontSize="small" color="warning" />}
                {isStudent && hasRaisedHand && (
                  <Tooltip title="Allow student to speak">
                    <IconButton
                      size="small"
                      onClick={() => onAllowStudentToSpeak(peer.id)}
                      color="success"
                    >
                      <Mic />
                    </IconButton>
                  </Tooltip>
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

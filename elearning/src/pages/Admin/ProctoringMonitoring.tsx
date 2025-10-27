import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress,
  styled,
  keyframes
} from '@mui/material';
import {
  Videocam,
  Warning,
  CheckCircle,
  Person,
  Visibility,
  Security,
  Flag,
  PlayArrow,
  Stop,
  Refresh,
  Send,
  Block,
  Message,
  PersonOff,
  VolumeUp,
  TabUnselected,
  FullscreenExit
} from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';

// Real-time proctoring data is now derived from socket connections

// Styled components and animations
const pulse = keyframes`
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const LiveIndicator = styled(Box)(({ theme }) => ({
  animation: `${pulse} 2s infinite`,
}));

interface LiveStudent {
  id: string;
  name: string;
  email: string;
  assessmentId: string;
  assessmentTitle: string;
  joinedAt: string;
  lastFrame?: string;
  lastFrameTime?: string;
  violations: number;
  tabSwitches: number;
  faceDetected: boolean;
  audioLevel: number;
  status: 'active' | 'flagged' | 'disconnected';
}

interface ProctoringViolation {
  id: string;
  studentId: string;
  studentName: string;
  assessmentId: string;
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

const ProctoringMonitoring: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Real-time proctoring state - moved before useMemo
  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([]);
  const [realtimeViolations, setRealtimeViolations] = useState<ProctoringViolation[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<LiveStudent | null>(null);
  const [studentDialogOpen, setStudentDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [showDebug, setShowDebug] = useState(process.env.NODE_ENV === 'development');
  
  // Derive real data from live students
  const proctoringData = React.useMemo(() => {
    // Group students by assessment to create active exams
    const examMap = new Map();
    
    liveStudents.forEach(student => {
      if (!examMap.has(student.assessmentId)) {
        examMap.set(student.assessmentId, {
          id: student.assessmentId,
          title: student.assessmentTitle,
          course: 'Course Name', // You might want to get this from the assessment data
          instructor: 'Instructor Name', // You might want to get this from the assessment data
          studentsCount: 0,
          activeStudents: 0,
          startTime: student.joinedAt,
          duration: 120, // Default duration, you might want to get this from assessment data
          flaggedBehaviors: 0
        });
      }
      
      const exam = examMap.get(student.assessmentId);
      exam.studentsCount++;
      if (student.status === 'active') {
        exam.activeStudents++;
      }
      if (student.status === 'flagged') {
        exam.flaggedBehaviors++;
      }
    });
    
    return {
      activeExams: Array.from(examMap.values()),
      flaggedBehaviors: realtimeViolations.map(v => ({
        id: v.id,
        examId: v.assessmentId,
        studentName: v.studentName,
        studentEmail: '', // You might want to get this from student data
        behavior: v.description,
        severity: v.severity,
        timestamp: v.timestamp,
        screenshot: null,
        reviewed: false
      })),
      examHistory: [] // You might want to implement this with completed assessments
    };
  }, [liveStudents, realtimeViolations]);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [flaggedDialogOpen, setFlaggedDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    initializeSocket();
    
    // Add some test data for development (remove in production)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        console.log('Adding test student data for development');
        setLiveStudents([
          {
            id: 'test-student-1',
            name: 'John Doe',
            email: 'john@example.com',
            assessmentId: 'test-assessment-1',
            assessmentTitle: 'Mathematics Final Exam',
            joinedAt: new Date().toISOString(),
            violations: 0,
            tabSwitches: 1,
            faceDetected: true,
            audioLevel: 25,
            status: 'active',
            lastFrame: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
            lastFrameTime: new Date().toISOString()
          }
        ]);
      }, 2000);
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const initializeSocket = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    setConnectionStatus('connecting');
    
    socketRef.current = io(backendUrl, {
      transports: ['websocket'],
      upgrade: true
    });

    socketRef.current.on('connect', () => {
      console.log('Admin socket connected for proctoring');
      setConnectionStatus('connected');
      
      // Join admin proctoring room
      socketRef.current?.emit('join_proctoring_session', {
        role: 'admin'
      });
      
      // Request current active students
      socketRef.current?.emit('get_active_students');
      
      setSuccess('Connected to proctoring server');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Admin socket disconnected');
      setConnectionStatus('disconnected');
    });

    // Handle receiving active students list
    socketRef.current.on('active_students_list', (data) => {
      console.log('Received active students:', data);
      if (data.students && Array.isArray(data.students)) {
        const students: LiveStudent[] = data.students.map((student: any) => ({
          id: student.studentId || student.id,
          name: student.studentName || student.name || 'Unknown Student',
          email: student.studentEmail || student.email || '',
          assessmentId: student.assessmentId,
          assessmentTitle: student.assessmentTitle || 'Unknown Assessment',
          joinedAt: student.joinedAt || new Date().toISOString(),
          violations: student.violations || 0,
          tabSwitches: student.tabSwitches || 0,
          faceDetected: student.faceDetected ?? true,
          audioLevel: student.audioLevel || 0,
          status: student.status || 'active',
          lastFrame: student.lastFrame,
          lastFrameTime: student.lastFrameTime
        }));
        setLiveStudents(students);
      }
    });

    // Handle student joining proctoring session
    socketRef.current.on('student_joined_proctoring', (data) => {
      console.log('Student joined proctoring:', data);
      const newStudent: LiveStudent = {
        id: data.studentId,
        name: data.studentName || 'Unknown Student',
        email: data.studentEmail || '',
        assessmentId: data.assessmentId,
        assessmentTitle: data.assessmentTitle || 'Unknown Assessment',
        joinedAt: new Date().toISOString(),
        violations: 0,
        tabSwitches: 0,
        faceDetected: true,
        audioLevel: 0,
        status: 'active'
      };
      
      setLiveStudents(prev => {
        const existing = prev.find(s => s.id === data.studentId);
        if (existing) {
          return prev.map(s => s.id === data.studentId ? { ...s, status: 'active' } : s);
        }
        return [...prev, newStudent];
      });
    });

    // Handle student leaving proctoring session
    socketRef.current.on('student_left_proctoring', (data) => {
      setLiveStudents(prev => 
        prev.map(s => 
          s.id === data.studentId 
            ? { ...s, status: 'disconnected' } 
            : s
        )
      );
    });

    // Handle video frames from students
    socketRef.current.on('video_frame', (data) => {
      console.log('Received video frame from student:', data.studentId);
      setLiveStudents(prev => 
        prev.map(student => 
          student.id === data.studentId 
            ? {
                ...student,
                lastFrame: data.frame,
                lastFrameTime: data.timestamp || new Date().toISOString(),
                faceDetected: data.metadata?.faceDetected ?? true,
                audioLevel: data.metadata?.audioLevel ?? 0,
                violations: data.metadata?.violations ?? student.violations,
                tabSwitches: data.metadata?.tabSwitches ?? student.tabSwitches,
                status: 'active'
              }
            : student
        )
      );
    });

    // Handle proctoring data updates
    socketRef.current.on('proctoring_data', (data) => {
      console.log('Received proctoring data:', data);
      if (data.studentId) {
        setLiveStudents(prev => 
          prev.map(student => 
            student.id === data.studentId 
              ? {
                  ...student,
                  faceDetected: data.faceDetected ?? student.faceDetected,
                  audioLevel: data.audioLevel ?? student.audioLevel,
                  violations: data.violations ?? student.violations,
                  tabSwitches: data.tabSwitches ?? student.tabSwitches,
                  status: data.status || student.status
                }
              : student
          )
        );
      }
    });

    // Handle proctoring violations
    socketRef.current.on('proctoring_violation', (data) => {
      // Get student name from current state
      setLiveStudents(prev => {
        const student = prev.find(s => s.id === data.studentId);
        const studentName = student?.name || data.studentName || 'Unknown';
        
        const violation: ProctoringViolation = {
          id: Date.now().toString(),
          studentId: data.studentId,
          studentName: studentName,
          assessmentId: data.assessmentId,
          type: data.violation.type,
          description: data.violation.description,
          severity: data.violation.severity,
          timestamp: data.violation.timestamp
        };

        setRealtimeViolations(prevViolations => [violation, ...prevViolations]);
        
        // Update student status if high severity
        if (data.violation.severity === 'high') {
          return prev.map(s => 
            s.id === data.studentId 
              ? { ...s, status: 'flagged' } 
              : s
          );
        }
        
        return prev;
      });
    });

    // Handle additional socket events
    socketRef.current.on('student_status_update', (data) => {
      console.log('Student status update:', data);
      setLiveStudents(prev => 
        prev.map(student => 
          student.id === data.studentId 
            ? { ...student, status: data.status }
            : student
        )
      );
    });

    socketRef.current.on('assessment_started', (data) => {
      console.log('Assessment started:', data);
      // This could trigger a refresh of active students
      socketRef.current?.emit('get_active_students');
    });

    socketRef.current.on('assessment_ended', (data) => {
      console.log('Assessment ended:', data);
      setLiveStudents(prev => 
        prev.filter(student => student.assessmentId !== data.assessmentId)
      );
    });

    // Handle ping response
    socketRef.current.on('pong', (data) => {
      console.log('Received pong from server:', data);
      const latency = Date.now() - data.timestamp;
      setSuccess(`Connection test successful! Latency: ${latency}ms`);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('disconnected');
      setError('Failed to connect to proctoring server. Please check your connection.');
    });

    socketRef.current.on('reconnect', () => {
      console.log('Socket reconnected');
      setConnectionStatus('connected');
      setError(null);
      setSuccess('Reconnected to proctoring server');
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnectionStatus('disconnected');
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        setTimeout(() => {
          if (socketRef.current) {
            socketRef.current.connect();
          }
        }, 1000);
      }
    });
  };

  // Clear messages after timeout
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Periodic refresh of student data
  useEffect(() => {
    const interval = setInterval(() => {
      if (socketRef.current && connectionStatus === 'connected') {
        console.log('Requesting active students (periodic refresh)');
        socketRef.current.emit('get_active_students');
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [connectionStatus]);

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    // Reconnect socket if disconnected
    if (connectionStatus === 'disconnected') {
      initializeSocket();
    }
    setTimeout(() => {
      setLoading(false);
      setSuccess('Proctoring data refreshed successfully!');
    }, 1000);
  };

  // Handle view exam details
  const handleViewExam = (exam: any) => {
    setSelectedExam(exam);
    setViewDialogOpen(true);
  };

  // Handle view flagged behavior
  const handleViewFlag = (flag: any) => {
    setSelectedFlag(flag);
    setFlaggedDialogOpen(true);
  };

  // Handle mark flag as reviewed
  const handleMarkReviewed = (flagId: string) => {
    // TODO: Implement API call to mark flag as reviewed
    setSuccess('Flagged behavior marked as reviewed');
    setFlaggedDialogOpen(false);
  };

  // Handle student selection for detailed view
  const handleViewStudent = (student: LiveStudent) => {
    setSelectedStudent(student);
    setStudentDialogOpen(true);
  };

  // Send warning to student
  const sendWarningToStudent = (studentId: string, message: string) => {
    if (!socketRef.current) return;
    
    socketRef.current.emit('admin_message', {
      studentId,
      type: 'warning',
      message: message || 'Please maintain proper exam conduct'
    });
    
    setSuccess(`Warning sent to student`);
    setWarningMessage('');
  };

  // Auto-submit student assessment
  const autoSubmitAssessment = (studentId: string, reason: string) => {
    if (!socketRef.current) return;
    
    if (window.confirm('Are you sure you want to auto-submit this student\'s assessment? This action cannot be undone.')) {
      socketRef.current.emit('admin_message', {
        studentId,
        type: 'auto_submit',
        message: reason || 'Assessment auto-submitted due to policy violation'
      });
      
      // Update student status
      setLiveStudents(prev => 
        prev.map(s => 
          s.id === studentId 
            ? { ...s, status: 'disconnected' } 
            : s
        )
      );
      
      setSuccess(`Assessment auto-submitted for student`);
      setStudentDialogOpen(false);
    }
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString();
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Calculate exam progress
  const getExamProgress = (exam: any) => {
    const startTime = new Date(exam.startTime);
    const now = new Date();
    const elapsed = Math.max(0, now.getTime() - startTime.getTime());
    const duration = exam.duration * 60 * 1000; // Convert minutes to milliseconds
    return Math.min(100, (elapsed / duration) * 100);
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const LiveMonitoringTab = () => (
    <Box>
      {/* Connection Status */}
      <Alert 
        severity={connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'error'}
        sx={{ mb: 3 }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography>
              Real-time Connection: {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Students detected: {liveStudents.length} | Backend: {process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}
            </Typography>
            {showDebug && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Socket ID: {socketRef.current?.id || 'Not connected'} | 
                Violations: {realtimeViolations.length} | 
                Last refresh: {new Date().toLocaleTimeString()}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {connectionStatus === 'disconnected' && (
              <Button size="small" onClick={initializeSocket}>
                Reconnect
              </Button>
            )}
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? 'Hide' : 'Show'} Debug
            </Button>
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => {
                console.log('Testing socket connection...');
                socketRef.current?.emit('ping', { timestamp: Date.now() });
                setSuccess('Ping sent to server');
              }}
              disabled={connectionStatus !== 'connected'}
            >
              Test Connection
            </Button>
          </Box>
        </Box>
      </Alert>

      {/* Live Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3} key="active-students">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Videocam color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{liveStudents ? liveStudents.filter(s => s.status === 'active').length : 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} key="flagged-students">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{liveStudents.filter(s => s.status === 'flagged').length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Flagged Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} key="total-violations">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Flag color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{realtimeViolations.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Violations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} key="disconnected-students">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonOff color="disabled" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{liveStudents.filter(s => s.status === 'disconnected').length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Disconnected
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Live Video Feeds */}
      {!liveStudents || liveStudents.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Videocam sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No students currently taking proctored assessments
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Live video feeds will appear here when students start proctored assessments.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<Refresh />}
                  onClick={() => {
                    socketRef.current?.emit('get_active_students');
                    setSuccess('Refreshing student list...');
                  }}
                >
                  Refresh
                </Button>
                {connectionStatus === 'disconnected' && (
                  <Button 
                    variant="contained" 
                    onClick={initializeSocket}
                  >
                    Reconnect
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {liveStudents && liveStudents.map((student) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={student.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: student.status === 'flagged' ? 2 : 1,
                  borderColor: student.status === 'flagged' ? 'error.main' : 'divider'
                }}
              >
                <CardContent sx={{ p: 1 }}>
                  {/* Student Info Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, fontSize: '0.75rem' }}>
                        {student.name.charAt(0)}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" noWrap fontWeight="medium">
                          {student.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {student.assessmentTitle}
                        </Typography>
                      </Box>
                    </Box>
                    <Chip
                      label={student.status}
                      size="small"
                      color={
                        student.status === 'active' ? 'success' :
                        student.status === 'flagged' ? 'error' : 'default'
                      }
                    />
                  </Box>

                  {/* Video Feed */}
                  <Box 
                    sx={{ 
                      position: 'relative',
                      width: '100%',
                      height: 180,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      mb: 1,
                      overflow: 'hidden',
                      border: student.status === 'flagged' ? '2px solid' : '1px solid',
                      borderColor: student.status === 'flagged' ? 'error.main' : 'divider',
                      cursor: 'pointer'
                    }}
                    onClick={() => handleViewStudent(student)}
                  >
                    {student.lastFrame ? (
                      <>
                        <img
                          src={student.lastFrame}
                          alt={`${student.name} video feed`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                          onError={(e) => {
                            console.error('Failed to load video frame for student:', student.id);
                            e.currentTarget.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Video frame loaded for student:', student.id);
                          }}
                        />
                        {/* Live indicator */}
                        <Box sx={{ 
                          position: 'absolute', 
                          bottom: 4, 
                          left: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          bgcolor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          fontSize: '0.7rem'
                        }}>
                          {student.status === 'active' ? (
                            <LiveIndicator sx={{ 
                              width: 6, 
                              height: 6, 
                              bgcolor: 'success.main',
                              borderRadius: '50%'
                            }} />
                          ) : (
                            <Box sx={{ 
                              width: 6, 
                              height: 6, 
                              bgcolor: 'error.main',
                              borderRadius: '50%'
                            }} />
                          )}
                          <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                            {student.status === 'active' ? 'LIVE' : 'OFFLINE'}
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        height: '100%',
                        flexDirection: 'column'
                      }}>
                        <Videocam sx={{ fontSize: 32, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          {student.status === 'disconnected' ? 'Disconnected' : 'Waiting for video...'}
                        </Typography>
                        {student.status === 'active' && (
                          <CircularProgress size={20} sx={{ mt: 1 }} />
                        )}
                      </Box>
                    )}
                    
                    {/* Status Indicators */}
                    <Box sx={{ position: 'absolute', top: 4, left: 4, display: 'flex', gap: 0.5 }}>
                      {!student.faceDetected && (
                        <Chip
                          icon={<PersonOff />}
                          label="No Face"
                          size="small"
                          color="error"
                          sx={{ height: 20, fontSize: '0.6rem' }}
                        />
                      )}
                      {student.audioLevel > 50 && (
                        <Chip
                          icon={<VolumeUp />}
                          label="Audio"
                          size="small"
                          color="warning"
                          sx={{ height: 20, fontSize: '0.6rem' }}
                        />
                      )}
                    </Box>

                    {/* Violation Count */}
                    {student.violations > 0 && (
                      <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
                        <Badge badgeContent={student.violations} color="error">
                          <Warning color="error" />
                        </Badge>
                      </Box>
                    )}
                  </Box>

                  {/* Student Stats */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Violations: {student.violations}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Tab switches: {student.tabSwitches}
                    </Typography>
                  </Box>

                  {/* Last Update */}
                  {student.lastFrameTime && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Last update: {new Date(student.lastFrameTime).toLocaleTimeString()}
                    </Typography>
                  )}

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewStudent(student)}
                      startIcon={<Visibility />}
                      sx={{ flex: 1, fontSize: '0.7rem' }}
                    >
                      View
                    </Button>
                    <Tooltip title="Send Warning">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => {
                          setSelectedStudent(student);
                          setWarningMessage('Please maintain proper exam conduct');
                          sendWarningToStudent(student.id, 'Please maintain proper exam conduct');
                        }}
                      >
                        <Message />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Auto Submit">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => autoSubmitAssessment(student.id, 'Multiple violations detected')}
                      >
                        <Block />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );

  const ActiveExamsTab = () => (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3} key="active-exams-count">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PlayArrow color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">{proctoringData.activeExams.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Exams
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} key="students-online">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Person color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {proctoringData.activeExams.reduce((sum, exam) => sum + exam.activeStudents, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Students Online
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} key="active-flags">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {proctoringData.activeExams.reduce((sum, exam) => sum + exam.flaggedBehaviors, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Flags
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3} key="video-feeds">
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Videocam color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h4">
                    {proctoringData.activeExams.reduce((sum, exam) => sum + exam.activeStudents, 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Camera Feeds
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Exams */}
      <Grid container spacing={3}>
        {proctoringData.activeExams.map((exam) => (
          <Grid item xs={12} md={6} key={exam.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6">{exam.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {exam.course} • {exam.instructor}
                    </Typography>
                  </Box>
                  <Chip
                    label="LIVE"
                    color="error"
                    size="small"
                    icon={<Videocam />}
                  />
                </Box>
                
                <Box mb={2}>
                  <Typography variant="body2" gutterBottom>
                    Progress: {Math.round(getExamProgress(exam))}%
                  </Typography>
                  <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1, height: 8 }}>
                    <Box
                      sx={{
                        width: `${getExamProgress(exam)}%`,
                        bgcolor: 'primary.main',
                        height: '100%',
                        borderRadius: 1,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} key={`${exam.id}-students`}>
                    <Typography variant="body2">
                      <strong>Students:</strong> {exam.activeStudents}/{exam.studentsCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} key={`${exam.id}-duration`}>
                    <Typography variant="body2">
                      <strong>Duration:</strong> {exam.duration} min
                    </Typography>
                  </Grid>
                  <Grid item xs={6} key={`${exam.id}-started`}>
                    <Typography variant="body2">
                      <strong>Started:</strong> {formatTime(exam.startTime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} key={`${exam.id}-flags`}>
                    <Typography variant="body2" color={exam.flaggedBehaviors > 0 ? 'error.main' : 'text.secondary'}>
                      <strong>Flags:</strong> {exam.flaggedBehaviors}
                    </Typography>
                  </Grid>
                </Grid>

                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewExam(exam)}
                  >
                    Monitor
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Flag />}
                    color={exam.flaggedBehaviors > 0 ? 'error' : 'inherit'}
                  >
                    Flags ({exam.flaggedBehaviors})
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const FlaggedBehaviorsTab = () => (
    <Box>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Exam</TableCell>
                <TableCell>Behavior</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proctoringData.flaggedBehaviors.map((flag) => (
                <TableRow key={flag.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                        {flag.studentName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2">{flag.studentName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {flag.studentEmail}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{flag.examId}</TableCell>
                  <TableCell>{flag.behavior}</TableCell>
                  <TableCell>
                    <Chip
                      label={flag.severity.toUpperCase()}
                      color={getSeverityColor(flag.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatTime(flag.timestamp)}</TableCell>
                  <TableCell>
                    <Chip
                      label={flag.reviewed ? 'Reviewed' : 'Pending'}
                      color={flag.reviewed ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewFlag(flag)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  const ExamHistoryTab = () => (
    <Box>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Exam</TableCell>
                <TableCell>Course</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Students</TableCell>
                <TableCell>Flags</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {proctoringData.examHistory.map((exam) => (
                <TableRow key={exam.id}>
                  <TableCell>{exam.title}</TableCell>
                  <TableCell>{exam.course}</TableCell>
                  <TableCell>{formatDate(exam.date)}</TableCell>
                  <TableCell>{exam.studentsCount}</TableCell>
                  <TableCell>
                    <Chip
                      label={exam.flaggedCount}
                      color={exam.flaggedCount > 0 ? 'warning' : 'success'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={exam.status.toUpperCase()}
                      color="success"
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  return (
    <Container maxWidth="lg">
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" gutterBottom>
              Proctoring & Exam Monitoring
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Real-time exam monitoring with AI-powered cheating detection.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Live Monitoring
                {liveStudents.filter(s => s.status === 'active').length > 0 && (
                  <Badge badgeContent={liveStudents.filter(s => s.status === 'active').length} color="primary" />
                )}
              </Box>
            } 
          />
          <Tab label={`Active Exams (${proctoringData.activeExams.length})`} />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                Flagged Behaviors ({proctoringData.flaggedBehaviors.filter(f => !f.reviewed).length + realtimeViolations.length})
                {realtimeViolations.length > 0 && (
                  <Badge badgeContent={realtimeViolations.length} color="error" />
                )}
              </Box>
            }
          />
          <Tab label="Exam History" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {currentTab === 0 && <LiveMonitoringTab />}
        {currentTab === 1 && <ActiveExamsTab />}
        {currentTab === 2 && <FlaggedBehaviorsTab />}
        {currentTab === 3 && <ExamHistoryTab />}
      </Box>

      {/* Exam Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Exam Monitoring - {selectedExam?.title}</DialogTitle>
        <DialogContent>
          {selectedExam && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>Live Camera Feeds</Typography>
              <Box sx={{ 
                height: 300, 
                bgcolor: 'grey.100', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: 1,
                mb: 2
              }}>
                <Typography variant="body2" color="text.secondary">
                  📹 Live camera feeds would be displayed here
                </Typography>
              </Box>
              
              <Typography variant="body2">
                <strong>Active Students:</strong> {selectedExam.activeStudents}/{selectedExam.studentsCount}
              </Typography>
              <Typography variant="body2">
                <strong>Exam Progress:</strong> {Math.round(getExamProgress(selectedExam))}%
              </Typography>
              <Typography variant="body2">
                <strong>Flagged Behaviors:</strong> {selectedExam.flaggedBehaviors}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Flagged Behavior Dialog */}
      <Dialog open={flaggedDialogOpen} onClose={() => setFlaggedDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Flagged Behavior Details</DialogTitle>
        <DialogContent>
          {selectedFlag && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2"><strong>Student:</strong> {selectedFlag.studentName}</Typography>
              <Typography variant="body2"><strong>Email:</strong> {selectedFlag.studentEmail}</Typography>
              <Typography variant="body2"><strong>Exam:</strong> {selectedFlag.examId}</Typography>
              <Typography variant="body2"><strong>Behavior:</strong> {selectedFlag.behavior}</Typography>
              <Typography variant="body2"><strong>Severity:</strong> 
                <Chip 
                  label={selectedFlag.severity.toUpperCase()}
                  color={getSeverityColor(selectedFlag.severity)}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="body2"><strong>Time:</strong> {new Date(selectedFlag.timestamp).toLocaleString()}</Typography>
              
              <Box sx={{ 
                mt: 2, 
                height: 200, 
                bgcolor: 'grey.100', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                borderRadius: 1
              }}>
                <Typography variant="body2" color="text.secondary">
                  📸 Screenshot/Video evidence would be displayed here
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFlaggedDialogOpen(false)}>Close</Button>
          {selectedFlag && !selectedFlag.reviewed && (
            <Button
              variant="contained"
              onClick={() => handleMarkReviewed(selectedFlag.id)}
            >
              Mark as Reviewed
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Student Detail Dialog */}
      <Dialog open={studentDialogOpen} onClose={() => setStudentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar>{selectedStudent?.name.charAt(0)}</Avatar>
            <Box>
              <Typography variant="h6">{selectedStudent?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedStudent?.assessmentTitle}
              </Typography>
            </Box>
            <Chip
              label={selectedStudent?.status}
              color={
                selectedStudent?.status === 'active' ? 'success' :
                selectedStudent?.status === 'flagged' ? 'error' : 'default'
              }
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ pt: 2 }}>
              {/* Large Video Feed */}
              <Box 
                sx={{ 
                  width: '100%',
                  height: 350,
                  bgcolor: 'grey.100',
                  borderRadius: 1,
                  mb: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  border: selectedStudent.status === 'flagged' ? '2px solid' : '1px solid',
                  borderColor: selectedStudent.status === 'flagged' ? 'error.main' : 'divider'
                }}
              >
                {selectedStudent.lastFrame ? (
                  <>
                    <img
                      src={selectedStudent.lastFrame}
                      alt={`${selectedStudent.name} video feed`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    {/* Video Controls Overlay */}
                    <Box sx={{ 
                      position: 'absolute', 
                      top: 8, 
                      right: 8,
                      display: 'flex',
                      gap: 1
                    }}>
                      <Tooltip title="Fullscreen View">
                        <IconButton
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(0,0,0,0.7)', 
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                          }}
                          onClick={() => {
                            // Open fullscreen video view
                            const newWindow = window.open('', '_blank', 'width=800,height=600');
                            if (newWindow) {
                              newWindow.document.write(`
                                <html>
                                  <head><title>${selectedStudent.name} - Live Feed</title></head>
                                  <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;">
                                    <img src="${selectedStudent.lastFrame}" style="max-width:100%;max-height:100%;object-fit:contain;" />
                                  </body>
                                </html>
                              `);
                            }
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    {/* Live Status Indicator */}
                    <Box sx={{ 
                      position: 'absolute', 
                      bottom: 8, 
                      left: 8,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'rgba(0,0,0,0.8)',
                      color: 'white',
                      px: 2,
                      py: 1,
                      borderRadius: 2
                    }}>
                      {selectedStudent.status === 'active' ? (
                        <LiveIndicator sx={{ 
                          width: 8, 
                          height: 8, 
                          bgcolor: 'success.main',
                          borderRadius: '50%'
                        }} />
                      ) : (
                        <Box sx={{ 
                          width: 8, 
                          height: 8, 
                          bgcolor: 'error.main',
                          borderRadius: '50%'
                        }} />
                      )}
                      <Typography variant="body2" fontWeight="bold">
                        {selectedStudent.status === 'active' ? 'LIVE' : 'OFFLINE'}
                      </Typography>
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        Last update: {selectedStudent.lastFrameTime ? 
                          new Date(selectedStudent.lastFrameTime).toLocaleTimeString() : 
                          'Never'
                        }
                      </Typography>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    flexDirection: 'column'
                  }}>
                    <Videocam sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      No video feed available
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStudent.status === 'disconnected' ? 
                        'Student has disconnected' : 
                        'Waiting for video stream...'
                      }
                    </Typography>
                    {selectedStudent.status === 'active' && (
                      <CircularProgress sx={{ mt: 2 }} />
                    )}
                  </Box>
                )}
              </Box>

              {/* Student Statistics */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} key="student-violations">
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="error.main">{selectedStudent.violations}</Typography>
                    <Typography variant="body2">Violations</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6} key="student-tab-switches">
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" color="warning.main">{selectedStudent.tabSwitches}</Typography>
                    <Typography variant="body2">Tab Switches</Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Status Indicators */}
              <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                  icon={selectedStudent.faceDetected ? <Person /> : <PersonOff />}
                  label={selectedStudent.faceDetected ? 'Face Detected' : 'No Face'}
                  color={selectedStudent.faceDetected ? 'success' : 'error'}
                />
                <Chip
                  icon={<VolumeUp />}
                  label={`Audio Level: ${Math.round(selectedStudent.audioLevel)}`}
                  color={selectedStudent.audioLevel > 50 ? 'warning' : 'default'}
                />
                <Chip
                  label={`Joined: ${new Date(selectedStudent.joinedAt).toLocaleTimeString()}`}
                  variant="outlined"
                />
              </Box>

              {/* Warning Message Input */}
              <TextField
                fullWidth
                label="Warning Message"
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Enter a warning message for the student..."
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />

              {/* Recent Violations */}
              {realtimeViolations.filter(v => v.studentId === selectedStudent.id).length > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Recent Violations</Typography>
                  <List dense>
                    {realtimeViolations
                      .filter(v => v.studentId === selectedStudent.id)
                      .slice(0, 5)
                      .map((violation) => (
                        <ListItem key={violation.id}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: getSeverityColor(violation.severity) + '.main' }}>
                              <Warning />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={violation.description}
                            secondary={`${violation.severity.toUpperCase()} - ${new Date(violation.timestamp).toLocaleTimeString()}`}
                          />
                        </ListItem>
                      ))}
                  </List>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStudentDialogOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            color="warning"
            startIcon={<Send />}
            onClick={() => selectedStudent && sendWarningToStudent(selectedStudent.id, warningMessage)}
            disabled={!warningMessage.trim()}
          >
            Send Warning
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<Block />}
            onClick={() => selectedStudent && autoSubmitAssessment(selectedStudent.id, 'Multiple violations detected')}
          >
            Auto Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProctoringMonitoring;

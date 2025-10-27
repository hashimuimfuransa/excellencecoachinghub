import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  Alert,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Paper,
  LinearProgress,
  Stack,
  Badge,
  Tooltip,
  AppBar,
  Toolbar,
  Switch,
  FormControlLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  Security,
  Warning,
  CheckCircle,
  Error,
  Visibility,
  VisibilityOff,
  Psychology,
  Videocam,
  VideocamOff,
  Mic,
  MicOff,
  ScreenShare,
  Flag,
  Person,
  Assessment,
  Timer,
  Stop,
  PlayArrow,
  Refresh,
  FilterList,
  Search,
  Download,
  Settings,
  Dashboard,
  TrendingUp,
  Group,
  School,
  MonitorHeart,
  SmartToy,
  CameraAlt,
  RecordVoiceOver,
  FaceRetouchingNatural,
  RemoveRedEye,
  Block,
  CheckCircleOutline,
  ErrorOutline,
  WarningAmber
} from '@mui/icons-material';

interface ProctoringSession {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  assessmentId: string;
  assessmentTitle: string;
  courseTitle: string;
  startTime: string;
  status: 'active' | 'completed' | 'terminated';
  violations: ProctoringViolation[];
  aiConfidence: number;
  cameraStatus: 'active' | 'inactive' | 'blocked';
  microphoneStatus: 'active' | 'inactive' | 'blocked';
  screenStatus: 'fullscreen' | 'windowed' | 'minimized';
  timeRemaining: number;
  progress: number;
  warningCount: number;
  flagged: boolean;
}

interface ProctoringViolation {
  id: string;
  type: 'face_not_visible' | 'multiple_faces' | 'tab_switch' | 'window_blur' | 'suspicious_movement' | 'audio_anomaly' | 'screen_share_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  description: string;
  aiConfidence: number;
  screenshot?: string;
  audioClip?: string;
}

interface AIAnalytics {
  totalSessions: number;
  activeSessions: number;
  violationsDetected: number;
  averageConfidence: number;
  flaggedSessions: number;
  terminatedSessions: number;
}

const ProctoringDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<ProctoringSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ProctoringSession | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [aiAnalytics, setAiAnalytics] = useState<AIAnalytics>({
    totalSessions: 0,
    activeSessions: 0,
    violationsDetected: 0,
    averageConfidence: 0,
    flaggedSessions: 0,
    terminatedSessions: 0
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'flagged'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockSessions: ProctoringSession[] = [
      {
        id: '1',
        studentId: 'student1',
        studentName: 'John Doe',
        studentAvatar: '/avatars/john.jpg',
        assessmentId: 'assessment1',
        assessmentTitle: 'Mathematics Final Exam',
        courseTitle: 'Advanced Mathematics',
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'active',
        violations: [
          {
            id: 'v1',
            type: 'face_not_visible',
            severity: 'medium',
            timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            description: 'Student face not clearly visible for 15 seconds',
            aiConfidence: 0.85
          }
        ],
        aiConfidence: 0.92,
        cameraStatus: 'active',
        microphoneStatus: 'active',
        screenStatus: 'fullscreen',
        timeRemaining: 45 * 60,
        progress: 65,
        warningCount: 1,
        flagged: false
      },
      {
        id: '2',
        studentId: 'student2',
        studentName: 'Jane Smith',
        assessmentId: 'assessment2',
        assessmentTitle: 'Physics Quiz',
        courseTitle: 'Physics 101',
        startTime: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        status: 'active',
        violations: [
          {
            id: 'v2',
            type: 'tab_switch',
            severity: 'high',
            timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            description: 'Student switched to another tab/application',
            aiConfidence: 0.95
          },
          {
            id: 'v3',
            type: 'multiple_faces',
            severity: 'critical',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            description: 'Multiple faces detected in camera feed',
            aiConfidence: 0.98
          }
        ],
        aiConfidence: 0.88,
        cameraStatus: 'active',
        microphoneStatus: 'active',
        screenStatus: 'windowed',
        timeRemaining: 25 * 60,
        progress: 40,
        warningCount: 3,
        flagged: true
      }
    ];

    setSessions(mockSessions);
    setAiAnalytics({
      totalSessions: 15,
      activeSessions: 2,
      violationsDetected: 8,
      averageConfidence: 0.91,
      flaggedSessions: 1,
      terminatedSessions: 0
    });
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Refresh data every 5 seconds
      console.log('Refreshing proctoring data...');
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'face_not_visible': return <FaceRetouchingNatural />;
      case 'multiple_faces': return <Group />;
      case 'tab_switch': return <ScreenShare />;
      case 'window_blur': return <VisibilityOff />;
      case 'suspicious_movement': return <Psychology />;
      case 'audio_anomaly': return <RecordVoiceOver />;
      case 'screen_share_detected': return <ScreenShare />;
      default: return <Warning />;
    }
  };

  const getViolationColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const handleTerminateSession = (sessionId: string) => {
    if (window.confirm('Are you sure you want to terminate this proctoring session? The student\'s assessment will be automatically submitted.')) {
      setSessions(prev => prev.map(session => 
        session.id === sessionId 
          ? { ...session, status: 'terminated' as const }
          : session
      ));
    }
  };

  const handleFlagSession = (sessionId: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, flagged: !session.flagged }
        : session
    ));
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredSessions = sessions.filter(session => {
    if (filterStatus === 'active') return session.status === 'active';
    if (filterStatus === 'flagged') return session.flagged;
    return true;
  });

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <AppBar position="static" elevation={1} sx={{ bgcolor: 'white', color: 'text.primary', mb: 3 }}>
        <Toolbar>
          <Security sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h5" sx={{ flexGrow: 1, color: 'primary.main', fontWeight: 'bold' }}>
            AI Proctoring Dashboard
          </Typography>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto Refresh"
            />
            
            <Button
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
              variant="outlined"
            >
              Refresh
            </Button>
            
            <Button
              startIcon={<Download />}
              variant="outlined"
              color="info"
            >
              Export Report
            </Button>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* AI Analytics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.200' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Dashboard sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {aiAnalytics.totalSessions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Sessions
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PlayArrow sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {aiAnalytics.activeSessions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Now
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Warning sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" color="warning.main" fontWeight="bold">
                {aiAnalytics.violationsDetected}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Violations
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <SmartToy sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" color="info.main" fontWeight="bold">
                {Math.round(aiAnalytics.averageConfidence * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                AI Confidence
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'error.50', border: '1px solid', borderColor: 'error.200' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Flag sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" color="error.main" fontWeight="bold">
                {aiAnalytics.flaggedSessions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Flagged
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ bgcolor: 'grey.100', border: '1px solid', borderColor: 'grey.300' }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Stop sx={{ fontSize: 40, color: 'grey.600', mb: 1 }} />
              <Typography variant="h4" color="grey.600" fontWeight="bold">
                {aiAnalytics.terminatedSessions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Terminated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <FilterList />
            <Typography variant="h6">Filter Sessions:</Typography>
            
            <Button
              variant={filterStatus === 'all' ? 'contained' : 'outlined'}
              onClick={() => setFilterStatus('all')}
            >
              All ({sessions.length})
            </Button>
            
            <Button
              variant={filterStatus === 'active' ? 'contained' : 'outlined'}
              onClick={() => setFilterStatus('active')}
              color="success"
            >
              Active ({sessions.filter(s => s.status === 'active').length})
            </Button>
            
            <Button
              variant={filterStatus === 'flagged' ? 'contained' : 'outlined'}
              onClick={() => setFilterStatus('flagged')}
              color="error"
            >
              Flagged ({sessions.filter(s => s.flagged).length})
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Sessions Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Live Proctoring Sessions
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Assessment</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Time Left</TableCell>
                  <TableCell>AI Status</TableCell>
                  <TableCell>Violations</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSessions
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((session) => (
                  <TableRow key={session.id} sx={{ 
                    bgcolor: session.flagged ? 'error.50' : 'inherit',
                    '&:hover': { bgcolor: session.flagged ? 'error.100' : 'grey.50' }
                  }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={session.studentAvatar} sx={{ width: 40, height: 40 }}>
                          {session.studentName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {session.studentName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {session.studentId}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {session.assessmentTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {session.courseTitle}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Stack spacing={1}>
                        <Chip
                          label={session.status.toUpperCase()}
                          color={session.status === 'active' ? 'success' : session.status === 'terminated' ? 'error' : 'default'}
                          size="small"
                        />
                        
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={`Camera: ${session.cameraStatus}`}>
                            <Videocam 
                              fontSize="small" 
                              color={session.cameraStatus === 'active' ? 'success' : 'error'} 
                            />
                          </Tooltip>
                          <Tooltip title={`Microphone: ${session.microphoneStatus}`}>
                            <Mic 
                              fontSize="small" 
                              color={session.microphoneStatus === 'active' ? 'success' : 'error'} 
                            />
                          </Tooltip>
                          <Tooltip title={`Screen: ${session.screenStatus}`}>
                            <ScreenShare 
                              fontSize="small" 
                              color={session.screenStatus === 'fullscreen' ? 'success' : 'warning'} 
                            />
                          </Tooltip>
                        </Box>
                      </Stack>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={session.progress} 
                          sx={{ mb: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="caption">
                          {session.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        color={session.timeRemaining < 300 ? 'error.main' : 'text.primary'}
                        fontWeight={session.timeRemaining < 300 ? 'bold' : 'normal'}
                      >
                        {formatTime(session.timeRemaining)}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SmartToy color="info" fontSize="small" />
                        <Typography variant="body2">
                          {Math.round(session.aiConfidence * 100)}%
                        </Typography>
                        {session.aiConfidence > 0.9 ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : session.aiConfidence > 0.7 ? (
                          <WarningAmber color="warning" fontSize="small" />
                        ) : (
                          <ErrorOutline color="error" fontSize="small" />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {session.violations.length > 0 && (
                          <Badge badgeContent={session.violations.length} color="error">
                            <Warning color="warning" />
                          </Badge>
                        )}
                        {session.warningCount > 0 && (
                          <Chip
                            label={`${session.warningCount} warnings`}
                            size="small"
                            color="warning"
                          />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedSession(session);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title={session.flagged ? "Unflag" : "Flag Session"}>
                          <IconButton
                            size="small"
                            onClick={() => handleFlagSession(session.id)}
                            color={session.flagged ? "error" : "default"}
                          >
                            <Flag />
                          </IconButton>
                        </Tooltip>
                        
                        {session.status === 'active' && (
                          <Tooltip title="Terminate Session">
                            <IconButton
                              size="small"
                              onClick={() => handleTerminateSession(session.id)}
                              color="error"
                            >
                              <Stop />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredSessions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>

      {/* Session Details Dialog */}
      <Dialog 
        open={detailsDialogOpen} 
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Security color="primary" />
            <Typography variant="h6">
              Proctoring Session Details
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedSession && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Student Information
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar src={selectedSession.studentAvatar} sx={{ width: 60, height: 60 }}>
                        {selectedSession.studentName.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">{selectedSession.studentName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Student ID: {selectedSession.studentId}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="subtitle2" gutterBottom>Assessment:</Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>{selectedSession.assessmentTitle}</Typography>
                    
                    <Typography variant="subtitle2" gutterBottom>Course:</Typography>
                    <Typography variant="body2">{selectedSession.courseTitle}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      AI Monitoring Status
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        AI Confidence: {Math.round(selectedSession.aiConfidence * 100)}%
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={selectedSession.aiConfidence * 100}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>
                    
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CameraAlt />
                          <Typography>Camera</Typography>
                        </Box>
                        <Chip 
                          label={selectedSession.cameraStatus} 
                          color={selectedSession.cameraStatus === 'active' ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Mic />
                          <Typography>Microphone</Typography>
                        </Box>
                        <Chip 
                          label={selectedSession.microphoneStatus} 
                          color={selectedSession.microphoneStatus === 'active' ? 'success' : 'error'}
                          size="small"
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ScreenShare />
                          <Typography>Screen</Typography>
                        </Box>
                        <Chip 
                          label={selectedSession.screenStatus} 
                          color={selectedSession.screenStatus === 'fullscreen' ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Violations History ({selectedSession.violations.length})
                    </Typography>
                    
                    {selectedSession.violations.length > 0 ? (
                      <List>
                        {selectedSession.violations.map((violation, index) => (
                          <React.Fragment key={violation.id}>
                            <ListItem>
                              <ListItemAvatar>
                                <Avatar sx={{ 
                                  bgcolor: `${getViolationColor(violation.severity)}.main`,
                                  width: 40,
                                  height: 40
                                }}>
                                  {getViolationIcon(violation.type)}
                                </Avatar>
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="subtitle2">
                                      {violation.type.replace(/_/g, ' ').toUpperCase()}
                                    </Typography>
                                    <Chip 
                                      label={violation.severity} 
                                      size="small" 
                                      color={getViolationColor(violation.severity) as any}
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" sx={{ mb: 1 }}>
                                      {violation.description}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(violation.timestamp).toLocaleString()} • 
                                      AI Confidence: {Math.round(violation.aiConfidence * 100)}%
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                            {index < selectedSession.violations.length - 1 && <Divider />}
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Alert severity="success">
                        No violations detected for this session.
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>
            Close
          </Button>
          {selectedSession?.status === 'active' && (
            <Button 
              color="error" 
              variant="contained"
              onClick={() => {
                if (selectedSession) {
                  handleTerminateSession(selectedSession.id);
                  setDetailsDialogOpen(false);
                }
              }}
            >
              Terminate Session
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProctoringDashboard;
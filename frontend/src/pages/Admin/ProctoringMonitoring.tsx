import React, { useState, useEffect } from 'react';
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
  Divider
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
  Refresh
} from '@mui/icons-material';

// Mock proctoring data
const mockProctoringData = {
  activeExams: [
    {
      id: 'E001',
      title: 'Machine Learning Final Exam',
      course: 'ML Fundamentals',
      instructor: 'Dr. Sarah Johnson',
      studentsCount: 45,
      activeStudents: 42,
      startTime: '2024-01-15T14:00:00Z',
      duration: 120,
      flaggedBehaviors: 3
    },
    {
      id: 'E002',
      title: 'React Development Quiz',
      course: 'Advanced React',
      instructor: 'John Smith',
      studentsCount: 28,
      activeStudents: 26,
      startTime: '2024-01-15T15:30:00Z',
      duration: 60,
      flaggedBehaviors: 1
    }
  ],
  flaggedBehaviors: [
    {
      id: 'F001',
      examId: 'E001',
      studentName: 'Alice Brown',
      studentEmail: 'alice.brown@example.com',
      behavior: 'Multiple faces detected',
      severity: 'high',
      timestamp: '2024-01-15T14:25:00Z',
      screenshot: null,
      reviewed: false
    },
    {
      id: 'F002',
      examId: 'E001',
      studentName: 'Bob Wilson',
      studentEmail: 'bob.wilson@example.com',
      behavior: 'Tab switching detected',
      severity: 'medium',
      timestamp: '2024-01-15T14:18:00Z',
      screenshot: null,
      reviewed: false
    },
    {
      id: 'F003',
      examId: 'E002',
      studentName: 'Carol Davis',
      studentEmail: 'carol.davis@example.com',
      behavior: 'Eye tracking anomaly',
      severity: 'low',
      timestamp: '2024-01-15T15:45:00Z',
      screenshot: null,
      reviewed: true
    }
  ],
  examHistory: [
    {
      id: 'E003',
      title: 'Python Basics Test',
      course: 'Python Programming',
      date: '2024-01-14',
      studentsCount: 35,
      flaggedCount: 2,
      status: 'completed'
    },
    {
      id: 'E004',
      title: 'Database Design Exam',
      course: 'Database Systems',
      date: '2024-01-13',
      studentsCount: 22,
      flaggedCount: 0,
      status: 'completed'
    }
  ]
};

const ProctoringMonitoring: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [proctoringData] = useState(mockProctoringData);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [flaggedDialogOpen, setFlaggedDialogOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<any>(null);

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
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

  const ActiveExamsTab = () => (
    <Box>
      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
        <Grid item xs={12} sm={6} md={3}>
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
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Students:</strong> {exam.activeStudents}/{exam.studentsCount}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Duration:</strong> {exam.duration} min
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Started:</strong> {formatTime(exam.startTime)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
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
          <Tab label={`Active Exams (${proctoringData.activeExams.length})`} />
          <Tab label={`Flagged Behaviors (${proctoringData.flaggedBehaviors.filter(f => !f.reviewed).length})`} />
          <Tab label="Exam History" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box sx={{ mt: 2 }}>
        {currentTab === 0 && <ActiveExamsTab />}
        {currentTab === 1 && <FlaggedBehaviorsTab />}
        {currentTab === 2 && <ExamHistoryTab />}
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
    </Container>
  );
};

export default ProctoringMonitoring;

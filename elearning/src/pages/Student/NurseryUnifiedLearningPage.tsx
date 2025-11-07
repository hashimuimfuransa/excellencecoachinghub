import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
  Badge,
  Stack,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert as MuiAlert,
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  CheckCircle,
  ExpandMore,
  Schedule,
  School,
  Assignment as AssignmentIcon,
  VideoCall,
  FiberManualRecord,
  Close,
  AutoAwesome,
  Videocam,
  LibraryBooks,
  CloudUpload,
  Delete as DeleteIcon,
  EmojiEvents,
  OpenInNew,
  Download,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { weekService, Week, WeekMaterial } from '../../services/weekService';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import { assignmentService, Assignment as AssignmentType } from '../../services/assignmentService';
import { progressService } from '../../services/progressService';
import { liveSessionService } from '../../services/liveSessionService';
import { recordedSessionService } from '../../services/recordedSessionService';
import api from '../../services/api';
import LiveSessionStatus from '../../components/Student/LiveSessionStatus';

interface CourseProgressResponse {
  weekProgresses: any[];
  materialProgresses: any[];
}

const NurseryUnifiedLearningPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [course, setCourse] = useState<ICourse | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [progress, setProgress] = useState<CourseProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);
  const [recordings, setRecordings] = useState<any[]>([]);
  const [expandedWeek, setExpandedWeek] = useState<string | false>(false);
  const [completedAssignments, setCompletedAssignments] = useState<Set<string>>(new Set());
  
  // Homework upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentType | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [submissionText, setSubmissionText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  
  // Leaderboard state
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [submissions, setSubmissions] = useState<Map<string, any>>(new Map());
  
  // Submissions Gallery state
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [submissionsByAssignment, setSubmissionsByAssignment] = useState<Map<string, any[]>>(new Map());
  const [expandedAssignments, setExpandedAssignments] = useState<Set<string>>(new Set());

  // Load course data
  const loadCourseData = async () => {
    if (!courseId) {
      setError('No course ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        courseData,
        weeksData,
        progressResponse,
        liveSessionsResponse,
        assessmentsResponse,
        assignmentsResponse,
        recordedSessionsResponse,
      ] = await Promise.all([
        courseService.getCourseById(courseId),
        weekService.getCourseWeeks(courseId),
        api
          .get(`/progress/courses/${courseId}/progress`)
          .catch(() => ({ data: { data: { weekProgresses: [], materialProgresses: [] } } })),
        api
          .get(`/live-sessions/course/${courseId}`)
          .catch(() => ({ data: { data: [] } })),
        assessmentService.getCourseAssessments(courseId).catch(() => []),
        assignmentService.getCourseAssignments(courseId).catch(() => []),
        recordedSessionService
          .getRecordedSessionsForStudents(courseId)
          .catch(() => ({ data: [] })),
      ]);

      setCourse(courseData);
      setWeeks(weeksData);
      setProgress(progressResponse.data.data || { weekProgresses: [], materialProgresses: [] });
      setAssessments(Array.isArray(assessmentsResponse) ? assessmentsResponse : []);
      setAssignments(Array.isArray(assignmentsResponse) ? assignmentsResponse : []);

      // Process live sessions
      let sessionsData = liveSessionsResponse?.data?.data?.sessions
        || liveSessionsResponse?.data?.sessions
        || liveSessionsResponse?.data
        || [];

      if (!Array.isArray(sessionsData)) {
        sessionsData = [];
      }

      if (sessionsData.length === 0) {
        try {
          const serviceSessions = await liveSessionService.getCourseSessions(courseId);
          if (Array.isArray(serviceSessions)) {
            sessionsData = serviceSessions;
          }
        } catch (e) {
          console.warn('Fallback to liveSessionService failed:', e);
        }
      }

      const upcomingSessions = sessionsData
        .filter((session: any) => {
          const sessionDate = new Date(session.scheduledTime);
          const now = new Date();
          return sessionDate > now;
        })
        .sort(
          (a: any, b: any) =>
            new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
        )
        .slice(0, 3);

      setUpcomingEvents(upcomingSessions);

      // Process recorded sessions
      const recordedData = recordedSessionsResponse?.data || [];
      setRecordings(Array.isArray(recordedData) ? recordedData : []);

      // Load local storage for completed assignments
      const completedKey = `course:${courseId}:completedAssignments`;
      const completed = localStorage.getItem(completedKey);
      if (completed) {
        setCompletedAssignments(new Set(JSON.parse(completed)));
      }
    } catch (err: any) {
      console.error('Error loading course data:', err);
      setError(err.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleAssignmentClick = (assignmentId: string) => {
    navigate(`/dashboard/student/assignment/${assignmentId}`);
  };

  const handleMaterialClick = (material: WeekMaterial) => {
    // Handle exam materials differently - redirect to proctored assessment
    if (material.type === 'exam') {
      navigate(`/assessment/${material._id}`, {
        state: {
          examMaterial: material,
          fromWeek: true,
          courseId: courseId
        }
      });
      return;
    }
    
    // For other materials, navigate to material viewer
    navigate(`/material/${courseId}/${material._id}`);
  };

  const handleLiveSessionClick = (sessionId: string) => {
    navigate(`/dashboard/student/live-sessions/${sessionId}/room`);
  };

  const handleRecordedSessionClick = (sessionId: string) => {
    navigate(`/dashboard/student/recorded-sessions`);
  };

  const handleUploadClick = (assignment: AssignmentType) => {
    setSelectedAssignment(assignment);
    setUploadDialogOpen(true);
    setUploadedFiles([]);
    setSubmissionText('');
    setSubmissionError('');
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmitAssignment = async () => {
    if (!selectedAssignment) return;
    
    // Validate submission
    const hasText = submissionText.trim().length > 0;
    const hasFiles = uploadedFiles.length > 0;
    
    if (!hasText && !hasFiles) {
      setSubmissionError('Please submit either text or upload files');
      return;
    }

    setIsUploading(true);
    setSubmissionError('');
    
    try {
      // Prepare file URLs (in real implementation, upload to server first)
      const fileAttachments = uploadedFiles.map((file) => ({
        filename: file.name,
        originalName: file.name,
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        uploadedAt: new Date(),
      }));

      const submissionData = {
        assignmentId: selectedAssignment._id,
        submissionText: submissionText,
        attachments: fileAttachments,
        isDraft: false,
      };

      await assignmentService.submitAssignment(submissionData);

      setSuccessMessage(`Assignment "${selectedAssignment.title}" submitted successfully!`);
      setSubmissionSuccess(true);
      
      // Mark as completed
      const newCompleted = new Set(completedAssignments);
      newCompleted.add(selectedAssignment._id);
      setCompletedAssignments(newCompleted);
      localStorage.setItem(`course:${courseId}:completedAssignments`, JSON.stringify([...newCompleted]));
      
      // Close dialog
      setTimeout(() => {
        setUploadDialogOpen(false);
        setUploadedFiles([]);
        setSubmissionText('');
      }, 1000);
    } catch (error: any) {
      setSubmissionError(error.message || 'Failed to submit assignment');
    } finally {
      setIsUploading(false);
    }
  };

  const loadLeaderboard = async () => {
    if (!courseId) return;
    
    try {
      setLeaderboardLoading(true);
      
      // Get all submissions for this course
      const allSubmissions = await assignmentService.getStudentSubmissions(courseId);
      setSubmissions(new Map(allSubmissions.map(sub => [sub._id, sub])));

      // Get course assignments to count submissions per assignment
      const courseAssignments = await assignmentService.getCourseAssignments(courseId);
      
      // Build leaderboard data with submission stats
      const leaderboardMap = new Map<string, any>();
      
      allSubmissions.forEach((submission) => {
        const studentId = submission.student;
        if (!leaderboardMap.has(studentId)) {
          leaderboardMap.set(studentId, {
            studentId,
            submittedCount: 0,
            totalGrade: 0,
            lastSubmitted: new Date(0),
          });
        }
        
        const entry = leaderboardMap.get(studentId)!;
        entry.submittedCount += 1;
        if (submission.grade) {
          entry.totalGrade += submission.grade;
        }
        const submittedDate = new Date(submission.submittedAt || 0);
        if (submittedDate > entry.lastSubmitted) {
          entry.lastSubmitted = submittedDate;
        }
      });

      const leaderboard = Array.from(leaderboardMap.values())
        .sort((a, b) => {
          // Sort by submitted count (descending), then by average grade
          if (b.submittedCount !== a.submittedCount) {
            return b.submittedCount - a.submittedCount;
          }
          const avgGradeA = a.submittedCount > 0 ? a.totalGrade / a.submittedCount : 0;
          const avgGradeB = b.submittedCount > 0 ? b.totalGrade / b.submittedCount : 0;
          return avgGradeB - avgGradeA;
        })
        .slice(0, 10); // Top 10

      setLeaderboardData(leaderboard);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // Load submissions gallery data
  const loadSubmissionsGallery = async () => {
    if (!courseId) return;
    
    try {
      setSubmissionsLoading(true);
      
      // Get all submissions for this course
      const allSubs = await assignmentService.getStudentSubmissions(courseId);
      setAllSubmissions(allSubs);

      // Organize submissions by assignment
      const byAssignment = new Map<string, any[]>();
      allSubs.forEach((submission) => {
        const assignmentId = submission.assignment;
        if (!byAssignment.has(assignmentId)) {
          byAssignment.set(assignmentId, []);
        }
        byAssignment.get(assignmentId)!.push(submission);
      });

      setSubmissionsByAssignment(byAssignment);
    } catch (error) {
      console.error('Failed to load submissions gallery:', error);
    } finally {
      setSubmissionsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    loadSubmissionsGallery();
  }, [courseId, completedAssignments]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <CircularProgress sx={{ color: '#fff' }} size={60} />
        </motion.div>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={handleBackClick} sx={{ mt: 2 }}>
          Go Back
        </Button>
      </Container>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const animationVariants = {
    bounce: {
      y: [0, -10, 0],
      transition: { duration: 0.6, repeat: Infinity },
    },
    pulse: {
      scale: [1, 1.05, 1],
      transition: { duration: 1.5, repeat: Infinity },
    },
  };

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        pb: 6,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          pt: 3,
          pb: 3,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        <IconButton
          onClick={handleBackClick}
          sx={{
            color: 'white',
            '&:hover': { background: 'rgba(255, 255, 255, 0.2)' },
          }}
        >
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <motion.div variants={itemVariants}>
            <Typography
              variant={isMobile ? 'h5' : 'h4'}
              sx={{
                color: 'white',
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
              }}
            >
              🎓 {course?.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                mt: 0.5,
              }}
            >
              by {course?.instructor.firstName} {course?.instructor.lastName}
            </Typography>
          </motion.div>
        </Box>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Live Sessions Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                }}
              >
                🎥 Live Classes
              </Typography>

              {upcomingEvents.length > 0 ? (
                <Grid container spacing={2}>
                  {upcomingEvents.map((session: any, index: number) => (
                    <Grid item xs={12} sm={6} md={4} key={session._id || index}>
                      <motion.div
                        variants={animationVariants}
                        animate="pulse"
                        whileHover={{ scale: 1.05 }}
                      >
                        <Card
                          sx={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            border: '3px solid white',
                            borderRadius: '20px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                              transform: 'translateY(-5px)',
                            },
                          }}
                          onClick={() => handleLiveSessionClick(session._id)}
                        >
                          <CardContent
                            sx={{
                              textAlign: 'center',
                              color: 'white',
                              py: 3,
                            }}
                          >
                            <Box
                              sx={{
                                fontSize: '40px',
                                mb: 2,
                                animation: 'pulse 2s infinite',
                              }}
                            >
                              🔴 LIVE
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 'bold',
                                mb: 1,
                                wordWrap: 'break-word',
                              }}
                            >
                              {session.title}
                            </Typography>
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="center"
                              sx={{
                                mb: 2,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Chip
                                icon={<Schedule />}
                                label={new Date(session.scheduledTime).toLocaleDateString()}
                                sx={{
                                  background: 'rgba(255, 255, 255, 0.3)',
                                  color: 'white',
                                  '& .MuiChip-icon': { color: 'white' },
                                }}
                              />
                              <Chip
                                icon={<VideoCall />}
                                label="Join Now"
                                sx={{
                                  background: 'white',
                                  color: '#f5576c',
                                  fontWeight: 'bold',
                                }}
                              />
                            </Stack>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px dashed rgba(255, 255, 255, 0.3)',
                    borderRadius: '15px',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <Typography>No live classes scheduled yet 😊</Typography>
                </Paper>
              )}
            </Box>
          </motion.div>

          {/* Recorded Sessions Section */}
          {recordings.length > 0 && (
            <motion.div variants={itemVariants}>
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'white',
                    fontWeight: 'bold',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  📹 Recorded Videos
                </Typography>
                <Grid container spacing={2}>
                  {recordings.slice(0, 3).map((recording: any, index: number) => (
                    <Grid item xs={12} sm={6} md={4} key={recording._id || index}>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                      >
                        <Card
                          sx={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            border: '3px solid white',
                            borderRadius: '20px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                              transform: 'translateY(-5px)',
                            },
                          }}
                          onClick={() => handleRecordedSessionClick(recording._id)}
                        >
                          <CardContent
                            sx={{
                              textAlign: 'center',
                              color: 'white',
                              py: 3,
                            }}
                          >
                            <Box sx={{ fontSize: '40px', mb: 2 }}>
                              ▶️
                            </Box>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 'bold',
                                mb: 1,
                                wordWrap: 'break-word',
                              }}
                            >
                              {recording.title}
                            </Typography>
                            <Button
                              variant="contained"
                              sx={{
                                background: 'white',
                                color: '#00f2fe',
                                fontWeight: 'bold',
                                borderRadius: '10px',
                                mt: 1,
                              }}
                            >
                              Watch Now
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </motion.div>
          )}

          {/* Assignments/Devoir Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                }}
              >
                📝 Your Homework (Devoir)
              </Typography>

              {assignments.length > 0 ? (
                <Grid container spacing={2}>
                  {assignments.map((assignment: any, index: number) => {
                    const isCompleted = completedAssignments.has(assignment._id);
                    return (
                      <Grid item xs={12} sm={6} md={6} key={assignment._id || index}>
                        <motion.div
                          variants={animationVariants}
                          animate={isCompleted ? 'pulse' : 'bounce'}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Card
                            sx={{
                              background: isCompleted
                                ? 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
                                : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                              border: '3px solid white',
                              borderRadius: '20px',
                              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              '&:hover': {
                                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
                                transform: 'translateY(-5px)',
                              },
                            }}
                            onClick={() => handleAssignmentClick(assignment._id)}
                          >
                            {isCompleted && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 10,
                                  right: 10,
                                  fontSize: '30px',
                                }}
                              >
                                ✅
                              </Box>
                            )}
                            <CardContent
                              sx={{
                                color: 'white',
                                py: 3,
                              }}
                            >
                              <Box
                                sx={{
                                  fontSize: '40px',
                                  mb: 1,
                                  textAlign: 'center',
                                }}
                              >
                                {isCompleted ? '🎉' : '✍️'}
                              </Box>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 'bold',
                                  mb: 1,
                                  wordWrap: 'break-word',
                                  textAlign: 'center',
                                }}
                              >
                                {assignment.title}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  mb: 2,
                                  textAlign: 'center',
                                  opacity: 0.9,
                                }}
                              >
                                {assignment.description}
                              </Typography>
                              <Stack
                                direction="row"
                                spacing={1}
                                justifyContent="center"
                                sx={{
                                  flexWrap: 'wrap',
                                }}
                              >
                                {assignment.dueDate && (
                                  <Chip
                                    icon={<Schedule />}
                                    label={new Date(assignment.dueDate).toLocaleDateString()}
                                    sx={{
                                      background: 'rgba(255, 255, 255, 0.4)',
                                      color: 'white',
                                      '& .MuiChip-icon': { color: 'white' },
                                    }}
                                  />
                                )}
                              </Stack>
                              {!isCompleted && (
                                <Button
                                  variant="contained"
                                  fullWidth
                                  startIcon={<CloudUpload />}
                                  onClick={() => handleUploadClick(assignment)}
                                  sx={{
                                    background: 'white',
                                    color: '#fa709a',
                                    fontWeight: 'bold',
                                    borderRadius: '10px',
                                    mt: 2,
                                    '&:hover': {
                                      background: 'rgba(255, 255, 255, 0.9)',
                                    },
                                  }}
                                >
                                  Do Your Homework
                                </Button>
                              )}
                            </CardContent>
                          </Card>
                        </motion.div>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px dashed rgba(255, 255, 255, 0.3)',
                    borderRadius: '15px',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <Typography>No homework yet! 🎊</Typography>
                </Paper>
              )}
            </Box>
          </motion.div>

          {/* Week Materials Section (Collapsed) */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Accordion
                expanded={expandedWeek !== false}
                onChange={(event, isExpanded) => {
                  setExpandedWeek(isExpanded ? expandedWeek : false);
                }}
                sx={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '3px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '15px',
                  backdropFilter: 'blur(10px)',
                  '&:before': { display: 'none' },
                  '& .MuiAccordionSummary-root': {
                    color: 'white',
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: 'white' }} />}
                  sx={{
                    py: 2,
                    px: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      📚 Learning Materials
                    </Typography>
                    <Chip
                      label={`${weeks.length} weeks`}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.3)',
                        color: 'white',
                      }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails
                  sx={{
                    background: 'rgba(0, 0, 0, 0.1)',
                    borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                    py: 2,
                    px: 2,
                  }}
                >
                  {weeks.length > 0 ? (
                    <Box>
                      {weeks.map((week: Week, index: number) => (
                        <motion.div
                          key={week._id || index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <Paper
                            sx={{
                              p: 2,
                              mb: 2,
                              background: 'rgba(255, 255, 255, 0.15)',
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '10px',
                              color: 'white',
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 'bold',
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              📖 Week {index + 1}: {week.title}
                            </Typography>
                            {week.materials && week.materials.length > 0 && (
                              <Box sx={{ ml: 2 }}>
                                {week.materials.map(
                                  (material: WeekMaterial, mIndex: number) => (
                                    <Box
                                      key={material._id || mIndex}
                                      onClick={() => handleMaterialClick(material)}
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        py: 0.75,
                                        opacity: 0.9,
                                        cursor: 'pointer',
                                        px: 1,
                                        borderRadius: '8px',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                          background: 'rgba(255, 255, 255, 0.15)',
                                          opacity: 1,
                                          transform: 'translateX(8px)',
                                        },
                                      }}
                                    >
                                      <FiberManualRecord sx={{ fontSize: '12px' }} />
                                      <Typography variant="body2" sx={{ flex: 1 }}>
                                        {material.type === 'video' && '🎥'}
                                        {material.type === 'document' && '📄'}
                                        {material.type === 'quiz' && '📝'}
                                        {material.type === 'exam' && '📋'}
                                        {material.type === 'resource' && '📚'}
                                        {' '}
                                        {material.title}
                                      </Typography>
                                      <OpenInNew sx={{ fontSize: '16px', opacity: 0.6 }} />
                                    </Box>
                                  )
                                )}
                              </Box>
                            )}
                          </Paper>
                        </motion.div>
                      ))}
                    </Box>
                  ) : (
                    <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      No materials available yet.
                    </Typography>
                  )}
                </AccordionDetails>
              </Accordion>
            </Box>
          </motion.div>

          {/* Submissions Gallery Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                }}
              >
                👥 Peer Submissions Gallery
              </Typography>

              {submissionsLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress sx={{ color: 'white' }} />
                </Box>
              ) : allSubmissions.length > 0 ? (
                <Box>
                  {assignments.map((assignment: any) => {
                    const assignmentSubs = submissionsByAssignment.get(assignment._id) || [];
                    const isExpanded = expandedAssignments.has(assignment._id);
                    
                    if (assignmentSubs.length === 0) return null;

                    return (
                      <motion.div
                        key={assignment._id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <Accordion
                          expanded={isExpanded}
                          onChange={() => {
                            const newExpanded = new Set(expandedAssignments);
                            if (isExpanded) {
                              newExpanded.delete(assignment._id);
                            } else {
                              newExpanded.add(assignment._id);
                            }
                            setExpandedAssignments(newExpanded);
                          }}
                          sx={{
                            mb: 2,
                            background: 'rgba(255, 255, 255, 0.15)',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)',
                            '&:before': { display: 'none' },
                            '& .MuiAccordionSummary-root': {
                              color: 'white',
                              '&:hover': {
                                background: 'rgba(255, 255, 255, 0.1)',
                              },
                            },
                          }}
                        >
                          <AccordionSummary
                            expandIcon={<ExpandMore sx={{ color: 'white' }} />}
                            sx={{ py: 1.5, px: 2 }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  color: 'white',
                                  fontWeight: 'bold',
                                  flex: 1,
                                }}
                              >
                                📋 {assignment.title}
                              </Typography>
                              <Chip
                                label={`${assignmentSubs.length} submissions`}
                                sx={{
                                  background: 'rgba(255, 255, 255, 0.3)',
                                  color: 'white',
                                }}
                              />
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails
                            sx={{
                              background: 'rgba(0, 0, 0, 0.1)',
                              borderTop: '1px solid rgba(255, 255, 255, 0.2)',
                              py: 2,
                              px: 2,
                            }}
                          >
                            <Grid container spacing={2}>
                              {assignmentSubs.map((submission: any, index: number) => (
                                <Grid item xs={12} sm={6} md={4} key={submission._id || index}>
                                  <motion.div
                                    whileHover={{ scale: 1.03 }}
                                  >
                                    <Paper
                                      sx={{
                                        p: 2,
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        border: '2px solid rgba(255, 255, 255, 0.3)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                          background: 'rgba(255, 255, 255, 0.25)',
                                          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                                        },
                                      }}
                                    >
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>
                                          👤 Student
                                        </Typography>
                                        {submission.status === 'graded' && (
                                          <Chip
                                            label={`${submission.grade}%`}
                                            size="small"
                                            sx={{
                                              background: submission.grade >= 70 ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)',
                                              color: 'white',
                                            }}
                                          />
                                        )}
                                      </Box>
                                      <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
                                        📅 Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                                      </Typography>
                                      {submission.attachments && submission.attachments.length > 0 && (
                                        <Box sx={{ mb: 1 }}>
                                          <Typography variant="caption" sx={{ opacity: 0.9, fontWeight: 'bold' }}>
                                            📎 Files ({submission.attachments.length}):
                                          </Typography>
                                          {submission.attachments.map((file: any, fIndex: number) => (
                                            <Box key={fIndex} sx={{ mt: 0.5 }}>
                                              <Button
                                                component="a"
                                                href={file.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                variant="text"
                                                size="small"
                                                startIcon={<Download />}
                                                sx={{
                                                  color: 'rgba(255, 255, 255, 0.8)',
                                                  textTransform: 'none',
                                                  fontSize: '0.75rem',
                                                  '&:hover': { color: 'white' },
                                                }}
                                              >
                                                {file.originalName}
                                              </Button>
                                            </Box>
                                          ))}
                                        </Box>
                                      )}
                                      {submission.submissionText && (
                                        <Box sx={{ mt: 1, p: 1, background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px', maxHeight: '100px', overflow: 'hidden' }}>
                                          <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', wordBreak: 'break-word' }}>
                                            {submission.submissionText.substring(0, 150)}...
                                          </Typography>
                                        </Box>
                                      )}
                                      <Chip
                                        label={submission.status}
                                        size="small"
                                        sx={{
                                          mt: 1,
                                          background: submission.status === 'submitted' ? 'rgba(76, 175, 80, 0.5)' : submission.status === 'graded' ? 'rgba(33, 150, 243, 0.5)' : 'rgba(255, 152, 0, 0.5)',
                                          color: 'white',
                                        }}
                                      />
                                    </Paper>
                                  </motion.div>
                                </Grid>
                              ))}
                            </Grid>
                          </AccordionDetails>
                        </Accordion>
                      </motion.div>
                    );
                  })}
                </Box>
              ) : (
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px dashed rgba(255, 255, 255, 0.3)',
                    borderRadius: '15px',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <Typography>No peer submissions yet! 👀</Typography>
                </Paper>
              )}
            </Box>
          </motion.div>

          {/* Leaderboard Section */}
          <motion.div variants={itemVariants}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'white',
                  fontWeight: 'bold',
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
                }}
              >
                <EmojiEvents sx={{ fontSize: '28px' }} />
                🏆 Top Performers
              </Typography>

              {leaderboardLoading ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CircularProgress sx={{ color: 'white' }} />
                </Box>
              ) : leaderboardData.length > 0 ? (
                <Paper
                  sx={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <List sx={{ p: 0 }}>
                    {leaderboardData.map((entry, index) => (
                      <motion.div
                        key={entry.studentId}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <ListItem
                          sx={{
                            py: 2,
                            px: 2,
                            borderBottom: index < leaderboardData.length - 1 ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                            background: index === 0 
                              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)'
                              : index === 1
                              ? 'linear-gradient(135deg, rgba(192, 192, 192, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)'
                              : index === 2
                              ? 'linear-gradient(135deg, rgba(205, 127, 50, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)'
                              : 'transparent',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        >
                          <ListItemIcon sx={{ color: 'white', minWidth: '50px' }}>
                            <Stack sx={{ alignItems: 'center' }}>
                              {index === 0 && <span style={{ fontSize: '24px' }}>🥇</span>}
                              {index === 1 && <span style={{ fontSize: '24px' }}>🥈</span>}
                              {index === 2 && <span style={{ fontSize: '24px' }}>🥉</span>}
                              {index >= 3 && (
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  #{index + 1}
                                </Typography>
                              )}
                            </Stack>
                          </ListItemIcon>
                          <ListItemText
                            primary={`Student ${entry.studentId.slice(-4)}`}
                            secondary={
                              <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                <Chip
                                  label={`${entry.submittedCount} Submitted`}
                                  size="small"
                                  sx={{
                                    background: 'rgba(255, 255, 255, 0.3)',
                                    color: 'white',
                                  }}
                                />
                                {entry.submittedCount > 0 && (
                                  <Chip
                                    label={`Avg: ${(entry.totalGrade / entry.submittedCount).toFixed(1)}/100`}
                                    size="small"
                                    sx={{
                                      background: 'rgba(76, 175, 80, 0.3)',
                                      color: 'white',
                                    }}
                                  />
                                )}
                              </Stack>
                            }
                            primaryTypographyProps={{
                              sx: { color: 'white', fontWeight: 'bold' }
                            }}
                            secondaryTypographyProps={{
                              sx: { color: 'rgba(255, 255, 255, 0.7)' }
                            }}
                          />
                        </ListItem>
                      </motion.div>
                    ))}
                  </List>
                </Paper>
              ) : (
                <Paper
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px dashed rgba(255, 255, 255, 0.3)',
                    borderRadius: '15px',
                    color: 'rgba(255, 255, 255, 0.8)',
                  }}
                >
                  <Typography>No submissions yet! Be the first! 🎯</Typography>
                </Paper>
              )}
            </Box>
          </motion.div>

          {/* Success Message */}
          <motion.div variants={itemVariants}>
            <Paper
              sx={{
                p: 3,
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(132, 250, 176, 0.3) 0%, rgba(143, 211, 244, 0.3) 100%)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '15px',
                color: 'white',
              }}
            >
              <Box sx={{ fontSize: '50px', mb: 2 }}>
                🌟
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                Great Job!
              </Typography>
              <Typography variant="body2">
                Keep up the amazing work! 🎉
              </Typography>
            </Paper>
          </motion.div>
        </motion.div>
      </Container>

      {/* Upload Homework Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setUploadedFiles([]);
          setSubmissionText('');
          setSubmissionError('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: 'white', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
          📝 Submit: {selectedAssignment?.title}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={2}>
            {/* Text Submission */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                ✏️ Write Your Answer
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Enter your homework response here..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                  },
                  '& .MuiOutlinedInput-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    opacity: 1,
                  },
                }}
              />
            </Box>

            {/* File Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                📎 Upload Files
              </Typography>
              <Button
                variant="outlined"
                component="label"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    background: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Choose Files
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileSelect}
                />
              </Button>
            </Box>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'rgba(255, 255, 255, 0.9)' }}>
                  Selected Files ({uploadedFiles.length})
                </Typography>
                <Stack spacing={1}>
                  {uploadedFiles.map((file, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                      }}
                    >
                      <Typography variant="body2" sx={{ color: 'white', flex: 1 }}>
                        📄 {file.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mx: 1 }}>
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveFile(index)}
                        sx={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          '&:hover': {
                            color: 'white',
                            background: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Error Message */}
            {submissionError && (
              <MuiAlert severity="error" sx={{ background: 'rgba(244, 67, 54, 0.3)', color: 'white' }}>
                {submissionError}
              </MuiAlert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
          <Button
            onClick={() => {
              setUploadDialogOpen(false);
              setUploadedFiles([]);
              setSubmissionText('');
              setSubmissionError('');
            }}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmitAssignment}
            variant="contained"
            disabled={isUploading}
            sx={{
              background: 'white',
              color: '#667eea',
              fontWeight: 'bold',
              '&:disabled': {
                background: 'rgba(255, 255, 255, 0.5)',
              },
            }}
          >
            {isUploading ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={submissionSuccess}
        autoHideDuration={4000}
        onClose={() => setSubmissionSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setSubmissionSuccess(false)}
          severity="success"
          sx={{
            background: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          ✅ {successMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default NurseryUnifiedLearningPage;
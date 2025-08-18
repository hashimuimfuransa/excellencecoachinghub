import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Stack
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Schedule,
  Grade,
  Feedback,
  AutoAwesome,
  Psychology,
  TrendingUp,
  Assignment,
  Download,
  Visibility,
  School,
  Star,
  Warning,
  Info,
  ThumbUp,
  ThumbDown,
  Lightbulb,
  EmojiEvents,
  Cancel
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { assignmentService } from '../../services/assignmentService';

interface AssignmentData {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: Date;
  maxPoints: number;
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Submission {
  _id: string;
  submissionText?: string;
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  submittedAt: Date;
  isLate: boolean;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  aiGrade?: {
    score: number;
    feedback: string;
    confidence: number;
    gradedAt: Date;
    detailedGrading?: Array<{
      questionIndex: number;
      earnedPoints: number;
      maxPoints: number;
      feedback: string;
      isCorrect?: boolean;
    }>;
  };
  gradedAt?: Date;
  gradedBy?: string;
}

const AssignmentResults: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);

  useEffect(() => {
    const loadResults = async () => {
      if (!assignmentId) return;

      try {
        setLoading(true);
        
        // Load assignment details
        const assignmentData = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(assignmentData);
        
        // Load submission
        const submissionData = await assignmentService.getSubmissionByAssignment(assignmentId);
        setSubmission(submissionData);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load assignment results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [assignmentId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'primary';
      case 'graded':
        return 'success';
      case 'returned':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 80) return 'info';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Satisfactory';
    if (score >= 60) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <EmojiEvents color="success" />;
    if (score >= 80) return <Star color="info" />;
    if (score >= 70) return <ThumbUp color="warning" />;
    return <ThumbDown color="error" />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !assignment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Assignment not found'}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!submission) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          No submission found for this assignment.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate(`/assignment/${assignmentId}/work`)}
          sx={{ mt: 2 }}
        >
          Start Assignment
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Top Bar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar>
          <IconButton edge="start" onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Assignment Results
          </Typography>
          
          <Chip 
            label={submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
            color={getStatusColor(submission.status) as any}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Assignment Info */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Assignment color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {assignment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {assignment.course.title} • {assignment.instructor.firstName} {assignment.instructor.lastName}
                    </Typography>
                  </Box>
                </Box>
                
                <Typography variant="body1" paragraph>
                  {assignment.description}
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Submitted</Typography>
                    <Typography variant="body1">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Due Date</Typography>
                    <Typography variant="body1">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Max Points</Typography>
                    <Typography variant="body1">{assignment.maxPoints}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {submission.isLate && <Warning color="warning" fontSize="small" />}
                      <Typography variant="body1">
                        {submission.isLate ? 'Late Submission' : 'On Time'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Grades Overview */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Grade color="primary" />
                  Grading Results
                </Typography>
                
                <Grid container spacing={3}>
                  {/* AI Grade */}
                  {submission.aiGrade && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                          <AutoAwesome />
                          <Typography variant="h6">AI Grade</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {submission.aiGrade.score}%
                        </Typography>
                        <Typography variant="body2">
                          {getPerformanceLevel(submission.aiGrade.score)}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={submission.aiGrade.score} 
                          sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.3)' }}
                        />
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                          Confidence: {Math.round(submission.aiGrade.confidence * 100)}%
                        </Typography>
                      </Paper>
                    </Grid>
                  )}

                  {/* Instructor Grade */}
                  {submission.grade !== undefined && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                          <School />
                          <Typography variant="h6">Final Grade</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {Math.round((submission.grade / assignment.maxPoints) * 100)}%
                        </Typography>
                        <Typography variant="body2">
                          {submission.grade} / {assignment.maxPoints} points
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={(submission.grade / assignment.maxPoints) * 100} 
                          sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.3)' }}
                        />
                        {submission.gradedAt && (
                          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                            Graded on {new Date(submission.gradedAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  )}

                  {/* Pending Grade */}
                  {!submission.grade && submission.aiGrade && (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                          <Schedule />
                          <Typography variant="h6">Pending Review</Typography>
                        </Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          Your assignment is being reviewed by the instructor
                        </Typography>
                        <Typography variant="body2">
                          Preliminary AI score: {submission.aiGrade.score}%
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Performance Insights */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp color="primary" />
                  Performance
                </Typography>
                
                {submission.aiGrade && (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    {getPerformanceIcon(submission.aiGrade.score)}
                    <Typography variant="h6" sx={{ mt: 1 }}>
                      {getPerformanceLevel(submission.aiGrade.score)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Based on AI analysis
                    </Typography>
                  </Box>
                )}

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color={submission.submittedAt ? 'success' : 'disabled'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Submitted" 
                      secondary={submission.submittedAt ? 'Complete' : 'Not submitted'}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Schedule color={submission.isLate ? 'warning' : 'success'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Timeliness" 
                      secondary={submission.isLate ? 'Late submission' : 'On time'}
                    />
                  </ListItem>
                  
                  {submission.aiGrade && (
                    <ListItem>
                      <ListItemIcon>
                        <Psychology color="primary" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="AI Analysis" 
                        secondary={`${Math.round(submission.aiGrade.confidence * 100)}% confidence`}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Question Feedback */}
          {submission.aiGrade?.detailedGrading && submission.aiGrade.detailedGrading.length > 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Psychology color="primary" />
                    Question-by-Question Results
                  </Typography>
                  
                  <List>
                    {submission.aiGrade.detailedGrading.map((detail, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemIcon>
                            {detail.isCorrect ? (
                              <CheckCircle color="success" />
                            ) : detail.earnedPoints > 0 ? (
                              <Warning color="warning" />
                            ) : (
                              <Cancel color="error" />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="subtitle1">
                                  Question {detail.questionIndex + 1}
                                </Typography>
                                <Chip
                                  label={`${detail.earnedPoints}/${detail.maxPoints} pts`}
                                  size="small"
                                  color={detail.isCorrect ? 'success' : detail.earnedPoints > 0 ? 'warning' : 'error'}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {detail.feedback}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < submission.aiGrade.detailedGrading.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Feedback Section */}
          {(submission.aiGrade?.feedback || submission.feedback) && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Feedback color="primary" />
                    Overall Feedback
                  </Typography>
                  
                  {submission.aiGrade?.feedback && (
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <AutoAwesome color="primary" />
                        <Typography variant="subtitle1">AI Feedback</Typography>
                        <Chip label="Preliminary" size="small" color="info" />
                      </Box>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {submission.aiGrade.feedback}
                        </Typography>
                      </Paper>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Generated on {new Date(submission.aiGrade.gradedAt).toLocaleString()}
                      </Typography>
                    </Box>
                  )}
                  
                  {submission.feedback && (
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <School color="success" />
                        <Typography variant="subtitle1">Instructor Feedback</Typography>
                        <Chip label="Final" size="small" color="success" />
                      </Box>
                      <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {submission.feedback}
                        </Typography>
                      </Paper>
                      {submission.gradedAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Reviewed on {new Date(submission.gradedAt).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Submission Details */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Your Submission
                </Typography>
                
                {submission.submissionText && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Text Submission:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 300, overflow: 'auto' }}>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {submission.submissionText}
                      </Typography>
                    </Paper>
                  </Box>
                )}
                
                {submission.attachments.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      File Attachments:
                    </Typography>
                    <List>
                      {submission.attachments.map((attachment, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Assignment />
                          </ListItemIcon>
                          <ListItemText
                            primary={attachment.originalName}
                            secondary={`${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB - Uploaded ${new Date(attachment.uploadedAt).toLocaleString()}`}
                          />
                          <Button
                            startIcon={<Download />}
                            onClick={() => window.open(attachment.fileUrl, '_blank')}
                          >
                            Download
                          </Button>
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={() => navigate(-1)}
              >
                Go Back
              </Button>
              
              {submission.status === 'draft' && (
                <Button
                  variant="contained"
                  startIcon={<Assignment />}
                  onClick={() => navigate(`/assignment/${assignmentId}/work`)}
                >
                  Continue Working
                </Button>
              )}
              
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => navigate(`/course/${assignment.course._id}/assignments`)}
              >
                View All Assignments
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AssignmentResults;
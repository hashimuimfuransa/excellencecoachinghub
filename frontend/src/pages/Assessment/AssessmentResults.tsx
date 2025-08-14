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
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Cancel,
  Schedule,
  Grade,
  Feedback,
  AutoAwesome,
  Psychology,
  TrendingUp,
  Assignment,
  Visibility,
  School,
  Star,
  Warning,
  Info,
  ThumbUp,
  ThumbDown,
  Lightbulb,
  EmojiEvents,
  Security,
  Flag,
  ExpandMore,
  Download,
  Share
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { assessmentService } from '../../services/assessmentService';
import { proctoringService } from '../../services/proctoringService';

interface AssessmentData {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  timeLimit: number;
  passingScore: number;
  totalPoints: number;
  isProctored: boolean;
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

interface QuestionResult {
  questionId: string;
  question: string;
  type: string;
  points: number;
  studentAnswer: string;
  correctAnswer?: string;
  isCorrect: boolean;
  pointsEarned: number;
  aiGrade?: {
    score: number;
    feedback: string;
    confidence: number;
  };
  instructorGrade?: {
    score: number;
    feedback: string;
    gradedAt: Date;
  };
}

interface SubmissionResult {
  _id: string;
  submittedAt: Date;
  timeSpent: number;
  autoSubmitted: boolean;
  totalScore: number;
  percentage: number;
  passed: boolean;
  aiGrade: {
    totalScore: number;
    percentage: number;
    confidence: number;
    gradedAt: Date;
    breakdown: QuestionResult[];
  };
  instructorGrade?: {
    totalScore: number;
    percentage: number;
    feedback: string;
    gradedAt: Date;
  };
  proctoringReport?: {
    sessionId: string;
    totalViolations: number;
    riskScore: number;
    recommendation: 'accept' | 'review' | 'reject';
    violations: Array<{
      type: string;
      timestamp: Date;
      severity: string;
      description: string;
    }>;
  };
}

const AssessmentResults: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProctoringReport, setShowProctoringReport] = useState(false);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    const loadResults = async () => {
      if (!assessmentId) return;

      try {
        setLoading(true);
        
        // Load assessment details
        const assessmentData = await assessmentService.getAssessmentById(assessmentId);
        setAssessment(assessmentData);
        
        // Load submission results
        const resultData = await assessmentService.getAssessmentResult(assessmentId);
        setResult(resultData);
        
      } catch (err: any) {
        setError(err.message || 'Failed to load assessment results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [assessmentId]);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'success';
    if (percentage >= 80) return 'info';
    if (percentage >= 70) return 'warning';
    return 'error';
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Good';
    if (percentage >= 70) return 'Satisfactory';
    if (percentage >= 60) return 'Needs Improvement';
    return 'Unsatisfactory';
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 90) return <EmojiEvents color="success" />;
    if (percentage >= 80) return <Star color="info" />;
    if (percentage >= 70) return <ThumbUp color="warning" />;
    return <ThumbDown color="error" />;
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return '🔘';
      case 'true_false':
        return '✓/✗';
      case 'short_answer':
        return '📝';
      case 'essay':
        return '📄';
      case 'math':
        return '🔢';
      case 'code':
        return '💻';
      default:
        return '❓';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error || !assessment || !result) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Assessment results not found'}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Go Back
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
            Assessment Results
          </Typography>
          
          <Chip 
            label={result.passed ? 'Passed' : 'Failed'}
            color={result.passed ? 'success' : 'error'}
          />
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Grid container spacing={3}>
          {/* Assessment Info */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Assignment color="primary" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      {assessment.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {assessment.course.title} • {assessment.instructor.firstName} {assessment.instructor.lastName}
                    </Typography>
                  </Box>
                  {assessment.isProctored && (
                    <Chip 
                      icon={<Security />} 
                      label="Proctored" 
                      color="info" 
                      variant="outlined"
                    />
                  )}
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Submitted</Typography>
                    <Typography variant="body1">
                      {new Date(result.submittedAt).toLocaleDateString()}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Time Spent</Typography>
                    <Typography variant="body1">
                      {formatTime(result.timeSpent)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Total Points</Typography>
                    <Typography variant="body1">{assessment.totalPoints}</Typography>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Typography variant="body2" color="text.secondary">Passing Score</Typography>
                    <Typography variant="body1">{assessment.passingScore}%</Typography>
                  </Grid>
                </Grid>

                {result.autoSubmitted && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      This assessment was automatically submitted when time expired.
                    </Typography>
                  </Alert>
                )}
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
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                        <AutoAwesome />
                        <Typography variant="h6">AI Grade</Typography>
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {result.aiGrade.percentage}%
                      </Typography>
                      <Typography variant="body2">
                        {result.aiGrade.totalScore} / {assessment.totalPoints} points
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={result.aiGrade.percentage} 
                        sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.3)' }}
                      />
                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                        Confidence: {Math.round(result.aiGrade.confidence * 100)}%
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* Instructor Grade */}
                  {result.instructorGrade ? (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'success.light', color: 'success.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                          <School />
                          <Typography variant="h6">Final Grade</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {result.instructorGrade.percentage}%
                        </Typography>
                        <Typography variant="body2">
                          {result.instructorGrade.totalScore} / {assessment.totalPoints} points
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={result.instructorGrade.percentage} 
                          sx={{ mt: 2, bgcolor: 'rgba(255,255,255,0.3)' }}
                        />
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                          Reviewed on {new Date(result.instructorGrade.gradedAt).toLocaleDateString()}
                        </Typography>
                      </Paper>
                    </Grid>
                  ) : (
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                          <Schedule />
                          <Typography variant="h6">Pending Review</Typography>
                        </Box>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          Your assessment is being reviewed by the instructor
                        </Typography>
                        <Typography variant="body2">
                          Preliminary AI score: {result.aiGrade.percentage}%
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
                
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  {getPerformanceIcon(result.aiGrade.percentage)}
                  <Typography variant="h6" sx={{ mt: 1 }}>
                    {getPerformanceLevel(result.aiGrade.percentage)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on AI analysis
                  </Typography>
                </Box>

                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <CheckCircle color={result.passed ? 'success' : 'error'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Result" 
                      secondary={result.passed ? 'Passed' : 'Failed'}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Schedule color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Time Management" 
                      secondary={`${formatTime(result.timeSpent)} of ${assessment.timeLimit} minutes`}
                    />
                  </ListItem>
                  
                  <ListItem>
                    <ListItemIcon>
                      <Psychology color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="AI Confidence" 
                      secondary={`${Math.round(result.aiGrade.confidence * 100)}%`}
                    />
                  </ListItem>

                  {assessment.isProctored && result.proctoringReport && (
                    <ListItem>
                      <ListItemIcon>
                        <Security color={result.proctoringReport.riskScore > 0.5 ? 'warning' : 'success'} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Proctoring" 
                        secondary={`${result.proctoringReport.totalViolations} violations`}
                      />
                    </ListItem>
                  )}
                </List>

                {assessment.isProctored && result.proctoringReport && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Security />}
                    onClick={() => setShowProctoringReport(true)}
                    sx={{ mt: 2 }}
                  >
                    View Proctoring Report
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Question-by-Question Results */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Question-by-Question Results
                </Typography>
                
                {result.aiGrade.breakdown.map((question, index) => (
                  <Accordion 
                    key={question.questionId}
                    expanded={expandedQuestion === question.questionId}
                    onChange={() => setExpandedQuestion(
                      expandedQuestion === question.questionId ? null : question.questionId
                    )}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                        <Typography sx={{ fontSize: '1.2rem' }}>
                          {getQuestionIcon(question.type)}
                        </Typography>
                        
                        <Typography sx={{ flexGrow: 1 }}>
                          Question {index + 1}
                        </Typography>
                        
                        <Chip
                          label={`${question.pointsEarned}/${question.points}`}
                          color={question.isCorrect ? 'success' : 'error'}
                          size="small"
                        />
                        
                        {question.isCorrect ? (
                          <CheckCircle color="success" />
                        ) : (
                          <Cancel color="error" />
                        )}
                      </Box>
                    </AccordionSummary>
                    
                    <AccordionDetails>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Question:
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ mb: 2 }}
                          dangerouslySetInnerHTML={{ __html: question.question }}
                        />
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <Typography variant="subtitle2" gutterBottom>
                            Your Answer:
                          </Typography>
                          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2">
                              {question.studentAnswer || 'No answer provided'}
                            </Typography>
                          </Paper>
                        </Grid>
                        
                        {question.correctAnswer && (
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" gutterBottom>
                              Correct Answer:
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                              <Typography variant="body2">
                                {question.correctAnswer}
                              </Typography>
                            </Paper>
                          </Grid>
                        )}
                      </Grid>

                      {question.aiGrade?.feedback && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AutoAwesome color="primary" />
                            AI Feedback:
                          </Typography>
                          <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
                            <Typography variant="body2">
                              {question.aiGrade.feedback}
                            </Typography>
                          </Paper>
                        </Box>
                      )}

                      {question.instructorGrade?.feedback && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <School color="success" />
                            Instructor Feedback:
                          </Typography>
                          <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText' }}>
                            <Typography variant="body2">
                              {question.instructorGrade.feedback}
                            </Typography>
                          </Paper>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Overall Feedback */}
          {result.instructorGrade?.feedback && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Feedback color="primary" />
                    Instructor Feedback
                  </Typography>
                  
                  <Paper sx={{ p: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {result.instructorGrade.feedback}
                    </Typography>
                  </Paper>
                </CardContent>
              </Card>
            </Grid>
          )}

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
              
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => {
                  // Implement PDF download
                  console.log('Download results as PDF');
                }}
              >
                Download Results
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<Visibility />}
                onClick={() => navigate(`/course/${assessment.course._id}/assessments`)}
              >
                View All Assessments
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Proctoring Report Dialog */}
      {result.proctoringReport && (
        <Dialog 
          open={showProctoringReport} 
          onClose={() => setShowProctoringReport(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security />
              Proctoring Report
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{result.proctoringReport.totalViolations}</Typography>
                  <Typography variant="body2">Total Violations</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h6">{Math.round(result.proctoringReport.riskScore * 100)}%</Typography>
                  <Typography variant="body2">Risk Score</Typography>
                </Paper>
              </Grid>
              <Grid item xs={4}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Chip 
                    label={result.proctoringReport.recommendation}
                    color={
                      result.proctoringReport.recommendation === 'accept' ? 'success' :
                      result.proctoringReport.recommendation === 'review' ? 'warning' : 'error'
                    }
                  />
                </Paper>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>
              Violations Timeline
            </Typography>
            
            <List>
              {result.proctoringReport.violations.map((violation, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <Warning color={
                      violation.severity === 'critical' ? 'error' :
                      violation.severity === 'high' ? 'warning' : 'info'
                    } />
                  </ListItemIcon>
                  <ListItemText
                    primary={violation.description}
                    secondary={`${new Date(violation.timestamp).toLocaleTimeString()} - ${violation.severity} severity`}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowProctoringReport(false)}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default AssessmentResults;
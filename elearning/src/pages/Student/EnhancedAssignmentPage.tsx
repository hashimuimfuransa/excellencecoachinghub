import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Divider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBack,
  Assignment,
  CheckCircle,
  Schedule,
  Upload,
  Download,
  Visibility,
  Send,
  Warning,
  Info,
  AttachFile,
  SmartToy,
  Quiz,
  ExpandMore,
  Timer,
  Grade
} from '@mui/icons-material';
import { assignmentService } from '../../services/assignmentService';

interface ExtractedQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  explanation?: string;
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  status: string;
  aiExtractionStatus: 'pending' | 'completed' | 'failed' | 'not_started';
  extractedQuestions: ExtractedQuestion[];
  document?: {
    url: string;
    originalName: string;
  };
  submission?: {
    _id: string;
    submittedAt: string;
    grade?: number;
    feedback?: string;
    extractedAnswers?: any[];
  };
}

const EnhancedAssignmentPage: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Assignment modes
  const [viewMode, setViewMode] = useState<'overview' | 'extracted' | 'traditional'>('overview');
  
  // Extracted questions state
  const [answers, setAnswers] = useState<{ [questionId: string]: any }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Traditional submission state
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);

  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const response = await assignmentService.getAssignmentWithExtraction(assignmentId!);
      if (response.success) {
        setAssignment(response.data);
        
        // Check if we should show extracted questions
        if (response.data.aiExtractionStatus === 'completed' && response.data.extractedQuestions?.length > 0) {
          setViewMode('extracted');
        } else {
          setViewMode('traditional');
        }
      } else {
        setError('Failed to load assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const submitExtractedAnswers = async () => {
    if (!assignment) return;

    try {
      setSubmitting(true);
      const response = await assignmentService.submitExtractedAssignment(assignment._id, answers);
      if (response.success) {
        setSuccess('Assignment submitted successfully!');
        await loadAssignment(); // Reload to show submission
      } else {
        setError(response.error || 'Failed to submit assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const submitTraditionalAssignment = async () => {
    if (!assignment) return;

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('assignmentId', assignment._id);
      formData.append('submissionText', submissionText);
      if (submissionFile) {
        formData.append('submissionFile', submissionFile);
      }

      const response = await assignmentService.submitAssignmentEnhanced(formData);
      if (response.success) {
        setSuccess('Assignment submitted successfully!');
        await loadAssignment(); // Reload to show submission
      } else {
        setError(response.error || 'Failed to submit assignment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'submitted': return 'info';
      case 'overdue': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getExtractionStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { icon: <CircularProgress size={16} />, text: 'Processing...', color: 'info' };
      case 'completed':
        return { icon: <SmartToy />, text: 'AI Questions Ready', color: 'success' };
      case 'failed':
        return { icon: <Warning />, text: 'Processing Failed', color: 'error' };
      default:
        return { icon: <Assignment />, text: 'Traditional Mode', color: 'default' };
    }
  };

  const renderQuestion = (question: ExtractedQuestion, index: number) => {
    const answer = answers[question.id];

    return (
      <Card key={question.id} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" component="h3">
              Question {index + 1}
            </Typography>
            <Chip 
              label={`${question.points} pts`} 
              size="small" 
              color="primary" 
              variant="outlined" 
            />
          </Box>
          
          <Typography variant="body1" paragraph>
            {question.question}
          </Typography>

          {question.type === 'multiple_choice' && (
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={answer || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              >
                {question.options?.map((option, optionIndex) => (
                  <FormControlLabel
                    key={optionIndex}
                    value={option}
                    control={<Radio />}
                    label={option}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {question.type === 'true_false' && (
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={answer || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                row
              >
                <FormControlLabel value="true" control={<Radio />} label="True" />
                <FormControlLabel value="false" control={<Radio />} label="False" />
              </RadioGroup>
            </FormControl>
          )}

          {question.type === 'short_answer' && (
            <TextField
              fullWidth
              multiline
              rows={2}
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer..."
              variant="outlined"
            />
          )}

          {question.type === 'essay' && (
            <TextField
              fullWidth
              multiline
              rows={6}
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Write your essay response..."
              variant="outlined"
            />
          )}
        </CardContent>
      </Card>
    );
  };

  // Enhanced question organization with sections
  const renderOrganizedQuestions = () => {
    if (!assignment?.extractedQuestions?.length) return null;

    // Group questions by section
    const questionsBySection = assignment.extractedQuestions.reduce((acc, question, index) => {
      const section = (question as any).section || 'general';
      const sectionTitle = (question as any).sectionTitle || 'General Questions';
      
      if (!acc[section]) {
        acc[section] = {
          title: sectionTitle,
          questions: []
        };
      }
      
      acc[section].questions.push({ ...question, originalIndex: index });
      return acc;
    }, {} as Record<string, { title: string; questions: any[] }>);

    const sections = Object.keys(questionsBySection);
    
    // If only one section, render without section headers
    if (sections.length === 1 && sections[0] === 'general') {
      return assignment.extractedQuestions.map((question, index) => 
        renderQuestion(question, index)
      );
    }

    // Render with section organization
    return sections.map(sectionKey => {
      const section = questionsBySection[sectionKey];
      return (
        <Box key={sectionKey} sx={{ mb: 4 }}>
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              sx={{ 
                bgcolor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': { bgcolor: 'primary.main' }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  📚 {section.title}
                </Typography>
                <Chip 
                  label={`${section.questions.length} questions`}
                  size="small" 
                  sx={{ 
                    bgcolor: 'background.paper', 
                    color: 'text.primary',
                    mr: 2 
                  }}
                />
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0 }}>
              <Box sx={{ p: 2 }}>
                {section.questions.map((question, sectionIndex) => {
                  const globalIndex = question.originalIndex;
                  const difficulty = (question as any).difficulty || 'medium';
                  const topic = (question as any).topic || 'general';
                  
                  return (
                    <Card key={question.id} sx={{ mb: 3, position: 'relative' }}>
                      {/* Difficulty and topic indicators */}
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        display: 'flex', 
                        gap: 1 
                      }}>
                        <Chip 
                          label={difficulty} 
                          size="small" 
                          color={
                            difficulty === 'easy' ? 'success' : 
                            difficulty === 'hard' ? 'error' : 'warning'
                          }
                          variant="outlined"
                        />
                        {topic !== 'general' && (
                          <Chip 
                            label={topic} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                      
                      <CardContent sx={{ pt: 5 }}>
                        {renderQuestionContent(question, globalIndex, sectionIndex + 1)}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      );
    });
  };

  // Extract question content rendering logic
  const renderQuestionContent = (question: ExtractedQuestion, globalIndex: number, displayIndex: number) => {
    const answer = answers[question.id];

    return (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h3">
            Question {displayIndex}
          </Typography>
          <Chip 
            label={`${question.points} pts`} 
            size="small" 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        
        <Typography variant="body1" paragraph>
          {question.question}
        </Typography>

        {/* Question type specific rendering */}
        {question.type === 'multiple_choice' && (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            >
              {question.options?.map((option, optionIndex) => (
                <FormControlLabel
                  key={optionIndex}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
        )}

        {question.type === 'true_false' && (
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              value={answer || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              row
            >
              <FormControlLabel value="true" control={<Radio />} label="True" />
              <FormControlLabel value="false" control={<Radio />} label="False" />
            </RadioGroup>
          </FormControl>
        )}

        {question.type === 'numerical' && (
          <TextField
            fullWidth
            type="number"
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter numerical answer..."
            variant="outlined"
            helperText="Enter numbers only"
          />
        )}

        {question.type === 'short_answer' && (
          <TextField
            fullWidth
            multiline
            rows={2}
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer..."
            variant="outlined"
          />
        )}

        {question.type === 'essay' && (
          <TextField
            fullWidth
            multiline
            rows={6}
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Write your essay response..."
            variant="outlined"
          />
        )}
      </>
    );
  };

  const renderSubmissionResults = () => {
    if (!assignment?.submission) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Grade sx={{ mr: 1, verticalAlign: 'middle' }} />
            Submission Results
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                Submitted: {new Date(assignment.submission.submittedAt).toLocaleString()}
              </Typography>
            </Grid>
            {assignment.submission.grade !== undefined && (
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  Grade: {assignment.submission.grade}/{assignment.totalPoints} points
                </Typography>
              </Grid>
            )}
          </Grid>

          {assignment.submission.feedback && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Feedback:
              </Typography>
              <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2">
                  {assignment.submission.feedback}
                </Typography>
              </Paper>
            </Box>
          )}

          {assignment.submission.extractedAnswers && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Question-by-Question Results:
              </Typography>
              {assignment.extractedQuestions.map((question, index) => {
                const submittedAnswer = assignment.submission?.extractedAnswers?.[index];
                return (
                  <Accordion key={question.id}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>
                        Question {index + 1} - {submittedAnswer?.isCorrect ? '✅' : '❌'} 
                        ({submittedAnswer?.pointsEarned || 0}/{question.points} pts)
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        <strong>Question:</strong> {question.question}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        <strong>Your Answer:</strong> {submittedAnswer?.answer}
                      </Typography>
                      {question.correctAnswer && (
                        <Typography variant="body2" paragraph>
                          <strong>Correct Answer:</strong> {question.correctAnswer}
                        </Typography>
                      )}
                      {submittedAnswer?.feedback && (
                        <Typography variant="body2" paragraph>
                          <strong>Feedback:</strong> {submittedAnswer.feedback}
                        </Typography>
                      )}
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading assignment...
        </Typography>
      </Container>
    );
  }

  if (!assignment) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Assignment not found</Alert>
      </Container>
    );
  }

  const extractionStatus = getExtractionStatusInfo(assignment.aiExtractionStatus);
  const isSubmitted = !!assignment.submission;
  const canSubmit = !isSubmitted && new Date() < new Date(assignment.dueDate);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2 }}
        >
          Back to Course
        </Button>
        
        <Typography variant="h3" component="h1" gutterBottom>
          {assignment.title}
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Chip
              label={assignment.status}
              color={getStatusColor(assignment.status) as any}
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Chip
              icon={extractionStatus.icon}
              label={extractionStatus.text}
              color={extractionStatus.color as any}
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              Due: {new Date(assignment.dueDate).toLocaleString()}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant="body2" color="text.secondary">
              Total Points: {assignment.totalPoints}
            </Typography>
          </Grid>
        </Grid>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Assignment Description */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Assignment Description
          </Typography>
          <Typography variant="body1" paragraph>
            {assignment.description}
          </Typography>
          
          {assignment.document && (
            <Box sx={{ mt: 2 }}>
              <Button
                startIcon={<Download />}
                href={assignment.document.url}
                target="_blank"
                variant="outlined"
              >
                Download: {assignment.document.originalName}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Show submission results if already submitted */}
      {isSubmitted && renderSubmissionResults()}

      {/* AI Extraction Status */}
      {assignment.aiExtractionStatus === 'pending' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <SmartToy sx={{ mr: 1 }} />
              <Typography variant="h6">AI Processing</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Our AI is analyzing the assignment document to extract questions. This usually takes a few minutes.
            </Typography>
            <LinearProgress />
          </CardContent>
        </Card>
      )}

      {/* Extracted Questions Mode */}
      {viewMode === 'extracted' && assignment.extractedQuestions?.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                <Quiz sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI-Extracted Questions ({assignment.extractedQuestions.length})
              </Typography>
              {!isSubmitted && (
                <Typography variant="body2" color="text.secondary">
                  Answer all questions below
                </Typography>
              )}
            </Box>

            {renderOrganizedQuestions()}

            {!isSubmitted && canSubmit && (
              <Box sx={{ textAlign: 'center', mt: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={submitExtractedAnswers}
                  disabled={submitting || Object.keys(answers).length === 0}
                  startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                >
                  {submitting ? 'Submitting...' : 'Submit Assignment'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Traditional Submission Mode */}
      {viewMode === 'traditional' && !isSubmitted && canSubmit && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Assignment sx={{ mr: 1, verticalAlign: 'middle' }} />
              Submit Your Work
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={8}
              label="Your Response"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Type your assignment response here..."
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 3 }}>
              <input
                accept="*/*"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
              />
              <label htmlFor="file-upload">
                <Button variant="outlined" component="span" startIcon={<AttachFile />}>
                  Attach File
                </Button>
              </label>
              {submissionFile && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {submissionFile.name}
                </Typography>
              )}
            </Box>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={submitTraditionalAssignment}
                disabled={submitting || (!submissionText.trim() && !submissionFile)}
                startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
              >
                {submitting ? 'Submitting...' : 'Submit Assignment'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Assignment closed message */}
      {!canSubmit && !isSubmitted && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>Assignment Closed</Typography>
          <Typography>
            The due date for this assignment has passed. You can no longer submit your work.
          </Typography>
        </Alert>
      )}

      {/* Mode switcher for testing */}
      {assignment.extractedQuestions?.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              View Mode
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant={viewMode === 'overview' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('overview')}
                size="small"
              >
                Overview
              </Button>
              <Button
                variant={viewMode === 'extracted' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('extracted')}
                size="small"
              >
                AI Questions
              </Button>
              <Button
                variant={viewMode === 'traditional' ? 'contained' : 'outlined'}
                onClick={() => setViewMode('traditional')}
                size="small"
              >
                Traditional
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default EnhancedAssignmentPage;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  LinearProgress,
  Button,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  ArrowForward as NextIcon,
  ArrowBack as BackIcon,
  CheckCircle as CompleteIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

import careerGuidanceService, { IJobReadinessAssessment } from '../services/careerGuidanceService';

const CareerAssessmentFlow: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();

  // State
  const [assessment, setAssessment] = useState<IJobReadinessAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (assessmentId) {
      loadAssessment();
    }
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const data = await careerGuidanceService.getJobReadinessAssessment(assessmentId!);
      setAssessment(data);
      // Load existing answers if any
      if (data.answers) {
        setAnswers(data.answers);
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
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

  const handleNext = () => {
    if (assessment && currentQuestion < assessment.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessment) return;
    
    try {
      setSubmitting(true);
      await careerGuidanceService.submitJobReadinessAssessment(assessment.id, answers);
      navigate(`/app/career/assessment/${assessment.id}/results`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (!assessment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Assessment not found</Alert>
      </Container>
    );
  }

  const question = assessment.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessment.questions.length) * 100;
  const isLastQuestion = currentQuestion === assessment.questions.length - 1;
  const canProceed = answers[question.id] !== undefined;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 4, textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <AssessmentIcon sx={{ fontSize: 48, mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          {assessment.title}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9 }}>
          {assessment.description}
        </Typography>
      </Paper>

      {/* Progress */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Question {currentQuestion + 1} of {assessment.questions.length}
          </Typography>
          <Chip 
            label={`${Math.round(progress)}% Complete`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 8, borderRadius: 4 }}
        />
      </Paper>

      {/* Question */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Card sx={{ mb: 3, background: 'linear-gradient(45deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {question.question}
            </Typography>
            <Chip 
              label={question.category.replace('_', ' ').toUpperCase()} 
              size="small"
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
          </CardContent>
        </Card>

        {/* Answer Options */}
        <Box sx={{ mt: 3 }}>
          {question.type === 'multiple_choice' && question.options && (
            <FormControl component="fieldset" sx={{ width: '100%' }}>
              <RadioGroup
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              >
                {question.options.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    value={option}
                    control={<Radio />}
                    label={option}
                    sx={{
                      mb: 2,
                      p: 2,
                      border: '1px solid',
                      borderColor: answers[question.id] === option ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      bgcolor: answers[question.id] === option ? 'primary.light' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' }
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {question.type === 'likert_scale' && (
            <FormControl component="fieldset" sx={{ width: '100%', textAlign: 'center' }}>
              <FormLabel component="legend" sx={{ mb: 3 }}>
                Rate your agreement with the statement above:
              </FormLabel>
              <RadioGroup
                row
                value={answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
              >
                {[
                  { value: '1', label: 'Strongly Disagree' },
                  { value: '2', label: 'Disagree' },
                  { value: '3', label: 'Neutral' },
                  { value: '4', label: 'Agree' },
                  { value: '5', label: 'Strongly Agree' }
                ].map((option) => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio />}
                    label={option.label}
                    sx={{
                      mx: 0.5,
                      my: 1,
                      p: 2,
                      border: '1px solid',
                      borderColor: answers[question.id] === option.value ? 'primary.main' : 'divider',
                      borderRadius: 2,
                      bgcolor: answers[question.id] === option.value ? 'primary.light' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                      minWidth: 150
                    }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          )}

          {question.type === 'text' && (
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Your Answer"
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              sx={{ mt: 2 }}
            />
          )}
        </Box>
      </Paper>

      {/* Navigation */}
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            startIcon={<BackIcon />}
            variant="outlined"
          >
            Previous
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="text"
              onClick={() => navigate('/app/career-guidance')}
            >
              Save & Exit
            </Button>

            {isLastQuestion ? (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed || submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <CompleteIcon />}
                variant="contained"
                color="success"
                size="large"
              >
                {submitting ? 'Submitting...' : 'Complete Assessment'}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed}
                endIcon={<NextIcon />}
                variant="contained"
              >
                Next Question
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CareerAssessmentFlow;
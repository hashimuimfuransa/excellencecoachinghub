import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Paper,
  Divider
} from '@mui/material';
import {
  Quiz,
  ArrowBack,
  PlayArrow,
  Timer,
  Grade,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import QuizComponent from '../../components/Quiz/QuizComponent';
import { assessmentService } from '../../services/assessmentService';

interface QuizData {
  _id: string;
  title: string;
  description: string;
  questions: any[];
  timeLimit?: number;
  passingScore: number;
  attempts: number;
  showResultsImmediately: boolean;
  courseId: string;
  weekId?: string;
}

const StudentQuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  console.log('🔐 Auth status:', { user: user?.role });
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  useEffect(() => {
    console.log('🎯 QuizPage mounted with quizId:', quizId);
    if (quizId) {
      loadQuiz();
    } else {
      console.error('❌ No quizId provided');
      setError('No assessment ID provided');
    }
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading quiz for assessment ID:', quizId);
      
      // Start the assessment to get the quiz data
      const result = await assessmentService.startAssessment(quizId!);
      console.log('✅ Assessment started successfully:', result);
      
      const quizData: QuizData = {
        _id: result.assessment._id,
        title: result.assessment.title,
        description: result.assessment.description || '',
        questions: result.assessment.questions.map(q => ({
          _id: q.id,
          question: q.question,
          type: q.type,
          options: q.options || [],
          correctAnswer: '', // Not provided to student
          explanation: '', // Not provided to student
          points: q.points,
          difficulty: 'medium' as const
        })),
        timeLimit: result.assessment.timeLimit || 60,
        passingScore: 70,
        attempts: result.assessment.attempts || 3,
        showResultsImmediately: result.assessment.showResultsImmediately || true,
        courseId: typeof result.assessment.course === 'string' ? result.assessment.course : result.assessment.course._id,
        weekId: ''
      };
      
      setQuiz(quizData);
      setError(null);
    } catch (err: any) {
      console.error('Error loading quiz:', err);
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleQuizComplete = async (score: number, answers: Record<string, any>) => {
    try {
      // Submit the assessment to the backend
      await assessmentService.submitAssessment({
        assessmentId: quizId!,
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer: Array.isArray(answer) ? answer : [answer],
          timeSpent: 0 // Could track time per question
        })),
        totalTimeSpent: 0, // Could track total time
        isAutoSubmitted: false
      });
      
      setFinalScore(score);
      setQuizCompleted(true);
      setQuizStarted(false);
      
      console.log('Quiz completed and submitted:', { score, answers });
    } catch (error: any) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz results');
    }
  };

  const handleExitQuiz = () => {
    if (quizCompleted) {
      navigate(-1); // Go back to previous page
    } else {
      setQuizStarted(false);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizCompleted(false);
    setFinalScore(null);
    setQuizStarted(true);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
        <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
          Loading assessment: {quizId}
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!quiz) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Quiz not found
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (quizStarted) {
    return (
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <QuizComponent
          quiz={quiz}
          onComplete={handleQuizComplete}
          onExit={handleExitQuiz}
        />
      </Container>
    );
  }

  if (quizCompleted && finalScore !== null) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              {finalScore >= quiz.passingScore ? (
                <CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />
              ) : (
                <Grade sx={{ fontSize: 64, color: 'error.main' }} />
              )}
            </Box>
            
            <Typography variant="h4" gutterBottom>
              {finalScore >= quiz.passingScore ? 'Congratulations!' : 'Quiz Completed'}
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Your Score: {finalScore}%
            </Typography>
            
            <Typography variant="body1" paragraph>
              {finalScore >= quiz.passingScore 
                ? `You passed! You scored ${finalScore}% which is above the required ${quiz.passingScore}%.`
                : `You need ${quiz.passingScore}% to pass. You scored ${finalScore}%.`
              }
            </Typography>

            <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleRetakeQuiz}
                disabled={quiz.attempts <= 0}
              >
                Retake Quiz
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Back to Course
              </Button>
            </Stack>

            {quiz.attempts <= 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                You have reached the maximum number of attempts for this quiz.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Quiz Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Quiz sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h4" gutterBottom>
                {quiz.title}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {quiz.description}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quiz Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quiz Information
          </Typography>
          
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Number of Questions
              </Typography>
              <Chip label={`${quiz.questions.length} questions`} variant="outlined" />
            </Box>
            
            {quiz.timeLimit && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Time Limit
                </Typography>
                <Chip 
                  icon={<Timer />} 
                  label={`${quiz.timeLimit} minutes`} 
                  variant="outlined" 
                />
              </Box>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Passing Score
              </Typography>
              <Chip 
                icon={<Grade />} 
                label={`${quiz.passingScore}%`} 
                variant="outlined" 
              />
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Attempts Allowed
              </Typography>
              <Chip label={`${quiz.attempts} attempts`} variant="outlined" />
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Question Types Preview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Question Types
          </Typography>
          
          <Stack spacing={1}>
            {quiz.questions.map((question, index) => (
              <Box key={question._id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">
                  Question {index + 1}: {question.question.substring(0, 50)}...
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip label={question.type.replace('_', ' ')} size="small" variant="outlined" />
                  <Chip label={question.difficulty} size="small" color="secondary" variant="outlined" />
                  <Chip label={`${question.points} pts`} size="small" color="primary" variant="outlined" />
                </Box>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Instructions
          </Typography>
          
          <Typography variant="body2" component="div">
            <ul>
              <li>Read each question carefully before answering</li>
              <li>You can navigate between questions using Previous/Next buttons</li>
              <li>Make sure to answer all questions before submitting</li>
              <li>Once submitted, you cannot change your answers</li>
              {quiz.timeLimit && <li>Keep track of the time limit shown at the top</li>}
              <li>You have {quiz.attempts} attempt(s) to pass this quiz</li>
            </ul>
          </Typography>
        </CardContent>
      </Card>

      {/* Start Quiz Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => navigate(-1)}
          startIcon={<ArrowBack />}
        >
          Go Back
        </Button>
        <Button
          variant="contained"
          size="large"
          onClick={handleStartQuiz}
          startIcon={<PlayArrow />}
        >
          Start Quiz
        </Button>
      </Box>
    </Container>
  );
};

export default StudentQuizPage;

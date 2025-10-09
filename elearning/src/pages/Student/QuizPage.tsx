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
  
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      // Mock quiz data - in real implementation, fetch from API
      const mockQuiz: QuizData = {
        _id: quizId!,
        title: "JavaScript Fundamentals Quiz",
        description: "Test your knowledge of JavaScript basics including variables, functions, and control structures.",
        questions: [
          {
            _id: "q1",
            question: "What is the correct way to declare a variable in JavaScript?",
            type: "multiple_choice",
            options: ["var name = 'John'", "variable name = 'John'", "v name = 'John'", "declare name = 'John'"],
            correctAnswer: "var name = 'John'",
            explanation: "The 'var' keyword is used to declare variables in JavaScript.",
            points: 10,
            difficulty: "easy"
          },
          {
            _id: "q2",
            question: "Which of the following is NOT a JavaScript data type?",
            type: "multiple_choice",
            options: ["String", "Number", "Boolean", "Float"],
            correctAnswer: "Float",
            explanation: "JavaScript has Number type which includes both integers and floating-point numbers.",
            points: 10,
            difficulty: "easy"
          },
          {
            _id: "q3",
            question: "What will the following code output: console.log(typeof null);",
            type: "multiple_choice",
            options: ["null", "object", "undefined", "string"],
            correctAnswer: "object",
            explanation: "In JavaScript, typeof null returns 'object' due to a historical bug.",
            points: 15,
            difficulty: "medium"
          },
          {
            _id: "q4",
            question: "Which of the following are valid ways to create a function in JavaScript?",
            type: "multiple_select",
            options: ["function myFunc() {}", "const myFunc = function() {}", "const myFunc = () => {}", "function = myFunc() {}"],
            correctAnswer: ["function myFunc() {}", "const myFunc = function() {}", "const myFunc = () => {}"],
            explanation: "Functions can be declared using function declaration, function expression, or arrow function syntax.",
            points: 20,
            difficulty: "medium"
          },
          {
            _id: "q5",
            question: "What is the purpose of the 'use strict' directive?",
            type: "short_answer",
            correctAnswer: "enables strict mode",
            explanation: "The 'use strict' directive enables strict mode, which helps catch common coding mistakes.",
            points: 15,
            difficulty: "hard"
          }
        ],
        timeLimit: 30,
        passingScore: 70,
        attempts: 3,
        showResultsImmediately: true,
        courseId: "course123",
        weekId: "week456"
      };
      
      setQuiz(mockQuiz);
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleQuizComplete = (score: number, answers: Record<string, any>) => {
    setFinalScore(score);
    setQuizCompleted(true);
    setQuizStarted(false);
    
    // In real implementation, save quiz results to backend
    console.log('Quiz completed:', { score, answers });
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

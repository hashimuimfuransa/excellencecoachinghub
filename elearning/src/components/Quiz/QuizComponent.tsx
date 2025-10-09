import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Checkbox,
  FormGroup,
  TextField,
  LinearProgress,
  Alert,
  Chip,
  Stack,
  Paper,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Quiz,
  CheckCircle,
  Cancel,
  Timer,
  Grade,
  Refresh,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';

interface QuizQuestion {
  _id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'multiple_select' | 'short_answer';
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  timeLimit?: number; // in minutes
  passingScore: number;
  attempts: number;
  showResultsImmediately: boolean;
}

interface QuizProps {
  quiz: Quiz;
  onComplete: (score: number, answers: Record<string, any>) => void;
  onExit: () => void;
}

const QuizComponent: React.FC<QuizProps> = ({ quiz, onComplete, onExit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  // Timer effect
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateScore = () => {
    let totalPoints = 0;
    let earnedPoints = 0;

    quiz.questions.forEach(question => {
      totalPoints += question.points;
      const userAnswer = answers[question._id];
      
      if (userAnswer !== undefined && userAnswer !== null && userAnswer !== '') {
        if (question.type === 'multiple_select') {
          // For multiple select, check if all correct answers are selected
          const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
          const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
          
          const allCorrect = correctAnswers.every(correct => userAnswers.includes(correct));
          const noIncorrect = userAnswers.every(user => correctAnswers.includes(user));
          
          if (allCorrect && noIncorrect) {
            earnedPoints += question.points;
          }
        } else {
          // For single answer questions
          if (userAnswer === question.correctAnswer) {
            earnedPoints += question.points;
          }
        }
      }
    });

    return { earnedPoints, totalPoints };
  };

  const handleSubmit = () => {
    const { earnedPoints, totalPoints } = calculateScore();
    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    
    setScore(percentage);
    setIsSubmitted(true);
    setShowResults(true);
    
    onComplete(percentage, answers);
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const { _id, question, type, options, points, difficulty } = currentQuestion;
    const currentAnswer = answers[_id];

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={`${points} pts`} size="small" color="primary" variant="outlined" />
              <Chip label={difficulty} size="small" color="secondary" variant="outlined" />
            </Box>
          </Box>

          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
            {question}
          </Typography>

          <Box sx={{ mt: 3 }}>
            {type === 'multiple_choice' && (
              <FormControl component="fieldset">
                <RadioGroup
                  value={currentAnswer || ''}
                  onChange={(e) => handleAnswerChange(_id, e.target.value)}
                >
                  {options?.map((option, index) => (
                    <FormControlLabel
                      key={index}
                      value={option}
                      control={<Radio />}
                      label={option}
                      sx={{ mb: 1 }}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            )}

            {type === 'true_false' && (
              <FormControl component="fieldset">
                <RadioGroup
                  value={currentAnswer || ''}
                  onChange={(e) => handleAnswerChange(_id, e.target.value === 'true')}
                >
                  <FormControlLabel
                    value="true"
                    control={<Radio />}
                    label="True"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    value="false"
                    control={<Radio />}
                    label="False"
                    sx={{ mb: 1 }}
                  />
                </RadioGroup>
              </FormControl>
            )}

            {type === 'multiple_select' && (
              <FormGroup>
                {options?.map((option, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={Array.isArray(currentAnswer) ? currentAnswer.includes(option) : false}
                        onChange={(e) => {
                          const currentValues = Array.isArray(currentAnswer) ? currentAnswer : [];
                          if (e.target.checked) {
                            handleAnswerChange(_id, [...currentValues, option]);
                          } else {
                            handleAnswerChange(_id, currentValues.filter(v => v !== option));
                          }
                        }}
                      />
                    }
                    label={option}
                    sx={{ mb: 1 }}
                  />
                ))}
              </FormGroup>
            )}

            {type === 'short_answer' && (
              <TextField
                fullWidth
                multiline
                rows={3}
                value={currentAnswer || ''}
                onChange={(e) => handleAnswerChange(_id, e.target.value)}
                placeholder="Enter your answer here..."
                variant="outlined"
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => {
    const { earnedPoints, totalPoints } = calculateScore();
    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const passed = percentage >= quiz.passingScore;

    return (
      <Box>
        <Card sx={{ mb: 3, background: passed ? 'linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)' : 'linear-gradient(135deg, #f44336 0%, #c62828 100%)', color: 'white' }}>
          <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              {passed ? (
                <CheckCircle sx={{ fontSize: 64 }} />
              ) : (
                <Cancel sx={{ fontSize: 64 }} />
              )}
            </Box>
            
            <Typography variant="h4" gutterBottom>
              {passed ? 'Congratulations!' : 'Try Again'}
            </Typography>
            
            <Typography variant="h6" gutterBottom>
              Score: {earnedPoints}/{totalPoints} ({percentage}%)
            </Typography>
            
            <Typography variant="body1">
              {passed 
                ? `You passed! You scored ${percentage}% which is above the required ${quiz.passingScore}%.`
                : `You need ${quiz.passingScore}% to pass. You scored ${percentage}%.`
              }
            </Typography>
          </CardContent>
        </Card>

        {quiz.showResultsImmediately && (
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Question Review
                </Typography>
                <IconButton onClick={() => setShowAnswers(!showAnswers)}>
                  {showAnswers ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>

              {quiz.questions.map((question, index) => {
                const userAnswer = answers[question._id];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <Box key={question._id} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Question {index + 1}: {question.question}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <Chip 
                        label={`${question.points} pts`} 
                        size="small" 
                        color="primary" 
                        variant="outlined" 
                      />
                      <Chip 
                        label={isCorrect ? 'Correct' : 'Incorrect'} 
                        size="small" 
                        color={isCorrect ? 'success' : 'error'} 
                        variant="outlined" 
                      />
                    </Box>

                    {showAnswers && (
                      <Box sx={{ ml: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Your answer:</strong> {Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer || 'No answer'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <strong>Correct answer:</strong> {Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer}
                        </Typography>
                        {question.explanation && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            <strong>Explanation:</strong> {question.explanation}
                          </Typography>
                        )}
                      </Box>
                    )}
                    
                    <Divider sx={{ mt: 2 }} />
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  if (isSubmitted && showResults) {
    return (
      <Box>
        {renderResults()}
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
          <Button 
            variant="outlined" 
            startIcon={<Refresh />}
            onClick={() => {
              setCurrentQuestionIndex(0);
              setAnswers({});
              setIsSubmitted(false);
              setShowResults(false);
              setTimeRemaining(quiz.timeLimit ? quiz.timeLimit * 60 : null);
            }}
          >
            Retake Quiz
          </Button>
          <Button 
            variant="contained" 
            onClick={onExit}
          >
            Exit Quiz
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {/* Quiz Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {quiz.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {quiz.description}
              </Typography>
            </Box>
            
            {timeRemaining !== null && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" color={timeRemaining < 60 ? 'error.main' : 'text.primary'}>
                  {formatTime(timeRemaining)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Time Remaining
                </Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ flex: 1, mr: 2, height: 8, borderRadius: 4 }}
            />
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress)}% Complete
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Question */}
      {renderQuestion()}

      {/* Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button 
          variant="outlined" 
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            onClick={onExit}
          >
            Exit Quiz
          </Button>
          <Button 
            variant="contained" 
            onClick={handleNext}
            disabled={answers[currentQuestion._id] === undefined || answers[currentQuestion._id] === null || answers[currentQuestion._id] === ''}
          >
            {currentQuestionIndex === quiz.questions.length - 1 ? 'Submit Quiz' : 'Next'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default QuizComponent;

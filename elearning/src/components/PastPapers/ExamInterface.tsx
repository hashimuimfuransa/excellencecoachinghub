import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  ArrowBack,
  Timer,
  Quiz,
  CheckCircle,
  Flag,
  NavigateNext,
  NavigateBefore,
  Send
} from '@mui/icons-material';
import QuestionCard from './QuestionCard';
import ExamTimer from './ExamTimer';
import ExamProgress from './ExamProgress';

interface PastPaper {
  _id: string;
  title: string;
  subject: string;
  level: string;
  year: number;
  duration: number;
  timeLimit?: number;
  totalMarks: number;
  settings: {
    randomizeQuestions: boolean;
    randomizeOptions: boolean;
    showResultsImmediately: boolean;
    showCorrectAnswers: boolean;
    showExplanations: boolean;
    allowMultipleAttempts: boolean;
    provideFeedback: boolean;
    feedbackType: string;
  };
}

interface Question {
  id: string;
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: any;
  points: number;
  section?: string;
  difficulty?: string;
  explanation?: string;
  topic?: string;
}

interface ExamInterfaceProps {
  pastPaper: PastPaper;
  questions: Question[];
  attemptId: string | null;
  onComplete: (answers: Record<string, any>, questionResults: any[]) => void;
  onBack: () => void;
}

const ExamInterface: React.FC<ExamInterfaceProps> = ({
  pastPaper,
  questions,
  attemptId,
  onComplete,
  onBack
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeRemaining, setTimeRemaining] = useState((pastPaper.timeLimit || pastPaper.duration) * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmitExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const handleAnswerChange = useCallback((questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);

  const handleFlagQuestion = useCallback((questionIndex: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionIndex)) {
        newSet.delete(questionIndex);
      } else {
        newSet.add(questionIndex);
      }
      return newSet;
    });
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, totalQuestions]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleGoToQuestion = useCallback((index: number) => {
    setCurrentQuestionIndex(index);
  }, []);

  const handleSubmitExam = useCallback(async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Calculate question results
      const questionResults = questions.map(question => {
        const studentAnswer = answers[question.id];
        const isCorrect = studentAnswer === question.correctAnswer;
        const pointsEarned = isCorrect ? question.points : 0;

        return {
          questionId: question.id,
          studentAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          pointsEarned,
          pointsPossible: question.points,
          explanation: question.explanation,
          topic: question.topic,
          timeSpent: 0 // Could be calculated if needed
        };
      });

      await onComplete(answers, questionResults);
    } catch (error) {
      console.error('Error submitting exam:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [answers, questions, onComplete, isSubmitting]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
              {pastPaper.title}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {pastPaper.subject} • {pastPaper.level} • {pastPaper.year}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={onBack}
              sx={{ minWidth: 120 }}
            >
              Back
            </Button>
          </Box>
        </Box>

        {/* Progress and Timer */}
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <ExamProgress
            current={currentQuestionIndex + 1}
            total={totalQuestions}
            answered={answeredQuestions}
            flagged={flaggedQuestions.size}
          />
          
          <ExamTimer
            timeRemaining={timeRemaining}
            onTimeUp={handleSubmitExam}
          />
        </Box>
      </Paper>

      {/* Question Navigation */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
          {questions.map((_, index) => (
            <Tooltip key={index} title={`Question ${index + 1}`}>
              <Button
                variant={index === currentQuestionIndex ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleGoToQuestion(index)}
                sx={{
                  minWidth: 40,
                  height: 40,
                  position: 'relative'
                }}
              >
                {index + 1}
                {answers[questions[index].id] !== undefined && (
                  <CheckCircle
                    sx={{
                      position: 'absolute',
                      top: -5,
                      right: -5,
                      fontSize: 16,
                      color: 'success.main'
                    }}
                  />
                )}
                {flaggedQuestions.has(index) && (
                  <Flag
                    sx={{
                      position: 'absolute',
                      top: -5,
                      left: -5,
                      fontSize: 16,
                      color: 'warning.main'
                    }}
                  />
                )}
              </Button>
            </Tooltip>
          ))}
        </Box>
      </Paper>

      {/* Question Card */}
      <QuestionCard
        question={currentQuestion}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={totalQuestions}
        answer={answers[currentQuestion.id]}
        onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
        onFlag={() => handleFlagQuestion(currentQuestionIndex)}
        isFlagged={flaggedQuestions.has(currentQuestionIndex)}
        settings={pastPaper.settings}
      />

      {/* Navigation Controls */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<NavigateBefore />}
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Flag />}
              onClick={() => handleFlagQuestion(currentQuestionIndex)}
              color={flaggedQuestions.has(currentQuestionIndex) ? 'warning' : 'inherit'}
            >
              {flaggedQuestions.has(currentQuestionIndex) ? 'Unflag' : 'Flag'}
            </Button>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <Button
                variant="contained"
                endIcon={<NavigateNext />}
                onClick={handleNextQuestion}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="contained"
                color="success"
                startIcon={<Send />}
                onClick={() => setShowSubmitConfirm(true)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>

      {/* Submit Confirmation Dialog */}
      {showSubmitConfirm && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <Paper sx={{ p: 4, maxWidth: 400, width: '90%' }}>
            <Typography variant="h6" gutterBottom>
              Submit Exam?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              You have answered {answeredQuestions} out of {totalQuestions} questions.
              Are you sure you want to submit your exam?
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => setShowSubmitConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default ExamInterface;

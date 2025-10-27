import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import ExamInterface from '../../components/PastPapers/ExamInterface';
import ExamResults from '../../components/PastPapers/ExamResults';
import ExamLayout from '../../components/Layout/ExamLayout';

interface PastPaper {
  _id: string;
  title: string;
  description: string;
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

const TakePastPaperPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  const [pastPaper, setPastPaper] = useState<PastPaper | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [examCompleted, setExamCompleted] = useState(false);
  const [examResults, setExamResults] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadPastPaper();
    }
  }, [id]);

  const loadPastPaper = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get past paper questions
      const questionsResponse = await api.get(`/past-papers/${id}/questions`);
      
      if (questionsResponse.data.success) {
        setPastPaper(questionsResponse.data.data.pastPaper);
        setQuestions(questionsResponse.data.data.questions);
      }

      // Start attempt (with optional student info for anonymous users)
      const attemptData = isAuthenticated ? {} : {
        studentName: 'Anonymous Student',
        studentEmail: ''
      };
      
      const attemptResponse = await api.post(`/past-papers/${id}/start`, attemptData);
      
      if (attemptResponse.data.success) {
        setAttemptId(attemptResponse.data.data.attemptId);
      }
    } catch (err: any) {
      console.error('Error loading past paper:', err);
      setError(err.response?.data?.message || 'Failed to load past paper');
    } finally {
      setLoading(false);
    }
  };

  const handleExamComplete = async (answers: Record<string, any>, questionResults: any[]) => {
    try {
      if (!attemptId) return;

      const response = await api.post(`/past-papers/attempts/${attemptId}/submit`, {
        answers,
        questionResults
      });

      if (response.data.success) {
        setExamResults(response.data.data.attempt);
        setExamCompleted(true);
      }
    } catch (err: any) {
      console.error('Error submitting exam:', err);
      setError(err.response?.data?.message || 'Failed to submit exam');
    }
  };

  const handleRetakeExam = () => {
    setExamCompleted(false);
    setExamResults(null);
    setAttemptId(null);
    loadPastPaper();
  };

  const handleBackToPapers = () => {
    navigate('/past-papers');
  };

  if (loading) {
    return (
      <ExamLayout title="Loading Exam...">
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading exam...
          </Typography>
        </Container>
      </ExamLayout>
    );
  }

  if (error) {
    return (
      <ExamLayout title="Exam Error">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        </Container>
      </ExamLayout>
    );
  }

  if (!pastPaper || !questions.length) {
    return (
      <ExamLayout title="Exam Not Available">
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Alert severity="warning">
            Past paper not found or no questions available.
          </Alert>
        </Container>
      </ExamLayout>
    );
  }

  if (examCompleted && examResults) {
    return (
      <ExamLayout title={`${pastPaper.title} - Results`}>
        <ExamResults
          pastPaper={pastPaper}
          results={examResults}
          onRetake={handleRetakeExam}
          onBackToPapers={handleBackToPapers}
        />
      </ExamLayout>
    );
  }

  return (
    <ExamLayout title={pastPaper.title}>
      <ExamInterface
        pastPaper={pastPaper}
        questions={questions}
        attemptId={attemptId}
        onComplete={handleExamComplete}
      />
    </ExamLayout>
  );
};

export default TakePastPaperPage;

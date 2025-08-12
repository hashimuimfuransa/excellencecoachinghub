import React from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Container } from '@mui/material';

const QuizPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Quiz
      </Typography>
      <Typography variant="body1">
        Quiz page for quiz ID: {id}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Will be implemented in the AI Integration and AI Proctoring System tasks
      </Typography>
    </Container>
  );
};

export default QuizPage;

import React from 'react';
import {
  Container,
  Typography,
  Box,
  Breadcrumbs,
  Link
} from '@mui/material';
import { Home, VideoLibrary } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RecordedSessions from '../../components/Student/RecordedSessions';

const RecordedSessionsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          component="button"
          variant="body2"
          onClick={() => navigate('/dashboard/student')}
          sx={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'text.secondary',
            '&:hover': { color: 'primary.main' }
          }}
        >
          <Home sx={{ mr: 0.5, fontSize: 16 }} />
          Dashboard
        </Link>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.primary' }}>
          <VideoLibrary sx={{ mr: 0.5, fontSize: 16 }} />
          Recorded Sessions
        </Box>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Recorded Sessions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Watch recorded live sessions from your courses. Catch up on classes you missed or review important topics.
        </Typography>
      </Box>

      {/* Recorded Sessions Component */}
      <RecordedSessions showHeader={false} />
    </Container>
  );
};

export default RecordedSessionsPage;
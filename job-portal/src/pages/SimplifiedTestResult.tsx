import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Alert,
  Grid,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  TrendingUp,
  Psychology,
  Download,
  Home,
  Refresh
} from '@mui/icons-material';

interface TestResult {
  resultId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  hasDetailedResults: boolean;
  recommendations: string[];
}

const SimplifiedTestResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const result = location.state?.result as TestResult;
  const jobTitle = location.state?.jobTitle;
  const company = location.state?.company;

  if (!result) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">
          No test result data found. Please take a test first.
        </Alert>
        <Box mt={2}>
          <Button variant="contained" onClick={() => navigate('/psychometric-tests')}>
            Back to Tests
          </Button>
        </Box>
      </Container>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return 'Excellent Performance!';
    if (score >= 60) return 'Good Performance';
    return 'Needs Improvement';
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return 'Outstanding';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Very Good';
    if (score >= 60) return 'Good';
    if (score >= 50) return 'Average';
    return 'Below Average';
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white', textAlign: 'center' }}>
        <CheckCircle sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Assessment Complete!
        </Typography>
        <Typography variant="h6">
          {jobTitle} at {company}
        </Typography>
      </Paper>

      {/* Score Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom color="text.secondary">
            Your Score
          </Typography>
          
          <Box mb={3}>
            <Typography 
              variant="h1" 
              fontWeight="bold" 
              sx={{ fontSize: '4rem', color: `${getScoreColor(result.score)}.main` }}
            >
              {result.score}%
            </Typography>
            <Typography variant="h6" color={`${getScoreColor(result.score)}.main`} gutterBottom>
              {getScoreMessage(result.score)}
            </Typography>
            <Chip 
              label={getPerformanceLevel(result.score)}
              color={getScoreColor(result.score)}
              size="large"
              sx={{ fontSize: '1rem', px: 2, py: 1 }}
            />
          </Box>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid item xs={4} textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                {result.correctAnswers}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Correct Answers
              </Typography>
            </Grid>
            <Grid item xs={4} textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="text.primary">
                {result.totalQuestions}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Questions
              </Typography>
            </Grid>
            <Grid item xs={4} textAlign="center">
              <Typography variant="h4" fontWeight="bold" color="secondary.main">
                {Math.round((result.correctAnswers / result.totalQuestions) * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Accuracy Rate
              </Typography>
            </Grid>
          </Grid>

          <Box mt={3}>
            <LinearProgress
              variant="determinate"
              value={result.score}
              color={getScoreColor(result.score)}
              sx={{
                height: 12,
                borderRadius: 6,
                bgcolor: 'grey.200'
              }}
            />
            <Typography variant="body2" color="text.secondary" mt={1}>
              Overall Performance: {result.score}%
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {result.recommendations && result.recommendations.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" mb={2}>
              <TrendingUp sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold">
                Recommendations
              </Typography>
            </Box>
            
            <List>
              {result.recommendations.map((recommendation, index) => (
                <React.Fragment key={index}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemText
                      primary={recommendation}
                      primaryTypographyProps={{
                        variant: 'body1',
                        sx: { lineHeight: 1.6 }
                      }}
                    />
                  </ListItem>
                  {index < result.recommendations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results Notice */}
      {result.hasDetailedResults && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Alert severity="info">
              <Typography variant="body1" fontWeight="bold" gutterBottom>
                Detailed Report Available
              </Typography>
              <Typography variant="body2">
                Your assessment level includes detailed performance analytics and category-wise breakdown. 
                You can view the full report in your assessment history.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/psychometric-tests')}
            size="large"
          >
            Back to Tests
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => navigate('/psychometric-tests')}
            size="large"
          >
            Take Another Test
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          {result.hasDetailedResults && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<Download />}
              size="large"
              onClick={() => {
                // Navigate to detailed results or download report
                navigate(`/test-results/${result.resultId}`);
              }}
            >
              View Details
            </Button>
          )}
        </Grid>
      </Grid>

      {/* Next Steps */}
      <Card sx={{ mt: 4, bgcolor: 'grey.50' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Next Steps
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                📊 Review your performance in the assessment history
              </Typography>
              <Typography variant="body2" gutterBottom>
                🎯 Take assessments for other job positions
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" gutterBottom>
                💼 Apply to jobs that match your skill level
              </Typography>
              <Typography variant="body2" gutterBottom>
                📈 Use recommendations to improve your skills
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SimplifiedTestResult;
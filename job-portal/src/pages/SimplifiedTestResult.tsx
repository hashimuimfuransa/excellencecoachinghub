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
  Refresh,
  ArrowBack
} from '@mui/icons-material';

interface TestResult {
  resultId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers?: number;
  hasDetailedResults: boolean;
  recommendations: string[];
  detailedResults?: any[];
  correctQuestions?: any[];
  failedQuestions?: any[];
  grade?: string;
  percentile?: number;
  categoryScores?: Record<string, number>;
  interpretation?: string;
  timeSpent?: number;
}

const SimplifiedTestResult: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const result = location.state?.result as TestResult;
  const jobTitle = location.state?.jobTitle;
  const company = location.state?.company;

  // Log the result data for debugging
  console.log('📊 Test result data received:', result);

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
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
          variant="outlined"
          sx={{ mb: 2 }}
        >
          Back
        </Button>
      </Box>

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
              size="medium"
              sx={{ fontSize: '1rem', px: 2, py: 1 }}
            />
            {result.grade && (
              <Chip 
                label={`Grade: ${result.grade}`}
                color="primary"
                size="medium"
                sx={{ fontSize: '1rem', px: 2, py: 1, mt: 1 }}
              />
            )}
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

      {/* Quick Question Summary */}
      {(result.failedQuestions && result.failedQuestions.length > 0) && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom color="error.main">
              Questions You Missed ({result.failedQuestions.length})
            </Typography>
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {result.failedQuestions.slice(0, 5).map((question: any, index: number) => (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 'medium', mb: 1 }}>
                        Q{index + 1}: {question.question?.substring(0, 100)}...
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" color="error.main">
                          Your Answer: {question.yourAnswer || 'Not answered'}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="success.main">
                          Correct Answer: {question.correctAnswer}
                        </Typography>
                        {question.explanation && (
                          <>
                            <br />
                            <Typography variant="caption" color="text.secondary">
                              {question.explanation}
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                  {index < Math.min(result.failedQuestions.length - 1, 4) && <Divider />}
                </ListItem>
              ))}
            </List>
            {result.failedQuestions.length > 5 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                + {result.failedQuestions.length - 5} more questions. View detailed results for complete analysis.
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Summary */}
      {result.categoryScores && Object.keys(result.categoryScores).length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Performance by Category
            </Typography>
            {Object.entries(result.categoryScores).map(([category, score]) => (
              <Box key={category} sx={{ mb: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {category.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {score}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={score}
                  color={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'error'}
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {/* View Detailed Results Button */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<Psychology />}
          onClick={async () => {
            try {
              // Fetch detailed result from backend
              console.log('📊 Fetching detailed result for:', result.resultId);
              
              const response = await fetch(`/api/psychometric-tests/result/${result.resultId}`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                throw new Error('Failed to fetch detailed result');
              }
              
              const detailedResponse = await response.json();
              
              if (detailedResponse.success) {
                const detailedResult = detailedResponse.data;
                
                // Store the complete detailed result in session storage
                const detailedResultForStorage = {
                  ...result,
                  ...location.state,
                  ...detailedResult,
                  _id: result.resultId,
                  overallScore: result.score,
                  answersCount: result.correctAnswers,
                  totalQuestions: result.totalQuestions,
                  // Use backend provided counts
                  questionsCorrect: result.correctAnswers || 0,
                  questionsIncorrect: result.incorrectAnswers || 0,
                  timeSpent: result.timeSpent || 0,
                  createdAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                  // Include the detailed analysis from backend
                  detailedAnalysis: {
                    overallScore: result.score,
                    grade: detailedResult.grade || result.grade,
                    percentile: detailedResult.percentile || result.percentile,
                    categoryScores: result.categoryScores,
                    interpretation: result.interpretation,
                    strengths: detailedResult.correctQuestions?.map((q: any) => `Correct on: ${q.question?.substring(0, 50)}...`) || [],
                    developmentAreas: detailedResult.failedQuestions?.map((q: any) => `Needs improvement: ${q.question?.substring(0, 50)}...`) || [],
                    nextSteps: result.recommendations || [],
                    failedQuestions: detailedResult.failedQuestions || [],
                    correctQuestions: detailedResult.correctQuestions || []
                  },
                  questionByQuestionAnalysis: detailedResult.questionByQuestionAnalysis || [],
                  failedQuestions: detailedResult.failedQuestions || [],
                  correctQuestions: detailedResult.correctQuestions || []
                };
                
                sessionStorage.setItem('testResult', JSON.stringify(detailedResultForStorage));
                navigate('/app/test-results');
              } else {
                throw new Error(detailedResponse.error || 'Failed to get detailed results');
              }
            } catch (error) {
              console.error('❌ Error fetching detailed result:', error);
              alert('Failed to load detailed results. Please try again.');
            }
          }}
          sx={{
            backgroundColor: '#4caf50',
            '&:hover': { backgroundColor: '#45a049' },
            padding: '12px 32px',
            fontSize: '1.1rem',
            marginBottom: '1rem'
          }}
        >
          View Detailed Results & Question-by-Question Analysis
        </Button>
      </div>

      {/* Action Buttons */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Home />}
            onClick={() => navigate('/app/tests')}
            size="large"
          >
            Back to Tests
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => navigate('/app/tests')}
            size="large"
          >
            Take Another Test
          </Button>
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
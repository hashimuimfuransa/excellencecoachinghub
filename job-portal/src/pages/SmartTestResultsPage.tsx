import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  LinearProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme
} from '@mui/material';
import {
  TrendingUp,
  CheckCircle,
  Cancel,
  School,
  Work,
  Psychology,
  Timer,
  QuestionAnswer,
  Lightbulb,
  TrendingDown,
  ExpandMore,
  Assessment,
  Refresh,
  ArrowBack,
  Star,
  Grade
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { smartTestService } from '../services/smartTestService';
import SimpleProfileGuard from '../components/SimpleProfileGuard';

interface SmartTestResult {
  _id: string;
  testId: string;
  userId: string;
  jobId: string;
  score: number;
  percentageScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeSpent: number;
  isCompleted: boolean;
  detailedResults: Array<{
    questionId: string;
    question: string;
    userAnswer: any;
    correctAnswer: any;
    isCorrect: boolean;
    explanation: string;
    category: string;
  }>;
  feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  createdAt: string;
  completedAt?: string;
}

const SmartTestResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAuth();

  const [results, setResults] = useState<SmartTestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SmartTestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
    
    // Check if we have a specific result to show from navigation state
    const { resultId, justCompleted } = location.state || {};
    if (resultId && justCompleted) {
      // Fetch specific result and set as selected
      fetchSpecificResult(resultId);
    }
  }, [location.state]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const data = await smartTestService.getUserSmartTestResults();
      setResults(data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpecificResult = async (resultId: string) => {
    try {
      const result = await smartTestService.getSmartTestResult(resultId);
      setSelectedResult(result);
    } catch (error) {
      console.error('Error fetching specific result:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return theme.palette.success.main;
    if (percentage >= 70) return theme.palette.info.main;
    if (percentage >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 85) return 'Excellent';
    if (percentage >= 70) return 'Good';
    if (percentage >= 55) return 'Fair';
    return 'Needs Improvement';
  };

  const getCategoryPerformance = (result: SmartTestResult) => {
    const categories: Record<string, { correct: number; total: number }> = {};
    
    if (!result.detailedResults || result.detailedResults.length === 0) {
      return [];
    }
    
    result.detailedResults.forEach(item => {
      if (!categories[item.category]) {
        categories[item.category] = { correct: 0, total: 0 };
      }
      categories[item.category].total++;
      if (item.isCorrect) {
        categories[item.category].correct++;
      }
    });

    return Object.entries(categories).map(([category, stats]) => ({
      category,
      percentage: Math.round((stats.correct / stats.total) * 100),
      correct: stats.correct,
      total: stats.total
    }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (selectedResult) {
    const categoryPerformance = getCategoryPerformance(selectedResult);
    
    return (
      <SimpleProfileGuard feature="smartTests">
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
              Smart Test Results
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Detailed analysis of your performance
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => setSelectedResult(null)}
          >
            Back to Results
          </Button>
        </Box>

        {/* Overall Performance */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h3" color={getScoreColor(selectedResult.percentageScore)} gutterBottom>
                  {selectedResult.percentageScore}%
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Overall Score
                </Typography>
                <Chip 
                  label={getPerformanceLevel(selectedResult.percentageScore)}
                  color={selectedResult.percentageScore >= 70 ? 'success' : selectedResult.percentageScore >= 60 ? 'warning' : 'error'}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ fontSize: 32, color: theme.palette.success.main, mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                  {selectedResult.correctAnswers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Correct Answers
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Cancel sx={{ fontSize: 32, color: theme.palette.error.main, mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                  {selectedResult.incorrectAnswers}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Incorrect Answers
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Timer sx={{ fontSize: 32, color: theme.palette.info.main, mb: 1 }} />
                <Typography variant="h4" gutterBottom>
                  {formatTime(selectedResult.timeSpent)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Time Spent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Category Performance */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Performance by Category
            </Typography>
            <Grid container spacing={2}>
              {categoryPerformance.map((cat) => (
                <Grid item xs={12} sm={6} md={4} key={cat.category}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {cat.category.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                    <Box display="flex" alignItems="center" mb={1}>
                      <LinearProgress
                        variant="determinate"
                        value={cat.percentage}
                        sx={{ flexGrow: 1, mr: 2, height: 8, borderRadius: 4 }}
                        color={cat.percentage >= 70 ? 'success' : cat.percentage >= 60 ? 'warning' : 'error'}
                      />
                      <Typography variant="body2" fontWeight="bold">
                        {cat.percentage}%
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {cat.correct} / {cat.total} correct
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Overall Feedback
                </Typography>
                <Typography variant="body1" paragraph>
                  {selectedResult.feedback.overall}
                </Typography>
                
                {selectedResult.feedback.strengths && selectedResult.feedback.strengths.length > 0 && (
                  <>
                    <Typography variant="subtitle1" color="success.main" gutterBottom sx={{ mt: 3 }}>
                      Strengths
                    </Typography>
                    <List dense>
                      {selectedResult.feedback.strengths.map((strength, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Star sx={{ color: theme.palette.success.main }} />
                          </ListItemIcon>
                          <ListItemText primary={strength} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}

                {selectedResult.feedback.improvements && selectedResult.feedback.improvements.length > 0 && (
                  <>
                    <Typography variant="subtitle1" color="warning.main" gutterBottom sx={{ mt: 2 }}>
                      Areas for Improvement
                    </Typography>
                    <List dense>
                      {selectedResult.feedback.improvements.map((improvement, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <TrendingUp sx={{ color: theme.palette.warning.main }} />
                          </ListItemIcon>
                          <ListItemText primary={improvement} />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recommendations
                </Typography>
                {selectedResult.feedback.recommendations && selectedResult.feedback.recommendations.length > 0 ? (
                  <List dense>
                    {selectedResult.feedback.recommendations.map((rec, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <Lightbulb sx={{ color: theme.palette.info.main }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={rec}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No specific recommendations available.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Question-by-Question Analysis */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Question-by-Question Analysis
            </Typography>
            {selectedResult.detailedResults && selectedResult.detailedResults.length > 0 ? selectedResult.detailedResults.map((item, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Box display="flex" alignItems="center" mr={2}>
                      {item.isCorrect ? (
                        <CheckCircle sx={{ color: theme.palette.success.main, mr: 1 }} />
                      ) : (
                        <Cancel sx={{ color: theme.palette.error.main, mr: 1 }} />
                      )}
                      <Typography variant="body2">
                        Question {index + 1}
                      </Typography>
                    </Box>
                    <Chip 
                      label={item.category}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                      {item.question.substring(0, 80)}...
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="body1" paragraph>
                      <strong>Question:</strong> {item.question}
                    </Typography>
                    
                    <Typography variant="body2" paragraph>
                      <strong>Your Answer:</strong> {item.userAnswer}
                    </Typography>
                    
                    <Typography variant="body2" paragraph>
                      <strong>Correct Answer:</strong> {item.correctAnswer}
                    </Typography>
                    
                    {item.explanation && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          <strong>Explanation:</strong> {item.explanation}
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </AccordionDetails>
              </Accordion>
            )) : (
              <Typography variant="body2" color="text.secondary">
                No detailed results available for this test.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Container>
      </SimpleProfileGuard>
    );
  }

  return (
    <SimpleProfileGuard feature="smartTests">
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Smart Test Results
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Your job preparation test performance history
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={fetchResults}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Results List */}
      {results.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Assessment sx={{ fontSize: 64, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Smart Test Results Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Take a smart test to see your results here
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => navigate('/smart-tests')}
            >
              Take a Smart Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {results.map((result) => (
            <Grid item xs={12} md={6} lg={4} key={result._id}>
              <Card sx={{ height: '100%', cursor: 'pointer' }} onClick={() => setSelectedResult(result)}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" component="div" noWrap>
                      Smart Test #{result._id.slice(-6)}
                    </Typography>
                    <Chip 
                      label={`${result.percentageScore}%`}
                      color={result.percentageScore >= 70 ? 'success' : result.percentageScore >= 60 ? 'warning' : 'error'}
                    />
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box mb={2}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Performance: {getPerformanceLevel(result.percentageScore)}
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={result.percentageScore}
                      color={result.percentageScore >= 70 ? 'success' : result.percentageScore >= 60 ? 'warning' : 'error'}
                      sx={{ height: 8, borderRadius: 4, mb: 2 }}
                    />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          ✓ {result.correctAnswers} correct
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2">
                          ✗ {result.incorrectAnswers} incorrect
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Completed: {new Date(result.completedAt || result.createdAt).toLocaleDateString()}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    Time: {formatTime(result.timeSpent)}
                  </Typography>

                  <Box mt={2}>
                    <Button variant="outlined" size="small" fullWidth>
                      View Details
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
    </SimpleProfileGuard>
  );
};

export default SmartTestResultsPage;
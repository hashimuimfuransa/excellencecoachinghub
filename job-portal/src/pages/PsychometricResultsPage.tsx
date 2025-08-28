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
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle,
  School,
  Work,
  Psychology,
  Assessment,
  Timeline,
  EmojiEvents,
  Insights,
  Star,
  Lightbulb,
  GpsFixed,
  BarChart,
  PieChart,
  ShowChart,
  CalendarToday,
  Timer,
  Grade,
  Build,
  Speed,
  Route,
  BusinessCenter,
  QuestionAnswer,
  ThumbUp,
  ThumbDown,
  Warning,
  Info,
  KeyboardArrowUp,
  KeyboardArrowDown,
  Analytics,
  MyLocation,
  Refresh
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { psychometricTestService } from '../services/psychometricTestService';
import { useAuth } from '../contexts/AuthContext';

interface QuestionAnalysis {
  questionId: string;
  question: string;
  userAnswer: any;
  correctAnswer: any;
  isCorrect: boolean;
  questionType: string;
  category?: string;
  options?: string[];
  explanation?: string;
}

interface TestResult {
  _id: string;
  test?: {
    _id: string;
    title: string;
    type: string;
    industry?: string;
    jobRole?: string;
    jobSpecific?: boolean;
    categories?: string[];
    targetSkills?: string[];
  };
  testMetadata?: {
    testId: string;
    title: string;
    description: string;
    type: string;
    jobSpecific?: boolean;
    industry?: string;
    jobRole?: string;
  };
  user: {
    _id: string;
    name: string;
  };
  job?: {
    _id: string;
    title: string;
    company: string;
  };
  overallScore: number;
  categoryScores?: Record<string, number>;
  traitScores?: Record<string, number>;
  feedback?: {
    overall: string;
    strengths: string[];
    improvements: string[];
    recommendations: string[];
  };
  percentile?: number;
  grade?: string;
  timeSpent: number;
  answersCount: number;
  totalQuestions: number;
  createdAt: string;
  completedAt: string;
  detailedAnalysis?: Record<string, any>;
  answers?: Record<string, any>;
  scores?: Record<string, number>;
  attempt?: number;
  // New question analysis fields
  questionAnalysis?: QuestionAnalysis[];
  questionsCorrect?: number;
  questionsIncorrect?: number;
  // Psychometric test specific fields
  failedQuestions?: Array<{
    question: string;
    yourAnswer: string;
    correctAnswer: string;
    correctAnswerIndex: number;
    explanation: string;
    category: string;
  }>;
  correctQuestions?: Array<{
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    category: string;
    isCorrect: boolean;
  }>;
  detailedResults?: Array<{
    question: string;
    userAnswer: any;
    correctAnswer: number;
    isCorrect: boolean;
    explanation: string;
    category: string;
  }>;
  recommendations?: string[];
  interpretation?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PsychometricResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      // Check for recent test result from session storage first
      const recentTestResult = sessionStorage.getItem('testResult');
      if (recentTestResult) {
        try {
        const parsedResult = JSON.parse(recentTestResult);
        console.log('Found recent test result in session storage:', parsedResult);
        
        // Transform the session storage result to match our interface
        const transformedResult: TestResult = {
          _id: parsedResult._id || `temp-${Date.now()}`,
          test: parsedResult.test,
          testMetadata: parsedResult.testMetadata,
          user: parsedResult.user || { _id: 'current-user', name: 'You' },
          job: parsedResult.job,
          answers: parsedResult.answers || {},
          scores: parsedResult.scores || parsedResult.detailedAnalysis?.scores || {},
          // Clean categoryScores and traitScores to prevent NaN values
          categoryScores: Object.fromEntries(
            Object.entries(parsedResult.categoryScores || parsedResult.detailedAnalysis?.categoryScores || {})
              .map(([key, value]) => [key, typeof value === 'number' && !isNaN(value) ? Math.round(value) : 0])
          ),
          traitScores: Object.fromEntries(
            Object.entries(parsedResult.traitScores || parsedResult.detailedAnalysis?.traitScores || {})
              .map(([key, value]) => [key, typeof value === 'number' && !isNaN(value) ? Math.round(value) : 0])
          ),
          // Prioritize backend scores with safety checks
          overallScore: typeof (parsedResult.overallScore || parsedResult.detailedAnalysis?.overallScore) === 'number' && 
                       !isNaN(parsedResult.overallScore || parsedResult.detailedAnalysis?.overallScore) ? 
                       (parsedResult.overallScore || parsedResult.detailedAnalysis?.overallScore) : 0,
          interpretation: parsedResult.interpretation || '',
          recommendations: parsedResult.recommendations || [],
          // Prioritize backend percentile and grade
          percentile: parsedResult.percentile || parsedResult.detailedAnalysis?.percentile || 0,
          grade: parsedResult.grade || parsedResult.detailedAnalysis?.grade || 'N/A',
          timeSpent: parsedResult.timeSpent || 0,
          answersCount: Object.keys(parsedResult.answers || {}).length,
          totalQuestions: parsedResult.test?.questions?.length || parsedResult.testMetadata?.questions?.length || 0,
          // Calculate question analysis from the answers and test data
          questionsCorrect: parsedResult.questionsCorrect || parsedResult.correctQuestions?.length || 0,
          questionsIncorrect: parsedResult.questionsIncorrect || parsedResult.failedQuestions?.length || 0,
          // Include question analysis arrays
          correctQuestions: parsedResult.correctQuestions || [],
          failedQuestions: parsedResult.failedQuestions || [],
          createdAt: parsedResult.createdAt || new Date().toISOString(),
          completedAt: parsedResult.createdAt || new Date().toISOString(),
          // Include all detailed analysis from backend
          detailedAnalysis: parsedResult.detailedAnalysis || {},
          // Ensure feedback structure exists
          feedback: parsedResult.feedback || {
            overall: parsedResult.detailedAnalysis?.interpretation || '',
            strengths: parsedResult.detailedAnalysis?.strengths || [],
            improvements: parsedResult.detailedAnalysis?.developmentAreas || [],
            recommendations: parsedResult.detailedAnalysis?.nextSteps || []
          }
        };
        
        // Set this as the selected result for immediate viewing
        await setSelectedResultWithDetails(transformedResult);
        
        // Clear the session storage after reading
        sessionStorage.removeItem('testResult');
        
        // Force refresh to get latest data including the new result
        await fetchTestResults(true);
        } catch (error) {
          console.error('Error parsing test result from session storage:', error);
          await fetchTestResults(true);
        }
      } else {
        // No session storage result, just fetch normally
        await fetchTestResults(false);
      }
    };
    
    initializeData();
  }, []);

  const fetchTestResults = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      if (forceRefresh) {
        // Clear any cached data
        setTestResults([]);
        setSelectedResult(null);
      }
      
      const results = await psychometricTestService.getUserTestResults();
      console.log('Fetched test results:', results.length, 'results');
      
      // Transform backend results to ensure all fields are properly calculated
      const transformedResults = results.map((result: any) => ({
        ...result,
        // Ensure question counts are calculated from available data
        questionsCorrect: (result as any).questionsCorrect || 
                         (result.detailedAnalysis?.correctQuestions?.length) || 0,
        questionsIncorrect: (result as any).questionsIncorrect || 
                           (result.detailedAnalysis?.failedQuestions?.length) || 0,
        // Calculate total questions from available sources
        totalQuestions: (result as any).totalQuestions || 
                       (result.detailedAnalysis?.totalQuestions) || 
                       Object.keys(result.answers || {}).length || 0,
        // Ensure overallScore is valid
        overallScore: typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? 
                     result.overallScore : 0,
        // Ensure attempt field exists
        attempt: (result as any).attempt || 1
      }));
      
      // Sort results by creation date and attempt number
      const sortedResults = transformedResults.sort((a, b) => {
        const dateComparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (dateComparison === 0) {
          return (b.attempt || 1) - (a.attempt || 1);
        }
        return dateComparison;
      });
      
      setTestResults(sortedResults);
      
      // If we have a recent result from session storage and no selected result, show the most recent
      if (!selectedResult && sortedResults.length > 0) {
        const mostRecent = sortedResults[0];
        console.log('Setting most recent result as selected:', mostRecent);
        await setSelectedResultWithDetails(mostRecent);
      }
      
    } catch (error) {
      console.error('Error fetching test results:', error);
      setError('Failed to load test results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch detailed result data
  const fetchDetailedResult = async (resultId: string): Promise<any> => {
    try {
      console.log('📊 Fetching detailed result for:', resultId);
      
      const response = await fetch(`/api/simple-psychometric/result/${resultId}`, {
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
        return detailedResponse.data;
      } else {
        throw new Error(detailedResponse.error || 'Failed to get detailed results');
      }
    } catch (error) {
      console.error('❌ Error fetching detailed result:', error);
      return null;
    }
  };

  // Enhanced function to set selected result with detailed data
  const setSelectedResultWithDetails = async (result: TestResult) => {
    try {
      // First set the basic result
      setSelectedResult(result);
      
      // Then fetch and merge detailed data if available
      const detailedData = await fetchDetailedResult(result._id);
      
      if (detailedData) {
        const enhancedResult = {
          ...result,
          ...detailedData,
          // Ensure question counts are properly set
          questionsCorrect: detailedData.correctQuestions?.length || result.questionsCorrect || 0,
          questionsIncorrect: detailedData.failedQuestions?.length || result.questionsIncorrect || 0,
          totalQuestions: detailedData.questionByQuestionAnalysis?.length || result.totalQuestions || 0,
          // Include all detailed data
          correctQuestions: detailedData.correctQuestions || [],
          failedQuestions: detailedData.failedQuestions || [],
          questionByQuestionAnalysis: detailedData.questionByQuestionAnalysis || [],
          detailedAnalysis: {
            ...result.detailedAnalysis,
            correctQuestions: detailedData.correctQuestions || [],
            failedQuestions: detailedData.failedQuestions || []
          }
        };
        
        console.log('✅ Enhanced result with detailed data:', {
          correctQuestions: enhancedResult.correctQuestions?.length,
          failedQuestions: enhancedResult.failedQuestions?.length,
          totalQuestions: enhancedResult.totalQuestions
        });
        
        setSelectedResult(enhancedResult);
      }
    } catch (error) {
      console.error('❌ Error setting result with details:', error);
      // Fall back to basic result
      setSelectedResult(result);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getGradeColor = (grade?: string) => {
    switch(grade) {
      case 'A+': case 'A': return theme.palette.success.main;
      case 'B+': case 'B': return theme.palette.info.main;
      case 'C+': case 'C': return theme.palette.warning.main;
      case 'D': return theme.palette.error.light;
      case 'F': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const getScoreColor = (score: number) => {
    if (typeof score !== 'number' || isNaN(score)) return theme.palette.grey[500];
    if (score >= 80) return theme.palette.success.main;
    if (score >= 70) return theme.palette.info.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const calculateAverageScore = () => {
    if (testResults.length === 0) return 0;
    const validScores = testResults.filter(result => 
      typeof result.overallScore === 'number' && !isNaN(result.overallScore)
    );
    if (validScores.length === 0) return 0;
    return Math.round(validScores.reduce((sum, result) => sum + result.overallScore, 0) / validScores.length);
  };

  const getTestsByType = () => {
    const typeCount: Record<string, number> = {};
    testResults.forEach(result => {
      // Handle both regular tests and generated tests
      const type = result.test?.type || result.testMetadata?.type || 'generated';
      typeCount[type] = (typeCount[type] || 0) + 1;
    });
    return typeCount;
  };

  const getRecentResults = () => {
    return testResults
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  };

  const getBestScores = () => {
    const bestScores: Record<string, TestResult> = {};
    testResults.forEach(result => {
      // Handle both regular tests and generated tests
      const testId = result.test?._id || result.testMetadata?.testId || 'generated';
      const currentScore = typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? result.overallScore : 0;
      const bestScore = bestScores[testId] && typeof bestScores[testId].overallScore === 'number' && !isNaN(bestScores[testId].overallScore) ? bestScores[testId].overallScore : -1;
      
      if (!bestScores[testId] || currentScore > bestScore) {
        bestScores[testId] = result;
      }
    });
    return Object.values(bestScores);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getGroupedResults = () => {
    const grouped: Record<string, TestResult[]> = {};
    testResults.forEach(result => {
      const testKey = `${result.test?._id || result.testMetadata?.testId || 'generated'}-${result.job?._id || 'general'}`;
      if (!grouped[testKey]) {
        grouped[testKey] = [];
      }
      grouped[testKey].push(result);
    });
    
    // Sort each group by attempt number (descending to show latest first)
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => (b.attempt || 1) - (a.attempt || 1));
    });
    
    return grouped;
  };

  const getAttemptsForJob = (jobId?: string) => {
    if (!jobId) return testResults.filter(r => !r.job);
    return testResults.filter(r => r.job?._id === jobId);
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

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => fetchTestResults(true)}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Psychometric Test Results & Progress
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Track your psychometric assessment performance and progress over time
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => fetchTestResults(true)}
          disabled={loading}
          sx={{ minWidth: 140 }}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {testResults.length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tests Completed
                  </Typography>
                </Box>
                <Assessment sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {calculateAverageScore()}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Average Score
                  </Typography>
                </Box>
                <BarChart sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {getBestScores().length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Unique Tests
                  </Typography>
                </Box>
                <EmojiEvents sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
            color: 'white'
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {testResults.filter(r => r.test?.jobSpecific || r.testMetadata?.jobSpecific).length}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Job-Specific
                  </Typography>
                </Box>
                <GpsFixed sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<Timeline />} label="Overview" />
          <Tab icon={<QuestionAnswer />} label="Question Analysis" />
          <Tab icon={<Table />} label="All Results" />
          <Tab icon={<ShowChart />} label="Progress Analysis" />
          <Tab icon={<Insights />} label="Detailed Feedback" />
        </Tabs>
      </Box>

      {/* Recent Test Result Highlight */}
      {selectedResult && (
        <Card sx={{ mb: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`, color: 'white' }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Typography variant="h2" fontWeight="bold" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                    {typeof selectedResult.overallScore === 'number' && !isNaN(selectedResult.overallScore) ? Math.round(selectedResult.overallScore) : 0}%
                  </Typography>
                  <Typography variant="h5" sx={{ opacity: 0.9 }}>
                    {selectedResult.grade || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.7 }}>
                    Overall Score
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h5" gutterBottom>
                  {selectedResult.test?.title || selectedResult.testMetadata?.title || 'Latest Test Results'}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }} paragraph>
                  {selectedResult.detailedAnalysis?.interpretation || 
                   selectedResult.feedback?.overall || 
                   'Your assessment has been completed and analyzed.'}
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap">
                  <Chip 
                    label={`${selectedResult.answersCount || Object.keys(selectedResult.answers || {}).length || 0}/${selectedResult.totalQuestions || (selectedResult.testMetadata?.questions?.length) || 0} Questions`} 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                  />
                  <Chip 
                    label={formatTime(selectedResult.timeSpent)} 
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                  />
                  {selectedResult.percentile && typeof selectedResult.percentile === 'number' && !isNaN(selectedResult.percentile) && (
                    <Chip 
                      label={`${Math.round(selectedResult.percentile)}th Percentile`} 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                    />
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={3}>
                <Box textAlign="center">
                  <Button 
                    variant="outlined" 
                    size="large"
                    sx={{ 
                      color: 'white', 
                      borderColor: 'rgba(255,255,255,0.5)',
                      '&:hover': { 
                        borderColor: 'white',
                        bgcolor: 'rgba(255,255,255,0.1)'
                      }
                    }}
                    onClick={() => setTabValue(3)}
                    startIcon={<Insights />}
                  >
                    View Detailed Analysis
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        )}

        {/* AI-Powered Quick Insights */}
        {selectedResult && selectedResult.detailedAnalysis && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {selectedResult.detailedAnalysis.industryBenchmark && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Analytics sx={{ fontSize: 40, color: 'info.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Industry Benchmark</Typography>
                    <Typography variant="h4" color="info.main" fontWeight="bold" gutterBottom>
                      {selectedResult.detailedAnalysis.industryBenchmark}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Compared to industry standards
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {selectedResult.detailedAnalysis.jobFitScore && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <MyLocation sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>Job Fit Score</Typography>
                    <Typography variant="h4" color="success.main" fontWeight="bold" gutterBottom>
                      {selectedResult.detailedAnalysis.jobFitScore}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Alignment with role requirements
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {selectedResult.detailedAnalysis.confidenceLevel && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Speed sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>AI Confidence</Typography>
                    <Typography variant="h4" color="warning.main" fontWeight="bold" gutterBottom>
                      {Math.round(selectedResult.detailedAnalysis.confidenceLevel * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Analysis reliability score
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          {/* Overview Tab */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Psychometric Results
                  </Typography>
                  <List>
                    {getRecentResults().map((result, index) => (
                      <ListItem key={result._id} divider={index < getRecentResults().length - 1}>
                        <ListItemIcon>
                          <Avatar sx={{ 
                            bgcolor: getScoreColor(typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? result.overallScore : 0),
                            width: 32, 
                            height: 32,
                            fontSize: '0.8rem'
                          }}>
                            {typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? Math.round(result.overallScore) : 0}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={result.test?.title || result.testMetadata?.title || 'Generated Test'}
                          secondary={`${new Date(result.createdAt).toLocaleDateString()} • ${formatTime(result.timeSpent)}`}
                        />
                        <Chip 
                          label={result.grade || 'N/A'} 
                          size="small"
                          sx={{ 
                            bgcolor: alpha(getGradeColor(result.grade), 0.2),
                            color: getGradeColor(result.grade),
                            fontWeight: 'bold'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    sx={{ mt: 2 }}
                    onClick={() => setTabValue(1)}
                  >
                    View All Results
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Best Scores by Test
                  </Typography>
                  <List>
                    {getBestScores().slice(0, 5).map((result, index) => (
                      <ListItem key={result._id} divider={index < getBestScores().slice(0, 5).length - 1}>
                        <ListItemIcon>
                          <Star sx={{ color: theme.palette.warning.main }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={result.test?.title || result.testMetadata?.title || 'Generated Test'}
                          secondary={`Best: ${typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? Math.round(result.overallScore) : 0}% • ${result.grade || 'N/A'}`}
                        />
                        <Box sx={{ width: 100, mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? result.overallScore : 0} 
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: alpha(getScoreColor(typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? result.overallScore : 0), 0.2),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getScoreColor(typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? result.overallScore : 0)
                              }
                            }}
                          />
                        </Box>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Question Analysis Tab */}
          {selectedResult && (selectedResult.failedQuestions || selectedResult.correctQuestions || selectedResult.detailedResults) ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Question-by-Question Analysis for {selectedResult.test?.title || selectedResult.testMetadata?.title || 'Psychometric Test'}
              </Typography>
              
              {/* Summary Stats */}
              <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: theme.palette.success.light, color: 'white' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <CheckCircle sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {selectedResult.correctQuestions?.length || Math.max(0, (selectedResult.totalQuestions || 0) - (selectedResult.failedQuestions?.length || 0))}
                          </Typography>
                          <Typography variant="body2">
                            Questions Correct
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: theme.palette.error.light, color: 'white' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Warning sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {selectedResult.failedQuestions?.length || 0}
                          </Typography>
                          <Typography variant="body2">
                            Questions Missed
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ bgcolor: theme.palette.info.light, color: 'white' }}>
                    <CardContent>
                      <Box display="flex" alignItems="center" gap={2}>
                        <QuestionAnswer sx={{ fontSize: 40 }} />
                        <Box>
                          <Typography variant="h4" fontWeight="bold">
                            {selectedResult.totalQuestions || (selectedResult.testMetadata?.questions?.length) || ((selectedResult.correctQuestions?.length || 0) + (selectedResult.failedQuestions?.length || 0)) || 0}
                          </Typography>
                          <Typography variant="body2">
                            Total Questions
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Questions You Missed */}
              {selectedResult.failedQuestions && selectedResult.failedQuestions.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="error.main">
                      <ThumbDown sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Questions You Missed ({selectedResult.failedQuestions.length})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Review these questions to understand areas for improvement
                    </Typography>
                    
                    {selectedResult.failedQuestions.map((question, index) => (
                      <Card key={index} variant="outlined" sx={{ mb: 2, border: '1px solid', borderColor: 'error.light' }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={1}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  bgcolor: 'error.main',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold'
                                }}
                              >
                                {index + 1}
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={11}>
                              <Typography variant="body1" fontWeight="bold" gutterBottom>
                                {question.question}
                              </Typography>
                              
                              <Box sx={{ mb: 2 }}>
                                <Alert severity="error" sx={{ mb: 1 }}>
                                  <Typography variant="body2">
                                    <strong>Your Answer:</strong> {question.yourAnswer}
                                  </Typography>
                                </Alert>
                                <Alert severity="success">
                                  <Typography variant="body2">
                                    <strong>Correct Answer:</strong> {question.correctAnswer}
                                  </Typography>
                                </Alert>
                              </Box>

                              {question.explanation && (
                                <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    <Info sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                                    <strong>Explanation:</strong> {question.explanation}
                                  </Typography>
                                </Box>
                              )}

                              {question.category && (
                                <Chip 
                                  label={question.category.charAt(0).toUpperCase() + question.category.slice(1)} 
                                  size="small" 
                                  color="primary" 
                                  variant="outlined"
                                />
                              )}
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Questions You Got Right */}
              {selectedResult.correctQuestions && selectedResult.correctQuestions.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      <ThumbUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Questions You Got Right ({selectedResult.correctQuestions.length})
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Great job on these questions! These represent your areas of strength.
                    </Typography>
                    
                    {selectedResult.correctQuestions.slice(0, 5).map((question, index) => (
                      <Card key={index} variant="outlined" sx={{ mb: 2, border: '1px solid', borderColor: 'success.light' }}>
                        <CardContent>
                          <Grid container spacing={2}>
                            <Grid item xs={12} sm={1}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: '50%',
                                  bgcolor: 'success.main',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold'
                                }}
                              >
                                ✓
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={11}>
                              <Typography variant="body1" fontWeight="bold" gutterBottom>
                                {question.question}
                              </Typography>
                              
                              <Alert severity="success" sx={{ mb: 1 }}>
                                <Typography variant="body2">
                                  <strong>Correct Answer:</strong> {question.options ? question.options[question.correctAnswer] : 'N/A'}
                                </Typography>
                              </Alert>

                              {question.explanation && (
                                <Box sx={{ bgcolor: 'success.50', p: 2, borderRadius: 1, mb: 1 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    <CheckCircle sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                                    <strong>Why this is correct:</strong> {question.explanation}
                                  </Typography>
                                </Box>
                              )}

                              {question.category && (
                                <Chip 
                                  label={question.category.charAt(0).toUpperCase() + question.category.slice(1)} 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                />
                              )}
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    ))}

                    {selectedResult.correctQuestions.length > 5 && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
                        + {selectedResult.correctQuestions.length - 5} more correct answers
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Performance by Category */}
              {selectedResult.categoryScores && Object.keys(selectedResult.categoryScores).length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Performance by Category
                    </Typography>
                    <Grid container spacing={3}>
                      {Object.entries(selectedResult.categoryScores).map(([category, score]) => {
                        const safeScore = typeof score === 'number' && !isNaN(score) ? Math.round(score) : 0;
                        return (
                          <Grid item xs={12} sm={6} md={3} key={category}>
                            <Box textAlign="center">
                              <Box
                                sx={{
                                  width: 80,
                                  height: 80,
                                  borderRadius: '50%',
                                  bgcolor: safeScore >= 80 ? 'success.light' : safeScore >= 60 ? 'warning.light' : 'error.light',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '1.5rem',
                                  mx: 'auto',
                                  mb: 2
                                }}
                              >
                                {safeScore}%
                              </Box>
                              <Typography variant="body1" fontWeight="bold" gutterBottom sx={{ textTransform: 'capitalize' }}>
                                {category.replace(/([A-Z])/g, ' $1').trim()}
                              </Typography>
                              <LinearProgress
                                variant="determinate"
                                value={safeScore}
                                color={safeScore >= 80 ? 'success' : safeScore >= 60 ? 'warning' : 'error'}
                                sx={{ height: 6, borderRadius: 3 }}
                              />
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              )}
            </Box>
          ) : (
            <Box textAlign="center" py={8}>
              <QuestionAnswer sx={{ fontSize: 80, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Question Analysis Available
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedResult ? 
                  'This test result does not contain detailed question-by-question analysis.' : 
                  'Select a test result to view detailed question analysis.'
                }
              </Typography>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* All Results Tab */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Test Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Attempt</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Job</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testResults.map((result) => (
                  <TableRow key={result._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {result.test?.title || result.testMetadata?.title || 'Generated Test'}
                        </Typography>
                        {(result.test?.jobSpecific || result.testMetadata?.jobSpecific) && (
                          <Chip label="Job-Specific" size="small" color="primary" sx={{ mt: 0.5 }} />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={result.test?.type || result.testMetadata?.type || 'Generated'} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography 
                          variant="body2" 
                          fontWeight="bold"
                          color={getScoreColor(typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? result.overallScore : 0)}
                        >
                          {typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? Math.round(result.overallScore) : 0}%
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={typeof result.overallScore === 'number' && !isNaN(result.overallScore) ? result.overallScore : 0} 
                          sx={{ width: 50, height: 4 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={result.grade || 'N/A'} 
                        size="small"
                        sx={{ 
                          bgcolor: alpha(getGradeColor(result.grade), 0.2),
                          color: getGradeColor(result.grade),
                          fontWeight: 'bold'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        #{result.attempt || 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(result.createdAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatTime(result.timeSpent)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {result.job ? (
                        <Typography variant="body2">
                          {result.job.title} at {result.job.company}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          General Assessment
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        onClick={() => setSelectedResultWithDetails(result)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Progress Analysis Tab */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Score Progression Over Time
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Track your improvement across all assessments
                  </Typography>
                  {/* Add chart component here */}
                  <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Progress chart would be implemented here with a charting library
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          {/* Detailed Feedback Tab */}
          <Grid container spacing={3}>
            {selectedResult ? (
              <>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {selectedResult.test?.title || selectedResult.testMetadata?.title || 'Generated Test'} - Detailed Results
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Completed on {new Date(selectedResult.createdAt).toLocaleDateString()}
                      </Typography>

                      {/* Overall Performance Summary */}
                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={3}>
                          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'primary.light', color: 'white' }}>
                            <Typography variant="h3" fontWeight="bold">{selectedResult.overallScore}%</Typography>
                            <Typography variant="body2">Overall Score</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', color: 'white' }}>
                            <Typography variant="h3" fontWeight="bold">{selectedResult.grade || 'N/A'}</Typography>
                            <Typography variant="body2">Grade</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'info.light', color: 'white' }}>
                            <Typography variant="h3" fontWeight="bold">{selectedResult.percentile || 'N/A'}%</Typography>
                            <Typography variant="body2">Percentile</Typography>
                          </Card>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'warning.light', color: 'white' }}>
                            <Typography variant="h3" fontWeight="bold">{formatTime(selectedResult.timeSpent)}</Typography>
                            <Typography variant="body2">Time Taken</Typography>
                          </Card>
                        </Grid>
                      </Grid>

                      {/* Category Scores */}
                      {selectedResult.categoryScores && Object.keys(selectedResult.categoryScores).length > 0 && (
                        <Card sx={{ mb: 3 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Category Performance
                            </Typography>
                            <Grid container spacing={2}>
                              {Object.entries(selectedResult.categoryScores).map(([category, score]) => (
                                <Grid item xs={12} sm={6} md={3} key={category}>
                                  <Box>
                                    <Typography variant="body2" gutterBottom sx={{ textTransform: 'capitalize' }}>
                                      {category.replace(/([A-Z])/g, ' $1').trim()}
                                    </Typography>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={score as number} 
                                      sx={{ height: 10, borderRadius: 5, mb: 1 }}
                                    />
                                    <Typography variant="body2" color="text.secondary">
                                      {score}%
                                    </Typography>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      )}

                      {/* Detailed Analysis */}
                      {selectedResult.detailedAnalysis && (
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                          {/* Strengths */}
                          {selectedResult.detailedAnalysis.strengths && selectedResult.detailedAnalysis.strengths.length > 0 && (
                            <Grid item xs={12} md={6}>
                              <Card sx={{ height: '100%' }}>
                                <CardContent>
                                  <Typography variant="h6" gutterBottom color="success.main">
                                    <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Key Strengths
                                  </Typography>
                                  <List dense>
                                    {selectedResult.detailedAnalysis.strengths.map((strength: string, index: number) => (
                                      <ListItem key={index}>
                                        <ListItemIcon>
                                          <CheckCircle color="success" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText 
                                          primary={strength} 
                                          primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}

                          {/* Development Areas */}
                          {selectedResult.detailedAnalysis.developmentAreas && selectedResult.detailedAnalysis.developmentAreas.length > 0 && (
                            <Grid item xs={12} md={6}>
                              <Card sx={{ height: '100%' }}>
                                <CardContent>
                                  <Typography variant="h6" gutterBottom color="warning.main">
                                    <TrendingDown sx={{ mr: 1, verticalAlign: 'middle' }} />
                                    Development Areas
                                  </Typography>
                                  <List dense>
                                    {selectedResult.detailedAnalysis.developmentAreas.map((area: string, index: number) => (
                                      <ListItem key={index}>
                                        <ListItemIcon>
                                          <Build color="warning" fontSize="small" />
                                        </ListItemIcon>
                                        <ListItemText 
                                          primary={area} 
                                          primaryTypographyProps={{ variant: 'body2' }}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </CardContent>
                              </Card>
                            </Grid>
                          )}
                        </Grid>
                      )}

                      {/* Skill Gaps Analysis */}
                      {selectedResult.detailedAnalysis?.skillGaps && selectedResult.detailedAnalysis.skillGaps.length > 0 && (
                        <Card sx={{ mb: 3 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              <GpsFixed sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Skill Development Plan
                            </Typography>
                            <Grid container spacing={2}>
                              {selectedResult.detailedAnalysis.skillGaps.map((skillGap: any, index: number) => (
                                <Grid item xs={12} md={6} key={index}>
                                  <Card variant="outlined">
                                    <CardContent>
                                      <Typography variant="h6" gutterBottom color="primary.main">
                                        {skillGap.skill}
                                      </Typography>
                                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                                        <Chip 
                                          label={`Current: ${skillGap.currentLevel}`} 
                                          size="small" 
                                          color="warning" 
                                        />
                                        <Chip 
                                          label={`Target: ${skillGap.targetLevel}`} 
                                          size="small" 
                                          color="success" 
                                        />
                                        <Chip 
                                          label={skillGap.importance} 
                                          size="small" 
                                          color={skillGap.importance === 'High' ? 'error' : 'info'} 
                                        />
                                      </Box>
                                      <Typography variant="body2" color="text.secondary">
                                        {skillGap.learningPath}
                                      </Typography>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      )}

                      {/* Career Readiness */}
                      {selectedResult.detailedAnalysis?.careerReadiness && (
                        <Card sx={{ mb: 3 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              <BusinessCenter sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Career Readiness Assessment
                            </Typography>
                            <Grid container spacing={3}>
                              <Grid item xs={12} md={3}>
                                <Box textAlign="center">
                                  <Typography variant="h4" color="primary.main" fontWeight="bold">
                                    {selectedResult.detailedAnalysis.careerReadiness.currentRole || 'N/A'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">Current Role Fit</Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={3}>
                                <Box textAlign="center">
                                  <Typography variant="h4" color="success.main" fontWeight="bold">
                                    {selectedResult.detailedAnalysis.careerReadiness.nextLevel || 'N/A'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">Next Level Readiness</Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={3}>
                                <Box textAlign="center">
                                  <Typography variant="h4" color="info.main" fontWeight="bold">
                                    {selectedResult.detailedAnalysis.careerReadiness.timeToPromotion || 'N/A'}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">Est. Time to Promotion</Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={3}>
                                <Box textAlign="center">
                                  <Typography variant="h4" color="warning.main" fontWeight="bold">
                                    {selectedResult.detailedAnalysis.jobFitScore || selectedResult.overallScore}%
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">Job Fit Score</Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      )}

                      {/* Question-by-Question Breakdown */}
                      {selectedResult.test?.questions && selectedResult.answers && (
                        <Card sx={{ mb: 3 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              <QuestionAnswer sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Question Analysis & Feedback
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                              Detailed breakdown of your responses and areas for improvement
                            </Typography>
                            
                            <Box sx={{ maxHeight: 600, overflowY: 'auto' }}>
                              {selectedResult.test.questions.map((question: any, index: number) => {
                                const questionId = question._id || question.id || `q${index + 1}`;
                                const userAnswer = selectedResult.answers?.[questionId];
                                const isCorrect = question.correctAnswer ? userAnswer === question.correctAnswer : null;
                                const hasAnswer = userAnswer !== undefined && userAnswer !== null && userAnswer !== '';

                                return (
                                  <Card key={index} variant="outlined" sx={{ mb: 2 }}>
                                    <CardContent>
                                      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                                        <Box sx={{ flex: 1 }}>
                                          <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                                            Q{index + 1}: {question.question}
                                          </Typography>
                                          <Box display="flex" gap={1} mb={2}>
                                            <Chip 
                                              label={question.category || 'General'} 
                                              size="small" 
                                              color="primary" 
                                              variant="outlined" 
                                            />
                                            <Chip 
                                              label={question.type?.replace('_', ' ') || 'Mixed'} 
                                              size="small" 
                                              color="secondary" 
                                              variant="outlined" 
                                            />
                                          </Box>
                                        </Box>
                                        
                                        <Box display="flex" alignItems="center" gap={1}>
                                          {!hasAnswer ? (
                                            <Chip icon={<Warning />} label="Skipped" size="small" color="error" />
                                          ) : isCorrect === true ? (
                                            <Chip icon={<ThumbUp />} label="Correct" size="small" color="success" />
                                          ) : isCorrect === false ? (
                                            <Chip icon={<ThumbDown />} label="Incorrect" size="small" color="error" />
                                          ) : (
                                            <Chip icon={<Info />} label="Answered" size="small" color="info" />
                                          )}
                                        </Box>
                                      </Box>

                                      <Grid container spacing={2}>
                                        <Grid item xs={12} md={6}>
                                          <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Your Answer:
                                          </Typography>
                                          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                                            <Typography variant="body2">
                                              {hasAnswer ? (
                                                typeof userAnswer === 'string' && userAnswer.length > 100 ? 
                                                  `${userAnswer.substring(0, 100)}...` : 
                                                  String(userAnswer)
                                              ) : (
                                                <em style={{ color: '#999' }}>No answer provided</em>
                                              )}
                                            </Typography>
                                          </Paper>
                                        </Grid>

                                        {question.correctAnswer && (
                                          <Grid item xs={12} md={6}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                              Expected Answer:
                                            </Typography>
                                            <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                                              <Typography variant="body2" color="success.dark">
                                                {question.correctAnswer}
                                              </Typography>
                                            </Paper>
                                          </Grid>
                                        )}

                                        {question.explanation && (
                                          <Grid item xs={12}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                              Explanation:
                                            </Typography>
                                            <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                                              <Typography variant="body2">
                                                {question.explanation}
                                              </Typography>
                                            </Alert>
                                          </Grid>
                                        )}
                                      </Grid>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </Box>

                            {/* Summary Stats */}
                            <Card variant="outlined" sx={{ mt: 3, bgcolor: 'background.default' }}>
                              <CardContent>
                                <Typography variant="h6" gutterBottom>Question Summary</Typography>
                                <Grid container spacing={2}>
                                  <Grid item xs={6} sm={3}>
                                    <Box textAlign="center">
                                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                                        {selectedResult.answersCount || Object.keys(selectedResult.answers || {}).length}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Answered
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={6} sm={3}>
                                    <Box textAlign="center">
                                      <Typography variant="h4" color="error.main" fontWeight="bold">
                                        {selectedResult.totalQuestions - (selectedResult.answersCount || Object.keys(selectedResult.answers || {}).length)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Skipped
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={6} sm={3}>
                                    <Box textAlign="center">
                                      <Typography variant="h4" color="success.main" fontWeight="bold">
                                        {selectedResult.test.questions?.filter((q: any, i: number) => {
                                          const qId = q._id || q.id || `q${i + 1}`;
                                          const userAnswer = selectedResult.answers?.[qId];
                                          return q.correctAnswer && userAnswer === q.correctAnswer;
                                        }).length || 0}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Correct
                                      </Typography>
                                    </Box>
                                  </Grid>
                                  <Grid item xs={6} sm={3}>
                                    <Box textAlign="center">
                                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                                        {Math.round(((selectedResult.answersCount || Object.keys(selectedResult.answers || {}).length) / selectedResult.totalQuestions) * 100)}%
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Completion Rate
                                      </Typography>
                                    </Box>
                                  </Grid>
                                </Grid>
                              </CardContent>
                            </Card>
                          </CardContent>
                        </Card>
                      )}

                      {/* Learning Recommendations */}
                      {selectedResult.detailedAnalysis?.learningRecommendations && selectedResult.detailedAnalysis.learningRecommendations.length > 0 && (
                        <Card sx={{ mb: 3 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              <Route sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Learning Pathway Recommendations
                            </Typography>
                            <Grid container spacing={2}>
                              {selectedResult.detailedAnalysis.learningRecommendations.map((rec: any, index: number) => (
                                <Grid item xs={12} key={index}>
                                  <Card variant="outlined" sx={{ 
                                    borderLeft: `4px solid ${rec.priority === 'High' ? theme.palette.error.main : theme.palette.info.main}` 
                                  }}>
                                    <CardContent>
                                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                                        <Typography variant="h6" color="primary.main">
                                          {rec.type}
                                        </Typography>
                                        <Chip 
                                          label={`${rec.priority} Priority`} 
                                          size="small" 
                                          color={rec.priority === 'High' ? 'error' : 'info'} 
                                        />
                                      </Box>
                                      <Typography variant="body1" paragraph>
                                        {rec.recommendation}
                                      </Typography>
                                      <Box display="flex" alignItems="center" gap={2}>
                                        <Chip 
                                          icon={<Timer />} 
                                          label={rec.timeline} 
                                          size="small" 
                                          variant="outlined" 
                                        />
                                        <Typography variant="body2" color="text.secondary">
                                          Resources: {rec.resources?.join(', ') || 'To be defined'}
                                        </Typography>
                                      </Box>
                                    </CardContent>
                                  </Card>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      )}

                      {/* Next Steps */}
                      {selectedResult.detailedAnalysis?.nextSteps && selectedResult.detailedAnalysis.nextSteps.length > 0 && (
                        <Card>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
                              Recommended Next Steps
                            </Typography>
                            <List>
                              {selectedResult.detailedAnalysis.nextSteps.map((step: string, index: number) => (
                                <ListItem key={index}>
                                  <ListItemIcon>
                                    <Avatar sx={{ bgcolor: 'primary.main', width: 24, height: 24, fontSize: '0.75rem' }}>
                                      {index + 1}
                                    </Avatar>
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={step} 
                                    primaryTypographyProps={{ variant: 'body1' }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </CardContent>
                        </Card>
                      )}

                      {/* Fallback for basic feedback */}
                      {selectedResult.feedback && !selectedResult.detailedAnalysis && (
                        <Box>
                          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                            Overall Performance
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {selectedResult.feedback.overall}
                          </Typography>

                          <Grid container spacing={3} sx={{ mt: 2 }}>
                            <Grid item xs={12} md={4}>
                              <Typography variant="h6" gutterBottom color="success.main">
                                <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Strengths
                              </Typography>
                              <List dense>
                                {selectedResult.feedback.strengths?.map((strength: string, index: number) => (
                                  <ListItem key={index}>
                                    <ListItemIcon>
                                      <CheckCircle color="success" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={strength} />
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>

                            <Grid item xs={12} md={4}>
                              <Typography variant="h6" gutterBottom color="warning.main">
                                <TrendingDown sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Areas for Improvement
                              </Typography>
                              <List dense>
                                {selectedResult.feedback.improvements?.map((improvement: string, index: number) => (
                                  <ListItem key={index}>
                                    <ListItemIcon>
                                      <Build color="warning" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={improvement} />
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>

                            <Grid item xs={12} md={4}>
                              <Typography variant="h6" gutterBottom color="info.main">
                                <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
                                Recommendations
                              </Typography>
                              <List dense>
                                {selectedResult.feedback.recommendations?.map((recommendation: string, index: number) => (
                                  <ListItem key={index}>
                                    <ListItemIcon>
                                      <Star color="info" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={recommendation} />
                                  </ListItem>
                                ))}
                              </List>
                            </Grid>
                          </Grid>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </>
            ) : (
              <Grid item xs={12}>
                <Alert severity="info">
                  Select a test result from the "All Results" tab to view detailed feedback.
                </Alert>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Quick Actions */}
        <Box mt={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Continue Your Assessment Journey
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="contained" 
                  startIcon={<Assessment />}
                  onClick={() => navigate('/app/tests')}
                >
                  Take New Assessment
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<Work />}
                  onClick={() => navigate('/app/jobs')}
                >
                  Find Job-Specific Tests
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<School />}
                  onClick={() => navigate('/app/certificates')}
                >
                  View Certificates
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </Container>
  );
};

export default PsychometricResultsPage;
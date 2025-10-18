import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  CardMedia,
  CardActions,
  Rating
} from '@mui/material';
import {
  ArrowBack,
  Refresh,
  EmojiEvents,
  TrendingUp,
  Psychology,
  CheckCircle,
  Cancel,
  HelpOutline,
  ExpandMore,
  Share,
  Download,
  School,
  PlayArrow,
  Star,
  AccessTime,
  People
} from '@mui/icons-material';
import { courseService, ICourse } from '../../services/courseService';
import { useNavigate } from 'react-router-dom';

interface PastPaper {
  _id: string;
  title: string;
  subject: string;
  level: string;
  year: number;
  totalMarks: number;
}

interface ExamResultsProps {
  pastPaper: PastPaper;
  results: {
    score: number;
    percentage: number;
    gradeLetter: string;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    timeSpent: number;
    feedback: string;
    recommendations: string[];
    strengths: string[];
    weaknesses: string[];
    questionResults: Array<{
      questionId: string;
      studentAnswer: any;
      correctAnswer: any;
      isCorrect: boolean;
      pointsEarned: number;
      pointsPossible: number;
      explanation?: string;
      topic?: string;
    }>;
  };
  onRetake: () => void;
  onBackToPapers: () => void;
}

const ExamResults: React.FC<ExamResultsProps> = ({
  pastPaper,
  results,
  onRetake,
  onBackToPapers
}) => {
  const [expandedSection, setExpandedSection] = useState<string | false>('overview');
  const [recommendedCourses, setRecommendedCourses] = useState<ICourse[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const navigate = useNavigate();

  const handleSectionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  // Fetch recommended courses based on exam results
  useEffect(() => {
    const fetchRecommendedCourses = async () => {
      setLoadingCourses(true);
      try {
        // Create search terms based on weaknesses and subject
        const searchTerms = [
          pastPaper.subject.toLowerCase(),
          ...results.weaknesses.map(w => w.toLowerCase()),
          ...results.strengths.map(s => s.toLowerCase())
        ].join(' ');

        // Fetch courses related to the subject and performance areas
        const courseResponse = await courseService.getPublicCourses({
          search: searchTerms,
          limit: 6,
          sortBy: 'rating',
          sortOrder: 'desc'
        });

        setRecommendedCourses(courseResponse.courses);
      } catch (error) {
        console.error('Error fetching recommended courses:', error);
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchRecommendedCourses();
  }, [pastPaper.subject, results.weaknesses, results.strengths]);

  const handleEnrollCourse = (courseId: string) => {
    navigate(`/courses/${courseId}`);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
      case 'A-':
        return 'success';
      case 'B+':
      case 'B':
      case 'B-':
        return 'info';
      case 'C+':
      case 'C':
      case 'C-':
        return 'warning';
      default:
        return 'error';
    }
  };

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return "Outstanding! You've mastered this subject.";
    if (percentage >= 80) return "Excellent work! You have a strong understanding.";
    if (percentage >= 70) return "Good job! You're on the right track.";
    if (percentage >= 60) return "Not bad! There's room for improvement.";
    return "Keep studying! You can do better with more practice.";
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 4, mb: 3, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onBackToPapers}
          >
            Back to Past Papers
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Share Results">
              <IconButton>
                <Share />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Results">
              <IconButton>
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          {pastPaper.title}
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          {pastPaper.subject} • {pastPaper.level} • {pastPaper.year}
        </Typography>

        {/* Score Display */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {results.percentage.toFixed(1)}%
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Final Score
            </Typography>
          </Box>
          
          <Divider orientation="vertical" flexItem />
          
          <Box sx={{ textAlign: 'center' }}>
            <Chip
              label={results.gradeLetter}
              color={getGradeColor(results.gradeLetter) as any}
              sx={{ fontSize: '2rem', height: 60, width: 60 }}
            />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
              Grade
            </Typography>
          </Box>
        </Box>

        <Alert 
          severity={getPerformanceColor(results.percentage) as any}
          sx={{ mb: 3, textAlign: 'left' }}
        >
          <Typography variant="h6" gutterBottom>
            {getPerformanceMessage(results.percentage)}
          </Typography>
          <Typography variant="body2">
            {results.feedback}
          </Typography>
        </Alert>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={onRetake}
            size="large"
          >
            Retake Exam
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUp />}
            onClick={() => setExpandedSection('detailed')}
            size="large"
          >
            View Detailed Results
          </Button>
        </Box>
      </Paper>

      {/* Detailed Results */}
      <Grid container spacing={3}>
        {/* Overview Stats */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents />
                Performance Overview
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Correct Answers</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {results.correctAnswers} / {results.correctAnswers + results.incorrectAnswers + results.unansweredQuestions}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(results.correctAnswers / (results.correctAnswers + results.incorrectAnswers + results.unansweredQuestions)) * 100}
                  color="success"
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'success.light', borderRadius: 2 }}>
                    <Typography variant="h4" color="success.dark" fontWeight="bold">
                      {results.correctAnswers}
                    </Typography>
                    <Typography variant="body2" color="success.dark">
                      Correct
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'error.light', borderRadius: 2 }}>
                    <Typography variant="h4" color="error.dark" fontWeight="bold">
                      {results.incorrectAnswers}
                    </Typography>
                    <Typography variant="body2" color="error.dark">
                      Incorrect
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Time Spent: {Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Score: {results.score} / {pastPaper.totalMarks} points
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Strengths and Weaknesses */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Psychology />
                Analysis
              </Typography>

              {results.strengths.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="success.main" gutterBottom>
                    Your Strengths
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {results.strengths.map((strength, index) => (
                      <Chip
                        key={index}
                        label={strength}
                        color="success"
                        size="small"
                        icon={<CheckCircle />}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {results.weaknesses.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="error.main" gutterBottom>
                    Areas for Improvement
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {results.weaknesses.map((weakness, index) => (
                      <Chip
                        key={index}
                        label={weakness}
                        color="error"
                        size="small"
                        icon={<Cancel />}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {results.recommendations.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="primary.main" gutterBottom>
                    Recommendations
                  </Typography>
                  <List dense>
                    {results.recommendations.map((recommendation, index) => (
                      <ListItem key={index} sx={{ py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <HelpOutline fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={recommendation}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Question-by-Question Review */}
        <Grid item xs={12}>
          <Accordion expanded={expandedSection === 'detailed'} onChange={handleSectionChange('detailed')}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="h6">Question-by-Question Review</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {results.questionResults.map((questionResult, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card 
                      sx={{ 
                        border: questionResult.isCorrect ? '2px solid' : '2px solid',
                        borderColor: questionResult.isCorrect ? 'success.main' : 'error.main'
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            Question {index + 1}
                          </Typography>
                          <Chip
                            icon={questionResult.isCorrect ? <CheckCircle /> : <Cancel />}
                            label={questionResult.isCorrect ? 'Correct' : 'Incorrect'}
                            color={questionResult.isCorrect ? 'success' : 'error'}
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {questionResult.pointsEarned} / {questionResult.pointsPossible} points
                        </Typography>
                        
                        {questionResult.topic && (
                          <Chip
                            label={questionResult.topic}
                            size="small"
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                        )}
                        
                        {questionResult.explanation && (
                          <Alert severity="info" sx={{ mt: 1 }}>
                            <Typography variant="caption">
                              {questionResult.explanation}
                            </Typography>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* AI-Powered Course Recommendations */}
        <Grid item xs={12}>
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <School color="primary" />
                <Typography variant="h6" gutterBottom>
                  Recommended Courses to Help You Succeed
                </Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Based on your performance in {pastPaper.subject}, we've found courses that can help you improve in areas where you need more practice.
              </Typography>

              {loadingCourses ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : recommendedCourses.length > 0 ? (
                <Grid container spacing={3}>
                  {recommendedCourses.map((course) => (
                    <Grid item xs={12} sm={6} md={4} key={course._id}>
                      <Card 
                        sx={{ 
                          height: '100%', 
                          display: 'flex', 
                          flexDirection: 'column',
                          transition: 'transform 0.2s ease-in-out',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 4
                          }
                        }}
                      >
                        <CardMedia
                          component="div"
                          sx={{
                            height: 140,
                            backgroundColor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                          }}
                        >
                          <School sx={{ fontSize: 48 }} />
                        </CardMedia>
                        
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Typography variant="h6" gutterBottom noWrap>
                            {course.title}
                          </Typography>
                          
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            }}
                          >
                            {course.description}
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Rating 
                              value={course.rating} 
                              readOnly 
                              size="small"
                              precision={0.1}
                            />
                            <Typography variant="body2" color="text.secondary">
                              ({course.ratingCount})
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <AccessTime fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {course.duration}h
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <People fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {course.enrollmentCount} enrolled
                              </Typography>
                            </Box>
                          </Box>

                          <Chip 
                            label={course.level} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            sx={{ mb: 2 }}
                          />
                        </CardContent>
                        
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleEnrollCourse(course._id)}
                            fullWidth
                            sx={{
                              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                              '&:hover': {
                                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                              }
                            }}
                          >
                            Enroll Now
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Alert severity="info">
                  <Typography variant="body2">
                    No specific course recommendations available at the moment. 
                    Check out our course catalog for more learning opportunities!
                  </Typography>
                </Alert>
              )}

              {recommendedCourses.length > 0 && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/courses')}
                    size="large"
                    startIcon={<School />}
                  >
                    View All Courses
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ExamResults;

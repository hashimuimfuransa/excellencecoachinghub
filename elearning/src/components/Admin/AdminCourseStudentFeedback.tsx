import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Stack,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ExpandMore,
  TrendingUp,
  ThumbUp,
  Warning,
  School,
  AccessTime,
  Person,
  Star,
  Feedback as FeedbackIcon,
  BarChart,
  Schedule,
  CheckCircle
} from '@mui/icons-material';
import { feedbackService, CourseFeedbackStats, WeekFeedback } from '../../services/feedbackService';

interface AdminCourseStudentFeedbackProps {
  courseId: string;
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
      id={`feedback-tabpanel-${index}`}
      aria-labelledby={`feedback-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminCourseStudentFeedback: React.FC<AdminCourseStudentFeedbackProps> = ({ courseId }) => {
  const [feedbackStats, setFeedbackStats] = useState<CourseFeedbackStats | null>(null);
  const [allFeedback, setAllFeedback] = useState<WeekFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  useEffect(() => {
    loadFeedbackData();
  }, [courseId]);

  const loadFeedbackData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both statistics and all feedback
      const [statsResponse, feedbackResponse] = await Promise.all([
        feedbackService.getCourseFeedbackStats(courseId),
        feedbackService.getCourseFeedback(courseId, 1, 100) // Get more feedback for analysis
      ]);

      if (statsResponse.success) {
        setFeedbackStats(statsResponse.data);
      } else {
        setError('Failed to load feedback statistics');
      }

      if (feedbackResponse.success) {
        setAllFeedback(feedbackResponse.data.feedback);
      }

    } catch (err) {
      console.error('Failed to load feedback data:', err);
      setError('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'too_easy': return 'success';
      case 'too_hard': return 'error';
      default: return 'primary';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading student feedback...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!feedbackStats) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        No feedback data available for this course yet.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <FeedbackIcon sx={{ mr: 2 }} />
        Student Feedback & Reviews
      </Typography>

      {/* Overview Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="h4" color="primary">
                    {feedbackStats.totalFeedback}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Reviews
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: getRatingColor(feedbackStats.averageRating), mr: 2 }}>
                  <Star />
                </Avatar>
                <Box>
                  <Typography variant="h4" color={getRatingColor(feedbackStats.averageRating)}>
                    {feedbackStats.averageRating.toFixed(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <ThumbUp />
                </Avatar>
                <Box>
                  <Typography variant="h4" color="success.main">
                    {feedbackStats.recommendationRate.toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recommend Rate
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {feedbackStats.feedbackByWeek.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Weeks Reviewed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Detailed Rating Breakdown */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Rating Breakdown
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Content Quality</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {feedbackStats.averageContentQuality.toFixed(1)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(feedbackStats.averageContentQuality / 5) * 100}
                sx={{ mt: 1, mb: 2 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Instructor Rating</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {feedbackStats.averageInstructorRating.toFixed(1)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(feedbackStats.averageInstructorRating / 5) * 100}
                sx={{ mt: 1, mb: 2 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Materials Rating</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {feedbackStats.averageMaterialsRating.toFixed(1)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(feedbackStats.averageMaterialsRating / 5) * 100}
                sx={{ mt: 1, mb: 2 }}
              />
            </Box>

            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Pace Rating</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {feedbackStats.averagePaceRating.toFixed(1)}
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={(feedbackStats.averagePaceRating / 5) * 100}
                sx={{ mt: 1 }}
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Difficulty Distribution
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Too Easy</Typography>
                <Chip 
                  label={feedbackStats.difficultyDistribution.too_easy} 
                  color="success" 
                  size="small"
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={feedbackStats.totalFeedback > 0 ? (feedbackStats.difficultyDistribution.too_easy / feedbackStats.totalFeedback) * 100 : 0}
                color="success"
                sx={{ mt: 1, mb: 2 }}
              />
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Just Right</Typography>
                <Chip 
                  label={feedbackStats.difficultyDistribution.just_right} 
                  color="primary" 
                  size="small"
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={feedbackStats.totalFeedback > 0 ? (feedbackStats.difficultyDistribution.just_right / feedbackStats.totalFeedback) * 100 : 0}
                sx={{ mt: 1, mb: 2 }}
              />
            </Box>

            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="body2">Too Hard</Typography>
                <Chip 
                  label={feedbackStats.difficultyDistribution.too_hard} 
                  color="error" 
                  size="small"
                />
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={feedbackStats.totalFeedback > 0 ? (feedbackStats.difficultyDistribution.too_hard / feedbackStats.totalFeedback) * 100 : 0}
                color="error"
                sx={{ mt: 1 }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabbed Content */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="By Week" icon={<Schedule />} iconPosition="start" />
          <Tab label="Recent Feedback" icon={<AccessTime />} iconPosition="start" />
          <Tab label="Top Challenges" icon={<Warning />} iconPosition="start" />
          <Tab label="Favorites" icon={<ThumbUp />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panels */}
      <TabPanel value={activeTab} index={0}>
        <Typography variant="h6" gutterBottom>
          Feedback by Week
        </Typography>
        {feedbackStats.feedbackByWeek.map((week) => (
          <Accordion key={week.weekId} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box display="flex" alignItems="center" width="100%">
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  {week.weekTitle}
                </Typography>
                <Box display="flex" alignItems="center" sx={{ mr: 2 }}>
                  <Badge badgeContent={week.feedbackCount} color="primary" sx={{ mr: 3 }}>
                    <FeedbackIcon />
                  </Badge>
                  <Rating value={week.averageRating} readOnly size="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    ({week.averageRating.toFixed(1)})
                  </Typography>
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <List>
                {week.feedback.slice(0, 5).map((feedback) => (
                  <ListItem key={feedback.id}>
                    <ListItemAvatar>
                      <Avatar>
                        {feedback.studentName.split(' ').map(n => n[0]).join('')}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center">
                          <Typography variant="subtitle2" sx={{ mr: 2 }}>
                            {feedback.studentName}
                          </Typography>
                          <Rating value={feedback.overallRating} readOnly size="small" />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            "{feedback.comments.substring(0, 150)}..."
                          </Typography>
                          <Stack direction="row" spacing={1}>
                            <Chip 
                              label={feedback.difficultyLevel.replace('_', ' ')} 
                              size="small" 
                              color={getDifficultyColor(feedback.difficultyLevel)}
                            />
                            {feedback.wouldRecommend && (
                              <Chip label="Would Recommend" size="small" color="success" />
                            )}
                          </Stack>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
                {week.feedback.length > 5 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography variant="body2" color="primary" sx={{ textAlign: 'center' }}>
                          +{week.feedback.length - 5} more reviews for this week
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </AccordionDetails>
          </Accordion>
        ))}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Typography variant="h6" gutterBottom>
          Recent Student Feedback
        </Typography>
        <List>
          {feedbackStats.recentFeedback.map((feedback) => (
            <ListItem key={feedback.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
              <ListItemAvatar>
                <Avatar>
                  {feedback.studentName.split(' ').map(n => n[0]).join('')}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">
                      {feedback.studentName}
                    </Typography>
                    <Box display="flex" alignItems="center">
                      <Rating value={feedback.overallRating} readOnly size="small" />
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        {new Date(feedback.submittedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="primary" sx={{ mb: 1 }}>
                      Week: {feedback.weekTitle}
                    </Typography>
                    <Typography variant="body2">
                      "{feedback.comments}"
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Typography variant="h6" gutterBottom>
          Common Challenges Reported by Students
        </Typography>
        <Grid container spacing={2}>
          {feedbackStats.topChallenges.map((challenge, index) => (
            <Grid item xs={12} sm={6} md={4} key={challenge.challenge}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      {index + 1}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {challenge.challenge}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Reported by {challenge.count} students
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <Typography variant="h6" gutterBottom>
          Most Appreciated Aspects
        </Typography>
        <Grid container spacing={2}>
          {feedbackStats.topFavorites.map((favorite, index) => (
            <Grid item xs={12} sm={6} md={4} key={favorite.aspect}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                      {index + 1}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {favorite.aspect}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Liked by {favorite.count} students
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {feedbackStats.totalFeedback === 0 && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No student feedback has been submitted for this course yet. Feedback will appear here once students complete course weeks and submit their reviews.
        </Alert>
      )}
    </Box>
  );
};

export default AdminCourseStudentFeedback;
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  Rating,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Feedback,
  Star,
  TrendingUp,
  People,
  ThumbUp,
  ThumbDown,
  School,
  Schedule,
  EmojiEvents,
  ArrowBack
} from '@mui/icons-material';
import { weekFeedbackService, WeekFeedback, WeekFeedbackStats } from '../../services/weekFeedbackService';
import { useNavigate } from 'react-router-dom';

const AdminFeedbackDashboard: React.FC = () => {
  const { courseId, weekId } = useParams<{ courseId?: string; weekId?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<WeekFeedback[]>([]);
  const [stats, setStats] = useState<WeekFeedbackStats | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<WeekFeedback | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedWeek, setSelectedWeek] = useState<string>(weekId || '');
  const [weeks, setWeeks] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [courseId, selectedWeek]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (selectedWeek) {
        // Load feedback for specific week
        const [weekFeedback, weekStats] = await Promise.all([
          weekFeedbackService.getWeekFeedback(selectedWeek),
          weekFeedbackService.getWeekFeedbackStats(selectedWeek)
        ]);
        setFeedback(weekFeedback);
        setStats(weekStats);
      } else if (courseId) {
        // Load feedback for entire course
        const courseFeedback = await weekFeedbackService.getCourseFeedback(courseId);
        setFeedback(courseFeedback);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (feedbackItem: WeekFeedback) => {
    setSelectedFeedback(feedbackItem);
    setShowDetailDialog(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'too_easy': return 'success';
      case 'just_right': return 'primary';
      case 'too_hard': return 'error';
      default: return 'default';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'too_easy': return 'Too Easy';
      case 'just_right': return 'Just Right';
      case 'too_hard': return 'Too Hard';
      default: return difficulty;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading feedback...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/admin')}
          variant="outlined"
        >
          Back to Admin
        </Button>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Feedback color="primary" />
          Student Feedback Dashboard
        </Typography>
      </Box>

      {courseId && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filter by Week
            </Typography>
            <FormControl fullWidth sx={{ maxWidth: 300 }}>
              <InputLabel>Select Week</InputLabel>
              <Select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                label="Select Week"
              >
                <MenuItem value="">
                  <em>All Weeks</em>
                </MenuItem>
                {/* You would populate this with actual weeks from the course */}
                <MenuItem value="week1">Week 1: Introduction</MenuItem>
                <MenuItem value="week2">Week 2: Fundamentals</MenuItem>
                <MenuItem value="week3">Week 3: Advanced Topics</MenuItem>
              </Select>
            </FormControl>
          </CardContent>
        </Card>
      )}

      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Overall Stats */}
          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <People sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {stats.totalFeedback}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Responses
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <Star sx={{ fontSize: 40, color: '#ffd700', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {stats.averageRating.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Average Rating
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {Math.round(stats.recommendationRate)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Recommendation Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ textAlign: 'center' }}>
              <CardContent>
                <School sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" color="primary">
                  {stats.averageContentQuality.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Content Quality
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs for different views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="All Feedback" />
          <Tab label="Statistics" />
          <Tab label="Challenges" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student</TableCell>
                <TableCell>Overall Rating</TableCell>
                <TableCell>Content Quality</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Recommendation</TableCell>
                <TableCell>Comments</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedback.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      Student {index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={item.overallRating} readOnly size="small" />
                      <Typography variant="body2">{item.overallRating}/5</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Rating value={item.contentQuality} readOnly size="small" />
                      <Typography variant="body2">{item.contentQuality}/5</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getDifficultyLabel(item.difficultyLevel)}
                      color={getDifficultyColor(item.difficultyLevel)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {item.wouldRecommend ? (
                      <Chip icon={<ThumbUp />} label="Yes" color="success" size="small" />
                    ) : (
                      <Chip icon={<ThumbDown />} label="No" color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ 
                      maxWidth: 200, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.comments || 'No comments'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewDetails(item)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {activeTab === 1 && stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Difficulty Distribution
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Too Easy</Typography>
                    <Typography variant="h6">{stats.difficultyDistribution.too_easy}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Just Right</Typography>
                    <Typography variant="h6">{stats.difficultyDistribution.just_right}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Too Hard</Typography>
                    <Typography variant="h6">{stats.difficultyDistribution.too_hard}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Average Ratings
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Overall</Typography>
                    <Rating value={stats.averageRating} readOnly />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Content Quality</Typography>
                    <Rating value={stats.averageContentQuality} readOnly />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Instructor</Typography>
                    <Rating value={stats.averageInstructorRating} readOnly />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">Materials</Typography>
                    <Rating value={stats.averageMaterialsRating} readOnly />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Common Challenges
                </Typography>
                <Stack spacing={1}>
                  {stats.commonChallenges.map((challenge, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{challenge.challenge}</Typography>
                      <Chip label={challenge.count} size="small" />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Favorite Aspects
                </Typography>
                <Stack spacing={1}>
                  {stats.commonFavorites.map((favorite, index) => (
                    <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">{favorite.aspect}</Typography>
                      <Chip label={favorite.count} size="small" color="primary" />
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Feedback Detail Dialog */}
      <Dialog
        open={showDetailDialog}
        onClose={() => setShowDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">Feedback Details</Typography>
        </DialogTitle>
        <DialogContent>
          {selectedFeedback && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>Overall Rating</Typography>
                <Rating value={selectedFeedback.overallRating} readOnly />
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Content Quality</Typography>
                <Rating value={selectedFeedback.contentQuality} readOnly />
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Difficulty Level</Typography>
                <Chip
                  label={getDifficultyLabel(selectedFeedback.difficultyLevel)}
                  color={getDifficultyColor(selectedFeedback.difficultyLevel)}
                />
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Comments</Typography>
                <Typography variant="body2">{selectedFeedback.comments}</Typography>
              </Box>

              {selectedFeedback.suggestions && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Suggestions</Typography>
                  <Typography variant="body2">{selectedFeedback.suggestions}</Typography>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle1" gutterBottom>Favorite Aspects</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedFeedback.favoriteAspects.map((aspect, index) => (
                    <Chip key={index} label={aspect} size="small" />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom>Challenges</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedFeedback.challenges.map((challenge, index) => (
                    <Chip key={index} label={challenge} size="small" color="error" />
                  ))}
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminFeedbackDashboard;

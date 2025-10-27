import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Star,
  ThumbUp,
  ThumbDown,
  School,
  Schedule,
  EmojiEvents,
  Feedback
} from '@mui/icons-material';

interface WeekEndFeedbackProps {
  open: boolean;
  onClose: () => void;
  weekTitle: string;
  courseTitle: string;
  onSubmit: (feedback: WeekFeedback) => Promise<void>;
}

export interface WeekFeedback {
  weekId: string;
  courseId: string;
  overallRating: number;
  contentQuality: number;
  difficultyLevel: 'too_easy' | 'just_right' | 'too_hard';
  paceRating: number;
  instructorRating: number;
  materialsRating: number;
  comments: string;
  suggestions: string;
  wouldRecommend: boolean;
  favoriteAspects: string[];
  challenges: string[];
  timeSpent: number;
  completedMaterials: number;
  totalMaterials: number;
}

const WeekEndFeedback: React.FC<WeekEndFeedbackProps> = ({
  open,
  onClose,
  weekTitle,
  courseTitle,
  onSubmit
}) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<WeekFeedback>({
    weekId: '',
    courseId: '',
    overallRating: 0,
    contentQuality: 0,
    difficultyLevel: 'just_right',
    paceRating: 0,
    instructorRating: 0,
    materialsRating: 0,
    comments: '',
    suggestions: '',
    wouldRecommend: false,
    favoriteAspects: [],
    challenges: [],
    timeSpent: 0,
    completedMaterials: 0,
    totalMaterials: 0
  });

  const favoriteAspectOptions = [
    'Clear explanations',
    'Practical examples',
    'Interactive content',
    'Video quality',
    'Documentation',
    'Pace of learning',
    'Instructor style',
    'Real-world applications',
    'Assessment quality',
    'Support materials'
  ];

  const challengeOptions = [
    'Too fast paced',
    'Too slow paced',
    'Unclear explanations',
    'Poor video quality',
    'Insufficient examples',
    'Technical difficulties',
    'Too much content',
    'Too little content',
    'Poor organization',
    'Lack of support'
  ];

  const handleRatingChange = (field: keyof WeekFeedback, value: number) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const handleTextChange = (field: keyof WeekFeedback, value: string) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (field: keyof WeekFeedback, value: any) => {
    setFeedback(prev => ({ ...prev, [field]: value }));
  };

  const handleAspectToggle = (aspect: string) => {
    setFeedback(prev => ({
      ...prev,
      favoriteAspects: prev.favoriteAspects.includes(aspect)
        ? prev.favoriteAspects.filter(a => a !== aspect)
        : [...prev.favoriteAspects, aspect]
    }));
  };

  const handleChallengeToggle = (challenge: string) => {
    setFeedback(prev => ({
      ...prev,
      challenges: prev.challenges.includes(challenge)
        ? prev.challenges.filter(c => c !== challenge)
        : [...prev.challenges, challenge]
    }));
  };

  const handleSubmit = async () => {
    if (feedback.overallRating === 0) {
      alert('Please provide an overall rating');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(feedback);
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = feedback.overallRating > 0 && feedback.comments.trim().length > 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <EmojiEvents sx={{ fontSize: 32 }} />
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Week Complete! 🎉
          </Typography>
        </Box>
        <Typography variant="subtitle1" sx={{ mt: 1, opacity: 0.9 }}>
          {courseTitle} - {weekTitle}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: 'text.primary', borderRadius: 2 }}>
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
          <Typography variant="body2">
            Your feedback helps us improve the course experience for everyone. Please take a moment to share your thoughts.
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          {/* Overall Rating */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Star color="primary" />
                  Overall Experience
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Rating
                    value={feedback.overallRating}
                    onChange={(_, value) => handleRatingChange('overallRating', value || 0)}
                    size="large"
                    sx={{ '& .MuiRating-iconFilled': { color: '#ffd700' } }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {feedback.overallRating > 0 ? `${feedback.overallRating}/5 stars` : 'Rate your experience'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Detailed Ratings */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Content Quality
                </Typography>
                <Rating
                  value={feedback.contentQuality}
                  onChange={(_, value) => handleRatingChange('contentQuality', value || 0)}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Instructor Rating
                </Typography>
                <Rating
                  value={feedback.instructorRating}
                  onChange={(_, value) => handleRatingChange('instructorRating', value || 0)}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Materials Quality
                </Typography>
                <Rating
                  value={feedback.materialsRating}
                  onChange={(_, value) => handleRatingChange('materialsRating', value || 0)}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Pace Rating
                </Typography>
                <Rating
                  value={feedback.paceRating}
                  onChange={(_, value) => handleRatingChange('paceRating', value || 0)}
                />
              </CardContent>
            </Card>
          </Grid>

          {/* Difficulty Level */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Difficulty Level
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={feedback.difficultyLevel}
                    onChange={(e) => handleSelectChange('difficultyLevel', e.target.value)}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="too_easy">Too Easy</MenuItem>
                    <MenuItem value="just_right">Just Right</MenuItem>
                    <MenuItem value="too_hard">Too Hard</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
          </Grid>

          {/* Favorite Aspects */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  What did you like most? (Select all that apply)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {favoriteAspectOptions.map((aspect) => (
                    <Chip
                      key={aspect}
                      label={aspect}
                      clickable
                      color={feedback.favoriteAspects.includes(aspect) ? 'primary' : 'default'}
                      onClick={() => handleAspectToggle(aspect)}
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Challenges */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  What challenges did you face? (Select all that apply)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {challengeOptions.map((challenge) => (
                    <Chip
                      key={challenge}
                      label={challenge}
                      clickable
                      color={feedback.challenges.includes(challenge) ? 'error' : 'default'}
                      onClick={() => handleChallengeToggle(challenge)}
                      sx={{ borderRadius: 2 }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Comments */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Additional Comments"
              placeholder="Share any additional thoughts about this week's content..."
              value={feedback.comments}
              onChange={(e) => handleTextChange('comments', e.target.value)}
              sx={{ borderRadius: 2 }}
              required
            />
          </Grid>

          {/* Suggestions */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Suggestions for Improvement"
              placeholder="How can we make this week better?"
              value={feedback.suggestions}
              onChange={(e) => handleTextChange('suggestions', e.target.value)}
              sx={{ borderRadius: 2 }}
            />
          </Grid>

          {/* Recommendation */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Would you recommend this week to other students?
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant={feedback.wouldRecommend ? 'contained' : 'outlined'}
                    startIcon={<ThumbUp />}
                    onClick={() => handleSelectChange('wouldRecommend', true)}
                    color="success"
                  >
                    Yes
                  </Button>
                  <Button
                    variant={!feedback.wouldRecommend ? 'contained' : 'outlined'}
                    startIcon={<ThumbDown />}
                    onClick={() => handleSelectChange('wouldRecommend', false)}
                    color="error"
                  >
                    No
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Skip Feedback
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isFormValid || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Feedback />}
          sx={{
            background: 'linear-gradient(45deg, #6366f1, #8b5cf6)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5b5bd6, #7c3aed)'
            }
          }}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WeekEndFeedback;

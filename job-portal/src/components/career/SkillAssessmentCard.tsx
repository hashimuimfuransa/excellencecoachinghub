import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Rating,
  FormControlLabel,
  Radio,
  RadioGroup,
  useTheme,
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Assessment,
  EmojiEvents,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { careerInsightService } from '../../services/careerInsightService';

interface SkillAssessmentCardProps {
  skills: Array<{
    skill: string;
    level: number;
    yearsOfExperience?: number;
  }>;
  overallScore: number;
  onSkillUpdate?: () => void;
}

const SkillAssessmentCard: React.FC<SkillAssessmentCardProps> = ({
  skills,
  overallScore,
  onSkillUpdate,
}) => {
  const theme = useTheme();
  const [quizOpen, setQuizOpen] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string | number }>({});
  const [submitting, setSubmitting] = useState(false);

  const quizzes = careerInsightService.getSkillQuizzes();

  const startQuiz = (quiz: any) => {
    setCurrentQuiz(quiz);
    setCurrentQuestion(0);
    setAnswers({});
    setQuizOpen(true);
  };

  const handleAnswer = (questionId: number, answer: string | number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const nextQuestion = () => {
    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setSubmitting(true);
    try {
      const score = careerInsightService.calculateQuizScore(currentQuiz.id, answers);
      await careerInsightService.submitQuiz({
        quizType: currentQuiz.title,
        answers,
        score,
      });
      
      setQuizOpen(false);
      onSkillUpdate?.();
    } catch (error) {
      console.error('Error submitting quiz:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getSkillColor = (level: number) => {
    if (level >= 4) return theme.palette.success.main;
    if (level >= 3) return theme.palette.info.main;
    if (level >= 2) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <>
      <Card
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        sx={{
          borderRadius: 2,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Assessment color="primary" sx={{ mr: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Skills Assessment
            </Typography>
          </Box>

          {/* Overall Score */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Overall Score
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: getScoreColor(overallScore)
                }}
              >
                {overallScore}/100
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={overallScore}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getScoreColor(overallScore),
                  borderRadius: 4,
                },
              }}
            />
          </Box>

          {/* Top Skills */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
              Top Skills
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {skills.slice(0, 6).map((skill, index) => (
                <Chip
                  key={index}
                  label={`${skill.skill} (${skill.level}/5)`}
                  size="small"
                  sx={{
                    backgroundColor: `${getSkillColor(skill.level)}20`,
                    color: getSkillColor(skill.level),
                    border: `1px solid ${getSkillColor(skill.level)}`,
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Quick Assessments */}
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
              Take Quick Assessments
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {quizzes.map((quiz) => (
                <Button
                  key={quiz.id}
                  variant="outlined"
                  size="small"
                  startIcon={<Psychology />}
                  onClick={() => startQuiz(quiz)}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                  }}
                >
                  {quiz.title} ({quiz.duration}min)
                </Button>
              ))}
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Quiz Dialog */}
      <Dialog
        open={quizOpen}
        onClose={() => setQuizOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        {currentQuiz && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Psychology color="primary" />
                <Box>
                  <Typography variant="h6">
                    {currentQuiz.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Question {currentQuestion + 1} of {currentQuiz.questions.length}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>

            <DialogContent>
              <LinearProgress
                variant="determinate"
                value={((currentQuestion + 1) / currentQuiz.questions.length) * 100}
                sx={{ mb: 3, borderRadius: 2 }}
              />

              {currentQuiz.questions[currentQuestion] && (
                <Box>
                  <Typography variant="h6" sx={{ mb: 3 }}>
                    {currentQuiz.questions[currentQuestion].question}
                  </Typography>

                  {currentQuiz.questions[currentQuestion].type === 'scale' && (
                    <Box sx={{ textAlign: 'center' }}>
                      <Rating
                        size="large"
                        max={5}
                        value={answers[currentQuiz.questions[currentQuestion].id] as number || 0}
                        onChange={(event, value) => 
                          handleAnswer(currentQuiz.questions[currentQuestion].id, value || 0)
                        }
                      />
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                        {currentQuiz.questions[currentQuestion].scale.labels.map((label: string, index: number) => (
                          <Typography 
                            key={index} 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ fontSize: '0.7rem' }}
                          >
                            {label}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {currentQuiz.questions[currentQuestion].type === 'multiple-choice' && (
                    <RadioGroup
                      value={answers[currentQuiz.questions[currentQuestion].id] || ''}
                      onChange={(e) => 
                        handleAnswer(currentQuiz.questions[currentQuestion].id, e.target.value)
                      }
                    >
                      {currentQuiz.questions[currentQuestion].options.map((option: string, index: number) => (
                        <FormControlLabel
                          key={index}
                          value={option}
                          control={<Radio />}
                          label={option}
                          sx={{ mb: 1 }}
                        />
                      ))}
                    </RadioGroup>
                  )}
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 3 }}>
              <Button
                onClick={() => setQuizOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={nextQuestion}
                disabled={
                  !answers[currentQuiz.questions[currentQuestion]?.id] || submitting
                }
                sx={{
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                }}
              >
                {submitting 
                  ? 'Submitting...' 
                  : currentQuestion < currentQuiz.questions.length - 1 
                    ? 'Next' 
                    : 'Submit'
                }
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default SkillAssessmentCard;
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  LinearProgress,
  Chip,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  PlayArrow as StartIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Assessment as TestIcon
} from '@mui/icons-material';

interface CareerAssessmentCardProps {
  hasCompletedTest: boolean;
  onStartTest: () => void;
  testProgress?: number;
  estimatedDuration?: string;
  completedDate?: Date;
}

const CareerAssessmentCard: React.FC<CareerAssessmentCardProps> = ({
  hasCompletedTest,
  onStartTest,
  testProgress = 0,
  estimatedDuration = '25-30 minutes',
  completedDate
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        background: hasCompletedTest
          ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`
          : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        border: `1px solid ${alpha(hasCompletedTest ? theme.palette.success.main : theme.palette.primary.main, 0.2)}`,
        borderRadius: 2,
        boxShadow: theme.shadows[3],
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[8],
        }
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          {hasCompletedTest ? (
            <CompleteIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
          ) : (
            <PsychologyIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          )}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
              Career Discovery Assessment
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                icon={<ScheduleIcon />}
                label={estimatedDuration} 
                size="small" 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                icon={<TestIcon />}
                label="~60 Questions" 
                size="small" 
                color="secondary" 
                variant="outlined" 
              />
            </Box>
          </Box>
          {hasCompletedTest && (
            <Chip 
              label="Completed" 
              color="success" 
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {/* Description */}
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
          {hasCompletedTest 
            ? "Great job! You've completed your career assessment. Your personalized career profile and recommendations are ready."
            : "Discover your ideal career path through our comprehensive assessment that analyzes your personality, interests, skills, and values."
          }
        </Typography>

        {/* Progress or Status */}
        {!hasCompletedTest && testProgress > 0 ? (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Assessment Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {testProgress}% Complete
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={testProgress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        ) : hasCompletedTest && completedDate ? (
          <Box sx={{ 
            p: 2, 
            bgcolor: alpha(theme.palette.success.main, 0.1), 
            borderRadius: 1, 
            mb: 3,
            border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`
          }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark', mb: 1 }}>
              Assessment Completed
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed on {completedDate.toLocaleDateString()}
            </Typography>
          </Box>
        ) : null}

        {/* Benefits List */}
        {!hasCompletedTest && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'primary.main' }}>
              What You'll Get:
            </Typography>
            <Stack spacing={1}>
              {[
                'Personality analysis and career matches',
                'Skills assessment and gap analysis', 
                'Personalized learning roadmap',
                'Job recommendations and insights'
              ].map((benefit, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ 
                    width: 6, 
                    height: 6, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.main',
                    mr: 2 
                  }} />
                  <Typography variant="body2" color="text.secondary">
                    {benefit}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
          {hasCompletedTest ? (
            <>
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard/student/career')}
                sx={{ 
                  px: 3, 
                  py: 1.5, 
                  borderRadius: 2,
                  background: `linear-gradient(45deg, ${theme.palette.success.main} 30%, ${theme.palette.success.dark} 90%)`,
                  '&:hover': {
                    background: `linear-gradient(45deg, ${theme.palette.success.dark} 30%, ${theme.palette.success.main} 90%)`,
                  }
                }}
              >
                View Results & Recommendations
              </Button>
              <Button
                variant="outlined"
                onClick={onStartTest}
                sx={{ px: 3, py: 1.5, borderRadius: 2 }}
              >
                Retake Assessment
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={onStartTest}
              startIcon={<StartIcon />}
              sx={{ 
                px: 4, 
                py: 1.5, 
                borderRadius: 2,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
                boxShadow: `0 3px 5px 2px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 6px 10px 4px ${alpha(theme.palette.primary.main, 0.3)}`,
                }
              }}
            >
              {testProgress > 0 ? 'Continue Assessment' : 'Start Career Test'}
            </Button>
          )}
        </Stack>

        {/* Disclaimer */}
        {!hasCompletedTest && (
          <Typography 
            variant="caption" 
            color="text.secondary" 
            sx={{ 
              display: 'block', 
              mt: 2, 
              fontStyle: 'italic',
              textAlign: 'center'
            }}
          >
            💡 Your responses are confidential and used only to provide personalized career guidance
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default CareerAssessmentCard;
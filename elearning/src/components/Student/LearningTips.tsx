import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Collapse,
  Stack,
  Chip,
  useTheme,
  alpha,
  styled
} from '@mui/material';
import {
  Lightbulb,
  ExpandMore,
  ExpandLess,
  School,
  Timer,
  EmojiEvents,
  Psychology,
  TrendingUp
} from '@mui/icons-material';

const TipsCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)}, ${alpha(theme.palette.primary.main, 0.05)})`,
  border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
  borderRadius: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const TipItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: theme.spacing(2),
  padding: theme.spacing(1.5),
  borderRadius: theme.spacing(1),
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
  },
}));

const LearningTips: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const theme = useTheme();

  const tips = [
    {
      icon: <Timer sx={{ color: 'success.main' }} />,
      title: "Set a Learning Schedule",
      description: "Dedicate 15-30 minutes daily for consistent progress. Small steps lead to big achievements!"
    },
    {
      icon: <School sx={{ color: 'primary.main' }} />,
      title: "Take Notes While Learning",
      description: "Write down key points and concepts. This helps reinforce your learning and creates a reference for later."
    },
    {
      icon: <EmojiEvents sx={{ color: 'warning.main' }} />,
      title: "Complete Assignments",
      description: "Practice makes perfect! Complete all exercises and quizzes to solidify your understanding."
    },
    {
      icon: <Psychology sx={{ color: 'secondary.main' }} />,
      title: "Ask Questions",
      description: "Don't hesitate to reach out to instructors or use the AI assistant when you need help."
    },
    {
      icon: <TrendingUp sx={{ color: 'info.main' }} />,
      title: "Track Your Progress",
      description: "Celebrate small wins! Check your progress regularly to stay motivated on your learning journey."
    }
  ];

  return (
    <TipsCard>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={1}>
            <Lightbulb sx={{ color: 'warning.main', fontSize: 28 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
              💡 Learning Tips for Success
            </Typography>
            <Chip 
              label="New Learner?" 
              size="small" 
              color="info" 
              variant="outlined"
            />
          </Stack>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Stack>

        <Collapse in={expanded}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              🌟 Here are some helpful tips to make the most of your learning experience:
            </Typography>
            
            <Stack spacing={1}>
              {tips.map((tip, index) => (
                <TipItem key={index}>
                  <Box sx={{ mt: 0.5 }}>
                    {tip.icon}
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {tip.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {tip.description}
                    </Typography>
                  </Box>
                </TipItem>
              ))}
            </Stack>

            <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.success.main, 0.1), borderRadius: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main', textAlign: 'center' }}>
                🎯 Remember: Learning is a journey, not a race. Take your time and enjoy the process!
              </Typography>
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </TipsCard>
  );
};

export default LearningTips;
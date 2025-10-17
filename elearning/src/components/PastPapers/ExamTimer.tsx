import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip,
  useTheme
} from '@mui/material';
import { Timer } from '@mui/icons-material';

interface ExamTimerProps {
  timeRemaining: number; // in seconds
  onTimeUp: () => void;
}

const ExamTimer: React.FC<ExamTimerProps> = ({ timeRemaining, onTimeUp }) => {
  const theme = useTheme();
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (timeRemaining <= 0) {
      onTimeUp();
      return;
    }

    // Set warning states
    const totalTime = timeRemaining; // This should be the original total time
    const warningThreshold = totalTime * 0.2; // 20% of total time
    const criticalThreshold = totalTime * 0.1; // 10% of total time

    setIsWarning(timeRemaining <= warningThreshold && timeRemaining > criticalThreshold);
    setIsCritical(timeRemaining <= criticalThreshold);
  }, [timeRemaining, onTimeUp]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    if (isCritical) return 'error';
    if (isWarning) return 'warning';
    return 'primary';
  };

  const getTextColor = () => {
    if (isCritical) return 'error.main';
    if (isWarning) return 'warning.main';
    return 'text.primary';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 200 }}>
      <Timer 
        sx={{ 
          color: getTextColor(),
          fontSize: 24
        }} 
      />
      
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="h6"
          sx={{
            color: getTextColor(),
            fontWeight: 'bold',
            fontFamily: 'monospace',
            fontSize: isCritical ? '1.2rem' : '1rem'
          }}
        >
          {formatTime(timeRemaining)}
        </Typography>
        
        <LinearProgress
          variant="determinate"
          value={(timeRemaining / (timeRemaining + 0)) * 100} // This needs the original total time
          color={getProgressColor() as any}
          sx={{
            height: 4,
            borderRadius: 2,
            mt: 0.5
          }}
        />
      </Box>

      {isCritical && (
        <Chip
          label="Time Critical!"
          color="error"
          size="small"
          sx={{ animation: 'pulse 1s infinite' }}
        />
      )}
    </Box>
  );
};

export default ExamTimer;

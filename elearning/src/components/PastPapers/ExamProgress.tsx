import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Chip
} from '@mui/material';
import { Quiz, CheckCircle, Flag } from '@mui/icons-material';

interface ExamProgressProps {
  current: number;
  total: number;
  answered: number;
  flagged: number;
}

const ExamProgress: React.FC<ExamProgressProps> = ({
  current,
  total,
  answered,
  flagged
}) => {
  const progress = (answered / total) * 100;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 300 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Quiz color="primary" />
        <Typography variant="body2" color="text.secondary">
          {current} / {total}
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            Progress
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
        
        <LinearProgress
          variant="determinate"
          value={progress}
          color="primary"
          sx={{
            height: 6,
            borderRadius: 3
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Chip
          icon={<CheckCircle />}
          label={answered}
          color="success"
          size="small"
          variant="outlined"
        />
        
        {flagged > 0 && (
          <Chip
            icon={<Flag />}
            label={flagged}
            color="warning"
            size="small"
            variant="outlined"
          />
        )}
      </Box>
    </Box>
  );
};

export default ExamProgress;

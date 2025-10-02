/**
 * Minimal Desktop Interview Interface for testing
 */

import React from 'react';
import { Box, Typography } from '@mui/material';
import { QuickInterviewSession, QuickInterviewResult } from '../services/quickInterviewService';

interface DesktopInterviewInterfaceProps {
  open: boolean;
  onClose: () => void;
  session: QuickInterviewSession;
  onComplete: (result: QuickInterviewResult) => void;
}

const DesktopInterviewInterface: React.FC<DesktopInterviewInterfaceProps> = ({
  open,
  onClose,
  session,
  onComplete
}) => {
  if (!open) return null;

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4">
        Desktop Interview Interface Test
      </Typography>
      <Typography variant="body1">
        Session: {session.jobTitle}
      </Typography>
    </Box>
  );
};

export default DesktopInterviewInterface;




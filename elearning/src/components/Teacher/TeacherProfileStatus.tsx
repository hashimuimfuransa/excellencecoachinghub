import React from 'react';
import { Card, CardContent, Typography, Box, Chip, LinearProgress } from '@mui/material';
import { CheckCircle, PendingActions, Warning, Cancel } from '@mui/icons-material';

interface TeacherProfileStatusProps {
  status: 'incomplete' | 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  completionPercentage?: number;
}

const TeacherProfileStatus: React.FC<TeacherProfileStatusProps> = ({
  status,
  rejectionReason,
  completionPercentage = 0
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'incomplete':
        return {
          icon: <Warning color="warning" sx={{ fontSize: 40 }} />,
          title: 'Profile Incomplete',
          description: 'Your teacher profile needs to be completed before you can start creating courses.',
          color: 'warning' as const,
          chipColor: 'warning' as const
        };
      case 'pending':
        return {
          icon: <PendingActions color="info" sx={{ fontSize: 40 }} />,
          title: 'Profile Under Review',
          description: 'Your teacher profile has been submitted and is currently under review by our admin team.',
          color: 'info' as const,
          chipColor: 'info' as const
        };
      case 'approved':
        return {
          icon: <CheckCircle color="success" sx={{ fontSize: 40 }} />,
          title: 'Profile Approved',
          description: 'Congratulations! Your teacher profile has been approved. You can now start creating courses.',
          color: 'success' as const,
          chipColor: 'success' as const
        };
      case 'rejected':
        return {
          icon: <Cancel color="error" sx={{ fontSize: 40 }} />,
          title: 'Profile Rejected',
          description: rejectionReason 
            ? `Your profile was rejected: ${rejectionReason}` 
            : 'Your teacher profile was rejected. Please review and update your information.',
          color: 'error' as const,
          chipColor: 'error' as const
        };
      default:
        return {
          icon: <Warning color="warning" sx={{ fontSize: 40 }} />,
          title: 'Profile Status Unknown',
          description: 'Unable to determine your profile status.',
          color: 'warning' as const,
          chipColor: 'warning' as const
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card sx={{ mb: 3, boxShadow: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          {config.icon}
          <Box ml={2} flexGrow={1}>
            <Typography variant="h5" component="h1" gutterBottom>
              {config.title}
            </Typography>
            <Chip 
              label={status.toUpperCase()} 
              color={config.chipColor} 
              size="small"
              sx={{ mb: 1 }}
            />
          </Box>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {config.description}
        </Typography>

        {status === 'incomplete' && completionPercentage > 0 && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Profile Completion: {completionPercentage}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={completionPercentage} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TeacherProfileStatus;

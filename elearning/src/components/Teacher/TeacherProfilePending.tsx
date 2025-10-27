import React from 'react';
import { Card, CardContent, Typography, Box, Chip, Alert } from '@mui/material';
import { 
  PendingActions, 
  Schedule, 
  CheckCircle, 
  Email,
  Refresh
} from '@mui/icons-material';

interface TeacherProfilePendingProps {
  submittedAt?: string | Date;
  estimatedReviewTime?: string;
}

const TeacherProfilePending: React.FC<TeacherProfilePendingProps> = ({
  submittedAt,
  estimatedReviewTime = '1-2 business days'
}) => {
  const formatDate = (date: string | Date) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getDaysSinceSubmission = () => {
    if (!submittedAt) return 0;
    
    try {
      const now = new Date();
      const submittedDate = typeof submittedAt === 'string' ? new Date(submittedAt) : submittedAt;
      
      // Check if the date is valid
      if (isNaN(submittedDate.getTime())) {
        return 0;
      }
      
      const diffTime = Math.abs(now.getTime() - submittedDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Error calculating days since submission:', error);
      return 0;
    }
  };

  const daysSinceSubmission = getDaysSinceSubmission();

  return (
    <Card sx={{ mb: 3, boxShadow: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <PendingActions color="info" sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h6" component="h2">
              Profile Under Review
            </Typography>
            <Chip 
              label="PENDING APPROVAL" 
              color="info" 
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            Your teacher profile has been submitted and is currently under review by our admin team.
          </Typography>
        </Alert>

        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Review Timeline:
          </Typography>
          <Box display="flex" alignItems="center" mb={1}>
            <Schedule sx={{ mr: 1, fontSize: 20 }} />
            <Typography variant="body2">
              Estimated review time: {estimatedReviewTime}
            </Typography>
          </Box>
          
          {submittedAt && (
            <Box display="flex" alignItems="center" mb={1}>
              <CheckCircle sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                Submitted on: {formatDate(submittedAt)}
              </Typography>
            </Box>
          )}
          
          {daysSinceSubmission > 0 && (
            <Box display="flex" alignItems="center">
              <Refresh sx={{ mr: 1, fontSize: 20 }} />
              <Typography variant="body2">
                Days since submission: {daysSinceSubmission}
              </Typography>
            </Box>
          )}
        </Box>

        <Box>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            What happens next?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Our admin team will review your profile to ensure it meets our quality standards. 
            You'll receive an email notification once the review is complete.
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            If approved, you'll be able to access the teacher dashboard and start creating courses. 
            If additional information is needed, we'll contact you with specific requirements.
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TeacherProfilePending;

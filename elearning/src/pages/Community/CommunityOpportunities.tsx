import React from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  Stack,
  Chip 
} from '@mui/material';
import { Work, OpenInNew } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const CommunityOpportunities: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoToOpportunities = () => {
    navigate('/dashboard/student/opportunities');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
        Career Opportunities
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Discover job opportunities aligned with your completed courses and skills.
      </Typography>

      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Work color="primary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                View Full Opportunities Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Access detailed job listings from ExJobNet matched to your learning profile
              </Typography>
            </Box>
          </Stack>
          
          <Button
            variant="contained"
            startIcon={<OpenInNew />}
            onClick={handleGoToOpportunities}
            size="large"
          >
            Go to Opportunities
          </Button>
          
          <Box sx={{ mt: 2 }}>
            <Chip 
              label="Requirements: 40%+ profile completion • Age 18+" 
              color="secondary" 
              variant="outlined" 
              size="small"
            />
          </Box>
        </CardContent>
      </Card>

      {user?.role !== 'student' && (
        <Card sx={{ backgroundColor: 'info.light', borderRadius: 2 }}>
          <CardContent>
            <Typography color="info.contrastText">
              Opportunities are available for students only.
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default CommunityOpportunities;

import React from 'react';
import { Card, CardContent, Typography, Button, Box, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { 
  Person, 
  Edit, 
  School, 
  CheckCircle, 
  ArrowForward,
  Description,
  Work,
  Language,
  AttachMoney
} from '@mui/icons-material';

interface TeacherProfileActionProps {
  status: 'incomplete' | 'pending' | 'approved' | 'rejected';
  onCompleteProfile: () => void;
  onEditProfile: () => void;
  onGoToDashboard: () => void;
}

const TeacherProfileAction: React.FC<TeacherProfileActionProps> = ({
  status,
  onCompleteProfile,
  onEditProfile,
  onGoToDashboard
}) => {
  const getActionConfig = () => {
    switch (status) {
      case 'incomplete':
        return {
          title: 'Complete Your Teacher Profile',
          description: 'To start creating courses, you need to complete your teacher profile with the following information:',
          primaryAction: {
            text: 'Complete Profile',
            onClick: onCompleteProfile,
            color: 'primary' as const,
            variant: 'contained' as const
          },
          secondaryAction: null
        };
      case 'pending':
        return {
          title: 'Profile Under Review',
          description: 'Your profile is currently being reviewed by our admin team. This process usually takes 1-2 business days.',
          primaryAction: {
            text: 'View Profile',
            onClick: onEditProfile,
            color: 'primary' as const,
            variant: 'outlined' as const
          },
          secondaryAction: null
        };
      case 'approved':
        return {
          title: 'Ready to Start Teaching!',
          description: 'Your profile has been approved. You can now access the teacher dashboard and start creating courses.',
          primaryAction: {
            text: 'Go to Dashboard',
            onClick: onGoToDashboard,
            color: 'success' as const,
            variant: 'contained' as const
          },
          secondaryAction: {
            text: 'Edit Profile',
            onClick: onEditProfile,
            color: 'primary' as const,
            variant: 'outlined' as const
          }
        };
      case 'rejected':
        return {
          title: 'Profile Needs Updates',
          description: 'Your profile was rejected and needs to be updated. Please review the feedback and make necessary changes.',
          primaryAction: {
            text: 'Update Profile',
            onClick: onEditProfile,
            color: 'primary' as const,
            variant: 'contained' as const
          },
          secondaryAction: null
        };
      default:
        return {
          title: 'Profile Action Required',
          description: 'Please complete your teacher profile to continue.',
          primaryAction: {
            text: 'Complete Profile',
            onClick: onCompleteProfile,
            color: 'primary' as const,
            variant: 'contained' as const
          },
          secondaryAction: null
        };
    }
  };

  const config = getActionConfig();

  const requiredFields = [
    { icon: <Person />, text: 'Personal Information & Contact Details' },
    { icon: <School />, text: 'Education & Qualifications' },
    { icon: <Work />, text: 'Teaching Experience' },
    { icon: <Description />, text: 'Professional Bio & Specializations' },
    { icon: <Language />, text: 'Languages & Skills' },
    { icon: <AttachMoney />, text: 'Pricing & Availability' }
  ];

  return (
    <Card sx={{ boxShadow: 2 }}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          {config.title}
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {config.description}
        </Typography>

        {status === 'incomplete' && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Required Information:
            </Typography>
            <List dense>
              {requiredFields.map((field, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {field.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={field.text}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        <Box display="flex" gap={2} flexWrap="wrap">
          <Button
            variant={config.primaryAction.variant}
            color={config.primaryAction.color}
            size="large"
            onClick={config.primaryAction.onClick}
            endIcon={<ArrowForward />}
            sx={{ minWidth: 160 }}
          >
            {config.primaryAction.text}
          </Button>
          
          {config.secondaryAction && (
            <Button
              variant={config.secondaryAction.variant}
              color={config.secondaryAction.color}
              size="large"
              onClick={config.secondaryAction.onClick}
              sx={{ minWidth: 160 }}
            >
              {config.secondaryAction.text}
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TeacherProfileAction;

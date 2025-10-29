import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
  Box,
  Avatar,
  CircularProgress
} from '@mui/material';
import { School, Person, Work } from '@mui/icons-material';
import { UserRole } from '../../shared/types';

interface GoogleUserData {
  email: string;
  firstName: string;
  lastName: string;
  googleId: string;
  profilePicture: string;
  verified: boolean;
}

interface RoleSelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (role: UserRole) => void;
  googleUserData: GoogleUserData;
  isLoading?: boolean;
}

const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  open,
  onClose,
  onSubmit,
  googleUserData,
  isLoading = false
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.STUDENT);

  const handleSubmit = () => {
    onSubmit(selectedRole);
  };

  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedRole(event.target.value as UserRole);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={isLoading}
    >
      <DialogTitle>
        <Typography variant="h6" align="center" component="div">
          Welcome to Excellence Coaching Hub
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Avatar
            src={googleUserData.profilePicture}
            sx={{ width: 80, height: 80, mb: 2 }}
          >
            {googleUserData.firstName.charAt(0)}
          </Avatar>
          <Typography variant="h6">
            {googleUserData.firstName} {googleUserData.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {googleUserData.email}
          </Typography>
        </Box>

        <Typography variant="body1" gutterBottom align="center" mb={3}>
          To complete your registration, please select your role:
        </Typography>

        <FormControl component="fieldset" fullWidth>
          <RadioGroup
            value={selectedRole}
            onChange={handleRoleChange}
            name="role-selection"
          >
            <Box 
              sx={{
                border: selectedRole === UserRole.STUDENT ? '2px solid #1976d2' : '1px solid #e0e0e0',
                borderRadius: 2,
                p: 2,
                mb: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
              onClick={() => setSelectedRole(UserRole.STUDENT)}
            >
              <FormControlLabel
                value={UserRole.STUDENT}
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <School color={selectedRole === UserRole.STUDENT ? 'primary' : 'action'} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Student
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        I want to learn and take courses
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ margin: 0, width: '100%' }}
              />
            </Box>

            <Box 
              sx={{
                border: selectedRole === UserRole.PROFESSIONAL ? '2px solid #1976d2' : '1px solid #e0e0e0',
                borderRadius: 2,
                p: 2,
                mb: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
              onClick={() => setSelectedRole(UserRole.PROFESSIONAL)}
            >
              <FormControlLabel
                value={UserRole.PROFESSIONAL}
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Work color={selectedRole === UserRole.PROFESSIONAL ? 'primary' : 'action'} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Job Seeker
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        I want to enhance my skills for career opportunities
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ margin: 0, width: '100%' }}
              />
            </Box>

            <Box 
              sx={{
                border: selectedRole === UserRole.TEACHER ? '2px solid #1976d2' : '1px solid #e0e0e0',
                borderRadius: 2,
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  backgroundColor: '#f5f5f5'
                }
              }}
              onClick={() => setSelectedRole(UserRole.TEACHER)}
            >
              <FormControlLabel
                value={UserRole.TEACHER}
                control={<Radio />}
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person color={selectedRole === UserRole.TEACHER ? 'primary' : 'action'} />
                    <Box>
                      <Typography variant="subtitle1" fontWeight="medium">
                        Teacher
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        I want to teach and create courses
                      </Typography>
                    </Box>
                  </Box>
                }
                sx={{ margin: 0, width: '100%' }}
              />
            </Box>
          </RadioGroup>
        </FormControl>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          disabled={isLoading}
          color="inherit"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading && <CircularProgress size={20} />}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? 'Creating...' : 'Complete Registration'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RoleSelectionModal;
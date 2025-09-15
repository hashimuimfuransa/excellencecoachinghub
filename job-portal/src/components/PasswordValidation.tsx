import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';

interface PasswordValidationProps {
  password: string;
  show?: boolean;
}

interface ValidationRule {
  label: string;
  test: (password: string) => boolean;
  isValid: boolean;
}

const PasswordValidation: React.FC<PasswordValidationProps> = ({ password, show = true }) => {
  if (!show || !password) return null;

  const rules: ValidationRule[] = [
    {
      label: 'At least 8 characters',
      test: (pwd: string) => pwd.length >= 8,
      isValid: password.length >= 8
    },
    {
      label: 'Contains letters',
      test: (pwd: string) => /[a-zA-Z]/.test(pwd),
      isValid: /[a-zA-Z]/.test(password)
    },
    {
      label: 'Contains numbers',
      test: (pwd: string) => /\d/.test(pwd),
      isValid: /\d/.test(password)
    },
    {
      label: 'Contains special characters',
      test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      isValid: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
  ];

  const getPasswordStrength = () => {
    const validRules = rules.filter(rule => rule.isValid).length;
    if (validRules === 4) return { label: 'Very Strong', color: '#4CAF50' };
    if (validRules === 3) return { label: 'Strong', color: '#8BC34A' };
    if (validRules === 2) return { label: 'Medium', color: '#FF9800' };
    if (validRules === 1) return { label: 'Weak', color: '#F44336' };
    return { label: 'Very Weak', color: '#D32F2F' };
  };

  const strength = getPasswordStrength();

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
        Password Strength: <span style={{ color: strength.color }}>{strength.label}</span>
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {rules.map((rule, index) => (
          <Chip
            key={index}
            size="small"
            icon={rule.isValid ? 
              <CheckCircle sx={{ fontSize: 16, color: '#4CAF50' }} /> : 
              <Cancel sx={{ fontSize: 16, color: '#F44336' }} />
            }
            label={rule.label}
            variant="outlined"
            sx={{
              fontSize: '0.75rem',
              height: 24,
              color: rule.isValid ? '#4CAF50' : '#F44336',
              borderColor: rule.isValid ? '#4CAF50' : '#F44336',
              backgroundColor: rule.isValid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
              '& .MuiChip-icon': {
                marginLeft: '4px',
                marginRight: '-2px'
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export const getPasswordValidationErrors = (password: string): string[] => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain letters (A-Z, a-z)');
  }
  if (!/\d/.test(password)) {
    errors.push('Password must contain numbers (0-9)');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password should contain special characters (!@#$%^&*)');
  }

  return errors;
};

export const getPasswordStrengthScore = (password: string): number => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 10;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 20;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 15;
  
  return Math.min(score, 100);
};

export default PasswordValidation;
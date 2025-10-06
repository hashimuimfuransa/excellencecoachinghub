import React from 'react';
import { Box, Typography, Chip, useMediaQuery, useTheme } from '@mui/material';
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

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const rules: ValidationRule[] = [
    {
      label: 'At least 8 characters',
      test: (pwd: string) => pwd.length >= 8,
      isValid: password.length >= 8
    },
    {
      label: 'Contains lowercase letters',
      test: (pwd: string) => /[a-z]/.test(pwd),
      isValid: /[a-z]/.test(password)
    },
    {
      label: 'Contains uppercase letters',
      test: (pwd: string) => /[A-Z]/.test(pwd),
      isValid: /[A-Z]/.test(password)
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
    if (validRules === 5) return { label: 'Very Strong', color: '#4CAF50' };
    if (validRules === 4) return { label: 'Strong', color: '#8BC34A' };
    if (validRules === 3) return { label: 'Medium', color: '#FF9800' };
    if (validRules === 2) return { label: 'Weak', color: '#F44336' };
    return { label: 'Very Weak', color: '#D32F2F' };
  };

  const strength = getPasswordStrength();

  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 1, 
          fontWeight: 500,
          fontSize: isMobile ? '0.8rem' : '0.875rem'
        }}
      >
        Password Strength: <span style={{ color: strength.color }}>{strength.label}</span>
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: isMobile ? 0.3 : 0.5,
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {rules.map((rule, index) => (
          <Chip
            key={index}
            size={isMobile ? "small" : "small"}
            icon={rule.isValid ? 
              <CheckCircle sx={{ fontSize: isMobile ? 14 : 16, color: '#4CAF50' }} /> : 
              <Cancel sx={{ fontSize: isMobile ? 14 : 16, color: '#F44336' }} />
            }
            label={rule.label}
            variant="outlined"
            sx={{
              fontSize: isMobile ? '0.7rem' : '0.75rem',
              height: isMobile ? 20 : 24,
              color: rule.isValid ? '#4CAF50' : '#F44336',
              borderColor: rule.isValid ? '#4CAF50' : '#F44336',
              backgroundColor: rule.isValid ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
              '& .MuiChip-icon': {
                marginLeft: '4px',
                marginRight: isMobile ? '-1px' : '-2px'
              },
              '& .MuiChip-label': {
                paddingLeft: isMobile ? '4px' : '6px',
                paddingRight: isMobile ? '4px' : '6px'
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

  // Minimum requirements - at least 3 out of 5 criteria must be met
  const criteria = [
    { name: 'length', met: password.length >= 8 },
    { name: 'lowercase', met: /[a-z]/.test(password) },
    { name: 'uppercase', met: /[A-Z]/.test(password) },
    { name: 'numbers', met: /\d/.test(password) },
    { name: 'special', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  const metCriteria = criteria.filter(c => c.met).length;
  
  // Only show errors if less than 3 criteria are met
  if (metCriteria < 3) {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain lowercase letters (a-z)');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain uppercase letters (A-Z)');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain numbers (0-9)');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password should contain special characters (!@#$%^&*)');
    }
    
    // Add helpful message for medium passwords
    if (metCriteria >= 2) {
      errors.push('💡 Tip: Add at least one more requirement to strengthen your password');
    }
  }

  return errors;
};

export const getPasswordStrengthScore = (password: string): number => {
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/\d/.test(password)) score += 20;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 20;
  
  return Math.min(score, 100);
};

// Helper function to check if password meets minimum requirements
export const isPasswordAcceptable = (password: string): boolean => {
  const criteria = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  ];
  
  const metCriteria = criteria.filter(Boolean).length;
  return metCriteria >= 3; // At least 3 out of 5 criteria must be met
};

export default PasswordValidation;
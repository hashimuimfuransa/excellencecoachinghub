import React, { memo, useCallback, useState } from 'react';
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  IconButton,
  Tooltip,
  Box,
  Typography,
} from '@mui/material';
import { 
  AutoAwesome,
  Clear,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useOptimizedInput } from '../../hooks/useOptimizedInput';

interface OptimizedTextFieldProps extends Omit<TextFieldProps, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  onAIHelp?: () => void;
  showCharacterCount?: boolean;
  enableClear?: boolean;
  debounceMs?: number;
  validatePattern?: RegExp;
  validateMessage?: string;
  smartPlaceholder?: boolean;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

const OptimizedTextField: React.FC<OptimizedTextFieldProps> = memo(({
  value,
  onChange,
  onAIHelp,
  showCharacterCount = false,
  enableClear = true,
  debounceMs = 150,
  validatePattern,
  validateMessage = 'Invalid format',
  smartPlaceholder = true,
  type = 'text',
  onKeyPress,
  ...textFieldProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | undefined>();

  const validateInput = useCallback((inputValue: string) => {
    if (validatePattern && inputValue && !validatePattern.test(inputValue)) {
      return validateMessage;
    }
    return undefined;
  }, [validatePattern, validateMessage]);

  const {
    displayValue,
    handleChange,
    handleBlur,
    isTyping,
    error: inputError
  } = useOptimizedInput(value, onChange, {
    debounceMs,
    maxLength: textFieldProps.maxLength,
    validateOnChange: false, // Disable inline validation to prevent conflicts
    trimWhitespace: type !== 'password'
  });

  // Enhanced validation
  const handleValidation = useCallback((inputValue: string) => {
    const error = validateInput(inputValue);
    setValidationError(error);
    return !error;
  }, [validateInput]);

  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    textFieldProps.onFocus?.(event);
  }, [textFieldProps]);

  const handleBlurWithValidation = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    handleValidation(displayValue);
    handleBlur(event);
    textFieldProps.onBlur?.(event);
  }, [handleBlur, handleValidation, displayValue, textFieldProps]);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Smart placeholder logic
  const getSmartPlaceholder = () => {
    if (!smartPlaceholder) return textFieldProps.placeholder;

    const label = textFieldProps.label?.toString().toLowerCase() || '';
    
    if (label.includes('email')) return 'your.email@example.com';
    if (label.includes('phone')) return '+1 (555) 123-4567';
    if (label.includes('website') || label.includes('url')) return 'https://www.example.com';
    if (label.includes('linkedin')) return 'https://linkedin.com/in/username';
    if (label.includes('github')) return 'https://github.com/username';
    if (label.includes('location') || label.includes('address')) return 'City, State, Country';
    if (label.includes('title') || label.includes('position')) return 'Senior Software Engineer';
    if (label.includes('company')) return 'Company Name Inc.';
    
    return textFieldProps.placeholder;
  };

  const hasError = !!(inputError || validationError || textFieldProps.error);
  const errorMessage = inputError || validationError || textFieldProps.helperText;

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        {...textFieldProps}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlurWithValidation}
        onKeyPress={onKeyPress}
        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
        placeholder={getSmartPlaceholder()}
        error={hasError}
        helperText={errorMessage}
        InputProps={{
          ...textFieldProps.InputProps,
          sx: {
            ...textFieldProps.InputProps?.sx,
            transition: 'all 0.2s ease-in-out',
            fontSize: { xs: '1rem', sm: '0.875rem' }, // Better mobile font size
            '& input': {
              padding: { xs: '12px 14px', sm: '16px 14px' }, // Mobile-friendly padding
            },
            '& .MuiOutlinedInput-root': {
              borderRadius: { xs: 2, sm: 1 }, // Rounded corners on mobile
            },
            ...(isTyping && {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: '2px',
              },
            }),
            ...(isFocused && {
              '& input': {
                caretColor: 'primary.main',
              },
            }),
          },
          endAdornment: (
            <InputAdornment position="end">
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {onAIHelp && (
                  <Tooltip title="AI Assist">
                    <IconButton
                      size="small"
                      onClick={onAIHelp}
                      color="secondary"
                      sx={{
                        opacity: isFocused ? 1 : 0.6,
                        transition: 'opacity 0.2s ease-in-out',
                        p: { xs: 0.3, sm: 0.5 }, // Smaller padding on mobile
                      }}
                    >
                      <AutoAwesome 
                        fontSize="small" 
                        sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}
                      />
                    </IconButton>
                  </Tooltip>
                )}
                
                {type === 'password' && (
                  <Tooltip title={showPassword ? "Hide Password" : "Show Password"}>
                    <IconButton
                      size="small"
                      onClick={togglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
                
                {enableClear && displayValue && isFocused && type !== 'password' && (
                  <Tooltip title="Clear">
                    <IconButton
                      size="small"
                      onClick={handleClear}
                      sx={{
                        opacity: 0.6,
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <Clear fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {textFieldProps.InputProps?.endAdornment}
            </InputAdornment>
          ),
        }}
      />

      {/* Character count and typing indicator */}
      {(showCharacterCount || isTyping) && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 0.5,
            px: 1,
            opacity: isFocused || isTyping ? 1 : 0.7,
            transition: 'opacity 0.2s ease-in-out',
          }}
        >
          {isTyping && (
            <Typography variant="caption" color="primary" sx={{ fontSize: '0.7rem' }}>
              Typing...
            </Typography>
          )}
          
          {showCharacterCount && textFieldProps.maxLength && (
            <Typography
              variant="caption"
              color={displayValue.length > (textFieldProps.maxLength * 0.9) ? 'warning.main' : 'textSecondary'}
              sx={{ ml: 'auto', fontSize: '0.7rem' }}
            >
              {displayValue.length}/{textFieldProps.maxLength}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
});

OptimizedTextField.displayName = 'OptimizedTextField';

export default OptimizedTextField;
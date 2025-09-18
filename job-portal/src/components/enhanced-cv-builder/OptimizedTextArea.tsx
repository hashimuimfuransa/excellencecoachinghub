import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import {
  TextField,
  TextFieldProps,
  Box,
  LinearProgress,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Fullscreen, FullscreenExit, AutoAwesome } from '@mui/icons-material';
import { useOptimizedInput } from '../../hooks/useOptimizedInput';

interface OptimizedTextAreaProps extends Omit<TextFieldProps, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  onAIHelp?: () => void;
  showCharacterCount?: boolean;
  autoGrow?: boolean;
  enableFullscreen?: boolean;
  debounceMs?: number;
  maxRows?: number;
  minRows?: number;
}

const OptimizedTextArea: React.FC<OptimizedTextAreaProps> = memo(({
  value,
  onChange,
  onAIHelp,
  showCharacterCount = false,
  autoGrow = true,
  enableFullscreen = false,
  debounceMs = 200,
  maxRows = 10,
  minRows = 3,
  maxLength,
  ...textFieldProps
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const {
    displayValue,
    handleChange,
    handleBlur,
    isTyping,
    error
  } = useOptimizedInput(value, onChange, {
    debounceMs,
    maxLength,
    trimWhitespace: false
  });

  // Enhanced auto-resize functionality for mobile responsiveness
  useEffect(() => {
    if (autoGrow && textAreaRef.current) {
      const textarea = textAreaRef.current;
      
      // Reset height to auto to get accurate scroll height
      textarea.style.height = 'auto';
      textarea.style.overflowY = 'hidden';
      
      const scrollHeight = textarea.scrollHeight;
      const computedStyle = getComputedStyle(textarea);
      const lineHeight = parseInt(computedStyle.lineHeight, 10) || (isMobile ? 20 : 24);
      const paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
      const paddingBottom = parseInt(computedStyle.paddingBottom, 10) || 0;
      
      // Adjust min/max rows for mobile
      const mobileMinRows = isMobile ? Math.max(minRows, 4) : minRows;
      const mobileMaxRows = isMobile ? Math.max(maxRows, 15) : maxRows;
      
      const minHeight = (mobileMinRows * lineHeight) + paddingTop + paddingBottom;
      const maxHeight = (mobileMaxRows * lineHeight) + paddingTop + paddingBottom;
      const targetHeight = Math.max(Math.min(scrollHeight, maxHeight), minHeight);
      
      textarea.style.height = `${targetHeight}px`;
      
      // Enable scroll if content exceeds max height
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      }
    }
  }, [displayValue, autoGrow, maxRows, minRows, isMobile]);

  const handleFocus = useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    textFieldProps.onFocus?.(event);
  }, [textFieldProps]);

  const handleBlurWithFocus = useCallback((event: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    handleBlur(event);
    textFieldProps.onBlur?.(event);
  }, [handleBlur, textFieldProps]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    // Focus the textarea after fullscreen toggle
    setTimeout(() => {
      textAreaRef.current?.focus();
    }, 100);
  }, []);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isFullscreen]);

  const renderTextArea = () => (
    <TextField
      {...textFieldProps}
      ref={textAreaRef}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlurWithFocus}
      multiline
      minRows={minRows}
      maxRows={autoGrow ? undefined : maxRows}
      error={!!error || textFieldProps.error}
      helperText={error || textFieldProps.helperText}
      InputProps={{
        ...textFieldProps.InputProps,
        sx: {
          ...textFieldProps.InputProps?.sx,
          transition: 'all 0.2s ease-in-out',
          // Mobile-responsive styling
          fontSize: { xs: '1rem', sm: '0.875rem' },
          lineHeight: { xs: 1.4, sm: 1.5 },
          // Prevent horizontal overflow on mobile
          width: '100%',
          minWidth: 0,
          maxWidth: '100%',
          wordWrap: 'break-word',
          overflow: 'hidden',
          '& textarea': {
            resize: autoGrow ? 'none' : (isMobile ? 'none' : 'vertical'),
            fontFamily: 'inherit',
            lineHeight: isMobile ? 1.4 : 1.5,
            fontSize: isMobile ? '1rem' : '0.875rem',
            padding: isMobile ? '16px 14px' : '16px 14px',
            // Prevent text from wrapping outside container
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
            whiteSpace: 'pre-wrap',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
          },
          // Mobile-specific adjustments
          '& .MuiOutlinedInput-root': {
            borderRadius: isMobile ? 2 : 1,
          },
          ...(isTyping && {
            borderColor: 'primary.main',
          }),
        },
        endAdornment: (
          <Box
            sx={{
              position: 'absolute',
              top: isMobile ? 6 : 8,
              right: isMobile ? 6 : 8,
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 0.3 : 0.5,
              opacity: isFocused || isMobile ? 1 : 0,
              transition: 'opacity 0.2s ease-in-out',
              zIndex: 10,
              bgcolor: isMobile ? 'rgba(255,255,255,0.9)' : 'transparent',
              borderRadius: isMobile ? 1 : 0,
              p: isMobile ? 0.3 : 0,
            }}
          >
            {onAIHelp && (
              <Tooltip title="AI Assist">
                <IconButton 
                  size={isMobile ? "small" : "small"} 
                  onClick={onAIHelp} 
                  color="secondary"
                  sx={{
                    p: isMobile ? 0.3 : 0.5,
                    bgcolor: isMobile ? 'background.paper' : 'transparent',
                    boxShadow: isMobile ? 1 : 0,
                    '&:hover': {
                      bgcolor: isMobile ? 'secondary.light' : 'secondary.light',
                    }
                  }}
                >
                  <AutoAwesome fontSize={isMobile ? "small" : "small"} />
                </IconButton>
              </Tooltip>
            )}
            {enableFullscreen && (
              <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
                <IconButton 
                  size={isMobile ? "small" : "small"} 
                  onClick={toggleFullscreen}
                  sx={{
                    p: isMobile ? 0.3 : 0.5,
                    bgcolor: isMobile ? 'background.paper' : 'transparent',
                    boxShadow: isMobile ? 1 : 0,
                  }}
                >
                  {isFullscreen ? 
                    <FullscreenExit fontSize={isMobile ? "small" : "small"} /> : 
                    <Fullscreen fontSize={isMobile ? "small" : "small"} />
                  }
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      }}
    />
  );

  const textAreaComponent = renderTextArea();

  return (
    <Box 
      sx={{ 
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        // Ensure container doesn't exceed viewport on mobile
        minWidth: 0,
      }}
    >
      {isFullscreen ? (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'center',
            p: isMobile ? 1 : 2,
            pt: isMobile ? 2 : 2,
          }}
        >
          <Box
            sx={{
              width: isMobile ? '95%' : '90%',
              maxWidth: isMobile ? 'none' : '800px',
              height: isMobile ? 'calc(100vh - 40px)' : 'auto',
              maxHeight: isMobile ? 'none' : '80%',
              bgcolor: 'background.paper',
              borderRadius: isMobile ? 2 : 1,
              p: isMobile ? 2 : 3,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {textFieldProps.label}
            </Typography>
            <Box sx={{ flexGrow: 1, '& .MuiTextField-root': { height: '100%' } }}>
              {textAreaComponent}
            </Box>
          </Box>
        </Box>
      ) : (
        textAreaComponent
      )}

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress sx={{ width: 20, height: 2 }} />
              <Typography variant="caption" color="primary">
                Typing...
              </Typography>
            </Box>
          )}
          
          {showCharacterCount && maxLength && (
            <Typography
              variant="caption"
              color={displayValue.length > maxLength * 0.9 ? 'warning.main' : 'textSecondary'}
              sx={{ ml: 'auto' }}
            >
              {displayValue.length}/{maxLength}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
});

OptimizedTextArea.displayName = 'OptimizedTextArea';

export default OptimizedTextArea;
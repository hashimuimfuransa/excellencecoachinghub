import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Alert,
  AlertTitle,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab
} from '@mui/material';
import {
  Google,
  PhoneAndroid,
  ExpandMore,
  Info,
  CheckCircle,
  Warning,
  OpenInNew,
  TouchApp
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface MobileGoogleSignInProps {
  onSuccess?: (result: {requiresRoleSelection?: boolean; userData?: any}) => void;
  onError?: (error: string) => void;
  loading?: boolean;
  setLoading?: (loading: boolean) => void;
}

const MobileGoogleSignIn: React.FC<MobileGoogleSignInProps> = ({
  onSuccess,
  onError,
  loading = false,
  setLoading
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [popupSupported, setPopupSupported] = useState<boolean | null>(null);
  const [instructionType, setInstructionType] = useState<'popup' | 'general'>('general');
  const [selectedMethod, setSelectedMethod] = useState(0);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  
  const { 
    loginWithGoogle, 
    loginWithGoogleMobile, 
    createGoogleMobileButton, 
    handleGoogleOAuthCallback,
    getMobilePopupInstructions 
  } = useAuth();
  const theme = useTheme();
  const isMobileQuery = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                          (window.innerWidth <= 768 && 'ontouchstart' in window);
      setIsMobile(mobileCheck);
    };

    // Test popup support
    const testPopupSupport = async () => {
      try {
        const popup = window.open('', '_blank', 'width=1,height=1');
        if (popup) {
          popup.close();
          setPopupSupported(true);
        } else {
          setPopupSupported(false);
        }
      } catch (error) {
        setPopupSupported(false);
      }
    };

    checkMobile();
    if (window.innerWidth <= 768) {
      testPopupSupport();
    }

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle OAuth callback on component mount
  useEffect(() => {
    const handleCallback = async () => {
      try {
        const result = await handleGoogleOAuthCallback();
        if (result) {
          onSuccess?.(result);
        }
      } catch (error: any) {
        onError?.(error.message);
      }
    };

    // Check if this is an OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('code') && urlParams.has('state')) {
      handleCallback();
    }
  }, [handleGoogleOAuthCallback, onSuccess, onError]);

  const handleGoogleSignIn = async (useMobileOptimized = false) => {
    try {
      setLoading?.(true);

      const result = useMobileOptimized && isMobile 
        ? await loginWithGoogleMobile()
        : await loginWithGoogle();
        
      onSuccess?.(result);

    } catch (error: any) {
      console.error('Google sign-in error:', error);
      
      // Check if it's a mobile popup issue
      if (isMobile && (
        error.message?.includes('popup') || 
        error.message?.includes('blocked') || 
        error.message?.includes('Mobile popup')
      )) {
        setInstructionType('popup');
        setShowInstructions(true);
      } else {
        onError?.(error.message);
      }
    } finally {
      setLoading?.(false);
    }
  };

  const handleNativeGoogleButton = async () => {
    if (!googleButtonRef.current) {
      onError?.('Google button container not available');
      return;
    }

    try {
      setLoading?.(true);
      const result = await createGoogleMobileButton(googleButtonRef.current);
      onSuccess?.(result);
    } catch (error: any) {
      console.error('Google native button error:', error);
      onError?.(error.message);
    } finally {
      setLoading?.(false);
    }
  };

  const getMobileInstructionsBrowser = (): string => {
    return getMobilePopupInstructions();
  };

  const renderMobileStatus = () => {
    if (!isMobile && !isMobileQuery) return null;

    return (
      <Box sx={{ mb: 2 }}>
        <Alert 
          severity={popupSupported === false ? "warning" : "info"} 
          variant="outlined"
          sx={{ mb: 1 }}
        >
          <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneAndroid fontSize="small" />
            Mobile Device Detected
          </AlertTitle>
          {popupSupported === false ? (
            <Typography variant="body2">
              Popup blocking detected. You may need to enable popups for sign-in to work properly.
            </Typography>
          ) : popupSupported === true ? (
            <Typography variant="body2">
              Popups are working. Google sign-in should work normally.
            </Typography>
          ) : (
            <Typography variant="body2">
              Checking popup support...
            </Typography>
          )}
        </Alert>

        {popupSupported === false && (
          <Chip 
            icon={<Info />}
            label="Need help with popups?"
            onClick={() => {
              setInstructionType('general');
              setShowInstructions(true);
            }}
            sx={{ mb: 1 }}
            variant="outlined"
            color="primary"
          />
        )}
      </Box>
    );
  };

  const renderInstructionsDialog = () => (
    <Dialog 
      open={showInstructions} 
      onClose={() => setShowInstructions(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { mx: 1, maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PhoneAndroid color="primary" />
        {instructionType === 'popup' ? 'Enable Popups for Google Sign-In' : 'Mobile Sign-In Help'}
      </DialogTitle>
      
      <DialogContent>
        {instructionType === 'popup' ? (
          <Box>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Popup Blocked</AlertTitle>
              Your browser blocked the Google sign-in popup. Please follow the instructions below.
            </Alert>

            <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
              {getMobileInstructionsBrowser()}
            </Typography>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="subtitle2">Why do I need to enable popups?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Google Sign-In uses a secure popup window to authenticate your account. 
                  Mobile browsers often block popups by default for security, but you can 
                  safely allow them for this authentication process.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              For the best mobile experience with Google Sign-In:
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircle color="success" fontSize="small" />
                Before signing in:
              </Typography>
              <Typography variant="body2" sx={{ ml: 3, mb: 1 }}>
                • Make sure you're signed in to Google in your browser
              </Typography>
              <Typography variant="body2" sx={{ ml: 3, mb: 1 }}>
                • Enable popups for this site (see instructions above)
              </Typography>
              <Typography variant="body2" sx={{ ml: 3 }}>
                • Use the mobile-optimized sign-in button below
              </Typography>
            </Box>

            <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                {getMobileInstructionsBrowser()}
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setShowInstructions(false)}>
          Got it
        </Button>
        <Button 
          variant="contained" 
          onClick={() => {
            setShowInstructions(false);
            handleGoogleSignIn(true);
          }}
          startIcon={<Google />}
        >
          Try Sign-In Again
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {renderMobileStatus()}
      
      {(isMobile || isMobileQuery) ? (
        <Box>
          <Tabs 
            value={selectedMethod} 
            onChange={(_, newValue) => setSelectedMethod(newValue)}
            sx={{ mb: 2, minHeight: 'auto' }}
            variant="fullWidth"
          >
            <Tab 
              label="Standard" 
              icon={<Google fontSize="small" />}
              sx={{ minHeight: 'auto', py: 1 }}
            />
            <Tab 
              label="Redirect" 
              icon={<OpenInNew fontSize="small" />}
              sx={{ minHeight: 'auto', py: 1 }}
            />
            <Tab 
              label="Button" 
              icon={<TouchApp fontSize="small" />}
              sx={{ minHeight: 'auto', py: 1 }}
            />
          </Tabs>

          {selectedMethod === 0 && (
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<Google />}
              onClick={() => handleGoogleSignIn(false)}
              disabled={loading}
              sx={{
                py: 1.5,
                borderColor: '#4285f4',
                color: '#4285f4',
                '&:hover': {
                  borderColor: '#3367d6',
                  backgroundColor: '#f8f9ff'
                }
              }}
            >
              {loading ? 'Signing in...' : 'Continue with Google'}
            </Button>
          )}

          {selectedMethod === 1 && (
            <Box>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<OpenInNew />}
                onClick={() => handleGoogleSignIn(true)}
                disabled={loading}
                sx={{
                  py: 1.5,
                  backgroundColor: '#34a853',
                  '&:hover': {
                    backgroundColor: '#2e7d47'
                  }
                }}
              >
                {loading ? 'Redirecting...' : 'Sign in via Redirect (No Popups)'}
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', opacity: 0.7 }}>
                Opens Google sign-in in the same tab
              </Typography>
            </Box>
          )}

          {selectedMethod === 2 && (
            <Box>
              <Box 
                ref={googleButtonRef} 
                sx={{ 
                  minHeight: 48, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '1px dashed #ddd',
                  borderRadius: 1,
                  mb: 1
                }}
              />
              <Button
                fullWidth
                variant="outlined"
                size="large"
                startIcon={<TouchApp />}
                onClick={handleNativeGoogleButton}
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderColor: '#fbbc04',
                  color: '#fbbc04',
                  '&:hover': {
                    borderColor: '#f9ab00',
                    backgroundColor: '#fffbf2'
                  }
                }}
              >
                {loading ? 'Loading...' : 'Create Google Button'}
              </Button>
              <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'center', opacity: 0.7 }}>
                Creates a native Google sign-in button
              </Typography>
            </Box>
          )}
        </Box>
      ) : (
        <Button
          fullWidth
          variant="outlined"
          size="large"
          startIcon={<Google />}
          onClick={() => handleGoogleSignIn(false)}
          disabled={loading}
          sx={{
            py: 1.5,
            borderColor: '#4285f4',
            color: '#4285f4',
            '&:hover': {
              borderColor: '#3367d6',
              backgroundColor: '#f8f9ff'
            }
          }}
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Button>
      )}

      {renderInstructionsDialog()}
    </Box>
  );
};

export default MobileGoogleSignIn;
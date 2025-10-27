import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Google, CheckCircle, Error } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { socialAuthService } from '../services/socialAuthService';

const GoogleTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testGoogleAuth = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      console.log('Starting Google authentication test...');
      const authResponse = await socialAuthService.signInWithGoogle();
      
      console.log('Authentication successful:', authResponse);
      setResult(authResponse);
    } catch (err: any) {
      console.error('Authentication failed:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            elevation={10}
            sx={{
              p: 4,
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Google OAuth Test Page
            </Typography>

            <Typography
              variant="body1"
              align="center"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              Test the Google authentication integration to ensure it's working properly.
            </Typography>

            <Divider sx={{ mb: 4 }} />

            {/* Test Button */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Google />}
                onClick={testGoogleAuth}
                disabled={loading}
                sx={{
                  py: 1.5,
                  px: 4,
                  borderRadius: '30px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #4285f4, #34a853)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #3367d6, #2d8f47)',
                  },
                }}
              >
                {loading ? 'Testing Google Auth...' : 'Test Google Sign-In'}
              </Button>
            </Box>

            {/* Clear Results Button */}
            {(result || error) && (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Button
                  variant="outlined"
                  onClick={clearResults}
                  sx={{ borderRadius: '20px' }}
                >
                  Clear Results
                </Button>
              </Box>
            )}

            {/* Success Result */}
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  severity="success"
                  icon={<CheckCircle />}
                  sx={{ mb: 3, borderRadius: 2 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Google Authentication Successful! ✅
                  </Typography>
                  <Typography variant="body2">
                    User has been authenticated and data retrieved successfully.
                  </Typography>
                </Alert>

                <Card sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      User Information:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography><strong>Name:</strong> {result.user.firstName} {result.user.lastName}</Typography>
                      <Typography><strong>Email:</strong> {result.user.email}</Typography>
                      <Typography><strong>ID:</strong> {result.user._id}</Typography>
                      <Typography><strong>Role:</strong> {result.user.role}</Typography>
                      <Typography><strong>Email Verified:</strong> {result.user.isEmailVerified ? 'Yes' : 'No'}</Typography>
                      {result.user.profilePicture && (
                        <Box sx={{ mt: 2 }}>
                          <Typography><strong>Profile Picture:</strong></Typography>
                          <img 
                            src={result.user.profilePicture} 
                            alt="Profile" 
                            style={{ width: 60, height: 60, borderRadius: '50%', marginTop: 8 }}
                          />
                        </Box>
                      )}
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="h6" gutterBottom color="primary">
                      Authentication Tokens:
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      <Typography><strong>Token:</strong> {result.token.substring(0, 50)}...</Typography>
                      <Typography><strong>Refresh Token:</strong> {result.refreshToken?.substring(0, 50)}...</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Error Result */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Alert
                  severity="error"
                  icon={<Error />}
                  sx={{ borderRadius: 2 }}
                >
                  <Typography variant="h6" gutterBottom>
                    Google Authentication Failed ❌
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Error:</strong> {error}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Check the browser console for more detailed error information.
                  </Typography>
                </Alert>
              </motion.div>
            )}

            {/* Instructions */}
            <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Setup Instructions:
              </Typography>
              <Typography variant="body2" component="div">
                <ol>
                  <li>Make sure you have configured Google OAuth in Google Cloud Console</li>
                  <li>Add your Client ID to the .env file as VITE_GOOGLE_CLIENT_ID</li>
                  <li>Add localhost:3000 and localhost:5173 to authorized origins</li>
                  <li>Enable popups in your browser</li>
                  <li>Click the test button above</li>
                </ol>
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default GoogleTestPage;
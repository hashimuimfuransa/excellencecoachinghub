import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  TextField,
  Grid
} from '@mui/material';
import {
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Code as CodeIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';
// EmailJS removed - now using backend SendGrid service
import { authService } from '../../services/authService';

const EmailSystemDemo: React.FC = () => {
  const navigate = useNavigate();
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleTestEmail = async () => {
    if (!testEmail) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await apiService.post('/auth/test-email', { email: testEmail });
      if (response.success) {
        setMessage('Test email sent! Check the backend console for verification details.');
      }
    } catch (error) {
      setMessage('Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmailJS = async () => {
    if (!testEmail) return;

    setLoading(true);
    setMessage('');

    try {
      const success = await testEmailJSConnection(testEmail);
      if (success) {
        setMessage('EmailJS test successful! Check your email inbox.');
      } else {
        setMessage('EmailJS test failed. Check console for details.');
      }
    } catch (error) {
      setMessage('EmailJS test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestLocalStorage = () => {
    // Test localStorage functionality
    const testCode = 'test-code-123';
    const testEmail = 'test@example.com';

    console.log('🧪 Testing localStorage...');
    localStorage.setItem('pendingVerificationCode', testCode);
    localStorage.setItem('pendingVerificationEmail', testEmail);

    const retrievedCode = localStorage.getItem('pendingVerificationCode');
    const retrievedEmail = localStorage.getItem('pendingVerificationEmail');

    console.log('Set code:', testCode);
    console.log('Retrieved code:', retrievedCode);
    console.log('Set email:', testEmail);
    console.log('Retrieved email:', retrievedEmail);
    console.log('localStorage working:', retrievedCode === testCode && retrievedEmail === testEmail);

    setMessage(`localStorage test: ${retrievedCode === testCode ? 'WORKING' : 'FAILED'}`);
  };

  const handleTestPasswordReset = async () => {
    if (!testEmail) return;

    setLoading(true);
    setMessage('');

    try {
      const testResetToken = 'test-reset-token-' + Date.now();
      const success = await sendPasswordResetEmail(testEmail, 'Test User', testResetToken);
      if (success) {
        setMessage('Password reset email test successful! Check your email inbox or console.');
      } else {
        setMessage('Password reset email test failed. Check console for details.');
      }
    } catch (error) {
      setMessage('Password reset email test failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTestFullPasswordReset = async () => {
    if (!testEmail) return;

    setLoading(true);
    setMessage('');

    try {
      await authService.forgotPassword(testEmail);
      setMessage('Full password reset flow test successful! Check your email inbox for real reset email.');
    } catch (error: any) {
      setMessage(`Full password reset test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ marginTop: 4, marginBottom: 4 }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <EmailIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h4" component="h1" gutterBottom>
              Simple Email Verification System
            </Typography>
            <Typography variant="body1" color="text.secondary">
              No external email configuration required - works out of the box!
            </Typography>
          </Box>

          <Alert severity="success" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              ✅ Real Email System is Now Working!
            </Typography>
            <Typography variant="body2">
              EmailJS has been configured with your credentials. The system will now send real verification emails
              to users' email addresses instead of console logging.
            </Typography>
          </Alert>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                How It Works:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="User registers"
                    secondary="Account is created immediately"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Real email sent to user"
                    secondary="Professional verification email delivered to inbox"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <VisibilityIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="User checks email inbox"
                    secondary="Receives verification email within seconds"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CodeIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="User clicks email link"
                    secondary="Automatically redirected to verification page"
                  />
                </ListItem>
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Test the System:
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Test Email Address"
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  margin="normal"
                  placeholder="Enter any email address"
                />
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleTestEmail}
                  disabled={loading || !testEmail}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Sending...' : 'Send Test Verification'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleTestEmailJS}
                  disabled={loading || !testEmail}
                  sx={{ mt: 1 }}
                >
                  {loading ? 'Testing...' : 'Test EmailJS Connection'}
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleTestLocalStorage}
                  disabled={loading}
                  sx={{ mt: 1 }}
                >
                  Test localStorage
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleTestPasswordReset}
                  disabled={loading || !testEmail}
                  sx={{ mt: 1 }}
                >
                  {loading ? 'Testing...' : 'Test Password Reset Email'}
                </Button>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleTestFullPasswordReset}
                  disabled={loading || !testEmail}
                  sx={{ mt: 1, bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                >
                  {loading ? 'Testing...' : 'Test Full Password Reset Flow'}
                </Button>
                {message && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {message} Check your email inbox for the verification email!
                  </Alert>
                )}
              </Box>

              <Typography variant="h6" gutterBottom>
                Quick Actions:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/register')}
                  startIcon={<EmailIcon />}
                >
                  Try Registration Flow
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/login')}
                  startIcon={<CheckIcon />}
                >
                  Test Login & Verification
                </Button>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 4 }} />

          <Alert severity="info" icon={<InfoIcon />}>
            <Typography variant="h6" gutterBottom>
              For Production Use:
            </Typography>
            <Typography variant="body2">
              • Replace console logging with real email service (Gmail, SendGrid, etc.)
              <br />
              • Store verification codes in Redis or database instead of memory
              <br />
              • Add rate limiting for verification requests
              <br />
              • Implement email templates with proper styling
            </Typography>
          </Alert>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              Real emails will be sent to the email addresses you provide. Check your inbox!
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailSystemDemo;

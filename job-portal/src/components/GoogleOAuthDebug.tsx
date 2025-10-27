import React from 'react';
import { Box, Paper, Typography, Alert, Button, Chip } from '@mui/material';
import { ContentCopy } from '@mui/icons-material';

const GoogleOAuthDebug: React.FC = () => {
  const currentOrigin = window.location.origin;
  const redirectUri = `${currentOrigin}/login`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, m: 2, maxWidth: 800 }}>
      <Typography variant="h5" gutterBottom color="error">
        🔧 Google OAuth Configuration Required
      </Typography>
      
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body1">
          <strong>Error:</strong> The given origin is not allowed for the given client ID.
        </Typography>
      </Alert>

      <Typography variant="body1" paragraph>
        You need to add the following URLs to your Google Cloud Console OAuth configuration:
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Authorized JavaScript Origins:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip label={currentOrigin} color="primary" />
          <Button
            size="small"
            startIcon={<ContentCopy />}
            onClick={() => copyToClipboard(currentOrigin)}
          >
            Copy
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          2. Authorized Redirect URIs:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Chip label={redirectUri} color="secondary" />
          <Button
            size="small"
            startIcon={<ContentCopy />}
            onClick={() => copyToClipboard(redirectUri)}
          >
            Copy
          </Button>
        </Box>
      </Box>

      <Alert severity="info">
        <Typography variant="body2">
          <strong>How to fix:</strong>
        </Typography>
        <ol style={{ marginTop: 8, marginBottom: 0 }}>
          <li>Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">Google Cloud Console</a></li>
          <li>Navigate to APIs & Services &gt; Credentials</li>
          <li>Find your OAuth 2.0 Client ID and click on it</li>
          <li>Add the URLs shown above to the respective sections</li>
          <li>Click "Save"</li>
          <li>Refresh this page and try Google sign-in again</li>
        </ol>
      </Alert>

      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
        Current URL: {window.location.href}
      </Typography>
    </Paper>
  );
};

export default GoogleOAuthDebug;
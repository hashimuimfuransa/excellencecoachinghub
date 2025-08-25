import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Paper,
  Chip
} from '@mui/material';
import { CloudUpload, CheckCircle, Error } from '@mui/icons-material';
import { uploadCVSimple } from '../utils/workingUpload';

/**
 * Standalone CV Upload Test Component
 * Tests the new working upload functionality without requiring authentication
 */
const CVUploadTest: React.FC = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files[0]) return;

    const file = files[0];
    setFileName(file.name);
    
    // Reset states
    setUploading(true);
    setProgress(0);
    setSuccess(false);
    setError(null);
    setUploadedUrl(null);

    try {
      console.log('🚀 Starting CV upload test...');
      
      const fileUrl = await uploadCVSimple(file, (progress) => {
        setProgress(progress);
      });
      
      console.log('✅ CV upload successful:', fileUrl);
      
      // Update success states
      setUploading(false);
      setProgress(100);
      setSuccess(true);
      setUploadedUrl(fileUrl);

      // Reset success state after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);

    } catch (error: any) {
      console.error('❌ CV upload error:', error);
      
      setUploading(false);
      setProgress(0);
      setSuccess(false);
      setError(error.message || 'Upload failed');

      // Clear error after 5 seconds
      setTimeout(() => {
        setError(null);
      }, 5000);
    }

    // Reset file input
    event.target.value = '';
  };

  const resetTest = () => {
    setUploading(false);
    setProgress(0);
    setSuccess(false);
    setError(null);
    setUploadedUrl(null);
    setFileName(null);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          🧪 CV Upload Test
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center" paragraph>
          Test the new working CV upload functionality
        </Typography>
      </Paper>

      <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Your CV/Resume
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Select a PDF, DOC, or DOCX file to test the upload functionality.
            </Typography>
          </Box>

          {/* File Upload Button */}
          <Box sx={{ mb: 3 }}>
            <input
              accept=".pdf,.doc,.docx"
              id="cv-upload-test"
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label htmlFor="cv-upload-test">
              <Button
                variant="contained"
                component="span"
                startIcon={<CloudUpload />}
                disabled={uploading}
                size="large"
                sx={{ minWidth: 200 }}
              >
                {uploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </label>
          </Box>

          {/* File Name */}
          {fileName && (
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`📄 ${fileName}`}
                variant="outlined"
                color="primary"
              />
            </Box>
          )}

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload Progress: {progress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          )}

          {/* Success Message */}
          {success && (
            <Alert 
              severity="success" 
              icon={<CheckCircle />}
              sx={{ mb: 2 }}
            >
              <strong>Upload Successful!</strong>
              <br />
              Your CV has been uploaded successfully.
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert 
              severity="error" 
              icon={<Error />}
              sx={{ mb: 2 }}
            >
              <strong>Upload Failed:</strong>
              <br />
              {error}
            </Alert>
          )}

          {/* Upload Result */}
          {uploadedUrl && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom color="success.main">
                ✅ Upload Complete
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                File URL:
              </Typography>
              <Paper 
                variant="outlined" 
                sx={{ p: 2, bgcolor: 'grey.50', wordBreak: 'break-all' }}
              >
                <Typography variant="body2" fontFamily="monospace">
                  {uploadedUrl}
                </Typography>
              </Paper>
            </Box>
          )}

          {/* Reset Button */}
          <Box sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              onClick={resetTest}
              disabled={uploading}
            >
              Reset Test
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* API Test Info */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'info.50' }}>
        <Typography variant="body2" color="info.main" gutterBottom>
          <strong>What this test does:</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          1. Tests basic API connectivity (/api/test and /api/health)
          <br />
          2. Simulates file upload progress
          <br />
          3. Returns a working test URL
          <br />
          4. Demonstrates the complete upload flow
        </Typography>
      </Paper>
    </Box>
  );
};

export default CVUploadTest;
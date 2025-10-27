import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import { CloudUpload, CloudDownload, Check } from '@mui/icons-material';
import { teacherProfileService } from '../../services/teacherProfileService';

const CVUploadTest: React.FC = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedCV, setUploadedCV] = useState<any>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📄 File selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Validate file
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please select a PDF or Word document');
        return;
      }

      setCvFile(file);
      setError(null);
      setSuccess('File selected successfully. Ready to upload.');
    }
  };

  const handleUpload = async () => {
    if (!cvFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(null);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const formData = new FormData();
      formData.append('cv', cvFile);

      console.log('📄 Starting CV upload...');
      const response = await teacherProfileService.uploadCV(formData);
      console.log('📄 Upload response:', response);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setSuccess('CV uploaded successfully!');
        setUploadedCV(response.data);
        setCvFile(null);
      } else {
        setError(response.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          📄 CV Upload Test
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {uploadedCV && (
          <Alert severity="success" sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Box display="flex" alignItems="center">
                  <Check sx={{ mr: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    CV uploaded: {uploadedCV.originalName}
                  </Typography>
                </Box>
                <Typography variant="caption" display="block">
                  Uploaded on: {new Date(uploadedCV.uploadedAt).toLocaleDateString()}
                </Typography>
              </Box>
              <Button
                size="small"
                variant="contained"
                startIcon={<CloudDownload />}
                onClick={() => window.open(uploadedCV.url, '_blank')}
              >
                View
              </Button>
            </Box>
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <input
            type="file"
            id="cv-test-upload"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <label htmlFor="cv-test-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              disabled={uploading}
              fullWidth
            >
              Choose CV File
            </Button>
          </label>
          <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
            Accepted formats: PDF, DOC, DOCX (Max 10MB)
          </Typography>
        </Box>

        {cvFile && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
              📎 Selected: {cvFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              Size: {(cvFile.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Box>
        )}

        {uploading && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Uploading CV... {uploadProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        <Button
          variant="contained"
          color="success"
          onClick={handleUpload}
          disabled={!cvFile || uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
          fullWidth
        >
          {uploading ? 'Uploading...' : 'Upload CV'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CVUploadTest;

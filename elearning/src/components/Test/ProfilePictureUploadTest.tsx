import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  LinearProgress
} from '@mui/material';
import { CloudUpload, Check, PhotoCamera } from '@mui/icons-material';
import { teacherProfileService } from '../../services/teacherProfileService';

const ProfilePictureUploadTest: React.FC = () => {
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadedPicture, setUploadedPicture] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📸 Profile picture selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      
      // Clear any previous errors
      setError(null);
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Profile picture must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setProfilePicture(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        console.log('📸 Profile picture preview loaded');
      };
      reader.readAsDataURL(file);
      
      setSuccess('Image selected successfully. Ready to upload.');
    }
  };

  const handleUpload = async () => {
    if (!profilePicture) return;

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
      formData.append('profilePicture', profilePicture);

      console.log('📸 Starting profile picture upload...');
      const response = await teacherProfileService.uploadProfilePicture(formData);
      console.log('📸 Upload response:', response);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success) {
        setSuccess('Profile picture uploaded successfully!');
        setUploadedPicture(response.data.profilePicture);
        setProfilePicture(null);
        setPreview(null);
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
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          📸 Profile Picture Upload Test
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

        {/* Profile Picture Preview */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            src={preview || uploadedPicture || undefined}
            sx={{ 
              width: 150, 
              height: 150, 
              mx: 'auto', 
              mb: 2,
              border: '3px solid',
              borderColor: preview || uploadedPicture ? 'success.main' : 'grey.300'
            }}
          >
            <PhotoCamera sx={{ fontSize: 60 }} />
          </Avatar>
          
          {preview && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Box display="flex" alignItems="center">
                    <Check sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      Image selected: {profilePicture?.name}
                    </Typography>
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Size: {profilePicture ? (profilePicture.size / 1024 / 1024).toFixed(2) : '0'} MB
                  </Typography>
                </Box>
              </Box>
            </Alert>
          )}

          {uploadedPicture && (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Box display="flex" alignItems="center">
                <Check sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  Profile picture uploaded successfully!
                </Typography>
              </Box>
            </Alert>
          )}
        </Box>

        {/* File Input */}
        <Box sx={{ mb: 3 }}>
          <input
            type="file"
            id="profile-pic-test-upload"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <label htmlFor="profile-pic-test-upload">
            <Button
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
              disabled={uploading}
              fullWidth
            >
              Choose Profile Picture
            </Button>
          </label>
          <Typography variant="caption" display="block" sx={{ mt: 1, textAlign: 'center' }}>
            Accepted formats: JPG, PNG, GIF (Max 5MB)
          </Typography>
        </Box>

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              Uploading profile picture... {uploadProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        {/* Upload Button */}
        <Button
          variant="contained"
          color="success"
          onClick={handleUpload}
          disabled={!profilePicture || uploading}
          startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
          fullWidth
        >
          {uploading ? 'Uploading...' : 'Upload Profile Picture'}
        </Button>

        {/* Uploaded Image Info */}
        {uploadedPicture && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
              📸 Uploaded Image URL:
            </Typography>
            <Typography variant="caption" display="block" sx={{ wordBreak: 'break-all' }}>
              {uploadedPicture}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfilePictureUploadTest;

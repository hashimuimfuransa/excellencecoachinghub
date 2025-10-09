import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  LinearProgress,
  Typography,
  Alert,
  Card,
  CardContent,
  IconButton,
  Chip,
  Stack,
  Paper,
  Divider
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  CheckCircle,
  Error,
  Description,
  VideoFile,
  Image,
  AudioFile,
  InsertDriveFile
} from '@mui/icons-material';
import { uploadToCloudinary } from '../../services/cloudinaryService';

interface UploadMaterialProps {
  weekId: string;
  onUploadComplete: (material: any) => void;
  onUploadError: (error: string) => void;
}

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  cloudinaryUrl?: string;
  error?: string;
}

const UploadMaterial: React.FC<UploadMaterialProps> = ({
  weekId,
  onUploadComplete,
  onUploadError
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image />;
    if (fileType.startsWith('video/')) return <VideoFile />;
    if (fileType.startsWith('audio/')) return <AudioFile />;
    if (fileType === 'application/pdf') return <Description />;
    return <InsertDriveFile />;
  };

  const getFileType = (fileType: string): 'document' | 'video' | 'audio' | 'link' => {
    if (fileType.startsWith('image/')) return 'document';
    if (fileType.startsWith('video/')) return 'video';
    if (fileType.startsWith('audio/')) return 'audio';
    if (fileType === 'application/pdf') return 'document';
    return 'document';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const newFiles: UploadFile[] = selectedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'uploading'
    }));

    setFiles(prev => [...prev, ...newFiles]);
    
    // Start uploading files
    newFiles.forEach(uploadFile => {
      uploadFileToCloudinary(uploadFile);
    });
  };

  const uploadFileToCloudinary = async (uploadFile: UploadFile, retryCount: number = 0) => {
    const maxRetries = 3;
    
    try {
      setIsUploading(true);
      
      const result = await uploadToCloudinary(uploadFile.file, (progress) => {
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress: Math.round(progress) }
            : f
        ));
      });

      // Update file status to completed
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100, 
              cloudinaryUrl: result.secure_url 
            }
          : f
      ));

      // Create material object
      const material = {
        title: uploadFile.file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        description: `Uploaded file: ${uploadFile.file.name}`,
        type: getFileType(uploadFile.file.type),
        url: result.secure_url,
        filePath: result.public_id,
        order: files.length + 1,
        estimatedDuration: 30, // Default duration
        isRequired: true,
        isPublished: true,
        fileSize: uploadFile.file.size,
        originalFileName: uploadFile.file.name
      };

      onUploadComplete(material);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Check if we should retry
      const shouldRetry = retryCount < maxRetries && (
        error.message?.includes('Network connection was reset') ||
        error.message?.includes('timeout') ||
        error.message?.includes('temporarily unavailable') ||
        error.message?.includes('ECONNRESET')
      );
      
      if (shouldRetry) {
        console.log(`Retrying upload (${retryCount + 1}/${maxRetries})...`);
        
        // Update progress to show retry status
        setFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { 
                ...f, 
                progress: 0,
                error: `Retrying... (${retryCount + 1}/${maxRetries})`
              }
            : f
        ));
        
        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the upload
        return uploadFileToCloudinary(uploadFile, retryCount + 1);
      }
      
      // Final failure
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error.message || 'Upload failed' 
            }
          : f
      ));

      onUploadError(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const completedFiles = files.filter(f => f.status === 'completed');
  const errorFiles = files.filter(f => f.status === 'error');
  const uploadingFiles = files.filter(f => f.status === 'uploading');

  return (
    <Box>
      {/* Upload Button */}
      <Paper 
        elevation={2}
        sx={{ 
          p: 3, 
          textAlign: 'center',
          border: '2px dashed #e0e0e0',
          borderRadius: 2,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'primary.light',
            '& .upload-icon': {
              color: 'primary.main'
            }
          }
        }}
        onClick={handleUploadClick}
      >
        <CloudUpload 
          className="upload-icon"
          sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} 
        />
        <Typography variant="h6" gutterBottom>
          Upload Course Materials
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Click to select files or drag and drop them here
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supports: PDF, Images, Videos, Audio files (Max 100MB each)
        </Typography>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov,.mp3,.wav,.m4a"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Paper>

      {/* Upload Progress */}
      {files.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Upload Progress
            </Typography>
            
            <Stack spacing={2}>
              {files.map(file => (
                <Box key={file.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      {getFileIcon(file.file.type)}
                      <Box sx={{ ml: 1, flex: 1 }}>
                        <Typography variant="body2" noWrap>
                          {file.file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.file.size)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {file.status === 'completed' && (
                        <CheckCircle color="success" />
                      )}
                      {file.status === 'error' && (
                        <Error color="error" />
                      )}
                      <IconButton 
                        size="small" 
                        onClick={() => removeFile(file.id)}
                        disabled={file.status === 'uploading'}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {file.status === 'uploading' && (
                    <LinearProgress 
                      variant="determinate" 
                      value={file.progress} 
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  )}
                  
                  {file.status === 'completed' && (
                    <Chip 
                      label="Upload Complete" 
                      color="success" 
                      size="small" 
                      icon={<CheckCircle />}
                    />
                  )}
                  
                  {file.status === 'error' && (
                    <Alert severity="error" sx={{ mt: 1 }}>
                      {file.error}
                    </Alert>
                  )}
                </Box>
              ))}
            </Stack>
            
            {completedFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  {completedFiles.length} file(s) uploaded successfully
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upload Status Summary */}
      {isUploading && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Uploading {uploadingFiles.length} file(s)... Please don't close this page.
        </Alert>
      )}

      {errorFiles.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorFiles.length} file(s) failed to upload. Please try again.
        </Alert>
      )}
    </Box>
  );
};

export default UploadMaterial;

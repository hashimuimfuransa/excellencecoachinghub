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
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  CheckCircle,
  Error,
  VideoFile,
  Image,
  ExpandMore,
  Schedule,
  Person,
  TrendingUp,
  MenuBook,
  Lightbulb,
  Timer,
  PlayArrow,
  Visibility
} from '@mui/icons-material';
import { weekService } from '../../services/weekService';

interface MediaUploaderProps {
  courseId?: string;
  weekId?: string;
  onUploadComplete: (result: any) => void;
  onUploadError: (error: string) => void;
}

interface MediaFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'processing' | 'uploaded' | 'saving' | 'completed' | 'error';
  result?: any;
  error?: string;
  description: string;
  title: string;
  url?: string;
  type?: 'video' | 'image';
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  courseId,
  weekId,
  onUploadComplete,
  onUploadError
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('video/')) {
      return <VideoFile color="primary" />;
    } else if (mimeType.startsWith('image/')) {
      return <Image color="secondary" />;
    }
    return <VideoFile color="default" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File) => {
    const maxSize = 500 * 1024 * 1024; // 500MB
    const allowedTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
      'video/webm',
      'video/mkv',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/webp',
      'image/svg+xml'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not supported. Please upload video or image files.`
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size ${formatFileSize(file.size)} exceeds maximum allowed size of ${formatFileSize(maxSize)}`
      };
    }

    return { isValid: true };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const newFiles: MediaFile[] = selectedFiles.map(file => {
      const validation = validateFile(file);
      const fileName = file.name.replace(/\.[^/.]+$/, "");
      
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: validation.isValid ? 'uploading' : 'error',
        error: validation.error,
        description: '',
        title: fileName
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    
    // Start uploading valid files
    newFiles.forEach(mediaFile => {
      if (mediaFile.status === 'uploading') {
        uploadMedia(mediaFile);
      }
    });
  };

  const uploadMedia = async (mediaFile: MediaFile) => {
    try {
      setIsUploading(true);
      
      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { ...f, status: 'processing', progress: 10 }
          : f
      ));

      // Create form data
      const formData = new FormData();
      formData.append('file', mediaFile.file);
      formData.append('title', mediaFile.title);
      formData.append('description', mediaFile.description);
      formData.append('type', mediaFile.file.type.startsWith('video/') ? 'video' : 'image');
      formData.append('courseId', courseId || '');
      formData.append('weekId', weekId || '');

      // Upload file using the API service
      const { default: api } = await import('../../services/api');
      
      const response = await api.post('/upload/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const result = response.data;

      // Update status to uploaded (not completed yet - teacher needs to save)
      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { 
              ...f, 
              status: 'uploaded', 
              progress: 100, 
              result: result.data || result,
              url: result.data?.url || result.url,
              type: mediaFile.file.type.startsWith('video/') ? 'video' : 'image'
            }
          : f
      ));

      // Don't call onUploadComplete yet - wait for teacher to save

    } catch (error: any) {
      console.error('Media upload error:', error);
      
      // Update status to error
      setFiles(prev => prev.map(f => 
        f.id === mediaFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error.message || 'Upload failed' 
            }
          : f
      ));

      onUploadError(error.message || 'Media upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDescriptionChange = (fileId: string, description: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, description } : f
    ));
  };

  const handleTitleChange = (fileId: string, title: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, title } : f
    ));
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'uploading', progress: 0, error: undefined }
        : f
      ));
      uploadMedia(file);
    }
  };

  const openPreview = (file: MediaFile) => {
    setPreviewFile(file);
    setPreviewDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'uploaded': return 'info';
      case 'saving': return 'warning';
      case 'error': return 'error';
      case 'processing': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle />;
      case 'uploaded': return <CheckCircle />;
      case 'saving': return <CircularProgress size={20} />;
      case 'error': return <Error />;
      case 'processing': return <CircularProgress size={20} />;
      default: return <CloudUpload />;
    }
  };

  const saveToWeek = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.result) return;

    try {
      // Update status to saving
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'saving' } : f
      ));

      // Prepare material data with all required fields
      const materialData = {
        title: file.title || file.file.name.replace(/\.[^/.]+$/, ""),
        description: file.description || `Uploaded ${file.type}`,
        type: file.type || (file.file.type.startsWith('video/') ? 'video' : 'image'),
        url: file.url || file.result.url,
        order: 1, // Will be set by backend
        estimatedDuration: file.type === 'video' ? 10 : 2,
        isRequired: true,
        isPublished: true
      };

      console.log('📤 Saving media material to week:', materialData);

      // Call the parent's onUploadComplete with the material data
      onUploadComplete(materialData);

      // Update status to completed
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'completed' } : f
      ));

    } catch (error: any) {
      console.error('Error saving media to week:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error', error: error.message } : f
      ));
      onUploadError(error.message || 'Failed to save media to week');
    }
  };

  return (
    <Box>
      <Card variant="outlined">
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <VideoFile color="primary" />
            <Typography variant="h6">
              Upload Images & Videos
            </Typography>
          </Box>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload images and videos with descriptions to help students understand the content.
          </Typography>

          {/* File Upload Area */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: 'primary.main',
              borderRadius: 2,
              mb: 2,
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.dark',
                backgroundColor: 'action.hover'
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              Click to upload images and videos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV, JPEG, PNG, GIF, BMP, WebP, SVG
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Maximum file size: 500MB
            </Typography>
          </Paper>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="video/*,image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* Upload Progress */}
          {isUploading && (
            <Box mb={2}>
              <Typography variant="body2" gutterBottom>
                Uploading files...
              </Typography>
              <LinearProgress />
            </Box>
          )}

          {/* File List */}
          {files.length > 0 && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Uploaded Files ({files.length})
              </Typography>
              
              <List>
                {files.map((file) => (
                  <ListItem key={file.id} divider>
                    <ListItemIcon>
                      {getFileIcon(file.file.type)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="subtitle2">
                            {file.file.name}
                          </Typography>
                          <Chip
                            label={file.status}
                            size="small"
                            color={getStatusColor(file.status) as any}
                            icon={getStatusIcon(file.status)}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.file.size)} • {file.file.type}
                          </Typography>
                          {file.status === 'processing' && (
                            <LinearProgress 
                              variant="determinate" 
                              value={file.progress} 
                              sx={{ mt: 1 }}
                            />
                          )}
                          {file.error && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              {file.error}
                            </Alert>
                          )}
                        </Box>
                      }
                    />
                    
                    <ListItemIcon>
                      <Stack direction="row" spacing={1}>
                        {file.status === 'uploaded' && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => saveToWeek(file.id)}
                            disabled={!file.title.trim() || !file.description.trim()}
                            title={!file.title.trim() || !file.description.trim() ? "Please add title and description" : "Save to week"}
                          >
                            Save to Week
                          </Button>
                        )}
                        {(file.status === 'completed' || file.status === 'uploaded') && (
                          <IconButton 
                            size="small" 
                            onClick={() => openPreview(file)}
                            title="Preview"
                          >
                            <Visibility />
                          </IconButton>
                        )}
                        {file.status === 'error' && (
                          <IconButton 
                            size="small" 
                            onClick={() => retryUpload(file.id)}
                            title="Retry upload"
                          >
                            <CloudUpload />
                          </IconButton>
                        )}
                        <IconButton 
                          size="small" 
                          onClick={() => removeFile(file.id)}
                          title="Remove file"
                        >
                          <Delete />
                        </IconButton>
                      </Stack>
                    </ListItemIcon>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* File Details Form */}
          {files.filter(f => f.status === 'uploaded' || f.status === 'saving').length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                📝 Add Details & Save to Week
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Please add a title and description for each file, then click "Save to Week" to add it to your course materials.
              </Typography>
              
              <Grid container spacing={2}>
                {files.filter(f => f.status === 'uploaded' || f.status === 'saving').map((file) => (
                  <Grid item xs={12} key={file.id}>
                    <Card variant="outlined" sx={{ border: '2px solid', borderColor: 'primary.main' }}>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          {getFileIcon(file.file.type)}
                          <Typography variant="subtitle2">
                            {file.file.name}
                          </Typography>
                          <Chip
                            label={file.status === 'saving' ? 'Saving...' : 'Ready to Save'}
                            size="small"
                            color={file.status === 'saving' ? 'warning' : 'info'}
                          />
                        </Box>
                        
                        <TextField
                          fullWidth
                          label="Title *"
                          value={file.title}
                          onChange={(e) => handleTitleChange(file.id, e.target.value)}
                          size="small"
                          margin="dense"
                          required
                          error={!file.title.trim()}
                          helperText={!file.title.trim() ? "Title is required" : ""}
                        />
                        
                        <TextField
                          fullWidth
                          label="Description *"
                          value={file.description}
                          onChange={(e) => handleDescriptionChange(file.id, e.target.value)}
                          multiline
                          rows={3}
                          size="small"
                          margin="dense"
                          required
                          error={!file.description.trim()}
                          helperText={!file.description.trim() ? "Description is required" : "Describe what this image/video is about so students know what they're watching..."}
                        />

                        <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => saveToWeek(file.id)}
                            disabled={!file.title.trim() || !file.description.trim() || file.status === 'saving'}
                            startIcon={file.status === 'saving' ? <CircularProgress size={16} /> : <CheckCircle />}
                          >
                            {file.status === 'saving' ? 'Saving...' : 'Save to Week'}
                          </Button>
                          
                          <Button
                            variant="outlined"
                            onClick={() => openPreview(file)}
                            startIcon={<Visibility />}
                          >
                            Preview
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={() => setPreviewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview: {previewFile?.file.name}
        </DialogTitle>
        <DialogContent>
          {previewFile && (
            <Box>
              {previewFile.file.type.startsWith('video/') ? (
                <video
                  controls
                  style={{ width: '100%', maxHeight: '400px' }}
                  src={URL.createObjectURL(previewFile.file)}
                />
              ) : (
                <img
                  src={URL.createObjectURL(previewFile.file)}
                  alt={previewFile.title}
                  style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }}
                />
              )}
              
              <Box mt={2}>
                <Typography variant="h6" gutterBottom>
                  {previewFile.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {previewFile.description}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaUploader;

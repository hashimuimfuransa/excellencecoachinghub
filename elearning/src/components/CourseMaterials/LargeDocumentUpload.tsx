import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  CloudUpload,
  Description,
  CheckCircle,
  Error,
  Refresh,
  Visibility,
  Edit,
  Delete,
  Publish,
  VisibilityOff,
  Schedule,
  FileDownload,
  Info
} from '@mui/icons-material';
import { largeDocumentService, IProcessedCourseMaterial, IProcessingStatus } from '../../services/largeDocumentService';

interface LargeDocumentUploadProps {
  courseId: string;
  onUploadSuccess?: () => void;
}

const LargeDocumentUpload: React.FC<LargeDocumentUploadProps> = ({ courseId, onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingMaterials, setProcessingMaterials] = useState<IProcessingStatus[]>([]);
  const [processedMaterials, setProcessedMaterials] = useState<IProcessedCourseMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<IProcessedCourseMaterial | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load processing status and processed materials
  const loadMaterials = async () => {
    try {
      setLoading(true);
      const [processingStatus, processedData] = await Promise.all([
        largeDocumentService.getProcessingStatus(courseId),
        largeDocumentService.getProcessedCourseMaterials(courseId)
      ]);
      
      setProcessingMaterials(processingStatus.processingMaterials);
      setProcessedMaterials(processedData.processedMaterials);
    } catch (err) {
      console.error('Error loading materials:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFile = async (file: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'application/rtf'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('File type not supported. Please upload PDF, Word, PowerPoint, or text files.');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size too large. Please upload files smaller than 50MB.');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await largeDocumentService.uploadLargeDocument(courseId, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setSuccess(result.message);
      onUploadSuccess?.();
      
      // Reload materials to show processing status
      setTimeout(() => {
        loadMaterials();
      }, 1000);

    } catch (err) {
      const errorMessage = err && typeof err === 'object' && 'message' in err 
        ? (err as Error).message 
        : 'Failed to upload document';
      setError(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Refresh processing status
  const refreshStatus = () => {
    loadMaterials();
  };

  // View material details
  const viewMaterial = (material: IProcessedCourseMaterial) => {
    setSelectedMaterial(material);
    setViewDialogOpen(true);
  };

  // Toggle material publish status
  const togglePublish = async (material: IProcessedCourseMaterial) => {
    try {
      await largeDocumentService.updateProcessedMaterial(courseId, material._id, {
        isPublished: !material.isPublished
      });
      loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update material');
    }
  };

  // Delete material
  const deleteMaterial = async (material: IProcessedCourseMaterial) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      try {
        await largeDocumentService.deleteProcessedMaterial(courseId, material._id);
        loadMaterials();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete material');
      }
    }
  };

  // Load materials on component mount
  React.useEffect(() => {
    loadMaterials();
  }, [courseId]);

  return (
    <Box>
      {/* Upload Area */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📚 Upload Large Document for AI Processing
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload large documents (PDF, Word, PowerPoint) and our AI will automatically organize them into sub-units for better student learning experience.
          </Typography>

          {/* Drag and Drop Area */}
          <Paper
            elevation={dragActive ? 8 : 2}
            sx={{
              p: 4,
              textAlign: 'center',
              border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
              backgroundColor: dragActive ? '#f5f5f5' : 'transparent',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#f5f5f5',
                borderColor: '#1976d2'
              }
            }}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {dragActive ? 'Drop your document here' : 'Drag & drop your document here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to browse files
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Supported formats: PDF, Word, PowerPoint, Text files (Max 50MB)
            </Typography>
          </Paper>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.rtf"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Uploading document...
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          {/* Error/Success Messages */}
          {error && (
            <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {processingMaterials.length > 0 && (
        <Card elevation={2} sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                🔄 Processing Status
              </Typography>
              <IconButton onClick={refreshStatus} size="small">
                <Refresh />
              </IconButton>
            </Box>
            
            <List>
              {processingMaterials.map((material, index) => (
                <React.Fragment key={material._id}>
                  <ListItem>
                    <ListItemIcon>
                      {material.processingStatus === 'completed' ? (
                        <CheckCircle color="success" />
                      ) : material.processingStatus === 'failed' ? (
                        <Error color="error" />
                      ) : (
                        <Schedule color="warning" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={material.originalFileName}
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Status: {material.processingStatus} ({material.processingProgress}%)
                          </Typography>
                          {material.processingError && (
                            <Typography variant="caption" color="error" display="block">
                              Error: {material.processingError}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                    {material.processingStatus === 'processing' && (
                      <CircularProgress size={24} />
                    )}
                  </ListItem>
                  {index < processingMaterials.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Processed Materials */}
      <Card elevation={2}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              📖 Processed Materials
            </Typography>
            <IconButton onClick={refreshStatus} size="small">
              <Refresh />
            </IconButton>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : processedMaterials.length === 0 ? (
            <Typography variant="body2" color="text.secondary" textAlign="center" p={3}>
              No processed materials yet. Upload a document to get started.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {processedMaterials.map((material) => (
                <Grid item xs={12} md={6} key={material._id}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                      <Typography variant="subtitle1" noWrap sx={{ flex: 1, mr: 1 }}>
                        {material.originalFileName}
                      </Typography>
                      <Box>
                        <Tooltip title={material.isPublished ? 'Unpublish' : 'Publish'}>
                          <IconButton
                            size="small"
                            onClick={() => togglePublish(material)}
                            color={material.isPublished ? 'success' : 'default'}
                          >
                            {material.isPublished ? <Publish /> : <VisibilityOff />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => viewMaterial(material)}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => deleteMaterial(material)} color="error">
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    
                    <Box display="flex" gap={1} mb={1}>
                      <Chip
                        label={`${material.totalSubUnits} sub-units`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={largeDocumentService.formatReadingTime(material.estimatedTotalReadingTime)}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                      <Chip
                        label={material.difficultyLevel}
                        size="small"
                        sx={{
                          backgroundColor: largeDocumentService.getDifficultyColor(material.difficultyLevel),
                          color: 'white'
                        }}
                      />
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary">
                      {material.views} views • {largeDocumentService.formatFileSize(material.fileSize)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Material Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMaterial?.originalFileName}
        </DialogTitle>
        <DialogContent>
          {selectedMaterial && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Sub-units: {selectedMaterial.totalSubUnits}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Reading Time: {largeDocumentService.formatReadingTime(selectedMaterial.estimatedTotalReadingTime)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Difficulty: {selectedMaterial.difficultyLevel}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Views: {selectedMaterial.views}
                  </Typography>
                </Grid>
              </Grid>
              
              {selectedMaterial.topics.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Topics:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {selectedMaterial.topics.map((topic, index) => (
                      <Chip key={index} label={topic} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {selectedMaterial.keywords.length > 0 && (
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Keywords:
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {selectedMaterial.keywords.slice(0, 10).map((keyword, index) => (
                      <Chip key={index} label={keyword} size="small" color="secondary" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LargeDocumentUpload;

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Archive as ArchiveIcon,
  Assignment as AssignmentIcon,
  Send as SendIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { Assignment } from '../../services/assignmentService';

interface AssignmentSubmissionDialogProps {
  open: boolean;
  onClose: () => void;
  assignment: Assignment;
  onSubmit: (submissionData: {
    submissionText?: string;
    attachments: Array<{
      filename: string;
      originalName: string;
      fileUrl: string;
      fileSize: number;
    }>;
  }) => Promise<void>;
}

interface UploadedFile {
  file: File;
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  uploading: boolean;
  error?: string;
}

const AssignmentSubmissionDialog: React.FC<AssignmentSubmissionDialogProps> = ({
  open,
  onClose,
  assignment,
  onSubmit
}) => {
  const [submissionText, setSubmissionText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File upload handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    
    for (const file of acceptedFiles) {
      // Validate file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > assignment.maxFileSize) {
        setError(`File "${file.name}" exceeds maximum size of ${assignment.maxFileSize}MB`);
        continue;
      }

      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension && !assignment.allowedFileTypes.includes(fileExtension)) {
        setError(`File type .${fileExtension} is not allowed. Allowed types: ${assignment.allowedFileTypes.join(', ')}`);
        continue;
      }

      // Add file to upload queue
      const uploadFile: UploadedFile = {
        file,
        filename: '',
        originalName: file.name,
        fileUrl: '',
        fileSize: file.size,
        uploading: true
      };

      setUploadedFiles(prev => [...prev, uploadFile]);

      try {
        // Upload file to backend
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/assignments/${assignment._id}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        
        // Update file with upload result
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file === file 
              ? {
                  ...f,
                  filename: result.data.filename,
                  fileUrl: result.data.fileUrl,
                  uploading: false
                }
              : f
          )
        );
      } catch (uploadError: any) {
        console.error('File upload error:', uploadError);
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file === file 
              ? { ...f, uploading: false, error: uploadError.message }
              : f
          )
        );
      }
    }
  }, [assignment]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: assignment.submissionType === 'text'
  });

  // Remove uploaded file
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Get file icon based on type
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <PdfIcon />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <ImageIcon />;
      case 'zip':
      case 'rar':
        return <ArchiveIcon />;
      default:
        return <DocumentIcon />;
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    setError(null);
    
    // Validate submission based on type
    if (assignment.submissionType === 'text' && !submissionText.trim()) {
      setError('Text submission is required');
      return;
    }

    if (assignment.submissionType === 'file' && uploadedFiles.length === 0) {
      setError('File submission is required');
      return;
    }

    if (assignment.submissionType === 'both' && !submissionText.trim() && uploadedFiles.length === 0) {
      setError('Either text submission or file upload is required');
      return;
    }

    // Check if any files are still uploading
    const stillUploading = uploadedFiles.some(f => f.uploading);
    if (stillUploading) {
      setError('Please wait for all files to finish uploading');
      return;
    }

    // Check for upload errors
    const hasErrors = uploadedFiles.some(f => f.error);
    if (hasErrors) {
      setError('Please resolve file upload errors before submitting');
      return;
    }

    try {
      setSubmitting(true);
      
      const submissionData = {
        submissionText: submissionText.trim() || undefined,
        attachments: uploadedFiles.map(f => ({
          filename: f.filename,
          originalName: f.originalName,
          fileUrl: f.fileUrl,
          fileSize: f.fileSize
        }))
      };

      await onSubmit(submissionData);
      
      // Reset form
      setSubmissionText('');
      setUploadedFiles([]);
      onClose();
    } catch (submitError: any) {
      setError(submitError.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if assignment is overdue
  const isOverdue = new Date() > new Date(assignment.dueDate);
  const timeRemaining = new Date(assignment.dueDate).getTime() - new Date().getTime();
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24));

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AssignmentIcon />
        Submit Assignment: {assignment.title}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {/* Assignment Info */}
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.1)' }}>
            <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.9)' }}>
              <strong>Due Date:</strong> {new Date(assignment.dueDate).toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.9)' }}>
              <strong>Max Points:</strong> {assignment.maxPoints}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: 'rgba(255,255,255,0.9)' }}>
              <strong>Submission Type:</strong> {assignment.submissionType}
            </Typography>
            {isOverdue ? (
              <Chip label="OVERDUE" color="error" size="small" />
            ) : (
              <Chip 
                label={daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Due today'} 
                color={daysRemaining <= 1 ? 'warning' : 'success'} 
                size="small" 
              />
            )}
          </Paper>

          {/* Instructions */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Instructions:
          </Typography>
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.1)' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', whiteSpace: 'pre-wrap' }}>
              {assignment.instructions}
            </Typography>
          </Paper>

          {/* Text Submission */}
          {(assignment.submissionType === 'text' || assignment.submissionType === 'both') && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Text Submission:
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={8}
                placeholder="Enter your submission text here..."
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'white'
                    }
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255, 255, 255, 0.7)'
                  }
                }}
              />
            </Box>
          )}

          {/* File Upload */}
          {(assignment.submissionType === 'file' || assignment.submissionType === 'both') && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                File Upload:
              </Typography>
              
              {/* Dropzone */}
              <Paper
                {...getRootProps()}
                sx={{
                  p: 3,
                  border: '2px dashed rgba(255,255,255,0.3)',
                  borderRadius: 2,
                  bgcolor: isDragActive ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  mb: 2,
                  transition: 'all 0.3s ease'
                }}
              >
                <input {...getInputProps()} />
                <UploadIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.7)', mb: 1 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Allowed types: {assignment.allowedFileTypes.join(', ')} • Max size: {assignment.maxFileSize}MB
                </Typography>
              </Paper>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <Paper sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
                  <List>
                    {uploadedFiles.map((file, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemIcon sx={{ color: 'white' }}>
                            {file.uploading ? (
                              <CircularProgress size={24} sx={{ color: 'white' }} />
                            ) : (
                              getFileIcon(file.originalName)
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={file.originalName}
                            secondary={
                              <Box>
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                                  {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                </Typography>
                                {file.uploading && (
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', ml: 1 }}>
                                    • Uploading...
                                  </Typography>
                                )}
                                {file.error && (
                                  <Typography variant="caption" sx={{ color: 'error.main', ml: 1 }}>
                                    • {file.error}
                                  </Typography>
                                )}
                              </Box>
                            }
                            sx={{ color: 'white' }}
                          />
                          <ListItemSecondaryAction>
                            <IconButton
                              edge="end"
                              onClick={() => removeFile(index)}
                              sx={{ color: 'white' }}
                              disabled={file.uploading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < uploadedFiles.length - 1 && <Divider sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              )}
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
              {error}
            </Alert>
          )}

          {/* Overdue Warning */}
          {isOverdue && (
            <Alert severity="warning" sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
              This assignment is overdue. Late submissions may be penalized.
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} disabled={submitting} sx={{ color: 'white' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <SendIcon />}
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.9)'
            }
          }}
        >
          {submitting ? 'Submitting...' : 'Submit Assignment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignmentSubmissionDialog;
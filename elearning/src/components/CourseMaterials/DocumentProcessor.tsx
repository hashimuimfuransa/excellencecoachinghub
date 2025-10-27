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
  CircularProgress
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  CheckCircle,
  Error,
  Description,
  ExpandMore,
  Schedule,
  Person,
  TrendingUp,
  MenuBook,
  Lightbulb,
  Timer
} from '@mui/icons-material';
import DocumentProcessorService, { StructuredNotes, DocumentProcessingResult } from '../../services/documentProcessorService';

interface DocumentProcessorProps {
  courseId?: string;
  weekId?: string;
  onProcessingComplete: (result: DocumentProcessingResult) => void;
  onProcessingError: (error: string) => void;
}

interface ProcessingFile {
  file: File;
  id: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  result?: DocumentProcessingResult;
  error?: string;
  estimatedTime?: number;
}

const DocumentProcessor: React.FC<DocumentProcessorProps> = ({
  courseId,
  weekId,
  onProcessingComplete,
  onProcessingError
}) => {
  const [files, setFiles] = useState<ProcessingFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewResult, setPreviewResult] = useState<DocumentProcessingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentProcessor = DocumentProcessorService.getInstance();

  const getFileIcon = (mimeType: string) => {
    return documentProcessor.getFileTypeIcon(mimeType);
  };

  const formatFileSize = (bytes: number) => {
    return documentProcessor.formatFileSize(bytes);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    const newFiles: ProcessingFile[] = selectedFiles.map(file => {
      const validation = documentProcessor.validateFile(file);
      const estimatedTime = documentProcessor.estimateProcessingTime(file.size);
      
      return {
        file,
        id: Math.random().toString(36).substr(2, 9),
        progress: 0,
        status: validation.isValid ? 'uploading' : 'error',
        error: validation.error,
        estimatedTime
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    
    // Start processing valid files
    newFiles.forEach(processingFile => {
      if (processingFile.status === 'uploading') {
        processDocument(processingFile);
      }
    });
  };

  const processDocument = async (processingFile: ProcessingFile) => {
    try {
      setIsProcessing(true);
      
      // Update status to processing
      setFiles(prev => prev.map(f => 
        f.id === processingFile.id 
          ? { ...f, status: 'processing', progress: 10 }
          : f
      ));

      // Process the document
      const result = await documentProcessor.processDocument(
        processingFile.file,
        title || processingFile.file.name.replace(/\.[^/.]+$/, ""),
        description,
        courseId,
        weekId
      );

      // Update status to completed
      setFiles(prev => prev.map(f => 
        f.id === processingFile.id 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100, 
              result 
            }
          : f
      ));

      onProcessingComplete(result);
      
    } catch (error: any) {
      console.error('Document processing error:', error);
      
      setFiles(prev => prev.map(f => 
        f.id === processingFile.id 
          ? { 
              ...f, 
              status: 'error', 
              error: error.message || 'Processing failed' 
            }
          : f
      ));

      onProcessingError(error.message || 'Document processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePreview = (result: DocumentProcessingResult) => {
    setPreviewResult(result);
    setPreviewDialogOpen(true);
  };

  const completedFiles = files.filter(f => f.status === 'completed');
  const errorFiles = files.filter(f => f.status === 'error');
  const processingFiles = files.filter(f => f.status === 'processing');

  return (
    <Box>
      {/* Upload Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Process Document with AI
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Upload PDF, Word, or text documents to automatically extract and structure content using Gemini AI.
          </Typography>
          
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Document Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this document"
            />
            
            <TextField
              fullWidth
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={2}
              placeholder="Brief description of the document content"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Upload Area */}
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
          Upload Document for AI Processing
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Click to select documents or drag and drop them here
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Supports: PDF, Word documents, Text files (Max 50MB each)
        </Typography>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.rtf,.md"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </Paper>

      {/* Processing Progress */}
      {files.length > 0 && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Processing Status
            </Typography>
            
            <Stack spacing={2}>
              {files.map(file => (
                <Box key={file.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <Typography variant="h6" sx={{ mr: 1 }}>
                        {getFileIcon(file.file.type)}
                      </Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" noWrap>
                          {file.file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatFileSize(file.file.size)}
                          {file.estimatedTime && ` • Est. ${file.estimatedTime}s`}
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
                      {file.status === 'processing' && (
                        <CircularProgress size={20} />
                      )}
                      <IconButton 
                        size="small" 
                        onClick={() => removeFile(file.id)}
                        disabled={file.status === 'processing'}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  {file.status === 'processing' && (
                    <LinearProgress 
                      variant="determinate" 
                      value={file.progress} 
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  )}
                  
                  {file.status === 'completed' && (
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label="Processing Complete" 
                        color="success" 
                        size="small" 
                        icon={<CheckCircle />}
                      />
                      {file.result && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handlePreview(file.result!)}
                        >
                          Preview Notes
                        </Button>
                      )}
                    </Box>
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
                  {completedFiles.length} document(s) processed successfully
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing Status Summary */}
      {isProcessing && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Processing {processingFiles.length} document(s)... Please don't close this page.
        </Alert>
      )}

      {errorFiles.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {errorFiles.length} document(s) failed to process. Please try again.
        </Alert>
      )}

      {/* Preview Dialog */}
      <Dialog 
        open={previewDialogOpen} 
        onClose={() => setPreviewDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Document Processing Preview
        </DialogTitle>
        <DialogContent>
          {previewResult?.material?.content.structuredNotes && (
            <StructuredNotesPreview 
              notes={previewResult.material.content.structuredNotes}
              stats={previewResult.processingStats}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>
            Close
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (previewResult) {
                onProcessingComplete(previewResult);
                setPreviewDialogOpen(false);
              }
            }}
          >
            Use This Content
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Component to preview structured notes
const StructuredNotesPreview: React.FC<{
  notes: StructuredNotes;
  stats?: any;
}> = ({ notes, stats }) => {
  return (
    <Box>
      {/* Document Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {notes.title}
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Chip 
              icon={<MenuBook />} 
              label={`${notes.metadata.totalSections} Sections`} 
              size="small" 
            />
            <Chip 
              icon={<Timer />} 
              label={`${notes.metadata.estimatedReadingTime} min read`} 
              size="small" 
            />
            <Chip 
              icon={<TrendingUp />} 
              label={notes.metadata.difficulty} 
              size="small" 
              color={notes.metadata.difficulty === 'beginner' ? 'success' : 
                     notes.metadata.difficulty === 'intermediate' ? 'warning' : 'error'}
            />
          </Box>

          <Typography variant="body1" paragraph>
            {notes.summary}
          </Typography>

          {/* Key Topics */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Key Topics:
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {notes.metadata.topics.map((topic, index) => (
                <Chip key={index} label={topic} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>

          {/* Key Points */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Key Points:
            </Typography>
            <List dense>
              {notes.keyPoints.map((point, index) => (
                <ListItem key={index} sx={{ pl: 0 }}>
                  <ListItemIcon>
                    <Lightbulb color="primary" />
                  </ListItemIcon>
                  <ListItemText primary={point} />
                </ListItem>
              ))}
            </List>
          </Box>
        </CardContent>
      </Card>

      {/* Sections */}
      <Typography variant="h6" gutterBottom>
        Document Sections
      </Typography>
      
      {notes.sections.map((section, index) => (
        <Accordion key={index} defaultExpanded={index === 0}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">
              {section.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" paragraph>
              {section.content}
            </Typography>
            
            {section.keyPoints.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Key Points:
                </Typography>
                <List dense>
                  {section.keyPoints.map((point, pointIndex) => (
                    <ListItem key={pointIndex} sx={{ pl: 0 }}>
                      <ListItemIcon>
                        <Lightbulb color="secondary" />
                      </ListItemIcon>
                      <ListItemText primary={point} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Processing Stats */}
      {stats && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Processing Statistics
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                icon={<Schedule />} 
                label={`${Math.round(stats.processingTime / 1000)}s processing`} 
                size="small" 
              />
              <Chip 
                label={`${stats.textLength} characters extracted`} 
                size="small" 
              />
              <Chip 
                label={`${stats.sectionsCount} sections created`} 
                size="small" 
              />
              <Chip 
                label={`${stats.keyPointsCount} key points identified`} 
                size="small" 
              />
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DocumentProcessor;

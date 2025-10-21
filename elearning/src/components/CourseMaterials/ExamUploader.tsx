import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  FormControlLabel,
  Switch,
  Paper,
  LinearProgress
} from '@mui/material';
import {
  CloudUpload,
  Quiz,
  Assignment,
  AccessTime,
  CheckCircle,
  Error as ErrorIcon,
  Description
} from '@mui/icons-material';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import api from '../../services/api';

interface ExamUploaderProps {
  courseId: string;
  weekId: string;
  onUploadComplete: (examData: any) => void;
  onUploadError?: (error: string) => void;
}

interface ExamFormData {
  title: string;
  description: string;
  examType: 'quiz' | 'general_exam';
  timeLimit: number;
  totalMarks: number;
  passingScore: number;
  attempts: number;
  instructions: string;
  isTimed: boolean;
  allowReview: boolean;
}

const ExamUploader: React.FC<ExamUploaderProps> = ({
  courseId,
  weekId,
  onUploadComplete,
  onUploadError
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'extracting' | 'success' | 'error'>('idle');
  const [extractionStatus, setExtractionStatus] = useState<string>('');
  const [extractedQuestions, setExtractedQuestions] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [examForm, setExamForm] = useState<ExamFormData>({
    title: '',
    description: '',
    examType: 'quiz',
    timeLimit: 60,
    totalMarks: 100,
    passingScore: 50,
    attempts: 3,
    instructions: '',
    isTimed: true,
    allowReview: true
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a valid exam file (PDF, DOC, DOCX, or TXT)');
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setError(null);
      
      // Auto-fill title if empty
      if (!examForm.title) {
        const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
        setExamForm(prev => ({ ...prev, title: fileName }));
      }
    }
  };

  const handleFormChange = (field: keyof ExamFormData, value: any) => {
    setExamForm(prev => ({ ...prev, [field]: value }));
  };

  const handleUpload = async () => {
    if (!file || !examForm.title || !examForm.description) {
      setError('Please fill in all required fields and select a file');
      return;
    }

    setUploading(true);
    setUploadStatus('uploading');
    setError(null);

    try {
      setUploadProgress(20);
      setUploadStatus('processing');
      setExtractionStatus('Preparing document for processing...');

      // Create FormData for direct file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', examForm.title);
      formData.append('description', examForm.description);
      formData.append('examType', examForm.examType);
      formData.append('courseId', courseId || '');
      formData.append('weekId', weekId || '');
      formData.append('examSettings', JSON.stringify({
        timeLimit: examForm.timeLimit,
        totalMarks: examForm.totalMarks,
        passingScore: examForm.passingScore,
        attempts: examForm.attempts,
        instructions: examForm.instructions,
        isTimed: examForm.isTimed,
        allowReview: examForm.allowReview
      }));

      setUploadProgress(40);
      setExtractionStatus('Sending document to exam processor...');

      setUploadStatus('extracting');
      setExtractionStatus('Extracting questions from document...');
      setUploadProgress(70);

      // Send to backend for processing using new exam processor with direct file upload
      const response = await api.post('/exams/process', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadProgress(90);
      setExtractionStatus('Finalizing exam structure...');

      setUploadProgress(100);
      setUploadStatus('success');
      
      // Show extraction results
      if (response.data.data.processingStats) {
        const stats = response.data.data.processingStats;
        const extractionMethod = stats.extractionMethod || 'AI';
        const questionTypes = stats.questionTypes || {};
        
        setExtractionStatus(`Successfully extracted ${stats.questionsCount} questions using ${extractionMethod}`);
        setExtractedQuestions(stats.questionsCount);
        setTotalQuestions(stats.questionsCount);
        
        // Log detailed extraction stats
        console.log('📊 Exam Extraction Statistics:', {
          totalQuestions: stats.questionsCount,
          extractionMethod: extractionMethod,
          questionTypes: questionTypes,
          totalMarks: stats.totalMarks,
          averagePointsPerQuestion: stats.averagePointsPerQuestion
        });
      }

      // Prepare the material data for the week service
      const materialData = {
        title: examForm.title,
        description: examForm.description,
        type: 'exam',
        examType: examForm.examType,
        url: '', // No URL needed for direct processing
        examSettings: {
          timeLimit: examForm.timeLimit,
          totalMarks: examForm.totalMarks,
          passingScore: examForm.passingScore,
          attempts: examForm.attempts,
          instructions: examForm.instructions,
          isTimed: examForm.isTimed,
          allowReview: examForm.allowReview
        },
        content: {
          ...response.data.data.examMaterial?.content,
          originalFileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          processedAt: new Date().toISOString()
        },
        order: 1,
        estimatedDuration: examForm.timeLimit,
        isRequired: true,
        isPublished: true
      };

      // Call success callback with the properly formatted material data
      onUploadComplete(materialData);

      // Reset form
      setFile(null);
      setExamForm({
        title: '',
        description: '',
        examType: 'quiz',
        timeLimit: 60,
        totalMarks: 100,
        passingScore: 50,
        attempts: 3,
        instructions: '',
        isTimed: true,
        allowReview: true
      });

    } catch (error: any) {
      console.error('Exam upload error:', error);
      setUploadStatus('error');
      
      // Show specific error messages for different failure types
      const errorMessage = error.response?.data?.message || error.message || 'Failed to upload exam';
      if (errorMessage.includes('AI extraction service failed')) {
        setExtractionStatus('AI extraction service unavailable. Using intelligent fallback questions.');
      } else if (errorMessage.includes('No questions extracted')) {
        setExtractionStatus('Could not extract questions from document. Using sample questions based on exam title.');
      } else if (errorMessage.includes('Failed to process exam document')) {
        setExtractionStatus('Document processing failed. Please try again or contact support.');
      } else {
        setExtractionStatus('An error occurred during exam processing.');
      }
      
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'success':
        return <CheckCircle color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'uploading':
      case 'processing':
        return <CircularProgress size={24} />;
      default:
        return <CloudUpload />;
    }
  };

  const getStatusText = () => {
    switch (uploadStatus) {
      case 'success':
        return 'Exam uploaded and processed successfully!';
      case 'error':
        return 'Upload failed';
      case 'uploading':
        return 'Uploading file...';
      case 'processing':
        return 'Processing exam content...';
      default:
        return 'Ready to upload';
    }
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Quiz sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="h2">
            Upload Exam Material
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* File Upload Section */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
              <input
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
                id="exam-file-upload"
                type="file"
                onChange={handleFileChange}
              />
              <label htmlFor="exam-file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUpload />}
                  disabled={uploading}
                  sx={{ mb: 2 }}
                >
                  Choose Exam File
                </Button>
              </label>
              
              {file && (
                <Box mt={2}>
                  <Chip
                    icon={<Description />}
                    label={file.name}
                    onDelete={() => setFile(null)}
                    color="primary"
                    variant="outlined"
                  />
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
              )}

              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {uploadStatus === 'uploading' && 'Uploading file...'}
                      {uploadStatus === 'processing' && 'Processing document...'}
                      {uploadStatus === 'extracting' && 'Extracting questions...'}
                      {uploadStatus === 'success' && 'Upload complete!'}
                    </Typography>
                    <Typography variant="body2" color="primary" sx={{ ml: 'auto' }}>
                      {uploadProgress}%
                    </Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  
                  {/* Extraction Status */}
                  {extractionStatus && (
                    <Box sx={{ mt: 1, p: 1, bgcolor: uploadStatus === 'error' ? 'error.50' : 'primary.50', borderRadius: 1 }}>
                      <Typography variant="caption" color={uploadStatus === 'error' ? 'error.main' : 'primary'}>
                        {extractionStatus}
                      </Typography>
                      {extractedQuestions > 0 && uploadStatus === 'success' && (
                        <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>
                          ✓ {extractedQuestions} questions extracted successfully using Gemini AI
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Exam Details Form */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Exam Title"
              value={examForm.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              required
              disabled={uploading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth disabled={uploading}>
              <InputLabel>Exam Type</InputLabel>
              <Select
                value={examForm.examType}
                onChange={(e) => handleFormChange('examType', e.target.value)}
                label="Exam Type"
              >
                <MenuItem value="quiz">
                  <Box display="flex" alignItems="center">
                    <Quiz sx={{ mr: 1 }} />
                    Quiz
                  </Box>
                </MenuItem>
                <MenuItem value="general_exam">
                  <Box display="flex" alignItems="center">
                    <Assignment sx={{ mr: 1 }} />
                    General Exam
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={examForm.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              multiline
              rows={3}
              required
              disabled={uploading}
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Exam Settings
              </Typography>
            </Divider>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Time Limit (minutes)"
              type="number"
              value={examForm.timeLimit}
              onChange={(e) => handleFormChange('timeLimit', parseInt(e.target.value))}
              disabled={uploading}
              InputProps={{
                startAdornment: <AccessTime sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Total Marks"
              type="number"
              value={examForm.totalMarks}
              onChange={(e) => handleFormChange('totalMarks', parseInt(e.target.value))}
              disabled={uploading}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Passing Score (%)"
              type="number"
              value={examForm.passingScore}
              onChange={(e) => handleFormChange('passingScore', parseInt(e.target.value))}
              disabled={uploading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max Attempts"
              type="number"
              value={examForm.attempts}
              onChange={(e) => handleFormChange('attempts', parseInt(e.target.value))}
              disabled={uploading}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Instructions"
              value={examForm.instructions}
              onChange={(e) => handleFormChange('instructions', e.target.value)}
              disabled={uploading}
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={examForm.isTimed}
                    onChange={(e) => handleFormChange('isTimed', e.target.checked)}
                    disabled={uploading}
                  />
                }
                label="Timed Exam"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={examForm.allowReview}
                    onChange={(e) => handleFormChange('allowReview', e.target.checked)}
                    disabled={uploading}
                  />
                }
                label="Allow Review"
              />
            </Box>
          </Grid>

          {/* Upload Status */}
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" justifyContent="center" p={2}>
              {getStatusIcon()}
              <Typography variant="body2" sx={{ ml: 1 }}>
                {getStatusText()}
              </Typography>
            </Box>
            
            {uploadStatus === 'uploading' || uploadStatus === 'processing' ? (
              <Box width="100%" mt={1}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="caption">Progress</Typography>
                  <Typography variant="caption">{uploadProgress}%</Typography>
                </Box>
                <Box
                  sx={{
                    width: '100%',
                    height: 8,
                    backgroundColor: 'grey.200',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: 'primary.main',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
              </Box>
            ) : null}
          </Grid>

          {/* Upload Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={uploading || !file || !examForm.title || !examForm.description}
              fullWidth
              size="large"
              startIcon={uploading ? <CircularProgress size={20} /> : <CloudUpload />}
            >
              {uploading ? 'Uploading...' : 'Upload Exam'}
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default ExamUploader;

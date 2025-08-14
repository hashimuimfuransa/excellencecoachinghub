import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Grid,
  Paper,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  AppBar,
  Toolbar,
  Fab,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Assignment,
  Save,
  CloudUpload,
  AttachFile,
  Delete,
  Download,
  Send,
  AutoAwesome,
  Timer,
  CheckCircle,
  Warning,
  Info,
  Visibility,
  Edit,
  History,
  Grade,
  Feedback,
  ArrowBack,
  Psychology,
  School
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { assignmentService } from '../../services/assignmentService';
import { fileUploadService } from '../../services/fileUploadService';
import AIGradingService from '../../services/aiGradingService';
import RichTextEditor from '../../components/RichTextEditor/RichTextEditor';

interface AssignmentData {
  _id: string;
  title: string;
  description: string;
  instructions: string;
  dueDate: Date;
  maxPoints: number;
  submissionType: 'file' | 'text' | 'both';
  allowedFileTypes: string[];
  maxFileSize: number;
  isRequired: boolean;
  status: 'draft' | 'published' | 'closed';
  course: {
    _id: string;
    title: string;
  };
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  assignmentDocument?: {
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
  };
}

interface Submission {
  _id: string;
  submissionText?: string;
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  submittedAt?: Date;
  isLate: boolean;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  aiGrade?: {
    score: number;
    feedback: string;
    confidence: number;
    gradedAt: Date;
  };
  gradedAt?: Date;
  gradedBy?: string;
  version: number;
  autoSavedAt: Date;
}

interface SubmissionHistory {
  _id: string;
  version: number;
  submissionText?: string;
  attachments: any[];
  savedAt: Date;
  autoSaved: boolean;
}

const WorkOnAssignment: React.FC = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Assignment state
  const [assignment, setAssignment] = useState<AssignmentData | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Work state
  const [submissionText, setSubmissionText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<any[]>([]);
  const [autoSaving, setAutoSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // UI state
  const [tabValue, setTabValue] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [submissionHistory, setSubmissionHistory] = useState<SubmissionHistory[]>([]);
  const [aiGradingEnabled, setAiGradingEnabled] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Refs
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const lastSaveRef = useRef<string>('');

  // Load assignment and submission
  useEffect(() => {
    const loadAssignmentData = async () => {
      if (!assignmentId) return;

      try {
        setLoading(true);
        
        // Load assignment details
        const assignmentData = await assignmentService.getAssignmentById(assignmentId);
        setAssignment(assignmentData);
        
        // Load existing submission if any
        try {
          const submissionData = await assignmentService.getSubmissionByAssignment(assignmentId);
          if (submissionData) {
            setSubmission(submissionData);
            setSubmissionText(submissionData.submissionText || '');
            setExistingAttachments(submissionData.attachments || []);
            lastSaveRef.current = submissionData.submissionText || '';
          }
        } catch (submissionError) {
          // No existing submission, that's fine
          console.log('No existing submission found');
        }
        
      } catch (err: any) {
        setError(err.message || 'Failed to load assignment');
      } finally {
        setLoading(false);
      }
    };

    loadAssignmentData();
  }, [assignmentId]);

  // Auto-save effect
  useEffect(() => {
    if (assignment && (submissionText !== lastSaveRef.current || attachments.length > 0)) {
      setHasUnsavedChanges(true);
      
      // Clear existing timeout
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
      
      // Set new timeout for auto-save
      autoSaveRef.current = setTimeout(() => {
        handleAutoSave();
      }, 5000); // Auto-save after 5 seconds of inactivity
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [submissionText, attachments, assignment]);

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleAutoSave = async () => {
    if (!assignment || !hasUnsavedChanges) return;
    
    try {
      setAutoSaving(true);
      
      // Upload new attachments first
      const uploadedAttachments = [];
      for (const file of attachments) {
        const uploadResult = await fileUploadService.uploadAssignmentFile(
          file, 
          assignment.course._id, 
          assignment._id
        );
        uploadedAttachments.push(uploadResult);
      }
      
      // Save draft
      const draftData = {
        assignmentId: assignment._id,
        submissionText: submissionText.trim() || undefined,
        attachments: [...existingAttachments, ...uploadedAttachments],
        isDraft: true
      };
      
      const savedSubmission = await assignmentService.saveDraft(draftData);
      setSubmission(savedSubmission);
      setExistingAttachments([...existingAttachments, ...uploadedAttachments]);
      setAttachments([]); // Clear new attachments after upload
      setHasUnsavedChanges(false);
      lastSaveRef.current = submissionText;
      
      setSuccess('Work saved automatically');
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (error: any) {
      console.error('Auto-save failed:', error);
      setError('Failed to auto-save. Please save manually.');
    } finally {
      setAutoSaving(false);
    }
  };

  const handleManualSave = async () => {
    await handleAutoSave();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file types
    if (assignment?.allowedFileTypes.length) {
      const invalidFiles = files.filter(file => {
        const extension = file.name.split('.').pop()?.toLowerCase();
        return !assignment.allowedFileTypes.includes(extension || '');
      });
      
      if (invalidFiles.length > 0) {
        setError(`Invalid file types: ${invalidFiles.map(f => f.name).join(', ')}`);
        return;
      }
    }
    
    // Validate file sizes
    const oversizedFiles = files.filter(file => 
      file.size > (assignment?.maxFileSize || 10) * 1024 * 1024
    );
    
    if (oversizedFiles.length > 0) {
      setError(`Files too large: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    setAttachments(prev => [...prev, ...files]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveAttachment = (index: number, isExisting: boolean = false) => {
    if (isExisting) {
      setExistingAttachments(prev => prev.filter((_, i) => i !== index));
    } else {
      setAttachments(prev => prev.filter((_, i) => i !== index));
    }
    setHasUnsavedChanges(true);
  };

  const handleSubmitAssignment = async () => {
    if (!assignment) return;

    try {
      setLoading(true);
      
      // First save current work
      await handleAutoSave();
      
      // Then submit
      const submissionData = {
        assignmentId: assignment._id,
        submissionText: submissionText.trim() || undefined,
        attachments: existingAttachments,
        finalSubmission: true
      };

      const result = await assignmentService.submitAssignment(submissionData);
      
      // AI Grading if enabled
      if (aiGradingEnabled && submissionText.trim()) {
        try {
          const aiGradingResult = await AIGradingService.gradeAssignment(assignment, submissionText);
          await assignmentService.updateAIGrade(result._id, aiGradingResult);
          setSuccess('Assignment submitted and AI grading completed!');
        } catch (aiError) {
          console.error('AI grading failed:', aiError);
          setSuccess('Assignment submitted successfully! (AI grading will be processed later)');
        }
      } else {
        setSuccess('Assignment submitted successfully!');
      }
      
      setSubmission(result);
      setSubmitDialogOpen(false);
      setHasUnsavedChanges(false);
      
      // Navigate to results after a delay
      setTimeout(() => {
        navigate(`/assignment/${assignmentId}/results`);
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Failed to submit assignment');
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissionHistory = async () => {
    if (!assignment) return;
    
    try {
      const history = await assignmentService.getSubmissionHistory(assignment._id);
      setSubmissionHistory(history);
      setHistoryDialogOpen(true);
    } catch (error) {
      setError('Failed to load submission history');
    }
  };

  const downloadAttachment = async (attachment: any) => {
    try {
      const blob = await fileUploadService.downloadFile(attachment.fileUrl);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setError('Failed to download file');
    }
  };

  const getTimeRemaining = () => {
    if (!assignment) return '';
    
    const now = new Date();
    const due = new Date(assignment.dueDate);
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return 'Overdue';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Due soon';
  };

  const getSubmissionStatus = () => {
    if (!submission) return 'Not started';
    if (submission.status === 'submitted') return 'Submitted';
    if (submission.status === 'graded') return 'Graded';
    if (submission.status === 'returned') return 'Returned';
    return 'Draft';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error && !assignment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!assignment) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">Assignment not found</Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Top Bar */}
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>
          <IconButton 
            edge="start" 
            onClick={() => navigate(-1)} 
            sx={{ 
              mr: { xs: 1, md: 2 },
              minWidth: { xs: 40, md: 48 },
              minHeight: { xs: 40, md: 48 }
            }}
          >
            <ArrowBack />
          </IconButton>
          
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1rem', md: '1.25rem' },
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {assignment.title}
          </Typography>
          
          {/* Status Indicators */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, md: 2 }, 
            mr: { xs: 1, md: 2 },
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-end', sm: 'center' }
          }}>
            <Chip 
              label={getSubmissionStatus()} 
              color={submission?.status === 'submitted' ? 'success' : 'default'}
              size="small"
              sx={{ fontSize: { xs: '0.75rem', md: '0.8125rem' } }}
            />
            <Chip 
              label={getTimeRemaining()} 
              color={getTimeRemaining() === 'Overdue' ? 'error' : 'primary'}
              size="small"
              sx={{ fontSize: { xs: '0.75rem', md: '0.8125rem' } }}
            />
          </Box>

          {/* Auto-save indicator */}
          {autoSaving && (
            <Tooltip title="Auto-saving...">
              <CircularProgress size={20} sx={{ mr: { xs: 1, md: 2 } }} />
            </Tooltip>
          )}
          
          {hasUnsavedChanges && (
            <Tooltip title="You have unsaved changes">
              <Warning color="warning" sx={{ mr: { xs: 1, md: 2 } }} />
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>

      {/* Success/Error Alerts */}
      {success && (
        <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Container maxWidth="lg" sx={{ py: { xs: 1, md: 3 } }}>
        <Grid container spacing={{ xs: 2, md: 3 }}>
          {/* Assignment Info Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ mb: 3 }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  fontSize: { xs: '1.1rem', md: '1.25rem' }
                }}>
                  <Assignment color="primary" />
                  Assignment Details
                </Typography>
                
                <Typography variant="body2" color="text.secondary" paragraph>
                  {assignment.description}
                </Typography>
                
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Due Date</Typography>
                    <Typography variant="body1">{new Date(assignment.dueDate).toLocaleDateString()}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Points</Typography>
                    <Typography variant="body1">{assignment.maxPoints}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Submission Type</Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {assignment.submissionType}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Required</Typography>
                    <Typography variant="body1">{assignment.isRequired ? 'Yes' : 'No'}</Typography>
                  </Grid>
                </Grid>
                
                {assignment.allowedFileTypes.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Allowed File Types
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {assignment.allowedFileTypes.map(type => (
                        <Chip key={type} label={type.toUpperCase()} size="small" />
                      ))}
                    </Box>
                  </Box>
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Max file size: {assignment.maxFileSize}MB
                </Typography>
              </CardContent>
            </Card>

            {/* Assignment Document */}
            {assignment.assignmentDocument && (
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Assignment Document
                  </Typography>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon>
                      <AttachFile />
                    </ListItemIcon>
                    <ListItemText
                      primary={assignment.assignmentDocument.originalName}
                      secondary={`${(assignment.assignmentDocument.fileSize / 1024 / 1024).toFixed(2)} MB`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton onClick={() => downloadAttachment(assignment.assignmentDocument)}>
                        <Download />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Save />}
                    onClick={handleManualSave}
                    disabled={!hasUnsavedChanges || autoSaving}
                    fullWidth
                    sx={{
                      minHeight: { xs: 48, md: 36 },
                      fontSize: { xs: '1rem', md: '0.875rem' },
                      textTransform: 'none'
                    }}
                  >
                    {autoSaving ? 'Saving...' : 'Save Work'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<History />}
                    onClick={loadSubmissionHistory}
                    fullWidth
                    sx={{
                      minHeight: { xs: 48, md: 36 },
                      fontSize: { xs: '1rem', md: '0.875rem' },
                      textTransform: 'none'
                    }}
                  >
                    View History
                  </Button>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={aiGradingEnabled}
                        onChange={(e) => setAiGradingEnabled(e.target.checked)}
                      />
                    }
                    label="AI Grading"
                    sx={{ fontSize: { xs: '1rem', md: '0.875rem' } }}
                  />
                  
                  {submission?.status !== 'submitted' && (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={<Send />}
                      onClick={() => setSubmitDialogOpen(true)}
                      disabled={!submissionText.trim() && existingAttachments.length === 0}
                      fullWidth
                      sx={{
                        minHeight: { xs: 48, md: 36 },
                        fontSize: { xs: '1rem', md: '0.875rem' },
                        fontWeight: 'bold',
                        textTransform: 'none',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                          transform: 'translateY(-1px)'
                        }
                      }}
                    >
                      Submit Assignment
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Work Area */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                  <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
                    <Tab label="Instructions" />
                    <Tab label="Work Area" />
                    <Tab label="Attachments" />
                    {submission?.aiGrade && <Tab label="AI Feedback" />}
                  </Tabs>
                </Box>

                {/* Instructions Tab */}
                {tabValue === 0 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Instructions
                    </Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {assignment.instructions}
                    </Typography>
                  </Box>
                )}

                {/* Work Area Tab */}
                {tabValue === 1 && (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Your Work
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={previewMode}
                            onChange={(e) => setPreviewMode(e.target.checked)}
                          />
                        }
                        label="Preview Mode"
                      />
                    </Box>
                    
                    {previewMode ? (
                      <Paper sx={{ p: 3, minHeight: 400, bgcolor: 'grey.50' }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {submissionText || 'No content yet...'}
                        </Typography>
                      </Paper>
                    ) : (
                      <RichTextEditor
                        value={submissionText}
                        onChange={setSubmissionText}
                        placeholder="Start working on your assignment here..."
                        minHeight={400}
                        features={{
                          formatting: true,
                          lists: true,
                          links: true,
                          images: false,
                          tables: true,
                          mathSupport: true,
                          codeBlocks: true
                        }}
                      />
                    )}
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Word count: {submissionText.split(/\s+/).filter(word => word.length > 0).length}
                    </Typography>
                  </Box>
                )}

                {/* Attachments Tab */}
                {tabValue === 2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      File Attachments
                    </Typography>
                    
                    {/* Upload Area */}
                    <Paper
                      sx={{
                        p: 3,
                        mb: 3,
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        textAlign: 'center',
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                      <Typography variant="h6" gutterBottom>
                        Upload Files
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Click to browse or drag and drop files here
                      </Typography>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        hidden
                        onChange={handleFileUpload}
                        accept={assignment.allowedFileTypes.map(type => `.${type}`).join(',')}
                      />
                    </Paper>

                    {/* Existing Attachments */}
                    {existingAttachments.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" gutterBottom>
                          Uploaded Files
                        </Typography>
                        <List>
                          {existingAttachments.map((attachment, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <AttachFile />
                              </ListItemIcon>
                              <ListItemText
                                primary={attachment.originalName}
                                secondary={`${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB - Uploaded ${new Date(attachment.uploadedAt).toLocaleString()}`}
                              />
                              <ListItemSecondaryAction>
                                <IconButton onClick={() => downloadAttachment(attachment)}>
                                  <Download />
                                </IconButton>
                                <IconButton 
                                  onClick={() => handleRemoveAttachment(index, true)}
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* New Attachments */}
                    {attachments.length > 0 && (
                      <Box>
                        <Typography variant="subtitle1" gutterBottom>
                          New Files (will be uploaded on save)
                        </Typography>
                        <List>
                          {attachments.map((file, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <AttachFile />
                              </ListItemIcon>
                              <ListItemText
                                primary={file.name}
                                secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                              />
                              <ListItemSecondaryAction>
                                <IconButton 
                                  onClick={() => handleRemoveAttachment(index, false)}
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </Box>
                )}

                {/* AI Feedback Tab */}
                {tabValue === 3 && submission?.aiGrade && (
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoAwesome color="primary" />
                      AI Feedback
                    </Typography>
                    
                    <Alert severity="info" sx={{ mb: 3 }}>
                      This is preliminary AI feedback. Your instructor will review and provide final grades.
                    </Alert>
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary.main">
                            {submission.aiGrade.score}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            AI Score
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={submission.aiGrade.score} 
                            sx={{ mt: 1 }}
                          />
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="success.main">
                            {Math.round(submission.aiGrade.confidence * 100)}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Confidence
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="info.main">
                            {Math.round((submission.aiGrade.score / 100) * assignment.maxPoints)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Points (out of {assignment.maxPoints})
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Detailed Feedback
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {submission.aiGrade.feedback}
                        </Typography>
                      </Paper>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      AI graded on {new Date(submission.aiGrade.gradedAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)}>
        <DialogTitle>Submit Assignment</DialogTitle>
        <DialogContent>
          <Typography paragraph>
            Are you sure you want to submit your assignment? You cannot make changes after submission.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Text content: {submissionText.trim() ? 'Yes' : 'No'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            File attachments: {existingAttachments.length + attachments.length}
          </Typography>
          {aiGradingEnabled && (
            <Typography variant="body2" color="info.main">
              AI grading will be performed automatically after submission.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitAssignment} 
            variant="contained" 
            color="success"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog 
        open={historyDialogOpen} 
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Submission History</DialogTitle>
        <DialogContent>
          <List>
            {submissionHistory.map((version, index) => (
              <ListItem key={version._id}>
                <ListItemIcon>
                  <History />
                </ListItemIcon>
                <ListItemText
                  primary={`Version ${version.version}`}
                  secondary={`${version.autoSaved ? 'Auto-saved' : 'Manually saved'} on ${new Date(version.savedAt).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Quick Save */}
      {hasUnsavedChanges && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleManualSave}
          disabled={autoSaving}
        >
          {autoSaving ? <CircularProgress size={24} /> : <Save />}
        </Fab>
      )}
    </Box>
  );
};

export default WorkOnAssignment;
import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Snackbar,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
  Avatar,
  Stack,
  Divider,
  Badge
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Quiz as QuizIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  Publish as PublishIcon,
  VisibilityOff as UnpublishedIcon,
  FileUpload as FileUploadIcon
} from '@mui/icons-material';
import smartTestService from '../services/smartTestService';
import type { SmartTest, SmartTestFormData, SmartTestStats } from '../services/smartTestService';

const SmartTestManagementPage: React.FC = () => {
  // State
  const [tests, setTests] = useState<SmartTest[]>([]);
  const [stats, setStats] = useState<SmartTestStats>({
    totalTests: 0,
    activeTests: 0,
    totalAttempts: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<SmartTest | null>(null);
  
  // Dialog states
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [uploadTestContentDialog, setUploadTestContentDialog] = useState(false);
  const [publishDialog, setPublishDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<SmartTestFormData>({
    title: '',
    description: '',
    jobTitle: '',
    company: '',
    industry: '',
    difficulty: 'intermediate',
    timeLimit: 60,
    isActive: true
  });
  
  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [testContentFile, setTestContentFile] = useState<File | null>(null);
  
  // Notification
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Fetch data
  const fetchTests = useCallback(async () => {
    try {
      setLoading(true);
      const testsData = await smartTestService.getAllTests();
      setTests(testsData);
      
      // Calculate stats using service
      const statsData = await smartTestService.getTestStats(testsData);
      setStats(statsData);
    } catch (error: any) {
      showSnackbar('Failed to fetch tests: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTests();
  }, [fetchTests]);

  // Utility functions
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      jobTitle: '',
      company: '',
      industry: '',
      difficulty: 'intermediate',
      timeLimit: 60,
      isActive: true
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basic': return 'success';
      case 'intermediate': return 'warning';
      case 'advanced': return 'error';
      default: return 'default';
    }
  };

  // CRUD Operations
  const handleCreate = async () => {
    try {
      // Validate form data
      const errors = smartTestService.validateTestData(formData);
      if (errors.length > 0) {
        showSnackbar(errors.join(', '), 'error');
        return;
      }

      await smartTestService.createTest(formData);
      showSnackbar('Smart test created successfully', 'success');
      setCreateDialog(false);
      resetForm();
      fetchTests();
    } catch (error: any) {
      showSnackbar('Failed to create test: ' + error.message, 'error');
    }
  };

  const handleUpdate = async () => {
    if (!selectedTest) return;
    
    try {
      // Validate form data
      const errors = smartTestService.validateTestData(formData);
      if (errors.length > 0) {
        showSnackbar(errors.join(', '), 'error');
        return;
      }

      await smartTestService.updateTest(selectedTest._id, formData);
      showSnackbar('Smart test updated successfully', 'success');
      setEditDialog(false);
      resetForm();
      fetchTests();
    } catch (error: any) {
      showSnackbar('Failed to update test: ' + error.message, 'error');
    }
  };

  const handleDelete = async (testId: string) => {
    if (!window.confirm('Are you sure you want to delete this smart test?')) return;
    
    try {
      await smartTestService.deleteTest(testId);
      showSnackbar('Smart test deleted successfully', 'success');
      fetchTests();
    } catch (error: any) {
      showSnackbar('Failed to delete test: ' + error.message, 'error');
    }
  };

  const handleToggleStatus = async (testId: string, currentStatus: boolean) => {
    try {
      await smartTestService.toggleTestStatus(testId, !currentStatus);
      showSnackbar(`Test ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
      fetchTests();
    } catch (error: any) {
      showSnackbar('Failed to update test status: ' + error.message, 'error');
    }
  };

  const validateFileType = (file: File): boolean => {
    const allowedTypes = [
      'application/json',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/pdf'
    ];
    const allowedExtensions = ['.json', '.csv', '.xlsx', '.xls', '.doc', '.docx', '.pdf'];
    
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    const hasValidType = allowedTypes.includes(file.type);
    
    return hasValidExtension || hasValidType;
  };

  const validateFileSize = (file: File): boolean => {
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    return file.size <= maxSize;
  };

  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (!validateFileType(file)) {
      return { 
        isValid: false, 
        error: 'Invalid file type. Please select a JSON, CSV, XLSX, DOC, DOCX, or PDF file.' 
      };
    }
    
    if (!validateFileSize(file)) {
      return { 
        isValid: false, 
        error: 'File too large. Maximum file size is 10MB.' 
      };
    }
    
    return { isValid: true };
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      showSnackbar('Please select a file to upload', 'error');
      return;
    }

    const validation = validateFile(uploadFile);
    if (!validation.isValid) {
      showSnackbar(validation.error!, 'error');
      return;
    }

    try {
      await smartTestService.uploadTestFile(uploadFile);
      showSnackbar('Test file uploaded successfully', 'success');
      setUploadDialog(false);
      setUploadFile(null);
      fetchTests();
    } catch (error: any) {
      showSnackbar('Upload failed: ' + error.message, 'error');
    }
  };

  const handleUploadTestContent = async () => {
    if (!testContentFile || !selectedTest) {
      showSnackbar('Please select a file and test', 'error');
      return;
    }

    const validation = validateFile(testContentFile);
    if (!validation.isValid) {
      showSnackbar(validation.error!, 'error');
      return;
    }

    try {
      await smartTestService.uploadTestContent(selectedTest._id, testContentFile);
      showSnackbar('Test content uploaded successfully', 'success');
      setUploadTestContentDialog(false);
      setTestContentFile(null);
      setSelectedTest(null);
      fetchTests();
    } catch (error: any) {
      showSnackbar('Upload failed: ' + error.message, 'error');
    }
  };

  const handlePublishTest = async (testId: string, currentPublishStatus: boolean) => {
    try {
      await smartTestService.togglePublishStatus(testId, !currentPublishStatus);
      const action = !currentPublishStatus ? 'published' : 'unpublished';
      showSnackbar(`Test ${action} successfully`, 'success');
      fetchTests();
    } catch (error: any) {
      showSnackbar('Failed to update publish status: ' + error.message, 'error');
    }
  };

  const openEditDialog = (test: SmartTest) => {
    setSelectedTest(test);
    setFormData({
      title: test.title,
      description: test.description,
      jobTitle: test.jobTitle || '',
      company: test.company || '',
      industry: test.industry || '',
      difficulty: test.difficulty,
      timeLimit: test.timeLimit || 60,
      isActive: test.isActive
    });
    setEditDialog(true);
  };

  const openViewDialog = (test: SmartTest) => {
    setSelectedTest(test);
    setViewDialog(true);
  };

  const openUploadContentDialog = (test: SmartTest) => {
    setSelectedTest(test);
    setUploadTestContentDialog(true);
  };

  return (
    <Box p={3}>
      {/* Header */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Smart Test Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage uploaded smart tests for job candidates
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <QuizIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {stats.totalTests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Tests
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                  <CheckCircleIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {stats.activeTests}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Tests
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
                  <PeopleIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="info.main">
                    {stats.totalAttempts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Attempts
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: 'warning.main', width: 56, height: 56 }}>
                  <TrendingUpIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {stats.averageScore.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Score
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialog(true)}
          size="large"
        >
          Create Test
        </Button>
        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={() => setUploadDialog(true)}
          size="large"
        >
          Upload Test File
        </Button>
      </Stack>

      {/* Tests Table */}
      <Card elevation={2}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Smart Tests ({tests.length})
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Test Details</TableCell>
                    <TableCell>Job Information</TableCell>
                    <TableCell>Difficulty</TableCell>
                    <TableCell>Questions</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Published</TableCell>
                    <TableCell>Performance</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test._id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {test.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {test.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Created: {new Date(test.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {test.jobTitle ? (
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {test.jobTitle}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {test.company} • {test.industry}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            General Test
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test.difficulty.toUpperCase()}
                          color={getDifficultyColor(test.difficulty) as any}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge badgeContent={test.questionCount} color="primary">
                          <AssessmentIcon color="action" />
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={test.isActive}
                              onChange={() => handleToggleStatus(test._id, test.isActive)}
                              size="small"
                            />
                          }
                          label={test.isActive ? 'Active' : 'Inactive'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test.isPublished ? 'Published' : 'Draft'}
                          color={test.isPublished ? 'success' : 'default'}
                          size="small"
                          variant={test.isPublished ? 'filled' : 'outlined'}
                          icon={test.isPublished ? <PublishIcon /> : <UnpublishedIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="column" spacing={0.5}>
                          <Typography variant="body2">
                            {test.totalAttempts || 0} attempts
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Avg: {(test.averageScore || 0).toFixed(1)}%
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => openViewDialog(test)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Test">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(test)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Upload Test Content">
                            <IconButton
                              size="small"
                              color="info"
                              onClick={() => openUploadContentDialog(test)}
                            >
                              <FileUploadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={test.isPublished ? "Unpublish Test" : "Publish Test"}>
                            <IconButton
                              size="small"
                              color={test.isPublished ? "warning" : "success"}
                              onClick={() => handlePublishTest(test._id, test.isPublished)}
                            >
                              {test.isPublished ? <UnpublishedIcon /> : <PublishIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Test">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(test._id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                  {tests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                          No smart tests found. Create or upload your first test to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Smart Test</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Test Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={formData.difficulty}
                  label="Difficulty"
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Time Limit (minutes)"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Smart Test</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Test Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Industry"
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  value={formData.difficulty}
                  label="Difficulty"
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                >
                  <MenuItem value="basic">Basic</MenuItem>
                  <MenuItem value="intermediate">Intermediate</MenuItem>
                  <MenuItem value="advanced">Advanced</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Time Limit (minutes)"
                value={formData.timeLimit}
                onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdate} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Test Details</DialogTitle>
        <DialogContent>
          {selectedTest && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>{selectedTest.title}</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedTest.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Job Title:</Typography>
                  <Typography variant="body2">{selectedTest.jobTitle || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Company:</Typography>
                  <Typography variant="body2">{selectedTest.company || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Industry:</Typography>
                  <Typography variant="body2">{selectedTest.industry || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Difficulty:</Typography>
                  <Chip label={selectedTest.difficulty.toUpperCase()} color={getDifficultyColor(selectedTest.difficulty) as any} size="small" />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>Questions ({selectedTest.questions.length})</Typography>
                  {selectedTest.questions.slice(0, 3).map((question, index) => (
                    <Box key={question._id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2">Q{index + 1}: {question.question}</Typography>
                      <Typography variant="caption" color="text.secondary">Type: {question.type}</Typography>
                    </Box>
                  ))}
                  {selectedTest.questions.length > 3 && (
                    <Typography variant="body2" color="text.secondary">
                      ...and {selectedTest.questions.length - 3} more questions
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Test File</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <input
              type="file"
              accept=".json,.csv,.xlsx,.doc,.docx,.pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<UploadIcon />}
                fullWidth
                sx={{ mb: 2 }}
              >
                Choose File
              </Button>
            </label>
            {uploadFile && (
              <Alert 
                severity={validateFile(uploadFile).isValid ? "info" : "warning"} 
                sx={{ mb: 2 }}
              >
                {validateFile(uploadFile).isValid
                  ? `Selected: ${uploadFile.name} (${(uploadFile.size / 1024 / 1024).toFixed(2)} MB)`
                  : validateFile(uploadFile).error
                }
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary">
              Supported formats: JSON, CSV, XLSX, DOC, DOCX, PDF. The file should contain test questions and answers.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              • JSON/CSV/XLSX: Structured data with questions, options, and answers<br/>
              • DOC/DOCX: Text documents with questions that will be parsed<br/>
              • PDF: Document containing questions for AI-powered extraction<br/>
              • Maximum file size: 10MB
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleFileUpload} 
            variant="contained" 
            disabled={!uploadFile || !validateFile(uploadFile).isValid}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Test Content Dialog */}
      <Dialog open={uploadTestContentDialog} onClose={() => setUploadTestContentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Test Content</DialogTitle>
        <DialogContent>
          {selectedTest && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                Uploading content for: <strong>{selectedTest.title}</strong>
              </Alert>
              <input
                type="file"
                accept=".json,.csv,.xlsx,.doc,.docx,.pdf"
                onChange={(e) => setTestContentFile(e.target.files?.[0] || null)}
                style={{ display: 'none' }}
                id="test-content-upload"
              />
              <label htmlFor="test-content-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<FileUploadIcon />}
                  fullWidth
                  sx={{ mb: 2 }}
                >
                  Choose Questions File
                </Button>
              </label>
              {testContentFile && (
                <Alert 
                  severity={validateFile(testContentFile).isValid ? "success" : "warning"} 
                  sx={{ mb: 2 }}
                >
                  {validateFile(testContentFile).isValid
                    ? `Selected: ${testContentFile.name} (${(testContentFile.size / 1024 / 1024).toFixed(2)} MB)`
                    : validateFile(testContentFile).error
                  }
                </Alert>
              )}
              <Typography variant="body2" color="text.secondary">
                Upload a file containing questions and answers for this test. Supported formats: JSON, CSV, XLSX, DOC, DOCX, PDF.
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                This will add questions to the existing test structure.<br/>
                • JSON/CSV/XLSX: Structured data with questions, options, and answers<br/>
                • DOC/DOCX: Text documents with questions that will be parsed<br/>
                • PDF: Document containing questions for AI-powered extraction<br/>
                • Maximum file size: 10MB
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadTestContentDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUploadTestContent} 
            variant="contained" 
            disabled={!testContentFile || !validateFile(testContentFile).isValid}
          >
            Upload Content
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SmartTestManagementPage;
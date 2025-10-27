import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Pagination,
  Avatar,
  IconButton,
  Tooltip,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper
} from '@mui/material';
import {
  Add,
  Quiz,
  Assignment,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  Publish,
  UnpublishedOutlined,
  Schedule,
  People,
  Grade,
  Analytics,
  CloudUpload,
  AutoAwesome,
  Description
} from '@mui/icons-material';
import { format } from 'date-fns';
import { assessmentService, IAssessment } from '../../services/assessmentService';

const TeacherAssessmentManagement: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    search: ''
  });
  const [menuAnchor, setMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<IAssessment | null>(null);
  
  // Upload states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load assessments
  useEffect(() => {
    loadAssessments();
  }, [page, filters]);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams: any = {
        page,
        limit: 12
      };

      if (filters.type !== 'all') {
        filterParams.type = filters.type;
      }

      if (filters.status !== 'all') {
        filterParams.status = filters.status;
      }

      const response = await assessmentService.getTeacherAssessments(filterParams);
      
      // Filter by search term locally
      let filteredAssessments = response.assessments;
      if (filters.search) {
        filteredAssessments = response.assessments.filter(assessment =>
          assessment.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          (typeof assessment.course === 'string' ? assessment.course : assessment.course.title).toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setAssessments(filteredAssessments);
      setTotalPages(response.pagination.totalPages);

    } catch (err: any) {
      setError(err.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1); // Reset to first page when filters change
  };

  // Handle menu open/close
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, assessmentId: string) => {
    setMenuAnchor(prev => ({ ...prev, [assessmentId]: event.currentTarget }));
  };

  const handleMenuClose = (assessmentId: string) => {
    setMenuAnchor(prev => ({ ...prev, [assessmentId]: null }));
  };

  // Handle assessment actions
  const handleEdit = (assessment: IAssessment) => {
    navigate(`/dashboard/teacher/assessments/${assessment._id}/edit`);
  };

  const handleView = (assessment: IAssessment) => {
    navigate(`/dashboard/teacher/assessments/${assessment._id}`);
  };

  const handleViewSubmissions = (assessment: IAssessment) => {
    navigate(`/dashboard/teacher/assessments/${assessment._id}/submissions`);
  };

  const handleTogglePublish = async (assessment: IAssessment) => {
    try {
      await assessmentService.togglePublishAssessment(assessment._id);
      loadAssessments(); // Reload to get updated data
    } catch (err: any) {
      setError(err.message || 'Failed to update assessment status');
    }
  };

  const handleDeleteClick = (assessment: IAssessment) => {
    setSelectedAssessment(assessment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssessment) return;

    try {
      await assessmentService.deleteAssessment(selectedAssessment._id);
      setDeleteDialogOpen(false);
      setSelectedAssessment(null);
      loadAssessments(); // Reload assessments
    } catch (err: any) {
      setError(err.message || 'Failed to delete assessment');
    }
  };

  // Handle upload to existing assessment
  const handleUploadClick = (assessment: IAssessment) => {
    setSelectedAssessment(assessment);
    setUploadDialogOpen(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF, Word document, or text file');
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setUploadFile(file);
      setError(null);
    }
  };

  const removeUploadFile = () => {
    setUploadFile(null);
  };

  const handleAddQuestions = async () => {
    if (!selectedAssessment || !uploadFile) return;

    try {
      setUploading(true);
      setError(null);

      await assessmentService.addQuestionsFromDocument(selectedAssessment._id, uploadFile);
      
      // Close dialog and reset
      setUploadDialogOpen(false);
      setSelectedAssessment(null);
      setUploadFile(null);
      
      // Reload assessments to show updated data
      loadAssessments();
      
    } catch (err: any) {
      setError(err.message || 'Failed to add questions to assessment');
    } finally {
      setUploading(false);
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Quiz />;
      case 'assignment':
        return <Assignment />;
      case 'exam':
        return <Grade />;
      default:
        return <Assignment />;
    }
  };

  if (loading && assessments.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Assessment Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage assessments for your courses
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/dashboard/teacher/assessments/create')}
        >
          Create Assessment
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search assessments..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.type}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="assignment">Assignment</MenuItem>
                  <MenuItem value="exam">Exam</MenuItem>
                  <MenuItem value="project">Project</MenuItem>
                  <MenuItem value="homework">Homework</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFilters({ type: 'all', status: 'all', search: '' });
                  setPage(1);
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Assessments Grid */}
      {assessments.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Quiz sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No assessments found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {filters.search || filters.type !== 'all' || filters.status !== 'all'
                  ? 'Try adjusting your filters to see more assessments.'
                  : 'Create your first assessment to get started.'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/dashboard/teacher/assessments/create')}
              >
                Create Assessment
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {assessments.map((assessment) => (
              <Grid item xs={12} sm={6} md={4} key={assessment._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        {getTypeIcon(assessment.type)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap>
                          {assessment.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {typeof assessment.course === 'string' ? assessment.course : assessment.course.title}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, assessment._id)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    {/* Status and Type */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={assessment.isPublished ? 'Published' : 'Draft'}
                        color={assessment.isPublished ? 'success' : 'default'}
                        size="small"
                        icon={assessment.isPublished ? <Publish /> : <UnpublishedOutlined />}
                      />
                      <Chip
                        label={assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    {/* Details */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        <Grade sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                        {assessment.totalPoints} points • {assessment.questions.length} questions
                      </Typography>
                      {assessment.dueDate && (
                        <Typography variant="body2" color="text.secondary">
                          <Schedule sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                          Due: {format(new Date(assessment.dueDate), 'MMM dd, yyyy')}
                        </Typography>
                      )}
                    </Box>

                    {/* Description */}
                    {assessment.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {assessment.description}
                      </Typography>
                    )}
                  </CardContent>

                  {/* Actions */}
                  <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleView(assessment)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleViewSubmissions(assessment)}
                      startIcon={<People />}
                    >
                      Submissions
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleUploadClick(assessment)}
                      startIcon={<CloudUpload />}
                      sx={{ 
                        color: 'primary.main',
                        borderColor: 'primary.main',
                        '&:hover': {
                          backgroundColor: 'primary.50',
                          borderColor: 'primary.main'
                        }
                      }}
                    >
                      <AutoAwesome sx={{ fontSize: 16, mr: 0.5 }} />
                      AI Upload
                    </Button>
                  </Box>

                  {/* Menu */}
                  <Menu
                    anchorEl={menuAnchor[assessment._id]}
                    open={Boolean(menuAnchor[assessment._id])}
                    onClose={() => handleMenuClose(assessment._id)}
                  >
                    <MenuItem onClick={() => { handleView(assessment); handleMenuClose(assessment._id); }}>
                      <Visibility sx={{ mr: 1 }} />
                      View Details
                    </MenuItem>
                    <MenuItem onClick={() => { handleEdit(assessment); handleMenuClose(assessment._id); }}>
                      <Edit sx={{ mr: 1 }} />
                      Edit
                    </MenuItem>
                    <MenuItem onClick={() => { handleUploadClick(assessment); handleMenuClose(assessment._id); }}>
                      <CloudUpload sx={{ mr: 1 }} />
                      Add Questions (AI)
                    </MenuItem>
                    <MenuItem onClick={() => { handleTogglePublish(assessment); handleMenuClose(assessment._id); }}>
                      {assessment.isPublished ? <UnpublishedOutlined sx={{ mr: 1 }} /> : <Publish sx={{ mr: 1 }} />}
                      {assessment.isPublished ? 'Unpublish' : 'Publish'}
                    </MenuItem>
                    <MenuItem onClick={() => { handleViewSubmissions(assessment); handleMenuClose(assessment._id); }}>
                      <Analytics sx={{ mr: 1 }} />
                      View Analytics
                    </MenuItem>
                    <MenuItem 
                      onClick={() => { handleDeleteClick(assessment); handleMenuClose(assessment._id); }}
                      sx={{ color: 'error.main' }}
                    >
                      <Delete sx={{ mr: 1 }} />
                      Delete
                    </MenuItem>
                  </Menu>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Assessment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedAssessment?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            sx={{
              backgroundColor: '#f44336',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '4px',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: '#d32f2f',
              },
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Questions Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CloudUpload color="primary" />
          Add Questions to Assessment
        </DialogTitle>
        <DialogContent>
          {selectedAssessment && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload a document to add more questions to <strong>"{selectedAssessment.title}"</strong>
              </Typography>
              
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Current: {selectedAssessment.questions?.length || 0} questions • {selectedAssessment.totalPoints || 0} points
                </Typography>
              </Box>

              {/* File Upload Section */}
              <Paper sx={{ p: 3, border: '2px dashed #e0e0e0', borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description />
                  Upload Document
                </Typography>
                
                {!uploadFile ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <input
                      accept=".pdf,.doc,.docx,.txt"
                      style={{ display: 'none' }}
                      id="assessment-document-upload"
                      type="file"
                      onChange={handleFileUpload}
                    />
                    <label htmlFor="assessment-document-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<CloudUpload />}
                        sx={{ mb: 1 }}
                      >
                        Choose File
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Supported formats: PDF, Word (.doc, .docx), Text (.txt) • Max size: 10MB
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {uploadFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      onClick={removeUploadFile}
                      startIcon={<Delete />}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Paper>
              
              {uploading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="primary">
                    AI is extracting questions from your document...
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddQuestions} 
            variant="contained"
            disabled={!uploadFile || uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <AutoAwesome />}
            sx={{ 
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
              }
            }}
          >
            {uploading ? 'Adding Questions...' : 'Add Questions'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherAssessmentManagement;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  CircularProgress,
  Tooltip,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Publish,
  Unpublish,
  MoreVert,
  Search,
  FilterList,
  Download,
  Upload,
  Assessment,
  School,
  TrendingUp,
  People,
  Timer
} from '@mui/icons-material';
import { superAdminService } from '../../services/superAdminService';

interface PastPaper {
  _id: string;
  title: string;
  description: string;
  subject: string;
  level: string;
  year: number;
  examBoard?: string;
  duration: number;
  totalMarks: number;
  totalAttempts: number;
  averageScore: number;
  difficultyRating: number;
  isPublished: boolean;
  publishedAt?: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  questions: any[];
  createdAt: string;
}

const PastPaperManagement: React.FC = () => {
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<PastPaper | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuPaper, setMenuPaper] = useState<PastPaper | null>(null);

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    level: 'O-Level',
    year: new Date().getFullYear(),
    examBoard: '',
    duration: 60,
    totalMarks: 100,
    tags: [] as string[],
    isPublished: false,
    allowMultipleAttempts: true,
    showResultsImmediately: true,
    showCorrectAnswers: true,
    showExplanations: true,
    randomizeQuestions: false,
    randomizeOptions: false,
    provideFeedback: true,
    feedbackType: 'immediate'
  });

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'History',
    'Geography', 'Economics', 'Computer Science', 'Business Studies',
    'Psychology', 'Sociology', 'Literature', 'Art', 'Music', 'Physical Education'
  ];

  const levels = ['O-Level', 'A-Level', 'University', 'Professional', 'General'];

  const examBoards = [
    'Cambridge', 'Edexcel', 'AQA', 'OCR', 'WJEC', 'SQA', 'CCEA', 'Pearson'
  ];

  useEffect(() => {
    loadPastPapers();
  }, [page, searchTerm, statusFilter, subjectFilter, levelFilter]);

  const loadPastPapers = async () => {
    try {
      setLoading(true);
      const response = await superAdminService.getPastPapers({
        page,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter === 'published',
        subject: subjectFilter || undefined,
        level: levelFilter || undefined
      });

      if (response.success) {
        setPastPapers(response.data.pastPapers);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load past papers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePaper = () => {
    setSelectedPaper(null);
    setFormData({
      title: '',
      description: '',
      subject: '',
      level: 'O-Level',
      year: new Date().getFullYear(),
      examBoard: '',
      duration: 60,
      totalMarks: 100,
      tags: [],
      isPublished: false,
      allowMultipleAttempts: true,
      showResultsImmediately: true,
      showCorrectAnswers: true,
      showExplanations: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      provideFeedback: true,
      feedbackType: 'immediate'
    });
    setDialogOpen(true);
  };

  const handleEditPaper = (paper: PastPaper) => {
    setSelectedPaper(paper);
    setFormData({
      title: paper.title,
      description: paper.description,
      subject: paper.subject,
      level: paper.level,
      year: paper.year,
      examBoard: paper.examBoard || '',
      duration: paper.duration,
      totalMarks: paper.totalMarks,
      tags: paper.tags || [],
      isPublished: paper.isPublished,
      allowMultipleAttempts: true,
      showResultsImmediately: true,
      showCorrectAnswers: true,
      showExplanations: true,
      randomizeQuestions: false,
      randomizeOptions: false,
      provideFeedback: true,
      feedbackType: 'immediate'
    });
    setDialogOpen(true);
  };

  const handleSavePaper = async () => {
    try {
      if (selectedPaper) {
        await superAdminService.updatePastPaper(selectedPaper._id, formData);
        setSuccess('Past paper updated successfully');
      } else {
        await superAdminService.createPastPaper(formData);
        setSuccess('Past paper created successfully');
      }
      setDialogOpen(false);
      loadPastPapers();
    } catch (err: any) {
      setError(err.message || 'Failed to save past paper');
    }
  };

  const handleDeletePaper = async () => {
    if (!selectedPaper) return;

    try {
      await superAdminService.deletePastPaper(selectedPaper._id);
      setSuccess('Past paper deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedPaper(null);
      loadPastPapers();
    } catch (err: any) {
      setError(err.message || 'Failed to delete past paper');
    }
  };

  const handlePublishPaper = async (paper: PastPaper) => {
    try {
      if (paper.isPublished) {
        await superAdminService.unpublishPastPaper(paper._id);
        setSuccess('Past paper unpublished successfully');
      } else {
        await superAdminService.publishPastPaper(paper._id);
        setSuccess('Past paper published successfully');
      }
      loadPastPapers();
    } catch (err: any) {
      setError(err.message || 'Failed to update publication status');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, paper: PastPaper) => {
    setMenuAnchor(event.currentTarget);
    setMenuPaper(paper);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setMenuPaper(null);
  };

  const getStatusColor = (isPublished: boolean) => {
    return isPublished ? 'success' : 'default';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'O-Level': return 'primary';
      case 'A-Level': return 'secondary';
      case 'University': return 'success';
      case 'Professional': return 'warning';
      case 'General': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Assessment />
        Past Papers Management
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Papers
                  </Typography>
                  <Typography variant="h4">
                    {pastPapers.length}
                  </Typography>
                </Box>
                <School color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Published
                  </Typography>
                  <Typography variant="h4">
                    {pastPapers.filter(p => p.isPublished).length}
                  </Typography>
                </Box>
                <Publish color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Attempts
                  </Typography>
                  <Typography variant="h4">
                    {pastPapers.reduce((sum, p) => sum + p.totalAttempts, 0)}
                  </Typography>
                </Box>
                <People color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Score
                  </Typography>
                  <Typography variant="h4">
                    {pastPapers.length > 0 
                      ? Math.round(pastPapers.reduce((sum, p) => sum + p.averageScore, 0) / pastPapers.length)
                      : 0}%
                  </Typography>
                </Box>
                <TrendingUp color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search past papers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="draft">Draft</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  label="Subject"
                >
                  <MenuItem value="">All Subjects</MenuItem>
                  {subjects.map(subject => (
                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  label="Level"
                >
                  <MenuItem value="">All Levels</MenuItem>
                  {levels.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreatePaper}
                fullWidth
              >
                Add Paper
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Past Papers Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Level</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Attempts</TableCell>
                <TableCell>Avg Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : pastPapers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No past papers found
                  </TableCell>
                </TableRow>
              ) : (
                pastPapers.map((paper) => (
                  <TableRow key={paper._id}>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {paper.title}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {paper.description.substring(0, 50)}...
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{paper.subject}</TableCell>
                    <TableCell>
                      <Chip
                        label={paper.level}
                        color={getLevelColor(paper.level) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{paper.year}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Timer sx={{ fontSize: 16 }} />
                        {paper.duration} min
                      </Box>
                    </TableCell>
                    <TableCell>{paper.totalAttempts}</TableCell>
                    <TableCell>
                      <Typography color={paper.averageScore >= 70 ? 'success.main' : 'error.main'}>
                        {Math.round(paper.averageScore)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={paper.isPublished ? 'Published' : 'Draft'}
                        color={getStatusColor(paper.isPublished) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleEditPaper(paper)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={paper.isPublished ? 'Unpublish' : 'Publish'}>
                          <IconButton
                            size="small"
                            onClick={() => handlePublishPaper(paper)}
                          >
                            {paper.isPublished ? <Unpublish /> : <Publish />}
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, paper)}
                        >
                          <MoreVert />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedPaper ? 'Edit Past Paper' : 'Create New Past Paper'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  label="Subject"
                >
                  {subjects.map(subject => (
                    <MenuItem key={subject} value={subject}>{subject}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Level</InputLabel>
                <Select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  label="Level"
                >
                  {levels.map(level => (
                    <MenuItem key={level} value={level}>{level}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Exam Board</InputLabel>
                <Select
                  value={formData.examBoard}
                  onChange={(e) => setFormData({ ...formData, examBoard: e.target.value })}
                  label="Exam Board"
                >
                  <MenuItem value="">None</MenuItem>
                  {examBoards.map(board => (
                    <MenuItem key={board} value={board}>{board}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Total Marks"
                type="number"
                value={formData.totalMarks}
                onChange={(e) => setFormData({ ...formData, totalMarks: parseInt(e.target.value) })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  />
                }
                label="Published"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSavePaper} variant="contained">
            {selectedPaper ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Past Paper</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedPaper?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeletePaper} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          // View details
        }}>
          <ListItemIcon>
            <Visibility />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          // Download
        }}>
          <ListItemIcon>
            <Download />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          setSelectedPaper(menuPaper);
          setDeleteDialogOpen(true);
        }}>
          <ListItemIcon>
            <Delete />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PastPaperManagement;

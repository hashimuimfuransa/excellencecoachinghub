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
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress
} from '@mui/material';
import {
  Add,
  MenuBook,
  Edit,
  Delete,
  MoreVert,
  Visibility,
  Publish,
  UnpublishedOutlined,
  Schedule,
  People,
  Analytics,
  Quiz
} from '@mui/icons-material';
import { format } from 'date-fns';

// Mock service - replace with actual service
const courseNotesService = {
  getTeacherCourseNotes: async (filters: any) => {
    // Mock data
    return {
      courseNotes: [
        {
          _id: '1',
          title: 'Introduction to React Hooks',
          course: { _id: '1', title: 'Advanced React Development' },
          chapter: 1,
          sections: [
            { id: 'section1', title: 'useState Hook', content: 'Content about useState...' },
            { id: 'section2', title: 'useEffect Hook', content: 'Content about useEffect...' }
          ],
          isPublished: true,
          readingProgress: { totalReaders: 25, averageProgress: 78 },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          _id: '2',
          title: 'JavaScript Async Programming',
          course: { _id: '2', title: 'JavaScript Fundamentals' },
          chapter: 3,
          sections: [
            { id: 'section1', title: 'Promises', content: 'Content about promises...' },
            { id: 'section2', title: 'Async/Await', content: 'Content about async/await...' }
          ],
          isPublished: false,
          readingProgress: { totalReaders: 0, averageProgress: 0 },
          createdAt: '2024-01-14T14:30:00Z',
          updatedAt: '2024-01-14T14:30:00Z'
        }
      ],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 2, itemsPerPage: 12 }
    };
  },
  deleteCourseNotes: async (id: string) => {
    // Mock delete
    return Promise.resolve();
  },
  togglePublishCourseNotes: async (id: string) => {
    // Mock toggle
    return Promise.resolve();
  }
};

const TeacherCourseNotesManagement: React.FC = () => {
  const navigate = useNavigate();

  // State management
  const [courseNotes, setCourseNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    courseId: 'all',
    status: 'all',
    search: ''
  });
  const [menuAnchor, setMenuAnchor] = useState<{ [key: string]: HTMLElement | null }>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCourseNotes, setSelectedCourseNotes] = useState<any>(null);

  // Load course notes
  useEffect(() => {
    loadCourseNotes();
  }, [page, filters]);

  const loadCourseNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const filterParams: any = {
        page,
        limit: 12
      };

      if (filters.courseId !== 'all') {
        filterParams.courseId = filters.courseId;
      }

      if (filters.status !== 'all') {
        filterParams.status = filters.status;
      }

      const response = await courseNotesService.getTeacherCourseNotes(filterParams);
      
      // Filter by search term locally
      let filteredNotes = response.courseNotes;
      if (filters.search) {
        filteredNotes = response.courseNotes.filter((notes: any) =>
          notes.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          notes.course.title.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setCourseNotes(filteredNotes);
      setTotalPages(response.pagination.totalPages);

    } catch (err: any) {
      setError(err.message || 'Failed to load course notes');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(1);
  };

  // Handle menu open/close
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notesId: string) => {
    setMenuAnchor(prev => ({ ...prev, [notesId]: event.currentTarget }));
  };

  const handleMenuClose = (notesId: string) => {
    setMenuAnchor(prev => ({ ...prev, [notesId]: null }));
  };

  // Handle actions
  const handleEdit = (notes: any) => {
    navigate(`/dashboard/teacher/content/notes/${notes._id}/edit`);
  };

  const handleView = (notes: any) => {
    navigate(`/dashboard/teacher/content/notes/${notes._id}`);
  };

  const handleViewProgress = (notes: any) => {
    navigate(`/dashboard/teacher/content/notes/${notes._id}/progress`);
  };

  const handleGenerateQuiz = (notes: any) => {
    navigate(`/dashboard/teacher/assessments/create?fromNotes=${notes._id}`);
  };

  const handleTogglePublish = async (notes: any) => {
    try {
      await courseNotesService.togglePublishCourseNotes(notes._id);
      loadCourseNotes();
    } catch (err: any) {
      setError(err.message || 'Failed to update notes status');
    }
  };

  const handleDeleteClick = (notes: any) => {
    setSelectedCourseNotes(notes);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCourseNotes) return;

    try {
      await courseNotesService.deleteCourseNotes(selectedCourseNotes._id);
      setDeleteDialogOpen(false);
      setSelectedCourseNotes(null);
      loadCourseNotes();
    } catch (err: any) {
      setError(err.message || 'Failed to delete course notes');
    }
  };

  if (loading && courseNotes.length === 0) {
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
            Course Notes Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage reading materials for your courses
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/dashboard/teacher/content/notes/create')}
        >
          Create Notes
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
                placeholder="Search course notes..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Course</InputLabel>
                <Select
                  value={filters.courseId}
                  label="Course"
                  onChange={(e) => handleFilterChange('courseId', e.target.value)}
                >
                  <MenuItem value="all">All Courses</MenuItem>
                  {/* TODO: Add actual courses */}
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
                  setFilters({ courseId: 'all', status: 'all', search: '' });
                  setPage(1);
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Course Notes Grid */}
      {courseNotes.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <MenuBook sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No course notes found
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {filters.search || filters.courseId !== 'all' || filters.status !== 'all'
                  ? 'Try adjusting your filters to see more notes.'
                  : 'Create your first course notes to get started.'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate('/dashboard/teacher/content/notes/create')}
              >
                Create Notes
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <>
          <Grid container spacing={3}>
            {courseNotes.map((notes) => (
              <Grid item xs={12} sm={6} md={4} key={notes._id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                        <MenuBook />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" noWrap>
                          {notes.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {notes.course.title}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, notes._id)}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>

                    {/* Status and Chapter */}
                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                      <Chip
                        label={notes.isPublished ? 'Published' : 'Draft'}
                        color={notes.isPublished ? 'success' : 'default'}
                        size="small"
                        icon={notes.isPublished ? <Publish /> : <UnpublishedOutlined />}
                      />
                      <Chip
                        label={`Chapter ${notes.chapter}`}
                        variant="outlined"
                        size="small"
                      />
                    </Box>

                    {/* Sections */}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {notes.sections.length} sections
                    </Typography>

                    {/* Reading Progress */}
                    {notes.isPublished && notes.readingProgress.totalReaders > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Reading Progress
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {notes.readingProgress.averageProgress}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={notes.readingProgress.averageProgress}
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {notes.readingProgress.totalReaders} readers
                        </Typography>
                      </Box>
                    )}

                    {/* Last Updated */}
                    <Typography variant="caption" color="text.secondary">
                      Updated: {format(new Date(notes.updatedAt), 'MMM dd, yyyy')}
                    </Typography>
                  </CardContent>

                  {/* Actions */}
                  <Box sx={{ p: 2, pt: 0, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleView(notes)}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleViewProgress(notes)}
                      startIcon={<People />}
                    >
                      Progress
                    </Button>
                  </Box>

                  {/* Menu */}
                  <Menu
                    anchorEl={menuAnchor[notes._id]}
                    open={Boolean(menuAnchor[notes._id])}
                    onClose={() => handleMenuClose(notes._id)}
                  >
                    <MenuItem onClick={() => { handleView(notes); handleMenuClose(notes._id); }}>
                      <Visibility sx={{ mr: 1 }} />
                      View Details
                    </MenuItem>
                    <MenuItem onClick={() => { handleEdit(notes); handleMenuClose(notes._id); }}>
                      <Edit sx={{ mr: 1 }} />
                      Edit
                    </MenuItem>
                    <MenuItem onClick={() => { handleTogglePublish(notes); handleMenuClose(notes._id); }}>
                      {notes.isPublished ? <UnpublishedOutlined sx={{ mr: 1 }} /> : <Publish sx={{ mr: 1 }} />}
                      {notes.isPublished ? 'Unpublish' : 'Publish'}
                    </MenuItem>
                    <MenuItem onClick={() => { handleGenerateQuiz(notes); handleMenuClose(notes._id); }}>
                      <Quiz sx={{ mr: 1 }} />
                      Generate Quiz
                    </MenuItem>
                    <MenuItem onClick={() => { handleViewProgress(notes); handleMenuClose(notes._id); }}>
                      <Analytics sx={{ mr: 1 }} />
                      View Analytics
                    </MenuItem>
                    <MenuItem 
                      onClick={() => { handleDeleteClick(notes); handleMenuClose(notes._id); }}
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
        <DialogTitle>Delete Course Notes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedCourseNotes?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TeacherCourseNotesManagement;

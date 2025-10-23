import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Alert,
  Chip,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  AttachMoney,
  Feedback,
  Save,
  Close,
  Warning,
  Info
} from '@mui/icons-material';
import { ICourse } from '../../services/courseService';
import { CourseStatus } from '../../shared/types';

interface AdminCourseActionsProps {
  course: ICourse;
  onCourseUpdate: () => void;
}

const AdminCourseActions: React.FC<AdminCourseActionsProps> = ({ course, onCourseUpdate }) => {
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [coursePrice, setCoursePrice] = useState(course.price || 0);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [editForm, setEditForm] = useState({
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    duration: course.duration
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApproveCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Import courseService dynamically to avoid circular imports
      const { courseService } = await import('../../services/courseService');
      
      await courseService.approveCourse(course._id, {
        price: coursePrice
      });
      
      setSuccess('Course approved successfully with pricing set');
      setApproveDialogOpen(false);
      onCourseUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve course');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectCourse = async () => {
    if (!rejectFeedback.trim()) {
      setError('Please provide feedback for rejection');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { courseService } = await import('../../services/courseService');
      
      await courseService.rejectCourse(course._id, { 
        feedback: rejectFeedback 
      });
      
      setSuccess('Course rejected with feedback provided');
      setRejectDialogOpen(false);
      setRejectFeedback('');
      onCourseUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject course');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { courseService } = await import('../../services/courseService');
      
      await courseService.updateCourse(course._id, editForm);
      
      setSuccess('Course updated successfully');
      setEditDialogOpen(false);
      onCourseUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { courseService } = await import('../../services/courseService');
      
      await courseService.deleteCourse(course._id);
      
      setSuccess('Course deleted successfully');
      setDeleteDialogOpen(false);
      onCourseUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.APPROVED:
        return 'success';
      case CourseStatus.PENDING_APPROVAL:
        return 'warning';
      case CourseStatus.REJECTED:
        return 'error';
      case CourseStatus.DRAFT:
        return 'info';
      case CourseStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  const formatStatus = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.PENDING_APPROVAL:
        return 'Pending Approval';
      case CourseStatus.APPROVED:
        return 'Approved';
      case CourseStatus.REJECTED:
        return 'Rejected';
      case CourseStatus.DRAFT:
        return 'Draft';
      case CourseStatus.ARCHIVED:
        return 'Archived';
      default:
        return 'Unknown';
    }
  };

  return (
    <Card sx={{ mb: { xs: 2, sm: 3 } }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box 
          display="flex" 
          alignItems="center" 
          mb={{ xs: 2, sm: 3 }}
          flexDirection={{ xs: 'column', sm: 'row' }}
          gap={{ xs: 1, sm: 0 }}
        >
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1,
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            Course Actions
          </Typography>
          <Chip
            label={formatStatus(course.status)}
            color={getStatusColor(course.status)}
            size="small"
          />
        </Box>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Action Buttons */}
        <Grid container spacing={{ xs: 1.5, sm: 2 }}>
          {course.status === CourseStatus.PENDING_APPROVAL && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircle />}
                  onClick={() => setApproveDialogOpen(true)}
                  disabled={loading}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}
                >
                  Approve Course
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="contained"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={loading}
                  size="small"
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    py: { xs: 1, sm: 1.5 }
                  }}
                >
                  Reject Course
                </Button>
              </Grid>
            </>
          )}
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => setEditDialogOpen(true)}
              disabled={loading}
              size="small"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              Edit Course
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => setDeleteDialogOpen(true)}
              disabled={loading}
              size="small"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              Delete Course
            </Button>
          </Grid>
        </Grid>

        {/* Course Status Information */}
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mt: { xs: 2, sm: 3 }, bgcolor: 'grey.50' }}>
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            Course Status Information
          </Typography>
          <Grid container spacing={{ xs: 1, sm: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Current Status: <strong>{formatStatus(course.status)}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Current Price: <strong>${course.price || 0}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Enrollments: <strong>{course.enrollmentCount || 0}</strong>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Created: <strong>{new Date(course.createdAt).toLocaleDateString()}</strong>
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </CardContent>

      {/* Approve Course Dialog */}
      <Dialog open={approveDialogOpen} onClose={() => setApproveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <CheckCircle color="success" sx={{ mr: 1 }} />
            Approve Course & Set Price
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Approve the course "{course.title}" and set the course price. Students will have access to all course materials and live sessions.
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            label="Course Price"
            type="number"
            value={coursePrice}
            onChange={(e) => setCoursePrice(Number(e.target.value))}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            helperText="Set to $0 for free course access"
            inputProps={{ min: 0, step: 0.01 }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            color="success"
            variant="contained"
            onClick={handleApproveCourse}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            Approve & Set Price
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Course Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Cancel color="error" sx={{ mr: 1 }} />
            Reject Course
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              Are you sure you want to reject the course "{course.title}"? Please provide feedback for the instructor.
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Feedback"
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            placeholder="Explain why this course is being rejected..."
            sx={{ mt: 2 }}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleRejectCourse}
            disabled={loading || !rejectFeedback.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <Cancel />}
          >
            Reject Course
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Edit color="primary" sx={{ mr: 1 }} />
            Edit Course Details
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Course Title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Course Description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Level"
                value={editForm.level}
                onChange={(e) => setEditForm({ ...editForm, level: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Duration (hours)"
                type="number"
                value={editForm.duration}
                onChange={(e) => setEditForm({ ...editForm, duration: Number(e.target.value) })}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            color="primary"
            variant="contained"
            onClick={handleEditCourse}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Save />}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Course Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Delete color="error" sx={{ mr: 1 }} />
            Delete Course
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone. All course data, materials, and student progress will be permanently deleted.
            </Typography>
          </Alert>
          
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete the course "{course.title}"?
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            This will also delete:
            <br />• All course materials and files
            <br />• Student enrollments and progress
            <br />• Assessments and assignments
            <br />• Live session recordings
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteCourse}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <Delete />}
          >
            Delete Course
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AdminCourseActions;

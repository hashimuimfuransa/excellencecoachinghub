import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Button
} from '@mui/material';
import {
  Quiz,
  Assignment as AssignmentIcon,
  ExpandMore,
  Visibility,
  Edit,
  Delete,
  Publish,
  Unpublished,
  Schedule,
  Timer,
  Grade,
  CheckCircle,
  Cancel
} from '@mui/icons-material';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import { assignmentService } from '../../services/assignmentService';
import type { Assignment } from '../../services/assignmentService';
import { courseService } from '../../services/courseService';

interface AdminCourseQuizzesProps {
  courseId: string;
}

const AdminCourseQuizzes: React.FC<AdminCourseQuizzesProps> = ({ courseId }) => {
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadQuizzesAndAssignments();
  }, [courseId]);

  const loadQuizzesAndAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use admin-specific method to avoid 403 errors
      const course = await courseService.getCourseByIdForAdmin(courseId);
      
      // Try to load assessments and assignments
      const [assessmentsData, assignmentsData] = await Promise.all([
        assessmentService.getCourseAssessments(courseId).catch(() => []),
        assignmentService.getCourseAssignments(courseId).catch(() => [])
      ]);
      
      setAssessments(assessmentsData);
      setAssignments(assignmentsData);
    } catch (err) {
      console.error('Failed to load quizzes and assignments:', err);
      setError(err instanceof Error ? err.message : 'Failed to load quizzes and assignments. This may be due to insufficient permissions.');
    } finally {
      setLoading(false);
    }
  };

  const getAssessmentIcon = (assessment: IAssessment) => {
    if (assessment.type === 'quiz') {
      return <Quiz color="primary" />;
    } else if (assessment.type === 'exam') {
      return <Assignment color="warning" />;
    } else {
      return <Grade color="info" />;
    }
  };

  const getAssessmentTypeColor = (type: string) => {
    switch (type) {
      case 'quiz':
        return 'primary';
      case 'exam':
        return 'warning';
      case 'assignment':
        return 'info';
      default:
        return 'default';
    }
  };

  const getAssignmentIcon = (assignment: Assignment) => {
    return <AssignmentIcon color="secondary" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success';
      case 'draft':
        return 'info';
      case 'archived':
        return 'default';
      default:
        return 'warning';
    }
  };

  const handleTogglePublish = async (assessment: IAssessment) => {
    try {
      if (assessment.isPublished) {
        await assessmentService.unpublishAssessment(assessment._id);
      } else {
        await assessmentService.publishAssessment(assessment._id);
      }
      loadQuizzesAndAssignments();
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleDeleteAssessment = async (assessment: IAssessment) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      try {
        await assessmentService.deleteAssessment(assessment._id);
        loadQuizzesAndAssignments();
      } catch (err) {
        console.error('Failed to delete assessment:', err);
      }
    }
  };

  if (loading) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  const totalQuizzes = assessments.length + assignments.length;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={3}>
          <Quiz sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6">
            Quizzes & Assessments ({totalQuizzes})
          </Typography>
        </Box>

        {totalQuizzes === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
            <Quiz sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Quizzes or Assessments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This course doesn't have any quizzes or assessments created yet.
            </Typography>
          </Paper>
        ) : (
          <Box>
            {/* Assessments Section */}
            {assessments.length > 0 && (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <Quiz sx={{ mr: 2 }} />
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      Assessments ({assessments.length})
                    </Typography>
                    <Chip
                      label={assessments.length}
                      size="small"
                      color="primary"
                      sx={{ mr: 2 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {assessments.map((assessment, index) => (
                      <React.Fragment key={assessment._id}>
                        <ListItem>
                          <ListItemIcon>
                            {getAssessmentIcon(assessment)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box>
                                <Box display="flex" alignItems="center" gap={2} mb={1}>
                                  <Typography variant="body1" fontWeight="medium">
                                    {assessment.title}
                                  </Typography>
                                  <Chip
                                    label={assessment.type}
                                    size="small"
                                    color={getAssessmentTypeColor(assessment.type)}
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={assessment.isPublished ? 'Published' : 'Draft'}
                                    size="small"
                                    color={getStatusColor(assessment.isPublished ? 'published' : 'draft')}
                                  />
                                </Box>
                                {assessment.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {assessment.description}
                                  </Typography>
                                )}
                                <Box display="flex" alignItems="center" gap={2}>
                                  {assessment.timeLimit && (
                                    <Box display="flex" alignItems="center">
                                      <Timer sx={{ mr: 0.5, fontSize: 16 }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {formatDuration(assessment.timeLimit)}
                                      </Typography>
                                    </Box>
                                  )}
                                  {assessment.totalMarks && (
                                    <Box display="flex" alignItems="center">
                                      <Grade sx={{ mr: 0.5, fontSize: 16 }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {assessment.totalMarks} marks
                                      </Typography>
                                    </Box>
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    Created: {formatDate(assessment.createdAt)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                          <Box>
                            <Tooltip title="View Assessment">
                              <IconButton
                                size="small"
                                onClick={() => window.open(`/student/quiz/${assessment._id}`, '_blank')}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={assessment.isPublished ? "Unpublish" : "Publish"}>
                              <IconButton
                                size="small"
                                onClick={() => handleTogglePublish(assessment)}
                              >
                                {assessment.isPublished ? <Unpublished /> : <Publish />}
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteAssessment(assessment)}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItem>
                        {index < assessments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Assignments Section */}
            {assignments.length > 0 && (
              <Accordion defaultExpanded={assessments.length === 0}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" width="100%">
                    <AssignmentIcon sx={{ mr: 2 }} />
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      Assignments ({assignments.length})
                    </Typography>
                    <Chip
                      label={assignments.length}
                      size="small"
                      color="secondary"
                      sx={{ mr: 2 }}
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    {assignments.map((assignment, index) => (
                      <React.Fragment key={assignment._id}>
                        <ListItem>
                          <ListItemIcon>
                            {getAssignmentIcon(assignment)}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Box>
                                <Box display="flex" alignItems="center" gap={2} mb={1}>
                                  <Typography variant="body1" fontWeight="medium">
                                    {assignment.title}
                                  </Typography>
                                  <Chip
                                    label={assignment.status}
                                    size="small"
                                    color={getStatusColor(assignment.status)}
                                  />
                                </Box>
                                {assignment.description && (
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {assignment.description}
                                  </Typography>
                                )}
                                <Box display="flex" alignItems="center" gap={2}>
                                  {assignment.dueDate && (
                                    <Box display="flex" alignItems="center">
                                      <Schedule sx={{ mr: 0.5, fontSize: 16 }} />
                                      <Typography variant="caption" color="text.secondary">
                                        Due: {formatDate(assignment.dueDate)}
                                      </Typography>
                                    </Box>
                                  )}
                                  {assignment.maxMarks && (
                                    <Box display="flex" alignItems="center">
                                      <Grade sx={{ mr: 0.5, fontSize: 16 }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {assignment.maxMarks} marks
                                      </Typography>
                                    </Box>
                                  )}
                                  <Typography variant="caption" color="text.secondary">
                                    Created: {formatDate(assignment.createdAt)}
                                  </Typography>
                                </Box>
                              </Box>
                            }
                          />
                          <Box>
                            <Tooltip title="View Assignment">
                              <IconButton
                                size="small"
                                onClick={() => window.open(`/student/assignment/${assignment._id}`, '_blank')}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Assignment">
                              <IconButton size="small">
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Assignment">
                              <IconButton size="small" color="error">
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </ListItem>
                        {index < assignments.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}

        {/* Quizzes Summary */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Assessment Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="primary">
                  {assessments.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Assessments
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="secondary">
                  {assignments.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Assignments
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="success">
                  {assessments.filter(a => a.isPublished).length + assignments.filter(a => a.status === 'published').length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Published
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box textAlign="center">
                <Typography variant="h6" color="info">
                  {assessments.reduce((total, a) => total + (a.totalMarks || 0), 0) + 
                   assignments.reduce((total, a) => total + (a.maxMarks || 0), 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Marks
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AdminCourseQuizzes;

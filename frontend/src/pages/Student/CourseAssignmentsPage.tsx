import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack,
  Assignment,
  CheckCircle,
  Schedule,
  Upload,
  Download,
  Visibility,
  Edit,
  TurnedIn,
  Warning,
  Info,
  AttachFile,
  Send,
  Grade,
  Feedback,
  Timer,
  CalendarToday
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { fileUploadService } from '../../services/fileUploadService';

interface Assignment {
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
  createdAt: Date;
  updatedAt: Date;
}

interface AssignmentSubmission {
  _id: string;
  assignment: string;
  student: string;
  submissionText?: string;
  attachments: Array<{
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: Date;
  }>;
  submittedAt: Date;
  isLate: boolean;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
  gradedAt?: Date;
  gradedBy?: string;
}

const CourseAssignmentsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  // Assignment submission state
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // View submission state
  const [viewSubmissionDialogOpen, setViewSubmissionDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);

  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');

  // Load assignments and submissions
  useEffect(() => {
    const loadAssignments = async () => {
      if (!user || !id) {
        setError('Please log in to access assignments');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load course details
        const courseData = await courseService.getPublicCourseById(id);
        setCourse(courseData);

        // Load assignments
        const assignmentsData = await assignmentService.getCourseAssignments(id);
        console.log('CourseAssignmentsPage - assignmentsData loaded:', assignmentsData, 'isArray:', Array.isArray(assignmentsData));
        // Ensure assignmentsData is always an array
        const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : [];
        console.log('CourseAssignmentsPage - assignmentsArray set:', assignmentsArray);
        setAssignments(assignmentsArray);

        // Load student submissions
        const submissionsData = await assignmentService.getStudentSubmissions(id);
        const submissionsMap: Record<string, AssignmentSubmission> = {};
        submissionsData?.forEach((submission: AssignmentSubmission) => {
          submissionsMap[submission.assignment] = submission;
        });
        setSubmissions(submissionsMap);

      } catch (err: any) {
        console.error('Assignments loading failed:', err);
        setError(err.message || 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [id, user]);

  // Get assignment status
  const getAssignmentStatus = (assignment: Assignment) => {
    const submission = submissions[assignment._id];
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    if (submission) {
      if (submission.status === 'graded') return 'graded';
      if (submission.status === 'returned') return 'returned';
      return 'submitted';
    }

    if (now > dueDate) return 'overdue';
    if (dueDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) return 'due-soon';
    return 'pending';
  };

  // Get status color and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'graded':
        return { color: 'success', icon: <Grade />, label: 'Graded' };
      case 'returned':
        return { color: 'info', icon: <Feedback />, label: 'Returned' };
      case 'submitted':
        return { color: 'primary', icon: <CheckCircle />, label: 'Submitted' };
      case 'overdue':
        return { color: 'error', icon: <Warning />, label: 'Overdue' };
      case 'due-soon':
        return { color: 'warning', icon: <Timer />, label: 'Due Soon' };
      default:
        return { color: 'default', icon: <Assignment />, label: 'Pending' };
    }
  };

  // Filter assignments
  const getFilteredAssignments = () => {
    // Ensure assignments is always an array
    const assignmentsArray = Array.isArray(assignments) ? assignments : [];
    
    if (statusFilter === 'all') return assignmentsArray;
    
    return assignmentsArray.filter(assignment => {
      const status = getAssignmentStatus(assignment);
      return status === statusFilter;
    });
  };

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(files);
  };

  // Submit assignment
  const handleSubmitAssignment = async () => {
    if (!selectedAssignment || !id) return;

    try {
      setSubmitting(true);

      // Upload files if any
      let attachments: any[] = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const uploadResult = await fileUploadService.uploadAssignmentFile(file, id, selectedAssignment._id);
          attachments.push(uploadResult);
        }
      }

      // Submit assignment
      const submissionData = {
        assignmentId: selectedAssignment._id,
        submissionText: submissionText.trim() || undefined,
        attachments
      };

      const submission = await assignmentService.submitAssignment(submissionData);

      // Update local state
      setSubmissions(prev => ({
        ...prev,
        [selectedAssignment._id]: submission
      }));

      // Close dialog and reset state
      setSubmissionDialogOpen(false);
      setSelectedAssignment(null);
      setSubmissionText('');
      setSelectedFiles([]);

      // Show success message
      setError(null);

    } catch (err: any) {
      console.error('Assignment submission failed:', err);
      setError(err.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  // Open submission dialog
  const openSubmissionDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionDialogOpen(true);
    
    // Pre-fill with existing submission if available
    const existingSubmission = submissions[assignment._id];
    if (existingSubmission) {
      setSubmissionText(existingSubmission.submissionText || '');
    }
  };

  // View submission details
  const viewSubmissionDetails = (assignment: Assignment) => {
    const submission = submissions[assignment._id];
    if (submission) {
      setSelectedSubmission(submission);
      setSelectedAssignment(assignment);
      setViewSubmissionDialogOpen(true);
    }
  };

  // Download attachment
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
      console.error('Download failed:', error);
      setError('Failed to download file');
    }
  };

  // Get time remaining
  const getTimeRemaining = (dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();

    if (diff < 0) return 'Overdue';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    return 'Due soon';
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error && !course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/dashboard/student/course/${id}`)}
          variant="outlined"
        >
          Back to Course
        </Button>
      </Container>
    );
  }

  const filteredAssignments = getFilteredAssignments();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/dashboard/student/course/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to Course
        </Button>

        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Assignment color="primary" />
              {course?.title} - Assignments
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Complete and submit your assignments to demonstrate your learning progress
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filters and Tabs */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
              <Tab label="All Assignments" />
              <Tab label="Pending" />
              <Tab label="Submitted" />
              <Tab label="Graded" />
            </Tabs>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="due-soon">Due Soon</MenuItem>
                <MenuItem value="submitted">Submitted</MenuItem>
                <MenuItem value="graded">Graded</MenuItem>
                <MenuItem value="overdue">Overdue</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {/* Assignments List */}
      {filteredAssignments.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No assignments found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {statusFilter === 'all' 
              ? "Your instructor hasn't created any assignments yet."
              : `No assignments match the selected filter: ${statusFilter}`
            }
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredAssignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const statusInfo = getStatusInfo(status);
            const submission = submissions[assignment._id];

            return (
              <Grid item xs={12} key={assignment._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          {assignment.title}
                          {assignment.isRequired && (
                            <Chip 
                              label="Required" 
                              color="error" 
                              size="small" 
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {assignment.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            color={statusInfo.color as any}
                            size="small"
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <CalendarToday fontSize="small" />
                            <Typography variant="body2">
                              Due: {new Date(assignment.dueDate).toLocaleString()}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Grade fontSize="small" />
                            <Typography variant="body2">
                              {assignment.maxPoints} points
                            </Typography>
                          </Box>
                        </Box>

                        <Typography variant="body2" color="text.secondary">
                          {getTimeRemaining(assignment.dueDate)}
                        </Typography>

                        {/* Submission Info */}
                        {submission && (
                          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="body2" gutterBottom>
                              <strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}
                              {submission.isLate && (
                                <Chip label="Late" color="warning" size="small" sx={{ ml: 1 }} />
                              )}
                            </Typography>
                            {submission.grade !== undefined && (
                              <Typography variant="body2" gutterBottom>
                                <strong>Grade:</strong> {submission.grade}/{assignment.maxPoints} 
                                ({Math.round((submission.grade / assignment.maxPoints) * 100)}%)
                              </Typography>
                            )}
                            {submission.feedback && (
                              <Typography variant="body2">
                                <strong>Feedback:</strong> {submission.feedback}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, ml: 2 }}>
                        {submission ? (
                          <>
                            <Button
                              variant="outlined"
                              startIcon={<Visibility />}
                              onClick={() => viewSubmissionDetails(assignment)}
                            >
                              View Submission
                            </Button>
                            {status !== 'graded' && new Date() < new Date(assignment.dueDate) && (
                              <Button
                                variant="contained"
                                startIcon={<Edit />}
                                onClick={() => openSubmissionDialog(assignment)}
                              >
                                Edit Submission
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button
                            variant="contained"
                            startIcon={<TurnedIn />}
                            onClick={() => openSubmissionDialog(assignment)}
                            disabled={status === 'overdue'}
                          >
                            Submit Assignment
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Assignment Submission Dialog */}
      <Dialog 
        open={submissionDialogOpen} 
        onClose={() => setSubmissionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Submit Assignment: {selectedAssignment?.title}
        </DialogTitle>
        <DialogContent>
          {selectedAssignment && (
            <Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedAssignment.instructions}
              </Typography>
              
              <Divider sx={{ my: 2 }} />

              {/* Text Submission */}
              {(selectedAssignment.submissionType === 'text' || selectedAssignment.submissionType === 'both') && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Text Submission
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={submissionText}
                    onChange={(e) => setSubmissionText(e.target.value)}
                    placeholder="Enter your submission text here..."
                    variant="outlined"
                  />
                </Box>
              )}

              {/* File Upload */}
              {(selectedAssignment.submissionType === 'file' || selectedAssignment.submissionType === 'both') && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    File Attachments
                  </Typography>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    id="file-upload"
                    accept={selectedAssignment.allowedFileTypes.join(',')}
                  />
                  <label htmlFor="file-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<AttachFile />}
                      sx={{ mb: 2 }}
                    >
                      Choose Files
                    </Button>
                  </label>
                  
                  {selectedFiles.length > 0 && (
                    <List dense>
                      {selectedFiles.map((file, index) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <AttachFile />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                  
                  <Typography variant="caption" color="text.secondary">
                    Allowed file types: {selectedAssignment.allowedFileTypes.join(', ')}
                    <br />
                    Maximum file size: {selectedAssignment.maxFileSize / 1024 / 1024} MB
                  </Typography>
                </Box>
              )}

              {/* Submission Requirements */}
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Due:</strong> {new Date(selectedAssignment.dueDate).toLocaleString()}
                  <br />
                  <strong>Points:</strong> {selectedAssignment.maxPoints}
                  <br />
                  {selectedAssignment.isRequired && (
                    <>
                      <strong>This assignment is required for course completion.</strong>
                    </>
                  )}
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmissionDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitAssignment}
            variant="contained"
            disabled={submitting || (!submissionText.trim() && selectedFiles.length === 0)}
            startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
          >
            {submitting ? 'Submitting...' : 'Submit Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Submission Dialog */}
      <Dialog 
        open={viewSubmissionDialogOpen} 
        onClose={() => setViewSubmissionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Submission Details: {selectedAssignment?.title}
        </DialogTitle>
        <DialogContent>
          {selectedSubmission && selectedAssignment && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Submitted At
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedSubmission.submittedAt).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip 
                    label={selectedSubmission.status}
                    color={selectedSubmission.status === 'graded' ? 'success' : 'primary'}
                    size="small"
                  />
                </Grid>
                {selectedSubmission.grade !== undefined && (
                  <>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Grade
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {selectedSubmission.grade}/{selectedAssignment.maxPoints}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Percentage
                      </Typography>
                      <Typography variant="h6" color="primary.main">
                        {Math.round((selectedSubmission.grade / selectedAssignment.maxPoints) * 100)}%
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Text Submission */}
              {selectedSubmission.submissionText && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Text Submission
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body1" style={{ whiteSpace: 'pre-wrap' }}>
                      {selectedSubmission.submissionText}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {/* File Attachments */}
              {selectedSubmission.attachments.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    File Attachments
                  </Typography>
                  <List>
                    {selectedSubmission.attachments.map((attachment, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <AttachFile />
                        </ListItemIcon>
                        <ListItemText
                          primary={attachment.originalName}
                          secondary={`${(attachment.fileSize / 1024 / 1024).toFixed(2)} MB - Uploaded ${new Date(attachment.uploadedAt).toLocaleString()}`}
                        />
                        <IconButton onClick={() => downloadAttachment(attachment)}>
                          <Download />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Feedback */}
              {selectedSubmission.feedback && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Instructor Feedback
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'info.contrastText' }}>
                    <Typography variant="body1">
                      {selectedSubmission.feedback}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewSubmissionDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseAssignmentsPage;
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
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
  Paper,
  Tooltip
} from '@mui/material';
import {
  ArrowBack,
  VideoCall,
  Assignment,
  Quiz,
  Note,
  People,
  Analytics,
  Settings,
  PlayArrow,
  Add,
  Edit,
  Delete,
  Visibility,
  Schedule,
  School,
  AttachMoney,
  Star,
  Upload,
  Download,
  Send,
  Folder,
  CloudUpload,
  Description,
  AutoAwesome
} from '@mui/icons-material';
import { useAuth } from '../../store/AuthContext';
import { courseService, ICourse } from '../../services/courseService';
import { courseContentService, ICourseContent } from '../../services/courseContentService';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import { CourseStatus } from '../../shared/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`course-tabpanel-${index}`}
      aria-labelledby={`course-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CourseManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [courseContent, setCourseContent] = useState<ICourseContent[]>([]);
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);
  const [assessmentsLoading, setAssessmentsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [liveSessionDialogOpen, setLiveSessionDialogOpen] = useState(false);
  const [uploadAssessmentDialogOpen, setUploadAssessmentDialogOpen] = useState(false);
  const [uploadToExistingDialogOpen, setUploadToExistingDialogOpen] = useState(false);
  
  // Form states
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentPoints, setAssignmentPoints] = useState('100');
  const [assignmentInstructions, setAssignmentInstructions] = useState('');
  
  // Assignment document upload states
  const [assignmentDocument, setAssignmentDocument] = useState<File | null>(null);
  const [uploadingAssignmentDoc, setUploadingAssignmentDoc] = useState(false);
  const [selectedAssignmentForUpload, setSelectedAssignmentForUpload] = useState<ICourseContent | null>(null);
  const [assignmentUploadDialogOpen, setAssignmentUploadDialogOpen] = useState(false);
  
  // Assessment upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentDescription, setAssessmentDescription] = useState('');
  const [assessmentType, setAssessmentType] = useState<'quiz' | 'assignment' | 'exam' | 'project' | 'homework'>('exam');
  const [extractingQuestions, setExtractingQuestions] = useState(false);
  
  // Upload to existing assessment states
  const [selectedAssessment, setSelectedAssessment] = useState<IAssessment | null>(null);
  const [existingUploadFile, setExistingUploadFile] = useState<File | null>(null);
  const [addingToExisting, setAddingToExisting] = useState(false);

  // Load course details and content
  useEffect(() => {
    const loadCourse = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        setError(null);

        const courseData = await courseService.getCourseById(id);
        setCourse(courseData);

        // Load course content
        try {
          const contentData = await courseContentService.getCourseContent(id);
          setCourseContent(contentData.content);
        } catch (contentError) {
          // Content might not exist yet, which is fine
          setCourseContent([]);
        }

        // Load assessments for this course
        try {
          const assessmentData = await assessmentService.getTeacherAssessments({ courseId: id });
          setAssessments(assessmentData.assessments);
        } catch (assessmentError) {
          // Assessments might not exist yet, which is fine
          setAssessments([]);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [id, user]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Get user-friendly status display
  const getStatusDisplay = (status: CourseStatus) => {
    switch (status) {
      case CourseStatus.DRAFT:
        return 'Draft';
      case CourseStatus.PENDING_APPROVAL:
        return 'Pending Approval';
      case CourseStatus.APPROVED:
        return 'Approved';
      case CourseStatus.REJECTED:
        return 'Rejected';
      case CourseStatus.ARCHIVED:
        return 'Archived';
      default:
        return status;
    }
  };

  // Handle start live session
  const handleStartLiveSession = () => {
    if (course) {
      // Navigate to live session creation/management
      navigate(`/dashboard/teacher/live-sessions/create?courseId=${course._id}`);
    }
  };

  // Handle add note
  const handleAddNote = async () => {
    if (!course || !noteTitle.trim() || !noteContent.trim()) return;

    try {
      setContentLoading(true);
      const newNote = await courseContentService.addNote(course._id, noteTitle, noteContent);
      setCourseContent(prev => [...prev, newNote]);
      setSuccess('Note added successfully!');
      setNoteDialogOpen(false);
      setNoteTitle('');
      setNoteContent('');
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
    } finally {
      setContentLoading(false);
    }
  };

  // Handle add assignment
  const handleAddAssignment = async () => {
    if (!course || !assignmentTitle.trim() || !assignmentDescription.trim()) return;

    try {
      setContentLoading(true);
      const newAssignment = await courseContentService.addEnhancedAssignment(
        course._id, 
        assignmentTitle, 
        assignmentDescription, 
        assignmentDueDate,
        parseInt(assignmentPoints) || 100,
        assignmentInstructions,
        assignmentDocument
      );
      setCourseContent(prev => [...prev, newAssignment]);
      setSuccess('Assignment created successfully!');
      setAssignmentDialogOpen(false);
      setAssignmentTitle('');
      setAssignmentDescription('');
      setAssignmentDueDate('');
      setAssignmentPoints('100');
      setAssignmentInstructions('');
      setAssignmentDocument(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create assignment');
    } finally {
      setContentLoading(false);
    }
  };

  // Handle file upload for assessment
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

      setUploadedFile(file);
      setError(null);
    }
  };

  // Remove uploaded file
  const removeUploadedFile = () => {
    setUploadedFile(null);
  };

  // Handle create assessment from uploaded document
  const handleCreateAssessmentFromDocument = async () => {
    if (!course || !assessmentTitle.trim() || !uploadedFile) return;

    try {
      setExtractingQuestions(true);
      setAssessmentsLoading(true);
      setError(null);

      const assessmentData = {
        title: assessmentTitle,
        description: assessmentDescription,
        course: course._id,
        type: assessmentType,
        questions: [],
        attempts: 1,
        instructions: 'Please read all questions carefully before answering.',
        allowLateSubmission: false,
        randomizeQuestions: false,
        randomizeOptions: false,
        showResultsImmediately: true,
        showCorrectAnswers: true,
        requireProctoring: false,
        passingScore: 70,
        isPublished: false
      };

      const newAssessment = await assessmentService.createAssessment(assessmentData, uploadedFile);
      setAssessments(prev => [...prev, newAssessment]);
      setSuccess(`Assessment "${assessmentTitle}" created successfully with AI-extracted questions!`);
      
      // Reset form
      setUploadAssessmentDialogOpen(false);
      setAssessmentTitle('');
      setAssessmentDescription('');
      setAssessmentType('exam');
      setUploadedFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to create assessment from document');
    } finally {
      setExtractingQuestions(false);
      setAssessmentsLoading(false);
    }
  };

  // Handle file upload for existing assessment
  const handleExistingFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      setExistingUploadFile(file);
      setError(null);
    }
  };

  // Remove uploaded file for existing assessment
  const removeExistingUploadFile = () => {
    setExistingUploadFile(null);
  };

  // Handle opening upload dialog for existing assessment
  const handleUploadToExisting = (assessment: IAssessment) => {
    setSelectedAssessment(assessment);
    setUploadToExistingDialogOpen(true);
  };

  // Handle adding questions to existing assessment
  const handleAddQuestionsToExisting = async () => {
    if (!selectedAssessment || !existingUploadFile) return;

    try {
      setAddingToExisting(true);
      setError(null);

      const updatedAssessment = await assessmentService.addQuestionsFromDocument(
        selectedAssessment._id,
        existingUploadFile
      );

      // Update the assessment in the list
      setAssessments(prev => 
        prev.map(assessment => 
          assessment._id === selectedAssessment._id ? updatedAssessment : assessment
        )
      );

      setSuccess(`Successfully added questions to "${selectedAssessment.title}"!`);
      
      // Reset form
      setUploadToExistingDialogOpen(false);
      setSelectedAssessment(null);
      setExistingUploadFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to add questions to assessment');
    } finally {
      setAddingToExisting(false);
    }
  };

  // Handle assignment document upload
  const handleAssignmentDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF, Word document, text file, or image');
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setAssignmentDocument(file);
      setError(null);
    }
  };

  // Remove assignment document
  const removeAssignmentDocument = () => {
    setAssignmentDocument(null);
  };

  // Handle opening upload dialog for existing assignment
  const handleUploadToAssignment = (assignment: ICourseContent) => {
    setSelectedAssignmentForUpload(assignment);
    setAssignmentUploadDialogOpen(true);
  };

  // Handle uploading document to existing assignment
  const handleUploadDocumentToAssignment = async () => {
    if (!selectedAssignmentForUpload || !assignmentDocument) return;

    try {
      setUploadingAssignmentDoc(true);
      setError(null);

      const updatedAssignment = await courseContentService.uploadAssignmentDocument(
        course!._id,
        selectedAssignmentForUpload._id!,
        assignmentDocument
      );

      // Update the assignment in the list
      setCourseContent(prev => 
        prev.map(content => 
          content._id === selectedAssignmentForUpload._id ? updatedAssignment : content
        )
      );

      setSuccess(`Document uploaded successfully to "${selectedAssignmentForUpload.title}"!`);
      
      // Reset form
      setAssignmentUploadDialogOpen(false);
      setSelectedAssignmentForUpload(null);
      setAssignmentDocument(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document to assignment');
    } finally {
      setUploadingAssignmentDoc(false);
    }
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
          onClick={() => navigate('/dashboard/teacher/courses')}
          variant="outlined"
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">
          Course not found
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/teacher/courses')}
          variant="outlined"
          sx={{ mt: 2 }}
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/teacher/courses')}
          sx={{ mb: 2 }}
        >
          Back to Courses
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {course.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label={getStatusDisplay(course.status)}
                color={
                  course.status === CourseStatus.APPROVED ? 'success' : 
                  course.status === CourseStatus.PENDING_APPROVAL ? 'warning' : 
                  'error'
                }
              />
              <Chip label={course.category} variant="outlined" />
              <Chip label={course.level} variant="outlined" />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              onClick={handleStartLiveSession}
              color="primary"
            >
              Start Live Session
            </Button>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              onClick={() => navigate(`/courses/${course._id}`)}
            >
              Preview Course
            </Button>
          </Box>
        </Box>

        {/* Success/Error Messages */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>

      {/* Course Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">{course.enrollmentCount || 0}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enrolled Students
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Star color="warning" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">{course.rating?.toFixed(1) || 'N/A'}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average Rating
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule color="info" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">{course.duration}h</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Course Duration
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h5">${course.price}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Course Price
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="course management tabs">
            <Tab label="Overview" icon={<School />} />
            <Tab label="Materials" icon={<Folder />} />
            <Tab label="Content & Notes" icon={<Note />} />
            <Tab label="Assignments" icon={<Assignment />} />
            <Tab label="Assessments" icon={<Quiz />} />
            <Tab label="Students" icon={<People />} />
            <Tab label="Analytics" icon={<Analytics />} />
            <Tab label="Settings" icon={<Settings />} />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                Course Description
              </Typography>
              <Typography variant="body1" paragraph>
                {course.description}
              </Typography>

              <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                Learning Outcomes
              </Typography>
              <List>
                {course.learningOutcomes?.map((outcome, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <School color="primary" />
                    </ListItemIcon>
                    <ListItemText primary={outcome} />
                  </ListItem>
                )) || (
                  <ListItem>
                    <ListItemText primary="No learning outcomes defined yet" />
                  </ListItem>
                )}
              </List>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<VideoCall />}
                    onClick={handleStartLiveSession}
                    fullWidth
                  >
                    Start Live Session
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Note />}
                    onClick={() => setNoteDialogOpen(true)}
                    fullWidth
                  >
                    Add Course Note
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Assignment />}
                    onClick={() => setAssignmentDialogOpen(true)}
                    fullWidth
                  >
                    Create Assignment
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Quiz />}
                    onClick={() => navigate(`/dashboard/teacher/assessments/create?courseId=${course._id}`)}
                    fullWidth
                  >
                    Create Assessment
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUpload />}
                    onClick={() => setUploadAssessmentDialogOpen(true)}
                    fullWidth
                    sx={{ 
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      color: 'white',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                      }
                    }}
                  >
                    <AutoAwesome sx={{ mr: 1 }} />
                    AI Upload Assessment
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Content & Notes Tab */}
        <TabPanel value={tabValue} index={1}>
          {/* Materials Tab */}
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">Course Materials</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate(`/dashboard/teacher/courses/${id}/materials`)}
              >
                Manage Materials
              </Button>
            </Box>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              Upload videos, documents, and other learning resources for your students. 
              Click "Manage Materials" to add, edit, or organize course materials.
            </Alert>
            
            <Paper sx={{ p: 2 }}>
              <Typography variant="body1" color="textSecondary">
                Materials management has been moved to a dedicated page for better organization and file handling.
              </Typography>
            </Paper>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Course Content & Notes
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setNoteDialogOpen(true)}
            >
              Add Note
            </Button>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Course Materials
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Upload />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Upload Course Materials"
                      secondary="Add videos, documents, and other resources"
                    />
                    <ListItemSecondaryAction>
                      <IconButton>
                        <Add />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Course Notes
                </Typography>
                <List>
                  {courseContent.filter(content => content.type === 'document').length === 0 ? (
                    <ListItem>
                      <ListItemText 
                        primary="No notes added yet"
                        secondary="Add notes for your students to read"
                      />
                    </ListItem>
                  ) : (
                    courseContent
                      .filter(content => content.type === 'document')
                      .map((note) => (
                        <ListItem key={note._id}>
                          <ListItemIcon>
                            <Note color="primary" />
                          </ListItemIcon>
                          <ListItemText 
                            primary={note.title}
                            secondary={`Created: ${new Date(note.createdAt || '').toLocaleDateString()}`}
                          />
                          <ListItemSecondaryAction>
                            <IconButton size="small">
                              <Edit />
                            </IconButton>
                            <IconButton size="small" color="error">
                              <Delete />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      ))
                  )}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Assignments Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Assignments
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setAssignmentDialogOpen(true)}
            >
              Create Assignment
            </Button>
          </Box>

          <Paper sx={{ p: 2 }}>
            {courseContent.filter(content => content.type === 'assignment').length === 0 ? (
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No assignments created yet. Create your first assignment to engage students.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {courseContent
                  .filter(content => content.type === 'assignment')
                  .map((assignment) => {
                    const assignmentData = assignment.content ? JSON.parse(assignment.content) : {};
                    return (
                      <Grid item xs={12} key={assignment._id}>
                        <Card sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                <Assignment color="primary" />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {assignment.title}
                                </Typography>
                                {assignmentData.points && (
                                  <Chip 
                                    label={`${assignmentData.points} pts`} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {assignmentData.description}
                              </Typography>
                              
                              {assignmentData.instructions && (
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>
                                  Instructions: {assignmentData.instructions}
                                </Typography>
                              )}
                              
                              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                {assignmentData.dueDate && (
                                  <Typography variant="caption" color="text.secondary">
                                    Due: {new Date(assignmentData.dueDate).toLocaleDateString()}
                                  </Typography>
                                )}
                                
                                {assignment.fileUrl && (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Description fontSize="small" color="primary" />
                                    <Typography variant="caption" color="primary">
                                      Document attached
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                              <Tooltip title="Upload assignment document">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleUploadToAssignment(assignment)}
                                  sx={{ 
                                    color: 'success.main',
                                    '&:hover': { backgroundColor: 'success.50' }
                                  }}
                                >
                                  <Upload />
                                </IconButton>
                              </Tooltip>
                              
                              {assignment.fileUrl && (
                                <Tooltip title="Download assignment document">
                                  <IconButton 
                                    size="small" 
                                    component="a"
                                    href={assignment.fileUrl}
                                    target="_blank"
                                    sx={{ 
                                      color: 'info.main',
                                      '&:hover': { backgroundColor: 'info.50' }
                                    }}
                                  >
                                    <Download />
                                  </IconButton>
                                </Tooltip>
                              )}
                              
                              <Tooltip title="View submissions">
                                <IconButton 
                                  size="small"
                                  onClick={() => navigate(`/dashboard/teacher/assignments/${assignment._id}/submissions`)}
                                  sx={{ 
                                    color: 'primary.main',
                                    '&:hover': { backgroundColor: 'primary.50' }
                                  }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Edit assignment">
                                <IconButton size="small">
                                  <Edit />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Delete assignment">
                                <IconButton size="small" color="error">
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </Box>
                        </Card>
                      </Grid>
                    );
                  })
                }
              </Grid>
            )}
          </Paper>
        </TabPanel>

        {/* Assessments Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">
              Assessments & Quizzes ({assessments.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => navigate(`/dashboard/teacher/assessments/create?courseId=${course._id}`)}
              >
                Create Assessment
              </Button>
              <Button
                variant="contained"
                startIcon={<CloudUpload />}
                onClick={() => setUploadAssessmentDialogOpen(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                  }
                }}
              >
                <AutoAwesome sx={{ mr: 1 }} />
                AI Upload
              </Button>
            </Box>
          </Box>

          {assessmentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : assessments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No assessments created yet
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Create assessments to test student knowledge. You can create them manually or upload documents for AI extraction.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => navigate(`/dashboard/teacher/assessments/create?courseId=${course._id}`)}
                >
                  Create Manually
                </Button>
                <Button
                  variant="contained"
                  startIcon={<CloudUpload />}
                  onClick={() => setUploadAssessmentDialogOpen(true)}
                  sx={{ 
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                    }
                  }}
                >
                  <AutoAwesome sx={{ mr: 1 }} />
                  Upload & Extract
                </Button>
              </Box>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {assessments.map((assessment) => (
                <Grid item xs={12} md={6} key={assessment._id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" gutterBottom>
                            {assessment.title}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <Chip 
                              label={assessment.type.charAt(0).toUpperCase() + assessment.type.slice(1)} 
                              size="small" 
                              color="primary" 
                            />
                            <Chip 
                              label={assessment.isPublished ? 'Published' : 'Draft'} 
                              size="small" 
                              color={assessment.isPublished ? 'success' : 'default'} 
                            />
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/dashboard/teacher/assessments/${assessment._id}`)}
                        >
                          <Visibility />
                        </IconButton>
                      </Box>
                      
                      {assessment.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {assessment.description.length > 100 
                            ? `${assessment.description.substring(0, 100)}...` 
                            : assessment.description
                          }
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {assessment.questions?.length || 0} Questions • {assessment.totalPoints || 0} Points
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Upload document to add more questions with AI">
                            <IconButton
                              size="small"
                              onClick={() => handleUploadToExisting(assessment)}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': {
                                  backgroundColor: 'primary.50'
                                }
                              }}
                            >
                              <CloudUpload />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit assessment">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/dashboard/teacher/assessments/${assessment._id}/edit`)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="View submissions">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/dashboard/teacher/assessments/${assessment._id}/submissions`)}
                            >
                              <Assignment />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Students Tab */}
        <TabPanel value={tabValue} index={4}>
          <Typography variant="h6" gutterBottom>
            Enrolled Students ({course.enrollmentCount || 0})
          </Typography>

          <Paper sx={{ p: 2 }}>
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {course.enrollmentCount === 0 
                ? 'No students enrolled yet.'
                : 'Student management features coming soon.'
              }
            </Typography>
          </Paper>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={5}>
          <Typography variant="h6" gutterBottom>
            Course Analytics
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Enrollment Trends
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Analytics dashboard coming soon
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Student Progress
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Progress tracking coming soon
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={tabValue} index={6}>
          <Typography variant="h6" gutterBottom>
            Course Settings
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Course Information
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  onClick={() => navigate(`/dashboard/teacher/courses/${course._id}/edit`)}
                >
                  Edit Course Details
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Course Status
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current status: {getStatusDisplay(course.status)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Card>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Course Note</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Note Title"
            fullWidth
            variant="outlined"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Note Content"
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Write your note content here. Students will be able to read this note."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddNote} 
            variant="contained"
            disabled={!noteTitle.trim() || !noteContent.trim()}
          >
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment color="primary" />
          Create Assignment
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Assignment Title *"
            fullWidth
            variant="outlined"
            value={assignmentTitle}
            onChange={(e) => setAssignmentTitle(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="e.g., Essay on Climate Change, Math Problem Set 1"
          />
          
          <TextField
            margin="dense"
            label="Assignment Description *"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={assignmentDescription}
            onChange={(e) => setAssignmentDescription(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Describe what students need to do for this assignment"
          />
          
          <TextField
            margin="dense"
            label="Detailed Instructions"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={assignmentInstructions}
            onChange={(e) => setAssignmentInstructions(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Additional instructions, formatting requirements, submission guidelines, etc."
          />
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              label="Points"
              type="number"
              variant="outlined"
              value={assignmentPoints}
              onChange={(e) => setAssignmentPoints(e.target.value)}
              sx={{ width: '150px' }}
              inputProps={{ min: 1, max: 1000 }}
            />
            
            <TextField
              margin="dense"
              label="Due Date"
              type="datetime-local"
              fullWidth
              variant="outlined"
              value={assignmentDueDate}
              onChange={(e) => setAssignmentDueDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
          
          {/* Assignment Document Upload Section */}
          <Paper sx={{ p: 3, border: '2px dashed #e0e0e0', borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description />
              Assignment Document (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a document with assignment details, rubric, or additional materials for students.
            </Typography>
            
            {!assignmentDocument ? (
              <Box sx={{ textAlign: 'center' }}>
                <input
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  style={{ display: 'none' }}
                  id="assignment-document-upload"
                  type="file"
                  onChange={handleAssignmentDocumentUpload}
                />
                <label htmlFor="assignment-document-upload">
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
                  Supported formats: PDF, Word, Text, Images • Max size: 10MB
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description color="primary" />
                  <Box>
                    <Typography variant="body2" fontWeight="medium">
                      {assignmentDocument.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(assignmentDocument.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  color="error"
                  onClick={removeAssignmentDocument}
                  startIcon={<Delete />}
                >
                  Remove
                </Button>
              </Box>
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleAddAssignment} 
            variant="contained"
            disabled={!assignmentTitle.trim() || !assignmentDescription.trim() || contentLoading}
            startIcon={contentLoading ? <CircularProgress size={16} /> : <Assignment />}
          >
            {contentLoading ? 'Creating...' : 'Create Assignment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Assessment Dialog */}
      <Dialog open={uploadAssessmentDialogOpen} onClose={() => setUploadAssessmentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome color="primary" />
          AI Assessment Upload & Extraction
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Upload a document containing assessment questions and our AI will automatically extract and format them for you.
          </Typography>
          
          <TextField
            autoFocus
            margin="dense"
            label="Assessment Title *"
            fullWidth
            variant="outlined"
            value={assessmentTitle}
            onChange={(e) => setAssessmentTitle(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="e.g., Midterm Exam, Chapter 5 Quiz"
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            value={assessmentDescription}
            onChange={(e) => setAssessmentDescription(e.target.value)}
            sx={{ mb: 2 }}
            placeholder="Brief description of what this assessment covers"
          />
          
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Assessment Type</InputLabel>
            <Select
              value={assessmentType}
              label="Assessment Type"
              onChange={(e) => setAssessmentType(e.target.value as any)}
            >
              <MenuItem value="quiz">Quiz</MenuItem>
              <MenuItem value="exam">Exam</MenuItem>
              <MenuItem value="assignment">Assignment</MenuItem>
              <MenuItem value="project">Project</MenuItem>
              <MenuItem value="homework">Homework</MenuItem>
            </Select>
          </FormControl>

          {/* File Upload Section */}
          <Paper sx={{ p: 3, border: '2px dashed #e0e0e0', borderRadius: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Description />
              Upload Document
            </Typography>
            
            {!uploadedFile ? (
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
                      {uploadedFile.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  color="error"
                  onClick={removeUploadedFile}
                  startIcon={<Delete />}
                >
                  Remove
                </Button>
              </Box>
            )}
          </Paper>
          
          {extractingQuestions && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="primary">
                AI is extracting questions from your document...
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadAssessmentDialogOpen(false)} disabled={extractingQuestions}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreateAssessmentFromDocument} 
            variant="contained"
            disabled={!assessmentTitle.trim() || !uploadedFile || extractingQuestions}
            startIcon={extractingQuestions ? <CircularProgress size={16} /> : <AutoAwesome />}
            sx={{ 
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
              }
            }}
          >
            {extractingQuestions ? 'Processing...' : 'Create Assessment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload to Existing Assessment Dialog */}
      <Dialog open={uploadToExistingDialogOpen} onClose={() => setUploadToExistingDialogOpen(false)} maxWidth="sm" fullWidth>
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
                
                {!existingUploadFile ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <input
                      accept=".pdf,.doc,.docx,.txt"
                      style={{ display: 'none' }}
                      id="existing-assessment-document-upload"
                      type="file"
                      onChange={handleExistingFileUpload}
                    />
                    <label htmlFor="existing-assessment-document-upload">
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
                          {existingUploadFile.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(existingUploadFile.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      onClick={removeExistingUploadFile}
                      startIcon={<Delete />}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Paper>
              
              {addingToExisting && (
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
          <Button onClick={() => setUploadToExistingDialogOpen(false)} disabled={addingToExisting}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddQuestionsToExisting} 
            variant="contained"
            disabled={!existingUploadFile || addingToExisting}
            startIcon={addingToExisting ? <CircularProgress size={16} /> : <AutoAwesome />}
            sx={{ 
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
              }
            }}
          >
            {addingToExisting ? 'Adding Questions...' : 'Add Questions'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Document to Assignment Dialog */}
      <Dialog open={assignmentUploadDialogOpen} onClose={() => setAssignmentUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Upload color="primary" />
          Upload Assignment Document
        </DialogTitle>
        <DialogContent>
          {selectedAssignmentForUpload && (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Upload a document for <strong>"{selectedAssignmentForUpload.title}"</strong>
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                This document will be available for students to download along with the assignment instructions.
              </Typography>

              {/* File Upload Section */}
              <Paper sx={{ p: 3, border: '2px dashed #e0e0e0', borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Description />
                  Select Document
                </Typography>
                
                {!assignmentDocument ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <input
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                      style={{ display: 'none' }}
                      id="assignment-upload-document"
                      type="file"
                      onChange={handleAssignmentDocumentUpload}
                    />
                    <label htmlFor="assignment-upload-document">
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
                      Supported formats: PDF, Word, Text, Images • Max size: 10MB
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Description color="primary" />
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {assignmentDocument.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(assignmentDocument.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      onClick={removeAssignmentDocument}
                      startIcon={<Delete />}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Paper>
              
              {uploadingAssignmentDoc && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="primary">
                    Uploading document...
                  </Typography>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentUploadDialogOpen(false)} disabled={uploadingAssignmentDoc}>
            Cancel
          </Button>
          <Button 
            onClick={handleUploadDocumentToAssignment} 
            variant="contained"
            disabled={!assignmentDocument || uploadingAssignmentDoc}
            startIcon={uploadingAssignmentDoc ? <CircularProgress size={16} /> : <Upload />}
            sx={{ 
              background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
              }
            }}
          >
            {uploadingAssignmentDoc ? 'Uploading...' : 'Upload Document'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseManagement;
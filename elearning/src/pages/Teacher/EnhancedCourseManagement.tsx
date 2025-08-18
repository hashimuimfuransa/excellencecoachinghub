import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Tabs,
  Tab,
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
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Paper,
  Tooltip,
  LinearProgress,
  Fab,
  Avatar,
  Stack,
  Container,
  AppBar,
  Toolbar,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  VideoFile as VideoIcon,
  Description as DocumentIcon,
  Image as ImageIcon,
  AudioFile as AudioIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Schedule as ScheduleIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  ArrowBack,
  MenuBook,
  VideoCall,
  Assignment,
  Quiz,
  Announcement,
  Dashboard,
  Publish,
  UnpublishedOutlined,
  Star,
  TrendingUp,
  School,
  PlayCircle,
  PauseCircle,
  CheckCircle,
  AccessTime,
  Group,
  BarChart,
  Lightbulb,
  AutoAwesome,
  Psychology,
  EmojiEvents,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Schedule,
  Error
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import { courseNotesService } from '../../services/courseNotesService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import { assessmentService, IAssessment } from '../../services/assessmentService';
import { assignmentService, Assignment as AssignmentType } from '../../services/assignmentService';

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface CourseNote {
  _id: string;
  title: string;
  description: string;
  chapter: number;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
    estimatedReadTime: number;
  }>;
  isPublished: boolean;
  totalEstimatedTime: number;
  createdAt: string;
  updatedAt: string;
}

// Remove the local LiveSession interface since we're importing ILiveSession

interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  enrolledStudents: number;
  totalStudents: number;
  status: 'draft' | 'published' | 'archived';
}

const EnhancedCourseManagement: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [course, setCourse] = useState<Course | null>(null);
  const [courseNotes, setCourseNotes] = useState<CourseNote[]>([]);
  const [liveSessions, setLiveSessions] = useState<ILiveSession[]>([]);
  const [assessments, setAssessments] = useState<IAssessment[]>([]);
  const [assignments, setAssignments] = useState<AssignmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [assessmentType, setAssessmentType] = useState<'assessment' | 'assignment'>('assessment');

  // Dialog states
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [uploadAssessmentDialogOpen, setUploadAssessmentDialogOpen] = useState(false);
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CourseNote | null>(null);
  const [editingSession, setEditingSession] = useState<ILiveSession | null>(null);
  const [uploadingSession, setUploadingSession] = useState<ILiveSession | null>(null);
  const [editingAssessment, setEditingAssessment] = useState<IAssessment | null>(null);
  const [selectedAssessmentForUpload, setSelectedAssessmentForUpload] = useState<IAssessment | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentType | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<CourseNote | null>(null);
  const [assessmentDeleteConfirmOpen, setAssessmentDeleteConfirmOpen] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<IAssessment | null>(null);
  const [assignmentDeleteConfirmOpen, setAssignmentDeleteConfirmOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentType | null>(null);

  // Form states
  const [noteForm, setNoteForm] = useState({
    title: '',
    description: '',
    chapter: 1,
    sections: [{ 
      id: crypto.randomUUID(), 
      title: '', 
      content: '', 
      order: 1, 
      estimatedReadTime: 5 
    }]
  });

  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    duration: 60,
    maxAttendees: 50
  });

  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    description: '',
    type: 'quiz' as 'quiz' | 'assignment' | 'final',
    dueDate: '',
    timeLimit: 60,
    attempts: 1,
    instructions: '',
    passingScore: 70,
    isPublished: false
  });

  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxPoints: 100,
    submissionType: 'both' as 'file' | 'text' | 'both',
    allowedFileTypes: ['pdf', 'doc', 'docx'],
    maxFileSize: 10,
    isRequired: true
  });

  // Video upload state
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Assessment upload state
  const [uploadAssessmentFile, setUploadAssessmentFile] = useState<File | null>(null);
  const [extractingQuestions, setExtractingQuestions] = useState(false);

  // Load course data
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        setError(null);

        // Load course details
        const courseData = await courseService.getCourseById(courseId);
        setCourse(courseData);

        // Load course notes
        try {
          const notesResponse = await courseNotesService.getTeacherCourseNotes({ courseId });
          if (notesResponse && notesResponse.data && notesResponse.data.courseNotes) {
            setCourseNotes(notesResponse.data.courseNotes);
          } else {
            setCourseNotes([]);
          }
        } catch (notesError) {
          console.error('Failed to load course notes:', notesError);
          // Set empty array if no notes found
          setCourseNotes([]);
        }

        // Load live sessions for this course
        try {
          const sessionsResponse = await liveSessionService.getTeacherSessions({ 
            courseId: courseId,
            limit: 50 
          });
          if (sessionsResponse && sessionsResponse.sessions) {
            setLiveSessions(sessionsResponse.sessions);
          }
        } catch (sessionsError) {
          console.error('Failed to load live sessions:', sessionsError);
          // Set empty array if no sessions found
          setLiveSessions([]);
        }

        // Load assessments for this course
        try {
          const assessmentsResponse = await assessmentService.getTeacherAssessments({ 
            courseId: courseId,
            limit: 50 
          });
          if (assessmentsResponse && assessmentsResponse.assessments) {
            setAssessments(assessmentsResponse.assessments);
          }
        } catch (assessmentsError) {
          console.error('Failed to load assessments:', assessmentsError);
          // Set empty array if no assessments found
          setAssessments([]);
        }

        // Test backend connectivity first
        try {
          console.log('🔍 Testing backend connectivity...');
          const healthCheck = await fetch('http://localhost:5000/health');
          console.log('🏥 Health check response:', healthCheck.status, healthCheck.statusText);
        } catch (healthError) {
          console.error('❌ Backend health check failed:', healthError);
        }

        // Load assignments for this course
        try {
          console.log('🚀 Starting to load assignments for course:', courseId);
          const assignmentsResponse = await assignmentService.getCourseAssignments(courseId);
          console.log('📦 Assignments response received:', assignmentsResponse);
          if (assignmentsResponse) {
            setAssignments(assignmentsResponse);
            console.log('✅ Assignments set in state:', assignmentsResponse.length, 'assignments');
          }
        } catch (assignmentsError) {
          console.error('❌ Failed to load assignments:', assignmentsError);
          // Set empty array if no assignments found
          setAssignments([]);
        }

      } catch (err: any) {
        console.error('Failed to load course data:', err);
        setError(err.message || 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle note creation/editing
  const handleSaveNote = async () => {
    if (!courseId) return;

    try {
      if (editingNote) {
        // Update existing note
        await courseNotesService.updateCourseNotes(editingNote._id, noteForm);
        setCourseNotes(prev => 
          prev.map(note => 
            note._id === editingNote._id 
              ? { ...note, ...noteForm, updatedAt: new Date().toISOString() }
              : note
          )
        );
      } else {
        // Create new note
        const response = await courseNotesService.createCourseNotes(courseId, noteForm);
        if (response && response.data && response.data.courseNotes) {
          setCourseNotes(prev => [...prev, response.data.courseNotes]);
        }
      }
      
      setNoteDialogOpen(false);
      setEditingNote(null);
      setNoteForm({
        title: '',
        description: '',
        chapter: 1,
        sections: [{ 
          id: crypto.randomUUID(), 
          title: '', 
          content: '', 
          order: 1, 
          estimatedReadTime: 5 
        }]
      });
    } catch (error: any) {
      console.error('Failed to save note:', error);
      setError(error.message || 'Failed to save course notes');
    }
  };

  // Handle session creation/editing
  const handleSaveSession = async () => {
    try {
      if (editingSession) {
        // Update existing session
        console.log('Updating session:', sessionForm);
      } else {
        // Create new session
        console.log('Creating session:', sessionForm);
      }
      
      setSessionDialogOpen(false);
      setEditingSession(null);
      setSessionForm({
        title: '',
        description: '',
        scheduledTime: '',
        duration: 60,
        maxAttendees: 50
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  // Handle assignment creation/editing
  const handleSaveAssignment = async () => {
    if (!courseId) return;

    try {
      if (editingAssignment) {
        // Update existing assignment
        const updatedAssignment = await assignmentService.updateAssignment(editingAssignment._id, {
          title: assignmentForm.title,
          description: assignmentForm.description,
          instructions: assignmentForm.instructions,
          courseId: courseId,
          dueDate: assignmentForm.dueDate,
          maxPoints: assignmentForm.maxPoints,
          submissionType: assignmentForm.submissionType,
          allowedFileTypes: assignmentForm.allowedFileTypes,
          maxFileSize: assignmentForm.maxFileSize,
          isRequired: assignmentForm.isRequired
        });
        
        setAssignments(prev => 
          prev.map(assignment => 
            assignment._id === editingAssignment._id ? updatedAssignment : assignment
          )
        );
      } else {
        // Create new assignment
        const newAssignment = await assignmentService.createAssignment({
          title: assignmentForm.title,
          description: assignmentForm.description,
          instructions: assignmentForm.instructions,
          courseId: courseId,
          dueDate: assignmentForm.dueDate,
          maxPoints: assignmentForm.maxPoints,
          submissionType: assignmentForm.submissionType,
          allowedFileTypes: assignmentForm.allowedFileTypes,
          maxFileSize: assignmentForm.maxFileSize,
          isRequired: assignmentForm.isRequired
        });
        setAssignments(prev => [...prev, newAssignment]);
        
        // Show success message using alert for now
        alert('Assignment created successfully!');
      }
      
      setAssignmentDialogOpen(false);
      setEditingAssignment(null);
      setAssignmentForm({
        title: '',
        description: '',
        instructions: '',
        dueDate: '',
        maxPoints: 100,
        submissionType: 'both',
        allowedFileTypes: ['pdf', 'doc', 'docx'],
        maxFileSize: 10,
        isRequired: true
      });

      // Refresh assignments list to ensure persistence
      if (courseId) {
        try {
          const refreshedAssignments = await assignmentService.getCourseAssignments(courseId);
          setAssignments(refreshedAssignments);
        } catch (refreshError) {
          console.error('Failed to refresh assignments:', refreshError);
        }
      }
    } catch (error: any) {
      console.error('Failed to save assignment:', error);
      setError(error.message || 'Failed to save assignment');
    }
  };

  // Add section to note
  const addSection = () => {
    setNoteForm(prev => ({
      ...prev,
      sections: [...(prev.sections || []), { 
        id: crypto.randomUUID(), 
        title: '', 
        content: '', 
        order: (prev.sections?.length || 0) + 1, 
        estimatedReadTime: 5 
      }]
    }));
  };

  // Remove section from note
  const removeSection = (index: number) => {
    setNoteForm(prev => ({
      ...prev,
      sections: prev.sections
        .filter((_, i) => i !== index)
        .map((section, i) => ({ ...section, order: i + 1 }))
    }));
  };

  // Update section
  const updateSection = (index: number, field: string, value: any) => {
    setNoteForm(prev => ({
      ...prev,
      sections: prev.sections.map((section, i) => 
        i === index ? { ...section, [field]: value } : section
      )
    }));
  };

  // Toggle note publication
  const toggleNotePublication = async (noteId: string) => {
    try {
      await courseNotesService.togglePublishCourseNotes(noteId);
      setCourseNotes(prev => 
        prev.map(note => 
          note._id === noteId 
            ? { ...note, isPublished: !note.isPublished }
            : note
        )
      );
    } catch (error: any) {
      console.error('Failed to toggle publication:', error);
      setError(error.message || 'Failed to toggle publication status');
    }
  };

  // Delete note
  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      await courseNotesService.deleteCourseNotes(noteToDelete._id);
      setCourseNotes(prev => prev.filter(note => note._id !== noteToDelete._id));
      setDeleteConfirmOpen(false);
      setNoteToDelete(null);
    } catch (error: any) {
      console.error('Failed to delete note:', error);
      setError(error.message || 'Failed to delete course notes');
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;

    try {
      await assignmentService.deleteAssignment(assignmentToDelete._id);
      setAssignments(prev => prev.filter(assignment => assignment._id !== assignmentToDelete._id));
      setAssignmentDeleteConfirmOpen(false);
      setAssignmentToDelete(null);
      setSuccess('Assignment deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete assignment:', error);
      setError(error.message || 'Failed to delete assignment');
    }
  };

  // Handle joining live session
  const handleJoinSession = async (session: ILiveSession) => {
    try {
      if (session.status === 'scheduled') {
        // Start the session first
        await liveSessionService.startSession(session._id);
      }
      // Navigate to video session room
      navigate(`/video-session/teacher/${session._id}`);
    } catch (error: any) {
      console.error('Failed to join session:', error);
      setError(error.message || 'Failed to join session');
    }
  };

  // Handle assessment creation/editing
  const handleSaveAssessment = async () => {
    if (!courseId || !user) return;

    try {
      const assessmentData = {
        title: assessmentForm.title,
        description: assessmentForm.description,
        course: courseId,
        instructor: user.id,
        type: assessmentForm.type,
        timeLimit: assessmentForm.timeLimit,
        attempts: assessmentForm.attempts,
        dueDate: assessmentForm.dueDate,
        instructions: assessmentForm.instructions,
        isPublished: assessmentForm.isPublished,
        passingScore: assessmentForm.passingScore,
        totalPoints: 100, // Default total points
        questions: [] // Start with empty questions - teacher can add them later
      };

      if (editingAssessment) {
        // Update existing assessment
        const updatedAssessment = await assessmentService.updateAssessment(editingAssessment._id, assessmentData);
        setAssessments(prev => 
          prev.map(assessment => 
            assessment._id === editingAssessment._id ? updatedAssessment : assessment
          )
        );
      } else {
        // Create new assessment
        const newAssessment = await assessmentService.createAssessment(assessmentData);
        setAssessments(prev => [...prev, newAssessment]);
      }
      
      setAssessmentDialogOpen(false);
      setEditingAssessment(null);
      setAssessmentForm({
        title: '',
        description: '',
        type: 'quiz',
        dueDate: '',
        timeLimit: 60,
        attempts: 1,
        instructions: '',
        passingScore: 70,
        isPublished: false
      });
    } catch (error: any) {
      console.error('Failed to save assessment:', error);
      setError(error.message || 'Failed to save assessment');
    }
  };



  // Handle downloading assignment submissions
  const handleDownloadSubmissions = async (assignmentId: string) => {
    try {
      // This would typically download a ZIP file of all submissions
      console.log('Downloading submissions for assignment:', assignmentId);
      // Implementation would depend on backend API
    } catch (error: any) {
      console.error('Failed to download submissions:', error);
      setError(error.message || 'Failed to download submissions');
    }
  };

  // Handle assignment AI extraction (upload document or retry existing)
  const handleUploadAssignmentDocument = (assignment: AssignmentType) => {
    // Check if assignment has document and is stuck in pending/failed state
    const hasDocument = assignment.assignmentDocument?.fileUrl;
    const isPending = assignment.aiProcessingStatus === 'pending' || assignment.aiExtractionStatus === 'pending';
    const isFailed = assignment.aiProcessingStatus === 'failed' || assignment.aiExtractionStatus === 'failed';
    
    if (hasDocument && (isPending || isFailed)) {
      // Show retry option for existing document
      const shouldRetry = window.confirm(
        `This assignment already has a document but AI extraction ${isPending ? 'is pending' : 'failed'}. Would you like to:\n\n` +
        `• Click "OK" to retry extraction on the existing document\n` +
        `• Click "Cancel" to upload a new document instead`
      );
      
      if (shouldRetry) {
        handleRetryAIExtraction(assignment);
        return;
      }
    }
    
    // Default behavior: upload new document
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setLoading(true);
          
          // Check if assignment already has extracted questions - if so, replace them
          const hasExistingQuestions = assignment.questions && assignment.questions.some(q => q._id.startsWith('extracted_'));
          let updatedAssignment;
          
          if (hasExistingQuestions) {
            // Replace existing document-extracted questions using synchronous method
            updatedAssignment = await assignmentService.extractAssignmentQuestionsSync(assignment._id, file);
            setSuccess('Assignment document replaced and questions updated successfully!');
          } else {
            // Extract new questions from document using synchronous method (like assessments)
            updatedAssignment = await assignmentService.extractAssignmentQuestionsSync(assignment._id, file);
            setSuccess('Assignment document uploaded and questions extracted successfully!');
          }
          
          // Update the assignment in the state
          setAssignments(prev => 
            prev.map(a => 
              a._id === assignment._id ? updatedAssignment : a
            )
          );
          
        } catch (error: any) {
          console.error('Failed to upload assignment document:', error);
          setError(error.message || 'Failed to upload assignment document');
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  // Handle retry AI extraction for existing document using synchronous method
  const handleRetryAIExtraction = async (assignment: AssignmentType) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('🔄 Retrying AI extraction for assignment using synchronous method:', assignment._id);
      
      // Check if assignment has a document to re-process
      if (!assignment.assignmentDocument?.fileUrl) {
        setError('No document found to retry extraction. Please upload a new document.');
        return;
      }

      // Show file picker to re-upload document (since we need file for synchronous processing)
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
      input.onchange = async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            console.log('📄 Re-processing assignment with new synchronous method...');
            
            // Use synchronous extraction method
            const updatedAssignment = await assignmentService.extractAssignmentQuestionsSync(assignment._id, file);
            setSuccess('Assignment document re-processed and questions extracted successfully using the new method!');
            
            // Update the assignment in the state
            setAssignments(prev => 
              prev.map(a => 
                a._id === assignment._id ? updatedAssignment : a
              )
            );
            
          } catch (error: any) {
            console.error('Failed to retry with synchronous method:', error);
            setError(`Retry failed: ${error.message}`);
          }
        }
      };
      
      // Prompt user about the new method
      const shouldProceed = window.confirm(
        'The retry will use the new improved synchronous extraction method. ' +
        'You will need to re-upload the document. This is faster and more reliable. ' +
        'Click OK to proceed with file selection.'
      );
      
      if (shouldProceed) {
        input.click();
      }
      
    } catch (error: any) {
      console.error('Failed to retry AI extraction:', error);
      setError(error.message || 'Failed to retry AI extraction');
    } finally {
      setLoading(false);
    }
  };

  // Handle refresh assignments
  const handleRefreshAssignments = async () => {
    try {
      const response = await assignmentService.getAssignmentsByCourse(courseId);
      if (response.success) {
        setAssignments(response.data.assignments || []);
      }
    } catch (error) {
      console.error('Failed to refresh assignments:', error);
    }
  };

  // Handle debug AI processing (manual trigger)
  const handleDebugAIProcessing = async (assignment: AssignmentType) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      console.log('🐞 Manual debug AI processing for assignment:', assignment._id);
      
      const response = await assignmentService.debugAIProcessing(assignment._id);
      
      if (response.success) {
        setSuccess('AI processing debug completed successfully! Check the results below.');
        
        // Refresh assignments to get updated status
        setTimeout(() => {
          handleRefreshAssignments();
        }, 1000);
      } else {
        throw new Error('Debug AI processing failed');
      }
      
    } catch (error: any) {
      console.error('Failed to debug AI processing:', error);
      setError(error.message || 'Failed to debug AI processing');
    } finally {
      setLoading(false);
    }
  };

  // Handle upload assessment document
  const handleUploadAssessmentDocument = (assessment: IAssessment) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setLoading(true);
        try {
          // Check if assessment already has extracted questions - if so, replace them
          const hasExistingQuestions = assessment.questions && assessment.questions.some(q => q.id.startsWith('extracted_'));
          let updatedAssessment;
          
          if (hasExistingQuestions) {
            // Replace existing document-extracted questions
            updatedAssessment = await assessmentService.replaceQuestionsFromDocument(assessment._id, file);
            setSuccess('Assessment document replaced and questions updated successfully!');
          } else {
            // Add new questions from document
            updatedAssessment = await assessmentService.addQuestionsFromDocument(assessment._id, file);
            setSuccess('Assessment document uploaded and questions extracted successfully!');
          }
          
          // Update the assessment in the state
          setAssessments(prev => 
            prev.map(a => 
              a._id === assessment._id ? updatedAssessment : a
            )
          );
          
        } catch (error: any) {
          console.error('Failed to upload assessment document:', error);
          setError(error.message || 'Failed to upload assessment document');
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  // Handle starting live session
  const handleStartSession = async (session: ILiveSession) => {
    try {
      await liveSessionService.startSession(session._id);
      // Refresh sessions
      const sessionsResponse = await liveSessionService.getTeacherSessions({ 
        courseId: courseId,
        limit: 50 
      });
      if (sessionsResponse && sessionsResponse.sessions) {
        setLiveSessions(sessionsResponse.sessions);
      }
    } catch (error: any) {
      console.error('Failed to start session:', error);
      setError(error.message || 'Failed to start session');
    }
  };

  // Handle ending live session
  const handleEndSession = async (session: ILiveSession) => {
    try {
      await liveSessionService.endSession(session._id);
      // Refresh sessions
      const sessionsResponse = await liveSessionService.getTeacherSessions({ 
        courseId: courseId,
        limit: 50 
      });
      if (sessionsResponse && sessionsResponse.sessions) {
        setLiveSessions(sessionsResponse.sessions);
      }
    } catch (error: any) {
      console.error('Failed to end session:', error);
      setError(error.message || 'Failed to end session');
    }
  };

  // Handle video upload
  const handleVideoUpload = async () => {
    if (!selectedVideo || !uploadingSession) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      await liveSessionService.uploadRecording(uploadingSession._id, selectedVideo);
      
      // Refresh sessions
      const sessionsResponse = await liveSessionService.getTeacherSessions({ 
        courseId: courseId,
        limit: 50 
      });
      if (sessionsResponse && sessionsResponse.sessions) {
        setLiveSessions(sessionsResponse.sessions);
      }

      setUploadDialogOpen(false);
      setSelectedVideo(null);
      setUploadingSession(null);
      setUploadProgress(0);
    } catch (error: any) {
      console.error('Failed to upload video:', error);
      setError(error.message || 'Failed to upload video');
    } finally {
      setUploading(false);
    }
  };

  // Handle video file selection
  const handleVideoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/webm'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please select MP4, AVI, MOV, or WebM files only.');
        return;
      }
      
      // Validate file size (max 500MB)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        setError('File size too large. Please select a file smaller than 500MB.');
        return;
      }

      setSelectedVideo(file);
    }
  };

  // Handle assessment publication toggle
  const handleToggleAssessmentPublication = async (assessmentId: string) => {
    try {
      const assessment = assessments.find(a => a._id === assessmentId);
      if (!assessment) return;

      await assessmentService.togglePublishAssessment(assessmentId);
      
      setAssessments(prev => 
        prev.map(a => 
          a._id === assessmentId 
            ? { ...a, isPublished: !a.isPublished, status: !a.isPublished ? 'published' : 'draft' }
            : a
        )
      );
      
      setSuccess(`Assessment ${!assessment.isPublished ? 'published' : 'unpublished'} successfully! ${!assessment.isPublished ? 'Students can now see it.' : 'Students can no longer see it.'}`);
    } catch (error: any) {
      console.error('Failed to toggle assessment publication:', error);
      setError(error.message || 'Failed to toggle assessment publication');
    }
  };

  // Handle assessment deletion
  const handleDeleteAssessment = async () => {
    if (!assessmentToDelete) return;

    try {
      await assessmentService.deleteAssessment(assessmentToDelete._id);
      setAssessments(prev => prev.filter(assessment => assessment._id !== assessmentToDelete._id));
      setAssessmentDeleteConfirmOpen(false);
      setAssessmentToDelete(null);
      setSuccess('Assessment deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete assessment:', error);
      setError(error.message || 'Failed to delete assessment');
    }
  };

  // Handle upload to existing assessment
  const handleUploadToAssessment = (assessment: IAssessment) => {
    setSelectedAssessmentForUpload(assessment);
    setUploadAssessmentDialogOpen(true);
  };

  const handleAssessmentFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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

      setUploadAssessmentFile(file);
      setError(null);
    }
  };

  const removeAssessmentUploadFile = () => {
    setUploadAssessmentFile(null);
  };

  const handleAddQuestionsToAssessment = async () => {
    if (!selectedAssessmentForUpload || !uploadAssessmentFile) return;

    try {
      setExtractingQuestions(true);
      setError(null);

      const updatedAssessment = await assessmentService.addQuestionsFromDocument(
        selectedAssessmentForUpload._id,
        uploadAssessmentFile
      );

      // Update the assessment in the list
      setAssessments(prev => 
        prev.map(assessment => 
          assessment._id === selectedAssessmentForUpload._id ? updatedAssessment : assessment
        )
      );

      // Close dialog and reset
      setUploadAssessmentDialogOpen(false);
      setSelectedAssessmentForUpload(null);
      setUploadAssessmentFile(null);
      setSuccess('Document uploaded and questions extracted successfully!');
      
    } catch (err: any) {
      setError(err.message || 'Failed to add questions to assessment');
    } finally {
      setExtractingQuestions(false);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': case 'live': case 'completed': return 'success';
      case 'scheduled': return 'info';
      case 'draft': return 'warning';
      case 'cancelled': case 'archived': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error || !course) {
    return (
      <Box sx={{ minHeight: '100vh', p: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Course not found'}
          </Alert>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard/teacher')}
            variant="contained"
            sx={{ bgcolor: 'white', color: 'primary.main' }}
          >
            Back to Dashboard
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      {/* Header */}
      <AppBar position="static" elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
        <Toolbar>
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={() => navigate('/dashboard/teacher')}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              Course Management
            </Typography>
            <Breadcrumbs sx={{ color: 'rgba(255,255,255,0.7)' }}>
              <Link color="inherit" onClick={() => navigate('/dashboard/teacher')} sx={{ cursor: 'pointer' }}>
                Dashboard
              </Link>
              <Typography color="inherit">{course.title}</Typography>
            </Breadcrumbs>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              icon={<PeopleIcon />}
              label={`${course.enrolledStudents} Students`}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
            />
            <Chip
              label={course.status}
              color={getStatusColor(course.status) as any}
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Error Alerts */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Success Alerts */}
        {success && (
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {/* Course Overview Card */}
        <Card sx={{ 
          mb: 4, 
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    src={course.thumbnail}
                    sx={{ width: 80, height: 80 }}
                  >
                    <School />
                  </Avatar>
                  <Box>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {course.title}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {course.description}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Progress</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {Math.round((course.enrolledStudents / course.totalStudents) * 100)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={(course.enrolledStudents / course.totalStudents) * 100}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card sx={{ 
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
              <Tab 
                icon={<MenuBook />} 
                label="Course Notes" 
                sx={{ fontWeight: 'bold' }}
              />
              <Tab 
                icon={<VideoCall />} 
                label="Live Sessions" 
                sx={{ fontWeight: 'bold' }}
              />
              <Tab 
                icon={<Quiz />} 
                label="Assessments & Assignments" 
                sx={{ fontWeight: 'bold' }}
              />
              <Tab 
                icon={<AnalyticsIcon />} 
                label="Analytics" 
                sx={{ fontWeight: 'bold' }}
              />
              <Tab 
                icon={<SettingsIcon />} 
                label="Settings" 
                sx={{ fontWeight: 'bold' }}
              />
            </Tabs>
          </Box>

          {/* Course Notes Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <MenuBook color="primary" />
                Course Notes Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNoteDialogOpen(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)'
                }}
              >
                Create New Notes
              </Button>
            </Box>

            {courseNotes && courseNotes.length > 0 ? (
              <Grid container spacing={3}>
                {courseNotes.map((note) => (
                <Grid item xs={12} md={6} lg={4} key={note._id}>
                  <Card sx={{ 
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                          {note.title}
                        </Typography>
                        <Chip
                          label={note.isPublished ? 'Published' : 'Draft'}
                          color={note.isPublished ? 'success' : 'warning'}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {note.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Chip
                          icon={<Star />}
                          label={`Chapter ${note.chapter}`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<AccessTime />}
                          label={`${note.totalEstimatedTime} min`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {note.sections?.length || 0} sections • Updated {format(new Date(note.updatedAt), 'MMM dd, yyyy')}
                      </Typography>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setEditingNote(note);
                            setNoteForm({
                              title: note.title,
                              description: note.description,
                              chapter: note.chapter,
                              sections: note.sections?.map((s, index) => ({
                                id: s.id || crypto.randomUUID(),
                                title: s.title,
                                content: s.content,
                                order: s.order !== undefined ? s.order : index + 1,
                                estimatedReadTime: s.estimatedReadTime
                              })) || [{ 
                                id: crypto.randomUUID(), 
                                title: '', 
                                content: '', 
                                order: 1, 
                                estimatedReadTime: 5 
                              }]
                            });
                            setNoteDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={note.isPublished ? <UnpublishedOutlined /> : <Publish />}
                          onClick={() => toggleNotePublication(note._id)}
                          color={note.isPublished ? 'warning' : 'success'}
                        >
                          {note.isPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Tooltip title="Preview how students will see these notes">
                          <Button
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => navigate(`/teacher/notes-preview/${note._id}`)}
                            variant="outlined"
                          >
                            Preview
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title="Duplicate this note as a template">
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => {
                              setEditingNote(null);
                              setNoteForm({
                                title: `${note.title} (Copy)`,
                                description: note.description,
                                chapter: note.chapter + 1,
                                sections: note.sections?.map((s, index) => ({
                                  id: crypto.randomUUID(),
                                  title: s.title,
                                  content: s.content,
                                  order: s.order !== undefined ? s.order : index + 1,
                                  estimatedReadTime: s.estimatedReadTime
                                })) || [{ 
                                  id: crypto.randomUUID(), 
                                  title: '', 
                                  content: '', 
                                  order: 1, 
                                  estimatedReadTime: 5 
                                }]
                              });
                              setNoteDialogOpen(true);
                            }}
                            variant="text"
                            color="secondary"
                          >
                            Duplicate
                          </Button>
                        </Tooltip>
                        
                        <Tooltip title="Delete this note permanently">
                          <Button
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => {
                              setNoteToDelete(note);
                              setDeleteConfirmOpen(true);
                            }}
                            variant="text"
                            color="error"
                          >
                            Delete
                          </Button>
                        </Tooltip>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                ))}
              </Grid>
            ) : (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                <MenuBook sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Course Notes Yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first course notes to help students learn effectively
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setNoteDialogOpen(true)}
                  sx={{ 
                    background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                    boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)'
                  }}
                >
                  Create First Notes
                </Button>
              </Paper>
            )}
          </TabPanel>

          {/* Live Sessions Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                <VideoCall color="primary" />
                Live Sessions Management
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setSessionDialogOpen(true)}
                sx={{ 
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)'
                }}
              >
                Schedule Session
              </Button>
            </Box>

            <Grid container spacing={3}>
              {liveSessions && liveSessions.map((session) => (
                <Grid item xs={12} md={6} lg={4} key={session._id}>
                  <Card sx={{ 
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                    }
                  }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1 }}>
                          {session.title}
                        </Typography>
                        <Chip
                          label={session.status}
                          color={getStatusColor(session.status) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {session.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Chip
                          icon={<ScheduleIcon />}
                          label={format(new Date(session.scheduledTime), 'MMM dd, HH:mm')}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<AccessTime />}
                          label={`${session.duration} min`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {session.participants.length}/{session.maxParticipants || 50} participants
                      </Typography>

                      <LinearProgress 
                        variant="determinate" 
                        value={(session.participants.length / (session.maxParticipants || 50)) * 100}
                        sx={{ mb: 2, height: 6, borderRadius: 3 }}
                      />

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setEditingSession(session);
                            setSessionForm({
                              title: session.title,
                              description: session.description || '',
                              scheduledTime: session.scheduledTime,
                              duration: session.duration,
                              maxAttendees: session.maxParticipants || 50
                            });
                            setSessionDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        {session.status === 'scheduled' && (
                          <Button
                            size="small"
                            startIcon={<PlayCircle />}
                            color="success"
                          >
                            Start
                          </Button>
                        )}
                        {session.recordingUrl && (
                          <Button
                            size="small"
                            startIcon={<ViewIcon />}
                          >
                            Recording
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </TabPanel>

          {/* Assessments & Assignments Tab */}
          <TabPanel value={tabValue} index={2}>
            {/* Header with Statistics */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <Quiz color="primary" />
                Assessments & Assignments Management
              </Typography>
              
              {/* Statistics Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    height: '100%'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Quiz sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {assessments.length}
                      </Typography>
                      <Typography variant="body2">
                        Total Assessments
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    height: '100%'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Assignment sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {assignments.length}
                      </Typography>
                      <Typography variant="body2">
                        Total Assignments
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    color: 'white',
                    height: '100%'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Publish sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {assessments.filter(a => a.isPublished).length}
                      </Typography>
                      <Typography variant="body2">
                        Published Assessments
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ 
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    height: '100%'
                  }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <TrendingUp sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {Math.round(assessments.reduce((acc, a) => acc + (a.averageScore || 0), 0) / (assessments.length || 1))}%
                      </Typography>
                      <Typography variant="body2">
                        Average Score
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            {/* Toggle and Create Button */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>View Type</InputLabel>
                  <Select
                    value={assessmentType}
                    label="View Type"
                    onChange={(e) => setAssessmentType(e.target.value as 'assessment' | 'assignment')}
                  >
                    <MenuItem value="assessment">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Quiz fontSize="small" />
                        Assessments
                      </Box>
                    </MenuItem>
                    <MenuItem value="assignment">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assignment fontSize="small" />
                        Assignments
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="body2" color="text.secondary">
                  Showing {assessmentType === 'assessment' ? assessments.length : assignments.length} {assessmentType}s
                </Typography>
              </Box>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  if (assessmentType === 'assessment') {
                    setAssessmentDialogOpen(true);
                  } else {
                    setAssignmentDialogOpen(true);
                  }
                }}
                sx={{ 
                  background: assessmentType === 'assessment' 
                    ? 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)'
                    : 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
                  boxShadow: assessmentType === 'assessment'
                    ? '0 3px 5px 2px rgba(255, 107, 107, .3)'
                    : '0 3px 5px 2px rgba(76, 175, 80, .3)',
                  px: 3,
                  py: 1.5
                }}
              >
                Create New {assessmentType === 'assessment' ? 'Assessment' : 'Assignment'}
              </Button>
            </Box>

            {/* Content Grid */}
            <Grid container spacing={3}>
              {assessmentType === 'assessment' ? (
                assessments && assessments.length > 0 ? assessments.map((assessment) => (
                <Grid item xs={12} md={6} lg={4} key={assessment._id}>
                  <Card sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      borderColor: 'primary.main'
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1, color: 'primary.main' }}>
                          {assessment.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Chip
                            label={assessment.isPublished ? 'Published' : 'Draft'}
                            color={assessment.isPublished ? 'success' : 'warning'}
                            size="small"
                            icon={assessment.isPublished ? <Publish /> : <UnpublishedOutlined />}
                          />
                          {(assessment.attachments && assessment.attachments.length > 0) || assessment.documentUrl ? (
                            <Chip
                              label="Has Document"
                              color="info"
                              size="small"
                              icon={<CheckCircleIcon />}
                            />
                          ) : null}
                          {assessment.questions && assessment.questions.length > 0 ? (
                            <Chip
                              label={`${assessment.questions.length} Questions`}
                              color="success"
                              size="small"
                              variant="outlined"
                            />
                          ) : null}
                        </Box>
                      </Box>
                      
                      {/* Description */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                        {assessment.description || 'No description provided'}
                      </Typography>

                      {/* Metadata */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<Quiz />}
                          label={assessment.type.toUpperCase()}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                        <Chip
                          icon={<AccessTime />}
                          label={assessment.timeLimit ? `${assessment.timeLimit}min` : 'No limit'}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<Star />}
                          label={`${assessment.totalPoints || 0} pts`}
                          size="small"
                          variant="outlined"
                          color="warning"
                        />
                      </Box>

                      {/* Stats */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                            {assessment.questions?.length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Questions
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                            {assessment.attempts || 1}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Attempts
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="warning.main" sx={{ fontWeight: 'bold' }}>
                            {assessment.passingScore || 70}%
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pass Score
                          </Typography>
                        </Box>
                      </Box>

                      {/* Due Date */}
                      {assessment.dueDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1, bgcolor: 'info.50', borderRadius: 1 }}>
                          <ScheduleIcon color="info" fontSize="small" />
                          <Typography variant="body2" color="info.main">
                            Due: {format(new Date(assessment.dueDate), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                        </Box>
                      )}

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setEditingAssessment(assessment);
                            setAssessmentForm({
                              title: assessment.title,
                              description: assessment.description || '',
                              type: assessment.type,
                              dueDate: assessment.dueDate || '',
                              timeLimit: assessment.timeLimit || 60,
                              attempts: assessment.attempts,
                              instructions: assessment.instructions || '',
                              passingScore: assessment.passingScore || 70,
                              isPublished: assessment.isPublished
                            });
                            setAssessmentDialogOpen(true);
                          }}
                          variant="outlined"
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => navigate(`/dashboard/teacher/assessments/${assessment._id}`)}
                          variant="outlined"
                          color="info"
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          startIcon={<CloudUploadIcon />}
                          onClick={() => handleUploadToAssessment(assessment)}
                          variant="outlined"
                          color={(assessment.attachments && assessment.attachments.length > 0) || assessment.documentUrl ? "success" : "primary"}
                        >
                          {(assessment.attachments && assessment.attachments.length > 0) || assessment.documentUrl ? 'Update' : 'Upload'}
                        </Button>
                        <Button
                          size="small"
                          startIcon={assessment.isPublished ? <UnpublishedOutlined /> : <Publish />}
                          color={assessment.isPublished ? "warning" : "success"}
                          onClick={() => handleToggleAssessmentPublication(assessment._id)}
                          variant="contained"
                        >
                          {assessment.isPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          color="error"
                          onClick={() => {
                            setAssessmentToDelete(assessment);
                            setAssessmentDeleteConfirmOpen(true);
                          }}
                          variant="outlined"
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )) : (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Quiz sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Assessments Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Create your first assessment to start evaluating your students' progress.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setAssessmentDialogOpen(true)}
                      sx={{ 
                        background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
                        boxShadow: '0 3px 5px 2px rgba(255, 107, 107, .3)'
                      }}
                    >
                      Create First Assessment
                    </Button>
                  </Paper>
                </Grid>
              )
              ) : (
                // Assignments section
                assignments && assignments.length > 0 ? assignments.map((assignment) => (
                <Grid item xs={12} md={6} lg={4} key={assignment._id}>
                  <Card sx={{ 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    border: '1px solid rgba(0,0,0,0.08)',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                      borderColor: 'success.main'
                    }
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', flex: 1, color: 'success.main' }}>
                          {assignment.title}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column', alignItems: 'flex-end' }}>
                          <Chip
                            label={assignment.status || 'Active'}
                            color={getStatusColor(assignment.status || 'published') as any}
                            size="small"
                          />
                          {assignment.assignmentDocument && (
                            <Chip
                              label="Has Document"
                              color="info"
                              size="small"
                              icon={<CheckCircleIcon />}
                            />
                          )}
                          {assignment.questions && assignment.questions.length > 0 && (
                            <Chip
                              label={`${assignment.questions.length} Questions`}
                              color="success"
                              size="small"
                              icon={<AutoAwesome />}
                            />
                          )}
                        </Box>
                      </Box>
                      
                      {/* Description */}
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: 40 }}>
                        {assignment.description || 'No description provided'}
                      </Typography>

                      {/* Metadata */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<Assignment />}
                          label={assignment.submissionType.toUpperCase()}
                          size="small"
                          variant="outlined"
                          color="success"
                        />
                        <Chip
                          icon={<Star />}
                          label={`${assignment.maxPoints} pts`}
                          size="small"
                          variant="outlined"
                          color="warning"
                        />
                        {assignment.isRequired && (
                          <Chip
                            label="Required"
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                        {/* AI Processing Status */}
                        {assignment.aiProcessingStatus === 'pending' && (
                          <Chip
                            label="AI Processing..."
                            size="small"
                            color="info"
                            variant="outlined"
                            icon={<Schedule />}
                          />
                        )}
                        {assignment.aiProcessingStatus === 'failed' && (
                          <Chip
                            label="AI Failed"
                            size="small"
                            color="error"
                            variant="outlined"
                            icon={<Error />}
                          />
                        )}
                        {assignment.aiProcessingStatus === 'completed' && assignment.questions && assignment.questions.length > 0 && (
                          <Chip
                            label="AI Ready"
                            size="small"
                            color="success"
                            variant="outlined"
                            icon={<CheckCircle />}
                          />
                        )}
                      </Box>

                      {/* File Info */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                            {assignment.allowedFileTypes?.length || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            File Types
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="info.main" sx={{ fontWeight: 'bold' }}>
                            {assignment.maxFileSize || 10}MB
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Max Size
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                            0
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Submissions
                          </Typography>
                        </Box>
                      </Box>

                      {/* Due Date */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1, bgcolor: 'warning.50', borderRadius: 1 }}>
                        <ScheduleIcon color="warning" fontSize="small" />
                        <Typography variant="body2" color="warning.main">
                          Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </Box>

                      {/* Action Buttons */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setEditingAssignment(assignment);
                            setAssignmentForm({
                              title: assignment.title,
                              description: assignment.description,
                              instructions: assignment.instructions,
                              dueDate: assignment.dueDate.toString(),
                              maxPoints: assignment.maxPoints,
                              submissionType: assignment.submissionType,
                              allowedFileTypes: assignment.allowedFileTypes,
                              maxFileSize: assignment.maxFileSize,
                              isRequired: assignment.isRequired
                            });
                            setAssignmentDialogOpen(true);
                          }}
                          variant="outlined"
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => navigate(`/dashboard/teacher/assignments/${assignment._id}`)}
                          variant="outlined"
                          color="info"
                        >
                          View
                        </Button>
                        <Button
                          size="small"
                          startIcon={<CloudUploadIcon />}
                          onClick={() => handleUploadAssignmentDocument(assignment)}
                          variant="outlined"
                          color={assignment.questions && assignment.questions.length > 0 ? "success" : "primary"}
                          title={assignment.questions && assignment.questions.length > 0 ? 'Update AI questions from document (synchronous method)' : 'Extract AI questions from document (synchronous method - like assessments)'}
                        >
                          {assignment.questions && assignment.questions.length > 0 ? '🔄 Update AI (Sync)' : '🤖 Extract AI (Sync)'}
                        </Button>
                        {/* Debug button for stuck assignments */}
                        {(assignment.aiProcessingStatus === 'pending' || assignment.aiProcessingStatus === 'failed' || 
                          assignment.aiExtractionStatus === 'pending' || assignment.aiExtractionStatus === 'failed') && (
                          <Button
                            size="small"
                            startIcon={<Psychology />}
                            onClick={() => handleDebugAIProcessing(assignment)}
                            variant="outlined"
                            color="warning"
                            sx={{ minWidth: 'auto', px: 1 }}
                          >
                            Debug AI
                          </Button>
                        )}
                        <Button
                          size="small"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadSubmissions(assignment._id)}
                          variant="contained"
                          color="success"
                        >
                          Submissions
                        </Button>
                        {assignment.questions && assignment.questions.length > 0 && (
                          <Button
                            size="small"
                            startIcon={<Psychology />}
                            onClick={() => navigate(`/dashboard/teacher/assignments/${assignment._id}/grading`)}
                            variant="contained"
                            color="warning"
                          >
                            Grade AI
                          </Button>
                        )}
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => {
                            setAssignmentToDelete(assignment);
                            setAssignmentDeleteConfirmOpen(true);
                          }}
                          variant="outlined"
                          color="error"
                        >
                          Delete
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )) : (
                <Grid item xs={12}>
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
                    <Assignment sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No Assignments Yet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Create your first assignment to give students practical work to complete.
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setAssignmentDialogOpen(true)}
                      sx={{ 
                        background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
                        boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)'
                      }}
                    >
                      Create First Assignment
                    </Button>
                  </Paper>
                </Grid>
              )
              )}
            </Grid>
          </TabPanel>

          {/* Analytics Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsIcon color="primary" />
              Course Analytics
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <EmojiEvents sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {courseNotes.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Notes
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <VideoCall sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {liveSessions.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Live Sessions
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Quiz sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {assessments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assessments
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <Assignment sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                    {assignments.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Assignments
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <PeopleIcon sx={{ fontSize: 48, color: 'info.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                    {course.enrolledStudents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enrolled Students
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={3}>
                <Card sx={{ textAlign: 'center', p: 2 }}>
                  <TrendingUp sx={{ fontSize: 48, color: 'warning.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    85%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Completion Rate
                  </Typography>
                </Card>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel value={tabValue} index={4}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon color="primary" />
              Course Settings
            </Typography>
            
            <Alert severity="info">
              Course settings functionality will be implemented here.
            </Alert>
          </TabPanel>
        </Card>
      </Container>

      {/* Course Notes Dialog */}
      <Dialog 
        open={noteDialogOpen} 
        onClose={() => setNoteDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MenuBook />
          {editingNote ? 'Edit Course Notes' : 'Create New Course Notes'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {!editingNote && (
              <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                <Typography variant="body2">
                  <strong>Tips for creating effective course notes:</strong>
                  <br />• Use clear, descriptive titles for each section
                  <br />• Break content into digestible chunks
                  <br />• Include key points and examples
                  <br />• Use HTML formatting for better readability
                </Typography>
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Title"
              value={noteForm.title}
              onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={noteForm.description}
              onChange={(e) => setNoteForm(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              fullWidth
              label="Chapter Number"
              type="number"
              value={noteForm.chapter}
              onChange={(e) => setNoteForm(prev => ({ ...prev, chapter: parseInt(e.target.value) }))}
              sx={{ mb: 3 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />

            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lightbulb />
              Sections
            </Typography>

            {noteForm.sections && noteForm.sections.map((section, index) => (
              <Card key={index} sx={{ mb: 2, bgcolor: 'rgba(255,255,255,0.1)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ color: 'white' }}>
                      Section {index + 1}
                    </Typography>
                    {noteForm.sections.length > 1 && (
                      <IconButton 
                        onClick={() => removeSection(index)}
                        sx={{ color: 'white' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                  
                  <TextField
                    fullWidth
                    label="Section Title"
                    value={section.title}
                    onChange={(e) => updateSection(index, 'title', e.target.value)}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ style: { color: 'white' } }}
                    InputProps={{ style: { color: 'white' } }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Content"
                    multiline
                    rows={6}
                    value={section.content}
                    onChange={(e) => updateSection(index, 'content', e.target.value)}
                    sx={{ mb: 2 }}
                    InputLabelProps={{ style: { color: 'white' } }}
                    InputProps={{ style: { color: 'white' } }}
                    helperText="You can use basic HTML tags like <p>, <h1>, <h2>, <ul>, <li>, <strong>, <em>, <blockquote>"
                    FormHelperTextProps={{ style: { color: 'rgba(255,255,255,0.7)' } }}
                  />
                  
                  {section.content && (
                    <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.9)', color: 'text.primary' }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Content Preview:
                      </Typography>
                      <Box
                        sx={{
                          '& p': { mb: 1 },
                          '& h1, & h2, & h3, & h4, & h5, & h6': { mt: 2, mb: 1, fontWeight: 'bold' },
                          '& ul, & ol': { pl: 2, mb: 1 },
                          '& li': { mb: 0.5 },
                          '& blockquote': {
                            borderLeft: '4px solid',
                            borderColor: 'primary.main',
                            pl: 2,
                            ml: 0,
                            fontStyle: 'italic',
                            bgcolor: 'grey.100',
                            p: 1,
                            borderRadius: 1
                          }
                        }}
                        dangerouslySetInnerHTML={{ __html: section.content }}
                      />
                    </Paper>
                  )}
                  
                  <TextField
                    fullWidth
                    label="Estimated Read Time (minutes)"
                    type="number"
                    value={section.estimatedReadTime}
                    onChange={(e) => updateSection(index, 'estimatedReadTime', parseInt(e.target.value))}
                    InputLabelProps={{ style: { color: 'white' } }}
                    InputProps={{ style: { color: 'white' } }}
                  />
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addSection}
              sx={{ color: 'white', borderColor: 'white', mb: 2 }}
            >
              Add Section
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveNote}
            variant="contained"
            sx={{ bgcolor: 'white', color: 'primary.main' }}
          >
            {editingNote ? 'Update' : 'Create'} Notes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Live Session Dialog */}
      <Dialog 
        open={sessionDialogOpen} 
        onClose={() => setSessionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #2196F3 0%, #21CBF3 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <VideoCall />
          {editingSession ? 'Edit Live Session' : 'Schedule New Session'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Session Title"
              value={sessionForm.title}
              onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={sessionForm.description}
              onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              fullWidth
              label="Scheduled Time"
              type="datetime-local"
              value={sessionForm.scheduledTime}
              onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' }, shrink: true }}
              InputProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={sessionForm.duration}
              onChange={(e) => setSessionForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              fullWidth
              label="Max Attendees"
              type="number"
              value={sessionForm.maxAttendees}
              onChange={(e) => setSessionForm(prev => ({ ...prev, maxAttendees: parseInt(e.target.value) }))}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSession}
            variant="contained"
            sx={{ bgcolor: 'white', color: 'primary.main' }}
          >
            {editingSession ? 'Update' : 'Schedule'} Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog 
        open={assessmentDialogOpen} 
        onClose={() => setAssessmentDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Quiz />
          {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={assessmentForm.title}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={assessmentForm.description}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: 'white' }}>Type</InputLabel>
              <Select
                value={assessmentForm.type}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, type: e.target.value as any }))}
                sx={{ color: 'white' }}
              >
                <MenuItem value="quiz">Quiz</MenuItem>
                <MenuItem value="exam">Exam</MenuItem>
                <MenuItem value="assignment">Assignment</MenuItem>
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="homework">Homework</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Due Date"
              type="datetime-local"
              value={assessmentForm.dueDate}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' }, shrink: true }}
              InputProps={{ style: { color: 'white' } }}
            />

            <TextField
              fullWidth
              label="Time Limit (minutes)"
              type="number"
              value={assessmentForm.timeLimit}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />

            <TextField
              fullWidth
              label="Instructions"
              multiline
              rows={3}
              value={assessmentForm.instructions}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, instructions: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={assessmentForm.isPublished}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, isPublished: e.target.checked }))}
                />
              }
              label="Publish immediately"
              sx={{ color: 'white' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssessmentDialogOpen(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAssessment}
            variant="contained"
            sx={{ bgcolor: 'white', color: 'primary.main' }}
          >
            {editingAssessment ? 'Update' : 'Create'} Assessment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Dialog */}
      <Dialog 
        open={assignmentDialogOpen} 
        onClose={() => setAssignmentDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assignment />
          {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />

            <TextField
              fullWidth
              label="Instructions"
              multiline
              rows={4}
              value={assignmentForm.instructions}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, instructions: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />
            
            <TextField
              fullWidth
              label="Due Date"
              type="datetime-local"
              value={assignmentForm.dueDate}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' }, shrink: true }}
              InputProps={{ style: { color: 'white' } }}
            />

            <TextField
              fullWidth
              label="Max Points"
              type="number"
              value={assignmentForm.maxPoints}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, maxPoints: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: 'white' }}>Submission Type</InputLabel>
              <Select
                value={assignmentForm.submissionType}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, submissionType: e.target.value as any }))}
                sx={{ color: 'white' }}
              >
                <MenuItem value="file">File Upload Only</MenuItem>
                <MenuItem value="text">Text Submission Only</MenuItem>
                <MenuItem value="both">Both File and Text</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Max File Size (MB)"
              type="number"
              value={assignmentForm.maxFileSize}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
              sx={{ mb: 2 }}
              InputLabelProps={{ style: { color: 'white' } }}
              InputProps={{ style: { color: 'white' } }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={assignmentForm.isRequired}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, isRequired: e.target.checked }))}
                />
              }
              label="Required for course completion"
              sx={{ color: 'white' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAssignment}
            variant="contained"
            sx={{ bgcolor: 'white', color: 'primary.main' }}
          >
            {editingAssignment ? 'Update' : 'Create'} Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upload Assessment Questions Dialog */}
      <Dialog 
        open={uploadAssessmentDialogOpen} 
        onClose={() => setUploadAssessmentDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
          <UploadIcon />
          Add Questions to Assessment
        </DialogTitle>
        <DialogContent>
          {selectedAssessmentForUpload && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2, color: 'rgba(255,255,255,0.8)' }}>
                Upload a document to add more questions to <strong>"{selectedAssessmentForUpload.title}"</strong>
              </Typography>
              
              <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Current: {selectedAssessmentForUpload.questions?.length || 0} questions • {selectedAssessmentForUpload.totalPoints || 0} points
                </Typography>
              </Box>

              {/* File Upload Section */}
              <Paper sx={{ p: 3, border: '2px dashed rgba(255,255,255,0.3)', borderRadius: 2, mb: 2, bgcolor: 'rgba(255,255,255,0.05)' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'white' }}>
                  <DocumentIcon />
                  Upload Document
                </Typography>
                
                {!uploadAssessmentFile ? (
                  <Box sx={{ textAlign: 'center' }}>
                    <input
                      accept=".pdf,.doc,.docx,.txt"
                      style={{ display: 'none' }}
                      id="enhanced-assessment-document-upload"
                      type="file"
                      onChange={handleAssessmentFileUpload}
                    />
                    <label htmlFor="enhanced-assessment-document-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<UploadIcon />}
                        sx={{ mb: 1, color: 'white', borderColor: 'white' }}
                      >
                        Choose File
                      </Button>
                    </label>
                    <Typography variant="caption" display="block" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Supported formats: PDF, Word (.doc, .docx), Text (.txt) • Max size: 10MB
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DocumentIcon sx={{ color: 'white' }} />
                      <Box>
                        <Typography variant="body2" fontWeight="medium" sx={{ color: 'white' }}>
                          {uploadAssessmentFile.name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {(uploadAssessmentFile.size / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      </Box>
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      onClick={removeAssessmentUploadFile}
                      startIcon={<DeleteIcon />}
                      sx={{ color: 'white' }}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Paper>
              
              {extractingQuestions && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
                  <CircularProgress size={16} sx={{ color: 'white' }} />
                  <Typography variant="body2" sx={{ color: 'white' }}>
                    AI is extracting questions from your document...
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadAssessmentDialogOpen(false)} disabled={extractingQuestions} sx={{ color: 'white' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddQuestionsToAssessment} 
            variant="contained"
            disabled={!uploadAssessmentFile || extractingQuestions}
            startIcon={extractingQuestions ? <CircularProgress size={16} /> : <AutoAwesome />}
            sx={{ 
              bgcolor: 'white', 
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              }
            }}
          >
            {extractingQuestions ? 'Adding Questions...' : 'Add Questions'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assignment Delete Confirmation Dialog */}
      <Dialog
        open={assignmentDeleteConfirmOpen}
        onClose={() => setAssignmentDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon />
          Delete Assignment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the assignment "{assignmentToDelete?.title}"?
          </Typography>
          <Alert severity="warning" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone. All student submissions and data associated with this assignment will be permanently deleted.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAssignmentDeleteConfirmOpen(false)} 
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAssignment}
            variant="contained"
            startIcon={<DeleteIcon />}
            sx={{ 
              bgcolor: 'white', 
              color: 'error.main',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              }
            }}
          >
            Delete Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assessment Delete Confirmation Dialog */}
      <Dialog
        open={assessmentDeleteConfirmOpen}
        onClose={() => setAssessmentDeleteConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white'
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteIcon />
          Delete Assessment
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the assessment "{assessmentToDelete?.title}"?
          </Typography>
          <Alert severity="warning" sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
            <Typography variant="body2">
              <strong>Warning:</strong> This action cannot be undone. All student submissions and data associated with this assessment will be permanently deleted.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAssessmentDeleteConfirmOpen(false)} 
            sx={{ color: 'white' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteAssessment}
            variant="contained"
            startIcon={<DeleteIcon />}
            sx={{ 
              bgcolor: 'white', 
              color: 'error.main',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              }
            }}
          >
            Delete Assessment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EnhancedCourseManagement;
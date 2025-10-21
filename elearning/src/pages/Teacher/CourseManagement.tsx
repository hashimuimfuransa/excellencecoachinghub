import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  Badge,
  Paper,
  Tooltip,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Download,
  VideoCall,
  Assignment,
  Quiz,
  PlayArrow,
  Description,
  PictureAsPdf,
  VideoFile,
  AudioFile,
  InsertDriveFile,
  Close,
  MenuBook,
  Announcement,
  Schedule,
  AccessTime,
  Person,
  CalendarToday,
  Upload,
  CloudUpload,
  Publish,
  Unpublished
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import { liveSessionService } from '../../services/liveSessionService';
import { assignmentService } from '../../services/assignmentService';
import { assessmentService } from '../../services/assessmentService';
import api from '../../services/api';
import { Week, WeekMaterial } from '../../services/weekService';
import { SafeDialogTransition } from '../../utils/transitionFix';
import DocumentProcessor from '../../components/CourseMaterials/DocumentProcessor';
import MediaUploader from '../../components/CourseMaterials/MediaUploader';
import ExamUploader from '../../components/CourseMaterials/ExamUploader';
import CourseMaterials from '../../components/CourseMaterials/CourseMaterials';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const CourseManagement: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Course data state
  const [courseData, setCourseData] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  
  // Week management state
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Material dialog state
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<any>(null);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    type: 'document',
    order: 1,
    url: '',
    file: null as File | null
  });

  // Live session dialog state
  const [sessionDialogOpen, setSessionDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [teacherCourses, setTeacherCourses] = useState<any[]>([]);
  const [sessionForm, setSessionForm] = useState({
    title: '',
    description: '',
    scheduledTime: '',
    duration: 60,
    maxParticipants: 50,
    agenda: '',
    recordingEnabled: true,
    chatEnabled: true,
    courseId: courseId || '',
    zoomFallbackLink: '',
  });

  // Announcement dialog state
  const [announcementDialogOpen, setAnnouncementDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'medium',
    isPublished: true,
    scheduledDate: '',
    attachments: [] as File[]
  });

  // Assignment dialog state
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: 100,
    type: 'essay',
    instructions: '',
    attachments: [],
    rubric: '',
    allowLateSubmission: false,
    latePenalty: 0
  });

  // Assessment dialog state
  const [assessmentDialogOpen, setAssessmentDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [assessmentForm, setAssessmentForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    points: 100,
    type: 'quiz',
    timeLimit: 60,
    questions: [],
    passingScore: 70,
    attempts: 3,
    randomizeQuestions: false,
    showResultsImmediately: true,
    requireProctoring: false,
    instructions: ''
  });

  // YouTube video dialog state
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    url: '',
    duration: '',
    thumbnail: '',
    order: 0,
    isPublished: false
  });

  // File upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingItem, setUploadingItem] = useState<any>(null);
  const [uploadType, setUploadType] = useState<'assignment' | 'assessment'>('assignment');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Material deletion state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Week dialog state
  const [weekDialogOpen, setWeekDialogOpen] = useState(false);
  const [editingWeek, setEditingWeek] = useState<Week | null>(null);
  const [weekForm, setWeekForm] = useState({
    title: '',
    description: '',
    weekNumber: 1,
    startDate: '',
    endDate: '',
    isPublished: false
  });
  
  // Week material dialog state
  const [weekMaterialDialogOpen, setWeekMaterialDialogOpen] = useState(false);
  const [editingWeekMaterial, setEditingWeekMaterial] = useState<WeekMaterial | null>(null);
  const [weekMaterialForm, setWeekMaterialForm] = useState({
    title: '',
    description: '',
    type: 'document' as 'document' | 'video' | 'audio' | 'link' | 'quiz',
    url: '',
    order: 1,
    estimatedDuration: 30,
    isRequired: true,
    isPublished: true
  });

  // Load course data
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in to access course management');
      return;
    }

    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dynamically import weekService to avoid potential circular import issues
      const { weekService } = await import('../../services/weekService');

      // Load main course data
      const course = await courseService.getCourseById(courseId!);
      setCourseData(course);

      // Load teacher's courses for session creation
      const coursesResponse = await courseService.getTeacherCourses({
        instructor: user?._id
      });
      setTeacherCourses(coursesResponse.courses || []);

      // Extract materials and YouTube videos from course content
      const courseMaterials = course.content || [];
      setMaterials(courseMaterials);

      // Load live sessions
      const sessions = await liveSessionService.getCourseSessions(courseId!);
      setLiveSessions(sessions || []);

      // Load assignments
      const assignmentsData = await assignmentService.getCourseAssignments(courseId!);
      setAssignments(assignmentsData || []);

      // Load assessments
      const assessmentsData = await assessmentService.getCourseAssessments(courseId!);
      console.log('📊 Loaded assessments:', assessmentsData);
      console.log('📊 Assessment details:', assessmentsData.map(a => ({
        id: a._id,
        title: a.title,
        isPublished: a.isPublished,
        documentUrl: a.documentUrl,
        attachments: a.attachments
      })));
      setAssessments(assessmentsData || []);
      
      // Load announcements
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const announcementsResponse = await api.get(`/announcements/course/${courseId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setAnnouncements(announcementsResponse.data.data || []);
        } else {
          console.warn('No authentication token found, skipping announcements load');
          setAnnouncements([]);
        }
      } catch (err) {
        console.warn('Failed to load announcements:', err);
        setAnnouncements([]);
      }
      
      // Load weeks
      const weeksData = await weekService.getCourseWeeks(courseId!);
      setWeeks(weeksData || []);

      // Load YouTube videos (filtered from course materials)
      const youtubeVideosData = courseMaterials
        .filter((material: any) => material.type === 'video' && material.url?.includes('youtube'))
        .map((material: any) => ({
          _id: material._id,
          title: material.title,
          description: material.description,
          url: material.url,
          duration: material.duration || 'Unknown',
          thumbnail: material.thumbnail || '',
          order: material.order || 0,
          isPublished: material.isPublished || false
        }));
      setYoutubeVideos(youtubeVideosData);

    } catch (err: any) {
      console.error('Error loading course:', err);
      setError(err.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  // Material management functions
  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setMaterialForm({
      title: '',
      description: '',
      type: 'document',
      order: 1,
      url: '',
      file: null
    });
    setMaterialDialogOpen(true);
  };

  const handleEditMaterial = (material: any) => {
    setEditingMaterial(material);
    setMaterialForm({
      title: material.title,
      description: material.description,
      type: material.type,
      order: material.order,
      url: material.url,
      file: null
    });
    setMaterialDialogOpen(true);
  };

  const handleDeleteMaterial = (material: any) => {
    setMaterialToDelete(material);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMaterial = async () => {
    if (!materialToDelete) return;

    try {
      setDeleting(true);
      
      // Remove from frontend state
      setMaterials(prev => prev.filter(m => m._id !== materialToDelete._id));
      
      console.log(`✅ Material deleted successfully: ${materialToDelete.title}`);
      setDeleteDialogOpen(false);
      setMaterialToDelete(null);
    } catch (err: any) {
      console.error('Error deleting material:', err);
      setError(err.message || 'Failed to delete material');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteMaterial = () => {
    setDeleteDialogOpen(false);
    setMaterialToDelete(null);
  };

  const handleSaveMaterial = async () => {
    if (!courseId) {
      setError('Course ID is required');
      return;
    }

    try {
      if (editingMaterial) {
        // Update existing material
        setMaterials(prev => prev.map(m => 
          m._id === editingMaterial._id 
            ? { ...m, ...materialForm, updatedAt: new Date().toISOString() }
            : m
        ));
      } else {
        // Add new material
        const newMaterial = {
          _id: Date.now().toString(),
          ...materialForm,
          createdAt: new Date().toISOString()
        };

        // Add the material to the list
        setMaterials(prev => [...prev, newMaterial]);
      }
      setMaterialDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving material:', err);
      setError(err.message || 'Failed to save material');
    }
  };

  // Week management functions
  const handleAddWeek = () => {
    setEditingWeek(null);
    setWeekForm({
      title: '',
      description: '',
      weekNumber: weeks.length + 1,
      startDate: '',
      endDate: '',
      isPublished: false
    });
    setWeekDialogOpen(true);
  };

  const handleEditWeek = (week: Week) => {
    setEditingWeek(week);
    setWeekForm({
      title: week.title,
      description: week.description,
      weekNumber: week.weekNumber,
      startDate: week.startDate.split('T')[0],
      endDate: week.endDate.split('T')[0],
      isPublished: week.isPublished
    });
    setWeekDialogOpen(true);
  };

  const handleDeleteWeek = async (week: Week) => {
    try {
      const { weekService } = await import('../../services/weekService');
      await weekService.deleteWeek(week._id);
      setWeeks(prev => prev.filter(w => w._id !== week._id));
    } catch (err: any) {
      console.error('Error deleting week:', err);
      setError(err.message || 'Failed to delete week');
    }
  };

  const handleSaveWeek = async () => {
    if (!courseId) {
      setError('Course ID is required');
      return;
    }

    try {
      const { weekService } = await import('../../services/weekService');
      if (editingWeek) {
        const updatedWeek = await weekService.updateWeek(editingWeek._id, weekForm);
        setWeeks(prev => prev.map(w => w._id === editingWeek._id ? updatedWeek : w));
      } else {
        const newWeek = await weekService.createWeek(courseId, weekForm);
        setWeeks(prev => [...prev, newWeek]);
      }
      setWeekDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving week:', err);
      setError(err.message || 'Failed to save week');
    }
  };

  const handleToggleWeekPublish = async (week: Week) => {
    try {
      const { weekService } = await import('../../services/weekService');
      const updatedWeek = await weekService.toggleWeekPublish(week._id, !week.isPublished);
      setWeeks(prev => prev.map(w => w._id === week._id ? updatedWeek : w));
    } catch (err: any) {
      console.error('Error toggling week publish:', err);
      setError(err.message || 'Failed to update week');
    }
  };

  // Week material management functions
  const handleAddWeekMaterial = (week: Week) => {
    setSelectedWeek(week);
    setEditingWeekMaterial(null);
    setWeekMaterialForm({
      title: '',
      description: '',
      type: 'document' as const,
      url: '',
      order: week.materials.length + 1,
      estimatedDuration: 30,
      isRequired: true,
      isPublished: true
    });
    setWeekMaterialDialogOpen(true);
  };

  const handleEditWeekMaterial = (week: Week, material: WeekMaterial) => {
    setSelectedWeek(week);
    setEditingWeekMaterial(material);
    setWeekMaterialForm({
      title: material.title,
      description: material.description,
      type: material.type as 'document' | 'video' | 'audio' | 'link' | 'quiz',
      url: material.url || '',
      order: material.order,
      estimatedDuration: material.estimatedDuration,
      isRequired: material.isRequired,
      isPublished: material.isPublished
    });
    setWeekMaterialDialogOpen(true);
  };

  const handleDeleteWeekMaterial = async (week: Week, material: WeekMaterial) => {
    try {
      const { weekService } = await import('../../services/weekService');
      await weekService.deleteWeekMaterial(week._id, material._id);
      setWeeks(prev => prev.map(w => 
        w._id === week._id 
          ? { ...w, materials: w.materials.filter(m => m._id !== material._id) }
          : w
      ));
    } catch (err: any) {
      console.error('Error deleting week material:', err);
      setError(err.message || 'Failed to delete material');
    }
  };

  const handleSaveWeekMaterial = async () => {
    if (!selectedWeek) {
      setError('No week selected');
      return;
    }

    try {
      const { weekService } = await import('../../services/weekService');
      if (editingWeekMaterial) {
        const updatedMaterial = await weekService.updateWeekMaterial(
          selectedWeek._id, 
          editingWeekMaterial._id, 
          weekMaterialForm
        );
        setWeeks(prev => prev.map(w => 
          w._id === selectedWeek._id 
            ? { ...w, materials: w.materials.map(m => m._id === editingWeekMaterial._id ? updatedMaterial : m) }
            : w
        ));
      } else {
        const newMaterial = await weekService.addWeekMaterial(selectedWeek._id, weekMaterialForm);
        setWeeks(prev => prev.map(w => 
          w._id === selectedWeek._id 
            ? { ...w, materials: [...w.materials, newMaterial] }
            : w
        ));
      }
      setWeekMaterialDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving week material:', err);
      setError(err.message || 'Failed to save material');
    }
  };

  // Helper function to get file icon based on material type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document': return <Description />;
      case 'pdf': return <PictureAsPdf />;
      case 'video': return <VideoFile />;
      case 'audio': return <AudioFile />;
      case 'image': return <PictureAsPdf />;
      case 'structured_notes': return <MenuBook />;
      case 'exam': return <Quiz />;
      default: return <InsertDriveFile />;
    }
  };

  // Live session management functions
  const handleAddSession = () => {
    setEditingSession(null);
    setSessionForm({
      title: '',
      description: '',
      scheduledTime: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16), // 1 hour from now
      duration: 60,
      maxParticipants: 50,
      agenda: '',
      recordingEnabled: true,
      chatEnabled: true,
      courseId: courseId || '',
      zoomFallbackLink: '',
    });
    setSessionDialogOpen(true);
  };

  const handleEditSession = (session: any) => {
    setEditingSession(session);
    setSessionForm({
      title: session.title,
      description: session.description,
      scheduledTime: session.scheduledTime,
      duration: session.duration,
      maxParticipants: session.maxParticipants,
      agenda: Array.isArray(session.agenda) ? session.agenda.join('\n') : session.agenda || '',
      recordingEnabled: session.isRecorded || session.recordingEnabled || true,
      chatEnabled: session.chatEnabled !== false,
      courseId: session.course?._id || session.courseId || courseId || '',
      zoomFallbackLink: session.zoomFallbackLink || '',
    });
    setSessionDialogOpen(true);
  };

  const handleDeleteSession = async (session: any) => {
    try {
      await liveSessionService.deleteSession(session._id);
      setLiveSessions(prev => prev.filter(s => s._id !== session._id));
      setError(null);
    } catch (error) {
      console.error('Error deleting session:', error);
      setError('Failed to delete session. Please try again.');
    }
  };

  const handleSaveSession = async () => {
    try {
      if (editingSession) {
        // Update existing session
        const updatedSession = await liveSessionService.updateSession(editingSession._id, {
          title: sessionForm.title,
          description: sessionForm.description,
          scheduledTime: new Date(sessionForm.scheduledTime).toISOString(),
          duration: sessionForm.duration,
          maxParticipants: sessionForm.maxParticipants,
          agenda: sessionForm.agenda ? sessionForm.agenda.split('\n').filter(item => item.trim()) : [],
          isRecorded: sessionForm.recordingEnabled,
          chatEnabled: sessionForm.chatEnabled,
          handRaiseEnabled: true,
          screenShareEnabled: true,
          attendanceRequired: false,
          courseId: sessionForm.courseId,
          zoomFallbackLink: sessionForm.zoomFallbackLink
        });
        setLiveSessions(prev => prev.map(s => 
          s._id === editingSession._id ? updatedSession : s
        ));
      } else {
        // Create new session
        const newSession = await liveSessionService.createSession({
          title: sessionForm.title,
          description: sessionForm.description,
          courseId: sessionForm.courseId || courseId!,
          scheduledTime: new Date(sessionForm.scheduledTime).toISOString(),
          duration: sessionForm.duration,
          maxParticipants: sessionForm.maxParticipants,
          agenda: sessionForm.agenda ? sessionForm.agenda.split('\n').filter(item => item.trim()) : [],
          isRecorded: sessionForm.recordingEnabled,
          chatEnabled: sessionForm.chatEnabled,
          handRaiseEnabled: true,
          screenShareEnabled: true,
          attendanceRequired: false,
          zoomFallbackLink: sessionForm.zoomFallbackLink
        });
        setLiveSessions(prev => [...prev, newSession]);
      }
      setSessionDialogOpen(false);
      setError(null);
    } catch (error) {
      console.error('Error saving session:', error);
      setError('Failed to save session. Please try again.');
    }
  };

  const handleStartSession = (sessionId: string) => {
    // Navigate to live session room
    navigate(`/video-session/teacher/${sessionId}`);
  };

  const getSessionStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'live': return 'success';
      case 'ended': return 'default';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const formatSessionTime = (time: string) => {
    return new Date(time).toLocaleString();
  };

  // Assignment management functions
  const handleAddAssignment = () => {
    setEditingAssignment(null);
    setAssignmentForm({
      title: '',
      description: '',
      dueDate: '',
      points: 100,
      type: 'essay',
      instructions: '',
      attachments: [],
      rubric: '',
      allowLateSubmission: false,
      latePenalty: 0
    });
    setAssignmentDialogOpen(true);
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      points: assignment.points,
      type: assignment.type,
      instructions: assignment.instructions,
      attachments: assignment.attachments,
      rubric: assignment.rubric,
      allowLateSubmission: assignment.allowLateSubmission,
      latePenalty: assignment.latePenalty
    });
    setAssignmentDialogOpen(true);
  };

  const handleDeleteAssignment = async (assignment: any) => {
    try {
      await assignmentService.deleteAssignment(assignment._id);
      setAssignments(prev => prev.filter(a => a._id !== assignment._id));
      console.log('Assignment deleted successfully');
    } catch (error) {
      console.error('Error deleting assignment:', error);
      setError('Failed to delete assignment');
    }
  };

  const handleSaveAssignment = async () => {
    try {
      if (editingAssignment) {
        // Update existing assignment
        const updatedAssignment = await assignmentService.updateAssignment(editingAssignment._id, assignmentForm);
        setAssignments(prev => prev.map(a => 
          a._id === editingAssignment._id ? updatedAssignment : a
        ));
      } else {
        // Create new assignment
        const newAssignment = await assignmentService.createAssignment({
          title: assignmentForm.title,
          description: assignmentForm.description,
          instructions: assignmentForm.instructions,
          courseId: courseId!,
          dueDate: assignmentForm.dueDate,
          maxPoints: assignmentForm.points,
          submissionType: 'both' as const,
          allowedFileTypes: ['pdf', 'doc', 'docx'],
          maxFileSize: 10 * 1024 * 1024, // 10MB
          isRequired: true
        });
        setAssignments(prev => [...prev, newAssignment]);
      }
      setAssignmentDialogOpen(false);
      setError(null);
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      setError(error.response?.data?.message || 'Failed to save assignment');
    }
  };

  const getAssignmentTypeColor = (type: string) => {
    switch (type) {
      case 'essay': return 'primary';
      case 'project': return 'secondary';
      case 'presentation': return 'success';
      default: return 'default';
    }
  };

  const formatDueDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  // Assessment management functions
  const handleAddAssessment = () => {
    setEditingAssessment(null);
    setAssessmentForm({
      title: '',
      description: '',
      dueDate: '',
      points: 100,
      type: 'quiz',
      timeLimit: 60,
      questions: [],
      passingScore: 70,
      attempts: 3,
      randomizeQuestions: false,
      showResultsImmediately: true,
      requireProctoring: false,
      instructions: ''
    });
    setAssessmentDialogOpen(true);
  };

  const handleEditAssessment = (assessment: any) => {
    setEditingAssessment(assessment);
    setAssessmentForm({
      title: assessment.title,
      description: assessment.description,
      dueDate: assessment.dueDate,
      points: assessment.points,
      type: assessment.type,
      timeLimit: assessment.timeLimit,
      questions: assessment.questions,
      passingScore: assessment.passingScore,
      attempts: assessment.attempts,
      randomizeQuestions: assessment.randomizeQuestions,
      showResultsImmediately: assessment.showResultsImmediately,
      requireProctoring: assessment.requireProctoring,
      instructions: assessment.instructions || ''
    });
    setAssessmentDialogOpen(true);
  };

  const handleDeleteAssessment = async (assessment: any) => {
    try {
      await assessmentService.deleteAssessment(assessment._id);
      setAssessments(prev => prev.filter(a => a._id !== assessment._id));
      console.log('Assessment deleted successfully');
    } catch (error) {
      console.error('Error deleting assessment:', error);
      setError('Failed to delete assessment');
    }
  };

  const handleSaveAssessment = async () => {
    try {
      if (editingAssessment) {
        // Update existing assessment
        const updatedAssessment = await assessmentService.updateAssessment(editingAssessment._id, {
          title: assessmentForm.title,
          description: assessmentForm.description,
          type: assessmentForm.type as 'quiz' | 'assignment' | 'exam' | 'project' | 'homework',
          timeLimit: assessmentForm.timeLimit,
          attempts: assessmentForm.attempts,
          dueDate: assessmentForm.dueDate,
          instructions: assessmentForm.instructions,
          isPublished: true,
          allowLateSubmission: true,
          randomizeQuestions: assessmentForm.randomizeQuestions,
          showResultsImmediately: assessmentForm.showResultsImmediately,
          requireProctoring: assessmentForm.requireProctoring,
          passingScore: assessmentForm.passingScore,
          questions: []
        });
        setAssessments(prev => prev.map(a => 
          a._id === editingAssessment._id ? updatedAssessment : a
        ));
      } else {
        // Create new assessment
        const newAssessment = await assessmentService.createAssessment({
          title: assessmentForm.title,
          description: assessmentForm.description,
          courseId: courseId!,
          type: assessmentForm.type as 'quiz' | 'assignment' | 'exam' | 'project' | 'homework',
          timeLimit: assessmentForm.timeLimit,
          attempts: assessmentForm.attempts,
          dueDate: assessmentForm.dueDate,
          instructions: assessmentForm.instructions,
          isPublished: true,
          allowLateSubmission: true,
          randomizeQuestions: assessmentForm.randomizeQuestions,
          showResultsImmediately: assessmentForm.showResultsImmediately,
          requireProctoring: assessmentForm.requireProctoring,
          passingScore: assessmentForm.passingScore,
          questions: []
        });
        setAssessments(prev => [...prev, newAssessment]);
      }
      setAssessmentDialogOpen(false);
      setError(null);
    } catch (error: any) {
      console.error('Error saving assessment:', error);
      setError(error.response?.data?.message || 'Failed to save assessment');
    }
  };

  const getAssessmentTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'primary';
      case 'exam': return 'secondary';
      case 'test': return 'success';
      default: return 'default';
    }
  };

  // File upload handlers
  const handleUploadFile = (item: any, type: 'assignment' | 'assessment') => {
    setUploadingItem(item);
    setUploadType(type);
    setUploadFile(null);
    setUploadProgress(0);
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setUploadFile(file);
      setError(null);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadingItem || !courseId) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('courseId', courseId);
      formData.append('itemId', uploadingItem._id);
      formData.append('type', uploadType);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await api.post('/upload/exam', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total!);
          setUploadProgress(percentCompleted);
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        // Reload assignments and assessments to get updated data from server
        try {
          const [assignmentsData, assessmentsData] = await Promise.all([
            assignmentService.getCourseAssignments(courseId!),
            assessmentService.getCourseAssessments(courseId!)
          ]);
          
          setAssignments(assignmentsData || []);
          setAssessments(assessmentsData || []);
          
          console.log('✅ Course data reloaded after exam upload');
          console.log('📊 Assignment with uploaded file:', assignmentsData.find(a => a.assignmentDocument));
          console.log('📊 Assessment with uploaded file:', assessmentsData.find(a => a.documentUrl || a.attachments?.length));
        } catch (reloadError) {
          console.error('Error reloading course data:', reloadError);
          // Fallback to local state update
          if (uploadType === 'assignment') {
            setAssignments(prev => prev.map(a => 
              a._id === uploadingItem._id 
                ? { ...a, uploadedFile: response.data.data }
                : a
            ));
          } else {
            setAssessments(prev => prev.map(a => 
              a._id === uploadingItem._id 
                ? { ...a, uploadedFile: response.data.data }
                : a
            ));
          }
        }

        setUploadDialogOpen(false);
        setError(null);
        // Show success message
        console.log('File uploaded successfully');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Publish/Unpublish handlers
  const handleToggleAssignmentPublish = async (assignment: any) => {
    try {
      const newStatus = assignment.status === 'published' ? 'draft' : 'published';
      await assignmentService.toggleAssignmentPublish(assignment._id, newStatus);
      
      setAssignments(prev => prev.map(a => 
        a._id === assignment._id 
          ? { ...a, status: newStatus }
          : a
      ));
      
      console.log(`Assignment ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error toggling assignment publish status:', error);
      setError('Failed to update assignment status');
    }
  };

  const handleToggleAssessmentPublish = async (assessment: any) => {
    try {
      const updatedAssessment = await assessmentService.togglePublishAssessment(assessment._id);
      
      setAssessments(prev => prev.map(a => 
        a._id === assessment._id 
          ? { ...a, isPublished: updatedAssessment.isPublished, status: updatedAssessment.status }
          : a
      ));
      
      console.log(`Assessment ${updatedAssessment.isPublished ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error toggling assessment publish status:', error);
      setError('Failed to update assessment status');
    }
  };

  // YouTube video management functions
  const handleAddVideo = () => {
    setEditingVideo(null);
    setVideoForm({
      title: '',
      description: '',
      url: '',
      duration: '',
      thumbnail: '',
      order: 0,
      isPublished: false
    });
    setVideoDialogOpen(true);
  };

  const handleEditVideo = (video: any) => {
    setEditingVideo(video);
    setVideoForm({
      title: video.title,
      description: video.description,
      url: video.url,
      duration: video.duration,
      thumbnail: video.thumbnail,
      order: video.order,
      isPublished: video.isPublished
    });
    setVideoDialogOpen(true);
  };

  const handleDeleteVideo = (video: any) => {
    setYoutubeVideos(prev => prev.filter(v => v._id !== video._id));
  };

  const handleSaveVideo = () => {
    if (editingVideo) {
      setYoutubeVideos(prev => prev.map(v => 
        v._id === editingVideo._id 
          ? { ...v, ...videoForm, updatedAt: new Date().toISOString() }
          : v
      ));
    } else {
      const newVideo = {
        _id: Date.now().toString(),
        ...videoForm,
        createdAt: new Date().toISOString()
      };
      setYoutubeVideos(prev => [...prev, newVideo]);
    }
    setVideoDialogOpen(false);
  };

  const extractVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getVideoThumbnail = (url: string) => {
    const videoId = extractVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
  };

  const formatDuration = (duration: string) => {
    return duration || 'Unknown';
  };

  // Announcement handlers
  const handleSaveAnnouncement = async () => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to create announcements');
        return;
      }

      const formData = new FormData();
      formData.append('title', announcementForm.title);
      formData.append('content', announcementForm.content);
      formData.append('priority', announcementForm.priority);
      formData.append('isPublished', announcementForm.isPublished.toString());
      if (announcementForm.scheduledDate) {
        formData.append('scheduledDate', announcementForm.scheduledDate);
      }
      
      // Add attachments
      announcementForm.attachments.forEach((file, index) => {
        formData.append('attachments', file);
      });

      let response;
      if (editingAnnouncement) {
        response = await api.put(`/announcements/${editingAnnouncement._id}`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        formData.append('course', courseId!);
        response = await api.post('/announcements', formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
      }

      // Reload announcements
      const announcementsResponse = await api.get(`/announcements/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAnnouncements(announcementsResponse.data.data || []);
      
      setAnnouncementDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving announcement:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        // Redirect to login
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        setError('You do not have permission to create announcements for this course.');
      } else {
        setError('Failed to save announcement. Please try again.');
      }
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to delete announcements');
        return;
      }

      await api.delete(`/announcements/${announcementId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Reload announcements
      const announcementsResponse = await api.get(`/announcements/course/${courseId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAnnouncements(announcementsResponse.data.data || []);
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
        window.location.href = '/login';
      } else if (error.response?.status === 403) {
        setError('You do not have permission to delete this announcement.');
      } else {
        setError('Failed to delete announcement. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadCourse}>
          Retry
        </Button>
      </Box>
    );
  }

  if (!courseData) {
    return (
      <Box>
        <Alert severity="warning">
          Course not found
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Course Management
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage course materials, live sessions, assignments, and assessments
        </Typography>
      </Box>

      {/* Error/Success Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Course Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h6" gutterBottom>
                {courseData.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {courseData.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip label={`${materials.length} Materials`} size="small" />
                <Chip label={`${liveSessions.length} Live Sessions`} size="small" />
                <Chip label={`${assignments.length} Assignments`} size="small" />
                <Chip label={`${assessments.length} Assessments`} size="small" />
                <Chip label={`${youtubeVideos.length} Videos`} size="small" />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => {/* Preview course */}}
                >
                  Preview Course
                </Button>
                <Button
                  variant="contained"
                  onClick={() => {/* Course settings */}}
                >
                  Course Settings
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 3, elevation: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ 
              '& .MuiTab-root': {
                minWidth: 120,
                textTransform: 'none',
                fontWeight: 500
              }
            }}
          >
            <Tab label="Weeks" {...a11yProps(0)} />
            <Tab label="Announcements" {...a11yProps(1)} />
            <Tab label="Live Sessions" {...a11yProps(2)} />
            <Tab label="Assignments" {...a11yProps(3)} />
            <Tab label="Assessments" {...a11yProps(4)} />
            <Tab label="Videos" {...a11yProps(5)} />
            <Tab label="Preview" {...a11yProps(6)} />
          </Tabs>
        </Box>

        {/* Weeks Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Course Weeks</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddWeek}
            >
              Add Week
            </Button>
          </Box>

          <Grid container spacing={3}>
            {weeks.map((week, index) => (
              <Grid item xs={12} key={week._id || `week-${index}`}>
                <Card sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                  },
                  // Mobile optimizations
                  '@media (max-width: 768px)': {
                    '&:hover': {
                      transform: 'none'
                    }
                  }
                }}>
                  <CardContent sx={{
                    // Mobile padding optimizations
                    '@media (max-width: 480px)': {
                      padding: 2
                    }
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      mb: 2,
                      // Mobile layout optimizations
                      '@media (max-width: 768px)': {
                        flexDirection: 'column',
                        gap: 2,
                        alignItems: 'stretch'
                      }
                    }}>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '1.2rem'
                          }}>
                            {week.weekNumber}
                          </Box>
                          <Typography 
                            variant="h5" 
                            gutterBottom
                            sx={{
                              fontWeight: 'bold',
                              // Mobile typography optimizations
                              '@media (max-width: 480px)': {
                                fontSize: '1.3rem'
                              }
                            }}
                          >
                            {week.title}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            opacity: 0.9, 
                            mb: 2,
                            // Mobile typography optimizations
                            '@media (max-width: 480px)': {
                              fontSize: '0.9rem'
                            }
                          }}
                        >
                          {week.description}
                        </Typography>
                        
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1, 
                          mb: 2, 
                          flexWrap: 'wrap',
                          // Mobile chip optimizations
                          '@media (max-width: 480px)': {
                            gap: 0.5,
                            '& .MuiChip-root': {
                              fontSize: '0.75rem',
                              height: '28px'
                            }
                          }
                        }}>
                          <Chip 
                            label={`${week.materials.length} Materials`} 
                            size="small" 
                            sx={{ 
                              backgroundColor: 'rgba(255,255,255,0.2)', 
                              color: 'white',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }}
                          />
                          <Chip 
                            label={`${new Date(week.startDate).toLocaleDateString()} - ${new Date(week.endDate).toLocaleDateString()}`} 
                            size="small" 
                            sx={{ 
                              backgroundColor: 'rgba(255,255,255,0.2)', 
                              color: 'white',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }}
                          />
                          <Chip 
                            label={week.isPublished ? 'Published' : 'Draft'} 
                            size="small" 
                            sx={{ 
                              backgroundColor: week.isPublished ? 'rgba(76, 175, 80, 0.8)' : 'rgba(255, 193, 7, 0.8)', 
                              color: 'white',
                              border: '1px solid rgba(255,255,255,0.3)'
                            }}
                          />
                          {week.assessment && (
                            <Chip 
                              label="Has Assessment" 
                              size="small" 
                              sx={{ 
                                backgroundColor: 'rgba(156, 39, 176, 0.8)', 
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.3)'
                              }}
                            />
                          )}
                          {week.assignment && (
                            <Chip 
                              label="Has Assignment" 
                              size="small" 
                              sx={{ 
                                backgroundColor: 'rgba(33, 150, 243, 0.8)', 
                                color: 'white',
                                border: '1px solid rgba(255,255,255,0.3)'
                              }}
                            />
                          )}
                        </Box>

                        {/* Week Materials */}
                        <Typography 
                          variant="subtitle1" 
                          gutterBottom
                          sx={{ 
                            fontWeight: 'bold',
                            mb: 2,
                            // Mobile typography optimizations
                            '@media (max-width: 480px)': {
                              fontSize: '1rem'
                            }
                          }}
                        >
                          📚 Materials ({week.materials.length})
                        </Typography>
                        
                        {week.materials.length === 0 ? (
                          <Box sx={{ 
                            textAlign: 'center', 
                            py: 3,
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 2,
                            border: '2px dashed rgba(255,255,255,0.3)'
                          }}>
                            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                              No materials added yet. Click "Add Material" to get started.
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ 
                            display: 'grid',
                            gap: 1.5,
                            // Mobile grid optimizations
                            '@media (max-width: 768px)': {
                              gap: 1
                            }
                          }}>
                            {week.materials.map((material, materialIndex) => (
                              <Paper 
                                key={material._id || `material-${materialIndex}`}
                                sx={{
                                  backgroundColor: 'rgba(255,255,255,0.1)',
                                  backdropFilter: 'blur(10px)',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                  borderRadius: 2,
                                  p: 2,
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255,255,255,0.15)',
                                    transform: 'translateX(4px)'
                                  },
                                  // Mobile optimizations
                                  '@media (max-width: 480px)': {
                                    p: 1.5,
                                    '&:hover': {
                                      transform: 'none'
                                    }
                                  }
                                }}
                              >
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'flex-start', 
                                  gap: 2,
                                  // Mobile layout optimizations
                                  '@media (max-width: 480px)': {
                                    gap: 1.5
                                  }
                                }}>
                                  <Box sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    // Mobile icon optimizations
                                    '@media (max-width: 480px)': {
                                      width: 40,
                                      height: 40
                                    }
                                  }}>
                                    {getFileIcon(material.type)}
                                  </Box>
                                  
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography 
                                      variant="subtitle2" 
                                      sx={{ 
                                        fontWeight: 'bold',
                                        mb: 0.5,
                                        // Mobile typography optimizations
                                        '@media (max-width: 480px)': {
                                          fontSize: '0.9rem'
                                        }
                                      }}
                                    >
                                      {material.title}
                                    </Typography>
                                    <Typography 
                                      variant="caption" 
                                      sx={{ 
                                        opacity: 0.8,
                                        display: 'block',
                                        mb: 1,
                                        // Mobile typography optimizations
                                        '@media (max-width: 480px)': {
                                          fontSize: '0.75rem'
                                        }
                                      }}
                                    >
                                      {material.description}
                                    </Typography>
                                    
                                    <Box sx={{ 
                                      display: 'flex', 
                                      gap: 0.5, 
                                      flexWrap: 'wrap',
                                      // Mobile chip optimizations
                                      '@media (max-width: 480px)': {
                                        gap: 0.25,
                                        '& .MuiChip-root': {
                                          fontSize: '0.7rem',
                                          height: '24px'
                                        }
                                      }
                                    }}>
                                      <Chip 
                                        label={material.type === 'structured_notes' ? 'AI Notes' : 
                                               material.type === 'exam' ? `${material.examType || 'Exam'}` : 
                                               material.type} 
                                        size="small" 
                                        sx={{ 
                                          backgroundColor: material.type === 'structured_notes' ? 'rgba(76, 175, 80, 0.8)' : 
                                                          material.type === 'exam' ? 'rgba(255, 152, 0, 0.8)' :
                                                          'rgba(255,255,255,0.2)', 
                                          color: 'white',
                                          border: '1px solid rgba(255,255,255,0.3)'
                                        }}
                                      />
                                      <Chip 
                                        label={`${material.estimatedDuration} min`} 
                                        size="small" 
                                        sx={{ 
                                          backgroundColor: 'rgba(255,255,255,0.2)', 
                                          color: 'white',
                                          border: '1px solid rgba(255,255,255,0.3)'
                                        }}
                                      />
                                      {material.type === 'structured_notes' && material.content?.structuredNotes && (
                                        <Chip 
                                          label={`${material.content.structuredNotes.sections.length} sections`} 
                                          size="small" 
                                          sx={{ 
                                            backgroundColor: 'rgba(33, 150, 243, 0.8)', 
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.3)'
                                          }}
                                        />
                                      )}
                                      {material.isRequired && (
                                        <Chip 
                                          label="Required" 
                                          size="small" 
                                          sx={{ 
                                            backgroundColor: 'rgba(244, 67, 54, 0.8)', 
                                            color: 'white',
                                            border: '1px solid rgba(255,255,255,0.3)'
                                          }}
                                        />
                                      )}
                                    </Box>
                                  </Box>
                                  
                                  <Box sx={{ 
                                    display: 'flex', 
                                    gap: 0.5,
                                    flexShrink: 0,
                                    // Mobile action buttons optimizations
                                    '@media (max-width: 480px)': {
                                      flexDirection: 'column',
                                      gap: 0.25
                                    }
                                  }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditWeekMaterial(week, material)}
                                      title="Edit Material"
                                      sx={{
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        color: 'white',
                                        '&:hover': {
                                          backgroundColor: 'rgba(255,255,255,0.2)'
                                        },
                                        // Mobile button optimizations
                                        '@media (max-width: 480px)': {
                                          padding: '6px'
                                        }
                                      }}
                                    >
                                      <Edit />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteWeekMaterial(week, material)}
                                      title="Delete Material"
                                      sx={{
                                        backgroundColor: 'rgba(244, 67, 54, 0.2)',
                                        color: 'white',
                                        '&:hover': {
                                          backgroundColor: 'rgba(244, 67, 54, 0.4)'
                                        },
                                        // Mobile button optimizations
                                        '@media (max-width: 480px)': {
                                          padding: '6px'
                                        }
                                      }}
                                    >
                                      <Delete />
                                    </IconButton>
                                  </Box>
                                </Box>
                              </Paper>
                            ))}
                          </Box>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ 
                      display: 'flex', 
                      gap: 1, 
                      flexWrap: 'wrap',
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid rgba(255,255,255,0.2)',
                      // Mobile action buttons optimizations
                      '@media (max-width: 480px)': {
                        gap: 0.5,
                        '& .MuiButton-root': {
                          fontSize: '0.8rem',
                          padding: '6px 12px'
                        }
                      }
                    }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleAddWeekMaterial(week)}
                        sx={{
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          color: 'white',
                          border: '1px solid rgba(255,255,255,0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.3)'
                          }
                        }}
                      >
                        Add Material
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEditWeek(week)}
                        sx={{
                          borderColor: 'rgba(255,255,255,0.5)',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderColor: 'rgba(255,255,255,0.7)'
                          }
                        }}
                      >
                        Edit Week
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleToggleWeekPublish(week)}
                        sx={{
                          borderColor: week.isPublished ? 'rgba(255, 193, 7, 0.8)' : 'rgba(76, 175, 80, 0.8)',
                          color: week.isPublished ? '#ffc107' : '#4caf50',
                          backgroundColor: week.isPublished ? 'rgba(255, 193, 7, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                          '&:hover': {
                            backgroundColor: week.isPublished ? 'rgba(255, 193, 7, 0.2)' : 'rgba(76, 175, 80, 0.2)'
                          }
                        }}
                      >
                        {week.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteWeek(week)}
                        sx={{
                          backgroundColor: 'rgba(244, 67, 54, 0.2)',
                          color: 'white',
                          border: '1px solid rgba(244, 67, 54, 0.5)',
                          '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.4)'
                          },
                          // Mobile button optimizations
                          '@media (max-width: 480px)': {
                            padding: '6px'
                          }
                        }}
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          
          {/* Material Upload Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Upload Materials to Weeks
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Upload files that will be automatically added to the selected week's materials.
            </Typography>
            
            {weeks.length > 0 ? (
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {weeks.map((week) => (
                  <Card key={week._id} variant="outlined" sx={{ minWidth: 300 }}>
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>
                        Week {week.weekNumber}: {week.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {week.description}
                      </Typography>
                      
                      <DocumentProcessor
                        courseId={courseId}
                        weekId={week._id}
                        onProcessingComplete={async (result) => {
                          try {
                            console.log('🔄 Processing complete, saving to week:', {
                              weekId: week._id,
                              materialTitle: result.material!.title,
                              hasStructuredNotes: !!result.material!.content.structuredNotes,
                              sectionsCount: result.material!.content.structuredNotes?.sections.length
                            });

                            // Dynamically import weekService
                            const { weekService } = await import('../../services/weekService');
                            
                            // Prepare material data
                            const materialData = {
                              title: result.material!.title,
                              description: result.material!.description,
                              type: 'structured_notes' as const,
                              url: '', // No URL needed for structured notes
                              order: week.materials.length + 1,
                              estimatedDuration: result.material!.content.structuredNotes.metadata.estimatedReadingTime,
                              isRequired: true,
                              isPublished: week.isPublished, // Inherit week's published status
                              content: result.material!.content // Store the structured content
                            };

                            console.log('📤 Saving material data:', {
                              ...materialData,
                              contentPreview: {
                                hasStructuredNotes: !!materialData.content.structuredNotes,
                                sectionsCount: materialData.content.structuredNotes?.sections.length,
                                keyPointsCount: materialData.content.structuredNotes?.keyPoints.length
                              }
                            });
                            
                            // Save processed material to the database
                            const savedMaterial = await weekService.addWeekMaterial(week._id, materialData);
                            
                            console.log('✅ Material saved successfully:', {
                              materialId: savedMaterial._id,
                              title: savedMaterial.title,
                              type: savedMaterial.type,
                              hasContent: !!savedMaterial.content
                            });
                            
                            // Update frontend state
                            setWeeks(prev => prev.map(w => 
                              w._id === week._id 
                                ? { ...w, materials: [...w.materials, savedMaterial] }
                                : w
                            ));
                          } catch (err: any) {
                            console.error('❌ Error saving processed material to week:', err);
                            setError(err.message || 'Failed to save processed material to week');
                          }
                        }}
                        onProcessingError={(error) => {
                          setError(error);
                        }}
                      />

                      <Divider sx={{ my: 2 }} />

                      {/* Media Upload (Images & Videos) */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          🎥 Media Upload (Images & Videos)
                        </Typography>
                        <MediaUploader
                          courseId={courseId}
                          weekId={week._id}
                          onUploadComplete={async (materialData) => {
                            try {
                              console.log('🔄 Media material ready to save to week:', {
                                weekId: week._id,
                                materialData: materialData,
                                materialKeys: Object.keys(materialData || {})
                              });

                              // Dynamically import weekService
                              const { weekService } = await import('../../services/weekService');
                              
                              console.log('📤 Saving media material data:', {
                                materialData,
                                weekId: week._id,
                                weekMaterialsCount: week.materials.length
                              });
                              
                              // Save media material to the database
                              const savedMaterial = await weekService.addWeekMaterial(week._id, materialData);
                              
                              console.log('✅ Media material saved successfully:', {
                                materialId: savedMaterial._id,
                                title: savedMaterial.title,
                                type: savedMaterial.type
                              });
                              
                              // Update frontend state
                              setWeeks(prev => prev.map(w => 
                                w._id === week._id 
                                  ? { ...w, materials: [...w.materials, savedMaterial] }
                                  : w
                              ));
                            } catch (err: any) {
                              console.error('❌ Error saving media material to week:', {
                                error: err,
                                message: err.message,
                                response: err.response?.data,
                                status: err.response?.status,
                                materialData: materialData
                              });
                              setError(err.message || 'Failed to save media material to week');
                            }
                          }}
                          onUploadError={(error) => {
                            setError(error);
                          }}
                        />
                      </Box>

                      <Divider sx={{ my: 2 }} />

                      {/* Exam Upload */}
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          📝 Exam Upload (Quiz & General Exams)
                        </Typography>
                        <ExamUploader
                          courseId={courseId || ''}
                          weekId={week._id}
                          onUploadComplete={async (examData) => {
                            try {
                              console.log('🔄 Exam material ready to save to week:', {
                                weekId: week._id,
                                examData: examData,
                                examKeys: Object.keys(examData || {})
                              });

                              // Dynamically import weekService
                              const { weekService } = await import('../../services/weekService');
                              
                              console.log('📤 Saving exam material data:', {
                                examData,
                                weekId: week._id,
                                weekMaterialsCount: week.materials.length
                              });
                              
                              // Save exam material to the database
                              const savedMaterial = await weekService.addWeekMaterial(week._id, examData);
                              
                              console.log('✅ Exam material saved successfully:', {
                                materialId: savedMaterial._id,
                                title: savedMaterial.title,
                                type: savedMaterial.type,
                                examType: savedMaterial.examType
                              });
                              
                              // Update frontend state
                              setWeeks(prev => prev.map(w => 
                                w._id === week._id 
                                  ? { ...w, materials: [...w.materials, savedMaterial] }
                                  : w
                              ));
                            } catch (err: any) {
                              console.error('❌ Error saving exam material to week:', {
                                error: err,
                                message: err.message,
                                response: err.response?.data,
                                status: err.response?.status,
                                examData: examData
                              });
                              setError(err.message || 'Failed to save exam material to week');
                            }
                          }}
                          onUploadError={(error) => {
                            setError(error);
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Alert severity="info">
                Create at least one week before uploading materials.
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Announcements Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Course Announcements</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingAnnouncement(null);
                setAnnouncementForm({
                  title: '',
                  content: '',
                  priority: 'medium',
                  isPublished: true,
                  scheduledDate: '',
                  attachments: []
                });
                setAnnouncementDialogOpen(true);
              }}
            >
              Add Announcement
            </Button>
          </Box>

          {announcements.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Announcement sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No announcements yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create your first announcement to keep students informed about course updates, deadlines, and important information.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {announcements.map((announcement) => (
                <Grid item xs={12} md={6} key={announcement._id}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" gutterBottom>
                            {announcement.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {announcement.content}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            <Chip
                              label={announcement.priority}
                              size="small"
                              color={
                                announcement.priority === 'urgent' ? 'error' :
                                announcement.priority === 'high' ? 'error' :
                                announcement.priority === 'medium' ? 'warning' :
                                'default'
                              }
                            />
                            <Chip
                              label={announcement.isPublished ? 'Published' : 'Draft'}
                              size="small"
                              color={announcement.isPublished ? 'success' : 'warning'}
                            />
                            {announcement.scheduledDate && (
                              <Chip
                                icon={<CalendarToday />}
                                label={new Date(announcement.scheduledDate).toLocaleDateString()}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingAnnouncement(announcement);
                              setAnnouncementForm({
                                title: announcement.title,
                                content: announcement.content,
                                priority: announcement.priority,
                                isPublished: announcement.isPublished,
                                scheduledDate: announcement.scheduledDate || '',
                                attachments: []
                              });
                              setAnnouncementDialogOpen(true);
                            }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteAnnouncement(announcement._id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Live Sessions Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Live Sessions</Typography>
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              onClick={handleAddSession}
            >
              Schedule Session
            </Button>
          </Box>

          <Grid container spacing={2}>
            {liveSessions.map((session, index) => (
              <Grid item xs={12} md={6} lg={4} key={session._id || `session-${index}`}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {session.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {session.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Scheduled:</strong> {formatSessionTime(session.scheduledTime)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Duration:</strong> {session.duration} minutes
                      </Typography>
                      <Typography variant="body2">
                        <strong>Max Participants:</strong> {session.maxParticipants}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => handleStartSession(session._id)}
                      >
                        Start Session
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleEditSession(session)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {/* View session details */}}
                      >
                        View
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSession(session)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Assignments Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Assignments</Typography>
            <Button
              variant="contained"
              startIcon={<Assignment />}
              onClick={handleAddAssignment}
            >
              Create Assignment
            </Button>
          </Box>

          <Grid container spacing={2}>
            {assignments.map((assignment, index) => (
              <Grid item xs={12} md={6} lg={4} key={assignment._id || `assignment-${index}`}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {assignment.title}
                      </Typography>
                      <Chip
                        label={assignment.status}
                        size="small"
                        color={assignment.status === 'published' ? 'success' : 'default'}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {assignment.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Due Date:</strong> {formatDueDate(assignment.dueDate)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Points:</strong> {assignment.points}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Type:</strong> {assignment.type}
                      </Typography>
                      {assignment.assignmentDocument && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                          <Chip
                            label={`Exam Uploaded: ${assignment.assignmentDocument.originalName}`}
                            size="small"
                            color="success"
                            icon={<CloudUpload />}
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        onClick={() => {/* View assignment details */}}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {/* View submissions */}}
                      >
                        Submissions
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        onClick={() => handleUploadFile(assignment, 'assignment')}
                        sx={{ 
                          borderColor: assignment.assignmentDocument ? 'success.main' : 'primary.main',
                          color: assignment.assignmentDocument ? 'success.main' : 'primary.main',
                          '&:hover': {
                            borderColor: assignment.assignmentDocument ? 'success.dark' : 'primary.dark',
                            backgroundColor: assignment.assignmentDocument ? 'success.light' : 'primary.light',
                          }
                        }}
                      >
                        {assignment.assignmentDocument ? 'Re-upload' : 'Upload Exam'}
                      </Button>
                      <Button
                        size="small"
                        variant={assignment.status === 'published' ? 'outlined' : 'contained'}
                        color={assignment.status === 'published' ? 'warning' : 'success'}
                        startIcon={assignment.status === 'published' ? <Unpublished /> : <Publish />}
                        onClick={() => handleToggleAssignmentPublish(assignment)}
                      >
                        {assignment.status === 'published' ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleEditAssignment(assignment)}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAssignment(assignment)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Assessments Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Assessments</Typography>
            <Button
              variant="contained"
              startIcon={<Quiz />}
              onClick={handleAddAssessment}
            >
              Create Assessment
            </Button>
          </Box>

          <Grid container spacing={2}>
            {assessments.map((assessment, index) => (
              <Grid item xs={12} md={6} lg={4} key={assessment._id || `assessment-${index}`}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {assessment.title}
                      </Typography>
                      <Chip
                        label={assessment.isPublished ? 'Published' : 'Draft'}
                        size="small"
                        color={assessment.isPublished ? 'success' : 'default'}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {assessment.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Due Date:</strong> {formatDueDate(assessment.dueDate)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Points:</strong> {assessment.points}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Type:</strong> {assessment.type}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Time Limit:</strong> {assessment.timeLimit} minutes
                      </Typography>
                      {(assessment.documentUrl || (assessment.attachments && assessment.attachments.length > 0)) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                          <Chip
                            label={`Exam Uploaded: ${assessment.attachments?.[0]?.originalName || 'Document'}`}
                            size="small"
                            color="success"
                            icon={<CloudUpload />}
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        onClick={() => window.open(`/student/quiz/${assessment._id}`, '_blank')}
                      >
                        View
                      </Button>
                      <Button
                        size="small"
                        onClick={() => {/* View submissions */}}
                      >
                        Submissions
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        onClick={() => handleUploadFile(assessment, 'assessment')}
                        sx={{ 
                          borderColor: (assessment.documentUrl || assessment.attachments?.length) ? 'success.main' : 'primary.main',
                          color: (assessment.documentUrl || assessment.attachments?.length) ? 'success.main' : 'primary.main',
                          '&:hover': {
                            borderColor: (assessment.documentUrl || assessment.attachments?.length) ? 'success.dark' : 'primary.dark',
                            backgroundColor: (assessment.documentUrl || assessment.attachments?.length) ? 'success.light' : 'primary.light',
                          }
                        }}
                      >
                        {(assessment.documentUrl || assessment.attachments?.length) ? 'Re-upload' : 'Upload Exam'}
                      </Button>
                      <Button
                        size="small"
                        variant={assessment.isPublished ? 'outlined' : 'contained'}
                        color={assessment.isPublished ? 'warning' : 'success'}
                        startIcon={assessment.isPublished ? <Unpublished /> : <Publish />}
                        onClick={() => handleToggleAssessmentPublish(assessment)}
                      >
                        {assessment.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleEditAssessment(assessment)}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAssessment(assessment)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Videos Tab */}
        <TabPanel value={activeTab} index={5}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">YouTube Videos</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddVideo}
            >
              Add Video
            </Button>
          </Box>

          <Grid container spacing={2}>
            {youtubeVideos.map((video, index) => (
              <Grid item xs={12} md={6} lg={4} key={video._id || `video-${index}`}>
                <Card>
                  <CardContent>
                    <Box sx={{ mb: 2 }}>
                      <img
                        src={getVideoThumbnail(video.url)}
                        alt={video.title}
                        style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }}
                      />
                    </Box>
                    <Typography variant="h6" gutterBottom>
                      {video.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {video.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        <strong>Duration:</strong> {formatDuration(video.duration)}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Order:</strong> {video.order}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<PlayArrow />}
                        onClick={() => {/* Preview video */}}
                      >
                        Preview
                      </Button>
                      <Button
                        size="small"
                        onClick={() => handleEditVideo(video)}
                      >
                        Edit
                      </Button>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteVideo(video)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Preview Tab */}
        <TabPanel value={activeTab} index={6}>
          <Typography variant="h6" gutterBottom>
            Course Preview - Student View
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            This is how students will see your course content.
          </Typography>

          {/* Course Content Preview */}
          <Box sx={{ mt: 3 }}>
            {/* Materials Section */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Course Materials ({materials.length})
                </Typography>
                <List>
                  {materials.slice(0, 3).map((material, index) => (
                    <ListItem key={material._id || `preview-material-${index}`}>
                      <Avatar sx={{ mr: 2 }}>
                        {getFileIcon(material.type)}
                      </Avatar>
                      <ListItemText
                        primary={material.title}
                        secondary={material.description}
                      />
                    </ListItem>
                  ))}
                  {materials.length > 3 && (
                    <ListItem>
                      <Typography variant="body2" color="text.secondary">
                        ... and {materials.length - 3} more materials
                      </Typography>
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>

            {/* Live Sessions Section */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Live Sessions ({liveSessions.length})
                </Typography>
                <Grid container spacing={2}>
                  {liveSessions.slice(0, 2).map((session, index) => (
                    <Grid item xs={12} md={6} key={session._id || `preview-session-${index}`}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle1" gutterBottom>
                            {session.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatSessionTime(session.scheduledTime)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Assignments Section */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Assignments ({assignments.length})
                </Typography>
                <Grid container spacing={2}>
                  {assignments.slice(0, 2).map((assignment, index) => (
                    <Grid item xs={12} md={6} key={assignment._id || `preview-assignment-${index}`}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {assignment.title}
                            </Typography>
                            <Chip
                              label={assignment.status}
                              size="small"
                              color={assignment.status === 'published' ? 'success' : 'default'}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Due: {formatDueDate(assignment.dueDate)}
                          </Typography>
                          {assignment.assignmentDocument && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <CloudUpload color="success" sx={{ fontSize: 16 }} />
                              <Typography variant="caption" color="success.main">
                                Exam uploaded: {assignment.assignmentDocument.originalName}
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              size="small"
                              variant={assignment.status === 'published' ? 'outlined' : 'contained'}
                              color={assignment.status === 'published' ? 'warning' : 'success'}
                              startIcon={assignment.status === 'published' ? <Unpublished /> : <Publish />}
                              onClick={() => handleToggleAssignmentPublish(assignment)}
                            >
                              {assignment.status === 'published' ? 'Unpublish' : 'Publish'}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Edit />}
                              onClick={() => {
                                setEditingAssignment(assignment);
                                setAssignmentDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => handleDeleteAssignment(assignment)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* Assessments Section */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Assessments ({assessments.length})
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Quiz />}
                    onClick={handleAddAssessment}
                  >
                    Create Assessment
                  </Button>
                </Box>
                {assessments.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No assessments found for this course.
                  </Typography>
                )}
                <Grid container spacing={2}>
                  {assessments.slice(0, 2).map((assessment, index) => (
                    <Grid item xs={12} md={6} key={assessment._id || `preview-assessment-${index}`}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography variant="subtitle1" gutterBottom>
                              {assessment.title}
                            </Typography>
                            <Chip
                              label={assessment.isPublished ? 'Published' : 'Draft'}
                              size="small"
                              color={assessment.isPublished ? 'success' : 'default'}
                              sx={{ ml: 1 }}
                            />
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Due: {formatDueDate(assessment.dueDate)}
                          </Typography>
                          {(assessment.documentUrl || (assessment.attachments && assessment.attachments.length > 0)) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                              <CloudUpload color="success" sx={{ fontSize: 16 }} />
                              <Typography variant="caption" color="success.main">
                                Exam uploaded: {assessment.attachments?.[0]?.originalName || 'Document'}
                              </Typography>
                            </Box>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                            <Button
                              size="small"
                              variant={assessment.isPublished ? 'outlined' : 'contained'}
                              color={assessment.isPublished ? 'warning' : 'success'}
                              startIcon={assessment.isPublished ? <Unpublished /> : <Publish />}
                              onClick={() => handleToggleAssessmentPublish(assessment)}
                            >
                              {assessment.isPublished ? 'Unpublish' : 'Publish'}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<Edit />}
                              onClick={() => {
                                setEditingAssessment(assessment);
                                setAssessmentDialogOpen(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => handleDeleteAssessment(assessment)}
                            >
                              Delete
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>

            {/* YouTube Videos Section */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Tutorial Videos ({youtubeVideos.length})
                </Typography>
                <Grid container spacing={2}>
                  {youtubeVideos.slice(0, 2).map((video, index) => (
                    <Grid item xs={12} md={6} key={video._id || `preview-video-${index}`}>
                      <Card variant="outlined">
                        <CardContent>
                          <img
                            src={getVideoThumbnail(video.url)}
                            alt={video.title}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', marginBottom: '8px' }}
                          />
                          <Typography variant="subtitle1" gutterBottom>
                            {video.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Duration: {formatDuration(video.duration)}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Box>

          {/* Student Actions */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Student Actions
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" color="primary">
                Enroll in Course
              </Button>
              <Button variant="outlined">
                View Classmates
              </Button>
              <Button variant="outlined">
                Join Discussion
              </Button>
              <Button variant="outlined">
                Download Materials
              </Button>
            </Box>
          </Box>
        </TabPanel>
      </Paper>

      {/* Add/Edit Material Dialog */}
      <Dialog open={materialDialogOpen} onClose={() => setMaterialDialogOpen(false)} maxWidth="md" fullWidth TransitionComponent={SafeDialogTransition}>
        <DialogTitle>
          {editingMaterial ? 'Edit Material' : 'Add New Material'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={materialForm.title}
              onChange={(e) => setMaterialForm(prev => ({ ...prev, title: e.target.value }))}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Description"
              value={materialForm.description}
              onChange={(e) => setMaterialForm(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Type</InputLabel>
              <Select
                value={materialForm.type}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, type: e.target.value }))}
              >
                <MenuItem value="document">Document</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
                <MenuItem value="video">Video</MenuItem>
                <MenuItem value="audio">Audio</MenuItem>
                <MenuItem value="image">Image</MenuItem>
                <MenuItem value="link">Link</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Order"
              type="number"
              value={materialForm.order}
              onChange={(e) => setMaterialForm(prev => ({ ...prev, order: parseInt(e.target.value) }))}
              margin="normal"
            />
            {materialForm.type === 'link' ? (
              <TextField
                fullWidth
                label="URL"
                value={materialForm.url}
                onChange={(e) => setMaterialForm(prev => ({ ...prev, url: e.target.value }))}
                margin="normal"
              />
            ) : (
              <Box sx={{ mt: 2 }}>
                <input
                  type="file"
                  onChange={(e) => setMaterialForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                  style={{ width: '100%' }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaterialDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveMaterial} variant="contained">
            {editingMaterial ? 'Update' : 'Add'} Material
          </Button>
        </DialogActions>
      </Dialog>

      {/* Material Deletion Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={cancelDeleteMaterial} TransitionComponent={SafeDialogTransition}>
        <DialogTitle>Delete Material</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{materialToDelete?.title}"? This action cannot be undone.
          </Typography>
          {materialToDelete && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2">
                <strong>Type:</strong> {materialToDelete.type}
              </Typography>
              <Typography variant="body2">
                <strong>Description:</strong> {materialToDelete.description}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={cancelDeleteMaterial}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteMaterial}
            color="error"
            variant="contained"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* Add/Edit Week Dialog */}
      <Dialog open={weekDialogOpen} onClose={() => setWeekDialogOpen(false)} maxWidth="md" fullWidth TransitionComponent={SafeDialogTransition}>
        <DialogTitle>
          {editingWeek ? 'Edit Week' : 'Add New Week'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Week Title"
                value={weekForm.title}
                onChange={(e) => setWeekForm({ ...weekForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={weekForm.description}
                onChange={(e) => setWeekForm({ ...weekForm, description: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Week Number"
                type="number"
                value={weekForm.weekNumber}
                onChange={(e) => setWeekForm({ ...weekForm, weekNumber: parseInt(e.target.value) })}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={weekForm.isPublished.toString()}
                  onChange={(e) => setWeekForm({ ...weekForm, isPublished: e.target.value === 'true' })}
                >
                  <MenuItem value="false">Draft</MenuItem>
                  <MenuItem value="true">Published</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={weekForm.startDate}
                onChange={(e) => setWeekForm({ ...weekForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={weekForm.endDate}
                onChange={(e) => setWeekForm({ ...weekForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWeekDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveWeek} variant="contained">
            {editingWeek ? 'Update' : 'Create'} Week
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Week Material Dialog */}
      <Dialog open={weekMaterialDialogOpen} onClose={() => setWeekMaterialDialogOpen(false)} maxWidth="md" fullWidth TransitionComponent={SafeDialogTransition}>
        <DialogTitle>
          {editingWeekMaterial ? 'Edit Material' : 'Add Material to Week'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Material Title"
                value={weekMaterialForm.title}
                onChange={(e) => setWeekMaterialForm({ ...weekMaterialForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={weekMaterialForm.description}
                onChange={(e) => setWeekMaterialForm({ ...weekMaterialForm, description: e.target.value })}
                multiline
                rows={3}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={weekMaterialForm.type}
                  onChange={(e) => setWeekMaterialForm({ ...weekMaterialForm, type: e.target.value as any })}
                >
                  <MenuItem value="document">Document</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                  <MenuItem value="audio">Audio</MenuItem>
                  <MenuItem value="link">Link</MenuItem>
                  <MenuItem value="quiz">Quiz</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Order"
                type="number"
                value={weekMaterialForm.order}
                onChange={(e) => setWeekMaterialForm({ ...weekMaterialForm, order: parseInt(e.target.value) })}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Estimated Duration (minutes)"
                type="number"
                value={weekMaterialForm.estimatedDuration}
                onChange={(e) => setWeekMaterialForm({ ...weekMaterialForm, estimatedDuration: parseInt(e.target.value) })}
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Required</InputLabel>
                <Select
                  value={weekMaterialForm.isRequired.toString()}
                  onChange={(e) => setWeekMaterialForm({ ...weekMaterialForm, isRequired: e.target.value === 'true' })}
                >
                  <MenuItem value="true">Required</MenuItem>
                  <MenuItem value="false">Optional</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL or File Path"
                value={weekMaterialForm.url}
                onChange={(e) => setWeekMaterialForm({ ...weekMaterialForm, url: e.target.value })}
                placeholder="Enter URL for videos/links or file path for documents"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWeekMaterialDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveWeekMaterial} variant="contained">
            {editingWeekMaterial ? 'Update' : 'Add'} Material
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Assignment Dialog */}
      <Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} maxWidth="md" fullWidth TransitionComponent={SafeDialogTransition}>
        <DialogTitle>
          {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Assignment Title"
              value={assignmentForm.title}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              value={assignmentForm.description}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Due Date"
                type="datetime-local"
                value={assignmentForm.dueDate}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
              
              <TextField
                fullWidth
                label="Points"
                type="number"
                value={assignmentForm.points}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                inputProps={{ min: 1 }}
                required
              />
            </Box>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Assignment Type</InputLabel>
              <Select
                value={assignmentForm.type}
                onChange={(e) => setAssignmentForm(prev => ({ ...prev, type: e.target.value }))}
                label="Assignment Type"
              >
                <MenuItem value="essay">Essay</MenuItem>
                <MenuItem value="project">Project</MenuItem>
                <MenuItem value="presentation">Presentation</MenuItem>
                <MenuItem value="research">Research Paper</MenuItem>
                <MenuItem value="portfolio">Portfolio</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Instructions"
              value={assignmentForm.instructions}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, instructions: e.target.value }))}
              margin="normal"
              multiline
              rows={4}
              placeholder="Provide detailed instructions for the assignment..."
            />
            
            <TextField
              fullWidth
              label="Rubric"
              value={assignmentForm.rubric}
              onChange={(e) => setAssignmentForm(prev => ({ ...prev, rubric: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
              placeholder="Describe the grading criteria..."
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Allow Late Submission</InputLabel>
                <Select
                  value={assignmentForm.allowLateSubmission.toString()}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, allowLateSubmission: e.target.value === 'true' }))}
                  label="Allow Late Submission"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
              
              {assignmentForm.allowLateSubmission && (
                <TextField
                  fullWidth
                  label="Late Penalty (%)"
                  type="number"
                  value={assignmentForm.latePenalty}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, latePenalty: parseInt(e.target.value) }))}
                  inputProps={{ min: 0, max: 100 }}
                />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignmentDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAssignment} 
            variant="contained"
            disabled={!assignmentForm.title || !assignmentForm.description || !assignmentForm.dueDate}
          >
            {editingAssignment ? 'Update' : 'Create'} Assignment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Assessment Dialog */}
      <Dialog open={assessmentDialogOpen} onClose={() => setAssessmentDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAssessment ? 'Edit Assessment' : 'Create New Assessment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Assessment Title"
              value={assessmentForm.title}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, title: e.target.value }))}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              value={assessmentForm.description}
              onChange={(e) => setAssessmentForm(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Due Date"
                type="datetime-local"
                value={assessmentForm.dueDate}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
              />
              
              <TextField
                fullWidth
                label="Points"
                type="number"
                value={assessmentForm.points}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                inputProps={{ min: 1 }}
                required
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Assessment Type</InputLabel>
                <Select
                  value={assessmentForm.type}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, type: e.target.value }))}
                  label="Assessment Type"
                >
                  <MenuItem value="quiz">Quiz</MenuItem>
                  <MenuItem value="exam">Exam</MenuItem>
                  <MenuItem value="test">Test</MenuItem>
                  <MenuItem value="midterm">Midterm</MenuItem>
                  <MenuItem value="final">Final Exam</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Time Limit (minutes)"
                type="number"
                value={assessmentForm.timeLimit}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                inputProps={{ min: 1 }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Passing Score (%)"
                type="number"
                value={assessmentForm.passingScore}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                inputProps={{ min: 0, max: 100 }}
              />
              
              <TextField
                fullWidth
                label="Attempts Allowed"
                type="number"
                value={assessmentForm.attempts}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, attempts: parseInt(e.target.value) }))}
                inputProps={{ min: 1 }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Randomize Questions</InputLabel>
                <Select
                  value={assessmentForm.randomizeQuestions.toString()}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, randomizeQuestions: e.target.value === 'true' }))}
                  label="Randomize Questions"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Show Results Immediately</InputLabel>
                <Select
                  value={assessmentForm.showResultsImmediately.toString()}
                  onChange={(e) => setAssessmentForm(prev => ({ ...prev, showResultsImmediately: e.target.value === 'true' }))}
                  label="Show Results Immediately"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Require Proctoring</InputLabel>
              <Select
                value={assessmentForm.requireProctoring.toString()}
                onChange={(e) => setAssessmentForm(prev => ({ ...prev, requireProctoring: e.target.value === 'true' }))}
                label="Require Proctoring"
              >
                <MenuItem value="true">Yes</MenuItem>
                <MenuItem value="false">No</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssessmentDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAssessment} 
            variant="contained"
            disabled={!assessmentForm.title || !assessmentForm.description || !assessmentForm.dueDate}
          >
            {editingAssessment ? 'Update' : 'Create'} Assessment
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Upload Exam File - {uploadingItem?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a PDF or Word document containing the exam questions. The system will automatically extract and process the content for students.
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <input
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<Upload />}
                  fullWidth
                  sx={{ 
                    py: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': {
                      borderStyle: 'dashed',
                      borderWidth: 2,
                    }
                  }}
                >
                  {uploadFile ? uploadFile.name : 'Choose File (PDF, DOC, DOCX)'}
                </Button>
              </label>
            </Box>

            {uploadFile && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Selected file: <strong>{uploadFile.name}</strong>
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Size: {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            )}

            {uploading && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Uploading and processing file...
                </Typography>
                <Box sx={{ width: '100%', bgcolor: 'grey.200', borderRadius: 1 }}>
                  <Box
                    sx={{
                      width: `${uploadProgress}%`,
                      height: 8,
                      bgcolor: 'primary.main',
                      borderRadius: 1,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  {uploadProgress}% complete
                </Typography>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Supported formats:</strong> PDF, DOC, DOCX<br/>
                <strong>Max file size:</strong> 10MB<br/>
                <strong>Processing:</strong> AI will extract questions and create an interactive exam
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUploadSubmit} 
            variant="contained"
            disabled={!uploadFile || uploading}
            startIcon={uploading ? <CircularProgress size={16} /> : <CloudUpload />}
          >
            {uploading ? 'Uploading...' : 'Upload & Process'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Announcement Dialog */}
      <Dialog open={announcementDialogOpen} onClose={() => setAnnouncementDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAnnouncement ? 'Edit Announcement' : 'Add New Announcement'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={announcementForm.title}
              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Content"
              value={announcementForm.content}
              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
              margin="normal"
              multiline
              rows={4}
              required
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={announcementForm.priority}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priority: e.target.value }))}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={announcementForm.isPublished}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, isPublished: e.target.value === 'true' }))}
                  label="Status"
                >
                  <MenuItem value="true">Published</MenuItem>
                  <MenuItem value="false">Draft</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <TextField
              fullWidth
              label="Scheduled Date (Optional)"
              type="datetime-local"
              value={announcementForm.scheduledDate}
              onChange={(e) => setAnnouncementForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnouncementDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAnnouncement} 
            variant="contained"
            disabled={!announcementForm.title || !announcementForm.content}
          >
            {editingAnnouncement ? 'Update' : 'Create'} Announcement
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add/Edit Live Session Dialog */}
      <Dialog open={sessionDialogOpen} onClose={() => setSessionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSession ? 'Edit Live Session' : 'Schedule New Live Session'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Session Title"
              value={sessionForm.title}
              onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
              margin="normal"
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              value={sessionForm.description}
              onChange={(e) => setSessionForm(prev => ({ ...prev, description: e.target.value }))}
              margin="normal"
              multiline
              rows={3}
              required
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Course</InputLabel>
              <Select
                value={sessionForm.courseId}
                onChange={(e) => setSessionForm(prev => ({ ...prev, courseId: e.target.value }))}
                label="Course"
              >
                {teacherCourses.map((course) => (
                  <MenuItem key={course._id} value={course._id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <TextField
                fullWidth
                label="Scheduled Time"
                type="datetime-local"
                value={sessionForm.scheduledTime}
                onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                required
                helperText="⚠️ Please choose a future date and time (not now) to avoid validation errors"
              />
              
              <TextField
                fullWidth
                label="Duration (minutes)"
                type="number"
                value={sessionForm.duration}
                onChange={(e) => setSessionForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                inputProps={{ min: 15, max: 480 }}
                required
              />
            </Box>
            
            <TextField
              fullWidth
              label="Max Participants"
              type="number"
              value={sessionForm.maxParticipants}
              onChange={(e) => setSessionForm(prev => ({ ...prev, maxParticipants: parseInt(e.target.value) }))}
              margin="normal"
              inputProps={{ min: 1, max: 1000 }}
              required
            />
            
            <TextField
              fullWidth
              label="Agenda (one item per line)"
              value={sessionForm.agenda}
              onChange={(e) => setSessionForm(prev => ({ ...prev, agenda: e.target.value }))}
              margin="normal"
              multiline
              rows={4}
              placeholder="Enter agenda items, one per line..."
            />
            
            <TextField
              fullWidth
              label="Zoom Fallback Link (Optional)"
              value={sessionForm.zoomFallbackLink}
              onChange={(e) => setSessionForm(prev => ({ ...prev, zoomFallbackLink: e.target.value }))}
              margin="normal"
              placeholder="https://zoom.us/j/123456789"
              helperText="Provide a Zoom link as backup if the main live session fails"
            />
            
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Recording Enabled</InputLabel>
                <Select
                  value={sessionForm.recordingEnabled.toString()}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, recordingEnabled: e.target.value === 'true' }))}
                  label="Recording Enabled"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Chat Enabled</InputLabel>
                <Select
                  value={sessionForm.chatEnabled.toString()}
                  onChange={(e) => setSessionForm(prev => ({ ...prev, chatEnabled: e.target.value === 'true' }))}
                  label="Chat Enabled"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSessionDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveSession} 
            variant="contained"
            disabled={!sessionForm.title || !sessionForm.description || !sessionForm.scheduledTime}
          >
            {editingSession ? 'Update' : 'Schedule'} Session
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseManagement;
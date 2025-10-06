import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  MenuBook,
  Lock,
  CheckCircle,
  PlayArrow,
  Download,
  Bookmark,
  BookmarkBorder,
  ArrowBack,
  Timer,
  VolumeUp,
  School,
  Assignment,
  Quiz,
  VideoLibrary
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import EnhancedNotesViewer from '../../components/Notes/EnhancedNotesViewer';
import CourseEnrollmentDialog from '../../components/Course/CourseEnrollmentDialog';

interface CourseNote {
  _id: string;
  title: string;
  description?: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'file';
    estimatedReadTime?: number;
  }>;
  timerEnabled: boolean;
  recommendedStudyTime: number;
  breakInterval?: number;
  audioSettings: {
    defaultLanguage: string;
    defaultSpeed: number;
    enableAutoPlay: boolean;
  };
  uploadedAt: string;
  instructor: {
    firstName: string;
    lastName: string;
  };
}

interface Course {
  _id: string;
  title: string;
  description: string;
  instructor: {
    firstName: string;
    lastName: string;
  };
  category: string;
  level: string;
  duration: number;
  notesPrice: number;
  liveSessionPrice: number;
  enrollmentDeadline: string;
  courseStartDate: string;
  rating: number;
  enrollmentCount: number;
  maxEnrollments?: number;
}

interface Enrollment {
  enrollmentType: 'notes' | 'live_sessions' | 'both';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  accessPermissions: {
    canAccessNotes: boolean;
    canAccessLiveSessions: boolean;
    canDownloadMaterials: boolean;
  };
  progress: {
    completedLessons: string[];
    totalProgress: number;
  };
}

const CourseNotes: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [notes, setNotes] = useState<CourseNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<CourseNote | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkedNotes, setBookmarkedNotes] = useState<string[]>([]);
  const [showEnrollmentDialog, setShowEnrollmentDialog] = useState(false);

  // Load course and check access
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return;

      try {
        setLoading(true);

        // Load course details
        const courseResponse = await fetch(`/api/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!courseResponse.ok) {
          throw new Error('Failed to load course');
        }

        const courseData = await courseResponse.json();
        setCourse(courseData.data.course);

        // Check enrollment and access
        const accessResponse = await fetch(`/api/enrollments/courses/${courseId}/access?accessType=notes`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (accessResponse.ok) {
          const accessData = await accessResponse.json();
          setHasAccess(accessData.data.hasAccess);
          setEnrollment(accessData.data.enrollment);

          // If has access, load notes
          if (accessData.data.hasAccess) {
            await loadCourseNotes();
          }
        }

      } catch (err: any) {
        console.error('Error loading course data:', err);
        setError(err.message || 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  const loadCourseNotes = async () => {
    if (!courseId) return;

    try {
      const response = await fetch(`/api/courses/${courseId}/notes`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotes(data.data.notes || []);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
    }
  };

  const handleNoteComplete = async () => {
    if (!selectedNote || !courseId) return;

    try {
      await fetch(`/api/enrollments/courses/${courseId}/progress`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          itemId: selectedNote._id,
          itemType: 'lesson'
        })
      });

      // Update local progress
      if (enrollment) {
        setEnrollment({
          ...enrollment,
          progress: {
            ...enrollment.progress,
            completedLessons: [...enrollment.progress.completedLessons, selectedNote._id]
          }
        });
      }
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const handleBookmark = async (noteId: string) => {
    // Toggle bookmark locally
    setBookmarkedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );

    // TODO: Save to backend
  };

  const handleEnroll = async (courseId: string, enrollmentType: 'notes' | 'live_sessions' | 'both', amount: number) => {
    try {
      const response = await fetch(`/api/enrollments/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          enrollmentType,
          paymentMethod: 'mobile_money'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (amount === 0) {
          // Free course - reload page to show content
          window.location.reload();
        } else {
          // Paid course - redirect to payment
          // TODO: Integrate with payment gateway
          alert('Payment integration coming soon!');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to enroll');
      }
    } catch (err: any) {
      console.error('Enrollment error:', err);
      alert(err.message || 'Failed to enroll in course');
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Course not found</Alert>
      </Container>
    );
  }

  // If viewing a specific note
  if (selectedNote) {
    return (
      <Box>
        <Container maxWidth="lg" sx={{ mt: 2, mb: 2 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => setSelectedNote(null)}
            sx={{ mb: 2 }}
          >
            Back to Notes List
          </Button>
        </Container>
        <EnhancedNotesViewer
          notes={selectedNote}
          onComplete={handleNoteComplete}
          onBookmark={(sectionId) => handleBookmark(selectedNote._id)}
          bookmarkedSections={bookmarkedNotes}
        />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Course Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Typography variant="h4" gutterBottom>
            {course.title}
          </Typography>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/courses')}
          >
            Back to Courses
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          {course.description}
        </Typography>

        <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
          <Chip
            icon={<School />}
            label={`${course.instructor.firstName} ${course.instructor.lastName}`}
            variant="outlined"
          />
          <Chip label={course.category} color="primary" variant="outlined" />
          <Chip label={course.level} color="secondary" variant="outlined" />
          <Chip
            icon={<Timer />}
            label={`${course.duration} hours`}
            variant="outlined"
          />
        </Box>
      </Paper>

      {/* Access Status */}
      {!hasAccess ? (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={() => setShowEnrollmentDialog(true)}
            >
              Enroll Now
            </Button>
          }
        >
          <Typography variant="body1">
            You need to enroll in this course to access the notes and materials.
          </Typography>
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body1">
            ✅ You have access to course notes and materials. 
            Progress: {enrollment?.progress.totalProgress || 0}% complete
          </Typography>
        </Alert>
      )}

      {/* Notes List */}
      {hasAccess && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MenuBook color="primary" />
              Course Notes & Materials
            </Typography>
          </Grid>

          {notes.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <MenuBook sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No notes available yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The instructor hasn't uploaded any notes for this course yet.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            notes.map((note, index) => {
              const isCompleted = enrollment?.progress.completedLessons.includes(note._id);
              const isBookmarked = bookmarkedNotes.includes(note._id);

              return (
                <Grid item xs={12} md={6} lg={4} key={note._id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={() => setSelectedNote(note)}
                  >
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                        <Chip
                          label={`Lesson ${index + 1}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Box display="flex" gap={0.5}>
                          <Tooltip title={isBookmarked ? "Remove bookmark" : "Add bookmark"}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBookmark(note._id);
                              }}
                              color={isBookmarked ? "primary" : "default"}
                            >
                              {isBookmarked ? <Bookmark /> : <BookmarkBorder />}
                            </IconButton>
                          </Tooltip>
                          {isCompleted && (
                            <Tooltip title="Completed">
                              <CheckCircle color="success" />
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                      <Typography variant="h6" gutterBottom>
                        {note.title}
                      </Typography>

                      {note.description && (
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {note.description}
                        </Typography>
                      )}

                      <Box display="flex" alignItems="center" gap={2} mb={2}>
                        {note.timerEnabled && (
                          <Chip
                            icon={<Timer />}
                            label={`${note.recommendedStudyTime} min`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        <Chip
                          icon={<VolumeUp />}
                          label="Audio Available"
                          size="small"
                          color="secondary"
                          variant="outlined"
                        />
                        <Chip
                          label={`${note.sections.length} sections`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="caption" color="text.secondary">
                        Uploaded: {new Date(note.uploadedAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}

      {/* Enrollment Dialog */}
      <CourseEnrollmentDialog
        open={showEnrollmentDialog}
        course={course}
        onClose={() => setShowEnrollmentDialog(false)}
        onEnroll={handleEnroll}
      />
    </Container>
  );
};

export default CourseNotes;
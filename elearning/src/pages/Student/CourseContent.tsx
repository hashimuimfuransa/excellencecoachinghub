import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  CircularProgress,
  Chip,
  Avatar,
  Paper,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material';
import {
  ArrowBack,
  Note,
  VideoLibrary,
  Assignment,
  Quiz,
  Schedule,
  Person,
  ExpandMore,
  PlayArrow,
  Download,
  CheckCircle,
  RadioButtonUnchecked,
  MenuBook,
  School
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { courseContentService, ICourseContent } from '../../services/courseContentService';
import { enrollmentService } from '../../services/enrollmentService';
import { progressService } from '../../services/progressService';
import { liveSessionService, ILiveSession } from '../../services/liveSessionService';
import FloatingAIAssistant from '../../components/FloatingAIAssistant';

const CourseContent: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [course, setCourse] = useState<ICourse | null>(null);
  const [courseContent, setCourseContent] = useState<ICourseContent[]>([]);
  const [liveSessions, setLiveSessions] = useState<ILiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [expandedContent, setExpandedContent] = useState<string | false>(false);
  const [enrollmentDetails, setEnrollmentDetails] = useState<any>(null);
  const [completedContent, setCompletedContent] = useState<Set<string>>(new Set());

  // Load course and content
  useEffect(() => {
    const loadCourseData = async () => {
      if (!user) {
        setError('Please log in to access course content');
        setLoading(false);
        return;
      }

      // If no course ID is provided, show course selection
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Loading course data for ID:', id);

        // Load course details
        const courseData = await courseService.getPublicCourseById(id);
        console.log('Course data loaded:', courseData);
        setCourse(courseData);

        // Check if student is enrolled
        if (user.role === 'student') {
          console.log('Checking enrollment for student:', user._id || user.email);
          try {
            const enrollmentData = await enrollmentService.getEnrollmentDetailsQuietly(id);
            console.log('Enrollment data:', enrollmentData);
            const enrolled = !!enrollmentData;
            setIsEnrolled(enrolled);
            setEnrollmentDetails(enrollmentData);

            // If enrolled, load course content and progress
            if (enrolled) {
              console.log('Student is enrolled, loading course content and progress...');
              try {
                // Load course content
                const contentData = await courseContentService.getCourseContent(id);
                console.log('Course content loaded:', contentData);
                if (contentData && contentData.content) {
                  setCourseContent(contentData.content.sort((a, b) => a.order - b.order));
                } else {
                  setCourseContent([]);
                }

                // Load existing progress
                try {
                  const progressData = await progressService.getCourseProgressQuietly(id);
                  if (progressData) {
                    console.log('Progress data loaded:', progressData);
                    setCompletedContent(new Set(progressData.completedLessons));
                  }
                } catch (progressError: any) {
                  console.warn('Progress loading failed:', progressError);
                  // Progress might not exist yet - this is okay
                }
              } catch (contentError: any) {
                console.warn('Course content loading failed:', contentError);
                // Content might not exist yet - this is okay
                setCourseContent([]);
              }
            } else {
              console.log('Student is not enrolled in this course');
            }
          } catch (enrollmentError: any) {
            console.error('Enrollment check failed:', enrollmentError);
            setIsEnrolled(false);
            setError('Unable to verify enrollment status. Please try refreshing the page.');
          }
        } else {
          // Non-students can't access course content
          setError('Only enrolled students can access course content');
        }
      } catch (err: any) {
        console.error('Course data loading failed:', err);
        setError(err.message || 'Failed to load course data. Please check if the course exists.');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [id, user]);

  // Handle content expansion
  const handleContentExpand = (contentId: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedContent(isExpanded ? contentId : false);
  };

  // Mark content as completed
  const markContentCompleted = async (contentId: string) => {
    if (!id) return;

    try {
      // Add to local state immediately for better UX
      setCompletedContent(prev => new Set(Array.from(prev).concat(contentId)));

      // Send to backend to track progress
      console.log('Marking content as completed:', contentId);
      const progressData = await progressService.markContentCompleted(id, contentId);

      // Update local state with backend response
      setCompletedContent(new Set(progressData.completedLessons));

      console.log('Content marked as completed successfully:', progressData);
    } catch (error) {
      console.error('Failed to mark content as completed:', error);
      // Remove from local state if backend call fails
      setCompletedContent(prev => {
        const newArray = Array.from(prev).filter(id => id !== contentId);
        return new Set(newArray);
      });
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    if (courseContent.length === 0) return 0;
    return Math.round((completedContent.size / courseContent.length) * 100);
  };

  // Get content type icon
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoLibrary color="primary" />;
      case 'document':
        return <Note color="primary" />;
      case 'assignment':
        return <Assignment color="primary" />;
      case 'quiz':
        return <Quiz color="primary" />;
      default:
        return <Note color="primary" />;
    }
  };

  // Format content type display
  const getContentTypeDisplay = (type: string) => {
    switch (type) {
      case 'video':
        return 'Video';
      case 'document':
        return 'Reading Material';
      case 'assignment':
        return 'Assignment';
      case 'quiz':
        return 'Quiz';
      case 'live_session':
        return 'Recorded Session';
      default:
        return type;
    }
  };

  // If no course ID is provided, show course selection
  if (!id) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <MenuBook sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Course Content
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Select a course to view its content and materials.
          </Typography>
          <Button
            variant="contained"
            startIcon={<School />}
            onClick={() => navigate('/dashboard/student/courses')}
          >
            Browse My Courses
          </Button>
        </Box>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !course) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Course not found'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/dashboard/student/courses')}
          variant="outlined"
        >
          Back to Courses
        </Button>
      </Container>
    );
  }

  if (!isEnrolled) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info" sx={{ mb: 3 }}>
          You need to be enrolled in this course to access the content.
        </Alert>
        <Button
          onClick={() => navigate(`/courses/${id}`)}
          variant="contained"
        >
          View Course Details
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
          onClick={() => navigate('/dashboard/student/courses')}
          sx={{ mb: 2 }}
        >
          Back to My Courses
        </Button>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
              <Avatar
                sx={{ width: 60, height: 60 }}
              >
                <Person />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" gutterBottom>
                  {course.title}
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {course.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Chip label={course.category} variant="outlined" />
                  <Chip label={course.level} variant="outlined" />
                  <Chip
                    label={`${courseContent.length} lessons`}
                    variant="outlined"
                    color="primary"
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule fontSize="small" />
                    <Typography variant="body2">{course.duration}h</Typography>
                  </Box>
                </Box>

                {/* Progress Information */}
                {enrollmentDetails && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Your Progress: {getProgressPercentage()}% Complete ({completedContent.size}/{courseContent.length} lessons)
                    </Typography>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <Box
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.300',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        <Box
                          sx={{
                            height: '100%',
                            borderRadius: 4,
                            backgroundColor: 'primary.main',
                            width: `${getProgressPercentage()}%`,
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Enrolled: {new Date(enrollmentDetails.enrollmentDate || enrollmentDetails.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Course Content */}
      <Typography variant="h5" gutterBottom>
        Course Content
      </Typography>

      {courseContent.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Note sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No content available yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your instructor hasn't added any content to this course yet. Check back later!
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ mb: 4 }}>
          {courseContent.map((content, index) => (
            <Accordion
              key={content._id}
              expanded={expandedContent === content._id}
              onChange={handleContentExpand(content._id || '')}
              sx={{ mb: 1 }}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls={`content-${content._id}-content`}
                id={`content-${content._id}-header`}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getContentIcon(content.type)}
                    <Typography variant="h6">
                      {index + 1}. {content.title}
                    </Typography>
                  </Box>
                  <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                    {completedContent.has(content._id || '') && (
                      <Chip
                        label="Completed"
                        size="small"
                        color="success"
                        variant="filled"
                        icon={<CheckCircle />}
                      />
                    )}
                    <Chip
                      label={getContentTypeDisplay(content.type)}
                      size="small"
                      variant="outlined"
                    />
                    {content.duration && (
                      <Chip
                        label={`${content.duration} min`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                    {content.isRequired && (
                      <Chip
                        label="Required"
                        size="small"
                        color="primary"
                      />
                    )}
                  </Box>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ pl: 5 }}>
                  {content.type === 'document' && content.content && (
                    <Box>
                      <Typography variant="body1" paragraph>
                        {content.content}
                      </Typography>
                    </Box>
                  )}

                  {content.type === 'video' && (
                    <Box>
                      {content.videoUrl ? (
                        <Box sx={{ mb: 2 }}>
                          <video
                            controls
                            style={{ width: '100%', maxWidth: '800px', height: 'auto' }}
                            src={content.videoUrl}
                          >
                            Your browser does not support the video tag.
                          </video>
                        </Box>
                      ) : (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          Video content will be available soon.
                        </Alert>
                      )}
                    </Box>
                  )}

                  {content.type === 'assignment' && content.content && (
                    <Box>
                      {(() => {
                        try {
                          const assignmentData = JSON.parse(content.content);
                          return (
                            <Box>
                              <Typography variant="body1" paragraph>
                                {assignmentData.description}
                              </Typography>
                              {assignmentData.dueDate && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                  <strong>Due Date:</strong> {new Date(assignmentData.dueDate).toLocaleDateString()}
                                </Alert>
                              )}
                              <Button
                                variant="contained"
                                startIcon={<Assignment />}
                                sx={{ mt: 2 }}
                              >
                                Submit Assignment
                              </Button>
                            </Box>
                          );
                        } catch {
                          return (
                            <Typography variant="body1">
                              Assignment details will be available soon.
                            </Typography>
                          );
                        }
                      })()}
                    </Box>
                  )}

                  {content.type === 'quiz' && (
                    <Box>
                      <Typography variant="body1" paragraph>
                        Quiz: {content.title}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Quiz />}
                        color="primary"
                      >
                        Take Quiz
                      </Button>
                    </Box>
                  )}

                  {content.type === 'live_session' && content.videoUrl && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" paragraph>
                        📹 This is a recorded live session from your instructor.
                      </Typography>
                      <Box
                        sx={{
                          position: 'relative',
                          paddingBottom: '56.25%', // 16:9 aspect ratio
                          height: 0,
                          overflow: 'hidden',
                          borderRadius: 2,
                          backgroundColor: 'black'
                        }}
                      >
                        <video
                          controls
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%'
                          }}
                          src={content.videoUrl}
                        >
                          Your browser does not support the video tag.
                        </video>
                      </Box>
                      {content.duration && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Duration: {content.duration} minutes
                        </Typography>
                      )}
                    </Box>
                  )}

                  {content.fileUrl && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        href={content.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download Resource
                      </Button>
                    </Box>
                  )}

                  {/* Completion Button */}
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      {!completedContent.has(content._id || '') ? (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircle />}
                          onClick={() => markContentCompleted(content._id || '')}
                        >
                          Mark as Complete
                        </Button>
                      ) : (
                        <Chip
                          label="Completed"
                          color="success"
                          variant="filled"
                          icon={<CheckCircle />}
                        />
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary">
                      Added: {new Date(content.createdAt || '').toLocaleDateString()}
                      {content.updatedAt && content.updatedAt !== content.createdAt && (
                        <> • Updated: {new Date(content.updatedAt).toLocaleDateString()}</>
                      )}
                    </Typography>
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* Course Progress Summary */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Learning Progress Summary
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Overall Progress</Typography>
              <Typography variant="body2" fontWeight="bold">
                {getProgressPercentage()}%
              </Typography>
            </Box>
            <Box
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: 'grey.300',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  borderRadius: 4,
                  backgroundColor: 'primary.main',
                  width: `${getProgressPercentage()}%`,
                  transition: 'width 0.3s ease'
                }}
              />
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" fontWeight="bold">
                {completedContent.size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="text.secondary" fontWeight="bold">
                {courseContent.length - completedContent.size}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Remaining
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {courseContent.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Lessons
              </Typography>
            </Box>
          </Box>

          {getProgressPercentage() === 100 && (
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'success.light', borderRadius: 2 }}>
              <Typography variant="body1" color="success.dark" fontWeight="bold">
                🎉 Congratulations! You've completed all lessons in this course!
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Context-aware AI Assistant for course content */}
      <FloatingAIAssistant
        context={{
          page: 'course-content',
          courseId: course?._id,
          courseTitle: course?.title,
          courseCategory: course?.category,
          content: courseContent.length > 0
            ? courseContent.map(c => `${c.title} (${c.type}): ${c.content || 'Content available'}`).join('\n\n')
            : 'No course content available yet. Please check back after course materials are added.',
          hasContent: courseContent.length > 0,
          contentSummary: courseContent.length > 0
            ? `Course: ${course?.title}\nTopics: ${courseContent.map(c => c.title).join(', ')}\nTotal lessons: ${courseContent.length}`
            : 'No content available'
        }}
      />
    </Container>
  );
};

export default CourseContent;
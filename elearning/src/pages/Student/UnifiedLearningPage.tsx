import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ArrowBack,
  PlayArrow,
  CheckCircle,
  Description,
  VideoFile,
  AudioFile,
  Image,
  Quiz,
  Assignment,
  School,
  Timer,
  Lock,
  LockOpen
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { courseService, ICourse } from '../../services/courseService';
import { weekService, Week, WeekMaterial } from '../../services/weekService';
import api from '../../services/api';

// Interface for the actual backend response
interface CourseProgressResponse {
  weekProgresses: any[];
  materialProgresses: any[];
}

const UnifiedLearningPage: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [course, setCourse] = useState<ICourse | null>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [progress, setProgress] = useState<CourseProgressResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) {
        setError('No course ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Load course, weeks, and progress in parallel
        const [courseData, weeksData, progressResponse] = await Promise.all([
          courseService.getCourseById(courseId),
          weekService.getCourseWeeks(courseId),
          api.get(`/progress/courses/${courseId}/progress`).catch((error) => {
            console.warn('Progress API failed, using empty progress:', error);
            return { data: { data: { weekProgresses: [], materialProgresses: [] } } };
          })
        ]);
        
        setCourse(courseData);
        setWeeks(weeksData);
        setProgress(progressResponse.data.data || { weekProgresses: [], materialProgresses: [] });
      } catch (err: any) {
        console.error('Error loading course data:', err);
        setError(err.message || 'Failed to load course data');
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  const handleBack = () => {
    navigate('/dashboard/student/courses');
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <Description />;
      case 'video':
        return <VideoFile />;
      case 'audio':
        return <AudioFile />;
      case 'quiz':
        return <Quiz />;
      case 'assignment':
        return <Assignment />;
      default:
        return <Description />;
    }
  };

  const isMaterialCompleted = (materialId: string) => {
    return progress?.materialProgresses?.some((mp: any) => mp.materialId === materialId && mp.status === 'completed') || false;
  };

  const getWeekProgress = (weekId: string) => {
    // For now, return a simple calculation based on completed materials
    const week = weeks.find(w => w._id === weekId);
    if (!week) return 0;
    
    // Only count published materials
    const publishedMaterials = week.materials.filter(mat => mat.isPublished);
    const completedMaterials = publishedMaterials.filter(mat => isMaterialCompleted(mat._id));
    return publishedMaterials.length > 0 ? (completedMaterials.length / publishedMaterials.length) * 100 : 0;
  };

  const handleMaterialClick = (material: WeekMaterial) => {
    navigate(`/dashboard/student/course/${courseId}/materials/${material._id}`);
  };

  const handleMarkComplete = async (weekId: string, materialId: string) => {
    try {
      await api.post(`/progress/weeks/${weekId}/materials/${materialId}/complete`, { timeSpent: 5 });
      // Refresh progress data
      const progressResponse = await api.get(`/progress/courses/${courseId}/progress`);
      setProgress(progressResponse.data.data || { weekProgresses: [], materialProgresses: [] });
    } catch (err) {
      console.error('Error marking material complete:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Please log in to access this course.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading course...
            </Typography>
        </Container>
    );
  }

  if (error) {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Back to Courses
        </Button>
        </Container>
    );
  }

  if (!course) {
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Course not found.
          </Alert>
        <Button startIcon={<ArrowBack />} onClick={handleBack}>
          Back to Courses
        </Button>
        </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBack />} onClick={handleBack} sx={{ mb: 2 }}>
          Back to Courses
        </Button>
        
        {/* Course Header */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <Typography variant="h4" gutterBottom>
                {course.title}
              </Typography>
          <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
                {course.description}
              </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
              icon={<School />} 
              label={`${weeks.length} Weeks`} 
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} 
                />
            <Chip 
              icon={<Timer />} 
              label={`${weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).reduce((sum, mat) => sum + mat.estimatedDuration, 0), 0)} min total`} 
              sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' }} 
            />
          </Box>
        </Paper>

        {/* Course Progress Overview */}
        {progress && (
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
                    Course Progress
                  </Typography>
            <LinearProgress 
              variant="determinate" 
              value={progress.materialProgresses?.length > 0 ? 
                (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length / 
                 weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0} 
              sx={{ height: 8, borderRadius: 4, mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {Math.round(progress.materialProgresses?.length > 0 ? 
                (progress.materialProgresses.filter((mp: any) => mp.status === 'completed').length / 
                 weeks.reduce((total, week) => total + week.materials.filter(mat => mat.isPublished).length, 0)) * 100 : 0)}% Complete
            </Typography>
          </Paper>
        )}

        {/* Weeks and Materials */}
        {weeks.length === 0 ? (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No course content available yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
              The instructor hasn't added any materials to this course.
                  </Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {weeks.map((week, index) => (
              <Grid item xs={12} key={week._id}>
                <Card elevation={2}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          Week {week.weekNumber}: {week.title}
                  </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {week.description}
                  </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          <Chip 
                            label={`${week.materials.filter(mat => mat.isPublished).length} Published Materials`} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                          <Chip 
                            label={`${week.materials.filter(mat => mat.isPublished).reduce((sum, mat) => sum + mat.estimatedDuration, 0)} min`} 
                            size="small" 
                            color="secondary" 
                            variant="outlined" 
                          />
                          {week.isPublished ? (
                            <Chip label="Published" size="small" color="success" />
                          ) : (
                            <Chip label="Draft" size="small" color="warning" />
                          )}
                        </Box>
                </Box>
                      <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" color="text.secondary">
                          Progress
                          </Typography>
                            <LinearProgress
                              variant="determinate"
                          value={getWeekProgress(week._id)} 
                          sx={{ width: 100, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                          {Math.round(getWeekProgress(week._id))}%
                            </Typography>
                          </Box>
                    </Box>
                    
                    {/* Materials List */}
                    {week.materials.filter(mat => mat.isPublished).length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {week.materials.length === 0 ? 'No materials added to this week yet.' : 'No published materials available yet.'}
                      </Typography>
                    ) : (
                      <List>
                        {week.materials.filter(mat => mat.isPublished).map((material, matIndex) => {
                          const isCompleted = isMaterialCompleted(material._id);
                          return (
                            <React.Fragment key={material._id}>
                            <ListItem
                              sx={{
                                  backgroundColor: isCompleted ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                                  borderRadius: 1,
                                  mb: 1,
                                  border: isCompleted ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid transparent',
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                }
                              }}
                                onClick={() => handleMaterialClick(material)}
                            >
                              <ListItemIcon>
                                  {isCompleted ? (
                                  <CheckCircle color="success" />
                                ) : (
                                    getMaterialIcon(material.type)
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="subtitle1">
                                        {material.title}
                                    </Typography>
                                      {material.isRequired && (
                                        <Chip label="Required" size="small" color="error" />
                                      )}
                                      {isCompleted && (
                                        <Chip label="Completed" size="small" color="success" />
                                      )}
                                    </Box>
                                }
                                secondary={
                                    <Box>
                                      <Typography variant="body2" color="text.secondary">
                                        {material.description}
                                    </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                        <Chip label={material.type} size="small" variant="outlined" />
                                    <Chip
                                          icon={<Timer />} 
                                          label={`${material.estimatedDuration} min`} 
                                      size="small"
                                          variant="outlined" 
                                        />
                                      </Box>
                                    </Box>
                                  }
                                />
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Tooltip title="View Material">
                                    <IconButton size="small">
                                      <PlayArrow />
                                    </IconButton>
                                  </Tooltip>
                                  {!isCompleted && (
                                    <Tooltip title="Mark as Complete">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                          handleMarkComplete(week._id, material._id);
                                  }}
                                >
                                        <CheckCircle />
                                </IconButton>
                                    </Tooltip>
                    )}
                  </Box>
                              </ListItem>
                              {matIndex < week.materials.filter(mat => mat.isPublished).length - 1 && <Divider />}
                            </React.Fragment>
                          );
                        })}
                      </List>
                    )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </Box>
      </Container>
  );
};

export default UnifiedLearningPage;
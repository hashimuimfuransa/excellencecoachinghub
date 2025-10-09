import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Paper,
  Divider,
  Badge,
  Tooltip,
  Fab
} from '@mui/material';
import {
  PlayArrow,
  CheckCircle,
  Lock,
  Schedule,
  Assignment,
  Quiz,
  VideoFile,
  Description,
  Link,
  VolumeUp,
  ExpandMore,
  ExpandLess,
  Star,
  TrendingUp,
  School,
  Timer,
  Grade,
  Bookmark,
  Share,
  Download
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { courseService } from '../../services/courseService';
import { weekService, Week, WeekMaterial } from '../../services/weekService';
import { progressService, WeekProgress, StudentProgress } from '../../services/progressService';
import CourseMaterials from '../../components/CourseMaterials/CourseMaterials';

interface CourseProgress {
  weekProgresses: WeekProgress[];
  materialProgresses: StudentProgress[];
}

const StudentCourseView: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // State
  const [courseData, setCourseData] = useState<any>(null);
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [progress, setProgress] = useState<CourseProgress>({ weekProgresses: [], materialProgresses: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);

  // Load course data
  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load course and weeks in parallel
      const [course, weeksData, progressData] = await Promise.all([
        courseService.getCourseById(courseId!),
        weekService.getCourseWeeks(courseId!),
        progressService.getStudentCourseProgress(courseId!)
      ]);

      setCourseData(course);
      setWeeks(weeksData.filter(week => week.isPublished)); // Only show published weeks
      setProgress(progressData);
    } catch (err: any) {
      console.error('Error loading course data:', err);
      setError(err.message || 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getWeekProgress = (weekId: string): WeekProgress | undefined => {
    return progress.weekProgresses.find(wp => wp.weekId === weekId);
  };

  const getMaterialProgress = (weekId: string, materialId: string): StudentProgress | undefined => {
    return progress.materialProgresses.find(mp => mp.weekId === weekId && mp.materialId === materialId);
  };

  const isMaterialCompleted = (weekId: string, materialId: string): boolean => {
    const materialProgress = getMaterialProgress(weekId, materialId);
    return materialProgress?.status === 'completed';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document': return <Description />;
      case 'video': return <VideoFile />;
      case 'audio': return <VolumeUp />;
      case 'link': return <Link />;
      case 'quiz': return <Quiz />;
      default: return <Description />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'success';
    if (percentage >= 50) return 'warning';
    return 'primary';
  };

  const handleMaterialClick = (week: Week, material: WeekMaterial) => {
    navigate(`/dashboard/student/course/${courseId}/materials/${material._id}`);
  };

  const handleMarkComplete = async (week: Week, material: WeekMaterial) => {
    try {
      await progressService.markMaterialCompleted(week._id, material._id, material.estimatedDuration);
      // Refresh progress data
      const progressData = await progressService.getStudentCourseProgress(courseId!);
      setProgress(progressData);
    } catch (err: any) {
      console.error('Error marking material complete:', err);
      setError(err.message || 'Failed to mark material complete');
    }
  };

  const handleQuizClick = (quizId: string) => {
    navigate(`/dashboard/student/quiz/${quizId}`);
  };

  const handleCertificateClick = (certificateId: string) => {
    navigate(`/dashboard/student/certificate/${certificateId}`);
  };

  const handleWeekToggle = (weekId: string) => {
    setExpandedWeek(expandedWeek === weekId ? null : weekId);
  };

  const getOverallProgress = () => {
    if (progress.weekProgresses.length === 0) return 0;
    const totalProgress = progress.weekProgresses.reduce((sum, wp) => sum + wp.progressPercentage, 0);
    return Math.round(totalProgress / progress.weekProgresses.length);
  };

  const getCompletedWeeks = () => {
    return progress.weekProgresses.filter(wp => wp.weekCompleted).length;
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadCourseData}>
          Retry
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Course Header */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {courseData?.title}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                {courseData?.description}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<School />} 
                  label={`${weeks.length} Weeks`} 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: 'white' }}
                />
                <Chip 
                  icon={<TrendingUp />} 
                  label={`${getOverallProgress()}% Complete`} 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: 'white' }}
                />
                <Chip 
                  icon={<CheckCircle />} 
                  label={`${getCompletedWeeks()} Weeks Completed`} 
                  variant="outlined" 
                  sx={{ color: 'white', borderColor: 'white' }}
                />
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton sx={{ color: 'white' }}>
                <Bookmark />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Share />
              </IconButton>
            </Box>
          </Box>

          {/* Overall Progress */}
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">Overall Progress</Typography>
              <Typography variant="body2">{getOverallProgress()}%</Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={getOverallProgress()} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white'
                }
              }} 
            />
          </Box>
        </CardContent>
      </Card>

      {/* Course Weeks */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Course Curriculum
      </Typography>

      <Grid container spacing={3}>
        {weeks.map((week, index) => {
          const weekProgress = getWeekProgress(week._id);
          const isExpanded = expandedWeek === week._id;
          const isWeekCompleted = weekProgress?.weekCompleted || false;
          const isWeekLocked = index > 0 && !getWeekProgress(weeks[index - 1]._id)?.weekCompleted;

          return (
            <Grid item xs={12} key={week._id}>
              <Card 
                sx={{ 
                  border: isWeekCompleted ? '2px solid #4caf50' : '1px solid #e0e0e0',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <CardContent>
                  {/* Week Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                      <Avatar 
                        sx={{ 
                          bgcolor: isWeekCompleted ? 'success.main' : isWeekLocked ? 'grey.400' : 'primary.main',
                          width: 48,
                          height: 48
                        }}
                      >
                        {isWeekCompleted ? <CheckCircle /> : isWeekLocked ? <Lock /> : index + 1}
                      </Avatar>
                      
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom>
                          Week {week.weekNumber}: {week.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          {week.description}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                          <Chip 
                            icon={<Schedule />} 
                            label={`${new Date(week.startDate).toLocaleDateString()} - ${new Date(week.endDate).toLocaleDateString()}`} 
                            size="small" 
                            variant="outlined" 
                          />
                          <Chip 
                            icon={<Description />} 
                            label={`${week.materials.length} Materials`} 
                            size="small" 
                            variant="outlined" 
                          />
                          {week.assessment && (
                            <Chip 
                              icon={<Quiz />} 
                              label="Assessment" 
                              size="small" 
                              color="secondary" 
                              variant="outlined" 
                            />
                          )}
                          {week.assignment && (
                            <Chip 
                              icon={<Assignment />} 
                              label="Assignment" 
                              size="small" 
                              color="info" 
                              variant="outlined" 
                            />
                          )}
                        </Box>

                        {/* Week Progress */}
                        {weekProgress && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Progress</Typography>
                              <Typography variant="body2">{weekProgress.progressPercentage}%</Typography>
                            </Box>
                            <LinearProgress 
                              variant="determinate" 
                              value={weekProgress.progressPercentage} 
                              color={getProgressColor(weekProgress.progressPercentage)}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </Box>
                        )}
                      </Box>
                    </Box>

                    <IconButton 
                      onClick={() => handleWeekToggle(week._id)}
                      disabled={isWeekLocked}
                    >
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  {/* Week Materials */}
                  {isExpanded && (
                    <Box sx={{ mt: 2 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="subtitle1" gutterBottom>
                        Materials ({week.materials.length})
                      </Typography>
                      
                      <CourseMaterials
                        materials={week.materials}
                        onMaterialComplete={(materialId) => handleMarkComplete(week, week.materials.find(m => m._id === materialId)!)}
                        isCompleted={(materialId) => isMaterialCompleted(week._id, materialId)}
                        showCompletionActions={true}
                        onQuizClick={handleQuizClick}
                        onCertificateClick={handleCertificateClick}
                      />

                      {/* Week Assessment/Assignment */}
                      {(week.assessment || week.assignment) && (
                        <Box sx={{ mt: 3 }}>
                          <Divider sx={{ mb: 2 }} />
                          <Typography variant="subtitle1" gutterBottom>
                            Week Assessment
                          </Typography>
                          
                          <Grid container spacing={2}>
                            {week.assessment && (
                              <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                  <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <Quiz color="secondary" />
                                      <Typography variant="subtitle2">Assessment</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                      Complete this assessment to finish the week
                                    </Typography>
                                    <Button 
                                      variant="contained" 
                                      color="secondary" 
                                      startIcon={<Quiz />}
                                      fullWidth
                                    >
                                      Take Assessment
                                    </Button>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                            
                            {week.assignment && (
                              <Grid item xs={12} md={6}>
                                <Card variant="outlined">
                                  <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <Assignment color="info" />
                                      <Typography variant="subtitle2">Assignment</Typography>
                                    </Box>
                                    <Typography variant="body2" color="text.secondary" paragraph>
                                      Submit your assignment for this week
                                    </Typography>
                                    <Button 
                                      variant="contained" 
                                      color="info" 
                                      startIcon={<Assignment />}
                                      fullWidth
                                    >
                                      Submit Assignment
                                    </Button>
                                  </CardContent>
                                </Card>
                              </Grid>
                            )}
                          </Grid>
                        </Box>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Floating Action Button for Quick Actions */}
      <Fab 
        color="primary" 
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => navigate(`/dashboard/student/courses/${courseId}`)}
      >
        <School />
      </Fab>
    </Container>
  );
};

export default StudentCourseView;
